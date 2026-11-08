# AR2-U03 — Temporal relationship authority and historical integrity

Date: 2026-11-08 (Asia/Riyadh). Status: ready for independent review, not closed.
Baseline: `827d23eaaf459e70c5026091747f3794a318ab36` (merged PR #91, U02 closed).
Branch: `reconstruction/ar2-u03-temporal-relationship-authority`.
The full worktree was clean before edits; migrations 001–004 and approved ARCH-R1
Revision 1.2 sections 7,17,19,22 were inspected. No AGENTS.md was found.

## Source-grounded contract matrix recorded before implementation

| Source | Existing meaning | SQL U03 equivalence |
| --- | --- | --- |
| projectParticipationAuthority.planAffiliation | SET/REACTIVATE/REASSIGN/INACTIVATE; ACTIVE/INACTIVE; same-state no-op | Share pure transition decision; active accepted period vs ended accepted period; no new public affiliation ID |
| protectAffiliationAssignment | Changed affiliation must agree with active assignment counterpart; inactivation cannot strand assignment/allocation | Same-project read/lock guards; explicit CLOSE first when a carrier change would mismatch; no counterpart/cross-project cascade |
| temporalRelationshipAuthority.planAssignment; assignment repository | ASSIGN rejects occupied pair; REASSIGN closes both displaced pairs; same pair no-op | Same semantics in one SQL transaction; ASN external IDs preserved; company-wide EXCLUDE remains authoritative |
| planAllocation; allocation repository | ALLOCATE/REALLOCATE/CLOSE; same material no-op | End displaced accepted period then create TMA period at same server boundary |
| temporalRelationshipPolicy/Reads | ACTIVE requires effective start and open end; CLOSED preserves record; stale pointers fail closed | Derive projection from accepted period; SQL uniqueness/references replace mutable Firestore slot documents; ambiguous/future/unproven references fail closed |
| types/projectCarrierAffiliation | Entity ID is affiliation key; no redundant affiliationId or PII copy | Public projection remains entity/project/carrier IDs; SQL period UUID is internal history linkage only |
| assignment/allocation types | ASN/TMA opaque external IDs; no carrier, plate, driver identity, phone or price snapshots | External IDs separate from internal UUID; canonical FK references only |
| ARCH 7.5,17 and 001 GiST exclusions | Accepted history across the entire company cannot overlap, including completed intervals | Preserve existing EXCLUDE predicates; CLOSED ends valid_period, never changes ACCEPTED to VOIDED |
| membershipConsequences.server | DRIVER reduction closes current assignment; TRUCK closes assignment and allocation; MATERIAL closes affected current allocations (limit 50); CARRIER fails on dependencies | Atomic membership/temporal/audit/receipt/outbox workflow within the existing U02 transaction; carrier remains fail-closed |
| Existing global eligibility and project lifecycle | Disabled globals cannot start/reactivate operations; CLOSE remains cleanup; no global-status cascade | Reuse policy and U02 verified SQL authorization; cleanup available without reactivating disabled entities |
| U02 guard and project lock | Legacy/unproven dependencies blocked; same project command lock required by U03 | Retain fail-closed legacy guard; new proven U03 periods can close atomically; no automatic changes in another project |

An active affiliation in Project A precludes an overlapping affiliation for the same
driver/truck in Project B, even for the same carrier, because the approved company
constraint has no project dimension. Assignment/allocation conflicts have the same
company-wide safety boundary. A Project A command must return a sanitized conflict
instead of discovering/closing Project B's rows. This preserves approved cardinality
rather than weakening constraints to reproduce a historical project-only store.

Normal commands use PostgreSQL server time, never caller effective times. Future
accepted conflicts and unresolved legacy metadata require explicit reconciliation;
they are not shifted, voided or assigned fabricated close times. Existing data is
retained. No migration backfill or production operation occurs in this unit.

## Implementation and authorization

`SqlTemporalAuthority` extends the published `SqlCanonicalAuthority` command,
scope, lifecycle and consequence boundary. Firebase verification supplies only the
UID; SQL account/company/project authorization and its locked commercial role
remain authoritative. Project external IDs resolve through the existing scoped
lookup. No production route imports or activates this facade.

The inherited transaction holds the existing project advisory command lock and
authorization locks. Relationship eligibility reads lock global identities and
currently effective ACTIVE memberships. Assignment/allocation choose their write
boundary after carrier eligibility locks. The existing UnitOfWork owns the one
connection, transaction-local context, encrypted receipt, audit, outbox and worker
job staging. No additional pool or authentication implementation was introduced.
Different operations that are semantic no-ops create no relationship events, audit
or outbox effects; the existing command receipt still records their result. A
repeat of the same operation returns its encrypted result without duplicate effects.
Actor/payload mismatches and forged encrypted results fail closed.

There is no internal retry loop. Exclusion violations are sanitized as
`TEMPORAL_RELATIONSHIP_CONFLICT`; deadlock/serialization failures retain the U02
`CANONICAL_CONCURRENCY_RETRY` mapping. A caller retry must retain operationId;
failed transactions roll back the receipt as well as domain changes. Database
details and natural keys are not returned in these errors.

### Affiliations

The extracted `planCarrierAffiliationState` is shared by the unchanged Firestore
planner boundary and the SQL implementation. It preserves SET, explicit REACTIVATE,
REASSIGN and INACTIVATE decisions, including same-carrier no-op and state conflicts.
New operations require active global identities and project memberships. A changed
affiliation must agree with an assigned counterpart; inactivation cannot strand an
assignment or a truck allocation. Explicit temporal cleanup is required first.
INACTIVATE is available under cleanup lifecycle rules despite global status loss.

Each accepted carrier period has an internal UUID and revision. Public affiliation
projections retain the canonical driver/truck ID key, projectId and carrierId;
there is no redundant affiliationId. Logical createdAt/createdBy come from the
earliest proven accepted period and survive a different actor's reactivation.
Individual period creation/closure attribution is independently preserved in events.

### Assignments and allocations

ASSIGN requires active driver, truck and carrier membership, eligible globals and
matching active carrier affiliations. Existing same pair is a no-op; occupied
participants require REASSIGN. Reassignment closes both displaced pairs, deduplicated
and ordered by period UUID, then creates the new pair at the exact same PostgreSQL
microsecond boundary. It does not change material allocations.

ALLOCATE requires eligible truck/material/carrier, their effective memberships and
the truck's active carrier affiliation. Same material is a no-op. Changing material
requires REALLOCATE and closes the old allocation before opening the replacement.
ASN/TMA identifiers retain their opaque 128-bit external form; internal UUIDs are
not accepted as replacement public IDs. CLOSE preserves the original external ID,
start, canonical references and creation provenance. Repeated CLOSE is a no-op.
Cleanup remains available in archived projects to the current authorized admin.

SQL projections use the existing canonical affiliation, assignment and allocation
types, with explicit serialized audit dates and temporal revision metadata. No
profile, PII, carrier snapshot in assignments, material in affiliations, or pricing
data is copied into relationships.

## Accepted history, migration 005 and privileges

Migrations 001–004 are byte-for-byte unchanged. Additive 005 adds provenance,
revision, optional external/legacy mapping fields, indexes, four append-only period
event tables, restrictive project write policies and guarded runtime mutations.
It does not alter any of the five existing company-wide GiST exclusions:

| Table | Accepted non-overlap key, in addition to period |
| --- | --- |
| driver_carrier_affiliations | company_id, driver_id |
| truck_carrier_affiliations | company_id, truck_id |
| driver_truck_assignments | company_id, driver_id AND separately company_id, truck_id |
| truck_material_allocations | company_id, truck_id |

Their original predicate remains `record_status='ACCEPTED' AND voided_at IS NULL`.
An ended accepted period is still protected against historical overlaps. ACTIVE
projects an accepted currently effective open period; INACTIVE/CLOSED projects an
ended accepted period. VOIDED is explicit invalidation and is excluded from normal
relationship projection; no normal U03 command creates it.

New/changed periods must be nonempty, finite at their inclusive lower boundary,
exclusive at their upper boundary and finite when bounded. The additive CHECK is
NOT VALID so unresolved historical rows are retained; it still checks new writes.
Normal runtime creation is open-ended at the server boundary. Normal closure only
ends a proven open accepted period, preserves start/references/provenance, increments
revision and uses that same server boundary. Closed periods cannot be rewritten.
Caller effective dates, caller role fields and unsupported command fields are denied.
Future/bounded-current periods fail closed rather than being shifted or closed early.

The runtime role gains INSERT and a narrow column UPDATE grant only for closure
metadata/range, never UPDATE to identity/FK/status/void fields or DELETE. Existing
forced company RLS and 004 restrictive project reads remain; 005 extends project
restriction to writes. Event tables enforce both company and project scope with
forced RLS. Runtime can SELECT events but cannot INSERT/UPDATE/DELETE them.

An AFTER trigger appends actual before/after rows, actor, commercial role, operation,
action, effective boundary and unique relationship revision. Its SECURITY DEFINER
function has fixed pg_catalog/pg_temp search_path, an explicit target whitelist,
qualified/quoted table references and no PUBLIC execute. The dedicated NOLOGIN,
non-superuser, non-BYPASSRLS history writer has only event INSERT and schema USAGE;
no runtime/auth/worker role receives membership. Temporary schema CREATE and
migrator SET/INHERIT are removed after function ownership transfer. The migrator
retains only the necessary ADMIN membership for future controlled migrations.

The mutation guard and reads require a matching latest event witness, compared as
the complete typed database row. Stale/corrupted attestations fail closed. Legacy
rows default to revision 0 with nullable provenance and are not automatically
attested or assigned invented actors/timestamps. Reconciliation must establish the
original ASN/TMA mapping, interval, actor/operation provenance and event witness in
a separately approved privileged migration. The optional legacy path is only a
mapping slot, not a backfill. Production data migration remains outside U03.
Privileged reconciliation does not automatically run the runtime attestation path.

005 was applied transactionally on the isolated PostgreSQL 17 database after 001–004.
An initial development attempt failed during trigger/function ownership ordering and
rolled back; the final migration creates triggers before transferring the function.
The final version applied successfully and repeat application verified all five
checksums without reapplying. Changed checksums are rejected. Existing backup/restore
rehearsal also passes with the extended schema. A failed migration must be corrected
before publication or restored/reconciled through the existing migrator runbook;
published checksums must never be edited to bypass verification.

## Membership dependency reconciliation

| SUSPEND/REMOVE owner | Same-project atomic consequences |
| --- | --- |
| DRIVER | Close its current proven assignment; retain affiliation |
| TRUCK | Close current proven assignment and allocation; retain affiliation |
| MATERIAL | Close its current proven allocations, maximum 50 |
| CARRIER | Fail closed on affiliations, derived assignment/allocation dependencies or effective pricing |

These decisions follow `membershipConsequences.server.ts`, not an inferred cascade.
Legacy/unproven dependencies retain U02's DEPENDENT_RELATIONSHIPS_ACTIVE guard.
Future periods and stale references also block the entire mutation. More than 50
material allocations reject before changes. Driver/truck affiliation provenance is
checked even though cleanup leaves the affiliation in place.

Expected membership revision is checked before writes. Child closure, child event,
audit/outbox/job effects, parent mutation/history, parent audit/outbox and receipt
share one transaction and boundary. Late parent failure rolls back every child
effect. Same-state reduction still reconciles proven child consequences without
rewriting parent status/provenance; the carrier guard also runs on same-state calls.
Global SUSPENDED/MAINTENANCE/INACTIVE changes preserve relationships and block new
operations; they do not trigger automatic cleanup. No command closes another
project's relationships or alters completed trips/historical pricing.

## Verification evidence

Toolchain: Node 22.22.0, npm 10.9.8, repository Vitest 5.0.3, native PostgreSQL 17.6
on an isolated loopback-only local cluster. Database `qsaudi_u03_test` uses separate
postgres fixture administration, qsa_migrator ownership, qsa_runtime non-owner
commands, qsa_auth lookup and qsa_worker roles. Runtime does not use superuser,
table ownership or BYPASSRLS. Test HMAC/encryption secrets are generated in memory.
No production credentials, database, migration or endpoints were used.

| Final selection | Actual result |
| --- | --- |
| ar2U03TemporalAuthority.test.ts | 63/63 PASS, real PostgreSQL |
| ar2U02CanonicalIdentityMemberships.test.ts | 55/55 PASS, real PostgreSQL |
| ar2U01PostgresInfrastructure.test.ts | 13/13 PASS, real PostgreSQL, including native pg_dump/restore rehearsal |
| ar2U01SecurityGate.test.ts | 36/36 PASS, real PostgreSQL |
| ar2U01ConnectionCleanup.test.ts | 6/6 PASS, unit cleanup/config evidence |
| canonicalFleetRelationshipPolicyTypeAuthority.test.ts | 3/3 PASS |
| affiliationStatusVocabularyAuthority.test.ts | 3/3 PASS |
| Explicit required four-file authority bundle | 148/148 PASS |

The PostgreSQL selections ran serially by file; no existing test timeout was raised.
The new suite includes real trigger-induced audit/outbox failures and late parent
failure rollback, context reuse on a one-connection pool, RLS/FK denial, archived
cleanup, forged receipt rejection, history tampering, VOIDED distinction, membership
limits, same-state cleanup, cross-project isolation and repeat/checksum verification.
No tests were skipped or weakened. Existing SG1/U02 tests only extend the expected
migration list/count from four to five; their authority cases remain intact.

Concurrency: four bypass-precheck races use separate runtime connections, assert
different pg_backend_pid values, begin independent transactions in different
projects and issue conflicting inserts concurrently. For each of the four kinds,
exactly one commits and the loser receives PostgreSQL 23P01. API assignment and
allocation races separately prove one compatible committed result. All four kinds
also reject overlap with accepted CLOSED history. Invalid empty/inverted/exclusive
lower/unbounded lower ranges and future conflicts are exercised against real SQL.

History performance: an actual EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) over 2,000
synthetic historical assignment rows selected `driver_truck_assignments_history_idx`,
returned 50 rows in 0.081 ms in the final local run. No planner options were disabled.
This is local fixture evidence, not a production capacity benchmark. Keyset pages
use (lower(valid_period),id), maximum 50; consecutive pages preserve older completed
records without duplicate/missing boundary rows. Separate truck-assignment and
material-dependency indexes support the other lookup directions.

