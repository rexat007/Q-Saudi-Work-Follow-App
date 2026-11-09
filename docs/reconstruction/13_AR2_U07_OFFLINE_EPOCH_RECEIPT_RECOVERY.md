# AR2-U07 — Offline continuity, epoch fencing and receipt recovery

> Current correction: AR2-U07-RB1 below supersedes the original causal-order and
> generic completeness assumptions. Existing server APIs provide no complete-
> inventory witness; this cache path is now upsert-only. Production SQL stays inactive.

## Verified source preflight and boundary matrix (before implementation)

Starting main: `7ce8f7827e6e9a037a8010791c4ee69170d868ff`; origin/main exact,
PR #96 merged. Main push run 42534956929 / PostgreSQL job 128897098052 is successful,
including the SQL 425-case selection and separate 148 authority bundle. Initial
worktree clean. Dedicated branch: `reconstruction/ar2-u07-offline-epoch-receipt-recovery`.
Published migrations 001–009 and existing U04/U05/U06 authorities are retained.
Read ARCH-R1 Rev1.2 sections 8.5, 9, 10, 18.3/18.5, 19–22 and OFFLINE_MODEL.md,
whose historical body is not current implementation authority.

| Area / source | CURRENT | TARGET | PRESERVED | DEFERRED |
| --- | --- | --- | --- | --- |
| OutboxService + tripCommandClient | Common legacy outbox, status-only send filtering, current Firebase token at send | UID guard on shared legacy boundary; separate scoped SQL records/explicit inactive transport using existing named commands | Existing Firestore HTTP route, translation, UI and legal server FSM | U09 selection/composition |
| IndexedDBService | DB v2, ten retained stores, entity-only keys, generic memory fallback | Add scoped SQL journal/cache/control stores in same DB, transaction-complete writes and CAS leases; SQL durability refuses memory fallback | All old stores/keys/data and legacy CRUD contracts | Explicit legacy evidence review, no automatic conversion |
| Interrupted SENDING / retries | Process Boolean, FAILED count <5, no restart receipt read | Durable fence/lease, receipt-first uncertain/restarted work, same UUID/hash and bounded attempts | Stable existing server idempotency effects | No assumption timeout means rollback |
| offlineCacheService | Supplied list deletes omitted legacy rows; shared entity keys; fabricated cache defaults | SQL-only scoped safe DTO cache; partial upsert only, complete/revision/generation proof required for replacement | Legacy Firestore reconciliation semantics and active consumers | No SQL page sent to legacy reconcileStore; U09 legacy purge policy |
| Context / authContext / lifetime | Firebase token and ProjectContextLifetime; legacy global cache visibility | Verified current principal scope + generation abort; actor/company/project/epoch/device isolation and current server authorization | Existing auth lifecycle and React routes | Protected data endpoints and production activation |
| networkStatus / offline UI | Online event triggers legacy sync, no polling timer | Event/request-driven SQL coordinator, explicit wake only, retry cap/backoff/Retry-After and durable stop | Existing OutboxDrawer/ConflictModal/Indicator, Firestore behavior | SQL live UI wiring before U09 forbidden |
| conflictResolution | Cached conflict suggestions and mutable legacy retry payload | SQL immutable submitted intent; domain errors require explicit review/new operation, no LWW | Legacy UI suggestions remain presentation, not SQL authority | Reviewed re-authoring after conflict, no silent payload rewrite |
| SQL receipt authorities | Trip scoped receipt returns current safe Trip; U05 paged status/groups; canonical receipts internal | Necessary authenticated isolated recovery read binding operation/request digest/actor/scope; epoch readback server-configured | Internal full receipts and existing DTO redaction, U05 group/status contract | No invented generic canonical mutation endpoint |
| Numbering / pricing / profile | Legacy offline prerequisites require driver/rate; local caches include guesses | SQL intent accepts existing optional-driver/profile/pending-pricing commands; no local business finalization | All four server profiles and exact SQL settlement | No estimated measurement, local Trip number or local final amount |

## Implementation and verification

Source implementation is prepared on the dedicated branch. Acceptance results are
recorded below. U07 is not CLOSED: independent GitHub review and owner merge remain
required. This is not live production UI acceptance.

## Indispensable authority-side gap: shared epoch fencing

Source audit found no SQL epoch/canonical-store registry (only U04 response strings
and the fixed U06 Trip epoch). An HTTP middleware comparison alone cannot fence
an old process that already passed the check when another process advances epoch.
Migration 010 therefore adds only an inactive singleton metadata registry and narrow
security-definer read/assert capabilities. New isolated SQL writers opt into a
transaction-held shared lock; an operator's forward-only epoch UPDATE waits for
in-flight writers and then excludes stale writers. Runtime cannot update the registry.
Initial metadata is Firestore / revision 0; no production setting is read or changed.
Existing production Firestore and unmounted legacy SQL test compositions are retained.
U09 must require this fence for every activated SQL writer and retire legacy writers.
No schema or business-data migration is required beyond this independently justified
metadata contract; published 001–009 stay untouched.


