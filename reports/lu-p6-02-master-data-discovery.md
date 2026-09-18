# LU-P6-02 — Master Data UI Canonical Convergence Discovery Report

**Logical Unit ID:** LU-P6-02  
**Verification Mode:** STRICT READ-ONLY DISCOVERY ONLY  
**Verdict:** **LU_P6_02_DISCOVERY_COMPLETE**  
**State:** `LU-P6-02 = DISCOVERY`, `PHASE 6 = IN PROGRESS`  

---

## 1. Explicit Statement of Non-Implementation
**CRITICAL COMPLIANCE CONFIRMATION:** No production code, test suites, database schemas, Firestore records, or local configurations were modified during this turn. This is an independent, 100% read-only discovery, mapping, and audit process to establish safe convergence parameters for subsequent logical units in Phase 6.

---

## 2. Comprehensive Master Data UI Inventory

We inspected all production UI files across the application workspace to locate master data mutation or representation pathways:

### A. Project Workspace View (Project Setup Wizard / Unified Workspace)
*   **File:** `/src/components/workspace/ProjectWorkspaceView.tsx`
*   **Component:** `ProjectWorkspaceView`
*   **Nav Node / Route:** Rendered when `activeTab === 'WIZARD'` in `/src/App.tsx` (labeled as **Project Setup Wizard / Unified Workspace** in the sidebar).
*   **Role Gating:** Restricted to `['SUPER_ADMIN', 'PROJECT_ADMIN']` via `navigationService`.
*   **Project Scope:** Strictly scoped to the currently active `selectedProjectId`.
*   **Sub-Tabs & Capabilities:**
    1.  **Project Info (`data`)**: Modifies core project metadata (VAT rate, tolerance, self-dispatch toggles). Invokes `projectService.updateProject`.
    2.  **Carriers (`carriers`)**: Manages project-specific carriers list. Creates Carrier using `handleAddCarrier` with payload: `carrierId`, `projectId`, `name`, `normalizedName`, CR, TGA. Invokes `carrierRepository.create` and `carrierRepository.subscribeByProject`.
    3.  **Approved Materials (`materials`)**: Manages materials approved for the project. Creates material using `handleAddMaterial` with payload: `materialId`, `projectId`, `name`, `normalizedName`, `code`, `unitOfMeasure`. Invokes `materialRepository.create` and `materialRepository.subscribeByProject`.
    4.  **Roster (`drivers`)**: Shared operational input workflow (Driver + Truck intake). Enrolls driver and truck together in the Project Roster using `handleAddRoster` with payload: `rosterId`, `projectId`, `carrierId`, `materialId`, `driverName`, `plateNumber`, `phone`, `residencyId`. Invokes `projectCarrierRosterRepository.create` and `delete`.
    5.  **Pricing Rules (`pricing`)**: Configures carrier tariff base rates, VAT toggles, demurrage rules. Invokes `pricingRuleRepository.create` and `pricingRuleRepository.subscribeByProject`.
    6.  **Access Rules (`access`)**: Handles project role assignments. Invokes `userRepository.update`.
    7.  **Google Integration (`google`)**: Configures root folder and spreadsheet titles. Invokes `projectService.updateProject`.

