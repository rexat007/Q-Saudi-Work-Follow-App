import {fileURLToPath} from 'node:url';import fs from 'node:fs';import path from 'node:path';import cp from 'node:child_process';import os from 'node:os';import crypto from 'node:crypto';
const out=path.dirname(fileURLToPath(import.meta.url));const base=path.resolve(out,'..');
const roots={baseline:path.join(base,'ui3-rb1-main-20261115'),candidate:path.join(base,'ui3-setup-import-20261114')};const pins={baseline:'7be559e06025d44341aac242fe4df488d2cc899a',candidate:'90d115f09ed9b7af7bee1998903a179d2b23d2b5'};
const files=['src/tests/projectSetupLayeredWorkflow.test.tsx','src/tests/setupWizardContinuity.test.tsx','src/tests/smartImportOverlayAssurance.test.tsx'];
const env={...process.env,CI:'1'};const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(cwd,args)=>cp.execFileSync('git',['-c','safe.directory='+cwd,...args],{cwd,encoding:'utf8',windowsHide:true}).trim();
const manifest={purpose:'ONE_PAIRED_ASSESSMENT_NOT_SUITE_PASS',node:process.version,nodeExecutable:process.execPath,platform:os.platform(),release:os.release(),arch:os.arch(),cpus:os.cpus().length,environmentSha256:sha(JSON.stringify(Object.entries(env).sort())),environmentAllowlist:{CI:env.CI,TZ:env.TZ??null,NODE_OPTIONS:env.NODE_OPTIONS??null},roots,pins,files,order:'baseline then candidate; each arm uses three isolated one-file invocations in listed order; declaration test order; no retries, sleeps, timeout overrides, warning suppression or concurrent project jobs launched',limitations:['One pair cannot prove original environmental causality.','Baseline runs first; OS file cache and machine background load can differ.','No original-run CPU/memory telemetry was preserved.'],arms:[]};
for(const [arm,root] of Object.entries(roots)){if(git(root,['rev-parse','HEAD'])!==pins[arm]||git(root,['status','--porcelain']))throw Error('PIN_OR_CLEAN_FAILED_'+arm);manifest[arm+'Identity']={nodeModulesRealpath:fs.realpathSync(path.join(root,'node_modules')),files:Object.fromEntries([...files,'vitest.config.ts','package.json','package-lock.json'].map(f=>[f,sha(fs.readFileSync(path.join(root,f)))]))};}
if(manifest.baselineIdentity.nodeModulesRealpath!==manifest.candidateIdentity.nodeModulesRealpath)throw Error('DEPENDENCY_LOCATION_MISMATCH');
if(JSON.stringify(manifest.baselineIdentity.files)!==JSON.stringify(manifest.candidateIdentity.files))throw Error('TEST_CONFIG_LOCK_DIFFERENCE');
manifest.dependencyVersions=Object.fromEntries(['vitest','happy-dom','react','react-dom','vite','esbuild','typescript'].map(name=>[name,JSON.parse(fs.readFileSync(path.join(roots.candidate,'node_modules',name,'package.json'),'utf8')).version]));
manifest.nodeSha256=sha(fs.readFileSync(process.execPath));
const persist=()=>fs.writeFileSync(path.join(out,'pair-manifest.json'),JSON.stringify(manifest,null,2));persist();
for(const [arm,root] of Object.entries(roots)){
 const record={arm,head:git(root,['rev-parse','HEAD']),runs:[]};manifest.arms.push(record);persist();
 for(let i=0;i<files.length;i++){
  const stem=`${arm}-${i+1}`,logPath=path.join(out,stem+'.log'),jsonPath=path.join(out,stem+'.json');if(fs.existsSync(logPath)||fs.existsSync(jsonPath))throw Error('NO_REPEAT_OR_OVERWRITE');
  const args=['node_modules/vitest/vitest.mjs','run',files[i],'--maxWorkers=1','--no-file-parallelism','--reporter=verbose','--reporter=json','--outputFile='+jsonPath];const fd=fs.openSync(logPath,'wx');
  const run={file:files[i],cwd:root,exe:process.execPath,args,started:new Date().toISOString(),samples:[],log:logPath,json:jsonPath};record.runs.push(run);persist();
  const sample=()=>{const totals=os.cpus().reduce((a,c)=>{for(const [k,v]of Object.entries(c.times))a[k]=(a[k]||0)+v;return a;},{});run.samples.push({at:new Date().toISOString(),freeMemoryBytes:os.freemem(),totalMemoryBytes:os.totalmem(),cpuTimes:totals});};sample();const timer=setInterval(sample,1000);
  const child=cp.spawn(process.execPath,args,{cwd:root,env,stdio:['ignore',fd,fd],windowsHide:true});run.pid=child.pid;
  const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(status,signal)=>resolve({status,signal}));});clearInterval(timer);sample();fs.closeSync(fd);Object.assign(run,result);run.finished=new Date().toISOString();
  if(!fs.existsSync(jsonPath))throw Error('MISSING_REPORT_'+stem);const report=JSON.parse(fs.readFileSync(jsonPath,'utf8'));run.counts=Object.fromEntries(['numTotalTests','numPassedTests','numFailedTests','numPendingTests'].map(k=>[k,report[k]]));run.failures=report.testResults.flatMap(s=>s.assertionResults.filter(a=>a.status==='failed').map(a=>({file:files[i],fullName:a.fullName,error:a.failureMessages})));
  run.logSha256=sha(fs.readFileSync(logPath));run.reportSha256=sha(fs.readFileSync(jsonPath));persist();console.log(arm,files[i],JSON.stringify(run.counts),'nativeExit',result.status);
 }
 record.cleanAfter=git(root,['status','--porcelain'])==='';persist();if(!record.cleanAfter)throw Error('WORKTREE_CHANGED_'+arm);
}
manifest.completed=new Date().toISOString();manifest.assessmentCollected=true;persist();console.log('ONE_PAIRED_ASSESSMENT_COLLECTED; individual native exits preserved');
