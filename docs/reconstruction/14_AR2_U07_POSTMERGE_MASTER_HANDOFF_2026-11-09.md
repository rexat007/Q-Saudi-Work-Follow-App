# Q-Saudi Work Follow — Verified post-merge master handoff
**As of:** 2026-11-09 (Asia/Riyadh)  
**Scope:** governance, source lineage, architecture, risk, next unit and unresolved acceptance; **documentation only**.  
**Repository:** https://github.com/rexat007/Q-Saudi-Work-Follow-App

## 1. Exact current GitHub authority and evidence boundaries
- **Verified main commit:** `d2f2ae4006eb3c36943733bec0f6855c905ab04d`; merge commit `PR #97` (AR2-U07 durable offline/epoch/receipt recovery).
- Previous verified main: `7ce8f7827e6e9a037a8010791c4ee69170d868ff`; merge `PR #96` (U06-CI1 portability). GitHub compare shows 3 forward commits and 0 behind, exactly 27 file changes from previous main to current main.
- U07 implementation: `311794c8b5c168ca34249855a5c7be8347350f7d`. U07-RB1 corrective closure: `bb468587c90c9a76956579057cb68de1fc5bd0be`. Owner reported merge; repository independently confirms.
- `AR2_U07 = MERGED / SOURCE_VERIFIED / SOURCE_CLOSED`; **NOT** production/live accepted, deployed or SQL-activated.
- PR head workflow's "Secret-free foundation CI" reports success. **No main-merge-commit workflow run or combined status returned** by the connected GitHub check when inspected; never claim fresh main SQL CI success without direct evidence. Native 53/53 Edge browser, 425/425 PG17 and 148/148 authority bundles are **executor-reported** evidence. Do not conflate with independent execution.
- Current documentation branch `reconstruction/ar2-u07-postmerge-documentation-20261109` is based on merge SHA; docs-only changes are not part of main until separately reviewed/merged. Never treat a docs branch commit as a new production baseline.

## 2. Architecture decision authority — ARCH-R1 Revision 1.2
Owner adopted **ARCH-R1 Revision 1.2** on 2026-11-07: (a) architectural design artifact followed by (b) direct bounded implementation in actual repository; **no parallel architecture and no POC**. Codex performs implementation; after push, independent source/CI audit, then owner manual merge; deployment/cutover require separate owner authorization.

Current **active** authority remains Firebase/Firestore and application server. PostgreSQL U01–U07 is an **inactive, additive alternative authority** for prospective approved migration. Published SQL migrations must remain immutable. Do not create second writers, dynamically select SQL in live React, advance epoch, migrate historic data, provision new production cloud resources, or redirect live routes merely because code exists. Future U09 must own cutover, legacy reconciliation and mixed-client fencing with explicit go/no-go.

Proposed long-term split: operational application ↔ server/database only; database-owned durable events/outbox → bounded server worker → **existing** per-project Google Sheets/Apps Script/reporting projection. Avoid direct client ↔ Google Sheets polling and repeated sync after logout. Google Sheets is a projection and continuity/reporting surface, never coequal operational authority. During current runtime the canonical operational database is Firestore, not an activated SQL deployment. Apps Script/Sheets operational continuity during app outage and idempotent server-owned Workspace provisioning must remain respected; do not assert it is fully validated until live-tested.

## 3. AR2 sequence — present factual status
| Unit | Accepted source outcome | Remaining boundary |
| --- | --- | --- |
| U01 | SQL security/foundation authority implemented, source integrated historically | inactive, no cutover |
| U02 | canonical identity/membership SQL authority historically implemented | inactive |
| U03 | temporal relationship SQL authority historically implemented | inactive |
| U04 | bounded canonical/fleet read authority historically implemented | inactive; no fabricated complete-inventory proof |
| U05 | durable, trusted SQL import authority historically implemented | inactive; frozen source/receipt recovery and trust boundary |
| U06 | Trip FSM, operational/weighbridge profiles, immutable pricing, migration 008–009 and RB1 security fixes; PR #95 merged | inactive, no HTTP production routing |
| U06-CI1 | CI cross-port outage test correction; PR #96 merged at `7ce8f782...` | regression proof ≠ deployment |
| **U07 + RB1** | **PR #97 merged at `d2f2ae400...`**; IndexedDB scoped SQL journal; epoch revision/transaction fence; durable receipt replay; causal ordering and no unproven omission deletion | no SQL UI activation, no live mobile acceptance |
| **U08** | **NEXT / NOT_STARTED** | server-owned Sheets/Workspace/report projection and bounded reconciliation, design and implementation separately scoped |
| U09 | NOT_STARTED / SEPARATE OWNER CUTOVER GATE | production SQL selection, UI composition, real migration/mixed-client safety |

The older project-wide Phase 10 Trip implementation remains historically gated; do not silently mark it accepted due to existence of isolated U06 SQL code. Retain previous P8/P9/PFAG and live-source history without falsely rewriting their original acceptance claims.

