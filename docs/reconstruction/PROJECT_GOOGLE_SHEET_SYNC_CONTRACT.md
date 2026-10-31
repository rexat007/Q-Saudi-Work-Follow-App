# Project Google Sheet continuity contract — PFAG-GWS1

Classification: CURRENT_SUPPORTING_CONTRACT. Exact active state belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

## Authority and evidence

Firestore/application commands remain canonical for identity, participation, relationships, pricing, Trips and permissions. The workbook is a permanent operational projection, reporting surface, backup and field continuity surface. Sheet edits are not imported as canonical mutations. Operational readiness and continuity readiness are separate.

Owner template reference: `https://docs.google.com/spreadsheets/d/1m2i0XoTz_woGDiFQ8syo7XVbA7jdv6cUAlV-lw667IM/edit`.

Runtime reads `GOOGLE_PROJECT_TEMPLATE_FILE_ID` and `GOOGLE_PROJECT_TEMPLATE_VERSION`; both are required, with no personal-ID default in code. The operator must approve a version string for the actual Google template. Existing bindings retain their original ID/version. A change affects only unbound projects. No migration is implied.

Structural evidence: owner upload `SABIL_SHIPMENT_HAIL (2).xlsx`, SHA256 `94aa2faeb651e0ade869a4f8adab325bcff114ebd2faa7d093e3c005243cb54d`. The upload is not altered, committed, or used as a runtime template. Its version hash identifies inspection evidence, not an assertion that the live Google template is identical. XLSX does not prove Apps Script preservation.

Required tabs: Loading Register; Offload Data; Offload Operations Audit; Daily Summary; Carrier Report Viewer; Carrier Daily Report; Dashboard. Runtime checks exact input-sheet headers and Asia/Riyadh timezone before binding. Drive `files.copy` preserves the native template as supported by Google. Live formula, named-range, validation, chart and bound-script behavior remains a separate acceptance gate.

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

A newly copied template contains fixture inputs in the supplied evidence. Before exposing its binding, initialization clears only the loading allowlist and offload B/C/D/E/F/G/I/J/K/L. It never clears formula columns, report ranges or the original template. Repeating initialization is safe only before binding is exposed. Script-generated static report outputs are not rewritten by the app: live verification must demonstrate their refresh after fixture-input removal and new operational input.

## Identity, units and current Trip boundary

Sheet correlation is `UPPER(TRIM(ticketSeries)) + '|' + ticketId`; canonical `tripId` remains independent. The adapter finds matches from Loading A/O or Offload G, rejects duplicate matches, updates only allowed cells, and uses the first completely empty input row with existing formula capacity. It does not append beyond that capacity or overwrite partially entered operator rows. Source input strings must not contain a correlation delimiter/newline.

No Driver is needed by the projection input. No fake identity is created. Existing canonical Trip identity/validation rules are unchanged. GWS1 does not implement dynamic weighbridge intake or Phase 10.

Current canonical Trip commands atomically stage a coalesced event in `projects/{projectId}/workspace_sync_outbox/{sha256(tripId)}`. The event holds project/trip IDs, monotonic revision, input snapshot and PENDING/DELIVERED status. Current Trip source-series/explicit weighbridge timestamp metadata can be supplied under existing `sourceMetadata.metadata.googleSheetSource`. No guessed source series or fabricated timestamps are added. Missing source mapping produces a durable `mappingRequired` event, not loss of canonical data. Native manual loading does not yet supply that source-series contract; closing that intake gap belongs to PFAG-OPS-01 / the separately authorized operational work, not an invented Trip FSM here.

## Provisioning and recovery

`projects/{projectId}/workspace_continuity/current` is the server-owned receipt/status record. Its binding includes projectId, provider GOOGLE, spreadsheetId/driveFileId/URL, templateId/version, Google subject/account label, provisionedAt/by and revision. Tokens are never persisted there or in Project settings.

The canonical provision command re-reads the active account and Project, requires SUPER_ADMIN or assigned PROJECT_ADMIN, and enforces current MAINTENANCE lifecycle policy. It obtains the current Google subject, reserves a transactional owner/lease, and records each external stage. The copy is tagged with deterministic `sha256('PFAG-GWS1:'+projectId)` appProperties. Binding, Project settings and audit are committed together. A configured legacy workbook requires explicit migration; it is not silently replaced.

Concurrent provisioners cannot both issue copy. After an uncertain copy result, retry searches the tagged external file. One result resumes; multiple results fail; zero results remain `WORKSPACE_COPY_OUTCOME_UNCONFIRMED`, never another blind copy. A crashed folder request similarly requires explicit reconciliation. This favors no duplicates over automatic availability. Lost binding writes retain stage evidence for recovery. Existing bound files are verified, never re-created if missing. Account changes require explicit migration.

