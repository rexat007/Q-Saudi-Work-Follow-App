## CURRENT IR01 CONTROLLED CORRECTIVE PUBLICATION — 2026-11-21

UI5-IR01 is locally verified and authorized for ONE additive corrective commit and a normal fast-forward push to existing `ui/ui5-account-review-20261120` / Draft PR106, after exact seven-path preflight. Review baseline is `a38c305202a4365a293e8f54afbb4e9a7bc28c49`; corrected AdminConsoleView blob is `b978d4d37911f28db3b793aa18a7946cce6cbe4b`. The publication recheck confirms IR01 10/10, previous UI5 76/76 and PUB01 27/27 passing; affected326/329 retains the exact original three failures and remains NOT PASS. Runtime16/16 passes. Previously successful TypeScript/lint/build inputs are byte-identical; no code/test edit occurred during publication preparation.

The IR01 manifest owns the exact seven-path correction and expected complete PR inventory37. Original UI5 inventory/seals and historical316/319 evidence retain their published-baseline meaning. Original IR01 red4/10 and unchanged green10/10 assertions/raw evidence are preserved. Earlier local owner-review restrictions below are dated historical snapshots; this newer instruction authorizes controlled source publication, not merge or deployment. This document is prepared before the commit/push and does not certify a remote SHA or new CI conclusion; verify those from PR106 and the publication receipt. UI5 stays SOURCE_IMPLEMENTED / AWAITING_INDEPENDENT_REVIEW; owner merge remains HOLD. No new PR, force push, Rules/server redesign, deployment, SQL cutover, RB4/migration013 activation or UI6. All22 protected HEAD/status/dirty hashes remain preserved.

# UI5 IR-01 — Synchronous unresolved-target decision admission

## Current local owner-review gate — 2026-11-21

UI5_IR01_CORRECTED_LOCALLY_AWAITING_OWNER_REVIEW. PR106 remains Draft/HOLD on published head `a38c305202a4365a293e8f54afbb4e9a7bc28c49`. This correction is uncommitted and unpublished. No commit, push, PR mutation, merge, deployment, SQL, Rules/server redesign, RB4 or UI6 action is authorized/performed here. The published CI44699706777 success is historical evidence for a38c305, not CI acceptance of this local correction.

## Exact failure and correction

`chooseUser(target)` changes selection refs immediately but schedules outcome state. The direct suspend/reactivate handlers then call `decide` within the same event, using the previous safe-A render's `canDecide`. Thus returning to unresolved B could submit another command before B's queued outcome is rendered.

Before production editing, the new real-component/production-transport family reported6/10 PASS and4/10 FAIL. Both Suspend and Reactivate, with and without a prior state-only read, delivered2 actual loopback POSTs to B instead of1. The production file was byte-identical to the published head during that red run. Six controls verified unrelated eligible A and confirmed/rejected B outcomes.

The sole production change is a synchronous target-specific unresolved check at the shared `decide` admission boundary. It reads `uncertain.current.get(targetId)?.status` before any new operation can acquire a token or submit HTTP. No flush, delayed retry, map clearing, global hold or authorization redesign was introduced. Existing render prerequisites, permanent authorization generation/mount lease, target generation, duplicate guard, ACK/server-readback and partial/unknown semantics remain intact.

The exact same test bytes now report10/10 PASS: the returning held B issues zero additional HTTP commands, unrelated A remains usable, confirmed/rejected outcomes allow new legitimate decisions, and an explicit state-only read neither replays nor unlocks an unknown command. The network fixture deliberately drops the first B response; its socket-reset messages are preserved raw and are expected unknown-outcome evidence, not hidden failures.

## Decision-path review

- Suspend/reactivate select and decide in one event; the new central guard directly closes this race.
- Approval/rejection row events select/open a modal; confirmations also pass through the same admission guard.
- Role/project updates and driver binding both route through `decide`; their existing leases, locks, independently authoritative commands and server protections are unchanged.
- Explicit state-only review calls the existing server reader, never the command service. It does not clear the unresolved-target map or certify the unknown submission.
- The hold remains the existing review-session UI safeguard, not a new durable idempotency or canonical authorization authority.

## Verification and historical debt

Current affected suite326/329, native1, retains exactly the three published subscription-string failures. The historical316/319 NOT_PASS result is unchanged; the new10 cases are identified separately. Existing UI5 coverage76/76 and PUB01 coverage27/27 remain passing, with zero old-test/assertion edits or skips. Runtime i18n16/16, TypeScript/lint and production client/PWA/server build pass. No new confirmed source regression remains in these gates; broad aggregate is still NOT PASS.

Tests use actual AdminConsoleView and the unmocked production command service. The relative fetch URL is resolved to an owned loopback fixture and real POSTs are counted at both fetch and receiving server. Identity/read fixtures and backend responses are synthetic; no new Firebase, live-provider, physical-device or screen-reader acceptance is claimed. Published browser9/9, emulator1/1 and CI success remain historical, not relabeled as fresh IR01 results.

Exact red/green identities, native exits/timestamps, preserved failure identities, code hashes and seven-path local inventory are in [IR01 verification](ui5/ir01-verification.json); [raw evidence](ui5/ir01-raw.zip) preserves both runs, source-before/source-after, final gate logs and worktree preservation proof. Original published verification, inventory, seals and raw archives remain unchanged and describe the published a38c305 baseline; the IR01 manifest owns this unpublished delta.

All22 protected HEAD/status/dirty hashes, RB4 original nine files and unpublished migration013 remain unchanged. Server, Firestore Rules, command schema/routes, permanent leases, all pre-existing tests and historical evidence are preserved.

## Source identity and owner stop

The Git HEAD remains `a38c305202a4365a293e8f54afbb4e9a7bc28c49`; no corrected commit exists. Corrected AdminConsoleView workspace SHA256: `aa13163d08930f2bd5d5f12eeebff3c5488f814f9ef14a5332a698ca887ddb49`. Corrected source Git blob SHA1: `b978d4d37911f28db3b793aa18a7946cce6cbe4b`. These are source fingerprints, not a new commit or remote publication identity.

HOLD for owner review of the corrected source and red-to-green evidence before any commit/push. UI4 remains source-closed; UI6 not started. Operational/product/Beta2 acceptance remains separate.
