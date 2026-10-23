# Q-SAUDI WORK FOLLOW — RECONSTRUCTION PROGRAM
## WORK START HERE & OPERATIONAL DIRECTIVES

### Executive Summary
Welcome to the repository-governed reconstruction program for Q-Saudi Work Follow. This program manages the systematic engineering transition of the application from historical patch-based feature development to a hardened, server-authoritative, production-grade enterprise platform (Phase 0 through Phase 18).

This directory (`docs/reconstruction/`) contains repository-governed current contracts and clearly marked historical records. Governance changes through bounded, reviewed documentation units; it is not an immutable snapshot.

**Current state has one owner:** [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Use it for the active phase/unit, next unit, closed units, open-debt routing and execution rules. Do not use Studio copies or historical release reports as competing ledgers.

P0-U5 is documentation-only. Whole-App i18n and residual remediation are merged and accepted for this reconstruction stage; remaining mixed/bilingual labels are deferred non-blocking debt, not authorization to reopen localization.


### Current Continuation Checkpoint — 2026-10-23

- **Closure evidence baseline (verified GitHub main)**: `f817fc8f053aeb2f5f1ecc63f456a939816b7301` (PR #29 merged).
- **Phase 0**: VERIFIED / CLOSED / FROZEN.
- **Phase 1**: VERIFIED / CLOSED (`PHASE_1_VERIFIED_CLOSED`).
- **P1-U1 through P1-U9**: VERIFIED / CLOSED; P1-U9 was the final Phase 1 unit.
- **Active phase / unit**: NONE; no implementation work is active.
- **Phase 2**: NOT_STARTED, pending explicit owner activation; no Phase 2 unit is defined.
- **Next action**: `OWNER_DECISION_TO_ACTIVATE_PHASE_2`.
- No P1-U10 exists.
- Wizard/validator/auth-context role differences remain Phase 3 debt; other later-phase debt is unchanged.


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
