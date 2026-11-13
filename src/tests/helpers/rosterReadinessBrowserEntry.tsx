import React from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from '../../i18n';
import {RosterCarrierResolutionLayer} from '../../components/import/RosterCarrierResolutionLayer';
import {RosterMaterialResolutionLayer} from '../../components/import/RosterMaterialResolutionLayer';
const root=createRoot(document.getElementById('root')!);
const w=window as any;w.advances=0;let revision=0;
w.renderGate=(kind:'carrier'|'material',patch:Record<string,unknown>={})=>{
  const resolution=(entityType:string)=>({entityType,originalValue:'',matchedId:entityType,confidence:1,isExact:true,isAuthorized:true,recommendation:'ACCEPT',matchMethod:'EXACT',riskLevel:'LOW',relationshipStatus:'VALID'});
  const batch:any={projectId:'P1',importBatchId:'B1',source:{sourceType:'CSV'},metadata:{},issues:[],auditTrail:[],rows:[{rowNumber:1,status:'VALID',raw:{},canonical:{carrierId:'CARRIER',materialId:'MATERIAL'},entityResolutions:{carrier:resolution('CARRIER'),material:resolution('MATERIAL')},validationIssues:[]}]};
  Object.assign(batch.rows[0].entityResolutions[kind],patch);
  const context:any={projectId:'P1',authorizedCarrierIds:[],authorizedMaterialIds:[],knownCarriers:[],knownMaterials:[],knownTrucks:[],knownDrivers:[],importResolution:{projectId:'P1',entities:[]}};
  const props={importBatch:batch,canonicalContext:context,onAcceptCandidate:()=>{},onClose:()=>{}};
  const next=()=>{w.advances++;};const id=++revision;
  root.render(<I18nProvider initialLocale="en"><div data-revision={id}>{kind==='carrier'
    ?<RosterCarrierResolutionLayer {...props} onCreateCarrier={()=>{}} onContinueToMaterials={next}/>
    :<RosterMaterialResolutionLayer {...props} onCreateMaterial={()=>{}} onContinueToDriverTruck={next}/>}</div></I18nProvider>);
  return id;
};
