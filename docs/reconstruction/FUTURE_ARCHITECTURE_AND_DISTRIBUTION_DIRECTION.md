# Q-Saudi Future Architecture & Distribution Direction

Status:
FUTURE DEVELOPMENT PROPOSAL

Execution:
NOT STARTED

Current Priority:
NO

Implementation Authorization:
NOT GRANTED

Effect on Current Reconstruction:
ARCHITECTURAL AWARENESS ONLY

## Governance
This document describes a possible future architecture and distribution direction for Q-Saudi.
- It does not create an active Unit, Block, Slice, Phase, or implementation authorization.
- It does not change the priority or order of the current reconstruction.
- It does not authorize refactoring stable components solely for future portability.
- Current reconstruction remains focused on achieving a stable Beta 2, real-world project use, operational feedback, and defect remediation.
- Future implementation requires a separate explicit decision after real operational validation.

## Current Priority
1. Complete current reconstruction and remediation.
2. Reach a stable usable release.
3. Operate Q-Saudi on real projects.
4. Collect operational feedback and defects.
5. Improve the product based on real usage.

## Future Product Direction
Q-Saudi may evolve from a deployment tied to one operating environment into a separately deployable product for independent companies. Each company would operate its own isolated environment.

- No shared business database between companies.
- No mandatory central tenant database owned by the Q-Saudi developer.
- Central shared services, if any, must be explicitly bounded, such as licensing.

## Future Access Model
Q-Saudi Company Backend would support multiple clients (Windows Desktop Application, Web Browser, PWA / Mobile Access).
All clients would connect to the same company-owned backend, database, authentication boundary, and authorization model.
Possible onboarding modes: Create New Company, Join Existing Company.
Join Existing Company must not expose database/secret credentials to ordinary users.

## Infrastructure Independence Direction
Future architecture may abstract infrastructure providers (Authoritative Database Provider, Configured Storage Provider).
Potential adapters: PostgreSQL, SQLite, Firestore (Database); Local Disk, Google Drive, S3, MinIO (Storage).
- This does NOT authorize removal of Firebase or Google Drive from the current version.
- This does NOT authorize adapter implementation now.

## Current Architectural Guidance
- Keep Business Rules separated from Infrastructure.
- Keep Domain Logic free from provider-specific dependencies where practical.
- Prefer Repository / Service boundaries.
- Avoid new direct Firebase-specific logic inside domain/business rules unless genuinely required.
- Avoid new direct Google Drive dependencies inside Business Core.
- Preserve server-authoritative architecture.
- Keep Authentication, Persistence, and Storage behind clear boundaries where possible.
- Do NOT refactor stable code solely to prepare for this possible future model.

## Future Commercial Licensing Direction
FINAL DISTRIBUTION / LICENSING MODEL = UNDECIDED.
Preferred principle: One Company License bound to one Company Environment, with multiple users/devices. Do NOT bind licensing to individual employee devices.
Separation of Concerns: Installation/Company License governs commercial entitlement/limits, while User Authentication/Authorization governs project access and functional permissions.
Digital Signature: Asymmetric verification model where license server signs tokens, verified by a public key embedded in Q-Saudi runtime.
Offline Licensing: Must account for connectivity loss; final grace-period policy is undecided.

## Future Target Architecture
Q-Saudi Platform
│
├── Desktop Client
├── Web Client
├── PWA / Mobile Client
│
├── Company Server
│
├── Configurable Database Provider
├── Configurable Storage Provider
│
├── Company-Level Licensing
└── Central License Service

## Non-Goals / Hard Guardrails
This proposal does NOT authorize:
- multi-company implementation
- tenant migration
- replacing Firebase
- replacing Google Drive
- PostgreSQL implementation
- SQLite implementation
- S3/MinIO integration
- Desktop application packaging
- central license server development
- serial number implementation
- activation workflows
- server fingerprint implementation
- license token implementation
- offline grace enforcement
- cryptographic key generation
- commercial feature entitlements
- changes to current reconstruction order

## Future Entry Gate
Implementation may only begin after:
- current reconstruction completed
- stable usable release achieved
- application used on real projects
- operational feedback collected
- major current defects remediated
- explicit architectural review performed
- distribution model explicitly selected
- licensing/open-source strategy explicitly selected
- new implementation authorization granted
