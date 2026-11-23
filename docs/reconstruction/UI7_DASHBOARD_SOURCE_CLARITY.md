# UI7 — Dashboard Data Source & Availability Clarity

Client date2026-11-23, Asia/Riyadh. Work began under the2026-11-22 client context; original dated snapshots and evidence directories remain unchanged. **UI7_IMPLEMENTED_LOCALLY / OWNER_SOURCE_REVIEW_PENDING / PUBLICATION_HOLD**. Local-only implementation and verification; no commit/push/PR/merge/deployment or UI8.

## Source preflight and inherited documentation

Pinned main/HEAD `9721022418b58ff917f967519f281e9332e21cc5`, tree `ba107bf64fb4562eaf04c46638667a6ee27be92e`, branch `docs/ui6-postmerge-ui7-discovery-20261122`, no upstream. Source checkout already contained exactly ten local UI6 closure/UI7 discovery documentation paths (seven modified,three new), all read/backed up/hashed before production changes. No inherited work was reset, cleaned, overwritten or discarded. Current-state additions preserve their complete initial bodies as exact byte suffixes; untouched inherited records retain exact initial bytes. UI1–UI6 remain MERGED / SOURCE_CLOSED.

The approved instruction matches the [discovery contract](UI7_TARGET_DISCOVERY.md), and explicitly strengthens profile/hook/context boundaries. App passes only its already-known profile availability and inventory-scope identity to the existing fallback component. This narrow presentation wiring is necessary to enforce the approved unavailable-profile requirement; no route, allowedRole, UserSecurityProfile type, auth provider, permission or server policy changes.

## Demonstrated original behavior and bounded correction

The original dashboard initializes six sources to[], converts repository/cache/trip failures to[] or null, awaits coupled source chains and only logs outer failures. It renders numeric card payloads without source-availability/provenance distinctions, and retained LIVE/real-time wording can overstate IndexedDB trip freshness. Conditional return before hooks also made missing/available context transitions unsafe. These were reproduced on the actual production component with controlled failing/pending provider fixtures; they are not claims of live operational incidents or data loss.

The same original37 test/assertion bytes gave5 PASS/32 FAIL before production editing, then37/37 PASS. Additional implementation review isolated two edge defects in the first candidate: foreign-scope cache rows after a failed canonical read could produce an empty-success source, and malformed legacy master fallback could invalidate a successful projects read. A separate unchanged four-case regression gave2 PASS/2 FAIL before correction, then4/4 PASS. The final41-case component population is separate from all historical suites; no original assertion was weakened, deleted, skipped or rewritten.

Exactly six production paths: App.tsx (two presentation props), OperationsDashboardView.tsx, new pure dashboardPresentation.ts and existing AR/EN/UR dictionaries. WidgetFilterBar, dashboardService, dashboard types, repositories, canonical read contracts, cache/IndexedDB schema, server, Rules, navigation and all UI1–UI6 tests remain unchanged. No test fixtures or fabricated rows are exposed in production.

## Source contract and dependency matrix

| Source | Actual provider / provenance | Failure, empty and existing fallback contract | Dependent display |
| --- | --- | --- | --- |
| PROJECTS | scoped projectRepository.listAll,Firestore SDK;positive fallback from offlineCacheService.getProjects | Repository rejection is tracked;existing fallback occurs on empty/error. A successful repository[] remains empty,not failure. Positive scoped cached records are local snapshots. Failed repository plus empty/foreign/unavailable cache is unconfirmed/unavailable. SDK/cache internals do not expose every failure or server-cache metadata. | Project filters/labels and terminal project names;not trip-total arithmetic |
| CARRIERS | projectProvisioningService.listProjectCarriers per scoped project,existing canonical GET;derived memberships/global identities | Individual project rejections remain visible;successes retained as PARTIAL. Successful[] is distinct from rejection. Existing master-cache fallback is retained for malformed aggregation,not invented for every network failure. | Carrier performance names,terminal labels,carrier selectors |
| MATERIALS | listProjectMaterials per scoped project,existing canonical GET;derived memberships/identities | Same independent settled/partial/empty semantics;existing malformed-aggregation cache fallback | Material names/codes/distribution,terminal labels,material selectors |
| TRUCKS | projectFleetReadModelService per scoped project;existing projected fleet rows | Shares fleet outcome with DRIVERS;partial by project. Original successful-row mapping retained. Scoped legacy cache fallback only under existing branch. | Terminal plate/type labels |
| DRIVERS | same fleet response,original driverId projection | Same shared fleet availability and per-project partial result;not an independent new query | Terminal driver names |
| TRIPS | actual principal-partitioned IndexedDB getAll('trips') then strict filterProjectScope | Successful local[] means no available local records,not complete server absence. Initial failure suppresses every numeric widget payload. Read-again failure may retain only the same context's existing local snapshot with explicit unavailable status. No new server fallback. | Primary numeric input of all seven widgets |

