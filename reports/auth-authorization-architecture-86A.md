# BLOCK 86A — AUTHORIZATION ARCHITECTURE AUDIT REPORT

**Audit Mode:** READ ONLY — NO CODE CHANGES — NO DEPLOYMENT  
**Audit Date:** September 14, 2026  
**Application:** Q-Saudi-Work-Follow  

---

## 1. Executive Summary & Deterministic Declarations

| Dimension | Status / Store | Description |
|---|---|---|
| **AUTH_ARCHITECTURE** | **`PARTIAL`** | Basic Google Sign-In & Firestore user schema exist, but post-login profile hooks and approval gates are missing. |
| **USER_PROFILE_STORE** | **`FIRESTORE_USERS_COLLECTION (/users/{userId})`** | Primary schema defined in `UserEntity`, `firestore.rules`, and `user.repository.ts`. |
| **ROLE_STORE** | **`FIRESTORE_USERS_COLLECTION & CUSTOM_CLAIMS`** | Stored in `/users/{userId}.role` and checked via token claims in rules. Express uses header fallbacks. |
| **PROJECT_MEMBERSHIP_STORE** | **`FIRESTORE_USERS_COLLECTION & CUSTOM_CLAIMS`** | Stored in `/users/{userId}.assignedProjectIds` and token claims in rules. |
| **APPROVAL_WORKFLOW** | **`MISSING`** | No `status: 'PENDING_APPROVAL'` field or account request queue exists. |
| **SERVER_AUTHORIZATION** | **`PARTIAL`** | Firestore rules enforce roles/projects strictly; Express middleware relies on unverified headers (`x-user-role`). |
| **GOOGLE_OPEN_ACCESS** | **`YES`** | Any Google account completing `signInWithPopup` gains access to client views without pre-approval. |

---

## 2. Detailed Audit Verification Findings

### 1. Enabled Auth Providers
- **Google Sign-In (`GoogleAuthProvider`):** Implemented in `src/firebase/authContext.tsx` via `signInWithPopup(auth, provider)`.
- **Other Providers:** No Email/Password, Phone, or SAML authentication is currently implemented in code.

### 2. Google Account Open Access (`GOOGLE_OPEN_ACCESS = YES`)
- Upon completing `signInWithPopup`, Firebase Auth sets `user` in `AuthContext`.
- No check is performed against a whitelist or pre-existing Firestore profile. Any valid Google account can log in and enter the application frontend.

### 3. Firestore User / Profile Document
- **Schema & Repository:** `/users/{userId}` is defined in `firestore.rules`, `firebase-blueprint.json`, `UserEntity`, and `user.repository.ts`.
- **Auto-Provisioning on Sign-In:** **Missing.** `authContext.tsx` does NOT automatically query or create a `/users/{uid}` document upon Google login.

### 4. User Document Collection Structure
- **Path:** `/users/{userId}` (where `{userId}` = Firebase Auth UID).
- **Schema:**
  - `userId`: string
  - `email`: string
  - `fullName`: string
  - `role`: `'PROJECT_ADMIN' | 'SUPER_ADMIN' | 'SITE_SUPERVISOR' | 'SUPERVISOR' | 'DISPATCHER' | 'FINANCE_AUDITOR' | 'SCALE_OPERATOR' | 'DRIVER' | 'VIEWER'`
  - `assignedProjectIds`: string[]
  - `isActive`: boolean
  - `createdAt`: timestamp
  - `createdBy`: string
  - `updatedAt`: timestamp
  - `updatedBy`: string

### 5. Role Storage & Server-Side Evaluation
- **Firestore:** Stored in `/users/{userId}.role`.
- **Firestore Security Rules:** Checks `request.auth.token.role` or `get(/users/$(request.auth.uid)).data.role`.
- **Express Backend:** Express middleware (`server/security.middleware.ts`) extracts `x-user-role` header with default fallback `PROJECT_ADMIN`.

### 6. Project Assignment Storage
- **Firestore:** Stored in `/users/{userId}.assignedProjectIds`.
- **Firestore Security Rules:** Checked via `isProjectMember(projectId)` rule function.
- **Express Backend:** Extracts `x-assigned-projects` header with default fallback `['PRJ-NEOM-NORTH-01']`.

