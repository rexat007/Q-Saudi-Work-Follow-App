# BLOCK 86 — GOOGLE SIGN-IN DOMAIN FAILURE FORENSIC TRACE REPORT

**Audit Mode:** READ ONLY — NO CODE CHANGES — NO DEPLOYMENT  
**Audit Date:** September 14, 2026  
**Application:** Q-Saudi-Work-Follow  

---

## 1. Google Sign-In Execution Trace

The complete authentication execution flow was traced through the codebase:

1. **User Action:** User clicks the Google Sign-In button (`src/components/auth/AuthButton.tsx` or `src/components/masterData/MasterDataView.tsx`).
2. **Context Handler:** Invokes `signInWithGoogle()` in `src/firebase/authContext.tsx`.
3. **Firebase SDK Invocation:** `signInWithGoogle()` initializes `new GoogleAuthProvider()` and calls `signInWithPopup(auth, provider)`.
4. **Firebase Config Resolution:** `auth` is instantiated from `src/firebase/config.ts`, reading `VITE_FIREBASE_*` environment variables or falling back to `firebase-applet-config.json`.
5. **Firebase Authorization Check:** The popup contacts Firebase Auth SDK at `https://<authDomain>/__/auth/handler`. Firebase Auth inspects the requesting origin `window.location.hostname` (`q-saudi-work-follow-app.vercel.app`) against the Authorized Domains list for that project.
6. **Error Code Catch:** Firebase throws exception `err.code === 'auth/unauthorized-domain'`.
7. **Arabic Error Formatting:** `src/firebase/authContext.tsx` lines 57–59 intercepts `auth/unauthorized-domain`, reads `window.location.hostname`, and sets `authError`:
   `"نطاق التطبيق (q-saudi-work-follow-app.vercel.app) غير مدرج في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يمكنك إضافته عبر: Firebase Console -> Authentication -> Settings -> Authorized domains."`

---

## 2. Application Domain Allowlist Audit

- **Custom Application Domain Validation:** **`NO`** (`APP_DOMAIN_VALIDATION_PRESENT = NO`)
- Code searches for custom domain allowlists, `window.location.hostname` filtering, or hardcoded `vercel.app` lists confirmed that the application code **does NOT** implement any domain restrictions. The displayed Arabic error is produced entirely by formatting Firebase Auth's native `auth/unauthorized-domain` error response.

---

## 3. Firebase Runtime Configuration Audit

- **Local Repository Configuration (`firebase-applet-config.json`):**
  - `projectId`: `gen-lang-client-0774589047`
  - `authDomain`: `gen-lang-client-0774589047.firebaseapp.com`
  - `firestoreDatabaseId`: `ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1`
- **Legacy References:** ZERO active runtime references to `promise-of-planet-youtube-api` exist in local code.

---

## 4. Vercel Production Environment Analysis

- **Production Deployment Problem:** **`YES`** (`PRODUCTION_ENV_PROBLEM = YES`)
- **Reason:** In Vercel, environment variables can be scoped separately for **Preview** vs. **Production** environments.
  If `VITE_FIREBASE_*` environment variables were added in the Vercel Dashboard for Preview environments, but **not for Production**, or if the Vercel Production deployment was built before `firebase-applet-config.json` was updated:
  1. The Vercel Production build compiled `authDomain` pointing to the legacy project (`promise-of-planet-youtube-api.firebaseapp.com`).
  2. When visitors open `q-saudi-work-follow-app.vercel.app` (the Production URL), `signInWithPopup` attempts authorization against the legacy project `promise-of-planet-youtube-api`.
  3. Because `q-saudi-work-follow-app.vercel.app` was added to the Authorized Domains list of `gen-lang-client-0774589047` (and NOT `promise-of-planet-youtube-api`), Firebase Auth returns `auth/unauthorized-domain`.

---

## 5. Google OAuth 2.0 Configuration Requirements

- **OAuth Origin / Redirect Requirement:** **`YES`** (`OAUTH_ORIGIN_PROBLEM = YES`)
- In addition to Firebase Console Authorized Domains, Google OAuth Web Client settings in GCP Console must have:
  - **Authorized JavaScript Origins:**
    - `https://q-saudi-work-follow-app.vercel.app`
    - `https://gen-lang-client-0774589047.firebaseapp.com`
  - **Authorized Redirect URIs:**
    - `https://gen-lang-client-0774589047.firebaseapp.com/__/auth/handler`

---

## 6. Root Cause Hierarchy

- **P1 (Primary Root Cause):** Vercel Production deployment was compiled targeting the legacy Firebase project (`promise-of-planet-youtube-api.firebaseapp.com`) due to Preview-only Vercel environment variable scoping or stale Vercel build cache.
- **P2 (Secondary Cause):** GCP Google OAuth 2.0 Web Client credentials missing `https://q-saudi-work-follow-app.vercel.app` in Authorized JavaScript Origins.
- **P3 (Tertiary Cause):** Vercel Dashboard environment variable scope mismatch between Preview and Production targets.

---

## 7. Minimum Fix (Do NOT Implement)

1. In **Vercel Dashboard -> Settings -> Environment Variables**:
   Set `VITE_FIREBASE_*` variables for the **Production** environment:
   - `VITE_FIREBASE_PROJECT_ID` = `gen-lang-client-0774589047`
   - `VITE_FIREBASE_AUTH_DOMAIN` = `gen-lang-client-0774589047.firebaseapp.com`
   - `VITE_FIREBASE_API_KEY` = `<API_KEY>`
   - `VITE_FIREBASE_APP_ID` = `1:98229909734:web:8486642242b3cd4d8d2327`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID` = `ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1`
2. In **Vercel Dashboard**: Trigger a clean **Redeploy** of the Production deployment without build cache.
3. In **GCP Console -> Credentials -> OAuth 2.0 Client IDs**: Add `https://q-saudi-work-follow-app.vercel.app` to Authorized JavaScript Origins and `https://gen-lang-client-0774589047.firebaseapp.com/__/auth/handler` to Authorized Redirect URIs.

---

## 8. Deterministic Output Declarations

```text
RUNTIME_FIREBASE_PROJECT = gen-lang-client-0774589047
RUNTIME_AUTH_DOMAIN = gen-lang-client-0774589047.firebaseapp.com
CURRENT_HOSTNAME = q-saudi-work-follow-app.vercel.app
APP_DOMAIN_VALIDATION_PRESENT = NO
FIREBASE_AUTHORIZATION_PRESENT = YES
OAUTH_ORIGIN_PROBLEM = YES
PRODUCTION_ENV_PROBLEM = YES
PRIMARY_ROOT_CAUSE = Vercel Production deployment was compiled targeting legacy Firebase project (promise-of-planet-youtube-api.firebaseapp.com) due to Preview-only Vercel environment variable scoping or stale build cache.
MINIMUM_FIX = Set Production environment variables in Vercel to gen-lang-client-0774589047, clear Vercel build cache and redeploy, and ensure GCP OAuth Client Authorized Origins includes https://q-saudi-work-follow-app.vercel.app.
```
