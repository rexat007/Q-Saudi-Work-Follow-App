# Q-SAUDI WORK FOLLOW — RECONSTRUCTION PROGRAM
## WORK START HERE & OPERATIONAL DIRECTIVES

### Executive Summary
Welcome to the repository-governed reconstruction program for Q-Saudi Work Follow. This program manages the systematic engineering transition of the application from historical patch-based feature development to a hardened, server-authoritative, production-grade enterprise platform (Phase 0 through Phase 18).

This directory (`docs/reconstruction/`) contains repository-governed current contracts and clearly marked historical records. Governance changes through bounded, reviewed documentation units; it is not an immutable snapshot.

**Current state has one owner:** [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Use it for the active phase/unit, next unit, closed units, open-debt routing and execution rules. Do not use Studio copies or historical release reports as competing ledgers.

P0-U5 is documentation-only. Whole-App i18n and residual remediation are merged and accepted for this reconstruction stage; remaining mixed/bilingual labels are deferred non-blocking debt, not authorization to reopen localization.


### Current Continuation Checkpoint — 2026-10-24

- **Current verified GitHub main**: `e09cd613d93d3e6519fe1dc283caf96d4363bcec` (PR #35 — P2-U4 merged).
- **Phase 0**: VERIFIED / CLOSED / FROZEN.
- **Phase 1 and P1-U1 through P1-U9**: VERIFIED / CLOSED.
- **Phase 2 — Persistence & Server Authority**: VERIFIED / CLOSED.
- **P2-U1** Durable Admin Persistence Selection: VERIFIED / CLOSED — PR #32, verified merge `ff5dc79cb380a8ea2713eb539f6cad326407ea16`.
- **P2-U2** Firestore Persistence Trust Boundary: VERIFIED / CLOSED — PR #33, verified merge `fafbadd90a37988ad97d18a4cfa3191532307255`; Firestore rules published and owner smoke verification passed.
- **P2-U3** Server Project and Storage Resource Isolation: VERIFIED / CLOSED — PR #34, verified merge `48c016e790dbc6f1b64e09cbc22ef60e78743d1c`.
- **P2-U4** Persistence Read/Write Representation Boundary: VERIFIED / CLOSED — PR #35, verified merge `e09cd613d93d3e6519fe1dc283caf96d4363bcec`.
- **Active phase**: PHASE_3 — Authentication, Authorization & Administrative Governance, IN_PROGRESS.
- **Active unit**: UNASSIGNED / REQUIRES_PHASE_3_AREA_AUDIT.
- **Next action**: `PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT`.
- Phase 3 audit must map RBAC, token/auth context, field-level authorization, IDOR/admin controls, and the intentional role-boundary deferrals from Phase 1 before defining bounded implementation batches.

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
