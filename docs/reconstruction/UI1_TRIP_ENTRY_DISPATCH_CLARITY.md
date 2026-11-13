# UI1 — Trip Entry, Navigation Context, Dispatch Blockers & Confirmation

Status: **SOURCE_IMPLEMENTED_VERIFIED — GO_FOR_INDEPENDENT_REVIEW, LOCAL_ONLY**. UI2–UI6 not started. This is a bounded UI acceptance decision, not an unqualified all-historical-tests release PASS or production deployment approval.

## Starting point and scope

Starting main: `653655d1e332559055d6928721026896320ab0ae`. Implementation branch: `ui/ui1-trip-entry-20261113`. Created from verified main in a separate worktree; existing rehearsal/convergence and unfinished U09/RB4 workspaces preserved. One local commit follows final staged-scope verification. Its exact SHA and clean-worktree verification are returned in the executor's final report, not embedded self-referentially in this commit.

Ten production/UI/locale files and five test/fixture files comprise the implementation. Exact paths and hashes are in [the changed-file inventory](ui1/changed-file-inventory.json). No domain service, repository, authorization policy, canonical command, financial authority, schema, SQL runtime, migration, package/build gate, global CSS or font dependency changed.

## Behavior and interfaces

- `App` routes Open Project Operations through the existing FIELD_OPERATIONS authorization and exact canonical inventory project. It never substitutes a different project when resolving the requested navigation target. The active-project entry in the Wizard is available on revisits and remains disabled during unverified/loading/error states. Activation still calls its existing server endpoint and coherent canonical refresh; no optimistic ACTIVE state was added.
- Fleet navigation carries project ID, current actor ID and ROSTER layer intent into the existing Wizard. Its scope fencing and existing setup/role controls remain in place. A separate New Project navigation target intentionally clears selection. Roles without fleet management permission receive an administrator handoff instead of a privileged control.
- Configured projects show Project Trips & Dispatch and a separately rendered authorized supervision view. Nonconfigured stations retain existing composition; driver-only routing remains exclusive. Loading/unloading actions remain the existing profile/role-controlled commands inside Continue an Existing Trip. No parallel Trip engine or UI2 timeline was implemented.
- New Trip distinguishes project lifecycle/configuration, role/scope, fleet/pricing/journal loading, denied reads, failed reads, empty fleet, missing selection/associations/required driver, ineligible rows, missing or ambiguous pricing, and pending durable intent. Existing read-model names/plates are primary; canonical IDs remain secondary LTR-isolated values. Unusable rows stay visible with reasons.
- The pricing subscription API intentionally folds read errors into an empty array. UI1 uses the repository's existing error-reporting `listByProject` API plus its existing pricing-rules-updated event, to avoid claiming a failed read means missing pricing. PricingService/canonicalPricingRule still resolve the exact applicable rule; no fallback financial authority was added.
- Every submission goes through unchanged durableTripCommand. A synchronous UI submission fence complements the existing atomic Outbox identity contract. Pending operations pause new dispatch; recovery receives the exact captured original operation and principal. Safe typed authorization/revision/intent-conflict errors are explained; no private exception details are rendered.
- Confirmation is derived from canonical acknowledged data: actual Trip number or explicitly labelled canonical ID, truck/driver context, current status and Continue Trip. No synthetic identifier or optimistic success. Scope remounts and in-flight callback fences prevent previous principal/project responses from painting current controls. Older command acknowledgments do not downgrade a newer displayed Trip revision.
- UI1 uses the existing dark shell, readable field labels, focus rings, minimum44px controls, responsive groups and a narrow shared notice/action style. Exact-label browser tests discovered that a wrapping select label included option text; the final markup uses separate explicit label/for/id association. No global style or font rewrite.

## Acceptance coverage

| Requirement | Evidence |
|---|---|
| Canonical ACTIVE project → authorized Operations, exact ID | ui1TripEntry native tests + connected CSV/Excel actual App clicks |
| Unauthorized navigation blocked | native role/scope tests; unchanged server/activation authority release suites |
| Fleet retains project and opens ROSTER | native navigation target + connected actual Manage Fleet and selected-project assertions |
| New Project intentionally clears selection | native explicit navigation-target contract; App consumes that target separately |
| Truthful tabs, driver routing and role restrictions | native rendered FieldOperations tests + existing role/field regression gates |
| Selection, carrier, material, driver, ineligible row and pricing blockers | native positive/negative tests + all-locale exact-label browser cases |
| Loading/unavailable differs from empty | native deferred/rejected/empty reads and separate pricing-error fixture |
| Pending intent blocks conflicting dispatch | native pending operation test + real Outbox/cross-tab recovery regressions |
| Lost ACK recovers original intent | native exact-envelope tests, synthetic presentation browser, real connected canonical HTTP/Outbox journeys |
| Confirmation uses canonical acknowledgment only | native delayed ACK/double-click/unsafe error cases; connected server Trip/receipt checks |
| Project/principal switch fences stale data | native deferred command/read responses and principal switch tests |
| Driver/read-only roles gain no dispatch authority | native rendered role cases and unchanged authority suites |

## Final verification

