# AR2-U09 — Runtime composition and controlled cutover readiness

## Engineering convergence 1 reconciliation — 2026-11-10

[Convergence evidence](21_ENGINEERING_CONVERGENCE_1.md) adds the exact pinned-tree inventory, static/dynamic dependency evidence, eleven workflow spines and an isolated four-file Carrier/Material readiness correction. Nine original RB4 dirty files, including migration 013, remain fingerprint-identical in the U09 worktree. Migrations 001–012 remain unchanged. New acceptance 37/37 and actual Edge journeys 2/2 pass; unchanged native/authority/browser evidence and exact historical/diagnostic deltas are linked in that record. The 92 historical failures, 12 load failures, six portal failures and 442 diagnostics remain unresolved gates. This is a local convergence branch only; it does not certify RB4, all dynamic workflow behavior, production equivalence or operational acceptance. Overall U09 remains BLOCKED; production remains Firestore, with no push, PR, merge, deploy, production migration, SQL activation or live Google operation.

## Verified preflight (before production edits)

Pinned/fetched main: `030e9027685033c674cf2021499db7bfb675cbfd`. PR #99 independently read through GitHub: merged at that exact SHA; its sole implementation parent is U08 `daefdfa1827bff420f2b35a3eadc4a623094fdd5`. Initial worktree clean; branch `reconstruction/ar2-u09-sql-runtime-cutover-readiness` created from origin/main. No applicable AGENTS.md found. Read actual ARCH-R1 Rev1.2 and phase/debt/U07/U08 records and postmerge handoff. MASTER_PROJECT_HANDOFF is older archival context; current ledger and merged source control.

Production authority is Firestore. No production SQL activation, live migration, epoch advancement, deployment, new Google resource or automatic PR/merge is authorized. Historical baseline is remeasured in a detached starting-SHA checkout using the same 135-file selection (prior 133 plus both U08 files), Node22/npm10; all SQL/native/browser results must be newly measured.

## Source-derived dependency / authority matrix

| Area | Current authority and production route/consumer | Existing SQL authority / evidence | Activation dependency and failure policy |
|---|---|---|---|
| Identity / roles / membership | Firebase UID + current Firestore users; security.middleware, authContext/AuthSession | authAdapter, canonicalAuthority, canonicalIdentityRepository; RLS, protected natural keys, current company/project role | Require trusted UID and direct qsa_auth/qsa_runtime credentials. No cached/browser role. SQL account/profile bootstrap must not fall back to Firestore after SQL selection. |
| Company/project context | App selectedProjectId, current assignedProjectIds, project.service; app.ts project/readiness/lifecycle APIs | U04 SqlProjectReadAuthority and FoundationReadRepository; external Project identity, source revision and scoped cursors | Scope request is not authorization. Current project/profile reads/provisioning are Firestore; classify missing SQL project-governance operations separately from route integration. Unsupported SQL surfaces fail closed. |
| Canonical fleet | setup-driver/truck/carrier/material, membership-commands and fleet-profile APIs; canonicalServices and management clients | U02 create/resolve/status/membership and immutable actor-bound receipts | Mount actual existing authorities behind one server policy, never browser-selected providers or dual writes. |
| Temporal relations | assignment/allocation/affiliation commands and relationship-context | U03 SqlTemporalAuthority, bounded historyPage, exclusion/active-pointer integrity | Preserve cleanup/effective-time rules, current participation and versions; no new domain semantics. |
| Provisioning / profiles | /api/projects, lifecycle-transition, operational-configuration and reviewed assessment; existing wizard | SQL projects/config storage and U04 readiness exist; a complete SQL governance HTTP/client port is not delivered by prior units | A missing implementation is not a working route. No fake success or fallback when a capability is not composed. |
| Trips / numbering / pricing | server TripCommandsServerService and tripCommandClient; immutable pricing snapshots | SqlTripAuthority, TripPricing/Settlement repositories, protected DTOs, numbering locks and receipts | Fixed U06 envelope epoch must follow trusted runtime policy when composed; mandatory DB fence, current role and expected revision. |
| Weighbridge / lifecycle | existing canonical commands and source evidence | U06 measurements, append-only events and deferred final-projection guards (008/009) | Preserve approved source verification and frozen history; no arbitrary historical updates. |
| Smart Import | importSessionClient and existing server checkpoint/review/commit workflow | U05 SqlImportAuthority, frozen artifacts/row provenance, reviewed signature, group receipts, TripImportAuthority composition | Use existing source/store/protection contracts and same epoch-fenced Trip service. Recover uncertain advances before resend. |
| Offline / recovery | legacy IndexedDB/outbox and existing OutboxDrawer/Conflict UI | U07 SqlOfflineCoordinator/Store/HTTP transport + SqlOfflineRecoveryAuthority; immutable causal order, receipt-first recovery | Actual lifecycle and journal-page integration missing. Keep legacy intent inventories separate; no conversion, no unordered replay, no idle timer or unlimited hydration. |
| Workspace / reports | U08 Firestore outbox, project lease, frozen exact Google RPCs, binding/grant proof and separate report watermark | SQL outbox_events/worker_jobs/workspace_bindings/receipts tables exist, but no safe SQL-to-U08 journal/grant adapter | Present SQL binding lacks full six-ID/revision/grant/journal contract. Keep SQL projection fail-closed and retain pending SQL evidence; do not create a second Google writer. |
| Epoch / runtime | Firestore server entry and Rules; SQL route factories currently test-only | 010 forward-only registry, qsa_assert_offline_epoch; optional canonical fence, U04 read string | Optional checks do not fence an old unfenced SQL process. Need additive DB enforcement and centrally composed services. Registration is separate from production activation. |
| Migration/history | U01 read-only mappings; historical source and protected records | migration_runs is a per-path ledger, not a durable complete-reconciliation run or snapshot witness | Bounded signed/frozen inventory, counts/IDs/hashes/revision coverage, restart receipts and exceptions; reject ambiguous evidence, no production migration. |
| Old clients / sessions | old API calls, direct allowed Firestore writes and pending legacy commands | SQL epoch and U07 quarantines cover only new SQL seam | Rules and patched server transactions must freeze old Firestore routes/writes. Rules cannot revoke an old Admin SDK credential: deployment/drain/IAM revocation evidence is a mandatory unresolved operational gate. |

## Source gaps confirmed

- Current production `app.ts` imports no SQL route factories. Each existing SQL mount is NODE_ENV/test-isolation guarded; these cannot simply be exposed as live endpoints.
- Canonical/import/trip fences are optional dependency injection; U04 read authority has only an epoch label and no transaction-held epoch assertion. Trip envelopes/internal imports still use a fixed U06 epoch constant.
- There is no cross-process Firestore write barrier. An HTTP check alone races transactions; Admin SDK bypasses Rules. A source update cannot revoke an older server credential or prove old processes were drained.
- SQL journal list/recovery actions currently inspect only the first 101 entries; no authorized large-journal UI pagination or current application lifecycle composition exists. Legacy records are not SQL intent.
- U08 is a concrete Firestore continuity/journal/grant implementation; SQL table existence does not establish compatible Google delivery. Section 8 explicitly requires fail-closed behavior if safe composition cannot be proven.
- Existing migration_runs lacks complete category closure, immutable run identity and bounded durable page progress; generic hashes alone do not prove semantic source equivalence.

