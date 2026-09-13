# Block 68: Human Review Decision & Controlled Approval Dossier

**Generated At:** 2026-09-13T13:25:17.229Z  
**Block Scope:** Block 68 Human Review Decision & Controlled Approval Preparation  
**Compliance Mandate:** Zero Locale Modification • Strictly 33 Items Isolated • Reviewer Decision PENDING  
**Review Status:** ALL 33 ITEMS UNDER `REVIEW_REQUIRED`  

---

## 1. Executive Summary & Governance Policy

This dossier prepares the final decision records for all **33 authoritative human review items** quarantined under Category A in Block 67. 

In strict adherence to engineering governance:
1. **Zero modifications have been made to application locale dictionaries:**
   - `src/locales/ar/index.ts` — **100% untouched**
   - `src/locales/en/index.ts` — **100% untouched**
   - `src/locales/ur/index.ts` — **100% untouched**
2. **Zero application test fixtures have been altered.**
3. **All 33 proposed translations remain non-applied review proposals.**
4. **All 33 reviewer decisions are explicitly flagged as `PENDING`.**
5. **Each decision record rigorously separates:**
   - Existing Translation
   - Proposed Correction (Proposal Only)
   - Reason for Proposal
   - Human Approval Required

---

## 2. Quantitative Summary Metrics

| Metric Dimension | Count | Governance Meaning |
| :--- | :---: | :--- |
| **Total Human Review Items** | **33** | Exactly 33 items governed |
| **Current Review Status** | **33/33 REVIEW_REQUIRED** | Zero items unquarantined |
| **Reviewer Decision State** | **33/33 PENDING** | Pending human committee signoff |
| **Applied to Locales** | **0** | Zero runtime dictionaries modified |
| **Bilingual Arabic Sources** | **17** | Intentional technical English in Arabic canonical text |
| **Monolingual Arabic Sources** | **16** | Pure Arabic canonical text |
| **Interpolation Variable Keys** | **1** | Contains runtime template variables (`${pricingResolutionResult.message}`) |
| **Protected Token Keys** | **20** | Technical codes, enums, units, or platform schema tokens |
| **Financial / Legal / Operational Risk** | **15** | Settlement formulas, statutory permits (Ajeer), security audit controls |

### Recommended Decision Breakdown
| Recommended Decision | Count | Description |
| :--- | :---: | :--- |
| **REVISE** | **29** | Professional bilingual translation proposed while strictly preserving technical tokens |
| **FIX_SOURCE** | **2** | Recommendation to remove redundant English parentheticals from canonical Arabic source |
| **APPROVE** | **1** | Current value meets international standards (e.g. ISO-4217 `SAR`) |
| **KEEP_EXCEPTION** | **1** | Retain as intentional exception to prevent breaking negative test fixtures |

### Classification Distribution
| Issue Classification | Count | Description |
| :--- | :---: | :--- |
| **FINANCIAL_OPERATIONAL_RISK** | **12** | High-impact pricing, invoice settlement, or stage enforcement |
| **TECHNICAL_TERM** | **7** | Schema properties (e.g., `destNetWeight`, `unloaderId`), enum codes, DB keys |
| **REAL_TRANSLATION_DEFECT** | **7** | Pure Arabic fallback or hybrid machine translation in EN/UR |
| **BILINGUAL_SOURCE** | **5** | Source contains intentional English technical parentheticals |
| **TOKEN_INTERPOLATION_RISK** | **1** | Runtime variable interpolation must remain byte-exact |
| **KEEP_EXCEPTION** | **1** | Contract testing fixture requiring exact phrasing |

### Risk Level Distribution
- **CRITICAL:** 4
- **HIGH:** 17
- **MEDIUM:** 7
- **LOW:** 5

---

## 3. Authoritative Item Decision Dossier (33 Records)

