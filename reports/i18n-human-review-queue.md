# Block 67: Authoritative Human Review Queue Dossier

**Generated At:** 2026-09-13T13:04:19.413Z  
**Compliance Mandate:** Zero Untrusted Modification & Strict Isolation  
**Queue Size:** Exactly 33 Items  
**Audit Status:** Complete — 100% Reconciled against Block 60 Quality Plan  

---

## Executive Summary
All 33 items quarantined in Category A (Human Review) have undergone thorough multidimensional linguistic and technical governance analysis. In compliance with strict engineering policy, **zero translation modifications** were made to these keys in Block 67. Each item is individually profiled with classification, risk severity, recommended governance decision, and suggested professional translations.

### Key Metrics
| Dimension | Count | Details |
| :--- | :---: | :--- |
| **Total Human Review Items** | **33** | 100% accounted for |
| **Bilingual Arabic Sources** | **17** | Intentionally incorporate English technical terms/parentheticals |
| **Monolingual Arabic Sources** | **16** | Pure Arabic source requiring formal translation |
| **Runtime Interpolations** | **1** | `${pricingResolutionResult.message}` strictly preserved |
| **Protected Token Items** | **20** | Schema properties, ISO currency, enums, platform IDs |

### Governance Recommendations Breakdown
| Recommended Decision | Count | Description |
| :--- | :---: | :--- |
| **REVISE** | **29** | Professional human translation required while preserving protected tokens |
| **FIX_SOURCE** | **2** | Canonical Arabic text should be cleaned up to remove redundant English |
| **APPROVE** | **1** | Current value meets international standards (e.g. ISO currency `SAR`) |
| **KEEP_EXCEPTION** | **1** | Retain as-is to preserve test fixture compatibility |

---

## Detailed Item Dossier

### Item 1: `trips.status.failedPricing`
- **Domain:** `trips` | **Priority:** `P1` | **Risk Level:** **CRITICAL**
- **Classification:** `TOKEN_INTERPOLATION_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `${pricingResolutionResult.message}`, `Pricing Resolution Failed`
- **Interpolation Variables:** `${pricingResolutionResult.message}`

**Current Values:**
- **Arabic (Canonical):** `[حظر بدء الرحلة]: فشل حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **English (Current):** `[حظر بدء الTrip]: Failed حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **Urdu (Current):** `[حظر بدء الٹرپ]: ناکام حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}`

**Audit Rationale:**  
Contains critical runtime template variable ${pricingResolutionResult.message}. Source has bilingual parenthetical. Recommended to preserve runtime variable and parenthetical while ensuring full professional phrasing.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `[Trip Dispatch Prohibited]: Pricing resolution and settlement calculation failed (Pricing Resolution Failed) - ${pricingResolutionResult.message}`
- **Urdu Proposal:** `[ٹرپ روانگی ممنوع]: قیمت کا تعین اور تصفیہ کا حساب ناکام (Pricing Resolution Failed) - ${pricingResolutionResult.message}`

---

### Item 2: `trips.labels.trip_4`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `destNetWeight`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `حظر إكمال الرحلة بدون destNetWeight`
- **English (Current):** `حظر إكمال الTrip بدون destNetWeight`
- **Urdu (Current):** `حظر إكمال الٹرپ بدون destNetWeight`

**Audit Rationale:**  
destNetWeight is an immutable technical schema property. Current EN and UR have mixed-language fragments. Recommended to professionally translate surrounding text while preserving destNetWeight.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Trip completion blocked without destNetWeight`
- **Urdu Proposal:** `destNetWeight کے بغیر ٹرپ کی تکمیل ممنوع ہے`

---

### Item 3: `trips.labels.trip_7`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `unloaderId`, `unloadTime`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `[قاعدة رقابية]: تم حظر إكمال الرحلة بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).`
- **English (Current):** `[قاعدة رقابية]: تم حظر إكمال الTrip بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).`
- **Urdu (Current):** `[قاعدة رقابية]: تم حظر إكمال الٹرپ بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).`

**Audit Rationale:**  
Regulatory audit rule referencing schema keys unloaderId and unloadTime. Current EN and UR contain mixed language. Recommended to translate audit envelope while strictly keeping parameter names.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `[Regulatory Rule]: Trip completion blocked without an authorized unloader (unloaderId) and unloading timestamp (unloadTime).`
- **Urdu Proposal:** `[نگرانی کا ضابطہ]: مجاز وصول کنندہ (unloaderId) اور ان لوڈنگ وقت (unloadTime) کے بغیر ٹرپ مکمل کرنا ممنوع ہے۔`

