## PFAG-RB1 pricing/report boundary correction

Current architecture reference; exact acceptance/publication state is in [the ledger](reconstruction/02_PHASE_LEDGER.md).

Direct browser writes to canonical pricing rules are denied for create/update/delete. Authenticated canonical server commands retain version replacement, activation/deactivation, effective-window, overlap, lineage and atomic audit semantics. On SUSPENDED/ARCHIVED Projects only status-only deactivation is allowed as cleanup; commercial/name/notes edits and activation remain fenced.

Historical reporting never consults current master/profile facts to replace saved Trip entity/pricing snapshots. Missing labels fall back to canonical IDs; capacity and tax facts remain unavailable if not captured. No default 32-ton historical payload limit or invented Project tax number is used. Existing pricing models/calculation semantics are unchanged. Source tests are not a substitute for native rules runtime acceptance.

# Current pricing contract — P9-U1 / P9-U2

Classification: CURRENT_ARCHITECTURE_REFERENCE. Exact phase/unit/publication state belongs only to [the ledger](reconstruction/02_PHASE_LEDGER.md).

- One server write/query authority, one pure selector/calculator, canonical participation. General Material is allowed only for an explicit Carrier; legacy authorization arrays never authorize pricing.
- Date-only start/end include the entire UTC day; ISO cutoffs retain their instant. Dispatch uses server time; imports use operational date. Specific Material precedes general. Equal-specificity ambiguity fails closed; same-specificity calendar-day overlaps are forbidden.
- One row action and one primary save: unused rules edit; used commercial changes create a successor from an explicit UTC calendar date later than the predecessor start. The old rule retains its commercial fields, with exclusive resolution cutoff metadata. Both rules and correlated CREATE/UPDATE audit evidence commit atomically. Direct strict edits of used commercial terms remain rejected.
- ACTIVE plus effective window permits resolution; INACTIVE prevents future resolution. Reactivation is overlap checked. Deactivating a successor never revives its predecessor. Already replaced commercial terms cannot branch into another successor; only status/description updates are allowed. No rule/evidence deletion is introduced.
- PER_TON uses accepted net kg/1000, applies configured minimum billable weight when positive weight exists, rounds billable tons to three decimals and base amount to two. PER_TRIP uses rate × count (normal Trip count one), rounded to two decimals. Physical weights remain unchanged by billing minimums.
- Rates are tax-exclusive. Existing VAT applicability and percentage (default 15 when absent) are captured; finite percentages 0–100 are validated. Shared server totals round subtotal after existing charges/deductions, VAT, then total to two SAR decimals. Later tax configuration cannot rewrite old snapshots/totals. No generalized tax engine is added.
- Waiting rates/free hours are preserved contractual terms. Reports may display stored charges/complete stored evidence; missing historical evidence remains pending. Current canonical Trip commands expose no manual surcharge/deduction or automatic waiting-accrual input. The unused old browser settlement request/approval service is not activated. New accounting/adjustment workflow remains outside approved scope.
- Trip snapshots retain original rate/model, rule/version, effective and minimum-weight/tax/waiting facts. Completion uses these facts; loading/reopening never reprices against current rules. Explicit imported pending behavior remains distinct.
- Canonical rate/model aliases and general-Material sentinels normalize through the same read policy; edits normalize only equivalent representation and preserve absent historical terms. Unsupported PER_KM/FLAT_RATE and historical M3 targets are not new supported calculators. Legacy-only alternate collection inspection, prototype rules and labelled simulator do not authorize active pricing.
- Retirement of compatibility aliases requires a separately proven data inventory/migration. No speculative mass migration, new pricing unit or live acceptance is claimed. Local closure evidence belongs to the ledger.

---

> **HISTORICAL_RECORD — original design/reference specification.** The preserved body may combine implemented behavior with former targets; it is not proof of current routes, schemas, security, deployment or reconstruction status. Current GitHub main takes precedence. For the verified repository overview see [MASTER_PROJECT_HANDOFF.md](reconstruction/MASTER_PROJECT_HANDOFF.md); current state is [02_PHASE_LEDGER.md](reconstruction/02_PHASE_LEDGER.md). No historical target here authorizes product changes.

