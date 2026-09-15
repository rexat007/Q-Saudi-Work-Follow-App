# BLOCK 100 — PROJECT CREATION UNDEFINED FIELD FORENSIC AUDIT

**Timestamp:** 2026-09-15T05:18:11-07:00  
**Audit Objective:** Trace and analyze why `settings.googleDriveFolderId` becomes `undefined` during project creation, resulting in the Firestore failure `Unsupported field value: undefined`.  
**Execution Mode:** READ-ONLY (No modifications to code, data, or deployment).

---

## Forensic Variable Dashboard

```ini
PROJECT_CREATED = NO
PROJECT_CODE = Q-PRJ-001
GOOGLE_DRIVE_FIELD_SOURCE = data.googleDrive.enabled ? (data.googleDrive.generatedFolderId || ...) : undefined
GOOGLE_DRIVE_FIELD_REQUIRED = NO
GOOGLE_DRIVE_FIELD_CONTRACT = OMIT
PROJECT_CREATION_PAYLOAD_HAS_UNDEFINED = YES
OTHER_UNDEFINED_FIELDS = settings.googleSpreadsheetId, settings.googleDriveProvisioning.rootFolderName, settings.googleDriveProvisioning.spreadsheetTitle, pricing_rules.carrierId, pricing_rules.materialId, pricing_rules.effectiveTo
COUNTER_CONSUMED_ON_FAILURE = YES
GOOGLE_PROVISIONING_ORDER = ON_DEMAND_OR_DURING_CREATION_IF_ENABLED
ROOT_CAUSE = The Firestore JS SDK throws "Unsupported field value: undefined" when writing an object with properties explicitly set to undefined (such as settings.googleDriveFolderId and settings.googleSpreadsheetId when Google Drive is disabled). Since Firestore is initialized using getFirestore() without ignoreUndefinedProperties: true, the local validation fails and aborts the creation before sending any write request to the server, while the project number generator transaction has already executed and consumed Q-PRJ-001.
REQUIRED_FIX = Initialize Firestore with initializeFirestore(app, { ignoreUndefinedProperties: true }) in src/firebase/config.ts, and ensure the project provisioning service recursively strips undefined properties or defaults optional/empty fields to null.
CODE_CHANGED = NO
DATA_CHANGED = NO
DEPLOYMENT_CHANGED = NO
```

---

## 1. Trace of the Project Creation Flow

The logical sequence of project creation and subsequent SDK validation crash operates as follows:

1. **Project Setup UI**: 
   - The user opens the Project Setup Wizard and completes Steps 1 through 7.
   - In Step 6 (`Step6GoogleDrive.tsx`), "Google Drive Integration" is set to disabled (`enabled: false`).
   - The user clicks the final `"تأسيس المشروع"` (Provision Project) button in Step 7, which triggers the `handleProvision` handler inside `ProjectSetupWizard.tsx`.
   - This invokes `projectProvisioningService.provisionProject(wizardData, context)`.

2. **Project Provisioning Service**:
   - `provisionProject` gets called inside `src/services/projectProvisioning.service.ts`.
   - It performs an asynchronous transactional increment on the Firestore counter document `systemCounters/projectNumber` via `ProjectNumberGenerator.getNextProjectNumber()`.
   - This transaction successfully completes on the Firestore server and increments the counter (allocating sequence number `1` / code `Q-PRJ-001`).
   - The code then computes:
     ```typescript
     const driveFolderId = data.googleDrive.enabled
       ? data.googleDrive.generatedFolderId || `gdrive-${projectId.toLowerCase()}-${Date.now().toString(36)}`
       : undefined; // Resolves to undefined
     ```
   - It constructs the `projectPayload` containing the nested settings block:
     ```typescript
     settings: {
       ...
       googleDriveFolderId: driveFolderId, // Explicit undefined
       googleSpreadsheetId: spreadsheetId, // Explicit undefined
       googleDriveProvisioning: {
         enabled: data.googleDrive.enabled,
         rootFolderName: data.googleDrive.rootFolderName, // Can be undefined or empty
         spreadsheetTitle: data.googleDrive.spreadsheetTitle, // Can be undefined or empty
         status: 'DISABLED',
       }
     }
     ```
   - It calls `projectRepository.create(projectPayload)`.

3. **Project Repository & API**:
   - `projectRepository.create` receives the payload containing properties with the value `undefined`.
   - It invokes the standard Firebase Web JS SDK method `setDoc(doc(db, 'projects', 'Q-PRJ-001'), payload)`.

4. **Firestore Web SDK Local Validation**:
   - The Firestore SDK recursive parser checks all values in the payload before attempting serialization.
   - It discovers nested values of type `undefined` at `settings.googleDriveFolderId` and `settings.googleSpreadsheetId`.
   - Since the Firestore client instance was initialized via `getFirestore(app)` without `ignoreUndefinedProperties: true`, the SDK throws a local Javascript error:
     `Function setDoc() called with invalid data. Unsupported field value: undefined found in: settings.googleDriveFolderId`
   - **Local Halt**: The SDK throws immediately, aborting the write operation. No network request for project creation is ever transmitted to the Firestore server.

