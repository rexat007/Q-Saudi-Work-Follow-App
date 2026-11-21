import {it,expect} from 'vitest';import {initializeApp,deleteApp} from 'firebase-admin/app';import {getAuth} from 'firebase-admin/auth';
import {setTestAuthOverride,setTestDbOverride} from '../firebase/admin';import {emulatorFixture} from './helpers/convergence2Firestore';
import {build} from 'esbuild';import express from 'express';import fs from 'node:fs';import {resolve} from 'node:path';import {createRequire} from 'node:module';import {arTranslations as ar} from '../locales/ar';
it('UI5 authenticated App: verified account/driver decisions, partial sequence, current-role denial and last-admin protection',async()=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('EXPLICIT_LOCAL_EMULATORS_REQUIRED');
 const first=await emulatorFixture(),second=await emulatorFixture(),authApp=initializeApp({projectId:'demo-convergence2'},'ui5-auth-'+first.actorId),auth=getAuth(authApp),email=(id:string)=>id+'@example.invalid',password='SyntheticOnly-UI5-2026!',targetId='UI5T'+first.actorId,duplicateId='UI5D'+first.actorId,retiredTargetId='UI5R'+first.actorId;
 const evidence=resolve(process.env.UI5_CONNECTED_EVIDENCE||'../ui5-evidence-20261115/connected');fs.mkdirSync(evidence,{recursive:true});let server:any,browser:any;const stages:string[]=[];
 const checkpoint=(stage:string)=>{stages.push(stage);console.log('UI5_CONNECTED_STAGE',stage);fs.writeFileSync(resolve(evidence,'stages.json'),JSON.stringify(stages));};
 const target={userId:targetId,fullName:'UI5 Synthetic Pending',email:email(targetId),role:'VIEWER',requestedRole:'DRIVER',status:'PENDING_APPROVAL',isActive:false,assignedProjectIds:[first.projectId],createdAt:'2026-11-15T00:00:00Z',updatedAt:'2026-11-15T00:00:00Z',createdBy:first.actorId,updatedBy:first.actorId};
 try{
  for(const fixture of [first,second]){await auth.createUser({uid:fixture.actorId,email:email(fixture.actorId),password});await fixture.raw.doc('users/'+fixture.actorId).update({email:email(fixture.actorId),role:'SUPER_ADMIN',assignedProjectIds:[first.projectId,second.projectId]});}
  await first.raw.doc('users/'+targetId).set(target);checkpoint('SEEDED');
  const env={VITE_FIREBASE_PROJECT_ID:'demo-convergence2',VITE_FIREBASE_APP_ID:'demo-convergence2',VITE_FIREBASE_API_KEY:'synthetic-emulator-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-convergence2.firebaseapp.com',VITE_FIREBASE_FIRESTORE_DATABASE_ID:'(default)'};
  const bundle=await build({entryPoints:['src/tests/helpers/ui5ConnectedBrowserEntry.tsx'],bundle:true,write:false,platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"','import.meta.env':JSON.stringify(env),__APP_BUILD_ID__:JSON.stringify('ui5-local-emulator')}});
  setTestDbOverride(first.raw);setTestAuthOverride(auth);const {app:serverApp}=await import('../../server/app');const app=express(),css=fs.readdirSync('dist/assets').find(p=>p.endsWith('.css'))!;
  app.get('/',(_q,r)=>r.type('html').send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>'));app.get('/client.js',(_q,r)=>r.type('js').send(bundle.outputFiles[0].text));app.get('/style.css',(_q,r)=>r.sendFile(resolve('dist/assets',css)));app.use(serverApp);server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking']});const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);await page.route('**/*',(route:any)=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());await page.goto('http://127.0.0.1:'+server.address().port);
  const login=async(id:string)=>{await page.evaluate(async({email,password}:any)=>{await(window as any).ui5Connected.login(email,password);},{email:email(id),password});await page.locator('#sidebar-btn-system-tools').waitFor();await page.locator('#sidebar-btn-system-tools').click();await page.locator('#drawer-tool-ADMIN_CONSOLE').click();await page.getByTestId('ui5-account-review').waitFor();await page.locator('[data-read-source="users"]').getByText(ar['ui5.loaded'],{exact:true}).waitFor();};
  const api=async(id:string,command:Record<string,unknown>)=>{const token=await page.evaluate(()=>(window as any).ui5Connected.token());const response=await page.request.post('http://127.0.0.1:'+server.address().port+'/api/admin/users/'+id+'/commands',{headers:{Authorization:'Bearer '+token},data:command});return {status:response.status(),body:await response.json()};};
  const logs=async()=>{const snapshot=await first.raw.collection('audit_logs').where('entityId','==',targetId).get();return snapshot.docs.map((doc:any)=>({id:doc.id,...doc.data()}));};
  await login(first.actorId);checkpoint('ADMIN_READY');
  const selfRow=page.locator('tbody tr').filter({hasText:first.actorId});expect(await selfRow.getByRole('button',{name:ar['admin_console.btn_suspend'],exact:true}).count()).toBe(0);
  const row=page.locator('tbody tr').filter({hasText:targetId});await row.getByRole('button',{name:ar['admin_console.btn_approve'],exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:ar['admin_console.approve_activate_user'],exact:true}).click();await page.locator('[data-decision-status="confirmed"]').waitFor();expect((await first.raw.doc('users/'+targetId).get()).data()).toMatchObject({role:'DRIVER',status:'ACTIVE',isActive:true});expect((await logs()).filter((log:any)=>log.command==='approveAccount')).toHaveLength(1);checkpoint('APPROVAL_ACK_READBACK');
  const selfDenied=await api(first.actorId,{command:'changeUserRole',newRole:'SUPER_ADMIN'});expect(selfDenied).toMatchObject({status:409,body:{code:'SELF_ADMIN_ACTION_BLOCKED'}});
  await page.locator('[data-review-user="'+targetId+'"]').click();const binding=page.getByRole('combobox',{name:ar['admin_console.driver_binding'],exact:true});await binding.selectOption('DRV');await page.getByRole('button',{name:ar['admin_console.driver_link'],exact:true}).click();await page.getByText('DRV',{exact:true}).waitFor();expect((await first.raw.doc('users/'+targetId).get()).data().linkedDriverId).toBe('DRV');
  await page.getByRole('button',{name:ar['admin_console.driver_unlink'],exact:true}).click();await page.getByText(ar['admin_console.driver_not_linked'],{exact:true}).waitFor();expect((await first.raw.doc('users/'+targetId).get()).data().linkedDriverId).toBeUndefined();checkpoint('DRIVER_LINK_UNLINK');
  await first.raw.doc('users/'+duplicateId).set({...target,userId:duplicateId,role:'DRIVER',status:'ACTIVE',isActive:true,linkedDriverId:'DRV'});await binding.selectOption('DRV');await page.getByRole('button',{name:ar['admin_console.driver_link'],exact:true}).click();await page.getByText(ar['admin_console.errors.driver_linked'],{exact:true}).first().waitFor();expect((await first.raw.doc('users/'+targetId).get()).data().linkedDriverId).toBeUndefined();await first.raw.doc('users/'+duplicateId).delete();checkpoint('DRIVER_UNIQUENESS_DENIED');
  await first.raw.doc('users/'+retiredTargetId).set({...target,userId:retiredTargetId,email:email(retiredTargetId),fullName:'UI5 Retirement Synthetic',status:'ACTIVE',isActive:true});
  await page.locator('[data-read-source="users"]').getByRole('button',{name:ar['ui5.reload'],exact:true}).click();
  await page.locator('[data-read-source="users"]').getByText(ar['ui5.loaded'],{exact:true}).waitFor();
  // Hold a genuine server ACK after its transaction committed; restore the actor's old role.
  const retiredCommands:string[]=[];
  let releaseAck!:()=>void,markAckReady!:()=>void,markAckDelivered!:()=>void;
  const ackGate=new Promise<void>(resolve=>{releaseAck=resolve;});
  const ackReady=new Promise<void>(resolve=>{markAckReady=resolve;});
  const ackDelivered=new Promise<void>(resolve=>{markAckDelivered=resolve;});
  await page.route('**/api/admin/users/'+retiredTargetId+'/commands',async(route:any)=>{
   const command=route.request().postDataJSON().command;retiredCommands.push(command);
   const response=await route.fetch();
   if(command==='changeUserRole'){markAckReady();await ackGate;}
   await route.fulfill({response});if(command==='changeUserRole')markAckDelivered();
  });
  await page.getByRole('button',{name:ar['admin_console.tab_users'],exact:true}).click();
  await page.locator('[data-review-user="'+retiredTargetId+'"]').click();
  await page.getByRole('combobox',{name:ar['admin_console.role_assignment'],exact:true}).selectOption('SUPERVISOR');
  await page.locator('label').filter({hasText:second.projectId}).getByRole('checkbox').check();
  await page.getByRole('button',{name:ar['admin_console.save_matrix'],exact:true}).click();
  await ackReady;
  expect((await first.raw.doc('users/'+retiredTargetId).get()).data()).toMatchObject({role:'SUPERVISOR',assignedProjectIds:[first.projectId]});
  await first.raw.doc('users/'+first.actorId).update({role:'PROJECT_ADMIN'});
  await page.getByText(ar['ui5.read_only'],{exact:true}).waitFor();
  await first.raw.doc('users/'+first.actorId).update({role:'SUPER_ADMIN'});
  await page.getByText(ar['ui5.read_only'],{exact:true}).waitFor({state:'hidden'});
  await page.locator('[data-read-source="users"]').getByText(ar['ui5.loaded'],{exact:true}).waitFor();
  releaseAck();await ackDelivered;
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  expect(await page.locator('[data-decision-status="confirmed"]').count()).toBe(0);
  expect(await page.getByText(ar['ui5.pending'],{exact:true}).count()).toBe(0);
  expect(retiredCommands).toEqual(['changeUserRole']);checkpoint('PUB01_AUTHORIZATION_ABA_ACK_RETIRED');
  await page.locator('[data-review-user="'+targetId+'"]').click();
  await page.getByRole('combobox',{name:ar['admin_console.role_assignment'],exact:true}).selectOption('VIEWER');const projectLabel=page.locator('label').filter({hasText:second.projectId});await projectLabel.getByRole('checkbox').check();await first.raw.doc('projects/'+second.projectId).delete();await page.getByRole('button',{name:ar['admin_console.save_matrix'],exact:true}).click();await page.locator('[data-decision-status="partial"]').waitFor();expect((await first.raw.doc('users/'+targetId).get()).data()).toMatchObject({role:'VIEWER',assignedProjectIds:[first.projectId]});const audit=await logs();expect(audit.filter((log:any)=>log.command==='changeUserRole')).toHaveLength(1);expect(audit.filter((log:any)=>log.command==='replaceAssignedProjects')).toHaveLength(0);checkpoint('REAL_PARTIAL_SEQUENCE');
  await first.raw.doc('users/'+first.actorId).update({role:'PROJECT_ADMIN'});await page.getByText(ar['ui5.read_only'],{exact:true}).waitFor();expect(await page.getByRole('button',{name:ar['admin_console.save_matrix'],exact:true}).count()).toBe(0);const denied=await api(targetId,{command:'suspendAccount'});expect(denied).toMatchObject({status:403,body:{code:'FORBIDDEN_ADMIN_ACTION'}});expect((await first.raw.doc('users/'+targetId).get()).data().status).toBe('ACTIVE');checkpoint('CURRENT_ROLE_REVOKED');
  await page.evaluate(async()=>{await(window as any).ui5Connected.logout();});await login(second.actorId);const last=await api(second.actorId,{command:'suspendAccount'});expect(last).toMatchObject({status:409,body:{code:'LAST_SUPER_ADMIN_PROTECTED'}});expect((await second.raw.doc('users/'+second.actorId).get()).data()).toMatchObject({role:'SUPER_ADMIN',status:'ACTIVE'});checkpoint('LAST_SUPER_ADMIN_PRESERVED');
  const retiredState=(await first.raw.doc('users/'+retiredTargetId).get()).data();
  const retiredAudit=await first.raw.collection('audit_logs').where('entityId','==',retiredTargetId).get();
  expect(retiredCommands).toEqual(['changeUserRole']);
  expect(retiredState).toMatchObject({role:'SUPERVISOR',assignedProjectIds:[first.projectId]});
  expect(retiredAudit.docs.map((doc:any)=>doc.data().command)).toEqual(['changeUserRole']);
  const authorizationRetirement={mode:'REAL_HTTP_ACK_AFTER_SERVER_COMMIT',roleRoundTrip:['SUPER_ADMIN','PROJECT_ADMIN','SUPER_ADMIN'],httpCommands:retiredCommands,subsequentProjectRequests:0,persistedRole:retiredState.role,persistedProjects:retiredState.assignedProjectIds,auditCommands:retiredAudit.docs.map((doc:any)=>doc.data().command),staleConfirmedState:false};
  await page.screenshot({path:resolve(evidence,'final.png'),fullPage:true});fs.writeFileSync(resolve(evidence,'result.json'),JSON.stringify({mode:'AUTHENTICATED_LOOPBACK_APP',syntheticData:true,liveGoogle:false,authorizationRetirement,authoritativeReadback:true,driverBinding:true,driverUniquenessDenied:true,partialSequence:true,projectAdminReadOnly:true,currentRoleDenial:denied,selfDenial:selfDenied,lastAdminDenial:last,auditCommands:audit.map((log:any)=>({id:log.id,command:log.command})),stages},null,2));
 }catch(error){if(browser)for(const context of browser.contexts())for(const page of context.pages())if(!page.isClosed())fs.writeFileSync(resolve(evidence,'failure.json'),JSON.stringify({stages,text:await page.locator('body').innerText()},null,2));throw error;}
 finally{await browser?.close();if(server)await new Promise<void>(r=>server.close(()=>r()));setTestDbOverride(null);setTestAuthOverride(null);for(const id of [targetId,duplicateId,retiredTargetId])await first.raw.doc('users/'+id).delete().catch(()=>{});const audit=await first.raw.collection('audit_logs').where('actor.userId','in',[first.actorId,second.actorId]).get();for(const doc of audit.docs)await doc.ref.delete();for(const fixture of [first,second]){await auth.deleteUser(fixture.actorId).catch(()=>{});await fixture.close();}await deleteApp(authApp);}
},180000);
