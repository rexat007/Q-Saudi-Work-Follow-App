# Workflow spines at the pinned source

Read with `workflow-evidence.json`, `routes.csv`, `imports.csv` and the full
compressed call-site/type/declaration map. Paths below are repository relative.
An import edge proves a dependency; it does not prove a runtime branch is taken.
The API routes are registrations, not a claim that SQL is active.

## Shared authority boundary

`src/main.tsx → src/App.tsx` composes the browser. `server.ts → server/app.ts`
composes Express. `server/app.ts:59` installs `authenticateUser` before API
handlers. `server/security.middleware.ts` verifies the token and builds a current
principal; command services re-read current account/project evidence in their
transactions. Browser repository reads separately depend on Firebase Auth and
`firestore.rules`; they do not pass through Express. This is an intentional
fork in the traces, not a missing invented API.

`server/runtimeComposition.ts` permits Firestore and rejects `/api/v2/` in
production. `server/sqlRuntimeRoutes.ts` is a separately registered, inactive
composition requiring the central authority witness, least-privilege pools and
matching operator-established epoch. SQL methods authorize in their own unit of
work. Request headers cannot choose the business authority. No convergence
change alters either selection boundary.

## Cross-domain traces

| Workflow | UI / client / API | Authentication, authorization and business transaction | Persistence, receipt and readback / reporting |
|---|---|---|---|
| Authentication and account governance | `firebase/authContext.tsx`, `AccountStatusGate`, `AdminConsoleView`; `/api/auth/bootstrap`, `/api/admin/users/:userId/commands` | Firebase token → middleware current principal → `AdminAccountServerService.execute`; transaction rechecks account, role changes and last-admin protections | `users`, administrative audit in one transaction; current profile readback. SQL `sqlGovernanceClient` → `/api/v2/account` and governance routes → `SqlGovernanceAuthority` / `authAdapter`; governance operation receipt. No claim that administrative audit is a Google export receipt |
| Project foundation and activation | `ProjectSetupWizard` or `SqlProjectSetup`; foundation, readiness, activate, lifecycle routes in `server/app.ts` | `ProjectCommandsServerService`, `ProjectLifecycleServerService`, `ProjectActivationService`; `ProjectReadinessAdminReadContext.currentPrincipal`; candidate discovery followed by transaction-time validation | `projects` plus audit; readiness/setup read contexts; fleet/foundation readback. SQL governance assessment and command receipts are separate from actual operational-route completion. Workspace readiness remains a separate gate |
| Carriers, materials, drivers and trucks | Wizard/Fleet workspace → setup-carrier/material/driver/truck, canonical intake and global identity clients | `globalIdentityAuthority.server.ts`, `driverTruckIntake.service.ts`; current principal, project mutability, canonical natural-key lookup and eligibility | Global collections and `natural_identity_lookups`; project memberships/affiliations, audit; foundation/fleet/relationship-context reads. SQL canonical authority and migration 004 provide the future authority, not legacy project-local identity substitution |
| Membership and temporal relationships | Wizard relationship commands → membership/affiliation/assignment/allocation endpoints | `ProjectParticipationAuthority` and `TemporalRelationshipAuthority`, `authorizeGlobalCommand`; transaction reads memberships, both parties, current pointers and intervals before closing/opening relationships | Memberships, affiliations, `driver_truck_assignments`, allocations and active pointers plus audit; relationship context/fleet read model readback. SQL temporal authority/repository and migration 005 enforce corresponding SQL constraints. Membership existence is not equivalent to current operational eligibility |
| Smart Import and durable execution | Wizard → parser/mapping → `DriverTruckPipelineService` → canonical snapshot and selection → reviewed intent → import-session/execution routes. Future `SqlImportJourney` uses `/api/v2/.../imports/:sessionId` | `canonicalResolution`, `rosterCanonicalIntent`, `reviewedRosterCommit.server`, `rosterExecution.server`; authenticated project scope, immutable source/mapping versions, accepted signature, bounded frozen consequence groups; per-group transaction authorization and fencing | Durable session/artifact chunks, source revision, execution plan, operation and consequence receipts; execution status/readback and resume-stage presentation. SQL `SqlImmutableImportSourceStore` and `SqlImportAuthority` preserve a distinct authenticated source receipt. This correction affects presentation gates only; no preview becomes execution authority |
| Pricing and commercial versioning | `Step4PricingRules` → pricing client → create/save/update pricing routes | `ProjectPricingServerService`; current principal, project/global/membership checks in transaction; existing trip usage determines immutable predecessor/successor behavior | `pricing_rules`, correlated audit, captured trip pricing snapshot; readback/list and `PricingService` calculation; reports consume historical snapshots. SQL `tripPricingRepository` and migration 008 remain future authority. Stored snapshots cannot be repriced from mutable master data |
| Trips, loading, weighbridge and unloading | Field operations → `tripCommandClient.service.ts` → `/api/projects/:projectId/trips/commands`; SQL workstation uses SQL trip routes | `TripCommandsServerService` validates allowed command/payload, re-reads account, project scope, role and driver ownership; `TripService` / FSM uses `tripTransactionDatabase` buffered writes within one transaction | Project trips, measurements, captured pricing, audit and `sync_operations` idempotency ledger; replay checks fingerprint and current authorization; canonical trip readback feeds reports. SQL `SqlTripAuthority`, measurement/pricing repositories and operation receipt provide the inactive counterpart |
| Corrections, settlements and exceptions | `REPORT_EXCEPTION` goes through trip command API. Field supervision also reads `exceptionEngine`; the standalone exception view and `settlementAdjustmentService` have no static import path from `src/main.tsx` | Persisted command path uses the trip transaction and canonical exception repository. `settlementAdjustment.service.ts` contains an older client-context workflow; no approved active server adjustment/approval route was established by this inspection | Persisted exceptions are nested under project/trip and read by reports. **Gap:** field supervision uses process-local `ExceptionEngineService` instead, with no durable readback in that branch. It is statically reachable through App → FieldOperations → FieldSupervision. Do not claim complete operational exception reconciliation or generalized financial adjustment support |
| Offline recovery | `OutboxDrawer` / IndexedDB → legacy outbox → authenticated trip command client. SQL `SqlJournalPanel` → coordinator/store/HTTP transport | Legacy current runtime checks plus server idempotency/authorization; SQL queue validates scoped digest, epoch, leases and command identity before bounded sends/recovery | IndexedDB pending/sending/uncertain states; server operation receipt and canonical readback; SQL `offlineRecoveryAuthority` for historical/canonical receipt distinctions. No legacy queue is silently converted into SQL commands; no timer or browser Google writer is introduced |
| Google Workspace projection | Wizard Workspace panel → Workspace client → server project-bound routes/coordinator → server-owned transport | Current principal/project/binding/grant and generation checks; delivery claims and frozen RPC/marker evidence in existing U08 authority. Provider I/O occurs outside Firestore transaction | Projection state, frozen request, Google developer-metadata marker, transactional acknowledgment, outbox source revision and report freshness. `workspaceProjectionDelivery` re-reads marker after uncertain provider response. **Gap at published base:** `sqlWorkspaceComposition` is fail-closed, not a composed SQL writer. Uncommitted RB4 journal/013 is preserved elsewhere and not certified by this work |
| Reports and exports | `ReportsEngineView` → authorized project list → project trip/exception repositories → `ReportsEngineService` → CSV/XLSX; Workspace report refresh route is a separate server flow | Firebase-authenticated scoped repository reads and Rules, then bounded in-browser report computation; no invented Express transaction for a local export. Server Workspace refresh resolves current execution credentials | Trip and exception readback, stored pricing/weight provenance → report dataset/export. Current view reads up to 1,000 trips per selected project: not proof of full-history completeness. Migration readiness instead uses `approvedFrozenExport`, deterministic source inventory/manifests, SQL comparison and reconciliation receipts; a hash alone is not source ownership |

## Boundaries requiring further convergence

These are source findings, not waived release issues. Static reachability does
not establish deployment usage or exploitability. The compressed graph retains
all source-to-test imports (11 declarations); some old component engines import
test/demo helpers. Determine reachable production behavior before changing their
public contracts. The process-local exception read and report row bound need
focused acceptance tests and coherent readback design in execution 2. Historical
authority failures and diagnostic debt must be reconciled by exact identity.

This document traces the observed spines and explicitly broken/unsupported
edges. It does **not** certify exhaustive dynamic call-target resolution, live
Firebase Rules enforcement, production data completeness, Google grants, or
integrated cutover acceptance. All 1,502 base blobs were processed; that exact
processing count must not be substituted for full semantic/runtime certification.
