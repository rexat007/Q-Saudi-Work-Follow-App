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
const reasons = {
  ACCESS_TOKEN_SCOPE_INSUFFICIENT: 'SCOPE_DENIED',
  insufficientPermissions: 'SCOPE_DENIED',
  insufficient_scope: 'SCOPE_DENIED',
  SERVICE_DISABLED: 'API_ACCESS_DISABLED',
  accessNotConfigured: 'API_ACCESS_DISABLED',
  API_DISABLED: 'API_ACCESS_DISABLED',
  API_ACCESS_DISABLED: 'API_ACCESS_DISABLED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  forbidden: 'PERMISSION_DENIED',
  rateLimitExceeded: 'RATE_LIMITED',
  userRateLimitExceeded: 'RATE_LIMITED',
  RESOURCE_EXHAUSTED: 'RATE_LIMITED',
  quotaExceeded: 'QUOTA_EXCEEDED',
  dailyLimitExceeded: 'QUOTA_EXCEEDED',
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  notFound: 'RESOURCE_NOT_FOUND',
  INVALID_ARGUMENT: 'INVALID_REQUEST',
  badRequest: 'INVALID_REQUEST',
  FAILED_PRECONDITION: 'PRECONDITION_FAILED',
  UNAUTHENTICATED: 'TOKEN_EXPIRED',
  authError: 'TOKEN_EXPIRED',
} as const;
const domainCodes = [
  ...Object.values(failures), 'WORKSPACE_BLUEPRINT_INVALID', 'WORKSPACE_EXTERNAL_BINDING_INVALID',
  'PROJECT_WORKSPACE_FILE_MISSING', 'WORKSPACE_EXECUTION_FENCED',
  'WORKSPACE_RECOVERY_REQUIRED', 'SCRIPT_FUNCTION_NOT_READY',
] as const;
const publicCodes = new Set<string>([...domainCodes, ...Object.values(reasons)]);
const services = ['drive.googleapis.com', 'sheets.googleapis.com', 'script.googleapis.com'] as const;
export interface WorkspaceGenerationDiagnostic {
  operation: WorkspaceGenerationOperation;
  service: typeof services[number] | 'UNKNOWN';
  httpStatus: number | null;
  providerReason: keyof typeof reasons | 'UNRECOGNIZED' | 'NOT_PROVIDER_ERROR';
  category: string;
}
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};

export function classifyWorkspaceGenerationFailure(error: unknown, operation: WorkspaceGenerationOperation, internalCode?: string) {
  const e = record(error), response = record(e.response), provider = record(record(response.data).error);
  const status = [response.status, e.status, e.code, provider.code].find(value => typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599);
  const details = Array.isArray(provider.details) ? provider.details.slice(0, 8).map(record) : [];
  const errors = Array.isArray(provider.errors) ? provider.errors.slice(0, 8).map(record) : [];
  const evidence = [...details.map(item => item.reason), ...errors.map(item => item.reason), provider.status];
  // Priority matters: SERVICE_DISABLED must beat the generic PERMISSION_DENIED status.
  const reason = Object.keys(reasons).find(key => evidence.includes(key)) as keyof typeof reasons | undefined;
  let service: WorkspaceGenerationDiagnostic['service'] = 'UNKNOWN';
  const reportedService = details.map(item => record(item.metadata).service).find(value => services.some(service => service === value));
  if (reportedService) service = reportedService as typeof services[number];
  else {
    const url = record(e.config).url;
    try {
      if (typeof url === 'string' || url instanceof URL) {
        const parsed = new URL(url);
        if (services.some(service => service === parsed.hostname)) service = parsed.hostname as typeof services[number];
        else if (parsed.hostname === 'www.googleapis.com' && parsed.pathname.startsWith('/drive/')) service = 'drive.googleapis.com';
      }
    } catch { /* Never emit the untrusted URL. */ }
  }
  const category = internalCode && publicCodes.has(internalCode) ? internalCode
    : status === 401 ? 'TOKEN_EXPIRED' : reason ? reasons[reason] : failures[operation];
  const diagnostic: WorkspaceGenerationDiagnostic = {
    operation, service: internalCode ? 'UNKNOWN' : service,
    httpStatus: internalCode ? null : typeof status === 'number' ? status : null,
    providerReason: internalCode ? 'NOT_PROVIDER_ERROR' : reason || 'UNRECOGNIZED', category,
  };
  return {code: `${operation}:${category}`, diagnostic};
}

/** UI shows only a known operation and category, including in contextual messages. */
export function workspaceGenerationDiagnosticCode(message: string): string | null {
  const candidate = message.match(/\b[A-Z_]+:[A-Z_]+(?=\s|$)/g)?.find(code => {
    const [operation, category] = code.split(':');
    return Object.prototype.hasOwnProperty.call(failures, operation) && publicCodes.has(category);
  });
  return candidate || null;
}
