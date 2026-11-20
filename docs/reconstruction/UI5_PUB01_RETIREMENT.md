## CURRENT UI5 CONTROLLED PUBLICATION CANDIDATE — 2026-11-20

UI5 = SOURCE_IMPLEMENTED / AWAITING_INDEPENDENT_REVIEW. UI5-PUB-01 is corrected and its permanent-retirement review passed. UI4 = MERGED / SOURCE_CLOSED. UI6 = NOT_STARTED. The owner has now authorized one implementation commit, normal push to `ui/ui5-account-review-20261120` and a draft PR against main, conditional on the final gates. This candidate record precedes remote publication; remote SHA, draft PR and CI conclusions must be verified from GitHub and the publication receipt, not inferred from this text. Merge, deployment, SQL cutover and RB4 activation remain unauthorized.

Final scope remains33 paths:8 production/8 tests-fixtures/17 docs-evidence. Seven inherited document bodies and original failed publication evidence remain preserved. The final publication recheck reports316/319 with the same three inherited failures, all76 UI5 cases and27 retirement cases passing, unchanged original regression1/1 passing, and runtime16/16 passing. Exact production/test hashes match the previously successful TypeScript/lint/build, Edge9/9 and authenticated emulator1/1 evidence. Broad aggregate remains NOT PASS; physical-device, screen-reader, live operational/provider and product/Beta2 acceptance remain separate. See [current inventory](ui5/exact-file-inventory.json), [verification including new raw recheck output](ui5/verification.json) and [retirement audit](UI5_PUB01_RETIREMENT.md). Earlier dated gates below are preserved historical snapshots and do not override this publication authorization or the owner merge gate.

# UI5-PUB-01 — Permanent authorization context retirement

## Current source review — 2026-11-20

UI5-PUB-01 is corrected locally and ready for OWNER REVIEW. UI5 remains SOURCE_IMPLEMENTED / OWNER_REVIEW_PENDING; publication is NOT authorized. UI4 remains MERGED / SOURCE_CLOSED. Main/HEAD remains `08f67b6046cc10e2ee6f3cd8387bcf7bffcaf551`. No commit, push, PR, merge, deployment, SQL, RB4 or UI6 action occurred.

The original publication audit HOLD is preserved unchanged, including its failing test/assertions, logs and SHA seal, inside [new raw evidence](ui5/pub01-raw.zip), under `publication-audit-original/`. This addendum records the correction and new local results; it does not rewrite that historical audit to imply it passed.

## Root cause and bounded correction

The old parent ref compared a reusable actor/role/status/authority/project string. Returning A-B-A restored equality; a pending read in an old keyed workspace could resume `replaceAssignedProjects` after `changeUserRole` had already committed. The original real-component reproduction was rerun before editing: 1/1 FAIL, `isCurrent=true`, two commands.

Only two production files changed relative to the reviewed 30-path UI5 candidate: AdminConsoleView replaces authorization identity and advances a generation on every effective key transition, and each workspace captures an immutable lifetime object whose layout cleanup permanently retires it. Async operations capture that particular lifetime rather than whatever later object occupies the ref. StrictMode replay creates a new lifetime. Existing target generations still retire X-Y-X operations. adminDecisionReadback adds explicit checks before authoritative read and after its UI callback. No global state or authorization policy was added.

The existing account client already checks UID and the captured `isCurrent` after token acquisition, immediately before fetch. Those service bytes remain unchanged; the predicate now stays retired permanently. Server/Rules, transactions, last viable SUPER_ADMIN, self-action protection, driver identity authority and PROJECT_ADMIN read-only behavior remain unchanged.

## Async-boundary audit

| Boundary | Permanent continuity check |
| --- | --- |
| Initiation | Capture workspace lifetime and authorization generation; synchronous duplicate guard |
| Token -> HTTP | Existing production client checks captured predicate and UID after token await, immediately before fetch |
| ACK/error | Captured operation checked after execute resolves/rejects |
| Next command | Same captured predicate checked before every subsequent command |
| Authoritative read | Guard before and after read; caller checks before publication; guard after callback |
| UI outcome/draft/banner | Captured operation checked before publishing; pending cleanup only in captured live workspace |
| USERS/PROJECTS/AUDIT | Independent captured lifetimes plus per-source request sequences |
| Unmount/target/StrictMode | Permanently retired mount token; fresh replay token; target generation never reused |

