import {ProjectValidator} from '../validators/project.validator';
import {FOUNDATION_FIELDS,FOUNDATION_SETTINGS} from './projectMutability.policy';
import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
export const governanceFail=(code:string,status=409):never=>{throw new GlobalIdentityError(code,'',status);};
export function governanceExact(value:any,keys:readonly string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))governanceFail('INVALID_GOVERNANCE_COMMAND',422);}
/** Same current ProjectCommands foundation fields/type/date/location/tax rules. */
export function governanceFoundation(value:any){
 governanceExact(value,FOUNDATION_FIELDS);
 for(const k of ['nameAr','nameEn','clientName','description','startDate','endDate'])if(value[k]!==undefined&&(typeof value[k]!=='string'||value[k].length>4000))governanceFail('INVALID_PROJECT_COMMAND',422);
 for(const k of ['startDate','endDate'])if(value[k]){const d=new Date(value[k]);if(!/^\d{4}-\d{2}-\d{2}$/.test(value[k])||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value[k])governanceFail('INVALID_PROJECT_COMMAND',422);}
 if(value.location!==undefined){governanceExact(value.location,['lat','lng','geoFenceRadiusMeters','addressAr']);const l=value.location;if(typeof l.addressAr!=='string'||!Number.isFinite(l.lat)||Math.abs(l.lat)>90||!Number.isFinite(l.lng)||Math.abs(l.lng)>180||!Number.isFinite(l.geoFenceRadiusMeters)||l.geoFenceRadiusMeters<=0)governanceFail('INVALID_PROJECT_COMMAND',422);}
 if(value.settings!==undefined){governanceExact(value.settings,FOUNDATION_SETTINGS);if(value.settings.zatcaTaxNumber!==undefined&&typeof value.settings.zatcaTaxNumber!=='string'||value.settings.currency!==undefined&&typeof value.settings.currency!=='string'||value.settings.vatRatePercent!==undefined&&(!Number.isFinite(value.settings.vatRatePercent)||value.settings.vatRatePercent<0||value.settings.vatRatePercent>100))governanceFail('INVALID_PROJECT_COMMAND',422);}
 return structuredClone(value);
}
export function validateGovernedProject(foundation:any,status:string){if(!ProjectValidator.validate({...foundation,projectId:'Q-PRJ-VALIDATION',status}).isValid)governanceFail('PROJECT_VALIDATION_FAILED',422);}
export function prepareGovernedProject(raw:any){
 governanceExact(raw,[...FOUNDATION_FIELDS,'projectId','projectCode','projectNumber','createdAt','createdBy','updatedAt','updatedBy','status','authorizedCarrierIds','authorizedMaterialIds']);
 if(raw.status!==undefined&&raw.status!=='SETUP')governanceFail('INVALID_PROJECT_INITIAL_STATE',422);
 for(const k of ['authorizedCarrierIds','authorizedMaterialIds'])if(raw[k]!==undefined&&(!Array.isArray(raw[k])||raw[k].length))governanceFail('INVALID_PROJECT_COMMAND',422);
 const settings=raw.settings||{};governanceExact(settings,[...FOUNDATION_SETTINGS,'requireTareOnExit','maxToleranceKg','allowDriverSelfDispatch','googleDriveProvisioning']);
 for(const [k,v] of Object.entries({requireTareOnExit:true,maxToleranceKg:500,allowDriverSelfDispatch:false}))if(settings[k]!==undefined&&settings[k]!==v)governanceFail('INVALID_PROJECT_COMMAND',422);
 if(settings.googleDriveProvisioning!==undefined){const g=settings.googleDriveProvisioning;governanceExact(g,['enabled','rootFolderName','spreadsheetTitle','status']);if(typeof g.enabled!=='boolean'||g.status!==undefined&&g.status!=='PENDING'||['rootFolderName','spreadsheetTitle'].some(k=>g[k]!==undefined&&typeof g[k]!=='string'))governanceFail('INVALID_PROJECT_COMMAND',422);}
 const f:any=Object.fromEntries(FOUNDATION_FIELDS.filter(k=>raw[k]!==undefined).map(k=>[k,raw[k]]));f.settings=Object.fromEntries(FOUNDATION_SETTINGS.filter(k=>settings[k]!==undefined).map(k=>[k,settings[k]]));governanceFoundation(f);
 if(typeof f.nameEn!=='string'||typeof f.clientName!=='string'||!f.location||typeof f.settings.zatcaTaxNumber!=='string'||typeof f.settings.vatRatePercent!=='number')governanceFail('INVALID_PROJECT_COMMAND',422);
 validateGovernedProject(f,'SETUP');return {...f,settings:{...f.settings,requireTareOnExit:true,maxToleranceKg:500,allowDriverSelfDispatch:false,...(settings.googleDriveProvisioning?{googleDriveProvisioning:settings.googleDriveProvisioning}:{})}};
}
