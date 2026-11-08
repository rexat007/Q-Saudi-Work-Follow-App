# AR2-U02 — Canonical identity and project membership SQL convergence

Date: 2026-11-08 (Asia/Riyadh).
Status: `AR2_U02_READY_FOR_INDEPENDENT_REVIEW`, not closed or owner-merged.
Baseline: `661f275fb80794e2a07d2d8fe2bbec86f83af133`; PR #90 / migration 003 verified.
Branch: `reconstruction/ar2-u02-canonical-identity-memberships`.
Authority: approved ARCH-R1 / Revision 1.2, sections 7, 17, 19, 20, 22 and the
owner's explicit U02 execution request. Preflight worktree was clean. No AGENTS.md.

## Contract-equivalence matrix recorded before implementation

| Existing source contract | SQL gap | Bounded U02 reconciliation |
| --- | --- | --- |
| globalIdentityPolicy: driver/carrier ACTIVE, SUSPENDED, INACTIVE | CHECK omits SUSPENDED | Expand CHECK; preserve meaning; only ACTIVE eligible |
| truck ACTIVE, MAINTENANCE, INACTIVE | CHECK omits MAINTENANCE | Expand CHECK without collapsing states |
| material ACTIVE/INACTIVE | Equivalent | Reuse eligibility policy |
| projectParticipationAuthority: ACTIVE/SUSPENDED/REMOVED; explicit transitions | Membership CHECK ACTIVE/INACTIVE | Support all three; preserve existing INACTIVE rows as unresolved legacy state, reject their commands until explicit reconciliation |
| normalizeNaturalKey + normalization | SQL keys incomplete (carrier lacks unique key; lookup targets not relationally checked) | Reuse normalizers; company/kind keyed HMAC; unique constraints and atomic reservations; verify lookup target against canonical row |
| One global identity, many project memberships | Existing composite FKs/unique memberships | Preserve; resolve opaque external IDs to internal UUIDs |
| Opaque IDs, historical source paths | Global columns exist; memberships lack mapping | Explicit validated mappings; no PII-derived IDs; no automatic production backfill |
| Global entity profiles and optional fields | SQL columns incomplete | Versioned encrypted canonical profile preserving supported fields; no plaintext driver ID/phone lookup, no reversible lookup tokens |
| Actor/account/project authorization from current server authority | Auth lookup precedes domain transaction | Verify Firebase token server-side; SQL recheck and lock actor/company/role/project/access within the same domain transaction |
| SUPER_ADMIN or assigned PROJECT_ADMIN; SQL COMPANY_ADMIN is company-scoped admin | Browser role cannot grant authority | SQL-owned roles only; always verify project company even for administrators |
| Project lifecycle mutation classes | Foundation policy is pure | Reuse NEW_OPERATION vs CONSISTENCY_CLEANUP decisions |
| Revisions, stamps, status reasons | Missing global revisions, membership update stamps/history | Add revisions/provenance and append-only status history with effective periods; optimistic conflict detection |
| Membership reduction with active dependent relations | Temporal write consequences belong to U03 | Fail closed with DEPENDENT_RELATIONSHIPS_ACTIVE; never close/rewrite affiliations, assignments or allocations |
| Audited commands, repeated/lost responses | Existing receipt stores only result_ref | Persist protected command result; serialize operation and project scope; atomic domain/history/audit/receipt/outbox/job |
| Global status governance | Source requires global administrator | SQL company administrator/SUPER_ADMIN only, current SQL role, optimistic revision |
| 003 narrow runtime rights | No identity/membership mutations permitted yet | New 004 explicit table/column grants, RLS on all added scope tables; no blanket grants |

Legacy INACTIVE is deliberately not guessed to mean SUSPENDED or REMOVED. The
architecture's abbreviated ACTIVE/INACTIVE membership catalog is reconciled by
the owner's explicit three-state business-contract requirement, without deleting
or rewriting old records. No binding business contract is silently changed.

Production Firestore remains authoritative. No API route activation, dual write,
data migration, synchronous Google operation, PR, merge, deployment or U03 work.

## Implemented SQL authority and compatibility

