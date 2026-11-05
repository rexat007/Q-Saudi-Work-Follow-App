## Q-PRJ-011 Terminal Smart Import Re-entry Defect — 2026-11-05

Owner live observation: Q-PRJ-011 resumed and completed the Smart Roster Import journey. After completion, ordinary navigation back into the ROSTER setup layer automatically opens the Smart Import recovery/overlay again.

This behavior is not accepted.

### Binding recovery rule

- Durable recovery is preserved for genuinely interrupted/resumable sessions and managed executions.
- A session/execution that is terminal under the canonical Import Session / execution contract must not be selected by automatic ROSTER-entry recovery.
- Terminal result/history may remain inspectable through an explicit history/result action; it must not hijack normal ROSTER navigation.
- Starting another import requires an explicit **new import** user action and a new canonical session/operation identity.
- The correction must not weaken P8 reviewed-intent authority, source fingerprint/version fencing, commit receipts, lost-response recovery or terminal audit evidence.

### Acceptance gate

Reproduce against current source, identify which list/resume selector admits the terminal Q-PRJ-011 session, correct the selector/presentation lifecycle, retain interrupted-session recovery, and live-retest: complete an import → leave ROSTER → return to ROSTER → no automatic overlay → explicitly start a new import → new session opens.

~~~text
Q_PRJ_011_TERMINAL_IMPORT_AUTO_RESTORE = LIVE_DEFECT
SMART_IMPORT_DURABLE_INTERRUPTED_RECOVERY = PRESERVE
TERMINAL_SESSION_AUTO_RESUME = FORBIDDEN
NEW_IMPORT = EXPLICIT_USER_ACTION_ONLY
FOUNDATION_ACCEPTANCE = BLOCKED
PHASE_10 = NOT_STARTED
~~~

# Live intake continuity, canonical bulk resolution and Material binding

Current state belongs only to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Historical implementation evidence baseline: `637b7d54429ac586e101689deae35e013a9eab77`, merged PR #86. This is a bounded correction of the existing operational Roster and account-availability journey, not another phase or a Workspace/Trips/Reports redesign.

## Smart Import Dark Contrast Family Audit & Closure — 2026-11-03

Baseline commit: `ba20e2b069d105eae46740932d257ef9d954c645`. Source integrity audited: 1,359 files exact match.

### Verified Surfaces and Remediations:
- `rosterRecoveryVisible` in `ProjectSetupWizard.tsx`: Remediated the unstyled recovery presentation (the live-proven defect surface). Restyled with explicit dark palette (`bg-stone-900/90`, `border-stone-800`), status indicator chips, completed/remaining consequence metric cards, scrollable consequence lists, and accessible focus-visible action buttons. Inline status messages, recovery alert retry buttons, and sheet sync controls styled.
- `CanonicalImportBoundary.tsx`: Styled loading indicator (`text-stone-400 font-mono`) and fatal error alert banner with high-contrast retry action.
- `CanonicalResolutionDecision.tsx`: Styled candidate select dropdown (`bg-stone-900 text-stone-200 border-stone-700`), search input, entity detail cards, and alert notifications.
- `ContextualCanonicalCreation.tsx`: Styled permission-denied banner (`bg-stone-900 border-amber-800/40 text-amber-400`), modal overlay, and action buttons.
- `GlobalRegistryEnrollment.tsx`: Styled global entity search input, lookup button, candidate chip, and enrollment action.
- `ImportConfirmation.tsx`: Styled modal confirmation dialog, backdrop overlay, cancel and confirmation actions.
- `ImportGroupPage.tsx`: Styled pagination navigation bar, previous/next controls, and page counter indicator.
- `RosterSemanticReview.tsx`: Styled definition lists, count metrics, identity items, relationship items, blocker alerts, displacement confirmation checkbox, and review actions.

Preserved:
- PR #89 contrast remediation in `ImportMaterialSelection.tsx` and `RosterBulkApproval.tsx` preserved without modification or regression.
- Zero business logic changes across all components.
- Zero alterations to durable session lifecycle or canonical pipeline mechanics.
- Expanded regression coverage in `src/tests/smartImportSharedContrast.test.tsx` (20/20 PASS).

