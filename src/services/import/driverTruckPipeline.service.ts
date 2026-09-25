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

export interface ProcessDriverTruckFileOptions {
  sheetName?: string;
  headerRowIndex?: number;
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
    };

    // Instantiate appropriate parser
    const parser = sourceType === 'EXCEL' ? new ExcelImportParser() : new CsvImportParser();

    // Use our custom driver/truck stages
    const normalizer = new DriverTruckImportNormalizer();
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
