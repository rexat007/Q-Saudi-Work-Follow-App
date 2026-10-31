## GWS1B-LOCAL-01 / GWS1B-TRIGGER-01 — current source release decisions

Exact acceptance/publication state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

- RESOLVED: GWS1B-CAPTURE. Owner-approved local Projects_Tamplate.xlsx + nine Script files replace Google capture as the source gate; Google ADC/tokens are not required for local release. Real Google runtime acceptance remains OPEN.
- SUPERSEDED: four installable handlers/timer dependencies. Only onOpen/onEdit are automatic; no active trigger-management calls, ScriptApp scope, Execution API or user-run setup requirement. Blueprint embeds clean initialized structures. Existing installer helpers are noninteractive/non-triggered compatibility actions, not provisioning authority.
- RESOLVED_LOCALLY: GWS1B-CAPACITY. Both inputs start with 297 prepared rows, based on Loading grid through row 298. Offload's trailing style-only grid is normalized; lookups/aggregates follow open ranges. Under the existing per-Project sync fence, a full generated sheet expands by 200 rows inside its last prepared row, copying only formula columns/style/validation, then retries the same RAW inputs. Uncertain expansion replies reconcile existing capacity before another insertion. No silent overflow.
- TEST_HARNESS_COMPATIBILITY: prior capture-required default assertion now checks the approved real-local asset. No test removal/skip or count reduction.
- PRESENTATION_COMPATIBILITY: Excel XLOOKUP namespaces removed, CELL("format") date validation translated to Google-compatible numeric/date-text validation; source-only empty guards exclude calculated T/H so empty rows do not show invented data errors. Net-weight/review/correlation semantics remain unchanged. These bounded conversions are explicit, not silently identical byte formulas.
- GWS_REVIEWER_CONFIGURATION_01 — STILL_OPEN: supplied reviewer names retained in validation and handler, classified PROJECT_CONFIGURATION_CANDIDATE. They do not define application RBAC/permissions. No new reviewer configuration surface in this unit.
- GWS-SIMPLE-TRIGGER-RUNTIME-01 — STILL_OPEN: local routing and work caps are verified, not Google 30-second runtime certification. Concurrent lock/budget/source/output limits defer expensive reports with visible console evidence; manual report menus remain. Google trigger queue/delivery limits are not an exactly-once guarantee.
- GWS-SYNC-AUTONOMY-01 / GWS-SYNC-RECOVERY-01 — STILL_OPEN. Programmatic API/Script writes do not fire simple onEdit. APP projection can leave Script-only derived reports awaiting a manual source edit/report refresh; no autonomous refresh or remote execution claim. Existing hard-crash sync owner and ambiguous Script creation recovery require operator proof, never blind resource recreation.
- GWS-OAUTH-PROD-01 / GWS-LIVE-01 — STILL_OPEN; scope/consent, human file ownership, bound Script execution and controlled live-row acceptance are not proved locally. PFAG-OPS-01 remains OPEN, Phase 10 NOT_STARTED.

## Historical GWS1B core checkpoint — capture gates superseded by current entry above

Status authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

- SUPERSEDED: runtime hidden-template configuration/copy and template Picker. Previous GWS1 records below are historical for that strategy; input/formula allowlists and durable delivery decisions remain current.
- IMPLEMENTED_LOCALLY: destination-only selection, human-token native creation, versioned blueprint generator, bound Script installation, validation, immutable binding and stage recovery. Missing approved production asset fails closed before creation.
- STILL_OPEN — GWS1B-CAPTURE: obtain real Sheets includeGridData and bound Script getContent with operator access; sanitize and explicitly classify labels, functions, triggers, reports and external dependencies. No invented manifest/source; reserved SABIL-HAIL-V1 is not approved.
- STILL_OPEN — GWS1B-CAPACITY: review actual finite formula capacity, safe expansion and script-driven report refresh. Helper tests are not a deployed expansion guarantee.
- STILL_OPEN — GWS1B-SCRIPT-RECOVERY: ambiguous projects.create response cannot be discovered safely through a supported parent search here; block and require operator proof/reconciliation, never issue a second project blindly.
- STILL_OPEN: production scope/consent review including script.projects and actual Google ownership/formula/report/script acceptance. Installable trigger models are explicitly unsupported and blocked until separately reviewed.
- PRESERVED: sync autonomy/hard-crash sync recovery debt, PFAG-OPS-01, historical test debt and lint NOT PASS. No refresh worker, readiness, dynamic Truck/Driver intake, GWS2 or Phase 10 work.

## Historical and retained earlier decisions

## GWS-LIVE-01A — bounded OAuth-return defect remediation

Current supporting decision; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns status.

- OWNER_OBSERVED: Google consent succeeds for Q-PRJ-007, then Project Workspace selection/layer is lost and provisioning remains absent.
- ROOT_CAUSE_SOURCE: Firebase reauthentication triggers the existing fail-closed token/profile refresh, clearing App Project scope/selection and unmounting the Wizard. Guarded notices from the old component can no longer display failures. The missing Picker has no independent deployed HTTP trace here.
- DECISION: use an isolated Google permission grant, with Firebase UID/provider-subject equality checks. Do not weaken auth-session clearing, RBAC, server authorization or ProjectContextLifetime. Preload the Google library and keep popup grant tied to the button gesture.
- DECISION: keep a token-free, expiring Project/Workspace intent; fence every asynchronous boundary. Canonical Workspace status overrides stale Project IDs and is re-read after success/reopen. No receipt reset or replacement workbook fallback.
- CONFIGURATION_OBSERVATION: the local legacy OAuth client hint uses project-number prefix 98229909734 while the owner expects App ID 1009549718216. Deployment remains unverified. Explicit matching public OAuth client configuration is required; no Console changes or secrets are committed.
- GWS-LIVE-01 — STILL_OPEN / RESUME_LIVE_ACCEPTANCE after remediation review/deployment; no template/formula/Apps Script/live-row acceptance is claimed.
- GWS-OAUTH-PROD-01, GWS-SYNC-AUTONOMY-01, GWS-SYNC-RECOVERY-01 and PFAG-OPS-01 — STILL_OPEN. No GWS2, refresh worker, dynamic intake, readiness, migration or Trip FSM work.

## PFAG-GWS1 — template continuity decisions and explicit limits

Current supporting debt record; exact active status remains in [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

- DECISION: Project canonical data remains in the app/Firestore. A single versioned native Google template copy is permanent operational continuity, not another master authority.
- DECISION: server receipts and deterministic external tags fence provisioning; an unknown external result is reconciled, never blindly copied again. Template changes never migrate existing bindings implicitly.
- DECISION: exact XLSX input/formula ownership outranks suggestive header names. Loading T and Offload H remain formula-owned. New-copy fixture-input clearing never edits the original owner file or report ranges.
- DECISION: existing canonical Trip transaction stages a coalesced durable event. Authenticated retry is explicit; transient Google authorization does not imply an unattended refresh-token worker. Missing source metadata remains pending, not invented.
- GWS-OAUTH-PROD-01 — OPEN: actual production consent/audience/verification, origins/redirects and final scopes must be inspected by the operator. No console access was available here.
- GWS-LIVE-01 — OPEN: real Google OAuth + Picker access, actual copy and bound scripts/formulas, controlled row, copied-fixture cleanup and derived-output refresh, reopen/retry acceptance. Controlled fixtures do not close this gate.
- GWS-SYNC-RECOVERY-01 — OPEN: a process death with a retained sync owner requires operator proof that the old writer is stopped before fence release. No automatic lease steals an uncertain external write. No product recovery command for that exceptional operator action is added here.
- PFAG-OPS-01 — ROUTED_TO_NEXT_FOUNDATION_ACCEPTANCE: evaluate dynamic weighbridge intake with no predefined Driver/Truck roster and define explicit source-series/time capture. GWS1 adds no fake Driver, no readiness change and no Phase 10 Trip FSM.
- Existing 440 TypeScript diagnostics and historical suite failures remain debt; source comparison must establish the actual delta. No lint PASS or live-Google acceptance is implied.

## PFAG-RB2 current maintenance decisions

Current status belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). RB1 is merged/source-verified at `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`, containing `7887aa321a014360640972232abc4fa88ea33ded`. Older RB1 implementation observations below retain their historical unit scope.

- H3: replace independently fetched refresh generations with one server transaction-composed foundation payload. Existing canonical readers, pricing projection and readiness policy are reused. Receipt retry is read-only; expected result and Project/editor generation fences precede atomic apply.
- H4: ACTIVE-safe Project fields are the four live display/reference fields; location, dates, currency/tax and operational configuration remain locked or separately governed. Profile expected versions prevent stale saves. [The maintenance contract](PROJECT_FOUNDATION_MAINTENANCE_CONTRACT.md) records all Project fields and role/status/impact/audit classifications.
- ACTIVE → SUSPENDED preserves memberships, temporal records and history. Explicit SUSPENDED → ACTIVE reuses full canonical activation readiness, including transaction-time revalidation; ordinary activation/status PATCH cannot bypass it. Archive transition remains DEFERRED_WITH_FENCE; no terminal lifecycle semantics are invented.
- Driver/Truck profile editing uses one reusable server service and editor. Natural ID/plate correction is IDENTITY_MIGRATION_REQUIRED. Optional mutable clears, typed dates/weights and version/audit checks are explicit. No Smart-Import-specific profile or creation authority is introduced.
- UI follows existing server roles: SA Project creation and user assignment; scoped PA/SA maintenance; existing Finance pricing access is discoverable. One Fleet action menu covers membership and profile operations. Pricing cleanup on nonmutable Projects reuses canonical status save, with receipt/refresh proof.
- RB1 compatibility: Truck affiliation inactivation now rejects an active allocation, requiring explicit closure. Carrier dependency inspection also counts active temporal dependencies referenced by historical inactive affiliations. This closes an integrated cleanup escape without changing the no-cascade consequence policy.
- ACTIVE status is not operational readiness. Wizard and selected-Project dashboard display readiness/blockers without automatic suspension.
- PFAG-RULES-01 remains STILL_OPEN / ENVIRONMENT_BLOCKED: native direct-client pricing rejection must be checked at the first available emulator/deployed gate. No repeat download/install was attempted. The approved source-only fallback remains applicable; assurance is not deployment certification.
- Historical stale tests remain separately observed against the exact RB2 baseline; no blanket retirement, test removal or skipped-coverage policy is introduced. H3 transport/source-shape assertions and race fixtures are converged only to the new same-transaction contract, preserving rejection/continuation coverage.

### RB2 verification observation — 2026-10-29

Evidence baseline: `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`. RB2 focused server/UI tests 64/64, RB1 54/54, Phase 8 184/184, report harnesses 12/12 + 48/48 + 18/18, auth trust boundary 23/23; controlled browser maintenance 15 checks, late-response race 1 check and pricing/Trip snapshot regression 8 checks passed. This is serialized transactional in-memory persistence with controlled auth/network, not native Firestore or live Firebase. Native pricing rule verification remains PFAG-RULES-01.

Selected baseline including navigation: 1338/1348; final 1402/1412 with 64 added tests, zero new failures, zero removals/skips. Both aggregate commands exit 1: ten identical baseline assertion failures remain (three old rules-shape assertions, Fleet HTTP mock, page-reload source guard, import-session call shape, two portal-direction assertions and two Setup/readiness fixtures). Both also include the unchanged no-Vitest-suite error for reportsEngineConvergence; its actual standalone harness passes 48/48. i18n/auth selection is 129/130 both baseline/final: the same historical TBC-B4 checkpoint-anchor guard fails; it is not hidden or retired. Runtime-key audit itself passes 16/16.

Build passes. TypeScript diagnostics remain 440 → 440, zero added/removed after path/line normalization; lint is EXIT 2 / NOT PASS. AR/EN/UR each have 4420 keys, zero duplicate/empty/parity gaps. Counts are this unit's observations, not permanent cardinality rules. All existing tests in modified historical test files retain their counts; assertions/fixtures changed only for composed refresh and current permission presentation.

Source assurance found no remaining critical/high scoped defect. Bounded residual obligations are native rules/deployment verification, historical harness debt, and live external-provider/release acceptance. Archive remains explicitly deferred with its mutation fence, and a non-ready suspended Project is deliberately rejected rather than restored by bypass. No Phase 10 implementation, i18n reopening, pricing calculation change or Smart Import architecture change is authorized by these observations.

## PFAG-RB1 bounded remediation decisions

Exact current status is owned by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline: `f261ebc5508d881c9bfbe3dc77af1ccad75ec914` (P9-U2 PR #63 merged).

- C1 source correction: deny direct canonical pricing writes; preserve server Admin SDK mutation authority. Native rules runtime verification is STILL_OPEN: no local emulator, official download HTTP 403 even with network permission. Structural deny assertions do not prove execution on the native rules engine.
- C2 source correction: saved historical snapshots outrank mutable master data; IDs are safe label fallback, uncaptured capacity/tax facts remain unavailable. No historical repricing or migration.
- H1 approved policy: no silent cascade and no dangling scoped dependency. Compose bounded Driver/Truck/Material temporal closure with membership/audit atomically; Material cap 50 rejects larger plans before writes. Carrier outcome B rejects with affiliation/assignment/allocation/pricing dependency counts; explicit cleanup first.
- H2 central NEW_OPERATION / MAINTENANCE / CONSISTENCY_CLEANUP policy; nonmutable Projects allow safe cleanup, not expansion. No Project suspend/reactivate implementation.
- Historical test compatibility: intake/Admin assignment fixtures explicitly seed existing SETUP lifecycle; one obsolete pricing-rule assertion now checks the approved deny boundary. Other baseline failures remain reported, not rewritten.
- H3 coherent refresh and H4 maintenance UX are STILL_OPEN / ROUTED_TO_PFAG_RB2. Global governance cascades are not added by RB1. Phase 10 remains NOT_STARTED.
- Local evidence at this checkpoint: focused RB1 54/54; selected baseline 1260/1271 versus final 1315/1325 (54 added, one stale pricing-boundary assertion converged, ten baseline failures retained); Phase-8 regressions 184/184; Reports standalone harnesses 12/12, 48/48 and 18/18; i18n runtime 16/16; controlled browser pricing journey 8/8; canonical service probes 8/8. These use transactional in-memory persistence, not native rules. Build passes; diagnostics 440 → 440, zero added/removed; lint EXIT 2 / NOT PASS. No test removals/skips.
- Owner-approved closure fallback: all 35 match blocks were inspected. Only the exact pricing block (create/update/delete false) and recursive default-deny block match canonical pricing documents. The parent Project match is not recursive; the collection-group exceptions match is read-only and does not match pricing. CLIENT_PRICING_WRITE_ALLOW_PATHS_FOUND = 0. Native syntax/runtime validation was unavailable; source inspection is not relabeled emulator acceptance.
- PFAG-RULES-01 — STILL_OPEN / DEFERRED_ENVIRONMENT_BLOCKED: verify direct-client pricing-rule rejection in native Firestore Rules runtime at the first available emulator/deployed verification gate. Owner-approved fallback permits RB1 source merge with this bounded deployment/release debt; no deployed rules, emulator or Live Firebase acceptance is claimed. No package installation or emulator redownload was performed for closure.

# DECISION AND TECHNICAL DEBT LOG

Current-state owner: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). This is the canonical decision/debt record, not a second unit ledger. Closed decisions below preserve their unit-scoped evidence; past suite/key totals, no-change statements and verification results do not describe all later work.

## Current Smart Import decisions and debt reconciliation

Current state and accepted merge evidence belong only to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). The P8-B3 Course Correction record below is historical; B3 has since merged through PR #60. Current acceptance/publication pointers are owned by the phase ledger. P8-B1 merged at `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`, P8-B2 at `1f7f3344e65dfc9b6837b10cb5349827da1587eb`. Earlier decision IDs and their historical evidence below are preserved.

### Source-supported decisions

