# AR2-U09-RB2 — SQL consumers in the existing React application

## Preflight and bounded implementation plan — 2026-11-10

Live main and pinned main are both `030e9027685033c674cf2021499db7bfb675cbfd`. Local and live remote U09/RB1 HEAD are `10f546177b54239f5337b938c68b35b3b3030637`; merge-base with main equals pinned main. Working tree was clean. ARCH-R1 Revision 1.2 was read from `public/assets/aistudio/01_ARCH_R1_2_APPROVED_DESIGN_60ca8b9d.md`, especially retain/adapt, isolation, bounded Foundation, reviewed import, offline, API errors and same-application rules, alongside U09 and RB1 records. No applicable AGENTS.md was found. A fresh exact-HEAD archive baseline, without assertion/fixture overlays, is independently running the same 135-file historical selection and compiler check.

SQL composition remains supplied only by the trusted runtime provider. Production main continues to supply no SQL composition. The existing App, account gate, Sidebar, setup wizard, operational configuration form, field screen and journal are reused. SQL-specific typed consumer bodies are necessary boundaries inside these existing components, not another deployed application or another business model. They never mount legacy repository/listener consumers. No legacy UserEntity/ProjectEntity with invented fields will be built from partial SQL DTOs.

## Source-derived capability matrix (before implementation)

| Existing React consumer | Canonical UI contract / SQL port | Authorization | Offline behavior | Classification / dependency |
|---|---|---|---|---|
| AuthProvider / AccountStatusGate | Identity-only Firebase session; RB1 account/register | Verified UID; explicit tenant request, no owner bootstrap | No cached commercial authority; missing differs from unavailable | READY_TO_COMPOSE; requires typed account consumer |
| Pending/rejected/active/suspended gate | RB1 SqlAccountDto status, membership and private notice | Current global status plus selected tenant status | Explicit refresh; no registration on read failure | READY_TO_COMPOSE |
| Company roles / Sidebar | RB1 roles including COMPANY_ADMIN, not a fabricated legacy role | Current company roles and project capabilities | Cleared on switch/reconnect failure | REQUIRES_ADAPTER; union visibility without role preview |
| Project inventory / selection | RB1 signed pages <=50 and current project DTO | Current tenant/project authorization, current DTO on selection | No persistence of authorization; stale responses discarded | READY_TO_COMPOSE |
| Wizard creation/foundation/lifecycle | RB1 command envelope and availableCommands | Current server capability, revision and epoch | Online commands; unknown result requires readback | REQUIRES_ADAPTER; preserve existing form controls where compatible |
| OperationalConfigurationForm | RB1 assessment and configuration command | PROJECT_ADMIN assignment or SUPER_ADMIN; version/signature recheck | Online only; no cached assessment reuse after switch | REQUIRES_ADAPTER; bind pure form via explicit authority callbacks |
| Foundation readiness | RB1 setup vs operational/lifecycle readiness | Current SQL project access | Presentation only; no cached activation proof | READY_TO_COMPOSE |
| Fleet/material/carrier steps | U04 summary/participant pages and U02 create/membership commands | Current SQL membership and role; partial DTOs stay partial | No snapshot replacement from a page | REQUIRES_ADAPTER; legacy full-profile discovery is UNSUPPORTED |
| FieldOperationsView | U06 exact Trip read/commands and U07 coordinator | Current project role, Trip ownership, expected revision/epoch | Receipt-first queue, causal order, manual journal recovery | REQUIRES_ADAPTER; legacy whole-project Trip subscriptions stay unmounted |
| PricingEngineView / pricing section | U06 Trip pricing snapshot; save command exists, rule-inventory read port does not | Existing U06 role disclosure policy | Snapshot presentation only | UNSUPPORTED for legacy simulator/rule inventory; no fabricated tariff rows |
| Smart Import source initiation | U05 createSession / attachSource | Current project/actor and lifecycle | Preserve durable SQL session ID; no legacy-session translation | BLOCKED_RB3 at immutable source provider boundary |
| Smart Import continuation / reviewed intent | U05 checkpoint, preview, review, execution/status + existing RosterSemanticReview | Exact server signature, version, actor/project; warnings/displacements explicit | Durable status/receipts; advance uses existing U07 import queue | READY_TO_COMPOSE for already supported persisted SQL stages; unresolved legacy resolution UI remains blocked |
| OutboxDrawer / SqlJournalPanel | U07/U09 bounded journal and authenticated receipt recovery | Principal/company/project/epoch isolation | Unknown and legacy commands remain held; no polling | READY_TO_COMPOSE |
| Reports / dashboard | No composed SQL report read port | Do not mount Firestore reads | No invented reports | UNSUPPORTED |
| Workspace | Existing authorized /workspace/runtime stop | Current project context required | No Google calls/writes | BLOCKED_RB4 |