## Current live evidence and bounded remediation — 2026-11-03

Starting verified merged main: `0f1c6b841da168dc4464c17cbd9f5096fef5e32d`. PR #88 = MERGED / SOURCE_VERIFIED, merge SHA `0f1c6b841da168dc4464c17cbd9f5096fef5e32d`. Workspace quiescence = SOURCE_REMEDIATED / VERIFIED_LOCALLY / LIVE_RETEST_REQUIRED. Its earlier local-commit-only boundary describes historical execution, not current publication. [Quiescence source model and remaining live test](WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md).

Owner-reported live evidence after quota recovery:

```text
PR87_PROFILE_UNAVAILABLE_BEHAVIOR = LIVE_PASS
ACCOUNT_PROFILE_READ = PASS
PROFILE_UNAVAILABLE_RECOVERY = PASS
FALSE_NO_PROFILE = NOT_OBSERVED
DURABLE_IMPORT_SESSION_RECOVERY = LIVE_PASS
SAME_SESSION_RESTORED = LIVE_PASS
SAME_SAVED_STAGE_RESTORED = LIVE_PASS
RESUME_STAGE_RECONCILIATION_DEFECT = LIVE_OBSERVED / SOURCE_CONFIRMED
SMART_IMPORT_CONTRAST_DEFECT = LIVE_PROVEN / SOURCE_CONFIRMED
FINAL_REVIEW_LIVE_ACCEPTANCE = NOT_COMPLETE
WORKSPACE_QUIESCENCE_LIVE_RETEST = STILL_REQUIRED
PHASE_10 = NOT_STARTED
```

These are owner observations, not independent live execution in this unit. The old failing session was subsequently cancelled and is unavailable; no exact originating blocker is asserted. Current source remediates both defect families; local verification remains separate from owner live acceptance. This new unit authorizes one local commit only, no push/PR/merge.

### Source findings and effective resume stage

Initial restore and `retryRosterCheckpoint` previously revalidated against a fresh canonical context, then independently applied `facts.durableStage` / `saved.rosterStage`. Final Review revalidation could produce blockers while leaving the user at the obsolete Driver/Truck stage. `intentIssueKey` also mapped several distinct families to one generic message. This confirms the source contradiction; Material is not assumed to have been the sole old live blocker.

`reconcileRosterResumeStage` consumes the fresh revalidated batch, the existing shared canonical Carrier gate, existing `materialRowsReady`, existing group status and canonical intent blockers. Workflow indices are reused to prevent automatic advancement. Carrier prerequisites take precedence, then Material, then Driver/Truck or the responsible blocker family (including cross-row Material conflict). A valid saved stage stays valid; a terminal/execution-managed journey stays with its existing P8 authority. This is presentation routing, not another eligibility/identity rule engine. The Carrier expression was extracted unchanged and reused by its existing layer.

Reconciliation is applied at initial restore, checkpoint/reconnect restore and fresh blocked Final Review entry. It performs no checkpoint or canonical command. Same session/source fingerprint/source revision/mapping revision/operation/batch remain; valid choices, explicit Material provenance, contextual receipts and bulk progress are preserved. The durable saved stage may remain later until an explicit correction uses the existing invalidateReview checkpoint. No silent Material inference, source rewrite, new session, identity, membership, affiliation, assignment or allocation is introduced. Warnings and displacement still require their existing approvals; a blocker cannot enter Final Review merely because routing leaves the current stage unchanged.

Presentation distinguishes UNRESOLVED_MATERIAL, MEMBERSHIP_MISSING, MEMBERSHIP_STATE_CONFLICT, AFFILIATION_CONFLICT, RELATIONSHIP_CONTEXT_UNAVAILABLE, CANONICAL_INTEGRITY_ERROR and CROSS_ROW_* through existing AR/EN/UR keys and existing row numbers. PREPARED_ENTITY_CONFLICT retains its specific message. Unknown errors keep a bounded fallback, never raw provider details. If a missing entity is not present in a fresh server projection, it cannot be falsely diagnosed as a proven missing membership; the existing canonical-integrity/lookup path remains authoritative.

