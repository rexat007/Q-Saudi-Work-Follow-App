import {classifyGoogleProviderFailure,GOOGLE_PROVIDER_REASONS,GOOGLE_PROVIDER_CODES} from '../../server/workspaceGoogleErrors';
/** Closed diagnostic vocabulary. Never copy provider messages, URLs or payloads. */
const failures = {
  APPLY_BLUEPRINT: 'BLUEPRINT_APPLY_FAILED',
  CREATE_BOUND_SCRIPT: 'SCRIPT_PROJECT_CREATION_FAILED',
  INSTALL_SCRIPT_CONTENT: 'SCRIPT_CONTENT_INSTALL_FAILED',
  VERIFY_WORKBOOK: 'WORKSPACE_STRUCTURE_INVALID',
  VERIFY_SCRIPT_CONTENT: 'SCRIPT_CONTENT_INSTALL_FAILED',
  PERSIST_BINDING: 'WORKSPACE_BINDING_PERSIST_FAILED',
} as const;
export type WorkspaceGenerationOperation = keyof typeof failures;
const reasons=GOOGLE_PROVIDER_REASONS;
const domainCodes = [
  ...Object.values(failures), 'WORKSPACE_BLUEPRINT_INVALID', 'WORKSPACE_EXTERNAL_BINDING_INVALID',
  'PROJECT_WORKSPACE_FILE_MISSING', 'WORKSPACE_EXECUTION_FENCED',
  'WORKSPACE_RECOVERY_REQUIRED', 'SCRIPT_FUNCTION_NOT_READY',
] as const;
const publicCodes = new Set<string>([...domainCodes, ...Object.values(reasons),...GOOGLE_PROVIDER_CODES,'PERMISSION_DENIED','RATE_LIMITED','QUOTA_EXCEEDED','RESOURCE_NOT_FOUND','INVALID_REQUEST','PRECONDITION_FAILED']);
const services = ['drive.googleapis.com', 'sheets.googleapis.com', 'script.googleapis.com'] as const;
export interface WorkspaceGenerationDiagnostic {
  operation: WorkspaceGenerationOperation;
  service: typeof services[number] | 'UNKNOWN';
  httpStatus: number | null;
  providerReason: keyof typeof reasons | 'UNRECOGNIZED' | 'NOT_PROVIDER_ERROR';
  category: string;
}

export function classifyWorkspaceGenerationFailure(error: unknown, operation: WorkspaceGenerationOperation, internalCode?: string) {
  const provider=classifyGoogleProviderFailure(error);
  const category=internalCode&&publicCodes.has(internalCode)?internalCode:!internalCode&&provider.recognized?provider.code:failures[operation];
  const diagnostic:WorkspaceGenerationDiagnostic={operation,service:internalCode?'UNKNOWN':provider.service,httpStatus:internalCode?null:provider.httpStatus,providerReason:internalCode?'NOT_PROVIDER_ERROR':provider.providerReason,category};
  return {code:!internalCode&&provider.recognized?provider.code:`${operation}:${category}`,diagnostic};
}

/** UI shows only a known operation and category, including in contextual messages. */
export function workspaceGenerationDiagnosticCode(message: string): string | null {
  const candidate = message.match(/\b[A-Z_]+:[A-Z_]+(?=\s|$)/g)?.find(code => {
    const [operation, category] = code.split(':');
    return Object.prototype.hasOwnProperty.call(failures, operation) && publicCodes.has(category);
  });
  return candidate || null;
}
