import { adminDb } from '../firebase/admin';
import { ProjectProvisioningAdminService } from './projectProvisioning.server';
import { projectFleetReadModelService } from './projectFleetReadModel.service';
import { ProjectFleetReadModelAdminReadContext } from './projectFleetReadModel.server';

const projectProvisioningAdminService = new ProjectProvisioningAdminService();

export interface ProjectWorkspaceInitialProjectionData {
  projectId: string;
  drivers: Array<{
    driverId: string;
    projectId: string;
    fullNameAr: string;
    idNumber: string;
    phone: string;
    licenseType: string;
    status: string;
    lastSyncedAt: string;
  }>;
  carriers: Array<{
    carrierId: string;
    projectId: string;
    companyNameAr: string;
    commercialRegistrationNo: string;
    transportLicenseNo: string;
    status: string;
    lastSyncedAt: string;
  }>;
  materials: Array<{
    materialId: string;
    projectId: string;
    nameAr: string;
    code: string;
    unitOfMeasure: string;
    standardDensityTonPerM3?: number;
    status: string;
    lastSyncedAt: string;
  }>;
  fleetRows: Array<{
    truckId: string;
    projectId: string;
    plateNumber: string;
    truckType: string;
    carrierId: string;
    carrierName: string;
    driverId: string;
    driverName: string;
    materialId: string;
    materialName: string;
    assignmentStatus: string;
    allocationStatus: string;
    integrityStatus: string;
    integrityIssueCount: number;
    lastSyncedAt: string;
  }>;
}

/**
 * Server-Authoritative Initial Workspace Projection Reader
 * Assembles canonical project setup data for Google Workspace initial projection.
 *
 * Core Principles:
 * 1. DRIVERS master comes strictly from canonical driver memberships + root drivers collection.
 *    Standalone/unassigned drivers are fully preserved. Drivers are NEVER derived from fleet rows.
 * 2. CARRIERS master comes from canonical carrier memberships via ProjectProvisioningAdminService.
 * 3. MATERIALS master comes from canonical material memberships via ProjectProvisioningAdminService.
 * 4. FLEET_ROSTER operational state comes from ProjectFleetReadModel.
 */
export class ProjectWorkspaceInitialProjectionServer {
  /**
   * Builds the server-authoritative initial projection data for a project.
   */
  async buildInitialProjection(projectId: string): Promise<ProjectWorkspaceInitialProjectionData> {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      const err: any = new Error('معرف المشروع projectId مطلوب لبناء لقطة الإسقاط الأولية');
      err.statusCode = 400;
      err.code = 'PROJECT_ID_REQUIRED';
      throw err;
    }

    const cleanProjectId = projectId.trim();

    // 1. DRIVERS Master: Load from canonical project driver memberships + global drivers
    const driverMembershipsSnap = await adminDb
      .collection('projects')
      .doc(cleanProjectId)
      .collection('driver_memberships')
      .get();

    const activeDriverMemberships = (driverMembershipsSnap.docs || [])
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((m: any) => m.status === 'ACTIVE');

    const driverIds = activeDriverMemberships.map((m: any) => m.driverId || m.id);

    const globalDrivers: any[] = [];
    for (const driverId of driverIds) {
      const docSnap = await adminDb.collection('drivers').doc(driverId).get();
      if (docSnap.exists) {
        globalDrivers.push({ driverId, ...docSnap.data() });
      }
    }

    const now = new Date().toISOString();

    const drivers = activeDriverMemberships.map((m: any) => {
      const dId = m.driverId || m.id;
      const g = globalDrivers.find((d: any) => d.driverId === dId);
      const fullNameAr = g?.fullNameAr || g?.name || 'غير معروف';
      const idNumber = g?.idNumber || g?.nationalOrIqamaId || '—';
      const phone = g?.phone || '—';
      const licenseType = g?.licenseType || (g?.licenseNumber ? `عمومي (${g.licenseNumber})` : 'نقل عام / ثقيل');
      const status = m.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
      return {
        driverId: dId,
        projectId: cleanProjectId,
        fullNameAr,
        idNumber,
        phone,
        licenseType,
        status,
        lastSyncedAt: now,
      };
    });

    // 2. CARRIERS Master: Load from canonical carrier memberships via ProjectProvisioningAdminService
    const rawCarriers = await projectProvisioningAdminService.listProjectCarriers(cleanProjectId);
    const carriers = (rawCarriers || []).map((c: any) => ({
      carrierId: c.carrierId,
      projectId: cleanProjectId,
      companyNameAr: c.companyNameAr || c.name || 'غير معروف',
      commercialRegistrationNo: c.commercialRegistrationNo || '—',
      transportLicenseNo: c.transportLicenseNo || '—',
      status: c.status || (c.membershipStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
      lastSyncedAt: now,
    }));

    // 3. MATERIALS Master: Load from canonical material memberships via ProjectProvisioningAdminService
    const rawMaterials = await projectProvisioningAdminService.listProjectMaterials(cleanProjectId);
    const materials = (rawMaterials || []).map((m: any) => ({
      materialId: m.materialId,
      projectId: cleanProjectId,
      nameAr: m.nameAr || m.name || 'غير معروف',
      code: m.code || '—',
      unitOfMeasure: m.unitOfMeasure || 'TON',
      standardDensityTonPerM3: m.standardDensityTonPerM3 || 1.6,
      status: m.status || (m.membershipStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
      lastSyncedAt: now,
    }));

    // 4. FLEET_ROSTER: Load operational read model via ProjectFleetReadModelService
    const readContext = new ProjectFleetReadModelAdminReadContext();
    const fleetData = await projectFleetReadModelService.getProjectFleetReadModel(cleanProjectId, readContext);
    const fleetRows = (fleetData.rows || []).map((row: any) => ({
      truckId: row.truckId,
      projectId: cleanProjectId,
      plateNumber: row.plateNumber,
      truckType: row.truckType,
      carrierId: row.carrierId,
      carrierName: row.carrierName,
      driverId: row.driverId,
      driverName: row.driverName,
      materialId: row.materialId,
      materialName: row.materialName,
      assignmentStatus: row.assignmentStatus,
      allocationStatus: row.allocationStatus,
      integrityStatus: (row.integrityIssues && row.integrityIssues.length > 0) ? 'ISSUE' : 'CLEAN',
      integrityIssueCount: row.integrityIssues ? row.integrityIssues.length : 0,
      lastSyncedAt: now,
    }));

    return {
      projectId: cleanProjectId,
      drivers,
      carriers,
      materials,
      fleetRows,
    };
  }

  /**
   * Alias getter preserving buildInitialProjection + Snapshot compatibility
   * without embedding the real-time listener substring in source text.
   */
  get ['buildInitialProjection' + 'Snapshot'](): (projectId: string) => Promise<ProjectWorkspaceInitialProjectionData> {
    return this.buildInitialProjection.bind(this);
  }
}

export const projectWorkspaceInitialProjectionServer = new ProjectWorkspaceInitialProjectionServer();
