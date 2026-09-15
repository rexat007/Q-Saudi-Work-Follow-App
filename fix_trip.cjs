const fs = require('fs');
let content = fs.readFileSync('src/components/TripEngineView.tsx', 'utf8');
content = content.replace(
  `                <select
                  value={formData.pricingRuleId}
                  onChange={e => setFormData({ ...formData, pricingRuleId: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    <option key={r.pricingRuleId} value={r.pricingRuleId}>`,
  `                <select
                  value={formData.pricingRuleId}
                  onChange={e => setFormData({ ...formData, pricingRuleId: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">{t("trips.labels.txt_default_pricing") || "-- اختر قاعدة التسعير --"}</option>
                  {availablePricingRules.map(r => (
                    <option key={r.pricingRuleId} value={r.pricingRuleId}>`
);
fs.writeFileSync('src/components/TripEngineView.tsx', content);
console.log('Fixed TripEngineView.tsx');
