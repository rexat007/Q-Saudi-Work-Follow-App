# Project Google Sheet continuity contract — PFAG-GWS1

Classification: CURRENT_SUPPORTING_CONTRACT. Exact active state belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

## Authority and evidence

Firestore/application commands remain canonical for identity, participation, relationships, pricing, Trips and permissions. The workbook is a permanent operational projection, reporting surface, backup and field continuity surface. Sheet edits are not imported as canonical mutations. Operational readiness and continuity readiness are separate.

Owner template reference: `https://docs.google.com/spreadsheets/d/1m2i0XoTz_woGDiFQ8syo7XVbA7jdv6cUAlV-lw667IM/edit`.

GWS1B supersedes runtime source-template reads/copies and those template environment variables. The reference is authoring evidence only. A compiled, sanitized, versioned blueprint must be approved before provisioning. Existing bindings retain their provenance and are never implicitly migrated. SABIL-HAIL-V1 is now approved from owner-local sources under GWS1B-LOCAL-01; Google live capture is not required for source release.

Structural evidence: owner upload `SABIL_SHIPMENT_HAIL (2).xlsx`, SHA256 `94aa2faeb651e0ade869a4f8adab325bcff114ebd2faa7d093e3c005243cb54d`. The upload is not altered, committed, or used as a runtime template. Its version hash identifies inspection evidence, not an assertion that the live Google template is identical. XLSX does not prove Apps Script preservation.

Required tabs: Loading Register; Offload Data; Offload Operations Audit; Daily Summary; Carrier Report Viewer; Carrier Daily Report; Dashboard. Runtime checks exact input-sheet headers and Asia/Riyadh timezone before binding. The new runtime generates a native workbook and installs exact captured bound Script content; it never calls Drive `files.copy`. Live formula, named-range, validation, chart and bound-script behavior remains a separate acceptance gate.

## Exact loading contract

| Column | Actual header | Treatment |
|---|---|---|
| A | Ticket ID | Source ticket string, preserving leading zeroes |
| B | First WB Date/Time | Explicit source timestamp -> numeric Riyadh sheet serial |
| C | Second WB Date/Time | Explicit source timestamp -> numeric Riyadh sheet serial |
| D | Port Cycle Time | Formula; never write |
| E | Transporter | Operational Carrier snapshot label |
| F | Truck No. | Operational plate snapshot |
| G | Weight (Tons) | Formula; never write |
| H | Arrival Time | Formula; never write |
| I | Unloading Complete | Formula; never write |
| J | Trip Status | Formula; never write |
| K | Arrival to Completion | Formula; never write |
| L | Offload Weight (Tons) | Formula; never write |
| M | Weight Variance (Tons) | Formula; never write |
| N | Trip Key | Formula; never write |
| O | Source / Ticket Series | Explicit source series |
| P | Product | Operational Material snapshot label |
| Q | Source Weight Unit | Exact `kg` or `tonne` |
| R | Tare Weight (Source) | Value in explicit source unit |
| S | Gross Weight (Source) | Value in explicit source unit |
| T | Net Weight (Source) | Formula `S-R`; NEVER overwrite, despite header suggesting input |
| U | Loading Data Status | Formula; never write |
| V | Offload Matches | Formula; never write |
| W | Unloading Start | Formula; never write |
| X | Waiting Time | Formula; never write |
| Y | Unloading Duration | Formula; never write |
| Z | Weight Variance % | Formula; never write |
| AA | Receipt Data Status | Formula; never write |
| AB | Review Decision | Formula; never write |
| AC | Closed At | Formula; never write |

## Exact offload contract

| Column | Actual header | Treatment |
|---|---|---|
| A | Truck No. | Formula; never write |
| B | Arrival Time | Explicit arrival timestamp |
| C | Unloading Complete | Explicit completion timestamp |
| D | Offload Weight (Tons) | Tonnes; canonical destinationNetKg / 1000 |
| E | Destination | Explicit source metadata |
| F | Remarks | Optional source text; only explicitly clearable sync field |
| G | Trip Key | Same source/ticket correlation |
| H | Unloading Start | Formula `=B`; NEVER write a separate start time |
| I | Receipt No. | Destination ticket reference |
| J | Reviewed By | Operator-owned; normal sync never writes |
| K | Reviewed At | Operator-owned; normal sync never writes |
| L | Review Decision | Operator-owned; normal sync never writes |
| M | Receipt Data Status | Formula; never write |
| N | Loading Matches | Formula; never write |
| O | Loading Complete | Formula; never write |
| P | Loaded Tons | Formula; never write |
| Q | Loading Data Status | Formula; never write |

App writable allowlists are code constants. Missing values do not clear cells. Explicit null may clear Remarks only. RAW value writes prevent source text becoming executable formulas. Existing formulas found even in an allowed input cell block that write.

The authoring capture removes operational input values (including Offload review J/K/L), retains formulas and only explicitly approved static labels, and excludes unclassified report literals. Unknown content blocks asset approval. It never clears a live bound workbook during ordinary retry. Actual report refresh and cleanup equivalence require reference/script capture and live verification.

