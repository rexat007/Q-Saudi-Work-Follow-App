# AR2-U09-RB3 — immutable intake and independently approved frozen exports

## Mandatory preflight and source-derived decision — 2026-11-10

Fetched main and existing U09 branch before changes. Main `030e9027685033c674cf2021499db7bfb675cbfd`; local/remote RB2 `d13a6d4f07e21d766df09bd5dbce10bd9ac0b1f1`, clean worktree. No applicable AGENTS.md. The initially truncated request was completed by the owner before dependent implementation. Read ARCH-R1 Rev1.2, U09/RB1/RB2 records and current import, parser, source, auth, artifact, receipt, runtime inventory and comparison code. No production data or secret values were inspected.

Operational intake: authenticated current SQL actor -> current company/project -> existing U05 session/command lock and immutable request receipt -> bounded validated source -> encrypted artifact/chunks -> explicit source revision -> existing mapping, canonical review and execution receipts. Migration evidence: independently approved source owner -> frozen generation/watermark -> exhaustive source records and canonical mapping approval -> signed immutable package -> current owner authorization -> bounded SQL comparison/receipts. Intake authority never approves migration evidence.

Existing storage is PostgreSQL `import_source_artifacts` + encrypted `import_artifact_chunks`, project RLS and SELECT/INSERT-only runtime privileges, separate least-privilege connection and existing identity encryption keys. U05 supports source bytes <=2 MB, bounded encrypted chunks (SQL row ceiling 400,000 bytes) and an 8 MB envelope cap. The production provider will harden this existing bounded backend, not promote/remove the test-only adapter guard, add a second store, store a huge file in a SQL row, guess a cloud bucket, expand credentials or involve Workspace. The private object URI remains an internal locator, not a public download. Upload/chunks/checkpoint/receipt are one SQL transaction; interrupted uploads roll back, so no externally staged temporary source cleanup or unbounded orphan sweeper is needed. Production durability still depends on operator-owned PostgreSQL persistence/backups and secret lifecycle; no production service is activated here.

Migration evidence will use an explicit server-configured, read-only frozen package with independently trusted Ed25519 owner and mapping-approver keys, signed current source authorization, exact scope/generation/watermark and complete 52-category coverage including governance. It computes destination fingerprints from approved mapped source bytes, never from a destination scan masquerading as a source export. No live production exporter, resource path, source ownership or mapping approval is inferred. Missing/unverified configuration stays blocked. Real filesystem IO and the production adapter code will be tested using isolated signed synthetic packages; this cannot certify production equivalence.

## Pre-edit capability matrix

| Capability | Existing authority / gap | Bounded RB3 result |
|---|---|---|
| Uploaded source storage | U05 SQL encrypted chunks; only explicit isolated test provider exists | Production-capable provider on same backend with immutable revision, ownership and format proof |
| Authorization | Token -> SQL actor, project lock, current role/lifecycle, epoch, RLS | Recheck on put/get/receipt; no artifact access through client URI |
| Receipts/retry | U05 encrypted command receipts and atomic checkpoints | Preserve envelopes; additive safe source receipt read; lost-ACK recovery without a new upload identity |
| CSV/XLSX | Existing bounded source verifier and canonical parser; <=2 MB / 10k rows | Reuse exact parser validation, explicit XLSX sheet/header, reject unsupported remote formats |
| RB2 intake | CSV source attempt/resume; explicit unavailable provider | Real provider upload/readback and uncertain-result recovery; CSV/XLSX controls |
| Mapping/resolution/review | Existing U05 approved mapping and bound row verifier, canonical/temporal review and frozen groups | Preserve all authority; unsupported UI mapping/resolution remains explicitly blocked, not fabricated |
| Source/export reconciliation | ReadinessSource port only; 52-category manifest + durable comparison | Concrete read-only owner/mapping-verified frozen export adapter; no production source equivalence claim |
| Readiness invalidation | Drift blocks when a valid manifest changes; invalid evidence currently throws before run update | Current authorization + BLOCKED durable run on unverifiable evidence; productionCutoverAuthorized always false |
| Production/Workspace | Firestore remains production, SQL runtime unactivated; RB4 adapter absent | Preserve bootstrap/epoch/sole Google writer; zero production migration or provider writes |

