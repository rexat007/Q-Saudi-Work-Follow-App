# Q-SAUDI WORK FOLLOW — CURRENT CONVERSATION HANDOFF
## Reconstruction continuation snapshot — 2026-10-28

> This is the current conversation handoff for continuation after the previous ChatGPT thread reached its message limit.
> Current-state authority remains `docs/reconstruction/02_PHASE_LEDGER.md`. GitHub `main` is code truth.

---

## 1. Repository authority

- Repository: `rexat007/Q-Saudi-Work-Follow-App`
- Authoritative branch: `main`
- Current independently verified main: `1f7f3344e65dfc9b6837b10cb5349827da1587eb`
- Latest merge: PR #58 — `feat(import): execute reviewed roster intent atomically`
- P8-B2 implementation commit: `6b56d2def2f02aae1d60b5a7d3352210cc584931`
- PR #58 merge/current main: `1f7f3344e65dfc9b6837b10cb5349827da1587eb`

Never infer current code from an old handoff, Google AI Studio workspace, local draft, report or chat message when GitHub `main` can be inspected.

---

## 2. Required operating method

Use the repository's streamlined reconstruction method:

```text
broad area review when needed
→ bounded coherent batch
→ implementation
→ focused verification
→ owner review
→ push / PR
→ owner manual merge
→ independent post-merge GitHub verification
→ next batch
```

Standing rules:

- GitHub `main` is source of truth.
- Owner merges manually.
- Never conflate IMPLEMENTED, VERIFIED, MERGED and ACCEPTED.
- Do not reopen closed work without a concrete regression.
- Do not create a second canonical authority to solve a local convenience problem.
- Do not ask Google AI Studio to read GitHub without direct internet/raw URLs.
- High-risk persistence/auth/tenant/commit work requires stronger verification.
- Tests/build are necessary but not sufficient; inspect relevant source and runtime behavior.
- Preserve exact Project isolation.
- Do not silently broaden a bounded batch.

---

## 3. Current phase state

```text
PHASE 7 — SMART IMPORT CORE
SOURCE CLOSED

SMART IMPORT MASTER DESIGN REVIEW
COMPLETE

SI-CG1 — Identity, Grouping & Provenance Correction
MERGED / SOURCE VERIFIED / CLOSED

SI-CG2 — Layer & Contextual Creation Convergence
MERGED / SOURCE VERIFIED / CLOSED

PRE-PHASE-8 CORRECTION GATE
CLOSED

PHASE 8 — Smart Import Persistence, Resume & Commit Integrity
IN PROGRESS

P8-B1 — Durable Session & Reviewed Intent Authority
MERGED / SOURCE VERIFIED / CLOSED

P8-B2 — Server Commit Authority & Prepared Identity Materialization
MERGED / SOURCE VERIFIED / CLOSED

P8-B3 — Durable Execution Journal & Recovery
NOT STARTED
```

Next action:

`P8_B3_BOUNDED_IMPLEMENTATION_DEFINITION`

---

## 4. Why Smart Import was re-reviewed before Phase 8

The project had an older Smart Import concept and implementation history that exposed serious failures. Reconstruction was partly triggered by those failures.

Before Phase 8, the owner required a complete review of project documents, historical Smart Import plans, current source, tests and prior failures.

The accepted product definition is:

> **Smart Import is External Source → Human-Reviewed Canonical Intent → Canonical Commit.**

It is not merely an Excel importer.

Excel, CSV and Google Sheets are source adapters. They must converge on canonical business intent rather than become separate business authorities.

---

## 5. Binding Smart Import user-experience principle

```text
1000 source rows ≠ 1000 human decisions
```

If hundreds of rows refer to a small number of unique identities/relationship problems, the user should solve those unique problems once and propagate the decision safely.

Only genuinely row-specific exceptions should remain at row level.

---

## 6. Binding layered workflow

```text
SOURCE
→ DISCOVERY
→ MAPPING APPROVAL
→ NORMALIZATION
→ CARRIER IDENTITY / PROJECT PARTICIPATION
→ MATERIAL IDENTITY / PROJECT PARTICIPATION when applicable
→ DRIVER / TRUCK IDENTITY
→ DRIVER / TRUCK PROJECT PARTICIPATION
→ DRIVER / TRUCK CARRIER AFFILIATION
→ CROSS-ROW CANONICAL RELATIONSHIP INTENT
→ TRUE ROW EXCEPTIONS
→ SEMANTIC FINAL REVIEW
→ DURABLE REVIEWED INTENT
→ SERVER COMMIT AUTHORITY
→ CANONICAL REFRESH / PROOF
→ RESULT / RECOVERY
```

Do not force downstream relationship decisions before upstream identity/participation context is resolved.

---