# Q Saudi Work Follow — نموذج التسعير والمحاسبة الخادومي (Pricing & Financial Engine)

## 1. الفلسفة والمبدأ الإلزامي السادس (Principle #6: Server-Authoritative Pricing)

> **"Client لا يحسب القيمة المالية النهائية"**

تطبيقاً للمبدأ السادس الصارم:
* **يُمنع منعاً باتاً** احتساب أو تقرير أي قيمة مالية أو ضريبة داخل كود المتصفح أو تطبيق PWA الميداني.
* الواجهة الأمامية تعرض فقط قياسات الأوزان ومؤشرات تقديرية إن لزم، لكن الاعتماد المالي النهائي (`Final Financial Settlement`) يصدر حصراً ومباشرة من محرك التسعير الخادومي الموثق على خادم Node.js.
* يضمن هذا النموذج منع أي محاولة تلاعب بالأسعار أو تعديل الأكواد محلياً من قِبل المستخدمين الميدانيين.

---

## 2. مصفوفة نماذج التسعير (Pricing Models Matrix)

يدعم محرك التسعير 4 نماذج رئيسية لحساب أجور النقل وتكاليف المواد:

### 2.1 التسعير بالوزن الصافي (Per Ton Model):
النموذج الأكثر شيوعاً في نقل البحص والأسفلت والردميات:
$$\text{Base Amount} = \text{Billable Weight (Tons)} \times \text{Rate Per Ton (SAR)}$$

حيث يتم احتساب الوزن الخاضع للفوترة كالتالي:
$$\text{Net Weight (Kg)} = \text{Gross Weight} - \text{Tare Weight}$$
$$\text{Billable Weight (Kg)} = \max(\text{Net Weight (Kg)}, \text{Minimum Billable Weight (Kg)})$$
$$\text{Billable Weight (Tons)} = \frac{\text{Billable Weight (Kg)}}{1000}$$

### 2.2 التسعير بالحجم والمتر المكعب (Per Cubic Meter Model - $M^3$):
يستخدم لنقل الأتربة والرمل والخرسانة، بالاعتماد على الكثافة المعتمدة للمادة:
$$\text{Volume } (M^3) = \frac{\text{Net Weight (Tons)}}{\text{Standard Density (Tons/}M^3\text{)}}$$
$$\text{Base Amount} = \text{Volume } (M^3) \times \text{Rate Per } M^3 \text{ (SAR)}$$

### 2.3 التسعير بالرد / المشوار الثابت (Per Trip Model):
سعر مقطوع ثابت لكل رحلة مكتملة ومطابقة للمواصفات للشاحنة من نقطة الانطلاق إلى نقطة الوصول المحددة بغض النظر عن تفاوت الوزن ضمن الحدود القانونية.

### 2.4 التسعير بالمسافة الكيلومترية (Per Kilometer Model):
$$\text{Base Amount} = \text{Authorized Distance (Km)} \times \text{Rate Per Km (SAR)}$$

---

## 3. رسوم وغرامات التأخير والانتظار (Demurrage & Detention Calculation)

في حال تأخر الشاحنة في موقع التحميل أو موقع التنزيل بسبب بطء عمليات الموقع عن الساعات المجانية المتفق عليها تعاقدياً:

$$\text{Transit Duration (Hours)} = \frac{\text{Timestamp(Unload Complete)} - \text{Timestamp(Arrival Origin)}}{3600 \text{ sec}}$$
$$\text{Billable Delay Hours} = \max(0, \text{Transit Duration} - \text{Free Time Allowance (Hours)})$$
$$\text{Demurrage Amount (SAR)} = \text{Billable Delay Hours} \times \text{Demurrage Rate Per Hour (SAR)}$$

---

## 4. معالجة ضريبة القيمة المضافة (ZATCA 15% VAT Compliance)

وفقاً للوائح هيئة الزكاة والضريبة والجمارك في المملكة العربية السعودية:
* معدل الضريبة الأساسي هو **15%**.
* يتم تقريب جميع القيم المالية جبرياً إلى أقرب هللتين (2 Decimal Places) بالريال السعودي.

