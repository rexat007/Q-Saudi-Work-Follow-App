# GWS2 — background Google authorization boundary

Current unit/status authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).
This is the bounded design for GWS2-C, not an implemented worker or live acceptance.

## Ownership and authorization

Retain human-user ownership and narrow `drive.file` + `spreadsheets` permissions for binding/projection. Apps Script permission belongs to optional automation. A service account is not a transparent substitute for a user's Picker grant or resource ownership.

Use an explicit server-side authorization-code flow with offline consent. Bind a short-lived, single-use CSRF/PKCE transaction to the current Firebase principal and Project. Validate callback origin/redirect, current server Project authorization, Google subject against both the Firebase provider account and existing Project binding, token audience and required granted scopes. Reauthorization must not change a bound Google subject without the existing explicit migration/recovery decision.

Exchange the one-use code on the server. Keep refresh credentials outside Project business documents in a server-only collection, with browser reads/writes denied even to administrators. Encrypt refresh credentials using authenticated encryption (AES-256-GCM or equivalent), random nonce, key version and associated data binding Project/authorization/subject. Key material belongs in hosting secret configuration, never Firestore, source, browser storage, logs or this chat. Do not retain raw access tokens as long-term credentials. Fail closed when secure configuration is absent. Rotation and revocation must be explicit and audited; revoke/delete the secret while retaining the non-secret binding/history.

## One delivery authority

Extend the existing `workspace_sync_outbox` and `workspace_projection_state/current`; do not introduce a competing business or sync engine. The worker claims expiring Project leases transactionally, validates current grant/principal scope, refreshes authorization server-side, loads current Firestore snapshots, verifies the Project binding, writes only dirty domains, and acknowledges only the claimed unchanged revisions. Stale/racing acknowledgments leave work pending. Transient/provider failures preserve the binding and pending work; revoked authorization becomes AUTHORIZATION_REQUIRED; missing/moved/inaccessible bound files become BOUND_FILE_UNAVAILABLE with no replacement.

Master-data writes use stable canonical IDs and current Project participation/temporal relationships. Operational writes retain approved Trip/Ticket correlation and event-time snapshots. No Sheet-to-Firestore master mutation is authorized here. Global entity changes need explicit Project fan-out and durable invalidation, including Projects whose membership/affiliation is suspended/removed; existing command dirty markers alone are not proof of full coverage.

## External prerequisites and remaining implementation

GWS2-C is NOT_STARTED. It still needs the code-flow endpoints, secure credential store/key handling, revocation, one leased worker and server scheduling. The environment has no configured server OAuth client secret, Workspace credential encryption key or return-URI configuration, and no independently verified offline Google grant. Do not substitute fixture tokens or browser-token requests and declare autonomy.

Live acceptance requires deployed callback/secret configuration, owner consent through that deployed flow, real Firebase/Google access and a test showing a canonical mutation reaches the existing Sheet after the browser closes. No production credential should be pasted into a conversation. GWS2-A local tests and a successful build do not satisfy this acceptance gate.
