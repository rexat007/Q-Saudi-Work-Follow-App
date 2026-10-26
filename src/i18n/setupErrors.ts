/** Closed presentation mapping. Unknown server/Firestore text never reaches Setup UI. */
export function setupErrorKey(error: { code?: string } | null | undefined): string {
  const code = error?.code || '';
  if (['UNAUTHENTICATED', 'FORBIDDEN_GLOBAL_COMMAND', 'FORBIDDEN_PROJECT_ACCESS', 'ACCOUNT_NOT_ACTIVE', 'INVALID_ACCOUNT_PROFILE'].includes(code)) return 'setup.errors.denied';
  if (code === 'GLOBAL_ENTITY_INELIGIBLE') return 'setup.errors.ineligible';
  if (code === 'MEMBERSHIP_STATE_CONFLICT') return 'setup.errors.membership';
  if (code === 'P5_B3_RELATIONSHIP_DEPENDENCY') return 'setup.errors.dependency';
  if (code === 'CARRIER_MISMATCH' || code.endsWith('_CARRIER_AFFILIATION_CONFLICT')) return 'setup.errors.carrier';
  if (['ASSIGNMENT_STATE_CONFLICT', 'ALLOCATION_STATE_CONFLICT', 'AFFILIATION_STATE_CONFLICT'].includes(code)) return 'setup.errors.conflict';
  if (['ASSIGNMENT_POINTER_INTEGRITY_ERROR', 'ALLOCATION_POINTER_CORRUPTION', 'PERSISTENCE_BOUNDARY_INVALID', 'IDENTITY_LOOKUP_INTEGRITY_ERROR'].includes(code)) return 'setup.errors.integrity';
  return 'setup.errors.failed';
}
