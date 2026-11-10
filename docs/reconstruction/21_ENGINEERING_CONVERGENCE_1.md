# Engineering convergence 1 — evidence and correction record

Base: `11326e277939fe3a1d839d723085797d3d6a691f`. Isolated branch:
`engineering/convergence-1-20261110`. Local publication only; no push authorized.

## Pre-implementation impact matrix

The canonical resolver (`canonicalResolution.ts`, `selectedResolution` and
`resolveCanonicalRoster`) emits acceptance, method, relationship, risk and
authorization evidence. `RosterBatchReviewService.determineGroupStatus` is the
existing presentation policy for that evidence. An ID alone is not acceptance.

| Family | Source defect | Consumers and correction scope | Acceptance |
|---|---|---|---|
| Carrier readiness | ID-only rows can have no review group; the canonical row gate checks only the candidate ID | `RosterBatchReview.service.ts`, Carrier layer, `rosterResumeJourney.ts` | Each required row must satisfy existing review policy, even without a group |
| Material readiness | Candidate ID with explicit REVIEW/REJECT, fuzzy ambiguity or unsafe risk can pass `materialRowsReady` | `rosterMaterialBinding.ts`, Material layer, Wizard, resumed-stage reconciliation | Same evidence policy per row; valid selected resolutions remain ready |
| Legacy layer checks | Both layers read a nonexistent resolution `status` property | Carrier and Material layer check helpers | Replace these reads with the existing typed review policy |

Production allowlist: the two layer components, `rosterBatchReview.service.ts`,
`rosterMaterialBinding.ts`. Add one shared pure predicate module if needed.
No change to the resolver, reviewed intent, server execution authority, receipt,
transaction, source revision, persistence, or migration contracts.

Security: fail closed on unresolved evidence; this is presentation, never a
replacement for server authorization. Concurrency/recovery: no new writes or
caches; fresh canonical revalidation remains necessary after resume and before
execution. Performance: linear row traversal, no network or database calls.
Carrier/Material cannot use Driver/Truck PREPARED_NEW plans as acceptance.
Tests must exercise group omission, mixed rows, unsafe evidence, rejected rows,
valid selections and resumed-stage routing; existing assertions remain intact.

## Repository and isolation

Actual checkout: `rexat007/Q-Saudi-Work-Follow-App`, origin
`https://github.com/rexat007/Q-Saudi-Work-Follow-App.git`. Fetched/live main was
`030e9027685033c674cf2021499db7bfb675cbfd`; local and remote U09 were the base
above. Original branch remains
`reconstruction/ar2-u09-sql-runtime-cutover-readiness`.

Nine dirty RB4 paths were present, including the untracked migration 013. Their
bytes, original HEAD, complete porcelain status and binary diff were fingerprinted
before isolation. Convergence uses a separate worktree; no RB4 file was copied
into the implementation. See [preservation proof](convergence-1/preservation.json)
for every original SHA256 and migrations 001–012. The original RB4 checkpoint is
preserved, not represented as implemented or verified by this convergence.

## Exact processing coverage

All **1,502** tracked blobs at the pinned base were read and checked against their
Git object identity; SHA256, size, path and category are in
[tracked-inventory.csv](convergence-1/tracked-inventory.csv).

| Category | Files |
|---|---:|
| Documentation | 280 |
| Configuration/assets/reports | 309 |
| Server | 26 |
| Application | 500 |
| SQL migrations | 12 |
| Test-directory files, including helpers | 375 |

1,497 UTF-8 text files were decoded and processed. All 953 JS/TS files were
parsed with the TypeScript AST: zero syntax diagnostics, 5,480 static
import/export references, 105,571 syntactic call sites, 9,920 type references,
2,208 named function/class/interface/type declarations, and 141 string-literal
route/middleware registrations. The supplementary traversal records all 144
literal dynamic imports and 15 direct CommonJS import/resolve calls; no relative
dynamic import remained unresolved. The sole unresolved relative static import
is `src/main.tsx → ./index.css`, which is present and handled by Vite.

Non-AST text processing records line counts, JSON root structure, SQL DDL/grant
markers, Rules match/allow declarations, CSS directives and documentation links/
headings. Two historical report JSON files fail structural parsing:
`reports/i18n-translation-catalog.json` (line 781383) and
`reports/lu-p6-02b2-discovery.json` (line 8). Their bytes and lexical facts are
included; they were not silently omitted or repaired.

The five binary exclusions from text/AST analysis are the tracked PNG/ICO assets:
`public/apple-touch-icon.png`, `public/favicon.ico`, `public/pwa-192x192.png`,
`public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`. All five were still
content-verified and inventoried. Generated output, ignored dependencies and
uncommitted RB4 are outside the pinned tracked-source scan. New convergence files
are separately inventoried in [changed-files.txt](convergence-1/changed-files.txt).

The [cross-domain graph](convergence-1/dependency-graph.md), all
[static import edges](convergence-1/imports.csv),
[dynamic/CommonJS edges](convergence-1/dynamic-module-edges.json),
[route registrations](convergence-1/routes.csv), and
[test map](convergence-1/test-map.csv) retain source locations.
[Workflow traces](convergence-1/workflow-traces.md) cover all eleven requested
domains, with 69 reviewed source anchors in
[workflow-evidence.json](convergence-1/workflow-evidence.json).
[source-map.json.gz](convergence-1/source-map.json.gz) contains the full scan and
supplementary text/call/type evidence. The original AST scan implementation is
[scan.mjs](convergence-1/scan.mjs); run it in a clean pinned-base checkout with the
existing dependencies. Supplemental records were extracted from a second
1,502-blob verified baseline archive using the same TypeScript parser.

