import fs from 'fs';
import path from 'path';
import { dictionaries } from '../src/locales';

const b56 = JSON.parse(fs.readFileSync('reports/i18n-block56-switcher-quality.json', 'utf8'));
const b57 = JSON.parse(fs.readFileSync('reports/i18n-block57-quality-pilot.json', 'utf8'));
const b58 = JSON.parse(fs.readFileSync('reports/i18n-block58-quality-expansion.json', 'utf8'));
const b59 = JSON.parse(fs.readFileSync('reports/i18n-block59-quality-expansion.json', 'utf8'));

const repairedSet = new Set<string>();
b57.repairedEntries.forEach((e: any) => repairedSet.add(e.key));
b58.repairedEntries.forEach((e: any) => repairedSet.add(e.key));
b59.repairedEntries.forEach((e: any) => repairedSet.add(e.key));

console.log('Repaired set size:', repairedSet.size);

const queueByDomain = b56.translationQualityAudit.correctionQueueByDomain;
const allQueueItems: any[] = [];
for (const [dom, items] of Object.entries(queueByDomain)) {
  for (const item of (items as any[])) {
    allQueueItems.push({ ...item, domain: dom });
  }
}

const remaining805 = allQueueItems.filter(i => !repairedSet.has(i.key));
console.log('Remaining in 1105 queue:', remaining805.length);

const arabicRegex = /[\u0600-\u06FF]/;

let cleanCount = 0;
const cleanItems: any[] = [];
const catBItems: any[] = [];
const catCItems: any[] = [];

for (const item of remaining805) {
  const ar = dictionaries.ar[item.key] || item.arabic || '';
  const en = dictionaries.en[item.key] || item.currentEnglish || '';
  const ur = dictionaries.ur[item.key] || item.currentUrdu || '';

  const hasArabicInEn = arabicRegex.test(en);
  const hasArabicInUr = arabicRegex.test(ur);
  const isFallback = (en === ar && ur === ar);

  if (!hasArabicInEn && !hasArabicInUr && !isFallback) {
    cleanCount++;
    cleanItems.push({ key: item.key, domain: item.domain, en, ur });
  } else if (isFallback && ar.length > 30) {
    catCItems.push({ key: item.key, domain: item.domain, ar, en, ur });
  } else {
    catBItems.push({ key: item.key, domain: item.domain, ar, en, ur });
  }
}

console.log('Clean / acceptable count:', cleanCount);
console.log('catC count:', catCItems.length);
console.log('catB count:', catBItems.length);
console.log('Total B + C:', catBItems.length + catCItems.length);
