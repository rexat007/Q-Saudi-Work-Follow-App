# AR2-U09-RB1 — SQL governance and account presentation

## Preflight and exact source-derived scope (before implementation)

Main fetched `030e9027685033c674cf2021499db7bfb675cbfd`; PR #99 merged, independently confirmed through GitHub. Existing local/published U09 branch HEAD `545507c70c7e4861e9f732b7f9cdce613d1b3e58`, initial worktree clean, no extra local changes. Published migrations 001–011 bytes equal that exact Git commit. Read approved ARCH-R1 Rev1.2 governance/isolation/API/offline/Workspace contracts, U09 complete blocker/evidence record, U07/U08 records and current ledgers. No applicable AGENTS.md. Same 135-file historical selection is being remeasured in a clean detached starting-U09 checkout; no old fixture/assertion overlays.

Owner clarification: adding 012 to the six migration inventory assertions is explicitly permitted; no other existing assertion/case/checksum/authorization check may change. Production activation, PR/merge/deployment, RB2 UI/navigation/Smart Import migration and Workspace delivery remain forbidden.

## Field/command root-cause matrix

| Capability / Firestore source | SQL source and gap | Classification | Authorization / receipt / consumer |
|---|---|---|---|
| Registration: AccountStatusGate -> userRepository, verified Firebase UID, email/name, default VIEWER, requestedRole/reason, PENDING_APPROVAL | users permits ACTIVE/SUSPENDED only, lacks application lifecycle/revision | MISSING_AUTHORITY | Explicit self-registration after trusted token only; pending never grants commercial access; company-scoped receipt; account gate later consumes typed status. No read auto-registers. |
| Current own account/profile/status: authContext/authSession, users profile | users has UID/display_name/email/status; no safe own DTO/read port | EXISTS_BUT_INCOMPLETE | Verified UID -> current SQL account; own allowlisted profile, distinct missing/unavailable, company membership separate; no UserEntity with fabricated full project IDs. |
| Current roles/permissions: principal/security.middleware | user_company_roles/project_access + U01/U04/U06 authorization | EXISTS_AND_COMPOSABLE | Roles from current SQL rows, no token/browser role; preserve SQL COMPANY_ADMIN read scope, do not silently map it into a different UI role. |
| Company membership/application | companies + user_company_roles temporal ACTIVE/REVOKED; no scoped pending/rejected/suspended application | EXISTS_BUT_INCOMPLETE | Tenant-specific account lifecycle and role grant/revoke; global user suspension still blocks all business. Tenant suspension must not disable another company. |
| Account approve/reject/suspend/reactivate/change role/replace projects | AdminAccountServerService, self-action and last-SUPER_ADMIN protection; SQL lacks command authority | MISSING_AUTHORITY | Current company SUPER_ADMIN only; current target-company relationship; revision, company lock, immutable encrypted receipts/audit and permission history; bounded admin account inventory. |
| Driver account link/unlink | AdminAccountServerService / trip_driver_links | EXISTS_BUT_INCOMPLETE | Current SUPER_ADMIN, DRIVER target, same-company verified Driver, unique owner, no driver profile disclosure; role change removes incompatible link. |
| Project creation: ProjectCommandsServerService | projects stores identity/number/name/status; no complete foundation fields or allocator command | MISSING_AUTHORITY | Current SUPER_ADMIN, server-generated stable ID/number using serialized global counter; input identifiers/status cannot override; durable company-level receipt before project exists. |
| Foundation: nameAr/nameEn/clientName/description/dates/location/settings | projects lacks foundation JSON and actor provenance | EXISTS_BUT_INCOMPLETE | Existing FOUNDATION_FIELDS/SETTINGS, ProjectValidator, active profile-only fields, current PROJECT_ADMIN assignment or SUPER_ADMIN; expected revision; preserve identity/history. |
| Lifecycle: SETUP->READY_FOR_REVIEW->APPROVED, reversals, ACTIVE->SUSPENDED | shared LEGAL_LIFECYCLE_TRANSITIONS; SQL status untyped and no command | MISSING_AUTHORITY | Same legal graph, setup reread under project lock; ACTIVATE/REACTIVATE separate readiness-checked operations, never generic transition to ACTIVE. |
| Setup / activation readiness | U04 summary intentionally incomplete; U02/U03 membership/temporal evidence and U06 pricing exist | EXISTS_BUT_INCOMPLETE | Set-based bounded SQL facts, verified relationship event evidence and existing profile requirements/pricing resolver; no projection-only activation or invented legacy foundation. |
| Operational configuration / impact assessment | projects.operational_configuration exists (008); pure validation/evaluateOperationalImpact contract exists | EXISTS_AND_COMPOSABLE | Current governance authorization and revision; current trips/SQL binding evidence, signature reread, historical snapshots retained; SQL Workspace-bound mutation stays blocked until its missing full adapter proves state. |
| Authorized project inventory / selected context | App/project.service subscriptions; SQL project/access schemas exist | MISSING_AUTHORITY | Keyset <=50, signed scoped cursors, authorization/time/revision/epoch bound, per-project current permissions; selection never grants access; RB2 consumes port later. |
| Global company/initial-owner provisioning | No current application company creation authority; Firestore hardcoded initial-owner bootstrap is deployment-specific | DEFERRED_BY_ARCHITECTURE | No public SQL owner bootstrap, auto-admin promotion or company creation invented. Existing accounts/company identities come from separately approved provisioning/migration, synthetic fixtures only here. |

