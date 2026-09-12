# BLOCK 51 — LOW_RISK Scope Separation & Translation Access Planning

**Generated:** 2026-09-12T13:49:54.804Z
**Status:** COMPLETE — ANALYSIS & PLANNING ONLY (ZERO SOURCE CODE MODIFICATIONS)
**Total Analyzed Candidates:** 110

## 1. Executive Classification Summary

| Class Code | Classification Category | Count | Scope & Accessibility |
| :--- | :--- | :---: | :--- |
| **A** | **COMPONENT_SAFE** | **4** | Inside React component render scope; `useI18n()` is legal and active. |
| **B** | **TOP_LEVEL_DATA** | **31** | Top-level module constants / exported dictionaries; hooks forbidden. |
| **C** | **BUSINESS_DATA** | **31** | Simulation models, entity templates, pricing notes, audit waiver logs. |
| **D** | **STATE_MACHINE** | **43** | Transition guards, assertion runners, mutation locks, event payloads. |
| **E** | **TECHNICAL** | **1** | HTML attributes / non-display tokens. |
| **F** | **NEEDS_ARCHITECTURE_REVIEW** | **0** | User-facing items lacking safe access mechanism. |
| **TOTAL** | | **110** | |

## 2. Architectural Analysis: Non-Hook Translation Access Strategy

### Problem Statement
The current i18n architecture relies on `useI18n()` which is a React hook consuming `I18nContext`. Calling `useI18n()` outside of React function components or custom hooks causes fatal React runtime errors (`Invalid hook call`).

In the remaining 110 LOW_RISK candidates, **31 candidates** are located in top-level dictionaries and **43 candidates** are in state machine guard tests or event payloads.

### Proposed Non-Hook Accessor Designs

1. **Design Option 1: Standalone Pure Function**
   ```typescript
   // src/i18n/accessor.ts (Proposed Design - Not Implemented)
   import { getActiveLocale } from './state';
   import { resolveTranslation } from './runtime';

   export function getTranslation(locale: Locale, key: string, params?: Record<string, any>): string {
     return resolveTranslation(locale, key, params);
   }

   export function translate(key: string, params?: Record<string, any>): string {
     const locale = getActiveLocale();
     return resolveTranslation(locale, key, params);
   }
   ```

2. **Design Option 2: Component Factory / Hook Wrapping Pattern (Preferred for React UI)**
   Rather than maintaining static top-level dictionaries with hardcoded translated strings (which fail to respond dynamically to locale switches without re-import), refactor static dictionaries into memoized hooks:
   ```typescript
   // Example refactoring pattern for EXCEPTION_TYPE_META:
   export function useExceptionTypeMeta(): Record<ExceptionType, ExceptionMeta> {
     const { t } = useI18n();
     return useMemo(() => ({
       WEIGHT_VARIANCE: {
         labelAr: t('exceptions.labels.weight'),
         descAr: t('exceptions.labels.txt_7544cf'),
         ...
       },
     }), [t]);
   }
   ```

## 3. Explicit Protection of Business & Simulation Data

The audit confirmed **31 candidates** that represent business records and must **NEVER** be translated:
- **Project Models & Templates** (`ProjectSetupWizard.tsx`): Carrier names (`شركة النقل المتقدم`), material codes (`ركام طبقة أساس صلب`), contact persons, and pricing contract notes (`اتفاقية الرد الثابت 120 ريال`).
- **Simulation Presets & Test Forms** (`TripEngineView.tsx`): Mock dispatch payloads, truck weights, and test scenario notes.
- **Audit Justification Notes** (`UnloadingStation.tsx`): Administrative waiver note (`تمت مراجعة الفارق واحتساب نسبة رطوبة...`) stored in exception entity records.
- **Master Entity Mappings** (`WeighbridgeImportSection.tsx`): Carrier company titles mapped to truck registration plates in import deduplication caches.
- **Rule Configuration Initializers** (`WeightEngineView.tsx`): Initial rule name (`قاعدة تفاوت موقعية جديدة`) destined for database storage.

## 4. Candidate Detail Catalog by Classification

