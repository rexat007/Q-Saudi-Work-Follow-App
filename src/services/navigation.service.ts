/**
 * BLOCK 81 — Navigation & Role-Based Access Control Assembly Service
 * 
 * Provides centralized routing, navigation items, role-aware visibility,
 * and strict route guards for all 9 system roles across the 4 primary application areas:
 * 1. FIELD OPERATIONS (Loading, Unloading, Supervision, Driver)
 * 2. PROJECTS (Project Wizard, Master Data)
 * 3. REPORTS (Field Reports, Central Dashboard)
 * 4. SYSTEM / DEVELOPER TOOLS (Security Audit, Migration, Console, Diagnostics, Specs)
 */

import { UserRole } from '../types/common';

export type PrimaryAreaId = 'FIELD_OPERATIONS' | 'PROJECTS' | 'REPORTS' | 'SYSTEM_TOOLS';

export type NavTabId = 
  | 'OPERATIONS_DASHBOARD'
  | 'REPORTS_ENGINE'
  | 'FIELD_OPERATIONS'
  | 'WIZARD'
  | 'MASTER_DATA'
  | 'SECURITY_AUDIT'
  | 'LEGACY_MIGRATION'
  | 'ADMIN_CONSOLE'
  | 'TRIP_ENGINE'
  | 'WORKSPACE_INTEGRATION'
  | 'EXCEPTION_ENGINE'
  | 'IMPORT_CENTER'
  | 'DATA_QUALITY'
  | 'PRICING_ENGINE'
  | 'FIRESTORE_ARCH'
  | 'RELATIONS'
  | 'PRINCIPLES'
  | 'DOCS';

export interface NavItemDef {
  id: NavTabId;
  area: PrimaryAreaId;
  titleAr: string;
  titleEn: string;
  badgeAr?: string;
  badgeEn?: string;
  badgeVariant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'neutral';
  icon: string;
  allowedRoles: UserRole[];
  descriptionAr: string;
  isPrimary: boolean;
}

export interface PrimaryAreaDef {
  id: PrimaryAreaId;
  titleAr: string;
  titleEn: string;
  icon: string;
  descriptionAr: string;
  allowedRoles: UserRole[];
}

export interface RoleProfileDef {
  role: UserRole;
  titleAr: string;
  titleEn: string;
  userNameAr: string;
  userNameEn: string;
  assignedProjectIds: string[];
  isRestricted: boolean;
  defaultTab: NavTabId;
  badgeColor: string;
}

// All 9 Authoritative System Roles
export const SYSTEM_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'PROJECT_ADMIN',
  'SUPERVISOR',
  'SITE_SUPERVISOR',
  'DISPATCHER',
  'SCALE_OPERATOR',
  'FINANCE_AUDITOR',
  'DRIVER',
  'VIEWER',
];

// Definition of the 4 Primary Application Areas
export const PRIMARY_AREAS: PrimaryAreaDef[] = [
  {
    id: 'FIELD_OPERATIONS',
    titleAr: 'العمليات الميدانية',
    titleEn: 'Field Operations',
    icon: 'Scale',
    descriptionAr: 'واجهات موازين التحميل، الاستلام، الإشراف الميداني، وشاشة السائق',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER', 'SCALE_OPERATOR', 'DRIVER'],
  },
  {
    id: 'PROJECTS',
    titleAr: 'المشاريع والبيانات الأساسية',
    titleEn: 'Projects & Master Data',
    icon: 'Building2',
    descriptionAr: 'معالج تهيئة المشاريع وإدارة الأساطيل، المقاولين، والمواد',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
  },
  {
    id: 'REPORTS',
    titleAr: 'التقارير ولوحة المؤشرات',
    titleEn: 'Reports & Dashboard',
    icon: 'LayoutDashboard',
    descriptionAr: 'محرك التقارير التفصيلية ولوحة القيادة التنفيذية المركزية',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER', 'FINANCE_AUDITOR', 'VIEWER'],
  },
  {
    id: 'SYSTEM_TOOLS',
    titleAr: 'أدوات النظام والمطورين',
    titleEn: 'System & Developer Tools',
    icon: 'ShieldCheck',
    descriptionAr: 'التدقيق الأمني، الترحيل القديم، لوحة الإدارة، محرك الاستثناءات، والمستندات',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER'],
  },
];

