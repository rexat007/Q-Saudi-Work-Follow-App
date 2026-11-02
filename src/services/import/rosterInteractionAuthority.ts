/** UI command ownership only. Durable versions and execution receipts remain server authority. */
export class RosterInteractionAuthority {
  private owner: symbol | null = null;
  private epoch = 0;
  get generation() {return this.epoch;}
  begin() {if(this.owner) return null; return this.owner=Symbol('roster-command');}
  owns(token: symbol) {return this.owner===token;}
  finish(token: symbol) {if(!this.owns(token)) return false; this.owner=null; return true;}
  invalidate() {this.epoch++; this.owner=null;}
  get busy() {return this.owner!==null;}
}

export type ImportFailureKind='USER_CORRECTABLE'|'RETRYABLE_TRANSIENT'|'STALE_CONTEXT'|'AUTHORIZATION'|'INTEGRITY_BLOCKER'|'TERMINAL'|'RECOVERY_REQUIRED';
export function classifyImportFailure(error: unknown): ImportFailureKind {
  const code=String((error as {code?:unknown;message?:unknown})?.code || (error as Error)?.message || '');
  if(/FORBIDDEN|UNAUTHENTICATED|PERMISSION|AUTHORIZATION/.test(code))return 'AUTHORIZATION';
  if(/STALE|VERSION_CONFLICT|PROJECT_CONTEXT/.test(code))return 'STALE_CONTEXT';
  if(/TERMINAL|ALREADY_COMMITTED|EXECUTION_ALREADY_COMPLETED/.test(code))return 'TERMINAL';
  if(/RECOVERY|REFRESH|CHECKPOINT|EXECUTION_INTERRUPTED/.test(code))return 'RECOVERY_REQUIRED';
  if(/INTEGRITY|MISMATCH|CORRUPT|INVALID_REVIEWED/.test(code))return 'INTEGRITY_BLOCKER';
  if(/offline|network|unavailable|timeout|aborted/i.test(code))return 'RETRYABLE_TRANSIENT';
  return 'USER_CORRECTABLE';
}
