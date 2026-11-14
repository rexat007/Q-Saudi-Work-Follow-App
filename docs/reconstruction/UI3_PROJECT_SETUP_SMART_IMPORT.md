# UI3 — Project Setup, Readiness and Smart Roster Import

Bounded presentation convergence on main `7be559e06025d44341aac242fe4df488d2cc899a`, isolated branch `ui/ui3-setup-import-20261114`. Local commit only. Verification and final disposition are recorded in [verification](ui3/verification.json); every reviewed path is recorded in [inventory](ui3/changed-file-inventory.json). This record does not authorize publication, deployment, SQL activation or UI4.

## Active workflow and boundaries

`App` opens `ProjectSetupWizard`. Its active layers remain Foundation, Workspace, Materials, Carriers, Roster, Pricing, Access (when authorized) and Review/Activation. `FleetSetupWorkspace` is the Roster surface. The active seven-stage modal remains Source → Mapping → Carrier → Material → Driver/Truck → Review → Commit/Receipt. `RosterSemanticReview` presents the canonical reviewed intent; `RosterFinalReviewLayer` is a fallback. `Step7Review` has no active production caller and was deliberately left unchanged. `ProjectOperationalReadiness` and the overlay manager were inspected and left unchanged.

Setup now distinguishes location in the wizard from completion. The position count is explicitly orientation, not a readiness percentage. Three server-derived dimensions remain distinct: lifecycle, setup and operational readiness. Loading, wrong-project snapshots and unavailable canonical reads cannot produce a verified green summary. Existing canonical blocker codes and recommended actions remain authoritative. A read-only user can refresh readiness, but cannot use privileged correction actions; the panel explains the authorized handoff. Layer badges describe navigation availability; they do not infer completion from a layer index where the canonical contract provides no per-layer completion receipt. Required field corrections remain grounded in the existing forms and canonical blocker actions. The existing navigation gate, project/principal generation fencing and one-time UI1 entry intent remain unchanged.

Import now explains the current existing stage and distinguishes discovery, loading, review, blocked, original-intent submission, authoritative recovery, exact source reattachment and confirmed receipt. Merely entering Commit/Receipt never proves success. A confirmed receipt with refresh trouble remains distinguishable from an unconfirmed operation. The recovery footer labels its existing read-only original-operation lookup accurately rather than calling an uncertain result “finished.” No handler or execution path was added.

Canonical consequences, grouped identities, source row references, warnings, displacement confirmation and reviewed signature remain in the active semantic review. Material absence in the file is not fabricated into a canonical identity: existing permitted optional-source behavior and required durable project material binding are preserved. Carrier-specific Driver/Truck resolution, canonical revalidation, source fingerprint, immutable reviewed intent and original receipt recovery remain the existing contracts.

## Interaction and responsive scope

The modal has bounded independent header/body scrolling, a wrapping seven-stage indicator, contextual mapping/worksheet labels, larger local controls, isolated technical identifiers and a keyboard-focusable Fleet table region. Changes are local to UI3; there is no global font, framework or theme replacement. All 39 new strings are present in Arabic, English and Urdu. Native fixture coverage uses the actual UI3 components and unchanged production `ImportOverlay`; synthetic data is explicitly separated from connected actual-App emulator journeys. Physical devices and screen-reader certification were not performed.

`ImportOverlay` retains its existing portal levels, inert background, focus return, Escape behavior and cancellation confirmation boundaries. The native cancellation fixture waits for a distinct acknowledgment boundary before closing the workflow, matching the production asynchronous cancellation contract. It does not modify the overlay implementation or remove focus assertions.

## Authority preservation and verification interpretation

No server, command, persistence service, DTO, permission policy, financial calculation, Outbox, SQL, migration, dependency or CI file is changed. Wizard command/recovery code before the main render is identical to main after removing the two new presentation imports. Existing semantic-review acceptance/signature/displacement conditions are unchanged. Old test files are unchanged; new tests add coverage.

The exact-main baseline and candidate reports are retained, including default-timeout failures. A nonzero historical run is not reported as PASS. Interrupted emulator startup attempts are recorded separately from test results; they are not product failures or successful connected gates. The verification manifest records final counts, identities and limits. Preserved RB4 evidence includes the original nine dirty files, migration 013 and the original diff/content fingerprints. No production operation was performed.

## Final acceptance evidence

- New component/contract tests: **35/35**. Native Edge browser: **11/11**, including nine new AR/EN/UR × 390/768/1440 cases and two unchanged readiness cases.
- Actual-App connected CSV and Excel journeys: **2/2**, native exit **0**, no unhandled errors or remaining emulator listeners. Exact source rejection/reattachment, reviewed canonical decisions, one original import execution, lost ACK recovery, activation, Trip/settlement/report flows and revocation assertions passed.
- Exact-main focused baseline: **584/603**, **19 failures**. Broad candidate: **605/638**, **33 failures**. This broad run is **not PASS**. All14 additional identities passed in the unchanged three-file supplement (**53/54**); its sole failure is the matched historical Foundation expected-arguments assertion. The19 baseline identities remain visible debt: that assertion, the pricing-message registry assertion, and17 default-5-second journey timeouts. Isolated main journey evidence also remains non-green (3/18;15 timeouts). No timeouts/assertions were edited.
- Final TypeScript/lint: **0 diagnostics**. Client/PWA and server build: **PASS**, with the existing large-chunk warning. The final two-line readiness wait changed only the new connected harness; exact-final typecheck was rerun afterward. Production build inputs remained identical.
- Earlier failed prototype/harness/startup runs are retained in compressed iteration evidence. One earlier cleanup race reported an already-exited Java launcher; it left no listener. Final owned teardown completed with no errors. Synthetic component screenshots are not a claim of full-App multilingual or physical-device certification.

Decision: **GO for independent UI3 source review/local commit with documented baseline debt**. No full historical/release PASS or operational activation is claimed. UI4 is not started.
