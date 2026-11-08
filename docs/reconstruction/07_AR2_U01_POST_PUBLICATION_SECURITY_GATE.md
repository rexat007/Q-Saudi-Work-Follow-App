# AR2-U01-SG1 — PostgreSQL security gate

Execution date: 2026-11-08 (Asia/Riyadh). This record supplements the published
AR2-U01 implementation record; it does not rewrite its history.

## Source and scope

- Repository: `rexat007/Q-Saudi-Work-Follow-App`.
- Starting main: `5f82f43ee1a6002729f0d300fa7cf27f177bacfa`, independently matched
  against GitHub's main ref before cloning. The fresh clone was clean before edits.
- Branch: `reconstruction/ar2-u01-post-publication-security-gate`.
- Authority: the published ARCH-R1 / Revision 1.2, ADR-001, owner approval record,
  and the owner's explicit SG1 corrective-unit/push instruction.
- The initially supplied workspace was empty. A different, older local repository
  (`Q-Saudi-Work-Follow`, without the `-App` suffix) contained an untracked lockfile;
  it was left untouched. The requested repository was cloned into this workspace.
- No production database access, production data migration, Firestore operational
  changes, API route changes, dependency upgrades, PR, merge or deployment.
- AR2-U02 remains unstarted. A detached baseline checkout was used only to compare
  tests/build/typecheck, sharing the same installed dependencies.

## Verified findings and corrections

### A — Excessive privileges and missing isolation

Published `002` gave both service roles blanket SELECT/INSERT/UPDATE/DELETE on
every public table, including migration history, global users, commercial role
assignments, audit history and worker state. Its tenant policy list omitted
`user_company_roles`, `audit_events` and `worker_jobs`.

New migration `003_runtime_authority_hardening.sql` revokes blanket table/sequence
privileges and public schema creation, and uses this explicit U01 privilege set:

| Identity | Allowed access |
| --- | --- |
| `qsa_runtime` | SELECT projects; SELECT/INSERT/UPDATE idempotency receipts; SELECT/INSERT outbox events; INSERT audit events and pending worker jobs |
| `qsa_worker` | SELECT worker jobs, outbox events and workspace bindings; UPDATE only lease/delivery columns on worker jobs; SELECT/INSERT workspace sync receipts |
| `qsa_auth` | SELECT only the adapter's lookup columns in users, companies, company roles, project access and projects |
| `qsa_migrator` | Dedicated database/schema owner for ordered migrations; never a runtime or authentication credential |

All three omitted company tables now have ENABLE/FORCE RLS and company checks.
Runtime audit inserts additionally require the transaction actor and a project
within the company. Queue inserts require PENDING/zero-attempt/unleased state and
an outbox event belonging to the same company. Runtime cannot read or manage the
worker queue, alter audit history, grant roles or inspect migration history.
Worker access remains subject to company RLS; there is no global worker bypass.
Future units must add their specific domain privileges in new migrations.

Existing service-role memberships are revoked. Unsafe privileged service-role
attributes cause migration failure requiring DBA reconciliation, rather than
silently retaining privilege or requiring superuser execution.

### B — Unsafe pool release after cleanup failure

Published `withUnitOfWork` swallowed RESET ROLE/DISCARD TEMP errors and called
normal `release()`. A failed rollback was also followed by normal release.

The boundary now uses `SET LOCAL ROLE qsa_runtime`, transaction-local tenant,
actor and project settings, and `DISCARD ALL` outside the completed transaction.
A failed rollback, socket error or discard marks the connection for destruction
through `release(true)`. A temporary checked-out-client error listener handles
socket errors that are emitted separately from query rejection. The generic
pool-owned transaction helper follows the same cleanup rule. Caller-owned clients
remain the caller's lifecycle responsibility.

The original operation error is preserved. A committed operation whose cleanup
fails retains its committed result, but its connection is destroyed; callers must
not retry a committed mutation merely because pool cleanup failed.

### C — Runtime/authentication/migration credential conflation

Published code defaulted to `postgres`, used one pool for migrations and runtime,
and made unscoped authentication queries on that pool. `SET ROLE qsa_runtime`
worked in the original tests because they used a superuser connection; there was
no working production credential boundary demonstrated.

Runtime now defaults to `qsa_runtime`. Authentication and migration pools require
their own URL variables and never fall back to runtime credentials. Runtime and
authentication entry points verify their actual session identity, reject privileged
attributes, public object ownership and role memberships, and fail before domain
work when given an owner/superuser credential. Supported production logins are
direct `qsa_runtime` and direct `qsa_auth`; no privileged login plus SET ROLE is
needed. A login can select its own role with SET LOCAL ROLE.

