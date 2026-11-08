# AR2-U06 — Trips, Weighbridge and immutable Pricing authority

## Verified preflight and scope

Authoritative main: `365134064ad790377cd0bc2c2b58c0044ce7952a`, verified against
origin/main and merged PR #94 (GitHub metadata confirms that exact merge SHA).
Initial worktree clean; dedicated branch:
`reconstruction/ar2-u06-trips-weighbridge-pricing`. Migrations 001–007 and U02–U05,
including RB1, are present. SQL remains inactive in production; no U07 work.

## Source-grounded equivalence matrix (recorded before implementation)

| Contract | Authoritative source | SQL reconciliation required |
| --- | --- | --- |
| Roles and named payloads | `types/tripCommands.ts`, `tripCommands.server.ts` | Same role/action policy, exact envelope/payload, no arbitrary state/amount patches; current SQL account/project role on every request and receipt replay |
| Active FSM | `trip.service.ts:transitionTripStatus`, `validators/trip.validator.ts:ALLOWED_TRIP_TRANSITIONS` | Legacy TripStatus graph; profile-aware graph from `operationalProfileResolver.ts`; no reuse of the seeded legacy TripEngine singleton |
| Compound RECORD_LOADING | `tripCommands.server.ts` creation branch | Dispatch then AT_ORIGIN, LOADING, WEIGHED_ORIGIN, IN_TRANSIT as separate accepted edges in one transaction |
| Operational checkpoints | `trip.service.ts:recordOperationalCheckpoint` | Loading complete only LOADING/WEIGHED_ORIGIN; unloading start only AT_DESTINATION/WEIGHED_DESTINATION; idempotent same checkpoint |
| Optional driver | `trip.service.ts:validateCanonicalTripEntities`, `associateOperationalDriver` | PRELOADED requires driver; ON_FIRST_OPERATION/MIXED permit null only when truck has no current assignment; later explicit association revalidates full canonical chain |
| Canonical participation | Same validation method; U02/U03 repositories | Global eligibility + current project membership + carrier affiliations + assignment + material allocation, scoped and locked; no project/Fleet hydration |
| Profile snapshot | `operationalProfileResolver.ts`, `operationalProfileAssessment.server.ts` | Freeze validated configuration/version, driver at dispatch, capacity estimation; later project changes affect future trips only |
| All four profiles | `profileTransitionAllowed`, `resolveOperationalWeights`, `resolveTimeMetrics` | Reuse pure graph/weights/time policies; absence remains null; derived/estimated weights are not measurements or automatically billable |
| Origin/destination measurement | `tripCommands.server.ts`, `trip.service.ts`, `weightEngine.service.ts`, `weighbridgeImport.service.ts` | Positive gross/tare/net rules, source evidence and kg normalization, append-only raw/normalized values and corrections, no fabricated destination ticket/time/variance |
| Explicit origin acceptance | Legacy `ACCEPT_ORIGIN_NET` command; capability-aware service rejects it as a measurement | Preserve audited legacy acceptance as a decision, never a measured reading; capability-aware trips retain their stricter rejection |
| Dispatch pricing | `projectPricing.server.ts:resolvePricing`, `PricingService.resolvePricingRuleFromList` | Carrier-specific, material priority/general fallback, exact UTC effective boundaries, ambiguity fail closed; bounded indexed candidates and retained pure selection |
| Commercial versioning | `ProjectPricingServerService.write`, P9-U1/U2 tests | Unused rules may change with revision; used commercial terms require copy-on-write successor and immutable predecessor terms; superseded boundary persists even for inactive successor |
| Rate and totals | `PricingService.calculateSettlement`, `commercialTotals` | PER_TRIP/PER_TON, tonne quantity rounded to 3 decimals, minimum only for positive observed quantity; subtotal then VAT then total rounded to 2 SAR decimals; final arithmetic SQL NUMERIC |
| Pending commercial facts | `dispatchImportedTrip`, `calculateSettlement` | PENDING/UNRESOLVED_PENDING without fabricated rule or zero-rate final settlement; frozen tariff terms distinct from later authorized settlement version |
| Financial adjustment | `settlementAdjustment.service.ts:requestAdjustment/approveAdjustment/recalculateTripWithAdjustments` | Request/review/approval roles and RATE/AMOUNT/OTHER/DEDUCTION semantics; append adjustment/settlement evidence preserving prior values and reason/actor |
| Exceptions | `exception.service.ts`, `validators/exception.validator.ts` | Named report command, validated type/severity/reason; immutable event, exception row and Trip exception flag in same transaction |
| Numbering | `tripNumberGenerator.ts`, server persistence counter adapter | Project-number prefix + TRP five-digit minimum sequence; database counter/uniqueness, no process-local or clock-only authority |
| Imported operational facts | `tripImportValidator`, `tripImportCommitter`, `tripDuplicateChecker`, `dispatchImportedTrip` | Reviewed immutable row evidence + source identities; typed historical facts retain observed timestamps, missing unload stays incomplete; no automatic acceptance of client legacy completed status |
| U05 seam | `db/importAuthority.ts`, `importArtifacts.ts`, `importSourceRows.ts` | Reuse immutable artifacts/inventory, mapping/correction proof and durable fenced group/receipt model; old dependency-blocked sessions without reviewed Trip evidence stay blocked and require explicit new reviewed intake |
| Atomicity/replay | `tripCommandTransaction.server.ts`, U01 UnitOfWork, U02 command boundary | Trip/events/measurements/settlements/receipt/audit/outbox commit together; lost ACK returns same scoped receipt after current authorization |
| API composition | `server/app.ts` existing Trip commands/import/receipt routes | New v2 factory remains unmounted; existing Firestore production APIs/UI/Workspace bindings unchanged |

