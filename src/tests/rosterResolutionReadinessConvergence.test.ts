import {describe, expect, it} from 'vitest';
import {canonicalCarrierRowsReady, RosterBatchReviewService} from '../services/import/rosterBatchReview.service';
import {materialRowsReady} from '../services/import/rosterMaterialBinding';
import {reconcileRosterResumeStage} from '../services/import/rosterResumeJourney';
import {checkCarrierResolutionReadiness} from '../components/import/RosterCarrierResolutionLayer';
import {checkMaterialResolutionReadiness} from '../components/import/RosterMaterialResolutionLayer';
import type {ImportEntityResolutionInfo, UnifiedImportBatch} from '../types/unifiedImport';

function fixture(): UnifiedImportBatch {
  const resolution = (entityType: 'CARRIER' | 'MATERIAL'): ImportEntityResolutionInfo => ({
    entityType, originalValue: '', matchedId: entityType, confidence: 1,
    isExact: true, isAuthorized: true, recommendation: 'ACCEPT', matchMethod: 'EXACT',
    riskLevel: 'LOW', relationshipStatus: 'VALID',
  });
  return {rows: [{rowNumber: 1, status: 'VALID', raw: {}, canonical: {carrierId: 'CARRIER', materialId: 'MATERIAL'},
    entityResolutions: {carrier: resolution('CARRIER'), material: resolution('MATERIAL')}, validationIssues: []}],
    issues: [], metadata: {}, auditTrail: []} as unknown as UnifiedImportBatch;
}

const unsafe: [string, Partial<ImportEntityResolutionInfo>][] = [
  ['review', {recommendation: 'REVIEW'}], ['reject', {recommendation: 'REJECT'}],
  ['unknown', {recommendation: 'UNKNOWN'}], ['missing acceptance', {recommendation: undefined}],
  ['unauthorized', {isAuthorized: false}], ['unresolved', {resolutionReason: 'UNRESOLVED'}],
  ['ambiguous', {ambiguous: true}], ['fuzzy', {matchMethod: 'FUZZY'}],
  ['missing match evidence', {matchMethod: undefined}], ['high risk', {riskLevel: 'HIGH'}],
  ['critical', {riskLevel: 'CRITICAL'}], ['cross project', {relationshipStatus: 'CROSS_PROJECT_BLOCKED'}],
  ['missing identity', {matchedId: undefined}],
  ['contradictory kind', {entityType: 'TRUCK'}],
  ['foreign prepared plan', {creationDisposition: 'PREPARED_NEW', preparedDriverPlan: {} as never}],
];
describe.each(['carrier', 'material'] as const)('%s row evidence', kind => {
  const ready = kind === 'carrier' ? canonicalCarrierRowsReady : materialRowsReady;
  const legacyReady = kind === 'carrier' ? checkCarrierResolutionReadiness : checkMaterialResolutionReadiness;
  it.each(unsafe)('blocks %s in live and resumed presentation without changing facts', (_label, patch) => {
    const b = fixture(); Object.assign(b.rows[0].entityResolutions![kind], patch);
    const before = structuredClone(b);
    expect(ready(b)).toBe(false);
    expect(legacyReady(b)).toBe(false);
    expect(reconcileRosterResumeStage('FINAL_REVIEW', b)).toBe(kind === 'carrier' ? 'CARRIER_RESOLUTION' : 'MATERIAL_RESOLUTION');
    expect(b).toEqual(before);
  });
  it('cannot let a good group hide a second unsafe row', () => {
    const b = fixture(); const second = structuredClone(b.rows[0]); second.rowNumber = 2;
    second.entityResolutions![kind].recommendation = 'REVIEW'; b.rows.push(second);
    expect(ready(b)).toBe(false);
  });
  it('accepts valid selections and excludes explicitly rejected rows', () => {
    const b = fixture(); const rejected = structuredClone(b.rows[0]); rejected.rowNumber = 2;
    rejected.status = 'REJECTED'; rejected.entityResolutions![kind].recommendation = 'REJECT'; b.rows.push(rejected);
    expect(ready(b)).toBe(true); expect(legacyReady(b)).toBe(true);
    b.rows[0].status = 'REJECTED'; expect(ready(b)).toBe(false);
  });
  it('retains accepted historical resolutions with no redundant entity kind', () => {
    const b = fixture(); delete (b.rows[0].entityResolutions![kind] as Partial<ImportEntityResolutionInfo>).entityType;
    expect(ready(b)).toBe(true); expect(legacyReady(b)).toBe(true);
  });
});
it('reproduces the missing Carrier group for an ID-only unresolved candidate', () => {
  const b = fixture(); b.rows[0].entityResolutions!.carrier.recommendation = 'REVIEW';
  expect(RosterBatchReviewService.getBatchReviewGroups(b).carrier).toEqual([]);
  expect(canonicalCarrierRowsReady(b)).toBe(false);
});