## Client composition and durable contract

`SqlOfflineCoordinator` and `SqlOfflineHttpTransport` are deliberately inactive
composition seams inside the existing application's offline layer. Nothing imports
or constructs them from production React, `app.ts`, `sendTripCommand`, Firebase
selection, PWA startup or Workspace. A future authorized owner injects the current
verified Firebase UID callback, per-request token provider and transport, calls
`enter(companyId, projectId)`, then explicitly invokes `enqueue`, `wake`, `list`,
`cache`, `exit` and review actions. `bindOnline` only adds/removes one event listener;
there is no constructor I/O, interval, background scanner or automatic fallback.
An online event does not itself supply authority. U09 must wire logout/project
lifetime into this seam before activation; this unit tests that wiring in isolation.

The journal reuses the six-field U06 envelope, not a second business command
language: operationId, expectedRevision, backendEpoch, payloadSchemaVersion,
command and allowlisted payload. The record additionally binds verified UID,
company, external project identity, persisted UUID device correlation, server epoch
revision, creation time, immutable SHA-256 request identity, queue version,
attempt/recovery counts, next-attempt time and lease. The digest is an integrity
check, not browser authorization. Server stored receipt HMACs bind the original
actor/project/envelope; all current SQL authorization is repeated at recovery.
A device identifier is never an authorization credential. No token, encryption key,
canonical profile or browser role is persisted.

Trip payloads reuse existing command allowlists, exclude IMPORT_TRIP and cannot
provide a Trip number, commercial settlement or role. Optional driver and absent
pricing reference remain valid intent; all four operational profiles remain server
business rules. No measurement is inferred from capacity. SQL import work captures
only an existing reviewed session, parent operation, expected version, reviewed
signature and frozen source/mapping revisions. Initial session creation, mapping,
review and materialization remain U05 responsibilities. A group advance has its
own durable request UUID while retaining the parent import operation identity.

## IndexedDB v3 and migration

Database name remains `q_saudi_logistics_offline_db`. Version 3 adds sqlCommands,
sqlCache and sqlControl without resetting any of the ten v2 stores. Legacy keys
and payloads remain unchanged. SQL command/cache keys include principal, company,
project, device and epoch/revision; entity kind and entity ID complete cache keys.
Indexes cover scope/principal, command owner and compound scope/status. Idle wake
reads only bounded runnable-state indexes, so acknowledged history does not hide
new pending work. RB1 persists a deterministic sequence and uses bounded 100-record metadata
chunks for compatibility discovery and fair sequence scheduling; journal listing
remains bounded to 101 rows. It no longer concatenates runnable-status buckets. A paginated full journal
viewer remains future presentation work, not automatic background scanning.

SQL persistence calls real getDB directly and refuses the legacy memory fallback.
Promises resolve at transaction completion. Journal ACK and safe Trip cache upsert
share one transaction; scope revocation, principal revision and cache purging share
another. Status updates compare immutable command identity and lease ownership.
Cache reads validate principal revision inside the same IndexedDB transaction.
Version-change closes the old connection; blocked upgrade fails explicitly.

Old Firestore commands remain legacy evidence. They are never migrated into SQL,
assigned new SQL IDs, reinterpreted or replayed automatically after an epoch change.
The independently necessary shared legacy boundary filters outbox views/replay/retry
by current UID, captures the replay actor and checks it before and after transport.
The existing token helper now verifies the expected UID and checks again after
asynchronous token acquisition. Late ACKs cannot populate a new account's cache.
Legacy same-actor Firestore command validation, APIs, numbering and conflict behavior
are preserved. Its interrupted SENDING records are not falsely treated as SQL
receipts; operator review remains required before cutover.

## Durable state machine, concurrency and errors

PENDING is persisted before send; a transactional lease changes it to SENDING.
An unknown result becomes AWAITING_RECEIPT. A restarted SENDING record first waits
for lease expiry and then performs receipt recovery. Only a matching COMMITTED
proof changes it to SYNCED. NOT_COMMITTED permits the same immutable operation UUID
to be resent. IN_PROGRESS retains uncertainty. No timeout is treated as rollback.

Leases last 15 seconds, include a per-instance random owner and incrementing fence,
and are acquired atomically in IndexedDB. A stale sender cannot overwrite a newer
ACK. SQL project locks and operation receipts remain the exactly-once business
effect boundary even if a process is interrupted or a lease expires. No
BroadcastChannel broadcasts command payloads or cross-account evidence.

| Condition | Durable result / action |
| --- | --- |
| 401 | Scope quarantine, abort generation, purge current principal cache; no account registration |
| 403 | Block/review then exit/purge; no blind retry |
| Semantic/revision 409 | CONFLICT; explicit review, no LWW |
| Epoch mismatch | QUARANTINED_EPOCH; never rewritten or auto-resumed |
| Invalid 422 / bad receipt binding | REVIEW_REQUIRED |
| 429 / 503 / transport uncertainty | AWAITING_RECEIPT, receipt-first next attempt |
| COMMITTED | Atomic SYNCED + allowlisted cache projection, no more polling |
| Recovery budget exhausted | REVIEW_REQUIRED; durable stop, explicit recovery only |

