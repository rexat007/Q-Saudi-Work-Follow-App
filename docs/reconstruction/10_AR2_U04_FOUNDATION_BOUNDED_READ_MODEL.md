# AR2-U04 Foundation, readiness and bounded reads

Baseline: `99669831037f48b4044e4c4e26b8164144b81eff`, merged U03/PR92.
Branch: `reconstruction/ar2-u04-foundation-bounded-read-model`.
Preflight: clean worktree, migrations 001–005, no AGENTS.md, approved ARCH-R1.2
sections 5,7,10,17,18,19,21,22 inspected before implementation.

## Source dependency and contract matrix (before implementation)

| Source | Current contract / dependency | U04 boundary |
| --- | --- | --- |
| server/app.ts: foundation-snapshot, readiness; ProjectFleetQueryService.foundation | Firestore transaction combines project, materials, carriers, fleet, relationship context, setup, readiness and pricing; admin/finance principal | Keep route and response unchanged; separate inactive v2 read contract |
| SetupFleetQuery.readProjection | Four membership lists, per-member globals/affiliations and temporal reads | SQL pages only the requested kind, at most 50; no decrypted profiles |
| projectFleetReadModel.service/server/context | Active truck membership iteration; global, membership, affiliation, assignment and allocation lookups | Indexed page-first SQL and canonical-reference-only projections |
| ProjectReadinessQuery/Service/AdminReadContext | Lifecycle validation, setup readiness, operational configuration, memberships, complete operational path and applicable pricing | Do not assert READY without U05/U06/U08; explicit pending dimensions |
| ProjectCanonicalRefreshService.refresh | Requires large SERVER_TRANSACTION_SNAPSHOT; replaces canonical/offline collections only after convergence | Never pass a summary or partial page to this barrier |
| ProjectSetupWizard | Existing Foundation/Workspace/Materials/Carriers/Roster/Pricing/Access/Review stages; ProjectContextLifetime generation and SetupMutationSession guards | Prepare typed inactive presentation seam, retaining generation/actor/epoch fencing |
| SetupReadinessPanel / ProjectOperationalReadiness | Evaluated readiness dimensions and old authorized readiness route | No live SQL fetch or activation decision; pending SQL presentation is distinct from evaluated readiness |
| projectSetupWorkflow.service | Eight fixed setup layers and prerequisite navigation | Reuse stage vocabulary; do not invent successful setup stages |
| U02 canonicalAuthority / U03 temporalAuthority | Verified Firebase UID, SQL commercial role, project lock, one UnitOfWork, receipts/audit/outbox | Database-trigger invalidation in same canonical transaction, including global status dependencies |
| projects / foundation summaries | version, readiness_revision; persisted counts/readiness/stale are not automatically maintained | Monotonic canonical revisions; invalidate persisted projection; fresh scalar counts with visible persisted staleness |
| workspace_bindings / pricing / trips / imports | Initial storage exists; final SQL commercial/workspace authorities are later units | Existence is not successful provisioning or readiness; mark pending |

No production SQL adoption is authorized. The v2 router will only mount in the
isolated test harness, not server/app.ts. There is no browser-selected authority.
Foundation is presentation, never activation authority. Future activation must
re-read canonical facts in its own authorized transaction.

## Implemented contracts and routing

Production routes remain in server/app.ts: foundation-snapshot (1666),
fleet-read-model (1682), intake-preview (1689), setup-context (1695),
relationship-context (1706) and readiness (1926). They continue to use Firestore.
ProjectCanonicalRefresh retains its full SERVER_TRANSACTION_SNAPSHOT contract and
offline reconciliation barrier. None of its complete collections are populated
from the new summary or a partial page.

The unregistered `server/sqlProjectReadRoutes.ts` factory provides these routes only
when explicitly mounted by a server composition with BOTH NODE_ENV=test and
QSA_TEST_DATABASE_ISOLATED=1. Production mounting throws SQL_READ_ROUTES_INACTIVE;
server/app.ts does not import it. There is no default-on flag or browser authority
selector, no production SQL request, and no fallback to Firestore on SQL errors.

