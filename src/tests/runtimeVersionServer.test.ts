import {it,expect,vi} from 'vitest';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {readRuntimeVersion} from '../../tooling/runtimeBuild';
import {runtimeVersionHandler,workspaceGenerationFence} from '../../server/runtimeVersion';
it('production version reads the built artifact, not a later checkout/deployment environment',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'q-runtime-'));try{fs.mkdirSync(path.join(root,'dist'));fs.writeFileSync(path.join(root,'dist/runtime-build.json'),JSON.stringify({buildId:'a'.repeat(40),workspaceContract:'GWS1B'}));vi.stubEnv('NODE_ENV','production');vi.stubEnv('RENDER_GIT_COMMIT','b'.repeat(40));expect(readRuntimeVersion(root)).toEqual({buildId:'a'.repeat(40),workspaceContract:'GWS1B'});fs.unlinkSync(path.join(root,'dist/runtime-build.json'));expect(readRuntimeVersion(root).buildId).toBe('UNAVAILABLE');}finally{vi.unstubAllEnvs();fs.rmSync(root,{recursive:true});}
});
it('public version response is credential-free, no-store, and guards critical commands by exact build',()=>{
 const res:any={setHeader:vi.fn(),status:vi.fn(function(){return this}),json:vi.fn(function(){return this}),set:vi.fn(function(){return this})};runtimeVersionHandler({} as any,res);const version=res.json.mock.calls[0][0];expect(Object.keys(version).sort()).toEqual(['buildId','workspaceContract']);expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','no-store');const next=vi.fn();workspaceGenerationFence({get:()=> 'old'} as any,res,next);expect(next).not.toHaveBeenCalled();expect(res.json).toHaveBeenLastCalledWith({success:false,code:'APP_UPDATE_REQUIRED'});workspaceGenerationFence({get:()=>version.buildId} as any,res,next);expect(next).toHaveBeenCalledTimes(1);
});
