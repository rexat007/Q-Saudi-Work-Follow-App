import type { UnitOfWork } from './unitOfWork.js';
import type { FoundationSummary, ParticipantKind, SqlSetupStage } from '../types/boundedProjectReads';
import { SQL_SETUP_STAGES } from '../types/boundedProjectReads';
export const READ_KINDS = {
  DRIVER:{table:'drivers',member:'project_drivers',field:'driver_id'},
  TRUCK:{table:'trucks',member:'project_trucks',field:'truck_id'},
  CARRIER:{table:'carriers',member:'project_carriers',field:'carrier_id'},
  MATERIAL:{table:'materials',member:'project_materials',field:'material_id'},
} as const;
const temporalTables=['driver_carrier_affiliations','truck_carrier_affiliations','driver_truck_assignments','truck_material_allocations'];
// Time alone can change membership/relationship applicability without a revision write.
// Fence pages at the earliest boundary as well as at the durable source revision.
const timeFenceSql=[...Object.values(READ_KINDS).map(k=>k.member),...temporalTables].map(table=>
  `SELECT min(t) AS boundary FROM ${table} CROSS JOIN LATERAL
    (VALUES(lower(valid_period)),(upper(valid_period))) b(t)
    WHERE company_id=$1 AND project_id=$2 AND t>statement_timestamp() AND isfinite(t)`
).join(' UNION ALL ');
export const FOUNDATION_SQL=`SELECT p.version,p.readiness_revision,p.status,s.project_revision,s.foundation_revision,
  s.source_revision AS projection_source,s.stale,s.valid_until>statement_timestamp() OR s.valid_until IS NULL AS projection_time_valid,
  ${Object.entries(READ_KINDS).map(([kind,k])=>`(SELECT count(*)::int FROM ${k.member} WHERE company_id=$1 AND project_id=$2
    AND status='ACTIVE' AND valid_period @> statement_timestamp()) AS ${kind.toLowerCase()}_count`).join(',')},
  EXISTS(SELECT 1 FROM workspace_bindings WHERE company_id=$1 AND project_id=$2) AS workspace_bound,
  statement_timestamp() AS generated_at FROM projects p LEFT JOIN project_foundation_summaries s
    ON s.company_id=p.company_id AND s.project_id=p.id WHERE p.company_id=$1 AND p.id=$2`;

export class FoundationReadRepository {
  constructor(private readonly uow:UnitOfWork){}
  async summary(external:string,epoch:string):Promise<FoundationSummary>{
    const r=(await this.uow.query(FOUNDATION_SQL,[this.uow.context.companyId,this.uow.context.projectId])).rows[0];
    if(!r||!['SETUP','READY_FOR_REVIEW','APPROVED','ACTIVE','ARCHIVED'].includes(r.status)) throw Error('INCONSISTENT_FOUNDATION');
    if(![r.version,r.readiness_revision].every(value=>/^\d+$/.test(String(value))))throw Error('INCONSISTENT_FOUNDATION');
    const counts={carriers:r.carrier_count,materials:r.material_count,drivers:r.driver_count,trucks:r.truck_count};
    if(Object.values(counts).some(n=>!Number.isSafeInteger(n)||n<0)) throw Error('INCONSISTENT_FOUNDATION');
    return {data:{projectExternalId:external,status:r.status,projectRevision:String(r.version),sourceRevision:String(r.readiness_revision),
      foundationRevision:r.foundation_revision===null?null:String(r.foundation_revision),
      stale:r.project_revision===null||r.stale!==false||String(r.project_revision)!==String(r.version)
        ||String(r.projection_source)!==String(r.readiness_revision)||!r.projection_time_valid,
      readinessState:'INCOMPLETE',counts,workspaceStatus:r.workspace_bound?'BOUND_PROVISIONING_UNVERIFIED':'UNBOUND',
      setupStages:SQL_SETUP_STAGES.map(stage=>({stage,state:stage==='CARRIERS'?(counts.carriers?'PRESENT':'EMPTY'):
        stage==='MATERIALS'?(counts.materials?'PRESENT':'EMPTY'):'PENDING',
        ...(['PRICING','REVIEW_ACTIVATION'].includes(stage)?{reason:'U05_U06_AUTHORITY_PENDING'}:
          stage==='WORKSPACE'?{reason:'U08_PROVISIONING_AUTHORITY_PENDING'}:{})}))},
      meta:{backendEpoch:epoch,generatedAt:r.generated_at.toISOString()}};
  }
  async page(kind:ParticipantKind,limit:number,after?:string){
    const spec=READ_KINDS[kind];
    // Page-first CTE prevents relationship lookups for the entire project.
    const affinity=kind==='TRUCK'||kind==='DRIVER';
    const affTable=kind==='TRUCK'?'truck_carrier_affiliations':'driver_carrier_affiliations';
    const verified=(table:string,alias:string)=>`EXISTS(SELECT 1 FROM ${table}_events e WHERE e.company_id=${alias}.company_id
      AND e.project_id=${alias}.project_id AND e.relationship_id=${alias}.id AND e.revision=${alias}.revision
      AND jsonb_populate_record(NULL::${table},e.after_record) IS NOT DISTINCT FROM ${alias})`;
    const current=(alias:string)=>`${alias}.company_id=$1 AND ${alias}.project_id=$2 AND ${alias}.record_status='ACCEPTED'
      AND ${alias}.voided_at IS NULL AND ${alias}.valid_period @> statement_timestamp()`;
    const result=await this.uow.query(`WITH page AS MATERIALIZED (
      SELECT id,${spec.field},status FROM ${spec.member} WHERE company_id=$1 AND project_id=$2
        AND ($3::uuid IS NULL OR id>$3::uuid) ORDER BY id LIMIT $4
    ) SELECT m.id AS page_key,g.external_id AS entity_id,m.status AS membership_status,g.status AS global_status,
      statement_timestamp() AS generated_at,(SELECT min(boundary) FROM (${timeFenceSql}) bounds) AS valid_until
      ${affinity?`,c.external_id AS carrier_id,af.id IS NOT NULL AND NOT ${verified(affTable,'af')} AS invalid_affiliation`:''}
      ${kind==='TRUCK'?`,a.external_id AS assignment_id,d.external_id AS driver_id,al.external_id AS allocation_id,mat.external_id AS material_id,
        a.id IS NOT NULL AND NOT ${verified('driver_truck_assignments','a')} AS invalid_assignment,
        al.id IS NOT NULL AND NOT ${verified('truck_material_allocations','al')} AS invalid_allocation`:''}
      FROM page m JOIN ${spec.table} g ON g.company_id=$1 AND g.id=m.${spec.field}
      ${affinity?`LEFT JOIN ${affTable} af ON ${current('af')} AND af.${spec.field}=g.id
        LEFT JOIN carriers c ON c.company_id=$1 AND c.id=af.carrier_id`:''}
      ${kind==='TRUCK'?`LEFT JOIN driver_truck_assignments a ON ${current('a')} AND a.truck_id=g.id
        LEFT JOIN drivers d ON d.company_id=$1 AND d.id=a.driver_id
        LEFT JOIN truck_material_allocations al ON ${current('al')} AND al.truck_id=g.id
        LEFT JOIN materials mat ON mat.company_id=$1 AND mat.id=al.material_id`:''}
      ORDER BY m.id`,[this.uow.context.companyId,this.uow.context.projectId,after||null,limit+1]);
    return result.rows;
  }
}