## Exact pre-edit allowlist

Only directly traced dependencies below may change. Refine this record with source evidence BEFORE adding a further path; unused allowed paths need not change.

Production:
- server/app.ts
- server/runtimeComposition.ts (new)
- server/sqlRuntimeRoutes.ts (new)
- server/sqlTripRoutes.ts
- server/sqlProjectReadRoutes.ts
- server/sqlImportRoutes.ts
- server/sqlOfflineRoutes.ts
- server/sqlWorkspaceComposition.ts (new, fail-closed boundary; no parallel Google worker)
- src/runtime/firestoreAuthority.server.ts (new)
- src/types/runtimeAuthority.ts (new)
- src/firebase/admin.ts
- firestore.rules
- src/db/migrations/011_runtime_composition_readiness.sql (new)
- src/db/canonicalAuthority.ts
- src/db/projectReadAuthority.ts
- src/db/tripContracts.ts
- src/db/tripAuthority.ts
- src/db/tripImportAuthority.ts
- src/db/runtimeReadinessAuthority.ts (new)
- src/db/runtimeReconciliation.ts (new)
- src/db/runtimeInventory.ts (new)
- src/services/runtimeClient.service.ts (new)
- src/services/tripCommandClient.service.ts
- src/services/importSessionClient.service.ts
- src/services/import/importSessionClient.service.ts
- src/services/offline/sqlOfflineStore.ts
- src/services/offline/sqlOfflineCoordinator.ts
- src/services/offline/outbox.service.ts
- src/services/offline/legacyJournalInventory.ts (new)
- src/runtime/RuntimeCompositionProvider.tsx (new)
- src/firebase/authContext.tsx
- src/components/offline/OutboxDrawer.tsx
- src/components/offline/SqlJournalPanel.tsx (new)
- src/App.tsx

Verification / CI:
- src/tests/ar2U09RuntimeComposition.test.ts (new)
- src/tests/ar2U09FirestoreFence.test.ts (new)
- src/tests/ar2U09MigrationReadiness.test.ts (new)
- src/tests/ar2U09OfflineBrowser.test.ts (new)
- src/tests/helpers/u09NativeFixture.ts (new)
- src/tests/helpers/u09OfflineBrowserEntry.ts (new)
- src/tests/ar2U01PostgresInfrastructure.test.ts (only additive migration inventory expectation)
- .github/workflows/ci-foundation.yml (execute new isolated native coverage with the existing blocking requirements)

Documentation:
- docs/reconstruction/02_PHASE_LEDGER.md
- docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
- docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md

## Additive migration necessity / immutability gate

011 is justified only for DB-enforced writer fencing and durable bounded reconciliation metadata. Published 001–010 must retain exact Git bytes/checksums. Existing native preparation suites must remain valid with the new enforcement gate initially UNARMED; isolated U09 tests alone arm it in a separate disposable database. Once armed, enforcement cannot be downgraded. No live activation/arming route or automatic environment switch is introduced. Migration inventory and staged/tested LF bytes must be checked.

The working checkout has CRLF in published 001/002 while canonical Git blobs and the clean comparison checkout have LF. Restore those two working byte streams to the exact published Git blobs for checksum-consistent testing; this is zero Git content delta, not a migration amendment.

## Planned readiness semantics

Report SOURCE_INTEGRATED, ISOLATED_TEST_VERIFIED, DATA_RECONCILIATION_READY, LEGACY_CLIENT_FENCING_READY and WORKSPACE_CONTINUITY_READY independently, with capability-level blockers. PRODUCTION_CUTOVER_AUTHORIZED is always false for this unit: source/tests cannot grant owner authorization. Real exports, deployment parity, old Admin credential retirement, restores and Google continuity evidence are separate operational gates. Do not label a signed hash or synthetic fixture as live historical reconciliation.

Before 011 implementation: existing `projects.readiness_revision` invalidates foundation changes but does not independently cover every append-only event/weight/import receipt and worker mutation. Add scoped global/project reconciliation counters maintained by triggers on the exact existing inventory tables, so page/restart verification rejects a changed target. Readiness stores only hashes/cursors/receipts, not personal profiles or keys. A read-only epoch snapshot assertion is separate from transaction-held writer fencing because U04 uses PostgreSQL READ ONLY transactions, which cannot take row locks.

## Source-proven allowlist extension before historical review implementation

`src/db/offlineRecoveryAuthority.ts` and `src/services/offline/sqlOfflineHttpTransport.ts` require a read-only historical receipt capability. Existing `recoverTrip()` deliberately rejects an old epoch, so it cannot classify uncertain old commands after a future transition. The new capability must authorize under the current server fence while verifying the original command/actor digest; absent receipts remain UNKNOWN and never authorize resend. No production route is activated.

## Verified migration-inventory allowlist extension

The first full SQL run proved six existing suites pin the ten-version inventory. Add only 011 / count eleven in `src/tests/ar2U01SecurityGate.test.ts`, `src/tests/ar2U02CanonicalIdentityMemberships.test.ts`, `src/tests/ar2U03TemporalAuthority.test.ts`, `src/tests/ar2U04BoundedReads.test.ts`, `src/tests/ar2U05DurableImport.test.ts`, `src/tests/ar2U06Rb1Security.test.ts`. Retain every checksum-tamper assertion, case and production-mount rejection. The two route guard-message regressions are implementation compatibility mistakes and will be fixed in the wrappers, not by changing their assertions.

## Safety boundary established during implementation

The U01-U08 source does not supply a complete SQL project provisioning/governance authority or an account-profile/project presentation port for the existing React application. This is a missing prerequisite, not an HTTP routing defect. U09 must not implement a new governance model, infer profiles from Firestore after SQL selection, or claim the entire UI is integrated. A SQL-selected React root therefore stops before mounting the Firestore operational application. The scoped coordinator/lifecycle and metadata journal are implemented and independently exercisable; the production root remains Firestore. Existing legacy import calls fail explicitly if a SQL client is installed rather than translating an incompatible reviewed workflow implicitly. SQL Trip submissions require an explicit authoritative revision; current legacy callers do not manufacture it.

Corrective decision required before full SOURCE_INTEGRATED: provide an approved SQL project/account presentation and governance port, wire the existing navigation/Smart Import UI to those concrete contracts, and verify it independently. The SQL immutable source storage port also requires a real configured ownership-verifying provider; U09 does not install the isolated SQL test adapter in production. Workspace remains blocked by the independently identified U08 journal/binding adapter gap, per section 8. No owner activation is inferred from these isolated integrations.

