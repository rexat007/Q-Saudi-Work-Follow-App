import { SetupFleetQuery } from './setupFleetQuery.server';
import { authorizeGlobalCommand, resolveGlobalNaturalIdentity } from './globalIdentityAuthority.server';
import type { ImportResolutionReadOptions } from '../types/importResolution';
import { adminDb } from '../firebase/admin';
import { buildPrincipal } from '../utils/principal';
import { decodeProject, decodeGlobal, PersistenceBoundaryError } from '../utils/persistenceBoundary';
import { GLOBAL_IDENTITIES, evaluateGlobalEligibility, validGlobalId, GlobalIdentityError, type GlobalKind } from '../utils/globalIdentityPolicy';
import { relationshipContextFromFleet } from '../utils/relationshipContextProjection';
import { ProjectFleetReadModelAdminReadContext } from './projectFleetReadModel.server';
import { projectFleetReadModelService, isFleetRowDefect, decodeFleetGlobal } from './projectFleetReadModel.service';
/** Retains participation even if display identity is missing/ineligible; never caches or writes. */
export async function readProjectMasterList(ctx: ProjectFleetReadModelAdminReadContext, p: string, kind: GlobalKind) {
  const memberships = await ctx.listActiveMemberships(kind, p), spec = GLOBAL_IDENTITIES[kind];
  return Promise.all(memberships.map(async membership => {
    const id = membership[spec.id]; let global: any = null, projectionIssue: string | undefined;
    try {
      const raw = await ({ DRIVER: () => ctx.getGlobalDriver(id), TRUCK: () => ctx.getGlobalTruck(id), CARRIER: () => ctx.getGlobalCarrier(id), MATERIAL: () => ctx.getGlobalMaterial(id) }[kind])();
      if (raw) { global = decodeFleetGlobal(kind, raw, id); }
      else projectionIssue = 'GLOBAL_ENTITY_MISSING';
    } catch (e) { if (!isFleetRowDefect(e)) throw e; global = null; projectionIssue = 'GLOBAL_ENTITY_INVALID'; }
    return { id, membership, global, eligible: evaluateGlobalEligibility(kind, global).CAN_USE_OPERATIONALLY, projectionIssue };
  }));
}
export class ProjectFleetQueryService {
  constructor(private database: any = adminDb) {}
  private async authorize(tx: any, p: string, identity: { userId: string; email?: string }) {
    if (!validGlobalId(p) || !validGlobalId(identity?.userId)) throw new GlobalIdentityError('FORBIDDEN_PROJECT_ACCESS', '', 403);
    const account = await tx.get(this.database.collection('users').doc(identity.userId));
    let actor: ReturnType<typeof buildPrincipal>;
    try { actor = buildPrincipal(account.exists ? account.data() : null, identity.userId, { email: identity.email }); }
    catch { throw new GlobalIdentityError('FORBIDDEN_PROJECT_ACCESS', '', 403); }
    if (actor.role !== 'SUPER_ADMIN' && !actor.assignedProjectIds.includes(p)) throw new GlobalIdentityError('FORBIDDEN_PROJECT_ACCESS', '', 403);
    const project = await tx.get(this.database.collection('projects').doc(p));
    if (!project.exists) throw new GlobalIdentityError('PROJECT_NOT_FOUND', '', 404);
    decodeProject(project.data(), p);
    return actor;
  }
  /** All foundation projections share the transaction read snapshot. No independently fetched surface is merged. */
  async foundation(p: string, identity: {userId:string;email?:string}) {
    const {ProjectProvisioningAdminService}=await import('./projectProvisioning.server');
    const {ProjectReadinessAdminReadContext}=await import('./projectReadiness.server');
    const {ProjectReadinessService}=await import('./projectReadiness.service');
    const {ProjectPricingServerService}=await import('./projectPricing.server');
    return this.database.runTransaction(async(tx:any)=>{
      const principal=await this.authorize(tx,p,identity);
      if(!['PROJECT_ADMIN','SUPER_ADMIN','FINANCE_AUDITOR'].includes(principal.role))throw new GlobalIdentityError('FORBIDDEN_PROJECT_ACCESS','',403);
      const reads=new ProjectFleetReadModelAdminReadContext(this.database,ref=>tx.get(ref));
      const provisioning=new ProjectProvisioningAdminService();
      const [materials,carriers,relationshipContext,setup,readiness,projectSnap,pricingRules]=await Promise.all([
        provisioning.listProjectMaterials(p,reads),provisioning.listProjectCarriers(p,reads),
        this.contextInTransaction(tx,p,identity,principal),new SetupFleetQuery(this.database).readProjection(p,ref=>tx.get(ref),principal.role!=='FINANCE_AUDITOR'),
        new ProjectReadinessService().evaluateProjectReadiness(p,new Date(),new ProjectReadinessAdminReadContext(this.database,ref=>tx.get(ref)),principal),
        tx.get(this.database.collection('projects').doc(p)),new ProjectPricingServerService(this.database).listPricingRulesInTransaction(tx,p)
      ]);
      if(principal.role==='FINANCE_AUDITOR')setup.participants=setup.participants.filter(participant=>participant.membershipStatus==='ACTIVE'&&participant.eligible).map(({profile,naturalKey,aliases,...participant})=>({...participant,canReactivate:false}));
      return {projectId:p,pricingRules,consistency:'SERVER_TRANSACTION_SNAPSHOT',project:decodeProject(projectSnap.data(),p),materials,carriers,fleetRows:setup.fleet.rows,relationshipContext,setup,readiness};
    });
  }
  async fleet(p: string, actor: { userId: string; email?: string }) {
    return this.database.runTransaction(async (tx: any) => {
      await this.authorize(tx, p, actor);
      return projectFleetReadModelService.getProjectFleetReadModel(p, new ProjectFleetReadModelAdminReadContext(this.database, ref => tx.get(ref)));
    });
  }
  async context(p: string, actor: { userId: string; email?: string }, options?: ImportResolutionReadOptions) {
    return this.database.runTransaction(async (tx: any) => {
      const principal = await this.authorize(tx, p, actor);
      if (options?.resolution && !['PROJECT_ADMIN','SUPER_ADMIN','DISPATCHER','SUPERVISOR','SITE_SUPERVISOR'].includes(principal.role)) throw new GlobalIdentityError('FORBIDDEN_PROJECT_ACCESS','',403);
      return this.contextInTransaction(tx, p, actor, principal, options);
    });
  }
  /** Internal read composition; outer authority owns the transaction and current actor. */
  async contextInTransaction(tx: any, p: string, actor: { userId: string; email?: string }, principal: ReturnType<typeof buildPrincipal>, options?: ImportResolutionReadOptions) {
      const ctx = new ProjectFleetReadModelAdminReadContext(this.database, ref => tx.get(ref));
      const [fleet, carriers, materials, drivers, trucks] = await Promise.all([projectFleetReadModelService.getProjectFleetReadModel(p, ctx), readProjectMasterList(ctx, p, 'CARRIER'), readProjectMasterList(ctx, p, 'MATERIAL'), readProjectMasterList(ctx, p, 'DRIVER'), readProjectMasterList(ctx, p, 'TRUCK')]);
      const knownCarriers = carriers.filter(c => c.eligible).map(c => ({ carrierId: c.id, name: c.global.nameAr || c.id, status: 'ACTIVE' as const }));
      const knownMaterials = materials.filter(m => m.eligible).map(m => ({ materialId: m.id, name: m.global.nameAr || m.global.nameEn || m.id, code: m.global.code || '', status: 'ACTIVE' as const }));
      const carrier = async (kind: 'DRIVER' | 'TRUCK', id: string) => {
        try { const affiliation = await (kind === 'DRIVER' ? ctx.getDriverCarrierAffiliation(p, id) : ctx.getTruckCarrierAffiliation(p, id)); return affiliation?.status === 'ACTIVE' && knownCarriers.some(c => c.carrierId === affiliation.carrierId) ? affiliation.carrierId : ''; }
        catch (e) { if (!isFleetRowDefect(e)) throw e; return ''; }
      };
      const knownDrivers = await Promise.all(drivers.filter(d => d.eligible).map(async d => ({ driverId: d.id, name: d.global.fullNameAr || d.id, phone: d.global.phone, idNumber: d.global.nationalId, carrierId: await carrier('DRIVER', d.id), status: 'ACTIVE' as const })));
      const knownTrucks = await Promise.all(trucks.filter(t => t.eligible).map(async t => ({ truckId: t.id, plate: t.global.plate || t.global.normalizedPlate || t.id, carrierId: await carrier('TRUCK', t.id), status: 'ACTIVE' as const })));
      const result = relationshipContextFromFleet(p, fleet, { knownCarriers, knownMaterials, knownDrivers, knownTrucks, authorizedCarrierIds: knownCarriers.map(c => c.carrierId), authorizedMaterialIds: knownMaterials.map(m => m.materialId) });
      if (options?.resolution) {
        const projection = await new SetupFleetQuery(this.database).readProjection(p, ref => tx.get(ref));
        const entities = [...projection.participants];
        if (options.kind || options.naturalKey !== undefined) {
          // Targeted natural-key read uses the same current-principal capability as enrollment.
          // No Global catalog enumeration and no browser repository fallback.
          await authorizeGlobalCommand(tx, this.database, actor, p);
          if (!options.kind || typeof options.naturalKey !== 'string') throw new GlobalIdentityError('INVALID_NATURAL_KEY');
          const found = await resolveGlobalNaturalIdentity(tx, this.database, options.kind, options.naturalKey);
          if (found.id && !entities.some(e => e.kind === options.kind && e.id === found.id)) {
            const value = found.entity!, spec = GLOBAL_IDENTITIES[options.kind], policy = evaluateGlobalEligibility(options.kind, value);
            // No membership in this Project: no affiliation/temporal authority is inferred.
            return { ...result, importResolution: { projectId: p, lookup: { kind: options.kind, naturalKey: options.naturalKey, matchedId: found.id }, entities: [...entities, { kind: options.kind, id: found.id, name: value.fullNameAr || value.nameAr || value.nameEn || value.plate || found.id, naturalKey: value[spec.natural], globalStatus: value.status, membershipStatus: null, eligible: false, canReactivate: policy.CAN_REACTIVATE_MEMBERSHIP, affiliation: null }], activeDriverByTruck: result.activeDriverByTruck, activeMaterialByTruck: result.activeMaterialByTruck } };
          }
          return { ...result, importResolution: { projectId:p, lookup:{kind:options.kind,naturalKey:options.naturalKey,matchedId:found.id}, entities, activeDriverByTruck:result.activeDriverByTruck,activeMaterialByTruck:result.activeMaterialByTruck } };
        }
        return { ...result, importResolution: { projectId: p, entities, activeDriverByTruck: result.activeDriverByTruck, activeMaterialByTruck: result.activeMaterialByTruck } };
      }
      return result;
  }
}
