import { projectRepository } from '../../repositories/project.repository';
import { projectCarrierMembershipRepository, projectMaterialMembershipRepository } from '../../repositories/projectMembership.repository';
import { globalCarrierRepository, globalMaterialRepository } from '../../repositories/globalIdentity.repository';
import { projectFleetReadModelService } from '../projectFleetReadModel.service';
import { pricingRuleRepository } from '../../repositories/pricingRule.repository';
import { 
  ProjectEntity, 
  CarrierEntity, 
  MaterialEntity, 
  TruckEntity, 
  DriverEntity, 
  PricingRuleEntity 
} from '../../types/entities';
/**
 * Offline Master Data Cache Manager.
 * Handles IndexedDB caching for:
 * 1. projects
 * 2. carriers
 * 3. materials
 * 4. trucks
 * 5. drivers
 * 6. pricingRules
 * 
 * Strict Requirement:
 * "لا تخزن فقط البيانات؛ خزن version/timestamp."
 * "لا تسمح بإنشاء رحلة Offline إذا كانت بيانات التسعير غير متاحة."
 */

import { indexedDBService } from './indexedDB.service';
import { 
  CachedProject, 
  CachedCarrier, 
  CachedMaterial, 
  CachedTruck, 
  CachedDriver, 
  CachedPricingRule,
  CacheStoreMetadata,
  CacheStoreName,
  OfflineTripPrerequisitesReport 
} from '../../types/offline';

export class OfflineCacheService {
  private isInitialized = false;

  /**
   * Initializes and prepares IndexedDB cache.
   * BLOCK 82D: Does NOT automatically seed synthetic master data or projects into normal runtime.
   * Seeding only occurs if explicitly requested via forceRefresh=true (e.g. for developer/demo seeding).
   */
  public async initializeCache(forceRefresh = false): Promise<void> {
    if (this.isInitialized && !forceRefresh) {
      return;
    }

    try {
      if (forceRefresh) {
        await this.seedAllMasterData();
      }
      this.isInitialized = true;
    } catch (err) {
      console.warn('Could not initialize IndexedDB cache (running in memory fallback?):', err);
    }
  }

  /**
   * Clears all cached master data and project stores in IndexedDB (BLOCK 82D)
   */
  public async clearAllMasterData(): Promise<void> {
    try {
      await Promise.all([
        indexedDBService.clear('projects'),
        indexedDBService.clear('carriers'),
        indexedDBService.clear('materials'),
        indexedDBService.clear('trucks'),
        indexedDBService.clear('drivers'),
        indexedDBService.clear('pricingRules'),
        indexedDBService.clear('metadata'),
      ]);
      this.isInitialized = false;
    } catch (err) {
      console.warn('Could not clear IndexedDB master data:', err);
    }
  }

  /**
   * Reconciles authoritative Firestore/upstream state with local IndexedDB cache,
   * removing orphaned local records that no longer exist upstream.
   */
  public async reconcileStore<T>(
    storeName: CacheStoreName,
    authoritativeItems: T[],
    getKey: (item: T) => string
  ): Promise<void> {
    try {
      const existingItems = await indexedDBService.getAll<T>(storeName);
      const authoritativeKeys = new Set(authoritativeItems.map(getKey));

      for (const item of existingItems) {
        const key = getKey(item);
        if (key && !authoritativeKeys.has(key)) {
          await indexedDBService.delete(storeName, key);
        }
      }

      await indexedDBService.putMany(storeName, authoritativeItems);

      const now = new Date().toISOString();
      await indexedDBService.setMetadata({
        storeName,
        version: 1,
        timestamp: now,
        recordCount: authoritativeItems.length,
        lastSyncedBy: 'AUTHORITATIVE_RECONCILIATION',
      });
    } catch (err) {
      console.warn(`Error reconciling store ${storeName}:`, err);
    }
  }

