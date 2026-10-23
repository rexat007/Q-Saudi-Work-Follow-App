# Q-SAUDI WORK FOLLOW — CURRENT CONVERSATION HANDOFF
## Reconstruction continuation snapshot — 2026-10-23

### 1. Repository authority
- Repository: `rexat007/Q-Saudi-Work-Follow-App`
- Authoritative branch: `main`
- Verified main HEAD: `b360fe7c717cff35357dc539ca37d83bea1b348c`
- Latest verified merge: PR #26 — `docs(reconstruction): close P1-U7 and activate P1-U8`
- GitHub `main` is the sole code truth.
- Current state authority: `docs/reconstruction/02_PHASE_LEDGER.md`.

### 2. Operating method
Use exactly this cycle:
**area audit → semantic decision → bounded implementation → technical verification → owner scope review → branch commit/push → independent GitHub audit → PR → user manual merge → independent merge audit → real runtime/browser verification when applicable → explicit acceptance → documentation closure.**

Rules:
- One bounded unit at a time.
- Do not invent unit IDs.
- Do not reopen accepted units without a proven regression.
- Historical reports/cardinality are not current contracts by default.
- Vitest is the active automated framework.
- Tests/build are necessary but not sufficient for product-facing closure.
- Implementation reports cannot self-declare USER ACCEPTED.
- Do not state Git state without independent GitHub evidence.
- User manually merges PRs.
- Minimize turns, but do not skip governance gates.
- Do not recursively rewrite historical SHA records merely because main advances.

### 3. Phase status
- Phase 0: **VERIFIED / CLOSED / FROZEN**.
- Phase 1: **IN_PROGRESS**.
- P1-U1: VERIFIED / CLOSED.
- P1-U2: VERIFIED / CLOSED.
- P1-U3: VERIFIED / CLOSED.
- P1-U4: VERIFIED / CLOSED.
- P1-U5: VERIFIED / CLOSED.
- P1-U6: VERIFIED / CLOSED.
- P1-U7: VERIFIED / CLOSED.
- P1-U8: **NOT_STARTED / ACTIVE**.
- Phase 1 closure ready: **NO**.
- P1-U9: **NOT ASSIGNED**.

### 4. Phase 1 completed units
#### P1-U1 — Canonical Domain Authority and Identity Boundary Contract
Contract-first authority/identity boundary. Closed.

#### P1-U2 — Temporal Fleet Relationship Policy Type Authority Convergence
PureAssignment/PureAllocation canonical type authority convergence. Closed.

#### P1-U3 — Truck Type Vocabulary Authority Across Input and Stored Boundaries
Canonical `GlobalTruckType` convergence. Closed.

#### P1-U4 — Settlement Adjustment Type Vocabulary Authority Convergence
Canonical `SettlementAdjustmentType` convergence. Closed.

#### P1-U5 — Affiliation Status Vocabulary Authority Convergence
Canonical `AffiliationStatus` convergence. Closed.

#### P1-U6 — Global Entity Status Input Authority Convergence
Eight entity-local create/update status declarations converged without creating one shared status type. Closed.

#### P1-U7 — Global Material UOM Vocabulary Authority Convergence
Canonical `GlobalMaterialUom` convergence across 7 duplicate sites.
Implementation commit: `fdb1340af13bac9a7b939ab4bb28345169eedfb7`
PR: #25
Verified merge: `9e93f0e47f955d78d74011b5467aa04188268ca6`
Accepted evidence:
- 261/261 tests PASS including new compiler contract.
- diagnostics 445 → 445; added 0; removed 0.
- lint remains EXIT 2 / NOT PASS.
- runtime emit NONE.
- build PASS.
- i18n-runtime 16/16 PASS.
- auth-trust-boundary 23/23 PASS.
- UI/storage/wire/runtime unchanged.
- authorized truck test change classified TEST_HARNESS_COMPATIBILITY_CORRECTION.

### 5. Active unit — P1-U8
**Title:** User Entity Role Vocabulary Authority Convergence  
**Type:** BOUNDED_TYPE_AUTHORITY_CONVERGENCE  
**Status:** NOT_STARTED / ACTIVE

Canonical authority:
- `src/types/common.ts`
- `UserRole`
- canonical role count: 9

Authorized production scope:
- exactly `src/types/entities.ts`

Target fields only:
- `UserEntity.role`
- `UserEntity.requestedRole`

