import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import type { PricingRuleEntity } from '../types/entities';
import type { AuthUserContext } from '../types/common';
/** Compatibility facade; the authenticated server owns validation, writes and audit. */
export class PricingRuleService {
  getPricingRules(p:string){return pricingRuleRepository.listByProject(p);}
  getPricingRule(p:string,id:string){return pricingRuleRepository.findById(p,id);}
  async createPricingRule(payload:any,_context:AuthUserContext):Promise<PricingRuleEntity>{await pricingRuleRepository.create(payload);const result=await pricingRuleRepository.findById(payload.projectId,payload.pricingRuleId);if(!result)throw Error('PRICING_RULE_NOT_FOUND');return result;}
  async updatePricingRule(p:string,id:string,updates:Partial<PricingRuleEntity>,context:AuthUserContext){const previous=await this.getPricingRule(p,id);if(!previous)throw Error('PRICING_RULE_NOT_FOUND');await pricingRuleRepository.update(p,id,{...updates,expectedVersion:previous.version||1},context.userId);}
  async versionAndModifyRule(..._args:any[]):Promise<{oldRule:PricingRuleEntity;newRule:PricingRuleEntity;protectedTripsCount:number}>{throw Error('SERVER_PRICING_VERSION_COMMAND_REQUIRED');}
  subscribeByProject(p:string,callback:(rules:PricingRuleEntity[])=>void){return pricingRuleRepository.subscribeByProject(p,callback);}
}
export const pricingRuleService=new PricingRuleService();
