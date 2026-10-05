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
  PreparedDriverPlan,
  PreparedTruckPlan,
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
   * Applies a non-persisted PREPARED_NEW plan across ALL rows matching an exact driver group key.
   * NO server mutations or Firestore writes occur.
   */
  public static applyPreparedNewDriverPlan(
    batch: UnifiedImportBatch,
    normalizedSourceKey: string,
    plan: PreparedDriverPlan,
    context?: PipelineContext
  ): UnifiedImportBatch {
    const updatedRows = batch.rows.map((row) => {
      const key = RosterBatchReviewService.getGroupKey(row, 'driver');
      if (key !== normalizedSourceKey) return row;

      const resolutions = { ...(row.entityResolutions || {}) };
      resolutions.driver = {
        entityType: 'DRIVER',
        originalValue: plan.driverName,
        sourceValue: plan.driverName,
        matchedName: plan.driverName,
        confidence: 1.0,
        isExact: true,
        isAuthorized: true,
        riskLevel: 'LOW',
        relationshipStatus: 'VALID',
        recommendation: 'ACCEPT',
        matchMethod: 'NONE',
        creationDisposition: 'PREPARED_NEW',
        preparedDriverPlan: plan,
      };

      const resolved = { ...(row.resolvedValues || {}) };
      resolved.driverName = plan.driverName;
      resolved.residencyId = plan.residencyId;
      if (plan.phone) resolved.driverPhone = plan.phone;

      return {
        ...row,
        entityResolutions: resolutions,
        resolvedValues: resolved,
      };
    });

    const updatedBatch: UnifiedImportBatch = {
      ...batch,
      rows: updatedRows,
    };

    if (context) {
      return this.revalidateRosterBatch(updatedBatch, context);
    }
    return updatedBatch;
  }

  /**
   * Applies a non-persisted PREPARED_NEW plan across ALL rows matching an exact truck group key.
   * NO server mutations or Firestore writes occur.
   */
  public static applyPreparedNewTruckPlan(
    batch: UnifiedImportBatch,
    normalizedSourceKey: string,
    plan: PreparedTruckPlan,
    context?: PipelineContext
  ): UnifiedImportBatch {
    const updatedRows = batch.rows.map((row) => {
      const key = RosterBatchReviewService.getGroupKey(row, 'truck');
      if (key !== normalizedSourceKey) return row;

      const resolutions = { ...(row.entityResolutions || {}) };
      resolutions.truck = {
        entityType: 'TRUCK',
        originalValue: plan.plateNumber,
        sourceValue: plan.plateNumber,
        matchedName: plan.plateNumber,
        confidence: 1.0,
        isExact: true,
        isAuthorized: true,
        riskLevel: 'LOW',
        relationshipStatus: 'VALID',
        recommendation: 'ACCEPT',
        matchMethod: 'NONE',
        creationDisposition: 'PREPARED_NEW',
        preparedTruckPlan: plan,
      };

      const resolved = { ...(row.resolvedValues || {}) };
      resolved.truckPlate = plan.plateNumber;
      if (plan.truckType) resolved.truckType = plan.truckType;
      if (plan.tareWeightKg !== undefined) resolved.tareWeightKg = plan.tareWeightKg;
      if (plan.maxGrossWeightKg !== undefined) resolved.maxGrossWeightKg = plan.maxGrossWeightKg;

      return {
        ...row,
        entityResolutions: resolutions,
        resolvedValues: resolved,
      };
    });

    const updatedBatch: UnifiedImportBatch = {
      ...batch,
      rows: updatedRows,
    };

    if (context) {
      return this.revalidateRosterBatch(updatedBatch, context);
    }
    return updatedBatch;
  }

  /**
   * Automatically prepares PREPARED_NEW plans for clean UNRESOLVED driver and truck groups
   * that have complete source data and zero conflicts.
   * NO server mutations occur.
   */
  public static autoPrepareCleanNewGroups(
    batch: UnifiedImportBatch,
    context?: PipelineContext
  ): UnifiedImportBatch {
    let currentBatch = { ...batch };
    const groups = RosterBatchReviewService.getBatchReviewGroups(currentBatch);

    // Auto-prepare clean drivers
    for (const group of groups.driver || []) {
      if (group.status === 'UNRESOLVED' && !group.matchedId && !group.preparedDriverPlan) {
        const defaults = RosterBatchReviewService.deriveDriverCreationDefaults(currentBatch, group);
        if (!defaults.hasConflict && defaults.driverName && defaults.residencyId && defaults.carrierId) {
          currentBatch = this.applyPreparedNewDriverPlan(currentBatch, group.normalizedSourceKey, {
            driverName: defaults.driverName,
            residencyId: defaults.residencyId,
            phone: defaults.phone || undefined,
            carrierId: defaults.carrierId,
          });
        }
      }
    }

    // Auto-prepare clean trucks
    const reGroups = RosterBatchReviewService.getBatchReviewGroups(currentBatch);
    for (const group of reGroups.truck || []) {
      if (group.status === 'UNRESOLVED' && !group.matchedId && !group.preparedTruckPlan) {
        const defaults = RosterBatchReviewService.deriveTruckCreationDefaults(currentBatch, group);
        if (!defaults.hasConflict && defaults.plateNumber && defaults.carrierId) {
          currentBatch = this.applyPreparedNewTruckPlan(currentBatch, group.normalizedSourceKey, {
            plateNumber: defaults.plateNumber,
            truckType: defaults.truckType || undefined,
            tareWeightKg: defaults.tareWeightKg,
            maxGrossWeightKg: defaults.maxGrossWeightKg,
            carrierId: defaults.carrierId,
          });
        }
      }
    }

    if (context) {
      return this.revalidateRosterBatch(currentBatch, context);
    }
    return currentBatch;
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
    const duplicateChecker = new DriverTruckImportDuplicateChecker();

    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    let requiresReviewRows = 0;

    const dynamicCodes = new Set([
      'EMPTY_ROW_DATA',
      'MISSING_DRIVER_NAME',
      'INVALID_ID_FORMAT',
      'MISSING_PLATE',
      'UNRESOLVED_CARRIER',
      'DRIVER_CARRIER_CONFLICT',
      'RELATIONSHIP_CONFLICT',
      'UNRESOLVED_MATERIAL',
      'UNAUTHORIZED_MATERIAL',
      'MATERIAL_PROJECT_CONFLICT',
      'CARRIER_UNRESOLVED',
      'MATERIAL_UNRESOLVED',
    ]);

    const updatedRows = batch.rows.map((row) => {
      const freshRosterIssues = validator.validateRow(row, context);

      const carrierResolved = Boolean(row.entityResolutions?.carrier?.matchedId);
      const materialResolved = Boolean(row.entityResolutions?.material?.matchedId);

      const preservedIssues = (row.validationIssues || []).filter((issue) => {
        if (dynamicCodes.has(issue.code)) return false;
        if (carrierResolved && issue.code.includes('CARRIER')) return false;
        if (materialResolved && issue.code.includes('MATERIAL')) return false;
        return true;
      });

      const issueMap = new Map<string, any>();
      preservedIssues.forEach((i) => {
        const key = `${i.code}_${i.field || ''}_${i.issueId || ''}`;
        issueMap.set(key, i);
      });
      freshRosterIssues.forEach((i) => {
        const key = `${i.code}_${i.field || ''}_${i.issueId || ''}`;
        issueMap.set(key, i);
      });

      const mergedIssues = Array.from(issueMap.values());

      return {
        ...row,
        validationIssues: mergedIssues,
      };
    });

    // Re-check duplicates across rows
    const rowsWithDuplicates = duplicateChecker.checkDuplicates(updatedRows, context);

    const evaluatedRows = rowsWithDuplicates.map((row) => {
      const issues = row.validationIssues || [];
      const blockingErrorIssues = issues.filter(
        (i) => (i.severity === 'BLOCKING' || i.blocking) && i.code !== 'UNRESOLVED_CARRIER' && i.code !== 'UNRESOLVED_MATERIAL'
      );
      const hasBlocking = blockingErrorIssues.length > 0;

      const carrierUnresolved = !row.entityResolutions?.carrier?.matchedId;
      const materialUnresolved = !row.entityResolutions?.material?.matchedId;
      
      const driverResolved = Boolean(
        row.entityResolutions?.driver?.matchedId ||
        (row.entityResolutions?.driver?.creationDisposition === 'PREPARED_NEW' && row.entityResolutions?.driver?.preparedDriverPlan)
      );
      const driverUnresolved = Boolean(row.canonical?.driverName) && !driverResolved;

      const truckResolved = Boolean(
        row.entityResolutions?.truck?.matchedId ||
        (row.entityResolutions?.truck?.creationDisposition === 'PREPARED_NEW' && row.entityResolutions?.truck?.preparedTruckPlan)
      );
      const truckUnresolved = Boolean(row.canonical?.truckPlate) && !truckResolved;

      const isUnresolved = carrierUnresolved || materialUnresolved || driverUnresolved || truckUnresolved;
      const hasWarningOnly = !hasBlocking && !isUnresolved && issues.some((i) => i.severity === 'WARNING');

      let rowStatus: 'VALID' | 'WARNING' | 'ERROR' | 'PENDING' = 'VALID';
      let reviewStatus: 'accepted' | 'requires_review' | 'warning' | 'error' = 'accepted';

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
        reviewStatus = 'accepted';
        validRows++;
      }

      return {
        ...row,
        validationIssues: issues,
        status: rowStatus,
        reviewStatus,
      };
    });

    // Authoritative batch issues: strictly equals flattened CURRENT row.validationIssues
    const allRowIssues = evaluatedRows.flatMap((row) => row.validationIssues || []);

    let validationStatus: 'PENDING' | 'PASSED' | 'WARNING' | 'FAILED' = 'PASSED';
    let commitStatus: any = 'READY_TO_COMMIT';

    if (errorRows > 0) {
      validationStatus = 'FAILED';
      commitStatus = 'AWAITING_REVIEW';
    } else if (requiresReviewRows > 0) {
      validationStatus = 'PENDING';
      commitStatus = 'AWAITING_REVIEW';
    } else if (warningRows > 0) {
      validationStatus = 'WARNING';
      commitStatus = batch.warningConfirmation?.confirmed ? 'READY_TO_COMMIT' : 'AWAITING_REVIEW';
    } else {
      validationStatus = 'PASSED';
      commitStatus = 'READY_TO_COMMIT';
    }

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
      rows: evaluatedRows,
      issues: allRowIssues,
      validRows,
      warningRows,
      errorRows,
      requiresReviewRows,
      validationStatus,
      commitStatus: batch.commitStatus === 'COMMITTED' ? 'COMMITTED' : commitStatus,
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