At most three sends and three automatic recovery attempts are allowed. Backoff is
exponential, capped at 30 seconds, and honors a longer Retry-After. No timer wakes
work automatically: explicit wake/online events must also pass nextAttemptAt.
An HTTP request has a 10-second abort deadline. Cancellation is permitted only
before any submission; it cannot erase a committed effect. Explicit scope resume
revalidates authorization and preserves the original command; transport-budget
recovery does not change its UUID, payload, signature or revision. Conflicts and
epoch quarantine cannot be automatically reactivated.

## Receipt and server authority proof

The isolated route factory requires test/isolation mode and matching immutable
server-composition epoch fences for every supplied writer. It is not mounted by
production. Context readback authenticates the current UID and SQL project role,
reads the shared registry and refuses Firestore/inactive metadata. HTTP epoch
headers are a compatibility guard; the transaction-held database lock is the real
cross-process fence. Runtime has no registry mutation privilege. Forward-only
updates reject a lower/equal revision and PostgreSQL-to-Firestore rollback.

Trip recovery compares current authorization/driver ownership, original actor,
scoped receipt HMAC and envelope identity, and returns the existing safe RB1 Trip
DTO. A project transaction lock makes absence a proof of no earlier in-flight
command at that serialization point. A subsequent same-ID execution still uses
the existing idempotency gate. Canonical membership, affiliation, assignment and
allocation expose bounded read-only receipt metadata for existing commands,
without accepting new canonical write payloads or returning profiles.

U05 recovery verifies the original FENCE request HMAC plus reviewed signature,
source revision and mapping revision. A committed FENCE receipt only proves work
acquisition. ACK requires the matching encrypted import_execution_receipts row,
its result hash, binding hash and reviewed/source/mapping identity. A matching
uncommitted READY group under its original fence may retry the same advance;
otherwise recovery reports IN_PROGRESS or rejects the binding. Full encrypted
internal receipts, source provenance and U05 execution/recovery remain intact.
A fresh authority instance can recover solely from durable SQL evidence.

## Scoped snapshots and stale-response fencing

Enter invalidates the prior generation and aborts outstanding transport. Account
logout additionally increments a persisted principal revision, quarantines pending
commands and purges safe cached projections, fencing other live tabs too. A new
principal cannot list, acknowledge or resume the old account's records. Company,
project, epoch and device are key dimensions rather than display-only metadata.
Current account, role, project access and linked-driver ownership are checked
again by SQL; cached facts cannot grant permission.

Inventory tickets bind current session/generation, entity kind, numeric source
revision and the exact cursor chain. At most 50 items per page are allowed.
`acceptBoundedPage` directly adapts the existing U04 BoundedProjectPage DTO,
checks its project/epoch, preserves membership/global status and relationship IDs,
and always treats it as partial, including its last page. A real native SQL page
is exercised through browser IndexedDB. Partial/filtered/interrupted pages only
upsert, never delete absent entities.
RB1 disables omission deletion entirely: no existing server API provides the
required trusted, scope-bound complete-inventory witness. Caller fullSnapshot and
completeThrough values, even matching ones, authorize no deletion. Older inventory watermarks and higher entity revisions
cannot be overwritten by a later stale response. ACK-derived Trip cache entries
have an entity revision, not a general inventory watermark. RB1 never deletes them
or other omitted records from this path. Entity
revisions and inventory source revisions are compared only within their own domains. Context changes invalidate all
tickets. Safe cache fields are separately allowlisted; profiles, phone/email,
national identity and unknown nested records are dropped. This cache is never fed
to legacy reconcileStore, and never fabricates tare/capacity/rates or server facts.

## Reproduction tooling and acceptance boundary

Native verification uses Node 22.22.0/npm 10.9.8, PostgreSQL 17.6 and real headless
Microsoft Edge on Windows. Playwright Core 1.65.0 is test tooling installed outside
the app dependency graph. Reproduce with an isolated disposable PostgreSQL database
and the same four role URLs used by the existing SQL CI selection:

```
npm install --prefix ../.u07-tools --no-save --package-lock=false playwright-core@1.65.0
npx vitest run src/tests/ar2U07OfflineContinuity.test.ts
```

QSA_TEST_DATABASE_ISOLATED=1 and TEST_DATABASE_URL, DATABASE_URL,
AUTH_DATABASE_URL, MIGRATION_DATABASE_URL must point at that synthetic database.
PG_BIN_DIR points to native PG17 tools for the infrastructure rehearsal. Optional
QSA_BROWSER_TOOL_ROOT selects another directory containing node_modules/playwright-core;
QSA_BROWSER_EXECUTABLE selects the browser executable. Windows defaults to installed
Edge; on Linux set the executable explicitly or install the matching Chromium
through Playwright Core. Missing native browser/database support fails, not skips.
A fresh database is required because the last test intentionally advances the
synthetic registry forward and refuses rollback. No real user browser profile,
production database, production canonical_store or production epoch is touched.