All reads capture the actual current UID and approved project scope. Canonical read/model results may lack server freshness evidence, including Firestore SDK results whose snapshot metadata the repository does not expose. The UI therefore does not infer server-current data even when a repository call succeeds. Every displayed time is actual client read-completion observation,explicitly not last server synchronization. No new cache metadata or storage fields are written. Legacy malformed-master fallback's pre-existing in-memory mapping timestamps remain internal and are never presented as server freshness.

Carrier/material/master names are auxiliary to existing trip-derived arithmetic. If they fail while trips remain usable, safe metrics remain visible with a PARTIAL qualification and the original identifier/name fallback. If trips are unavailable with no retained snapshot, all seven numeric payloads are unavailable rather than measured zero. Source state and widget state are separate.

## UI state and metric truth

Presentation-only states: LOADING, READY_WITH_DATA, READY_EMPTY, PARTIAL, UNAVAILABLE, RETAINED_LOCAL_SNAPSHOT. No persisted canonical status or return type changes. Widget FILTER_EMPTY additionally describes a selected filter over available snapshot records;it is distinct from source-empty. Partial or retained views show their limits;successful emptiness is not a failure.

The source summary is compact/collapsible. Each existing widget retains its hierarchy,filter controls and original payload,with one concise status line. Global/widget override and reset behavior is unchanged;read-again preserves filters. The LIVE badge/real-time description and terminal live indicator are replaced with truthful snapshot wording. Loading/unavailable terminal counts use an em dash instead of fabricated zero. Tables remain bounded scroll surfaces;320/768/1440 layouts and keyboard details/button interactions are checked. No global redesign.

All seven original metric/filter useMemo blocks remain byte-identical to the baseline,as does dashboardService.ts. No Trip status/tonnage/variance/settlement/carrier/material/pricing/terminal formula,financial snapshot,alias or calculation input is rewritten for valid authorized datasets. Additional helper computations determine display readiness only. Source-read recovery calls existing read methods,not Outbox sync,cache seeding,Trip commands,provider repair or a new endpoint.

## Authorization, hook order and async retirement

The wrapper always executes the same hooks;missing/unavailable/unsupported contexts mount no data workspace. Existing supported data roles remain SUPER_ADMIN,PROJECT_ADMIN,SITE_SUPERVISOR and FINANCE_AUDITOR (plus pre-existing AUDITOR compatibility);non-super contexts require assigned scope. VIEWER remains fail closed despite navigation admitting the route;no project access is granted to remove an empty state. App additionally forwards inactive/profile-unavailable/loading status without redefining any canonical permission.

An immutable owner identity changes for actor,role,assigned scope,profile availability or authority key. Each mounted workspace and StrictMode setup owns a captured lease,permanently retired on cleanup. Each read run owns a request sequence and checks lease identity,retirement,current owner,current UID and request number before publication or dependent queries. A→B→A,profile unavailable→available,scope/role changes,late failures,late cached fallback,unmount/remount and out-of-order StrictMode reads cannot revive an old context. This does not depend on a revivable isMounted boolean. No new subscriptions,polling or automatic reconnect behavior.

Server/Rules/repository authorization remains authoritative. Cached data and UI availability never confer access. Real authenticated verification independently exercises current-role retirement,strict scoped reads,foreign cached-trip exclusion,actor-separated storage and server403 denial.

## Verification and exact identity reconciliation

| Final gate | Actual result |
| --- | --- |
| Original37-case actual-component red/green |5/37 PASS,32 FAIL →37/37 PASS,identical bytes |
| Additional four-case contract edge red/green |2/4 PASS,2 FAIL →4/4 PASS,identical bytes |
| Final41 component cases inside affected family |41/41 PASS |
| Authoritative clean frozen baseline |723/748 — NOT PASS;3 historical failed +22 setup-unexecuted |
| Final candidate |764/789 — NOT PASS;all748 original instances retain their exact disposition;41 new passing instances |
| Historical UI6 family subpopulation |678/703 — NOT PASS,all703 dispositions preserved;45 added dashboard/read-context baseline cases pass independently |
| Preserved focused families |UI6 original33/33,PUB01 26/26,IR01/IR02 65/65;UI5 76/76 (includes PUB01 27/27),UI5-IR01 10/10 |
| Expanded dashboard/read families |dashboardReportsI18n9/9,Block80 19/19,projectFleetReadModelAdminReadContext11/11,runtimeDefaultDataElimination6/6 |
| Unchanged runtime translation command |16/16 PASS |
| Final full TypeScript/npm lint/client-PWA-server build |PASS,Node22.22.0;existing chunk/dynamic-import warnings retained |
| Final native Edge |9/9 PASS,AR/EN/UR ×320/768/1440,Edge157.0.4341.60;final source sealed before/after;no LIVE badge or horizontal document overflow |
| Fresh authenticated UI7 integration |1/1 PASS,actual Auth/Firestore emulators,production scoped read routes,current-role retirement and server403,real principal-partitioned browser IndexedDB;owned services stopped,no remaining listeners |