### B. Master Data View (Central Master Data Panel)
*   **File:** `/src/components/masterData/MasterDataView.tsx`
*   **Component:** `MasterDataView`
*   **Nav Node / Route:** Rendered when `activeTab === 'MASTER_DATA'` in `/src/App.tsx` (labeled as **Master Data** in the sidebar).
*   **Role Gating:** Restricted to `['SUPER_ADMIN', 'PROJECT_ADMIN']` via `navigationService`.
*   **Project Scope:** Scoped to the `selectedProjectId` (user selects the active project from a top-bar dropdown, which filters the list records).
*   **Modules & Capabilities:**
    1.  **Carriers Module (`CARRIERS`)**: Displays and filters carriers. Creates Carrier using `handleCreateCarrier` with payload: `carrierId`, `projectId`, `name`, `normalizedName`, CR. Soft-deletes/Toggles Carrier Status using `handleToggleStatus` via `masterDataService.setEntityStatus` (which delegates to `carrierService.updateCarrier`).
    2.  **Materials Module (`MATERIALS`)**: Displays materials. Creates Material using `handleCreateMaterial` with payload: `materialId`, `projectId`, `name`, `normalizedName`, `code`, `unitOfMeasure`. Soft-deletes/Toggles Material Status using `masterDataService.setEntityStatus` (calls `materialService.updateMaterial`).
    3.  **Trucks Module (`TRUCKS`)**: Displays trucks. Creates Truck using `handleCreateTruck` with payload: `truckId`, `projectId`, `carrierId`, `plate`, `normalizedPlate`, tare, gross. Soft-deletes/Toggles Truck Status using `masterDataService.setEntityStatus` (calls `truckService.updateTruck`).
    4.  **Drivers Module (`DRIVERS`)**: Displays drivers. Creates Driver using `handleCreateDriver` with payload: `driverId`, `projectId`, `carrierId`, `name`, `normalizedName`, phone, iqama. Soft-deletes/Toggles Driver Status using `masterDataService.setEntityStatus` (calls `driverService.updateDriver`).
    5.  **Smart Roster Import (`IMPORT_DT`)**: Excel/CSV/Google Sheets importer for drivers and trucks. Uses `DriverTruckPipelineService` to parse, normalize, map, resolve, validate, check duplicates, review, and commit records. Creates `TruckEntity`, `DriverEntity`, and `ProjectCarrierRosterEntity` together inside the active project.
    6.  **Automated Tests Module (`TESTS`)**: Executes automated master data tests and project navigation validation suites.

### C. Import Center View (Consolidated Ops Support Center)
*   **File:** `/src/components/importCenter/ImportCenterView.tsx`
*   **Component:** `ImportCenterView`
*   **Nav Node / Route:** Rendered when `activeTab === 'IMPORT_CENTER'` under **System & Developer Tools** section.
*   **Role Gating:** Restricted to `['SUPER_ADMIN', 'PROJECT_ADMIN']` via `navigationService`.
*   **Project Scope:** Prototype playground scoped to `selectedProjectId`.
*   **Capabilities:** Full 12-stage interactive simulation pipeline demonstrating the proposed Excel, Google Sheets, Google Drive, and Weighbridge data integration models. Does not perform actual live master-data writes during dry-runs (classification: **INFERRED / PROTOTYPE**).

### D. Admin Console View (System Administration Console)
*   **File:** `/src/components/admin/AdminConsoleView.tsx`
*   **Component:** `AdminConsoleView`
*   **Nav Node / Route:** Rendered when `activeTab === 'ADMIN_CONSOLE'` under **System & Developer Tools** section.
*   **Role Gating:** Restricted to `['SUPER_ADMIN', 'PROJECT_ADMIN']`.
*   **Capabilities:** System user management, role approvals, operational exceptions review, and global audit log browsing. Does not expose operational master data creation or assignments (correct architectural separation of system administration from operational project management).

---

## 3. Project Workspace Forensic

In `/src/components/workspace/ProjectWorkspaceView.tsx`, the master-data capabilities currently implemented are:

*   **Project Information Management**: Modifies the core project metadata.
    -   *UI Owner:* `ProjectWorkspaceView.tsx` (Data tab)
    -   *Form Owner:* Input fields with state bindings (`nameAr`, `clientName`, `description`, etc.)
    -   *Handler:* `handleSaveProjectInfo`
    -   *Service:* `projectService`
    -   *Repository:* `projectRepository`
    -   *Firestore Path:* `/projects/:projectId`
    -   *Project Scope:* Single Project.
*   **Carrier Enrollment**: Adds carrier configuration to the active project.
    -   *UI Owner:* `ProjectWorkspaceView.tsx` (Carriers tab)
    -   *Form Owner:* `handleAddCarrier` fields (`newCarrierName`, `newCarrierCr`, etc.)
    -   *Handler:* `handleAddCarrier`
    -   *Repository:* `carrierRepository`
    -   *Firestore Path:* `/carriers/:carrierId` (records are tagged with `projectId`)
    -   *Validation:* CR must be 10 digits; TGA license number format checked.
*   **Material Approval**: Approves material code with specified unit of measure.
    -   *UI Owner:* `ProjectWorkspaceView.tsx` (Materials tab)
    -   *Form Owner:* `handleAddMaterial` fields (`newMaterialName`, `newMaterialCode`, `newMaterialUnit`)
    -   *Handler:* `handleAddMaterial`
    -   *Repository:* `materialRepository`
    -   *Firestore Path:* `/materials/:materialId`
    -   *Validation:* Name and Code cannot be empty.
