/** Run existing Admin persistence against ONE transaction. All writes are buffered
 * until domain services finish reading/validating; no nested transaction commits. */
export function tripTransactionDatabase(database: any, transaction: any) {
  const originals = new WeakMap<object, any>();
  const reads = new Map<string, any>();
  const writes = new Map<string, { ref: any; value: any; method: 'set' | 'update'; options?: any }>();
  const raw = (ref: any) => originals.get(ref) || ref;
  const stage = (ref: any, value: any, method: 'set' | 'update', options?: any) => {
    ref = raw(ref);
    const previous = writes.get(ref.path);
    writes.set(ref.path, { ref, value: { ...(previous?.value || {}), ...value }, method: previous?.method || method, options });
  };
  const read = async (reference: any) => {
    const ref = raw(reference), pending = writes.get(ref.path);
    if (pending?.method === 'set' && !pending.options?.merge) return { id: ref.id, exists: true, data: () => ({ ...pending.value }) };
    const key = typeof ref.where === 'function' ? ref : (ref.path || ref);
    if (!reads.has(key)) reads.set(key, await transaction.get(ref));
    const snapshot = reads.get(key);
    if (!pending) return snapshot;
    return { id: ref.id, exists: snapshot.exists, data: () => ({ ...snapshot.data(), ...pending.value }) };
  };
  const wrap = (reference: any): any => {
    const proxy = new Proxy(reference, { get(target, key) {
      if (key === 'get') return () => read(target);
      if (key === 'set' || key === 'update') return (value: any, options?: any) => stage(target, value, key, options);
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      return (...args: any[]) => {
        const result = value.apply(target, args);
        return ['collection', 'doc', 'where', 'limit', 'orderBy'].includes(String(key)) ? wrap(result) : result;
      };
    } });
    originals.set(proxy, reference); return proxy;
  };
  const db = {
    collection: (name: string) => wrap(database.collection(name)),
    runTransaction: (callback: Function) => callback({ get: read, set: (ref: any, data: any, options?: any) => stage(ref, data, 'set', options), update: (ref: any, data: any) => stage(ref, data, 'update') }),
  };
  return { db, flush: () => { for (const write of writes.values()) transaction[write.method](write.ref, write.value, ...(write.options ? [write.options] : [])); } };
}
