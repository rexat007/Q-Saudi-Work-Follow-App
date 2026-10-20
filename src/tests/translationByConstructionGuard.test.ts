/**
 * BLOCK — Translation-by-Construction Regression Guard Test Suite
 * Purpose: TRANSLATION_BY_CONSTRUCTION_REGRESSION_GUARD
 * 
 * Inspects active production UI source across operational areas and validates
 * that unmanaged hardcoded user-facing strings and known defect strings
 * are strictly routed through canonical i18n dictionaries (AR, EN, UR).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Translation-by-Construction Regression Guard', () => {
  const rootDir = process.cwd();

  const readSource = (relativePath: string): string => {
    const fullPath = path.resolve(rootDir, relativePath);
    if (!fs.existsSync(fullPath)) return '';
    return fs.readFileSync(fullPath, 'utf8');
  };

  const stripCommentsAndImports = (content: string): string => {
    return content
      // Remove multiline comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove singleline comments
      .replace(/\/\/.*$/gm, '')
      // Remove import statements
      .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, '');
  };

  const defectStrings = [
    'FIELD OPERATIONS SUITE',
    'Loading Operator',
    'CAPTURE & VALIDATE',
    'IDENTIFY',
    'Tare Weight',
    'Gross Weight',
    'Net Weight',
  ];

  const operationalUiFiles = [
    'src/components/field/LoadingOperatorView.tsx',
    'src/components/field/UnloadingOperatorView.tsx',
    'src/components/field/FieldOperationsView.tsx',
    'src/components/tripEngine/WeightEngineView.tsx',
    'src/components/tripEngine/LoadingStation.tsx',
    'src/components/tripEngine/UnloadingStation.tsx',
    'src/components/dashboard/OperationsDashboardView.tsx',
  ];

  it('TBC-01: Operational UI components exist and use managed translation keys', () => {
    for (const file of operationalUiFiles) {
      const content = readSource(file);
      expect(content.length, `Expected ${file} to exist and not be empty`).toBeGreaterThan(0);
      expect(content, `Expected ${file} to consume i18n translation hooks`).toMatch(/t\(|useI18n|useTranslation/);
    }
  });

  it('TBC-02: Known defect strings are not hardcoded in active operational UI JSX code', () => {
    for (const file of operationalUiFiles) {
      const rawContent = readSource(file);
      const codeOnly = stripCommentsAndImports(rawContent);

      for (const defect of defectStrings) {
        // Must not contain raw JSX text or template literals with the defect strings
        const defectRegex = new RegExp(`>\\s*[^<]*${defect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*<|'[^']*${defect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^']*'|"[^"]*${defect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"`, 'i');
        
        // Exclude allowed translation keys or identifiers
        const matches = codeOnly.match(defectRegex);
        if (matches) {
          // Verify match is not an i18n key lookup or benign prop
          const isBenign = matches[0].includes('t(') || matches[0].includes('i18n') || matches[0].includes('field_operations.') || matches[0].includes('weighbridge.');
          expect(isBenign, `Found unmanaged hardcoded defect string "${defect}" in ${file}: ${matches[0]}`).toBe(true);
        }
      }
    }
  });

  it('TBC-03: Field Operations views adhere to i18n direction and translation contracts', () => {
    const fieldOps = readSource('src/components/field/FieldOperationsView.tsx');
    expect(fieldOps).not.toMatch(/dir="rtl"/);
    expect(fieldOps).toMatch(/dir=\{isRTL \? 'rtl' : 'ltr'\}/);

    const loadingOp = readSource('src/components/field/LoadingOperatorView.tsx');
    expect(loadingOp).toMatch(/field_operations\.loading_operator/);
    expect(loadingOp).toMatch(/field_operations\.identify/);
    expect(loadingOp).toMatch(/field_operations\.capture_validate/);

    const unloadingOp = readSource('src/components/field/UnloadingOperatorView.tsx');
    expect(unloadingOp).toMatch(/field_operations\.unloading_operator/);
    expect(unloadingOp).toMatch(/field_operations\.identify_unloading/);
    expect(unloadingOp).toMatch(/field_operations\.capture_validate_dest/);
  });

  it('TBC-04: Trip & Weight Engines use managed weight translation keys', () => {
    const weightEngine = readSource('src/components/tripEngine/WeightEngineView.tsx');
    expect(weightEngine).toMatch(/field_operations\.step6_tare_kg/);
    expect(weightEngine).toMatch(/field_operations\.step7_gross_kg/);

    const loadingStation = readSource('src/components/tripEngine/LoadingStation.tsx');
    expect(loadingStation).toMatch(/field_operations\.step6_tare/);
    expect(loadingStation).toMatch(/field_operations\.step7_gross/);
    expect(loadingStation).toMatch(/field_operations\.net_weight_label/);
  });

  it('TBC-05: Navigation & Sidebar UI elements use managed translation keys', () => {
    const sidebar = readSource('src/components/navigation/Sidebar.tsx');
    expect(sidebar).toMatch(/navigation\.labels\.provision_new_project/);
    expect(sidebar).toMatch(/navigation\.labels\.system_tools/);
  });

  it('TBC-06: Operations Dashboard enforces dynamic direction and auth i18n', () => {
    const dashboard = readSource('src/components/dashboard/OperationsDashboardView.tsx');
    expect(dashboard).not.toMatch(/dir="rtl"/);
    expect(dashboard).toMatch(/dir=\{isRTL \? 'rtl' : 'ltr'\}/);
  });

  it('TBC-07: Smart Import components adhere to translation contracts', () => {
    const smartImportFiles = [
      'src/components/smartImport/SmartImportModal.tsx',
      'src/components/smartImport/ImportCenter.tsx'
    ];
    for (const sif of smartImportFiles) {
      const content = readSource(sif);
      if (content) {
        expect(content).toMatch(/t\(|useTranslation|useI18n/);
      }
    }
  });

  it('TBC-08: Full locale dictionary structural parity for AR, EN, UR', () => {
    const arPath = path.resolve(rootDir, 'src/locales/ar/index.ts');
    const enPath = path.resolve(rootDir, 'src/locales/en/index.ts');
    const urPath = path.resolve(rootDir, 'src/locales/ur/index.ts');

    expect(fs.existsSync(arPath)).toBe(true);
    expect(fs.existsSync(enPath)).toBe(true);
    expect(fs.existsSync(urPath)).toBe(true);

    const arContent = fs.readFileSync(arPath, 'utf8');
    const enContent = fs.readFileSync(enPath, 'utf8');
    const urContent = fs.readFileSync(urPath, 'utf8');

    const requiredKeys = [
      'field_operations.suite_title',
      'field_operations.subtitle',
      'field_operations.loading_operator',
      'field_operations.unloading_operator',
      'field_operations.supervision',
      'field_operations.driver',
      'field_operations.identify',
      'field_operations.identify_unloading',
      'field_operations.capture_validate',
      'field_operations.capture_validate_dest',
      'field_operations.tare_weight',
      'field_operations.gross_weight',
      'field_operations.net_weight',
      'field_operations.calculated_net_weight',
      'field_operations.dest_net_weight',
      'field_operations.loading_station_tab',
      'field_operations.unloading_station_tab',
      'field_operations.active_project',
      'field_operations.step6_tare',
      'field_operations.step6_tare_kg',
      'field_operations.step7_gross',
      'field_operations.step7_gross_kg',
      'field_operations.net_weight_label',
      'field_operations.calculate_net_formula',
      'navigation.labels.provision_new_project',
      'navigation.labels.system_tools',
    ];

    for (const key of requiredKeys) {
      expect(arContent, `Key "${key}" must exist in Arabic locale dictionary`).toContain(`"${key}"`);
      expect(enContent, `Key "${key}" must exist in English locale dictionary`).toContain(`"${key}"`);
      expect(urContent, `Key "${key}" must exist in Urdu locale dictionary`).toContain(`"${key}"`);
    }
  });

  const batch1ProductionFiles = [
    'src/App.tsx',
    'src/components/navigation/Sidebar.tsx',
    'src/components/navigation/MobileNavDrawer.tsx',
    'src/components/navigation/SystemToolsDrawer.tsx',
    'src/components/navigation/UnauthorizedBanner.tsx',
    'src/components/auth/AccountStatusGate.tsx',
    'src/components/auth/AuthButton.tsx',
    'src/components/common/ErrorBoundary.tsx',
    'src/components/i18n/LanguageSwitcher.tsx',
  ];

  it('TBC-09: Batch-1 Global Shell, Navigation, Auth, and App Root translation guard', () => {
    // Approved technical brand literals & non-translatable tokens in Batch-1 scope
    const approvedBatch1Literals = new Set([
      'Q',
      'Q-Saudi Core',
      'Q Saudi Work Follow',
      'Q-Saudi Work Follow',
      'INDUSTRIAL_CORE',
      'INDUSTRIAL_FSM',
      'SSOT_ACTIVE',
      'VITE_PROD_DEPLOYED',
      'STATUS:',
      'STABLE_AUTH',
      'USER:',
      'SCOPE:',
      'SSOT // MULTI-TENANT ISOLATION',
      'SERVER-AUTHORITATIVE CORE',
      'Multi-Project Logistics FSM',
      'INVARIANT RULE',
      'Production Ready Spec',
      '.md',
      '2024 System Infrastructure',
      'Firestore SSOT',
      '|',
      'Sheets Projection',
      'IndexedDB Offline-First',
      '×',
      '⚠️',
      '🛑',
      '*',
      '•'
    ]);

    for (const file of batch1ProductionFiles) {
      const rawContent = readSource(file);
      expect(rawContent.length, `Batch-1 file ${file} must exist and not be empty`).toBeGreaterThan(0);

      const codeOnly = stripCommentsAndImports(rawContent);

      // 1. Detect raw Arabic user-facing literals
      const arabicMatches = codeOnly.match(/[\u0600-\u06FF]+/g);
      expect(
        arabicMatches,
        `Batch-1 file ${file} contains raw Arabic literals that must be localized through t(): ${arabicMatches?.join(', ')}`
      ).toBeNull();

      // 2. Detect hardcoded title="...", placeholder="...", aria-label="..." string literals
      const hardcodedAttributeRegex = /(?:title|placeholder|aria-label)=["']([^"']+)["']/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = hardcodedAttributeRegex.exec(codeOnly)) !== null) {
        const val = attrMatch[1].trim();
        // Allow pure symbols or digits
        if (!/^[0-9\s#\.:\-\/\|•\*\(\)]+$/.test(val)) {
          expect(
            false,
            `Batch-1 file ${file} contains hardcoded attribute ${attrMatch[0]} which must use t(...) or dynamic value`
          ).toBe(true);
        }
      }

      // 3. Detect binary isRtl language-content branches: isRtl ? '...' : '...'
      const isRtlStringBranchRegex = /isRtl\s*\?\s*['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g;
      const rtlBranchMatch = isRtlStringBranchRegex.exec(codeOnly);
      if (rtlBranchMatch) {
        const val1 = rtlBranchMatch[1].trim();
        const val2 = rtlBranchMatch[2].trim();
        // Allow pure CSS class/directional strings such as border-l/border-r, right-3/left-3, pr-9/pl-9
        const isDirectionalCss = /^(border-[lr]|right-\d+|left-\d+|pr-\d+|pl-\d+|rtl|ltr)$/.test(val1) &&
                                 /^(border-[lr]|right-\d+|left-\d+|pr-\d+|pl-\d+|rtl|ltr)$/.test(val2);
        expect(
          isDirectionalCss,
          `Batch-1 file ${file} contains binary isRtl language branching instead of t(...): "${rtlBranchMatch[0]}"`
        ).toBe(true);
      }

      // 4. Detect raw JSX text nodes that are not approved technical literals or dynamic expressions
      const rawJsxTextRegex = />([^<>{}\n]+)</g;
      let textMatch: RegExpExecArray | null;
      while ((textMatch = rawJsxTextRegex.exec(codeOnly)) !== null) {
        const text = textMatch[1].trim();
        if (text && !/^[0-9\s#\.:\-\/\|•\*\(\)]+$/.test(text)) {
          const isApproved = approvedBatch1Literals.has(text);
          expect(
            isApproved,
            `Batch-1 file ${file} contains unmanaged user-facing JSX text: "${text}"`
          ).toBe(true);
        }
      }
    }
  });

  it('TBC-10: Batch-1 Locale Dictionaries have complete semantic key parity across AR, EN, UR', () => {
    const arPath = path.resolve(rootDir, 'src/locales/ar/index.ts');
    const enPath = path.resolve(rootDir, 'src/locales/en/index.ts');
    const urPath = path.resolve(rootDir, 'src/locales/ur/index.ts');

    const arContent = fs.readFileSync(arPath, 'utf8');
    const enContent = fs.readFileSync(enPath, 'utf8');
    const urContent = fs.readFileSync(urPath, 'utf8');

    const batch1RequiredKeys = [
      'navigation.roles.super_admin_label',
      'navigation.roles.project_admin_label',
      'navigation.roles.supervisor_label',
      'navigation.roles.site_supervisor_label',
      'navigation.roles.dispatcher_label',
      'navigation.roles.scale_operator_label',
      'navigation.roles.finance_auditor_label',
      'navigation.roles.driver_label',
      'navigation.roles.viewer_label',
      'sidebar.expand',
      'sidebar.collapse',
      'sidebar.role_profile',
      'sidebar.operational_suite',
      'sidebar.project_workspace',
      'sidebar.expand_projects',
      'sidebar.collapse_projects',
      'sidebar.no_projects_found',
      'sidebar.active_logistics_scope',
      'sidebar.select_project',
      'navigation.mobile.close_menu',
      'navigation.mobile.switch_role',
      'navigation.mobile.authorized_sections',
      'navigation.mobile.system_tools_section',
      'navigation.mobile.main_menu',
      'navigation.system_tools.subtitle',
      'navigation.system_tools.search_placeholder',
      'navigation.system_tools.no_tools_found',
      'navigation.system_tools.role_label',
      'navigation.system_tools.production_tools_count',
      'navigation.categories.system_admin',
      'navigation.categories.audit_security',
      'navigation.categories.operations_support',
      'navigation.categories.developer_mode',
      'unauthorized.access_restricted',
      'unauthorized.title',
      'unauthorized.description_prefix',
      'unauthorized.description_suffix',
      'unauthorized.active_user',
      'unauthorized.current_role',
      'unauthorized.authorized_projects_scope',
      'unauthorized.return_to_default',
      'auth.fallback.system_admin',
      'auth.fallback.system_user',
      'auth.fallback.registered_user',
      'auth.fallback.unregistered_user',
      'auth.labels.google_verified',
      'auth.gate.brand_title',
      'auth.gate.security_subheading',
      'auth.gate.gateway_title',
      'auth.gate.security_notice_title',
      'auth.gate.security_notice_body',
      'auth.gate.new_user_badge',
      'auth.gate.submit_request_title',
      'auth.gate.fill_details_prompt',
      'auth.gate.auth_alone_warning',
      'auth.bootstrap.failed',
      'auth.bootstrap.connection_error',
      'auth.bootstrap.panel_title',
      'auth.bootstrap.detected_owner',
      'auth.bootstrap.description',
      'auth.bootstrap.success_message',
      'auth.bootstrap.in_progress',
      'auth.bootstrap.action_btn',
      'auth.validation.full_name_required',
      'auth.validation.submit_error',
      'auth.fields.google_email',
      'auth.fields.full_name',
      'auth.fields.full_name_placeholder',
      'auth.fields.requested_role',
      'auth.fields.request_reason',
      'auth.fields.request_reason_placeholder',
      'auth.status.rejected_title',
      'auth.status.rejected_subtitle',
      'auth.status.rejected_description',
      'auth.status.rejected_badge',
      'auth.status.suspended_title',
      'auth.status.suspended_subtitle',
      'auth.status.suspended_description',
      'auth.status.suspended_badge',
      'auth.status.pending_title',
      'auth.status.pending_subtitle',
      'auth.status.pending_description',
      'auth.status.pending_badge',
      'shared.actions.close_alert',
      'shared.actions.sign_out',
      'shared.actions.hide',
      'shared.actions.show',
      'shared.status.online',
      'shared.status.offline',
      'shared.labels.unspecified',
      'error_boundary.title',
      'error_boundary.subtitle',
      'error_boundary.description',
      'error_boundary.retry',
      'error_boundary.refresh_app',
      'navigation.labels.switch_active_role',
      'navigation.labels.conflicts_count',
      'navigation.labels.enterprise_architecture',
      'relations.direct_connections',
      'relations.view_entity',
      'docs.path_label',
    ];

    for (const key of batch1RequiredKeys) {
      expect(arContent, `Key "${key}" must exist in Arabic locale dictionary`).toContain(`"${key}"`);
      expect(enContent, `Key "${key}" must exist in English locale dictionary`).toContain(`"${key}"`);
      expect(urContent, `Key "${key}" must exist in Urdu locale dictionary`).toContain(`"${key}"`);
    }

    // Verify no Arabic text in English locale dictionary
    // We check only the Batch-1 section in enContent
    const enBatch1Section = enContent.substring(enContent.indexOf('// Batch 1: Global Shell'));
    expect(enBatch1Section).not.toMatch(/[\u0600-\u06FF]/);
  });
});