## Exact pre-edit allowlist

- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md`
- `docs/reconstruction/19_AR2_U09_RB3_IMMUTABLE_SOURCE.md`
- `src/db/importArtifacts.ts`
- `src/db/sqlImportSourceStore.ts`
- `src/db/importAuthority.ts`
- `server/sqlImportRoutes.ts`
- `server/sqlRuntimeRoutes.ts`
- `src/db/approvedFrozenExport.ts`
- `src/db/runtimeReadinessAuthority.ts`
- `src/components/import/SqlImportJourney.tsx`
- `src/i18n/sqlRuntime.ts`
- `src/tests/ar2U09Rb3Source.test.ts`
- `src/tests/ar2U09Rb3Export.test.ts`
- `src/tests/ar2U09Rb3Browser.test.ts`
- `.github/workflows/ci-foundation.yml`

Migrations 001–012 and all existing test assertions are immutable. Existing schema can represent bounded source/provenance and atomic commit without a new migration. Any required extension must be documented here before editing. RB4 and production activation remain outside scope.

## Final implementation and actual configuration

`AR2_U09_RB3_SOURCE_IMPLEMENTED_READY_FOR_REVIEW`. Overall U09 remains **BLOCKED**. This is bounded source implementation and isolated verification, not production source certification or activation. No migrations or roles were added. Published 001–012 bytes, U09/RB1/RB2 historical records, production bootstrap and legacy Firestore root are preserved.

### A. Authenticated operational intake

`registerSqlRuntime` supplies `SqlImmutableImportSourceStore` when the trusted server composition omits an explicit source provider. It still refuses registration unless the operator-owned shared authority and the database epoch/fence already agree. No production registration, new activation flag, browser backend choice, public source URL or cloud resource was added. Existing explicit test DI remains available; `IsolatedSqlImportSourceStore` retains its original environment guard and implementation.

The actual backend is the existing PostgreSQL source artifact/chunk tables using current `qsa_runtime`/auth pools, current company/project/actor context, existing RLS and SELECT/INSERT-only source privileges. The provider reauthorizes and locks the scoped session on every put/get. It supports uploaded CSV and XLSX only; there is no guessed Google/legacy file ownership. Existing SQL source ceiling is 2,000,000 bytes; encoded artifact ceiling 8,000,000; each encrypted chunk remains <=400,000 bytes. A real multi-chunk native case verifies exact round-trip bytes and the row bound. This is bounded source storage, not a huge file placed in a SQL row or a second authoritative store.

An explicit immutable identity binds company, project, session and source revision to uploader, actual byte SHA-256, source type, selected header/sheet and metadata digest. Its ownership MAC uses the existing server `QSA_IDENTITY_HMAC_KEY` domain; AES-GCM chunk encryption uses the existing identity encryption/key-version contract and full artifact scope. A content hash alone cannot forge uploader ownership. Same identity with changed content/selection/ownership is rejected; original command-ID retries return existing encrypted receipts and same revision retries reuse the artifact. Source bytes, encrypted chunks, checkpoint, consequences and original U05 receipt commit in one transaction. Interruption rolls everything back; no persistent external temporary upload exists to sweep. Committed evidence is not deleted or overwritten.

Private `sql-source-v1://<artifact-id>` locators remain inside the server/SQL artifact header. `GET /api/v2/projects/:projectId/imports/:sessionId/source/receipt` reauthenticates, rechecks actual bytes/provenance and returns only current session/version/state, artifact/revision IDs, digest and provider; no source bytes, object URI, credentials or generic SQL details. Missing source is 404, backend unavailable is 503, and authentication/authorization retains existing 401/403 contracts. U05's existing oversize error contract and all command envelopes are unchanged. Reads/retries cannot confer permission from a cached receipt.

