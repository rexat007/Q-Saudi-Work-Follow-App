# AR2-U05 durable Smart Import

Baseline d478165e728662eca9e2cb70717a3ac7f93a8a37 (merged U04/PR93).
Branch reconstruction/ar2-u05-durable-smart-import. Clean preflight, migrations
001–006 verified. No AGENTS.md. ARCH-R1.2 sections 8.3,18.3–18.4,19–22 and the
Smart Import assurance/live intake continuity contracts inspected before code.

## Source-to-SQL contract matrix recorded before implementation

| Source | Retained authority | SQL mapping |
| --- | --- | --- |
| importSession.server / durableSessionContract | v2 SOURCE→discovery/mapping/resolution/review; immutable IDs; CAS versions; terminal refusal | Existing pure checkpoint validator; separately stored session lifecycle and execution state |
| importSessionArtifacts / sessionArtifactCodec | Complete indexed chunk manifest, deterministic reconstruction, safe JSON | Bounded encrypted SQL checkpoints; immutable scoped artifact manifests/chunks; explicit unavailable real source storage |
| rosterCanonicalIntent / importProjectContext.adapter | Contributing/excluded/blocked rows, prepared identities, explicit Material binding, current canonical facts, full semantic signature | Same pure builder and context adapter using targeted SQL reads; server approval only |
| reviewedRosterCommit.server | Current principal/source/mapping binding, prepared-profile race proof, existing canonical/temporal policies, atomic effects | Same U02 transaction-bound identity/membership code and U03 repository; no nested transaction |
| rosterExecutionPlan.server | Independent dependency components, deterministic consequence/group IDs, provenance/recovery validation | Reuse executionPlan/prepareExecutionGroups/validateRecoveryScope, immutable encrypted SQL group plans |
| rosterExecution.server | Version/fence, receipt truth, bounded partial progress, cancellation between groups | SQL operation/group/receipt journal, one bounded group transaction per advance |
| rosterMaterialBinding / live continuity | Explicit confirmed Project Material when source absent; source-specific evidence retained | Signed durable batch binding; no silent default Material |
| importResolutionWorkflow / rosterResumeJourney | User decisions and authoritative recovery, never raw-row replay | Preserve UI; inactive server seam, durable status/readback and exact checkpoint restore |
| U04 invalidation | Canonical mutations and import-session changes invalidate presentation | Reuse existing same-transaction triggers; summary never grants import authority |
| Legacy Trip-oriented import consumers | Trip engine owns trip writes/pricing/weights | U06 dependency block; no provisional trips |

Production Firestore routes/UI remain authoritative and unchanged. No live SQL
adoption, Google operations, alternate review workflow, account registration or U06
implementation is authorized by this unit.

## Session and checkpoint implementation

`SqlImportAuthority` extends U02's current Firebase UID verification, SQL commercial
authorization, project lock, encrypted command receipts and UnitOfWork. It does not
resolve roles from token claims or create accounts. Protected createWithin and
membershipWithin methods were extracted from the existing SQL facade without
changing their policy/body; U05 composes those exact methods in the group UoW.
Firestore authorities, UI and all retained pure planner files are unchanged.

Session external ID, execution operation UUID and batch ID are immutable. Internal
project aliases resolve to the stored external ID before checkpoint/receipt output. Every
metadata command also has its own stable request UUID; request retries use the
existing actor/scope/payload-bound idempotency receipt. Checkpoints compare the
current session version under lock and increment it once. The shared
validateDurableCheckpoint owns stage transitions, mapping approvals and review
invalidation. Client-supplied reviewed intent and execution plans are not accepted.
Runtime payloads, credentials, duplicate row numbers and forbidden keys are rejected.
prepareDurableBatch removes runtime inputs and cached canonical authority.

Session lifecycle stays separate from execution state:

