import fs from 'fs';
import path from 'path';
import { top100Vetted } from './curate-top100-translations';

export interface Block61Entry {
  key: string;
  domain: string;
  priority: string;
  category: 'B' | 'C';
  problemType: string;
  sourceFile: string;
  ar: string;
  oldEn: string;
  newEn: string;
  oldUr: string;
  newUr: string;
  problem: string;
  reviewStatus: 'REVIEW_REQUIRED';
  rationale: string;
  rankInQueue: number;
}

export interface SkippedItem {
  key: string;
  rank: number;
  category: string;
  priority: string;
  reason: string;
}

// Additional vetted translations for items not in top100Vetted or needing strict parameter preservation
export const block61SpecificOverrides: Record<string, { en: string; ur: string; rationale: string }> = {
  // Strict token & parameter preservation overrides
  "dashboard.labels.txt_6f8552": {
    en: "All (PER_TRIP + PER_TON)",
    ur: "تمام (PER_TRIP + PER_TON)",
    rationale: "Preserved pricing model technical tokens (PER_TRIP + PER_TON)."
  },
  "unloading.status.truck": {
    en: "Truck arrival at site successfully documented: transitioned to [ARRIVED] and recorded arrival time.",
    ur: "سائٹ پر ٹرک کی آمد کامیابی کے ساتھ ریکارڈ کی گئی: [ARRIVED] میں منتقل کر دیا گیا اور آمد کا وقت درج کیا گیا۔",
    rationale: "Preserved ARRIVED protected token and refined translation."
  },
  "trips.labels.material": {
    en: "Material (${params.materialId}) is not registered in the system",
    ur: "مٹیریل (${params.materialId}) سسٹم میں رجسٹرڈ نہیں ہے",
    rationale: "Preserved materialId parameter and standardized wording."
  },
  "trips.labels.trip_19": {
    en: "Trip (${params.tripId}) does not exist in the system",
    ur: "ٹرپ (${params.tripId}) سسٹم میں موجود نہیں ہے",
    rationale: "Preserved tripId parameter and standardized wording."
  },
  "trips.labels.trip_20": {
    en: "Trip (${tripId}) does not exist in the system.",
    ur: "ٹرپ (${tripId}) سسٹم میں موجود نہیں ہے۔",
    rationale: "Preserved tripId parameter."
  },
  "trips.labels.trip_21": {
    en: "Trip (${tripId}) does not exist",
    ur: "ٹرپ (${tripId}) موجود نہیں ہے",
    rationale: "Preserved tripId parameter."
  },
  "trips.labels.trip_25": {
    en: "Trip (${params.tripId}) does not exist.",
    ur: "ٹرپ (${params.tripId}) موجود نہیں ہے۔",
    rationale: "Preserved tripId parameter."
  },
  "trips.labels.truck_2": {
    en: "The specified truck does not exist or is not authorized to operate (INACTIVE)",
    ur: "مخصوص ٹرک موجود نہیں ہے یا کام کرنے کے لیے مجاز نہیں ہے (INACTIVE)",
    rationale: "Preserved INACTIVE protected token."
  },
  "trips.labels.truckCarrier": {
    en: "Relationship conflict: Truck (${truck.plate}) belongs to carrier (${actualCarrier}) and not the selected carrier (${params.carrierId})",
    ur: "تعلق کا تنازع: ٹرک (${truck.plate}) کیریئر (${actualCarrier}) سے منسلک ہے نہ کہ منتخب کیریئر (${params.carrierId}) سے",
    rationale: "Preserved all parameters and carrierId token."
  },
  "trips.labels.txt_240ccf": {
    en: "Rule verification: destNetWeight and varianceWeight are converted from null to verified numbers.",
    ur: "اصول کی توثیق: destNetWeight اور varianceWeight کو null سے تصدیق شدہ اعداد میں تبدیل کیا جاتا ہے۔",
    rationale: "Removed Arabic fragments from EN and UR; preserved technical identifiers."
  },
  "trips.labels.txt_268208": {
    en: "Test Scenario Matrix (7 Cases)",
    ur: "ٹیسٹ کے منظر ناموں کا میٹرکس (7 حالات)",
    rationale: "Converted Arabic fallback to standardized QA matrix header."
  },
  "trips.labels.txt_2ed89d": {
    en: "2. Weight Governance (Weights)",
    ur: "2. وزن کی گورننس (Weights)",
    rationale: "Converted Arabic fallback while preserving technical tag."
  },
  "trips.labels.txt_371dfc": {
    en: "Lifecycle Control in Central Engine",
    ur: "مرکزی انجن میں لائف سائیکل کنٹرول",
    rationale: "Converted Arabic fallback to professional state-machine terminology."
  },
  "trips.labels.txt_2750ef": {
    en: "OPERATIONS_MANAGER (Operations Manager)",
    ur: "OPERATIONS_MANAGER (آپریشنز مینیجر)",
    rationale: "Standardized role label while preserving OPERATIONS_MANAGER technical code."
  }
};