Exactly the same three inherited failures remain in adminConsoleConvergence.test.ts (Phase6 projectRepository subscription,userRepository subscription,auditLogService subscription assertions). The same22 inherited canonicalReplayHarmonizationBlock132/imported conflictResolution beforeAll-unexecuted cases retain the AUTH_CONTEXT_CHANGED setup cause. A filename+fullName+occurrence comparison accounts for inherited duplicate titles. No test removal,new skip or new confirmed failure identity. These aggregates are explicitly NOT PASS;they are not replaced by the focused green gates. Historical offline-continuity53/53 is preserved,not rerun as fresh SQL acceptance for this read-only UI boundary.


The initial long baseline run is preserved as preliminary because it was not source-sealed throughout its execution. The authoritative comparison uses a separate clean detached checkout at the pinned merge,with all1895 tracked raw hashes equal before/after its full run. Candidate,final browser and authenticated runs seal production hashes before/after. Earlier candidate/display-refinement runs remain separately preserved. An intermediate TypeScript run found three diagnostics in the new browser fixture binding/type declaration;those fixture typings were corrected without changing assertions,production types or compiler settings. The final compiler result is reported separately,not relabeled retroactively.

Historical UI6 Edge9/9 and authenticated emulator1/1 remain their original dated records. Fresh UI7 native and authenticated results are separate:browser identity/read-provider boundaries are controlled;authenticated verification uses actual Auth/Firestore emulators,production read routes and principal-partitioned IndexedDB. Neither establishes live production/device/assistive-technology acceptance. Emulator ownership/cleanup receipts prove no pre-existing service was stopped.

## Preservation, inventory and owner gate

All22 protected worktrees retain exact HEAD,status and pre-existing dirty hashes. RB4 original nine dirty files/unpublished013 remain unchanged. The published UI6/correction checkouts and the clean baseline control remain intact. All ten inherited documentation snapshots,prior UI6 closure,raw ZIPs,manifests,failed/interrupted attempts and dated red-to-green evidence remain preserved. Full current inventory and source/test/old-evidence fingerprints are in [UI7 verification](ui7/verification.json);[new raw archive](ui7/verification-raw.zip) retains original red/green controls,identity comparison,source/provider/widget matrix,authority proof,compiler/build logs,browser and authenticated evidence.

Firestore remains operational authority. No canonical project/trip write,server/Rules/query API change,IndexedDB/Outbox modification,SQL cutover,dual write,RB4/013 activation/publication,UI8,commit,push,PR,merge or deployment. Physical-device,screen-reader,live operations,Google Workspace,product and Beta2 acceptance remain outstanding. Owner must review the exact local source and evidence before any separately authorized publication.

**UI7_IMPLEMENTED_LOCALLY / OWNER_SOURCE_REVIEW_PENDING / PUBLICATION_HOLD**.


## Exact local path inventory

Includes the ten inherited UI6 closure/UI7 discovery paths;it is not a25-file UI7-only implementation delta. Final25 paths:6 production,6 new tests/fixtures,13 documentation/evidence (ten inherited plus three new UI7 records).

- `docs/reconstruction/00_WORK_START_HERE.md`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/MASTER_PROJECT_HANDOFF.md`
- `docs/reconstruction/UI6_IR01_IR02.md`
- `docs/reconstruction/UI6_OUTBOX_STATUS_RECOVERY.md`
- `docs/reconstruction/UI6_POSTMERGE_CLOSURE.md`
- `docs/reconstruction/UI6_PUB01_RECEIPT_TRUTH.md`
- `docs/reconstruction/UI7_DASHBOARD_SOURCE_CLARITY.md`
- `docs/reconstruction/UI7_TARGET_DISCOVERY.md`
- `docs/reconstruction/ui6/postmerge-closure.json`
- `docs/reconstruction/ui7/verification-raw.zip`
- `docs/reconstruction/ui7/verification.json`
- `src/App.tsx`
- `src/components/dashboard/OperationsDashboardView.tsx`
- `src/components/dashboard/dashboardPresentation.ts`
- `src/locales/ar/index.ts`
- `src/locales/en/index.ts`
- `src/locales/ur/index.ts`
- `src/tests/helpers/ui7DashboardBrowserEntry.tsx`
- `src/tests/helpers/ui7DashboardConnectedEntry.tsx`
- `src/tests/ui7DashboardAvailability.test.tsx`
- `src/tests/ui7DashboardBrowser.test.ts`
- `src/tests/ui7DashboardConnected.test.ts`
- `src/tests/ui7DashboardContractEdges.test.tsx`
