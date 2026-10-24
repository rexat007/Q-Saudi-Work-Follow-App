import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const rules = readFileSync('firestore.rules', 'utf8');
function helper(name: string) {
  const start = rules.indexOf(`    function ${name}(`);
  if (start < 0) throw Error(`Missing helper ${name}`);
  return rules.slice(start, rules.indexOf('\n    }', start) + 6);
}
// Structural rule-contract evidence only; no Firestore emulator is installed/configured.
describe('Current principal Firestore rules (structural)', () => {
  it('denies stale SUPER_ADMIN claims after profile downgrade', () => {
    expect(helper('isSuperAdmin')).toContain("isUserActive() && currentUser().role == 'SUPER_ADMIN'");
    expect(helper('isSuperAdmin')).not.toContain('request.auth.token');
  });
  it('denies stale ACTIVE claims after suspension or explicit inactivity', () => {
    const active = helper('isUserActive'); expect(active).toContain('isCurrentUserValid()');
    expect(active).toContain("== 'ACTIVE'"); expect(active).toContain("currentUser().get('isActive', true) != false");
    expect(active).not.toContain('request.auth.token');
  });
  it('cannot retain removed project membership through token assignments/projectRoles', () => {
    expect(helper('isProjectMember')).toContain('projectId in currentUser().assignedProjectIds');
    expect(helper('isProjectMember')).toContain('isUserActive()');
    expect(helper('isProjectMember')).not.toContain('request.auth.token');
  });
  it('denies stale operation roles and preserves current positive role/project grants', () => {
    const role = helper('hasProjectRole'); expect(role).toContain('currentUser().role in allowedRoles && projectId in currentUser().assignedProjectIds');
    expect(role).toContain('isUserActive()'); expect(role).toContain('isSuperAdmin()'); expect(role).not.toContain('request.auth.token');
  });
  it('requires a canonical current account instead of claims-only human access', () => {
    expect(helper('hasCurrentUser')).toContain('exists(/databases/$(database)/documents/users/$(request.auth.uid))');
    const valid = helper('isCurrentUserValid'); expect(valid).toContain('hasCurrentUser()');
    expect(valid).toContain("currentUser().get('userId', request.auth.uid) == request.auth.uid");
    expect(valid).toContain("currentUser().get('assignedProjectIds', null) is list");
    expect(valid).toContain("currentUser().get('isActive', true) is bool");
  });
  it('keeps legacy boolean-active fallback and current administrative read roles', () => {
    expect(helper('isUserActive')).toContain("currentUser().get('isActive', false) == true ? 'ACTIVE' : 'PENDING_APPROVAL'");
    expect(helper('isAdminConsoleReader')).toContain("currentUser().role == 'PROJECT_ADMIN'");
    expect(helper('isAdminConsoleReader')).not.toContain('request.auth.token');
  });
  it('keeps infrastructure-only claims separate without bypassing existing human accounts', () => {
    const infra = helper('isServerAuthorized'); expect(infra).toContain('!hasCurrentUser()');
    expect(infra).toContain("request.auth.token.get('isServer', false)"); expect(infra).toContain("== 'SYSTEM'");
    expect(infra).toContain("!(request.auth.token.get('role', '') in [");
  });
});
