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

The [ledger](02_PHASE_LEDGER.md) is the single current-state authority. Accepted source history has progressed through the Smart Import Master Design correction, SI-CG1, SI-CG2, durable sessions (P8-B1) and reviewed-intent commit authority (P8-B2). The P8-B2 merge is `1f7f3344e65dfc9b6837b10cb5349827da1587eb`; P8-B3 recovery is merged through PR #60. B4 coordinates the same server truth in the resumed Wizard journey.

Smart Import separates source discovery, approved mapping, canonical resolution, reviewed semantic intent, durable session artifacts, server commit authority and execution recovery. Current reference sections are in [Architecture](../ARCHITECTURE.md), [Data Model](../DATA_MODEL.md), [API Contract](../API_CONTRACT.md) and [Security Model](../SECURITY_MODEL.md). B3 reuses B2 and canonical business authorities; independent dependency groups retain atomic mutation/receipt boundaries. Completed effects are not replayed or rolled back by cancellation. Terminal summary limits retain full journal details and do not imply full current convergence proof.

The P9-U1 instruction authorizes local verification, documentation, one commit and branch publication; owner merge remains manual for the current unit. Merged B4 includes resume UI and the shared Sheets Roster adapter. Typecheck/lint debt and external-dependent test failures remain separately observed; passing build or local in-memory tests does not certify live Firebase, Beta 2, user acceptance or release readiness.
### Current Reconstruction Checkpoint — 2026-10-29

- Historical merged B3 baseline used to implement B4: `8c6a348d17b0f94215a56bb9a66f2e643c19f24c`.
- Verified P9-U1 implementation baseline: PR #61 — P8-B4, `31b2065f00b0d07763afc153582ef9be71dbd159`.
- Phase 0: VERIFIED / CLOSED / FROZEN.
- Phases 1–2: VERIFIED / CLOSED.
- Phase 7 — Smart Import Core: SOURCE CLOSED.
- Pre-Phase-8 correction gate: CLOSED through SI-CG1 + SI-CG2.
- Phase 8 — Smart Import Persistence, Resume & Commit Integrity: MERGED / SOURCE_VERIFIED / CLOSED.
- P8-B1 — Durable Session & Reviewed Intent Authority: MERGED / SOURCE VERIFIED / CLOSED, PR #57, merge `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`.
- P8-B2 — Server Commit Authority & Prepared Identity Materialization: MERGED / SOURCE VERIFIED / CLOSED, implementation `6b56d2def2f02aae1d60b5a7d3352210cc584931`, PR #58, merge `1f7f3344e65dfc9b6837b10cb5349827da1587eb`.
- B3 is merged/source-verified; B4 supplies the resume UI coordination. Exact current status and next action belong only to [the ledger](02_PHASE_LEDGER.md).
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
13. Merged P8-B3 preserves the above invariants through its durable execution journal; B4 renders that authority without creating a second commit or execution authority.

### Immediate continuation

Open [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) for current continuation. [The dated P8-B2 handoff](CURRENT_CONVERSATION_HANDOFF_2026-10-28.md) is historical. Do not reopen SI-CG1, SI-CG2, P8-B1 or P8-B2 without a concrete regression supported by current GitHub main.


### Pricing authority continuation

Exact current unit/status is owned by [the ledger](02_PHASE_LEDGER.md). P9-U1 uses authenticated server rule reads/writes, canonical participation, one effective-date/selection policy, transaction-backed operational assignment and fixed Trip snapshots. Setup and field previews do not own separate commercial persistence. Later rules cannot reprice historical Trips; missing historical waiting terms are pending rather than inferred from today's rules. The simulator is non-persistent. Client-only COW stubs do not constitute a production repricing service. Phase 9 remains in progress and Phase 10 is not started.