### Shared contrast impact and verification boundary

Repository-wide production callers: `ImportMaterialSelection` once in the Wizard Material stage; `RosterBulkApproval` three times, in Carrier, Material and Driver/Truck stages. No stage-specific CSS patch is added. Shared dark surfaces use stone-950/900 with explicit stone-300/100/white text, amber primary Material action, emerald primary bulk approval, stone secondary/disabled states, amber loading status and rose errors. Inputs/selects/options, placeholder color, hover and focus-visible rings are explicit. Width/wrapping/min-width rules are direction-neutral; no left/right override or new theme is introduced. Native disabled controls, labelled inputs/selects, semantic buttons and status/alert roles remain. Single-Material suggestion still needs explicit confirmation; business callbacks keep their existing admission/identity behavior.

Controlled React tests verify Arabic/English/Urdu text/key resolution, RTL/LTR container inheritance, 360/768/1440 layout-class contracts, programmatic control focus, pending/disabled/error readability classes and callback single admission. They do not measure real viewport layout, Tab navigation or deployed pixel contrast; owner browser acceptance remains required. No screenshot/pixel baseline or new browser tooling/dependency is introduced.

### Local verification — resume and contrast unit

- New focused test files: `rosterResumeStageReconciliation.test.ts` 25/25; `smartImportSharedContrast.test.tsx` 12/12. Existing actual `smartImportJourneyAssurance.test.tsx` grows 13→17 with four real Wizard cases. Existing shared callback suite `bulkMaterialReviewUi.test.tsx` stays 5/5. Focused total **59/59 PASS**; 41 added cases overall.
- One retained historical-session case now asserts automatic Material-stage reconciliation rather than requiring the user to manually navigate there. Same session, explicit confirmation and completion assertions remain; no test is removed/skipped or replaced with a trivial check. No historical failing assertion is edited away.
- Independent clean merged-baseline archive: **708/724 PASS**, 27 files. Final affected selection: **749/765 PASS**, 29 files. Broad commands **EXIT 1 / NOT PASS**. Exact failing case set is unchanged: **NEW_FAILURES=0, REMOVED_TESTS=0, SKIPPED_TESTS=0**. The existing Wizard file has 13 retained cases, one presentation expectation converged and four additional cases.
- Actual Wizard tests cover read-only initial restore with identical store/session/source/mapping, valid Final Review progression, fresh Material drift at Final Review entry, checkpoint/reconnect reconciliation, no automatic canonical mutations, and preserved warning-confirmation/checkpoint gates. Pure cases cover Carrier precedence, Material drift, missing/inactive membership, Driver/Truck affiliation, prepared/cross-row/context/integrity families, valid earlier-stage preservation, terminal P8 isolation and specific AR/EN/UR key resolution.
- Required historical resume/navigation/post-resolution/interaction/persistence/Material/Driver-Truck/cutover suites are included, plus bulk reuse, profile continuity, i18n foundation/runtime/guard, workflow C1 and P8-B1/B2/B3/B4. All four P8 suites remain **41/41, 50/50, 30/30, 14/14 PASS**. Workspace engine/worker/hooks/outbox code and the Workspace panel key are unchanged; its expensive matrix is not rerun for this unit.
- Build **PASS**. Lint **EXIT 2 / NOT PASS**. Exact diagnostic multiset **440→440**, added 0/removed 0 by file/code/message ignoring shifted lines; no changed-file additions. Diff check **PASS**. No locale definitions or vocabulary changed; existing translations are reused.
- Deployed visual/keyboard/viewport verification, Final Review live completion and Workspace live quiescence remain **NOT_COMPLETE / LIVE_RETEST_REQUIRED**. Controlled DOM/fake persistence evidence is not live Firebase/Google or browser-pixel acceptance.

Independently reproduced baseline failures, retained unchanged:

