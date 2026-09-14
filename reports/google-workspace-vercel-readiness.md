# GOOGLE DRIVE / SHEETS VERCEL READINESS AUDIT

**Audit Date:** September 14, 2026  
**Application:** Q-Saudi-Work-Follow  
**Mode:** READ ONLY — NO CODE CHANGES — NO DEPLOYMENT  

---

## 1. Executive Summary & Deterministic Statuses

| Component / Requirement | Status | Summary |
|---|---|---|
| **DRIVE INTEGRATION** | **`READY`** | Fully implemented in `server/workspace.service.ts` & `src/services/workspace.service.ts` |
| **SHEETS INTEGRATION** | **`READY`** | Fully implemented across all 6 operational tabs with idempotent upserts |
| **GOOGLE_WORKSPACE_READY** | **`YES`** | Code structure, OAuth flows, and fallback handling are completely built |
| **VERCEL_SERVER_REQUIRED** | **`PARTIAL`** | Client SPA runs standalone on Vercel. Server API routes can run as Vercel Serverless Functions |
| **CLOUD RUN REQUIRED** | **`NO`** | No dedicated external container host is mandatory |
| **CAN REMAIN DISABLED** | **`YES`** | Core application relies on Firestore as Source of Truth; Drive/Sheets is an optional projection |
| **BLOCKERS** | **`NONE`** | Zero architectural or code blockers identified |

---

## 2. Integration Capabilities

### Google Drive Integration (`READY`)
- **Folder Provisioning**: Creates `[Q-Saudi] <ProjectName>` root folder with `imported files`, `reports`, and `printable documents` subfolders.
- **Document Upload**: Encodes and uploads tickets, reports, and attachments directly to specified Drive subfolders.
- **Drive File Discovery**: Lists available Excel and CSV files from project Drive folders for the import pipeline.
- **Drive Stream Intake**: Downloads raw file bytes directly from Drive for unified client-side intake.

### Google Sheets Integration (`READY`)
- **Spreadsheet Provisioning**: Automates 6 operational tabs (`العمليات`, `السائقين`, `الناقلين`, `المواد`, `الاستثناءات`, `تقارير مختارة`).
- **Idempotent Upsert**: Updates or inserts records without duplicating existing entries using primary key mapping (`tripId`, `driverId`, `carrierId`, `materialId`, `exceptionId`, `reportCode`).
- **Discovery & Extraction**: Discovers existing spreadsheets, metadata, tab lists, and reads 2D cell value arrays for data import.

---

## 3. Environment Variables & Credentials Setup

### Required Environment Variable Names Only
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_OAUTH_CLIENT_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

### Values from Google Cloud Console
1. **OAuth 2.0 Web Client ID** -> `VITE_FIREBASE_OAUTH_CLIENT_ID`
2. **Web API Key** -> `VITE_FIREBASE_API_KEY`
3. **Project ID** -> `VITE_FIREBASE_PROJECT_ID`
4. **Auth Domain** -> `VITE_FIREBASE_AUTH_DOMAIN`

---

## 4. Google Cloud Console Configuration

### Required Google APIs to Enable
1. **Google Drive API** (`drive.googleapis.com`)
2. **Google Sheets API** (`sheets.googleapis.com`)
3. **Identity Toolkit API** (`identitytoolkit.googleapis.com`)

### Required OAuth Scopes
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`
- `openid`
- `email`
- `profile`

### Required Preview Callback & Redirect URLs
- **Firebase Auth Handler**: `https://<PROJECT_ID>.firebaseapp.com/__/auth/handler`
- **Authorized Origins (JavaScript Origins)**:
  - `https://<your-app-name>.vercel.app`
  - `https://<PROJECT_ID>.firebaseapp.com`
  - `http://localhost:3000`

---

## 5. Vercel Architecture & Server Requirements

1. **Can current `server.ts` routes run on Vercel?**  
   **`PARTIAL`**. The client application is a single-page React app (SPA) that compiles to static assets served directly by Vercel. For `/api/workspace/*` server endpoints, `server.ts` Express routes can be wrapped as Vercel Serverless Functions (via `/api` rewrites) without code restructuring.

2. **Is a Cloud Run / External Backend required?**  
   **`NO`**. Cloud Run is not mandatory. Vercel can serve the SPA directly while executing lightweight Express handlers as Serverless Functions.

3. **Can Drive/Sheets remain disabled without affecting the app?**  
   **`YES`**. The primary source of truth for all business state (trips, scale weighbridge, master data, pricing engine, supervisor approvals, audit logs) is **Firestore**. Google Workspace functions as a secondary projection layer. If unconfigured or disabled, the application operates 100% cleanly with zero impact.

---

## 6. Final Status Summary

```text
GOOGLE_WORKSPACE_READY = YES
VERCEL_SERVER_REQUIRED = PARTIAL
BLOCKERS = NONE
```