The test server bundles the actual client modules and uses real IndexedDB in Edge,
real authenticated isolated HTTP routes and native SQL authorities. Lost ACK is
injected after actual COMMIT and after response headers, then the response socket
is destroyed. This prevents browser TCP retry from disguising an uncertain result.
Tests include page reload, browser process restart with a temporary persistent
profile, two real tabs, durable leases, stale sender ACK, U05 group recovery,
revocations, cache pages and real database epoch locking. This does not claim live
React UI, service-worker, mobile or Linux production acceptance.

## Deferred U09 work and remaining boundaries

Owner-authorized cutover must compose every active writer with the epoch fence,
retire old writer processes, apply the inactive registry safely, decide legacy
pending-operation review/purge, mount audited authenticated routes, wire the
existing UI's account/project lifecycle to the coordinator, paginate the full
journal viewer, validate device/browser support, and complete live role/security
and production cost checks. U08 Workspace is untouched. No dual write, SQL fallback,
production route mounting, production canonical-store change or production epoch
advance is part of this unit. U07 remains pending independent review and owner merge.


## Existing UI contract reconciliation

The legacy OutboxOperation/FAILED contract and active OutboxDrawer remain intact.
SQL statuses are a separate explicit union, not an unsafe cast into that contract.
PENDING/SENDING/SYNCED retain their meaning; AWAITING_RECEIPT is visibly uncertain,
not a success or ordinary FAILED retry. CONFLICT requires reviewed intent; scope
and epoch quarantine must show a blocked reason; REVIEW_REQUIRED requires explicit
review. CANCELLED preserves evidence and cannot be treated as a committed reversal.
U09 must render these states exhaustively through the existing components and use
coordinator actions, not the legacy generic retry handler. This presentation wiring
is deliberately deferred under the approved inactive integration strategy.


## Original U07 verification evidence — 2026-11-09 (before RB1)

Evidence classes are native PostgreSQL integration, real browser storage/HTTP,
historical automated regression, typecheck and production build. They are not
live production React UI or owner acceptance. Windows native PG17.6 and identical
Node22/npm10 tooling were used for baseline and final. Clean detached verification
checkouts preserve published migration LF bytes; the active original checkout's
pre-existing CRLF bytes in 001/002 were never edited or substituted in Git.

| Verification | Starting main | Final U07 | Result |
| --- | --- | --- | --- |
| Exact 11-file SQL CI authority selection | 425 passed, 0 failed/skipped | 425 passed, 0 failed/skipped | No regression |
| Separate explicit four-file authority bundle | Verified merged CI 148/148 and same cases in local historical baseline | 148 passed, 0 failed/skipped | PASS |
| Real Edge IndexedDB + native PostgreSQL U07 | New unit | 36 passed, 0 failed/skipped | PASS |
| Identical 58-file historical selection | 1,220 passed / 58 failed | 1,223 passed / same 58 failed | All 1,278 original case outcomes identical; 3 new account-security tests pass |
| Historical suite-load failures | 5 | Same 5 | Existing debt |
| Historical unhandled rejection | One `A failure` rejection | Same one | Existing debt |

Native SQL final suite counts: infrastructure 13, security gate 36, connection
cleanup 6, U02 canonical/membership 55, U03 temporal 63, U04 bounded reads 34,
U04 presentation 11, U05 durable import 71, U06 Trip/pricing 107, RB1 security 28,
and workload benchmark 1 (total 425). No cases were removed or skipped.
Existing migration inventory expectations changed only from nine to ten;
checksum tamper and behavioral assertions are retained. The legacy 89B fixture now
supplies its actual queued actor to the authentication mock; its original assertions
remain intact, including the original failing FSM expectation.

U07 native browser cases cover v2 upgrade retention, refusal of memory fallback,
UUID and device persistence, payload mismatch, lost COMMIT ACK/reload, crashed
SENDING, two tabs, expired leases/stale ACK, account/company/project isolation,
partial and full pages, source/entity revision separation, 401/403/409/422/429/503,
HTML 401, Retry-After, durable recovery caps, idle quiescence, protected payload
rejection, account/role/project/driver-link revocation, canonical receipt proof,
real browser process restart, U05 FENCE-versus-group proof and fresh-instance recovery,
actual U04 bounded DTO adaptation, four profiles with optional driver/pending price,
ACK cache preservation, and PostgreSQL epoch locking/privilege/rollback fencing.

Quiescence counters: repeated idle online events and explicit idle wakes produced
0 context calls, 0 command calls, 0 receipt calls and 0 Google requests. A confirmed
ACK produced no continuation calls. Receipt outage stopped durably at review with
one original business send; subsequent wakes produced no extra requests. Logout
and changed generations prevented late ACK/cache writes. Pending work has a bounded
index/read budget; there is no periodic complete-outbox scan or retry timer.

