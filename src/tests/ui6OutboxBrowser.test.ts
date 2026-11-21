import {it,expect} from 'vitest';
import {build} from 'esbuild';
import express from 'express';
import fs from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {dictionaries} from '../locales';
import {TripCommandsServerService} from '../services/tripCommands.server';
import {buildPrincipal} from '../utils/principal';
import {accountProfile,commandDatabase} from './helpers/commandDatabase';
// Real browser IndexedDB, queue, connectivity and HTTP transport. Only identity
// acquisition and unrelated master-data metadata are controlled boundary fixtures.
const plugin={name:'owned-ui6-boundaries',setup(b:any){
 b.onLoad({filter:/[\\/]firebase[\\/]authContext\.tsx$/},()=>({loader:'tsx',contents:`export function useAuth(){return {user:{uid:'actor'},profileAuthority:'AVAILABLE',userProfile:{role:'DRIVER',status:'ACTIVE'},isProfileLoading:false}}`}));
 b.onLoad({filter:/[\\/]firebase[\\/]config\.ts$/},()=>({loader:'ts',contents:`export const auth={currentUser:{uid:'actor',getIdToken:async()=>'owned-actor'}};export const db={};`}));
 b.onLoad({filter:/[\\/]services[\\/]offline[\\/]offlineCache\.service\.ts$/},()=>({loader:'ts',contents:`export const offlineCacheService={async getCacheMetadata(){if(window.ui6.failCache)throw Error('owned-metadata-read-failure');return[]}};`}));
}};
for(const locale of ['ar','en','ur'] as const)for(const width of [320,768,1440])it(`native Edge ${locale} ${width}: actual queue, lost ACK, receipt recovery, focus and source failure`,async()=>{
 const dir=resolve(process.env.UI6_BROWSER_EVIDENCE||'../ui6-evidence-20261121/browser');fs.mkdirSync(dir,{recursive:true});
 const bundle=await build({entryPoints:['src/tests/helpers/ui6OutboxBrowserEntry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',plugins:[plugin],define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
 const fixture=commandDatabase({'users/actor':accountProfile('DRIVER','DRV-A'),'drivers/DRV-A':{driverId:'DRV-A',status:'ACTIVE'},'projects/P1/trips/T1':{tripId:'T1',tripNumber:'OWNED-1',projectId:'P1',driverId:'DRV-A',status:'IN_TRANSIT',weights:{originNetKg:20000},financials:{isFinalized:false},pricingSnapshot:{agreedRate:10},updatedBy:'original'}});
 const service=new TripCommandsServerService(fixture.db);const calls:string[]=[];let drop=true;
 const app=express();app.use(express.json());app.get('/',(_q,r)=>r.type('html').send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script>window.ui6={notices:[],failCache:false}</script><script src="/client.js"></script></body></html>'));
 app.get('/client.js',(_q,r)=>r.type('js').send(bundle.outputFiles[0].text));
 const css=fs.readdirSync('dist/assets').find(x=>x.endsWith('.css'))!;app.get('/style.css',(_q,r)=>r.sendFile(resolve('dist/assets',css)));
 const handler=async(q:express.Request,r:express.Response)=>{
  calls.push(q.path);expect(q.headers.authorization).toBe('Bearer owned-actor');
  try{const actor=buildPrincipal(fixture.store['users/actor'],'actor',{});const receipt=q.path.endsWith('/receipt');const result=await(receipt?service.receipt('P1',q.body,actor):service.execute('P1',q.body,actor));r.json({success:true,...result});}catch(e:any){r.status(403).json({success:false,code:e.code||e.message})}
 };
 app.post('/api/projects/P1/trips/commands',handler);app.post('/api/projects/P1/trips/commands/receipt',handler);
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));let browser:any;
 try{
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT!,'loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking']});
  const page=await browser.newPage({viewport:{width,height:1000}});page.setDefaultTimeout(10000);const errors:string[]=[];page.on('pageerror',(e:Error)=>errors.push(e.message));const base='http://127.0.0.1:'+(server.address() as any).port;
  await page.route('**/*',async(route:any)=>{const url=route.request().url();if(!url.startsWith(base+'/'))return route.abort();if(drop&&url.endsWith('/trips/commands')){drop=false;const response=await route.fetch({maxRetries:0});expect(response.status()).toBe(200);return route.abort('failed');}return route.continue()});await page.goto(base+'/?locale='+locale);await page.locator('#open').click();const dialog=page.getByRole('dialog');await dialog.waitFor();await page.locator('[data-ui6-operation="owned-arrival"]').waitFor();
  const t=(key:string)=>dictionaries[locale][key];expect(await dialog.getAttribute('dir')).toBe(locale==='en'?'ltr':'rtl');expect(await dialog.evaluate((x:HTMLElement)=>x.contains(document.activeElement))).toBe(true);expect(calls).toEqual([]);
  await dialog.getByRole('button',{name:t('ui6.status_failed'),exact:true}).click();await dialog.getByText(t('ui6.filtered_empty'),{exact:true}).waitFor();await dialog.getByRole('button',{name:t('admin_console.filter_all'),exact:true}).click();
  await page.getByText(t('ui6.source_availability'),{exact:true}).click();await page.evaluate(()=>(window as any).ui6.failCache=true);await page.locator('[data-ui6-source="cache"]').getByRole('button',{name:t('ui6.refresh'),exact:true}).click();await page.locator('[data-ui6-source="cache"][data-read-state="error"]').waitFor();expect(await page.locator('[data-ui6-operation="owned-arrival"]').count()).toBe(1);expect(calls).toEqual([]);await page.getByText(t('ui6.source_availability'),{exact:true}).click();
  await page.getByRole('button',{name:t('residual.ui.synchronize_now'),exact:true}).click();await page.getByText(t('ui6.help_awaiting_receipt'),{exact:true}).waitFor();expect(await page.locator('[data-ui6-confirmed]').count()).toBe(0);expect(await page.evaluate(()=>(window as any).ui6.notices.some((n:any)=>n.type==='SUCCESS'))).toBe(false);
  await page.screenshot({path:resolve(dir,`${locale}-${width}-uncertain.png`),fullPage:true});
  await page.getByRole('button',{name:t('ui6.retry_online'),exact:true}).click();await page.locator('[data-ui6-confirmed]').waitFor();expect(calls.filter(x=>!x.endsWith('/receipt'))).toHaveLength(1);expect(calls.filter(x=>x.endsWith('/receipt'))).toHaveLength(1);expect(fixture.store['projects/P1/trips/T1'].status).toBe('AT_DESTINATION');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const close=dialog.getByRole('button',{name:t('shared.actions.close'),exact:true}).last();await close.focus();await page.keyboard.press('Tab');expect(await dialog.evaluate((x:HTMLElement)=>x.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});expect(await page.locator('#open').evaluate((x:HTMLElement)=>x===document.activeElement)).toBe(true);expect(errors).toEqual([]);
  fs.writeFileSync(resolve(dir,`${locale}-${width}.json`),JSON.stringify({locale,width,browser:await browser.version(),mode:'OWNED_BOUNDARY_IDENTITY_REAL_QUEUE_INDEXEDDB_HTTP_STAGED_SERVER_NOT_EMULATOR',calls,focus:true,overflow:false,errors},null,2));
 }finally{await browser?.close();await new Promise<void>(r=>server.close(()=>r()))}
},60000);
