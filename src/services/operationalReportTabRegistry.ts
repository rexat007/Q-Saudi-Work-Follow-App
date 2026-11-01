import type {sheets_v4} from 'googleapis';

/** Titles, stable identities and ownership version are one contract, shared with Apps Script. */
export const OPERATIONAL_TAB_METADATA_KEY = 'qsaudi.operational.tab';
export const OPERATIONAL_TAB_OWNER = 'QSAUDI_OPERATIONAL_PROFILE';
export const OPERATIONAL_TAB_SCHEMA = 1;
export const OperationalReportTabRegistry = {
  OVERVIEW: {title:'Ops Overview', previousTitle:'Project Overview', failureCode:'PROFILE_REPORT_OVERVIEW_SYNC_FAILED'},
  TRIPS: {title:'Ops Trip Register', previousTitle:'Trip Register', failureCode:'PROFILE_REPORT_TRIPS_SYNC_FAILED'},
  LIVE: {title:'Ops Live Movement', previousTitle:'Live Movement', failureCode:'PROFILE_REPORT_LIVE_SYNC_FAILED'},
  DAILY: {title:'Ops Daily Operations', previousTitle:'Daily Operations', failureCode:'PROFILE_REPORT_DAILY_SYNC_FAILED'},
  CARRIER: {title:'Ops Carrier Performance', previousTitle:'Carrier Performance', failureCode:'PROFILE_REPORT_CARRIER_SYNC_FAILED'},
  FLEET: {title:'Ops Driver & Truck Performance', previousTitle:'Driver & Truck Performance', failureCode:'PROFILE_REPORT_FLEET_SYNC_FAILED'},
  EXCEPTIONS: {title:'Ops Exceptions', previousTitle:'Exceptions', failureCode:'PROFILE_REPORT_EXCEPTIONS_SYNC_FAILED'},
  DASHBOARD: {title:'Ops Dashboard', previousTitle:'Dashboard', failureCode:'PROFILE_REPORT_DASHBOARD_SYNC_FAILED'},
  AUDIT: {title:'Ops Audit', previousTitle:'Audit', failureCode:'PROFILE_REPORT_AUDIT_SYNC_FAILED'},
} as const;
export type OperationalTabId = keyof typeof OperationalReportTabRegistry;
export interface OperationalTabOwnership {tabId:OperationalTabId;templateId:string}
export const operationalTabIds=Object.keys(OperationalReportTabRegistry) as OperationalTabId[];
export function operationalTabByTitle(title:string):OperationalTabId|undefined {
  return operationalTabIds.find(id=>OperationalReportTabRegistry[id].title===title);
}
export class OperationalTabError extends Error {
  readonly statusCode=409;
  constructor(public code:'PROFILE_REPORT_TAB_CONFLICT'|'PROFILE_REPORT_TAB_OWNERSHIP_INVALID'){super(code);}
}
export function operationalTabMarker(ownership:OperationalTabOwnership):string {
  if(!operationalTabIds.includes(ownership.tabId)||!['DUAL_WEIGHBRIDGE_V1','LOADING_SCALE_ONLY_V1','UNLOADING_SCALE_ONLY_V1','NO_WEIGHBRIDGE_V1'].includes(ownership.templateId))throw new OperationalTabError('PROFILE_REPORT_TAB_OWNERSHIP_INVALID');
  return JSON.stringify({owner:OPERATIONAL_TAB_OWNER,schema:OPERATIONAL_TAB_SCHEMA,templateId:ownership.templateId,tabId:ownership.tabId});
}
export function operationalTabMetadata(ownership:OperationalTabOwnership,sheetId:number):sheets_v4.Schema$DeveloperMetadata {
  return {metadataKey:OPERATIONAL_TAB_METADATA_KEY,metadataValue:operationalTabMarker(ownership),visibility:'DOCUMENT',location:{sheetId}};
}
export function assertOperationalTabOwnership(sheet:sheets_v4.Schema$Sheet,ownership:OperationalTabOwnership):void {
  const id=sheet.properties?.sheetId,markers=(sheet.developerMetadata||[]).filter(m=>m.metadataKey===OPERATIONAL_TAB_METADATA_KEY);
  if(sheet.properties?.title!==OperationalReportTabRegistry[ownership.tabId]?.title||!Number.isInteger(id)||markers.length!==1||markers[0].metadataValue!==operationalTabMarker(ownership)||markers[0].visibility!=='DOCUMENT'||markers[0].location?.sheetId!==id)throw new OperationalTabError('PROFILE_REPORT_TAB_OWNERSHIP_INVALID');
}

export const PROFILE_REVIEW_HEADERS=['Review Decision','Reviewed By','Reviewed At','Review Note'];
export function operationalTabHeaders(tabId:OperationalTabId,capabilities:{measuredLoading?:boolean;measuredUnloading?:boolean;estimatedProduction?:boolean;tripColumns?:readonly string[]}={}):string[] {
 switch(tabId){
  case 'OVERVIEW':return ['Project ID','Operational Profile','Loading Location','Destination','Template Version'];
  case 'TRIPS':return [...(capabilities.tripColumns||[]),...PROFILE_REVIEW_HEADERS];
  case 'LIVE':return ['Trip ID','Truck','Driver','Carrier','Stage','Last Event','Elapsed Minutes','Expected Arrival','Delay','Destination'];
  case 'DAILY':return ['Row Key','Date','Carrier ID','Carrier','Trips','Completed',...(capabilities.measuredLoading?['Measured Loaded Tonnes']:[]),...(capabilities.measuredUnloading?['Measured Received Tonnes']:[]),...(capabilities.estimatedProduction?['Estimated Tonnes']:[])];
  case 'CARRIER':case 'FLEET':return ['Entity Key','Period','Entity ID','Name','Trips','Completed','Average Cycle Minutes'];
  case 'EXCEPTIONS':return ['Trip ID','Carrier','Truck','Driver','Status','Delay','Exception'];
  case 'DASHBOARD':return ['Metric','Value'];
  case 'AUDIT':return ['Recorded At','Trip ID','Action','Value'];
 }
}