---

### Item 4: `trips.labels.txt_2c17d4`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `يحظر الإكمال بدون هوية المستلم ووقت التفريغ`
- **English (Current):** `يحظر الإكمال بدون هوية المستلم ووقت التفريغ`
- **Urdu (Current):** `يحظر الإكمال بدون هوية المستلم ووقت التفريغ`

**Audit Rationale:**  
Compliance check on unloading credentials. Currently has complete Arabic fallback in EN and UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Completion prohibited without recipient identity and unloading timestamp`
- **Urdu Proposal:** `وصول کنندہ کی شناخت اور ان لوڈنگ وقت کے بغیر تکمیل ممنوع ہے`

---

### Item 5: `trips.labels.txt_2cd3f8`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `BILINGUAL_SOURCE` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `Negative Stress Tests`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)`
- **English (Current):** `مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)`
- **Urdu (Current):** `مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)`

**Audit Rationale:**  
QA automation suite header. Source intentionally contains English technical parenthetical. In EN, redundant Arabic should be replaced. In UR, Urdu technical phrasing should precede the English parenthetical.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Negative Stress Tests Regulatory Enforcement Matrix`
- **Urdu Proposal:** `ریگولیٹری نفاذ کا میٹرکس (Negative Stress Tests)`

---

### Item 6: `trips.labels.txt_37b15d`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `يحظر الإتمام إذا تعذر احتساب الفارق بدقة`
- **English (Current):** `يحظر الإتمام إذا تعذر احتساب الفارق بدقة`
- **Urdu (Current):** `يحظر الإتمام إذا تعذر احتساب الفارق بدقة`

**Audit Rationale:**  
Settlement variance calculation rule. High financial impact. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Completion prohibited if discrepancy cannot be accurately calculated`
- **Urdu Proposal:** `اگر فرق کا درست حساب کتاب نہ ہو سکے تو تکمیل ممنوع ہے`

---

### Item 7: `trips.labels.txt_3a0ff7`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `مبلغ التسوية المستحق:`
- **English (Current):** `مبلغ التسوية المستحق:`
- **Urdu (Current):** `مبلغ التسوية المستحق:`

**Audit Rationale:**  
Settlement amount parameter. High financial impact. Pure Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Settlement Amount Due:`
- **Urdu Proposal:** `واجب الادا تصفیہ کی رقم:`

---

### Item 8: `trips.labels.txt_5f22c5`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `حوكمة كاملة لجميع تحولات دورة الحياة، التحقق من الرتبة والمشروع، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً.`
- **English (Current):** `حوكمة كاملة لجميع تحولات دورة الحياة، Verify الرتبة وProject، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً.`
- **Urdu (Current):** `حوكمة كاملة لجميع تحولات دورة الحياة، تصدیق کریں الرتبة وپروجیکٹ، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً.`

**Audit Rationale:**  
Lifecycle transition rule description. Contains hybrid machine translation fragments in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Full lifecycle transition governance: verifying rank and project, mandatory weights, recipient, and arrival time, with server-side calculation of variance and settlement.`
- **Urdu Proposal:** `لائف سائیکل کے تمام مراحل کی مکمل نگرانی: رینک اور پروجیکٹ کی تصدیق، لازمی وزن، وصول کنندہ اور آمد کا وقت، اور سرور پر فرق اور تصفیہ کا خودکار حساب۔`

---

### Item 9: `trips.labels.txt_622420`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `يتم التحقق خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً.`
- **English (Current):** `يتم Verification خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً.`
- **Urdu (Current):** `يتم تصدیق خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً.`

**Audit Rationale:**  
Six-rule verification description. Mixed fragments in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Server-side verification of the six rules, with automated weight calculation and settlement.`
- **Urdu Proposal:** `چھ قواعد کی سرور پر تصدیق، اور وزن و تصفیہ کا خودکار حساب کتاب۔`

---

### Item 10: `trips.labels.txt_701a0c`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `يحظر تخطي المراحل التشغيلية الإلزامية`
- **English (Current):** `يحظر تخطي المراحل التشغيلية الإلزامية`
- **Urdu (Current):** `يحظر تخطي المراحل التشغيلية الإلزامية`

**Audit Rationale:**  
Workflow state-machine constraint. Prevents bypassing weighbridge or unloading. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Skipping mandatory operational stages is prohibited`
- **Urdu Proposal:** `لازمی آپریشنل مراحل کو چھوڑنا ممنوع ہے`

