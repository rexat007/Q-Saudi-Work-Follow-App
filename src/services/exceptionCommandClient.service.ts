import {auth} from '../firebase/config';
import {assertLegacyClient} from './runtimeClient.service';
export async function sendExceptionDecision(projectId:string,tripId:string,exceptionId:string,command:'RESOLVE'|'REJECT',notes:string,operationId:string){
  assertLegacyClient();const actor=auth.currentUser;if(!actor)throw Error('UNAUTHENTICATED');
  const token=await actor.getIdToken();if(auth.currentUser?.uid!==actor.uid)throw Error('AUTH_CONTEXT_CHANGED');
  const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/trips/${encodeURIComponent(tripId)}/exceptions/${encodeURIComponent(exceptionId)}/commands`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({command,notes,operationId})});
  const result=await response.json();if(auth.currentUser?.uid!==actor.uid)throw Error('AUTH_CONTEXT_CHANGED');
  if(!response.ok||!result.success)throw Object.assign(Error('EXCEPTION_DECISION_UNCONFIRMED'),{code:result.code,status:response.status});
  return result;
}
