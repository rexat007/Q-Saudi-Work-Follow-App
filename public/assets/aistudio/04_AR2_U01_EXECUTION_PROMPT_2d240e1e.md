# Q-SAUDI WORK FOLLOW — PHASE 2 / AR2-U01
## Binding owner-approved implementation task

MODE: BOUNDED IN-PLACE IMPLEMENTATION + REAL POSTGRESQL VERIFICATION

Repository: https://github.com/rexat007/Q-Saudi-Work-Follow-App
Authoritative starting main SHA: `cf7ac517be93492125c6dabad0ea38f291da7ed3`
Architectural authority: owner-approved `ARCH-R1 / REVISION 1.2` and `ADR-001`.

THE OWNER APPROVED THE DESIGN ON 2026-11-07. DO NOT REDESIGN OR ASK GOOGLE AI STUDIO TO MAKE DATABASE CHOICES.

NO PRODUCTION DB MIGRATION, NO DEPLOY, NO PUSH, NO PR, NO MERGE.

### Step 0 — Source integrity and source limitations

- Before edits inspect all files visible in the existing Google AI Studio workspace, including possible uncommitted changes.
- Google AI Studio must not be assumed to be a Git clone or able to resolve repository paths from GitHub context. Use **direct raw internet URLs** pinned to this commit whenever fetching source. Format:
  `https://raw.githubusercontent.com/rexat007/Q-Saudi-Work-Follow-App/cf7ac517be93492125c6dabad0ea38f291da7ed3/<relative-path>`
- Read, at minimum, the architecture/governance documents on `docs/reconstruction/`, `package.json`, `src/firebase/admin.ts`, `src/services/projectCommands.server.ts`, `src/services/projectFleetQuery.server.ts`, `src/services/globalIdentityAuthority.server.ts`, `src/services/projectParticipationAuthority.server.ts`, `src/services/temporalRelationshipAuthority.server.ts`, `src/services/importSession.server.ts`, `src/services/import/rosterExecution.server.ts`, `src/services/tripCommands.server.ts`, `src/types/`, `server/app.ts`, and the relevant auth middleware.
- Confirm each existing file against its GitHub blob and record source hashes. Never invent unavailable files or claim source verification based on names.
- Read the owner-approved design files supplied in the approval package exactly; treat their content as fixed contracts. All `PENDING` notes in original copies are superseded **only in approval status** by `00_OWNER_APPROVAL_RECORD.md`.
- If Studio's workspace cannot be reconciled to this pinned baseline, stop with a source-integrity report. No speculative code changes.

### AR2-U01 permitted scope

Implement directly in this repository:

1. Versioned SQL migration infrastructure for PostgreSQL 17, with migration order, checksums, exclusive migration lock, and reproducible apply/verify commands. Use `pg` parameterized queries and explicit pool ownership.
2. Canonical PostgreSQL schema as specified by Sections 7 and 17 of ARCH-R1.2, including required extensions, constraint and index definitions, company/project scope, canonical identity and membership tables, temporal history, command and receipt ledgers, Workspace linkage, and outbox structure. Do not silently change a required contract. If a schema detail is not implementable, stop with explicit conflict and proposed bounded design amendment; do not substitute a design independently.
3. Database roles and RLS policies: runtime role is **not** the schema owner, has no BYPASSRLS, and all project-scoped queries are fenced by company and project. Use transaction-local authenticated context, never connection-persistent context leaking across pooled requests. Test cross-tenant denial and pooled context reset against actual PostgreSQL.
4. SQL `unit-of-work` and request authentication adapter. Preserve Firebase Authentication token verification as identity provider; canonical commercial roles and project membership are eventually PostgreSQL authorities. Keep existing Firestore business routes unchanged during U01.
5. A **read-only** source mapping/inventory framework for Firestore paths to PostgreSQL tables and immutable legacy identifiers. No production export or migration of records; no credential sharing, real identifiers in committed fixtures, or dumping production data to repo.
6. Local/CI test wiring for a real PostgreSQL database and role-scoped connection. Include migration up/verify, FK/UNIQUE/EXCLUDE, tenant/project isolation, read/write transaction rollback, connection reuse, and backup/restore rehearsal. Fail closed when no real PostgreSQL available; do not substitute mock-only PASS.
7. Minimal documentation reconciliation for AR2-U01 only, noting the approved design and no production cutover.

Permitted change families: migration SQL and migration runner, a narrowly scoped SQL infrastructure directory, exact lockfile/package/CI changes required to install `pg` and run a test DB, focused tests and the minimum governance documentation. At preflight, enumerate **exact target file names** before editing. Do not make opportunistic modifications to Foundation UI, Smart Import, Trip production logic, Google integrations, nor historical type contracts beyond U01 necessities.

### Invariants

- No new application, repository, second frontend, or proof-of-concept system.
- No Firestore/PostgreSQL dual-write or production feature flag enabling SQL prematurely.
- Do not delete Firestore collections, Firebase accounts, old Beta2 projects, or Google resources.
- Do not change existing `projectId`, Driver/Truck/Carrier/Material external IDs, pricing snapshots or receipt identity semantics.
- No bypass of authorization, transaction atomicity or audit trails.
- No cache-based assertions of cost savings. U01 is not a Foundation performance closure.
- Scripts must be safe: no destructive reset of production DB; migration rollback via documented backup/recovery, not automatically dropping real tables.
- Limit the migration schema to approved definition, with explicit nullable/enum/ID mapping rationale as specified; use data-preserving updates only.

### Tests and verification

Run executable tests on actual PostgreSQL 17 (or report environment blocked). Record version, command and test result. Test migrations idempotent and locked, schema and constraints, RLS, concurrent identity uniqueness, temporal overlap protection, rollback semantics, connection pool isolation, and backup/restore procedure.

Also run focused affected existing Vitest suites, TypeScript, build, and diff/scope checks. Classify all baseline-known failures vs newly introduced failures with evidence. Never claim all tests pass if any failed or were not run.

### Final report — STOP WITHOUT PUSH

- SOURCE_PIN / SOURCE_INTEGRITY
- APPROVED_DESIGN_HASHES
- EXACT_CHANGED_FILES and each file's purpose
- SCHEMA_AND_MIGRATION_MANIFEST
- ROLE_RLS_AUTH_BOUNDARIES
- UNIT_OF_WORK_DESIGN
- FIRESTORE_READONLY_MAPPING
- POSTGRESQL_REAL_TEST_RESULTS with exact commands and pass counts
- BASELINE_VS_FINAL_REGRESSIONS
- TYPECHECK / BUILD
- MIGRATION_RESTORE_TEST
- UNEXPECTED_STUDIO_SYNC_FILES
- PENDING_IMPLEMENTATION_GAPS
- PUBLISHING_STATUS = NOT_AUTHORIZED

Return either `AR2_U01_IMPLEMENTED_PENDING_OWNER_REVIEW` or `AR2_U01_BLOCKED_WITH_EVIDENCE`.

DO NOT PUSH, CREATE A PR, MERGE, DEPLOY, OR START AR2-U02.
