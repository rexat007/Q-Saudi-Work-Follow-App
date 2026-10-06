# Q-SAUDI RECONSTRUCTION MASTER PLAN

## Product North Star
Q-Saudi Work Follow is an enterprise-grade Saudi logistics, heavy transport roster management, dispatch, field billing, and project execution authority platform. It provides server-authoritative multi-tenant project governance, real-time vehicle and driver assignment, pricing engine calculations, offline outbox synchronization, and ZATCA-compliant reporting.

---

## Authoritative Reconstruction Roadmap (Phase 0 to Phase 18)

### Phase 0 — Repository & Engineering Foundation
- **Scope**: Establish repository governance, document authority, toolchain reproducibility, test taxonomy convergence, root tooling hygiene, secret-free CI baseline, and Phase 0 freeze.

### Phase 1 — Canonical Domain Model
- **Scope**: Hardened entity domain interfaces, type boundaries, primary/foreign key relationships, and validation schemas.

### Phase 2 — Persistence & Server Authority
- **Scope**: Server-authoritative Firestore operations, multi-tenant isolation enforcement, Firebase Admin SDK integration, and security rules auditing.

### Phase 3 — Authentication, Authorization & Administrative Governance
- **Scope**: Role-Based Access Control (RBAC), token verification, field-level authorization, IDOR defense, and admin controls.

### Phase 4 — Project Lifecycle & Project-Scoped State
- **Scope**: Project status state machine (DRAFT, SETUP, ACTIVE, COMPLETED, ARCHIVED), lifecycle transitions, and active project state synchronization.

### Phase 5 — Master Data & Canonical Relationships
- **Scope**: Canonical Driver, Carrier, Material, and Fleet relationships, foreign key constraints, and master data management.

### Phase 6 — Project Setup Experience
- **Scope**: 8-Layer Project Setup Workflow wizard, readiness gate evaluation, layer-by-layer validation, and activation lock.

### Phase 7 — Smart Import Core
- **Scope**: Excel/CSV smart source discovery, header detection, column mapping, mapping diagnostics, and entity resolution.

### Phase 8 — Smart Import Persistence, Resume & Commit Integrity
- **Scope**: Durable import session checkpoints, session resumption, version concurrency control, transactional batch commits, and session-restore edge case resolution.

### Phase 9 — Pricing & Commercial Rules
- **Scope**: Master pricing rules matrix, project-specific rule overrides, copy-on-write historical immutability, and ZATCA tax rules.

### Phase 10 — Operational Trip Lifecycle
- **Scope**: Field dispatch workflows (Loading Operator, Driver, Unloading Operator), digital waybill creation, tare/gross weight recording, and trip state transitions.

### Phase 11 — Offline, Outbox & Resilience
- **Scope**: Offline outbox queue, background sync retries, conflict resolution policies, network state transitions, and cache isolation.

### Phase 12 — Audit, Exceptions & Administrative Control
- **Scope**: Operational exception logging, supervisor override tracking, tamper-resistant audit trail, and discrepancy flagging.

### Phase 13 — Dashboards & Operational Analytics
- **Scope**: Fleet utilization metrics, daily tonnage KPIs, SLA turnaround monitoring, and operational velocity charts.

### Phase 14 — Reports, Export & Print
- **Scope**: Official waybill print templates, contractor billing statements, carrier settlement statements, and PDF generation.

### Phase 15 — Responsive / Cross-Device Product System
- **Scope**: Mobile-first touch targets, RTL Arabic layout integrity, PWA service worker caching, and cross-browser responsive compliance.

### Phase 16 — End-to-End Business Journeys
- **Scope**: Comprehensive multi-role E2E scenario testing, automated integration workflows, and regression coverage expansion.

### Phase 17 — Hardening, Security, Performance & Recovery
- **Scope**: Performance optimization, Firestore composite indexes, security audit suite verification, and disaster recovery validation.

### Phase 18 — Beta 2 Release Gate
- **Scope**: Final release tagging, operational handoff documentation, production deployment sign-off, and Beta 2 exit sign-off.

---

## Beta 2 Exit Condition
- All Phase 0 through Phase 18 units marked **CLOSED** with verified runtime evidence.
- 0 open blocking regressions or type errors.
- 100% test pass rate across unit, integration, and E2E suites.
- Production build succeeds with zero errors.
- Independent GitHub audit confirmation matching commit state.
