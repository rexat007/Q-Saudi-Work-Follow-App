# BLOCK 100H — Project Creation Status Validation Forensic Audit Report

**Date:** 2026-09-15  
**Mode:** READ-ONLY FORENSIC AUDIT  
**Scope:** Trace and audit project creation validation failure (`"خطأ في التحقق من صحة المشروع: حالة المشروع غير صالحة"`)

---

## Executive Summary

A forensic trace of the Project Setup creation workflow was conducted. The audit identified the exact root cause for the creation error:

1. **The Submitted Value:** The newly rebuilt Project Setup UI (`ProjectSetupWizard.tsx`, line 249) submits `status: 'SETUP'` for Phase 1 Foundation creation.
2. **The Validator Discrepancy:** `ProjectService.createProject` delegates payload validation to `ProjectValidator.validate` (`src/validators/project.validator.ts`, line 33), which contains a legacy hardcoded array check:
   ```typescript
   if (!project.status || !['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(project.status))
   ```
   While `ProjectEntity` (`src/types/entities.ts`, line 41) defines 8 lifecycle states (`'DRAFT' | 'SETUP' | 'READY_FOR_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'PLANNING'`), `ProjectValidator.validate` rejects `'SETUP'` (and `'DRAFT'`, `'READY_FOR_REVIEW'`, `'APPROVED'`) as an invalid status.
3. **Sequence Counter Side-Effect:** In `ProjectService.createProject`, `ProjectNumberGenerator.getNextProjectNumber()` is executed *before* `ProjectValidator.validate()` is called. Consequently, when validation fails, the sequence counter has already been incremented, consuming a project sequence number without persisting a project document.

No code, database, or deployment modifications were made during this audit.

---

## Tracing Matrix & Forensic Findings

### 1. Payload & Trace Verification
- **UI Payload Source:** `src/components/wizard/ProjectSetupWizard.tsx` (line 249)
  - `status: 'SETUP' as any`
- **Execution Chain:**
  1. User submits Phase 1 Foundation form in `ProjectSetupWizard.tsx`.
  2. `ProjectSetupWizard.tsx` constructs payload with `status: 'SETUP'` and calls `projectService.createProject(payload, authContext)`.
  3. `ProjectService.createProject` calls `ProjectNumberGenerator.getNextProjectNumber()` (incrementing the counter).
  4. `ProjectService.createProject` constructs `newProject` with `projectId` = `serverProjectCode` and calls `ProjectValidator.validate(newProject)`.
  5. `ProjectValidator.validate` checks `['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes('SETUP')` -> returns `isValid: false` with error message `"حالة المشروع غير صالحة"`.
  6. `ProjectService.createProject` throws `Error("خطأ في التحقق من صحة المشروع: حالة المشروع غير صالحة")`.

### 2. Status Schema Alignment Analysis
| Schema / Component | Allowed Status Values | Evaluates 'SETUP' As |
| :--- | :--- | :--- |
| **`ProjectEntity` Schema** (`src/types/entities.ts`) | `DRAFT`, `SETUP`, `READY_FOR_REVIEW`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`, `PLANNING` | **VALID** |
| **Project Provisioning Validator** (`src/validators/projectProvisioning.validator.ts`) | Requires non-empty string | **VALID** |
| **Domain Project Validator** (`src/validators/project.validator.ts`) | `ACTIVE`, `SUSPENDED`, `ARCHIVED` | **INVALID (REJECTED)** |

### 3. Lifecycle Alignment (BLOCK 100B/C)
- Intended initial lifecycle state after Phase 1 Foundation creation: `SETUP`.
- Progressive lifecycle transitions: `DRAFT` ➔ `SETUP` ➔ `READY_FOR_REVIEW` ➔ `APPROVED` ➔ `ACTIVE`.

### 4. Client Requirement & Sequence Counter Audit
- **Client Identifier Requirements:** `projectCode` and `projectNumber` are **NOT** required from the client. The client sends placeholder values (`TEMP_GENERATE` / `0`), which are safely ignored and overridden by server generation.
- **BLOCK 99 Server Generation:** Intact in `ProjectNumberGenerator.ts`.
- **Sequence Consumption on Validation Failure:** **YES**. Because `ProjectNumberGenerator.getNextProjectNumber()` is called on line 28 of `ProjectService.createProject` prior to calling `ProjectValidator.validate` on line 44, a failed validation increments the sequence counter.

---

## Audit Variables

- **`SUBMITTED_STATUS`** = `"SETUP"`
- **`VALID_STATUS_VALUES`** = `["ACTIVE", "SUSPENDED", "ARCHIVED"]` *(in `project.validator.ts`)* vs `["DRAFT", "SETUP", "READY_FOR_REVIEW", "APPROVED", "ACTIVE", "SUSPENDED", "ARCHIVED", "PLANNING"]` *(in `ProjectEntity`)*
- **`STATUS_VALIDATION_LAYER`** = `"src/validators/project.validator.ts (ProjectValidator.validate line 33)"`
- **`ROOT_CAUSE`** = `"The Project Setup UI (ProjectSetupWizard.tsx line 249) submits status: 'SETUP' as designed for Phase 1 Foundation setup. However, projectService.createProject delegates domain validation to ProjectValidator.validate(), which contains a legacy hardcoded array check (src/validators/project.validator.ts line 33) that only accepts ['ACTIVE', 'SUSPENDED', 'ARCHIVED']. Since 'SETUP' is missing from the whitelist, validation fails with 'حالة المشروع غير صالحة'. Furthermore, ProjectService.createProject calls ProjectNumberGenerator.getNextProjectNumber() before validation, causing failed validation attempts to consume project sequence numbers."`
- **`CORRECT_INITIAL_STATUS`** = `"SETUP"`
- **`PROJECT_CODE_CLIENT_REQUIRED`** = `"NO"`
- **`PROJECT_NUMBER_CLIENT_REQUIRED`** = `"NO"`
- **`SERVER_GENERATION_INTACT`** = `"YES"`
- **`COUNTER_CONSUMED_ON_FAILED_VALIDATION`** = `"YES"`
- **`CURRENT_PROJECT_SEQUENCE`** = `"Sequence counter is incremented in Firestore/memory during getNextProjectNumber() prior to validation execution"`
- **`OTHER_PHASE1_VALIDATION_ISSUES`** = `[]`
- **`REQUIRED_FIX`** = `"1) Update src/validators/project.validator.ts line 33 to accept all valid ProjectEntity status lifecycle values: ['DRAFT', 'SETUP', 'READY_FOR_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PLANNING']. 2) In src/services/project.service.ts, perform payload validation before invoking ProjectNumberGenerator.getNextProjectNumber() to prevent sequence number exhaustion on invalid validation requests."`
- **`CODE_CHANGED`** = `"NO"`
- **`DATA_CHANGED`** = `"NO"`
- **`DEPLOYMENT_CHANGED`** = `"NO"`