## Identity, units and current Trip boundary

Sheet correlation is `UPPER(TRIM(ticketSeries)) + '|' + ticketId`; canonical `tripId` remains independent. The adapter finds matches from Loading A/O or Offload G, rejects duplicate matches, updates only allowed cells, and uses the first completely empty input row with existing formula capacity. It does not append beyond that capacity or overwrite partially entered operator rows. Source input strings must not contain a correlation delimiter/newline.

No Driver is needed by the projection input. No fake identity is created. Existing canonical Trip identity/validation rules are unchanged. GWS1 does not implement dynamic weighbridge intake or Phase 10.

Current canonical Trip commands atomically stage a coalesced event in `projects/{projectId}/workspace_sync_outbox/{sha256(tripId)}`. The event holds project/trip IDs, monotonic revision, input snapshot and PENDING/DELIVERED status. Current Trip source-series/explicit weighbridge timestamp metadata can be supplied under existing `sourceMetadata.metadata.googleSheetSource`. No guessed source series or fabricated timestamps are added. Missing source mapping produces a durable `mappingRequired` event, not loss of canonical data. Native manual loading does not yet supply that source-series contract; closing that intake gap belongs to PFAG-OPS-01 / the separately authorized operational work, not an invented Trip FSM here.

## Provisioning and recovery — GWS1B

The user chooses a writable destination root, not the reference workbook. `workspace_destination/current` records scoped approval. `workspace_continuity/current` retains immutable Project/root/subject/blueprint bindings, transactional execution fencing and stage/resource IDs. Folder and native Sheet creation include deterministic operation/role/version tags and parent atomically. A Sheet is created via Drive native Sheets MIME to avoid a separate untagged-file crash window; no template copy is involved. Script projects.create(parentId) binds to that Sheet; updateContent installs the exact reviewed files. Structural/formula/style/script validation precedes atomic binding + Project compatibility fields + audit.

Every mutation freshly checks actor, Project lifecycle/scope and Google identity. The adapter validates destination writability and existing storage isolation; generated files must match operation/version tags and not belong to another Project registry. Tokens are transient. Concurrent requests are fenced. Unknown folder/Sheet creation results reconcile tags, never blindly create again; zero/multiple results fail closed. An unknown Script creation result remains WORKSPACE_RECOVERY_REQUIRED: no unsupported find-by-parent API or automatic duplicate creation is invented. Operator reconciliation remains necessary for that edge. Known script IDs can safely retry content installation and verification. Already bound resources are reused; root/account/version changes require explicit migration. No existing data is reset.

## Blueprint authoring and capture

`src/services/googleWorkspaceBlueprint/` contains schema, sanitizer, generator, verifier and a disabled reserved production asset. Synthetic test assets are never runtime imports. The approved asset must cover all seven tabs, static labels, formulas, dimensions/styles, validations, named ranges, charts, protections and exact manifest/Script files. The real function inventory is recorded in provenance.json. GWS1B-TRIGGER-01 supersedes the four installable dependencies with a central simple dispatcher; no trigger installation, timer, Execution API or user setup. Other UNREVIEWED/INSTALLABLE assets remain blocked. Unknown/external source references block approval. Formula-only expansion is active for generated bindings through the existing fenced outbox drain.

Operator-only tool: `node --import tsx scripts/captureWorkspaceBlueprint.ts --spreadsheet <reference-id> --script <bound-script-id> --policy /tmp/policy.json --out /tmp/draft.json` (Google OAuth token through stdin, never arguments). It performs Sheets get(includeGridData) and Script getContent reads only. Alternatively use `--workbook-export /tmp/workbook.json --script-export /tmp/script.json` with the same policy/output. Do not persist credentials or raw operational exports in Git. Output is deterministic, sanitized, mode 0600, /tmp-only, non-overwriting, and always approved:false. Policy lists exact static coordinates and expected values, function classifications, required custom functions and trigger model. Manually review all unknown cells, security concerns and structure comparisons before creating an approved asset. This Google-export tool remains optional authoring tooling. The current release instead uses scripts/buildLocalWorkspaceBlueprint.py and the owner-local package; XLSX is not shipped as a runtime dependency.

## Durable delivery

Canonical Trip command commit and event staging share the existing buffered Firestore transaction. No Google API call occurs in that transaction. Google failure cannot roll it back.

Authenticated administrative retry/initial-sync drains durable events using the stored binding, never a client-provided row or file ID. Projection is at-least-once, with correlation-based idempotent row writes. Failed calls leave events pending. A revision changed during delivery is not acknowledged as delivered; the next drain projects the latest snapshot. Per-Project execution owner prevents concurrent drains from overwriting newer results.

Browser Google authorization is transient, not a server refresh-token grant. This unit provides an explicit authenticated drain/retry, not an unattended background scheduler. Reconnect is required when authorization expires. An abrupt process death retaining `syncOwner` fails closed as `WORKSPACE_SYNC_RECONCILIATION_REQUIRED`; operator reconciliation must prove no old writer remains before releasing that fence. No automatic expiring lease permits overlapping Google writes. This limitation is recorded, not a claim of autonomous crash recovery.

