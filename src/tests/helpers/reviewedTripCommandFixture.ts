import {vi} from 'vitest';
import {commandDatabase} from './commandDatabase';
import {operationalDocuments} from './convergence2Firestore';
import {TripCommandsServerService} from '../../services/tripCommands.server';
import {TRIP_COMMANDS} from '../../types/tripCommands';
import {importedTripClientService} from '../../services/import/importedTripClient.service';
import {pricingRuleRepository} from '../../repositories/pricingRule.repository';
import {ExcelCsvPipelineService} from '../../services/import/excelCsvPipeline.service';
import type {PipelineContext,UnifiedImportBatch} from '../../types/unifiedImport';
/** Test-only authenticated command bridge. Executes real canonical validation,
 * persistence, snapshots and receipts over the existing staged transaction model.
 * No production adapter or Google/storage authority is installed. */
export function reviewedTripCommandFixture(context:PipelineContext){
 const x=commandDatabase(operationalDocuments(context.projectId,context.userId));
 const actor={userId:context.userId,role:'PROJECT_ADMIN' as const,assignedProjectIds:[context.projectId],email:'fixture@example.invalid',displayName:'Synthetic reviewer'};
 const server=new TripCommandsServerService(x.db);
 const originals:{projectId:string;envelope:{command:'IMPORT_TRIP';payload:Record<string,unknown>;operationId:string}}[]=[];
 const command=vi.spyOn(importedTripClientService,'dispatchImportedTrip').mockImplementation(async(projectId,params)=>{
  const payload=Object.fromEntries(TRIP_COMMANDS.IMPORT_TRIP.fields.filter(key=>params[key as keyof typeof params]!==undefined).map(key=>[key,params[key as keyof typeof params]]));
  const envelope={command:'IMPORT_TRIP' as const,payload,operationId:params.clientUUID};originals.push(structuredClone({projectId,envelope}));
  return server.execute(projectId,envelope,actor);
 });
 const pricing=vi.spyOn(pricingRuleRepository,'listByProject').mockResolvedValue([]);
 const current:PipelineContext={...context,knownEntities:{carriers:[{carrierId:'CAR',name:'ناقل محفوظ'}],trucks:[{truckId:'TRK',plate:'ABC123',carrierId:'CAR'}],drivers:[{driverId:'DRV',name:'سائق محفوظ',carrierId:'CAR'}],materials:[{materialId:'MAT',name:'مادة محفوظة'}]}};
 return {...x,context:current,command,replay:()=>Promise.all(originals.map(request=>server.execute(request.projectId,structuredClone(request.envelope),actor))),trips:()=>Object.entries(x.store).filter(([key])=>key.startsWith(`projects/${context.projectId}/trips/`)).map(([,trip])=>trip),review:(input:UnifiedImportBatch)=>{
  let batch=input;
  // Explicit human selections exercise the actual decision and warning gates;
  // source bytes, row values and parser errors are never replaced or cleared.
  for(const row of input.rows)for(const [kind,id]of [['carrier','CAR'],['truck','TRK'],['driver','DRV'],['material','MAT']] as const)
   {const target=batch.rows.find(r=>r.rowNumber===row.rowNumber)!;target.entityResolutions??={};target.entityResolutions[kind]??={entityType:kind.toUpperCase() as 'CARRIER'|'TRUCK'|'DRIVER'|'MATERIAL',originalValue:'',confidence:0,isExact:false,recommendation:'REVIEW'};
   batch=ExcelCsvPipelineService.applyEntityResolutionDecision(batch,row.rowNumber,kind,'SELECT_ALTERNATE',{selectedEntityId:id},current,context.userId);}
  for(const row of batch.rows)batch=ExcelCsvPipelineService.applyRowReview(batch,row.rowNumber,'ACCEPT_WARNING',current,'Synthetic explicit review');
  return batch;
 },close:()=>{command.mockRestore();pricing.mockRestore();}};
}
