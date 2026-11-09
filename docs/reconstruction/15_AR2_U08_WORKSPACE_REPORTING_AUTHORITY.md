# AR2-U08 — Server-owned Workspace projection and reporting

## Verified preflight and bounded source scope

Starting/fetched main: `1db763ca6a5423f3855c1be251f4270a7e12048e`; expected SHA matches.
PR #98 independently read through GitHub: merged, merge SHA equals starting main.
Initial feature worktree clean; U07 and postmerge master handoff present. Dedicated
branch: `reconstruction/ar2-u08-workspace-reporting-authority`. Read ARCH-R1 Rev1.2
and current phase/debt/U07/handoff authority. Documentation-only changes after the
U07 merge are accepted source lineage; old handoff references to d2f2ae4 remain historical.
No production SQL, migration, epoch or cloud resource activation is authorized.

## Source authority and execution map (before code)

| Path | Current source / trigger / owner | Identity, receipt, recovery | Scope and cost | U08 disposition |
| --- | --- | --- | --- | --- |
| Canonical Trip command | tripCommands.server → buffered Firestore transaction → enqueueTripGoogleProjection | Stable per-Trip outbox document, local increasing revision; PROFILE_TRIP stores IDs then rereads live Trip | Canonical current user/project/FSM; no Google in transaction | Freeze projection evidence with stable revision and minimized payload; retain canonical Firestore authority |
| Foundation/master changes | markDirtyInTransaction → projection state + MASTER_DATA outbox in same command transaction | Coalesced mutationRevision; dirty-tab CAS acknowledgment | Existing canonical master snapshot; project scoped; full master reads only for dirty domains | Preserve source boundary, durable destination receipt and bounded work |
| Managed bound delivery | ProjectGoogleWorkspaceServer.retrySync called explicitly or coordinator | Expiring per-project lease and per-request renewal; no immutable delivery/RPC receipt; unbounded PENDING query; no durable backoff | Authorized current account/grant/binding/subject; row upsert stable key | Bounded discovery, durable frozen delivery, provider-side atomic replay fence, failure classification |
| Actor coordinator | authenticated /api/workspace/user-active-sync; hook is retired | Actor discovery lease/cursor; grant pointer/actor/binding checked | 20 candidates, 3 project attempts, 25s; no browser token/rows | Retain explicit bounded route, no automatic browser trigger |
| Scheduled worker | run-workspace-sync-worker.ts → runScheduled; deployment/scheduling dormant | Same canonical drain; may currently initialize/repair degraded resources | ACTIVE filter exists only scheduled branch; per-project error isolation | Pending projection only; no automatic provisioning/repair or periodic browser work |
| Explicit report refresh | authorized /workspace/refresh-reports | 60s cooldown, project lease; no source revision receipt; unfenced final timestamp; entire Trip collection read | Full historical recomputation and Google owned report tabs | Bounded explicit source snapshot, revision/staleness proof, durable recovery; do not modify Trip/commercial history |
| Google destination | Blueprint adapter → ServerWorkspaceService/owned operational tables, legacy template mapper | Numeric owned tab/row writes and stable business keys; no destination revision/idempotency fence against late old RPC | Bounded grid pages but full tab key discovery; provider request timeout 15s | Persist exact batch before send, atomic immutable marker plus data, receipt-first readback/replay; explicit provider capacity debt |
| Provisioning/repair/automation | existing ensure/resume/initialize and known Script maintenance | Existing operation identity, lease, ownership and recovery guards | Existing folder/Sheet/Script IDs | Preserve; never invoked merely by ordinary delivery retry |
| Legacy unbound projection compatibility | /sync/trips and /sync/sheets server-isolated routes; no live React callsites for syncProjectionToSheets | Bound projects already rejected by TEMPLATE_REQUIRES_CANONICAL_OUTBOX | Legacy canonical storage isolation, explicit old APIs | Preserve isolated compatibility; never a managed-bound bypass or automatic path; classify separately |
| Browser | retired useUserActiveWorkspaceSync; explicit ClientWorkspaceService commands | UID checked after token acquisition; no request-wide cancellation after logout | No idle sync POSTs; token stays memory-only | Add principal/generation abort for explicit requests; zero continuation after logout/account switch |
| SQL U01–U07 | immutable outbox/worker/binding/receipt tables and inactive authorities | Source transactions and epoch/receipt fences | Not production mounted | Remains inactive; no dual consumption of Firestore/SQL; U09 activation owns provider selection |

