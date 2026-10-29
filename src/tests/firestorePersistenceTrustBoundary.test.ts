import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Structural source-contract checks only. These do not execute the Firestore rules engine.
const rules = readFileSync(resolve('firestore.rules'), 'utf8');
const source = (file: string) => readFileSync(resolve(file), 'utf8');
function block(marker: string): string {
  const start = rules.indexOf(marker);
  if (start < 0) throw new Error(`Missing rule boundary: ${marker}`);
  let depth = 1;
  const open = start + marker.length - 1;
  for (let i = open + 1; i < rules.length; i++) {
    if (rules[i] === '{') depth++;
    if (rules[i] === '}' && --depth === 0) return rules.slice(open + 1, i);
  }
  throw new Error(`Unclosed boundary: ${marker}`);
}
const users = block('match /users/{userId} {');
const audit = block('match /audit_logs/{auditLogId} {');
const request = block('function isSafeAccountRequest(userId) {');
const reader = block('function isAdminConsoleReader() {');
const projects = block('match /projects/{projectId} {').split('// Carriers subcollection')[0];
const pricing = block('match /pricing_rules/{pricingRuleId} {');
const trips = block('match /trips/{tripId} {').split('// Trip Events')[0];
function condition(body: string, operation: string): string {
  const match = body.match(new RegExp(`allow ${operation}: if ([\\s\\S]*?);`));
  if (!match) throw new Error(`Missing permission: ${operation}`);
  return match[1].replace(/\s+/g, ' ').trim();
}
function guardedKeys(body: string): string[] {
  const values = body.match(/affectedKeys\(\)\.hasAny\(\[([\s\S]*?)\]\)/)?.[1];
  if (!values) throw new Error('Missing changed-key guard');
  return Array.from(values.matchAll(/'([^']+)'/g), m => m[1]);
}

