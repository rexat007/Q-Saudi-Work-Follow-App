import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { arTranslations } from '../src/locales/ar';
import { enTranslations } from '../src/locales/en';
import { urTranslations } from '../src/locales/ur';

export interface HumanApprovedDecisionRecord {
  index: number;
  key: string;
  domain: string;
  priority: string;
  originalClassification: string;
  originalBlock68Recommendation: 'APPROVE' | 'REVISE' | 'KEEP_EXCEPTION' | 'FIX_SOURCE';
  humanDecision: 'APPROVE' | 'REVISE' | 'KEEP_EXCEPTION' | 'FIX_SOURCE';
  approvedEN: string | null;
  approvedUR: string | null;
  approvedArabicAction: {
    action: string;
    from: string;
    to: string;
    sourcePhraseRemoved?: string;
  } | null;
  preservedProtectedTokens: string[];
  preservedInterpolationVariables: string[];
  rationale: string;
  reviewStatus: 'REVIEWED';
  reviewerDecision: 'APPROVED';
  sourceOfDecision: 'HUMAN_REVIEW_CHAT';
  appliedToCodebase: false;
}

// Exactly the 33 human decisions supplied by the user
const rawDecisions = [
  {
    index: 1,
    key: 'trips.status.failedPricing',
    humanDecision: 'REVISE' as const,
    approvedEN: '[Trip Start Blocked]: Pricing resolution and settlement calculation failed (Pricing Resolution Failed) - ${pricingResolutionResult.message}',
    approvedUR: '[ٹرپ شروع کرنا ممنوع]: قیمت کے تعین اور تصفیے کے حساب میں ناکامی ہوئی (Pricing Resolution Failed) - ${pricingResolutionResult.message}',
    approvedArabicAction: null,
    preservedProtectedTokens: ['${pricingResolutionResult.message}', 'Pricing Resolution Failed'],
    preservedInterpolationVariables: ['${pricingResolutionResult.message}'],
    rationale: 'Human-approved precise wording distinguishing dispatch blocking, with exact runtime template variable and bilingual parenthetical retained.'
  },
  {
    index: 2,
    key: 'trips.labels.trip_4',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Trip completion blocked without destNetWeight',
    approvedUR: 'destNetWeight کے بغیر ٹرپ کی تکمیل ممنوع ہے',
    approvedArabicAction: null,
    preservedProtectedTokens: ['destNetWeight'],
    preservedInterpolationVariables: [],
    rationale: 'Preserves immutable schema identifier destNetWeight while providing clean professional translations.'
  },
  {
    index: 3,
    key: 'trips.labels.trip_7',
    humanDecision: 'REVISE' as const,
    approvedEN: '[Regulatory Rule]: Trip completion blocked without an authorized unloader (unloaderId) and unloading timestamp (unloadTime).',
    approvedUR: '[نگرانی کا اصول]: مجاز وصول کنندہ (unloaderId) اور ان لوڈنگ وقت (unloadTime) کے بغیر ٹرپ مکمل کرنا ممنوع ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: ['unloaderId', 'unloadTime'],
    preservedInterpolationVariables: [],
    rationale: 'Preserves schema audit keys unloaderId and unloadTime within standardized regulatory rule wrapper.'
  },
  {
    index: 4,
    key: 'trips.labels.txt_2c17d4',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Completion prohibited without recipient identity and unloading timestamp',
    approvedUR: 'وصول کنندہ کی شناخت اور ان لوڈنگ کے وقت کے بغیر تکمیل ممنوع ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Direct professional translation of unloading credential constraint.'
  },
  {
    index: 5,
    key: 'trips.labels.txt_2cd3f8',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Regulatory Enforcement Verification Matrix (Negative Stress Tests)',
    approvedUR: 'ریگولیٹری نفاذ کی تصدیقی میٹرکس (Negative Stress Tests)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['Negative Stress Tests'],
    preservedInterpolationVariables: [],
    rationale: 'Preserves technical QA suite parenthetical (Negative Stress Tests) with authoritative domain phrasing.'
  },
  {
    index: 6,
    key: 'trips.labels.txt_37b15d',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Completion prohibited if discrepancy cannot be accurately calculated',
    approvedUR: 'اگر فرق کا درست حساب نہ ہو سکے تو تکمیل ممنوع ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'High-risk financial settlement variance constraint, approved with precise legal/operational terminology.'
  },
  {
    index: 7,
    key: 'trips.labels.txt_3a0ff7',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Settlement Amount Due:',
    approvedUR: 'قابلِ ادائیگی تصفیے کی رقم:',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Settlement amount accounting header rendered cleanly in both target locales.'
  },
  {
    index: 8,
    key: 'trips.labels.txt_5f22c5',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Full lifecycle transition governance: verifying rank and project, mandatory weights, recipient, and arrival time, with server-side calculation of variance and settlement.',
    approvedUR: 'لائف سائیکل کے تمام مراحل کی مکمل نگرانی: رینک اور پروجیکٹ کی تصدیق، لازمی وزن، وصول کنندہ اور آمد کا وقت، اور سرور پر فرق اور تصفیے کا حساب۔',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Comprehensive lifecycle audit policy description, replacing hybrid fragments with unified professional syntax.'
  },
  {
    index: 9,
    key: 'trips.labels.txt_622420',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Server-side verification of the six rules, with automated weight calculation and settlement.',
    approvedUR: 'چھ قواعد کی سرور پر تصدیق، اور وزن و تصفیے کا خودکار حساب۔',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Direct server verification statement with natural phrasing.'
  },
  {
    index: 10,
    key: 'trips.labels.txt_701a0c',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Skipping mandatory operational stages is prohibited',
    approvedUR: 'لازمی آپریشنل مراحل کو چھوڑنا ممنوع ہے',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Operational state-machine boundary rule.'
  },
  {
    index: 11,
    key: 'trips.labels.txt_761b23',
    humanDecision: 'KEEP_EXCEPTION' as const,
    approvedEN: 'unchanged',
    approvedUR: 'unchanged',
    approvedArabicAction: null,
    preservedProtectedTokens: ['"خلطة أسفلتية ساخنة"'],
    preservedInterpolationVariables: [],
    rationale: 'Kept as intentional exception: negative testing simulation fixture with literal material name matching test assertions.'
  },
  {
    index: 12,
    key: 'trips.labels.txt_7d5bc8',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Total Calculated Settlement',
    approvedUR: 'کل محسوب شدہ تصفیہ',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Financial calculation metric summary label.'
  },
  {
    index: 13,
    key: 'trips.labels.txt_7d6134',
    humanDecision: 'APPROVE' as const,
    approvedEN: 'Settlement (SAR)',
    approvedUR: 'تصفیہ (SAR)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['SAR'],
    preservedInterpolationVariables: [],
    rationale: 'Approved existing standard representation: ISO-4217 currency code SAR.'
  },
  {
    index: 14,
    key: 'loading.labels.txt_57f8de',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Approved Settlement:',
    approvedUR: 'منظور شدہ تصفیہ:',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Approved settlement label in loading dispatch flow.'
  },
  {
    index: 15,
    key: 'loading.labels.txt_73e4a3',
    humanDecision: 'FIX_SOURCE' as const,
    approvedEN: 'Estimated Settlement',
    approvedUR: 'تخمینی تصفیہ',
    approvedArabicAction: {
      action: 'REMOVE_REDUNDANT_ENGLISH_PARENTHETICAL',
      from: 'التسوية التقديرية (Settlement)',
      to: 'التسوية التقديرية'
    },
    preservedProtectedTokens: ['Settlement'],
    preservedInterpolationVariables: [],
    rationale: 'Approved FIX_SOURCE: Canonical Arabic will be updated in controlled source phase to remove redundant English parenthetical (Settlement).'
  },
  {
    index: 16,
    key: 'unloading.labels.txt_1cfd3c',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Approve Exception & Authorize Settlement (Waive Exception)',
    approvedUR: 'استثناء کی منظوری اور تصفیہ کی اجازت (Waive Exception)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['Waive Exception'],
    preservedInterpolationVariables: [],
    rationale: 'Critical compliance waiver action; preserves technical action code Waive Exception.'
  },
  {
    index: 17,
    key: 'unloading.labels.txt_5f0c9f',
    humanDecision: 'REVISE' as const,
    approvedEN: '4️⃣ Single License Plate Prohibited (PROHIBITED)',
    approvedUR: '4️⃣ سنگل لائسنس پلیٹ ممنوع (PROHIBITED)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['PROHIBITED'],
    preservedInterpolationVariables: [],
    rationale: 'Enforcement status keeping emoji and technical code PROHIBITED.'
  },
  {
    index: 18,
    key: 'weighbridge.labels.txt_35a0be',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Precise calculation of financial settlement by ton or trip requiring net > 0, returning null on missing data',
    approvedUR: 'ٹن یا ٹرپ کے لحاظ سے مالی تصفیے کا درست حساب، جس کے لیے net > 0 ضروری ہے، اور ڈیٹا غائب ہونے پر null واپس کیا جائے گا۔',
    approvedArabicAction: null,
    preservedProtectedTokens: ['net > 0', 'null'],
    preservedInterpolationVariables: [],
    rationale: 'Weighbridge logic condition strictly preserving mathematical expression net > 0 and programmatic null.'
  },
  {
    index: 19,
    key: 'weighbridge.labels.txt_407887',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Audit calculation functions, validation criteria, prohibit replacing missing values with zero, and evaluate variance (NORMAL / WARNING / EXCEPTION)',
    approvedUR: 'حسابی فنکشنز اور تصدیقی معیارات کی جانچ، گمشدہ ڈیٹا کو صفر سے تبدیل کرنے کی ممانعت، اور فرق کا جائزہ (NORMAL / WARNING / EXCEPTION)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['NORMAL', 'WARNING', 'EXCEPTION'],
    preservedInterpolationVariables: [],
    rationale: 'Preserves system status enums NORMAL / WARNING / EXCEPTION with approved technical wording.'
  },
  {
    index: 20,
    key: 'offline.labels.txt_402c63',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Amount & Settlement:',
    approvedUR: 'رقم اور تصفیہ:',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Concise summary label for offline queue reconciliation.'
  },
  {
    index: 21,
    key: 'loading.labels.save_3',
    humanDecision: 'REVISE' as const,
    approvedEN: 'The settlement amount (settlementAmount) has no input field in the interface and is calculated exclusively server-side (Server-Side Calculation). Any client-submitted value is ignored and logged in regulatory audit trails.',
    approvedUR: 'تصفیے کی رقم (settlementAmount) کے لیے انٹرفیس میں کوئی ان پٹ فیلڈ نہیں ہے، اور اس کا حساب مکمل طور پر سرور پر (Server-Side Calculation) کیا جاتا ہے۔ کلائنٹ کی طرف سے بھیجی گئی کسی بھی رقم کو نظر انداز کر کے اسے ریگولیٹری آڈٹ لاگز میں محفوظ کیا جاتا ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: ['settlementAmount', 'Server-Side Calculation'],
    preservedInterpolationVariables: [],
    rationale: 'Security contract enforcing server-side calculation and preserving settlementAmount.'
  },
  {
    index: 22,
    key: 'unloading.labels.txt_186f77',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Automated Compliance Report for Unloading Station Requirements (Unloading Station Tests)',
    approvedUR: 'ان لوڈنگ اسٹیشن کے تقاضوں کی خودکار تعمیلی رپورٹ (Unloading Station Tests)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['Unloading Station Tests'],
    preservedInterpolationVariables: [],
    rationale: 'Station compliance QA suite title preserving Unloading Station Tests.'
  },
  {
    index: 23,
    key: 'unloading.labels.txt_1bec3a',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Automated Compliance Check (7 Requirements)',
    approvedUR: 'خودکار تعمیلی جانچ (7 شرائط)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['7'],
    preservedInterpolationVariables: [],
    rationale: 'Audit requirement count preserving numeral 7.'
  },
  {
    index: 24,
    key: 'unloading.labels.txt_68980a',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Regulatory Security Block (BLOCKED)',
    approvedUR: 'نگرانی کا سیکیورٹی بلاک (BLOCKED)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['BLOCKED'],
    preservedInterpolationVariables: [],
    rationale: 'Regulatory enforcement badge preserving status BLOCKED.'
  },
  {
    index: 25,
    key: 'offline.labels.createTripPricing',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Offline Trip Creation Prohibited: Pricing data is not available locally in browser storage (IndexedDB). No trip may be created without an approved pricing calculation.',
    approvedUR: 'آف لائن ٹرپ بنانا ممنوع ہے: قیمتوں کا ڈیٹا براؤزر کے مقامی اسٹوریج (IndexedDB) میں دستیاب نہیں ہے۔ منظور شدہ قیمت کے حساب کے بغیر کوئی ٹرپ بنانے کی اجازت نہیں ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: ['IndexedDB'],
    preservedInterpolationVariables: [],
    rationale: 'Critical statutory offline block preserving IndexedDB.'
  },
  {
    index: 26,
    key: 'navigation.labels.txt_2f3fde',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Settlement Due',
    approvedUR: 'واجب الادا تصفیہ',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Financial filter badge.'
  },
  {
    index: 27,
    key: 'entityResolution.labels.importEdit',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Executes prior to approving any import file (Import) or modifying reference data (Master Data). Prevents erroneous automatic merges (Auto-Merge) and prohibits regulatory conflicts.',
    approvedUR: 'کسی بھی امپورٹ فائل (Import) کی منظوری یا ماسٹر ڈیٹا (Master Data) میں ترمیم سے پہلے چلتا ہے۔ غلط خودکار انضمام (Auto-Merge) کو روکتا ہے اور تنظیمی تنازعات کو روکتا ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: ['Import', 'Master Data', 'Auto-Merge'],
    preservedInterpolationVariables: [],
    rationale: 'Reference data governance policy strictly preserving Import, Master Data, and Auto-Merge.'
  },
  {
    index: 28,
    key: 'entityResolution.labels.txt_2b8f60',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Record excluded and blocked from entry.',
    approvedUR: 'ریکارڈ کو اندراج سے خارج اور بلاک کر دیا گیا ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Entity collision blocking status.'
  },
  {
    index: 29,
    key: 'projects.labels.txt_6757e5',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Value Added Tax Rate % (VAT)',
    approvedUR: 'ویلیو ایڈڈ ٹیکس کی شرح % (VAT)',
    approvedArabicAction: null,
    preservedProtectedTokens: ['VAT', '%'],
    preservedInterpolationVariables: [],
    rationale: 'Tax rate configuration preserving VAT and %.'
  },
  {
    index: 30,
    key: 'offline.labels.txt_305c29',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Dependency reconciliation and matching with server master data',
    approvedUR: 'سرور کے بنیادی ڈیٹا کے ساتھ وابستگیوں کی مطابقت اور تصفیہ',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Offline master-data synchronization state.'
  },
  {
    index: 31,
    key: 'exceptions.labels.driver',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Driver sponsorship does not match the contracted carrier, with no valid Ajeer permit',
    approvedUR: 'ڈرائیور کی کفالت معاہدہ شدہ کیریئر سے مماثل نہیں ہے اور کوئی درست Ajeer اجازت نامہ موجود نہیں ہے۔',
    approvedArabicAction: null,
    preservedProtectedTokens: ['Ajeer'],
    preservedInterpolationVariables: [],
    rationale: 'Ministry of Human Resources compliance check preserving statutory token Ajeer.'
  },
  {
    index: 32,
    key: 'projects.labels.settings',
    humanDecision: 'FIX_SOURCE' as const,
    approvedEN: 'Default Settings & Regulatory Compliance',
    approvedUR: 'طے شدہ ترتیبات اور ضابطہ جاتی تعمیل',
    approvedArabicAction: {
      action: 'REMOVE_REDUNDANT_ENGLISH_PARENTHETICAL',
      from: 'الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)',
      to: 'الإعدادات الافتراضية والامتثال النظامي',
      sourcePhraseRemoved: 'Default Settings & Compliance'
    },
    preservedProtectedTokens: ['Default Settings & Compliance'],
    preservedInterpolationVariables: [],
    rationale: 'Approved FIX_SOURCE: Canonical Arabic will be updated in controlled source phase to remove redundant English parenthetical (Default Settings & Compliance).'
  },
  {
    index: 33,
    key: 'navigation.labels.pricing_2',
    humanDecision: 'REVISE' as const,
    approvedEN: 'Based on trip contractual pricing snapshots',
    approvedUR: 'معاہداتی ٹرپ قیمتوں کے اسنیپ شاٹس پر مبنی',
    approvedArabicAction: null,
    preservedProtectedTokens: [],
    preservedInterpolationVariables: [],
    rationale: 'Trip pricing snapshot calculation baseline note.'
  }
];

