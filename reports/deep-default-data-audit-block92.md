# BLOCK 92 — DEEP DEFAULT DATA & AUDIT/COMPLIANCE CONTENT INVENTORY

**READ-ONLY FORENSIC AUDIT REPORT**  
*No Code Changes | No Data Changes | No Firestore Changes | No Deletions | No Deployment | No I18N Changes*

---

## EXECUTIVE SUMMARY

A forensic audit was performed across all application modules, data services, wizards, system tools, and role simulators to inventory default data, sample records, static fixtures, and unexpected user identity sources.

---

## 1. DEFAULT USER IDENTITY FORENSIC TRACE

### Displayed Identity
`"المهندس / عبد الرحمن السعدون (مدير العمليات العام)"`  
*English equivalent:* `"Eng. Abdulrahman Al-Saadoun (Global Ops Director)"`

### Source Identification
- **Primary Source File:** `src/services/navigation.service.ts` (Line 334)
- **Secondary Source File:** `src/services/dashboard.service.ts` (Line 28)
- **Static Record:** `ROLE_PROFILES.SUPER_ADMIN.userNameAr` & `PREDEFINED_SECURITY_PROFILES[0].userNameAr`

### Render Locations (UI Components)
1. **Sub-Header Active Ribbon:** `src/App.tsx` (Line 426: `<strong className="text-[#f8fafc] font-bold">{roleProfile.userNameAr}</strong>`)
2. **Sidebar Role Drawer:** `src/components/navigation/Sidebar.tsx` (Line 188: `<div title={roleProfile.userNameAr}>{roleProfile.userNameAr}</div>`)
3. **Mobile Drawer Header:** `src/components/navigation/MobileNavDrawer.tsx` (Line 131: `USER: {roleProfile.userNameAr}`)
4. **Unauthorized Banner:** `src/components/navigation/UnauthorizedBanner.tsx` (Line 51: `<strong className="text-[#f8fafc]">{roleProfile.userNameAr}</strong>`)
5. **Dashboard Security Selector:** `src/components/dashboard/OperationsDashboardView.tsx` (Line 268)

### Root Cause Analysis
- In `App.tsx`, the role simulator dropdown maintains `currentRole` (defaulting to `'SUPER_ADMIN'`).
- The navigation sub-header ribbon and Sidebar drawer derive user display strings via `navigationService.getRoleProfile(currentRole).userNameAr`.
- While `activeAuthContext` is constructed with `displayName: userProfile?.fullName || user?.displayName || 'مدير النظام'`, the ribbon and sidebar display elements do **not** bind to `activeAuthContext.displayName`.
- Instead, they display the role simulator's static profile string (`ROLE_PROFILES[currentRole].userNameAr`).
- Consequently, when authenticated as a real user, components consuming `useAuth()` (e.g. `AuthButton.tsx`, `AccountStatusGate.tsx`, `MasterDataView.tsx`) show the real authenticated user name, while the global sub-header ribbon displays `"المهندس / عبد الرحمن السعدون (مدير العمليات العام)"`.

---

## 2. SYSTEM TOOLS // AUDIT & COMPLIANCE INVENTORY

### Production System Tools (5)
| Tool Name | Internal Key | File Path | Sub-Tabs / Sections | Data Source | Sample Data Present? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Console** | `ADMIN_CONSOLE` | `src/components/admin/AdminConsoleView.tsx` | 11 Sub-Tabs (Projects, Carriers, Materials, Pricing, Trucks, Drivers, Users, Exceptions, Audit Logs, Batches, Sync) | `AdminConsoleService` | **YES** |
| **Security & Audit Matrix** | `SECURITY_AUDIT` | `src/components/security/SecurityAuditView.tsx` | 2 Tabs (16 Security Domains, 12 Dirty Dozen Tests) | Automated Test Suites (`securityAudit.test.ts`, `dirtyDozen.test.ts`) | **NO** (Live Tests) |
| **Exception Engine** | `EXCEPTION_ENGINE` | `src/components/exceptionEngine/ExceptionEngineView.tsx` | 4 Sub-Tabs (Active Queue, Raise Exception, Audit Logs, Test Suite) | `ExceptionEngineService` (`INITIAL_EXCEPTIONS_SEED`) | **YES** (4 Seed Records) |
| **Unified Import Center** | `IMPORT_CENTER` | `src/components/importCenter/ImportCenterView.tsx` | 7 Sub-Tabs (Entity Resolution, Weighbridge, Google Sheets, Google Drive, CSV, Architecture, Active Batch) | `ImportCenterService` (`createInitialSampleBatch`) | **YES** (Sample Batch) |
| **Data Quality Pipeline** | `DATA_QUALITY` | `src/components/dataQuality/DataQualityView.tsx` | 3 Sections (Evaluated Records, Sandbox Tester, Pipeline Explorer) | `DataQualityEngine` (`SAMPLE_QUALITY_CONTEXT`) | **YES** (Staged Records) |

