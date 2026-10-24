# STREAMLINED RECONSTRUCTION EXECUTION METHOD
## Minimum-governance delivery model for Q-Saudi Work Follow

Authority: `CURRENT_SUPPORTING`. Current phase/unit status remains owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

## 1. Purpose

The reconstruction program exists to move the product through the remaining build phases, close material architectural and implementation gaps, correct prior execution defects, and reach a sound Beta 2 release. Governance exists to protect that result; it must not become an endless process of micro-approvals, duplicate audits, or documentation-only loops.

The operating rule is:

> Use the minimum governance necessary to protect correctness, data integrity, security, tenant isolation, and release quality. Skip or combine steps that add no material protection.

## 2. Standard phase cycle

Each reconstruction phase should normally use one phase-level discovery/audit that:

1. establishes the current authoritative baseline;
2. identifies the material defects, debt and authority gaps owned by that phase;
3. separates true blockers from later-phase or non-blocking debt;
4. groups related safe work into bounded implementation batches;
5. proposes the practical execution order for the phase.

The phase audit should produce a usable phase map, not merely identify one tiny seam and force another audit after every unit.

## 3. Standard implementation cycle

For ordinary bounded work, use:

**phase/area audit → bounded batch definition → implementation → focused verification → owner review → commit + push + PR → owner manual merge → one independent post-merge verification → continue**

Rules:

- Prefer a coherent bounded batch over many micro-units when the changes share one purpose, authority and regression surface.
- Do not create a new unit merely because a textual difference exists.
- Do not reopen accepted work without concrete regression evidence.
- GitHub `main` remains the sole code truth.
- Owner merge remains manual unless the owner explicitly changes that rule.
- Independent GitHub verification is normally performed once after merge, not repeatedly before and after every publication step.
- Implementation reports may not self-declare owner acceptance.

## 4. Steps normally combined or skipped

Unless risk requires otherwise:

- commit, push and PR creation belong to the same publication step;
- a separate pre-PR publication audit is not required for an already reviewed bounded implementation;
- documentation-only transitions should be combined with the next meaningful governance or implementation publication when practical;
- documentation should be refreshed at phase boundaries, major batch closures, or when current-state pointers would otherwise become misleading;
- do not create recursive commits merely to replace embedded evidence SHAs with the SHA of the documentation commit itself;
- do not rerun broad unrelated test suites when the changed surface is narrow and focused regressions plus required foundation gates provide sufficient evidence;
- type-only or documentation-only work does not require browser/runtime verification unless executable behavior could actually change;
- do not create a separate PR solely to restate a state already safely included in an active branch/PR.

## 5. Verification proportional to risk

### Ordinary bounded work
Use the smallest evidence set that proves the intended contract:

- focused tests for the changed domain;
- relevant regressions;
- build when executable source changes;
- diagnostic delta where TypeScript debt is relevant;
- required standing foundation/security gates when the changed surface touches them.

### Product-facing/runtime work
Add real browser/workflow verification when UI, user workflow, network behavior, or runtime semantics change.

### High-risk work
Use additional gates when changes involve one or more of:

- authentication or authorization;
- tenant isolation;
- Firestore security rules;
- schema/data migration or destructive persistence changes;
- financial calculations or settlement correctness;
- irreversible writes/deletes;
- cross-domain runtime behavior;
- broad server-authority rewrites;
- release/deployment security.

For high-risk work, a separate pre-merge audit or staged rollout may be justified.

## 6. Unit sizing rule

A unit is a delivery boundary, not a measure of how small a diff can be.

Create one unit/batch when the work has:

- one coherent architectural/business purpose;
- compatible ownership and risk;
- one understandable regression surface;
- a practical verification plan.

Split work only when combining it would blur ownership, increase rollback risk, mix unrelated semantics, or make verification unreliable.

## 7. Documentation rule

Current-state documents must stay useful, but historical records remain historical.

Update current governance documents when:

- a phase is activated or closed;
- a material batch changes the continuation point;
- debt ownership changes;
- a new execution policy is adopted;
- a stale pointer would mislead the next conversation or executor.

Do not rewrite old historical reports merely because the current branch advanced.

## 8. Release-oriented decision rule

The governing question for every proposed step is:

> Does this materially reduce release risk, close a real gap, prevent regression, or preserve an important architectural boundary?

If the answer is no, the step should normally be skipped, combined, or deferred.

Perfection is not the target of reconstruction. A safe, coherent, testable Beta 2 is the target. Non-blocking debt should remain recorded and owned by the correct later phase rather than extending the active phase indefinitely.

## 9. Current Phase 3 application

For Phase 3 — Authentication, Authorization & Administrative Governance:

- perform one broad `PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT`;
- map RBAC, token/auth-context, field-level authorization, IDOR defenses and administrative controls as one coherent authorization surface;
- include the Phase-1 deferred wizard role subset, UserValidator role allowlist and server AuthenticatedUser role semantics;
- distinguish intentional context-specific role subsets from true semantic divergence before changing behavior;
- group compatible fixes into bounded batches rather than one micro-unit per role or endpoint;
- preserve Phase 4+ business-domain ownership boundaries;
- use heavier verification for authorization, privilege escalation, IDOR and admin-control changes.

This policy changes execution process only; it does not reopen closed Phase 2 work.