Already committed isolated U05 artifacts are retained and readable through their original provider; the production provider refuses to relabel them or old Firestore references as production provenance. This is explicitly tested. Existing reviewed-source replacement rejection and immutable frozen execution/receipt rules remain unchanged.

### B. Independently approved migration evidence

`ApprovedFrozenExportSource` is actual server-only, read-only filesystem IO, not a test-only source oracle or a SQL destination scan. Configuration requires explicit absolute `sourcePath`, `mappingPath`, `headPath`, expected owner/source/approver/company/project identities and two distinct Ed25519 public keys. These are trusted deployment inputs, never browser request parameters or inferred resource locations. Private keys remain with the independent owner and mapping approver. No production paths, private keys or approved production dataset were supplied or read in this unit.

The owner-signed source payload carries source identity, frozen generation/watermark, scope, actual source-record bytes, explicit complete counts for every required category, exceptions and pending-command classification. Mapping approval separately binds each source path and its actual bytes to approved canonical target table/key/JSON bytes plus exact schema checksums. Every source record must be covered; conflicting target identities fail. Exact approved canonical row bytes are hashed without re-encoding financial/weight values. The adapter never fabricates legacy IDs or uses the SQL destination to manufacture export fingerprints.

Current owner-signed head authorization binds the same generation/watermark, source digest and mapping approval; it must remain active and unexpired, as must mapping approval. Signatures, source ownership, scope, completeness, actual counts, mappings and current authorization are reverified on reads. The immutable manifest identity includes source payload digest, generation/watermark, mapping digest, signed current authorization and trusted signer fingerprints; mutable filenames are only selectors. Packages have bounded reads (64 KB buffers, <=16 MB per file), no source URLs, and canonical/regular-file path checks. No package is written, moved or deleted by the production adapter.

All **52** existing inventory categories are mandatory, including account applications and the three governance receipt/history/access categories introduced by RB1. Counts, sorted unique keys, hashes, source frame, mapping approval, schema and SQL revisions feed the existing bounded comparison and actor-bound durable page receipts. Unknown, NOT_COMMITTED or unordered legacy commands and any exception remain blocked. Synthetic source kind stays SYNTHETIC and cannot establish production equivalence. `productionCutoverAuthorized` remains false even on a complete comparison.

Invalid or revoked source evidence now durably marks the relevant authorized readiness run BLOCKED instead of merely throwing before the run state changes. Source/destination boundary changes never repair, delete or rewrite omitted identities, relationships, Trip/weight/pricing/settlement history or receipts. Native tests match an independently constructed canonical company record against a real SQL page, replay its committed page after restart, then prove that omitted destination inventory blocks. The unchanged U09 complete synthetic comparison tests also pass. Neither result certifies a real production export.

## SQL Smart Import capability matrix after integration

| Capability | Result | Remaining boundary |
|---|---|---|
| Authenticated CSV/XLSX upload and safe source receipt | IMPLEMENTED; real React, API and PostgreSQL | Existing 2 MB / parser limits; explicit XLSX sheet and header |
| Duplicate/lost-ACK/restart recovery | IMPLEMENTED; original IDs/receipts and actual production-mode worker | Same existing secret/key version and durable database required |
| Principal/project switch during asynchronous file read | IMPLEMENTED; generation and selected-session fences before send | No raw source persisted in browser/outbox |
| Existing canonical review, human acceptance, frozen groups and receipts | PRESERVED; production-provider native and actual React journey verified | New source mapping/resolution UI is not declared complete |
| DISCOVERED -> mapping/resolution UI | EXPLICITLY BLOCKED | No allowlisted SQL source-column/row discovery and canonical resolution proposal DTO consumed by the existing UI |
| Legacy XLS, Google Drive/Sheets source intake | UNSUPPORTED by this provider | Requires separately authorized immutable remote ownership/source adapter; no mutable remote fetch/fallback |
| Independent frozen-export source reader | IMPLEMENTED and verified using real signed synthetic packages | Actual operator-approved production owner/source/mapping package and deployment still required |
| Production historical equivalence/cutover | NOT CERTIFIED / BLOCKED | Synthetic evidence cannot authorize it; independent owner gates remain |
| SQL Workspace | BLOCKED_RB4 | Existing sole writer/resource ownership adapter remains outside RB3 |

