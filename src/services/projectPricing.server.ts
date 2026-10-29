import { canPerformOperationalMutation } from './projectMutability.policy';
import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { ProjectReadinessAdminReadContext } from './projectReadiness.server';
import { PricingRuleValidator } from '../validators/pricingRule.validator';
import { PricingService, canonicalPricingRule, canonicalPricingDate, pricingInstant } from './pricing.service';
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
  private async participation(tx:any,p:string,carrierId:string,materialId?:string,writing=false){
    if(!id(carrierId)||materialId && !id(materialId))fail('INVALID_PRICING_IDENTITY');
    const project=await tx.get(this.db.collection('projects').doc(p));if(!project.exists)fail('PROJECT_NOT_FOUND');
    const projectData=decodeProject<any>(project.data(),p);
    if(writing && !canPerformOperationalMutation('CREATE_PRICING_RULE',projectData.status))fail('PROJECT_READ_ONLY');
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
  async listPricingRules(p:string,c:AuthUserContext){return this.db.runTransaction(async(tx:any)=>{await this.actor(tx,p,c);return (await this.rules(tx,p)).map((r:any)=>{const canonical=mapped(r);return {...r,pricingModel:canonical.pricingType,baseRateSAR:canonical.rate};});});}
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
  private async write(p:string,payload:any,c:AuthUserContext,editing?:string):Promise<PricingRuleEntity>{
    if(!id(p)||!payload||typeof payload!=='object'||Array.isArray(payload))fail('INVALID_PRICING_COMMAND');
    const allowed=['pricingRuleId','projectId','carrierId','materialId','name','pricingModel','pricingType','baseRateSAR','rate','currency','effectiveFrom','effectiveTo','notes','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable','status','isActive','createdBy','updatedBy','expectedVersion'];
    if(Object.keys(payload).some(k=>!allowed.includes(k)))fail('INVALID_PRICING_COMMAND');
    return this.db.runTransaction(async(tx:any)=>{
      const actor=await this.actor(tx,p,c,true);
      const ruleId=editing || payload.pricingRuleId;if(!id(ruleId))fail('INVALID_PRICING_IDENTITY');
      const ref=this.db.collection('projects').doc(p).collection('pricing_rules').doc(ruleId),snap=await tx.get(ref);
      if(editing && !snap.exists)fail('PRICING_RULE_NOT_FOUND');if(!editing && snap.exists)fail('PRICING_RULE_ALREADY_EXISTS');
      const old=editing ? decodePricing<any>(snap.data(),ruleId,p):null;
      if(editing && payload.expectedVersion!== (old.version || 1))fail('PRICING_VERSION_CONFLICT');
      const input={...old,...payload}, model=payload.pricingModel ?? payload.pricingType ?? input.pricingModel, rate=payload.baseRateSAR ?? payload.rate ?? input.baseRateSAR;
      const materialId=['ALL','ALL_MATERIALS','GENERAL','*','',null,undefined].includes(input.materialId)?undefined:input.materialId;
      const from=canonicalPricingDate(input.effectiveFrom),to=input.effectiveTo?canonicalPricingDate(input.effectiveTo):undefined;
      if(!from || input.effectiveTo && !to || to && pricingInstant(to,true)!<pricingInstant(from)!)fail('INVALID_PRICING_DATE');
      if(!Number.isFinite(rate)||rate<=0)fail('INVALID_PRICING_RULE');
      if(!['PER_TRIP','PER_TON'].includes(model))fail('UNSUPPORTED_PRICING_MODEL');
      const status=payload.status ?? (payload.isActive===false ? 'INACTIVE':old?.status || 'ACTIVE');if(!['ACTIVE','INACTIVE'].includes(status))fail('INVALID_PRICING_STATUS');
      for(const key of ['name','notes','currency'])if(input[key]!==undefined && typeof input[key]!=='string')fail('INVALID_PRICING_RULE');
      for(const key of ['minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours'])if(input[key]!==undefined && (!Number.isFinite(input[key])||input[key]<0))fail('INVALID_PRICING_RULE');
      for(const key of ['vatApplicable','isActive'])if(input[key]!==undefined && typeof input[key]!=='boolean')fail('INVALID_PRICING_RULE');
      const now=new Date().toISOString();
      const rule:any=sanitizeUndefined({pricingRuleId:ruleId,projectId:p,carrierId:input.carrierId,materialId,name:input.name?.trim() || ruleId,pricingModel:model,baseRateSAR:rate,currency:input.currency || 'SAR',effectiveFrom:from,effectiveTo:to,notes:input.notes?.trim() || undefined,minimumBillableWeightKg:input.minimumBillableWeightKg,demurrageRatePerHourSAR:input.demurrageRatePerHourSAR ?? 50,freeTimeHours:input.freeTimeHours ?? 2,vatApplicable:input.vatApplicable ?? true,status,isActive:status==='ACTIVE',version:(old?.version || 0)+1,createdAt:old?.createdAt || now,createdBy:old?.createdBy || actor.userId,updatedAt:now,updatedBy:actor.userId});
      const valid=PricingRuleValidator.validate(rule);if(!valid.isValid)fail('INVALID_PRICING_RULE');
      await this.participation(tx,p,rule.carrierId,materialId,true);
      const all=await this.rules(tx,p);if(status==='ACTIVE' && PricingRuleValidator.checkOverlap(mapped(rule),all.map(mapped)).hasOverlap)fail('PRICING_OVERLAP');
      if(old){
        const trips=await tx.get(this.db.collection('projects').doc(p).collection('trips'));
        const linked=trips.docs.some((d:any)=>{const t=d.data();return t.pricingRuleId===ruleId||t.pricingSnapshot?.pricingRuleId===ruleId;});
        const commercial=['carrierId','materialId','pricingModel','baseRateSAR','currency','effectiveFrom','effectiveTo','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable'];
        if(linked && commercial.some(k=>JSON.stringify(old[k])!==JSON.stringify(rule[k])))fail('PRICING_RULE_HISTORICAL_MUTATION_BLOCKED');
      }
      tx.set(ref,rule);
      const auditLogId='AUDIT-PRICING-'+ruleId+'-'+randomUUID();
      tx.set(this.db.collection('audit_logs').doc(auditLogId),sanitizeUndefined({auditLogId,projectId:p,entityType:'PRICING_RULE',entityId:ruleId,action:old?'UPDATE':'CREATE',actor:{userId:actor.userId,role:actor.role},changes:{before:old,after:rule,deltaFields:Object.keys(rule)},correlationId:(c as any).correlationId || auditLogId,createdAt:now,updatedAt:now,createdBy:actor.userId,updatedBy:actor.userId}));
      return rule;
    });
  }
}
export const projectPricingServerService=new ProjectPricingServerService();
