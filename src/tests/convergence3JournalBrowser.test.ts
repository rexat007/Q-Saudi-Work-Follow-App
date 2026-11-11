import {it,expect} from 'vitest';
import {build} from 'esbuild';
import express from 'express';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
it('real cross-tab transactions reserve one immutable Trip command; scope and acknowledged receipts survive restart',async()=>{
 const bundle=await build({stdin:{contents:"import {IndexedDBService} from './src/services/offline/indexedDB.service';window.cache=new IndexedDBService();window.cache.setPrincipalProvider(()=> 'OWNER');",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'browser',format:'esm'});
 const app=express();app.get('/',(_req,res)=>res.type('html').send('<html><body><script type="module" src="/cache.js"></script></body></html>'));app.get('/cache.js',(_req,res)=>res.type('js').send(bundle.outputFiles[0].text));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));let browser:any;
 try{
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage(),base='http://127.0.0.1:'+(server.address() as any).port;
  await Promise.all([a.goto(base),b.goto(base)]);for(const page of [a,b])await page.waitForFunction(()=>Boolean((window as any).cache));
  const reserve=(page:any,id:string,projectId='P1',userId='OWNER')=>page.evaluate(async({id,projectId,userId}:any)=>(window as any).cache.insertOutboxOperation({operationId:id,operationType:'TRIP_COMMAND',projectId,userId,payload:{command:'DISPATCH_TRIP',payload:{truckId:id},expectedRevision:0},status:'PENDING',retryCount:0,createdAt:new Date().toISOString()}),{id,projectId,userId});
  const [first,second]=await Promise.all([reserve(a,'A'),reserve(b,'B')]);expect(first.operationId).toBe(second.operationId);expect(first.payload).toEqual(second.payload);
  expect((await reserve(b,'OTHER-PROJECT','P2')).operationId).toBe('OTHER-PROJECT');
  await expect(reserve(b,'FORGED','P1','OTHER-USER')).rejects.toThrow('AUTH_CONTEXT_CHANGED');
  await a.evaluate(async(id:string)=>{await(window as any).cache.updateOutboxStatus(id,'SYNCED',{serverAck:{tripId:'T1'}});},first.operationId);
  await b.reload();await b.waitForFunction(()=>Boolean((window as any).cache));
  const ack=await b.evaluate(async(id:string)=>(window as any).cache.getById('outbox',id),first.operationId);expect(ack.serverAck.tripId).toBe('T1');expect(ack.status).toBe('SYNCED');
  const next=await reserve(b,'NEXT');expect(next.operationId).toBe('NEXT');
  const rows=await a.evaluate(async()=>(window as any).cache.getAll('outbox'));expect(rows.filter((op:any)=>op.projectId==='P1')).toHaveLength(2);
 }finally{await browser?.close();await new Promise<void>(r=>server.close(()=>r()));}
},60000);