The precise remaining UI dependency is between `BoundedImportSourceRowVerifier`/`sourceMapping`/`bindSourceRows` and `SqlImportAuthority.checkpoint`/`facts`: the existing U05 authority requires an approved mapping and a source-bound canonical batch with authorized carrier/material/Driver/Truck resolutions. Existing U04 setup pages deliberately expose partial IDs/statuses, not complete canonical discovery profiles. RB3 does not invent those DTOs, normalize a legacy Firestore session into a command, bypass prepared-profile validation or claim a fresh source-to-completion journey. Existing supported persisted review stages use real SQL authority. Browser journey 09 supplies the established synthetic approved mapping/resolution through U05, then exercises the real existing React human-review and grouped execution controls using the production source provider.

## Required security/journey evidence

| Requirement | Measured proof |
|---|---|
| 1 valid immutable upload/readback | Native encrypted round-trip + browser 01 |
| 2 duplicate retry | Original command receipt and same-revision artifact reuse |
| 3 lost ACK | Actual post-commit HTTP disconnect + browser 03/06; one source POST |
| 4 changed bytes/same identity | Immutable rejection; owner MAC tamper rejection |
| 5 company/project isolation | Native authorized-own-scope cross-company/project probes and VIEWER denial |
| 6 revocation before execution | Current account suspension denies receipt/use/start; no cached authority |
| 7 restart | Separate Node worker in NODE_ENV=production + browser logout/fresh-context resume |
| 8 chunk interruption/missing/corrupt | Atomic rollback, real multi-chunk round trip, missing/digest corruption failures |
| 9 replacement after review | Existing immutable rejection; original artifact/signature unchanged |
| 10 supported CSV/Excel | Existing real CSV/XLSX parser, explicit sheet/header; unsupported formats rejected |
| 11 actual RB2 React intake | Browser 01–08 with actual App/SQL runtime production provider |
| 12 review/execution continuity | Native canonical groups/replay + browser 09 existing human review and grouped receipts |
| 13 independent manifest | Real Ed25519 owner/mapping verification; same signer forbidden; governance coverage required |
| 14 watermark drift | Current head mismatch/revocation/expiry rejected; even valid authorization renewal changes the pinned boundary and blocks readiness |
| 15 incomplete/mismatch | Source count/mapping/category checks and actual SQL missing-user mismatch |
| 16 reconciliation crash/resume | Durable first-page request replay with a new adapter/authority instance |
| 17 old/unordered intent | Export UNKNOWN/LEGACY_UNORDERED/NOT_COMMITTED blocked; unchanged U07 journal tests |
| 18 immutable historical values | Exact PostgreSQL text fingerprints for Trip/events/weights/pricing/settlements unchanged; U06 regressions |
| 19 production Firestore preservation | Unchanged RB2 production-root journey and unchanged bootstrap files |
| 20 no activation/provider writes | SQL-selected browser forbidden-request checks; no production main/epoch/Workspace writer changes |

## Exact final verification

| Gate | Result |
|---|---|
| New native PostgreSQL / authenticated API / signed export | 48/48 passed, 0 failed, 0 skipped |
| Actual React browser (9 RB3 + 27 unchanged RB2) | 36/36 passed, 0 failed, 0 skipped |
| Unchanged full U01–U09/RB1 native selection | 480/480 passed, 0 failed, 0 skipped |
| U07 53 + U09 browser 6 + U08 29 | 88/88 passed, 0 failed, 0 skipped |
| RB2 principal/session | 6/6 passed, 0 failed, 0 skipped |
| Independent authority | 148/148 passed, 0 failed, 0 skipped |
| Fresh exact-RB2 history (135 files) | 2402/2494 passed, 92 failed, 0 skipped |
| Candidate identical history selection | 2402/2494 passed, 92 failed, 0 skipped |

