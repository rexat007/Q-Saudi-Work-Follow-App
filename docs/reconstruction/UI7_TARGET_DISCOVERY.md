## CURRENT UI7 LOCAL IMPLEMENTATION — 2026-11-23

UI1–UI6 remain MERGED / MAIN_SOURCE_VERIFIED / SOURCE_CLOSED at main `9721022418b58ff917f967519f281e9332e21cc5` (tree `ba107bf64fb4562eaf04c46638667a6ee27be92e`). UI7 = IMPLEMENTED_LOCALLY / OWNER_SOURCE_REVIEW_PENDING / PUBLICATION_HOLD; UI8 NOT_STARTED. The owner approved Dashboard Data Source & Availability Clarity after the discovery snapshot below. This task performs no commit,push,PR,merge or deployment.

The legacy dashboard now distinguishes loading,available/empty,partial,unavailable and local/retained sources;seven existing widget payloads disclose their dependency limits. Missing trip reads do not manufacture zero operations;cache snapshots and local observation time do not imply server-current data. Existing metric/filter useMemo blocks and dashboardService are byte-identical. VIEWER/unsupported/missing-scope/unavailable profiles stay fail closed. Immutable context ownership,retired leases and request identity fence actor/scope/role/profile changes,late reads and A→B→A. App forwards existing profile availability/authority identity only;routes,roles,server/Rules,read contracts,cache/schema,Outbox and SQL remain unchanged.

Same original37 component assertions:5/37→37/37;additional unchanged contract-edge cases2/4→4/4;final41/41 PASS. Authoritative frozen baseline723/748 versus candidate764/789 remains **NOT PASS**,with exactly the same3 historical failures and22 setup-unexecuted cases. All703 historical UI6 instance outcomes are preserved;45 expanded dashboard/read baseline cases and41 new cases are counted separately. Native Edge AR/EN/UR ×320/768/1440 final9/9, fresh authenticated UI7 read-isolation1/1, runtime16/16 and full TypeScript/lint/client-PWA-server build PASS. Final source hashes match across affected/browser/authenticated runs. The old UI6 authenticated1/1 remains historical NOT_RERUN;fresh UI7 verification is a separate owned-emulator journey,not live acceptance.

All ten inherited documentation bodies,original raw archives,red/green and failed/interrupted attempts are preserved. All22 protected worktrees,RB4 original nine dirty files and unpublished013 remain unchanged. Firestore remains canonical;no SQL cutover,RB4/013 activation/publication,UI8 or deployment. No physical-device,screen-reader,live operations,Google Workspace,product or Beta2 acceptance.

[Implementation and source/widget contract](UI7_DASHBOARD_SOURCE_CLARITY.md) · [exact25-path inventory and source seal](ui7/verification.json) · [new raw evidence](ui7/verification-raw.zip). Five of the ten inherited records receive only this additive current section;the complete initial bodies remain exact byte suffixes. The other five retain exact initial bytes. Stop at owner source/evidence review;publication remains unauthorized.

---

# UI7 target discovery — Legacy Dashboard Source & Cache Provenance

Date2026-11-22 (Asia/Riyadh). Source: merged main `9721022418b58ff917f967519f281e9332e21cc5`, tree `ba107bf64fb4562eaf04c46638667a6ee27be92e`. **PROPOSED CONTRACT / OWNER_REVIEW_PENDING / UI7_NOT_STARTED**. Read-only discovery; no production/test changes or browser/live observations in this task.

## Roadmap authority and remaining area map

The current ledger's merged snapshot reserved UI7 as NOT_STARTED and did not assign an approved product target. Searched all tracked docs for UI7, read current ledger/start/debt/handoff sections, [Phase0–18 roadmap](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md), [method](STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md), [reconstruction plan](RECONSTRUCTION_PLAN.md), [UI5 alternatives](UI5_TARGET_DISCOVERY.md), [UI6 alternatives](UI6_TARGET_DISCOVERY.md) and UI4–UI6 closure/correction records. Existing UI7 mentions are reservations/exclusions, not an approved contract. No existing approved UI7 scope is displaced.

Foundational Phase11 owns offline resilience, Phase12 audit/administrative controls, Phase13 dashboard analytics, Phase15 responsive product and Phase18 Beta2; these are architectural phase purposes, not assignments of UI7 or permission to implement/activate backend work. UI1 entry/dispatch, UI2 field/timeline, UI3 setup/import/fleet readiness, UI4 configured reporting/export, UI5 account decisions and UI6 Outbox status/recovery are source-closed. The proposal does not reopen their accepted behavior. UI4 also owns shared/legacy export integrity; it is excluded here.