## Exact file allowlist established before production edits

Production (only directly traced integration boundaries):
- src/services/projectGoogleSheetEvent.server.ts
- src/services/projectGoogleWorkspace.server.ts
- src/services/projectWorkspaceProjectionState.server.ts
- src/services/workspace.service.ts
- src/types/projectGoogleWorkspace.ts
- server/workspaceSyncCoordinator.ts
- server/workspaceGoogleTransport.ts
- server/projectGoogleBlueprint.adapter.ts
- server/projectGoogleTemplate.adapter.ts
- server/operationalReportSheets.ts
- server/workspace.service.ts
- server/app.ts
- server/workspaceProjectionDelivery.ts (new, durable delivery/RPC journal within the existing server path)

Tests:
- src/tests/ar2U08WorkspaceAuthority.test.ts (new)
- src/tests/ar2U08WorkspaceTransport.test.ts (new)
- src/tests/helpers/workspaceProjectionProvider.ts (new, explicit atomic Google provider model)
- src/tests/helpers/operationalSheetsFixture.ts (only directly required additive metadata support)

Documentation:
- docs/reconstruction/02_PHASE_LEDGER.md
- docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
- docs/reconstruction/15_AR2_U08_WORKSPACE_REPORTING_AUTHORITY.md

No U07 implementation edits, migrations, credentials, generated artifacts, deployment,
production configuration, Workspace resource provisioning or U09 work. Any genuinely
required adjustment to this list must be source-justified here before that edit.

## Identified root causes and delivery decision

The existing lease and pre-request fence do not themselves stop a Google write
already on the network from arriving after a successor. A Firestore receipt alone
also cannot prove the destination mutation committed. A unique, immutable Google
DeveloperMetadata ID created in the SAME spreadsheets.batchUpdate as its data
provides an atomic replay fence: replay with the same ID cannot apply again after
it exists. Persist the exact request before sending; an uncertain predecessor is
read back or replayed verbatim before planning newer work. Do not infer rollback
from an HTTP timeout, nor re-plan an unknown write from a newer mutable snapshot.
This uses the existing Sheets API and owned workbook, not a new Apps Script web
app/deployment, Redis, cloud project or second operational authority.

Primary provider contracts inspected:
- https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate (batch validation/atomic application)
- https://developers.google.com/workspace/sheets/api/guides/metadata (duplicate explicit metadata ID rejects creation; bounded get-by-ID)
- https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.developerMetadata (positive spreadsheet-unique IDs)

Metadata is a finite provider resource (30,000 characters per spreadsheet and per
sheet). Capacity/collision must fail closed, retain pending evidence and expose
operator review; no implicit marker deletion/reuse or replacement Google resources.
No exactly-once network claim. Live provider/device/scale acceptance remains separate.

## Verification

Baseline is being measured at exact starting main with the pinned 133-file selection
in ../.sg1-tools/u08-regressions.txt, plus lint/build under Node22/npm10. New focused
cases are additional evidence. No PASS is claimed until execution completes.

Allowlist refinement before editing: `src/utils/workspaceHttp.ts` is the existing closed public error-code boundary; add only the new bounded delivery/review codes so the client can classify authorized retry status without forwarding provider messages.

Test-only scope refinement before edits: `src/tests/controlledIncrementalWorkspaceProjection.test.ts` and `src/tests/googleReportRefreshRateLimitBudget.test.ts` have handwritten reference stubs without document reads/receipt collections and return continuity data for unknown documents. Add the directly required Firestore reference/receipt capabilities; preserve every existing assertion and test case.

Test fixture refinement before editing: `src/tests/googleReportRefreshRouteCredential.test.ts` must expose the existing `forExecutionAuthorization` chain in its server mock, now required on report refresh. Assertions and HTTP cases remain intact; this verifies the durable-grant boundary rather than bypassing it.

Verification environment correction: the initial workspace had CRLF bytes in two untouched source files (`projectWorkspaceProjectionState.server.ts`, `workspace.isolation.ts`), while the clean starting-SHA checkout had canonical LF. Normalize those two working copies to identical Git LF bytes, without a Git source diff, before final comparison; two exact-text assertions otherwise measure checkout line endings rather than an implementation regression.

