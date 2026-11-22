# UI6 target discovery — Outbox Delivery Status & Recovery Guidance

Date: 2026-11-21. Baseline: main `9fda05f22888e97cd9538c7c32cb8c225c893376`, tree `26d930a9f1c03508461a54c53a73e0e266319cac`. **PROPOSED CONTRACT / OWNER_REVIEW_PENDING. UI6 NOT_STARTED.** This is source inspection, not a browser/live incident report or implementation authorization.

## Roadmap authority and sequencing

Discovery follows successful [UI5 source-closure reconciliation](UI5_POSTMERGE_CLOSURE.md). Reviewed the current start/ledger/handoff/debt records, [foundational Phase0–18 roadmap](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md), UI1–UI5 records and repository Markdown UI6 references. No approved UI6 product contract was found: the current inherited records reserve UI6 as NOT_STARTED. The foundational roadmap assigns offline/outbox behavioral ownership to Phase11, diagnostics to Phase12 and dashboard analytics to Phase13; these are distinct from the UI-unit numbering. This proposal does not activate/rewrite those backend phases. Prior [UI5 discovery](UI5_TARGET_DISCOVERY.md) already identifies offline recovery as a deferred alternative; it remains historical evidence, not an approval.

UI1 entry/dispatch, UI2 timeline/field work, UI3 setup/import/fleet readiness, UI4 reporting/export and UI5 account decisions are closed source units. None is reopened by this proposal.

## Active entry and authority map (current source)

