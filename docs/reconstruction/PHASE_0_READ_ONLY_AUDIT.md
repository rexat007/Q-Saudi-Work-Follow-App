# PHASE 0 READ-ONLY AUDIT
## Baseline Audit & Engineering Reality Report (2026-10-06)

### Executive Audit Summary
This audit documents the verified engineering baseline of the Q-Saudi Work Follow repository at the start of Phase 0 (`CURRENT_GITHUB_BASELINE = 118cdc1730d0a08848463da915a0315c2ac542f2`).

---

### Verified Runtime & Tech Stack
1. **Frontend**: React 19 (`react` `^19.0.1`, `react-dom` `^19.0.1`), Vite 6, Tailwind CSS v4, Lucide React, PWA Service Worker (`vite-plugin-pwa`).
2. **Backend**: Express server (`server.ts` & `server/app.ts`) mounted via Vite middleware in dev (`"dev": "tsx server.ts"`) and bundled via Esbuild to `server-dist/server.cjs` for production (`"start": "node server-dist/server.cjs"`).
3. **Persistence**: Firebase Firestore & Firebase Auth (`firebase-admin` on backend, client SDK on frontend).

---

### Test Environment Reality
- **Primary Test Runner**: Vitest (`vitest` `^5.0.1` devDependency in `package.json`).
- **Standalone Test Runners**: Historical standalone TSX runner scripts executed via `npx tsx` (e.g. `npx tsx src/tests/projectWorkflowNavigation86E.test.ts`).
- **Source-Text Static Tests**: A significant portion of tests inspect source text (`fs.readFileSync`) rather than executing behavioral contracts. These are classified as `STATIC` inspection tests.

---

### Technical Debt & Baseline Gaps
- **TypeScript Strictness**: Strict mode is not explicitly enabled in current `tsconfig.json`.
- **Dependency Lockfiles**: `bun.lock` exists in workspace directory, but no canonical lockfile is currently tracked in repo git history.
- **GitHub CI**: CI workflows require formal integration.
- **Ad-Hoc Root Scripts**: Historical repair and migration scripts exist in the root directory and require classification before retirement.
- **Documentation Authority**: `RELEASE.md` is historical evidence only. `docs/reconstruction/` is established as the current documentation authority.
- **Smart Import Restore Debt**: Smart Import session restore edge case remains known and is deferred to Phase 8 (Smart Import Persistence, Resume & Commit Integrity) (`DD-01`).
