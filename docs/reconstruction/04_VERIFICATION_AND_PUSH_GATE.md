# VERIFICATION AND PUSH GATE

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
