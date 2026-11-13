# Release blocker closure continuation — 2026-11-13

Status: all required source verification gates pass; final integrity review and the single authorized local commit are pending. No publication or production cutover is authorized. Starting HEAD `3edaa8799954145e438daa48cc6f80b4fe288f10`, branch `engineering/convergence-1-20261110`.

The initial 131-file review patch matched its inventory before editing. Its complete binary diff and per-file fingerprints were preserved outside the repository; the original report, inventory, verification results and worktree record are archived here. `preservation-start.json` and `preservation-current.json` verify the separate nine-file RB4 patch, migration 013 and byte integrity of migrations 001–012. No accepted implementation was reset, stashed, discarded or reconstructed.

## Owning root-cause families

1. **Pending-only journal contract and stale fixture (B).** The retained historical register test expected a delivered Trip to be backfilled without pending work, contrary to the accepted quiescence contract. The actual assertion that T1 appears in the register remains. T1 now has a frozen canonical PENDING event; a separate delivered HISTORY event and its receipt remain unchanged and are never replayed. The existing Sheets fixture now implements the actual U08 atomic batch/marker protocol, including rollback and marker retirement. Added failures before send and after provider success prove frozen RPC retention, original delivery identity, marker readback and duplicate suppression. No production replay/backfill path was added.
2. **Repeated traversal of shared blueprint nodes (A).** The approved compiled blueprint expands shared styles across 38,437,239 canonical JSON bytes. Fresh-process measurements retained the exact bytes/hash while per-call shared-node normalization reduced measured time from 13,230ms to 2,768ms and heap growth from approximately 256MB to 76MB. Source changes are limited to per-call memoization in capture.ts and per-assertion completed-node sets with separate cycle rejection in contract.ts. No authorization, grant, ownership, revision or cross-call cache was introduced. Regression cases cover shared/materialized equivalence, changed values on a later call, own __proto__ keys, foreign range IDs, external URLs and invalid cycles.
3. **Cold server dependency compilation inside command deadlines (B/C).** Fixtures now load the real projection module during suite bootstrap, retaining original command deadlines and production module initialization order. Existing command, provider, ownership and error assertions are unchanged. An eager shared-helper variant was ineffective and was replaced only in this continuation with an awaited beforeAll import; failed attempts remain recorded. The complete five-consumer family passes 84/84 together with native exit zero.
4. **Real client SDK used by native command fixtures (B/C).** Legacy offline-formatting tests now explicitly isolate the client SDK. Canonical command fixtures bind the real server numbering/event/audit ports to their staged transaction database and reject accidental client numbering. The same helper database now implements direct Admin set through its existing serialized transaction owner. A new production-unavailable assertion forbids fallback official numbering. A C1 assertion proves the real project-scoped audit and transactional counter. No production fallback was introduced.
5. **Unowned asynchronous work and malformed Firebase Auth fixture (C).** The Provider lifetime fixture now invokes and awaits its actual deferred sync before Project switching/rejection; the missing status/authorization methods were the owner defect. Google Sheets native tests mock the explicit principal before dynamically evaluating the unchanged browser-safe case runner, avoiding mutation of a real Auth instance with a partial fake User. The complete owner pair passes 30/30 with exit zero and no unhandled errors. A full run with 3449 passing assertions but two unhandled rejections was correctly retained as FAIL.
6. **Resource variability and invocation configuration (D/E), not a blanket explanation.** Sequential test runs retained all original deadlines, worker isolation, maxWorkers=1 and fileParallelism=false. The five-consumer family varied substantially between attempts; no specific host contention cause is claimed without evidence. Read-only host memory sampling showed approximately 12GB free; the processor query was unavailable. One full run had an immediate missing Playwright-tool-root error caused by this executor's command environment. It is retained as a failed run and the whole selection is repeated with an explicit validated root. Filtered profiler runs are diagnostics only, never acceptance substitutes. Earlier PostgreSQL checkpoint observations do not establish the cause of unrelated JavaScript failures.

Exact original fourteen identities, stacks and dependencies are in original-14-failures.json. Every failed attempt remains visible in continuation-attempts.json and compressed raw logs/results. The existing ninety-four-identity ledger is compared by exact file/full name or exact title; no fuzzy replacement identities, exclusions or skips are accepted.

## Journal and authority trace

Canonical mutation records pending work and source revision. The existing server drain freezes payload/RPC under the original logical identity, claims current writer ownership, rechecks current Project/grant/binding authority, performs the atomic Google batch outside the database transaction, reconciles an uncertain response using the provider marker, then commits its receipt and acknowledges only the matching source revision. Delivered history is retained. Manual SETUP maintenance remains authorized where its existing contract permits it; scheduled SETUP delivery remains excluded. No browser writer, second Google transport, live Google resource operation or SQL cutover was introduced.

## Verification accounting

Selections overlap and their counts must not be added. A JSON success field alone is insufficient: native exit, final unhandled errors, cleanup and skipped/pending counts are inspected. The final full historical, native PostgreSQL combined, connected browser/PWA, npm chain and release checks must each succeed independently before the owner-authorized single bounded local commit. Pending gates remain listed in checkpoint.json.

## Integration boundary

