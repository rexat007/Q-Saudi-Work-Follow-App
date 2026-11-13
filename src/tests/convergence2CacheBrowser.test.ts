import {it,expect} from 'vitest';
import {build} from 'esbuild';
import express from 'express';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
it('real IndexedDB v3 upgrade preserves legacy and SQL receipts; aborted writes never publish an ACK',async()=>{
 const bundle=await build({stdin:{contents:"import {IndexedDBService} from './src/services/offline/indexedDB.service';window.cache=new IndexedDBService();window.cache.setPrincipalProvider(()=> 'OWNER');",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'browser',format:'esm'});
 const app=express();app.get('/',(_req,res)=>res.type('html').send('<html><body></body></html>'));app.get('/cache.js',(_req,res)=>res.type('js').send(bundle.outputFiles[0].text));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));let browser:any;
 try{
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+(server.address() as any).port);
  await page.evaluate(async()=>{await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('q_saudi_logistics_offline_db',3);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('trips',{keyPath:'tripId'});d.createObjectStore('outbox',{keyPath:'operationId'});for(const name of ['sqlCommands','sqlCache','sqlControl']){const st=d.createObjectStore(name,{keyPath:'key'});if(name!=='sqlControl'){st.createIndex('scope','scope');st.createIndex('principal','principal');}if(name==='sqlCommands'){st.createIndex('owner','owner');st.createIndex('scopeStatus',['scope','status']);}}};r.onerror=()=>reject(r.error);r.onsuccess=()=>{const d=r.result,tx=d.transaction(['trips','outbox','sqlCommands'],'readwrite');tx.objectStore('trips').put({tripId:'UNOWNED',projectId:'OLD',value:'legacy'});tx.objectStore('outbox').put({operationId:'OLD-ACK',status:'SYNCED',userId:'OWNER',serverAck:{tripId:'ORIGINAL'}});tx.objectStore('sqlCommands').put({key:'SQL-RECEIPT',scope:'S',principal:'OWNER',status:'ACKNOWLEDGED',receipt:{operationId:'SQL'}});tx.oncomplete=()=>{d.close();resolve();};};});});
  await page.addScriptTag({url:'/cache.js',type:'module'});await page.waitForFunction(()=>Boolean((window as any).cache));
  const proof=await page.evaluate(async()=>{
   const c=(window as any).cache,d=await c.getDB();
   const read=async(store:string,key:string)=>new Promise<any>((resolve,reject)=>{const tx=d.transaction(store),r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
   const legacy=await read('trips','UNOWNED'),sql=await read('sqlCommands','SQL-RECEIPT'),ack=await c.getById('outbox','OLD-ACK');
   const visible=await c.getAll('trips');
   await c.updateOutboxStatus('OLD-ACK','FAILED',{errorReason:'STALE-WORKER'});
   const retained=await c.getById('outbox','OLD-ACK');
   const transaction=d.transaction.bind(d);d.transaction=(...args:any[])=>{const tx=transaction(...args);if(args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx;};
   let aborted=false;try{await c.put('outbox',{operationId:'ABORTED',userId:'OWNER',status:'SYNCED'});}catch{aborted=true;}d.transaction=transaction;
   const absent=await c.getById('outbox','ABORTED');
   return {version:d.version,legacy:legacy.value,sql:sql.receipt.operationId,ack:ack.serverAck.tripId,visible:visible.length,retained:retained.status,aborted,absent:absent===undefined};
  });
  expect(proof).toEqual({version:4,legacy:'legacy',sql:'SQL',ack:'ORIGINAL',visible:0,retained:'SYNCED',aborted:true,absent:true});
 }finally{await browser?.close();await new Promise<void>(r=>server.close(()=>r()));}
},60000);