The Google copy API does not provide transactionality with Firestore. These fail-closed recovery states are deliberate; they must not be bypassed by manually deleting receipts or reissuing copy without external reconciliation.

## Durable delivery

Canonical Trip command commit and event staging share the existing buffered Firestore transaction. No Google API call occurs in that transaction. Google failure cannot roll it back.

Authenticated administrative retry/initial-sync drains durable events using the stored binding, never a client-provided row or file ID. Projection is at-least-once, with correlation-based idempotent row writes. Failed calls leave events pending. A revision changed during delivery is not acknowledged as delivered; the next drain projects the latest snapshot. Per-Project execution owner prevents concurrent drains from overwriting newer results.

Existing browser Google authorization is transient, not a server refresh-token grant. This unit provides an explicit authenticated drain/retry, not an unattended background scheduler. Reconnect is required when authorization expires. An abrupt process death retaining `syncOwner` fails closed as `WORKSPACE_SYNC_RECONCILIATION_REQUIRED`; operator reconciliation must prove no old writer remains before releasing that fence. No automatic expiring lease permits overlapping Google writes. This limitation is recorded, not a claim of autonomous crash recovery.

## API and compatibility

- Existing `POST /api/workspace/provision`: sole current provisioning route; canonical server receipt authority replaces empty-workbook provisioning.
- `GET /api/projects/:projectId/workspace/template`: authorized template configuration for Picker selection.
- `GET /api/projects/:projectId/workspace`: public-safe status DTO (no credentials).
- `POST /api/projects/:projectId/workspace/retry-sync`: empty body only; authenticated canonical drain.
- Existing `POST /api/workspace/sync/initial`: template-bound projects drain outbox; legacy projects retain their existing projection/acknowledgement path.
- Old `/sync/trips` and `/sync/sheets` are fenced for template bindings. Storage migration for a template binding requires an explicit migration policy.

Legacy `ServerWorkspaceService.provisionProjectDrive` is not called by the current production provisioning route. Its historical empty-workbook/mock behavior remains only for historical harness compatibility; it is not template authority. Existing storage-isolation and legacy projection readers remain reused.

## OAuth operator contract

Scopes: `https://www.googleapis.com/auth/drive.file` for selected template/copy/folder access and `https://www.googleapis.com/auth/spreadsheets` for metadata and source-cell updates. Firebase Google sign-in also supplies its standard basic identity scopes for the account subject/profile/email; those do not grant broader Drive access. No unrestricted Drive scope is requested. Google Picker grants the app per-file access to the canonical template; a shared URL alone is insufficient. Picker selection must equal the server-configured template ID. Reauthorization uses the current Firebase identity, not a sign-in that silently switches the application's user.

Configure public `VITE_GOOGLE_PICKER_API_KEY` and `VITE_GOOGLE_APP_ID` (Cloud project number), matching the OAuth client project. Restrict the key to approved browser origins and required APIs. Enable Google Drive API, Sheets API and Google Picker API. Template owner must permit access/copy by the chosen account. Existing bound copies must remain accessible to that account.

The actual OAuth Client ID, deployed JavaScript origins, redirect allowlist, audience mode and consent status were NOT readable from the available repository/runtime credentials. Do not invent values or claim configuration is fixed. Operator must inspect the Web OAuth client used by Firebase Google sign-in, confirm every deployed browser origin, and the Firebase handler `https://<configured-authDomain>/__/auth/handler` (including custom-domain handlers actually used). Current default authDomain is `gen-lang-client-0774589047.firebaseapp.com`; overrides must be verified in deployment.

Only if the OAuth audience is confirmed External + Testing: Google Cloud Console -> Google Auth Platform / Audience -> Test users -> add the approved account. Do not hardcode emails. Google 403 observations supplied by the owner are evidence of a live failure, not independent console verification here.

Error classes distinguish explicit configuration evidence, access_denied, popup closure, expired token, denied scope, network and provisioning failures. A cross-origin popup's visible 403 cannot be inferred solely from Firebase `popup-closed-by-user`; UI provides conditional configuration guidance without claiming otherwise. No fabricated mock OAuth token or provider-error logging remains in the client.

## Open acceptance gates

- GWS-OAUTH-PROD-01: production audience/consent verification, origins/redirects, final scope review.
- GWS-LIVE-01: real OAuth/Picker grant; actual template copy; one-copy retry/concurrency; live header/timezone/formula/named-range/validation/chart/Apps Script behavior; controlled input row and script-output refresh; reopen; confirm no sample-data contamination.
- PFAG-OPS-01: dynamic weighbridge Truck intake without a predefined Driver/Truck roster and explicit source-series/time mapping. No readiness policy changes in GWS1.

Source/controlled tests are not live Google acceptance. Current governance and publication state are defined only by the phase ledger.

## Local verification observation — 2026-10-31

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