Before final harness edit: allow `src/tests/workspaceOneClickJourney.test.tsx` to import its real-engine fixture during module setup rather than inside the timed test. Diagnostic-only outer-limit run proved the unchanged journey succeeds (8/8) but cold dependency import raised duration from starting 3.7s to 6.4s. Keep the original 5s limit, waitFor, eight tests and all assertions. Apply the same additive test-fixture changes to the detached starting-SHA baseline and remeasure the identical 133-file selection; report both original and remeasured baseline. Also normalize untouched `server/security.middleware.ts` working bytes to canonical LF (zero Git content delta), the actual source read by the second newline-sensitive assertion.

## Implemented active-runtime authority contract

This is the existing Firestore operational path specified by the current owner prompt and U07 handoff, not a new database authority. ARCH-R1 §§8.6/19.2/22 remain the SQL target; no SQL worker is enabled, no SQL-to-Google consumer or SQL reporting activation is claimed by this patch. The inactive SQL Workspace tables remain unchanged. SQL provider composition and native verification remain a prerequisite to any future cutover, not permission to activate either writer now.

1. Canonical Trip commands already enqueue inside their buffered Firestore transaction. The event now freezes the approved operational configuration, timeline, measured weights and display snapshots, with stable Trip identity and increasing event revision. National IDs/contact/licence profiles and arbitrary source cells are not copied into these Trip events. Existing legacy source mapping still fails closed when missing. Old PROFILE_TRIP events without a frozen snapshot use one server point read, never a history scan.
2. Master events retain the existing canonical snapshot builder and source-revision CAS. A bounded read adapter rejects a partial/oversized inventory rather than deleting omitted identities. Ensure/initialization reuses already-dirty intent; it does not manufacture a new source revision on each resume.
3. `workspace_continuity/current` owns one project lease, active frozen delivery, pending exact RPC, completed-plan set, retry budget and completion watermark. `workspace_delivery_receipts` records scoped logical receipts and per-event revision heads. `workspace_projection_rpcs` records committed destination witnesses. These new nested server journals remain under the existing default-deny Firestore client rules; status returns only allowlisted health, hashes/IDs and revision metadata, never journal payloads or credentials.
4. A logical delivery key binds project, existing destination, binding revision, outbox ID and event revision. The frozen payload digest and event digest are verified. Reused identities with changed data, lower committed revisions and changed bindings fail closed. A coalesced newer event is never acknowledged by completion of its predecessor.
5. Google transport is intercepted at the public Gaxios request boundary. Every managed data mutation is numeric-sheet `spreadsheets.batchUpdate`; legacy RAW writes are converted to literal atomic cell updates within this context. Before sending, the exact batch is durably journaled. A positive unique metadata ID and its data are committed together. Marker readback reconciles a lost ACK; duplicate marker creation aborts an entire late batch. Recovery of an unresolved RPC precedes fresh reads/planning, and workbook maintenance first drains unresolved delivery. A lease alone is never represented as a destination fence.
6. Recovery can repeat reads and idempotent reconciliation; this is not exactly-once HTTP delivery. Completed identical plans are reused within the same logical delivery. Credential/Drive checks precede entry to Sheets recovery, and current account, project, grant pointer, actor, subject and binding are revalidated before each provider request/ACK. No OAuth material is persisted in the journal.
7. Automatic failures retain pending work, release leases and use durable exponential backoff with a five-attempt ceiling. Permanent/capacity/conflict failures expose review state. An authenticated exact `retryDeliveryId` permits explicit review/retry without rewriting frozen data; failures before a payload is frozen also receive a review identity. Explicit ensure retries may resume under a new authorized ensure owner, preserving the attempt ceiling. A source-revision race is contention rather than a fabricated provider outage.
8. `lastDeliveredSourceRevision` advances only in a transaction proving the pending queue/active RPC and master dirty state are clear. It is not the maximum revision of one arbitrarily completed row. Reports have a separate source watermark, 60-second explicit refresh guard and stale flag. Report snapshots are bounded, frozen and fenced; a mutation during refresh leaves the newer source stale. Historical Trips, measured weights, pricing snapshots and settlement calculations are never rewritten.
9. The scheduled coordinator is still dormant, filters ACTIVE projects and only drains eligible pending work. It cannot initialize/repair resources as an ordinary delivery retry. Actor-driven explicit SETUP maintenance retains its existing authorization. Browser mount/focus/visibility/online synchronization hooks remain retired. Explicit browser requests carry a captured principal, abort on logout/account change, and reject late old-principal responses.

