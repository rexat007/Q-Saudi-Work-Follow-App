import fs from 'fs';
import path from 'path';
import { dictionaries } from '../src/locales';

const entries = JSON.parse(fs.readFileSync('reports/block59-translations-verified.json', 'utf8'));
const arabicRegex = /[\u0600-\u06FF]/;
const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;

const protectedTokens = [
  'SAR', 'KG', 'TON', 'M3', 'TRIP', 'Idempotency', 'Anti-LWW', 'Upsert', 'Blind Append',
  'Google Drive', 'Google Sheets', 'Firestore', 'Google',
  'DUPLICATE_OPERATION', 'TRIP_ALREADY_COMPLETED', 'PRICING_CHANGED', 'INACTIVE',
  'RETURNED', 'RETURN_REQUESTED', 'DRAFT', 'COMPLETED',
  'truckId', 'tripId', 'PRJ-NEOM-001', 'settlementBase'
];

let errors: string[] = [];

if (entries.length !== 150) {
  errors.push(`Expected exactly 150 entries, got ${entries.length}`);
}

const cCount = entries.filter((e: any) => e.category === 'C').length;
const bCount = entries.filter((e: any) => e.category === 'B').length;
if (cCount !== 100) errors.push(`Expected 100 Cat C, got ${cCount}`);
if (bCount !== 50) errors.push(`Expected 50 Cat B, got ${bCount}`);

for (const entry of entries) {
  const currentAr = dictionaries.ar[entry.key];
  if (currentAr !== entry.ar) {
    errors.push(`AR mismatch for ${entry.key}: expected "${currentAr}", got "${entry.ar}"`);
  }

  // Check no Arabic in English
  if (arabicRegex.test(entry.newEn)) {
    errors.push(`Arabic character found in EN for ${entry.key}: "${entry.newEn}"`);
  }

  // Check not identical to AR
  if (entry.newEn === entry.ar) {
    errors.push(`EN identical to AR for ${entry.key}`);
  }
  if (entry.newUr === entry.ar) {
    errors.push(`UR identical to AR for ${entry.key}`);
  }

  // Check non-empty
  if (!entry.newEn.trim() || !entry.newUr.trim()) {
    errors.push(`Empty translation for ${entry.key}`);
  }

  // Check params
  const arParams = (entry.ar.match(paramRegex) || []).sort();
  const enParams = (entry.newEn.match(paramRegex) || []).sort();
  const urParams = (entry.newUr.match(paramRegex) || []).sort();
  if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
    errors.push(`Params mismatch in EN for ${entry.key}: AR=${arParams}, EN=${enParams}`);
  }
  if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
    errors.push(`Params mismatch in UR for ${entry.key}: AR=${arParams}, UR=${urParams}`);
  }

  // Check protected tokens
  for (const token of protectedTokens) {
    if (entry.ar.includes(token)) {
      if (!entry.newEn.includes(token)) {
        errors.push(`Protected token "${token}" missing from EN for ${entry.key}`);
      }
      if (!entry.newUr.includes(token)) {
        errors.push(`Protected token "${token}" missing from UR for ${entry.key}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Verification FAILED with ${errors.length} errors:`);
  errors.forEach(e => console.error(` - ${e}`));
  process.exit(1);
} else {
  console.log('✅ All 150 translations verified successfully against all rules!');
}
