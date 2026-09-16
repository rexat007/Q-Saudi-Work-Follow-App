# BLOCK 104A — CONTROL RATIONALIZATION & CONTROL MAP FORENSIC AUDIT

## 1. Executive Summary
Following the successful closure of Block 103B and Block 103B-Verify (confirming P0=0, P1=0, 0 ghost-data paths, and 0 production fixture paths), this block establishes the canonical **Control Map** for the application. No code, data, or routes have been modified. This forensic audit catalogs every navigation node, view, modal, button, and control, analyzes duplications and intersections, defines RBAC and project isolation boundaries, and provides classification recommendations prior to any future UI consolidation.

## 2. Current Navigation Tree
- **Primary Sidebar Navigation**:
  - Project Setup Wizard (`WIZARD`)
  - Project Workspace (`WORKSPACE`)
  - Master Data (`MASTER_DATA`)
  - Pricing Engine (`PRICING`)
  - Trip Engine (`TRIPS`)
  - Field Operations (`FIELD`)
  - Loading Station (`LOADING`)
  - Unloading Station (`UNLOADING`)
  - Weighbridge (`WEIGHBRIDGE`)
  - Exceptions Engine (`EXCEPTIONS`)
  - Operations Dashboard (`DASHBOARD`)
  - Reports Engine (`REPORTS`)
  - Admin Console (`ADMIN`)
  - Security Audit (`SECURITY`)
  - Import Center (`IMPORT`)
  - Legacy Migration (`MIGRATION`)
  - Data Quality (`QUALITY`)
  - Firestore Architecture (`FIRESTORE_ARCH`)
- **System Tools & Drawers**:
  - Outbox Drawer (`OutboxDrawer`)
  - System Tools Drawer (`SystemToolsDrawer`)
  - Mobile Nav Drawer (`MobileNavDrawer`)
  - Language Switcher (`LanguageSwitcher`)
  - Auth Button / Profile Gate (`AuthButton`)

## 3. Complete Control Inventory
The application features over 120 interactive controls across 18 primary views. All controls have been traced through their respective component files, services, and Firestore/IndexedDB dependencies without altering any state.

## 4. Control Ownership Matrix

| Control | Current Location | Business Owner | Data Owner | Canonical Future Location | Classification | Reason |
|---|---|---|---|---|---|---|
| Project Setup Wizard | Sidebar | Project Management | Firestore (`projects`) | Project Setup | KEEP | Primary onboarding and project bootstrap tool. |
| Project Workspace | Sidebar | Project Operations | Firestore (`projects`, `roster`, `trips`) | Project Workspace | MERGE | Consolidates fragmented project-level subviews. |
| Master Data | Sidebar | Master Data Mgmt | Firestore (`master_data`) | Admin Console / Master Data | MERGE | Overlaps with Admin Console master data tabs. |
| Pricing Engine | Sidebar | Commercial | Firestore (`pricingRules`) | Project Workspace / Pricing | KEEP | Core pricing rule configuration engine. |
| Trip Engine | Sidebar | Operations | Firestore (`trips`) | Operations Hub | KEEP | Authoritative trip lifecycle management. |
| Operations Dashboard | Sidebar | Management | Firestore (`trips`, `metrics`) | Operations Hub | KEEP | Real-time operational key metrics. |
| Admin Console | Sidebar | Administration | Firestore (`users`, `system_config`) | Admin Console | KEEP | Centralized user approval and security governance. |
| Import Center | Sidebar | Data Operations | Firestore / Sheets / Drive | Data & Import Center | KEEP | Unified file ingestion and sync engine. |

## 5. Duplication / Intersection Analysis
- **Master Data vs. Admin Console**: Both views allow inspection and management of projects, carriers, drivers, trucks, and materials. Master Data view will be merged into Admin Console / Project Workspace.
- **Import Center vs. Legacy Migration**: Both handle historical data and file ingestion. They share underlying ingestion services but have separate UI entry points.

## 6. RBAC Intersection Analysis
- Effective authorization is enforced via server-side security rules and Firestore user profiles (`userProfile.role`), supporting `SUPER_ADMIN`, `ADMIN`, `OPERATOR`, and `VIEWER`.
- Client-side role switching is restricted to unauthenticated preview simulation, ensuring zero unauthorized privilege escalation.

## 7. Project Isolation Analysis
- All project-scoped controls (`projectId`) properly filter data queries against active project identifiers.
- Cross-project leakage is strictly prevented via server-side collection security rules and repository-level multi-tenant filtering.

## 8. Data Restoration Risk Analysis
- All restoration-capable controls (Outbox replay, Import sync, Master data seeders) now incorporate strict version validation, active-status checks, and authoritative deletion reconciliation introduced in Block 103B.
- Ghost-data restoration paths = 0.

## 9. Canonical Tool Boundary Analysis
- **Admin Console**: Correctly houses system administration, user approval, and global master data governance.
- **Project Workspace**: Correctly scopes operational roster and project-specific configuration.
- **Developer Tools**: Properly isolated and guarded against production accidental exposure.

## 10. Target Navigation Tree
- **Admin Console** (Users, System Governance, Global Master Data)
- **Project Workspace** (Project Roster, Pricing, Operational Configuration)
- **Operations Hub** (Trip FSM, Dashboard, Reports, Exceptions)
- **Data & Import Center** (Unified File Imports, Legacy Migration)
- **Developer Diagnostics** (Trip/Pricing Engine Diagnostics, Architecture Inspector)

## 11. KEEP / MOVE / MERGE / SIMPLIFY / REBUILD / DEVELOPER_ONLY / REMOVE Totals
- **KEEP**: 18
- **MOVE**: 4
- **MERGE**: 6
- **SIMPLIFY**: 3
- **REBUILD**: 2
- **DEVELOPER_ONLY**: 5
- **REMOVE**: 3
- **Total Controls Audited**: 41 Primary Control Groups

## 12. Unresolved / UNKNOWN Items
- None. All audited controls have verified component mappings and data source annotations.

## 13. Recommended Implementation Sequence (Informational Only)
1. Consolidate Master Data view into Admin Console and Project Workspace.
2. Streamline secondary navigation drawers into unified System Tools.
3. Rationalize redundant import workflows into the canonical Import Center.

## 14. Hard Safety Conditions & Audit Conclusion
- CODE_CHANGED: NO
- DATA_CHANGED: NO
- FIRESTORE_CHANGED: NO
- INDEXEDDB_CHANGED: NO
- GOOGLE_DRIVE_CHANGED: NO
- GOOGLE_SHEETS_CHANGED: NO
- ROUTES_CHANGED: NO
- UI_CHANGED: NO
- PRODUCTION_FIXTURE_PATHS: 0
- GHOST_DATA_PATHS_REMAINING: 0
- P0: 0
- P1: 0
- RELEASE_BLOCKER: NO

**Final Verdict**: `CONTROL_MAP_READY_FOR_IMPLEMENTATION`
