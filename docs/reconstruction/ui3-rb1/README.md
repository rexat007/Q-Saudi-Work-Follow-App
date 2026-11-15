# UI3-RB1 — Failure causality and evidence repair

Decision: **GO_FOR_INDEPENDENT_REVIEW_WITH_BOUNDED_DIFFERENTIAL_AND_CAUSAL_UNCERTAINTY**. Documentation/evidence only; local corrective commit, no publication. This is neither an aggregate suite PASS nor a claim that all original failures were transient. No new source regression is confirmed. Historical causal uncertainty remains explicit.

## Frozen inputs and exact sets

UI3 source pin: `90d115f09ed9b7af7bee1998903a179d2b23d2b5`; exact main: `7be559e06025d44341aac242fe4df488d2cc899a`. The requested external pre-publication JSON existed, was read, and contains34 distinct union identities. Its path and SHA256, all10 original compressed evidence hashes, and available original stdout hashes are in [frozen inputs](frozen-inputs.json). [Prior reconciliation](prior-prepublication-reconciliation.json.gz) preserves its bytes. Original compressed reports remain unchanged in `../ui3/`; original external logs are retained byte-for-byte as base64 in [historical stdout](historical-stdout.json.gz). The original full baseline stdout was not preserved by the earlier interrupted executor; its committed603-test JSON remains authoritative. Do not reconstruct or invent missing baseline stdout.

| Set | Exact identities |
| --- | ---: |
| Original baseline failures | 19 |
| Original candidate failures | 33 |
| Shared failed identities | 18 |
| Candidate-only failures | 15 |
| Baseline-only failures | 1 |
| Union | 34 |

The counting root cause is proven: **33−19=14 is a net count increase**, not the cardinality of candidate-only failures. One baseline failure passed candidate, so **33=18+15**, **19=18+1**, **union=18+15+1**. The old list already contained15; summaries incorrectly stated14.

The baseline-only identity is `smartImportJourneyAssurance.test.tsx` → `failed cancellation preserves the session and offers exact-command retry before clearing`: original baseline5000ms timeout, original candidatePASS, absent from the supplement and new pair. No fix/cause claim is made.

[Reconciliation](reconciliation.json) enumerates all34 identities once, exact18 shared,15 additional and1 baseline-only sets, source declarations/blobs, observed errors, first stack/failure-site frames, supplementary and paired statuses, classifications and evidence strength. A runner timeout stack is not evidence of which awaited operation caused the deadline.

## The15 additional failures

| Family | Identities | Original errors | UI3 supplement | Paired main / UI3 |
| --- | --- | --- | --- | --- |
| projectSetupLayeredWorkflow | B,D,J,K,L,N,Q,R,S (9) | B/D:5000ms deadlines; J/K/L/N:missing expected content/control; Q/R:undefined-control TypeErrors; S:draft-value assertion | All9 PASS | All9 PASS / All9 PASS |
| setupWizardContinuity | canonical Material/reset; successful intake/refresh retry; double-submit; displacement confirmation; unreliable preview (5) | First4:5000ms deadlines; unreliable-preview case:manual-add control absent | All5 PASS | All5 PASS / All5 PASS |
| smartImportOverlayAssurance | group pagination limits DOM rows, preserves full progress/readiness and reaches the final group (1) | 5000ms deadline | PASS | PASS / PASS |

Thus7 were timeout-based and8 were assertion/TypeError-based. Every exact title and source location is in the machine-readable record; these are observations, not15 independently diagnosed defects.

## Shared mechanisms investigated

- **Root/subscription cleanup:** `projectSetupLayeredWorkflow.test.tsx:165–175` removes the container/body and restores spies in afterEach, but does not own/unmount each test's root there. Individual tests call `root.unmount()` only at their successful end; an earlier assertion/timeout bypasses that call. This is a demonstrated teardown gap shared with main, not a demonstrated cause of the15. The inherited O assertion also bypasses cleanup in both new arms, yet Q/R/S pass both: the gap alone is not a sufficient explanation. `setupWizardContinuity:29` and `smartImportOverlayAssurance:45` explicitly unmount in afterEach. Mock subscriptions return no-op unsubscribe functions; there is no trace proving an actual subscription leak caused a failure.
- **Mocks and async scheduling:** layered tests restore spies but have no per-test reset of every module mock; continuity resets canonical fixtures and clears/restores mocks/globals; overlay restores spies. React act/readiness timing can affect which view/control is observed. Existing stdout contains act-environment warnings even in passing supplementary/paired cases. Duplicate-root warnings in the broad log are attributed to Smart Import Journey, a different file; they do not prove contamination of the three affected files. No pending-operation trace or mock-call lifetime trace exists for the original failures. These remain hypotheses.
- **Ordering and concurrency:** original broad runner explicitly used `--maxWorkers=1 --no-file-parallelism`; do not claim its test files were running concurrently. Installed Vitest BaseSequencer can use cached failure/duration statistics to order files; original sequencer cache state was not frozen. The bounded pair removes cross-file ordering ambiguity by one fresh invocation per file, in the same explicit order on both pins. It does not reconstruct the original25-file context.
- **Resource contention:** preserved Firestore emulator logs show external emulator activity during the broad candidate interval (including a22:49:05 emulator start before the layered-file interval22:49:38–22:50:25, Riyadh). [Historical observations](historical-environment-observations.json.gz) retain bytes/hashes/timestamps. Activity overlap is not CPU/memory starvation proof. No original resource telemetry exists. The new pair records host CPU counters and free-memory samples, but those cannot retrospectively establish an environmental cause. **CONFIRMED_ENVIRONMENT_CAUSE is assigned to no identity.**
- **Production relationship:** the two Wizard families mount modified presentation roots, so rendering/scheduling effects cannot be excluded merely because command handlers are unchanged. Wizard code before its main render is unchanged except two UI imports; old tests/config/lock are identical across pins. The pagination test's conservative relative-import closure under declared mocks reaches zero modified UI3 production roots; mounted carrier resolution, pagination and overlay implementations are unchanged. [Static closure evidence](source-relationship.json.gz) and its executed [analysis script](source-relationship.mjs) are preserved. This is not dynamic runtime profiling; unused type imports can overapproximate reachability.