## API and compatibility

- Existing `POST /api/workspace/provision`: sole current provisioning route; canonical server receipt authority replaces empty-workbook provisioning.
- `GET /api/projects/:projectId/workspace/template`: retired (410).
- `POST /api/projects/:projectId/workspace/destination`: exact destinationRootFolderId approval.
- Provision body: only projectId + destinationRootFolderId; no client Project payload.
- `GET /api/projects/:projectId/workspace`: public-safe status DTO (no credentials).
- `POST /api/projects/:projectId/workspace/retry-sync`: empty body only; authenticated canonical drain.
- Existing `POST /api/workspace/sync/initial`: template-bound projects drain outbox; legacy projects retain their existing projection/acknowledgement path.
- Old `/sync/trips` and `/sync/sheets` are fenced for template bindings. Storage migration for a template binding requires an explicit migration policy.

Legacy `ServerWorkspaceService.provisionProjectDrive` is not called by the current production provisioning route. Its historical empty-workbook/mock behavior remains for harness compatibility; it is not blueprint authority. The old ProjectGoogleWorkspaceAuthority copy path is explicitly test-only and returns 410 outside tests. Existing storage-isolation and legacy projection readers remain reused.

## OAuth operator contract

Scopes: drive.file + spreadsheets + script.projects, with basic openid/email identity. No unrestricted Drive scope. Isolated Google permission acquisition does not call Firebase sign-in/reauthentication; application UID/provider subject must remain unchanged. Picker accepts exactly one folder MIME, never a Sheet/template. Enable Drive, Sheets, Picker and Apps Script APIs under the matching public OAuth/Picker project; scope consent/verification implications require operator review. No Project-specific template environment variables remain.

The actual OAuth Client ID, deployed JavaScript origins, redirect allowlist, audience mode and consent status were NOT readable from the available repository/runtime credentials. Do not invent values or claim configuration is fixed. Operator must inspect the Web OAuth client used by Firebase Google sign-in, confirm every deployed browser origin, and the Firebase handler `https://<configured-authDomain>/__/auth/handler` (including custom-domain handlers actually used). Current default authDomain is `gen-lang-client-0774589047.firebaseapp.com`; overrides must be verified in deployment.

Only if the OAuth audience is confirmed External + Testing: Google Cloud Console -> Google Auth Platform / Audience -> Test users -> add the approved account. Do not hardcode emails. Google 403 observations supplied by the owner are evidence of a live failure, not independent console verification here.

Error classes distinguish explicit configuration evidence, access_denied, popup closure, expired token, denied scope, network and provisioning failures. A cross-origin popup's visible 403 cannot be inferred solely from Firebase `popup-closed-by-user`; UI provides conditional configuration guidance without claiming otherwise. No fabricated mock OAuth token or provider-error logging remains in the client.

## Open acceptance gates

- GWS-OAUTH-PROD-01: production audience/consent verification, origins/redirects, final scope review.
- GWS-LIVE-01: real OAuth/Picker grant; actual generated workbook/bound Script; no-duplicate retry/concurrency; live header/timezone/formula/named-range/validation/chart/Apps Script behavior; controlled input row and script-output refresh; reopen; confirm no sample-data contamination.
- PFAG-OPS-01: dynamic weighbridge Truck intake without a predefined Driver/Truck roster and explicit source-series/time mapping. No readiness policy changes in GWS1.

Source/controlled tests are not live Google acceptance. Current governance and publication state are defined only by the phase ledger.

## Historical GWS1 verification observation — 2026-10-31

Baseline: `093b75b6889ec2b592d9af022f38f15ad039da3e`. Four GWS1 native suites: 59/59 PASS. Actual Wizard controlled Chromium: 4/4 PASS; no live Google credentials or writes. Combined relevant native regression selection: 605 PASS / 33 FAIL across 27 files; NOT an all-green command. Every failed case was reproduced on an isolated archive of that exact baseline; new failing cases = 0. No Phase-8 import/session implementation is changed.

Baseline failure groups retained unchanged:

| File | Cases |
|---|---|
| projectWorkspaceMutationInvalidationUnit5B.test.ts | 7–31 (25 cases) |
| projectCanonicalRefreshBarrierA11.test.ts | 35: no page reload |
| projectContextLifetime.test.tsx | pending import-session restoration failure from A into B |
| projectWorkspaceMasterSnapshotReconciliationUnit5D.test.ts | 34: revision capture static contract |
| projectWorkspaceProjectionAcknowledgementUnit5C.test.ts | 17: revision capture static contract |
| translationByConstructionGuard.test.ts | TBC-B4: historical eleven-anchor source contract |
| tripOperationalCommands.test.ts | Dispatcher dispatch; Scale Operator loading; imported-trip creation — allocation pointer corruption reproduced on baseline |

