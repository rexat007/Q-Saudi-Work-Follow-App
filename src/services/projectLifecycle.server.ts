import { projectCommandsServerService } from './projectCommands.server';
import type { ProjectEntity } from '../types/entities';
import type { AuthUserContext } from '../types/common';

// Existing lifecycle API delegates to the shared current-principal transaction boundary.
export class ProjectLifecycleServerService {
  transitionStatus(projectId: string, targetStatus: ProjectEntity['status'], context: AuthUserContext, reason?: string) {
    return projectCommandsServerService.transitionStatus(projectId, targetStatus, context, reason);
  }
}
export const projectLifecycleServerService = new ProjectLifecycleServerService();
