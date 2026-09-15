#!/bin/bash
FILES=$(grep -rl "MASTER_PRICING_RULES" src/ | grep -v "src/data/masterPricingRules.ts" | grep -v "src/tests/")

for f in $FILES; do
  # Remove the import of MASTER_PRICING_RULES
  sed -i 's/, MASTER_PRICING_RULES//g' "$f"
  sed -i 's/MASTER_PRICING_RULES,//g' "$f"
  sed -i '/import { MASTER_PRICING_RULES } from/d' "$f"

  # Replace MASTER_PRICING_RULES with pricingService.getRules()
  sed -i 's/MASTER_PRICING_RULES/pricingService.getRules()/g' "$f"

  # Ensure pricingService is imported if we just added it
  if grep -q "pricingService.getRules()" "$f"; then
    if ! grep -q "import { pricingService }" "$f"; then
      sed -i '1s/^/import { pricingService } from "..\/..\/services\/pricing.service";\n/' "$f"
      # Clean up path if it's not nested deeply (e.g. if it's already in services)
    fi
  fi
done
