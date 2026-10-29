# Project Foundation Maintenance Contract — PFAG-RB2

CURRENT_SUPPORTING_CONTRACT. [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) alone owns current unit and acceptance state. This contract describes source behavior, not deployed Firebase acceptance.

## Canonical authority and consistency

`GET /api/projects/:projectId/foundation-snapshot` composes Project, Carrier/Material lists, eligible Driver/Truck context, all membership/affiliation maintenance participants, assignment/allocation/Fleet projections and readiness in one read transaction. It reuses existing readers and readiness policy. The response identifies `SERVER_TRANSACTION_SNAPSHOT`; independent endpoint results are never stitched into an asserted coherent generation. Client checks scope, eligible list IDs/names and Fleet-derived relationship mappings before returning a snapshot. Wizard and its Fleet host consume the same snapshot, including readiness. Read-only standalone Setup reads remain valid but are not substituted into a post-mutation convergence proof.

A mutation receipt is retained until coherent refresh and expected result proof succeed. Driver/Truck profile result versions and other operation receipts are checked before apply; Project edits compare the expected safe fields. Retrying after confirmed mutation success retries reads only. Current Project/context generation is checked after awaits and before applies; unmounted/replaced editor lifetimes invalidate late responses. Error codes distinguish mutation rejection, refresh incoherence, stale generation and confirmed mutation with pending refresh. No general event/version framework is introduced.

## Project field matrix

Statuses: PRE = SETUP / READY_FOR_REVIEW / APPROVED; LIVE = PRE plus ACTIVE. Unknown/legacy states fail closed. SUSPENDED/ARCHIVED allow scoped consistency cleanup only. PA = active PROJECT_ADMIN assigned to this Project; SA = active SUPER_ADMIN. All accepted writes emit existing audit evidence. IDs and creation provenance are server-generated; audit/version fields are server-owned.

| Field | Classification | Allowed edit/status | Role/authority | Impact / audit |
|---|---|---|---|---|
| projectId | IMMUTABLE_IDENTITY | Never ordinary edit | SA creation command only | Primary identity; creation audit |
| projectCode | IMMUTABLE_IDENTITY | Never ordinary edit | Server allocation at creation | Natural/system identity; creation audit |
| projectNumber | IMMUTABLE_IDENTITY | Never ordinary edit | Server counter at creation | System identity; creation audit |
| createdAt | IMMUTABLE_IDENTITY | Never edit | Server-owned | Provenance preserved |
| createdBy | IMMUTABLE_IDENTITY | Never edit | Server-owned | Provenance preserved |
| updatedAt | IMMUTABLE_IDENTITY (server stamp) | No client patch | Canonical commands | Audit timestamp |
| updatedBy | IMMUTABLE_IDENTITY (server stamp) | No client patch | Current principal | Audit actor |
| version | IMMUTABLE_IDENTITY (server concurrency token) | No client patch | Expected-version comparison | Increment on profile save; legacy zero |
| status | LOCKED_AFTER_ACTIVE for generic editing | Explicit legal lifecycle commands only | PA/SA commands; activation authority | Existing audit; no generic status patch |
| nameAr | SAFE_LIVE_PROFILE | LIVE | PA/SA foundation command | Live display; saved Trip snapshots unchanged; audited |
| nameEn | SAFE_LIVE_PROFILE | LIVE | PA/SA foundation command | Same historical boundary; audited |
| clientName | SAFE_LIVE_PROFILE | LIVE | PA/SA foundation command | Client display/reference only; audited |
| description | SAFE_LIVE_PROFILE | LIVE | PA/SA foundation command | Live metadata only; audited |
| startDate | LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Operational period; audited |
| endDate | LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Operational period; audited |
| location.lat | LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Geofence-sensitive; audited |
| location.lng | LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Geofence-sensitive; audited |
| location.geoFenceRadiusMeters | LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Operational validation; audited |
| location.addressAr | LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Site identity context; audited |
| settings.zatcaTaxNumber | REQUIRES_HISTORICAL_SNAPSHOT; LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | No backfill from current tax facts; audited |
| settings.vatRatePercent | REQUIRES_HISTORICAL_SNAPSHOT; LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | Commercial snapshot authority preserved; audited |
| settings.currency | REQUIRES_HISTORICAL_SNAPSHOT; LOCKED_AFTER_ACTIVE | PRE only | PA/SA foundation command | No historical repricing; audited |
| settings.googleDriveFolderId | FUTURE_EFFECT_ONLY | Existing Workspace command in LIVE | PA/SA Workspace authority | Integration linkage; audit; not generic profile patch |
| settings.googleSpreadsheetId | FUTURE_EFFECT_ONLY | Existing Workspace command in LIVE | PA/SA Workspace authority | Integration linkage; audited |
| settings.googleDriveProvisioning.enabled | FUTURE_EFFECT_ONLY | Existing Workspace command only | PA/SA Workspace authority | Server-owned linkage/provisioning result |
| settings.googleDriveProvisioning.rootFolderName | FUTURE_EFFECT_ONLY | Existing Workspace command only | PA/SA Workspace authority | Server-owned integration metadata |
| settings.googleDriveProvisioning.spreadsheetTitle | FUTURE_EFFECT_ONLY | Existing Workspace command only | PA/SA Workspace authority | Server-owned integration metadata |
| settings.googleDriveProvisioning.status | FUTURE_EFFECT_ONLY | Existing Workspace command only | PA/SA Workspace authority | Server-owned provisioning result |
| settings.allowDriverSelfDispatch | REQUIRES_SEPARATE_MIGRATION | No ordinary profile edit | Separate accepted policy required | Changes operational authority; not unlocked |
| settings.requireTareOnExit | REQUIRES_SEPARATE_MIGRATION | No ordinary profile edit | Separate operational contract required | Validation semantics remain unchanged |
| settings.maxToleranceKg | REQUIRES_SEPARATE_MIGRATION | No ordinary profile edit | Separate operational contract required | Validation semantics remain unchanged |
| settings.storageProfile (whole structured profile) | REQUIRES_SEPARATE_MIGRATION | No generic edit | Existing separately governed storage capability only | No destination/migration rewrite in RB2 |
| authorizedCarrierIds | REQUIRES_SEPARATE_MIGRATION | No generic edit | Canonical memberships govern participation | Legacy array is not an authority |
| authorizedMaterialIds | REQUIRES_SEPARATE_MIGRATION | No generic edit | Canonical memberships govern participation | Legacy array is not an authority |

