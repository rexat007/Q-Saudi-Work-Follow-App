import type {reviewedTripCommandFixture} from './helpers/reviewedTripCommandFixture';
import {beforeAll,it,expect,vi} from 'vitest';
// Native discovery needs a test principal, not a partial User assigned into a live Auth SDK.
vi.mock('../firebase/config',()=>({db:{},auth:{currentUser:{uid:'sheets-discovery-reviewer',getIdToken:async()=> 'synthetic-authenticated-discovery'}}}));
export type {GoogleSheetsTestReport,TestCaseResult} from './googleSheetsImport.cases';
import type {runGoogleSheetsImportTests as RunCases} from './googleSheetsImport.cases';
// Load the case module only after native mocks are registered; production imports
// the unchanged .cases module directly and never imports this native wrapper.
export async function runGoogleSheetsImportTests(...args:Parameters<typeof RunCases>){const cases=await import('./googleSheetsImport.cases');return cases.runGoogleSheetsImportTests(...args);}

let registeredResult: Awaited<ReturnType<typeof runGoogleSheetsImportTests>>;
beforeAll(async()=>{const {reviewedTripCommandFixture}=await import('./helpers/reviewedTripCommandFixture');registeredResult=await runGoogleSheetsImportTests(reviewedTripCommandFixture);},60000);
it.each(["TC-GSHT-01", "TC-GSHT-02", "TC-GSHT-03", "TC-GSHT-04", "TC-GSHT-05", "TC-GSHT-06", "TC-GSHT-07", "TC-GSHT-08", "TC-GSHT-09", "TC-GSHT-10", "TC-GSHT-11", "TC-GSHT-12", "TC-GSHT-13", "TC-GSHT-14"])('%s',id=>{const result=registeredResult.results.find(row=>row.id===id);expect(result,'Missing legacy assertion '+id).toBeDefined();expect(result?.passed,JSON.stringify(result)).toBe(true);});
