/**
 * BLOCK 121 — Parsers & Normalization Engine
 * Implements the canonical parser and deterministic normalizer integrated with ImportSessionManager
 * and importService without performing production validation or Firestore writes.
 */

import { ImportSession, ImportSessionManager, importSessionManager } from './importSessionManager';
import { AuthorizationContext, ConcurrencyContext, DomainError, DomainErrorCode } from '../types/canonicalContracts';
import { CsvImportParser } from '../services/import/csvParser.service';
import { ExcelImportParser } from '../services/import/excelParser.service';
import { ExcelCsvNormalizer } from '../services/import/normalizer.service';

function createDomainError(code: DomainErrorCode, message: string, retryable = false): DomainError {
  const err = new Error(message) as DomainError;
  err.code = code;
  err.retryable = retryable;
  return err;
}

export interface NormalizedImportResult {
  session: ImportSession;
  headers: string[];
  normalizedRows: Record<string, any>[];
  totalRows: number;
}

export class CanonicalImportPipelineService {
  private csvParser = new CsvImportParser();
  private excelParser = new ExcelImportParser();
  private normalizer = new ExcelCsvNormalizer();

  /**
   * Parses raw file input into raw structured rows and transitions session to PARSED.
   */
  async parseSource(
    session: ImportSession,
    sourceData: string | ArrayBuffer | Uint8Array,
    concurrency: ConcurrencyContext,
    auth: AuthorizationContext
  ): Promise<{ session: ImportSession; headers: string[]; rawRows: Record<string, any>[] }> {
    if (session.state !== 'SOURCE') {
      throw createDomainError('INVALID_STATE_TRANSITION', `Cannot parse session in state ${session.state}; expected SOURCE`);
    }

    const sourceType = session.sourceType.toUpperCase();
    let parsedOutput;

    const importSource = {
      sourceType: (sourceType.includes('EXCEL') || sourceType.includes('XLS') ? 'EXCEL' : 'CSV') as any,
      importBatchId: session.importSessionId,
      rawInput: sourceData
    };

    if (sourceType.includes('CSV') || sourceType.includes('GOOGLE_DRIVE')) {
      parsedOutput = this.csvParser.parse(importSource, sourceData);
    } else if (sourceType.includes('EXCEL') || sourceType.includes('XLS') || sourceType.includes('XLSX')) {
      parsedOutput = this.excelParser.parse(importSource, sourceData);
    } else {
      // Default to CSV parser as fallback
      parsedOutput = this.csvParser.parse(importSource, sourceData);
    }

    if (parsedOutput.metadata?.error) {
      throw createDomainError('VALIDATION_ERROR', `Parsing failed: ${parsedOutput.metadata.error}`);
    }

    // Transition session to PARSED
    const updatedSession = await importSessionManager.transitionState(session, 'PARSED', concurrency, auth);
    updatedSession.sourceSnapshotIdentity = `snapshot_parsed_${Date.now()}`;

    return {
      session: updatedSession,
      headers: parsedOutput.headers || [],
      rawRows: parsedOutput.rows || []
    };
  }

  /**
   * Deterministically normalizes raw parsed rows and transitions session to NORMALIZED.
   */
  async normalizeRows(
    session: ImportSession,
    rawRows: Record<string, any>[],
    concurrency: ConcurrencyContext,
    auth: AuthorizationContext
  ): Promise<NormalizedImportResult> {
    if (session.state !== 'PARSED') {
      throw createDomainError('INVALID_STATE_TRANSITION', `Cannot normalize session in state ${session.state}; expected PARSED`);
    }

    const pipelineContext: any = { sessionId: session.importSessionId, projectId: session.projectId };
    const normalizedRows: Record<string, any>[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const normalizedRow = this.normalizer.normalize(row, i + 1, pipelineContext);
      normalizedRows.push(normalizedRow);
    }

    // Transition session to NORMALIZED
    const updatedSession = await importSessionManager.transitionState(session, 'NORMALIZED', concurrency, auth);
    updatedSession.normalizedSnapshotIdentity = `snapshot_normalized_${Date.now()}`;

    return {
      session: updatedSession,
      headers: Object.keys(rawRows[0] || {}),
      normalizedRows,
      totalRows: normalizedRows.length
    };
  }
}

export const canonicalImportPipelineService = new CanonicalImportPipelineService();
