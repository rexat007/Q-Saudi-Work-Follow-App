# Safe main integration rehearsal — evidence and decision

Decision: **GO for independent review and integration of this selected Firestore patch against main 030e9027685033c674cf2021499db7bfb675cbfd.** This is a source integration recommendation, not production deployment approval. **NO-GO for merging the complete convergence branch or activating SQL/U09/RB4.**

## References and isolation

- Main and unchanged rehearsal HEAD: `030e9027685033c674cf2021499db7bfb675cbfd`.
- Accepted convergence: `0057dbed509f15f107bd17345de9e0a98bd8de75`.
- U09 reference: `11326e277939fe3a1d839d723085797d3d6a691f`.
- Isolated branch: `rehearsal/firestore-main-20261113`; worktree `firestore-main-rehearsal-20261113` beside convergence-1.
- Initial fetch and final read-only ls-remote verified all three remote SHAs above. No remote publication or branch changes were made.
- No rehearsal commit created: the verified candidate remains an isolated, reviewable working diff plus new files on the main-based rehearsal branch. Existing published branches are unchanged.

## Dependency-complete portable families

1. Carrier/Material roster resolution and readiness: row evidence, canonical bindings, review/version gates, consumers and related entity/import types travel together.
2. Trip canonical command and receipt authority: Firebase HTTP handler composes existing main canonical services, scoped exception and audit authorities, frozen pricing/import snapshots, version validation, durable IndexedDB reservation and outbox recovery. All field consumers and command producers use the same operation identity. Same intent retries reuse identity; conflicting unresolved intents are rejected; stale acknowledgments cannot downgrade recovered state. Existing principal/project transaction checks remain authoritative.
3. Operational reporting and settlements: canonical readback, exception transaction composition, report pagination, pricing and financial evidence, plus affected views and types.
4. Foundation and session continuity: existing Firestore profile watcher, project inventory/scope publication, wizard lifecycle/reconnect and role-gated editing, and current-principal cache isolation.
5. Google Workspace blueprint/import normalization and recovery: accepted per-call validation and the complete affected test family. No Google identities changed and no live provider operation was executed.
6. Browser/native case separation: Google Drive/Sheets and pricing cases preserve runtime consumers while native assertions remain test entrypoints.

The accepted map stopped at 54 production roots. Reconciliation with final convergence discovers **55**, including runtime-imported `src/tests/pricingEngine.cases.ts`. **54 transferred**, **46 exactly match final convergence normalized source**, **8 require explicit Firestore boundary adaptations**; **1 SQL-only root excluded**. Original labels identifying 30 roots as U09-coupled were import ancestry warnings, not evidence that all 30 corrections require SQL. The complete affected suites verify the main-specific boundary adaptations.

## Reviewed transfer and exact differences

No whole convergence commit was cherry-picked. Reviewed U09-to-final-convergence correction hunks were applied against main; the main context and authority remained intact. `reviewed-production-hunks/`, transfer-plan.json, transfer-progress.json and source-difference-comparison.json preserve provenance.

The eight adaptations are:

- `server/app.ts`: existing Firestore canonical handler/receipt/exception/audit routes; omit U09 runtime composition. Retired success-like compatibility routes fail closed.
- `src/App.tsx`: inventory generation, current scope/receipt publication, pending count and responsive behavior only; main App composition retained.
- `src/firebase/authContext.tsx`: confirmed Firestore profile watcher only; main AuthProvider retained.
- `src/components/wizard/ProjectSetupWizard.tsx`: project publication, role/reconnect behavior; no SQL wizard wrapper.
- `src/components/offline/OutboxDrawer.tsx`: authoritative acknowledgment UI; no SQL journal panel wrapper.
- `src/services/offline/outbox.service.ts`: accepted Firestore outbox semantics; no imported U09 runtime selector/guard.
- `src/services/tripCommandClient.service.ts`: accepted Firebase command/version/receipt protocol; no SQL dispatch.
- `src/services/exceptionCommandClient.service.ts`: Firebase adapter to existing authenticated authority; no U09 runtime guard.

These are valid because main has one existing Firestore authority. They must not be copied into a mixed-backend/U09 composition without its backend fences. No fake selector, substitute business authority or SQL compatibility shim was introduced.

An explicitly reviewed dependency from U09 is the provider-neutral `OperationalTripControls` presentation extraction in `AdaptiveOperationsView.tsx`; it contains no SQL writes or authorization authority and is needed by accepted Firestore consumers. It does not transfer the SQL workstation.

**Exact changed source/test inventory: 159 files**, in exact-source-file-inventory.json with working-byte hashes. This comprises 54 production roots, 103 accepted test-hunk files, and two additional inherited source-reader newline fixes. Evidence files are inventoried separately in exact-working-file-inventory.json. A complete patch including new source files is isolated-main-source.patch.

