# Q-Saudi Enterprise Workspace Access & Integration Audit
**System Block:** BLOCK 100D — Google Drive & Sheets Access & Root Folder Audit  
**Classification:** Confined Read-Only Architectural Verification  
**Auditor:** AI Systems Architect  
**Status:** Completed and Verified  

---

## Executive Summary
This document delivers a professional, read-only architectural audit of the Google Workspace (Google Drive & Google Sheets) integration for **Q-Saudi Enterprise**. It traces the path of credential flows, verifies the file and sheet provisioning mechanisms, assesses security and business risks, and provides concrete enterprise-grade recommendations for future security hardening.

---

## 1. Authentication Model Analysis
The application's Google integration uses a **Delegated User OAuth 2.0 Model** (Model B: Project-Centric Delegated Ownership). No Service Account is currently configured or active on the backend.

### Technical Token Flow
1. **Consent Trigger (`ClientWorkspaceService.requestGoogleScopes`)**:  
   When an administrator requests workspace provisioning or synchronization, the client-side app triggers a Firebase Auth `GoogleAuthProvider` popup.
2. **Token Acquisition**:  
   The popup authenticates the user and requests authorization for specific Google scopes. Firebase returns a credentials payload containing an `accessToken`.
3. **Client Caching**:  
   The retrieved access token is stored inside the browser's `sessionStorage` under the key `q_saudi_google_token`.
4. **Header Injection**:  
   For all backend-directed calls (`/api/workspace/provision`, `/api/workspace/sync/*`, `/api/workspace/upload`), the client appends this access token as a bearer token in the `Authorization` header:
   ```http
   Authorization: Bearer <accessToken>
   ```
5. **Backend Client Authorization (`ServerWorkspaceService.getAuthClient`)**:  
   The Express server extracts the bearer token, instantiates an official `google.auth.OAuth2` client, and sets the credentials:
   ```typescript
   const auth = new google.auth.OAuth2();
   auth.setCredentials({ access_token: cleanToken });
   ```
   All Google Drive (`v3`) and Sheets (`v4`) services are initialized using this transient, user-delegated client.

---

## 2. OAuth Scopes Audit
The client explicitly requests the following scopes during the Google Sign-In popup sequence:

| Scope | URI | Description | Risk Level |
| :--- | :--- | :--- | :--- |
| **Google Sheets** | `https://www.googleapis.com/auth/spreadsheets` | Full read/write access to all spreadsheets in the user's Drive. | **Medium-High** |
| **Google Drive File** | `https://www.googleapis.com/auth/drive.file` | Allowed to create and modify files/folders created by this app. | **Low (Best Practice)** |

### Security Assessment
* **The Good (`drive.file`)**: The application cannot browse, read, or modify arbitrary files in the user's Google Drive. It is restricted strictly to files/directories it has programmatically spawned. This isolates the user's personal documents from the app.
* **The Concern (`spreadsheets`)**: This scope grants general read/write access to any Google Sheet in the user's account, even those not created by Q-Saudi. While required for broad synchronization, enterprise IT security departments often prefer service account scopes or more narrow file delegation.

---

## 3. Root Folder Configuration
* **Status**: **No Company Root Folder Configured.**
* **Analysis**:  
  In `/server/workspace.service.ts`, during project provisioning (`provisionProjectDrive`), the parent folder ID is not specified for the top-level Project Root Folder:
  ```typescript
  const rootRes = await drive.files.create({
    requestBody: {
      name: rootFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: `المجلد الرئيسي لإدارة وثائق وعمليات مشروع ${project.nameAr}`,
    },
    fields: 'id, webViewLink',
  });
  ```
  Because no parent folder array is defined in the `requestBody`, Google Drive defaults to placing this newly created folder directly in the signed-in administrator's root directory (**My Drive**).

---

## 4. Project Folder Creation Logic
When a project is provisioned, the backend creates a highly structured folder hierarchy to ensure clean document categorization.

### Naming Conventions
* **Project Folder Name**: `[Q-Saudi] <ProjectNameAr> (<ProjectCode>)`  
  *(Example: `[Q-Saudi] مشروع نيوم الشمالي (Q-PRJ-001)`)*

### Subfolder Structure
Within the Project Root Folder, three specialized subfolders are programmatically created with parent boundaries set to the Project Root Folder ID:
1. **`imported files`**  
   * **Description**: ملفات الاستيراد وشيتات الإدخال اليومية  
   * **Use Case**: Used by the Unified Import Pipeline for daily Excel/CSV weightbridge imports.
2. **`reports`**  
   * **Description**: التقارير وسجلات التشغيل الدورية وملفات المتابعة  
   * **Use Case**: Houses generated PDF and Excel operational reports, shipment volumes, and financial statements.
3. **`printable documents`**  
   * **Description**: الوثائق القابلة للطباعة وتذاكر الميزان وإشعارات الاستلام  
   * **Use Case**: Stores scale tickets, weighbridge slips, and digitally signed delivery notices.

---

## 5. Google Sheet Creation Logic
A project-specific master spreadsheet is generated to serve as the external real-time projection target of the Firestore database.

### Naming & Localization
* **Spreadsheet Title**: `[Q-Saudi] سجل العمليات والإسقاط التشغيلي - <ProjectNameAr>`
* **Locale Config**: `ar_SA` (Saudi Arabia)
* **TimeZone Config**: `Asia/Riyadh` (GMT+3)

### Initial Organization & Location
The spreadsheet is initially created in the user's root Drive directory and is immediately moved inside the newly provisioned Project Root Folder using a `drive.files.update` call specifying `addParents: rootFolderId`.