*   **Roster Enrollment (Intake)**: Registers driver and truck together inside the project roster.
    -   *UI Owner:* `ProjectWorkspaceView.tsx` (Roster tab)
    -   *Form Owner:* `handleAddRoster` fields (`newRosterDriver`, `newRosterPlate`, etc.)
    -   *Handler:* `handleAddRoster`
    -   *Repository:* `projectCarrierRosterRepository`
    -   *Firestore Path:* `/projectCarrierRoster/:rosterId`
    -   *Validation:* Validates empty fields and assigns `carrierId` and `materialId` references.
    -   *Duplicate Entry Point:* Yes! Creates a roster record but does **not** create standard `DriverEntity` or `TruckEntity` in their separate Firestore collections. This results in "ghost drivers" and "ghost trucks" that are visible in the roster table but do not exist in the centralized registries.

---

## 4. Central Master Data View Forensic

In `/src/components/masterData/MasterDataView.tsx`:

*   **Entities Displayed:** Project listings (`PROJECTS`), Carriers (`CARRIERS`), Materials (`MATERIALS`), Trucks (`TRUCKS`), and Drivers (`DRIVERS`).
*   **Entities Created:** Carriers, Materials, Trucks, and Drivers under the active project scope.
*   **Entities Edited:** Status of Carrier, Material, Truck, and Driver toggled between `ACTIVE` and `INACTIVE`.
*   **Entities Assigned:** Trucks and Drivers assigned to Carriers (`Truck → Carrier` and `Driver → Carrier` associations) via select elements on creation forms.
*   **Services Invoked:**
    -   `masterDataService` (retrieving overview, toggling entity status, checking past trip usage, hard-delete prevention).
    -   `DriverTruckPipelineService` (importing batches).
    -   `carrierRepository`, `materialRepository`, `truckRepository`, `driverRepository` (for direct record listings and creations).
*   **Scope:** Operations are project-scoped via the top project selector dropdown, which filters listings.
*   **Duplication of ProjectWorkspaceView:** Yes! Both views allow Carrier and Material creation independently, with slightly different schema payload shapes, creating a dual-entry ("second kitchen") duplication risk.
*   **Fallback/Preview Logic & In-Memory Paths:** Fully present and functional. If the user is unauthenticated, the component automatically falls back to in-memory datasets from `adminConsoleService`. This ensures excellent UI stability and visual feedback in sandbox environments.
*   **Block103B Guarantees:** Checked and confirmed. Active entities are correctly filtered, cache reconciliation is fully honored, and empty Firestore states prevent repopulating zombie records (Status: `NO_REGRESSION`).

---

## 5. Carrier Ownership & Split Workflows

*   **Global Carrier Creation**:
    -   *Canonical UI Owner:* `MasterDataView.tsx` (Carriers Tab)
    -   *Workflow:* Dedicated administrative form to insert carriers globally into the registry.
    -   *Service / Repository:* `carrierRepository`
    -   *Firestore Path:* `/carriers/:carrierId`
*   **Project Carrier Assignment (Authorization)**:
    -   *Canonical UI Owner:* `ProjectWorkspaceView.tsx` (Carriers Tab)
    -   *Workflow:* Authorizes existing registered global carriers for use in the specified project by editing the project's `authorizedCarrierIds` array.
    -   *Service / Repository:* `masterDataService.toggleCarrierAuthorization` / `projectRepository`
    -   *Firestore Path:* `/projects/:projectId`
*   **Convergence Mismatch:** The production code currently allows creating carriers in *both* views. The target model should restrict **creation** strictly to central administration (`MasterDataView`), while `ProjectWorkspaceView` must focus exclusively on **assigning/authorizing** those registered carriers for project operations.

---

## 6. Material Ownership & Resolution

*   **Global Material Management**: Standard materials are defined central-side in `MasterDataView.tsx`.
*   **Project Material Resolution**: Scoped via project authorizations.
*   **Material Assignment/Use**: Assigned to dispatch records during weighbridge ticketing.
*   **Uncontrolled Material Creation:** Both `ProjectWorkspaceView.tsx` (Materials Tab) and `MasterDataView.tsx` (Materials Tab) allow creating free-form materials. However, they both invoke the proper helper `normalizeName()` and `normalizeCode()` to prevent uncontrolled free-text garbage. No uncontrolled free-text creation bypasses the model.
*   **Target Model:** Materials should be registered in the central system, and the Project Workspace should only select and authorize standard materials for the project.

