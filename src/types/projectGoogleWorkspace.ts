/** Public DTO: no credentials, raw Google errors or token material. */
export type ContinuityState = 'NOT_CONNECTED' | 'CONNECTED' | 'PROVISIONING' | 'READY' | 'SYNC_DEGRADED' | 'AUTHORIZATION_REQUIRED' | 'FAILED' | 'BOUND_FILE_UNAVAILABLE';
export type WorkspaceBindingState = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNC_DEGRADED' | 'AUTHORIZATION_REQUIRED' | 'BOUND_FILE_UNAVAILABLE';
export type SheetAutomationState = 'NOT_REQUIRED' | 'NOT_INSTALLED' | 'INSTALLING' | 'READY' | 'DEGRADED';
export type WorkspaceSyncHealth = 'HEALTHY'|'PENDING'|'DEGRADED'|'AUTHORIZATION_REQUIRED';
export type WorkbookHealth = 'HEALTHY'|'REPAIR_REQUIRED'|'REPAIRING'|'DEGRADED';
export interface ProjectGoogleBinding {
  projectId: string;
  provider: 'GOOGLE';
  spreadsheetId: string;
  driveFileId: string;
  spreadsheetUrl: string;
  spreadsheetTitle?: string;
  /** Legacy compatibility only; new bindings use versioned blueprint identities. */
  templateId?: string;
  destinationRootFolderId?: string;
  projectFolderId?: string;
  workspaceBlueprintVersion?: string;
  appsScriptBlueprintVersion?: string;
  scriptProjectId?: string;
  templateVersion?: string;
  googleSubject: string;
  googleAccountLabel: string;
  provisionedAt: string;
  provisionedBy: string;
  revision: number;
}
export interface ProjectGoogleStatus {
  state: ContinuityState;
  binding: ProjectGoogleBinding | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncError: string | null;
  pendingSyncCount: number;
  workspaceState?: WorkspaceBindingState;
  automationState?: SheetAutomationState;
  recoveryAvailable?: boolean;
  syncHealth?: WorkspaceSyncHealth;
  workbookHealth?: WorkbookHealth;
  backgroundAuthorization?: 'CONNECTED'|'AUTHORIZATION_REQUIRED'|'NOT_CONNECTED';
}