Historical workspace integration exported harness: 6/8 on baseline and final (WS-TEST-01 and WS-TEST-07 unchanged failures). The standalone workspace convergence script passes its four checks; these exported/script harnesses are not native Vitest suites. Invoking them as native suites reports no suite and is not a meaningful product assertion.

Build PASS. TypeScript/lint observations: 440 -> 440, added 0, removed 0; lint EXIT 2 / NOT PASS. Runtime-key audit 16/16; auth trust boundary 23/23. Diff whitespace check PASS. Counts are dated observations, not frozen invariants.

One existing PFAG-RB2 static test assertion is converged to the new canonical provisioning authority: lifecycle and fresh authorization must precede Google subject access/copy. The remaining role/context assertions and its 58-test count are preserved.

## Historical GWS-LIVE-01A source checkpoint — return context and continuation

Owner-observed live defect: Q-PRJ-007 / WORKSPACE -> successful Google consent -> Project dashboard -> no visible Picker/error -> unconfigured Workspace. This observation is supplied by the owner; no independent deployed trace is claimed here.

Source chain before correction: ClientWorkspaceService.requestGoogleScopes -> Firebase reauthenticateWithPopup -> onIdTokenChanged -> createAuthSession.change -> clear(user/profile/token) -> App temporarily derives VIEWER/empty scope and filters projects -> selectedProjectId clears; App's profile-loading gate unmounts the Wizard. Remount initializes editingProjectId/layer and generation again. The old asynchronous flow could continue while its UI notices were fenced, hiding configuration errors. Losing the screen alone does not prove that the template HTTP request never happened.

Chosen bounded correction is isolated permission acquisition, not weakening AuthSession or ProjectContextLifetime. Workspace uses Google Identity Services with explicit public VITE_FIREBASE_OAUTH_CLIENT_ID. It must match the intended OAuth Cloud project / configured VITE_GOOGLE_APP_ID, expected by the owner to be 1009549718216. The local JSON's legacy oAuthClientId starts with 98229909734; that is not proof of the deployed Firebase Google provider's client. The new Workspace grant deliberately does not silently use that legacy fallback. Operator must verify the actual deployed Web client, without publishing any secret or broadly changing Console settings.

Google library preparation is token-free on entering the Workspace layer. The action remains unavailable until preparation succeeds; configuration/network errors remain visible. The grant begins from the button before HTTP awaits, preserving popup user activation. It requests the existing drive.file + spreadsheets permission family plus basic openid/email for provider-subject verification. The returned Google subject must equal the existing Firebase google.com provider subject and the application UID must remain unchanged. No second app identity, sign-in, reauth, refresh-token store or autonomous worker is introduced.

A transient bounded intent holds only userId, projectId, PROVISION_GOOGLE_WORKSPACE, WORKSPACE, startedAt and scope. Identity/scope/layer/Project generation are checked after every awaited boundary. It expires after ten minutes; logout, different UID/scope, real Project switch, layer departure and unmount fence continuation. It contains no token or arbitrary file ID and cannot blindly restore a prior Project.

GET /api/projects/:projectId/workspace is authoritative for continuity and branch selection. A READY binding takes precedence over absent/stale Project compatibility IDs; status-read failure is not absence. The same flow then performs Picker when needed, provisioning, initial sync, and a fresh status read. Existing receipts are honored; none are cleared. Status is fetched again on reopen. Errors retain a translated actionable explanation and their exact sanitized support code on the Workspace layer.

Current execution evidence and publication state defer to the phase ledger. Controlled browser tests are not deployed OAuth acceptance. GWS-LIVE-01 remains open; GWS-SYNC-AUTONOMY-01, GWS-SYNC-RECOVERY-01 and PFAG-OPS-01 remain open. No GWS2 or Phase 10 work is authorized by this correction.

### GWS-LIVE-01A verification observation — 2026-10-31

New focused tests: 15/15 PASS. Existing GWS1 suite: 59/59 PASS, preserving its count. Existing Wizard wiring: 18/18 PASS, preserving its count while replacing stale prop-variable/source-layout assertions with the durable-binding-first shared call. Existing auth-session tests: 12/12 PASS without production auth-session changes. Auth trust boundary: 23/23; runtime-key audit: 16/16.

Combined relevant native selection: 632 PASS / 33 FAIL across 30 files (not an all-green command). The isolated exact merged baseline has 617 PASS / the same 33 FAIL across the corresponding 28 files; the added 15 tests pass, and no failing case is new. The retained failure groups remain those listed in the GWS1 observation above. No historical failure is relabeled as a new Google defect.

Actual Wizard/client pipeline in controlled Chromium: 5/5 PASS, no runtime exceptions. The test drives isolated Google grant -> same-identity profile rerender -> actual Picker authorization helper -> canonical client provision/sync/status calls -> READY and one open-file link. Trace: GET /api/projects/Q-PRJ-007/workspace/template 200; POST /api/workspace/provision 200; POST /api/workspace/sync/initial 200; GET /api/projects/Q-PRJ-007/workspace 200. Google/API responses are controlled fixtures, not live services.

