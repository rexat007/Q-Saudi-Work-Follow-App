# BLOCK 90 — System Tools Rationalization Audit Report

**Audit Date**: September 14, 2026  
**Target Scope**: System / Developer Tools Navigation Area & Auxiliary Views  
**Compliance Constraint**: READ-ONLY AUDIT (Zero code changes, zero data changes, zero Firestore rule changes, zero i18n changes).

---

## 1. Executive Summary & Audit Status Flags

This audit evaluates the overcrowded "System / Developer Tools" drawer and navigation menu within the Q Saudi Work Follow industrial application. Currently, **13 tools** are exposed under the secondary tools drawer, leading to production-facing clutter, role ambiguity, and visual overflow issues.

The objective of Block 90 is to audit every existing tool, align its position with the recently established architecture (Blocks 86B–89B), identify high-risk administrative features, eliminate redundancy with the **Project Workspace**, and establish a clean, compact production menu structure while preserving all underlying functionality.

### Final Audit Status Flags
- `SYSTEM_TOOLS_AUDIT = PASS`
- `RATIONALIZATION_PLAN = READY`
- `CODE_CHANGED = NO`
- `DATA_CHANGED = NO`
- `I18N_CHANGED = NO`

### Key Count Summary
| Metric | Current State | Proposed Target State |
| :--- | :--- | :--- |
| Total Tools in System Menu | **13** | **5** (Production) |
| Developer-Only Tools | **0** (Exposed to Prod) | **3** (Hidden in Dev Mode) |
| Duplicate / Obsolete Tools | **0** (All active) | **5** (Merged / Retired) |
| High-Risk Admin Tools | **3** (Inadequate gating) | **3** (Strictly Role-Gated) |

---

## 2. Complete Inventory of All 13 Current System Tools

Below is the exhaustive inventory of all 13 tools currently defined under `area: 'SYSTEM_TOOLS'` in `src/services/navigation.service.ts`:

### 1. Security Audit & Compliance (`SECURITY_AUDIT`)
- **Display Name**: التدقيق الأمني والحوكمة (Security Audit) / Security Audit & Compliance
- **Route / Key**: `SECURITY_AUDIT`
- **Component**: `SecurityAuditView` (`src/components/security/SecurityAuditView.tsx`)
- **Purpose**: Evaluates system security across 16 domains, verifies RBAC enforcement, validates Firestore rules, and audits multi-tenant project isolation.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `FINANCE_AUDITOR`
- **Data Operations**: Reads Data: **YES** | Writes Data: **NO** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **YES** (Core governance tool)
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **NO**
- **Classification**: `AUDIT_COMPLIANCE`
- **Recommended Action**: **KEEP** — Reposition to top-level `AUDIT & SECURITY` menu.

### 2. Legacy Data Migration (`LEGACY_MIGRATION`)
- **Display Name**: ترحيل البيانات القديمة (Legacy Migration) / Legacy Migration
- **Route / Key**: `LEGACY_MIGRATION`
- **Component**: `LegacyMigrationView` (`src/components/legacyMigration/LegacyMigrationView.tsx`)
- **Purpose**: Processes historical legacy Excel/CSV files (20 columns), handles preview-first column mapping, and matches master entities.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** | Modifies Config: **NO** | Destructive Actions: **YES** (Can overwrite records)
- **Production Required**: **NO** (Only during initial system onboarding)
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **YES** (Overlaps with Unified Import Center)
- **Classification**: `DUPLICATE`
- **Recommended Action**: **MERGE** into `IMPORT_CENTER` (Unified Import Center). Retire standalone menu item.

### 3. Admin Console (`ADMIN_CONSOLE`)
- **Display Name**: لوحة إدارة النظام (Admin Console) / Admin Console
- **Route / Key**: `ADMIN_CONSOLE`
- **Component**: `AdminConsoleView` (`src/components/admin/AdminConsoleView.tsx`)
- **Purpose**: User account management, user registration approval gating, global role assignments, system parameters, and global pricing defaults.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** | Modifies Config: **YES** | Destructive Actions: **YES** (Can reject users / alter global rates)
- **Production Required**: **YES** (System Admin area)
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **YES** (User approval status handled in Block 86B; project pricing/roster handled in Project Workspace)
- **Classification**: `HIGH_RISK`
- **Recommended Action**: **ROLE_GATE** — Keep in `SYSTEM ADMIN` for `SUPER_ADMIN` user approvals & system config. Move project roster/pricing to Project Workspace.

