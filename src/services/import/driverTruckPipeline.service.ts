import { UnifiedImportPipelineService } from './unifiedImportPipeline.service';
import { ExcelImportParser } from './excelParser.service';
import { CsvImportParser } from './csvParser.service';
import {
  DriverTruckImportNormalizer,
  DriverTruckImportMapper,
  DriverTruckImportEntityResolver,
  DriverTruckImportValidator,
  DriverTruckImportDuplicateChecker,
  DriverTruckImportCommitter,
  DriverTruckCanonicalMappingTarget,
} from './driverTruckImport';
import { FileIntakeValidator } from './fileIntake.validator';
import {
  UnifiedImportBatch,
  ImportSource,
  PipelineContext,
  ImportResult,
} from '../../types/unifiedImport';
import { CanonicalDriverTruckRow } from './driverTruckImport';
import { smartSourceDiscoveryService } from './smartSourceDiscovery.service';

import { ExcelCsvColumnMapper } from './columnMapper.service';
import { ExcelCsvPipelineService } from './excelCsvPipeline.service';
import { RosterBatchReviewService } from './rosterBatchReview.service';
import { normalizeName } from '../../utils/normalization';

export interface ProcessDriverTruckFileOptions {
  sheetName?: string;
  headerRowIndex?: number;
  customMappings?: Record<string, DriverTruckCanonicalMappingTarget>;
}

export class DriverTruckPipelineService {
  /**
   * Helper to inspect workbook sheets before full parsing
   */
  public static getExcelSheets(data: ArrayBuffer | Uint8Array | string): string[] {
    return ExcelImportParser.getWorkbookSheetNames(data);
  }