---

### Item 11: `trips.labels.txt_761b23`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `KEEP_EXCEPTION` | **Recommended Decision:** `KEEP_EXCEPTION`
- **Bilingual Source:** No
- **Protected Tokens:** `"خلطة أسفلتية ساخنة"`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.`
- **English (Current):** `محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.`
- **Urdu (Current):** `محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.`

**Audit Rationale:**  
Negative test simulation fixture testing contract material rejection. Contains literal material name matching test assertions. Keep as exception or revise carefully without breaking contract tests.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Attempting to deliver "hot asphalt mix" in a project dedicated to backfill and aggregate transport. Immediate prohibition.`
- **Urdu Proposal:** `بھرائی اور ملبے کی نقل و حمل کے لیے مختص منصوبے میں "خلطة أسفلتية ساخنة" سپلائی کرنے کی کوشش۔ فوری پابندی۔`

---

### Item 12: `trips.labels.txt_7d5bc8`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `إجمالي التسوية المحسوبة`
- **English (Current):** `إجمالي التسوية المحسوبة`
- **Urdu (Current):** `إجمالي التسوية المحسوبة`

**Audit Rationale:**  
Financial settlement calculation summary. High financial visibility. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Total Calculated Settlement`
- **Urdu Proposal:** `کل حسابی تصفیہ`

---

### Item 13: `trips.labels.txt_7d6134`
- **Domain:** `trips` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `APPROVE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `SAR`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `التسوية (SAR)`
- **English (Current):** `التسوية (SAR)`
- **Urdu (Current):** `التسوية (SAR)`

**Audit Rationale:**  
ISO-4217 Currency representation. Source has Arabic text with SAR. EN and UR correctly use international standard SAR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Settlement (SAR)`
- **Urdu Proposal:** `تصفیہ (SAR)`

---

### Item 14: `loading.labels.txt_57f8de`
- **Domain:** `loading` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `التسوية المعتمدة:`
- **English (Current):** `التسوية المعتمدة:`
- **Urdu (Current):** `التسوية المعتمدة:`

**Audit Rationale:**  
Approved settlement parameter in loading dispatch. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Approved Settlement:`
- **Urdu Proposal:** `منظور شدہ تصفیہ:`

---

### Item 15: `loading.labels.txt_73e4a3`
- **Domain:** `loading` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `BILINGUAL_SOURCE` | **Recommended Decision:** `FIX_SOURCE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `Settlement`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `التسوية التقديرية (Settlement)`
- **English (Current):** `التسوية التقديرية (Settlement)`
- **Urdu (Current):** `التسوية التقديرية (Settlement)`

**Audit Rationale:**  
Supply and settlement dues tab. Canonical Arabic text has English parenthetical (Settlement). Recommended to remove English parenthetical in Arabic or revise EN to eliminate tautology.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Estimated Settlement`
- **Urdu Proposal:** `تخمینی تصفیہ (Settlement)`

---

### Item 16: `unloading.labels.txt_1cfd3c`
- **Domain:** `unloading` | **Priority:** `P2` | **Risk Level:** **CRITICAL**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `Waive Exception`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `اعتماد الاستثناء والسماح بالتسوية (Waive Exception)`
- **English (Current):** `Approval الاستثناء والسماح بالتسوية (Waive Exception)`
- **Urdu (Current):** `منظوری الاستثناء والسماح بالتسوية (Waive Exception)`

**Audit Rationale:**  
High-risk security audit action allowing exception waiver and triggering financial settlement. Hybrid translation in EN/UR. Must preserve operational rigor.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Approve Exception & Authorize Settlement (Waive Exception)`
- **Urdu Proposal:** `استثناء کی منظوری اور تصفیہ کی اجازت (Waive Exception)`

---

### Item 17: `unloading.labels.txt_5f0c9f`
- **Domain:** `unloading` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `PROHIBITED`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `4️⃣ حظر اللوحة المنفردة (PROHIBITED)`
- **English (Current):** `4️⃣ حظر اللوحة المنفردة (PROHIBITED)`
- **Urdu (Current):** `4️⃣ حظر اللوحة المنفردة (PROHIBITED)`

**Audit Rationale:**  
Strict compliance blocking status. Canonical source has PROHIBITED token. Current EN/UR have Arabic fallback. Must preserve PROHIBITED token.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `4️⃣ Single License Plate Block (PROHIBITED)`
- **Urdu Proposal:** `4️⃣ سنگل لائسنس پلیٹ بلاک (PROHIBITED)`

---

### Item 18: `weighbridge.labels.txt_35a0be`
- **Domain:** `weighbridge` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `net &gt; 0`, `null`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `احتساب التسوية المالية بدقة بالطن أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان البيانات`
- **English (Current):** `احتساب التسوية المالية بدقة بالton أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان Data`
- **Urdu (Current):** `احتساب التسوية المالية بدقة بالٹن أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان ڈیٹا`

**Audit Rationale:**  
Weighbridge validation constraint. Contains code logic expressions (net > 0) and (null). Mixed fragments in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Precise calculation of financial settlement by ton or trip requiring net &gt; 0, returning null on missing data`
- **Urdu Proposal:** `ٹن یا ٹرپ کے حساب سے مالی تصفیہ کا درست حساب جس میں net &gt; 0 درکار ہے، اور ڈیٹا غائب ہونے پر null واپس کیا جائے گا`

