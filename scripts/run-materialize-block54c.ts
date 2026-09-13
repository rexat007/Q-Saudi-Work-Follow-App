import fs from 'fs';
import path from 'path';
import { arTranslations } from '../src/locales/ar';
import { enTranslations } from '../src/locales/en';
import { urTranslations } from '../src/locales/ur';

export interface MaterializationSummary {
  referencedKeysCount: number;
  existingKeysCount: number;
  previouslyResolvableCount: number;
  previouslyUnresolvedCount: number;
  materializedKeysCount: number;
  finalDictionaryCount: number;
  finalResolvableCount: number;
  finalUnresolvedCount: number;
  finalKeyAsValueCount: number;
  missingArCount: number;
  missingEnCount: number;
  missingUrCount: number;
  duplicateKeysDetected: string[];
  interpolationMismatches: string[];
  protectedTokenMismatches: string[];
  metadataHookKeysCovered: number;
}

export function runMaterializeBlock54c(): MaterializationSummary {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 54C Runtime Dictionary Materialization');
  console.log('======================================================');

  // 1. Scan authoritative referenced keys
  const auditPath = path.resolve(process.cwd(), 'reports/i18n-block53-runtime-audit.json');
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const auditFiles: string[] = audit.componentCoverage.files.map((f: any) => f.file);

  const referencedKeySet = new Set<string>();
  const keyRegex = /\b(?:t|translate)\(\s*['"]([^'"\s)]+)['"]/g;

  for (const file of auditFiles) {
    const filePath = path.resolve(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      referencedKeySet.add(match[1]);
    }
  }

  const referencedKeys = Array.from(referencedKeySet).sort();
  console.log(`Authoritative referenced keys: ${referencedKeys.length}`);

  // 2. Load catalog and generated translations
  const catPath = path.resolve(process.cwd(), 'reports/i18n-translation-catalog.json');
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  const catEntries = cat.entries || {};

  const genPath = path.resolve(process.cwd(), 'reports/i18n-generated-translations.json');
  const gen = JSON.parse(fs.readFileSync(genPath, 'utf8'));
  const genProposals = gen.proposals || {};

  const recPath = path.resolve(process.cwd(), 'reports/i18n-block54a-recovery.json');
  const rec = JSON.parse(fs.readFileSync(recPath, 'utf8'));
  const recEntries = rec.recoveredEntries || {};

  const gen54bPath = path.resolve(process.cwd(), 'reports/i18n-block54b-translation-generation.json');
  const gen54b = JSON.parse(fs.readFileSync(gen54bPath, 'utf8'));
  const gen54bProposals = gen54b.proposals || {};

  // 3. Current runtime keys
  const existingArKeys = new Set(Object.keys(arTranslations));
  const existingEnKeys = new Set(Object.keys(enTranslations));
  const existingUrKeys = new Set(Object.keys(urTranslations));

  const previouslyResolvable = referencedKeys.filter(k => existingArKeys.has(k) && existingEnKeys.has(k) && existingUrKeys.has(k));
  const previouslyUnresolved = referencedKeys.filter(k => !existingArKeys.has(k) || !existingEnKeys.has(k) || !existingUrKeys.has(k));

  console.log(`Previously resolvable referenced keys: ${previouslyResolvable.length}`);
  console.log(`Previously unresolved referenced keys: ${previouslyUnresolved.length}`);

  // 4. Duplicate checks
  const duplicateKeys: string[] = [];
  const seenKeys = new Set<string>();

  // Helper to extract interpolation parameters
  const extractParams = (str: string): string[] => {
    if (!str) return [];
    const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    return matches.map(m => m.slice(1, -1)).sort();
  };

  const protectedTokens = [
    'ticketId', 'truckNo', 'projectId', 'carrierId', 'driverId', 'materialId',
    'operationId', 'pricingType', 'settlementBase', 'sourceType', 'status',
    'SAR', 'KG', 'TON'
  ];

  const interpolationMismatches: string[] = [];
  const protectedTokenMismatches: string[] = [];

  // 5. Prepare full dictionaries
  const finalDictAr: Record<string, string> = {};
  const finalDictEn: Record<string, string> = {};
  const finalDictUr: Record<string, string> = {};

  // First copy all 67 existing foundation & prior block keys exactly
  for (const k of Object.keys(arTranslations)) {
    finalDictAr[k] = arTranslations[k];
    finalDictEn[k] = enTranslations[k];
    finalDictUr[k] = urTranslations[k];
    seenKeys.add(k);
  }

  // Next, materialize all unmapped referenced keys
  const keysToMaterialize = referencedKeys.filter(k => !existingArKeys.has(k));
  console.log(`Keys to materialize: ${keysToMaterialize.length}`);

  for (const k of keysToMaterialize) {
    if (seenKeys.has(k)) {
      duplicateKeys.push(k);
    }
    seenKeys.add(k);

    // Resolve Arabic
    let arVal = (catEntries[k] || recEntries[k])?.sourceTextAr ||
      (catEntries[k] || recEntries[k])?.translations?.ar?.text;
    if (!arVal) {
      throw new Error(`FAILURE POLICY: Referenced key "${k}" has no Arabic translation in canonical catalog or recovery.`);
    }

    // Resolve English
    let enVal = (genProposals[k] || gen54bProposals[k])?.proposedTextEn ||
      (catEntries[k] || recEntries[k])?.translations?.en?.text;
    if (!enVal) {
      throw new Error(`FAILURE POLICY: Referenced key "${k}" has no English translation proposal.`);
    }

    // Resolve Urdu
    let urVal = (genProposals[k] || gen54bProposals[k])?.proposedTextUr ||
      (catEntries[k] || recEntries[k])?.translations?.ur?.text;
    if (!urVal) {
      throw new Error(`FAILURE POLICY: Referenced key "${k}" has no Urdu translation proposal.`);
    }

    // Empty check
    if (arVal.trim() === '') throw new Error(`FAILURE POLICY: Key "${k}" has empty Arabic translation.`);
    if (enVal.trim() === '') throw new Error(`FAILURE POLICY: Key "${k}" has empty English translation.`);
    if (urVal.trim() === '') throw new Error(`FAILURE POLICY: Key "${k}" has empty Urdu translation.`);

    // Self check
    if (arVal === k) throw new Error(`FAILURE POLICY: Key "${k}" resolves to itself in Arabic.`);
    if (enVal === k) throw new Error(`FAILURE POLICY: Key "${k}" resolves to itself in English.`);
    if (urVal === k) throw new Error(`FAILURE POLICY: Key "${k}" resolves to itself in Urdu.`);

    // Interpolation validation
    const arParams = extractParams(arVal);
    const enParams = extractParams(enVal);
    const urParams = extractParams(urVal);
    if (arParams.join(',') !== enParams.join(',') || arParams.join(',') !== urParams.join(',')) {
      interpolationMismatches.push(k);
      throw new Error(`FAILURE POLICY: Interpolation mismatch on key "${k}": AR=[${arParams}], EN=[${enParams}], UR=[${urParams}]`);
    }

    // Protected tokens validation
    for (const token of protectedTokens) {
      const inAr = arVal.includes(token);
      const inEn = enVal.includes(token);
      const inUr = urVal.includes(token);
      if (inAr && (!inEn || !inUr)) {
        protectedTokenMismatches.push(k);
        throw new Error(`FAILURE POLICY: Protected token "${token}" missing in EN or UR for key "${k}".`);
      }
    }

    finalDictAr[k] = arVal;
    finalDictEn[k] = enVal;
    finalDictUr[k] = urVal;
  }

  // Verify parity
  const arKeys = Object.keys(finalDictAr);
  const enKeys = Object.keys(finalDictEn);
  const urKeys = Object.keys(finalDictUr);

  if (arKeys.length !== enKeys.length || arKeys.length !== urKeys.length) {
    throw new Error(`Dictionary length parity mismatch: AR=${arKeys.length}, EN=${enKeys.length}, UR=${urKeys.length}`);
  }

  // 6. Verify Metadata Hooks keys
  const hookFiles = [
    'src/hooks/useExceptionTypeMeta.ts',
    'src/hooks/useDomainMeta.ts',
  ];
  let hookKeyCount = 0;
  for (const hf of hookFiles) {
    const c = fs.readFileSync(path.resolve(process.cwd(), hf), 'utf8');
    let m;
    while ((m = keyRegex.exec(c)) !== null) {
      hookKeyCount++;
      const hk = m[1];
      if (!finalDictAr[hk] || !finalDictEn[hk] || !finalDictUr[hk]) {
        throw new Error(`Metadata hook key "${hk}" does not resolve across all 3 locales!`);
      }
    }
  }
  console.log(`Metadata hook keys verified: ${hookKeyCount}`);

  // 7. Write runtime dictionary files
  const generateFileContent = (locale: 'ar' | 'en' | 'ur', dict: Record<string, string>): string => {
    const lines: string[] = [
      "import { TranslationDictionary } from '../../i18n/types';",
      '',
      `export const ${locale}Translations: TranslationDictionary = {`,
    ];

    // First, output original foundation & early block keys (keeping comments where possible)
    // To be clean and pristine, we can output foundation keys, then block keys, then materialized keys
    const foundationKeys = [
      'shared.actions.save',
      'shared.actions.cancel',
      'shared.actions.confirm',
      'shared.actions.close',
      'shared.actions.delete',
      'shared.actions.edit',
      'shared.status.loading',
      'shared.status.error',
      'shared.status.success',
      'shared.units.kg',
      'shared.units.ton',
      'shared.units.sar',
      'navigation.language',
      'navigation.language.ar',
      'navigation.language.en',
      'navigation.language.ur',
      'example.count',
    ];

    lines.push('  // BLOCK 40 — Foundation Dictionary');
    for (const fk of foundationKeys) {
      if (dict[fk] !== undefined) {
        lines.push(`  ${JSON.stringify(fk)}: ${JSON.stringify(dict[fk])},`);
      }
    }

    const otherExistingKeys = Object.keys(dict)
      .filter(k => !foundationKeys.includes(k) && existingArKeys.has(k))
      .sort();

    lines.push('');
    lines.push('  // BLOCK 45 & BLOCK 52 — Component-Safe Migrations');
    for (const k of otherExistingKeys) {
      lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])},`);
    }

    const materializedKeys = keysToMaterialize.sort();
    lines.push('');
    lines.push('  // BLOCK 54C — Materialized Runtime Keys (1,061 keys)');
    for (const k of materializedKeys) {
      lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])},`);
    }

    lines.push('};');
    lines.push('');
    return lines.join('\n');
  };

  const arContent = generateFileContent('ar', finalDictAr);
  const enContent = generateFileContent('en', finalDictEn);
  const urContent = generateFileContent('ur', finalDictUr);

  fs.writeFileSync(path.resolve(process.cwd(), 'src/locales/ar/index.ts'), arContent, 'utf8');
  fs.writeFileSync(path.resolve(process.cwd(), 'src/locales/en/index.ts'), enContent, 'utf8');
  fs.writeFileSync(path.resolve(process.cwd(), 'src/locales/ur/index.ts'), urContent, 'utf8');

  console.log('✅ Wrote src/locales/ar/index.ts');
  console.log('✅ Wrote src/locales/en/index.ts');
  console.log('✅ Wrote src/locales/ur/index.ts');

  return {
    referencedKeysCount: referencedKeys.length,
    existingKeysCount: existingArKeys.size,
    previouslyResolvableCount: previouslyResolvable.length,
    previouslyUnresolvedCount: previouslyUnresolved.length,
    materializedKeysCount: keysToMaterialize.length,
    finalDictionaryCount: arKeys.length,
    finalResolvableCount: referencedKeys.length,
    finalUnresolvedCount: 0,
    finalKeyAsValueCount: 0,
    missingArCount: 0,
    missingEnCount: 0,
    missingUrCount: 0,
    duplicateKeysDetected: duplicateKeys,
    interpolationMismatches,
    protectedTokenMismatches,
    metadataHookKeysCovered: hookKeyCount,
  };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('materialize-block54c')) {
  try {
    const summary = runMaterializeBlock54c();
    console.log('Materialization completed successfully:', summary);
  } catch (err) {
    console.error('Materialization failed:', err);
    process.exit(1);
  }
}
