# BLOCK 100B — PROJECT SETUP LIFECYCLE & OPERATIONAL ROSTER ARCHITECTURE AUDIT REPORT

**Timestamp:** 2026-09-15T05:43:25-07:00  
**Audit Objective:** Design, map, and validate the system-wide Project Setup lifecycle, Multi-Step Validation Gates, and Google Workspace Provisioning Sequence prior to implementation.  
**Execution Mode:** READ-ONLY (No code, database, translation, or rule modifications have been introduced).

---

## Architectural Variable Dashboard

```ini
PHASE_COUNT = 6
PHASE_1_VALID = YES
PHASE_2_VALID = YES
GLOBAL_DRIVER_ID_RECOMMENDED = YES
PROJECT_ROSTER_ID_RECOMMENDED = YES
ROSTER_ID_FORMAT = Q-PRJ-001-DRV-00001
UNIFIED_IMPORT_PIPELINE = YES
ENTITY_RESOLUTION_REQUIRED = YES
PROJECT_STATUS_MACHINE = DRAFT, SETUP, READY_FOR_REVIEW, APPROVED, ACTIVE
GOOGLE_WORKSPACE_ORDER = PROJECT_DOCUMENT -> DRIVE_FOLDER -> GOOGLE_SHEET -> SHEET_INITIALIZATION -> PROJECT_LINKAGE
PROJECT_READINESS_GATE = YES
CURRENT_WIZARD_REBUILD_RECOMMENDED = YES
CODE_CHANGED = NO
DATA_CHANGED = NO
```

---

## 1. Comprehensive Lifecycle Phases

The future project setup lifecycle is organized into six highly disciplined operational phases:

### Phase 1: Project Foundation
- **Core Intent**: Define the primary administrative boundaries of the project.
- **Inputs**: Arabic project name, Client name, Site location (Latitude/Longitude, geofencing radius, and textual address), active date ranges, and initial list of authorized materials.
- **System Identifiers**: The system automatically queries `systemCounters/projectNumber` and allocates sequential numbers (e.g., sequence `1` maps to `Q-PRJ-001` with proper padding).
- **Google Workspace Sync**: If enabled, initiates the Google Drive folder and Spreadsheet creation in a fault-tolerant sequence (see Section 8).

### Phase 2: Carrier & Operational Roster
- **Core Intent**: Populate the list of authorized logistical resources (carriers, drivers, and trucks) permitted to operate on the project site.
- **Roster Alignment**: Maps driver and truck identities directly to a specific project-scoped roster.

### Phase 3: Pricing & Contracts
- **Core Intent**: Configure commercial contracts and tariffs.
- **Pricing Rules**: Translates pricing models (`PER_TRIP` vs. `PER_TON`) into enforceable billing limits.

### Phase 4: Access & Governance
- **Core Intent**: Establish administrative roles.
- **Permissions**: Assigns Weighbridge Operators, Field Supervisors, and Regional Managers to their respective project boundaries.

### Phase 5: Review & Activate
- **Core Intent**: Execute rigorous validation checks on all preceding phases before allowing live transactions.
- **State Transition**: Shifts the project state to `ACTIVE`.

### Phase 6: Field Operations
- **Core Intent**: Execute daily operations.
- **Modules Unlocked**: Weighbridge ticketing, real-time dispatch, and automatic Google Sheets synchronization.

---

## 2. Carrier & Operational Roster Architecture

The operational roster bridges physical identities (drivers, vehicles) and commercial identities (carriers) into a project-scoped authorization matrix.

### Entity Relationships
- **Carrier**: Holds corporate CR numbers and TGA licenses. A project defines its authorized carriers (`authorizedCarrierIds`). Only drivers and trucks belonging to these carriers may be added to the project roster.
- **Driver**: Represents a unique physical operator, defined by their Iqama or National Residency ID.
- **Roster Row Fields**:
  1. `rosterId`: e.g., `Q-PRJ-001-DRV-00001`
  2. `carrierId`: References authorized carriers
  3. `driverName`: Driver display name
  4. `plateNumber`: Truck plate number
  5. `phoneNumber`: Contact mobile number
  6. `idNumber`: National ID / Iqama (primary identifier)
  7. `materialId`: Authorized cargo material
  8. `projectId`: e.g., `Q-PRJ-001`
  9. `status`: `ACTIVE`, `SUSPENDED`

