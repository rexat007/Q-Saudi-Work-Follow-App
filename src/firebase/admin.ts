import { readFileSync } from 'fs';
import { join } from 'path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (err) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON. Initializing with default app credentials.', err);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

// Resolve the Firestore Database ID used by the client
let firestoreDatabaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID;

if (!firestoreDatabaseId) {
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    firestoreDatabaseId = config.firestoreDatabaseId;
  } catch (err) {
    console.warn('Could not read firebase-applet-config.json for firestoreDatabaseId, using fallback:', err);
  }
}

if (!firestoreDatabaseId) {
  firestoreDatabaseId = 'ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1';
}

const inMemoryStore: Record<string, any> = {};

function createMockDocRef(paths: string[]): any {
  const pathKey = paths.join('/');
  return {
    id: paths[paths.length - 1],
    path: pathKey,
    get: async () => {
      const val = inMemoryStore[pathKey];
      return {
        id: paths[paths.length - 1],
        exists: val !== undefined,
        data: () => val,
      };
    },
    set: async (data: any) => {
      inMemoryStore[pathKey] = data;
    },
    update: async (data: any) => {
      inMemoryStore[pathKey] = {
        ...inMemoryStore[pathKey],
        ...data,
      };
    },
    delete: async () => {
      delete inMemoryStore[pathKey];
    },
    collection: (col: string) => createMockCollectionRef([...paths, col]),
  };
}

function createMockCollectionRef(paths: string[]): any {
  const colPath = paths.join('/');
  return {
    doc: (id?: string) => {
      const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return createMockDocRef([...paths, docId]);
    },
    limit: (n: number) => {
      return {
        get: async () => {
          const res = await createMockCollectionRef(paths).get();
          return {
            empty: res.empty,
            size: Math.min(res.size, n),
            docs: res.docs.slice(0, n)
          };
        }
      };
    },
    where: (field: string, op: string, value: any) => {
      return {
        _isQuery: true,
        col: colPath,
        field,
        op,
        value,
      };
    },
    get: async () => {
      const results: any[] = [];
      const prefix = `${colPath}/`;
      for (const [key, val] of Object.entries(inMemoryStore)) {
        if (key.startsWith(prefix)) {
          const relativeKey = key.slice(prefix.length);
          if (!relativeKey.includes('/')) {
            results.push({
              id: relativeKey,
              data: () => val,
            });
          }
        }
      }
      return {
        size: results.length,
        docs: results,
        empty: results.length === 0,
      };
    }
  };
}

export const createInMemoryAdminDb = (initialStore?: Record<string, any>) => {
  if (initialStore) {
    Object.assign(inMemoryStore, initialStore);
  }
  let transactionQueue = Promise.resolve();
  return {
    collection: (col: string) => createMockCollectionRef([col]),
    runTransaction: async (cb: any) => {
      const resultPromise = transactionQueue.then(async () => {
        const tx = {
          get: async (ref: any) => {
            if (ref && ref._isQuery) {
              const results: any[] = [];
              const prefix = `${ref.col}/`;
              for (const [key, val] of Object.entries(inMemoryStore)) {
                if (key.startsWith(prefix)) {
                  const relativeKey = key.slice(prefix.length);
                  if (!relativeKey.includes('/')) {
                    if (val && val[ref.field] === ref.value) {
                      results.push({
                        id: relativeKey,
                        data: () => val,
                      });
                    }
                  }
                }
              }
              return {
                size: results.length,
                docs: results,
              };
            }
            return ref.get();
          },
          set: (ref: any, data: any) => ref.set(data),
          update: (ref: any, data: any) => ref.update(data),
          delete: (ref: any) => ref.delete(),
        };
        return cb(tx);
      });
      transactionQueue = resultPromise.then(() => {}, () => {});
      return resultPromise;
    },
  };
};

export const inMemoryAdminStore = inMemoryStore;

export let adminAuth = getAuth();
export let adminDb: any = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? getFirestore(firestoreDatabaseId)
  : createInMemoryAdminDb();

export const setTestAuthOverride = (override: any) => {
  adminAuth = override;
};

export const setTestDbOverride = (override: any) => {
  adminDb = override;
};

export const getResolvedDatabaseId = () => {
  return firestoreDatabaseId;
};
