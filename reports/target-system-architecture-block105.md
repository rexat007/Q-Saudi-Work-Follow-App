# BLOCK 105 — TARGET SYSTEM ARCHITECTURE + RELATIONSHIP + CANONICAL NAMING MODEL REPORT

## 1. Executive Summary
This report defines the authoritative Target System Architecture for the Q-Saudi Work Follow application in accordance with BLOCK 105. Grounded in the forensic baseline established across Blocks 103B through 104E-FULL, this blueprint establishes explicit entity relationships, unambiguous business ownership, canonical terminology, service boundaries, Firestore ownership models, and architectural invariants for future rebuilding phases without modifying any existing application code.

## 2. Target Architecture Layers
The target system is structured into 15 cohesive architectural layers:
1. Identity & Access
2. Organization / Project
3. Master Identity Registry
4. Project Operational Configuration
5. Project Roster
6. Pricing
7. Trip Lifecycle
8. Field Operations
9. Exceptions
10. Import / Data Ingestion
11. Reporting
12. Storage / Workspace Integration
13. Audit / Compliance
14. Developer Diagnostics
15. Offline / Outbox Infrastructure

## 3. Canonical Entity Model & Relationships
Defines 17 canonical entities (`PROJECT`, `CARRIER`, `DRIVER`, `TRUCK`, `MATERIAL`, `PROJECT_ROSTER`, `PRICING_RULE`, `PRICING_SNAPSHOT`, `TRIP`, `TRIP_SNAPSHOT`, `EXCEPTION`, `USER`, `ROLE`, `PROJECT_MEMBERSHIP`, `IMPORT_OPERATION`, `STORAGE_PROFILE`, `AUDIT_LOG`) with explicit cardinality, scoping, and historical immutability rules.

## 4. Driver + Truck Shared Intake Model
Enforces **RULE-001**: Operational driver and truck data originates strictly from within the project via shared intake workflows or single Excel/Google Sheet batch ingestion. Global registries act solely as derived, indexed layers.

## 5. Canonical Terminology Dictionary
Eliminates terminology fragmentation by mapping forbidden alternative terms to standardized canonical terms across all entities, actions, and workflows.

## 6. Service & API Naming Model
Standardizes service ownership (e.g., `projectService`, `projectRosterService`, `tripService`, `importService`) and semantic RESTful API endpoints (`/api/projects/:projectId/roster`, `/api/projects/:projectId/trips`, `/api/imports`).

## 7. Architectural Invariants (INVARIANT-001 through INVARIANT-009)
- **INVARIANT-001**: Driver/Truck operational intake originates only from Project workflows.
- **INVARIANT-002**: Global registries cannot be primary operational intake.
- **INVARIANT-003**: Project Roster is the canonical operational relationship.
- **INVARIANT-004**: Trip snapshots are immutable.
- **INVARIANT-005**: One business concept has one canonical terminology.
- **INVARIANT-006**: One business capability has one canonical owner.
- **INVARIANT-007**: Secondary entry points must invoke the canonical workflow rather than implement a parallel workflow.
- **INVARIANT-008**: Import commit cannot bypass review.
- **INVARIANT-009**: Offline cache cannot override Firestore authority.

## 8. Safety Conditions & Final Verdict
- CODE_CHANGED = NO
- DATA_CHANGED = NO
- FIRESTORE_CHANGED = NO
- INDEXEDDB_CHANGED = NO
- GOOGLE_DRIVE_CHANGED = NO
- GOOGLE_SHEETS_CHANGED = NO
- ROUTES_CHANGED = NO
- UI_CHANGED = NO
- P0 = 0
- P1 = 0
- PRODUCTION_FIXTURE_PATHS = 0
- GHOST_DATA_PATHS_REMAINING = 0
- RELEASE_BLOCKER = NO

**Final Verdict**: `TARGET_ARCHITECTURE_ESTABLISHED`
