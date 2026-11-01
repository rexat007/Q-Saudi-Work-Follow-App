## Owner policy — dormant background capability

Exact state is [the ledger](02_PHASE_LEDGER.md). CURRENT_SYNC_TRIGGER = USER_ACTIVE / REQUEST_DRIVEN; SCHEDULED_BACKGROUND_WORKER = NOT_REQUIRED; CRON_JOB = NOT_DEPLOYED. No scheduler or new offline grant setup is required for current operational-engine acceptance. CONNECTED encrypted grants are the preferred credential authority for authorized active requests; browser credentials are ephemeral/memory-only fallback only when no durable grant exists. Credential/identity/scope failures never fall back. The shared resolver covers initialize, retry-sync and automation recovery. AUTHORIZATION_REQUIRED requires explicit reauthorization. The scheduled worker is retained as dormant future capability; server refresh authorization is active for user-triggered requests. CREDENTIAL_AUTHORITY = SERVER_REFRESH_WHEN_CONNECTED; BROWSER_GOOGLE_TOKEN = EPHEMERAL / MEMORY_ONLY; CRON = NOT_REQUIRED. The technical protocol and optional future deployment instructions below are preserved, but are not instructions to deploy cron now. Actual browser-closed acceptance is not claimed. See [the operational contract](OPERATIONAL_PROFILES_WORKSPACE_ENGINE_CONTRACT.md).

# Implemented Workspace background authorization and delivery

Current state authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). This is implemented source, superseding the earlier design-only GWS2-C record. Source/local tests do not establish deployment or live acceptance.

## Trust and credential boundaries

`workspaceGoogleOfflineAuthorization.server.ts` owns start/callback/refresh/revocation. `workspaceGoogleOffline.adapter.ts` performs Google code/token protocol. The normal Firebase login is unchanged. A current Project administrator starts a 10-minute, browser-cookie-bound, single-use PKCE S256/state/nonce transaction. Callback rechecks current Project authority, immutable binding/revision, Google subject against the Firebase provider account and binding, ID-token issuer/audience/nonce, and required Sheets/drive.file grants. Optional Script scope is requested only for automation; declining it does not discard a usable binding/sync grant or weaken the separate Script installer check.

The exact server-configured callback is used for the authorization URL and code exchange. Transaction consumption happens before external exchange; a failed exchange needs fresh consent rather than replay. An HttpOnly/Secure/SameSite=Lax cookie and state hash bind the callback to its originating browser. PKCE verifier is encrypted in the short-lived server transaction. A CSP-restricted completion page sends only Project ID/result to the exact configured opener origin; the client additionally checks message origin, popup source and current Project/account intent. No token/code/state/provider identity is reflected into the completion page. Callback query strings must also be excluded from hosting/proxy access logs; the application never logs them.

Server-only root collections `workspace_google_oauth_transactions` and `workspace_google_authorizations` are covered by existing Firestore default-deny client rules, including for administrators. No browser rule grants access. Refresh credentials are AES-256-GCM ciphertext with random 96-bit nonce, authentication tag and key version; AAD binds Project, Google subject and authorization ID. Raw access tokens are transient server memory. Credential ciphertext is not stored in Project business documents. Continuity stores only the non-secret authorization pointer/status. No refresh credential reaches a browser or application API DTO. API output/logs contain no raw provider payload.

Reauthorization atomically supersedes/removes the previous local secret and installs a new canonical grant, without changing the Sheet or Google subject. Refresh verifies audience, current subject and required scopes. Revoked/invalid grants become AUTHORIZATION_REQUIRED while binding remains CONNECTED. Transient refresh/provider errors preserve active grant and pending work with degraded sync. Explicit revoke deletes local usable credential material before best-effort Google revocation, even if Google/configuration is unavailable. Existing type/lint debt is not waived.

## One worker and one delivery authority

`server/workspaceSyncWorker.ts` discovers active authorization records, ignores superseded/noncanonical pointers, examines existing Project outboxes and invokes `ProjectGoogleWorkspaceServer.initializeBound` or `retrySync`. The same canonical snapshot, RAW writer, operational event contract and acknowledgment path serve browser-triggered and unattended requests. No parallel engine, business database or Sheet-to-Firestore ingestion is added.

A Project lease records owner, claim time, expiry and binding revision. It renews every 30 seconds, expires after 120 seconds and fences every provider HTTP request and acknowledgment. A worker cannot reclaim an unexpired owner. Legacy owners lacking expiry first receive a 120-second quarantine expiry. Current principal, canonical active grant, Project/binding/subject and lease/revision are revalidated; revocation or replacement prevents acknowledgment. All provider requests use 15-second timeouts and no hidden retries. An already-in-flight Google mutation cannot participate in a Firestore transaction: timeout outcomes remain uncertain and are recovered through stable IDs/current-snapshot replay. No distributed atomicity is claimed.

