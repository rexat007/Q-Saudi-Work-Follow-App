import {it,expect} from 'vitest';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {setTestDbOverride,setTestAuthOverride} from '../firebase/admin';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import express from 'express';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {arTranslations as ar} from '../locales/ar';
const poll=(callback:()=>Promise<unknown>,options?:{timeout:number})=>expect.poll(callback,{timeout:30000,...options});
const label=(key:string)=>{const value=ar[key];if(typeof value!=='string')throw Error('MISSING_TEST_LABEL:'+key);return value;};
it.each(['CSV','EXCEL'] as const)('connected actual UI %s: registration, approval, Foundation, Fleet, Import, activation, Trip, settlement, reports and recovery',async format=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('EXPLICIT_LOCAL_EMULATORS_REQUIRED');
 const id=randomUUID().replaceAll('-',''),admin=initializeApp({projectId:'demo-convergence2'},'c3-'+id),raw=getFirestore(admin),auth=getAuth(admin);
 const email='journey-'+id+'@example.invalid',ownerEmail='owner-'+id+'@example.invalid';
 let server:any,browser:any,ownerUid:string|undefined,uid:string|undefined;let stage='BOOT';const calls:any[]=[],errors:string[]=[];
 const evidence=resolve('../ui1-journey-states',format);fs.mkdirSync(evidence,{recursive:true});
 const snapshot=async(page:any,name:string)=>{stage=name;fs.writeFileSync(resolve(evidence,name+'.json'),JSON.stringify({text:await page.locator('body').innerText(),inputs:await page.locator('input,select,textarea').evaluateAll((es:any[])=>es.map(e=>({tag:e.tagName,name:e.name,type:e.type,placeholder:e.placeholder,aria:e.getAttribute('aria-label'),value:e.value}))),buttons:await page.getByRole('button').allTextContents(),calls},null,2));};
 try{
  setTestDbOverride(raw);setTestAuthOverride(auth);const {app}=await import('../../server/app');
  const env={VITE_FIREBASE_PROJECT_ID:'demo-convergence2',VITE_FIREBASE_APP_ID:'demo-convergence2',VITE_FIREBASE_API_KEY:'synthetic-emulator-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-convergence2.firebaseapp.com',VITE_FIREBASE_FIRESTORE_DATABASE_ID:'(default)'};
  const bundle=await build({entryPoints:['src/tests/helpers/convergence3BrowserEntry.tsx'],bundle:true,write:false,platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"','import.meta.env':JSON.stringify(env),__APP_BUILD_ID__:JSON.stringify('9d798dfb9dd90d8ffa19bcba5f03ac41db2cd746')}});
  const host=express();host.use((req,res,next)=>{res.on('finish',()=>calls.push({method:req.method,path:req.path,status:res.statusCode}));next();});
  host.get('/',(_req,res)=>res.type('html').send('<html dir="rtl"><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>'));
  host.get('/client.js',(_req,res)=>res.type('js').send(bundle.outputFiles[0].text));const css=fs.readdirSync('dist/assets').find(p=>p.endsWith('.css'))!;host.get('/style.css',(_req,res)=>res.type('css').send(fs.readFileSync('dist/assets/'+css)));host.use(app);
  server=host.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking']});
  const open=async()=>{const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});await context.route('**/*',(route:any)=>{const url=new URL(route.request().url());const staticAuthLibrary=url.protocol==='https:'&&url.hostname==='apis.google.com'&&(url.pathname.startsWith('/js/')||url.pathname.startsWith('/_/scs/'));return ['127.0.0.1','localhost'].includes(url.hostname)||staticAuthLibrary?route.continue():route.abort();});const page=await context.newPage();page.on('pageerror',(e:any)=>errors.push(e.message));await page.goto(base);return page;};
  const login=async(page:any,email:string)=>{
   const popupEvent=page.waitForEvent('popup');await page.getByRole('button',{name:label('auth.actions.signin_google'),exact:true}).click();const popup=await popupEvent;
   await popup.waitForLoadState('domcontentloaded');await snapshot(popup,'oauth');
   await popup.getByText('Add new account',{exact:false}).click();await snapshot(popup,'oauth-new');
   await popup.locator('#email-input').fill(email);await popup.locator('#display-name-input').fill('Synthetic Journey');await popup.getByRole('button',{name:'Sign in',exact:false}).click();await popup.waitForEvent('close');
  };
  const owner=await open();await login(owner,ownerEmail);
  ownerUid=(await auth.getUserByEmail(ownerEmail)).uid;
  // The sole seed is the existing administrator trust prerequisite. No Project,
  // identity, relationship, price, import session or Trip is seeded.
  await raw.doc('users/'+ownerUid).set({userId:ownerUid,email:ownerEmail,fullName:'Synthetic owner',role:'SUPER_ADMIN',status:'ACTIVE',isActive:true,assignedProjectIds:[]});
  await owner.getByText('Synthetic owner',{exact:false}).first().waitFor({state:'attached'});
  const page=await open();await login(page,email);uid=(await auth.getUserByEmail(email)).uid;
  await snapshot(page,'registration');
  await page.locator('input[required]').fill('Synthetic connected operator');await page.locator('select').selectOption('PROJECT_ADMIN');await page.locator('textarea').fill('Synthetic isolated connected acceptance');await page.locator('button[type=submit]').click();
  await poll(async()=>(await raw.doc('users/'+uid).get()).data()?.status).toBe('PENDING_APPROVAL');
  await snapshot(owner,'owner-navigation');
  await owner.locator('#sidebar-btn-system-tools').click();
  await owner.getByRole('button').filter({hasText:label('navigation.tools.admin_console.title')}).click();
  const row=owner.locator('tr').filter({hasText:email});await row.getByRole('button',{name:label('admin_console.btn_approve'),exact:true}).click();
  const approval=owner.locator('div.fixed').filter({has:owner.getByText(label('admin_console.approve_account_request'),{exact:true})});
  await approval.locator('select').selectOption('SUPER_ADMIN');await approval.getByRole('button',{name:label('admin_console.approve_activate_user'),exact:true}).click();
  await poll(async()=>(await raw.doc('users/'+uid).get()).data()?.status).toBe('ACTIVE');
  await page.getByText('Synthetic connected operator',{exact:false}).first().waitFor({state:'attached'});
  await page.getByRole('button').filter({hasText:label('navigation.tabs.wizard')}).first().click();
  await page.getByRole('main').getByRole('button',{name:label('navigation.labels.provision_new_project'),exact:true}).click();
  const projectForm=page.locator('form');await projectForm.locator('input[type=text]').nth(0).fill('مشروع قبول مترابط');await projectForm.locator('input[type=text]').nth(1).fill('Synthetic client');await projectForm.locator('input[type=text]').nth(2).fill('Synthetic Riyadh location');await projectForm.locator('textarea').fill('Disposable connected acceptance');await projectForm.locator('button[type=submit]').click();
  await poll(async()=>(await raw.collection('projects').where('createdBy','==',uid).get()).size).toBe(1);
  await projectForm.waitFor({state:'hidden'});
  const projectDoc=(await raw.collection('projects').where('createdBy','==',uid).get()).docs[0];
  const projectId=projectDoc.id;
  const configuration=page.getByRole('heading',{name:label('op.configuration'),exact:true}).locator('..');await configuration.waitFor();
  await configuration.locator('input[type=text]').nth(0).fill('Synthetic origin');await configuration.locator('input[type=text]').nth(1).fill('Synthetic destination');
  await configuration.getByRole('button',{name:label('op.save'),exact:true}).click();
  await poll(async()=>(await projectDoc.ref.get()).data()?.operationalConfiguration?.routeConfiguration?.loadingLocation).toBe('Synthetic origin');
  await page.getByRole('button').filter({hasText:'MATERIALS'}).click();
  await page.getByRole('button',{name:label('projects.batch4.add_material'),exact:true}).click();
  const materialForm=page.locator('form');await materialForm.locator('input[type=text]').nth(0).fill('مادة قبول '+id.slice(0,6));await materialForm.locator('input[type=text]').nth(1).fill('MAT-'+id.slice(0,8));await materialForm.locator('select').selectOption('TON');
  await materialForm.locator('button[type=submit]').click();await materialForm.waitFor({state:'hidden'});
  await poll(async()=>(await raw.collection('projects').doc(projectId).collection('material_memberships').get()).size).toBe(1);
  await page.getByRole('button').filter({hasText:'CARRIERS'}).click();
  await page.getByRole('button',{name:label('projects.labels.add_carrier'),exact:true}).click();
  const carrierName='ناقل قبول '+id.slice(0,6),digits=String(parseInt(id.slice(0,11),16)).slice(-9).padStart(9,'0');
  const carrierForm=page.locator('form');await carrierForm.locator('input[type=text]').nth(0).fill(carrierName);await carrierForm.locator('input[type=text]').nth(1).fill('1'+digits);await carrierForm.locator('button[type=submit]').click();await carrierForm.waitFor({state:'hidden'});
  await poll(async()=>(await projectDoc.ref.collection('carrier_memberships').get()).size).toBe(1);
  await page.getByRole('button').filter({hasText:'ROSTER'}).click();await page.getByRole('button',{name:label('projects.batch4.manual_add'),exact:true}).click();
  const roster=page.locator('form');await roster.locator('input[type=text]').nth(0).fill('سائق قبول');await roster.locator('input[type=text]').nth(1).fill('0501234567');await roster.locator('input[type=text]').nth(2).fill('أ ب ج '+digits.slice(-4));await roster.locator('input[type=text]').nth(3).fill('2'+digits);
  const carrierId=(await projectDoc.ref.collection('carrier_memberships').get()).docs[0].id,materialId=(await projectDoc.ref.collection('material_memberships').get()).docs[0].id;
  await roster.locator('select').nth(0).selectOption(carrierId);await roster.locator('select').nth(1).selectOption(materialId);await roster.locator('button[type=submit]').click();
  await poll(async()=>(await projectDoc.ref.collection('driver_truck_assignments').get()).size).toBe(1);
  await page.getByRole('button').filter({hasText:'PRICING'}).click();await page.getByRole('button',{name:label('projects.batch4.add_tariff'),exact:true}).click();
  const pricing=page.locator('form');await pricing.locator('select').nth(0).selectOption(carrierId);await pricing.locator('select').nth(1).selectOption(materialId);await pricing.locator('select').nth(2).selectOption('PER_TON');await pricing.locator('input[type=number]').fill('12.5');await pricing.locator('button[type=submit]').click();await pricing.waitFor({state:'hidden'});
  await poll(async()=>(await projectDoc.ref.collection('pricing_rules').get()).size).toBe(1);
  await page.getByRole('button').filter({hasText:'ROSTER'}).click();await page.getByRole('button',{name:label('projects.batch4.import_file'),exact:true}).click();
  const csv='Driver,Identity,Phone,Plate,Carrier,Material\nسائق قبول,2'+digits+',0501234567,أ ب ج '+digits.slice(-4)+','+carrierName+',مادة قبول '+id.slice(0,6)+'\n';
  const sourceWorkbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(sourceWorkbook,XLSX.utils.aoa_to_sheet(csv.trim().split('\n').map(row=>row.split(','))),'Source');
  await page.locator('input[type=file]').setInputFiles(format==='CSV'?{name:'connected-source.csv',mimeType:'text/csv',buffer:Buffer.from(csv)}:{name:'connected-source.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:XLSX.write(sourceWorkbook,{type:'buffer',bookType:'xlsx'})});
  await page.getByRole('button',{name:label('projects.labels.approve_mapping_analyze_log'),exact:true}).waitFor({state:'visible',timeout:45000});
  await snapshot(page,'import-mapping');
  await page.getByRole('button',{name:label('projects.labels.approve_mapping_analyze_log'),exact:true}).click();
  for(const [name,key] of [['carrier','entityResolution.labels.continue_material_review'],['material','entityResolution.labels.continue_driver_truck_review'],['fleet','entityResolution.labels.continue_final_review']] as const){
    const dialog=page.getByRole('dialog').last();
    const expected=name==='carrier'?[carrierId]:name==='material'?[materialId]:[(await projectDoc.ref.collection('driver_memberships').get()).docs[0].id,(await projectDoc.ref.collection('truck_memberships').get()).docs[0].id];
    for(const identity of expected){
      const select=dialog.locator('select').filter({has:page.locator('option[value="'+identity+'"]')});
      await select.waitFor({state:'visible',timeout:45000});await select.selectOption(identity);
      await select.locator('..').getByRole('button').click();
    }
    const next=page.getByRole('button',{name:label(key),exact:true}).first();await next.waitFor({state:'visible',timeout:45000});await snapshot(page,'import-'+name+'-accepted');await next.click();
  }
  const acceptIntent=page.getByRole('button',{name:label('intent.accept'),exact:true});await acceptIntent.waitFor({state:'visible',timeout:45000});await snapshot(page,'reviewed-intent');await acceptIntent.click();
  const commit=page.getByRole('button',{name:label('entityResolution.labels.approve_commit_import'),exact:true}).first();await commit.waitFor({state:'visible',timeout:45000});
  const warnings=page.getByText(label('entityResolution.labels.accept_warning_records'),{exact:true});if(await warnings.count())await warnings.locator('..').locator('input[type=checkbox]').check();
  await snapshot(page,'import-final-review');await commit.click();
  await poll(async()=>(await projectDoc.ref.collection('importExecutions').get()).docs.map(d=>d.data().state),{timeout:45000}).toContain('COMPLETED');
  await poll(async()=>(await projectDoc.ref.collection('importSessions').get()).docs.map(d=>d.data().lifecycleState)).toContain('COMMITTED');
  await snapshot(page,'import-execution');await page.getByRole('button',{name:label('entityResolution.labels.finish_import'),exact:true}).click();
  await page.getByRole('button').filter({hasText:'REVIEW_ACTIVATION'}).click();
  await page.getByRole('button',{name:label('projects.batch4.submit_review'),exact:true}).click();
  await poll(async()=>(await projectDoc.ref.get()).data()?.status).toBe('READY_FOR_REVIEW');
  await page.getByRole('button',{name:label('projects.batch4.approve_setup'),exact:true}).click();
  await poll(async()=>(await projectDoc.ref.get()).data()?.status).toBe('APPROVED');
  await snapshot(page,'activation-ready');await page.getByRole('button',{name:label('projects.batch4.activate_operations'),exact:true}).click();
  await poll(async()=>(await projectDoc.ref.get()).data()?.status,{timeout:30000}).toBe('ACTIVE');
  await poll(async()=>await page.locator('#sidebar-project-quick-selector option[value="'+projectId+'"]').textContent()).toContain('ACTIVE');
  await snapshot(page,'project-active');
  await page.getByRole('button',{name:label('ui1.open_operations'),exact:true}).click();
  expect(await page.locator('#sidebar-project-quick-selector').inputValue()).toBe(projectId);
  await page.getByRole('heading',{name:label('ui1.new_trip'),exact:true}).waitFor();
  await page.getByRole('button',{name:label('op.manage_roster'),exact:true}).click();
  await page.getByRole('button',{name:label('projects.batch4.manual_add'),exact:true}).waitFor();
  expect(await page.locator('#sidebar-project-quick-selector').inputValue()).toBe(projectId);
  await page.locator('#sidebar-tab-field-operations').click();
  await page.getByRole('heading',{name:label('ui1.new_trip'),exact:true}).waitFor();
  await page.locator('#sidebar-tab-wizard').click();
  await poll(async()=>await page.getByRole('button',{name:label('ui1.open_operations'),exact:true}).isEnabled()).toBe(true);
  expect(await page.locator('main h2').filter({hasText:label('projects.batch4.layer_roster')}).count()).toBe(0);
  expect(await page.getByRole('button',{name:label('projects.batch4.manual_add'),exact:true}).count()).toBe(0);
  expect(await page.locator('#sidebar-project-quick-selector').inputValue()).toBe(projectId);
  await page.locator('#sidebar-tab-field-operations').click();
  await page.getByRole('heading',{name:label('ui1.title'),exact:true}).waitFor();
  const truckId=(await projectDoc.ref.collection('truck_memberships').get()).docs[0].id;
  await page.getByLabel(label('op.truck'),{exact:false}).selectOption(truckId);
  let lostDispatch=false,lostCompletion=false;
  await page.route('**/trips/commands',async(route:any)=>{const body=route.request().postDataJSON();if(body.command==='DISPATCH_TRIP'&&!lostDispatch){lostDispatch=true;await route.fetch();await route.abort();}else if(body.command==='COMPLETE_TRIP'&&!lostCompletion){lostCompletion=true;await route.fetch();await route.abort();}else await route.continue();});
  await page.locator('[data-trip-command=DISPATCH_TRIP]').click();
  await poll(async()=>(await projectDoc.ref.collection('trips').get()).size).toBe(1);
  await page.getByTestId('adaptive-receipt-recovery').waitFor();await snapshot(page,'dispatch-ack-lost');
  await page.reload();await page.locator('#sidebar-project-quick-selector').selectOption(projectId);await page.locator('#sidebar-tab-field-operations').click();
  await page.getByTestId('adaptive-receipt-recovery').getByRole('button').click();
  await page.getByTestId('adaptive-receipt-recovery').waitFor({state:'hidden'});
  expect((await projectDoc.ref.collection('trips').get()).size).toBe(1);
  const tripDoc=(await projectDoc.ref.collection('trips').get()).docs[0];
  await page.getByLabel(label('op.trip'),{exact:false}).selectOption(tripDoc.id);
  for(const [command,status] of [['ARRIVE_ORIGIN','AT_ORIGIN'],['START_LOADING','LOADING'],['RECORD_ORIGIN_WEIGHT','WEIGHED_ORIGIN'],['START_TRANSIT','IN_TRANSIT'],['RECORD_ARRIVAL','AT_DESTINATION'],['RECORD_DESTINATION_WEIGHT','WEIGHED_DESTINATION'],['COMPLETE_UNLOADING','OFFLOADED'],['COMPLETE_TRIP','COMPLETED']]){
    if(command.includes('WEIGHT')){await page.getByLabel(label('op.tare'),{exact:true}).fill('10000');await page.getByLabel(label('op.gross'),{exact:true}).fill(command==='RECORD_ORIGIN_WEIGHT'?'30000':'29000');await page.getByLabel(label('op.ticket'),{exact:true}).fill('TICKET-'+command);}
    await page.locator('[data-trip-command='+command+']').click();
    await poll(async()=>(await tripDoc.ref.get()).data()?.status).toBe(status);
    await snapshot(page,'trip-'+status);
  }
  const completed=(await tripDoc.ref.get()).data()!;
  expect(completed.financials.isFinalized).toBe(true);expect(completed.financials.totalAmountSAR).toBe(273.13);
  await page.getByTestId('adaptive-receipt-recovery').waitFor();
  const eventsBefore=(await projectDoc.ref.collection('trip_events').get()).size,postsBefore=calls.filter(c=>c.method==='POST'&&c.path.endsWith('/trips/commands')).length;
  const second=await page.context().newPage();await second.goto(base);await second.locator('#sidebar-project-quick-selector').selectOption(projectId);await second.locator('#sidebar-tab-field-operations').click();
  await page.reload();await page.locator('#sidebar-project-quick-selector').selectOption(projectId);await page.locator('#sidebar-tab-field-operations').click();
  await Promise.all([page.getByTestId('adaptive-receipt-recovery').getByRole('button').click(),second.getByTestId('adaptive-receipt-recovery').getByRole('button').click()]);
  await page.getByTestId('adaptive-receipt-recovery').waitFor({state:'hidden'});
  expect(calls.filter(c=>c.method==='POST'&&c.path.endsWith('/trips/commands'))).toHaveLength(postsBefore);
  expect((await projectDoc.ref.collection('trip_events').get()).size).toBe(eventsBefore);await second.close();
  await snapshot(page,'trip-completed');
  await page.getByRole('button').filter({hasText:label('navigation.tabs.reports_engine')}).first().click();
  await page.getByRole('heading',{name:label('op.reporting'),exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.getByLabel(label('op.family'),{exact:false}).selectOption('WEIGHT_RECONCILIATION');
  await poll(async()=>await page.locator('main').innerText()).toContain(tripDoc.id);
  const download=page.waitForEvent('download');await page.locator('#btn-export-csv').click();const csvReport=fs.readFileSync(await(await download).path(),'utf8');expect(csvReport).toContain(tripDoc.id);expect(csvReport).not.toMatch(/undefined|NaN/);
  const excel=page.waitForEvent('download');await page.locator('#btn-export-xlsx').click();const workbook=XLSX.read(fs.readFileSync(await(await excel).path()));expect(JSON.stringify(workbook.Sheets)).toContain(tripDoc.id);
  await page.locator('#btn-print-pdf').click();const printable=page.locator('#printable-report-document');await printable.waitFor();expect(await printable.innerText()).toContain(tripDoc.id);await page.pdf({path:resolve(evidence,'connected-report.pdf'),format:'A4',printBackground:true});await printable.getByTitle(label('shared.actions.close')).click();
  await page.getByRole('button',{name:label('op.financial_reports'),exact:true}).click();await page.locator('#btn-export-csv').waitFor();await snapshot(page,'financial-report');
  const financialDownload=page.waitForEvent('download');await page.locator('#btn-export-csv').click();const financialCsv=fs.readFileSync(await(await financialDownload).path(),'utf8');expect(financialCsv).toContain('237.5');
  let reportTrips=1;
  if(format==='CSV'){
    // Source-grounded synthetic reconciliation scale, AFTER the unseeded live
    // workflow passes. Every added record explicitly derives from that Trip.
    for(let start=0;start<1001;start+=400){const batch=raw.batch();for(let n=start;n<Math.min(start+400,1001);n++){const key='RECON-'+n;batch.set(projectDoc.ref.collection('trips').doc(key),{...completed,tripId:key,tripNumber:key,clientUUID:key,sourceMetadata:{reconciliationSourceTripId:tripDoc.id,syntheticAcceptance:true}});}await batch.commit();}
    reportTrips=1002;
    await page.setViewportSize({width:1440,height:1000});await page.locator('#sidebar-tab-field-operations').click();await page.getByRole('button').filter({hasText:label('navigation.tabs.reports_engine')}).first().click();
    await page.getByRole('heading',{name:label('op.reporting'),exact:true}).waitFor();await page.getByLabel(label('op.family'),{exact:false}).selectOption('WEIGHT_RECONCILIATION');
    await poll(async()=>await page.locator('main tbody tr').count()).toBe(1002);
    const scaleDownload=page.waitForEvent('download');await page.locator('#btn-export-csv').click();const scaleCsv=fs.readFileSync(await(await scaleDownload).path(),'utf8');expect(scaleCsv.split('\r\n')).toHaveLength(1003);expect(scaleCsv).toContain('RECON-1000');expect(scaleCsv).toContain(tripDoc.id);
    const scaleExcel=page.waitForEvent('download');await page.locator('#btn-export-xlsx').click();const scaleWorkbook=XLSX.read(fs.readFileSync(await(await scaleExcel).path()));expect(JSON.stringify(scaleWorkbook.Sheets)).toContain('RECON-1000');
    await page.getByLabel(label('op.family'),{exact:false}).selectOption('DAILY');await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}))).toEqual({width:390,viewport:390});
    await page.screenshot({path:resolve(evidence,'mobile-1002-report.png'),fullPage:true});
    await page.locator('#btn-print-pdf').click();const scalePrint=page.locator('#printable-report-document');await scalePrint.waitFor();expect(await scalePrint.innerText()).toMatch(/1,002|1002|١٬٠٠٢|١٠٠٢/);await scalePrint.getByTitle(label('shared.actions.close')).click();
  }
  await page.setViewportSize({width:1440,height:1000});
  await row.getByRole('button',{name:label('admin_console.btn_suspend'),exact:true}).click();await poll(async()=>(await raw.doc('users/'+uid).get()).data()?.status).toBe('SUSPENDED');
  await page.locator('#sidebar-tab-field-operations').waitFor({state:'hidden'});expect((await projectDoc.ref.collection('trips').get()).size).toBe(reportTrips);expect((await tripDoc.ref.get()).data()?.financials).toEqual(completed.financials);
  await owner.getByRole('button',{name:label('admin_console.tab_audit'),exact:false}).click();await snapshot(owner,'audit-and-revocation');
  expect(errors).toEqual([]);
  fs.writeFileSync(resolve(evidence,'connected-result.json'),JSON.stringify({result:'PASS',reportTrips,projectId,tripId:tripDoc.id,import:'COMMITTED',status:'COMPLETED',totalAmountSAR:completed.financials.totalAmountSAR,eventsBefore,postsBefore,receiptLookups:calls.filter(c=>c.path.endsWith('/trips/commands/receipt')).length,calls},null,2));
 }catch(error){if(browser){for(const context of browser.contexts()){for(const page of context.pages()){if(!page.isClosed())await snapshot(page,'failure-'+stage).catch(()=>{});}}}throw error;}
 finally{
  await browser?.close();if(uid){const projects=await raw.collection('projects').where('createdBy','==',uid).get();for(const doc of projects.docs){await raw.recursiveDelete(doc.ref);await raw.doc('systemCounters/tripNumber_'+doc.id).delete();}for(const kind of ['carriers','materials','trucks','drivers']){const records=await raw.collection(kind).where('createdBy','==',uid).get();for(const doc of records.docs)await raw.recursiveDelete(doc.ref);}}if(server)await new Promise<void>(r=>server.close(()=>r()));for(const userId of [uid,ownerUid])if(userId){await raw.doc('users/'+userId).delete();await auth.deleteUser(userId).catch(()=>{});}await deleteApp(admin);
 }
},180000);
