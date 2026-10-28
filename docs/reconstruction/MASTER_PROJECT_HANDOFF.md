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


### Current reconstruction checkpoint

The [ledger](02_PHASE_LEDGER.md) is the single current-state authority. Accepted source history has progressed through the Smart Import Master Design correction, SI-CG1, SI-CG2, durable sessions (P8-B1) and reviewed-intent commit authority (P8-B2). The P8-B2 merge is `1f7f3344e65dfc9b6837b10cb5349827da1587eb`; the local P8-B3 recovery layer is awaiting owner review and is not published or accepted.

Smart Import separates source discovery, approved mapping, canonical resolution, reviewed semantic intent, durable session artifacts, server commit authority and execution recovery. Current reference sections are in [Architecture](../ARCHITECTURE.md), [Data Model](../DATA_MODEL.md), [API Contract](../API_CONTRACT.md) and [Security Model](../SECURITY_MODEL.md). B3 reuses B2 and canonical business authorities; independent dependency groups retain atomic mutation/receipt boundaries. Completed effects are not replayed or rolled back by cancellation. Terminal summary limits retain full journal details and do not imply full current convergence proof.

Remaining gates are local verification and owner review, followed only by separately authorized publication. P8-B4 resume UX and full Sheets Roster convergence remain outside this unit. Typecheck/lint debt and external-dependent test failures remain separately observed; passing build or local in-memory tests does not certify live Firebase, Beta 2, user acceptance or release readiness.