| Gate | Result |
|---|---|
| New focused native UI1 cases | **29/29 PASS** |
| Complete directly affected family | **474/476**, zero pending; exactly2 baseline-reproduced failures, **0 new failures** |
| Existing full main npm test sequence | **546/546**, all48 commands, native exit0 |
| Existing main verify:beta2 | **PASS**, native exit0: TypeScript0 diagnostics, lint0, frontend/PWA/server builds, reports19/19 and release443/443 |
| Existing connected emulator/browser/PWA family | **31/31**, seven files, exit0, no unhandled/cleanup errors, owned listeners closed |
| New actual Edge presentation matrix | **9/9**, AR/EN/UR ×390/768/1440px, no pending or horizontal overflow; keyboard focus and activation/recovery controls verified |
| UI1 locale parity | **54 keys per locale**, no gaps, duplicates or empty values |
| Final source identity | All15 UI/locale/test hashes match final focused/release/npm/browser command records |
| Whitespace and staged inventory | Required to pass before the single local commit; no assertion/config relaxation |

Evidence and exact command/exit/source-hash records are in [verification-summary.json](ui1/verification-summary.json), [final-source-identity.json](ui1/final-source-identity.json), compressed raw run outputs, [matched baseline identities](ui1/matched-historical-failures.json), and [screenshots](ui1/browser/ar-390.png).

The nine locale/viewport cases use isolated synthetic presentation adapters and forbid outside network requests. They do not replace canonical integration proof. The separate connected CSV/Excel journeys use the real App, Firebase Auth/Firestore emulators, canonical server commands, Outbox and receipt recovery. Google providers are controlled test boundaries, not live Google operations. Both retain9 command posts/events before final recovery,3 receipt lookups and273.13SAR finalized settlement; CSV report1002 trips and Excel1. Actual main navigation after activation and fleet repair preserve the same project. No production Firebase, Google or PostgreSQL operations were performed.

Physical mobile/tablet devices and screen-reader certification: **NOT_PERFORMED**. Browser viewport/keyboard acceptance is not a claim of full production/device usability certification. Final captures were inspected for the new operational surface; broader typography and all legacy screens remain outside UI1.

## Historical debt and retained diagnostics

The two untouched baseline failures are:

1. `projectSetupLayeredWorkflow.test.tsx` — `O. Unit 2: Save validates draft, issues updateProject exactly ONCE, and exits edit mode`: expects the older updateProject argument list; actual includes expectedVersion. Reproduced on the unchanged same-tree main baseline.
2. `operationalMessages.test.ts` — registry literal/source-grounding assertion: `operations.service.state.pricing_unregistered` is not present in its current source corpus. Reproduced on unchanged main; UI1 modifies none of that corpus.

Neither assertion was changed, skipped or relabelled PASS. Exact identities and native exit1 records are retained. Thus full historical certification is not claimed despite passing main's defined npm/release gates.

Initial draft type errors, a sandboxed esbuild startup failure, initial browser timing/label failures, and filtered one-case diagnostics are retained separately. Filtered diagnostics selected one case only and are not acceptance gates. Final full browser selection runs all9 with0 pending. The new composite browser test has a30s per-case budget and5s locator waits because starting Edge plus multiple interactions exceeds Vitest's default5s whole-test budget; assertions remain strict. Final tests contain no skip/only/todo additions.

The only existing test changes are consumer fixture alignment and stronger workflow checks: operationalProfileUi uses the existing pricing read API, an ACTIVE dispatch fixture, and verifies a driverless row stays visible while dispatch remains blocked; its canonical null-driver send assertion is retained. The real journey uses the new heading, adds canonical activation/fleet navigation assertions, and writes to UI1-owned output paths. Other historical tests and all package gates remain unchanged.

Generated Block89 timestamp/date-only report churn was proven semantically unchanged, archived, and restored to the original tracked content. No implementation was discarded. [Preservation proof](ui1/preservation-and-contracts.json) verifies original workspaces/refs and approved migration states: main001–010, existing convergence/U09001–012, and original unfinished RB4 migration013. No migration inventory assertion changed.

## Remaining UI2 items and publication boundary

UI2 owns the complete profile-aware timeline/next-action hierarchy, driver-association UX beyond the existing canonical-ID workflow, broader loading/unloading/driver station convergence and richer weighing control presentation. UI3–UI6 and the overall UI audit roadmap remain separate. No new provider, domain state machine or business authority is authorized by these follow-ups.

UI1 is ready for independent review as a local bounded commit with inherited debt explicitly retained. Publication, PR, merge, deployment and operational acceptance require separate owner authorization. Overall SQL/U09/RB4 completion and cutover remain excluded.


## Final navigation gate correction

The original source/evidence above describes commit4685999. Independent review identified that its external ROSTER effect bypassed the shared readiness/layer gate. The additive [navigation correction](UI1_NAVIGATION_GATE_CORRECTION.md) now supersedes that path: canonical current-generation readiness, one shared gate, scope invalidation and parent-consumed one-shot requests across remounts. New tests16/16; affected225/227 with the same2 untouched baseline failures; beta2/build/typecheck PASS; real CSV/Excel journeys2/2 including no ROSTER reopening after revisit. No domain, authorization policy, SQL, migration, Outbox or UI2 changes.
