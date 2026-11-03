## Current Controlled Incremental Workspace Projection & Derived Report Refresh checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns current state. Working source contains completed Controlled Incremental Workspace Projection & Cost, Scale, Synchronization Architecture and Explicit Derived Report Refresh Convergence verified locally (`7d50d3a31e72eb2e573ed169a029d5822f0a0742` baseline). Standard operational authority is strictly Firestore (`FIRESTORE` = SOLE CANONICAL OPERATIONAL AUTHORITY; `GOOGLE_SHEETS` = DEFERRED PROJECTION / CONTINUITY / REPORT EXPORT). Ordinary data sync (`retrySync`) performs strictly incremental Trip projection (0 full Trip collection scans). Derived operational reports are updated via an explicit bounded server-authoritative operation (`refreshOperationalReports` / `POST /api/projects/:projectId/workspace/refresh-reports`). Automatic user-active activity trigger POST requests (`useUserActiveWorkspaceSync`) and unbounded continuous 30s PWA polling in `pwaUpdate.ts` are retired to strictly 0 calls. Scheduled worker (`WorkspaceSyncCoordinator.ts`) filters and skips non-ACTIVE projects without Google calls. Local test suites `controlledIncrementalWorkspaceProjection.test.ts` (5/5 PASS), `userActiveWorkspaceSync.test.tsx` (10/10 PASS), `runtimeGenerationConvergence.test.ts` (18/18 PASS), and `workspaceSyncCoordinator.test.ts` (28/28 PASS) all pass (61/61 total PASS). Publication is pending owner review; no push, PR, merge, or Phase 10.

## Historical Operational Profile Impact Assessment checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns current state. Working source contains completed Operational Profile Impact Assessment and Reviewed Apply implementation verified locally (`9923c5b5adc40ff7ad5e69b46cbfc14f34f7dbbe` baseline). Same-profile reviewed reconfigurations are supported while preserving historical Trip snapshots and Google Workspace resource identities without creating duplicate folders/sheets/scripts. General cross-profile migration remains fail-closed. Local test suites `operationalProfileAssessment.test.ts` (13/13 PASS) and `projectWorkspaceMutationInvalidationUnit5B.test.ts` (40/40 PASS) pass. Previous gates Smart Import Dark Contrast Family (`LIVE_PASS`), Durable Recovery (`LIVE_PASS`), and Account Profile Continuity (`LIVE_PASS`) are preserved. Publication is pending owner review; no push, PR, merge, or Phase 10. Deployed Q-PRJ-011 retest and Workspace quiescence retest remain required.

## Historical Smart Import live-remediation checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns current state. Starting merged main `0f1c6b841da168dc4464c17cbd9f5096fef5e32d` contains PR #88. Owner reports profile recovery and same durable Import Session/stage restoration passed live; restored-stage prerequisite drift and invisible shared Material/bulk controls exposed two bounded defects. Current source correction derives effective stage from fresh existing gates and styles the two shared components. [Evidence and remaining live checks](LIVE_INTAKE_CONTINUITY_CONTRACT.md). Final Review live acceptance is incomplete; Workspace quiescence still requires owner live retest. One local commit only; no push/PR/merge, Workspace redesign or Phase 10. Older checkpoints below are historical.

## Historical PR #88 Workspace quiescence checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns exact current state. Starting verified merged main: `be908ce2642e68ff784282ab3cacfd6b94efc745` (PR #87). Owner observed correct profile-unavailable behavior, followed by Firestore quota exhaustion and repeated Workspace retries. The bounded source remedy and controlled operation budgets are in [WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md](WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md). Live intake acceptance is paused pending owner retest; local verification is not live acceptance. Only a local commit is authorized: no push/PR/merge, Phase 10 or Trips/Reports redesign. Earlier continuation instructions below are historical where superseded.

## Historical PR #87 live intake continuity checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first. Verified merged main is `637b7d54429ac586e101689deae35e013a9eab77` (PR #86). The current bounded unit addresses account-profile outage continuity, bulk canonical identity reuse and explicit operational Material binding; see [LIVE_INTAKE_CONTINUITY_CONTRACT.md](LIVE_INTAKE_CONTINUITY_CONTRACT.md). Local verification precedes the authorized one-commit branch publication. No PR/merge, new phase or live acceptance is performed. Older continuation checkpoints below are historical where superseded.