## 7. Historical Smart Import failure lessons — must not return

The following patterns are prohibited:

- row-by-row human review when one unique entity/group decision should propagate;
- fuzzy match becoming canonical identity authority;
- same/similar name being treated as identity proof;
- first-candidate / first-Material / default-Carrier / GENERAL-Material fallbacks;
- entity creation or mutation hidden inside automatic resolution;
- UI progression before durable checkpoint acknowledgment;
- workflow continuing after durable session creation failed;
- local cancel/reset before durable cancel acknowledgment;
- fabricated resume state;
- checkpoint/resume/cancel inconsistencies;
- ambiguous partial failures and blind retries;
- multiple competing authorities between source, fuzzy match, local entities and commit;
- reinterpreting raw rows after the user reviewed semantic canonical intent.

---

## 8. SI-CG1 accepted corrections

SI-CG1 established:

- Carrier grouping: natural registration identity → canonical ID → name-only review grouping.
- Material grouping: Material code → canonical ID → name-only review grouping.
- Driver grouping: natural identity → canonical ID → name-only review grouping with Carrier context.
- Truck grouping: normalized plate → canonical ID.
- different natural identities cannot collapse because names match;
- rejected rows remain provenance but do not participate in active semantic groups;
- exact natural identity outranks name/fuzzy evidence;
- duplicate canonical natural identity fails closed;
- Material is not globally mandatory for roster participation;
- absence of Material does not invent allocation/default/CLOSE;
- internal row number and physical source row are separate facts;
- source provenance flows into semantic review and canonical intent.

Do not reopen SI-CG1 without a demonstrated regression.

---

## 9. SI-CG2 accepted corrections

SI-CG2 established:

- contextual missing-entity handling stays inside the Smart Import journey;
- Carrier/Material contextual creation reuses canonical editors/capabilities;
- Driver/Truck identity editing uses shared canonical UI/validation capability;
- import-only duplicate creation form was retired;
- Create, Enroll, Reactivate Membership, Set Affiliation and Reactivate Affiliation are distinct actions;
- Create cannot be used to escape ambiguity or canonical integrity corruption;
- existing Global identity is reused/enrolled/reactivated rather than duplicated;
- contextual creation does not execute temporal Driver↔Truck assignment or Truck↔Material allocation;
- mutation success + refresh failure retains receipt and retries refresh only;
- Project-A late callbacks cannot mutate Project B;
- PREPARED_NEW remains distinct from immediate canonical creation.

Binding architecture:

> Smart Import may invoke canonical capabilities contextually, but it must never become a second Master Data system.

---

## 10. P8-B1 — closed durable-session authority

P8-B1 merged through PR #57 at:

`4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`

It established:

- schema-v2 durable import sessions;
- `ImportSessionServerService` as active durable session authority;
- server-authoritative lifecycle transition validation;
- stable Project / Session / Operation / Batch identity;
- optimistic `expectedVersion` fencing;
- source revision;
- mapping revision;
- first-class durable `reviewedCanonicalIntent`;
- approval binding to Project + Session + Operation + Batch + source revision + mapping revision + semantic signature;
- warning/displacement approval binding;
- safe local-file reattach;
- no persistence of File/Blob/raw source bytes;
- legacy sessions restore to earliest provably safe stage;
- large-session artifact chunking rather than one unbounded Firestore document;
- staged immutable chunks + manifest/digest publication;
- header does not advance on incomplete/stale artifact;
- server CANCELLED acknowledgment before local durable-session reset.

Important recovery history:

The initial P8-B1 draft introduced 86 new regressions. It was NOT published. Recovery classified and eliminated all 86 new failures before publication.

Accepted P8-B1 verification:
- baseline 525/539;
- recovered 574/580;
- new failures 0;
- new P8-B1 tests 41/41;
- Build PASS;
- diagnostics 441→440, added 0;
- lint EXIT 2 remains historical;
- controlled browser 13/13;
- no live Firebase acceptance claimed.

---

## 11. P8-B2 — closed reviewed-intent commit authority

P8-B2 implementation:

`6b56d2def2f02aae1d60b5a7d3352210cc584931`

Merged via PR #58:

`1f7f3344e65dfc9b6837b10cb5349827da1587eb`

Dedicated route:

`POST /api/projects/:projectId/import-sessions/:importSessionId/commit-reviewed-intent`

P8-B2 establishes the first server execution authority for a durable reviewed roster intent.

The commit path:

1. loads the durable schema-v2 ROSTER session;
2. requires `INTENT_REVIEWED` or exact committed retry;
3. validates expected version and durable bindings;
4. hydrates the stored reviewed intent;
5. loads current canonical Project Fleet context;
6. rebuilds canonical intent from current canonical state;
7. compares the rebuilt intent exactly with the accepted reviewed intent;
8. fails with `REVIEWED_INTENT_STALE` if semantics changed;
9. safely materializes PREPARED_NEW Driver/Truck identities;
10. reuses existing participation and temporal authorities;
11. writes the exact approved consequences plus session COMMITTED truth, receipt and audit inside one bounded Firestore transaction;
12. performs post-commit canonical refresh/proof.

---

## 12. PREPARED_NEW execution contract

P8-B2 materializes only reviewed PREPARED_NEW Driver/Truck plans.

It:

- normalizes natural identity;
- re-resolves current natural identity;
- reuses a compatible concurrent identity if it now exists;
- fails closed on incompatible or duplicate identity;
- creates one canonical identity only when required;
- writes natural-identity reservation;
- enrolls Project membership;
- establishes reviewed Carrier affiliation;
- stores prepared-local-key → canonical-ID mapping in the commit receipt.

Do not introduce another identity-creation policy in P8-B3.

---

## 13. Participation and temporal authority reuse

P8-B2 reuses existing canonical authorities.

Participation:
- `planMembership`
- `planAffiliation`
- `protectAffiliationAssignment`
- `writeParticipationPlan`

Temporal:
- `planAssignment`
- `planAllocation`
- `writeTemporalClosures`
- `writeTemporalPlan`

P8-B3 must continue using the same policy authorities.

The orchestration layer may coordinate execution/recovery; it does not own alternative business rules.

---

## 14. Exact reviewed temporal semantics

P8-B2 proves:

- NO_CHANGE → no temporal mutation;
- ASSIGN executes only if no displacement exists;
- REASSIGN requires the exact reviewed displaced assignment;
- ALLOCATE executes only if no prior allocation exists;
- REALLOCATE requires the exact reviewed displaced allocation;
- reviewed swaps may release displaced slots before writing replacement slots;
- a changed current relationship causes stale review rather than silent semantic promotion.

Never silently convert ASSIGN → REASSIGN or ALLOCATE → REALLOCATE.

---

## 15. Current atomic commit boundary

P8-B2 intentionally uses one bounded Firestore transaction.

Current preflight bounds:

- maximum write plan: 400;
- maximum planned payload: 8 MB.

If the reviewed semantic plan exceeds the atomic boundary:

`IMPORT_COMMIT_TOO_LARGE_FOR_ATOMIC_EXECUTION`

must occur before first business mutation.

This is not a partial commit.

Repeated source rows may still fit because semantic consequences deduplicate.

---

## 16. Commit receipt / exact retry

P8-B2 writes `ReviewedRosterCommitReceipt`, including:

- Project / Session / Operation / Batch;
- source revision;
- mapping revision;
- reviewed signature digest;
- request and committed versions;
- actor/time;
- prepared identity mapping;
- canonical result summary.

If session is already COMMITTED:

- exact retry returns the existing receipt;
- mismatched retry fails;
- business writes are not replayed.

This exact-retry behavior must not be weakened by P8-B3.

---

## 17. Canonical refresh after commit

Durable commit truth exists before post-transaction refresh.

If refresh succeeds:

`canonicalRefresh = VERIFIED`

If refresh fails:

```text
canonicalRefresh = PENDING
code = COMMIT_SUCCEEDED_CANONICAL_REFRESH_PENDING
```

The business transaction must NOT be retried merely because refresh/proof failed.

---

## 18. Legacy raw-row fence — mandatory

The historical `DriverTruckImportCommitter` still throws:

`PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`

when canonical reviewed context is present.

This is intentional.

Normal session PATCH also cannot set a roster session directly to committed truth.

P8-B3 must not remove these fences as a shortcut.

---

## 19. P8-B2 verification state

Reported and independently source-checked:

- baseline focused: 722/726;
- final focused: 772/776;
- P8-B2 new tests: 50/50 PASS;
- new failures: 0;
- deleted/skipped tests: 0;
- Build: PASS;
- diagnostics: 440→440, added 0;
- lint: EXIT 2 / NOT PASS historical debt;
- controlled browser: 4/4;
- `git diff --check`: PASS.

Remaining focused failures are historical C5 cases:

`38, 61, 62, 67`

No live Firebase acceptance is claimed.

---

## 20. Active next unit — P8-B3

**P8-B3 — Durable Execution Journal & Recovery**

Status:

`NOT_STARTED`

P8-B3 exists because P8-B2 deliberately supports only one bounded atomic execution.

P8-B3 must design recovery for semantic commits that cannot or should not fit that single transaction, while preserving exact-reviewed-intent authority.

At minimum the next batch must reason about:

