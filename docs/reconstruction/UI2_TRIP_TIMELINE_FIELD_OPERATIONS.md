# UI2 — Trip Timeline & Field Operations Convergence

Status: **SOURCE_IMPLEMENTED_VERIFIED — GO_FOR_INDEPENDENT_REVIEW, LOCAL_COMMIT_ONLY**. This is bounded UI2 source acceptance, not an all-historical-tests PASS, deployment approval or SQL cutover. UI3 is not started.

## Verified starting point

Starting main: `75f1ed8681ccb4f70baaf2e7aa1f6a821a29da7d`; branch: `ui/ui2-trip-timeline-20261114`, isolated worktree. UI1 PR101 and U03 PR102 are merged. Post-merge [foundation CI #213](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/43592792252) and CodeQL completed successfully before source edits. See [preflight](ui2/preflight.json).

Seven production UI/locale files and four tests/fixtures implement the unit. [Exact inventory](ui2/changed-file-inventory.json) records every path; [verification](ui2/verification.json) records source hashes, gates and preservation. Commit SHA is reported after the local commit, avoiding a self-referential commit record.

## Timeline and checkpoint behavior

`TripTimeline` is reusable read-only presentation inside the existing adaptive project workspace. `tripTimelinePresentation` derives its display from the selected canonical Trip's status, approved operational snapshot and recorded timeline. It creates no dates, weights, receipts, driver identity or state transitions.

Dispatch → Origin → Loading → Transit → Destination → Unloading → Completion displays confirmed, current, next eligible, pending and explicitly unrecorded milestones. A later status never pretends a bypassed optional origin/loading checkpoint occurred. Canonical completion can confirm completion without inventing its timestamp. Existing valid timestamps are displayed verbatim with LTR isolation. The checkpoint detail panel distinguishes required and optional supported points; absent required points are named in the action notice. Measurement applicability is shown separately, including explicit not-applicable explanations.

## Profile matrix and weighing

| Approved snapshot profile | Origin measurement | Destination measurement |
| --- | --- | --- |
| DUAL_WEIGHBRIDGE | Actual tare/gross/ticket | Actual tare/gross/ticket |
| LOADING_SCALE_ONLY | Actual tare/gross/ticket | Not applicable |
| UNLOADING_SCALE_ONLY | Not applicable | Actual tare/gross/ticket |
| NO_WEIGHBRIDGE | Not applicable | Not applicable |

Snapshot configuration capabilities, not a newly inferred profile enum or current project edit, determine the UI. Inputs appear only in the state/role window allowed by existing policies. Existing localized tare/gross labels specify kilograms, without appending duplicate units. Empty/non-finite/negative tare or gross not greater than tare disables submission. Zero tare and decimal readings remain valid. Payload keys, values, ticket handling and server validation are unchanged; no net-only/derived measurement workflow was added.

`profileTransitionAllowed` and `canExecuteTripCommand` remain the authority boundaries. Server-supported COMPLETE_LOADING (LOADING/WEIGHED_ORIGIN) and START_UNLOADING (AT_DESTINATION/WEIGHED_DESTINATION) retain their exact checkpoint windows and permissions. One unambiguous permitted progression gets the dominant action. Multiple legitimate choices are explained, without imposing an invented order. Finalized, terminal, invalid, unavailable or unresolved states do not offer executable progression.

## Driver association

PRELOADED_ROSTER explains that a driver is required before dispatch; missing associations require authorized review. ON_FIRST_OPERATION and MIXED explain explicit existing-identity association. Driver choices reuse the already authorized project fleet read model, filtered to the selected Trip's project, truck and carrier. This is a limited assignment projection, not a complete driver directory. No new listing endpoint, identity provider or browser identity creation was introduced.

When a suitable choice is unavailable, a controlled existing-ID field explains how to obtain an authorized canonical ID. Names cannot create identities; IDs are syntactically checked and never inferred from names. Membership, carrier, truck assignment and current authorization remain server-validated. Only an explicit permitted action associates a driver. Confirmed name/ID remain visible from the canonical Trip, not the tentative selection; private national IDs/phones are not displayed by UI2.

## Durable confirmation and isolation

The existing durableTripCommand/pendingTripOperations/recoverTripOperation and original Outbox remain untouched. Commands retain their original names, payload fields, resource identity and expected version. Nothing automatically submits a command. A local click displays submitting and leaves milestones unchanged. Pending original receipts restore frozen inputs and block replacement intents; the existing workspace recovery control resolves the same operation. Rejected/conflicted, unavailable read and confirmed states remain distinct.

The existing principal/project/role keyed workspace remount and alive-generation guards remain. Selected-trip subscription reads are project-filtered and cannot downgrade a newer acknowledged revision. Read failure or inactive project freezes the action controls. Invalid weight facts show an unavailable-data notice rather than crashing the delay presentation or inventing metrics. Refresh/resume still uses the existing principal/project Outbox receipt selection contract; no new persistence authority was added.

## Verification

- Final focused/service/native-browser run: **207/207**, zero failed/skipped. Focused portion **189/189**, including **61 new UI2 unit/workspace tests**. Native browser portion **18/18**: nine new UI2 cases and nine unchanged UI1 cases.
- Four profiles × AR/EN/UR × 390/768/1440 widths: **36 UI2 profile/viewport contexts**, native Microsoft Edge, real generated CSS, keyboard activation, label lookup, no horizontal overflow or page errors. Presentation providers are synthetic fixtures. All 36 screenshots captured; three representative screenshots are committed and visually inspected. Physical devices and screen-reader verification: **NOT_PERFORMED**.
- Unchanged authenticated CSV/Excel App journeys against owned loopback Firestore/Auth emulators: **2/2 PASS**, no unhandled errors or cleanup errors. Existing registration, approval, Foundation, Fleet, import, activation, Trip transitions, original lost-ACK recovery, settlement and report assertions remain. Dedicated runner output avoids modifying accepted UI1 evidence. These are emulator checks, not production operations.
- `npm run verify:beta2`: **PASS / native exit 0** — TypeScript zero diagnostics, lint PASS, client/PWA/server builds PASS, reports **19/19**, release family **443/443**. Existing bundle-size warning remains; build gates/configuration were not changed.
- `npm test`: **546/546**, 48 unchanged invocations, native exit 0, no skipped tests.
- Final affected Wizard/UI1/UI2 family: **286/288**, zero skipped, **zero new historical failures**. Matched baseline: **26/28** in the two affected historical files, on UI1's unchanged tree identical to starting main. The same ProjectSetupLayeredWorkflow Unit2 updateProject argument expectation and OperationalMessages pricing_unregistered registry-grounding assertion fail. Neither historical test file changed. Raw candidate and baseline reports are committed; this is not a full historical PASS.

The first connected attempt correctly failed two journeys because the new driver section's accessible name also matched the existing partial Trip-selector label lookup. The section now uses the existing specific driver label; its heading retains context. The historical selector/assertions were not changed. The repeated unchanged journeys passed both cases. The failed raw report is retained as closed implementation evidence. A redundant appended kg label was also removed before final verification.

## Contracts and preservation

Trip engine/services, command policies, expected-version enforcement, Outbox, canonical DTOs, financial/pricing authority, authentication, authorization, repository transports, package dependencies, CI/build gates, global CSS/fonts and SQL are unchanged. Existing FieldOperationsView route composition, LoadingOperatorView, UnloadingOperatorView, dedicated DriverView and FieldSupervisionView are unchanged; this unit converges driver association and weighing within the configured adaptive route rather than replacing legacy/dedicated routes or migrating legacy Trips.

All 17 other worktree HEADs and dirty statuses are preserved, including convergence, UI1 and U03. Original RB4 nine unfinished file hashes and binary diff, committed migrations 001–012 there, and unfinished migration013 match the approved preservation baseline. Starting main's own tracked migrations remain byte-identical. No PostgreSQL activation or production data operation was performed.

## Review decision and remaining gates

**UI2 GO for independent source review as a local commit.** Owner publication authorization is still required. The two inherited historical failures, physical-device testing, screen-reader testing, independent review and operational acceptance remain open; none is concealed by a weakened assertion or test exclusion. No push, PR, merge, deployment, Google resource changes, SQL cutover or UI3 work is authorized or performed.

Raw artifacts are compressed JSON/log files under `ui2/`; decompress before independent inspection. Source hashes identify the final source used by the gates. Native browser fixture coverage and real authenticated emulator journeys are explicitly separate evidence classes.