Build PASS; diagnostics 440 -> 440, added 0, removed 0; lint EXIT 2 / NOT PASS; diff whitespace check PASS. These are observations, not frozen cardinality gates. Local live-configuration variables are absent; deployed values, real OAuth return and real Google resources remain UNVERIFIED. No Console changes or live writes occurred.

Additional layered-Wizard regression: `projectSetupLayeredWorkflow.test.tsx` reports 6 PASS / 12 FAIL (timeouts); all twelve case identities were reproduced on the exact merged baseline. The initial current run also emitted a Vitest RPC/console teardown error. A follow-up with console forwarding suppressed (`--silent`) completed without that runner error and retained exactly the same twelve baseline failures. Both runs are reported; this command is NOT PASS and those tests were not rewritten or skipped. The principal 30-file comparison above and this additional suite are reported separately.

## Historical pre-local-capture GWS1B verification observation — 2026-10-31

Baseline ca63d9f61fb4cac6ae0c6089ef8639691b1117b4. New core tests use a synthetic approved seven-tab fixture solely to exercise generation/recovery; they do not prove reference fidelity. The default production asset remains absent and blocks before creation. Offline operator capture was exercised twice with synthetic exports: byte-identical sanitized drafts, old input/source ID removed, approval false. Actual reference structure counts, bound source/functions/manifest/triggers and live Google acceptance remain unverified. Final command results are reported with the local owner-review delivery, not adopted as permanent cardinality invariants.

Final local observations: new blueprint/picker/Google-adapter suites 44/44 PASS; combined relevant selection 676 PASS / 33 FAIL across 34 files (not all green). All 33 failures were reproduced on an isolated ca63d9f61fb4cac6ae0c6089ef8639691b1117b4 archive (212 PASS / 33 FAIL in the seven failing-file selection); no new failing case. Existing GWS1 59 tests, OAuth continuation and Wizard compatibility contracts retain test counts. Build PASS; normalized diagnostics 440 → 440, added/removed 0; lint EXIT 2 / NOT PASS. Runtime-key audit 16/16; auth trust boundary 23/23. Actual Wizard/client controlled Chromium 5/5 PASS using mocked Google/folder responses and synthetic server success, no runtime JS errors; not real blueprint deployment or live Google acceptance. No credentials, production resources or operator Console configuration were changed. No commit/push performed: missing reference capture prevents full release verification.

## GWS1B-LOCAL-01 / TRIGGER-01 — current compiled release

LOCAL_REFERENCE_CAPTURE = APPROVED. GOOGLE_LIVE_CAPTURE = NOT_REQUIRED_FOR_BLUEPRINT_SOURCE. REFERENCE_XLSX = OWNER_PROVIDED_CLEAN_STRUCTURAL_COPY. SCRIPT_SOURCE = OWNER_PROVIDED, with authorized dispatcher/trigger removal edits. Manifest = SOURCE_RECONSTRUCTED_FROM_SCRIPT_REQUIREMENTS (Asia/Riyadh, V8, spreadsheets.currentonly); script.scriptapp, Drive-wide and external-request scopes are absent. Provisioning still needs human OAuth drive.file + spreadsheets + script.projects plus basic identity to create/install the bound source.

Reference XLSX SHA256: `7cdcf333cf24cf835c7d146ec63e3c1150d5b4629d0a86d15b2fa0f3fc7eb643`. Source contains seven required tabs, 492 formula cells, seven validation objects/rules, seven conditional-format rules, 17 merges, no named ranges/charts/enabled sheet protection. Actual .gs names already include OffloadOperationalAudit, so no collision/rename was necessary. The script has 26 top-level named functions plus four nested named helpers after removing the obsolete viewer trigger installer; provenance includes all 30. No direct custom spreadsheet functions were found; requiredCustomFunctions is empty.

Sanitation classifies ownership, not forbidden-string replacement: 62 literal/control/output cells are removed (including old viewer carrier rows, dates, dashboard/audit output, and Loading Q2 default). Reports start with neutral totals, preserved headers/styles/labels and empty refresh timestamps; future edits run actual derived refresh functions. Daily Summary retains formulas and All control while clearing its historical start date. Static formula-dependent inline panels remain intact. The nine supplied sources retain manual Arrival linkage and review behavior; only trigger/dispatcher/report wiring changes are authorized here.

Initial operational capacity = 297 rows per input tab, formulas seeded from row 2 through row 298 (8,188 normalized formula cells total). This is an intentional source-backed initial capacity, not the Offload style-only 10,189-row grid mistaken for computed capacity. All source-only aggregate/lookup end bounds 102/298/979/1000/10189 are made open-ended; Dashboard prepared-capacity D11 explicitly follows 298 and adjusts on insertions. Source T/H calculations remain S-R / =B. Empty guards in U/M count actual user inputs instead of formula-valued T/H; Excel _xlfn.XLOOKUP and CELL("format") are converted explicitly for Google Sheets. Date controls start blank. No arbitrary truncation of populated data occurs.