| Active surface | Actual entry/source | Existing authority and permission boundary |
| --- | --- | --- |
| Global queue/recovery drawer | [App.tsx](../../src/App.tsx#L454) header queue button and conflict button both set isOutboxOpen; [mount](../../src/App.tsx#L990) also attaches OfflineIndicator. [MobileNavDrawer](../../src/components/navigation/MobileNavDrawer.tsx#L220) opens the same drawer. This is shell state, not a URL or new NavTab. | Available in the authenticated shell without a new admin role gate. [outboxService.getOperations](../../src/services/offline/outbox.service.ts#L85) filters current UID; [conflict reads](../../src/services/offline/conflictResolution.service.ts#L718) enforce current principal. Local data is not a new command authorization authority. |
| FIELD_OPERATIONS | [App](../../src/App.tsx#L569), FieldOperationsView, existing role-specific initial tabs and canonical trip entry targets. | Registry admits SUPER_ADMIN, PROJECT_ADMIN, SUPERVISOR, SITE_SUPERVISOR, DISPATCHER, SCALE_OPERATOR, DRIVER. UI1/UI2 own the completed product journey. |
| WIZARD / project ROSTER | [App](../../src/App.tsx#L595), ProjectSetupWizard, [FleetSetupWorkspace](../../src/components/wizard/FleetSetupWorkspace.tsx#L26). | WIZARD registry allows SUPER_ADMIN, PROJECT_ADMIN, FINANCE_AUDITOR; actual mutations additionally require project mutability/canonical server policy. UI3 owns existing readiness/eligibility/integrity and setup/import transitions. |
| WIZARD / Workspace panel | [WorkspaceEnsurePanel](../../src/components/wizard/WorkspaceEnsurePanel.tsx#L14), WorkspaceAutomationRecovery and ProjectSetupWizard details. | Existing actor/project/generation, credential/grant/resource and server checks. Derived Google projection does not replace Firestore authority. |
| OPERATIONS_DASHBOARD | [App](../../src/App.tsx#L557) renders AdaptiveOperationalReports for configured projects; otherwise OperationsDashboardView remains active. | Registry allows SUPER_ADMIN, PROJECT_ADMIN, FINANCE_AUDITOR, VIEWER; existing authorized-project scope remains binding. UI4 owns configured reports; legacy fallback is a distinct surface. |
| REPORTS_ENGINE | [App](../../src/App.tsx#L564), ReportsEngineView with optional operational configuration. | SUPER_ADMIN, PROJECT_ADMIN, SUPERVISOR, SITE_SUPERVISOR, DISPATCHER, FINANCE_AUDITOR, VIEWER; existing report/financial permissions unchanged. UI4 closed. |
| System Tools / ADMIN_CONSOLE and SECURITY_AUDIT | [App](../../src/App.tsx#L615), [navigation registry](../../src/services/navigation.service.ts), AdminConsoleView and SecurityAuditView. | Account reads/commands keep UI5's server/Rules and SUPER_ADMIN write policy. Security/test diagnostics are a separate existing surface, not evidence of operational acceptance. |

## Prioritized comparison

The priorities below are a source-based product judgment, not measured incident frequencies. High impact does not establish a production defect.

| Rank / candidate | Demonstrated source gap and user workflow | Operational relevance / dependency readiness / authorization safety / testability | Risk and recommended boundary |
| --- | --- | --- | --- |
| 1 — Outbox delivery status and recovery guidance | Drawer loadData combines operations, stats, cache metadata and conflicts in one Promise.all; catch only logs. Initial arrays are empty and the list renders an empty success-style state. A failed initial read therefore has no separate UI failure state. Filter chips expose raw enum tokens except ALL/AWAITING_RECEIPT. Sync/cache feedback has hardcoded Arabic. Several shell entries open the same drawer without distinguishing intent. Manual retry calls retryOperation then syncAll, which can process other eligible operations. | High daily field relevance; existing local readers and canonical receipt transport ready; safe if presentation-only and real service boundaries fixed; strong deterministic component/transport testability. | Medium-high because misleading labels could invite replay. Bound to truthful reads/status/action consequences. Preserve identity, existing queue-wide sync semantics, receipts, server authority and reconnect behavior. No new command or queue engine. |
| 2 — Unconfigured legacy dashboard provenance | OperationsDashboardView catches canonical project reads to empty arrays; per-project fleet failures to null; fallback reads local cache. Global filters coexist with widget overrides. Workflow needs clear unavailable/cache/source/filter scope. No incorrect live KPI has been established. | Medium-high relevance for unconfigured projects; mixed provenance dependencies; read-only authorization safety relatively good; fixtures available but KPI compatibility broad. | Medium-high scope risk. Separate bounded provenance contract; do not change financial math or reopen configured UI4 reports. |
| 3 — Workspace recovery/action hierarchy | EnsurePanel has observe/prepare, bounded resume and manual sync; project details and recovery offer additional repair/reauthorize/Script identity controls. These commands are not proven duplicates. | High when Workspace is used; dependency readiness partial due live Google acceptance; credential/resource consequences increase authorization risk; provider fixtures strong but live acceptance separate. | High provider/resource risk. Defer; preserve grants, existing resource identities, journals, automation and UI3 generation fences. |
| 4 — Diagnostic evidence labeling | SecurityAuditView imports test helpers and lists domains with fixed VERIFIED states. Source establishes a labeling ambiguity, not a reproduced security bypass or live certification. | Medium relevance, local dependencies ready, read-only safety good, deterministic testing easy. | Low-medium technical risk but less immediate operational value than queue truth. Separate diagnostics-only wording contract. No test-import cleanup campaign. |
| 5 — Fleet governance refinement | FleetSetupWorkspace already distinguishes operational/partial/ineligible/integrity states and canonical identity, participation, affiliation, assignment and allocation actions. Density alone does not prove a new defect. | High relevance; existing UI3 dependencies ready; sensitive authority surface; current setup/fleet suites available. | High reopening risk, weak newly demonstrated gap. Retain closed UI3 ownership; require new browser evidence before another fleet unit. |

## Proposed single bounded UI6 contract

**Outbox Delivery Status & Recovery Guidance**: an authenticated field user can determine what is locally queued, what is awaiting a server receipt, what is confirmed and what needs an explicit existing recovery action. Reading status must not be presented as successful delivery or as permission to issue a fresh command.

### Included behavior (only after owner approval)

1. Represent initial loading, successful empty, filtered empty, unavailable read, retained stale snapshot and explicit state refresh separately. Operations, conflicts and cache sections have independent availability; one failing auxiliary read must not present an empty/healthy queue. Record local observation time and provenance without inventing server freshness.
2. Preserve existing operationId/projectId/userId and original payload. Explain PENDING, SENDING, AWAITING_RECEIPT, SYNCED, FAILED and CONFLICT in AR/EN/UR. Awaiting receipt is uncertain delivery, not a confirmed failure or permission to create a replacement. SYNCED/ACK text must come only from existing confirmed state.
3. Make action consequences clear: state refresh reads current state; synchronize-now invokes existing queue-wide eligibility rules; existing per-operation retry prepares that operation and may then invoke the existing queue-wide synchronization. Do not label this as an isolated single-operation send. Keep confirmed-item cleanup separate from delivery; never offer deletion of uncertain/unacknowledged work. Keep existing conflict-resolution entry and engine intact.
4. Establish one primary recovery/status action with secondary cache, payload and simulation sections. No removal/reimplementation of existing simulation behavior: toggling back online currently can trigger synchronization. Preserve this behavior and disclose its consequence before activation. Network connectivity is distinct from server acknowledgement.
5. Keep header/mobile/offline entries leading to the same drawer. Correct current presentation wiring only where needed: App does not pass its pendingCount to OfflineIndicator, whose default is0. Expose available counts consistently without changing queue membership/count semantics or introducing a new route. Conflict entry may select its existing tab without creating a second conflict workflow.
6. Prevent a retired/closed/principal-changed local read or action from publishing into a new UI context. Use captured lifetime/identity and request sequence for UI state; preserve existing service/server authorization. Do not treat a frontend guard as canonical authorization. No automatic recovery command may originate from opening/filtering/reading this UI; existing service-owned reconnect sync remains unchanged.

### Exclusions and escalation boundary

No offline service, transport, queue schema, IndexedDB partition, conflict algorithm, pricing snapshot, operation ordering, receipt recovery, idempotency, retry cap/backoff or automatic reconnect policy change. No new server commands, Rules, roles, project membership, Trip FSM, account decisions, Workspace/provider polling, journal/canonical writer or SQL/RB4/013 activation. The inactive SQL offline engine and AR2-U07 are preservation dependencies, not an activated UI backend. No UI1–UI5 reimplementation, dependency/CI campaign, production data, deployment or Beta2 authorization.

If component acceptance cannot be met without changing those authorities, stop and return the proposed contract to the owner; do not absorb a backend recovery redesign into UI6. No transport-unknown retry is authorized merely by a UI refresh or selection change.

### Proposed file impact (not changes made in this task)

| Proposed edit roots | Limit |
| --- | --- |
| `src/components/offline/OutboxDrawer.tsx` | Main read/status/action presentation, context retirement and accessible drawer ownership. |
| `src/components/offline/OfflineIndicator.tsx` | Direction, truthful summary and accessible entry wording. |
| `src/App.tsx` | Only queue entry/count/tab-intent props and their local wiring; no route/auth/bootstrap rewrite. |
| `src/components/navigation/MobileNavDrawer.tsx` | Only consistent queue-entry label/intent if necessary; existing role nav unchanged. |
| `src/locales/ar/index.ts`, `src/locales/en/index.ts`, `src/locales/ur/index.ts` | Complete explicit keys/interpolation for this bounded product unit. |
| Optional new `src/components/offline/outboxPresentation.ts` | Pure typed status/count/feedback formatting only if extraction reduces UI complexity; no reads/writes/commands. |
| New `src/tests/ui6OutboxPresentation.test.tsx`, browser/connected journey test and owned helpers | Proposed additions only; actual count/inventory must be agreed at implementation preflight. Existing historical tests remain unchanged. |
| Current ledger, UI6 implementation/evidence records | Reconcile exact results and file inventory, preserve dated history. |

Read-only dependencies: `src/services/offline/outbox.service.ts`, `indexedDB.service.ts`, `conflictResolution.service.ts`, `offlineCache.service.ts`, `networkStatus.service.ts`; `src/services/tripCommandClient.service.ts`, canonical Trip server/Rules and auth/profile/project authority; `src/components/offline/ConflictResolutionModal.tsx`; `src/types/offline.ts`, `src/types/conflict.ts`. No edits to these are part of this proposed unit.

### Multilingual/mobile/accessibility acceptance

AR/UR RTL and EN LTR; fully translated state/action/feedback text with explicit complete runtime-auditable keys, no raw status enum as a user label and no injected private payload strings. Narrow320/390px and desktop layouts must preserve readable operation identity, long/multiline content, counts, errors and reachable actions without horizontal overflow. Keyboard opening, dialog name, focus containment/return, Escape/close, action labels and announcements must be verified. Source/DOM/browser accessibility checks are distinct from physical screen-reader acceptance; owner/device acceptance remains separate until actually observed.

### Test and verification contract

- New actual-component cases: loading versus true/filtered empty; each reader failure independently; stale successful snapshot marked unavailable; out-of-order completions; close/unmount/principal A-B-A retirement; unrelated eligible work remains visible under existing scope; every state/label/action consequence in AR/EN/UR.
- HTTP/service call assertions with actual production command transport and owned deterministic fixtures: opening/filtering/state refresh at a fixed network state sends zero command POSTs; manual actions preserve existing queue-wide behavior; unresolved delivery retains original identity and uses existing receipt-first path before any resend; ACK alone drives confirmed display. Distinguish receipt POSTs from command POSTs. Keep all operation IDs/counts, dependency ordering and authorization rechecks. Simulation/reconnect tests must explicitly account for pre-existing service-owned automatic sync rather than claim globally zero requests.
- Preserve/run affected suites: `tripOperationalOutbox.test.ts`, `canonicalReplayHarmonizationBlock132.test.ts`, `conflictResolution.test.ts`, `conflictEngine.test.ts`, `secureTripNumberingOffline89B.test.ts`, `currentPrincipalRules.test.ts`, `principalAuthorityRevocation.test.ts`; relevant UI1/UI2 and role/navigation assembly coverage. Include `ar2U07OfflineContinuity.test.ts` only through its existing supported SQL harness as inactive-backend preservation evidence, never cutover. Run UI5 76/PUB01 27/IR01 10 where shell/auth wiring overlaps; do not double-count PUB01.
- Run unchanged runtime i18n audit (current16/16 baseline), TypeScript, lint, build and matched baseline/candidate affected identities. Preserve326/329 NOT PASS with its three exact inherited failures and older316/319 separately; investigate any additional failures without weakening tests. UI4 historical14 remain a separate population.
- Proposed native Edge journeys: AR/EN/UR x desktop/narrow mobile; deliberate local read failure, reconnect, awaiting-receipt and confirmed receipt with actual rendered drawer/production transport. Record exact browser version, fixtures and request counts; no invented numeric PASS target before tests exist. Owned authenticated emulator scenario verifies current principal/project/role revocation and receipt/command behavior. No real account or Google resource mutation. Physical-device and screen-reader/live operational acceptance require separately recorded owner evidence.
- Exact file inventory, hash/working-tree preservation and `git diff --check` at implementation completion. No old tests/raw archives may be deleted, skipped or relabeled green.

### Owner decision and stop

Approve or revise this one UI6 contract, especially action consequences, allowed presentation roots and exclusions, before implementation. Acceptance requires independent source/test review, then product/operational acceptance on separately authorized devices/environments. This discovery implements nothing and authorizes no publication. UI5 source closure does not waive its historical non-green aggregate or grant Beta2 approval.

Disposition: **UI5_SOURCE_CLOSED_POSTMERGE / UI6_DISCOVERY_ONLY / OWNER_REVIEW_PENDING**.
