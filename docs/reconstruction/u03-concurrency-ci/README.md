# U03 PostgreSQL 17 exclusion concurrency stabilization

Base: `653655d1e332559055d6928721026896320ab0ae` (verified origin/main).
Isolated branch: `test/u03-exclusion-concurrency-20261114`.
Scope: the four raw two-connection U03 exclusion race tests and this evidence. No production implementation, workflow, migration, business authority or retry-policy changes.

## Root cause

The unchanged test was reproduced on a fresh, loopback-only PostgreSQL 17.6 instance: three selected cases passed and truck affiliation failed because the concurrent loser returned `40P01` instead of `23P01`. Verbose PostgreSQL diagnostics show two single INSERT statements waiting for ShareLock on each other's transaction IDs, explicitly **while checking exclusion constraint** in `truck_carrier_affiliations`; the reporting routine is `DeadLockReport`. The surviving waiter acquired its lock after the victim was aborted. This identifies exclusion index conflict checking, not an application multi-statement lock-order cycle.

[PostgreSQL 17.6 executor source](https://github.com/postgres/postgres/blob/REL_17_6/src/backend/executor/execIndexing.c#L27-L44) describes the same mechanism: exclusion checking scans after index insertion; concurrent inserters may wait for each other, and the deadlock detector aborts one. The sequential error-code assumption was too narrow for this intentional direct-database race.

## Source-grounded boundary review

- Migration 001 retains company-wide GiST exclusions on driver affiliation, truck affiliation, assignment driver and truck, and allocation truck, with overlapping accepted/non-voided periods excluded across projects.
- Migration 005's INSERT guard validates transaction context, immutable opening metadata and the open period. The AFTER trigger records that inserted relationship's event. Neither INSERT path acquires a reversed application lock sequence.
- Production `SqlCanonicalAuthority.scoped` takes its project advisory lock before command work. Temporal participation locks canonical identities and memberships before writing; shared driver/truck identities are locked by `CanonicalIdentityRepository.get(..., true)`. The raw race intentionally bypasses these service prechecks and locks to exercise database authority directly.
- `withUnitOfWork` rolls failures back and discards connection state. Existing `40P01` mapping to `CANONICAL_CONCURRENCY_RETRY` is unchanged. No general claim that every deadlock is safe is made; these observed exclusion-check cycles are the diagnosed scope.

## Strengthened test contract

Each of the four races retains two real concurrent runtime connections and distinct backend PIDs, different project contexts and conflicting company-wide relationship ownership. It now proves:

1. Exactly one successful COMMIT and exactly one rejected transaction.
2. A fresh administrative read spanning projects finds exactly one relationship for the conflicting owner, matching the winning returned ID, project, references and operation; it remains ACCEPTED, non-voided, revision 1, with an open period.
3. Exactly one revision-1 history event exists for the two operations, belonging to the winner. No losing operation event survives.
4. Both original connections are usable after settlement and have no assigned transaction ID.
5. A separately acquired runtime connection attempts a fresh overlapping insert in the losing project and must receive **23P01 with the exact named exclusion constraint and table**. It rolls back, and authoritative relationship/event state is checked again.
6. Only after all these assertions pass may the concurrent loser have `23P01` or `40P01`. A `40P01` must additionally identify exclusion-constraint checking in its PostgreSQL context.

No retries, sleeps, barriers, timeout increases, fixture serialization, skipped/removed tests, migration changes or service error-code relaxations were introduced. Test console evidence contains synthetic IDs and transaction diagnostics, never source documents or production credentials.

## Verification and preservation

See `verification.json` and compressed original runner reports. Diagnostic `-t` invocations select only the four race cases (59 other U03 tests are reported as filtered/skipped by Vitest); this does not change test declarations. The full native and authority gates are unfiltered and must have zero skipped/todo cases.

The original RB4 nine dirty files, binary diff, HEAD and migration 013 are verified against the existing approved preservation manifest. All other worktree HEADs and statuses, existing branch refs, and migration bytes are checked before commit. PostgreSQL uses a newly initialized local test cluster on `127.0.0.1:55449`, with a fresh owned database per native invocation, no production access and default one-second deadlock timeout. The local cluster is stopped after verification.

## Reproduction commands

Use Node 22, PostgreSQL 17.6, an explicitly isolated disposable database with separated qsa_migrator/qsa_runtime/qsa_auth roles, and the environment from `.github/workflows/ci-foundation.yml`.

- Diagnostic/stress: `vitest run src/tests/ar2U03TemporalAuthority.test.ts -t "EXCLUDE rejects a real two-connection" --maxWorkers=1` (20 separate invocations; any failure stops the experiment).
- Native 425: the exact eleven-file, serial `postgres-authority` workflow command, without a test-name filter.
- Authority 148: the exact four-file `postgres-authority` workflow command, without a test-name filter.
- Type check: `tsc --noEmit`.

This is a local review commit only. It neither publishes a branch nor establishes production readiness, PostgreSQL cutover authorization or a guarantee against unrelated deadlocks.

## Final results

Final-source stress: **80/80** across 20 independent four-case runs; concurrent losers: `23P01`: 53, `40P01`: 27. Every run proved exactly one committed relationship/event and a fresh named-constraint `23P01`. Native CI family: **425/425, zero skipped**. Explicit authority bundle: **148/148, zero skipped**. TypeScript: **zero diagnostics**. U03 in the full suite ran after the original Arabic fixtures were restored; earlier preliminary stress is excluded from final counts.

Decision: **GO for local review of this bounded test correction**. Remote Linux CI and publication require a separately authorized next step.
