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

---

## OPEN_DECISIONS
- **OD-01**: Canonical lockfile convergence strategy (`package-lock.json` vs `bun.lock`).
- **OD-02**: Consolidation strategy for standalone TSX test scripts into unified Vitest test runner.

---

## BLOCKING_DEBT
- None in current Phase 0 setup.

---

## DEFERRED_DEBT
- **DD-01 (DEFERRED_TO_PHASE_8)**: Known Smart Import session-restore contract edge case during full batch recovery. Tracked for resolution during Phase 8 (Smart Import Persistence, Resume & Commit Integrity), NOT as a Phase 0 quick patch task.
- **DD-02 (DEFERRED_TO_PHASE_15)**: Monolithic client chunk size warning (> 500 kB) in Vite build output. Tracked for Phase 15 performance optimization.

---

## RETIREMENT_CANDIDATES
- Root-level ad-hoc diagnostic scripts (`test-*.ts`, `verify-*.ts`) after proving zero runtime callers.
- Legacy or duplicate mock services superseded by canonical server services.
