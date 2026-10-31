# PHASE LEDGER
## Single Current Reconstruction State Authority

Historical P9-U1 implementation checkpoint: P8-B4 merge PR #61 at `31b2065f00b0d07763afc153582ef9be71dbd159` contains `71abdcd3b586be486e6aec74f8ad9e32c868eae9`. Phase 8 is MERGED / SOURCE_VERIFIED / CLOSED. Phase 9 is IN_PROGRESS with P9-U1 IMPLEMENTED / VERIFIED LOCALLY; Phase 10 is NOT_STARTED. Source/browser evidence is not live deployment certification.

Historical Phase-8 implementation checkpoint: P8-B3 merged through PR #60; source lineage includes `ed5688c81e95952d69a21e8fbacae4c0095967c4`. P8-B4 is IMPLEMENTED / VERIFIED LOCALLY from merged main `8c6a348d17b0f94215a56bb9a66f2e643c19f24c`. Phase 8 is IMPLEMENTATION COMPLETE / AWAITING MERGE; Phase 9 NOT_STARTED. Prior checkpoints below are dated historical evidence.

Historical pre-publication P8-B3 checkpoint: `1f7f3344e65dfc9b6837b10cb5349827da1587eb`. Phase 8 — Smart Import Persistence, Resume & Commit Integrity is active; P8-B3 — Recovery, Receipts & Execution Safety is locally implemented and owner-review accepted locally; publication is NOT_STARTED. P8-B1 and P8-B2 source implementations are merged and present. P8-B4 remains NOT_STARTED. This implementation record does not close P8-B3 or Phase 8, and does not invent closure evidence for intervening phases. Phase 0 freeze and previously recorded closures remain unchanged.