No unrestricted PATCH is added. Existing `ProjectCommandsServerService.updateFoundation` remains the single profile authority; HTTP requests require expectedVersion. On ACTIVE it accepts only the four SAFE_LIVE_PROFILE fields. Other valid pre-activation fields retain their prior validation. Natural identity corrections are IDENTITY_MIGRATION_REQUIRED, not an ordinary maintenance edit.

## Lifecycle

ACTIVE → SUSPENDED is explicit, current-principal scoped and audited; it does not suspend memberships or close temporal history. RB1 fences reject new expansion and retain cleanup. SUSPENDED → ACTIVE is a separate reactivation entry through the existing activation service: discovery, pricing/path validation and transaction-time full Setup/candidate revalidation. Treating SUSPENDED as eligible for this evaluation is local to the reactivation command; no APPROVED state is persisted and the ordinary activation endpoint cannot reactivate. Failure returns exact blockers and leaves SUSPENDED. ACTIVE is not automatically changed when readiness falls false.

PROJECT_ARCHIVE_TRANSITION = DEFERRED_WITH_FENCE. ARCHIVED remains terminal/readable and rejects new foundation operations; no archive command or deletion is introduced.

## Global Driver/Truck profiles

One reusable `FleetProfileMaintenanceServer` and `FleetProfileEditor` serve Project contexts. Active PA/SA with current scope and an active Project membership may edit; global-only governance remains separate. Global profile edits intentionally affect the shared identity's live profile across Projects, not historical Trip snapshots. Natural Driver nationalId and Truck plate/normalizedPlate, IDs, ownership, membership, affiliation, temporal state and global status cannot be supplied in the patch.

Driver allowlist: fullNameAr, phone, licenseNumber, licenseValidUntil, nationality. Truck allowlist: truckType, tareWeightKg, maxGrossWeightKg, mvpiValidUntil, insuranceValidUntil. Types, date-only validity, truck vocabulary and nonnegative/coherent weights are validated. Optional null/empty clears remove fields; current-Project Fleet projection dirty marking is composed with the profile write; fullNameAr cannot clear. Payload capacity is derived only from both current weight inputs. Profile versions default to zero for legacy records and are required on edit; stale saves reject. Mutation/audit commit together. Contextual editor integration retains the current workflow and never restarts import. The capability is reusable by appropriate hosts; RB2 adds no Smart-Import-specific update authority or new import architecture.

## Foundation permission presentation matrix

All roles below mean current active canonical account and required Project scope; UI is presentation only. Server reauthorizes every command.