| Session lifecycle | Meaning in SQL U05 |
| --- | --- |
| SOURCE / DISCOVERED | Intake and immutable source snapshot, no canonical mutation |
| MAPPING / RESOLUTION / REVIEW | CAS checkpoints using retained stage/approval rules |
| INTENT_REVIEWED | Server-rebuilt and accepted immutable reviewed artifact |
| COMMITTING | Durable execution exists; checkpoints can no longer edit its meaning |
| FAILED_RECOVERABLE | Interrupted or review-required operation; consult execution state |
| COMMITTED | Completed journal and recoverable group receipts; read-only |
| CANCELLED | Terminal metadata/operation cancellation; completed groups survive |
| FAILED_TERMINAL | Retained terminal/read-only boundary; normal semantic conflicts use REVIEW_REQUIRED rather than manufacturing a terminal business result |

Execution states remain READY, EXECUTING, PARTIAL, REVIEW_REQUIRED, CANCELLED,
COMPLETED. They are not inferred from a client stage. The accepted checkpoint stays
immutable while journal/session versions advance; readCheckpoint overlays current
session lifecycle/version, and execution status owns progress/result truth.
Unknown legacy rows with unproven schema/operation/artifact provenance fail closed.
No backfill invents their source, actor, mapping or reviewed meaning.

## Immutable source, artifact and provenance boundary

ImportSourceStore is an explicitly server-injected provider interface. The default
UnavailableImportSourceStore refuses both writes and reads. A real provider is not
configured in this repository: deployment credentials and an approved private
object-store implementation remain an activation dependency. It must prove scoped
ownership, remote provenance and immutable snapshot bytes before issuing a receipt;
it must create the corresponding scoped SQL manifest, not invent an object URI.

IsolatedSqlImportSourceStore is gated by NODE_ENV=test AND
QSA_TEST_DATABASE_ISOLATED=1. It persists real encrypted chunks in PostgreSQL and
issues an ISOLATED_SQL_TEST receipt. This is test storage evidence, not a claim of
live Google/object-store availability. No Drive/Sheets resource was created or
refetched. Google tests use frozen synthetic snapshot bytes and existing-ID-shaped
metadata, not an actual remote provider.

The server computes raw SHA-256, checks declared content identity and caps source
bytes at 2,000,000. The trusted provider receipt must match actual artifact UUID,
source type, source revision and content hash. It is stored in the encrypted
checkpoint and rechecked against the session before execution. A mismatched receipt
cannot advance the session. File/remote metadata, mapping and source-row evidence
remain encrypted checkpoint facts; there is no plaintext raw spreadsheet table.

The retained token codec reconstructs checkpoints deterministically. Each artifact
has an immutable count/digest/byte manifest and indexed encrypted chunks. Reads
verify exact count, contiguous indexes, per-chunk hash, total byte length and whole
digest before decoding. Ciphertext size is checked before bulk content retrieval.
AES-GCM AAD binds company, project, session, artifact and chunk index, using U02's
key-versioned encryption. Missing, duplicate, altered, wrong-scope or oversized
chunks fail closed. Source content is separately rehashed after reconstruction.

Changed bytes never masquerade as the original reviewed source. An explicit
same-content revision replacement follows the retained immutable-source rules,
returns to DISCOVERED and removes approval. Changed content requires a new source
journey/session, not a silent substitution. A changed mapping requires a new
mapping revision and explicit review invalidation. Google source identifiers and
modified-time provenance are frozen; status never reads a mutable Sheet.

## Reviewed intent and group authority

The server loads the stored checkpoint and source evidence, then builds targeted
canonical context from SQL. Proofs are cached once per distinct referenced identity,
including displaced counterparts; there is no per-source-row global lookup or full
Project catalog hydration. Current global profile integrity, effective memberships,
carrier affiliations and U03 witnessed assignment/allocation periods are checked.
Prepared identities use canonical natural-key resolution and the exact reviewed
profile fields. Conflicting prepared fields and unsupported plan keys are rejected.
Compatible concurrent materialization reuses the global ID; inactive membership or
incompatible profile is not silently repaired by inventing another identity.

