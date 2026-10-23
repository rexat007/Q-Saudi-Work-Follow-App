# RECONSTRUCTION PLAN
## Architectural Classification & Methodological Framework

### Reconstruction Classification Taxonomy
To ensure structured code evolution without destructive rewrites, every component, service, module, and test file in the Q-Saudi repository is assigned one of six reconstruction classifications:

#### 1. KEEP
- **Definition**: Current implementation fits target architecture cleanly with zero or negligible defects.
- **Action**: Retain without structural modification; include in test coverage.

#### 2. HARDEN
- **Definition**: Capability is essential and correctly architected, but requires stronger type safety, better error boundaries, enhanced test coverage, or improved edge-case resilience.
- **Action**: Strengthen types, add assertions, enhance error handling, expand test suites.

#### 3. CONVERGE
- **Definition**: Capability is required but exists across multiple duplicate paths or competing authorities.
- **Action**: Consolidate callers into a single canonical server-authoritative implementation path; eliminate alternate paths.

#### 4. REBUILD
- **Definition**: Business capability is required, but current implementation is structurally unsafe, overly coupled, or fundamentally flawed such that convergence is impossible.
- **Action**: Rebuild from scratch against a strict target contract with explicit approval.

#### 5. RETIRE
- **Definition**: Legacy, dead, or duplicate implementation superseded by canonical services.
- **Action**: Remove ONLY after proving zero active callers and zero runtime necessity.

#### 6. DEFER
- **Definition**: Real technical debt or secondary improvement that is not required for the active phase and does not block current goals.
- **Action**: Log in [05_DECISION_AND_DEBT_LOG.md](05_DECISION_AND_DEBT_LOG.md) with target phase deferred to.

---

### Methodological Invariant: Prohibition of Patch-by-Patch Discovery
When an issue or test failure is discovered during reconstruction, engineers MUST NOT apply a superficial single-line patch and stop discovery.
Engineers MUST:
1. Continue discovery across the entire component, hook, service, and test family.
2. Identify all related defects and root-cause issues.
3. Consolidate the entire defect family into a unified target contract.
4. Apply a holistic fix that satisfies the contract across all callers and test suites.

### Scope and sequence authority

This document defines methodology, not current progress. The accepted order is in [FOUNDATIONAL_PLAN_PHASE_0_TO_18.md](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md); current phase/unit and next-unit entry are owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Area-wide discovery does not authorize edits outside a bounded user instruction: P0-U5 changes documentation only and does not reopen accepted i18n work.


### Current continuation checkpoint

As of verified main `b360fe7c717cff35357dc539ca37d83bea1b348c`, Phase 0 is VERIFIED / CLOSED / FROZEN and Phase 1 is IN_PROGRESS. P1-U1 through P1-U7 are VERIFIED / CLOSED. The active unit is P1-U8 — User Entity Role Vocabulary Authority Convergence, scoped only to `UserEntity.role` and `UserEntity.requestedRole` in `src/types/entities.ts`, consuming canonical `UserRole` from `src/types/common.ts`. Wizard/validator/server-auth role differences are intentionally deferred to Phase 3. After P1-U8 implementation, owner review, merge and independent verification, run PHASE_1_CLOSURE_AUDIT before defining another unit or starting Phase 2. Current state details remain owned by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).