## Schema necessity and semantics

012 alone may add pending/rejected global-account states, revision metadata and safe account/project functions, complete project foundation/provenance, scoped account applications, immutable company-level governance receipts/history, permission change history, a private global project-number allocator and an inventory revision. Existing direct governance DML restrictions and qsa_auth's email denial stay intact. A narrow NOLOGIN/non-bypass capability owns scoped SECURITY DEFINER operations; services retain direct qsa_runtime/qsa_auth identities. No real account/company/project is provisioned by this source unit.

A Firebase identity is global; commercial membership is company-scoped. Tenant admin commands revoke/suspend their company roles and retain the original rows/history, not global access in other companies. A globally SUSPENDED SQL user cannot execute any business operation. Unapproved registration is explicit PENDING_APPROVAL; reads never treat transport failure as missing identity. Existing users/memberships remain usable without fabricated application/profile backfills. Unknown legacy foundation is reported unreconciled, never guessed from a SQL name.

## Exact pre-edit allowlist

Production / additive schema:
- src/db/migrations/012_project_account_governance.sql (new)
- src/db/governanceAuthority.ts (new)
- src/db/governanceReadiness.ts (new)
- src/types/sqlGovernance.ts (new)
- src/services/projectGovernanceContract.ts (new; reuse current pure validation/policy, no Firestore dependency)
- src/services/sqlGovernanceClient.service.ts (new; typed inactive presentation port, no constructor I/O)
- server/sqlGovernanceRoutes.ts (new)
- server/sqlRuntimeRoutes.ts (compose/governance schema gate only)
- src/db/runtimeInventory.ts (new governance categories)
- src/db/runtimeReconciliation.ts (only if metadata contract extension requires it)

Verification:
- src/tests/ar2U09Rb1Governance.test.ts (new native/auth/HTTP/concurrency/receipts/privacy coverage)
- src/tests/helpers/u09NativeFixture.ts (only directly required fixture extension)
- src/tests/ar2U01SecurityGate.test.ts (012 inventory only)
- src/tests/ar2U02CanonicalIdentityMemberships.test.ts (012 inventory only)
- src/tests/ar2U03TemporalAuthority.test.ts (012 inventory only)
- src/tests/ar2U04BoundedReads.test.ts (012 inventory only)
- src/tests/ar2U05DurableImport.test.ts (012 inventory only)
- src/tests/ar2U06Rb1Security.test.ts (012 inventory only)
- .github/workflows/ci-foundation.yml (blocking RB1 native selection)

