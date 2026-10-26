import { describe, expect, it, vi } from 'vitest';
import { SetupMutationSession, setupCommand } from '../services/setupOrchestration.service';
import { ProjectContextLifetime } from '../utils/projectContextLifetime';
import { setupErrorKey } from '../i18n/setupErrors';
import { dictionaries } from '../locales';
vi.mock('../firebase/config', () => ({ auth: { currentUser: { getIdToken: async () => 'token' } }, db: {} }));
const snapshot = { materials: [], carriers: [], fleetRows: [], relationshipContext: {} } as any;
describe('P6-B1 command receipts and scope', () => {
  it('retains command success after refresh failure and retries only the canonical read', async () => {
    const session = new SetupMutationSession(), command = vi.fn().mockResolvedValue({ driverId: 'D1' }), apply = vi.fn();
    const refresh = vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue(snapshot);
    await expect(session.run('P1', command, () => true, apply, refresh)).rejects.toThrow('offline');
    expect(session.committed).toBe(true); expect(apply).not.toHaveBeenCalled();
    expect(await session.run('P1', command, () => true, apply, refresh)).toBe(true);
    expect(command).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(2); expect(apply).toHaveBeenCalledExactlyOnceWith(snapshot);
  });
  it('blocks duplicate submit while a command is in flight', async () => {
    let finish!: (x: unknown) => void; const pending = new Promise(resolve => finish = resolve);
    const command = vi.fn(() => pending), session = new SetupMutationSession();
    const first = session.run('P1', command, () => true, vi.fn(), async () => snapshot);
    expect(await session.run('P1', command, () => true, vi.fn(), async () => snapshot)).toBe(false);
    finish({}); await first; expect(command).toHaveBeenCalledTimes(1);
  });
  it.each(['command', 'refresh'])('late %s completion from A cannot apply to B', async phase => {
    const life = new ProjectContextLifetime(); life.enter('A', 'owner'); const token = life.capture();
    let finish!: (x: any) => void; const pending = new Promise<any>(resolve => finish = resolve), apply = vi.fn();
    const command = phase === 'command' ? () => pending : async () => ({});
    const refresh = phase === 'refresh' ? () => pending : vi.fn(async () => snapshot);
    const running = new SetupMutationSession().run('A', command, () => life.isCurrent(token), apply, refresh);
    await Promise.resolve(); life.enter('B', 'owner'); finish(snapshot); await running; expect(apply).not.toHaveBeenCalled();
  });
  it('does not mistake a failed command for a saved receipt', async () => {
    const session = new SetupMutationSession(), refresh = vi.fn();
    await expect(session.run('P1', async () => { throw Error('denied'); }, () => true, vi.fn(), refresh)).rejects.toThrow('denied');
    expect(session.committed).toBe(false); expect(refresh).not.toHaveBeenCalled(); expect(session.busy).toBe(false);
  });
  it('preserves server code and HTTP status without treating failure as success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 409, json: async () => ({ code: 'MEMBERSHIP_STATE_CONFLICT', error: 'technical details' }) })));
    try { await expect(setupCommand('P1', 'membership-commands', {})).rejects.toMatchObject({ code: 'MEMBERSHIP_STATE_CONFLICT', status: 409, message: 'technical details' }); }
    finally { vi.unstubAllGlobals(); }
  });
});
describe('P6-B1 bounded i18n error contract', () => {
  it('all new Setup presentation keys have AR/EN/UR parity and non-empty values', () => {
    const keys = Object.keys(dictionaries.en).filter(key => key.startsWith('setup.')).sort();
    expect(keys).toHaveLength(70);
    for (const dictionary of Object.values(dictionaries)) {
      expect(Object.keys(dictionary).filter(key => key.startsWith('setup.')).sort()).toEqual(keys);
      for (const key of keys) expect(dictionary[key].trim().length).toBeGreaterThan(0);
    }
  });
  it.each(['GLOBAL_ENTITY_INELIGIBLE', 'MEMBERSHIP_STATE_CONFLICT', 'P5_B3_RELATIONSHIP_DEPENDENCY', 'CARRIER_MISMATCH', 'ASSIGNMENT_STATE_CONFLICT', 'ASSIGNMENT_POINTER_INTEGRITY_ERROR', 'ALLOCATION_STATE_CONFLICT', 'ALLOCATION_POINTER_CORRUPTION', 'FORBIDDEN_PROJECT_ACCESS'])('%s resolves in AR/EN/UR', code => {
    const key = setupErrorKey({ code });
    for (const locale of ['ar', 'en', 'ur'] as const) expect(dictionaries[locale][key]?.trim().length).toBeGreaterThan(8);
  });
  it('never presents an unknown stack, path or Firebase message', () => {
    expect(setupErrorKey({ code: 'Firestore:/private/path' })).toBe('setup.errors.failed');
    for (const dictionary of Object.values(dictionaries)) expect(dictionary['setup.errors.failed']).not.toContain('/private/path');
  });
});
