# Engineering convergence 3 — final acceptance evidence

Starting HEAD: `9d798dfb9dd90d8ffa19bcba5f03ac41db2cd746` on `engineering/convergence-1-20261110`. Execution 1 and frozen U09 baseline are ancestors; initial worktree clean. Both reports and every machine-readable artifact parsed; baseline-to-HEAD scope compared against the two exact inventories. RB4's nine dirty files, HEAD and binary diff are unchanged; 001–012 hashes match. This executor's fresh review is not independent organizational acceptance. No push, deployment, production mutation, SQL activation or Google operation is authorized.

## Before-change contract and impact register

| Family | Exact defect/evidence | Contract and negative cases | Bounded allowlist |
|---|---|---|---|
| Current account authority | AuthProvider supplies `watch: () => () => {}`; authProviderContinuity fails because the actual provider never subscribes, and mounted approval/revocation presentation remains stale | Firestore watches only the current user's server-confirmed profile; cached/pending writes cannot grant authority; failures preserve input but remove mutation authority; account switch/dispose fences old callbacks. SQL mode must not subscribe to Firestore | `src/firebase/authContext.tsx`, existing auth tests and actual emulator/browser journey |

Additional compiler review establishes concrete source defects before correction:
Google Drive review ignores the caller's durable importBatchId and generates a
new one; the UI passes that identity for session/revision continuity. Add the
existing optional identity to the process contract and honor it, with invalid-ID
rejection and retry tests. The pipeline emits REVIEW_REQUIRED although the
persisted batch contract requires AWAITING_REVIEW; retain human-review blocking.
Canonical persistence imports AuthUserContext from the wrong module; imported
Trip audit dates violate the Date/Timestamp domain contract. A legacy matching
fallback already reads relContext; explicitly type its existing read-only shape
without granting canonical authority or removing current resolutionContext.
Allowlist: the corresponding types/pipeline/persistence/Trip files and focused
existing/new import tests. No compiler exclusions, broad any casts or SQL changes.

## Reproduced Execution 2 baseline

Exact 138-path selection: 2,431/2,526 pass, the same 95 failed assertion identities and 13 registration failures; zero baseline identity delta. Compiler: 442 diagnostics with unchanged configuration. Later results must retain exact identities and root-cause dispositions, never equate a module pass with the connected UI journey.

## Work in progress

This baseline checkpoint is superseded by the final bounded results and NO-GO decision below.

Compiler harness corrections preserve assertion bodies and IDs: explicit Vitest test imports, legacy three-argument test descriptions retained as comments with the supported two-argument API, and empty email/displayName presentation fields on synthetic AuthUserContext fixtures (no role, scope, user identity or stored account authority changed). No type configuration, suppression or compiler exclusion is added to hide diagnostics. Imported Trip metadata now uses the existing dispatch defaults for SYNCED/no exceptions, preserving canonical field requirements.

## Registration defect family (before correction)

Thirteen historical .test files either export result-producing functions without
registering tests, or unconditionally run a CLI and call process.exit. Their
business assertions are retained. Register each existing result ID in Vitest,
run the existing result producer once in beforeAll, and fail every false/missing
result. Convert the three CLI-only bodies to callbacks, preserving thrown
failures. Three case producers are also imported by legacy UI diagnostic panels;
extract them to same-directory .cases modules and update only those imports so
framework code never enters the browser bundle. No cases are deleted/excluded.
REP-CLEAN-12/13 must assert the approved complete one-shot Trip/exception readers,
not restore retired subscriptions; idle quiescence remains part of the contract.
Former manual-only failures become visible registered assertion failures until
their owning contracts/fixtures are corrected; they are not newly waived debt.

## Connected-journey recovery defect (before correction)