`src/db/canonicalAuthority.ts` exports `SqlCanonicalAuthority`. It is an internal
server module, not an activated endpoint. The entry points are `create`, `resolve`,
`resolveLegacy`, `setStatus`, `membership` and `operationalIdentity`.
Commands accept a Firebase ID token, a company/project selector and command data;
they never accept a commercial role or an authenticated actor ID from the caller.
The default verifier uses the existing Firebase Admin initialization and
`verifyIdToken(token, true)`. Injected verification/pools are server composition and
test seams, not browser-controlled options. Tests use a synthetic Firebase verifier
but actual PostgreSQL for all SQL authorization and persistence.

The published SQL auth adapter resolves the verified Firebase UID to a SQL user.
Inside the domain transaction, the service resolves a project external ID or UUID
within that company, acquires the project command lock, and calls the new fixed
authorization capability. The database checks/locks the active account, active
company, unexpired company role, project company and current project access.
Company-scoped SUPER_ADMIN/COMPANY_ADMIN may govern that company's identities;
PROJECT_ADMIN needs an active PROJECT_ADMIN access row and cannot perform global
status governance. A company administrator never bypasses the project's company.
Readers above operational workflows still need their own appropriate authorization
boundary; the exposed U02 service is the canonical foundation/admin boundary, not
a new general-purpose operational API.

`CanonicalIdentityRepository` provides the transaction-bound identity persistence
for all four kinds. SQL table/column identifiers come from the closed kind catalog;
request values use parameters. The existing `normalizeNaturalKey`, Arabic/phone
normalizers and global eligibility policy remain authoritative. No reversible V2
Firestore natural-key token is copied into a SQL lookup.

New internal UUIDs are independent of natural keys. New external IDs retain the
current cryptographic `DRV/TRK/CAR/MAT-<opaque hex>` convention. An explicitly
retained external ID is supported, checked for collision/ambiguity and never derived
from a residency/registration number. Authorized resolution returns the established
kind-specific external ID field and profile fields, plus internal UUID metadata,
`revision` and the compatible `version` alias. Dates serialize as ISO timestamps.
Membership results expose the original project external ID and entity external ID,
with internal project/membership IDs separately identified. No existing API route or
client entity contract was replaced.

Explicit source mappings use real canonical roots (`drivers/{id}`, etc.), validated
kind/legacy ID/path, encrypted source metadata and company/kind HMAC lookup keys.
Several legacy aliases can resolve to the same global identity; a source alias
cannot be silently retargeted. Existing old mapping columns are preserved. New
SQL-native records do not fabricate legacy Firestore provenance. Membership legacy
columns are available for a later authorized backfill, not populated with invented
source paths. The older read-only U01 mapping inventory is not a migration engine.

Missing HMAC/encryption provenance or an incompatible key version causes
`IDENTITY_RECONCILIATION_REQUIRED` before creating or naturally resolving identities
of that kind/company. An unresolved old row cannot silently be ignored to create
a duplicate under another key. Lookup status, target, canonical HMAC, encrypted
profile and existing normalized columns must agree. Ambiguous IDs, duplicate
external IDs, invalid normalized keys and corrupt mappings fail closed. No historical
duplicates are automatically merged.

## Lifecycle, revision and temporal limits

The pure membership state decision was extracted into
`src/utils/projectMembershipPolicy.ts` and reused by both the existing Firestore
planner and new SQL service. The existing planner retains its transport-specific
validation, provenance and consequence behavior. Its 96 existing tests pass.

- ENROLL creates ACTIVE, or is a strict no-op for an already ACTIVE membership.
  ENROLL against SUSPENDED/REMOVED requires explicit REACTIVATE instead.
- SUSPEND requires an existing ACTIVE membership; an already SUSPENDED membership
  is a no-op; SUSPEND from REMOVED is invalid.
- REMOVE requires an existing membership and preserves the record/history; repeated
  REMOVE is a no-op. SUSPENDED may transition to REMOVED.
- REACTIVATE permits SUSPENDED/REMOVED to ACTIVE; already ACTIVE is a no-op.
- ENROLL and REACTIVATE require an ACTIVE global entity, including same-state
  requests. Reduction remains possible for globally ineligible entities, subject
  to relationship guards. Operational use requires ACTIVE global status plus an
  ACTIVE, currently effective membership.
- `expectedRevision` must be a safe nonnegative integer. A state-changing command
  compares it and uses a revision-qualified UPDATE under locks. Concurrent stale
  state changes cannot both commit. Same-state commands keep established strict
  no-op semantics, without changing stamps, revision, history, audit or outbox.
  The command receipt still preserves its response.
