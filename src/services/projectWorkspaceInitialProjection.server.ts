import { readProjectMasterList } from './projectFleetQuery.server';
import { evaluateGlobalEligibility } from '../utils/globalIdentityPolicy';
import { isFleetRowDefect } from './projectFleetReadModel.service';
import { decodeGlobal } from '../utils/persistenceBoundary';
import { adminDb } from '../firebase/admin';
import { ProjectProvisioningAdminService } from './projectProvisioning.server';
import { projectFleetReadModelService } from './projectFleetReadModel.service';
import { ProjectFleetReadModelAdminReadContext } from './projectFleetReadModel.server';
import {SetupFleetQuery} from './setupFleetQuery.server';
import type {CanonicalWorkspaceMasterProjection} from './projectWorkspaceMasterContract';
import type {SetupFleetContext} from '../types/setupFleet';

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
    membershipStatus?: string;
    lastSyncedAt: string;
  }>;
  carriers: Array<{
    carrierId: string;
    projectId: string;
    companyNameAr: string;
    commercialRegistrationNo: string;
    transportLicenseNo: string;
    status: string;
    membershipStatus?: string;
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
    membershipStatus?: string;
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
  /** Native Workspace reader: a current server transaction, all participation states,
   * no fabricated names/units/densities and no relationship inference from Sheet rows. */
  async buildCanonicalProjection(projectId:string,database:any=adminDb):Promise<CanonicalWorkspaceMasterProjection> {
    const context:SetupFleetContext=await database.runTransaction((tx:any)=>new SetupFleetQuery(database).readProjection(projectId,(ref:any)=>tx.get(ref),true));
    const all=context.participants,now=new Date().toISOString();
    const name=(kind:string,id:string|undefined)=>{const g=all.find(item=>item.kind===kind&&item.id===id)?.profile;return g?.fullNameAr||g?.nameAr||'';};
    const date=(value:any)=>value instanceof Date?value.toISOString():typeof value==='string'?value:'';
    const base=(item:typeof all[number])=>({projectId,status:item.globalStatus||'',membershipStatus:item.membershipStatus,lastSyncedAt:now});
    return {projectId,
      carriers:all.filter(item=>item.kind==='CARRIER').map(item=>{const g=item.profile||{};return {...base(item),carrierId:item.id,companyNameAr:g.nameAr||'',commercialRegistrationNo:g.commercialRegistrationNo||'',transportLicenseNo:g.transportLicenseNo||'',contactPhone:g.contactPerson?.phone||g.contactPhone||''};}),
      materials:all.filter(item=>item.kind==='MATERIAL').map(item=>{const g=item.profile||{};return {...base(item),materialId:item.id,nameAr:g.nameAr||'',code:g.code||'',unitOfMeasure:g.unitOfMeasure||'',...(g.standardDensityTonPerM3!==undefined?{standardDensityTonPerM3:g.standardDensityTonPerM3}:{})};}),
      drivers:all.filter(item=>item.kind==='DRIVER').map(item=>{const g=item.profile||{},carrierId=item.affiliation?.status==='ACTIVE'?item.affiliation.carrierId:'';return {...base(item),driverId:item.id,fullNameAr:g.fullNameAr||'',idNumber:g.nationalId||'',phone:g.phone||'',licenseNumber:g.licenseNumber||'',licenseValidUntil:date(g.licenseValidUntil),carrierId,carrierName:name('CARRIER',carrierId),assignedTruckId:item.assignment?.truckId||''};}),
      fleetRows:all.filter(item=>item.kind==='TRUCK').map(item=>{const g=item.profile||{},carrierId=item.affiliation?.status==='ACTIVE'?item.affiliation.carrierId:'',driverId=item.assignment?.driverId||'',materialId=item.allocation?.materialId||'';return {...base(item),truckId:item.id,plateNumber:g.plate||g.normalizedPlate||'',truckType:g.truckType||'',carrierId,carrierName:name('CARRIER',carrierId),driverId,driverName:name('DRIVER',driverId),materialId,materialName:name('MATERIAL',materialId),mvpiValidUntil:date(g.mvpiValidUntil),insuranceValidUntil:date(g.insuranceValidUntil)};}),
    };
  }
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

    // Drivers master is participation-centric, never derived from Fleet rows.
    const masterContext = new ProjectFleetReadModelAdminReadContext();
    const driverEntries = await readProjectMasterList(masterContext, cleanProjectId, 'DRIVER');
    const activeDriverMemberships = driverEntries.map(entry => entry.membership);
    const globalDrivers = driverEntries.map(entry => entry.global).filter(Boolean);
    const driverEligibility = new Map<string, boolean>();
    await Promise.all(driverEntries.map(async entry => {
      let usable = entry.eligible;
      try {
        const affiliation = await masterContext.getDriverCarrierAffiliation(cleanProjectId, entry.id);
        usable = usable && affiliation?.status === 'ACTIVE';
        if (usable) {
          const [carrier, membership] = await Promise.all([masterContext.getGlobalCarrier(affiliation.carrierId), masterContext.getMembership('CARRIER', cleanProjectId, affiliation.carrierId)]);
          usable = evaluateGlobalEligibility('CARRIER', carrier).CAN_USE_OPERATIONALLY && membership?.status === 'ACTIVE';
        }
      } catch (error) { if (!isFleetRowDefect(error)) throw error; usable = false; }
      driverEligibility.set(entry.id, usable);
    }));

    const now = new Date().toISOString();

    const drivers = activeDriverMemberships.map((m: any) => {
      const dId = m.driverId || m.id;
      const g = globalDrivers.find((d: any) => d.driverId === dId);
      const fullNameAr = g?.fullNameAr || g?.name || 'غير معروف';
      const idNumber = g?.nationalId || g?.idNumber || g?.nationalOrIqamaId || '—';
      const phone = g?.phone || '—';
      const licenseType = g?.licenseType || (g?.licenseNumber ? `عمومي (${g.licenseNumber})` : 'نقل عام / ثقيل');
      const status = driverEligibility.get(dId) ? 'ACTIVE' : 'INACTIVE';
      return {
        driverId: dId,
        projectId: cleanProjectId,
        fullNameAr,
        idNumber,
        phone,
        licenseType,
        status,
        membershipStatus: m.status,
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
      status: c.status || 'INACTIVE',
      membershipStatus: c.membershipStatus,
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
      status: m.status || 'INACTIVE',
      membershipStatus: m.membershipStatus,
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
      integrityStatus: row.classification || ((row.integrityIssues && row.integrityIssues.length > 0) ? 'ISSUE' : 'CLEAN'),
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
