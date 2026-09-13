import fs from 'fs';

const pool = JSON.parse(fs.readFileSync('reports/block59-filtered-pool.json', 'utf8'));
const arabicRegex = /[\u0600-\u06FF]/;

// Clean Category C: fallback identical, has genuine Arabic text in AR
const cleanC = pool.eligibleC.filter((x: any) => arabicRegex.test(x.ar) && x.ar.trim().length > 1);

// Clean Category B: has Arabic characters in EN! Exclude test fixture keys
const cleanB = pool.eligibleB.filter((x: any) => 
  arabicRegex.test(x.en) && 
  x.ar.trim().length > 1 &&
  x.key !== 'navigation.labels.import' &&
  x.key !== 'navigation.labels.trips'
);

const cQuota: Record<string, number> = {
  dashboard: 10,
  trips: 15,
  loading: 12,
  unloading: 12,
  weighbridge: 15,
  projects: 15,
  offline: 11,
  shared: 10
};

const bQuota: Record<string, number> = {
  dashboard: 6,
  trips: 8,
  loading: 6,
  unloading: 5,
  weighbridge: 7,
  projects: 8,
  offline: 5,
  shared: 5
};

const finalC: any[] = [];
for (const [dom, count] of Object.entries(cQuota)) {
  const items = cleanC.filter((x: any) => x.domain === dom).slice(0, count);
  finalC.push(...items);
}

const finalB: any[] = [];
for (const [dom, count] of Object.entries(bQuota)) {
  const items = cleanB.filter((x: any) => x.domain === dom).slice(0, count);
  finalB.push(...items);
}

console.log(`Final C count: ${finalC.length}`);
console.log(`Final B count: ${finalB.length}`);

fs.writeFileSync('reports/block59-final-selected.json', JSON.stringify({
  finalC,
  finalB
}, null, 2), 'utf8');