Documentation:
- docs/reconstruction/02_PHASE_LEDGER.md
- docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
- docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md (append; preserve original report)
- docs/reconstruction/17_AR2_U09_RB1_SQL_GOVERNANCE_AUTHORITY.md (this bounded matrix/evidence record)

No current Firestore command, rule, UI root stop, role definition or pricing/Trip semantics change is planned. Any source-proven allowlist extension must be documented before editing. RB2 navigation/Smart Import UI, RB3 source/provider/export equivalence and RB4 SQL Workspace adapter remain explicit dependencies; overall U09 stays BLOCKED.

### Verified allowlist extension before reconciliation integration

New application/receipt/history/permission-event tables are business evidence and must join U09's inventory. Add `src/db/runtimeReadinessAuthority.ts` for the private governance-counter/inventory frame, and `src/tests/ar2U09MigrationReadiness.test.ts` solely to replace its fixed 48-iteration fixture loops with RUNTIME_INVENTORY_TABLES.length. Every existing assertion stays unchanged; all categories still run and VERIFIED is still required. This is verification-loop metadata, not a weakened assertion. Counter tables remain private control evidence included in the boundary frame. Account membership suspension is tenant-scoped; global operator-disabled users stay blocked and cannot be re-enabled through another company's admin.


## Interrupted-session recovery and exact migration provenance — 2026-11-10

Recovery started read-only on `reconstruction/ar2-u09-sql-runtime-cutover-readiness`, HEAD `545507c70c7e4861e9f732b7f9cdce613d1b3e58`. All 20 existing modified/untracked files were retained. No reset, stash, source replacement, checksum repair, migration 013, production operation, PR or merge was used. Migration 012 was untracked, absent from every local Git history, and unpublished; the live remote U09 branch was independently confirmed at the starting HEAD.

The old isolated database recorded 012 SHA-256 `53c8c4c852e086aa63e70cbdc2944823fa3791980eed34351f998cf0dd771137`. Candidate source SHA-256 is `9001bd9fe208f74f693c94850948ce4556dbfa904c12ac739eaefe1482cbf4ce`. A read-only catalog comparison identified the complete post-application DDL delta:

1. `account_applications` adds `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_encrypted`, with user foreign keys for both actor columns.
2. `qsa_governance_self()` adds membership-revision and temporal-validity cursor evidence.
3. `qsa_governance_account(text)` adds revoked/company-suspended membership presentation and approval/rejection provenance, retaining private rejection ciphertext for subject-only service decryption.
4. `qsa_governance_account_apply(text,text,bigint,jsonb)` persists decision provenance and encrypted rejection, handles explicit rejected/pending reactivation without bypassing global suspension or cross-company reconciliation, and fixes empty suspended-role fallback.
5. `qsa_governance_companies(uuid,integer)` gates globally inactive identities and respects suspended-company privacy/status.
6. New `qsa_governance_project_preflight(text)` performs authorization-only lookup before the canonical project lock; final authorization still repeats under the epoch fence.

Reversing precisely those changes in an evidence copy reproduces the exact recorded original checksum `53c8c4...1137`; this proves there is no unexplained migration-source delta. All other function bodies, table grants, RLS policies and role attributes compare equal. Existing service scope lookup depends on the new preflight function; account/cursor/administration services depend on the revised function results and provenance columns. Both corrections from the interrupted session were already present: suspended foundation mutation uses a 409 governance error, and setup snapshots its blockers before operational-path evaluation; only activation/reactivation requires the complete operational path.

### Disposable database evidence and recovery

