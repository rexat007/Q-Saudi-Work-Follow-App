/** Extracted from owner workbook SHA256 94aa2faeb651e0ade869a4f8adab325bcff114ebd2faa7d093e3c005243cb54d.
 * The XLSX is evidence only. Runtime provisioning copies the configured Google template. */
export const REQUIRED_GOOGLE_TABS = ['Loading Register', 'Offload Data', 'Offload Operations Audit', 'Daily Summary', 'Carrier Report Viewer', 'Carrier Daily Report', 'Dashboard'] as const;
export const LOADING_HEADERS = ['Ticket ID','First WB Date/Time','Second WB Date/Time','Port Cycle Time','Transporter','Truck No.','Weight (Tons)','Arrival Time','Unloading Complete','Trip Status','Arrival to Completion','Offload Weight (Tons)','Weight Variance (Tons)','Trip Key','Source / Ticket Series','Product','Source Weight Unit','Tare Weight (Source)','Gross Weight (Source)','Net Weight (Source)','Loading Data Status','Offload Matches','Unloading Start','Waiting Time','Unloading Duration','Weight Variance %','Receipt Data Status','Review Decision','Closed At'];
export const OFFLOAD_HEADERS = ['Truck No.','Arrival Time','Unloading Complete','Offload Weight (Tons)','Destination','Remarks','Trip Key','Unloading Start','Receipt No.','Reviewed By','Reviewed At','Review Decision','Receipt Data Status','Loading Matches','Loading Complete','Loaded Tons','Loading Data Status'];
export const LOADING_WRITABLE = ['A','B','C','E','F','O','P','Q','R','S'] as const;
export const OFFLOAD_WRITABLE = ['B','C','D','E','F','G','I'] as const;
export const LOADING_FORMULAS = ['D','G','H','I','J','K','L','M','N','T','U','V','W','X','Y','Z','AA','AB','AC'];
export const OFFLOAD_FORMULAS = ['A','H','M','N','O','P','Q'];
export type SheetInput = string | number | null | undefined;
export interface OperationalSheetInput {
  tripId: string; projectId: string; ticketId: string; ticketSeries: string;
  firstWeighbridgeAt?: string; secondWeighbridgeAt?: string;
  carrierLabel?: string; truckPlate?: string; materialLabel?: string;
  weightUnit: 'kg' | 'tonne'; tare?: number; gross?: number;
  arrivalAt?: string; offloadCompleteAt?: string; warehouseWeightTonnes?: number;
  destination?: string; remarks?: string | null; receiptNo?: string;
}
export function sheetCorrelation(input: Pick<OperationalSheetInput, 'ticketId' | 'ticketSeries'>) {
  if (!input.ticketId?.trim() || !input.ticketSeries?.trim() || /[|\r\n]/.test(input.ticketId + input.ticketSeries)) throw new Error('SHEET_CORRELATION_REQUIRED');
  return `${input.ticketSeries.trim().toUpperCase()}|${input.ticketId.trim()}`;
}
function sheetDate(value?: string): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('SHEET_TIMESTAMP_INVALID');
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) throw new Error('SHEET_TIMESTAMP_INVALID');
  // Template operational timezone is Asia/Riyadh (UTC+03:00). Numeric serial preserves ISNUMBER formulas.
  return (epoch + 3 * 3600000) / 86400000 + 25569;
}
export function sourceCells(input: OperationalSheetInput) {
  const key = sheetCorrelation(input);
  if (!['kg','tonne'].includes(input.weightUnit)) throw new Error('SHEET_WEIGHT_UNIT_INVALID');
  for (const value of [input.tare,input.gross,input.warehouseWeightTonnes]) if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new Error('SHEET_WEIGHT_INVALID');
  return {
    loading: { A:input.ticketId.trim(), B:sheetDate(input.firstWeighbridgeAt), C:sheetDate(input.secondWeighbridgeAt), E:input.carrierLabel, F:input.truckPlate, O:input.ticketSeries.trim().toUpperCase(), P:input.materialLabel, Q:input.weightUnit, R:input.tare, S:input.gross } as Record<string,SheetInput>,
    offload: { B:sheetDate(input.arrivalAt), C:sheetDate(input.offloadCompleteAt), D:input.warehouseWeightTonnes, E:input.destination, F:input.remarks, G:key, I:input.receiptNo } as Record<string,SheetInput>,
    hasOffload: [input.arrivalAt,input.offloadCompleteAt,input.warehouseWeightTonnes,input.receiptNo].some(v=>v!==undefined), key,
  };
}
/** Missing fields never clear operator input. Only Remarks accepts explicit clear in GWS1. */
export function writableCells(cells: Record<string,SheetInput>, allowed: readonly string[]) {
  return Object.entries(cells).filter(([column,value])=> {
    if (!allowed.includes(column)) throw new Error('SHEET_COLUMN_NOT_WRITABLE');
    if (value === null && column !== 'F') throw new Error('SHEET_CLEAR_NOT_ALLOWED');
    return value !== undefined;
  }).map(([column,value])=>[column,value===null?'':value] as const);
}