The dispatcher routes viewer B3:B5 only to viewer refresh. Relevant Loading inputs route audit → ledger → dashboard (dashboard only on audit success). Offload single-cell review-relevant edits first call the unchanged review handler. Multi-cell edits refresh reports without inventing approval decisions. Irrelevant/header/formula/report edits do no heavy work. Document/script lock, 20-second between-stage budget, 2,000 source-row guard and 5,000 automatic ledger-output guard bound attempted automatic work; they cannot preempt a slow individual Google API call or prove live 30-second completion. Report errors preserve source edits. onOpen only creates Carrier Reports / Truck Operations menus. Zero active ScriptApp trigger-management calls; installable/timer dependencies are SUPERSEDED.

No manual initialization or remote Script execution is part of provisioning. Static clean structures/validation/formulas/panels are born in the generated Sheet. Manual compatibility setup helpers are non-triggering/noninteractive; they are not auto-invoked. Reviewer names from supplied source are retained as PROJECT_CONFIGURATION_CANDIDATE debt GWS_REVIEWER_CONFIGURATION_01. Google API writes do not fire onEdit: Script-derived report refresh after programmatic APP writes remains GWS-SYNC-AUTONOMY-01 debt; formulas still recalculate. No bidirectional/master authority, autonomous worker, GWS2, dynamic identity/readiness or Phase 10 change.

WORKSPACE_BLUEPRINT_SHA256: `036fb401b0dffa4b5755fac1d9acf1d5c2a7d0c01610ed23813d1f86b7bdeda8`.
APPS_SCRIPT_BLUEPRINT_SHA256: `8acc1aa9b435fb93b4eddfdfc7faec91133e606439a9f5c969cc44ff7340360f`.
Digests cover canonical sorted normalized release JSON and normalized Script files including reconstructed manifest; provenance.json records per-file hashes and inventory. Local RLE/style deduplication is a source representation only; runtime inflates the exact normalized Google structures. The XLSX remains outside runtime.

XLSX export table wrappers (three, with no structured-reference formulas) are represented by their actual stripe colours as three native Sheets bandings; existing input/audit filters are recreated. Excel table IDs are not runtime authority. There are no source table calculated-column expressions or source images to omit.

### Real-local release verification observation — 2026-10-31

The actual-source generator round trip is interpreted into a fresh in-memory Google target from every mutation request (including styles, dimensions, filters and banding), then validated; altering a generated formula is rejected. This is structural emulation, not a Google formula engine or live execution. The operator extraction suite checks the actual owner XLSX hash, all source structure counts, ownership sanitation, exact deterministic compiled extraction and normalized formulas: 5/5 PASS. Script routing/review tests execute the shipped Script source with controlled services; actual empty-source audit, ledger, viewer and dashboard functions produce neutral outputs without source writes. Two expansion tests prove formula-only requests and uncertain-response retry without a second insert.

New focused GWS1B selection: 72/72 PASS across six files. Relevant regression selection: 704 PASS / 33 FAIL across 36 files (NOT an all-green command), with all failed cases reproduced on the exact merged ca63d9f baseline, new failures 0. No tests removed/skipped; two retired template-error cases became destination/blueprint-error cases, and the capture-required default case now verifies the real local release. Existing GWS1 59, auth trust 23 and runtime-i18n 16 contracts pass; controlled actual-client Chromium 5/5 passes with mocked Google/server and no runtime JS errors. Build PASS; diagnostics 440 → 440 added/removed 0; lint EXIT 2 / NOT PASS. Counts are observations, not future cardinality invariants. Source/schema/UI-controlled verification is not live Google acceptance, formula evaluation or simple-trigger timing certification.

Controlled Vitest timing observation (includes VM/test setup, not Google network latency): viewer B3 route 5.14 ms; Loading route 1.71 ms; combined Offload-input/reviewer routes 2.26 ms; actual empty-source audit/ledger/viewer/dashboard pipeline 5.32 ms. Irrelevant edits execute no report functions. These observations do not certify execution within Google's simple-trigger window on live large datasets.

## GWS1B-LIVE-01 — PWA deployment generation convergence

Classification: CURRENT_SUPPORTING_CONTRACT; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact unit state. Verified GitHub baseline `a38c0b00e581638169f8740816f9a4646c30dbe0` merged GWS1B through PR #68. Owner reports Q-PRJ-007 returned RUNTIME_TEMPLATE_SELECTION_RETIRED after Render redeploy with no Folder Picker. That response is the retired-route defense and is consistent with an old client reaching a new API. Current production client source has zero callers to /workspace/template. Previous timezone/destination errors alone do not independently prove a cache state. No production URL/profile/registration/cache trace was available for independent inspection; controlled evidence below must not be described as a live Render trace.

### Version authority and critical command fence

