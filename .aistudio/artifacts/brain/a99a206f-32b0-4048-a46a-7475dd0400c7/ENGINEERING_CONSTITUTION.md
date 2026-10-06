# Q-SAUDI ENGINEERING CONSTITUTION

## Core Engineering Directives

### 1. GitHub Main Is Code Truth
The GitHub `main` branch commit history is the sole authoritative code truth. Local unpushed edits carry zero governance weight until verified, approved, and pushed.

### 2. Runtime Evidence Hierarchy
Verification must strictly respect the runtime evidence hierarchy:
`Automated Tests > Static Typechecks > Code Inspection > Manual UI Assertion`.

### 3. No Fabricated IDs or Business Metadata
No dummy GUIDs, fake project IDs, mock fallback constants, or artificial metadata in production code paths. Every ID must originate from authoritative storage or client-generated UUIDs.

### 4. Server Authority
The backend (Node/Express/Firebase Admin) is the sole authority for business calculations, pricing rules, trip state transitions, and persistent storage reconciliation.

### 5. Strict Multi-Tenant Project Isolation
Every database query, API route, outbox item, and UI state context must be explicitly isolated and filtered by `projectId`. Cross-tenant data leaks are zero-tolerance violations.

### 6. Single Business Authority
Never duplicate business calculation rules or state transition logic across client and server. Client components invoke server endpoints or shared pure domain services.

### 7. Minimal Controls & Clean Interfaces
UI interfaces must remain focused, clean, and free of artificial status indicators, debug telemetry, or system log overlays in production rendering.

### 8. Responsive & Cross-Device Invariant
Field applications must operate seamlessly across mobile, tablet, and desktop viewports with strict RTL Arabic layout discipline and touch-friendly controls.

### 9. Canonical Report & Print Fidelity
All printouts, waybills, and PDF reports must render strictly from canonical server snapshots rather than transient client state.

### 10. Area-Wide Defect Review
Before editing any file to fix a defect, perform a full area-wide code review across related components, hooks, and services to address the root cause holistically.

### 11. No Patch-by-Patch Stopping
Never stop at the first surface error or apply quick single-line patches without verifying total contract integrity across the entire module and test suite.
