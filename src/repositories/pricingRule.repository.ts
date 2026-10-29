import { auth } from '../firebase/config';
import { decodePricing } from '../utils/persistenceBoundary';
import type { PricingRuleEntity } from '../types/entities';
/** Client transport only. No local-cache or browser Firestore commercial authority. */
export class PricingRuleRepository {
  private async request(p:string,suffix='',body?:any){
    if(!p || p==='ALL') throw Error('INVALID_PROJECT_ID');
    const token=await auth.currentUser?.getIdToken();if(!token)throw Error('UNAUTHENTICATED');
    const res=await fetch(`/api/projects/${encodeURIComponent(p)}/pricing-rules${suffix}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const json=await res.json();if(!res.ok||!json.success)throw Object.assign(new Error(json.code||json.error||'PRICING_REQUEST_FAILED'),{code:json.code});
    if(body && typeof window!=='undefined')window.dispatchEvent(new Event('pricing-rules-updated'));
    return json.data;
  }
  async listByProject(p:string):Promise<PricingRuleEntity[]>{const rows=await this.request(p);return rows.map((r:any)=>decodePricing<PricingRuleEntity>(r,r.pricingRuleId,p));}
  async findById(projectId:string,pricingRuleId:string):Promise<PricingRuleEntity|null>{return (await this.listByProject(projectId)).find(r=>r.pricingRuleId===pricingRuleId)||null;}
  async create(rule:any){await this.request(rule.projectId,'',rule);}
  async update(p:string,id:string,updates:any,_actor:string){await this.request(p,`/${encodeURIComponent(id)}/update`,updates);}
  async listByProjectInTransaction(_p:string,_tx:any):Promise<PricingRuleEntity[]>{throw Error('SERVER_PRICING_TRANSACTION_REQUIRED');}
  subscribeByProject(p:string,onData:(rules:PricingRuleEntity[])=>void){
    let active=true,sequence=0;
    const load=async()=>{const version=++sequence;try{const rules=await this.listByProject(p);if(active&&version===sequence)onData(rules);}catch{if(active&&version===sequence)onData([]);}};
    void load();const timer=setInterval(()=>void load(),5000);
    if(typeof window!=='undefined')window.addEventListener('pricing-rules-updated',load);
    return()=>{active=false;sequence++;clearInterval(timer);if(typeof window!=='undefined')window.removeEventListener('pricing-rules-updated',load);};
  }
}
export const pricingRuleRepository=new PricingRuleRepository();