### 4. Trip Engine FSM Simulator (`TRIP_ENGINE`)
- **Display Name**: محرك الرحلات وآلة الحالة (Trip Engine) / Trip Engine FSM
- **Route / Key**: `TRIP_ENGINE`
- **Component**: `TripEngineView` (`src/components/TripEngineView.tsx`)
- **Purpose**: Tests state machine transition rules (6 rules), simulates manual state movements, and verifies counter sequence logic.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `SUPERVISOR`, `DISPATCHER`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** (Creates test trips) | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **NO** (Debug simulator)
- **Developer / Debug Only**: **YES**
- **Overlaps Production Feature**: **YES** (Production trip operations occur in Field Operations / Loading & Unloading stations)
- **Classification**: `DEVELOPER_ONLY`
- **Recommended Action**: **DEVELOPER_ONLY** — Move to Developer-Only menu for `SUPER_ADMIN` in debug mode.

### 5. Google Workspace Integration (`WORKSPACE_INTEGRATION`)
- **Display Name**: تكامل Google Workspace (Sheets & Drive) / Google Workspace Integration
- **Route / Key**: `WORKSPACE_INTEGRATION`
- **Component**: `WorkspaceIntegrationView` (`src/components/workspace/WorkspaceIntegrationView.tsx`)
- **Purpose**: Configures OAuth 2.0 integration with Google Sheets & Drive for automated report projection and backup synchronization.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** | Modifies Config: **YES** | Destructive Actions: **NO**
- **Production Required**: **YES**
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **YES** (Already fully embedded inside `ProjectWorkspaceView` Tab 'GOOGLE')
- **Classification**: `DUPLICATE`
- **Recommended Action**: **MOVE** — Fully transition to `ProjectWorkspaceView` Tab 'GOOGLE' and retire standalone system tool entry.

### 6. Field Exception Engine (`EXCEPTION_ENGINE`)
- **Display Name**: محرك الاستثناءات (Exception Engine) / Exception Engine
- **Route / Key**: `EXCEPTION_ENGINE`
- **Component**: `ExceptionEngineView` (`src/components/exceptions/ExceptionEngineView.tsx`)
- **Purpose**: Tracks, reviews, and resolves field weight variances, site disputes, and automated financial deductions across 12 exception types.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `SUPERVISOR`, `SITE_SUPERVISOR`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **YES**
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **NO** (Primary exception handling module)
- **Classification**: `OPERATIONS_SUPPORT`
- **Recommended Action**: **KEEP** — Maintain in `OPERATIONS SUPPORT` for field supervisors and admins.

### 7. Unified Import Center (`IMPORT_CENTER`)
- **Display Name**: مركز الاستيراد الموحد (Import Center) / Unified Import Center
- **Route / Key**: `IMPORT_CENTER`
- **Component**: `ImportCenterView` (`src/components/importCenter/ImportCenterView.tsx`)
- **Purpose**: Executes 12-stage batch data import pipeline for drivers, trucks, weighbridge scale logs, and entity resolution.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** | Modifies Config: **NO** | Destructive Actions: **YES** (Bulk batch creation/update)
- **Production Required**: **YES**
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **YES** (Overlaps with Legacy Migration)
- **Classification**: `OPERATIONS_SUPPORT`
- **Recommended Action**: **KEEP** — Single production ingestion tool under `OPERATIONS SUPPORT`.

