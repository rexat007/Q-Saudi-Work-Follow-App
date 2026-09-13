import fs from 'fs';
import path from 'path';
import { dictionaries } from '../src/locales';

interface AvailableCandidate {
  key: string;
  domain: string;
  ar: string;
  en: string;
  ur: string;
}

const data = JSON.parse(fs.readFileSync('reports/block59-available-candidates.json', 'utf8'));
const remainingB: AvailableCandidate[] = data.remainingB;
const remainingC: AvailableCandidate[] = data.remainingC;

const priorityDomains = new Set([
  'dashboard', 'trips', 'loading', 'unloading', 'weighbridge', 'projects', 'offline', 'shared'
]);

function isEligible(cand: AvailableCandidate): boolean {
  if (!priorityDomains.has(cand.domain)) return false;
  const ar = cand.ar.trim();
  const k = cand.key.toLowerCase();

  // Skip single codes / machine identifiers / pure numbers
  if (/^[A-Z0-9_-]+$/.test(ar)) return false;
  if (/^\d+(\.\d+)?$/.test(ar)) return false;
  if (k.includes('formula') || k.includes('code_') || k.includes('uuid') || k.includes('token')) return false;
  if (ar.length < 2) return false;

  return true;
}

const eligibleC = remainingC.filter(isEligible);
const eligibleB = remainingB.filter(isEligible);

console.log(`Eligible C: ${eligibleC.length}`);
console.log(`Eligible B: ${eligibleB.length}`);

// Group by domain
const cByDom: Record<string, AvailableCandidate[]> = {};
for (const c of eligibleC) {
  cByDom[c.domain] = cByDom[c.domain] || [];
  cByDom[c.domain].push(c);
}

const bByDom: Record<string, AvailableCandidate[]> = {};
for (const b of eligibleB) {
  bByDom[b.domain] = bByDom[b.domain] || [];
  bByDom[b.domain].push(b);
}

for (const d of priorityDomains) {
  console.log(`Domain ${d}: ${cByDom[d]?.length || 0} C, ${bByDom[d]?.length || 0} B`);
}

fs.writeFileSync('reports/block59-filtered-pool.json', JSON.stringify({
  eligibleC,
  eligibleB
}, null, 2), 'utf8');