## Optional future background hosting configuration (not a current prerequisite)

| Variable | Purpose |
| --- | --- |
| `GOOGLE_WORKSPACE_CLIENT_ID` | The approved Google web OAuth client in the same application project used for Picker/drive.file resource access |
| `GOOGLE_WORKSPACE_CLIENT_SECRET` | Server-only OAuth client secret |
| `GOOGLE_WORKSPACE_REDIRECT_URI` | Exact approved callback, e.g. `https://q-saudi-work-follow-app.onrender.com/workspace/google/callback` |
| `GOOGLE_WORKSPACE_CREDENTIAL_KEY` | Hosting-generated base64 encoding of exactly 32 random bytes for AES-256-GCM |
| `GOOGLE_WORKSPACE_CREDENTIAL_KEY_VERSION` | Non-secret key version; defaults to `v1` |
| `GOOGLE_WORKSPACE_PREVIOUS_CREDENTIAL_KEYS` | Optional server-secret JSON map from old versions to base64 keys during controlled rotation |
| Existing Firebase Admin configuration | Same production Project/database and server-only access as the web service, using existing supported ADC or `FIREBASE_SERVICE_ACCOUNT_KEY` |

The source fails closed for missing/invalid settings; no dummy grant, mock token or service-account Google ownership substitution is used. Keep the existing client-side Google settings/Picker application consistent with this OAuth app. Register the exact redirect in Google Cloud; enable Drive, Sheets and Apps Script APIs as applicable and approve required consent/test users. Apps Script scope is optional for binding/sync and required for automation installation. Do not expand to full Drive scope.

## Optional future background deployment steps — not current instructions

1. Owner reviews/merges the source branch and deploys web/API from the same artifact generation. No source publication is a live acceptance claim.
2. Configure the variables above in hosting secret settings, including the exact Google-approved callback. Do not commit secret files or paste values into chat.
3. Deploy one Render Cron Job or equivalent scheduled background process from the SAME repository/revision/environment. A suitable build command is `npm ci && npx esbuild scripts/run-workspace-sync-worker.ts --bundle --platform=node --format=cjs --packages=external --outfile=server-dist/workspace-worker.cjs`. Start command: `node server-dist/workspace-worker.cjs`. Run once per minute or the owner-approved interval. It exits after one pass; no browser or public unauthenticated worker endpoint is needed. Preserve Firebase database configuration and runtime dependencies in this process. Multiple overlapping runs remain Project-lease fenced.
4. Recover Q-PRJ-007 using the existing stored IDs/receipt. In the connected card enable automatic Google synchronization once, using the approved account; the authorization popup does not select another destination or change Firebase login. Callback completion initializes through the canonical service. No manual sync dependency remains after scheduled delivery is configured.
5. Perform all live acceptance checks below. If configuration/consent/scheduler is unavailable, record LIVE_AUTONOMY_ACCEPTANCE_BLOCKED; source implementation is still complete.

Key rotation: deploy new key/version, retain old versioned keys only in hosting secret keyring while existing grants are reauthorized, then remove retired keys. Do not delete old keys before migration/reauthorization or relabel unreadable ciphertext as a healthy grant. Operational retention/TTL of expired OAuth transaction metadata should be configured under the owner's retention policy; no code or raw verifier remains after consumption.

## Future background live acceptance — not a current gate

No real Google grant/resource mutation or Q-PRJ-007 recovery was executed here. Verify on the existing Sheet: binding visible/setup gone/Open Sheet available; seven approved operational tabs and structure repair preserve inputs/review data; approved Script package verified or explicit automation-degraded state; four master projections; create/update/suspend/remove and temporal changes preserve stable rows/Project isolation/history; close browser, queue controlled canonical mutation, run scheduler and verify delivery/acknowledgment. Test revoked access, missing file, provider failure and retry without new resource creation. Historical SCRIPT_REQUESTED with no recoverable Script ID remains inconclusive and must not cause blind Script duplication; Google has no get-bound-project-by-parent API. Binding and Sheets sync remain usable independently.

SOURCE_COMPLETE / LOCAL_VERIFIED, DEPLOYED, LIVE_BINDING_ACCEPTED, LIVE_MASTER_SYNC_ACCEPTED, LIVE_AUTOMATION_ACCEPTED and LIVE_BACKGROUND_SYNC_ACCEPTED are separate gates. Whole product COMPLETE requires the applicable live gates, not just fixtures/build.

Local source verification checks approved Script content/parent/manifest and absence of installable-trigger dependencies in the package. The Apps Script REST content API does not enumerate existing trigger instances; no claim that historical live trigger instances were inspected or removed is made. Their zero-installable-trigger live acceptance remains part of the owner’s actual workbook audit.