| Route | Contract |
| --- | --- |
| GET /api/v2/projects/:external/foundation-summary | FoundationSummary scalar envelope |
| GET /api/v2/projects/:external/fleet | ROSTER/TRUCK by default, optional DRIVER, bounded page |
| GET /api/v2/projects/:external/setup/:stage | MATERIALS/CARRIERS/ROSTER bounded participant pages; other existing stages return only their small scalar stage summary |

The summary contains external project ID, actual SQL status/version, durable source
revision, nullable persisted Foundation revision, eight small stage entries,
currently effective ACTIVE membership counts, binding-existence status, staleness,
server-configured backend epoch and server generation time. Counts describe
membership, not operational eligibility. A suspended global may remain enrolled;
Fleet pages expose membership and global status separately. Profiles, national IDs,
phones, plates, history arrays, complete participant lists, import content and
pricing lists are absent. Indexed count aggregates return scalar results without
loading globals, decrypting profiles or enumerating fleet records in JavaScript.

Readiness is explicitly INCOMPLETE. CARRIER/MATERIAL stages report only membership
presence/absence; other stages remain PENDING. Pricing/activation require U05/U06;
Workspace provisioning requires U08. A workspace_bindings row proves only a binding
record exists: BOUND_PROVISIONING_UNVERIFIED, never PROVISIONED. No row means UNBOUND.
Project status ACTIVE is not evidence that the pending SQL readiness dimensions
are READY. There is no activation or new command API in this unit.

## Revisions, invalidation and migration 006

001–005 are unchanged. Additive 006 adds foundation_revision, source_revision and
valid_until to the stored presentation row. Existing unresolved rows retain their
data and have a null source revision, which makes them visibly stale. Missing
projections return a null Foundation revision and stale=true; counts still come
from current canonical membership aggregates rather than fabricated cached zeros.

Revisions have different meanings:

* projectRevision = projects.version, monotonic after a project/dependency change.
* sourceRevision = projects.readiness_revision, durable invalidation fence.
* foundationRevision = persisted projection generation; null when no row exists.
* Stored project_revision/source_revision record the facts through which a
  separately authorized projection writer computed its result.

The summary is stale if the persisted row is missing, explicitly stale, behind
either canonical revision or past its valid_until. Its stored readiness/count
values are never trusted to supply live facts. Reads do not insert/update summaries
or start jobs. Synchronous invalidation is implemented now; a future authorized
materializer must recompute its generation and through-revisions transactionally,
set a validity deadline for time-dependent facts, and validate pending authorities
before declaring readiness. U04 does not fabricate that worker or final readiness.

Database triggers advance canonical revisions and mark an existing summary stale
in the same transaction as membership, temporal, project-access, Workspace binding,
pricing, trip or import-session changes. Project changes advance both revisions.
Global identity UPDATE invalidates every project containing that identity's
membership, using reverse dependency indexes. It changes no membership or temporal
fact. Privileged movement of a project-scoped dependency invalidates old and new
project scope. No-op UPDATE does not advance revisions. One command may touch
several rows; revisions are monotonic fences, not command counts. Rollback also
rolls back every revision/staleness change, including after late audit failure.
No production trigger or migration has been installed.

The invalidation trigger's SECURITY DEFINER owner is a dedicated NOLOGIN,
non-superuser, non-BYPASSRLS role. It has SELECT of dependency keys and only
UPDATE(version,readiness_revision) on projects and UPDATE(stale) on summaries.
Explicit RLS policies allow invalidation across the affected projects without
exposing their data to the runtime caller. PUBLIC execute is revoked; runtime,
auth and worker receive no role membership. Functions use fixed pg_catalog/pg_temp
search paths and qualified tables; dynamic targets come only from fixed catalogs.
Temporary CREATE and migrator SET/INHERIT rights are removed after ownership transfer.
Runtime cannot directly edit summaries, invoke trigger capability or SET its role.

Final 001–006 replay succeeded on a fresh isolated database qsaudi_u04_final;
repeat/checksum tests verify all six. An earlier unpublished development 006
database remains separate; no applied checksum or schema history was repaired.
Published migrations must remain immutable. Migration application is transactional;
after failure, fix unpublished source and replay on a fresh isolated database, or
use a separately approved forward migration/restore after publication. No rows
are deleted or reconciled automatically by 006.

