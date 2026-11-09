import {stableValue} from './identityProtection';
import {createHash} from 'node:crypto';
import {RUNTIME_INVENTORY_TABLES,type RuntimeInventoryTable} from './runtimeInventory';
export const readinessDigest=(value:unknown)=>createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
export interface RowFingerprint {key:string;digest:string}
export interface RuntimeManifest {schemaVersion:1;sourceKind:'SYNTHETIC'|'APPROVED_FROZEN_EXPORT';sourceWatermark:string;mappingApproval:string;companyId:string;projectId:string;schema:Array<{version:string;checksum:string}>;tables:Record<RuntimeInventoryTable,RowFingerprint[]>;exceptions:string[];pendingCommands:number}
/** This server-only port must verify independent source/mapping approval and immutable bytes.
 * A browser-provided hash is never such approval. No live exporter is installed by U09. */
export interface ReadinessSource {read():Promise<RuntimeManifest>;verify(manifest:RuntimeManifest):Promise<boolean>}
export function validateManifest(m:RuntimeManifest){
 const fail=()=>{throw Object.assign(Error('INCOMPLETE_RECONCILIATION_EVIDENCE'),{code:'INCOMPLETE_RECONCILIATION_EVIDENCE',status:409});};
 if(!m||m.schemaVersion!==1||!['SYNTHETIC','APPROVED_FROZEN_EXPORT'].includes(m.sourceKind)||typeof m.sourceWatermark!=='string'||!m.sourceWatermark||m.sourceWatermark.length>200||typeof m.mappingApproval!=='string'||!m.mappingApproval||m.mappingApproval.length>2000||!Array.isArray(m.exceptions)||m.exceptions.length||m.pendingCommands!==0||!Array.isArray(m.schema)||!m.schema.length||m.schema.length>100||!m.tables||typeof m.tables!=='object'||Array.isArray(m.tables)||Object.keys(m.tables).length!==RUNTIME_INVENTORY_TABLES.length)fail();
 let total=0;for(const table of RUNTIME_INVENTORY_TABLES){const rows=m.tables[table];if(!Array.isArray(rows))fail();let last:string|undefined;for(const row of rows){if(!row||typeof row!=='object'||typeof row.key!=='string'||row.key.length>2048||last!==undefined&&row.key<=last||!/^[0-9a-f]{64}$/.test(row.digest))fail();last=row.key;if(++total>100000)fail();}}
 if(new Set(m.schema.map(s=>s.version)).size!==m.schema.length||m.schema.some(s=>!/^\d{3}$/.test(s.version)||!/^[0-9a-f]{64}$/.test(s.checksum)))fail();
 if(Buffer.byteLength(JSON.stringify(m))>16_000_000)fail();return structuredClone(m);
}