Read ARCH-R1 Revision 1.2 sections 8.4, 17–22, current active persistence,
operational assessment, import and commercial dependencies. The old
`tripStateMachine.service.ts` uses different TripEngine states and seeded in-memory
history; it is not the active canonical Trip command FSM and will not be ported as
SQL authority. No approved contract amendment is inferred from that legacy file.

## Schema gap reconciliation

Migration 008 must make driver nullable, separate nullable pending pricing from
immutable terms and versioned settlement, add event-linked raw measurement
provenance and correction records, preserve existing external IDs/history, add
number allocation and pricing lineage/status/effective boundaries. Existing rows
must remain classified as legacy until explicitly reconciled; no invented values
or modifications to migrations 001–007. Security uses a new narrow Trip
command-authorizer capability, preserving U02/U05 role restrictions.

## Implemented command and event authority

`SqlTripAuthority` composes the existing Firebase-to-SQL authentication, UnitOfWork,
canonical identity/temporal repositories, current role policy and pure profile/FSM
policies. It accepts named commands, not arbitrary Trip patches. The new route
factory is test-only and unmounted in production. No existing Firestore service,
production route, client UI, package dependency or Workspace binding changed.

| Operation | Accepted evidence and resulting projection |
| --- | --- |
| DISPATCH_TRIP | One DISPATCHED genesis event; canonical references and configuration/tariff snapshots |
| RECORD_LOADING | DISPATCHED → AT_ORIGIN → LOADING → WEIGHED_ORIGIN → IN_TRANSIT, each edge persisted atomically |
| Live status commands | Existing legacy or frozen-profile transition graph; revision and role checked before every edge |
| COMPLETE_LOADING / START_UNLOADING | Explicit actual checkpoint; permitted source states only; repeating an existing checkpoint adds no second fact |
| ASSOCIATE_DRIVER | Explicit current canonical association, no fabricated initial driver; original driver-at-dispatch preserved |
| IMPORT_TRIP | Internal reviewed historical aggregate creation, one DISPATCHED_IMPORTED event with source-observed facts; no invented live intermediate events |
| REPORT_EXCEPTION | Validated exception plus accepted event and Trip flag in the same transaction |
| CORRECT_MEASUREMENT | Append correction pointing to prior measurement; recompute derived net with new evidence; finalized money marked for review |
| SETTLE_PRICING / approved adjustment | Explicit reason/actor/event, new immutable settlement version; no overwrite of original tariff or prior amount |

Each accepted event increments Trip revision. A deferred database trigger verifies
latest event sequence/state/encrypted-projection digest at transaction end. Another
trigger enforces contiguous event order under the Trip lock. History tables deny
UPDATE/DELETE through grants and append-only triggers. Audit and outbox failures
roll back Trip, number allocation, event, measurement, receipt and settlement.
Receipts are actor/scoped and payload-bound; replay rechecks current authorization
and driver ownership and returns the latest Trip projection, matching active
command behavior. The original committed receipt remains immutable evidence.

The inherited project advisory transaction lock establishes the same stable lock
order as U02–U05 and serializes commands within one project. Database counters and
unique project numbering remain authoritative across connections/processes.
This is bounded correctness, not a claim of unrestricted parallel project writes.
Legacy projects with Trips but no reconciled counter fail closed rather than
infer their next number. Existing IDs, numbers and history are left unchanged.

## Operational profiles and optional driver

PRELOADED_ROSTER requires the canonical driver. MIXED and ON_FIRST_OPERATION may
start without one when the truck has no current assignment. A supplied or later
associated driver must satisfy identity eligibility, current project membership,
carrier affiliation and current truck assignment. Truck/material allocation and
carrier/material participation are revalidated. A client cannot omit an already
assigned driver to evade that chain.

| Frozen profile | Loading measurement | Unloading measurement |
| --- | --- | --- |
| DUAL_WEIGHBRIDGE | Required | Required |
| LOADING_SCALE_ONLY | Required | Absent is legitimate |
| UNLOADING_SCALE_ONLY | Absent is legitimate | Required |
| NO_WEIGHBRIDGE | Absent is legitimate | Absent is legitimate |

Configuration/version, route, required checkpoints, driver policy and estimation
basis are frozen at creation. NONE, TRUCK_CAPACITY, PROJECT_STANDARD and
MATERIAL_TRUCK_MATRIX use the existing pure resolver. Estimated quantities remain
distinct from measured weight and do not become PER_TON billable evidence.
Missing measurement, variance, ticket and observed timestamp remain absent.
Actual loading/unloading checkpoints and computed route/time metrics preserve
source semantics. Legacy explicit origin-net acceptance remains an audited
human decision; capability-aware profiles keep their existing rejection of a
derived value presented as a measurement.

## Weighbridge evidence and exact units

`TripMeasurementRepository` retains source type/reference, source event/ticket,
content hash where applicable, raw value and unit, exact normalized kg, actor,
received capture time, nullable source-observed time, associated event and decision
status. Raw tare/gross and derived net remain separate facts. Gross must exceed
tare; impossible, zero/negative, excessive precision, invalid unit, incompatible
profile, time chronology and unverified source evidence fail closed.