- Current status periods start at the server transition time. History captures the
  previous effective period bounded by the transition time, previous/new states,
  revision, actor UUID, verified role, operation, reason and effective time. Original
  creation provenance is retained; old missing provenance remains null.
- The existing pure project lifecycle policy governs NEW_OPERATION versus
  CONSISTENCY_CLEANUP. Archived/suspended projects cannot accept new enrollment or
  reactivation, but permit authorized reduction.

U02 never writes affiliation, assignment, allocation or pricing state. A reduction
requiring current or future accepted temporal consequences fails with
`DEPENDENT_RELATIONSHIPS_ACTIVE`. Carrier checks include affiliations, relevant
assignments/allocations and effective pricing. Ended history is preserved and does
not falsely block a reduction. Specialized closure/reconciliation belongs to U03.
U03 must acquire the same `canonical-project/<company UUID>/<project UUID>` advisory
transaction lock before introducing dependencies, or establish an equally strong
reviewed serialization boundary; this unit does not claim those future writers
are implemented.

## Migration 004 and least privilege

`004_canonical_identity_membership_authority.sql` is the only migration changed or
added by this unit. Migrations 001, 002 and 003 remain unchanged Git blobs and bytes.
004 SHA-256 (LF):
`628ed6e98f4e4eac64df0c00095f37c58295bfc071495f5dce07bffed756428c`.

The additive correction expands state constraints, adds profile crypto metadata,
natural-key HMAC/revision/provenance columns, adds a carrier registration-key unique
index, adds four append-only membership history tables, and adds
`legacy_identity_mappings`, encrypted receipt results and audit role snapshots.
Existing rows are not deleted or reclassified. Membership INACTIVE remains an
explicit unresolved legacy state; commands refuse to interpret it. New history
references its exact company/project/membership parent through composite FKs.
Historical duplicate keys prevent index creation and require explicit reconciliation.

Runtime receives SELECT/INSERT on the four global identity tables and narrowly
scoped status/revision/stamp UPDATE columns; SELECT/INSERT and lifecycle/stamp UPDATE
columns on the four membership tables; SELECT/INSERT only on their histories and
legacy mappings; SELECT/INSERT on identity keys/reservations and only reservation
operation/expiry UPDATE. No domain/history DELETE or identity-key retarget UPDATE.
Temporal/pricing grants are SELECT only, solely for dependency checks. Restrictive
project policies supplement company FORCE RLS on memberships, history and these
dependency reads. 003's restrictions on users, company roles, worker management,
audit mutation, schema creation and migration history remain effective. Worker and
authentication identities gain no domain mutation privileges.

`qsa_authorize_canonical_command` is a fixed, parameterized SECURITY DEFINER
capability with `search_path=pg_catalog,pg_temp`, fully qualified tables, revoked
PUBLIC execution and runtime-only execution. Its owner is the non-login,
non-superuser, non-owner-of-tables `qsa_command_authorizer`, which cannot inherit
other roles. That role has only the authority-table reads and id-column UPDATE
privileges PostgreSQL requires for row locks. No SQL text or actor/tenant/role
parameters can be supplied to the function; it uses the server transaction context.
Runtime/auth/worker cannot SET ROLE to the owner or become its members.

The dedicated migration owner temporarily enables SET to transfer function
ownership and then disables SET and INHERIT. It retains role ADMIN for later
migration/database administration. Schema CREATE is revoked from the capability
owner after transfer. Provisioning a pre-existing capability role requires DBA
reconciliation if the migrator lacks its ADMIN option, or if the role has unsafe
attributes/memberships. No runtime superuser/owner fallback is introduced.

## Atomicity, concurrency and recovery

Every changed command writes domain rows, required membership history, an audit
event, a committed encrypted receipt result, an outbox event and its pending worker
job in one `withUnitOfWork` transaction. No Google/network work occurs inside it.
SQL-owned actor/role provenance is snapshotted; audit digests are keyed and do not
contain raw profiles, natural keys, phones or free-text reasons. Outbox payloads
contain versioned identity/action metadata, operation/revision and actor provenance,
not PII profiles.

Project advisory locks serialize command/receipt races. A separate company/kind/HMAC
lock serializes natural identity creation across projects. Unique indexes on company
natural keys, external IDs, identity lookups, reservations and memberships are the
actual duplicate barriers; tests also bypass the service precheck and prove the
database rejects duplicates. Reservations are atomic, operation-owned and expiring;
an unexpired reservation owned by another command fails closed. Neither an unlocked
pre-insert SELECT nor client-side deduplication is authoritative.