### Parallel continuity paths retained and distinguished

- Existing Apps Script simple triggers, manual report menu/calculations, review cells, formulas and audit remain downstream continuity, never canonical Trip or pricing authority. Their installed versions and any human/Script edits are not attested by the server-event receipt. This patch does not deploy/update Scripts or claim protection against arbitrary external spreadsheet editors. Live acceptance must inventory existing Script triggers/versions and distinguish manual derived-sheet edits from server delivery health.
- Unbound legacy projection endpoints remain compatibility paths. Existing bound-project rejection (`TEMPLATE_REQUIRES_CANONICAL_OUTBOX`) is retained; no active React background caller is introduced. Provisioning/ensure remains explicit, uses the known binding/Script identity and existing ownership checks, and never creates a replacement resource because of a delivery failure.
- The only new Google objects described by the delivery algorithm are metadata markers within the already-bound workbook; owned-tab reconciliation uses the existing workbook contract. No cloud project, Drive folder, spreadsheet file or Script project was created during this work.

### Field-level preservation

| Evidence | Authority / boundary | Result |
|---|---|---|
| Trip/entity IDs, event revision, status | Canonical command transaction; minimized frozen outbox | Stable identity, original command replay unchanged |
| Operational configuration/timeline/weights | Existing immutable Trip snapshot and measured values | No invented weights, lifecycle timestamps or pricing |
| Master rows and membership/temporal relations | Existing canonical projection builder, bounded source inventory | No browser row authority or partial-inventory deletion |
| Google root/folder/Sheet/file/Script/subject IDs | Existing binding and durable grant; current authorization | Source guards and unchanged-binding assertions; no live cloud mutation |
| Source revision / report watermark | Projection state and queue-clear CAS | Status distinguishes lag from committed delivery and explicit report refresh |
| Provider batch / destination witness | Immutable batch hash + unique metadata ID in one atomic request | Lost ACK and delayed duplicate reconciliation; unknown/colliding witness held for review |
| Delivery telemetry | Server receipts/timestamps, separate from domain evidence | Does not rewrite historical source facts |

## Bounded budgets and evidence classes

- At most 20 queued events and 160 managed provider requests per pass, a shared 20-second provider deadline, individual timeout at most 15 seconds, and no transport automatic retries. Existing credential/binding verification reads are separate, bounded requests; no calls occur for a healthy idle queue.
- Frozen logical payload <=600,000 bytes; provider plan <=240,000 bytes; explicit source inventory <=2,000 rows (read sentinel 2,001); bounded worksheet key pages, <=20,000 grid rows in managed projection. Oversize is explicit review, never a successful partial report.
- Marker sequence ceiling 20,000 per existing binding. Previous marker values are compacted inside the next atomic batch, but immutable IDs are never deleted/reused. Provider metadata storage is finite: capacity/collision fails closed; no automatic workbook replacement or unproved garbage collection.
- The real 1,000 and 10,000 historical Trip fixtures contain actual separate stored Trip documents derived from a canonical command. Both measured 15 model transactions, 52 point reads, four query calls returning three documents, 11 journal/receipt writes and three provider requests. Completed retry: zero writes, zero returned query documents, zero additional Google calls. These are deterministic model/application budgets, not Firebase billing, live Google quotas or production p95 latency.
- New tests execute actual canonical command services, the production delivery class, real public Gaxios with a controlled adapter, the production Blueprint failure boundary, and principal-scoped client fetch. Firestore/Sheets persistence is explicitly modeled, not represented as an emulator or live provider. Existing real HTTP route tests remain executed. Native SQL suites are not newly run for this patch because no SQL source/schema/route is changed; the explicit four-file 148 authority bundle is run separately.

## Remaining gates / debt (not waived)