Coverage limits: the graph records observed module edges and syntactic calls,
not inferred runtime call targets or a proof of authorization. The 76 nonliteral
server route-call candidates include ordinary middleware/provider calls; they
are preserved for review, not counted as endpoints. The computed SQL canonical
registration loop in `sqlRuntimeRoutes.ts` expands six command paths. Computed
provider calls, injected ports, Rules/IAM execution and deployment behavior need
independent runtime evidence. Static processing of every file is not exhaustive
semantic or live operational certification.

## Implemented correction

`acceptedRosterIdentity` delegates row readiness to the existing grouped-review
policy, additionally rejecting unresolved reasons, contradictory entity kinds
and Driver/Truck creation plans in Carrier/Material fields. Accepted historical
rows may omit the redundant kind; no persisted record is rewritten. Both
canonical gates and legacy layer checks consume it. Rendering and resume-stage
selection therefore agree even if a display group omits a row or combines rows
with different evidence. Existing row exclusion behavior is retained.

No server business authority, role policy, source store, reviewed signature,
execution receipt, epoch, Google transport, database schema or historical test
assertion was changed. The four production files are the full allowlist above.

## Verification reconciliation

| Check | Result |
|---|---|
| Initial red tests, unchanged production | 20 failures / 33 cases; reproducible readiness defect |
| Final new acceptance cases | **37/37** |
| Existing Material continuity / resume / Carrier suites | **10/10 + 25/25 + 21/21** |
| New real Edge component journeys | **2/2**, unsafe evidence hides Continue; accepted selection advances once; fresh review blocks again; external traffic blocked |
| Existing portal render suite | Baseline **14/20**, final **14/20**, same six failure identities |
| Matched 135-file historical selection | Baseline **2,401/2,494**, final **2,402/2,494**; **zero added failure identities**, same 12 suite-load failures |
| Native U01–U07 | **477/478** initially; unchanged infrastructure rerun **13/13** closes sole backup timeout; **478 distinct identities passed** across runs |
| U08/U09 | **180/180**, including unchanged Firestore transport 10/10, RB1 governance 29/29, RB2 session 6/6 and browser 27/27, RB3 source/export 48/48 and browser 9/9 |
| Independent authority bundle | **148/148** inside unchanged historical selection |
| TypeScript / lint | **446 → 442**, added semantic diagnostic identities 0, removed 4; lint remains **NOT PASS**, exit 2 |
| Client/server production bundles | **PASS / PASS**, existing size/bundling warnings retained |
| Migration integrity / diff whitespace | **001–012 unchanged / PASS** |

The baseline's extra provisioning timeout passed later; no source-fix credit is
claimed. The original strict helper introduced two additional portal failures
because older rows omitted `entityType`; compatibility was restored and the
final focused/historical selection rerun without changing old assertions.

The first all-domain SQL attempt omitted three required pool URLs and had skipped
or failed fixtures; it is retained as a failed setup attempt. Correct role URLs
and a fresh uniquely named localhost PostgreSQL database were then used. Native
backup tools could not resolve their Unicode executable directory; the unchanged
13-case infrastructure suite passed via an ASCII-path alias. No timeout or test
assertion was weakened. The fixture runner dropped only databases it created.
Synthetic native tests do not activate production SQL or contact live Google.

Exact per-file results, raw reporter payloads, initial failed attempts, compiler
multisets and historical assertion identities are retained in
[verification.json](convergence-1/verification.json),
[verification-raw.json.gz](convergence-1/verification-raw.json.gz),
[compiler-delta.json](convergence-1/compiler-delta.json), and
[historical-failures.json](convergence-1/historical-failures.json).
The current JSON reporter does not expose an unhandled-error collection. Earlier
records list two; this run does not claim they are absent or resolved.

## Remaining gates and source-derived execution 2 scope

1. Reproduce and adjudicate the exact 92 historical failures, 12 load failures,
   six portal failures and 442 diagnostics. Import authority/provenance,
   activation/setup, trip transaction/offline, authentication continuity,
   generation fencing and Workspace recovery are production-relevant verification
   gates, even when inherited. A source-text assertion or incomplete mock is not
   automatically a source defect, and a repeated failure is not automatically
   harmless debt. The failure inventory groups every identity and first message.
2. Reconcile the statically reachable field-supervision process-local exception
   read with the persisted exception path used by trip commands/reports. Define
   schema, scope, authorization lifetime, offline readback and acceptance tests
   before replacing it. The standalone adjustment workflow is not statically
   reachable from the browser entry; do not invent a new financial authority.
3. Establish reporting completeness beyond the current 1,000-trip-per-project
   view bound; distinguish bounded display from full-history export. Verify
   snapshot, weight and source provenance throughout, including persisted
   exception parity. Do not manufacture full-history evidence from a hash.
4. Continue RB4 separately from its preserved nine-file checkpoint; independently
   verify actual SQL journal leases, six-resource binding/grant authority,
   provider-marker recovery and single-writer composition. This convergence does
   not close RB4 or relink resources.
5. Retain RB3's explicit source mapping/canonical-resolution UI limits, approved
   frozen export/owner evidence requirements, production keys/storage deployment,
   live Firebase/Rules/IAM, drain/device/load review and operator acceptance.

Overall U09 remains **BLOCKED** pending independent integrated review and
operational acceptance. This local convergence correction and source map are
reviewable; no full-application release or cutover certification is claimed.
No push, PR, merge, deployment, production migration, SQL activation or live
Google operation is authorized or performed.
