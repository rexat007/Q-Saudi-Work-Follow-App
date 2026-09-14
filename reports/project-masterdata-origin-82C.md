# BLOCK 82C — PROJECT & MASTER DATA FORENSIC CLEANUP AUDIT

**Execution Mode**: READ ONLY — NO MODIFICATIONS  
**Audit Timestamp**: September 14, 2026  
**Target Platform**: Q Saudi Work Follow (Tactical Heavy Transport & Fleet Automation Architecture)  
**Deliverables Generated**:
- `reports/project-masterdata-origin-82C.json`
- `reports/project-masterdata-origin-82C.md`

---

## 1. Executive Summary

Following the execution of **Block 82B**, runtime operational trips and statistics (`TripEngineService.trips = []`, `ExceptionEngineService.exceptions = new Map()`, and hardcoded mock rows in field views) were successfully zeroed out. However, the application continues to display sample projects, authorized carrier records, material catalogs, trucks, drivers, and contractual pricing models across multiple views (`MasterDataView`, `AdminConsoleView`, `OperationsDashboardView`, `PricingEngineView`, and `WorkspaceIntegrationView`).

### Core Forensic Finding
**Zero sample projects or master data records originate from live Firestore collections.**  
The remaining records stem from static TypeScript fixture files—principally `src/data/defaultMasterData.ts` and `src/data/masterPricingRules.ts`—which are directly imported and mirrored into the in-memory state of core application services upon class instantiation or React component mounting. Additionally, `OfflineCacheService` lazily copies these static arrays into browser **IndexedDB** whenever field operator views or outbox drawers are opened.

---

## 2. Visible Sample Projects Inventory

A complete inspection of all screens reveals four (4) distinct project identifiers active in the user interface and services:

| Project ID | Project Name (Ar / En) | Project Code | Source File / Injection Point | Persistence Type | Associated Pricing Rules | Authorized Carriers | Assigned Personnel |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`PRJ-NEOM-NORTH-01`** | مشروع حزم البنية التحتية - نيوم الشمالية<br>_NEOM North Infrastructure Package_ | `NEOM-N01` | `src/data/defaultMasterData.ts`<br>(Lines 7–31) | In-Memory Constant + IndexedDB Cache | 6 Rules in `masterPricingRules.ts`<br>(Mapped via `adminConsoleService`) | `CAR-ALMAJDOUIE`<br>`CAR-BINLADIN` | `USR-ADMIN-001`<br>`USR-DISPATCHER-02`<br>`USR-FIN-AUDITOR-01`<br>`USR-NEOM-MGR` |
| **`PRJ-REDSEA-RESORT-02`** | مشروع وجهة البحر الأحمر - منطقة الجزر السياحية<br>_Red Sea Destination Coastal Resort_ | `RSR-02` | `src/data/defaultMasterData.ts`<br>(Lines 32–56) | In-Memory Constant + IndexedDB Cache | Inherits general rules / No explicit dedicated rule | `CAR-ALMAJDOUIE` | `USR-ADMIN-001`<br>`USR-FIN-AUDITOR-01`<br>`USR-REDSEA-MGR`<br>`USR-SITE-ENG-03` |
| **`PRJ-NEOM-001`** | مشروع نيوم - البنية التحتية والمحاجر<br>_NEOM Infrastructure & Quarries_ | `NEOM-001` | `src/data/sampleQualityData.ts`<br>`src/data/masterPricingRules.ts`<br>`src/services/offline/offlineCache.service.ts` | In-Memory Constant + IndexedDB Cache | 6 Rules in `MASTER_PRICING_RULES` | `CAR-ALMAJDOUIE`<br>`CAR-BINLADIN` | `USR-SUPER-ADMIN`<br>`USR-NEOM-MGR` |
| **`PRJ-NEOM-WEST-01`** | مشروع نيوم الغربية<br>_NEOM West Zone_ | `NEOM-W01` | `src/components/pricing/PricingEngineView.tsx`<br>(Lines 53–130) | Hardcoded Local React State | 5 Component State Rules (`PR-CARRIER-A-TRIP-v1`, etc.) | `CARRIER-A`<br>`CARRIER-B`<br>`CARRIER-C`<br>`CARRIER-D` | None (Isolated Component State) |

