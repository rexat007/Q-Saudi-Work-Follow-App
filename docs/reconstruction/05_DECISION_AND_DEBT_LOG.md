# DECISION AND TECHNICAL DEBT LOG

## CLOSED_DECISIONS
- **CD-01**: Express server mounted as Vite middleware in dev (`"dev": "tsx server.ts"`), bundled to `server-dist/server.cjs` via Esbuild for production (`"start": "node server-dist/server.cjs"`).
- **CD-02**: Firestore is the primary canonical persistent database for projects, rosters, dispatch trips, and outbox state.
- **CD-03**: 8-Layer Project Setup Workflow model is the accepted architectural standard for project onboarding and readiness evaluation.
- **CD-04**: React SPA on Vite with Tailwind CSS and RTL Arabic as the primary UX interface.
- **CD-05**: Local project override bridge in Project Setup Wizard converges away immediately upon canonical `globalProjects` subscription arrival.
- **CD-06**: P0-A0 Google AI Studio Artifact Bootstrap completed successfully as active planning surface.
- **CD-07**: `docs/reconstruction/` established as the repository-installed documentation authority.
- **CD-08**: P0-U1 governance baseline and semantic convergence (P0-U1R) were independently verified against GitHub commit `674c6a5a5cf1aa1680c43728aa67e1e0fd3170de`, and P0-U1 is CLOSED.
- **CD-09**: NPM established as canonical package manager with `package-lock.json` as canonical lockfile, restricting Node to `>=22 <23` and NPM to `>=10 <11`. All alternate lockfiles ignored.
- **CD-10**: P0-U2 Canonical Toolchain & Dependency Reproducibility was independently verified against commit `715345bba8688fa706fce1bac7add78a9c5e8a28`. Canonical contract: `npm@10.9.8`, Node `>=22 <23`, npm `>=10 <11`, `package-lock.json` canonical, alternate package-manager lockfiles prohibited. P0-U2 is CLOSED.
- **CD-11**: P0-U3 Test Taxonomy & Harness Architecture formally approved:
  - **Target Architecture**: Option C (Canonical Vitest for active unit/integration/server/UI/static tests; retain specialized/manual scripts only with explicit justification).
  - **Execution Strategy**: Option D (Staged phase-aligned convergence; no bulk migration of historical tests in Phase 0).
  - **Canonical Automated Harness**: Vitest is canonical for all active automated tests (`UNIT`, `INTEGRATION_MOCK`, `SERVER_CONTRACT`, `UI_DOM`, `STATIC_GOVERNANCE`).
  - **Specialized Harnesses**: Strictly isolated and require explicit justification.
  - **Historical Test Debt**: 125 historical test files are preserved and assigned to the appropriate owning reconstruction phase across Phase 0 through Phase 16, with Phase 0 restricted to genuine foundation/tooling/governance tests, not migrated in Phase 0.
  - **Scope Boundary**: Production TypeScript debt (23 diagnostics) remains strictly outside P0-U3 unless directly caused by test infrastructure; P0-U3 focuses exclusively on test harness convergence and test-side typing hygiene.
- **CD-12**: P0-U3 Block 57 Pilot Data Authority & Semantic Reconciliation (Option B):
  - `PILOT_REPAIRS_DATA` is preserved as an immutable historical repair snapshot.
  - `item.ar` represents `SOURCE_SNAPSHOT_AT_BLOCK_57`, not a forever-immutable constraint.
  - Historical snapshots do not override later accepted canonical locale values.
  - Current locale dictionaries (`src/locales/`) are current canonical translation authority.
  - `qualityPilotBlock57.test.ts` remains ACTIVE after semantic remediation (removing stale exact-equality check `ar === item.ar`, preserving presence, non-emptiness, and all 6 quality invariant guards).
  - Block 84A current canonical value for `navigation.labels.projects` (`إدارة المشاريع متعددة الأطراف`) is strictly preserved and not reverted.
  - `scripts/run-pilot-repair-block57.ts` remains unchanged as historical one-time migration evidence (not a current execution tool).
- **CD-13**: P0-U3 Block 83A UI Semantic Reconciliation (Option B):
  - `uiuxFixesBlock83A.test.ts` is retained as an active regression suite.
  - FIX-04 historical `text-slate-300` icon requirement is superseded.
  - Current `SystemToolsDrawer.tsx` icon colors may use canonical brand/domain semantic colors.
  - Current neutral badge invariant is: `bg-slate-800`, `text-slate-200`, `border-slate-700`.
  - Historical UI snapshots do not override later accepted production UI.
  - Production UI was not changed to satisfy the stale assertion.
- **CD-14**: P0-U3 Block 102 Contract Authority Split (Keep Groups 1–4, Defer Group 5):
  - Block 102 is a mixed historical/current suite.
  - Groups 1–4 remain current canonical unit guards (RBAC, multilingual normalization, entity resolution with carrier conflict, material blocking validation).
  - Group 5 historical commit/ID expectations are superseded by the server-authoritative canonical intake architecture.
  - Group 5 is removed from the Phase 0 active test rather than rewritten against production.
  - Canonical Driver/Truck creation authority remains `driverTruckIntakeServer.processSharedIntake(...)`.
  - `driverTruckIntakeP602A.test.ts` remains authoritative for server intake.
  - Current ID-generation systems remain unchanged.
  - Client commit/ID integration verification belongs to Phase 7 / Phase 8.
  - No production behavior was modified to satisfy Block 102.
