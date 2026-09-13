import fs from 'fs';
import path from 'path';
import { dictionaries } from '../src/locales';

export function analyzeCurrentCatalog() {
  const audit53Path = path.resolve('reports/i18n-block53-runtime-audit.json');
  const audit53 = JSON.parse(fs.readFileSync(audit53Path, 'utf8'));
  const keyToFile = new Map<string, string>();
  for (const f of audit53.componentCoverage.files) {
    for (const k of f.keys) {
      if (!keyToFile.has(k)) keyToFile.set(k, f.file);
    }
  }

  const b57Path = path.resolve('reports/i18n-block57-quality-pilot.json');
  const b58Path = path.resolve('reports/i18n-block58-quality-expansion.json');
  const b57 = JSON.parse(fs.readFileSync(b57Path, 'utf8'));
  const b58 = JSON.parse(fs.readFileSync(b58Path, 'utf8'));

  const fixedKeys = new Set<string>();
  b57.repairedEntries.forEach((e: any) => fixedKeys.add(e.key));
  b58.repairedEntries.forEach((e: any) => fixedKeys.add(e.key));

  console.log(`Already fixed in B57 + B58: ${fixedKeys.size} keys`);

  const refKeys = Array.from(keyToFile.keys()).sort();
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  function getDomain(k: string, file: string, arText: string): string {
    const lowerAr = arText.toLowerCase();
    const lowerK = k.toLowerCase();
    const lowerF = file.toLowerCase();

    if (lowerAr.includes('أمان') || lowerAr.includes('أمن') || lowerAr.includes('rbac') || lowerAr.includes('zero-trust') || lowerAr.includes('امتثال') || lowerK.includes('security') || lowerF.includes('security')) {
      return 'security';
    }
    if (k.startsWith('dashboard.')) return 'dashboard';
    if (k.startsWith('projects.')) return 'projects';
    if (k.startsWith('trips.')) return 'trips';
    if (k.startsWith('loading.')) return 'loading';
    if (k.startsWith('unloading.')) return 'unloading';
    if (k.startsWith('weighbridge.')) return 'weighbridge';
    if (k.startsWith('imports.') || k.startsWith('importBatches.') || lowerF.includes('import')) return 'imports';
    if (k.startsWith('entityResolution.') || lowerF.includes('dataquality')) return 'entityResolution';
    if (k.startsWith('pricing.') || k.startsWith('pricingRules.') || lowerK.includes('pricing') || lowerF.includes('pricing')) return 'pricing';
    if (k.startsWith('reports.') || lowerK.includes('report') || lowerF.includes('report')) return 'reports';
    if (k.startsWith('offline.') || lowerF.includes('offline')) return 'offline';
    if (k.startsWith('exceptions.') || lowerF.includes('exception')) return 'exceptions';
    if (k.startsWith('legacyMigration.') || lowerF.includes('migration')) return 'legacyMigration';
    if (k.startsWith('shared.')) return 'shared';
    if (lowerK.includes('trip') || lowerF.includes('trip')) return 'trips';
    if (lowerK.includes('project') || lowerK.includes('carrier') || lowerK.includes('truck') || lowerK.includes('driver') || lowerK.includes('material') || lowerF.includes('masterdata') || lowerF.includes('wizard')) return 'projects';
    return 'shared';
  }

  const catB: any[] = [];
  const catC: any[] = [];
  const catD: any[] = [];
  const catA: any[] = [];

  for (const k of refKeys) {
    const ar = dictionaries.ar[k] || '';
    const en = dictionaries.en[k] || '';
    const ur = dictionaries.ur[k] || '';
    const file = keyToFile.get(k) || 'src/App.tsx';
    const domain = getDomain(k, file, ar);

    const hasArabicInEn = arabicRegex.test(en);
    const hasArabicInUr = arabicRegex.test(ur);
    const hasHybrid = hybridSuffixRegex.test(en) || hybridSuffixRegex.test(ur);
    const isEnIdenticalToAr = en === ar;
    const isUrIdenticalToAr = ur === ar;
    const isFallback = isEnIdenticalToAr && isUrIdenticalToAr;

    if (hasHybrid) {
      catD.push({ key: k, domain, ar, en, ur, fixed: fixedKeys.has(k) });
    } else if (isFallback) {
      catC.push({ key: k, domain, ar, en, ur, fixed: fixedKeys.has(k) });
    } else if (hasArabicInEn || hasArabicInUr) {
      catB.push({ key: k, domain, ar, en, ur, fixed: fixedKeys.has(k) });
    } else {
      catA.push({ key: k, domain, ar, en, ur, fixed: fixedKeys.has(k) });
    }
  }

  console.log('--- Current Status of All 1115 Referenced Keys ---');
  console.log(`Cat A (Clean): ${catA.length} (already fixed: ${catA.filter(x => x.fixed).length})`);
  console.log(`Cat B (Mixed): ${catB.length} (already fixed: ${catB.filter(x => x.fixed).length})`);
  console.log(`Cat C (Fallback): ${catC.length} (already fixed: ${catC.filter(x => x.fixed).length})`);
  console.log(`Cat D (Hybrid): ${catD.length} (already fixed: ${catD.filter(x => x.fixed).length})`);

  const remainingB = catB.filter(x => !x.fixed);
  const remainingC = catC.filter(x => !x.fixed);
  console.log(`Remaining B available for repair: ${remainingB.length}`);
  console.log(`Remaining C available for repair: ${remainingC.length}`);

  // Count by domain for remaining C
  const cDomains: Record<string, number> = {};
  for (const x of remainingC) {
    cDomains[x.domain] = (cDomains[x.domain] || 0) + 1;
  }
  console.log('Remaining C by domain:', cDomains);

  // Count by domain for remaining B
  const bDomains: Record<string, number> = {};
  for (const x of remainingB) {
    bDomains[x.domain] = (bDomains[x.domain] || 0) + 1;
  }
  console.log('Remaining B by domain:', bDomains);

  fs.writeFileSync('reports/block59-available-candidates.json', JSON.stringify({
    remainingB,
    remainingC
  }, null, 2), 'utf8');
}

analyzeCurrentCatalog();
