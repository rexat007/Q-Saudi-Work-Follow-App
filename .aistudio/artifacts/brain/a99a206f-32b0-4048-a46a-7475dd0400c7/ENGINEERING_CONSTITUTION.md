# ENGINEERING CONSTITUTION

## Binding Engineering Directives

### 1. Code & Environment Truth
- **GitHub Main Authority**: The remote GitHub `main` branch is the sole source of code truth.
- **Runtime Evidence for Runtime Behavior**: Runtime evidence from live network and browser execution proves runtime behavior; static code inspection proves static text structure.
- **Environment Disambiguation**: When `.git` is unavailable inside Google AI Studio, the Google AI Studio GitHub Sync UI provides the authoritative unpushed-file scope evidence.
- **Manual Push Execution**: The user performs git push manually; independent post-push GitHub verification follows.

### 2. Architectural Integrity & Authority
- **Server Authority**: The backend (Node/Express/Firebase Admin) is the sole business authority for state transitions, pricing calculations, waybill creation, and persistent reconciliation.
- **Multi-Tenant Project Isolation**: Every data model, storage collection, outbox entry, and API route must enforce strict `projectId` scoping. Zero cross-tenant data leaks allowed.
- **No Second Business Authority**: Client components invoke server endpoints or shared pure domain services; they do not maintain duplicate calculation engines.
- **No Fabricated Data**: Production code paths must never inject fake GUIDs, dummy project IDs, or synthetic business metadata. Existing canonical ID-generation contracts must be preserved.

### 3. Engineering Work Discipline & Defect Resolution
- **Bounded Units**: Work strictly within one implementation unit at a time.
- **Area-Wide Defect Review**: Always perform a complete area-wide review before modifying files; identify and eliminate root causes across the entire component/module family.
- **Prohibition of Patch-by-Patch Stopping**: Never stop discovery at the first defect or apply quick single-line patches without addressing the full defect family.
- **Reconstruction Classifications**: Every component/service is classified as `KEEP`, `HARDEN`, `CONVERGE`, `REBUILD`, `RETIRE`, or `DEFER`.
- **Do Not Repair Retirement Candidates**: Do not waste effort repairing a component scheduled for retirement unless strictly required for safe retirement.

### 4. Distinct Evidence Classes
Verification must respect distinct evidence classes without treating one class as proving another:
- `STATIC`: Source-text inspection & regex structure checks.
- `UNIT`: Isolated Vitest domain logic tests.
- `INTEGRATION_MOCK`: React Testing Library component tests with mocked services.
- `EMULATOR`: Local Firebase emulator tests.
- `LIVE_E2E`: End-to-end multi-step workflow execution across server and UI.
- `MANUAL_UI`: RTL Arabic alignment, mobile touch viewports, visual layout inspection.
- `TYPECHECK`: `./node_modules/.bin/tsc --noEmit --pretty false`.
- `BUILD`: Production bundle compilation (`npm run build`).
- `GITHUB_POST_PUSH`: Independent audit of pushed GitHub commit.

### 5. Product Quality & UX Invariants
- **Responsive / Cross-Device Behavior**: Mobile field workflows, RTL Arabic alignment, touch targets, and desktop views are binding product invariants.
- **Canonical Print & Report Fidelity**: All printouts, waybills, statements, and exports derive strictly from canonical server snapshots.
- **Minimal Controls**: Avoid cluttering UI with artificial debug overlays or duplicate action buttons unless materially improving workflow and invoking the same canonical backend operation.
- **Human Approval Integrity**: Human sign-off and approval steps in workflows remain mandatory and cannot be bypassed.