| Operation | Server authority | Presentation / scope |
|---|---|---|
| Create Project | SA | Only SA creation control |
| Edit Project | PA/SA | PRE foundation editor; ACTIVE bounded maintenance editor |
| Suspend/reactivate Project | PA/SA | Explicit lifecycle controls; reactivation uses readiness |
| Carrier create/edit | PA/SA in Project; global governance SA | Existing reusable editor/contextual shortcut; no parallel authority |
| Material create/edit | PA/SA in Project; global governance SA | Existing reusable editor/contextual shortcut |
| Driver create/edit | PA/SA in Project | Existing intake and reusable profile editor; identity read-only |
| Truck create/edit | PA/SA in Project | Same, immutable plate |
| Membership suspend/remove/reactivate | PA/SA | One contextual action menu across four kinds; RB1 consequences/dependency counts |
| Affiliation | PA/SA | Existing Fleet menu; cleanup-only mode on nonmutable Projects |
| Driver↔Truck assignment | PA/SA | Existing canonical assignment/reassignment/close controls |
| Truck↔Material allocation | PA/SA | Existing allocation/reallocation/close controls |
| Smart Import commit | PA/SA | Existing reviewed-intent server authority; no raw-row or silent reactivation path |
| Pricing | PA/SA/FINANCE_AUDITOR | Existing Wizard pricing form; Finance navigation now discoverable, no second form |
| Project user assignment | SA | PA may inspect Project access; assignment controls stay SA-only |

Inactive/unassigned profiles do not receive maintenance controls. State-specific controls do not imply that server validation/eligibility or dependency checks can be bypassed. Contextual creation from import and standalone editors are USEFUL_CONTEXTUAL_DUPLICATE / SAME_OPERATION_VALID_SHORTCUT: same command authority. Fleet maintenance menu consolidates new profile/membership operations. No DUPLICATE_BUSINESS_PATH was added; no practical shortcut was removed solely for appearance.

## Readiness and verification boundary

Wizard displays canonical Project status separately from current operational readiness and actionable canonical blockers. Dashboard and Loading Station selected Project readiness badges uses the canonical readiness query with Project/scope and late-response fences. The readiness response includes Project status from the same transaction; post-read authorization or lifecycle/profile-version changes reject the snapshot rather than recomposing dimensions from different generations. It never changes status. Loading presentation also consumes the central lifecycle policy to disable unusable expansion controls. Existing operational dispatch validates Project lifecycle server-side; RB2 does not redesign Trip FSM.

PFAG-RULES-01 remains OPEN / ENVIRONMENT_BLOCKED. Native pricing-rule runtime validation is deferred to the first available emulator/deployed gate. No emulator download, dependency installation, live Firebase acceptance or deployment claim is part of RB2.

## Reachability and scoped compatibility observations

The active Project host is App → ProjectSetupWizard. The standalone ProjectsDashboard.tsx component has no production import/caller and remains LEGACY_NOT_REACHABLE; its obsolete generic editor/deletion/readiness heuristics were not revived or copied. Current Project access uses ProjectAccessView, where PA inspects and SA alone assigns. Finance can enter the existing pricing layer but not the access-management layer; its snapshot excludes inactive maintenance participants, natural keys, aliases and maintenance profiles. Maintenance profiles are opt-in only for PA/SA Setup/foundation reads. Operational import-resolution projections remain profile-free, preserving their previous data boundary and durable artifact shape. This does not expand global Master Data read authority.

The integrated affiliation guard requires explicit allocation closure before Truck affiliation inactivation. Historical inactive affiliation records cannot conceal an active allocation from Carrier dependency rejection. Membership consequence semantics remain RB1's bounded atomic closure / reject policy.

## Integrated foundation source assurance observation — 2026-10-29

This is a verification record at baseline `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`, not a second current-state ledger. Verdicts concern scoped canonical source behavior and controlled non-production verification, not live records/deployment certification. No unresolved scoped CRITICAL/HIGH finding remains. Pricing list status projection preserves the accepted legacy isActive alias without changing storage or commercial calculations. Workspace provisioning checks the central lifecycle fence before external resource creation as well as before canonical linkage; cross-system external operations are not claimed to be one Firestore transaction.

| Domain | Authority | Lifecycle | Permissions | Flexibility | Historical safety | UI coherence | Verdict |
|---|---|---|---|---|---|---|---|
| Project | PASS | PASS | PASS | PASS | PASS | PASS | PASS_WITH_DEBT |
| Carrier | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Material | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Driver | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Truck | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Memberships | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Affiliations | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Driver↔Truck | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Truck↔Material | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Roster | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Readiness | PASS | PASS | PASS | PASS | PASS | PASS | PASS_WITH_DEBT |
| Activation | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Project Access | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Smart Import | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Reporting | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

PASS_WITH_DEBT retains explicitly recorded baseline/harness and native deployment verification obligations. Source proofs: direct-pricing overlapping-rule audit has zero client write grants; snapshot-first reports survive profile changes; membership cleanup and audit are atomic; affiliation cleanup cannot conceal active allocations; scoped lifecycle expansion fences remain; composed snapshot and operation-receipt proofs precede apply; profile versions reject stale writes; explicit reactivation revalidates readiness including transaction-time blockers; role presentation follows server capability and administrative profile data is not added to operational import resolution. Expected-field/version comparisons are presentation convergence proofs, never alternative business rules.