Vite resolves a deterministic commit/build identity, compiles __APP_BUILD_ID__ into frontend and emits dist/runtime-build.json with workspaceContract=GWS1B. Clean Git/Render metadata uses the commit SHA; local dirty/restricted builds append a deterministic source digest. Missing build identity fails build. The production server reads the emitted artifact once, rather than announcing the SHA of a later checkout or mutable runtime environment. Missing/invalid metadata returns 503/UNAVAILABLE. Public GET /api/runtime-version exposes only buildId/workspaceContract with Cache-Control:no-store, before API authentication. These identifiers are not secrets or substitutes for authentication.

Startup, online, focus/visibility and a 30-second check detect mismatch without Google requests. Workspace layer preparation checks metadata and preloads the existing Google SDK without acquiring a token. requestGoogleScopes uses a synchronous last-confirmed generation lease (max 90 seconds) to preserve the original popup click activation. Unknown/expired/mismatched state blocks the grant and refreshes metadata. Destination selection/approval and provision each require a fresh metadata check; X-App-Build is attached. The server route fence requires its exact artifact identity before Google access while preserving existing authentication, Project isolation, RBAC/lifecycle and storage checks. This cannot make separate network requests atomic during rolling deploys; server mismatch rejection remains final authority for mutations. No Google OAuth client/scopes/Console/key/origin/destination/blueprint change.

### Worker/HTML convergence and offline behavior

Supported vite-plugin-pwa registerSW callbacks explicitly control updates. Workbox skipWaiting, clientsClaim, cleanupOutdatedCaches and revisioned precache stay enabled; navigation fallback retains the offline shell and excludes /api. The runtime-version fetch is no-store and not a runtime-cached resource. HTML, sw.js, registration/worker-generation script and runtime metadata revalidate; content-hashed JS/CSS remain immutable. No auth/database/outbox/localStorage clearing, worker unregister or Clear-Site-Data workaround.

Modern clients ask registration.update(), use supported Workbox update/skip-waiting behavior, verify the controlling worker's build through a MessageChannel and reload once per remembered target. A bounded session history retains 16 targets, with at most three automatic reloads in ten minutes; alternating server generations cannot loop forever. Unavailable storage, update failure or unconfirmed controller does not trigger a blind reload. Offline shell remains available, but unverified Workspace mutations stay blocked until network returns. A newly activated generation script uses a supported generateSW importScripts lifecycle hook: after verifying server identity, it migrates same-origin legacy windows which cannot answer the modern build handshake. It records each client before dispatching navigation and never awaits navigation from activate.waitUntil (which would deadlock activation). First installs/offline activation do not force migration; a surviving legacy retired call can retry migration without replaying any provisioning action. The retired route stays HTTP410 and returns APP_UPDATE_REQUIRED plus retiredCode:RUNTIME_TEMPLATE_SELECTION_RETIRED.

Already-running pre-patch JavaScript cannot be changed before browser update discovery brings in the new worker. Normal navigation/browser update checks are still needed for that first rollout. Controlled tests explicitly initiate that discovery, then verify actual worker activation/navigation; they do not claim instantaneous push into every untouched old tab. Future patched clients perform periodic/online/focus checks themselves. Storage-blocked or repeatedly flapping deployments can retain update-required guidance rather than risk a reload loop.

### Error presentation and evidence preservation

Legacy TEMPLATE_SELECTION_MISMATCH, TEMPLATE_TIMEZONE_INVALID and RUNTIME_TEMPLATE_SELECTION_RETIRED classify as LEGACY_GWS_GENERATION_ERROR for historical display and APP_UPDATE_REQUIRED for current-attempt guidance. They never instruct current users to select a template. Current setup attempt and relevant previous sync issue use separate AR/EN/UR labels. A legacy previous lastSyncError is suppressed in current UI; other prior issues remain separately labeled when relevant and not duplicated. Persistence/audit evidence is not deleted. UI may show APP_UPDATE_REQUIRED as current compatibility status without storing it as a new domain lifecycle. Generation preparation can retry when online/focus returns and clears only resolved generation notices. DESTINATION_NOT_WRITABLE logic is unchanged and must be retried separately after convergence.

### Verification boundaries

Unit checks cover mismatch/no Google side effects, matching gesture snapshot, expired/offline checks, recheck on return, contract mismatch, public artifact metadata, route fencing, worker activation/legacy detection, no navigation/activation deadlock, reload history/rate limiting, old caller count, cache headers and stale-error presentation. Actual Wizard controlled browser verifies Folder Picker/provisioning continuation against matching metadata and mock Google/server. Independent controlled production builds exercise generated Workbox and real browser Cache Storage: legacy A→B and modern B→C, matching IDs, one navigation per update, no reload loop, offline shell/navigation, network return, previous entry removal and Chrome manifest/installability checks. These fixtures do not establish real Google provisioning, current Render browser state, destination writability or live Apps Script behavior. No GWS2, PFAG-OPS-01 or Phase10 work.

