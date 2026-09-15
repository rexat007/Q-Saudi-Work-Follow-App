sed -i '/import { MasterPricingRule, MASTER_PRICING_RULES } from/d' src/services/tripEngine.service.ts
sed -i '/export { MASTER_PRICING_RULES };/d' src/services/tripEngine.service.ts
sed -i 's/MASTER_PRICING_RULES\.find/pricingService.getRules().find/g' src/services/tripEngine.service.ts
# Add pricingService import
sed -i '1s/^/import { pricingService } from ".\/pricing.service";\n/' src/services/tripEngine.service.ts
# Also it uses MasterPricingRule from masterPricingRules. It should probably import it from types.
