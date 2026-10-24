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
3. **Quality Gates**: Verification is proportional to risk; standing gates remain defined in `docs/reconstruction/04_VERIFICATION_AND_PUSH_GATE.md`.
4. **Execution Method**: Follow `docs/reconstruction/STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md`: phase-level audit, bounded batches, combined publication, manual owner merge, one normal post-merge audit, and extra gates only where risk justifies them.

### Current repository and acceptance scope

Supporting overview, Phase 2 activation evidence baseline `747e86662b867aa5990f87fb0e60c79b077efb86`; unit status is owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). `package.json` defines Node 22 / npm 10 (`npm@10.9.8`), with `package-lock.json` canonical. `server.ts` mounts Vite middleware in development and serves `dist` in production; the production server bundle is built with Esbuild. Firebase Auth/Firestore remain in use. Server-authoritative services are accepted boundaries, not a blanket live-certification claim for every legacy path.

The setup layers in `projectSetupWorkflow.service.ts` are FOUNDATION, WORKSPACE, MATERIALS, CARRIERS, ROSTER, PRICING, ACCESS and REVIEW_ACTIVATION. ACCESS is the semantic access/governance identity; the retired numeric Phase-4 UI shape is not restored. Historical restoration Phase/Block names are not the reconstruction roadmap's current status.

Whole-App i18n Batches 1–4 and residual remediation are merged and accepted for the current stage. AR/EN/UR parity is established; dictionary size is dynamic. Browser review is sufficiently accepted for this stage, without claiming exhaustive manual label verification. Mixed/bilingual labels remain deferred non-blocking debt. Future desktop/company/database/licensing directions remain proposals under [the future-direction document](FUTURE_ARCHITECTURE_AND_DISTRIBUTION_DIRECTION.md), not current implementation.


### Current Reconstruction Checkpoint — 2026-10-24

- Current verified GitHub main: `e09cd613d93d3e6519fe1dc283caf96d4363bcec`.
- Phase 0: VERIFIED / CLOSED / FROZEN.
- Phase 1: VERIFIED / CLOSED.
- Phase 2 — Persistence & Server Authority: VERIFIED / CLOSED.
- P2-U1 through P2-U4: VERIFIED / CLOSED.
- Phase 3 — Authentication, Authorization & Administrative Governance: IN_PROGRESS at governance level.
- Active unit: UNASSIGNED / REQUIRES_PHASE_3_AREA_AUDIT.
- Next action: `PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT`.
- Known Phase-3 carryovers include wizard role-subset semantics, UserValidator authorization-role semantics, server AuthenticatedUser/auth-context convergence, RBAC/field authorization, IDOR defenses and administrative governance.
- Global TypeScript diagnostics baseline 445 and lint EXIT 2 / NOT PASS remain debt; they are not Phase 2 closure blockers.