The 58 historical failures are pre-existing debt, not a clean full-suite PASS.
Five loading failures remain: `conflictEngine.test.ts`, `conflictResolution.test.ts`, `pricingEngine.test.ts`, `tripIdentityAdjustmentBlock89.test.ts`, `weighbridgeImport.test.ts`.
The former reported 1,185/56 comparison is not reused: the exact current 58-file
selection and current native baseline were measured anew. No new historical failure
or unhandled rejection was introduced.

### Existing workload benchmark

This is the unchanged U06 isolated SQL/HTTP composition, not a claim about production
or the new browser coordinator. Its 24/100/1000-truck workloads remain flat at
25 instrumented command queries, with zero duplicate creation. The new opt-in
writer fence adds one fixed SQL assertion before authorization per transaction;
receipt-first HTTP requests and real browser lifecycle are measured separately.

```
[
  [
    "u07-baseline-sql",
    [
      {
        "trucks": 24,
        "commandQueriesMin": 25,
        "commandQueriesMax": 25,
        "p95Ms": 242.4344000000001,
        "repeatCreates": 0
      },
      {
        "trucks": 100,
        "commandQueriesMin": 25,
        "commandQueriesMax": 25,
        "p95Ms": 126.03060000000005,
        "repeatCreates": 0
      },
      {
        "trucks": 1000,
        "commandQueriesMin": 25,
        "commandQueriesMax": 25,
        "p95Ms": 134.3026000000009,
        "repeatCreates": 0
      }
    ]
  ],
  [
    "u07-final-sql",
    [
      {
        "trucks": 24,
        "commandQueriesMin": 25,
        "commandQueriesMax": 25,
        "p95Ms": 250.67410000000018,
        "repeatCreates": 0
      },
      {
        "trucks": 100,
        "commandQueriesMin": 25,
        "commandQueriesMax": 25,
        "p95Ms": 116.71619999999984,
        "repeatCreates": 0
      },
      {
        "trucks": 1000,
        "commandQueriesMin": 25,
        "commandQueriesMax": 25,
        "p95Ms": 135.03809999999976,
        "repeatCreates": 0
      }
    ]
  ]
]
```

### Migration byte proof

New 010 SHA-256: `06bcd19c88421dd614b40b1f2b7c79cd6f1c61a3f633ea50fe74e95a14055f8f`.
Native schema_migrations checksum equals the tested LF bytes (zero CR bytes).
The staged Git blob is checked against that checksum before commit. Git 001–009
remain byte-for-byte identical to starting main. After the 425 final tests, the new
registry still read FIRESTORE_LEGACY / revision 0 / firestore. Only disposable U07
fixtures explicitly advanced their own registry; no production metadata changed.

### Exact historical selection

```
authProfileContinuity.test.ts
authProviderContinuity.test.tsx
authSessionPrincipalRefresh.test.ts
cachedProjectAuthority.test.ts
canonicalTripPersistenceBoundaryConvergenceUnit6A.test.ts
conflictEngine.test.ts
conflictResolution.test.ts
durableImportSessionP8B1.test.ts
fieldLoadingUnloadingBlock77.test.ts
foundationMaintenancePfagRb2.test.ts
foundationMaintenanceUiPfagRb2.test.tsx
foundationSafetyPfagRb1.test.ts
importSessionClientAuthRecovery.test.ts
loadingOperatorConvergence.test.ts
operationalProfileAssessment.test.ts
operationalProfileProjection.test.ts
operationalProfileUi.test.tsx
operationalProfiles.test.ts
pricingAuthorityP9U1.test.ts
pricingCommercialVersioningP9U2.test.ts
pricingEngine.test.ts
profileContinuityUi.test.tsx
projectActivationReadiness.test.ts
projectCanonicalRefreshBarrierA11.test.ts
projectContextLifetime.test.tsx
projectDriverTruckAssignmentFoundation.test.ts
projectFleetReadModelAdminReadContext.test.ts
projectFleetReadModelFoundation.test.ts
projectReadinessAdminReadContext.test.ts
reviewedRosterCommitP8B2.test.ts
rosterBulkGlobalReuse.test.ts
rosterCanonicalIntentP7B3.test.ts
rosterExecutionRecoveryP8B3.test.ts
rosterIdentityGroupingProvenanceSiCg1.test.ts
rosterMaterialBindingContinuity.test.ts
rosterResumeJourneyP8B4.test.ts
rosterResumeStageReconciliation.test.ts
secureTripNumberingOffline89B.test.ts
serverAuthenticationTrustBoundary.test.ts
setupFleetQuery.test.ts
setupFleetWorkspace.test.tsx
setupReadinessBoundary.test.ts
setupReadinessPresentation.test.tsx
setupWizardContinuity.test.tsx
smartImportCommitIntegrityConvergence.test.ts
smartImportGlobalCanonicalSnapshotBoundary.test.ts
smartImportServerCanonicalCommitContractC1.test.ts
smartImportTripWriteFailureIntegrity.test.ts
smartTripImportOperationalConvergence.test.ts
temporalRelationshipAuthority.test.ts
tripIdentityAdjustmentBlock89.test.ts
tripIntakeConvergence.test.ts
tripMutationBoundary.test.ts
tripOperationalCommands.test.ts
tripOperationalOutbox.test.ts
tripSmartImportOptionalTimeMapping.test.ts
txReadCacheCorrectness.test.ts
weighbridgeImport.test.ts
```