No single common causal mechanism is proven. In particular S's original draft assertion must not be dismissed as timing simply because another test timed out earlier.

## One controlled paired assessment

Exactly one54-test-per-arm assessment was executed, main first then pinned UI3. No repeats, sleeps, enlarged timeouts, skipped assertions, configuration edits or warning suppression. Each arm runs these unchanged files in order, each in a separate Vitest invocation: layered workflow, continuity, overlay. Per-file test declaration order is unchanged. Both roots were clean at startup and finish; main is an isolated detached worktree, not an altered main branch.

Same physical node_modules junction, package/lock/config/test SHA256s, Node22.22.0 executable/hash, process environment object/hash, and worker flags were verified. Versions: Vitest5.0.3, happy-dom20.14.5, React/ReactDOM19.3.0, Vite6.4.4, esbuild0.25.12, TypeScript5.8.3. Commands, native exits, timing and host telemetry: [paired manifest](paired-manifest.json). Exact executed [runner](run-pair.mjs), [raw JSON reports](paired-results.json.gz), and [raw stdout/stderr](paired-stdout.json.gz) are retained. No other test/build/emulator jobs were launched during the pair; unrelated host work was not controlled.

| File | Main result / exit | UI3 result / exit | Launcher wall seconds main / UI3 |
| --- | --- | --- | --- |
| Layered workflow | 17/18; exit1 | 17/18; exit1 | 59.73 / 17.39 |
| Continuity | 10/10; exit0 | 10/10; exit0 | 12.65 / 14.46 |
| Overlay | 26/26; exit0 | 26/26; exit0 | 7.54 / 9.59 |
| Total | **53/54, NOT PASS** | **53/54, NOT PASS** | — |

The shared remaining failure is O, `Save validates draft, issues updateProject exactly ONCE, and exits edit mode`, at test line618. Original baseline, original supplement and both paired arms have the same argument-assertion message before stack paths: test expects a three-argument updateProject call; canonical handler supplies the fourth `expectedVersion=0`. Test blob and handler are unchanged. This is **REPRODUCED_ON_BASELINE**, not a new UI3 source regression. The original broad candidate O failed earlier accessing a missing control (`disabled`); that different failure form remains separately recorded and is not equated with the argument assertion.

Baseline ran first and had longer cold startup; cache warmth and host load differ. Recorded free memory ranged roughly7.3–8.3GiB; host CPU activity varied. This one pair is not a benchmark, statistical reliability study or reproduction of historical resource pressure. It establishes no candidate-only failure in this bounded contrast; it does not establish a precise upstream cause for the original15.

## Labels, acceptance and preservation

All15 candidate-only identities: **NOT_REPRODUCED** in the supplement and bounded pair, with historical cause **CAUSE_UNRESOLVED**. Shared18 identities: **REPRODUCED_ON_BASELINE** in original evidence, with the new pair reproducing only Foundation because the other17 shared cases were outside scope. No **CONFIRMED_SOURCE_REGRESSION** or **CONFIRMED_ENVIRONMENT_CAUSE** is assigned. Baseline-only1 is NOT_REPRODUCED in the original candidate, not claimed fixed. Reproduction status and causal conclusion are separate fields.

Review acceptance rests on internally consistent evidence, preserved35/35 passing new-test evidence and unchanged source hashes, and the bounded differential assessment required by UI3-RB1—not on declaring an environmental root cause. All original605/638 and53/54 outcomes remain non-green. Original broad failures are not replaced by paired results. The missing historical operation/resource traces, original cache/order context and absence of counterbalanced repetition remain explicit uncertainty.

Only four existing derived documentation records are corrected; a separate additive inventory covers this repair. The original36-file UI3 inventory remains scoped to90d115f. No production file, test, command, permission, financial, Outbox, SQL, migration, dependency or CI policy changed. Original raw evidence hashes, other worktrees, RB4 nine dirty files and migration013 are verified before local commit. No new broad run,35-test rerun, typecheck/build, production operation, push, PR, merge, deployment or UI4 was performed for this documentation-only unit.
