# REPOSITORY RECONSTRUCTION MAP

## High-Level Repository Classifications

This map governs how code modules, services, components, and tests are categorized and handled throughout the Q-Saudi reconstruction program.

---

### KEEP
- **React / Vite Application Foundation**: `src/App.tsx`, `src/main.tsx`, `vite.config.ts`, `index.html`.
- **Node / Express Server Foundation**: `server.ts`, `server/app.ts`.
- **Firebase Canonical Persistence**: Firestore collections, security rules, Firebase Admin SDK integration.
- **Accepted 8-Layer Project Setup Model**: Layered project setup workflow (`src/services/projectSetupWorkflow.service.ts`, `src/components/wizard/ProjectSetupWizard.tsx`).
- **Canonical Entity & Relationship Services**: Drivers, Carriers, Materials, Fleet, Pricing Rules, and Projects domain repositories and services.

---

### HARDEN
- **TypeScript Boundary**: Eliminate implicit `any`, enforce strict interface shapes, eliminate type suppressions in production paths.
- **Test Infrastructure**: Ensure all test suites run deterministically in Vitest.
- **Async & Project-Scoped State**: Race-safe loading, `loadGenerationRef` pattern, project isolation guarantees.
- **Import Session Contracts**: Durable checkpoint persistence, version concurrency control, transactional commits.
- **Responsive Verification**: Mobile viewport touch targets, RTL Arabic layout alignment, cross-browser rendering.
- **Report & Print Verification**: Server-authoritative print rendering, ZATCA tax invoice layouts.

---

### CONVERGE
- **Test Runners**: Unify standalone TSX scripts into standard Vitest suites.
- **Documentation Authority**: Consolidate planning and architecture docs into Google AI Studio Artifacts.
- **Duplicated Business Authority**: Eliminate duplicate business logic across client and server.
- **Project/Entity Relationship Contracts**: Standardize primary key / foreign key lookup interfaces.

---

### REBUILD
- *Triggered ONLY when Phase audit proves current implementation cannot safely converge.*
- Currently no components flagged for complete rebuild in Phase 0.

---

### RETIRE
- *Triggered ONLY after reachability proof confirms zero active callers or runtime necessity.*
- Unused root-level repair/diagnostic scripts after formal audit.

---

### DEFER
- Technical debt not required by the active phase (e.g. `DD-01` Smart Import session-restore contract deferred to Phase 8, `DD-02` Vite chunk splitting deferred to Phase 15).