### المعادلة التجميعية الرسمية:
$$\text{Subtotal (SAR)} = \text{Base Amount} + \text{Demurrage Amount} - \text{Approved Deductions}$$
$$\text{VAT Amount (SAR)} = \text{Round}_{2}(\text{Subtotal} \times 0.15)$$
$$\text{Total Invoice Amount (SAR)} = \text{Subtotal} + \text{VAT Amount}$$

---

## 5. حفظ اللقطة التاريخية للتسعير (Pricing Snapshot Lifecycle)

لتفادي أي خلل محاسبي عند تعديل أسعار العقود مستقبلاً:

1. **عند إطلاق الرحلة (Trip Dispatch):**
   * يستعلم الخادم عن `PricingRule` النشطة للناقل والمادة والمشروع.
   * يتم استنساخ مصفوفة التسعير كلقطة غير قابلة للتعديل (`pricingSnapshot`) وتضمينها داخل وثيقة الرحلة (`Trip`).
2. **عند إتمام الرحلة (Trip Completion):**
   * ينفذ الخادم معادلات التسعير باستخدام أرقام الميزان الفعلية بالاعتماد حصراً على `pricingSnapshot` المحفوظة في الوثيقة.
   * يتم قفل الحساب المالي بتعيين `financials.isFinalized = true` وتاريخ الإغلاق `finalizedAt`.
3. **التعديلات الاستثنائية:**
   * في حال وجود خطأ في قراءة الميزان أو خصم جودة، لا يمكن تعديل الحساب إلا من خلال مستخدم يحمل دور `FINANCE_AUDITOR` أو `PROJECT_ADMIN`.
   * يُنشئ التعديل قيد تسوية مالي جديد مع تسجيل الفروقات في `audit_logs`.

---

## 6. نموذج كود محرك التسعير الخادومي (TypeScript Implementation Blueprint)

```typescript
export interface PricingCalculationResult {
  billableWeightKg: number;
  baseAmountSAR: number;
  demurrageAmountSAR: number;
  deductionsAmountSAR: number;
  subtotalSAR: number;
  vatAmountSAR: number;
  totalAmountSAR: number;
}

export function calculateTripFinancials(
  pricingSnapshot: Trip['pricingSnapshot'],
  weights: Trip['weights'],
  delayHours: number = 0,
  deductionsSAR: number = 0
): PricingCalculationResult {
  const netWeightKg = (weights.destinationNetKg ?? weights.originNetKg) ?? 0;
  
  // تطبيق الحد الأدنى للوزن المحتسب
  const minWeightKg = pricingSnapshot.minimumBillableWeightKg ?? 0;
  const billableWeightKg = Math.max(netWeightKg, minWeightKg);
  const billableWeightTons = billableWeightKg / 1000;

  let baseAmount = 0;
  switch (pricingSnapshot.pricingModel) {
    case 'PER_TON':
      baseAmount = billableWeightTons * pricingSnapshot.baseRateSAR;
      break;
    case 'PER_TRIP':
      baseAmount = pricingSnapshot.baseRateSAR;
      break;
    default:
      baseAmount = billableWeightTons * pricingSnapshot.baseRateSAR;
  }

  // غرامات التأخير
  const freeHours = pricingSnapshot.freeTimeHours ?? 2;
  const billableDelay = Math.max(0, delayHours - freeHours);
  const demurrageAmount = billableDelay * (pricingSnapshot.demurrageRatePerHourSAR ?? 0);

  // المجموع الفرعي
  const subtotal = Math.max(0, baseAmount + demurrageAmount - deductionsSAR);

  // احتساب الضريبة
  const vatRate = pricingSnapshot.vatApplicable ? (pricingSnapshot.vatRatePercent ?? 15) / 100 : 0;
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

  return {
    billableWeightKg,
    baseAmountSAR: Math.round(baseAmount * 100) / 100,
    demurrageAmountSAR: Math.round(demurrageAmount * 100) / 100,
    deductionsAmountSAR: Math.round(deductionsSAR * 100) / 100,
    subtotalSAR: Math.round(subtotal * 100) / 100,
    vatAmountSAR: vatAmount,
    totalAmountSAR: totalAmount
  };
}
```
