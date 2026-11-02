import type { WorkspaceEnsureStatus } from '../types/workspaceProvisioning';
export interface WorkspaceEnsureClient {
    prepareEnsureInteraction?(): () => void;
    ensureWorkspace(id: string): Promise<WorkspaceEnsureStatus>;
    observeWorkspaceProvisioning(id: string, signal?: AbortSignal): Promise<WorkspaceEnsureStatus>;
    connectBackgroundAuthorization(id: string, current: () => boolean, operationId?: string): Promise<void>;
    requestGoogleScopes(automation?: boolean): Promise<unknown>;
    selectProjectWorkspaceDestination(id: string): Promise<string>;
}
/** Client handles only server-declared human actions; it never chooses infrastructure phases. */
export async function runWorkspaceEnsureJourney(projectId: string, port: WorkspaceEnsureClient, current: () => boolean, progress: (s: WorkspaceEnsureStatus) => void, observeActive: (current: () => boolean) => Promise<void> = current => new Promise((resolve, reject) => { setTimeout(() => current() ? resolve() : reject(Error('WORKSPACE_IDENTITY_CHANGED')), 1500); })) {
    const check = () => { if (!current())
        throw Error('WORKSPACE_IDENTITY_CHANGED'); };
    let authorizationAttempts = 0, destinationAttempts = 0;
    let status: WorkspaceEnsureStatus;
    try {
        status = await port.ensureWorkspace(projectId);
    }
    catch (error) {
        check();
        status = await port.observeWorkspaceProvisioning(projectId);
        if (status.state !== 'PREPARING' && status.state !== 'READY')
            throw error;
    }
    for (let observations = 0; observations < 120; observations++) {
        check();
        progress(status);
        if (status.state === 'READY' || status.state === 'ATTENTION_REQUIRED' || status.state === 'NOT_CONFIGURED')
            return status;
        if (status.state === 'ACTION_REQUIRED') {
            if (['GOOGLE_AUTHORIZATION', 'GOOGLE_AUTOMATION_PERMISSION'].includes(status.actionRequired || '')) {
                if (authorizationAttempts++ || !status.operationId)
                    return status;
                await port.connectBackgroundAuthorization(projectId, current, status.operationId);
                check();
            }
            else if (status.actionRequired === 'DESTINATION') {
                if (destinationAttempts++)
                    return status;
                await port.requestGoogleScopes();
                check();
                await port.selectProjectWorkspaceDestination(projectId);
                check();
            }
            else
                return status;
            status = await port.ensureWorkspace(projectId);
            continue;
        }
        if (status.canResume) {
            status = await port.ensureWorkspace(projectId);
            continue;
        }
        await observeActive(current);
        check();
        status = await port.observeWorkspaceProvisioning(projectId);
    }
    throw Error('WORKSPACE_ENSURE_FAILED');
}