Authenticated manual readings are explicit human authority. External live source
readings require an injected trusted verification adapter; the default refuses
unverified hardware/API/file claims. Reviewed U05 artifacts use the existing trusted
CSV/XLSX/provider-snapshot adapters. No production hardware adapter is activated.
Duplicate source events and canonical tickets have database uniqueness fences.

Manual corrections append an authorized correction pointer/reason/actor and any
new derived net; original rows cannot change. Approved source corrections preserve
original raw values/unit plus the signed source/mapping revision and correction
record, even when the corrected interpretation changes KG to TON. A canonical
entity correction clears affected resolution choices and requires an explicit new
choice and review. It never rewrites the original artifact.

Weights use numeric(18,3) KG; TON input permits six decimals and normalizes with
SQL NUMERIC. Rates use numeric(18,4); settled SAR amounts use numeric(18,2).
Source weight normalization also keeps decimal text exact until SQL conversion;
original Arabic/raw source strings remain separate immutable measurement evidence.
Monetary wire values are decimal strings. JavaScript numeric conversions are used
only by retained pure selection/validation policies, never as final money authority.

## Pricing versions, immutable terms and settlement

`TripPricingRepository` reuses PricingService selection, pricingInstant/
canonicalPricingDate and PricingRuleValidator overlap rules. It queries scoped
carrier/material-or-general candidates with LIMIT 129 and rejects over 128,
ambiguity, overlap, ineligible participation, malformed versions and a mismatched
requested rule. Database GiST active-period exclusion backs concurrent writes.
Whole-UTC-day overlap/effective endpoint semantics remain those of P9. A material
rule outranks permitted general fallback. An inactive successor does not resurrect
a superseded predecessor.

Every saved rule has an immutable exact revision. Rule usage checks include both
creation snapshots and late settlement revision references, with an indexed
settlement-terms lookup; a formerly pending Trip therefore cannot evade COW. Unused commercial edits update
the current master and append a revision; used commercial edits create a dated
successor, record predecessor/successor lineage and audit/outbox both changes.
Metadata-only edits do not create commercial successors. Current Foundation
NEW_OPERATION/MAINTENANCE/CONSISTENCY_CLEANUP policy remains authoritative,
including orphan deactivation on archived projects. Unclassified legacy rules
require reconciliation. Old missing tariff terms are not filled by later edits;
only new rules receive the existing P9 creation defaults.

Creation freezes an immutable pricing_snapshot: exact rule/revision, rate, model,
applicability, currency, effective window, VAT, minimum and waiting/free-time terms.
A later master edit cannot change it. Pending import pricing has no fake rule/rate.
`trip_settlements` holds append-only versions distinct from that original snapshot:

| Status | Meaning |
| --- | --- |
| PENDING_PRICING | No approved legally applicable tariff; financial amounts are NULL |
| PENDING_QUANTITY | PER_TON has no approved measured quantity; financial amounts are NULL |
| PROVISIONAL | Known quoted amount on an operationally incomplete historical Trip; quoted_amount retained, final_amount NULL |
| FINAL | Completed Trip with authorized tariff and required quantity; exact settled amount |

Later authorized settlement resolves pending terms at the recorded historical
pricing instant, not the newest rate. Prior approved billable waiting hours remain
part of the next settlement unless explicitly changed. Corrections never silently
reprice; requested/approved RATE, AMOUNT, OTHER and DEDUCTION adjustments preserve
prior settlements, actor and reason. RATE adjustments retain four-decimal precision.

Exact SQL rounding: for PER_TON, round(max(positive measured kg, approved minimum)
/ 1000, 3), multiply rate, round base to 2. PER_TRIP uses quantity basis 1.
Demurrage is approved billable waiting hours × frozen hourly tariff, rounded to 2.
Subtotal = round(max(0, base + demurrage − deductions + approved adjustments), 2);
VAT = round(subtotal × frozen VAT percentage / 100, 2); total = subtotal + VAT,
stored at 2 decimals. PostgreSQL NUMERIC rounding governs ties. Minimum cannot
create quantity when none was measured. Missing is not zero. Claimed waiting with
no frozen hourly tariff is rejected. P9 waitingDurationHours already means billable
hours: free-time terms are preserved, not subtracted a second time or inferred from
an observed duration. Overflow and invalid/zero rates reject without side effects.

## Durable U05 Trip seam and source proof

`SqlTripImportAuthority` specializes the existing durable session/artifact/fence/
group/receipt machinery. It exposes explicit Trip checkpoint, preview, correction,
review and start controls. Generic public IMPORT_TRIP rejects unreviewed input.
Actual frozen bytes are reparsed through U05 trusted adapters; the complete ordered
row count, physical row identity, original cell values and mapping-column evidence
are checked. Review signs the inventory, source revision, mapping, decisions,
approved corrections, resolved canonical choices and relevant configuration/terms.
Cached client proofs are never execution authority. Every group recomputes this
binding and revalidates current canonical and temporal references.

Bounds remain 8 MB source / 10,000 source rows; accepted Trip groups are bounded at
500, one Trip per stable group. A failed group cannot roll back an earlier committed
group or claim the later one committed. Stable operation IDs, binding/fence and
immutable receipts handle lost ACK and fresh-process restart. Public status keeps
the bounded U05 receipt summary; full source proof stays in the sealed receipt and
Trip evidence. Content/column/physical-row identity excludes reupload revision, so
a new session cannot import the same frozen row again. A separate canonical ticket
HMAC fence prevents repeated ticket intake across different artifacts. Textual
source identifiers, including leading zeros, are preserved.

