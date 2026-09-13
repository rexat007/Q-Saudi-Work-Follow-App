import fs from 'fs';
import path from 'path';

const pool = JSON.parse(fs.readFileSync('reports/block59-filtered-pool.json', 'utf8'));

// Desired distribution
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

const selectedC: any[] = [];
for (const [dom, quota] of Object.entries(cQuota)) {
  const cands = pool.eligibleC.filter((x: any) => x.domain === dom);
  selectedC.push(...cands.slice(0, quota));
}

const selectedB: any[] = [];
for (const [dom, quota] of Object.entries(bQuota)) {
  const cands = pool.eligibleB.filter((x: any) => x.domain === dom);
  selectedB.push(...cands.slice(0, quota));
}

console.log(`Selected C: ${selectedC.length}`);
console.log(`Selected B: ${selectedB.length}`);

fs.writeFileSync('reports/block59-raw-selection.json', JSON.stringify({
  selectedC,
  selectedB
}, null, 2), 'utf8');
