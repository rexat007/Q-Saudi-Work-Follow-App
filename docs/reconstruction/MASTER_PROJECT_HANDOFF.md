## GWS2 continuation

Exact current state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). The owner superseded Script-required binding: Firestore is canonical, Sheets is its projection, and Apps Script is optional. GWS2-A+B are implemented / verified / awaiting owner merge on the LIVE-04 merged baseline. GWS2-B adds current canonical master snapshots, atomic dirty/outbox invalidation and stable-ID reconciliation. Both require owner merge and real Q-PRJ-007 acceptance; no live recovery or Google write has been performed here. Existing binding resources must be reused. GWS2-C persistent offline authorization and unattended delivery remain unimplemented and externally blocked; request-driven retries are not autonomous sync. See [the sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) and [authorization prerequisites](GWS2_BACKGROUND_AUTHORIZATION_CONTRACT.md). No Phase 10 or PFAG-OPS work starts here. Earlier checkpoints below are historical where superseded.

## Historical GWS1B-LIVE-02 continuation

Exact current state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). PR #69 merged PWA generation convergence; owner reports the current Q-PRJ-007 error is DESTINATION_NOT_WRITABLE. Initial provisioning now validates the Picker-granted writable folder and selected-ID registry/reservation checks without migration ancestry traversal. drive.file is preserved; migration validation/scopes/blueprint/Script are unchanged. Source fix requires owner review/merge/deploy and a retry on the same Project; no live Google success is claimed. Contract/proof: [PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md).

## Historical GWS1B-LIVE-01 merged checkpoint

Exact state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). PR #68 merged GWS1B. Owner-reported RUNTIME_TEMPLATE_SELECTION_RETIRED after redeploy is consistent with an old controlled client reaching the new retired route. Current source has no production client caller. This bounded unit reconciles PWA/app/API generations using shared build metadata, critical command fences, supported worker activation and guarded reload, plus separates current attempt and previous sync errors. Do not change Google permissions or destination validation to address that retired-call symptom. After owner merge/deploy, verify real deployed build convergence first, then retry Q-PRJ-007 Workspace/Google acceptance separately. No GWS2, PFAG-OPS-01 or Phase10 work is activated.

## Historical GWS1B continuation

Supporting summary only; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Current merged baseline is `a38c0b00e581638169f8740816f9a4646c30dbe0`, including isolated Workspace OAuth correction. GWS1B replaces hidden template copying with destination-only selection and programmatic versioned native workbook/bound-script generation. The owner-local XLSX and nine Script files are now captured into sanitized SABIL-HAIL-V1. Simple onOpen/onEdit replace four installable/timer dependencies; static initialization is generated directly. Local source/controlled verification is separate from live acceptance. Read [the sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) for capture, validation, recovery and remaining acceptance gates. No GWS2, autonomous refresh, dynamic intake or Phase 10 change.

### Foundation assurance maintenance checkpoint

Supporting summary only; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. RB1 merged at `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`, retaining the approved native-rules verification debt PFAG-RULES-01. RB2 composes coherent foundation refresh, bounded ACTIVE profile edits, explicit Project suspension/readiness-gated reactivation, reusable Driver/Truck profile editing and permission/readiness presentation. [The maintenance contract](PROJECT_FOUNDATION_MAINTENANCE_CONTRACT.md) records field and permission matrices. No Phase 10 implementation or live deployment certification is implied; owner merge remains manual.

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

Historical P9-U2 publication was authorized and has merged. RB1 source publication has merged; current assurance/owner-review gates belong only to the ledger. Merged B4 includes resume UI and the shared Sheets Roster adapter. Typecheck/lint debt and external-dependent test failures remain separately observed; passing build or local in-memory tests does not certify live Firebase, Beta 2, user acceptance or release readiness.
### Current Reconstruction Checkpoint — 2026-10-29

- Historical merged B3 baseline used to implement B4: `8c6a348d17b0f94215a56bb9a66f2e643c19f24c`.
- Historical P9-U1 implementation baseline: PR #61 — P8-B4, `31b2065f00b0d07763afc153582ef9be71dbd159`.
- Historical P9-U2 implementation baseline: PR #62 — P9-U1, `303469ef29b7cf906964316691e491c0df6d5e45`.
- Historical Phase 9 closure baseline: PR #63 — P9-U2, `f261ebc5508d881c9bfbe3dc77af1ccad75ec914`. Current verified merged RB1 baseline: `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`. The ledger owns the assurance gate.
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

Exact current unit/status is owned by [the ledger](02_PHASE_LEDGER.md). Merged P9-U1 established canonical server pricing and fixed Trip snapshots. P9-U2 adds server-decided copy-on-write, explicit replacement cutoffs, status UX, correlated existing audit records, stored tax/minimum-weight preservation and closure evidence. Setup and operations share the same pricing policy; old rule/configuration changes do not reprice historical Trips. Unsupported legacy calculators and unused browser adjustment approvals are not activated. The source-closure decision and owner-merge gate are defined only in the ledger; Phase 10 is not started.