### Baseline versus final regressions

The identical 15-file selection on clean main and final implementation gives
470 PASS / 2 FAIL / 472 in each. The selection is:

```text
temporalRelationshipAuthority.test.ts
temporalBrowserBoundary.test.ts
projectCarrierFleetAffiliationFoundation.test.ts
projectDriverTruckAssignmentFoundation.test.ts
projectTruckMaterialAllocationFoundation.test.ts
projectParticipationAuthority.test.ts
projectParticipationBrowserBoundary.test.ts
projectMembershipFoundation.test.ts
globalIdentityFoundation.test.ts
reviewedRosterCommitP8B2.test.ts
rosterExecutionRecoveryP8B3.test.ts
txReadCacheCorrectness.test.ts
rosterIdentityGroupingProvenanceSiCg1.test.ts
rosterMaterialBindingContinuity.test.ts
driverTruckIntakeP602A.test.ts
```

All names are under src/tests and were passed explicitly to `vitest run` using
the same installed toolchain. The exact required bundle was also run separately:

```sh
npx vitest run src/tests/reviewedRosterCommitP8B2.test.ts src/tests/rosterExecutionRecoveryP8B3.test.ts src/tests/temporalRelationshipAuthority.test.ts src/tests/txReadCacheCorrectness.test.ts
```

