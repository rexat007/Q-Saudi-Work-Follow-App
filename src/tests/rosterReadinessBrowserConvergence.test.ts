import {it,expect} from 'vitest';
import {build} from 'esbuild';
import express from 'express';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

// Real browser/component presentation coverage. Business authorization is
// exercised separately by the unchanged server and native authority suites.
it.each(['carrier','material'])('%s cannot advance while a fresh snapshot requires review',async kind=>{
  const bundle=await build({entryPoints:['src/tests/helpers/rosterReadinessBrowserEntry.tsx'],bundle:true,write:false,platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"'}});
  const app=express();app.get('/',(_req,res)=>res.type('html').send('<div id="root"></div><script type="module" src="/client.js"></script>'));
  app.get('/client.js',(_req,res)=>res.type('js').send(bundle.outputFiles[0].text));
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  const address=server.address();if(!address||typeof address==='string')throw Error('LOCAL_TEST_SERVER_REQUIRED');
  const base='http://127.0.0.1:'+address.port;
  let browser:any;
  try{
    const {chromium}=createRequire(resolve(process.env.QSA_BROWSER_TOOL_ROOT||'../.u07-tools','loader.cjs'))('playwright-core');
    browser=await chromium.launch({executablePath:process.env.QSA_BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-background-networking','--no-first-run']});
    const page=await browser.newPage(),errors:string[]=[];
    page.on('pageerror',(error:Error)=>errors.push(error.message));
    // Never permit this synthetic UI fixture to contact a production service.
    await page.route('**/*',(route:any)=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    await page.goto(base);await page.waitForFunction(()=>typeof (window as any).renderGate==='function');
    const render=async(patch:Record<string,unknown>)=>{
      const id=await page.evaluate(({kind,patch}:any)=>(window as any).renderGate(kind,patch),{kind,patch});
      await page.waitForSelector('[data-revision="'+id+'"]');
    };
    for(const patch of [{recommendation:'REVIEW'},{recommendation:'REJECT'},{ambiguous:true},{isAuthorized:false},{riskLevel:'HIGH'},{resolutionReason:'UNRESOLVED'},{creationDisposition:'PREPARED_NEW',preparedDriverPlan:{}}]){
      await render(patch);expect(await page.locator('button').filter({hasText:/Continue/i}).count()).toBe(0);
      expect(await page.evaluate(()=>(window as any).advances)).toBe(0);
    }
    await render({});const advance=page.locator('button').filter({hasText:/Continue/i});expect(await advance.count()).toBeGreaterThan(0);
    await advance.first().click();expect(await page.evaluate(()=>(window as any).advances)).toBe(1);
    await render({recommendation:'REVIEW'});expect(await advance.count()).toBe(0);
    expect(await page.evaluate(()=>(window as any).advances)).toBe(1);expect(errors).toEqual([]);
  }finally{
    await browser?.close();await new Promise<void>(r=>server.close(()=>r()));
  }
},60000);
