/** Server-owned authority metadata. Requested scope is never authorization. */
export type CanonicalStore='firestore'|'postgres';
export interface RuntimeAuthority {schemaVersion:1;canonicalStore:CanonicalStore;backendEpoch:string;epochRevision:number;phase:'ACTIVE'|'FROZEN'}
export class RuntimeAuthorityError extends Error {constructor(public code:string,public status=409){super(code);}}
export const FIRESTORE_BOOTSTRAP:Readonly<RuntimeAuthority>=Object.freeze({schemaVersion:1,canonicalStore:'firestore',backendEpoch:'FIRESTORE_LEGACY',epochRevision:0,phase:'ACTIVE'});
export function parseRuntimeAuthority(value:unknown):RuntimeAuthority {
 const d=value as RuntimeAuthority;if(!d||typeof d!=='object'||d.schemaVersion!==1||!['firestore','postgres'].includes(d.canonicalStore)||!['ACTIVE','FROZEN'].includes(d.phase)||typeof d.backendEpoch!=='string'||!/^[A-Za-z0-9_.:-]{1,100}$/.test(d.backendEpoch)||!Number.isSafeInteger(d.epochRevision)||d.epochRevision<0)throw new RuntimeAuthorityError('RUNTIME_AUTHORITY_UNVERIFIED',503);
 return {schemaVersion:1,canonicalStore:d.canonicalStore,backendEpoch:d.backendEpoch,epochRevision:d.epochRevision,phase:d.phase};
}
export function assertFirestoreAuthority(value:RuntimeAuthority){if(value.canonicalStore!=='firestore'||value.phase!=='ACTIVE')throw new RuntimeAuthorityError('LEGACY_AUTHORITY_FENCED');}
export const CUTOVER_GATES=['SOURCE_INTEGRATED','ISOLATED_TEST_VERIFIED','DATA_RECONCILIATION_READY','LEGACY_CLIENT_FENCING_READY','WORKSPACE_CONTINUITY_READY','PRODUCTION_CUTOVER_AUTHORIZED'] as const;
export type CutoverGate=typeof CUTOVER_GATES[number];
export type GateResult={state:'PROVEN'|'BLOCKED'|'NOT_PERFORMED';evidence:string[];blockers:string[]};
export interface CutoverReadiness {gates:Record<CutoverGate,GateResult>;productionCutoverAuthorized:false;sourceEpoch:RuntimeAuthority;generatedAt:string}

/** Tests and source integration cannot authorize an operational cutover. */
export function cutoverReadiness(sourceEpoch:RuntimeAuthority,observations:Partial<Record<Exclude<CutoverGate,'PRODUCTION_CUTOVER_AUTHORIZED'>,GateResult>>={}):CutoverReadiness{
 const gates=Object.fromEntries(CUTOVER_GATES.map(gate=>[gate,{state:'NOT_PERFORMED',evidence:[],blockers:['Independent evidence required']}])) as Record<CutoverGate,GateResult>;
 for(const gate of CUTOVER_GATES)if(gate!=='PRODUCTION_CUTOVER_AUTHORIZED'&&observations[gate])gates[gate]=structuredClone(observations[gate]!);
 gates.PRODUCTION_CUTOVER_AUTHORIZED={state:'BLOCKED',evidence:[],blockers:['Separate owner-approved operational transition, deployment parity, migration/restore and legacy credential retirement required']};
 return {gates,productionCutoverAuthorized:false,sourceEpoch:parseRuntimeAuthority(sourceEpoch),generatedAt:new Date().toISOString()};
}