Receipts are scoped to company/project/operation and bound to the current actor
and keyed normalized request hash. Authorization is rechecked before replay.
Identical concurrent/retried commands return the original JSON response; a changed
payload or actor fails `IDEMPOTENCY_PAYLOAD_MISMATCH`. Uncommitted/legacy-incomplete
receipt state fails closed. A genuine database error during outbox staging rolls
back the domain, history, audit and receipt together. PostgreSQL uniqueness/FK/RLS
errors are sanitized so error details cannot disclose natural keys. Forbidden
commands retain 403 semantics; invalid Firebase tokens use 401. Original transaction
cleanup and destruction of unsafe pooled connections from SG1 remain intact.

Recovery is forward-only after an approved activation: preserve receipts, keys,
history and mappings; do not reapply 003, drop the new tables or rewrite checksums.
A failed migration transaction rolls back. A committed correction needs a new
reviewed migration. No production database was accessed in this unit.

## HMAC/encryption provisioning and limits

Server-only secret-manager environment variables:

- `QSA_IDENTITY_HMAC_KEY`: CSPRNG-generated 32 bytes encoded as exactly 64 hex digits.
- `QSA_IDENTITY_ENCRYPTION_KEY`: independently generated, distinct 32-byte AES key,
  also 64 hex digits.
- `QSA_IDENTITY_KEY_VERSION`: stable deployment key label (default label `1`, not a
  default secret). Persisted metadata also fingerprints the key pair, detecting
  accidental secret replacement even if a label is reused.

No secret values or plaintext fallback are in source, logs, fixtures or configuration
files. Tests generate random ephemeral secrets in process memory. HMAC-SHA-256 is
domain-separated by purpose, company, entity kind and key version. AES-256-GCM uses
fresh 96-bit nonces and authenticated company/kind/external-ID scope for profiles;
legacy sources and receipts have their own authenticated scope. Driver ID/name/phone
and sensitive optional profile data are encrypted. Driver `name` contains the opaque
external ID, not plaintext PII. Normalized truck plates and material codes remain
their approved canonical business columns. Lookup tables contain HMAC bytes and
opaque targets, not reversible natural identifiers.

Secrets must be backed up and deployed through the owner's secure secret channel
before any future SQL activation. Replacing keys is not an implicit migration:
incompatible existing provenance fails closed. An authorized key rotation/backfill
with explicit reconciliation is still required before changing an established key
pair. No secret manager, production account or production data was modified here.

## Verification evidence

Windows x64, Node **22.22.0**, npm **10.9.8**, native PostgreSQL **17.6**, loopback-only
isolated test databases. Final schema was created from scratch with migrations
001–004 under the non-superuser `qsa_migrator`; runtime/auth connections were the
non-owner `qsa_runtime` / `qsa_auth` identities. Test-only fixture/backup setup used
a separate administrator. No simulated PostgreSQL engine or in-memory replacement.
The Firebase verifier is explicitly a test seam; no real Firebase accounts were
created or contacted by the new SQL tests.

| Verification | Actual result |
| --- | --- |
| New U02 focused PostgreSQL suite | **55/55 PASS**, including four-kind create/resolve/concurrency and direct-constraint checks, all global states, membership transitions/history/revision conflicts, multi-project reuse, company/project isolation, revoked/expired authority, held authority locks, encrypted PII/legacy mapping, missing/replaced secrets, ciphertext corruption, replay/mismatch, real DB rollback, current/future dependency guards, RLS/FKs/role denial and 004 checksum checks |
| Existing U01 infrastructure | **13/13 PASS**, including real pg_dump/psql schema restore and parity |
| Existing SG1 security suite | **36/36 PASS** on schema 004; only two exact version/count assertions expanded to include 004, with all original security/tamper assertions retained |
| Existing SG1 cleanup/config unit suite | **6/6 PASS**; fault-injection unit tests, not claimed as real PostgreSQL engine tests |
| Combined SQL/security run | **110/110 PASS**, no skipped tests or unhandled errors; final focused rerun also **55/55 PASS** after DTO/error-semantics checks |
| Required four-file authority bundle | **148/148 PASS**: reviewedRosterCommitP8B2 **50**, rosterExecutionRecoveryP8B3 **30**, temporalRelationshipAuthority **61**, txReadCacheCorrectness **7** |
| Existing global identity / project membership | **28/28** and **26/26 PASS** |
| Existing participation / browser boundary | **96/96** and **6/6 PASS** |
| Existing server authentication | **28/28 PASS** |
| Existing driver/truck intake | **14/14 PASS** |
| Additional SI-CG1 grouping | **52 passed / 1 failed**; identical failure reproduced on untouched baseline |
| Additional assignment foundation | **23 passed / 1 failed**; identical Windows path failure reproduced on untouched baseline |
| Unique existing regression cases across these selections | **421 passed / 2 baseline failures / 423 total**; repeated runs of the required 148 cases are not double-counted |
| Canonical `npm run lint` | **446 TypeScript diagnostics** on baseline and final, exit 2; diagnostic lines compare identically, **zero added diagnostics** |
| Canonical `npm run build` | Baseline and final **PASS**, including Vite, Workbox and server bundle; existing chunk-size warnings remain |
| `git diff --check` | PASS |