## Read authorization, snapshot and caching

The same server Firebase Admin verifier identifies the UID (revocation checking
enabled). Token role claims are ignored. A bounded qsa_auth lookup retrieves only
the active actor ID. The existing service-identity checks enforce non-owner,
non-superuser, non-BYPASSRLS direct qsa_auth/qsa_runtime logins without membership.

The existing UnitOfWork gains an opt-in REPEATABLE READ READ ONLY mode. It combines
the three transaction-local scope settings into one statement but retains identity
checks, local runtime role, COMMIT/ROLLBACK, DISCARD ALL and connection eviction.
The default command transaction path is unchanged. The narrow NOLOGIN U02 command
authorizer owns a new read function: one SQL SELECT checks active user/company,
current commercial role, exact external project and applicable project access;
it sets the scoped project ID. Admin company roles may read within their company;
PROJECT_ADMIN and FINANCE_AUDITOR require matching active project access. Other
roles are denied. This preserves Foundation's admin/finance boundary.

Runtime data reads use forced company RLS and restrictive project RLS. 006 grants
summary SELECT and only binding ID/scope columns; it does not grant OAuth or Google
resource details. Auth lookup, data lookup and response always run again per
request. Authorization is current as of the request's repeatable-read snapshot;
in-flight reads may finish against that snapshot, while subsequent requests see
revocation/suspension. There is no cached principal or SQL response body.

Invalid/expired identity: 401. Missing, foreign or unauthorized project: identical
404 PROJECT_NOT_FOUND (no resource-existence distinction). Invalid inputs/cursor:
400. Expired/time-fenced/source-stale cursor: 409. Unavailable/inconsistent SQL:
sanitized 503, without raw SQL or natural keys. No fake empty canonical fallback.

Responses use private,no-store and Vary Authorization,X-Company-Id. ETags are HMAC
bound to actor, company/project, actual authorization scope, backend epoch and
summary data. Generation time is excluded from the stable digest. Authorization
is rechecked before conditional comparison. Only a scope-matched nonstale summary
may produce 304. Express automatic freshness is disabled for this comparison so
a stale summary cannot accidentally produce 304. Role/access validity changes
change the scope binding even for the same actor.

## Pagination and inactive existing-UI integration

Fleet and participant Setup pages validate limit 1–50, fetch at most limit+1 and
use a stable membership UUID keyset. The unique key is internal pagination state;
public rows use canonical global/ASN/TMA external IDs. A materialized page-first
CTE limits relationship joins to at most 51 selected members. Accepted relationship
references require the U03 matching event witness; unproven history fails closed.
Only current accepted relationships are projected; no history collection is loaded.

HMAC-SHA256 cursors bind company, external project, actor, SQL authorization scope,
backend epoch, stage, kind, limit, sort and source revision. Integrity comparison is
constant-time. Tokens expire after five minutes or at the earliest future temporal
or membership validity boundary, whichever is sooner. This prevents a time-only
change from silently changing pages without a write. Every next page reauthorizes
and requires the same revision; a concurrent mutation returns 409 and requires
restarting pagination. Stable-revision traversal proves no missing/duplicate rows.
Responses always include nextCursor,hasMore,sourceRevision and fullSnapshot=false,
including an empty last page. Offline code receives no replacement instruction.

The existing Fleet context exports the bounded read port separately from its old
complete Firestore context. Types use the existing eight Setup stage names.
BoundedProjectReadSession is an inactive consumer seam for the existing Wizard,
Fleet workspace and readiness presentation: no fetch on entry, no polling, no
Workspace/Sheets calls, and no IndexedDB access. Explicit summary loads coalesce
to one request per generation. Explicit invalidation allows refresh. Project,
principal, epoch, A→empty→A and dispose invalidate late responses; revision changes
clear old pages and reject older results. Failed loads remain unavailable.