## Verification corrections (no cases weakened)

First SQL run: 417 pass / eight failures. Six were explicit migration inventories (ten published migrations -> eleven including 011); two were wrapper guard-message compatibility errors introduced during extraction. Additive inventory expectations were updated and original guard codes restored. Second full selection: 424 pass / one failure, the existing 30-second backup/restore test timeout also measured at the starting SHA. The first final run passed that backup case in 26.5 seconds; no timeout was changed. U07 real browser/native SQL: 53/53; explicit four-file authority bundle: 148/148. These are provisional observations pending the final source/test snapshot and exact baseline comparison.

## Final execution evidence — 2026-11-10

Classification: **AR2_U09_BLOCKED_WITH_EVIDENCE** for full integration/cutover. The bounded source patch is independently reviewable; it is not a completed operational SQL application or a production authorization. Stop at the missing-authority/provider boundary described above.

| Requested report field | Evidence-supported result |
|---|---|
| STARTING_MAIN_SHA | `030e9027685033c674cf2021499db7bfb675cbfd` |
| FINAL_MAIN_SHA_AT_EXECUTION | Same SHA at final source verification; publication report performs final remote readback. |
| BRANCH | `reconstruction/ar2-u09-sql-runtime-cutover-readiness` |
| IMPLEMENTATION_COMMIT_SHA / REMOTE_SHA | Exact post-commit/push SHA belongs to the executor's final publication report; this document cannot embed its own Git commit hash. |
| EXACT_CHANGED_FILE_LIST | 51 paths listed below; every path reconciled to the source-derived allowlist and explicit extensions. |
| AUTHORITY_INTEGRATION_MATRIX | Thirteen-area source-derived matrix above; registration/capability distinctions below. |
| SOURCE_GAPS_FOUND | Optional old SQL fences; fixed Trip epoch; first-101 journal actions; no shared Firestore fence; incomplete reconciliation protocol; missing SQL project/account presentation/governance, immutable production source/export adapter and U08 SQL journal/binding adapter. |
| ROOT_CAUSES | Independent prepared authorities had no trusted production-capable composition or complete cross-authority readiness barrier. Existing migration_runs was a path ledger. Missing prior domain/presentation/provider capabilities cannot be inferred from table existence. |
| IMPLEMENTED_RUNTIME_COMPOSITION | Production app remains Firestore. Separate generic SQL registration composes actual canonical/temporal/Trip/import/read/recovery services. It requires the shared Firestore control to already identify the same active SQL epoch, plus an operator-armed SQL registry. Every mutation requires matching compatibility headers, then DB-held server epoch enforcement. SQL registration does not import/mount isolated route factories. |
| CLIENT_OFFLINE_INTEGRATION | Trusted-root composition/context, optional SQL profile port, principal/project lifecycle, bounded 50-record journal/legacy pages, point actions beyond 101, receipt-first historical classification, prior-epoch review barrier and existing journal drawer integration. Current SQL-selected App stops before Firestore operational hydration because missing ports prevent safe full UI integration. Legacy import/queue calls fail closed rather than translate old intent. |
| LEGACY_CLIENT_FENCING | Patched HTTP, actual used Admin transaction/direct-write/batch boundaries and all existing writable Rules paths consult the same control. Old Admin credential retirement/drain is NOT proven by source. SQL old unfenced runtime writes fail after one-way arming. |
| EPOCH_SAFETY | Guard-before-epoch lock order, forward-only arming/registry, reject missing enforcement metadata, lock through writer commit, READ ONLY snapshot assertion, dynamic trusted Trip epoch, immutable original envelope/receipt proof, current authorization on recovery. No production epoch was changed. |
| MIGRATION_READINESS | 48-category exact inventory; independent approved immutable-source/mapping port; schema/key/count/hash/exception/pending-command coverage; global/project counters and DB epoch; durable actor-bound run/page receipts; 50-row compare pages; restart/replay/source/target invalidation. Synthetic verification never grants actual data readiness or production authorization. No live exporter/provider is installed. |
| WORKSPACE_PROVIDER_COMPOSITION | Explicit BLOCKED gate. SQL outbox stays pending; no second Google worker, no resource replacement, no provider call is installed. Existing U08 sole writer and exact resource IDs remain. |
| SECURITY_BOUNDARY_VERIFICATION | New native tests cover unarmed/mismatched shared control, unfenced INSERT, in-flight epoch advance, revocation, old epoch, READ ONLY checks, exact historical receipt, actual HTTP epoch/principal denial and forward-only guard. Prior U01–U06 role/RLS/DTO/receipt/privacy assertions remain passing. |
| HISTORICAL_REGRESSION_BASELINE | Exact pinned clean baseline; same 135 files, Node22/npm10, --no-file-parallelism, identical reporters. Controlled serial baseline 2,402 pass / 92 failed assertions / 12 suite-load errors / 2 unhandled rejections. Initial resource-contended measurement had 2,400 / 94; those two additional failures were not reproduced serially. |
| FINAL_TEST_RESULTS | U09 32/32; prior SQL CI selection 425/425; U07 real browser+PG 53/53; U08 29/29 within historical selection; explicit independent bundle 148/148; identical historical selection 2,402 pass / same 92 failures. No skipped cases. |
| NEW_FAILURES | Zero added assertion identities, suite-load failures or TypeScript diagnostics at final source snapshot. |
| BASELINE_FAILURES | Same 92 assertion identities, twelve suite-load failures and two unhandled rejections remain. Historical selection exits 1; it is NOT PASS. Failure/load inventories below. |
| TYPESCRIPT_DIAGNOSTIC_DELTA | Actual 446 -> 446, semantic diagnostic IDs added 0 / removed 0 (line offsets ignored); npm run lint exits 2 / NOT PASS. No fixed diagnostic allowance was added. |
| BUILD_RESULT | npm run build PASS / exit 0; existing chunk-size warnings remain. |
| POSTGRESQL_NATIVE_TEST_RESULTS | Full exact previous eleven-file CI selection PASS 425/425, including backup/restore on the final LF run. Baseline backup exceeded its unchanged 30s timeout in the full run and isolated remeasurement; final isolated backup passed in 18.9s. No historical timeout/assertion was relaxed. U09 native databases are separate/disposable and alone arm the guard. |
| OFFLINE_BROWSER_TEST_RESULTS | U07 53/53; new real Edge/IndexedDB/UI 6/6, including 1,001-record pagination, point cancellation after 101, actual metadata-only journal, bounded legacy scan, epoch hold/no stale display and logout. |
| QUOTA_AND_IDLE_RESULTS | New browser counter stays unchanged while idle; no constructor polling/new Google writer. U08 29 cases remain passing. Shared Firestore witness is read once at SQL registration; each SQL HTTP request uses one constant-size DB identity/epoch check. Firestore production requests add one control read, and patched write transactions add one transactional control read. No live Google quota or armed production-scale SLA is claimed. |
| CUTOVER_READINESS_MATRIX | Independent gate table below; no aggregate green/cutover grant. |
| LIVE_ACCEPTANCE_STATUS | NOT_PERFORMED: production Firebase/Rules emulator/live Rules, Google/Apps Script, real export/migration/restore, deployment parity, real devices and load acceptance. Model verification is explicitly not live Firestore acceptance. |
| PRODUCTION_ACTIVATION_STATUS | NOT_AUTHORIZED / INACTIVE. No activation endpoint/environment switch, deployment, data migration/deletion, Google creation, PR, merge or following-unit work. |
| OPEN_DEBT | Missing SQL project/account/current UI ports; real source ownership/export/mapping adapter; UNKNOWN legacy intent review; U08 SQL delivery adapter; old server/client drain and credential retirement; production acceptance; historical failures/diagnostics; Linux feature CI not executed here. |
| GIT_WORKTREE_STATUS | Executor verifies clean after the focused source-preparation commit/push; no generated artifacts or published migration edits are included. |
| INDEPENDENT_REVIEW_READINESS | Bounded source patch reviewable; full AR2-U09 integration BLOCKED pending the explicit corrective dependencies. |