- `liveProjectRosterSmartConvergence.test.ts` — Live Project Roster Smart Convergence & Final Atomic Integrity Closeout (Beta 2) 10. blocking row increments errorRows
- `liveProjectRosterSmartConvergence.test.ts` — Live Project Roster Smart Convergence & Final Atomic Integrity Closeout (Beta 2) 12. batch WARNING status computed correctly
- `rosterSmartImportFinalReviewCommitC5.test.ts` — C5 — Smart Import Final Review & Commit Result Layer Contract Suite 38. Commit performs fresh second revalidation preflight
- `rosterSmartImportFinalReviewCommitC5.test.ts` — C5 — Smart Import Final Review & Commit Result Layer Contract Suite 61. Reset clears smartImportCommitResult
- `rosterSmartImportFinalReviewCommitC5.test.ts` — C5 — Smart Import Final Review & Commit Result Layer Contract Suite 62. Reset returns to SOURCE_DISCOVERY stage
- `rosterSmartImportFinalReviewCommitC5.test.ts` — C5 — Smart Import Final Review & Commit Result Layer Contract Suite 67. handleSmartImportCommit blocks repeat commit only on full success; partial failure remains retryable
- `rosterSmartImportJourneyNavigation.test.ts` — C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite 15. Reset clears import batch and session data completely
- `rosterSmartImportJourneyNavigation.test.ts` — C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite 16. Zero Carrier groups cannot enter Material layer
- `rosterSmartImportJourneyNavigation.test.ts` — C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite 18. Zero Material groups block progression to Driver/Truck
- `rosterSmartImportJourneyNavigation.test.ts` — C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite 20. Zero Driver/Truck groups block progression to Final Review
- `rosterSmartImportJourneyNavigation.test.ts` — C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite 23-24. C5 Orchestration derives review groups via RosterBatchReviewService in wizard
- `rosterSmartImportJourneyNavigation.test.ts` — C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite 37-41. Selecting new file clears prior session state completely before start
- `rosterSmartImportLayeredWorkflowC1.test.ts` — FOUNDATION C1 — LAYERED SMART IMPORT WORKFLOW FOUNDATION 5. from MAPPING_APPROVAL: only CARRIER_RESOLUTION becomes next active stage after pipeline execution
- `smartImportCanonicalCommitCutoverC2.test.ts` — SMART IMPORT C2 — Committer Server Cutover Test Suite (55 Contracts) 2–6. importedTripClientService source uses Firebase auth, getIdToken, Authorization Bearer, and endpoint
- `smartImportCanonicalCommitCutoverC2.test.ts` — SMART IMPORT C2 — Committer Server Cutover Test Suite (55 Contracts) 52. C1 server contract remains unchanged
- `translationByConstructionGuard.test.ts` — Batch-2 translation-by-construction TBC-B4: the eleven approved import anchors consume canonical translations

Exact source scope:

```text
src/components/import/ImportMaterialSelection.tsx
src/components/import/RosterBulkApproval.tsx
src/components/import/RosterCarrierResolutionLayer.tsx
src/components/import/RosterSemanticReview.tsx
src/components/wizard/ProjectSetupWizard.tsx
src/services/import/rosterBatchReview.service.ts
src/services/import/rosterResumeJourney.ts
```

Exact test scope:

```text
src/tests/rosterResumeStageReconciliation.test.ts
src/tests/smartImportSharedContrast.test.tsx
src/tests/smartImportJourneyAssurance.test.tsx
```

Six current documentation files are reconciled: this contract, `00_WORK_START_HERE.md`, `02_PHASE_LEDGER.md`, `05_DECISION_AND_DEBT_LOG.md`, `MASTER_PROJECT_HANDOFF.md`, and only a merge-state clarification in `WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md`. No historical snapshot/handoff rewrite, production/server persistence change, API/schema change, new dependency/config/workflow/rule or generated artifact is included. One local commit only; no push/PR/merge.

### Remaining owner live checks