describe('Firestore persistence trust boundary (structural verification)', () => {
  it('preserves pending self-registration without granting effective privilege', () => {
    expect(condition(users, 'create')).toContain('isSafeAccountRequest(userId)');
    for (const invariant of ["request.auth.uid == userId", "data.role == 'VIEWER'", "data.status == 'PENDING_APPROVAL'", 'data.isActive == false', 'data.assignedProjectIds is list', 'data.assignedProjectIds.size() == 0']) {
      expect(request).toContain(invariant);
    }
    const ui = source('src/components/auth/AccountStatusGate.tsx');
    expect(ui).toContain("role: 'VIEWER'");
    expect(ui).toContain("status: 'PENDING_APPROVAL'");
    expect(ui).toContain('assignedProjectIds: []');
    expect(ui).toContain('isActive: false');
    expect(ui).toContain('await userRepository.create(pendingProfile)');
  });

  it('binds account request identity and audit authors to the authenticated caller', () => {
    expect(condition(users, 'create')).toContain('incoming().userId == userId');
    expect(condition(users, 'create')).toContain('isAuditStampedCreate(incoming())');
    expect(request).toContain('data.email == request.auth.token.email');
    expect(request).toContain('data.createdBy == request.auth.uid');
    expect(request).toContain('data.updatedBy == request.auth.uid');
  });

  it('allows only the actual account-request shape, excluding approval and arbitrary admin fields', () => {
    const list = request.match(/keys\(\)\.hasOnly\(\[([\s\S]*?)\]\)/)?.[1] ?? '';
    const fields = Array.from(list.matchAll(/'([^']+)'/g), m => m[1]);
    expect(fields.sort()).toEqual(['userId', 'email', 'fullName', 'role', 'requestedRole', 'requestReason', 'assignedProjectIds', 'status', 'isActive', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].sort());
  });

  it('denies all ordinary self/cross-user updates, protecting effective access and approval fields by default', () => {
    const update = condition(users, 'update');
    expect(update).toBe('false');
    const service = source('src/services/adminAccount.server.ts');
    expect(service).toContain("actor.role !== 'SUPER_ADMIN'");
    expect(service).toContain('before.userId !== targetUserId');
    expect(service).not.toContain('email: input.email');
  });

  it('preserves server-authoritative super-admin governance and immutable creation metadata', () => {
    expect(condition(users, 'create')).toContain('isSafeAccountRequest(userId)');
    expect(condition(users, 'update')).toBe('false');
    expect(condition(users, 'delete')).toBe('false');
    const ui = source('src/components/admin/AdminConsoleView.tsx');
    expect(ui).toContain("command: 'approveAccount'");
    expect(ui).not.toContain('userRepository.update(');
    const service = source('src/services/adminAccount.server.ts');
    expect(service).toContain('approvedBy: actor.userId');
    expect(service).toContain('assignedProjectIds: assigned');
    expect(service).toContain('updatedBy: actor.userId');
  });

  it('preserves self-read while removing ordinary global user listing', () => {
    expect(condition(users, 'get')).toContain('request.auth.uid == userId || isAdminConsoleReader()');
    expect(condition(users, 'list')).toBe('isAdminConsoleReader()');
    expect(condition(users, 'get')).not.toContain('|| isUserActive()');
  });

  it('uses precisely the existing Admin Console reader roles, not every active user', () => {
    expect(reader).toContain('return isUserActive() && (');
    expect(reader).toContain('isSuperAdmin()');
    expect(reader).not.toContain("request.auth.token");
    expect(reader).toContain("currentUser().role == 'PROJECT_ADMIN'");
    const nav = source('src/services/navigation.service.ts');
    const consoleItem = nav.slice(nav.indexOf("id: 'ADMIN_CONSOLE'"), nav.indexOf("id: 'SECURITY_AUDIT'"));
    expect(consoleItem).toContain("allowedRoles: ['SUPER_ADMIN', 'PROJECT_ADMIN']");
    expect(reader).not.toMatch(/DISPATCHER|VIEWER|FINANCE_AUDITOR/);
  });

  it('restricts audit reads to the administrative boundary and preserves actor-checked append-only writes', () => {
    expect(condition(audit, 'get, list')).toBe('isAdminConsoleReader()');
    const create = condition(audit, 'create');
    expect(create).toContain('isAuditStampedCreate(incoming())');
    expect(create).toContain('incoming().auditLogId == auditLogId');
    expect(create).toContain('incoming().actor.userId == request.auth.uid');
    expect(create).toContain('incoming().createdBy == request.auth.uid');
    expect(condition(audit, 'update, delete')).toBe('false');
  });

  it('denies direct project creation/deletion while retaining scoped generic edits without lifecycle or allocated-ID mutation', () => {
    expect(condition(projects, 'create')).toBe('false');
    expect(condition(projects, 'delete')).toBe('false');
    expect(condition(projects, 'get')).toContain('isProjectMember(projectId)');
    expect(condition(projects, 'update')).toContain("hasProjectRole(projectId, ['PROJECT_ADMIN', 'SUPER_ADMIN'])");
    expect(guardedKeys(projects)).toEqual(['status', 'projectCode', 'projectNumber']);
    expect(source('src/services/project.service.ts')).toContain('await projectRepository.update(projectId, sanitizedUpdates, context.userId)');
  });

  it('denies direct pricing mutations while preserving scoped reads and canonical server commands', () => {
    expect(condition(pricing, 'create')).toBe('false');
    expect(condition(pricing, 'get, list')).toContain('isProjectMember(projectId)');
    expect(condition(pricing, 'update')).toBe('false');
    expect(condition(pricing, 'delete')).toBe('false');
    const app = source('server/app.ts');
    expect(app).toContain("'/api/projects/:projectId/pricing-rules'");
    expect(app).toContain('projectPricingServerService.createPricingRule(');
    expect(source('src/services/projectPricing.server.ts')).toContain('this.db.runTransaction(');
  });

  it('denies direct trip creation and protects all server snapshots while preserving legitimate reads/guarded updates', () => {
    expect(condition(trips, 'create')).toBe('false');
    expect(condition(trips, 'get, list')).toContain('isProjectMember(projectId)');
    expect(guardedKeys(trips)).toEqual(['tripNumber', 'projectSnapshot', 'carrierSnapshot', 'truckSnapshot', 'driverSnapshot', 'materialSnapshot', 'pricingSnapshot']);
    expect(condition(trips, 'update')).toContain('hasProjectRole(projectId,');
    expect(condition(trips, 'update')).toContain("incoming().unloadDecision == existing().unloadDecision");
    expect(condition(trips, 'delete')).toBe('false');
    const adapter = source('src/services/canonicalTripPersistence.server.ts');
    expect(adapter).toContain("import { adminDb } from '../firebase/admin'");
    expect(adapter).toContain('.set(payload)');
  });

  it('keeps default deny, project relationship rules and append-only trip events', () => {
    expect(block('match /{document=**} {')).toContain('allow read, write: if false;');
    expect(block('match /driver_memberships/{driverId} {')).toContain('hasProjectRole(projectId,');
    expect(block('match /driver_truck_assignments/{assignmentId} {')).toContain('incoming().effectiveFrom == existing().effectiveFrom');
    expect(condition(block('match /events/{eventId} {'), 'update, delete')).toBe('false');
  });
});