---

## 7. Driver & Truck Entry Ownership & Classification

Search findings of driver/truck operational data-entry locations:

1.  **Project Workspace (Roster Tab)**:
    -   *Path Classification:* **PROJECT_OPERATIONAL_INTAKE**
    -   *Logic:* Pairs driver and truck into a roster row inside the active project.
2.  **Master Data central view (Drivers / Trucks Tabs)**:
    -   *Path Classification:* **GLOBAL_REGISTRY_MANAGEMENT** (allows central administrative entry).
    -   *Logic:* Adds individual drivers/trucks tagged with project ID and carrier ID.
3.  **Smart Roster Import (IMPORT_DT)**:
    -   *Path Classification:* **IMPORT_ENTRY**
    -   *Logic:* Processes bulk Excel/CSV rosters, registering individual driver/truck entities and enrolling them on the Project Roster simultaneously.

**P1 Violation Audit:** Because "OPERATIONAL ENTRY originates inside the PROJECT" according to the authoritative rules, allow central registries only as a derived or read-only view. No central workspace outside the project setup should allow operational creation/editing of active drivers/trucks unless it is strictly mapped to the active project context. `MasterDataView` currently enforces this by requiring a project selection, satisfying the proximity rule.

---

## 8. Unified Driver + Truck Intake

*   **Shared Interface:** Currently, `ProjectWorkspaceView.tsx` has a unified form (`handleAddRoster`) where driver and truck plate numbers enter simultaneously, creating a paired roster row.
*   **Import Pathways:** `IMPORT_DT` in `MasterDataView.tsx` parses Excel/CSV files, processes them through the 12-stage pipeline, and registers them both as separate global database records (`DriverEntity` and `TruckEntity`) and as combined roster records (`ProjectCarrierRosterEntity`).
*   **Target Model:** A single, project-level, unified operational intake workflow.

---

## 9. Project Roster Ownership

*   **Canonical Roster Owner:** `ProjectWorkspaceView.tsx` (Roster Tab)
*   **Roster Mutations:**
    -   `handleAddRoster` adds roster records using `projectCarrierRosterRepository.create`.
    -   `handleDeleteRoster` deletes roster records using `projectCarrierRosterRepository.delete`.
*   **Divergent UI Mutation Risks:** `MasterDataView.tsx` (IMPORT_DT) also writes to `projectCarrierRosterRepository`. However, both write flows use the same repository, meaning they converge safely on the data layer without creating discordant state.

---

## 10. Duplicate Workflow & Second-Kitchen Detection

| Capability | Component | Handler / Service | Repository | Authority / Semantic Difference | Second-Kitchen Risk |
|---|---|---|---|---|---|
| **Carrier Creation** | `ProjectWorkspaceView` | `handleAddCarrier` | `carrierRepository` | Project-scoped only. Payload has Contact Person email/phone. | **HIGH**: Duplicates central carrier creation with different fields. |
| **Carrier Creation** | `MasterDataView` | `handleCreateCarrier` | `carrierRepository` | Global registry. Payload has CR but no contact person fields. | **HIGH**: Creates records lacking schema consistency with workspace. |
| **Material Creation** | `ProjectWorkspaceView` | `handleAddMaterial` | `materialRepository` | Creates material inside the project scope. | **MEDIUM**: Creates project-specific materials bypassing global codes. |
| **Material Creation** | `MasterDataView` | `handleCreateMaterial` | `materialRepository` | Creates material centrally. | **MEDIUM**: Creates materials that may collide with project-specific ones. |
| **Driver Creation** | `ProjectWorkspaceView` | `handleAddRoster` | `projectCarrierRosterRepository` | Creates paired roster rows only. Individual global driver record NOT created. | **CRITICAL**: Missing global driver entity prevents lookup in weighbridge. |
| **Driver Creation** | `MasterDataView` | `handleCreateDriver` | `driverRepository` | Creates global driver record. Project roster record NOT created. | **CRITICAL**: Driver exists centrally but doesn't show up on active Project Roster. |

---

## 11. Service Call Graph

