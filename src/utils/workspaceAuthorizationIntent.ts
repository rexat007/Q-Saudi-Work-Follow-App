export interface WorkspaceAuthorizationIntent {
  userId: string;
  projectId: string;
  action: 'PROVISION_GOOGLE_WORKSPACE';
  setupLayer: 'WORKSPACE';
  startedAt: number;
  scope: string;
}
export function beginWorkspaceIntent(userId:string,projectId:string,scope:string,now=Date.now()):WorkspaceAuthorizationIntent {
  return {userId,projectId,action:'PROVISION_GOOGLE_WORKSPACE',setupLayer:'WORKSPACE',startedAt:now,scope};
}
export function workspaceIntentCurrent(intent:WorkspaceAuthorizationIntent,context:{userId:string;projectId:string|null;scope:string;layer:string},now=Date.now()) {
  return now>=intent.startedAt && now-intent.startedAt<10*60*1000 && intent.userId===context.userId && intent.projectId===context.projectId && intent.scope===context.scope && context.layer==='WORKSPACE';
}
