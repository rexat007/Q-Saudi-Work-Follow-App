# BLOCK 101 — Operational Permissions & Smart Roster Import Forensic Audit Report

**Date:** September 15, 2026  
**Audit Mode:** READ-ONLY FORENSIC  
**Target Project:** `Q-PRJ-001`  
**Authenticated User:** `raharaya2002@gmail.com` (`userId: tnvNvIwUdgSrud72N38LhJfBlhw2`)  

---

## Executive Summary

This forensic audit investigates the operational permission errors and storage UX regressions encountered during live usage of Project `Q-PRJ-001`, as well as auditing the architecture of the Smart Roster Import pipeline.

### Summary of Key Findings:
1. **User Role Mismatch (`VIEWER` vs `PROJECT_ADMIN`)**:
   User `raharaya2002@gmail.com` currently holds the `VIEWER` role in the Firestore `/users/tnvNvIwUdgSrud72N38LhJfBlhw2` document with `assignedProjectIds: []`. Toggling the client-side role switcher in `App.tsx` changes React state only, but does not alter server-enforced Firestore Security Rules.
2. **Roster Creation Permission Denial**:
   Manual roster writes (`projects/Q-PRJ-001/roster/RST-MU2Z7M4L`) are rejected with `PERMISSION_DENIED` ("Missing or insufficient permissions") because `firestore.rules` requires `hasProjectRole(projectId, ['PROJECT_ADMIN', 'SUPER_ADMIN'])`, which evaluates to `false` for a `VIEWER` account.
3. **Google Drive Selector Regression**:
   Direct text inputs for `rootFolderName` and raw Folder IDs remain exposed in `Step6GoogleDrive.tsx` and `WorkspaceIntegrationView.tsx`, creating UX ambiguity despite prior specifications directing all storage selection through the Enterprise Drive Selector.
4. **Smart Roster Import Architecture**:
   The Unified Import Pipeline (`src/services/import/unifiedImportPipeline.service.ts` and `driverTruckImport.ts`) natively supports Excel (`.xlsx`, `.xls`), CSV (`.csv`), and Google Sheets. It executes a 10-stage pipeline with in-memory parsing, intelligent entity resolution, conflict checking, and a strict review-before-commit gate before writing to Firestore.

---

## Part 1: Detailed Findings & Root Cause Analysis

### 1. User Identity & Role Investigation
* **Firestore Document Path:** `users/tnvNvIwUdgSrud72N38LhJfBlhw2`
* **Recorded Attributes:**
  * `email`: `raharaya2002@gmail.com`
  * `role`: `VIEWER`
  * `status`: `PENDING_APPROVAL` / `ACTIVE` (default initial state)
  * `assignedProjectIds`: `[]`
* **Root Cause:**
  When a new Google Auth user logs in for the first time without prior admin provisioning, `AuthContext` initializes a default profile with `role: 'VIEWER'`. The header dropdown in `App.tsx` allows switching the local UI demo context, but **does not grant Firestore security authorization**, which relies strictly on the user document in `/users/{uid}`.

### 2. Roster Write Permission Denial
* **Failed Path:** `projects/Q-PRJ-001/roster/RST-MU2Z7M4L`
* **Security Rule Evaluated (`firestore.rules`):**
  ```cel
  match /projects/{projectId}/roster/{rosterId} {
    allow create, update: if isSignedIn()
      && isValidId(rosterId)
      && hasProjectRole(projectId, ['PROJECT_ADMIN', 'SUPER_ADMIN'])
      && isAuditStampedCreate(incoming())
      && incoming().rosterId == rosterId
      && incoming().projectId == projectId;
  }
  ```
* **Evaluation Result:**
  * `isSignedIn()` → `true`
  * `hasProjectRole('Q-PRJ-001', ['PROJECT_ADMIN', 'SUPER_ADMIN'])` → **`false`**
* **Result:** Firestore rejects the client `setDoc` operation with `PERMISSION_DENIED` ("Missing or insufficient permissions").

### 3. Google Drive Storage Selection UX Regression
* **Identified Regression Locations:**
  1. `src/components/wizard/Step6GoogleDrive.tsx` (Direct text box for `rootFolderName`).
  2. `src/components/workspace/WorkspaceIntegrationView.tsx` (Raw text inputs for `targetFolderId` and `pastedDriveUrl`).
* **Root Cause:**
  Legacy raw input components were retained alongside the new Enterprise Folder Picker (`ENTERPRISE_FOLDER_PRESETS`), leading to UI confusion where manual raw IDs are exposed to users.
* **Remediation Plan:**
  Replace raw input text boxes in Step 6 and Workspace settings with the unified Enterprise Drive Folder Selector modal and automatic folder URL resolution.

---

## Part 2: Smart Roster Import Pipeline Architecture

### 1. Pipeline Stages & Execution Flow
The Unified Import Pipeline (`unifiedImportPipeline.service.ts`) enforces a 10-stage decoupled architecture:
1. `SOURCE` — Input file intake validation.
2. `PARSE` — Parser execution (Excel/CSV/Google Sheets).
3. `NORMALIZE` — Arabic & English column alias standardization and field normalization.
4. `MAP` — Canonical schema mapping.
5. `ENTITY_RESOLUTION` — Driver/Truck/Carrier matching with confidence scoring and conflict detection.
6. `VALIDATE` — Business rule and format validation.
7. `DUPLICATE_CHECK` — Batch & database duplicate checking (Saudi National ID, License Plate).
8. `REVIEW` — Review-before-commit stage (In-Memory; Zero Firestore Writes).
9. `COMMIT` — Atomic write to Firestore.
10. `AUDIT` — Execution logging and audit trail.

### 2. Supported Formats & Parsers
* **Excel:** `excelParser.service.ts` using XLSX parser.
* **CSV:** `csvParser.service.ts` with delimiter auto-detection.
* **Google Sheets:** `googleSheetsParser.service.ts` & `googleSheetsPipeline.service.ts`.

### 3. Entity Resolution & Intelligent Conflict Detection
* **Driver Resolution:** Matches by 10-digit Saudi ID/Iqama (`EXACT`), normalized name (`NORMALIZED`), or partial name inclusion (`FUZZY`). Detects `DRIVER_CARRIER_CONFLICT` if driver belongs to a different carrier.
* **Truck Resolution:** Matches by normalized Saudi license plate (`EXACT` / `NORMALIZED`). Detects `RELATIONSHIP_CONFLICT` if truck belongs to a different carrier.

### 4. Entity ID & Scope Logic
* **Global Driver ID (`driverId`):** `DRV-IMP-{timestamp}-{hash}` stored in global `drivers` collection linked to primary `carrierId`.
* **Project Roster ID (`rosterId`):** `RST-{hash}` stored in `projects/{projectId}/roster/{rosterId}`. Maps Carrier + Driver + Truck + Allowed `materialIds` to project scope `Q-PRJ-001`.

---

## Summary of Actionable Next Steps

1. **Update User Profile**: Upgrade user document `/users/tnvNvIwUdgSrud72N38LhJfBlhw2` to `role: 'PROJECT_ADMIN'` (or `'SUPER_ADMIN'`) and add `'Q-PRJ-001'` to `assignedProjectIds` via Firebase Console or Admin Console.
2. **Drive UX Standardization**: Consolidate Google Drive folder selection across Wizard Step 6 and Workspace Settings to use the Enterprise Drive Folder Selector.
3. **Verify Roster Creation**: Test manual roster entry and Smart Roster Import once permissions are updated.