Registration/approval, Foundation/configuration, canonical identities and temporal
relationships, pricing, CSV review, reviewed intent, durable COMMITTED/COMPLETED
execution and ACTIVE activation have now run through actual controls. The next
approved Operational Configuration route renders AdaptiveOperationsView, not the
legacy workstation. It keeps command UUID only in a React ref. Lost dispatch ACK
plus reload can therefore create a new logical command/duplicate Trip. Correct
this entire named-command family by extending the existing owner-scoped Outbox
with frozen TRIP_COMMAND envelopes, optional revisions, receipt-first recovery,
canonical returned readback and scoped explicit replay. No second journal/store,
writer, Google transport or SQL migration. Persisted client readback is only a
presentation cache; the server remains authority. Gate new commands while an
uncertain operation is unresolved, restore pending measurements on reload, and
verify lost dispatch/completion ACK, restart, two tabs, role/account/Project
switches, current revision and no duplicated consequences through actual UI.
Allowlist: AdaptiveOperationsView, existing Outbox/client/types, a small durable
command orchestration helper and emulator/browser tests. Preserve all FSM rules.

### C3 connected inventory propagation correction (before change)
The root inventory is one-shot and never receives canonical Wizard command results.
Consequently a newly activated/configured Project can remain absent or stale when
navigating directly to Operations. Publish current-context canonical snapshots via
an optional Wizard callback, scoped to the current principal and assignment set.
Fence an outstanding inventory read against later command results; reject older
Project versions. No polling, new subscription, authority or business write.
Allowlist: App, ProjectSetupWizard, connected journey and focused regressions.

### C3 operational reporting closure (before change)
AdaptiveOperationalReports still reads 500 records, renders empty success while
loading/unavailable, and lacks the existing CSV/XLSX/print controls. Use the
existing complete canonical reader and existing export/print implementations,
with explicit historical trace fields (unknown evidence stays unavailable).
Export the selected report family and filters; calculate financial summary from
matching canonical records only. No provider write or Google acceptance claim.
Allowlist: AdaptiveOperationalReports, connected browser verification and evidence.

Reporting/operation UI harnesses now supply the complete-reader and durable
command boundaries used by production, retaining all Google idle, click count,
error, null-driver and authorization assertions. Commit-integrity case 18 now
expects the declared AWAITING_REVIEW state; unresolved rows still cannot commit.
New journey polling allows 30 seconds for actual emulator transaction readback;
no existing assertion or historical timeout is relaxed. The initial expanded
CSV run expired before READY_FOR_REVIEW while Excel completed; retained as
failed evidence until the bounded real-route rerun resolves its disposition.

### Source-adjudicated historical harness corrections (before change)
Navigation source declares four primary/two production tools and denies retired
standalone surfaces; P9 permits Finance Wizard pricing while denying every
field station. Audit fixtures incorrectly enumerate removed routes and deny
that approved maintenance. Dictionaries frozen at C2 contain 4,755 matching
keys, not the old 1,128. Workspace schema has seven tabs including FLEET_ROSTER
(independent of U08 six-resource identity); retired Trip prototype must be empty.
The user-active hook explicitly retires ALL browser automatic passes; preserve
zero calls on mount/focus/reconnect. The reviewed import route delegates to
RosterExecutionServer.requestCommit under project/dispatcher guards; do not
restore dispatchImportedTrip bypass. Reports use one complete generation and
one localized data-loading error, with all three locale translations retained.
Update these exact harness contracts without changing production permissions,
source contents, providers, Google resource identity or business assertions.

### Actual mobile screenshot correction (before change)
The 390px viewport produces a 766px document: the header role control does not
wrap; KPI decimals overflow cards, and operational table text lacks explicit
contrast. Bound/wrap the existing header controls, format presentation-only KPI
numbers to three decimals, and explicitly color the operational tables. Keep
full unrounded canonical/export values. Assert document width in the real
mobile journey. Allowlist: App/header and AdaptiveOperationalReports only.

## Final result — NO-GO

The connected current App journey is now exercised through actual controls,
authenticated server routes, Firestore Rules and disposable canonical data.
Both CSV and XLSX flows pass registration/owner approval, Foundation,
configuration, canonical Fleet, pricing, mapping/human review, durable Import,
activation, Trip lifecycle, final settlement, exports, audit and suspension.
This is meaningful bounded product evidence, not full production acceptance.