## Exact changed files

```
docs/reconstruction/02_PHASE_LEDGER.md
docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
docs/reconstruction/13_AR2_U07_OFFLINE_EPOCH_RECEIPT_RECOVERY.md
server/sqlOfflineRoutes.ts
src/db/canonicalAuthority.ts
src/db/importAuthority.ts
src/db/migrations/010_inactive_offline_epoch_fence.sql
src/db/offlineRecoveryAuthority.ts
src/db/tripAuthority.ts
src/services/offline/indexedDB.service.ts
src/services/offline/outbox.service.ts
src/services/offline/sqlOfflineCoordinator.ts
src/services/offline/sqlOfflineHttpTransport.ts
src/services/offline/sqlOfflineStore.ts
src/services/tripCommandClient.service.ts
src/tests/ar2U01SecurityGate.test.ts
src/tests/ar2U02CanonicalIdentityMemberships.test.ts
src/tests/ar2U03TemporalAuthority.test.ts
src/tests/ar2U04BoundedReads.test.ts
src/tests/ar2U05DurableImport.test.ts
src/tests/ar2U06Rb1Security.test.ts
src/tests/ar2U06TripsPricing.test.ts
src/tests/ar2U07OfflineContinuity.test.ts
src/tests/helpers/sqlOfflineBrowserEntry.ts
src/tests/secureTripNumberingOffline89B.test.ts
src/tests/tripOperationalOutbox.test.ts
src/types/sqlOffline.ts
```


## Typecheck, build and publication gate

`npm run lint` was run against starting main and final source using identical
Node22/npm10 tooling: exit 2 in each, 446 diagnostics in each. Diagnostic multisets
match after normalizing source line/column positions; no new diagnostic or removed
debt is hidden. Lint is not PASS. `npm run build` exited 0 at baseline and final;
existing bundle-size warnings remain. Final TypeScript/SQL verification bytes match
the feature worktree, and staged/unstaged whitespace checks are required before
publication. No production entrypoint, React routing, PWA, Workspace, Firestore
authority or SQL production mounting code changed. The shared UID checks are the
explicitly necessary legacy security boundary, with three executable negative tests.

Publication gate: one focused commit on the existing dedicated U07 feature branch,
no history rewrite or force push. Remote SHA must equal local commit and the
worktree must be clean. Independent review and owner merge remain pending; no PR,
deployment, production migration/epoch activation, U08 or U09 execution is authorized
by this record. Final supported classification: AR2_U07_READY_FOR_INDEPENDENT_REVIEW.
The containing commit SHA and independently verified remote SHA are returned in the
execution report rather than creating a self-referential documentation commit.


## AR2-U07-RB1 — Causal ordering and authoritative completeness

Starting feature SHA: `311794c8b5c168ca34249855a5c7be8347350f7d`.
Authoritative base: `7ce8f7827e6e9a037a8010791c4ee69170d868ff`.
The named feature branch and clean worktree were verified before changes. Source
review included the SQL store/coordinator/transport/types, IndexedDB v3 upgrade,
U04 read authority and bounded DTO, real-browser harness and this record.
No overlooked protection closed either finding. No production SQL, auth, Trip,
Import, Firestore, Workspace, migration or epoch-setting implementation changes
are required by this corrective unit.

### Pre-correction executable reproduction

Three new real Edge/IndexedDB + native PostgreSQL negative tests were executed
against the unchanged implementation before editing implementation code. All three
failed as predicted (the other 36 tests were excluded only by the explicit RB1
reproduction name filter; final acceptance runs the complete file without skips).

- A real Trip command A committed, then its response socket was interrupted after
  response headers. A remained AWAITING_RECEIPT. B targeted the same Trip's next
  transition and was queued later. After page reload/new coordinator and a receipt
  endpoint outage, B was submitted and became AWAITING_RECEIPT rather than staying
  PENDING with zero attempts.
- A real transport 503 prevented A's commit. After the same restart/outage sequence,
  B was sent prematurely and became CONFLICT rather than waiting for A's authorized
  same-ID retry. An unrelated Trip command was present in each test.
- A/B/C were cached, followed by one synthetic caller page claiming fullSnapshot,
  final pagination and matching completeThrough. B/C were deleted; actual result
  was [A] rather than [A,B,C].