- **CD-15**: Runtime I18N Discovery Authority Reconciliation:
  - Block 54C runtime audit report (`reports/i18n-block53-runtime-audit.json`) is immutable historical evidence.
  - Historical `componentCoverage.files` is not current source authority.
  - Current runtime translation discovery scans active repository runtime source (`src/App.tsx`, `src/components`, `src/hooks`).
  - Static `>=1100` referenced-key threshold is retired.
  - Referenced-key count is derived dynamically.
  - Runtime invariant is 100% resolution, parity, and parameter/token safety across all current call sites.
  - One live missing key was identified: `trips.labels.txt_default_pricing` in `src/components/TripEngineView.tsx`.
  - That key was added to AR/EN/UR dictionaries only.
  - No historical report was rewritten or regenerated.
  - No retired component was restored.
- **CD-16**: Block 55 Runtime Smoke Dynamic Contract Reconciliation:
  - Block 55 remains active as a runtime smoke and quality gate test suite.
  - All 7 smoke guards remain current in semantic intent.
  - Historical Block 54C source-file discovery (`reports/i18n-block53-runtime-audit.json`) is removed.
  - CD-15 current repository source scan remains authoritative discovery mechanism.
  - Static 1115 referenced-key count retired in favor of dynamic non-empty resolution.
  - Static 736 txt_* referenced-key count retired in favor of dynamic non-empty resolution.
  - No fixed replacement counts introduced.
  - Current key counts are dynamically derived.
  - Test 04 duplication with runtimeKeyAudit is intentionally retained as smoke-level redundancy.
  - Test 05 preserves unique RTL/LTR direction coverage.
  - 12-domain assertion refers only to the explicit representative smoke domain map, not total dictionary domain count (17).
  - Current 12 exception mappings and 13 domain metadata mappings remain canonical.
  - No production or locale changes were required.

---

## OPEN_DECISIONS
- None currently open in Phase 0.

---

## BLOCKING_DEBT
- None in current Phase 0 setup (P0-U2 toolchain blocker: NO).

---

## TYPECHECK_BASELINE_DEBT
- **Status**: RECORDED / UNRESOLVED
- **Current reproducible full-repository tsc result**: exit 2
- **Total diagnostics**: 420
- **src/tests diagnostics**: 397
- **Production source diagnostics**: 23
- **P0-U2 changed TypeScript files**: NONE
- **Errors originating from P0-U2 changed files**: 0
- **Valid pre-P0-U2 passing tsc baseline**: UNVERIFIED
- **Classification**: REPRODUCIBLE_PREEXISTING_OR_UNVERIFIED_DEBT
- **P0-U2 toolchain blocker**: NO

### Principal Debt Families:
1. **Stale Smart Import / entity-resolution test fixtures**: Object shape drift in test mocks where `ImportEntityResolutionInfo` expanded to include mandatory fields (`originalValue`, `confidence`, `isExact`, `riskLevel`).
2. **AuthUserContext / PipelineContext contract drift**: Interface evolution requiring `displayName`, `assignedProjectIds` on user context and `userId` on pipeline context, while removing `relContext`.
3. **Retired navigation-tab test drift**: Tests comparing or assigning `NavTabId` to retired tabs (`TRIP_ENGINE`, `EXCEPTION_ENGINE`, `IMPORT_CENTER`).
4. **Status / enum literal drift**: Mismatched string literals passed to enum-like unions (e.g. `REVIEW_REQUIRED` vs `ImportCommitStatus`, `FIELD_SUPERVISOR` vs `UserRole`).
5. **Missing helper / icon imports**: Missing imports in UI components and tests (e.g. `ShieldAlert` from Lucide, `createEmptyImportBatch`).
6. **Stale internal type import location**: Imports attempting to resolve types like `AuthUserContext` from `../types/entities` instead of canonical auth definitions.
7. **Date / String operational typing mismatch**: Operational service methods passing string ISO timestamps where `Date | Timestamp` is required.
8. **Vitest global test-environment typing**: Calling `expect` in tests without explicit vitest import or ambient globals definition.

### Resolution & Governance Routing Policy:
- Test-harness, static mock, and test-environment typing debt (397 diagnostics) will be systematically triaged in **P0-U3 (Test Taxonomy & Harness Convergence)**.
- Production contract errors (23 diagnostics) must NOT be patched ad-hoc; they are routed to the specific reconstruction phase that owns the affected domain (Phase 7/8 for Smart Import & Entity Resolution, Phase 10 for Trip Service, Phase 12 for Admin/Exceptions).
- Phase 0 Closure (**P0-U7**) must explicitly reassess whether any remaining production TypeScript errors block Phase 0 exit before freezing the repository foundation.

## DEFERRED_DEBT
- **DD-01 (DEFERRED_TO_PHASE_8)**: Known Smart Import session-restore contract edge case during full batch recovery. Tracked for resolution during Phase 8 (Smart Import Persistence, Resume & Commit Integrity), NOT as a Phase 0 quick patch task.
- **DD-02 (DEFERRED_TO_PHASE_15)**: Monolithic client chunk size warning (> 500 kB) in Vite build output. Tracked for Phase 15 performance optimization.

---

## RETIREMENT_CANDIDATES
- Root-level ad-hoc diagnostic scripts (`test-*.ts`, `verify-*.ts`) after proving zero runtime callers.
- Legacy or duplicate mock services superseded by canonical server services.