The old `qsaudi_u09_rb1_dev` is owned by `qsa_migrator`, reachable only at `127.0.0.1:55439`, with server `listen_addresses=127.0.0.1` and data directory `C:/Users/Hp/.codex/visualizations/2026/11/08/01a1b891-a0d4-7c83-b3e6-df3fcdfcbe2e/pgdata`. Companies, users, projects, trips and governance receipts were all empty; there was no business data. The execution environment initially contained no database credential variables. Recovery scripts explicitly supply localhost passwordless test identities (`postgres`, `qsa_migrator`, `qsa_runtime`, `qsa_auth`) and `QSA_TEST_DATABASE_ISOLATED=1`; no production endpoint or credential is used.

The old database remains untouched as evidence. Following `u09NativeFixture`'s approved `CREATE DATABASE ... OWNER qsa_migrator` and `applyMigrations` procedure, a separately named disposable replacement `qsaudi_u09_rb1_recovery_20261110` was created from the unchanged candidate chain 001–012. All 12 applied, verification returned allValid=true/appliedCount=12/pendingCount=0, and repeat application verified all 12 with zero reapplied. Every focused fixture independently creates another clean database and applies the same chain. No stored checksum was manually changed for recovery. Published 001–011 are byte-identical to starting HEAD; staged 012 must retain LF and the candidate checksum above.

Catalog evidence verifies all six governance tables have enabled and forced RLS; immutable receipt/history/access-event triggers, actor-scoped receipt/history policies and the expected status/foreign-key constraints exist. All 19 governance functions are owned by the narrow `qsa_governance_authorizer`; PUBLIC execution is revoked. Non-trigger entry points grant execution to `qsa_runtime`. The authorizer is NOLOGIN, non-superuser, non-bypass, non-createdb, non-createrole and non-replication; direct service identities remain separated. Preflight is SECURITY DEFINER with `search_path=pg_catalog,pg_temp`, with only owner/runtime execute grants.

### Three unfinished test failures and corrective evidence

- Driver linking used an invalid synthetic DRIVER profile field, `nameAr`. Only the new RB1 fixture was corrected to `fullNameAr`; canonical validation was retained.
- Revocation while awaiting the company lock is deliberately concealed by project preflight as PostgreSQL `42501/PROJECT_NOT_FOUND`, mapped by the service to 404 and preserved by HTTP. The new RB1 case now checks this exact canonical project denial and no-effects behavior. It does not require the company-inventory error `NO_ACTIVE_COMPANY_ROLE` for a project-scoped request. Company inventory retains its own 403 denial.
- Cleanup attempted to restore a VIEWER row after changing the subject to PROJECT_ADMIN, leaving its actual role revoked and contaminating the next inventory case. The new case restores the actual role in finally, then uses governance commands to return to VIEWER with no project assignments. Additional checks prove global identity stays ACTIVE and unrelated-company inventory remains authorized after tenant revocation/suspension.
- Actual HTTP suspended foundation mutation returns `409 {error:{code:PROJECT_LIFECYCLE_MUTATION_DENIED}}` with no receipt/business effects. PRELOADED_ROSTER setup can enter review/approval with verified foundation/configuration/memberships, while activation rejects a missing coherent path. No production authority change was needed during recovery.

### Final governance capability matrix

| Capability | RB1 source result | Remaining integration |
|---|---|---|
| Explicit registration and own account/profile/status | Implemented SQL authority; trusted identity, tenant application, private notices | RB2 account gate/UI wiring |
| Company account administration and role/project/driver assignment | Implemented current-authority commands, revision fencing, tenant suspension, protected self/last owner | RB2 admin UI |
| Project creation/foundation/lifecycle/configuration | Implemented server allocation and validated current-policy commands | RB2 navigation/context/UI |
| Setup, activation and reactivation readiness | Implemented distinct SQL evidence with bounded operational/pricing-path proof | RB2 consumer integration |
| Bounded company/account/project inventory | Implemented typed allowlisted DTOs and authenticated revision/epoch cursors | RB2 React consumer integration |
| Immutable receipts/history/permission evidence | Implemented encrypted receipts/history, append-only evidence and outbox/audit | Production export/equivalence proof remains RB3 |
| Runtime reconciliation | Governance business categories and private counter frame included | Independent real source/provider/export mapping remains RB3 |
| Workspace delivery and bound configuration impact | Explicitly blocked when full SQL adapter proof is absent | RB4 binding/grant/journal adapter |