1. Reopen a saved Driver/Truck session whose current Material prerequisite is missing/ineligible: the effective stage must be Material immediately, with no contradictory all-resolved Driver/Truck view. Confirm the same session/source/mapping and retained valid decisions; explicitly select/enroll/confirm through canonical authority, then continue.
2. Repeat with missing/inactive membership, invalid affiliation and Carrier drift; show the earliest responsible stage and specific bounded message/row numbers. Unknown or omitted canonical identity must fail closed, not infer membership or silently prepare a duplicate. A fully valid saved session must retain its stage and successfully reach Final Review through the normal checkpoint/approval gate.
3. In a new and resumed session inspect Material selection and shared bulk review in Carrier/Material/Driver-Truck: readable without text selection, AR/EN/UR, RTL/LTR, desktop/tablet/mobile, actual Tab/focus-visible, disabled/loading/success/error and wrapping behavior. Do not use local DOM class tests as live visual acceptance.
4. Confirm no duplicate canonical identity/membership/affiliation/assignment/allocation during restore/reconnect, and retain the separate PR #88 five-minute idle/activity/remount/resume quiescence retest. Final Review live acceptance and the wider intake matrix below remain incomplete.

## Current product rules

```text
GLOBAL_IDENTITY_REUSE = REQUIRED
PROJECT_DUPLICATE_GLOBAL_ENTITY = FORBIDDEN
BULK_CANONICAL_DISCOVERY = REQUIRED_FOR_ROSTER_SCALE
MATERIAL_ABSENT_FROM_SOURCE = EXPLICIT_PROJECT_MATERIAL_SELECTION_REQUIRED
NO_WEIGHBRIDGE_MATERIAL = STILL_REQUIRED
PROFILE_UNAVAILABLE != NO_PROFILE
TRANSIENT_AUTH_FAILURE = RECONNECT/RESUME, NOT ACCOUNT_REREGISTRATION
```

The owner explicitly supersedes the old Material-optional operational Roster behavior. Mapping a Material column is still optional; resolving an operational Material identity is required. Historical participation-only inputs and pre-correction snapshots do not override this rule.

## Identity availability and continuity

The old controller cleared the profile for both transport failure and confirmed document absence. App then interpreted either as NO_PROFILE. The current controller publishes UNAUTHENTICATED, LOADING, AVAILABLE, ABSENT_CONFIRMED and UNAVAILABLE_TRANSIENT. PENDING_APPROVAL/REJECTED/SUSPENDED remain authoritative account statuses, not network states. Initial lookup uses `getDocFromServer`; watch snapshots with `fromCache` or pending local writes cannot confirm presence/absence or restore mutation authority. Only a successful authoritative missing-document result permits the account-request experience.

Same-account refresh/outage retains profile presentation and the mounted operational shell. The token and local mutation authority are withdrawn while verification is loading/unavailable. The existing overlay manager adds an AUTHORITY level above the Roster/editor/confirmation stack; parent pointer/keyboard ownership is blocked without replacing the mounted journey. Current-user Workspace sync is paused, not redesigned. Canonical setup/import/Carrier/Material mutation transports recheck authority immediately before sending; existing server current-principal, Project and lifecycle authorization remain mandatory and unchanged.

Different accounts, explicit logout and invalid/revoked authentication retire the prior identity. A successful suspended/rejected/pending profile replaces cached ACTIVE status. Retained presentation never authorizes new privilege. No profile is persisted in a new client cache and no stale token supplies a role grant.

Connectivity return triggers profile refresh. Roster authority retirement invalidates local command generations, retires nested editors and busy ownership, but does not reset session/batch/source identity or committed Master Data. After verification returns, the same session is re-read, canonical context refreshed and the current durable stage restored; an execution-managed session uses existing journal status. A late pre-interruption response cannot publish into the new UI generation. If a successful checkpoint reply was lost, a newer authoritative version retires the obsolete pending command; no success is inferred from the transport error. If the server version did not advance, the exact pending write remains explicitly retryable. Failed reconnect reads show a retry action rather than an inert screen. A legacy session already at Driver/Truck or final review without Material exposes an explicit return-to-Material action using the same durable session and preserved completed decisions; its checkpoint must ACK before navigation. Sealed execution journals are not rewritten to invent new historical allocations. HTTP imports/context/setup have a bounded 30-second request timeout; no infinite polling/auto-mutation retry is introduced.

## Bounded canonical discovery and safe approval