No new UI was created and no existing component was switched to SQL. Live adoption
depends on U05/U06 readiness, U07 offline contracts, U08 Workspace authority and
U09's owner-approved single-authority server composition. SetupReadinessPanel's
evaluated readiness and ProjectCanonicalRefresh's complete snapshot are deliberately
different interfaces. Unit/component regressions are not live browser acceptance.

## PostgreSQL performance evidence

Native PostgreSQL 17.6, Node 22.22.0/npm 10.9.8, repository Vitest 5.0.3, Windows,
Intel i7-6600U 2.60GHz / 4 logical CPUs, 23.88 GiB RAM. Separate migration/runtime/
auth pools, max 4 each, loopback database and real isolated Express HTTP routes.
Synthetic projects contain 24/100/1,000 trucks plus 5,000 background trucks in a
second tenant to establish realistic index selectivity. No real profile data.

Measurement counts every client SQL call from trusted UID completion through
DISCARD ALL, including both service identity checks, actor lookup, transaction
control, role/scope setup, authorization and the actual summary. Ten client
statements + the authorization function's one internal SELECT = **11 total**.
No authorization work is excluded or hidden in a prewarmed cache. Six rows return
across these calls, of which one is the summary. Aggregates scan indexed scoped
membership entries; rows scanned for COUNT are not confused with rows returned.

| Trucks | SQL statements incl. function | Returned rows | JSON bytes | Protocol query time ms | Single route ms | HTTP p50 ms | HTTP p95 ms | EXPLAIN SQL ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 24 | 11 | 6 | 830 | 10.06 | 73.14 | 17.57 | 153.62 | 0.634 |
| 100 | 11 | 6 | 833 | 12.25 | 19.00 | 18.06 | 20.22 | 0.394 |
| 1,000 | 11 | 6 | 836 | 12.94 | 17.76 | 16.63 | 19.92 | 1.475 |

For each size: 3 warmups, 40 HTTP requests, concurrency 4, nearest-rank p50/p95.
These are measured local SQL/HTTP acceptance-workload results, not browser or
production latency. Local p95≤1s passes; production/load/browser performance
remains unproven until cutover acceptance. Budgets remain constant with fleet size.

Actual EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON) ran under qsa_runtime with forced RLS
and the same read-only UnitOfWork. Final plans use idx_project_trucks_lookup,
workspace_bindings_company_id_project_id_key and projects_company_id_id_key.
Earlier valid plans also chose project_trucks_page_idx. Planner settings were not
changed. Empty/tiny scoped tables can legitimately use a sequential scan; the
populated 1,000-truck hot path uses the scoped index. Reverse dependency and
membership page indexes are introduced in 006. There are no per-entity Foundation
queries, full profile joins, idle SQL requests or Workspace synchronization calls.

## Verification and baseline comparison

Final new cases: 34 real PostgreSQL/HTTP read-security/cursor/invalidation/budget
cases and 11 presentation-session cases. SQL tests cover two companies, multiple
projects, admin/manager/finance/viewer, revocation, suspension, RLS, ETag scope,
read-only enforcement and physical connection cleanup, database outage, U02/U03
invalidation, atomic rollback, time-only validity, migration repeat/checksum,
production mounting denial and keyset traversal. Presentation tests are unit tests,
not PostgreSQL or browser evidence. No test is intentionally skipped or removed.

Previous real suites: U03 63/63, U02 55/55, SG1 36/36, U01 13/13 pass. Cleanup
6/6 passes as unit evidence. One combined run's backup/restore timed out while
competing regression/typecheck workers were active; its isolated rerun passed in
14.23s with the original 30s timeout unchanged. An initial plan assertion required
one particular index; it was corrected to accept the valid existing lookup index
and fixture selectivity was made explicit, rather than disabling the planner.

Identical serial 22-file baseline/final selections each give **640 PASS / 10 FAIL /
650**, with the same one pre-existing unhandled rejection (`A failure`) and identical
failed test identities. This expanded selection reveals more debt than U03's
narrower two-failure selection; it is not represented as a green regression suite.