### Capability / routing accuracy

Registered SQL HTTP surfaces are canonical create/status/membership, temporal mutations, Trip/pricing/read/weights/receipt, durable roster import/session/review/execution, offline context/current/historical/canonical receipt, U04 bounded foundation/fleet/setup, optional server-owned-source readiness runs/advance, and an authenticated blocked Workspace result. Canonical resolve/history and Trip-import specialization remain available as actual server services; their full existing UI consumers are not declared ported. No arbitrary server method/SQL/manifest upload is exposed. Without an independently configured source adapter the readiness endpoint returns APPROVED_SOURCE_ADAPTER_REQUIRED.

A SQL-selected React root fails closed before the existing Firestore operational application mounts. Completing the missing project/account/governance/UI/source ports requires a reviewed corrective scope; U09 does not create new governance semantics or install a test-only storage adapter in production. This is the precise stop boundary for full SOURCE_INTEGRATED.

### Independent cutover gates

| Gate | State | Evidence / blocker |
|---|---|---|
| SOURCE_INTEGRATED | BLOCKED | Concrete bounded services/routes/client journal are integrated; missing project/account/current operational UI ports prevent full application integration. |
| ISOLATED_TEST_VERIFIED | PROVEN (bounded patch) | 32 new, 425 SQL, 53 U07, 29 U08 and 148 authority cases; full missing-port/live scenarios are not certified. |
| DATA_RECONCILIATION_READY | BLOCKED | Synthetic 48-category proof only; no approved actual export/mapping/storage provider or production reconciliation. |
| LEGACY_CLIENT_FENCING_READY | BLOCKED | Source/native/model barriers verified; actual deployment/Rules acceptance, drain and Admin credential retirement outstanding. |
| WORKSPACE_CONTINUITY_READY | BLOCKED | U08 SQL six-resource binding/grant/delivery-journal adapter and live continuity acceptance missing. |
| PRODUCTION_CUTOVER_AUTHORIZED | BLOCKED / false | Separate owner-approved operational action and deployment/migration/recovery evidence required. |

### Implementation/verification corrections retained for review

- Exact migration inventories were extended to eleven in six existing files; every checksum-tamper assertion and case remains. Original isolated wrapper error codes were restored after extraction.
- Initial source writes introduced CRLF in app.ts. Eight historical text assertions exposed this; final tested working/Git source uses LF and all eight additions disappeared without assertion changes.
- Native restart tests exposed JSONB object-key order differences after epoch was added to readiness boundaries. Reuse the existing stableValue canonicalization for digests; the final real restart/lost-ACK tests pass.
- Newly introduced disposable-DB cleanup hooks use a bounded 30s allowance for native Windows DDL cleanup, consistent with existing native test teardown. No existing test timeout was changed. No test was skipped/removed.
- Published 001–010 working bytes equal their exact HEAD Git blobs. Existing .gitattributes already enforces LF SQL. Migration 011 source bytes, staged blob and native schema_migrations checksum are identical.

Migration 011 SHA-256: `52d1ddcc3382da4d02660630da8abb35524fc9b94254b810b879f501b205a100`.

### Native existing workload benchmark

The unchanged U06 benchmark runs 24/100/1,000-truck synthetic archived histories, 40 dispatch requests/size and concurrency four. It measures native server triggers/counters with the preparation gate UNARMED; it is not an armed live cutover/Google/scale certificate. Command query maximum stays 25 at every size, baseline and final. U05 genuine matching 1,000-row source fixture remains PASS with one group, 126 protocol queries and 1,658-byte receipt.

| Trucks | Baseline p95 ms | Final p95 ms | Baseline tx p95 ms | Final tx p95 ms |
|---|---:|---:|---:|---:|
| 24 | 332.07 | 258.09 | 131.49 | 109.88 |
| 100 | 163.56 | 169.51 | 38.42 | 37.69 |
| 1000 | 352.04 | 176.01 | 38.40 | 31.12 |

### Exact changed files

```text
.github/workflows/ci-foundation.yml
docs/reconstruction/02_PHASE_LEDGER.md
docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md
firestore.rules
server/app.ts
server/runtimeComposition.ts
server/sqlImportRoutes.ts
server/sqlOfflineRoutes.ts
server/sqlProjectReadRoutes.ts
server/sqlRuntimeRoutes.ts
server/sqlTripRoutes.ts
server/sqlWorkspaceComposition.ts
src/App.tsx
src/components/offline/OutboxDrawer.tsx
src/components/offline/SqlJournalPanel.tsx
src/db/canonicalAuthority.ts
src/db/migrations/011_runtime_composition_readiness.sql
src/db/offlineRecoveryAuthority.ts
src/db/projectReadAuthority.ts
src/db/runtimeInventory.ts
src/db/runtimeReadinessAuthority.ts
src/db/runtimeReconciliation.ts
src/db/tripAuthority.ts
src/db/tripContracts.ts
src/db/tripImportAuthority.ts
src/firebase/admin.ts
src/firebase/authContext.tsx
src/runtime/RuntimeCompositionProvider.tsx
src/runtime/firestoreAuthority.server.ts
src/services/importSessionClient.service.ts
src/services/offline/legacyJournalInventory.ts
src/services/offline/outbox.service.ts
src/services/offline/sqlOfflineCoordinator.ts
src/services/offline/sqlOfflineHttpTransport.ts
src/services/offline/sqlOfflineStore.ts
src/services/runtimeClient.service.ts
src/services/tripCommandClient.service.ts
src/tests/ar2U01SecurityGate.test.ts
src/tests/ar2U02CanonicalIdentityMemberships.test.ts
src/tests/ar2U03TemporalAuthority.test.ts
src/tests/ar2U04BoundedReads.test.ts
src/tests/ar2U05DurableImport.test.ts
src/tests/ar2U06Rb1Security.test.ts
src/tests/ar2U09FirestoreFence.test.ts
src/tests/ar2U09MigrationReadiness.test.ts
src/tests/ar2U09OfflineBrowser.test.ts
src/tests/ar2U09RuntimeComposition.test.ts
src/tests/helpers/u09NativeFixture.ts
src/tests/helpers/u09OfflineBrowserEntry.ts
src/types/runtimeAuthority.ts
```