The existing buildRosterCanonicalIntent and ImportProjectContextAdapter own row
meaning, exclusions, explicit Material binding, warnings, displacement and current
relationship proofs. The approval request carries only the expected digest/version
and explicit approvals, never an authoritative client intent. The server rebuilds
the stored batch under current authorization. Its exact semantic signature is
stored with source/mapping/actor bindings in an immutable encrypted checkpoint.
SHA-256 identifies the retained P7 semantic signature; an HMAC execution binding
also binds tenant/project/session, source hash, checkpoint identity and operation.
The digest is an approval pointer, not a client-granted capability.

prepareExecutionGroups retains deterministic dependency components/consequence
IDs and scope limits. validateRecoveryScope rechecks current facts before each
group and allows only the existing recovery/satisfaction semantics. The SQL adapter
normalizes the stored entity comparison view to the validator's canonical order
because displaced counterparts are appended by the builder. The original sealed
plan/group ID remains unchanged; no production planner or business rule was edited.

Non-prepared entities must already satisfy the established explicit prerequisite
workflow. Prepared Driver/Truck materialization composes U02 create and ENROLL plus
U03 SET_AFFILIATION in the same transaction. Assignment/reassignment and allocation/
reallocation call the same U03 transaction-bound repository. Both displaced pairs
close correctly; normal closure remains ACCEPTED ended history, never VOIDED.
Company-wide exclusions remain binding across projects and are not weakened for
import. Existing complete prerequisites are proof, not commands to replay.

## Durable journal, fencing and atomic commit

Start seals immutable encrypted group plans and records operation binding, request
version, reviewed signature, execution version/fence and group totals. Same binding
and operation return durable existing execution truth, including after completion;
changed signature/payload/operation fails closed. There is one execution per session.
An execution-managed checkpoint cannot be edited to change accepted meaning.

Advance acquires a new persisted fence/version under the existing project lock,
then processes one bounded group in a separate transaction. That transaction
re-reads the locked session/operation and requires the current EXECUTING fence.
Old fences cannot create a new group commit. No process-local timer or lease grants
authority. Current project lifecycle and SQL permissions are rechecked; archived
projects deny new execution while retaining authorized readback/cancellation.

Every successful group atomically writes canonical identity/membership/affiliation/
temporal effects, period events, group state, immutable encrypted result receipt,
idempotency result, actor audit, outbox/job effects and session/operation versions.
Deterministic group operation UUIDs and unique receipt keys prevent duplicates.
Late audit/outbox failure rolls the entire group back. Receipts retain the complete
canonical result/map encrypted at rest; normal status omits prepared natural keys
and returns only safe canonical result summaries. Status also cross-checks actual
group/receipt counts, so a terminal label alone cannot establish success. Hash/AES verification detects
receipt or plan tampering instead of substituting an empty success response.

## Recovery, cancellation and errors

Lost COMMIT acknowledgment is resolved from journal/receipt truth. Retrying the
exact request cannot create a second group result. Fresh service objects, fresh
pools and a separate Node process reconstruct state from PostgreSQL without an
earlier JavaScript object or source UI remaining alive. Remaining work is located
through the pending-group index rather than re-executing the full batch.

PARTIAL permits an explicit reauthorized retry. Semantic changes become
REVIEW_REQUIRED with a precise sanitized code and no automatic retry. Cancel
linearizes between atomic groups, increments the durable fence and preserves
committed receipts/effects. CANCELLED and COMPLETED do not return to active work.
A review-required execution requires explicit reconciliation/new journey; U05 does
not rewrite a partially committed plan under the same operation.

Unregistered SQL accounts are distinguished from unavailable authentication
transport. An unavailable lookup yields sanitized 503, never NO_PROFILE or identity
creation authority. Suspended/revoked accounts and roles remain authoritative even
after an earlier approval. Account/UI registration and profile continuity code is
unchanged. Infrastructure failures become explicit retryable PARTIAL; semantic
conflicts are not treated as an infinite transport-retry loop.

## U06 dependency and inactive server integration

Trip review cannot fabricate a Roster signature. An explicit Trip execution request
preserves its source/review snapshot and records REVIEW_REQUIRED with
U06_TRIP_AUTHORITY_REQUIRED, zero groups and a NULL reviewed signature. SQL permits
that combination only as the explicit U06 dependency state (or its cancellation).
No trip, weight event, price or provisional snapshot is written. Roster groups have
no Trip consequences and can execute independently. Full Trip-import equivalence
is expressly unproven until U06; no U06 implementation was started.

