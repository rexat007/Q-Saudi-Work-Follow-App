import {createHash,randomUUID} from 'node:crypto';
import {gwsFail,GoogleWorkspaceCommandError,type GoogleBlueprintPort} from './projectGoogleWorkspace.server';
export type ManagedFolderRole='WORKSPACE_ROOT'|'PROJECTS_ROOT';
export const managedRootKey=(subject:string)=>createHash('sha256').update('Q_SAUDI_WORK_FOLLOW:'+subject).digest('hex');
export const managedRootRef=(db:any,key:string)=>db.collection('workspace_drive_roots').doc(key);
/** Account-scoped shared roots, with receipts in the same server database and atomic Drive tags. */
export class WorkspaceManagedDriveRoot {
 constructor(private db:any,private authorize:(tx:any)=>Promise<unknown>){}
 async ensure(key:string,google:GoogleBlueprintPort,expectedProjectsRootId?:string):Promise<string>{
  const owner=randomUUID(),ref=managedRootRef(this.db,key);
  await this.db.runTransaction(async(tx:any)=>{await this.authorize(tx);const s=(await tx.get(ref)).data()||{};if(s.owner&&s.expiresAt>Date.now())return gwsFail('WORKSPACE_ROOT_IN_PROGRESS');if(s.subjectHash&&s.subjectHash!==key)return gwsFail('WORKSPACE_ROOT_IDENTITY_CONFLICT');tx.set(ref,{...s,subjectHash:key,owner,expiresAt:Date.now()+120000,revision:(s.revision||0)+1});});
  const save=async(patch:Record<string,unknown>)=>this.db.runTransaction(async(tx:any)=>{await this.authorize(tx);const s=(await tx.get(ref)).data();if(s?.owner!==owner||s.expiresAt<=Date.now())return gwsFail('WORKSPACE_EXECUTION_FENCED');tx.set(ref,{...s,...patch,expiresAt:Date.now()+120000,revision:s.revision+1});});
  google.setDeliveryFence?.(()=>save({}));
  const ensureFolder=async(role:ManagedFolderRole,parentId:string|null,name:string)=>{
   const s=(await ref.get()).data(),idField=role==='WORKSPACE_ROOT'?'applicationRootId':'projectsRootId',intentField=role==='WORKSPACE_ROOT'?'applicationCreateIntent':'projectsCreateIntent';
   if(s[idField]){await google.verifyManagedFolder!(s[idField],key,role,parentId);return s[idField] as string;}
   const found=await google.findManagedFolders!(key,role);
   if(found.length>1)return gwsFail('WORKSPACE_ROOT_IDENTITY_CONFLICT');
   let id:string;
   if(found.length===1){id=found[0].id;await google.verifyManagedFolder!(id,key,role,parentId);}
   else{
    if(expectedProjectsRootId||s[intentField])return gwsFail('WORKSPACE_ROOT_RECOVERY_REQUIRED');
    await save({[intentField]:true});
    try{id=await google.createManagedFolder!(name,parentId,key,role);}
    catch(error){
      // Only an acknowledged provider rejection proves that this create did not commit.
      // Network/timeout/5xx/missing-ID outcomes keep the intent permanently fenced.
      if(error instanceof GoogleWorkspaceCommandError&&[400,401,403,429].includes(error.status)&&['GOOGLE_RATE_LIMITED','GOOGLE_QUOTA_EXCEEDED','GOOGLE_PERMISSION_DENIED','GOOGLE_INVALID_REQUEST','TOKEN_EXPIRED','API_ACCESS_DISABLED','SCOPE_DENIED'].includes(error.code))await save({[intentField]:false});
      throw error;
    }
   }
   await save({[idField]:id});await google.verifyManagedFolder!(id,key,role,parentId);return id;
  };
  try{
   if(!google.findManagedFolders||!google.createManagedFolder||!google.verifyManagedFolder)return gwsFail('WORKSPACE_ROOT_AUTHORITY_REQUIRED');
   const root=await ensureFolder('WORKSPACE_ROOT',null,'Q Saudi Work Follow');
   const projects=await ensureFolder('PROJECTS_ROOT',root,'Projects');if(expectedProjectsRootId&&projects!==expectedProjectsRootId)return gwsFail('WORKSPACE_ROOT_IDENTITY_CONFLICT');await save({status:'READY',lastBoundedError:null});return projects;
  }catch(error){await save({status:'ATTENTION_REQUIRED',lastBoundedError:error instanceof GoogleWorkspaceCommandError?error.code:'WORKSPACE_ROOT_ENSURE_FAILED'});throw error;}
  finally{await this.db.runTransaction(async(tx:any)=>{const s=(await tx.get(ref)).data();if(s?.owner===owner)tx.set(ref,{...s,owner:null,expiresAt:0});});}
 }
}
