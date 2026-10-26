import * as XLSX from 'xlsx';
import { FileIntakeValidator, MAX_IMPORT_FILE_SIZE_BYTES } from './fileIntake.validator';

// Roster-only working-state ceilings. The row bound matches existing Google Sheets intake
// (10,000); column/cell bounds prevent sparse worksheet ranges from expanding unchecked.
export const MAX_ROSTER_SOURCE_ROWS = 10000;
export const MAX_ROSTER_SOURCE_COLUMNS = 256;
export const MAX_ROSTER_SOURCE_CELLS = 1000000;
export class RosterSourceError extends Error {
  constructor(public code: string) { super(code); }
}
export function rosterErrorKey(error: unknown): string {
  const code = error instanceof RosterSourceError ? error.code : 'FILE_PARSE_ERROR';
  const keys: Record<string, string> = {
    FILE_UNSUPPORTED: 'import.roster.unsupported', FILE_EMPTY: 'import.roster.empty',
    FILE_TOO_LARGE: 'import.roster.tooLarge', FILE_MIME_MISMATCH: 'import.roster.mime',
    FILE_READ_ERROR: 'import.roster.read', FILE_PARSE_ERROR: 'import.roster.parse',
    SOURCE_LIMIT: 'import.roster.limit', HEADER_INVALID: 'import.roster.headers',
    MAPPING_DUPLICATE: 'import.roster.duplicate', MAPPING_REQUIRED: 'import.roster.required',
    MAPPING_SOURCE: 'import.roster.source',
  };
  return keys[code] || keys.FILE_PARSE_ERROR;
}
export function validateRosterFile(file: { name: string; size: number; type?: string }) {
  const result = FileIntakeValidator.validate(file.name, file.size, file.type);
  if (!result.isValid) {
    const code = result.fileType === 'UNSUPPORTED' ? 'FILE_UNSUPPORTED' : file.size <= 0 ? 'FILE_EMPTY' : file.size > MAX_IMPORT_FILE_SIZE_BYTES ? 'FILE_TOO_LARGE' : 'FILE_MIME_MISMATCH';
    throw new RosterSourceError(code);
  }
  return result;
}
export interface RosterSourceColumn { label: string; key: string; index: number }
export function rosterSourceColumns(labels: unknown[]): RosterSourceColumn[] {
  const reserved = new Set(labels.map(v => String(v ?? '').trim()).filter(Boolean)), used = new Set<string>();
  return labels.map((value, index) => {
    const label = String(value ?? '').trim(), base = label || `عمود_${index + 1}`;
    let key = base, suffix = 2;
    while (used.has(key) || (!label && reserved.has(key)) || key.startsWith('_')) key = `${base.startsWith('_') ? 'column' : base}_${suffix++}`;
    if (used.has(base)) { key = `${base}_${suffix++}`; while (used.has(key) || reserved.has(key)) key = `${base}_${suffix++}`; }
    used.add(key);
    return { label, key, index };
  });
}
export function assertRosterDimensions(rows: number, columns: number) {
  if (rows > MAX_ROSTER_SOURCE_ROWS || columns > MAX_ROSTER_SOURCE_COLUMNS || rows * columns > MAX_ROSTER_SOURCE_CELLS) throw new RosterSourceError('SOURCE_LIMIT');
}
export function assertRosterWorksheet(sheet: XLSX.WorkSheet) {
  const ref = sheet['!fullref'] || sheet['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  assertRosterDimensions(range.e.r + 1, range.e.c + 1);
}

export function assertRosterSourceKeys(headers: string[], approvedKeys?: string[]) {
  if (approvedKeys?.some(key => !headers.includes(key))) throw new RosterSourceError('MAPPING_SOURCE');
}