A Project-scoped administrator POST accepts at most 100 natural-key queries. The server re-reads current principal/Project capability and reads only requested memberships, affiliations and validated temporal pointers/history plus unique Carrier proofs in the bounded transaction. It never scans the complete Project registry per chunk. It invokes the existing `resolveGlobalNaturalIdentity` authority, and runs at most four lookups concurrently. It does not enumerate a Global catalog or create identities. Driver residency/national ID, normalized Truck plate, Carrier registration and Material code retain existing normalizers. Name-only input is not proof of absence and cannot bulk prepare a new identity. Exact unique natural identity outranks spelling variations for existing reuse; incoherent name/phone/capacity evidence prevents new preparation without rewriting the existing Global profile.

The ten dispositions are project-ready; membership missing/inactive; affiliation missing/inactive; wrong Carrier; globally ineligible; globally ambiguous; NOT_FOUND; SOURCE_CONFLICT. Driver/Truck results require current eligible Project Carrier proof. Duplicate/broken natural-key lookup is ambiguous, never a clean new identity. Existing same-global-ID participation and current temporal projection are returned without invented membership/assignment/allocation facts.

The UI discovers once for the current stage/batch, displays ready/enrollment/affiliation/preparation/manual counts and offers one explicit **Approve safe cases** action. A local batch change invalidates the reviewed summary. Ambiguous natural identity, contradictory source Carrier/fields, wrong Carrier, ineligible Global status and incomplete identity remain individually reviewable. Canonical Driver/Truck results are applied using server read-back proof, never a synthetic active Carrier or membership.

Execution is chunked into 50 groups, with at most four canonical actions in flight. Membership/reactivation precedes affiliation; existing canonical command/lifecycle fences are reused. Each chunk starts with fresh discovery, awaits all admitted actions (including failures), re-reads committed truth and checkpoints grouped choices. The browser never opens an unbounded Firestore transaction. After completion, one final coherent canonical refresh and whole-Roster revalidation occur. An interrupted chunk is rediscovered before retry: completed membership/affiliation is skipped based on canonical truth, not merely the progress marker. Progress keys bind to the batch operation and natural/group identity. The durable checkpoint retains choices/plans and progress; source parsing is not repeated per group.

Clean NOT_FOUND Driver/Truck groups with coherent source identity/name/Carrier become PREPARED_NEW only. They are not immediately created. P8 commit materializes them under existing natural uniqueness, reviewed meaning, journal receipts and execution fencing. Bulk approval never executes temporal displacement or substitutes for final human-reviewed intent. Reassignment/reallocation approval remains separate.

Carrier/Material setup and Material Review provide explicit natural-key lookup and enrollment/reactivation of an existing Global identity. Genuine absence permits the existing canonical creation editor; similar display names cannot silently create duplicates. Existing identity in Project A is enrolled into Project B using the same Global ID, never copied into a Project-owned identity registry.

## Explicit Material binding and provenance

When source rows lack Material, Material Review offers active enrolled Project Materials, exact Global Material lookup/enrollment and the existing canonical creation path after absence proof. A single active Project Material is a suggestion only; confirmation is required. Multiple Materials require selection. Empty/inactive/ineligible identity never enables progression.

`batch.metadata.batchMaterialBinding` stores `{materialId, provenance:'PROJECT_IMPORT_SELECTION', confirmed:true}` in the existing durable batch/artifact. The original source/mapped/canonical fields are not rewritten to pretend the choice came from the file. Revalidation uses the default only for missing Material evidence and preserves valid source-specific Materials. The intent includes this binding and signs the provenance. Recovery provenance hashing includes it as well. Malformed/spoofed binding cannot become acceptable intent.

Every contributing operational row must resolve Material before finalization. NO_WEIGHBRIDGE (`loadingMeasurement=NONE`, `unloadingMeasurement=NONE`) does not waive Material. Current Truck allocation yields ALLOCATE, NO_CHANGE or REALLOCATE; different allocation requires the existing explicit displacement approval. No weight/tonnage is invented and capacity estimation semantics are untouched.

## Verification and historical contract convergence