Production remains **Firestore**. Authentication uses the existing Firebase
principal/profile; business mutations remain server-authorized; IndexedDB is
an owner-scoped pending-intent/readback journal, never authority. Existing U08
Google transport remains the sole writer; browser global automatic delivery is
retired. PostgreSQL remains the approved inactive target. No SQL source or
migration is changed; original RB4's nine dirty files/013 are unchanged.

### Verified corrections and results

- Mounted account approval/revocation now receives server-confirmed profile
  changes, with cached/pending evidence and old principals fenced out.
- Wizard publishes current canonical Project snapshots to the scoped inventory;
  pending older reads/versions cannot replace them. Profile authority/status
  transitions refresh or clear inventory, including after browser reload.
- Adaptive operations uses the existing durable Outbox for all named commands.
  Atomic real IndexedDB reservation fences concurrent tabs. Recovery uses the
  captured operation identity even after another tab ACKs it; no replacement
  intent is generated. Explicit recovery retains the bounded retry identity.
- Actual lost dispatch/completion ACK and reload/two-tab recovery yield one
  Trip, nine events, nine mutation POSTs and three receipt lookups per journey.
  Final origin/destination measurements are 20/19 tonnes; final amount is
  **273.13 SAR**. No extra mutation POST occurs during receipt recovery.
- Reports use a complete canonical generation rather than a 500-record cap.
  Loading/unavailable states cannot present empty success. Existing CSV/XLSX
  and print implementations receive the selected family/filters and historical
  summary. Unknown trace evidence stays unavailable. Numbers are rounded only
  in KPI presentation; stored/exported facts remain unchanged.
- After the unseeded live journey passes, the CSV case adds an explicitly
  source-derived synthetic reconciliation dataset: **1,002** records, including
  the row beyond the old cap; exported CSV has 1,003 lines and binary XLSX
  includes RECON-1000. Totals are 20,040 loaded/19,038 received tonnes. This seed
  is reconciliation evidence, not a substitute for the connected workflow.
- Arabic mobile screenshot inspected after correction: 390px document/viewport,
  wrapped header, readable KPI values and table. Desktop and mobile automation
  are supporting evidence; physical-device/operator acceptance is pending.
- Final mobile/workflow/Google-idle UI bundle **17/17 PASS**; preserved focused
  recovery/export/Portal plus new journal/source cases **96/96 PASS**; corrected
  contract bundle **115/115 PASS**; final auth/Carrier/recovery fixtures **50/50**.
  Unchanged U08 transport **10/10** is retained in native and matched evidence.

### Exact quality gate status

Frozen baseline: **2,431/2,526**, 95 failed assertions and 13 registration
failures, reproduced before modifications. Final full matched-path run:
**2,666/2,761**, **95** failures, **zero registration failures**. All 2,526
baseline assertion identities remain. Registering the former manual/CLI suites
adds 235 assertion identities; 229 pass and six positive legacy provider/import
cases fail. Seven original failures resolve. One additional full-run provider
fixture timeout passes unchanged in its focused recheck. The explicitly
identified latest focused-result overlay is **2,667/2,761, 94 failures**; this
is not claimed as another full run or a green suite.

All exact failed/resolved identities, retained messages, owning fixture/contract
classification and unresolved release impact are in
[historical-failures.json](convergence-3/historical-failures.json). The six newly
registered positives are TC-GDRV-09/10, TC-GSHT-01/02/11 and WB-33. Their old
unauthenticated/provider/commit seams do not supply current trusted server
source/snapshot evidence. No success is fabricated to clear them. Remaining
historical canonical import, Workspace binding/grant/projection, lifecycle and
policy assertions stay **release verification blockers**, not harmless debt.

