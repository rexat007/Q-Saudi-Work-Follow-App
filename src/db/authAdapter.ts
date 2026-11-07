/**
 * Request Authentication Adapter: Firebase Identity to PostgreSQL Authority
 * Architecture Authority: ARCH-R1 / Revision 1.2 & ADR-001 (Section 17.4)
 * Scope: AR2-U01 Identity Provider decoupling, fail-closed SQL role resolution
 */

import type { Pool } from 'pg';
import { getPool } from './pool.js';
import type { UserAuthContext } from './types.js';

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
}

export class AuthenticationError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
  }
}

/**
 * Authenticate and resolve commercial authorization context against PostgreSQL
 * Fails closed if user is suspended, inactive, or not registered in SQL.
 */
export async function resolveUserAuthContext(
  token: DecodedFirebaseToken,
  targetCompanyId?: string,
  poolOverride?: Pool
): Promise<UserAuthContext> {
  const pool = poolOverride || getPool();

  // 1. Resolve user by firebase_uid
  const userRes = await pool.query<{
    id: string;
    firebase_uid: string;
    status: 'ACTIVE' | 'SUSPENDED';
    display_name: string | null;
  }>(
    `SELECT id, firebase_uid, status, display_name FROM users WHERE firebase_uid = $1`,
    [token.uid]
  );

  if (userRes.rows.length === 0) {
    throw new AuthenticationError('USER_NOT_REGISTERED', `User ${token.uid} is not provisioned in canonical database`);
  }

  const user = userRes.rows[0];
  if (user.status !== 'ACTIVE') {
    throw new AuthenticationError('ACCOUNT_SUSPENDED', `User account ${user.id} is suspended`);
  }

  // 2. Resolve company roles
  let roleQuery = `
    SELECT ucr.company_id, ucr.role, ucr.status
    FROM user_company_roles ucr
    JOIN companies c ON c.id = ucr.company_id
    WHERE ucr.user_id = $1 AND ucr.status = 'ACTIVE' AND c.status = 'ACTIVE'
  `;
  const roleParams: unknown[] = [user.id];

  if (targetCompanyId) {
    roleQuery += ` AND ucr.company_id = $2`;
    roleParams.push(targetCompanyId);
  }

  roleQuery += ` ORDER BY ucr.created_at ASC LIMIT 1`;

  const roleRes = await pool.query<{
    company_id: string;
    role: string;
    status: string;
  }>(roleQuery, roleParams);

  if (roleRes.rows.length === 0) {
    throw new AuthorizationError('NO_ACTIVE_COMPANY_ROLE', `User ${user.id} has no active commercial company role`);
  }

  const companyRole = roleRes.rows[0];

  // 3. Resolve accessible projects within the company
  const accessRes = await pool.query<{ project_id: string }>(
    `SELECT pa.project_id
     FROM project_access pa
     JOIN projects p ON p.id = pa.project_id
     WHERE pa.company_id = $1 AND pa.user_id = $2 AND pa.status = 'ACTIVE' AND p.company_id = $1
       AND (pa.valid_period @> clock_timestamp())`,
    [companyRole.company_id, user.id]
  );

  const accessibleProjectIds = accessRes.rows.map(r => r.project_id);

  return {
    userId: user.id,
    firebaseUid: user.firebase_uid,
    companyId: companyRole.company_id,
    role: companyRole.role,
    status: user.status,
    accessibleProjectIds
  };
}

/**
 * Verify whether the authenticated user has access to a specific project
 * Fails closed.
 */
export function assertProjectAccess(
  authContext: UserAuthContext,
  projectId: string
): void {
  // Global company admins bypass per-project lists within their company
  if (authContext.role === 'COMPANY_ADMIN' || authContext.role === 'SUPER_ADMIN') {
    return;
  }

  if (!authContext.accessibleProjectIds.includes(projectId)) {
    throw new AuthorizationError(
      'PROJECT_ACCESS_DENIED',
      `User ${authContext.userId} does not have active access to project ${projectId}`
    );
  }
}
