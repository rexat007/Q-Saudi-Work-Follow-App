# ROOT TOOLING HYGIENE CONTRACT

Status:
ACTIVE ENGINEERING GOVERNANCE

Scope:
P0-U4 — Root Tooling Hygiene

## Canonical Tooling Authority
- **Package Manager**: npm
- **Canonical Dependency Lock**: package-lock.json
- **Canonical Development Entry**: npm run dev
- **Canonical Root Test Entry**: npm test
- **Canonical Beta 2 Verification Entry**: npm run verify:beta2
- **Canonical Type/Static Check (Full-Repository Debt Observability)**: `npm run lint` (`tsc --noEmit`)
- **Canonical Build Entry**: `npm run build`
- **Canonical Runtime Entry**: `npm start`

## Static Typecheck Authority & Debt Observability
- **Canonical Command**: `npm run lint` (`tsc --noEmit`)
- **Current Role**: `FULL_REPOSITORY_DEBT_OBSERVABILITY`
- **Current Phase 0 Blocking Status**: `NON_BLOCKING FOR P0-U4`
- **Rationale**:
  - Full-repository `tsc` checks active source, active tests, historical/non-active tests, and production code.
  - Verified P0-U4 observation: 445 total diagnostics (exit code 2).
  - 393 diagnostics reside in historical/non-active test files (governed under Phase 0–16 staged convergence).
  - 29 diagnostics reside in 5 active manifest test files.
  - 23 diagnostics reside in production source code (routed to owning future phases: Smart Import, Trip Lifecycle, Admin/Exceptions).
- **Reporting Invariant**:
  - A failing full-repository `npm run lint` MUST NOT be described as PASS.
  - It must be recorded truthfully as: `RECORDED TYPECHECK DEBT / EXIT 2` until the underlying debt is resolved.
  - No artificial `tsconfig.json` scoping or exclusion narrowing is authorized merely to produce clean exit codes.

## Active Test Typecheck Debt
- **Current Active Test Gap**: 5 active manifest test files, 29 diagnostics total.
  1. `src/tests/finalUiArchitectureBlock76.test.ts` (14 diagnostics)
  2. `src/tests/i18nTranslationCatalog.test.ts` (1 diagnostic)
  3. `src/tests/i18nTranslationGeneration.test.ts` (2 diagnostics)
  4. `src/tests/projectCentricOperationsBlock87.test.ts` (5 diagnostics)
  5. `src/tests/projectFormDateUx86F.test.ts` (7 diagnostics)
- **Runtime Verification**: All 5 test files currently PASS under their respective canonical Vitest executions.
- **Classification**: `ACTIVE_TEST_TYPECHECK_DEBT`
- **Disposition**: `DEFERRED_TO_P0_U7_REASSESSMENT`
- **Taxonomy Boundary**: P0-U3 remains verified and closed for Test Taxonomy & Harness Convergence; it did not eliminate all TypeScript diagnostics from all active tests. Active test typecheck debt will be reassessed prior to Phase 0 freeze (P0-U7).

## Root Test Contract
- `npm test`: Executes 48 distinct root test suites.
- `verify:beta2`: Executes 19 distinct additional Beta 2 verification suites.
- These represent distinct, non-overlapping verification surfaces.
- Current sequential execution is accepted. Refactoring is forbidden unless proven broken by concrete defect.

## Specialized Script Contract
- Dedicated `test:*` scripts are valid development/debugging entrypoints.
- Retirement requires reachability/provenance review.

## Vitest Config Contract
- `vitest.config.ts` (globals: true, environment: node) is authoritative.
- No workspace/project conversion or include/exclude redesign is authorized.

## Package Lock Contract
- `package.json` and `package-lock.json` must remain synchronized.
- No lockfile mutation is allowed unless caused by authorized dependency change.

## scripts/** Contract
- Active referenced scripts: `scripts/run-codemod-dry-run.ts`, `scripts/run-codemod-apply.ts`.
- Historical unreferenced scripts remain. Removal requires reachability proof.

## AI Studio Tooling Contamination Guard
- GitHub `main` is repository authority.
- Google AI Studio auto-migration/import modifications are NOT authoritative.
- Package-lock, config rewrites, or generated artifact changes caused solely by Studio migration must NOT be accepted.

## Generated Mutation Guard
- Canonical verification commands must not mutate tracked files (package-lock.json, reports/**, src/locales/**, config files).
- Tracked mutations are verification failures.