---

### Item 19: `weighbridge.labels.txt_407887`
- **Domain:** `weighbridge` | **Priority:** `P2` | **Risk Level:** **MEDIUM**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `NORMAL`, `WARNING`, `EXCEPTION`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `فحص دوال الحساب، معايير التحقق، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)`
- **English (Current):** `Check دوال الحساب، معايير Verification، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)`
- **Urdu (Current):** `جانچ دوال الحساب، معايير تصدیق، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)`

**Audit Rationale:**  
Weighbridge accuracy evaluation indicator referencing system enum states. Enum tokens must be strictly preserved.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Audit calculation functions, validation criteria, prohibit replacing missing values with zero, and evaluate variance (NORMAL / WARNING / EXCEPTION)`
- **Urdu Proposal:** `حساب کے فنکشنز، تصدیقی معیارات کی جانچ، گمشدہ ڈیٹا کو صفر سے بدلنے کی ممانعت، اور فرق کی جانچ (NORMAL / WARNING / EXCEPTION)`

---

### Item 20: `offline.labels.txt_402c63`
- **Domain:** `offline` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `المبلغ والتسوية:`
- **English (Current):** `المبلغ والتسوية:`
- **Urdu (Current):** `المبلغ والتسوية:`

**Audit Rationale:**  
Offline queue settlement summary label. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Amount & Settlement:`
- **Urdu Proposal:** `رقم اور تصفیہ:`

---

### Item 21: `loading.labels.save_3`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **CRITICAL**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `settlementAmount`, `Server-Side Calculation`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وحفظ السجل الأمني في سجلات الرقابة.`
- **English (Current):** `قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وSave السجل الأمني في سجلات الرقابة.`
- **Urdu (Current):** `قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها ومحفوظ کریں السجل الأمني في سجلات الرقابة.`

**Audit Rationale:**  
Crucial security specification preventing client tampering of settlementAmount. Preserves audit trail. EN and UR currently contain hybrid machine-translated words.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `The settlement amount (settlementAmount) has no input field in the interface and is calculated exclusively server-side (Server-Side Calculation). Any client-submitted value is ignored and logged in regulatory audit trails.`
- **Urdu Proposal:** `تصفیہ کی رقم (settlementAmount) کے لیے انٹرفیس میں کوئی ان پٹ فیلڈ نہیں ہے، اور یہ مکمل طور پر سرور کی طرف (Server-Side Calculation) شمار ہوتی ہے۔ کلائنٹ سے بھیجی گئی کسی بھی قیمت کو نظر انداز کر کے سیکیورٹی لاگ میں محفوظ کیا جاتا ہے۔`

---

### Item 22: `unloading.labels.txt_186f77`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `BILINGUAL_SOURCE` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `Unloading Station Tests`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `تقرير الامتثال الآلي لاشتراطات محطة التفريغ (Unloading Station Tests)`
- **English (Current):** `تقرير الامتثال الآلي لاشتراطات Unloading Station (Unloading Station Tests)`
- **Urdu (Current):** `تقرير الامتثال الآلي لاشتراطات ان لوڈنگ اسٹیشن (Unloading Station Tests)`

