import type { WorkspaceEnsureStatus } from '../types/workspaceProvisioning';
export interface WorkspaceEnsureClient {
    prepareEnsureInteraction?(): () => void;
    ensureWorkspace(id: string,current?:()=>boolean): Promise<WorkspaceEnsureStatus>;
    observeWorkspaceProvisioning(id: string, signal?: AbortSignal): Promise<WorkspaceEnsureStatus>;
    connectBackgroundAuthorization(id: string, current: () => boolean, operationId?: string): Promise<void>;

}
/** Client handles only server-declared human actions; it never chooses infrastructure phases. */
export async function runWorkspaceEnsureJourney(projectId: string, port: WorkspaceEnsureClient, current: () => boolean, progress: (s: WorkspaceEnsureStatus) => void, observeActive: (current: () => boolean) => Promise<void> = current => new Promise((resolve, reject) => { setTimeout(() => current() ? resolve() : reject(Error('WORKSPACE_IDENTITY_CHANGED')), 1500); })) {
    const check = () => { if (!current())
        throw Error('WORKSPACE_IDENTITY_CHANGED'); };
    let authorizationAttempts = 0;
    const submit=async()=>{try{return await port.ensureWorkspace(projectId,current);}catch(error){
      check();if(error instanceof Error&&error.message==='APP_UPDATE_REQUIRED')throw error;
      const canonical=await port.observeWorkspaceProvisioning(projectId);check();
      if(['PREPARING','READY','ACTION_REQUIRED','ATTENTION_REQUIRED'].includes(canonical.state))return canonical;
      throw error;
    }};
    let status:WorkspaceEnsureStatus=await submit();
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
            else
                return status;
            status = await submit();
            continue;
        }
        if (status.canResume) {
            status = await submit();
            continue;
        }
        await observeActive(current);
        check();
        status = await port.observeWorkspaceProvisioning(projectId);
    }
    throw Error('WORKSPACE_ENSURE_FAILED');
}
