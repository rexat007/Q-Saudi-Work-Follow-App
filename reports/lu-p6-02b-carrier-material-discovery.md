# LU-P6-02B — Carrier & Material UI Canonical Convergence Discovery Report

**Discovery Date:** 2026-09-17  
**Gate Status:** DISCOVERY COMPLETE  
**Final Verdict:** `LU_P6_02B_DISCOVERY_COMPLETE`  

---

## 1. Executive Summary

This report establishes the authoritative discovery baseline for **LU-P6-02B** (`Carrier & Material UI Canonical Convergence`).

### Scope & Constraints
- **Mode:** STRICT READ-ONLY DISCOVERY ONLY
- **Code Modifications:** NONE (Zero production, test, or config changes)
- **Primary Objective:** Map all Carrier and Material UI entry points, identify second-kitchen duplications, evaluate free-text material authority risks, and define the Smallest Logical Implementation Unit for LU-P6-02B.

---

## 2. Authoritative Project State

```
PHASE 5 = CLOSED
PHASE 6 = IN PROGRESS

LU-P6-01 = CLOSED
LU-P6-02 = IN PROGRESS
LU-P6-02A = CLOSED
LU-P6-02B = DISCOVERY

P1 CARRIER/MATERIAL = DISCOVERED / NOT_IMPLEMENTED
P2 GOOGLE = NOT_IMPLEMENTED
P3 IMPORT DASHBOARD = NOT_IMPLEMENTED

608_CONTROL_CONVERGENCE = NOT_IMPLEMENTED
LIVE_FIRESTORE_E2E_VERIFIED = NO
```

---

## 3. Carrier UI & Service Inventory

### Business Capabilities
1. **Global Carrier Entity Management:** Creation, editing, and activation/deactivation of global transportation carrier entities (`CarrierEntity`).
2. **Project Carrier Assignment:** Association and authorization of a global carrier to operate within a specific project context (`ProjectCarrierAssignment`).

### Discovered Entry Points & Workflows

| Location / File | Capability | Handler / Trigger | Service / Repository | Status / Classification |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/masterData/MasterDataView.tsx` | Global Carrier Create/Edit | `handleCreateCarrier` | `carrierRepository.create` | `CANONICAL` (Global Owner) |
| `src/components/workspace/ProjectWorkspaceView.tsx` | Project Carrier Selection | `handleAddRoster` | `projectCarrierRosterRepository` | `CANONICAL` (Project Owner) |
| `src/services/import/driverTruckImport.ts` | Carrier Resolution on Import | `processSharedImport` | `carrierRepository` | `SECONDARY_CONVERGING` |
| `src/components/FirestoreArchitectureView.tsx` | Developer Test Mutation | Local buttons | `carrierService` | `DEVELOPER_TEST` |

---

## 4. Material UI & Service Inventory

### Business Capabilities
1. **Material Catalog Management:** Global definition of valid aggregate/construction materials (`MaterialEntity`).
2. **Project Material Resolution / Assignment:** Association and validation of materials permissible for transport within a project.

### Discovered Entry Points & Workflows

| Location / File | Capability | Handler / Trigger | Service / Repository | Status / Classification |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/masterData/MasterDataView.tsx` | Material Catalog Create/Edit | `handleCreateMaterial` | `materialRepository.create` | `CANONICAL` (Catalog Owner) |
| `src/components/workspace/ProjectWorkspaceView.tsx` | Project Material Assignment | Roster / Material Select | `projectCarrierRosterRepository` | `CANONICAL` (Project Owner) |
| `src/services/import/driverTruckImport.ts` | Material Resolution on Import | Import Parser | `materialRepository` | `SECONDARY_CONVERGING` |
| `src/components/dispatch/DispatchModal.tsx` | Material Selection for Trip | Form Dropdown | `materialRepository.listByProject` | `READ_ONLY_CONSUMER` |

---

## 5. Free-Text Material Authority Analysis

### Finding
- **Risk Classification:** `P1_MATERIAL_AUTHORITY_RISK`
- **Mechanism:** In certain field dispatch or roster intake forms, if a material is entered as a raw string without strict foreign-key binding to a `MaterialEntity` or `ProjectMaterialAssignment`, operational trip creation proceeds using the raw string name.
- **Impact:** Uncontrolled material strings can cause reporting fragmentation and bypass canonical material catalog normalization.
- **Remediation Recommendation (For Implementation Phase):** Enforce strict selection from project-assigned materials in operational trip creation workflows.