server/sqlImportRoutes.ts supplies test-only create/source/checkpoint/intent/review,
POST executions, POST executions/:operationId/advance, GET executions/:operationId
and cancellation contracts. Route mounting requires both isolated-test gates and
is absent from server/app.ts. Request bodies/limits and scoped bearer authorization
are checked; responses are private,no-store, with no implicit conditional fallback.
No production endpoint, React stage, import editor, polling path, Google resource
or Workspace identifier was replaced. Future UI adoption is a cutover dependency.

## Migration 007 and SQL security

Published 001–006 are unchanged. Additive 007 extends the existing session,
artifact, decision, group and receipt tables, and adds import_executions and
import_artifact_chunks. Existing legacy columns/rows remain in place; new scoped
FKs are NOT VALID for old rows while enforcing all new writes. Composite artifact/
group/receipt references bind company/project/session/operation. Runtime cannot
attach a foreign artifact merely by knowing a UUID.

Runtime is the same non-owner/non-superuser/non-BYPASSRLS identity. All journal and
chunk tables enforce company RLS plus restrictive project scope. SELECT/INSERT and
narrow journal UPDATE grants are explicit. Artifacts, row decisions and receipts
have no runtime UPDATE/DELETE. Completed journal rows are immutable; versions must
increment exactly once and fences cannot decrease. No new privileged service role
or production credential was introduced. Sensitive decisions/plans/maps/content are
encrypted, not stored in audit or indexing fields.

Final 001–007 replay succeeded in a new isolated qsaudi_u05_verified database.
Repeat runs verify all seven checksums; altered checksums are rejected. Unpublished
development databases were kept separate, never repaired by editing migration
history. DDL is transactional. After publication, failures require a forward
migration or approved restore/reconciliation, not checksum rewriting or deletion.

## Bounded execution and actual PostgreSQL evidence

| Bound | Enforced limit |
| --- | --- |
| Source snapshot | 2,000,000 bytes |
| Checkpoint/artifact | 8,000,000 bytes; at most 256 immutable chunks |
| Session source rows | 10,000, with unique safe integer row identities |
| Review proof closure | 1,024 distinct identities; 12,000 transaction-body SQL statements |
| Execution | At most 500 dependency groups; one group per advance |
| Group | At most 10,000 rows, 16 entities, 64 consequences, 1,000,000 plan/receipt bytes |
| Group SQL | At most 1,200 transaction-body statements, including idempotency-result UPDATE; fixed auth/UoW control is additional |
| Status | Limit 1–50, indexed receipt and pending-group keysets; no checkpoint/source/plan hydration |

Native PostgreSQL 17.6, Node 22.22.0/npm 10.9.8, real pg pools, separated migration,
runtime and authentication identities; loopback only. Synthetic fixtures contain no
real identities or source spreadsheets. Test secrets are random in-process values.
The 1,000 repeated-row SQL case executes one group, creates two global identities,
one assignment and one allocation with **126 transaction-body queries** and a
**1,656-byte receipt** in the final run. This proves deduplication/bounds on the local fixture, not a
production latency SLO or a claim of full 10,000-row SQL capacity acceptance.

Final new suite: **54/54 PASS**, real PostgreSQL, including actual HTTP lost ACK,
separate Node-process restart, fresh pools, source/checkpoint corruption, mapping
invalidation, explicit displacement, rollback, cancellation races, semantic versus
infrastructure failure, RLS/FK/privilege/context negatives, source provider receipt,
archived lifecycle and U06 dependency. Concurrent compatible imports reuse one
global pair/active relationship. Concurrent two-project imports produce one commit
and one actual TEMPORAL_RELATIONSHIP_CONFLICT; no duplicate global identity survives.

