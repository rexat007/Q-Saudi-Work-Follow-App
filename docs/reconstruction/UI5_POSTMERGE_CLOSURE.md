# UI5 post-merge source closure — 2026-11-21

## CURRENT SOURCE CLOSURE — 2026-11-21

UI5 = MERGED / MAIN_SOURCE_VERIFIED / SOURCE_CLOSED. UI5-PUB-01 = MERGED / PERMANENT_CONTEXT_RETIREMENT_VERIFIED / SOURCE_CLOSED. UI5-IR01 = MERGED / TARGET_ADMISSION_VERIFIED / SOURCE_CLOSED. UI6 = NOT_STARTED / TARGET_DISCOVERY_ONLY / OWNER_REVIEW_PENDING.

PR [#106](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/106) merged at 2026-11-21T06:36:58Z. Verified main `9fda05f22888e97cd9538c7c32cb8c225c893376`; parents `08f67b6046cc10e2ee6f3cd8387bcf7bffcaf551` and final feature `689cff352aeb8927f30757fc31bae4f901dd38b1`. Merge/candidate tree `26d930a9f1c03508461a54c53a73e0e266319cac`; all37 PR paths verified. Required post-merge CI [44876381349](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/44876381349) completed SUCCESS on the exact merge SHA: Required foundation, Typecheck debt observability and PostgreSQL 17 authority regressions all SUCCESS. Dynamic CI [44876380867](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/44876380867) completed SUCCESS on that SHA: Analyze (python) and Analyze (actions). The previously pending PostgreSQL gate is now completed, directly observed.

The permanent authorization leases and synchronous unresolved-target admission guard remain intact. Final recorded affected326/329 is **NOT PASS**, with exactly three unchanged inherited failures. IR01 10/10, previous UI5 76/76 and PUB01 27/27 pass (PUB01 is included in76). Historical316/319, original failed/interrupted attempts and raw red-to-green evidence remain unchanged. Prior Edge9/9 and authenticated emulator1/1 are historical **pre-IR01/pre-merge**, not fresh post-merge acceptance. No tests/browser/emulator journeys were rerun in this documentation-only task.

This closes source only. Physical-device, screen-reader, live operational/Google Workspace, product and Beta2 acceptance remain separate and unaccepted. Firestore remains canonical operational authority. SQL cutover, dual writes, deployment, RB4/migration013 activation and UI6 implementation remain unauthorized. All22 protected worktrees and RB4 original nine dirty files/unpublished013 are preserved. No commit, push, PR or merge occurs in this task.

Current authority: [UI5 post-merge closure](UI5_POSTMERGE_CLOSURE.md), [source/CI evidence](ui5/postmerge-closure.json). All earlier sections below are preserved verbatim historical snapshots; their earlier HOLD/publication gates and timestamps do not override this verified source closure.

## Exact source preflight and CI boundary

The second parent is an ancestor of main. Both merge and reviewed candidate have the exact tree above. First-parent Git diff equals the GitHub PR inventory:37 paths,8 production/9 tests-fixtures/20 docs-evidence. All paths exist. AdminConsoleView Git blob remains `b978d4d37911f28db3b793aa18a7946cce6cbe4b`.

Required CI is attempt1, push on main, exact merge SHA; updated 2026-11-21T06:38:24Z. The actual full-repository typecheck step succeeded, not merely a tolerated job outcome. Dynamic run is attempt1, exact merge SHA, updated 2026-11-21T06:37:57Z; its observed scope is Python and Actions, not a claim of complete application security acceptance.

| Job | Job ID | Directly observed result |
| --- | --- | --- |
| PostgreSQL 17 authority regressions | 136761882332 | completed / success |
| Required foundation | 136761882525 | completed / success |
| Typecheck debt observability | 136761882535 | completed / success |
| Analyze (python) | 136761883302 | completed / success |
| Analyze (actions) | 136761883512 | completed / success |

Normalized run metadata and all job/step results are preserved in [postmerge-closure.json](ui5/postmerge-closure.json).

## Correction continuity

PUB01: authorization-key transitions replace identity and advance generation. Each keyed workspace captures an immutable mount lifetime; layout cleanup retires that lifetime permanently. Target generations and production client's post-token UID/current-context check remain intact.

IR01: the shared decision boundary synchronously reads `uncertain.current.get(targetId)?.status` and returns for unresolved targets before token acquisition/HTTP. Direct Suspend/Reactivate, modal decisions, role/project changes and binding all use this boundary. State-only read does not replay an unknown command or clear its hold. The unrelated-target and confirmed/rejected controls remain in the historical10/10 evidence. Source review here confirms the corrected blob, not a newly executed browser journey.

## Inherited failures (exact identities)

- `adminConsoleConvergence.test.ts`: Phase 6 — AdminConsole Canonical Authority Convergence Verification 4. AdminConsoleView subscribes to projectRepository with assignedProjectIds & isSuperAdmin
- `adminConsoleConvergence.test.ts`: Phase 6 — AdminConsole Canonical Authority Convergence Verification 5. AdminConsoleView subscribes to canonical userRepository
- `adminConsoleConvergence.test.ts`: Phase 6 — AdminConsole Canonical Authority Convergence Verification 6. AdminConsoleView subscribes to canonical auditLogService

No historical test bytes, failures or raw archives were modified. UI4's separate14 inherited identities remain untouched and are not combined with this different affected-suite population. Original PUB01 failure1/1 and IR01 red4/10 remain in their original archives, alongside later passing results. Old UI5 inventories/seals and the IR01 manifest describe their dated publication stages; this new record owns the merged37-path verification.

## Final merged PR inventory (37)

- `docs/reconstruction/00_WORK_START_HERE.md`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/MASTER_PROJECT_HANDOFF.md`
- `docs/reconstruction/UI4_OPERATIONAL_REPORTS.md`
- `docs/reconstruction/UI5_ACCOUNT_REVIEW.md`
- `docs/reconstruction/UI5_IR01_DECISION_ADMISSION.md`
- `docs/reconstruction/UI5_PUB01_RETIREMENT.md`
- `docs/reconstruction/UI5_TARGET_DISCOVERY.md`
- `docs/reconstruction/ui4/postmerge-closure.json`
- `docs/reconstruction/ui5/README.md`
- `docs/reconstruction/ui5/evidence-sha256.json`
- `docs/reconstruction/ui5/exact-file-inventory.json`
- `docs/reconstruction/ui5/failure-comparison.json`
- `docs/reconstruction/ui5/ir01-raw.zip`
- `docs/reconstruction/ui5/ir01-verification.json`
- `docs/reconstruction/ui5/pub01-raw.zip`
- `docs/reconstruction/ui5/source-contract.json`
- `docs/reconstruction/ui5/verification-raw.zip`
- `docs/reconstruction/ui5/verification.json`
- `src/components/admin/AdminConsoleView.tsx`
- `src/components/admin/DriverAccountBindingControl.tsx`
- `src/components/admin/adminDecisionReadback.ts`
- `src/locales/ar/index.ts`
- `src/locales/en/index.ts`
- `src/locales/ur/index.ts`
- `src/repositories/user.repository.ts`
- `src/services/adminAccountClient.service.ts`
- `src/tests/helpers/ui5AccountBrowserEntry.tsx`
- `src/tests/helpers/ui5ConnectedBrowserEntry.tsx`
- `src/tests/ui5AccountBrowser.test.ts`
- `src/tests/ui5AccountConnectedJourney.test.ts`
- `src/tests/ui5AccountReadback.test.ts`
- `src/tests/ui5AccountReview.test.tsx`
- `src/tests/ui5AccountTransport.test.ts`
- `src/tests/ui5Ir01DecisionAdmission.test.tsx`
- `src/tests/ui5Pub01Retirement.test.tsx`

## Protected work and next owner gate

An isolated documentation checkout at the merged SHA is used. The original UI5 feature checkout remains clean on689cff; all22 legacy protected HEAD/status/dirty hashes, including RB4 nine original dirty files and unpublished013, matched preservation proof. No protected checkout was switched, reset or cleaned. CI PostgreSQL success does not authorize SQL/RB4 activation.

UI6 discovery follows source reconciliation; proposed boundaries are recorded in [UI6_TARGET_DISCOVERY.md](UI6_TARGET_DISCOVERY.md). Owner review is required before any UI6 implementation. This task makes no commit/push or production/test change. Product/operational acceptance remains independent of source closure.