### Exact historical selection (135 files)

Run `node node_modules/vitest/vitest.mjs run --no-file-parallelism` with the following paths, identically at the pinned starting checkout and this branch. Use the default and JSON reporters; do not interpret the known nonzero result as PASS.

```text
src/tests/authProfileContinuity.test.ts
src/tests/authProviderContinuity.test.tsx
src/tests/authSessionPrincipalRefresh.test.ts
src/tests/cachedProjectAuthority.test.ts
src/tests/canonicalTripPersistenceBoundaryConvergenceUnit6A.test.ts
src/tests/conflictEngine.test.ts
src/tests/conflictResolution.test.ts
src/tests/controlledIncrementalWorkspaceProjection.test.ts
src/tests/dashboardReportsI18n.test.ts
src/tests/durableImportSessionP8B1.test.ts
src/tests/fieldLoadingUnloadingBlock77.test.ts
src/tests/fieldReportsCentralDashboardBlock80.test.ts
src/tests/fleetProjectionConvergence.test.ts
src/tests/foundationMaintenancePfagRb2.test.ts
src/tests/foundationMaintenanceUiPfagRb2.test.tsx
src/tests/foundationSafetyPfagRb1.test.ts
src/tests/googleDerivedReportRefreshUi.test.tsx
src/tests/googleDriveImport.test.ts
src/tests/googleReportRefreshRateLimitBudget.test.ts
src/tests/googleReportRefreshRouteCredential.test.ts
src/tests/googleSheetsImport.test.ts
src/tests/googleWorkspaceAuthorization.test.ts
src/tests/googleWorkspaceOAuthContinuation.test.tsx
src/tests/googleWorkspaceScopeDiagnosis.test.ts
src/tests/importSessionClientAuthRecovery.test.ts
src/tests/loadingOperatorConvergence.test.ts
src/tests/manualWorkspaceIncrementalSyncUi.test.tsx
src/tests/operationalGoogleAdapter.test.ts
src/tests/operationalProfileAssessment.test.ts
src/tests/operationalProfileProjection.test.ts
src/tests/operationalProfileUi.test.tsx
src/tests/operationalProfiles.test.ts
src/tests/operationalReportTabIsolation.test.ts
src/tests/operationalWorkspaceTemplates.test.ts
src/tests/pricingAuthorityP9U1.test.ts
src/tests/pricingCommercialVersioningP9U2.test.ts
src/tests/pricingEngine.test.ts
src/tests/profileContinuityUi.test.tsx
src/tests/projectActivationReadiness.test.ts
src/tests/projectCanonicalRefreshBarrierA11.test.ts
src/tests/projectContextLifetime.test.tsx
src/tests/projectDriverTruckAssignmentFoundation.test.ts
src/tests/projectFleetReadModelAdminReadContext.test.ts
src/tests/projectFleetReadModelFoundation.test.ts
src/tests/projectGoogleOAuth.test.ts
src/tests/projectGoogleTemplateAdapter.test.ts
src/tests/projectGoogleWorkspaceTemplateSync.test.ts
src/tests/projectGoogleWorkspaceWizard.test.tsx
src/tests/projectReadinessAdminReadContext.test.ts
src/tests/projectWorkspaceDualTokenUnit3.test.ts
src/tests/projectWorkspaceFleetRosterUnit1.test.ts
src/tests/projectWorkspaceFleetRosterUnit2.test.ts
src/tests/projectWorkspaceInitialProjectionUnit4A.test.ts
src/tests/projectWorkspaceMasterSnapshotReconciliationUnit5D.test.ts
src/tests/projectWorkspaceMaterialCarrierConvergence.test.ts
src/tests/projectWorkspaceMutationInvalidationUnit5B.test.ts
src/tests/projectWorkspaceProjectionAcknowledgementUnit5C.test.ts
src/tests/projectWorkspaceProjectionFreshnessUnit5A.test.ts
src/tests/projectWorkspaceWizardWiringUnit4B.test.ts
src/tests/reportsEngine.test.ts
src/tests/reportsEngineControlCleanup.test.ts
src/tests/reportsEngineConvergence.test.ts
src/tests/reviewedRosterCommitP8B2.test.ts
src/tests/rosterBulkGlobalReuse.test.ts
src/tests/rosterCanonicalIntentP7B3.test.ts
src/tests/rosterExecutionRecoveryP8B3.test.ts
src/tests/rosterIdentityGroupingProvenanceSiCg1.test.ts
src/tests/rosterMaterialBindingContinuity.test.ts
src/tests/rosterResumeJourneyP8B4.test.ts
src/tests/rosterResumeStageReconciliation.test.ts
src/tests/runtimeGenerationConvergence.test.ts
src/tests/secureTripNumberingOffline89B.test.ts
src/tests/serverAuthenticationTrustBoundary.test.ts
src/tests/setupFleetQuery.test.ts
src/tests/setupFleetWorkspace.test.tsx
src/tests/setupReadinessBoundary.test.ts
src/tests/setupReadinessPresentation.test.tsx
src/tests/setupWizardContinuity.test.tsx
src/tests/sidebarProjectWorkspaceBlock88.test.ts
src/tests/smartImportCommitIntegrityConvergence.test.ts
src/tests/smartImportEntityReviewWorkspaceR2.test.ts
src/tests/smartImportGlobalCanonicalSnapshotBoundary.test.ts
src/tests/smartImportServerCanonicalCommitContractC1.test.ts
src/tests/smartImportTripWriteFailureIntegrity.test.ts
src/tests/smartTripImportOperationalConvergence.test.ts
src/tests/temporalRelationshipAuthority.test.ts
src/tests/tripIdentityAdjustmentBlock89.test.ts
src/tests/tripIntakeConvergence.test.ts
src/tests/tripMutationBoundary.test.ts
src/tests/tripOperationalCommands.test.ts
src/tests/tripOperationalOutbox.test.ts
src/tests/tripSmartImportOptionalTimeMapping.test.ts
src/tests/txReadCacheCorrectness.test.ts
src/tests/userActiveWorkspaceSync.test.tsx
src/tests/weighbridgeImport.test.ts
src/tests/workspaceAuthorizationEntrypoint.test.ts
src/tests/workspaceAutomationMaintenance.test.ts
src/tests/workspaceBlueprintContract.test.ts
src/tests/workspaceBlueprintGoogleAdapter.test.ts
src/tests/workspaceBlueprintProvisioning.test.ts
src/tests/workspaceBoundAuthorizationHttp.test.ts
src/tests/workspaceBoundedWorkbookInspection.test.ts
src/tests/workspaceCanonicalMasterProjection.test.ts
src/tests/workspaceCanonicalRawWrites.test.ts
src/tests/workspaceCanonicalReadConvergence.test.ts
src/tests/workspaceCompleteLifecycle.test.ts
src/tests/workspaceConvergence.test.ts
src/tests/workspaceDestinationPicker.test.ts
src/tests/workspaceDurableAuthorizationAcceptance.test.ts
src/tests/workspaceEnsureReload.test.tsx
src/tests/workspaceGenerationStageDiagnosis.test.ts
src/tests/workspaceHttpResilience.test.ts
src/tests/workspaceInitialDestination.test.ts
src/tests/workspaceIntegration.test.ts
src/tests/workspaceLiveClosure.test.ts
src/tests/workspaceLocalBlueprint.test.ts
src/tests/workspaceManagedRootAdapter.test.ts
src/tests/workspaceNonDestructiveRepair.test.ts
src/tests/workspaceOAuthCorrelation.test.ts
src/tests/workspaceOAuthPopupCallback.test.ts
src/tests/workspaceOfflineAuthorizationAndWorker.test.ts
src/tests/workspaceOfflineGoogleProvider.test.ts
src/tests/workspaceOfflineOAuthRoutes.test.ts
src/tests/workspaceOneClickJourney.test.tsx
src/tests/workspaceOneClickProvisioning.test.ts
src/tests/workspaceProviderResilience.test.ts
src/tests/workspaceQuiescenceBudget.test.ts
src/tests/workspaceQuiescenceUi.test.tsx
src/tests/workspaceRuntimeFence.test.ts
src/tests/workspaceSimpleDispatcher.test.ts
src/tests/workspaceStorageIsolation.test.ts
src/tests/workspaceSyncCoordinator.test.ts
src/tests/workspaceSyncCoordinatorHttp.test.ts
src/tests/ar2U08WorkspaceAuthority.test.ts
src/tests/ar2U08WorkspaceTransport.test.ts
```