The SI-CG1 failure is `absent Material yields no group, default, allocation or close`
at `rosterIdentityGroupingProvenanceSiCg1.test.ts:118`, which receives the existing
UNRESOLVED_MATERIAL blocker. The assignment failure is test 51 at
`projectDriverTruckAssignmentFoundation.test.ts:672`, whose `/tests/` exclusion
misclassifies Windows backslash paths. Both failed on untouched main
`661f275...` (**75 passed / 2 failed** across those two baseline files). Neither
implementation nor assertion was changed or suppressed.

An initial U01 restore test timed out at its existing 30-second limit while two
production builds were running. It passed unchanged when database verification ran
without concurrent builds; the final successful restore took approximately 5
seconds. The timeout/assertions were not relaxed. No failure was hidden as PASS.

Portable verification setup uses the existing `QSA_TEST_DATABASE_ISOLATED=1`,
`TEST_DATABASE_URL`, `DATABASE_URL`, `AUTH_DATABASE_URL`, `MIGRATION_DATABASE_URL`
and optional `PG_BIN_DIR`; all URLs must point at disposable fixtures with the
appropriate separate identities. The new test generates its own ephemeral crypto
keys. Run DB files serially because the existing checksum fixtures deliberately
tamper with the isolated ledger temporarily:

```text
npx vitest run src/tests/ar2U02CanonicalIdentityMemberships.test.ts src/tests/ar2U01PostgresInfrastructure.test.ts src/tests/ar2U01SecurityGate.test.ts src/tests/ar2U01ConnectionCleanup.test.ts --no-file-parallelism
npx vitest run src/tests/reviewedRosterCommitP8B2.test.ts src/tests/rosterExecutionRecoveryP8B3.test.ts src/tests/temporalRelationshipAuthority.test.ts src/tests/txReadCacheCorrectness.test.ts
npm run lint
npm run build
git diff --check
```

The same installed dependencies were used for baseline and branch. No package,
lockfile, PWA, React, build configuration or production API changes. Native tools,
JSON/log evidence, disposable fixture databases and generated build artifacts are
outside tracked implementation files. The schema backup contains only synthetic
test schema and is not committed.

## Exact changed files and remaining work

```text
docs/reconstruction/08_AR2_U02_CANONICAL_IDENTITY_MEMBERSHIPS.md
src/db/canonicalAuthority.ts
src/db/canonicalIdentityRepository.ts
src/db/identityProtection.ts
src/db/migrations/004_canonical_identity_membership_authority.sql
src/services/projectParticipationAuthority.server.ts
src/tests/ar2U01SecurityGate.test.ts
src/tests/ar2U02CanonicalIdentityMemberships.test.ts
src/utils/projectMembershipPolicy.ts
```

Remaining debt/dependencies: the unchanged 446 TypeScript diagnostics, the two
reproduced baseline test failures and chunk-size warnings; authorized key/secret
provisioning and legacy identity/status reconciliation before adoption; U03 temporal
consequences and shared concurrency integration; later query/import/worker wiring;
the separately authorized U09 backfill/cutover. Profile data is preserved, but this
unit does not add a new profile-maintenance API or change the existing one.

No unit closure is claimed: independent review and owner merge remain pending.
The final commit/remote SHA and clean-worktree publication verification are reported
in the execution handoff after committing this record. No PR, merge, deployment,
production data migration or U03 implementation was performed.