| Existing selected file | Pass / total on both baseline and final |
| --- | --- |
| foundationMaintenancePfagRb2 | 58/58 |
| foundationMaintenanceUiPfagRb2 | 6/6 |
| foundationSafetyPfagRb1 | 54/54 |
| projectActivationReadiness | 40/41 |
| projectCanonicalRefreshBarrierA11 | 39/40 |
| projectContextLifetime | 16/16 |
| projectDriverTruckAssignmentFoundation | 23/24 |
| projectFleetReadModelAdminReadContext | 11/11 |
| projectFleetReadModelFoundation | 41/41 |
| projectReadinessAdminReadContext | 14/14 |
| reviewedRosterCommitP8B2 | 50/50 |
| rosterExecutionRecoveryP8B3 | 30/30 |
| rosterIdentityGroupingProvenanceSiCg1 | 52/53 |
| rosterMaterialBindingContinuity | 10/10 |
| serverAuthenticationTrustBoundary | 28/28 |
| setupFleetQuery | 17/17 |
| setupFleetWorkspace | 26/26 |
| setupReadinessBoundary | 34/36 |
| setupReadinessPresentation | 17/17 |
| setupWizardContinuity | 6/10 |
| temporalRelationshipAuthority | 61/61 |
| txReadCacheCorrectness | 7/7 |

All file names above are under src/tests with their existing .test.ts/.test.tsx
extension. Exact required authority bundle = reviewedRosterCommitP8B2 (50),
rosterExecutionRecoveryP8B3 (30), temporalRelationshipAuthority (61),
txReadCacheCorrectness (7): **148/148** in both runs, not additional distinct tests.
The exact four-file bundle also passed separately in u04-required148-final.json.

Existing failures: lifecycle direct-update test receives relative-URL parsing error;
CanonicalRefresh source assertion finds existing window.location.reload(); assignment
caller assertion misclassifies Windows backslashes; SI-CG1 absent Material expects
no UNRESOLVED_MATERIAL blocker; two Setup readiness assertions disagree with current
Foundation validation; four Wizard continuity assertions differ on call count,
delayed subscription, refresh-receipt text and Global control visibility. These
same failures and unhandled rejection reproduce on clean authoritative main.

`npm run lint`: baseline/final both exit 2 with 446 diagnostics, identical after
normalizing shifted line/column positions. No suppression or dependency changes.
Baseline and final `npm run build` pass (existing chunk warning remains).
`git diff --check` passes. Only migration inventory expectations in the old SG1,
U02 and U03 tests advance from five to six; authority cases are unchanged.

Local uncommitted evidence lives in sibling .sg1-tools: u04-regression-files.txt,
u04-baseline-regressions-serial.json, u04-final-regressions.json,
u04-authorities-final.json, u04-infrastructure-final.json, u04-baseline-lint.log,
u04-final-lint.log, u04-baseline-build.log and u04-final-build.log, with matching
test logs. Reports, PostgreSQL binaries, database files and dumps are not committed.

## Exact changed files and remaining work

1. docs/reconstruction/10_AR2_U04_FOUNDATION_BOUNDED_READ_MODEL.md
2. server/sqlProjectReadRoutes.ts
3. src/db/migrations/006_foundation_bounded_reads.sql
4. src/db/foundationReadRepository.ts
5. src/db/projectReadAuthority.ts
6. src/db/unitOfWork.ts
7. src/types/boundedProjectReads.ts
8. src/services/boundedProjectReadSession.ts
9. src/services/projectFleetReadModel.context.ts
10. src/tests/ar2U04BoundedReads.test.ts
11. src/tests/ar2U04PresentationSession.test.ts
12. src/tests/ar2U01SecurityGate.test.ts
13. src/tests/ar2U02CanonicalIdentityMemberships.test.ts
14. src/tests/ar2U03TemporalAuthority.test.ts

Remaining: existing 446 diagnostics, ten expanded-selection baseline failures and
one unhandled rejection, existing bundle warning; final SQL import/trip/pricing/
Workspace readiness authorities, authorized projection materialization, offline
adoption, owner-controlled single-authority cutover and live browser/production
acceptance. The key/epoch must be supplied by server composition and rotated/fenced
on cutover/restore; no sample production secret/default key exists. No PR, merge,
deployment, production migration, SQL activation or U05 work is included.
Status: ready for independent review, not closed before owner merge.
