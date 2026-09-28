import { UnifiedImportPipelineService } from './unifiedImportPipeline.service';
import { ExcelImportParser } from './excelParser.service';
import { CsvImportParser } from './csvParser.service';
import { 
  DriverTruckImportNormalizer,
  DriverTruckImportMapper,
  DriverTruckImportEntityResolver,
  DriverTruckImportValidator,
  DriverTruckImportDuplicateChecker,
  DriverTruckImportCommitter
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
}

export class DriverTruckPipelineService {
  /**
   * Universal File Intake & Full Processing for Driver/Truck Roster files.
   */
  public static async processFileIntake(
    file: File | Blob,
    filename: string,
    context: PipelineContext,
    options: ProcessDriverTruckFileOptions = {}
  ): Promise<UnifiedImportBatch> {
    const fileValidator = new FileIntakeValidator();
    const fileValidation = fileValidator.validateFile(filename, file.size);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.errorMessage || 'ملف غير صالِح للاستيراد');
    }

    const discoveryResult = await smartSourceDiscoveryService.discover(file, filename, {
      sheetName: options.sheetName,
      headerRowIndex: options.headerRowIndex,
    });

    if (!discoveryResult.parsedRows || discoveryResult.parsedRows.length === 0) {
      throw new Error('الملف فارغ أو لا يحتوي على صفوف قابلة للقراءة');
    }

    const isCsv = filename.toLowerCase().endsWith('.csv');
    const sourceType: ImportSource['sourceType'] = isCsv ? 'CSV' : 'EXCEL';

    const source: ImportSource = {
      sourceType,
      sourceFileId: `FILE-${Date.now()}`,
      sourceFileName: filename,
      sheetName: options.sheetName || discoveryResult.sheetName,
      headerRowIndex: discoveryResult.headerRowIndex ?? (options.headerRowIndex || 0),
    };

    const initialBatch = UnifiedImportPipelineService.createInitialBatch({
      projectId: context.projectId,
      batchType: 'DRIVER_TRUCK_ROSTER',
      source,
      actorId: context.userId || 'SYSTEM',
    });

    let rawRows = discoveryResult.parsedRows;
    if (discoveryResult.headerRowIndex !== undefined && discoveryResult.headerRowIndex > 0) {
      rawRows = rawRows.slice(discoveryResult.headerRowIndex + 1);
    }

    const columnMap = discoveryResult.columnMap || {};
    const autoMappedRows = rawRows.map((raw) => {
      const mappedRow: Record<string, any> = {};
      Object.entries(columnMap).forEach(([rawColHeader, canonicalField]) => {
        if (canonicalField && raw[rawColHeader] !== undefined) {
          mappedRow[canonicalField] = raw[rawColHeader];
        }
      });
      return mappedRow;
    });

    const normalizer = new DriverTruckImportNormalizer();
    const mapper = new DriverTruckImportMapper();
    const entityResolver = new DriverTruckImportEntityResolver();
    const validator = new DriverTruckImportValidator();
    const duplicateChecker = new DriverTruckImportDuplicateChecker();

    const normalizedBatch = await normalizer.normalize(initialBatch, autoMappedRows, context);
    const mappedBatch = await mapper.map(normalizedBatch, context);

    const resolvedRows = await Promise.all(
      mappedBatch.rows.map(async (row) => {
        const entityResolutions = await entityResolver.resolveEntities(
          row.mapped as CanonicalDriverTruckRow,
          row.rowNumber,
          context
        );
        return {
          ...row,
          entityResolutions: {
            ...(row.entityResolutions || {}),
            ...entityResolutions,
          },
        };
      })
    );

    const batchWithResolutions: UnifiedImportBatch = {
      ...mappedBatch,
      rows: resolvedRows,
    };

    const validatedBatch = await validator.validate(batchWithResolutions, context);

    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;

    const reviewedRows = validatedBatch.rows.map((row) => {
      const hasErrors = row.validationIssues?.some((i) => i.severity === 'BLOCKING' || i.blocking) || row.status === 'ERROR';
      const hasWarnings = row.validationIssues?.some((i) => i.severity === 'WARNING' && !i.blocking) || row.status === 'WARNING';

      if (hasErrors) {
        errorRows++;
        return { ...row, status: 'ERROR' as const, reviewStatus: 'error' as const };
      }
      if (hasWarnings) {
        warningRows++;
        return { ...row, status: 'WARNING' as const, reviewStatus: 'requires_review' as const };
      }
      validRows++;
      return { ...row, status: 'VALID' as const, reviewStatus: 'valid' as const };
    });

    const reviewedBatch: UnifiedImportBatch = {
      ...validatedBatch,
      rows: reviewedRows,
      validRows,
      warningRows,
      errorRows,
      requiresReviewRows: warningRows + errorRows,
      updatedAt: new Date().toISOString(),
      updatedBy: context.userId || 'SYSTEM',
    };

    reviewedBatch.validationStatus = errorRows > 0 ? 'FAILED' : warningRows > 0 ? 'WARNING' : 'PASSED';

    return reviewedBatch;
  }

  /**
   * Alias for processFileIntake for backward compatibility
   */
  public static async processFileToReview(
    file: File | Blob,
    filename: string,
    context: PipelineContext,
    options: ProcessDriverTruckFileOptions = {}
  ): Promise<UnifiedImportBatch> {
    return this.processFileIntake(file, filename, context, options);
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