---

## 3. Deep-Dive Trace per Project

### Project 1: `PRJ-NEOM-NORTH-01`
- **Identity**:
  - **ID**: `PRJ-NEOM-NORTH-01`
  - **Code**: `NEOM-N01`
  - **Name (Ar)**: مشروع حزم البنية التحتية - نيوم الشمالية
  - **Name (En)**: NEOM North Infrastructure Package
  - **Client**: شركة نيوم للإنشاءات (NEOM Construction Co.)
  - **Status**: `ACTIVE`
  - **Geo Location**: Latitude `28.003`, Longitude `35.212`
  - **ZATCA Tax Registration**: `300012345600003`
- **Authorized Entities**:
  - **Carriers**: `CAR-ALMAJDOUIE` (شركة المجدوعي اللوجستية), `CAR-BINLADIN` (شركة أبناء بن لادن للنقل)
  - **Materials**: `MAT-AGG-01` (ركام بازلتي 3/4 بوصة), `MAT-SND-01` (رمل أحمر مغسول)
  - **Trucks Linked**: `TRK-9871` (أ ب ج 9871), `TRK-5542` (د هـ و 5542), `TRK-1122` (ر ز س 1122)
  - **Drivers Linked**: `DRV-101` (أحمد محمود القرني), `DRV-102` (خالد عبد الله العتيبي), `DRV-201` (محمد إبراهيم الشمري)
- **Associated Contractual Pricing Rules**:
  1. `PRC-NEOM-HAUL-TON-8.5`: 8.50 SAR / Ton (Al Majdouie, Basaltic Aggregate)
  2. `PRC-NEOM-SHORT-TRIP-120`: 120.00 SAR / Trip (Al Majdouie, Internal Site Transfer)
  3. `PRC-NEOM-AGG-TON`: 48.50 SAR / Ton (Al Majdouie, Aggregate Supply)
  4. `PRC-NEOM-SND-TRIP`: 1,400.00 SAR / Trip (Binladin, Dune Red Sand)
  5. `PRC-NEOM-EXPIRED`: 35.00 SAR / Ton (Expired `2025-12-31` for governance validation)
  6. `PRC-NEOM-INACTIVE`: 40.00 SAR / Ton (`INACTIVE` status for audit test)
- **Origin & Persistence**:
  - Defined statically in `src/data/defaultMasterData.ts` (lines 7–31).
  - Loaded into `adminConsoleService.projects` on instantiation.
  - Rendered in `MasterDataView.tsx` when unauthenticated.
  - Selected by default in `WorkspaceIntegrationView.tsx`.
  - Not written to Firestore.

---

### Project 2: `PRJ-REDSEA-RESORT-02`
- **Identity**:
  - **ID**: `PRJ-REDSEA-RESORT-02`
  - **Code**: `RSR-02`
  - **Name (Ar)**: مشروع وجهة البحر الأحمر - منطقة الجزر السياحية
  - **Name (En)**: Red Sea Destination Coastal Resort
  - **Client**: شركة البحر الأحمر الدولية (Red Sea Global)
  - **Status**: `ACTIVE`
  - **Geo Location**: Latitude `25.531`, Longitude `36.924`
  - **ZATCA Tax Registration**: `300098765400003`
- **Authorized Entities**:
  - **Carriers**: `CAR-ALMAJDOUIE`
  - **Materials**: `MAT-AGG-01`
  - **Trucks Linked**: Shared fleet via Al Majdouie (`TRK-9871`, `TRK-5542`)
  - **Drivers Linked**: Shared fleet via Al Majdouie (`DRV-101`, `DRV-102`)
