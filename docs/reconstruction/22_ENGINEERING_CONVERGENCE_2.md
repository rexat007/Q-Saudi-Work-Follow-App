# Engineering convergence 2 — operational integration

Date: 2026-11-11. Starting HEAD `b52e0167e3f60c59af3ad843a618ba2e95cef246`.
Branch `engineering/convergence-1-20261110`; local commit only. Firestore remains
production authority. No production or Google resource operations are authorized.

## Source-review gate and pre-implementation impact matrix

All 28 Execution 1 paths and their actual parent diff were read; compressed JSON,
JSON and CSV artifacts parsed. All 1,502 base inventory hashes were independently
recomputed from the pinned Git archive. The nine RB4 files, HEAD, status and
binary diff match the preserved evidence, including migration 013. No second
human/agent reviewer was used; this is a fresh source/evidence review, not an
independent organizational acceptance. Runtime coverage limitations in Execution
1 remain material: its command adapter serializes in-memory transactions, and
its component browser tests do not authenticate against Firebase.

| Defect family / current contract | Source evidence and affected consumers | Required behavior / negative acceptance |
|---|---|---|
| Event identity and transaction evidence | TripService dispatch/transition event IDs omit Trip identity; events live in one Project collection | Concurrent Trips at the same clock instant retain separate events/audits; replay creates no second consequence; rollback restores counters, Trip, outbox and receipt |
| Version and command recovery | TripCommands currently ignores client revision; command receipt exists but no readback port; Outbox excludes stale SENDING and blindly replays FAILED | Additive version fencing; old receipt fingerprints remain valid; receipt read reauthorizes current account/role/Project/driver ownership; lost ACK is recovered before replay; ambiguous transport never becomes success |
| Report tenant identity and completeness | ReportsEngineView deduplicates by Trip ID alone, reads 1,000 rows, retains previous data on empty auth/project scope | Composite Project/Trip identities, bounded paged complete read, no successful partial report or old-account display; >100 and >1,000 rows; scope change/error/empty cases |
| Canonical exception readback | FieldSupervision reads ExceptionEngine memory while Reports reads persisted exception repository | One persisted canonical source, current authorized Project scope, explicit error/loading state; no invented financial adjustment authority |
| Financial projection | Report adapter drops persisted financials; breakdown can infer a 500kg penalty not recorded by the server | Canonical financial snapshots are projected, never independently assessed; preserve legacy report-only contracts explicitly; zero values and missing evidence remain distinct |
| Acceptance harness integrity | Twelve selected files lack registered Vitest suites or exit the process; Portal fixtures target older editors/intent contracts | Inspect actual exported harnesses and fixture contracts; preserve business assertions unless a documented current-contract correction is necessary; retain exact remaining failures |
| Placeholder mutation/audit responses | app.ts legacy migration, entity-resolution approval, weighbridge commit and generic sync handlers return success without a transaction; audit GET returns an unconditional empty list. No active source client reference to these literal compatibility paths was found | Unimplemented mutation adapters fail closed instead of claiming commits; retain named canonical commands. Audit readback uses current account/Project/role and bounded persisted source queries. No speculative migration or import executor is added |

Changes must remain within these identified families and their actual consumers.
Further source review found that supervision's approval/rejection buttons only
emit SUCCESS notifications and persist nothing. Correct this same family by
composing the existing ExceptionService resolution/rejection methods in a
current-principal, scoped, idempotent server transaction. Preserve its existing
PROJECT_ADMIN/FINANCE_AUDITOR decision policy and require a review note; do not
introduce financial penalties or broaden role authority. Terminal decisions,
duplicate IDs, stale account/scope, failed persistence and duplicate requests
must be tested, with no success notification before canonical acknowledgment.

Historical fixture corrections require explicit source proof: the existing Trip
command fixture uses `truck_active_allocations`, while the approved temporal
authority reads `truck_active_material_allocations` with Project/Truck evidence.
Correct that fixture, retaining its dispatch/loading/import assertions. The
manual reports convergence case CONV-09 incorrectly expects identical Trip IDs
from different Projects to collapse; its expected cardinality changes from two
to three under the established Project-scoped canonical identity. No business
assertion is removed.