Baseline export was byte-verified against all **1,496** published RB2 blobs with LF checkout bytes, external unchanged dependencies, no overlays and no assertion edits. Baseline/candidate have identical 92 failed assertion identities, 12 identical suite-load failures and 2 unhandled errors. Historical tests remain failing; exact new failed identities and new suite-load identities are **zero**. TypeScript **446 -> 446**, zero added/removed semantic diagnostics after location normalization, lint **NOT PASS** (exit 2). Production build and full/staged diff checks **PASS**. Existing CI jobs include the three new RB3 suites; no independent remote Linux success is claimed.

The initial native attempt found the pre-existing test PostgreSQL cluster stopped (its log recorded a clean shutdown). No provider test ran in that attempt. Its data directory/startup witness were verified, then only that existing localhost test service was restarted; version PostgreSQL 17.6, listen address 127.0.0.1, port 55439. Final native suites have no skipped cases. Early new fixture expectations were corrected to the existing U05 replacement, authentication-error and status-envelope contracts; existing assertions were never changed. Earlier raw unavailable/error-shape and browser evidence is retained separately. Final verification uses the production provider implementation, including a separate NODE_ENV=production worker, not promotion of the isolated test adapter.

Full SQL, U07 integration and per-test native/browser fixtures use distinct fresh isolated databases. Migrations 001–012 all apply/verify with bytes unchanged; no inventory assertion or migration addition was needed. Raw local evidence is outside the commit in `C:/Users/Hp/Documents/ChatGPT/Work Follow/rb3-{native,browser,sql,u07-u08,session,148,baseline-history,history}.json` and matching logs, `rb3-{baseline-lint,lint,build}.log`, migration/startup logs, `rb3-baseline-proof.json`, and exact `rb3-final-evidence.json`. The service-unavailable attempt and `rb3-native-before-error-shape-fix.*`/`rb3-browser-before-production-review.json` are not relabeled as final passes.

## Exact changed-file inventory

- `.github/workflows/ci-foundation.yml`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/16_AR2_U09_RUNTIME_CUTOVER_READINESS.md`
- `docs/reconstruction/19_AR2_U09_RB3_IMMUTABLE_SOURCE.md`
- `server/sqlImportRoutes.ts`
- `server/sqlRuntimeRoutes.ts`
- `src/components/import/SqlImportJourney.tsx`
- `src/db/approvedFrozenExport.ts`
- `src/db/importArtifacts.ts`
- `src/db/importAuthority.ts`
- `src/db/runtimeReadinessAuthority.ts`
- `src/db/sqlImportSourceStore.ts`
- `src/i18n/sqlRuntime.ts`
- `src/tests/ar2U09Rb3Browser.test.ts`
- `src/tests/ar2U09Rb3Export.test.ts`
- `src/tests/ar2U09Rb3Source.test.ts`

Historical failed-identity SHA-256 (sorted filename + full test name): `c79985dbd70ee0c53692bee5884abe57d959e12e4adb193178289dc6aebfadbe`; baseline identical.

## Remaining operational / RB4 / cutover prerequisites

Before any production use, the operator must provision/verify the existing PostgreSQL persistence/backups/restore and existing identity key lifecycle, configure private frozen package paths and independently registered owner/mapping public keys, and supply an actually approved frozen source, canonical mapping and current authorization. Filesystem confidentiality/ACLs and package retention are deployment responsibilities; no live source inventory or production equivalence was certified here. These are explicit prerequisites, not guessed resources or test keys installed as production.

RB4 still owns SQL Workspace resource/binding/grant/revision/delivery integration with the sole existing Google writer and original IDs. Interactive mapping/resolution and unsupported remote/legacy formats, independent production source reconciliation, Linux CI/live Firebase/Rules/IAM/drain/Google/device/load/restore/cutover acceptance and owner approval remain open. No production file movement, credential expansion, new cloud resource, data rewrite, PR, merge, deployment, production migration or SQL activation occurred. Overall U09 remains **BLOCKED**.