Authentication retains the verified Firebase UID input and resolves commercial
authority from SQL. A requested company is matched to an active SQL role, including
valid_from/valid_to. Client-supplied company/role token claims are not commercial
authority. The adapter's token argument is an internal contract: callers must
first verify the Firebase ID token with Firebase Admin, as the existing server
authentication boundary does. No new public endpoint accepts a decoded token or
raw RequestContext from the client. Project authorization remains required above
company RLS, as specified by the approved architecture.

`qsa_auth` is a trusted server-only, read-only cross-company lookup identity. Its
SELECT policies on the three tenant lookup tables intentionally allow resolving
membership before a company context exists. Its credential must never be exposed
to a browser or used for domain SQL. Runtime cannot switch to it or gain its policy.

## Provisioning and migration execution

For a fresh isolated database, a DBA provisions the database and dedicated owner:

```sql
CREATE ROLE qsa_migrator LOGIN NOSUPERUSER NOCREATEDB CREATEROLE NOBYPASSRLS;
CREATE DATABASE qsaudi_test OWNER qsa_migrator;
```

Run `npm run db:migrate` with `MIGRATION_DATABASE_URL` for that owner. `001`/`002`
create the canonical schema and original roles; `003` creates `qsa_auth` and
corrects privileges. The migrator needs CREATEROLE for this role-management unit;
it is not a superuser or BYPASSRLS identity. PostgreSQL 17 permits its own newly
created roles to be administered by this migration login.

For an existing installation, the DBA must first verify canonical object ownership
and the migration login's ability to administer the existing service-role grants.
If the original migrations ran as another owner, reconcile ownership/admin rights
explicitly before applying `003`. Do not use an application superuser fallback.
Do not reassign unrelated objects, rewrite recorded checksums or reapply `002`.
This unit did not inspect or change actual production credentials or ownership.

Assign distinct strong passwords through the deployment secret manager/DBA channel
and configure:

- `DATABASE_URL`: direct `qsa_runtime`, runtime database only.
- `AUTH_DATABASE_URL`: direct `qsa_auth`, same canonical database, server only.
- `MIGRATION_DATABASE_URL`: direct dedicated owner, available only to the separate
  migration process; remove it from runtime process environments.
- A future worker process uses direct `qsa_worker` with explicit transaction-local
  company context. A global scheduling/dispatch mechanism is outside this unit.

No passwords or deployment URLs are stored in this repository. Missing separate
credential configuration fails closed. The isolated rehearsal used loopback-only
test authentication, not a suggested production authentication configuration.

Migrations `001` and `002` are unchanged Git blobs. `.gitattributes` fixes SQL
checkout line endings to LF so SHA-256 checksums are portable. Existing installations
with differently checksummed bytes must stop for reconciliation; this code never
normalizes or rewrites their recorded history.

| Migration | SHA-256 of published/canonical LF bytes |
| --- | --- |
| 001 | `5b71fd77b8850edc26b20472a861dda4e53b1aef57770aa7e76117275e7367b2` |
| 002 | `0704b0d0fb591dd9512415714aa7deaf9f9ca1040cf95c03e0fcceff87a23c3d` |
| 003 | `61f0f312104d36eafea3fb98e212212c0464e9927057df227e3bb936d45f6c4b` |

The runner keeps advisory locking, transactional application and recorded
checksums, validates the whole applied history before pending SQL, rejects missing
applied files and ambiguous/gapped migration numbering, and evicts connections
when lock cleanup fails. Repeated application verified all three and applied none.
There is no destructive down migration: recover an interrupted migration through
transaction rollback; a committed rollout requires a separately reviewed forward
correction or restoration of an approved backup, preserving migration history.

## Verification evidence

Host: Windows x64; isolated Node 22.22.0/npm 10.9.8; real PostgreSQL 17.6 native
server, bound to 127.0.0.1 on an isolated port; synthetic fixtures only. Database
created for this task, migrations executed as non-superuser `qsa_migrator`, runtime
queries as non-owner/non-superuser `qsa_runtime`, auth as `qsa_auth`, worker as
`qsa_worker`. No simulated database was substituted for the PostgreSQL engine.

The repository lock/manifest were unchanged. The Windows optional native packages
for the installed Rollup 4.64.0, Lightning CSS 1.32.0 and Tailwind Oxide 4.3.3 were
supplied locally because the published dependency tree omitted them. No versions
were upgraded. Tools, binaries, logs, JSON reports and temporary schemas/dumps were
kept outside tracked source; generated build directories remain ignored.

Run the database suites serially because checksum-tamper fixtures temporarily alter
the isolated migration ledger:

```text
QSA_TEST_DATABASE_ISOLATED=1
TEST_DATABASE_URL=<isolated fixture/backup administrator URL>
DATABASE_URL=<isolated direct qsa_runtime URL>
AUTH_DATABASE_URL=<isolated direct qsa_auth URL>
MIGRATION_DATABASE_URL=<isolated dedicated migration owner URL>
PG_BIN_DIR=<optional PostgreSQL 17 client executable directory>
npx vitest run src/tests/ar2U01PostgresInfrastructure.test.ts src/tests/ar2U01SecurityGate.test.ts src/tests/ar2U01ConnectionCleanup.test.ts src/tests/serverAuthenticationTrustBoundary.test.ts --no-file-parallelism
```

- Original PostgreSQL infrastructure suite: **13/13 passed**, including real
  pg_dump/psql schema backup and restore with ON_ERROR_STOP and table-count parity.
  Fixture/admin, runtime and auth credentials are now distinct; Linux-only backup
  paths/shell invocation were replaced by unique temporary files and execFileSync.
- New security suite: **36/36 passed** against the real PostgreSQL fixture. It
  includes one local migration-filename validation check. Database checks cover
  absent context, cross-company SELECT/INSERT/UPDATE, sensitive global/worker ACLs,
  append-only audit, forged queue state/event linkage, all service identities,
  denied escalation/DDL/migrations, authorized atomic staging, auth validity and
  company selection, worker lease limits, same-physical-connection reuse, actual
  backend termination/eviction, idempotence, checksum tampering and missing history.
- Separate fault/configuration unit suite: **6/6 passed**. Four tests inject cleanup
  failures or validate release decisions; two validate credential configuration.
  These are unit tests, not claimed as real PostgreSQL execution.
- Existing Firebase/server authentication trust-boundary suite: **28/28 passed**.
  Its mocked service failures are existing authority regressions, not PostgreSQL
  engine tests. Combined focused run: **83/83 passed**, no unhandled errors.
- Required four-file authority bundle: **148/148 passed**, executed explicitly:
  `reviewedRosterCommitP8B2.test.ts` **50/50**,
  `rosterExecutionRecoveryP8B3.test.ts` **30/30**,
  `temporalRelationshipAuthority.test.ts` **61/61**,
  `txReadCacheCorrectness.test.ts` **7/7**. This is the prior U01 bundle identified
  by the owner during execution, additional to the following broader checks.
- Additional canonical authority regression selection: all **19** Vitest files extracted from
  `package.json`'s `verify:beta2`, **442 passed / 1 failed / 443 total**. Including
  the additional 28 authentication cases gives **470 passed / 1 baseline failure**.
- The extra failure is test 51 in
  `projectDriverTruckAssignmentFoundation.test.ts`: its `/tests/` path exclusion
  fails on Windows backslashes and mistakes four unchanged test files for production
  callers. The identical test fails on the untouched pinned main checkout:
  **23 passed / 1 failed**. No authority implementation failure or suppression.
- Canonical `npm run lint`: **exit 2**, **446 TypeScript diagnostics** on both pinned
  main and this branch. Diagnostic lines compare identically; **zero added errors**,
  including no diagnostics in the changed SQL infrastructure or SG1 tests.
- Canonical `npm run build`: **exit 0 on both baseline and branch**. Vite, Workbox
  generateSW and server esbuild complete. Chunk-size warnings remain. The previously
  mentioned Workbox build failure was **not reproduced** with the canonical toolchain.
- `git diff --check`: passes. No changes to `001`, `002`, package manifest/lock,
  production Firestore services, domain contracts or API routes.

## Exact implementation files and remaining limits

```text
.gitattributes
docs/reconstruction/07_AR2_U01_POST_PUBLICATION_SECURITY_GATE.md
src/db/authAdapter.ts
src/db/migrator.ts
src/db/migrations/003_runtime_authority_hardening.sql
src/db/pool.ts
src/db/unitOfWork.ts
src/tests/ar2U01ConnectionCleanup.test.ts
src/tests/ar2U01PostgresInfrastructure.test.ts
src/tests/ar2U01SecurityGate.test.ts
```

Remaining debt: the 446 identical baseline TypeScript diagnostics, the reproduced
Windows-only authority-test path issue, build chunk-size warnings, and deployment
secret/ownership provisioning before any future approved activation. These are not
hidden by test suppression or unrelated build changes. Production ownership and
credentials remain unverified because no production environment was supplied or
changed. All required 13 PostgreSQL and 148 authority cases passed; the broader
authority manifest and its separately reproduced baseline failure remain reported.

Security-gate classification: `AR2_U01_SG1_READY_FOR_INDEPENDENT_REVIEW`.

Final Git commit SHA, clean-worktree check and feature-branch remote SHA are reported
in the execution handoff, after this record is committed. No PR/merge/deploy or U02.
