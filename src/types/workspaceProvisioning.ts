export const WORKSPACE_PHASES = ['PREFLIGHT', 'AUTHORIZATION', 'DESTINATION', 'FOLDER', 'SPREADSHEET', 'BINDING', 'WORKBOOK', 'MASTER_DATA', 'SCRIPT', 'SCRIPT_VERIFY', 'FINAL_SYNC', 'FINAL_VERIFY', 'READY'] as const;
export type WorkspacePhase = typeof WORKSPACE_PHASES[number];
export type WorkspaceProductState = 'NOT_CONFIGURED' | 'PREPARING' | 'ACTION_REQUIRED' | 'READY' | 'ATTENTION_REQUIRED';
export type WorkspaceRequiredAction = 'GOOGLE_AUTHORIZATION' | 'GOOGLE_AUTOMATION_PERMISSION' | 'DESTINATION' | null;
/** Public closed DTO. Resource/credential/provider details belong to privileged diagnostics. */
export interface WorkspaceEnsureStatus {
    state: WorkspaceProductState;
    operationId: string | null;
    phase: WorkspacePhase;
    completed: WorkspacePhase[];
    actionRequired: WorkspaceRequiredAction;
    retryable: boolean;
    canResume: boolean;
    diagnostic?: string;
}
export interface WorkspaceProvisioningOperation {
    operationId: string;
    projectId: string;
    actorId: string;
    configurationHash: string;
    managedRootKey?: string;
    bindingRevision: number;
    spreadsheetId: string | null;
    profile: string;
    profileVersion: string;
    phase: WorkspacePhase;
    completed: WorkspacePhase[];
    status: WorkspaceProductState;
    actionRequired: WorkspaceRequiredAction;
    revision: number;
    attempt: number;
    createdAt: number;
    updatedAt: number;
    lastProgressAt: number;
    leaseOwner: string | null;
    leaseExpiresAt: number;
    lastBoundedError: string | null;
    retryable: boolean;
    timeline: Array<{
        phase: WorkspacePhase;
        at: number;
        event: string;
    }>;
}