### 7. Account Approval & Request Status (`APPROVAL_WORKFLOW = MISSING`)
- `UserEntity` has an `isActive: boolean` flag, but lacks an explicit request lifecycle state (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`).
- New users signing in via Google are not routed to a "Pending Request" state.

### 8. Route Access & Unauthorized Behavior
- **Frontend:** Signed-in users can navigate across all functional tabs and switch active roles or security profiles via UI controls.
- **Express Backend:** Unauthenticated API calls fall back to a system admin context instead of returning `401 Unauthorized`.

### 9. Server-Side Role Enforcement
- **Firestore Rules:** **Enforced.** `hasProjectRole` helper checks user role before permitting creates/updates.
- **Express Backend:** **Partial.** `enforceRole` middleware executes role checks, but reads role from client-provided HTTP headers.

### 10. Server-Side Project Scope Enforcement
- **Firestore Rules:** **Enforced.** `isProjectMember` checks `assignedProjectIds` on document paths.
- **Express Backend:** **Partial.** `enforceProjectIsolation` checks `assignedProjectIds`, but relies on `x-assigned-projects` header.

### 11. Admin / User Management Interface
- **Present:** `src/components/admin/AdminConsoleView.tsx` (Users section) provides a full UI to list users, change roles (`updateUserRole`), toggle active status (`toggleUserStatus`), and create users in local state.

---

## 3. Minimum Architecture Required for Complete Approval Workflow

To transition the system to the full target workflow:
`LOGIN -> ACCOUNT REQUEST -> PENDING APPROVAL -> ADMIN APPROVAL -> ROLE ASSIGNMENT -> PROJECT ASSIGNMENT -> ACTIVE ACCESS`:

1. **Schema Extension (`/users/{userId}`):**
   Add fields: `status: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'`, `requestedRole: string`, `requestReason?: string`, `approvedBy?: string`, `approvedAt?: string`.

2. **Post-Login Profile Lifecycle Hook (`authContext.tsx`):**
   Upon successful Google Sign-In, query Firestore `/users/{uid}`. If missing, create a user document with `status = 'PENDING_APPROVAL'`, `role = 'VIEWER'`, `assignedProjectIds = []`.

3. **Pending Approval Access Gate (`App.tsx`):**
   Create a `PendingApprovalGuard` component that wraps operational routes. If user `status !== 'ACTIVE'`, display a dedicated "Account Request Pending Approval" screen blocking operational features.

4. **Admin Approval Queue (`AdminConsoleView.tsx`):**
   Add a "Pending Requests" queue in the Admin Console Users tab with "Approve" (assign role & projects) and "Reject" actions.

5. **Firestore Rules Security Gate (`firestore.rules`):**
   Update rules to require `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'ACTIVE'` for all operational document reads and writes.

6. **Express Server Auth Token Verification (`server/security.middleware.ts`):**
   Update `authenticateUser` to verify Firebase ID Tokens (`Bearer <idToken>`) against Firebase Admin SDK or Firestore user document, enforcing role and active status server-side.

---

## 4. Deterministic Output Declarations

```text
AUTH_ARCHITECTURE = PARTIAL
USER_PROFILE_STORE = FIRESTORE_USERS_COLLECTION (/users/{userId})
ROLE_STORE = FIRESTORE_USERS_COLLECTION (/users/{userId}.role) & CUSTOM_CLAIMS
PROJECT_MEMBERSHIP_STORE = FIRESTORE_USERS_COLLECTION (/users/{userId}.assignedProjectIds) & CUSTOM_CLAIMS
APPROVAL_WORKFLOW = MISSING
SERVER_AUTHORIZATION = PARTIAL
GOOGLE_OPEN_ACCESS = YES
MINIMUM_REQUIRED_CHANGES = 1. Extend /users/{userId} schema with status ('PENDING_APPROVAL'|'ACTIVE'|'REJECTED') and requestedRole. 2. Update authContext.tsx to check/create Firestore user document on sign-in. 3. Add PendingApprovalGuard component in App.tsx. 4. Add Pending Requests Queue in AdminConsoleView.tsx. 5. Enforce status == 'ACTIVE' in firestore.rules. 6. Verify Firebase ID Tokens in Express backend instead of trusting request headers.
```
