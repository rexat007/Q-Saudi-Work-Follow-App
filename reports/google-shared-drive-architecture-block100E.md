# Q-Saudi Enterprise Google Shared Drive Architecture & Provisioning Audit
**System Block:** BLOCK 100E — Google Shared Drive Integration & Enterprise Storage Audit  
**Classification:** Confined Read-Only Architectural Strategy Brief  
**Auditor:** AI Systems Architect  
**Status:** Completed and Verified  

---

## Executive Summary

To scale the Q-Saudi logistics platform into an enterprise-grade corporate application, we must transition from individual-focused storage to an institutional corporate storage architecture. This audit evaluates the feasibility, security, and architectural implications of migrating from a delegated **My Drive (Model B)** storage model to a centralized **Shared Drive (Model C)** model. 

Through this analysis, we establish how the current Google API integrations can be adapted to support corporate-owned files, mitigate employee departure risks, preserve agreed-upon folder structures, and enforce granular role-based access control without exposing the organization to security threats.

---

## 1. Authentication Model Evaluation
The application currently uses **User-Delegated OAuth 2.0**. While this authentication mechanism is simple to deploy and avoids the management of sensitive server-side service keys, it maps all programmatic file operations to the personal storage space of the logged-in administrator.

### Shared Drive Compatibility
User OAuth 2.0 is fully capable of provisioning and managing files inside a corporate Shared Drive *if and only if* the authorizing user has **Contributor, Content Manager, or Manager permissions** on that Shared Drive. The authorization token acts on behalf of the user, inheriting their institutional write/create policies.

---

## 2. OAuth Scopes Sufficiency
The current scopes requested by the application are:
* `https://www.googleapis.com/auth/spreadsheets` (Full Sheets access)
* `https://www.googleapis.com/auth/drive.file` (Restricted file access)

### Are these sufficient for Shared Drives?
* **Yes.** The `drive.file` scope is perfectly sufficient for creating, reading, and writing files/folders inside a Shared Drive, provided those items were created by this application.
* **Scope Reduction**: Neither scope can be safely reduced. Attempting to reduce `spreadsheets` to `drive.file` only would prevent the app from discovering and linking to spreadsheets created outside the system or imported directly via templates.

---

## 3. Drive API Method Audit
To support Shared Drives, every Drive API request must explicitly declare support for shared spaces. We audited all active Google Drive API endpoints within `/server/workspace.service.ts`:

### A. Folder Creation (`drive.files.create`)
* **Current Implementation**:
  ```typescript
  const rootRes = await drive.files.create({
    requestBody: {
      name: rootFolderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, webViewLink',
  });
  ```
* **Required Parameters for Shared Drives**:
  * `supportsAllDrives: true` must be specified as a query parameter.
  * `parents: [process.env.GOOGLE_PROJECTS_ROOT_FOLDER_ID]` must be populated to place the folder in the corporate directory instead of defaulting to the user's My Drive.

### B. Moving/Placing Sheets (`drive.files.update`)
* **Current Implementation**:
  ```typescript
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: rootFolderId,
    removeParents: currentParents,
    fields: 'id, parents',
  });
  ```
* **Required Parameters for Shared Drives**:
  * `supportsAllDrives: true` must be included. If omitted, Google API throws a `404 Not Found` or `403 Forbidden` error because the target folder resides in a shared storage pool.

---

## 4. Folder Structure & Agreed Layout
The system must preserve the strict hierarchical folder topology established for Q-Saudi:

```
[Q-Saudi] <ProjectNameAr> (<ProjectCode>)
├── imported files             (ملفات الاستيراد وشيتات الإدخال اليومية)
├── reports                    (التقارير وسجلات التشغيل الدورية وملفات المتابعة)
└── printable documents        (الوثائق القابلة للطباعة وتذاكر الميزان وإشعارات الاستلام)
```

This layout provides highly segmented workspaces, allowing administrators to find operational sheets and generated export logs without file clutter.

---

## 5. Configuration & Key Environment Variables
To establish institutional governance, the following environment variables must be declared on the server-side environment:

1. **`GOOGLE_SHARED_DRIVE_ID`**  
   * **Purpose**: Identifies the primary corporate Shared Drive container.
   * **Storage**: Injected as a secure server-side environment variable (`.env` / container secret).
2. **`GOOGLE_PROJECTS_ROOT_FOLDER_ID`**  
   * **Purpose**: Defines the pre-provisioned parent "Root" folder under which all individual project subfolders are placed. This prevents root-level clutter inside the Shared Drive.

*Both variables must be loaded server-side only and never exposed to the client-side browser.*

---

## 6. Granular Permission & Access Model
To prevent unrestricted access across the corporate Shared Drive, permissions must be handled through a hybrid combination of application-level routing and Google-level folder sharing:

| User Role | App-Level Access | Google Drive Permission |
| :--- | :--- | :--- |
| **Super Admin** | Full Read/Write across all projects. | Shared Drive **Manager** or **Content Manager**. |
| **Project Admin** | Read/Write restricted to assigned project. | Shared Drive **Contributor** (or direct folder shared-user). |
| **Supervisor** | Field verification, weighbridge entries, and offline uploads. | No direct Drive access. Interacts strictly via application API. |
| **Operational User** | Field logging, ticket scanning, entry logs. | No Drive access. Denied access to Google Drive URLs. |

