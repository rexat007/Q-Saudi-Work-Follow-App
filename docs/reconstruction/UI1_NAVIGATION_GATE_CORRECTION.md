# UI1 final navigation gate correction

Base: `4685999f6c77b7911e5b90c2b307f8384568a241`. Branch: `ui/ui1-trip-entry-20261113`. One additive corrective commit, authorized normal push to this same review branch only. No PR, merge, deployment, production operation or UI2 work.

## Corrected behavior

The external ROSTER request no longer sets the active layer directly. It waits for canonical loading to succeed for the exact requested project and current Wizard context generation, rechecks actor/project/role/scope, then invokes the existing `attemptProjectSetupLayerNavigation` gate. That gate now returns its existing allow/refuse outcome; its business/navigation requirements are unchanged. A local verified-context token is recorded only when the existing context-fenced canonical snapshot is applied.

Project, principal, role/scope or generation changes retire the pending request. Canonical failure or gate refusal keeps FOUNDATION and displays the existing error/navigation message. Consumption is terminal for the current request: data refresh, rerender and cloned props cannot reopen ROSTER. Manual layer navigation remains available through the existing gate.

The Wizard acknowledges the exact navigation request back to App. App clears only that same object, so retiring an old request cannot erase a newer one. This also prevents a completed request replaying after Wizard unmount/remount. App clears navigation intent when its authenticated inventory scope changes, including while the Wizard is not displayed. These are ephemeral navigation semantics, not durable Trip/Outbox intent or receipt changes.

## Exact production/test files

- `src/components/wizard/ProjectSetupWizard.tsx`: pending/retired navigation lifecycle, current-generation canonical readiness proof, shared gate invocation and exact-request consumption callback.
- `src/App.tsx`: exact-object parent consumption and authenticated-scope navigation cancellation.
- `src/tests/ui1WizardEntryGate.test.tsx`: sixteen rendered regression cases for delayed success, one-shot consumption, successful recovery without automatic reentry, denied actor/gate, project/principal/role/scope changes, new-generation verification, StrictMode, remount and newer-request protection.
- `src/tests/convergence3Journey.test.ts`: seven added assertions/actions verify leaving and revisiting the real Wizard after Manage Fleet does not reopen ROSTER, retains project identity and preserves the complete original canonical Trip/receipt/financial workflow. Existing assertions and timeouts retained.

Documentation/evidence changes are enumerated in [the exact inventory](ui1/navigation-gate-correction/changed-file-inventory.json). Original UI1 inventories and acceptance records remain historical snapshots of4685999; this correction's manifest and verification apply to the updated commit.

## Final verification

- New gate tests: **16/16 PASS**; existing native UI1 cases: **29/29 PASS**.
- Affected Wizard/UI1/navigation family: **225/227**, nine files, zero pending and **zero new failures**. The two reproduced baseline failures remain untouched: ProjectSetupLayeredWorkflow Unit2 expects the earlier updateProject argument shape; OperationalMessages registry grounding expects pricing_unregistered in its current source corpus. Exact identities and source-byte preservation are recorded in verification.json.
- `npm run verify:beta2`: **PASS**, native exit0; TypeScript0 diagnostics, lint PASS, frontend/PWA/server builds PASS, reports19/19 and release443/443.
- Real isolated CSV/Excel App journeys: **2/2 PASS**, native exit0, no unhandled errors or cleanup errors. The added post-remount assertion waits for canonical verification and checks no ROSTER heading/manual-add control is reopened. Both retain9 Trip command posts/events and273.13SAR finalized settlement; original lost-ACK, immutable receipt, duplicate prevention and Project identity assertions remain intact.
- One preceding final-source browser run stopped at Google Auth sign-in before Project creation with auth/internal-error/no popup. Public Auth script availability was probed read-only; an unchanged-source retry passed both full journeys. No timeout/assertion/auth-policy relaxation. Failed and passing raw evidence retained separately; this is an observed test precondition interruption, not claimed as a navigation PASS.
- `git diff --check`, exact staged scope and secret scan must pass before commit. Final command records include source hashes matching all four current production/test files.

[Verification and preservation](ui1/navigation-gate-correction/verification.json) includes original RB4 nine dirty files and migration013 hashes/diff, approved existing migrations001–012, closed owned emulator/PostgreSQL ports and unchanged other branch refs. Trip commands, Outbox, pricing/financial authority, authorization policy, SQL, migrations, package/build gates and UI2 are unchanged. No unrelated PostgreSQL suites or full old UI audit were repeated.

The exact corrective commit SHA and remote readback are reported after publication to avoid a self-referential commit record. Scope remains independent source review only.