  /**
   * Initializes and executes a Driver/Truck list file through the pipeline up to the REVIEW stage
   */
  public static async processFileToReview(
    inputData: ArrayBuffer | Uint8Array | string,
    fileName: string,
    fileSize: number,
    mimeType: string | undefined,
    context: PipelineContext,
    options?: ProcessDriverTruckFileOptions
  ): Promise<UnifiedImportBatch> {
    // 1. File Intake Validation
    const intakeValidation = FileIntakeValidator.validate(fileName, fileSize, mimeType);
    if (!intakeValidation.isValid) {
      throw new Error(`خطأ في فحص الملف: ${intakeValidation.errors.join(' | ')}`);
    }

    const sourceType = intakeValidation.fileType === 'EXCEL' ? 'EXCEL' : 'CSV';
    const importBatchId = `BAT-DT-${sourceType.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let targetSheetName = options?.sheetName;
    let targetHeaderRowIndex = options?.headerRowIndex;

    if (targetSheetName === undefined || targetHeaderRowIndex === undefined) {
      try {
        const discSource: ImportSource = {
          sourceType,
          importBatchId,
          sourceFileName: fileName,
        };
        const discovery = await smartSourceDiscoveryService.discover(discSource, inputData);
        if (targetSheetName === undefined) {
          targetSheetName = discovery.selectedSheet || undefined;
        }
        if (targetHeaderRowIndex === undefined) {
          targetHeaderRowIndex = discovery.detectedHeaderRowIndex;
        }
      } catch (err) {
        console.error('Auto-discovery for driver/truck failed, defaulting:', err);
      }
    }

    const effectiveOptions: ProcessDriverTruckFileOptions = {
      sheetName: targetSheetName,
      headerRowIndex: targetHeaderRowIndex ?? 0,
      customMappings: options?.customMappings,
    };

    // Instantiate appropriate parser
    const parser = sourceType === 'EXCEL' ? new ExcelImportParser() : new CsvImportParser();

    // Use our custom driver/truck stages with approved customMappings
    const normalizer = new DriverTruckImportNormalizer(effectiveOptions.customMappings);
    const mapper = new ExcelCsvColumnMapper();
    const entityResolver = new DriverTruckImportEntityResolver();
    const validator = new DriverTruckImportValidator();
    const duplicateChecker = new DriverTruckImportDuplicateChecker();
    const committer = new DriverTruckImportCommitter();

    // Custom pipeline construction
    const pipeline = new UnifiedImportPipelineService({
      parser,
      normalizer: normalizer as any,
      mapper: mapper as any,
      entityResolver: entityResolver as any,
      validator: validator as any,
      duplicateChecker: duplicateChecker as any,
      committer: committer as any,
    });

    const source: ImportSource = {
      sourceType,
      importBatchId,
      sourceFileName: fileName,
      sourceMimeType: mimeType,
      sourceSheetName: effectiveOptions.sheetName,
      rawInput: inputData,
    };

    // 2. Create batch (Stage: SOURCE)
    const batch = pipeline.createBatch(source, context);

    // 3. Process through stages PARSE -> REVIEW
    const reviewedBatch = await pipeline.processThroughReview(batch, inputData, context, effectiveOptions);

    // Filter validation issues to count totals properly
    let validRows = 0;
    let errorRows = 0;
    let warningRows = 0;

    reviewedBatch.rows.forEach((row) => {
      const hasBlocking = row.validationIssues.some((issue) => issue.severity === 'BLOCKING' || issue.blocking);
      const hasWarning = row.validationIssues.some((issue) => issue.severity === 'WARNING');
      if (hasBlocking) {
        errorRows++;
        row.status = 'ERROR';
        row.reviewStatus = 'error';
      } else if (hasWarning) {
        warningRows++;
        row.status = 'WARNING';
        row.reviewStatus = 'requires_review';
      } else {
        validRows++;
        row.status = 'VALID';
        row.reviewStatus = 'accepted';
      }
    });

    reviewedBatch.validRows = validRows;
    reviewedBatch.errorRows = errorRows;
    reviewedBatch.warningRows = warningRows;
    reviewedBatch.issues = reviewedBatch.rows.flatMap((r) => r.validationIssues);
    reviewedBatch.validationStatus = errorRows > 0 ? 'FAILED' : warningRows > 0 ? 'WARNING' : 'PASSED';

    return reviewedBatch;
  }

  /**
   * Applies an interactive entity resolution decision on an existing candidate
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
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      rowNumber,
      entityTypeKey,
      decision,
      candidate,
      context,
      actorId
    );

    return this.revalidateRosterBatch(updated, context);
  }

  /**
   * Applies an interactive entity resolution decision across ALL rows matching an EXACT unique group key
   */
  public static applyGroupedEntityResolutionDecision(
    batch: UnifiedImportBatch,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    normalizedSourceKey: string,
    decision: 'ACCEPT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
    candidate: { selectedEntityId?: string; selectedDisplayName?: string },
    context: PipelineContext,
    actorId: string
  ): UnifiedImportBatch {
    const matchingRowNumbers = batch.rows
      .filter((row) => {
        const key = RosterBatchReviewService.getGroupKey(row, entityTypeKey);
        return key === normalizedSourceKey;
      })
      .map((r) => r.rowNumber);

    if (matchingRowNumbers.length === 0) {
      throw new Error(`Zero matching rows found for group key: ${normalizedSourceKey}`);
    }

    let updatedBatch = { ...batch };

    matchingRowNumbers.forEach((rowNumber) => {
      updatedBatch = ExcelCsvPipelineService.applyEntityResolutionDecision(
        updatedBatch,
        rowNumber,
        entityTypeKey,
        decision,
        candidate,
        context,
        actorId
      );
    });

    return this.revalidateRosterBatch(updatedBatch, context);
  }

  /**
   * Applies a newly created server-authoritative canonical entity result to an import batch row.
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
    },
    context?: PipelineContext
  ): UnifiedImportBatch {
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch,
      rowNumber,
      entityTypeKey,
      result,
      context
    );

    if (context) {
      return this.revalidateRosterBatch(updated, context);
    }

    return updated;
  }

  /**
   * Applies a newly created server-authoritative canonical entity result across ALL rows matching an EXACT group key.
   */
  public static applyGroupedCreatedEntityResolution(
    batch: UnifiedImportBatch,
    entityTypeKey: 'carrier' | 'truck' | 'driver' | 'material',
    normalizedSourceKey: string,
    result: {
      matchedId: string;
      matchedName: string;
      sourceValue?: string;
      [key: string]: any;
    },
    context?: PipelineContext
  ): UnifiedImportBatch {
    const matchingRowNumbers = batch.rows
      .filter((row) => {
        const key = RosterBatchReviewService.getGroupKey(row, entityTypeKey);
        return key === normalizedSourceKey;
      })
      .map((r) => r.rowNumber);

    if (matchingRowNumbers.length === 0) {
      throw new Error(`Zero matching rows found for group key: ${normalizedSourceKey}`);
    }

    let updatedBatch = { ...batch };

    matchingRowNumbers.forEach((rowNumber) => {
      updatedBatch = ExcelCsvPipelineService.applyCreatedEntityResolution(
        updatedBatch,
        rowNumber,
        entityTypeKey,
        result,
        context
      );
    });

    if (context) {
      updatedBatch = this.revalidateRosterBatch(updatedBatch, context);
    }

    return updatedBatch;
  }

  /**
   * Revalidates roster batch rows using DriverTruckImportValidator and current PipelineContext.
   * Preserves non-resolution issues and updates row and batch warning/error counters correctly.
   */
  public static revalidateRosterBatch(
    batch: UnifiedImportBatch,
    context: PipelineContext
  ): UnifiedImportBatch {
    const validator = new DriverTruckImportValidator();
    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    let requiresReviewRows = 0;

    const rosterOwnedCodes = new Set([
      'EMPTY_ROW_DATA',
      'MISSING_DRIVER_NAME',
      'INVALID_ID_FORMAT',
      'MISSING_PLATE',
      'UNRESOLVED_CARRIER',
      'DRIVER_CARRIER_CONFLICT',
      'RELATIONSHIP_CONFLICT',
      'UNRESOLVED_MATERIAL',
      'UNAUTHORIZED_MATERIAL',
    ]);

    const unresolvedCodes = new Set(['UNRESOLVED_CARRIER', 'UNRESOLVED_MATERIAL']);

    const updatedRows = batch.rows.map((row) => {
      const freshRosterIssues = validator.validateRow(row, context);

      const preservedIssues = (row.validationIssues || []).filter(
        (issue) => !rosterOwnedCodes.has(issue.code)
      );

      const issueMap = new Map<string, any>();
      preservedIssues.forEach((i) => {
        const key = `${i.code}_${i.field}_${i.issueId || ''}`;
        issueMap.set(key, i);
      });
      freshRosterIssues.forEach((i) => {
        const key = `${i.code}_${i.field}_${i.issueId || ''}`;
        issueMap.set(key, i);
      });

      const mergedIssues = Array.from(issueMap.values());

      const blockingErrorIssues = mergedIssues.filter(
        (i) => (i.severity === 'BLOCKING' || i.blocking) && !unresolvedCodes.has(i.code)
      );
      const hasBlocking = blockingErrorIssues.length > 0;

      const carrierUnresolved = !row.entityResolutions?.carrier?.matchedId;
      const materialUnresolved = !row.entityResolutions?.material?.matchedId;
      const driverUnresolved = Boolean(row.canonical?.driverName) && !row.entityResolutions?.driver?.matchedId;
      const truckUnresolved = Boolean(row.canonical?.truckPlate) && !row.entityResolutions?.truck?.matchedId;

      const isUnresolved = carrierUnresolved || materialUnresolved || driverUnresolved || truckUnresolved;
      const hasWarningOnly = !hasBlocking && !isUnresolved && mergedIssues.some((i) => i.severity === 'WARNING');

      let rowStatus: 'VALID' | 'WARNING' | 'ERROR' | 'PENDING' = 'VALID';
      let reviewStatus: 'valid' | 'requires_review' | 'warning' | 'error' = 'valid';

      if (hasBlocking) {
        rowStatus = 'ERROR';
        reviewStatus = 'error';
        errorRows++;
      } else if (isUnresolved) {
        rowStatus = 'PENDING';
        reviewStatus = 'requires_review';
        requiresReviewRows++;
      } else if (hasWarningOnly) {
        rowStatus = 'WARNING';
        reviewStatus = 'warning';
        warningRows++;
      } else {
        rowStatus = 'VALID';
        reviewStatus = 'valid';
        validRows++;
      }

      return {
        ...row,
        validationIssues: mergedIssues,
        status: rowStatus,
        reviewStatus,
      };
    });

    let batchStatus: 'FAILED' | 'PENDING' | 'WARNING' | 'READY' = 'READY';
    if (errorRows > 0) {
      batchStatus = 'FAILED';
    } else if (requiresReviewRows > 0) {
      batchStatus = 'PENDING';
    } else if (warningRows > 0) {
      batchStatus = 'WARNING';
    } else {
      batchStatus = 'READY';
    }

    return {
      ...batch,
      rows: updatedRows,
      validRows,
      warningRows,
      errorRows,
      requiresReviewRows,
      status: batchStatus,
    };
  }

  /**
   * Commits the reviewed batch into Firestore
   */
  public static async commitBatch(
    batch: UnifiedImportBatch,
    context: PipelineContext
  ): Promise<{ batch: UnifiedImportBatch; result: ImportResult }> {
    const committer = new DriverTruckImportCommitter();
    const pipeline = new UnifiedImportPipelineService({
      committer: committer as any,
    });

    return pipeline.executeCommit(batch, context);
  }
}