An already transmitted command may commit. Retirement is neither cancellation nor rollback. Unknown outcomes are not replayed and no compensating permission mutation is added. New actor/authorization workspaces receive fresh state rather than inheriting a prior pending decision.

## Red-to-green and final verification

- Exact original external test/assertions: 1/1 FAIL before correction -> 1/1 PASS after correction. It now records `isCurrent=false`, only `changeUserRole`. Its unchanged case is also appended to the existing component suite and identified separately from historical failure debt.
- 27 new real-component/production-client boundary cases PASS. They count intercepted fetch invocations, not mocked execute success flags. They cover role, UID, authority, status and project A-B-A during token/readback; role/actor A-B-A during ACK; X-Y-X; unmount/remount; duplicate clicks; late reads/errors; StrictMode; lifecycle/driver commands; and uninterrupted role/read/project/read ordering. Retired tokens send zero HTTP commands; retired ACK/readback sequences send zero subsequent project commands.
- Original baseline 240/243, original UI5 candidate 288/291, current affected suite 316/319, native exit1: the exact same three subscription-string failure identities. All76 UI5 cases pass: original48 + unchanged original-retirement copy1 + new27. No historical assertions removed, weakened or skipped. Aggregate remains NOT PASS. The external original retirement 1/1 is separate red-to-green evidence, not silently absorbed into the inherited three.
- Fresh native Edge9/9: AR/EN/UR at390/768/1440; actual components, explicit presentation transport/data fixtures, keyboard checkbox, dialog focus/Escape/return and disabled actions.
- Fresh authenticated owned emulator1/1: actual App/Auth/Rules/Firestore/server. A genuine role HTTP ACK is delayed after the server transaction commits, actor role is revoked and restored, then the ACK is released. Exactly one role request/audit persists, zero project requests/audits, canonical project assignment unchanged, and no stale confirmed UI. Existing approval, driver uniqueness/link/unlink, partial rejection, current-role403, self409 and last-admin409 assertions remain intact. Owned processes/listeners cleanly shut down.
- Exact runtime command16/16 native0, TypeScript/lint native0, client/PWA/server build native0. All production bytes were frozen before gates and verified unchanged. A connected-test-only seed-placement correction was made after the first emulator attempt; that journey and TypeScript were rerun on the final test bytes. The unaffected automated family, runtime, build and browser inputs remained unchanged and were not needlessly rerun.

Initial new-test fixture errors remain in focused-r1: the rejection confirm label was incorrect, and a target-switch test incorrectly expected a discarded late read to replace the retained draft. Only those new fixtures were corrected; the latter now asserts both retained VIEWER UI and genuinely committed DRIVER fixture state. The original failing publication test was never altered.

The initial owned emulator attempt also remains preserved: the newly seeded active target ID contained the actor ID and matched the original self-row text selector before the added scenario. Creating that new target later, immediately before its own scenario and explicitly reloading users, preserves the original self-protection selector/assertion without weakening it. Only the affected journey and TypeScript needed rerunning; production bytes did not change.

## Exact scope, preserved evidence and owner gate

Before33-file final reconciliation the original candidate had30 paths:8 production/7 tests/15 docs. Final scope33:8 production/8 tests/17 docs. Added paths are the permanent-retirement test, this addendum and its separate raw ZIP. The old `ui5/verification-raw.zip` is unchanged. Current [inventory](ui5/exact-file-inventory.json), [verification](ui5/verification.json), [source contract](ui5/source-contract.json), [failure comparison](ui5/failure-comparison.json) and [SHA seal](ui5/evidence-sha256.json) reconcile the final bytes; pre-correction versions are preserved in `pub01-raw.zip/before/`.

All22 protected worktree HEAD/status/dirty hashes, original RB4 nine dirty files and unpublished migration013 remain unchanged. Seven inherited documentation bodies and original UI4 fourteen-failure/RB1/CI1/connected/interrupted evidence remain preserved. Firestore stays operational authority; backend/Rules/client command service and shared XLSX correction remain untouched.

GO to owner source review only. Independent publication review, inherited non-green debt, physical-device/screen-reader/live operational/provider acceptance and product/Beta2 release authorization remain outstanding. Do not treat local emulator results as production acceptance or this addendum as UI5 source closure.
