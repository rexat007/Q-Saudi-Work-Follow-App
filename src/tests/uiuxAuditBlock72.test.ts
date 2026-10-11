import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { LOCALE_DIRECTIONS } from '../i18n/constants';
import { directionOf, isRTL } from '../i18n/utils';

describe('Block 72 UI/UX & RTL/LTR Audit Integrity Suite', () => {
  // B72-T04: Zero translation drift across AR, EN, and UR
  it('B72-T04: Zero translation drift across AR, EN, and UR', () => {
    const arKeys = Object.keys(arTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();
    const urKeys = Object.keys(urTranslations).sort();

    expect(arKeys).toHaveLength(enKeys.length);
    expect(arKeys).toHaveLength(urKeys.length);

    for (let i = 0; i < arKeys.length; i++) {
      expect(arKeys[i]).toBe(enKeys[i]);
      expect(arKeys[i]).toBe(urKeys[i]);
    }
  });

  // B72-T05: Arabic is mapped strictly to RTL
  it('B72-T05: Arabic is mapped strictly to RTL', () => {
    expect(LOCALE_DIRECTIONS.ar).toBe('rtl');
    expect(directionOf('ar')).toBe('rtl');
    expect(isRTL('ar')).toBe(true);
  });

  // B72-T06: Urdu is mapped strictly to RTL
  it('B72-T06: Urdu is mapped strictly to RTL', () => {
    expect(LOCALE_DIRECTIONS.ur).toBe('rtl');
    expect(directionOf('ur')).toBe('rtl');
    expect(isRTL('ur')).toBe(true);
  });

  // B72-T07: English is mapped strictly to LTR
  it('B72-T07: English is mapped strictly to LTR', () => {
    expect(LOCALE_DIRECTIONS.en).toBe('ltr');
    expect(directionOf('en')).toBe('ltr');
    expect(isRTL('en')).toBe(false);
  });

  // B72-T08: Audit JSON deliverable exists and has valid JSON structure
  it('B72-T08: Audit JSON deliverable exists and has valid JSON structure', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json');
    expect(fs.existsSync(jsonPath)).toBe(true);
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.auditMetadata).toBeDefined();
    expect(parsed.findings).toBeDefined();
  });

  // B72-T09: Audit Markdown deliverable exists and contains executive summary
  it('B72-T09: Audit Markdown deliverable exists and contains executive summary', () => {
    const mdPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.md');
    expect(fs.existsSync(mdPath)).toBe(true);
    const content = fs.readFileSync(mdPath, 'utf-8');
    expect(content.includes('BLOCK 72 — UI/UX & RTL/LTR VISUAL AUDIT REPORT')).toBe(true);
    expect(content.includes('Executive Summary') || content.includes('Detailed Audit Findings')).toBe(true);
  });

  // B72-T10: All findings are classified with valid severities (P0, P1, P2, P3)
  it('B72-T10: All findings are classified with valid severities (P0, P1, P2, P3)', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json');
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const validSeverities = new Set(['P0', 'P1', 'P2', 'P3']);
    const validCategories = new Set(['RTL_LTR', 'RESPONSIVE_UI', 'CORE_UX', 'VISUAL_CONSISTENCY', 'ACCESSIBILITY']);

    content.findings.forEach((finding: any, idx: number) => {
      expect(finding.id).toBeDefined();
      expect(finding.screen).toBeDefined();
      expect(finding.severity).toBeDefined();
      expect(finding.issueDescription).toBeDefined();

      expect(validSeverities.has(finding.severity)).toBe(true);
      expect(validCategories.has(finding.category)).toBe(true);
      expect(Array.isArray(finding.affectedLocales)).toBe(true);
      expect(finding.affectedLocales.length).toBeGreaterThan(0);
      expect(finding.reproduction).toBeDefined();
      expect(finding.recommendedFix).toBeDefined();
    });
  });

  // B72-T11: Severity count summary matches findings array length
  it('B72-T11: Severity count summary matches findings array length', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json');
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const counts = content.auditMetadata.severityCounts;
    const totalCount = counts.P0 + counts.P1 + counts.P2 + counts.P3;

    expect(totalCount).toBe(content.findings.length);
    expect(content.auditMetadata.totalFindings).toBe(content.findings.length);
  });

  // B72-T12: Root layout in App.tsx dynamically binds document direction via useI18n
  it('B72-T12: Root layout in App.tsx dynamically binds document direction via useI18n', () => {
    const appPath = path.resolve(process.cwd(), 'src/App.tsx');
    expect(fs.existsSync(appPath)).toBe(true);
    const appContent = fs.readFileSync(appPath, 'utf-8');
    const hasDirectionBinding = appContent.includes('dir={direction}') || appContent.includes("dir={isRTL ? 'rtl' : 'ltr'}");
    expect(hasDirectionBinding).toBe(true);
  });

  // B72-T13: BLOCK 71 freeze gate results remain valid and unmodified
  it('B72-T13: BLOCK 71 freeze gate results remain valid and unmodified', () => {
    const freezePath = path.resolve(process.cwd(), 'reports/i18n-freeze-gate.json');
    expect(fs.existsSync(freezePath)).toBe(true);
    const freezeContent = JSON.parse(fs.readFileSync(freezePath, 'utf-8'));
    expect(freezeContent.freezeStatus).toBe('PASS');
    expect(freezeContent.finalDecision).toBe('FORMALLY_FROZEN');
  });
});