**Audit Rationale:**  
Station compliance QA report header. Bilingual English tag in Arabic source. Mixed morphology in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Automated Compliance Report for Unloading Station Requirements (Unloading Station Tests)`
- **Urdu Proposal:** `ان لوڈنگ اسٹیشن کے تقاضوں کی خودکار تعمیلی رپورٹ (Unloading Station Tests)`

---

### Item 23: `unloading.labels.txt_1bec3a`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **LOW**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** `7`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `فحص الامتثال الآلي (7 متطلبات)`
- **English (Current):** `Check الامتثال الآلي (7 متطلبات)`
- **Urdu (Current):** `جانچ الامتثال الآلي (7 متطلبات)`

**Audit Rationale:**  
Automated compliance checklist item. Hybrid machine artifact (Check الامتثال الآلي).

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Automated Compliance Check (7 Requirements)`
- **Urdu Proposal:** `خودکار تعمیلی جانچ (7 شرائط)`

---

### Item 24: `unloading.labels.txt_68980a`
- **Domain:** `security` | **Priority:** `P2` | **Risk Level:** **HIGH**
- **Classification:** `TECHNICAL_TERM` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `BLOCKED`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `حظر أمني رقابي (BLOCKED)`
- **English (Current):** `حظر أمني رقابي (BLOCKED)`
- **Urdu (Current):** `حظر أمني رقابي (BLOCKED)`

**Audit Rationale:**  
Security regulatory block status. Contains BLOCKED status code. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Regulatory Security Block (BLOCKED)`
- **Urdu Proposal:** `نگرانی کا سیکیورٹی بلاک (BLOCKED)`

---

### Item 25: `offline.labels.createTripPricing`
- **Domain:** `pricing` | **Priority:** `P2` | **Risk Level:** **CRITICAL**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `IndexedDB`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `حظر إنشاء الرحلة بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بإنشاء أي رحلة بدون احتساب تسعيري معتمد.`
- **English (Current):** `حظر Create الTrip بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بCreate أي Trip بدون احتساب تسعيري معتمد.`
- **Urdu (Current):** `حظر تخلیق کریں الٹرپ بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بتخلیق کریں أي ٹرپ بدون احتساب تسعيري معتمد.`

**Audit Rationale:**  
Statutory trip creation block when offline pricing cache is missing. Contains IndexedDB. EN and UR contain hybrid fragments.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Offline Trip Creation Prohibited: Pricing data is not available locally in browser storage (IndexedDB). Legally, no trip may be created without an approved price calculation.`
- **Urdu Proposal:** `آف لائن ٹرپ کی تخلیق ممنوع: قیمتوں کا ڈیٹا براؤزر میموری (IndexedDB) میں مقامی طور پر دستیاب نہیں ہے۔ باضابطہ طور پر منظور شدہ قیمت کے حساب کتاب کے بغیر کوئی ٹرپ بنانے کی اجازت نہیں ہے۔`

---

### Item 26: `navigation.labels.txt_2f3fde`
- **Domain:** `shared` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `مستحق التسوية`
- **English (Current):** `مستحق التسوية`
- **Urdu (Current):** `مستحق التسوية`