// Comprehensive Navigation Items Registry
export const NAV_ITEMS_REGISTRY: NavItemDef[] = [
  // 1. PROJECTS & MASTER DATA (SETUP)
  {
    id: 'WIZARD',
    area: 'PROJECTS',
    titleAr: 'تهيئة المشاريع (Project Wizard)',
    titleEn: 'Project Wizard',
    badgeAr: '7 خطوات',
    badgeEn: '7 Steps',
    badgeVariant: 'amber',
    icon: 'Building2',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'معالج إنشاء وتهيئة المشاريع الكبرى وسلاسل الإمداد',
    isPrimary: true,
  },
  {
    id: 'MASTER_DATA',
    area: 'PROJECTS',
    titleAr: 'البيانات الأساسية (Master Data)',
    titleEn: 'Master Data',
    badgeAr: '4 وحدات',
    badgeEn: '4 Units',
    badgeVariant: 'amber',
    icon: 'Boxes',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'إدارة الناقلين، الشاحنات، السائقين، وقوائم المواد المعتمدة',
    isPrimary: true,
  },

  // 2. FIELD OPERATIONS (OPERATE)
  {
    id: 'FIELD_OPERATIONS',
    area: 'FIELD_OPERATIONS',
    titleAr: 'المحطات الميدانية والموازين',
    titleEn: 'Field Workstations',
    badgeAr: 'ميداني',
    badgeEn: 'Field',
    badgeVariant: 'emerald',
    icon: 'Scale',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER', 'SCALE_OPERATOR', 'DRIVER'],
    descriptionAr: 'واجهات مشغلي الموازين والاستلام والإشراف الميداني والسائقين',
    isPrimary: true,
  },

  // 3. REPORTS & DASHBOARD (ANALYZE)
  {
    id: 'REPORTS_ENGINE',
    area: 'REPORTS',
    titleAr: 'محرك التقارير الميدانية (Reports)',
    titleEn: 'Field Reports Engine',
    badgeAr: '15 تقريراً',
    badgeEn: '15 Reports',
    badgeVariant: 'amber',
    icon: 'FileText',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER', 'FINANCE_AUDITOR', 'VIEWER'],
    descriptionAr: 'التقارير التشغيلية، تقارير الموازين والفروقات، والتسويات المالية',
    isPrimary: true,
  },
  {
    id: 'OPERATIONS_DASHBOARD',
    area: 'REPORTS',
    titleAr: 'لوحة القيادة التنفيذية (Dashboard)',
    titleEn: 'Executive Dashboard',
    badgeAr: '7 طبقات',
    badgeEn: '7 Layers',
    badgeVariant: 'emerald',
    icon: 'LayoutDashboard',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'FINANCE_AUDITOR', 'VIEWER'],
    descriptionAr: 'المؤشرات التنفيذية، تدفق الرحلات، مصفوفة المخاطر، وشاشة الحركة المباشرة',
    isPrimary: true,
  },

  // 4. SYSTEM / DEVELOPER TOOLS (SECONDARY SUITE)
  {
    id: 'SECURITY_AUDIT',
    area: 'SYSTEM_TOOLS',
    titleAr: 'التدقيق الأمني والحوكمة (Security Audit)',
    titleEn: 'Security Audit & Compliance',
    badgeAr: '16 نطاقاً',
    badgeEn: '16 Domains',
    badgeVariant: 'blue',
    icon: 'ShieldCheck',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'FINANCE_AUDITOR'],
    descriptionAr: 'فحص مصفوفة الصلاحيات، سياسات Firestore، وعزل المشاريع',
    isPrimary: false,
  },
  {
    id: 'LEGACY_MIGRATION',
    area: 'SYSTEM_TOOLS',
    titleAr: 'ترحيل البيانات القديمة (Legacy Migration)',
    titleEn: 'Legacy Migration',
    badgeAr: '20 عموداً',
    badgeEn: '20 Cols',
    badgeVariant: 'emerald',
    icon: 'FileSpreadsheet',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'معالجة واستيراد ملفات الإكسل القديمة ومطابقتها بالسجلات الرئيسية',
    isPrimary: false,
  },
  {
    id: 'ADMIN_CONSOLE',
    area: 'SYSTEM_TOOLS',
    titleAr: 'لوحة إدارة النظام (Admin Console)',
    titleEn: 'Admin Console',
    badgeAr: '11 قسماً',
    badgeEn: '11 Sections',
    badgeVariant: 'amber',
    icon: 'ShieldCheck',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'إدارة المستخدمين، قواعد التسعير، وإعدادات المنظومة المتقدمة',
    isPrimary: false,
  },
  {
    id: 'TRIP_ENGINE',
    area: 'SYSTEM_TOOLS',
    titleAr: 'محرك الرحلات وآلة الحالة (Trip Engine)',
    titleEn: 'Trip Engine FSM',
    badgeAr: '6 قواعد',
    badgeEn: '6 Rules',
    badgeVariant: 'emerald',
    icon: 'Truck',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'DISPATCHER'],
    descriptionAr: 'فحص دورة حياة الرحلات والانتقالات المسموحة في آلة الحالة',
    isPrimary: false,
  },
  {
    id: 'WORKSPACE_INTEGRATION',
    area: 'SYSTEM_TOOLS',
    titleAr: 'تكامل Google Workspace (Sheets & Drive)',
    titleEn: 'Google Workspace Integration',
    badgeAr: 'OAuth 2.0',
    badgeEn: 'OAuth 2.0',
    badgeVariant: 'emerald',
    icon: 'FileSpreadsheet',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'تصدير ومزامنة البيانات مع جداول Google Sheets ومجلدات Drive',
    isPrimary: false,
  },
  {
    id: 'EXCEPTION_ENGINE',
    area: 'SYSTEM_TOOLS',
    titleAr: 'محرك الاستثناءات (Exception Engine)',
    titleEn: 'Exception Engine',
    badgeAr: '12 نوعاً',
    badgeEn: '12 Types',
    badgeVariant: 'rose',
    icon: 'AlertOctagon',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR'],
    descriptionAr: 'تتبع وحل الاستثناءات الميدانية وفروقات الموازين والخصومات',
    isPrimary: false,
  },
  {
    id: 'IMPORT_CENTER',
    area: 'SYSTEM_TOOLS',
    titleAr: 'مركز الاستيراد الموحد (Import Center)',
    titleEn: 'Unified Import Center',
    badgeAr: '12 مرحلة',
    badgeEn: '12 Stages',
    badgeVariant: 'rose',
    icon: 'FileSpreadsheet',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'معالجة وتدقيق الشحنات المستوردة وحل الكيانات غير المعرفة',
    isPrimary: false,
  },
  {
    id: 'DATA_QUALITY',
    area: 'SYSTEM_TOOLS',
    titleAr: 'محرك جودة البيانات (Data Quality)',
    titleEn: 'Data Quality Engine',
    badgeAr: '8 مراحل',
    badgeEn: '8 Stages',
    badgeVariant: 'amber',
    icon: 'ShieldAlert',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'فحص الشحنات المكررة، أخطاء الوزن، والشذوذ الإحصائي',
    isPrimary: false,
  },
  {
    id: 'PRICING_ENGINE',
    area: 'SYSTEM_TOOLS',
    titleAr: 'محرك التسعير والعقود (Pricing Engine)',
    titleEn: 'Pricing Engine & Tests',
    badgeAr: '9 اختبارات',
    badgeEn: '9 Tests',
    badgeVariant: 'emerald',
    icon: 'Calculator',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'FINANCE_AUDITOR'],
    descriptionAr: 'حساب التعريفات، لقطات الأسعار الثابتة، وضريبة القيمة المضافة',
    isPrimary: false,
  },
  {
    id: 'FIRESTORE_ARCH',
    area: 'SYSTEM_TOOLS',
    titleAr: 'معمارية Firestore (13 نطاقاً)',
    titleEn: 'Firestore Architecture',
    badgeAr: 'مخطط',
    badgeEn: 'Schema',
    badgeVariant: 'neutral',
    icon: 'Database',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'VIEWER'],
    descriptionAr: 'استعراض مخططات المجموعات والحقول الأمنية وقواعد البيانات',
    isPrimary: false,
  },
  {
    id: 'RELATIONS',
    area: 'SYSTEM_TOOLS',
    titleAr: 'شبكة العلاقات (11 كياناً)',
    titleEn: 'Entity Relations Network',
    badgeAr: 'تفاعلي',
    badgeEn: 'Interactive',
    badgeVariant: 'neutral',
    icon: 'Share2',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'VIEWER'],
    descriptionAr: 'مخطط العلاقات والروابط بين المشاريع والشاحنات والرحلات',
    isPrimary: false,
  },
  {
    id: 'PRINCIPLES',
    area: 'SYSTEM_TOOLS',
    titleAr: 'المبادئ الـ 12 الإلزامية (The 12 Invariants)',
    titleEn: 'The 12 Invariant Principles',
    badgeAr: 'حوكمة',
    badgeEn: 'Governance',
    badgeVariant: 'neutral',
    icon: 'ShieldCheck',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'VIEWER'],
    descriptionAr: 'السقف الهندسي الحاكم لكامل المنظومة وسيادة الخادم والـ SSOT',
    isPrimary: false,
  },
  {
    id: 'DOCS',
    area: 'SYSTEM_TOOLS',
    titleAr: 'المستندات المعمارية والمواصفات (Docs)',
    titleEn: 'Architecture Specs & Docs',
    badgeAr: '7 ملفات',
    badgeEn: '7 Docs',
    badgeVariant: 'neutral',
    icon: 'BookOpen',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER', 'SCALE_OPERATOR', 'FINANCE_AUDITOR', 'VIEWER'],
    descriptionAr: 'التوثيق الفني والمواصفات المعمارية للإنتاج',
    isPrimary: false,
  },
];

