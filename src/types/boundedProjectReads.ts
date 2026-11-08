import type { ProjectSetupLayer } from '../services/projectSetupWorkflow.service';
/** Presentation only. These responses never authorize activation or replace offline collections. */
export const SQL_SETUP_STAGES = ['FOUNDATION','WORKSPACE','MATERIALS','CARRIERS','ROSTER','PRICING','ACCESS','REVIEW_ACTIVATION'] as const satisfies readonly ProjectSetupLayer[];
export type SqlSetupStage = typeof SQL_SETUP_STAGES[number];
export type ParticipantKind = 'DRIVER'|'TRUCK'|'CARRIER'|'MATERIAL';
export interface FoundationSummary {
  data: {
    projectExternalId:string;status:string;projectRevision:string;foundationRevision:string|null;sourceRevision:string;
    readinessState:'INCOMPLETE';stale:boolean;
    setupStages:{stage:SqlSetupStage;state:'PRESENT'|'EMPTY'|'PENDING';reason?:string}[];
    counts:{carriers:number;materials:number;drivers:number;trucks:number};
    workspaceStatus:'UNBOUND'|'BOUND_PROVISIONING_UNVERIFIED';
  };
  meta:{backendEpoch:string;generatedAt:string};
}
export interface BoundedParticipant {
  entityId:string;kind:ParticipantKind;membershipStatus:string;globalStatus:string;
  carrierId?:string|null;assignmentId?:string|null;driverId?:string|null;
  allocationId?:string|null;materialId?:string|null;integrity?:'VERIFIED'|'RECONCILIATION_REQUIRED';
}
export interface BoundedProjectPage {
  projectExternalId:string;stage:SqlSetupStage;kind:ParticipantKind;items:BoundedParticipant[];
  nextCursor:string|null;hasMore:boolean;sourceRevision:string;fullSnapshot:false;
  meta:{backendEpoch:string;generatedAt:string};
}
export interface BoundedProjectReadPort {
  summary(projectExternalId:string):Promise<FoundationSummary>;
  page(projectExternalId:string,stage:SqlSetupStage,kind:ParticipantKind,limit:number,cursor?:string):Promise<BoundedProjectPage>;
}