### Item 1: `trips.status.failedPricing`
- **Domain:** `trips` | **Priority:** `P1` | **Risk Level:** **CRITICAL**
- **Classification:** `TOKEN_INTERPOLATION_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `[حظر بدء الرحلة]: فشل حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **English (Current):** `[حظر بدء الTrip]: Failed حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **Urdu (Current):** `[حظر بدء الٹرپ]: ناکام حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `[Trip Dispatch Prohibited]: Pricing resolution and settlement calculation failed (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **Proposed Urdu:** `[ٹرپ روانگی ممنوع]: قیمت کا تعین اور تصفیہ کا حساب ناکام (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **Protected Tokens:** `${pricingResolutionResult.message}`, `Pricing Resolution Failed`
- **Interpolation Variables:** `${pricingResolutionResult.message}`

#### 3. Reason for Proposal
- **Classification:** `TOKEN_INTERPOLATION_RISK`
- **Risk Assessment:** CRITICAL risk tier
- **Concise Rationale:** Contains critical runtime template variable ${pricingResolutionResult.message}. Source has bilingual parenthetical. Recommended to preserve runtime variable and parenthetical while ensuring full professional phrasing.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 2: `trips.labels.trip_4`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `حظر إكمال الرحلة بدون destNetWeight`
- **English (Current):** `حظر إكمال الTrip بدون destNetWeight`
- **Urdu (Current):** `حظر إكمال الٹرپ بدون destNetWeight`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Trip completion blocked without destNetWeight`
- **Proposed Urdu:** `destNetWeight کے بغیر ٹرپ کی تکمیل ممنوع ہے`
- **Protected Tokens:** `destNetWeight`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** destNetWeight is an immutable technical schema property. Current EN and UR have mixed-language fragments. Recommended to professionally translate surrounding text while preserving destNetWeight.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 3: `trips.labels.trip_7`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `[قاعدة رقابية]: تم حظر إكمال الرحلة بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).`
- **English (Current):** `[قاعدة رقابية]: تم حظر إكمال الTrip بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).`
- **Urdu (Current):** `[قاعدة رقابية]: تم حظر إكمال الٹرپ بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `[Regulatory Rule]: Trip completion blocked without an authorized unloader (unloaderId) and unloading timestamp (unloadTime).`
- **Proposed Urdu:** `[نگرانی کا ضابطہ]: مجاز وصول کنندہ (unloaderId) اور ان لوڈنگ وقت (unloadTime) کے بغیر ٹرپ مکمل کرنا ممنوع ہے۔`
- **Protected Tokens:** `unloaderId`, `unloadTime`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Regulatory audit rule referencing schema keys unloaderId and unloadTime. Current EN and UR contain mixed language. Recommended to translate audit envelope while strictly keeping parameter names.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 4: `trips.labels.txt_2c17d4`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `يحظر الإكمال بدون هوية المستلم ووقت التفريغ`
- **English (Current):** `يحظر الإكمال بدون هوية المستلم ووقت التفريغ`
- **Urdu (Current):** `يحظر الإكمال بدون هوية المستلم ووقت التفريغ`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Completion prohibited without recipient identity and unloading timestamp`
- **Proposed Urdu:** `وصول کنندہ کی شناخت اور ان لوڈنگ وقت کے بغیر تکمیل ممنوع ہے`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Compliance check on unloading credentials. Currently has complete Arabic fallback in EN and UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 5: `trips.labels.txt_2cd3f8`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `BILINGUAL_SOURCE`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)`
- **English (Current):** `مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)`
- **Urdu (Current):** `مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Negative Stress Tests Regulatory Enforcement Matrix`
- **Proposed Urdu:** `ریگولیٹری نفاذ کا میٹرکس (Negative Stress Tests)`
- **Protected Tokens:** `Negative Stress Tests`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `BILINGUAL_SOURCE`
- **Risk Assessment:** LOW risk tier
- **Concise Rationale:** QA automation suite header. Source intentionally contains English technical parenthetical. In EN, redundant Arabic should be replaced. In UR, Urdu technical phrasing should precede the English parenthetical.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 6: `trips.labels.txt_37b15d`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `يحظر الإتمام إذا تعذر احتساب الفارق بدقة`
- **English (Current):** `يحظر الإتمام إذا تعذر احتساب الفارق بدقة`
- **Urdu (Current):** `يحظر الإتمام إذا تعذر احتساب الفارق بدقة`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Completion prohibited if discrepancy cannot be accurately calculated`
- **Proposed Urdu:** `اگر فرق کا درست حساب کتاب نہ ہو سکے تو تکمیل ممنوع ہے`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Settlement variance calculation rule. High financial impact. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 7: `trips.labels.txt_3a0ff7`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `مبلغ التسوية المستحق:`
- **English (Current):** `مبلغ التسوية المستحق:`
- **Urdu (Current):** `مبلغ التسوية المستحق:`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Settlement Amount Due:`
- **Proposed Urdu:** `واجب الادا تصفیہ کی رقم:`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Settlement amount parameter. High financial impact. Pure Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 8: `trips.labels.txt_5f22c5`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `حوكمة كاملة لجميع تحولات دورة الحياة، التحقق من الرتبة والمشروع، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً.`
- **English (Current):** `حوكمة كاملة لجميع تحولات دورة الحياة، Verify الرتبة وProject، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً.`
- **Urdu (Current):** `حوكمة كاملة لجميع تحولات دورة الحياة، تصدیق کریں الرتبة وپروجیکٹ، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Full lifecycle transition governance: verifying rank and project, mandatory weights, recipient, and arrival time, with server-side calculation of variance and settlement.`
- **Proposed Urdu:** `لائف سائیکل کے تمام مراحل کی مکمل نگرانی: رینک اور پروجیکٹ کی تصدیق، لازمی وزن، وصول کنندہ اور آمد کا وقت، اور سرور پر فرق اور تصفیہ کا خودکار حساب۔`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Lifecycle transition rule description. Contains hybrid machine translation fragments in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 9: `trips.labels.txt_622420`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `يتم التحقق خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً.`
- **English (Current):** `يتم Verification خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً.`
- **Urdu (Current):** `يتم تصدیق خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Server-side verification of the six rules, with automated weight calculation and settlement.`
- **Proposed Urdu:** `چھ قواعد کی سرور پر تصدیق، اور وزن و تصفیہ کا خودکار حساب کتاب۔`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Six-rule verification description. Mixed fragments in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 10: `trips.labels.txt_701a0c`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `يحظر تخطي المراحل التشغيلية الإلزامية`
- **English (Current):** `يحظر تخطي المراحل التشغيلية الإلزامية`
- **Urdu (Current):** `يحظر تخطي المراحل التشغيلية الإلزامية`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Skipping mandatory operational stages is prohibited`
- **Proposed Urdu:** `لازمی آپریشنل مراحل کو چھوڑنا ممنوع ہے`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Workflow state-machine constraint. Prevents bypassing weighbridge or unloading. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 11: `trips.labels.txt_761b23`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `KEEP_EXCEPTION`
- **Recommended Governance Action:** **`KEEP_EXCEPTION`**

#### 1. Existing Translation
- **Arabic (Canonical):** `محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.`
- **English (Current):** `محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.`
- **Urdu (Current):** `محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Attempting to deliver "hot asphalt mix" in a project dedicated to backfill and aggregate transport. Immediate prohibition.`
- **Proposed Urdu:** `بھرائی اور ملبے کی نقل و حمل کے لیے مختص منصوبے میں "خلطة أسفلتية ساخنة" سپلائی کرنے کی کوشش۔ فوری پابندی۔`
- **Protected Tokens:** `"خلطة أسفلتية ساخنة"`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `KEEP_EXCEPTION`
- **Risk Assessment:** LOW risk tier
- **Concise Rationale:** Negative test simulation fixture testing contract material rejection. Contains literal material name matching test assertions. Keep as exception or revise carefully without breaking contract tests.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `KEEP_EXCEPTION`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 12: `trips.labels.txt_7d5bc8`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `إجمالي التسوية المحسوبة`
- **English (Current):** `إجمالي التسوية المحسوبة`
- **Urdu (Current):** `إجمالي التسوية المحسوبة`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Total Calculated Settlement`
- **Proposed Urdu:** `کل حسابی تصفیہ`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Financial settlement calculation summary. High financial visibility. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 13: `trips.labels.txt_7d6134`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`APPROVE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `التسوية (SAR)`
- **English (Current):** `التسوية (SAR)`
- **Urdu (Current):** `التسوية (SAR)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Settlement (SAR)`
- **Proposed Urdu:** `تصفیہ (SAR)`
- **Protected Tokens:** `SAR`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** ISO-4217 Currency representation. Source has Arabic text with SAR. EN and UR correctly use international standard SAR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `APPROVE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 14: `loading.labels.txt_57f8de`
- **Domain:** `loading` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `التسوية المعتمدة:`
- **English (Current):** `التسوية المعتمدة:`
- **Urdu (Current):** `التسوية المعتمدة:`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Approved Settlement:`
- **Proposed Urdu:** `منظور شدہ تصفیہ:`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Approved settlement parameter in loading dispatch. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 15: `loading.labels.txt_73e4a3`
- **Domain:** `loading` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `BILINGUAL_SOURCE`
- **Recommended Governance Action:** **`FIX_SOURCE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `التسوية التقديرية (Settlement)`
- **English (Current):** `التسوية التقديرية (Settlement)`
- **Urdu (Current):** `التسوية التقديرية (Settlement)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Estimated Settlement`
- **Proposed Urdu:** `تخمینی تصفیہ (Settlement)`
- **Protected Tokens:** `Settlement`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `BILINGUAL_SOURCE`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Supply and settlement dues tab. Canonical Arabic text has English parenthetical (Settlement). Recommended to remove English parenthetical in Arabic or revise EN to eliminate tautology.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `FIX_SOURCE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 16: `unloading.labels.txt_1cfd3c`
- **Domain:** `unloading` | **Priority:** `P2` | **Risk Level:** **CRITICAL**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `اعتماد الاستثناء والسماح بالتسوية (Waive Exception)`
- **English (Current):** `Approval الاستثناء والسماح بالتسوية (Waive Exception)`
- **Urdu (Current):** `منظوری الاستثناء والسماح بالتسوية (Waive Exception)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Approve Exception & Authorize Settlement (Waive Exception)`
- **Proposed Urdu:** `استثناء کی منظوری اور تصفیہ کی اجازت (Waive Exception)`
- **Protected Tokens:** `Waive Exception`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** CRITICAL risk tier
- **Concise Rationale:** High-risk security audit action allowing exception waiver and triggering financial settlement. Hybrid translation in EN/UR. Must preserve operational rigor.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 17: `unloading.labels.txt_5f0c9f`
- **Domain:** `unloading` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `4️⃣ حظر اللوحة المنفردة (PROHIBITED)`
- **English (Current):** `4️⃣ حظر اللوحة المنفردة (PROHIBITED)`
- **Urdu (Current):** `4️⃣ حظر اللوحة المنفردة (PROHIBITED)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `4️⃣ Single License Plate Block (PROHIBITED)`
- **Proposed Urdu:** `4️⃣ سنگل لائسنس پلیٹ بلاک (PROHIBITED)`
- **Protected Tokens:** `PROHIBITED`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Strict compliance blocking status. Canonical source has PROHIBITED token. Current EN/UR have Arabic fallback. Must preserve PROHIBITED token.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 18: `weighbridge.labels.txt_35a0be`
- **Domain:** `weighbridge` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `احتساب التسوية المالية بدقة بالطن أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان البيانات`
- **English (Current):** `احتساب التسوية المالية بدقة بالton أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان Data`
- **Urdu (Current):** `احتساب التسوية المالية بدقة بالٹن أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان ڈیٹا`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Precise calculation of financial settlement by ton or trip requiring net &gt; 0, returning null on missing data`
- **Proposed Urdu:** `ٹن یا ٹرپ کے حساب سے مالی تصفیہ کا درست حساب جس میں net &gt; 0 درکار ہے، اور ڈیٹا غائب ہونے پر null واپس کیا جائے گا`
- **Protected Tokens:** `net &gt; 0`, `null`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Weighbridge validation constraint. Contains code logic expressions (net > 0) and (null). Mixed fragments in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 19: `weighbridge.labels.txt_407887`
- **Domain:** `weighbridge` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `فحص دوال الحساب، معايير التحقق، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)`
- **English (Current):** `Check دوال الحساب، معايير Verification، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)`
- **Urdu (Current):** `جانچ دوال الحساب، معايير تصدیق، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Audit calculation functions, validation criteria, prohibit replacing missing values with zero, and evaluate variance (NORMAL / WARNING / EXCEPTION)`
- **Proposed Urdu:** `حساب کے فنکشنز، تصدیقی معیارات کی جانچ، گمشدہ ڈیٹا کو صفر سے بدلنے کی ممانعت، اور فرق کی جانچ (NORMAL / WARNING / EXCEPTION)`
- **Protected Tokens:** `NORMAL`, `WARNING`, `EXCEPTION`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Weighbridge accuracy evaluation indicator referencing system enum states. Enum tokens must be strictly preserved.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 20: `offline.labels.txt_402c63`
- **Domain:** `offline` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `المبلغ والتسوية:`
- **English (Current):** `المبلغ والتسوية:`
- **Urdu (Current):** `المبلغ والتسوية:`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Amount & Settlement:`
- **Proposed Urdu:** `رقم اور تصفیہ:`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Offline queue settlement summary label. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 21: `loading.labels.save_3`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **CRITICAL**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وحفظ السجل الأمني في سجلات الرقابة.`
- **English (Current):** `قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وSave السجل الأمني في سجلات الرقابة.`
- **Urdu (Current):** `قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها ومحفوظ کریں السجل الأمني في سجلات الرقابة.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `The settlement amount (settlementAmount) has no input field in the interface and is calculated exclusively server-side (Server-Side Calculation). Any client-submitted value is ignored and logged in regulatory audit trails.`
- **Proposed Urdu:** `تصفیہ کی رقم (settlementAmount) کے لیے انٹرفیس میں کوئی ان پٹ فیلڈ نہیں ہے، اور یہ مکمل طور پر سرور کی طرف (Server-Side Calculation) شمار ہوتی ہے۔ کلائنٹ سے بھیجی گئی کسی بھی قیمت کو نظر انداز کر کے سیکیورٹی لاگ میں محفوظ کیا جاتا ہے۔`
- **Protected Tokens:** `settlementAmount`, `Server-Side Calculation`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** CRITICAL risk tier
- **Concise Rationale:** Crucial security specification preventing client tampering of settlementAmount. Preserves audit trail. EN and UR currently contain hybrid machine-translated words.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 22: `unloading.labels.txt_186f77`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `BILINGUAL_SOURCE`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `تقرير الامتثال الآلي لاشتراطات محطة التفريغ (Unloading Station Tests)`
- **English (Current):** `تقرير الامتثال الآلي لاشتراطات Unloading Station (Unloading Station Tests)`
- **Urdu (Current):** `تقرير الامتثال الآلي لاشتراطات ان لوڈنگ اسٹیشن (Unloading Station Tests)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Automated Compliance Report for Unloading Station Requirements (Unloading Station Tests)`
- **Proposed Urdu:** `ان لوڈنگ اسٹیشن کے تقاضوں کی خودکار تعمیلی رپورٹ (Unloading Station Tests)`
- **Protected Tokens:** `Unloading Station Tests`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `BILINGUAL_SOURCE`
- **Risk Assessment:** LOW risk tier
- **Concise Rationale:** Station compliance QA report header. Bilingual English tag in Arabic source. Mixed morphology in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 23: `unloading.labels.txt_1bec3a`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `فحص الامتثال الآلي (7 متطلبات)`
- **English (Current):** `Check الامتثال الآلي (7 متطلبات)`
- **Urdu (Current):** `جانچ الامتثال الآلي (7 متطلبات)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Automated Compliance Check (7 Requirements)`
- **Proposed Urdu:** `خودکار تعمیلی جانچ (7 شرائط)`
- **Protected Tokens:** `7`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** LOW risk tier
- **Concise Rationale:** Automated compliance checklist item. Hybrid machine artifact (Check الامتثال الآلي).

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 24: `unloading.labels.txt_68980a`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `حظر أمني رقابي (BLOCKED)`
- **English (Current):** `حظر أمني رقابي (BLOCKED)`
- **Urdu (Current):** `حظر أمني رقابي (BLOCKED)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Regulatory Security Block (BLOCKED)`
- **Proposed Urdu:** `نگرانی کا سیکیورٹی بلاک (BLOCKED)`
- **Protected Tokens:** `BLOCKED`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `TECHNICAL_TERM`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Security regulatory block status. Contains BLOCKED status code. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 25: `offline.labels.createTripPricing`
- **Domain:** `pricing` | **Priority:** `P2` | **Risk Level:** **CRITICAL**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `حظر إنشاء الرحلة بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بإنشاء أي رحلة بدون احتساب تسعيري معتمد.`
- **English (Current):** `حظر Create الTrip بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بCreate أي Trip بدون احتساب تسعيري معتمد.`
- **Urdu (Current):** `حظر تخلیق کریں الٹرپ بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بتخلیق کریں أي ٹرپ بدون احتساب تسعيري معتمد.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Offline Trip Creation Prohibited: Pricing data is not available locally in browser storage (IndexedDB). Legally, no trip may be created without an approved price calculation.`
- **Proposed Urdu:** `آف لائن ٹرپ کی تخلیق ممنوع: قیمتوں کا ڈیٹا براؤزر میموری (IndexedDB) میں مقامی طور پر دستیاب نہیں ہے۔ باضابطہ طور پر منظور شدہ قیمت کے حساب کتاب کے بغیر کوئی ٹرپ بنانے کی اجازت نہیں ہے۔`
- **Protected Tokens:** `IndexedDB`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** CRITICAL risk tier
- **Concise Rationale:** Statutory trip creation block when offline pricing cache is missing. Contains IndexedDB. EN and UR contain hybrid fragments.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 26: `navigation.labels.txt_2f3fde`
- **Domain:** `shared` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `مستحق التسوية`
- **English (Current):** `مستحق التسوية`
- **Urdu (Current):** `مستحق التسوية`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Settlement Due`
- **Proposed Urdu:** `تصفیہ کے واجب الادا`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Financial status filter pill. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 27: `entityResolution.labels.importEdit`
- **Domain:** `entityResolution` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `BILINGUAL_SOURCE`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `يعمل قبل اعتماد أي ملف استيراد (Import) أو تعديل على البيانات المرجعية (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية.`
- **English (Current):** `يعمل قبل Approval أي ملف Import (Import) أو Edit على Data Reference (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية.`
- **Urdu (Current):** `يعمل قبل منظوری أي ملف امپورٹ کریں (Import) أو ترمیم کریں على ڈیٹا حوالہ جاتی (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Executes prior to approving any import file (Import) or modifying reference data (Master Data). Prevents erroneous automatic merges (Auto-Merge) and prohibits regulatory conflicts.`
- **Proposed Urdu:** `کسی بھی امپورٹ فائل (Import) کی منظوری یا ماسٹر ڈیٹا (Master Data) میں ترمیم سے پہلے چلتا ہے۔ غلط خودکار انضمام (Auto-Merge) کو روکتا ہے اور تنظیمی تنازعات کو ممنوع قرار دیتا ہے۔`
- **Protected Tokens:** `Import`, `Master Data`, `Auto-Merge`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `BILINGUAL_SOURCE`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Data governance constraint preventing regulatory collisions. Source has multiple English technical parentheticals (Import, Master Data, Auto-Merge). Current EN/UR have severe hybrid word salad.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 28: `entityResolution.labels.txt_2b8f60`
- **Domain:** `entityResolution` | **Priority:** `P3` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `تم استبعاد وحظر السجل من الإدخال.`
- **English (Current):** `تم استبعاد وحظر السجل من الإدخال.`
- **Urdu (Current):** `تم استبعاد وحظر السجل من الإدخال.`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Record excluded and blocked from entry.`
- **Proposed Urdu:** `ریکارڈ کو اندراج سے خارج اور بلاک کر دیا گیا ہے۔`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Data validation exclusion message. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 29: `projects.labels.txt_6757e5`
- **Domain:** `projects` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `نسبة ضريبة القيمة المضافة % (VAT)`
- **English (Current):** `نسبة ضريبة القيمة المضافة % (VAT)`
- **Urdu (Current):** `نسبة ضريبة القيمة المضافة % (VAT)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Value Added Tax Rate % (VAT)`
- **Proposed Urdu:** `ویلیو ایڈڈ ٹیکس کی شرح % (VAT)`
- **Protected Tokens:** `VAT`, `%`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Tax rate configuration field. Contains VAT and % symbols. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 30: `offline.labels.txt_305c29`
- **Domain:** `offline` | **Priority:** `P3` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `تسوية ومطابقة التبعية مع البيانات الأساسية للخادم`
- **English (Current):** `تسوية ومطابقة التبعية مع Data الأساسية للخادم`
- **Urdu (Current):** `تسوية ومطابقة التبعية مع ڈیٹا الأساسية للخادم`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Dependency reconciliation and synchronization with server master data`
- **Proposed Urdu:** `سرور کے بنیادی ڈیٹا کے ساتھ وابستگی کی مطابقت پذیری اور تصفیہ`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** MEDIUM risk tier
- **Concise Rationale:** Offline synchronization status description. Hybrid machine translation in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 31: `exceptions.labels.driver`
- **Domain:** `exceptions` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `كفالة السائق غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ`
- **English (Current):** `كفالة Driver غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ`
- **Urdu (Current):** `كفالة ڈرائیور غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Driver sponsorship does not match the contracted carrier, with no valid Ajeer permit`
- **Proposed Urdu:** `ڈرائیور کی کفالت معاہدہ شدہ کیریئر سے مماثل نہیں ہے اور کوئی درست اجیر اجازت نامہ موجود نہیں ہے`
- **Protected Tokens:** `Ajeer`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `REAL_TRANSLATION_DEFECT`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Saudi Ministry of Human Resources (Ajeer) regulatory compliance rule. Requires specific legal term "Ajeer permit". Current EN and UR have hybrid fragments.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 32: `projects.labels.settings`
- **Domain:** `security` | **Priority:** `P3` | **Risk Level:** **LOW**
- **Classification:** `BILINGUAL_SOURCE`
- **Recommended Governance Action:** **`FIX_SOURCE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)`
- **English (Current):** `Settings الافتراضية والامتثال النظامي (Default Settings & Compliance)`
- **Urdu (Current):** `ترتیبات الافتراضية والامتثال النظامي (Default Settings & Compliance)`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Default Settings & Regulatory Compliance`
- **Proposed Urdu:** `طے شدہ ترتیبات اور تنظیمی تعمیل (Default Settings & Compliance)`
- **Protected Tokens:** `Default Settings & Compliance`
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `BILINGUAL_SOURCE`
- **Risk Assessment:** LOW risk tier
- **Concise Rationale:** Project governance settings header. Source includes full English title in parentheses, creating tautological repetition if translated directly. Recommend fixing canonical source to remove redundant English or providing concise translation.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `FIX_SOURCE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

### Item 33: `navigation.labels.pricing_2`
- **Domain:** `pricing` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Recommended Governance Action:** **`REVISE`**

#### 1. Existing Translation
- **Arabic (Canonical):** `بناءً على لقطات التسعير التعاقدية للرحلات`
- **English (Current):** `بناءً على لقطات التسعير التعاقدية للرحلات`
- **Urdu (Current):** `بناءً على لقطات التسعير التعاقدية للرحلات`

#### 2. Proposed Correction (Review Proposal Only — NOT Applied)
- **Proposed English:** `Based on trip contractual pricing snapshots`
- **Proposed Urdu:** `ٹرپس کی معاہداتی قیمتوں کے اسنیپ شاٹس پر مبنی`
- **Protected Tokens:** _None_
- **Interpolation Variables:** _None_

#### 3. Reason for Proposal
- **Classification:** `FINANCIAL_OPERATIONAL_RISK`
- **Risk Assessment:** HIGH risk tier
- **Concise Rationale:** Pricing audit methodology disclaimer. Explains calculation baseline from contractual rate snapshots. Arabic fallback in EN/UR.

#### 4. Human Approval Required
- **Review Status:** `REVIEW_REQUIRED`
- **Reviewer Decision:** `PENDING`
- **Recommended Decision:** `REVISE`
- **Committee Sign-off:** `[ ] APPROVE` &nbsp;&nbsp; `[ ] REVISE` &nbsp;&nbsp; `[ ] KEEP_EXCEPTION` &nbsp;&nbsp; `[ ] FIX_SOURCE`

---

