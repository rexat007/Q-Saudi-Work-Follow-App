import { adminDb } from '../firebase/admin';
import { ProjectReadinessAdminReadContext } from './projectReadiness.server';
import { ProjectReadinessService } from './projectReadiness.service';
import type { AuthUserContext } from '../types/common';

/** One coherent readiness snapshot; post-read reauthorization may reject it, never recompose its dimensions. */
export class ProjectReadinessQueryService {
  constructor(private db: any = adminDb) { }
  async read(projectId: string, identity: AuthUserContext) {
    const snapshot = await this.db.runTransaction(async (tx: any) => {
      const reads = new ProjectReadinessAdminReadContext(this.db, ref => tx.get(ref));
      const actor = await reads.currentPrincipal(projectId, identity);
      const project = await reads.getProject(projectId);
      if (!project) throw Object.assign(new Error('PROJECT_NOT_FOUND'), {code:'PROJECT_NOT_FOUND',status:404});
      const readiness=await new ProjectReadinessService().evaluateProjectReadiness(projectId,new Date(),reads,actor);
      return {readiness,role:actor.role,projectStatus:project.status,projectVersion:project.version||0};
    });
    const reads = new ProjectReadinessAdminReadContext(this.db);
    const actor = await reads.currentPrincipal(projectId, identity);
    const project = await reads.getProject(projectId);
    if (!project) throw Object.assign(new Error('PROJECT_NOT_FOUND'), {code:'PROJECT_NOT_FOUND',status:404});
    if(actor.role!==snapshot.role||project.status!==snapshot.projectStatus||(project.version||0)!==snapshot.projectVersion)
      throw Object.assign(new Error('REFRESH_STALE_GENERATION'),{code:'REFRESH_STALE_GENERATION',status:409});
    return {...snapshot.readiness,projectStatus:snapshot.projectStatus};
  }
}
