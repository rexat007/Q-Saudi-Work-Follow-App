import {describe,it,expect,vi} from 'vitest';
import {REQUIRED_WORKSPACE_SCOPES,missingWorkspaceScopes,workspaceScopeDeniedCode,workspaceScopeDiagnosticCode} from '../utils/googleWorkspaceScopes';

describe('bounded Workspace scope diagnostics',()=>{
 it('retains exactly the three required canonical permission URIs',()=>{
  expect(REQUIRED_WORKSPACE_SCOPES).toEqual(['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/script.projects']);
  expect(missingWorkspaceScopes(REQUIRED_WORKSPACE_SCOPES)).toEqual([]);
 });
 it.each([undefined,null,[],{},''])('fails closed for absent/malformed granted scope data: %j',granted=>{
  expect(missingWorkspaceScopes(granted)).toEqual([...REQUIRED_WORKSPACE_SCOPES]);
 });
 it('accepts duplicates, order and whitespace without changing URI identities',()=>{
  expect(missingWorkspaceScopes(` ${[...REQUIRED_WORKSPACE_SCOPES].reverse().join('\n\t')} ${REQUIRED_WORKSPACE_SCOPES[0]} `)).toEqual([]);
 });
 it('does not treat display aliases, lookalike URIs or read-only grants as equivalents',()=>{
  expect(missingWorkspaceScopes(['spreadsheets','drive.file','script.projects',...REQUIRED_WORKSPACE_SCOPES.map(scope=>`${scope}.readonly`),...REQUIRED_WORKSPACE_SCOPES.map(scope=>scope.replace('https:','http:'))])).toEqual([...REQUIRED_WORKSPACE_SCOPES]);
 });
 it('emits only allowlisted aliases regardless of extra provider/token/PII fields',()=>{
  const log=vi.spyOn(console,'log');const warn=vi.spyOn(console,'warn');const error=vi.spyOn(console,'error');
  try {
   const provider={scope:REQUIRED_WORKSPACE_SCOPES[0],access_token:'sensitive-access',id_token:'sensitive-id',code:'sensitive-code',client_secret:'sensitive-secret',api_key:'sensitive-key',email:'sensitive-person'};
   const code=workspaceScopeDeniedCode(missingWorkspaceScopes(provider.scope));
   expect(code).toBe('SCOPE_DENIED:drive.file,script.projects');expect(code).not.toMatch(/sensitive-|https:/);
   expect(log).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();expect(error).not.toHaveBeenCalled();
  } finally {log.mockRestore();warn.mockRestore();error.mockRestore();}
 });
 it('never displays injected provider material as diagnostic scope aliases',()=>{
  expect(workspaceScopeDiagnosticCode('SCOPE_DENIED:script.projects,sensitive-access')).toBe('SCOPE_DENIED');
  expect(workspaceScopeDiagnosticCode('SCOPE_DENIED:https://www.googleapis.com/auth/script.projects')).toBe('SCOPE_DENIED');
  expect(workspaceScopeDiagnosticCode('SCOPE_DENIED:script.projects,drive.file,script.projects')).toBe('SCOPE_DENIED:drive.file,script.projects');
  expect(workspaceScopeDiagnosticCode('Context: SCOPE_DENIED:script.projects')).toBe('SCOPE_DENIED:script.projects');
  expect(workspaceScopeDiagnosticCode('SCOPE_DENIED')).toBe('SCOPE_DENIED');expect(workspaceScopeDiagnosticCode('NETWORK_ERROR')).toBeNull();
 });
});
