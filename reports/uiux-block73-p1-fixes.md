# BLOCK 73: P1 Directional UX Fixes Report

**Date**: 2026-09-13  
**Status**: COMPLETED  
**Source Recovery Point**: BLOCK 72 (`reports/uiux-rtl-audit-block72.json`)  
**Translation Layer Status**: FROZEN (1,128 keys per locale, 0 drift)  
**Authorized Scope**: Fix ONLY the two P1 findings from BLOCK 72 audit (`AUDIT-72-01`, `AUDIT-72-02`)

---

## 1. Executive Summary

In BLOCK 73, the two authorized P1 directional visual issues identified in the BLOCK 72 audit were addressed. The implementation followed a zero-regression, zero-i18n-churn policy:

- **P1 Findings Fixed Count**: `2` (`AUDIT-72-01` and `AUDIT-72-02`)
- **Files Changed**: `3`
  - `src/components/offline/OutboxDrawer.tsx`
  - `src/components/tripEngine/LoadingStation.tsx`
  - `src/components/wizard/ProjectSetupWizard.tsx`
- **I18N Status**: **I18N remains FROZEN** (Arabic: 1,128, English: 1,128, Urdu: 1,128 keys).
- **P2 / P3 Status**: **No P2/P3 work was performed.** `LanguageSwitcher.tsx`, table borders, search inputs, and mobile presets remain deferred to subsequent blocks.

---

## 2. Detailed Findings & Exact Behavior Before / After

### Fix 1: AUDIT-72-01 — Outbox Drawer Directional Overlay
- **Component**: `src/components/offline/OutboxDrawer.tsx`
- **Root Cause**: The drawer outer overlay had hardcoded `dir="rtl"` and `justify-end`, while the drawer body had hardcoded `border-r border-stone-200` and `text-right`. In English (`en`, LTR), this forced the drawer to render on the left edge with right-aligned text and an inner right border.
- **Before**:
  ```tsx
  <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl">
    <div className="w-full max-w-2xl h-full bg-stone-50 border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-right">
  ```
- **After**:
  ```tsx
  <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/50 backdrop-blur-xs transition-opacity" dir={direction}>
    <div className="w-full max-w-2xl h-full bg-stone-50 border-e rtl:border-l ltr:border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-start">
  ```
  Additionally, all 7 conflict simulation buttons (`PRICING_CHANGED`, `VERSION_CONFLICT`, etc.) were updated from physical `text-right` to logical `text-start`.
- **RTL Behavior**:
  - Drawer root sets `dir="rtl"`.
  - `justify-start` places the drawer on the right edge (RTL start).
  - `rtl:border-l` applies the divider border on the left edge facing the backdrop and content.
  - `text-start` aligns text to the right.
- **LTR Behavior**:
  - Drawer root sets `dir="ltr"`.
  - `justify-start` places the drawer on the left edge (LTR start).
  - `ltr:border-r` applies the divider border on the right edge facing the backdrop and content.
  - `text-start` aligns text to the left.
- **Preservation**: Drawer dimensions (`max-w-2xl h-full`), backdrop blur, tab switching, queue operations, and sync logic are completely unchanged.

---

### Fix 2: AUDIT-72-02 — Previous / Next Navigation Arrows Direction
- **Components**:
  - `src/components/tripEngine/LoadingStation.tsx`
  - `src/components/wizard/ProjectSetupWizard.tsx`
- **Root Cause**: Both workflow wizards hardcoded `<ArrowRight className="w-4 h-4" />` for "Previous" and `<ArrowLeft className="w-4 h-4" />` for "Next". While this matched reading direction in RTL (where backward is right and forward is left), in LTR (English) it inverted the natural reading direction.
- **Before**:
  - Previous: `<ArrowRight className="w-4 h-4" /> <span>السابق</span>`
  - Next: `<span>...</span> <ArrowLeft className="w-4 h-4" />`
- **After**:
  - Previous: `{isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} <span>السابق</span>`
  - Next: `<span>...</span> {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}`
- **RTL Behavior**:
  - Previous button shows `ArrowRight` (points rightwards `→` into RTL past).
  - Next button shows `ArrowLeft` (points leftwards `←` into RTL future).
- **LTR Behavior**:
  - Previous button shows `ArrowLeft` (points leftwards `←` into LTR past).
  - Next button shows `ArrowRight` (points rightwards `→` into LTR future).
- **Preservation**:
  - Button labels: `السابق` and `التالي` remain byte-for-byte identical.
  - Button IDs and classes: `#btn-wizard-prev` and `#btn-wizard-next` preserved.
  - Navigation handlers: `goToPrevStep` and `goToNextStep` preserved.
  - Step progression, validation gates, and state machine workflows remain 100% untouched.

---

## 3. Bidirectional UX Verification Matrix

| Locale | Direction | Outbox Drawer Alignment | Outbox Inner Divider | Outbox Text Flow | Previous Arrow | Next Arrow |
|---|---|---|---|---|---|---|
| **Arabic (`ar`)** | `rtl` | Right (start) | Left (`border-l`) | Right (`text-start`) | Right (`→`) | Left (`←`) |
| **Urdu (`ur`)** | `rtl` | Right (start) | Left (`border-l`) | Right (`text-start`) | Right (`→`) | Left (`←`) |
| **English (`en`)** | `ltr` | Left (start) | Right (`border-r`) | Left (`text-start`) | Left (`←`) | Right (`→`) |

---

## 4. Safety Audit & Non-Regression Confirmation

1. **I18N Freeze Confirmation**:
   - `src/locales/ar/index.ts`: 1,128 keys (Unchanged)
   - `src/locales/en/index.ts`: 1,128 keys (Unchanged)
   - `src/locales/ur/index.ts`: 1,128 keys (Unchanged)
   - `BLOCK 71` freeze gate suite passed with 20/20 assertions.
   - **I18N remains FROZEN**.
2. **Business Logic & Pricing**:
   - No pricing engine files or calculations modified (`tripEngine.service.ts`, `pricingService.ts` untouched).
   - No state machine files modified (`tripStateMachine.service.ts` untouched).
   - No security or auth logic modified.
3. **No P2 / P3 Work**:
   - P2 findings (`AUDIT-72-03` through `AUDIT-72-07`) and P3 findings (`AUDIT-72-08` through `AUDIT-72-10`) were deliberately left untouched and preserved as documented in `reports/uiux-rtl-audit-block72.json`.
