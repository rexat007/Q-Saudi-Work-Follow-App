# VERIFICATION AND PUSH GATE

## DATA-LIVE-02 post-push independent GitHub scope verification — 2026-11-07

Owner manual Studio Push produced `cf7ac517be93492125c6dabad0ea38f291da7ed3` on `main`, parent `17977ffaac67f11e55b8a8471d0f1cf455fd18be`. Independent GitHub comparison: one commit ahead, exactly `src/services/projectFleetQuery.server.ts` modified with +1 line and no deleted lines or unexpected files. Recording SOURCE_PUBLISHED does not certify running Render build matches head, live transaction behavior, billing savings, or full product acceptance.


## Verification Taxonomy & Evidence Classes

To prevent conflation of verification results, the Q-Saudi reconstruction program enforces strict distinctions between evidence classes:

| Evidence Class | Description & Purpose | Non-Proof Boundaries |
|---|---|---|
| **STATIC** | Source-text inspection, AST checks, pattern matching | Does NOT prove runtime execution or database behavior. |
| **UNIT** | Isolated Vitest suite for pure domain logic and utilities | Does NOT prove Firebase connection or REST endpoint routing. |
| **INTEGRATION_MOCK** | React Testing Library component tests with mocked services | Does NOT prove backend server authority or real persistence. |
| **EMULATOR** | Local Firebase Firestore and Auth emulator test runs | Does NOT prove live network conditions or third-party OAuth. |
| **LIVE_E2E** | End-to-end multi-step workflow execution across server and UI | Does NOT replace static type safety or unit contract checks. |
| **MANUAL_UI** | Browser layout inspection, RTL Arabic alignment, mobile touch test | Does NOT prove edge-case contract safety or database rules. |
| **TYPECHECK** | `./node_modules/.bin/tsc --noEmit --pretty false` | Does NOT prove business logic correctness or runtime behavior. |
| **BUILD** | Production build bundle compilation (`npm run build`) | Does NOT prove runtime API correctness or user flow success. |
| **GITHUB_POST_PUSH** | Independent audit of pushed GitHub commit against local state | Does NOT replace pre-push automated verification. |

---

## Binding Verification Rule
> **CRITICAL RULE**: Passing automated unit tests and build scripts alone NEVER automatically closes a phase or unit. A unit is marked CLOSED only after completing the 11-step Implementation Unit Protocol, completing scope review, receiving explicit user approval, performing push, and completing independent post-push GitHub verification.

## Phase 0 debt and P0-U5 scope

`npm test` and `npm run verify:beta2` are distinct package-defined authorities; targeted suites are bounded additional evidence, not an equivalent full-command PASS. Full-repository `npm run lint` observes recorded TypeScript debt. Historical exit 2 / 445-diagnostic observations must not be called a clean lint PASS or frozen as a permanent expected count.

For documentation-only P0-U5, use read-only source inspection, documentation/link/conflict checks and Git scope/whitespace review. Do not claim fresh tests, lint, build or browser execution. Acceptance for prior i18n work remains stage-bounded; it neither proves every label was manually checked nor closes future product units. Current state is [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md); publication requires explicit authorization and P0-U5 prohibits it.

## Google AI Studio owner-controlled Sync/push clarification — 2026-11-07

1. GitHub `main` is source-of-truth for remote committed code; Studio's local `.git` may be missing or invalid.
2. The **actual Sync panel** is the authoritative pre-push changed-file list and destination branch; Studio prose assertions do not override a 14-file panel.
3. No blanket branch-only rule: owner has historically pushed reviewed scopes directly to `main`. When a unit explicitly requires an isolated branch, the Sync UI must prove that destination before Push. A pre-created remote branch does **not** prove Studio can target it.
4. For DATA-F1 intended scope = 7 source/test files; the 7 measurement/report artifacts in the current 14-file panel are excluded unless owner explicitly redefines scope after review.
5. After owner Push, independently read actual GitHub HEAD, parent SHA, diff/file list, unexpected additions/deletions, and source changes; only then record `SYNCED` or `CLOSED`.
6. Build, typecheck, focused tests, emulator/live acceptance and billable read measures are separate evidence classes; 104/104 fake-db focused PASS does not establish live Firebase billing savings or full build PASS.
7. No PR or merge without a distinct owner instruction. Do not invent publication or export artifacts.

## DATA-F1 completed owner Push and independent audit — 2026-11-07

Following UI confirmation that GitHub Sync displayed exactly 7 intended files, owner performed manual Push. Independent GitHub HEAD/commit comparison verified a one-commit fast-forward from `99f01eefe386ba840951f547069cb023f889b8c1` to `17977ffaac67f11e55b8a8471d0f1cf455fd18be` with exactly those 7 files and no unrelated additions. This source publication is distinct from live Firebase acceptance, Firestore SDK/emulator verification, full build and billing telemetry.

