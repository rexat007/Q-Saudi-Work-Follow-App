import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Truck, 
  Calculator, 
  Layers, 
  UserCheck, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  AlertOctagon,
  FileText, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  WifiOff, 
  Code, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  BookOpen,
  Boxes,
  Share2,
  Lock,
  ShieldAlert,
  FileSpreadsheet,
  LayoutDashboard,
  Scale,
  Sparkles,
  Menu,
  Sliders,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ENTITY_RELATIONS, MANDATORY_PRINCIPLES, EntityRelationInfo } from './entityRelations';
import { ARCHITECTURE_DOCS, DocItem } from './docsData';
import FirestoreArchitectureView from './components/FirestoreArchitectureView';
import { ProjectSetupWizard } from './components/wizard/ProjectSetupWizard';
import { PricingEngineView } from './components/pricing/PricingEngineView';
import { MasterDataView } from './components/masterData/MasterDataView';
import { DataQualityView } from './components/dataQuality/DataQualityView';
import { ImportCenterView } from './components/importCenter/ImportCenterView';
import { TripEngineView } from './components/TripEngineView';
import { FieldOperationsView, FieldTab } from './components/field/FieldOperationsView';
import { ReportsEngineView } from './components/reports/ReportsEngineView';
import { OperationsDashboardView } from './components/dashboard/OperationsDashboardView';
import { ExceptionEngineView } from './components/exceptionEngine/ExceptionEngineView';
import { WorkspaceIntegrationView } from './components/workspace/WorkspaceIntegrationView';
import { AdminConsoleView } from './components/admin/AdminConsoleView';
import { LegacyMigrationView } from './components/migration/LegacyMigrationView';
import { SecurityAuditView } from './components/security/SecurityAuditView';
import { AuthButton } from './components/auth/AuthButton';
import { PWAInstallButton } from './components/offline/PWAInstallButton';
import { OfflineIndicator } from './components/offline/OfflineIndicator';
import { OutboxDrawer } from './components/offline/OutboxDrawer';
import { SystemToolsDrawer } from './components/navigation/SystemToolsDrawer';
import { MobileNavDrawer } from './components/navigation/MobileNavDrawer';
import { UnauthorizedBanner } from './components/navigation/UnauthorizedBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { outboxService } from './services/offline/outbox.service';
import { conflictResolutionService } from './services/offline/conflictResolution.service';
import { Wifi, Inbox } from 'lucide-react';
import { useI18n } from './i18n';
import { LanguageSwitcher } from './components/i18n/LanguageSwitcher';
import { 
  NavTabId, 
  navigationService, 
  SYSTEM_ROLES, 
  ROLE_PROFILES 
} from './services/navigation.service';
import { UserRole } from './types/common';
import { useAuth } from './firebase/authContext';

