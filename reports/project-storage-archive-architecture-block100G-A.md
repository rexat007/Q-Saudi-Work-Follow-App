# Q-Saudi Enterprise Project Storage Migration, Backup & Archive Architecture Audit
**System Block:** BLOCK 100G-A — Project Storage Migration, Backup & Archive Architecture Audit  
**Classification:** Confined Read-Only Architectural Strategy Brief & Specification  
**Auditor:** AI Systems Architect  
**Status:** Completed and Verified  

---

## Executive Summary

This document presents a comprehensive, read-only architectural design and specification for a **safe, reversible, project-level storage configuration, file migration, and offline archive system** for **Q-Saudi Enterprise**.

As Q-Saudi transitions from its initial **PILOT phase** (using personal administrator **My Drive** storage) to **COMPANY PRODUCTION** (using an organization-owned **Shared Drive**), the platform must allow Project Managers to dynamically reconfigure Google storage locations without risking operational downtime, lost scale tickets, corrupted spreadsheet formulas, or broken audit trails.

**Crucial Constraint Verification**: Zero source code files, Firestore documents, Google Drive assets, or deployment configurations have been modified during this audit (`CODE_CHANGED = NO`, `DATA_CHANGED = NO`, `DRIVE_CHANGED = NO`, `DEPLOYMENT_CHANGED = NO`).

---

## 1. Current Storage Architecture Audit

### 1.1 What Currently Constitutes the Current Project Storage Root
In the current Q-Saudi codebase, a project's Google Workspace footprint consists of:
1. **Project Storage Root Folder**: A top-level directory in Google Drive identified by `ProjectEntity.settings.googleDriveFolderId`.
2. **Master Google Sheet**: A 6-tab spreadsheet identified by `ProjectEntity.settings.googleSpreadsheetId`.
3. **Subfolder Directory Structure**:
   * `imported files` (ملفات الاستيراد وشيتات الإدخال اليومية)
   * `reports` (التقارير وسجلات التشغيل الدورية وملفات المتابعة)
   * `printable documents` (الوثائق القابلة للطباعة وتذاكر الميزان وإشعارات الاستلام)
4. **Firestore Storage Pointers**:
   * `ProjectEntity.settings.googleDriveFolderId`
   * `ProjectEntity.settings.googleSpreadsheetId`
   * `ProjectEntity.settings.googleDriveProvisioning` (`{ enabled, rootFolderName, spreadsheetTitle, status }`)
   * `TripEntity.weights.originTicketDriveFileId` & `destinationTicketDriveFileId`
   * `TripSourceMetadata.sourceFileId`

---

## 2. Configurable Project Storage Profile & Schema

### 2.1 User Experience (UX) Design
Rather than exposing raw, error-prone 33-character Google Drive ID strings to the Project Manager, the system will render a human-readable **Storage Location Card**:

* **Display View**:
  * **Current Storage Location**: `[Shared Drive] Q-Saudi / Projects / مشروع نيوم الشمالي (Q-PRJ-001)`
  * **Storage Provider**: `Google Shared Drive` (or `My Drive`)
  * **Status**: `PROVISIONED & VERIFIED` (Last verified: 2026-09-15 14:30 AST)
  * **Actions**: `[Change Storage Location]` | `[Download Complete Project Archive]`
* **Selection Workflow**: A secure Google Drive Folder Picker or validated Folder Selection Dialog that resolves folder permissions and returns folder metadata before initiating migration.

### 2.2 Proposed Firestore Schema
The project's storage configuration will be stored inside `ProjectEntity.settings.storageProfile`:

```typescript
export interface ProjectStorageProfile {
  storageProvider: 'MY_DRIVE' | 'SHARED_DRIVE' | 'LOCAL_HYBRID';
  currentStorageFolderId: string;
  currentSpreadsheetId: string;
  previousStorageFolderId?: string | null;
  previousSpreadsheetId?: string | null;
  sharedDriveId?: string | null;
  rootFolderPathDisplay: string; // e.g., "Q-Saudi / Projects / NEOM-North"
  provisioningStatus: 'PROVISIONED' | 'PENDING' | 'PARTIAL' | 'FAILED' | 'RETRY_REQUIRED';
  migrationStatus: 'IDLE' | 'REQUESTED' | 'VALIDATING' | 'COPYING' | 'VERIFYING' | 'READY_TO_SWITCH' | 'SWITCHED' | 'FAILED' | 'ROLLBACK_REQUIRED';
  lastVerifiedAt: string; // ISO Timestamp
  archiveVersion: number; // Monotonically increasing export counter
}
```

---

## 3. Immutable Storage History Model

To ensure 100% auditability and prevent orphaned file references when storage location changes occur, the system introduces a dedicated subcollection:

**Firestore Path**: `/projects/{projectId}/storageHistory/{historyId}`

```typescript
export interface StorageHistoryRecord {
  historyId: string; // UUID
  projectId: string;
  folderId: string;
  spreadsheetId: string;
  displayNamePath: string;
  provider: 'MY_DRIVE' | 'SHARED_DRIVE';
  sharedDriveId?: string | null;
  createdAt: string; // ISO Timestamp
  deactivatedAt: string | null; // ISO Timestamp when superseded
  changedBy: {
    userId: string;
    email: string;
    role: string;
  };
  migrationJobId: string;
  copiedFilesCount: number;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
  fileIdMap: Record<string, string>; // { oldDriveFileId: newDriveFileId }
  status: 'ACTIVE' | 'ARCHIVED' | 'HISTORICAL';
}
```

---

## 4. Safe Storage Change Workflow & State Machine

### 4.1 State Machine Transition Pipeline
To guarantee zero data loss, the active storage pointer in Firestore is **NEVER** modified during file copying or validation. The switch happens atomically at the very end of a successful verification step.

```
[IDLE]
  │ (PM initiates location change)
  ▼
[REQUESTED]
  │ (Server validates target permissions, quota, and folder structure)
  ▼
[VALIDATING]
  │ (Server recursively copies assets & initializes target Master Sheet)
  ▼
[COPYING]
  │ (Server verifies file count, size checksums, and sheet tab schema)
  ▼
[VERIFYING] ──(Failure)──► [FAILED] ──► [ROLLBACK_REQUIRED] (Old storage remains active)
  │ (100% Pass)
  ▼
[READY_TO_SWITCH]
  │ (Atomic commit: Update Firestore settings.storageProfile pointer)
  ▼
[SWITCHED] ──► [IDLE] (Old storage marked as ARCHIVED in storage history)
```

### 4.2 Key Invariants
* **Rule 1**: Old storage is **NEVER** deleted automatically. It transitions to status `ARCHIVED` in `storageHistory`.
* **Rule 2**: If migration fails at 99%, the active operational pointer in Firestore remains anchored to the old storage location.

---

## 5. File Copy Strategy

When migrating a project storage location, file categories are processed according to distinct operational rules:

| Category | Migration Action | Strategy & Rationale |
| :--- | :--- | :--- |
| **A. Master Google Sheet** | `REBUILD_AND_RESYNC` | Instantiate fresh sheet in target location, set 6 localized tabs, and run full Firestore projection sync. Preserves 100% formula and data integrity without stale permission baggage. |
| **B. Imported Files** | `RECURSIVE_DRIVE_COPY` | Copy binary Excel/CSV files to new `imported files` subfolder via `drive.files.copy` (`supportsAllDrives: true`). |
| **C. Reports** | `RECURSIVE_DRIVE_COPY` | Copy PDF/Excel historical report exports to new `reports` subfolder. |
| **D. Printable Documents** | `RECURSIVE_DRIVE_COPY` | Copy scale slips and delivery vouchers to new `printable documents` subfolder. |
| **E. Other Drive Assets** | `RECURSIVE_DRIVE_COPY` | Recursively duplicate any custom project documents added by users. |
| **F. Subfolder Hierarchy** | `PROGRAMMATIC_RECREATE` | Programmatically spawn `imported files`, `reports`, `printable documents` in new root folder, then populate. |

---

## 6. Master Google Sheet Strategy

### Recommendation: Option B (Rebuild from Firestore + Schema Sync)
* **Why Copying (`drive.files.copy`) is Dangerous**: Copying a Google Sheet carries over legacy range permissions, broken external cell formulas, and unindexed cell IDs.
* **Why Rebuilding from Firestore is Superior**: Firestore is the Single Authoritative Source of Truth. By creating a clean spreadsheet in the target folder, initializing the 6 Saudi Arabic tabs (**العمليات**, **السائقين**, **الناقلين**, **المواد**, **الاستثناءات**, **التقارير**), and executing `clientWorkspaceService.syncProjectionToSheets()`, we guarantee **100% structural and data integrity** with zero corruption.

---

## 7. Link & Reference Integrity Strategy

Trips store weighbridge ticket file IDs (`originTicketDriveFileId`, `destinationTicketDriveFileId`). If a storage location changes:

1. **Immutable File Mapping**: The migration job records a dictionary mapping `fileIdMap: { oldFileId: newFileId }` in the `StorageHistoryRecord`.
2. **Dynamic Link Resolution**: When a user clicks a ticket link, the app checks the current active Drive. If the file is not found, it resolves through `fileIdMap` or falls back to the historical folder link.
3. **No Batch Historical Mutation**: Firestore trip records do NOT need to be rewritten, maintaining immutable audit trails.

---

## 8. Project Archive Download Specification

