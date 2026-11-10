/** Server-derived presentation, never a browser authorization claim. */
export const GOVERNANCE_ROLES=['SUPER_ADMIN','PROJECT_ADMIN','SITE_SUPERVISOR','SUPERVISOR','DISPATCHER','FINANCE_AUDITOR','SCALE_OPERATOR','DRIVER','VIEWER'] as const;
export type GovernanceRole=typeof GOVERNANCE_ROLES[number];
export type SqlCommercialRole=GovernanceRole|'COMPANY_ADMIN';
export type AccountState='PENDING_APPROVAL'|'ACTIVE'|'REJECTED'|'SUSPENDED';
export interface SqlAccountDto {principal:string;displayName:string|null;email:string|null;status:AccountState;revision:string;membership:null|{companyId:string;status:AccountState|'ACCESS_REVOKED';revision:string;roles:SqlCommercialRole[];requestedRole:GovernanceRole|null;assignedProjectCount:number;linkedDriverId:string|null;approvedAt?:string|null;approvedBy?:string|null;rejectedAt?:string|null;rejectedBy?:string|null;rejectionReason?:string};capabilities:{register:boolean;administerAccounts:boolean;createProject:boolean}}
export interface SqlProjectDto {projectId:string;projectNumber:string|null;displayName:string;status:string;revision:string;sourceRevision:string;foundationState:'VERIFIED'|'UNRECONCILED';foundation:Record<string,unknown>|null;operationalConfiguration:import('./operationalProfile').OperationalConfiguration|null;availableCommands:string[];downstream:{navigation:'RB2_REQUIRED';smartImport:'RB2_RB3_REQUIRED';workspace:'RB4_REQUIRED'}}
export interface GovernancePage<T>{items:T[];nextCursor:string|null;hasMore:boolean;sourceRevision:string;backendEpoch:string;epochRevision:number}
export interface GovernanceEnvelope {operationId:string;expectedRevision:number;backendEpoch:string;epochRevision:number;command:string;payload:Record<string,unknown>}
export interface SqlGovernancePresentationPort {account(companyId?:string):Promise<SqlAccountDto>;projects(companyId:string,cursor?:string,limit?:number):Promise<GovernancePage<SqlProjectDto>>;project(companyId:string,projectId:string):Promise<SqlProjectDto>}
