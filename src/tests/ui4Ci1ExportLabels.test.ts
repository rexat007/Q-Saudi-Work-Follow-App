import {expect,it} from 'vitest';
import {completeReportExportColumns} from '../components/reports/operationalReportPresentation';
import {reportsEngineService} from '../services/reportsEngine.service';
import {resolveTranslation} from '../i18n/utils';
import {dictionaries} from '../locales';

const keys=['sourceType','pricingSnapshotAt','destinationWeightSource','settlementStatus'] as const;
const labels=['ui4.sourceType','ui4.pricingSnapshotAt','ui4.destinationWeightSource','ui4.settlementStatus'] as const;
const aliases=['sourceTypeLabelAr','snapshotDate','destinationWeightSourceLabelAr','pricingStatusLabelAr'];
for(const locale of ['ar','en','ur'] as const)it(`CI1 ${locale}: four real audit translations, stable order, aliases and immutable source values`,()=>{
 const t=(key:string)=>resolveTranslation(key,locale);
 const dataset=reportsEngineService.generateReport('DAILY_OPERATIONS',{projectId:'P1'},[]);
 dataset.columns=[{key:'tripId',labelAr:'Trip',labelEn:'Trip'}];
 dataset.rows=[{tripId:'T1',sourceTypeLabelAr:'MANUAL',snapshotDate:'2026-11-15',destinationWeightSourceLabelAr:'وزن\r\nالمقصد',pricingStatusLabelAr:'Finalized',untouched:'أ, "ب"'},
  {tripId:'T2',sourceType:'',pricingSnapshotAt:0,destinationWeightSource:false,settlementStatus:'Pending'},
  {tripId:'T3',sourceType:null,pricingSnapshotAt:null,destinationWeightSource:null,settlementStatus:null}];
 const before=JSON.stringify(dataset),result=completeReportExportColumns(dataset,t);
 expect(JSON.stringify(dataset)).toBe(before);expect(result.summary).toBe(dataset.summary);
 expect(result.columns.map(c=>c.key)).toEqual(['tripId',...keys]);expect(result.columns[0]).toEqual(dataset.columns[0]);
 for(const [i,key] of labels.entries()) {
  const expected=dictionaries[locale][key];expect(expected?.trim()).toBeTruthy();expect(expected).not.toBe(key);
  expect(result.columns[i+1].labelAr).toBe(expected);expect(result.columns[i+1].labelEn).toBe(expected);
 }
 expect(dictionaries[locale]).not.toHaveProperty('ui4.');
 expect(result.rows.map(row=>keys.map(key=>row[key]))).toEqual([
  ['MANUAL','2026-11-15','وزن\r\nالمقصد','Finalized'],['',0,false,'Pending'],['—','—','—','—']]);
 expect(result.rows.map(row=>row.tripId)).toEqual(['T1','T2','T3']);expect(result.rows[0].untouched).toBe(dataset.rows[0].untouched);
 dataset.columns.push(...aliases.map(key=>({key,labelAr:key,labelEn:key})));
 const aliasedBefore=JSON.stringify(dataset),aliased=completeReportExportColumns(dataset,t);
 expect(aliased.columns).toEqual(dataset.columns);expect(aliased.rows).toEqual(dataset.rows);expect(JSON.stringify(dataset)).toBe(aliasedBefore);
});
