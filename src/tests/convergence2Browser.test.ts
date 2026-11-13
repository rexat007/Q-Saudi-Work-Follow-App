import {it,expect} from 'vitest';
import {getAuth} from 'firebase-admin/auth';
import {getApps} from 'firebase-admin/app';
import {build} from 'esbuild';
import fs from 'node:fs';
import express from 'express';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {emulatorFixture,fleetPayload} from './helpers/convergence2Firestore';
import {setTestDbOverride,setTestAuthOverride} from '../firebase/admin';
import {arTranslations} from '../locales/ar';
let currentDatabase:any;
// Production composition captures the database once. Each serial fixture uses
// the same real emulator with a fresh Admin client; this proxy preserves that
// composition lifetime without replacing any transaction or persistence method.
const database=new Proxy({}, {get:(_target,key)=>{const value=currentDatabase[key];return typeof value==='function'?value.bind(currentDatabase):value;}});

it.each([{width:1440,height:1000},{width:390,height:844}])('actual Arabic App, Auth/Firestore and lost ACK recovery at $width px',async viewport=>{
  if(process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('EXPLICIT_LOCAL_AUTH_REQUIRED');
  const f=await emulatorFixture();let browser:any,server:any;const auth=getAuth(getApps().find(a=>a.name.startsWith('c2-'))!);
  const email=f.actorId+'@example.invalid',password='Synthetic-Only-Password-2026';
  try{
    await auth.createUser({uid:f.actorId,email,password,emailVerified:true});
    currentDatabase=f.db;setTestDbOverride(database);setTestAuthOverride(auth);
    const {app}=await import('../../server/app');
    const env={VITE_FIREBASE_PROJECT_ID:'demo-convergence2',VITE_FIREBASE_APP_ID:'demo-convergence2',VITE_FIREBASE_API_KEY:'synthetic-emulator-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-convergence2.firebaseapp.com',VITE_FIREBASE_FIRESTORE_DATABASE_ID:'(default)'};
    const bundle=await build({entryPoints:['src/tests/helpers/convergence2BrowserEntry.tsx'],bundle:true,write:false,platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"','import.meta.env':JSON.stringify(env),__APP_BUILD_ID__:JSON.stringify('b52e0167e3f60c59af3ad843a618ba2e95cef246')}});
    const host=express(),calls:Array<{path:string;method:string}>=[];
    host.use((req,_res,next)=>{calls.push({path:req.path,method:req.method});next();});
    host.get('/',(_req,res)=>res.type('html').send('<html dir="rtl"><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>'));
    host.get('/client.js',(_req,res)=>res.type('js').send(bundle.outputFiles.find(f=>f.path.endsWith('.js'))?.text||bundle.outputFiles[0].text));
    const css=fs.readdirSync('dist/assets').find(p=>p.endsWith('.css'))!;host.get('/style.css',(_req,res)=>res.type('css').send(fs.readFileSync('dist/assets/'+css)));
    host.use(app);server=host.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
    const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');
    browser=await chromium.launch({executablePath:process.env.QSA_BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking','--no-first-run']});
    const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage(),errors:string[]=[],external:string[]=[];
    page.on('pageerror',(e:Error)=>errors.push(e.message));
    await page.route('**/*',(route:any)=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)){external.push(u.origin);return route.abort();}return route.continue();});
    await page.goto(base);await page.waitForFunction(()=>Boolean((window as any).c2));
    await page.evaluate(({email,password}:any)=>(window as any).c2.login(email,password),{email,password});
    await page.getByText('Synthetic operator',{exact:false}).first().waitFor({state:'attached',timeout:30000});
    if(viewport.width<1024)await page.locator('#btn-mobile-nav-toggle').click();
    // Actual Sidebar navigation, not a replacement router.
    const reportsLabel=arTranslations['navigation.tabs.reports_engine'];expect(typeof reportsLabel).toBe('string');
    await page.getByRole('button').filter({hasText:reportsLabel}).first().click();
    await page.getByText(arTranslations['analytics.ui.logistics_and_financial_reports_engine'],{exact:true}).waitFor();
    await page.getByText(arTranslations['analytics.ui.loading_authorized_trip_data'],{exact:true}).waitFor({state:'hidden',timeout:30000});
    expect(await page.evaluate(()=>document.documentElement.dir)).toBe('rtl');
    // Real IndexedDB: same local identity must remain isolated by Project.
    const cacheProof=await page.evaluate(async()=>{
      const c=(window as any).c2,cache=c.cache,uid=c.principal();
      await cache.put('trips',{tripId:'COLLISION',projectId:'CACHE-A',value:1},uid);
      await cache.put('trips',{tripId:'COLLISION',projectId:'CACHE-B',value:2},uid);
      let ambiguous=false;try{await cache.getById('trips','COLLISION');}catch{ambiguous=true;}
      const values=[(await cache.getById('trips','COLLISION','CACHE-A')).value,(await cache.getById('trips','COLLISION','CACHE-B')).value];
      const op={operationId:'ATOMIC-RESERVATION',projectId:'CACHE-A',userId:uid,deviceId:'TEST',operationType:'UPDATE_TRIP_STATUS',payload:{tripId:'T',status:'AT_DESTINATION'},createdAt:new Date().toISOString(),retryCount:0,status:'PENDING'};
      await Promise.all([cache.insertOutboxOperation(op),cache.insertOutboxOperation(op)]);
      let conflict=false;try{await cache.insertOutboxOperation({...op,payload:{...op.payload,status:'COMPLETED'}});}catch{conflict=true;}
      await cache.delete('outbox',op.operationId);
      // Switch cache principal without granting a business identity. No other
      // principal may read or accidentally acquire the previous owner's cache.
      cache.setPrincipalProvider(()=> 'OTHER-CACHE-OWNER');
      const other=await cache.getAll('trips');
      let switchedWrite=false;try{await cache.put('trips',{tripId:'X',projectId:'CACHE-A'},uid);}catch{switchedWrite=true;}
      cache.setPrincipalProvider(()=>c.principal());
      await cache.delete('trips','COLLISION','CACHE-A',uid);await cache.delete('trips','COLLISION','CACHE-B',uid);
      return {values,ambiguous,conflict,other:other.length,switchedWrite};
    });
    expect(cacheProof).toEqual({values:[1,2],ambiguous:true,conflict:true,other:0,switchedWrite:true});
    // Actual client SDK + current production Rules: browser writes cannot forge
    // an exception decision or its server command receipt, even for an admin.
    for(const path of ['projects/'+f.projectId+'/trips/T/exceptions/FORGED','projects/'+f.projectId+'/sync_operations/EXCEPTION-CMD-FORGED']){
      expect(await page.evaluate(async(path:string)=>{try{await (window as any).c2.write(path,{projectId:path.split('/')[1],status:'RESOLVED'});return false;}catch{return true;}},path)).toBe(true);
    }
    let lost=false;
    await page.route('**/api/projects/*/trips/commands',async(route:any)=>{
      if(!lost){lost=true;await route.fetch();return route.abort();}return route.continue();
    });
    await page.evaluate(async({projectId,payload}:any)=>{await (window as any).c2.queue(projectId,payload);await (window as any).c2.sync();},{projectId:f.projectId,payload:{...fleetPayload,tareWeight:10000,grossWeight:30000}});
    const uncertain=await page.evaluate(()=>(window as any).c2.operations());expect(uncertain[0].status).toBe('AWAITING_RECEIPT');
    expect((await f.raw.collection('projects').doc(f.projectId).collection('trips').get()).size).toBe(1);
    await page.reload();await page.waitForFunction(()=>Boolean((window as any).c2?.principal()));
    await page.evaluate(()=>(window as any).c2.sync());
    const acknowledged=await page.evaluate(()=>(window as any).c2.operations());expect(acknowledged[0].status).toBe('SYNCED');
    expect(calls.filter(c=>c.method==='POST'&&c.path.endsWith('/trips/commands'))).toHaveLength(1);
    expect(calls.some(c=>c.path.endsWith('/trips/commands/receipt'))).toBe(true);
    const trips=await f.raw.collection('projects').doc(f.projectId).collection('trips').get();expect(trips.size).toBe(1);
    expect((await f.raw.doc('systemCounters/tripNumber_'+f.projectId).get()).data()!.nextNumber).toBe(2);
    const switchedUid=f.actorId+'viewer',switchedEmail=switchedUid+'@example.invalid';
    await auth.createUser({uid:switchedUid,email:switchedEmail,password,emailVerified:true});
    await f.raw.doc('users/'+switchedUid).set({userId:switchedUid,fullName:'Synthetic viewer',role:'VIEWER',assignedProjectIds:[f.projectId],status:'ACTIVE',isActive:true});
    try{
      await page.evaluate(()=>(window as any).c2.logout());
      await page.evaluate(({email,password}:any)=>(window as any).c2.login(email,password),{email:switchedEmail,password});
      await page.waitForFunction((uid:string)=>(window as any).c2.principal()===uid,switchedUid);
      expect(await page.evaluate(()=>(window as any).c2.operations())).toEqual([]);
      expect(await page.evaluate(()=>(window as any).c2.cache.getAll('trips'))).toEqual([]);
      expect(await page.evaluate(async(projectId:string)=>{try{await (window as any).c2.send(projectId,'DISPATCH_TRIP',{},'VIEWER-DENIED');return false;}catch{return true;}},f.projectId)).toBe(true);
      expect(await page.evaluate(async()=>{try{await (window as any).c2.readAll('UNASSIGNED');return false;}catch{return true;}})).toBe(true);
      await page.evaluate(()=>(window as any).c2.logout());
      await page.evaluate(({email,password}:any)=>(window as any).c2.login(email,password),{email,password});
      await page.waitForFunction((uid:string)=>(window as any).c2.principal()===uid,f.actorId);
      expect((await page.evaluate(()=>(window as any).c2.operations()))[0].status).toBe('SYNCED');
    }finally{await auth.deleteUser(switchedUid);await f.raw.doc('users/'+switchedUid).delete();}
    const canonicalId=trips.docs[0].id;
    await page.unroute('**/api/projects/*/trips/commands');
    let completionLost=false;
    await page.route('**/api/projects/*/trips/commands',async(route:any)=>{
      const body=route.request().postDataJSON();
      if(body.command==='COMPLETE_TRIP'&&!completionLost){completionLost=true;await route.fetch();return route.abort();}
      return route.continue();
    });
    await page.evaluate(async({projectId,tripId}:any)=>{
      const c=(window as any).c2;
      const arrival=await c.queueIntent(projectId,'UPDATE_TRIP_STATUS',{tripId,status:'AT_DESTINATION'});
      const receipt=await c.queueIntent(projectId,'RECORD_RECEIPT',{tripId,receiptMode:'DIRECT',destinationNetKg:19000},arrival.operationId);
      const offload=await c.queueIntent(projectId,'UPDATE_TRIP_STATUS',{tripId,status:'OFFLOADED'},receipt.operationId);
      await c.queueIntent(projectId,'UPDATE_TRIP_STATUS',{tripId,status:'COMPLETED'},offload.operationId);
      await c.sync();
    },{projectId:f.projectId,tripId:canonicalId});
    expect((await page.evaluate(()=>(window as any).c2.operations())).filter((o:any)=>o.status==='AWAITING_RECEIPT')).toHaveLength(1);
    const finalized=(await f.raw.doc('projects/'+f.projectId+'/trips/'+canonicalId).get()).data()!;
    expect(finalized.status).toBe('COMPLETED');expect(finalized.weights.destinationGrossKg).toBeUndefined();
    expect(finalized.financials.totalAmountSAR).toBe(273.13);
    const committedEvents=(await f.raw.collection('projects').doc(f.projectId).collection('trip_events').get()).size;
    const postsBefore=calls.filter(c=>c.method==='POST'&&c.path.endsWith('/trips/commands')).length;
    // Two real tabs recover the same durable completion, without mutation replay.
    const second=await context.newPage();await second.goto(base);await second.waitForFunction(()=>Boolean((window as any).c2?.principal()));
    await Promise.all([page.evaluate(()=>(window as any).c2.sync()),second.evaluate(()=>(window as any).c2.sync())]);
    expect((await page.evaluate(()=>(window as any).c2.operations())).every((o:any)=>o.status==='SYNCED')).toBe(true);
    expect(calls.filter(c=>c.method==='POST'&&c.path.endsWith('/trips/commands'))).toHaveLength(postsBefore);
    expect((await f.raw.collection('projects').doc(f.projectId).collection('trip_events').get()).size).toBe(committedEvents);
    await second.close();
    const historical=trips.docs[0].data();
    for(let offset=0;offset<1001;offset+=400){const batch=f.raw.batch();for(let i=offset;i<Math.min(offset+400,1001);i++){const id='H-'+i;batch.set(f.raw.doc('projects/'+f.projectId+'/trips/'+id),{...historical,tripId:id,tripNumber:id,clientUUID:id});}await batch.commit();}
    const all=await page.evaluate((p:string)=>(window as any).c2.readAll(p),f.projectId);expect(all).toHaveLength(1002);
    // Real report UI, actual downloaded CSV and printable document use the
    // complete canonical generation, including the row beyond the old 1,000 cap.
    await page.reload();await page.waitForFunction(()=>Boolean((window as any).c2?.principal()));
    await page.getByText('Synthetic operator',{exact:false}).first().waitFor({state:'attached'});
    if(viewport.width<1024)await page.locator('#btn-mobile-nav-toggle').click();
    await page.getByRole('button').filter({hasText:reportsLabel}).first().click();
    await page.getByText(arTranslations['analytics.ui.logistics_and_financial_reports_engine'],{exact:true}).waitFor();
    await page.getByText(arTranslations['analytics.ui.loading_authorized_trip_data'],{exact:true}).waitFor({state:'hidden',timeout:30000});
    const downloaded=page.waitForEvent('download');await page.locator('#btn-export-csv').click();
    const csv=fs.readFileSync(await (await downloaded).path(),'utf8');
    expect(csv).toContain('"1002"');expect(csv).toContain('237.5');expect(csv).not.toMatch(/undefined|NaN/);
    await page.locator('#btn-print-pdf').click();
    const print=page.locator('#printable-report-document');await print.waitFor();
    expect(await print.innerText()).toMatch(/1,002|1002|١٬٠٠٢|١٠٠٢/);
    await print.getByTitle(arTranslations['shared.actions.close']).click();
    await f.raw.doc('users/'+f.actorId).update({status:'SUSPENDED'});
    const denied=await page.evaluate(async(projectId:string)=>{try{await (window as any).c2.send(projectId,'DISPATCH_TRIP',{},'DENIED');return false;}catch{return true;}},f.projectId);expect(denied).toBe(true);
    expect((await f.raw.collection('projects').doc(f.projectId).collection('trips').get()).size).toBe(1002);
    expect(external.filter(s=>/sheets|drive|firestore.googleapis/.test(s))).toEqual([]);expect(errors).toEqual([]);
  }finally{await browser?.close();if(server)await new Promise<void>(r=>server.close(()=>r()));await auth.deleteUser(f.actorId).catch(()=>{});await f.close();}
},120000);