GWS1B-LIVE-01 verification observation (2026-10-31): new generation/server/worker/client suites 34/34 PASS; actual Wizard continuation 11/11 PASS (original eight retained plus three error-display cases). GWS1B blueprint suites remain 72/72; auth trust 23/23; i18n runtime 16/16. Relevant selection across 40 files: 741 PASS / 33 FAIL, NOT an all-green command. Exact GWS1B merged tree a38c0b0 is identical to its implementation tree 0e28093, and all 33 failed cases were already reproduced/classified there; new failures 0, removed tests 0, skipped tests 0. Build PASS; normalized diagnostics 440→440, added/removed 0; lint EXIT2/NOT PASS; git diff --check PASS. Controlled actual Wizard/Google fixture Chromium 5/5, generated Workbox A→B→C browser/offline/installability 12/12, no runtime JS errors. Discovery of the first legacy worker update was simulated by registration.update; subsequent activation/navigation and modern updater behavior were real. No independent Render, Google account, OAuth Console or live Project mutation was performed. No captured blueprint/Script source, permissions, destination validation, package/lockfile or workflow changes.

## GWS1B-LIVE-02 — initial destination correction

Current supporting contract; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns status. Baseline b936019580778394ccdcb07523ad635ec0295956 merges PWA convergence. Owner reports Q-PRJ-007 reaches the new destination flow and now fails DESTINATION_NOT_WRITABLE. Live public URL was supplied, but the local environment's proxy denied CONNECT403 before reaching Render; that is not a Render/Google response and does not prove a production permission fault.

INITIAL DESTINATION VALIDATION DECOUPLED FROM STORAGE MIGRATION VALIDATION. Initial adapter validateInitialWorkspaceDestination first invokes the unchanged WorkspaceStorageBoundary.eligibleDestination: normalize ID, reject own current canonical destination, selected foreign canonical aliases and foreign migration reservations. It then performs exactly one files.get for the selected folder, requiring folder MIME, not trashed, and capabilities.canAddChildren===true. Ownership/canEdit/canShare/canMove privileges are not required. Shared Drive capability handling and supportsAllDrives remain. Do not request unselected ancestor metadata under drive.file. Each approval/provision invocation validates freshly (one read per invocation, not one forever); changing permissions after approval must still block creation. Approval receipt remains scoped to Project, actor and Google subject.

Initial validation no longer calls serverWorkspaceService.validateDestinationFolder, whose duplicate metadata and assertProjectFolderResource(...,[],...,true) traversal are migration requirements. That method, assertProjectFolderResource, registry code and migration consumers are unchanged. The initial contract is selected-ID conflict exclusion, not an ancestry proof for every inaccessible parent. It deliberately allows a general selected root to host distinct generated Project folders, subject to current/foreign selected canonical IDs and reservation checks.

Error evidence: INVALID_STORAGE_RESOURCE_ID, CURRENT_STORAGE_DESTINATION, STORAGE_TARGET_CONFLICT, PROJECT_NOT_FOUND, PROJECT_REGISTRY_MISMATCH and PERSISTENCE_BOUNDARY_INVALID retain their bounded identity. Unknown registry errors become WORKSPACE_REGISTRY_ACCESS_FAILED503. Nonfolder/trashed metadata becomes DESTINATION_FOLDER_INVALID400; absent/false/nonboolean canAddChildren becomes DESTINATION_NOT_WRITABLE403; Drive HTTP401 -> TOKEN_EXPIRED401,403 -> SCOPE_DENIED403,404/network/other provider failure -> DESTINATION_ACCESS_FAILED502. Provider detail/token is not returned. The UI maps writability, canonical conflict, current destination, invalid folder, access/registry and scope/token failures to specific canonical AR/EN/UR instructions while retaining the actual code. It does not collapse everything to reconnect guidance or erase audit/lastSyncError.

Controlled proof runs real validation code against mock Google and in-memory registry: a writable Picker folder whose parent returns403/404 is rejected before the fix and accepted after, with parent reads0. Unchanged migration validation still attempts/rejects the ungranted chain. Actual approval persists destination receipt and full existing provisioning proceeds to a verified binding under the test Google adapter. Negative cases preserve registry conflicts, malformed IDs, Shared Drive semantics, current folder rejection, revocation revalidation and zero external creation before validation. No Google scopes, blueprint, Apps Script, destination Picker, PWA architecture, server authorization, package/config or lockfile changes.

Verification observation (2026-10-31): 21/21 actual-initial-validation/registry tests, 10/10 existing Google-adapter cases, 23/23 Wizard continuation/guidance/parity cases, 56/56 storage isolation and 4/4 provider/migration contract cases: 114/114 targeted. Relevant wider selection: 778 PASS /33 FAIL across42 files, NOT an all-green command; failed-case set unchanged from the b936019 merged tree (identical to published771f2c4 source), new failing cases0. No test deletion/skips; the existing adapter test is renamed/converged from requiring migration invocation to requiring selected registry checks and no migration call; its count remains10. Before-fix evidence explicitly selected the two regressions and observed both false rejections; final suite runs all cases. Build PASS; diagnostics440→440 added/removed0, lint EXIT2/NOT PASS, i18n-runtime16/16, auth trust23/23, git diff --check PASS. These are source/controlled observations, not a real Google acceptance result.
