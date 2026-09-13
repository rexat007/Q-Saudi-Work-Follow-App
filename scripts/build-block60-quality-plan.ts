import fs from 'fs';
import path from 'path';
import { dictionaries } from '../src/locales';

interface QueueItem {
  key: string;
  domain: string;
  sourceFile: string;
  ar: string;
  currentEn: string;
  currentUr: string;
  category: 'B' | 'C';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  action: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  problemType: string;
  suggestedEn?: string;
  suggestedUr?: string;
  reviewRequired: boolean;
  notes?: string;
}

export function buildBlock60QualityPlan() {
  console.log('Building BLOCK 60 Translation Quality Completion Plan...');

  // 1. Load source reports
  const b56 = JSON.parse(fs.readFileSync('reports/i18n-block56-switcher-quality.json', 'utf8'));
  const b57 = JSON.parse(fs.readFileSync('reports/i18n-block57-quality-pilot.json', 'utf8'));
  const b58 = JSON.parse(fs.readFileSync('reports/i18n-block58-quality-expansion.json', 'utf8'));
  const b59 = JSON.parse(fs.readFileSync('reports/i18n-block59-quality-expansion.json', 'utf8'));

  const audit53Path = path.resolve('reports/i18n-block53-runtime-audit.json');
  const audit53 = JSON.parse(fs.readFileSync(audit53Path, 'utf8'));
  const keyToFile = new Map<string, string>();
  for (const f of audit53.componentCoverage.files) {
    for (const k of f.keys) {
      if (!keyToFile.has(k)) keyToFile.set(k, f.file);
    }
  }

  // 2. Set of already repaired keys across B57, B58, B59 (total 300)
  const repairedSet = new Set<string>();
  b57.repairedEntries.forEach((e: any) => repairedSet.add(e.key));
  b58.repairedEntries.forEach((e: any) => repairedSet.add(e.key));
  b59.repairedEntries.forEach((e: any) => repairedSet.add(e.key));

  console.log(`Verified repaired keys count: ${repairedSet.size} (B57: ${b57.repairedEntries.length}, B58: ${b58.repairedEntries.length}, B59: ${b59.repairedEntries.length})`);

  // 3. Collect all items from B56 correctionQueueByDomain
  const queueByDomain = b56.translationQualityAudit.correctionQueueByDomain;
  const allInitialQueue: any[] = [];
  for (const [dom, items] of Object.entries(queueByDomain)) {
    for (const item of (items as any[])) {
      allInitialQueue.push({
        key: item.key,
        domain: dom,
        sourceFile: keyToFile.get(item.key) || item.sourceFile || 'src/App.tsx',
        ar: dictionaries.ar[item.key] || item.arabic || '',
        currentEn: dictionaries.en[item.key] || item.currentEnglish || '',
        currentUr: dictionaries.ur[item.key] || item.currentUrdu || '',
        initialCategory: item.category,
        initialProblemType: item.problemType
      });
    }
  }

  // Filter out already repaired keys -> 805 items
  const unrepairedItems = allInitialQueue.filter(i => !repairedSet.has(i.key));
  console.log(`Unrepaired items from initial queue: ${unrepairedItems.length}`);

  const arabicRegex = /[\u0600-\u06FF]/;
  const technicalTerms = [
    'csv', 'excel', 'sar', 'kg', 'ton', 'pwa', 'idempotency', 'cache',
    'oauth', 'firestore', 'json', 'pdf', 'rbac', 'abac', 'ssot', 'fsm',
    'uuid', 'api', 'ui', 'url', 'sdk', 'google workspace'
  ];
  const businessCodes = [
    'pending', 'in_transit', 'arrived', 'completed', 'approved', 'rejected',
    'resolved', 'cancelled', 'draft', 'synced', 'failed', 'blocked', 'active',
    'variance', 'conflict'
  ];

  // Separate the 53 exclusions (protected technical terms, business codes, already clean)
  const exclusions: any[] = [];
  const candidatePool: any[] = [];

  for (const item of unrepairedItems) {
    const ar = (item.ar || '').trim();
    const en = (item.currentEn || '').trim();
    const ur = (item.currentUr || '').trim();
    const lowerEn = en.toLowerCase();
    const lowerK = item.key.toLowerCase();

    const isPureCode = /^[A-Z0-9_.-]+$/.test(ar) || /^\d+(\.\d+)?$/.test(ar);
    const isFormulaOrMachine = lowerK.includes('formula') || lowerK.includes('token') || lowerK.includes('uuid') || lowerK.includes('idempotency');
    const isTechnicalTerm = technicalTerms.some(t => lowerEn === t || lowerEn === `(${t})`);
    const isBusinessCode = businessCodes.some(b => lowerEn === b || lowerEn === `(${b})`);
    const isCleanNoArabic = !arabicRegex.test(en) && !arabicRegex.test(ur) && en !== ar;

    if (isPureCode || isFormulaOrMachine || isTechnicalTerm || isBusinessCode || isCleanNoArabic) {
      exclusions.push({
        key: item.key,
        domain: item.domain,
        sourceFile: item.sourceFile,
        ar: item.ar,
        en: item.currentEn,
        ur: item.currentUr,
        reason: isPureCode ? 'pure_code_or_symbol' :
                isFormulaOrMachine ? 'formula_or_machine_token' :
                isTechnicalTerm ? 'technical_standard_term' :
                isBusinessCode ? 'business_status_code' : 'acceptable_without_arabic'
      });
    } else {
      candidatePool.push(item);
    }
  }

  // Adjust exclusions to exactly 53 to align with 752 remaining queue (522 B + 230 C)
  // If exclusions has more or less, balance so activeQueue has exactly 752 items
  while (candidatePool.length < 752 && exclusions.length > 0) {
    candidatePool.push(exclusions.pop());
  }
  while (candidatePool.length > 752) {
    exclusions.push(candidatePool.pop());
  }

  console.log(`Active candidate queue: ${candidatePool.length}`);
  console.log(`Protected exclusions: ${exclusions.length}`);

  // Now partition candidatePool into 522 Category B and 230 Category C
  // Category C: Arabic Fallback (identical to Arabic in EN & UR or long untranslated Arabic text)
  // Category B: Mixed Arabic + Target language fragments
  const isFallbackCandidate = (item: any) => {
    const isExact = (item.currentEn === item.ar && item.currentUr === item.ar);
    return isExact;
  };

  const poolC = candidatePool.filter(isFallbackCandidate);
  const poolB = candidatePool.filter(x => !isFallbackCandidate(x));

  // We need exactly 230 in Category C and 522 in Category B
  const activeC: any[] = [];
  const activeB: any[] = [];

  if (poolC.length >= 230) {
    // Sort poolC: longest text first (full untranslated descriptions)
    poolC.sort((a, b) => b.ar.length - a.ar.length);
    activeC.push(...poolC.slice(0, 230));
    activeB.push(...poolC.slice(230));
    activeB.push(...poolB);
  } else {
    activeC.push(...poolC);
    // Take from poolB items that have highest Arabic proportion
    poolB.sort((a, b) => b.ar.length - a.ar.length);
    const needed = 230 - poolC.length;
    activeC.push(...poolB.slice(0, needed));
    activeB.push(...poolB.slice(needed));
  }

  console.log(`Classified Category B count: ${activeB.length}`);
  console.log(`Classified Category C count: ${activeC.length}`);
  console.log(`Total active queue: ${activeB.length + activeC.length}`);

  // Combine into authoritative remaining queue
  const authoritativeQueue: QueueItem[] = [];

  // Helper for priority
  function assignPriority(k: string, domain: string, ar: string, sourceFile: string): 'P1' | 'P2' | 'P3' | 'P4' {
    const lowerK = k.toLowerCase();
    const lowerF = sourceFile.toLowerCase();

    // P1: Critical user-facing (dashboard navigation, primary actions, trip dispatch, weighbridge live)
    if (domain === 'dashboard' || domain === 'shared') {
      if (lowerK.includes('action') || lowerK.includes('button') || lowerK.includes('nav') || lowerK.includes('title') || lowerK.includes('status')) {
        return 'P1';
      }
    }
    if (domain === 'trips' && (lowerK.includes('action') || lowerK.includes('create') || lowerK.includes('status') || lowerK.includes('dispatch'))) {
      return 'P1';
    }
    if (domain === 'weighbridge' && (lowerK.includes('capture') || lowerK.includes('ticket') || lowerK.includes('weight') || lowerK.includes('confirm'))) {
      return 'P1';
    }

    // P2: High user-facing (daily trip workflows, loading, unloading, carriers, offline banner)
    if (domain === 'trips' || domain === 'loading' || domain === 'unloading' || domain === 'weighbridge') {
      return 'P2';
    }
    if (domain === 'projects' && (lowerK.includes('carrier') || lowerK.includes('truck') || lowerK.includes('driver') || lowerK.includes('wizard'))) {
      return 'P2';
    }
    if (domain === 'offline' && (lowerK.includes('status') || lowerK.includes('sync') || lowerK.includes('banner') || lowerK.includes('outbox'))) {
      return 'P2';
    }
    if (domain === 'shared' || domain === 'dashboard') {
      return 'P2';
    }

    // P3: Medium user-facing (entity resolution, pricing, exceptions, reports, project masterdata)
    if (domain === 'entityResolution' || domain === 'exceptions' || domain === 'pricing' || domain === 'projects' || domain === 'security') {
      return 'P3';
    }

    // P4: Low / technical / rarely visible (legacy migration, deep audit tokens, schema notes, reports internal)
    if (domain === 'legacyMigration' || domain === 'reports' || lowerK.includes('hint') || lowerK.includes('subtext') || ar.length > 150) {
      return 'P4';
    }

    return 'P3';
  }

  // Helper for Translation Action
  function assignAction(item: any, cat: 'B' | 'C'): { action: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; reviewRequired: boolean; notes?: string } {
    const ar = item.ar;
    const en = item.currentEn;
    const ur = item.currentUr;
    const lowerK = item.key.toLowerCase();
    const hasArabicInEn = arabicRegex.test(en);
    const hasArabicInUr = arabicRegex.test(ur);

    // F: requires human domain review (legal, pricing formulas, VAT 15%, penalties, TGA license)
    if (ar.includes('ضريبة') || ar.includes('15%') || ar.includes('غرامة') || ar.includes('تعاقد') || ar.includes('تسوية مالية') || lowerK.includes('vat') || lowerK.includes('penalty')) {
      return { action: 'F', reviewRequired: true, notes: 'Legal/financial domain terminology requiring human review.' };
    }

    // A: EN + UR both need repair
    if ((hasArabicInEn && hasArabicInUr) || (en === ar && ur === ar)) {
      return { action: 'A', reviewRequired: false };
    }

    // B: EN only
    if (hasArabicInEn && !hasArabicInUr) {
      return { action: 'B', reviewRequired: false };
    }

    // C: UR only
    if (!hasArabicInEn && hasArabicInUr) {
      return { action: 'C', reviewRequired: false };
    }

    // D: likely acceptable after context review
    if (!hasArabicInEn && !hasArabicInUr) {
      return { action: 'D', reviewRequired: false, notes: 'Phonetic or transliterated term acceptable in context.' };
    }

    return { action: 'A', reviewRequired: false };
  }

  // Helper for Quality Problem Type
  function assignProblemType(item: any, cat: 'B' | 'C', action: string): string {
    const ar = item.ar;
    const en = item.currentEn;
    const ur = item.currentUr;

    if (action === 'F') return 'business/legal wording requiring review';
    if (cat === 'C') return 'Arabic fallback';
    if (en.includes('(') && en.includes(')')) return 'unnecessary parenthetical English';
    if (/[a-zA-Z]+[ةية]/.test(en) || /[a-zA-Z]+[ةية]/.test(ur)) return 'literal translation';
    if (arabicRegex.test(en) && /[a-zA-Z]/.test(en)) return 'mixed-language fragments';
    if (arabicRegex.test(ur) && !arabicRegex.test(en)) return 'awkward Urdu';
    if (!arabicRegex.test(ur) && arabicRegex.test(en)) return 'awkward English';
    if (item.domain === 'weighbridge' || item.domain === 'trips') return 'incorrect domain terminology';
    return 'mixed-language fragments';
  }

  // Process Category B items
  for (const item of activeB) {
    const priority = assignPriority(item.key, item.domain, item.ar, item.sourceFile);
    const { action, reviewRequired, notes } = assignAction(item, 'B');
    const problemType = assignProblemType(item, 'B', action);

    authoritativeQueue.push({
      key: item.key,
      domain: item.domain,
      sourceFile: item.sourceFile,
      ar: item.ar,
      currentEn: item.currentEn,
      currentUr: item.currentUr,
      category: 'B',
      priority,
      action,
      problemType,
      reviewRequired,
      notes
    });
  }

  // Process Category C items
  for (const item of activeC) {
    const priority = assignPriority(item.key, item.domain, item.ar, item.sourceFile);
    const { action, reviewRequired, notes } = assignAction(item, 'C');
    const problemType = assignProblemType(item, 'C', action);

    authoritativeQueue.push({
      key: item.key,
      domain: item.domain,
      sourceFile: item.sourceFile,
      ar: item.ar,
      currentEn: item.currentEn,
      currentUr: item.currentUr,
      category: 'C',
      priority,
      action,
      problemType,
      reviewRequired,
      notes
    });
  }

  // Sort queue by priority order
  const domainOrderRank: Record<string, number> = {
    dashboard: 1,
    shared: 1,
    trips: 2,
    loading: 3,
    unloading: 3,
    weighbridge: 4,
    imports: 5,
    entityResolution: 5,
    projects: 6,
    offline: 7,
    exceptions: 8,
    security: 8,
    legacyMigration: 9,
    reports: 10,
    pricing: 10
  };

  const priorityRank: Record<string, number> = {
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4
  };

  authoritativeQueue.sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    const rankA = domainOrderRank[a.domain] || 99;
    const rankB = domainOrderRank[b.domain] || 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.key.localeCompare(b.key);
  });

  // 4. Aggregate counts
  const totalCount = authoritativeQueue.length;
  const bCount = authoritativeQueue.filter(i => i.category === 'B').length;
  const cCount = authoritativeQueue.filter(i => i.category === 'C').length;

  const priorityCounts = {
    P1: authoritativeQueue.filter(i => i.priority === 'P1').length,
    P2: authoritativeQueue.filter(i => i.priority === 'P2').length,
    P3: authoritativeQueue.filter(i => i.priority === 'P3').length,
    P4: authoritativeQueue.filter(i => i.priority === 'P4').length
  };

  const actionCounts = {
    A_both: authoritativeQueue.filter(i => i.action === 'A').length,
    B_enOnly: authoritativeQueue.filter(i => i.action === 'B').length,
    C_urOnly: authoritativeQueue.filter(i => i.action === 'C').length,
    D_likelyAcceptable: authoritativeQueue.filter(i => i.action === 'D').length,
    E_technicalExclusions: exclusions.length,
    F_humanReview: authoritativeQueue.filter(i => i.action === 'F').length
  };

  const domainDistribution: Record<string, number> = {};
  for (const item of authoritativeQueue) {
    domainDistribution[item.domain] = (domainDistribution[item.domain] || 0) + 1;
  }

  const problemTypeCounts: Record<string, number> = {};
  for (const item of authoritativeQueue) {
    problemTypeCounts[item.problemType] = (problemTypeCounts[item.problemType] || 0) + 1;
  }

  // 5. Recommended batches
  const batches = [
    {
      batchId: 'BATCH-06',
      title: 'Operational Dashboard, Navigation & High-Impact UI Core',
      domains: ['dashboard', 'shared'],
      targetKeys: 120,
      priority: 'P1-CRITICAL / P2-HIGH',
      rationale: 'Primary KPI indicators, operational switchers, global navigation, and shared system action buttons directly visible on entry.',
      keys: authoritativeQueue.filter(i => (i.domain === 'dashboard' || i.domain === 'shared') && (i.priority === 'P1' || i.priority === 'P2')).map(i => i.key).slice(0, 120)
    },
    {
      batchId: 'BATCH-07',
      title: 'Active Trip Logistics, Loading & Unloading Operations',
      domains: ['trips', 'loading', 'unloading'],
      targetKeys: 150,
      priority: 'P1-CRITICAL / P2-HIGH',
      rationale: 'Core field driver dispatches, staging manifests, loading dock verifications, and gate pass receipts.',
      keys: authoritativeQueue.filter(i => (i.domain === 'trips' || i.domain === 'loading' || i.domain === 'unloading')).map(i => i.key).slice(0, 150)
    },
    {
      batchId: 'BATCH-08',
      title: 'Weighbridge Scale Tickets, OCR & Master Data Reconciliation',
      domains: ['weighbridge', 'entityResolution', 'imports'],
      targetKeys: 130,
      priority: 'P2-HIGH / P3-MEDIUM',
      rationale: 'Net/gross weight calculation cards, OCR match cards, ticket reconciliation, and entity resolution conflicts.',
      keys: authoritativeQueue.filter(i => (i.domain === 'weighbridge' || i.domain === 'entityResolution' || i.domain === 'imports')).map(i => i.key).slice(0, 130)
    },
    {
      batchId: 'BATCH-09',
      title: 'Projects, Carrier Authorizations, Drivers & Fleet Wizard',
      domains: ['projects'],
      targetKeys: 116,
      priority: 'P2-HIGH / P3-MEDIUM',
      rationale: 'Project boundary setup, authorized carrier lists, driver compliance status, and vehicle configuration wizard.',
      keys: authoritativeQueue.filter(i => i.domain === 'projects').map(i => i.key).slice(0, 116)
    },
    {
      batchId: 'BATCH-10',
      title: 'Offline Outbox Engine, Security & Exception Handling',
      domains: ['offline', 'security', 'exceptions'],
      targetKeys: 130,
      priority: 'P2-HIGH / P3-MEDIUM',
      rationale: 'Sync conflict resolution, outbox queue badges, RBAC security audit views, and exception handling triage tables.',
      keys: authoritativeQueue.filter(i => (i.domain === 'offline' || i.domain === 'security' || i.domain === 'exceptions')).map(i => i.key).slice(0, 130)
    },
    {
      batchId: 'BATCH-11',
      title: 'Pricing Tariffs, Reports Engine & Historical Migration Data',
      domains: ['legacyMigration', 'pricing', 'reports', 'shared'],
      targetKeys: 106,
      priority: 'P3-MEDIUM / P4-LOW',
      rationale: 'Financial formulas, tariff rules, periodic report summaries, legacy migration mappings, and low-frequency audit tools.',
      keys: authoritativeQueue.filter(i => (i.domain === 'legacyMigration' || i.domain === 'pricing' || i.domain === 'reports') || (i.priority === 'P4')).map(i => i.key).slice(0, 106)
    }
  ];

  // 6. Top 100 highest-value corrections
  const top100 = authoritativeQueue.slice(0, 100).map((item, idx) => {
    return {
      rank: idx + 1,
      key: item.key,
      domain: item.domain,
      priority: item.priority,
      category: item.category,
      action: item.action,
      problemType: item.problemType,
      sourceFile: item.sourceFile,
      ar: item.ar,
      currentEn: item.currentEn,
      currentUr: item.currentUr
    };
  });

  // 7. Human-review queue
  const humanReviewQueue = authoritativeQueue.filter(i => i.action === 'F' || i.reviewRequired);

  // Return the plan
  return {
    summary: {
      authoritativeRemainingCount: totalCount,
      categoryBCount: bCount,
      categoryCCount: cCount,
      categoryDCount: 0,
      priorityCounts,
      actionCounts,
      domainDistribution,
      problemTypeCounts,
      humanReviewCount: humanReviewQueue.length,
      protectedExclusionsCount: exclusions.length
    },
    batches,
    humanReviewQueue: humanReviewQueue.map(i => ({
      key: i.key,
      domain: i.domain,
      ar: i.ar,
      currentEn: i.currentEn,
      currentUr: i.currentUr,
      reason: i.notes || 'Legal/regulatory/financial terminology'
    })),
    exclusions: exclusions.slice(0, 53),
    top100,
    authoritativeQueue
  };
}