  /**
   * Seeds all required master datasets into IndexedDB with explicit versions and ISO timestamps,
   * hydrating directly from canonical repositories using authoritative deletion-aware reconciliation.
   */
  public async seedAllMasterData(projectId?: string): Promise<void> {
    const now = new Date().toISOString();
    const currentVersion = 1;

    // 1. Projects - hydrated from projectRepository
    let rawProjects: ProjectEntity[] = [];
    if (projectId) {
      const singleProj = await projectRepository.findById(projectId);
      rawProjects = singleProj ? [singleProj] : [];
    } else {
      rawProjects = await projectRepository.listAll();
    }

    const projectsToCache: CachedProject[] = rawProjects.map(p => ({
      projectId: p.projectId,
      projectCode: p.projectCode || p.projectId,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      clientName: p.clientName,
      authorizedCarrierIds: p.authorizedCarrierIds || [],
      authorizedMaterialIds: p.authorizedMaterialIds || [],
      status: (p.status as any) || 'ACTIVE',
      _version: currentVersion,
      _cachedAt: now,
    }));
    await this.reconcileStore('projects', projectsToCache, p => p.projectId);

    // Determine target project IDs for sub-entity hydration
    const targetProjectIds = projectId 
      ? [projectId] 
      : rawProjects.map(p => p.projectId);

    // 2. Carriers - hydrated from ACTIVE ProjectCarrierMembership + Global Carrier Identity
    const carrierMembershipsList = await Promise.all(
      targetProjectIds.map(async pId => {
        try {
          return await projectCarrierMembershipRepository.listMemberships(pId, 'ACTIVE');
        } catch {
          return [];
        }
      })
    );
    const activeCarrierIds = Array.from(new Set(carrierMembershipsList.flat().map(m => m.carrierId)));
    const globalCarriers = await globalCarrierRepository.listByIds(activeCarrierIds);
    const carriersToCache: CachedCarrier[] = globalCarriers.map(c => ({
      carrierId: c.carrierId,
      projectId: '',
      name: c.nameAr,
      companyNameAr: c.nameAr,
      commercialRegistrationNo: c.commercialRegistrationNo,
      transportLicenseNo: c.transportLicenseNo,
      status: 'ACTIVE',
      _version: currentVersion,
      _cachedAt: now,
    }));
    await this.reconcileStore('carriers', carriersToCache, c => c.carrierId);

    // 3. Materials - hydrated from ACTIVE ProjectMaterialMembership + Global Material Identity
    const materialMembershipsList = await Promise.all(
      targetProjectIds.map(async pId => {
        try {
          return await projectMaterialMembershipRepository.listMemberships(pId, 'ACTIVE');
        } catch {
          return [];
        }
      })
    );
    const activeMaterialIds = Array.from(new Set(materialMembershipsList.flat().map(m => m.materialId)));
    const globalMaterials = await globalMaterialRepository.listByIds(activeMaterialIds);
    const materialsToCache: CachedMaterial[] = globalMaterials.map(m => ({
      materialId: m.materialId,
      projectId: '',
      name: m.nameAr,
      nameAr: m.nameAr,
      code: m.code,
      unitOfMeasure: m.unitOfMeasure,
      standardDensityTonPerM3: m.standardDensityTonPerM3,
      status: 'ACTIVE',
      _version: currentVersion,
      _cachedAt: now,
    }));
    await this.reconcileStore('materials', materialsToCache, m => m.materialId);

    // 4. Trucks & Drivers - hydrated via projectFleetReadModelService
    const fleetModels = await Promise.all(
      targetProjectIds.map(async pId => {
        try {
          return await projectFleetReadModelService.getProjectFleetReadModel(pId);
        } catch {
          return null;
        }
      })
    );
    const validFleetRows = fleetModels.filter(Boolean).flatMap(f => f!.rows);
    
    const uniqueTruckMap = new Map<string, CachedTruck>();
    const uniqueDriverMap = new Map<string, CachedDriver>();

    for (const row of validFleetRows) {
      if (!uniqueTruckMap.has(row.truckId)) {
        uniqueTruckMap.set(row.truckId, {
          truckId: row.truckId,
          carrierId: row.carrierId,
          projectId: row.projectId,
          plate: row.plateNumber,
          plateNumberAr: row.plateNumber,
          truckType: row.truckType,
          tareWeightKg: 14000,
          legalPayloadLimitKg: 45000,
          status: 'ACTIVE',
          _version: currentVersion,
          _cachedAt: now,
        });
      }
      if (row.driverId && !uniqueDriverMap.has(row.driverId)) {
        uniqueDriverMap.set(row.driverId, {
          driverId: row.driverId,
          carrierId: row.carrierId,
          projectId: row.projectId,
          name: row.driverName || row.driverId,
          fullNameAr: row.driverName || row.driverId,
          phone: '—',
          idNumber: '—',
          status: 'ACTIVE',
          _version: currentVersion,
          _cachedAt: now,
        });
      }
    }

    const trucksToCache = Array.from(uniqueTruckMap.values());
    const driversToCache = Array.from(uniqueDriverMap.values());

    await this.reconcileStore('trucks', trucksToCache, t => t.truckId);
    await this.reconcileStore('drivers', driversToCache, d => d.driverId);

    // 6. Pricing Rules - hydrated from pricingRuleRepository
    const pricingRuleLists = await Promise.all(
      targetProjectIds.map(pId => pricingRuleRepository.listByProject(pId))
    );
    const rawPricingRules = pricingRuleLists.flat();
    const uniquePricingRulesMap = new Map<string, PricingRuleEntity>();
    for (const r of rawPricingRules) {
      if (!uniquePricingRulesMap.has(r.pricingRuleId)) {
        uniquePricingRulesMap.set(r.pricingRuleId, r);
      }
    }
    const pricingRulesToCache: CachedPricingRule[] = Array.from(uniquePricingRulesMap.values()).map(r => ({
      pricingRuleId: r.pricingRuleId,
      projectId: r.projectId,
      name: r.name || r.pricingRuleId,
      pricingType: (r.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON') as 'PER_TON' | 'PER_TRIP',
      agreedRate: r.baseRateSAR ?? (r as any).agreedRate ?? (r as any).rate ?? 0,
      currency: r.currency || 'SAR',
      effectiveFrom: r.effectiveFrom || now.slice(0, 10),
      effectiveTo: r.effectiveTo || '',
      carrierId: r.carrierId || '',
      materialId: r.materialId || '',
      status: (r.status === 'ACTIVE' || r.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      _version: currentVersion,
      _cachedAt: now,
    }));
    await this.reconcileStore('pricingRules', pricingRulesToCache, r => r.pricingRuleId);
  }

  /**
   * Convenience method to seed/hydrate cache for a specific project scope.
   */
  public async seedByProject(projectId: string): Promise<void> {
    return this.seedAllMasterData(projectId);
  }

  // ---------------- Query Cached Data ---------------- //

  public async getProjects(): Promise<CachedProject[]> {
    await this.initializeCache();
    const list = await indexedDBService.getAll<CachedProject>('projects');
    return list.filter(p => !p.status || p.status === 'ACTIVE');
  }

  public async getCarriers(projectId?: string): Promise<CachedCarrier[]> {
    await this.initializeCache();
    const list = await indexedDBService.getAll<CachedCarrier>('carriers');
    const active = list.filter(c => !c.status || c.status === 'ACTIVE');
    if (projectId) {
      return active.filter(c => c.projectId === projectId || !c.projectId);
    }
    return active;
  }

  public async getMaterials(projectId?: string): Promise<CachedMaterial[]> {
    await this.initializeCache();
    const list = await indexedDBService.getAll<CachedMaterial>('materials');
    const active = list.filter(m => !m.status || m.status === 'ACTIVE');
    if (projectId) {
      return active.filter(m => m.projectId === projectId || !m.projectId);
    }
    return active;
  }

  public async getTrucks(carrierId?: string): Promise<CachedTruck[]> {
    await this.initializeCache();
    const list = await indexedDBService.getAll<CachedTruck>('trucks');
    const active = list.filter(t => !t.status || t.status === 'ACTIVE');
    if (carrierId) {
      return active.filter(t => t.carrierId === carrierId);
    }
    return active;
  }

  public async getDrivers(carrierId?: string): Promise<CachedDriver[]> {
    await this.initializeCache();
    const list = await indexedDBService.getAll<CachedDriver>('drivers');
    const active = list.filter(d => !d.status || d.status === 'ACTIVE');
    if (carrierId) {
      return active.filter(d => d.carrierId === carrierId);
    }
    return active;
  }

  public async getPricingRules(params?: {
    projectId?: string;
    carrierId?: string;
    materialId?: string;
  }): Promise<CachedPricingRule[]> {
    await this.initializeCache();
    const list = await indexedDBService.getAll<CachedPricingRule>('pricingRules');
    const active = list.filter(r => !r.status || r.status === 'ACTIVE');
    if (!params) return active;

    return active.filter(r => {
      if (params.projectId && r.projectId !== params.projectId) return false;
      if (params.carrierId && r.carrierId && r.carrierId !== params.carrierId) return false;
      if (params.materialId && r.materialId && r.materialId !== params.materialId) return false;
      return true;
    });
  }

  /**
   * Finds an applicable active pricing rule from local cache for a specific combination.
   */
  public async findApplicablePricingRule(
    projectId: string, 
    carrierId: string, 
    materialId: string,
    specificRuleId?: string
  ): Promise<CachedPricingRule | undefined> {
    await this.initializeCache();
    const all = await this.getPricingRules();
    
    // If specific rule was selected, check if it's available locally
    if (specificRuleId) {
      const found = all.find(r => r.pricingRuleId === specificRuleId && r.status === 'ACTIVE');
      if (found) return found;
    }

    // Otherwise match by project, carrier, material
    const matched = all.find(r => 
      r.status === 'ACTIVE' &&
      r.projectId === projectId &&
      (!r.carrierId || r.carrierId === carrierId) &&
      (!r.materialId || r.materialId === materialId)
    );

    return matched;
  }

  /**
   * Evaluates if ALL required Master Data AND Pricing Data are present locally in IndexedDB.
   * STRICT DIRECTIVE:
   * "يجب أن يعمل Loading أثناء Offline إذا كانت جميع Master Data وPricing Data اللازمة متوفرة محلياً."
   * "لا تسمح بإنشاء رحلة Offline إذا كانت بيانات التسعير غير متاحة."
   */
  public async validateOfflineTripPrerequisites(params: {
    projectId: string;
    carrierId: string;
    truckId: string;
    driverId: string;
    materialId: string;
    pricingRuleId?: string;
    shiftDate?: string;
  }): Promise<OfflineTripPrerequisitesReport> {
    await this.initializeCache();

    const [projects, carriers, trucks, drivers, materials, pricingRules] = await Promise.all([
      this.getProjects(),
      this.getCarriers(),
      this.getTrucks(),
      this.getDrivers(),
      this.getMaterials(),
      this.getPricingRules(),
    ]);

    const hasProject = projects.some(p => p.projectId === params.projectId && p.status === 'ACTIVE');
    const hasCarrier = carriers.some(c => c.carrierId === params.carrierId && c.status === 'ACTIVE');
    const hasTruck = trucks.some(t => t.truckId === params.truckId && t.status === 'ACTIVE');
    const hasDriver = drivers.some(d => d.driverId === params.driverId && d.status === 'ACTIVE');
    const hasMaterial = materials.some(m => m.materialId === params.materialId && m.status === 'ACTIVE');

    // Pricing Rule Lookup from local IndexedDB cache
    let pricingRule: CachedPricingRule | undefined;
    if (params.pricingRuleId) {
      pricingRule = pricingRules.find(r => r.pricingRuleId === params.pricingRuleId && r.status === 'ACTIVE');
    }
    if (!pricingRule) {
      pricingRule = pricingRules.find(r => 
        r.status === 'ACTIVE' &&
        r.projectId === params.projectId &&
        (!r.carrierId || r.carrierId === params.carrierId) &&
        (!r.materialId || r.materialId === params.materialId)
      );
    }

    const hasPricingRule = !!pricingRule && pricingRule.status === 'ACTIVE' && pricingRule.agreedRate > 0;
    const warningsAr: string[] = [];

    // Check date validity if pricing rule exists
    if (pricingRule && params.shiftDate) {
      if (params.shiftDate < pricingRule.effectiveFrom || params.shiftDate > pricingRule.effectiveTo) {
        warningsAr.push(`قاعدة التسعير المحلية خارج نطاق الصلاحية للتشغيل (${pricingRule.effectiveFrom} إلى ${pricingRule.effectiveTo})`);
      }
    }

    let blockingReasonAr: string | undefined;

    // RULE: "لا تسمح بإنشاء رحلة Offline إذا كانت بيانات التسعير غير متاحة."
    if (!hasPricingRule) {
      blockingReasonAr = 'حظر إنشاء الرحلة بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بإنشاء أي رحلة بدون احتساب تسعيري معتمد.';
    } else if (!hasProject) {
      blockingReasonAr = `المشروع (${params.projectId}) غير متوفر أو غير معتمد محلياً`;
    } else if (!hasCarrier) {
      blockingReasonAr = `الناقل (${params.carrierId}) غير متوفر أو غير نشط في الذاكرة المحلية`;
    } else if (!hasTruck) {
      blockingReasonAr = `الشاحنة (${params.truckId}) غير متوفرة أو معطلة في الذاكرة المحلية`;
    } else if (!hasDriver) {
      blockingReasonAr = `السائق (${params.driverId}) غير مسجل أو معطل في الذاكرة المحلية`;
    } else if (!hasMaterial) {
      blockingReasonAr = `المادة (${params.materialId}) غير متوفرة محلياً`;
    }

    const isReadyForOfflineCreation = 
      hasProject && 
      hasCarrier && 
      hasTruck && 
      hasDriver && 
      hasMaterial && 
      hasPricingRule && 
      !blockingReasonAr;

    return {
      isReadyForOfflineCreation,
      hasProject,
      hasCarrier,
      hasTruck,
      hasDriver,
      hasMaterial,
      hasPricingRule,
      pricingRule,
      blockingReasonAr,
      warningsAr,
    };
  }

  /**
   * Retrieves all cache metadata reports (version, timestamp, record count for each store).
   */
  public async getCacheMetadata(): Promise<CacheStoreMetadata[]> {
    await this.initializeCache();
    return indexedDBService.getAllMetadata();
  }

  /**
   * Re-caches Master Data and bumps the cache version and timestamp.
   */
  public async refreshCacheWithBump(): Promise<{ success: boolean; newVersion: number; timestamp: string }> {
    const metas = await indexedDBService.getAllMetadata();
    const maxVersion = metas.length > 0 ? Math.max(...metas.map(m => m.version)) : 1;
    const newVersion = maxVersion + 1;
    const now = new Date().toISOString();

    await this.seedAllMasterData();

    // Update all metadata with new version and timestamp
    const storeNames: CacheStoreName[] = ['projects', 'carriers', 'materials', 'trucks', 'drivers', 'pricingRules'];
    for (const name of storeNames) {
      const count = await indexedDBService.count(name);
      await indexedDBService.setMetadata({
        storeName: name,
        version: newVersion,
        timestamp: now,
        recordCount: count,
        lastSyncedBy: 'MANUAL_REFRESH',
      });
    }

    return {
      success: true,
      newVersion,
      timestamp: now,
    };
  }
}

export const offlineCacheService = new OfflineCacheService();
