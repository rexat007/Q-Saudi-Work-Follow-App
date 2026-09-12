# BLOCK 52 — Component-Safe LOW_RISK Migration & UI Metadata Hook Preparation Diff

**Execution Date:** 2026-09-12T14:05:00.000Z  
**Transformations Applied:** 4  
**Files Modified (Components):** 3  
**Hooks Created:** 2  
**Tests Created:** 1  

---

## 1. Component-Safe Transformations (Exact 4 Candidates)

### File 1: `src/components/offline/OutboxDrawer.tsx` (1 change)

```diff
@@ -288,3 +288,3 @@
     materials: 'المواد (Materials)',
     trucks: 'الشاحنات (Trucks)',
     drivers: t('offline.labels.txt_499f33'),
-    pricingRules: 'قواعد التسعير (Pricing Rules)',
+    pricingRules: t('offline.labels.pricing'),
   };
```

---

### File 2: `src/components/tripEngine/StateMachineController.tsx` (2 changes)

```diff
@@ -1017,7 +1017,7 @@
               {[
                 { st: 'DRAFT', label: '1. مسودة', sub: t('trips.labels.create_2'), roles: 'DISPATCHER' },
                 { st: 'LOADED', label: '2. تحميل ووزن', sub: t('trips.labels.txt_2f47a4'), roles: 'SCALE_OP' },
-                { st: 'IN_TRANSIT', label: '3. في الطريق', sub: 'تسعير معتمد', roles: 'DISPATCHER' },
+                { st: 'IN_TRANSIT', label: '3. في الطريق', sub: t('trips.labels.txt_304e68'), roles: 'DISPATCHER' },
                 { st: 'ARRIVED', label: '4. وصول الموقع', sub: t('trips.labels.txt_61ff0a'), roles: 'DRIVER/REC' },
                 { st: 'UNLOADING', label: '5. قيد التفريغ', sub: t('trips.labels.txt_4d1719'), roles: 'RECEIVER' },
-                { st: 'COMPLETED', label: '6. مكتملة ومسواة', sub: 'destNet + فرق', roles: 'RECEIVER' }
+                { st: 'COMPLETED', label: '6. مكتملة ومسواة', sub: t('trips.labels.txt_226b89'), roles: 'RECEIVER' }
               ].map((item, idx) => {
```

---

### File 3: `src/components/importCenter/WeighbridgeImportSection.tsx` (1 change)

```diff
@@ -255,3 +255,3 @@
             <button
               onClick={() => {
                 ExcelCsvTripCommitter.resetIdempotencyCache();
-                alert('تمت إعادة ضبط ذاكرة التحقق التكراري (Idempotency Cache) للاختبار.');
+                alert(t('weighbridge.messages.txt_5d74e2'));
               }}
```

---

## 2. Architectural Metadata Hooks Created (Preparation Step)

### File 4: `src/hooks/useExceptionTypeMeta.ts` (New Hook)

- **Purpose**: Provides reactive locale-aware labels and descriptions for all 12 `ExceptionType` definitions.
- **Consumers**: Prepared for future migration; existing consumers left untouched in BLOCK 52.

### File 5: `src/hooks/useDomainMeta.ts` (New Hook)

- **Purpose**: Provides reactive locale-aware presentation titles and descriptions for the 13 Firestore Architecture domains.
- **Consumers**: Prepared for future migration; existing consumers left untouched in BLOCK 52.

---

## 3. Dedicated Verification Suite

### File 6: `src/tests/metadataHooks.test.ts` (New Test Suite)

- **Tests**: 14/14 test cases covering hook structures, 12 exception types, 13 domains, 4 Component-Safe source changes, runtime translation resolution, and regression safety.