Actual execution used the installed Node 22 `node node_modules/vitest/vitest.mjs run`
entry point (same four files), with default/JSON reporters. Counts are 50+30+61+7.
It is part of the 472-test selection, not 148 additional distinct cases.

Both failures reproduce unchanged on authoritative main:

* projectDriverTruckAssignmentFoundation case 51, line 672: its `/tests/` check
  misses Windows backslash paths and misclassifies four existing test callers.
* rosterIdentityGroupingProvenanceSiCg1, line 118, absent Material case: receives
  the pre-existing UNRESOLVED_MATERIAL blocker where the assertion expects none.

`npm run lint` exits 2 on both baseline and final: 446 TypeScript diagnostics in
each, identical after normalizing shifted line/column locations. No new diagnostics
remain. `npm run build` passes on both, including Workbox and server output; the
pre-existing large-chunk warning remains. `git diff --check` passes.

Local evidence is retained outside the repository in sibling `.sg1-tools`:
u03-baseline-lint.log, u03-final-lint.log, u03-baseline-build.log,
u03-final-build.log, u03-baseline-regressions.json, u03-regressions-final.json,
u03-postgres-final.json, u03-additional-final.json and u03-required148-final.json,
with matching test logs. Generated reports, binaries, dumps and fixture data are
not committed.

