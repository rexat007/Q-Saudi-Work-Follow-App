/**
 * Excel & CSV Import Pipeline Service
 * BLOCK 31: Bridges file intake to UnifiedImportPipelineService (BLOCK 30)
 * 
 * Rules:
 * - Direct usage of UnifiedImportPipelineService
 * - NO separate pipeline architecture
 * - NO Firestore writes before COMMIT
 * - Full 10-stage execution support
 */

import { UnifiedImportPipelineService } from './unifiedImportPipeline.service';
import { ExcelImportParser } from './excelParser.service';
import { CsvImportParser } from './csvParser.service';
import { ExcelCsvNormalizer } from './normalizer.service';
import { ExcelCsvColumnMapper } from './columnMapper.service';
import { ExcelCsvTripEntityResolver } from './tripEntityResolver';
import { ExcelCsvTripValidator } from './tripImportValidator';
import { ExcelCsvTripDuplicateChecker } from './tripDuplicateChecker';
import { ExcelCsvTripCommitter } from './tripImportCommitter';
import { EntityResolutionService } from './entityResolution.service';
import { FileIntakeValidator } from './fileIntake.validator';
import {
  UnifiedImportBatch,
  ImportSource,
  PipelineContext,
  ImportResult,
  ImportRow,
  ImportEntityResolutionInfo,
} from '../../types/unifiedImport';
import { CanonicalTripRow, ColumnMappingMatch } from '../../types/excelCsvImport';

export interface ProcessFileOptions {
  sheetName?: string;
  headerRowIndex?: number;
  customMappings?: Record<string, keyof CanonicalTripRow>;
  importBatchId?: string;
}

export class ExcelCsvPipelineService {
  /**
   * Helper to inspect workbook sheets before full parsing
   */
  public static getExcelSheets(data: ArrayBuffer | Uint8Array | string): string[] {
    return ExcelImportParser.getWorkbookSheetNames(data);
  }

  /**
   * Helper to inspect column mappings for raw headers
   */
  public static inspectColumnMappings(headers: string[]): Record<string, ColumnMappingMatch> {
    return ExcelCsvColumnMapper.mapHeaders(headers);
  }

