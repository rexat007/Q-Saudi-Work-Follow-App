/**
 * IndexedDB Core Service for Offline-First PWA Architecture.
 * Manages local persistence for master data caches, metadata timestamps, outbox queue, and offline trips.
 */

import { OutboxOperation, CacheStoreName, CacheStoreMetadata } from '../../types/offline';
import { ConflictRecord } from '../../types/conflict';

const DB_NAME = 'q_saudi_logistics_offline_db';
export const OFFLINE_DB_VERSION = 4;
const DB_VERSION = OFFLINE_DB_VERSION;

export class IndexedDBService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryStore = new Map<string, Map<string, any>>();
  private principalProvider:()=>string|null=()=>null;
  public setPrincipalProvider(provider:()=>string|null){this.principalProvider=provider;}
  public isCurrentPrincipal(principal:string){const p=this.principalProvider();return p?p===principal:!this.isSupported();}
  private cachePrincipal(){const p=this.principalProvider();if(p)return p;if(!this.isSupported())return '@memory';throw Error('CACHE_SCOPE_REQUIRED');}
  private tripEnvelope(value:any,principal:string){if(!value?.projectId||!value?.tripId)throw Error('CACHE_SCOPE_REQUIRED');return {key:JSON.stringify([principal,value.projectId,value.tripId]),principal,projectId:value.projectId,tripId:value.tripId,value};}
  private async scopedTrips():Promise<any[]>{
    const principal=this.cachePrincipal();let rows:any[];
    if(!this.isSupported())rows=[...this.getMemoryStore('legacyScopedTrips').values()].filter(r=>r.principal===principal);
    else{const db=await this.getDB();rows=await new Promise<any[]>((resolve,reject)=>{const tx=db.transaction('legacyScopedTrips','readonly'),request=tx.objectStore('legacyScopedTrips').index('principal').getAll(principal);let result:any[]=[];request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});}
    if(this.cachePrincipal()!==principal)throw Error('CACHE_SCOPE_CHANGED');
    for(const row of rows){if(row.principal!==principal||row.value?.projectId!==row.projectId||row.value?.tripId!==row.tripId)throw Error('CACHE_SCOPE_MISMATCH');this.getMemoryStore('legacyScopedTrips').set(row.key,row);}
    return rows;
  }
  private async putScopedTrips(items:any[],expectedPrincipal?:string){
    const principal=this.cachePrincipal(),rows=items.map(value=>this.tripEnvelope(value,principal));
    if(expectedPrincipal&&principal!==expectedPrincipal)throw Error('CACHE_SCOPE_CHANGED');
    if(this.isSupported()){const db=await this.getDB();if(this.cachePrincipal()!==principal)throw Error('CACHE_SCOPE_CHANGED');await new Promise<void>((resolve,reject)=>{const tx=db.transaction('legacyScopedTrips','readwrite');for(const row of rows)tx.objectStore('legacyScopedTrips').put(row);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});}
    for(const row of rows)this.getMemoryStore('legacyScopedTrips').set(row.key,row);
    if(this.cachePrincipal()!==principal)throw Error('CACHE_SCOPE_CHANGED');
  }

  private isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private getItemKey(storeName: string, item: any): string {
    if (!item) return '';
    if (storeName === 'projects') return item.projectId;
    if (storeName === 'carriers') return item.carrierId;
    if (storeName === 'materials') return item.materialId;
    if (storeName === 'trucks') return item.truckId;
    if (storeName === 'drivers') return item.driverId;
    if (storeName === 'pricingRules') return item.pricingRuleId;
    if (storeName === 'trips') return item.tripId || item.id;
    if (storeName === 'outbox') return item.operationId;
    if (storeName === 'metadata') return item.storeName;
    if (storeName === 'conflicts') return item.conflictId;
    return item.id || item.key || JSON.stringify(item);
  }

  private getMemoryStore(storeName: string): Map<string, any> {
    let s = this.memoryStore.get(storeName);
    if (!s) {
      s = new Map<string, any>();
      this.memoryStore.set(storeName, s);
    }
    return s;
  }

  /**
   * Initializes and opens the IndexedDB database instance with all required object stores and indexes.
   */
  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (!this.isSupported()) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if(!db.objectStoreNames.contains('legacyScopedTrips')){const store=db.createObjectStore('legacyScopedTrips',{keyPath:'key'});store.createIndex('principal','principal',{unique:false});}

        // Additive U07 stores. Never reinterpret or delete legacy records.
        for (const name of ['sqlCommands','sqlCache','sqlControl']) {
          if (!db.objectStoreNames.contains(name)) {
            const store=db.createObjectStore(name,{keyPath:'key'});
            if(name!=='sqlControl')store.createIndex('scope','scope',{unique:false});
            if(name!=='sqlControl')store.createIndex('principal','principal',{unique:false});
            if(name==='sqlCommands'){store.createIndex('owner','owner',{unique:false});store.createIndex('scopeStatus',['scope','status'],{unique:false});}
          }
        }
        // 1. Projects store
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'projectId' });
        }

        // 2. Carriers store
        if (!db.objectStoreNames.contains('carriers')) {
          const carrierStore = db.createObjectStore('carriers', { keyPath: 'carrierId' });
          carrierStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // 3. Materials store
        if (!db.objectStoreNames.contains('materials')) {
          const matStore = db.createObjectStore('materials', { keyPath: 'materialId' });
          matStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // 4. Trucks store
        if (!db.objectStoreNames.contains('trucks')) {
          const truckStore = db.createObjectStore('trucks', { keyPath: 'truckId' });
          truckStore.createIndex('carrierId', 'carrierId', { unique: false });
          truckStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // 5. Drivers store
        if (!db.objectStoreNames.contains('drivers')) {
          const driverStore = db.createObjectStore('drivers', { keyPath: 'driverId' });
          driverStore.createIndex('carrierId', 'carrierId', { unique: false });
          driverStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // 6. Pricing Rules store
        if (!db.objectStoreNames.contains('pricingRules')) {
          const pricingStore = db.createObjectStore('pricingRules', { keyPath: 'pricingRuleId' });
          pricingStore.createIndex('projectId', 'projectId', { unique: false });
          pricingStore.createIndex('carrierId', 'carrierId', { unique: false });
          pricingStore.createIndex('materialId', 'materialId', { unique: false });
        }

        // 7. Trips store (local offline trips)
        if (!db.objectStoreNames.contains('trips')) {
          const tripStore = db.createObjectStore('trips', { keyPath: 'tripId' });
          tripStore.createIndex('projectId', 'projectId', { unique: false });
          tripStore.createIndex('status', 'status', { unique: false });
        }

        // 8. Outbox store (sync operations queue)
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'operationId' });
          outboxStore.createIndex('status', 'status', { unique: false });
          outboxStore.createIndex('projectId', 'projectId', { unique: false });
          outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 9. Metadata store for version and timestamp tracking
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'storeName' });
        }

        // 10. Conflicts store for explicit conflict records and resolutions
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'conflictId' });
          conflictStore.createIndex('status', 'status', { unique: false });
          conflictStore.createIndex('conflictType', 'conflictType', { unique: false });
          conflictStore.createIndex('operationId', 'operationId', { unique: false });
          conflictStore.createIndex('projectId', 'projectId', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db=request.result;
        db.onversionchange=()=>{db.close();this.dbPromise=null;};
        resolve(db);
      };
      request.onblocked=()=>{this.dbPromise=null;reject(new Error('INDEXEDDB_UPGRADE_BLOCKED'));};

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.dbPromise;
  }

  // ---------------- Generic CRUD Operations ---------------- //

  public async getAll<T>(storeName: string): Promise<T[]> {
    if(storeName==='trips')return (await this.scopedTrips()).map(r=>r.value) as T[];
    if (!this.isSupported()) {
      return Array.from(this.getMemoryStore(storeName).values()) as T[];
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  public async getById<T>(storeName: string, key: string, projectId?:string): Promise<T | undefined> {
    if(storeName==='trips'){const rows=(await this.scopedTrips()).filter(r=>r.tripId===key&&(!projectId||r.projectId===projectId));if(rows.length>1)throw Error('CACHE_PROJECT_REQUIRED');return rows[0]?.value;}
    const memVal = this.getMemoryStore(storeName).get(key) as T | undefined;
    if (!this.isSupported()) {
      return memVal;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as T | undefined;
        if (result !== undefined) {
          const k = this.getItemKey(storeName, result);
          this.getMemoryStore(storeName).set(k, result);
        }
        if(['outbox','legacyScopedTrips'].includes(storeName)&&result===undefined)this.getMemoryStore(storeName).delete(key);
        resolve(['outbox','legacyScopedTrips'].includes(storeName)?result:result !== undefined ? result : memVal);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public getSync<T>(storeName: string, key: string, projectId?:string): T | undefined {
    if(storeName==='trips'){const principal=this.cachePrincipal(),rows=[...this.getMemoryStore('legacyScopedTrips').values()].filter(r=>r.principal===principal&&r.tripId===key&&(!projectId||r.projectId===projectId));if(rows.length>1)throw Error('CACHE_PROJECT_REQUIRED');return rows[0]?.value;}
    return this.getMemoryStore(storeName).get(key) as T | undefined;
  }

  public getAllSync<T>(storeName: string): T[] {
    if(storeName==='trips'){const principal=this.cachePrincipal();return [...this.getMemoryStore('legacyScopedTrips').values()].filter(r=>r.principal===principal).map(r=>r.value);}
    return Array.from(this.getMemoryStore(storeName).values()) as T[];
  }

  public async put<T>(storeName: string, value: T,expectedPrincipal?:string): Promise<void> {
    if(storeName==='trips')return this.putScopedTrips([value],expectedPrincipal);
    const k = this.getItemKey(storeName, value);

    if (!this.isSupported()) {
      this.getMemoryStore(storeName).set(k,value);
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      transaction.oncomplete = () => {this.getMemoryStore(storeName).set(k,value);resolve();};
      transaction.onabort=()=>reject(transaction.error||new Error('INDEXEDDB_WRITE_ABORTED'));
      request.onerror = () => reject(request.error);
    });
  }

  public async putMany<T>(storeName: string, items: T[],expectedPrincipal?:string): Promise<void> {
    if(storeName==='trips')return this.putScopedTrips(items,expectedPrincipal);
    const s = this.getMemoryStore(storeName);

    if (!this.isSupported()) {
      items.forEach(item=>s.set(this.getItemKey(storeName,item),item));
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => {items.forEach(item=>s.set(this.getItemKey(storeName,item),item));resolve();};
      transaction.onabort=()=>reject(transaction.error||new Error('INDEXEDDB_WRITE_ABORTED'));
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async delete(storeName: string, key: string, projectId?:string,expectedPrincipal?:string): Promise<void> {
    if(storeName==='trips'){const principal=this.cachePrincipal();if(expectedPrincipal&&principal!==expectedPrincipal)throw Error('CACHE_SCOPE_CHANGED');const rows=(await this.scopedTrips()).filter(r=>r.tripId===key&&(!projectId||r.projectId===projectId));if(rows.length>1)throw Error('CACHE_PROJECT_REQUIRED');if(!rows.length)return;await this.delete('legacyScopedTrips',rows[0].key);if(this.cachePrincipal()!==principal)throw Error('CACHE_SCOPE_CHANGED');return;}

    if (!this.isSupported()) {
      this.getMemoryStore(storeName).delete(key);
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      transaction.oncomplete = () => {this.getMemoryStore(storeName).delete(key);resolve();};
      transaction.onabort=()=>reject(transaction.error||new Error('INDEXEDDB_WRITE_ABORTED'));
      request.onerror = () => reject(request.error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    if(storeName==='trips'){const rows=await this.scopedTrips();for(const row of rows)await this.delete('legacyScopedTrips',row.key);return;}
    this.getMemoryStore(storeName).clear();

    if (!this.isSupported()) {
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async count(storeName: string): Promise<number> {
    if(storeName==='trips')return (await this.scopedTrips()).length;
    if (!this.isSupported()) {
      return this.getMemoryStore(storeName).size;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------- Cache Metadata Operations ---------------- //

  public async getMetadata(storeName: CacheStoreName): Promise<CacheStoreMetadata | undefined> {
    return this.getById<CacheStoreMetadata>('metadata', storeName);
  }

  public async getAllMetadata(): Promise<CacheStoreMetadata[]> {
    return this.getAll<CacheStoreMetadata>('metadata');
  }

  public async setMetadata(meta: CacheStoreMetadata): Promise<void> {
    return this.put<CacheStoreMetadata>('metadata', meta);
  }

  // ---------------- Outbox Specific Operations ---------------- //

  public async getOutboxOperations(): Promise<OutboxOperation[]> {
    const ops = await this.getAll<OutboxOperation>('outbox');
    // Sort descending by createdAt
    return ops.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async saveOutboxOperation(op: OutboxOperation): Promise<void> {
    return this.put<OutboxOperation>('outbox', op);
  }
  /** Atomic logical-identity reservation; retries cannot overwrite an ACK or
   * another tab's frozen intent. No store/schema conversion is involved. */
  public async insertOutboxOperation(op:OutboxOperation):Promise<OutboxOperation>{
    const identity=(v:OutboxOperation)=>JSON.stringify([v.projectId,v.userId,v.operationType,v.payload,v.dependsOnOperationId??null]);
    const check=(old:OutboxOperation|undefined)=>{if(old&&identity(old)!==identity(op))throw Error('OUTBOX_OPERATION_CONFLICT');return old||structuredClone(op);};
    if(!this.isSupported()){const result=check(this.getMemoryStore('outbox').get(op.operationId));this.getMemoryStore('outbox').set(op.operationId,result);return structuredClone(result);}
    const db=await this.getDB();return new Promise((resolve,reject)=>{
      const tx=db.transaction('outbox','readwrite'),store=tx.objectStore('outbox'),request=store.get(op.operationId);let result:OutboxOperation,error:unknown;
      request.onsuccess=()=>{try{result=check(request.result);if(!request.result)store.add(result);}catch(e){error=e;tx.abort();}};
      tx.oncomplete=()=>{this.getMemoryStore('outbox').set(op.operationId,result);resolve(structuredClone(result));};
      tx.onabort=()=>reject(error||tx.error||Error('INDEXEDDB_WRITE_ABORTED'));tx.onerror=()=>reject(error||tx.error);
    });
  }

  public async updateOutboxStatus(
    operationId: string, 
    status: OutboxOperation['status'], 
    extra?: Partial<OutboxOperation>
  ): Promise<void> {
    const update=(existing:OutboxOperation|undefined)=>{
      if(!existing)return undefined;
      if(!this.isCurrentPrincipal(existing.userId))throw Error('AUTH_CONTEXT_CHANGED');
      // Another tab's confirmed receipt cannot be downgraded by a stale worker.
      if(existing.status==='SYNCED')return existing;
      return {...existing,...extra,status,operationId:existing.operationId,projectId:existing.projectId,userId:existing.userId};
    };
    if(!this.isSupported()){
      const next=update(this.getMemoryStore('outbox').get(operationId));
      if(next)this.getMemoryStore('outbox').set(operationId,next);return;
    }
    const db=await this.getDB();
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('outbox','readwrite'),store=tx.objectStore('outbox'),request=store.get(operationId);
      let result:OutboxOperation|undefined,error:unknown;
      request.onsuccess=()=>{try{result=update(request.result);if(result)store.put(result);}catch(e){error=e;tx.abort();}};
      tx.oncomplete=()=>{if(result)this.getMemoryStore('outbox').set(operationId,result);resolve();};
      tx.onabort=()=>reject(error||tx.error||Error('INDEXEDDB_WRITE_ABORTED'));tx.onerror=()=>reject(error||tx.error);
    });
  }

  // ---------------- Conflicts Storage Operations ---------------- //

  public async getConflictRecords(): Promise<ConflictRecord[]> {
    try {
      const records = await this.getAll<ConflictRecord>('conflicts');
      return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  public async getConflictRecordById(conflictId: string): Promise<ConflictRecord | undefined> {
    try {
      return this.getById<ConflictRecord>('conflicts', conflictId);
    } catch {
      return undefined;
    }
  }

  public async saveConflictRecord(conflict: ConflictRecord): Promise<void> {
    try {
      return this.put<ConflictRecord>('conflicts', conflict);
    } catch (err) {
      console.warn('Failed to save conflict record into IndexedDB:', err);
    }
  }

  public async updateConflictRecord(
    conflictId: string, 
    updates: Partial<ConflictRecord>
  ): Promise<void> {
    try {
      const existing = await this.getConflictRecordById(conflictId);
      if (!existing) return;
      const updated: ConflictRecord = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.put<ConflictRecord>('conflicts', updated);
    } catch (err) {
      console.warn('Failed to update conflict record in IndexedDB:', err);
    }
  }
}

export const indexedDBService = new IndexedDBService();
