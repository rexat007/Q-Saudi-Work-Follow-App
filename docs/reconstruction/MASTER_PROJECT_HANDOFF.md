# MASTER PROJECT HANDOFF
## Architectural Overview & Handoff Reference

### Program Overview
This document serves as the master project handoff reference for the Q-Saudi Work Follow reconstruction program. It synthesizes architectural decisions, core system models, data boundaries, and technical stack details to guide engineering execution across Phase 0 through Phase 18.

---

### System Architecture Summary
- **Frontend Stack**: React 19 SPA built with Vite 6, Tailwind CSS v4, Lucide React icons, RTL Arabic alignment, PWA Service Worker.
- **Server Stack**: Node.js with Express server in `server.ts` / `server/app.ts`, running via `tsx` in development and bundled to `server-dist/server.cjs` via Esbuild for production (`"start": "node server-dist/server.cjs"`).
- **Persistence Stack**: Firebase Firestore (multi-tenant collections) & Firebase Authentication (via `firebase-admin` on server and `firebase/app` on client).
- **Project Setup Workflow**: Accepted 8-Layer Project Setup model (`src/services/projectSetupWorkflow.service.ts` & `src/components/wizard/ProjectSetupWizard.tsx`).
- **Domain Services**: Canonical drivers, carriers, materials, fleet rows, pricing rules, and trip dispatch repositories.

---

### Handoff Directives
1. **Repository Authority**: All reconstruction work operates under the rules defined in `docs/reconstruction/DOCUMENT_AUTHORITY.md`.
2. **Phase Continuity**: Refer to `docs/reconstruction/02_PHASE_LEDGER.md` for current active phase and unit state.
3. **Quality Gates**: All code changes must pass through gates defined in `docs/reconstruction/04_VERIFICATION_AND_PUSH_GATE.md`.

### Current repository and acceptance scope

Supporting overview, checked against main `b360fe7c717cff35357dc539ca37d83bea1b348c`; unit status is owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). `package.json` defines Node 22 / npm 10 (`npm@10.9.8`), with `package-lock.json` canonical. `server.ts` mounts Vite middleware in development and serves `dist` in production; the production server bundle is built with Esbuild. Firebase Auth/Firestore remain in use. Server-authoritative services are accepted boundaries, not a blanket live-certification claim for every legacy path.

The setup layers in `projectSetupWorkflow.service.ts` are FOUNDATION, WORKSPACE, MATERIALS, CARRIERS, ROSTER, PRICING, ACCESS and REVIEW_ACTIVATION. ACCESS is the semantic access/governance identity; the retired numeric Phase-4 UI shape is not restored. Historical restoration Phase/Block names are not the reconstruction roadmap's current status.

Whole-App i18n Batches 1–4 and residual remediation are merged and accepted for the current stage. AR/EN/UR parity is established; dictionary size is dynamic. Browser review is sufficiently accepted for this stage, without claiming exhaustive manual label verification. Mixed/bilingual labels remain deferred non-blocking debt. Future desktop/company/database/licensing directions remain proposals under [the future-direction document](FUTURE_ARCHITECTURE_AND_DISTRIBUTION_DIRECTION.md), not current implementation.


### Current Reconstruction Checkpoint — 2026-10-23

- **Authoritative main**: `b360fe7c717cff35357dc539ca37d83bea1b348c` (PR #26 merged).
- **Phase 0**: VERIFIED / CLOSED / FROZEN.
- **Phase 1**: IN_PROGRESS.
- **Closed Phase 1 units**: P1-U1 through P1-U7.
- **Active unit**: P1-U8 — User Entity Role Vocabulary Authority Convergence.
- **P1-U8 status**: NOT_STARTED / ACTIVE.
- **P1-U8 production scope**: exactly `src/types/entities.ts`.
- **Canonical role authority**: `UserRole` in `src/types/common.ts`.
- **Only target fields**: `UserEntity.role` and `UserEntity.requestedRole`.
- **Do not touch in P1-U8**: `src/types/wizard.ts`, `src/validators/user.validator.ts`, `server/security.middleware.ts`, RBAC, auth context behavior or UI role choices.
- **Deferred to Phase 3**: wizard role subset semantic review, validator authorization/validation review, and AuthenticatedUser role-context convergence.
- **Next after verified P1-U8 merge**: PHASE_1_CLOSURE_AUDIT. No P1-U9 is assigned.
- For conversation transfer use [CURRENT_CONVERSATION_HANDOFF_2026-10-23.md](CURRENT_CONVERSATION_HANDOFF_2026-10-23.md).