### Class A — COMPONENT_SAFE (4 candidates)

| Candidate ID | File & Line | Current Text | Translation Key | useI18n Legal? | Non-Hook Needed? | Future Block Recommendation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `cand_block51_020` | `offline/OutboxDrawer.tsx:291` | "قواعد التسعير (Pricing Rules)" | `offline.labels.pricing` | YES | NO | `BLOCK_52_COMPONENT_EXPANSION` |
| `cand_block51_093` | `tripEngine/StateMachineController.tsx:1020` | "تسعير معتمد" | `trips.labels.txt_304e68` | YES | NO | `BLOCK_52_COMPONENT_EXPANSION` |
| `cand_block51_094` | `tripEngine/StateMachineController.tsx:1023` | "destNet + فرق" | `trips.labels.txt_226b89` | YES | NO | `BLOCK_52_COMPONENT_EXPANSION` |
| `cand_block51_109` | `importCenter/WeighbridgeImportSection.tsx:258` | "تمت إعادة ضبط ذاكرة التحقق التكراري (I" | `weighbridge.messages.txt_5d74e2` | YES | NO | `BLOCK_52_COMPONENT_EXPANSION` |

### Class B — TOP_LEVEL_DATA (31 candidates)

| Candidate ID | File & Line | Current Text | Translation Key | useI18n Legal? | Non-Hook Needed? | Future Block Recommendation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `cand_block51_002` | `exceptionEngine/ExceptionEngineView.tsx:53` | "الشاحنة مسجلة رسمياً تحت ناقل مختلف عن" | `exceptions.labels.truckTrip` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_003` | `exceptionEngine/ExceptionEngineView.tsx:59` | "كفالة السائق غير مطابقة للناقل المتعاق" | `exceptions.labels.driver` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_004` | `exceptionEngine/ExceptionEngineView.tsx:65` | "المادة غير مدرجة في قائمة المواد المعت" | `exceptions.labels.materialMaterials` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_005` | `exceptionEngine/ExceptionEngineView.tsx:71` | "الناقل غير معتمد في المشروع أو معلق لأ" | `exceptions.status.carrierProjectPending` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_006` | `exceptionEngine/ExceptionEngineView.tsx:95` | "عدم وجود قاعدة تسعير سارية لنوع المادة" | `exceptions.labels.materialCarrier` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_007` | `exceptionEngine/ExceptionEngineView.tsx:101` | "وجود أكثر من قاعدة تسعير متطابقة وفعال" | `exceptions.labels.trip` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_008` | `exceptionEngine/ExceptionEngineView.tsx:107` | "تعذر رفع ومزامنة بيانات الميزان أو جها" | `exceptions.labels.uploadWeighbridge` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_009` | `exceptionEngine/ExceptionEngineView.tsx:113` | "تحديث سجل الرحلة بنسخة قديمة متضاربة م" | `exceptions.labels.refreshTrip` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_010` | `exceptionEngine/ExceptionEngineView.tsx:202` | "م. سالم القحطاني" | `exceptions.labels.txt_1b5852` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_011` | `exceptionEngine/ExceptionEngineView.tsx:204` | "بدء التدقيق والتحقق من الأدلة المرفقة" | `exceptions.labels.txt_7e9fd6` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_012` | `exceptionEngine/ExceptionEngineView.tsx:220` | "فهد العتيبي (المدقق المالي)" | `exceptions.labels.txt_6cd8e9` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_013` | `exceptionEngine/ExceptionEngineView.tsx:241` | "سلطان الدوسري (مدير الموقع)" | `exceptions.labels.txt_69a397` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_021` | `components/FirestoreArchitectureView.tsx:64` | "المشاريع" | `other.labels.projects_2` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_022` | `components/FirestoreArchitectureView.tsx:72` | "كيان العزل التام للمشاريع (Multi-Tenan" | `other.labels.txt_2d6b3b` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_023` | `components/FirestoreArchitectureView.tsx:81` | "الناقلون" | `other.labels.carriers_2` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_024` | `components/FirestoreArchitectureView.tsx:89` | "شركات النقل المعتمدة والمتعاقدة لتنفيذ" | `other.labels.txt_6be985` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_025` | `components/FirestoreArchitectureView.tsx:106` | "التعريفات المالية المعتمدة لاحتساب قيم" | `other.labels.txt_792227` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_026` | `components/FirestoreArchitectureView.tsx:123` | "المواد الإنشائية أو الركام المنقول مع " | `other.labels.materials_4` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_027` | `components/FirestoreArchitectureView.tsx:150` | "السائقون" | `other.labels.drivers_2` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_028` | `components/FirestoreArchitectureView.tsx:158` | "السائقون الميدانيون المرخصون والمربوطو" | `other.labels.drivers_4` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_029` | `components/FirestoreArchitectureView.tsx:167` | "المستخدمون" | `other.labels.txt_15a8ac` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_030` | `components/FirestoreArchitectureView.tsx:175` | "حسابات مستخدمي المنظومة مع توزيع الأدو" | `other.labels.txt_aba485` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_031` | `components/FirestoreArchitectureView.tsx:202` | "أحداث الرحلة" | `other.labels.trip` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_032` | `components/FirestoreArchitectureView.tsx:210` | "سجل زمني تسلسلي غير قابل للتعديل (Appe" | `other.labels.txt_4a13ec` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_033` | `components/FirestoreArchitectureView.tsx:219` | "الاستثناءات التشغيلية" | `other.labels.txt_1fe296` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_034` | `components/FirestoreArchitectureView.tsx:227` | "سجلات الانحرافات (تجاوز حمولة، فرق ميز" | `other.labels.close` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_035` | `components/FirestoreArchitectureView.tsx:236` | "سجل التدقيق" | `other.labels.txt_334bfc` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_036` | `components/FirestoreArchitectureView.tsx:244` | "سجل أمني وتنظيمي غير قابل للتعديل يوثق" | `other.labels.user_2` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_037` | `components/FirestoreArchitectureView.tsx:253` | "عمليات المزامنة" | `other.labels.txt_43b461` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_038` | `components/FirestoreArchitectureView.tsx:261` | "سجل حماية عدم التكرار (Idempotency) لل" | `other.labels.txt_2670a3` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |
| `cand_block51_039` | `components/FirestoreArchitectureView.tsx:270` | "دفعات الاستيراد" | `other.labels.import` | NO | YES | `BLOCK_52_NON_HOOK_OR_FACTORY` |

### Class C — BUSINESS_DATA (31 candidates)

| Candidate ID | File & Line | Current Text | Translation Key | useI18n Legal? | Non-Hook Needed? | Future Block Recommendation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `cand_block51_014` | `tripEngine/LoadingStation.tsx:301` | "تم تحميل سيناريو مثال التسعير بالطن (3" | `loading.messages.downloadPricing` | YES | NO | `FUTURE_SIMULATION_PILOT` |
| `cand_block51_015` | `tripEngine/LoadingStation.tsx:310` | "تم تحميل سيناريو مثال التسعير بالمقطوع" | `loading.messages.downloadPricing_2` | YES | NO | `FUTURE_SIMULATION_PILOT` |
| `cand_block51_040` | `components/FirestoreArchitectureView.tsx:330` | "مشرف العمليات الميدانية" | `other.labels.txt_604f74` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_041` | `components/FirestoreArchitectureView.tsx:342` | "أحمد بن محمد السالم" | `other.labels.txt_25ee94` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_042` | `components/FirestoreArchitectureView.tsx:392` | "شركة المشرق للنقل اللوجستي" | `other.labels.txt_b59085` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_043` | `components/FirestoreArchitectureView.tsx:397` | "ط ر ق 8892" | `other.labels.txt_327af1` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_044` | `components/FirestoreArchitectureView.tsx:403` | "سعد بن عبد الله الحربي" | `other.labels.txt_600d04` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_045` | `components/FirestoreArchitectureView.tsx:410` | "بيس كورس ركام مدرج فئة أ" | `other.labels.txt_69314d` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_046` | `wizard/ProjectSetupWizard.tsx:144` | "ركام طبقة أساس صلب (Sub-base Grade A)" | `projects.labels.txt_116fe3` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_047` | `wizard/ProjectSetupWizard.tsx:156` | "شركة النقل المتقدم (Carrier A)" | `projects.labels.txt_161375` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_048` | `wizard/ProjectSetupWizard.tsx:160` | "سلطان المطيري" | `projects.labels.txt_4935de` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_049` | `wizard/ProjectSetupWizard.tsx:176` | "اتفاقية الرد الثابت 120 ريال" | `projects.labels.txt_552507` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_050` | `wizard/ProjectSetupWizard.tsx:183` | "م. أحمد الحربي (المدير الإقليمي)" | `projects.labels.txt_10e9ae` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_051` | `wizard/ProjectSetupWizard.tsx:191` | "PRJ - أرشيف ومستندات المشروع اللوجستية" | `projects.labels.project` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_052` | `wizard/ProjectSetupWizard.tsx:218` | "قاعدة تضارب متعمدة لاختبار منع التداخل" | `projects.labels.txt_212615` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_053` | `wizard/ProjectSetupWizard.tsx:243` | "م. أحمد الحربي (المدير الإقليمي)" | `projects.labels.txt_10e9ae` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_095` | `components/TripEngineView.tsx:69` | "شحنة ركام خرساني معتمدة لمشروع نيوم" | `trips.labels.txt_4a383b` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_096` | `components/TripEngineView.tsx:198` | "شحنة ركام بازلتي مطابقة 100% لجميع الش" | `trips.labels.txt_54836e` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_097` | `components/TripEngineView.tsx:218` | "شحنة رمل ناعم مطابقة 100% بنظام المقطو" | `trips.labels.txt_3f8277` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_098` | `components/TripEngineView.tsx:230` | "محاولة ترحيل رحلة لناقل غير مصرح به في" | `trips.labels.tripProject` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_099` | `components/TripEngineView.tsx:240` | "محاولة توريد خلطة أسفلتية غير مصرح بها" | `trips.labels.project` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_100` | `components/TripEngineView.tsx:251` | "محاولة مخالفة تبعية وكفالة الشاحنة للن" | `trips.labels.truck` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_101` | `components/TripEngineView.tsx:261` | "محاولة تطبيق تسعيرة منتهية الصلاحية ال" | `trips.labels.txt_221cc4` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_102` | `components/TripEngineView.tsx:280` | "اختبار حوكمة الأوزان: العميل يحاول إرس" | `trips.labels.txt_756e3e` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_103` | `components/TripEngineView.tsx:1280` | "تمت مطابقة ميزان الاستلام في الموقع" | `trips.labels.location_2` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_104` | `tripEngine/UnloadingStation.tsx:1061` | "تمت مراجعة الفارق واحتساب نسبة رطوبة و" | `unloading.labels.location_2` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_105` | `importCenter/WeighbridgeImportSection.tsx:116` | "شركة أجياد لنقل الركام" | `weighbridge.labels.txt_494ea4` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_106` | `importCenter/WeighbridgeImportSection.tsx:117` | "مؤسسة الوفاق اللوجستية" | `weighbridge.labels.txt_4ac5c7` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_107` | `importCenter/WeighbridgeImportSection.tsx:118` | "شركة أجياد لنقل الركام" | `weighbridge.labels.txt_494ea4` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_108` | `importCenter/WeighbridgeImportSection.tsx:119` | "شركة النقل السريع للخدمات" | `weighbridge.labels.txt_52bf5a` | NO | NO | `PERMANENT_EXCLUSION` |
| `cand_block51_110` | `tripEngine/WeightEngineView.tsx:131` | "قاعدة تفاوت موقعية جديدة" | `weighbridge.labels.txt_49d184` | NO | NO | `PERMANENT_EXCLUSION` |