Trip routes currently derive company through a trusted callback; the UI's selected company must not be silently ignored. A narrow requested-company mismatch guard will be added before Trip/pricing reads and commands, without changing Trip/pricing business semantics. Other-company operational entry remains fail-closed if the trusted server company resolver cannot serve that scope.

## Exact pre-edit allowlist

- `src/App.tsx`
- `src/firebase/authContext.tsx`
- `src/services/runtimeClient.service.ts`
- `src/types/sqlUi.ts`
- `src/services/sqlUiClient.service.ts`
- `src/runtime/sqlUiSession.ts`
- `src/runtime/SqlApplicationSession.tsx`
- `src/components/auth/AccountStatusGate.tsx`
- `src/components/navigation/Sidebar.tsx`
- `src/components/wizard/ProjectSetupWizard.tsx`
- `src/components/wizard/SqlProjectSetup.tsx`
- `src/components/wizard/Step1ProjectInfo.tsx`
- `src/components/wizard/OperationalConfigurationForm.tsx`
- `src/components/field/FieldOperationsView.tsx`
- `src/components/field/SqlTripWorkstation.tsx`
- `src/components/import/SqlImportJourney.tsx`
- `src/i18n/sqlRuntime.ts`
- `server/sqlTripRoutes.ts`
- `src/tests/helpers/u09Rb2BrowserEntry.tsx`
- `src/tests/ar2U09Rb2Ui.test.ts`
- `src/tests/ar2U09Rb2Session.test.ts`
- `.github/workflows/ci-foundation.yml`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md`
- `docs/reconstruction/18_AR2_U09_RB2_SQL_UI_INTEGRATION.md`

No migrations 001–012, new business roles, production authority/epoch, main bootstrap, Workspace writer or source provider may change. Any necessary allowlist extension must be source-justified here before editing. RB3/RB4 remain dependencies, not independently implemented units. Existing historical assertions are immutable.


### Pre-edit allowlist extension: credential-await cancellation

Add `src/services/sqlGovernanceClient.service.ts` to the allowlist. Source inspection found that its UID-only check after token acquisition permits an A→B→A identity cycle, or a company/project switch with the same UID, to send an old command after the token promise resolves. An optional lifetime callback (default absent, preserving RB1 callers) and SQL UI transport cancellation will fence these awaits before transmission and after body parsing. This is directly required for the RB2 pending-request/account-switch contract; no governance command semantics change.

### Matched baseline checkout-byte correction

The first fresh archive inherited Git's `core.autocrlf=true` conversion and yielded 2,392 passes / 102 failures. Ten additional failures were newline-sensitive historical source assertions. Direct comparison proved its server/app.ts was 96,134 bytes with CRLF while the unchanged working source was 94,119 bytes with LF; normalized contents were identical. The initial evidence is retained. A second fresh archive of the same exact RB1 commit uses `core.autocrlf=false`, with byte identity checked against published blobs and unchanged working files; its complete 135-file history and compiler run are the accepted matched baseline. No historical source assertion or fixture was edited or overlaid.

### Pre-edit allowlist extension: reuse existing operational controls

Add `src/components/field/AdaptiveOperationsView.tsx` to the allowlist. Its existing Trip action/measurement/driver-association controls can be extracted as a pure shared presenter without mounting its Firestore fleet, Trip and tariff listeners. Both the unchanged Firestore data consumer and SQL point-read consumer will use that presenter and the same existing role/profile transition policies. The SQL boundary must not substitute a raw command console for the approved operational UI. The missing SQL whole-project Trip and tariff inventories remain explicitly unsupported; bounded point reads and authoritative queued commands are supported without pretending to hydrate those legacy selectors.


### Pre-edit allowlist extension: read-only governance result recovery

Add `src/db/governanceAuthority.ts` and `server/sqlGovernanceRoutes.ts`; the governance client is already allowlisted. RB1 receipt references intentionally return `resendAuthorized:false`, so the UI must not replay a command to recover its DTO even when the operation is known committed. Add a narrow read-only project-operation result port: select only the current actor/company's immutable receipt, verify its encrypted locator, then reauthorize and return the current allowlisted Project DTO. Never return cached permissions or a generic decrypted result, mutate a receipt, or authorize resending an unknown operation. Browser verification must require exactly one project-command POST after lost ACK recovery and current-scope denial for another actor/company.


### Pre-edit allowlist extension: complete account approval handling

Add `src/components/admin/AdminConsoleView.tsx` and `src/components/admin/SqlAccountAdministration.tsx`. Final journey review found that requester-side status readback alone leaves the existing administrator approval workflow inaccessible in SQL mode despite complete RB1 account inventory/command ports. Reuse the existing AdminConsole boundary with a bounded SqlAccountDto consumer; never hydrate its legacy user/project/audit listeners. Expose the existing ADMIN_CONSOLE navigation item only with the current SQL administerAccounts capability. Approval/rejection, suspend/reactivate, role change, explicit full assignment replacement and Driver linking use the unchanged RB1 commands and revisions. Unknown results require fresh readback; admin commands are not added to the offline authority union. Audit/legacy project-security sections without SQL read ports remain unavailable. Add real browser owner-approval/rejection and requester readback tests.

## Final source result and boundary

`AR2_U09_RB2_SOURCE_IMPLEMENTED_READY_FOR_REVIEW`. Overall U09 remains **BLOCKED**. Starting main: `030e9027685033c674cf2021499db7bfb675cbfd`; starting U09/RB1: `10f546177b54239f5337b938c68b35b3b3030637`. This is an additive commit on `reconstruction/ar2-u09-sql-runtime-cutover-readiness`; no PR, merge, deployment, production data migration or SQL activation is authorized or performed. Commit/remote SHA are reported after publication, outside this self-referential source record.

The runtime provider is the sole composition boundary. `src/main.tsx` and production bootstrap are unchanged; no URL/localStorage/backend picker or production mock exists. SQL identity is the actual Firebase UID/token port, not commercial authority. Requests obtain tokens per request; no token is persisted. Current global and company status, SQL roles, server capability, selected project, revision and trusted epoch govern each consumer. Unknown account availability never becomes a missing-profile application. Suspended/rejected tenant status takes precedence over a globally ACTIVE identity. COMPANY_ADMIN stays COMPANY_ADMIN. Multiple actual roles contribute navigation visibility; there is no role simulation selector.

The old AuthProvider, AdminConsole, Wizard and FieldOperations effect trees remain behind their existing Firestore branch. SQL supplies narrow typed consumer props and shares existing status gates, Sidebar, Step1 foundation controls, operational assessment form, setup registry, Trip action/measurement presenter, RosterSemanticReview and SqlJournalPanel. Partial DTOs never become fabricated UserEntity, ProjectEntity or full snapshots. Company/project/identity changes clear and cancel scoped state; stale token and JSON awaits are fenced by generation, including A→B→A. Logout synchronously invalidates requests before asynchronous identity sign-out. Reconnect reads current authority; idle UI does not poll.

Project commands use the RB1 server-allocated identity, epoch, current revision, availableCommands and legal lifecycle graph. Setup readiness remains separate from operational route completion: route completion gates activation. The configuration form requires the current server assessment/signature and cannot reuse it across scopes. Account administration uses signed pages of at most 50 and unchanged target membership revisions/commands; full project assignment replacement is explicit, not inferred from a partial count. Unknown administration outcomes require readback. No administration command was added to the offline union.

Lost governance acknowledgements retain the original operation ID and prohibit another intent. A narrow read-only result adapter reads only the current actor/company receipt, decrypts only its project locator, reauthorizes current project access, and returns the current allowlisted Project DTO. `resendAuthorized` remains false; no replay or receipt mutation is used to recover a result. Other actors/companies cannot retrieve that receipt. The original RB1 receipt-reference contract is preserved.

Trip UI uses an exact authoritative point read, actual immutable pricing disclosure and the existing shared role/profile controls. Commands enter the existing U07 queue with server-read revision; durable operation receipts recover results and repeated wakes cannot duplicate a Trip. Trip routes reject a selected-company/header mismatch with the trusted server company resolver. Deployments whose trusted resolver cannot serve a different selected company remain fail-closed for that company's Trip operations.

## Reconciled UI capability matrix

| Consumer / capability | Final result | Residual dependency |
|---|---|---|
| Registration and account status/private rejection | INTEGRATED, native browser verified | SQL account API must be available; unavailable is explicit |
| Existing AdminConsole account approval/rejection and account commands | INTEGRATED through original RB1 ports | Legacy audit/security panels lack composed SQL read adapters |
| Company roles, union navigation, bounded project selection | INTEGRATED, current-scope verification | COMPANY_ADMIN read scope is not promoted to an application role |
| Existing foundation form, server identity, readiness/lifecycle | INTEGRATED, native browser verified | No production historical-project reconciliation claimed |
| Existing operational configuration assessment form | INTEGRATED, current version/signature | Bound Workspace impact remains blocked at the original adapter stop |
| Bounded participants and carrier/material creation/enrollment | INTEGRATED using U02/U04 | Full legacy profile discovery/roster resolution is unavailable |
| Existing field screen and shared Trip controls / pricing snapshot | INTEGRATED for exact Trip read and supported U06 commands | Whole-project Trip/tariff inventory and pricing simulator read ports unavailable |
| Roster import session create/resume/source attach attempt | INTEGRATED to real U05; source stop verified | BLOCKED_RB3: production immutable source provider |
| Persisted Roster reviewed intent, signature acceptance, start/status/advance | INTEGRATED; real SQL reviewed stage and grouped receipts verified | New source mapping/resolution and Trip-domain import UI are not complete |
| Offline/journal and principal/receipt safety | INTEGRATED with existing U07/U09 contracts | Unknown proof, unordered legacy and old epoch intents remain held |
| Reports/dashboard and pricing inventory UI | UNSUPPORTED, explicit unavailable state | Missing SQL read adapters; no Firestore hydration |
| Workspace authorized unavailable state | BLOCKED_RB4, zero Google calls verified | SQL six-resource identity/revision/grant/delivery adapter; retain sole writer |

## Required journey coverage

All numbered cases run the actual App, trusted RuntimeCompositionProvider, identity-only AuthProvider, existing React consumers, Express SQL routes and isolated PostgreSQL 17. Browser-only identity/source DI is test code; production has no mock provider. Each test checks zero forbidden Firestore, legacy API and Google provider requests and zero page errors. Case 25 additionally probes the real HTTP receipt privacy boundary. No skipped journey is counted as passed.

| Required journey | Browser evidence / meaning |
|---|---|
| 1 registration/pending approval | 01 and 26: durable selected-company application, pending, owner approval and requester ACTIVE readback |
| 2 rejection/status readback | 02 and 27: administrator rejection and subject-only reason |
| 3 active account/roles | 03: actual SUPER_ADMIN and faithful COMPANY_ADMIN |
| 4 suspension/revocation | 04 and 24: operational controls removed on current denial |
| 5 company switching | 05: scope privilege cleared; mismatched Trip company rejected |
| 6 project inventory/selection | 06: signed bounded pages and fresh selected-project read |
| 7 project setup/readiness | 07 and 08: existing foundation form, server identity, separate setup/operational readiness |
| 8 lifecycle commands | 08: review/approval/activation/suspend/reactivate with operational gate |
| 9 operational assessment | 09: existing form, SQL assessment before versioned update |
| 10 permission navigation | 10: VIEWER cannot enter operational action UI |
| 11 operational entry | 11 and 20: actual Trip read/shared START_TRANSIT, queued dispatch and immutable price snapshot |
| 12 Smart Import initiation/continuation/review | 12 and 19: durable session resume; persisted reviewed intent/grouped SQL receipts. Fresh provider-to-completion is BLOCKED_RB3 |
| 13 missing RB3 dependency | 13: actual source attachment fails closed without business writes |
| 14 Workspace | 14: authorized unavailable state with zero Google calls, not successful delivery |
| 15 pending logout | 15: old response discarded and workflow unmounted |
| 16 principal recovery switch | 16: old principal cannot transmit after receipt wait |
| 17 legacy/unknown receipt | 17 and 21: held unknown/legacy intents; lost ACK recovered with exactly one project-command POST; 25 receipt privacy |
| 18 Firestore preservation | 18: unactivated production composition uses existing login; 22 idle quiescence and 23 unavailable account distinction |

## Measured verification and retained corrections

| Gate | Exact result |
|---|---|
| Actual React + PostgreSQL browser | 27/27 PASS; 0 failures, 0 skipped |
| Session/principal unit | 6/6 PASS; 0 failures, 0 skipped |
| Independent authority | 148/148 PASS; 0 failures, 0 skipped |
| Full native U01–U06/U09/RB1 | 479/480 PASS; 1 failures, 0 skipped |
| Unchanged U01 infrastructure rerun | 13/13 PASS; 0 failures, 0 skipped |
| U07 53 + U09 browser 6 + U08 29 | 88/88 PASS; 0 failures, 0 skipped |
| Fresh matched RB1 historical baseline (135 files) | 2402/2494 PASS; 92 failures, 0 skipped |
| Final matched historical selection (135 files) | 2402/2494 PASS; 92 failures, 0 skipped |

The native 480-test run retained one original 30-second backup/restore timeout. With an isolated local CHECKPOINT and no competing heavy job, the unchanged infrastructure suite passed all 13, including backup and restored fingerprint checks. The initial timeout is not erased or relabeled. No historical timeout or assertion was relaxed. U07's epoch exercise used a distinct fresh database; a previously advanced epoch was not reused as a fresh test context.

The first combined U07/U08/U09 run passed 87/88, with a 10-second browser setup hook timeout in the unchanged causal NOT_COMMITTED predecessor case. Its raw JSON/log remain as `rb2-u07-u08-initial.*`. The full 88-case selection was repeated on another fresh isolated database, preserving the advanced-epoch database and all historical hook deadlines. The final 88/88 closes that timing failure. Historical run wall time also included a host/tool interruption; no performance improvement is inferred from that measurement.

The accepted baseline archive was byte-verified against all 1,483 published RB1 blobs, with node_modules supplied externally, no source/test overlays and unchanged assertions. Baseline and final history have the same 92 failed assertion identities, 12 suite-load failures and 2 unhandled errors. Both remain failing, not green. Exact new failures and new suite-load identities: **0**. An intermediate candidate had one additional legacy operational form failure because a fifth undefined argument changed an existing four-argument call; the adapter preserves original arity now, and the unchanged historical assertion passes. The raw 93-failure report is retained separately.

The initial CRLF archive (2,392 pass / 102 fail) was rejected as an unmatched checkout; its raw evidence is retained. Early new browser fixture/recovery expectations were corrected against actual contracts, including revision 0→1, receipt-first retry only after an attempted send, and tenant rejection without an invented global status/role. The final full browser result is 27/27. The private UUID test helper received only an explicit string type annotation after an interim compiler diagnostic; no runtime or historical assertion was changed for that correction.

TypeScript: **446 baseline → 446 candidate**, zero added/removed semantic diagnostics after normalizing source locations, lint exit 2 and **NOT PASS**. Production build **PASS**; full/staged diff check **PASS**. The 32 changed files match the pre-edit allowlist and documented six source-justified extensions. Existing historical test sources are untouched. CI selections include both new suites; independent remote Linux execution is not claimed.

Native migrations 001–012 are byte-identical to starting RB1, including 012 SHA-256 `9001bd9fe208f74f693c94850948ce4556dbfa904c12ac739eaefe1482cbf4ce`. All twelve applied and verified on new isolated databases only, PostgreSQL 17 bound to 127.0.0.1:55439, service roles separate. No inventory assertion change was necessary in RB2. No database or implementation was reset, stashed, discarded, replaced or reimplemented.

Raw local evidence (outside commit; all synthetic): `C:/Users/Hp/Documents/ChatGPT/Work Follow/rb2-{ui,session,148,sql,infrastructure,u07-u08,matched-baseline-history,history}.json` and matching `.log`; compiler `rb2-{matched-baseline-lint,lint}.log`, build `rb2-build.log`, migrations `rb2-{sql,u07}-migrations.log`, blob proof `rb2-baseline-byte-proof.json`, exact comparison `rb2-final-evidence.json`. Intermediate raw reports include `rb2-baseline-history.json`, `rb2-history-before-arity-correction.json`, `rb2-ui-admin-initial.json` and the earlier corrective browser reports. These are local evidence paths, not a claim that logs are packaged in the source commit.

## Exact final changed-file inventory

- `.github/workflows/ci-foundation.yml`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md`
- `docs/reconstruction/18_AR2_U09_RB2_SQL_UI_INTEGRATION.md`
- `server/sqlGovernanceRoutes.ts`
- `server/sqlTripRoutes.ts`
- `src/App.tsx`
- `src/components/admin/AdminConsoleView.tsx`
- `src/components/admin/SqlAccountAdministration.tsx`
- `src/components/auth/AccountStatusGate.tsx`
- `src/components/field/AdaptiveOperationsView.tsx`
- `src/components/field/FieldOperationsView.tsx`
- `src/components/field/SqlTripWorkstation.tsx`
- `src/components/import/SqlImportJourney.tsx`
- `src/components/navigation/Sidebar.tsx`
- `src/components/wizard/OperationalConfigurationForm.tsx`
- `src/components/wizard/ProjectSetupWizard.tsx`
- `src/components/wizard/SqlProjectSetup.tsx`
- `src/components/wizard/Step1ProjectInfo.tsx`
- `src/db/governanceAuthority.ts`
- `src/firebase/authContext.tsx`
- `src/i18n/sqlRuntime.ts`
- `src/runtime/SqlApplicationSession.tsx`
- `src/runtime/sqlUiSession.ts`
- `src/services/runtimeClient.service.ts`
- `src/services/sqlGovernanceClient.service.ts`
- `src/services/sqlUiClient.service.ts`
- `src/tests/ar2U09Rb2Session.test.ts`
- `src/tests/ar2U09Rb2Ui.test.ts`
- `src/tests/helpers/u09Rb2BrowserEntry.tsx`
- `src/types/sqlUi.ts`

