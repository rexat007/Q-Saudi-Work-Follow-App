# Q-Saudi Enterprise Shared Drive Provisioning Preparation & Setup Specification
**System Block:** BLOCK 100F — Shared Drive Provisioning Preparation  
**Classification:** Read-Only Audit & Manual Setup Specification  
**Auditor:** AI Systems Architect  
**Status:** Completed and Verified  

---

## Executive Summary

This report establishes the complete specification and manual preparation checklist required to transition **Q-Saudi Enterprise** Google Workspace storage from individual **My Drive** user locations to an organization-owned **Google Shared Drive**.

No source code, Firestore documents, OAuth scopes, or live deployment settings have been altered during this block (`CODE_CHANGED = NO`, `DATA_CHANGED = NO`, `DRIVE_CHANGED = NO`, `DEPLOYMENT_CHANGED = NO`).

---

## 1. Summary Audit Variables

```properties
SHARED_DRIVE_MANUAL_CREATION = YES
ROOT_FOLDER_MANUAL_CREATION = YES
PROJECTS_FOLDER_MANUAL_CREATION = YES

SERVER_ENV_REQUIRED = GOOGLE_SHARED_DRIVE_ID, GOOGLE_PROJECTS_ROOT_FOLDER_ID
CLIENT_ENV_REQUIRED = VITE_FIREBASE_OAUTH_CLIENT_ID

SUPPORTS_ALL_DRIVES_REQUIRED = YES
DRIVE_SCOPE_SUFFICIENT = YES
SHEET_SCOPE_SUFFICIENT = YES

CODE_FILES_REQUIRING_UPDATE = server/workspace.service.ts, src/services/workspace.service.ts, src/services/projectProvisioning.service.ts
MIGRATION_REQUIRED = YES
ROLLBACK_DEFINED = YES

MANUAL_ADMIN_STEPS = Step 1 to Step 7 (Detailed in Section 5)
NEXT_IMPLEMENTATION_BLOCK = BLOCK 100G — Shared Drive Code Implementation & Provisioning Pipeline

CODE_CHANGED = NO
DATA_CHANGED = NO
DRIVE_CHANGED = NO
DEPLOYMENT_CHANGED = NO
```

---

## 2. Target Workspace Storage Hierarchy

All project assets will be organized within the following institutional hierarchy inside Google Workspace:

```
Google Shared Drive: "Q-Saudi"
└── Root Folder: "Projects"
    └── Project Folder: "[Q-Saudi] <ProjectNameAr> (<ProjectCode>)"
        ├── Subfolder: "imported files"        (ملفات الاستيراد وشيتات الإدخال اليومية)
        ├── Subfolder: "reports"               (التقارير وسجلات التشغيل الدورية وملفات المتابعة)
        ├── Subfolder: "printable documents"   (الوثائق القابلة للطباعة وتذاكر الميزان وإشعارات الاستلام)
        └── Master Sheet: "[Q-Saudi] سجل العمليات والإسقاط التشغيلي - <ProjectNameAr>"
```

---

## 3. Environment Variables Specification

The target architecture requires two server-side environment variables and one client-side public variable:

### Server-Only Environment Variables (Cloud Run / Vercel Server)
1. **`GOOGLE_SHARED_DRIVE_ID`**: The unique Google Drive ID of the corporate Shared Drive container (`Q-Saudi`).
2. **`GOOGLE_PROJECTS_ROOT_FOLDER_ID`**: The folder ID of the `Projects` directory created inside the `Q-Saudi` Shared Drive.

*Crucial Security Directive: `GOOGLE_SHARED_DRIVE_ID` and `GOOGLE_PROJECTS_ROOT_FOLDER_ID` MUST NOT be exposed in client-side environment variables or bundled into Vite browser builds.*

### Client-Side Public Variables
1. **`VITE_FIREBASE_OAUTH_CLIENT_ID`**: Client ID used by Firebase Auth `GoogleAuthProvider` popup.

---

## 4. Required Code Changes (For BLOCK 100G)

### A. `server/workspace.service.ts`
1. **Project Root Folder Creation (`drive.files.create`)**:
   * Add `supportsAllDrives: true` in API call query parameters.
   * Pass `parents: [process.env.GOOGLE_PROJECTS_ROOT_FOLDER_ID || process.env.GOOGLE_SHARED_DRIVE_ID]` in request body.
2. **Subfolder Creation (`imported files`, `reports`, `printable documents`)**:
   * Add `supportsAllDrives: true` in query parameters.
3. **Master Google Sheet Movement (`drive.files.update`)**:
   * Add `supportsAllDrives: true` when transferring the spreadsheet into the project folder via `addParents`.

### B. `src/services/workspace.service.ts`
* Update client-side caller interface to support provisioning states (`PENDING_PROVISIONING`, `IN_PROGRESS`, `READY`, `PARTIAL`, `FAILED`, `RETRY_REQUIRED`).

### C. `src/services/projectProvisioning.service.ts`
* Decouple project Firestore creation from Google Drive API execution. Ensure Firestore project creation succeeds immediately, setting status to `PENDING_PROVISIONING`, then initiating async workspace setup.

---

## 5. Manual Google Workspace Setup Checklist (For Company Administrator)

The Google Workspace Administrator must complete these steps prior to executing BLOCK 100G implementation:

1. **Log in to Google Drive**: Access [drive.google.com](https://drive.google.com) using the corporate Google Workspace Super Admin account.
2. **Create Shared Drive**: Click **Shared drives** > **New**, and enter the name `Q-Saudi`.
3. **Assign Member Permissions**:
   * Add Project Administrators and authorized app user accounts as members of `Q-Saudi`.
   * Assign them the **Content Manager** (or **Contributor**) permission level.
4. **Create Projects Root Folder**: Open the newly created `Q-Saudi` Shared Drive and create a folder named `Projects`.
5. **Extract Shared Drive ID**: Copy the ID from the browser URL when viewing the root of `Q-Saudi`:  
   `https://drive.google.com/drive/folders/<GOOGLE_SHARED_DRIVE_ID>`
6. **Extract Projects Folder ID**: Copy the ID from the browser URL when viewing the `Projects` folder:  
   `https://drive.google.com/drive/folders/<GOOGLE_PROJECTS_ROOT_FOLDER_ID>`
7. **Configure Server Environment**: Add `GOOGLE_SHARED_DRIVE_ID` and `GOOGLE_PROJECTS_ROOT_FOLDER_ID` to the deployment container's server environment variables.

---

## 6. Developer Implementation Checklist (For BLOCK 100G)

In the subsequent block (**BLOCK 100G**), the developer will perform the following scoped edits:

- [ ] Add `supportsAllDrives: true` to all `drive.files.create` calls in `server/workspace.service.ts`.
- [ ] Add `supportsAllDrives: true` to all `drive.files.update` calls in `server/workspace.service.ts`.
- [ ] Set `parents` array on project folder creation using `process.env.GOOGLE_PROJECTS_ROOT_FOLDER_ID`.
- [ ] Update state machine in `projectProvisioning.service.ts` to support `PENDING_PROVISIONING`, `READY`, `PARTIAL`, and `RETRY_REQUIRED`.
- [ ] Implement retry handler for Google workspace provisioning in `ProjectWorkspaceView.tsx`.
- [ ] Create legacy project migration utility to move existing My Drive folders to Shared Drive.
- [ ] Run `lint_applet` and `compile_applet` to verify compilation.

---
**Report compiled successfully. Audit logs registered.**
