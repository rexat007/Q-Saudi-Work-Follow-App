# SECURITY SPECIFICATION: PHASE 0 SECURITY TDD
## PROJECT-CENTRIC OPERATIONS ARCHITECTURE

---

## 1. Executive Security & Authorization Philosophy

This system serves as the operational and financial core of a heavy material transportation tracking ecosystem in Saudi Arabia. Because trip records determine payouts to carriers, billing to clients, and compliance with the **ZATCA (Zakat, Tax and Customs Authority)** regulations, security is a non-negotiable architectural foundation.

Our security model follows the **Zero Trust Principle** and is implemented through **Test-Driven Development (TDD)**:
1. **Tenant Isolation by Default**: No user may read or modify any resource outside of their assigned projects.
2. **Immutable Audit Trails**: Every operation involving carrier roster changes, trip creations, or settlement adjustments must be permanently recorded in an append-only audit subcollection.
3. **Role-Based Access Control (RBAC)**: Least privilege access is strictly enforced. Operational field agents may request adjustments, but only authorized, high-privilege roles can approve financial modifications.
4. **Deterministic Calculation**: All financial calculations (VAT, Subtotal, Adjustments) are performed in a server-authoritative context to prevent client-side manipulation.

---

## 2. Multi-Tenant Project Isolation Boundary

The entire application state is partitioned hierarchically under project nodes.

```
/projects/{projectId}/
  ├── roster/{rosterEntryId}         <-- Carrier roster entries
  ├── trips/{tripId}                 <-- Trip records
  └── adjustments/{adjustmentId}     <-- Financial adjustments
```

### Access Gating Rule:
For any operation on project-scoped resources, the system must verify that:
* The user's role is `SUPER_ADMIN` (granted global system-wide access).
* **OR** the requested `projectId` is explicitly listed in the user's `assignedProjectIds` array.

If neither condition is met, the system must throw a `PERMISSION_DENIED` security error immediately before executing any database or service operation.

---

## 3. Role-Based Access Control (RBAC) Matrix

The system supports 6 distinct roles. The operational matrix below defines exactly which role can execute which action under project-centric scopes:

| Role | Project Master CRUD | Project Roster CRUD | View Project Data | Request Adjustment | Approve/Reject Adjustment |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **PROJECT_ADMIN** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **FINANCE_AUDITOR** | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes |
| **SITE_SUPERVISOR** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **DRIVER** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **VIEWER** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |

### Key Constraints:
1. **Project Master CRUD**: Creating, editing, or deleting project nodes is strictly limited to `SUPER_ADMIN` to prevent project-level directory pollution.
2. **Roster CRUD**: Only `SUPER_ADMIN` and `PROJECT_ADMIN` assigned to the project may insert, update, or remove drivers and trucks from the Project Carrier Roster.
3. **Financial Adjustment Approvals**: Only `PROJECT_ADMIN`, `FINANCE_AUDITOR`, or `SUPER_ADMIN` are permitted to approve adjustments. `SITE_SUPERVISOR` can only *request* them. `DRIVER` role cannot interact with adjustments in any way.

---

## 4. Settlement Recalculation & Financial Math Engine

Financial adjustments modify base pricing snapshots on individual trips. To comply with auditing, the original agreed pricing remains as an immutable historical record; the final billing amount is dynamically recalculable upon adjustment approval.

### ZATCA VAT & Total Math Formulas:
Upon approval of any `SettlementAdjustment`:
1. **Apply Rate Adjustments**:
   $$\text{Agreed Rate} = \text{Original Agreed Rate} \pm \text{Rate Adjustment}$$
2. **Apply Base Amount Recalculation**:
   $$\text{Base Amount} = \text{Billable Weight (Tons)} \times \text{Agreed Rate}$$
3. **Apply Subtotal Math**:
   $$\text{Subtotal} = \text{Base Amount} + \text{Demurrage} - \text{Deductions}$$