### 8. Data Quality Engine (`DATA_QUALITY`)
- **Display Name**: محرك جودة البيانات (Data Quality) / Data Quality Engine
- **Route / Key**: `DATA_QUALITY`
- **Component**: `DataQualityView` (`src/components/quality/DataQualityView.tsx`)
- **Purpose**: 8-stage data quality pipeline analyzing duplicate trip entries, weighbridge scale discrepancies, and statistical anomalies.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`
- **Data Operations**: Reads Data: **YES** | Writes Data: **YES** | Modifies Config: **NO** | Destructive Actions: **YES** (Batch cleanup / record purging)
- **Production Required**: **YES**
- **Developer / Debug Only**: **NO**
- **Overlaps Production Feature**: **NO**
- **Classification**: `OPERATIONS_SUPPORT`
- **Recommended Action**: **KEEP** — Position in `OPERATIONS SUPPORT` with strict purge role gating.

### 9. Pricing Engine & Tests (`PRICING_ENGINE`)
- **Display Name**: محرك التسعير والعقود (Pricing Engine) / Pricing Engine & Tests
- **Route / Key**: `PRICING_ENGINE`
- **Component**: `PricingEngineView` (`src/components/pricing/PricingEngineView.tsx`)
- **Purpose**: Tests tariff formulas, pricing snapshots, VAT calculations, and runs 9 automated pricing test cases.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `FINANCE_AUDITOR`
- **Data Operations**: Reads Data: **YES** | Writes Data: **NO** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **NO** (Formula test runner)
- **Developer / Debug Only**: **YES**
- **Overlaps Production Feature**: **YES** (Active tariff configuration belongs in Project Workspace / Admin Console)
- **Classification**: `DEVELOPER_ONLY`
- **Recommended Action**: **DEVELOPER_ONLY** — Relegate to Developer-Only test suite.

### 10. Firestore Architecture View (`FIRESTORE_ARCH`)
- **Display Name**: معمارية Firestore (13 نطاقاً) / Firestore Architecture
- **Route / Key**: `FIRESTORE_ARCH`
- **Component**: `FirestoreArchitectureView` (`src/components/architecture/FirestoreArchitectureView.tsx`)
- **Purpose**: Visualizes collection domain schemas across 13 domains, Firestore security rules, and indexing requirements.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `VIEWER`
- **Data Operations**: Reads Data: **NO** | Writes Data: **NO** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **NO** (Static reference)
- **Developer / Debug Only**: **YES**
- **Overlaps Production Feature**: **YES** (Duplicated by Architecture Docs)
- **Classification**: `DUPLICATE`
- **Recommended Action**: **RETIRE** — Consolidate schema view into `DOCS` (`database.md`) under Developer-Only area.

### 11. Entity Relations Network (`RELATIONS`)
- **Display Name**: شبكة العلاقات (11 كياناً) / Entity Relations Network
- **Route / Key**: `RELATIONS`
- **Component**: Embedded in `App.tsx`
- **Purpose**: Interactive network diagram displaying 11 core system entities and foreign key constraints.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `SUPERVISOR`, `VIEWER`
- **Data Operations**: Reads Data: **NO** | Writes Data: **NO** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **NO** (Static diagram)
- **Developer / Debug Only**: **YES**
- **Overlaps Production Feature**: **YES** (Duplicated by Architecture Docs)
- **Classification**: `DUPLICATE`
- **Recommended Action**: **RETIRE** — Consolidate into `DOCS` (`architecture.md`) under Developer-Only area.

### 12. The 12 Invariant Principles (`PRINCIPLES`)
- **Display Name**: المبادئ الـ 12 الإلزامية (The 12 Invariants) / The 12 Invariant Principles
- **Route / Key**: `PRINCIPLES`
- **Component**: Embedded in `App.tsx`
- **Purpose**: Static document detailing the 12 non-negotiable governance and technical invariants (SSOT, Server Authority, Multi-tenant Isolation).
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `VIEWER`
- **Data Operations**: Reads Data: **NO** | Writes Data: **NO** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **NO** (Static text)
- **Developer / Debug Only**: **YES**
- **Overlaps Production Feature**: **YES** (Duplicated by Architecture Docs)
- **Classification**: `DUPLICATE`
- **Recommended Action**: **RETIRE** — Consolidate into `DOCS` (`governance.md`) under Developer-Only area.

### 13. Architecture Specs & Docs (`DOCS`)
- **Display Name**: المستندات المعمارية والمواصفات (Docs) / Architecture Specs & Docs
- **Route / Key**: `DOCS`
- **Component**: Embedded in `App.tsx` (using `ReactMarkdown`)
- **Purpose**: Reader for 7 production specification markdown files covering architecture, database, security, offline outbox, and governance.
- **Current Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `SUPERVISOR`, `SITE_SUPERVISOR`, `DISPATCHER`, `SCALE_OPERATOR`, `FINANCE_AUDITOR`, `VIEWER`
- **Data Operations**: Reads Data: **NO** | Writes Data: **NO** | Modifies Config: **NO** | Destructive Actions: **NO**
- **Production Required**: **NO** (Technical spec reader)
- **Developer / Debug Only**: **YES**
- **Overlaps Production Feature**: **YES** (Consolidates `FIRESTORE_ARCH`, `RELATIONS`, and `PRINCIPLES`)
- **Classification**: `DEVELOPER_ONLY`
- **Recommended Action**: **DEVELOPER_ONLY** — Single unified documentation viewer in Developer-Only mode.

---

## 3. Architectural Alignment Matrix (Blocks 86B–89B)

The current system state reflects four major structural architectural milestones:
1. **Block 86B**: Strict Server-Authoritative Account Status Gating (`UNAUTHENTICATED`, `PENDING_APPROVAL`, `ACTIVE`, `REJECTED`) & Super Admin Approval Workflow.
2. **Block 86C**: Server-Authoritative Counter Sequences (`systemCounters/tripNumber_{projectId}`) & Client Read-Only UUID Idempotency.
3. **Block 86D / 87**: Integrated Project Setup & Roster Management (Carriers, Drivers, Trucks, Materials, Pricing Rules).
4. **Block 88 / 89B**: Project Workspace Unified Dashboard (`ProjectWorkspaceView`) with dedicated tabs for Overview, Roster, Drivers/Trucks, Materials, Pricing, Access Control, and Google Workspace Integration.

### Alignment Decisions
- **Standalone `WORKSPACE_INTEGRATION`**: Redundant because `ProjectWorkspaceView` Tab 'GOOGLE' now serves as the project-centric location for Sheets & Drive export. **Recommendation**: Move entirely to Project Workspace and retire standalone entry.
- **Standalone Master Data / Roster in `ADMIN_CONSOLE`**: Redundant because `ProjectWorkspaceView` Tabs 'ROSTER', 'DRIVERS_TRUCKS', and 'PRICING' manage project-specific resources. **Recommendation**: Limit `ADMIN_CONSOLE` strictly to system-wide account approvals and global parameters.
- **`LEGACY_MIGRATION` vs `IMPORT_CENTER`**: Redundant because `IMPORT_CENTER` provides the 12-stage unified batch pipeline. **Recommendation**: Merge legacy file parser into `IMPORT_CENTER` and retire the duplicate route.
- **Static Diagnostic Views (`FIRESTORE_ARCH`, `RELATIONS`, `PRINCIPLES`)**: Redundant because `DOCS` renders complete markdown specifications. **Recommendation**: Merge static views into `DOCS` in Developer-Only mode.

---

## 4. Proposed Compact Production Menu Structure

To eliminate clutter in production while maintaining operational readiness, the production navigation should be reorganized into 4 clear, non-overlapping categories:

```
├── 1. SYSTEM ADMIN
│   ├── User Account Approvals (ADMIN_CONSOLE)
│   └── System Parameters & Config (ADMIN_CONSOLE)
│
├── 2. AUDIT & SECURITY
│   ├── Security Audit & Compliance (SECURITY_AUDIT)
│   └── System Audit Logs (ADMIN_CONSOLE / Security Log)
│
├── 3. OPERATIONS SUPPORT
│   ├── Unified Import Center (IMPORT_CENTER)
│   ├── Field Exception Engine (EXCEPTION_ENGINE)
│   ├── Data Quality & Deduplication (DATA_QUALITY)
│   └── Outbox & Sync Health Monitor (OutboxDrawer / Header Pill)
│
└── 4. DEVELOPER ONLY (Hidden behind Dev Mode toggle for SUPER_ADMIN)
    ├── Trip Engine FSM Simulator (TRIP_ENGINE)
    ├── Pricing Engine Test Suite (PRICING_ENGINE)
    └── Architecture Specs & Documentation (DOCS)
