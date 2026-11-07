## Controlled Incremental Workspace Projection & Quiescence Quota Convergence — 2026-11-03

The single current-state authority is [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Working source baseline `7d50d3a31e72eb2e573ed169a029d5822f0a0742` incorporates Controlled Incremental Workspace Projection & Cost/Scale Architecture Convergence:
1. `useUserActiveWorkspaceSync` automatic POST requests are retired (`AUTOMATIC_USER_ACTIVE_SYNC_POSTS` = 0). Client user activity no longer triggers global sync requests.
2. Continuous 30s PWA polling timer (`window.setInterval(check, 30000)` in `pwaUpdate.ts`) is eliminated. Startup check + 15m TTL activity recheck retained.
3. Ordinary incremental sync (`retrySync`) processes pending outbox changes with 0 full trip collection reads (`collection('trips').get()` removed from ordinary retry pass) and 0 `projectProfileReports` calls.
4. Derived operational report refresh is separated into an explicit bounded server operation (`refreshOperationalReports` / `POST /api/projects/:projectId/workspace/refresh-reports`).
5. Scheduled background worker (`WorkspaceSyncCoordinator.ts`) filters and skips non-ACTIVE projects (`SETUP`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`) without executing Google delivery calls.

# Workspace sync quiescence and Firestore operation amplification

The single current-state authority is [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). PR #88 is now MERGED / SOURCE_VERIFIED at `0f1c6b841da168dc4464c17cbd9f5096fef5e32d`; owner live quiescence retest is still required. Local-only publication statements below are historical boundaries of the original unit, not current merge status. This records the 2026-11-03 bounded source audit and local remediation, starting from verified merged main `be908ce2642e68ff784282ab3cacfd6b94efc745` (PR #87). Audit findings and the original controlled model were recorded before production edits. A frozen Git archive supplied independent baseline verification. No live Firebase/Google mutation, billing query, resource cleanup or deployment was performed.

Owner evidence: about 56K reads/27K writes in 24 hours, including roughly 17K/15K in one hour; Browser Network repeatedly retried during/after apparently completed Workspace synchronization. These are owner observations, not independently attributed telemetry. PR #87 profile-unavailable behavior passed according to the owner; wider live intake acceptance is paused pending remediation retest.

## Proven findings and limits

| Finding | Classification | Source evidence and disposition |
|---|---|---|
| RC1 mutating retry | PROVEN | `runWorkspaceEnsureJourney` submitted initially and immediately resubmitted on every PREPARING/canResume response: 121 POSTs, zero waits in a controlled invocation. It is a finite invocation, not mathematically infinite; remounts/restarts reset it. Replaced with state-based termination and one resume after newly observed interrupted ownership. |
| RC2 history scan and renewal | PROVEN | `status` read the entire outbox; `retrySync` renewed its lease before skipping each DELIVERED event. Every historical event added reads, a transaction and a write. Replaced by canonical PENDING aggregation/delivery; history is retained. |
| RC3 universally unreachable READY | NOT_CAUSAL | The actual baseline engine reaches strict READY. FINAL_VERIFICATION_REQUIRED yields terminal ATTENTION_REQUIRED. No proven projection self-invalidating cycle; all production dirty callers inspected use canonical master tabs. No readiness weakening. |
| RC4 user activity reentry | PROVEN | Same-instance storms were throttled, but real remount/reload reset the ref. Coordinator renewed before checking eligibility: G+2 writes even for no work. Browser session throttle plus shared in-flight guard survive remount; coordinator renews only before real eligible work. |
| RC5 global invalidation | PROVEN fan-out; live spike attribution NOT_PROVEN | Real global edits discover canonical-path participation across Projects. Inactive/malformed-but-present membership must still invalidate. No unsafe field-only query or incomplete inverse index is substituted. |
| RC6 Script-key remount | PROVEN extra restart; endless Script-only remount NOT_PROVEN | Script ID changed the panel key during first materialization. Key now binds Project and existing context generation. Script identity itself stabilizes and does not alone prove endless remount. |
| RC7 redundant metadata/no-work execution | PROVEN | Healthy explicit ensure wrote 64 times in the fixture; no-work drain rewrote success/audit/report state. Fresh authority/fence reads remain, redundant lease/checkpoint writes are skipped, and healthy no-work retry is read-only. Explicit Verify still checks real provider/binding/workbook/Script. |

These paths explain capacity for large amplification despite low query execution counts: one query can return thousands of documents and a drain previously renewed once for every delivered document. Fifteen isolated no-work drains with H=1000 model **15,090 writes and 75,255 document reads**. This is a capacity example, not reconstruction or proof of the owner's exact live incident.

## Operation model

Counts are controlled **application-level** transactions, point reads, returned query documents and committed writes. They exclude transaction contention/retries, authentication middleware, Google traffic, latency and Firestore billing/index/minimum-read charges. Aggregate count calls return no event documents but are not free in Firestore. Production writes/latency vary with current canonical work. Fixtures are deterministic, not production SLOs.

T = transactions; R = point reads; D = returned query documents; W = writes; A = count aggregation calls. Before values have A=0. All rows below are one client command, except the observer GET and explicit history-only service status GET. The pending USER_ACTIVE row was measured later against the unchanged frozen baseline and current source to complete the model; it is not misrepresented as pre-edit live evidence. Coordinator figures describe one POST activity pass with one grant.

| Action | Before T/R/D/W | After T/R/D/W | After A | Termination / multiplier |
|---|---:|---:|---:|---|
| First provisioning after consent setup | 132 / 764 / 21 / 128 | 125 / 738 / 16 / 84 | 8 | strict verified READY; fixture resources only |
| Healthy explicit ensure | 70 / 383 / 6 / 64 | 62 / 348 / 0 / 28 | 5 | strict READY; real provider checks retained |
| Ensure with one dirty master projection | 75 / 441 / 19 / 68 | 76 / 455 / 18 / 33 | 5 | matching canonical revision and READY |
| One READY observe GET, one historical event | 3 / 12 / 1 / 0 | 3 / 12 / 0 / 0 | 1 | read-only status |
| Zero-work USER_ACTIVE | 4 / 10 / 1 / 3 | 3 / 9 / 1 / 2 | 0 | no delivery; claim/release only |
| USER_ACTIVE with new canonical master work | 19 / 108 / 19 / 15 | 19 / 108 / 17 / 10 | 2 | one canonical revision delivered; baseline archive/current supplemental probe |
| Status GET, H historical / no pending | 1 / 3 / H / 0 | 1 / 3 / 0 / 0 | 1 | exact PENDING count; no history materialization |
| Retry, H historical / no pending | H+7 / 3H+17 / 2H / H+6 | 2 / 7 / 0 / 0 | 1 | healthy no-work return |
| Retry, 1000 DELIVERED + 1 PENDING | 1009 / 3024 / 2002 / 1008 | 10 / 29 / 3 / 4 | 1 | one ordinary fixture upsert + ACK, not a full master snapshot |

Status history measurements cover H=10,100,1000,10000; baseline returned documents equal H, after zero with one aggregate. Retry history measurements cover H=10,100,1000 before and H=10,100,1000,10000 after. Baseline retry writes are 16/106/1006; after all zero. The one-pending regression covers H=10,1000,10000 and useful upper bounds, not exact fragile transaction counts. Query documents are at most three current-event appearances through preflight/claim/drain, independent of H.

Explicit projection point reads rise 441→455 because fresh pending-work/fence proof is retained; writes fall 68→33. Not every metric decreases. Zero-work coordinator writes change from G+2 to 2 regardless of examined eligible-grant history; normal candidate/read limits and pagination remain. This is bounded metadata work, not zero total network/Firestore activity.

### Request timing before and after

Before, a canResume=true invocation has 121 POSTs without a required wait. With L seconds per response, a single invocation admits at most min(121, floor(T/L)+1) requests in T seconds: L=0.5 permits all 121 within one minute and still 121 within five minutes. Across remounts there was no source-defined per-minute bound. This does not prove all observed requests were this path.

For a live owner (canResume=false), the journey and parallel panel interval each allowed about 40 GETs/minute. Their simultaneous nominal rate was about 80/minute, but the journey's 120-cycle bound expires around 180 seconds, so 400 GETs over five minutes is an extrapolated rate, not an uninterrupted single-lifetime count. Initial-effect observations can add requests. A live-lease observation exits before the outbox scan; do not charge every PREPARING poll as a READY history scan.

After, there is one serialized observer: initial PREPARING owner observation uses at most 120 reads at two-second spacing, and a command journey uses its existing bounded 1.5-second observations. READY/ATTENTION_REQUIRED/ACTION_REQUIRED stop observation. A resumable immediate POST response does not resubmit. One newly observed interrupted owner permits one resume per journey; consent remains separately bounded once. Same operation/progress/build auto-resume is suppressed across remount for one hour; storage unavailability suppresses automatic continuation while explicit action stays available. Real server authorization remains mandatory. No repeating timer triggers mutation or grants authority.

## Strict READY and legitimate work

The unchanged orchestrator predicate requires canonical binding/configuration, no current live owner, healthy workbook, automation READY/NOT_REQUIRED, durable authorization CONNECTED plus current CONNECTED_VALID diagnosis, healthy sync, zero pending count, a successful sync receipt and zero dirty tabs.

| Signal | Existing writer / invalidator / clearer |
|---|---|
| Binding/workspace state | canonical provision/recovery and binding proof; missing resource or sync/auth failure changes state; no browser resource ID authority |
| Workbook health | `initializeBound` provider inspection/repair and its error path; successful structural proof restores HEALTHY |
| Automation | current required Script install/verify/maintenance and failure handling; unknown create identity remains attention, never a second blind create |
| Durable authorization/diagnosis | offline authorization callback/access/disconnect and current principal/grant/binding proof; current observe diagnosis is metadata-only/read-only |
| Sync health / receipt | `finishSync` publishes success or bounded error; no-work retries do not manufacture a newer receipt |
| Pending work | canonical enqueue writes PENDING, matching-revision delivery ACK writes DELIVERED; exact count uses PENDING equality aggregation |
| Dirty projection | canonical `markDirtyInTransaction` increments mutation revision; `markProjectionSuccessful` clears only projected tabs at matching revision; an existing missing MASTER_DATA event is recovered without inventing a new mutation |

READY itself schedules no further mutation. An actual canonical mutation exits quiet state, USER_ACTIVE executes the current revision once, and observed READY returns after ACK/proof. Actual interrupted execution resumes under the same binding; live leases cannot be stolen. Manual Verify still performs provider checks. New authorization/resource problems surface the existing required action/attention path. Throttle keys contain navigation metadata, not tokens, and never authorize Project mutations.

Delivered-history independence is not a limit on genuine pending work: the pending drain must still execute current consequences, not truncate an arbitrary page and falsely claim success. Corrupt noncanonical outbox statuses are not migrated or destructively cleaned in this unit. All audited production writers use PENDING/DELIVERED. Fresh fence reads still validate current actor, Project, binding revision, owner, lease expiry and configuration; renewal writes occur only near the half-lease threshold.

## Global fan-out assessment

For E genuine global profile/status changes, P Project documents and K canonical-path participating Projects per identity: reads = E(2P+K), invalidation writes = 2EK. This includes Project query documents EP, membership point reads EP and projection point reads EK. Canonical global mutation/audit/lookup work is additional.

100 Drivers + 100 Trucks means E=200 edits: P=K=5 yields 3000 reads/2000 invalidation writes; P=K=10 yields 6000/4000. For K=1, writes stay 400 while reads remain 200(2P+1). For E=100, halve those totals. Creation/enrollment/affiliation is not automatically a global profile edit; the reviewed-intent commit already coalesces local dirty marking. Same-value global edits skip invalidation. Local 5-/10-Project probes confirm the model; its share of the live spike is not proven.

This path is unchanged. Existing canonical master projection regressions retain inactive/malformed/path-present membership coverage. Removing all-Project discovery requires completeness-proven indexing/migration in separately authorized scope; a field-only filter would miss canonical participants. No inverse registry, global authority rewrite or destructive history cleanup is introduced.

## Impact map and verification

- Client: `WorkspaceEnsurePanel`, `workspaceEnsureJourney`, `workspaceProvisioningResume`, `useUserActiveWorkspaceSync`, and only the Workspace panel key in `ProjectSetupWizard`.
- Server: `projectGoogleWorkspace.server`, `workspaceProvisioning.server`, `workspaceSyncCoordinator`. Routes, worker scheduling, auth/profile authority, canonical invalidation, phase-8 execution and Google adapters/assets/scopes remain unchanged.
- New operation counters and 10 operation-budget cases prove idle no-write/no-history/no-provider-work behavior, history-independent one-pending delivery, explicit provider verification, zero-work coordinator bounds, real canonical mutation convergence and same-binding interrupted resume/live-lease exclusion.
- Five actual React/journey cases cover READY over five-minute timers/activity/rerender/remount, no recursive/resurrected same-progress POST, serialized observation, one interrupted-owner resume and activity throttle across real remount.
- Existing test adjustments only add faithful equality/limit/count support to commandDatabase and three inline Firestore doubles, plus per-test browser session-storage isolation for user activity. No existing assertion/test is removed or skipped.

Final results are dated observations, not frozen cardinality rules:

- New focused tests: **15/15 PASS**.
- Affected final selection: **802/802 test cases PASS**, 44 populated suites. Baseline: **787/787 cases PASS**, 42 populated suites. No removed/skipped cases; 15 added; zero new case failures.
- Both broad commands still **EXIT 1 / NOT ALL GREEN**: the same baseline `workspaceConvergence.test.ts` and `workspaceIntegration.test.ts` have no test suite. They are retained, not rewritten or hidden. The manifest also contains two helper files which are not test suites.
- Selection includes one-click, live closure, reload, runtime fence, durable authorization/provider/HTTP/offline/complete lifecycle, coordinator/client, canonical master/raw/read convergence, global identity, Project participation, real Smart Import journey, bulk reuse and P8-B3 recovery. Invalidation production code is untouched.
- Build **PASS**. Lint **EXIT 2 / NOT PASS**, exact diagnostics **440→440**, added 0/removed 0 by file/code/message multiset ignoring shifted locations. No changed-file diagnostic additions. Diff check PASS.
- No production Firebase billing, live provider acceptance or deployed browser acceptance is claimed. Existing historical failures outside the selection are neither rerun nor reclassified as new failures.

## Remaining owner live test — not performed here

After separately authorized publication/deployment and quota recovery, use the existing authorized Project/account and preserve resource identities:

1. Record a Network trace and Firestore usage window. Complete one normal ensure to strict READY; verify folder/Sheet/Script identities and required automation remain stable, no Picker/repeated consent occurs, pending=0, dirty=0 and successful receipt is present.
2. Leave READY for five minutes; focus/visibility/online events and real component remount/reload must produce **zero automatic ensure/retry-sync POSTs** and no canonical mutations. Genuine activity may issue the bounded actor-pass POST (at most one per minute per browser session); zero-work server pass writes at most its coordinator claim/release, not one write per historical event. Read observations and aggregate minimum billing are not zero cost.
3. Interrupt one real active operation, reopen and resume the same Project/operation/binding once. A live owner must be joined, not stolen. Persistent identical canResume must stop automatically and leave explicit action available; APP_UPDATE reload fencing still applies.
4. Make one authorized real canonical edit/enqueue; verify one legitimate delivery, matching-revision ACK/dirty clear, canonical read-back and return to READY. Repeating idle activity must not repeat delivery or republish reports.
5. Confirm PR #87 profile-unavailable behavior still retains the same account/Roster session during a transient outage and never opens re-registration. Reconnect through existing authority; do not manufacture an outage or reset live data in this source unit.

Compare observed document-operation usage with actual pending work/history and the model; do not equate Query Insights query executions with document reads. The full intake/Material/bulk live matrix remains open in [LIVE_INTAKE_CONTINUITY_CONTRACT.md](LIVE_INTAKE_CONTINUITY_CONTRACT.md). Local commit only; PUSH/PR/MERGE NOT_PERFORMED. Phase 10 and Trips/Reports redesign are not started.

## Final Product/Architecture Decision: Manual-Only Workspace Synchronization

- **3-Hour Scheduler**: Cancelled by product decision. External scheduler introduces recurring infrastructure cost. Firestore remains the sole canonical operational authority.
- **Manual Incremental Synchronization**: Implemented and LIVE PASS (`retrySync`).
- **Manual Derived Report Refresh**: Implemented and LIVE PASS (`refreshOperationalReports` with server quota guard and 60s cooldown).
- **Worker Source**: `scripts/run-workspace-sync-worker.ts`, `server/workspaceSyncWorker.ts`, and `server/workspaceSyncCoordinator.ts` are classified as optional future automation capability, not deployed, not required for foundation acceptance.
- **Google Sheets Freshness Contract**: Google Sheets may be stale until an authorized user explicitly performs manual synchronization. This is intentional. Application/Firestore state remains authoritative at all times.
- **Cost Model**: Idle automatic Google sync calls = 0; scheduled infrastructure cost = none; Google projection cost = user-triggered only.
- **Foundation Status**: Three-hour scheduler blocker removed by product decision; scheduled worker deployment not required; foundation technical blockers = none known. Foundation acceptance = READY FOR OWNER FINAL ACCEPTANCE. Phase 10 = NOT STARTED.

## DATA-F1 read-amplification distinction — 2026-11-07

The isolated DATA-A2 workload (6 source rows; 12 consequences; 6 execution groups) reported 1,612 point-read SDK calls, 451 query calls and 618 returned query documents before B1. F1's retained transaction-scoped point-read memoization reports 616 point gets while query calls remain 451. These logical in-memory measurements neither attribute the original production 39K+/hour spike nor establish billable Firebase savings in production. Temporal history queries remain a nontrivial source of growth. Future cost architecture should separately monitor active/idle clients, Firestore read/write billing, project-size scaling, background retries, and Google Sheets projection traffic. Do not conflate F1 with the previously recorded Workspace quiescence and controlled incremental projection work; each needs its own live acceptance gate.

