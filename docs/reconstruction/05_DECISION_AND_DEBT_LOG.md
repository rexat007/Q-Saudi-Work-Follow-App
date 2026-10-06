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

---

## OPEN_DECISIONS
- **OD-02**: Consolidation strategy for standalone TSX test scripts into unified Vitest test runner.

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