4. **ZATCA Standard VAT Application (15%)**:
   $$\text{VAT Amount} = \text{Subtotal} \times 0.15$$
5. **Total Settlement Math**:
   $$\text{Total Amount} = \text{Subtotal} + \text{VAT Amount}$$

*Note:* Floating point numbers must be rounded to exactly **two decimal places** (`.toFixed(2)` or equivalent rounding utilities) to prevent rounding leakage in ledger statements.

---

## 5. Security Audit Logging Protocol

An immutable, append-only security log is required to capture all lifecycle mutations. The structure is validated by `AuditLogValidator` before persistence.

### Required Fields for Every Audit Log:
* `auditLogId`: Unique string prefix `AUD-...`
* `projectId`: The project identifier under which the mutated resource resides.
* `entityType`: The type of entity mutated (`PROJECT`, `PROJECT_ROSTER`, `TRIP`, `TRIP_ADJUSTMENT`).
* `entityId`: The unique identifier of the modified resource.
* `action`: The action taken (`CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`).
* `actor`: Object containing the logged-in user's metadata (`userId`, `email`, `role`, `ipAddress`, `userAgent`).
* `changes`: Object containing the delta snapshot:
  * `before`: The state of the record before the mutation (or `null` on creation).
  * `after`: The state of the record after the mutation (or `{}` on deletion).
  * `deltaFields`: An array of strings representing names of fields that were updated.
* `correlationId`: For grouping related operations across microservices or transactions.

---

## 6. Phase 0 Security TDD Test Specifications

To guarantee the enforcement of these parameters, the test suite in `src/tests/projectCentricOperationsBlock87.test.ts` validates 13 crucial, automated test cases:

```typescript
// Test Cases Specification
1.  "Project numbers are sequential and start from 1"
    -> Validates that when projects are created concurrently, their integer identifiers form a dense, gapless sequence.
2.  "Project numbers are formatted as Q-PRJ-0001 correctly"
    -> Confirms the ZATCA-compliant zero-padded display strings.
3.  "Project number generation is concurrency safe and unique"
    -> Runs multiple simultaneous creations through transactional sequence gates to ensure zero duplicate numbers.
4.  "Trip numbers embed project number and are sequential per project"
    -> Verifies project-scoped trip sequence boundaries (e.g. Q-PRJ-0001-TRP-00001).
5.  "Project Carrier Roster entry can be created with authorized fields and audit metadata"
    -> Asserts correct validation of driverName, plateNumber, residencyId, and materialId.
6.  "Project Carrier Roster entries can be listed per project"
    -> Verifies that listing rosters of a specific project succeeds.
7.  "Project Carrier Roster entry can be modified with active auditing"
    -> Confirms field updating and validation behavior.
8.  "Project Carrier Roster entry can be deleted cleanly"
    -> Ensures roster deletion behaves correctly and does not leave orphaned references.
9.  "Project Carrier Roster enforces cross-project security isolation strictly"
    -> Tests multi-tenant isolation by verifying that a supervisor assigned only to Project A receives a permission denied exception when attempting to read the roster of Project B.
10. "Settlement adjustments can be requested by site supervisors"
    -> Confirms that a SITE_SUPERVISOR can successfully create a REQUEST status adjustment.
11. "Rejects settlement adjustment approval requests from unauthorized roles (DRIVER)"
    -> Validates that DRIVER role attempts to approve are blocked by RBAC controls.
12. "Recalculates trip baseAmount, demurrage, deductions, ZATCA VAT, and totalAmount correctly upon adjustment approval"
    -> Checks the financial math engine output against expected results.
13. "All roster mutations and adjustment approvals are fully logged to the immutable audit trail"
    -> Scans the audit ledger to prove a complete, compliant audit trail exists for every state transition.
```

By enforcing a passing status on these test parameters before release, we establish mathematical confidence in the security of the operations platform.
