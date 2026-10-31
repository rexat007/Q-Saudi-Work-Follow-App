/** Required Workspace permissions only. Identity scopes are checked separately. */
export const REQUIRED_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/script.projects',
] as const;

const aliases = ['spreadsheets', 'drive.file', 'script.projects'] as const;
export const BINDING_WORKSPACE_SCOPES = REQUIRED_WORKSPACE_SCOPES.slice(0,2);
export const missingWorkspaceBindingScopes = (granted: unknown): string[] => missingWorkspaceScopes(granted).filter(scope=>BINDING_WORKSPACE_SCOPES.includes(scope as typeof BINDING_WORKSPACE_SCOPES[number]));

export function missingWorkspaceScopes(granted: unknown): string[] {
  // GIS returns a space-delimited string; google-auth-library returns an array.
  // Normalize formatting only. Broader/read-only scopes and lookalike URIs are
  // not equivalent grants for this contract; never infer an undocumented alias.
  const parts = typeof granted === 'string' ? [granted] : Array.isArray(granted) ? granted : [];
  const scopes = new Set(parts.flatMap(value => typeof value === 'string' ? value.trim().split(/\s+/) : []));
  return REQUIRED_WORKSPACE_SCOPES.filter(scope => !scopes.has(scope));
}

/** Diagnostic output is constructed exclusively from the three allowed names. */
export function workspaceScopeDeniedCode(missingScopes: readonly string[]): string {
  const missing = REQUIRED_WORKSPACE_SCOPES.flatMap((scope, index) => missingScopes.includes(scope) ? [aliases[index]] : []);
  return missing.length ? `SCOPE_DENIED:${missing.join(',')}` : 'SCOPE_DENIED';
}

/** Preserve bounded diagnostics through client classification and UI support codes.
 * Never display raw provider strings, arbitrary scope names, URLs or token data. */
export function workspaceScopeDiagnosticCode(message: string): string | null {
  const diagnostic = message.match(/\bSCOPE_DENIED(?::[^\s]*)?(?=\s|$)/)?.[0];
  if (!diagnostic) return null;
  if (diagnostic === 'SCOPE_DENIED') return diagnostic;
  const names = diagnostic.slice('SCOPE_DENIED:'.length).split(',');
  if (!names.length || names.some(name => !aliases.some(alias => alias === name))) return 'SCOPE_DENIED';
  return workspaceScopeDeniedCode(REQUIRED_WORKSPACE_SCOPES.filter((_, index) => names.includes(aliases[index])));
}
