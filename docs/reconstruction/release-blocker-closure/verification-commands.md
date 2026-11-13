# Current continuation verification — 2026-11-13

All commands ran in the existing convergence worktree on Node 22.22.0. Failed attempts remain archived; names distinguish complete runs from diagnostics. Selections overlap.

| Executed command / scope | Evidence | Result |
| --- | --- | --- |
| Node 22 ../closure-next-environment-gate-run.mjs; exact frozen historical selection, maxWorkers=1, fileParallelism=false | continuation-20261113/full-historical-comparison.json; archived runner/reporter | 3449/3449, 164 files, native exit 0, no skipped/pending or unhandled errors |
| Node 22 ../closure-next-native-run.mjs with native-combined-files.json; restricted roles, isolated loopback PostgreSQL | native-combined-summary.json, native-resources and native-command-exit archives | 668/668, native/stop exit 0, no added databases or remaining clients |
| Node 22 ../closure-next-npm-run.mjs test; exact package npm test chain | closure-next-npm-test.log.gz and exit archive | 48 commands, 546/546, exit 0 |
| Complete operationalReportTabIsolation.test.ts after readonly fixture input copy | closure-next-register-readonly.json.gz | 25/25, exit 0; original values and assertions retained |
| Node 22 ../closure-next-release-verified-run.mjs verify:beta2 | verified release log/exit archives | TypeScript/lint 0 diagnostics; frontend/PWA and server build PASS; reports 19/19 and final suite 443/443 |
| Node 22 ../closure-next-connected-browser-run.mjs with all four connected-browser-files.json entries | browser JSON, diagnostics, exit and ownership archives | 14/14, exit 0; no cleanup errors; fixtures stopped |
| Independent loopback resource probes | final-resource-check.json | 55439/8085/9099/4400/4500/9150 closed |
| Git diff check, protected migration hashes, separate RB4 nine-file hashes/diff, approved blueprint bytes | preservation-final.json and final review | PASS |

The PostgreSQL launch wrapper itself blocked after the server was already ready. No SQL test had begun; only that verified wrapper was stopped. The native runner resumed once against the already-running owned fixture and then stopped it. The interruption and actual resume command are recorded in checkpoint.json. Do not treat the interrupted wrapper as a failed SQL suite or as the approved final execution recipe.

The recorded runner/reporter source copies use a .txt extension for review; no second runtime verification framework or production provider was installed. Browser services used only demo-convergence2, exact local emulator hosts and server-owned test fixtures. The full suite's original test deadlines and isolation were retained. Filtered CPU-profile runs are diagnostics only.

## Previous execution commands (preserved historical record)

# Reproduction boundaries

Run from the convergence-1 repository using the recorded Node 22 runtime and unchanged package configuration. Exact historical/native selections are stored beside this file. The accepted baseline identity source is docs/reconstruction/convergence-3/historical-failures.json; no baseline code was changed.

- Full historical: vitest run <release-blocker-final-suite-files.json paths> src/tests/driverViewConvergenceP603.test.ts src/tests/i18nCodemod.test.ts --maxWorkers=1 --reporter=json.
- Exact package chain: npm test (exit 0, 48 commands, 546 passing tests).
- Release: npm run verify:beta2 (exit 0, final integration selection 443 passing tests).
- Final source: npm run lint; npm run build (both exit 0).
- Final frozen catalog: vitest run src/tests/finalReleaseReadiness.test.ts src/tests/runtimeKeyAudit.test.ts src/tests/runtimeSmokeBlock55.test.ts src/tests/switcherAndQualityBlock56.test.ts --maxWorkers=1 (49/49).
- Repeated timing families: durableImportSessionP8B1, operationalProfiles, operationalReportTabIsolation, operationalWorkspaceTemplates, workspaceBoundedWorkbookInspection, workspaceLocalBlueprint, workspaceProviderResilience native .test.ts files; unchanged default deadlines, maxWorkers=1 (148/160).
- Browser: QSA_BROWSER_TOOL_ROOT points to the existing .u07-tools Playwright installation; optional QSA_TEST_DIAGNOSTICS=1 emits phase names only. convergence3JournalBrowser retains sixty seconds. Actual Edge runs use a disposable context and localhost test server.
- PostgreSQL: only the owned localhost 55439 test cluster; QSA_TEST_DATABASE_ISOLATED=1 and restricted fixture roles. The attached runner creates a unique qsa_rbclosure_ database, applies unchanged 001–012, runs requested native selections, and drops its owned database in finally. The cluster is stopped after tests. Recreating test infrastructure is not production activation authorization.
- Connected browser tests used demo-convergence2 Auth/Firestore emulators on localhost 9099/8085. Those owned emulators were stopped. No live Google operation or production service/data was used.

Raw gzip JSON retains each exact fullName, assertion status and failure stack. Filtered rows are not counted as passing. Selections overlap and must not be added. All original registered identities are retained as recorded in assertion-registration.json.