### Developer Mode Tools (3 — SUPER_ADMIN Restricted)
| Tool Name | Internal Key | File Path | Sub-Tabs / Sections | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| **Trip Engine** | `TRIP_ENGINE` | `src/components/TripEngineView.tsx` | FSM Simulator, State Logs | `TripEngineService` & `MASTER_PRICING_RULES` |
| **Pricing Engine** | `PRICING_ENGINE` | `src/components/pricing/PricingEngineView.tsx` | Formula Evaluator, Rule Explorer | `PricingService` & `MASTER_PRICING_RULES` |
| **Architecture Specs & Docs** | `DOCS` | `src/App.tsx` (Markdown View) | System Specs, Firestore Arch, Relations Matrix, 12 Principles | Static Markdown Files |

---

## 3. AUDIT & COMPLIANCE DATA TRACE

1. **Security Audit Results:** Dynamically generated in-memory by running `runSecurityAuditTests()` and `runDirtyDozenAudit()` on component mount. Non-persisted.
2. **Exception Records:** Seeding origin: `src/services/exceptionEngine.service.ts` (`INITIAL_EXCEPTIONS_SEED`, 4 records: `EXP-2026-001` to `004`). In-memory reactive state.
3. **Import Center Active Batch:** Seeding origin: `src/data/sampleImportBatches.ts` (`createInitialSampleBatch()`). In-memory reactive state.
4. **Data Quality Staged Imports:** Seeding origin: `src/data/sampleQualityData.ts` (`SAMPLE_STAGED_IMPORTS`). In-memory state evaluated dynamically by `DataQualityEngine`.

---

## 4. PROJECT CREATION DEFAULT DATA (CREATE PROJECT WIZARD)

When clicking **CREATE PROJECT** (`WIZARD` tab), `ProjectSetupWizard.tsx` initializes state `wizardData` with `mockTemplateData` (`src/components/wizard/mockTemplateData.ts`).

### Pre-Populated Values Inventory:
- **Project Code:** `PRJ-NEOM-WEST-01`
- **Project Name:** `مشروع ناقلات نيوم - قطاع ركام البنية التحتية`
- **Client Name:** `شركة نيوم للتطوير العقاري واللوجستي`
- **Settings:** ZATCA `301234567800003`, VAT 15%, Max Tolerance 500 Kg, Address `منطقة تبوك - قطاع العمليات اللوجستية 4`, GeoFence 2000m.

---

## 5. FOUR MATERIALS (IN WIZARD STEP 2)

| Material ID | Material Name | Code | Unit | Density | Origin File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MAT-SB-CLASS-A` | ركام طبقة أساس (Sub-base Class A) | SB-01 | TON | 2.1 | `src/components/wizard/mockTemplateData.ts` |
| `MAT-WASHED-SAND` | رمل أحمر مغسول ناعم | SND-02 | TON | 1.6 | `src/components/wizard/mockTemplateData.ts` |
| `MAT-GRAVEL-34` | بحص خرساني مقاس 3/4 إنش | GRV-03 | TON | 1.55 | `src/components/wizard/mockTemplateData.ts` |
| `MAT-BACKFILL-M3` | تربة دفان صخرية عامة | BKF-04 | M3 | 1.8 | `src/components/wizard/mockTemplateData.ts` |

---

## 6. THREE CARRIERS (IN WIZARD STEP 3)

| Carrier ID | Carrier Name | CR Number | License Number | Origin File |
| :--- | :--- | :--- | :--- | :--- |
| `CAR-A` | شركة الرشيد للخدمات اللوجستية (Carrier A) | 1010234567 | TGA-LOG-44910 | `src/components/wizard/mockTemplateData.ts` |
| `CAR-B` | مؤسسة الصفا للنقل الثقيل (Carrier B) | 1010876543 | TGA-LOG-55821 | `src/components/wizard/mockTemplateData.ts` |
| `CAR-C` | شركة الجميح للشاحنات والمقاولات (Carrier C) | 1010332211 | TGA-LOG-66732 | `src/components/wizard/mockTemplateData.ts` |

---

## 7. THREE PRICING RULES (IN WIZARD STEP 4)

| Rule ID | Carrier | Type | Rate | Effective Dates | Demurrage / Free Time | Origin File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PR-CAR-A-TRIP-120` | Carrier A | PER_TRIP | 120 SAR | 2026-09-01 to 2027-12-31 | 60 SAR/hr, 2.0 hrs | `mockTemplateData.ts` |
| `PR-CAR-B-TON-8-5` | Carrier B | PER_TON | 8.5 SAR | 2026-09-01 to 2027-12-31 | 50 SAR/hr, 2.0 hrs | `mockTemplateData.ts` |
| `PR-CAR-C-TON-7-75` | Carrier C | PER_TON | 7.75 SAR | 2026-09-01 to 2027-12-31 | 45 SAR/hr, 2.5 hrs | `mockTemplateData.ts` |