### Class D — STATE_MACHINE (43 candidates)

| Candidate ID | File & Line | Current Text | Translation Key | useI18n Legal? | Non-Hook Needed? | Future Block Recommendation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `cand_block51_016` | `tripEngine/LoadingStation.tsx:364` | "حظر إنشاء الرحلة بدون اتصال: بيانات وق" | `loading.messages.createTripPricing` | YES | NO | `FUTURE_GUARD_NOTIFICATIONS` |
| `cand_block51_017` | `tripEngine/LoadingStation.tsx:459` | "مشغل محطة التحميل (Offline)" | `loading.labels.download` | NO | YES | `AUDIT_EVENT_STRATEGY` |
| `cand_block51_018` | `tripEngine/LoadingStation.tsx:462` | "تم إنشاء الرحلة واحتساب التسعيرة محليا" | `loading.labels.createTrip` | NO | YES | `AUDIT_EVENT_STRATEGY` |
| `cand_block51_019` | `tripEngine/LoadingStation.tsx:516` | "فشل حظر بدء الرحلة: قاعدة التسعير غير " | `loading.status.failedPricing` | YES | NO | `FUTURE_GUARD_NOTIFICATIONS` |
| `cand_block51_054` | `tripEngine/StateMachineController.tsx:149` | "حظر التعديل المباشر من العميل (Direct " | `trips.labels.edit` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_055` | `tripEngine/StateMachineController.tsx:151` | "فشل الحظر: سمح النظام للعميل بتعديل ال" | `trips.status.failedEditStatus` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_056` | `tripEngine/StateMachineController.tsx:157` | "حظر التعديل المباشر من العميل (Direct " | `trips.labels.edit` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_057` | `tripEngine/StateMachineController.tsx:164` | "[اختبار أمني ناجح]: تم حظر محاولة العم" | `trips.status.edit` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_058` | `tripEngine/StateMachineController.tsx:176` | "مستلم تجريبي" | `trips.labels.txt_31dc56` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_059` | `tripEngine/StateMachineController.tsx:190` | "إكمال الرحلة بدون destNetWeight" | `trips.labels.trip_3` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_060` | `tripEngine/StateMachineController.tsx:197` | "حظر إكمال الرحلة بدون destNetWeight" | `trips.labels.trip_4` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_061` | `tripEngine/StateMachineController.tsx:216` | "مستلم تجريبي" | `trips.labels.txt_31dc56` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_062` | `tripEngine/StateMachineController.tsx:218` | "محاولة إكمال بدون تحديد مستلم أو وقت ت" | `trips.labels.txt_6c3687` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_063` | `tripEngine/StateMachineController.tsx:231` | "إكمال الرحلة بدون unloaderId أو unload" | `trips.labels.trip_5` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_064` | `tripEngine/StateMachineController.tsx:233` | "خطأ: سمح النظام بإكمال الرحلة بدون تحد" | `trips.errors.tripLocation` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_065` | `tripEngine/StateMachineController.tsx:238` | "حظر إكمال الرحلة بدون unloaderId أو un" | `trips.labels.trip_6` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_066` | `tripEngine/StateMachineController.tsx:245` | "[قاعدة رقابية]: تم حظر إكمال الرحلة بد" | `trips.labels.trip_7` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_067` | `tripEngine/StateMachineController.tsx:259` | "مستلم تجريبي" | `trips.labels.txt_31dc56` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_068` | `tripEngine/StateMachineController.tsx:261` | "محاولة إكمال بدون احتساب الفارق" | `trips.labels.txt_cf9663` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_069` | `tripEngine/StateMachineController.tsx:271` | "إتمام رحلة بدون حساب variance" | `trips.labels.trip_8` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_070` | `tripEngine/StateMachineController.tsx:273` | "خطأ: سمح النظام بإتمام الرحلة دون إمكا" | `trips.errors.trip` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_071` | `tripEngine/StateMachineController.tsx:278` | "حظر إتمام رحلة بدون حساب variance" | `trips.labels.trip_9` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_072` | `tripEngine/StateMachineController.tsx:312` | "محاولة بدء رحلة بتسعيرة منتهية الصلاحي" | `trips.labels.trip_10` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_073` | `tripEngine/StateMachineController.tsx:320` | "بدء رحلة عند فشل Pricing Resolution" | `trips.status.tripFailed` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_074` | `tripEngine/StateMachineController.tsx:322` | "خطأ: سمح النظام ببدء الرحلة بالرغم من " | `trips.status.tripFailed_2` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_075` | `tripEngine/StateMachineController.tsx:327` | "حظر بدء رحلة إذا فشل Pricing Resolutio" | `trips.status.tripFailed_3` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_076` | `tripEngine/StateMachineController.tsx:334` | "[قاعدة رقابية]: تم حظر بدء الرحلة لأن " | `trips.labels.tripPricing` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_077` | `tripEngine/StateMachineController.tsx:349` | "محاولة قفز غير قانوني من DRAFT إلى COM" | `trips.labels.txt_5a9b2a` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_078` | `tripEngine/StateMachineController.tsx:359` | "القفز غير القانوني بين الحالات" | `trips.labels.txt_48084e` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_079` | `tripEngine/StateMachineController.tsx:361` | "خطأ: سمح النظام بالقفز مباشرة من DRAFT" | `trips.errors.txt_2f4262` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_080` | `tripEngine/StateMachineController.tsx:366` | "حظر القفز غير القانوني للحالة" | `trips.labels.txt_60d2dd` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_081` | `tripEngine/StateMachineController.tsx:373` | "[محرك الحالات]: تم حظر القفز غير المسم" | `trips.labels.txt_111a38` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_082` | `tripEngine/StateMachineController.tsx:386` | "سائق تجريبي" | `trips.labels.txt_1cdd01` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_083` | `tripEngine/StateMachineController.tsx:388` | "محاولة تغيير الحالة برتبة سائق" | `trips.labels.status` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_084` | `tripEngine/StateMachineController.tsx:394` | "التحول برتبة غير مصرحة" | `trips.labels.txt_52a371` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_085` | `tripEngine/StateMachineController.tsx:396` | "خطأ: سمح النظام للسائق باعتماد حالة ال" | `trips.errors.txt_6d3e6e` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_086` | `tripEngine/StateMachineController.tsx:401` | "حظر التحول لرتبة غير مصرحة (Role Guard" | `trips.labels.txt_6fbbb2` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_087` | `tripEngine/StateMachineController.tsx:408` | "[حظر الصلاحيات]: الرتبة غير مصرح لها ب" | `trips.labels.txt_2c58d3` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_088` | `tripEngine/StateMachineController.tsx:422` | "محاولة تعديل رحلة نيوم من مستخدم يتبع " | `trips.labels.editTrip` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_089` | `tripEngine/StateMachineController.tsx:428` | "التحول من مشروع غير مطابق" | `trips.labels.txt_4877cc` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_090` | `tripEngine/StateMachineController.tsx:430` | "خطأ: سمح النظام للمستخدم بالتحكم برحلة" | `trips.errors.trip_2` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_091` | `tripEngine/StateMachineController.tsx:435` | "حظر تعارض المشاريع (Project Isolation " | `trips.labels.projects` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |
| `cand_block51_092` | `tripEngine/StateMachineController.tsx:442` | "[عزل المشاريع]: تم حظر التعديل بسبب عد" | `trips.labels.edit_2` | NO | YES | `STATE_MACHINE_LOGS_REVIEW` |

### Class E — TECHNICAL (1 candidates)

| Candidate ID | File & Line | Current Text | Translation Key | useI18n Legal? | Non-Hook Needed? | Future Block Recommendation |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `cand_block51_001` | `auth/AuthButton.tsx:43` | "no-referrer" | `authentication.labels.noReferrer` | NO | NO | `PERMANENT_EXCLUSION` |

### Class F — NEEDS_ARCHITECTURE_REVIEW (0 candidates)

*None identified.*

## 5. Summary and Next Steps

- **Zero Source Modifications**: No application source code was modified in BLOCK 51.
- **Verification**: Full test suite and linter pass cleanly with zero regressions.
- **Actionable Expansion**: In Block 52, the 4 `COMPONENT_SAFE` candidates can be safely migrated.
- **Architecture Direction**: For `TOP_LEVEL_DATA` (31 items), the factory hook pattern (`useExceptionTypeMeta`, `useDomainList`) is recommended for implementation in an upcoming architectural block.