### Required independent four-file authority command

```text
npx vitest run --no-file-parallelism src/tests/reviewedRosterCommitP8B2.test.ts src/tests/rosterExecutionRecoveryP8B3.test.ts src/tests/temporalRelationshipAuthority.test.ts src/tests/txReadCacheCorrectness.test.ts
```

### Existing SQL CI selection (425 cases)

```text
src/tests/ar2U01PostgresInfrastructure.test.ts
src/tests/ar2U01SecurityGate.test.ts
src/tests/ar2U01ConnectionCleanup.test.ts
src/tests/ar2U02CanonicalIdentityMemberships.test.ts
src/tests/ar2U03TemporalAuthority.test.ts
src/tests/ar2U04BoundedReads.test.ts
src/tests/ar2U04PresentationSession.test.ts
src/tests/ar2U05DurableImport.test.ts
src/tests/ar2U06TripsPricing.test.ts
src/tests/ar2U06Rb1Security.test.ts
src/tests/ar2U06TripPerformance.test.ts
```

CI portability: existing PG17.6 job/role separation remains blocking; use the actual configured URL/port. U09 native helpers create separately named disposable databases through the isolated TEST_DATABASE_URL administrator, never arm the shared preparation database. Browser tooling is installed outside the checkout in RUNNER_TEMP; Linux Chromium path is explicit, Windows uses existing Edge. The workflow now blocks on U09 native/model cases plus U07/U09 actual-browser cases; the 148 step remains independently blocking. The branch does not trigger the current main/PR-only workflow until an owner creates a PR; no remote Linux green result is claimed.

### Unchanged suite-load failures

```text
conflictEngine.test.ts
conflictResolution.test.ts
googleDriveImport.test.ts
googleSheetsImport.test.ts
pricingEngine.test.ts
reportsEngine.test.ts
reportsEngineControlCleanup.test.ts
reportsEngineConvergence.test.ts
tripIdentityAdjustmentBlock89.test.ts
weighbridgeImport.test.ts
workspaceConvergence.test.ts
workspaceIntegration.test.ts
```

### Unchanged failed assertion identities (92)

