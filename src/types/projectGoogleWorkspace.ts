/** Public DTO: no credentials, raw Google errors or token material. */
export type ContinuityState = 'NOT_CONNECTED' | 'CONNECTED' | 'PROVISIONING' | 'READY' | 'SYNC_DEGRADED' | 'AUTHORIZATION_REQUIRED' | 'FAILED';
export interface ProjectGoogleBinding {
  projectId: string;
  provider: 'GOOGLE';
  spreadsheetId: string;
  driveFileId: string;
  spreadsheetUrl: string;
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
}
