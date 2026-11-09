import {IndexedDBService} from './indexedDB.service';
/** Bounded scan, metadata only; never converts an operation or allocates a SQL UUID. */
export async function legacyJournalPage(principal:string,projectId:string,current:()=>string|null,after?:string,database=new IndexedDBService()){
 if(!principal||current()!==principal)throw Error('OFFLINE_SCOPE_CHANGED');const db=await database.getDB();
 return new Promise<{items:Array<{operationId:string;status:string;classification:'LEGACY_REVIEW_REQUIRED'}>;next:string|null}>((resolve,reject)=>{const tx=db.transaction('outbox','readonly'),items:Array<{operationId:string;status:string;classification:'LEGACY_REVIEW_REQUIRED'}>=[];let next:string|null=null,scanned=0;
  tx.oncomplete=()=>current()===principal?resolve({items,next}):reject(Error('OFFLINE_SCOPE_CHANGED'));tx.onabort=()=>reject(tx.error);
  const q=tx.objectStore('outbox').openCursor(after?IDBKeyRange.lowerBound(after,true):undefined);q.onsuccess=()=>{const c=q.result;if(!c)return;if(current()!==principal){tx.abort();return;}scanned++;const v=c.value;if(v.userId===principal&&v.projectId===projectId)items.push({operationId:v.operationId,status:v.status,classification:'LEGACY_REVIEW_REQUIRED'});if(scanned<50)c.continue();else next=String(c.primaryKey);};
 });
}
