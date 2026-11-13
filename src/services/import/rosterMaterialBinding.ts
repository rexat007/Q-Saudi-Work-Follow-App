import type {ImportRow,UnifiedImportBatch} from '../../types/unifiedImport';
import type {ImportResolutionEntity} from '../../types/importResolution';
import {acceptedRosterIdentity} from './rosterBatchReview.service';
export const sourceHasMaterial=(r:ImportRow)=>Boolean(r.canonical?.materialId||r.canonical?.materialCode||r.canonical?.materialName||r.canonical?.materialType||r.mapped?.materialId||r.mapped?.materialCode||r.mapped?.materialName||r.mapped?.materialType);
export const needsBatchMaterial=(b:UnifiedImportBatch)=>b.rows.some(r=>r.status!=='REJECTED'&&r.status!=='COMMITTED'&&!sourceHasMaterial(r));
export function bindRosterMaterial(batch:UnifiedImportBatch,material:ImportResolutionEntity):UnifiedImportBatch{
 if(!needsBatchMaterial(batch)||material.kind!=='MATERIAL'||material.issue||material.globalStatus!=='ACTIVE'||material.membershipStatus!=='ACTIVE'||!material.eligible)throw Error('UNRESOLVED_MATERIAL');
 return {...batch,metadata:{...batch.metadata,batchMaterialBinding:{materialId:material.id,provenance:'PROJECT_IMPORT_SELECTION',confirmed:true},reviewedCanonicalIntent:undefined}};
}
export const materialRowsReady=(batch:UnifiedImportBatch)=>batch.rows.some(r=>r.status!=='REJECTED'&&r.status!=='COMMITTED')&&batch.rows.filter(r=>r.status!=='REJECTED'&&r.status!=='COMMITTED').every(r=>acceptedRosterIdentity(r.entityResolutions?.material,'MATERIAL'));
