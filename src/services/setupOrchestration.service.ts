import { auth } from '../firebase/config';
import { projectCanonicalRefreshService, type ProjectCanonicalRefreshSnapshot } from './projectCanonicalRefresh.service';

export class SetupCommandError extends Error {
  constructor(public code: string, public status?: number, message = code) { super(message); }
}
export async function setupCommand(projectId: string, surface: string, payload: unknown) {
  return postSetupJson(`/api/projects/${encodeURIComponent(projectId)}/${surface}`, payload);
}
export async function postSetupJson(path: string, payload: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new SetupCommandError('UNAUTHENTICATED', 401);
  const response = await fetch(path, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  let json: any;
  try { json = await response.json(); } catch { throw new SetupCommandError('SETUP_COMMAND_FAILED', response.status); }
  if (!response.ok || json.success !== true) throw Object.assign(new SetupCommandError(json.code || 'SETUP_COMMAND_FAILED', response.status, json.error),{blockers:json.blockers,dependencies:json.dependencies});
  return json.data ?? json;
}

/** One editor's command receipt. A refresh retry cannot execute the command a second time. */
export class SetupMutationSession {
  private receipt: { result: unknown } | null = null;
  busy = false;
  private converged = false;
  resetCompleted() { if (!this.busy && this.converged) { this.receipt = null; this.converged = false; } }
  get committed() { return this.receipt !== null; }
  async run(projectId: string, command: () => Promise<unknown>, isCurrent: () => boolean,
    apply: (snapshot: ProjectCanonicalRefreshSnapshot) => void,
    refresh = (p: string) => projectCanonicalRefreshService.refresh(p)) {
    if (this.busy || !isCurrent()) return false;
    this.busy = true;
    try {
      if (!this.receipt) {
        const result = await command();
        if (!isCurrent()) return false;
        this.receipt = { result };
      }
      const snapshot = await refresh(projectId);
      if (!isCurrent()) return false;
      apply(snapshot);
      this.converged = true;
      return true;
    } finally { this.busy = false; }
  }
}
