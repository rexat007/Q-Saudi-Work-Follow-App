# Live intake continuity, canonical bulk resolution and Material binding

Current state belongs only to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Evidence baseline: `637b7d54429ac586e101689deae35e013a9eab77`, merged PR #86. This is a bounded correction of the existing operational Roster and account-availability journey, not another phase or a Workspace/Trips/Reports redesign.

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


## Final verification — 2026-11-03

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
- `git diff --check`: PASS. Live acceptance: **NOT_PERFORMED**.

## Exact scope

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


## Required live matrix — NOT_PERFORMED

| Area | Cases | Required observation |
|---|---|---|
| Connectivity | Online; offline during Driver/Truck action; reconnect; reload offline then reconnect | No account-request form on transport failure; same account/session/stage; completed decisions survive; unfinished work actionable |
| Identity scale | Existing Global; existing Global/new Project; clean new; ambiguity; wrong Carrier; safe bulk action | Same four Global IDs across Projects; only membership/affiliation changes; PREPARED_NEW stays deferred; true exceptions remain manual |
| Material | Source present; source absent/one Project Material; source absent/multiple Materials; Global not enrolled; genuine new Material; mixed explicit/default | No silent selection; explicit durable provenance; source-specific identities preserved; correct canonical allocation/displacement review |
| NO_WEIGHBRIDGE | Loading NONE/unloading NONE; explicit Material; capacity estimates | Material still required; no fabricated weight or measured tonnage |
| Interruption/recovery | Lost mutation reply; failed checkpoint/read-back; partial chunk; refresh/reopen; project/account switch | Read canonical truth before retry; no duplicate identity/membership/affiliation/assignment/allocation; no stale child/busy owner |
| Browser ownership | Desktop/tablet/mobile, AR/EN/UR, nested editor plus authority interruption | Highest dialog owns focus/pointer; no offscreen actions or preserved stale editor; shell remains usable after confirmed reconnect |

No live Project data, Google configuration, provider scopes, blueprint or Apps Script is changed by this package. Branch publication, owner review/merge and deployed acceptance remain distinct gates.