```text
authProviderContinuity.test.tsx :: actual Provider ignores cached absence, preserves mounted workflow on read/watch failure and refreshes on reconnect
authSessionPrincipalRefresh.test.ts :: Auth session refresh coherence wires token events, live profile changes and immediate sign-out clearing in AuthProvider
dashboardReportsI18n.test.ts :: Dashboard and Reports localization boundaries stores localized error identifiers and resolves the same state in all three locales without adding subscription dependencies
operationalProfileUi.test.tsx :: owner-approved user-active synchronization requests one global pass with throttle and cleans up when administrator readiness is lost
operationalReportTabIsolation.test.ts :: deployed Q-PRJ-007-shaped partial V1 recovery, without hardcoded Project IDs preserves legacy and partial tabs, rehydrates delivered canonical Trips, upgrades the known Script once, and retains the binding
operationalReportTabIsolation.test.ts :: lost atomic tab-creation response is recoverable by ownership discovery without creating duplicate tabs or markers
operationalReportTabIsolation.test.ts :: owned operational namespace, real adapter/reconciliation transport NONE/NONE coexists with visual legacy Dashboard; retry uses the same owned IDs and RAW values
operationalReportTabIsolation.test.ts :: owned operational namespace, real adapter/reconciliation transport NONE/WEIGHBRIDGE coexists with visual legacy Dashboard; retry uses the same owned IDs and RAW values
operationalReportTabIsolation.test.ts :: owned operational namespace, real adapter/reconciliation transport WEIGHBRIDGE/NONE coexists with visual legacy Dashboard; retry uses the same owned IDs and RAW values
operationalReportTabIsolation.test.ts :: owned operational namespace, real adapter/reconciliation transport WEIGHBRIDGE/WEIGHBRIDGE coexists with visual legacy Dashboard; retry uses the same owned IDs and RAW values
operationalWorkspaceTemplates.test.ts :: pending unmapped legacy events remain visible without blocking current canonical profile Trips/reports
operationalWorkspaceTemplates.test.ts :: versioned templates and durable Script creation/recovery NONE/NONE provisions exact blueprint and script once; persists ID before installing; projects canonical data
operationalWorkspaceTemplates.test.ts :: versioned templates and durable Script creation/recovery NONE/WEIGHBRIDGE provisions exact blueprint and script once; persists ID before installing; projects canonical data
operationalWorkspaceTemplates.test.ts :: versioned templates and durable Script creation/recovery WEIGHBRIDGE/NONE provisions exact blueprint and script once; persists ID before installing; projects canonical data
operationalWorkspaceTemplates.test.ts :: versioned templates and durable Script creation/recovery WEIGHBRIDGE/WEIGHBRIDGE provisions exact blueprint and script once; persists ID before installing; projects canonical data
projectActivationReadiness.test.ts :: ProjectLifecycleService Governance & Audit Tests Scenario M: Direct status mutation via projectService.updateProject is blocked and fails
projectCanonicalRefreshBarrierA11.test.ts :: FOUNDATION A1.1 — Immediate Canonical Refresh Barrier 35. No page reload is used
projectDriverTruckAssignmentFoundation.test.ts :: PHASE 6 — UNIT 2B-2: Project Driver ↔ Truck Temporal Assignment Foundation Test Suite GROUP K: Boundaries & Legacy Invariance 51. Production assignment callers zero: only services, repositories, and test files reference assignDriverToTruck
projectGoogleWorkspaceTemplateSync.test.ts :: PFAG-GWS1 durable retry Google failure leaves canonical data and pending event intact, retry converges
projectGoogleWorkspaceTemplateSync.test.ts :: PFAG-GWS1 durable retry cross-project event is never written
projectGoogleWorkspaceTemplateSync.test.ts :: PFAG-GWS1 durable retry delivered event is not redelivered on retry
projectGoogleWorkspaceTemplateSync.test.ts :: PFAG-GWS1 durable retry revision changed in-flight remains pending for latest-state convergence
projectGoogleWorkspaceTemplateSync.test.ts :: PFAG-GWS1 provisioning public status never returns token-bearing internal fields
projectWorkspaceMasterSnapshotReconciliationUnit5D.test.ts :: Project Workspace Master Snapshot Reconciliation (Unit 5D) Tests 34. revision capture still occurs before snapshot build
projectWorkspaceProjectionAcknowledgementUnit5C.test.ts :: Unit 5C: Concurrency-Safe Successful Projection Acknowledgement Tests 17. /sync/initial captures freshness revision before buildInitialProjectionSnapshot
rosterIdentityGroupingProvenanceSiCg1.test.ts :: SI-CG1 partial mapping and source provenance absent Material yields no group, default, allocation or close
runtimeGenerationConvergence.test.ts :: runtime deployment generation gate stale lease blocks side effects and starts a fresh check
secureTripNumberingOffline89B.test.ts :: Block 89B Secure Trip Numbering & Offline Creation Test Suite [89B-REQ-08]: Verify state machine transition from PENDING_NUMBER_ALLOCATION to IN_TRANSIT is allowed
setupReadinessBoundary.test.ts :: P6-B2 separation and controlled functional journey activation rechecks Setup integrity outside the selected operational candidate at commit time
setupReadinessBoundary.test.ts :: P6-B2 separation and controlled functional journey operational prerequisites cannot override invalid Foundation Setup
setupWizardContinuity.test.tsx :: P6-B1 Foundation and Global governance presentation Foundation refresh failure keeps a receipt; retry never repeats the Project command
setupWizardContinuity.test.tsx :: P6-B1 Foundation and Global governance presentation PROJECT_ADMIN sees only its authorized Global profile controls
setupWizardContinuity.test.tsx :: P6-B1 Foundation and Global governance presentation keeps the successful canonical Foundation reread visible while the project subscription is delayed
setupWizardContinuity.test.tsx :: P6-B1 manual intake continuity uses the canonical Material name and full refresh before resetting the form
smartImportCommitIntegrityConvergence.test.ts :: Smart Import Commit Integrity Convergence Test Suite 39. report states server canonical snapshot authority holds true
smartImportEntityReviewWorkspaceR2.test.ts :: Smart Import R2 — Entity Review Workspace Wiring Test Suite 21. Post-decision batch is revalidated
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 38. committer calls snapshot client after canonical IDs resolve
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 39. committer uses returned carrierSnapshot exactly
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 40. committer uses returned truckSnapshot exactly
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 41. committer uses returned driverSnapshot exactly
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 42. committer uses returned materialSnapshot exactly
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 45. successful snapshot allows Trip write
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 46. written Trip uses final reviewed canonical IDs
smartImportGlobalCanonicalSnapshotBoundary.test.ts :: Global Canonical Snapshot Read Boundary (Unit 5) 48. no fabricated snapshot defaults reintroduced
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 17a. Server app route rejects client tripId with HTTP 400 and prevents dispatch/persistence
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 17b. Server app route rejects client tripNumber
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 18. Server app route rejects client pricingSnapshot
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 19. Server app route rejects client financials
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 20. Server app route rejects client settlementAmount
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 21. Server app route rejects client canonical entity snapshots
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 22. Server generates tripId on dispatchImportedTrip
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 23. Server generates tripNumber on dispatchImportedTrip
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 24. Server builds canonical snapshots authoritatively
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 25. Imported ticket preserved in weights.originTicketNo
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 26. Imported date preserved in sourceMetadata / weights
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 27. Imported origin tare preserved
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 28. Imported origin gross preserved
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 29. Imported origin net preserved or deterministically recomputed
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 30. Imported destination net preserved when valid
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 31. Import source metadata preserved
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 32. importBatchId provenance preserved
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 33. sourceRowId provenance preserved
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 34. Deterministic clientUUID accepted
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 35. Idempotent replay route exists in server/app.ts
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 36. Resolved pricing generated server-side when rule exists
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 38. Arbitrary imported status cannot bypass canonical status rules
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 39. Server route calls serverTripService.dispatchImportedTrip
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 41. No client tripRepository persistence in server route app.ts
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 45. Trip number generator used on server path
smartImportServerCanonicalCommitContractC1.test.ts :: SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract 8. Server validates project existence and non-archived status
smartTripImportOperationalConvergence.test.ts :: Step 4A-RECOVERY — Smart Trip Import Operational Convergence 2. Unauthorized field roles remain blocked by the existing role guard
smartTripImportOperationalConvergence.test.ts :: Step 4A-RECOVERY — Smart Trip Import Operational Convergence 23. Unresolved scope renders neither import child nor allows empty ID commits
tripIntakeConvergence.test.ts :: Step 3C — Trip Ingestion Entry Convergence 10. Explicit entity creation utilizes entityResolutionCommandService
tripIntakeConvergence.test.ts :: Step 3C — Trip Ingestion Entry Convergence 2. Project access governance remains available through the canonical ACCESS layer
tripIntakeConvergence.test.ts :: Step 3C — Trip Ingestion Entry Convergence 4. ExcelCsvImportSection correctly references and uses ExcelCsvPipelineService
tripIntakeConvergence.test.ts :: Step 3C — Trip Ingestion Entry Convergence 9. Entity resolution decisions route through standard ExcelCsvPipelineService path
tripOperationalCommands.test.ts :: Dispatch/loading reuse canonical relationships and FSM atomically DISPATCHER dispatch uses canonical identities, pricing and snapshots
tripOperationalCommands.test.ts :: Dispatch/loading reuse canonical relationships and FSM atomically SCALE_OPERATOR loading executes all FSM edges and derives weights, never cached financials
tripOperationalCommands.test.ts :: Import command preserves the existing domain seam reuses canonical imported-trip creation without trusting supplied actor metadata
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain does not acknowledge after lease expiry and the next worker safely reclaims unfinished work
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain keeps an unavailable file distinct and never replaces its recorded binding
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain preserves binding and pending data on 401 while classifying authorization precisely
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain preserves binding and pending data on 403 scope while classifying authorization precisely
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain preserves binding and pending data on 429 while classifying authorization precisely
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain preserves binding and pending data on 503 while classifying authorization precisely
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain preserves binding and pending data on network while classifying authorization precisely
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain refreshes a secure grant, rereads Firestore and delivers/acknowledges with no browser token
workspaceOfflineAuthorizationAndWorker.test.ts :: browser-absent canonical worker using the existing drain retains pending work and marks degraded after a generic Sheets 403
workspaceOneClickProvisioning.test.ts :: phase failure resume and strict READY proof same command resumes a temporary failure at reports without duplicate resources
workspaceProviderResilience.test.ts :: Q-PRJ-007-shaped user-active execution with durable authority server refresh feeds actual isolated Ops reports; stale browser token never reaches a provider
workspaceQuiescenceUi.test.tsx :: READY remains quiescent across timer intervals, focus/online/visibility, rerender and real remount
workspaceQuiescenceUi.test.tsx :: real hook remounts share the minute throttle rather than restarting an activity pass
```


