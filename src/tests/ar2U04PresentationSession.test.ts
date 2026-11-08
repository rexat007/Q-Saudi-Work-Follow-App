import {it,expect,vi} from 'vitest';
import {BoundedProjectReadSession} from '../services/boundedProjectReadSession';
import {SQL_SETUP_STAGES,type FoundationSummary,type BoundedProjectPage} from '../types/boundedProjectReads';
import {PROJECT_SETUP_LAYERS} from '../services/projectSetupWorkflow.service';
const summary=(project='Q-PRJ-A',revision='1'):FoundationSummary=>({data:{projectExternalId:project,status:'SETUP',projectRevision:revision,sourceRevision:revision,
  foundationRevision:null,stale:true,readinessState:'INCOMPLETE',counts:{carriers:0,materials:0,drivers:0,trucks:24},workspaceStatus:'UNBOUND',
  setupStages:SQL_SETUP_STAGES.map(stage=>({stage,state:'PENDING'}))},meta:{backendEpoch:'isolated',generatedAt:new Date().toISOString()}});
const page=(project='Q-PRJ-A',revision='1'):BoundedProjectPage=>({projectExternalId:project,stage:'ROSTER',kind:'TRUCK',items:[],nextCursor:null,hasMore:false,
  sourceRevision:revision,fullSnapshot:false,meta:{backendEpoch:'isolated',generatedAt:new Date().toISOString()}});
const fixture=()=>{const port={summary:vi.fn(),page:vi.fn()};return {port,session:new BoundedProjectReadSession(port)};};
it('stage vocabulary exactly matches the existing Setup Wizard workflow',()=>{expect([...SQL_SETUP_STAGES]).toEqual(PROJECT_SETUP_LAYERS.map(s=>s.id));});
it('idle entry has no fetch, polling or offline replacement side effects',()=>{
  const {session,port}=fixture();session.enter('Q-PRJ-A','actor','isolated');expect(port.summary).not.toHaveBeenCalled();expect(port.page).not.toHaveBeenCalled();expect(session.current()).toEqual({summary:null,page:null});
});
it.each(['project','principal','epoch','empty','dispose'])('rejects late rendering across %s changes',mode=>{
  const {session}=fixture();session.enter('Q-PRJ-A','actor','isolated');const token=session.capture();
  if(mode==='project')session.enter('Q-PRJ-B','actor','isolated');if(mode==='principal')session.enter('Q-PRJ-A','other','isolated');
  if(mode==='epoch')session.enter('Q-PRJ-A','actor','next');if(mode==='empty'){session.enter(null,'actor','isolated');session.enter('Q-PRJ-A','actor','isolated');}if(mode==='dispose')session.dispose();
  expect(session.acceptSummary(token,summary())).toBe(false);expect(session.acceptPage(token,page())).toBe(false);expect(session.current()).toEqual({summary:null,page:null});
});
it('a newer summary clears an earlier page and rejects late earlier revisions',()=>{
  const {session}=fixture();session.enter('Q-PRJ-A','actor','isolated');const token=session.capture();
  expect(session.acceptSummary(token,summary())).toBe(true);expect(session.acceptPage(token,page())).toBe(true);
  expect(session.acceptSummary(token,summary('Q-PRJ-A','2'))).toBe(true);expect(session.current().page).toBeNull();
  expect(session.acceptSummary(token,summary())).toBe(false);expect(session.acceptPage(token,page())).toBe(false);
});
it('partial pages never claim collection completeness even when the last page is empty',()=>{
  const {session}=fixture();session.enter('Q-PRJ-A','actor','isolated');expect(session.acceptPage(session.capture(),page())).toBe(true);
  expect(session.current().page?.fullSnapshot).toBe(false);
});
it('explicit summary loads coalesce within a generation and require invalidation to refresh',async()=>{
  const {session,port}=fixture();session.enter('Q-PRJ-A','actor','isolated');port.summary.mockResolvedValue(summary());
  await Promise.all([session.loadSummary(),session.loadSummary(),session.loadSummary()]);expect(port.summary).toHaveBeenCalledTimes(1);
  await session.loadSummary();expect(port.summary).toHaveBeenCalledTimes(1);session.invalidate();await session.loadSummary();expect(port.summary).toHaveBeenCalledTimes(2);
});
it('late or failed explicit loads never substitute empty canonical data',async()=>{
  const {session,port}=fixture();session.enter('Q-PRJ-A','actor','isolated');let finish!:(value:FoundationSummary)=>void;
  port.summary.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));const pending=session.loadSummary();
  session.enter('Q-PRJ-B','actor','isolated');finish(summary());expect(await pending).toBeNull();expect(session.current().summary).toBeNull();
  port.summary.mockRejectedValue(Error('UNAVAILABLE'));await expect(session.loadSummary()).rejects.toThrow('UNAVAILABLE');expect(session.current().summary).toBeNull();
});