Previous SQL suites: U01 13/13, SG1 36/36, U02 55/55, U03 63/63 and U04 34/34
PASS. U04 presentation 11/11 and connection cleanup 6/6 also PASS as unit evidence.
U01 schema-only native pg_dump/psql restore initially exceeded its existing 30s
timeout; the isolated rerun passed in 19.70s with no timeout/tool/server-durability
setting changes. U04 query/payload gates and indexed limited-runtime plans continue
to pass. No authority case was removed, weakened or intentionally skipped. The
four older SQL test edits only extend migration list/count expectations to seven.

## Baseline versus final regression assurance

Baseline and final used the same installed toolchain and exact deduplicated file
list. The named 16-file P8/Smart Import selection is **470 PASS / 36 baseline FAIL /
506**. The full 35-file union with Foundation and profile continuity is **913 PASS /
46 baseline FAIL / 959** in both runs, with the same existing unhandled rejection
`A failure`. Failed test identities match exactly. These wider failures are
measured debt, not an assumed repeat of U04's narrower ten-failure selection.

| Requested P8 / related file | Pass / total on both baseline and final |
| --- | --- |
| durableImportSessionP8B1 | 41/41 |
| reviewedRosterCommitP8B2 | 50/50 |
| rosterExecutionRecoveryP8B3 | 30/30 |
| rosterResumeJourneyP8B4 | 14/14 |
| rosterCanonicalIntentP7B3 | 37/37 |
| rosterMaterialBindingContinuity | 10/10 |
| rosterResumeStageReconciliation | 25/25 |
| rosterIdentityGroupingProvenanceSiCg1 | 52/53 |
| rosterBulkGlobalReuse | 17/17 |
| smartImportServerCanonicalCommitContractC1 | 20/46 |
| smartImportCommitIntegrityConvergence | 34/35 |
| smartImportTripWriteFailureIntegrity | 20/20 |
| smartImportGlobalCanonicalSnapshotBoundary | 40/48 |
| importSessionClientAuthRecovery | 12/12 |
| temporalRelationshipAuthority | 61/61 |
| txReadCacheCorrectness | 7/7 |

The required four-file bundle remains **148/148** (50+30+61+7), counted once in
combined totals and additionally invoked as its explicit four-file command.
The larger union also retains Foundation/Setup/readiness/refresh/lifetime/Fleet,
server authentication and profile availability regression cases. Existing failures
include historical source-contract assertions, old canonical snapshot expectations,
the known SI-CG1 Material assertion, Windows caller-path classification, Foundation/
Wizard assertions and one actual-provider continuity test. None was changed to
make this SQL unit appear green.

Typecheck: baseline/final 446 diagnostics, identical after normalizing shifted line
locations. Build: baseline/final PASS; existing chunk warning remains. Diff check:
PASS. Local evidence in sibling .sg1-tools includes u05-regression-files.txt,
u05-baseline-regressions.json, u05-final-regressions.json, u05-baseline-p8.json,
u05-authorities-final.json, u05-import-final.json, u05-infrastructure-final.json,
u05-required148-final.json and baseline/final lint/build logs. These artifacts,
database files, dumps, source bytes and binaries are not committed.

## Exact file inventory and review boundary

1. docs/reconstruction/11_AR2_U05_DURABLE_SMART_IMPORT.md
2. server/sqlImportRoutes.ts
3. src/db/migrations/007_durable_import_execution.sql
4. src/db/importArtifacts.ts
5. src/db/importCanonicalContext.ts
6. src/db/importAuthority.ts
7. src/db/canonicalAuthority.ts
8. src/tests/ar2U05DurableImport.test.ts
9. src/tests/ar2U01SecurityGate.test.ts
10. src/tests/ar2U02CanonicalIdentityMemberships.test.ts
11. src/tests/ar2U03TemporalAuthority.test.ts
12. src/tests/ar2U04BoundedReads.test.ts

Remaining debt: the measured 446 diagnostics, 46 wider-selection baseline failures
and existing unhandled rejection/chunk warning; approved real source storage and
provider attestation/credentials; U06 Trip authority; U07/U08 adoption; U09 epoch/
single-authority cutover and live browser/production acceptance. This branch does
not claim live storage, Trip-import or browser acceptance. No PR, merge, deployment,
production migration, SQL activation or later-unit implementation is included.
Status: ready for independent review, not closed before owner merge.