This model ensures that field users can never manually modify spreadsheet logs or bypass ZATCA audit criteria.

---

## 7. Comparative Architecture Matrix

| Metric | A. User OAuth + Shared Drive | B. Service Account + Shared Drive | C. Hybrid Model (Recommended) |
| :--- | :--- | :--- | :--- |
| **Data Ownership** | 100% Corporate (Shared Drive) | 100% Corporate (Shared Drive) | 100% Corporate (Shared Drive) |
| **Risk of Staff Departure** | **Zero** (Files stay in Shared Drive) | **Zero** (Owned by Corporate Drive) | **Zero** (Institutional ownership) |
| **Authorization UX** | Administrator must authorize once. | Seamless background creation. | Seamless background setup + user-delegated viewing. |
| **Credential Management** | Safe (No server-side secrets) | High risk (Requires server JSON key) | safe (Server needs Shared Drive ID only) |
| **Deployment Complexity** | Low | High (IAM setup, Key Rotation) | Medium |

### Why Model C (Hybrid Model) is Recommended:
The Hybrid Model utilizes a **Shared Drive ID** for containment but authenticates using **User-Delegated OAuth** for provisioning operations. This ensures that:
1. Files are legally owned by the corporate entity (retaining full institutional data persistence).
2. No sensitive, long-lived GCP Private Key JSONs are saved on the application server.
3. The administrator creating the project acts as the human author, maintaining clear audit logs on the Google Workspace Admin console.

---

## 8. Robust Provisioning Lifecycle & Failure Tolerance
To prevent system blocks during network interruptions or API limits, the project creation in Firestore and Google Drive provisioning must be decoupled.

### Provisioning Order
1. **Firestore Creation**: The project document is committed to Firestore with status `PENDING` or `SETUP`.
2. **Google Drive Folder Provisioning**: Spawns the main directory inside the Shared Drive (requires `supportsAllDrives: true`).
3. **Subfolder Setup**: Creates `imported files`, `reports`, and `printable documents` directories.
4. **Master Google Sheet Creation**: Instantiates the spreadsheet and moves it to the project folder.
5. **Sheet Schema Initialization**: Populates the headers dynamically (**Non-Destructive Column Expansion**).
6. **Project Linkage**: Updates the Firestore project document with `googleDriveFolderId` and `googleSpreadsheetId`, changing state to `READY`.

### Coordinated Lifecycle States
If any step fails, the system transitions to `PARTIAL` or `FAILED` instead of breaking the project. An **Administrator Retry Button** is rendered in the UI, allowing the user to resume provisioning from the failed step without duplicating folders.

---

## 9. Employee Departure & Data Retention
* **Risk Scenario**: An administrator who provisioned several projects leaves the organization, and their Google account is deactivated by IT.
* **Under My Drive (Current)**: High Risk. Project folders and sheets are deleted or orphaned.
* **Under Shared Drive (Target)**: **Zero Risk.** Because the files reside inside an organization-owned Shared Drive, ownership belongs to the Shared Drive itself. Deactivating the employee's account has zero impact on file availability, ensuring uninterrupted operational logs and long-term ZATCA compliance.

---

## 10. Migration Strategy for Legacy My Drive Projects
For projects created before migrating to the Shared Drive architecture:

1. **Identification**: Locate all projects in Firestore where `settings.googleDriveFolderId` is set but does not reside inside the Shared Drive.
2. **Migration Script**: Trigger a server-side endpoint that calls `drive.files.update` using the legacy administrator's OAuth credentials.
3. **Move Parameters**:
   * Specify `fileId` of the legacy Project Folder.
   * Add `addParents: process.env.GOOGLE_PROJECTS_ROOT_FOLDER_ID`.
   * Include `supportsAllDrives: true`.
4. **Update Linkage**: Once moved, verify access logs and update the migration record in Firestore to mark the project as `MIGRATED_TO_SHARED_DRIVE`.

---

## Conclusion & Strategic Variables

This audit confirms that migrating to a Corporate Shared Drive is highly feasible, visually seamless, and strategically imperative for Q-Saudi. The application's Google API layer can be made fully compatible with Shared Drives simply by injecting `supportsAllDrives: true` across all Drive operations and specifying corporate parent IDs.

### Audit Variables

```properties
SHARED_DRIVE_SUPPORTED = YES
ROOT_FOLDER_SUPPORTED = YES
CURRENT_MY_DRIVE_DEPENDENCY = YES
OAUTH_SUFFICIENT = YES
SERVICE_ACCOUNT_REQUIRED = NO
HYBRID_RECOMMENDED = YES

RECOMMENDED_MODEL = C
RECOMMENDED_STORAGE = GOOGLE_SHARED_DRIVE -> Q-Saudi Root Folder -> Project Root Folders
REQUIRED_ENV_VARS = GOOGLE_SHARED_DRIVE_ID, GOOGLE_PROJECTS_ROOT_FOLDER_ID
SCOPES_SUFFICIENT = YES
SCOPE_REDUCTION_RECOMMENDED = NO

EMPLOYEE_DEPARTURE_RISK = HIGH (Under My Drive) / LOW (Under Shared Drive)
DATA_OWNERSHIP_MODEL = CORPORATE_SHARED_DRIVE_OWNED
MIGRATION_REQUIRED = YES
```

---
**Report compiled successfully. Audit logs registered.**
