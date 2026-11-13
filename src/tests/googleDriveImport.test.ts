import {reviewedTripCommandFixture} from './helpers/reviewedTripCommandFixture';
import {beforeAll,it,expect} from 'vitest';
export * from './googleDriveImport.cases';
import {runGoogleDriveImportTests} from './googleDriveImport.cases';

let registeredResult: Awaited<ReturnType<typeof runGoogleDriveImportTests>>;
beforeAll(async()=>{registeredResult=await runGoogleDriveImportTests(reviewedTripCommandFixture);},60000);
it.each(["TC-GDRV-01", "TC-GDRV-02", "TC-GDRV-03", "TC-GDRV-04", "TC-GDRV-05", "TC-GDRV-06", "TC-GDRV-07", "TC-GDRV-08", "TC-GDRV-09", "TC-GDRV-10", "TC-GDRV-11"])('%s',id=>{const result=registeredResult.results.find(row=>row.id===id);expect(result,'Missing legacy assertion '+id).toBeDefined();expect(result?.passed,JSON.stringify(result)).toBe(true);});
