import {beforeAll,it,expect} from 'vitest';
export * from './googleSheetsImport.cases';
import {runGoogleSheetsImportTests} from './googleSheetsImport.cases';

let registeredResult: Awaited<ReturnType<typeof runGoogleSheetsImportTests>>;
beforeAll(async()=>{registeredResult=await runGoogleSheetsImportTests();},60000);
it.each(["TC-GSHT-01", "TC-GSHT-02", "TC-GSHT-03", "TC-GSHT-04", "TC-GSHT-05", "TC-GSHT-06", "TC-GSHT-07", "TC-GSHT-08", "TC-GSHT-09", "TC-GSHT-10", "TC-GSHT-11", "TC-GSHT-12", "TC-GSHT-13", "TC-GSHT-14"])('%s',id=>{const result=registeredResult.results.find(row=>row.id===id);expect(result,'Missing legacy assertion '+id).toBeDefined();expect(result?.passed,JSON.stringify(result)).toBe(true);});
