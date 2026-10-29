# Q-SAUDI WORK FOLLOW — RECONSTRUCTION PROGRAM
## WORK START HERE & OPERATIONAL DIRECTIVES

### Executive Summary
Welcome to the repository-governed reconstruction program for Q-Saudi Work Follow. This program manages the systematic engineering transition of the application from historical patch-based feature development to a hardened, server-authoritative, production-grade enterprise platform (Phase 0 through Phase 18).

This directory (`docs/reconstruction/`) contains repository-governed current contracts and clearly marked historical records. Governance changes through bounded, reviewed documentation units; it is not an immutable snapshot.

**Current state has one owner:** [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Use it for the active phase/unit, next unit, closed units, open-debt routing and execution rules. Do not use Studio copies or historical release reports as competing ledgers.

P0-U5 is documentation-only. Whole-App i18n and residual remediation are merged and accepted for this reconstruction stage; remaining mixed/bilingual labels are deferred non-blocking debt, not authorization to reopen localization.


### Current Continuation Checkpoint — 2026-10-29

- **Verified implementation baseline**: `f261ebc5508d881c9bfbe3dc77af1ccad75ec914` (PR #63 — P9-U2 merged and source-verified).
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
- **Continuation**: consult [the phase ledger](02_PHASE_LEDGER.md) for the exact current unit/status. Phase 9 is source-closed. PFAG-RB1 foundation safety remediation is locally implemented, with native Firestore rule-runtime verification deferred under the owner-approved fallback (PFAG-RULES-01; official artifact unavailable, HTTP 403).
- **P8-B3**: MERGED / SOURCE_VERIFIED / CLOSED.
- **Next action**: follow the ledger’s PFAG-RB1 verification gate; source merge may proceed under the approved fallback after zero overlapping client write grants and no new regressions are proven; native/deployed rules acceptance is not claimed. PFAG-RB2 remains required; do not start Phase 10.
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
