# BLOCK 90A — SYSTEM TOOLS RATIONALIZATION REPORT

**Status:** APPROVED & EXECUTED
**Timestamp:** 2026-09-15T08:21:21.348Z

---

## 1. Summary

- **Production System Tools:** 5
- **Developer-Only Tools (SUPER_ADMIN):** 3
- **Merged / Retired UI Entries:** 5
- **RBAC Security Gating:** STRICTLY ENFORCED
- **I18N Parity:** AR = 1128 | EN = 1128 | UR = 1128

---

## 2. Production System Tools (5)

| ID | Category | Arabic Title | English Title | Access Roles |
|---|---|---|---|---|
| `ADMIN_CONSOLE` | SYSTEM_ADMIN | لوحة إدارة النظام (Admin Console) | Admin Console | SUPER_ADMIN, PROJECT_ADMIN |
| `SECURITY_AUDIT` | AUDIT_SECURITY | التدقيق الأمني والحوكمة (Security Audit) | Security Audit & Compliance | SUPER_ADMIN, PROJECT_ADMIN, FINANCE_AUDITOR |
| `EXCEPTION_ENGINE` | OPERATIONS_SUPPORT | محرك الاستثناءات (Exception Engine) | Exception Engine | SUPER_ADMIN, PROJECT_ADMIN, SUPERVISOR, SITE_SUPERVISOR |
| `IMPORT_CENTER` | OPERATIONS_SUPPORT | مركز الاستيراد الموحد (Import Center) | Unified Import Center | SUPER_ADMIN, PROJECT_ADMIN |
| `DATA_QUALITY` | OPERATIONS_SUPPORT | محرك جودة البيانات (Data Quality) | Data Quality Engine | SUPER_ADMIN, PROJECT_ADMIN |

---

## 3. Developer Mode Tools (3 — Restricted to SUPER_ADMIN)

| ID | Title (AR) | Title (EN) | Restriction |
|---|---|---|---|
| `TRIP_ENGINE` | محرك الرحلات وآلة الحالة (Trip Engine) | Trip Engine FSM | SUPER_ADMIN ONLY |
| `PRICING_ENGINE` | محرك التسعير والعقود (Pricing Engine) | Pricing Engine & Tests | SUPER_ADMIN ONLY |
| `DOCS` | المستندات المعمارية والمواصفات (Docs) | Architecture Specs & Docs | SUPER_ADMIN ONLY |

---

## 4. Merged & Retired UI Entries (5)

| Obsolete Entry ID | Primary Merged Location | Underlying Code Preserved |
|---|---|---|
| `WORKSPACE_INTEGRATION` | Project Workspace (`WIZARD`) -> Google Workspace Tab | YES |
| `LEGACY_MIGRATION` | Import Center (`IMPORT_CENTER`) -> Legacy Migration Tab | YES |
| `FIRESTORE_ARCH` | Documentation (`DOCS`) -> Firestore Schema Sub-tab | YES |
| `RELATIONS` | Documentation (`DOCS`) -> Entity Relations Sub-tab | YES |
| `PRINCIPLES` | Documentation (`DOCS`) -> 12 Invariants Sub-tab | YES |

---

## 5. Security & RBAC Enforcements

- **Role Gate:** Developer mode items (`TRIP_ENGINE`, `PRICING_ENGINE`, `DOCS`) return an empty list for all non-SUPER_ADMIN roles.
- **Server Auth:** No server authorization or operational privileges bypassed.
- **Layout Integrity:** System Tools drawer and Security Audit view containers formatted with flex alignment, icon frames (`shrink-0`), and mobile responsive drawered panels.
