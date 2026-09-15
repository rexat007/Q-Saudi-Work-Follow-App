const fs = require('fs');
let content = fs.readFileSync('src/services/offline/offlineCache.service.ts', 'utf8');

const startTag = '  public async seedAllMasterData(): Promise<void> {';
const endTag = '  // ---------------- Query Cached Data ---------------- //';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  const newSeedMethod = `  public async seedAllMasterData(): Promise<void> {
    const now = new Date().toISOString();
    const currentVersion = 1;

    // 1. Projects
    const projectsToCache: CachedProject[] = adminConsoleService.getProjects().map(p => ({
        projectId: p.projectId,
        projectCode: p.projectCode,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        clientName: p.clientName,
        authorizedCarrierIds: p.authorizedCarrierIds,
        authorizedMaterialIds: p.authorizedMaterialIds,
        status: p.status,
        _version: currentVersion,
        _cachedAt: now,
    }));

    await indexedDBService.putMany('projects', projectsToCache);
    await indexedDBService.setMetadata({
      storeName: 'projects',
      version: currentVersion,
      timestamp: now,
      recordCount: projectsToCache.length,
      lastSyncedBy: 'SYSTEM_SEED',
    });

    // 2. Carriers
    const carriersToCache: CachedCarrier[] = adminConsoleService.getCarriers().map(c => ({
      carrierId: c.carrierId,
      projectId: '',
      name: c.name,
      companyNameAr: c.name,
      commercialRegistrationNo: c.crNo || '1010000000',
      status: c.status,
      _version: currentVersion,
      _cachedAt: now,
    }));

    await indexedDBService.putMany('carriers', carriersToCache);
    await indexedDBService.setMetadata({
      storeName: 'carriers',
      version: currentVersion,
      timestamp: now,
      recordCount: carriersToCache.length,
      lastSyncedBy: 'SYSTEM_SEED',
    });

    // 3. Materials
    const materialsToCache: CachedMaterial[] = adminConsoleService.getMaterials().map(m => ({
      materialId: m.materialId,
      projectId: '',
      name: m.name,
      nameAr: m.name,
      code: m.code || 'MAT',
      unitOfMeasure: m.uom || 'TON',
      standardDensityTonPerM3: 1.6,
      status: m.status,
      _version: currentVersion,
      _cachedAt: now,
    }));

    await indexedDBService.putMany('materials', materialsToCache);
    await indexedDBService.setMetadata({
      storeName: 'materials',
      version: currentVersion,
      timestamp: now,
      recordCount: materialsToCache.length,
      lastSyncedBy: 'SYSTEM_SEED',
    });

    // 4. Trucks
    const trucksToCache: CachedTruck[] = adminConsoleService.getTrucks().map(t => ({
      truckId: t.truckId,
      carrierId: t.carrierId,
      projectId: '',
      plate: t.plate,
      plateNumberAr: t.plate,
      truckType: 'TIPPER_30T',
      tareWeightKg: t.tareKg || 14000,
      legalPayloadLimitKg: t.grossKg || 45000,
      status: t.status,
      _version: currentVersion,
      _cachedAt: now,
    }));

    await indexedDBService.putMany('trucks', trucksToCache);
    await indexedDBService.setMetadata({
      storeName: 'trucks',
      version: currentVersion,
      timestamp: now,
      recordCount: trucksToCache.length,
      lastSyncedBy: 'SYSTEM_SEED',
    });

    // 5. Drivers
    const driversToCache: CachedDriver[] = adminConsoleService.getDrivers().map(d => ({
      driverId: d.driverId,
      carrierId: d.carrierId,
      projectId: '',
      name: d.name,
      fullNameAr: d.name,
      phone: d.phone,
      idNumber: d.idNumber || '',
      status: d.status,
      _version: currentVersion,
      _cachedAt: now,
    }));

    await indexedDBService.putMany('drivers', driversToCache);
    await indexedDBService.setMetadata({
      storeName: 'drivers',
      version: currentVersion,
      timestamp: now,
      recordCount: driversToCache.length,
      lastSyncedBy: 'SYSTEM_SEED',
    });

    // 6. Pricing Rules
    const pricingRulesToCache: CachedPricingRule[] = pricingService.getRules().map(r => ({
      pricingRuleId: r.pricingRuleId,
      projectId: r.projectId,
      name: r.name,
      pricingType: r.pricingType,
      agreedRate: r.agreedRate,
      currency: r.currency || 'SAR',
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo,
      carrierId: r.carrierId,
      materialId: r.materialId,
      status: r.status,
      _version: currentVersion,
      _cachedAt: now,
    }));

    await indexedDBService.putMany('pricingRules', pricingRulesToCache);
    await indexedDBService.setMetadata({
      storeName: 'pricingRules',
      version: currentVersion,
      timestamp: now,
      recordCount: pricingRulesToCache.length,
      lastSyncedBy: 'SYSTEM_SEED',
    });
  }

  `;

  content = content.substring(0, startIndex) + newSeedMethod + content.substring(endIndex);
  fs.writeFileSync('src/services/offline/offlineCache.service.ts', content);
  console.log('Successfully fixed offlineCache.service.ts');
} else {
  console.log('Could not find tags in offlineCache.service.ts');
}
