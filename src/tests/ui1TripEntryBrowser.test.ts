import {it,expect} from 'vitest';
import {build} from 'esbuild';
import express from 'express';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import fs from 'node:fs';
import {arTranslations} from '../locales/ar';
import {enTranslations} from '../locales/en';
import {urTranslations} from '../locales/ur';
const dictionaries={ar:arTranslations,en:enTranslations,ur:urTranslations};
// Synthetic presentation boundary only. Real canonical HTTP/Outbox recovery is
// covered by convergence3Journey and unchanged command/recovery suites.
it.each((['ar','en','ur'] as const).flatMap(locale=>[390,768,1440].map(width=>({locale,width}))))('UI1 $locale at $width: labels, focus, blockers and receipt states',async({locale,width})=>{
 const stub={name:'ui1-owned-fixture',setup(b:any){
  b.onResolve({filter:/projectReadTransport|pricingRule.repository|trip.repository|durableTripCommandClient.service|offline\/outbox.service/},(args:any)=>({path:args.path,namespace:'ui1'}));
  b.onLoad({filter:/.*/,namespace:'ui1'},(args:any)=>({contents:args.path.includes('projectReadTransport')?'export const canonicalProjectRead=(...args)=>window.ui1.fleet(...args);':args.path.includes('pricingRule.repository')?'export const pricingRuleRepository={listByProject:(...args)=>window.ui1.pricing(...args)};':args.path.includes('trip.repository')?'export const tripRepository={subscribeByProject:(p,cb)=>{cb([]);return()=>{}}};':args.path.includes('durableTripCommandClient')?'export const durableTripCommand=(...args)=>window.ui1.send(...args);export const pendingTripOperations=async()=>window.ui1.operations;export const recoverTripOperation=(...args)=>window.ui1.recover(...args);':'export const outboxService={subscribe:fn=>{window.ui1.listener=fn;return()=>{}},getOperations:async()=>[]};',loader:'js'}));
 }};
 const bundle=await build({entryPoints:['src/tests/helpers/ui1BrowserEntry.tsx'],bundle:true,write:false,platform:'browser',format:'esm',plugins:[stub],define:{'process.env.NODE_ENV':'"test"'}});
 const css=fs.readdirSync('dist/assets').find(f=>f.endsWith('.css'));if(!css)throw Error('VERIFIED_BUILD_CSS_REQUIRED');
 const app=express();app.get('/',(_req,res)=>res.type('html').send('<html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>'));
 app.get('/client.js',(_req,res)=>res.type('js').send(bundle.outputFiles[0].text));app.get('/style.css',(_req,res)=>res.sendFile(resolve('dist/assets',css)));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const address=server.address();if(!address||typeof address==='string')throw Error('LOCAL_SERVER_REQUIRED');const base='http://127.0.0.1:'+address.port;
 let browser:any;
 try{
  const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT||'../.u07-tools','loader.cjs'))('playwright-core');browser=await chromium.launch({executablePath:process.env.QSA_BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking','--no-first-run']});
  const page=await browser.newPage({viewport:{width,height:1000}}),errors:string[]=[];page.on('pageerror',(e:Error)=>errors.push(e.message));await page.route('**/*',(route:any)=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  page.setDefaultTimeout(5000);console.log('UI1_BROWSER_STAGE',locale,width,'NAVIGATING');
  await page.goto(base+'/?locale='+locale);const t=(key:string)=>dictionaries[locale][key];
  console.log('UI1_BROWSER_STAGE',locale,width,'WAITING_FOR_UI');
  await page.getByRole('heading',{name:t('ui1.new_trip'),exact:true}).waitFor();console.log('UI1_BROWSER_STAGE',locale,width,'UI_READY');expect(await page.evaluate(()=>document.documentElement.dir)).toBe(locale==='en'?'ltr':'rtl');
  await page.keyboard.press('Tab');expect(await page.getByRole('button',{name:t('ui1.open_operations'),exact:true}).evaluate((e:HTMLElement)=>document.activeElement===e)).toBe(true);await page.keyboard.press('Enter');expect(await page.evaluate(()=>(window as any).ui1.opened)).toBe('SYNTHETIC-PROJECT');
  await page.getByLabel(t('op.truck'),{exact:true}).selectOption('NO-DRIVER');expect(await page.locator('#ui1-blockers').innerText()).toContain(t('ui1.block.driver'));expect(await page.locator('[data-trip-command="DISPATCH_TRIP"]').isDisabled()).toBe(true);
  await page.getByLabel(t('op.truck'),{exact:true}).selectOption('TRUCK');expect(await page.locator('[data-trip-command="DISPATCH_TRIP"]').isEnabled()).toBe(true);
  console.log('UI1_BROWSER_STAGE',locale,width,'DISPATCH');
  await page.locator('[data-trip-command="DISPATCH_TRIP"]').click();await page.getByTestId('adaptive-receipt-recovery').waitFor();expect(await page.getByTestId('ui1-confirmation').count()).toBe(0);expect(await page.locator('[data-trip-command="DISPATCH_TRIP"]').isDisabled()).toBe(true);
  await page.getByRole('button',{name:t('ui1.recover'),exact:true}).click();await page.getByTestId('ui1-confirmation').waitFor();expect(await page.getByTestId('ui1-confirmation').innerText()).toContain('SERVER-123');expect(await page.evaluate(()=>({send:(window as any).ui1.sendCalls,recover:(window as any).ui1.recoverCalls}))).toEqual({send:1,recover:1});
  await page.getByRole('button',{name:t('ui1.continue'),exact:true}).click();expect(await page.locator('#ui1-current-trip').evaluate((e:HTMLElement)=>document.activeElement===e)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  const folder=resolve('../ui1-browser-final-captures');fs.mkdirSync(folder,{recursive:true});await page.screenshot({path:resolve(folder,locale+'-'+width+'.png'),fullPage:true});
 }catch(error){console.error('UI1_BROWSER_FAILURE',locale,width,String(error));throw error;}finally{await browser?.close();await new Promise<void>(r=>server.close(()=>r()));}
},30000);
