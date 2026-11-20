import type {UserEntity} from '../../types/entities';
import type {AdminAccountCommand} from '../../services/adminAccountClient.service';

export type FailureKind = 'rejected' | 'unknown' | 'not-sent';
export type DecisionStatus = 'confirmed' | 'conflict' | 'partial' | 'unresolved' | 'failed' | 'readback';
export type DecisionResult = {status:DecisionStatus;targetId:string;acknowledged:number;total:number;expected:Record<string,unknown>;steps:{command:AdminAccountCommand['command'];acknowledged:boolean}[];error?:unknown};
export function accountCommandFields(command:AdminAccountCommand):Record<string,unknown> {
 switch(command.command) {
  case 'approveAccount': return {role:command.approvedRole,assignedProjectIds:[...command.assignedProjectIds],status:'ACTIVE',isActive:true,...(command.approvedRole!=='DRIVER'?{linkedDriverId:null}:{})};
  case 'rejectAccount': return {status:'REJECTED',isActive:false,rejectionReason:command.rejectionReason.trim()};
  case 'suspendAccount': return {status:'SUSPENDED',isActive:false};
  case 'reactivateAccount': return {status:'ACTIVE',isActive:true};
  case 'changeUserRole': return {role:command.newRole,...(command.newRole!=='DRIVER'?{linkedDriverId:null}:{})};
  case 'replaceAssignedProjects': return {assignedProjectIds:[...command.assignedProjectIds]};
  case 'linkDriverIdentity': return {linkedDriverId:command.linkedDriverId};
  case 'unlinkDriverIdentity': return {linkedDriverId:null};
 }
}
export function accountFieldsMatch(user:UserEntity|null,expected:Record<string,unknown>):boolean {
 if(!user)return false;
 return Object.entries(expected).every(([key,value])=>{
  const actual=(user as unknown as Record<string,unknown>)[key];
  if(key==='assignedProjectIds')return Array.isArray(actual)&&Array.isArray(value)&&JSON.stringify([...actual].sort())===JSON.stringify([...value].sort());
  return (actual??null)===(value??null);
 });
}
/** Presentation orchestration only: commands and canonical reads retain their existing authorities. */
export async function runAccountDecision(targetId:string,commands:readonly AdminAccountCommand[],port:{
 isCurrent:()=>boolean;
 execute:(command:AdminAccountCommand,onFailure:(kind:FailureKind)=>void)=>Promise<{userId?:string}>;
 read:()=>Promise<UserEntity|null>;
 onRead:(user:UserEntity|null)=>void;
}):Promise<DecisionResult|undefined> {
 let acknowledged=0,expected:Record<string,unknown>={};
 const result=(status:DecisionStatus,error?:unknown):DecisionResult=>({status,targetId,acknowledged,total:commands.length,expected:{...expected},steps:commands.map((command,index)=>({command:command.command,acknowledged:index<acknowledged})),error});
 for(const command of commands){
  if(!port.isCurrent())return;
  let failure:FailureKind='unknown';
  try {
   const ack=await port.execute(command,kind=>{failure=kind;});
   if(!port.isCurrent())return;
   if(ack?.userId!==targetId)return result('unresolved');
   acknowledged++;expected={...expected,...accountCommandFields(command)};
  } catch(error){
   if(!port.isCurrent())return;
   return result(failure==='unknown'?'unresolved':acknowledged?'partial':'failed',error);
  }
  try {
   if(!port.isCurrent())return;
   const fresh=await port.read();if(!port.isCurrent())return;
   port.onRead(fresh);
   if(!port.isCurrent())return;
   if(!accountFieldsMatch(fresh,expected))return result('conflict');
  } catch(error){if(port.isCurrent())return result('readback',error);return;}
 }
 return port.isCurrent()?result('confirmed'):undefined;
}