- durable operation/execution identity;
- per-consequence or bounded-step journal;
- execution receipts;
- safe retry after process/network interruption;
- recovery when a step completed but response was lost;
- resume without replaying completed consequences;
- explicit partial-progress state;
- fencing concurrent executors;
- deterministic ordering/dependency handling;
- transition from reviewed intent into execution and recovery;
- post-execution canonical proof;
- no semantic reinterpretation during recovery.

Do not assume the precise implementation shape before auditing current P8-B2 transaction and existing repository idempotency/recovery primitives.

---

## 21. P8-B3 non-negotiable invariants

P8-B3 MUST NOT:

- make raw rows commit authority;
- rebuild a different semantic target after execution begins;
- weaken Project/Session/Operation/Batch/source/mapping/signature binding;
- create a second identity/membership/affiliation/temporal policy;
- replay a completed canonical mutation after lost response;
- treat canonical refresh failure as commit failure;
- allow two concurrent executors to diverge;
- overwrite P8-B2 exact-retry receipt semantics;
- silently broaden reviewed consequences;
- auto-create or auto-reassign entities based on fuzzy/name evidence.

P8-B3 MUST preserve:

`External Source → Human-Reviewed Canonical Intent → Canonical Commit`

---

## 22. Current known debt relevant to continuation

- TypeScript diagnostic baseline: **440**.
- Lint: **EXIT 2 / NOT PASS** historical debt.
- Focused C5 failures: **38, 61, 62, 67** are historical and must not be reclassified as new P8-B3 regressions without evidence.
- P8-B1/P8-B2 live Firebase acceptance: NOT CLAIMED.
- Full Roster Google Sheets core convergence is not completed by SI-CG2/P8-B1/P8-B2; do not accidentally claim it.
- Historical `importSession.test.ts` no-suite note remains separate debt unless current main proves otherwise.

---

## 23. First action in the new conversation

Do NOT immediately implement P8-B3 from memory.

First:

1. verify GitHub `main` equals or descends from `1f7f3344e65dfc9b6837b10cb5349827da1587eb`;
2. read this handoff and `02_PHASE_LEDGER.md`;
3. inspect the current P8-B2 commit authority and existing idempotency/outbox/recovery primitives;
4. define the smallest coherent P8-B3 design;
5. ensure the design preserves P8-B1 durable-session authority and P8-B2 exact reviewed-intent authority;
6. only then issue the bounded implementation prompt.

---

## 24. New-chat continuation prompt

Copy/paste this into the new conversation if needed:

```text
We are continuing Q-Saudi Work Follow — Reconstruction.

Repository:
rexat007/Q-Saudi-Work-Follow-App

GitHub main is the sole source of code truth.

Read first:
- docs/reconstruction/00_WORK_START_HERE.md
- docs/reconstruction/02_PHASE_LEDGER.md
- docs/reconstruction/05_DECISION_AND_DEBT_LOG.md
- docs/reconstruction/MASTER_PROJECT_HANDOFF.md
- docs/reconstruction/CURRENT_CONVERSATION_HANDOFF_2026-10-28.md

Expected verified continuation baseline:
1f7f3344e65dfc9b6837b10cb5349827da1587eb

Latest accepted unit:
P8-B2 — Server Commit Authority & Prepared Identity Materialization
PR #58
Implementation: 6b56d2def2f02aae1d60b5a7d3352210cc584931
Verified merge/main: 1f7f3344e65dfc9b6837b10cb5349827da1587eb

Current status:
P8-B1 — MERGED / SOURCE VERIFIED / CLOSED
P8-B2 — MERGED / SOURCE VERIFIED / CLOSED
P8-B3 — Durable Execution Journal & Recovery — NOT STARTED

Before writing a P8-B3 implementation prompt:
1. independently verify current GitHub main;
2. inspect current reviewedRosterCommit.server.ts and all existing idempotency/journal/recovery primitives;
3. preserve the binding Smart Import model:
   External Source → Human-Reviewed Canonical Intent → Canonical Commit;
4. preserve P8-B1 durable session/revision/signature binding;
5. preserve P8-B2 exact reviewed-intent commit authority and raw-row fence;
6. do not reopen SI-CG1/SI-CG2/P8-B1/P8-B2 absent a concrete regression;
7. derive the smallest coherent P8-B3 design for durable execution journal/recovery.

Owner merges manually.
Do not merge on the owner's behalf.
```

---

## 25. Handoff status

```text
CURRENT_HANDOFF_DATE: 2026-10-28
CURRENT_VERIFIED_MAIN: 1f7f3344e65dfc9b6837b10cb5349827da1587eb
PHASE: 8
P8_B1: CLOSED
P8_B2: CLOSED
P8_B3: NOT_STARTED
NEXT_ACTION: P8_B3_BOUNDED_IMPLEMENTATION_DEFINITION
```
