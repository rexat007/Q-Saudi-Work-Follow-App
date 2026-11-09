import {IndexedDBService} from './indexedDB.service';
import {causalResource,hasCausalOrder,commandIdentity,sqlScope,stableJson,offlineFail,type OfflineCommand,type OfflineScope} from '../../types/sqlOffline';
export interface SqlSession {scope:OfflineScope;principalRevision:number;current:()=>boolean}
/** Uses real IndexedDB only. Every acknowledgement resolves on transaction completion. */
export class SqlOfflineStore {
 constructor(readonly database=new IndexedDBService()){}
 async tx<T>(names:string[],mode:IDBTransactionMode,work:(tx:IDBTransaction,set:(value:T)=>void,fail:(error:unknown)=>void)=>void):Promise<T>{
  const db=await this.database.getDB();return new Promise((resolve,reject)=>{const tx=db.transaction(names,mode);let result:T,error:unknown;
   tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||tx.error||Error('OFFLINE_TRANSACTION_ABORTED'));tx.onerror=()=>{};
   try{work(tx,v=>result=v,e=>{error=e;tx.abort();});}catch(e){error=e;tx.abort();}
  });
 }
 async control(key:string){return this.tx<any>(['sqlControl'],'readonly',(tx,set)=>{tx.objectStore('sqlControl').get(key).onsuccess=e=>set((e.target as IDBRequest).result);});}
 async device(){return this.tx<string>(['sqlControl'],'readwrite',(tx,set)=>{const s=tx.objectStore('sqlControl'),r=s.get('device');r.onsuccess=()=>{const id=r.result?.value||crypto.randomUUID();if(!r.result)s.put({key:'device',value:id});set(id);};});}
 async principalRevision(principal:string){return Number((await this.control('principal/'+principal))?.revision||0);}
 async revoke(principal:string){return this.tx<void>(['sqlControl','sqlCache','sqlCommands'],'readwrite',(tx,set)=>{const s=tx.objectStore('sqlControl'),r=s.get('principal/'+principal);r.onsuccess=()=>s.put({key:'principal/'+principal,revision:Number(r.result?.revision||0)+1});const operations=tx.objectStore('sqlCommands').index('principal').openCursor(IDBKeyRange.only(principal));operations.onsuccess=()=>{const c=operations.result;if(c){if(!['SYNCED','CANCELLED','QUARANTINED_EPOCH','CONFLICT','REVIEW_REQUIRED'].includes(c.value.status))c.update({...c.value,status:'QUARANTINED_SCOPE',version:c.value.version+1,lease:undefined});c.continue();}};const c=tx.objectStore('sqlCache').index('principal').openCursor(IDBKeyRange.only(principal));c.onsuccess=()=>{const x=c.result;if(x){x.delete();x.continue();}};set();});}
 async epoch(key:string,context:{backendEpoch:string;epochRevision:number}){return this.tx<boolean>(['sqlControl'],'readwrite',(tx,set)=>{const s=tx.objectStore('sqlControl'),r=s.get('epoch/'+key);r.onsuccess=()=>{const old=r.result;if(old&&(context.epochRevision<old.epochRevision||context.epochRevision===old.epochRevision&&context.backendEpoch!==old.backendEpoch)){set(false);return;}s.put({key:'epoch/'+key,backendEpoch:context.backendEpoch,epochRevision:context.epochRevision});set(true);};});}
 async fenceEpoch(session:SqlSession){return this.tx<void>(['sqlCommands','sqlControl'],'readwrite',(tx,set)=>{let unresolved=0;const scope=session.scope,owner=JSON.stringify([scope.principal,scope.companyId,scope.projectId,scope.deviceId]),q=tx.objectStore('sqlCommands').index('owner').openCursor(IDBKeyRange.only(owner));q.onsuccess=()=>{const c=q.result;if(c){if(c.value.scope!==sqlScope(scope)&&!['SYNCED','CANCELLED'].includes(c.value.status)){unresolved++;c.update({...c.value,status:'QUARANTINED_EPOCH',version:c.value.version+1,lease:undefined});}c.continue();}else tx.objectStore('sqlControl').put({key:'prior-review/'+sqlScope(scope),unresolved});};set();});}
 async list(session:SqlSession){if(!session.current())offlineFail('OFFLINE_SCOPE_CHANGED');return this.tx<OfflineCommand[]>(['sqlCommands','sqlControl'],'readonly',(tx,set)=>{const r=tx.objectStore('sqlControl').get('principal/'+session.scope.principal);r.onsuccess=()=>{if(!session.current()||Number(r.result?.revision||0)!==session.principalRevision){set([]);return;}const q=tx.objectStore('sqlCommands').index('scope').getAll(IDBKeyRange.only(sqlScope(session.scope)),101);q.onsuccess=()=>set(q.result);};});}
 async prior(session:SqlSession,after?:string){
  if(!session.current())offlineFail('OFFLINE_SCOPE_CHANGED');return this.tx<{items:OfflineCommand[];next:string|null}>(['sqlCommands','sqlControl'],'readonly',(tx,set)=>{const items:OfflineCommand[]=[];set({items,next:null});const rev=tx.objectStore('sqlControl').get('principal/'+session.scope.principal);rev.onsuccess=()=>{if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision)return;
   const owner=JSON.stringify([session.scope.principal,session.scope.companyId,session.scope.projectId,session.scope.deviceId]),q=tx.objectStore('sqlCommands').index('owner').openCursor(IDBKeyRange.only(owner));let scanned=0,jumped=false;
   q.onsuccess=()=>{const c=q.result;if(!session.current()){set({items:[],next:null});return;}if(!c)return;if(after&&String(c.primaryKey)<=after){if(!jumped&&String(c.primaryKey)<after){jumped=true;c.continuePrimaryKey(owner,after);}else c.continue();return;}
    if(c.value.scope!==sqlScope(session.scope)&&c.value.status==='QUARANTINED_EPOCH')items.push(c.value);if(++scanned<50)c.continue();else set({items,next:String(c.primaryKey)});
   };
  };});
 }
 async historical(session:SqlSession,key:string,receipt?:import('../../types/sqlOffline').OfflineReceipt){
  return this.tx<OfflineCommand|undefined>(['sqlCommands','sqlControl'],'readwrite',(tx,set,fail)=>{const controls=tx.objectStore('sqlControl'),rev=controls.get('principal/'+session.scope.principal);rev.onsuccess=()=>{if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision)return;const store=tx.objectStore('sqlCommands'),q=store.get(key);q.onsuccess=()=>{const old=q.result as OfflineCommand|undefined,owner=JSON.stringify([session.scope.principal,session.scope.companyId,session.scope.projectId,session.scope.deviceId]);if(!old||old.owner!==owner||old.scope===sqlScope(session.scope)||old.status!=='QUARANTINED_EPOCH')return;
   if(!receipt){set(old);return;}if(receipt.state!=='COMMITTED'||receipt.requestDigest!==old.requestDigest||receipt.operationId!==old.operationId){fail(Error('RECEIPT_BINDING_MISMATCH'));return;}store.put({...old,status:'SYNCED',version:old.version+1,receipt,lease:undefined});const barrier='prior-review/'+sqlScope(session.scope),r=controls.get(barrier);r.onsuccess=()=>controls.put({key:barrier,unresolved:Math.max(0,Number(r.result?.unresolved||0)-1)});set(old);
  };};});
 }
 /** Point lookups never depend on the first journal page. */
 async get(session:SqlSession,operationId:string){if(!session.current())offlineFail('OFFLINE_SCOPE_CHANGED');return this.tx<OfflineCommand|undefined>(['sqlCommands','sqlControl'],'readonly',(tx,set)=>{const r=tx.objectStore('sqlControl').get('principal/'+session.scope.principal);r.onsuccess=()=>{if(!session.current()||Number(r.result?.revision||0)!==session.principalRevision)return;const q=tx.objectStore('sqlCommands').get(JSON.stringify([sqlScope(session.scope),operationId]));q.onsuccess=()=>set(session.current()?q.result:undefined);};});}
 async page(session:SqlSession,after?:string,limit=50){
  if(!session.current()||!Number.isInteger(limit)||limit<1||limit>50||after!==undefined&&after.length>4096)offlineFail('INVALID_JOURNAL_PAGE');
  return this.tx<{items:OfflineCommand[];next:string|null}>(['sqlCommands','sqlControl'],'readonly',(tx,set)=>{const items:OfflineCommand[]=[];set({items,next:null});const rev=tx.objectStore('sqlControl').get('principal/'+session.scope.principal);rev.onsuccess=()=>{
   if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision)return;
   const scope=sqlScope(session.scope),q=tx.objectStore('sqlCommands').index('scope').openCursor(IDBKeyRange.only(scope));let jumped=false;
   q.onsuccess=()=>{if(!session.current()){set({items:[],next:null});return;}const c=q.result;if(!c)return;
    if(after&&String(c.primaryKey)<=after){if(!jumped&&String(c.primaryKey)<after){jumped=true;c.continuePrimaryKey(scope,after);}else c.continue();return;}
    if(items.length===limit){set({items,next:items.at(-1)!.key});return;}items.push(c.value);c.continue();
   };
  };});
 }
 /** Bounded, persisted round-robin over sequence keys; acknowledged history is absent. */
 async pending(session:SqlSession){
  if(!session.current())return [];
  return this.tx<OfflineCommand[]>(['sqlCommands','sqlControl'],'readwrite',(tx,set)=>{
   const controls=tx.objectStore('sqlControl'),commands=tx.objectStore('sqlCommands'),rev=controls.get('principal/'+session.scope.principal),result:OfflineCommand[]=[];set(result);
   rev.onsuccess=()=>{if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision)return;
    const scope=sqlScope(session.scope);
    const scan=()=>{
    const prefix='schedule/'+scope+'/',cursorKey='scheduler/'+scope,position=controls.get(cursorKey);
    position.onsuccess=()=>{const after=position.result?.after,range=IDBKeyRange.bound(after||prefix,prefix+'\uffff',Boolean(after),false),q=controls.openCursor(range);let scanned=0;
     q.onsuccess=()=>{const c=q.result;if(!c){controls.put({key:cursorKey,after:null});return;}scanned++;controls.put({key:cursorKey,after:c.key});const scheduleKey=c.primaryKey,r=commands.get(c.value.commandKey);
      r.onsuccess=()=>{const op=r.result as OfflineCommand|undefined;if(op&&['PENDING','SENDING','AWAITING_RECEIPT','RETRYABLE_FAILURE'].includes(op.status)&&hasCausalOrder(op)){
       this.eligible(tx,op,allowed=>{if(allowed)result.push(op);});
      }else controls.delete(scheduleKey);};if(scanned<100)c.continue();
     };
    };
    };
    const migrationKey='ordering-bootstrap/'+scope,migration=controls.get(migrationKey);
    migration.onsuccess=()=>{if(migration.result?.complete){scan();return;}
     const after=migration.result?.after,q=commands.index('scope').openCursor(IDBKeyRange.only(scope));let scanned=0,jumped=false;
     q.onsuccess=()=>{const c=q.result;if(!c){controls.put({key:migrationKey,complete:true});scan();return;}
      if(after&&!jumped&&String(c.primaryKey)<=after){jumped=true;if(String(c.primaryKey)<after)c.continuePrimaryKey(scope,after);else c.continue();return;}
      const op=c.value as OfflineCommand;let valid=false;try{valid=hasCausalOrder(op);}catch{}
      if(!valid&&op.status!=='SYNCED'){
       let resource='ALL';try{resource=causalResource(op);}catch{}
       controls.put({key:'causal-block/'+scope+'/'+resource,commandKey:op.key});
       if(['PENDING','SENDING','AWAITING_RECEIPT','RETRYABLE_FAILURE'].includes(op.status))c.update({...op,status:'REVIEW_REQUIRED',errorCode:'CAUSAL_ORDER_UNVERIFIED',version:op.version+1,lease:undefined});
      }
      controls.put({key:migrationKey,after:c.primaryKey,complete:false});if(++scanned<100)c.continue();
     };
    };

   };
  });
 }
 private eligible(tx:IDBTransaction,op:OfflineCommand,done:(value:boolean)=>void){
  const controls=tx.objectStore('sqlControl'),checks=[controls.get('ordering-bootstrap/'+op.scope),controls.get('causal-block/'+op.scope+'/ALL'),controls.get('causal-block/'+op.scope+'/'+op.causalKey)];let ready=0;
  for(const q of checks)q.onsuccess=()=>{if(++ready!==checks.length)return;if(!checks[0].result?.complete||checks[1].result||checks[2].result){done(false);return;}
   if(op.predecessorKey===null)done(true);else{const pred=tx.objectStore('sqlCommands').get(op.predecessorKey!);pred.onsuccess=()=>done(this.predecessorMatches(op,pred.result));}
  };
 }
 private predecessorMatches(op:OfflineCommand,pred:OfflineCommand|undefined){return Boolean(pred&&pred.scope===op.scope&&pred.causalKey===op.causalKey&&Number(pred.submissionOrder)<Number(op.submissionOrder)&&pred.status==='SYNCED');}
 private scheduleKey(op:OfflineCommand){return 'schedule/'+op.scope+'/'+String(op.submissionOrder).padStart(16,'0');}
 async change(session:SqlSession,key:string,update:(old:OfflineCommand|undefined)=>OfflineCommand|undefined,projection?:{id:string;revision:number;data:Record<string,unknown>},requirePredecessor=false){
  if(!session.current())return false;
  return this.tx<boolean>(['sqlCommands','sqlControl','sqlCache'],'readwrite',(tx,set,fail)=>{
   const controls=tx.objectStore('sqlControl'),store=tx.objectStore('sqlCommands'),rev=controls.get('principal/'+session.scope.principal);
   rev.onsuccess=()=>{if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision){set(false);return;}
    const r=store.get(key);r.onsuccess=()=>{const old=r.result as OfflineCommand|undefined;
     const apply=()=>{try{
      if(old&&old.scope!==sqlScope(session.scope))offlineFail('OFFLINE_SCOPE_CHANGED');const value=update(old);if(!value){set(false);return;}
      const persist=()=>{store.put(value);if(hasCausalOrder(value)){const schedule=this.scheduleKey(value);if(['PENDING','SENDING','AWAITING_RECEIPT','RETRYABLE_FAILURE'].includes(value.status))controls.put({key:schedule,commandKey:value.key});else controls.delete(schedule);}
       if(projection){const cache=tx.objectStore('sqlCache'),k=JSON.stringify([sqlScope(session.scope),'TRIP',projection.id]),q=cache.get(k);q.onsuccess=()=>{if(!q.result||Number(q.result.data.revision||0)<=projection.revision)cache.put({key:k,scope:sqlScope(session.scope),principal:session.scope.principal,kind:'TRIP',...projection});};}set(true);
      };
      if(old){if(stableJson(commandIdentity(old))!==stableJson(commandIdentity(value))||stableJson([old.submissionOrder??null,old.causalKey??null,old.predecessorKey??null])!==stableJson([value.submissionOrder??null,value.causalKey??null,value.predecessorKey??null]))offlineFail('IDEMPOTENCY_PAYLOAD_MISMATCH');persist();}
      else{const scope=sqlScope(session.scope),counter=controls.get('submission/'+scope),causalKey=causalResource(value),tailKey='tail/'+scope+'/'+causalKey,tail=controls.get(tailKey);let ready=0;
       const allocate=()=>{if(++ready!==2)return;try{const order=Number(counter.result?.value||0)+1;if(!Number.isSafeInteger(order))offlineFail('SUBMISSION_ORDER_EXHAUSTED');Object.assign(value,{submissionOrder:order,causalKey,predecessorKey:tail.result?.commandKey||null});controls.put({key:'submission/'+scope,value:order});controls.put({key:tailKey,commandKey:value.key});persist();}catch(error){fail(error);}};counter.onsuccess=allocate;tail.onsuccess=allocate;
      }
     }catch(error){fail(error);}};
     if(requirePredecessor){let valid=false;try{valid=Boolean(old&&hasCausalOrder(old));}catch{}if(!valid){set(false);return;}this.eligible(tx,old!,allowed=>{if(allowed)apply();else set(false);});return;}
     apply();
    };
   };
  });
 }
 async putPage(session:SqlSession,kind:string,revision:string,items:Array<{id:string;data:Record<string,unknown>}>){
  if(!session.current())return false;
  return this.tx<boolean>(['sqlControl','sqlCache'],'readwrite',(tx,set)=>{const controls=tx.objectStore('sqlControl'),rev=controls.get('principal/'+session.scope.principal);rev.onsuccess=()=>{if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision){set(false);return;}const scope=sqlScope(session.scope),mark='cache/'+scope+'/'+kind,q=controls.get(mark);q.onsuccess=()=>{
   if(q.result&&BigInt(q.result.revision)>BigInt(revision)){set(false);return;}controls.put({key:mark,revision});const cache=tx.objectStore('sqlCache');for(const item of items){const key=JSON.stringify([scope,kind,item.id]),old=cache.get(key);old.onsuccess=()=>{if(!old.result||Number(old.result.data.revision||0)<=Number(item.data.revision||0))cache.put({key,scope,principal:session.scope.principal,kind,revision,sourceRevision:revision,data:item.data});};}
   // No existing SQL API provides a trusted complete-inventory witness. Upserts only.
   set(true);
  };};});
 }
 async cache(session:SqlSession){if(!session.current())return [];return this.tx<any[]>(['sqlCache','sqlControl'],'readonly',(tx,set)=>{const rev=tx.objectStore('sqlControl').get('principal/'+session.scope.principal);rev.onsuccess=()=>{if(!session.current()||Number(rev.result?.revision||0)!==session.principalRevision){set([]);return;}const r=tx.objectStore('sqlCache').index('scope').getAll(IDBKeyRange.only(sqlScope(session.scope)));r.onsuccess=()=>set(session.current()?r.result:[]);};});}
}
