import {FIRESTORE_BOOTSTRAP,parseRuntimeAuthority,assertFirestoreAuthority,RuntimeAuthorityError,type RuntimeAuthority} from '../types/runtimeAuthority';
export const FIRESTORE_AUTHORITY_PATH='runtime_authority/current';
const control=(db:any)=>db.collection('runtime_authority').doc('current');
export async function readFirestoreAuthority(db:any,transaction?:any):Promise<RuntimeAuthority>{
 try{const snapshot=transaction?await transaction.get(control(db)):await control(db).get();return snapshot.exists?parseRuntimeAuthority(snapshot.data()):{...FIRESTORE_BOOTSTRAP};}
 catch(error){if(error instanceof RuntimeAuthorityError)throw error;throw new RuntimeAuthorityError('RUNTIME_AUTHORITY_UNAVAILABLE',503);}
}
/** Fences the existing Admin SDK boundary, not an alternative persistence store.
 * A future control update conflicts with each canonical transaction's control read.
 * It cannot revoke an older binary's Admin credentials; IAM retirement is a separate gate. */
export function fenceFirestoreDatabase(database:any):any {
 const originals=new WeakMap<object,any>(),wrapped=new WeakMap<object,any>();
 const raw=(ref:any)=>ref&&typeof ref==='object'?originals.get(ref)||ref:ref;
 const protect=(ref:any)=>{if(raw(ref)?.path===FIRESTORE_AUTHORITY_PATH)throw new RuntimeAuthorityError('AUTHORITY_CONTROL_OPERATOR_ONLY',403);};
 const guarded=async(work:(tx:any)=>Promise<any>)=>database.runTransaction(async(tx:any)=>{assertFirestoreAuthority(await readFirestoreAuthority(database,tx));return work(tx);});
 const snapshot=(s:any):any=>{if(!s||typeof s!=='object')return s;return new Proxy(s,{get(t,k){if(k==='ref')return ref(t.ref);if(k==='docs')return t.docs.map(snapshot);const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;}});};
 const ref=(target:any):any=>{
  if(!target||typeof target!=='object')return target;if(wrapped.has(target))return wrapped.get(target);
  const result=new Proxy(target,{get(t,k){
   if(['set','update','create','delete'].includes(String(k))&&typeof t[k]==='function')return async(...args:any[])=>{protect(t);return guarded(async tx=>{tx[k](t,...args);});};
   if(k==='add'&&typeof t.doc==='function')return async(data:any)=>{const next=t.doc();protect(next);await guarded(async tx=>{tx.create(next,data);});return ref(next);};
   if(k==='get')return async(...args:any[])=>snapshot(await t.get(...args));
   const value=Reflect.get(t,k,t);if(typeof value!=='function')return value;
   if(['collection','doc','where','orderBy','limit','limitToLast','select','startAfter','startAt','endAt','endBefore','withConverter'].includes(String(k)))return (...args:any[])=>ref(value.apply(t,args.map(raw)));
   return value.bind(t);
  }});originals.set(result,target);wrapped.set(target,result);return result;
 };
 const wrapTransaction=(tx:any)=>new Proxy(tx,{get(t,k){
  if(k==='get')return async(r:any,...args:any[])=>snapshot(await t.get(raw(r),...args));
  if(k==='getAll')return async(...refs:any[])=>(await t.getAll(...refs.map(raw))).map(snapshot);
  if(['set','update','create','delete'].includes(String(k)))return (r:any,...args:any[])=>{protect(r);t[k](raw(r),...args);return wrapTransaction(t);};
  const value=Reflect.get(t,k,t);return typeof value==='function'?value.bind(t):value;
 }});
 return new Proxy(database,{get(t,k){
  if(k==='collection'||k==='doc'||k==='collectionGroup')return (...args:any[])=>ref(t[k](...args));
  if(k==='runTransaction')return (work:any,options?:any)=>t.runTransaction(async(tx:any)=>{assertFirestoreAuthority(await readFirestoreAuthority(t,tx));return work(wrapTransaction(tx));},options);
  if(k==='getAll')return async(...refs:any[])=>(await t.getAll(...refs.map(raw))).map(snapshot);
  if(k==='batch')return ()=>{const operations:Array<[string,any,any[]]>=[];const batch:any={};for(const method of ['set','update','create','delete'])batch[method]=(r:any,...args:any[])=>{protect(r);operations.push([method,raw(r),args]);return batch;};batch.commit=()=>guarded(async tx=>{for(const [method,r,args] of operations)tx[method](r,...args);});return batch;};
  if(k==='bulkWriter')return ()=>{throw new RuntimeAuthorityError('UNFENCED_FIRESTORE_WRITER',503);};
  const value=Reflect.get(t,k,t);return typeof value==='function'?value.bind(t):value;
 }});
}
