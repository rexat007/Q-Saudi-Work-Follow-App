import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
/** One build identity, compiled into JS and emitted next to HTML for the server.
 * Render's immutable commit is permitted; dirty local builds get a deterministic diff digest. */
export function resolveBuildId():string {
  const supplied=process.env.APP_BUILD_ID || process.env.RENDER_GIT_COMMIT;
  if(supplied && /^[a-f0-9]{40}$/i.test(supplied))return supplied.toLowerCase();
  try {
    const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
    const diff=execFileSync('git',['diff','HEAD','--'],{encoding:'utf8'});
    const untracked=execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort();
    const hash=createHash('sha256').update(diff);
    for(const file of untracked){hash.update(file);hash.update(readFileSync(file));}
    return diff || untracked.length?`${sha}.local-${hash.digest('hex').slice(0,12)}`:sha;
  } catch {
    // Some sandbox/build systems forbid spawning git. Read repository metadata without
    // a child process and suffix a deterministic digest of actual build inputs.
    try {
      const root=process.cwd(),dot=path.join(root,'.git');
      const dir=statSync(dot).isDirectory()?dot:path.resolve(root,readFileSync(dot,'utf8').trim().replace(/^gitdir: /,''));
      const common=existsSync(path.join(dir,'commondir'))?path.resolve(dir,readFileSync(path.join(dir,'commondir'),'utf8').trim()):dir;
      const head=readFileSync(path.join(dir,'HEAD'),'utf8').trim();let sha=head;
      if(head.startsWith('ref: ')){
        const ref=head.slice(5),refFile=path.join(common,ref);
        sha=existsSync(refFile)?readFileSync(refFile,'utf8').trim():readFileSync(path.join(common,'packed-refs'),'utf8').split('\n').find(line=>line.endsWith(' '+ref))?.split(' ')[0]||'';
      }
      if(!/^[a-f0-9]{40}$/.test(sha))return 'UNAVAILABLE';
      const digest=createHash('sha256');
      const visit=(relative:string)=>{const file=path.join(root,relative);if(!existsSync(file))return;if(statSync(file).isDirectory()){for(const name of readdirSync(file).sort())visit(path.join(relative,name));}else{digest.update(relative);digest.update(readFileSync(file));}};
      for(const name of ['src','server','tooling','public','server.ts','vite.config.ts','index.html','package.json','package-lock.json','tsconfig.json'])visit(name);
      return `${sha}.local-${digest.digest('hex').slice(0,12)}`;
    } catch {return 'UNAVAILABLE';}
  }
}
export function readRuntimeVersion(root=process.cwd()) {
  if(process.env.NODE_ENV!=='production')return {buildId:resolveBuildId(),workspaceContract:'GWS1B'};
  // Never advertise a new checkout SHA while serving an older dist artifact.
  try {const v=JSON.parse(readFileSync(path.join(root,'dist/runtime-build.json'),'utf8'));if(typeof v.buildId==='string'&&/^[a-f0-9]{40}(?:\.local-[a-f0-9]{12})?$/.test(v.buildId)&&v.workspaceContract==='GWS1B')return {buildId:v.buildId,workspaceContract:'GWS1B'};}catch{/* fail closed */}
  return {buildId:'UNAVAILABLE',workspaceContract:'GWS1B'};
}
