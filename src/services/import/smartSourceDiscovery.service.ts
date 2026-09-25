/**
 * Smart Source Discovery Service
 * UNIT 2: Shared Service for Import Intelligence
 * 
 * Purpose:
 * Analyzes an input file or raw data to automatically discover sheets, headers, and mapping diagnostics.
 * This is discovery/read intelligence only (no database writes, no Firebase, no entity creation).
 */

import * as XLSX from 'xlsx';
import { OperationSourceType } from '../../types/entities';
import { ImportSource } from '../../types/unifiedImport';
import { ColumnMappingMatch } from '../../types/excelCsvImport';
import { ExcelCsvColumnMapper } from './columnMapper.service';

export interface DiscoveryResult {
  sourceType: OperationSourceType;
  availableSheets: string[];
  selectedSheet: string | null;
  detectedHeaderRowIndex: number;
  detectedHeaders: string[];
  mappingDiagnostics: Record<string, ColumnMappingMatch>;
  confidence: number; // 0-100 score
  requiresReview: boolean;
  ambiguityReasons: string[];
}

export class SmartSourceDiscoveryService {
  /**
   * Analyzes an input file or raw data to automatically discover sheets, headers, and mapping diagnostics.
   * This is discovery/read intelligence only (no database writes, no Firebase, no entity creation).
   */
  public async discover(
    source: ImportSource,
    inputData?: any
  ): Promise<DiscoveryResult> {
    const input = inputData || source.rawInput;
    const sourceType = source.sourceType;

    let availableSheets: string[] = [];
    let selectedSheet: string | null = null;
    let detectedHeaderRowIndex = 0;
    let detectedHeaders: string[] = [];
    let mappingDiagnostics: Record<string, ColumnMappingMatch> = {};
    let confidence = 0;
    let requiresReview = false;
    const ambiguityReasons: string[] = [];

    if (!input) {
      return {
        sourceType,
        availableSheets,
        selectedSheet,
        detectedHeaderRowIndex,
        detectedHeaders,
        mappingDiagnostics,
        confidence: 0,
        requiresReview: true,
        ambiguityReasons: ['لا توجد بيانات مدخلة للتحليل (No input data provided)'],
      };
    }

    if (sourceType === 'EXCEL' || sourceType === 'GOOGLE_DRIVE') {
      // Excel/Drive parsing
      let workbook: XLSX.WorkBook;
      try {
        if (typeof input === 'string') {
          workbook = XLSX.read(input, { type: 'binary' });
        } else {
          workbook = XLSX.read(input, { type: 'array' });
        }
      } catch (err: any) {
        return {
          sourceType,
          availableSheets,
          selectedSheet,
          detectedHeaderRowIndex,
          detectedHeaders,
          mappingDiagnostics,
          confidence: 0,
          requiresReview: true,
          ambiguityReasons: [`فشل قراءة ملف الإكسل: ${err?.message || 'تنسيق غير صالح'}`],
        };
      }

      availableSheets = workbook.SheetNames || [];
      if (availableSheets.length === 0) {
        return {
          sourceType,
          availableSheets,
          selectedSheet,
          detectedHeaderRowIndex,
          detectedHeaders,
          mappingDiagnostics,
          confidence: 0,
          requiresReview: true,
          ambiguityReasons: ['ملف الإكسل لا يحتوي على أوراق عمل'],
        };
      }

      // Try to find the best sheet by scoring each
      let bestSheet = availableSheets[0];
      let bestScore = -1;
      let bestSheetHeaderIndex = 0;
      let bestSheetHeaders: string[] = [];
      let bestSheetMappings: Record<string, ColumnMappingMatch> = {};
      let bestSheetAmbiguityReasons: string[] = [];

      for (const sheetName of availableSheets) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Convert a sample of rows to array of arrays
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          blankrows: true,
          defval: '',
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        if (rawRows.length === 0) continue;

        // Score top rows in this worksheet
        const maxScanRows = Math.min(rawRows.length, 15);
        for (let r = 0; r < maxScanRows; r++) {
          const scored = this.scoreCandidateRow(rawRows[r]);
          if (scored.score > bestScore) {
            bestScore = scored.score;
            bestSheet = sheetName;
            bestSheetHeaderIndex = r;
            bestSheetHeaders = rawRows[r].map(cell => String(cell ?? '').trim());
            bestSheetMappings = scored.mappings;
            bestSheetAmbiguityReasons = scored.ambiguityReasons;
          }
        }
      }

      selectedSheet = source.sourceSheetName || bestSheet;
      detectedHeaderRowIndex = bestSheetHeaderIndex;
      detectedHeaders = bestSheetHeaders;
      mappingDiagnostics = bestSheetMappings;
      
      // Re-score the selected sheet row if it's explicitly set by user and differed from bestSheet
      if (source.sourceSheetName && source.sourceSheetName !== bestSheet && workbook.Sheets[source.sourceSheetName]) {
        const worksheet = workbook.Sheets[source.sourceSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          blankrows: true,
          defval: '',
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });
        if (rawRows.length > 0) {
          const maxScanRows = Math.min(rawRows.length, 15);
          let localBestScore = -1;
          let localBestHeaderIdx = 0;
          let localBestHeaders: string[] = [];
          let localBestMappings: Record<string, ColumnMappingMatch> = {};
          let localBestAmbiguities: string[] = [];

          for (let r = 0; r < maxScanRows; r++) {
            const scored = this.scoreCandidateRow(rawRows[r]);
            if (scored.score > localBestScore) {
              localBestScore = scored.score;
              localBestHeaderIdx = r;
              localBestHeaders = rawRows[r].map(cell => String(cell ?? '').trim());
              localBestMappings = scored.mappings;
              localBestAmbiguities = scored.ambiguityReasons;
            }
          }
          detectedHeaderRowIndex = localBestHeaderIdx;
          detectedHeaders = localBestHeaders;
          mappingDiagnostics = localBestMappings;
          bestScore = localBestScore;
          bestSheetAmbiguityReasons = localBestAmbiguities;
        }
      }

