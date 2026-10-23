# Q-SAUDI WORK FOLLOW — RECONSTRUCTION PROGRAM
## WORK START HERE & OPERATIONAL DIRECTIVES

### Executive Summary
Welcome to the repository-governed reconstruction program for Q-Saudi Work Follow. This program manages the systematic engineering transition of the application from historical patch-based feature development to a hardened, server-authoritative, production-grade enterprise platform (Phase 0 through Phase 18).

This directory (`docs/reconstruction/`) contains repository-governed current contracts and clearly marked historical records. Governance changes through bounded, reviewed documentation units; it is not an immutable snapshot.

**Current state has one owner:** [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Use it for the active phase/unit, next unit, closed units, open-debt routing and execution rules. Do not use Studio copies or historical release reports as competing ledgers.

P0-U5 is documentation-only. Whole-App i18n and residual remediation are merged and accepted for this reconstruction stage; remaining mixed/bilingual labels are deferred non-blocking debt, not authorization to reopen localization.


### Current Continuation Checkpoint — 2026-10-23

- **Phase 2 activation evidence baseline (verified GitHub main)**: `747e86662b867aa5990f87fb0e60c79b077efb86` (PR #30 — Phase 1 closure merged).
- **Phase 0**: VERIFIED / CLOSED / FROZEN.
- **Phase 1 and P1-U1 through P1-U9**: VERIFIED / CLOSED; no P1-U10 exists.
- **Active phase**: PHASE_2 — Persistence & Server Authority, IN_PROGRESS.
- **Active unit**: UNASSIGNED / REQUIRES_PHASE_2_FIRST_UNIT_DEFINITION.
- **Active-unit status / type**: UNASSIGNED / NOT_STARTED; UNASSIGNED.
- **P2_U1_STATUS**: DOES_NOT_EXIST; no numbered Phase 2 unit is defined.
- **Next action**: `PHASE_2_FIRST_UNIT_DEFINITION_AUDIT`.
- No implementation is authorized by this governance activation.


---

### Core Operational Principles
1. **GitHub Main Is Code Truth**: The remote `main` branch on GitHub is the sole source of code truth. Unpushed local edits hold zero governance weight until verified, approved, and pushed.
2. **One Bounded Unit at a Time**: Work proceeds strictly one implementation unit at a time. No parallel unverified feature additions.
3. **No Greenfield Rewrites**: Existing application code is valuable asset material. Reconstruction hardens, converges, and stabilizes capabilities rather than discarding existing working features.
4. **Area-Wide Review Before Editing**: Never fix a defect isolated in a single line without reviewing the entire component/module family to identify and eliminate root causes holistically.
5. **No Patch-by-Patch Stopping**: Continue discovery after encountering the first defect. Consolidate the entire defect family before writing code.
6. **Server Authority**: The backend (Node/Express/Firebase Admin) is the sole authority for business logic, pricing computations, trip state transitions, and persistent data reconciliation.
7. **Multi-Tenant Isolation**: Every database query, outbox item, REST endpoint, and UI state context must be strictly isolated by `projectId`.
8. **Responsive / Cross-Device Invariant**: Field UI must function flawlessly across mobile, tablet, and desktop viewports with strict RTL Arabic layout discipline.

---

### Governance Entry Points
- **Document Authority**: `docs/reconstruction/DOCUMENT_AUTHORITY.md`
- **Engineering Constitution**: `docs/reconstruction/01_ENGINEERING_CONSTITUTION.md`
- **Active Phase Ledger**: `docs/reconstruction/02_PHASE_LEDGER.md`
- **Implementation Unit Protocol**: `docs/reconstruction/03_IMPLEMENTATION_UNIT_TEMPLATE.md`
- **Verification & Push Gate**: `docs/reconstruction/04_VERIFICATION_AND_PUSH_GATE.md`
- **Decision & Debt Log**: `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- **Master Reconstruction Plan**: `docs/reconstruction/RECONSTRUCTION_PLAN.md`
- **Foundational Plan (Phases 0–18)**: `docs/reconstruction/FOUNDATIONAL_PLAN_PHASE_0_TO_18.md`
