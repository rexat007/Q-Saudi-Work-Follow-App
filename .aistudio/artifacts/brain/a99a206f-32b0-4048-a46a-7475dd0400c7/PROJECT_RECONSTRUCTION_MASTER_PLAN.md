# Q-SAUDI RECONSTRUCTION MASTER PLAN

## Product North Star
Q-Saudi Work Follow is an enterprise-grade Saudi logistics, heavy transport roster management, dispatch, field billing, and project execution authority platform. It provides server-authoritative multi-tenant project governance, real-time vehicle and driver assignment, pricing engine calculations, offline outbox synchronization, and ZATCA-compliant reporting.

---

## Reconstruction Phase Sequencing (Phase 0 to Phase 18)

### Phase 0: Governance & Baseline Reconstruction
- **Scope**: Re-establish strict repository governance, artifact tracking, build verification, and clean baseline commit state.
- **Active Unit**: `P0-U1_GOVERNANCE_AND_EVIDENCE_BASELINE`
- **Objective**: Establish single source of truth for planning, test execution, and CI boundaries.

### Phase 1: Multi-Tenant Project Isolation & Authority
- **Scope**: Hardened project boundaries, multi-tenant isolation, authorization context verification, and workspace projection.

### Phase 2: Roster Management & Entity Relationship Authority
- **Scope**: Canonical Drivers, Carriers, Materials, and Fleet membership, pk/fk integrity, and 8-layer Project Setup model validation.

### Phase 3: Smart Import & Session Persistence Governance
- **Scope**: Excel/CSV discovery, column mapping, conflict resolution, durable session checkpoints, and transactional commit authority.

### Phase 4: Pricing Rules Engine & Copy-On-Write Immutability
- **Scope**: Master pricing matrix, project-specific pricing rule overrides, copy-on-write historical immutability, and ZATCA tax rules.

### Phase 5: Field Dispatch & Fleet Execution Operations
- **Scope**: Loading operator, driver, and unloading operator field workflows, digital ticket capture, and real-time state machine transitions.

### Phase 6: Trip Engine & Waybill Lifecycle Governance
- **Scope**: Trip generation, tare/gross weight verification, waybill lifecycle state transitions, and exception tagging.

### Phase 7: Offline-First Synchronization & Outbox Resilience
- **Scope**: Outbox queues, conflict resolution policies, background sync retries, and network transition handling.

### Phase 8: Billing, Invoicing & Financial Settlement
- **Scope**: Trip aggregation, contractor billing, carrier settlement statement generation, and invoice PDF/export rendering.

### Phase 9: Exception Engine & Audit Trail Tamper-Resistance
- **Scope**: Operational exception logging, supervisor override tracking, tamper-resistant audit trails, and discrepancy flagging.

### Phase 10: Role-Based Access Control (RBAC) & Security Hardening
- **Scope**: Role permissions (Project Admin, Field Supervisor, Driver, Viewer), field-level authorization, IDOR protection, and security audit suite.

### Phase 11: Workspace & External Services Integration
- **Scope**: Google Workspace/Sheets initial projection, export endpoints, external REST integrations, and webhook triggers.

### Phase 12: Analytics, Operational Dashboards & SLA Monitoring
- **Scope**: Fleet utilization metrics, daily tonnage KPIs, SLA turnaround tracking, and operational velocity charts.

### Phase 13: Responsive UX, PWA & Cross-Device Field Compliance
- **Scope**: Mobile-first viewport discipline, RTL Arabic layout integrity, touch targets, and PWA service worker caching.

### Phase 14: Report Generation & Print Fidelity
- **Scope**: Canonical print templates, official PDF generation, waybill print layouts, and summary report export.

### Phase 15: System Performance, Indexing & Query Optimization
- **Scope**: Firestore composite indexes, Express query optimization, chunk splitting, and bundle size reduction.

### Phase 16: Automated E2E & Continuous Integration Suite
- **Scope**: Full Vitest test suite unification, CI automation workflows, regression coverage expansion, and pre-commit gates.

### Phase 17: User Acceptance Testing (UAT) & Production Readiness
- **Scope**: End-to-end UAT scenario validation, stress testing, error boundary resilience, and staging sign-off.

### Phase 18: Beta 2 Launch & Final Handoff
- **Scope**: Final release tagging, operational handoff documentation, production environment deployment, and Beta 2 sign-off.

---

## Beta 2 Exit Condition
- All Phase 0 through Phase 18 units marked **CLOSED** with verified runtime evidence.
- 0 open blocking regressions or type errors.
- 100% test pass rate across unit, integration, and E2E suites.
- Production build succeeds with zero errors.
- Independent GitHub audit confirmation matching commit state.