## Exact implementation inventory and review boundary

1. docs/reconstruction/09_AR2_U03_TEMPORAL_RELATIONSHIPS.md — this record.
2. src/db/migrations/005_temporal_relationship_authority.sql — additive schema/security/history.
3. src/db/temporalRelationshipRepository.ts — transaction-bound periods, projections, guards and cleanup.
4. src/db/temporalAuthority.ts — inherited SQL command/read facade.
5. src/utils/carrierAffiliationPolicy.ts — shared pure affiliation decisions.
6. src/db/canonicalAuthority.ts — inherited context hooks and atomic membership consequences.
7. src/services/projectParticipationAuthority.server.ts — contract-preserving shared policy extraction.
8. src/tests/ar2U03TemporalAuthority.test.ts — 63 focused PostgreSQL cases.
9. src/tests/ar2U01SecurityGate.test.ts — migration inventory assertion extension only.
10. src/tests/ar2U02CanonicalIdentityMemberships.test.ts — migration inventory assertion extension only.

Remaining debt: the 446 baseline TypeScript diagnostics, two reproduced baseline
test failures and existing bundle-size warning. Production historical reconciliation,
cutover, and Foundation redesign remain separate approved work. AR2-U04 has not
started. Firestore remains production authority; routes, UI, Google, pricing, Smart
Import implementation, offline behavior and dependencies are unchanged. No PR,
merge, deployment or production SQL migration is part of this branch. U03 is ready
for independent diff review and owner-controlled merge; it is not marked closed.
