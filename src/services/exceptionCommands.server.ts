import {createHash} from 'node:crypto';
import {adminDb} from '../firebase/admin';
import type {AuthUserContext} from '../types/common';
import {ProjectReadinessAdminReadContext} from './projectReadiness.server';
import {ExceptionService} from './exception.service';
import {ServerExceptionPersistenceAdapter} from './canonicalTripPersistence.server';
import {tripTransactionDatabase} from './tripCommandTransaction.server';
const fail=(code:string,status=409):never=>{throw Object.assign(Error(code),{code,status});};
const id=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(v)&&v!=='ALL';
/** Composes the existing exception domain; no new financial assessment authority. */
export class ExceptionCommandsServerService {
  constructor(private database:any=adminDb){}
  async execute(projectId:string,tripId:string,exceptionId:string,input:any,authenticated:AuthUserContext){
    if(![projectId,tripId,exceptionId].every(id)||!input||Object.keys(input).some(k=>!['command','notes','operationId'].includes(k))||!['RESOLVE','REJECT'].includes(input.command)||typeof input.notes!=='string'||!input.notes.trim()||input.notes.length>2000||typeof input.operationId!=='string'||!/^[a-zA-Z0-9_.:-]{1,256}$/.test(input.operationId))fail('INVALID_EXCEPTION_COMMAND',400);
    const fingerprint=createHash('sha256').update(JSON.stringify([tripId,exceptionId,input.command,input.notes.trim()])).digest('hex');
    return this.database.runTransaction(async(tx:any)=>{
      const actor=await new ProjectReadinessAdminReadContext(this.database,r=>tx.get(r)).currentPrincipal(projectId,authenticated);
      if(!['PROJECT_ADMIN','FINANCE_AUDITOR'].includes(actor.role))fail('FORBIDDEN_EXCEPTION_DECISION',403);
      const base=this.database.collection('projects').doc(projectId),ref=base.collection('trips').doc(tripId).collection('exceptions').doc(exceptionId);
      if(!(await tx.get(base)).exists)fail('PROJECT_NOT_FOUND',404);
      const ledger=base.collection('sync_operations').doc('EXCEPTION-CMD-'+createHash('sha256').update(actor.userId+':'+input.operationId).digest('hex'));
      const [snapshot,prior]=await Promise.all([tx.get(ref),tx.get(ledger)]);
      if(!snapshot.exists)fail('EXCEPTION_NOT_FOUND',404);
      const current=snapshot.data();if(current.projectId!==projectId||current.tripId!==tripId||current.exceptionId!==exceptionId)fail('EXCEPTION_SCOPE_MISMATCH',403);
      if(prior.exists){if(prior.data().fingerprint!==fingerprint||prior.data().createdBy!==actor.userId)fail('EXCEPTION_COMMAND_CONFLICT');return {exception:current,idempotentReplay:true};}
      if(!['OPEN','UNDER_REVIEW'].includes(current.status))fail('EXCEPTION_ALREADY_DECIDED');
      const transaction=tripTransactionDatabase(this.database,tx),domain=new ExceptionService(new ServerExceptionPersistenceAdapter(transaction.db));
      if(input.command==='RESOLVE')await domain.resolveException(projectId,tripId,exceptionId,{notes:input.notes.trim()},actor);
      else await domain.rejectException(projectId,tripId,exceptionId,{reason:input.notes.trim(),notes:input.notes.trim()},actor);
      const updated=(await transaction.db.collection('projects').doc(projectId).collection('trips').doc(tripId).collection('exceptions').doc(exceptionId).get()).data();
      tx.set(ledger,{projectId,tripId,exceptionId,operationId:input.operationId,fingerprint,createdBy:actor.userId,createdAt:new Date().toISOString(),status:'PROCESSED'});
      transaction.flush();return {exception:updated,idempotentReplay:false};
    });
  }
}