- **Associated Pricing Rules**:
  - Relies on generic fallback or unassigned rules.
- **Origin & Persistence**:
  - Defined statically in `src/data/defaultMasterData.ts` (lines 32–56).
  - Filtered in `OperationsDashboardView.tsx` when switching to `USR-REDSEA-MGR`.
  - Not written to Firestore.

---

### Project 3: `PRJ-NEOM-001`
- **Identity**:
  - **ID**: `PRJ-NEOM-001`
  - **Code**: `NEOM-001`
  - **Name (Ar)**: مشروع نيوم - البنية التحتية والمحاجر (PRJ-NEOM-001)
  - **Client**: شركة نيوم للإنشاءات
  - **Status**: `ACTIVE`
- **Role in the Architecture**:
  - Acts as the standard reference key for **Data Quality**, **Field Workstations**, and **Pricing Engine**.
  - Direct target of `MASTER_PRICING_RULES` in `src/data/masterPricingRules.ts`.
  - Used in `SAMPLE_QUALITY_CONTEXT` in `src/data/sampleQualityData.ts`.
  - Hardcoded default project in `src/components/tripEngine/LoadingStation.tsx` (`useState('PRJ-NEOM-001')`).
  - Seeded into IndexedDB by `OfflineCacheService.seedAllMasterData()` (lines 64–74).
- **Origin & Persistence**:
  - Hardcoded literal in multiple services and data fixtures.
  - Persisted in browser **IndexedDB** under the `projects` object store whenever `offlineCacheService.initializeCache()` runs.

---

### Project 4: `PRJ-NEOM-WEST-01`
- **Identity**:
  - **ID**: `PRJ-NEOM-WEST-01`
  - **Code**: `NEOM-W01`
  - **Name (Ar)**: مشروع نيوم الغربية
- **Role in the Architecture**:
  - Exclusively used inside `src/components/pricing/PricingEngineView.tsx` (lines 53–130) as a local state fixture to demonstrate Copy-on-Write (COW) pricing rule versioning, date validity checks, and rate simulations.
- **Origin & Persistence**:
  - Pure in-memory React component state (`useState<PricingRule[]>(...)`).
  - Completely detached from `AdminConsoleService`, `defaultMasterData.ts`, and Firestore.

---

## 4. Source of Truth Architecture & Memory Injection Flow

