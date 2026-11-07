const RAW_SYMBOL = Symbol.for('raw_firestore_reference');

function getRefDetails(ref: any): { key: string; isQuery: boolean; colPath: string; docPath?: string } {
  if (!ref) return { key: '', isQuery: false, colPath: '' };

  let raw = ref;
  if (typeof ref === 'object' && ref !== null) {
    if (Reflect.has(ref, RAW_SYMBOL)) {
      raw = (ref as any)[RAW_SYMBOL];
    } else if ('_raw' in ref) {
      raw = (ref as any)._raw;
    }
  }

  const path: string = raw?.path ?? (typeof raw === 'string' ? raw : String(raw || ''));
  const segments = path.split('/').filter(Boolean);
  const isDoc = segments.length > 0 && segments.length % 2 === 0;

  if (isDoc) {
    const colPath = segments.slice(0, -1).join('/');
    return { key: `doc:${path}`, isQuery: false, colPath, docPath: path };
  } else {
    return { key: `query:${path}`, isQuery: true, colPath: path };
  }
}

/**
 * Transaction-scoped read memoizer.
 * Retains safely verified point document-read memoization exclusively.
 * Queries pass through directly without caching.
 * Caching is bounded strictly to a single transaction attempt, with raw transaction proxy memoization
 * and strict read-after-write invalidation.
 */
export function withTxCache(tx: any): any {
  if (!tx || typeof tx !== 'object') return tx;
  if (tx.__isCachedTx) return tx;
  if (tx.__cachedTxProxy) return tx.__cachedTxProxy;

  const cache = new Map<string, Promise<any>>();
  let hasWritten = false;

  const proxy = new Proxy(tx, {
    get(target, prop, receiver) {
      if (prop === '__isCachedTx') return true;
      if (prop === '__cacheMap') return cache;
      if (prop === '__hasWritten') return () => hasWritten;

      if (prop === 'get') {
        return (ref: any) => {
          if (!ref) return target.get(ref);
          if (hasWritten) {
            return target.get(ref);
          }

          const { key, isQuery } = getRefDetails(ref);
          if (!key || isQuery) {
            return target.get(ref);
          }

          if (cache.has(key)) {
            return cache.get(key)!;
          }

          const promise = Promise.resolve().then(() => target.get(ref)).catch((err) => {
            cache.delete(key);
            throw err;
          });

          cache.set(key, promise);
          return promise;
        };
      }

      if (prop === 'set' || prop === 'update' || prop === 'delete' || prop === 'create') {
        return (ref: any, ...args: any[]) => {
          hasWritten = true;
          cache.clear();
          return target[prop](ref, ...args);
        };
      }

      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    }
  });

  tx.__cachedTxProxy = proxy;
  return proxy;
}