The workstation recovery family additionally includes: IndexedDB returns newest
operations first; unloading enqueues receipt/offload/completion with no durable
dependencies; loading looks up a deleted temporary ID and falls back to the local
ticket even after sync; conflict counts do not prevent success presentation;
accept-origin-net populates synthetic gross/tare; completion invents a local
exception ID. Correct ordering/dependencies and require the operation's actual
ACK/canonical projection before online success. Local preparation and offline
intent must remain explicitly distinct from committed server facts. Trip import
also suppresses event/audit errors and lacks finite nonnegative measurement
validation in the domain seam; preserve the source net-only contract while
making those failures abort the canonical command transaction.

Security review of the same exception/receipt family found that Rules permit
direct member exception creation and unprotected non-Trip receipt prefixes.
The active mutation caller is the named server command; the new decision receipt
must be protected from client creation/update exactly like Trip receipts.
Exception writes therefore become server-only, and `EXCEPTION-CMD-` joins the
existing protected prefix. Test real emulator-token client writes (including
admin and viewer attempts) and authorized server decisions. These are source/
local-emulator Rules changes only, never production deployment.

Offline cache review found a further tenant-identity defect: legacy Trip caches
use Trip ID alone as their primary key. The bounded correction adds a version-4
client cache store keyed by current principal + Project + Trip, preserving all
existing stores/records and U07 SQL queues unchanged. It is a non-authoritative
cache, not a new business store. Legacy unowned cached Trips are not silently
assigned to a user. Active consumers must pass Project scope, ambiguous legacy
lookups fail closed, and actual IndexedDB transactions must commit before local
journal acknowledgment. Add same-ID cross-Project/account, upgrade preservation,
concurrent insert and aborted-write browser tests. SQL migrations remain intact.
No migration, accepted Trip FSM, canonical relationship, pricing tariff, U05
receipt or Google delivery contract may be weakened. Tests must include real
local Firestore transactions, current role evidence, rollback, concurrent workers,
snapshot/measurement/report reconciliation and real browser interruption paths.

## Verification and final disposition

The corrections below are implemented and locally verified. **Execution 2
operational acceptance remains INCOMPLETE**: the historical acceptance chain has
unresolved evidence gaps. This is a local corrective source commit, not a release
certificate, a replacement architectural phase, or U09/RB4 closure.

### Runtime dependency and evidence map

| Actual consumer / entry | Authoritative boundary and durable evidence | Verification and limits |
|---|---|---|
| AuthProvider / AdminConsole | Firebase token middleware → `adminAccount.server.ts`, current persisted profile; account audit and command receipts | Real emulator token verification, persisted suspension, viewer mutation denial, logout/login isolation. Account registration/approval UI is not driven through its complete journey in this execution |
| Project Setup Wizard / Foundation | `projectCommands.server.ts`, `projectLifecycle.server.ts`, `projectReadiness.server.ts`; Project revision, lifecycle/setup and existing receipts | Existing source/authority suites retained; native RB1/RB2 regressions verified. Firestore operational fixtures seed a valid Foundation rather than pretending Wizard setup is exercised |
| Canonical Fleet / contextual Import editor | Project participation authority, canonical relationship commands, memberships, affiliations, temporal assignment/allocation and active pointers | Corrected Portal harness exercises actual shared editor and explicit review; Trip creation revalidates actual persisted relationships. This does not independently certify every canonical maintenance screen |
| CSV/Excel / Google source intake | `importSession.server.ts`, artifact chunks, reviewed intent, frozen `rosterExecution.server.ts` batches; source/intent versions, immutable chunks, per-batch receipts | U05 source contracts retained, U09 RB3 native/browser suites retained. Historical provider/import-commit harness gaps remain explicit below; no live Google call, fabricated mapping completion or Firestore→SQL session conversion |
| Pricing Wizard / Trip settlement | `projectPricing.server.ts`, canonical pricing versions and audit; Trip captures tariff/terms, server computes settlement | Actual Firestore tariff replacement after dispatch cannot reprice historical Trip; 19 t × SAR 12.50 = 237.50 + 35.63 VAT = 273.13; accepted 20 t = 250 + 37.50 VAT = 287.50. No new financial adjustment authority |
| Dispatch / Loading / Driver / Unloading | Named command HTTP handler → current principal → real Firestore transaction → TripService/FSM, staged canonical persistence and counter | Compound loading, arrival, three measurement modes, offload/completion; rollback, duplicate/revision, role/scope and receipt tests. Approved FSM is retained |
| Field Supervision | Persisted exception subscription; named review command → current principal → existing ExceptionService inside Firestore transaction | Decision + audit + actor-scoped receipt atomic, repeat idempotent, duplicate exception ID and terminal new decision denied. Review notes required; no fake approval notification |
| Reports / CSV / printable document | Complete bounded server reads of authorized Projects, Project+Trip and Project+Trip+Exception identities, persisted financial snapshots | One-shot generation fencing, pages of 500, 50,000-row fail-closed bound, 1,002 actual Trips in browser; canonical reconciliation and download/print checks. Actual CSV download and print preview pass on both desktop/mobile (2/2); CSV contains the complete 1,002 count and canonical 237.50 settlement without undefined/NaN. Concurrent multi-page reads are not an MVCC frozen-report snapshot; a frozen export boundary remains separate evidence |
| Audit readback / compatibility APIs | Bounded current-principal read over the existing root and nested audit collections; independent continuation per source | Scoped persisted audit read and current-role denial. No invented empty success. Four unimplemented compatibility mutation routes now return 501 with an explicit canonical-boundary error |
| Outbox / IndexedDB / workstation ACK | Principal+Project+Trip cache, immutable operation reservation; causal dependency order; receipt read before uncertain replay | Real Edge reload, lost loading and completion ACK, concurrent tabs, account change, authorization revocation, version-3 upgrade and aborted transaction. UI acknowledgment comes from canonical returned Trip; old unowned cache records are preserved without assuming ownership |
| Workspace Google projection | Existing Project event outbox, U08 binding/grant authority and the existing server transport | U08 authority 19/19, transport 10/10 and quiescence budget 10/10 unchanged. No second Google writer, relink, resource creation, live provider request or business dual-writing. RB4 remains separate |

