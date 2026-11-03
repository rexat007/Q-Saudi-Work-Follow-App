/** Application-level fake-DB operations, not Firebase billing or provider telemetry. */
export function countWorkspaceOperations(db:any){
 let counts={transactions:0,pointReads:0,queryCalls:0,queryDocs:0,aggregations:0,writes:0};
 const read=(ref:any,snapshot:any)=>{if(ref.path.split('/').length%2===0)counts.pointReads++;else{counts.queryCalls++;counts.queryDocs+=snapshot.docs.length;}return snapshot;};
 const wrap=(ref:any):any=>new Proxy(ref,{get(target,key){
  if(key==='get')return async()=>read(target,await target.get());
  if(key==='count')return()=>({get:async()=>{counts.aggregations++;return target.count().get();}});
  const value=target[key];return typeof value==='function'?((...args:any[])=>wrap(value(...args))):value;
 }});
 const collection=db.collection.bind(db),run=db.runTransaction.bind(db);db.collection=(name:string)=>wrap(collection(name));
 db.runTransaction=async(callback:any)=>{counts.transactions++;let writes=0;
  const result=await run((tx:any)=>callback({...tx,get:async(ref:any)=>read(ref,await tx.get(ref)),set:(...args:any[])=>{writes++;return tx.set(...args);},update:(...args:any[])=>{writes++;return tx.update(...args);},delete:(...args:any[])=>{writes++;return tx.delete(...args);}}));counts.writes+=writes;return result;
 };
 return {reset:()=>{counts={transactions:0,pointReads:0,queryCalls:0,queryDocs:0,aggregations:0,writes:0};},snapshot:()=>({...counts})};
}
