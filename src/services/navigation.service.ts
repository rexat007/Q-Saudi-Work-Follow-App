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

export type SystemToolCategoryId = 'SYSTEM_ADMIN' | 'AUDIT_SECURITY' | 'OPERATIONS_SUPPORT' | 'DEVELOPER_MODE';

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
  category?: SystemToolCategoryId;
  titleAr: string;
  titleEn: string;
  badgeAr?: string;
  badgeEn?: string;
  badgeVariant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'neutral';
  icon: string;
  allowedRoles: UserRole[];
  descriptionAr: string;
  isPrimary: boolean;
  isDeveloperOnly?: boolean;
  isHighRisk?: boolean;
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

  // 4. PRODUCTION SYSTEM TOOLS (RATIONALIZED SUITE - EXACTLY 5 TOOLS)
  {
    id: 'ADMIN_CONSOLE',
    area: 'SYSTEM_TOOLS',
    category: 'SYSTEM_ADMIN',
    titleAr: 'لوحة إدارة النظام (Admin Console)',
    titleEn: 'Admin Console',
    badgeAr: '11 قسماً',
    badgeEn: '11 Sections',
    badgeVariant: 'amber',
    icon: 'ShieldCheck',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'إدارة المستخدمين، قواعد التسعير، وإعدادات المنظومة المتقدمة',
    isPrimary: false,
    isHighRisk: true,
  },
  {
    id: 'SECURITY_AUDIT',
    area: 'SYSTEM_TOOLS',
    category: 'AUDIT_SECURITY',
    titleAr: 'التدقيق الأمني والحوكمة (Security Audit)',
    titleEn: 'Security Audit & Compliance',
    badgeAr: '16 نطاقاً',
    badgeEn: '16 Domains',
    badgeVariant: 'blue',
    icon: 'ShieldCheck',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'FINANCE_AUDITOR'],
    descriptionAr: 'فحص مصفوفة الصلاحيات، سياسات Firestore، وعزل المشاريع',
    isPrimary: false,
    isHighRisk: true,
  },
  {
    id: 'EXCEPTION_ENGINE',
    area: 'SYSTEM_TOOLS',
    category: 'OPERATIONS_SUPPORT',
    titleAr: 'محرك الاستثناءات (Exception Engine)',
    titleEn: 'Exception Engine',
    badgeAr: '12 نوعاً',
    badgeEn: '12 Types',
    badgeVariant: 'rose',
    icon: 'AlertOctagon',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR'],
    descriptionAr: 'تتبع وحل الاستثناءات الميدانية وفروقات الموازين والخصومات',
    isPrimary: false,
    isHighRisk: true,
  },
  {
    id: 'IMPORT_CENTER',
    area: 'SYSTEM_TOOLS',
    category: 'OPERATIONS_SUPPORT',
    titleAr: 'مركز الاستيراد الموحد (Import Center)',
    titleEn: 'Unified Import Center',
    badgeAr: '12 مرحلة',
    badgeEn: '12 Stages',
    badgeVariant: 'rose',
    icon: 'FileSpreadsheet',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'معالجة وتدقيق الشحنات المستوردة وحل الكيانات غير المعرفة',
    isPrimary: false,
    isHighRisk: true,
  },
  {
    id: 'DATA_QUALITY',
    area: 'SYSTEM_TOOLS',
    category: 'OPERATIONS_SUPPORT',
    titleAr: 'محرك جودة البيانات (Data Quality)',
    titleEn: 'Data Quality Engine',
    badgeAr: '8 مراحل',
    badgeEn: '8 Stages',
    badgeVariant: 'amber',
    icon: 'ShieldAlert',
    allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    descriptionAr: 'فحص الشحنات المكررة، أخطاء الوزن، والشذوذ الإحصائي',
    isPrimary: false,
    isHighRisk: true,
  },
];