The complete branch still contains four U09 commits preceding the three convergence commits. Do not merge/cherry-pick the branch wholesale. Retain the dependency plan in the parent release-blocker report: portable Firestore-compatible corrections require dependency-complete hunk extraction and independent tests against pinned main; SQL composition, epoch/governance, immutable-source prerequisites and unfinished RB4 remain held for U09 integrated review and operational acceptance. This task authorizes no history rewrite, push, PR, merge, deployment, Google resource creation, production migration or activation.

## Completed verification

| Gate | Result |
| --- | --- |
| Complete historical selection | 3449/3449, 164 files, exit 0, no pending tests or final unhandled errors |
| Exact original fourteen / prior ninety-four | 14/14 and 94/94 PASS; 2758 prior unique identities retained; 688 new identities |
| Native combined | 668/668, 25 files, exit 0; U07 53 + RB1 29 in this same run |
| Native resources | No added databases, no remaining clients; owned PostgreSQL stopped with exit 0 |
| npm test | 546/546 across the exact 48 commands, exit 0 |
| verify:beta2 | Exit 0: full TypeScript/lint, frontend/PWA and server builds, reports 19/19, final suite 443/443 |
| TypeScript | Baseline 314 → current 0. First continuation release attempt exposed one TS4104 fixture error; retained and corrected |
| Connected browser/PWA | 14/14, four complete files, exit 0, no pending/unhandled/cleanup errors |
| Resource readback | Loopback ports 55439, 8085, 9099, 4400, 4500 and 9150 all closed |

The final TS4104 fix copies the readonly header array at the new fixture call. fixtureSheet maps its values and operationalSheetsFixture already structured-clones the entire input, so values, canonical inputs and assertions are unchanged. Its complete owning file was rerun: 25/25, exit 0. The complete release command was then rerun successfully. This focused owner check does not relabel any failed combined run; the full historical and combined native gates each have their own successful native exits. No production source changed afterward.

The PostgreSQL launch wrapper initially remained blocked after reporting the server ready. Process inspection and pg_stat_activity established that no Node runner, test database or SQL test had started. Only the verified wrapper PID 8900 was stopped; the actual native suite resumed once against the existing ready owned cluster and subsequently cleaned up successfully. The exact interrupted command and resume point are preserved in checkpoint.json and the archived ownership record.

The refreshed compiled-runtime graph has 54 production roots, 29 U09-coupled. The original 52-root graph is archived; the additional roots are the two blueprint functions. Runtime independence alone is insufficient to integrate a file: the original dependency-complete cohorts, type/schema contracts and tests remain required.

## Exact original fourteen identities — complete historical PASS

| File | Retained identity | Result |
| --- | --- | --- |
| convergence3JournalBrowser.test.ts | real cross-tab transactions reserve one immutable Trip command; scope and acknowledged receipts survive restart | PASS |
| durableImportSessionP8B1.test.ts | P8-B1 durable session authority supports a realistic 10,000-row snapshot through ordered revision-bound chunks | PASS |
| finalReleaseReadiness.test.ts | AUDIT-I18N-01 | PASS |
| finalReleaseReadiness.test.ts | AUDIT-REG-01 | PASS |
| operationalProfiles.test.ts | 4 measurement topologies × 3 independent intake policies DUAL_WEIGHBRIDGE / PRELOADED_ROSTER: configuration, activation, template, trip completion and metrics | PASS |
| operationalReportTabIsolation.test.ts | deployed Q-PRJ-007-shaped partial V1 recovery, without hardcoded Project IDs preserves legacy and partial tabs, rehydrates delivered canonical Trips, upgrades the known Script once, and retains the binding | PASS |
| operationalWorkspaceTemplates.test.ts | versioned templates and durable Script creation/recovery WEIGHBRIDGE/WEIGHBRIDGE provisions exact blueprint and script once; persists ID before installing; projects canonical data | PASS |
| operationalWorkspaceTemplates.test.ts | versioned templates and durable Script creation/recovery WEIGHBRIDGE/WEIGHBRIDGE uncertain create is never repeated, generic recovery proves parent then installs correct bundle | PASS |
| workspaceBoundedWorkbookInspection.test.ts | large legacy workbook actual initialization without whole-grid materialization repairs the same 24-tab workbook, preserves legacy Dashboard and Script identity, and is idempotent | PASS |
| workspaceBoundedWorkbookInspection.test.ts | large legacy workbook actual initialization without whole-grid materialization a bounded metadata failure keeps the process/binding/pending work and releases the owned lease | PASS |
| workspaceBoundedWorkbookInspection.test.ts | large legacy workbook actual initialization without whole-grid materialization a bounded write failure keeps the process/binding/pending work and releases the owned lease | PASS |
| workspaceLocalBlueprint.test.ts | real local SABIL source release has deterministic normalized source digests | PASS |
| workspaceProviderResilience.test.ts | Q-PRJ-007-shaped user-active execution with durable authority automation recovery uses the fresh durable credential for parent/content proof without creating another Script | PASS |
| workspaceProviderResilience.test.ts | one accepted OAuth grant survives initialize/retry cycles, actual Ops migration, workbook repair and Script package installation | PASS |