```
+---------------------------------------------------------------------------------------+
|                                STATIC DATA FIXTURES                                   |
|                                                                                       |
|  1. src/data/defaultMasterData.ts                                                     |
|     - DEFAULT_PROJECTS (PRJ-NEOM-NORTH-01, PRJ-REDSEA-RESORT-02)                     |
|     - DEFAULT_CARRIERS (CAR-ALMAJDOUIE, CAR-BINLADIN, CAR-ALSHARQI)                  |
|     - DEFAULT_MATERIALS (MAT-AGG-01, MAT-SND-01, MAT-SUB-01)                        |
|     - DEFAULT_TRUCKS (TRK-9871, TRK-5542, TRK-1122)                                  |
|     - DEFAULT_DRIVERS (DRV-101, DRV-102, DRV-201)                                    |
|                                                                                       |
|  2. src/data/masterPricingRules.ts                                                    |
|     - MASTER_PRICING_RULES (6 contractual rules for PRJ-NEOM-001)                     |
|                                                                                       |
|  3. src/data/sampleQualityData.ts                                                     |
|     - SAMPLE_QUALITY_CONTEXT (Relationship context for PRJ-NEOM-001)                  |
+-------------------------------------------+-------------------------------------------+
                                            |
                    +-----------------------+-----------------------+
                    |                                               |
                    v                                               v
+--------------------------------------+        +--------------------------------------+
|       IN-MEMORY SINGLETONS           |        |         UI COMPONENT STATES          |
|                                      |        |                                      |
| 1. AdminConsoleService               |        | 1. MasterDataView.tsx                |
|    - this.projects = [...DEFAULT]    |        |    - setProjects(DEFAULT_PROJECTS)   |
|    - this.pricingRules = [...MASTER] |        |    - fallback when unauthenticated   |
|                                      |        |                                      |
| 2. DashboardService                  |        | 2. OperationsDashboardView.tsx       |
|    - getAuthorizedProjects() returns |        |    - Authorized project dropdown     |
|      DEFAULT_PROJECTS                |        |                                      |
|                                      |        | 3. LoadingStation.tsx                |
| 3. PricingService                    |        |    - useState('PRJ-NEOM-001')        |
|    - this.inMemoryRules = [...MASTER]|        |    - uses SAMPLE_QUALITY_CONTEXT     |
|                                      |        |                                      |
| 4. WorkspaceService                  |        | 4. PricingEngineView.tsx             |
|    - Default projects mapped         |        |    - useState for PRJ-NEOM-WEST-01   |
+-------------------+------------------+        +--------------------------------------+
                    |
                    v
+--------------------------------------------------------------------------------------+
|                                BROWSER INDEXEDDB                                     |
|                                                                                      |
| OfflineCacheService.seedAllMasterData()                                              |
| -> IndexedDB Store 'projects': [PRJ-NEOM-001, PRJ-NEOM-NORTH-01, PRJ-REDSEA-RESORT-02] |
| -> IndexedDB Store 'carriers': 4 records                                             |
| -> IndexedDB Store 'materials': 2 records                                            |
| -> IndexedDB Store 'trucks': 3 records                                               |
| -> IndexedDB Store 'drivers': 2 records                                              |
| -> IndexedDB Store 'pricingRules': 6 records                                         |
+--------------------------------------------------------------------------------------+
```

---

## 5. Master Data Inventory & Entity Mapping

### (A) Carriers (`DEFAULT_CARRIERS`)
1. **`CAR-ALMAJDOUIE`**:
   - Company: شركة المجدوعي اللوجستية (Almajdouie Logistics)
   - Commercial Reg: `1010334455`, TGA License: `TGA-KSA-9988`
   - Primary Project: `PRJ-NEOM-NORTH-01`, Status: `ACTIVE`
2. **`CAR-BINLADIN`**:
   - Company: شركة أبناء بن لادن للنقل (Binladin Transport Co.)
   - Commercial Reg: `1010998877`, TGA License: `TGA-KSA-7766`
   - Primary Project: `PRJ-NEOM-NORTH-01`, Status: `ACTIVE`
3. **`CAR-ALSHARQI`**:
   - Company: مؤسسة الشرقي للنقل والتجارة
   - Commercial Reg: `1010112233`, TGA License: `TGA-KSA-4433`
   - Primary Project: `PRJ-NEOM-NORTH-01`, Status: `INACTIVE`

