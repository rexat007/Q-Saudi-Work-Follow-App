import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  ShieldAlert, 
  Filter, 
  RotateCcw, 
  Building2, 
  Calendar, 
  Truck, 
  Layers, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  AlertTriangle, 
  Banknote, 
  Scale, 
  Activity, 
  Search, 
  X, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  Radio
} from 'lucide-react';
import { 
  DashboardFilterParams, 
  UserSecurityProfile 
} from '../../types/dashboard';
import { 
  dashboardService
} from '../../services/dashboard.service';
import { WidgetFilterBar } from './WidgetFilterBar';
import { AuthUserContext } from '../../types/common';
import { useI18n } from '../../i18n';
import { offlineCacheService } from '../../services/offline/offlineCache.service';
import { projectProvisioningService } from '../../services/projectProvisioning.service';
import { projectFleetReadModelService } from '../../services/projectFleetReadModel.service';
import { projectRepository } from '../../repositories/project.repository';
import { indexedDBService } from '../../services/offline/indexedDB.service';
import { TripRecord } from '../../types/tripEngine';
import { ProjectEntity, CarrierEntity, MaterialEntity, TruckEntity, DriverEntity } from '../../types/entities';

export interface OperationsDashboardViewProps {
  authContext?: AuthUserContext;
}

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({ authContext }) => {
  const { t } = useI18n();
  // 1. Canonical User Security Profile & Project Authorization derived from session
  const activeProfile: UserSecurityProfile = useMemo(() => {
    if (!authContext) {
      return {
        userId: 'USR-OPERATIONS',
        userNameAr: 'مدير العمليات المركزية',
        roleTitleAr: 'إدارة العمليات المركزية',
        role: 'SUPER_ADMIN',
        authorizedProjectIds: ['ALL'],
        isRestricted: false,
      };
    }
    const isSuperAdmin = authContext.role === 'SUPER_ADMIN' || authContext.email === 'saudiali044@gmail.com';
    const isProjectAdmin = authContext.role === 'PROJECT_ADMIN';
    const isSiteSupervisor = authContext.role === 'SITE_SUPERVISOR';
    const isAuditor = (authContext.role as string) === 'FINANCE_AUDITOR' || (authContext.role as string) === 'AUDITOR';

    let role: UserSecurityProfile['role'] = 'SUPER_ADMIN';
    if (isSuperAdmin) role = 'SUPER_ADMIN';
    else if (isProjectAdmin) role = 'PROJECT_ADMIN';
    else if (isSiteSupervisor) role = 'SITE_SUPERVISOR';
    else if (isAuditor) role = 'AUDITOR';
    else role = 'PROJECT_ADMIN';

    const authorizedProjects = isSuperAdmin
      ? ['ALL']
      : (authContext.assignedProjectIds && authContext.assignedProjectIds.length > 0
          ? authContext.assignedProjectIds
          : []);

    return {
      userId: authContext.userId,
      userNameAr: authContext.displayName || 'مستخدم النظام',
      roleTitleAr: authContext.displayName || authContext.role,
      role,
      authorizedProjectIds: authorizedProjects,
      isRestricted: !isSuperAdmin,
    };
  }, [authContext]);
  
  // Canonical State from Repositories / IndexedDB
  const [canonicalProjects, setCanonicalProjects] = useState<ProjectEntity[]>([]);
  const [canonicalCarriers, setCanonicalCarriers] = useState<CarrierEntity[]>([]);
  const [canonicalMaterials, setCanonicalMaterials] = useState<MaterialEntity[]>([]);
  const [canonicalTrucks, setCanonicalTrucks] = useState<TruckEntity[]>([]);
  const [canonicalDrivers, setCanonicalDrivers] = useState<DriverEntity[]>([]);
  const [canonicalTrips, setCanonicalTrips] = useState<TripRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadCanonicalData = async () => {
      try {
        // 1. Projects
        let prjs = await projectRepository.listAll().catch(() => []);
        if (!prjs || prjs.length === 0) {
          prjs = await offlineCacheService.getProjects().catch(() => []);
        }

        const targetProjects = prjs.map(p => p.projectId);
        let crs: CarrierEntity[] = [];
        let mats: MaterialEntity[] = [];
        let trks: TruckEntity[] = [];
        let drvs: DriverEntity[] = [];

        try {
          // ONLINE: Canonical Authority
          const [carrierLists, materialLists, fleetModels] = await Promise.all([
            Promise.all(targetProjects.map(pId => projectProvisioningService.listProjectCarriers(pId).catch(() => []))),
            Promise.all(targetProjects.map(pId => projectProvisioningService.listProjectMaterials(pId).catch(() => []))),
            Promise.all(targetProjects.map(pId => projectFleetReadModelService.getProjectFleetReadModel(pId).catch(() => null))),
          ]);
          crs = carrierLists.flat() as any;
          mats = materialLists.flat() as any;

          const fleetRows = fleetModels.filter(Boolean).flatMap(f => f!.rows);
          trks = fleetRows.map(r => ({
            truckId: r.truckId,
            plate: r.plateNumber,
            carrierId: r.carrierId,
            status: 'ACTIVE',
            isActive: true,
          })) as any;
          drvs = fleetRows.filter(r => r.driverId).map(r => ({
            driverId: r.driverId!,
            name: r.driverName || r.driverId!,
            carrierId: r.carrierId,
            status: 'ACTIVE',
            isActive: true,
          })) as any;
        } catch {
          // OFFLINE FALLBACK: Last known canonical IndexedDB snapshot
          const [cachedCrs, cachedMats, cachedTrks, cachedDrvs] = await Promise.all([
            offlineCacheService.getCarriers().catch(() => []),
            offlineCacheService.getMaterials().catch(() => []),
            offlineCacheService.getTrucks().catch(() => []),
            offlineCacheService.getDrivers().catch(() => []),
          ]);
          crs = cachedCrs.map(c => ({
            carrierId: c.carrierId,
            projectId: c.projectId,
            name: c.name,
            companyNameAr: c.companyNameAr,
            commercialRegistrationNo: c.commercialRegistrationNo,
            transportLicenseNo: c.transportLicenseNo,
            status: c.status,
            isActive: c.status === 'ACTIVE',
            createdAt: new Date(),
            createdBy: 'SYSTEM',
            updatedAt: new Date(),
            updatedBy: 'SYSTEM',
          })) as any;
          mats = cachedMats.map(m => ({
            materialId: m.materialId,
            projectId: m.projectId,
            name: m.name,
            nameAr: m.nameAr,
            code: m.code,
            unitOfMeasure: m.unitOfMeasure,
            standardDensityTonPerM3: m.standardDensityTonPerM3,
            status: m.status,
            isActive: m.status === 'ACTIVE',
            createdAt: new Date(),
            createdBy: 'SYSTEM',
            updatedAt: new Date(),
            updatedBy: 'SYSTEM',
          })) as any;
          trks = cachedTrks.map(t => ({
            truckId: t.truckId,
            carrierId: t.carrierId,
            projectId: t.projectId,
            plate: t.plate,
            plateNumberAr: t.plateNumberAr,
            truckType: t.truckType,
            tareWeightKg: t.tareWeightKg,
            legalPayloadLimitKg: t.legalPayloadLimitKg,
            status: t.status,
            isActive: t.status === 'ACTIVE',
            createdAt: new Date(),
            createdBy: 'SYSTEM',
            updatedAt: new Date(),
            updatedBy: 'SYSTEM',
          })) as any;
          drvs = cachedDrvs.map(d => ({
            driverId: d.driverId,
            carrierId: d.carrierId,
            projectId: d.projectId,
            name: d.name,
            fullNameAr: d.fullNameAr,
            phone: d.phone,
            idNumber: d.idNumber,
            status: d.status,
            isActive: d.status === 'ACTIVE',
            createdAt: new Date(),
            createdBy: 'SYSTEM',
            updatedAt: new Date(),
            updatedBy: 'SYSTEM',
          })) as any;
        }

        // 3. Trips
        const dbTrips = await indexedDBService.getAll<TripRecord>('trips').catch(() => []);

        if (isMounted) {
          setCanonicalProjects(prjs || []);
          setCanonicalCarriers(crs || []);
          setCanonicalMaterials(mats || []);
          setCanonicalTrucks(trks || []);
          setCanonicalDrivers(drvs || []);
          setCanonicalTrips(dbTrips || []);
        }
      } catch (err) {
        console.warn('OperationsDashboardView: Error loading canonical data:', err);
      }
    };

    loadCanonicalData();
  }, []);

  // 2. Global Dashboard Filters
  const [globalFilters, setGlobalFilters] = useState<DashboardFilterParams>({
    projectId: 'ALL',
    shiftDateFrom: '',
    shiftDateTo: '',
    carrierId: 'ALL',
    materialId: 'ALL',
    pricingType: 'ALL',
  });

  // 3. Per-Widget Override Filters State
  const [widgetFilterOverrides, setWidgetFilterOverrides] = useState<{
    tripsCard?: DashboardFilterParams;
    tonnageCard?: DashboardFilterParams;
    settlementCard?: DashboardFilterParams;
    carrierPerf?: DashboardFilterParams;
    materialDist?: DashboardFilterParams;
    pricingDist?: DashboardFilterParams;
    terminalBoard?: DashboardFilterParams;
  }>({});

  // 4. Expanded Widget Filter Toggles
  const [expandedWidgetFilters, setExpandedWidgetFilters] = useState<Record<string, boolean>>({});

  const toggleWidgetFilter = (widgetKey: string) => {
    setExpandedWidgetFilters(prev => ({
      ...prev,
      [widgetKey]: !prev[widgetKey],
    }));
  };

  const getEffectiveFilters = (widgetKey: string): { filters: DashboardFilterParams; isCustomized: boolean } => {
    const override = (widgetFilterOverrides as any)[widgetKey];
    if (override) {
      return { filters: override, isCustomized: true };
    }
    return { filters: globalFilters, isCustomized: false };
  };

  const setWidgetFilter = (widgetKey: string, newFilters: DashboardFilterParams) => {
    setWidgetFilterOverrides(prev => ({
      ...prev,
      [widgetKey]: newFilters,
    }));
  };

  const resetWidgetFilter = (widgetKey: string) => {
    setWidgetFilterOverrides(prev => {
      const copy = { ...prev };
      delete (copy as any)[widgetKey];
      return copy;
    });
  };

  // 5. Authorized Projects for Active Profile
  const authorizedProjects = useMemo(() => {
    return dashboardService.getAuthorizedProjects(activeProfile, canonicalProjects);
  }, [activeProfile, canonicalProjects]);

  const availableCarriers = useMemo(() => {
    if (globalFilters.projectId === 'ALL') {
      return canonicalCarriers;
    }
    return canonicalCarriers.filter(c => c.projectId === globalFilters.projectId || !c.projectId);
  }, [canonicalCarriers, globalFilters.projectId]);

  const availableMaterials = useMemo(() => {
    if (globalFilters.projectId === 'ALL') {
      return canonicalMaterials;
    }
    return canonicalMaterials.filter(m => m.projectId === globalFilters.projectId || !m.projectId);
  }, [canonicalMaterials, globalFilters.projectId]);

  const masterDataContext = useMemo(() => ({
    projects: canonicalProjects,
    carriers: canonicalCarriers,
    materials: canonicalMaterials,
    trucks: canonicalTrucks,
    drivers: canonicalDrivers,
  }), [canonicalProjects, canonicalCarriers, canonicalMaterials, canonicalTrucks, canonicalDrivers]);

  // Keep project filter within authorized boundaries of the activeProfile
  useEffect(() => {
    if (globalFilters.projectId !== 'ALL' && !dashboardService.isProjectAuthorized(globalFilters.projectId, activeProfile)) {
      setGlobalFilters(prev => ({
        ...prev,
        projectId: activeProfile.isRestricted && activeProfile.authorizedProjectIds.length > 0
          ? activeProfile.authorizedProjectIds[0]
          : 'ALL',
      }));
      setWidgetFilterOverrides({});
    }
  }, [activeProfile, globalFilters.projectId]);

  // 6. Live Terminal Board Search & Filter
  const [terminalSearch, setTerminalSearch] = useState<string>('');
  const [terminalStatusFilter, setTerminalStatusFilter] = useState<string>('ALL');

  // 8. Computations for each widget
  // (A) Trips Volume & Status Cards
  const tripsFilters = getEffectiveFilters('tripsCard').filters;
  const tripsData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(tripsFilters, activeProfile, canonicalTrips);
    return {
      metrics: dashboardService.computeTripStatusMetrics(trips),
      securityViolated,
    };
  }, [tripsFilters, activeProfile, canonicalTrips]);

  // (B) Tonnage & Weighbridge Variance Cards
  const tonnageFilters = getEffectiveFilters('tonnageCard').filters;
  const tonnageData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(tonnageFilters, activeProfile, canonicalTrips);
    return {
      metrics: dashboardService.computeTonnageMetrics(trips),
      securityViolated,
    };
  }, [tonnageFilters, activeProfile, canonicalTrips]);

  // (C) Financial Settlement Cards
  const settlementFilters = getEffectiveFilters('settlementCard').filters;
  const settlementData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(settlementFilters, activeProfile, canonicalTrips);
    return {
      metrics: dashboardService.computeSettlementMetrics(trips),
      securityViolated,
    };
  }, [settlementFilters, activeProfile, canonicalTrips]);

  // (D) Carrier Performance Widget
  const carrierFilters = getEffectiveFilters('carrierPerf').filters;
  const carrierData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(carrierFilters, activeProfile, canonicalTrips);
    return {
      items: dashboardService.computeCarrierPerformance(trips, canonicalCarriers),
      securityViolated,
    };
  }, [carrierFilters, activeProfile, canonicalTrips, canonicalCarriers]);

  // (E) Material Distribution Widget
  const materialFilters = getEffectiveFilters('materialDist').filters;
  const materialData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(materialFilters, activeProfile, canonicalTrips);
    return {
      items: dashboardService.computeMaterialDistribution(trips, canonicalMaterials),
      securityViolated,
    };
  }, [materialFilters, activeProfile, canonicalTrips, canonicalMaterials]);

  // (F) Pricing Distribution Widget
  const pricingFilters = getEffectiveFilters('pricingDist').filters;
  const pricingData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(pricingFilters, activeProfile, canonicalTrips);
    return {
      items: dashboardService.computePricingDistribution(trips),
      securityViolated,
    };
  }, [pricingFilters, activeProfile, canonicalTrips]);

  // (G) Live Terminal Board Widget
  const terminalFilters = getEffectiveFilters('terminalBoard').filters;
  const terminalData = useMemo(() => {
    const { trips, securityViolated } = dashboardService.getFilteredTrips(terminalFilters, activeProfile, canonicalTrips);
    let board = dashboardService.generateLiveTerminalBoard(trips, masterDataContext);

    if (terminalStatusFilter !== 'ALL') {
      board = board.filter(b => b.status === terminalStatusFilter);
    }

    if (terminalSearch.trim()) {
      const q = terminalSearch.toLowerCase();
      board = board.filter(b => 
        b.tripSerial.toLowerCase().includes(q) ||
        b.ticketId.toLowerCase().includes(q) ||
        b.truckPlateAr.toLowerCase().includes(q) ||
        b.driverNameAr.toLowerCase().includes(q) ||
        b.carrierNameAr.toLowerCase().includes(q) ||
        b.materialNameAr.toLowerCase().includes(q)
      );
    }

    return {
      items: board,
      securityViolated,
    };
  }, [terminalFilters, activeProfile, canonicalTrips, masterDataContext, terminalStatusFilter, terminalSearch]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Security Role Switcher (Project Authorization Enforcement) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <span>{t("dashboard.labels.txt_7d6fcd")}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {t("dashboard.labels.txt_6c69a9")}</span>
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t("dashboard.labels.continue")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Boundary Active Notice */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t("dashboard.labels.projects_2")}</span>
            {activeProfile.authorizedProjectIds.includes('ALL') ? (
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {t("dashboard.labels.projects_3")}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {authorizedProjects.map(p => (
                  <span key={p.projectId} className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]">
                    {p.nameAr} ({p.projectCode})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] text-stone-500">
            {activeProfile.isRestricted ? (
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {t("dashboard.labels.trip")}</span>
            ) : (
              <span className="text-stone-500">{t("dashboard.labels.txt_11a6ad")}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Global Dashboard Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-stone-800">
            <Filter className="w-4 h-4 text-amber-600" />
            <span className="text-sm">{t("dashboard.labels.txt_52e654")}</span>
            <span className="text-[11px] font-normal text-stone-500">
              {t("dashboard.labels.txt_36b0b2")}</span>
          </div>

          <button
            onClick={() => {
              setGlobalFilters({
                projectId: 'ALL',
                shiftDateFrom: '',
                shiftDateTo: '',
                carrierId: 'ALL',
                materialId: 'ALL',
                pricingType: 'ALL',
              });
              setWidgetFilterOverrides({});
            }}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("dashboard.labels.txt_38efc7")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Project Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-stone-400" />
              <span>{t("dashboard.labels.project")}</span>
            </label>
            <select
              value={globalFilters.projectId}
              onChange={(e) => setGlobalFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:bg-white focus:border-amber-500 outline-none"
            >
              {!activeProfile.isRestricted && (
                <option value="ALL">{t("dashboard.labels.projects_4")}</option>
              )}
              {authorizedProjects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>تاريخ الوردية (Shift Date)</span>
            </label>
            <input
              type="date"
              value={globalFilters.shiftDateFrom}
              onChange={(e) => setGlobalFilters(prev => ({ ...prev, shiftDateFrom: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>

          {/* Carrier Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center gap-1">
              <Truck className="w-3 h-3 text-stone-400" />
              <span>الناقل (Carrier)</span>
            </label>
            <select
              value={globalFilters.carrierId}
              onChange={(e) => setGlobalFilters(prev => ({ ...prev, carrierId: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:bg-white focus:border-amber-500 outline-none"
            >
              <option value="ALL">كافة الناقلين (All Carriers)</option>
              {availableCarriers.map(c => (
                <option key={c.carrierId} value={c.carrierId}>
                  {c.companyNameAr || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Material Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-stone-400" />
              <span>المادة (Material)</span>
            </label>
            <select
              value={globalFilters.materialId}
              onChange={(e) => setGlobalFilters(prev => ({ ...prev, materialId: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:bg-white focus:border-amber-500 outline-none"
            >
              <option value="ALL">كافة المواد (All Materials)</option>
              {availableMaterials.map(m => (
                <option key={m.materialId} value={m.materialId}>
                  {m.nameAr || m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center gap-1">
              <Calculator className="w-3 h-3 text-stone-400" />
              <span>نوع التسعير (Pricing Type)</span>
            </label>
            <select
              value={globalFilters.pricingType}
              onChange={(e) => setGlobalFilters(prev => ({ ...prev, pricingType: e.target.value as any }))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:bg-white focus:border-amber-500 outline-none"
            >
              <option value="ALL">{t("dashboard.labels.txt_6f8552")}</option>
              <option value="PER_TRIP">{t("dashboard.labels.txt_176fe6")}</option>
              <option value="PER_TON">بالطن المتري (PER_TON)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. SECTION ONE: Trips Volume & Status Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">
              {t("dashboard.labels.trips")}</h3>
          </div>

          <button
            onClick={() => toggleWidgetFilter('tripsCard')}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("dashboard.labels.txt_4ab700")}</span>
            {getEffectiveFilters('tripsCard').isCustomized && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
            {expandedWidgetFilters['tripsCard'] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Widget Filter */}
        {expandedWidgetFilters['tripsCard'] && (
          <WidgetFilterBar
            filters={tripsFilters}
            onFilterChange={(f) => setWidgetFilter('tripsCard', f)}
            authorizedProjects={authorizedProjects}
            userProfile={activeProfile}
            carriersList={canonicalCarriers}
            materialsList={canonicalMaterials}
            isCustomized={getEffectiveFilters('tripsCard').isCustomized}
            onResetToGlobal={() => resetWidgetFilter('tripsCard')}
          />
        )}

        {/* 5 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Trips */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-stone-500">{t("dashboard.labels.trips_2")}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 font-mono">
                {tripsData.metrics.totalTrips}
              </span>
              <span className="text-xs text-stone-500">رحلة</span>
            </div>
            <div className="mt-2 text-[11px] text-stone-600 font-medium">
              {t("dashboard.labels.txt_196321")}</div>
          </div>

          {/* Completed */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">{t("dashboard.status.txt_4f5139")}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-900 font-mono">
                {tripsData.metrics.completedTrips}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                {tripsData.metrics.completedRatePercent}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-800">
              {t("dashboard.labels.txt_7a5a12")}</div>
          </div>

          {/* In Transit */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">{t("dashboard.labels.txt_44dad6")}</span>
              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-900 font-mono">
                {tripsData.metrics.inTransitTrips}
              </span>
              <span className="text-xs text-blue-700">{t("dashboard.labels.txt_77aa19")}</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-800">
              {t("dashboard.labels.download")}</div>
          </div>

          {/* Returned */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900">{t("dashboard.labels.txt_2ca1cc")}</span>
              <RotateCw className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-900 font-mono">
                {tripsData.metrics.returnedTrips}
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                {tripsData.metrics.returnedRatePercent}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-rose-800">
              {t("dashboard.labels.location")}</div>
          </div>

          {/* Exceptions */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">{t("dashboard.labels.txt_1137e3")}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-900 font-mono">
                {tripsData.metrics.exceptionTrips}
              </span>
              <span className="text-xs text-amber-700">معلقة</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-800">
              {t("dashboard.labels.txt_5ac4f2")}</div>
          </div>
        </div>
      </div>

      {/* 4. SECTION TWO: Tonnage & Weighbridge Variance Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">
              {t("dashboard.labels.txt_125b36")}</h3>
          </div>

          <button
            onClick={() => toggleWidgetFilter('tonnageCard')}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("dashboard.labels.txt_4ab700")}</span>
            {getEffectiveFilters('tonnageCard').isCustomized && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
            {expandedWidgetFilters['tonnageCard'] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Widget Filter */}
        {expandedWidgetFilters['tonnageCard'] && (
          <WidgetFilterBar
            filters={tonnageFilters}
            onFilterChange={(f) => setWidgetFilter('tonnageCard', f)}
            authorizedProjects={authorizedProjects}
            userProfile={activeProfile}
            carriersList={canonicalCarriers}
            materialsList={canonicalMaterials}
            isCustomized={getEffectiveFilters('tonnageCard').isCustomized}
            onResetToGlobal={() => resetWidgetFilter('tonnageCard')}
          />
        )}

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Total Loaded Tons */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4">
            <span className="text-xs font-bold text-stone-500">{t("dashboard.labels.download_2")}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 font-mono">
                {tonnageData.metrics.totalLoadedTons.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-stone-600">طن متري</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              {t("dashboard.labels.txt_7caf8b")}</div>
          </div>

          {/* Total Received Tons */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4">
            <span className="text-xs font-bold text-stone-500">{t("dashboard.labels.location_2")}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 font-mono">
                {tonnageData.metrics.totalReceivedTons.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-stone-600">طن متري</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              {t("dashboard.labels.txt_18b638")}</div>
          </div>

          {/* Total Variance */}
          <div className={`rounded-xl p-4 border ${
            tonnageData.metrics.isVarianceAcceptable 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">{t("dashboard.labels.txt_1b110d")}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                tonnageData.metrics.isVarianceAcceptable 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {tonnageData.metrics.isVarianceAcceptable ? 'ضمن نسبة التسامح (±1%)' : 'تجاوز نسبة التسامح'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${
                tonnageData.metrics.isVarianceAcceptable ? 'text-emerald-950' : 'text-rose-950'
              }`}>
                {tonnageData.metrics.totalVarianceTons > 0 ? `+${tonnageData.metrics.totalVarianceTons}` : tonnageData.metrics.totalVarianceTons}
              </span>
              <span className="text-xs font-bold text-stone-600">طن</span>
              <span className={`text-xs font-bold font-mono ${
                tonnageData.metrics.isVarianceAcceptable ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                ({tonnageData.metrics.variancePercent}%)
              </span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              الفارق بين وزن الموقع ووزن المقلع
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECTION THREE: Financial Settlement Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">
              {t("dashboard.labels.txt_18193c")}</h3>
          </div>

          <button
            onClick={() => toggleWidgetFilter('settlementCard')}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("dashboard.labels.txt_4ab700")}</span>
            {getEffectiveFilters('settlementCard').isCustomized && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
            {expandedWidgetFilters['settlementCard'] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Widget Filter */}
        {expandedWidgetFilters['settlementCard'] && (
          <WidgetFilterBar
            filters={settlementFilters}
            onFilterChange={(f) => setWidgetFilter('settlementCard', f)}
            authorizedProjects={authorizedProjects}
            userProfile={activeProfile}
            carriersList={canonicalCarriers}
            materialsList={canonicalMaterials}
            isCustomized={getEffectiveFilters('settlementCard').isCustomized}
            onResetToGlobal={() => resetWidgetFilter('settlementCard')}
          />
        )}

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Total Settlement */}
          <div className="bg-stone-900 text-white rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-stone-400">{t("dashboard.labels.txt_588cfc")}</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-400">
                {settlementData.metrics.totalSettlementAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-stone-300">ر.س</span>
            </div>
            <div className="mt-2 text-[11px] text-stone-400">
              {t("dashboard.labels.pricing_2")}</div>
          </div>

          {/* Trip-based Settlement */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">{t("dashboard.labels.txt_42b243")}</span>
              <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                PER_TRIP
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-stone-900">
                {settlementData.metrics.tripBasedSettlementAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-stone-500">ر.س</span>
            </div>
            <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-between">
              <span>{settlementData.metrics.tripBasedTripsCount} رحلة بالمقطوعية</span>
              <span className="font-mono text-[10px] text-stone-400">العدد × السعر</span>
            </div>
          </div>

          {/* Ton-based Settlement */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">{t("dashboard.labels.txt_b1749a")}</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                PER_TON
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-stone-900">
                {settlementData.metrics.tonBasedSettlementAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-stone-500">ر.س</span>
            </div>
            <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-between">
              <span>{settlementData.metrics.tonBasedTripsCount} رحلة بالطن</span>
              <span className="font-mono text-[10px] text-stone-400">الصافي × سعر الطن</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECTION FOUR & FIVE: Carrier Performance & Material Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Carrier Performance Widget */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  {t("dashboard.labels.txt_45844d")}</h3>
              </div>

              <button
                onClick={() => toggleWidgetFilter('carrierPerf')}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg font-bold cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t("dashboard.labels.txt_2f010a")}</span>
                {getEffectiveFilters('carrierPerf').isCustomized && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                )}
              </button>
            </div>

            {expandedWidgetFilters['carrierPerf'] && (
              <div className="mb-3">
                <WidgetFilterBar
                  filters={carrierFilters}
                  onFilterChange={(f) => setWidgetFilter('carrierPerf', f)}
                  authorizedProjects={authorizedProjects}
                  userProfile={activeProfile}
                  carriersList={canonicalCarriers}
                  materialsList={canonicalMaterials}
                  isCustomized={getEffectiveFilters('carrierPerf').isCustomized}
                  onResetToGlobal={() => resetWidgetFilter('carrierPerf')}
                />
              </div>
            )}

            {/* Carrier Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold">
                    <th className="py-2 px-1">الناقل</th>
                    <th className="py-2 px-1 text-center">الرحلات</th>
                    <th className="py-2 px-1 text-center">المكتملة</th>
                    <th className="py-2 px-1 text-center">{t("dashboard.labels.download_3")}</th>
                    <th className="py-2 px-1 text-left">{t("dashboard.labels.txt_3b0cf8")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {carrierData.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-400">
                        {t("dashboard.labels.txt_15b1d1")}</td>
                    </tr>
                  ) : (
                    carrierData.items.map((c) => (
                      <tr key={c.carrierId} className="hover:bg-stone-50/80">
                        <td className="py-2.5 px-1 font-bold text-stone-800">
                          <div>{c.carrierNameAr}</div>
                          <span className="text-[10px] text-stone-400 font-mono">{c.carrierId}</span>
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono font-bold text-stone-900">
                          {c.totalTrips}
                        </td>
                        <td className="py-2.5 px-1 text-center">
                          <span className="font-mono font-bold text-emerald-700">
                            {c.completedTrips}
                          </span>
                          <span className="text-[10px] text-stone-400 ml-1">({c.completionRatePercent}%)</span>
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono text-stone-700">
                          {c.loadedTons.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-1 text-left font-mono font-bold text-stone-900">
                          {c.settlementAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Material Distribution Widget */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  {t("dashboard.labels.materials_2")}</h3>
              </div>

              <button
                onClick={() => toggleWidgetFilter('materialDist')}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg font-bold cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t("dashboard.labels.txt_2f010a")}</span>
                {getEffectiveFilters('materialDist').isCustomized && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                )}
              </button>
            </div>

            {expandedWidgetFilters['materialDist'] && (
              <div className="mb-3">
                <WidgetFilterBar
                  filters={materialFilters}
                  onFilterChange={(f) => setWidgetFilter('materialDist', f)}
                  authorizedProjects={authorizedProjects}
                  userProfile={activeProfile}
                  carriersList={canonicalCarriers}
                  materialsList={canonicalMaterials}
                  isCustomized={getEffectiveFilters('materialDist').isCustomized}
                  onResetToGlobal={() => resetWidgetFilter('materialDist')}
                />
              </div>
            )}

            {/* Material Items List */}
            <div className="space-y-3">
              {materialData.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  {t("dashboard.labels.txt_5fc7c1")}</div>
              ) : (
                materialData.items.map((m) => (
                  <div key={m.materialId} className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{m.materialNameAr}</span>
                        <span className="text-[10px] text-stone-500 font-mono">({m.code})</span>
                      </div>
                      <div className="text-left font-mono font-bold text-stone-900">
                        {m.loadedTons.toLocaleString()} طن
                        <span className="text-[10px] text-amber-800 mr-1.5">({m.sharePercent}%)</span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-stone-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, m.sharePercent))}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2">
                      <span>{m.totalTrips} رحلة نقل</span>
                      <span className="font-mono">{m.settlementAmount.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 7. SECTION SIX: Pricing Distribution Widget */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">
              {t("dashboard.labels.pricing_3")}</h3>
          </div>

          <button
            onClick={() => toggleWidgetFilter('pricingDist')}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("dashboard.labels.txt_550c13")}</span>
            {getEffectiveFilters('pricingDist').isCustomized && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>

        {expandedWidgetFilters['pricingDist'] && (
          <WidgetFilterBar
            filters={pricingFilters}
            onFilterChange={(f) => setWidgetFilter('pricingDist', f)}
            authorizedProjects={authorizedProjects}
            userProfile={activeProfile}
            carriersList={canonicalCarriers}
            materialsList={canonicalMaterials}
            isCustomized={getEffectiveFilters('pricingDist').isCustomized}
            onResetToGlobal={() => resetWidgetFilter('pricingDist')}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricingData.items.map((p) => (
            <div 
              key={p.pricingType} 
              className={`rounded-xl p-4 border flex flex-col justify-between ${
                p.pricingType === 'PER_TRIP' 
                  ? 'bg-blue-50/40 border-blue-200' 
                  : 'bg-emerald-50/40 border-emerald-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{p.titleAr}</span>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                    {p.sharePercent}% من الإجمالي
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-bold">الرحلات</span>
                    <span className="text-lg font-black font-mono text-stone-900">{p.totalTrips}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-bold">{t("dashboard.labels.txt_7ef999")}</span>
                    <span className="text-lg font-black font-mono text-stone-900">{p.totalTons.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-bold">متوسط السعر</span>
                    <span className="text-lg font-black font-mono text-stone-900">{p.averageRate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">{t("dashboard.labels.txt_356679")}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {p.totalSettlementAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. SECTION SEVEN: Live Terminal Board */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>{t("dashboard.labels.txt_2530ed")}</span>
                <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-mono font-bold border border-stone-200">
                  {terminalData.items.length} حركة نشطة
                </span>
              </h3>
              <p className="text-[11px] text-stone-500">
                {t("dashboard.labels.continue_2")}</p>
            </div>
          </div>

          {/* Search and Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="بحث برقم التذكرة، اللوحة، أو السائق..."
                value={terminalSearch}
                onChange={(e) => setTerminalSearch(e.target.value)}
                className="pr-8 pl-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none w-48 sm:w-60"
              />
            </div>

            <select
              value={terminalStatusFilter}
              onChange={(e) => setTerminalStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 focus:bg-white focus:border-amber-500 outline-none cursor-pointer"
            >
              <option value="ALL">{t("dashboard.labels.txt_3318a9")}</option>
              <option value="IN_TRANSIT">قيد النقل (IN_TRANSIT)</option>
              <option value="LOADED">تم التحميل (LOADED)</option>
              <option value="COMPLETED">مكتملة (COMPLETED)</option>
              <option value="RETURNED">مرتجعة (RETURNED)</option>
              <option value="EXCEPTION">استثناء (EXCEPTION)</option>
            </select>

            <button
              onClick={() => toggleWidgetFilter('terminalBoard')}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl cursor-pointer"
              title={t("dashboard.labels.txt_8d4f12")}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {expandedWidgetFilters['terminalBoard'] && (
          <WidgetFilterBar
            filters={terminalFilters}
            onFilterChange={(f) => setWidgetFilter('terminalBoard', f)}
            authorizedProjects={authorizedProjects}
            userProfile={activeProfile}
            carriersList={canonicalCarriers}
            materialsList={canonicalMaterials}
            isCustomized={getEffectiveFilters('terminalBoard').isCustomized}
            onResetToGlobal={() => resetWidgetFilter('terminalBoard')}
          />
        )}

        {/* Terminal Table */}
        <div className="overflow-x-auto border border-stone-100 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-2.5 px-3">رقم الرحلة / التذكرة</th>
                <th className="py-2.5 px-3">{t("dashboard.labels.truckDriver")}</th>
                <th className="py-2.5 px-3">{t("dashboard.labels.projectMaterial")}</th>
                <th className="py-2.5 px-3">الناقل</th>
                <th className="py-2.5 px-3 text-center">الحالة</th>
                <th className="py-2.5 px-3 text-center">{t("dashboard.labels.downloadLocation")}</th>
                <th className="py-2.5 px-3 text-center">{t("dashboard.labels.weighbridge")}</th>
                <th className="py-2.5 px-3 text-left">{t("dashboard.labels.txt_12bb4c")}</th>
                <th className="py-2.5 px-3 text-center">{t("dashboard.labels.txt_7f63ed")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {terminalData.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    {t("dashboard.labels.search")}</td>
                </tr>
              ) : (
                terminalData.items.map((row) => (
                  <tr key={row.tripId} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-stone-900 block">{row.tripSerial}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{row.ticketId}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-800 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-stone-400" />
                        <span>{row.truckPlateAr}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 block">{row.driverNameAr}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-800 block">{row.materialNameAr}</span>
                      <span className="text-[10px] text-stone-400">{row.projectNameAr}</span>
                    </td>

                    <td className="py-3 px-3 text-stone-700">
                      {row.carrierNameAr}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        row.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : row.status === 'LOADED'
                          ? 'bg-purple-100 text-purple-800'
                          : row.status === 'RETURNED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status === 'COMPLETED' && 'مكتملة'}
                        {row.status === 'IN_TRANSIT' && 'قيد النقل'}
                        {row.status === 'LOADED' && 'تم التحميل'}
                        {row.status === 'RETURNED' && 'مرتجعة'}
                        {row.status === 'EXCEPTION' && 'استثناء'}
                        {row.status === 'DRAFT' && 'مسودة'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <div>{(row.loadedWeightKg / 1000).toFixed(2)} طن</div>
                      {row.receivedWeightKg !== null ? (
                        <div className="text-[10px] text-stone-500">الموقع: {(row.receivedWeightKg / 1000).toFixed(2)} طن</div>
                      ) : (
                        <div className="text-[10px] text-amber-600 font-bold">{t("dashboard.labels.txt_11cccb")}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {row.varianceKg !== null ? (
                        <span className={`font-bold ${
                          Math.abs(row.variancePercent || 0) <= 1 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {row.varianceKg > 0 ? `+${row.varianceKg}` : row.varianceKg} كجم
                          <span className="text-[10px] block">({row.variancePercent}%)</span>
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-left font-mono font-bold text-stone-900">
                      {row.settlementAmount > 0 ? (
                        <span>{row.settlementAmount.toLocaleString()} {row.currency}</span>
                      ) : (
                        <span className="text-stone-400 text-xs">{t("dashboard.labels.txt_5049eb")}</span>
                      )}
                      <span className="text-[9px] block text-stone-400">{row.pricingType}</span>
                    </td>

                    <td className="py-3 px-3 text-center text-[11px] text-stone-500 font-mono">
                      {row.eventTimeFormatted}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
