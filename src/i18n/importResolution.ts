export function resolutionErrorKey(error: unknown): string {
  const code=typeof error==='object'&&error ? String((error as any).code || (error as any).message || '') : String(error||'');
  if(code.includes('MUTATION_REFRESH_PENDING'))return 'import.resolution.refresh';
  if(code.includes('INVALID_NATURAL_KEY'))return 'import.resolution.identity';
  if(code.includes('STALE'))return 'import.resolution.stale';
  if(code.includes('FORBIDDEN')||code.includes('401')||code.includes('403')||code.includes('UNAUTHENTICATED'))return 'import.resolution.access';
  if(code.includes('AMBIGUITY'))return 'import.resolution.ambiguous';
  if(code.includes('INELIGIBLE'))return 'import.resolution.ineligible';
  if(code.includes('MEMBERSHIP_MISSING'))return 'import.resolution.missing';
  if(code.includes('MEMBERSHIP_STATE'))return 'import.resolution.membership';
  if(code.includes('AFFILIATION'))return 'import.resolution.affiliationConflict';
  if(code.includes('INTEGRITY')||code.includes('DUPLICATE_NATURAL'))return 'import.resolution.integrity';
  return 'import.resolution.context';
}