### Corrected defect families

- Trip/event identifiers use UUIDs and include Trip identity; a same-clock model
  test retains distinct events. Imported event/audit failures propagate into the
  transaction. Native rollback verifies Trip, counter, events, audit, receipt and
  projection outbox have no partial commit.
- Optional `expectedRevision` fences concurrent changes. Legacy envelopes retain
  their exact existing fingerprint format. Receipt-only requests reauthorize
  before returning evidence, perform no business write, and recover the same
  logical operation after an uncertain response.
- Outbox operations are durably reserved, processed oldest/causal-first, and
  fenced by principal and explicit dependencies. Unknown responses, 429 and 5xx
  remain `AWAITING_RECEIPT`. A known domain FSM conflict is HTTP 409, not a
  fictional provider outage. Local conflict decisions cannot manufacture a
  server ACK. A stale tab cannot downgrade `SYNCED` in an atomic IndexedDB
  transaction. Demo conflict heuristics cannot block canonical server replay.
- Loading/arrival/completion callers require the returned durable ACK online;
  an optimistic temporary record cannot substitute for it. Accepting origin net
  no longer invents destination gross/tare. Workstation scale buttons cannot
  invent readings when no scale provider exists. Offline preparation remains
  explicitly local until server confirmation.
- The production Outbox drawer no longer imports/runs test suites or writes
  simulator scenarios into the user's journal. Historical standalone harnesses
  remain available to test tooling.
- The additive IndexedDB version 4 cache preserves all old stores and receipts;
  owned cache identity includes principal, Project and Trip. Async cache writes
  carry the captured principal. Existing SQL stores and all SQL migrations are
  retained. A failed transaction cannot publish an in-memory receipt.
- Reports retain cross-Project IDs, reject partial successful generations, clear
  previous scope/error data, and page beyond the previous 1,000-Trip cap. The
  adapter carries finalized canonical financials and unload provenance. Canonical
  amounts, including zero, are read rather than inferred penalties or missing
  values. Report-only legacy contracts are preserved separately.
- Supervision uses persisted exceptions and real resolution/rejection receipts.
  Review input is scoped by Trip+exception. Direct browser exception mutation
  and forged `EXCEPTION-CMD-` receipts are denied by the local production Rules.
  The source Rules change is not deployed.

### Verification environment and coverage