### Identity Distinctions
- **GLOBAL DRIVER ID**: Generated directly from the unique, legally binding National ID/Iqama number. It represents the driver's system-wide identity across all projects and carriers.
- **PROJECT ROSTER ID**: Represents the project-specific assignment slot. A single driver can join multiple project rosters (e.g. `Q-PRJ-001-DRV-00001` and `Q-PRJ-002-DRV-00502`). This allows project managers to suspend a driver on one project while keeping them active on others.
- **TRIP SNAPSHOT**: At the moment a weighbridge ticket or trip is recorded, the driver's phone, name, plate, carrier, and pricing details are copied directly into the trip document. This ensures that subsequent roster modifications (e.g. driver changing their plate, phone number, or carrier) do not corrupt or alter historic trip logs.

---

## 3. Unified Import Pipeline

To ensure maximum operational versatility, the roster supports three input channels feeding into a single, unified backend processing pipeline:

```
[ Excel/CSV File Upload ] ---\
[ Google Sheets Live URL ] ---> [ SOURCE ] -> [ PARSE ] -> [ NORMALIZE ] -> [ MAP ] -> [ ENTITY_RESOLUTION ] -> [ VALIDATE ] -> [ DUPLICATE_CHECK ] -> [ REVIEW ] -> [ COMMIT ] -> [ AUDIT ]
[ Manual Form Entry ] -------/
```

### Flow Details:
* **PARSE**: Reads tabular data from spreadsheet arrays or manual input structures.
* **NORMALIZE**: Strips spacing, standardizes phone country codes (`+966`), and normalizes Arabic characters (e.g. `أ` vs `ا`).
* **ENTITY RESOLUTION**: Resolves driver records against existing global identities.
* **DUPLICATE CHECK**: Prevents multiple active roster rows from sharing the same Iqama ID, phone number, or truck plate.
* **COMMIT**: Atomically writes both the global driver reference and project roster document to Firestore.

---

## 4. Entity Resolution & Validation

### Matching Priority
When processing new roster entries, the resolution resolver searches for matches using the following priority:
1. **Residency ID (Iqama/National ID)**: Primary unique key. Legally binding and immutable.
2. **Phone Number**: Secondary identifier. (Highly reliable, but can change or be shared).
3. **Plate Number**: Vehicle identifier. (Useful for tracking physical assets, but a vehicle can be reassigned).
4. **Driver Name**: Display identifier only. (Identical names are common; never used as a sole trusted key).

### Resolution States
- **NEW**: Iqama/National ID is not found. A new global driver record and a new project roster row are created.
- **EXISTING**: Iqama/National ID exists with identical details. The driver is mapped to the existing record.
- **CHANGED**: Iqama/National ID exists, but other fields (e.g. phone, plate, or carrier) have updated. The global driver record is updated, and historical changes are logged.
- **CONFLICT**: The Iqama ID matches an existing record, but features a completely different name, or a plate number is already registered to another active driver. The row is flagged as blocked, requiring manual operator review.

---

## 5. Material Assignment Rules

- **Strict Reference Integrity**: Every roster row must be assigned a `materialId` that belongs to the project-specific authorized materials list (`authorizedMaterialIds` / `/projects/{id}/materials`) configured during Phase 1.
- **No Free-Text**: Arbitrary free-text cargo descriptions are strictly prohibited to prevent typos and ensure correct pricing rule matching.
- **Multiplicity Rules**: By default, a driver is assigned **one active material** per roster row to keep weighbridge operations fast. To handle drivers carrying multiple cargo types, the driver can be assigned **multiple authorized materials** or hold **multiple active roster rows** (or a clean array of authorized material IDs).

---

## 6. Roster Change Behavior

When changes occur in the active roster:
- **Phone / Plate / Carrier Updates**: These changes take effect immediately on the roster document and are applied to all future weighbridge tickets.
- **Historical Protection**: Finished tickets are never modified retroactively. They preserve the exact details captured in their original **Trip Snapshot**.
- **Driver Suspension / Removal**: The roster row is marked as `SUSPENDED` or `INACTIVE` (never deleted, to preserve references for historical trip lookups).
- **Multi-Project Participation**: If the same driver joins another project, a new, independent roster row is generated (e.g., `Q-PRJ-002-DRV-00010`) that references the same underlying **Global Driver ID**.

---

## 7. Phase Dependencies

To prevent configuration errors, strict dependencies must be met before advancing to subsequent phases:
- **Phase 1 → Phase 2**: Project document must be created and materials list finalized before mapping rosters.
- **Phase 2 → Phase 3**: Roster and carrier memberships must be established before creating targeted pricing rules.
- **Phase 3 → Phase 4**: Tariffs and contracts must be finalized before assigning operators.
- **Phase 4 → Phase 5**: Access configurations must be completed before starting the final system-wide audit check.
- **Phase 5 → Phase 6**: All readiness checks must pass before shifting the project state to `ACTIVE`, which unlocks operational features (weighbridge tickets).

