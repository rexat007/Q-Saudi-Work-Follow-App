import type { PipelineContext, UnifiedImportBatch } from '../../types/unifiedImport';
import { RosterBatchReviewService, type RosterEntityReviewGroup } from './rosterBatchReview.service';
import { ExcelCsvPipelineService } from './excelCsvPipeline.service';
/** Group mechanics for operational import; its existing Trip validator remains authoritative. */
export function applyOperationalGroupChoice(batch: UnifiedImportBatch, group: Pick<RosterEntityReviewGroup,'entityType'|'normalizedSourceKey'>, id: string|undefined, context: PipelineContext, actor: string, decision: 'SELECT_ALTERNATE'|'ACCEPT_CANDIDATE'|'LEAVE_UNRESOLVED'='SELECT_ALTERNATE') {
  if(batch.projectId!==context.projectId)throw Error('PROJECT_CONTEXT_STALE');
  let next=batch;
  for(const row of batch.rows.filter(row=>RosterBatchReviewService.getGroupKey(row,group.entityType)===group.normalizedSourceKey)) next=ExcelCsvPipelineService.applyEntityResolutionDecision(next,row.rowNumber,group.entityType,decision,{selectedEntityId:id},context,actor);
  return next;
}
