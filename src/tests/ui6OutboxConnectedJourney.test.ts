import {it,expect} from 'vitest';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {setTestAuthOverride,setTestDbOverride} from '../firebase/admin';
import {emulatorFixture} from './helpers/convergence2Firestore';
import {build} from 'esbuild';
import express from 'express';
import fs from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {enTranslations as en} from '../locales/en';
it('authenticated emulator: actual Outbox receipt recovery, canonical current-role denial and actor-isolated visibility',async()=>{
 if(process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('OWNED_AUTH_EMULATOR_REQUIRED');
 const first=await emulatorFixture(),adminApp=initializeApp({projectId:'demo-convergence2'},'ui6-'+first.actorId),adminAuth=getAuth(adminApp);
 const secondId='B'+first.actorId,password='Synthetic-UI6-only-2026!',email=(id:string)=>id+'@example.invalid';let server:any,browser:any;
 const evidence=resolve(process.env.UI6_CONNECTED_EVIDENCE||'../ui6-evidence-20261121/connected');fs.mkdirSync(evidence,{recursive:true});
 const calls:string[]=[];let loseAck=true;
 try{
  for(const uid of [first.actorId,secondId])await adminAuth.createUser({uid,email:email(uid),password});
  await first.raw.doc('users/'+first.actorId).update({role:'DRIVER',linkedDriverId:'DRV'});
  await first.raw.doc('users/'+secondId).set({userId:secondId,fullName:'Owned second actor',email:email(secondId),role:'VIEWER',status:'ACTIVE',isActive:true,assignedProjectIds:[]});
  await first.raw.doc(`projects/${first.projectId}/trips/OWNED-TRIP`).set({tripId:'OWNED-TRIP',tripNumber:'EMU-UI6-1',projectId:first.projectId,driverId:'DRV',status:'IN_TRANSIT',weights:{originNetKg:20000},financials:{isFinalized:false},pricingSnapshot:{agreedRate:10},updatedBy:'original'});
  const env={VITE_FIREBASE_PROJECT_ID:'demo-convergence2',VITE_FIREBASE_API_KEY:'synthetic-emulator-key',VITE_FIREBASE_APP_ID:'ui6-owned',VITE_FIREBASE_AUTH_DOMAIN:'demo-convergence2.firebaseapp.com',VITE_FIREBASE_FIRESTORE_DATABASE_ID:'(default)'};
  const bundle=await build({entryPoints:['src/tests/helpers/ui6OutboxConnectedEntry.tsx'],bundle:true,write:false,platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"','import.meta.env':JSON.stringify(env),__APP_BUILD_ID__:'"ui6-owned-emulator"'}});
  setTestDbOverride(first.raw);setTestAuthOverride(adminAuth);const {app:production}=await import('../../server/app');const app=express();
  app.get('/',(_q,r)=>r.type('html').send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>'));
  app.get('/client.js',(_q,r)=>r.type('js').send(bundle.outputFiles[0].text));const css=fs.readdirSync('dist/assets').find(x=>x.endsWith('.css'))!;app.get('/style.css',(_q,r)=>r.sendFile(resolve('dist/assets',css)));
  app.use((q,r,next)=>{if(q.method==='POST'&&q.path.includes('/trips/commands'))calls.push(q.path);next()});app.use(production);
  server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking']});const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(15000);
  await page.route('**/*',async(route:any)=>{const url=route.request().url();if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))return route.abort();if(loseAck&&url.endsWith('/trips/commands')){loseAck=false;const response=await route.fetch({maxRetries:0});expect(response.status()).toBe(200);return route.abort('failed');}return route.continue()});await page.goto('http://127.0.0.1:'+server.address().port);
  const login=async(id:string)=>{await page.evaluate(async({email,password}:any)=>(window as any).ui6Connected.login(email,password),{email:email(id),password});await page.locator('[data-actor="'+id+'"]').getByText('AVAILABLE',{exact:true}).waitFor()};
  await login(first.actorId);await page.evaluate(async p=>(window as any).ui6Connected.queue(p),first.projectId);await page.locator('#open').click();await page.locator('[data-ui6-operation="emulator-original-arrival"]').waitFor();expect(calls).toEqual([]);
  await page.getByRole('button',{name:en['residual.ui.synchronize_now'],exact:true}).click();await page.getByText(en['ui6.help_awaiting_receipt'],{exact:true}).waitFor();expect((await first.raw.doc(`projects/${first.projectId}/trips/OWNED-TRIP`).get()).data()!.status).toBe('AT_DESTINATION');
  await page.getByRole('button',{name:en['ui6.retry_online'],exact:true}).click();await page.locator('[data-ui6-confirmed]').waitFor();expect(calls.filter(x=>!x.endsWith('/receipt'))).toHaveLength(1);expect(calls.filter(x=>x.endsWith('/receipt'))).toHaveLength(1);
  await first.raw.doc('users/'+first.actorId).update({role:'VIEWER'});await page.locator('[data-role="VIEWER"]').waitFor();await page.evaluate(async p=>(window as any).ui6Connected.queue(p,'emulator-denied-offload','OFFLOADED'),first.projectId);
  await page.locator('[data-ui6-operation="emulator-denied-offload"]').waitFor();await page.getByRole('button',{name:en['residual.ui.synchronize_now'],exact:true}).click();await page.locator('[data-ui6-operation="emulator-denied-offload"]').getByText(en['ui6.help_failed'],{exact:true}).waitFor();expect(await page.locator('[data-ui6-operation="emulator-denied-offload"] [data-ui6-confirmed]').count()).toBe(0);expect((await first.raw.doc(`projects/${first.projectId}/trips/OWNED-TRIP`).get()).data()!.status).toBe('AT_DESTINATION');expect(calls.filter(x=>!x.endsWith('/receipt'))).toHaveLength(2);
  await page.evaluate(async()=>{const w=window as any;await w.ui6Connected.logout()});await login(secondId);await page.getByText(en['ui6.empty'],{exact:true}).waitFor();expect(await page.locator('[data-ui6-operation]').count()).toBe(0);
  fs.writeFileSync(resolve(evidence,'result.json'),JSON.stringify({mode:'REAL_FIREBASE_AUTH_FIRESTORE_PRODUCTION_SERVER_COMPONENT_BROWSER',calls,lostAckRecovered:true,actorIsolation:true,currentRoleDenial:true,project:first.projectId},null,2));
 }finally{
  await browser?.close();if(server)await new Promise<void>(r=>server.close(()=>r()));setTestDbOverride(null);setTestAuthOverride(null);
  for(const id of [first.actorId,secondId])await adminAuth.deleteUser(id).catch(()=>{});await first.raw.doc('users/'+secondId).delete();await first.close();await deleteApp(adminApp);
 }
},120000);