- Master Design Review → SI-CG1 → SI-CG2 → Phase 8 is the accepted correction sequence. Natural/canonical identity outranks names; rejected rows do not contribute; Material is not universally mandatory; source-row provenance is explicit. Contextual canonical Create/Enroll/Reactivate/Affiliation remain distinct capabilities, separate from PREPARED_NEW and temporal consequences.
- B1 replaces fabricated snapshot reconstruction with schema-v2 session, source/mapping revisions and first-class durable reviewed intent. Immutable chunks publish through complete manifests, with stable identity/version fencing, exact reattach and separate Trip semantics. Its 86 introduced failures were classified and resolved before publication; that dated observation is not a cardinality gate.
- B2 consumes the server-loaded reviewed semantic intent, revalidates current canonical state and reuses shared canonical identity/participation/temporal authorities. The legacy raw-row path remains fenced rather than restored as a second authority.
- Merged B3 provides deterministic semantic consequence identities, a Project/Session-bound journal, explicit generation/version fencing and atomic mutation-plus-receipt groups. Retry skips receipted groups; satisfaction can reduce work but not broaden the review. Cancellation preserves completed effects. Bounded summaries reference full receipt detail; incomplete refresh proof remains pending. B3 is merged/source-verified/closed through PR #60; live Firebase certification is not implied.
- Current work uses Codex and local Git. Commit/publication require an explicit unit instruction; the B4 owner instruction authorizes one commit and branch publication after verification. Merge remains owner-only. Old dated handoffs and `.aistudio/artifacts/brain/**` remain historical; no new handoff mirror is required.

### Disposition of prior debt and remaining obligations

| Existing debt / subject | Disposition | Current source evidence / remaining owner |
|---|---|---|
| Identity ambiguity and display-name grouping | RESOLVED within the accepted SI-CG1 source contract | Natural/canonical identity, explicit ambiguity handling, rejected-row exclusion and physical/internal row provenance; unresolved choices still require human resolution |
| Duplicate Smart Import creation authority | SUPERSEDED | SI-CG2 invokes canonical Master Data capability; no duplicate creation/affiliation/temporal policy is owned by import |
| Legacy raw-row semantic commit authority | SUPERSEDED | Durable reviewed intent is authority; the legacy Phase-8 fence stays in place |
| DD-01 original full-batch session-restore representation | SUPERSEDED by B1 | Versioned source/mapping/review artifacts and factual resume replace the old snapshot contract; original debt evidence below is preserved |
| DD-01 complete user-facing resume / reattach / provider journey | RESOLVED_IN_B4_SOURCE_SCOPE | B4 adds the actual resume/reattach/recovery and shared Sheets adapter journey; live integration/release acceptance is not claimed |
| Partial execution, response loss and durable recovery | RESOLVED_IN_B3_SOURCE_SCOPE | B3 merged/source-verified at PR #60 with atomic receipts and fences; B4 adds the active UI recovery coordination |
| P1-U1 boundary observations | SUPERSEDED where accepted later authorities exist; STILL_OPEN for unverified remnants | Canonical natural identity, participation, temporal and persistence authorities now exist in source; this record does not waive remaining type/legacy-contract debt |
| TYPECHECK_BASELINE_DEBT | STILL_OPEN | Last local observation: 440 diagnostics / lint exit 2, zero added; dated evidence, never a frozen permitted total or PASS |
| Historical C5 and translation-guard assertions | STILL_OPEN | Baseline-reproduced source-shape assertions remain separately reported; no blanket assertion rewrite or retirement is authorized |
| CURRENT_EXTERNAL_DEPENDENCY_BOUNDARY | STILL_OPEN / ROUTED_TO_LATER_PHASE | Firestore/proxy-dependent suites remain external debt, with domain, Phase 16 and Phase 18 ownership; not a targeted-test PASS |
| DD-02 build chunk-size warning | ROUTED_TO_LATER_PHASE | Phase 15 performance scope; no package/bundler change here |
| DD-03 mixed/bilingual cosmetic polish | ROUTED_TO_LATER_PHASE | Separately bounded product-polish scope; not authorization to reopen accepted i18n convergence |
| DD-04 breadth of product/browser acceptance | STILL_OPEN / ROUTED_TO_LATER_PHASE | Owning product phases, Phase 16 and Phase 18; local in-memory tests do not certify live Firebase or release |
| P0-U6 sparse lockfile metadata observation | ROUTED_TO_LATER_PHASE | Separate supply-chain/Phase 17 hardening scope; package/lock unchanged |
| P0-U6 credential-filename ignore observation | ROUTED_TO_LATER_PHASE | Separate hardening/Phase 17 scope; no tracked-secret or ignore-rule change claimed |

The following CLOSED_DECISIONS section is an append-only historical decision sequence. Present-tense statements inside a dated decision describe its recorded period; this current reconciliation and the phase ledger supersede old continuation pointers, not the historical facts.