Overall AR2-U09 remains BLOCKED. Production root remains Firestore and SQL-selected React root retains its stop boundary. No company/owner bootstrap, production provider, activation or source migration is claimed.


## Final recovery verification — 2026-11-10

Classification: **AR2_U09_RB1_SOURCE_IMPLEMENTED_READY_FOR_REVIEW**. This is bounded source readiness with the existing historical debt explicitly retained; overall AR2-U09 remains **BLOCKED**, and PRODUCTION_CUTOVER_AUTHORIZED=false.

| Gate | Actual result |
|---|---|
| RB1 native PostgreSQL and real HTTP | 29/29 PASS, including the strengthened suspension/revocation/other-company checks; final suite and teardown pass |
| Historical U01–U09 native/model SQL selection | 450/451 in the full run; the sole failure was the unchanged 30s backup/restore timeout. Independent final infrastructure rerun passes all 13/13, including backup/restore. All 451 distinct cases are covered by passing final measurements; no single 451/451 rerun is claimed. |
| Independent authority bundle | 148/148 PASS |
| U07 | 53/53 PASS on a fresh disposable database, real browser/IndexedDB plus PG17 |
| U08 | 29/29 PASS (authority 19, transport 10) |
| U09 journal browser | 6/6 PASS; combined integration run 88/88, zero skipped |
| Matched 135-file history, clean exact starting-HEAD baseline | 2,399 pass / 95 fail of 2,494; 12 suite-load errors and 2 unhandled errors retained; NOT PASS |
| Same 135-file candidate history | 2,401 pass / 93 fail of 2,494; identical 12 suite-load-error identities and 2 unhandled errors; NOT PASS |
| Exact failed-assertion identity comparison | Candidate-minus-baseline empty: NEW_FAILURES=0. Two baseline-only cases are 5s Workspace inspection/provider timeouts, not claimed functional repairs. |
| Source-digest timing recheck | `workspaceLocalBlueprint.test.ts` 8/8 PASS independently. Its deterministic-digest case timed out at the unchanged 5s limit in both loaded historical runs. The older saved 92-failure baseline plus this timing case accounts for the candidate's 93 raw failures. |
| TypeScript | Fresh baseline and final candidate both 446 diagnostics, exact diagnostic lines identical, added=0/removed=0; lint exits 2 / NOT PASS |
| Build | PASS, with existing chunk-size warnings |
| Diff / published migration integrity | Whitespace checks PASS; 001–011 unchanged; only 012 is added to the six historical inventory assertions |

The two baseline-only failure identities are:
- `workspaceBoundedWorkbookInspection.test.ts`: `large legacy workbook actual initialization without whole-grid materialization repairs the same 24-tab workbook, preserves legacy Dashboard and Script identity, and is idempotent` (5s timeout).
- `workspaceProviderResilience.test.ts`: `one accepted OAuth grant survives initialize/retry cycles, actual Ops migration, workbook repair and Script package installation` (5s timeout).

The identical twelve suite-load failures remain `conflictEngine.test.ts`, `conflictResolution.test.ts`, `googleDriveImport.test.ts`, `googleSheetsImport.test.ts`, `pricingEngine.test.ts`, `reportsEngine.test.ts`, `reportsEngineControlCleanup.test.ts`, `reportsEngineConvergence.test.ts`, `tripIdentityAdjustmentBlock89.test.ts`, `weighbridgeImport.test.ts`, `workspaceConvergence.test.ts`, `workspaceIntegration.test.ts`. Other existing failure identities remain those in the original U09 historical record; none were deleted, skipped or rewritten. The two unhandled errors remain from `projectContextLifetime.test.tsx`. Historical failures and compiler debt are unresolved, not reported green.

### Verification environment corrections and retained failures