Verification results below are dated observations, not permanent cardinality contracts. Existing test cases are retained; none are deleted or skipped. Two auth-session assertions now distinguish retained identity presentation from withdrawn mutation authority. P7 partial-row cases keep their relationship-safety assertions and adopt the required Material contract. The PR #86 large-fixture test now includes explicit Material/allocation; the real Wizard journey confirms a suggested Material before progression and verifies canonical allocation. Additional behavioral cases prove actual Provider continuity, mounted ownership, same durable session, lost checkpoint response, two-Project global reuse and bounded bulk recovery.

Local controlled React/transaction/transport tests are not real Firebase/Google/deployed browser acceptance. Historical failures remain separately reported rather than being rewritten to PASS. Exact final observations and scope are recorded below.


## Historical PR #87 local verification — 2026-11-03

- Baseline: 30 files, 852/855 PASS. Final consolidated latest result per file: 36 files, **902/905 PASS**. Broad selection is **NOT all green**.
- Focused final selection (latest per file): **299/299 PASS**, 15 files. Auth/profile/controller/actual Provider/continuity UI, safe bulk/Material UI, real two-Project reuse, scale/chunk interruption and preserved PR #86 behavior are included.
- New files: auth availability 12; actual Provider 1; mounted continuity 1; bulk/Material UI 5; bulk/global reuse 17; Material/provenance/allocation 10. The existing real Wizard journey grows 9→13, adding reconnect, stale pending response, lost successful checkpoint reply and legacy missing-Material resume coverage. Total added cases: **50**.
- Phase-8 B1/B2/B3/B4: **41/41, 50/50, 30/30, 14/14 PASS**. PR #86 overlay **26/26**, interaction **30/30**, journey **13/13 PASS**. Server trust boundary **23/23**, runtime-key audit **16/16 PASS**.
- NEW_FAILURES=0; REMOVED_TESTS=0; SKIPPED_TESTS=0. Existing auth-session test count 12, canonical-intent count 37 and interaction count 30 stay unchanged; the documented owner-authorized policy assertions are converged rather than weakened.
- Remaining independently reproduced baseline cases: `authSessionRefreshBlock93.test.ts` historical 1128 dictionary-count expectation; `projectActivationReadiness.test.ts` Scenario M direct-lifecycle mutation expectation against an API-backed service; `translationByConstructionGuard.test.ts` TBC-B4 checkpoint source anchor. They remain visible as failures; no entire broad command is called PASS.
- Final build PASS. Exact clean archive initially rejected building without Git metadata (`APP_BUILD_ID_REQUIRED`); rerunning with the existing supported `APP_BUILD_ID=637b7d54429ac586e101689deae35e013a9eab77` succeeded. No config/source workaround was made.
- Lint EXIT 2 / NOT PASS. Diagnostics **440→440**, exact file/code/message multiset added 0, removed 0 (line-number shifts ignored).
- AR=EN=UR=**4698**. Exactly ten append-only keys; duplicate definitions 0, parity gaps 0, empty values 0, unrelated existing-value edits 0.
- Scale: **500 Trucks + 500 Drivers**, multiple Carriers, explicit batch Material, 900 safe groups / 100 manual exceptions, at most four actions in flight, 18 chunk checkpoints. Repeat has no repeated canonical mutation. An interrupted 60-group case retains its first durable 50 and skips already completed canonical work on retry. These controlled timings/counts are not production SLOs.
- Temporal displacement stays manual in bulk review, with expected peer/Material criteria rechecked by fresh server discovery. Final reviewed intent remains separately approved.
- `git diff --check`: PASS. Live acceptance at that historical implementation checkpoint: **NOT_PERFORMED**.

## Historical PR #87 exact scope

48 files: 31 source/type/locale/API files, ten tests and seven documentation files. No package, lockfile, config, workflow, Firestore rules, provider scope, blueprint, Apps Script or generated artifact change. Workspace orchestration and Trips/Reports implementation are unchanged.

### Production / types / locales / API