Historical intake preserves known source status and observed times; it does not
invent a live transition history or absent loading/unloading facts. Source claims
of completion lacking required evidence fail to review-required recovery. A pending
or incomplete Trip is never made financially final merely because a rate is known.
Existing U05 sessions blocked with U06_TRIP_AUTHORITY_REQUIRED remain blocked;
without the new reviewed Trip evidence they require explicit new intake/review.
No old source-row decisions are synthesized. Source replacement clears mapping,
review and correction authority. The existing U05 real 1,000-row frozen CSV fixture
and all 71 U05 cases remain passing; no one-row source is relabeled as 1,000 rows.

## Migration 008, RLS and inactive integration

Migration 008 is additive and applied only to isolated PostgreSQL 17 test databases.
Migrations 001–007 are byte-for-byte unchanged. Migration 008 uses the repository-required
LF bytes; SHA-256: 461e1b40972b0500adf2d796acafdc5606f0538cb845ca423e8c73db75d4cce0.
The staged Git blob and the verified native migration bytes are identical. Nullable driver/pending commercial
columns preserve existing values. New tables: trip_number_counters,
trip_driver_links, pricing_rule_revisions and trip_settlements. Event/source scope,
measurement corrections, immutable snapshot and exact settlement evidence use
composite company/project FKs, indexes and database constraints. Additive FKs on
existing tables are NOT VALID to preserve unverified legacy rows while enforcing
new writes; new-table FKs are validated. authority_schema NULL classifies old Trips
for explicit reconciliation; current commands reject them rather than fabricate
projections. Existing external IDs/history are neither deleted nor reminted.

New tenant tables use ENABLE/FORCE RLS; Trip domain tables add restrictive project
RLS for runtime. Narrow security-definer authorization is owned by the existing
NOLOGIN capability role with fixed search_path. It locks current account/company/
project/roles/access and driver link, checks role validity and returns trusted SQL
role/timezone. Runtime cannot provision driver links or mutate account/configuration
records. Trip action policy and linked ownership remain separate checks, including
receipt readback after revocation. No generic SQL endpoint is introduced.

The SQL route factory is guarded by NODE_ENV=test and the explicit isolated-test
flag. Production app.ts never imports it. No Firestore code, React UI, worker,
report query, production source provider, database selector, dual-write path or
Workspace behavior changes. A secret-free PostgreSQL 17 CI job is prepared with
job-private ephemeral service and separated roles. It has not run remotely on
this feature branch (existing workflow triggers remain main/PR); local native
results below are not presented as CI acceptance.

## Native PostgreSQL and concurrency verification

Native PostgreSQL 17.6 on Windows loopback, isolated database
qsaudi_u06_publish, separate qsa_migrator/qsa_auth/qsa_runtime connections;
Node 22.22.0 and npm 10.9.8. No mocked SQL acceptance or skipped native cases.

| Suite | Passed / failed / skipped |
| --- | --- |
| U06 Trip/pricing | 107 / 0 / 0 |
| U06 24/100/1,000 performance | 1 / 0 / 0 |
| U01 SG1 / connection cleanup / infrastructure | 36 + 6 + 13 / 0 / 0 |
| U02 canonical identity/membership | 55 / 0 / 0 |
| U03 temporal relationships | 63 / 0 / 0 |
| U04 bounded reads / presentation session | 34 + 11 / 0 / 0 |
| U05 durable import and RB1 | 71 / 0 / 0 |
| Total unique native cases | 397 / 0 / 0 |

Infrastructure backup/restore passed in 9.237 seconds after a durable CHECKPOINT;
no timeout/fsync weakening. The native suite covers same-operation and independent
operation dispatch races, unique sequence allocation, stale two-client loading,
arrival/unloading, cancellation/completion, pricing COW and duplicate ticket races.
Each conflicting outcome asserts unchanged or singly committed business evidence.
Lost HTTP ACK, current authorization on replay, fresh Node-process reconstruction,
U05 partial/restart recovery, raw corrections, all profiles, exact commercial
formulas, cross-company/project RLS and audit/outbox rollback passed.
Only old-test migration inventory expectations changed from 7 to 8; no historical
cases or checksum tamper checks were removed or weakened.

Native reproducibility, with the isolated URLs and role provisioning from the U01
runbook (never point these commands at production):

```sh
npx tsx src/db/migrator.ts
npx vitest run --no-file-parallelism src/tests/ar2U01SecurityGate.test.ts src/tests/ar2U01ConnectionCleanup.test.ts src/tests/ar2U02CanonicalIdentityMemberships.test.ts src/tests/ar2U03TemporalAuthority.test.ts src/tests/ar2U04BoundedReads.test.ts src/tests/ar2U04PresentationSession.test.ts src/tests/ar2U05DurableImport.test.ts src/tests/ar2U06TripsPricing.test.ts src/tests/ar2U06TripPerformance.test.ts
npx vitest run src/tests/ar2U01PostgresInfrastructure.test.ts
```

## Local performance evidence

