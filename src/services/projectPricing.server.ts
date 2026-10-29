import { assertFoundationMutation, type FoundationMutationClass } from './projectMutability.policy';
import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { ProjectReadinessAdminReadContext } from './projectReadiness.server';
import { PricingRuleValidator } from '../validators/pricingRule.validator';
import { PricingService, canonicalPricingRule, canonicalPricingDate, pricingInstant, pricingResolutionWindow } from './pricing.service';
import { decodePricing, decodeScopedProjection, decodeGlobal, decodeProject } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import type { AuthUserContext } from '../types/common';
import type { PricingRuleEntity } from '../types/entities';
const policy = new PricingService();
const fail = (code:string):never => {throw Object.assign(new Error(code),{code,status:400});};
const id = (s:any) => typeof s==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(s) && !['ALL','ALL_MATERIALS'].includes(s);
const mapped = canonicalPricingRule;
export class ProjectPricingServerService {
  constructor(private database?:any) {}
  private get db(){return this.database || adminDb;}
  private async actor(tx:any,p:string,c:AuthUserContext,write=false){
    const a=await new ProjectReadinessAdminReadContext(this.db,ref=>tx.get(ref)).currentPrincipal(p,c);
    if(write && !['SUPER_ADMIN','PROJECT_ADMIN','FINANCE_AUDITOR'].includes(a.role)) fail('FORBIDDEN_PRICING_ACTION');
    return a;
  }
  private async participation(tx:any,p:string,carrierId:string,materialId?:string,writing?:FoundationMutationClass){
    if(!id(carrierId)||materialId && !id(materialId))fail('INVALID_PRICING_IDENTITY');
    const project=await tx.get(this.db.collection('projects').doc(p));if(!project.exists)fail('PROJECT_NOT_FOUND');
    const projectData=decodeProject<any>(project.data(),p);
    if(writing){try{assertFoundationMutation(projectData.status,writing);}catch{fail('PROJECT_READ_ONLY');}}
    if(writing==='CONSISTENCY_CLEANUP')return;
    for(const [kind,entityId] of [['carrier',carrierId],...(materialId ? [['material',materialId]]:[])]){
      const member=await tx.get(this.db.collection('projects').doc(p).collection(kind+'_memberships').doc(entityId));
      const global=await tx.get(this.db.collection(kind+'s').doc(entityId));
      if(!member.exists||!global.exists)fail('PRICING_PARTICIPATION_REQUIRED');
      const m=decodeScopedProjection<any>(member.data(),kind+'Id',entityId,p,['ACTIVE','SUSPENDED','REMOVED']);
      const g=decodeGlobal<any>(global.data(),kind as 'carrier'|'material',entityId);
      if(m.status!=='ACTIVE'||g.status!=='ACTIVE')fail('PRICING_PARTICIPATION_REQUIRED');
    }
  }
  private async rules(tx:any,p:string){const snap=await tx.get(this.db.collection('projects').doc(p).collection('pricing_rules'));return snap.docs.map((d:any)=>decodePricing<PricingRuleEntity>(d.data(),d.id,p));}
  async listPricingRules(p:string,c:AuthUserContext){
    return this.db.runTransaction(async(tx:any)=>{
      await this.actor(tx,p,c);
      return this.listPricingRulesInTransaction(tx,p);
    });
  }
  /** Caller owns current-principal authorization and the shared transaction snapshot. */
  async listPricingRulesInTransaction(tx:any,p:string){
      const rules=await this.rules(tx,p);
      const trips=await tx.get(this.db.collection('projects').doc(p).collection('trips'));
      return rules.map((r:any)=>{const canonical=mapped(r);return {...r,status:canonical.status,isActive:canonical.status==='ACTIVE',pricingModel:canonical.pricingType,baseRateSAR:canonical.rate,hasHistoricalTrips:trips.docs.some((d:any)=>{const t=d.data();return t.pricingRuleId===r.pricingRuleId||t.pricingSnapshot?.pricingRuleId===r.pricingRuleId;})};});
  }
  /** Internal server query, composed inside the caller's transaction-backed database. */
  async resolvePricing(p:string,carrierId:string,materialId:string,date:string,requestedId?:string){
    return this.db.runTransaction(async(tx:any)=>{
      await this.participation(tx,p,carrierId,materialId);
      const result=policy.resolvePricingRuleFromList((await this.rules(tx,p)).map(mapped),{projectId:p,carrierId,materialId,tripDate:date});
      if(result.status!=='RESOLVED')fail(result.reasonCode || 'MISSING_PRICING');
      if(!Number.isFinite(result.selectedRule!.rate)||result.selectedRule!.rate<=0)fail('INVALID_PRICING_RULE');
      if(!['PER_TON','PER_TRIP'].includes(result.selectedRule!.pricingType))fail('UNSUPPORTED_PRICING_MODEL');
      if(requestedId && result.selectedRule!.pricingRuleId!==requestedId)fail('PRICING_SELECTION_MISMATCH');
      return {...result.selectedRule!,pricingModel:result.selectedRule!.pricingType,baseRateSAR:result.selectedRule!.rate,agreedRate:result.selectedRule!.rate};
    });
  }
  async createPricingRule(p:string,payload:any,c:AuthUserContext):Promise<PricingRuleEntity>{return this.write(p,payload,c);}
  async updatePricingRule(p:string,ruleId:string,payload:any,c:AuthUserContext):Promise<PricingRuleEntity>{if(!id(ruleId))fail('INVALID_PRICING_IDENTITY');return this.write(p,payload,c,ruleId);}
  /** One UI command: unused rules edit safely; used commercial changes create a successor. */
  async savePricingRule(p:string,ruleId:string,payload:any,c:AuthUserContext):Promise<PricingRuleEntity>{
    if(!id(ruleId))fail('INVALID_PRICING_IDENTITY');return this.write(p,payload,c,ruleId,true);
  }
  private async write(p:string,payload:any,c:AuthUserContext,editing?:string,allowReplacement=false):Promise<PricingRuleEntity>{
    if(!id(p)||!payload||typeof payload!=='object'||Array.isArray(payload))fail('INVALID_PRICING_COMMAND');
    const allowed=['pricingRuleId','projectId','carrierId','materialId','name','pricingModel','pricingType','baseRateSAR','rate','currency','effectiveFrom','effectiveTo','notes','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable','vatRatePercent','status','isActive','createdBy','updatedBy','expectedVersion'];
    if(Object.keys(payload).some(k=>!allowed.includes(k)))fail('INVALID_PRICING_COMMAND');
    return this.db.runTransaction(async(tx:any)=>{
      const actor=await this.actor(tx,p,c,true);
      const ruleId=editing || payload.pricingRuleId;if(!id(ruleId))fail('INVALID_PRICING_IDENTITY');
      const ref=this.db.collection('projects').doc(p).collection('pricing_rules').doc(ruleId),snap=await tx.get(ref);
      if(editing && !snap.exists)fail('PRICING_RULE_NOT_FOUND');if(!editing && snap.exists)fail('PRICING_RULE_ALREADY_EXISTS');
      const old=editing ? decodePricing<any>(snap.data(),ruleId,p):null;
      if(editing && payload.expectedVersion!== (old.version || 1))fail('PRICING_VERSION_CONFLICT');
      const input={...old,...payload}, canonicalOld=old ? mapped(old):null, model=payload.pricingModel ?? payload.pricingType ?? canonicalOld?.pricingType, rate=payload.baseRateSAR ?? payload.rate ?? canonicalOld?.rate;
      const materialId=['ALL','ALL_MATERIALS','GENERAL','*','',null,undefined].includes(input.materialId)?undefined:input.materialId;
      const from=canonicalPricingDate(input.effectiveFrom),to=input.effectiveTo?canonicalPricingDate(input.effectiveTo):undefined;
      if(!from || input.effectiveTo && !to || to && pricingInstant(to,true)!<pricingInstant(from)!)fail('INVALID_PRICING_DATE');
      if(!Number.isFinite(rate)||rate<=0)fail('INVALID_PRICING_RULE');
      if(!['PER_TRIP','PER_TON'].includes(model))fail('UNSUPPORTED_PRICING_MODEL');
      const status=payload.status ?? (payload.isActive!==undefined ? (payload.isActive ? 'ACTIVE':'INACTIVE'):canonicalOld?.status || 'ACTIVE');if(!['ACTIVE','INACTIVE'].includes(status))fail('INVALID_PRICING_STATUS');
      for(const key of ['name','notes','currency'])if(input[key]!==undefined && typeof input[key]!=='string')fail('INVALID_PRICING_RULE');
      for(const key of ['minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours'])if(input[key]!==undefined && (!Number.isFinite(input[key])||input[key]<0))fail('INVALID_PRICING_RULE');
      for(const key of ['vatApplicable','isActive'])if(input[key]!==undefined && typeof input[key]!=='boolean')fail('INVALID_PRICING_RULE');
      if(input.vatRatePercent!==undefined && (!Number.isFinite(input.vatRatePercent)||input.vatRatePercent<0||input.vatRatePercent>100))fail('INVALID_COMMERCIAL_TERMS');
      const now=new Date().toISOString();
      const rule:any=sanitizeUndefined({pricingRuleId:ruleId,projectId:p,carrierId:input.carrierId,materialId,name:input.name?.trim() || ruleId,pricingModel:model,baseRateSAR:rate,currency:input.currency || 'SAR',effectiveFrom:from,effectiveTo:to,notes:input.notes?.trim() || undefined,minimumBillableWeightKg:input.minimumBillableWeightKg,demurrageRatePerHourSAR:input.demurrageRatePerHourSAR ?? (old ? undefined:50),freeTimeHours:input.freeTimeHours ?? (old ? undefined:2),vatApplicable:input.vatApplicable ?? (old ? undefined:true),vatRatePercent:input.vatRatePercent ?? 15,parentRuleId:old?.parentRuleId,supersededByRuleId:old?.supersededByRuleId,supersededFrom:old?.supersededFrom,status,isActive:status==='ACTIVE',version:(old?.version || 0)+1,createdAt:old?.createdAt || now,createdBy:old?.createdBy || actor.userId,updatedAt:now,updatedBy:actor.userId});
      const valid=PricingRuleValidator.validate(rule);if(!valid.isValid)fail('INVALID_PRICING_RULE');
      const all=await this.rules(tx,p);
      const trips=old ? await tx.get(this.db.collection('projects').doc(p).collection('trips')):null;
      const linked=trips?.docs.some((d:any)=>{const t=d.data();return t.pricingRuleId===ruleId||t.pricingSnapshot?.pricingRuleId===ruleId;});
      const commercial=['carrierId','materialId','pricingModel','baseRateSAR','currency','effectiveFrom','effectiveTo','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable','vatRatePercent'];
      const normalizedOld=old ? {...old,materialId:canonicalOld!.materialId,pricingModel:canonicalOld!.pricingType,baseRateSAR:canonicalOld!.rate,currency:old.currency || 'SAR',effectiveFrom:canonicalPricingDate(old.effectiveFrom),effectiveTo:old.effectiveTo ? canonicalPricingDate(old.effectiveTo):undefined,vatRatePercent:old.vatRatePercent ?? 15}:null;
      const changed=old && commercial.some(k=>JSON.stringify(normalizedOld[k] ?? null)!==JSON.stringify(rule[k] ?? null));
      await this.participation(tx,p,rule.carrierId,materialId,old&&status==='INACTIVE'&&!changed&&['name','notes'].every(k=>JSON.stringify(normalizedOld[k] ?? null)===JSON.stringify(rule[k] ?? null))?'CONSISTENCY_CLEANUP':old?'MAINTENANCE':'NEW_OPERATION');
      if(old?.supersededByRuleId && changed)fail('PRICING_RULE_ALREADY_REPLACED');
      if(linked && changed){
        if(!allowReplacement)fail('PRICING_RULE_HISTORICAL_MUTATION_BLOCKED');
        // Existing policy forbids intraday split rules. A replacement begins at a UTC day boundary.
        if(!/^\d{4}-\d{2}-\d{2}$/.test(from!) || pricingInstant(from!)!<=pricingInstant(old.effectiveFrom)! || status!=='ACTIVE')fail('INVALID_REPLACEMENT_BOUNDARY');
        if(rule.carrierId!==old.carrierId || (rule.materialId ?? null)!==(canonicalOld!.materialId ?? null))fail('PRICING_REPLACEMENT_IDENTITY_MISMATCH');
        const replacementId='PR-'+randomUUID();
        const predecessor={...old,supersededByRuleId:replacementId,supersededFrom:from,version:(old.version||1)+1,updatedAt:now,updatedBy:actor.userId};
        const replacement={...rule,pricingRuleId:replacementId,parentRuleId:ruleId,createdAt:now,createdBy:actor.userId,version:(old.version||1)+1};
        const windows=all.map((r:any)=>pricingResolutionWindow(mapped(r.pricingRuleId===ruleId?predecessor:r)));
        if(PricingRuleValidator.checkOverlap(mapped(replacement),windows).hasOverlap)fail('PRICING_OVERLAP');
        tx.set(ref,predecessor);
        tx.set(this.db.collection('projects').doc(p).collection('pricing_rules').doc(replacementId),replacement);
        const auditContext={...c,correlationId:(c as any).correlationId || 'PRICING-REPLACE-'+replacementId};
        this.audit(tx,p,ruleId,'UPDATE',actor,auditContext,old,predecessor,now);
        this.audit(tx,p,replacementId,'CREATE',actor,auditContext,null,replacement,now);
        return replacement;
      }
      if(status==='ACTIVE' && PricingRuleValidator.checkOverlap(pricingResolutionWindow(mapped(rule)),all.map((r:any)=>pricingResolutionWindow(mapped(r)))).hasOverlap)fail('PRICING_OVERLAP');
      tx.set(ref,rule);
      this.audit(tx,p,ruleId,old?'UPDATE':'CREATE',actor,c,old,rule,now);
      return rule;
    });
  }
  private audit(tx:any,p:string,ruleId:string,action:'CREATE'|'UPDATE',actor:AuthUserContext,context:AuthUserContext,before:any,after:any,now:string){
    const auditLogId='AUDIT-PRICING-'+ruleId+'-'+randomUUID();
    tx.set(this.db.collection('audit_logs').doc(auditLogId),sanitizeUndefined({auditLogId,projectId:p,entityType:'PRICING_RULE',entityId:ruleId,action,actor:{userId:actor.userId,role:actor.role},changes:{before,after,deltaFields:Object.keys(after)},correlationId:(context as any).correlationId || auditLogId,createdAt:now,updatedAt:now,createdBy:actor.userId,updatedBy:actor.userId}));
  }

}
export const projectPricingServerService=new ProjectPricingServerService();