---

## 2. Project Schema & Type Investigation

The project settings schema is declared in `src/types/entities.ts`:
```typescript
export interface ProjectEntity extends BaseAuditedEntity {
  ...
  settings: {
    zatcaTaxNumber: string;
    vatRatePercent: number;
    googleDriveFolderId?: string;    // Optional field (TypeScript allow-undefined)
    googleSpreadsheetId?: string;    // Optional field (TypeScript allow-undefined)
    allowDriverSelfDispatch: boolean;
    currency?: string;
    requireTareOnExit?: boolean;
    maxToleranceKg?: number;
    googleDriveProvisioning?: {
      enabled: boolean;
      rootFolderName?: string;
      spreadsheetTitle?: string;
      status?: 'PROVISIONED' | 'DISABLED';
    };
  };
}
```

* **Observation**: In TypeScript, adding `?` to a property permits its value to be `undefined`. However, raw Firestore does not support serialization of `undefined` field values.
* **Intended Contract**: **OMIT**. Optional fields in Firestore documents should either be omitted from the object keys completely until they are provisioned or securely set to `null` (or stripped of undefined properties recursively before serialization). 

---

## 3. Google Drive Provisioning Flow & Timing

The Google Drive & Sheets integration is designed to be **optional and on demand**:
- If enabled during wizard-driven creation, visual placeholders are initialized, and a `syncOperation` is written to queue synchronization.
- If disabled, the fields remain unpopulated.
- The user can later authorize Google Workspace and provision the folders/sheets on demand by navigating to the **Workspace Integration View** (`WorkspaceIntegrationView.tsx`) and clicking `"تهيئة Google Drive للمشروع"`. This updates the existing project document in Firestore with `googleDriveFolderId` and `googleSpreadsheetId` fields.

---

## 4. Other Potential Undefined Crash Vectors

In addition to `googleDriveFolderId`, several other fields in the wizard provisioning payloads can become `undefined` and cause identical local Firestore validation failures:

1. **Pricing Rules Payloads**:
   ```typescript
   carrierId: rule.carrierId === 'ALL' ? undefined : rule.carrierId,
   materialId: rule.materialId === 'ALL_MATERIALS' ? undefined : rule.materialId,
   effectiveTo: rule.effectiveTo || undefined,
   ```
   If a pricing rule is configured for "All Carriers" or "All Materials", `carrierId` or `materialId` is explicitly set to `undefined`. If a pricing rule has no end date, `effectiveTo` is explicitly set to `undefined`. Writing these rules to Firestore will trigger a crash.
2. **Google Drive Settings**:
   `settings.googleDriveProvisioning.rootFolderName` and `settings.googleDriveProvisioning.spreadsheetTitle` can become `undefined` if not entered and not initialized to default values.

---

## 5. Live State Proofs & Sequence Impact

- **Did `Q-PRJ-001` get created in Firestore?**  
  **NO**. Because the `Unsupported field value: undefined` error is thrown by the SDK locally on the client before the payload is ever transmitted across the network, the project document `projects/Q-PRJ-001` was never successfully written to Firestore.
- **Did the failed attempt consume the sequence counter?**  
  **YES**. The transactional call to `ProjectNumberGenerator.getNextProjectNumber()` runs and successfully updates the counter document `systemCounters/projectNumber` *before* the project payload is built and written. This means the counter document was successfully incremented to `2` on the Firestore server, leaving sequence `1` (`Q-PRJ-001`) consumed and creating a gap in sequences.

---

## 6. Recommended Correction Action Plan

To resolve this issue completely and make the application robust, the following corrections are recommended:

1. **Enable `ignoreUndefinedProperties: true` (Recommended System-Wide Fix)**:
   In `src/firebase/config.ts`, initialize Firestore with the explicit configuration to ignore undefined values:
   ```typescript
   import { initializeFirestore } from 'firebase/firestore';
   export const db = initializeFirestore(app, {
     ignoreUndefinedProperties: true
   }, normalizedFirebaseConfig.firestoreDatabaseId);
   ```
2. **Safe Payload Omission / Sanitization**:
   In `src/services/projectProvisioning.service.ts` or in the repositories, sanitize payloads before they are passed to the Firestore SDK by stripping keys with `undefined` values recursively:
   ```typescript
   function cleanUndefined<T>(obj: T): T {
     return JSON.parse(JSON.stringify(obj, (key, value) => {
       return value === undefined ? null : value; // or omit entirely
     }));
   }
   ```

---

*Verified automatically by Q-Saudi Work Follow Verification System.*