Node 22, npm 10.9.8, Java 21, official Firestore emulator 1.22.0 at
127.0.0.1:8085 and Auth emulator at 127.0.0.1:9099, synthetic project
`demo-convergence2`. The emulator JAR hash is
`9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c`.
Production Express authentication middleware verifies actual emulator ID tokens;
real Firestore transactions and production authority fencing execute. Tests do
not replace the datastore with a Map. Isolated PostgreSQL 17.6 at localhost:55439
uses randomly named disposable databases and actual restricted runtime roles.
The test runner deletes only databases created for that run. Edge runs headless
at 1440×1000 and 390×844 with actual App/AuthProvider/I18nProvider, Arabic RTL,
real Sidebar/mobile drawer, production HTTP routes, Rules and IndexedDB.
Non-loopback browser requests are blocked. Firebase's Admin SDK emitted a
metadata credential lookup warning while using emulator-only endpoints; it is
retained in raw logs, not hidden or treated as production access.

Measured results and exact test identities are in `convergence-2/verification.json`
and the compressed raw evidence. The focused 88/88 covers the new tests plus
unchanged business assertions in Trip/outbox and corrected Portal seams. U07–U09
and Workspace: 217/217 identities across the main 216/217 run and the unchanged
53/53 business assertions in the corrected U07 client-version run. The first
U07 failure was the historical explicit IndexedDB version expectation (3→4);
all legacy store/data/SQL refusal assertions remain, with a new scoped-store
assertion. Build passes for browser/PWA and bundled server. TypeScript/lint are
not passing: 442 baseline diagnostics remain; no semantic diagnostic additions
were observed after normalizing line locations and union-member order.

### Historical harness adjudication and assertion changes

The clean detached baseline at the exact source HEAD runs the same 138 paths as
the candidate: the existing 135-file selection plus Portal, Block94 and final
release readiness. It contains 2,526 tests, 2,422 passes and 104 failed assertions,
plus 13 failed suite registrations. Execution 1's narrower 2,494 selection had
92 failures and 12 registrations; adding mandatory Block94/Portal accounts for
the additional assertion identities, and adding finalReleaseReadiness accounts
for the thirteenth registration. No failure is hidden by excluding a file.

Final matched selection: **2,431/2,526 PASS, 95 failed assertions, 13 failed suite registrations; zero new failure identities and nine resolved identities.** No test is skipped or removed. The initial candidate had seven new harness/timeout failures; all seven passed after the documented handler/mock corrections and an unchanged digest-test rerun. Final matched selection confirms no added failures.

All 13 registration failures are standalone/exported-function harnesses, not
registered Vitest suites. They were executed through their actual entry points,
with per-file logs and unchanged failure identities retained:

| Harness | Actual execution / product implication |
|---|---|
| conflictEngine / conflictResolution | Standalone serialized/model assertions pass; their demo heuristics are not authoritative production conflict evidence |
| pricingEngine / reportsEngine | Pure calculator/report harnesses pass; not database or authorization proof |
| reportsEngineConvergence | 48/48 after the documented composite-identity correction; static/pure coverage, not real provider coverage |
| tripIdentityAdjustmentBlock89 | Standalone harness passes; generated report timestamps are reconciled in this commit |
| workspaceConvergence | Static/metadata checks pass; no live resource acceptance |
| reportsEngineControlCleanup | REP-CLEAN-12/13 expect retired live subscriptions. Source uses deliberate one-shot reads for idle quiescence; test registration/contract debt remains visible |
| googleDriveImport | TC-GDRV-09/10 legacy commit/cache expectations fail without current server command/receipt setup. No assertion was waived; production intake acceptance is not inferred from buffer parsing |
| googleSheetsImport | TC-GSHT-01/02 lack Firebase Authentication; TC-GSHT-11 remains at REVIEW with zero committed Trips. This is incomplete authenticated integration evidence, not permission to bypass current authorization |
| weighbridgeImport | WB-33 legacy commit harness fails; bounded parsing/review success is not a durable server commit |
| workspaceIntegration | WS-TEST-01/07 test older metadata/tab contracts. Current U08 authority/transport pass, but that does not silently certify legacy resource expectations |
| finalReleaseReadiness | AUDIT-SEC-02/05, AUDIT-I18N-01 and AUDIT-REG-01 fail. The 1,128-key frozen cardinality is obsolete (current parity 4,755); role/navigation and aggregate legacy acceptance require explicit adjudication, not assertion deletion |