```

---

## 5. High-Risk Tool Audit & Role Gating Plan

Three tools in the system menu possess write, configuration modification, or destructive batch capability:

| Tool ID | High-Risk Capabilities | Risk Level | Proposed Role Gating Plan |
| :--- | :--- | :--- | :--- |
| **`ADMIN_CONSOLE`** | Role modification, approving/rejecting user accounts, setting global pricing defaults, changing system parameters. | **CRITICAL** | Limit user approval & role changes exclusively to `SUPER_ADMIN`. Limit `PROJECT_ADMIN` to project member status views. |
| **`IMPORT_CENTER`** | Batch creation and overwriting of driver profiles, truck records, carriers, and weighbridge logs in Firestore. | **HIGH** | Require `SUPER_ADMIN` or `PROJECT_ADMIN` with mandatory dry-run validation preview step before commit. |
| **`DATA_QUALITY`** | Batch record purging, automated deduplication, and flagging anomalous trip records. | **HIGH** | Restrict destructive batch purge actions strictly to `SUPER_ADMIN` with mandatory Firestore audit trail logging. |

---

## 6. Project Workspace Migration Plan

Features previously scattered across administrative tools have been consolidated into `ProjectWorkspaceView` (Block 88):

| Feature / Domain | Legacy System Location | Target Project Workspace Tab | Rationalization Action |
| :--- | :--- | :--- | :--- |
| Google Workspace (Sheets/Drive) | `WORKSPACE_INTEGRATION` | **Tab 'GOOGLE'** | Retire standalone system tool entry. |
| Project Roster & Carrier Contracts | `ADMIN_CONSOLE` / `MASTER_DATA` | **Tab 'ROSTER'** | Manage within Project Workspace context. |
| Project Tariff & Pricing Rules | `ADMIN_CONSOLE` / `PRICING_ENGINE` | **Tab 'PRICING'** | Manage within Project Workspace context. |
| Driver & Truck Registrations | `MASTER_DATA` | **Tab 'DRIVERS_TRUCKS'** | Manage within Project Workspace context. |
| Project Role Assignments | `ADMIN_CONSOLE` | **Tab 'ACCESS'** | Scope project access within Project Workspace. |

---

## 7. Security & Compliance Icon Resolution

### Issue Description
Currently, the "Security & Compliance" (`SECURITY_AUDIT`) tool shares the `ShieldCheck` icon with the top-level `SYSTEM_TOOLS` primary area container and several status badges. In the collapsed sidebar and mobile navigation drawer, the trigger button layout lacks boundary constraints, causing the icon to render outside its intended container frame.

### Recommended Resolution
1. **Location**: Move `SECURITY_AUDIT` out of the secondary "System Tools" drawer into a dedicated top-level **AUDIT & SECURITY** menu item in the primary sidebar.
2. **Authorized Roles**: `SUPER_ADMIN`, `PROJECT_ADMIN`, `FINANCE_AUDITOR`.
3. **Visibility Type**: Standard visible production-facing tool (not hidden inside a developer drawer).
4. **Visual Layout Fix**: Isolate the trigger icon inside a fixed `w-8 h-8` flexbox container with `shrink-0` and explicit padding boundary constraints (`p-1.5 rounded-lg bg-stone-800`), preventing visual overflow in collapsed states.

---

## 8. Role Visibility Matrix across all 9 System Roles

Below is the definitive visibility matrix for the 5 target production tools across all 9 authoritative system roles:

| Role | System Admin (`ADMIN_CONSOLE`) | Audit & Security (`SECURITY_AUDIT`) | Field Exceptions (`EXCEPTION_ENGINE`) | Unified Import (`IMPORT_CENTER`) | Data Quality (`DATA_QUALITY`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`SUPER_ADMIN`** | **FULL** | **FULL** | **FULL** | **FULL** | **FULL** |
| **`PROJECT_ADMIN`** | **LIMITED** (Project users) | **FULL** | **FULL** | **FULL** | **FULL** |
| **`SUPERVISOR`** | *HIDDEN* | *HIDDEN* | **FULL** | *HIDDEN* | *HIDDEN* |
| **`SITE_SUPERVISOR`** | *HIDDEN* | *HIDDEN* | **FULL** | *HIDDEN* | *HIDDEN* |
| **`DISPATCHER`** | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* |
| **`SCALE_OPERATOR`** | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* |
| **`FINANCE_AUDITOR`** | *HIDDEN* | **FULL** (Read-Only) | *HIDDEN* | *HIDDEN* | *HIDDEN* |
| **`DRIVER`** | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* |
| **`VIEWER`** | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* | *HIDDEN* |

*Note*: Developer-Only tools (`TRIP_ENGINE`, `PRICING_ENGINE`, `DOCS`) are hidden for all roles in production and only accessible to `SUPER_ADMIN` when explicitly enabling Developer Mode.

---

## 9. Summary & Verification Flags

- **Audit Completion**: All 13 system tools fully inventoried, classified, and mapped.
- **Architectural Alignment**: Confirmed against Blocks 86B, 86C, 86D, 87, 88, and 89B.
- **System Impact**: ZERO code edits, ZERO schema changes, ZERO i18n count changes (AR=1,128, EN=1,128, UR=1,128 preserved).
- **Report Artifacts Generated**:
  - `/reports/system-tools-rationalization-block90.json`
  - `/reports/system-tools-rationalization-block90.md`
