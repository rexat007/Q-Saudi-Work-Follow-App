# IMPLEMENTATION UNIT PROTOCOL

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
  └─ Manual git push performed by the user.

Step 10: Independent GitHub Audit
  └─ Independent verification confirming GitHub commit matches verified local build state.

Step 11: CLOSED
  └─ Updating ACTIVE_PHASE_LEDGER to mark unit CLOSED and advancing active ledger pointer.
```

---

## Unit Protocol Execution Contract
- **No Skipping Steps**: A unit cannot skip from Implementation directly to Push without passing Automated Verification, Scope Review, and User Approval.
- **Fail-Closed Gate**: If any test or scope check fails, progression immediately halts until root-cause remediation is complete.
- **Evidence Recording**: Every step output must be recorded in the unit completion report.
