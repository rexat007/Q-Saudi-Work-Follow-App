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


### Current Reconstruction Checkpoint — 2026-10-28

- Current verified GitHub main: `1f7f3344e65dfc9b6837b10cb5349827da1587eb`.
- Latest verified merge: PR #58 — P8-B2 `feat(import): execute reviewed roster intent atomically`.
- Phase 0: VERIFIED / CLOSED / FROZEN.
- Phases 1–2: VERIFIED / CLOSED.
- Phase 7 — Smart Import Core: SOURCE CLOSED.
- Pre-Phase-8 correction gate: CLOSED through SI-CG1 + SI-CG2.
- Phase 8 — Smart Import Persistence, Resume & Commit Integrity: IN_PROGRESS.
- P8-B1 — Durable Session & Reviewed Intent Authority: MERGED / SOURCE VERIFIED / CLOSED, PR #57, merge `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`.
- P8-B2 — Server Commit Authority & Prepared Identity Materialization: MERGED / SOURCE VERIFIED / CLOSED, implementation `6b56d2def2f02aae1d60b5a7d3352210cc584931`, PR #58, merge `1f7f3344e65dfc9b6837b10cb5349827da1587eb`.
- Active next unit: **P8-B3 — Durable Execution Journal & Recovery**, NOT_STARTED.
- Current diagnostics baseline: **440**.
- Lint remains **EXIT 2 / NOT PASS** historical debt.
- Remaining focused Smart Import failures are historical C5 cases **38, 61, 62, 67**; P8-B2 introduced zero new failures.
- P8-B1 and P8-B2 do not have live Firebase acceptance; controlled automated/browser evidence is accepted as source verification only.

### Smart Import binding architecture at this checkpoint

The accepted Smart Import product model is:

```text
SOURCE
→ DISCOVERY
→ MAPPING APPROVAL
→ NORMALIZATION
→ CANONICAL IDENTITY RESOLUTION
→ PROJECT PARTICIPATION / AFFILIATION RESOLUTION
→ CROSS-ROW CANONICAL INTENT
→ TRUE EXCEPTION-ONLY HUMAN REVIEW
→ SEMANTIC FINAL REVIEW
→ DURABLE REVIEWED INTENT
→ SERVER CANONICAL COMMIT AUTHORITY
→ CANONICAL REFRESH / PROOF
→ RESULT / RECOVERY
```

Binding rules:

1. **One decision per semantic identity/problem, not per source row.**
2. **Natural identity outranks name/fuzzy evidence.**
3. **Rejected rows remain provenance but do not participate in active semantic groups.**
4. **Material is optional for participation-only roster inputs.**
5. **Contextual missing-entity handling reuses canonical application capabilities.** Smart Import may invoke creation/enrollment/reactivation/affiliation but must not own a parallel Master Data authority.
6. **PREPARED_NEW remains distinct from immediate contextual canonical creation.**
7. **No hidden temporal side effects** during contextual entity creation.
8. **Resume restores persisted facts only; missing source bytes require explicit reattach.**
9. **Reviewed intent is bound to Project + Session + Operation + Batch + Source Revision + Mapping Revision + accepted semantic signature.**
10. **Raw rows are not commit authority after semantic review.**
11. The legacy roster row committer remains fenced by `PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`.
12. P8-B2's atomic commit authority may execute only the exact currently revalidated reviewed consequences; stale semantics fail closed.
13. P8-B3 must preserve all above invariants while adding durable execution journal/recovery for work that cannot remain a single bounded atomic execution.

### Immediate continuation

Open [CURRENT_CONVERSATION_HANDOFF_2026-10-28.md](CURRENT_CONVERSATION_HANDOFF_2026-10-28.md) and continue from **P8-B3 — Durable Execution Journal & Recovery**. Do not reopen SI-CG1, SI-CG2, P8-B1 or P8-B2 without a concrete regression supported by current GitHub main.