---

## 8. Project Status Machine

```
[ DRAFT ] ---> [ SETUP ] ---> [ READY_FOR_REVIEW ] ---> [ APPROVED ] ---> [ ACTIVE ]
```

### Permissions Matrix
- **DRAFT**: Full metadata editing is allowed. Weighbridge operations are disabled.
- **SETUP**: Metadata edits are allowed. Rosters and pricing rules can be added. Weighbridge operations are disabled.
- **READY_FOR_REVIEW**: Project details are locked (read-only) for administrator validation. Weighbridge operations are disabled.
- **APPROVED**: Locked and awaiting scheduled start date. Weighbridge operations are disabled.
- **ACTIVE**: Weighbridge operations and real-time dispatch are enabled. Structural project details (ZATCA tax number, project code, authorized materials) are locked.

---

## 9. Google Workspace Provisioning Order

To prevent orphaned folders or database crashes from disrupting setup, the provisioning flow must execute in the following order:

```
1. Firestore Project Document Created (Status: "PENDING_PROVISIONING")
   ↓
2. Provision Google Drive Project Folder
   ↓
3. Provision central Google Spreadsheet inside Folder
   ↓
4. Initialize Google Sheet structure (Tabs, Columns, and Headers)
   ↓
5. Update Firestore Project Document with final resource IDs (Status: "ACTIVE")
```

### Error Mitigation
If any step in the Google Workspace flow fails, the process halts. The Firestore project document already exists with a `PENDING_PROVISIONING` status, allowing administrators to review the error logs and trigger an asynchronous "Retry Provisioning" action without corrupting data or consuming additional sequential numbers.

---

## 10. Project Readiness Gates (Validation Checklist)

Before a project is allowed to transition to `ACTIVE`, the validation gate must verify:
1. **Foundation**: Project Name, Client, Address, and Coordinates are complete and verified.
2. **Materials**: At least one authorized material is defined.
3. **Google Workspace**: Google Drive Folder and initialized Spreadsheet are successfully linked.
4. **Carriers**: At least one carrier is authorized.
5. **Roster**: At least one driver-truck roster row is validated and active.
6. **Pricing**: Active pricing rules exist for every authorized carrier and material combination.
7. **Access**: At least one Weighbridge Operator and one Supervisor are assigned.
8. **Audit**: All configuration records are audit-stamped.

---

## 11. Code Mapping & Structural Reusability

| Requirement / Behavior | Current Component / Path | Current Service / Repo | Current Data Structure / Status | Reusability vs. Rebuild |
|:---|:---|:---|:---|:---|
| **Project Setup Wizard** | `ProjectSetupWizard.tsx` | `projectProvisioning.service.ts` | `ProjectSetupWizardData` | **Reusable**: Wizard structure is intact, but needs minor step refinement to match the structured workflow phases. |
| **Project Foundation UI** | `Step1ProjectInfo.tsx` | `project.service.ts`, `project.repository.ts` | `ProjectEntity` | **Reusable**: Clean inputs and displays, including read-only code display. |
| **Material Management** | `Step2Materials.tsx` | `material.repository.ts` | `MaterialEntity` | **Reusable**: Works perfectly with project scoping. |
| **Carrier Management** | `Step3Carriers.tsx` | `carrier.repository.ts` | `CarrierEntity` | **Reusable**: Maps to projects seamlessly. |
| **Pricing Rules Builder** | `Step4PricingRules.tsx` | `pricingRule.service.ts`, `pricingRule.repository.ts` | `PricingRuleEntity` | **Reusable**: Fits Phase 3 specifications. |
| **Import Pipeline** | None (Wizard Step) | `driverTruckPipeline.service.ts` | `UnifiedImportBatch` | **Highly Reusable**: Fully implements the unified `PARSE → COMMIT` pipeline. |
| **Roster Management** | None | `driver.service.ts`, `driver.repository.ts` | `DriverEntity` | **Rebuild Required**: Needs a dedicated view for project managers to manage rosters (Phase 2) instead of simple uploads. |

---

## 12. Final Target Architecture Recommendation

We recommend implementing the project setup lifecycle as a unified, five-step guided wizard that maps precisely to the required phases. 

By separating **Project Foundation** from **Logistical and Roster population**, administrative details can be locked first while leaving the roster flexible for ongoing daily updates. Introducing `ignoreUndefinedProperties: true` during Firestore initialization is highly recommended to permanently eliminate payload serialization errors.

---

*Verified and Compiled by Q-Saudi Work Follow Architectural Design Board.*
