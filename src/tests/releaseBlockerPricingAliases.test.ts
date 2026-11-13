import {translateDiscoveryToRosterTarget} from '../services/import/driverTruckImport';
import {it,expect} from 'vitest';
import {canonicalPricingRule,PricingService,commercialTotals} from '../services/pricing.service';
it.each([{agreedRate:45},{rate:45},{baseRateSAR:45}])('approved rate representation survives imported calculation: %j',alias=>{
 const rule=canonicalPricingRule({pricingRuleId:'PRICE',pricingType:'PER_TON',currency:'SAR',status:'ACTIVE',...alias});const result=new PricingService().calculateSettlement({pricingRule:rule,netWeightKg:27950});expect(result.settlementAmount).toBe(1257.75);expect(result.snapshot.agreedRate).toBe(45);expect(commercialTotals(result.settlementAmount,{vatApplicable:false}).totalAmountSAR).toBe(1257.75);
});
it('canonical zero and canonical field precedence are preserved',()=>{expect(canonicalPricingRule({baseRateSAR:0,rate:20,agreedRate:30}).rate).toBe(0);expect(canonicalPricingRule({rate:20,agreedRate:30}).rate).toBe(20);expect(canonicalPricingRule({}).rate).toBeUndefined();});

it('numeric discovery keys cannot become a roster target',()=>{expect(translateDiscoveryToRosterTarget(1)).toBe('unmapped');});