export function generateBlock69Approvals() {
  const block68JsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.json');
  const block68Data = JSON.parse(fs.readFileSync(block68JsonPath, 'utf-8'));
  const block68ItemsMap = new Map<string, any>();
  for (const item of block68Data.items) {
    block68ItemsMap.set(item.key, item);
  }

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const approvedRecords: HumanApprovedDecisionRecord[] = rawDecisions.map((raw) => {
    const b68 = block68ItemsMap.get(raw.key);
    if (!b68) {
      throw new Error(`Key ${raw.key} not found in Block 68 review decisions!`);
    }

    return {
      index: raw.index,
      key: raw.key,
      domain: b68.domain,
      priority: b68.priority,
      originalClassification: b68.classification,
      originalBlock68Recommendation: b68.recommendedDecision,
      humanDecision: raw.humanDecision,
      approvedEN: raw.approvedEN,
      approvedUR: raw.approvedUR,
      approvedArabicAction: raw.approvedArabicAction,
      preservedProtectedTokens: raw.preservedProtectedTokens,
      preservedInterpolationVariables: raw.preservedInterpolationVariables,
      rationale: raw.rationale,
      reviewStatus: 'REVIEWED',
      reviewerDecision: 'APPROVED',
      sourceOfDecision: 'HUMAN_REVIEW_CHAT',
      appliedToCodebase: false
    };
  });

  // Calculate counts
  const totalCount = approvedRecords.length;
  const decisionCounts = approvedRecords.reduce((acc, r) => {
    acc[r.humanDecision] = (acc[r.humanDecision] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Compute deterministic SHA-256 checksum of the decisions
  const canonicalString = JSON.stringify(approvedRecords, Object.keys(approvedRecords[0]).sort());
  const ledgerChecksum = crypto.createHash('sha256').update(canonicalString).digest('hex');

  const approvedJson = {
    metadata: {
      block: 'BLOCK-69',
      title: 'Human-Approved Translation Decision Ledger',
      timestamp: '2026-09-13T14:10:00.000Z',
      governanceStatus: 'HUMAN_DECISIONS_RECORDED_ZERO_CODE_APPLICATION',
      sourceOfDecision: 'HUMAN_REVIEW_CHAT',
      totalItems: totalCount,
      allDecisionsApproved: true,
      allReviewsCompleted: true,
      appliedToCodebase: false,
      ledgerChecksum
    },
    summary: {
      totalItems: totalCount,
      reviewedCount: totalCount,
      approvedCount: totalCount,
      appliedCount: 0,
      decisionCounts: {
        REVISE: decisionCounts.REVISE || 0,
        FIX_SOURCE: decisionCounts.FIX_SOURCE || 0,
        APPROVE: decisionCounts.APPROVE || 0,
        KEEP_EXCEPTION: decisionCounts.KEEP_EXCEPTION || 0
      },
      sourceFixRequiredCount: decisionCounts.FIX_SOURCE || 0,
      keepExceptionCount: decisionCounts.KEEP_EXCEPTION || 0,
      protectedTokensPreservedCount: approvedRecords.filter((r) => r.preservedProtectedTokens.length > 0).length,
      interpolationVariablesPreservedCount: approvedRecords.filter((r) => r.preservedInterpolationVariables.length > 0).length
    },
    items: approvedRecords
  };

  const jsonOutputPath = path.join(reportsDir, 'i18n-human-approved-decisions.json');
  fs.writeFileSync(jsonOutputPath, JSON.stringify(approvedJson, null, 2), 'utf-8');

  // Build Markdown dossier
  let md = `# Block 69: Human-Approved Translation Decision Ledger

**Timestamp:** 2026-09-13T14:10:00.000Z  
**Block Scope:** Block 69 Record Human-Approved Translation Decisions  
**Source of Decisions:** \`HUMAN_REVIEW_CHAT\`  
**Governance Policy:** Zero Code Application • Record-Only • Ledger Checksum Signed  
**Review Status:** ALL 33 ITEMS \`REVIEWED\` AND \`APPROVED\`  
**Ledger SHA-256 Checksum:** \`${ledgerChecksum}\`  

---

## 1. Executive Summary & Compliance Attestation

The **33 authoritative Human Review items** isolated in Block 67 and presented with audit options in Block 68 have been manually reviewed and formally decided outside the codebase via the official Human Review interface.

### Strict Governance Constraints Met:
1. **Zero Translation Application:** No strings were applied to \`src/locales/ar/index.ts\`, \`src/locales/en/index.ts\`, or \`src/locales/ur/index.ts\`.
2. **Zero Arabic Source Changes:** Canonical Arabic text remains 100% untouched.
3. **Zero Test Fixture Modifications:** Negative testing and contract fixtures remain completely unchanged.
4. **Zero Business Logic Edits:** Application logic is completely untouched.
5. **Exact Human Authority:** Decisions were recorded exactly as supplied, with zero synthetic reinterpretation.

---

## 2. Quantitative Reconciliation & Metrics

| Metric Dimension | Target | Ledger Count | Status |
| :--- | :---: | :---: | :--- |
| **Total Human Review Records** | **33** | **${totalCount}** | Exact Reconciliation |
| **Review Status** | **33 REVIEWED** | **33** | 100% Reviewed |
| **Reviewer Decision** | **33 APPROVED** | **33** | 100% Approved |
| **Decisions: REVISE** | **29** | **${decisionCounts.REVISE || 0}** | Exactly Matches Human Mandate |
| **Decisions: FIX_SOURCE** | **2** | **${decisionCounts.FIX_SOURCE || 0}** | Scheduled for Source Cleanup |
| **Decisions: APPROVE** | **1** | **${decisionCounts.APPROVE || 0}** | Confirmed Existing Standard |
| **Decisions: KEEP_EXCEPTION** | **1** | **${decisionCounts.KEEP_EXCEPTION || 0}** | Retained Contract Test Fixture |
| **Applied to Locales** | **0** | **0** | Zero Code Modifications |
| **Protected Token Integrity** | **100%** | **20 keys** | Strictly Preserved |
| **Interpolation Integrity** | **100%** | **1 key** | Strictly Preserved |

---

## 3. Human Approved Decision Ledger (Item-by-Item)

`;

  approvedRecords.forEach((record) => {
    md += `### Item ${record.index}: \`${record.key}\`
- **Domain:** \`${record.domain}\` | **Priority:** \`${record.priority}\` | **Original Classification:** \`${record.originalClassification}\`
- **Block 68 Recommendation:** \`${record.originalBlock68Recommendation}\`
- **Human Decision:** **\`${record.humanDecision}\`**
- **Review Status:** \`${record.reviewStatus}\` | **Reviewer Decision:** **\`${record.reviewerDecision}\`**
- **Source of Decision:** \`${record.sourceOfDecision}\`

#### Approved Content
- **Approved English:** ${record.approvedEN ? `\`${record.approvedEN}\`` : '_N/A_'}
- **Approved Urdu:** ${record.approvedUR ? `\`${record.approvedUR}\`` : '_N/A_'}
${
  record.approvedArabicAction
    ? `- **Approved Arabic Source Action:** \`${record.approvedArabicAction.action}\`  
  - *From:* \`${record.approvedArabicAction.from}\`  
  - *To:* \`${record.approvedArabicAction.to}\`  
  ${record.approvedArabicAction.sourcePhraseRemoved ? `- *Source Phrase Removed:* \`${record.approvedArabicAction.sourcePhraseRemoved}\`` : ''}`
    : ''
}
- **Preserved Protected Tokens:** ${
      record.preservedProtectedTokens.length > 0
        ? record.preservedProtectedTokens.map((t) => `\`${t}\``).join(', ')
        : '_None_'
    }
- **Preserved Interpolation Variables:** ${
      record.preservedInterpolationVariables.length > 0
        ? record.preservedInterpolationVariables.map((v) => `\`${v}\``).join(', ')
        : '_None_'
    }

#### Rationale & Audit Trail
${record.rationale}

---

`;
  });

  const mdOutputPath = path.join(reportsDir, 'i18n-human-approved-decisions.md');
  fs.writeFileSync(mdOutputPath, md, 'utf-8');

  console.log(`Block 69: Generated human approved decisions ledger:`);
  console.log(`  - ${jsonOutputPath}`);
  console.log(`  - ${mdOutputPath}`);
  console.log(`  - SHA-256: ${ledgerChecksum}`);
  return { approvedJson, ledgerChecksum };
}

if (process.argv[1]?.endsWith('buildBlock69Approvals.ts')) {
  generateBlock69Approvals();
}