Root cause 1: pending() concatenated PENDING, SENDING and AWAITING_RECEIPT buckets
whose index order was UUID-based. Per-record leases prevented duplicate claims
but supplied no cross-command dependency or durable submission order. B could be
claimed before A's receipt result, including while A was in backoff.
Root cause 2: a locally generated inventory ticket bound context/cursors, but no
server witness proved that the query was complete and unfiltered. Generic caller
booleans were accepted as deletion authority. U04's signed cursor binds scoped
partial pagination; it is not a complete-inventory authorization.

### Durable dependency contract

Append allocates a monotonically increasing safe integer in the same IndexedDB
transaction as the immutable command, resource tail/predecessor and sequence
scheduling entry. Equal ISO creation times are supported; timestamps/UUID order
are never used to infer causality. These metadata fields cannot be changed by
ordinary status/lease updates. Operation IDs, request digests, original envelopes,
reviewed signatures and source/mapping references remain untouched.

The causal resource is a scoped authoritative Trip ID, or an import session
(serializing its parent-operation/group advances). All resources retain actor,
company, project, device and epoch identity through the existing scope key.
Commands without an allocated Trip ID may only be actual creation commands at
expected revision zero. Follow-up commands without that ID fail with
AUTHORITATIVE_TRIP_ID_REQUIRED; an authorized caller must recover the creation
receipt and explicitly author a later command. No payload or revision is silently
rewritten and no local Trip status grants authority.

A child is eligible only when its predecessor record is present, has the same
resource/scope and an earlier sequence, and is SYNCED through the existing matching
receipt proof. NOT_COMMITTED permits only A's original authorized same-ID retry;
B remains untouched until A is acknowledged. IN_PROGRESS, backoff, active leases,
conflict, cancellation, exhausted recovery, scope/epoch quarantine and revoked
permissions do not release B. Waiting consumes no send or recovery attempt.
Existing cancellation cannot imply a successful state transition.

Eligibility is read locally before context/network calls and checked again inside
the atomic write transaction that claims or resends a command. Two tabs cannot
bypass it. Existing lease-owner/fence checks still prevent stale ACK overwrites.
Independent ready resources proceed with the existing bounded serial transport
(concurrency 1 per coordinator); a blocked resource does not block unrelated
ready resources. A newly acknowledged predecessor releases its child for the
next explicit wake, without a new automatic loop or timer.

Sequence entries live in the existing sqlControl store and use ordered keys;
no IndexedDB version bump/store reset/index change is introduced. A persisted
round-robin position bounds a wake to 100 scheduling records while allowing work
beyond the first hundred to progress instead of being hidden by blocked UUID
buckets. Completed/permanently blocked records leave the scheduling index, while
journal evidence/predecessor records remain. Queue history is not rescanned on
idle renders.

### Existing v3 evidence

Before scheduling a scope for the first time, bounded 100-record chunks discover
its existing v3 journal. This is compatibility discovery, not inferred chronology.
Pre-RB1 unresolved records without causal metadata are preserved, require explicit
review, and install a persistent resource barrier (or a scope-wide barrier if the
resource cannot be classified). New dependent commands cannot bypass that barrier
by being appended before discovery. Successful historical ACKs remain successful;
old cancellation/rejection evidence is not reactivated. The bootstrap must finish
before any new claim. An explicit later review/migration protocol is deferred;
no automatic reconstruction from timestamps, receipt impersonation or silent
barrier removal is provided. Large existing histories can require multiple
explicit bounded wakes before scheduling begins.

Mixed-version old JavaScript writers must be retired/fenced at owner-authorized
U09 activation; client metadata cannot retrofit checks into already loaded older
code. Production SQL remains inactive. The existing server epoch and idempotency
boundaries remain mandatory and unchanged.

### Completeness contract: fail-closed deferral

No existing API supplies a trusted complete-inventory witness binding actor,
company, project, entity kind, unfiltered inventory definition, source revision,
backend epoch and generation. Therefore omission deletion is removed from the
SQL cache store path. Matching fullSnapshot/completeThrough flags authorize only
safe upserts, never deletion. Wrong context, source revision, cursor chain or
completeThrough still rejects where previously required. Filtered and interrupted
pages cannot erase omitted records. A final page is not interpreted as proof of
an unfiltered complete query. U04 pages remain permanently partial, including
the last page; their current DTO/authority are unchanged.

Source watermarks and entity revisions retain their existing stale-write checks;
ACK-derived Trips remain protected. No fictitious token or broad new API was added.
Genuine complete-snapshot reconciliation is explicitly deferred until an approved
server contract supplies and verifies all required scope/revision/definition
bindings. The old positive deletion test is tightened to require preservation;
its stale revision assertion remains, and no case is removed or skipped.

### Corrective verification and remaining boundaries

The final measurements and exact corrective file list follow below. The full
existing SQL selection, separate 148 bundle, original browser cases, Offline/auth
historical selection, lint and build are remeasured at starting U07 and final
source. A development parallel run hit the existing browser-process-restart
30-second timeout under competing verification load. Final verification is serial;
the timeout and assertions are not relaxed. One new revocation test expectation
was corrected to the existing 403 contract (REVIEW_REQUIRED), retaining the
requirement that its child remains pending without consuming attempts.