## Excluded corrections and dependencies

- `src/components/field/SqlTripWorkstation.tsx`: requires SQL command routes, runtime selector and SQL authority; excluded.
- U09 backend composition, SQL account/project/import routes, backend epoch activation, immutable SQL source providers and migration-readiness/runtime authority: require their U09/RB1–RB3 source and acceptance gates, not portable as Firestore fixes.
- RB4 PostgreSQL journal, Workspace binding/grant adapters, server composition and migration 013 remain in the original RB4 workspace. They require native PostgreSQL lease/concurrency/recovery verification and independent integrated review. No completion claim is made.
- Operational configuration's U09-only callback injection was not copied. The main form already uses its existing canonical project service; the journey locates that form by its existing localized heading instead of a U09-only test ID.

## Verification results

| Gate | Result |
|---|---|
| Complete accepted historical/security/Foundation/Smart Import/Trip/offline/report family | **3449/3449**, 164 files; native exit 0; no pending/unhandled errors |
| Comparison with accepted convergence | **3446 unique assertion identities identical**, no missing/extra/status changes; duplicate registrations explain total vs unique |
| Exact main npm test sequence | **546/546**, all 48 commands, native exit 0 |
| Owned Firestore/Auth emulator operational + browser/PWA gate | **31/31**, seven files, native exit 0, no cleanup errors |
| TypeScript | Untouched actual main **446 diagnostics**; candidate **0**, exit 0; tsconfig unchanged |
| Full `npm run verify:beta2` (final repeat) | **PASS**, exit 0; lint/TypeScript, frontend/PWA/server builds, reports **19/19**, final release suite **443/443** |
| Git diff whitespace check | **PASS** |
| High-confidence credential/artifact scan | No findings in changed files and decompressed evidence; not a proof against every secret encoding |

The emulator gate includes real Firestore transactions, concurrent revisions, rollback and role security, actual Edge lost-ACK/mobile/desktop UI, IndexedDB upgrade/abort and cross-tab command reservation/conflict/recovered receipt isolation, readiness UI, two full CSV/Excel journeys and nine PWA worker-model cases. This is eight actual Edge cases plus nine worker-model and fourteen operational cases; it is not a claim that all 31 are end-to-end browser tests.

CSV and Excel main journeys match accepted convergence business outcomes: committed imports, completed Trip, 273.13 SAR, nine pre-recovery events/posts; CSV report includes 1002 trips, Excel one. CSV receipt lookup count is 3 on both; Excel read-only retries differ (accepted 3, main 2). Volatile IDs/timestamps and incidental timing are not equated; no duplicated business consequence was observed. See connected-workflow-comparison.json.

Initial full regression run was 3447/3449: two literal source assertions read CRLF from the fresh Windows checkout. Only those two input readers normalize CRLF; assertions and production files were not weakened. Complete rerun passed. Initial connected run was 29/31: CSV/Excel used a U09-only test ID; existing main form was present. Only its test locator changed; complete gate rerun passed. One subsequent runner guard refused to overwrite an owned service log before starting any services; a fresh output prefix was used. Failed run evidence is retained, not relabeled PASS.

Generated Block89 report timestamp/date-only output was verified semantically unchanged, archived, and exact HEAD report bytes restored. No functional source was discarded. All runner and command records and compressed logs accompany this report.

## Preservation and remaining gates

Final preservation checks pass: convergence remains clean at 0057dbed; RB4 remains at 11326e with the exact nine original unfinished files, original binary diff SHA256 and file hashes including migration 013. Main's **ten existing migration files 001–010**, exact inventory and bytes, remain unchanged; no 011/012/013 was added to main. No src/db, package manifest/lock or tsconfig source changes. No runtime composition/SQL selector module was introduced. All owned emulator ports and PostgreSQL port 55439 are closed.

No push, PR, merge, deployment, production operation, Google resource creation or PostgreSQL activation occurred. A managed-worktree API attempt returned no result; after confirming it created no worktree, an isolated local Git worktree was created in the authorized workspace. A generated analysis output briefly landed in convergence docs, then only that generated file was moved to rehearsal; accepted source stayed unchanged and convergence cleanliness was reverified.

Independent reviewers should assess this exact patch against the pinned main and its eight boundary adaptations. Changes to main after that reference require a fresh integration check. Operational acceptance, real supported device/offline behavior and production/provider credentials remain separate gates. U09/RB4 and overall SQL cutover remain blocked pending their own completion and independent integrated acceptance. The whole convergence branch remains unsafe to merge directly into main.