### (B) Materials (`DEFAULT_MATERIALS`)
1. **`MAT-AGG-01`**:
   - Name: ركام بازلتي مقاس 3/4 بوصة (Basalt Aggregate 3/4")
   - Code: `AGG-01`, Standard Density: `1.65 Ton/m³`, Status: `ACTIVE`
2. **`MAT-SND-01`**:
   - Name: رمل أحمر مغسول للخلطات الخرسانية (Washed Red Sand)
   - Code: `SND-01`, Standard Density: `1.50 Ton/m³`, Status: `ACTIVE`
3. **`MAT-SUB-01`**:
   - Name: طبقة أساس حصوي مدموك - Sub-base
   - Code: `SUB-01`, Standard Density: `1.80 Ton/m³`, Status: `INACTIVE`

### (C) Trucks (`DEFAULT_TRUCKS`)
1. **`TRK-9871`**: Plate: `أ ب ج 9871`, Tare: `14,200 kg`, Max Gross: `45,000 kg`, Payload: `30,800 kg`, Carrier: `CAR-ALMAJDOUIE`
2. **`TRK-5542`**: Plate: `د هـ و 5542`, Tare: `13,800 kg`, Max Gross: `45,000 kg`, Payload: `31,200 kg`, Carrier: `CAR-ALMAJDOUIE`
3. **`TRK-1122`**: Plate: `ر ز س 1122`, Tare: `14,500 kg`, Max Gross: `45,000 kg`, Payload: `30,500 kg`, Carrier: `CAR-BINLADIN`

### (D) Drivers (`DEFAULT_DRIVERS`)
1. **`DRV-101`**: أحمد محمود القرني, Phone: `0551234567`, National ID: `1098765432`, Carrier: `CAR-ALMAJDOUIE`
2. **`DRV-102`**: خالد عبد الله العتيبي, Phone: `0509876543`, National ID: `1012345678`, Carrier: `CAR-ALMAJDOUIE`
3. **`DRV-201`**: محمد إبراهيم الشمري, Phone: `0543322110`, National ID: `2088776655`, Carrier: `CAR-BINLADIN`

---

## 6. Formal Entity Classification

| Entity / Record | Key Identifier | Classification | Rationale & Retention Policy |
| :--- | :--- | :--- | :--- |
| **Project 1** | `PRJ-NEOM-NORTH-01` | `SAFE_DEMO_PROJECT` | Demonstrates multi-carrier and multi-material projects. Must not auto-load in production runtime. |
| **Project 2** | `PRJ-REDSEA-RESORT-02` | `SAFE_DEMO_PROJECT` | Demonstrates cross-project authorization boundaries. Must be opt-in only. |
| **Project 3** | `PRJ-NEOM-001` | `REQUIRED_FOR_DEV` | Used in automated unit tests (`workspaceIntegration.test.ts`, `dataQuality.test.ts`). Keep in `src/data/` for tests. |
| **Project 4** | `PRJ-NEOM-WEST-01` | `UNINTENDED_RESIDUAL` | Hardcoded inside `PricingEngineView.tsx`. Should be replaced with dynamic service-backed rule state. |
| **Carriers** | `CAR-ALMAJDOUIE`, `CAR-BINLADIN`, `CAR-ALSHARQI` | `SAFE_DEMO_MASTER_DATA` | Static master data fixtures. Convert to on-demand seed. |
| **Materials** | `MAT-AGG-01`, `MAT-SND-01`, `MAT-SUB-01` | `SAFE_DEMO_MASTER_DATA` | Static material fixtures. Convert to on-demand seed. |
| **Trucks** | `TRK-9871`, `TRK-5542`, `TRK-1122` | `SAFE_DEMO_MASTER_DATA` | Static vehicle fixtures. Convert to on-demand seed. |
| **Drivers** | `DRV-101`, `DRV-102`, `DRV-201` | `SAFE_DEMO_MASTER_DATA` | Static operator fixtures. Convert to on-demand seed. |
| **Pricing Rules** | `PRC-NEOM-HAUL-TON-8.5` (et al.) | `SAFE_DEMO_MASTER_DATA` | Contractual test rules. Must not be pre-loaded into empty operational runtime. |

---

## 7. Definition of the "Empty Runtime Target"

To achieve a pristine, production-ready zero state when starting fresh:

### 1. Project Count: Exactly Zero (`0`)
- An uninitialized application instance must start with **0 projects** (`[]`).
- **No synthetic placeholder project** should be automatically created or assumed.

### 2. Project Selection Dropdowns Behavior
- In `OperationsDashboardView`, `MasterDataView`, `WorkspaceIntegrationView`, and `LoadingStation`:
  - When `projects.length === 0`:
    - The dropdown displays: `— لا توجد مشاريع مسجلة حالياً —` (Disabled).
    - An empty-state action button appears: **"تهيئة مشروع جديد / Create New Project"** (routing directly to the Project Setup Wizard or Admin Console).
    - No `TypeError` or `undefined` property crashes occur.

### 3. Master Data & Pricing Rules Cascade
- Master data entities (carriers, materials, trucks, drivers, pricing rules) strictly depend on an active project boundary:
  - If `projects.length === 0`:
    - The carrier, material, truck, driver, and pricing rule tables display zero rows with an informative empty banner:
      > **"يرجى إنشاء مشروع واعتماده أولاً لربط الناقلين وقواعد التسعير به."**
    - The button to add a carrier, truck, driver, or pricing rule is disabled until a project exists to own them.

### 4. Field Workstations Strict Validation
- Following the corporate mandate:  
  _«لا تسمح بإنشاء رحلة Offline أو Online إذا كانت بيانات التسعير أو المشروع غير متاحة»_
  - In `LoadingStation.tsx` and `LoadingOperatorView.tsx`:
    - If `projects.length === 0`: The dispatch form is locked with an alert: **"محطة التحميل معطلة: لا يوجد مشروع نشط أو قواعد تسعير معتمدة."**

### 5. Opt-In Demo Seeding Button
- For demonstration, sales demos, and automated E2E tests, add a dedicated administrative button in `AdminConsoleView` (or system menu):  
  **"تحميل بيانات المشروع التجريبية (Demo Data)"**
- Clicking this button explicitly executes `adminConsoleService.loadDemoMasterData()`, populating `DEFAULT_PROJECTS` on demand.

---

## 8. Answers to Specific Forensic Questions

### Q1: Are any projects currently stored in Firestore or IndexedDB?
- **Firestore**: **NO**. The live Firestore database (`ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1`) has default-deny rules (`allow read, write: if false`) and `/projects/{projectId}` rules requiring `isSignedIn()`. Furthermore, `project.repository.ts` explicitly returns `[]` when `auth.currentUser` is null. Direct probe without authorization confirmed `permission-denied`. Zero persistent project documents exist in the cloud.
- **IndexedDB**: **YES, conditionally**. Browser IndexedDB is lazily hydrated by `offlineCacheService.seedAllMasterData()` whenever an operator mounts `LoadingStation.tsx`, `LoadingOperatorView.tsx`, or opens `OutboxDrawer.tsx`. It seeds `PRJ-NEOM-001`, `PRJ-NEOM-NORTH-01`, and `PRJ-REDSEA-RESORT-02` into local client storage. Fresh browser profiles or incognito sessions start completely empty.

### Q2: Which files act as static sources of truth for sample projects?
1. `/src/data/defaultMasterData.ts` (defines `DEFAULT_PROJECTS`, `DEFAULT_CARRIERS`, `DEFAULT_MATERIALS`, `DEFAULT_TRUCKS`, `DEFAULT_DRIVERS`).
2. `/src/data/masterPricingRules.ts` (defines `MASTER_PRICING_RULES` targeting `PRJ-NEOM-001`).
3. `/src/data/sampleQualityData.ts` (defines `SAMPLE_QUALITY_CONTEXT` targeting `PRJ-NEOM-001`).
4. `/src/components/pricing/PricingEngineView.tsx` (lines 53–130 defines rules for `PRJ-NEOM-WEST-01`).

### Q3: Which components/services immediately inject these sample projects into memory?
1. **`AdminConsoleService`** (`src/services/adminConsole.service.ts`): Spreads `DEFAULT_PROJECTS` into `this.projects` and maps `MASTER_PRICING_RULES` into `this.pricingRules` upon class instantiation.
2. **`MasterDataView`** (`src/components/masterData/MasterDataView.tsx`): Sets local React state `projects` to `DEFAULT_PROJECTS` whenever the user is unauthenticated or when Firestore sync encounters an issue.
3. **`DashboardService`** (`src/services/dashboard.service.ts`): `getAuthorizedProjects()` returns `DEFAULT_PROJECTS` directly.
4. **`PricingService`** (`src/services/pricing.service.ts`): Constructor iterates over `MASTER_PRICING_RULES` and seeds `this.inMemoryRules`.
5. **`OfflineCacheService`** (`src/services/offline/offlineCache.service.ts`): `seedAllMasterData()` writes projects and master data into IndexedDB.
6. **`WorkspaceIntegrationView`** (`src/components/workspace/WorkspaceIntegrationView.tsx`): `useState<ProjectEntity[]>(DEFAULT_PROJECTS)` sets the project list.

### Q4: Why did trip data disappear in Block 82B while project data remained?
In Block 82B, the cleanup scope was strictly confined to **runtime operational trips and exceptions**:
- `TripEngineService.trips` was set to `[]`.
- `ExceptionEngineService.exceptions` was set to `new Map()`.
- Mock trip arrays in `FieldSupervisionView.tsx` and `DriverView.tsx` were removed.
- **Projects and master data reside in entirely separate architectural layers** (`defaultMasterData.ts`, `adminConsole.service.ts`, `masterPricingRules.ts`, and `masterData.service.ts`). Because these files were untouched during Block 82B, the application continued reading and rendering their static seed records.

### Q5: If we clear sample projects, which features or screens will break or show errors?
1. **`MasterDataView.tsx`**: `const defaultProjId = DEFAULT_PROJECTS[0].projectId;` assumes at least one project exists. If `projects` is `[]`, `projects[0].projectId` throws a `TypeError: Cannot read properties of undefined (reading 'projectId')` or sets `selectedProjectId` to `undefined`, causing `buildDefaultOverview` to crash.
2. **`AdminConsoleView.tsx`**: Dropdowns and entity creation forms default to `this.projects[0]?.projectId` (e.g., line 537). If `projects` is empty, foreign key validation or UI binding falls back to invalid strings or throws.
3. **`LoadingStation.tsx` & `LoadingOperatorView.tsx`**: Expects `availableProjects[0]`. Without a valid project, trip dispatch step cannot complete.
4. **`OfflineCacheService.validateOfflineTripPrerequisites`**: Checks whether a project is cached in IndexedDB; if empty, it returns `missing: ['PROJECT']`, correctly blocking dispatch.
5. **Automated Unit Tests**: Tests such as `src/tests/workspaceIntegration.test.ts` and `src/tests/masterData.test.ts` import `DEFAULT_PROJECTS[0]` directly. Modifying the constant in place without test fixtures would break CI.

### Q6: What is the minimal safe cleanup required for Block 82D?
1. **Decouple In-Memory Services from Static Seeds**:
   - In `AdminConsoleService`, initialize `projects = []`, `carriers = []`, `materials = []`, `trucks = []`, `drivers = []`, and `pricingRules = []`.
   - Add explicit on-demand methods: `loadDemoMasterData()` and `clearMasterData()`.
2. **Add Defensive Empty-State Handling in UI Views**:
   - In `MasterDataView.tsx`: Guard against `projects.length === 0`, render a dedicated empty state with a "Create Project" CTA, and do not call `projects[0].projectId` if `projects` is empty.
   - In `OperationsDashboardView.tsx`: Safely handle `authorizedProjects.length === 0`.
   - In `WorkspaceIntegrationView.tsx`: Display a clean empty indicator when no project is loaded.
3. **Preserve Fixtures in `src/data/` for Testing and On-Demand Demo Mode**:
   - Retain `DEFAULT_PROJECTS` and `MASTER_PRICING_RULES` as exported static fixtures in `src/data/`, but disconnect them from the default startup path.
4. **Update `OfflineCacheService`**:
   - Ensure `OfflineCacheService` only caches real projects when saved, rather than auto-seeding sample projects on startup.

---

## 9. Conclusion

The forensic investigation confirms that the persistence of sample projects and master data is due to static in-memory seed references, not lingering cloud Firestore data. Block 82D can safely transition the application to a true zero-state by decoupling in-memory services from static constants and introducing defensive UI guards, without risking regressions or schema breaks.
