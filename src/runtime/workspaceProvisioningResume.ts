const KEY='q-saudi:workspace-provisioning-resume';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export interface WorkspaceContinuation {actorId:string;projectId:string;operationId:string|null;createdAt:number}
const browserStore=():Store|undefined=>{try{return typeof window==='undefined'?undefined:window.sessionStorage;}catch{return undefined;}};
export function rememberWorkspaceContinuation(actorId:string,projectId:string,operationId:string|null,store=browserStore(),now=Date.now()){
 if(!actorId||!(/^[A-Za-z0-9_-]{1,128}$/).test(projectId))return;
 try{store?.setItem(KEY,JSON.stringify({actorId,projectId,operationId,createdAt:now}));}catch{/* Navigation hints never grant authority; blocked storage cannot change server state. */}
}
export function readWorkspaceContinuation(actorId:string,store=browserStore(),now=Date.now()):WorkspaceContinuation|null{
 try{const raw=store?.getItem(KEY);if(!raw)return null;const v=JSON.parse(raw);if(v.actorId!==actorId||typeof v.projectId!=='string'||!(/^[A-Za-z0-9_-]{1,128}$/).test(v.projectId)||typeof v.createdAt!=='number'||v.createdAt>now||now-v.createdAt>3600000||v.operationId!==null&&(typeof v.operationId!=='string'||!(/^[a-f0-9]{64}$/).test(v.operationId)))return null;return v;}catch{return null;}
}
export function clearWorkspaceContinuation(actorId:string,projectId:string,store=browserStore()){
 if(readWorkspaceContinuation(actorId,store)?.projectId===projectId)try{store?.removeItem(KEY);}catch{/* Optional navigation cleanup does not mutate the durable operation. */}
}