Initial concurrent runs hit the unchanged backup deadline, three browser-process restart deadlines, browser teardown deadline and focused database-drop teardown deadline. A read-only PostgreSQL activity inspection observed `DROP DATABASE ... WITH (FORCE)` waiting on `CheckpointDone`. A checkpoint of this isolated localhost instance completed in 2.0s; with the SQL/compiler/history workload finished, focused RB1 passed 29/29, backup passed 13/13, and the fresh combined browser run passed 88/88 without timeout relaxation. PostgreSQL tools use their original ASCII-only path; the Unicode project-path attempt emitted invalid-tool-path diagnostics. An intervening browser retry reused the database after U07's deliberate forward-only epoch test, correctly failed setup with BACKEND_EPOCH_MISMATCH and skipped 53 cases; that invalid measurement was rejected, preserved separately and replaced by the complete 88/88 fresh-database run. No epoch was reset. No tests or hooks were weakened to address environment contention.

The clean baseline export was compared byte-for-byte to starting HEAD, including the selected 135 tests, changed tracked files and published migrations; no differences or fixture overlays were present. Local raw recovery evidence resides in `C:/Users/Hp/Documents/ChatGPT/Work Follow/recovery-*.json` and `.log`, including original loaded/epoch-retry results, schema catalogs, exact function differences, reconstructed original 012, comparison helpers and final reports. This is local verification, not remote Linux CI or live provider acceptance.

### Final changed-file inventory (23)

- `.github/workflows/ci-foundation.yml`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md`
- `docs/reconstruction/17_AR2_U09_RB1_SQL_GOVERNANCE_AUTHORITY.md`
- `server/sqlGovernanceRoutes.ts`
- `server/sqlRuntimeRoutes.ts`
- `src/db/governanceAuthority.ts`
- `src/db/governanceReadiness.ts`
- `src/db/migrations/012_project_account_governance.sql`
- `src/db/runtimeInventory.ts`
- `src/db/runtimeReadinessAuthority.ts`
- `src/services/projectGovernanceContract.ts`
- `src/services/sqlGovernanceClient.service.ts`
- `src/tests/ar2U01SecurityGate.test.ts`
- `src/tests/ar2U02CanonicalIdentityMemberships.test.ts`
- `src/tests/ar2U03TemporalAuthority.test.ts`
- `src/tests/ar2U04BoundedReads.test.ts`
- `src/tests/ar2U05DurableImport.test.ts`
- `src/tests/ar2U06Rb1Security.test.ts`
- `src/tests/ar2U09MigrationReadiness.test.ts`
- `src/tests/ar2U09Rb1Governance.test.ts`
- `src/types/sqlGovernance.ts`

The U09 readiness test's pre-existing metadata-only loop change iterates the entire expanded business inventory; assertions still require VERIFIED and unchanged production-authorization denial. No existing assertion outside the explicitly approved six 012 migration-inventory additions was changed. New RB1 assertions/fixtures were corrected and strengthened as described above.

### Publication boundary

Publication is restricted to the existing U09 branch; final commit/remote SHAs and clean-worktree status are reported by the recovery chat after push verification. No PR, merge, deploy, production SQL activation, production data migration, production provider installation or new company provisioning is authorized or performed. Remaining blockers are RB2 navigation/account/Smart Import UI integration, RB3 real immutable source/provider/export equivalence, RB4 SQL Workspace binding/grant/journal delivery, and existing historical/compiler/live acceptance debt.


### Checkpoint checksum transcription correction

The pasted recovery checkpoint and earlier chat report contained a 65-character candidate checksum (`...739eaeefe...`), which cannot be a SHA-256 digest. Direct hashing throughout recovery, the fresh database record and staged bytes agree on the actual unchanged 64-character SHA-256 `9001bd9fe208f74f693c94850948ce4556dbfa904c12ac739eaefe1482cbf4ce` (`...739eaefe...`). This corrects a transcription error only; migration source and database checksum were not edited.
