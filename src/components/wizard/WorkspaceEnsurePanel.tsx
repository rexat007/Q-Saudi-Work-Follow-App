import {readWorkspaceContinuation,clearWorkspaceContinuation} from '../../runtime/workspaceProvisioningResume';
import React, { useEffect, useRef, useState } from 'react';
import { clientWorkspaceService } from '../../services/workspace.service';
import { runWorkspaceEnsureJourney, type WorkspaceEnsureClient } from '../../utils/workspaceEnsureJourney';
import type { WorkspaceEnsureStatus } from '../../types/workspaceProvisioning';
interface Props {
    actorId?:string;
    projectId: string;
    t: (key: string) => string;
    onReady?: () => void;
    service?: WorkspaceEnsureClient;
}
const progressKeys = { AUTHORIZATION: 'gws.one.phase_authorization', BINDING: 'gws.one.phase_binding', WORKBOOK: 'gws.one.phase_workbook', MASTER_DATA: 'gws.one.phase_master_data', SCRIPT: 'gws.one.phase_script', FINAL_VERIFY: 'gws.one.phase_final_verify' };
const stateKey = { NOT_CONFIGURED: 'gws.one.not_configured', PREPARING: 'gws.one.preparing', ACTION_REQUIRED: 'gws.one.action_required', READY: 'gws.one.ready', ATTENTION_REQUIRED: 'gws.one.attention_required' };
export function WorkspaceEnsurePanel({ projectId, actorId='', t, onReady, service = clientWorkspaceService }: Props) {
    const [status, setStatus] = useState<WorkspaceEnsureStatus | null>(null), [busy, setBusy] = useState(false), [failure, setFailure] = useState(false), generationBlocked=useRef(false), interaction = useRef<(() => void) | undefined>(undefined), active = useRef(0), running = useRef(false), ready = useRef(onReady);
    ready.current = onReady;
    useEffect(() => {
        const generation = ++active.current;
        let timer: ReturnType<typeof setTimeout> | undefined;
        running.current = false;generationBlocked.current=false;
        setBusy(false);
        setFailure(false);
        setStatus(null);
        const observe = async () => { if(generationBlocked.current)return;try {
            const value = await service.observeWorkspaceProvisioning(projectId);
            if (active.current !== generation)
                return;
            setStatus(value);
            const saved=readWorkspaceContinuation(actorId),resuming=saved?.projectId===projectId&&(!saved.operationId||saved.operationId===value.operationId);
            if (value.state === 'PREPARING' && value.canResume||resuming&&value.state==='NOT_CONFIGURED') {
                void run(generation);
                return;
            }
            if (value.state === 'PREPARING' || value.state === 'ACTION_REQUIRED')
                timer = setTimeout(() => void observe(), 2000);
        }
        catch {
            if (active.current === generation)
                setFailure(true);
        } };
        if (typeof service.observeWorkspaceProvisioning === 'function')
            void observe();
        return () => { active.current++; clearTimeout(timer); interaction.current?.(); interaction.current = undefined;clearWorkspaceContinuation(actorId,projectId); };
    }, [projectId, actorId, service]);
    const run = async (generation = active.current, human = false) => { if (running.current||generationBlocked.current)
        return; running.current = true; const finishInteraction = human && (!status || status.state === 'NOT_CONFIGURED' || status.actionRequired === 'GOOGLE_AUTHORIZATION' || status.actionRequired === 'GOOGLE_AUTOMATION_PERMISSION') ? service.prepareEnsureInteraction?.() : undefined; interaction.current = finishInteraction; setBusy(true); setFailure(false); const controller = new AbortController(); const observer = setInterval(() => { void service.observeWorkspaceProvisioning(projectId, controller.signal).then(value => { if (active.current === generation)
        setStatus(value); }).catch(() => { if (active.current === generation) setFailure(true); }); }, 1500); try {
        const result = await runWorkspaceEnsureJourney(projectId, service, () => active.current === generation, value => { setStatus(value); setFailure(false); });
        if (active.current === generation && result.state === 'READY'){clearWorkspaceContinuation(actorId,projectId);ready.current?.();}
    }
    catch(error) {
        if(error instanceof Error&&error.message==='APP_UPDATE_REQUIRED')generationBlocked.current=true;
        if (active.current === generation)
            setFailure(true);
    }
    finally {
        clearInterval(observer);
        controller.abort();
        finishInteraction?.();
        if (interaction.current === finishInteraction)
            interaction.current = undefined;
        if (active.current === generation) {
            setBusy(false);
            running.current = false;
        }
    } };
    if (typeof service.ensureWorkspace !== 'function')
        return null;
    return <section className="rounded-xl border border-stone-700 p-4 space-y-3" aria-busy={busy}>
  <p role="status" aria-live="polite">{t(busy ? 'gws.one.preparing' : failure ? 'gws.one.attention_required' : stateKey[status?.state || 'NOT_CONFIGURED'])}</p>
  {status && <ol aria-label={t('gws.one.progress')}>{(Object.keys(progressKeys) as (keyof typeof progressKeys)[]).map(phase => <li key={phase}>{status.completed.includes(phase) ? '✓ ' : ''}{t(progressKeys[phase])}</li>)}</ol>}
  {(!status || status.state !== 'ATTENTION_REQUIRED' || status.canResume) && <button type="button" onClick={() => void run(active.current, true)} disabled={busy||generationBlocked.current} className="bg-amber-600 rounded-xl px-4 py-2 font-bold">{t(status?.state === 'READY' ? 'gws.one.verify' : 'gws.one.prepare')}</button>}
 </section>;
}