Intel i7-6600U @ 2.60 GHz, 4 logical CPUs, 23.88 GiB RAM; native PG17.6, HTTP loopback,
3 warmups then 40 dispatch requests per size, concurrency 4. Synthetic histories
have 9 ordered events plus measured origin evidence per archived Trip and retain
explicit legacy classification. They test query growth, not migrated-history
acceptance. All current dispatches use the real authenticated SQL authority.

| Trucks | Archived Trips / events | Command SQL | Total protocol calls/request | HTTP p50 / p95 ms | Body transaction p95 ms | Events / audit / outbox | Repeat creates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 24 | 23 / 207 | 25–25 | 50 | 86.33 / 238.14 | 98.88 | 40 / 40 / 40 | 0 |
| 100 | 99 / 891 | 25–25 | 50 | 76.96 / 126.02 | 29.58 | 40 / 40 / 40 | 0 |
| 1000 | 999 / 8991 | 25–25 | 50 | 80.25 / 226.49 | 32.98 | 40 / 40 / 40 | 0 |

Body transaction duration is the executeWithin interval, excluding authentication,
project-lock waiting and transaction cleanup; HTTP latency includes these costs.
Total protocol calls include authentication and connection-context setup/cleanup,
not just the body query counter. Query count remains constant as history grows;
latest-event checks use indexed sequence lookup, not full-history counts. Candidate
and provenance reads are bounded. This is local evidence, not production/browser
performance acceptance or a throughput guarantee under project-lock contention.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON), actual final fixture:

| Query | Plan | Actual rows | Shared hit/read blocks | Execution ms |
| --- | --- | --- | --- | --- |
| Pricing candidate LIMIT 129 | Limit → Index Scan `pricing_external_identity` | 1 | 2 / 0 | 0.034 |
| Measurement provenance LIMIT 51 | Limit → Index Scan `trip_weight_page` | 3 | 3 / 0 | 0.025 |

## Baseline versus final assurance

Baseline is a clean detached worktree at exact main
365134064ad790377cd0bc2c2b58c0044ce7952a, with the identical Node 22.22.0/npm
10.9.8 toolchain and locked dependencies. The final run contains the same 53-file,
1,241-case inventory. Case-by-case file/fullName/status comparison: zero changes.
This selection is broader than the historical U05 observation; its counts were
remeasured, not copied from that earlier report.

| Check | Baseline | Final |
| --- | --- | --- |
| Selected Trip/P9/profile/P8/auth regressions | 1,185 pass / 56 fail / 0 skip | 1,185 pass / 56 fail / 0 skip |
| Existing unhandled rejection | 1, projectContextLifetime: A failure | Same 1 |
| Explicit 148 authority bundle, run separately | Historical reference only | 148 pass / 0 fail / 0 skip |
| npm run lint (tsc --noEmit) | Exit 2; 446 diagnostics | Exit 2; same 446; no added diagnostic/path/message |
| npm run build | PASS | PASS (Vite 27.25 s; server bundle built) |
| git diff --check | Clean starting tree | PASS |

Existing build chunk-size warnings remain. Lint is not claimed passing. The 56
baseline failures are reproduced by file and test name in the appendix. No case
was removed, renamed or skipped to obtain parity. Native 397/397 results are
separate from these historical non-SQL regressions. The explicit authority command
is deliberately executed separately even though its files occur in the selection:

```sh
npx vitest run --no-file-parallelism src/tests/reviewedRosterCommitP8B2.test.ts src/tests/rosterExecutionRecoveryP8B3.test.ts src/tests/temporalRelationshipAuthority.test.ts src/tests/txReadCacheCorrectness.test.ts
npm run lint
npm run build
git diff --check
```

Exact 53-file comparison command (same invocation at baseline and final):

```sh
npx vitest run --no-file-parallelism \
  src/tests/authProfileContinuity.test.ts \
  src/tests/authProviderContinuity.test.tsx \
  src/tests/canonicalTripPersistenceBoundaryConvergenceUnit6A.test.ts \
  src/tests/durableImportSessionP8B1.test.ts \
  src/tests/fieldLoadingUnloadingBlock77.test.ts \
  src/tests/foundationMaintenancePfagRb2.test.ts \
  src/tests/foundationMaintenanceUiPfagRb2.test.tsx \
  src/tests/foundationSafetyPfagRb1.test.ts \
  src/tests/importSessionClientAuthRecovery.test.ts \
  src/tests/loadingOperatorConvergence.test.ts \
  src/tests/operationalProfileAssessment.test.ts \
  src/tests/operationalProfileProjection.test.ts \
  src/tests/operationalProfileUi.test.tsx \
  src/tests/operationalProfiles.test.ts \
  src/tests/pricingAuthorityP9U1.test.ts \
  src/tests/pricingCommercialVersioningP9U2.test.ts \
  src/tests/pricingEngine.test.ts \
  src/tests/profileContinuityUi.test.tsx \
  src/tests/projectActivationReadiness.test.ts \
  src/tests/projectCanonicalRefreshBarrierA11.test.ts \
  src/tests/projectContextLifetime.test.tsx \
  src/tests/projectDriverTruckAssignmentFoundation.test.ts \
  src/tests/projectFleetReadModelAdminReadContext.test.ts \
  src/tests/projectFleetReadModelFoundation.test.ts \
  src/tests/projectReadinessAdminReadContext.test.ts \
  src/tests/reviewedRosterCommitP8B2.test.ts \
  src/tests/rosterBulkGlobalReuse.test.ts \
  src/tests/rosterCanonicalIntentP7B3.test.ts \
  src/tests/rosterExecutionRecoveryP8B3.test.ts \
  src/tests/rosterIdentityGroupingProvenanceSiCg1.test.ts \
  src/tests/rosterMaterialBindingContinuity.test.ts \
  src/tests/rosterResumeJourneyP8B4.test.ts \
  src/tests/rosterResumeStageReconciliation.test.ts \
  src/tests/serverAuthenticationTrustBoundary.test.ts \
  src/tests/setupFleetQuery.test.ts \
  src/tests/setupFleetWorkspace.test.tsx \
  src/tests/setupReadinessBoundary.test.ts \
  src/tests/setupReadinessPresentation.test.tsx \
  src/tests/setupWizardContinuity.test.tsx \
  src/tests/smartImportCommitIntegrityConvergence.test.ts \
  src/tests/smartImportGlobalCanonicalSnapshotBoundary.test.ts \
  src/tests/smartImportServerCanonicalCommitContractC1.test.ts \
  src/tests/smartImportTripWriteFailureIntegrity.test.ts \
  src/tests/smartTripImportOperationalConvergence.test.ts \
  src/tests/temporalRelationshipAuthority.test.ts \
  src/tests/tripIdentityAdjustmentBlock89.test.ts \
  src/tests/tripIntakeConvergence.test.ts \
  src/tests/tripMutationBoundary.test.ts \
  src/tests/tripOperationalCommands.test.ts \
  src/tests/tripOperationalOutbox.test.ts \
  src/tests/tripSmartImportOptionalTimeMapping.test.ts \
  src/tests/txReadCacheCorrectness.test.ts \
  src/tests/weighbridgeImport.test.ts
```

