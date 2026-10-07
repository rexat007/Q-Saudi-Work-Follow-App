# TEST TAXONOMY AND HARNESS CONTRACT
## Q-Saudi Work Follow Reconstruction — Phase 0

This document defines the canonical test evidence taxonomy, execution harness standards, environment requirements, failure propagation rules, and historical test governance for the Q-Saudi repository reconstruction.

---

## 1. Canonical Evidence Taxonomy

Every automated and semi-automated test in the repository must be classified into exactly one primary taxonomy class:

### 1.1 UNIT
- **Purpose**: Verifies pure algorithms, arithmetic formulas, domain calculators (pricing rules, tare/gross variances), string formatters, validators, and utility functions in complete isolation.
- **Expected Harness**: Vitest Native (`vitest run`).
- **Normal CI Allowed**: YES (Mandatory).
- **Environment Requirements**: `node` / Pure Logic.
- **Failure Semantics**: Assertion throw (`expect(...)`) leading to immediate non-zero test suite exit code.
- **External / Network Dependencies**: Strictly PROHIBITED. Zero network, zero disk I/O, zero database access.

### 1.2 INTEGRATION_MOCK
- **Purpose**: Verifies multi-component collaboration, domain services, repositories, and state machines using controlled in-memory doubles or mocked backend services (e.g. Firestore mock, in-memory collection).
- **Expected Harness**: Vitest Native (`vitest run`).
- **Normal CI Allowed**: YES (Mandatory).
- **Environment Requirements**: `node` / In-Memory Mock Context.
- **Failure Semantics**: Assertion throw leading to immediate non-zero process exit code.
- **External / Network Dependencies**: Strictly PROHIBITED. All database and network clients must be mocked in-memory.

### 1.3 SERVER_CONTRACT
- **Purpose**: Verifies Express server routes, middleware chains, authentication token validation, session persistence, and server-authoritative mutations.
- **Expected Harness**: Vitest Native (`vitest run`) using Supertest or Node HTTP client against local ephemeral test server.
- **Normal CI Allowed**: YES (Mandatory).
- **Environment Requirements**: `node` / Ephemeral Server Context.
- **Failure Semantics**: HTTP status / schema mismatch leading to assertion throw and non-zero process exit code.
- **External / Network Dependencies**: Strictly PROHIBITED. No real external GCP or Firebase project; uses local server memory/mock persistence.

### 1.4 UI_DOM
- **Purpose**: Verifies React component rendering, user interactions, stepper transitions, form input handling, and direction-safe RTL Arabic layouts.
- **Expected Harness**: Vitest Native (`vitest run`) with `@testing-library/react` and `happy-dom`.
- **Normal CI Allowed**: YES (Mandatory).
- **Environment Requirements**: `happy-dom` / Browser-like DOM.
- **Failure Semantics**: DOM query failure or assertion throw leading to non-zero process exit code.
- **External / Network Dependencies**: Strictly PROHIBITED.

### 1.5 STATIC_GOVERNANCE
- **Purpose**: Verifies repository structural rules, AST patterns, i18n key count freeze (1,128 keys across AR/EN/UR), secret-free codebase hygiene, documentation cross-references, and code retired symbol isolation.
- **Expected Harness**: Vitest Native (`vitest run`) with `node:fs` reading workspace source files.
- **Normal CI Allowed**: YES (Mandatory).
- **Environment Requirements**: `node` / Local Filesystem Read Access.
- **Failure Semantics**: Pattern violation throw leading to non-zero process exit code.
- **External / Network Dependencies**: Strictly PROHIBITED.

### 1.6 LIVE_E2E
- **Purpose**: Validates complete end-to-end user journeys against deployed environments, real Firestore databases, or live cloud services.
- **Expected Harness**: Specialized Playwright / Vitest E2E suite executed via dedicated, isolated scripts.
- **Normal CI Allowed**: NO. Must NEVER be silently included in normal unit/integration CI.
- **Environment Requirements**: Network connectivity, staging credentials, live backend services.
- **Failure Semantics**: Process exit code 1 with diagnostic trace.
- **External / Network Dependencies**: ALLOWED and EXPECTED in dedicated staging pipeline.

### 1.7 MANUAL_UI
- **Purpose**: Diagnostic tools, human review portals, one-off report generators (e.g. `runBlock86CReport.ts`), and visual exploratory verification harnesses.
- **Expected Harness**: Standalone node/tsx script located under `scripts/`.
- **Normal CI Allowed**: NO.
- **Environment Requirements**: Node runtime / Developer workspace.
- **Failure Semantics**: Diagnostic output to stdout/filesystem.
- **External / Network Dependencies**: Dependent on tool purpose.

---

## 2. Binding Canonical Harness Rules

### Rule A: Vitest is the Canonical Automated Harness
Vitest is the sole canonical test framework for all automated tests (`UNIT`, `INTEGRATION_MOCK`, `SERVER_CONTRACT`, `UI_DOM`, `STATIC_GOVERNANCE`). All active automated test files must run via `vitest run`.

### Rule B: Strict Non-Zero Failure Propagation
Every automated test MUST terminate with a non-zero process exit code (`exit code 1` or greater) whenever any required assertion or test block fails. A test run that finishes with exit code `0` despite internal failures is an invalid test.

### Rule C: Console Output Alone is Not Failure Propagation
Logging `❌ [FAIL]` or printing error messages to `console.log` or `console.error` without throwing an uncaught Error or explicitly exiting non-zero is strictly prohibited in automated test suites.

### Rule D: Custom Test Runners Require Explicit Justification
Custom procedural test runners (defining ad-hoc `test()` functions, global counters, or procedural loops) are non-canonical legacy patterns. New custom runners are prohibited. Existing active custom runners must be converged to canonical Vitest suites in Phase 0.

### Rule E: Isolation of E2E and Manual Suites
`LIVE_E2E` and `MANUAL_UI` scripts must never be bundled into default `npm test` or `verify:*` scripts. They must be gated behind explicit standalone commands with prerequisite credential checks.

### Rule F: Isolation of External & Secret Dependencies
Tests requiring live secrets, cloud service accounts, external network endpoints, or Firebase project writes must be strictly isolated. Normal CI suites must be 100% self-contained and runnable offline.

### Rule G: Historical Test Preservation Rule
Historical test files must NOT be deleted solely because they are not currently referenced in `package.json`. Stale test files represent historical design intent and audit trails.

### Rule H: Phase-Owned Historical Test Governance
Every historical or unreferenced test file must be mapped to its owning reconstruction roadmap phase across Phase 0 through Phase 16. Phase 0 ownership is permitted ONLY when the test genuinely concerns repository foundation, tooling, reconstruction governance, architectural/static foundation, or historical foundation verification; domain-specific application tests must remain assigned to their proper domain reconstruction phases rather than being assigned to Phase 0. Where ownership is uncertain, it must remain explicitly designated as `UNKNOWN`. The owning phase bears responsibility for evaluating, reactivating, migrating, or retiring the test when reconstructing that domain.

### Rule I: Prohibition of Speculative Production Code Changes
Production code, domain models, or service contracts must NEVER be modified merely to make stale historical tests compile or pass during Phase 0. Domain contract fixes belong exclusively to the reconstruction phase that owns that domain.

### Rule J: Behavioral Invariance in Test Migration
Migrating an active custom test runner to Vitest must preserve the exact behavioral verification intent. Harness conversion must never weaken, skip, or silently alter assertions.