| Remaining surface / active entry | Current source and authority | Ownership boundary |
| --- | --- | --- |
| Legacy dashboard fallback | [App:557](../../src/App.tsx#L557) mounts OperationsDashboardView only when the current operational project lacks operationalConfiguration. Configured projects use AdaptiveOperationalReports. Dashboard role registry is SUPER_ADMIN/PROJECT_ADMIN/FINANCE_AUDITOR/VIEWER at [navigation:166](../../src/services/navigation.service.ts#L166). | Unconfigured fallback's read/provenance presentation remains a separate product surface; configured UI4 reports and all export/financial math remain closed. |
| Security & Compliance | App SECURITY_AUDIT branch at [App:616](../../src/App.tsx#L616), [SecurityAuditView](../../src/components/security/SecurityAuditView.tsx#L29), registry SUPER_ADMIN/PROJECT_ADMIN/FINANCE_AUDITOR. | Diagnostic evidence labels remain distinct from UI5 account governance. Source imports diagnostic test helpers; do not execute them as live certification during discovery. |
| Workspace continuity/recovery | WIZARD project details mount [EnsurePanel:4510](../../src/components/wizard/ProjectSetupWizard.tsx#L4510) and [Recovery:4561](../../src/components/wizard/ProjectSetupWizard.tsx#L4561); mutable-project SUPER_ADMIN/PROJECT_ADMIN gates and server credentials/resources remain binding. | Existing provider/resource/automation journey; real Google acceptance is still separate. No retirement of existing resources/grants/journals. |
| Administration / fleet / developer diagnostics | AdminConsole USERS/SECURITY_ACCESS/AUDIT_LOGS already have independent reads; [FleetSetupWorkspace](../../src/components/wizard/FleetSetupWorkspace.tsx#L26) has loading/error and canonical setup lifetime; developer tools are SUPER_ADMIN-only. | No new demonstrated bounded defect justifies reopening UI3/UI5. Density or multiple distinct canonical controls is not proof of duplication. Developer diagnostic helpers are not operational authority. |

## Ranked candidate comparison

Rank is a source-based product judgment, not measured incident frequency or live severity evidence.

| Rank / candidate | Demonstrated source evidence and user impact | Dependencies / authorization safety / testability | Regression risk and boundary |
| --- | --- | --- | --- |
|1 — Legacy dashboard source/cache provenance | Project read rejection is converted to[] and then cache fallback; carrier/material reads become[] and fleet errors become null; trip cache read failure becomes[]. Rendering/computation continues without read-availability state. An operator cannot see whether an empty/zero result follows available data, partial reads or unavailability. Trips are always read from IndexedDB here, so online connectivity does not establish current server data. Potential P2 presentation risk; no wrong production KPI is claimed. | Existing canonical readers/cache and strict project scope are ready. Read-only display correction can preserve authority and metrics. Strong service regressions, but authenticated component read-lifecycle coverage needs new fixtures. | Medium: large seven-widget component and mixed sources. Bound to read availability/provenance and dependent-value qualification; preserve existing read/fallback policy, filters and metric algorithms. Recommended. |
|2 — Security diagnostic evidence labeling | [SecurityAuditView:72–88](../../src/components/security/SecurityAuditView.tsx#L72) sets16 domain statuses to fixed VERIFIED; helper runs and compliance headings do not prove live security acceptance. Catch logs errors without a separate read/run failure view. This is source-derived ambiguity, not a security bypass or observed user misunderstanding. | Read-only labels can be tested deterministically; diagnostic helpers are present. Privileged route must remain unchanged. | Low–medium technical risk, medium governance impact; less daily operational relevance than dashboard provenance. Defer as a separate diagnostic-truth unit; no test-import refactor campaign. |
|3 — Workspace recovery/action hierarchy | [EnsurePanel:14](../../src/components/wizard/WorkspaceEnsurePanel.tsx#L14) has observe/prepare/verify/manual sync; project details separately offer recovery with Script ID. The actions have different side effects, so source alone does not prove duplicate commands. | Existing server/provider contracts and tests exist; live Google/quiescence acceptance remains an unresolved dependency. Credential/resource changes carry high security risk. | High. Defer; any future unit must preserve generation fences, authorization popup intent, grants, resource identities, bounded observation and provider journals. No provider redesign or RB4 activation. |

Fleet/admin controls are inspected exclusion boundaries, not extra bundled UI7 candidates: source already contains explicit read failures/canonical permission fences, and this audit found no new evidenced reason to reopen them. UI6 queue/receipt improvements are closed, not another discovery candidate.

## Recommended single bounded contract

**UI7 — Legacy Dashboard Source Availability & Cache Provenance.** Owner must approve or revise this contract before any implementation. Goal: users can distinguish available local/canonical reads, unavailable/partial sources, loaded-empty and filtered-empty without treating cached data as live server proof or failed reads as measured zero.

Actual component: [OperationsDashboardView:55](../../src/components/dashboard/OperationsDashboardView.tsx#L55). Current source chain:

1. [133–138](../../src/components/dashboard/OperationsDashboardView.tsx#L133): scoped projectRepository.listAll; empty/error path invokes offlineCacheService.getProjects; results are re-filtered to assigned IDs unless SUPER_ADMIN.
2. [148–150](../../src/components/dashboard/OperationsDashboardView.tsx#L148): per-project canonical carriers/materials/fleet reads individually swallow rejection. Existing outer fallback maps cached master data; because individual rejections are already swallowed, it must not be described as reliably activating for every network failure.
3. [241–258](../../src/components/dashboard/OperationsDashboardView.tsx#L241): trips are read from IndexedDB and filtered by current project scope. Effect runs on actor/role/assigned-scope changes, not a live server stream. Outer error only logs.
4. [291](../../src/components/dashboard/OperationsDashboardView.tsx#L291): widget override filters take precedence over globals; [WidgetFilterBar](../../src/components/dashboard/WidgetFilterBar.tsx#L24) already exposes customized/reset controls. These are distinct scopes, not duplicate business actions.
5. [dashboardService:118](../../src/services/dashboard.service.ts#L118) and metrics at176/252/293 own filtering, counts, tonnage and immutable settlement calculations. Preserve these algorithms and inputs for identical available datasets.

### Proposed inclusions

- Presentation states for observable pending/successful/failed source reads and partial availability across projects, master/fleet and cached trips. Successful local[] means no available local records, not complete canonical server emptiness.
- Clearly label trip inputs as a local snapshot. A read-completion timestamp, if shown, is explicitly a local observation time; never manufacture a server freshness timestamp or an exact data age without existing metadata evidence.
- Distinguish loaded-empty and filtered-empty from unavailable. Preserve a useful retained snapshot only within the same valid actor/scope; label it unavailable/stale rather than current server truth. Never aggregate inaccessible or failed-source absence as a measured zero for a dependent widget. Partial aggregates must disclose their available-data boundary.
- One bounded retry/read-again action for the existing read chain, if needed for failure recovery, with busy/latest-request/retired-context fences. Reuse current readers; no forceRefresh/cache seeding, Outbox sync/retry, Trip command, provider repair or background polling.
- Keep existing global/widget overrides and filter reset behavior. A source retry must not silently clear filters or change calculation/permission semantics. Any scope labels only explain existing behavior.
- AR/EN/UR equivalent uncertainty/source wording, RTL/LTR, keyboard status/alert semantics, narrow320px and768/1440px layouts. No global visual redesign.

### Permissions, authority and unresolved prerequisites

READ_ONLY authority: App route guards, navigation registry, authContext/principal, [projectScope](../../src/utils/projectScope.ts), projectRepository, projectProvisioningService, projectFleetReadModelService, offlineCacheService, IndexedDB and dashboardService. Firestore/server are canonical; a local cache is a display input, never a new permission source. No new roles, assignments, memberships or read scopes.

Two source constraints must be explicitly preserved/reviewed:

- The route admits VIEWER, but OperationsDashboardView's current supported-profile branch recognizes SUPER_ADMIN/PROJECT_ADMIN/SITE_SUPERVISOR/auditor and otherwise leaves authorizedProjectIds empty. This is a source-level role-contract discrepancy, not proof of a security bypass. Preserve fail-closed behavior; do not silently grant VIEWER projects. Owner approval of any role-policy correction would require a separate explicit authorization boundary. UI7 tests must record actual behavior rather than assuming a role works because navigation admits it.
- [offlineCacheService.getProjects:281](../../src/services/offline/offlineCache.service.ts#L281) can return[] after internal profile-read failure. A presentation-only caller cannot reconstruct the hidden reason. Label opaque empty cache results as local availability, not a verified successful server inventory. If owner requires exact provider/auth-failure attribution, stop and revise the contract rather than changing repository/cache result types or authority silently.

Future implementation entry requires a clean pinned main, a matched before/candidate test population, reproducible component red cases for swallowed observable failures, and an approved decision on these limits. No source fix or runtime reproduction was performed in this discovery task.

### Proposed file impact and exclusions

| Classification | Paths / permitted purpose after owner approval |
| --- | --- |
| Presentation target | `src/components/dashboard/OperationsDashboardView.tsx`; optional small pure helper `src/components/dashboard/dashboardPresentation.ts`; existing AR/EN/UR dictionaries for literal complete keys. |
| Tests, future only | New actual-component read/provenance cases and native-browser boundary fixture; keep all existing tests unchanged. |
| Documentation | UI7 contract/current ledger and verification evidence as necessary. |
| KEEP read-only | App.tsx; navigation.service.ts; WidgetFilterBar.tsx (existing filter contract); dashboard.service.ts; types/dashboard.ts; repositories/read transports; offlineCache/indexedDB/Outbox; auth/server/Rules; all Workspace/fleet/account code. |

Excluded: configured AdaptiveOperationalReports/ReportsEngine UI4 behavior; report datasets/export/print/XLSX; financial/tonnage math, pricing/aliases/status values; routes/roles/permissions; new server/API/read contract; cache storage/schema/reconciliation; automatic network refresh/polling; Outbox/retry/receipt/idempotency; Workspace/SQL/RB4/013; deployment/release; UI8. No large component rewrite, auth cleanup or unrelated dependency/CI changes.

### Proposed verification and acceptance

1. Before production changes, reproduce actual-component missing/loading/observable failed source, valid empty, filtered-empty, partial per-project failure, cache fallback, cache-trip rejection, and actor/scope retirement cases. Retain unchanged red assertions for green comparison. New tests must not replace services with invented all-success business authority.
2. Assert canonical/cache readers keep their existing scoped arguments and fallback semantics; no Trip-command/Outbox-sync/provider-repair requests. Exercise the actual production read transport with owned authorized fixtures where practical. Verify canonical authority with authenticated emulator; never claim the historical UI6 emulator as fresh UI7 evidence.
3. Verify delayed reads cannot cross actor/project-scope changes or A→B→A and cannot replace a newer manual retry. Missing auth, empty assigned scope, unsupported role and actual VIEWER behavior remain fail closed. A presentation message must not expand access.
4. For identical available fixtures, dashboardService's counts, tonnage, immutable financial snapshots, IDs, aliases, global/widget filters and reset results remain identical. Compare broad test identities, not a green-count shortcut; preserve UI6 678/703 NOT PASS with3+22 historical debt separately from added tests.
5. Existing affected suites: `fieldReportsCentralDashboardBlock80.test.ts` (registered metric/filter/snapshot tests), `dashboardReportsI18n.test.ts` (currently SSR dashboard checks only the missing-auth branch), `roleBasedNavigationSystemAssemblyBlock81.test.ts`, `runtimeDefaultDataElimination92A.test.ts`, `currentPrincipalRules.test.ts`, `projectFleetReadModelAdminReadContext.test.ts`, UI4 presentation/scope/export tests and UI6 presentation/transport/PUB01/IR regressions as preservation boundaries. `dashboard.test.ts` exports a diagnostic runner; it must not be counted as a newly executed registered Vitest suite without actually invoking verified assertions. Determine the exact matched list during approved implementation.
6. Unchanged runtime-key audit, full TypeScript command/lint and build; report non-green historical outcomes honestly. Native Edge AR/EN/UR ×320/768/1440 for failure/cache/partial/empty/filters/focus and no clipping; owned authenticated-emulator read isolation where practical, explicitly separate from controlled browser identity fixtures. No live account mutations or production data.
7. Owner acceptance: approve the source/cache wording and treatment of partial/opaque-empty data, authorize the stated boundary and confirm required role behavior; then independently review source/test/browser evidence. Physical-device/screen-reader/live operational/Google Workspace and Beta2 remain separate operational acceptance gates, not automatic source completion.

**UI7_IMPLEMENTATION_STATUS: NOT_STARTED / DISCOVERY_ONLY.** No production/test edit, commit, push, PR, merge, deployment or UI8. Owner's next decision is approve/revise this one contract, including the role and opaque-cache limits, or select a different bounded candidate. Documentation remains local and unpublished.
