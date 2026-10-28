# ENGINEERING CONSTITUTION
## Binding Rules for Q-Saudi Reconstruction Program

### 1. Code & Environment Truth
- **GitHub Main Authority**: The GitHub `main` branch is the sole code truth.
- **Runtime Evidence Superiority**: Automated execution evidence overrides static assumptions or historical reports.
- **Execution Environment**: Work in Codex against the actual local Git repository. Inspect branch, HEAD and the complete working-tree diff; merged GitHub history is the accepted baseline. Historical editor workflows are not current operational authority.
- **Publication Authorization**: Implementation and documentation completion do not authorize a commit, publication, PR or merge. Follow the active unit's explicit owner instruction and stop at its local owner-review gate; owner merge remains manual. Independent verification is a separate evidence class.

### 2. Architectural Integrity & Authority
- **Server Authority**: The server is the sole business authority for state transitions, pricing calculations, waybill creation, and persistent reconciliation.
- **Multi-Tenant Project Isolation**: Every data model, storage collection, outbox entry, and API route must enforce strict `projectId` scoping. Zero cross-tenant leaks allowed.
- **No Second Business Authority**: Client components invoke server endpoints or shared pure domain services; they do not maintain duplicate calculation engines.
- **No Fabricated Data**: Production code paths must never inject fake GUIDs, dummy project IDs, or synthetic business metadata.

### 3. Engineering Work Discipline
- **Bounded Units**: Work strictly within one implementation unit at a time.
- **Area-Wide Defect Review**: Always perform a complete area-wide review before modifying files; identify and eliminate root causes across the entire component/module family.
- **Prohibition of Patch-by-Patch Stopping**: Never stop discovery at the first defect or apply quick single-line patches without addressing the full defect family.
- **Reconstruction Classifications**: Every component/service is classified as `KEEP`, `HARDEN`, `CONVERGE`, `REBUILD`, `RETIRE`, or `DEFER`.
- **Do Not Repair Retirement Candidates**: Do not waste effort repairing a component scheduled for retirement unless strictly required for safe retirement.

### 4. Product Quality & UX Invariants
- **Responsive / Cross-Device Behavior**: Mobile field workflows, RTL Arabic alignment, touch targets, and desktop views are binding product invariants.
- **Canonical Print & Report Fidelity**: All printouts, waybills, statements, and exports derive strictly from canonical server snapshots.
- **Minimal Controls**: Avoid cluttering UI with artificial debug overlays or duplicate action buttons unless materially improving workflow and invoking the same canonical backend operation.
- **Human Approval Integrity**: Human sign-off and approval steps in workflows remain mandatory and cannot be bypassed.

### Current-state and evidence boundary

This constitution supplies execution principles; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) alone owns current unit/phase status. Server authority and isolation are accepted architectural requirements, not a claim that all historical paths have passed live verification. Future product-facing work follows [acceptance governance](PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md). Existing valid foundation closures are preserved; new regressions are not excused by historical debt.