## CLOSED_DECISIONS
- **CD-72 — P8-B2 reviewed-intent commit authority closure / P8-B3 continuation**: On independently verified GitHub main `1f7f3344e65dfc9b6837b10cb5349827da1587eb`, PR #58 is merged; implementation commit `6b56d2def2f02aae1d60b5a7d3352210cc584931` is its second parent. P8-B2 — Server Commit Authority & Prepared Identity Materialization is **VERIFIED / CLOSED**. The accepted authority is the dedicated server route `POST /api/projects/:projectId/import-sessions/:importSessionId/commit-reviewed-intent`, which consumes the P8-B1 durable reviewed artifact, revalidates current canonical Project Fleet state, fails closed with `REVIEWED_INTENT_STALE` when semantics drift, materializes compatible PREPARED_NEW Driver/Truck identities, reuses canonical participation and temporal authorities, and commits the bounded semantic write plan plus receipt/audit/session COMMITTED truth inside one Firestore transaction. The historical raw-row roster committer remains fenced by `PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`; normal checkpoint PATCH cannot directly commit a roster session. P8-B2 reported 50/50 new tests, zero new failures, final focused 772/776, Build PASS, diagnostics 440→440, lint EXIT 2 historical debt, controlled browser 4/4, and no live Firebase claim. **P8-B3 — Durable Execution Journal & Recovery** is the next bounded unit and is NOT_STARTED. It must extend recovery beyond the bounded atomic path without creating a second semantic authority or weakening exact reviewed-intent binding.
- **CD-71 — Smart Import master-design correction gate and P8-B1 durable reviewed-intent closure**: Before Phase 8 execution, the owner required a full review of all project documents and Smart Import history, with special attention to layered resolution, missing Carrier/Material/Driver/Truck entities, contextual canonical creation and continuity of the import workflow. The accepted product principle is **External Source → Human-Reviewed Canonical Intent → Canonical Commit**; 1000 rows must not imply 1000 human decisions, fuzzy/name matching cannot become identity authority, and contextual creation must reuse canonical Master Data/business capabilities rather than create import-only authority. The pre-Phase-8 correction gate closed through **SI-CG1** (identity/grouping/provenance/Material-optional mapping) and **SI-CG2** (contextual canonical creation convergence, explicit Create/Enroll/Reactivate/Affiliation semantics, preserved PREPARED_NEW, no hidden temporal effects). P8-B1 — Durable Session & Reviewed Intent Authority then merged through PR #57 at `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`. It established schema-v2 server-authoritative import sessions, legal lifecycle transitions, source and mapping revisions, first-class durable reviewed intent, optimistic version fencing, source reattach semantics and chunked large-session artifacts. Its first draft was blocked by 86 introduced regressions; recovery classified and eliminated all new failures before publication. No live Firebase acceptance was claimed. This decision supersedes any historical Smart Import plan that relied on row-by-row authority, unrestricted lifecycle PATCH, fabricated resume facts, duplicated creation forms or raw-row reinterpretation after review.
- **CD-70 — Owner-approved Phase 2 closure and Phase 3 activation**: On independently verified main `e09cd613d93d3e6519fe1dc283caf96d4363bcec`, PR #35 is merged and P2-U4 is VERIFIED / CLOSED. Phase 2 — Persistence & Server Authority is therefore VERIFIED / CLOSED after P2-U1 through P2-U4. Accepted merge evidence: P2-U1 PR #32 `ff5dc79cb380a8ea2713eb539f6cad326407ea16`; P2-U2 PR #33 `fafbadd90a37988ad97d18a4cfa3191532307255` plus Firestore rules publication and owner smoke verification; P2-U3 PR #34 `48c016e790dbc6f1b64e09cbc22ef60e78743d1c`; P2-U4 PR #35 `e09cd613d93d3e6519fe1dc283caf96d4363bcec`. No known Phase-2-owned Beta 2 blocker remains. Global TypeScript diagnostics baseline 445 and lint EXIT 2 / NOT PASS remain debt. By the owner's explicit instruction to proceed, Phase 3 — Authentication, Authorization & Administrative Governance is activated at governance level. Its accepted scope remains RBAC, token verification, field-level authorization, IDOR defense and admin controls. The first action is one broad `PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT` under CD-69 streamlined execution, covering the known Phase-1 deferrals (wizard role subset, UserValidator role allowlist, server AuthenticatedUser role/auth context) together with active authorization/admin boundaries. No P3 unit is pre-assigned by activation.
- **CD-69 — Owner-approved streamlined reconstruction execution method**: The owner rejected unnecessary micro-staging that was extending the reconstruction without proportional product value. Future work uses the minimum-governance delivery model in `STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md`: one broad phase/area audit should map the meaningful work; compatible defects may be grouped into bounded batches; implementation review is followed by commit + push + PR in one publication step; owner merge remains manual; one independent post-merge GitHub verification is the normal merge gate; browser/runtime verification is required only when behavior or product surfaces change; documentation refresh is concentrated at phase boundaries, major batch closures, or when current pointers would otherwise mislead. Separate pre-PR publication audits, documentation-only loops, repeated unrelated full-suite runs and micro-units are skipped unless they materially protect correctness, data integrity, security, tenant isolation or release quality. High-risk auth, tenant isolation, Firestore rules, destructive persistence/data migration, financial correctness and broad server-authority changes retain additional gates as needed. This changes execution process only; it does not reopen closed phases or alter phase ownership. Phase 2 remains governance-active with no P2-U1 yet; its first-unit audit must produce a practical phase map rather than force seam-by-seam auditing.
- **CD-68 — Owner-approved Phase 2 governance activation**: ACTIVATE_PHASE_2 = APPROVED on independently verified main `747e86662b867aa5990f87fb0e60c79b077efb86`; Phase 1 closure documentation commit `12d15710b847bb3b87a8d3aec4432906ea3fdcc4` merged through PR #30. Phase 2 — Persistence & Server Authority is IN_PROGRESS, governance only, preserving the foundational purpose: server-authoritative Firestore operations, multi-tenant isolation enforcement, Firebase Admin SDK integration and security-rules auditing. ACTIVE_UNIT is UNASSIGNED / REQUIRES_PHASE_2_FIRST_UNIT_DEFINITION; status UNASSIGNED / NOT_STARTED; type UNASSIGNED. P2_U1_STATUS: DOES_NOT_EXIST. NEXT_ACTION: PHASE_2_FIRST_UNIT_DEFINITION_AUDIT. No first-unit selection, audit execution or production implementation is authorized by activation. Persistence representations, cast-based reads, decoders, timestamps, storage and server/client persistence boundaries are candidate audit territory only. Phase 0 freeze, Phase 1 closure and all nine accepted units remain unchanged; no P1-U10 exists. Phase 3 auth/RBAC/role/validation, Phase 4 lifecycle, Phase 5 relationship/master-data behavior, Phases 7–8 import, Phase 9 pricing, Phase 10 trips, Phase 11 offline/outbox and Phase 12 exception semantics retain their owners. Known diagnostics/lint debt is not waived. This decision supersedes only the prior awaiting-activation continuation pointers.
- **CD-67 — Owner-approved Phase 1 closure after P1-U9 (historical closure snapshot; activation pointers superseded by CD-68)**: At closure evidence baseline `f817fc8f053aeb2f5f1ecc63f456a939816b7301`, the audit returned **PHASE_1_CLOSURE_AUDIT_PASS_READY_FOR_OWNER_CLOSURE_DECISION** and the owner closure decision is **APPROVED**. Phase 1 and P1-U1 through P1-U9 are **VERIFIED / CLOSED**; P1-U9 was the final Phase 1 unit. No proven SAFE_PHASE_1_SEAM or Phase-1-owned unresolved regression remains. P1-U8 implementation `71bd509547087d8eb34ef160ac96765ff0c7a10d` merged via PR #28 at `587f47403a9b768be08794054d6f99cf7f1eb2c1`; P1-U9 implementation `8dd14fdc5214539ad9b675733bf3906a20780780` merged via PR #29 at the closure baseline; both merges were independently verified. Phase 0 freeze is unchanged. Persistence/decoder/timestamps remain Phase 2; wizard/validator/auth-context role differences Phase 3; project lifecycle Phase 4; relationships Phase 5; smart import Phases 7–8; pricing Phase 9; trips Phase 10; offline/outbox Phase 11; exception lifecycle Phase 12. Known 445 diagnostics and lint EXIT 2 / NOT PASS remain debt, not a repository-wide PASS. Phase 2 is NOT_STARTED, no implementation is active and no next unit is assigned. NEXT_ACTION: OWNER_DECISION_TO_ACTIVATE_PHASE_2. No P1-U10 exists. This decision supersedes earlier execution/closure-readiness pointers; those records remain historical.
- **CD-66 — PR #26 verified merge / P1-U8 execution checkpoint (historical snapshot)**: The documentation-only P1-U7 closure / P1-U8 activation publication has merged through PR **#26**. Activation commit `fe14046551d9193949ab3d739bdb4720faed06b1`; verified merge/current main `b360fe7c717cff35357dc539ca37d83bea1b348c`. P1-U7 remains **VERIFIED / CLOSED**. P1-U8 — User Entity Role Vocabulary Authority Convergence remains **NOT_STARTED / ACTIVE**, type **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, production scope exactly `src/types/entities.ts`, canonical authority `UserRole` from read-only `src/types/common.ts`, targets only `UserEntity.role` and optional `UserEntity.requestedRole`. Wizard-role subset, UserValidator accepted-role semantics, and server `AuthenticatedUser.role` remain explicit **Phase 3** deferrals and are not P1-U8 scope. Phase 1 remains **IN_PROGRESS**, closure readiness **NO**. After P1-U8 implementation, owner review, publication, merge and independent verification, the next required action is **PHASE_1_CLOSURE_AUDIT**; do not introduce P1-U9 or activate Phase 2 before that audit.
- **CD-65 — Owner-approved P1-U7 closure / P1-U8 activation and User Role semantic partition (historical activation snapshot)**: P1-U7 is **VERIFIED / CLOSED**, owner review **PASSED**, implementation/publication commit `fdb1340af13bac9a7b939ab4bb28345169eedfb7`, PR **#25**, verified merge/current main `9e93f0e47f955d78d74011b5467aa04188268ca6`, implementation publication **MERGED / VERIFIED**. Accepted eight-file/four-production scope converged seven UOM sites, retained GlobalMaterialUom and exported UnitOfMeasure alias, preserved broader DTOs; compiler **3/3**, total **261/261 PASS**, diagnostics **445 → 445** (added **0**, removed **0**), lint **EXIT 2 / NOT PASS**, emit **NONE**, unchanged UI/storage/wire/runtime, build PASS, i18n-runtime **16/16**, auth-trust-boundary **23/23**. Truck test correction remains TEST_HARNESS_COMPATIBILITY_CORRECTION, three tests and substantive guarantees preserved. The accepted semantic audit partitions User Role: only UserEntity.role and optional UserEntity.requestedRole duplicate the full nine canonical roles in read-only `src/types/common.ts` (**SAFE_PHASE_1_TYPE_AUTHORITY_CONVERGENCE**). The owner assigns **P1-U8 — User Entity Role Vocabulary Authority Convergence**, **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, **NOT_STARTED / ACTIVE**, future production scope exactly `src/types/entities.ts`, canonical **UserRole**, two target fields. [The ledger contract](02_PHASE_LEDGER.md#p1-u8-owner-approved-unit-activation) records 18 criteria, 10 stops and future compiler/regression/diagnostic/emit gates. Wizard's intentional four-role subset is **INTENTIONAL_CONTEXT_SUBSET / DO_NOT_CONVERGE_IN_PHASE_1**, **DEFER_PHASE_3_SEMANTIC_REVIEW**; UserValidator's five-role accepted subset is **AUTHORIZATION_VALIDATION_SEMANTICS**, **DEFER_PHASE_3_AUTHORIZATION_VALIDATION_REVIEW**; server AuthenticatedUser.role is **AUTH_CONTEXT_CONVERGENCE**, **DEFER_PHASE_3_AUTH_CONTEXT_CONVERGENCE**, despite full vocabulary duplication. Those boundaries are not unresolved P1-U8 work; do not change wizard/validator/security, Auth context, RBAC, UI choices or authorization. Phase 1 stays IN_PROGRESS, closure readiness NO. After P1-U8 implementation/merge/verification, **PHASE_1_CLOSURE_AUDIT** is required to validate deferrals and absence of further safe seams; no later unit ID or phase activation. Prior closures, Phase 0 freeze and existing later-phase debt owners remain unchanged. Exactly two governance docs change; one normal branch commit/push is owner-authorized, without merge or implementation.
- **CD-64 — P1-U7 bounded implementation and test compatibility decision (historical implementation snapshot)**: On authoritative main baseline `ee0911b916ea7f4e88b84e154cc294bfee422ac4`, seven exact UOM duplicate sites converge to unchanged GlobalMaterialUom authority from `src/types/globalEntities.ts`, preserving TON/M3/TRIP. Production changes are confined to `src/types/entities.ts`, `src/types/wizard.ts`, `src/services/materialManagementClient.service.ts` and `src/components/masterData/MaterialEditorModal.tsx`; exported UnitOfMeasure is retained as a canonical alias, optionality/default TON unchanged, broader string outputs untouched. [Implementation evidence](02_PHASE_LEDGER.md#p1-u7-bounded-implementation--awaiting-owner-review) records **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not acceptance/closure. New compiler contract **3/3 PASS**. The owner separately authorized only `src/tests/truckTypeBoundaryAuthority.test.ts` as **TEST_HARNESS_COMPATIBILITY_CORRECTION**: remove the obsolete sole-import layout assumption while preserving canonical source/symbol/type-only checks and all substantive truck/compiler assertions. Its count remains **3**, **3/3 PASS**; no general historical-test rewrite authorized. Material/global-identity regressions **230/230**, unchanged translation guard **25/25**, corrected truck test **3/3**, existing matrix **258/258**; with new compiler test **261/261 PASS**. Baseline/final diagnostics **445 → 445**, added **0**, removed **0**, lint **EXIT 2 / NOT PASS**. TypeScript/esbuild emit is byte-identical for all four production files, runtime change **NONE**. UI/storage/wire/runtime behavior unchanged; browser/manual verification not required and not claimed. Build PASS, i18n-runtime **16/16**, auth-trust-boundary **23/23**. Exactly eight files change: four production, one new test, one compatibility test, two governance docs; authority/other tests/config/package/workflow unchanged, no generated drift. Prior closures/Phase 0 freeze and later-phase debt ownership are preserved. Phase 1 stays IN_PROGRESS, closure readiness NO. Unassigned User Role remains **FRESH_SEMANTIC_AUDIT_REQUIRED_NOT_PROVEN_TYPE_ONLY**; no later unit ID or phase activation. Owner review pending; **NOT PUBLISHED**, no commit/push/PR.
- **CD-63 — Owner-approved P1-U6 closure / P1-U7 activation (historical activation snapshot)**: P1-U6 is **VERIFIED / CLOSED**, owner review **PASSED**, implementation/publication commit `7055d09bf18e85366dadca36cdf2efa8d72daac6`, PR **#23**, verified merge/current main `deb9738b508b0183ccf0d73c1ea0ea6351ce3ea5`, implementation publication **MERGED / VERIFIED**. Accepted evidence remains eight entity-local status declarations converged, no shared status type, compiler contract **3/3**, regressions **68/68**, diagnostics **445 → 445** with added **0**, removed **0**, lint **EXIT 2 / NOT PASS**, runtime emit **NONE**, build **PASS**, i18n-runtime **16/16**, auth-trust-boundary **23/23**, unchanged storage/wire/runtime. The owner assigns **P1-U7 — Global Material UOM Vocabulary Authority Convergence**, **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, **NOT_STARTED / ACTIVE**. [The ledger activation contract](02_PHASE_LEDGER.md#p1-u7-owner-approved-unit-activation) records **19 acceptance criteria**, **10 stop conditions**, and future compiler/regression/diagnostic/emit/foundation gates. Read-only `src/types/globalEntities.ts` supplies canonical **GlobalMaterialUom**, exact TON/M3/TRIP. Four candidate production files only: `src/types/entities.ts`, `src/types/wizard.ts`, `src/services/materialManagementClient.service.ts`, `src/components/masterData/MaterialEditorModal.tsx`. Confirm targeted exact declarations before implementation; report additional duplicates before scope expansion. Preserve optionality, exported wizard compatibility, default TON, validation, broader string outputs, UI/i18n, density, pricing/import and storage/wire/runtime semantics. No automatic result DTO narrowing. Phase 1 stays IN_PROGRESS, closure readiness NO. User Role remains unassigned and requires a fresh semantic audit across common/entities/wizard/security middleware/validation; vocabularies are not proven identical or safely type-only. No later unit ID or Phase 2 activation. Prior closed units, Phase 0 freeze and later-phase debt ownership remain unchanged. Only two governance docs change; one normal branch commit/push is owner-authorized without merge or P1-U7 implementation.
- **CD-62 — P1-U6 bounded implementation decision (historical implementation snapshot)**: On authoritative main baseline `e4718e3fc5a3a8bf4546c1c8c0a19b2dd4943079`, only `src/repositories/globalIdentity.repository.ts` changes in production: exactly eight optional create/update status declarations now consume their own canonical GlobalDriverEntity['status'], GlobalTruckEntity['status'], GlobalCarrierEntity['status'] or GlobalMaterialEntity['status'] from unchanged `src/types/globalEntities.ts`. **ENTITY-LOCAL STATUS AUTHORITY** preserves Driver/Carrier ACTIVE/SUSPENDED/INACTIVE, Truck ACTIVE/MAINTENANCE/INACTIVE, Material ACTIVE/INACTIVE; no shared type, any or widening. Material retains updateCatalog. Optionality, all ACTIVE default expressions, method bodies, transitions, transactions, identity/normalization/fallback, storage/wire/API and runtime remain unchanged. [Implementation evidence](02_PHASE_LEDGER.md#p1-u6-bounded-implementation--awaiting-owner-review) records **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not closure or acceptance. New compiler test `src/tests/globalEntityStatusInputAuthority.test.ts`: **3/3 PASS**; unchanged global identity/membership/intake regressions **68/68 PASS**. Baseline/final project diagnostics **445 → 445**, added **0**, removed **0**, lint **EXIT 2 / NOT PASS**. TypeScript/esbuild runtime emit **NONE**; build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**. Exactly four files change: one production, one new test, two governance docs; no generated drift. Prior closed units and Phase 0 freeze remain unchanged. Phase 1 stays IN_PROGRESS, closure readiness NO; material-UOM and user-role candidates remain unassigned, no later unit ID or Phase 2 activation. Existing later-phase debt and transition-semantic owners are preserved. Owner review pending; **NOT PUBLISHED**, no commit/push/PR.
- **CD-61 — Owner-approved P1-U5 closure / P1-U6 activation (historical activation snapshot)**: P1-U5 is **VERIFIED / CLOSED** after owner review **PASSED**, implementation/publication commit `4a2e1c1747212dd27d0c20aaefbab09c30dff9d8`, PR **#21**, verified merge/current main `e76ad3cf9ce9204f8f5d2aaa5b4fa2c106a35b39`, implementation publication **MERGED / VERIFIED**. Accepted evidence remains compiler contract **3/3**, relevant regressions **106/106**, diagnostics **445 → 445**, added **0**, removed **0**, lint **EXIT 2 / NOT PASS**, runtime emit **NONE**, build **PASS**, i18n-runtime **16/16**, auth-trust-boundary **23/23**, unchanged storage/wire/runtime. The owner assigns **P1-U6 — Global Entity Status Input Authority Convergence**, **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, **NOT_STARTED / ACTIVE**. [The ledger activation contract](02_PHASE_LEDGER.md#p1-u6-owner-approved-unit-activation) records **20 acceptance criteria**, **11 stop conditions**, future compiler/regression/diagnostic/emit/foundation gates, and exactly **eight** future optional status declaration replacements in only `src/repositories/globalIdentity.repository.ts`. Read-only authority `src/types/globalEntities.ts` supplies **ENTITY-LOCAL STATUS AUTHORITY** through GlobalDriverEntity['status'], GlobalTruckEntity['status'], GlobalCarrierEntity['status'] and GlobalMaterialEntity['status']. Driver/Carrier ACTIVE/SUSPENDED/INACTIVE, Truck ACTIVE/MAINTENANCE/INACTIVE and Material ACTIVE/INACTIVE remain distinct; no common GlobalEntityStatus type. Material's actual update method is updateCatalog, not updateProfile; this naming correction identifies the same eighth boundary without semantic expansion. No body/default/transition/validation, identity/transaction/normalization/fallback, storage/wire/API or UI change is authorized. Phase 1 stays IN_PROGRESS, closure readiness NO; material-UOM and user-role families remain unassigned, no later unit ID or Phase 2 activation. P1-U1/P1-U2/P1-U3/P1-U4 and Phase 0 freeze remain unchanged; later-phase debt ownership is preserved. Only two governance documents change; one normal branch commit/push is owner-authorized, without merge or P1-U6 implementation.
- **CD-60 — P1-U5 bounded implementation decision (historical implementation snapshot)**: On authoritative main baseline `d303fe88ce00df132abcd7e06d5508d7ae5308eb`, only `src/utils/canonicalFleetRelationshipPolicy.ts` changes in production: type-only AffiliationStatus import from unchanged `src/types/projectCarrierAffiliation.ts`, and canonical status references at PureAffiliation.status and evaluateAffiliation return status. Exact ACTIVE/INACTIVE vocabulary, independent partial policy interface, optional audit metadata and existing timestamp types are preserved; no new any or string widening. AffiliationInput, PureAssignment/PureAllocation, stored entities, all method bodies, relationship transitions, conflicts, validation, runtime and storage/wire/API are unchanged. [Implementation evidence](02_PHASE_LEDGER.md#p1-u5-bounded-implementation--awaiting-owner-review) sets P1-U5 to **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not closure/acceptance. New compiler test `src/tests/affiliationStatusVocabularyAuthority.test.ts`: **3/3 PASS**. Five unchanged regressions pass **106/106**, with the new test **109/109**. Baseline/post lint exit **2 / NOT PASS**, identical **445 → 445** diagnostics, added **0**, removed **0**. TypeScript/esbuild runtime emit **NONE**; build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**. Exactly four files change: one production, one new focused test, two governance docs; no generated drift. Prior accepted units and Phase 0 freeze remain unchanged. Phase 1 stays IN_PROGRESS, closure readiness NO; three other material-UOM/user-role/global-status candidate families remain unassigned, no later unit ID or Phase 2 activation. Existing later-phase debt owners are preserved, including Phase 5 relationship behavior. Owner review pending; **NOT PUBLISHED**, no commit/push/PR.
- **CD-59 — Owner-approved P1-U4 closure / P1-U5 activation (historical activation snapshot)**: P1-U4 is **VERIFIED / CLOSED** after owner review **PASSED**, implementation/publication commit `c8deded43ce20647955ea3e1839386f2bc78be78`, PR **#19**, verified merge/current main baseline `c00a4975cf973d470033e430579a09a80fb71ce0`, implementation publication **MERGED / VERIFIED**. Accepted evidence remains compiler contract **3/3**, historical regression **21/21**, diagnostics **445 → 445** (added **0**, removed **0**), lint **EXIT 2 / NOT PASS**, runtime emit **NONE**, build **PASS**, i18n-runtime **16/16**, auth-trust-boundary **23/23**, unchanged storage/wire/runtime and no generated report drift. Historical Firestore errors exercised the existing fallback, not live-connectivity proof. The owner explicitly assigns **P1-U5 — Affiliation Status Vocabulary Authority Convergence**, **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, **NOT_STARTED / ACTIVE**. [The ledger activation contract](02_PHASE_LEDGER.md#p1-u5-owner-approved-unit-activation) records **17 acceptance criteria**, **10 stop conditions** and future compiler/regression/diagnostic/emit/foundation gates. Future production scope is exactly `src/utils/canonicalFleetRelationshipPolicy.ts`: type-only canonical AffiliationStatus references at PureAffiliation.status and evaluateAffiliation return status, preserving ACTIVE / INACTIVE. `src/types/projectCarrierAffiliation.ts` remains read-only; PureAffiliation stays an independent partial shape, not a stored-entity alias. AffiliationInput, PureAssignment/PureAllocation, stored affiliation entities, audit optionality, method bodies and relationship behavior remain unchanged. Phase 5 retains relationship semantics; existing later-phase debt owners remain unchanged. Phase 1 stays IN_PROGRESS, closure readiness NO; three other material-UOM/user-role/global-status families remain unassigned, no later unit ID or Phase 2 activation. P1-U1/P1-U2/P1-U3 and Phase 0 freeze are preserved. Only two governance documents change; their combined single-commit normal branch publication is owner-authorized, without merge or P1-U5 implementation.
- **CD-58 — P1-U4 bounded implementation decision (historical implementation snapshot)**: On authoritative main baseline `5d3526a14d697038d414ff48ab661406672acb0b`, the owner authorized SettlementAdjustmentType authority convergence in only `src/services/settlementAdjustment.service.ts`. The canonical type-only import replaces the request boundary's exact RATE / AMOUNT / DEDUCTION / OTHER union; unchanged `src/types/entities.ts` remains authority and the repository is untouched. [The ledger implementation evidence](02_PHASE_LEDGER.md#p1-u4-bounded-implementation--awaiting-owner-review) records **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not closure or acceptance. New compiler test `src/tests/settlementAdjustmentTypeAuthority.test.ts`: **3/3 PASS**; unchanged historical adjustment regression: **21/21 PASS** (existing Firestore fallback exercised, historical placeholders not strengthened); generated reports restored. Baseline/post diagnostics **445 → 445**, added **0**, removed **0**, lint **EXIT 2 / NOT PASS**. TypeScript/esbuild runtime emit is identical, build PASS, i18n-runtime **16/16**, auth-trust **23/23**. Requiredness/nullability, full input/entity shape, runtime, storage/wire/API, authorization and financial workflow remain unchanged. Exactly four files change: one production, one new test, two governance docs. Phase 0 freeze and prior closures remain unchanged. Four other known families remain unassigned; fresh residual assessment is required after acceptance. Phase 1 stays IN_PROGRESS, closure readiness NO; no later unit ID or Phase 2 activation. Existing later-phase debt is preserved. Owner review pending; **NOT PUBLISHED**, no commit/push/PR.
- **CD-57 — Owner-approved P1-U3 closure / P1-U4 activation (historical activation snapshot)**: P1-U3 is VERIFIED / CLOSED: owner review PASSED, implementation `42db0a980768103cd05bc04204f3f76a2a322fc0`, PR #17, verified merge/current governance baseline `ca53209f0844c7968e518efe553fd171436bce70`, implementation publication MERGED / VERIFIED. Accepted verification remains compiler contract 3/3, existing regressions 128/128, diagnostics 445 → 445 (added 0, removed 0), runtime emit NONE, build PASS, runtime-key 16/16, auth-trust 23/23; storage/wire/runtime unchanged. Lint remains EXIT 2 / NOT PASS. The fresh Phase 1 closure audit is NOT READY: five bounded type-authority families remain; the earlier one-seam estimate is superseded. The owner assigns **P1-U4 — Settlement Adjustment Type Vocabulary Authority Convergence**, **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, **NOT_STARTED / ACTIVE**. [The ledger activation contract](02_PHASE_LEDGER.md#p1-u4-owner-approved-unit-activation) permits future production edits only in `src/services/settlementAdjustment.service.ts`: type-only SettlementAdjustmentType reference at requestAdjustment.adjustmentType. The authority `src/types/entities.ts` and settlement repository are read-only; runtime bodies, authorization, calculations, approval workflow and persistence/wire/API must not change. All 17 acceptance criteria, 10 stop conditions, focused compiler test and historical regression/report-integrity boundaries are recorded there. Four additional material-UOM/role/global-status/affiliation-status families remain unassigned; a fresh residual assessment is required, not automatic Phase 1 closure. Later-phase debt remains with Phases 2/3/4/5/7–11 as recorded. P1-U1/P1-U2 and Phase 0 freeze are unchanged; no later unit ID or Phase 2 activation is introduced. Only two governance docs change; their combined one-commit normal branch publication is owner-authorized, without P1-U4 implementation or merge.
- **CD-56 — P1-U3 bounded implementation decision (historical implementation snapshot)**: The owner authorized the exact two-file type-authority convergence on main `8a962ae3e1d133301918e08e59c3e3da5d17f254`. [The ledger's implementation evidence](02_PHASE_LEDGER.md#p1-u3-bounded-implementation--accepted-verification-evidence) sets P1-U3 to **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not VERIFIED/CLOSED. `src/services/driverTruckIntake.service.ts` and `src/types/entities.ts` now consume the unchanged GlobalTruckType through type-only imports at their approved optional truckType fields; no other production edit occurs. One focused test is added: `src/tests/truckTypeBoundaryAuthority.test.ts`, 3/3 PASS. Seven unchanged regressions pass 128/128, total including the new test 131/131. Baseline/post lint both exit 2 with identical 445 diagnostics, added 0, removed 0; lint is NOT PASS. Both files emit byte-identical JavaScript under TypeScript/esbuild with maps disabled. Build passes; runtime-key 16/16 and auth-trust 23/23 pass. Exact four values, optionality, declared nullability, mutability/exports, runtime, storage/wire/API and entity ownership are unchanged. Broader standalone/import strings and all out-of-scope behavior remain untouched. Phase 0 freeze and P1-U1/P1-U2 closures are preserved; no later unit ID or Phase 2 is activated. Timestamp debt remains DEFER_PHASE_2; import DTO debt DEFER_PHASE_7_8. Phase 1 closure audit remains the expected next step only after P1-U3 closure; owner acceptance is pending. Publication is NOT PUBLISHED; no commit/push/PR occurs.
- **CD-55 — Owner-approved P1-U2 closure / P1-U3 activation (historical activation snapshot)**: The owner approved P1-U2 VERIFIED / CLOSED (implementation `09b42328b7aabd8d0a2bde610d76e307b1c6ff7e`, PR #15, verified merge `551c6ef554c537a57485035955cbb03b6fb9d0e5`, owner review PASSED, implementation publication MERGED / VERIFIED) and explicitly assigned **P1-U3 — Truck Type Vocabulary Authority Across Input and Stored Boundaries**, type **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, **NOT_STARTED / ACTIVE**. [The ledger's activation contract](02_PHASE_LEDGER.md#p1-u3-owner-approved-unit-activation) records one purpose: canonical GlobalTruckType references for DriverTruckIntakePayload.truckType and TruckEntity.truckType in exactly `src/services/driverTruckIntake.service.ts` and `src/types/entities.ts`; `src/types/globalEntities.ts` is read-only. Audit evidence: identical four values/optionality, virtual diagnostics 445 → 445 (added 0, removed 0), unchanged TypeScript/esbuild runtime emit, no expected runtime/storage/wire change. All 16 acceptance criteria, 11 stop conditions, exact future focused/regression/build/foundation checks and exclusions are recorded there. Broad string inputs in standalone/import remain untouched. Timestamp debt remains DEFER_PHASE_2; importBatchId DTO debt remains DEFER_PHASE_7_8. PHASE_1_REMAINING_SEAMS = 1; after P1-U3, LIKELY_READY_FOR_PHASE_1_CLOSURE_AUDIT is advisory only. This closes unit selection, not P1-U3 implementation or Phase 1. Phase 0 freeze and prior accepted contracts remain unchanged. No later unit ID is assigned. Only the two governance documents change; the owner authorized their combined one-commit branch publication, without implementation or merge.
- **P1-U2 post-merge closure record (CD-54 completion)**: P1-U2 is **VERIFIED / CLOSED** following owner review PASSED and verified publication/merge through **PR #15**. Implementation commit `09b42328b7aabd8d0a2bde610d76e307b1c6ff7e`; verified merge/current main `551c6ef554c537a57485035955cbb03b6fb9d0e5`; implementation publication **MERGED / VERIFIED**. Accepted evidence: compiler-contract 3/3, existing regressions 131/131, build PASS, runtime-key 16/16, auth-trust 23/23; runtime emit NONE; storage/wire and runtime unchanged; diagnostics 445 → 445, added 0, removed 0. Lint remains exit 2, NOT PASS. [The ledger's closure record](02_PHASE_LEDGER.md#p1-u2-post-merge-closure-record) preserves Phase 0 freeze and P1-U1 closure. Phase 1 remains IN_PROGRESS; At closure preparation ACTIVE_UNIT was UNASSIGNED / REQUIRES_NEXT_PHASE_1_UNIT_DEFINITION, ACTIVE_UNIT_STATUS was UNASSIGNED / NOT_STARTED, NEXT_ACTION was DEFINE_NEXT_PHASE_1_UNIT. The accompanying read-only candidate audit assigned no next unit ID and implemented nothing. CD-55 records the subsequent explicit owner assignment. Existing debt is not waived. At that preparation snapshot the closure record was NOT PUBLISHED; the combined governance publication is now owner-authorized under CD-55.
- **CD-54 — P1-U2 bounded implementation decision (historical implementation snapshot)**: The owner authorized implementation on authoritative main `3abfa32550fc93955287f4aa9f0cef0e6c6671cd` within CD-53's exact scope. [The ledger's implementation evidence](02_PHASE_LEDGER.md#p1-u2-bounded-implementation--accepted-verification-evidence) records **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not VERIFIED/CLOSED. The only production edit is type-only canonical imports and the PureAssignment/PureAllocation aliases in `src/utils/canonicalFleetRelationshipPolicy.ts`; one compiler-contract test is added at `src/tests/canonicalFleetRelationshipPolicyTypeAuthority.test.ts`. Exact nine-field contracts, existing exports and policy function bodies are preserved. No merging/augmentation dependency or affected new consumer was found. Baseline/final lint both exit 2 with identical 445 diagnostics (added 0, removed 0); lint is NOT PASS. Focused compiler test 3/3, unchanged five regressions 131/131, build, runtime-key 16/16 and auth-trust 23/23 pass. Baseline/current TypeScript and esbuild runtime JavaScript are byte-identical with maps disabled; storage/wire and relationship semantics are unchanged. Existing PureAffiliation/AffiliationInput, reference types/consumers and all unrelated debt remain untouched. Phase 0 freeze and P1-U1 closure are preserved. No later unit is assigned. Owner acceptance remains PENDING; publication is NOT PUBLISHED; no commit, push or PR occurs.
- **CD-53 — Owner-approved P1-U2 activation (historical activation snapshot)**: Following PHASE_1_NEXT_UNIT_SEAM_AUDIT_COMPLETE on authoritative main `a53d5a95b2e392ae6b362ddbda4866b49c6bbe7d`, the owner assigned **P1-U2 — Temporal Fleet Relationship Policy Type Authority Convergence**, type **BOUNDED_TYPE_AUTHORITY_CONVERGENCE**, status **NOT_STARTED / ACTIVE**. [The ledger's activation contract](02_PHASE_LEDGER.md#p1-u2-owner-approved-unit-activation) records the sole future production file `src/utils/canonicalFleetRelationshipPolicy.ts`, the two type-only aliases, read-only references, exact audit evidence (both pairs EXACT_STRUCTURAL_EQUIVALENCE; export compatibility CONDITIONAL; no expected runtime emit change; 445/445 diagnostics, 0 added/removed; tests 131/131 PASS), all 15 acceptance criteria and all 11 stop conditions. P1-U1 remains VERIFIED / CLOSED and Phase 0 remains VERIFIED / CLOSED / FROZEN. This closes unit selection only: implementation is NOT_STARTED, no aliases/tests/configuration/runtime/persistence changes occur, and no later unit ID is assigned. Implementation must stop for declaration merging, newly affected consumers, mismatch, emit/diagnostic changes or scope expansion. Existing debt is not waived. Activation publication is NOT PUBLISHED; no commit or push is performed.
- **P1-U1 post-merge closure record (CD-52 completion; historical closure snapshot)**: At that closure snapshot, owner review PASSED before publication; P1-U1 is **VERIFIED / CLOSED**. Implementation/publication commit `438b3695757f9da3f1a782e85193340b25d6fb74` merged through **PR #12** at verified merge `06696db883db2a47526b207f5a94e27321c49ec7`; publication is **MERGED / VERIFIED**. The closure baseline was `06696db883db2a47526b207f5a94e27321c49ec7`. At that snapshot Phase 1 remained IN_PROGRESS; ACTIVE_UNIT was UNASSIGNED / REQUIRES_NEXT_PHASE_1_UNIT_DEFINITION, ACTIVE_UNIT_STATUS was UNASSIGNED / NOT_STARTED, and NEXT_ACTION was DEFINE_NEXT_PHASE_1_UNIT. The Temporal Fleet Relationship Policy Type Authority Convergence recommendation (`src/utils/canonicalFleetRelationshipPolicy.ts`, PureAssignment / PureAllocation) was then CANDIDATE_NEXT_IMPLEMENTATION_SEAM: NOT ACTIVE, NOT AUTHORIZED FOR IMPLEMENTATION, NO UNIT ID ASSIGNED. Phase 0 freeze and existing debt are unchanged. At that snapshot the closure record was NOT PUBLISHED; it is now included in main `a53d5a95b2e392ae6b362ddbda4866b49c6bbe7d`. CD-53 supersedes only the historical unassigned/candidate pointers through explicit owner activation.
- **CD-52 — P1-U1 documentation-contract implementation decision (historical implementation snapshot)**: At that implementation snapshot, the owner authorized contract implementation on main `4e7fde36628b83117bf19f4ee34091f6eee2204c`. [P1_U1_CANONICAL_DOMAIN_AUTHORITY_AND_IDENTITY_CONTRACT.md](P1_U1_CANONICAL_DOMAIN_AUTHORITY_AND_IDENTITY_CONTRACT.md) is CURRENT_SUPPORTING and records authority/disposition, identity/FK/enforcement, relationship, input/stored/projection and time/nullability boundaries. At that historical snapshot, [the ledger](02_PHASE_LEDGER.md) set P1-U1 to **IMPLEMENTED / AWAITING_OWNER_REVIEW**, not VERIFIED/CLOSED. The 78 authority entries have UNKNOWN 0; the 13 identity/key contexts preserve existing IDs and storage/wire behavior. A proposed one-file temporal policy type deduplication seam is documented with exact consumers; it is not activated and has no new unit ID. This decision does not accept the completed contract on the owner's behalf, remediate production debt or authorize type/runtime/persistence changes. At that historical snapshot owner acceptance was pending and implementation publication was NOT PUBLISHED; the post-merge closure record above supersedes those pending states.
- **CD-51 — Owner-approved P1-U1 activation**: Following `PHASE_1_FIRST_UNIT_DEFINITION_AUDIT_COMPLETE` on authoritative main `5bf844e2f2cea1604e3f6fcfbf8778cd8aed94e6`, the owner assigned **P1-U1 — Canonical Domain Authority and Identity Boundary Contract** (عقد سلطة أنواع الدومين وحدود الهوية ونطاق المشروع), type **CONTRACT_FIRST_UNIT**. [The ledger's activation contract](02_PHASE_LEDGER.md) records purpose, primary identity/reference families, read-only production evidence scope, exclusions, critical audit findings, required acceptance outputs and tentative unnumbered successors. At that activation snapshot Phase 1 was **IN_PROGRESS**, P1-U1 was **NOT_STARTED / ACTIVE**, and NEXT_ACTION was **EXECUTE_P1_U1_CONTRACT_DEFINITION**; CD-52 records subsequent documentation-contract implementation. This closes the unit-selection decision only, not P1-U1 implementation or acceptance. Phase 0 remains VERIFIED / CLOSED / FROZEN; all existing debt and future-phase ownership remain intact. No branded IDs, type convergence, production/test/config/persistence or runtime changes are performed. Subsequent units have no IDs and are not activated. Activation publication was NOT PUBLISHED at that snapshot; it was subsequently published as `da47392b6d4f5fefa2cfadfbf8dda9d5e8061771` and merged into implementation baseline `4e7fde36628b83117bf19f4ee34091f6eee2204c`. Its administrative scope did not execute contract-definition deliverables; CD-52 records their later implementation.
- **CD-50 — Owner-approved P0-U7 governance closure / Phase 0 freeze**: On main audit baseline `9bd5f7c971f21119ecb53717999786b8d1ad9609`, the owner accepted the P0-U7 read-only audit and explicitly approved governance/freeze implementation. P0-U7 is **VERIFIED / CLOSED**, Phase 0 is **VERIFIED / CLOSED / FROZEN**, and at that Phase 0 exit snapshot Phase 1 — Canonical Domain Model was **NOT_STARTED / ACTIVE**, with ACTIVE_UNIT **UNASSIGNED / REQUIRES PHASE_1 UNIT DEFINITION**. CD-51 records the subsequent explicit owner unit assignment. [PHASE_0_FREEZE_CONTRACT.md](PHASE_0_FREEZE_CONTRACT.md) preserves the foundation authorities, accepted audit evidence and non-completion boundaries. The reassessed 445 diagnostics and six external failures remain non-blocking exit debt with explicit routing below; lint, root npm test and verify:beta2 are NOT PASS. No debt is remediated, no foundation unit is reopened and no Phase 1 implementation is started. At the implementation snapshot publication was pending; that state is historical. Owner review passed, and the documentation-only publication commit `d4f5a8c6f2fdf7f227fb192d901fdf15da58c1c5` was merged through PR #9 at verified merge `3b0fc03d27a4b663e85d330f581550c37d62999d` (7 files). Publication is now MERGED / VERIFIED, according to the owner-supplied verified GitHub facts and synchronized main history.
- **CD-49 — P0-U6 closure / P0-U7 activation**: The owner confirmed implementation, review, publication of commits `4ac5769fb2d490b900114cc23dc0a4456944be25` and `def3195f7c3661bd31744c348c6e2f01176b399d`, merge `54f6d829c184a371e96c2812b08738c42280552b`, and independent audit. Corrected PR verification recorded Required foundation SUCCESS and Typecheck debt observability SUCCESS. Post-merge main Secret-free foundation CI run #3 recorded both jobs SUCCESS and overall SUCCESS. P0-U6 is **VERIFIED / CLOSED**; this does NOT mean lint PASS or waive unresolved TypeScript debt. At that closure/activation snapshot P0-U7 was **NOT_STARTED / ACTIVE** and owed debt reassessment; CD-50 records its subsequent reassessment, closure and transition. The accepted foundational plan places Phase 1 — Canonical Domain Model after Phase 0; its first unit is not specified, and progression is gated by P0-U7 closure. This documentation-only record uses the owner's confirmed runtime/audit evidence; it does not rerun CI, change CI behavior, start P0-U7 implementation or close Phase 0.
- **CD-48 — P0-U6 runtime-semantics correction decision**: Initial implementation commit `4ac5769fb2d490b900114cc23dc0a4456944be25` was published. Owner-supplied GitHub evidence showed Required foundation SUCCESS, Typecheck debt observability FAILURE, and aggregate workflow FAILURE. The owner approved `continue-on-error: true` at the lint STEP only (id `typecheck`, exact command `npm run lint`), not at JOB level. Its actual nonzero command result and `steps.typecheck.outcome == failure` remain visible; the post-tolerance conclusion permits the debt job and workflow to succeed if all other required steps/jobs succeed. An always-run summary explicitly distinguishes failed TYPECHECK COMMAND RESULT from independent FOUNDATION CI RESULT, calls this intentionally non-blocking debt observability rather than lint PASS, and requires P0-U7 reassessment. Both mutation guards remain always-run and blocking; no foundation, permission, secret, external-test, package, source or test contract changes are authorized. At that correction-decision snapshot, publication and a new hosted run were pending; it did not claim runtime verification or P0-U6 closure, and P0-U7 remained NOT_STARTED. CD-49 supersedes those pending pointers with the confirmed closure/activation record.
- **CD-47 — Bounded P0-U6 CI implementation decision**: The owner approved secret-free foundation-only CI on baseline `2923108b1a635f5eed3b1e4d6d15d2c456246c08`; at that implementation snapshot the status was **IMPLEMENTED / AWAITING_VERIFICATION**, not unit closure (superseded by CD-49). [CI Baseline Contract](CI_BASELINE_CONTRACT.md) records two independent jobs: blocking foundation (clean install/build/runtime-key/auth trust boundary) and full-repository typecheck debt observability. The original implementation retained lint failure at job/workflow level without shell suppression or a fixed diagnostic allowance; its aggregate-failure policy is superseded by CD-48 below. Local results: install/build exit 0, tests 16/16 and 23/23, lint exit 2 / 445 diagnostics with exact accepted final-residual signature parity and zero new diagnostics. The authorized external temporary cache resolved the local install-cache failure without repository configuration or lock changes. `CURRENT_EXTERNAL_DEPENDENCY_BOUNDARY` excludes root npm test/Beta from foundation only, without test retirement. At that implementation snapshot, hosted execution, publication, merge, owner acceptance and required-check settings were pending. Subsequent publication and owner-reported runtime evidence are recorded in CD-48. At that implementation snapshot P0-U7 was NOT_STARTED; it still owns debt reassessment, with current activation recorded in CD-49. Production/test/package/config/script changes and deployment/release authority are outside this decision.
- **CD-46 — P0-U5 closure / P0-U6 activation**: P0-U5 Documentation Authority Convergence is **VERIFIED / CLOSED**. Its implementation was reviewed, publication completed as commit `752936fd8832b5dc1ddad25892004aa6f0b08400`, and GitHub merge `15529b85848a80322dea033e80903fd2fd1e294c` was independently verified as confirmed by the owner. At that closure/activation snapshot, [the canonical ledger](02_PHASE_LEDGER.md) activated P0-U6 Secret-Free GitHub CI Baseline as **NOT_STARTED / ACTIVE**; implementation was not claimed. CD-47 records the subsequent bounded implementation decision. At that closure/activation snapshot, the accepted sequence identified P0-U7 Phase 0 Closure & Freeze as next, NOT_STARTED; current activation is recorded in CD-49. This record does not reopen i18n debt or prior decisions.
- **CD-44 — Whole-App i18n convergence accepted**: Batches 1–4 are merged on current main. Repository-authoritative convergence and the product-language result are accepted for this reconstruction stage. Current dictionaries establish dynamic AR/EN/UR parity; no fixed dictionary size is a permanent contract.
- **CD-45 — Final residual i18n remediation accepted and merged**: Commit `09f3c0374c835560364d136430ab43560dae9a38` was merged by main `2b52180304ac02d71b506f16dc69722c94ba9b6f`. The accepted scope closed 205 audited positions (87 local + 118 message positions / 17 families), the PWA guard gap and the final parameter-free Outbox error-title defect. The diagnostic `offline.status.failed_2` retains both parameters; the title reuses `legacyMigration.status.failed_2`. These are bounded acceptance records, not authorization to reopen localization in P0-U5.
  - Final bounded verification reported 46/46 targeted tests and 10/10 conflict behavior checks, successful build, and lint exit 2 with the same 445-diagnostic baseline and no new changed-file diagnostics. These results were not rerun by this documentation unit.
  - Prior broader verification separately classified 9 baseline-existing assertion failures and 6 Firestore/proxy-dependent failures; this is not a clean root npm-test or Beta-wrapper PASS. Counts/signatures describe those runs, not permanent allowed failure totals.
  - Browser review is accepted sufficiently for the current reconstruction stage; it does not imply every visible label, role, workflow or device was manually verified, nor certify Phase 18/Beta 2 release readiness.
- **CD-43**: Root Tooling Authority & Contamination Guard:
  - npm + package-lock.json are canonical.
  - npm test = 48-suite root verification surface.
  - verify:beta2 directly adds 19 suites; those direct files are disjoint from the root 48.
  - Its full package wrapper runs lint, build and the shared reports test first; overall wrapper/root test overlap is one file. The earlier zero-overlap description applied only to the direct additional set. Counts are package observations, not frozen invariants.
  - current sequential npm test is accepted.
  - specialized test:* scripts remain valid.
  - vitest.config.ts remains unchanged.
  - no script archival without reachability/provenance proof.
  - npm run lint (tsc --noEmit) functions as full-repository typecheck/debt observability command.
  - npm run lint is currently non-blocking for P0-U4 because known debt spans inactive tests and future-domain production code.
  - lint failure must still be reported truthfully as exit 2 / recorded debt; failing full-repository tsc must not be called PASS.
  - active-test TypeScript debt (29 diagnostics across 5 files) remains explicitly unresolved and deferred to P0-U7 reassessment.
  - no tsconfig narrowing is authorized merely to obtain green output.
  - GitHub main remains tooling authority.
  - AI Studio automatic migration/config rewrites are non-authoritative.
  - tracked mutations during canonical verification are failures.
  - stable tooling must not be refactored without proven defect.
- **CD-42**: Product Contract & Real Product Acceptance Governance:
  - Automated green state is necessary but insufficient for product-facing closure.
  - Real product/browser/workflow verification is mandatory where applicable.
  - Historical defects and rejected paths must be reviewed before product-domain remediation.
  - Explicit user acceptance remains a closure gate.
  - P0-U3 remains valid as technical harness convergence, not product-wide functional validation.
  - Future features should be translated/tested/verified by construction.
  - Batch remediation is preferred over defect-by-defect micro-slices.
- **CD-41**: Active Runtime I18N Fixed Cardinality Invariant Retirement:
  - Historical 1128 cardinality retired across current active root verification.
  - 1129 explicitly NOT adopted as replacement.
  - Current locale dictionaries remain authority.
  - Dynamic non-zero trilingual parity is the durable general invariant.
  - Data cleanup uses dynamic pre/post preservation.
  - Block82 production logic corrected.
  - Active root suites 82B, 82D, 83A, 84A, 85A, 86F, 92A aligned.
  - Test cardinalities preserved.
  - No locale dictionary changes.
  - No reports changed.
  - Historical/non-root fixed-count references are not modified by this slice.
  - dataCleanupBlock82 taxonomy corrected to UNIT / PURE_LOGIC.
- **CD-01**: Express server mounted as Vite middleware in dev (`"dev": "tsx server.ts"`), bundled to `server-dist/server.cjs` via Esbuild for production (`"start": "node server-dist/server.cjs"`).
- **CD-02**: Firestore is the primary canonical persistent database for projects, rosters, dispatch trips, and outbox state.
- **CD-03**: 8-Layer Project Setup Workflow model is the accepted architectural standard for project onboarding and readiness evaluation.
- **CD-04**: React SPA on Vite with Tailwind CSS and RTL Arabic as the primary UX interface.
- **CD-05**: Local project override bridge in Project Setup Wizard converges away immediately upon canonical `globalProjects` subscription arrival.
- **CD-06**: P0-A0 Google AI Studio Artifact Bootstrap completed successfully as active planning surface.
- **CD-07**: `docs/reconstruction/` established as the repository-installed documentation authority.
- **CD-08**: P0-U1 governance baseline and semantic convergence (P0-U1R) were independently verified against GitHub commit `674c6a5a5cf1aa1680c43728aa67e1e0fd3170de`, and P0-U1 is CLOSED.
- **CD-09**: NPM established as canonical package manager with `package-lock.json` as canonical lockfile, restricting Node to `>=22 <23` and NPM to `>=10 <11`. All alternate lockfiles ignored.
- **CD-10**: P0-U2 Canonical Toolchain & Dependency Reproducibility was independently verified against commit `715345bba8688fa706fce1bac7add78a9c5e8a28`. Canonical contract: `npm@10.9.8`, Node `>=22 <23`, npm `>=10 <11`, `package-lock.json` canonical, alternate package-manager lockfiles prohibited. P0-U2 is CLOSED.
- **CD-11**: P0-U3 Test Taxonomy & Harness Architecture formally approved:
  - **Target Architecture**: Option C (Canonical Vitest for active unit/integration/server/UI/static tests; retain specialized/manual scripts only with explicit justification).
  - **Execution Strategy**: Option D (Staged phase-aligned convergence; no bulk migration of historical tests in Phase 0).
  - **Canonical Automated Harness**: Vitest is canonical for all active automated tests (`UNIT`, `INTEGRATION_MOCK`, `SERVER_CONTRACT`, `UI_DOM`, `STATIC_GOVERNANCE`).
  - **Specialized Harnesses**: Strictly isolated and require explicit justification.
  - **Historical Test Debt**: 125 historical test files are preserved and assigned to the appropriate owning reconstruction phase across Phase 0 through Phase 16, with Phase 0 restricted to genuine foundation/tooling/governance tests, not migrated in Phase 0.
  - **Scope Boundary**: Production TypeScript debt (23 diagnostics) remains strictly outside P0-U3 unless directly caused by test infrastructure; P0-U3 focuses exclusively on test harness convergence and test-side typing hygiene.
- **CD-12**: P0-U3 Block 57 Pilot Data Authority & Semantic Reconciliation (Option B):
  - `PILOT_REPAIRS_DATA` is preserved as an immutable historical repair snapshot.
  - `item.ar` represents `SOURCE_SNAPSHOT_AT_BLOCK_57`, not a forever-immutable constraint.
  - Historical snapshots do not override later accepted canonical locale values.
  - Current locale dictionaries (`src/locales/`) are current canonical translation authority.
  - `qualityPilotBlock57.test.ts` remains ACTIVE after semantic remediation (removing stale exact-equality check `ar === item.ar`, preserving presence, non-emptiness, and all 6 quality invariant guards).
  - Block 84A current canonical value for `navigation.labels.projects` (`إدارة المشاريع متعددة الأطراف`) is strictly preserved and not reverted.
  - `scripts/run-pilot-repair-block57.ts` remains unchanged as historical one-time migration evidence (not a current execution tool).
- **CD-13**: P0-U3 Block 83A UI Semantic Reconciliation (Option B):
  - `uiuxFixesBlock83A.test.ts` is retained as an active regression suite.
  - FIX-04 historical `text-slate-300` icon requirement is superseded.
  - Current `SystemToolsDrawer.tsx` icon colors may use canonical brand/domain semantic colors.
  - Current neutral badge invariant is: `bg-slate-800`, `text-slate-200`, `border-slate-700`.
  - Historical UI snapshots do not override later accepted production UI.
  - Production UI was not changed to satisfy the stale assertion.
- **CD-14**: P0-U3 Block 102 Contract Authority Split (Keep Groups 1–4, Defer Group 5):
  - Block 102 is a mixed historical/current suite.
  - Groups 1–4 remain current canonical unit guards (RBAC, multilingual normalization, entity resolution with carrier conflict, material blocking validation).
  - Group 5 historical commit/ID expectations are superseded by the server-authoritative canonical intake architecture.
  - Group 5 is removed from the Phase 0 active test rather than rewritten against production.
  - Canonical Driver/Truck creation authority remains `driverTruckIntakeServer.processSharedIntake(...)`.
  - `driverTruckIntakeP602A.test.ts` remains authoritative for server intake.
  - Current ID-generation systems remain unchanged.
  - Client commit/ID integration verification belongs to Phase 7 / Phase 8.
  - No production behavior was modified to satisfy Block 102.
- **CD-15**: Runtime I18N Discovery Authority Reconciliation:
  - Block 54C runtime audit report (`reports/i18n-block53-runtime-audit.json`) is immutable historical evidence.
  - Historical `componentCoverage.files` is not current source authority.
  - Current runtime translation discovery scans active repository runtime source (`src/App.tsx`, `src/components`, `src/hooks`).
  - Static `>=1100` referenced-key threshold is retired.
  - Referenced-key count is derived dynamically.
  - Runtime invariant is 100% resolution, parity, and parameter/token safety across all current call sites.
  - One live missing key was identified: `trips.labels.txt_default_pricing` in `src/components/TripEngineView.tsx`.
  - That key was added to AR/EN/UR dictionaries only.
  - No historical report was rewritten or regenerated.
  - No retired component was restored.
- **CD-16**: Block 55 Runtime Smoke Dynamic Contract Reconciliation:
  - Block 55 remains active as a runtime smoke and quality gate test suite.
  - All 7 smoke guards remain current in semantic intent.
  - Historical Block 54C source-file discovery (`reports/i18n-block53-runtime-audit.json`) is removed.
  - CD-15 current repository source scan remains authoritative discovery mechanism.
  - Static 1115 referenced-key count retired in favor of dynamic non-empty resolution.
  - Static 736 txt_* referenced-key count retired in favor of dynamic non-empty resolution.
  - No fixed replacement counts introduced.
  - Current key counts are dynamically derived.
  - Test 04 duplication with runtimeKeyAudit is intentionally retained as smoke-level redundancy.
  - Test 05 preserves unique RTL/LTR direction coverage.
  - 12-domain assertion refers only to the explicit representative smoke domain map, not total dictionary domain count (17).
  - Current 12 exception mappings and 13 domain metadata mappings remain canonical.
  - No production or locale changes were required.
- **CD-17**: Block 56 Translation Quality Gate Inversion & Complete Defect Family Remediation:
  - Block 56 historical quality tests expected defects to remain present.
  - C14A/C14B reconciled the full defect family.
  - 49 unique EN/UR defect keys were remediated coherently.
  - 27 historical fallback-identical defects were subset of same 49 keys.
  - EN mixed-language gate now requires zero Arabic contamination.
  - UR gate now requires zero confirmed Arabic fallback/mixed-frame defects.
  - fallback-identical prose gate requires zero unjustified fallback prose.
  - hybrid morphology gate requires zero current malformed hybrids.
  - historical Block 56 report remains immutable evidence.
  - wrong_D = 34 is historical only.
  - LanguageSwitcher production code unchanged.
  - I18nProvider unchanged.
  - AR locale unchanged.
  - no new test dependencies added.
- **CD-18**: Block 58 Quality Expansion Contract Reconciliation:
  - Block 58 remains an active regression suite.
  - Valid quality gates remain current.
  - Exact historical 100-entry batch size is historical evidence only; no fixed replacement count is introduced.
  - Block 57 report non-overlap check was historical batch bookkeeping and is retired.
  - Historical `entry.ar` snapshot does not override current canonical Arabic.
  - Current AR/EN/UR dictionaries remain locale authority.
  - EN contamination and hybrid morphology guards remain.
  - Urdu semantic Arabic-frame guard remains.
  - Protected technical token guard remains.
  - Interpolation parity guard remains.
  - I18N-QUALITY-17 now checks only dynamic cohort integrity (non-empty cohort, unique keys).
  - `scripts/run-quality-expansion-block58.ts` remains untouched historical migration evidence.
  - No locale remediation required.
  - No production changes required.
- **CD-19**: Block 59 Quality Expansion Contract Reconciliation:
  - Block 59 remains active as a current regression suite.
  - Historical 150-entry total is not a current product contract; no fixed replacement count is introduced.
  - Historical 100 Category C / 50 Category B allocation is not a current product contract.
  - Priority-domain whitelist was migration planning bookkeeping and is retired.
  - Historical `entry.ar` snapshot does not override current canonical Arabic (`src/locales/ar/index.ts`).
  - `oldEn` / `oldUr` inequality checks are migration evidence only and are retired (I18N-QUALITY-23 retired).
  - Category C fallback guard remains, using current canonical Arabic.
  - EN contamination / hybrid morphology guard remains.
  - UR semantic Arabic-frame / hybrid morphology guard remains.
  - Protected-token guard remains, based on current canonical Arabic.
  - Interpolation parity remains, based on current AR/EN/UR dictionaries.
  - Block 57/58 cross-batch collision report checks are retired.
  - Manifest environment corrected from FIREBASE_MOCK to FILESYSTEM.
  - `scripts/run-quality-expansion-block59.ts` and historical reports remain untouched.
  - No locale remediation required.
  - No production changes required.
- **CD-20**: Block 61 Translation Quality Contract Reconciliation:
  - Block 61 remains active as a current Vitest regression suite.
  - Block 61 report JSON (`reports/i18n-block61-p1-translation.json`) supplies cohort identity only (`repairedEntries`).
  - Current AR/EN/UR dictionaries (`src/locales/{ar,en,ur}/index.ts`) are the sole translation authority.
  - Historical 100-entry batch total is migration evidence only; no fixed replacement count is introduced.
  - Historical 70 Category B / 30 Category C allocation is migration evidence and historical provenance only.
  - `reviewStatus` is not an active Block 61 locale-test invariant and is completely retired from the test suite.
  - Removal of `reviewStatus` from Block 61 does NOT retire or reclassify Block 60 human-review governance.
  - Historical `[Verified]` assertion is retired.
  - Heuristic `>= 2` length check is retired; `I18N-QUALITY-30` is retired entirely.
  - Defined, string, trimmed, and non-empty checks remain active.
  - EN fallback protection applies across the full cohort: `enVal !== dictionaries.ar[entry.key]` and `enVal !== entry.key`.
  - UR fallback protection applies across the full cohort: `urVal !== dictionaries.ar[entry.key]` and `urVal !== entry.key`.
  - EN and UR cannot resolve to the key identifier.
  - Protected technical tokens (exact baseline set of 27 tokens) preservation uses canonical AR (`dictionaries.ar[entry.key]`).
  - Parameter interpolation parity across AR, EN, and UR uses canonical AR.
  - Historical cross-report collision checks against Block 57, 58, 59 reports are retired as historical migration batch bookkeeping.
  - Cross-check against human review queue in `reports/i18n-block60-quality-plan.json` is retired as historical migration planning bookkeeping.
  - Dynamic cohort integrity gate preserves non-empty cohort, internal key uniqueness, and dictionary entry existence across AR, EN, and UR.
  - `scripts/execute-block61-translation.ts` and historical reports remain untouched.
  - Manifest classification set to UNIT, environment FILESYSTEM, runner VITEST, disposition KEEP_VITEST.
  - No locale remediation required.
  - No production changes required.
- **CD-21**: Block 62 Translation Quality Contract Reconciliation:
  - Block 62 remains active as a current Vitest regression suite.
  - Block 62 report JSON (`reports/i18n-block62-quality-expansion.json`) supplies cohort identity only (`repairedEntries`).
  - Current AR/EN/UR dictionaries (`src/locales/{ar,en,ur}/index.ts`) are the sole translation authority.
  - Historical 150-entry batch total is migration evidence only; no fixed replacement count is introduced.
  - Historical 100 Category B / 50 Category C allocation is migration evidence and historical provenance only.
  - `reviewStatus` is not an active Block 62 locale-test invariant and is completely retired from the test suite; `I18N-QUALITY-38` is retired entirely.
  - Removal of `reviewStatus` from Block 62 does NOT retire or reclassify Block 60 human-review governance.
  - Historical `[Verified]` assertion is retired.
  - Defined, string, trimmed, and non-empty checks remain active.
  - EN fallback protection applies across the full cohort: `enVal !== dictionaries.ar[entry.key]` and `enVal !== entry.key`.
  - UR fallback protection applies across the full cohort: `urVal !== dictionaries.ar[entry.key]` and `urVal !== entry.key`.
  - EN and UR cannot resolve to the key identifier.
  - Protected technical tokens (exact baseline set of 27 tokens) preservation uses canonical AR (`dictionaries.ar[entry.key]`).
  - Parameter interpolation parity across AR, EN, and UR uses canonical AR.
  - Historical cross-report collision checks against Block 57, 58, 59, 61 reports are retired as historical migration batch bookkeeping.
  - Cross-check against human review queue in `reports/i18n-block60-quality-plan.json` is retired as historical migration planning bookkeeping.
  - Dynamic cohort integrity gate preserves non-empty cohort, internal key uniqueness, and dictionary entry existence across AR, EN, and UR.
  - `scripts/execute-block62-translation.ts` and historical reports remain untouched.
  - Manifest classification set to UNIT, environment FILESYSTEM, runner VITEST, disposition KEEP_VITEST.
  - No locale remediation required.
  - No production changes required.
- **CD-22**: Block 63 Translation Quality Contract Reconciliation:
  - Block 63 remains active as a current Vitest regression suite.
  - Block 63 report JSON (`reports/i18n-block63-quality-expansion.json`) supplies cohort identity only (`repairedEntries`).
  - Current AR/EN/UR dictionaries (`src/locales/{ar,en,ur}/index.ts`) are the sole translation authority.
  - Historical `FIREBASE_MOCK` classification was incorrect; environment is corrected to `FILESYSTEM`.
  - Historical 150-entry batch total is migration evidence only; no fixed replacement count is introduced.
  - Historical 100 Category B / 50 Category C allocation is migration evidence and historical provenance only.
  - `reviewStatus` is not an active Block 63 locale-test invariant and is completely retired from the test suite; `I18N-QUALITY-46` is retired entirely.
  - Removal of `reviewStatus` from Block 63 does NOT retire or reclassify Block 60 human-review governance.
  - Historical `[Verified]` assertion is retired.
  - Historical snapshot `entry.ar` is retired as token and fallback authority.
  - Defined, string, trimmed, and non-empty checks remain active.
  - EN fallback protection applies across the full cohort: `enVal !== dictionaries.ar[entry.key]` and `enVal !== entry.key`.
  - UR fallback protection applies across the full cohort: `urVal !== entry.key` and (except for audited legitimate identical match `other.labels.delete_2`) `urVal !== dictionaries.ar[entry.key]`.
  - Zero unintended Arabic in EN gate retained.
  - Block 63-specific UR blacklist (30 phrases) and hybrid morphology gates retained.
  - Protected technical tokens (exact baseline set of 30 tokens) preservation uses canonical AR (`dictionaries.ar[entry.key]`).
  - Parameter interpolation parity across AR, EN, and UR uses canonical AR.
  - Historical cross-report collision checks against Blocks 57, 58, 59, 61, 62 reports are retired as historical migration batch bookkeeping.
  - Cross-check against human review queue in `reports/i18n-block60-quality-plan.json` is retired as historical migration planning bookkeeping.
  - Dynamic cohort integrity gate preserves non-empty cohort, internal key uniqueness, and dictionary entry existence across AR, EN, and UR.
  - `scripts/execute-block63-translation.ts` and historical reports remain untouched.
  - Manifest classification set to UNIT, environment FILESYSTEM, runner VITEST, disposition KEEP_VITEST.
  - No locale remediation required.
  - No production changes required.
- **CD-23**: Block 64 Translation Quality Contract Reconciliation:
  - Block 64 remains active as a current Vitest regression suite.
  - Block 64 report JSON (`reports/i18n-block64-quality-expansion.json`) supplies cohort identity only (`repairedEntries`).
  - Current AR/EN/UR dictionaries (`src/locales/{ar,en,ur}/index.ts`) are the sole translation authority.
  - Historical `FIREBASE_MOCK` classification was incorrect; environment is corrected to `FILESYSTEM`.
  - Historical 150-entry batch total is migration evidence only; no fixed replacement count is introduced.
  - Historical 100 Category B / 50 Category C allocation is migration evidence and historical provenance only.
  - `reviewStatus` is not an active Block 64 locale-test invariant and is completely retired from the test suite; `I18N-QUALITY-54` is retired entirely.
  - Removal of `reviewStatus` from Block 64 does NOT retire or reclassify Block 60 human-review governance.
  - Historical `[Verified]` assertion is retired.
  - Historical snapshot `entry.ar` is retired as token and fallback authority.
  - Defined, string, trimmed, and non-empty checks remain active.
  - EN fallback protection applies across the full cohort: `enVal !== dictionaries.ar[entry.key]` and `enVal !== entry.key`.
  - UR fallback protection applies across the full cohort: `urVal !== entry.key` and (except for audited legitimate identical match `other.labels.delete_2`) `urVal !== dictionaries.ar[entry.key]`.
  - Zero unintended Arabic in EN gate retained.
  - Block 64-specific UR blacklist (30 phrases) and hybrid morphology gates retained.
  - Protected technical tokens (exact baseline set of 31 tokens, including `M3`, `Sheets`, `Drive`, `Firestore`) preservation uses canonical AR (`dictionaries.ar[entry.key]`) with boundary-aware matching.
  - Parameter interpolation parity across AR, EN, and UR uses canonical AR.
  - Historical cross-report collision checks against Blocks 57, 58, 59, 61, 62, 63 reports are retired as historical migration batch bookkeeping.
  - Cross-check against human review queue in `reports/i18n-block60-quality-plan.json` is retired as historical migration planning bookkeeping.
  - Dynamic cohort integrity gate preserves non-empty cohort, internal key uniqueness, and dictionary entry existence across AR, EN, and UR.
  - `scripts/execute-block64-translation.ts` and historical reports remain untouched.
  - Manifest classification set to UNIT, environment FILESYSTEM, runner VITEST, disposition KEEP_VITEST.
  - No locale remediation required.
  - No production changes required.
- **CD-24**: Block 65 Translation Quality Contract Reconciliation:
  - Block 65 remains active as a current Vitest regression suite.
  - Block 65 report JSON (`reports/i18n-block65-quality-expansion.json`) supplies cohort identity only (`repairedEntries`).
  - Current AR/EN/UR dictionaries (`src/locales/{ar,en,ur}/index.ts`) are the sole translation authority.
  - Taxonomy is corrected from `STATIC_GOVERNANCE` to `UNIT`.
  - Environment is corrected from `FIREBASE_MOCK` to `FILESYSTEM`.
  - Historical 150-entry batch total is migration evidence only; no fixed replacement count is introduced.
  - Historical 112 Category B / 38 Category C allocation is migration evidence and historical provenance only.
  - `reviewStatus` is not an active Block 65 locale-test invariant and is completely retired from the test suite; `I18N-QUALITY-62` is retired entirely.
  - Removal of `reviewStatus` from Block 65 does NOT retire or reclassify Block 60 human-review governance.
  - Historical `[Verified]` assertion is retired.
  - Historical snapshot `entry.ar` is retired as token and fallback authority.
  - Defined, string, trimmed, and non-empty checks remain active.
  - EN fallback protection applies across the full cohort: `enVal !== dictionaries.ar[entry.key]` and `enVal !== entry.key`.
  - UR fallback protection applies across the full cohort: `urVal !== dictionaries.ar[entry.key]` and `urVal !== entry.key`.
  - Zero unintended Arabic in EN gate retained.
  - Block 65-specific UR blacklist (15 phrases) and hybrid morphology gates retained.
  - Protected technical tokens (exact baseline set of 26 tokens: `tripId`, `Google Drive`, `Google Sheets`, `Firestore`, `Source of Truth`, `SSOT`, `Zero-Trust ABAC`, `RBAC`, `FSM`, `LM-01`, `LM-50`, `LEGACY_UNRESOLVED`, `Audit Log`, `FUZZY`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `BLOCKING`, `OPEN`, `REJECTED`, `REVIEW`, `RESOLVED`, `KG`, `TON`) preservation uses canonical AR (`dictionaries.ar[entry.key]`) with boundary-aware matching.
  - Parameter interpolation parity across AR, EN, and UR uses canonical AR.
  - Historical cross-report collision checks against Blocks 57, 58, 59, 61, 62, 63, 64 reports are retired as historical migration batch bookkeeping.
  - Cross-check against human review queue in `reports/i18n-block60-quality-plan.json` is retired as historical migration planning bookkeeping.
  - Dynamic cohort integrity gate preserves non-empty cohort, internal key uniqueness, and dictionary entry existence across AR, EN, and UR.
  - `scripts/execute-block65-translation.ts` and historical reports remain untouched.
  - Manifest classification set to UNIT, environment FILESYSTEM, runner VITEST, disposition KEEP_VITEST.
  - No locale remediation required.
  - No production changes required.
- **CD-25**: Block 66 Translation Quality Contract Reconciliation:
  - Block 66 remains active as a current Vitest regression suite.
  - Block 66 report JSON (`reports/i18n-block66-final-cleanup.json`) supplies cohort identity only (`repairedEntries`).
  - Current AR/EN/UR dictionaries (`src/locales/{ar,en,ur}/index.ts`) are the sole translation authority.
  - Taxonomy is retained as `UNIT`.
  - Environment is retained as `FILESYSTEM`.
  - Historical 16-entry batch total is migration evidence only; no fixed replacement count is introduced.
  - Historical Category B legacyMigration defect cleanup allocation is migration evidence and historical provenance only.
  - Historical `[Verified]` assertion and status check (`I18N-QUALITY-70`) are retired.
  - Historical snapshot `entry.ar` is retired as token and fallback authority.
  - Defined, string, trimmed, and non-empty checks remain active.
  - EN fallback protection applies across the full cohort: `enVal !== dictionaries.ar[entry.key]` and `enVal !== entry.key`.
  - UR fallback protection applies across the full cohort: `urVal !== dictionaries.ar[entry.key]` and `urVal !== entry.key`.
  - Zero unintended Arabic in EN gate retained (`I18N-QUALITY-68`).
  - Block 66-specific UR blacklist (15 corrupt Arabic phrases) and hybrid morphology gates retained (`I18N-QUALITY-69`).
  - Protected technical tokens (exact baseline set of 2 tokens: `Admin`, `Failed`) preservation uses canonical AR (`dictionaries.ar[entry.key]`) with boundary-aware matching (`I18N-QUALITY-71`).
  - Parameter interpolation parity across AR, EN, and UR uses canonical AR (`I18N-QUALITY-72`).
  - Historical cross-report collision checks against Blocks 57, 58, 59, 61, 62, 63, 64, 65 reports are retired as historical migration batch bookkeeping.
  - Historical queue status before/after delta check (52 -> 36 defects) is retired as historical migration bookkeeping.
  - Dynamic cohort integrity gate preserves non-empty cohort, internal key uniqueness, and dictionary entry existence across AR, EN, and UR (`I18N-QUALITY-73`).
  - Historical reports remain untouched.
  - Manifest classification set to UNIT, environment FILESYSTEM, runner VITEST, disposition KEEP_VITEST.
  - No locale remediation required.
  - No production changes required.
- **CD-26**: Block 67 Human-Review Governance Contract Reconciliation:
  - Block 67 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - Filesystem environment remains correct.
  - `scripts/block67-items-data.json` remains the canonical fixed 33-item governance dataset for Block 67.
  - The 33-item queue and 17 bilingual-source classification remain intentional governance invariants.
  - Governance schema, interpolation protection, and audit-document integrity remain active.
  - Reports used by TEST-08 remain governance evidence/contracts rather than ordinary translation cohort fixtures.
  - Obsolete global Arabic dictionary count `1128` retired and is NOT replaced with `1129`.
  - Six canonical Arabic governance spot-checks remain.
  - Historical corrupted-fixture invariance TEST-06 retired.
  - Pre-application zero-modification TEST-07 and Block70 skip/guard dependency retired.
  - Block 67 does not own Block 68 decision lifecycle, Block 69 approval state, Block 69A reconciliation, or Block 70 live application.
  - Zero locale changes.
  - Zero report regeneration.
- **CD-27**: Block 68 Human-Review Decision Contract Reconciliation:
  - Block 68 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - `reports/i18n-human-review-decisions.json` and `.md` remain active decision-governance artifacts.
  - Exact 33-item decision dossier remains intentional.
  - REVIEW_REQUIRED / PENDING state remains valid as Block 68 formulation-stage artifact semantics.
  - Four-part audit separation remains active.
  - Recommendation distribution remains: 29 REVISE / 2 FIX_SOURCE / 1 APPROVE / 1 KEEP_EXCEPTION.
  - Proposal quality, protected-token integrity, and interpolation protection remain active.
  - Historical TEST-07 pre-application zero-modification contract retired.
  - Obsolete exact locale key count 1128 retired and NOT replaced with 1129.
  - Corrupted fixture invariance retired.
  - Block 70 skip/guard dependency retired from Block 68.
  - Block 68 does not own Block 69 approval, Block 69A reconciliation, or Block 70 live application.
  - Zero locale changes.
  - Zero report regeneration.
- **CD-28**: Block 69 Human-Approval Governance Contract Reconciliation:
  - Block 69 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - `reports/i18n-human-approved-decisions.json` remains the authoritative approval ledger.
  - `reports/i18n-human-review-decisions.json` remains the upstream Block 68 traceability authority.
  - Exact 33-item approval ledger remains intentional.
  - Approved decision distribution remains 29 REVISE / 2 FIX_SOURCE / 1 APPROVE / 1 KEEP_EXCEPTION.
  - REVIEWED / APPROVED / HUMAN_REVIEW_CHAT remains active artifact-state governance.
  - `appliedToCodebase: false` remains valid as immutable Block 69 approval-stage artifact semantics.
  - Critical approved-content checks remain active.
  - Protected-token and interpolation integrity remain active.
  - Deterministic SHA-256 checksum verification remains active.
  - Historical TEST-07 live-code zero-application contract retired.
  - Obsolete locale key-count 1128 assertions retired and NOT replaced with 1129.
  - Corrupted fixture invariance retired.
  - Block 70 skip/guard dependency retired from Block 69.
  - Block 69 does not own live locale application.
  - Zero locale changes.
  - Zero report regeneration.
- **CD-29**: Block 69A Human-Approval Reconciliation Contract:
  - Block 69A remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - `reports/i18n-human-approved-decisions-reconciled.json` remains authoritative reconciliation contract.
  - Reconciled markdown remains governance documentation artifact.
  - Exact 33-item reconciliation set remains intentional.
  - Exact decision distribution remains active.
  - Exact EN/UR wording across all 33 records remains active.
  - FIX_SOURCE transitions remain active.
  - KEEP_EXCEPTION / APPROVE handler semantics remain active.
  - Protected-token and interpolation integrity remain active.
  - Block 68 recommendation/classification traceability remains active.
  - REVIEWED / APPROVED / HUMAN_REVIEW_CHAT remains reconciliation-stage artifact governance.
  - `appliedToCodebase: false` remains valid as immutable reconciliation-stage artifact semantics.
  - Deterministic SHA-256 checksum remains active.
  - Historical TEST-09 live-code freeze contract retired.
  - Obsolete 1128 locale counts retired and NOT replaced with 1129.
  - Block 70 skip/guard dependency retired.
  - Block 69A does not own live locale application.
  - Zero locale changes.
  - Zero report regeneration.
  - Zero production changes.
- **CD-30**: Block 70 Human-Review Application Governance Contract Reconciliation:
  - Block 70 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - `reports/i18n-human-approved-decisions-reconciled.json` and `reports/i18n-block70-corrected-application.json` remain active application-governance artifacts.
  - Authoritative 33-item ledger record count and 32 changed unique keys (with 1 KEEP_EXCEPTION unchanged) verified.
  - Decision breakdowns verified (29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION).
  - Canonical Arabic integrity verified (exactly 2 keys changed: `loading.labels.txt_73e4a3`, `projects.labels.settings`; zero others touched).
  - English and Urdu locale updates verified (exactly 32 keys changed each).
  - Unauthorized pricing.* keys protection and 6 mandatory regression guard mappings verified.
  - Protected-token invariance verified across EN and UR.
  - Interpolation parity (`${pricingResolutionResult.message}`) verified across AR, EN, and UR.
  - FIX_SOURCE Arabic transitions verified.
  - Full content parity verified (all 33 items in live EN/UR match reconciled ledger decisions).
  - Anti-defect quality verified (strictly 0 Arabic Unicode glyphs across all 32 updated English entries).
  - Historical assertions retired (manifest integrity integrated into TEST-03; obsolete live filesystem / git dirty assertions retired).
  - Zero locale changes.
  - Zero report regeneration.
  - Zero production changes.
- **CD-31**: Block 72 UI/UX RTL Audit Contract Reconciliation:
  - Block 72 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - RTL/LTR mapping contracts remain active (`LOCALE_DIRECTIONS`, `directionOf`, `isRTL`).
  - Audit JSON (`reports/uiux-rtl-audit-block72.json`) and Markdown (`reports/uiux-rtl-audit-block72.md`) remain active static-governance artifacts.
  - Finding severity classification (P0, P1, P2, P3) and schema integrity remain active.
  - Severity summary reconciliation remains active.
  - Root App direction binding (`App.tsx`) remains active.
  - Block 71 baseline/artifact validation (`reports/i18n-freeze-gate.json`) remains active.
  - Historical fixed locale-count tests B72-T01/T02/T03 retired.
  - Obsolete 1128 locale freeze retired and NOT replaced with 1129.
  - Block 72 does not freeze future locale expansion.
  - Zero locale changes.
  - Zero report regeneration.
  - Zero production changes.
- **CD-32**: Block 73 P1 UI/UX Governance Contract Reconciliation:
  - Block 73 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - OutboxDrawer RTL/LTR directional contracts remain active.
  - LoadingStation directional arrow (`rtl:rotate-180`) and navigation-handler contracts remain active.
  - Translation-drift integrity remains active.
  - LanguageSwitcher audit-integrity contract remains active (`AUDIT-72-03`).
  - Block 73 JSON/Markdown remediation artifacts remain active governance evidence.
  - Brittle ProjectSetupWizard source-string assertions B73-T08/T10/T12/T14 retired without replacement markup snapshots.
  - Fixed locale-count tests B73-T15/T16/T17 retired; obsolete 1128 counts retired without replacement.
  - Block 73 does not freeze future locale expansion.
  - Zero production/UI changes.
  - Zero locale changes.
  - Zero report regeneration.
- **CD-33**: Block 74 P2 UI/UX Governance Contract Reconciliation:
  - Block 74 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - Environment corrected from FIREBASE_MOCK to FILESYSTEM (zero Firebase imports/mocks/APIs exist).
  - LanguageSwitcher directionality contracts remain active.
  - Search input padding/icon placement contracts remain active.
  - Table alignment/divider contracts remain active.
  - 44px mobile touch-target contracts remain active.
  - Translation-drift integrity remains active.
  - P3 deferral governance remains active.
  - Block 74 JSON/Markdown remediation artifacts remain active governance evidence.
  - Brittle App.tsx source-string assertions B74-T11/T12 retired without replacement markup snapshots.
  - Fixed locale-count tests B74-T15/T16/T17 retired; obsolete 1128 counts retired without replacement.
  - Zero production/UI changes.
  - Zero Firebase/service changes.
  - Zero locale changes.
  - Zero report regeneration.
- **CD-34**: Block 75 P3 UI/UX Governance Contract Reconciliation:
  - Block 75 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated to Vitest.
  - FILESYSTEM environment remains correct.
  - ImportCenterView retirement contracts remain active.
  - ReportsEngineView direction-safe logical margin (`ms-1`) contract remains active.
  - LoadingStation responsive dual-mode stepper contracts remain active.
  - Translation-drift integrity remains active.
  - Block 75 JSON/Markdown remediation artifacts remain active governance evidence.
  - Brittle App.tsx icon source-string assertion B75-T05 retired without replacement markup snapshots.
  - Fixed locale-count tests B75-T11/T12/T13 retired; obsolete 1128 counts retired without replacement.
  - All previously identified Block75 test debt resolved inside C31.
  - Manifest debt status changed from HAS_TEST_DEBT to CLEAN.
  - Zero production/UI changes.
  - Zero locale changes.
  - Zero report regeneration.

- **CD-35**: Block 76 Final Product UI Architecture Governance Contract Reconciliation:
  - Block 76 remains active STATIC_GOVERNANCE coverage.
  - Runner migrated from TSX_CUSTOM to VITEST (`test:uiux-arch-76`).
  - FILESYSTEM environment remains correct.
  - Final Product UI Architecture specification JSON (`reports/final-ui-architecture-block76.json`) and Markdown (`reports/final-ui-architecture-block76.md`) remain active static-governance artifacts.
  - Four major interface areas (Field Operations, Projects, Field Reports, Central Dashboard) fully specified.
  - Existing system authority and role-based experience rules strictly preserved (zero unauthorized roles invented).
  - Navigation model and responsive strategy defined.
  - Historical fixed locale-count governance is retired; obsolete 1128/1129 counts are retired without replacement.
  - Block 76 does not freeze future locale dictionary cardinality.
  - Durable locale integrity/parity checks remain only where independent of exact total count (`B76-T16` translation key drift check).
  - Explicit confirmation that no redesigned interfaces were implemented in Block 76 (specification only).
  - Manifest row updated from TSX_CUSTOM to VITEST and KEEP_VITEST.
  - Zero production/UI changes.
  - Zero locale changes.
  - Zero report regeneration.

- **CD-36 — Operational Surface & Navigation Harness Convergence Batch**:
  - Blocks 77, 80, and 81 converged as one batch.
  - All three migrated from TSX_CUSTOM to native Vitest.
  - Block77 remains STATIC_GOVERNANCE / FILESYSTEM.
  - Block80 remains UNIT / PURE_LOGIC.
  - Block81 remains SERVER_CONTRACT and environment corrected from FIREBASE_MOCK to PURE_LOGIC.
  - Fixed locale-count assertions retired across all three.
  - 1128 was NOT replaced with 1129.
  - Locale parity/drift checks retained independent of cardinality.
  - Block77 fixtures aligned with current project/truck/trip prerequisites.
  - Block81 expectations aligned with current authorization/navigation contracts.
  - Reports Engine tests use explicit current trip input.
  - Zero production changes.
  - Zero locale changes.
  - Zero report regeneration.
  - All three CLEAN.

---

- **CD-37 — Authentication & Project Workspace Harness Convergence Batch**:
   - all four suites migrated from TSX_CUSTOM to native Vitest
   - 86B retains SERVER_CONTRACT / SERVER_CONTEXT
   - Auth Gateway 87 retains SERVER_CONTRACT / PURE_LOGIC
   - Project Centric 87 retains SERVER_CONTRACT / PURE_LOGIC
   - Sidebar 88 retains UNIT and environment corrected FIREBASE_MOCK → PURE_LOGIC
   - TC-86B-17 retired
   - [I18N-01] retired
   - fixed locale cardinality retired without replacement
   - 1128 was NOT replaced by 1129
   - security/fail-closed behavior preserved
   - project-centric fixture/expectation drift aligned with current service contracts
   - zero production changes
   - zero locale changes
   - zero report regeneration
   - all four CLEAN

---

- **CD-38 — Security Trust & Offline Trip Numbering Harness Convergence Batch**:
   - both suites (`secureTripNumberingOffline89B.test.ts` and `serverAuthenticationTrustBoundary.test.ts`) migrated from TSX_CUSTOM to native Vitest
   - 19 tests in 89B and 23 tests in Auth Trust
   - zero custom runner
   - zero `process.exit`
   - zero report writes
   - zero production changes
   - zero locale changes
   - both CLEAN
   - Block89B JSON and Markdown reports (`reports/secure-trip-numbering-offline-block89B.json` and `reports/secure-trip-numbering-offline-block89B.md`) retired and deleted intentionally as generated non-authoritative outputs with zero current consumers

---

- **CD-39 — I18N Legacy Test Suite Vitest Convergence Batch**:
   - six legacy i18n TSX_CUSTOM suites (`i18nCatalog.test.ts`, `i18nCodemod.test.ts`, `i18nGenerationBlock54b.test.ts`, `i18nRecoveryBlock54a.test.ts`, `i18nTranslationCatalog.test.ts`, `i18nTranslationGeneration.test.ts`) migrated together to native Vitest
   - total active suite cardinality = 89 tests
   - i18nCatalog and i18nCodemod reclassified to UNIT / PURE_LOGIC; remaining four classified UNIT / FILESYSTEM
   - current locale dictionaries remain canonical live translation authority
   - reports/i18n-translation-catalog.json remains active tooling/generated input, not live translation authority
   - tracked report artifacts must not be mutated by ordinary Vitest execution
   - repository report-generation side effects isolated using test-only temp/mock boundaries
   - governance reports used by Block54A remain read-only fixtures
   - historical fixed generation/cardinality assertions retired where snapshot-only
   - durable key-generation, AST safety, interpolation, source-preservation, protected-token, semantic structure, deterministic and idempotency contracts retained
   - zero production code, locale dictionaries, or tracked report artifacts changed

---

- **CD-40 — Excel/CSV Import Harness Convergence**:
   - `excelCsvImport.test.ts` migrated from `TSX_CUSTOM` to native Vitest
   - 11 current semantic contracts preserved (`TC-01` through `TC-11`)
   - no tests retired
   - no cardinality drift (exactly 11 tests)
   - classification corrected from `UNIT / FIREBASE_MOCK` to `UNIT / PURE_LOGIC`
   - suite requires no Firebase, network, or filesystem runtime
   - Excel/CSV fixtures remain entirely in memory
   - current import pipeline behavior remains authoritative
   - no production code changed
   - no report artifacts changed
   - this migration eliminates the final active `TSX_CUSTOM` row from the active test manifest (TSX_CUSTOM count = 0)
   - Historical CD-40-time status: P0-U3 was still open pending final convergence. This was superseded by its verified/closed record in 02_PHASE_LEDGER.md; it is not current status.

---

## OPEN_DECISIONS

Current unresolved decisions are owner acceptance of local P8-B3 and later separately authorized product/release work. P8-B4 has not started. The current disposition table above supersedes former Phase-1-first-unit and Phase-3-first-audit continuation directions.

### Historical open-decision snapshot — before completed Phase 1 closure

- The accepted P0-U7 audit found no unresolved foundation contract decision blocking Phase 0 closure. The owner has now selected P1-U1 (CD-51); its contract-definition deliverables are now documented (CD-52), and explicit owner acceptance has PASSED; the owner has now defined P1-U2 (CD-53), and its bounded implementation (CD-54) is owner accepted and VERIFIED / CLOSED by the post-merge closure record. P1-U3 (CD-55/CD-56) is now owner accepted and VERIFIED / CLOSED under CD-57. The completed Phase 1 closure audit found five remaining type-authority families, so Phase 1 is not ready for closure; P1-U4 is now VERIFIED / CLOSED after owner review and PR #19 merge (CD-59). P1-U5 is now VERIFIED / CLOSED after owner review and PR #21 merge (CD-61). P1-U6 is now VERIFIED / CLOSED after owner review and PR #23 merge (CD-63). P1-U7 is now VERIFIED / CLOSED after owner review and PR #25 merge (CD-65). The accepted User Role semantic audit assigns only the two full-vocabulary UserEntity fields to P1-U8, NOT_STARTED / ACTIVE. Wizard context subset, validator accepted subset and server AuthenticatedUser context are explicitly deferred to their Phase 3 reviews, not unresolved P1-U8 work. After P1-U8 implementation, merge and verification, PHASE_1_CLOSURE_AUDIT must validate those deferrals and absence of further safe Phase 1 seams; closure is not automatic. Broader convergence still requires a separate bounded decision. Future distribution/licensing/provider choices remain undecided under the future proposal and do not authorize implementation.

---

## BLOCKING_DEBT
- The owner-accepted P0-U7 audit records MUST_FIX_BEFORE_PHASE_0_FREEZE = 0 and UNKNOWN diagnostics/failures = 0. No remaining foundation blocker prevents the approved governance freeze. This is not a debt-free product or clean full-test claim; the unresolved exit debt below remains observable and phase-owned.

---

### Historical P1-U1 identity/type boundary observations (original evidence; current dispositions above)

The [P1_U1_CANONICAL_DOMAIN_AUTHORITY_AND_IDENTITY_CONTRACT.md](P1_U1_CANONICAL_DOMAIN_AUTHORITY_AND_IDENTITY_CONTRACT.md) documents current string-only ID separation, cast-based reads, legacy/global coexistence, natural-lookup declaration/writer drift, partial policy views and duplicate temporal interval declarations. These remain known gaps, not UNKNOWN authority or silent remediation. Section 11 preserves the original PureAssignment/PureAllocation CANDIDATE_NEXT_IMPLEMENTATION_SEAM recommendation from the P1-U1 closure snapshot. CD-53 assigned that bounded seam to P1-U2. Its two duplicate interval type declarations are now converged through canonical aliases (CD-54), now VERIFIED / CLOSED; runtime enforcement, natural lookup, legacy/global coexistence and other documented gaps remain unresolved. This is not broad debt remediation or contract acceptance. Phase 1 owns type/boundary contracts; Phase 2 persistence, Phase 3 auth, Phase 4 lifecycle, Phase 5 master/relationship behavior and Phases 7–11 their Import/Pricing/Trip/offline semantics remain unchanged. Existing typecheck and domain debt below is not rewritten or waived.

## TYPECHECK_BASELINE_DEBT
- **Status**: RECORDED / UNRESOLVED
- **Historical Recorded Baseline**:
  - Total diagnostics: 420
  - src/tests diagnostics: 397
  - Production source diagnostics: 23
  - Classification: REPRODUCIBLE_PREEXISTING_OR_UNVERIFIED_DEBT
  - P0-U2 toolchain blocker: NO
- **Recorded P0-U4 Typecheck Observation (historical evidence)**:
  - Recorded full-repository tsc result: exit 2; the final residual verification also observed 445 diagnostics, but P0-U5 does not rerun typecheck
  - Total diagnostics: 445
  - Active manifest tests: 29 diagnostics (across 5 active manifest test suites: Block 76 [14], i18n Translation Catalog [1], i18n Translation Generation [2], Block 87 Project-Centric [5], Block 86F Date UX [7]; all 5 suites pass cleanly under native Vitest execution)
  - Historical / non-active tests: 393 diagnostics (across 32 historical, retired, or unlisted test files in `src/tests/` due to repository-wide implicit inclusion from `tsconfig.json` lacking explicit include/exclude)
  - Production source: 23 diagnostics (routed to owning future phases: 20 in Phase 7/8 Smart Import, 3 in Phase 10 Trip/Operations)
  - Tooling / config / scripts: 0 diagnostics
  - Superseding Reconciliation Statement (historical P0-U5 record): The then-current 445 observation is NOT identical to the historical 420 baseline. Therefore any previous statement claiming exact equality with the 420 baseline is superseded by this reconciliation.

### Principal Debt Families:
1. **Stale Smart Import / entity-resolution test fixtures**: Object shape drift in test mocks where `ImportEntityResolutionInfo` expanded to include mandatory fields (`originalValue`, `confidence`, `isExact`, `riskLevel`).
2. **AuthUserContext / PipelineContext contract drift**: Interface evolution requiring `displayName`, `assignedProjectIds` on user context and `userId` on pipeline context, while removing `relContext`.
3. **Retired navigation-tab test drift**: Tests comparing or assigning `NavTabId` to retired tabs (`TRIP_ENGINE`, `EXCEPTION_ENGINE`, `IMPORT_CENTER`).
4. **Status / enum literal drift**: Mismatched string literals passed to enum-like unions (e.g. `REVIEW_REQUIRED` vs `ImportCommitStatus`, `FIELD_SUPERVISOR` vs `UserRole`).
5. **Missing helper / icon imports**: Missing imports in UI components and tests (e.g. `ShieldAlert` from Lucide, `createEmptyImportBatch`).
6. **Stale internal type import location**: Imports attempting to resolve types like `AuthUserContext` from `../types/entities` instead of canonical auth definitions.
7. **Date / String operational typing mismatch**: Operational service methods passing string ISO timestamps where `Date | Timestamp` is required.
8. **Vitest global test-environment typing**: Calling `expect` or `test` in tests without explicit vitest import or ambient globals definition.

### Resolution & Governance Routing Policy:
- **Historical / Non-Active Test Debt (393 diagnostics)**: Preserved and isolated; tsconfig narrowing or ad-hoc file modification is prohibited in Phase 0.
- **Active Manifest Test Debt (29 diagnostics)**: `ACTIVE_TEST_TYPECHECK_DEBT` was reassessed by P0-U7; accepted non-blocking phase routing is recorded below. P0-U3 remains valid as Test Taxonomy & Harness Convergence and is NOT reopened.
- **Production Contract Errors (23 diagnostics)**: Must NOT be patched ad-hoc; routed strictly to owning future phases (Phase 7/8 for Smart Import & Entity Resolution [20 diagnostics], Phase 10 for Trip Service [3 diagnostics]).
- **Historical P0-U7 Mandatory Reassessment Obligations (completed in the accepted exit audit)**:
  Before closure, P0-U7 was required to reassess:
  A. Remaining active-test TypeScript diagnostics.
  B. Remaining historical/non-active test diagnostics (whether they remain observable only, are removed/archived through later authorized cleanup, or are excluded from a future canonical active-scope typecheck).
  C. Remaining production TypeScript diagnostics before Phase 0 freeze.
  D. Whether a future canonical active-scope typecheck gate is required.


### P0-U7 accepted exit reassessment

Current exit status: RECORDED / UNRESOLVED / NON_BLOCKING_FOR_PHASE_0_EXIT. The owner accepted the audit on `9bd5f7c971f21119ecb53717999786b8d1ad9609`: lint exit 2, 445 diagnostics, ACTIVE_TEST 29, HISTORICAL_NON_ACTIVE_TEST 393, PRODUCTION 23, TOOLING_CONFIG 0. Signature delta versus P0-U6 is 0 added / 0 removed. MUST_FIX_BEFORE_PHASE_0_FREEZE = 0; UNKNOWN = 0. This completes the reassessment obligation, not the remediation. Counts are dated observations; future increases are not automatically accepted.

| Reassessed family | Diagnostics | Exit classification | Owning phase / disposition |
|---|---:|---|---|
| Active Vitest global typing | 21 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 1 / owning phase as audited; runtime globals are configured and affected suites execute; no harness redesign authorized |
| Active i18n helper-call arity | 3 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 1 type-boundary follow-up; bounded helper tests run, no foundation execution blocker |
| Active AuthUserContext typing | 5 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 3 auth typing; external timeout is classified separately |
| Smart Import production contracts | 20 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 7/8; no ad-hoc production change at foundation exit |
| Trip production contracts | 3 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 10; domain authority is preserved |
| Historical Smart Import / fixture / contract drift | 338 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Existing register owners Phase 4/5/6 and 7/8; preserve current semantic tests, no blanket retirement |
| Retired navigation references | 26 | OBSOLETE_OR_HISTORICAL | Existing Phase 0/4/5/6/10/12 register ownership; review later without restoring retired navigation |
| Historical field-supervision overloads | 20 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 4/5/6 as registered |
| Historical import helper | 1 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 7/8 |
| Historical ProjectEntity fixtures | 2 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 4/5/6 |
| Historical workspace projection contracts | 6 | ACCEPTED_DEFERRED_TO_OWNING_PHASE | Phase 4/5/6 |

The unchanged runtime/toolchain foundation passed clean install/build, runtime-key 16/16 and auth trust-boundary 23/23. This and the explicit phase ownership justify bounded deferral; neither passing build nor deferred status erases type errors or certifies the product. Historical/non-active is a package-reachability classification, not automatic deletion or semantic obsolescence. Full-repository typecheck remains the debt-observation authority; this audit does not establish a replacement active-scope gate or authorize exclusions. Any future gate design needs a separate owning unit and verification.

### CURRENT_EXTERNAL_DEPENDENCY_BOUNDARY — accepted Phase 0 exit debt

Status: ENVIRONMENTAL_EXTERNAL_DEPENDENCY / UNRESOLVED / NON_BLOCKING_FOR_PHASE_0_EXIT. The audit observed Firestore/proxy connection rejection (403) and timeouts on the known TripNumberGenerator path. Exact cases:

1. `src/tests/projectCentricOperationsBlock87.test.ts`: aggregate test executing all 13 project-centric operation checks.
2. `src/tests/secureTripNumberingOffline89B.test.ts`: REQ-01.
3. `src/tests/secureTripNumberingOffline89B.test.ts`: REQ-13.
4. `src/tests/canonicalTripDispatchAuthority.test.ts`: A, successful canonical dispatch.
5. `src/tests/canonicalTripDispatchAuthority.test.ts`: U, immutable snapshots from canonical data.
6. `src/tests/materialAuthorityP602B2.test.ts`: case 5, valid/authorized material dispatch.

`npm test` exited 1 after 42 passing suites / 467 passing tests and the Project-Centric timeout. Separate remaining-root-file checks observed 71 passed / 2 external failures, for combined scoped evidence of 538 passed / 3 external failures, not root-command PASS. `verify:beta2` exited 2 at lint before its test stages; separate direct Beta tests observed 440 passed / 3 external failures, not Beta-wrapper PASS. NEW_REGRESSION = 0; UNKNOWN failures = 0. The earlier CD-45 nine-baseline-assertion-failure observation retains its earlier scope and is not newly reproduced or renamed a current PASS.

Future verification belongs to the domain-owning phases (Phase 10 for trip numbering), Phase 16 for broader integration/E2E and Phase 18 for the Beta 2 gate where applicable. Deferral is safe for Phase 0 because secret-free foundation gates are independently verified and this boundary is explicit. Environmental failure is not test retirement and is not product acceptance. No production workaround, credential injection, emulator or test migration is authorized by this exit record.

### Historical canonical open-debt inventory at Phase 0 exit

At that historical exit snapshot all entries remained open. All were NON_BLOCKING_FOR_PHASE_0_EXIT, not waived for their owning phase or release gates. Existing identifiers are retained; preventive observations below use descriptive references rather than invented debt IDs.

| Existing reference | Current status / evidence | Future owner | Reason safe to defer at foundation exit |
|---|---|---|---|
| TYPECHECK_BASELINE_DEBT | RECORDED / UNRESOLVED; 445 diagnostics, exit 2; families and evidence above | Phase 1 / 3 / 4–8 / 10 / 12 according to the family and existing register | No new diagnostics or tooling/config errors; full debt observability remains intact; no silent acceptance of future increases |
| CURRENT_EXTERNAL_DEPENDENCY_BOUNDARY | UNRESOLVED / ENVIRONMENTAL; six cases above; root/Beta NOT PASS | Domain owners, Phase 16, Phase 18 where applicable | Known external paths are outside the successful secret-free foundation gate; tests remain preserved |
| DD-01 | DEFERRED / UNRESOLVED; recorded Smart Import full-batch session-restore edge case, not re-proven by this documentation | Phase 8 | Persistence/resume semantics belong to that domain, not foundation closure |
| DD-02 | DEFERRED / UNRESOLVED; build succeeds with >500 kB client-chunk warning | Phase 15 | Performance debt does not prevent compilation or foundation verification |
| DD-03 | DEFERRED_NON_BLOCKING_PRODUCT_DEBT; accepted-stage mixed/bilingual label polish, not a claim of unmanaged-string remediation here | Separate product-polish scope; Phase 15 follow-up proposed by the accepted audit | Current stage acceptance is bounded; cosmetic perfection is not a Phase 0 gate |
| DD-04 | DEFERRED / UNRESOLVED; browser/product verification is not exhaustive | Product-owning phases; Phase 16 journeys and Phase 18 release | Foundation acceptance does not replace future surface/language/device/role and owner acceptance evidence |
| P0-U6 lockfile metadata observation | RECORDED / UNRESOLVED; 810 non-root entries lack resolved/integrity; clean npm ci succeeds without package mutation | Separate supply-chain scope; Phase 17 follow-up proposed by the accepted audit | Concrete install works; metadata assurance limitation is retained, not repaired or claimed absent |
| P0-U6 credential-filename ignore observation | PREVENTIVE / UNRESOLVED; .env patterns ignored, generic credential filenames not covered; TRACKED_SECRET = 0 | Separate hardening scope; Phase 17 follow-up proposed by the accepted audit | No actual tracked credential found; no .gitignore change is authorized here |

Proposed follow-up phases remain explicitly identified as proposals from the accepted audit, not invented implementation units or authorization to remediate. Existing future distribution/provider decisions and retirement candidates remain separate decisions, not unproven new foundation debt or permission to act.

## Historical deferred-debt register — original routing preserved; current dispositions above
- **DD-03 — Deferred language polish**: `DEFERRED_NON_BLOCKING_PRODUCT_DEBT`. Some Arabic-mode surfaces may still show deliberate or unresolved mixed Arabic/English or bilingual labels. Preserve current accepted stage behavior; full cosmetic language perfection is not required before continuing P0. Future remediation needs a separately bounded product scope and acceptance; P0-U5 performs no localization changes.
- **DD-04 — Product verification breadth**: Browser review is accepted sufficiently for this reconstruction stage, not claimed exhaustive. Future product-facing phases retain surface/workflow/language/device/role evidence and explicit user acceptance obligations; historical release-ready reports do not satisfy them automatically.
- **DD-01 (DEFERRED_TO_PHASE_8)**: Known Smart Import session-restore contract edge case during full batch recovery. Tracked for resolution during Phase 8 (Smart Import Persistence, Resume & Commit Integrity), NOT as a Phase 0 quick patch task.
- **DD-02 (DEFERRED_TO_PHASE_15)**: Monolithic client chunk size warning (> 500 kB) in Vite build output. Tracked for Phase 15 performance optimization.

---

## RETIREMENT_CANDIDATES
- Root-level ad-hoc diagnostic scripts (`test-*.ts`, `verify-*.ts`) after proving zero runtime callers.
- Legacy or duplicate mock services superseded by canonical server services.
- **Historical CD-41 supplemental provenance (not a retirement candidate or a new decision ID)**: Block82 historical fixed 1,128-key invariant retired; current locale dictionaries remain translation authority; 1128 was historical migration-era cardinality only; 1129 is NOT introduced as a replacement frozen contract; dry-run integrity now uses dynamic current locale parity/counts; cleanup verification uses pre/post count preservation; final reports display dynamic current counts; CLN-04/05/06/09 aligned to current authority; all 9 Block82 tests retained; no locale dictionary changes; taxonomy corrected from UI_DOM/FIREBASE_MOCK to UNIT/PURE_LOGIC; production service changed only to remove stale historical cardinality logic.

## Historical P8-B4 pre-publication source/resume decisions

- RESOLVED within the Roster source journey: terminal result discovery, execution-first restore, partial result visibility, explicit unfinished-only retry/cancel, and lost-response status recovery. B3 remains the sole execution authority.
- RESOLVED within the source adapters: exact local reattach preserves the Session/mapping/review; remote values are bound to the accepted spreadsheet/tab/snapshot and use the shared Roster core. The existing Trip Sheets path remains separate.
- SUPERSEDED: the prior pending Sheets Roster button and the assumption that all post-restart Roster stages need local bytes. Resolution snapshots and execution receipts are already durable evidence.
- STILL_OPEN: existing typecheck debt and reproduced historical assertion/external-dependency failures. Source/browser verification does not waive live Firebase/Google integration acceptance.
- ROUTED_TO_LATER_PHASE: offline/outbox redesign, pricing and broad release certification remain outside this unit. Phase 9 is not started.
- TEST_HARNESS_COMPATIBILITY_CORRECTION: three existing test files retain their test counts while replacing the superseded local-result state requirement with durable journal-result assertions, recognizing the separately guarded legacy result panel, and using the full cancellation-handler boundary rather than a fixed character window. No historical failure was deleted or reclassified to hide a regression.

## Historical P9-U1 pricing authority reconciliation — 2026-10-29

- RESOLVED: browser Firestore/cache pricing writes and the success-only update endpoint are replaced by authenticated canonical server operations with version fencing, overlap rejection and audit. Forged role/Project/legacy authorization-array claims do not override canonical participation.
- RESOLVED: readiness, operational assignment and pure previews share the pricing selection policy. Existing timestamp precision is retained; a transaction-time expiry regression test remains enforced.
- RESOLVED: fixed Trip snapshots retain commercial terms; completion uses stored rates, and reports cannot infer missing historical waiting charges from a mutable master rule.
- SUPERSEDED: the client-only COW placeholder and fake default rule are not business authority. Unreachable prototype `CanonicalPricingRepository` retains its old read contract; active pricing does not call it. The server adapter's legacy read-only inspection fallback is not used by active assignment, which calls `resolve`.
- STILL_OPEN: a separately designed production COW/versioning UX, unsupported legacy model migration, existing diagnostics and baseline-reproduced test debt. No new Phase-9 unit ID is assigned and no repricing feature is invented.
- ROUTED_TO_LATER_PHASE: broad accounting/invoicing, offline reconstruction and Trip lifecycle redesign remain outside this unit.
- TEST_HARNESS_COMPATIBILITY_CORRECTION: existing pricing server tests gain canonical account/global fixtures and structured error assertions; alternate-schema writes now prove fail-closed rejection. The pricing slice of the persistence-boundary test uses authenticated HTTP transport while preserving timestamp/identity checks. Three readiness/activation fixture files gain the pricing model and positive rate required for a valid commercial rule, without changing workflow assertions. Test counts are retained (76/75/41/67/28 across the five existing changed suites).

The P8-B4 merge closes Phase 8 at source level. Publication for this P9-U1 branch is explicitly authorized; owner merge remains manual. Live Firebase acceptance is not claimed.


## P9-U2 commercial versioning reconciliation — 2026-10-29

Baseline `303469ef29b7cf906964316691e491c0df6d5e45` merges P9-U1 through PR #62. The ledger alone governs exact status.

- RESOLVED: minimum required used-rule COW/version UX. One save rechecks usage; replacement preserves old commercial fields, creates a successor and exclusive resolution cutoff, and writes correlated existing CREATE/UPDATE audits atomically. Stale/concurrent replacement and branching fail closed. Status mutations are server-authorized and do not reprice historical Trips.
- RESOLVED: supported minimum billable weight was previously stored but not applied/captured consistently. The common calculator now applies the existing term after positive measured weight, leaving physical weight unchanged. VAT calculations use captured applicability/percentage through one totals policy; zero tax percentage remains zero, not fallback 15. Historical tax/waiting results survive later replacement.
- SUPERSEDED: the P9-U1 deferral of minimum COW UX is satisfied by the server save command. The unused old client COW placeholder remains a fail-closed historical method; it is not required for or reachable from the active Wizard path.
- STILL_OPEN: baseline-reproduced test/diagnostic debt and live Firebase acceptance. Legacy optional-term absence is retained rather than manufacturing historical terms.
- ROUTED_WITHOUT_BLOCKING_PHASE: speculative legacy database mass migration requires a separately proven inventory. Supported aliases/general-Material sentinels normalize deterministically through current policy; unsupported model selection fails closed. No unsupported calculator is activated.
- NOT_IN_APPROVED_SCOPE: generalized tax/accounting/invoicing, new automatic waiting accrual and unused browser adjustment approval workflow. Stored contractual terms/charges remain preserved; no new monetary command or approval workflow is added.
- ROUTED_TO_LATER_PHASE: Trip FSM, offline and audit subsystem reconstruction retain their existing phase owners. No Phase 10 work is started.

Historical records and original design bodies are retained. Phase 9 source closure readiness is conditional on the ledger's completed verification matrix and owner merge, not live deployment or release certification.