## 4. U07 detailed contract and RB1 findings
1. IndexedDB additive v3 preserves ten legacy stores; adds `sqlCommands`, `sqlCache`, `sqlControl`. SQL durability must not pretend memory fallback survived restart.
2. Command intent is immutable: UUID operation ID, exact request digest, expected revision, actor, company, project, device correlation and epoch; browser digest is not proof of authorization. Authenticated server/receipt authority revalidates actor/scope.
3. Unknown ACK state must trigger **receipt-first** recovery, never assume rollback. Leases, bounded retries, logical generation and principal/tenant/epoch isolation protect concurrency, multi-tab, restart and revocation.
4. **RB1 causal fix:** atomic resource-scoped sequence, predecessor pointer and send eligibility; dependent commands wait for authenticated predecessor `SYNCED` receipt without spending retry attempts. Independent Trips can proceed. Missing server-assigned Trip identity cannot be invented locally. Pre-RB1 unordered pending records are held for human review rather than guessed/reordered.
5. **RB1 cache fix:** SQL cache pages are **upsert-only**; no caller-provided `fullSnapshot`/`completeThrough` flags can delete omitted objects. Revisions and scope must be checked. Omission pruning only after a separately designed, authenticated complete-inventory witness.
6. Migration 010 introduces isolated server-owned, forward-only epoch registry initially Firestore / revision 0. Transaction-held shared row lock prevents writers racing an epoch transition. Runtime never advances registry. Published migrations 001–009 remain unchanged.
7. Current offline coordinator/transport/routes are isolated inactive seams; neither React nor production `server/app.ts` selects SQL. Legacy Firestore flows remain current; UID guards on old replay and token-bound transport are preserved.

## 5. Earlier relevant decisions and operational incidents (retain as historical record)
- **Foundation/PFAG:** P8 and P9 were merged; Foundation Safety RB1/RB2 and project setup gates demanded verification before ordinary trips. Firestore Rules native runtime check `PFAG-RULES-01` was historically environment-blocked; check current ledger before claiming closure. Beta2 and other disposable test projects are clean-reset targets only when specifically authorized, while auth accounts and infrastructure remain preserved.
- **Smart Import:** canonical global Carrier/Material/Driver/Truck identities are reused through project-scoped membership/affiliation; avoid duplicate global identities. Distinguish missing profile from temporarily unavailable profile. Durable reviewed intent, authoritatively committed receipt and resume handling; never silently issue duplicate mutations after lost responses. Token expiration may trigger one bounded forced refresh/replay, not loops.
- **Firestore read quota:** `RESOURCE_EXHAUSTED` and runaway read amplification previously impacted operation. Data-A2 measured 1,612 document gets, 451 query gets and 618 query documents for small test data; B1–C2 introduced path-keyed transaction read memoization and explicit safe query descriptors/scoped execution read-set. No memoization based on unstable Admin SDK query internals or broad unbounded materialization. Continue resource-cost proof before production load.
- **Workspace sync:** repeated client-side retry after idle/logout, excessive Google API consumption and stale sheet state drove bounded server-side design. Earlier controlled-incremental source showed zero user-active automatic sync POSTs; no 30-second PWA polling; ordinary outbox sync must not scan full Trip collection; derived report refresh is explicit and bounded; worker skips inactive/SETUP projects. These were source/local claims, not proof of current live scaled reliability.
- **Operational profiles:** four profiles (dual weighbridge, loading-only, unloading-only, no weighbridge). Never fabricate weights or time. Reviewed same-profile in-place changes require server revalidation; cross-profile history-bound mutations fail closed. Historic Trip snapshots and fixed pricing lineage must remain immutable.
- **Google Workspace identity:** preserve `destinationRootFolderId`, `projectFolderId`, `spreadsheetId`, `driveFileId`, `scriptProjectId`, `googleSubject`. One-step server-orchestrated idempotent ensure/reuse; existing Drive/Sheet/Script resources must not be recreated by a retry or the U08 unit.
- **Google AI Studio intake:** Studio cannot be assumed to retrieve private GitHub files merely by repository name; provide **direct raw HTTPS source URLs** for each file and verify exact fetched content/checksum, no unexpected additions/deletions, before editing. Attach the relevant architecture `.md` guide per prompt. Prefer Codex for current implementation under owner instruction.

## 6. Non-negotiable engineering and owner process
- **GitHub/main source verification first** after owner says «تم الدمج»: commit SHA, parent lineage, file inventory, relevant Actions checks and merge-state evidence. Old assistant narrative alone is not source truth.
- One tightly bounded unit at a time. State exact production/test/docs file allowlists and disallowed scope; preserve architectural single authority and existing schemas/rules/permission gates. No opportunistic refactor, broad cleanup, extra files or direct production bypass.
- Identify systematic root cause and adjacent failure family rather than repeated narrow patches. Report baseline failures separately from introduced failures. Require regression tests, real backend/browser evidence as appropriate, source diff, no missing/skipped cases, diagnostic delta, build and clean worktree.
- Executor workflow: baseline preflight → implement → tests → scope reconciliation → commit/push **only as currently authorized** → remote audit → owner manual merge. Do not automatically PR/merge/deploy, and do not say CI or LIVE PASS without evidence.
- Owner prefers **decision plus complete executable Codex prompt** together after a verified merge; short non-repetitive reviews and prompt for next unit. Do not ask repeated approvals for already selected architecture. User's «تم البوش» is not «تم الدمج» and neither is live acceptance.
- After each accepted unit reconcile `02_PHASE_LEDGER.md`, `05_DECISION_AND_DEBT_LOG.md`, unit record and handoff; preserve chronology. Branch-only documentation is **not** merged documentation.

