# Smart Roster Import assurance

Current state is defined only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Evidence baseline: `4d193d96791425c4d3c3bcaa60f06175036efdfb` (merged PR #85). This package preserves the accepted domain/persistence authorities and does not activate another reconstruction phase.

## Execution and reachability

There is one active Roster execution journey before and after this package. Stage fallback presentation is not a second commit authority.

| Classification | Source / entry | Authority and exit |
|---|---|---|
| ACTIVE_PRODUCTION | `ProjectSetupWizard`: file change/drop, `processRosterFile`, Sheets source adapter, source acceptance, sheet/header/mapping changes | Bounded intake/discovery; stable Project/Session/Operation/Batch and source/mapping revisions; explicit mapping approval before pipeline analysis |
| ACTIVE_PRODUCTION | `smartSourceDiscovery.service`, `rosterSourceContract`, file intake, CSV/Excel parsers, column mapper, normalizer, `driverTruckImport`, `driverTruckPipeline`, shared pipeline/default stages | Parse/map/normalize, canonical row resolution, validation and duplicate evidence; no raw-row execution authority |
| ACTIVE_PRODUCTION | `RosterCarrierResolutionLayer`, `RosterMaterialResolutionLayer`, `RosterDriverTruckResolutionLayer`, `CanonicalResolutionDecision`, `RosterBatchReviewService`, `canonicalResolution`, `ImportProjectContextAdapter` | Natural/canonical grouping; explicit alternate decisions; live global/membership/affiliation eligibility; all-row stage gates |
| ACTIVE_PRODUCTION | `ContextualCanonicalCreation`, Carrier/Material editors and `CanonicalFleetIdentityEditor`, `contextualCanonicalCreation.service`, canonical resolution command adapter | Pre-create natural lookup; canonical server creation/enroll/reactivate/affiliation; retained convergence receipt; no copied temporal authority. Wizard Fleet preparation remains PREPARED_NEW, not immediate contextual creation |
| ACTIVE_PRODUCTION | `RosterSemanticReview`, `rosterCanonicalIntent.service`, accept-intent and reviewed-commit handlers | Full reviewed signature, warnings/displacement approval, current canonical revalidation, durable intent artifact. A rejected Back confirmation preserves the current review |
| ACTIVE_PRODUCTION | `reviewedRosterCommit.server`, `rosterExecution.server`, `rosterExecutionPlan.server` | Existing server principal/Project/session/review bindings, deterministic consequence identities, transaction receipts and fencing; exactly-once effects and bounded partial progress |
| RECOVERY_ONLY | `durableSessionContract`, session client/server/artifact codec, `rosterResumeJourney`, restore/retry/cancel/execution-status handlers | No invented source or success; exact reattach; optimistic checkpoint versions; immutable reviewed meaning; read-only post-ACK convergence; existing journal/receipt truth wins over lost responses |
| ACTIVE_FALLBACK | Legacy display branches inside resolution layers; `RosterFinalReviewLayer`, `RosterCommitResultLayer` | Kept for compatibility/test authority. Normal rich canonical intent and B3 recovery/result take precedence. No fallback may bypass server reviewed-intent execution |
| RECOVERY_ONLY | `handleRetryDriverConvergence`, `handleRetryTruckConvergence` and cached-result banners | Historical convergence affordances retained; current PREPARED_NEW path does not seed those old creation caches |
| DEAD_LEGACY (current Roster UI) | `handleApplyResolutionDecision`, `handleApplyGroupedResolutionDecision`, `handleGroupedCreateMissingEntity`, `handleCreateMissingEntity`, `handleCommitRosterImport` in Wizard | Each identifier occurs only at its declaration in production. Kept because historical tests inspect these bodies; not wired to UI/runtime, not deleted or revived |
| LEGACY_REACHABLE (outside Roster journey) | Shared Excel/Google Sheets import-center compatibility and Trip-oriented import services/tests | Inspected as shared consumers/regressions, not redesigned or represented as current Roster commit authority |

Discovery includes the directly imported components/services and the 44-file `src/services/import/` dependency inventory. Historical test contract inventory includes every named `rosterSmartImport*`, `smartImport*`, `canonicalImport*`, `importResolution*`, `rosterResume*`, `rosterExecution*`, `reviewedRosterCommit*` suite; names alone do not prove runtime coverage. Existing baseline tests are distinguished from behavioral DOM/transaction tests below. No production path was deleted based only on its age. No UNKNOWN path is used to justify a mutation or weaker contract.

## Closed defects and decisions

1. An editor portal used to become an inline pending/retry dialog after mutation. The entire lifecycle now uses `ImportOverlay`. Levels are named WORKFLOW / EDITOR / CONFIRMATION; one manager owns parent inertness/ARIA visibility, outside pointer rejection, topmost keyboard/Tab/Escape, initial/return focus and body scrolling. Child dismissal never cancels the import. Busy contextual import editors can be dismissed; standalone Carrier/Material editor busy-close semantics remain unchanged. Their stale completions cannot publish. Canonical mutations already committed remain authoritative.
2. Stage/session/project/reset ownership destroys or fences old children. Carrier/Material children render only for their owning stage; Driver/Truck children unmount with the stage. The file input belongs inside the workflow portal, so inert background ownership cannot block its normal activation.
3. `RosterInteractionAuthority` synchronously admits one mutating UI command before React renders busy state. Canonical participation owns mutation → refresh → grouped choice → checkpoint as one command. Existing flags retain phase feedback, not mutation authority. UI owner tokens cannot grant server authority; invalidation prevents an old `finally` unlocking a new command.
4. Project lifetime alone did not fence replacement sessions. Every active import completion/checkpoint/refresh also verifies the import generation. Cancel retires prior completions immediately; only server ACK clears local work. Failure exposes exact retry or authoritative version-conflict reload. An old commit completion cannot clear a new session's commit gate.
5. Checkpoint ACK followed by canonical refresh failure used to lose the retry command. Pending restore retains the acknowledged record and retries reads only; it never resubmits the successful write or canonical mutation. Failed checkpoint commands retain their exact version/payload; conflicts fail closed.
6. Incomplete coherent Fleet setup used to publish a parent revision, triggering revision → read → revision indefinitely. Missing/mismatched setup now terminates in bounded read-error/retry UI before publishing.
7. Active Roster alerts become owned inline feedback. Cancellation/back confirmations use owned dialogs with the same decision and translated warning. Native dialogs remain only in the five uncalled historical Wizard helpers and unrelated Project operations; they are not normal Roster dependencies.
8. Grouped decisions used to clone/scan the whole batch once per matching row. The same row decision authority now receives one-row views and the whole roster is revalidated once. Canonical indexes are rebuilt per read/pass, never cached across a refresh. Identity, ambiguity, duplicate, affiliation, status and explicit-selection semantics remain intact. Sets replace repeated blocker/provenance/membership scans without changing signatures/row order.
9. Reset/project retirement clears local prerequisite receipts and their owned in-flight keys. A late old completion cannot unlock a replacement command using the same receipt key. This clears UI evidence only, never canonical Master Data.
10. Group and semantic review presentation is paged; alternate options are bounded and searchable by name/ID/natural identity. All groups remain reachable. Full counts, blockers, signatures, warning/displacement approval and execution plans still use the complete batch, not just the visible page. No hidden page can enable a blocked forward action.

## Native-control inventory (baseline → final active path)

| Baseline handler/component | Native calls | Replacement |
|---|---:|---|
| `handleSmartImportContinueToMaterials` | 3 alerts | Inline missing-group, unresolved-group and unresolved-row feedback |
| `handleSmartImportContinueToDriverTruck` | 3 alerts | Same three Material gates, without making Material mandatory when absent |
| Driver/Truck candidate and alternate handlers | 4 alerts | Owned inline decision/refresh failure |
| Carrier/Material candidate and alternate handlers | 4 alerts | Owned inline decision/refresh failure |
| `handleSmartImportContinueToFinalReview` | 3 alerts | Inline group/pending/revalidation feedback; every semantic blocker is visible |
| `handleFinalReviewBack` | 1 confirm | Owned Carrier reanalysis confirmation; rejection preserves current reviewed state |
| Three resolution layers | 3 confirms | Owned cancellation warning with AR/EN/UR resolution; ACK still required |

Active native calls: 21 → 0. The five DEAD_LEGACY Wizard helpers retain 25 historical calls; unrelated Project/Workspace/Pricing alerts are outside this unit and not normal Smart Roster reachability. No historical handler was activated merely to make an assertion green.

## Test harness convergence

Existing counts are preserved. The Carrier/Material layer tests replace distributed z-60/z-50 source assumptions with the shared editor > workflow authority and actual editor/host consumption. Journey/session tests retain cancellation/terminal/message assertions but follow owned confirmation/inline alerts and whole function boundaries rather than fixed character offsets. The portal-render suite always unmounts roots, including after failed assertions, before removing DOM. The P7 canonical UI fixture supplies the already-required coherent refresh barrier, preventing late test transport leakage. The nine P7 intake cases retain pre-read file rejection, read-error recovery, mapping validation and explicit analysis gating; queries follow the portal, and fixtures/assertions reflect the accepted P8 source checkpoint before approval while proving no review batch exists before approval. None of these permits a new domain rule or removes a case. Independent baseline failures remain separately recorded.

## Retained semantic boundaries

- Natural identity outranks name/fuzzy evidence; duplicate display names require explicit resolution. Rejected rows do not participate in active grouping. IDs are never synthesized from labels.
- An existing entity with missing/inactive membership requires explicit enrollment/reactivation. Driver/Truck affiliation must match the selected Carrier; wrong-carrier identities cannot create a valid intent. Historical PR #86 policy made Material optional when absent from source. **Superseded for operational Roster** by [the live continuity contract](LIVE_INTAKE_CONTINUITY_CONTRACT.md): explicit durable Project Material binding is now required; source-specific material evidence is retained.
- Create, enrollment, reactivation, affiliation and temporal assignment/allocation stay distinct. Contextual creation invokes canonical Master Data authority. A lost create response retries lookup; a retained successful receipt retries only convergence. Server natural-key uniqueness remains the final duplicate boundary.
- P8-B1/B2/B3/B4 are not weakened. Durable reviewed intent remains execution meaning; a canonical change removes review approval instead of silently changing it. Execution recovery consumes the existing journal, receipts, version and fence. Terminal result does not return to editing; a new import requires explicit reset/new session.
- Source reattach checks exact source identity/fingerprint. Refresh/resume cannot invent missing metadata, revive a terminal session, change reviewed meaning or execute raw rows. Canonical Master Data already committed survives UI reset/cancel.
- Authorization is current on the server; Project and session generations only fence local publication. No new browser Firestore authority, provider scopes, Workspace provisioning, Trips/Reports behavior or deployment changes.

## Error and interaction contract

Failures are classified as USER_CORRECTABLE, RETRYABLE_TRANSIENT, STALE_CONTEXT, AUTHORIZATION, INTEGRITY_BLOCKER, TERMINAL or RECOVERY_REQUIRED. Existing translated semantic messages identify correction, read-only retry, version-conflict reload or refusal. Busy commands release their owned UI gate in `finally`, and users retain an owned cancellation/close path. No native dialog or swallowed failure is the normal recovery controller.

## Verification evidence

Final counts/results are recorded after the complete comparison with the exact baseline; counts are observations, not frozen invariants. The broad command may remain nonzero for independently reproduced historical debt. No test deletion, skip or weakened domain assertion is authorized. Compatibility changes replace numeric layer/native-control/source-offset assumptions with the same semantic contract under the shared authority. Failed historical React test assertions must still unmount roots before deleting portal DOM.

Behavioral coverage uses `smartImportOverlayAssurance`, `smartImportInteractionAssurance`, `smartImportJourneyAssurance`, SI-CG1/SI-CG2 and P7/P8 regression suites. It includes actual editors and parent portals; pending/retry/dismissal; pointer/focus/keyboard restoration; command/cancel/new-session ownership; pre-create lookup/lost-response recovery; checkpoint/version/readback failures; actual Wizard/parser/durable-session/server-executor/result; refresh/resume/reattach; partial execution and exactly-once receipts. Scale includes 10,000 repeated Carrier occurrences, thousands of distinct Driver/Truck identities, and bounded group/alternate DOM.

Local models prove control flow and structural accessibility, not real browser hit-testing, provider latency or Firebase acceptance. Browser acceptance remains NOT_PERFORMED.

## Final local verification — 2026-11-02

Independent baseline archive: exact `4d193d96791425c4d3c3bcaa60f06175036efdfb`, same dependencies and test selection. Results below consolidate the latest completed result per file; they do not sum repeated runs. They are observations, not permanent test-count gates.

| Selection | Result | Interpretation |
|---|---|---|
| New overlay behavior | 26/26 PASS | Four actual editors, nested ownership, pending/retry, dismissal/lifetime, focus, pointer, keyboard, paging/search |
| New interaction/identity/scale | 30/30 PASS | Command/receipt ownership, stale generations, stage machine, indexed/unindexed equivalence, canonical refresh, scale |
| New actual Roster journey | 9/9 PASS | Actual Wizard/parser/session/executor under controlled transactional persistence; happy path, cancellation, checkpoint/readback/version conflict, remount, stale completion and Fleet reload loop |
| Final closure command | 134/134 PASS | Above 65 plus SI-CG2 60 and intake 9 |
| Existing Phase-8 regressions | B1 41/41; B2 50/50; B3 30/30; B4 14/14 PASS | Durable source/review, reviewed execution, receipts/partial/lost-response recovery, resume/reattach |
| Unique closure + Phase-8 selections | 269/269 PASS in nine files | No repeated case counted twice |
| Canonical resolution / intent / SI-CG1 | 25/25; 37/37; 53/53 PASS | Natural identity, same-name ambiguity, membership/affiliation conflicts, reviewed signatures and provenance |
| Affected selection, latest per file | 1499/1579 PASS, 80 baseline-existing failing cases; 56 files | NOT all green; includes 65 new cases; original affected baseline was 1424/1514 PASS, 90 failing cases |
| Additional broader selection | 829/920 PASS, 91 baseline-existing failing cases; 35 files | NOT all green; independently reproduced baseline had 814/920 PASS, 106 failing cases |
| Combined baseline → final | 2238/2434 → 2328/2499 PASS; 196 → 171 failing cases | 65 added cases, 25 old failures now pass; NEW_FAILURES=0; REMOVED_TESTS=0; SKIPPED_TESTS=0 |
| Build | PASS | Client/PWA and server bundle |
| Lint / diagnostics | EXIT 2 / NOT PASS; 440 → 440, added 0, removed 0 | Exact diagnostic file/code/message multiset compared, ignoring shifted line numbers |
| Locale safety | AR=EN=UR=4688 | Five append-only keys; duplicate definitions 0, parity gaps 0, empty values 0, unrelated existing value edits 0 |
| Git diff check | PASS | No package/config/workflow/rules/server/Workspace assets or generated output changes |

The same historical `entityResolution.test.ts` and `importSession.test.ts` empty-suite errors remain. `importSession.test.ts` also calls `process.exit(1)` under Vitest; the broader `projectContextLifetime.test.tsx` reports its historical unhandled `Error: A failure`. These were independently present on the baseline and remain disclosed; passing case counts do not erase suite/runtime errors. No live Firebase, Google provider, deployed browser or user acceptance is claimed.

Scale cases exercise 10,000 repeated Carrier rows through the actual grouped-decision authority and 3,000 distinct Driver/Truck paths against 6,001 canonical entities, in addition to 5,000 selectable alternate identities and 120 paged groups. Structural DOM tests cover 360/768/1440 widths; real browser hit-testing and virtual-keyboard usability still require the matrix below.

Existing modified tests preserve their exact case counts:

| File under `src/tests/` | Before | After |
|---|---:|---:|
| importResolutionUiP7B2.test.tsx | 18 | 18 |
| rosterIntakeUiP7B1.test.tsx | 9 | 9 |
| rosterSmartImportCarrierLayerC2.test.ts | 21 | 21 |
| rosterSmartImportMaterialLayerC3.test.ts | 19 | 19 |
| rosterSmartImportJourneyNavigation.test.ts | 29 | 29 |
| rosterSmartImportPortalRenderQuality.test.tsx | 20 | 20 |
| unit3A1SmartImportSession.test.ts | 45 | 45 |

Remaining baseline-existing failing cases, exact selected-file inventory (not a claim that every historical test is a current runtime defect):

| File under `src/tests/` | Failing cases |
|---|---:|
| block102OperationalAccessSmartRoster.test.ts | 1 |
| importResolutionUiP7B2.test.tsx | 2 |
| liveProjectRosterSmartConvergence.test.ts | 2 |
| rosterSmartImportFinalReviewCommitC5.test.ts | 4 |
| rosterSmartImportJourneyNavigation.test.ts | 5 |
| rosterSmartImportLayeredWorkflowC1.test.ts | 1 |
| rosterSmartImportPortalRenderQuality.test.tsx | 6 |
| smartImportCanonicalCommitCutoverC2.test.ts | 2 |
| smartImportCommitIntegrityConvergence.test.ts | 1 |
| smartImportEntityReviewWorkspaceR2.test.ts | 1 |
| smartImportGlobalCanonicalSnapshotBoundary.test.ts | 8 |
| smartImportServerCanonicalCommitContractC1.test.ts | 28 |
| smartImportSourceMappingApprovalGateR1.test.ts | 1 |
| smartImportUnit5AStandaloneFleetBoundary.test.ts | 15 |
| unit3A1SmartImportSession.test.ts | 3 |
| canonicalCarrierEditAuthorityA2.test.ts | 26 |
| canonicalMaterialEditAuthorityB2.test.ts | 19 |
| projectCanonicalRefreshBarrierA11.test.ts | 1 |
| projectContextLifetime.test.tsx | 1 |
| projectSetupLayeredWorkflow.test.tsx | 1 |
| projectWorkspaceMutationInvalidationUnit5B.test.ts | 25 |
| projectWorkspaceProjectionAcknowledgementUnit5C.test.ts | 1 |
| reusableMaterialCreationB1.test.ts | 1 |
| setupClosureContinuity.test.tsx | 2 |
| setupWizardContinuity.test.tsx | 4 |
| smartTripImportOperationalConvergence.test.ts | 2 |
| translationByConstructionGuard.test.ts | 1 |
| tripIntakeConvergence.test.ts | 4 |
| unit3A2ProjectDataFreshness.test.ts | 3 |

The old source-layout/numeric-phase/legacy-commit assumptions and incomplete historical fixtures are not permission to restore superseded architecture. Two import-center wrong-Project locator-clear assertions remain baseline failures; no wrong-Project private data is rendered. Trips/import-center redesign and Workspace rejection-harness debt stay outside this Roster package. Any reproduced deployed normal Roster issue remains a blocker rather than being relabelled historical debt.

## Exact assurance scope

40 paths: 22 source/helper files plus three locale dictionaries, ten tests and five documentation files. No server implementation or Phase-8 persistence/execution authority file is modified. The Workspace orchestration implementation in the shared Wizard is unchanged.

### Production/helpers

- `src/components/import/CanonicalResolutionDecision.tsx`
- `src/components/import/ContextualCanonicalCreation.tsx`
- `src/components/import/ImportConfirmation.tsx`
- `src/components/import/ImportGroupPage.tsx`
- `src/components/import/ImportOverlay.tsx`
- `src/components/import/RosterCarrierResolutionLayer.tsx`
- `src/components/import/RosterDriverTruckResolutionLayer.tsx`
- `src/components/import/RosterMaterialResolutionLayer.tsx`
- `src/components/import/RosterSemanticReview.tsx`
- `src/components/masterData/CanonicalFleetIdentityEditor.tsx`
- `src/components/masterData/CarrierEditorModal.tsx`
- `src/components/masterData/MaterialEditorModal.tsx`
- `src/components/wizard/FleetSetupWorkspace.tsx`
- `src/components/wizard/ProjectSetupWizard.tsx`
- `src/i18n/importResolution.ts`
- `src/services/import/canonicalResolution.ts`
- `src/services/import/contextualCanonicalCreation.service.ts`
- `src/services/import/driverTruckImport.ts`
- `src/services/import/driverTruckPipeline.service.ts`
- `src/services/import/rosterCanonicalIntent.service.ts`
- `src/services/import/rosterInteractionAuthority.ts`
- `src/services/import/rosterSmartImportWorkflow.service.ts`

### Locales

- `src/locales/ar/index.ts`
- `src/locales/en/index.ts`
- `src/locales/ur/index.ts`

### Tests

- `src/tests/importResolutionUiP7B2.test.tsx`
- `src/tests/rosterIntakeUiP7B1.test.tsx`
- `src/tests/rosterSmartImportCarrierLayerC2.test.ts`
- `src/tests/rosterSmartImportJourneyNavigation.test.ts`
- `src/tests/rosterSmartImportMaterialLayerC3.test.ts`
- `src/tests/rosterSmartImportPortalRenderQuality.test.tsx`
- `src/tests/smartImportInteractionAssurance.test.ts`
- `src/tests/smartImportJourneyAssurance.test.tsx`
- `src/tests/smartImportOverlayAssurance.test.tsx`
- `src/tests/unit3A1SmartImportSession.test.ts`

### Documentation

- `docs/reconstruction/00_WORK_START_HERE.md`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/MASTER_PROJECT_HANDOFF.md`
- `docs/reconstruction/SMART_IMPORT_ASSURANCE_CONTRACT.md`

## Required deployed acceptance (no live action performed here)

| Viewport/direction | Required manual observation |
|---|---|
| Desktop Chromium, AR/EN | Fresh Q-PRJ-010 source → mapping → all four entity editors → pending failure/retry → review → execution/result; one top dialog receives pointer/keyboard; parent stays usable after close |
| Tablet landscape/portrait, AR/EN | Long names/IDs; nested scrolling, visible actions, no background scroll; popup close/focus return; paging/search reaches last group/identity |
| Mobile 360px and 390px, AR/EN | Small viewport and virtual keyboard; reachable header/footer/cancel; no offscreen dialog trap; RTL/LTR long labels and dropdown selection |
| All | Double-click, offline during create/checkpoint, successful mutation with lost response, readback failure, cancel while pending, project switch/logout, refresh/tab reopen/reattach, partial execution retry; no duplicate canonical entity or consequence and no stale child/session publication |

Owner review, publication and this deployed acceptance remain distinct gates. No PR or merge is created by this unit.
