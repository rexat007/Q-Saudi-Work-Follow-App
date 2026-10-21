# Product Reconstruction Acceptance Governance

Status:
ACTIVE RECONSTRUCTION GOVERNANCE

Applies To:
ALL PRODUCT-FACING RECONSTRUCTION PHASES / UNITS

Effective:
IMMEDIATELY FOR FUTURE WORK

Retroactive Effect:
DOES NOT AUTOMATICALLY REOPEN VALID CLOSED FOUNDATION UNITS

## Canonical Reconstruction Model
Historical Problems & Decisions
        +
Current Repository Reality
        +
Current Real Product Behavior
        ↓
Canonical Product Contract
        ↓
Bounded Implementation / Remediation
        ↓
Automated Verification
        ↓
Real Browser / Workflow Verification
        ↓
Explicit User Acceptance
        ↓
Repository Closure

**Automated tests and successful builds are NECESSARY but NOT SUFFICIENT for product-facing closure.**

## Four Required Verification Layers
For every product-facing unit:

1. **LAYER 1 — PRODUCT CONTRACT**: Before implementation define intended user-visible behavior, source of truth, authority boundaries, forbidden legacy behavior, historical defects, and acceptance conditions.
2. **LAYER 2 — IMPLEMENTATION + AUTOMATED REGRESSION**: Verify implementation matches contract, relevant tests pass, build passes, no unintended repository mutation, and regression protections exist.
3. **LAYER 3 — REAL PRODUCT VERIFICATION**: Verify in real application/browser: visible rendering, interaction, state changes, navigation, forms, error handling, responsiveness, language switching, permissions, offline behavior, and workflow progression.
4. **LAYER 4 — EXPLICIT ACCEPTANCE**: The user must explicitly accept the behavior before final product-level closure.

## Historical Problem Register Requirement
For each domain, maintain:
- PREVIOUS PROBLEM
- FAILED / REJECTED APPROACH
- ACCEPTED REMEDIATION OR PRINCIPLE
- CURRENT PRODUCT CONTRACT
- REGRESSION RISK
- REQUIRED VERIFICATION

## Translation-by-Construction Rule
Any new product-facing feature must ship with its supported translations in the SAME implementation scope.
**NO UNMANAGED USER-FACING PRODUCTION STRING** (unless explicitly documented as a permitted literal).

## Real Product Acceptance Artifact
Closure documentation must record:
- browser/workflow verification performed
- exact surfaces/workflows checked
- languages/devices/roles
- defects found/resolved/deferred
- explicit user acceptance status

## User Acceptance Authority
AI Studio may report: IMPLEMENTED, TECHNICALLY VERIFIED, BROWSER VERIFIED.
AI Studio may NOT report: USER ACCEPTED, unless explicit user acceptance has been given.
Final product acceptance authority remains with the user.

## Accepted current-stage disposition (P0-U5 documentation record)

The owner accepts the merged Whole-App i18n Batches 1–4 and residual remediation at `2b52180304ac02d71b506f16dc69722c94ba9b6f` sufficiently for the current reconstruction stage. Browser review is accepted to that bounded extent. This is not a claim that every visible label was manually checked or that every future product unit or Beta 2 exit is accepted.

Some Arabic-mode views may still display mixed Arabic/English or bilingual labels. These are `DEFERRED_NON_BLOCKING_PRODUCT_DEBT`, recorded in [05_DECISION_AND_DEBT_LOG.md](05_DECISION_AND_DEBT_LOG.md), and do not reopen accepted foundation units or block continuing P0. Full cosmetic language perfection is not a prerequisite to that continuation. New product-facing work retains the translation-by-construction and four-layer acceptance rules above.

This supporting contract does not own current unit pointers; see [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). P0-U5 itself remains active and pending owner review/publication gates.