- `server/app.ts`
- `src/App.tsx`
- `src/components/auth/ProfileContinuity.tsx`
- `src/components/import/GlobalRegistryEnrollment.tsx`
- `src/components/import/ImportMaterialSelection.tsx`
- `src/components/import/ImportOverlay.tsx`
- `src/components/import/RosterBulkApproval.tsx`
- `src/components/import/RosterMaterialResolutionLayer.tsx`
- `src/components/wizard/ProjectSetupWizard.tsx`
- `src/firebase/authContext.tsx`
- `src/firebase/authSession.ts`
- `src/locales/ar/index.ts`
- `src/locales/en/index.ts`
- `src/locales/ur/index.ts`
- `src/services/carrierManagementClient.service.ts`
- `src/services/import/canonicalResolution.ts`
- `src/services/import/driverTruckPipeline.service.ts`
- `src/services/import/entityResolutionCommand.service.ts`
- `src/services/import/rosterBulkClient.ts`
- `src/services/import/rosterBulkDiscovery.server.ts`
- `src/services/import/rosterBulkResolution.ts`
- `src/services/import/rosterCanonicalIntent.service.ts`
- `src/services/import/rosterExecutionPlan.server.ts`
- `src/services/import/rosterMaterialBinding.ts`
- `src/services/importRequest.ts`
- `src/services/importSessionClient.service.ts`
- `src/services/materialManagementClient.service.ts`
- `src/services/projectReadTransport.ts`
- `src/services/setupOrchestration.service.ts`
- `src/types/importResolution.ts`
- `src/types/rosterCanonicalIntent.ts`

### Tests

- `src/tests/authProfileContinuity.test.ts`
- `src/tests/authProviderContinuity.test.tsx`
- `src/tests/authSessionPrincipalRefresh.test.ts`
- `src/tests/bulkMaterialReviewUi.test.tsx`
- `src/tests/profileContinuityUi.test.tsx`
- `src/tests/rosterBulkGlobalReuse.test.ts`
- `src/tests/rosterCanonicalIntentP7B3.test.ts`
- `src/tests/rosterMaterialBindingContinuity.test.ts`
- `src/tests/smartImportInteractionAssurance.test.ts`
- `src/tests/smartImportJourneyAssurance.test.tsx`

### Documentation

- `docs/API_CONTRACT.md`
- `docs/reconstruction/00_WORK_START_HERE.md`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/LIVE_INTAKE_CONTINUITY_CONTRACT.md`
- `docs/reconstruction/MASTER_PROJECT_HANDOFF.md`
- `docs/reconstruction/SMART_IMPORT_ASSURANCE_CONTRACT.md`


## Remaining required live matrix — acceptance paused

| Area | Cases | Required observation |
|---|---|---|
| Connectivity | Online; offline during Driver/Truck action; reconnect; reload offline then reconnect | No account-request form on transport failure; same account/session/stage; completed decisions survive; unfinished work actionable |
| Identity scale | Existing Global; existing Global/new Project; clean new; ambiguity; wrong Carrier; safe bulk action | Same four Global IDs across Projects; only membership/affiliation changes; PREPARED_NEW stays deferred; true exceptions remain manual |
| Material | Source present; source absent/one Project Material; source absent/multiple Materials; Global not enrolled; genuine new Material; mixed explicit/default | No silent selection; explicit durable provenance; source-specific identities preserved; correct canonical allocation/displacement review |
| NO_WEIGHBRIDGE | Loading NONE/unloading NONE; explicit Material; capacity estimates | Material still required; no fabricated weight or measured tonnage |
| Interruption/recovery | Lost mutation reply; failed checkpoint/read-back; partial chunk; refresh/reopen; project/account switch | Read canonical truth before retry; no duplicate identity/membership/affiliation/assignment/allocation; no stale child/busy owner |
| Browser ownership | Desktop/tablet/mobile, AR/EN/UR, nested editor plus authority interruption | Highest dialog owns focus/pointer; no offscreen actions or preserved stale editor; shell remains usable after confirmed reconnect |

No live Project data, Google configuration, provider scopes, blueprint or Apps Script is changed by this package. Branch publication, owner review/merge and deployed acceptance remain distinct gates.
