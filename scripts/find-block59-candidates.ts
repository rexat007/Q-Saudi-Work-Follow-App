import fs from 'fs';
import path from 'path';
import { dictionaries } from '../src/locales';

function findCandidates() {
  const b56Path = path.resolve('reports/i18n-block56-switcher-quality.json');
  const b57Path = path.resolve('reports/i18n-block57-quality-pilot.json');
  const b58Path = path.resolve('reports/i18n-block58-quality-expansion.json');

  const b56 = JSON.parse(fs.readFileSync(b56Path, 'utf8'));
  const b57 = JSON.parse(fs.readFileSync(b57Path, 'utf8'));
  const b58 = JSON.parse(fs.readFileSync(b58Path, 'utf8'));

  const usedKeys = new Set<string>();
  b57.repairedEntries.forEach((e: any) => usedKeys.add(e.key));
  b58.repairedEntries.forEach((e: any) => usedKeys.add(e.key));

  console.log(`Total used keys in B57 + B58: ${usedKeys.size}`);

  const priorityDomains = new Set([
    'dashboard', 'trips', 'loading', 'unloading', 'weighbridge', 'projects', 'offline', 'shared'
  ]);

  const categoryB: any[] = [];
  const categoryC: any[] = [];

  const arabicRegex = /[\u0600-\u06FF]/;

  for (const item of b56.items) {
    if (usedKeys.has(item.key)) continue;

    const ar = dictionaries.ar[item.key] || item.arabic;
    const en = dictionaries.en[item.key] || item.currentEnglish;
    const ur = dictionaries.ur[item.key] || item.currentUrdu;

    // Check current state in dictionaries
    const hasArabicInEn = arabicRegex.test(en);
    const hasArabicInUr = arabicRegex.test(ur);
    const isEnIdenticalToAr = en === ar;
    const isUrIdenticalToAr = ur === ar;
    const isFallback = isEnIdenticalToAr && isUrIdenticalToAr;

    // Skip if it looks like technical formula or business code or already clean
    if (!hasArabicInEn && !hasArabicInUr && !isFallback) continue;

    // Categorize
    if (isFallback) {
      categoryC.push({
        key: item.key,
        domain: item.domain,
        sourceFile: item.sourceFile,
        ar,
        en,
        ur,
        problemType: 'untranslated_fallback'
      });
    } else if (hasArabicInEn || hasArabicInUr) {
      categoryB.push({
        key: item.key,
        domain: item.domain,
        sourceFile: item.sourceFile,
        ar,
        en,
        ur,
        problemType: hasArabicInEn ? 'arabic_in_en' : 'arabic_in_ur'
      });
    }
  }

  console.log(`Available Category B candidates: ${categoryB.length}`);
  console.log(`Available Category C candidates: ${categoryC.length}`);

  // Count by domain
  const bByDomain: Record<string, number> = {};
  for (const item of categoryB) {
    bByDomain[item.domain] = (bByDomain[item.domain] || 0) + 1;
  }
  console.log('Category B by domain:', bByDomain);

  const cByDomain: Record<string, number> = {};
  for (const item of categoryC) {
    cByDomain[item.domain] = (cByDomain[item.domain] || 0) + 1;
  }
  console.log('Category C by domain:', cByDomain);

  fs.writeFileSync('reports/block59-candidates.json', JSON.stringify({ categoryB, categoryC }, null, 2), 'utf8');
}

findCandidates();