## Exact changed files

- `.github/workflows/ci-foundation.yml`
- `docs/reconstruction/12_AR2_U06_TRIPS_WEIGHBRIDGE_PRICING.md`
- `server/sqlTripRoutes.ts`
- `src/db/canonicalAuthority.ts`
- `src/db/importAuthority.ts`
- `src/db/migrations/008_trips_weighbridge_pricing_authority.sql`
- `src/db/tripAuthority.ts`
- `src/db/tripContracts.ts`
- `src/db/tripImportAuthority.ts`
- `src/db/tripImportSourceRows.ts`
- `src/db/tripMeasurementRepository.ts`
- `src/db/tripPricingRepository.ts`
- `src/db/tripSettlementRepository.ts`
- `src/tests/ar2U01SecurityGate.test.ts`
- `src/tests/ar2U02CanonicalIdentityMemberships.test.ts`
- `src/tests/ar2U03TemporalAuthority.test.ts`
- `src/tests/ar2U04BoundedReads.test.ts`
- `src/tests/ar2U05DurableImport.test.ts`
- `src/tests/ar2U06TripPerformance.test.ts`
- `src/tests/ar2U06TripsPricing.test.ts`

The five historical test-file changes only extend expected migration inventory/count
from 001–007 to 001–008. No credentials, PII, dump, raw source, runtime binary or
generated build/test artifact is included. Local JSON/log evidence lives outside
the repository; the exact acceptance results and reproduction commands are retained
in this record. The focused feature commit is a direct child of the verified main;
its identity and remote confirmation are supplied in the final publication report.

## Remaining activation debt and review state

Existing TypeScript/regression debt remains as itemized below; this unit does not
claim a green repository baseline. Unclassified legacy Trip/pricing rows, historical
number counter reconciliation, production driver-link provisioning, trusted live
weighbridge/provider adapter configuration, secret/key management and production
operational-configuration population remain explicit activation dependencies.
The scoped project lock, bounded candidate/group limits and local benchmark require
production workload assessment before cutover. U07/U08/U09 reporting/worker/UI and
cutover adoption remain outside this unit. No SQL production activation, PR, merge,
deployment, Workspace mutation or U07 work was performed. U06 is prepared for
independent source review, not marked closed or owner-accepted.

## Baseline failure reproduction appendix

The same selected cases are executed at authoritative main and the feature branch.
Use Node 22.22.0/npm 10.9.8 with npm ci and run each file below. Test names identify
every failing case; these cases are not skipped or altered. The first failure line
is included without copying entire source snapshots into this record.

### `authProviderContinuity.test.tsx`

```sh
npx vitest run src/tests/authProviderContinuity.test.tsx
```

1. **actual Provider ignores cached absence, preserves mounted workflow on read/watch failure and refreshes on reconnect**

   `TypeError: fx.watch is not a function`

### `operationalProfileUi.test.tsx`

```sh
npx vitest run src/tests/operationalProfileUi.test.tsx
```

2. **owner-approved user-active synchronization requests one global pass with throttle and cleans up when administrator readiness is lost**

   `AssertionError: expected "vi.fn()" to be called with arguments: []`

### `projectActivationReadiness.test.ts`

```sh
npx vitest run src/tests/projectActivationReadiness.test.ts
```

3. **ProjectLifecycleService Governance & Audit Tests Scenario M: Direct status mutation via projectService.updateProject is blocked and fails**

   `Error: expected [Function] to throw error including 'لا يمكن تعديل حالة دورة حياة المشروع …' but got 'Failed to parse URL from /api/project…'`

### `projectCanonicalRefreshBarrierA11.test.ts`

```sh
npx vitest run src/tests/projectCanonicalRefreshBarrierA11.test.ts
```