  /**
   * Initializes and executes an import file through the pipeline up to the REVIEW stage
   * (NO FIRESTORE WRITES HERE)
   */
  public static async processFileToReview(
    inputData: ArrayBuffer | Uint8Array | string,
    fileName: string,
    fileSize: number,
    mimeType: string | undefined,
    context: PipelineContext,
    options?: ProcessFileOptions
  ): Promise<UnifiedImportBatch> {
    // 1. File Intake Validation
    const intakeValidation = FileIntakeValidator.validate(fileName, fileSize, mimeType);
    if (!intakeValidation.isValid) {
      throw new Error(`خطأ في فحص الملف: ${intakeValidation.errors.join(' | ')}`);
    }

    const sourceType = intakeValidation.fileType === 'EXCEL' ? 'EXCEL' : 'CSV';
    const importBatchId = options?.importBatchId || `BAT-${sourceType.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const parser = sourceType === 'EXCEL' ? new ExcelImportParser() : new CsvImportParser();
    const normalizer = new ExcelCsvNormalizer();
    const mapper = new ExcelCsvColumnMapper(options?.customMappings);
    const entityResolver = new ExcelCsvTripEntityResolver();
    const validator = new ExcelCsvTripValidator();
    const duplicateChecker = new ExcelCsvTripDuplicateChecker();
    const committer = new ExcelCsvTripCommitter();

    const pipeline = new UnifiedImportPipelineService({
      parser,
      normalizer,
      mapper,
      entityResolver,
      validator,
      duplicateChecker,
      committer,
    });

    const source: ImportSource = {
      sourceType,
      importBatchId,
      sourceFileName: fileName,
      sourceMimeType: mimeType,
      sourceSheetName: options?.sheetName,
      rawInput: inputData,
    };

    // 2. Create batch (Stage: SOURCE)
    const batch = pipeline.createBatch(source, context);

    // 3. Process through PARSE -> NORMALIZE -> MAP -> RESOLVE -> VALIDATE -> DUPLICATE_CHECK -> REVIEW
    const reviewedBatch = await pipeline.processThroughReview(batch, inputData, context, options);

    return reviewedBatch;
  }

  /**
   * Applies user review action on a specific row (e.g. ACCEPT_WARNING or REJECT_ROW)
   */
  public static applyRowReview(
    batch: UnifiedImportBatch,
    rowNumber: number,
    action: 'ACCEPT_WARNING' | 'REJECT_ROW',
    context: PipelineContext,
    resolutionNotes?: string
  ): UnifiedImportBatch {
    const pipeline = new UnifiedImportPipelineService();
    return pipeline.applyReviewAction(batch, rowNumber, action, { notes: resolutionNotes }, context);
  }

  /**
   * Commits the reviewed batch into official Trips
   * (FIRESTORE WRITES HAPPEN ONLY HERE)
   */
  public static async commitBatch(
    batch: UnifiedImportBatch,
    context: PipelineContext
  ): Promise<{ batch: UnifiedImportBatch; result: ImportResult }> {
    const committer = new ExcelCsvTripCommitter();
    const pipeline = new UnifiedImportPipelineService({
      committer,
    });

    return pipeline.executeCommit(batch, context);
  }

  /**
   * Detects if an entity resolution item requires manual review attention.
   */
  public static checkResolutionRequiresAttention(item?: any): boolean {
    if (!item) return false;
    if (item.recommendation === 'REVIEW' || item.recommendation === 'REJECT') return true;
    if (item.ambiguous === true) return true;
    if (!item.matchedId && !item.entityId) return true;
    if (item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL') return true;
    if (item.relationshipStatus && item.relationshipStatus !== 'VALID' && item.relationshipStatus !== 'NOT_APPLICABLE') return true;
    return false;
  }

  /**
   * Detects if an import row has any entity resolutions requiring manual attention.
   */
  public static rowRequiresEntityResolution(row: ImportRow): boolean {
    if (!row.entityResolutions) return false;
    const keys: Array<'carrier' | 'truck' | 'driver' | 'material'> = ['carrier', 'truck', 'driver', 'material'];
    return keys.some((k) => this.checkResolutionRequiresAttention(row.entityResolutions?.[k]));
  }

  /**
   * Applies an interactive entity resolution decision on an existing candidate
   * and updates row entityResolutions, resolvedValues, and reviewStatus.
   */
  public static applyEntityResolutionDecision(
    batch: UnifiedImportBatch,
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidate: { selectedEntityId?: string; selectedDisplayName?: string },
    context: PipelineContext,
    actorId: string
  ): UnifiedImportBatch {
    const rowIdx = batch.rows.findIndex((r) => r.rowNumber === rowNumber);
    if (rowIdx === -1) {
      throw new Error(`Row ${rowNumber} not found in import batch`);
    }

    const row = batch.rows[rowIdx];
    const targetEntityType = entityTypeKey.toUpperCase() as any;
    const currentRes = row.entityResolutions?.[entityTypeKey];

    if (!currentRes) {
      throw new Error(`No entity resolution found for ${entityTypeKey} on row ${rowNumber}`);
    }

    const { updatedResolution } = EntityResolutionService.applyUserDecision({
      projectId: context.projectId,
      importBatchId: batch.importBatchId,
      operationId: context.operationId,
      rowNumber,
      entityType: targetEntityType,
      decision,
      selectedEntityId: candidate.selectedEntityId,
      selectedDisplayName: candidate.selectedDisplayName,
      currentRowResolution: currentRes as any,
      context,
      actorId,
    });

    const updatedRow: ImportRow = {
      ...row,
      entityResolutions: {
        ...row.entityResolutions,
        [entityTypeKey]: updatedResolution,
      },
      resolvedValues: {
        ...(row.resolvedValues || {}),
      },
    };

    const resolvedId = updatedResolution.matchedId || updatedResolution.entityId;
    if (resolvedId && (decision === 'ACCEPT_CANDIDATE' || decision === 'SELECT_ALTERNATE')) {
      switch (entityTypeKey) {
        case 'carrier':
          updatedRow.resolvedValues!.carrierId = resolvedId;
          break;
        case 'truck':
          updatedRow.resolvedValues!.truckId = resolvedId;
          break;
        case 'driver':
          updatedRow.resolvedValues!.driverId = resolvedId;
          break;
        case 'material':
          updatedRow.resolvedValues!.materialId = resolvedId;
          break;
      }
    }

    const stillNeedsResolution = this.rowRequiresEntityResolution(updatedRow);
    const hasErrors = updatedRow.status === 'ERROR' || (updatedRow.validationIssues && updatedRow.validationIssues.some((i) => i.severity === 'BLOCKING' || (i.severity as any) === 'ERROR' || (i.severity as any) === 'FATAL'));
    const hasWarnings = updatedRow.status === 'WARNING' || (updatedRow.validationIssues && updatedRow.validationIssues.some((i) => i.severity === 'WARNING'));

    if (stillNeedsResolution) {
      updatedRow.reviewStatus = 'requires_review';
    } else if (hasErrors) {
      updatedRow.reviewStatus = 'requires_review';
    } else if (hasWarnings && !batch.warningConfirmation?.confirmed) {
      updatedRow.reviewStatus = 'warning';
    } else {
      updatedRow.reviewStatus = 'accepted';
    }

    const updatedRows = [...batch.rows];
    updatedRows[rowIdx] = updatedRow;

    const updatedBatch: UnifiedImportBatch = {
      ...batch,
      rows: updatedRows,
    };

    return this.recalculateBatchCounts(updatedBatch);
  }

  /**
   * Applies a newly created server-authoritative canonical entity result to an import batch row.
   * Section F:
   * - entityId / matchedId = server matchedId
   * - matchedValue / matchedName = server matchedName
   * - confidence = 1.0
   * - matchMethod = 'EXACT'
   * - isExact = true
   * - isAuthorized = true
   * - riskLevel = 'LOW'
   * - relationshipStatus = 'VALID'
   * - recommendation = 'ACCEPT'
   * - ambiguous = false
   * - conflictDetails cleared
   * - Preserve sourceValue, originalValue, normalizedValue
   * - Do NOT change row.raw
   */
  public static applyCreatedEntityResolution(
    batch: UnifiedImportBatch,
    rowNumber: number,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    result: {
      matchedId: string;
      matchedName: string;
      sourceValue?: string;
      [key: string]: any;
    }
  ): UnifiedImportBatch {
    const rowIdx = batch.rows.findIndex((r) => r.rowNumber === rowNumber);
    if (rowIdx === -1) {
      throw new Error(`Row ${rowNumber} not found in import batch`);
    }

    const row = batch.rows[rowIdx];
    const currentRes = row.entityResolutions?.[entityTypeKey] || {};

    const updatedResolution: ImportEntityResolutionInfo = {
      ...currentRes,
      entityType: entityTypeKey.toUpperCase() as any,
      sourceValue: currentRes.sourceValue || result.sourceValue || result.matchedName,
      originalValue: currentRes.originalValue || currentRes.sourceValue || result.sourceValue || result.matchedName,
      normalizedValue: currentRes.normalizedValue || result.matchedName,
      matchedId: result.matchedId,
      matchedName: result.matchedName,
      confidence: 1.0,
      matchMethod: 'EXACT',
      isExact: true,
      isAuthorized: true,
      recommendation: 'ACCEPT' as any,
      riskLevel: 'LOW' as any,
      relationshipStatus: 'VALID' as any,
      ambiguous: false,
      conflictDetails: undefined,
    };

    const updatedResolvedValues = {
      ...(row.resolvedValues || {}),
    };

    switch (entityTypeKey) {
      case 'carrier':
        updatedResolvedValues.carrierId = result.matchedId;
        break;
      case 'truck':
        updatedResolvedValues.truckId = result.matchedId;
        break;
      case 'driver':
        updatedResolvedValues.driverId = result.matchedId;
        break;
      case 'material':
        updatedResolvedValues.materialId = result.matchedId;
        break;
    }

    const updatedRow: ImportRow = {
      ...row,
      entityResolutions: {
        ...row.entityResolutions,
        [entityTypeKey]: updatedResolution,
      },
      resolvedValues: updatedResolvedValues,
    };

    const stillNeedsResolution = this.rowRequiresEntityResolution(updatedRow);
    const hasErrors = updatedRow.status === 'ERROR' || (updatedRow.validationIssues && updatedRow.validationIssues.some((i) => i.severity === 'BLOCKING' || (i.severity as any) === 'ERROR' || (i.severity as any) === 'FATAL'));
    const hasWarnings = updatedRow.status === 'WARNING' || (updatedRow.validationIssues && updatedRow.validationIssues.some((i) => i.severity === 'WARNING'));

    if (stillNeedsResolution) {
      updatedRow.reviewStatus = 'requires_review';
    } else if (hasErrors) {
      updatedRow.reviewStatus = 'requires_review';
    } else if (hasWarnings && !batch.warningConfirmation?.confirmed) {
      updatedRow.reviewStatus = 'warning';
    } else {
      updatedRow.reviewStatus = 'accepted';
    }

    const updatedRows = [...batch.rows];
    updatedRows[rowIdx] = updatedRow;

    const updatedBatch: UnifiedImportBatch = {
      ...batch,
      rows: updatedRows,
    };

    return this.recalculateBatchCounts(updatedBatch);
  }

  /**
   * Recalculates summary KPIs for the import batch based on updated row reviewStatuses
   */
  public static recalculateBatchCounts(batch: UnifiedImportBatch): UnifiedImportBatch {
    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    let requiresReviewRows = 0;

    for (const r of batch.rows) {
      if (r.reviewStatus === 'requires_review') {
        requiresReviewRows++;
      } else if (r.reviewStatus === 'error') {
        errorRows++;
      } else if (r.status === 'ERROR') {
        errorRows++;
      } else if (r.reviewStatus === 'accepted' || r.status === 'VALID') {
        validRows++;
      } else if (r.reviewStatus === 'warning' || r.status === 'WARNING') {
        warningRows++;
      } else {
        validRows++;
      }
    }

    return {
      ...batch,
      validRows,
      warningRows,
      errorRows,
      requiresReviewRows,
    };
  }
}
