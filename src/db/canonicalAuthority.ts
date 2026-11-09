/** AR2-U02 SQL authority. Deliberately not connected to production API routes. */
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { GlobalIdentityError, assertOperationallyEligible, GLOBAL_IDENTITIES, validGlobalId, type GlobalKind } from '../utils/globalIdentityPolicy';
import { planMembershipStatus, type MembershipCommand } from '../utils/projectMembershipPolicy';
import { assertFoundationMutation } from '../services/projectMutability.policy';
import { resolveUserAuthContext, type DecodedFirebaseToken } from './authAdapter.js';
import { withUnitOfWork, type UnitOfWork } from './unitOfWork.js';
import { IdentityProtection, stableValue } from './identityProtection.js';
import { CanonicalIdentityRepository, canonicalProfile, identitySpec, type CreateIdentityInput } from './canonicalIdentityRepository.js';
import { TemporalRelationshipRepository } from './temporalRelationshipRepository.js';

export interface Scope { companyId: string; projectId: string }
export interface CommandScope extends Scope { operationId: string }
export interface CreateCanonicalCommand extends CommandScope, CreateIdentityInput {}
export interface MembershipMutation extends CommandScope {
  kind: GlobalKind; entityId: string; command: MembershipCommand; expectedRevision: number; reason?: string;
}
export interface GlobalStatusMutation extends CommandScope {
  kind: GlobalKind; entityId: string; status: string; expectedRevision: number;
}
export interface SqlAuthorityDependencies {
  /** Server composition only. No client-controlled backend selection. */
  backendFence?:Readonly<{backendEpoch:string;epochRevision:number}>;
  runtimePool?: Pool; authPool?: Pool;
  /** Server composition/test seam, never populated from a browser request. */
  verifyToken?: (idToken: string) => Promise<DecodedFirebaseToken>;
}