      // Compute overall confidence and review requirements
      const { confidenceScore, requiresReviewFlag, reasons } = this.calculateFinalMetrics(
        detectedHeaders,
        mappingDiagnostics,
        bestSheetAmbiguityReasons,
        bestScore
      );

      confidence = confidenceScore;
      requiresReview = requiresReviewFlag;
      ambiguityReasons.push(...reasons);

    } else if (sourceType === 'CSV') {
      // CSV parsing
      let csvText = '';
      if (typeof input === 'string') {
        csvText = input;
      } else if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
        const decoder = new TextDecoder('utf-8');
        csvText = decoder.decode(input);
      } else {
        csvText = String(input);
      }

      if (csvText.charCodeAt(0) === 0xfeff) {
        csvText = csvText.slice(1);
      }

      const lines = this.splitCsvLines(csvText);
      if (lines.length === 0) {
        return {
          sourceType,
          availableSheets: [],
          selectedSheet: null,
          detectedHeaderRowIndex: 0,
          detectedHeaders: [],
          mappingDiagnostics: {},
          confidence: 0,
          requiresReview: true,
          ambiguityReasons: ['ملف الـ CSV فارغ'],
        };
      }

      const delimiter = this.detectDelimiter(lines[0]);
      const maxScanLines = Math.min(lines.length, 15);
      let bestScore = -1;
      let bestHeaderIndex = 0;
      let bestHeaders: string[] = [];
      let bestMappings: Record<string, ColumnMappingMatch> = {};
      let bestAmbiguityReasons: string[] = [];

      for (let r = 0; r < maxScanLines; r++) {
        const tokens = this.parseCsvLine(lines[r], delimiter);
        const scored = this.scoreCandidateRow(tokens);
        if (scored.score > bestScore) {
          bestScore = scored.score;
          bestHeaderIndex = r;
          bestHeaders = tokens.map(t => t.trim());
          bestMappings = scored.mappings;
          bestAmbiguityReasons = scored.ambiguityReasons;
        }
      }

      detectedHeaderRowIndex = bestHeaderIndex;
      detectedHeaders = bestHeaders;
      mappingDiagnostics = bestMappings;

      const { confidenceScore, requiresReviewFlag, reasons } = this.calculateFinalMetrics(
        detectedHeaders,
        mappingDiagnostics,
        bestAmbiguityReasons,
        bestScore
      );

      confidence = confidenceScore;
      requiresReview = requiresReviewFlag;
      ambiguityReasons.push(...reasons);

    } else if (sourceType === 'GOOGLE_SHEETS') {
      // Google Sheets parsing
      let values: any[][] = [];
      let sheetName = source.sourceSheetName || 'Sheet1';

      if (Array.isArray(input)) {
        values = input;
      } else if (typeof input === 'object' && Array.isArray((input as any).values)) {
        values = (input as any).values;
        if ((input as any).sheetName) {
          sheetName = (input as any).sheetName;
        }
      }

      selectedSheet = sheetName;
      availableSheets = [sheetName];

      if (values.length === 0) {
        return {
          sourceType,
          availableSheets,
          selectedSheet,
          detectedHeaderRowIndex: 0,
          detectedHeaders: [],
          mappingDiagnostics: {},
          confidence: 0,
          requiresReview: true,
          ambiguityReasons: ['جدول بيانات Google Sheets فارغ'],
        };
      }

      const maxScanRows = Math.min(values.length, 15);
      let bestScore = -1;
      let bestHeaderIndex = 0;
      let bestHeaders: string[] = [];
      let bestMappings: Record<string, ColumnMappingMatch> = {};
      let bestAmbiguityReasons: string[] = [];

      for (let r = 0; r < maxScanRows; r++) {
        const scored = this.scoreCandidateRow(values[r]);
        if (scored.score > bestScore) {
          bestScore = scored.score;
          bestHeaderIndex = r;
          bestHeaders = values[r].map(cell => String(cell ?? '').trim());
          bestMappings = scored.mappings;
          bestAmbiguityReasons = scored.ambiguityReasons;
        }
      }

      detectedHeaderRowIndex = bestHeaderIndex;
      detectedHeaders = bestHeaders;
      mappingDiagnostics = bestMappings;

      const { confidenceScore, requiresReviewFlag, reasons } = this.calculateFinalMetrics(
        detectedHeaders,
        mappingDiagnostics,
        bestAmbiguityReasons,
        bestScore
      );

      confidence = confidenceScore;
      requiresReview = requiresReviewFlag;
      ambiguityReasons.push(...reasons);

    } else {
      // Handle other source types gracefully
      if (Array.isArray(input) && input.length > 0) {
        detectedHeaders = Object.keys(input[0] || {});
      }
      confidence = 50;
      requiresReview = true;
      ambiguityReasons.push(`نوع المصدر غير مدعوم للتحليل الذكي: ${sourceType}`);
    }

    return {
      sourceType,
      availableSheets,
      selectedSheet,
      detectedHeaderRowIndex,
      detectedHeaders,
      mappingDiagnostics,
      confidence,
      requiresReview,
      ambiguityReasons,
    };
  }

  /**
   * Deterministic scoring function for a candidate header row
   */
  private scoreCandidateRow(row: any[]): {
    score: number;
    mappings: Record<string, ColumnMappingMatch>;
    matchedFields: Set<string>;
    ambiguityReasons: string[];
  } {
    const headers = row.map((cell) => String(cell ?? '').trim());
    const nonEmptyHeaders = headers.filter((h) => h !== '');

    if (nonEmptyHeaders.length < 2) {
      return {
        score: 0,
        mappings: {},
        matchedFields: new Set(),
        ambiguityReasons: ['أعمدة فارغة أو قليلة جداً في هذا الصف'],
      };
    }

    // Call static mapper to get mapping matches
    const mappings = ExcelCsvColumnMapper.mapHeaders(headers);

    let totalConfidence = 0;
    const matchedFields = new Set<string>();
    const duplicateFields = new Set<string>();
    let numericOrDateCount = 0;
    const ambiguityReasons: string[] = [];

    for (const header of headers) {
      if (!header) continue;

      // Check if value is purely numeric or date
      const isNum = !isNaN(Number(header)) && header !== '';
      const isDate = !isNaN(Date.parse(header)) && isNaN(Number(header)) && header.includes('-');
      if (isNum || isDate) {
        numericOrDateCount++;
      }

      const match = mappings[header];
      if (match && match.confidence >= 0.70 && !String(match.canonicalField).startsWith('unmapped_')) {
        totalConfidence += match.confidence;
        if (matchedFields.has(match.canonicalField as string)) {
          duplicateFields.add(match.canonicalField as string);
        } else {
          matchedFields.add(match.canonicalField as string);
        }
      }
    }

    // Base score is derived from number of unique canonical fields matched
    let score = matchedFields.size * 25;

    // Confidence weight
    score += totalConfidence * 15;

    // Heavily penalize if columns look like numbers or dates instead of headers
    if (numericOrDateCount > 0) {
      score -= numericOrDateCount * 30;
    }

    // Penalize duplicates
    if (duplicateFields.size > 0) {
      score -= duplicateFields.size * 40;
      ambiguityReasons.push(
        `تكرار في حقول المخطط لنفس العمود: ${Array.from(duplicateFields).join(', ')}`
      );
    }

    // Penalize if too many columns are empty
    const emptyRatio = (headers.length - nonEmptyHeaders.length) / headers.length;
    if (emptyRatio > 0.5) {
      score -= emptyRatio * 50;
    }

    return {
      score: Math.max(0, score),
      mappings,
      matchedFields,
      ambiguityReasons,
    };
  }

  /**
   * Evaluates final confidence score, requiresReview status, and ambiguity reasons
   */
  private calculateFinalMetrics(
    headers: string[],
    mappings: Record<string, ColumnMappingMatch>,
    ambiguities: string[],
    score: number
  ): { confidenceScore: number; requiresReviewFlag: boolean; reasons: string[] } {
    const reasons = [...ambiguities];
    let requiresReviewFlag = false;

    // Count mapped canonical fields
    const mappedFields = new Set<string>();
    let unmappedCount = 0;
    let lowConfidenceCount = 0;

    for (const header of headers) {
      if (!header) continue;
      const match = mappings[header];
      if (match) {
        if (match.confidence < 0.70 || String(match.canonicalField).startsWith('unmapped_')) {
          unmappedCount++;
          if (match.confidence > 0 && match.confidence < 0.70) {
            lowConfidenceCount++;
          }
        } else {
          mappedFields.add(match.canonicalField as string);
        }
      }
    }

    // Must map at least these core fields for high confidence: ticketId, truckNo, carrier, shiftDate, netWeight (or gross/tare)
    const hasTicketId = mappedFields.has('ticketId');
    const hasTruckNo = mappedFields.has('truckNo');
    const hasCarrier = mappedFields.has('carrier');
    const hasShiftDate = mappedFields.has('shiftDate');
    const hasNetWeight = mappedFields.has('netWeight') || (mappedFields.has('grossWeight') && mappedFields.has('tareWeight'));

    const coreFieldsMappedCount = [
      hasTicketId,
      hasTruckNo,
      hasCarrier,
      hasShiftDate,
      hasNetWeight,
    ].filter(Boolean).length;

    // Calculate a confidence percentage on a 0-100 scale
    let confidenceScore = 0;
    if (score > 0) {
      // Scale based on core fields mapped (50%) + total unique fields mapped (50%)
      const coreScore = (coreFieldsMappedCount / 5) * 50;
      const totalMappedScore = Math.min((mappedFields.size / 8) * 50, 50);
      confidenceScore = Math.round(coreScore + totalMappedScore);
    }

    // Deduct for unmapped or low confidence fields
    if (lowConfidenceCount > 0) {
      confidenceScore -= lowConfidenceCount * 5;
    }

    confidenceScore = Math.max(10, Math.min(100, confidenceScore));

    // Determine requiresReview flag
    if (coreFieldsMappedCount < 3) {
      requiresReviewFlag = true;
      reasons.push('عدد الحقول الأساسية المطابقة أقل من 3 حقول (مطلوب على الأقل: رقم التذكرة، رقم اللوحة، الناقل، التاريخ، والوزن الصافي)');
    }

    if (unmappedCount > headers.length * 0.5) {
      requiresReviewFlag = true;
      reasons.push('أكثر من 50% من أعمدة الملف غير مطابقة لأي حقل قياسي في النظام');
    }

    if (reasons.length > 0) {
      requiresReviewFlag = true;
    }

    return {
      confidenceScore,
      requiresReviewFlag,
      reasons,
    };
  }

  /**
   * Helper to split lines handling newlines inside quotes
   */
  private splitCsvLines(text: string): string[] {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        insideQuotes = !insideQuotes;
        currentLine += char;
      } else if (!insideQuotes && (char === '\r' || char === '\n')) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        if (currentLine.trim() !== '') {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }

    if (currentLine.trim() !== '') {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Parses a single CSV line into tokens, respecting quotes and escaped quotes
   */
  private parseCsvLine(line: string, delimiter: string): string[] {
    const tokens: string[] = [];
    let currentToken = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentToken += '"';
          i++; // skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        tokens.push(currentToken);
        currentToken = '';
      } else {
        currentToken += char;
      }
    }

    tokens.push(currentToken);
    return tokens;
  }

  /**
   * Detects delimiter (comma, semicolon, tab)
   */
  private detectDelimiter(sampleLine: string): string {
    if (!sampleLine) return ',';
    const commaCount = (sampleLine.match(/,/g) || []).length;
    const semiCount = (sampleLine.match(/;/g) || []).length;
    const tabCount = (sampleLine.match(/\t/g) || []).length;

    if (semiCount > commaCount && semiCount > tabCount) return ';';
    if (tabCount > commaCount && tabCount > semiCount) return '\t';
    return ',';
  }
}

export const smartSourceDiscoveryService = new SmartSourceDiscoveryService();