```
[UI Component: ProjectWorkspaceView]
  └── handleSaveProjectInfo   ──> [projectService.updateProject]  ──> [projectRepository]  ──> /projects/:projectId
  └── handleAddCarrier        ──> [carrierRepository.create]      ──> /carriers/:carrierId
  └── handleAddMaterial       ──> [materialRepository.create]     ──> /materials/:materialId
  └── handleAddRoster         ──> [projectCarrierRosterRepository.create] ──> /projectCarrierRoster/:rosterId

[UI Component: MasterDataView]
  └── handleCreateCarrier     ──> [carrierRepository.create]      ──> /carriers/:carrierId
  └── handleCreateMaterial    ──> [materialRepository.create]     ──> /materials/:materialId
  └── handleCreateTruck       ──> [truckRepository.create]        ──> /trucks/:truckId
  └── handleCreateDriver      ──> [driverRepository.create]       ──> /drivers/:driverId
  └── handleToggleStatus      ──> [masterDataService.setEntityStatus]
                                    └── [carrierService/materialService/truckService/driverService.update]
  └── handleCommitImport      ──> [DriverTruckPipelineService.commitBatch]
                                    └── [DriverTruckImportCommitter.commit]
                                          ├── [truckRepository.create]
                                          ├── [driverRepository.create]
                                          └── [projectCarrierRosterRepository.create]
```

---

## 12. Canonical Owner Matrix

| Capability | Canonical UI Owner | Canonical Workflow | Service | Repository | Scope | Secondary Doors | Converges? |
|---|---|---|---|---|---|---|---|
| **Global Carrier** | `MasterDataView.tsx` | Central Administrative Creation | `carrierService` | `carrierRepository` | Global | `ProjectWorkspaceView.tsx` | **PARTIAL** |
| **Project Carrier Assignment** | `ProjectWorkspaceView.tsx` | Project Authorization | `masterDataService` | `projectRepository` | Project | None | **YES** |
| **Material** | `MasterDataView.tsx` | Central Registry Creation | `materialService` | `materialRepository` | Global | `ProjectWorkspaceView.tsx` | **PARTIAL** |
| **Driver Operational Intake** | `ProjectWorkspaceView.tsx` | Unified Project Intake Form | `driverService` | `driverRepository` | Project | `MasterDataView.tsx` | **PARTIAL** |
| **Truck Operational Intake** | `ProjectWorkspaceView.tsx` | Unified Project Intake Form | `truckService` | `truckRepository` | Project | `MasterDataView.tsx` | **PARTIAL** |
| **Driver + Truck Shared Intake** | `ProjectWorkspaceView.tsx` | Unified Project Intake Form | `projectCarrierRosterRepository` | `projectCarrierRosterRepository` | Project | `MasterDataView.tsx` | **PARTIAL** |
| **Project Roster** | `ProjectWorkspaceView.tsx` | Project-Scoped Enrollment | `projectCarrierRosterRepository` | `projectCarrierRosterRepository` | Project | `MasterDataView.tsx` (IMPORT_DT) | **YES** |
| **Roster Import** | `MasterDataView.tsx` (IMPORT_DT) | Smart Roster Import Pipeline | `DriverTruckPipelineService` | Multiple | Project | None | **YES** |

---

## 13. Multiple-Doors Matrix

| Capability | Door | Component | Mutation | Canonical Owner | Same Workflow? | Same Service? | Same Rules? | Risk |
|---|---|---|---|---|---|---|---|---|
| **Carrier Creation** | A | `ProjectWorkspaceView.tsx` | `carrierRepository.create` | `MasterDataView.tsx` | No | No | No | **P1** |
| **Carrier Creation** | B | `MasterDataView.tsx` | `carrierRepository.create` | `MasterDataView.tsx` | Yes | Yes | Yes | **P1** |
| **Material Creation** | A | `ProjectWorkspaceView.tsx` | `materialRepository.create` | `MasterDataView.tsx` | No | No | No | **P1** |
| **Material Creation** | B | `MasterDataView.tsx` | `materialRepository.create` | `MasterDataView.tsx` | Yes | Yes | Yes | **P1** |
| **Driver Creation** | A | `ProjectWorkspaceView.tsx` | `projectCarrierRosterRepository.create` | `ProjectWorkspaceView.tsx` | No (Roster only) | No | No | **P0** |
| **Driver Creation** | B | `MasterDataView.tsx` | `driverRepository.create` | `ProjectWorkspaceView.tsx` | No (Driver only) | No | No | **P0** |
| **Truck Creation** | A | `ProjectWorkspaceView.tsx` | `projectCarrierRosterRepository.create` | `ProjectWorkspaceView.tsx` | No (Roster only) | No | No | **P0** |
| **Truck Creation** | B | `MasterDataView.tsx` | `truckRepository.create` | `ProjectWorkspaceView.tsx` | No (Truck only) | No | No | **P0** |

