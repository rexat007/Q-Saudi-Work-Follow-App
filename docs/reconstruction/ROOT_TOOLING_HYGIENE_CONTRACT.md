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
- **Recorded P0-U4 Blocking Disposition**: `NON_BLOCKING FOR P0-U4` (the unit is now closed)
- **Rationale**:
  - Full-repository `tsc` checks active source, active tests, historical/non-active tests, and production code.
  - Recorded P0-U4 observation: 445 total diagnostics (exit code 2); this is dated evidence, not a frozen expected count.
  - 393 diagnostics reside in historical/non-active test files (governed under Phase 0–16 staged convergence).
  - 29 diagnostics reside in 5 active manifest test files.
  - 23 diagnostics reside in production source code (routed to owning future phases: Smart Import, Trip Lifecycle, Admin/Exceptions).
- **Reporting Invariant**:
  - A failing full-repository `npm run lint` MUST NOT be described as PASS.
  - It must be recorded truthfully as: `RECORDED TYPECHECK DEBT / EXIT 2` until the underlying debt is resolved.
  - No artificial `tsconfig.json` scoping or exclusion narrowing is authorized merely to produce clean exit codes.

## Active Test Typecheck Debt
- **Recorded P0-U4 Active Test Gap**: 5 active manifest test files, 29 diagnostics total; no typecheck is newly executed by P0-U5.
  1. `src/tests/finalUiArchitectureBlock76.test.ts` (14 diagnostics)
  2. `src/tests/i18nTranslationCatalog.test.ts` (1 diagnostic)
  3. `src/tests/i18nTranslationGeneration.test.ts` (2 diagnostics)
  4. `src/tests/projectCentricOperationsBlock87.test.ts` (5 diagnostics)
  5. `src/tests/projectFormDateUx86F.test.ts` (7 diagnostics)
- **Runtime Evidence**: P0-U4 reported these suites passing at its verification point. This is not a current blanket PASS; later unchanged Firestore/proxy timeouts are environmental failures and must be reported as such.
- **Classification**: `ACTIVE_TEST_TYPECHECK_DEBT`
- **Disposition**: `DEFERRED_TO_P0_U7_REASSESSMENT`
- **Taxonomy Boundary**: P0-U3 remains verified and closed for Test Taxonomy & Harness Convergence; it did not eliminate all TypeScript diagnostics from all active tests. P0-U7 completed the accepted exit reassessment; unresolved active-test families remain routed in the canonical debt log, not waived by the freeze.

## Root Test Contract
- At the P0-U5 main baseline, `npm test` explicitly invokes 48 distinct Vitest files sequentially with `&&`.
- `verify:beta2` first runs `npm run lint`, `npm run build`, and `npm run test:reports-dashboard-80`, then directly invokes 19 additional Vitest files.
- The direct 19-file Beta set is disjoint from the 48-file root set. The complete Beta wrapper also runs `fieldReportsCentralDashboardBlock80.test.ts` via its helper; that file is shared with root. Thus the wrapper covers 20 distinct test files with one overlap, not zero overlap overall.
- These are distinct authorities; one command or selected targeted suites cannot be reported as proof that the other complete command passed. The Beta wrapper short-circuits at nonzero lint; direct Beta suite results are separately scoped evidence.
- The observed file counts describe current package scripts, not permanent fixed suite/cardinality invariants.
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

## Current execution and closure boundary

Current state and unit ordering defer to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). P0-U4 remains verified/closed. The historical 445 = 393 non-active test + 29 active test + 23 production diagnostic split records its verification snapshot; it does not define an allowed permanent ceiling. New diagnostics require investigation; the accepted P0-U7 reassessment and future family ownership are recorded in the canonical debt log. P0-U5 updates documentation without narrowing typecheck, changing scripts/configs, migrating tests or rerunning product verification.

## P0-U6 secret-free foundation CI

[CI_BASELINE_CONTRACT.md](CI_BASELINE_CONTRACT.md) defines `.github/workflows/ci-foundation.yml`: PRs targeting main and pushes to main, ubuntu-24.04, Node 22 and npm 10.x authority, SHA-pinned official actions, read-only contents permission, no secrets and no dependency cache. Local verified npm is 10.9.8; hosted versions are printed and checked before installation.

The independent foundation gate runs unchanged `npm ci --no-audit --no-fund`, build, `test:i18n-runtime` and `test:auth-trust-boundary`. A separate full-repository lint job preserves the command failure through `steps.typecheck.outcome`, using step-level `continue-on-error: true` only on `npm run lint`. No job-level tolerance or shell suppression is used. Its always-run summary distinguishes command failure from independent foundation success and retains the P0-U7 reassessment instruction in its runtime summary; that reassessment is now completed and recorded in the debt log, while remediation remains open. If lint debt is the only failure, that job succeeds; the workflow succeeds only when foundation, mutation guards and all other steps succeed. This is NOT lint PASS. The owner confirmed corrected PR verification and post-merge main run #3: both jobs and the main workflow succeeded. Branch required-check selection is not changed. Both jobs always check staged/unstaged changes and new unignored files. Ignored build outputs are allowed.

`CURRENT_EXTERNAL_DEPENDENCY_BOUNDARY`: root npm test and verify:beta2 retain their canonical authority but are not foundation gates; their existing Firestore paths and Beta lint short-circuit do not establish a secret-free hosted PASS. No tests are retired, migrated or weakened. No deployment/release authority is granted. P0-U6 is VERIFIED / CLOSED at independently audited merge `54f6d829c184a371e96c2812b08738c42280552b`; P0-U7 is VERIFIED / CLOSED by the owner-approved governance freeze. Its debt reassessment is complete; existing TypeScript debt remains unresolved and is not waived by CI or Phase 0 closure. Local lint observed exit 2 / 445 diagnostics with zero signature differences from the accepted final-residual run; this is dated evidence and never a permanent allowed count.

## Phase 0 freeze disposition

[PHASE_0_FREEZE_CONTRACT.md](PHASE_0_FREEZE_CONTRACT.md) stabilizes these tooling authorities without changing commands, config, dependencies or CI behavior. At the historical Phase 0 exit snapshot, Phase 1 — Canonical Domain Model was NOT_STARTED / ACTIVE, with its unit unassigned. Current phase/unit status belongs only to the ledger. Phase 0 is VERIFIED / CLOSED / FROZEN under the owner decision; P0-U7 publication is MERGED / VERIFIED through PR #9 at `3b0fc03d27a4b663e85d330f581550c37d62999d`; the canonical ledger records its publication commit. Lint exit 2 / 445 is the accepted audit snapshot, not an allowed permanent threshold; root npm test and verify:beta2 are NOT PASS. No future diagnostic increase is pre-approved.