The system will provide a self-contained, offline **Complete Project Archive Package**:

### 8.1 Package Structure
**Filename**: `Q-PRJ-<ProjectCode>_PROJECT_ARCHIVE_<YYYYMMDD_HHMMSS>.zip`

```
Q-PRJ-001_PROJECT_ARCHIVE_20260915_143000.zip
├── project-manifest.json             (Archive metadata, SHA-256 hashes, system version)
├── project-data.json                 (Complete Firestore project entity & settings)
├── roster.json                       (Carriers, Drivers, Trucks, Roster mappings)
├── pricing.json                      (Pricing rules, tariffs, demurrage rates)
├── trips-export.json                 (Full operational trips dataset with financial snapshots)
├── exceptions.json                   (Trip exceptions, weighbridge variances, resolution logs)
├── audit-export.json                 (Complete audit trail for the project)
├── reports/                          (Downloaded PDF & Excel project reports)
├── imports/                          (Uploaded raw Excel/CSV weighbridge files)
├── printable-documents/              (Scale tickets, delivery notes, vouchers)
└── metadata/                         (Schema definitions & storage history log)
```

### 8.2 Security Filter (MANDATORY)
The archive generator MUST explicitly strip:
* OAuth Access Tokens & Refresh Tokens
* Client Secrets & Private Keys
* Firebase Admin Service Account JSONs
* Password Hashes & Internal Auth Credentials

---

## 9. Archive vs Backup vs Disaster Recovery

| Concept | Purpose | Primary Storage | Retention |
| :--- | :--- | :--- | :--- |
| **Operational Storage** | Active real-time operational reading & writing. | Firestore + Google Drive | Live |
| **Project Archive / Export** | Standalone offline ZIP package for client handover or offline compliance audit. | Downloaded ZIP file | Permanent Offline |
| **Disaster Recovery Backup** | System-wide infrastructure recovery following cloud outage. | Firebase Automated Firestore Backups (GCS) | Managed Cloud DR |
| **Historical Storage Location** | Read-only preservation of previous Drive folders after migration. | Archived Google Drive Folder | Permanent Read-Only |

*The Project Archive is a data export and compliance package; it does NOT replace Firebase automated infrastructure backups.*

---

## 10. Pilot (My Drive) to Company (Shared Drive) Migration Roadmap

```
PILOT PHASE (Current)                   COMPANY PRODUCTION (Target)
User OAuth + My Drive                   User OAuth + Shared Drive
Folder: [Q-Saudi] Project               Folder: Shared Drive/Q-Saudi/Projects/Project
 ├── Master Sheet                        ├── Master Sheet
 └── Subfolders                          └── Subfolders
             │                                       ▲
             └───────────── MIGRATION PIPELINE ──────┘
                     (Preserves: Project ID, Project Code,
                      Trip Numbers, Financial Snapshots, Audit Logs)
```

### Key Preservation Guarantees
* `projectId` remains unchanged (e.g., `prj_neom_001`).
* `projectCode` remains unchanged (e.g., `Q-PRJ-001`).
* `tripId` & `tripNumber` remain 100% identical.
* All financial pricing snapshots remain immutable.

---

## 11. Security & RBAC Model

| Role | Change Storage Location | Trigger Migration | Download Project Archive | Access Historical Drive |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **Project Admin (Assigned)** | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **Site Supervisor** | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ Read-Only via App |
| **Dispatcher / Scale Operator** | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED |
| **Driver / Viewer** | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED |

---

## 12. Idempotency & Failure Recovery

1. **Migration Job ID (`migrationJobId`)**: Every storage migration executes under a unique idempotency key.
2. **Resumable File Copies**: File copy operations track completed files in a temporary status manifest. If network interruption occurs at 60%, a retry inspects `fileIdMap` and resumes remaining files without creating duplicates.
3. **Atomic Pointer Switch**: If migration succeeds but user browser disconnects before confirmation, the server reconciles state and marks the job `READY_TO_SWITCH` for one-click admin completion.

---

## 13. Immutable Audit Trail Specification

Every storage migration action produces an immutable `AuditLogEntity` event in Firestore:

* `STORAGE_CHANGE_REQUESTED`
* `DESTINATION_FOLDER_VALIDATED`
* `MIGRATION_JOB_STARTED`
* `SUBFOLDERS_CREATED`
* `MASTER_SHEET_REBUILT`
* `FILES_COPIED_PROGRESS`
* `STORAGE_VERIFICATION_PASSED`
* `ACTIVE_STORAGE_POINTER_SWITCHED`
* `PREVIOUS_STORAGE_ARCHIVED`
* `PROJECT_ARCHIVE_DOWNLOADED`

---

## 14. Data Retention Strategy for Historical Locations