Production Google/Firebase/mobile/role/scale acceptance, current installed Script trigger/version inventory, human/Script edit reconciliation, marker capacity planning and controlled legacy-event source classification remain open. There is no live-provider exactly-once or production-ready claim. SQL Workspace provider/report composition must be independently implemented/composed and native-verified before SQL activation; this patch does not activate or certify that path. Existing repository test and TypeScript debt is measured separately below. No U09 execution, epoch advancement, production migration, deployment, PR or merge.

### Additional report/read-path audit

`AdaptiveOperationalReports.tsx` reads a bounded 500-Trip project view on project change and computes local display metrics with the existing `buildOperationalReport`; its Google refresh button calls the authenticated explicit server operation. It is not a browser-to-Google delivery loop or a complete historical inventory witness. `ReportsEngineView.tsx` / `reportsEngine.service.ts` retain existing local reporting/export and historical captured-pricing calculations; no new Google writer is introduced there. Their historical test debt is retained. Complete historical/paginated product reporting remains distinct from the bounded Sheets refresh and future SQL read-model composition.

The atomic RAW conversion additionally grows an existing grid, when required, in the same numeric-ID batch as its cell writes and replay marker. It does not depend on the retired managed `values.append` auto-growth side effect. This final adapter correction has direct regression coverage and an affected-adapter rerun; no existing case, assertion or timeout was removed.

## Final verification and bounded readiness — 2026-11-09

Toolchain: Node 22.22.0 / npm 10.9.8, installed dependencies unchanged. Final fetched main remains `1db763ca6a5423f3855c1be251f4270a7e12048e`.

| Gate | Actual result |
|---|---|
| Original exact 133-file starting-SHA baseline | 2,373 passed / 92 failed assertions; 12 suite-load errors; two historical unhandled rejections |
| Remeasured starting SHA with the same four additive fixture preparations | 2,372 passed / 93 failed; the unchanged source-digest assertion varied on rerun; no source fix is inferred from that variability |
| Final exact same 133 files | 2,373 passed / 92 failed; failure identity set equals the original baseline; no newly failed assertion versus either baseline |
| New U08 tests | 29/29 PASS; no skipped/removed existing cases or weakened assertions/timeouts |
| Final combined 135-file selection | 2,402 passed / 92 failed / 0 skipped, 2,494 assertions; 12 same suite-load errors; two same historical unhandled rejections |
| Explicit standalone four-file authority command | 148/148 PASS: 50 + 30 + 61 + 7 |
| Typecheck/lint | EXIT 2 / NOT PASS: 446 → 446 diagnostics, added 0 / removed 0 by file/code/message (ignoring moved line coordinates) |
| Production build | PASS / EXIT 0, client/PWA and server bundle; existing bundle warnings retained |
| Unstaged diff check | PASS |
| Schema/authority scope | All ten published migrations 001–010 unchanged against starting main; no SQL, rules, dependencies, workflow or production configuration changes |
| Cloud/live acceptance | NOT PERFORMED; no real Google resources or production runtime modified |

An intermediate concurrent typecheck/full-test run hit the unchanged five-second OAuth/repair test limit. The same final-source test passed in the adapter run and again in the final serial 135-file run (2.66 seconds), with its original deadline/assertions. The final release run had no concurrent compiler/build/test workload. This timing outlier is recorded rather than hidden or made non-blocking. The one-click fixture dependency import was moved to module setup in both comparison checkouts; the five-second journey limit and all eight assertions/cases remain intact.

The affected-adapter post-review run was 85 passed / one baseline failure, including all 29 new U08 tests; the baseline failure is the prior ordinary-sync report expectation. This is additional evidence, not a replacement for the final full selection. Native PostgreSQL was not started or represented as tested by this source-only Firestore change.

The twelve pre-existing suite-load failures are: `conflictEngine.test.ts`, `conflictResolution.test.ts`, `googleDriveImport.test.ts`, `googleSheetsImport.test.ts`, `pricingEngine.test.ts`, `reportsEngine.test.ts`, `reportsEngineControlCleanup.test.ts`, `reportsEngineConvergence.test.ts`, `tripIdentityAdjustmentBlock89.test.ts`, `weighbridgeImport.test.ts`, `workspaceConvergence.test.ts`, `workspaceIntegration.test.ts`. The two unhandled rejections are the pre-existing `conflictEngine.test.ts` process.exit path and `projectContextLifetime.test.tsx` delayed rejection. The original 92 failed assertion identities remain unchanged; do not describe the entire repository test run or lint as PASS.

