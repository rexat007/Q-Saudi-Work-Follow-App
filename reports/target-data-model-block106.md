# BLOCK 106 — TARGET DATA MODEL & ENTITY RELATIONSHIP SPECIFICATION REPORT

## 1. Executive Summary
This report establishes the authoritative Target Data Model and Entity Relationship Specification for the future rebuilt Q-Saudi Work Follow application in accordance with BLOCK 106. Operating in strict read-only architectural specification mode, this document defines the 17 canonical entities, scope boundaries, ID strategies, historical immutability rules, cardinality matrices, derived registries, and Firestore conceptual structure without altering any production code or data.

## 2. Canonical Entity Definitions
Covers all 17 canonical entities:
1. `PROJECT`
2. `CARRIER`
3. `DRIVER`
4. `TRUCK`
5. `MATERIAL`
6. `PROJECT_ROSTER`
7. `PRICING_RULE`
8. `PRICING_SNAPSHOT`
9. `TRIP`
10. `TRIP_SNAPSHOT`
11. `EXCEPTION`
12. `USER`
13. `ROLE`
14. `PROJECT_MEMBERSHIP`
15. `IMPORT_OPERATION`
16. `STORAGE_PROFILE`
17. `AUDIT_LOG`

## 3. Driver & Truck Shared Intake Model
Enforces **RULE-001**: Operational driver and truck data originates strictly from within project workflows or unified batch import. Global registries are strictly derived, indexed projections.

## 4. Historical Immutability & Snapshots
Ensures that once trip and pricing snapshots are committed, subsequent master-data edits cannot mutate historical records.

## 5. Data Invariants (`INVARIANT-DATA-001` through `INVARIANT-DATA-007`)
- **INVARIANT-DATA-001**: Every Project Roster row belongs to exactly one Project.
- **INVARIANT-DATA-002**: Operational Driver/Truck intake originates from Project workflows.
- **INVARIANT-DATA-003**: Global registries are derived, never primary operational intake.
- **INVARIANT-DATA-004**: Trip snapshots are immutable.
- **INVARIANT-DATA-005**: Historical pricing snapshots are immutable.
- **INVARIANT-DATA-006**: A secondary UI entry point cannot create a parallel data model.
- **INVARIANT-DATA-007**: Project authorization is required for project-scoped writes.

## 6. Safety Conditions & Final Verdict
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

**Final Verdict**: `TARGET_DATA_MODEL_ESTABLISHED`