// Developer-Only System Tools Registry (Restricted Exclusively to SUPER_ADMIN)
export const DEVELOPER_TOOLS_REGISTRY: NavItemDef[] = [
  {
    id: 'TRIP_ENGINE',
    area: 'SYSTEM_TOOLS',
    category: 'DEVELOPER_MODE',
    titleAr: 'محرك الرحلات وآلة الحالة (Trip Engine)',
    titleEn: 'Trip Engine FSM',
    badgeAr: '6 قواعد',
    badgeEn: '6 Rules',
    badgeVariant: 'emerald',
    icon: 'Truck',
    allowedRoles: ['SUPER_ADMIN'],
    descriptionAr: 'فحص دورة حياة الرحلات والانتقالات المسموحة في آلة الحالة',
    isPrimary: false,
    isDeveloperOnly: true,
    isHighRisk: true,
  },
  {
    id: 'PRICING_ENGINE',
    area: 'SYSTEM_TOOLS',
    category: 'DEVELOPER_MODE',
    titleAr: 'محرك التسعير والعقود (Pricing Engine)',
    titleEn: 'Pricing Engine & Tests',
    badgeAr: '9 اختبارات',
    badgeEn: '9 Tests',
    badgeVariant: 'emerald',
    icon: 'Calculator',
    allowedRoles: ['SUPER_ADMIN'],
    descriptionAr: 'حساب التعريفات، لقطات الأسعار الثابتة، وضريبة القيمة المضافة',
    isPrimary: false,
    isDeveloperOnly: true,
    isHighRisk: true,
  },
  {
    id: 'DOCS',
    area: 'SYSTEM_TOOLS',
    category: 'DEVELOPER_MODE',
    titleAr: 'المستندات المعمارية والمواصفات (Docs)',
    titleEn: 'Architecture Specs & Docs',
    badgeAr: '7 ملفات',
    badgeEn: '7 Docs',
    badgeVariant: 'neutral',
    icon: 'BookOpen',
    allowedRoles: ['SUPER_ADMIN'],
    descriptionAr: 'التوثيق الفني، المخططات المعمارية، وشبكة العلاقات، والمبادئ الحاكمة',
    isPrimary: false,
    isDeveloperOnly: true,
    isHighRisk: true,
  },
];

