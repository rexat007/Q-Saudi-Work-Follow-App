# BLOCK 50 — LOW_RISK Controlled Expansion Diff

**Generated:** 2026-09-12T13:35:00.000Z
**Block:** 50
**Total Transformations Applied:** 1
**Files Modified:** 1

## Summary of Modified Files

- `src/components/offline/ConflictResolutionModal.tsx`: 1 transformation applied

## File Diffs

### `src/components/offline/ConflictResolutionModal.tsx`

```diff
@@ -103,7 +103,7 @@ export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = (
       TRIP_ALREADY_RETURNED: {
         label: 'الرحلة مرتجعة (TRIP_ALREADY_RETURNED)',
         color: 'bg-rose-100 text-rose-900 border-rose-300',
-        desc: 'تم تسجيل رفض أو إرجاع الشحنة على الخادم.'
+        desc: t('offline.labels.txt_5b9d20')
       },
       DUPLICATE_OPERATION: {
         label: 'عملية مكررة (DUPLICATE_OPERATION)',
```