function fail(code: string): never {
  throw new GlobalIdentityError(code,'',code==='INVALID_TOKEN' ? 401 : code==='FORBIDDEN_GLOBAL_COMMAND' ? 403 : 409);
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function revision(value: unknown) { if (!Number.isSafeInteger(value) || Number(value) < 0) fail('REVISION_CONFLICT'); }
function keys(value: object, allowed: string[]) {
  if (!value || Object.keys(value).some(key => !allowed.includes(key))) fail('INVALID_PARTICIPATION_COMMAND');
}
const scopeKeys = ['companyId','projectId','operationId'];

export class SqlCanonicalAuthority {
  protected readonly actorRoles = new WeakMap<UnitOfWork,string>();
  private readonly fence:SqlAuthorityDependencies['backendFence'];
  constructor(private readonly dependencies: SqlAuthorityDependencies = {}) {this.fence=dependencies.backendFence?Object.freeze({...dependencies.backendFence}):undefined;}
  backendFence(){return this.fence?{...this.fence}:undefined;}

  protected async authenticated(idToken: string, company: string) {
    if (!idToken || typeof idToken !== 'string' || !uuid(company)) fail('FORBIDDEN_GLOBAL_COMMAND');
    let token: DecodedFirebaseToken;
    try {
      token = this.dependencies.verifyToken ? await this.dependencies.verifyToken(idToken)
        : await (await import('../firebase/admin.js')).adminAuth.verifyIdToken(idToken, true);
    } catch { fail('INVALID_TOKEN'); }
    // Only the verified UID identifies the actor. Commercial claims are ignored.
    return resolveUserAuthContext({ uid: token.uid }, company, this.dependencies.authPool);
  }

  /** Server-owned specialization for later command domains; never request configurable. */
  protected async authorize(uow:UnitOfWork,governance:boolean) {
    return (await uow.query('SELECT * FROM qsa_authorize_canonical_command($1)',[governance])).rows[0];
  }

  protected async scoped<T>(idToken: string, scope: Scope, governance: boolean,
    work: (uow: UnitOfWork, protection: IdentityProtection, repository: CanonicalIdentityRepository) => Promise<T>): Promise<T> {
    const protection = new IdentityProtection();
    if (!validGlobalId(scope.projectId)) fail('PROJECT_NOT_FOUND');
    const auth = await this.authenticated(idToken, scope.companyId);
    try {
      return await withUnitOfWork({ companyId: auth.companyId, actorId: auth.userId }, async uow => {
        const projects = await uow.query('SELECT id FROM projects WHERE company_id=$1 AND (id::text=$2 OR external_id=$2)',
          [auth.companyId,scope.projectId]);
        if (projects.rowCount !== 1) fail('PROJECT_NOT_FOUND');
        const projectId = projects.rows[0].id;
        // U03 must take the same project command lock before adding dependencies.
        await uow.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`canonical-project/${auth.companyId}/${projectId}`]);
        uow.context.projectId = projectId;
        await uow.query("SELECT set_config('app.project_id',$1,true)", [projectId]);
        if(this.fence)await uow.query('SELECT qsa_assert_runtime_writer($1,$2)',[this.fence.backendEpoch,this.fence.epochRevision]);
        const authorized = await this.authorize(uow,governance);
        this.actorRoles.set(uow,authorized.commercial_role);
        await uow.query("SELECT set_config('app.commercial_role',$1,true)",[authorized.commercial_role]);
        try { return await work(uow,protection,new CanonicalIdentityRepository(uow,protection)); }
        finally { this.actorRoles.delete(uow); }
      }, this.dependencies.runtimePool);
    } catch (error: any) {
      if(error?.code==='P0001'&&error?.message==='RUNTIME_ENFORCEMENT_UNVERIFIED')throw new GlobalIdentityError('RUNTIME_ENFORCEMENT_UNVERIFIED','',503);
      if(error?.code==='P0001'&&error?.message==='BACKEND_EPOCH_MISMATCH')throw new GlobalIdentityError('BACKEND_EPOCH_MISMATCH','',409);
      if (error instanceof GlobalIdentityError || error?.name === 'AuthorizationError' || error?.name === 'AuthenticationError') throw error;
      if (['PROJECT_LIFECYCLE_MUTATION_DENIED'].includes(error?.code)) throw error;
      if (error?.code==='42501' && ['ACCOUNT_NOT_ACTIVE','FORBIDDEN_GLOBAL_COMMAND','PROJECT_NOT_FOUND'].includes(error.message)) {
        throw new GlobalIdentityError(error.message,'',error.message==='PROJECT_NOT_FOUND' ? 409 : 403);
      }
      const codes: Record<string,string> = { '23505':'CANONICAL_IDENTITY_CONFLICT','23503':'CANONICAL_SCOPE_CONFLICT',
        '23514':'CANONICAL_CONTRACT_VIOLATION','23P01':'TEMPORAL_RELATIONSHIP_CONFLICT','42501':'FORBIDDEN_GLOBAL_COMMAND','40001':'CANONICAL_CONCURRENCY_RETRY',
        '40P01':'CANONICAL_CONCURRENCY_RETRY' };
      // PostgreSQL error details can contain natural keys. Never expose or log them.
      throw new GlobalIdentityError(codes[error?.code] || 'SQL_AUTHORITY_UNAVAILABLE', '', error?.code==='42501' ? 403 : codes[error?.code] ? 409 : 503);
    }
  }

  protected async command<T>(token: string, input: CommandScope, payload: unknown, governance: boolean,
    execute: (uow: UnitOfWork, repository: CanonicalIdentityRepository, protection: IdentityProtection) => Promise<T>) {
    if (!uuid(input.operationId)) fail('INVALID_OPERATION_ID');
    return this.scoped(token,input,governance,async (uow,protection,repository) => {
      const {companyId,projectId,actorId} = uow.context;
      const hash = protection.digest('command',stableValue([companyId,projectId,actorId,payload])).toString('hex');
      const scope = `${companyId}/${projectId}/receipt/${input.operationId}`;
      const previous = await uow.query(`SELECT actor_id,request_hash,state,result_encrypted FROM idempotency_receipts
        WHERE company_id=$1 AND project_id=$2 AND operation_id=$3 FOR UPDATE`,[companyId,projectId,input.operationId]);
      if (previous.rowCount) {
        const receipt = previous.rows[0];
        if (receipt.actor_id !== actorId || receipt.request_hash !== hash) fail('IDEMPOTENCY_PAYLOAD_MISMATCH');
        if (receipt.state !== 'COMMITTED' || !receipt.result_encrypted) fail('IDEMPOTENCY_STATE_CONFLICT');
        return protection.open<T>(receipt.result_encrypted,scope);
      }
      await uow.checkOrAcquireIdempotency(input.operationId,hash);
      await uow.query("SELECT set_config('app.operation_id',$1,true)",[input.operationId]);
      const result = JSON.parse(JSON.stringify(await execute(uow,repository,protection))) as T;
      await uow.query(`UPDATE idempotency_receipts SET state='COMMITTED',result_encrypted=$4
        WHERE company_id=$1 AND project_id=$2 AND operation_id=$3`,
      [companyId,projectId,input.operationId,protection.seal(result,scope)]);
      return result;
    });
  }

  protected async lifecycle(uow: UnitOfWork, cleanup: boolean) {
    const row = (await uow.query('SELECT status FROM projects WHERE company_id=$1 AND id=$2',
      [uow.context.companyId,uow.context.projectId])).rows[0];
    assertFoundationMutation(row?.status,cleanup ? 'CONSISTENCY_CLEANUP' : 'NEW_OPERATION');
  }

  protected async consequence(uow: UnitOfWork, protection: IdentityProtection, kind: string, entity: string,
    operation: string, action: string, before: unknown, after: unknown, version: number, metadata?:Record<string,unknown>) {
    const actorRole = this.actorRoles.get(uow);
    if (!actorRole) fail('FORBIDDEN_GLOBAL_COMMAND');
    await uow.query(`INSERT INTO audit_events
      (id,company_id,project_id,actor_id,actor_role,action,entity_kind,entity_id,operation_id,before_digest,after_digest)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [randomUUID(),uow.context.companyId,uow.context.projectId,uow.context.actorId,actorRole,action,kind,entity,operation,
      protection.digest('audit',stableValue(before)).toString('hex'),protection.digest('audit',stableValue(after)).toString('hex')]);
    await uow.stageOutbox({ projectId:uow.context.projectId!,aggregateType:kind,aggregateId:entity,
      eventType:action,aggregateVersion:version,payload:{ schemaVersion:1,entityKind:kind,entityId:entity,
        operationId:operation,revision:version,actorId:uow.context.actorId,actorRole,...(metadata?{context:metadata}:{}) } });
  }

  async create(token: string, input: CreateCanonicalCommand) {
    keys(input,[...scopeKeys,'kind','naturalKey','profile','externalId','source']);
    const profile = canonicalProfile(input);
    // Hash normalized identity/profile semantics; never write raw request hashes.
    const payload = { type:'CREATE',kind:input.kind,profile,externalId:input.externalId,source:input.source };
    return this.command(token,input,payload,false,(uow,repository,protection) => this.createWithin(uow,repository,protection,input));
  }

  /** Internal composition: caller must hold this authority's scoped command UoW. */
  protected async createWithin(uow:UnitOfWork,repository:CanonicalIdentityRepository,protection:IdentityProtection,input:CreateCanonicalCommand) {
      await this.lifecycle(uow,false);
      const result = await repository.create(input,input.operationId);
      if (result.changed) await this.consequence(uow,protection,input.kind,result.identity.externalId,input.operationId,
        result.created ? 'CANONICAL_IDENTITY_CREATED' : 'LEGACY_IDENTITY_MAPPED',null,
        { id:result.identity.id,status:result.identity.status },result.identity.revision);
      return { identity:result.identity,created:result.created,idempotent:!result.changed };
  }

  async resolve(token: string, scope: Scope, kind: GlobalKind, naturalKey: string) {
    identitySpec(kind);
    return this.scoped(token,scope,false,(_uow,_protection,repository) => repository.resolve(kind,naturalKey));
  }

  async resolveLegacy(token: string, scope: Scope, kind: GlobalKind, source: { legacyId: string; firestorePath: string }) {
    const spec = GLOBAL_IDENTITIES[kind];
    if (!spec || !source || Object.keys(source).some(k=>!['legacyId','firestorePath'].includes(k))
      || !validGlobalId(source.legacyId) || source.firestorePath !== `${spec.collection}/${source.legacyId}`) fail('INVALID_LEGACY_IDENTITY_MAPPING');
    return this.scoped(token,scope,false,async (uow,protection,repository) => {
      const key = protection.digest('legacy',[uow.context.companyId,kind,source.firestorePath]);
      const result = await uow.query('SELECT source_encrypted,target_external_id FROM legacy_identity_mappings WHERE company_id=$1 AND kind=$2 AND source_key_hmac=$3',
        [uow.context.companyId,kind,key]);
      if (!result.rowCount) return null;
      const actual = protection.open(result.rows[0].source_encrypted,`${uow.context.companyId}/${kind}/legacy/${key.toString('hex')}`);
      if (JSON.stringify(stableValue(actual)) !== JSON.stringify(stableValue(source))) fail('IDENTITY_LOOKUP_INTEGRITY_ERROR');
      return repository.toIdentity(kind,await repository.get(kind,result.rows[0].target_external_id));
    });
  }

  async setStatus(token: string, input: GlobalStatusMutation) {
    keys(input,[...scopeKeys,'kind','entityId','status','expectedRevision']);
    identitySpec(input.kind); revision(input.expectedRevision);
    if (!(GLOBAL_IDENTITIES[input.kind].statuses as readonly string[]).includes(input.status)) fail('INVALID_GLOBAL_STATUS');
    return this.command(token,input,{ type:'STATUS',...input },true,async (uow,repository,protection) => {
      const before = await repository.get(input.kind,input.entityId,true);
      if (Number(before.revision) !== input.expectedRevision) fail('REVISION_CONFLICT');
      if (before.status === input.status) return { identity:repository.toIdentity(input.kind,before),idempotent:true };
      const after = (await uow.query(`UPDATE ${identitySpec(input.kind).table} SET status=$1,revision=revision+1,
        updated_at=clock_timestamp(),updated_by=$2 WHERE company_id=$3 AND id=$4 AND revision=$5 RETURNING *`,
      [input.status,uow.context.actorId,uow.context.companyId,before.id,input.expectedRevision])).rows[0];
      if (!after) fail('REVISION_CONFLICT');
      await this.consequence(uow,protection,input.kind,before.external_id,input.operationId,'CANONICAL_IDENTITY_STATUS_CHANGED',
        { status:before.status,revision:before.revision },{ status:after.status,revision:after.revision },Number(after.revision));
      return { identity:repository.toIdentity(input.kind,after),idempotent:false };
    });
  }

  async membership(token: string, input: MembershipMutation) {
    keys(input,[...scopeKeys,'kind','entityId','command','expectedRevision','reason']);
    const spec = identitySpec(input.kind); revision(input.expectedRevision);
    if (input.reason !== undefined && (typeof input.reason !== 'string' || input.reason.length > 2000)) fail('INVALID_PARTICIPATION_COMMAND');
    return this.command(token,input,{ type:'MEMBERSHIP',...input },false,(uow,repository,protection) => this.membershipWithin(uow,repository,protection,input));
  }

  protected async membershipWithin(uow:UnitOfWork,repository:CanonicalIdentityRepository,protection:IdentityProtection,input:MembershipMutation) {
      const spec=identitySpec(input.kind);
      const cleanup = ['SUSPEND','REMOVE'].includes(input.command);
      await this.lifecycle(uow,cleanup);
      const global = await repository.get(input.kind,input.entityId,true);
      const result = await uow.query(`SELECT * FROM ${spec.member} WHERE company_id=$1 AND project_id=$2 AND ${spec.field}=$3 FOR UPDATE`,
        [uow.context.companyId,uow.context.projectId,global.id]);
      const before = result.rows[0];
      const decision = planMembershipStatus(input.kind,input.command,before?.status ?? null,global);
      const temporal=new TemporalRelationshipRepository(uow,repository,this.actorRoles.get(uow)!,input.operationId,
        (kind,id,action,old,next,version,metadata)=>this.consequence(uow,protection,kind,id,input.operationId,action,old,next,version,metadata));
      const plans=cleanup&&input.kind!=='CARRIER'?await temporal.membershipPlans(input.kind,global.id):[];
      if (cleanup&&input.kind==='CARRIER') await this.guardDependencies(uow,input.kind,global.id);
      // Preserve same-state idempotency; a stale revision never changes a row.
      if (!decision.changed&&!plans.length) return { membership:await this.membershipRecord(uow,input.kind,before,global.external_id),idempotent:true,closedRelationships:[] };
      if ((before ? Number(before.revision) : 0) !== input.expectedRevision) fail('REVISION_CONFLICT');
      const closedRelationships=await temporal.closeMembership(plans,{kind:input.kind,entityId:global.external_id,command:input.command},input.reason);
      if(!decision.changed) return {membership:await this.membershipRecord(uow,input.kind,before,global.external_id),idempotent:false,closedRelationships};
      const now = plans.length?await temporal.at():(await uow.query('SELECT clock_timestamp()::text AS now')).rows[0].now;
      if (before && (await uow.query('SELECT lower($1::tstzrange)>$2::timestamptz AS future',[before.valid_period,now])).rows[0].future) fail('MEMBERSHIP_NOT_EFFECTIVE');
      const id = before?.id || randomUUID(), next = input.expectedRevision+1;
      let after: any;
      if (before) {
        after = (await uow.query(`UPDATE ${spec.member} SET status=$1,revision=$2,updated_by=$3,updated_at=$4,
          status_changed_at=$4,status_reason=coalesce($5,status_reason),valid_period=tstzrange($4,NULL,'[)')
          WHERE company_id=$6 AND project_id=$7 AND id=$8 AND revision=$9 RETURNING *`,
        [decision.status,next,uow.context.actorId,now,input.reason ?? null,uow.context.companyId,uow.context.projectId,id,input.expectedRevision])).rows[0];
      } else {
        after = (await uow.query(`INSERT INTO ${spec.member}
          (id,company_id,project_id,${spec.field},status,revision,created_at,created_by,updated_at,updated_by,status_changed_at,status_reason,valid_period)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$7,$8,$7,$9,tstzrange($7,NULL,'[)')) RETURNING *`,
        [id,uow.context.companyId,uow.context.projectId,global.id,decision.status,next,now,uow.context.actorId,input.reason ?? null])).rows[0];
      }
      if (!after) fail('REVISION_CONFLICT');
      await uow.query(`INSERT INTO ${spec.member}_history
        (id,company_id,project_id,membership_id,revision,previous_status,status,previous_period,effective_at,actor_id,operation_id,reason,actor_role)
        VALUES($1,$2,$3,$4,$5,$6,$7,CASE WHEN $8::tstzrange IS NULL THEN NULL ELSE
          tstzrange(lower($8::tstzrange),least(coalesce(upper($8::tstzrange),$9),$9),'[)') END,$9,$10,$11,$12,$13)`,
      [randomUUID(),uow.context.companyId,uow.context.projectId,id,next,before?.status ?? null,decision.status,
        before?.valid_period ?? null,now,uow.context.actorId,input.operationId,input.reason ?? before?.status_reason ?? null,this.actorRoles.get(uow)]);
      await this.consequence(uow,protection,input.kind,global.external_id,input.operationId,`MEMBERSHIP_${input.command}`,
        before ? { status:before.status,revision:before.revision } : null,{ status:after.status,revision:after.revision },next);
      return { membership:await this.membershipRecord(uow,input.kind,after,global.external_id),idempotent:false,closedRelationships };
  }

  private async membershipRecord(uow: UnitOfWork, kind: GlobalKind, row: any, external: string) {
    const project = (await uow.query('SELECT external_id FROM projects WHERE company_id=$1 AND id=$2',
      [uow.context.companyId,uow.context.projectId])).rows[0];
    return { id:row.id,internalProjectId:row.project_id,projectId:project.external_id,
      [GLOBAL_IDENTITIES[kind].id]:external,status:row.status,revision:Number(row.revision),validPeriod:row.valid_period,
      createdAt:row.created_at,createdBy:row.created_by,updatedAt:row.updated_at,updatedBy:row.updated_by,
      statusChangedAt:row.status_changed_at,statusReason:row.status_reason,
      legacyId:row.legacy_id,legacyFirestorePath:row.legacy_firestore_path };
  }

  async operationalIdentity(token: string, scope: Scope, kind: GlobalKind, entityId: string) {
    const spec = identitySpec(kind);
    return this.scoped(token,scope,false,async (uow,_protection,repository) => {
      const row = await repository.get(kind,entityId);
      assertOperationallyEligible(kind,row);
      const member = await uow.query(`SELECT id FROM ${spec.member} WHERE company_id=$1 AND project_id=$2
        AND ${spec.field}=$3 AND status='ACTIVE' AND valid_period @> clock_timestamp()`,[uow.context.companyId,uow.context.projectId,row.id]);
      if (!member.rowCount) fail('ENTITY_MEMBERSHIP_NOT_ACTIVE');
      return repository.toIdentity(kind,row);
    });
  }

  private async guardDependencies(uow: UnitOfWork, kind: GlobalKind, id: string) {
    const scope = [uow.context.companyId,uow.context.projectId,id];
    const present = async (table: string, predicate: string, period='valid_period') => Boolean((await uow.query(
      `SELECT 1 FROM ${table} WHERE company_id=$1 AND project_id=$2 AND (${predicate}) AND ${period} && tstzrange(clock_timestamp(),NULL,'[)') LIMIT 1`,scope)).rowCount);
    const accepted = "record_status='ACCEPTED' AND voided_at IS NULL";
    let dependency = false;
    if (kind === 'DRIVER' || kind === 'TRUCK') {
      dependency = await present(`${kind.toLowerCase()}_carrier_affiliations`,`${kind.toLowerCase()}_id=$3 AND ${accepted}`)
        || await present('driver_truck_assignments',`${kind.toLowerCase()}_id=$3 AND ${accepted}`);
      if (kind === 'TRUCK') dependency ||= await present('truck_material_allocations',`truck_id=$3 AND ${accepted}`);
    } else if (kind === 'MATERIAL') dependency = await present('truck_material_allocations',`material_id=$3 AND ${accepted}`);
    else {
      dependency = await present('driver_carrier_affiliations',`carrier_id=$3 AND ${accepted}`)
        || await present('truck_carrier_affiliations',`carrier_id=$3 AND ${accepted}`)
        || await present('pricing_rules','carrier_id=$3','effective_period')
        || await present('driver_truck_assignments',`${accepted} AND (driver_id IN
          (SELECT driver_id FROM driver_carrier_affiliations WHERE company_id=$1 AND project_id=$2 AND carrier_id=$3)
          OR truck_id IN (SELECT truck_id FROM truck_carrier_affiliations WHERE company_id=$1 AND project_id=$2 AND carrier_id=$3))`)
        || await present('truck_material_allocations',`${accepted} AND truck_id IN
          (SELECT truck_id FROM truck_carrier_affiliations WHERE company_id=$1 AND project_id=$2 AND carrier_id=$3)`);
    }
    if (dependency) fail('DEPENDENT_RELATIONSHIPS_ACTIVE');
  }
}
