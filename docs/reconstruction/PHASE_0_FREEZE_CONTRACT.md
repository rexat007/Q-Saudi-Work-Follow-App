# PHASE 0 FREEZE CONTRACT

Classification: CURRENT_SUPPORTING. The sole current phase/unit authority is [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md); debt authority is [05_DECISION_AND_DEBT_LOG.md](05_DECISION_AND_DEBT_LOG.md).

## Owner decision and transition

The owner approved Phase 0 governance closure and freeze after accepting `P0_U7_PHASE_0_CLOSURE_AUDIT_COMPLETE_READY_FOR_CLOSURE_DECISION` on authoritative main baseline `9bd5f7c971f21119ecb53717999786b8d1ad9609`.

- PHASE_0: VERIFIED / CLOSED / FROZEN.
- P0-U7: VERIFIED / CLOSED, as a governance/freeze closure, not a product-remediation unit.
- PHASE_1: NOT_STARTED / ACTIVE — Canonical Domain Model.
- ACTIVE_UNIT: UNASSIGNED / REQUIRES PHASE_1 UNIT DEFINITION.
- Publication of this documentation: NOT PUBLISHED. No P0-U7 publication/verification/merge commit is invented; record the actual merge SHA after merge. Owner scope review and independent publication review remain gates.

The accepted roadmap names Phase 1's goal: hardened entity domain interfaces, type boundaries, primary/foreign key relationships and validation schemas. It does not name a first implementation unit. This freeze does not create one or start Phase 1 work.

## Frozen foundation authorities

| Foundation | Stable contract |
|---|---|
| Repository | Current GitHub main is source of truth. The phase ledger is the single current phase/unit authority. Studio snapshots and historical release reports do not compete with it. |
| Toolchain | Node 22 (`>=22 <23`), npm (`>=10 <11`, canonical declaration `npm@10.9.8`) and `package-lock.json` remain authoritative. Dependency changes require an authorized atomic manifest/lock update; no competing lockfiles. |
| Canonical commands | Clean install: `npm ci --no-audit --no-fund`; development: `npm run dev`; build: `npm run build`; runtime: `npm start`; full-repository type/debt observation: `npm run lint` (`tsc --noEmit`). |
| Tests | Vitest remains the active automated harness with the accepted evidence taxonomy and failure propagation. `npm test` and `npm run verify:beta2` retain distinct complete-command authorities. Specialized `test:*` scripts are valid bounded checks, not substitutes for full-command success. Active/historical registers remain authoritative for classification, not automatic deletion or retirement. Retired fixed translation cardinalities remain retired; dictionary parity/counts are dynamic. |
| Documentation | Ledger current state, canonical decision/debt routing, accepted roadmap, unit protocol and historical-document boundaries remain stable. Old evidence retains its recorded scope, not current release authority. |
| CI | `.github/workflows/ci-foundation.yml` runs on PRs targeting main and pushes to main using ubuntu-24.04, pinned official actions and `contents: read` only; no repository secrets or dependency cache required. Foundation runs clean install, build, runtime-key and auth trust-boundary checks, with real failures blocking. |
| Debt observability | The separate lint job tolerates only the lint step via `continue-on-error: true`; `steps.typecheck.outcome` remains failure for a nonzero command. Explicit summary reporting is not lint PASS. Both always-run mutation guards remain blocking for staged/unstaged changes and unignored new files. External-dependent full suites remain outside foundation CI without retirement. |
| Change control | Later foundation changes require an explicit owning unit, evidence, bounded implementation, verification, owner review, publication and independent audit. A freeze is controlled stability, not a ban on future authorized change. |

Existing toolchain, test, documentation and CI contracts remain detailed supporting authorities. This contract changes no command, config, workflow, application behavior or test.

## Accepted Phase 0 exit evidence

These are the accepted read-only audit results on the baseline above, not checks rerun by this documentation implementation:

| Evidence | Accepted result |
|---|---|
| P0-A0 through P0-U6 | CLOSED, no silent reopening |
| Authority / tooling / test-authority conflicts | 0 / 0 / 0 |
| Clean install / build | PASS / PASS; package hashes unchanged |
| Runtime-key / auth trust-boundary | 16/16 PASS / 23/23 PASS |
| Lint | FAIL, exit 2; 445 diagnostics; 0 added / 0 removed versus P0-U6 |
| Diagnostic categories | ACTIVE_TEST 29; HISTORICAL_NON_ACTIVE_TEST 393; PRODUCTION 23; TOOLING_CONFIG 0 |
| Mandatory fixes / unknown diagnostics | MUST_FIX_BEFORE_PHASE_0_FREEZE 0; UNKNOWN 0 |
| Root npm test | NOT PASS, exit 1; 42 suites / 467 tests passed before the Project-Centric timeout; separate remaining-file checks 71 passed / 2 external failures. Combined scoped evidence: 538 passed / 3 external failures, not root-command PASS. |
| verify:beta2 | NOT PASS, exit 2 at lint before its test stages; separate direct Beta checks 440 passed / 3 external failures, not wrapper PASS |
| External / new / unknown failures | ENVIRONMENTAL_EXTERNAL_DEPENDENCY 6; NEW_REGRESSION 0; UNKNOWN 0 |
| CI / secrets / generated artifacts / competing lockfiles | CI_BASELINE_BLOCKER 0; TRACKED_SECRET 0; UNAUTHORIZED_GENERATED_ARTIFACT 0; COMPETING_LOCKFILE 0 |
| Transition readiness | PHASE_1_ENTRY_READY YES; no assigned first unit |

P0-U6's corrected PR runtime and post-merge main run #3 have both jobs successful and overall main SUCCESS according to the owner-confirmed closure record. The P0-U7 audit's attempt to fetch Actions metadata returned Forbidden; the audit used the accepted repository/owner record, not a new independent API confirmation.

The diagnostic count 445 is dated evidence, not a permanent invariant, ceiling or waiver for future increases. Every future diagnostic delta requires investigation and an owning disposition. Full-repository lint remains intact; no active-scope typecheck replacement, tsconfig narrowing, test deletion or new gate is introduced. The P0-U7 reassessment is complete; its accepted routing remains unresolved debt, detailed in the canonical log.

## External-test boundary

The six accepted environmental cases are:

- `projectCentricOperationsBlock87.test.ts`: the aggregate project-centric operations test, timing out on the TripNumberGenerator/Firestore path.
- `secureTripNumberingOffline89B.test.ts`: REQ-01 and REQ-13.
- `canonicalTripDispatchAuthority.test.ts`: A and U.
- `materialAuthorityP602B2.test.ts`: case 5.

These are non-blocking Phase 0 exit debt, not test retirement, proof of product correctness or product acceptance. Resolve/isolate through domain-owning phases (including Phase 10 for trip numbering), Phase 16 for broader E2E/integration verification and Phase 18 for Beta 2 release acceptance where applicable. No live credentials, emulator, test changes or production workaround are introduced here.

## What closure and freeze do not mean

Phase 0 closure does not mean zero technical debt; lint PASS; npm test PASS; verify:beta2 PASS; all product tests green; Beta 2 readiness; full browser/product acceptance; complete localization polish; full offline/external integration reliability; final security hardening; or completed future distribution architecture. Existing DD-01 through DD-04, typecheck debt, external dependency boundaries, lockfile metadata limitations and credential-filename ignore hardening remain preserved in the canonical log. Neither future distribution choices nor debt remediation are authorized by this unit.

## Current-reference consistency review

| Remaining reference family | Classification | Interpretation |
|---|---|---|
| Phase 1 NOT_STARTED / ACTIVE; unresolved lint/root/Beta debt; future verification obligations | VALID_CURRENT_REFERENCE | Administrative activation is not implementation; no failed command is renamed PASS. |
| Earlier Phase 0 IN_PROGRESS, P0-U6/P0-U7 activation and pending-verification pointers in historical ledger evidence, closed-decision snapshots and the P0-U5 review | HISTORICAL_CONTEXT | Explicit snapshot labels and the canonical current state supersede those pointers; historical records are not competing authority. |
| Unqualified current Phase 0 IN_PROGRESS, P0-U7 ACTIVE / NOT_STARTED, future-only Phase 1 or claims of complete product verification | STALE_CURRENT_CONTRADICTION | None remain in current authority/supporting claims: 0. |

This review includes the unchanged runtime-summary wording requiring P0-U7 reassessment: documentation identifies it as existing CI wording and records that the reassessment is completed. No workflow edit is made to rewrite that message.
