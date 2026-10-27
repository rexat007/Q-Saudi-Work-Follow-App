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
import ts from 'typescript';
import { analyticsTextKeys } from '../i18n/analyticsPresentation';
import { operationalMessageTemplates } from '../i18n/operationalMessages';
import { arTranslations, enTranslations, urTranslations } from '../locales';

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
    'src/components/import/RosterSemanticReview.tsx',
    'src/components/wizard/FleetSetupWorkspace.tsx',
    'src/components/wizard/SetupReadinessPanel.tsx',
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


// Batch 2 is scanned as a functional domain. These checks are static evidence,
// not browser verification or proof of localization of server-owned messages.
describe('Batch-2 translation-by-construction', () => {
  const batch2Files = [
    "src/components/field/FieldOperationsView.tsx",
    "src/components/field/LoadingOperatorView.tsx",
    "src/components/field/UnloadingOperatorView.tsx",
    "src/components/field/DriverView.tsx",
    "src/components/field/FieldSupervisionView.tsx",
    "src/components/tripEngine/WeightEngineView.tsx",
    "src/components/tripEngine/LoadingStation.tsx",
    "src/components/tripEngine/UnloadingStation.tsx",
    "src/components/tripEngine/StateMachineController.tsx",
    "src/components/TripEngineView.tsx"
];

  // Preserved business payloads, fixture identities, plates and free-text notes.
  // Changing these would alter persistence/audit semantics rather than presentation.
  // Exact values are scoped to their owning file; they do not exempt new UI prose.
  const preservedBusinessText: Record<string, string[]> = {
    "src/components/field/LoadingOperatorView.tsx": [
        "مشغل ميزان التحميل (Scale Operator)",
        "[تذكرة ميزان منشأة ميدانياً] الصافي: {p0} كجم"
    ],
    "src/components/field/UnloadingOperatorView.tsx": [
        "مشغل ميزان الموقع والتفريغ (Site Receiver)",
        "{p0} | [اعتماد صريح لصافي وزن المصدر]",
        "[اعتماد صريح لصافي وزن المصدر كوزن استلام]",
        "تم اكتمال الاستلام والتفريغ بالموقع"
    ],
    "src/components/field/DriverView.tsx": [
        "السائق"
    ],
    "src/components/tripEngine/WeightEngineView.tsx": [
        "قاعدة تفاوت موقعية جديدة"
    ],
    "src/components/tripEngine/LoadingStation.tsx": [
        "مشروع نيوم - البنية التحتية والمحاجر (PRJ-NEOM-001)",
        "[رحلة منشأة أوفلاين: بانتظار تخصيص الرقم المتسلسل الخادومي PENDING_NUMBER_ALLOCATION] الصافي: {p0} كجم",
        "مشغل محطة التحميل (Offline)",
        "تم إنشاء الرحلة واحتساب التسعيرة محلياً بوضع عدم الاتصال بانتظار تخصيص الرقم المتسلسل الخادومي",
        "تم إنشاء واعتماد الرحلة من محطة التحميل والميزان (الصافي: {p0} كجم)",
        "مشغل محطة التحميل والميزان"
    ],
    "src/components/tripEngine/UnloadingStation.tsx": [
        "م. فهد الزهراني (مفتش الاستلام)",
        "د هـ و 5678",
        "تمت مراجعة الفارق واحتساب نسبة رطوبة وتبخر طبيعية معتمدة من مدير الموقع"
    ],
    "src/components/tripEngine/StateMachineController.tsx": [
        "م. صالح الغامدي",
        "مستلم تجريبي",
        "محاولة إكمال بدون صافي وزن الوصول",
        "محاولة إكمال بدون تحديد مستلم أو وقت تفريغ",
        "محاولة إكمال بدون احتساب الفارق",
        "محاولة بدء رحلة بتسعيرة منتهية الصلاحية ومعدومة القيمة",
        "محاولة قفز غير قانوني من DRAFT إلى COMPLETED",
        "سائق تجريبي",
        "محاولة تغيير الحالة برتبة سائق",
        "محاولة تعديل رحلة نيوم من مستخدم يتبع مشروع البحر الأحمر",
        "سعد الشهري (كاتب ميزان)",
        "صالح الغامدي (مرحل عمليات)",
        "خالد الشمري (سائق شاحنة)",
        "م. فهد الزهراني (مستلم موقع)",
        "م. عبدالرحمن النمر (مدير عمليات)",
        "أحمد المطيري (مدقق مالي)"
    ],
    "src/components/TripEngineView.tsx": [
        "شحنة ركام خرساني معتمدة لمشروع نيوم",
        "تمت مطابقة ميزان الجسر بموقع الاستلام واحتساب فارق الوزن",
        "شحنة ركام بازلتي مطابقة 100% لجميع الشروط والمعايير (تسعير بالطن)",
        "شحنة رمل ناعم مطابقة 100% بنظام المقطوعية بالرد (PER_TRIP)",
        "محاولة ترحيل رحلة لناقل غير مصرح به في المشروع",
        "محاولة توريد خلطة أسفلتية غير مصرح بها في هذا المشروع",
        "محاولة مخالفة تبعية وكفالة الشاحنة للناقل المختار",
        "محاولة تطبيق تسعيرة منتهية الصلاحية الزمنية",
        "اختبار حوكمة الأوزان: العميل يحاول إرسال netWeight = 99,999 كجم",
        "تمت مطابقة ميزان الاستلام في الموقع"
    ]
};
  const technicalLiterals = new Set([
    "37.4 × 8.5 = 317.90 SAR",
    "KG",
    "tare &gt; 0",
    "gross &gt; tare",
    "net &gt; 0",
    "received &gt; 0",
    "F1",
    "calculateNetWeight(tare, gross)",
    "F2",
    "calculateVariance(loadedNet, receivedNet)",
    "null",
    "F3",
    "evaluateTolerance(variance, tolerance, loadedNet)",
    "F4",
    "calculateSettlement(pricingRule, netWeight)",
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
    "(v",
    "createTrip()",
    "createEvent(LOADED)",
    "transition(IN_TRANSIT)",
    "PRJ-NEOM-001",
    "tripSerial",
    "ticketId",
    "truckId",
    "0: NOT_FOUND",
    "1: CONTINUE",
    "&gt;1: AMBIGUOUS",
    "0 \u2794 NOT_FOUND",
    "1 \u2794 CONTINUE",
    "IN_TRANSIT \u2794 ARRIVED",
    "ARRIVED \u2794 UNLOADING",
    "REC-INSPECTOR-01",
    "UNLOADING \u2794 COMPLETED",
    "varianceWeight = destNetWeight - netWeight",
    "1. unloaderId",
    "2. arrivalTime",
    "3. unloadTime",
    "4. destNetWeight",
    "5. varianceWeight",
    "destNet - netWeight",
    "SAR",
    "ENG-SITE-04",
    "2026-09-09T14:30:00Z",
    "SITE_RECEIVER, DISPATCHER",
    "SCALE_OPERATOR",
    "DRIVER, DISPATCHER, RECEIVER",
    "DISPATCHER, OPERATIONS_MGR",
    "| v",
    "v",
    "destNetWeight = null",
    "tripId",
    "projectId",
    "driverId",
    "carrierId",
    "materialId",
    "shiftDate",
    "version",
    "pricingRuleId:",
    "pricingType:",
    "agreedRate:",
    "settlementBase:",
    "settlementAmount:",
    "loaderId",
    "unloaderId",
    "loadTime",
    "unloadTime"
]);
  const dictionariesByLocale = { ar: arTranslations, en: enTranslations, ur: urTranslations };

  const normalize = (node: ts.Node, source: ts.SourceFile): string => {
    if (ts.isJsxText(node)) return node.text.trim();
    if (ts.isTemplateExpression(node)) {
      return node.head.text + node.templateSpans.map((span, index) => `{p${index}}${span.literal.text}`).join('');
    }
    return ts.isStringLiteralLike(node) ? node.text : node.getText(source);
  };

  const scan = (content: string, file = 'mutation.tsx'): string[] => {
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const issues: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node) || ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
        const text = normalize(node, source);
        const parent = node.parent;
        const translatedKey = ts.isCallExpression(parent) && ['t', 'translate'].includes(parent.expression.getText(source));
        const attributeNode = ts.isJsxExpression(parent) ? parent.parent : parent;
        const attribute = ts.isJsxAttribute(attributeNode) && ['title', 'placeholder', 'aria-label', 'alt'].includes(attributeNode.name.getText(source));
        const jsxText = ts.isJsxText(node);
        const languageText = /[\u0600-\u06ff]/.test(text);
        const visibleProperty = ts.isPropertyAssignment(parent) && ['label', 'testName', 'serverMessage', 'message'].includes(parent.name.getText(source));
        const diagnostic = ts.isCallExpression(parent) && /^console\./.test(parent.expression.getText(source));
        const workflowKey = file.endsWith('/LoadingStation.tsx') && ts.isPropertyAssignment(parent) && parent.name.getText(source) === 'label' && Object.hasOwn(arTranslations, text);
        const analyticsProfile = file.endsWith('/dashboard/OperationsDashboardView.tsx') && text === 'مستخدم النظام' &&
          ts.isBinaryExpression(parent) && ts.isPropertyAssignment(parent.parent) && parent.parent.name.getText(source) === 'userNameAr';
        const analyticsStyle = file.endsWith('/reports/ReportsEngineView.tsx') && ['مطابق', 'عجز'].includes(text) &&
          ts.isCallExpression(parent) && parent.expression.getText(source) === 'String(val).includes';
        const analyticsToken = /\/(dashboard|reports)\//.test(file) && ['PER_TRIP', 'PER_TON', 'settlementAmount'].includes(text) && jsxText;
        const approved = analyticsProfile || analyticsStyle || analyticsToken || workflowKey || technicalLiterals.has(text) || preservedBusinessText[file]?.includes(text);
        const prose = /[A-Za-z\u0600-\u06ff]/.test(text.replace(/\{p\d+\}/g, ""));
        if (!translatedKey && !diagnostic && !approved && prose && (jsxText || attribute || languageText || visibleProperty)) {
          issues.push(`${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${text}`);
        }
        // Avoid reporting individual template pieces twice.
        if (ts.isTemplateExpression(node) && approved) return;
      }
      if (ts.isConditionalExpression(node) && /\bisRTL\b|\bisRtl\b/.test(node.condition.getText(source))) {
        for (const branch of [node.whenTrue, node.whenFalse]) {
          if (ts.isStringLiteralLike(branch) && !/^(rtl|ltr|(?:[a-z0-9!:[\]./#%-]+-)[a-z0-9!:[\]./#%-]*(?:\s+[a-z0-9!:[\]./#%-]+)*)$/i.test(branch.text)) {
            issues.push(`Language-content direction branch: ${branch.text}`);
          }
        }
      }
      if (ts.isBinaryExpression(node) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
        const left = node.left;
        if (ts.isCallExpression(left) && ['t', 'translate'].includes(left.expression.getText(source)) && ts.isStringLiteralLike(node.right) && /[A-Za-z\u0600-\u06ff]/.test(node.right.text)) {
          issues.push(`Inline translation fallback: ${node.right.text}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return issues;
  };

  it('TBC-11: All ten Batch-2 sources have no unmanaged local presentation literals', () => {
    for (const file of batch2Files) {
      expect(fs.existsSync(file), file).toBe(true);
      expect(scan(fs.readFileSync(file, 'utf8'), file), file).toEqual([]);
    }
  });

  it('TBC-12: Scanner rejects multilingual JSX, attributes, callback messages and direction-language branches', () => {
    for (const snippet of [
      '<button>Loading Operator</button>', '<p>تحميل</p>', '<p>لوڈنگ</p>',
      '<input placeholder="Search trucks" />', '<button title={"Receive truck"} />',
      '<button aria-label="Record arrival" />',
      'notify({ message: "Arrival recorded" });',
      'const label = isRTL ? "Loading Scale" : "Unloading Scale";',
      'const label = t("missing.key") || "Fallback text";',
    ]) expect(scan(snippet).length, snippet).toBeGreaterThan(0);
    expect(scan('<div dir={isRTL ? "rtl" : "ltr"}>{truck.plate}{driver.name}</div>')).toEqual([]);
    expect(scan('// تعليق داخلي\nconsole.warn("Internal diagnostic");')).toEqual([]);
  });

  it('TBC-13: Current locale key sets match dynamically and contain no duplicate declarations', () => {
    const keySets: string[][] = [];
    for (const locale of ['ar', 'en', 'ur'] as const) {
      const file = `src/locales/${locale}/index.ts`;
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const keys: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) keys.push(node.name.text);
        ts.forEachChild(node, visit);
      };
      visit(source);
      expect(keys.length, locale).toBeGreaterThan(0);
      expect(new Set(keys).size, `Duplicate declarations in ${locale}`).toBe(keys.length);
      keySets.push(keys.sort());
    }
    expect(keySets[1]).toEqual(keySets[0]);
    expect(keySets[2]).toEqual(keySets[0]);
  });

  it('TBC-14: Every current Batch-2 literal key and workflow label resolves in all locales', () => {
    const keys = new Set<string>(operationalMessageTemplates.map(entry => entry.key));
    for (const file of batch2Files) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ['t', 'translate'].includes(node.expression.getText(source)) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) keys.add(node.arguments[0].text);
        if (file.endsWith('/LoadingStation.tsx') && ts.isPropertyAssignment(node) && node.name.getText(source) === 'label' && ts.isStringLiteral(node.initializer)) keys.add(node.initializer.text);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(keys.size).toBeGreaterThan(0);
    for (const key of keys) {
      const values = (['ar', 'en', 'ur'] as const).map(locale => dictionariesByLocale[locale][key]);
      for (const [index, value] of values.entries()) {
        expect(typeof value, `${key}, locale ${index}`).toBe('string');
        expect(value?.trim(), `${key}, locale ${index}`).toBeTruthy();
        expect(value, key).not.toBe(key);
      }
      expect(values[1], `Arabic fallback in English: ${key}`).not.toMatch(/[\u0600-\u06ff]/);
      // Urdu uses Arabic-derived script. Check fallback equality, not script presence.
      if (/[\u0600-\u06ff]/.test(values[0]) && values[0].length > 15) {
        expect(values[1], key).not.toBe(values[0]);
        expect(values[2], key).not.toBe(values[0]);
      }
      const params = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
      expect(params(values[1]), key).toEqual(params(values[0]));
      expect(params(values[2]), key).toEqual(params(values[0]));
      expect(values[0], `Unbound historical source expression: ${key}`).not.toContain('${');
    }
  });
  it('TBC-15: Operational adapter stays at Batch-2 presentation boundaries', () => {
    const boundaries: Record<string, string[]> = {
      'src/components/TripEngineView.tsx': ['liveValidation.blockingError || ""', 'r.ruleDescriptionAr', 'r.messageAr'],
      'src/components/tripEngine/WeightEngineView.tsx': ['err', 'toleranceEvalResult.messageAr', 'settlementResult.formula'],
      'src/components/tripEngine/StateMachineController.tsx': ['tr.labelAr', 'tr.descriptionAr'],
      'src/components/tripEngine/UnloadingStation.tsx': ['result.messageAr', 'searchResult.messageAr', 'err.message'],
      'src/components/tripEngine/LoadingStation.tsx': ['report.blockingReasonAr || ""', 'err.message || ""'],
      'src/components/field/LoadingOperatorView.tsx': ['err.message || ""'],
      'src/components/field/UnloadingOperatorView.tsx': ['err.message || ""'],
    };
    for (const [file, values] of Object.entries(boundaries)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const value of values) expect(source, file).toContain(`operationalMessage(${value})`);
    }
    for (const file of ['src/services/weightEngine.service.ts', 'src/services/tripEngine.service.ts',
      'src/services/tripStateMachine.service.ts', 'src/services/offline/offlineCache.service.ts',
      'src/services/offline/outbox.service.ts', 'src/services/trip.service.ts', 'server/app.ts']) {
      expect(fs.readFileSync(file, 'utf8'), file).not.toContain('i18n/operationalMessages');
    }
  });

  const batch3Files = [
    'src/components/dashboard/OperationsDashboardView.tsx',
    'src/components/dashboard/WidgetFilterBar.tsx',
    'src/components/reports/ReportsEngineView.tsx',
    'src/components/reports/PrintableReportModal.tsx',
  ];

  it('TBC-16: Reachable Dashboard/Reports presentation has no unmanaged local prose', () => {
    for (const file of batch3Files) expect(scan(fs.readFileSync(file, 'utf8'), file), file).toEqual([]);
    for (const snippet of ['<span>Operational</span>', '<span>ملخص التقارير</span>', '<span>رپورٹس</span>',
      '<input aria-label="Report search" />', 'const title = isRTL ? "تقارير" : "Reports";']) {
      expect(scan(snippet).length, snippet).toBeGreaterThan(0);
    }
  });

  it('TBC-17: Current Dashboard/Reports keys, error states and upstream labels resolve with trilingual parameter parity', () => {
    const keys = new Set(Object.values(analyticsTextKeys));
    for (const file of [...batch3Files, 'src/i18n/analyticsPresentation.ts']) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = (node: ts.Node) => {
        if (ts.isStringLiteralLike(node) && (node.text.startsWith('analytics.') ||
          (ts.isCallExpression(node.parent) && ['t', 'translate'].includes(node.parent.expression.getText(source))))) keys.add(node.text);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(keys.size).toBeGreaterThan(0);
    for (const key of keys) {
      const values = [arTranslations[key], enTranslations[key], urTranslations[key]];
      for (const value of values) expect(value?.trim(), key).toBeTruthy();
      expect(values[1], key).not.toMatch(/[\u0600-\u06ff]/);
      if (values[0].length > 15 && /[\u0600-\u06ff]/.test(values[0])) expect(values[2], key).not.toBe(values[0]);
      const params = (v: string) => [...v.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
      expect(params(values[1]), key).toEqual(params(values[0]));
      expect(params(values[2]), key).toEqual(params(values[0]));
      expect(values[0], key).not.toContain('${');
    }
  });


  it('TBC-B4: the eleven approved import anchors consume canonical translations', () => {
    const surfaces: Record<string, string[]> = {
      "src/components/wizard/ProjectSetupWizard.tsx": [
            "projects.messages.checkpoint_partial_failure",
            "projects.messages.checkpoint_full_failure",
            "projects.labels.approve_mapping_analyze_log"
      ],
      "src/components/importCenter/ExcelCsvImportSection.tsx": [
            "entityResolution.labels.review_matching",
            "entityResolution.labels.duplicate_rows",
            "entityResolution.labels.automatic_match",
            "entityResolution.labels.accept_suggested_match",
            "entityResolution.labels.choose_alternative",
            "entityResolution.labels.leave_unresolved",
            "entityResolution.labels.matched_entity",
            "entityResolution.labels.correct_data"
      ]
};
    for (const [file, keys] of Object.entries(surfaces)) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(source).toContain('useI18n');
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const consumed = new Set<string>();
      const literals: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't'
          && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) consumed.add(node.arguments[0].text);
        if (ts.isStringLiteral(node) || ts.isJsxText(node)) literals.push(node.text.trim());
        ts.forEachChild(node, visit);
      };
      visit(ast);
      for (const key of keys) {
        expect(consumed.has(key), `${file}: ${key}`).toBe(true);
        for (const dictionary of [arTranslations, enTranslations, urTranslations]) {
          expect(dictionary[key]?.trim().length, key).toBeGreaterThan(0);
        }
        expect(literals, key).not.toContain(arTranslations[key]);
      }
      expect(literals).not.toContain('تكرار:');
    }
  });

  it('TBC-B4-second: project and resolution anchors remain translated across all locales', () => {
    const surfaces: Record<string, string[]> = {
      "src/components/wizard/ProjectSetupWizard.tsx": [
            "projects.messages.canonical_data_loading",
            "projects.messages.changes_saved",
            "projects.labels.update_workspace_sync",
            "projects.labels.initialize_workspace_sync"
      ],
      "src/components/import/RosterMaterialResolutionLayer.tsx": [
            "entityResolution.labels.source_material_groups",
            "entityResolution.labels.approved_materials",
            "entityResolution.labels.materials_needing_resolution",
            "entityResolution.messages.all_materials_resolved",
            "entityResolution.messages.driver_truck_next_stage",
            "entityResolution.messages.confirm_cancel_import"
      ],
      "src/components/import/RosterCarrierResolutionLayer.tsx": [
            "entityResolution.messages.confirm_cancel_import"
      ],
      "src/components/import/RosterDriverTruckResolutionLayer.tsx": [
            "entityResolution.messages.confirm_cancel_import"
      ]
};
    for (const [file, keys] of Object.entries(surfaces)) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const consumed = new Set<string>();
      const literals: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't'
          && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) consumed.add(node.arguments[0].text);
        if (ts.isStringLiteral(node) || ts.isJsxText(node)) literals.push(node.text.trim());
        ts.forEachChild(node, visit);
      };
      visit(ast);
      for (const key of keys) {
        expect(consumed.has(key), `${file}: ${key}`).toBe(true);
        const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
        for (const dictionary of [arTranslations, enTranslations, urTranslations]) {
          expect(dictionary[key]?.trim().length, key).toBeGreaterThan(0);
          expect(placeholders(dictionary[key]), key).toEqual(placeholders(arTranslations[key]));
        }
        expect(literals, key).not.toContain(arTranslations[key]);
      }
    }
  });

  it('TBC-B4-third: workflow guidance and canonical refresh retry use translated labels', () => {
    const anchors = [
      ['src/components/wizard/ProjectSetupWizard.tsx', 'projects.labels.smart_import_workflow'],
      ['src/components/masterData/CarrierEditorModal.tsx', 'entityResolution.labels.refresh_data'],
    ] as const;
    for (const [file, key] of anchors) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(source).toContain(`t('${key}')`);
      expect(source).not.toContain(arTranslations[key]);
      for (const dictionary of [arTranslations, enTranslations, urTranslations]) {
        expect(dictionary[key]?.trim().length, key).toBeGreaterThan(0);
      }
    }
  });

  it('TBC-B4-fourth: review, commit, recovery and immutable editor anchors remain managed', () => {
    const surfaces: Record<string, string[]> = {
      "src/components/wizard/ProjectSetupWizard.tsx": [
            "entityResolution.messages.created_refresh_failed",
            "entityResolution.messages.already_committed",
            "projects.labels.add_carrier",
            "shared.actions.edit"
      ],
      "src/components/import/RosterMaterialResolutionLayer.tsx": [
            "entityResolution.labels.continue_driver_truck_review"
      ],
      "src/components/import/RosterDriverTruckResolutionLayer.tsx": [
            "entityResolution.messages.created_refresh_failed",
            "entityResolution.labels.continue_final_review",
            "entityResolution.labels.refresh_data"
      ],
      "src/components/import/RosterFinalReviewLayer.tsx": [
            "entityResolution.labels.total_records",
            "entityResolution.labels.ready_for_approval",
            "entityResolution.labels.rows_with_warnings",
            "entityResolution.labels.blocked_error_rows",
            "entityResolution.labels.carriers",
            "entityResolution.labels.trucks",
            "entityResolution.labels.approve_commit_import",
            "other.labels.materials_5",
            "other.labels.drivers_5"
      ],
      "src/components/import/RosterCommitResultLayer.tsx": [
            "entityResolution.labels.total_records",
            "entityResolution.messages.import_succeeded",
            "entityResolution.messages.import_partial",
            "entityResolution.messages.import_failed",
            "entityResolution.messages.import_no_changes",
            "entityResolution.labels.failed_rows",
            "entityResolution.labels.finish_import"
      ],
      "src/components/masterData/CarrierEditorModal.tsx": [
            "entityResolution.labels.edit_carrier",
            "entityResolution.labels.carrier_identity_immutable"
      ],
      "src/components/masterData/MaterialEditorModal.tsx": [
            "entityResolution.labels.material_code_immutable"
      ]
};
    for (const [file, keys] of Object.entries(surfaces)) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const consumed = new Set<string>();
      const literals: string[] = [];
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't'
          && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) consumed.add(node.arguments[0].text);
        if (ts.isStringLiteral(node) || ts.isJsxText(node)) literals.push(node.text.trim());
        ts.forEachChild(node, visit);
      };
      visit(ast);
      for (const key of keys) {
        expect(consumed.has(key), `${file}: ${key}`).toBe(true);
        for (const dictionary of [arTranslations, enTranslations, urTranslations]) {
          expect(dictionary[key]?.trim().length, key).toBeGreaterThan(0);
        }
        expect(literals, key).not.toContain(arTranslations[key]);
      }
    }
  });
});

describe('Batch 4 complete active presentation family', () => {
  const files = [
    'src/App.tsx',
    'src/components/FirestoreArchitectureView.tsx',
    'src/components/pricing/PricingEngineView.tsx',
    'src/components/admin/AdminConsoleView.tsx',
    'src/components/admin/DriverAccountBindingControl.tsx',
    'src/components/security/SecurityAuditView.tsx',
    'src/components/migration/LegacyMigrationView.tsx',
    'src/components/navigation/SystemToolsDrawer.tsx',
    'src/components/wizard/ProjectSetupWizard.tsx',
    'src/components/wizard/ProjectAccessView.tsx',
    'src/components/importCenter/ExcelCsvImportSection.tsx',
    'src/components/importCenter/GoogleSheetsImportSection.tsx',
    'src/components/import/RosterCarrierResolutionLayer.tsx',
    'src/components/import/RosterMaterialResolutionLayer.tsx',
    'src/components/import/RosterDriverTruckResolutionLayer.tsx',
    'src/components/import/RosterFinalReviewLayer.tsx',
    'src/components/import/RosterCommitResultLayer.tsx',
    'src/components/masterData/CarrierEditorModal.tsx',
    'src/components/masterData/MaterialEditorModal.tsx',
  ];
  // Verbatim schema identifiers, deployment metadata and examples are technical data, not UI prose.
  const technical = new Set([
    'CSV', 'XLS', 'XLSX', 'BLOCK 33', 'SETUP', 'READY_FOR_REVIEW', 'APPROVED', 'ACTIVE',
    'Multi-Project Logistics FSM', 'Region: europe-west2', 'ai-studio-qsaudiworkfollow...',
    'createdAt & createdBy', 'updatedAt & updatedBy', 'Output: ValidationResult (isValid, errors)',
    'tripId:', 'createdAt:', 'createdBy:', 'updatedAt:', 'updatedBy:', 'carrierSnapshot:', 'truckSnapshot:',
    'YYYY-MM-DD', '05xxxxxxxx', 'name@company.com', '1.6', 'ID:',
    'SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER', 'FINANCE_AUDITOR', 'VIEWER',
    'LEGACY_UNRESOLVED', '.md', '.xlsx', '.xls', '.csv', 'KB |',
    '(ticketId)', '(tripSerial)', '(shiftDate)', '(truckNo)', '(grossWeight)', '(tareWeight)', '(netWeight)', '(destNetWeight)',
    'No-Guess Pricing', 'Copy-on-Write Versioning', 'Trip Pricing Snapshot', 'SAR', 'v',
  ]);

  it('routes human JSX text and literal accessible labels through canonical translations', () => {
    const defects: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        // App's shell belongs to completed Batch 1; this gate covers only its system-tool views.
        if (file === 'src/App.tsx' && (ts.isJsxText(node) || ts.isStringLiteral(node))) {
          let insideTools = false;
          for (let parent: ts.Node | undefined = node.parent; parent; parent = parent.parent) {
            if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
              && /activeTab === '(RELATIONS|PRINCIPLES|DOCS)'/.test(parent.left.getText(ast))) insideTools = true;
          }
          if (!insideTools) return;
        }
        const literalAttribute = ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent)
          && ['title', 'placeholder', 'aria-label', 'alt'].includes(node.parent.name.getText(ast));
        if (ts.isJsxText(node) || literalAttribute) {
          const text = (node as ts.JsxText | ts.StringLiteral).text.replace(/\s+/g, ' ').trim();
          if (/\p{L}/u.test(text) && !technical.has(text)) {
            const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
            defects.push(`${file}:${line}: ${text}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
    expect(defects).toEqual([]);
  });

  it('keeps service metadata localization at the consumer and service text behind the presentation boundary', () => {
    const wizard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf8');
    const csv = fs.readFileSync(path.resolve(process.cwd(), 'src/components/importCenter/ExcelCsvImportSection.tsx'), 'utf8');
    expect(wizard).toContain('batch4LayerLabel(t, layer.id, layer.labelAr)');
    expect(wizard).toContain('batch4RosterStageLabel(t, def.stage, def.labelAr)');
    expect(wizard).toContain('batch4FieldLabel(t, opt.value, opt.labelAr)');
    expect(csv).toContain('batch4FieldLabel(t, String(opt.value), opt.labelAr)');
    expect(wizard).toContain('presentBatch4Message(syncNotice.text, t)');
    expect(wizard).toContain('<SetupReadinessPanel result={serverReadiness}');
    const readinessPanel = fs.readFileSync(path.resolve(process.cwd(), 'src/components/wizard/SetupReadinessPanel.tsx'), 'utf8');
    expect(readinessPanel).toContain('t(readinessBlockerKey(blocker.code))');
    expect(readinessPanel).not.toContain('blocker.message');
    expect(csv).toContain('presentBatch4Message(e.messageAr || e.message, t)');
    for (const service of ['src/services/projectSetupWorkflow.service.ts', 'src/services/import/rosterSmartImportWorkflow.service.ts']) {
      expect(fs.readFileSync(path.resolve(process.cwd(), service), 'utf8')).not.toMatch(/from\s+['"][^'"]*i18n/);
    }
  });
});

// Complete local text coverage for the residual offline/auth family, including the clean PWA gap.
describe('Residual offline and PWA translation construction', () => {
  const readSource = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const residualFiles = [
    'src/components/offline/OfflineIndicator.tsx',
    'src/components/offline/OutboxDrawer.tsx',
    'src/components/offline/ConflictResolutionModal.tsx',
    'src/components/offline/PWAInstallButton.tsx',
  ];
  it('rejects unmanaged multilingual JSX and accessible text across the complete residual family', () => {
    const failures: string[] = [];
    const technical = new Set(['PASSED', 'v']);
    for (const file of residualFiles) {
      const source = readSource(file);
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        const attribute = ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent)
          && ['title', 'aria-label', 'placeholder', 'alt'].includes(node.parent.name.getText(ast));
        if (ts.isJsxText(node) || attribute) {
          const text = (node as ts.JsxText | ts.StringLiteral).text.trim();
          if (/\p{L}/u.test(text) && !technical.has(text)) failures.push(file + ': ' + text);
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
    expect(failures).toEqual([]);
  });

  it('protects message boundaries and preserves installation and conflict action wiring', () => {
    const pwa = readSource('src/components/offline/PWAInstallButton.tsx');
    expect(pwa).toContain('onClick={install}');
    expect(pwa).toContain('if (isInstalled)');
    expect(pwa).toContain('if (isInstallable)');
    expect(pwa).toContain('if (isIOS)');
    expect(pwa).toContain('setShowIOSGuide(true)');
    const drawer = readSource('src/components/offline/OutboxDrawer.tsx');
    for (const expression of ['op.serverAck.messageAr', 'op.errorReason', 'conf.titleAr', 'conf.descriptionAr', 'd.fieldLabelAr', 'testCase.nameAr', 'testCase.details']) {
      expect(drawer).toContain('presentBatch4Message(' + expression + ', t)');
    }
    const modal = readSource('src/components/offline/ConflictResolutionModal.tsx');
    expect(modal).toContain('strategy: currentStrategy');
    expect(modal).toContain('justification: justification.trim()');
    expect(modal).toContain('conflictResolutionService.resolveConflict(conflict.conflictId');
    for (const file of ['src/components/auth/AuthButton.tsx', 'src/components/auth/AccountStatusGate.tsx']) {
      expect(readSource(file)).toContain('presentBatch4Message(authError, t)');
    }
  });
});


describe('P7-B3 semantic review translation boundary', () => {
  it('covers every semantic review label and rejects unmanaged JSX/accessibility text', () => {
    const file = 'src/components/import/RosterSemanticReview.tsx';
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const unmanaged: string[] = [];
    const visit = (node: ts.Node) => {
      const attr = ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent) && ['title', 'aria-label', 'placeholder', 'alt'].includes(node.parent.name.getText(ast));
      if (ts.isJsxText(node) || attr) { const text = (node as ts.JsxText | ts.StringLiteral).text.trim(); if (/\p{L}/u.test(text)) unmanaged.push(text); }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    expect(unmanaged).toEqual([]);
    const keys = Object.keys(enTranslations).filter(k => k.startsWith('intent.'));
    expect(keys).toHaveLength(38);
    expect(source).toContain("t('intent.sourceRows')");
    for (const key of keys) for (const dictionary of [arTranslations, enTranslations, urTranslations]) expect(dictionary[key]?.trim().length, key).toBeGreaterThan(0);
  });
});
