/**
 * BLOCK 122 — Validation & Deduplication Engine
 * Implements the canonical validation and deduplication service wrapping existing
 * ExcelCsvTripValidator and ExcelCsvTripDuplicateChecker, integrated with ImportSessionManager
 * (advancing session NORMALIZED -> VALIDATED) without performing write operations.
 */

import { ImportSession, ImportSessionManager, importSessionManager } from './importSessionManager';
import { AuthorizationContext, ConcurrencyContext, DomainError, DomainErrorCode } from '../types/canonicalContracts';
import { ExcelCsvTripValidator } from './import/tripImportValidator';
import { ExcelCsvTripDuplicateChecker } from './import/tripDuplicateChecker';

function createDomainError(code: DomainErrorCode, message: string, retryable = false): DomainError {
  const err = new Error(message) as DomainError;
  err.code = code;
  err.retryable = retryable;
  return err;
}

export interface ValidationAndDeduplicationResult {
  session: ImportSession;
  validRows: Record<string, any>[];
  issues: any[];
  duplicates: any[];
  totalValidated: number;
}

export class CanonicalValidationService {
  private validator = new ExcelCsvTripValidator();
  private duplicateChecker = new ExcelCsvTripDuplicateChecker();

  /**
   * Validates and deduplicates normalized rows and transitions session NORMALIZED -> VALIDATED.
   */
  async validateAndDeduplicate(
    session: ImportSession,
    normalizedRows: Record<string, any>[],
    concurrency: ConcurrencyContext,
    auth: AuthorizationContext
  ): Promise<ValidationAndDeduplicationResult> {
    if (session.state !== 'NORMALIZED') {
      throw createDomainError('INVALID_STATE_TRANSITION', `Cannot validate session in state ${session.state}; expected NORMALIZED`);
    }

    const pipelineContext: any = { sessionId: session.importSessionId, projectId: session.projectId, profile: 'STANDARD' };
    const allIssues: any[] = [];
    const wrappedRows = normalizedRows.map((r, index) => ({
      rowNumber: index + 1,
      sourceRowId: r.sourceRowId || index + 1,
      raw: r,
      canonical: { projectId: session.projectId, ...r },
      mapped: r,
      validationIssues: [],
      reviewStatus: 'accepted' as const,
      status: 'PENDING' as const
    }));

    // 1. Structural & Domain Validation
    const validatedRowsWithIssues = wrappedRows.map((row) => {
      const rowIssues = this.validator.validateRow(row, pipelineContext);
      if (rowIssues.length > 0) {
        allIssues.push(...rowIssues);
      }
      const hasBlocking = rowIssues.some(i => i.blocking || i.severity === 'BLOCKING');
      const hasWarning = rowIssues.some(i => i.severity === 'WARNING');
      return {
        ...row,
        validationIssues: rowIssues,
        status: hasBlocking ? ('ERROR' as const) : hasWarning ? ('WARNING' as const) : ('VALID' as const),
        reviewStatus: hasBlocking ? ('error' as const) : hasWarning ? ('warning' as const) : ('accepted' as const)
      };
    });

    // 2. Deterministic Deduplication Check
    const checkedRows = this.duplicateChecker.checkDuplicates(validatedRowsWithIssues, pipelineContext);
    
    const duplicates = checkedRows.filter(r => r.duplicateInfo?.isDuplicate);
    const validRows = checkedRows.filter(r => r.status !== 'ERROR' && !r.duplicateInfo?.isDuplicate).map(r => r.mapped || r.raw);

    // Transition session NORMALIZED -> VALIDATED
    const updatedSession = await importSessionManager.transitionState(session, 'VALIDATED', concurrency, auth);

    return {
      session: updatedSession,
      validRows,
      issues: allIssues,
      duplicates,
      totalValidated: normalizedRows.length
    };
  }
}

export const canonicalValidationService = new CanonicalValidationService();