Historical phase-transition context (before the owner-authorized subsequent implementation batches): Current verified GitHub main before this documentation transition: `e09cd613d93d3e6519fe1dc283caf96d4363bcec` (PR #35). Phase 0 remains VERIFIED / CLOSED / FROZEN; Phase 1 is VERIFIED / CLOSED; Phase 2 — Persistence & Server Authority and P2-U1 through P2-U4 are VERIFIED / CLOSED. By explicit owner instruction to proceed, Phase 3 — Authentication, Authorization & Administrative Governance is IN_PROGRESS at governance level. ACTIVE_UNIT is UNASSIGNED / REQUIRES_PHASE_3_AREA_AUDIT. NEXT_ACTION: PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT.
Historical P8-B2 checkpoint: `1f7f3344e65dfc9b6837b10cb5349827da1587eb` (PR #58 — P8-B2 merged and independently source-verified). Phase 0 remains VERIFIED / CLOSED / FROZEN; Phases 1–2 remain VERIFIED / CLOSED. The current reconstruction track has advanced through the accepted Phase 3–6 source work and Phase 7 Smart Import Core source closure. The Smart Import pre-Phase-8 correction gate (SI-CG1 + SI-CG2) is CLOSED. Phase 8 — Smart Import Persistence, Resume & Commit Integrity is IN_PROGRESS. P8-B1 and P8-B2 are VERIFIED / CLOSED. ACTIVE_UNIT is P8-B3 — Durable Execution Journal & Recovery, status NOT_STARTED. NEXT_ACTION: P8_B3_BOUNDED_IMPLEMENTATION_DEFINITION.

This is the sole current source for phase, active/next unit, accepted units, and the routing of open debt and execution rules. Other documents support this ledger; historical reports and Studio snapshots cannot advance its pointers. Closure requires accepted evidence and explicit owner authority. P0-A0 through P0-U6 retain their recorded closures; the owner explicitly approved the P0-U7 governance/freeze closure implemented below. Its reviewed documentation publication has since merged through PR #9; the verified GitHub facts supplied by the owner and the merge present on main establish the publication record below.

- **Open debt authority**: [Decision and Debt Log](05_DECISION_AND_DEBT_LOG.md); classifications and owners live there, not in competing ledgers.
- **Execution rules**: [Streamlined Reconstruction Execution Method](STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md) is the current delivery-method authority, supported by [Document Authority](DOCUMENT_AUTHORITY.md), [Unit Protocol](03_IMPLEMENTATION_UNIT_TEMPLATE.md), and [Verification Gate](04_VERIFICATION_AND_PUSH_GATE.md). It supersedes older multi-audit/micro-unit continuation patterns for future work while preserving high-risk gates.
- **Phase-transition authority**: the accepted [Foundational Plan](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md) remains the phase sequence authority. The Phase 2 closure / Phase 3 activation evidence below is historical and remains scoped to its recorded period; it does not override the current active-state block above.
- **Phase-transition authority**: the accepted [Foundational Plan](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md) defines phase ownership and ordering. Current active pointers are the YAML block and latest dated checkpoint in this ledger. Older Phase 2→3 activation records below are historical evidence only and do not override the current active-state block.
- **P0-U3 / P0-U4** remain **VERIFIED / CLOSED**; this documentation unit does not reopen them.

Historical pre-PFAG checkpoint: P9-U1 is merged through PR #62 at `303469ef29b7cf906964316691e491c0df6d5e45`, containing `3d7aa9a0a09210e409fc554fe7a02a8446a625ee`. P9-U2 implementation is owner-authorized; exact state follows. Phase 10 is NOT_STARTED.

### PFAG-GWS1 local source checkpoint — 2026-10-31

PFAG-RB2 merged at `093b75b6889ec2b592d9af022f38f15ad039da3e`; Project Foundation source assurance is MERGED / SOURCE_VERIFIED / CLOSED with recorded debt preserved. PFAG-GWS1 implements native-template provisioning, durable binding/recovery evidence and a canonical-input projection outbox. See [the sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) for exact mapping, authority boundaries, verification and limitations. Local source verification does not establish live Google acceptance. GWS-OAUTH-PROD-01, GWS-LIVE-01 and the documented hard-crash sync-fence reconciliation limitation remain open; PFAG-OPS-01 is the separate next foundation intake/readiness issue. Phase 10 remains NOT_STARTED.

### GWS-LIVE-01A local checkpoint — 2026-10-31

Merged GWS1 baseline: `cfd4e96fe25a938a726e92356541233915c0e571`, containing `78a2869c8766b05c5c6dabd45bf1ff254e8e0b1c`. Workspace permission acquisition is isolated from Firebase application sign-in/reauthentication. Token-free intent/generation checks fence genuine Project/account/scope changes; durable Workspace status outranks stale compatibility IDs. Source and controlled verification are recorded in the sync contract. GWS-LIVE-01 is not passed; deployed configuration, real OAuth/Picker, template/formula/Apps Script and controlled live-row acceptance remain unverified. GWS-SYNC-AUTONOMY-01 and PFAG-OPS-01 remain OPEN; Phase 10 remains NOT_STARTED.

### GWS1B blueprint correction — 2026-10-31

The owner superseded hidden-template copying. New provisioning selects only a destination folder, then generates a native workbook and bound script from a versioned compiled asset using human-user OAuth. The owner supplied Projects_Tamplate.xlsx and nine real Script files. GWS1B-LOCAL-01 approves local-source capture instead of Google capture. GWS1B-TRIGGER-01 supersedes installable/timer dependencies: only onOpen/onEdit are automatic, report structures are born clean through the compiled blueprint, and routed edit refreshes require no remote installer execution. SABIL-HAIL-V1 is locally captured and sanitized; Google deployment/runtime acceptance remains separate. Prior GWS1/template descriptions are historical where superseded by [the current sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md). No publication, GWS2 or Phase 10 is authorized by this checkpoint.

### GWS1B-LIVE-01 — PWA generation convergence — 2026-10-31

Verified merged GitHub main: `a38c0b00e581638169f8740816f9a4646c30dbe0` (PR #68), containing GWS1B `0e2809370a1b3128a47e4d56deff4fff12f93d2f`. Owner reports retired-template HTTP behavior after Render redeploy: classification PWA_DEPLOYMENT_SPLIT_BRAIN, consistent with old client/new server. Production URL/browser/profile/cache were not independently available; no claim of a live Render trace or fresh live Google acceptance.

Bounded local correction adds one artifact build identity, public no-store runtime-version endpoint, exact-generation Workspace command fences, explicit registerSW activation/reload handling and a guarded legacy-client Workbox migration. Offline shell stays available; old precache revisions are cleaned through Workbox. Current setup errors and relevant previous sync issues are distinct; superseded template errors are not current business guidance. Persistence/audit evidence is unchanged. Google scopes, destination writability, blueprint, Apps Script and Firebase/RBAC semantics are untouched. Source/control verification supports owner review, not deployed certification. Exact protocol and limitations: [the continuity contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md).

### Current Active State
```yaml
ACTIVE_PHASE: PRE_PHASE_10_FOUNDATION_ASSURANCE
ACTIVE_PHASE_STATUS: IN_PROGRESS
PHASE_8_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
PHASE_9_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
PROJECT_FOUNDATION_ASSURANCE: MERGED / SOURCE_VERIFIED / CLOSED
ACTIVE_UNIT: GWS1B-LIVE-01 — PWA Deployment Version Convergence
ACTIVE_UNIT_STATUS: IMPLEMENTED / VERIFIED LOCALLY / AWAITING_OWNER_REVIEW
ACTIVE_UNIT_TYPE: BOUNDED_PWA_GENERATION_CONVERGENCE
P8_B1_SOURCE: MERGED / PRESENT
P8_B2_SOURCE: MERGED / PRESENT
P8_B3_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P8_B3_LOCAL_REVIEW_GATE: ACCEPTED_LOCALLY
P8_B3_PUBLICATION_STATUS: MERGED / VERIFIED
P8_B3_VERIFIED_MERGE: 8c6a348d17b0f94215a56bb9a66f2e643c19f24c
P8_B4_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P8_B4_VERIFIED_MERGE: 31b2065f00b0d07763afc153582ef9be71dbd159
P9_U1_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P9_U1_VERIFIED_MERGE: 303469ef29b7cf906964316691e491c0df6d5e45
P9_U2_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P9_U2_VERIFIED_MERGE: f261ebc5508d881c9bfbe3dc77af1ccad75ec914
PFAG_RB1_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
PFAG_RB1_VERIFIED_MERGE: f56418f3ae16cbe2f2d4c726a0590d26bd6e2310
PFAG_RULES_01_STATUS: OPEN / VERIFICATION_DEBT
FIRESTORE_RULES_RUNTIME_VERIFICATION: DEFERRED_ENVIRONMENT_BLOCKED
PFAG_RB2_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
PFAG_RB2_VERIFIED_MERGE: 093b75b6889ec2b592d9af022f38f15ad039da3e
PFAG_GWS1_STATUS: MERGED / SOURCE_VERIFIED
PFAG_GWS1_VERIFIED_MERGE: cfd4e96fe25a938a726e92356541233915c0e571
GWS_LIVE_01A_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
GWS_LIVE_01A_VERIFIED_MERGE: ca63d9f61fb4cac6ae0c6089ef8639691b1117b4
GWS1B_STATUS: MERGED / SOURCE_VERIFIED
GWS1B_VERIFIED_MERGE: a38c0b00e581638169f8740816f9a4646c30dbe0
GWS1B_LIVE_01_STATUS: IMPLEMENTED / VERIFIED LOCALLY / AWAITING_OWNER_REVIEW
GWS1B_PUBLICATION: MERGED / VERIFIED
GWS1B_SOURCE_CAPTURE_METHOD: OWNER_PROVIDED_XLSX_PLUS_SCRIPT_SOURCE
GWS1B_TRIGGER_MODEL: SIMPLE_ONEDIT_DISPATCHER / INSTALLABLE_NONE
GWS_LIVE_01_STATUS: READY_TO_RESUME_AFTER_MERGE_DEPLOY / NOT_YET_PASSED
GWS_SYNC_AUTONOMY_01: OPEN
PFAG_OPS_01: OPEN
GOOGLE_WORKSPACE_LIVE_ACCEPTANCE: PENDING_PWA_CONVERGENCE_THEN_SEPARATE_GOOGLE_ACCEPTANCE
FOUNDATION_SOURCE_ASSURANCE: PASS_WITH_DEBT
PFAG_CRITICAL_OPEN: 0
PFAG_HIGH_OPEN: 0
PHASE_10_STATUS: NOT_STARTED
P8_B4_PUBLICATION_GATE: MERGED / VERIFIED
P8_B3_BASELINE: 1f7f3344e65dfc9b6837b10cb5349827da1587eb
PHASE_0_STATUS: VERIFIED / CLOSED / FROZEN
PHASE_1_STATUS: VERIFIED / CLOSED
PHASE_2_STATUS: VERIFIED / CLOSED
P2_U1_STATUS: VERIFIED / CLOSED
P2_U1_VERIFIED_MERGE: ff5dc79cb380a8ea2713eb539f6cad326407ea16
P2_U1_PR: 32
P2_U2_STATUS: VERIFIED / CLOSED
P2_U2_VERIFIED_MERGE: fafbadd90a37988ad97d18a4cfa3191532307255
P2_U2_PR: 33
P2_U2_FIRESTORE_RULES_DEPLOYMENT: PUBLISHED_AND_SMOKE_VERIFIED
P2_U3_STATUS: VERIFIED / CLOSED
P2_U3_VERIFIED_MERGE: 48c016e790dbc6f1b64e09cbc22ef60e78743d1c
P2_U3_PR: 34
P2_U4_STATUS: VERIFIED / CLOSED
P2_U4_VERIFIED_MERGE: e09cd613d93d3e6519fe1dc283caf96d4363bcec
P2_U4_PR: 35
PHASE_2_OWNER_CLOSURE_DECISION: APPROVED_BY_PROCEED_INSTRUCTION
PHASE_3_OWNER_ACTIVATION_DECISION: APPROVED_BY_PROCEED_INSTRUCTION
PHASE_3_STATUS: COMPLETED / ACCEPTED_HISTORY
PHASE_4_STATUS: SOURCE_CLOSED
PHASE_5_STATUS: SOURCE_CLOSED
PHASE_6_STATUS: SOURCE_CLOSED
PHASE_7_STATUS: SOURCE_CLOSED
SI_CG1_STATUS: MERGED / SOURCE_VERIFIED
SI_CG2_STATUS: MERGED / SOURCE_VERIFIED
PRE_PHASE_8_CORRECTION_GATE: CLOSED
P8_B1_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P8_B1_VERIFIED_MERGE: 4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5
P8_B2_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P8_B2_VERIFIED_MERGE: 1f7f3344e65dfc9b6837b10cb5349827da1587eb
NEXT_UNIT: NONE_ASSIGNED
NEXT_ACTION: OWNER_REVIEW_PWA_CONVERGENCE_THEN_MERGE_DEPLOY_AND_RESUME_SEPARATE_GWS_LIVE_ACCEPTANCE
CURRENT_CODE_BASELINE: a38c0b00e581638169f8740816f9a4646c30dbe0
EXECUTION_METHOD: STREAMLINED_PHASE_BATCH_METHOD
EXECUTION_METHOD_AUTHORITY: docs/reconstruction/STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md
HISTORICAL_USER_ROLE_CONVERGENCE_STATUS: PHASE_3_AUDIT_REQUIRED / NOT_REASSESSED_IN_P8_B3
HISTORICAL_WIZARD_ROLE_STATUS: PHASE_3_AUDIT_REQUIRED / NOT_REASSESSED_IN_P8_B3
HISTORICAL_VALIDATOR_ROLE_STATUS: PHASE_3_AUDIT_REQUIRED / NOT_REASSESSED_IN_P8_B3
HISTORICAL_AUTHENTICATED_USER_ROLE_STATUS: PHASE_3_AUDIT_REQUIRED / NOT_REASSESSED_IN_P8_B3
```


### Historical P8-B2 checkpoint retained from the PR #59 documentation merge

The following is pre-B3 history, not an active pointer.

```yaml
ACTIVE_UNIT: P8-B3_DURABLE_EXECUTION_JOURNAL_AND_RECOVERY
ACTIVE_UNIT_STATUS: NOT_STARTED
ACTIVE_UNIT_TYPE: BOUNDED_HIGH_RISK_SERVER_COMMIT_RECOVERY
PHASE_0_STATUS: VERIFIED / CLOSED / FROZEN
PHASE_1_STATUS: VERIFIED / CLOSED
PHASE_2_STATUS: VERIFIED / CLOSED
PHASE_7_STATUS: SOURCE_CLOSED
SMART_IMPORT_MASTER_DESIGN_STATUS: ACCEPTED_AFTER_BOUNDED_CORRECTION
SI_CG1_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
SI_CG2_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
PRE_PHASE8_CORRECTION_GATE: CLOSED
P8_B1_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P8_B1_PR: 57
P8_B1_VERIFIED_MERGE: 4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5
P8_B2_STATUS: MERGED / SOURCE_VERIFIED / CLOSED
P8_B2_PR: 58
P8_B2_IMPLEMENTATION_COMMIT: 6b56d2def2f02aae1d60b5a7d3352210cc584931
P8_B2_VERIFIED_MERGE: 1f7f3344e65dfc9b6837b10cb5349827da1587eb
P8_B3_STATUS: NOT_STARTED
NEXT_UNIT: P8-B3_DURABLE_EXECUTION_JOURNAL_AND_RECOVERY
NEXT_ACTION: P8_B3_BOUNDED_IMPLEMENTATION_DEFINITION
CURRENT_CODE_BASELINE: 1f7f3344e65dfc9b6837b10cb5349827da1587eb
CURRENT_TS_DIAGNOSTICS_BASELINE: 440
LINT_STATUS: EXIT_2_NOT_PASS_HISTORICAL_DEBT
P8_B2_NEW_TEST_FAILURES: 0
P8_B2_REMAINING_FOCUSED_FAILURES: HISTORICAL_C5_38_61_62_67
P8_B1_LIVE_FIREBASE_ACCEPTANCE: NOT_CLAIMED
P8_B2_LIVE_FIREBASE_ACCEPTANCE: NOT_CLAIMED
PHASE8_REVIEWED_INTENT_HANDOFF_FENCE: PRESERVED_FOR_LEGACY_RAW_ROW_PATH
EXECUTION_METHOD: STREAMLINED_PHASE_BATCH_METHOD
EXECUTION_METHOD_AUTHORITY: docs/reconstruction/STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md
```


### Historical P8-B2 Smart Import Checkpoint — 2026-10-28

The Smart Import track was deliberately paused before Phase 8 for a master design and historical-failure review. The review established the binding product model: **External Source → Human-Reviewed Canonical Intent → Canonical Commit**, with layered identity/participation/affiliation resolution, unique-group human decisions rather than row-by-row review, no fuzzy-match authority, no duplicate Master Data authority, no raw-row reinterpretation after semantic review, and explicit durable resume/recovery boundaries.

The bounded pre-Phase-8 corrections are closed:
- **SI-CG1 — Identity, Grouping & Provenance Correction**: fixed natural-identity grouping precedence, rejected-row exclusion, Material-optional roster mapping and factual source-row provenance.
- **SI-CG2 — Layer & Contextual Creation Convergence**: converged contextual Carrier/Material/Driver/Truck resolution onto canonical application capabilities, separated Create / Enroll / Reactivate / Affiliation, preserved PREPARED_NEW semantics and prevented hidden temporal side effects.

**P8-B1 — Durable Session & Reviewed Intent Authority** is VERIFIED / CLOSED. PR #57 merged at `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`. It established schema-v2 durable session authority, server lifecycle validation, source and mapping revisions, first-class durable reviewed intent, version fencing, safe source reattach and chunked large-session artifacts. The initial implementation draft introduced 86 regressions; the recovery pass reduced newly introduced failures to zero before publication. P8-B1 does not claim live Firebase acceptance.

**P8-B2 — Server Commit Authority & Prepared Identity Materialization** is VERIFIED / CLOSED. Implementation `6b56d2def2f02aae1d60b5a7d3352210cc584931`, PR #58, verified merge/current main `1f7f3344e65dfc9b6837b10cb5349827da1587eb`. The dedicated reviewed-intent commit endpoint consumes the durable reviewed artifact, rebuilds the current canonical intent from current Project Fleet context, fails closed on stale semantics, materializes PREPARED_NEW Driver/Truck identities using canonical identity semantics, reuses existing participation and temporal authorities, and publishes identity/membership/affiliation/temporal consequences plus receipt/audit/session-COMMITTED truth in one bounded Firestore transaction. The legacy raw-row roster committer remains fenced by `PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`. Normal checkpoint PATCH cannot directly commit a roster session.

P8-B2 verification reported baseline 722/726 and final 772/776 with 50/50 new P8-B2 tests, zero new failures, Build PASS, diagnostics 440→440 and lint EXIT 2 / NOT PASS unchanged. The four remaining focused failures are historical C5 cases 38, 61, 62 and 67. Controlled browser verification was 4/4; live Firebase acceptance was not claimed.

**Next bounded unit: P8-B3 — Durable Execution Journal & Recovery.** P8-B3 must extend recovery beyond the single bounded atomic commit without weakening the exact reviewed-intent authority, durable P8-B1 bindings or P8-B2 canonical execution semantics. It must not reintroduce raw-row commit authority or silently reinterpret reviewed consequences.


### Phase 2 Closure / Phase 3 Activation — 2026-10-24

Phase 2 closed after four accepted bounded units. P2-U1 established durable Firebase Admin persistence selection; P2-U2 hardened the Firestore trust boundary and was completed by publishing the rules plus owner smoke verification; P2-U3 enforced project-scoped storage isolation with durable migration reservations; P2-U4 normalized active Firestore read/write representation boundaries and closed remaining direct raw domain returns. No Phase-2-owned Beta 2 blocker remains known. Repository-wide diagnostics baseline 445 and lint EXIT 2 remain global debt and are not Phase 2 blockers.

Phase 3 is now governance-active under the accepted foundational scope: RBAC, token verification, field-level authorization, IDOR defense and administrative controls. The first action is one broad `PHASE_3_AUTHORIZATION_GOVERNANCE_AUDIT`, not a micro-unit audit. It must include the Phase-1 deferrals for wizard role subset, UserValidator accepted-role semantics and server `AuthenticatedUser.role`, while preserving intentional context subsets unless the audit proves a semantic defect.

---

### Phase 0 Unit Sequence & Status

| Unit ID | Unit Title | Status | Baseline / Verified Commit |
|---|---|---|---|
| **P0-A0** | Studio Artifact Bootstrap | **CLOSED** | `118cdc1730d0a08848463da915a0315c2ac542f2` |
| **P0-U1** | Governance & Evidence Baseline | **CLOSED** | `674c6a5a5cf1aa1680c43728aa67e1e0fd3170de` |
| **↳ P0-U1R** | Governance Semantic Convergence | **VERIFIED / CLOSED** | `674c6a5a5cf1aa1680c43728aa67e1e0fd3170de` |
| **P0-U2** | Canonical Toolchain & Dependency Reproducibility | **CLOSED** | `715345bba8688fa706fce1bac7add78a9c5e8a28` |
| **↳ P0-U2A** | Canonical Toolchain & Dependency Audit | **AUDIT_COMPLETE / CLOSED** | `674c6a5a5cf1aa1680c43728aa67e1e0fd3170de` |
| **↳ P0-U2B** | Canonical Toolchain & Dependency Implementation | **VERIFIED / CLOSED** | `715345bba8688fa706fce1bac7add78a9c5e8a28` |
| **↳ P0-U2C** | Post-Push Toolchain Contract Completion & Closure | **CLOSURE_RECORD** | `715345bba8688fa706fce1bac7add78a9c5e8a28` |
| **P0-U3** | Test Taxonomy & Harness Convergence | **VERIFIED / CLOSED** | `6b16fc367bf5b75b84550459fb85ce86dc873df0` |
| **↳ P0-U3A** | Test Taxonomy & Harness Convergence Audit | **AUDIT_COMPLETE / CLOSED** | `715345bba8688fa706fce1bac7add78a9c5e8a28` |
| **↳ P0-U3B** | Canonical Test Taxonomy & Active Test Manifest | **VERIFIED / CLOSED** | `d362fa58b0816644a7a176dd6e8d6e929224c942` |
| **↳ P0-U3C1** | Active Test Failure-Propagation Convergence (dataCleanupBlock82) | **VERIFIED / CLOSED** | `d4941302663e145926909b62851e591a9bb8a944` |
| **↳ P0-U3C2** | Active Test Harness Convergence (runtimeDefaultDataElimination92A) | **VERIFIED / CLOSED** | `fed89c60728ee29e3607ff4ef96c4c28c85580ec` |
| **↳ P0-U3C3** | Active Test Harness Convergence (runtimeEmptyStateBlock82B) | **VERIFIED / CLOSED** | `6c866aae83144519b43e97808b9333435cd32c8b` |
| **↳ P0-U3C4** | Active Test Harness Convergence (runtimeProjectMasterDataEmptyStateBlock82D) | **VERIFIED / CLOSED** | `0684173a521817a7f1c7343df0c77bb80d52d022` |
| **↳ P0-U3C5** | Active Test Harness Convergence (translationQualityFixesBlock84A) | **VERIFIED / CLOSED** | `043c36bd4b6c1ee50bbb1a44b71530f6aba52e89` |
| **↳ P0-U3C6** | Active Test Harness Convergence (qualityPilotBlock57) — *P0-U3C6A semantic reconciliation (Option B)* | **VERIFIED / CLOSED** | `dc6a7d4bd79c86889ac23e6e0cdc24412e7599ee` |
| **↳ P0-U3C7** | Active Test Harness Convergence (projectFormDateUx86F) | **VERIFIED / CLOSED** | `dfcab325437081d35bc27ecfe60dc2729d69ec36` |
| **↳ P0-U3C8** | Active Test Harness Convergence (firebaseProjectConfiguration85A) | **VERIFIED / CLOSED** | `9679cf1a371c151e4259c155b9139d327ddd7bc2` |
| **↳ P0-U3C9** | Active Test Harness Convergence (uiuxFixesBlock83A) — *P0-U3C9A semantic blocker resolved by approved OPTION_B* | **VERIFIED / CLOSED** | `b3fc674ea45783fc570604adee6d3a03e5825d8d` |
| **↳ P0-U3C10** | Active Test Harness Convergence (i18nFoundation) | **VERIFIED / CLOSED** | `3af9425df1a18483880cd8bf0d5a15c192634abe` |
| **↳ P0-U3C11** | Active Test Harness Convergence (block102OperationalAccessSmartRoster) — *P0-U3C11A blocker resolved by approved disposition: KEEP_GROUPS_1_TO_4_AND_DEFER_GROUP_5* | **VERIFIED / CLOSED** | `94b16246c0c03737e2e38cd430a7a4ed3c5a7bb4` |
| **↳ P0-U3C12** | Active Test Harness Convergence (runtimeKeyAudit) — *P0-U3C12A blocker resolved by approved disposition: KEEP_TEST_AND_REPLACE_STALE_DISCOVERY_WITH_CURRENT_SOURCE_SCAN and bounded remediation of the single confirmed live missing key* | **VERIFIED / CLOSED** | `c31d15adc4d455cfb216ad0f3c76114933150aa6` |
| **↳ P0-U3C13** | Active Test Harness Convergence (runtimeSmokeBlock55) — *P0-U3C13A blocker resolved by approved disposition: KEEP_ALL_7_WITH_CURRENT_DYNAMIC_CONTRACTS* | **VERIFIED / CLOSED** | `dc938100e83bce6f8eedede07b67d740efb1d13e` |
| **↳ P0-U3C14** | Active Test Harness Convergence (switcherAndQualityBlock56) — *P0-U3C14A/C14B blockers resolved by approved complete remediation: KEEP_SWITCHER_AND_REBUILD_QUALITY_GATES + COMPLETE_49_KEY_EN_UR_REMEDIATION* | **VERIFIED / CLOSED** | `a8f5dec0efe0f486707900ffaab4f32da04aac61` |
| **↳ P0-U3C15** | Active Test Harness Convergence (qualityExpansionBlock58) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `cd4538d46a22a6fe3ff1012430b7933304d59b83` |
| **↳ P0-U3C16** | Active Test Harness Convergence (qualityExpansionBlock59) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `5940422585fd7eab6ad9782e9ffeee8ae5b787f2` |
| **↳ P0-U3C17** | Active Test Harness Convergence (qualityTranslationBlock61) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `51f82f404c2b9af56d879141fabf586f5351bdc3` |
| **↳ P0-U3C18** | Active Test Harness Convergence (qualityExpansionBlock62) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `eaf8e47d625c2b037e71028c0553ab5e8adfaf1f` |
| **↳ P0-U3C19** | Active Test Harness Convergence (qualityExpansionBlock63) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `ccdc563fa2327e06ba6548bda232b993c7a2e7f4` |
| **↳ P0-U3C20** | Active Test Harness Convergence (qualityExpansionBlock64) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `d7b5ec30e39f75277a375b62aec59a28424c1791` |
| **↳ P0-U3C21** | Active Test Harness Convergence (qualityExpansionBlock65) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `171f945a85808971df39492d57697363e8751479` |
| **↳ P0-U3C22** | Active Test Harness Convergence (qualityExpansionBlock66) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_BATCH_ASSERTIONS* | **VERIFIED / CLOSED** | `3a8ae7f6dbbd0dc22c2f14e98945e85e7605da4c` |
| **↳ P0-U3C23** | Active Test Harness Convergence (humanReviewGovernanceBlock67) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `e175d13c51560974356aeea70f351279ecf46f99` |
| **↳ P0-U3C24** | Active Test Harness Convergence (humanReviewDecisionBlock68) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `d42506492b917f233dd73219bdc14528dfd20a44` |
| **↳ P0-U3C25** | Active Test Harness Convergence (humanReviewApprovalBlock69) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `8d5c14d0de10e3e58d28248fbf7407b2dbf84896` |
| **↳ P0-U3C26** | Active Test Harness Convergence (humanReviewReconciliationBlock69A) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `f3e66f3f6db12f0087eb2492c3f9479f1c3c57c7` |
| **↳ P0-U3C27** | Active Test Harness Convergence (humanReviewApplicationBlock70Corrected) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `a3b2cd241fad9277027898d6502d356475f330eb` |
| **↳ P0-U3C28** | Active Test Harness Convergence (uiuxAuditBlock72) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `19572d57012c661ed626317ce67b749606dcac6e` |
| **↳ P0-U3C29** | Active Test Harness Convergence (uiuxP1FixesBlock73) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `45c27fa2b6112bf15159ce6a3b6679ce0ccaa81c` |
| **↳ P0-U3C30** | Active Test Harness Convergence (uiuxP2FixesBlock74) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `c97bddda6c15f66b7e11a3aa2656a92366151abd` |
| **↳ P0-U3C31** | Active Test Harness Convergence (uiuxP3FixesBlock75) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `e02285431d1477954465029f205de575b9325898` |
| **↳ P0-U3C32** | Active Test Harness Convergence (finalUiArchitectureBlock76) — *KEEP_SELECTED_GOVERNANCE_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `53b858ee95959cd36c2e97e85ac5cce58a20008c` |
| **↳ P0-U3C33** | Operational Surface & Navigation Harness Convergence Batch (Blocks 77 / 80 / 81) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `dc35471410a7163122397247359a7a829a993804` |
| **↳ P0-U3C34** | Authentication & Project Workspace Harness Convergence Batch (86B / 87 / 88) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `3f5e24f2e0f98a42fe8232aceea481f464e68c0d` |
| **↳ P0-U3C35** | Security Trust & Offline Trip Numbering Harness Convergence Batch (89B / Server Auth Trust Boundary) — *KEEP_SELECTED_GATES_AND_RETIRE_HISTORICAL_ASSERTIONS* | **VERIFIED / CLOSED** | `7de361b9367d708d39e9bb1f1b1f79d739fe7231` |
| **↳ P0-U3C36** | I18N Legacy Test Suite Vitest Convergence Batch — *KEEP_CURRENT_CONTRACTS_AND_ISOLATE_GENERATED_ARTIFACTS* | **VERIFIED / CLOSED** | `0eb0938668147704a84f3123b32a0031813af562` |
| **↳ P0-U3C37** | Excel/CSV Import Harness Convergence — *KEEP_ALL_CURRENT_IMPORT_CONTRACTS* | **VERIFIED / CLOSED** | `4f85fc340c659e5867e853fe35fb3787bee8aacf` |
| **↳ P0-U3C38** | Active Runtime I18N Cardinality Invariant Retirement — *REPLACE_FIXED_1128_WITH_DYNAMIC_TRILINGUAL_PARITY* | **VERIFIED / CLOSED** | `cb2e84c1563190d28b6a25024d1ee656b10a42b2` |
| **P0-U4** | Root Tooling Hygiene | **VERIFIED / CLOSED** | `45e6c8b7f7c038d2a05723e4df7a5655bfaabc15` |
| **P0-U5** | Documentation Authority Convergence | **VERIFIED / CLOSED** | Independently verified merge: `15529b85848a80322dea033e80903fd2fd1e294c` |
| **P0-U6** | Secret-Free GitHub CI Baseline | **VERIFIED / CLOSED** | Independently audited merge: `54f6d829c184a371e96c2812b08738c42280552b`; corrected PR and post-merge main run #3 verified |
| **P0-U7** | Phase 0 Closure & Freeze | **VERIFIED / CLOSED** | Owner-approved governance/freeze closure; publication commit `d4f5a8c6f2fdf7f227fb192d901fdf15da58c1c5`; PR #9 merged / verified at `3b0fc03d27a4b663e85d330f581550c37d62999d` |

---

### P0-U5 Closure Evidence

- Implementation reviewed: the accepted 36-file documentation-only convergence was reviewed before publication.
- Publication completed: implementation commit `752936fd8832b5dc1ddad25892004aa6f0b08400` was pushed on its reviewed branch and merged to main.
- GitHub merge independently verified: the owner confirmed the independent audit of merge `15529b85848a80322dea033e80903fd2fd1e294c`.
- Final unit status: **VERIFIED / CLOSED**. At the closure/activation snapshot, P0-U6 activation advanced the administrative pointer only; that historical update claimed no CI implementation, verification or closure. Current implementation evidence follows.

### Historical P8-B3 pre-publication implementation boundary

The current merged code baseline is `1f7f3344e65dfc9b6837b10cb5349827da1587eb`; `6b56d2def2f02aae1d60b5a7d3352210cc584931` is the historical P8-B2 implementation commit, not current main. The local P8-B3 implementation and documentation reconciliation are owner-review accepted locally. The owner authorized one local closure commit; publication remains NOT_STARTED. Push, PR and merge require a later explicit owner instruction; no publication or next-unit implementation is authorized by this local acceptance. Work is performed in Codex against the local Git repository. It adds recovery, bounded atomic groups, deterministic consequence receipts, operation-version fencing, status querying and cancellation around the existing B2 authority. It does not activate P8-B4, close Phase 8, claim live-Firebase acceptance, or convert lint/typecheck debt into PASS.

Current phase/unit and publication status are owned by the YAML block above. Subsequent source implementation is present for phases after the dated snapshot below; its old NOT_STARTED and Phase-3-first-action statements are historical evidence, not current continuation instructions. No missing historical closure record is invented by this reconciliation.

### Historical progression snapshot through local P8-B3 acceptance

The owner-confirmed Course Correction supplies the accepted completion/source-closure classifications below; local first-parent history supplies the merge facts. Source closure is not a claim of exhaustive browser, live-Firebase, Beta 2 or release acceptance.

| Area | Accepted state | Existing merged evidence |
|---|---|---|
| Phase 3 | COMPLETED according to accepted history | PRs #37–#41; last merge `6ffa96a9c34e3516cd2d2b649c6ac12f4a506506` |
| Phase 4 | SOURCE_CLOSED | PRs #42–#44; last merge `eb925b17c3dff24b3b1537c1ae24556a494ec81f` |
| Phase 5 | SOURCE_CLOSED | PRs #45–#48; last merge `1229c729f14360311f3f3924cbf7b2d2caa40e6a` |
| Phase 6 | SOURCE_CLOSED | PRs #49–#51; last merge `9ee9c718d97af0f89ed28b6c70f9b3185f26cd47` |
| Phase 7 | SOURCE_CLOSED | PRs #52–#54; last merge `5c787cd7db57ab2e0334956ff212636e8363452b` |
| SI-CG1 | MERGED / SOURCE_VERIFIED | PR #55, `c678bd7180e48454671ee37592563b416ccf2293` |
| SI-CG2 | MERGED / SOURCE_VERIFIED | PR #56, `5da86664a7fbcc54bc3382e4300b1535be55f9f7` |
| Pre-Phase-8 correction gate | CLOSED | Owner-approved Master Design Review → SI-CG1 → SI-CG2 → Phase 8 |
| P8-B1 | MERGED / SOURCE_VERIFIED / CLOSED | PR #57, `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5` |
| P8-B2 | MERGED / SOURCE_VERIFIED / CLOSED | PR #58, `1f7f3344e65dfc9b6837b10cb5349827da1587eb` |
| P8-B3 | IMPLEMENTED / OWNER-REVIEW ACCEPTED LOCALLY | Local closure commit authorized; publication NOT_STARTED; no merge or Phase 8 closure claimed |
| P8-B4 | NOT_STARTED | Not authorized by this unit |

### Smart Import correction and Phase 8 implementation record

Phase 8 followed a Master Design Review and two correction gates because historical import implementation had diverged from the intended product model. SI-CG1 established semantic grouping by natural/canonical identity rather than display name alone; rejected rows do not contribute; Material is not globally mandatory for roster participation; internal and physical source-row provenance are distinct; natural identity outranks name/fuzzy evidence. SI-CG2 reused canonical Master Data capabilities for contextual creation and kept Create, Enroll, Reactivate and Affiliation separate. `PREPARED_NEW` remains distinct from immediate contextual creation, and temporal consequences are never hidden inside identity creation. Smart Import coordinates existing authorities rather than owning duplicate business policy.

P8-B1 established schema-v2 durable sessions with server lifecycle authority; stable Project/Session/Operation/Batch bindings; source and mapping revisions; first-class reviewed intent; optimistic concurrency; factual legacy resume and exact local-file reattach; immutable staged artifact chunks with complete-manifest publication; separate Trip/Roster requirements; and cancellation ACK before reset. Raw file bytes and credentials are not durable artifacts, and browser Firestore writes are not authority. Its recovery classified the 86 introduced failures and reached zero new failures before publication; those dated counts are evidence, not permanent test-cardinality rules.

P8-B2 consumes server-loaded durable reviewed canonical intent from INTENT_REVIEWED, reauthorizes the current actor, revalidates current canonical state, resolves prepared Driver/Truck identities through canonical natural-key authority, plans participation/affiliation and reviewed relationships, and atomically writes bounded canonical effects with a terminal receipt. It proves canonical convergence afterward or reports committed truth with refresh pending. The legacy raw-row path stays fenced by `PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`; generic Roster checkpoint PATCH cannot commit.

The local P8-B3 layer seals deterministic consequence plans in immutable artifacts and records operation state under `projects/{projectId}/importExecutions/{executionKey}`, bound to the Import Session. Independent dependency groups execute through B2 within bounded transactions. Mutation, group/consequence receipts and version advancement commit atomically; version/generation fences prevent stale workers; explicit retries resume only unfinished groups; current satisfaction can remove work but cannot expand approved effects; drift requires renewed review. Durable cancellation preserves completed effects and receipts. Status queries recover terminal or partial truth after response loss/reload. Terminal summaries remain bounded and reference full journal details; truncated summaries do not claim complete canonical-refresh proof. P8-B4 resume UX, full Sheets Roster convergence, unrelated offline/Trip work and publication remain excluded. Live-Firebase acceptance is not claimed.

### Historical roadmap snapshot — Phase 2 closure / Phase 3 activation

- **Phase 0 — Repository & Engineering Foundation**: VERIFIED / CLOSED / FROZEN
- **Phase 1 — Canonical Domain Model**: VERIFIED / CLOSED; P1-U1 through P1-U9 VERIFIED / CLOSED; no remaining proven safe Phase 1 seam.
- **Phase 2 — Persistence & Server Authority**: VERIFIED / CLOSED; P2-U1 through P2-U4 VERIFIED / CLOSED.
- **Phase 3 — Authentication, Authorization & Administrative Governance**: IN_PROGRESS; governance activation only, first unit UNASSIGNED / REQUIRES_PHASE_3_AREA_AUDIT.
- **Phase 4 — Project Lifecycle & Project-Scoped State**: NOT_STARTED
- **Phase 5 — Master Data & Canonical Relationships**: NOT_STARTED
- **Phase 6 — Project Setup Experience**: NOT_STARTED
- **Phase 7 — Smart Import Core**: NOT_STARTED
- **Phase 8 — Smart Import Persistence, Resume & Commit Integrity**: NOT_STARTED
- **Phase 9 — Pricing & Commercial Rules**: NOT_STARTED
- **Phase 10 — Operational Trip Lifecycle**: NOT_STARTED
- **Phase 11 — Offline, Outbox & Resilience**: NOT_STARTED
- **Phase 12 — Audit, Exceptions & Administrative Control**: NOT_STARTED
- **Phase 13 — Dashboards & Operational Analytics**: NOT_STARTED
- **Phase 14 — Reports, Export & Print**: NOT_STARTED
- **Phase 15 — Responsive / Cross-Device Product System**: NOT_STARTED
- **Phase 16 — End-to-End Business Journeys**: NOT_STARTED
- **Phase 17 — Hardening, Security, Performance & Recovery**: NOT_STARTED
- **Phase 18 — Beta 2 Release Gate**: NOT_STARTED

## Current Product and Verification Boundary

Whole-App i18n Batches 1–4 and final residual remediation are merged in the history of the current code baseline above (the accepted i18n merge is `2b52180304ac02d71b506f16dc69722c94ba9b6f`). Repository-authoritative convergence and the current product-language result are accepted for this reconstruction stage. AR/EN/UR parity is established; dictionary totals are observations, never a frozen invariant.

Browser review is accepted sufficiently for this stage. This is not evidence that every label, device, role, or workflow was manually verified, nor a Beta 2/Phase 18 release acceptance. Minor mixed Arabic/English or bilingual labels remain `DEFERRED_NON_BLOCKING_PRODUCT_DEBT` in the decision/debt log.

## Historical Unit Evidence

The following activation, implementation and closure snapshots through the P1-U8 activation section preserve their original baselines, pending states and next actions. They are historical, superseded for current-state purposes by Current Active State above and the Phase 1 closure record below. They do not reactivate units or contradict current closure.

### P0-U6 Bounded Implementation Evidence

[CI Baseline Contract](CI_BASELINE_CONTRACT.md) defines the new secret-free foundation workflow and the unchanged external-dependency boundary. Local clean installation, build, runtime-key tests (16/16) and auth trust-boundary tests (23/23) passed. Full-repository lint failed truthfully with exit 2 / 445 diagnostics matching the accepted final-residual signature, with zero new diagnostics. Both jobs include always-run repository mutation guards; the separate debt job does not control foundation execution. The approved runtime-semantics correction uses step-level continue-on-error only for lint: its pre-tolerance outcome remains failure, but known debt alone no longer fails the job/workflow. Explicit summary reporting distinguishes lint failure from foundation success; guards and every other failure remain blocking. P0-U7 reassessed this debt at Phase 0 exit; unresolved families remain routed in the canonical debt log.

### P0-U6 Closure Evidence / P0-U7 Activation (historical closure snapshot)

- Implementation commits: `4ac5769fb2d490b900114cc23dc0a4456944be25` and `def3195f7c3661bd31744c348c6e2f01176b399d`.
- Implementation and correction owner-reviewed, published via PR #7, merged and independently audited, as confirmed by the owner. Verified merge: `54f6d829c184a371e96c2812b08738c42280552b`.
- Corrected PR workflow: Required foundation = SUCCESS; Typecheck debt observability = SUCCESS.
- Post-merge main workflow: Secret-free foundation CI, run #3; Required foundation = SUCCESS; Typecheck debt observability = SUCCESS; overall = SUCCESS.
- Runtime evidence and independent-audit completion above are the owner's confirmed closure record; this documentation update does not rerun CI or claim a separate new runtime audit.
- Final P0-U6 status: **VERIFIED / CLOSED**. Secret-free foundation CI is established on PRs targeting main and pushes to main, with read-only permissions, no required repository secrets, and full external-dependent suites outside the foundation gate.
- Successful debt-job/workflow conclusions do NOT mean lint PASS. The actual typecheck failure remains visible through step outcome and diagnostic logs; step-level tolerance does not waive debt. The required P0-U7 reassessment was subsequently completed at Phase 0 exit; unresolved TypeScript debt is not waived.
- At that P0-U6 closure snapshot, P0-U7 was NOT_STARTED / ACTIVE and Phase 0 was IN_PROGRESS. The subsequent owner-approved P0-U7 transition below supersedes those historical pointers; the accepted plan still specifies no first Phase 1 unit.
- That P0-U6 closure update changed documentation only and did not implement P0-U7; its historical evidence is preserved.

### P0-U7 Governance Closure / Phase 0 Exit

The owner accepted the read-only P0-U7 closure audit and explicitly approved documentation/governance closure and freeze implementation. This records **P0-U7 VERIFIED / CLOSED** and **PHASE_0 VERIFIED / CLOSED / FROZEN** under [PHASE_0_FREEZE_CONTRACT.md](PHASE_0_FREEZE_CONTRACT.md), not product remediation. All predecessor foundation units remain closed.

Accepted exit evidence: authority/tooling/test-authority conflicts 0; clean install and build PASS; runtime-key tests 16/16 and auth trust-boundary tests 23/23 PASS. Lint failed with exit 2 / 445 diagnostics (29 active tests, 393 historical/non-active tests, 23 production, 0 tooling/config), unchanged from P0-U6. MUST_FIX_BEFORE_PHASE_0_FREEZE = 0; UNKNOWN diagnostics = 0. Root npm test is NOT PASS; verify:beta2 is NOT PASS. Six environmental/external cases remain explicitly deferred, with NEW_REGRESSION = 0 and UNKNOWN failures = 0. CI_BASELINE_BLOCKER, TRACKED_SECRET, UNAUTHORIZED_GENERATED_ARTIFACT and COMPETING_LOCKFILE are each 0. Detailed debt families, evidence and phase owners remain in [05_DECISION_AND_DEBT_LOG.md](05_DECISION_AND_DEBT_LOG.md).

At the P0-U7 exit snapshot, **PHASE_1 — Canonical Domain Model** was **NOT_STARTED / ACTIVE**, with ACTIVE_UNIT **UNASSIGNED / REQUIRES PHASE_1 UNIT DEFINITION**. Its goal remains hardened entity domain interfaces, type boundaries, primary/foreign key relationships and validation schemas. The subsequent owner-approved P1-U1 activation below supersedes those historical unassigned pointers; the exit itself started no Phase 1 implementation.

P0-U7 publication status: **MERGED / VERIFIED**. Owner review passed; implementation/publication commit `d4f5a8c6f2fdf7f227fb192d901fdf15da58c1c5` was published with exactly 7 documentation files and merged through PR #9 as `3b0fc03d27a4b663e85d330f581550c37d62999d`. These are the owner-supplied verified GitHub facts, corroborated by the merge and published head in local main history after safe synchronization. This post-merge record update reruns no product checks, changes no phase/unit semantics and does not strengthen the accepted audit evidence into lint/root/Beta or full-product acceptance.

### P1-U1 Owner-Approved Unit Activation (historical activation snapshot)

- **Unit ID**: P1-U1.
- **Title**: Canonical Domain Authority and Identity Boundary Contract.
- **Arabic title**: عقد سلطة أنواع الدومين وحدود الهوية ونطاق المشروع.
- **Unit type**: CONTRACT_FIRST_UNIT.
- **Status**: NOT_STARTED / ACTIVE. This is administrative activation only; the contract is not implemented, accepted or closed.
- **Activation basis**: owner approval following `PHASE_1_FIRST_UNIT_DEFINITION_AUDIT_COMPLETE` on baseline `5bf844e2f2cea1604e3f6fcfbf8778cd8aed94e6`.
- **One architectural purpose**: establish the binding authority contract for core domain identity, project references and competing type definitions before any Phase 1 production convergence.

The unit must define the authoritative type per context, alternate/legacy disposition, identity versus natural key versus display value, project-scoped reference semantics, ID generation/source semantics, document/domain ID mapping, stored/create/update/projection boundaries where necessary to identity, existing runtime enforcement versus gaps, and the bounded impact map for the next implementation seam. These are required future deliverables, not contracts completed by this activation.

**In-scope families**: Project identity; common ID/reference semantics; GlobalCarrierEntity, GlobalDriverEntity, GlobalTruckEntity and GlobalMaterialEntity; project memberships; driver/truck carrier affiliations; driver-truck assignments; truck-material allocations.

**Production reference files (read-only evidence)**: `src/types/common.ts`, `src/types/entities.ts`, `src/types/globalEntities.ts`, `src/types/projectMembership.ts`, `src/types/projectCarrierAffiliation.ts`, `src/types/projectDriverTruckAssignment.ts`, `src/types/projectTruckMaterialAllocation.ts`, and directly related ID generators/read-write boundaries only. These are the actual repository paths corresponding to the owner's `types/` references. Activation edits none of them.

**Out of scope**: RBAC/auth semantics, Project lifecycle changes, persistence/server or Firebase schema/collection migration, master-data behavioral convergence, Smart Import remediation, Pricing convergence, TripEntity/TripRecord convergence, offline/outbox changes, UI redesign, TypeScript cleanup campaigns, deletion of legacy contracts, new schema libraries, branded-ID introduction and new ID-generator formats. Later owning units/phases retain those concerns.

**Critical audit findings to preserve**:

- “Canonical” naming does not establish runtime authority by itself; historical accepted intent cannot override current production reality.
- Global identities and legacy project-scoped entity definitions coexist.
- All inspected core IDs are currently string-based; Trip ID and Trip number are distinct concepts.
- Natural keys and display/source values must not be promoted into canonical domain IDs. Preserve existing IDs and persisted values; this rule does not regenerate old IDs or reject them using a newly invented format.
- Existing storage/wire contracts are not implicitly migrated by this contract unit.

**Required acceptance outputs and gates**:

1. An authority/disposition matrix for every in-scope definition.
2. A core identity matrix specifying ID source, scope, uniqueness, requiredness, serialization and document mapping.
3. Explicit separation of global identity, project membership, affiliation, temporal assignment and temporal allocation.
4. Rules preventing identity inference from Project name, driver national ID, truck plate, material code/name and carrier display/source text; natural-key lookup of an existing identity remains distinct from generating an ID from that value.
5. A map of current runtime enforcement and missing enforcement.
6. A bounded impact map for the next implementation unit, without activating it.
7. No production behavior change.
8. No persistence/wire-format change.
9. No new TypeScript diagnostics; existing recorded debt is not a cleanup authorization.
10. Explicit owner acceptance after the unit's deliverables are produced and reviewed.

**Tentative sequence only (historical activation snapshot)**: P1-U1 was the active contract-first unit. Possible successors are “Core Identity / Reference Type Convergence” and “Core Input / Stored / Projection Boundary Contracts”. They have no assigned IDs and are not activated or authorized for implementation.

Earlier supporting records that describe Phase 1 as unassigned retain their pre-P1-U1 activation context; only this ledger owns the current unit pointer. At that activation snapshot Phase 0 remained frozen, P1-U1 was NOT_STARTED / ACTIVE, publication was NOT PUBLISHED and the contract-definition deliverables were not executed. The activation was subsequently published as `da47392b6d4f5fefa2cfadfbf8dda9d5e8061771` and is included in implementation baseline `4e7fde36628b83117bf19f4ee34091f6eee2204c`. The implementation record below supersedes only the activation-time pending pointers.

### P1-U1 Contract — Post-Merge Closure Record (historical closure snapshot)

Contract: [P1_U1_CANONICAL_DOMAIN_AUTHORITY_AND_IDENTITY_CONTRACT.md](P1_U1_CANONICAL_DOMAIN_AUTHORITY_AND_IDENTITY_CONTRACT.md), classification CURRENT_SUPPORTING. The ledger remains the sole phase/unit state authority. Unit type remains CONTRACT_FIRST_UNIT; status is **VERIFIED / CLOSED**. Owner review **PASSED** before publication. Evidence baseline: `4e7fde36628b83117bf19f4ee34091f6eee2204c`.

The document records 78 authority/disposition entries (including explicitly scoped boundary-reference groups), UNKNOWN authority 0, and 13 identity/key contexts. It separates global identity, membership, affiliation, assignment, allocation and projections; documents type/runtime/persistence enforcement and gaps; preserves existing IDs, paths, stored/wire/time/null values; and records retention policy and future-phase ownership. No existing production gap is silently fixed or claimed absent.

Recommended next production seam, **CANDIDATE_NEXT_IMPLEMENTATION_SEAM / NOT ACTIVE / NOT AUTHORIZED FOR IMPLEMENTATION / NO UNIT ID ASSIGNED**: type-only authority convergence of PureAssignment/PureAllocation in `src/utils/canonicalFleetRelationshipPolicy.ts`, preserving existing exports and function bodies through references to the existing temporal entity types. Section 11 identifies exact consumers, compatibility requirements, required future verification and stop conditions. No next unit ID is assigned and no recommendation is execution authorization.

The ten approved criteria are recorded with evidence in Section 12; explicit owner acceptance is **PASSED** (criterion 10). Local verification is documentation/matrix/link/state consistency and Git scope/whitespace inspection, plus read-only structural type comparison of the two proposed alias pairs. No full lint/build/product tests are newly run; production/compiler inputs are unchanged, so no new TypeScript diagnostic is caused by these documentation edits. Phase 0 freeze and existing debt remain unchanged.

Publication status of the P1-U1 contract implementation: **MERGED / VERIFIED**. Implementation/publication commit `438b3695757f9da3f1a782e85193340b25d6fb74` merged through **PR #12** at verified merge `06696db883db2a47526b207f5a94e27321c49ec7`. These owner-supplied verified GitHub facts are corroborated by synchronized main history. At that closure snapshot this documentation-only record was **NOT PUBLISHED**; it performs no type convergence, branded IDs, persistence migration, runtime change or later unit activation. At that snapshot the next action was DEFINE_NEXT_PHASE_1_UNIT; no candidate seam was automatically activated. The closure record is now included in main `a53d5a95b2e392ae6b362ddbda4866b49c6bbe7d`; the explicit subsequent owner decision below assigns P1-U2 without changing the accepted P1-U1 contract.

### P1-U2 Owner-Approved Unit Activation

Historical activation snapshot: this section preserves the owner-approved scope, acceptance criteria and stop conditions. Its NOT_STARTED / ACTIVE and publication-pending statements describe that snapshot, not the current implementation state recorded below. Activation commit `72747a32aa0bf654bc919566299b23f47fa8c1b3` is included in main `3abfa32550fc93955287f4aa9f0cef0e6c6671cd`.

- **Unit ID / title**: P1-U2 — Temporal Fleet Relationship Policy Type Authority Convergence.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This documentation-only activation does not implement aliases or authorize changes in this step to production, tests, compiler configuration, persistence, Firestore or runtime behavior.
- **Authority / audit basis**: explicit owner approval following PHASE_1_NEXT_UNIT_SEAM_AUDIT_COMPLETE on authoritative main `a53d5a95b2e392ae6b362ddbda4866b49c6bbe7d`. The P1-U1 recommendation becomes this assigned unit only through that owner decision; its original contract and historical candidate record remain unchanged.
- **One purpose**: remove duplicate type authority for temporal fleet assignment/allocation policy inputs while preserving exported names, exact field shapes, runtime behavior, storage/wire format, relationship semantics, existing IDs, timestamps, null semantics and status vocabularies.

**Exact future production scope**: only `src/utils/canonicalFleetRelationshipPolicy.ts`. Add type-only imports and replace the local structural declarations with aliases: `PureAssignment` → `ProjectDriverTruckAssignmentEntity`; `PureAllocation` → `ProjectTruckMaterialAllocationEntity`. No function-body edits. These aliases are NOT implemented by activation.

**Read-only reference files**:

- `src/types/projectDriverTruckAssignment.ts`
- `src/types/projectTruckMaterialAllocation.ts`
- `src/services/driverTruckIntake.server.ts`
- `src/repositories/projectCarrierAffiliation.repository.ts`

No reference-file modification is authorized; a future need requires stop, re-review and owner approval.

**Accepted bounded-audit evidence (not rerun by activation)**:

- PureAssignment and PureAllocation: EXACT_STRUCTURAL_EQUIVALENCE with their respective canonical entities; each has nine matching required, mutable properties, matching status unions and `effectiveTo: string | null`. Strict-null property comparison also matched.
- EXPORT_COMPATIBILITY: CONDITIONAL. Interface → type alias preserves current consumers; declaration-merging compatibility cannot be guaranteed for unknown external extensions. No such merging was found in the repository audit.
- RUNTIME_EMIT_CHANGE_EXPECTED: NO. In-memory hypothetical substitution produced byte-identical policy JavaScript through TypeScript and esbuild; this is not a completed implementation or full-build claim.
- Typecheck: 445 baseline diagnostics; 445 virtual-alias diagnostics; 0 added; 0 removed. Existing debt remains unresolved; lint is not PASS.
- Complete direct module consumer/reference set: `src/services/driverTruckIntake.server.ts` (policy, PureAffiliation, PureAssignment, PureAllocation), `src/repositories/projectCarrierAffiliation.repository.ts` (policy and PureAffiliation only), and policy's own method signatures in `src/utils/canonicalFleetRelationshipPolicy.ts`.
- Related test files under `src/tests/`: `driverTruckIntakeP602A.test.ts` (14), `projectCarrierFleetAffiliationFoundation.test.ts` (12), `projectDriverTruckAssignmentFoundation.test.ts` (24), `projectTruckMaterialAllocationFoundation.test.ts` (53), `smartImportUnit5AStandaloneFleetBoundary.test.ts` (28). Audit execution on Node 22: **131/131 PASS**. These runtime regressions do not themselves prove compiler type contracts; historical placeholder assertions are not strengthened into behavioral evidence.

**Explicit out of scope**: PureAffiliation and AffiliationInput; affiliation semantics; assignment/allocation behavior; relationship lifecycle; ID generators; Firestore transactions; collection paths; payloads; APIs; RBAC; validators; Smart Import behavior; UI; compiler configuration; packages; CI; and existing TypeScript debt outside this seam. No new `any`, type widening or business-logic edits.

**Future implementation acceptance criteria**:

1. PureAssignment export preserved.
2. PureAllocation export preserved.
3. Exact nine-property shape preserved for both.
4. No readonly, optionality or nullability change.
5. No status vocabulary change.
6. No runtime JavaScript behavior change.
7. No storage/wire change.
8. No new diagnostics against the recorded baseline; existing failures must not be relabeled PASS.
9. All five related test files pass without removing or weakening tests.
10. A focused compiler contract test exists and passes, using actual compiler checks rather than transpilation-only assertions. Proposed exact file: `src/tests/canonicalFleetRelationshipPolicyTypeAuthority.test.ts`; no test is created in this activation.
11. `npm run build` passes.
12. `npm run test:i18n-runtime` passes.
13. `npm run test:auth-trust-boundary` passes.
14. Emitted policy runtime remains equivalent to the approved baseline.
15. Exact bounded production scope is preserved.

**Implementation stop conditions** — report BLOCKED, do not broaden automatically:

- Declaration merging is discovered.
- An additional affected production consumer is discovered.
- Structural mismatch.
- Semantic mismatch.
- Runtime emit change.
- New TypeScript diagnostic.
- Need to widen types.
- Need to introduce `any`.
- Need to modify business logic.
- Need to modify another production file.
- Need to alter persistence/wire contracts.

**Governance boundary**: P1-U1 remains VERIFIED / CLOSED; Phase 0 remains VERIFIED / CLOSED / FROZEN; Phase 1 remains IN_PROGRESS. NEXT_ACTION is EXECUTE_P1_U2_BOUNDED_TYPE_AUTHORITY_CONVERGENCE. No subsequent Phase 1 unit ID is assigned. P1-U2 is activated but NOT implemented, verified or closed. Activation publication status: **NOT PUBLISHED**. No commit or push occurs in this step.


### P1-U2 Bounded Implementation — Accepted Verification Evidence

Status: **VERIFIED / CLOSED**. Implementation evidence baseline: `3abfa32550fc93955287f4aa9f0cef0e6c6671cd`, safely synchronized to clean main before implementation. Phase 1 remains IN_PROGRESS. The implementation-time status was IMPLEMENTED / AWAITING_OWNER_REVIEW; the owner has since confirmed review PASSED and verified merge. The post-merge closure record below supersedes the implementation-time pending state.

**Exact changed scope**: one production file `src/utils/canonicalFleetRelationshipPolicy.ts`; one new focused test `src/tests/canonicalFleetRelationshipPolicyTypeAuthority.test.ts`; and only this ledger plus `05_DECISION_AND_DEBT_LOG.md`. No reference entity/consumer, existing regression, package, lockfile, compiler configuration or workflow is changed.

**Implementation**: type-only imports from `src/types/projectDriverTruckAssignment.ts` and `src/types/projectTruckMaterialAllocation.ts`; exported aliases `PureAssignment = ProjectDriverTruckAssignmentEntity` and `PureAllocation = ProjectTruckMaterialAllocationEntity`. Exact nine-property shapes, requiredness, mutability, nullability and ACTIVE/CLOSED status vocabularies are preserved. PureAffiliation, AffiliationInput and every policy function body are unchanged. No new `any` or type widening is introduced; the pre-existing optional audit `any` fields in untouched PureAffiliation are not changed by this unit.

**Compatibility re-check**: no declaration merging, module augmentation, interface-only extension, barrel re-export, generic-constraint, overload or type-predicate dependency was found for these exports. Direct consumers remain intake server and affiliation repository, plus policy's internal signatures; no consumer modification is needed. Export compatibility remains CONDITIONAL only for unknown external interface augmentation; current repository consumers are preserved.

**Verification on Node 22.23.3 / npm 10.9.8**:

| Check | Result |
|---|---|
| Baseline `npm run lint` | Exit 2; 445 diagnostics |
| Final `npm run lint` | Exit 2; 445 diagnostics; diagnostic records identical to baseline; added 0, removed 0; no diagnostics in either changed source/test file |
| Focused compiler-contract test | 3/3 PASS; real TypeScript programs resolve production modules with project compiler options, explicit Node ambient types for the isolated fixture, strict null checking strengthened, and no emission/configuration change |
| `driverTruckIntakeP602A.test.ts` | 14/14 PASS |
| `projectCarrierFleetAffiliationFoundation.test.ts` | 12/12 PASS |
| `projectDriverTruckAssignmentFoundation.test.ts` | 24/24 PASS |
| `projectTruckMaterialAllocationFoundation.test.ts` | 53/53 PASS |
| `smartImportUnit5AStandaloneFleetBoundary.test.ts` | 28/28 PASS |
| Five existing regressions total | 131/131 PASS; existing files and assertions unchanged |
| `npm run build` | PASS, exit 0 |
| `npm run test:i18n-runtime` | 16/16 PASS, exit 0 |
| `npm run test:auth-trust-boundary` | 23/23 PASS, exit 0 |
| Baseline/current policy JavaScript | Byte-identical through TypeScript and esbuild with source maps disabled; RUNTIME_EMIT_CHANGE: NONE |
| Git scope / whitespace | Exactly four approved files including the new test; `git diff --check` PASS; no temporary verification artifacts tracked/untracked |

The focused test checks canonical type-only alias consumption, exact expected field sets/shapes, bidirectional assignability, mutable status/end-time assignments, and rejection of every omitted required field or numeric field substitution, invalid status, unexpected fields and undefined effectiveTo. Negative cases use compiler-checked expect-error directives whose non-consumption fails verification. The first isolated-fixture run lacked the Node ambient declaration needed by the existing allocation generator; adding a fixture-only Node type reference resolved that harness context without changing source/configuration or suppressing diagnostics. Final focused result is 3/3 PASS.

**Preserved boundaries**: runtime behavior, storage/wire, IDs/generators, timestamps, null semantics, status vocabulary, transactions, Firestore paths, APIs, validation, RBAC and relationship lifecycle are unchanged. Policy class and affiliation contract source comparison is unchanged; runtime emit is identical. No migration, additional validation or relationship repair is claimed. No full root-test/Beta result is newly claimed, and lint is NOT PASS: the 445-diagnostic debt remains unresolved.

All 15 bounded implementation criteria are satisfied by the evidence above; no implementation stop condition requires scope expansion. P1-U1 remains VERIFIED / CLOSED and its contract is untouched; Phase 0 remains VERIFIED / CLOSED / FROZEN. At that implementation snapshot no later Phase 1 unit ID was assigned or activated. At that implementation snapshot NEXT_ACTION was OWNER_REVIEW_P1_U2_IMPLEMENTATION, owner acceptance was PENDING and implementation publication was NOT PUBLISHED. The post-merge closure record below supersedes those historical pending pointers.

### P1-U2 Post-Merge Closure Record

P1-U2 — Temporal Fleet Relationship Policy Type Authority Convergence, type BOUNDED_TYPE_AUTHORITY_CONVERGENCE, is **VERIFIED / CLOSED**. Owner review **PASSED** before publication. Implementation commit `09b42328b7aabd8d0a2bde610d76e307b1c6ff7e` was merged through **PR #15** at verified merge `551c6ef554c537a57485035955cbb03b6fb9d0e5`; implementation publication is **MERGED / VERIFIED**. These are the owner-supplied verified GitHub facts, corroborated by the implementation commit and merge in safely synchronized main history. Merged scope: the policy utility, its focused compiler-contract test, this ledger and the decision/debt log only.

Accepted verification remains bounded: focused compiler contract 3/3 PASS; existing related regressions 131/131 PASS; build PASS; runtime-key 16/16 PASS; auth-trust 23/23 PASS; runtime emit change NONE; diagnostics 445 → 445 with 0 added and 0 removed. Lint remains exit 2, NOT PASS. Storage/wire and runtime behavior are unchanged. This closure record reruns no implementation verification, changes no accepted implementation and waives no existing debt.

P1-U1 remains VERIFIED / CLOSED; Phase 0 remains VERIFIED / CLOSED / FROZEN; Phase 1 remains IN_PROGRESS. At the closure-preparation snapshot, ACTIVE_UNIT was UNASSIGNED / REQUIRES_NEXT_PHASE_1_UNIT_DEFINITION, ACTIVE_UNIT_STATUS was UNASSIGNED / NOT_STARTED, and NEXT_ACTION was DEFINE_NEXT_PHASE_1_UNIT. The accompanying next-unit definition audit was read-only for production/test/configuration and assigned no unit ID. The later explicit owner approval below assigns P1-U3; this is not automatic activation by an audit recommendation.

At closure preparation, this governance record was NOT PUBLISHED. The owner has now approved the combined P1-U2 closure / P1-U3 activation for one documentation-only publication; the commit and remote branch are publication evidence, not implementation or closure of P1-U3.


### P1-U3 Owner-Approved Unit Activation

Historical activation snapshot: NOT_STARTED / ACTIVE, future-scope and no-implementation statements below describe the owner-approved activation, not the later implementation state. Governance commit `ab7da667fe13614f1dc752a9294051793c18c339` is included in main `8a962ae3e1d133301918e08e59c3e3da5d17f254`. The implementation record below supersedes activation-time execution pointers without changing the approved scope or prior closures.

- **Unit ID / title**: P1-U3 — Truck Type Vocabulary Authority Across Input and Stored Boundaries.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This governance step does not implement P1-U3.
- **Authority**: explicit owner approval of P1-U2 closure and the next seam audited on main `551c6ef554c537a57485035955cbb03b6fb9d0e5`. The unit ID is owner-assigned, not inferred or invented.
- **One purpose**: make the identical truckType vocabulary use GlobalTruckType as the single authoritative definition at DriverTruckIntakePayload.truckType and TruckEntity.truckType, preserving accepted values, optionality, nullability, mutability/exports, runtime behavior, storage/wire/API format, entity ownership and parsing/validation behavior.

**Exact future production scope — two files only**:

- `src/services/driverTruckIntake.service.ts`: DriverTruckIntakePayload.truckType → GlobalTruckType using a type-only reference.
- `src/types/entities.ts`: TruckEntity.truckType → GlobalTruckType using a type-only reference.

**Read-only authority source**: `src/types/globalEntities.ts`, GlobalTruckType. No change to its definition is authorized. This activation modifies neither production file and creates no test.

**Accepted read-only audit evidence**: the four accepted values are structurally identical: TIPPER_32M3, TRAILER_24M, FLATBED, DUMPER. Both approved fields are optional and mutable. Virtual comparison of both references preserved 445 baseline → 445 diagnostics, added 0 / removed 0. JavaScript for both files was unchanged under TypeScript and esbuild with maps disabled. Expected runtime behavior change: NONE. Expected storage/wire change: NONE. This is audit evidence, not completed P1-U3 implementation verification; existing lint debt remains unresolved and lint is NOT PASS.

**Required future verification**:

- Focused compiler-contract test: `src/tests/truckTypeBoundaryAuthority.test.ts`.
- Existing tests: `src/tests/driverTruckIntakeP602A.test.ts`, `src/tests/smartImportUnit5AStandaloneFleetBoundary.test.ts`, `src/tests/globalIdentityFoundation.test.ts`, `src/tests/projectWorkspaceFleetRosterUnit1.test.ts`, `src/tests/rosterSmartImportDriverTruckLayerC4.test.ts`, `src/tests/legacyMasterDataHelperDeprecation.test.ts`, `src/tests/canonicalFleetRelationshipPolicyTypeAuthority.test.ts`.
- `npm run build`, `npm run test:i18n-runtime`, `npm run test:auth-trust-boundary`, diagnostic comparison, runtime emit comparison and `git diff --check`.

**Implementation acceptance criteria**:

1. GlobalTruckType becomes the single vocabulary authority for the two approved boundaries.
2. Exact four-value vocabulary preserved.
3. DriverTruckIntakePayload.truckType optionality preserved.
4. TruckEntity.truckType optionality preserved.
5. No nullability change.
6. No mutability/export change.
7. No new `any`.
8. No type widening.
9. No runtime behavior change.
10. No storage/wire/API change.
11. No global/project entity merge.
12. Focused compiler-contract test passes.
13. Existing relevant tests pass without removing or weakening assertions.
14. Zero new diagnostics; existing nonzero lint is not renamed PASS.
15. Build and foundation checks pass.
16. Exact two-production-file scope preserved.

**Future implementation stop conditions** — report BLOCKED; do not broaden automatically:

- Vocabulary values are not actually identical.
- An additional accepted value is discovered.
- Standalone/import paths require string widening/narrowing.
- Another production consumer requires modification.
- GlobalTruckType itself must change.
- Runtime emit changes.
- A new diagnostic appears.
- Validation behavior must change.
- Parsing/matching behavior must change.
- Storage/wire/API behavior must change.
- Production scope must exceed the two authorized files.

**Explicit out of scope**: CreateStandaloneTruckPayload.truckType?: string; CanonicalDriverTruckRow.truckType; parsing; matching; commit semantics; Smart Import behavior; IDs; relationship rules; validators; Firestore; UI; RBAC; timestamp mismatches; importBatchId DTO mismatches; compiler configuration; packages; CI. Timestamp issues remain DEFER_PHASE_2. Import DTO issues remain DEFER_PHASE_7_8. No source/test/configuration/package/workflow edit occurs in this governance step.

**Phase 1 direction**: PHASE_1_REMAINING_SEAMS = 1, meaning the remaining currently proven Phase-1-owned seam identified by the accepted audit; P1-U3 is that seam. AFTER_P1_U3_EXPECTED_STATE = LIKELY_READY_FOR_PHASE_1_CLOSURE_AUDIT. This is advisory, not Phase 1 closure or Phase 2 activation. P1-U1 and P1-U2 remain VERIFIED / CLOSED; Phase 0 remains VERIFIED / CLOSED / FROZEN; Phase 1 remains IN_PROGRESS. No subsequent Phase 1 unit ID is assigned. NEXT_ACTION: EXECUTE_P1_U3_TRUCK_TYPE_VOCABULARY_AUTHORITY_CONVERGENCE. Publication of this combined governance update does not implement, verify or close P1-U3.


### P1-U3 Bounded Implementation — Accepted Verification Evidence

**Status**: VERIFIED / CLOSED. Authoritative implementation baseline: `8a962ae3e1d133301918e08e59c3e3da5d17f254`, safely synchronized to clean main before changes. Unit type remains BOUNDED_TYPE_AUTHORITY_CONVERGENCE; Phase 1 remains IN_PROGRESS. The implementation-time status was IMPLEMENTED / AWAITING_OWNER_REVIEW; owner review has since PASSED and implementation publication is MERGED / VERIFIED, as recorded below.

**Exact production scope**:

- `src/services/driverTruckIntake.service.ts`: type-only import from `../types/globalEntities`; DriverTruckIntakePayload.truckType remains optional and now references GlobalTruckType.
- `src/types/entities.ts`: type-only import from `./globalEntities`; TruckEntity.truckType remains optional and now references GlobalTruckType.

The read-only authority `src/types/globalEntities.ts` is unchanged. Its exact vocabulary remains TIPPER_32M3, TRAILER_24M, FLATBED, DUMPER. Reversing only the two import/reference edits reproduces both baseline files exactly: no other property or executable statement changed. Global/project entities remain distinct. The broader string-based CreateStandaloneTruckPayload.truckType and CanonicalDriverTruckRow.truckType are untouched, as are validators, parsing/matching/commit, IDs, relations, Firestore, APIs, UI, RBAC, timestamps, packages, compiler configuration and CI.

**New focused test**: `src/tests/truckTypeBoundaryAuthority.test.ts` only. Three tests verify canonical type-only source consumption; real compiler compatibility against the exact four-value union and optional mutable field shape; omitted/undefined values; bidirectional field vocabulary compatibility; rejection of arbitrary strings, extra values, altered casing, null, numeric/object values; and absence of type widening. Compiler fixtures use the unchanged project options plus stronger strict null checking and Node ambient references, remain virtual, and emit/write nothing. Unused expect-error directives fail verification. No new `any` is introduced.

**Executed verification — Node 22.23.3 / npm 10.9.8**:

| Check | Result |
|---|---|
| Baseline `npm run lint` | Exit 2; 445 diagnostics |
| Post-change `npm run lint` | Exit 2; 445 identical diagnostic records; added 0, removed 0; changed production/test files have 0 diagnostics |
| `truckTypeBoundaryAuthority.test.ts` | 3/3 PASS |
| `driverTruckIntakeP602A.test.ts` | 14/14 PASS |
| `smartImportUnit5AStandaloneFleetBoundary.test.ts` | 28/28 PASS |
| `globalIdentityFoundation.test.ts` | 28/28 PASS |
| `projectWorkspaceFleetRosterUnit1.test.ts` | 12/12 PASS |
| `rosterSmartImportDriverTruckLayerC4.test.ts` | 33/33 PASS |
| `legacyMasterDataHelperDeprecation.test.ts` | 10/10 PASS |
| `canonicalFleetRelationshipPolicyTypeAuthority.test.ts` | 3/3 PASS |
| Seven unchanged existing test files | 128/128 PASS; with the new test, 131/131 PASS |
| Both production files: baseline/current emit | Byte-identical JavaScript under TypeScript and esbuild; maps/line metadata excluded; RUNTIME_EMIT_CHANGE: NONE |
| `npm run build` | PASS, exit 0 |
| `npm run test:i18n-runtime` | 16/16 PASS, exit 0 |
| `npm run test:auth-trust-boundary` | 23/23 PASS, exit 0 |
| Scope / whitespace | Exactly five approved files: two production, one new focused test, two governance docs; `git diff --check` PASS; no generated tracked/untracked verification artifacts |

**Boundary result**: accepted values, optionality, declared nullability, mutability, exports and field name truckType are unchanged. Project strictNullChecks remains unchanged; the stricter focused fixture proves the declaration contract and does not add runtime validation. Runtime imports/side effects, runtime behavior, payload/storage/API shape and serialization are unchanged. No global/project entity merge or storage migration occurs. No existing test is edited or weakened. Existing lint debt remains exit 2, NOT PASS; no full root-test or Beta success is claimed.

All 18 implementation criteria are met within the exact bounded scope. P1-U1 and P1-U2 remain VERIFIED / CLOSED, their implementations/contracts untouched; Phase 0 remains VERIFIED / CLOSED / FROZEN. Timestamp debt remains DEFER_PHASE_2; importBatchId DTO debt remains DEFER_PHASE_7_8. At that implementation snapshot no later unit or Phase 2 activation was introduced; NEXT_ACTION was OWNER_REVIEW_P1_U3_IMPLEMENTATION and implementation publication was NOT PUBLISHED. The then-expected Phase 1 closure audit has now completed with PHASE_1_CLOSURE_READY = NO. Its fresh residual scan supersedes the earlier one-seam estimate and advisory LIKELY_READY_FOR_PHASE_1_CLOSURE_AUDIT pointer; the closure/activation record below owns the current state.


### P1-U3 Post-Merge Closure Record

P1-U3 — Truck Type Vocabulary Authority Across Input and Stored Boundaries is **VERIFIED / CLOSED**. Owner review **PASSED**; implementation commit `42db0a980768103cd05bc04204f3f76a2a322fc0` merged through **PR #17** at verified merge `ca53209f0844c7968e518efe553fd171436bce70`. P1_U3_PUBLICATION_STATUS is **MERGED / VERIFIED**. The owner-supplied verified facts are corroborated by synchronized main and the post-merge audit: the merge tree equals the reviewed head and contains exactly the reviewed five-file scope.

Accepted P1-U3 verification is preserved: focused compiler contract 3/3 PASS; existing relevant regressions 128/128 PASS; diagnostics 445 → 445, added 0 / removed 0; runtime emit NONE; build PASS; i18n-runtime 16/16 PASS; auth-trust-boundary 23/23 PASS; storage/wire and runtime behavior unchanged. Lint remains EXIT 2 / NOT PASS, existing debt preserved. The later read-only closure audit additionally ran both Phase 1 contract suites (6/6) and relevant regressions (214/214), total 220/220, with build and foundation checks passing and no diagnostic delta. This governance update reruns no implementation checks and changes no accepted implementation.

**Historical Phase 1 closure assessment before P1-U4 implementation** (unit-selection pointers superseded by the P1-U4 closure / P1-U5 activation below): PHASE_1_CLOSURE_READY = NO. Five bounded Phase-1-owned type-authority families remain: material UOM, user-role vocabulary, global entity input-status vocabulary, settlement adjustment type vocabulary, and affiliation status vocabulary. Pure type authority sharing must not absorb their behavioral ownership. The prior one-seam estimate was incomplete and is historical, not current closure evidence. The owner selects only the settlement adjustment seam for P1-U4 below; the other four families have no assigned unit IDs. Phase 1 remains IN_PROGRESS; Phase 0 remains VERIFIED / CLOSED / FROZEN; P1-U1 and P1-U2 remain VERIFIED / CLOSED.

### P1-U4 Owner-Approved Unit Activation

Historical activation snapshot, superseded for implementation status and next action by the evidence below. Its bounded scope and exclusions remain binding.

- **Unit ID / title**: P1-U4 — Settlement Adjustment Type Vocabulary Authority Convergence.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This is governance activation only, not implementation, verification or closure.
- **Owner authority**: explicit approval of P1-U3 closure and this bounded next unit on authoritative main `ca53209f0844c7968e518efe553fd171436bce70`.
- **One purpose**: remove the service request boundary's duplicate settlement adjustment vocabulary and reuse the existing exported SettlementAdjustmentType, preserving accepted values, request semantics, authorization, calculations, approval workflow, persistence, API/wire shape, field names and runtime behavior.

**Current authority — read-only**: `src/types/entities.ts`, `SettlementAdjustmentType = 'RATE' | 'AMOUNT' | 'DEDUCTION' | 'OTHER'`. SettlementAdjustmentEntity already uses `adjustmentType: SettlementAdjustmentType` and must remain unchanged.

**Exact future production scope — one file only**: `src/services/settlementAdjustment.service.ts`. In SettlementAdjustmentService.requestAdjustment, use a type-only reference/import for SettlementAdjustmentType and replace only the duplicate adjustmentType union. Preserve every method body and runtime path. Do NOT implement this change in the activation step.

**Related boundary — read-only**: `src/repositories/settlementAdjustment.repository.ts` already reads/persists SettlementAdjustmentEntity. Its Firestore paths, casts, create/update contracts and timestamp handling are out of P1-U4 scope.

**Future verification contract**:

- New focused test: `src/tests/settlementAdjustmentTypeAuthority.test.ts`. Real TypeScript/compiler evidence must prove all four canonical values accepted, invalid values rejected, no widening to string, shared entity/request vocabulary, no optionality/nullability mutation and no new `any`.
- Existing regression: `src/tests/tripIdentityAdjustmentBlock89.test.ts`, without weakening or removing assertions. Historical harness report-generation side effects do not authorize modifying tracked reports; the implementation must preserve repository integrity during verification.
- `npm run build`, `npm run test:i18n-runtime`, `npm run test:auth-trust-boundary`, diagnostic comparison, runtime emit comparison and `git diff --check`.

**Implementation acceptance criteria**:

1. SettlementAdjustmentType remains the sole authoritative vocabulary.
2. Exact four values remain unchanged.
3. requestAdjustment uses SettlementAdjustmentType.
4. SettlementAdjustmentEntity remains unchanged.
5. No field names change.
6. No request behavior changes.
7. No RBAC/authorization changes.
8. No calculations or approval workflow changes.
9. No persistence/storage/wire/API changes.
10. No new `any`.
11. No type widening.
12. Runtime JavaScript emit unchanged.
13. Zero new diagnostics; existing nonzero lint is not reported PASS.
14. Focused compiler-contract test passes.
15. Existing relevant regression passes without assertion weakening.
16. Build and foundation checks pass.
17. Exactly one production file modified in implementation.

**Future implementation stop conditions** — report BLOCKED; do not broaden automatically:

- The service and canonical four-value vocabularies are not identical.
- Another accepted adjustment type exists.
- Another production file requires modification.
- SettlementAdjustmentType itself must change.
- Authorization logic must change.
- Adjustment calculations/workflow must change.
- Repository/storage/API contracts must change.
- Runtime emit changes materially.
- A new TypeScript diagnostic appears.
- Type widening or new `any` is required.

**Remaining unassigned Phase 1 candidate families after this seam**:

- Global material UOM vocabulary authority.
- User role vocabulary authority.
- Global entity status vocabulary authority.
- Affiliation status vocabulary authority.

P1-U4 addresses only settlement adjustment type vocabulary. Five families currently remain including P1-U4; four additional known families remain outside it. No IDs are assigned to those families. A fresh residual assessment remains required after P1-U4; immediate Phase 1 closure is not promised and Phase 2 is not activated.

**Later-phase debt preservation / explicit exclusions**: timestamp/storage boundary DEFER_PHASE_2; Auth context convergence DEFER_PHASE_3; Project lifecycle DEFER_PHASE_4; master relationship behavior DEFER_PHASE_5; import DTO/importBatchId DEFER_PHASE_7_8; pricing DEFER_PHASE_9; Trip lifecycle/model DEFER_PHASE_10; offline/outbox DEFER_PHASE_11. Vocabulary-only authority references do not authorize any of those semantics. No production/test/configuration/package/workflow edit occurs in this combined governance step. P1-U1/P1-U2 contracts and Phase 0 freeze remain unchanged. No subsequent unit ID is assigned. NEXT_ACTION: EXECUTE_P1_U4_SETTLEMENT_ADJUSTMENT_TYPE_AUTHORITY_CONVERGENCE. The owner authorizes publication of only this ledger and the decision/debt log in one normal branch commit, without implementing P1-U4 or merging.


### P1-U4 Bounded Implementation — Awaiting Owner Review

Historical implementation snapshot: its review/publication/next-action pointers and unassigned-family statements are superseded by the closure/activation record below. Accepted verification evidence remains unchanged.

Implementation baseline: `5d3526a14d697038d414ff48ab661406672acb0b`. P1-U4 is **IMPLEMENTED / AWAITING_OWNER_REVIEW**; it is not verified/closed. Publication: **NOT PUBLISHED**. NEXT_ACTION: OWNER_REVIEW_P1_U4_IMPLEMENTATION.

- **Production scope**: only `src/services/settlementAdjustment.service.ts`: a type-only import of canonical SettlementAdjustmentType from unchanged `src/types/entities.ts` replaces the duplicated requestAdjustment.adjustmentType union.
- **Exact vocabulary**: RATE / AMOUNT / DEDUCTION / OTHER. Requiredness, nullability, mutability, request fields and return type remain unchanged; no string widening or any is introduced. SettlementAdjustmentEntity and the repository remain untouched.
- **Focused compiler test**: new `src/tests/settlementAdjustmentTypeAuthority.test.ts`, **3/3 PASS**. Real TypeScript fixtures resolve production definitions, checking exact request/stored type compatibility, all four accepted values, required mutable fields, and rejection of invalid values, arbitrary strings, omission, null and undefined. Strict-null fixture diagnostics are checked independently of unrelated transitive implementation bodies; AST inspection verifies the canonical type-only import/reference.
- **Existing regression**: unchanged `src/tests/tripIdentityAdjustmentBlock89.test.ts`, **21/21 PASS**, exit 0 through its native runner. Firestore/proxy connection errors occurred and its existing fallback ran; this is not evidence of live Firestore connectivity. Historical placeholder assertions remain unchanged and do not constitute additional runtime coverage. Both generated reports were restored to baseline; no report drift remains.
- **Diagnostics**: baseline **445**, post-change **445**, added **0**, removed **0**. Both lint commands exit **2 / NOT PASS**; existing debt is not waived.
- **Runtime emit**: TypeScript and esbuild JavaScript are byte-identical before/after with source maps disabled: **NONE**. Reversing precisely the import and type reference reproduces the original production source byte-for-byte.
- **Foundation**: build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**.
- **Storage/wire/runtime**: **UNCHANGED**. Request/repository payloads, field names, canonical stored entity, Firestore paths, IDs, timestamps, RBAC, calculation/approval workflows, validation, errors and method bodies are unchanged.

Exact final scope: one production file, one new compiler test, and this ledger plus the decision/debt log. Phase 0 remains VERIFIED / CLOSED / FROZEN; P1-U1/P1-U2/P1-U3 closure records are unchanged. PHASE_1 remains IN_PROGRESS, PHASE_1_CLOSURE_READY remains NO. Four other known type-authority families remain unassigned; fresh residual assessment is still required after P1-U4 acceptance, with no automatic closure or later unit assignment. Later-phase debt remains deferred to its existing owners. No commit, push or PR is performed.


### P1-U4 Post-Merge Closure Record

The owner independently verified the merge and approved closure. **P1-U4 — Settlement Adjustment Type Vocabulary Authority Convergence is VERIFIED / CLOSED**. Owner review: **PASSED**. Implementation/publication commit: `c8deded43ce20647955ea3e1839386f2bc78be78`; PR **#19**; verified merge/current main baseline: `c00a4975cf973d470033e430579a09a80fb71ce0`. Implementation publication: **MERGED / VERIFIED**.

Accepted verification remains: focused compiler contract **3/3 PASS**; unchanged tripIdentityAdjustmentBlock89 regression **21/21 PASS**; diagnostics **445 → 445**, added **0**, removed **0**; lint **EXIT 2 / NOT PASS**; runtime emit **NONE**; build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**. Storage/wire change **NO**, runtime behavior change **NO**, generated report drift **NO**. Firestore connection errors exercised the pre-existing fallback in the historical regression; this is not proof of live Firestore connectivity and does not broaden its historical assertions.

P1-U1/P1-U2/P1-U3 remain VERIFIED / CLOSED, Phase 0 remains VERIFIED / CLOSED / FROZEN, and Phase 1 remains IN_PROGRESS. Closure of this unit does not close Phase 1 or waive existing debt. The owner explicitly assigns P1-U5 below.

### P1-U5 Owner-Approved Unit Activation

Historical activation snapshot: implementation status, execution/publication pointers and no-change statements are superseded by the implementation evidence below. Its bounded scope, criteria and exclusions remain binding.

- **Unit ID / title**: P1-U5 — Affiliation Status Vocabulary Authority Convergence.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This governance step does not implement, verify or close P1-U5.
- **One purpose**: make existing exported AffiliationStatus the single affiliation-status vocabulary authority inside the pure relationship-policy boundary, without changing affiliation behavior, transitions, reassignment, persistence, Firestore, APIs, cardinality or entity shapes beyond duplicate vocabulary references.
- **Read-only canonical authority**: `src/types/projectCarrierAffiliation.ts`, exporting `AffiliationStatus = 'ACTIVE' | 'INACTIVE'`. Canonical stored driver/truck affiliation entities already consume this status vocabulary through their base entity.
- **Exactly one authorized future production file**: `src/utils/canonicalFleetRelationshipPolicy.ts`. Add a type-only AffiliationStatus import/reference and replace only the duplicate unions at **PureAffiliation.status** and **evaluateAffiliation return status**.
- **Shape boundary**: PureAffiliation remains an independent partial/policy shape; do not alias it to a stored entity. No optionality change to audit metadata is authorized.

**Explicit exclusions**: do not modify AffiliationInput, PureAssignment, PureAllocation, ProjectDriverCarrierAffiliationEntity, ProjectTruckCarrierAffiliationEntity, policy method bodies, carrier reassignment/reactivation rules, idempotency, assignment/allocation logic, repositories, Firestore paths, storage/wire payloads, RBAC or UI. Sharing vocabulary does not absorb Phase 5 relationship semantics. The canonical authority remains read-only unless a stop condition is found.

**Future focused compiler test**: create exactly one test during implementation, `src/tests/affiliationStatusVocabularyAuthority.test.ts`. Real compiler-level evidence must prove ACTIVE and INACTIVE accepted, invalid status rejected, evaluateAffiliation return status compatible with AffiliationStatus, stored and policy statuses sharing the canonical vocabulary, no string widening/any, independent partial PureAffiliation structure, and unchanged optional audit metadata.

**Future regressions — unchanged assertions**:

- `src/tests/projectCarrierFleetAffiliationFoundation.test.ts`
- `src/tests/driverTruckIntakeP602A.test.ts`
- `src/tests/canonicalFleetRelationshipPolicyTypeAuthority.test.ts`
- Any directly relevant affiliation/policy regression discovered during implementation.

**Future verification**: compare diagnostics against the current expected baseline **445**, requiring **ADDED_DIAGNOSTICS = 0**. Compare runtime emit for `src/utils/canonicalFleetRelationshipPolicy.ts`, requiring **RUNTIME_EMIT_CHANGE = NONE**. Require `npm run build`, `npm run test:i18n-runtime` and `npm run test:auth-trust-boundary` to pass. Do not call lint PASS if it remains exit 2. These are future implementation gates, not checks executed by this documentation-only activation.

**Acceptance criteria (17)**:

1. AffiliationStatus remains canonical vocabulary authority.
2. Exact values ACTIVE / INACTIVE are preserved.
3. PureAffiliation.status uses AffiliationStatus.
4. evaluateAffiliation return status uses AffiliationStatus.
5. PureAffiliation remains an independent partial policy shape.
6. No policy method body changes.
7. No affiliation behavior changes.
8. No reassignment/reactivation changes.
9. No persistence/storage/wire/API changes.
10. No any.
11. No widening.
12. Runtime emit unchanged.
13. Zero new diagnostics.
14. Focused compiler-contract passes.
15. Relevant regressions pass.
16. Build/i18n/auth checks pass.
17. Exactly one production file modified.

**Stop conditions (10) — stop future implementation and report; do not broaden automatically**:

1. Policy and canonical affiliation vocabularies differ.
2. Another affiliation status value exists.
3. Authority source must change.
4. Another production file must change.
5. PureAffiliation must be converted into a stored entity.
6. Behavior or transition rules must change.
7. Runtime emit changes materially.
8. New diagnostics appear.
9. Persistence/wire/API must change.
10. Any or widening is required.

**Remaining unassigned Phase 1 families beyond P1-U5 (3)**: Global Material UOM vocabulary authority; User Role vocabulary authority; Global Entity Status vocabulary authority. No subsequent unit ID is assigned. Four known families remain including active P1-U5; Phase 1 remains IN_PROGRESS and PHASE_1_CLOSURE_READY remains NO. Fresh residual assessment is required after this bounded seam; no Phase 2 activation or automatic phase closure is authorized.

**Later-phase ownership preserved**: timestamp/storage DEFER_PHASE_2; Auth context convergence DEFER_PHASE_3; project lifecycle DEFER_PHASE_4; master relationship behavior DEFER_PHASE_5; import DTO DEFER_PHASE_7_8; pricing DEFER_PHASE_9; Trip lifecycle/model DEFER_PHASE_10; offline/outbox DEFER_PHASE_11.

**Current governance/publication boundary**: NEXT_ACTION is EXECUTE_P1_U5_AFFILIATION_STATUS_VOCABULARY_AUTHORITY_CONVERGENCE. Only this ledger and the decision/debt log change in this step. The owner authorizes one normal branch commit on `reconstruction/p1-u4-closure-p1-u5-activation`, without merge or P1-U5 implementation. Prior accepted units and the Phase 0 freeze remain unchanged.


### P1-U5 Bounded Implementation — Awaiting Owner Review

Historical implementation snapshot: owner-review/publication/next-action and residual-inventory pointers are superseded by the closure/activation below. Accepted verification evidence remains unchanged.

Implementation baseline: `d303fe88ce00df132abcd7e06d5508d7ae5308eb`. **P1-U5 — Affiliation Status Vocabulary Authority Convergence: IMPLEMENTED / AWAITING_OWNER_REVIEW**. Owner acceptance is pending; the unit is not verified/closed. NEXT_ACTION: OWNER_REVIEW_P1_U5_IMPLEMENTATION. Implementation publication: **NOT PUBLISHED**.

- **Canonical authority**: unchanged `src/types/projectCarrierAffiliation.ts` exports AffiliationStatus with exactly **ACTIVE / INACTIVE**. Stored affiliation entities are unchanged.
- **Only production file**: `src/utils/canonicalFleetRelationshipPolicy.ts`. One type-only import and two canonical references replace the duplicate unions at PureAffiliation.status and CanonicalFleetRelationshipPolicy.evaluateAffiliation return status. No other production source bytes change.
- **Partial boundary preserved**: PureAffiliation remains an independent exported interface, not a stored-entity alias or extension. Its required projectId/carrierId/status and optional createdAt/createdBy/updatedAt/updatedBy remain unchanged, including the pre-existing timestamp metadata types. No new any is introduced; status types are not any and do not widen to string. AffiliationInput, PureAssignment and PureAllocation are unchanged.
- **New real compiler contract**: `src/tests/affiliationStatusVocabularyAuthority.test.ts`, **3/3 PASS**. The real TypeScript compiler resolves production definitions under strict null checks, proving exact shared canonical/policy/result/stored vocabulary, accepted ACTIVE/INACTIVE values, invalid/widened/null/undefined/omitted status rejection, exact required core fields and result shape, optional metadata and policy independence. AST assertions verify both canonical references, the type-only import and unchanged partial interface metadata.
- **Existing regressions — unchanged files/assertions**: projectCarrierFleetAffiliationFoundation **12/12 PASS**; driverTruckIntakeP602A **14/14 PASS**; canonicalFleetRelationshipPolicyTypeAuthority **3/3 PASS**; directly relevant projectDriverTruckAssignmentFoundation **24/24 PASS**; projectTruckMaterialAllocationFoundation **53/53 PASS**. Existing regressions total **106/106 PASS** both before and after the change; including the new compiler test, targeted verification is **109/109 PASS**.
- **Diagnostics**: baseline **445**, post-change **445**, added **0**, removed **0**. Full diagnostic records match exactly. Both lint runs exit **2 / NOT PASS**; existing debt is not waived.
- **Runtime emit**: **NONE**. TypeScript and esbuild emitted JavaScript for the policy file is byte-identical before/after with source maps disabled. Reversing exactly the one import and two status references reproduces the baseline source byte-for-byte.
- **Foundation checks**: build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**.
- **Relationship/runtime/storage/wire**: **UNCHANGED**. All policy method bodies and CREATE/REACTIVATE/REASSIGN/IDEMPOTENT paths, intake carrier conflicts, assignment/allocation validation, field names, runtime input/output shapes, stored entities, repositories, Firestore paths, payloads, API/wire values, RBAC and UI remain untouched.

All 19 bounded implementation acceptance criteria are satisfied without a stop-condition scope expansion. Final scope is exactly one production file, one new focused test, and the two governance documents. No existing test is modified; no generated report/artifact drift is included. P1-U1/P1-U2/P1-U3/P1-U4 closure records and Phase 0 freeze remain unchanged.

Phase 1 remains **IN_PROGRESS**, **PHASE_1_CLOSURE_READY: NO**. Three other known candidate families remain unassigned: Global Material UOM vocabulary authority, User Role vocabulary authority and Global Entity Status vocabulary authority. The four-seam review inventory still includes P1-U5 until owner acceptance; a fresh residual assessment remains required after this unit. No subsequent unit ID or Phase 2 activation is introduced. Later-phase ownership remains unchanged: timestamp/storage Phase 2, Auth context Phase 3, project lifecycle Phase 4, relationship behavior Phase 5, import DTO Phases 7/8, pricing Phase 9, Trip lifecycle/model Phase 10, offline/outbox Phase 11. This type-only change does not absorb those semantics.

**PUBLICATION STATUS: NOT PUBLISHED**. No staging, commit, push or PR occurs in this implementation step.


### P1-U5 Post-Merge Closure Record

**P1-U5 — Affiliation Status Vocabulary Authority Convergence is VERIFIED / CLOSED**. Owner review **PASSED**. Implementation/publication commit `4a2e1c1747212dd27d0c20aaefbab09c30dff9d8`; PR **#21**; verified merge/current authoritative main baseline `e76ad3cf9ce9204f8f5d2aaa5b4fa2c106a35b39`. Implementation publication **MERGED / VERIFIED**. The owner-supplied verified merge is corroborated by synchronized main containing the implementation commit.

Accepted verification is preserved: focused compiler contract **3/3 PASS**; unchanged relevant regressions **106/106 PASS**; diagnostics **445 → 445**, added **0**, removed **0**; lint **EXIT 2 / NOT PASS**; runtime emit **NONE**; build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**. Storage/wire and runtime behavior changes **NO**. These are accepted implementation results, not checks rerun by this documentation-only closure.

P1-U1/P1-U2/P1-U3/P1-U4 remain VERIFIED / CLOSED, Phase 0 remains VERIFIED / CLOSED / FROZEN, and Phase 1 remains IN_PROGRESS with closure readiness NO. The owner explicitly activates P1-U6 below; unit closure does not waive any existing debt.

### P1-U6 Owner-Approved Unit Activation

Historical activation snapshot: implementation status, execution/publication pointers and no-change statements are superseded by the implementation evidence below. Its entity-local authority model, bounded scope and exclusions remain binding.

- **Unit ID / title**: P1-U6 — Global Entity Status Input Authority Convergence.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This governance publication does not implement, verify or close the unit.
- **One purpose**: remove the eight duplicated status unions in global identity create/update input declarations, reusing each boundary's own canonical entity-local status type.
- **Authority model**: **ENTITY-LOCAL STATUS AUTHORITY**, using indexed access types from read-only `src/types/globalEntities.ts`. Driver, Truck, Carrier and Material retain distinct vocabularies; no common GlobalEntityStatus type and no cross-entity normalization.
- **Exactly one future production file**: `src/repositories/globalIdentity.repository.ts`. Only the eight status type declarations may change; no method bodies, defaults, transitions or runtime validation changes.

**Canonical vocabulary / proven future input boundaries (8)**:

| Entity-local authority | Exact canonical vocabulary | Create input | Update input | Count |
|---|---|---|---|---|
| `GlobalDriverEntity['status']` | ACTIVE / SUSPENDED / INACTIVE | GlobalDriverRepository.createGlobal input.status | GlobalDriverRepository.updateProfile updates.status | 2 |
| `GlobalTruckEntity['status']` | ACTIVE / MAINTENANCE / INACTIVE | GlobalTruckRepository.createGlobal input.status | GlobalTruckRepository.updateProfile updates.status | 2 |
| `GlobalCarrierEntity['status']` | ACTIVE / SUSPENDED / INACTIVE | GlobalCarrierRepository.createGlobal input.status | GlobalCarrierRepository.updateProfile updates.status | 2 |
| `GlobalMaterialEntity['status']` | ACTIVE / INACTIVE | GlobalMaterialRepository.createGlobal input.status | GlobalMaterialRepository.updateCatalog updates.status | 2 |

Each declaration remains optional: `status?: GlobalDriverEntity['status']`, `status?: GlobalTruckEntity['status']`, `status?: GlobalCarrierEntity['status']`, or `status?: GlobalMaterialEntity['status']`, matched to its entity. Repository inspection confirms the material update method is named **updateCatalog**, not updateProfile as described in the owner request; this records the actual name for the same eighth status boundary, without renaming a method or expanding semantic scope. Truck MAINTENANCE and Driver/Carrier SUSPENDED remain intentionally different; Material accepts only ACTIVE / INACTIVE.

**Explicit exclusions**: do not change `src/types/globalEntities.ts`, entity vocabularies, default statuses, createGlobal/updateProfile/updateCatalog bodies, Firestore paths, natural identity logic, ID generation, transactions, normalization, in-memory fallback behavior, runtime validation, storage payloads, API/wire contracts or UI. This unit shares type authority only and must not absorb later-phase runtime status-transition semantics.

**Future focused test**: create exactly one compiler-level test, `src/tests/globalEntityStatusInputAuthority.test.ts`, during implementation. Both create and update boundaries must prove:

- Driver: accepts ACTIVE / SUSPENDED / INACTIVE; rejects MAINTENANCE.
- Truck: accepts ACTIVE / MAINTENANCE / INACTIVE; rejects SUSPENDED.
- Carrier: accepts ACTIVE / SUSPENDED / INACTIVE; rejects MAINTENANCE.
- Material: accepts ACTIVE / INACTIVE; rejects SUSPENDED and MAINTENANCE.
- Each consumes its own entity-local canonical status; no string widening/any, optionality unchanged, entity definitions unchanged.

**Future regressions and verification**: run unchanged `src/tests/globalIdentityFoundation.test.ts`, and discover/run directly relevant global driver/truck/carrier/material repository tests already present. Do not weaken assertions. Compare diagnostics against the current known **445**, requiring **ADDED_DIAGNOSTICS = 0**; lint remains NOT PASS if its exit code remains nonzero. Compare emitted JavaScript for `src/repositories/globalIdentity.repository.ts`, requiring **RUNTIME_EMIT_CHANGE = NONE**. Require `npm run build`, `npm run test:i18n-runtime` and `npm run test:auth-trust-boundary` to pass. These gates are future implementation requirements, not checks executed in this activation.

**Acceptance criteria (20)**:

1. Each entity retains its own canonical status vocabulary.
2. All eight proven duplicate input declarations converge.
3. Driver inputs use GlobalDriverEntity['status'].
4. Truck inputs use GlobalTruckEntity['status'].
5. Carrier inputs use GlobalCarrierEntity['status'].
6. Material inputs use GlobalMaterialEntity['status'].
7. No common cross-entity status type introduced.
8. Exact vocabularies preserved.
9. Optionality preserved.
10. No method body changes.
11. No default value changes.
12. No runtime behavior changes.
13. No persistence/storage/wire changes.
14. No any.
15. No widening.
16. Runtime emit unchanged.
17. Zero new diagnostics.
18. Focused compiler-contract passes.
19. Relevant regressions pass.
20. Exactly one production file modified.

**Stop conditions (11) — stop future implementation and report; do not broaden scope automatically**:

1. Any of the eight input vocabularies differs from its canonical entity.
2. Another status value is discovered that changes the contract.
3. Authority source must change.
4. Another production file must change.
5. A common cross-entity status type becomes necessary.
6. Method bodies/defaults must change.
7. Runtime behavior must change.
8. Storage/wire/API must change.
9. Runtime emit changes materially.
10. New diagnostics appear.
11. Any or widening is required.

**Remaining unassigned Phase 1 families beyond P1-U6 (2)**: Global Material UOM vocabulary authority; User Role vocabulary authority. Three known families remain including active P1-U6. No subsequent unit ID is assigned. Phase 1 remains IN_PROGRESS and PHASE_1_CLOSURE_READY remains NO; no Phase 2 activation or automatic phase closure.

**Later-phase ownership preserved**: timestamp/storage DEFER_PHASE_2; Auth context convergence DEFER_PHASE_3; project lifecycle DEFER_PHASE_4; master relationship behavior DEFER_PHASE_5; import DTO DEFER_PHASE_7_8; pricing DEFER_PHASE_9; Trip lifecycle/model DEFER_PHASE_10; offline/outbox DEFER_PHASE_11. Runtime status-transition semantics remain with their existing behavioral owners.

**Current governance/publication boundary**: NEXT_ACTION is EXECUTE_P1_U6_GLOBAL_ENTITY_STATUS_INPUT_AUTHORITY_CONVERGENCE. Only this ledger and the decision/debt log change. The owner authorizes a single normal branch commit on `reconstruction/p1-u5-closure-p1-u6-activation`, without force push, merge or P1-U6 implementation. Prior accepted units and Phase 0 freeze remain unchanged.


### P1-U6 Bounded Implementation — Awaiting Owner Review

Historical implementation snapshot: owner-review/publication/next-action and residual-inventory pointers are superseded by the closure/activation below. Accepted implementation evidence remains unchanged.

Implementation baseline: `e4718e3fc5a3a8bf4546c1c8c0a19b2dd4943079`. **P1-U6 — Global Entity Status Input Authority Convergence: IMPLEMENTED / AWAITING_OWNER_REVIEW**. Owner acceptance is pending; the unit is not verified/closed. NEXT_ACTION: OWNER_REVIEW_P1_U6_IMPLEMENTATION. Implementation publication: **NOT PUBLISHED**.

**Authority model: ENTITY-LOCAL STATUS AUTHORITY**. Unchanged `src/types/globalEntities.ts` remains canonical. Only `src/repositories/globalIdentity.repository.ts` changes in production, replacing exactly **eight optional status type declarations** with the matching indexed access type:

| Entity-local authority | Exact vocabulary preserved | Create boundary | Update boundary | Declarations |
|---|---|---|---|---|
| `GlobalDriverEntity['status']` | ACTIVE / SUSPENDED / INACTIVE | GlobalDriverRepository.createGlobal input.status | GlobalDriverRepository.updateProfile updates.status | 2 |
| `GlobalTruckEntity['status']` | ACTIVE / MAINTENANCE / INACTIVE | GlobalTruckRepository.createGlobal input.status | GlobalTruckRepository.updateProfile updates.status | 2 |
| `GlobalCarrierEntity['status']` | ACTIVE / SUSPENDED / INACTIVE | GlobalCarrierRepository.createGlobal input.status | GlobalCarrierRepository.updateProfile updates.status | 2 |
| `GlobalMaterialEntity['status']` | ACTIVE / INACTIVE | GlobalMaterialRepository.createGlobal input.status | GlobalMaterialRepository.updateCatalog updates.status | 2 |

Material's actual update method remains **updateCatalog**, as recorded at activation; no method is renamed. No common GlobalEntityStatus or shared cross-entity status authority is introduced. Truck MAINTENANCE and Driver/Carrier SUSPENDED remain distinct; Material accepts neither. All status inputs remain optional, with unchanged undefined/omission behavior; no any or string widening is introduced.

- **Focused compiler test**: new `src/tests/globalEntityStatusInputAuthority.test.ts`, **3/3 PASS**. Real TypeScript fixtures resolve production repository and entity types; AST inspection verifies all eight entity-local indexed references and unchanged optionality. Positive/negative compiler cases cover both create and update for every entity, exact vocabularies, accepted values, omission/undefined, rejection of cross-entity values, invalid/arbitrary strings, null and incompatible types, and no any. Strengthened strict-null checks are scoped to the contract fixture; the full project remains subject to its unchanged lint gate. A read-only virtual baseline comparison also confirms that four implementation-body TS2345 diagnostics under stronger strict-null settings are identical before/after, not new project diagnostics.
- **Existing regressions — unchanged files/assertions**: `src/tests/globalIdentityFoundation.test.ts` **28/28 PASS**; directly relevant `src/tests/projectMembershipFoundation.test.ts` **26/26 PASS**; `src/tests/driverTruckIntakeP602A.test.ts` **14/14 PASS**. Existing regression total **68/68 PASS**. Together with the final focused compiler result, the verification matrix is **71/71 PASS**.
- **Project diagnostics**: baseline **445**, post-change **445**, added **0**, removed **0**, exact full diagnostic records unchanged. Both baseline and final lint exit **2 / NOT PASS**; existing debt is not waived.
- **Runtime emit**: **NONE**. TypeScript and esbuild emit byte-identical JavaScript for the repository file before/after with source maps disabled. Reversing exactly the eight type declarations reproduces the baseline source byte-for-byte; all other production bytes are unchanged.
- **Foundation**: build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**.
- **Defaults / runtime / storage / wire**: **UNCHANGED**. Driver/Truck/Carrier/Material still default to ACTIVE through the exact existing expressions. Method bodies, status conditions such as `if (updates.status)`, transitions, transactions, fallback, ID generation, normalization, natural identity lookups, runtime validation, field names, entity shapes, collection/document paths, persisted values, create/update runtime shapes, repository payloads, API/wire values and UI are untouched.

All 20 bounded implementation acceptance criteria are satisfied within the authorized scope, with no implementation stop-condition expansion. Final scope: exactly one production file, one new focused test, this ledger and the decision/debt log. No authority-source or existing test change; no generated report/artifact drift. P1-U1 through P1-U5 closure records and Phase 0 freeze remain unchanged.

Phase 1 stays **IN_PROGRESS**, **PHASE_1_CLOSURE_READY: NO**. The three-seam review inventory still includes P1-U6 until owner acceptance. Global Material UOM vocabulary authority and User Role vocabulary authority remain unassigned; fresh residual assessment is required after the current unit. No subsequent unit ID or Phase 2 activation is introduced. Later-phase ownership remains unchanged: timestamp/storage Phase 2, Auth context Phase 3, project lifecycle Phase 4, master relationship behavior Phase 5, import DTO Phases 7/8, pricing Phase 9, Trip lifecycle/model Phase 10, offline/outbox Phase 11. Status vocabulary authority sharing does not absorb runtime transition semantics.

**PUBLICATION STATUS: NOT PUBLISHED**. No staging, commit, push or PR occurs in this implementation step.


### P1-U6 Post-Merge Closure Record

**P1-U6 — Global Entity Status Input Authority Convergence is VERIFIED / CLOSED**. Owner review **PASSED**. Implementation/publication commit `7055d09bf18e85366dadca36cdf2efa8d72daac6`; PR **#23**; verified merge/current authoritative main baseline `deb9738b508b0183ccf0d73c1ea0ea6351ce3ea5`. Implementation publication **MERGED / VERIFIED**. Synchronized main contains the implementation commit and corroborates the owner-supplied verified merge.

Accepted evidence remains: exactly **8** duplicate status declarations converged with entity-local authority and no shared cross-entity status type; focused compiler test **3/3 PASS**; unchanged regressions **68/68 PASS**; diagnostics **445 → 445**, added **0**, removed **0**; lint **EXIT 2 / NOT PASS**; runtime emit **NONE**; build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**. Storage/wire and runtime behavior changes **NO**. These are accepted implementation results, not checks rerun by this documentation-only governance step.

P1-U1 through P1-U5 remain VERIFIED / CLOSED; Phase 0 remains VERIFIED / CLOSED / FROZEN. Phase 1 remains IN_PROGRESS, closure readiness NO. The owner explicitly activates P1-U7 below; unit closure does not waive existing debt or activate a later phase.

### P1-U7 Owner-Approved Unit Activation

Historical activation snapshot: implementation status and execution/publication pointers are superseded by the implementation evidence below. Its canonical authority, bounded production scope and exclusions remain binding; the explicit owner exception below adds only one compatibility test edit.

- **Unit ID / title**: P1-U7 — Global Material UOM Vocabulary Authority Convergence.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This activation does not implement, verify or close P1-U7.
- **One purpose**: make existing exported GlobalMaterialUom the canonical authority for targeted exact TON / M3 / TRIP vocabulary declarations, without changing material behavior, validation, persistence, UI, defaults or storage/wire contracts.
- **Read-only canonical authority**: `src/types/globalEntities.ts`, exporting `GlobalMaterialUom = 'TON' | 'M3' | 'TRIP'`; GlobalMaterialEntity.unitOfMeasure already consumes it. Do not modify this source.

**Candidate future production scope (4 files)**:

| Candidate production file | Exact duplicate boundaries | Expected future authority reference |
|---|---|---|
| `src/types/entities.ts` | MaterialEntity.unitOfMeasure | optional GlobalMaterialUom, preserving existing optionality |
| `src/types/wizard.ts` | exported UnitOfMeasure vocabulary | direct reuse, or compatible `export type UnitOfMeasure = GlobalMaterialUom` |
| `src/services/materialManagementClient.service.ts` | MaterialCreateInput.unitOfMeasure and MaterialUpdateInput.unitOfMeasure | optional GlobalMaterialUom at both inputs |
| `src/components/masterData/MaterialEditorModal.tsx` | local unitOfMeasure state generic and select-event type assertion | GlobalMaterialUom state/assertion compatibility |

Read-only inspection locates the exact duplicate declarations in these candidates. **Before implementation**, confirm every targeted declaration is exactly TON / M3 / TRIP and substitution requires no behavior change. If an additional exact duplicate or another required production file is discovered, report before broadening scope. The table is candidate scope, not an implementation performed by this governance update.

**Boundary rule**: converge exact vocabulary authorities only. Broader result/output `unitOfMeasure: string` contracts must remain unchanged unless separately proven safe and explicitly included in a bounded audit. Existing broad result/snapshot/initial-material fields are not automatically authorized for narrowing by this activation. Prefer direct canonical reuse over a second authority; retain exported wizard UnitOfMeasure as a canonical alias only where compatibility requires it. Use type-only imports/aliases so runtime module behavior stays unchanged.

**Explicit exclusions**: do not change GlobalMaterialUom values, material validation, default TON, density behavior, creation/update semantics, server commands, request paths, persistence, Firestore, API payload keys, broader result DTOs, UI labels/select options/behavior, i18n, pricing or import semantics.

**Future focused compiler contract**: create exactly one test during implementation, `src/tests/globalMaterialUomVocabularyAuthority.test.ts`. Use real compiler-level evidence for TON/M3/TRIP accepted and invalid values rejected; shared authority at MaterialEntity, wizard UnitOfMeasure, MaterialCreateInput, MaterialUpdateInput and compatible MaterialEditorModal local state; no targeted string widening or any; optionality preserved.

**Future regressions / diagnostic / runtime gates**: run unchanged `src/tests/globalIdentityFoundation.test.ts` and discover/run existing material-management and project-material creation/update tests. Do not weaken assertions. Compare project diagnostics against the known **445** baseline, requiring **ADDED_DIAGNOSTICS = 0**; do not call lint PASS if it exits nonzero. Compare emitted JavaScript for **every modified production file**, requiring **RUNTIME_EMIT_CHANGE = NONE**. Require `npm run build`, `npm run test:i18n-runtime` and `npm run test:auth-trust-boundary` to pass. These are future implementation gates, not checks executed by this documentation-only activation.

**Acceptance criteria (19)**:

1. GlobalMaterialUom remains canonical authority.
2. Exact TON/M3/TRIP vocabulary preserved.
3. MaterialEntity exact UOM duplicate converged.
4. Wizard UnitOfMeasure duplicate converged.
5. MaterialCreateInput duplicate converged.
6. MaterialUpdateInput duplicate converged.
7. MaterialEditorModal exact local UOM type converged where applicable.
8. Broader string outputs remain unchanged unless separately proven.
9. Default TON preserved.
10. No validation behavior changes.
11. No UI behavior changes.
12. No persistence/storage/wire changes.
13. No any.
14. No widening at targeted boundaries.
15. Runtime emit unchanged.
16. Zero new diagnostics.
17. Focused compiler-contract passes.
18. Relevant regressions pass.
19. Build/i18n/auth pass.

**Stop conditions (10) — stop future implementation and report; do not broaden automatically**:

1. Any targeted vocabulary differs from TON/M3/TRIP.
2. A targeted boundary has broader semantics.
3. Replacing the type changes validation behavior.
4. Another production file becomes necessary unexpectedly.
5. GlobalMaterialUom itself must change.
6. Result DTOs must be narrowed.
7. UI behavior must change.
8. Runtime emit changes materially.
9. New diagnostics appear.
10. Any/widening is required.

**Remaining unassigned Phase 1 family (1)**: User Role vocabulary authority. **FRESH SEMANTIC AUDIT REQUIRED — NOT PROVEN SAFE TYPE-ONLY CONVERGENCE**. Role vocabularies are not proven identical across `src/types/common.ts`, `src/types/entities.ts`, `src/types/wizard.ts`, `server/security.middleware.ts` and validation boundaries. Do not assume compatibility or assign another unit ID. Two known families remain including active P1-U7; Phase 1 remains IN_PROGRESS, PHASE_1_CLOSURE_READY remains NO. No automatic phase closure or Phase 2 activation.

**Debt / governance preservation**: timestamp/storage DEFER_PHASE_2; Auth context convergence DEFER_PHASE_3; project lifecycle DEFER_PHASE_4; master relationship behavior DEFER_PHASE_5; import DTO DEFER_PHASE_7_8; pricing DEFER_PHASE_9; Trip lifecycle/model DEFER_PHASE_10; offline/outbox DEFER_PHASE_11 remain with their existing owners. No production/test/configuration/package/workflow changes occur in this step.

**Current governance/publication boundary**: NEXT_ACTION is EXECUTE_P1_U7_GLOBAL_MATERIAL_UOM_VOCABULARY_AUTHORITY_CONVERGENCE. Only this ledger and the decision/debt log change. The owner authorizes a single normal branch commit on `reconstruction/p1-u6-closure-p1-u7-activation`, without force push, merge or P1-U7 implementation. P1-U1 through P1-U5 and the Phase 0 freeze remain unchanged.


### P1-U7 Bounded Implementation — Awaiting Owner Review

Historical implementation snapshot: owner-review/publication/next-action pointers and the unassigned User Role audit classification are superseded by the closure and accepted semantic partition below. Accepted implementation evidence remains unchanged.

Implementation baseline: `ee0911b916ea7f4e88b84e154cc294bfee422ac4`. **P1-U7 — Global Material UOM Vocabulary Authority Convergence: IMPLEMENTED / AWAITING_OWNER_REVIEW**. Owner acceptance is pending; the unit is not verified/closed. NEXT_ACTION: OWNER_REVIEW_P1_U7_IMPLEMENTATION. Implementation publication: **NOT PUBLISHED**.

**Canonical authority**: unchanged `src/types/globalEntities.ts`, exported **GlobalMaterialUom = TON / M3 / TRIP**. Preflight confirmed all targeted declarations are exact duplicates. Exactly **seven duplicate sites across four production files** converge through erased type-only imports/references:

| Production file | Exact convergence | Optionality / compatibility |
|---|---|---|
| `src/types/entities.ts` | MaterialEntity.unitOfMeasure → GlobalMaterialUom | optional field preserved; other entity fields untouched |
| `src/types/wizard.ts` | exported UnitOfMeasure → GlobalMaterialUom alias | public exported name retained; no independent union |
| `src/services/materialManagementClient.service.ts` | MaterialCreateInput.unitOfMeasure and MaterialUpdateInput.unitOfMeasure → GlobalMaterialUom | both remain optional; no service method changes |
| `src/components/masterData/MaterialEditorModal.tsx` | useState generic, edit-prepopulation assertion and select-event assertion → GlobalMaterialUom | three exact type sites; default TON and all UI logic unchanged |

Broader result/output/initial-material `unitOfMeasure: string` or optional string fields remain unchanged, including MaterialUpdateResult and the modal's broader initial-material input. No output DTO narrowing, new any or targeted string widening.

**TEST_HARNESS_COMPATIBILITY_CORRECTION**: the owner explicitly authorized the additional existing test file `src/tests/truckTypeBoundaryAuthority.test.ts` after preflight identified its obsolete sole-import layout assumption. Only that import assertion block changes: it still requires exactly one local GlobalTruckType binding from the exact canonical module, verifies the original exported symbol and a type-only import, while allowing other canonical types or separate type-only imports. All substantive truck vocabulary, no-any/no-widening, optionality/mutability, stored/input compatibility and compiler positive/negative assertions are byte-for-byte preserved. Test count stays **3**, result **3/3 PASS**. This is not a production-contract change or permission for general historical-test rewrites.

**New focused compiler contract**: `src/tests/globalMaterialUomVocabularyAuthority.test.ts`, **3/3 PASS**. Real TypeScript compiler fixtures resolve production definitions under strict null checks scoped to the contract. AST checks prove all seven canonical references and type-only imports, retained wizard alias, optionality, actual state initializer/default and both modal assertions. The compiler validates TON/M3/TRIP acceptance, invalid/arbitrary strings/null/incompatible values rejection, no any/widening, exact entity/input/alias/state compatibility, and unchanged broader string contracts. The React useState call is extracted from production and checked with actual React types.

**Relevant regression / guard results**:

| Existing test file | Final result |
|---|---|
| `src/tests/globalIdentityFoundation.test.ts` | 28/28 PASS |
| `src/tests/reusableMaterialCreationB1.test.ts` | 20/20 PASS |
| `src/tests/canonicalMaterialEditAuthorityB2.test.ts` | 46/46 PASS |
| `src/tests/projectMembershipFoundation.test.ts` | 26/26 PASS |
| `src/tests/projectCanonicalRefreshBarrierA11.test.ts` | 40/40 PASS |
| `src/tests/rosterSmartImportMaterialLayerC3.test.ts` | 19/19 PASS |
| `src/tests/rosterSmartImportPortalRenderQuality.test.tsx` | 20/20 PASS |
| `src/tests/rosterSmartImportLayeredWorkflowC1.test.ts` | 31/31 PASS |
| `src/tests/translationByConstructionGuard.test.ts` | 25/25 PASS |
| `src/tests/truckTypeBoundaryAuthority.test.ts` | 3/3 PASS; authorized compatibility correction only |

Material/global-identity regressions total **230/230 PASS**; unchanged translation guard **25/25 PASS**; corrected truck test **3/3 PASS**. Existing regression/guard matrix **258/258 PASS**; with the new compiler test, **261/261 PASS**. No other existing test is modified, removed, skipped or weakened.

**Diagnostics**: baseline **445**, final **445**, added **0**, removed **0**; full diagnostic records match exactly. Both lint runs exit **2 / NOT PASS**. Existing debt remains preserved.

**Runtime emit per production file**: entities.ts **NONE**; wizard.ts **NONE**; materialManagementClient.service.ts **NONE**; MaterialEditorModal.tsx **NONE**. Both TypeScript and esbuild emit byte-identical JavaScript before/after for every file, with source maps disabled, including TSX. Reversing only the approved imports, alias and seven type sites reproduces each baseline source byte-for-byte; no executable logic or runtime import changes.

**UI_BEHAVIOR_CHANGED: NO**. Initial TON, edit prepopulation, TON fallback, M3/TRIP handling, density, select options, validation, submit values and refresh/recovery behavior are unchanged. Existing automated modal render/edit/create/refresh tests pass. **Browser/manual verification required: NO**, because runtime emit and behavior are unchanged; no manual/browser session is claimed.

**STORAGE_WIRE_CHANGED: NO; RUNTIME_BEHAVIOR_CHANGED: NO**. unitOfMeasure property names, persisted strings, TON/M3/TRIP wire values, request/response shapes, storage documents, Firestore behavior, validation, material workflows, server commands, pricing/import semantics, labels and i18n remain untouched.

**Foundation**: build **PASS**; i18n-runtime **16/16 PASS**; auth-trust-boundary **23/23 PASS**. All 22 original implementation acceptance criteria and the bounded compatibility preservation requirements are satisfied without further scope expansion.

Exact final scope: **8 files** — four authorized production files, one new focused compiler test, one explicitly authorized compatibility test edit, and this ledger plus the decision/debt log. Authority source and other tests remain unchanged; no package/config/workflow/generated artifacts. P1-U1 through P1-U6 closure records and Phase 0 freeze remain unchanged.

Phase 1 remains **IN_PROGRESS**, **PHASE_1_CLOSURE_READY: NO**. The two-family review inventory includes P1-U7 until owner acceptance and the unassigned User Role vocabulary authority. User Role remains **FRESH_SEMANTIC_AUDIT_REQUIRED_NOT_PROVEN_TYPE_ONLY**; no convergence attempted, subsequent unit ID assigned, or later phase activated. Existing later-phase debt ownership remains unchanged.

**PUBLICATION STATUS: NOT PUBLISHED**. No staging, commit, push or PR occurs in this implementation step.


### P1-U7 Post-Merge Closure Record

**P1-U7 — Global Material UOM Vocabulary Authority Convergence is VERIFIED / CLOSED**. Owner review **PASSED**. Implementation/publication commit `fdb1340af13bac9a7b939ab4bb28345169eedfb7`; PR **#25**; verified merge/current authoritative main baseline `9e93f0e47f955d78d74011b5467aa04188268ca6`. Implementation publication **MERGED / VERIFIED**. Synchronized main contains the reviewed implementation commit and corroborates the owner-supplied verified merge.

Accepted evidence remains: reviewed **8-file scope**, **4 production files**, unchanged GlobalMaterialUom authority, **7** exact TON/M3/TRIP duplicate sites converged, exported UnitOfMeasure canonical alias retained, broader result DTOs unchanged; focused compiler **3/3 PASS**, total verification **261/261 PASS**. The authorized truck test edit remains **TEST_HARNESS_COMPATIBILITY_CORRECTION**, count **3** and substantive truck assertions preserved. Diagnostics **445 → 445**, added **0**, removed **0**, lint **EXIT 2 / NOT PASS**; runtime emit **NONE** for all four production files; UI/storage/wire/runtime unchanged; build **PASS**, i18n-runtime **16/16 PASS**, auth-trust-boundary **23/23 PASS**. These are accepted implementation results, not checks rerun by this documentation-only step.

P1-U1 through P1-U6 remain VERIFIED / CLOSED; Phase 0 remains VERIFIED / CLOSED / FROZEN. Phase 1 remains IN_PROGRESS and closure readiness NO. The owner explicitly assigns P1-U8 after the semantic audit decision below.

### User Role Semantic Audit — Accepted Boundary Partition

The User Role family is not a uniform Phase 1 convergence target. General canonical vocabulary is read-only `src/types/common.ts`, exported **UserRole**, exactly **9 roles**:

`PROJECT_ADMIN | SUPER_ADMIN | SITE_SUPERVISOR | SUPERVISOR | DISPATCHER | FINANCE_AUDITOR | SCALE_OPERATOR | DRIVER | VIEWER`.

| Boundary | Existing semantic vocabulary / purpose | Accepted classification | Disposition |
|---|---|---|---|
| `src/types/entities.ts`: UserEntity.role and UserEntity.requestedRole | Both duplicate the exact full nine-role canonical vocabulary | SAFE_PHASE_1_TYPE_AUTHORITY_CONVERGENCE | P1-U8 only; preserve required role and optional requestedRole |
| `src/types/wizard.ts`: wizard UserRole | Intentional subset: PROJECT_ADMIN / DISPATCHER / FINANCE_AUDITOR / VIEWER | INTENTIONAL_CONTEXT_SUBSET; DO_NOT_CONVERGE_IN_PHASE_1 | DEFER_PHASE_3_SEMANTIC_REVIEW |
| `src/validators/user.validator.ts`: accepted roles | PROJECT_ADMIN / DISPATCHER / FINANCE_AUDITOR / DRIVER / VIEWER; not the full vocabulary | AUTHORIZATION_VALIDATION_SEMANTICS | DEFER_PHASE_3_AUTHORIZATION_VALIDATION_REVIEW |
| `server/security.middleware.ts`: AuthenticatedUser.role | Full vocabulary duplication at an authentication/security context boundary | AUTH_CONTEXT_CONVERGENCE | DEFER_PHASE_3_AUTH_CONTEXT_CONVERGENCE |

The owner-supplied semantic audit decision is corroborated by read-only source inspection. Only the two UserEntity declarations are assigned to Phase 1; the other boundaries are **not unresolved P1-U8 work**. Their Phase 3 semantic/authorization ownership is preserved; matching strings alone do not authorize authentication or validation changes. This partition supersedes the historical unassigned whole-family fresh-audit pointer.

### P1-U8 Owner-Approved Unit Activation

- **Unit ID / title**: P1-U8 — User Entity Role Vocabulary Authority Convergence.
- **Unit type**: BOUNDED_TYPE_AUTHORITY_CONVERGENCE.
- **Status**: NOT_STARTED / ACTIVE. This governance step does not implement, verify or close P1-U8.
- **One purpose**: make UserRole from unchanged `src/types/common.ts` the sole vocabulary authority for exactly **UserEntity.role** and **UserEntity.requestedRole** in `src/types/entities.ts`.
- **Exactly one authorized future production file**: `src/types/entities.ts`.
- **Read-only authority**: `src/types/common.ts`; canonical type **UserRole**, exact nine values above.
- **Future convergence**: `UserEntity.role: UserRole` and `UserEntity.requestedRole?: UserRole`. Preserve requestedRole optionality. The existing BaseAuditedEntity import from `./common` may become `import { BaseAuditedEntity, type UserRole } from './common';` or another equivalent type-safe import form; no runtime import behavior change is authorized.

**Explicit exclusions**: do not modify `src/types/wizard.ts`, `src/validators/user.validator.ts`, `server/security.middleware.ts`, AuthUserContext or AuthenticatedUser behavior, role validation/authorization, RBAC, permissions, admin routing, bootstrap behavior, Firestore user loading or UI role choices. No other role boundary is part of P1-U8.

**Future focused compiler test**: create exactly one test during implementation, `src/tests/userEntityRoleVocabularyAuthority.test.ts`. Real compiler evidence must prove all nine canonical roles accepted, invalid roles rejected, both UserEntity fields compatible with UserRole, requestedRole optional, exact vocabulary preserved, no string widening or any. Also prove the wizard role subset, validator behavior and server AuthenticatedUser contract are not redefined or altered; do not modify those files.

**Future regression / diagnostics / runtime gates**: discover and run directly relevant unchanged user entity/service/repository, role/permission and authentication trust tests; at minimum run `npm run test:auth-trust-boundary`. Do not weaken assertions. Compare diagnostics against known **445**, requiring **ADDED_DIAGNOSTICS = 0**; do not claim lint PASS if it remains nonzero. Compare emitted JavaScript for `src/types/entities.ts`, requiring **RUNTIME_EMIT_CHANGE = NONE**. No runtime or storage/wire behavior change is allowed. These are future implementation gates, not checks executed by this activation.

**Acceptance criteria (18)**:

1. UserRole in common.ts remains canonical authority.
2. UserEntity.role uses UserRole.
3. UserEntity.requestedRole uses UserRole.
4. Exact nine-role vocabulary preserved.
5. requestedRole optionality preserved.
6. No wizard role changes.
7. No validator changes.
8. No server security changes.
9. No AuthUserContext behavior changes.
10. No RBAC behavior changes.
11. No storage/wire changes.
12. No any.
13. No widening.
14. Runtime emit unchanged.
15. Zero new diagnostics.
16. Focused compiler test passes.
17. Relevant regressions pass.
18. Exactly one production file modified.

**Stop conditions (10) — stop future implementation and report; do not broaden automatically**:

1. UserEntity vocabulary differs from canonical UserRole.
2. Another production file is required.
3. Wizard subset must change.
4. Validator behavior must change.
5. Server/security must change.
6. Role authorization behavior must change.
7. Runtime behavior changes.
8. Storage/wire/API changes.
9. New diagnostics appear.
10. Any/widening is required.

**After P1-U8 — conditional next action**: only after implementation, merge and verification, the next required action is **PHASE_1_CLOSURE_AUDIT**. That audit must verify all remaining role differences are correctly deferred to Phase 3 and no further safe Phase-1-owned seam remains. This activation neither promises a clean closure audit nor declares Phase 1 closed. No subsequent unit ID is assigned; no later phase is activated. Phase 1 stays IN_PROGRESS and PHASE_1_CLOSURE_READY stays NO.

**Debt / governance preservation**: the three explicit role deferrals above remain Phase 3 obligations, not unresolved P1-U8 implementation. Existing timestamp/storage Phase 2, other Auth context Phase 3, project lifecycle Phase 4, relationship behavior Phase 5, import DTO Phases 7/8, pricing Phase 9, Trip lifecycle/model Phase 10 and offline/outbox Phase 11 ownership remains unchanged.

**Current governance/publication boundary**: NEXT_ACTION is EXECUTE_P1_U8_USER_ENTITY_ROLE_VOCABULARY_AUTHORITY_CONVERGENCE. Only this ledger and the decision/debt log change. The owner authorizes one normal branch commit on `reconstruction/p1-u7-closure-p1-u8-activation`, without force push, merge or P1-U8 implementation. P1-U1 through P1-U6 and the Phase 0 freeze remain unchanged.

## Phase 1 Owner-Approved Closure Record

Closure evidence baseline: `f817fc8f053aeb2f5f1ecc63f456a939816b7301`. Closure audit: **PHASE_1_CLOSURE_AUDIT_PASS_READY_FOR_OWNER_CLOSURE_DECISION**. Owner closure decision: **APPROVED**. Phase 1 and P1-U1 through P1-U9 are **VERIFIED / CLOSED**; P1-U9 was the final Phase 1 unit. No P1-U10 exists.

| Unit | Title | Implementation commit | PR | Independently verified merge |
|---|---|---|---|---|
| P1-U8 | User Entity Role Vocabulary Authority Convergence | `71bd509547087d8eb34ef160ac96765ff0c7a10d` | #28 | `587f47403a9b768be08794054d6f99cf7f1eb2c1` |
| P1-U9 | Storage Provider Vocabulary Authority Convergence | `8dd14fdc5214539ad9b675733bf3906a20780780` | #29 | `f817fc8f053aeb2f5f1ecc63f456a939816b7301` |

Both units completed bounded implementation, technical verification, owner scope review, publication, independent GitHub publication audit, manual merge and independent merge verification. P1-U8 converged UserEntity.role/requestedRole to canonical UserRole. P1-U9 converged two ClientWorkspaceService provider annotations to canonical StorageProviderType (MY_DRIVE / SHARED_DRIVE). Accepted evidence for each: focused contract 4/4 PASS, diagnostics 445 → 445 (added 0, removed 0), runtime emit NONE, build PASS, i18n-runtime 16/16 PASS and auth-trust-boundary 23/23 PASS. Lint remained EXIT 2 / NOT PASS. P1-U8's historical translation-count regression and P1-U9's two workspace regression failures were reproduced unchanged on their respective baselines; zero new regressions were identified. These are accepted implementation results, not checks rerun by this documentation task.

The post-P1-U9 closure audit found no additional proven SAFE_PHASE_1_SEAM and no Phase-1-owned unresolved regression. Role differences at wizard, validator and authenticated-user boundaries remain intentionally deferred to Phase 3. Persistence/decoder/timestamp debt remains Phase 2; project lifecycle Phase 4; relationship behavior Phase 5; smart import Phases 7–8; pricing Phase 9; trips Phase 10; offline/outbox Phase 11; exception lifecycle Phase 12. Known 445 diagnostics and lint EXIT 2 / NOT PASS do not block this bounded closure or imply repository-wide health. No debt is waived.

Historical Phase 1 closure snapshot (continuation pointers superseded by the Phase 2 activation below): Phase 0 remained VERIFIED / CLOSED / FROZEN. ACTIVE_PHASE and ACTIVE_UNIT were NONE. Phase 2 remained NOT_STARTED with no unit defined. NEXT_ACTION was OWNER_DECISION_TO_ACTIVATE_PHASE_2. That closure decision did not activate Phase 2. The closure evidence SHA is fixed evidence, not a request to recursively update documents after their publication.

## Phase 2 Owner-Approved Governance Activation

Owner decision: **ACTIVATE_PHASE_2 = APPROVED**. Activation evidence baseline: `747e86662b867aa5990f87fb0e60c79b077efb86`. Phase 1 closure documentation commit `12d15710b847bb3b87a8d3aec4432906ea3fdcc4` merged through PR **#30** at this independently verified baseline. Phase 0 remains VERIFIED / CLOSED / FROZEN; Phase 1 and P1-U1 through P1-U9 remain VERIFIED / CLOSED. The accepted Phase 1 closure audit PASS and owner closure approval remain unchanged. No P1-U10 exists.

**Phase 2 — Persistence & Server Authority** is **IN_PROGRESS**, governance only. The accepted foundational-plan goal remains server-authoritative Firestore operations, multi-tenant isolation enforcement, Firebase Admin SDK integration and security-rules auditing. ACTIVE_UNIT: UNASSIGNED / REQUIRES_PHASE_2_FIRST_UNIT_DEFINITION; ACTIVE_UNIT_STATUS: UNASSIGNED / NOT_STARTED; ACTIVE_UNIT_TYPE: UNASSIGNED. P2_U1_STATUS: DOES_NOT_EXIST. No implementation unit is active or authorized.

NEXT_ACTION: **PHASE_2_FIRST_UNIT_DEFINITION_AUDIT**, a separate read-only audit to identify the first safe bounded seam for owner review and explicit unit approval. This activation neither performs that audit nor selects a candidate.

Candidate audit territory, not remediation authorization: persistence authority; Firestore read/write representation boundaries; cast-based reads and decoders; Timestamp / Date / ISO-string conversions; storage representations; server/client persistence authority; persistence-side natural-identity representation where applicable.

Boundaries remain intact: Phase 3 authentication/RBAC/role and validation semantics (including wizard, UserValidator and authenticated-user role differences); Phase 4 project lifecycle; Phase 5 canonical relationship/master-data behavior; Phases 7–8 import parsing/matching/checkpoints/commit integrity; Phase 9 pricing; Phase 10 trip lifecycle/models; Phase 11 offline/outbox/replay/conflicts; Phase 12 exception lifecycle. A domain's persistence representation does not authorize changes to its behavior. Known 445 diagnostics and lint EXIT 2 / NOT PASS remain recorded debt, not a fresh verification or waiver. This task changes documentation only: no production, test, server, Firestore rules, SDK, schema, decoder, timestamp code, package/config/workflow, lockfile or generated-output changes.

### Historical P8-B4 pre-publication implementation record

Baseline: `8c6a348d17b0f94215a56bb9a66f2e643c19f24c`, PR #60, including accepted B3 implementation `ed5688c81e95952d69a21e8fbacae4c0095967c4`. B3 source and history were verified before starting this unit. P8-B4 coordinates the existing durable Session/B2/B3 authorities; it does not replace their business rules.

The Wizard discovers terminal Roster results through an explicit list opt-in, reads managed execution status before restoring any row-based review, and displays durable completed/remaining evidence. Retry and cancel carry the current operation version. Completed/cancelled/review-required operations cannot masquerade as normal retryable review. Lost commit responses are reconciled by querying execution status. Canonical refresh is separate from execution and cannot replay the commit.

Local sources are reattached only before analysis when bytes are needed: name/size/MIME and SHA-256 are checked against the persisted revision using the same buffer passed to analysis; no Session/mapping/review identity is replaced. Persisted resolution/review snapshots and terminal receipts do not require original bytes. Sheets Roster uses the existing authorized Workspace source reader, binds spreadsheet/tab and SHA-256 of the values snapshot, and passes the source through the same Roster stages as files. A changed remote snapshot fails closed before pre-analysis resume. Trip's Sheets pipeline is unchanged.

Project and Session generation checks fence late resume/status/reattach/retry/cancel/refresh results. The legacy Roster raw-row committer remains fenced and its old Wizard handler has no active caller. Local verification uses actual UI and server services with a transactional in-memory database; live Firebase and live Google OAuth/Sheets acceptance are not claimed. Publication is authorized only for this B4 branch; owner merge remains manual. Phase 9 is not started.

Local verification observation for this implementation: B4 14/14, B3 30/30, B2 50/50, B1 41/41. Combined relevant verification 1559/1628 with 69 failing assertions reproduced on this exact merged baseline; zero newly failing tests. Three historical test files preserve their test counts while converging superseded presentation/source-layout assertions. Build passes; diagnostics 440→440, added/removed zero; lint EXIT 2 / NOT PASS. Ten actual-Wizard browser checks exercise journeys A–I plus canonical refresh failure using transactional in-memory persistence and controlled Google transport. These counts are dated evidence, not permanent cardinality rules. No live Firebase/Google acceptance is claimed. The unit's bounded interruption/resume exit gate is locally verified; owner merge and broader deployment/release gates remain separate.

### Historical P9-U1 implementation record — Pricing Authority & Historical Snapshot Integrity — 2026-10-29

Source baseline `31b2065f00b0d07763afc153582ef9be71dbd159` contains P8-B4 implementation `71abdcd3b586be486e6aec74f8ad9e32c868eae9`, merged through PR #61. Phase 8 is source-verified/closed under the owner's instruction; this is not a live deployment certification. Phase 9 is IN_PROGRESS. Phase 10 is NOT_STARTED.

The impact map identifies `ProjectPricingServerService` as the authenticated rule write/query authority and `PricingService` as its shared pure selection/calculation policy. Wizard reads/edits and field previews use server transport, not client Firestore writes or cache fallbacks. Server Trip assignment composes the same canonical query with the existing transaction-backed adapter. Project readiness uses the same selection predicate within its activation read set. Canonical current-account, Project, Carrier and applicable Material participation are revalidated; legacy authorization arrays cannot authorize pricing.

Calendar-date boundaries include the complete UTC day. Explicit ISO cutoffs preserve their precise instant, including transaction-time expiry checks. Writes conservatively reject overlapping calendar-day windows at the same Project/Carrier/Material specificity; no intraday rule-ordering feature is introduced. Specific Material wins over general, and ambiguous equal-specificity candidates fail closed. Dispatch uses current server time; imported Trips use their explicit operational date when present. Missing pricing rejects normal dispatch; the existing explicit imported pending mode remains separate.

Trip snapshots preserve rate, type, currency, version, effective terms and contractual waiting terms. Completion calculates quantity against that snapshot using the shared engine. Linked commercial rule mutation is rejected; deactivation/replacement does not rewrite Trips. Reports no longer query current master rates to manufacture missing historical waiting charges: insufficient stored evidence stays pending.

The client-only COW placeholder is fail-closed, not promoted into a new repricing feature. The non-persistent Pricing Engine simulator is explicitly labelled. Read-only legacy inspection remains separate from active pricing selection; general COW UX and migration of unsupported legacy pricing models remain separately bounded work, not a new unit ID. These limitations are why Phase 9 is not declared complete by P9-U1.


#### P9-U1 local verification observation — 2026-10-29

P9-U1 is IMPLEMENTED / VERIFIED LOCALLY; Phase 9 remains IN_PROGRESS. NEXT_ACTION is OWNER_MERGE_P9_U1, following the explicitly authorized single implementation commit and branch publication. This record does not assert that publication or owner merge has already occurred. Phase 10 is NOT_STARTED.

Focused pricing tests: 31/31. Relevant pricing/setup/readiness/Trip/report regressions plus focused tests: 465/472, with seven baseline-reproduced failures; the original baseline runs observed 433/441. A baseline outbox replay failure was intermittent (baseline standalone rerun 5/5) and is not claimed as a P9 fix. Additional import regressions are unchanged at 68/95 before/after, with the same 27 historical failures. NEW_FAILURES = 0; REMOVED_TESTS = 0; SKIPPED_TESTS = 0. Existing changed test counts remain 76, 75, 41, 67 and 28 respectively for persistence-boundary, activation-boundary, activation-readiness, activation-server and pricing-server suites.

Build PASS. Typecheck diagnostics 440→440, added 0 / removed 0 after normalizing source locations; lint EXIT 2 / NOT PASS. i18n runtime 16/16 PASS; current dictionaries each have 4375 keys (one simulator-label addition), with no duplicate keys, parity gaps or empty values. Seven browser/runtime checks passed using actual Wizard UI and actual pricing/Trip services with transactional IN_MEMORY persistence and controlled authentication transport; no emulator/live Firebase acceptance is claimed. Historical Trip persistence reopening is checked through actual services, not represented as exhaustive live Trip-screen certification. These counts are observations, not frozen cardinality rules.

The shared policy rejects invalid/non-positive commercial rates and unsupported models both for readiness and operational selection. Legacy rate aliases are normalized once; a conflicting agreedRate cannot override the canonical selected rate. Existing stored VAT terms are retained without changing VAT policy. General COW/versioning UX and unsupported legacy model migration remain separately bounded debt.


### P9-U2 — Commercial Rule Versioning & Phase 9 Closure — 2026-10-29

Merged baseline `303469ef29b7cf906964316691e491c0df6d5e45` (PR #62) contains accepted P9-U1 `3d7aa9a0a09210e409fc554fe7a02a8446a625ee` and its canonical authority/snapshot protections. P9-U1 is MERGED / SOURCE_VERIFIED / CLOSED. P9-U2 is IMPLEMENTED / VERIFIED LOCALLY. Phase 9 is IMPLEMENTATION COMPLETE / AWAITING MERGE, not MERGED/CLOSED. Phase 10 is NOT_STARTED; no subsequent unit is assigned. Owner merge remains manual. Commit/branch publication are explicitly authorized, but this pre-commit evidence record does not claim they already happened.

The remaining-gap audit classified canonical authority/participation/date policy and snapshot protection as COMPLETE_IN_P9_U1; used-rule atomic replacement, minimum lifecycle UX and shared captured-tax calculation as IMPLEMENT_IN_P9_U2; legacy aliases/optional-term preservation, minimum billed weight and configuration validation as SUPPORTED_BUT_NEEDS_HARDENING. Generalized calculators, tax/accounting and new waiting/approval workflows are NOT_IN_APPROVED_PRODUCT_SCOPE. Existing unused legacy approval/prototype methods are HISTORICAL_ONLY / DEAD_OR_UNREACHABLE for the active commercial journey. Offline/Trip/audit reconstruction and live deployment certification retain their later/separate gates.

`POST pricing-rules/:ruleId/save` is one server-decided action: unused rules edit; used commercial changes create a successor; status-only changes retain identity. The server rechecks usage/authorization/participation/version inside the transaction. A predecessor retains original commercial fields and receives server-owned `supersededByRuleId` / `supersededFrom` metadata. The successor has a new canonical ID and parent/version lineage. Replacement starts at an explicit UTC day later than the predecessor start, retains Carrier/Material identity, and passes the existing conservative calendar-day conflict policy. Old resolution ends exclusively at the cutoff; deactivating the successor never revives its predecessor. Mutation of an already replaced rule's commercial terms is rejected. No rule is deleted. Two existing CREATE/UPDATE audits share one replacement correlation; both rule changes and audits commit or roll back together.

PER_TON and PER_TRIP remain the only active calculators. Measured tonnage is rounded to three decimals, the configured minimum billable weight is captured/applied when positive weight exists, and monetary base is rounded to two decimals. Physical weights are unchanged. Rates are tax-exclusive; stored applicability/percentage (default 15 only when absent) govern subtotal→VAT→total rounding to two decimals. Current rule changes never reprice a fixed Trip. Existing waiting/free-time terms and stored report charges remain preserved; missing historical evidence remains pending. Canonical Trip command fields do not expose manual financial charges or automatic waiting accrual. The old browser settlement-approval service has no active UI/server caller and is not activated. Legacy supported aliases/general-Material sentinels normalize once into the same policy; absent historical optional terms are retained. Unsupported models fail closed and are not silently converted. No speculative live-data migration is claimed.

#### Phase 9 source closure matrix

| Phase 9 requirement | Status | Evidence |
|---|---|---|
| One server pricing authority | VERIFIED_COMPLETE | ProjectPricingServerService; one save/create/update authority, authenticated transport |
| Canonical participation | VERIFIED_COMPLETE | Current account, Project, global + Project Carrier/Material checks; U1 and U2 negative cases |
| Deterministic effective period | VERIFIED_COMPLETE | Shared PricingService; inclusive UTC calendar days, precise ISO instants, explicit exclusive predecessor cutoff |
| Supported pricing models | VERIFIED_COMPLETE | Server PER_TON/PER_TRIP completion/import, rounding and minimum-weight tests |
| VAT/tax | VERIFIED_COMPLETE | Stored applicability/percentage, shared commercialTotals, historical replacement and zero-rate cases |
| Demurrage/adjustments | VERIFIED_COMPLETE | Existing contractual terms/stored charges preserved; reports do not infer missing historical terms; no new accrual/approval capability is claimed |
| Overlap/conflict protection | VERIFIED_COMPLETE | Transactional conflict query, legacy general-sentinel normalization, concurrent replacement test |
| Activation/deactivation | VERIFIED_COMPLETE | Version-fenced status changes; deactivation cannot revive predecessor; historical snapshot unchanged |
| Version/COW semantics | VERIFIED_COMPLETE | New successor ID/parent, immutable predecessor commercial terms, atomic cutoff/audit, stale and branching rejection |
| Immutable historical snapshot | VERIFIED_COMPLETE | Trip A complete→V2→reopen unchanged; Trip B gets V2; tax/waiting/minimum terms retained |
| Admin-only mutation | VERIFIED_COMPLETE | Existing PROJECT_ADMIN / FINANCE_AUDITOR / SUPER_ADMIN authority re-read on server; forged role and scope rejection |
| Audit events | VERIFIED_COMPLETE | Existing CREATE/UPDATE events with full before/after, actor, Project, timestamps and shared replacement correlation |
| Legacy compatibility bounded | ROUTED_WITHOUT_BLOCKING_PHASE | Supported aliases normalized; unsupported models rejected, read-only prototypes not active authority; speculative dataset migration requires separate inventory |

BLOCKING = 0 for the approved Phase 9 source contract. New accounting/invoicing, generalized tax, automatic waiting accrual, unreachable legacy adjustment approvals and unsupported calculators are NOT_IN_APPROVED_SCOPE, not missing approved features silently waived. Live Firebase/deployment acceptance and general release certification are not claimed by this closure decision.

#### Verification observation (not frozen cardinalities)

Exact merged baseline: 523/531 across the same relevant regression + i18n selection. Final: 550/558, including 27/27 new P9-U2 tests; P9-U1 remains 31/31. NEW_FAILURES = 0; REMOVED_TESTS = 0; SKIPPED_TESTS = 0. No existing test file was modified. The eight reproduced failures are canonical dispatch cases A/U, activation-readiness M, three Trip-command legacy allocation fixture cases, the persistence import-session ISO/metadata case, and TBC-B4's historical Smart Import checkpoint-key expectation. These suites are NOT represented as wholly passing and are not repaired outside scope.

Build PASS. Diagnostics 440→440, added 0 / removed 0; lint EXIT 2 / NOT PASS. Browser/runtime 8/8 with actual Wizard and pricing/Trip services, transactional IN_MEMORY persistence and controlled authentication transport. No emulator/live Firebase acceptance. AR/EN/UR each 4384 keys (nine lifecycle/hint keys added); duplicate keys/parity gaps/empty values 0. `git diff --check` PASS. Historical specification bodies, old handoffs and Studio snapshots are preserved. Dependencies/config/workflows/rules, offline/Trip FSM and report/dashboard architecture are unchanged.
