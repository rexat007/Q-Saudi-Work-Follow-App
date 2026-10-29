import React,{useRef,useState} from 'react';
import {useI18n} from '../../i18n';
import {SetupMutationSession,setupCommand} from '../../services/setupOrchestration.service';
import {projectCanonicalRefreshService,type ProjectCanonicalRefreshSnapshot} from '../../services/projectCanonicalRefresh.service';
import {setupErrorKey} from '../../i18n/setupErrors';
/** Only status cleanup on nonmutable Projects, through the existing canonical pricing save command. */
export function PricingCleanupAction({projectId,rule,isCurrent,apply}:{projectId:string;rule:any;isCurrent:()=>boolean;apply:(snapshot:ProjectCanonicalRefreshSnapshot)=>void}){
 const {t}=useI18n(),session=useRef(new SetupMutationSession()).current,receipt=useRef<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 return <span><button disabled={busy} onClick={async()=>{if(!isCurrent())return;setBusy(true);setError(null);try{await session.run(projectId,async()=>{receipt.current=await setupCommand(projectId,`pricing-rules/${rule.pricingRuleId}/save`,{status:'INACTIVE',expectedVersion:rule.version||1});return receipt.current;},isCurrent,apply,async()=>{const snapshot=await projectCanonicalRefreshService.refresh(projectId,{isCurrent});if(!snapshot.pricingRules?.some(r=>r.pricingRuleId===rule.pricingRuleId&&r.status==='INACTIVE'&&r.version===receipt.current?.version))throw Error('REFRESH_INCOHERENT');return snapshot;});}catch(e:any){if(isCurrent())setError(session.committed?'rb2.refresh_pending':setupErrorKey(e));}finally{if(isCurrent())setBusy(false);}}}>{t(session.committed?'setup.retry':'rb2.deactivate_pricing')}</button>{error&&<span role="alert">{t(error)}</span>}</span>;
}