export function selectAndPrepareBlock61(): {
  selectedEntries: Block61Entry[];
  skippedItems: SkippedItem[];
} {
  const planPath = path.resolve(process.cwd(), 'reports/i18n-block60-quality-plan.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  const hrKeys = new Set(plan.humanReviewQueue.map((x: any) => x.key));
  const excludedKeys = new Set(plan.protectedExclusions.map((x: any) => x.key));

  let countB = 0;
  let countC = 0;
  const selectedEntries: Block61Entry[] = [];
  const skippedItems: SkippedItem[] = [];

  for (let i = 0; i < plan.authoritativeRemainingQueue.length; i++) {
    const item = plan.authoritativeRemainingQueue[i];

    if (hrKeys.has(item.key)) {
      skippedItems.push({
        key: item.key,
        rank: i + 1,
        category: item.category,
        priority: item.priority,
        reason: 'Section 8 Human Review queue item (prohibited from automatic modification)'
      });
      continue;
    }

    if (excludedKeys.has(item.key)) {
      skippedItems.push({
        key: item.key,
        rank: i + 1,
        category: item.category,
        priority: item.priority,
        reason: 'Protected exclusion item (architectural or invariant code)'
      });
      continue;
    }

    // Skip status_6 due to embedded Arabic in interpolation parameter expression
    if (item.key === 'trips.labels.status_6') {
      skippedItems.push({
        key: item.key,
        rank: i + 1,
        category: item.category,
        priority: item.priority,
        reason: "Embedded Arabic in interpolation parameter expression (\${rule.allowedFrom.join(', ') || 'لا يوجد'}) violates zero-Arabic EN requirement"
      });
      continue;
    }

    // Skip navigation.labels.trips to preserve legacy test fixture for switcherAndQualityBlock56.test.ts (I18N-QUALITY-01)
    if (item.key === 'navigation.labels.trips') {
      skippedItems.push({
        key: item.key,
        rank: i + 1,
        category: item.category,
        priority: item.priority,
        reason: 'Hard-pinned in legacy quality test suite switcherAndQualityBlock56.test.ts (I18N-QUALITY-01) as required detection fixture'
      });
      continue;
    }

    if (item.category === 'B' && countB < 70) {
      countB++;
      const trans = block61SpecificOverrides[item.key] || top100Vetted[item.key];
      if (!trans) {
        throw new Error(`Missing vetted translation for Category B key: ${item.key}`);
      }
      selectedEntries.push({
        key: item.key,
        domain: item.domain,
        priority: item.priority,
        category: 'B',
        problemType: item.problemType,
        sourceFile: item.sourceFile,
        ar: item.ar,
        oldEn: item.currentEn,
        newEn: trans.en,
        oldUr: item.currentUr,
        newUr: trans.ur,
        problem: item.problemType,
        reviewStatus: 'REVIEW_REQUIRED',
        rationale: trans.rationale,
        rankInQueue: i + 1
      });
    } else if (item.category === 'C' && countC < 30) {
      countC++;
      const trans = block61SpecificOverrides[item.key] || top100Vetted[item.key];
      if (!trans) {
        throw new Error(`Missing vetted translation for Category C key: ${item.key}`);
      }
      selectedEntries.push({
        key: item.key,
        domain: item.domain,
        priority: item.priority,
        category: 'C',
        problemType: item.problemType,
        sourceFile: item.sourceFile,
        ar: item.ar,
        oldEn: item.currentEn,
        newEn: trans.en,
        oldUr: item.currentUr,
        newUr: trans.ur,
        problem: item.problemType,
        reviewStatus: 'REVIEW_REQUIRED',
        rationale: trans.rationale,
        rankInQueue: i + 1
      });
    }

    if (countB === 70 && countC === 30) {
      break;
    }
  }

  if (selectedEntries.length !== 100) {
    throw new Error(`Expected exactly 100 selected entries, got ${selectedEntries.length}`);
  }
  if (countB !== 70) {
    throw new Error(`Expected exactly 70 Category B entries, got ${countB}`);
  }
  if (countC !== 30) {
    throw new Error(`Expected exactly 30 Category C entries, got ${countC}`);
  }

  return { selectedEntries, skippedItems };
}

export function executeBlock61() {
  console.log('Starting BLOCK 61 execution...');
  const { selectedEntries, skippedItems } = selectAndPrepareBlock61();

  const enPath = path.resolve(process.cwd(), 'src/locales/en/index.ts');
  const urPath = path.resolve(process.cwd(), 'src/locales/ur/index.ts');
  const arPath = path.resolve(process.cwd(), 'src/locales/ar/index.ts');

  let enContent = fs.readFileSync(enPath, 'utf8');
  let urContent = fs.readFileSync(urPath, 'utf8');
  const arContent = fs.readFileSync(arPath, 'utf8');

  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;
  const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;
  const protectedTokens = [
    'SAR', 'KG', 'TON', 'CSV', 'Excel', 'PWA', 'JSON', 'RBAC', 'API',
    'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'PENDING', 'LOADED', 'ACTIVE',
    'ticketId', 'truckNo', 'projectId', 'carrierId', 'driverId', 'materialId',
    'operationId', 'pricingType', 'settlementBase', 'sourceType'
  ];

  let enReplaced = 0;
  let urReplaced = 0;

  for (const entry of selectedEntries) {
    // Quality Checks
    if (arabicRegex.test(entry.newEn)) {
      throw new Error(`Arabic characters found in EN for key "${entry.key}": "${entry.newEn}"`);
    }
    if (hybridSuffixRegex.test(entry.newEn)) {
      throw new Error(`Hybrid morphology found in EN for key "${entry.key}": "${entry.newEn}"`);
    }
    if (hybridSuffixRegex.test(entry.newUr)) {
      throw new Error(`Hybrid morphology found in UR for key "${entry.key}": "${entry.newUr}"`);
    }
    if (!entry.newEn.trim()) {
      throw new Error(`Empty EN translation for key "${entry.key}"`);
    }
    if (!entry.newUr.trim()) {
      throw new Error(`Empty UR translation for key "${entry.key}"`);
    }

    // Interpolation parity check
    const arParams = (entry.ar.match(paramRegex) || []).sort();
    const enParams = (entry.newEn.match(paramRegex) || []).sort();
    const urParams = (entry.newUr.match(paramRegex) || []).sort();

    if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
      throw new Error(`Interpolation mismatch in EN for "${entry.key}": AR=${arParams}, EN=${enParams}`);
    }
    if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
      throw new Error(`Interpolation mismatch in UR for "${entry.key}": AR=${arParams}, UR=${urParams}`);
    }

    // Protected tokens check
    for (const token of protectedTokens) {
      if (entry.ar.includes(token)) {
        if (!entry.newEn.includes(token)) {
          throw new Error(`Protected token "${token}" missing in EN for "${entry.key}"`);
        }
        if (!entry.newUr.includes(token)) {
          throw new Error(`Protected token "${token}" missing in UR for "${entry.key}"`);
        }
      }
    }

    // Replace in EN
    const escapedKey = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const enMatches = [...enContent.matchAll(enKeyRegex)];
    if (enMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in EN index.ts`);
    }
    const safeNewEn = entry.newEn.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    enContent = enContent.replace(enKeyRegex, `$1'${safeNewEn}'$4`);
    enReplaced += enMatches.length;

    // Replace in UR
    const urKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const urMatches = [...urContent.matchAll(urKeyRegex)];
    if (urMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in UR index.ts`);
    }
    const safeNewUr = entry.newUr.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    urContent = urContent.replace(urKeyRegex, `$1'${safeNewUr}'$4`);
    urReplaced += urMatches.length;
  }

  console.log(`Successfully replaced ${enReplaced} keys in EN.`);
  console.log(`Successfully replaced ${urReplaced} keys in UR.`);

  if (enReplaced < 100 || urReplaced < 100) {
    throw new Error(`Replacement count under 100! EN: ${enReplaced}, UR: ${urReplaced}`);
  }

  // Write updated locale dictionaries
  fs.writeFileSync(enPath, enContent, 'utf8');
  fs.writeFileSync(urPath, urContent, 'utf8');
  console.log('Updated src/locales/en/index.ts and src/locales/ur/index.ts');

  // Baseline metrics
  const bBefore = 522;
  const cBefore = 230;
  const bRepaired = 70;
  const cRepaired = 30;
  const bRemaining = bBefore - bRepaired;
  const cRemaining = cBefore - cRepaired;
  const dRemaining = 0;

  // Domain breakdown
  const domainDist: Record<string, { b: number; c: number; total: number }> = {};
  for (const e of selectedEntries) {
    if (!domainDist[e.domain]) {
      domainDist[e.domain] = { b: 0, c: 0, total: 0 };
    }
    if (e.category === 'B') domainDist[e.domain].b++;
    if (e.category === 'C') domainDist[e.domain].c++;
    domainDist[e.domain].total++;
  }

  // Generate reports/i18n-block61-p1-translation.json
  const reportJson = {
    metadata: {
      block: 'BLOCK-61',
      title: 'P1 Professional Translation Batch',
      timestamp: new Date().toISOString(),
      status: 'COMPLETE',
      targetQuota: {
        total: 100,
        categoryB: 70,
        categoryC: 30
      },
      executionMetrics: {
        selectedCount: selectedEntries.length,
        processedCount: selectedEntries.length,
        skippedCount: skippedItems.length,
        categoryBRepaired: bRepaired,
        categoryCRepaired: cRepaired,
        categoryDRepaired: 0,
        categoryBRemaining: bRemaining,
        categoryCRemaining: cRemaining,
        categoryDRemaining: dRemaining,
        totalAuthoritativeRemaining: bRemaining + cRemaining
      }
    },
    skippedItems,
    domainDistribution: domainDist,
    repairedEntries: selectedEntries.map((e, idx) => ({
      index: idx + 1,
      key: e.key,
      priority: e.priority,
      domain: e.domain,
      category: e.category,
      problem: e.problem,
      reviewStatus: e.reviewStatus,
      ar: e.ar,
      oldEn: e.oldEn,
      newEn: e.newEn,
      oldUr: e.oldUr,
      newUr: e.newUr,
      rationale: e.rationale
    }))
  };

  const jsonReportPath = path.resolve(process.cwd(), 'reports/i18n-block61-p1-translation.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportJson, null, 2), 'utf8');
  console.log('Saved reports/i18n-block61-p1-translation.json');

  // Generate reports/i18n-block61-p1-translation.md
  let md = `# BLOCK 61 — P1 Professional Translation Batch Report\n\n`;
  md += `**Execution Date:** ${reportJson.metadata.timestamp}\n`;
  md += `**Status:** COMPLETE ✅\n`;
  md += `**Target:** Exactly 100 translation defects repaired (70 Category B + 30 Category C)\n\n`;

  md += `## 1. Executive Summary & Defect Reductions\n\n`;
  md += `| Metric | Before Block 61 | Repaired in Block 61 | Remaining After Block 61 | Status |\n`;
  md += `|---|:---:|:---:|:---:|:---:|\n`;
  md += `| **Category B (Mixed Arabic in Target)** | ${bBefore} | **${bRepaired}** | **${bRemaining}** | Progressing |\n`;
  md += `| **Category C (Untranslated Fallback)** | ${cBefore} | **${cRepaired}** | **${cRemaining}** | Progressing |\n`;
  md += `| **Category D (Hybrid Morphology)** | 0 | **0** | **0** | **100% Eliminated in Block 57** |\n`;
  md += `| **Total Authoritative Catalog** | 752 | **100** | **${bRemaining + cRemaining}** | Active Quality Pipeline |\n\n`;

  md += `## 2. Execution Metrics & Quota Adherence\n\n`;
  md += `- **Selected:** 100 keys\n`;
  md += `- **Processed:** 100 keys (70 Category B, 30 Category C)\n`;
  md += `- **Skipped Count:** ${skippedItems.length} keys\n`;
  md += `- **Review Status:** All 100 keys set to \`REVIEW_REQUIRED\` (strict human governance preservation)\n`;
  md += `- **Languages Updated:** English (\`src/locales/en/index.ts\`) and Urdu (\`src/locales/ur/index.ts\`) ONLY\n`;
  md += `- **Arabic Dictionary (\`src/locales/ar/index.ts\`):** 100% UNCHANGED\n`;
  md += `- **Application Logic / JSX:** 100% UNCHANGED\n\n`;

  md += `## 3. Skipped Keys & Deterministic Justifications\n\n`;
  md += `| # | Key | Rank in Queue | Pri | Cat | Skip Reason |\n`;
  md += `|---|---|:---:|:---:|:---:|---|\n`;
  skippedItems.forEach((s, idx) => {
    md += `| ${idx + 1} | \`${s.key}\` | ${s.rank} | ${s.priority} | ${s.category} | ${s.reason} |\n`;
  });
  md += `\n`;

  md += `## 4. Domain Distribution\n\n`;
  md += `| Domain | Category B Repaired | Category C Repaired | Total Repaired |\n`;
  md += `|---|:---:|:---:|:---:|\n`;
  Object.entries(domainDist).forEach(([dom, counts]) => {
    md += `| \`${dom}\` | ${counts.b} | ${counts.c} | **${counts.total}** |\n`;
  });
  md += `\n`;

  md += `## 5. Repaired Entries Audit Matrix (100 Keys)\n\n`;
  md += `| # | Key | Domain | Cat | Problem | Arabic Source (Unchanged) | Repaired English (newEn) | Repaired Urdu (newUr) | Review Status |\n`;
  md += `|---|---|---|:---:|---|---|---|---|:---:|\n`;
  selectedEntries.forEach((e, idx) => {
    const cleanAr = e.ar.replace(/\n/g, ' ').replace(/\|/g, '\\|');
    const cleanEn = e.newEn.replace(/\n/g, ' ').replace(/\|/g, '\\|');
    const cleanUr = e.newUr.replace(/\n/g, ' ').replace(/\|/g, '\\|');
    md += `| ${idx + 1} | \`${e.key}\` | \`${e.domain}\` | **${e.category}** | ${e.problem} | ${cleanAr} | ${cleanEn} | ${cleanUr} | \`${e.reviewStatus}\` |\n`;
  });
  md += `\n`;

  const mdReportPath = path.resolve(process.cwd(), 'reports/i18n-block61-p1-translation.md');
  fs.writeFileSync(mdReportPath, md, 'utf8');
  console.log('Saved reports/i18n-block61-p1-translation.md');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('execute-block61-translation')) {
  executeBlock61();
}