U09 activation dependencies remain: owner-authorized activation, all active
writers fenced, old clients retired, existing Offline UI lifecycle/state wiring,
legacy command review, complete journal pagination and live device/role acceptance.
Full-inventory deletion additionally needs a real server completeness contract.
No PR, merge, deployment, production SQL/epoch activation, U08 or U09 execution.


### RB1 final measured results — 2026-11-09

| Gate | Starting U07 SHA 311794c | Corrected source | Classification |
| --- | --- | --- | --- |
| Real Edge/IndexedDB + native PostgreSQL browser file | 36/36 passed | 53/53 passed, zero failed/skipped | PASS |
| Exact PostgreSQL CI selection (all 11 files) | 425/425 passed | 425/425 passed, zero failed/skipped | PASS |
| Separate explicit four-file authority bundle | 148/148 passed | 148/148 passed, zero failed/skipped | PASS |
| Identical 58-file historical selection | 1,223 passed / 58 existing failures | Identical 1,223 / 58 | No new failure |
| Historical suite-load failures | 5 | Same 5 | Existing debt |
| Historical unhandled rejection | One A failure | Same one | Existing debt |
| npm run lint | Exit 2, 446 diagnostics | Exit 2, same 446 diagnostic multiset after location normalization | Existing debt; not PASS |
| npm run build | Exit 0 | Exit 0 | PASS |

All 1,281 original historical assertion outcomes are identical. The full SQL
selection includes U01 infrastructure/security/cleanup, U02/U03 authorities,
U04 bounded reads/presentation, U05 durable Import/recovery, U06 Trip/pricing,
RB1 security and workload benchmark. The explicit 148 command retains its exact
four files; it is not replaced by another selection. SQL migrations 001–010,
production composition, server authority code and CI blocking gates are untouched.

The browser count rises by 17 focused RB1 cases. Both causal COMMITTED and
NOT_COMMITTED cases now close the actual Edge process, reopen a temporary
persistent profile, reload the durable journal, block B during receipt outage,
permit the unrelated Trip and finish A/B with unchanged IDs/payloads. They passed
in 19.1s and 25.4s respectively with the original 30-second timeout. The complete
final browser file was rerun after this strengthening: 53/53, zero skips, 111.9s.
This supplements the earlier successful 53-case reload-based run rather than
claiming a single-operation UUID test proves multi-command restart ordering.

Other new cases cover IN_PROGRESS with expired leases and two real tabs, conflict,
cancellation, revocation followed by child-only resume, real two-group U05 import
ordering, equal creation timestamps, 110 independent entries with bounded progress,
pre-RB1 v3 evidence/barriers, missing authoritative creation identity, forged
completeness/filter/cursor/account/project/epoch/generation assertions, preserved
higher revisions and ACK-derived Trips. Existing native U04 partial-page and U07
lost-ACK/no-duplicate-effect cases remain. No domain assertion or timeout is weakened.

Quiescence evidence: a child waiting for a predecessor retains zero attempts and
zero recoveries; blocked-only wakes issue no context/command/receipt requests.
Recovery stops at the existing durable cap; repeat wakes after the stop remain
quiet. The bounded 110-entry test uses an explicitly injected unavailable transport
for browser metadata scheduling (not fabricated PostgreSQL commits): its successive
wake send counts are 0 during bounded bootstrap, then 100, 110, 110. Existing idle
API/Google-zero and acknowledged-queue tests still pass with actual HTTP counters.

Evidence is native PG17.6, real Windows Edge/IndexedDB/isolated HTTP, automated
historical regression, typecheck and build. It does not establish live production
React UI, Linux/mobile browser or U09 cutover acceptance. Publication is one
corrective commit after 311794c on the same branch, with remote SHA equality and
clean worktree checked afterward; no amendment/force push/PR/merge/deployment.
The final execution report supplies the containing commit and remote SHA, avoiding
a self-referential follow-up documentation commit.

### Exact RB1 corrective changed files

```
docs/reconstruction/13_AR2_U07_OFFLINE_EPOCH_RECEIPT_RECOVERY.md
src/services/offline/sqlOfflineCoordinator.ts
src/services/offline/sqlOfflineStore.ts
src/tests/ar2U07OfflineContinuity.test.ts
src/types/sqlOffline.ts
```

Remaining debt: the measured 446 TypeScript diagnostics, 58 historical assertion
failures, five suite-load failures and one historical unhandled rejection. Complete
inventory omission reconciliation remains disabled pending a genuine approved
server completeness contract. Pre-RB1 unordered unresolved SQL intent requires
explicit authorized review; no automatic barrier migration is supplied. Original
U09 activation/UI/journal pagination/live-role gates and mixed-version retirement
remain deferred. No U08 work is started. Supported correction classification:
`AR2_U07_RB1_READY_FOR_INDEPENDENT_REVIEW`, pending independent review and owner merge.
