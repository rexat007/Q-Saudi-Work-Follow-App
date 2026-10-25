import { FieldValue } from 'firebase-admin/firestore';
/** Staged, serialized transaction model. This is NOT a Firestore emulator. */
export function commandDatabase(initial: Record<string, any>) {
  const store = structuredClone(initial); let queue = Promise.resolve(); let failPath = '';
  const reference = (path: string, filters: [string, any][] = [], limit = Infinity): any => ({
    path, max: limit, id: path.split('/').at(-1), filters,
    collection: (name: string) => reference(`${path}/${name}`), doc: (id: string) => reference(`${path}/${id}`),
    where: (field: string, _op: string, value: any) => reference(path, [...filters, [field, value]], limit),
    limit: (count: number) => reference(path, filters, count),
    get: async () => snapshot({ path, filters, max: limit }),
  });
  const snapshot = (ref: any): any => {
    // Document paths have an even segment count; query paths are collections.
    if (ref.path.split('/').length % 2 === 0) return { id: ref.id || ref.path.split('/').at(-1), exists: ref.path in store, data: () => structuredClone(store[ref.path]) };
    const docs = Object.entries(store).filter(([key, value]) => key.startsWith(ref.path + '/') && !key.slice(ref.path.length + 1).includes('/') && ref.filters.every(([field, expected]: any) => value[field] === expected)).slice(0, ref.max || Infinity).map(([key, value]) => ({ id: key.split('/').at(-1), exists: true, data: () => structuredClone(value) }));
    return { docs, empty: docs.length === 0 };
  };
  const apply = (path: string, data: any, merge: boolean) => {
    const next = merge ? { ...store[path] } : {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof (value as any).isEqual === 'function' && (value as any).isEqual(FieldValue.delete())) delete next[key];
      else next[key] = structuredClone(value);
    }
    store[path] = next;
  };
  const db = { collection: (name: string) => reference(name), runTransaction: (callback: Function) => {
    const run = queue.then(async () => {
      const pending: (() => void)[] = []; let writing = false;
      const write = (ref: any, data: any, merge: boolean) => {
        writing = true; if (failPath && ref.path.includes(failPath)) throw Error('simulated write failure');
        pending.push(() => apply(ref.path, data, merge));
      };
      const result = await callback({
        get: async (ref: any) => { if (writing) throw Error('read after write'); return snapshot(ref); },
        set: (ref: any, data: any, options?: any) => write(ref, data, Boolean(options?.merge)),
        update: (ref: any, data: any) => write(ref, data, true),
        delete: (ref: any) => { writing = true; if (failPath && ref.path.includes(failPath)) throw Error('simulated write failure'); pending.push(() => { delete store[ref.path]; }); },
      });
      pending.forEach(commit => commit()); return result;
    }); queue = run.then(() => {}, () => {}); return run;
  } };
  return { db, store, failWrites: (path: string) => { failPath = path; } };
}
export const accountProfile = (role = 'SUPER_ADMIN', linkedDriverId?: string) => ({ userId: 'actor', fullName: 'Actor', email: 'actor@example.invalid', role, assignedProjectIds: ['P1'], status: 'ACTIVE', isActive: true, ...(linkedDriverId ? { linkedDriverId } : {}) });