Portal: baseline 14/20, final 20/20. Its six failing identities are preserved.
D06 uses the shared editor's current title/national-ID label. C4 A/B use named
inputs instead of retired placeholders. C4 C/D provide canonical active Carrier
evidence and explicitly confirm the chosen conflict after asserting that both
initial submission and editing alone remain blocked. C4 E still checks cancel
and clean-group state isolation. The C4 C title mentions Iqama while its actual
fixture conflicts in phone; the fixture and submitted-phone assertions are
retained. DOM ownership cleanup from Execution 1 is preserved.

Other narrowly justified test corrections retain business assertions:
`truck_active_allocations` → the approved `truck_active_material_allocations`
pointer with integrity evidence, and a valid effective date/currency in Trip
fixtures; CONV-09 retains both same-ID Projects; three structural Trip boundary
assertions follow the extracted shared HTTP handler to the same server command
service; outbox HTTP denial mocks now carry actual HTTP 403. Their original
role/scope/link no-ACK assertions remain unchanged. No accepted SQL migration
inventory assertion is changed.

The mandatory Block94 harness uses Map-backed repositories and obsolete client
creation seams. Its six failures cascade from UNAUTHENTICATED / Project not found
and cannot substantiate the complete real acceptance chain. The real emulator
journeys replace specific lifecycle/security/recovery evidence, not the untested
account→Foundation→Fleet→Smart Import setup chain. All baseline failure
identities, first messages, classifications and unresolved impact are retained
in `convergence-2/historical-failures.json`. Classification as a harness mismatch
never proves that the corresponding production journey is accepted.

### Remaining blockers and exact Execution 3 preconditions

No observed P0 defect is established in the verified local scope. **Zero
unresolved P1 across the requested whole operational scope is not certified.**
The following acceptance gaps remain material, without inventing a new phase:

1. Finish adjudicating remaining auth continuity, setup/readiness, canonical
   import, Workspace/provider and navigation historical integration failures
   against current contracts. Their exact identities remain in the evidence;
   inherited failures are not automatically harmless. In particular, do not
   restore browser business writes, stale profile authority, old global Trip-ID
   deduplication or a second Google writer to satisfy old harness assumptions.
2. Execute the complete account registration/approval → Foundation → canonical
   Fleet → reviewed immutable source → durable Import execution → operational
   Trip journey through current UI and production Firestore routes in the
   isolated environment. This execution's valid Foundation/Fleet are seeded;
   it does not claim their maintenance UX was driven end to end. Cover all
   supported operational profiles, cancellation/rejection and financial
   adjustment approvals under their already approved ownership contracts.
3. Expand all-authorized-Projects/report/exception failure-generation tests,
   XLSX and physical PDF export verification. CSV and printable document tests
   are bounded; opening a print preview is not physical printer/PDF acceptance.
   Independently review multi-page concurrent-data consistency requirements
   before representing an ordinary paged operational report as a frozen export.
4. Obtain independent integrated source review and operator acceptance. This
   executor's recomputation/source review is not organizational independence.
   Resolve remaining TypeScript/lint debt or obtain an explicit, bounded
   acceptance decision; this commit cannot certify a green compiler.
5. Preserve RB3 source-owner/frozen-export, unsupported mapping and canonical
   resolution limits. Continue RB4 separately from its preserved checkpoint;
   independently verify SQL leases, exact six-resource bindings/grants, marker
   recovery and single-writer composition. Overall U09 remains BLOCKED.
6. Any future production gate requires separate authorization: Rules/IAM and
   deployment validation, server keys/storage ownership, device/drain/load
   review and production cutover acceptance. None is performed here.

No push, PR, merge, deployment, live Google operation, production data mutation,
production migration or SQL activation was performed. The exact changed-file
inventory and reasons, preservation fingerprints, compiler comparison, raw test
reports and final local commit reference are retained with this report.


### Exact changed-file inventory

54 paths are listed in [changed-files.txt](convergence-2/changed-files.txt), with a per-file reason in [changed-files.json](convergence-2/changed-files.json). No dependencies, SQL migrations or Google transport source is changed.