### Reproducible commands

Run the exact file list below with `npx vitest run --no-file-parallelism <files>`; final verification adds `src/tests/ar2U08WorkspaceAuthority.test.ts` and `src/tests/ar2U08WorkspaceTransport.test.ts`. Use the same Node/npm versions and fixtures for the detached starting-SHA comparison.

```
npx vitest run src/tests/reviewedRosterCommitP8B2.test.ts src/tests/rosterExecutionRecoveryP8B3.test.ts src/tests/temporalRelationshipAuthority.test.ts src/tests/txReadCacheCorrectness.test.ts --no-file-parallelism
npm run lint
npm run build
git diff --check
git diff --cached --check
```

<details><summary>Exact 133-file comparison selection</summary>

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
```

</details>

### Exact changed file inventory (23)

- docs/reconstruction/02_PHASE_LEDGER.md
- docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
- docs/reconstruction/15_AR2_U08_WORKSPACE_REPORTING_AUTHORITY.md
- server/app.ts
- server/operationalReportSheets.ts
- server/projectGoogleBlueprint.adapter.ts
- server/projectGoogleTemplate.adapter.ts
- server/workspace.service.ts
- server/workspaceGoogleTransport.ts
- server/workspaceProjectionDelivery.ts
- server/workspaceSyncCoordinator.ts
- src/services/projectGoogleSheetEvent.server.ts
- src/services/projectGoogleWorkspace.server.ts
- src/services/workspace.service.ts
- src/tests/ar2U08WorkspaceAuthority.test.ts
- src/tests/ar2U08WorkspaceTransport.test.ts
- src/tests/controlledIncrementalWorkspaceProjection.test.ts
- src/tests/googleReportRefreshRateLimitBudget.test.ts
- src/tests/googleReportRefreshRouteCredential.test.ts
- src/tests/helpers/workspaceProjectionProvider.ts
- src/tests/workspaceOneClickJourney.test.tsx
- src/types/projectGoogleWorkspace.ts
- src/utils/workspaceHttp.ts

The unchanged working-copy LF normalization in three source files is NOT a Git content change and is NOT part of this inventory. No historical document/asset or published migration is rewritten.

### Evidence artifacts

Raw local artifacts are in `../.sg1-tools/`: `u08-baseline-tests.{json,log}`, `u08-remeasured-baseline.{json,log}`, `u08-release-tests.{json,log}`, `u08-required-148.{json,log}`, `u08-adapter-final.{json,log}`, `u08-release-lint.log`, `u08-release-build.log`, and `u08-scope-evidence.json`. They contain synthetic test/provider data, not production credential dumps; generated artifacts are not committed. The exact selection and commands above are retained in this record for independent reproduction.

- u08-baseline-tests.json SHA256: `7b51293836adcc7e2db0af328fe9d5e9bc47d9d436928bee436200327cd239f3`
- u08-remeasured-baseline.json SHA256: `fec52385c23ea66421dd653b5632d9bcd4986d90ea755bec9ff03156d2d6911f`
- u08-release-tests.json SHA256: `fae7cb4a734e05788b498dddddc29c015b5a46d8f3d377d9c6745359e597d8b0`
- u08-required-148.json SHA256: `46352ba8e2a1ed2b228207920e0106728c1c0f51b0aa6c4cc73f98f7f280b4d3`

Source status: `AR2_U08_SOURCE_IMPLEMENTED_READY_FOR_INDEPENDENT_REVIEW` for the bounded active-runtime contract. Not MERGED/CLOSED, not live accepted, not a SQL activation/cutover certification. The dedicated branch commit/remote SHA and final Git cleanliness are reported by the executor after publication; no PR, merge, deployment or U09 execution is authorized/performed.

Final Git gate: staged and unstaged diff checks PASS; exact staged inventory 23/23, canonical staged bytes match tested working text, published migrations 001–010 unchanged, obvious private-key/access-token signature scan zero. The commit follows these completed gates; its immutable SHA/remote confirmation are in the executor publication report.
