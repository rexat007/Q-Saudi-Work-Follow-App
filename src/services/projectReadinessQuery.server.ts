import { adminDb } from '../firebase/admin';
import { ProjectReadinessAdminReadContext } from './projectReadiness.server';
import { ProjectReadinessService, lifecycleReadiness } from './projectReadiness.service';
import type { AuthUserContext } from '../types/common';

/** Existing readiness endpoint orchestration: coherent read snapshot, then current-scope recheck. */
export class ProjectReadinessQueryService {
  constructor(private db: any = adminDb) { }
  async read(projectId: string, identity: AuthUserContext) {
    const result = await this.db.runTransaction(async (tx: any) => {
      const reads = new ProjectReadinessAdminReadContext(this.db, ref => tx.get(ref));
      const actor = await reads.currentPrincipal(projectId, identity);
      return new ProjectReadinessService().evaluateProjectReadiness(projectId, new Date(), reads, actor);
    });
    const reads = new ProjectReadinessAdminReadContext(this.db);
    const actor = await reads.currentPrincipal(projectId, identity);
    const project = await reads.getProject(projectId);
    if (!project) throw Object.assign(new Error('PROJECT_NOT_FOUND'), { code: 'PROJECT_NOT_FOUND', status: 404 });
    result.lifecycle = lifecycleReadiness(project, projectId, actor);
    result.blockers = [...result.lifecycle.blockers, ...result.setup.blockers, ...result.operational.blockers];
    result.ready = result.lifecycle.ready && result.setup.ready && result.operational.ready;
    return result;
  }
}