4. **FOUNDATION A1.1 — Immediate Canonical Refresh Barrier 35. No page reload is used**

   `AssertionError: expected 'import {GlobalRegistryEnrollment} fro…' not to contain 'window.location.reload()'`

### `projectDriverTruckAssignmentFoundation.test.ts`

```sh
npx vitest run src/tests/projectDriverTruckAssignmentFoundation.test.ts
```

5. **PHASE 6 — UNIT 2B-2: Project Driver ↔ Truck Temporal Assignment Foundation Test Suite GROUP K: Boundaries & Legacy Invariance 51. Production assignment callers zero: only services, repositories, and test files reference assignDriverToTruck**

   `AssertionError: expected [ …(4) ] to deeply equal []`

### `rosterIdentityGroupingProvenanceSiCg1.test.ts`

```sh
npx vitest run src/tests/rosterIdentityGroupingProvenanceSiCg1.test.ts
```

6. **SI-CG1 partial mapping and source provenance absent Material yields no group, default, allocation or close**

   `AssertionError: expected [ { …(2) } ] to deeply equal []`

### `setupReadinessBoundary.test.ts`

```sh
npx vitest run src/tests/setupReadinessBoundary.test.ts
```

7. **P6-B2 separation and controlled functional journey activation rechecks Setup integrity outside the selected operational candidate at commit time**

   `Error: expected AssertionError: expected false to be true… { …(4) } to match object { code: 'PROJECT_SETUP_NOT_READY' }`

8. **P6-B2 separation and controlled functional journey operational prerequisites cannot override invalid Foundation Setup**

   `AssertionError: expected false to be true // Object.is equality`

### `setupWizardContinuity.test.tsx`

```sh
npx vitest run src/tests/setupWizardContinuity.test.tsx
```

9. **P6-B1 manual intake continuity uses the canonical Material name and full refresh before resetting the form**

   `AssertionError: expected "vi.fn()" to be called 2 times, but got 7 times`

10. **P6-B1 Foundation and Global governance presentation keeps the successful canonical Foundation reread visible while the project subscription is delayed**

   `AssertionError: expected undefined to be true // Object.is equality`

11. **P6-B1 Foundation and Global governance presentation Foundation refresh failure keeps a receipt; retry never repeats the Project command**

   `AssertionError: expected 'projects.batch4.back_to_projectsExamp…' to contain 'projects.messages.changes_saved'`

12. **P6-B1 Foundation and Global governance presentation PROJECT_ADMIN sees only its authorized Global profile controls**

   `AssertionError: expected [ …(1) ] to have a length of +0 but got 1`

### `smartImportCommitIntegrityConvergence.test.ts`

```sh
npx vitest run src/tests/smartImportCommitIntegrityConvergence.test.ts
```

13. **Smart Import Commit Integrity Convergence Test Suite 39. report states server canonical snapshot authority holds true**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'serverTripService.dispatchImportedTrip'`

### `smartImportGlobalCanonicalSnapshotBoundary.test.ts`

```sh
npx vitest run src/tests/smartImportGlobalCanonicalSnapshotBoundary.test.ts
```

14. **Global Canonical Snapshot Read Boundary (Unit 5) 38. committer calls snapshot client after canonical IDs resolve**

   `AssertionError: expected "getTripCanonicalSnapshot" to be called with arguments: [ 'PRJ-1', …(1) ]`

15. **Global Canonical Snapshot Read Boundary (Unit 5) 39. committer uses returned carrierSnapshot exactly**

   `AssertionError: expected "create" to be called with arguments: [ ObjectContaining{…} ]`

16. **Global Canonical Snapshot Read Boundary (Unit 5) 40. committer uses returned truckSnapshot exactly**

   `AssertionError: expected "create" to be called with arguments: [ ObjectContaining{…} ]`

17. **Global Canonical Snapshot Read Boundary (Unit 5) 41. committer uses returned driverSnapshot exactly**

   `AssertionError: expected "create" to be called with arguments: [ ObjectContaining{…} ]`

18. **Global Canonical Snapshot Read Boundary (Unit 5) 42. committer uses returned materialSnapshot exactly**

   `AssertionError: expected "create" to be called with arguments: [ ObjectContaining{…} ]`

19. **Global Canonical Snapshot Read Boundary (Unit 5) 45. successful snapshot allows Trip write**

   `AssertionError: expected "create" to be called at least once`

20. **Global Canonical Snapshot Read Boundary (Unit 5) 46. written Trip uses final reviewed canonical IDs**

   `AssertionError: expected "create" to be called with arguments: [ ObjectContaining{…} ]`

21. **Global Canonical Snapshot Read Boundary (Unit 5) 48. no fabricated snapshot defaults reintroduced**

   `TypeError: Cannot read properties of undefined (reading '0')`

### `smartImportServerCanonicalCommitContractC1.test.ts`

```sh
npx vitest run src/tests/smartImportServerCanonicalCommitContractC1.test.ts
```

22. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 8. Server validates project existence and non-archived status**

   `Error: expected [Function] to throw error including 'ARCHIVED' but got 'INVALID_COMMERCIAL_TERMS'`

23. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 17a. Server app route rejects client tripId with HTTP 400 and prevents dispatch/persistence**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'req.body.tripId !== undefined'`

24. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 17b. Server app route rejects client tripNumber**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'req.body.tripNumber !== undefined'`

25. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 18. Server app route rejects client pricingSnapshot**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'req.body.pricingSnapshot !== undefined'`

26. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 19. Server app route rejects client financials**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'req.body.financials !== undefined'`

27. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 20. Server app route rejects client settlementAmount**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'req.body.settlementAmount !== undefin…'`

28. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 21. Server app route rejects client canonical entity snapshots**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'req.body.carrierSnapshot !== undefined'`

29. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 22. Server generates tripId on dispatchImportedTrip**

   `Error: INVALID_COMMERCIAL_TERMS`

30. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 23. Server generates tripNumber on dispatchImportedTrip**

   `Error: INVALID_COMMERCIAL_TERMS`

31. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 24. Server builds canonical snapshots authoritatively**

   `Error: INVALID_COMMERCIAL_TERMS`

32. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 25. Imported ticket preserved in weights.originTicketNo**

   `Error: INVALID_COMMERCIAL_TERMS`

33. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 26. Imported date preserved in sourceMetadata / weights**

   `Error: INVALID_COMMERCIAL_TERMS`

34. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 27. Imported origin tare preserved**

   `Error: INVALID_COMMERCIAL_TERMS`

35. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 28. Imported origin gross preserved**

   `Error: INVALID_COMMERCIAL_TERMS`

36. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 29. Imported origin net preserved or deterministically recomputed**

   `Error: INVALID_COMMERCIAL_TERMS`

37. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 30. Imported destination net preserved when valid**

   `Error: INVALID_COMMERCIAL_TERMS`

38. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 31. Import source metadata preserved**

   `Error: INVALID_COMMERCIAL_TERMS`

39. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 32. importBatchId provenance preserved**

   `Error: INVALID_COMMERCIAL_TERMS`

40. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 33. sourceRowId provenance preserved**

   `Error: INVALID_COMMERCIAL_TERMS`

41. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 34. Deterministic clientUUID accepted**

   `Error: INVALID_COMMERCIAL_TERMS`

42. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 35. Idempotent replay route exists in server/app.ts**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'idempotentReplay: true'`

43. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 36. Resolved pricing generated server-side when rule exists**

   `Error: INVALID_COMMERCIAL_TERMS`

44. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 38. Arbitrary imported status cannot bypass canonical status rules**

   `Error: INVALID_COMMERCIAL_TERMS`

45. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 39. Server route calls serverTripService.dispatchImportedTrip**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'serverTripService.dispatchImportedTrip'`

46. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 41. No client tripRepository persistence in server route app.ts**

   `AssertionError: expected 'import {WorkspaceProvisioningOrchestr…' to contain 'import { serverTripService'`

47. **SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 45. Trip number generator used on server path**

   `Error: INVALID_COMMERCIAL_TERMS`

### `smartTripImportOperationalConvergence.test.ts`

```sh
npx vitest run src/tests/smartTripImportOperationalConvergence.test.ts
```

48. **Step 4A-RECOVERY — Smart Trip Import Operational Convergence 2. Unauthorized field roles remain blocked by the existing role guard**

   `AssertionError: expected 'import { filterProjectScope } from \'…' to contain 'غير مصرح بالدخول (Unauthorized)'`

49. **Step 4A-RECOVERY — Smart Trip Import Operational Convergence 23. Unresolved scope renders neither import child nor allows empty ID commits**

   `AssertionError: expected 'import { filterProjectScope } from \'…' to contain 'تحديد نطاق المشروع مطلوب'`

### `tripIntakeConvergence.test.ts`

```sh
npx vitest run src/tests/tripIntakeConvergence.test.ts
```

50. **Step 3C — Trip Ingestion Entry Convergence 2. Project access governance remains available through the canonical ACCESS layer**

   `AssertionError: expected 'import {GlobalRegistryEnrollment} fro…' to contain 'PROJECT_SETUP_LAYERS.map((layer) => {'`

51. **Step 3C — Trip Ingestion Entry Convergence 4. ExcelCsvImportSection correctly references and uses ExcelCsvPipelineService**

   `AssertionError: expected 'import { acceptedSourceRevision, prep…' to contain 'ExcelCsvPipelineService.applyEntityRe…'`

52. **Step 3C — Trip Ingestion Entry Convergence 9. Entity resolution decisions route through standard ExcelCsvPipelineService path**

   `AssertionError: expected 'import { acceptedSourceRevision, prep…' to contain 'ExcelCsvPipelineService.applyEntityRe…'`

53. **Step 3C — Trip Ingestion Entry Convergence 10. Explicit entity creation utilizes entityResolutionCommandService**

   `AssertionError: expected 'import { acceptedSourceRevision, prep…' to contain 'entityResolutionCommandService.create…'`

### `tripOperationalCommands.test.ts`

```sh
npx vitest run src/tests/tripOperationalCommands.test.ts
```

54. **Dispatch/loading reuse canonical relationships and FSM atomically DISPATCHER dispatch uses canonical identities, pricing and snapshots**

   `Error: ALLOCATION_POINTER_CORRUPTION`

55. **Dispatch/loading reuse canonical relationships and FSM atomically SCALE_OPERATOR loading executes all FSM edges and derives weights, never cached financials**

   `Error: ALLOCATION_POINTER_CORRUPTION`

56. **Import command preserves the existing domain seam reuses canonical imported-trip creation without trusting supplied actor metadata**

   `Error: ALLOCATION_POINTER_CORRUPTION`
