# IMPLEMENTATION UNIT PROTOCOL

## 11-Step Mandatory Governance Sequence

Every reconstruction unit must execute the following strict 11-step lifecycle sequence without skipping steps:

```
1. Audit
   └─ Read-only analysis of existing implementation, dependencies, and contract state.

2. Target Contract
   └─ Formal specification of expected behavior, interfaces, and persistence schemas.

3. Impact Map
   └─ Complete enumeration of affected components, API routes, tests, and database collections.

4. Implementation
   └─ Focused, clean code execution meeting all target contract requirements.

5. Automated Verification
   └─ Execution of unit tests, integration tests, typechecks, and production build verification.

6. Manual Verification
   └─ UI walkthrough, RTL layout validation, cross-device check, and edge-case testing.

7. Scope Review
   └─ Verification that only expected files were modified with 0 unexpected changes.

8. User Approval
   └─ Presentation of verification evidence and explicit confirmation request.

9. Push
   └─ Commit and push changes to GitHub main branch upon user confirmation.

10. Independent GitHub Audit
   └─ Post-push inspection verifying pushed commit matching local build output.

11. CLOSED
   └─ Recording unit completion in ACTIVE_PHASE_LEDGER and advancing active ledger pointer.
```

---

## Strict Rules
- **No Skipping**: A unit CANNOT transition directly from Implementation to Push without passing Automated Verification, Scope Review, and User Approval.
- **Fail-Closed**: Any failure at Automated Verification or Scope Review immediately halts progression and triggers root-cause remediation.
- **Evidence Preservation**: All test logs, tsc outputs, build metrics, and file diffs must be documented in the unit closing report.