## 7. Explicit current debt / risk register
| Area | Current classification | Required future closure |
| --- | --- | --- |
| U07 code and merge | SOURCE_VERIFIED / MERGED | no further merge needed for U07 |
| U07 live/device acceptance | NOT_PERFORMED | separate device/role/lost-network and production-safe field verification |
| U07 merged-main PostgreSQL CI | NOT_INDEPENDENTLY_CONFIRMED_BY_CURRENT_CONNECTOR | inspect GitHub Actions on actual main commit, record job IDs and conclusions |
| U07 full-snapshot omission prune | DISABLED_BY_DESIGN | trusted server complete-inventory witness |
| U07 pre-RB1 unordered queue | HELD_FOR_REVIEW | owner-authorized classification and guarded recovery |
| Mixed Firestore/SQL client version & legacy outbox | DEFERRED | U09 migration/cutover design, no dual writes |
| Offline UI SQL journal/pagination | DEFERRED | U09 composition and bounded read UX |
| TypeScript diagnostics | 446 BASELINE | independently scoped remediation; do not invent clean lint |
| Historical test failures | 58 assertions + 5 load + 1 unhandled rejection | isolate and resolve by owner-approved separate unit |
| SQL live activation | FORBIDDEN/NOT_AUTHORIZED | U09 explicit owner gate with rollback/fencing |
| Workspace/Sheets API cost & report freshness | LIVE_SCALE_RETEST_REQUIRED | U08 bounded server worker, delivery ledger and no polling loops |
| Firestore read quotas | HISTORIC INCIDENT / CURRENT LIVE RISK | authoritative bounded read and real usage telemetry |
| PFAG Firestore Rules runtime check | HISTORICAL ENVIRONMENT_BLOCKED | verify actual status before closing |

## 8. AR2-U08 — next unit engineering boundary (NOT STARTED)
**Purpose:** converge the existing Workspace/Google Sheets operational reporting system to a durable, idempotent, **server-owned** projection of canonical application events and bounded explicit derived report refresh; eliminate browser-origin background Google sync, preserve existing per-project Workspace and Apps Script continuity.

**Before coding:** audit the current exact `main` at `d2f2ae400...` or any newer confirmed HEAD. Inventory actual Workspace services, project provisioning, trigger/worker entry points, durable outbox/retry/receipt, report reads, Google API quotas, account/project auth, idempotency and external resources. Write a field-level authority/projection matrix, server-side trigger strategy and failure/lease model. Pin a file allowlist only after source audit, and do not presume filenames from historical material.

**Required design invariants:** single operational authority; exactly-once *effect* through idempotent receipts (not fantasy exactly-once transport); durable replay/outage handling; one stable project resource identity; bounded page/query budgets; explicit projection watermark/staleness/report refresh; tenant isolation and revocation; no browser perpetual POSTs; no automatic Google calls after logout from browser; partial failure safe recovery without recreating Sheets; Apps Script offline continuity not silently lost.

**Evidence gate:** compare existing implementation vs intended change before editing; test active/inactive projects, duplicate events, lost Google ACK, worker crash/retry, quota 429/403, out-of-order updates, client logout, multiple devices/projects, stale derived reports, recovery without full-scan, unchanged Drive IDs, and no new Google resources. Measure API read/write counts and periodic idle traffic.

**Strict exclusions:** no U09 SQL cutover, no production SQL routing, no Firestore-to-SQL migration, no new Google project/folder/sheet/script, no bulk production data rewrite, no trip/pricing redesign, no PR/merge/deploy without explicit instructions. Keep the U08 unit `NOT_STARTED` until actual implementation begins.

## 9. Source links
- [U07 merge #97](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/97)
- [Verified main merge commit](https://github.com/rexat007/Q-Saudi-Work-Follow-App/commit/d2f2ae4006eb3c36943733bec0f6855c905ab04d)
- [U06 CI correction #96](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/96)
- [U07 full implementation and RB1 history](13_AR2_U07_OFFLINE_EPOCH_RECEIPT_RECOVERY.md)
- [Canonical phase ledger](02_PHASE_LEDGER.md)
- [Decisions and debt](05_DECISION_AND_DEBT_LOG.md)

**Historical chronology remains archival; the topmost dated post-merge status in the canonical ledger and this handoff control the current operational classification.**