## RB1 addendum — 2026-11-10


### AR2-U09-RB1 — Governance source ready for review; overall U09 BLOCKED — 2026-11-10

The [RB1 authority and recovery record](17_AR2_U09_RB1_SQL_GOVERNANCE_AUTHORITY.md) supersedes the earlier missing-governance statement only for bounded SQL account/project authority and typed presentation ports. Migration 012 remains additive; published 001–011 bytes are unchanged. Exact original/candidate migration discrepancy was proven and recovered using fresh disposable localhost databases, retaining the old database and candidate source.

AR2_U09_RB1_SOURCE_IMPLEMENTED_READY_FOR_REVIEW: native governance/HTTP 29/29; SQL full run 450/451 followed by 13/13 infrastructure PASS including its only backup timeout; independent authority 148/148; U07 53/53, U08 29/29, U09 browser 6/6. Matched history remains failing (baseline 2,399/2,494, candidate 2,401/2,494), exact new failure identities zero; 12 identical suite-load failures and 2 unhandled errors retained. TypeScript 446→446, added/removed zero, lint NOT PASS; build and diff PASS. Timing and rejected epoch-retry measurements remain documented rather than erased.

Overall U09 remains BLOCKED: RB2 UI/navigation/Smart Import consumers, RB3 real immutable-source/provider/export equivalence and RB4 SQL Workspace adapter are still required. Production remains Firestore and SQL-selected React root stays stopped. No PR/merge/deployment/production migration or activation was performed.


## RB2 addendum — 2026-11-10

### AR2-U09-RB2 — SQL UI source ready for review; overall U09 BLOCKED — 2026-11-10

The [RB2 integration evidence](18_AR2_U09_RB2_SQL_UI_INTEGRATION.md) supersedes the earlier missing-consumer statement for the bounded trusted SQL composition: existing React account/admin gates, navigation, project setup/lifecycle, operational controls, journal and supported persisted Roster import stages now consume real SQL ports. Production main still selects Firestore; no deployment or authority activation occurred. No migrations 001–012 or historical test assertions changed.

AR2_U09_RB2_SOURCE_IMPLEMENTED_READY_FOR_REVIEW: real PostgreSQL/React browser 27/27, principal/session 6/6, independent authority 148/148; native SQL 479/480 followed by unchanged infrastructure 13/13 closing its only backup timing failure; U07/U08/U09 integration 88/88. Fresh byte-matched RB1 baseline and final historical run both 2,402/2,494 with the same 92 failures, 12 suite-load failures and 2 unhandled errors; exact new failure identities zero. TypeScript 446→446 with zero added/removed semantic diagnostics: lint remains NOT PASS. Build and diff checks PASS.

RB3 immutable source/export/mapping provider and real reconciliation, RB4 six-resource SQL Workspace identity/revision/grant/delivery adapter, unsupported inventory/resolution/report consumers, and independent deployment/Rules/IAM/device/load/cutover approval gates remain OPEN. Trip point reads/actions are integrated; missing whole-project Trip/tariff inventories are not fabricated. Blocked-source/Workspace browser journeys prove the stop, not a completed provider delivery. Overall U09 remains BLOCKED.


## RB3 addendum — 2026-11-10

### AR2-U09-RB3 — Immutable source authority ready for source review; overall U09 BLOCKED — 2026-11-10

The [RB3 evidence](19_AR2_U09_RB3_IMMUTABLE_SOURCE.md) supersedes the missing production-capable source-provider/approved-export-adapter implementation statements. Trusted SQL composition now uses the production immutable provider on the existing bounded encrypted U05 artifact backend; the isolated adapter remains test-only. Current SQL scope, keyed ownership proof, original receipts, CSV/XLSX validation, reviewed intent and immutable history are preserved. A separate read-only frozen export adapter verifies independent owner/mapping signatures, current authorization and all 52 inventory categories. It does not certify production equivalence from synthetic tests.

AR2_U09_RB3_SOURCE_IMPLEMENTED_READY_FOR_REVIEW: new native PostgreSQL/authenticated API/export 48/48; actual React journeys 36/36 (9 RB3 + unchanged 27 RB2), full unchanged SQL 480/480, U07/U08/U09 browser 88/88, RB2 session 6/6 and independent authority 148/148. Fresh RB2 baseline and candidate history both 2,402/2,494, identical 92 failures, 12 suite-load failures and 2 unhandled errors; exact new failure identities zero. Compiler 446→446, zero added/removed semantic diagnostics, lint remains NOT PASS; build/diff PASS. Migrations 001–012 and historical assertions unchanged.

Overall U09 remains BLOCKED. No actual production source/export equivalence, production persistence/key/approved export deployment, interactive source mapping/resolution, unsupported remote formats or RB4 delivery is claimed complete. The required operator-approved frozen source/mapping package, independent live/CI/Firebase/Rules/IAM/drain/device/load checks and owner cutover approval remain open. Production stays Firestore; no PR, merge, deployment, production data operation or SQL activation occurred.