---

## 6. Service Call Graphs

### Carrier Call Graph
```
[MasterDataView] ----> handleCreateCarrier ----> carrierRepository.create ----> Firestore (/carriers)
                                                                                  
[ProjectWorkspace] -> handleAddRoster -------> driverTruckIntakeService -> projectCarrierRosterRepository
```

### Material Call Graph
```
[MasterDataView] ----> handleCreateMaterial ---> materialRepository.create ---> Firestore (/materials)
                                                                                  
[DispatchModal] ----> Material Selection -----> materialRepository.list -----> Read-only resolution
```

---

## 7. Canonical Owner Matrix

| Capability | Canonical UI Owner | Workflow | Service | Repository | Scope | Converges? | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Global Carrier Create** | `MasterDataView.tsx` | Form Modal | `carrierService` | `carrierRepository` | Global | YES | Low |
| **Global Carrier Edit** | `MasterDataView.tsx` | Table Inline | `carrierService` | `carrierRepository` | Global | YES | Low |
| **Project Carrier Assignment**| `ProjectWorkspaceView.tsx`| Roster Intake | `driverTruckIntakeService` | `projectCarrierRosterRepository` | Project | PARTIAL | P2 |
| **Material Catalog Create** | `MasterDataView.tsx` | Form Modal | `materialService` | `materialRepository` | Global | YES | Low |
| **Project Material Resolution**| `ProjectWorkspaceView.tsx`| Material Selection | `projectCarrierRosterRepository` | `materialRepository` | Project | PARTIAL | P1 |

---

## 8. Multiple-Doors Matrix

| Business Capability | Door | Component | Mutation | Same Rules? | Risk | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Global Carrier Creation | Master Data | `MasterDataView.tsx` | `carrierRepository.create` | Yes | Low | `CANONICAL` |
| Global Material Creation | Master Data | `MasterDataView.tsx` | `materialRepository.create` | Yes | Low | `CANONICAL` |
| Roster Carrier Selection | Project Workspace | `ProjectWorkspaceView.tsx` | Intake Service | Yes | Low | `CANONICAL` |
| Free-Text Material Fallback| Field Dispatch | `DispatchModal.tsx` | Raw string pass-through | No | P1 | `SECONDARY_CONVERGING` |

---

## 9. Block103B Reconciliation & Regression Check

- **Status:** `NO_REGRESSION`
- **Finding:** Legacy fixtures and fallback behaviors in `MasterDataView` established in Block103B remain preserved and uncompromised.

---

## 10. Smallest Logical Implementation Unit Recommendation

When proceeding to the implementation stage of LU-P6-02B, the implementation should be split into two isolated sub-units:

1. **LU-P6-02B1 — Global Carrier & Project Carrier Assignment Convergence:**
   Standardize carrier dropdown resolution and enforce `carrierService` usage across Master Data and Project Workspace.

2. **LU-P6-02B2 — Material Catalog & Project Material Resolution Convergence:**
   Eliminate raw string material pass-throughs by enforcing catalog/project-assigned material foreign-key binding during trip and roster creation.

---

## 11. Inspected Files List

- `src/components/masterData/MasterDataView.tsx` (`ACTUAL`)
- `src/components/workspace/ProjectWorkspaceView.tsx` (`ACTUAL`)
- `src/services/driverTruckIntake.service.ts` (`ACTUAL`)
- `src/services/import/driverTruckImport.ts` (`ACTUAL`)
- `src/repositories/carrier.repository.ts` (`ACTUAL`)
- `src/repositories/material.repository.ts` (`ACTUAL`)
- `src/repositories/projectCarrierRoster.repository.ts` (`ACTUAL`)

---

## 12. Implementation Statement

**NO CODE, TEST, OR CONFIGURATION CHANGES WERE MADE DURING THIS DISCOVERY STEP.**

---

**Report Status:** COMPLETE  
**Final Decision:** `LU_P6_02B_DISCOVERY_COMPLETE`