---

## 8. PROJECT ACCESS USERS (IN WIZARD STEP 5)

| User ID | Full Name | Email | Role | Assigned? | Origin File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `USR-ADMIN-01` | م. راكان الراجحي | `rakan.alrajhi@q-saudi.sa` | `PROJECT_ADMIN` | YES | `mockTemplateData.ts` |
| `USR-DISP-01` | سعد القحطاني | `saad.disp@q-saudi.sa` | `DISPATCHER` | YES | `mockTemplateData.ts` |
| `USR-AUDIT-01` | نورة السبيعي | `noura.finance@q-saudi.sa` | `FINANCE_AUDITOR` | YES | `mockTemplateData.ts` |
| `USR-VIEW-01` | مراقب العمليات الميدانية | `field.viewer@q-saudi.sa` | `VIEWER` | NO | `mockTemplateData.ts` |

---

## 9. RUNTIME VS FIXTURE SEPARATION

| Constant / Data Source | File Path | Auto-Runtime Injection? | Description / Impact |
| :--- | :--- | :--- | :--- |
| `DEFAULT_PROJECTS` | `src/data/defaultMasterData.ts` | **YES** | Fallback when Firestore project list is empty or loading. |
| `DEFAULT_CARRIERS` | `src/data/defaultMasterData.ts` | **YES** | Fallback in MasterDataView and OperationsDashboardView widget filters. |
| `DEFAULT_MATERIALS` | `src/data/defaultMasterData.ts` | **YES** | Fallback in MasterDataView, OperationsDashboardView, and WidgetFilterBar. |
| `DEFAULT_TRUCKS` | `src/data/defaultMasterData.ts` | **YES** | Fallback in MasterDataView when project trucks list is empty. |
| `DEFAULT_DRIVERS` | `src/data/defaultMasterData.ts` | **YES** | Fallback in MasterDataView when project drivers list is empty. |
| `MASTER_PRICING_RULES` | `src/data/masterPricingRules.ts` | **YES** | Fallback in pricing service and weight engine when no project rules exist. |
| `SAMPLE_QUALITY_CONTEXT` | `src/data/sampleQualityData.ts` | **YES** | Auto-loaded into DataQualityView on component mount. |
| `mockTemplateData` | `src/components/wizard/mockTemplateData.ts` | **YES** | Auto-loaded into ProjectSetupWizard state on component mount. |

---

## 10. CLEAN RUNTIME EXPECTED STATE

| View Area | Clean Runtime Expected State | Current Mismatch Behavior |
| :--- | :--- | :--- |
| **Dashboard** | EXPECTED SYSTEM METADATA / EMPTY | Falls back to sample metrics/projects when 0 trips exist in Firestore. |
| **Projects** | EXPECTED SYSTEM METADATA | Fetches live projects; clean empty state if 0 projects exist. |
| **Create Project** | EXPECTED EMPTY | Pre-populates all 7 steps with `mockTemplateData`. |
| **Master Data** | EXPECTED SYSTEM METADATA | Falls back to `DEFAULT_CARRIERS`/`DEFAULT_MATERIALS` if project master data is empty. |
| **Project Access** | EXPECTED SYSTEM METADATA | Displays 4 static fixture users in Wizard Step 5. |
| **Audit & Compliance** | EXPECTED SYSTEM METADATA (Logs), EMPTY (Staged Batches) | Auto-seeds staged import batches and exceptions on component mount. |
| **Pricing** | EXPECTED SYSTEM METADATA | Falls back to `MASTER_PRICING_RULES` (6 rules) when no project rules exist in Firestore. |

