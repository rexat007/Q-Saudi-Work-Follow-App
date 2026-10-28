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

This document defines methodology, not current progress. The accepted order is in [FOUNDATIONAL_PLAN_PHASE_0_TO_18.md](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md); current phase/unit and next-unit entry are owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Area-wide discovery does not authorize edits outside a bounded user instruction: the historical P0-U5 unit changed documentation only and does not reopen accepted i18n work.


### Current continuation authority

Use the actual local Codex repository and [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) for the merged baseline, active unit and next action. The former Phase-3-first-audit pointer is historical; subsequent accepted source history has progressed through P8-B2. The current P8-B3 unit ends at owner review. No publication or P8-B4 implementation follows automatically. Phase purposes and ordering remain in the foundational roadmap; this methodological document does not own progress state.
