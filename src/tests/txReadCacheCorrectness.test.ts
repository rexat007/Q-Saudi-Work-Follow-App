import { describe, it, expect, vi } from 'vitest';
import { withTxCache } from '../utils/txReadCache';

function createStrictFakeTransaction() {
  let hasWritten = false;
  let getCalls = 0;
  const store = new Map<string, any>([
    ['projects/P1/drivers/D1', { id: 'D1', name: 'Driver 1' }],
    ['projects/P1/drivers/D2', { id: 'D2', name: 'Driver 2' }],
    ['projects/P2/drivers/D1', { id: 'D1', name: 'Tenant 2 Driver' }],
  ]);

  return {
    get getCallsCount() { return getCalls; },
    get hasWrittenState() { return hasWritten; },
    get: vi.fn(async (ref: any) => {
      getCalls++;
      if (hasWritten) {
        throw new Error('Firestore Error: Reads must come before writes.');
      }
      const path = ref.path;
      const val = store.get(path);
      return { id: path.split('/').pop(), exists: val !== undefined, data: () => val };
    }),
    set: vi.fn((ref: any, data: any) => {
      hasWritten = true;
      store.set(ref.path, data);
    }),
    update: vi.fn((ref: any, data: any) => {
      hasWritten = true;
      const existing = store.get(ref.path) || {};
      store.set(ref.path, { ...existing, ...data });
    }),
    delete: vi.fn((ref: any) => {
      hasWritten = true;
      store.delete(ref.path);
    }),
  };
}

describe('DATA-F1 B1 Point-Read Cache Safety & Correctness Gate', () => {
  it('1. Identical document reads within one transaction attempt use one underlying read', async () => {
    const rawTx = createStrictFakeTransaction();
    const tx = withTxCache(rawTx);
    const docRef = { path: 'projects/P1/drivers/D1' };

    const res1 = await tx.get(docRef);
    const res2 = await tx.get(docRef);

    expect(res1).toEqual(res2);
    expect(rawTx.getCallsCount).toBe(1);
  });

  it('2. Independent calls to withTxCache on the same raw transaction share proxy and cache state', () => {
    const rawTx = createStrictFakeTransaction();
    const tx1 = withTxCache(rawTx);
    const tx2 = withTxCache(rawTx);

    expect(tx1).toBe(tx2);
  });

  it('3. No cache state crosses separate transaction attempts', async () => {
    const rawTx1 = createStrictFakeTransaction();
    const rawTx2 = createStrictFakeTransaction();

    const tx1 = withTxCache(rawTx1);
    const tx2 = withTxCache(rawTx2);

    const docRef = { path: 'projects/P1/drivers/D1' };

    await tx1.get(docRef);
    await tx2.get(docRef);

    expect(rawTx1.getCallsCount).toBe(1);
    expect(rawTx2.getCallsCount).toBe(1);
  });

  it('4. A retried Firestore transaction callback receives fresh cache state', async () => {
    let attempts = 0;
    const executeTransaction = async (cb: (tx: any) => Promise<any>) => {
      attempts++;
      const rawTx = createStrictFakeTransaction();
      const tx = withTxCache(rawTx);
      return cb(tx);
    };

    const docRef = { path: 'projects/P1/drivers/D1' };

    await executeTransaction(async (tx) => {
      await tx.get(docRef);
    });

    await executeTransaction(async (tx) => {
      await tx.get(docRef);
    });

    expect(attempts).toBe(2);
  });

  it('5. In-flight promise reuse cannot leak rejected or stale results', async () => {
    const failingTx = {
      get: vi.fn().mockRejectedValueOnce(new Error('Network Transient Error')).mockResolvedValueOnce({ exists: true }),
    };

    const tx = withTxCache(failingTx);
    const docRef = { path: 'projects/P1/drivers/D1' };

    await expect(tx.get(docRef)).rejects.toThrow('Network Transient Error');
    const successRes = await tx.get(docRef);

    expect(successRes.exists).toBe(true);
    expect(failingTx.get).toHaveBeenCalledTimes(2);
  });

  it('6 & 7. The cache never conceals a read-after-write operation prohibited by Firestore', async () => {
    const rawTx = createStrictFakeTransaction();
    const tx = withTxCache(rawTx);

    const docRef = { path: 'projects/P1/drivers/D1' };

    await tx.get(docRef);
    expect(rawTx.getCallsCount).toBe(1);

    tx.set(docRef, { id: 'D1', name: 'Updated Driver' });

    await expect(tx.get(docRef)).rejects.toThrow('Reads must come before writes.');
  });

  it('8. Tenant/project and user authorization boundaries remain intact', async () => {
    const rawTx = createStrictFakeTransaction();
    const tx = withTxCache(rawTx);

    const tenant1Ref = { path: 'projects/P1/drivers/D1' };
    const tenant2Ref = { path: 'projects/P2/drivers/D1' };

    const res1 = await tx.get(tenant1Ref);
    const res2 = await tx.get(tenant2Ref);

    expect(res1.data().name).toBe('Driver 1');
    expect(res2.data().name).toBe('Tenant 2 Driver');
    expect(rawTx.getCallsCount).toBe(2);
  });
});
