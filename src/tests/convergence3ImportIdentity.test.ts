import {it,expect} from 'vitest';
import * as XLSX from 'xlsx';
import {GoogleDrivePipelineService} from '../services/import/googleDrivePipeline.service';
import {UnifiedImportPipelineService} from '../services/import/unifiedImportPipeline.service';
import type {PipelineContext} from '../types/unifiedImport';
import type {GoogleDriveFileItem} from '../types/googleDriveImport';
const context:PipelineContext={projectId:'P-ISOLATED',userId:'ACTOR',role:'PROJECT_ADMIN',operationId:'OP-REVIEW'};
it.each(['CSV','EXCEL'] as const)('durable Drive %s review retries retain the session batch identity',async format=>{
 const rows=[['رقم التذكرة','رقم اللوحة','الناقل','السائق','المادة','الوزن الصافي'],['T1','أ ب ج 1234','Synthetic carrier','Synthetic driver','MAT-1',19000]];
 const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(rows),'Source');
 const data=format==='EXCEL'?XLSX.write(workbook,{bookType:'xlsx',type:'array'}):XLSX.utils.sheet_to_csv(workbook.Sheets.Source);
 const meta:GoogleDriveFileItem={id:'IMMUTABLE-REMOTE-ID',name:format==='CSV'?'source.csv':'source.xlsx',mimeType:format==='CSV'?'text/csv':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',size:typeof data==='string'?Buffer.byteLength(data):data.byteLength,modifiedTime:'2026-01-01T00:00:00Z',format,isSupported:true};
 const first=await GoogleDrivePipelineService.processDriveFileToReview(data,meta,context,{importBatchId:'BAT-RESUME',sheetName:'Source'});
 const retry=await GoogleDrivePipelineService.processDriveFileToReview(data,meta,context,{importBatchId:'BAT-RESUME',sheetName:'Source'});
 expect(first.importBatchId).toBe('BAT-RESUME');expect(retry.importBatchId).toBe(first.importBatchId);expect(retry.source.importBatchId).toBe(first.source.importBatchId);expect(retry.source.sourceFileId).toBe(meta.id);expect(retry.currentStage).toBe('REVIEW');expect(retry.commitStatus).not.toBe('COMMITTED');
 await expect(GoogleDrivePipelineService.processDriveFileToReview(data,meta,context,{importBatchId:'../escape'})).rejects.toThrow('INVALID_IMPORT_BATCH_ID');
});
it('confirming warnings does not bypass unresolved human review and uses the canonical batch state',()=>{
 const pipeline=new UnifiedImportPipelineService(),batch=pipeline.createBatch({sourceType:'CSV',importBatchId:'BAT-REVIEW'},context);
 batch.requiresReviewRows=1;batch.errorRows=0;
 const reviewed=pipeline.confirmWarnings(batch,context,'Human warning review');
 expect(reviewed.warningConfirmation?.confirmed).toBe(true);expect(reviewed.commitStatus).toBe('AWAITING_REVIEW');
});
