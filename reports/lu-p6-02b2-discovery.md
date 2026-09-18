# LU-P6-02B2 — Material Resolution & Assignment Discovery Report

**Discovery Date:** 2026-09-17  
**Gate Status:** DISCOVERY COMPLETE  
**Final Verdict:** `LU_P6_02B2_DISCOVERY_COMPLETE`  

---

## 1. Executive Summary

This report establishes the discovery baseline for **LU-P6-02B2** (`Material Catalog & Project Material Resolution Convergence`).

### Scope & Mode
- **Mode:** STRICT READ-ONLY DISCOVERY ONLY
- **Code Modifications:** NONE (Zero production, test, or config changes)
- **Objective:** Evaluate operational material entry points (`DispatchModal.tsx`, `ProjectWorkspaceView.tsx`, Roster, and Trip forms) for raw-string material authority risks and verify project material resolution constraints.

---

## 2. Authoritative Project State

```
PHASE 5 = CLOSED
PHASE 6 = IN PROGRESS

LU-P6-01 = CLOSED
LU-P6-02 = IN PROGRESS
LU-P6-02A = CLOSED
LU-P6-02B = DISCOVERY
LU-P6-02B2 = DISCOVERY ONLY

P1 CARRIER/MATERIAL = DISCOVERED / NOT_IMPLEMENTED
P2 GOOGLE = NOT_IMPLEMENTED
P3 IMPORT DASHBOARD = NOT_IMPLEMENTED
608_CONTROL_CONVERGENCE = NOT_IMPLEMENTED
LIVE_FIRESTORE_E2E_VERIFIED = NO
```

---

## 3. Discovered Material Entry Points & Authority Analysis

### 1. Raw Material String Entry Points
- **Dispatch Modal (`DispatchModal.tsx`):** Material dropdown populates from `materialRepository.listByProject(projectId)`. Operational payloads pass `materialId` alongside `materialName`. (Classification: `ACTUAL`)
- **Project Workspace Roster Intake (`ProjectWorkspaceView.tsx`):** Material selection links to `materialId` in `ProjectCarrierRosterEntity`. If a custom material string is supplied, it is stored in roster records without auto-creating a global `MaterialEntity`. (Classification: `ACTUAL`)

### 2. Auto-Creation Risk Assessment
- **Finding:** Unknown material string input in operational dispatch or roster forms does **NOT** trigger automatic global `MaterialEntity` creation. Global material creation remains strictly restricted to `MasterDataView.tsx` via `materialRepository.create`. (Classification: `ACTUAL`)
- **Risk Classification:** `P1_MATERIAL_AUTHORITY_RISK` exists where operational forms accept raw text fallback names if `materialId` resolution is incomplete.

### 3. Project-Valid Material Eligibility
- **Global Catalog Owner:** `MasterDataView.tsx` (Canonical Owner for Global Material Catalog creation & edits).
- **Project Resolution Owner:** `ProjectWorkspaceView.tsx` / `driverTruckIntakeService` (Canonical Owner for Project Material Roster assignment).

---

## 4. Canonical Owner Matrix

| Capability | Canonical Owner | Service | Repository | Scope | Secondary Doors | Converges? | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Global Material Catalog Create** | `MasterDataView.tsx` | `materialService` | `materialRepository` | Global | None | YES | Low |
| **Global Material Catalog Edit** | `MasterDataView.tsx` | `materialService` | `materialRepository` | Global | None | YES | Low |
| **Project Material Resolution** | `ProjectWorkspaceView.tsx` | `driverTruckIntakeService` | `projectCarrierRosterRepository` | Project | Dispatch Modal | PARTIAL | P1 |
| **Dispatch Material Selection** | `DispatchModal.tsx` | `tripService` | `materialRepository` | Project | None | YES | Low |

---

## 5. Multiple-Doors Matrix

| Capability | Door | Component | Mutation | Canonical? | Risk | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Global Material Creation | Master Data | `MasterDataView.tsx` | `materialRepository.create` | YES | Low | `CANONICAL` |
| Roster Material Assignment | Project Workspace | `ProjectWorkspaceView.tsx` | `driverTruckIntakeService` | YES | Low | `CANONICAL` |
| Dispatch Material Selection | Field Dispatch | `DispatchModal.tsx` | `tripRepository.create` | YES | P1 | `SECONDARY_CONVERGING` |

---

## 6. Smallest Logical Implementation Unit Recommendation

For the implementation step of LU-P6-02B2:
1. **Enforce Foreign-Key Binding:** Require `materialId` presence on all operational dispatch and roster payloads.
2. **Server-Side Eligibility Validation:** Reject dispatch or roster creation if `materialId` does not correspond to an active, project-authorized `MaterialEntity`.
3. **No Auto-Creation:** Strictly block operational auto-creation of global material entities.

---

## 7. Inspected Files List

- `src/components/dispatch/DispatchModal.tsx` (`ACTUAL`)
- `src/components/workspace/ProjectWorkspaceView.tsx` (`ACTUAL`)
- `src/components/masterData/MasterDataView.tsx` (`ACTUAL`)
- `src/services/driverTruckIntake.service.ts` (`ACTUAL`)
- `src/repositories/material.repository.ts` (`ACTUAL`)

---

## 8. Implementation Statement

**NO CODE, TEST, OR CONFIGURATION CHANGES WERE MADE DURING THIS DISCOVERY STEP.**

---

**Report Status:** COMPLETE  
**Final Decision:** `LU_P6_02B2_DISCOVERY_COMPLETE`