## Historical PR #86 Smart Import continuation

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first. Verified main `4d193d96791425c4d3c3bcaa60f06175036efdfb` merges GWS-ONE live closure (PR #85). The current bounded package assures the existing Smart Roster journey, owned nested dialogs, async/session ownership, canonical resolution, durable recovery and scale. See [SMART_IMPORT_ASSURANCE_CONTRACT.md](SMART_IMPORT_ASSURANCE_CONTRACT.md). No Trips/Reports/new phase, live Project mutation, PR or merge is authorized. Deployed Q-PRJ-010 acceptance remains NOT_PERFORMED.

# Q-SAUDI WORK FOLLOW — RECONSTRUCTION PROGRAM
## WORK START HERE & OPERATIONAL DIRECTIVES

### Executive Summary
Welcome to the repository-governed reconstruction program for Q-Saudi Work Follow. This program manages the systematic engineering transition of the application from historical patch-based feature development to a hardened, server-authoritative, production-grade enterprise platform (Phase 0 through Phase 18).

This directory (`docs/reconstruction/`) contains repository-governed current contracts and clearly marked historical records. Governance changes through bounded, reviewed documentation units; it is not an immutable snapshot.

**Current state has one owner:** [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Use it for the active phase/unit, next unit, closed units, open-debt routing and execution rules. Do not use Studio copies or historical release reports as competing ledgers.

P0-U5 is documentation-only. Whole-App i18n and residual remediation are merged and accepted for this reconstruction stage; remaining mixed/bilingual labels are deferred non-blocking debt, not authorization to reopen localization.


### Historical Continuation Checkpoint — 2026-11-02

- **Verified merged baseline**: `4d193d96791425c4d3c3bcaa60f06175036efdfb` (GWS-ONE live closure, PR #85).
- **Phase 0**: VERIFIED / CLOSED / FROZEN.
- **Phase 1**: VERIFIED / CLOSED.
- **Phase 2**: VERIFIED / CLOSED.
- **Phases 3–6**: source reconstruction closed for the current track; previously recorded live/deployment gates remain separate where applicable and are not silently promoted by this checkpoint.
- **Phase 7 — Smart Import Core**: SOURCE CLOSED.
- **Smart Import pre-Phase-8 correction gate**: CLOSED.
  - SI-CG1 — Identity, Grouping & Provenance Correction: MERGED / SOURCE VERIFIED.
  - SI-CG2 — Layer & Contextual Creation Convergence: MERGED / SOURCE VERIFIED.
- **Phase 8 — Smart Import Persistence, Resume & Commit Integrity**: MERGED / SOURCE_VERIFIED / CLOSED.
  - P8-B1 — Durable Session & Reviewed Intent Authority: MERGED / SOURCE VERIFIED / CLOSED — PR #57, merge `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`.
  - P8-B2 — Server Commit Authority & Prepared Identity Materialization: MERGED / SOURCE VERIFIED / CLOSED — PR #58, merge `1f7f3344e65dfc9b6837b10cb5349827da1587eb`.
- **Continuation**: [the ledger](02_PHASE_LEDGER.md) owns state; baseline `4d193d96791425c4d3c3bcaa60f06175036efdfb` merges GWS-ONE live closure. Current bounded work is Smart Import assurance; see [assurance contract](SMART_IMPORT_ASSURANCE_CONTRACT.md). Existing phase closures and external acceptance gates remain.
- **P8-B3**: MERGED / SOURCE_VERIFIED / CLOSED.
- **Next action**: complete the authorized Smart Import assurance branch publication and stop for owner review; no PR/merge. Deployed Q-PRJ-010 acceptance is a separate unperformed gate. Preserve the existing zero-Picker, durable-grant, strict READY, Script-create ambiguity and USER_ACTIVE/no-cron Workspace contracts; no manual Project repair/reset or Phase 10.
- **Current TypeScript diagnostics baseline**: 440 after P8-B2; new diagnostics added by P8-B2: 0.
- **Lint**: EXIT 2 / NOT PASS remains historical debt, not a new P8-B2 regression.
- **Remaining focused Smart Import test debt**: historical C5 cases 38, 61, 62 and 67; no new P8-B2 failures.
- **Live Firebase acceptance** for P8-B1/P8-B2 is NOT claimed; verification used focused automated tests and controlled browser/in-memory service checks.
- **Historical P8-B2 continuation snapshot**: [CURRENT_CONVERSATION_HANDOFF_2026-10-28.md](CURRENT_CONVERSATION_HANDOFF_2026-10-28.md).


---

### Core Operational Principles
1. **GitHub Main Is Code Truth**: The remote `main` branch on GitHub is the sole source of code truth.
2. **Minimum Necessary Governance**: Use the streamlined method in [STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md](STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md). Combine or skip gates that add no material protection; preserve extra gates for high-risk work.
3. **Bounded Batches, Not Endless Micro-Units**: Prefer one coherent batch for related safe work with a shared purpose and regression surface. Split only when risk, ownership or verification requires it.
4. **No Greenfield Rewrites**: Existing application code is valuable asset material. Reconstruction hardens, converges, and stabilizes capabilities rather than discarding existing working features.
5. **Area-Wide Review Before Editing**: Review the full relevant family, then fix the coherent defect family rather than stopping at the first visible symptom.
6. **Server Authority**: The backend (Node/Express/Firebase Admin) is the sole authority for business logic, pricing computations, trip state transitions, and persistent data reconciliation.
7. **Multi-Tenant Isolation**: Every database query, outbox item, REST endpoint, and UI state context must be strictly isolated by `projectId`.
8. **Responsive / Cross-Device Invariant**: Field UI must function flawlessly across mobile, tablet, and desktop viewports with strict RTL Arabic layout discipline.

---

### Governance Entry Points
- **Document Authority**: `docs/reconstruction/DOCUMENT_AUTHORITY.md`
- **Engineering Constitution**: `docs/reconstruction/01_ENGINEERING_CONSTITUTION.md`
- **Active Phase Ledger**: `docs/reconstruction/02_PHASE_LEDGER.md`
- **Streamlined Execution Method**: `docs/reconstruction/STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md`
- **Implementation Unit Protocol**: `docs/reconstruction/03_IMPLEMENTATION_UNIT_TEMPLATE.md`
- **Verification & Push Gate**: `docs/reconstruction/04_VERIFICATION_AND_PUSH_GATE.md`
- **Decision & Debt Log**: `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- **Master Reconstruction Plan**: `docs/reconstruction/RECONSTRUCTION_PLAN.md`
- **Foundational Plan (Phases 0–18)**: `docs/reconstruction/FOUNDATIONAL_PLAN_PHASE_0_TO_18.md`
