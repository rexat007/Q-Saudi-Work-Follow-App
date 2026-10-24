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

### Current execution method
The detailed current method is [STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md](STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md).

The reconstruction remains area-aware and root-cause driven, but it no longer requires a long governance chain for every small change. Use one broad phase/area audit, group compatible work into bounded batches, implement and verify proportionally to risk, combine commit/push/PR into one publication step, keep owner merge manual, and normally perform one independent post-merge GitHub verification. Additional gates are retained for high-risk persistence, security, tenant-isolation, financial or destructive changes.

Patch-by-patch stopping remains prohibited: discovery should cover the relevant component/service/test family before implementation. However, related defects should be consolidated into practical batches rather than converted into an endless series of micro-units.

### Scope and sequence authority

This document defines methodology, not current progress. The accepted order is in [FOUNDATIONAL_PLAN_PHASE_0_TO_18.md](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md); current phase/unit and next-unit entry are owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Area-wide discovery does not authorize edits outside a bounded user instruction: P0-U5 changes documentation only and does not reopen accepted i18n work.


### Current continuation checkpoint

At verified GitHub main `e09cd613d93d3e6519fe1dc283caf96d4363bcec`, Phase 0 remains VERIFIED / CLOSED / FROZEN, Phase 1 is VERIFIED / CLOSED, and Phase 2 — Persistence & Server Authority plus P2-U1 through P2-U4 are VERIFIED / CLOSED. Phase 3 — Authentication, Authorization & Administrative Governance is IN_PROGRESS at governance level by owner instruction to proceed.

Phase 3 purpose remains the accepted foundational scope: RBAC, token verification, field-level authorization, IDOR defense and administrative controls. Known carryovers include the intentionally deferred wizard role subset, UserValidator role allowlist and server AuthenticatedUser/auth-context semantics. Under the streamlined method, NEXT_ACTION is one broad `PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT` that maps meaningful Phase-3 defects and groups compatible work into bounded batches. No P3 unit is pre-assigned. Current status remains owned by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).