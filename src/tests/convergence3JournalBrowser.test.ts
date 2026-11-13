import {it,expect} from 'vitest';
import {build} from 'esbuild';
import express from 'express';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
it('real cross-tab transactions reserve one immutable Trip command; scope and acknowledged receipts survive restart',async()=>{
 const phase=(name:string)=>{if(process.env.QSA_TEST_DIAGNOSTICS==='1')console.info('TRIP_BROWSER_PHASE',name);};
 phase('bundle');
 const bundle=await build({stdin:{contents:"import {IndexedDBService} from './src/services/offline/indexedDB.service';window.cache=new IndexedDBService();window.cache.setPrincipalProvider(()=> 'OWNER');",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'browser',format:'esm'});
 const app=express();app.get('/',(_req,res)=>res.type('html').send('<html><body><script type="module" src="/cache.js"></script></body></html>'));app.get('/cache.js',(_req,res)=>res.type('js').send(bundle.outputFiles[0].text));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));let browser:any,context:any;
 try{
 phase('launch');
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 phase('pages');
  context=await browser.newContext();const a=await context.newPage(),b=await context.newPage(),base='http://127.0.0.1:'+(server.address() as any).port;
  await Promise.all([a.goto(base),b.goto(base)]);for(const page of [a,b])await page.waitForFunction(()=>Boolean((window as any).cache));
  const reserve=(page:any,id:string,projectId='P1',userId='OWNER')=>page.evaluate(async({id,projectId,userId}:any)=>(window as any).cache.insertOutboxOperation({operationId:id,operationType:'TRIP_COMMAND',projectId,userId,payload:{command:'DISPATCH_TRIP',payload:{truckId:'CANONICAL-TRUCK'},expectedRevision:0},status:'PENDING',retryCount:0,createdAt:new Date().toISOString()}),{id,projectId,userId});
 phase('identical-race');
  const [first,second]=await Promise.all([reserve(a,'A'),reserve(b,'B')]);expect(first.operationId).toBe(second.operationId);expect(first.payload).toEqual(second.payload);
 phase('different-intent');
  const conflict=await b.evaluate(async()=>{try{await(window as any).cache.insertOutboxOperation({operationId:'DIFFERENT',operationType:'TRIP_COMMAND',projectId:'P1',userId:'OWNER',payload:{command:'DISPATCH_TRIP',payload:{truckId:'OTHER-TRUCK'},expectedRevision:0},status:'PENDING',retryCount:0,createdAt:new Date().toISOString()});return null;}catch(error:any){return error.code;}});
  expect(conflict).toBe('OUTBOX_INTENT_CONFLICT');
  const race=(page:any,truckId:string)=>page.evaluate(async(truckId:string)=>{try{return {operation:await(window as any).cache.insertOutboxOperation({operationId:'RACE-'+truckId,operationType:'TRIP_COMMAND',projectId:'P-RACE',userId:'OWNER',payload:{command:'DISPATCH_TRIP',payload:{truckId},expectedRevision:0},status:'PENDING',retryCount:0,createdAt:new Date().toISOString()})};}catch(error:any){return {error:error.code};}},truckId);
 phase('competing-race');
  const competing=await Promise.all([race(a,'FIRST'),race(b,'SECOND')]);expect(competing.filter(result=>result.operation)).toHaveLength(1);expect(competing.filter(result=>result.error==='OUTBOX_INTENT_CONFLICT')).toHaveLength(1);
 phase('scope');
  expect((await reserve(b,'OTHER-PROJECT','P2')).operationId).toBe('OTHER-PROJECT');
  await expect(reserve(b,'FORGED','P1','OTHER-USER')).rejects.toThrow('AUTH_CONTEXT_CHANGED');
 phase('ack');
  await a.evaluate(async(id:string)=>{await(window as any).cache.updateOutboxStatus(id,'SYNCED',{serverAck:{tripId:'T1'}});},first.operationId);
 phase('restart');
  await b.reload();await b.waitForFunction(()=>Boolean((window as any).cache));
  const ack=await b.evaluate(async(id:string)=>(window as any).cache.getById('outbox',id),first.operationId);expect(ack.serverAck.tripId).toBe('T1');expect(ack.status).toBe('SYNCED');
  await b.evaluate(async(id:string)=>{await(window as any).cache.updateOutboxStatus(id,'AWAITING_RECEIPT',{errorReason:'STALE-WORKER'});},first.operationId);
  expect((await b.evaluate(async(id:string)=>(window as any).cache.getById('outbox',id),first.operationId)).status).toBe('SYNCED');
 phase('next-intent');
  const next=await reserve(b,'NEXT');expect(next.operationId).toBe('NEXT');
  const rows=await a.evaluate(async()=>(window as any).cache.getAll('outbox'));expect(rows.filter((op:any)=>op.projectId==='P1')).toHaveLength(2);
 phase('cleanup');
 }finally{
  // This server belongs only to this test. Close its keep-alive connections before
  // waiting for Edge shutdown so successful assertions cannot leave teardown hung.
  await context?.close();phase('context-closed');
  const closed=new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  server.closeAllConnections();
  await browser?.close();phase('browser-closed');await closed;
 }
},60000);