Historical failed assertion identity SHA-256 (sorted filename + full test name): `c79985dbd70ee0c53692bee5884abe57d959e12e4adb193178289dc6aebfadbe`; baseline identical. Suite-load failures: `conflictEngine.test.ts`, `conflictResolution.test.ts`, `googleDriveImport.test.ts`, `googleSheetsImport.test.ts`, `pricingEngine.test.ts`, `reportsEngine.test.ts`, `reportsEngineControlCleanup.test.ts`, `reportsEngineConvergence.test.ts`, `tripIdentityAdjustmentBlock89.test.ts`, `weighbridgeImport.test.ts`, `workspaceConvergence.test.ts`, `workspaceIntegration.test.ts`.

## Remaining readiness gates

RB3: real immutable object/source ownership provider, approved export/mapping evidence and historical equivalence; supported persisted Roster intent is not new source-to-production equivalence. RB4: SQL Workspace binding/grant/revision/resources/delivery journal with the sole Google writer and original resource IDs. No provider implementation was added in RB2. SQL whole-project Trip/tariff/report inventory, legacy audit/security, detailed discovery/resolution and Trip-domain import UI still require explicit adapters. Operator cutover, production data reconciliation, independent Linux CI, Firebase/Rules/IAM/drain, live Google/device/load and owner approval remain open. Existing baseline test and compiler debt remain visible. These dependencies keep **U09_OVERALL_STATUS=BLOCKED** even though the bounded RB2 source is reviewable.

Historical RB1/U09 text is preserved above/in its original record; this addendum supersedes only the missing RB2 composition statement. Production remains Firestore. No PR, merge, deployment, production migration or SQL activation occurred.
