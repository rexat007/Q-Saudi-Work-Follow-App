# PHASE 0 CURRENT AUDIT

## Verified Engineering Baseline Summary

### 1. Runtime Stack
- **Frontend**: React 18 SPA built with Vite 6, Tailwind CSS v4 (`@import "tailwindcss";`), Lucide React icons, PWA Service Worker (`vite-plugin-pwa`).
- **Backend Server**: Express server in `server.ts` / `server/app.ts`, running via `tsx` in dev and bundled to `server-dist/server.cjs` via Esbuild for production execution (`"start": "node server.ts"`).
- **Persistence**: Firebase Firestore and Firebase Auth (via `firebase-admin` on server, `firebase/app` on client).

### 2. Testing & Verification Infrastructure
- **Test Runner**: Vitest (`v5.0.3`) as primary test runner.
- **Standalone Test Scripts**: Legacy standalone TSX test scripts (e.g. `npx tsx src/tests/projectWorkflowNavigation86E.test.ts`).
- **Test Categories**: Source-text static inspection tests, unit tests, integration component tests.

### 3. Identified Gaps & Technical Reality
- **TypeScript Strictness**: `tsconfig.json` currently has `"strict": false` or relaxed type checks, leading to pre-existing test mock type errors outside changed scopes.
- **Dependency Lockfile Baseline**: Dependency lockfile state needs formal convergence across environment tools.
- **GitHub CI Baseline**: GitHub Actions CI workflow requires formal integration to enforce automated gates on every pull request.
- **Root Historical Repair Scripts**: Ad-hoc root diagnostic and repair scripts exist from historical development blocks.
- **Documentation Authority**: `RELEASE.md` is historical evidence, not current release truth. Reconstruction artifacts serve as the single source of truth.