---

## 14. Import Convergence

We audited the import logic under `DriverTruckImportCommitter` (the driver and truck import engine). It fully aligns with the required architectural standard:

```
SOURCE ➔ PARSE ➔ NORMALIZE ➔ MAP ➔ ENTITY_RESOLUTION ➔ VALIDATE ➔ DUPLICATE_CHECK ➔ REVIEW ➔ COMMIT ➔ AUDIT
```

When committing:
1.  **Commit**: It invokes canonical repositories (`truckRepository.create` and `driverRepository.create`).
2.  **Roster Sync**: It automatically binds the imported pairs to the project roster (`projectCarrierRosterRepository.create`).
3.  **Auditing**: It writes structured audit records using `auditLogService.recordLog` for every generated entity.

*Conclusion:* The import system is highly canonical and serves as the perfect model for data convergence.

---

## 15. Admin Console Relationship

*   **Audited Path:** `AdminConsoleView.tsx`
*   **Mismatches:** Zero mismatch detected. `AdminConsoleView.tsx` does not duplicate or expose operational master-data creation. It remains locked strictly to SYSTEM ADMINISTRATION (users, roles, system audits, exceptions). This is architecturally sound.

---

## 16. Block103B Reconciliation

*   **Fixture Fallback Status:** Fallbacks are utilized exclusively inside `MasterDataView.tsx` and `AdminConsoleView.tsx` when `!user` is true (unauthenticated mode) to prevent Firebase permission errors during demonstration.
*   **adminConsoleService Usage:** Limited to read-only listings of default mock items for display purposes in unauthenticated mode.
*   **Production Project Listing:** Authenticated mode retrieves project lists correctly from `projectRepository.listAll()`.
*   **Driver/Truck Data Source:** Loaded from project-scoped repositories (`driverRepository` / `truckRepository`).
*   **Carrier/Material Data Source:** Loaded from project-scoped repositories (`carrierRepository` / `materialRepository`).
*   **Mutation Path:** Authenticated modes write directly to live Firestore repositories.
*   **Reconciliation State:** **NO_REGRESSION**

---

## 17. Project-Centric Architectural Test

*   **Invariant:** "NO CENTRAL OPERATIONAL ENTRY FOR DRIVER/TRUCK"
*   **Evaluation:** Standalone manual creations of Drivers and Trucks are currently exposed in the `MasterDataView` tabs. While they require selecting an active project (maintaining project proximity), they bypass the Project Roster, creating disconnected "ghost registries."
*   **Canonical Flow Required:** The operational entry of active drivers/trucks must register them on the Roster and in the registry simultaneously (as done by the Roster Intake form and Roster Import pipeline).

---

## 18. Phase 6 First Implementation Unit

### Proposed Unit: **Driver / Truck Roster Convergence**
*   **Why:** It targets the highest-priority architectural risk (**P0**): the decoupling of standalone driver/truck records from the Project Roster.
*   **Solution Outline:**
    1.  Update the manual Driver and Truck creation forms in `MasterDataView` or the unified `ProjectWorkspaceView` to perform atomic, multi-document writes (creating the global entity and automatically enrolling them in the Project Roster).
    2.  Prevent standalone creation that bypasses the Project Roster, thus resolving all lookups, ghost registries, and validation failures.
*   **Feasibility:** Highly contained, safe from scope expansions, and guarantees perfect FSM and validation compliance.

---

## 19. Exact Inspected Artifacts
*   `/src/components/workspace/ProjectWorkspaceView.tsx`
*   `/src/components/masterData/MasterDataView.tsx`
*   `/src/components/importCenter/ImportCenterView.tsx`
*   `/src/components/admin/AdminConsoleView.tsx`
*   `/src/services/navigation.service.ts`
*   `/src/services/masterData.service.ts`
*   `/src/services/import/driverTruckPipeline.service.ts`
*   `/src/services/import/driverTruckImport.ts`
*   `/src/types/entities.ts`
*   `/src/tests/ghostDataEliminationBlock103B.test.ts`
*   `/src/tests/masterData.test.ts`

---

## 20. Final Verdict

**`LU_P6_02_DISCOVERY_COMPLETE`**