* **Default Policy**: Previous Google Drive folders are **NEVER** automatically deleted.
* **Status**: They are marked as `ARCHIVED / HISTORICAL` in `storageHistory`.
* **Access Control**: Permissions on the old folder are updated to **Read-Only** to prevent accidental writes to legacy locations.

---

## 15. Current Codebase Mapping

| File Path | Status | Action Required in Next Block |
| :--- | :--- | :--- |
| `server/workspace.service.ts` | **REUSE** | Add Shared Drive support (`supportsAllDrives: true`), file copy endpoint, and ZIP archive packaging. |
| `src/services/workspace.service.ts` | **REUSE** | Extend client service with `changeStorageLocation()`, `fetchStorageHistory()`, and `downloadProjectArchive()`. |
| `src/services/projectProvisioning.service.ts` | **REUSE** | Integrate `storageProfile` schema and decoupled lifecycle state machine. |
| `src/services/reportsEngine.service.ts` | **REUSE** | Provide dataset serializers for Project Archive ZIP generation. |
| `src/components/workspace/WorkspaceIntegrationView.tsx` | **REUSE** | Add Storage Profile Card, Change Storage Location Modal, and Archive Download button. |
| `src/types/entities.ts` & `src/types/workspace.ts` | **MODIFY LATER** | Declare `ProjectStorageProfile` and `StorageHistoryRecord` interfaces. |

---

## 16. Final Target Architecture & Recommendations

### Target Architecture Topology

```
PROJECT ENTITY (Firestore)
   │
   ├──> currentStorageProfile (Active Pointers & Provider Info)
   │       ├── storageProvider: SHARED_DRIVE
   │       ├── currentStorageFolderId: "1_TARGET_FOLDER_ID"
   │       └── currentSpreadsheetId: "1_TARGET_SHEET_ID"
   │
   ├──> storageHistory (Subcollection: Immutable Historical Log)
   │       ├── Record #1 (Pilot My Drive - Archived)
   │       └── Record #2 (Production Shared Drive - Active)
   │
   └──> archiveEngine (Generates ZIP Packages on demand)
```

---

## 17. Summary Audit Variables Checklist

```properties
CONFIGURABLE_STORAGE_RECOMMENDED = YES
PROJECT_STORAGE_PROFILE = Firestore-managed entity settings defining active storage, provider mode, health, and migration state
STORAGE_HISTORY_REQUIRED = YES
SAFE_STORAGE_SWITCH = YES
OLD_STORAGE_PRESERVED = YES

ARCHIVE_DOWNLOAD_RECOMMENDED = YES
ARCHIVE_STRUCTURE = Q-PRJ-001_PROJECT_ARCHIVE_<timestamp>.zip containing manifest, json datasets, and subdirectories
ARCHIVE_REPLACES_FIRESTORE_BACKUP = NO

MASTER_SHEET_MIGRATION = REBUILD_AND_RESYNC (Fresh sheet + 6 tabs + full Firestore projection sync)
FILE_COPY_STRATEGY = RECURSIVE_DRIVE_COPY (subfolders recreated, binary files copied with supportsAllDrives=true)
LINK_INTEGRITY_STRATEGY = IMMUTABLE_FILE_MAPPING (fileIdMap lookup without rewriting historical trip records)

PILOT_MY_DRIVE_SUPPORTED = YES
COMPANY_SHARED_DRIVE_SUPPORTED = YES
MIGRATION_PRESERVES_PROJECT_ID = YES
MIGRATION_PRESERVES_TRIP_IDS = YES

RBAC_MODEL = SUPER_ADMIN & assigned PROJECT_ADMIN allowed; OPERATIONAL roles DENIED
IDEMPOTENT_MIGRATION = YES
ROLLBACK_STRATEGY = ZERO_POINTER_SWITCH_ON_FAILURE (Old storage remains active until 100% verification passes)
AUDIT_REQUIRED = YES

CURRENT_FILES = server/workspace.service.ts, src/services/workspace.service.ts, src/services/projectProvisioning.service.ts, src/types/entities.ts, src/types/workspace.ts, src/components/workspace/WorkspaceIntegrationView.tsx
FILES_TO_REUSE = server/workspace.service.ts, src/services/workspace.service.ts, src/services/projectProvisioning.service.ts, src/services/reportsEngine.service.ts, src/components/workspace/WorkspaceIntegrationView.tsx
FILES_TO_REBUILD = None

IMPLEMENTATION_RECOMMENDED = YES
NEXT_IMPLEMENTATION_BLOCK = BLOCK 100G-B — Configurable Project Storage & Archive Implementation

CODE_CHANGED = NO
DATA_CHANGED = NO
DRIVE_CHANGED = NO
DEPLOYMENT_CHANGED = NO
```

---
**Report compiled successfully. Audit logs registered.**
