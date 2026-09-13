import fs from 'fs';
import path from 'path';

export interface QualityExpansionEntry {
  key: string;
  domain: string;
  category: 'B' | 'C';
  problemType: string;
  ar: string;
  oldEn: string;
  newEn: string;
  oldUr: string;
  newUr: string;
  reviewStatus: 'REVIEW_REQUIRED';
}

const verifiedPath = path.resolve(process.cwd(), 'reports/block59-translations-verified.json');
export const block59Entries: QualityExpansionEntry[] = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));

export function executeBlock59QualityExpansion() {
  console.log(`Starting Block 59 Quality Expansion execution for ${block59Entries.length} entries...`);

  const enPath = path.resolve(process.cwd(), 'src/locales/en/index.ts');
  const urPath = path.resolve(process.cwd(), 'src/locales/ur/index.ts');
  const arPath = path.resolve(process.cwd(), 'src/locales/ar/index.ts');

  let enContent = fs.readFileSync(enPath, 'utf8');
  let urContent = fs.readFileSync(urPath, 'utf8');
  const arContent = fs.readFileSync(arPath, 'utf8');

  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  let enReplacedCount = 0;
  let urReplacedCount = 0;

  for (const entry of block59Entries) {
    // Validation checks
    if (arabicRegex.test(entry.newEn)) {
      throw new Error(`Accidental Arabic found in new EN for key ${entry.key}: "${entry.newEn}"`);
    }
    if (hybridSuffixRegex.test(entry.newEn)) {
      throw new Error(`Hybrid morphology found in new EN for key ${entry.key}: "${entry.newEn}"`);
    }
    if (hybridSuffixRegex.test(entry.newUr)) {
      throw new Error(`Hybrid morphology found in new UR for key ${entry.key}: "${entry.newUr}"`);
    }
    if (!entry.newEn.trim() || !entry.newUr.trim()) {
      throw new Error(`Empty value found for key ${entry.key}`);
    }

    // Interpolation parameter check
    const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;
    const arParams = (entry.ar.match(paramRegex) || []).sort();
    const enParams = (entry.newEn.match(paramRegex) || []).sort();
    const urParams = (entry.newUr.match(paramRegex) || []).sort();
    if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
      throw new Error(`Parameter mismatch in EN for key ${entry.key}: AR=${arParams}, EN=${enParams}`);
    }
    if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
      throw new Error(`Parameter mismatch in UR for key ${entry.key}: AR=${arParams}, UR=${urParams}`);
    }

    // Replace in EN
    const escapedKey = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const enMatches = [...enContent.matchAll(enKeyRegex)];
    if (enMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in EN dictionary`);
    }
    const safeNewEn = entry.newEn.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    enContent = enContent.replace(enKeyRegex, `$1'${safeNewEn}'$4`);
    enReplacedCount += enMatches.length;

    // Replace in UR
    const urKeyRegex = new RegExp(`(['"]${escapedKey}['"]\\s*:\\s*)(['"\`])([\\s\\S]*?)\\2(\\s*,)`, 'g');
    const urMatches = [...urContent.matchAll(urKeyRegex)];
    if (urMatches.length === 0) {
      throw new Error(`Key ${entry.key} not found in UR dictionary`);
    }
    const safeNewUr = entry.newUr.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    urContent = urContent.replace(urKeyRegex, `$1'${safeNewUr}'$4`);
    urReplacedCount += urMatches.length;
  }

  console.log(`Verified and replaced ${enReplacedCount} occurrences in EN.`);
  console.log(`Verified and replaced ${urReplacedCount} occurrences in UR.`);

  if (enReplacedCount < 150 || urReplacedCount < 150) {
    throw new Error(`Replacement count under 150! EN: ${enReplacedCount}, UR: ${urReplacedCount}`);
  }

  // Write updated files
  fs.writeFileSync(enPath, enContent, 'utf8');
  fs.writeFileSync(urPath, urContent, 'utf8');
  console.log('✅ Successfully updated src/locales/en/index.ts and src/locales/ur/index.ts');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('run-quality-expansion-block59')) {
  executeBlock59QualityExpansion();
}