Expected convergence:
- `UserEntity.role: UserRole`
- `UserEntity.requestedRole?: UserRole`

Exact canonical vocabulary:
- PROJECT_ADMIN
- SUPER_ADMIN
- SITE_SUPERVISOR
- SUPERVISOR
- DISPATCHER
- FINANCE_AUDITOR
- SCALE_OPERATOR
- DRIVER
- VIEWER

Preserve:
- requestedRole optionality.
- exact 9-role vocabulary.
- storage/wire/runtime behavior.
- zero widening and zero `any`.
- runtime emit NONE.
- zero new diagnostics.

### 6. Explicit P1-U8 exclusions / Phase 3 deferrals
Do not modify in P1-U8:
- `src/types/wizard.ts`
- `src/validators/user.validator.ts`
- `server/security.middleware.ts`
- AuthUserContext behavior
- AuthenticatedUser behavior
- RBAC
- permissions
- admin routing
- bootstrap behavior
- Firestore user loading
- UI role choices

Deferrals:
- wizard 4-role subset → `DEFER_PHASE_3_SEMANTIC_REVIEW`
- UserValidator 5-role accepted subset → `DEFER_PHASE_3_AUTHORIZATION_VALIDATION_REVIEW`
- server AuthenticatedUser.role → `DEFER_PHASE_3_AUTH_CONTEXT_CONVERGENCE`

These differences are not unresolved P1-U8 work.

### 7. Required P1-U8 verification
Create exactly one focused compiler contract:
`src/tests/userEntityRoleVocabularyAuthority.test.ts`

Verify:
- all 9 canonical roles accepted by UserRole.
- invalid role rejected.
- UserEntity.role compatible with UserRole.
- UserEntity.requestedRole compatible with UserRole.
- requestedRole remains optional.
- no widening to string.
- no any.
- excluded wizard/validator/server files unchanged.

Run relevant unchanged user/role regressions and at minimum:
- `npm run test:auth-trust-boundary`
- `npm run build`
- `npm run test:i18n-runtime`

Known diagnostic baseline:
- 445
- added diagnostics must remain 0.
- lint may remain EXIT 2 / NOT PASS and must not be called PASS.

Runtime emit:
- compare `src/types/entities.ts`
- required: NONE.

### 8. P1-U8 stop conditions
STOP if:
- UserEntity vocabulary differs from canonical UserRole.
- another production file is required.
- wizard subset must change.
- validator behavior must change.
- server/security must change.
- authorization/RBAC semantics must change.
- runtime behavior or storage/wire/API changes.
- new diagnostics appear.
- any or widening is required.

### 9. After P1-U8
Do **not** introduce P1-U9 automatically.

After:
1. implementation,
2. owner review,
3. publication,
4. manual merge,
5. independent merge verification,

the next required action is:

**PHASE_1_CLOSURE_AUDIT**

The closure audit must confirm:
- no remaining safe Phase-1 seam,
- Phase 3 role deferrals are correctly classified,
- later-phase debt remains routed to its owning phase,
- Phase 1 can be explicitly closed before Phase 2 activation.

### 10. Known global technical debt / governance facts
- Full-repository TypeScript diagnostics baseline remains 445 at the latest verified bounded runs.
- `npm run lint` currently exits 2 / NOT PASS; never describe it as PASS.
- Phase 0 freeze does not imply zero technical debt.
- Later-phase ownership remains:
  - persistence/timestamp/decoder authority → Phase 2
  - auth/RBAC/security role semantics → Phase 3
  - project lifecycle → Phase 4
  - relationship behavior → Phase 5
  - smart import → Phases 7–8
  - pricing → Phase 9
  - trips → Phase 10
  - offline/outbox → Phase 11

### 11. Tool/environment note
Current Q-Saudi implementation environment is Codex/local repository workflow with GitHub as authority.
If Google AI Studio is ever used, do not assume it can read GitHub automatically; provide direct internet URLs for GitHub files/data when asking Studio to read them.

### 12. Immediate next action
Start by independently verifying GitHub main HEAD:
`b360fe7c717cff35357dc539ca37d83bea1b348c`

Then execute **P1-U8 — User Entity Role Vocabulary Authority Convergence** under the exact bounded contract above. Do not begin Phase 1 closure audit until P1-U8 has been implemented, reviewed, merged, and independently verified.