### Master Sheets & Tab Structures
The spreadsheet is instantiated with 6 pre-configured tabs:
1. **العمليات (Operations)**: Syncs all trip logs with full pricing, weights, shifts, and timestamps.
2. **السائقين (Drivers)**: Syncs registered drivers with national IDs, phone numbers, and licenses.
3. **الناقلين (Carriers)**: Syncs carrier entities, commercial registries (CR), and transport licenses (TGA).
4. **المواد (Materials)**: Syncs allowed project materials, codes, units, and densities.
5. **الاستثناءات (Exceptions)**: Syncs weighbridge variances and cargo load violations.
6. **التقارير (Reports)**: Syncs calculated KPI metrics (Total Tons, Financial Settlements, Completed ratios).

### Schema Update & Preservation
To safeguard existing columns, the system enforces a **Non-Destructive Column Expansion (`NON_DESTRUCTIVE_COLUMN_EXPANSION`)** strategy in `ensureSheetTabWithHeaders`. It reads existing headers; if missing columns are found, they are appended to the right. Existing headers are never renamed, reordered, or deleted, protecting historical data and user formula sheets.

---

## 6. Service Account Analysis
* **Presence**: **None.** No service account credentials, key JSONs, or service emails are utilized in either the client or server.
* **Architectural Justification**:
  * **Zero Trust Secret Management**: Avoids storing highly-privileged service account credentials (private keys) on the application server.
  * **User-Level Permissions & Ownership**: Ensures files and directories created are owned by the active company administrator, enabling seamless sharing, access control, and manual oversight through Google Drive.
  * **Zero Platform Overhead**: Minimizes GCP IAM configuration during applet setup, utilizing user OAuth popups to dynamically authenticate with Workspace.

---

## 7. Google-Related Environment Variables
The application's Google Workspace footprint is defined exclusively by:
* `VITE_FIREBASE_OAUTH_CLIENT_ID` (Declared in `.env.example` and configured inside `firebase-applet-config.json`): Used by Firebase Auth to initialize the client-side Google OAuth popup.
* No server-side environment secrets (such as private keys or client secrets) are present, securing the deployment container from accidental token exposure.

---

## 8. File Ownership & Sandboxing Model
* **Ownership**: Files, folders, and spreadsheets are owned by the individual Google user who completes the OAuth prompt. 
* **Sandbox Behavior (`drive.file` scope)**: Because the application requests `drive.file` instead of full `drive` access, the application can only view or modify files/folders that were explicitly created by this application. It cannot view, read, or alter any of the user's other files.

---

## 9. Company Operating Model
The application operates on **Model B: Project-Centric Delegated Ownership**. 

* **Topology**: Under this topology, there is no centralized corporate workspace account or service account acting as a single repository. Each administrator manages project data directly in their private Google Drive.
* **Organizational Boundary**: While flexible and easy to deploy, there is no corporate-level folder under which all projects are grouped.

---

## 10. Security & Operational Risks

### 1. Data Loss on Employee Account Deactivation (HIGH SEVERITY)
Since folders and sheets are stored directly in individual administrators' My Drives, deactivating or deleting an employee's Google Workspace account (e.g., when they leave the organization) will cause **permanent deletion of all associated project logs and subfolder files** unless ownership is manually transferred.

### 2. Lack of Centralized Governance (MEDIUM SEVERITY)
Corporate IT cannot easily discover, audit, or restrict access to project directories because they are scattered across different individual drives.

### 3. Broad Spreadsheets Permission (MEDIUM SEVERITY)
The `spreadsheets` scope allows Q-Saudi to modify spreadsheets outside its boundary. This broad scope could trigger alerts during security compliance audits for enterprise Saudi clients.

---

## 11. Coordinated Mock Fallbacks
A major strength of the Q-Saudi integration is its **coordinated mock fallback engine**. If an OAuth token is absent (e.g., in development sandbox mode, or if popups are blocked), both client-side and server-side components degrade gracefully:
* They generate realistic, high-fidelity folder structures, spreadsheet IDs, and Google links (e.g., `https://docs.google.com/spreadsheets/d/gsheet_neom_.../edit`).
* They simulate successful provisioning responses and list authentic, localized Saudi enterprise data payloads.
* This guarantees that the application remains fully testable, demonstratable, and non-blocking under any runtime sandbox constraint.

---

## 12. Enterprise Architecture Recommendations

To transition from **Model B** to a highly-secure **Model C (Co-Owned Corporate Shared Drive Model)**, the following steps are recommended:

### Phase 1: Centralized Parent Folder / Shared Drive Configuration
Introduce a centralized Corporate Shared Drive to store all projects. This prevents corporate data loss if an employee leaves.

1. **Add Server Environment Variable**:
   Add `GOOGLE_SHARED_DRIVE_ID` (or `GOOGLE_ROOT_FOLDER_ID`) to `.env.example`.
2. **Update Project Root Folder Provisioning**:
   Configure the Project Root Folder creation inside `/server/workspace.service.ts` to include `parents: [process.env.GOOGLE_SHARED_DRIVE_ID]` and support Shared Drives by passing `supportsAllDrives: true` and `includeItemsFromAllDrives: true`.

### Phase 2: Dual User-OAuth / Service Account Provisioning
1. **User Auth for Reading/Viewing**: Keep User OAuth for client-side Spreadsheet Discovery and Drive File Picker.
2. **Service Account for Structuring**: Use a GCP Service Account to perform background folder creation and header migrations under the corporate Shared Drive. This guarantees that all directories are created uniformly and securely without administrative popup intervention.

---
**Report compiled successfully. Audit logs registered.**