export default function App() {
  const { direction, t } = useI18n();
  const isRtl = direction === 'rtl';
  const { user } = useAuth();

  // Role and Navigation state
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [activeTab, setActiveTab] = useState<NavTabId>('OPERATIONS_DASHBOARD');
  const [isSystemToolsOpen, setIsSystemToolsOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Entities & Docs state for Secondary Tools
  const [selectedEntityId, setSelectedEntityId] = useState<string>('Trip');
  const [selectedDocId, setSelectedDocId] = useState<string>('architecture');

  // Offline-first PWA and Outbox states
  const [isOutboxOpen, setIsOutboxOpen] = useState<boolean>(false);
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [conflictCount, setConflictCount] = useState<number>(0);

  // Polling for offline queue and conflicts
  useEffect(() => {
    const updateCount = async () => {
      try {
        const [ops, confs] = await Promise.all([
          outboxService.getOperations(),
          conflictResolutionService.getConflicts(),
        ]);
        const pending = ops.filter(o => o.status === 'PENDING' || o.status === 'FAILED' || o.status === 'SENDING').length;
        const openConflicts = confs.filter(c => c.status === 'OPEN').length;
        setPendingCount(pending);
        setConflictCount(openConflicts);
      } catch (e) {
        // ignore
      }
    };
    updateCount();
    const interval = setInterval(updateCount, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle role change and route guard check
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (!navigationService.isTabAuthorizedForRole(activeTab, newRole)) {
      const defaultTab = navigationService.getDefaultTabForRole(newRole);
      setActiveTab(defaultTab);
    }
  };

  const roleProfile = navigationService.getRoleProfile(currentRole);
  const authorizedPrimaryTabs = navigationService.getAuthorizedPrimaryTabs(currentRole);
  const authorizedTools = navigationService.getAuthorizedSystemTools(currentRole);
  const isCurrentTabAuthorized = navigationService.isTabAuthorizedForRole(activeTab, currentRole);

  const selectedEntity = ENTITY_RELATIONS.find(e => e.id === selectedEntityId) || ENTITY_RELATIONS[6]; // Trip by default
  const selectedDoc = ARCHITECTURE_DOCS.find(d => d.id === selectedDocId) || ARCHITECTURE_DOCS[0];

  const getEntityIcon = (id: string) => {
    switch (id) {
      case 'Project': return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'Carrier': return <Building2 className="w-5 h-5 text-amber-600" />;
      case 'Pricing Rule': return <Calculator className="w-5 h-5 text-emerald-600" />;
      case 'Material': return <Layers className="w-5 h-5 text-orange-600" />;
      case 'Truck': return <Truck className="w-5 h-5 text-cyan-600" />;
      case 'Driver': return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'Trip': return <Navigation className="w-5 h-5 text-red-600" />;
      case 'Trip Event': return <Clock className="w-5 h-5 text-violet-600" />;
      case 'Exception': return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'Audit Log': return <FileText className="w-5 h-5 text-slate-700" />;
      case 'Sync Operation': return <RefreshCw className="w-5 h-5 text-teal-600" />;
      default: return <Boxes className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDocIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'Database': return <Database className="w-4 h-4 text-blue-500" />;
      case 'Code': return <Code className="w-4 h-4 text-emerald-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'WifiOff': return <WifiOff className="w-4 h-4 text-rose-500" />;
      case 'Calculator': return <Calculator className="w-4 h-4 text-teal-500" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTabNavIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="w-4 h-4 text-amber-500" />;
      case 'Building2': return <Building2 className="w-4 h-4 text-indigo-500" />;
      case 'Boxes': return <Boxes className="w-4 h-4 text-amber-500" />;
      case 'LayoutDashboard': return <LayoutDashboard className="w-4 h-4 text-emerald-500" />;
      case 'FileText': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <Boxes className="w-4 h-4 text-stone-500" />;
    }
  };

  // Determine initial field tab for role
  const getFieldInitialTab = (role: UserRole): FieldTab => {
    switch (role) {
      case 'DRIVER': return 'DRIVER_VIEW';
      case 'SCALE_OPERATOR': return 'LOADING_STATION';
      case 'SITE_SUPERVISOR': return 'UNLOADING_STATION';
      case 'SUPERVISOR': return 'SUPERVISION';
      case 'DISPATCHER': return 'LOADING_STATION';
      default: return 'LOADING_STATION';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col antialiased" dir={direction}>
      {/* Top Application Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand & Mobile Menu Toggle */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Hamburger */}
              <button
                id="btn-mobile-nav-toggle"
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="القائمة الرئيسية"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-black text-lg shadow-xs">
                  Q
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold tracking-tight text-stone-900">
                      Q Saudi Work Follow
                    </h1>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Enterprise Architecture
                    </span>
                  </div>
                  <p className="hidden md:block text-[11px] text-stone-500 font-medium truncate max-w-xs">
                    {t("navigation.labels.projects")}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Desktop Persistent Navigation Tabs */}
            <div className="hidden lg:flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200/80 max-w-2xl overflow-x-auto [scrollbar-width:none]">
              {authorizedPrimaryTabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id.toLowerCase().replace(/_/g, '-')}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    {getTabNavIcon(tab.icon)}
                    <span>{tab.titleAr}</span>
                    {tab.badgeAr && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
                      }`}>
                        {tab.badgeAr}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* System / Developer Tools Trigger Button */}
              {authorizedTools.length > 0 && (
                <button
                  id="tab-system-tools-trigger"
                  onClick={() => setIsSystemToolsOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    !authorizedPrimaryTabs.some(t => t.id === activeTab)
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'text-indigo-800 hover:text-indigo-950 hover:bg-indigo-100/70'
                  }`}
                  title="أدوات التدقيق، الترحيل، والمطورين"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>أدوات النظام</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-200 text-indigo-950">
                    {authorizedTools.length}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Role Switcher, Language, Outbox & Auth */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Active Role Selector / Simulator */}
              <div className="relative flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <select
                    id="header-role-selector"
                    value={currentRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="bg-transparent text-stone-900 font-bold font-mono text-xs focus:outline-hidden cursor-pointer"
                    title="تبديل الصلاحية النشطة"
                  >
                    {SYSTEM_ROLES.map((role) => (
                      <option key={role} value={role} className="bg-white text-stone-900 font-sans">
                        {role} ({ROLE_PROFILES[role].titleAr.split('(')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Outbox & Network Status Pill */}
              <button
                id="header-outbox-btn"
                onClick={() => setIsOutboxOpen(true)}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                  isOnline 
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900' 
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950 animate-pulse'
                }`}
                title={t("navigation.status.txt_4c0b8d")}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-700" />}
                <Inbox className="w-3 h-3 text-stone-500" />
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  pendingCount > 0 ? 'bg-amber-500 text-white font-bold' : 'bg-stone-200 text-stone-700'
                }`}>
                  {pendingCount}
                </span>
              </button>

              {/* Conflict Alert Pill */}
              {conflictCount > 0 && (
                <button
                  id="header-conflicts-btn"
                  onClick={() => setIsOutboxOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 border border-purple-400 text-purple-950 shadow-2xs animate-pulse transition-all"
                  title={t("navigation.labels.txt_10324c")}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                  <span>{conflictCount} تعارض</span>
                </button>
              )}

              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* Firebase Authentication Button */}
              <AuthButton />
            </div>
          </div>
        </div>

        {/* Sub-Header: Active Profile & Isolation Scope Ribbon */}
        <div className="bg-stone-900 text-white py-1.5 px-4 text-[11px] border-t border-stone-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-stone-300">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>المستخدم النشط:</span>
                <strong className="text-white font-bold">{roleProfile.userNameAr}</strong>
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-300">
                <span>نطاق المشاريع:</span>{' '}
                <strong className="text-amber-300 font-mono">
                  {roleProfile.assignedProjectIds.join(', ')}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-stone-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>عزل المشاريع صارم (Multi-Tenant Isolation)</span>
              </span>
              <span className="hidden md:inline text-stone-600">•</span>
              <span className="hidden md:inline">Server-Authoritative SSOT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Strict Route Guards */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Route Guard Enforcement: If activeTab is forbidden for currentRole */}
        {!isCurrentTabAuthorized ? (
          <UnauthorizedBanner
            requestedTab={activeTab}
            currentRole={currentRole}
            onRedirectToDefault={() => {
              const defTab = navigationService.getDefaultTabForRole(currentRole);
              setActiveTab(defTab);
            }}
          />
        ) : (
          <>
            {/* ================= TAB: OPERATIONS DASHBOARD (STRICT AUTHORIZATION, 7 LAYERS) ================= */}
            {activeTab === 'OPERATIONS_DASHBOARD' && (
              <OperationsDashboardView />
            )}

            {/* ================= TAB: REPORTS ENGINE (OPERATIONAL, WEIGHBRIDGE, SETTLEMENT, INGESTION) ================= */}
            {activeTab === 'REPORTS_ENGINE' && (
              <ReportsEngineView />
            )}

            {/* ================= TAB: FIELD OPERATIONS (LOADING, UNLOADING, SUPERVISION, DRIVER) ================= */}
            {activeTab === 'FIELD_OPERATIONS' && (
              <FieldOperationsView 
                initialTab={getFieldInitialTab(currentRole)}
                initialRole={currentRole}
              />
            )}

            {/* ================= TAB: PROJECT SETUP WIZARD (7 STEPS) ================= */}
            {activeTab === 'WIZARD' && (
              <ProjectSetupWizard />
            )}

            {/* ================= TAB: MASTER DATA MODULES (CARRIERS, TRUCKS, DRIVERS, MATERIALS) ================= */}
            {activeTab === 'MASTER_DATA' && (
              <MasterDataView />
            )}

            {/* ================= TAB: SECURITY AUDIT & COMPLIANCE (16 DOMAINS & EXHAUSTIVE RBAC) ================= */}
            {activeTab === 'SECURITY_AUDIT' && (
              <SecurityAuditView />
            )}

            {/* ================= TAB: LEGACY MIGRATION (20 COLS, PREVIEW-FIRST, MASTER MATCHING) ================= */}
            {activeTab === 'LEGACY_MIGRATION' && (
              <LegacyMigrationView />
            )}

            {/* ================= TAB: ADMIN CONSOLE (11 SECTIONS & VERSIONED PRICING RULES) ================= */}
            {activeTab === 'ADMIN_CONSOLE' && (
              <AdminConsoleView />
            )}

            {/* ================= TAB: TRIP ENGINE (6 RULES & SERVER SETTLEMENT) ================= */}
            {activeTab === 'TRIP_ENGINE' && (
              <TripEngineView />
            )}

            {/* ================= TAB: GOOGLE WORKSPACE (SHEETS & DRIVE PROJECTION) ================= */}
            {activeTab === 'WORKSPACE_INTEGRATION' && (
              <WorkspaceIntegrationView />
            )}

            {/* ================= TAB: EXCEPTION ENGINE (12 TYPES, 4 STATUSES, & AUDIT TRAIL) ================= */}
            {activeTab === 'EXCEPTION_ENGINE' && (
              <ExceptionEngineView />
            )}

            {/* ================= TAB: IMPORT CENTER (12-STAGE PIPELINE) ================= */}
            {activeTab === 'IMPORT_CENTER' && (
              <ImportCenterView />
            )}

            {/* ================= TAB: DATA QUALITY ENGINE (8-STAGE PIPELINE) ================= */}
            {activeTab === 'DATA_QUALITY' && (
              <DataQualityView />
            )}

            {/* ================= TAB: PRICING ENGINE & AUTOMATED TESTS ================= */}
            {activeTab === 'PRICING_ENGINE' && (
              <PricingEngineView />
            )}

            {/* ================= TAB: FIRESTORE ARCHITECTURE & DOMAIN LAYERS ================= */}
            {activeTab === 'FIRESTORE_ARCH' && (
              <FirestoreArchitectureView />
            )}

            {/* ================= TAB: RELATIONSHIPS EXPLORER ================= */}
            {activeTab === 'RELATIONS' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-indigo-600" />
                        <span>{t("navigation.labels.txt_4df8c5")}</span>
                      </h2>
                      <p className="text-xs text-stone-500 mt-1">
                        {t("navigation.labels.txt_23bdd6")}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-stone-400 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/60">
                      {t("navigation.labels.txt_46b695")}<strong className="text-stone-700">Multi-Project Logistics FSM</strong>
                    </div>
                  </div>

                  {/* Entity Pills Carousel/Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-stone-100">
                    {ENTITY_RELATIONS.map(entity => {
                      const isSelected = entity.id === selectedEntityId;
                      return (
                        <button
                          key={entity.id}
                          id={`entity-btn-${entity.id}`}
                          onClick={() => setSelectedEntityId(entity.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl text-right transition-all border ${
                            isSelected 
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                              : 'bg-stone-50/70 hover:bg-stone-100/80 text-stone-700 border-stone-200/70'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-stone-800' : 'bg-white shadow-xs'}`}>
                            {getEntityIcon(entity.id)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{entity.nameEn}</div>
                            <div className={`text-[10px] truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                              {entity.nameAr.split(' ')[0]}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Entity Deep-Dive Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Entity Definition & Rules */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-stone-100 rounded-xl">
                            {getEntityIcon(selectedEntity.id)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                              {selectedEntity.category}
                            </span>
                            <h3 className="text-lg font-bold text-stone-900 mt-1">
                              {selectedEntity.nameAr}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-stone-600 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                        {selectedEntity.shortDescAr}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t("navigation.labels.txt_777008")}</span>
                          </h4>
                          <p className="text-xs text-stone-600 leading-normal">
                            {selectedEntity.roleInSystemAr}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-blue-600" />
                            <span>{t("navigation.labels.txt_41e146")}</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedEntity.keyAttributes.map((attr, idx) => (
                              <span key={idx} className="font-mono text-[11px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200/60">
                                {attr}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-100">
                      <h4 className="text-xs font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t("navigation.labels.txt_4ada99")}</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedEntity.rulesEnforcedAr.map((rule, idx) => (
                          <li key={idx} className="text-xs text-stone-600 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Direct Domain Connections */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-indigo-600" />
                        <span>الارتباطات المباشرة مع الكيانات الأخرى في النظام ({selectedEntity.relationships.length})</span>
                      </h3>
                      <span className="text-xs text-stone-400">
                        {t("navigation.labels.txt_5dc573")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {selectedEntity.relationships.map((rel, idx) => {
                        const targetEntity = ENTITY_RELATIONS.find(e => e.id === rel.target);
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedEntityId(rel.target)}
                            className="group p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:bg-stone-50 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 rounded bg-white border border-stone-200">
                                    {getEntityIcon(rel.target)}
                                  </div>
                                  <span className="text-xs font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">
                                    {targetEntity ? targetEntity.nameAr : rel.target}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {rel.type}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                {rel.descAr}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-stone-200/40 flex items-center justify-end text-[10px] font-bold text-stone-400 group-hover:text-indigo-600 gap-1 transition-colors">
                              <span>استعراض كيان {rel.target}</span>
                              <ChevronLeft className="w-3 h-3" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Architecture Context Banner */}
                    <div className="mt-6 p-4 rounded-xl bg-stone-900 text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-amber-400 mb-0.5">
                          {t("navigation.labels.txt_6dd618")}
                        </div>
                        <div className="text-xs text-stone-300">
                          {t("navigation.labels.txt_791f1b")}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('DOCS');
                          setSelectedDocId('architecture');
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{t("navigation.labels.view")}</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: THE 12 INVARIANT PRINCIPLES ================= */}
            {activeTab === 'PRINCIPLES' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                  <div className="max-w-3xl">
                    <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>{t("navigation.labels.txt_4c8195")}</span>
                    </h2>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {t("navigation.labels.txt_17c5e1")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MANDATORY_PRINCIPLES.map(principle => (
                    <div 
                      key={principle.num}
                      className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="w-7 h-7 rounded-lg bg-stone-900 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                            #{principle.num}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                            INVARIANT RULE
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-stone-900 mb-2">
                          {principle.title}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {principle.desc}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("navigation.labels.txt_c37ba7")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB: SPECIFICATION DOCUMENTS VIEWER ================= */}
            {activeTab === 'DOCS' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Documents List */}
                <div className="lg:col-span-1 space-y-2">
                  <div className="bg-white rounded-xl border border-stone-200 p-3 shadow-xs">
                    <div className="text-xs font-bold text-stone-900 px-2 py-1 mb-1">
                      {t("navigation.labels.txt_8cf69f")}
                    </div>
                    <div className="space-y-1">
                      {ARCHITECTURE_DOCS.map(doc => {
                        const isSelected = doc.id === selectedDocId;
                        return (
                          <button
                            key={doc.id}
                            id={`doc-nav-${doc.id}`}
                            onClick={() => setSelectedDocId(doc.id)}
                            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                              isSelected 
                                ? 'bg-stone-900 text-white shadow-xs' 
                                : 'text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getDocIcon(doc.iconName)}
                              <span className="truncate">{doc.titleAr}</span>
                            </div>
                            <span className={`font-mono text-[10px] shrink-0 ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
                              .md
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document Summary Pill */}
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 text-xs text-stone-600">
                    <div className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-500" />
                      <span>{t("navigation.labels.txt_72b405")}</span>
                    </div>
                    <p className="leading-relaxed">
                      {selectedDoc.summaryAr}
                    </p>
                    <div className="mt-3 pt-2 border-t border-stone-200/60 font-mono text-[11px] text-stone-500">
                      المسار: {selectedDoc.filename}
                    </div>
                  </div>
                </div>

                {/* Document Reader Main Panel */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-stone-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                          {selectedDoc.filename}
                        </span>
                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Production Ready Spec
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-stone-900">
                        {selectedDoc.titleAr} ({selectedDoc.titleEn})
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-500">
                        {t("navigation.labels.txt_3a0110")}
                      </span>
                    </div>
                  </div>

                  {/* Markdown Display */}
                  <div className="prose prose-stone max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-p:text-xs prose-p:leading-relaxed prose-li:text-xs prose-code:font-mono prose-code:text-xs prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:p-4 prose-pre:rounded-xl">
                    <ReactMarkdown>
                      {selectedDoc.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Clean Technical Production Footer */}
      <footer className="bg-white border-t border-stone-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">Q Saudi Work Follow</span>
            <span>•</span>
            <span>{t("navigation.labels.txt_276201")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Firestore SSOT</span>
            <span>•</span>
            <span>Google Sheets Projection</span>
            <span>•</span>
            <span>Offline-First (IndexedDB)</span>
          </div>
        </div>
      </footer>

      {/* Floating Offline Status Pill & Sync Banner */}
      <OfflineIndicator onOpenOutbox={() => setIsOutboxOpen(true)} />

      {/* Outbox Drawer (Operations Queue, Manual Sync, Network Simulator) */}
      <OutboxDrawer isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />

      {/* Secondary System & Developer Tools Drawer */}
      <SystemToolsDrawer
        isOpen={isSystemToolsOpen}
        onClose={() => setIsSystemToolsOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
        }}
        currentRole={currentRole}
      />

      {/* Mobile & Tablet Slide-Over Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
        }}
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        onOpenSystemTools={() => setIsSystemToolsOpen(true)}
        onOpenOutbox={() => setIsOutboxOpen(true)}
        isOnline={isOnline}
        pendingOutboxCount={pendingCount}
      />
    </div>
  );
}
