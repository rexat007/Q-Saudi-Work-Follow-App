# IMPLEMENTATION UNIT PROTOCOL & TEMPLATE

## Standard 11-Step Governance Workflow

Every implementation unit in the Q-Saudi reconstruction program must execute and document the following 11-step sequence:

```
Step 1: Audit
  └─ Read-only investigation of existing implementation, callers, data models, and contracts.

Step 2: Target Contract
  └─ Formal specification of expected behavior, interfaces, types, and persistence boundaries.

Step 3: Impact Map
  └─ Complete list of all files, components, services, database collections, and tests affected.

Step 4: Implementation
  └─ Bounded, clean code execution satisfying the target contract with zero scope creep.

Step 5: Automated Verification
  └─ Running vitest, tsc typechecks, and build scripts. Documenting pass/fail output.

Step 6: Manual Verification
  └─ Verifying UI alignment, RTL Arabic layout, mobile touch viewports, and edge cases.

Step 7: Scope Review
  └─ Reviewing changed files to ensure strictly expected file scope with 0 unexpected modifications.

Step 8: User Approval
  └─ Presenting full evidence report to user and obtaining explicit confirmation to proceed.

Step 9: Push
  └─ Publication by the user or an agent explicitly authorized for the reviewed scope.

Step 10: Independent GitHub Audit
  └─ Independent verification confirming GitHub commit matches verified local build state.

Step 11: CLOSED
  └─ Updating docs/reconstruction/02_PHASE_LEDGER.md to mark the unit CLOSED and advance its pointer after independent review.
```

---

## Unit Protocol Execution Contract
- **No Skipping Steps**: A unit cannot skip from Implementation directly to Push without passing Automated Verification, Scope Review, and User Approval.
- **Fail-Closed Gate**: New/unexplained regressions, unauthorized scope, and unmet unit acceptance conditions block progression. Explicitly accepted, evidenced baseline/environmental debt is reported separately without calling a failing command PASS or silently reopening closed foundation units. This is not a waiver of future release gates.
- **Evidence Recording**: Every step output must be recorded in the unit completion report.

## Applying the protocol to documentation-only P0-U5

Audit document/source authority, define the documentation contract and impact map, edit documentation only, then check links, contradictory current claims and Git scope. Product/browser execution is not newly required for unchanged product code and must not be claimed as performed. Prior evidence remains scoped to its original verification. Owner review is the next gate; commit/push/PR and formal closure are not authorized in this unit. The current phase/unit pointers live only in [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).