// Predefined Simulator Profiles for the 9 Roles
export const ROLE_PROFILES: Record<UserRole, RoleProfileDef> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    titleAr: 'المشرف العام للنظام (Super Admin)',
    titleEn: 'Super Administrator',
    userNameAr: 'المهندس / عبد الرحمن السعدون (مدير العمليات العام)',
    userNameEn: 'Eng. Abdulrahman Al-Saadoun (Global Ops Director)',
    assignedProjectIds: ['ALL'],
    isRestricted: false,
    defaultTab: 'WIZARD',
    badgeColor: 'bg-stone-900 text-amber-400',
  },
  PROJECT_ADMIN: {
    role: 'PROJECT_ADMIN',
    titleAr: 'مدير المشروع (Project Admin)',
    titleEn: 'Project Administrator',
    userNameAr: 'المهندس / فهد الشمري (مدير موقع نيوم)',
    userNameEn: 'Eng. Fahad Al-Shammari (NEOM Project Admin)',
    assignedProjectIds: ['PRJ-NEOM-NORTH-01', 'PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'WIZARD',
    badgeColor: 'bg-indigo-900 text-indigo-200',
  },
  SUPERVISOR: {
    role: 'SUPERVISOR',
    titleAr: 'مشرف عمليات ميدانية (Field Supervisor)',
    titleEn: 'Field Operations Supervisor',
    userNameAr: 'الأستاذ / عبد الله الحربي (مشرف قطاع التحميل)',
    userNameEn: 'Mr. Abdullah Al-Harbi (Loading Operations Supervisor)',
    assignedProjectIds: ['PRJ-NEOM-NORTH-01', 'PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-emerald-900 text-emerald-200',
  },
  SITE_SUPERVISOR: {
    role: 'SITE_SUPERVISOR',
    titleAr: 'مشرف موقع تفريغ (Site Supervisor)',
    titleEn: 'Site Unloading Supervisor',
    userNameAr: 'المهندس / تركي الدوسري (مشرف موقع القدية)',
    userNameEn: 'Eng. Turki Al-Dossari (Qiddiya Site Supervisor)',
    assignedProjectIds: ['PRJ-QIDDIYA-EXP-03'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-teal-900 text-teal-200',
  },
  DISPATCHER: {
    role: 'DISPATCHER',
    titleAr: 'مرحل وموجه حركة (Dispatcher)',
    titleEn: 'Logistics Dispatcher',
    userNameAr: 'الأستاذ / ماجد العتيبي (غرفة التحكم والترحيل)',
    userNameEn: 'Mr. Majed Al-Otaibi (Control & Dispatch)',
    assignedProjectIds: ['PRJ-NEOM-NORTH-01'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-cyan-900 text-cyan-200',
  },
  SCALE_OPERATOR: {
    role: 'SCALE_OPERATOR',
    titleAr: 'مشغل ميزان ميداني (Scale Operator)',
    titleEn: 'Weighbridge Scale Operator',
    userNameAr: 'الأستاذ / سالم الغامدي (مشغل ميزان المحجر الشمالي)',
    userNameEn: 'Mr. Salem Al-Ghamdi (North Weighbridge Operator)',
    assignedProjectIds: ['PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-amber-900 text-amber-200',
  },
  FINANCE_AUDITOR: {
    role: 'FINANCE_AUDITOR',
    titleAr: 'مدقق مالي وتسويات (Finance Auditor)',
    titleEn: 'Financial Auditor',
    userNameAr: 'الأستاذ / عمر الشهري (مراقب الحسابات والتسويات)',
    userNameEn: 'Mr. Omar Al-Shehri (Financial Settlement Auditor)',
    assignedProjectIds: ['ALL'],
    isRestricted: false,
    defaultTab: 'REPORTS_ENGINE',
    badgeColor: 'bg-purple-900 text-purple-200',
  },
  DRIVER: {
    role: 'DRIVER',
    titleAr: 'سائق شاحنة (Driver)',
    titleEn: 'Truck Driver',
    userNameAr: 'الكابتن / أحمد الشريف (سائق - شاحنة أ ب ج 1234)',
    userNameEn: 'Capt. Ahmed Al-Sharif (Driver - Truck ABC 1234)',
    assignedProjectIds: ['PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-blue-900 text-blue-200',
  },
  VIEWER: {
    role: 'VIEWER',
    titleAr: 'مستعرض ومراقب (Read-Only Viewer)',
    titleEn: 'Read-Only Viewer',
    userNameAr: 'الأستاذ / راشد العنزي (مراقب خارجي)',
    userNameEn: 'Mr. Rashed Al-Enezi (External Auditor / Viewer)',
    assignedProjectIds: ['ALL'],
    isRestricted: false,
    defaultTab: 'OPERATIONS_DASHBOARD',
    badgeColor: 'bg-stone-800 text-stone-300',
  },
};

class NavigationService {
  /**
   * Checks if a specific tab is authorized for the given role.
   */
  public isTabAuthorizedForRole(tabId: NavTabId, role: UserRole): boolean {
    const item = NAV_ITEMS_REGISTRY.find(item => item.id === tabId);
    if (!item) return false;
    return item.allowedRoles.includes(role);
  }

  /**
   * Checks if a primary area is authorized for the given role.
   */
  public isAreaAuthorizedForRole(areaId: PrimaryAreaId, role: UserRole): boolean {
    const area = PRIMARY_AREAS.find(a => a.id === areaId);
    if (!area) return false;
    return area.allowedRoles.includes(role);
  }

  /**
   * Returns all authorized navigation items for a specific role.
   */
  public getAuthorizedTabs(role: UserRole): NavItemDef[] {
    return NAV_ITEMS_REGISTRY.filter(item => item.allowedRoles.includes(role));
  }

  /**
   * Returns authorized primary tabs for a role (visible in top persistent bar).
   */
  public getAuthorizedPrimaryTabs(role: UserRole): NavItemDef[] {
    return NAV_ITEMS_REGISTRY.filter(item => item.isPrimary && item.allowedRoles.includes(role));
  }

  /**
   * Returns authorized system/developer tools for a role.
   */
  public getAuthorizedSystemTools(role: UserRole): NavItemDef[] {
    return NAV_ITEMS_REGISTRY.filter(item => !item.isPrimary && item.allowedRoles.includes(role));
  }

  /**
   * Returns default tab for a role.
   */
  public getDefaultTabForRole(role: UserRole): NavTabId {
    return ROLE_PROFILES[role]?.defaultTab || 'OPERATIONS_DASHBOARD';
  }

  /**
   * Returns role profile definition.
   */
  public getRoleProfile(role: UserRole): RoleProfileDef {
    return ROLE_PROFILES[role] || ROLE_PROFILES.SUPER_ADMIN;
  }

  /**
   * Validates if a user role can perform operations in a specific Field Station tab:
   * 'LOADING_STATION' | 'UNLOADING_STATION' | 'SUPERVISION' | 'DRIVER_VIEW'
   */
  public isFieldStationAuthorized(stationTab: string, role: UserRole): boolean {
    switch (stationTab) {
      case 'LOADING_STATION':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'DISPATCHER', 'SCALE_OPERATOR'].includes(role);
      case 'UNLOADING_STATION':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'SCALE_OPERATOR'].includes(role);
      case 'SUPERVISION':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DISPATCHER'].includes(role);
      case 'DRIVER_VIEW':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR', 'DRIVER'].includes(role);
      default:
        return false;
    }
  }
}

export const navigationService = new NavigationService();
