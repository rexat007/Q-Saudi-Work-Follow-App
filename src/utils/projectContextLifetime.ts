export interface ProjectContextToken { readonly projectId: string | null; readonly generation: number }

/** Wizard-local lifetime, not a domain/persistence authority. Tokens cannot survive A → empty → A. */
export class ProjectContextLifetime {
  private projectId: string | null = null;
  private generation = 0;
  private owner = '';
  private active = true;
  enter(projectId: string | null, owner: string) {
    const normalized = projectId || null;
    if (!this.active || normalized !== this.projectId || owner !== this.owner) {
      this.generation += 1;
      this.projectId = normalized;
      this.owner = owner;
    }
    this.active = true;
  }
  invalidate() { this.generation += 1; }
  dispose() { this.invalidate(); this.active = false; }
  capture(): ProjectContextToken { return { projectId: this.projectId, generation: this.generation }; }
  isCurrent(token: ProjectContextToken, projectId: string | null = token.projectId) {
    return this.active && token.projectId === (projectId || null) && this.projectId === token.projectId && this.generation === token.generation;
  }
}