TypeScript/lint: **442 -> 314**, **128 resolved semantic diagnostics, zero new**.
All remaining diagnostics are recorded in
[compiler-delta.json](convergence-3/compiler-delta.json). No configuration,
exclusion or suppression hides them. `npm run lint` fails; actual
`npm run verify:beta2` stops at that unchanged lint gate. Browser/PWA and server
build pass; the existing approximately 5MB client chunk warning remains.
`git diff --check` passes after whitespace-only cleanup of two edited assertions and five pre-existing lines copied with the extracted case producers.

Native isolated PostgreSQL 17 combined run: **278/280**, plus RB1 afterAll
cleanup timeout. U07/RB1 recheck: **80/82**, plus the same cleanup timeout.
Restart timeout identities differ between runs; exact messages are retained.
No historical assertion or timeout was relaxed. Current source startup checks
release their SQL clients in finally; no business assertion is substituted for
these incomplete restart/resource-cleanup gates. **The full native gate is not
green**, and 217/217 is not claimed for this execution. The initial interrupted
run's temporal timeouts and later combined temporal pass are retained too.

### Required blockers and acceptance authority

| Severity / gate | Affected capability | Required action before release |
|---|---|---|
| P1 verification | Remaining 94 latest historical assertions / 95 full-run failures | Correct each recorded owning current-contract fixture or implementation, retain legitimate assertions and obtain repeatable passing integration results |
| P1 quality | 314 compiler diagnostics; lint/release gate fail | Close the recorded typed fixture/contract diagnostics without suppression, then rerun the full release chain |
| P1 resilience verification | U07 persistent browser restart and RB1 cleanup timeouts | Establish deterministic bounded process restart and teardown, rerun unchanged native assertions and resource checks |
| P1 acceptance gap | All role-specific screens, approved profile/exception/correction/output combinations | Complete integrated coverage beyond the verified dual-weighbridge/MIXED journey; retain current negative authority rules |
| Mandatory independent gate | Integrated source/security review | Separate authorized reviewer records acceptance; this executor cannot self-certify it |
| Mandatory operational gate | Operators, physical phones/print, full PDF visual pagination | Explicit human/operator and physical-device acceptance record |
| Mandatory production gate | Environment/IAM/credentials/live Google/rollback/deployment | Separate authorization and successful environment checks; none executed here |

No observed P0 is asserted in the bounded passing local journeys; whole-scope
zero P0/P1 is **not certified**. A passing build or zero new compiler diagnostics
does not clear these gates. No additional architecture phase is created.
Overall U09 remains BLOCKED pending independent integrated review, operational
acceptance and its separate inactive-SQL/RB4 readiness gates.

### Reproducible evidence and limits

- [Full acceptance matrix](convergence-3/acceptance-matrix.json): exact contracts,
  paths, identities, runtime evidence, security/recovery, status and authority.
- [Verification summary](convergence-3/verification.json) and compressed raw
  results/logs preserve failed attempts and focused overlays explicitly.
- [Preservation](convergence-3/preservation.json): exact original RB4 HEAD,
  nine-file hashes/status/binary diff and all twelve migration hashes.
- Connected CSV/Excel JSON contains HTTP method/path/status observations only;
  it has no auth token or source bytes. HTTP counts do not certify complete
  billable Firestore SDK budgets or production load/latency. Existing budget
  tests and the large read/export case remain bounded local evidence.
- The sole journey seed is an existing trusted administrator profile; owner
  bootstrap is not certified. Auth uses local Auth/Firestore emulators; only
  public static `apis.google.com` Auth SDK assets are allowed externally. This
  is **not** real Google transport/resource/credential acceptance.
- PDF artifacts and the mobile screenshot are included for review. Generated
  PDF/print content assertions do not certify physical printing or complete
  visual pagination. All original C2 reports/evidence remain unchanged.

The verified corrective changes are committed **locally only** on the existing
convergence branch. No push, PR, merge, deployment, production mutation, Google
resource operation, SQL activation or original RB4 modification is performed.
The final commit identity and clean-worktree result are reported after commit;
[changed-files.json](convergence-3/changed-files.json) inventories exact scope.