// Predefined Simulator Profiles for the 9 Roles
export const ROLE_PROFILES: Record<UserRole, RoleProfileDef> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    titleAr: 'المشرف العام للنظام (Super Admin)',
    titleEn: 'Super Administrator',
    userNameAr: 'مدير النظام العام',
    userNameEn: 'System Administrator',
    assignedProjectIds: ['ALL'],
    isRestricted: false,
    defaultTab: 'WIZARD',
    badgeColor: 'bg-stone-900 text-amber-400',
  },
  PROJECT_ADMIN: {
    role: 'PROJECT_ADMIN',
    titleAr: 'مدير المشروع (Project Admin)',
    titleEn: 'Project Administrator',
    userNameAr: 'مدير المشروع',
    userNameEn: 'Project Administrator',
    assignedProjectIds: ['PRJ-NEOM-NORTH-01', 'PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'WIZARD',
    badgeColor: 'bg-indigo-900 text-indigo-200',
  },
  SUPERVISOR: {
    role: 'SUPERVISOR',
    titleAr: 'مشرف عمليات ميدانية (Field Supervisor)',
    titleEn: 'Field Operations Supervisor',
    userNameAr: 'مشرف عمليات ميدانية',
    userNameEn: 'Field Supervisor',
    assignedProjectIds: ['PRJ-NEOM-NORTH-01', 'PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-emerald-900 text-emerald-200',
  },
  SITE_SUPERVISOR: {
    role: 'SITE_SUPERVISOR',
    titleAr: 'مشرف موقع تفريغ (Site Supervisor)',
    titleEn: 'Site Unloading Supervisor',
    userNameAr: 'مشرف موقع تفريغ',
    userNameEn: 'Site Supervisor',
    assignedProjectIds: ['PRJ-QIDDIYA-EXP-03'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-teal-900 text-teal-200',
  },
  DISPATCHER: {
    role: 'DISPATCHER',
    titleAr: 'مرحل وموجه حركة (Dispatcher)',
    titleEn: 'Logistics Dispatcher',
    userNameAr: 'مرحل حافلات وشاحنات',
    userNameEn: 'Logistics Dispatcher',
    assignedProjectIds: ['PRJ-NEOM-NORTH-01'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-cyan-900 text-cyan-200',
  },
  SCALE_OPERATOR: {
    role: 'SCALE_OPERATOR',
    titleAr: 'مشغل ميزان ميداني (Scale Operator)',
    titleEn: 'Weighbridge Scale Operator',
    userNameAr: 'مشغل ميزان',
    userNameEn: 'Scale Operator',
    assignedProjectIds: ['PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-amber-900 text-amber-200',
  },
  FINANCE_AUDITOR: {
    role: 'FINANCE_AUDITOR',
    titleAr: 'مدقق مالي وتسويات (Finance Auditor)',
    titleEn: 'Financial Auditor',
    userNameAr: 'مدقق مالي',
    userNameEn: 'Financial Auditor',
    assignedProjectIds: ['ALL'],
    isRestricted: false,
    defaultTab: 'REPORTS_ENGINE',
    badgeColor: 'bg-purple-900 text-purple-200',
  },
  DRIVER: {
    role: 'DRIVER',
    titleAr: 'سائق شاحنة (Driver)',
    titleEn: 'Truck Driver',
    userNameAr: 'سائق شاحنة',
    userNameEn: 'Truck Driver',
    assignedProjectIds: ['PRJ-NEOM-001'],
    isRestricted: true,
    defaultTab: 'FIELD_OPERATIONS',
    badgeColor: 'bg-blue-900 text-blue-200',
  },
  VIEWER: {
    role: 'VIEWER',
    titleAr: 'مستعرض ومراقب (Read-Only Viewer)',
    titleEn: 'Read-Only Viewer',
    userNameAr: 'مستعرض للنظام',
    userNameEn: 'System Viewer',
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
    if (item) return item.allowedRoles.includes(role);

    const devItem = DEVELOPER_TOOLS_REGISTRY.find(item => item.id === tabId);
    if (devItem) return devItem.allowedRoles.includes(role);

    // Sub-views / Retired standalone routes preserve role authorization
    switch (tabId) {
      case 'LEGACY_MIGRATION':
      case 'WORKSPACE_INTEGRATION':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN'].includes(role);
      case 'FIRESTORE_ARCH':
      case 'PRINCIPLES':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN', 'VIEWER'].includes(role);
      case 'RELATIONS':
        return ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SUPERVISOR', 'VIEWER'].includes(role);
      default:
        return false;
    }
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
    const primaryAndProd = NAV_ITEMS_REGISTRY.filter(item => item.allowedRoles.includes(role));
    if (role === 'SUPER_ADMIN') {
      return [...primaryAndProd, ...DEVELOPER_TOOLS_REGISTRY];
    }
    return primaryAndProd;
  }

  /**
   * Returns authorized primary tabs for a role (visible in top persistent bar).
   */
  public getAuthorizedPrimaryTabs(role: UserRole): NavItemDef[] {
    return NAV_ITEMS_REGISTRY.filter(item => item.isPrimary && item.allowedRoles.includes(role));
  }

  /**
   * Returns authorized production system tools for a role (strictly max 5).
   */
  public getAuthorizedSystemTools(role: UserRole): NavItemDef[] {
    return NAV_ITEMS_REGISTRY.filter(item => !item.isPrimary && !item.isDeveloperOnly && item.allowedRoles.includes(role));
  }

  /**
   * Returns developer tools (strictly 3 tools, restricted exclusively to SUPER_ADMIN).
   */
  public getAuthorizedDeveloperTools(role: UserRole): NavItemDef[] {
    if (role === 'SUPER_ADMIN') {
      return DEVELOPER_TOOLS_REGISTRY;
    }
    return [];
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