**Audit Rationale:**  
Financial status filter pill. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Settlement Due`
- **Urdu Proposal:** `تصفیہ کے واجب الادا`

---

### Item 27: `entityResolution.labels.importEdit`
- **Domain:** `entityResolution` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `BILINGUAL_SOURCE` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `Import`, `Master Data`, `Auto-Merge`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `يعمل قبل اعتماد أي ملف استيراد (Import) أو تعديل على البيانات المرجعية (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية.`
- **English (Current):** `يعمل قبل Approval أي ملف Import (Import) أو Edit على Data Reference (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية.`
- **Urdu (Current):** `يعمل قبل منظوری أي ملف امپورٹ کریں (Import) أو ترمیم کریں على ڈیٹا حوالہ جاتی (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية.`

**Audit Rationale:**  
Data governance constraint preventing regulatory collisions. Source has multiple English technical parentheticals (Import, Master Data, Auto-Merge). Current EN/UR have severe hybrid word salad.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Executes prior to approving any import file (Import) or modifying reference data (Master Data). Prevents erroneous automatic merges (Auto-Merge) and prohibits regulatory conflicts.`
- **Urdu Proposal:** `کسی بھی امپورٹ فائل (Import) کی منظوری یا ماسٹر ڈیٹا (Master Data) میں ترمیم سے پہلے چلتا ہے۔ غلط خودکار انضمام (Auto-Merge) کو روکتا ہے اور تنظیمی تنازعات کو ممنوع قرار دیتا ہے۔`

---

### Item 28: `entityResolution.labels.txt_2b8f60`
- **Domain:** `entityResolution` | **Priority:** `P3` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `تم استبعاد وحظر السجل من الإدخال.`
- **English (Current):** `تم استبعاد وحظر السجل من الإدخال.`
- **Urdu (Current):** `تم استبعاد وحظر السجل من الإدخال.`

**Audit Rationale:**  
Data validation exclusion message. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Record excluded and blocked from entry.`
- **Urdu Proposal:** `ریکارڈ کو اندراج سے خارج اور بلاک کر دیا گیا ہے۔`

---

### Item 29: `projects.labels.txt_6757e5`
- **Domain:** `projects` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `VAT`, `%`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `نسبة ضريبة القيمة المضافة % (VAT)`
- **English (Current):** `نسبة ضريبة القيمة المضافة % (VAT)`
- **Urdu (Current):** `نسبة ضريبة القيمة المضافة % (VAT)`

**Audit Rationale:**  
Tax rate configuration field. Contains VAT and % symbols. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Value Added Tax Rate % (VAT)`
- **Urdu Proposal:** `ویلیو ایڈڈ ٹیکس کی شرح % (VAT)`

---

### Item 30: `offline.labels.txt_305c29`
- **Domain:** `offline` | **Priority:** `P3` | **Risk Level:** **MEDIUM**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `تسوية ومطابقة التبعية مع البيانات الأساسية للخادم`
- **English (Current):** `تسوية ومطابقة التبعية مع Data الأساسية للخادم`
- **Urdu (Current):** `تسوية ومطابقة التبعية مع ڈیٹا الأساسية للخادم`

**Audit Rationale:**  
Offline synchronization status description. Hybrid machine translation in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Dependency reconciliation and synchronization with server master data`
- **Urdu Proposal:** `سرور کے بنیادی ڈیٹا کے ساتھ وابستگی کی مطابقت پذیری اور تصفیہ`

---

### Item 31: `exceptions.labels.driver`
- **Domain:** `exceptions` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `REAL_TRANSLATION_DEFECT` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** `Ajeer`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `كفالة السائق غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ`
- **English (Current):** `كفالة Driver غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ`
- **Urdu (Current):** `كفالة ڈرائیور غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ`

**Audit Rationale:**  
Saudi Ministry of Human Resources (Ajeer) regulatory compliance rule. Requires specific legal term "Ajeer permit". Current EN and UR have hybrid fragments.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Driver sponsorship does not match the contracted carrier, with no valid Ajeer permit`
- **Urdu Proposal:** `ڈرائیور کی کفالت معاہدہ شدہ کیریئر سے مماثل نہیں ہے اور کوئی درست اجیر اجازت نامہ موجود نہیں ہے`

---

### Item 32: `projects.labels.settings`
- **Domain:** `security` | **Priority:** `P3` | **Risk Level:** **LOW**
- **Classification:** `BILINGUAL_SOURCE` | **Recommended Decision:** `FIX_SOURCE`
- **Bilingual Source:** Yes
- **Protected Tokens:** `Default Settings & Compliance`
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)`
- **English (Current):** `Settings الافتراضية والامتثال النظامي (Default Settings & Compliance)`
- **Urdu (Current):** `ترتیبات الافتراضية والامتثال النظامي (Default Settings & Compliance)`

**Audit Rationale:**  
Project governance settings header. Source includes full English title in parentheses, creating tautological repetition if translated directly. Recommend fixing canonical source to remove redundant English or providing concise translation.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Default Settings & Regulatory Compliance`
- **Urdu Proposal:** `طے شدہ ترتیبات اور تنظیمی تعمیل (Default Settings & Compliance)`

---

### Item 33: `navigation.labels.pricing_2`
- **Domain:** `pricing` | **Priority:** `P3` | **Risk Level:** **HIGH**
- **Classification:** `FINANCIAL_OPERATIONAL_RISK` | **Recommended Decision:** `REVISE`
- **Bilingual Source:** No
- **Protected Tokens:** None
- **Interpolation Variables:** None

**Current Values:**
- **Arabic (Canonical):** `بناءً على لقطات التسعير التعاقدية للرحلات`
- **English (Current):** `بناءً على لقطات التسعير التعاقدية للرحلات`
- **Urdu (Current):** `بناءً على لقطات التسعير التعاقدية للرحلات`

**Audit Rationale:**  
Pricing audit methodology disclaimer. Explains calculation baseline from contractual rate snapshots. Arabic fallback in EN/UR.

**Suggested Governed Translations (For Human Review Committee):**
- **English Proposal:** `Based on trip contractual pricing snapshots`
- **Urdu Proposal:** `ٹرپس کی معاہداتی قیمتوں کے اسنیپ شاٹس پر مبنی`

---