---

## 11. SECURITY / SAFETY RISK ASSESSMENT

1. **Accidental Commitment in Project Creation:**  
   If an administrator submits the Create Project Wizard without modifying Steps 2-5, `projectProvisioningService.provisionProject()` WILL commit `mockTemplateData` (4 materials, 3 carriers, 3 pricing rules, 3 user access assignments) directly to Firestore.
2. **Identity Confusion in Navigation Ribbon:**  
   The sub-header ribbon displays `"المهندس / عبد الرحمن السعدون (مدير العمليات العام)"` regardless of the currently authenticated Firebase user.

---

## 12. EXACT CLEANUP CANDIDATES (EVIDENCE-BASED RECOMMENDATIONS)

### Candidate 1: ROLE_PROFILES.SUPER_ADMIN Display String
- **Source:** `src/services/navigation.service.ts` (Line 334)
- **Evidence:** Sub-header ribbon in `App.tsx` displays `"المهندس / عبد الرحمن السعدون (مدير العمليات العام)"` even when signed in as a different authenticated user.
- **Current Location:** `src/services/navigation.service.ts` & `src/App.tsx` (Line 426)
- **Runtime Active:** YES
- **Recommendation:** **MANUAL REVIEW** — Update `App.tsx` sub-header ribbon to display `activeAuthContext.displayName` or `userProfile.fullName`, falling back to role title.

### Candidate 2: mockTemplateData Initial Wizard State
- **Source:** `src/components/wizard/mockTemplateData.ts`
- **Evidence:** `ProjectSetupWizard.tsx` initializes `wizardData` with `mockTemplateData`, causing `'PRJ-NEOM-WEST-01'` and 4 materials, 3 carriers, 3 pricing rules, and 4 users to be pre-populated upon opening the wizard.
- **Current Location:** `src/components/wizard/ProjectSetupWizard.tsx` (Line 58)
- **Runtime Active:** YES
- **Recommendation:** **MOVE TO EXPLICIT DEMO MODE** — Provide a "Fill Template Data" button in the wizard while initializing new projects with a clean empty state.

### Candidate 3: INITIAL_EXCEPTIONS_SEED in Exception Engine
- **Source:** `src/services/exceptionEngine.service.ts` (Lines 23-117)
- **Evidence:** `ExceptionEngineService` auto-seeds 4 exception records (`EXP-2026-001` through `004`) on initialization.
- **Current Location:** `src/services/exceptionEngine.service.ts`
- **Runtime Active:** YES
- **Recommendation:** **MOVE TO EXPLICIT DEMO MODE** — Seed sample exceptions only on demand or when running test suites.

### Candidate 4: createInitialSampleBatch in Import Center
- **Source:** `src/data/sampleImportBatches.ts`
- **Evidence:** `ImportCenterView` initializes `activeBatch` with `createInitialSampleBatch()` on mount.
- **Current Location:** `src/components/importCenter/ImportCenterView.tsx` (Line 60)
- **Runtime Active:** YES
- **Recommendation:** **MOVE TO EXPLICIT DEMO MODE** — Allow users to load sample CSV batches via a "Load Sample File" button.

### Candidate 5: DEFAULT_CARRIERS & DEFAULT_MATERIALS Fallbacks
- **Source:** `src/data/defaultMasterData.ts`
- **Evidence:** Used as fallback in services and widget filters when Firestore returns empty master data lists.
- **Current Location:** `src/data/defaultMasterData.ts` & `src/services/dashboard.service.ts`
- **Runtime Active:** YES
- **Recommendation:** **REMOVE FROM RUNTIME** — Display clean empty states when project master data is empty.

---

## 13. AUDIT VERIFICATION SIGN-OFF

- **DEFAULT_DATA_INVENTORY:** COMPLETE
- **AUDIT_COMPLIANCE_INVENTORY:** COMPLETE
- **PROJECT_SETUP_INVENTORY:** COMPLETE
- **UNEXPECTED_IDENTITY_SOURCE:** IDENTIFIED (`src/services/navigation.service.ts` line 334 & `src/services/dashboard.service.ts` line 28)
- **RUNTIME_DEFAULT_INJECTION_SOURCES:** 8
- **CODE_CHANGED:** NO
- **DATA_CHANGED:** NO
- **I18N_CHANGED:** NO
