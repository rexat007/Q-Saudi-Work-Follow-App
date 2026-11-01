import { projectRepository } from '../repositories/project.repository';
import { ProjectEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auth } from '../firebase/config';

export class ProjectService {
  async getProject(projectId: string): Promise<ProjectEntity | null> {
    return projectRepository.findById(projectId);
  }

  async getAllProjects(context?: AuthUserContext): Promise<ProjectEntity[]> {
    const isSuperAdmin = context?.role === 'SUPER_ADMIN';
    return projectRepository.listAll(context?.assignedProjectIds, isSuperAdmin);
  }

  private async command(path: string, body: unknown) {
    const user = auth.currentUser;
    if (!user) throw new Error('UNAUTHENTICATED');
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw Object.assign(new Error(json.error || 'PROJECT_COMMAND_FAILED'), { code: json.code, status: res.status });
    return json.data;
  }

  async createProject(
    payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & { operationId?: string },
    context: AuthUserContext & { operationId?: string }
  ): Promise<ProjectEntity> {
    return this.command('/api/projects', { ...payload, operationId: payload.operationId || context.operationId });
  }

  async updateProject(projectId: string, updates: Partial<ProjectEntity>, _context: AuthUserContext, expectedVersion?:number): Promise<void> {
    await this.command(`/api/projects/${encodeURIComponent(projectId)}/foundation`, { updates, expectedVersion });
  }

  async configureOperations(projectId:string, configuration:import('../types/operationalProfile').OperationalConfiguration, expectedVersion:number, acknowledgeLegacyDualCompatibility=false):Promise<ProjectEntity> {
    return this.command(`/api/projects/${encodeURIComponent(projectId)}/operational-configuration`,{configuration,expectedVersion,acknowledgeLegacyDualCompatibility});
  }

  async deleteProject(_projectId: string, _context: AuthUserContext): Promise<void> {
    throw new Error('PROJECT_DELETE_NOT_SUPPORTED');
  }

  subscribeToProjects(onData: (projects: ProjectEntity[]) => void) {
    return projectRepository.subscribeToProjects(onData);
  }
}

export const projectService = new ProjectService();
