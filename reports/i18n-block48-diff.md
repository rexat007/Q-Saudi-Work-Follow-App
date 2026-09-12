# BLOCK 48 — Controlled i18n Migration: Transformation Diff Report

**Generated At:** 2026-09-12T12:05:44.313Z
**Execution Mode:** SAFE Batch Applied
**Files Modified:** 7
**Total Safe Candidates Applied:** 228

---

## File: `/app/applet/src/components/offline/ConflictResolutionModal.tsx`

- **Pre-Migration Hash:** `ca42cbd0b3accb57`
- **Post-Migration Hash:** `08e991fb7d220861`
- **Transformations Applied:** 30
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (30):**
  - `offline.labels.txt_3ba53d`
  - `offline.labels.cancel_2`
  - `offline.labels.txt_4e1b80`
  - `offline.labels.txt_3d5113`
  - `offline.labels.txt_4d4137`
  - `offline.labels.cancelTrip`
  - `offline.labels.truck_2`
  - `offline.labels.txt_305c29`
  - `offline.status.cancelSuccess`
  - `offline.labels.txt_604d7b`
  - `offline.labels.deleteSave`
  - `offline.labels.cancel`
  - `offline.status.closeTrip`
  - `offline.labels.txt_60c85c`
  - `offline.labels.txt_3d9611`
  - `offline.labels.txt_184f19`
  - `offline.labels.txt_47cf18`
  - `offline.labels.txt_4c59dc`
  - `offline.labels.txt_3e2425`
  - `offline.labels.txt_69531e`
  - `offline.labels.txt_24195a`
  - `offline.labels.txt_59a3b5`
  - `offline.labels.txt_5037be`
  - `offline.labels.txt_4d3e1f`
  - `offline.labels.status`
  - `offline.labels.txt_71eceb`
  - `offline.labels.createTrip`
  - `offline.labels.txt_41c156`
  - `offline.labels.trips`
  - `offline.labels.txt_18aa37`

### Unified Diff / Patch

```diff
@@ -21,1 +21,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -22,1 +22,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- interface ConflictResolutionModalProps {
+ 
@@ -23,1 +23,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   conflict: ConflictRecord | null;
+ 
@@ -24,1 +24,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   isOpen: boolean;
+ interface ConflictResolutionModalProps {
@@ -25,1 +25,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   onClose: () => void;
+   conflict: ConflictRecord | null;
@@ -26,1 +26,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   onResolved?: (conflictId: string, message: string) => void;
+   isOpen: boolean;
@@ -27,1 +27,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- }
+   onClose: () => void;
@@ -28,1 +28,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+   onResolved?: (conflictId: string, message: string) => void;
@@ -29,1 +29,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
+ }
@@ -30,1 +30,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   conflict,
+ 
@@ -31,1 +31,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   isOpen,
+ export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
@@ -32,1 +32,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   onClose,
+   conflict,
@@ -33,1 +33,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   onResolved
+   isOpen,
@@ -34,1 +34,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- }) => {
+   onClose,
@@ -35,1 +35,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy | null>(null);
+   onResolved
@@ -36,1 +36,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const [justification, setJustification] = useState<string>('');
+ }) => {
@@ -37,1 +37,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const [isResolving, setIsResolving] = useState<boolean>(false);
+   const { t } = useI18n();
@@ -38,1 +38,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const [activeView, setActiveView] = useState<'DIFF' | 'RAW'>('DIFF');
+   const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy | null>(null);
@@ -39,1 +39,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+   const [justification, setJustification] = useState<string>('');
@@ -40,1 +40,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   if (!isOpen || !conflict) return null;
+   const [isResolving, setIsResolving] = useState<boolean>(false);
@@ -41,1 +41,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+   const [activeView, setActiveView] = useState<'DIFF' | 'RAW'>('DIFF');
@@ -42,1 +42,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   // Set default strategy based on conflict type
+ 
@@ -43,1 +43,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const getDefaultStrategy = (type: ConflictType): ResolutionStrategy => {
+   if (!isOpen || !conflict) return null;
@@ -44,1 +44,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     switch (type) {
+ 
@@ -45,1 +45,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'PRICING_CHANGED':
+   // Set default strategy based on conflict type
@@ -46,1 +46,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         return 'PRESERVE_PRICING_SNAPSHOT'; // Default is strict pricing invariance!
+   const getDefaultStrategy = (type: ConflictType): ResolutionStrategy => {
@@ -47,1 +47,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'VERSION_CONFLICT':
+     switch (type) {
@@ -48,1 +48,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         return 'ACCEPT_SERVER_STATE';
+       case 'PRICING_CHANGED':
@@ -49,1 +49,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'TRIP_ALREADY_COMPLETED':
+         return 'PRESERVE_PRICING_SNAPSHOT'; // Default is strict pricing invariance!
@@ -50,1 +50,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'TRIP_ALREADY_RETURNED':
+       case 'VERSION_CONFLICT':
@@ -52,1 +52,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'DUPLICATE_OPERATION':
+       case 'TRIP_ALREADY_COMPLETED':
@@ -53,1 +53,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         return 'DISCARD_DUPLICATE';
+       case 'TRIP_ALREADY_RETURNED':
@@ -54,1 +54,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'TRUCK_CARRIER_CONFLICT':
+         return 'ACCEPT_SERVER_STATE';
@@ -55,1 +55,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       case 'MASTER_DATA_CHANGED':
+       case 'DUPLICATE_OPERATION':
@@ -56,1 +56,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         return 'UPDATE_MASTER_DATA_RELATION';
+         return 'DISCARD_DUPLICATE';
@@ -57,1 +57,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       default:
+       case 'TRUCK_CARRIER_CONFLICT':
@@ -58,1 +58,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         return 'ACCEPT_SERVER_STATE';
+       case 'MASTER_DATA_CHANGED':
@@ -59,1 +59,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     }
+         return 'UPDATE_MASTER_DATA_RELATION';
@@ -60,1 +60,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   };
+       default:
@@ -61,1 +61,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+         return 'ACCEPT_SERVER_STATE';
@@ -62,1 +62,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const currentStrategy = selectedStrategy || getDefaultStrategy(conflict.conflictType);
+     }
@@ -63,1 +63,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+   };
@@ -64,1 +64,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const handleResolve = async () => {
+ 
@@ -65,1 +65,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     if (!currentStrategy) return;
+   const currentStrategy = selectedStrategy || getDefaultStrategy(conflict.conflictType);
@@ -66,1 +66,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     setIsResolving(true);
+ 
@@ -67,1 +67,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     try {
+   const handleResolve = async () => {
@@ -68,1 +68,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       const res = await conflictResolutionService.resolveConflict(conflict.conflictId, {
+     if (!currentStrategy) return;
@@ -69,1 +69,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         strategy: currentStrategy,
+     setIsResolving(true);
@@ -70,1 +70,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         resolvedBy: 'مشرف العمليات الميدانية (Scale Supervisor)',
+     try {
@@ -71,1 +71,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         justification: justification.trim() || 'تم اعتماد القرار وفق سياسات الحوكمة ومنع الكتابة التلقائية',
+       const res = await conflictResolutionService.resolveConflict(conflict.conflictId, {
@@ -72,1 +72,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       });
+         strategy: currentStrategy,
@@ -73,1 +73,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+         resolvedBy: 'مشرف العمليات الميدانية (Scale Supervisor)',
@@ -74,1 +74,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       onResolved?.(conflict.conflictId, res.messageAr);
+         justification: justification.trim() || 'تم اعتماد القرار وفق سياسات الحوكمة ومنع الكتابة التلقائية',
@@ -75,1 +75,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       onClose();
+       });
@@ -76,1 +76,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     } catch (err: any) {
+ 
@@ -77,1 +77,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       alert(err.message || 'فشلت معالجة التعارض');
+       onResolved?.(conflict.conflictId, res.messageAr);
@@ -78,1 +78,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     } finally {
+       onClose();
@@ -79,1 +79,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       setIsResolving(false);
+     } catch (err: any) {
@@ -80,1 +80,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     }
+       alert(err.message || 'فشلت معالجة التعارض');
@@ -81,1 +81,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   };
+     } finally {
@@ -82,1 +82,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+       setIsResolving(false);
@@ -83,1 +83,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   const getConflictTypeBadge = (type: ConflictType) => {
+     }
@@ -84,1 +84,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     const map: Record<ConflictType, { label: string; color: string; desc: string }> = {
+   };
@@ -85,1 +85,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       VERSION_CONFLICT: {
+ 
@@ -86,1 +86,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'تعارض إصدار (VERSION_CONFLICT)',
+   const getConflictTypeBadge = (type: ConflictType) => {
@@ -87,1 +87,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
+     const map: Record<ConflictType, { label: string; color: string; desc: string }> = {
@@ -88,1 +88,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'السجل على الخادم تم تعديله بالتوازي بإصدار أحدث.'
+       VERSION_CONFLICT: {
@@ -89,1 +89,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'تعارض إصدار (VERSION_CONFLICT)',
@@ -90,1 +90,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       PRICING_CHANGED: {
+         color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
@@ -91,1 +91,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'تحديث سعر الخادم (PRICING_CHANGED)',
+         desc: 'السجل على الخادم تم تعديله بالتوازي بإصدار أحدث.'
@@ -92,1 +92,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-amber-100 text-amber-900 border-amber-300',
+       },
@@ -93,1 +93,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'تم تحديث سعر القاعدة على الخادم؛ تحمي المنظومة لقطة السعر وقت الإنشاء.'
+       PRICING_CHANGED: {
@@ -94,1 +94,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'تحديث سعر الخادم (PRICING_CHANGED)',
@@ -95,1 +95,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       TRIP_ALREADY_COMPLETED: {
+         color: 'bg-amber-100 text-amber-900 border-amber-300',
@@ -96,1 +96,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'الرحلة مكتملة خادومياً (TRIP_ALREADY_COMPLETED)',
+         desc: 'تم تحديث سعر القاعدة على الخادم؛ تحمي المنظومة لقطة السعر وقت الإنشاء.'
@@ -97,1 +97,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
+       },
@@ -98,1 +98,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'تم استلام وتفريغ الرحلة وإغلاقها مسبقاً في الموقع.'
+       TRIP_ALREADY_COMPLETED: {
@@ -99,1 +99,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'الرحلة مكتملة خادومياً (TRIP_ALREADY_COMPLETED)',
@@ -100,1 +100,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       TRIP_ALREADY_RETURNED: {
+         color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
@@ -101,1 +101,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'الرحلة مرتجعة (TRIP_ALREADY_RETURNED)',
+         desc: 'تم استلام وتفريغ الرحلة وإغلاقها مسبقاً في الموقع.'
@@ -102,1 +102,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-rose-100 text-rose-900 border-rose-300',
+       },
@@ -103,1 +103,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'تم تسجيل رفض أو إرجاع الشحنة على الخادم.'
+       TRIP_ALREADY_RETURNED: {
@@ -104,1 +104,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'الرحلة مرتجعة (TRIP_ALREADY_RETURNED)',
@@ -105,1 +105,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       DUPLICATE_OPERATION: {
+         color: 'bg-rose-100 text-rose-900 border-rose-300',
@@ -106,1 +106,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'عملية مكررة (DUPLICATE_OPERATION)',
+         desc: 'تم تسجيل رفض أو إرجاع الشحنة على الخادم.'
@@ -107,1 +107,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-orange-100 text-orange-900 border-orange-300',
+       },
@@ -108,1 +108,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'رقم التذكرة أو الرحلة مسجل مسبقاً لعملية أخرى.'
+       DUPLICATE_OPERATION: {
@@ -109,1 +109,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'عملية مكررة (DUPLICATE_OPERATION)',
@@ -110,1 +110,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       TRUCK_CARRIER_CONFLICT: {
+         color: 'bg-orange-100 text-orange-900 border-orange-300',
@@ -111,1 +111,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'تعارض الناقل للشاحنة (TRUCK_CARRIER_CONFLICT)',
+         desc: 'رقم التذكرة أو الرحلة مسجل مسبقاً لعملية أخرى.'
@@ -112,1 +112,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-purple-100 text-purple-900 border-purple-300',
+       },
@@ -113,1 +113,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'تبعية الشاحنة للناقل بالخادم تختلف عن الذاكرة المحلية.'
+       TRUCK_CARRIER_CONFLICT: {
@@ -114,1 +114,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'تعارض الناقل للشاحنة (TRUCK_CARRIER_CONFLICT)',
@@ -115,1 +115,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       MASTER_DATA_CHANGED: {
+         color: 'bg-purple-100 text-purple-900 border-purple-300',
@@ -116,1 +116,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         label: 'تغيير بيانات أساسية (MASTER_DATA_CHANGED)',
+         desc: 'تبعية الشاحنة للناقل بالخادم تختلف عن الذاكرة المحلية.'
@@ -117,1 +117,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
+       },
@@ -118,1 +118,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         desc: 'أحد الكيانات (المشروع/المادة/الناقل) تم إيقافه أو تعديل مواصفاته.'
+       MASTER_DATA_CHANGED: {
@@ -119,1 +119,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       },
+         label: 'تغيير بيانات أساسية (MASTER_DATA_CHANGED)',
@@ -120,1 +120,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     };
+         color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
@@ -121,1 +121,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     const c = map[type] || { label: type, color: 'bg-stone-100 text-stone-800 border-stone-300', desc: '' };
+         desc: 'أحد الكيانات (المشروع/المادة/الناقل) تم إيقافه أو تعديل مواصفاته.'
@@ -122,1 +122,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     return (
+       },
@@ -123,1 +123,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       <div className="space-y-1">
+     };
@@ -124,1 +124,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${c.color}`}>
+     const c = map[type] || { label: type, color: 'bg-stone-100 text-stone-800 border-stone-300', desc: '' };
@@ -125,1 +125,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           {c.label}
+     return (
@@ -126,1 +126,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         </span>
+       <div className="space-y-1">
@@ -127,1 +127,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         <p className="text-xs text-stone-500">{c.desc}</p>
+         <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${c.color}`}>
@@ -128,1 +128,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       </div>
+           {c.label}
@@ -129,1 +129,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     );
+         </span>
@@ -130,1 +130,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   };
+         <p className="text-xs text-stone-500">{c.desc}</p>
@@ -131,1 +131,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+       </div>
@@ -132,1 +132,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   return (
+     );
@@ -133,1 +133,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
+   };
@@ -134,1 +134,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-stone-200 overflow-hidden">
+ 
@@ -135,1 +135,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         
+   return (
@@ -136,1 +136,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         {/* Header */}
+     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
@@ -137,1 +137,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
+       <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-stone-200 overflow-hidden">
@@ -138,1 +138,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <div className="flex items-center gap-3">
+         
@@ -139,1 +139,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
+         {/* Header */}
@@ -140,1 +140,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <ShieldAlert className="w-5 h-5" />
+         <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
@@ -141,1 +141,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </div>
+           <div className="flex items-center gap-3">
@@ -142,1 +142,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div>
+             <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
@@ -143,1 +143,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <div className="flex items-center gap-2">
+               <ShieldAlert className="w-5 h-5" />
@@ -144,1 +144,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <h3 className="font-bold text-base text-stone-100">مركز معالجة التعارضات التشغيلية (Conflict Resolution)</h3>
+             </div>
@@ -145,1 +145,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 text-amber-300 border border-amber-500/30">
+             <div>
@@ -146,1 +146,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   {conflict.conflictId}
+               <div className="flex items-center gap-2">
@@ -147,1 +147,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </span>
+                 <h3 className="font-bold text-base text-stone-100">{t("offline.labels.txt_18aa37")}</h3>
@@ -148,1 +148,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </div>
+                 <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 text-amber-300 border border-amber-500/30">
@@ -149,1 +149,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <p className="text-xs text-stone-400 mt-0.5">
+                   {conflict.conflictId}
@@ -150,1 +150,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 مبدأ إلزامي: منع "آخر كتابة تفوز" (Anti Last-Write-Wins) لحماية سلامة بيانات الرحلات
+                 </span>
@@ -151,1 +151,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </p>
+               </div>
@@ -152,1 +152,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </div>
+               <p className="text-xs text-stone-400 mt-0.5">
@@ -153,1 +153,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           </div>
+                 {t("offline.labels.trips")}</p>
@@ -154,1 +154,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <button
+             </div>
@@ -155,1 +155,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             onClick={onClose}
+           </div>
@@ -156,1 +156,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
+           <button
@@ -157,1 +157,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           >
+             onClick={onClose}
@@ -158,1 +158,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <X className="w-5 h-5" />
+             className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
@@ -159,1 +159,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           </button>
+           >
@@ -160,1 +160,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         </div>
+             <X className="w-5 h-5" />
@@ -161,1 +161,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+           </button>
@@ -162,1 +162,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         {/* Anti-LWW & Conflict Notice */}
+         </div>
@@ -163,1 +163,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3 text-xs text-amber-950">
+ 
@@ -164,1 +164,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
+         {/* Anti-LWW & Conflict Notice */}
@@ -165,1 +165,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <div className="space-y-0.5">
+         <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3 text-xs text-amber-950">
@@ -166,1 +166,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="font-bold">{conflict.titleAr}</div>
+           <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
@@ -167,1 +167,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="text-amber-900 leading-relaxed">{conflict.descriptionAr}</div>
+           <div className="space-y-0.5">
@@ -168,1 +168,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           </div>
+             <div className="font-bold">{conflict.titleAr}</div>
@@ -169,1 +169,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         </div>
+             <div className="text-amber-900 leading-relaxed">{conflict.descriptionAr}</div>
@@ -170,1 +170,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+           </div>
@@ -171,1 +171,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         {/* Modal Body */}
+         </div>
@@ -172,1 +172,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         <div className="flex-1 overflow-y-auto p-6 space-y-6">
+ 
@@ -173,1 +173,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+         {/* Modal Body */}
@@ -174,1 +174,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           {/* Pricing Invariance Guarantee Card (if PRICING_CHANGED or pricingProtection exists) */}
+         <div className="flex-1 overflow-y-auto p-6 space-y-6">
@@ -175,1 +175,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           {conflict.pricingProtection && (
+ 
@@ -176,1 +176,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-xl p-4.5 space-y-3 shadow-2xs">
+           {/* Pricing Invariance Guarantee Card (if PRICING_CHANGED or pricingProtection exists) */}
@@ -177,1 +177,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <div className="flex items-center justify-between">
+           {conflict.pricingProtection && (
@@ -178,1 +178,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
+             <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-xl p-4.5 space-y-3 shadow-2xs">
@@ -179,1 +179,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <Lock className="w-4 h-4 text-emerald-700" />
+               <div className="flex items-center justify-between">
@@ -180,1 +180,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <span>ضمانة ثبات تسعير الـ Offline (Pricing Snapshot Invariance)</span>
+                 <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
@@ -181,1 +181,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </div>
+                   <Lock className="w-4 h-4 text-emerald-700" />
@@ -182,1 +182,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
+                   <span>{t("offline.labels.txt_41c156")}</span>
@@ -183,1 +183,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   سعر محمي تعاقدياً
+                 </div>
@@ -184,1 +184,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </span>
+                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
@@ -185,1 +185,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </div>
+                   سعر محمي تعاقدياً
@@ -186,1 +186,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                 </span>
@@ -187,1 +187,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
+               </div>
@@ -188,1 +188,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <div className="bg-white p-3 rounded-lg border border-emerald-200">
+ 
@@ -189,1 +189,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <span className="text-stone-500 block text-[11px]">سعر لقطة وثيقة التحميل (Snapshot):</span>
+               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
@@ -190,1 +190,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <div className="text-base font-bold text-emerald-900 font-mono mt-0.5">
+                 <div className="bg-white p-3 rounded-lg border border-emerald-200">
@@ -191,1 +191,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     {conflict.pricingProtection.snapshotRate} {conflict.pricingProtection.currency} / طن
+                   <span className="text-stone-500 block text-[11px]">سعر لقطة وثيقة التحميل (Snapshot):</span>
@@ -192,1 +192,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </div>
+                   <div className="text-base font-bold text-emerald-900 font-mono mt-0.5">
@@ -193,1 +193,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <span className="text-[10px] text-emerald-700 block mt-1">ساري وقت إنشاء الرحلة بدون اتصال</span>
+                     {conflict.pricingProtection.snapshotRate} {conflict.pricingProtection.currency} / طن
@@ -194,1 +194,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </div>
+                   </div>
@@ -195,1 +195,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                   <span className="text-[10px] text-emerald-700 block mt-1">{t("offline.labels.createTrip")}</span>
@@ -196,1 +196,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <div className="bg-white p-3 rounded-lg border border-emerald-200">
+                 </div>
@@ -197,1 +197,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <span className="text-stone-500 block text-[11px]">السعر المحدث على الخادم (Server):</span>
+ 
@@ -198,1 +198,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
+                 <div className="bg-white p-3 rounded-lg border border-emerald-200">
@@ -199,1 +199,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     {conflict.pricingProtection.serverCurrentRate} {conflict.pricingProtection.currency} / طن
+                   <span className="text-stone-500 block text-[11px]">السعر المحدث على الخادم (Server):</span>
@@ -200,1 +200,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </div>
+                   <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
@@ -201,1 +201,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <span className="text-[10px] text-amber-700 block mt-1">
+                     {conflict.pricingProtection.serverCurrentRate} {conflict.pricingProtection.currency} / طن
@@ -202,1 +202,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     فارق السعر: {conflict.pricingProtection.rateDifference > 0 ? `+${conflict.pricingProtection.rateDifference}` : conflict.pricingProtection.rateDifference} ر.س
+                   </div>
@@ -203,1 +203,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </span>
+                   <span className="text-[10px] text-amber-700 block mt-1">
@@ -204,1 +204,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </div>
+                     فارق السعر: {conflict.pricingProtection.rateDifference > 0 ? `+${conflict.pricingProtection.rateDifference}` : conflict.pricingProtection.rateDifference} ر.س
@@ -205,1 +205,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                   </span>
@@ -206,1 +206,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <div className="bg-white p-3 rounded-lg border border-emerald-200">
+                 </div>
@@ -207,1 +207,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <span className="text-stone-500 block text-[11px]">القاعدة المعمارية الصارمة:</span>
+ 
@@ -208,1 +208,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <p className="text-[11px] text-stone-700 font-medium leading-relaxed mt-0.5">
+                 <div className="bg-white p-3 rounded-lg border border-emerald-200">
@@ -209,1 +209,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     لا يتم تغيير قيمة هذه الرحلة لاحقاً بسبب تحديث السعر. السعر الجديد يستخدم فقط للرحلات المستقبلية.
+                   <span className="text-stone-500 block text-[11px]">{t("offline.labels.txt_71eceb")}</span>
@@ -210,1 +210,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </p>
+                   <p className="text-[11px] text-stone-700 font-medium leading-relaxed mt-0.5">
@@ -211,1 +211,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </div>
+                     لا يتم تغيير قيمة هذه الرحلة لاحقاً بسبب تحديث السعر. السعر الجديد يستخدم فقط للرحلات المستقبلية.
@@ -212,1 +212,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </div>
+                   </p>
@@ -213,1 +213,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                 </div>
@@ -214,1 +214,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <div className="text-[11px] text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 leading-relaxed font-medium">
+               </div>
@@ -215,1 +215,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 {conflict.pricingProtection.policyNoteAr}
+ 
@@ -216,1 +216,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </div>
+               <div className="text-[11px] text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 leading-relaxed font-medium">
@@ -217,1 +217,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </div>
+                 {conflict.pricingProtection.policyNoteAr}
@@ -218,1 +218,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           )}
+               </div>
@@ -219,1 +219,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+             </div>
@@ -220,1 +220,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           {/* Side-by-Side Comparison: Preserved Local Command vs Preserved Server State */}
+           )}
@@ -221,1 +221,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <div className="space-y-3">
+ 
@@ -222,1 +222,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="flex items-center justify-between">
+           {/* Side-by-Side Comparison: Preserved Local Command vs Preserved Server State */}
@@ -223,1 +223,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
+           <div className="space-y-3">
@@ -224,1 +224,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <ArrowRightLeft className="w-4 h-4 text-stone-500" />
+             <div className="flex items-center justify-between">
@@ -225,1 +225,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <span>مقارنة الحالة المحفوظة (Preserved Local Command vs Server State)</span>
+               <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
@@ -226,1 +226,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </h4>
+                 <ArrowRightLeft className="w-4 h-4 text-stone-500" />
@@ -227,1 +227,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <div className="flex items-center gap-1 text-xs">
+                 <span>{t("offline.labels.status")}</span>
@@ -228,1 +228,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <button
+               </h4>
@@ -229,1 +229,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   onClick={() => setActiveView('DIFF')}
+               <div className="flex items-center gap-1 text-xs">
@@ -230,1 +230,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
+                 <button
@@ -231,1 +231,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     activeView === 'DIFF' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
+                   onClick={() => setActiveView('DIFF')}
@@ -232,1 +232,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}
+                   className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
@@ -233,1 +233,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 >
+                     activeView === 'DIFF' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
@@ -234,1 +234,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   جدول الفروقات (Diff)
+                   }`}
@@ -235,1 +235,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </button>
+                 >
@@ -236,1 +236,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <button
+                   {t("offline.labels.txt_4d3e1f")}</button>
@@ -237,1 +237,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   onClick={() => setActiveView('RAW')}
+                 <button
@@ -238,1 +238,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
+                   onClick={() => setActiveView('RAW')}
@@ -239,1 +239,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     activeView === 'RAW' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
+                   className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
@@ -240,1 +240,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}
+                     activeView === 'RAW' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
@@ -241,1 +241,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 >
+                   }`}
@@ -242,1 +242,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   البيانات الخام (JSON)
+                 >
@@ -243,1 +243,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </button>
+                   {t("offline.labels.txt_5037be")}</button>
@@ -252,1 +252,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <th className="py-2.5 px-4 font-bold">الحقل</th>
+                       <th className="py-2.5 px-4 font-bold">{t("offline.labels.txt_59a3b5")}</th>
@@ -255,1 +255,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <span>الأمر الميداني المحلي (Local Command)</span>
+                         <span>{t("offline.labels.txt_24195a")}</span>
@@ -260,1 +260,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           <span>حالة الخادم (Server State)</span>
+                           <span>{t("offline.labels.txt_69531e")}</span>
@@ -263,1 +263,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <th className="py-2.5 px-4 font-bold">ملاحظات التحكيم</th>
+                       <th className="py-2.5 px-4 font-bold">{t("offline.labels.txt_3e2425")}</th>
@@ -287,1 +287,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                               <span>محمي باللقطة</span>
+                               <span>{t("offline.labels.txt_4c59dc")}</span>
@@ -317,1 +317,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <span>القرار الإلزامي الصريح (Explicit Resolution Strategy)</span>
+                 <span>{t("offline.labels.txt_47cf18")}</span>
@@ -320,1 +320,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 اختر استراتيجية الحل المناسبة مع توثيق سبب القرار في سجل التدقيق الأمني
+                 {t("offline.labels.txt_184f19")}</p>
@@ -321,1 +321,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </p>
+             </div>
@@ -322,1 +322,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </div>
+ 
@@ -323,1 +323,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+             {/* Contextual Options tailored by conflictType */}
@@ -324,1 +324,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             {/* Contextual Options tailored by conflictType */}
+             <div className="space-y-2.5">
@@ -325,1 +325,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="space-y-2.5">
+               {conflict.conflictType === 'PRICING_CHANGED' && (
@@ -326,1 +326,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               {conflict.conflictType === 'PRICING_CHANGED' && (
+                 <>
@@ -327,1 +327,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <>
+                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
@@ -328,1 +328,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
+                     currentStrategy === 'PRESERVE_PRICING_SNAPSHOT'
@@ -329,1 +329,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'PRESERVE_PRICING_SNAPSHOT'
+                       ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
@@ -330,1 +330,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -331,1 +331,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                   }`}>
@@ -332,1 +332,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                     <div className="flex items-start gap-3">
@@ -333,1 +333,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                       <input
@@ -334,1 +334,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         type="radio"
@@ -335,1 +335,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         name="resolutionStrategy"
@@ -336,1 +336,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                         value="PRESERVE_PRICING_SNAPSHOT"
@@ -337,1 +337,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="PRESERVE_PRICING_SNAPSHOT"
+                         checked={currentStrategy === 'PRESERVE_PRICING_SNAPSHOT'}
@@ -338,1 +338,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'PRESERVE_PRICING_SNAPSHOT'}
+                         onChange={() => setSelectedStrategy('PRESERVE_PRICING_SNAPSHOT')}
@@ -339,1 +339,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('PRESERVE_PRICING_SNAPSHOT')}
+                         className="mt-1 text-emerald-600 focus:ring-emerald-500"
@@ -340,1 +340,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-emerald-600 focus:ring-emerald-500"
+                       />
@@ -341,1 +341,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                       <div className="space-y-1">
@@ -342,1 +342,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                         <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
@@ -343,1 +343,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
+                           <CheckCircle2 className="w-4 h-4 text-emerald-600" />
@@ -344,1 +344,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           <CheckCircle2 className="w-4 h-4 text-emerald-600" />
+                           <span>الخيار القياسي المعتمد: المحافظة على سعر لقطة وثيقة التحميل (Lock Snapshot Rate)</span>
@@ -345,1 +345,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           <span>الخيار القياسي المعتمد: المحافظة على سعر لقطة وثيقة التحميل (Lock Snapshot Rate)</span>
+                         </div>
@@ -346,1 +346,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                         <p className="text-xs text-emerald-900 leading-relaxed">
@@ -347,1 +347,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-emerald-900 leading-relaxed">
+                           الالتزام الصارم بسعر اللقطة المحفوظة ({conflict.pricingProtection?.snapshotRate} ر.س/طن) وعدم تغيير قيمة الرحلة، مع قصر السعر الخادومي الجديد على الرحلات المستقبلية فقط.
@@ -348,1 +348,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           الالتزام الصارم بسعر اللقطة المحفوظة ({conflict.pricingProtection?.snapshotRate} ر.س/طن) وعدم تغيير قيمة الرحلة، مع قصر السعر الخادومي الجديد على الرحلات المستقبلية فقط.
+                         </p>
@@ -349,1 +349,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                       </div>
@@ -350,1 +350,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                     </div>
@@ -351,1 +351,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                   </label>
@@ -352,1 +352,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+ 
@@ -353,1 +353,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
@@ -354,1 +354,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
+                     currentStrategy === 'OVERRIDE_TO_NEW_PRICING'
@@ -355,1 +355,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'OVERRIDE_TO_NEW_PRICING'
+                       ? 'border-amber-500 bg-amber-50/70 shadow-xs'
@@ -356,1 +356,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-amber-500 bg-amber-50/70 shadow-xs'
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -357,1 +357,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                   }`}>
@@ -358,1 +358,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                     <div className="flex items-start gap-3">
@@ -359,1 +359,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                       <input
@@ -360,1 +360,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         type="radio"
@@ -361,1 +361,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         name="resolutionStrategy"
@@ -362,1 +362,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                         value="OVERRIDE_TO_NEW_PRICING"
@@ -363,1 +363,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="OVERRIDE_TO_NEW_PRICING"
+                         checked={currentStrategy === 'OVERRIDE_TO_NEW_PRICING'}
@@ -364,1 +364,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'OVERRIDE_TO_NEW_PRICING'}
+                         onChange={() => setSelectedStrategy('OVERRIDE_TO_NEW_PRICING')}
@@ -365,1 +365,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('OVERRIDE_TO_NEW_PRICING')}
+                         className="mt-1 text-amber-600 focus:ring-amber-500"
@@ -366,1 +366,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-amber-600 focus:ring-amber-500"
+                       />
@@ -367,1 +367,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                       <div className="space-y-1">
@@ -368,1 +368,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                         <div className="font-bold text-xs text-stone-900">
@@ -369,1 +369,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-stone-900">
+                           استثناء إداري: إعادة الاحتساب بالسعر الخادومي الجديد ({conflict.pricingProtection?.serverCurrentRate} ر.س/طن)
@@ -370,1 +370,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           استثناء إداري: إعادة الاحتساب بالسعر الخادومي الجديد ({conflict.pricingProtection?.serverCurrentRate} ر.س/طن)
+                         </div>
@@ -371,1 +371,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -372,1 +372,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+                           يتطلب موافقة خطية ومبرراً رسمياً لتعديل سعر التعاقد الأصلي للرحلة.
@@ -373,1 +373,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           يتطلب موافقة خطية ومبرراً رسمياً لتعديل سعر التعاقد الأصلي للرحلة.
+                         </p>
@@ -374,1 +374,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                       </div>
@@ -375,1 +375,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                     </div>
@@ -376,1 +376,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                   </label>
@@ -377,1 +377,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                 </>
@@ -378,1 +378,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </>
+               )}
@@ -379,1 +379,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               )}
+ 
@@ -380,1 +380,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+               {conflict.conflictType === 'VERSION_CONFLICT' && (
@@ -381,1 +381,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               {conflict.conflictType === 'VERSION_CONFLICT' && (
+                 <>
@@ -382,1 +382,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <>
+                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
@@ -383,1 +383,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
+                     currentStrategy === 'ACCEPT_SERVER_STATE'
@@ -384,1 +384,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'ACCEPT_SERVER_STATE'
+                       ? 'border-blue-500 bg-blue-50/70 shadow-xs'
@@ -385,1 +385,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-blue-500 bg-blue-50/70 shadow-xs'
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -386,1 +386,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                   }`}>
@@ -387,1 +387,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                     <div className="flex items-start gap-3">
@@ -388,1 +388,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                       <input
@@ -389,1 +389,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         type="radio"
@@ -390,1 +390,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         name="resolutionStrategy"
@@ -391,1 +391,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                         value="ACCEPT_SERVER_STATE"
@@ -392,1 +392,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="ACCEPT_SERVER_STATE"
+                         checked={currentStrategy === 'ACCEPT_SERVER_STATE'}
@@ -393,1 +393,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'ACCEPT_SERVER_STATE'}
+                         onChange={() => setSelectedStrategy('ACCEPT_SERVER_STATE')}
@@ -394,1 +394,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('ACCEPT_SERVER_STATE')}
+                         className="mt-1 text-blue-600 focus:ring-blue-500"
@@ -395,1 +395,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-blue-600 focus:ring-blue-500"
+                       />
@@ -396,1 +396,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                       <div className="space-y-1">
@@ -397,1 +397,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                         <div className="font-bold text-xs text-blue-950">
@@ -398,1 +398,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-blue-950">
+                           {t("offline.labels.txt_3d9611")}</div>
@@ -399,1 +399,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           اعتماد حالة الخادم (Accept Server State)
+                         <p className="text-xs text-blue-900 leading-relaxed">
@@ -400,1 +400,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                           الاحتفاظ ببيانات الخادم الحالية v{conflict.serverState.serverVersion} وإلغاء التعديل المحلي القديم.
@@ -401,1 +401,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-blue-900 leading-relaxed">
+                         </p>
@@ -402,1 +402,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           الاحتفاظ ببيانات الخادم الحالية v{conflict.serverState.serverVersion} وإلغاء التعديل المحلي القديم.
+                       </div>
@@ -403,1 +403,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                     </div>
@@ -404,1 +404,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                   </label>
@@ -405,1 +405,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+ 
@@ -406,1 +406,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
@@ -407,1 +407,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                     currentStrategy === 'FORCE_CLIENT_STATE'
@@ -408,1 +408,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
+                       ? 'border-amber-500 bg-amber-50/70 shadow-xs'
@@ -409,1 +409,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'FORCE_CLIENT_STATE'
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -410,1 +410,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-amber-500 bg-amber-50/70 shadow-xs'
+                   }`}>
@@ -411,1 +411,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                     <div className="flex items-start gap-3">
@@ -412,1 +412,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                       <input
@@ -413,1 +413,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                         type="radio"
@@ -414,1 +414,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         name="resolutionStrategy"
@@ -415,1 +415,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         value="FORCE_CLIENT_STATE"
@@ -416,1 +416,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                         checked={currentStrategy === 'FORCE_CLIENT_STATE'}
@@ -417,1 +417,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="FORCE_CLIENT_STATE"
+                         onChange={() => setSelectedStrategy('FORCE_CLIENT_STATE')}
@@ -418,1 +418,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'FORCE_CLIENT_STATE'}
+                         className="mt-1 text-amber-600 focus:ring-amber-500"
@@ -419,1 +419,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('FORCE_CLIENT_STATE')}
+                       />
@@ -420,1 +420,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-amber-600 focus:ring-amber-500"
+                       <div className="space-y-1">
@@ -421,1 +421,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                         <div className="font-bold text-xs text-stone-900">
@@ -422,1 +422,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                           {t("offline.labels.txt_60c85c")}</div>
@@ -423,1 +423,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-stone-900">
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -424,1 +424,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           فرض الأمر المحلي بالإصدار الجديد (Force Local With Audit)
+                           تطبيق الأمر الميداني فوق بيانات الخادم مع رفع رقم الإصدار تلقائياً وتوثيق هوية المشرف.
@@ -425,1 +425,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                         </p>
@@ -426,1 +426,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+                       </div>
@@ -427,1 +427,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           تطبيق الأمر الميداني فوق بيانات الخادم مع رفع رقم الإصدار تلقائياً وتوثيق هوية المشرف.
+                     </div>
@@ -428,1 +428,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                   </label>
@@ -429,1 +429,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                 </>
@@ -430,1 +430,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+               )}
@@ -431,1 +431,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+ 
@@ -432,1 +432,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </>
+               {(conflict.conflictType === 'TRIP_ALREADY_COMPLETED' || conflict.conflictType === 'TRIP_ALREADY_RETURNED') && (
@@ -433,1 +433,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               )}
+                 <>
@@ -434,1 +434,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
@@ -435,1 +435,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               {(conflict.conflictType === 'TRIP_ALREADY_COMPLETED' || conflict.conflictType === 'TRIP_ALREADY_RETURNED') && (
+                     currentStrategy === 'ACCEPT_SERVER_STATE'
@@ -436,1 +436,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <>
+                       ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
@@ -437,1 +437,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -438,1 +438,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'ACCEPT_SERVER_STATE'
+                   }`}>
@@ -439,1 +439,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
+                     <div className="flex items-start gap-3">
@@ -440,1 +440,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                       <input
@@ -441,1 +441,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                         type="radio"
@@ -442,1 +442,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                         name="resolutionStrategy"
@@ -443,1 +443,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         value="ACCEPT_SERVER_STATE"
@@ -444,1 +444,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         checked={currentStrategy === 'ACCEPT_SERVER_STATE'}
@@ -445,1 +445,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                         onChange={() => setSelectedStrategy('ACCEPT_SERVER_STATE')}
@@ -446,1 +446,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="ACCEPT_SERVER_STATE"
+                         className="mt-1 text-emerald-600 focus:ring-emerald-500"
@@ -447,1 +447,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'ACCEPT_SERVER_STATE'}
+                       />
@@ -448,1 +448,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('ACCEPT_SERVER_STATE')}
+                       <div className="space-y-1">
@@ -449,1 +449,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-emerald-600 focus:ring-emerald-500"
+                         <div className="font-bold text-xs text-stone-900">
@@ -450,1 +450,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                           الالتزام بقرار الخادم النهائي ({conflict.serverState.status})
@@ -451,1 +451,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                         </div>
@@ -452,1 +452,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-stone-900">
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -453,1 +453,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           الالتزام بقرار الخادم النهائي ({conflict.serverState.status})
+                           {t("offline.status.closeTrip")}</p>
@@ -454,1 +454,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                       </div>
@@ -455,1 +455,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+                     </div>
@@ -456,1 +456,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           إغلاق العملية المعلقة واعتبار الرحلة في حالتها النهائية المسجلة خادومياً.
+                   </label>
@@ -457,1 +457,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+ 
@@ -458,1 +458,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
@@ -459,1 +459,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                     currentStrategy === 'CANCEL_LOCAL_OPERATION'
@@ -460,1 +460,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                       ? 'border-rose-500 bg-rose-50/70 shadow-xs'
@@ -461,1 +461,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -462,1 +462,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
+                   }`}>
@@ -463,1 +463,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'CANCEL_LOCAL_OPERATION'
+                     <div className="flex items-start gap-3">
@@ -464,1 +464,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-rose-500 bg-rose-50/70 shadow-xs'
+                       <input
@@ -465,1 +465,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                         type="radio"
@@ -466,1 +466,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                         name="resolutionStrategy"
@@ -467,1 +467,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                         value="CANCEL_LOCAL_OPERATION"
@@ -468,1 +468,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         checked={currentStrategy === 'CANCEL_LOCAL_OPERATION'}
@@ -469,1 +469,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         onChange={() => setSelectedStrategy('CANCEL_LOCAL_OPERATION')}
@@ -470,1 +470,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                         className="mt-1 text-rose-600 focus:ring-rose-500"
@@ -471,1 +471,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="CANCEL_LOCAL_OPERATION"
+                       />
@@ -472,1 +472,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'CANCEL_LOCAL_OPERATION'}
+                       <div className="space-y-1">
@@ -473,1 +473,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('CANCEL_LOCAL_OPERATION')}
+                         <div className="font-bold text-xs text-rose-900">
@@ -474,1 +474,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-rose-600 focus:ring-rose-500"
+                           {t("offline.labels.cancel")}</div>
@@ -475,1 +475,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -476,1 +476,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                           {t("offline.labels.deleteSave")}</p>
@@ -477,1 +477,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-rose-900">
+                       </div>
@@ -478,1 +478,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           إلغاء العملية المحلية مع تسجيل تقرير تباين تشغيلي (Exception Report)
+                     </div>
@@ -479,1 +479,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                   </label>
@@ -480,1 +480,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+                 </>
@@ -481,1 +481,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           حذف العملية من طابور الصادر وحفظ ملف التدقيق للمراجعة اللوجستية.
+               )}
@@ -482,1 +482,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+ 
@@ -483,1 +483,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+               {conflict.conflictType === 'DUPLICATE_OPERATION' && (
@@ -484,1 +484,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                 <>
@@ -485,1 +485,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
@@ -486,1 +486,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </>
+                     currentStrategy === 'DISCARD_DUPLICATE'
@@ -487,1 +487,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               )}
+                       ? 'border-blue-500 bg-blue-50/70 shadow-xs'
@@ -488,1 +488,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -489,1 +489,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               {conflict.conflictType === 'DUPLICATE_OPERATION' && (
+                   }`}>
@@ -490,1 +490,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <>
+                     <div className="flex items-start gap-3">
@@ -491,1 +491,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
+                       <input
@@ -492,1 +492,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'DISCARD_DUPLICATE'
+                         type="radio"
@@ -493,1 +493,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-blue-500 bg-blue-50/70 shadow-xs'
+                         name="resolutionStrategy"
@@ -494,1 +494,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                         value="DISCARD_DUPLICATE"
@@ -495,1 +495,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                         checked={currentStrategy === 'DISCARD_DUPLICATE'}
@@ -496,1 +496,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                         onChange={() => setSelectedStrategy('DISCARD_DUPLICATE')}
@@ -497,1 +497,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                         className="mt-1 text-blue-600 focus:ring-blue-500"
@@ -498,1 +498,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                       />
@@ -499,1 +499,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                       <div className="space-y-1">
@@ -500,1 +500,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="DISCARD_DUPLICATE"
+                         <div className="font-bold text-xs text-stone-900">
@@ -501,1 +501,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'DISCARD_DUPLICATE'}
+                           {t("offline.labels.txt_604d7b")}</div>
@@ -502,1 +502,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('DISCARD_DUPLICATE')}
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -503,1 +503,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-blue-600 focus:ring-blue-500"
+                           {t("offline.status.cancelSuccess")}</p>
@@ -504,1 +504,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                       </div>
@@ -505,1 +505,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                     </div>
@@ -506,1 +506,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-stone-900">
+                   </label>
@@ -507,1 +507,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           استبعاد العملية المكررة (Discard Duplicate)
+ 
@@ -508,1 +508,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
@@ -509,1 +509,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+                     currentStrategy === 'ASSIGN_NEW_SERIAL'
@@ -510,1 +510,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           إلغاء التذكرة المكررة محلياً حيث تم ترحيلها بنجاح مسبقاً.
+                       ? 'border-amber-500 bg-amber-50/70 shadow-xs'
@@ -511,1 +511,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -512,1 +512,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                   }`}>
@@ -513,1 +513,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                     <div className="flex items-start gap-3">
@@ -514,1 +514,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                       <input
@@ -515,1 +515,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                         type="radio"
@@ -516,1 +516,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
+                         name="resolutionStrategy"
@@ -517,1 +517,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'ASSIGN_NEW_SERIAL'
+                         value="ASSIGN_NEW_SERIAL"
@@ -518,1 +518,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-amber-500 bg-amber-50/70 shadow-xs'
+                         checked={currentStrategy === 'ASSIGN_NEW_SERIAL'}
@@ -519,1 +519,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                         onChange={() => setSelectedStrategy('ASSIGN_NEW_SERIAL')}
@@ -520,1 +520,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                         className="mt-1 text-amber-600 focus:ring-amber-500"
@@ -521,1 +521,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                       />
@@ -522,1 +522,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                       <div className="space-y-1">
@@ -523,1 +523,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         <div className="font-bold text-xs text-stone-900">
@@ -524,1 +524,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                           إعادة إصدار رقم تذكرة جديد واعتماد الرحلة (Re-issue Ticket)
@@ -525,1 +525,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="ASSIGN_NEW_SERIAL"
+                         </div>
@@ -526,1 +526,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'ASSIGN_NEW_SERIAL'}
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -527,1 +527,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('ASSIGN_NEW_SERIAL')}
+                           توليد رقم تذكرة ميزان جديد فريد لتفادي التكرار واعتماد قيد الرحلة.
@@ -528,1 +528,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-amber-600 focus:ring-amber-500"
+                         </p>
@@ -529,1 +529,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                       </div>
@@ -530,1 +530,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+                     </div>
@@ -531,1 +531,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-stone-900">
+                   </label>
@@ -532,1 +532,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           إعادة إصدار رقم تذكرة جديد واعتماد الرحلة (Re-issue Ticket)
+                 </>
@@ -533,1 +533,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+               )}
@@ -534,1 +534,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+ 
@@ -535,1 +535,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           توليد رقم تذكرة ميزان جديد فريد لتفادي التكرار واعتماد قيد الرحلة.
+               {(conflict.conflictType === 'TRUCK_CARRIER_CONFLICT' || conflict.conflictType === 'MASTER_DATA_CHANGED') && (
@@ -536,1 +536,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                 <>
@@ -537,1 +537,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
@@ -538,1 +538,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                     currentStrategy === 'UPDATE_MASTER_DATA_RELATION'
@@ -539,1 +539,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                       ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
@@ -540,1 +540,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </>
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -541,1 +541,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               )}
+                   }`}>
@@ -542,1 +542,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                     <div className="flex items-start gap-3">
@@ -543,1 +543,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               {(conflict.conflictType === 'TRUCK_CARRIER_CONFLICT' || conflict.conflictType === 'MASTER_DATA_CHANGED') && (
+                       <input
@@ -544,1 +544,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 <>
+                         type="radio"
@@ -545,1 +545,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
+                         name="resolutionStrategy"
@@ -546,1 +546,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'UPDATE_MASTER_DATA_RELATION'
+                         value="UPDATE_MASTER_DATA_RELATION"
@@ -547,1 +547,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
+                         checked={currentStrategy === 'UPDATE_MASTER_DATA_RELATION'}
@@ -548,1 +548,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                         onChange={() => setSelectedStrategy('UPDATE_MASTER_DATA_RELATION')}
@@ -549,1 +549,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                         className="mt-1 text-emerald-600 focus:ring-emerald-500"
@@ -550,1 +550,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                       />
@@ -551,1 +551,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                       <div className="space-y-1">
@@ -552,1 +552,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         <div className="font-bold text-xs text-stone-900">
@@ -553,1 +553,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                           {t("offline.labels.txt_305c29")}</div>
@@ -554,1 +554,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="UPDATE_MASTER_DATA_RELATION"
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -555,1 +555,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'UPDATE_MASTER_DATA_RELATION'}
+                           {t("offline.labels.truck_2")}</p>
@@ -556,1 +556,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('UPDATE_MASTER_DATA_RELATION')}
+                       </div>
@@ -557,1 +557,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-emerald-600 focus:ring-emerald-500"
+                     </div>
@@ -558,1 +558,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+                   </label>
@@ -559,1 +559,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+ 
@@ -560,1 +560,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-stone-900">
+                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
@@ -561,1 +561,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           تسوية ومطابقة التبعية مع البيانات الأساسية للخادم
+                     currentStrategy === 'CANCEL_LOCAL_OPERATION'
@@ -562,1 +562,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+                       ? 'border-rose-500 bg-rose-50/70 shadow-xs'
@@ -563,1 +563,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+                       : 'border-stone-200 bg-white hover:border-stone-300'
@@ -564,1 +564,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           إعادة ربط الشاحنة أو الكيان بالناقل/المشروع المصرح به خادومياً واعتماد الرحلة.
+                   }`}>
@@ -565,1 +565,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+                     <div className="flex items-start gap-3">
@@ -566,1 +566,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                       <input
@@ -567,1 +567,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                         type="radio"
@@ -568,1 +568,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                         name="resolutionStrategy"
@@ -569,1 +569,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+                         value="CANCEL_LOCAL_OPERATION"
@@ -570,1 +570,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
+                         checked={currentStrategy === 'CANCEL_LOCAL_OPERATION'}
@@ -571,1 +571,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     currentStrategy === 'CANCEL_LOCAL_OPERATION'
+                         onChange={() => setSelectedStrategy('CANCEL_LOCAL_OPERATION')}
@@ -572,1 +572,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       ? 'border-rose-500 bg-rose-50/70 shadow-xs'
+                         className="mt-1 text-rose-600 focus:ring-rose-500"
@@ -573,1 +573,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       : 'border-stone-200 bg-white hover:border-stone-300'
+                       />
@@ -574,1 +574,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   }`}>
+                       <div className="space-y-1">
@@ -575,1 +575,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     <div className="flex items-start gap-3">
+                         <div className="font-bold text-xs text-rose-900">
@@ -576,1 +576,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <input
+                           {t("offline.labels.cancelTrip")}</div>
@@ -577,1 +577,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         type="radio"
+                         <p className="text-xs text-stone-600 leading-relaxed">
@@ -578,1 +578,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         name="resolutionStrategy"
+                           {t("offline.labels.txt_4d4137")}</p>
@@ -579,1 +579,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         value="CANCEL_LOCAL_OPERATION"
+                       </div>
@@ -580,1 +580,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         checked={currentStrategy === 'CANCEL_LOCAL_OPERATION'}
+                     </div>
@@ -581,1 +581,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         onChange={() => setSelectedStrategy('CANCEL_LOCAL_OPERATION')}
+                   </label>
@@ -582,1 +582,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         className="mt-1 text-rose-600 focus:ring-rose-500"
+                 </>
@@ -583,1 +583,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       />
+               )}
@@ -584,1 +584,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       <div className="space-y-1">
+             </div>
@@ -585,1 +585,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <div className="font-bold text-xs text-rose-900">
+ 
@@ -586,1 +586,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           إلغاء أمر الرحلة لعدم صلاحية الكيان (Cancel Dispatch)
+             {/* Mandatory Justification */}
@@ -587,1 +587,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </div>
+             <div className="space-y-1.5">
@@ -588,1 +588,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         <p className="text-xs text-stone-600 leading-relaxed">
+               <label className="text-xs font-bold text-stone-700 block">
@@ -589,1 +589,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                           رفض ترحيل الشحنة لمخالفتها شروط التفويض في السجل المركزي.
+                 {t("offline.labels.txt_3d5113")}</label>
@@ -590,1 +590,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                         </p>
+               <textarea
@@ -591,1 +591,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                       </div>
+                 value={justification}
@@ -592,1 +592,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                     </div>
+                 onChange={(e) => setJustification(e.target.value)}
@@ -593,1 +593,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                   </label>
+                 placeholder="أدخل مبرر اعتماد القرار التشغيلي لتوثيقه في سجل التدقيق والمراقبة..."
@@ -594,1 +594,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 </>
+                 rows={2}
@@ -595,1 +595,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               )}
+                 className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
@@ -596,1 +596,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </div>
+               />
@@ -597,1 +597,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+             </div>
@@ -598,1 +598,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             {/* Mandatory Justification */}
+           </div>
@@ -599,1 +599,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <div className="space-y-1.5">
+ 
@@ -600,1 +600,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <label className="text-xs font-bold text-stone-700 block">
+         </div>
@@ -601,1 +601,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 مبرر القرار التدقيقي (Audit Justification):
+ 
@@ -602,1 +602,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               </label>
+         {/* Modal Footer */}
@@ -603,1 +603,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <textarea
+         <div className="bg-stone-100 p-4 px-6 border-t border-stone-200 flex items-center justify-between">
@@ -604,1 +604,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 value={justification}
+           <div className="text-xs text-stone-500 flex items-center gap-1.5">
@@ -605,1 +605,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 onChange={(e) => setJustification(e.target.value)}
+             <Lock className="w-3.5 h-3.5 text-stone-400" />
@@ -606,1 +606,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 placeholder="أدخل مبرر اعتماد القرار التشغيلي لتوثيقه في سجل التدقيق والمراقبة..."
+             <span>{t("offline.labels.txt_4e1b80")}</span>
@@ -607,1 +607,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 rows={2}
+           </div>
@@ -608,1 +608,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-                 className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
+ 
@@ -609,1 +609,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               />
+           <div className="flex items-center gap-2">
@@ -610,1 +610,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </div>
+             <button
@@ -611,1 +611,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           </div>
+               onClick={onClose}
@@ -612,1 +612,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+               disabled={isResolving}
@@ -613,1 +613,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         </div>
+               className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
@@ -614,1 +614,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+             >
@@ -615,1 +615,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         {/* Modal Footer */}
+               {t("offline.labels.cancel_2")}</button>
@@ -616,1 +616,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         <div className="bg-stone-100 p-4 px-6 border-t border-stone-200 flex items-center justify-between">
+             <button
@@ -617,1 +617,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <div className="text-xs text-stone-500 flex items-center gap-1.5">
+               onClick={handleResolve}
@@ -618,1 +618,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <Lock className="w-3.5 h-3.5 text-stone-400" />
+               disabled={isResolving}
@@ -619,1 +619,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <span>سيتم تسجيل القرار في سجل التدقيق ومزامنة حالة Outbox تلقائياً</span>
+               className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
@@ -620,1 +620,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           </div>
+             >
@@ -621,1 +621,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- 
+               {isResolving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
@@ -622,1 +622,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           <div className="flex items-center gap-2">
+               <span>{t("offline.labels.txt_3ba53d")}</span>
@@ -623,1 +623,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <button
+             </button>
@@ -624,1 +624,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               onClick={onClose}
+           </div>
@@ -625,1 +625,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               disabled={isResolving}
+         </div>
@@ -626,1 +626,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
+ 
@@ -627,1 +627,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             >
+       </div>
@@ -628,1 +628,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               إلغاء ومراجعة لاحقاً
+     </div>
@@ -629,1 +629,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </button>
+   );
@@ -630,1 +630,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             <button
+ };
@@ -631,1 +631,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               onClick={handleResolve}
+ 
@@ -632,1 +632,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               disabled={isResolving}
+ 
@@ -633,1 +633,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
+ 
@@ -634,1 +634,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             >
+ 
@@ -635,1 +635,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               {isResolving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
+ 
@@ -636,1 +636,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-               <span>اعتماد الحل الصريح والترحيل</span>
+ 
@@ -637,1 +637,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-             </button>
+ 
@@ -638,1 +638,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-           </div>
+ 
@@ -639,1 +639,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-         </div>
+ 
@@ -641,1 +641,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-       </div>
+ 
@@ -642,1 +642,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-     </div>
+ 
@@ -643,1 +643,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
-   );
+ 
@@ -644,1 +644,1 @@ /app/applet/src/components/offline/ConflictResolutionModal.tsx
- };
+ 
```

## File: `/app/applet/src/components/offline/OfflineIndicator.tsx`

- **Pre-Migration Hash:** `afbe4a2b47b132a2`
- **Post-Migration Hash:** `d36fc7523b83fe65`
- **Transformations Applied:** 1
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (1):**
  - `offline.labels.txt_1f39b6`

### Unified Diff / Patch

```diff
@@ -4,1 +4,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -5,1 +5,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- interface OfflineIndicatorProps {
+ 
@@ -6,1 +6,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-   pendingCount?: number;
+ 
@@ -7,1 +7,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-   onOpenOutbox?: () => void;
+ interface OfflineIndicatorProps {
@@ -8,1 +8,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- }
+   pendingCount?: number;
@@ -9,1 +9,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+   onOpenOutbox?: () => void;
@@ -10,1 +10,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ pendingCount = 0, onOpenOutbox }) => {
+ }
@@ -11,1 +11,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-   const { isOnline, isSimulatedOffline } = useOnlineStatus();
+ 
@@ -12,1 +12,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+ export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ pendingCount = 0, onOpenOutbox }) => {
@@ -13,1 +13,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-   if (isOnline) return null;
+   const { t } = useI18n();
@@ -14,1 +14,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+   const { isOnline, isSimulatedOffline } = useOnlineStatus();
@@ -15,1 +15,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-   return (
+ 
@@ -16,1 +16,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-     <div 
+   if (isOnline) return null;
@@ -17,1 +17,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-stone-900/95 text-white px-4 py-2.5 shadow-xl border border-amber-500/40 backdrop-blur-md transition-all text-xs font-medium"
+ 
@@ -18,1 +18,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       dir="rtl"
+   return (
@@ -19,1 +19,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-     >
+     <div 
@@ -20,1 +20,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       <div className="flex items-center gap-2">
+       className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-stone-900/95 text-white px-4 py-2.5 shadow-xl border border-amber-500/40 backdrop-blur-md transition-all text-xs font-medium"
@@ -21,1 +21,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         <span className="relative flex h-2.5 w-2.5">
+       dir="rtl"
@@ -22,1 +22,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
+     >
@@ -23,1 +23,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
+       <div className="flex items-center gap-2">
@@ -24,1 +24,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         </span>
+         <span className="relative flex h-2.5 w-2.5">
@@ -25,1 +25,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         <WifiOff className="w-4 h-4 text-amber-400" />
+           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
@@ -26,1 +26,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         <span>
+           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
@@ -27,1 +27,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           {isSimulatedOffline ? 'وضع محاكاة عدم الاتصال (Simulated Offline)' : 'وضع عدم الاتصال (Offline) — البيانات من IndexedDB'}
+         </span>
@@ -28,1 +28,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         </span>
+         <WifiOff className="w-4 h-4 text-amber-400" />
@@ -29,1 +29,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       </div>
+         <span>
@@ -30,1 +30,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+           {isSimulatedOffline ? 'وضع محاكاة عدم الاتصال (Simulated Offline)' : 'وضع عدم الاتصال (Offline) — البيانات من IndexedDB'}
@@ -31,1 +31,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       {pendingCount > 0 && (
+         </span>
@@ -32,1 +32,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
+       </div>
@@ -33,1 +33,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           {pendingCount} في Outbox
+ 
@@ -34,1 +34,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         </span>
+       {pendingCount > 0 && (
@@ -35,1 +35,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       )}
+         <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
@@ -36,1 +36,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+           {pendingCount} في Outbox
@@ -37,1 +37,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       {onOpenOutbox && (
+         </span>
@@ -38,1 +38,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         <button
+       )}
@@ -39,1 +39,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           onClick={onOpenOutbox}
+ 
@@ -40,1 +40,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           className="mr-2 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
+       {onOpenOutbox && (
@@ -41,1 +41,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         >
+         <button
@@ -42,1 +42,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           <Layers className="w-3 h-3" />
+           onClick={onOpenOutbox}
@@ -43,1 +43,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-           <span>إدارة المزامنة</span>
+           className="mr-2 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
@@ -44,1 +44,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-         </button>
+         >
@@ -45,1 +45,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-       )}
+           <Layers className="w-3 h-3" />
@@ -46,1 +46,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-     </div>
+           <span>{t("offline.labels.txt_1f39b6")}</span>
@@ -47,1 +47,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
-   );
+         </button>
@@ -48,1 +48,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- };
+       )}
@@ -49,1 +49,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+     </div>
@@ -50,1 +50,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+   );
@@ -51,1 +51,1 @@ /app/applet/src/components/offline/OfflineIndicator.tsx
- 
+ };
```

## File: `/app/applet/src/components/offline/OutboxDrawer.tsx`

- **Pre-Migration Hash:** `ad4accab403bf8e9`
- **Post-Migration Hash:** `caae073d44010c6e`
- **Transformations Applied:** 66
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (65):**
  - `offline.labels.txt_5cde42`
  - `offline.labels.createTripPricing`
  - `offline.labels.txt_66cc97`
  - `offline.labels.txt_539bb6`
  - `offline.labels.txt_9a78d6`
  - `offline.labels.txt_41cc14`
  - `offline.labels.txt_7490af`
  - `offline.labels.txt_6464df`
  - `offline.labels.txt_6fc0d8`
  - `offline.labels.txt_a9b605`
  - `offline.labels.txt_231b48`
  - `offline.labels.txt_6aaee2`
  - `offline.labels.txt_46be08`
  - `offline.labels.txt_10b6c4`
  - `offline.status.txt_60598f`
  - `offline.labels.save_3`
  - `offline.labels.txt_712649`
  - `offline.labels.editMaterial`
  - `offline.labels.txt_759c62`
  - `offline.labels.txt_7eb4ca`
  - `offline.labels.carrier`
  - `offline.labels.txt_15265b`
  - `offline.labels.txt_32233e`
  - `offline.labels.txt_5fc250`
  - `offline.labels.trip_2`
  - `offline.labels.txt_2a087d`
  - `offline.status.trip`
  - `offline.labels.edit_2`
  - `offline.labels.txt_4e058d`
  - `offline.labels.txt_2eef0a`
  - `offline.labels.txt_532950`
  - `offline.labels.pricing_2`
  - `offline.labels.txt_55319d`
  - `offline.labels.txt_6aae4c`
  - `offline.labels.save_2`
  - `offline.labels.save`
  - `offline.labels.txt_197045`
  - `offline.labels.txt_5753f6`
  - `offline.labels.txt_44754a`
  - `offline.labels.txt_21781d`
  - `offline.labels.txt_a748f4`
  - `offline.labels.details`
  - `offline.status.failed_2`
  - `offline.labels.txt_292ade`
  - `offline.status.pending_2`
  - `offline.labels.txt_6526c5`
  - `offline.labels.txt_402c63`
  - `offline.labels.createTrip_2`
  - `offline.labels.txt_9b46da`
  - `offline.labels.txt_8b427e`
  - `offline.labels.txt_4043c4`
  - `offline.labels.filter`
  - `offline.labels.txt_519208`
  - `offline.labels.txt_47ad3c`
  - `offline.labels.txt_66c55e`
  - `offline.labels.txt_31f297`
  - `offline.labels.txt_74ecba`
  - `offline.labels.txt_3f37a7`
  - `offline.labels.txt_140117`
  - `offline.labels.txt_5542eb`
  - `offline.labels.txt_751d01`
  - `offline.status.txt_177559`
  - `offline.labels.txt_731fc0`
  - `offline.labels.txt_3bb240`
  - `offline.labels.txt_7eabcf`

### Unified Diff / Patch

```diff
@@ -37,1 +37,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -38,1 +38,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- interface OutboxDrawerProps {
+ 
@@ -39,1 +39,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   isOpen: boolean;
+ 
@@ -40,1 +40,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   onClose: () => void;
+ interface OutboxDrawerProps {
@@ -41,1 +41,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   onNotification?: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
+   isOpen: boolean;
@@ -42,1 +42,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- }
+   onClose: () => void;
@@ -43,1 +43,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+   onNotification?: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
@@ -44,1 +44,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- export const OutboxDrawer: React.FC<OutboxDrawerProps> = ({
+ }
@@ -45,1 +45,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   isOpen,
+ 
@@ -46,1 +46,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   onClose,
+ export const OutboxDrawer: React.FC<OutboxDrawerProps> = ({
@@ -47,1 +47,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   onNotification
+   isOpen,
@@ -48,1 +48,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- }) => {
+   onClose,
@@ -49,1 +49,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();
+   onNotification
@@ -50,1 +50,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+ }) => {
@@ -51,1 +51,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [activeTab, setActiveTab] = useState<'OUTBOX' | 'CONFLICTS' | 'CACHE'>('OUTBOX');
+   const { t } = useI18n();
@@ -52,1 +52,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [statusFilter, setStatusFilter] = useState<OutboxStatus | 'ALL'>('ALL');
+   const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();
@@ -53,1 +53,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [operations, setOperations] = useState<OutboxOperation[]>([]);
+ 
@@ -54,1 +54,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [stats, setStats] = useState<OutboxStats>({ total: 0, pending: 0, sending: 0, synced: 0, failed: 0, conflict: 0 });
+   const [activeTab, setActiveTab] = useState<'OUTBOX' | 'CONFLICTS' | 'CACHE'>('OUTBOX');
@@ -55,1 +55,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [cacheMeta, setCacheMeta] = useState<CacheStoreMetadata[]>([]);
+   const [statusFilter, setStatusFilter] = useState<OutboxStatus | 'ALL'>('ALL');
@@ -56,1 +56,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
+   const [operations, setOperations] = useState<OutboxOperation[]>([]);
@@ -57,1 +57,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
+   const [stats, setStats] = useState<OutboxStats>({ total: 0, pending: 0, sending: 0, synced: 0, failed: 0, conflict: 0 });
@@ -58,1 +58,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
+   const [cacheMeta, setCacheMeta] = useState<CacheStoreMetadata[]>([]);
@@ -59,1 +59,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [isSyncing, setIsSyncing] = useState<boolean>(false);
+   const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
@@ -60,1 +60,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [isRefreshingCache, setIsRefreshingCache] = useState<boolean>(false);
+   const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
@@ -61,1 +61,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [isSimulatingConflict, setIsSimulatingConflict] = useState<boolean>(false);
+   const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
@@ -62,1 +62,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
+   const [isSyncing, setIsSyncing] = useState<boolean>(false);
@@ -63,1 +63,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [testSuiteResult, setTestSuiteResult] = useState<{
+   const [isRefreshingCache, setIsRefreshingCache] = useState<boolean>(false);
@@ -64,1 +64,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     allPassed: boolean;
+   const [isSimulatingConflict, setIsSimulatingConflict] = useState<boolean>(false);
@@ -65,1 +65,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     totalTests: number;
+   const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
@@ -66,1 +66,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     passedTests: number;
+   const [testSuiteResult, setTestSuiteResult] = useState<{
@@ -67,1 +67,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     failedTests: number;
+     allPassed: boolean;
@@ -68,1 +68,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     results: ConflictTestCaseResult[];
+     totalTests: number;
@@ -69,1 +69,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   } | null>(null);
+     passedTests: number;
@@ -70,1 +70,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
+     failedTests: number;
@@ -71,1 +71,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+     results: ConflictTestCaseResult[];
@@ -72,1 +72,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const loadData = async () => {
+   } | null>(null);
@@ -73,1 +73,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     try {
+   const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
@@ -74,1 +74,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       const [ops, st, meta, confs] = await Promise.all([
+ 
@@ -75,1 +75,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         outboxService.getOperations(),
+   const loadData = async () => {
@@ -76,1 +76,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         outboxService.getStats(),
+     try {
@@ -77,1 +77,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         offlineCacheService.getCacheMetadata(),
+       const [ops, st, meta, confs] = await Promise.all([
@@ -78,1 +78,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         conflictResolutionService.getConflicts(),
+         outboxService.getOperations(),
@@ -79,1 +79,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       ]);
+         outboxService.getStats(),
@@ -80,1 +80,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setOperations(ops);
+         offlineCacheService.getCacheMetadata(),
@@ -81,1 +81,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setStats(st);
+         conflictResolutionService.getConflicts(),
@@ -82,1 +82,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setCacheMeta(meta);
+       ]);
@@ -83,1 +83,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setConflicts(confs);
+       setOperations(ops);
@@ -84,1 +84,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } catch (err) {
+       setStats(st);
@@ -85,1 +85,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       console.error('Failed to load outbox/cache state:', err);
+       setCacheMeta(meta);
@@ -86,1 +86,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+       setConflicts(confs);
@@ -87,1 +87,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+     } catch (err) {
@@ -88,1 +88,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       console.error('Failed to load outbox/cache state:', err);
@@ -89,1 +89,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   useEffect(() => {
+     }
@@ -90,1 +90,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     if (isOpen) {
+   };
@@ -91,1 +91,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       loadData();
+ 
@@ -92,1 +92,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+   useEffect(() => {
@@ -93,1 +93,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     const unsubOutbox = outboxService.subscribe(() => {
+     if (isOpen) {
@@ -95,1 +95,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     });
+     }
@@ -96,1 +96,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     const unsubConflicts = conflictResolutionService.subscribe(() => {
+     const unsubOutbox = outboxService.subscribe(() => {
@@ -99,1 +99,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     return () => {
+     const unsubConflicts = conflictResolutionService.subscribe(() => {
@@ -100,1 +100,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       unsubOutbox();
+       loadData();
@@ -101,1 +101,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       unsubConflicts();
+     });
@@ -102,1 +102,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     };
+     return () => {
@@ -103,1 +103,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   }, [isOpen]);
+       unsubOutbox();
@@ -104,1 +104,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       unsubConflicts();
@@ -105,1 +105,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   if (!isOpen) return null;
+     };
@@ -106,1 +106,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+   }, [isOpen]);
@@ -107,1 +107,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleSyncAll = async () => {
+ 
@@ -108,1 +108,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     if (!isOnline) {
+   if (!isOpen) return null;
@@ -109,1 +109,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+ 
@@ -110,1 +110,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'ERROR',
+   const handleSyncAll = async () => {
@@ -111,1 +111,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: 'لا يمكن بدء المزامنة: التطبيق في وضع عدم الاتصال (Offline).'
+     if (!isOnline) {
@@ -112,1 +112,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -113,1 +113,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       return;
+         type: 'ERROR',
@@ -114,1 +114,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+         message: 'لا يمكن بدء المزامنة: التطبيق في وضع عدم الاتصال (Offline).'
@@ -115,1 +115,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       });
@@ -116,1 +116,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     setIsSyncing(true);
+       return;
@@ -117,1 +117,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     try {
+     }
@@ -118,1 +118,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       const res = await outboxService.syncAll(isSimulatedOffline);
+ 
@@ -119,1 +119,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       await loadData();
+     setIsSyncing(true);
@@ -120,1 +120,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+     try {
@@ -121,1 +121,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'SUCCESS',
+       const res = await outboxService.syncAll(isSimulatedOffline);
@@ -122,1 +122,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: `اكتملت المزامنة: تمت معالجة ${res.processedCount} عملية (نجاح: ${res.syncedCount}، فشل: ${res.failedCount}، تعارض: ${res.conflictCount})`
+       await loadData();
@@ -123,1 +123,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -124,1 +124,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } catch (err: any) {
+         type: 'SUCCESS',
@@ -125,1 +125,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+         message: `اكتملت المزامنة: تمت معالجة ${res.processedCount} عملية (نجاح: ${res.syncedCount}، فشل: ${res.failedCount}، تعارض: ${res.conflictCount})`
@@ -126,1 +126,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'ERROR',
+       });
@@ -127,1 +127,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: err.message || 'فشلت المزامنة'
+     } catch (err: any) {
@@ -128,1 +128,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -129,1 +129,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } finally {
+         type: 'ERROR',
@@ -130,1 +130,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setIsSyncing(false);
+         message: err.message || 'فشلت المزامنة'
@@ -131,1 +131,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+       });
@@ -132,1 +132,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+     } finally {
@@ -133,1 +133,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       setIsSyncing(false);
@@ -134,1 +134,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleRetryOp = async (opId: string) => {
+     }
@@ -135,1 +135,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     await outboxService.retryOperation(opId);
+   };
@@ -136,1 +136,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     if (isOnline) {
+ 
@@ -137,1 +137,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       handleSyncAll();
+   const handleRetryOp = async (opId: string) => {
@@ -138,1 +138,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } else {
+     await outboxService.retryOperation(opId);
@@ -139,1 +139,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+     if (isOnline) {
@@ -140,1 +140,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'SUCCESS',
+       handleSyncAll();
@@ -141,1 +141,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: 'تمت إعادة تعيين العملية إلى حالة الانتظار (PENDING). ستتم المزامنة عند الاتصال.'
+     } else {
@@ -142,1 +142,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -143,1 +143,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+         type: 'SUCCESS',
@@ -144,1 +144,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+         message: 'تمت إعادة تعيين العملية إلى حالة الانتظار (PENDING). ستتم المزامنة عند الاتصال.'
@@ -145,1 +145,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       });
@@ -146,1 +146,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleClearSynced = async () => {
+     }
@@ -147,1 +147,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     await outboxService.clearSynced();
+   };
@@ -148,1 +148,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     await loadData();
+ 
@@ -149,1 +149,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     onNotification?.({
+   const handleClearSynced = async () => {
@@ -150,1 +150,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       type: 'SUCCESS',
+     await outboxService.clearSynced();
@@ -151,1 +151,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       message: 'تم مسح العمليات المزامنة والمؤكدة بنجاح من صندوق الصادر.'
+     await loadData();
@@ -152,1 +152,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     });
+     onNotification?.({
@@ -153,1 +153,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+       type: 'SUCCESS',
@@ -154,1 +154,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       message: 'تم مسح العمليات المزامنة والمؤكدة بنجاح من صندوق الصادر.'
@@ -155,1 +155,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleRefreshCache = async () => {
+     });
@@ -156,1 +156,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     setIsRefreshingCache(true);
+   };
@@ -157,1 +157,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     try {
+ 
@@ -158,1 +158,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       const res = await offlineCacheService.refreshCacheWithBump();
+   const handleRefreshCache = async () => {
@@ -159,1 +159,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       await loadData();
+     setIsRefreshingCache(true);
@@ -160,1 +160,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+     try {
@@ -161,1 +161,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'SUCCESS',
+       const res = await offlineCacheService.refreshCacheWithBump();
@@ -162,1 +162,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: `تم تحديث وتخزين البيانات المحلية في IndexedDB بنجاح (الإصدار: v${res.newVersion})`
+       await loadData();
@@ -163,1 +163,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -164,1 +164,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } catch (err: any) {
+         type: 'SUCCESS',
@@ -165,1 +165,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+         message: `تم تحديث وتخزين البيانات المحلية في IndexedDB بنجاح (الإصدار: v${res.newVersion})`
@@ -166,1 +166,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'ERROR',
+       });
@@ -167,1 +167,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: err.message || 'فشل تحديث الذاكرة المحلية'
+     } catch (err: any) {
@@ -168,1 +168,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -169,1 +169,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } finally {
+         type: 'ERROR',
@@ -170,1 +170,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setIsRefreshingCache(false);
+         message: err.message || 'فشل تحديث الذاكرة المحلية'
@@ -171,1 +171,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+       });
@@ -172,1 +172,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+     } finally {
@@ -173,1 +173,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       setIsRefreshingCache(false);
@@ -174,1 +174,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleOpenConflictForOp = async (op: OutboxOperation) => {
+     }
@@ -175,1 +175,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     const confId = op.conflictDetails?.conflictId;
+   };
@@ -176,1 +176,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     let found = conflicts.find(c => c.conflictId === confId || c.operationId === op.operationId);
+ 
@@ -177,1 +177,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     if (!found) {
+   const handleOpenConflictForOp = async (op: OutboxOperation) => {
@@ -178,1 +178,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       // If not yet saved in memory, detect or build it
+     const confId = op.conflictDetails?.conflictId;
@@ -179,1 +179,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       const detected = conflictResolutionService.detectConflict(op);
+     let found = conflicts.find(c => c.conflictId === confId || c.operationId === op.operationId);
@@ -180,1 +180,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       if (detected) {
+     if (!found) {
@@ -181,1 +181,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         found = detected;
+       // If not yet saved in memory, detect or build it
@@ -182,1 +182,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       }
+       const detected = conflictResolutionService.detectConflict(op);
@@ -183,1 +183,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+       if (detected) {
@@ -184,1 +184,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     if (found) {
+         found = detected;
@@ -185,1 +185,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setSelectedConflict(found);
+       }
@@ -186,1 +186,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setIsConflictModalOpen(true);
+     }
@@ -187,1 +187,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+     if (found) {
@@ -188,1 +188,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+       setSelectedConflict(found);
@@ -189,1 +189,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       setIsConflictModalOpen(true);
@@ -190,1 +190,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleOpenConflictModal = (conflict: ConflictRecord) => {
+     }
@@ -191,1 +191,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     setSelectedConflict(conflict);
+   };
@@ -192,1 +192,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     setIsConflictModalOpen(true);
+ 
@@ -193,1 +193,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+   const handleOpenConflictModal = (conflict: ConflictRecord) => {
@@ -194,1 +194,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+     setSelectedConflict(conflict);
@@ -195,1 +195,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleSimulateConflict = async (type: ConflictType) => {
+     setIsConflictModalOpen(true);
@@ -196,1 +196,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     setIsSimulatingConflict(true);
+   };
@@ -197,1 +197,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     try {
+ 
@@ -198,1 +198,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       const record = await conflictResolutionService.simulateConflict(type);
+   const handleSimulateConflict = async (type: ConflictType) => {
@@ -199,1 +199,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       await loadData();
+     setIsSimulatingConflict(true);
@@ -200,1 +200,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setActiveTab('CONFLICTS');
+     try {
@@ -201,1 +201,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+       const record = await conflictResolutionService.simulateConflict(type);
@@ -202,1 +202,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'SECURITY',
+       await loadData();
@@ -203,1 +203,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: `تمت محاكاة التعارض (${type}) بنجاح. تم تجميد العملية في Outbox وحفظ لقطة البيانات للتدقيق.`
+       setActiveTab('CONFLICTS');
@@ -204,1 +204,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -205,1 +205,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } catch (err: any) {
+         type: 'SECURITY',
@@ -206,1 +206,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+         message: `تمت محاكاة التعارض (${type}) بنجاح. تم تجميد العملية في Outbox وحفظ لقطة البيانات للتدقيق.`
@@ -207,1 +207,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'ERROR',
+       });
@@ -208,1 +208,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: err.message || 'فشلت محاكاة التعارض'
+     } catch (err: any) {
@@ -209,1 +209,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -210,1 +210,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } finally {
+         type: 'ERROR',
@@ -211,1 +211,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setIsSimulatingConflict(false);
+         message: err.message || 'فشلت محاكاة التعارض'
@@ -212,1 +212,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+       });
@@ -213,1 +213,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+     } finally {
@@ -214,1 +214,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       setIsSimulatingConflict(false);
@@ -215,1 +215,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const handleRunTestSuite = async () => {
+     }
@@ -216,1 +216,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     setIsRunningTests(true);
+   };
@@ -217,1 +217,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     try {
+ 
@@ -218,1 +218,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       const res = await runConflictResolutionTestSuite();
+   const handleRunTestSuite = async () => {
@@ -219,1 +219,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setTestSuiteResult(res);
+     setIsRunningTests(true);
@@ -220,1 +220,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       await loadData();
+     try {
@@ -221,1 +221,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+       const res = await runConflictResolutionTestSuite();
@@ -222,1 +222,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: res.allPassed ? 'SUCCESS' : 'ERROR',
+       setTestSuiteResult(res);
@@ -223,1 +223,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: res.allPassed
+       await loadData();
@@ -224,1 +224,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           ? `اجتازت جميع اختبارات التعارضات (${res.passedTests}/${res.totalTests}) بنجاح تام وفق المحددات الإلزامية.`
+       onNotification?.({
@@ -225,1 +225,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           : `يوجد (${res.failedTests}) اختبار لم يجتز الفحص.`,
+         type: res.allPassed ? 'SUCCESS' : 'ERROR',
@@ -226,1 +226,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+         message: res.allPassed
@@ -227,1 +227,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } catch (err: any) {
+           ? `اجتازت جميع اختبارات التعارضات (${res.passedTests}/${res.totalTests}) بنجاح تام وفق المحددات الإلزامية.`
@@ -228,1 +228,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       onNotification?.({
+           : `يوجد (${res.failedTests}) اختبار لم يجتز الفحص.`,
@@ -229,1 +229,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         type: 'ERROR',
+       });
@@ -230,1 +230,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         message: err.message || 'فشل تشغيل فحص التحقق للتعارضات',
+     } catch (err: any) {
@@ -231,1 +231,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       });
+       onNotification?.({
@@ -232,1 +232,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     } finally {
+         type: 'ERROR',
@@ -233,1 +233,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       setIsRunningTests(false);
+         message: err.message || 'فشل تشغيل فحص التحقق للتعارضات',
@@ -234,1 +234,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+       });
@@ -235,1 +235,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+     } finally {
@@ -236,1 +236,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+       setIsRunningTests(false);
@@ -237,1 +237,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const filteredOps = operations.filter(op => {
+     }
@@ -238,1 +238,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     if (statusFilter === 'ALL') return true;
+   };
@@ -239,1 +239,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     return op.status === statusFilter;
+ 
@@ -240,1 +240,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   });
+   const filteredOps = operations.filter(op => {
@@ -241,1 +241,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+     if (statusFilter === 'ALL') return true;
@@ -242,1 +242,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const getStatusBadge = (status: OutboxStatus) => {
+     return op.status === statusFilter;
@@ -243,1 +243,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     switch (status) {
+   });
@@ -244,1 +244,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       case 'PENDING':
+ 
@@ -245,1 +245,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         return (
+   const getStatusBadge = (status: OutboxStatus) => {
@@ -246,1 +246,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
+     switch (status) {
@@ -247,1 +247,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <Clock className="w-3 h-3" />
+       case 'PENDING':
@@ -248,1 +248,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>قيد الانتظار PENDING</span>
+         return (
@@ -249,1 +249,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
@@ -250,1 +250,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         );
+             <Clock className="w-3 h-3" />
@@ -251,1 +251,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       case 'SENDING':
+             <span>{t("offline.labels.txt_7eabcf")}</span>
@@ -252,1 +252,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         return (
+           </span>
@@ -253,1 +253,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300 text-[11px] font-bold animate-pulse">
+         );
@@ -254,1 +254,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <RotateCw className="w-3 h-3 animate-spin" />
+       case 'SENDING':
@@ -255,1 +255,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>جاري الإرسال SENDING</span>
+         return (
@@ -256,1 +256,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300 text-[11px] font-bold animate-pulse">
@@ -257,1 +257,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         );
+             <RotateCw className="w-3 h-3 animate-spin" />
@@ -258,1 +258,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       case 'SYNCED':
+             <span>{t("offline.labels.txt_3bb240")}</span>
@@ -259,1 +259,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         return (
+           </span>
@@ -260,1 +260,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
+         );
@@ -261,1 +261,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <CheckCircle2 className="w-3 h-3" />
+       case 'SYNCED':
@@ -262,1 +262,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>تمت المزامنة SYNCED</span>
+         return (
@@ -263,1 +263,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
@@ -264,1 +264,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         );
+             <CheckCircle2 className="w-3 h-3" />
@@ -265,1 +265,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       case 'FAILED':
+             <span>{t("offline.labels.txt_731fc0")}</span>
@@ -266,1 +266,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         return (
+           </span>
@@ -267,1 +267,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-bold">
+         );
@@ -268,1 +268,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <XCircle className="w-3 h-3" />
+       case 'FAILED':
@@ -269,1 +269,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>فشلت FAILED</span>
+         return (
@@ -270,1 +270,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-bold">
@@ -271,1 +271,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         );
+             <XCircle className="w-3 h-3" />
@@ -272,1 +272,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       case 'CONFLICT':
+             <span>{t("offline.status.txt_177559")}</span>
@@ -273,1 +273,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         return (
+           </span>
@@ -274,1 +274,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-300 text-[11px] font-bold">
+         );
@@ -275,1 +275,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <AlertTriangle className="w-3 h-3" />
+       case 'CONFLICT':
@@ -276,1 +276,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>تعارض CONFLICT</span>
+         return (
@@ -277,1 +277,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-300 text-[11px] font-bold">
@@ -278,1 +278,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         );
+             <AlertTriangle className="w-3 h-3" />
@@ -279,1 +279,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     }
+             <span>{t("offline.labels.txt_751d01")}</span>
@@ -280,1 +280,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+           </span>
@@ -281,1 +281,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+         );
@@ -282,1 +282,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   const STORE_LABELS: Record<string, string> = {
+     }
@@ -283,1 +283,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     projects: 'المشاريع (Projects)',
+   };
@@ -284,1 +284,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     carriers: 'الناقلين (Carriers)',
+ 
@@ -285,1 +285,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     materials: 'المواد (Materials)',
+   const STORE_LABELS: Record<string, string> = {
@@ -286,1 +286,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     trucks: 'الشاحنات (Trucks)',
+     projects: 'المشاريع (Projects)',
@@ -287,1 +287,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     drivers: 'السائقين (Drivers)',
+     carriers: 'الناقلين (Carriers)',
@@ -288,1 +288,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     pricingRules: 'قواعد التسعير (Pricing Rules)',
+     materials: 'المواد (Materials)',
@@ -289,1 +289,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   };
+     trucks: 'الشاحنات (Trucks)',
@@ -290,1 +290,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+     drivers: 'السائقين (Drivers)',
@@ -291,1 +291,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   return (
+     pricingRules: 'قواعد التسعير (Pricing Rules)',
@@ -292,1 +292,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl">
+   };
@@ -293,1 +293,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       <div className="w-full max-w-2xl h-full bg-stone-50 border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-right">
+ 
@@ -294,1 +294,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         
+   return (
@@ -295,1 +295,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         {/* Header */}
+     <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl">
@@ -296,1 +296,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
+       <div className="w-full max-w-2xl h-full bg-stone-50 border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-right">
@@ -297,1 +297,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <div className="flex items-center gap-3">
+         
@@ -298,1 +298,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
+         {/* Header */}
@@ -299,1 +299,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <Layers className="w-5 h-5" />
+         <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
@@ -300,1 +300,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </div>
+           <div className="flex items-center gap-3">
@@ -301,1 +301,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <div>
+             <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
@@ -302,1 +302,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <h2 className="text-base font-bold text-stone-900">إدارة عدم الاتصال والمزامنة (Offline-First PWA)</h2>
+               <Layers className="w-5 h-5" />
@@ -303,1 +303,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <p className="text-xs text-stone-500">حالة IndexedDB المحلية، طابور الصادر Outbox، وخطوات المزامنة الخادومية</p>
+             </div>
@@ -304,1 +304,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </div>
+             <div>
@@ -305,1 +305,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </div>
+               <h2 className="text-base font-bold text-stone-900">{t("offline.labels.txt_5542eb")}</h2>
@@ -306,1 +306,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               <p className="text-xs text-stone-500">{t("offline.labels.txt_140117")}</p>
@@ -307,1 +307,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <button
+             </div>
@@ -308,1 +308,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             onClick={onClose}
+           </div>
@@ -309,1 +309,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
+ 
@@ -310,1 +310,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           >
+           <button
@@ -311,1 +311,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <X className="w-5 h-5" />
+             onClick={onClose}
@@ -312,1 +312,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </button>
+             className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
@@ -313,1 +313,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         </div>
+           >
@@ -314,1 +314,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+             <X className="w-5 h-5" />
@@ -315,1 +315,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         {/* Network State & Offline Simulation Banner */}
+           </button>
@@ -316,1 +316,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         <div className="bg-stone-900 text-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
+         </div>
@@ -317,1 +317,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <div className="flex items-center gap-2">
+ 
@@ -318,1 +318,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             {isOnline ? (
+         {/* Network State & Offline Simulation Banner */}
@@ -319,1 +319,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <span className="flex items-center gap-1.5 font-bold text-emerald-400">
+         <div className="bg-stone-900 text-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
@@ -320,1 +320,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <Wifi className="w-4 h-4" />
+           <div className="flex items-center gap-2">
@@ -321,1 +321,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <span>حالة الشبكة: متصل بالإنترنت (Online)</span>
+             {isOnline ? (
@@ -322,1 +322,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </span>
+               <span className="flex items-center gap-1.5 font-bold text-emerald-400">
@@ -323,1 +323,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             ) : (
+                 <Wifi className="w-4 h-4" />
@@ -324,1 +324,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <span className="flex items-center gap-1.5 font-bold text-amber-400">
+                 <span>{t("offline.labels.txt_3f37a7")}</span>
@@ -325,1 +325,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <WifiOff className="w-4 h-4" />
+               </span>
@@ -326,1 +326,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <span>حالة الشبكة: غير متصل (Offline Mode)</span>
+             ) : (
@@ -327,1 +327,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </span>
+               <span className="flex items-center gap-1.5 font-bold text-amber-400">
@@ -328,1 +328,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             )}
+                 <WifiOff className="w-4 h-4" />
@@ -329,1 +329,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span className="text-stone-400">|</span>
+                 <span>{t("offline.labels.txt_74ecba")}</span>
@@ -330,1 +330,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span className="text-stone-300 font-mono text-[11px] flex items-center gap-1">
+               </span>
@@ -331,1 +331,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <Smartphone className="w-3.5 h-3.5 text-stone-400" />
+             )}
@@ -332,1 +332,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <span>الجهاز: {outboxService.getDeviceId()}</span>
+             <span className="text-stone-400">|</span>
@@ -333,1 +333,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </span>
+             <span className="text-stone-300 font-mono text-[11px] flex items-center gap-1">
@@ -334,1 +334,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </div>
+               <Smartphone className="w-3.5 h-3.5 text-stone-400" />
@@ -335,1 +335,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               <span>الجهاز: {outboxService.getDeviceId()}</span>
@@ -336,1 +336,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <div className="flex items-center gap-2">
+             </span>
@@ -337,1 +337,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span className="text-stone-300 text-[11px]">محاكاة انقطاع الإنترنت:</span>
+           </div>
@@ -338,1 +338,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <button
+ 
@@ -339,1 +339,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               onClick={toggleSimulatedOffline}
+           <div className="flex items-center gap-2">
@@ -340,1 +340,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
+             <span className="text-stone-300 text-[11px]">{t("offline.labels.txt_31f297")}</span>
@@ -341,1 +341,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 isSimulatedOffline
+             <button
@@ -342,1 +342,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   ? 'bg-rose-600 text-white shadow-xs'
+               onClick={toggleSimulatedOffline}
@@ -343,1 +343,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
+               className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
@@ -344,1 +344,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               }`}
+                 isSimulatedOffline
@@ -345,1 +345,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             >
+                   ? 'bg-rose-600 text-white shadow-xs'
@@ -346,1 +346,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {isSimulatedOffline ? 'إيقاف المحاكاة (Go Online)' : 'تفعيل المحاكاة (Go Offline)'}
+                   : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
@@ -347,1 +347,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </button>
+               }`}
@@ -348,1 +348,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </div>
+             >
@@ -349,1 +349,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         </div>
+               {isSimulatedOffline ? 'إيقاف المحاكاة (Go Online)' : 'تفعيل المحاكاة (Go Offline)'}
@@ -350,1 +350,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+             </button>
@@ -351,1 +351,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         {/* Tab Selection */}
+           </div>
@@ -352,1 +352,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         <div className="flex border-b border-stone-200 bg-white px-6 pt-2 gap-2">
+         </div>
@@ -353,1 +353,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <button
+ 
@@ -354,1 +354,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             onClick={() => setActiveTab('OUTBOX')}
+         {/* Tab Selection */}
@@ -355,1 +355,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
+         <div className="flex border-b border-stone-200 bg-white px-6 pt-2 gap-2">
@@ -356,1 +356,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               activeTab === 'OUTBOX'
+           <button
@@ -357,1 +357,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 ? 'border-amber-600 text-amber-900'
+             onClick={() => setActiveTab('OUTBOX')}
@@ -358,1 +358,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 : 'border-transparent text-stone-500 hover:text-stone-800'
+             className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
@@ -359,1 +359,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             }`}
+               activeTab === 'OUTBOX'
@@ -360,1 +360,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           >
+                 ? 'border-amber-600 text-amber-900'
@@ -361,1 +361,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <Send className="w-4 h-4" />
+                 : 'border-transparent text-stone-500 hover:text-stone-800'
@@ -362,1 +362,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>طابور الصادر (Outbox Queue)</span>
+             }`}
@@ -363,1 +363,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             {stats.pending > 0 && (
+           >
@@ -364,1 +364,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px]">
+             <Send className="w-4 h-4" />
@@ -365,1 +365,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 {stats.pending}
+             <span>{t("offline.labels.txt_66c55e")}</span>
@@ -366,1 +366,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </span>
+             {stats.pending > 0 && (
@@ -367,1 +367,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             )}
+               <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px]">
@@ -368,1 +368,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </button>
+                 {stats.pending}
@@ -369,1 +369,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               </span>
@@ -370,1 +370,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <button
+             )}
@@ -371,1 +371,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             onClick={() => setActiveTab('CONFLICTS')}
+           </button>
@@ -372,1 +372,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
+ 
@@ -373,1 +373,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               activeTab === 'CONFLICTS'
+           <button
@@ -374,1 +374,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 ? 'border-purple-600 text-purple-950'
+             onClick={() => setActiveTab('CONFLICTS')}
@@ -375,1 +375,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 : 'border-transparent text-stone-500 hover:text-stone-800'
+             className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
@@ -376,1 +376,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             }`}
+               activeTab === 'CONFLICTS'
@@ -377,1 +377,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           >
+                 ? 'border-purple-600 text-purple-950'
@@ -378,1 +378,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <ShieldAlert className="w-4 h-4 text-purple-600" />
+                 : 'border-transparent text-stone-500 hover:text-stone-800'
@@ -379,1 +379,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>معالجة التعارضات (Conflicts)</span>
+             }`}
@@ -380,1 +380,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             {conflicts.filter(c => c.status === 'OPEN').length > 0 && (
+           >
@@ -381,1 +381,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] animate-pulse">
+             <ShieldAlert className="w-4 h-4 text-purple-600" />
@@ -382,1 +382,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 {conflicts.filter(c => c.status === 'OPEN').length}
+             <span>{t("offline.labels.txt_47ad3c")}</span>
@@ -383,1 +383,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </span>
+             {conflicts.filter(c => c.status === 'OPEN').length > 0 && (
@@ -384,1 +384,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             )}
+               <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] animate-pulse">
@@ -385,1 +385,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </button>
+                 {conflicts.filter(c => c.status === 'OPEN').length}
@@ -386,1 +386,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               </span>
@@ -387,1 +387,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <button
+             )}
@@ -388,1 +388,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             onClick={() => setActiveTab('CACHE')}
+           </button>
@@ -389,1 +389,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
+ 
@@ -390,1 +390,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               activeTab === 'CACHE'
+           <button
@@ -391,1 +391,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 ? 'border-amber-600 text-amber-900'
+             onClick={() => setActiveTab('CACHE')}
@@ -392,1 +392,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 : 'border-transparent text-stone-500 hover:text-stone-800'
+             className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
@@ -393,1 +393,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             }`}
+               activeTab === 'CACHE'
@@ -394,1 +394,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           >
+                 ? 'border-amber-600 text-amber-900'
@@ -395,1 +395,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <Database className="w-4 h-4" />
+                 : 'border-transparent text-stone-500 hover:text-stone-800'
@@ -396,1 +396,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <span>الذاكرة المحلية IndexedDB (Master Data)</span>
+             }`}
@@ -397,1 +397,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </button>
+           >
@@ -398,1 +398,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         </div>
+             <Database className="w-4 h-4" />
@@ -399,1 +399,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+             <span>{t("offline.labels.txt_519208")}</span>
@@ -400,1 +400,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         {/* Content Body */}
+           </button>
@@ -401,1 +401,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         <div className="flex-1 overflow-y-auto p-6 space-y-4">
+         </div>
@@ -402,1 +402,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           {activeTab === 'OUTBOX' && (
+ 
@@ -403,1 +403,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <div className="space-y-4">
+         {/* Content Body */}
@@ -404,1 +404,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Quick Actions & Stats Bar */}
+         <div className="flex-1 overflow-y-auto p-6 space-y-4">
@@ -405,1 +405,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
+           {activeTab === 'OUTBOX' && (
@@ -406,1 +406,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="flex items-center gap-2 flex-wrap">
+             <div className="space-y-4">
@@ -407,1 +407,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <span className="text-xs font-bold text-stone-600">التصفية:</span>
+               {/* Quick Actions & Stats Bar */}
@@ -408,1 +408,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   {(['ALL', 'PENDING', 'SENDING', 'SYNCED', 'FAILED', 'CONFLICT'] as const).map(st => (
+               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
@@ -409,1 +409,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <button
+                 <div className="flex items-center gap-2 flex-wrap">
@@ -410,1 +410,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       key={st}
+                   <span className="text-xs font-bold text-stone-600">{t("offline.labels.filter")}</span>
@@ -411,1 +411,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       onClick={() => setStatusFilter(st)}
+                   {(['ALL', 'PENDING', 'SENDING', 'SYNCED', 'FAILED', 'CONFLICT'] as const).map(st => (
@@ -412,1 +412,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
+                     <button
@@ -413,1 +413,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         statusFilter === st
+                       key={st}
@@ -414,1 +414,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           ? 'bg-amber-100 text-amber-900 border border-amber-300'
+                       onClick={() => setStatusFilter(st)}
@@ -415,1 +415,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
+                       className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
@@ -416,1 +416,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       }`}
+                         statusFilter === st
@@ -417,1 +417,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     >
+                           ? 'bg-amber-100 text-amber-900 border border-amber-300'
@@ -418,1 +418,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       {st === 'ALL' ? `الكل (${stats.total})` : `${st} (${stats[st.toLowerCase() as keyof OutboxStats] || 0})`}
+                           : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
@@ -419,1 +419,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </button>
+                       }`}
@@ -420,1 +420,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   ))}
+                     >
@@ -421,1 +421,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                       {st === 'ALL' ? `الكل (${stats.total})` : `${st} (${stats[st.toLowerCase() as keyof OutboxStats] || 0})`}
@@ -422,1 +422,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                     </button>
@@ -423,1 +423,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="flex items-center gap-2">
+                   ))}
@@ -424,1 +424,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   {stats.synced > 0 && (
+                 </div>
@@ -425,1 +425,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <button
+ 
@@ -426,1 +426,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       onClick={handleClearSynced}
+                 <div className="flex items-center gap-2">
@@ -427,1 +427,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
+                   {stats.synced > 0 && (
@@ -428,1 +428,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       title="تنظيف العمليات المزامنة"
+                     <button
@@ -429,1 +429,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     >
+                       onClick={handleClearSynced}
@@ -430,1 +430,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <Trash2 className="w-3.5 h-3.5" />
+                       className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
@@ -431,1 +431,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>مسح المؤكدة</span>
+                       title={t("offline.labels.txt_4043c4")}
@@ -432,1 +432,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </button>
+                     >
@@ -433,1 +433,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   )}
+                       <Trash2 className="w-3.5 h-3.5" />
@@ -434,1 +434,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <button
+                       <span>{t("offline.labels.txt_8b427e")}</span>
@@ -435,1 +435,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     onClick={handleSyncAll}
+                     </button>
@@ -436,1 +436,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     disabled={isSyncing || !isOnline}
+                   )}
@@ -437,1 +437,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
+                   <button
@@ -438,1 +438,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   >
+                     onClick={handleSyncAll}
@@ -439,1 +439,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
+                     disabled={isSyncing || !isOnline}
@@ -440,1 +440,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة فورية (Sync)'}</span>
+                     className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
@@ -441,1 +441,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </button>
+                   >
@@ -442,1 +442,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                     <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
@@ -443,1 +443,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </div>
+                     <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة فورية (Sync)'}</span>
@@ -444,1 +444,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                   </button>
@@ -445,1 +445,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Operations Cards List */}
+                 </div>
@@ -446,1 +446,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {filteredOps.length === 0 ? (
+               </div>
@@ -447,1 +447,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center space-y-2">
+ 
@@ -448,1 +448,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
+               {/* Operations Cards List */}
@@ -449,1 +449,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <p className="text-sm font-bold text-stone-800">لا توجد عمليات في هذا التصنيف</p>
+               {filteredOps.length === 0 ? (
@@ -450,1 +450,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <p className="text-xs text-stone-500">
+                 <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center space-y-2">
@@ -451,1 +451,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     عند العمل في وضع عدم الاتصال (Offline) وإنشاء رحلة من محطة التحميل، ستظهر العمليات هنا تلقائياً لتتم مزامنتها.
+                   <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
@@ -452,1 +452,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </p>
+                   <p className="text-sm font-bold text-stone-800">{t("offline.labels.txt_9b46da")}</p>
@@ -453,1 +453,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                   <p className="text-xs text-stone-500">
@@ -454,1 +454,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               ) : (
+                     {t("offline.labels.createTrip_2")}</p>
@@ -455,1 +455,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="space-y-3">
+                 </div>
@@ -456,1 +456,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   {filteredOps.map(op => {
+               ) : (
@@ -457,1 +457,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     const isExpanded = expandedOpId === op.operationId;
+                 <div className="space-y-3">
@@ -458,1 +458,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     return (
+                   {filteredOps.map(op => {
@@ -459,1 +459,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <div
+                     const isExpanded = expandedOpId === op.operationId;
@@ -460,1 +460,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         key={op.operationId}
+                     return (
@@ -461,1 +461,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         className="bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all p-4 space-y-3"
+                       <div
@@ -462,1 +462,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       >
+                         key={op.operationId}
@@ -463,1 +463,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
+                         className="bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all p-4 space-y-3"
@@ -464,1 +464,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="flex items-center gap-2">
+                       >
@@ -465,1 +465,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {getStatusBadge(op.status)}
+                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
@@ -466,1 +466,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="font-mono text-xs font-bold text-stone-800">{op.operationId}</span>
+                           <div className="flex items-center gap-2">
@@ -467,1 +467,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="text-stone-300">|</span>
+                             {getStatusBadge(op.status)}
@@ -468,1 +468,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="text-xs text-stone-600 font-medium">نوع العملية: {op.operationType}</span>
+                             <span className="font-mono text-xs font-bold text-stone-800">{op.operationId}</span>
@@ -469,1 +469,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                             <span className="text-stone-300">|</span>
@@ -470,1 +470,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                             <span className="text-xs text-stone-600 font-medium">نوع العملية: {op.operationType}</span>
@@ -471,1 +471,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="flex items-center gap-2 text-xs text-stone-500">
+                           </div>
@@ -472,1 +472,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <Clock className="w-3.5 h-3.5" />
+ 
@@ -473,1 +473,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span>{new Date(op.createdAt).toLocaleTimeString('ar-SA')} - {new Date(op.createdAt).toLocaleDateString('ar-SA')}</span>
+                           <div className="flex items-center gap-2 text-xs text-stone-500">
@@ -474,1 +474,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                             <Clock className="w-3.5 h-3.5" />
@@ -475,1 +475,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </div>
+                             <span>{new Date(op.createdAt).toLocaleTimeString('ar-SA')} - {new Date(op.createdAt).toLocaleDateString('ar-SA')}</span>
@@ -476,1 +476,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -477,1 +477,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Summary Details */}
+                         </div>
@@ -478,1 +478,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
+ 
@@ -479,1 +479,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div>
+                         {/* Summary Details */}
@@ -480,1 +480,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="text-stone-500 block text-[10px]">رقم الرحلة:</span>
+                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
@@ -481,1 +481,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="font-mono font-bold text-stone-900">{op.payload?.tripSerial || op.payload?.tripId || 'N/A'}</span>
+                           <div>
@@ -482,1 +482,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                             <span className="text-stone-500 block text-[10px]">رقم الرحلة:</span>
@@ -483,1 +483,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div>
+                             <span className="font-mono font-bold text-stone-900">{op.payload?.tripSerial || op.payload?.tripId || 'N/A'}</span>
@@ -484,1 +484,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="text-stone-500 block text-[10px]">صافي الوزن:</span>
+                           </div>
@@ -485,1 +485,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="font-bold text-stone-900">
+                           <div>
@@ -486,1 +486,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               {op.payload?.grossWeight && op.payload?.tareWeight 
+                             <span className="text-stone-500 block text-[10px]">صافي الوزن:</span>
@@ -487,1 +487,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 ? `${(op.payload.grossWeight - op.payload.tareWeight).toLocaleString()} كجم`
+                             <span className="font-bold text-stone-900">
@@ -488,1 +488,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 : 'N/A'}
+                               {op.payload?.grossWeight && op.payload?.tareWeight 
@@ -489,1 +489,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </span>
+                                 ? `${(op.payload.grossWeight - op.payload.tareWeight).toLocaleString()} كجم`
@@ -490,1 +490,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                                 : 'N/A'}
@@ -491,1 +491,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div>
+                             </span>
@@ -492,1 +492,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="text-stone-500 block text-[10px]">المبلغ والتسوية:</span>
+                           </div>
@@ -493,1 +493,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {op.payload?.pricingSnapshot?.isPending || op.payload?.pricingStatus === 'PENDING' || op.payload?.pricingRuleId === 'UNRESOLVED_PENDING' ? (
+                           <div>
@@ -494,1 +494,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded text-[11px] border border-amber-300">
+                             <span className="text-stone-500 block text-[10px]">{t("offline.labels.txt_402c63")}</span>
@@ -495,1 +495,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <AlertTriangle className="w-3 h-3 text-amber-600" />
+                             {op.payload?.pricingSnapshot?.isPending || op.payload?.pricingStatus === 'PENDING' || op.payload?.pricingRuleId === 'UNRESOLVED_PENDING' ? (
@@ -496,1 +496,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span>معلق التسوية (Pending)</span>
+                               <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded text-[11px] border border-amber-300">
@@ -497,1 +497,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                                 <AlertTriangle className="w-3 h-3 text-amber-600" />
@@ -498,1 +498,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             ) : (
+                                 <span>معلق التسوية (Pending)</span>
@@ -499,1 +499,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="font-bold text-amber-900">
+                               </span>
@@ -500,1 +500,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 {op.payload?.settlementAmount !== undefined ? `${op.payload.settlementAmount.toLocaleString()} ر.س` : 'N/A'}
+                             ) : (
@@ -501,1 +501,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                               <span className="font-bold text-amber-900">
@@ -502,1 +502,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             )}
+                                 {op.payload?.settlementAmount !== undefined ? `${op.payload.settlementAmount.toLocaleString()} ر.س` : 'N/A'}
@@ -503,1 +503,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                               </span>
@@ -504,1 +504,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div>
+                             )}
@@ -505,1 +505,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="text-stone-500 block text-[10px]">المحاولات:</span>
+                           </div>
@@ -506,1 +506,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="font-bold text-stone-900">{op.retryCount} محاولة</span>
+                           <div>
@@ -507,1 +507,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                             <span className="text-stone-500 block text-[10px]">{t("offline.labels.txt_6526c5")}</span>
@@ -508,1 +508,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </div>
+                             <span className="font-bold text-stone-900">{op.retryCount} محاولة</span>
@@ -509,1 +509,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -510,1 +510,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Pending Pricing Alert */}
+                         </div>
@@ -511,1 +511,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {(op.payload?.pricingSnapshot?.isPending || op.payload?.pricingStatus === 'PENDING' || op.payload?.pricingRuleId === 'UNRESOLVED_PENDING') && (
+ 
@@ -512,1 +512,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="text-xs bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-amber-950 flex items-start gap-2">
+                         {/* Pending Pricing Alert */}
@@ -513,1 +513,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
+                         {(op.payload?.pricingSnapshot?.isPending || op.payload?.pricingStatus === 'PENDING' || op.payload?.pricingRuleId === 'UNRESOLVED_PENDING') && (
@@ -514,1 +514,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div>
+                           <div className="text-xs bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-amber-950 flex items-start gap-2">
@@ -515,1 +515,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div className="font-bold">تنبيه تسعير معلق (Pending Pricing Resolution):</div>
+                             <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
@@ -516,1 +516,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
+                             <div>
@@ -517,1 +517,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 تم تسجيل العملية تشغيلياً بنجاح في سجل الإرسال، ولكن التسوية المالية معلقة لعدم توفر قاعدة تسعير تعاقدية مطابقة. لن يتم احتساب تسوية نهائية لحين اعتماد العقد (لا يتم اعتماد 0.00 ر.س كسعر نهائي).
+                               <div className="font-bold">{t("offline.status.pending_2")}</div>
@@ -518,1 +518,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </div>
+                               <div className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
@@ -519,1 +519,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                                 تم تسجيل العملية تشغيلياً بنجاح في سجل الإرسال، ولكن التسوية المالية معلقة لعدم توفر قاعدة تسعير تعاقدية مطابقة. لن يتم احتساب تسوية نهائية لحين اعتماد العقد (لا يتم اعتماد 0.00 ر.س كسعر نهائي).
@@ -520,1 +520,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                               </div>
@@ -521,1 +521,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                             </div>
@@ -522,1 +522,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -523,1 +523,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Feedback / Error / ACK */}
+                         )}
@@ -524,1 +524,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {op.serverAck && (
+ 
@@ -525,1 +525,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-900 flex items-start gap-2">
+                         {/* Feedback / Error / ACK */}
@@ -526,1 +526,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
+                         {op.serverAck && (
@@ -527,1 +527,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div>
+                           <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-900 flex items-start gap-2">
@@ -528,1 +528,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div className="font-bold">استجابة المصادقة الخادومية (Server ACK):</div>
+                             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
@@ -529,1 +529,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div>{op.serverAck.messageAr} (رقم الرحلة الخادومي: {op.serverAck.tripSerial})</div>
+                             <div>
@@ -530,1 +530,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                               <div className="font-bold">{t("offline.labels.txt_292ade")}</div>
@@ -531,1 +531,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                               <div>{op.serverAck.messageAr} (رقم الرحلة الخادومي: {op.serverAck.tripSerial})</div>
@@ -532,1 +532,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                             </div>
@@ -533,1 +533,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -534,1 +534,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {op.errorReason && (
+                         )}
@@ -535,1 +535,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="text-xs bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-rose-900 flex items-start gap-2">
+ 
@@ -536,1 +536,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
+                         {op.errorReason && (
@@ -537,1 +537,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div>
+                           <div className="text-xs bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-rose-900 flex items-start gap-2">
@@ -538,1 +538,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div className="font-bold">سبب الفشل (Server Validation Error):</div>
+                             <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
@@ -539,1 +539,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div>{op.errorReason}</div>
+                             <div>
@@ -540,1 +540,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                               <div className="font-bold">{t("offline.status.failed_2")}</div>
@@ -541,1 +541,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                               <div>{op.errorReason}</div>
@@ -542,1 +542,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                             </div>
@@ -543,1 +543,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -544,1 +544,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {op.conflictDetails && (
+                         )}
@@ -545,1 +545,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="text-xs bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-purple-900 flex items-start gap-2">
+ 
@@ -546,1 +546,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
+                         {op.conflictDetails && (
@@ -547,1 +547,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div>
+                           <div className="text-xs bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-purple-900 flex items-start gap-2">
@@ -548,1 +548,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div className="font-bold">تفاصيل التعارض (Conflict Detected):</div>
+                             <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
@@ -549,1 +549,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div>{op.conflictDetails.messageAr}</div>
+                             <div>
@@ -550,1 +550,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                               <div className="font-bold">{t("offline.labels.details")}</div>
@@ -551,1 +551,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                               <div>{op.conflictDetails.messageAr}</div>
@@ -552,1 +552,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                             </div>
@@ -553,1 +553,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -554,1 +554,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Expandable Payload & Retry Actions */}
+                         )}
@@ -555,1 +555,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <div className="flex items-center justify-between pt-1">
+ 
@@ -556,1 +556,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <button
+                         {/* Expandable Payload & Retry Actions */}
@@ -557,1 +557,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             onClick={() => setExpandedOpId(isExpanded ? null : op.operationId)}
+                         <div className="flex items-center justify-between pt-1">
@@ -558,1 +558,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium"
+                           <button
@@ -559,1 +559,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           >
+                             onClick={() => setExpandedOpId(isExpanded ? null : op.operationId)}
@@ -560,1 +560,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
+                             className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium"
@@ -561,1 +561,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span>{isExpanded ? 'إخفاء الحمولة الكاملة' : 'عرض تفاصيل الحمولة (Payload)'}</span>
+                           >
@@ -562,1 +562,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </button>
+                             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
@@ -563,1 +563,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                             <span>{isExpanded ? 'إخفاء الحمولة الكاملة' : 'عرض تفاصيل الحمولة (Payload)'}</span>
@@ -564,1 +564,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="flex items-center gap-2">
+                           </button>
@@ -565,1 +565,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {op.status === 'CONFLICT' && (
+ 
@@ -566,1 +566,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <button
+                           <div className="flex items-center gap-2">
@@ -567,1 +567,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 onClick={() => handleOpenConflictForOp(op)}
+                             {op.status === 'CONFLICT' && (
@@ -568,1 +568,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
+                               <button
@@ -569,1 +569,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               >
+                                 onClick={() => handleOpenConflictForOp(op)}
@@ -570,1 +570,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <ShieldAlert className="w-3.5 h-3.5" />
+                                 className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
@@ -571,1 +571,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span>حل التعارض الصريح</span>
+                               >
@@ -572,1 +572,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </button>
+                                 <ShieldAlert className="w-3.5 h-3.5" />
@@ -573,1 +573,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             )}
+                                 <span>{t("offline.labels.txt_46be08")}</span>
@@ -574,1 +574,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                               </button>
@@ -575,1 +575,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {(op.status === 'FAILED' || op.status === 'CONFLICT') && (
+                             )}
@@ -576,1 +576,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <button
+ 
@@ -577,1 +577,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 onClick={() => handleRetryOp(op.operationId)}
+                             {(op.status === 'FAILED' || op.status === 'CONFLICT') && (
@@ -578,1 +578,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-stone-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
+                               <button
@@ -579,1 +579,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               >
+                                 onClick={() => handleRetryOp(op.operationId)}
@@ -580,1 +580,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <RotateCw className="w-3 h-3" />
+                                 className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-stone-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
@@ -581,1 +581,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span>إعادة فحص (Retry)</span>
+                               >
@@ -582,1 +582,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </button>
+                                 <RotateCw className="w-3 h-3" />
@@ -583,1 +583,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             )}
+                                 <span>{t("offline.labels.txt_a748f4")}</span>
@@ -584,1 +584,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                               </button>
@@ -585,1 +585,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </div>
+                             )}
@@ -586,1 +586,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                           </div>
@@ -587,1 +587,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {isExpanded && (
+                         </div>
@@ -588,1 +588,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="mt-2 p-3 bg-stone-900 text-stone-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 text-left" dir="ltr">
+ 
@@ -589,1 +589,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <pre>{JSON.stringify(op.payload, null, 2)}</pre>
+                         {isExpanded && (
@@ -590,1 +590,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                           <div className="mt-2 p-3 bg-stone-900 text-stone-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 text-left" dir="ltr">
@@ -591,1 +591,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                             <pre>{JSON.stringify(op.payload, null, 2)}</pre>
@@ -592,1 +592,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </div>
+                           </div>
@@ -593,1 +593,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     );
+                         )}
@@ -594,1 +594,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   })}
+                       </div>
@@ -595,1 +595,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                     );
@@ -596,1 +596,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               )}
+                   })}
@@ -597,1 +597,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </div>
+                 </div>
@@ -598,1 +598,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           )}
+               )}
@@ -599,1 +599,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+             </div>
@@ -600,1 +600,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           {activeTab === 'CONFLICTS' && (
+           )}
@@ -601,1 +601,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <div className="space-y-4">
+ 
@@ -602,1 +602,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Mandatory Anti-LWW Rules & Pricing Invariance Banner */}
+           {activeTab === 'CONFLICTS' && (
@@ -603,1 +603,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <div className="bg-stone-900 text-white p-4.5 rounded-xl border border-stone-800 space-y-2 shadow-xs">
+             <div className="space-y-4">
@@ -604,1 +604,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="flex items-center justify-between">
+               {/* Mandatory Anti-LWW Rules & Pricing Invariance Banner */}
@@ -605,1 +605,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
+               <div className="bg-stone-900 text-white p-4.5 rounded-xl border border-stone-800 space-y-2 shadow-xs">
@@ -606,1 +606,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <ShieldAlert className="w-4 h-4" />
+                 <div className="flex items-center justify-between">
@@ -607,1 +607,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span>محددات حوكمة التعارضات (Conflict Resolution Mandates)</span>
+                   <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
@@ -608,1 +608,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </div>
+                     <ShieldAlert className="w-4 h-4" />
@@ -609,1 +609,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-purple-300 border border-purple-500/30">
+                     <span>{t("offline.labels.txt_21781d")}</span>
@@ -610,1 +610,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     Strict Audit Trail
+                   </div>
@@ -611,1 +611,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </span>
+                   <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-purple-300 border border-purple-500/30">
@@ -612,1 +612,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                     Strict Audit Trail
@@ -613,1 +613,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-stone-300 pt-1">
+                   </span>
@@ -614,1 +614,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li className="flex items-start gap-1.5">
+                 </div>
@@ -615,1 +615,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-amber-400 font-bold">•</span>
+                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-stone-300 pt-1">
@@ -616,1 +616,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span><strong>منع "آخر كتابة تفوز" (No LWW):</strong> لا يتم استبدال البيانات التشغيلية للرحلات تلقائياً، بل يُلزم المشرف بالحل الصريح.</span>
+                   <li className="flex items-start gap-1.5">
@@ -617,1 +617,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </li>
+                     <span className="text-amber-400 font-bold">•</span>
@@ -618,1 +618,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li className="flex items-start gap-1.5">
+                     <span><strong>{t("offline.labels.txt_44754a")}</strong> {t("offline.labels.txt_5753f6")}</span>
@@ -619,1 +619,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-emerald-400 font-bold">•</span>
+                   </li>
@@ -620,1 +620,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span><strong>ثبات تسعير الـ Offline:</strong> لقطة التسعير المعتمدة وقت الإنشاء بدون اتصال ملزمة للرحلة ولا تتغير بتحديث السعر اللاحق.</span>
+                   <li className="flex items-start gap-1.5">
@@ -621,1 +621,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </li>
+                     <span className="text-emerald-400 font-bold">•</span>
@@ -622,1 +622,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li className="flex items-start gap-1.5">
+                     <span><strong>{t("offline.labels.txt_197045")}</strong> لقطة التسعير المعتمدة وقت الإنشاء بدون اتصال ملزمة للرحلة ولا تتغير بتحديث السعر اللاحق.</span>
@@ -623,1 +623,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-purple-400 font-bold">•</span>
+                   </li>
@@ -624,1 +624,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span><strong>حفظ الأمرين:</strong> يتم تجميد الأمر المحلي وحفظ حالة الخادم وإصدار سجل تعارض موثق في IndexedDB.</span>
+                   <li className="flex items-start gap-1.5">
@@ -625,1 +625,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </li>
+                     <span className="text-purple-400 font-bold">•</span>
@@ -626,1 +626,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li className="flex items-start gap-1.5">
+                     <span><strong>{t("offline.labels.save")}</strong> {t("offline.labels.save_2")}</span>
@@ -627,1 +627,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-blue-400 font-bold">•</span>
+                   </li>
@@ -628,1 +628,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span><strong>سريان الأسعار الجديدة:</strong> السعر المحدث على الخادم يقتصر أثره فقط على الرحلات المستقبلية الجديدة.</span>
+                   <li className="flex items-start gap-1.5">
@@ -629,1 +629,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </li>
+                     <span className="text-blue-400 font-bold">•</span>
@@ -630,1 +630,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </ul>
+                     <span><strong>{t("offline.labels.txt_6aae4c")}</strong> السعر المحدث على الخادم يقتصر أثره فقط على الرحلات المستقبلية الجديدة.</span>
@@ -631,1 +631,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </div>
+                   </li>
@@ -632,1 +632,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                 </ul>
@@ -633,1 +633,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Interactive Simulator: Quick Verification of 7 Conflict Scenarios */}
+               </div>
@@ -634,1 +634,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
+ 
@@ -635,1 +635,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="flex items-center justify-between">
+               {/* Interactive Simulator: Quick Verification of 7 Conflict Scenarios */}
@@ -636,1 +636,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <div>
+               <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
@@ -637,1 +637,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
+                 <div className="flex items-center justify-between">
@@ -638,1 +638,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <Play className="w-3.5 h-3.5 text-amber-600" />
+                   <div>
@@ -639,1 +639,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>محاكي التعارضات التشغيلية (Interactive Conflict Simulator)</span>
+                     <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
@@ -640,1 +640,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </h3>
+                       <Play className="w-3.5 h-3.5 text-amber-600" />
@@ -641,1 +641,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <p className="text-[11px] text-stone-500">
+                       <span>{t("offline.labels.txt_55319d")}</span>
@@ -642,1 +642,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       اضغط لتوليد أي سيناريو واختبار آلية التدقيق وحماية التسعير ومنع الكتابة التلقائية:
+                     </h3>
@@ -643,1 +643,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </p>
+                     <p className="text-[11px] text-stone-500">
@@ -644,1 +644,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </div>
+                       {t("offline.labels.pricing_2")}</p>
@@ -645,1 +645,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   {isSimulatingConflict && (
+                   </div>
@@ -646,1 +646,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-xs text-amber-600 flex items-center gap-1 font-bold animate-pulse">
+                   {isSimulatingConflict && (
@@ -647,1 +647,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <RefreshCw className="w-3 h-3 animate-spin" />
+                     <span className="text-xs text-amber-600 flex items-center gap-1 font-bold animate-pulse">
@@ -648,1 +648,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       جاري المحاكاة...
+                       <RefreshCw className="w-3 h-3 animate-spin" />
@@ -649,1 +649,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </span>
+                       {t("offline.labels.txt_532950")}</span>
@@ -663,1 +663,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-amber-800 block mt-0.5">PRICING_CHANGED وحماية Snapshot</span>
+                     <span className="text-[10px] text-amber-800 block mt-0.5">{t("offline.labels.txt_2eef0a")}</span>
@@ -673,1 +673,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>2. تعارض إصدار</span>
+                       <span>{t("offline.labels.txt_4e058d")}</span>
@@ -675,1 +675,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-indigo-800 block mt-0.5">VERSION_CONFLICT توازي التعديل</span>
+                     <span className="text-[10px] text-indigo-800 block mt-0.5">{t("offline.labels.edit_2")}</span>
@@ -685,1 +685,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>3. رحلة مكتملة</span>
+                       <span>{t("offline.status.trip")}</span>
@@ -687,1 +687,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-emerald-800 block mt-0.5">TRIP_ALREADY_COMPLETED مغلقة</span>
+                     <span className="text-[10px] text-emerald-800 block mt-0.5">{t("offline.labels.txt_2a087d")}</span>
@@ -697,1 +697,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>4. رحلة مرتجعة</span>
+                       <span>{t("offline.labels.trip_2")}</span>
@@ -699,1 +699,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-rose-800 block mt-0.5">TRIP_ALREADY_RETURNED مرفوضة</span>
+                     <span className="text-[10px] text-rose-800 block mt-0.5">{t("offline.labels.txt_5fc250")}</span>
@@ -709,1 +709,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>5. تكرار تذكرة</span>
+                       <span>{t("offline.labels.txt_32233e")}</span>
@@ -711,1 +711,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-orange-800 block mt-0.5">DUPLICATE_OPERATION تكرار القيد</span>
+                     <span className="text-[10px] text-orange-800 block mt-0.5">{t("offline.labels.txt_15265b")}</span>
@@ -721,1 +721,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>6. تعارض الناقل</span>
+                       <span>{t("offline.labels.carrier")}</span>
@@ -723,1 +723,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-purple-800 block mt-0.5">TRUCK_CARRIER_CONFLICT تبعية</span>
+                     <span className="text-[10px] text-purple-800 block mt-0.5">{t("offline.labels.txt_7eb4ca")}</span>
@@ -733,1 +733,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>7. تغيير بيانات أساسية</span>
+                       <span>{t("offline.labels.txt_759c62")}</span>
@@ -735,1 +735,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span className="text-[10px] text-cyan-800 block mt-0.5">MASTER_DATA_CHANGED إيقاف أو تعديل المادة</span>
+                     <span className="text-[10px] text-cyan-800 block mt-0.5">{t("offline.labels.editMaterial")}</span>
@@ -746,1 +746,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>فحص التحقق الآلي للتعارضات (Automated Conflict Test Suite)</span>
+                       <span>{t("offline.labels.txt_712649")}</span>
@@ -749,1 +749,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       برنامج فحص برمجي للتحقق من كافة القواعد والمحددات الإلزامية: الأنواع الـ 7، Anti-LWW، حفظ الأمرين، إشعار المستخدم، ثبات تسعير الـ Offline، والحل الصريح.
+                       {t("offline.labels.save_3")}</p>
@@ -750,1 +750,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </p>
+                   </div>
@@ -751,1 +751,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </div>
+ 
@@ -752,1 +752,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                   <button
@@ -753,1 +753,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <button
+                     onClick={handleRunTestSuite}
@@ -754,1 +754,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     onClick={handleRunTestSuite}
+                     disabled={isRunningTests}
@@ -755,1 +755,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     disabled={isRunningTests}
+                     className="px-3.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
@@ -756,1 +756,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     className="px-3.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
+                   >
@@ -757,1 +757,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   >
+                     <RotateCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
@@ -758,1 +758,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <RotateCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
+                     <span>{isRunningTests ? 'جاري الفحص البرمجي...' : 'تشغيل الفحص الآلي (Run Tests)'}</span>
@@ -759,1 +759,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <span>{isRunningTests ? 'جاري الفحص البرمجي...' : 'تشغيل الفحص الآلي (Run Tests)'}</span>
+                   </button>
@@ -760,1 +760,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </button>
+                 </div>
@@ -761,1 +761,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+ 
@@ -762,1 +762,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                 {/* Test Results Display */}
@@ -763,1 +763,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 {/* Test Results Display */}
+                 {testSuiteResult && (
@@ -764,1 +764,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 {testSuiteResult && (
+                   <div className="space-y-3 pt-2 border-t border-stone-100">
@@ -765,1 +765,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <div className="space-y-3 pt-2 border-t border-stone-100">
+                     <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
@@ -766,1 +766,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
+                       testSuiteResult.allPassed 
@@ -767,1 +767,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       testSuiteResult.allPassed 
+                         ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
@@ -768,1 +768,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
+                         : 'bg-rose-50 border-rose-200 text-rose-950'
@@ -769,1 +769,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         : 'bg-rose-50 border-rose-200 text-rose-950'
+                     }`}>
@@ -770,1 +770,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     }`}>
+                       <div className="flex items-center gap-2">
@@ -771,1 +771,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <div className="flex items-center gap-2">
+                         {testSuiteResult.allPassed ? (
@@ -772,1 +772,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {testSuiteResult.allPassed ? (
+                           <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
@@ -773,1 +773,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
+                         ) : (
@@ -774,1 +774,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         ) : (
+                           <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
@@ -775,1 +775,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
+                         )}
@@ -776,1 +776,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                         <span className="font-bold">
@@ -777,1 +777,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <span className="font-bold">
+                           {testSuiteResult.allPassed
@@ -778,1 +778,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           {testSuiteResult.allPassed
+                             ? `نجح الفحص بالكامل: ${testSuiteResult.passedTests} من أصل ${testSuiteResult.totalTests} اختبار اجتازت التحقق بنسبة 100%`
@@ -779,1 +779,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             ? `نجح الفحص بالكامل: ${testSuiteResult.passedTests} من أصل ${testSuiteResult.totalTests} اختبار اجتازت التحقق بنسبة 100%`
+                             : `فشل الفحص: اجتاز ${testSuiteResult.passedTests} وفشل ${testSuiteResult.failedTests}`}
@@ -780,1 +780,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             : `فشل الفحص: اجتاز ${testSuiteResult.passedTests} وفشل ${testSuiteResult.failedTests}`}
+                         </span>
@@ -781,1 +781,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </span>
+                       </div>
@@ -782,1 +782,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </div>
+                       <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-white border border-stone-200">
@@ -783,1 +783,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-white border border-stone-200">
+                         {testSuiteResult.passedTests}/{testSuiteResult.totalTests} PASSED
@@ -784,1 +784,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {testSuiteResult.passedTests}/{testSuiteResult.totalTests} PASSED
+                       </span>
@@ -785,1 +785,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </span>
+                     </div>
@@ -786,1 +786,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </div>
+ 
@@ -787,1 +787,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                     <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
@@ -788,1 +788,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
+                       {testSuiteResult.results.map(t => (
@@ -789,1 +789,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       {testSuiteResult.results.map(t => (
+                         <div
@@ -790,1 +790,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <div
+                           key={t.id}
@@ -791,1 +791,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           key={t.id}
+                           className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs flex flex-col gap-1"
@@ -792,1 +792,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs flex flex-col gap-1"
+                         >
@@ -793,1 +793,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         >
+                           <div className="flex items-center justify-between">
@@ -794,1 +794,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="flex items-center justify-between">
+                             <div className="flex items-center gap-2">
@@ -795,1 +795,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div className="flex items-center gap-2">
+                               <span className={`w-2 h-2 rounded-full ${t.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
@@ -796,1 +796,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className={`w-2 h-2 rounded-full ${t.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
+                               <span className="font-bold text-stone-900">{t.nameAr}</span>
@@ -797,1 +797,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="font-bold text-stone-900">{t.nameAr}</span>
+                               <span className="text-[10px] font-mono text-stone-400">({t.id})</span>
@@ -798,1 +798,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="text-[10px] font-mono text-stone-400">({t.id})</span>
+                             </div>
@@ -799,1 +799,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
@@ -800,1 +800,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
+                               t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
@@ -801,1 +801,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
+                             }`}>
@@ -802,1 +802,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             }`}>
+                               {t.passed ? 'ناجح PASSED' : 'فاشل FAILED'}
@@ -803,1 +803,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               {t.passed ? 'ناجح PASSED' : 'فاشل FAILED'}
+                             </span>
@@ -804,1 +804,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </span>
+                           </div>
@@ -805,1 +805,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                           <div className="text-[11px] text-stone-600 leading-relaxed">
@@ -806,1 +806,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="text-[11px] text-stone-600 leading-relaxed">
+                             {t.details}
@@ -807,1 +807,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {t.details}
+                           </div>
@@ -808,1 +808,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                         </div>
@@ -809,1 +809,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </div>
+                       ))}
@@ -810,1 +810,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       ))}
+                     </div>
@@ -811,1 +811,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </div>
+                   </div>
@@ -812,1 +812,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </div>
+                 )}
@@ -813,1 +813,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 )}
+               </div>
@@ -814,1 +814,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </div>
+ 
@@ -815,1 +815,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               {/* Conflicts List */}
@@ -816,1 +816,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Conflicts List */}
+               {conflicts.length === 0 ? (
@@ -817,1 +817,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {conflicts.length === 0 ? (
+                 <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
@@ -818,1 +818,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
+                   <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
@@ -819,1 +819,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
+                     <CheckCircle2 className="w-6 h-6" />
@@ -820,1 +820,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <CheckCircle2 className="w-6 h-6" />
+                   </div>
@@ -821,1 +821,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </div>
+                   <h4 className="text-sm font-bold text-stone-800">{t("offline.status.txt_60598f")}</h4>
@@ -822,1 +822,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <h4 className="text-sm font-bold text-stone-800">لا توجد تعارضات معلقة في النظام حالياً</h4>
+                   <p className="text-xs text-stone-500 max-w-md mx-auto">
@@ -823,1 +823,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <p className="text-xs text-stone-500 max-w-md mx-auto">
+                     {t("offline.labels.txt_10b6c4")}</p>
@@ -824,1 +824,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     جميع العمليات متوافقة مع الخادم. يمكنك الضغط على أي زر في المحاكي أعلاه لاختبار منظومة معالجة التعارضات وحماية لقطات التسعير.
+                 </div>
@@ -825,1 +825,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </p>
+               ) : (
@@ -826,1 +826,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                 <div className="space-y-3">
@@ -827,1 +827,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               ) : (
+                   {conflicts.map(conf => {
@@ -828,1 +828,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="space-y-3">
+                     const isOpen = conf.status === 'OPEN';
@@ -829,1 +829,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   {conflicts.map(conf => {
+                     return (
@@ -830,1 +830,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     const isOpen = conf.status === 'OPEN';
+                       <div
@@ -831,1 +831,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     return (
+                         key={conf.conflictId}
@@ -832,1 +832,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <div
+                         className={`bg-white rounded-xl border p-4.5 space-y-3 shadow-2xs transition-all ${
@@ -833,1 +833,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         key={conf.conflictId}
+                           isOpen ? 'border-amber-300 ring-1 ring-amber-100' : 'border-stone-200 bg-stone-50/40'
@@ -834,1 +834,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         className={`bg-white rounded-xl border p-4.5 space-y-3 shadow-2xs transition-all ${
+                         }`}
@@ -835,1 +835,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           isOpen ? 'border-amber-300 ring-1 ring-amber-100' : 'border-stone-200 bg-stone-50/40'
+                       >
@@ -836,1 +836,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         }`}
+                         {/* Header */}
@@ -837,1 +837,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       >
+                         <div className="flex items-start justify-between gap-3">
@@ -838,1 +838,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Header */}
+                           <div className="space-y-1">
@@ -839,1 +839,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <div className="flex items-start justify-between gap-3">
+                             <div className="flex items-center gap-2">
@@ -840,1 +840,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="space-y-1">
+                               <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
@@ -841,1 +841,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div className="flex items-center gap-2">
+                                 isOpen 
@@ -842,1 +842,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
+                                   ? 'bg-amber-100 text-amber-900 border-amber-300'
@@ -843,1 +843,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 isOpen 
+                                   : 'bg-emerald-100 text-emerald-900 border-emerald-300'
@@ -844,1 +844,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   ? 'bg-amber-100 text-amber-900 border-amber-300'
+                               }`}>
@@ -845,1 +845,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   : 'bg-emerald-100 text-emerald-900 border-emerald-300'
+                                 {isOpen ? 'بانتظار الحل الصريح (OPEN)' : 'تمت المعالجة (RESOLVED)'}
@@ -846,1 +846,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               }`}>
+                               </span>
@@ -847,1 +847,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 {isOpen ? 'بانتظار الحل الصريح (OPEN)' : 'تمت المعالجة (RESOLVED)'}
+                               <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-stone-700">
@@ -848,1 +848,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                                 {conf.conflictType}
@@ -849,1 +849,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-stone-700">
+                               </span>
@@ -850,1 +850,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 {conf.conflictType}
+                               <span className="text-[11px] font-mono text-stone-400">
@@ -851,1 +851,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                                 {conf.conflictId}
@@ -852,1 +852,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="text-[11px] font-mono text-stone-400">
+                               </span>
@@ -853,1 +853,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 {conf.conflictId}
+                             </div>
@@ -854,1 +854,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                             <h4 className="text-xs font-bold text-stone-900 pt-0.5">{conf.titleAr}</h4>
@@ -855,1 +855,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                             <p className="text-xs text-stone-600 leading-relaxed">{conf.descriptionAr}</p>
@@ -856,1 +856,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <h4 className="text-xs font-bold text-stone-900 pt-0.5">{conf.titleAr}</h4>
+                           </div>
@@ -857,1 +857,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <p className="text-xs text-stone-600 leading-relaxed">{conf.descriptionAr}</p>
+ 
@@ -858,1 +858,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                           {isOpen && (
@@ -859,1 +859,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                             <button
@@ -860,1 +860,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           {isOpen && (
+                               onClick={() => handleOpenConflictModal(conf)}
@@ -861,1 +861,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <button
+                               className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
@@ -862,1 +862,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               onClick={() => handleOpenConflictModal(conf)}
+                             >
@@ -863,1 +863,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
+                               <ShieldAlert className="w-4 h-4" />
@@ -864,1 +864,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             >
+                               <span>{t("offline.labels.txt_46be08")}</span>
@@ -865,1 +865,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <ShieldAlert className="w-4 h-4" />
+                             </button>
@@ -866,1 +866,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span>حل التعارض الصريح</span>
+                           )}
@@ -867,1 +867,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </button>
+                         </div>
@@ -868,1 +868,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           )}
+ 
@@ -869,1 +869,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </div>
+                         {/* Pricing Invariance Highlight */}
@@ -870,1 +870,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                         {conf.pricingProtection && (
@@ -871,1 +871,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Pricing Invariance Highlight */}
+                           <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
@@ -872,1 +872,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {conf.pricingProtection && (
+                             <div className="flex items-center gap-2">
@@ -873,1 +873,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
+                               <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
@@ -874,1 +874,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div className="flex items-center gap-2">
+                               <div>
@@ -875,1 +875,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
+                                 <span className="font-bold text-emerald-950">{t("offline.labels.txt_6aaee2")}</span>
@@ -876,1 +876,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div>
+                                 <span className="text-emerald-900">
@@ -877,1 +877,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span className="font-bold text-emerald-950">حماية تسعير الـ Offline: </span>
+                                   سعر اللقطة المحفوظة: {conf.pricingProtection.snapshotRate} ر.س | سعر الخادم الجديد: {conf.pricingProtection.serverCurrentRate} ر.س
@@ -878,1 +878,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span className="text-emerald-900">
+                                 </span>
@@ -879,1 +879,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   سعر اللقطة المحفوظة: {conf.pricingProtection.snapshotRate} ر.س | سعر الخادم الجديد: {conf.pricingProtection.serverCurrentRate} ر.س
+                               </div>
@@ -880,1 +880,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 </span>
+                             </div>
@@ -881,1 +881,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </div>
+                             <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
@@ -882,1 +882,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                               السعر محمي تعاقدياً
@@ -883,1 +883,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
+                             </span>
@@ -884,1 +884,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               السعر محمي تعاقدياً
+                           </div>
@@ -885,1 +885,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </span>
+                         )}
@@ -886,1 +886,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+ 
@@ -887,1 +887,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                         {/* Diff Fields Mini View */}
@@ -888,1 +888,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                         <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 text-xs">
@@ -889,1 +889,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Diff Fields Mini View */}
+                           <div className="text-[11px] font-bold text-stone-700 mb-1">{t("offline.labels.txt_231b48")}</div>
@@ -890,1 +890,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 text-xs">
+                           <div className="space-y-1">
@@ -891,1 +891,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="text-[11px] font-bold text-stone-700 mb-1">الفروقات الميدانية المرصودة:</div>
+                             {conf.diffFields.map((d, i) => (
@@ -892,1 +892,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="space-y-1">
+                               <div key={i} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2.5 rounded border border-stone-200">
@@ -893,1 +893,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             {conf.diffFields.map((d, i) => (
+                                 <span className="font-bold text-stone-800">{d.fieldLabelAr} ({d.field})</span>
@@ -894,1 +894,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <div key={i} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2.5 rounded border border-stone-200">
+                                 <div className="flex items-center gap-2 font-mono">
@@ -895,1 +895,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span className="font-bold text-stone-800">{d.fieldLabelAr} ({d.field})</span>
+                                   <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
@@ -896,1 +896,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <div className="flex items-center gap-2 font-mono">
+                                     محلي: {String(d.localValue)}
@@ -897,1 +897,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
+                                   </span>
@@ -898,1 +898,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                     محلي: {String(d.localValue)}
+                                   <span className="text-stone-400">↔</span>
@@ -899,1 +899,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   </span>
+                                   <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
@@ -900,1 +900,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   <span className="text-stone-400">↔</span>
+                                     خادم: {String(d.serverValue)}
@@ -901,1 +901,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
+                                   </span>
@@ -902,1 +902,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                     خادم: {String(d.serverValue)}
+                                 </div>
@@ -903,1 +903,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                   </span>
+                               </div>
@@ -904,1 +904,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 </div>
+                             ))}
@@ -905,1 +905,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </div>
+                           </div>
@@ -906,1 +906,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             ))}
+                         </div>
@@ -907,1 +907,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+ 
@@ -908,1 +908,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </div>
+                         {/* Resolution Summary if RESOLVED */}
@@ -909,1 +909,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                         {conf.status === 'RESOLVED' && conf.resolution && (
@@ -910,1 +910,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {/* Resolution Summary if RESOLVED */}
+                           <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
@@ -911,1 +911,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {conf.status === 'RESOLVED' && conf.resolution && (
+                             <div className="flex items-center justify-between font-bold text-emerald-950">
@@ -912,1 +912,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
+                               <span className="flex items-center gap-1">
@@ -913,1 +913,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div className="flex items-center justify-between font-bold text-emerald-950">
+                                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
@@ -914,1 +914,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="flex items-center gap-1">
+                                 <span>القرار المعتمد: {conf.resolution.strategy}</span>
@@ -915,1 +915,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
+                               </span>
@@ -916,1 +916,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 <span>القرار المعتمد: {conf.resolution.strategy}</span>
+                               <span className="text-[10px] text-emerald-800">
@@ -917,1 +917,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                                 بواسطة: {conf.resolution.resolvedBy}
@@ -918,1 +918,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <span className="text-[10px] text-emerald-800">
+                               </span>
@@ -919,1 +919,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                                 بواسطة: {conf.resolution.resolvedBy}
+                             </div>
@@ -920,1 +920,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               </span>
+                             <div className="text-[11px] text-emerald-900">
@@ -921,1 +921,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                               <strong>{t("offline.labels.txt_a9b605")}</strong> {conf.resolution.justification}
@@ -922,1 +922,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             <div className="text-[11px] text-emerald-900">
+                             </div>
@@ -923,1 +923,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                               <strong>المبرر التدقيقي:</strong> {conf.resolution.justification}
+                           </div>
@@ -924,1 +924,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                             </div>
+                         )}
@@ -925,1 +925,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           </div>
+                       </div>
@@ -926,1 +926,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         )}
+                     );
@@ -927,1 +927,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </div>
+                   })}
@@ -928,1 +928,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     );
+                 </div>
@@ -929,1 +929,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   })}
+               )}
@@ -930,1 +930,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+             </div>
@@ -931,1 +931,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               )}
+           )}
@@ -932,1 +932,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </div>
+ 
@@ -933,1 +933,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           )}
+           {activeTab === 'CACHE' && (
@@ -934,1 +934,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+             <div className="space-y-4">
@@ -935,1 +935,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           {activeTab === 'CACHE' && (
+               <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
@@ -936,1 +936,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             <div className="space-y-4">
+                 <div>
@@ -937,1 +937,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
+                   <h3 className="text-xs font-bold text-stone-900">{t("offline.labels.txt_6fc0d8")}</h3>
@@ -938,1 +938,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div>
+                   <p className="text-xs text-stone-500">
@@ -939,1 +939,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <h3 className="text-xs font-bold text-stone-900">سجل تخزين Master Data في IndexedDB</h3>
+                     تتضمن كل باقة مخزنة محلياً رقم الإصدار (Version) والطابع الزمني (Timestamp) لضمان اتساق البيانات
@@ -940,1 +940,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <p className="text-xs text-stone-500">
+                   </p>
@@ -941,1 +941,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     تتضمن كل باقة مخزنة محلياً رقم الإصدار (Version) والطابع الزمني (Timestamp) لضمان اتساق البيانات
+                 </div>
@@ -942,1 +942,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </p>
+                 <button
@@ -943,1 +943,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                   onClick={handleRefreshCache}
@@ -944,1 +944,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <button
+                   disabled={isRefreshingCache}
@@ -945,1 +945,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   onClick={handleRefreshCache}
+                   className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
@@ -946,1 +946,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   disabled={isRefreshingCache}
+                 >
@@ -947,1 +947,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
+                   <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCache ? 'animate-spin' : ''}`} />
@@ -948,1 +948,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 >
+                   <span>{isRefreshingCache ? 'جاري التحديث...' : 'تحديث الذاكرة (Refresh Cache)'}</span>
@@ -949,1 +949,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCache ? 'animate-spin' : ''}`} />
+                 </button>
@@ -950,1 +950,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <span>{isRefreshingCache ? 'جاري التحديث...' : 'تحديث الذاكرة (Refresh Cache)'}</span>
+               </div>
@@ -951,1 +951,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </button>
+ 
@@ -952,1 +952,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </div>
+               {/* Cache Cards */}
@@ -953,1 +953,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
@@ -954,1 +954,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Cache Cards */}
+                 {cacheMeta.map(meta => (
@@ -955,1 +955,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
+                   <div
@@ -956,1 +956,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 {cacheMeta.map(meta => (
+                     key={meta.storeName}
@@ -957,1 +957,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <div
+                     className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-2 hover:border-amber-300 transition-colors"
@@ -958,1 +958,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     key={meta.storeName}
+                   >
@@ -959,1 +959,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-2 hover:border-amber-300 transition-colors"
+                     <div className="flex items-center justify-between border-b border-stone-100 pb-2">
@@ -960,1 +960,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   >
+                       <span className="font-bold text-stone-900 text-xs">
@@ -961,1 +961,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <div className="flex items-center justify-between border-b border-stone-100 pb-2">
+                         {STORE_LABELS[meta.storeName] || meta.storeName}
@@ -962,1 +962,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span className="font-bold text-stone-900 text-xs">
+                       </span>
@@ -963,1 +963,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         {STORE_LABELS[meta.storeName] || meta.storeName}
+                       <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
@@ -964,1 +964,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </span>
+                         v{meta.version}
@@ -965,1 +965,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
+                       </span>
@@ -966,1 +966,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         v{meta.version}
+                     </div>
@@ -967,1 +967,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </span>
+ 
@@ -968,1 +968,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </div>
+                     <div className="grid grid-cols-2 gap-2 text-xs">
@@ -969,1 +969,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                       <div>
@@ -970,1 +970,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <div className="grid grid-cols-2 gap-2 text-xs">
+                         <span className="text-stone-400 block text-[10px]">{t("offline.labels.txt_6464df")}</span>
@@ -971,1 +971,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <div>
+                         <span className="font-bold text-stone-800">{meta.recordCount} سجل</span>
@@ -972,1 +972,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <span className="text-stone-400 block text-[10px]">عدد السجلات:</span>
+                       </div>
@@ -973,1 +973,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <span className="font-bold text-stone-800">{meta.recordCount} سجل</span>
+                       <div>
@@ -974,1 +974,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </div>
+                         <span className="text-stone-400 block text-[10px]">{t("offline.labels.txt_7490af")}</span>
@@ -975,1 +975,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <div>
+                         <span className="font-mono text-stone-700 text-[10px]">
@@ -976,1 +976,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <span className="text-stone-400 block text-[10px]">الطابع الزمني:</span>
+                           {new Date(meta.timestamp).toLocaleTimeString('ar-SA')}
@@ -977,1 +977,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         <span className="font-mono text-stone-700 text-[10px]">
+                         </span>
@@ -978,1 +978,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                           {new Date(meta.timestamp).toLocaleTimeString('ar-SA')}
+                       </div>
@@ -979,1 +979,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                         </span>
+                     </div>
@@ -980,1 +980,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       </div>
+ 
@@ -981,1 +981,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </div>
+                     <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-50 flex items-center justify-between">
@@ -982,1 +982,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+                       <span>مصدر التخزين: {meta.lastSyncedBy || 'SYSTEM'}</span>
@@ -983,1 +983,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-50 flex items-center justify-between">
+                       <span className="text-emerald-700 font-medium">{t("offline.labels.txt_41cc14")}</span>
@@ -984,1 +984,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span>مصدر التخزين: {meta.lastSyncedBy || 'SYSTEM'}</span>
+                     </div>
@@ -985,1 +985,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                       <span className="text-emerald-700 font-medium">جاهز للاستخدام Offline</span>
+                   </div>
@@ -986,1 +986,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                     </div>
+                 ))}
@@ -987,1 +987,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   </div>
+               </div>
@@ -988,1 +988,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 ))}
+ 
@@ -989,1 +989,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </div>
+               {/* Offline Rule Compliance Notice */}
@@ -990,1 +990,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+               <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
@@ -991,1 +991,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               {/* Offline Rule Compliance Notice */}
+                 <div className="flex items-center gap-1.5 font-bold">
@@ -992,1 +992,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
+                   <Info className="w-4 h-4 text-amber-700" />
@@ -993,1 +993,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <div className="flex items-center gap-1.5 font-bold">
+                   <span>{t("offline.labels.txt_9a78d6")}</span>
@@ -994,1 +994,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <Info className="w-4 h-4 text-amber-700" />
+                 </div>
@@ -995,1 +995,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <span>معايير التشغيل بدون اتصال (Offline Rules):</span>
+                 <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 pr-2">
@@ -996,1 +996,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </div>
+                   <li>{t("offline.labels.txt_539bb6")}</li>
@@ -997,1 +997,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 pr-2">
+                   <li><strong>{t("offline.labels.txt_66cc97")}</strong> {t("offline.labels.createTripPricing")}</li>
@@ -998,1 +998,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li>يتم التحقق من وجود جميع Master Data (المشروع، الناقل، الشاحنة، السائق، المادة) في IndexedDB.</li>
+                   <li>{t("offline.labels.txt_5cde42")}</li>
@@ -999,1 +999,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li><strong>قاعدة إلزامية:</strong> لا يُسمح بإنشاء أي رحلة Offline إذا كانت بيانات التسعير غير متوفرة محلياً.</li>
+                 </ul>
@@ -1000,1 +1000,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                   <li>تتم الحسابات المالية وصافي الأوزان محلياً وتُدرج في Outbox بحالة PENDING حتى عودة الاتصال.</li>
+               </div>
@@ -1001,1 +1001,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-                 </ul>
+             </div>
@@ -1002,1 +1002,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               </div>
+           )}
@@ -1003,1 +1003,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             </div>
+         </div>
@@ -1004,1 +1004,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           )}
+ 
@@ -1005,1 +1005,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         </div>
+         {/* Footer */}
@@ -1006,1 +1006,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+         <div className="bg-white border-t border-stone-200 px-6 py-3 flex items-center justify-between">
@@ -1007,1 +1007,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         {/* Footer */}
+           <span className="text-xs text-stone-500">
@@ -1008,1 +1008,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         <div className="bg-white border-t border-stone-200 px-6 py-3 flex items-center justify-between">
+             {stats.pending > 0 
@@ -1009,1 +1009,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <span className="text-xs text-stone-500">
+               ? `يوجد ${stats.pending} عملية معلقة بانتظار المزامنة`
@@ -1010,1 +1010,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             {stats.pending > 0 
+               : 'جميع العمليات متزامنة ومحدثة'}
@@ -1011,1 +1011,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               ? `يوجد ${stats.pending} عملية معلقة بانتظار المزامنة`
+           </span>
@@ -1012,1 +1012,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               : 'جميع العمليات متزامنة ومحدثة'}
+ 
@@ -1013,1 +1013,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </span>
+           <button
@@ -1014,1 +1014,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+             onClick={onClose}
@@ -1015,1 +1015,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           <button
+             className="px-4 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors"
@@ -1016,1 +1016,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             onClick={onClose}
+           >
@@ -1017,1 +1017,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             className="px-4 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors"
+             إغلاق
@@ -1018,1 +1018,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           >
+           </button>
@@ -1019,1 +1019,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             إغلاق
+         </div>
@@ -1020,1 +1020,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           </button>
+ 
@@ -1021,1 +1021,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         </div>
+         {/* Explicit Conflict Resolution Modal */}
@@ -1022,1 +1022,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+         <ConflictResolutionModal
@@ -1023,1 +1023,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         {/* Explicit Conflict Resolution Modal */}
+           isOpen={isConflictModalOpen}
@@ -1024,1 +1024,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         <ConflictResolutionModal
+           conflict={selectedConflict}
@@ -1025,1 +1025,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           isOpen={isConflictModalOpen}
+           onClose={() => {
@@ -1026,1 +1026,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           conflict={selectedConflict}
+             setIsConflictModalOpen(false);
@@ -1027,1 +1027,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           onClose={() => {
+             setSelectedConflict(null);
@@ -1028,1 +1028,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             setIsConflictModalOpen(false);
+           }}
@@ -1029,1 +1029,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             setSelectedConflict(null);
+           onResolved={(confId, msg) => {
@@ -1030,1 +1030,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           }}
+             onNotification?.({
@@ -1031,1 +1031,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           onResolved={(confId, msg) => {
+               type: 'SUCCESS',
@@ -1032,1 +1032,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             onNotification?.({
+               message: msg,
@@ -1033,1 +1033,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               type: 'SUCCESS',
+             });
@@ -1034,1 +1034,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-               message: msg,
+             loadData();
@@ -1035,1 +1035,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             });
+           }}
@@ -1036,1 +1036,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-             loadData();
+         />
@@ -1037,1 +1037,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-           }}
+ 
@@ -1038,1 +1038,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-         />
+       </div>
@@ -1039,1 +1039,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- 
+     </div>
@@ -1040,1 +1040,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-       </div>
+   );
@@ -1041,1 +1041,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-     </div>
+ };
@@ -1042,1 +1042,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
-   );
+ 
@@ -1043,1 +1043,1 @@ /app/applet/src/components/offline/OutboxDrawer.tsx
- };
+ 
```

## File: `/app/applet/src/components/offline/PWAInstallButton.tsx`

- **Pre-Migration Hash:** `f0a9f943ef81b030`
- **Post-Migration Hash:** `b928ce7d49da3433`
- **Transformations Applied:** 12
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (12):**
  - `offline.labels.txt_3db2df`
  - `offline.labels.txt_2a088a`
  - `offline.labels.add`
  - `offline.labels.txt_25bbf9`
  - `offline.labels.txt_1bc609`
  - `offline.labels.txt_6a75f1`
  - `offline.labels.txt_540354`
  - `offline.labels.txt_35c87e`
  - `offline.labels.txt_6357c3`
  - `offline.labels.txt_78ff43`
  - `offline.labels.txt_6fd255`
  - `offline.labels.txt_7c7b96`

### Unified Diff / Patch

```diff
@@ -4,1 +4,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -5,1 +5,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- export const PWAInstallButton: React.FC = () => {
+ 
@@ -6,1 +6,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
+ 
@@ -7,1 +7,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   const [showIOSGuide, setShowIOSGuide] = useState(false);
+ export const PWAInstallButton: React.FC = () => {
@@ -8,1 +8,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+   const { t } = useI18n();
@@ -9,1 +9,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   // If already running as an installed PWA, hide the button
+   const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
@@ -10,1 +10,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   if (isInstalled) {
+   const [showIOSGuide, setShowIOSGuide] = useState(false);
@@ -11,1 +11,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-     return null;
+ 
@@ -12,1 +12,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   }
+   // If already running as an installed PWA, hide the button
@@ -13,1 +13,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+   if (isInstalled) {
@@ -14,1 +14,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   // Chromium / Android / Desktop flow
+     return null;
@@ -15,1 +15,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   if (isInstallable) {
+   }
@@ -16,1 +16,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-     return (
+ 
@@ -17,1 +17,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-       <button
+   // Chromium / Android / Desktop flow
@@ -18,1 +18,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         onClick={install}
+   if (isInstallable) {
@@ -19,1 +19,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
+     return (
@@ -20,1 +20,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         title="تثبيت التطبيق على جهازك للعمل بدون إنترنت PWA"
+       <button
@@ -21,1 +21,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-       >
+         onClick={install}
@@ -22,1 +22,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         <Download className="w-3.5 h-3.5" />
+         className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
@@ -23,1 +23,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         <span>تثبيت التطبيق (PWA)</span>
+         title={t("offline.labels.txt_7c7b96")}
@@ -24,1 +24,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-       </button>
+       >
@@ -25,1 +25,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-     );
+         <Download className="w-3.5 h-3.5" />
@@ -26,1 +26,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   }
+         <span>{t("offline.labels.txt_6fd255")}</span>
@@ -27,1 +27,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+       </button>
@@ -28,1 +28,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   // iOS Safari flow
+     );
@@ -29,1 +29,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   if (isIOS) {
+   }
@@ -30,1 +30,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-     return (
+ 
@@ -31,1 +31,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-       <>
+   // iOS Safari flow
@@ -32,1 +32,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         <button
+   if (isIOS) {
@@ -33,1 +33,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           onClick={() => setShowIOSGuide(true)}
+     return (
@@ -34,1 +34,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs transition-colors"
+       <>
@@ -35,1 +35,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           title="تثبيت على أجهزة آيفون / آيباد"
+         <button
@@ -36,1 +36,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         >
+           onClick={() => setShowIOSGuide(true)}
@@ -37,1 +37,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           <Share className="w-3.5 h-3.5" />
+           className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs transition-colors"
@@ -38,1 +38,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           <span>تثبيت PWA</span>
+           title={t("offline.labels.txt_78ff43")}
@@ -39,1 +39,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         </button>
+         >
@@ -40,1 +40,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+           <Share className="w-3.5 h-3.5" />
@@ -41,1 +41,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         {showIOSGuide && (
+           <span>{t("offline.labels.txt_6357c3")}</span>
@@ -42,1 +42,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
+         </button>
@@ -43,1 +43,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-             <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 text-right space-y-4" dir="rtl">
+ 
@@ -44,1 +44,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               <div className="flex items-center justify-between border-b border-stone-100 pb-3">
+         {showIOSGuide && (
@@ -45,1 +45,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 <h3 className="text-sm font-bold text-stone-900">تثبيت التطبيق على أجهزة iOS</h3>
+           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
@@ -46,1 +46,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 <button
+             <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 text-right space-y-4" dir="rtl">
@@ -47,1 +47,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   onClick={() => setShowIOSGuide(false)}
+               <div className="flex items-center justify-between border-b border-stone-100 pb-3">
@@ -48,1 +48,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
+                 <h3 className="text-sm font-bold text-stone-900">{t("offline.labels.txt_35c87e")}</h3>
@@ -49,1 +49,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 >
+                 <button
@@ -50,1 +50,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <X className="w-4 h-4" />
+                   onClick={() => setShowIOSGuide(false)}
@@ -51,1 +51,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 </button>
+                   className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
@@ -52,1 +52,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               </div>
+                 >
@@ -53,1 +53,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
+                   <X className="w-4 h-4" />
@@ -54,1 +54,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 <div className="flex items-start gap-2">
+                 </button>
@@ -55,1 +55,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
+               </div>
@@ -56,1 +56,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <span>اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري.</span>
+               <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
@@ -57,1 +57,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 </div>
+                 <div className="flex items-start gap-2">
@@ -58,1 +58,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 <div className="flex items-start gap-2">
+                   <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
@@ -59,1 +59,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
+                   <span>{t("offline.labels.txt_540354")}<strong>{t("offline.labels.txt_6a75f1")}</strong> {t("offline.labels.txt_1bc609")}</span>
@@ -60,1 +60,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <span>مرر للأسفل واختر <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong>.</span>
+                 </div>
@@ -61,1 +61,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 </div>
+                 <div className="flex items-start gap-2">
@@ -62,1 +62,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 <div className="flex items-start gap-2">
+                   <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
@@ -63,1 +63,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0"><Check className="w-3 h-3" /></span>
+                   <span>{t("offline.labels.txt_25bbf9")}<strong>{t("offline.labels.add")}</strong>.</span>
@@ -64,1 +64,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                   <span>سيعمل التطبيق كبرنامج مستقل بالكامل بدون إنترنت عبر تقنية Offline PWA.</span>
+                 </div>
@@ -65,1 +65,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 </div>
+                 <div className="flex items-start gap-2">
@@ -66,1 +66,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               </div>
+                   <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0"><Check className="w-3 h-3" /></span>
@@ -67,1 +67,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               <button
+                   <span>{t("offline.labels.txt_2a088a")}</span>
@@ -68,1 +68,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 onClick={() => setShowIOSGuide(false)}
+                 </div>
@@ -69,1 +69,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 text-xs transition-colors"
+               </div>
@@ -70,1 +70,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               >
+               <button
@@ -71,1 +71,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-                 فهمت ذلك
+                 onClick={() => setShowIOSGuide(false)}
@@ -72,1 +72,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-               </button>
+                 className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 text-xs transition-colors"
@@ -73,1 +73,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-             </div>
+               >
@@ -74,1 +74,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-           </div>
+                 {t("offline.labels.txt_3db2df")}</button>
@@ -75,1 +75,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-         )}
+             </div>
@@ -76,1 +76,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-       </>
+           </div>
@@ -77,1 +77,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-     );
+         )}
@@ -78,1 +78,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   }
+       </>
@@ -79,1 +79,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+     );
@@ -80,1 +80,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
-   return null;
+   }
@@ -81,1 +81,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- };
+ 
@@ -82,1 +82,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+   return null;
@@ -83,1 +83,1 @@ /app/applet/src/components/offline/PWAInstallButton.tsx
- 
+ };
```

## File: `/app/applet/src/components/FirestoreArchitectureView.tsx`

- **Pre-Migration Hash:** `5f2863f0a0d6974d`
- **Post-Migration Hash:** `230cdc05f9ef3de3`
- **Transformations Applied:** 25
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (25):**
  - `other.labels.txt_633e2d`
  - `other.labels.txt_72168c`
  - `other.labels.trip_3`
  - `other.labels.txt_16e97e`
  - `other.labels.txt_4648ec`
  - `other.labels.txt_265a70`
  - `other.labels.txt_158f99`
  - `other.labels.user_4`
  - `other.labels.txt_139e03`
  - `other.labels.txt_20e3e1`
  - `other.labels.refresh`
  - `other.labels.txt_3c30da`
  - `other.labels.txt_2bbe99`
  - `other.labels.txt_9d8db2`
  - `other.labels.save`
  - `other.labels.txt_2168d6`
  - `other.labels.txt_54bf89`
  - `other.labels.txt_6aaf22`
  - `other.labels.txt_38f4aa`
  - `other.labels.txt_1b9b40`
  - `other.labels.txt_68176b`
  - `other.labels.txt_109310`
  - `other.labels.txt_4c37e4`
  - `other.labels.txt_1ea1ac`
  - `other.labels.txt_259961`

### Unified Diff / Patch

```diff
@@ -44,1 +44,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+ import { useI18n } from '../i18n';
@@ -45,1 +45,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- export interface DomainMeta {
+ 
@@ -46,1 +46,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   key: string;
+ 
@@ -47,1 +47,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   nameAr: string;
+ export interface DomainMeta {
@@ -48,1 +48,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   nameEn: string;
+   key: string;
@@ -49,1 +49,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   idField: string;
+   nameAr: string;
@@ -50,1 +50,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   pathPattern: string;
+   nameEn: string;
@@ -51,1 +51,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   icon: any;
+   idField: string;
@@ -52,1 +52,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   validatorName: string;
+   pathPattern: string;
@@ -53,1 +53,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   repositoryName: string;
+   icon: any;
@@ -54,1 +54,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   serviceName: string;
+   validatorName: string;
@@ -55,1 +55,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   descriptionAr: string;
+   repositoryName: string;
@@ -56,1 +56,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   sampleValidationRules: string[];
+   serviceName: string;
@@ -57,1 +57,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- }
+   descriptionAr: string;
@@ -58,1 +58,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+   sampleValidationRules: string[];
@@ -59,1 +59,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- export const DOMAINS_LIST: DomainMeta[] = [
+ }
@@ -60,1 +60,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+ 
@@ -61,1 +61,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'projects',
+ export const DOMAINS_LIST: DomainMeta[] = [
@@ -62,1 +62,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'المشاريع',
+   {
@@ -63,1 +63,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Projects',
+     key: 'projects',
@@ -64,1 +64,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'projectId',
+     nameAr: 'المشاريع',
@@ -65,1 +65,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}',
+     nameEn: 'Projects',
@@ -66,1 +66,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Building2,
+     idField: 'projectId',
@@ -67,1 +67,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'ProjectValidator',
+     pathPattern: '/projects/{projectId}',
@@ -68,1 +68,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'ProjectRepository',
+     icon: Building2,
@@ -69,1 +69,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'ProjectService',
+     validatorName: 'ProjectValidator',
@@ -70,1 +70,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'كيان العزل التام للمشاريع (Multi-Tenant Root)، يضبط النطاق الجغرافي والضريبي.',
+     repositoryName: 'ProjectRepository',
@@ -71,1 +71,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'ProjectService',
@@ -72,1 +72,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الرقم الضريبي ZATCA يجب أن يتكون من 15 رقمًا',
+     descriptionAr: 'كيان العزل التام للمشاريع (Multi-Tenant Root)، يضبط النطاق الجغرافي والضريبي.',
@@ -73,1 +73,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'حالة المشروع مقيدة بـ (ACTIVE, SUSPENDED, ARCHIVED)',
+     sampleValidationRules: [
@@ -74,1 +74,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'معرّف المشروع projectId يخضع لنمط ^[a-zA-Z0-9_-]+$'
+       'الرقم الضريبي ZATCA يجب أن يتكون من 15 رقمًا',
@@ -75,1 +75,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'حالة المشروع مقيدة بـ (ACTIVE, SUSPENDED, ARCHIVED)',
@@ -76,1 +76,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'معرّف المشروع projectId يخضع لنمط ^[a-zA-Z0-9_-]+$'
@@ -77,1 +77,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -78,1 +78,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'carriers',
+   },
@@ -79,1 +79,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'الناقلون',
+   {
@@ -80,1 +80,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Carriers',
+     key: 'carriers',
@@ -81,1 +81,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'carrierId',
+     nameAr: 'الناقلون',
@@ -82,1 +82,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/carriers/{carrierId}',
+     nameEn: 'Carriers',
@@ -83,1 +83,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Building2,
+     idField: 'carrierId',
@@ -84,1 +84,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'CarrierValidator',
+     pathPattern: '/projects/{projectId}/carriers/{carrierId}',
@@ -85,1 +85,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'CarrierRepository',
+     icon: Building2,
@@ -86,1 +86,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'CarrierService',
+     validatorName: 'CarrierValidator',
@@ -87,1 +87,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'شركات النقل المعتمدة والمتعاقدة لتنفيذ توريد وتفريغ المواد.',
+     repositoryName: 'CarrierRepository',
@@ -88,1 +88,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'CarrierService',
@@ -89,1 +89,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'السجل التجاري CR يجب أن يتكون من 10 أرقام نظامية سعودية',
+     descriptionAr: 'شركات النقل المعتمدة والمتعاقدة لتنفيذ توريد وتفريغ المواد.',
@@ -90,1 +90,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'ترخيص هيئة النقل العام TGA إلزامي',
+     sampleValidationRules: [
@@ -91,1 +91,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'رقم جوال مسؤول التواصل معتمد دولياً أو محلياً'
+       'السجل التجاري CR يجب أن يتكون من 10 أرقام نظامية سعودية',
@@ -92,1 +92,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'ترخيص هيئة النقل العام TGA إلزامي',
@@ -93,1 +93,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'رقم جوال مسؤول التواصل معتمد دولياً أو محلياً'
@@ -94,1 +94,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -95,1 +95,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'pricingRules',
+   },
@@ -96,1 +96,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'قواعد التسعير',
+   {
@@ -97,1 +97,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Pricing Rules',
+     key: 'pricingRules',
@@ -98,1 +98,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'pricingRuleId',
+     nameAr: 'قواعد التسعير',
@@ -99,1 +99,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/pricing_rules/{pricingRuleId}',
+     nameEn: 'Pricing Rules',
@@ -100,1 +100,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Calculator,
+     idField: 'pricingRuleId',
@@ -101,1 +101,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'PricingRuleValidator',
+     pathPattern: '/projects/{projectId}/pricing_rules/{pricingRuleId}',
@@ -102,1 +102,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'PricingRuleRepository',
+     icon: Calculator,
@@ -103,1 +103,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'PricingRuleService',
+     validatorName: 'PricingRuleValidator',
@@ -104,1 +104,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'التعريفات المالية المعتمدة لاحتساب قيمة النقل وغرامات التأخير وضريبة 15%.',
+     repositoryName: 'PricingRuleRepository',
@@ -105,1 +105,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'PricingRuleService',
@@ -106,1 +106,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'نموذج التسعير محدد بـ (PER_TON, PER_TRIP, PER_KM, FLAT_RATE)',
+     descriptionAr: 'التعريفات المالية المعتمدة لاحتساب قيمة النقل وغرامات التأخير وضريبة 15%.',
@@ -107,1 +107,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'السعر الأساسي baseRateSAR رقم غير سالب',
+     sampleValidationRules: [
@@ -108,1 +108,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'سعر غرامة الانتظار بالساعة demurrageRatePerHourSAR موجب أو صفر'
+       'نموذج التسعير محدد بـ (PER_TON, PER_TRIP, PER_KM, FLAT_RATE)',
@@ -109,1 +109,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'السعر الأساسي baseRateSAR رقم غير سالب',
@@ -110,1 +110,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'سعر غرامة الانتظار بالساعة demurrageRatePerHourSAR موجب أو صفر'
@@ -111,1 +111,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -112,1 +112,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'materials',
+   },
@@ -113,1 +113,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'المواد',
+   {
@@ -114,1 +114,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Materials',
+     key: 'materials',
@@ -115,1 +115,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'materialId',
+     nameAr: 'المواد',
@@ -116,1 +116,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/materials/{materialId}',
+     nameEn: 'Materials',
@@ -117,1 +117,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Layers,
+     idField: 'materialId',
@@ -118,1 +118,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'MaterialValidator',
+     pathPattern: '/projects/{projectId}/materials/{materialId}',
@@ -119,1 +119,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'MaterialRepository',
+     icon: Layers,
@@ -120,1 +120,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'MaterialService',
+     validatorName: 'MaterialValidator',
@@ -121,1 +121,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'المواد الإنشائية أو الركام المنقول مع مواصفات الكثافة والرطوبة.',
+     repositoryName: 'MaterialRepository',
@@ -122,1 +122,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'MaterialService',
@@ -123,1 +123,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'رمز المادة code حرفان على الأقل',
+     descriptionAr: 'المواد الإنشائية أو الركام المنقول مع مواصفات الكثافة والرطوبة.',
@@ -124,1 +124,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'وحدة القياس unitOfMeasure مقيدة بـ (TON, M3, TRIP)',
+     sampleValidationRules: [
@@ -125,1 +125,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الاسم العربي nameAr إلزامي'
+       'رمز المادة code حرفان على الأقل',
@@ -126,1 +126,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'وحدة القياس unitOfMeasure مقيدة بـ (TON, M3, TRIP)',
@@ -127,1 +127,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'الاسم العربي nameAr إلزامي'
@@ -128,1 +128,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -129,1 +129,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'trucks',
+   },
@@ -130,1 +130,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'الشاحنات',
+   {
@@ -131,1 +131,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Trucks',
+     key: 'trucks',
@@ -132,1 +132,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'truckId',
+     nameAr: 'الشاحنات',
@@ -133,1 +133,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/trucks/{truckId}',
+     nameEn: 'Trucks',
@@ -134,1 +134,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Truck,
+     idField: 'truckId',
@@ -135,1 +135,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'TruckValidator',
+     pathPattern: '/projects/{projectId}/trucks/{truckId}',
@@ -136,1 +136,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'TruckRepository',
+     icon: Truck,
@@ -137,1 +137,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'TruckService',
+     validatorName: 'TruckValidator',
@@ -138,1 +138,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'أسطول المركبات المعتمدة مع ضبط الوزن الفارغ والحد الأقصى القانوني.',
+     repositoryName: 'TruckRepository',
@@ -139,1 +139,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'TruckService',
@@ -140,1 +140,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الوزن الفارغ Tare أكبر من الصفر',
+     descriptionAr: 'أسطول المركبات المعتمدة مع ضبط الوزن الفارغ والحد الأقصى القانوني.',
@@ -141,1 +141,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الوزن الإجمالي Gross أكبر قطعاً من الفارغ Tare',
+     sampleValidationRules: [
@@ -142,1 +142,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الحمولة النظامية legalPayloadLimitKg = Gross - Tare',
+       'الوزن الفارغ Tare أكبر من الصفر',
@@ -143,1 +143,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الحد الأقصى المطلق لسلامة الطرق لا يتجاوز 75,000 كجم'
+       'الوزن الإجمالي Gross أكبر قطعاً من الفارغ Tare',
@@ -144,1 +144,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'الحمولة النظامية legalPayloadLimitKg = Gross - Tare',
@@ -145,1 +145,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'الحد الأقصى المطلق لسلامة الطرق لا يتجاوز 75,000 كجم'
@@ -146,1 +146,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -147,1 +147,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'drivers',
+   },
@@ -148,1 +148,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'السائقون',
+   {
@@ -149,1 +149,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Drivers',
+     key: 'drivers',
@@ -150,1 +150,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'driverId',
+     nameAr: 'السائقون',
@@ -151,1 +151,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/drivers/{driverId}',
+     nameEn: 'Drivers',
@@ -152,1 +152,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: UserCheck,
+     idField: 'driverId',
@@ -153,1 +153,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'DriverValidator',
+     pathPattern: '/projects/{projectId}/drivers/{driverId}',
@@ -154,1 +154,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'DriverRepository',
+     icon: UserCheck,
@@ -155,1 +155,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'DriverService',
+     validatorName: 'DriverValidator',
@@ -156,1 +156,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'السائقون الميدانيون المرخصون والمربوطون بالناقلين.',
+     repositoryName: 'DriverRepository',
@@ -157,1 +157,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'DriverService',
@@ -158,1 +158,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'رقم الهوية الوطنية أو الإقامة 10 أرقام تبدأ بـ 1 أو 2',
+     descriptionAr: 'السائقون الميدانيون المرخصون والمربوطون بالناقلين.',
@@ -159,1 +159,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'رقم الجوال سعودي صحيح (05xxxxxxxx أو +9665xxxxxxxx)',
+     sampleValidationRules: [
@@ -160,1 +160,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'اسم السائق الثلاثي بالعربية إلزامي'
+       'رقم الهوية الوطنية أو الإقامة 10 أرقام تبدأ بـ 1 أو 2',
@@ -161,1 +161,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'رقم الجوال سعودي صحيح (05xxxxxxxx أو +9665xxxxxxxx)',
@@ -162,1 +162,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'اسم السائق الثلاثي بالعربية إلزامي'
@@ -163,1 +163,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -164,1 +164,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'users',
+   },
@@ -165,1 +165,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'المستخدمون',
+   {
@@ -166,1 +166,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Users',
+     key: 'users',
@@ -167,1 +167,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'userId',
+     nameAr: 'المستخدمون',
@@ -168,1 +168,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/users/{userId}',
+     nameEn: 'Users',
@@ -169,1 +169,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: UserCheck,
+     idField: 'userId',
@@ -170,1 +170,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'UserValidator',
+     pathPattern: '/users/{userId}',
@@ -171,1 +171,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'UserRepository',
+     icon: UserCheck,
@@ -172,1 +172,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'UserService',
+     validatorName: 'UserValidator',
@@ -173,1 +173,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'حسابات مستخدمي المنظومة مع توزيع الأدوار والصلاحيات (RBAC).',
+     repositoryName: 'UserRepository',
@@ -174,1 +174,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'UserService',
@@ -175,1 +175,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'البريد الإلكتروني بصيغة قياسية صحيحة',
+     descriptionAr: 'حسابات مستخدمي المنظومة مع توزيع الأدوار والصلاحيات (RBAC).',
@@ -176,1 +176,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الدور مقيد بـ (PROJECT_ADMIN, DISPATCHER, FINANCE_AUDITOR, DRIVER, VIEWER)',
+     sampleValidationRules: [
@@ -177,1 +177,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'معرّف المستخدم userId يطابق معرّف Firebase Auth'
+       'البريد الإلكتروني بصيغة قياسية صحيحة',
@@ -178,1 +178,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'الدور مقيد بـ (PROJECT_ADMIN, DISPATCHER, FINANCE_AUDITOR, DRIVER, VIEWER)',
@@ -179,1 +179,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'معرّف المستخدم userId يطابق معرّف Firebase Auth'
@@ -180,1 +180,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -181,1 +181,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'trips',
+   },
@@ -182,1 +182,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'الرحلات',
+   {
@@ -183,1 +183,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Trips',
+     key: 'trips',
@@ -184,1 +184,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'tripId',
+     nameAr: 'الرحلات',
@@ -185,1 +185,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/trips/{tripId}',
+     nameEn: 'Trips',
@@ -186,1 +186,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Navigation,
+     idField: 'tripId',
@@ -187,1 +187,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'TripValidator',
+     pathPattern: '/projects/{projectId}/trips/{tripId}',
@@ -188,1 +188,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'TripRepository',
+     icon: Navigation,
@@ -189,1 +189,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'TripService',
+     validatorName: 'TripValidator',
@@ -190,1 +190,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'الحاوية المركزية للعمليات مع اللقطات التاريخية ومحرك FSM والحساب المالي.',
+     repositoryName: 'TripRepository',
@@ -191,1 +191,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'TripService',
@@ -192,1 +192,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'اللقطات التاريخية (Snapshots) إلزامية وغير قابلة للتعديل',
+     descriptionAr: 'الحاوية المركزية للعمليات مع اللقطات التاريخية ومحرك FSM والحساب المالي.',
@@ -193,1 +193,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'التنقل بين الحالات يخضع لمسار FSM الصارم',
+     sampleValidationRules: [
@@ -194,1 +194,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الوزن الإجمالي للتحميل أكبر من الوزن الفارغ للشاحنة',
+       'اللقطات التاريخية (Snapshots) إلزامية وغير قابلة للتعديل',
@@ -195,1 +195,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'القيمة المالية لا تُحسب في المتصفح وتُقفل عند الاكتمال'
+       'التنقل بين الحالات يخضع لمسار FSM الصارم',
@@ -196,1 +196,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'الوزن الإجمالي للتحميل أكبر من الوزن الفارغ للشاحنة',
@@ -197,1 +197,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'القيمة المالية لا تُحسب في المتصفح وتُقفل عند الاكتمال'
@@ -198,1 +198,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -199,1 +199,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'tripEvents',
+   },
@@ -200,1 +200,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'أحداث الرحلة',
+   {
@@ -201,1 +201,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Trip Events',
+     key: 'tripEvents',
@@ -202,1 +202,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'eventId',
+     nameAr: 'أحداث الرحلة',
@@ -203,1 +203,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/trips/{tripId}/events/{eventId}',
+     nameEn: 'Trip Events',
@@ -204,1 +204,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Clock,
+     idField: 'eventId',
@@ -205,1 +205,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'TripEventValidator',
+     pathPattern: '/projects/{projectId}/trips/{tripId}/events/{eventId}',
@@ -206,1 +206,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'TripEventRepository',
+     icon: Clock,
@@ -207,1 +207,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'TripEventService',
+     validatorName: 'TripEventValidator',
@@ -208,1 +208,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'سجل زمني تسلسلي غير قابل للتعديل (Append-Only) لتوثيق مراحل الحركة والموازين.',
+     repositoryName: 'TripEventRepository',
@@ -209,1 +209,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'TripEventService',
@@ -210,1 +210,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'معرّف الفاعل (Actor) إلزامي للتوثيق الجنائي والتشغيلي',
+     descriptionAr: 'سجل زمني تسلسلي غير قابل للتعديل (Append-Only) لتوثيق مراحل الحركة والموازين.',
@@ -211,1 +211,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'مفتاح عدم التكرار idempotencyKey إلزامي',
+     sampleValidationRules: [
@@ -212,1 +212,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الحالة الناتجة statusResulting مطابقة لقائمة حالات الرحلة'
+       'معرّف الفاعل (Actor) إلزامي للتوثيق الجنائي والتشغيلي',
@@ -213,1 +213,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'مفتاح عدم التكرار idempotencyKey إلزامي',
@@ -214,1 +214,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'الحالة الناتجة statusResulting مطابقة لقائمة حالات الرحلة'
@@ -215,1 +215,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -216,1 +216,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'exceptions',
+   },
@@ -217,1 +217,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'الاستثناءات التشغيلية',
+   {
@@ -218,1 +218,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Exceptions',
+     key: 'exceptions',
@@ -219,1 +219,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'exceptionId',
+     nameAr: 'الاستثناءات التشغيلية',
@@ -220,1 +220,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/trips/{tripId}/exceptions/{exceptionId}',
+     nameEn: 'Exceptions',
@@ -221,1 +221,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: AlertTriangle,
+     idField: 'exceptionId',
@@ -222,1 +222,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'ExceptionValidator',
+     pathPattern: '/projects/{projectId}/trips/{tripId}/exceptions/{exceptionId}',
@@ -223,1 +223,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'ExceptionRepository',
+     icon: AlertTriangle,
@@ -224,1 +224,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'ExceptionService',
+     validatorName: 'ExceptionValidator',
@@ -225,1 +225,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'سجلات الانحرافات (تجاوز حمولة، فرق ميزان، أعطال) وتجميد الإغلاق الآلي.',
+     repositoryName: 'ExceptionRepository',
@@ -226,1 +226,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'ExceptionService',
@@ -227,1 +227,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'النوع محدد بـ (OVERWEIGHT_VIOLATION, WEIGHT_DISCREPANCY, ROUTE_DEVIATION, ...)',
+     descriptionAr: 'سجلات الانحرافات (تجاوز حمولة، فرق ميزان، أعطال) وتجميد الإغلاق الآلي.',
@@ -228,1 +228,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'الخطورة محددة بـ (LOW, MEDIUM, HIGH, BLOCKING)',
+     sampleValidationRules: [
@@ -229,1 +229,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'البت في الاستثناء مقتصر على مدير المشروع أو المدقق المالي'
+       'النوع محدد بـ (OVERWEIGHT_VIOLATION, WEIGHT_DISCREPANCY, ROUTE_DEVIATION, ...)',
@@ -230,1 +230,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'الخطورة محددة بـ (LOW, MEDIUM, HIGH, BLOCKING)',
@@ -231,1 +231,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'البت في الاستثناء مقتصر على مدير المشروع أو المدقق المالي'
@@ -232,1 +232,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -233,1 +233,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'auditLogs',
+   },
@@ -234,1 +234,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'سجل التدقيق',
+   {
@@ -235,1 +235,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Audit Logs',
+     key: 'auditLogs',
@@ -236,1 +236,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'auditLogId',
+     nameAr: 'سجل التدقيق',
@@ -237,1 +237,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/audit_logs/{auditLogId}',
+     nameEn: 'Audit Logs',
@@ -238,1 +238,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: FileText,
+     idField: 'auditLogId',
@@ -239,1 +239,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'AuditLogValidator',
+     pathPattern: '/audit_logs/{auditLogId}',
@@ -240,1 +240,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'AuditLogRepository',
+     icon: FileText,
@@ -241,1 +241,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'AuditLogService',
+     validatorName: 'AuditLogValidator',
@@ -242,1 +242,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'سجل أمني وتنظيمي غير قابل للتعديل يوثق جميع التغييرات الحساسة والمستخدم الفاعل.',
+     repositoryName: 'AuditLogRepository',
@@ -243,1 +243,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'AuditLogService',
@@ -244,1 +244,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'حظر التعديل والحذف نهائياً (Immutable Append-Only)',
+     descriptionAr: 'سجل أمني وتنظيمي غير قابل للتعديل يوثق جميع التغييرات الحساسة والمستخدم الفاعل.',
@@ -245,1 +245,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'توثيق بيانات الفاعل (IP, UserAgent, Email, Role)',
+     sampleValidationRules: [
@@ -246,1 +246,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'توثيق الفروقات قبل وبعد (Before & After Diffs)'
+       'حظر التعديل والحذف نهائياً (Immutable Append-Only)',
@@ -247,1 +247,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'توثيق بيانات الفاعل (IP, UserAgent, Email, Role)',
@@ -248,1 +248,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'توثيق الفروقات قبل وبعد (Before & After Diffs)'
@@ -249,1 +249,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -250,1 +250,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'syncOperations',
+   },
@@ -251,1 +251,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'عمليات المزامنة',
+   {
@@ -252,1 +252,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Sync Operations',
+     key: 'syncOperations',
@@ -253,1 +253,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'operationId',
+     nameAr: 'عمليات المزامنة',
@@ -254,1 +254,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/sync_operations/{operationId}',
+     nameEn: 'Sync Operations',
@@ -255,1 +255,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: RefreshCw,
+     idField: 'operationId',
@@ -256,1 +256,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'SyncOperationValidator',
+     pathPattern: '/projects/{projectId}/sync_operations/{operationId}',
@@ -257,1 +257,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'SyncOperationRepository',
+     icon: RefreshCw,
@@ -258,1 +258,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'SyncOperationService',
+     validatorName: 'SyncOperationValidator',
@@ -259,1 +259,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'سجل حماية عدم التكرار (Idempotency) للمزامنة الميدانية من IndexedDB.',
+     repositoryName: 'SyncOperationRepository',
@@ -260,1 +260,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'SyncOperationService',
@@ -261,1 +261,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'معرّف العملية operationId يطابق idempotencyKey',
+     descriptionAr: 'سجل حماية عدم التكرار (Idempotency) للمزامنة الميدانية من IndexedDB.',
@@ -262,1 +262,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'معرّف العميل clientOperationUUID بصيغة UUIDv4',
+     sampleValidationRules: [
@@ -263,1 +263,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'حالة المزامنة محددة بـ (PROCESSED, FAILED, REJECTED)'
+       'معرّف العملية operationId يطابق idempotencyKey',
@@ -264,1 +264,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'معرّف العميل clientOperationUUID بصيغة UUIDv4',
@@ -265,1 +265,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   },
+       'حالة المزامنة محددة بـ (PROCESSED, FAILED, REJECTED)'
@@ -266,1 +266,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   {
+     ]
@@ -267,1 +267,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     key: 'importBatches',
+   },
@@ -268,1 +268,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameAr: 'دفعات الاستيراد',
+   {
@@ -269,1 +269,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     nameEn: 'Import Batches',
+     key: 'importBatches',
@@ -270,1 +270,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     idField: 'batchId',
+     nameAr: 'دفعات الاستيراد',
@@ -271,1 +271,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     pathPattern: '/projects/{projectId}/import_batches/{batchId}',
+     nameEn: 'Import Batches',
@@ -272,1 +272,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     icon: Boxes,
+     idField: 'batchId',
@@ -273,1 +273,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     validatorName: 'ImportBatchValidator',
+     pathPattern: '/projects/{projectId}/import_batches/{batchId}',
@@ -274,1 +274,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     repositoryName: 'ImportBatchRepository',
+     icon: Boxes,
@@ -275,1 +275,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     serviceName: 'ImportBatchService',
+     validatorName: 'ImportBatchValidator',
@@ -276,1 +276,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     descriptionAr: 'إدارة دفعات الاستيراد المجمعة للشاحنات وتذاكر الموازين والبيانات التاريخية.',
+     repositoryName: 'ImportBatchRepository',
@@ -277,1 +277,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     sampleValidationRules: [
+     serviceName: 'ImportBatchService',
@@ -278,1 +278,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'نوع الدفعة مقيد بـ (FLEET_IMPORT, DRIVER_IMPORT, WEIGHBRIDGE_IMPORT, LEGACY_TRIPS)',
+     descriptionAr: 'إدارة دفعات الاستيراد المجمعة للشاحنات وتذاكر الموازين والبيانات التاريخية.',
@@ -279,1 +279,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'إجمالي السجلات totalRecords رقم غير سالب',
+     sampleValidationRules: [
@@ -280,1 +280,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       'العملية مقتصرة فقط على مديري المشاريع'
+       'نوع الدفعة مقيد بـ (FLEET_IMPORT, DRIVER_IMPORT, WEIGHBRIDGE_IMPORT, LEGACY_TRIPS)',
@@ -281,1 +281,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     ]
+       'إجمالي السجلات totalRecords رقم غير سالب',
@@ -282,1 +282,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   }
+       'العملية مقتصرة فقط على مديري المشاريع'
@@ -283,1 +283,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- ];
+     ]
@@ -284,1 +284,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+   }
@@ -285,1 +285,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- export default function FirestoreArchitectureView() {
+ ];
@@ -286,1 +286,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [selectedDomainKey, setSelectedDomainKey] = useState<string>('trips');
+ 
@@ -287,1 +287,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
+ export default function FirestoreArchitectureView() {
@@ -288,1 +288,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
+   const { t } = useI18n();
@@ -289,1 +289,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [simulatedRole, setSimulatedRole] = useState<AuthUserContext['role']>('PROJECT_ADMIN');
+   const [selectedDomainKey, setSelectedDomainKey] = useState<string>('trips');
@@ -290,1 +290,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [simulationLog, setSimulationLog] = useState<string[]>([]);
+   const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
@@ -291,1 +291,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [simulationOutput, setSimulationOutput] = useState<any | null>(null);
+   const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
@@ -292,1 +292,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const [isSimulating, setIsSimulating] = useState<boolean>(false);
+   const [simulatedRole, setSimulatedRole] = useState<AuthUserContext['role']>('PROJECT_ADMIN');
@@ -293,1 +293,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+   const [simulationLog, setSimulationLog] = useState<string[]>([]);
@@ -294,1 +294,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const selectedDomain = DOMAINS_LIST.find(d => d.key === selectedDomainKey) || DOMAINS_LIST[7];
+   const [simulationOutput, setSimulationOutput] = useState<any | null>(null);
@@ -295,1 +295,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+   const [isSimulating, setIsSimulating] = useState<boolean>(false);
@@ -296,1 +296,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const checkConnection = async () => {
+ 
@@ -297,1 +297,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     setIsCheckingConnection(true);
+   const selectedDomain = DOMAINS_LIST.find(d => d.key === selectedDomainKey) || DOMAINS_LIST[7];
@@ -298,1 +298,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     try {
+ 
@@ -299,1 +299,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       const status = await testFirestoreConnection();
+   const checkConnection = async () => {
@@ -300,1 +300,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setConnectionStatus(status);
+     setIsCheckingConnection(true);
@@ -301,1 +301,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     } catch (e) {
+     try {
@@ -302,1 +302,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setConnectionStatus({
+       const status = await testFirestoreConnection();
@@ -303,1 +303,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         connected: false,
+       setConnectionStatus(status);
@@ -304,1 +304,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         checkedAt: new Date().toISOString(),
+     } catch (e) {
@@ -305,1 +305,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         errorMessage: String(e),
+       setConnectionStatus({
@@ -306,1 +306,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       });
+         connected: false,
@@ -307,1 +307,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     } finally {
+         checkedAt: new Date().toISOString(),
@@ -308,1 +308,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setIsCheckingConnection(false);
+         errorMessage: String(e),
@@ -309,1 +309,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     }
+       });
@@ -310,1 +310,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   };
+     } finally {
@@ -311,1 +311,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+       setIsCheckingConnection(false);
@@ -312,1 +312,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   useEffect(() => {
+     }
@@ -313,1 +313,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     checkConnection();
+   };
@@ -314,1 +314,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   }, []);
+ 
@@ -315,1 +315,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+   useEffect(() => {
@@ -316,1 +316,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   // Simulator to demonstrate: React -> Service -> Validator -> Repository -> Firestore
+     checkConnection();
@@ -317,1 +317,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const runArchitecturalSimulation = async (scenario: 'VALID_DISPATCH' | 'INVALID_WEIGHT' | 'INVALID_DRIVER_ID') => {
+   }, []);
@@ -318,1 +318,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     setIsSimulating(true);
+ 
@@ -319,1 +319,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     const logs: string[] = [];
+   // Simulator to demonstrate: React -> Service -> Validator -> Repository -> Firestore
@@ -320,1 +320,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[1. React UI Event]: استلام طلب عملية من واجهة المستخدم (Simulated Actor: ${simulatedRole})`);
+   const runArchitecturalSimulation = async (scenario: 'VALID_DISPATCH' | 'INVALID_WEIGHT' | 'INVALID_DRIVER_ID') => {
@@ -321,1 +321,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[2. Architectural Boundary Gate]: React ممنوع تماماً من استدعاء setDoc / updateDoc في Firestore مباشرة.`);
+     setIsSimulating(true);
@@ -322,1 +322,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[3. Delegation to Domain Service]: استدعاء tripService.dispatchTrip(...) مع سياق المستخدم.`);
+     const logs: string[] = [];
@@ -323,1 +323,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+     logs.push(`[1. React UI Event]: استلام طلب عملية من واجهة المستخدم (Simulated Actor: ${simulatedRole})`);
@@ -324,1 +324,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     const context: AuthUserContext = {
+     logs.push(`[2. Architectural Boundary Gate]: React ممنوع تماماً من استدعاء setDoc / updateDoc في Firestore مباشرة.`);
@@ -325,1 +325,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       userId: 'usr_simulation_operator',
+     logs.push(`[3. Delegation to Domain Service]: استدعاء tripService.dispatchTrip(...) مع سياق المستخدم.`);
@@ -326,1 +326,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       email: 'dispatcher.saudi@qworkfollow.com',
+ 
@@ -327,1 +327,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       displayName: 'مشرف العمليات الميدانية',
+     const context: AuthUserContext = {
@@ -328,1 +328,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       role: simulatedRole,
+       userId: 'usr_simulation_operator',
@@ -329,1 +329,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       ipAddress: '10.0.4.12',
+       email: 'dispatcher.saudi@qworkfollow.com',
@@ -330,1 +330,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       userAgent: 'Chrome 128 / Saudi Logistics Client',
+       displayName: 'مشرف العمليات الميدانية',
@@ -331,1 +331,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     };
+       role: simulatedRole,
@@ -332,1 +332,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+       ipAddress: '10.0.4.12',
@@ -333,1 +333,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     if (scenario === 'INVALID_DRIVER_ID') {
+       userAgent: 'Chrome 128 / Saudi Logistics Client',
@@ -334,1 +334,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       logs.push(`[4. Domain Validator]: استدعاء DriverValidator.validate(...) مع هوية سائق غير صحيحة ("987654321")...`);
+     };
@@ -335,1 +335,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       const val = DriverValidator.validate({
+ 
@@ -336,1 +336,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         driverId: 'drv_test',
+     if (scenario === 'INVALID_DRIVER_ID') {
@@ -337,1 +337,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         projectId: 'proj_riyadh_metro',
+       logs.push(`[4. Domain Validator]: استدعاء DriverValidator.validate(...) مع هوية سائق غير صحيحة ("987654321")...`);
@@ -338,1 +338,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         carrierId: 'car_01',
+       const val = DriverValidator.validate({
@@ -339,1 +339,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         fullNameAr: 'أحمد بن محمد السالم',
+         driverId: 'drv_test',
@@ -340,1 +340,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         nationalOrIqamaId: '987654321', // Invalid: does not start with 1 or 2, 9 digits only
+         projectId: 'proj_riyadh_metro',
@@ -341,1 +341,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         phone: '0512345678',
+         carrierId: 'car_01',
@@ -342,1 +342,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         isActive: true,
+         fullNameAr: 'أحمد بن محمد السالم',
@@ -343,1 +343,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       });
+         nationalOrIqamaId: '987654321', // Invalid: does not start with 1 or 2, 9 digits only
@@ -344,1 +344,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       logs.push(`❌ [Validation Rejected]: فشل التحقق في Validator قبل الوصول إلى قاعدة البيانات!`);
+         phone: '0512345678',
@@ -345,1 +345,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       val.errors.forEach(e => logs.push(`   - ${e.messageAr} (${e.code})`));
+         isActive: true,
@@ -346,1 +346,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       logs.push(`[Result]: تم حماية قاعدة بيانات Firestore من البيانات غير المطابقة للمواصفات السعودية.`);
+       });
@@ -347,1 +347,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setSimulationLog(logs);
+       logs.push(`❌ [Validation Rejected]: فشل التحقق في Validator قبل الوصول إلى قاعدة البيانات!`);
@@ -348,1 +348,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setSimulationOutput({ success: false, errors: val.errors });
+       val.errors.forEach(e => logs.push(`   - ${e.messageAr} (${e.code})`));
@@ -349,1 +349,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setIsSimulating(false);
+       logs.push(`[Result]: تم حماية قاعدة بيانات Firestore من البيانات غير المطابقة للمواصفات السعودية.`);
@@ -350,1 +350,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       return;
+       setSimulationLog(logs);
@@ -351,1 +351,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     }
+       setSimulationOutput({ success: false, errors: val.errors });
@@ -352,1 +352,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+       setIsSimulating(false);
@@ -353,1 +353,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     if (scenario === 'INVALID_WEIGHT') {
+       return;
@@ -354,1 +354,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       logs.push(`[4. Domain Validator]: استدعاء TruckValidator.validate(...) مع وزن فارغ يتجاوز الإجمالي (Tare > Gross)...`);
+     }
@@ -355,1 +355,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       const val = TruckValidator.validate({
+ 
@@ -356,1 +356,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         truckId: 'trk_test',
+     if (scenario === 'INVALID_WEIGHT') {
@@ -357,1 +357,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         projectId: 'proj_riyadh_metro',
+       logs.push(`[4. Domain Validator]: استدعاء TruckValidator.validate(...) مع وزن فارغ يتجاوز الإجمالي (Tare > Gross)...`);
@@ -358,1 +358,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         carrierId: 'car_01',
+       const val = TruckValidator.validate({
@@ -359,1 +359,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         plateNumberAr: 'أ ب ج 1234',
+         truckId: 'trk_test',
@@ -360,1 +360,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         tareWeightKg: 28000,
+         projectId: 'proj_riyadh_metro',
@@ -361,1 +361,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         maxGrossWeightKg: 25000, // Invalid: gross < tare
+         carrierId: 'car_01',
@@ -362,1 +362,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         legalPayloadLimitKg: 0,
+         plateNumberAr: 'أ ب ج 1234',
@@ -363,1 +363,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         isActive: true,
+         tareWeightKg: 28000,
@@ -364,1 +364,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       });
+         maxGrossWeightKg: 25000, // Invalid: gross < tare
@@ -365,1 +365,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       logs.push(`❌ [Validation Rejected]: رفض محرك التحقق الفيزيائي العملية!`);
+         legalPayloadLimitKg: 0,
@@ -366,1 +366,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       val.errors.forEach(e => logs.push(`   - ${e.messageAr} (${e.code})`));
+         isActive: true,
@@ -367,1 +367,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       logs.push(`[Result]: تم منع إسناد الشاحنة أو حفظ السجل دون لمس قاعدة البيانات.`);
+       });
@@ -368,1 +368,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setSimulationLog(logs);
+       logs.push(`❌ [Validation Rejected]: رفض محرك التحقق الفيزيائي العملية!`);
@@ -369,1 +369,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setSimulationOutput({ success: false, errors: val.errors });
+       val.errors.forEach(e => logs.push(`   - ${e.messageAr} (${e.code})`));
@@ -370,1 +370,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       setIsSimulating(false);
+       logs.push(`[Result]: تم منع إسناد الشاحنة أو حفظ السجل دون لمس قاعدة البيانات.`);
@@ -371,1 +371,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       return;
+       setSimulationLog(logs);
@@ -372,1 +372,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     }
+       setSimulationOutput({ success: false, errors: val.errors });
@@ -373,1 +373,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+       setIsSimulating(false);
@@ -374,1 +374,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     // Valid Dispatch Pipeline Demonstration
+       return;
@@ -375,1 +375,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[4. Domain Validator]: فحص شروط النطاق التشغيلي عبر TripValidator بنجاح (100% Valid).`);
+     }
@@ -376,1 +376,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[5. Historical Snapshot Invariant]: استدعاء لقطات غير قابلة للتعديل (carrierSnapshot, truckSnapshot, driverSnapshot, pricingSnapshot).`);
+ 
@@ -377,1 +377,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[6. Auditing Injection]: ختم الحقول الإلزامية: createdAt, createdBy="${context.userId}", updatedAt, updatedBy="${context.userId}".`);
+     // Valid Dispatch Pipeline Demonstration
@@ -378,1 +378,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[7. Repository Execution]: tripRepository.create(...) يرسل الوثيقة المشفرة والمدققة إلى Firestore.`);
+     logs.push(`[4. Domain Validator]: فحص شروط النطاق التشغيلي عبر TripValidator بنجاح (100% Valid).`);
@@ -379,1 +379,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[8. Append-Only Event Stream]: تسجيل حدث الرحلة EVT-DISPATCH عبر tripEventService.`);
+     logs.push(`[5. Historical Snapshot Invariant]: استدعاء لقطات غير قابلة للتعديل (carrierSnapshot, truckSnapshot, driverSnapshot, pricingSnapshot).`);
@@ -380,1 +380,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`[9. Immutable Audit Log]: تسجيل العملية في auditLogService مع تفاصيل الفاعل (${context.email}).`);
+     logs.push(`[6. Auditing Injection]: ختم الحقول الإلزامية: createdAt, createdBy="${context.userId}", updatedAt, updatedBy="${context.userId}".`);
@@ -381,1 +381,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     logs.push(`✅ [Pipeline Completed]: تم تنفيذ دورة الحياة كاملة وفق ضوابط المعمارية الخادومية الصارمة.`);
+     logs.push(`[7. Repository Execution]: tripRepository.create(...) يرسل الوثيقة المشفرة والمدققة إلى Firestore.`);
@@ -382,1 +382,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+     logs.push(`[8. Append-Only Event Stream]: تسجيل حدث الرحلة EVT-DISPATCH عبر tripEventService.`);
@@ -383,1 +383,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     const sampleTripGenerated = {
+     logs.push(`[9. Immutable Audit Log]: تسجيل العملية في auditLogService مع تفاصيل الفاعل (${context.email}).`);
@@ -384,1 +384,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       tripId: `TRP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
+     logs.push(`✅ [Pipeline Completed]: تم تنفيذ دورة الحياة كاملة وفق ضوابط المعمارية الخادومية الصارمة.`);
@@ -385,1 +385,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       projectId: 'proj_riyadh_metro_01',
+ 
@@ -386,1 +386,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       status: 'DISPATCHED',
+     const sampleTripGenerated = {
@@ -387,1 +387,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       carrierSnapshot: {
+       tripId: `TRP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
@@ -388,1 +388,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         carrierId: 'car_al_mashriq_logistics',
+       projectId: 'proj_riyadh_metro_01',
@@ -389,1 +389,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         companyNameAr: 'شركة المشرق للنقل اللوجستي',
+       status: 'DISPATCHED',
@@ -390,1 +390,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         commercialRegistrationNo: '1010892341',
+       carrierSnapshot: {
@@ -391,1 +391,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       },
+         carrierId: 'car_al_mashriq_logistics',
@@ -392,1 +392,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       truckSnapshot: {
+         companyNameAr: 'شركة المشرق للنقل اللوجستي',
@@ -393,1 +393,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         truckId: 'trk_mercedes_actros_08',
+         commercialRegistrationNo: '1010892341',
@@ -394,1 +394,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         plateNumberAr: 'ط ر ق 8892',
+       },
@@ -395,1 +395,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         tareWeightKg: 14200,
+       truckSnapshot: {
@@ -396,1 +396,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         legalPayloadLimitKg: 30800,
+         truckId: 'trk_mercedes_actros_08',
@@ -397,1 +397,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       },
+         plateNumberAr: 'ط ر ق 8892',
@@ -398,1 +398,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       driverSnapshot: {
+         tareWeightKg: 14200,
@@ -399,1 +399,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         driverId: 'drv_saad_alharbi',
+         legalPayloadLimitKg: 30800,
@@ -400,1 +400,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         fullNameAr: 'سعد بن عبد الله الحربي',
+       },
@@ -401,1 +401,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         nationalOrIqamaId: '1082918273',
+       driverSnapshot: {
@@ -402,1 +402,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         phone: '0554128930',
+         driverId: 'drv_saad_alharbi',
@@ -403,1 +403,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       },
+         fullNameAr: 'سعد بن عبد الله الحربي',
@@ -404,1 +404,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       materialSnapshot: {
+         nationalOrIqamaId: '1082918273',
@@ -405,1 +405,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         materialId: 'mat_base_course_class_a',
+         phone: '0554128930',
@@ -406,1 +406,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         code: 'BASE_COURSE_CLA',
+       },
@@ -407,1 +407,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         nameAr: 'بيس كورس ركام مدرج فئة أ',
+       materialSnapshot: {
@@ -408,1 +408,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         unitOfMeasure: 'TON',
+         materialId: 'mat_base_course_class_a',
@@ -409,1 +409,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       },
+         code: 'BASE_COURSE_CLA',
@@ -410,1 +410,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       pricingSnapshot: {
+         nameAr: 'بيس كورس ركام مدرج فئة أ',
@@ -411,1 +411,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         pricingRuleId: 'prc_riyadh_metro_ton_standard',
+         unitOfMeasure: 'TON',
@@ -412,1 +412,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         pricingModel: 'PER_TON',
+       },
@@ -413,1 +413,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         baseRateSAR: 28.5,
+       pricingSnapshot: {
@@ -414,1 +414,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         vatApplicable: true,
+         pricingRuleId: 'prc_riyadh_metro_ton_standard',
@@ -415,1 +415,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         vatRatePercent: 15,
+         pricingModel: 'PER_TON',
@@ -416,1 +416,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       },
+         baseRateSAR: 28.5,
@@ -417,1 +417,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       weights: {},
+         vatApplicable: true,
@@ -418,1 +418,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       financials: {
+         vatRatePercent: 15,
@@ -419,1 +419,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         baseAmountSAR: 0,
+       },
@@ -420,1 +420,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         demurrageAmountSAR: 0,
+       weights: {},
@@ -421,1 +421,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         deductionsAmountSAR: 0,
+       financials: {
@@ -422,1 +422,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         subtotalSAR: 0,
+         baseAmountSAR: 0,
@@ -423,1 +423,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         vatAmountSAR: 0,
+         demurrageAmountSAR: 0,
@@ -424,1 +424,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         totalAmountSAR: 0,
+         deductionsAmountSAR: 0,
@@ -425,1 +425,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         currency: 'SAR',
+         subtotalSAR: 0,
@@ -426,1 +426,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         isFinalized: false,
+         vatAmountSAR: 0,
@@ -427,1 +427,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       },
+         totalAmountSAR: 0,
@@ -428,1 +428,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       createdAt: new Date().toISOString(),
+         currency: 'SAR',
@@ -429,1 +429,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       createdBy: context.userId,
+         isFinalized: false,
@@ -430,1 +430,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       updatedAt: new Date().toISOString(),
+       },
@@ -431,1 +431,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       updatedBy: context.userId,
+       createdAt: new Date().toISOString(),
@@ -432,1 +432,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     };
+       createdBy: context.userId,
@@ -433,1 +433,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+       updatedAt: new Date().toISOString(),
@@ -434,1 +434,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     setSimulationLog(logs);
+       updatedBy: context.userId,
@@ -435,1 +435,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     setSimulationOutput({ success: true, payload: sampleTripGenerated });
+     };
@@ -436,1 +436,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     setIsSimulating(false);
+ 
@@ -437,1 +437,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   };
+     setSimulationLog(logs);
@@ -438,1 +438,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+     setSimulationOutput({ success: true, payload: sampleTripGenerated });
@@ -439,1 +439,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   const SelectedIcon = selectedDomain.icon;
+     setIsSimulating(false);
@@ -440,1 +440,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+   };
@@ -441,1 +441,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   return (
+ 
@@ -442,1 +442,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
+   const SelectedIcon = selectedDomain.icon;
@@ -443,1 +443,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       {/* Top Banner: Firebase Environment & Connection Health */}
+ 
@@ -444,1 +444,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
+   return (
@@ -445,1 +445,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
+     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
@@ -446,1 +446,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="flex items-start gap-3.5">
+       {/* Top Banner: Firebase Environment & Connection Health */}
@@ -447,1 +447,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
+       <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
@@ -448,1 +448,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <Database className="w-5 h-5 text-amber-600" />
+         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
@@ -449,1 +449,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+           <div className="flex items-start gap-3.5">
@@ -450,1 +450,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div>
+             <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
@@ -451,1 +451,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="flex items-center gap-2.5 flex-wrap">
+               <Database className="w-5 h-5 text-amber-600" />
@@ -452,1 +452,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <h2 className="text-base font-bold text-stone-900">
+             </div>
@@ -453,1 +453,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   حالة اتصال وتكامل Firestore & Firebase
+             <div>
@@ -454,1 +454,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </h2>
+               <div className="flex items-center gap-2.5 flex-wrap">
@@ -455,1 +455,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
+                 <h2 className="text-base font-bold text-stone-900">
@@ -456,1 +456,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
+                   {t("other.labels.txt_259961")}</h2>
@@ -457,1 +457,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   Active & Deployed
+                 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
@@ -458,1 +458,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </span>
+                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
@@ -459,1 +459,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-stone-100 text-stone-700">
+                   Active & Deployed
@@ -460,1 +460,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   Region: europe-west2
+                 </span>
@@ -461,1 +461,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </span>
+                 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-stone-100 text-stone-700">
@@ -462,1 +462,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+                   Region: europe-west2
@@ -463,1 +463,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <p className="text-xs text-stone-600 mt-1">
+                 </span>
@@ -464,1 +464,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 قاعدة البيانات التشغيلية الأساسية (SSOT) مفعّلة وفق قواعد الأمان الصارمة Zero-Trust ABAC.
+               </div>
@@ -465,1 +465,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </p>
+               <p className="text-xs text-stone-600 mt-1">
@@ -466,1 +466,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+                 {t("other.labels.txt_1ea1ac")}</p>
@@ -467,1 +467,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </div>
@@ -468,1 +468,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+           </div>
@@ -469,1 +469,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="flex items-center gap-3 self-start md:self-auto">
+ 
@@ -470,1 +470,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="text-left font-mono text-[11px] bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
+           <div className="flex items-center gap-3 self-start md:self-auto">
@@ -471,1 +471,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-stone-400 block text-[10px]">Database Instance</span>
+             <div className="text-left font-mono text-[11px] bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
@@ -472,1 +472,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="font-semibold text-stone-800">ai-studio-qsaudiworkfollow...</span>
+               <span className="text-stone-400 block text-[10px]">Database Instance</span>
@@ -473,1 +473,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               <span className="font-semibold text-stone-800">ai-studio-qsaudiworkfollow...</span>
@@ -474,1 +474,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <button
+             </div>
@@ -475,1 +475,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               onClick={checkConnection}
+             <button
@@ -476,1 +476,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               disabled={isCheckingConnection}
+               onClick={checkConnection}
@@ -477,1 +477,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
+               disabled={isCheckingConnection}
@@ -478,1 +478,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             >
+               className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
@@ -479,1 +479,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
+             >
@@ -480,1 +480,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span>فحص الاتصال (Server Ping)</span>
+               <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
@@ -481,1 +481,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </button>
+               <span>{t("other.labels.txt_4c37e4")}</span>
@@ -482,1 +482,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </button>
@@ -483,1 +483,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         </div>
+           </div>
@@ -484,1 +484,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+         </div>
@@ -485,1 +485,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         {/* Auditing Fields Guarantee Banner */}
+ 
@@ -486,1 +486,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
+         {/* Auditing Fields Guarantee Banner */}
@@ -487,1 +487,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
+         <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
@@ -488,1 +488,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
+           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
@@ -489,1 +489,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div>
+             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
@@ -490,1 +490,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[11px] font-mono font-bold text-stone-800 block">createdAt & createdBy</span>
+             <div>
@@ -491,1 +491,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[10px] text-stone-500">طابع زمني وهوية منشئ السجل</span>
+               <span className="text-[11px] font-mono font-bold text-stone-800 block">createdAt & createdBy</span>
@@ -492,1 +492,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               <span className="text-[10px] text-stone-500">{t("other.labels.txt_109310")}</span>
@@ -493,1 +493,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </div>
@@ -494,1 +494,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
+           </div>
@@ -495,1 +495,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
+           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
@@ -496,1 +496,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div>
+             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
@@ -497,1 +497,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[11px] font-mono font-bold text-stone-800 block">updatedAt & updatedBy</span>
+             <div>
@@ -498,1 +498,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[10px] text-stone-500">طابع زمني وهوية آخر مُعدّل</span>
+               <span className="text-[11px] font-mono font-bold text-stone-800 block">updatedAt & updatedBy</span>
@@ -499,1 +499,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               <span className="text-[10px] text-stone-500">{t("other.labels.txt_68176b")}</span>
@@ -500,1 +500,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </div>
@@ -501,1 +501,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
+           </div>
@@ -502,1 +502,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <Lock className="w-4 h-4 text-amber-600 shrink-0" />
+           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
@@ -503,1 +503,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div>
+             <Lock className="w-4 h-4 text-amber-600 shrink-0" />
@@ -504,1 +504,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[11px] font-bold text-stone-800 block">No Direct React Writes</span>
+             <div>
@@ -505,1 +505,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[10px] text-stone-500">حظر الكتابة المباشرة من المتصفح</span>
+               <span className="text-[11px] font-bold text-stone-800 block">No Direct React Writes</span>
@@ -506,1 +506,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               <span className="text-[10px] text-stone-500">{t("other.labels.txt_1b9b40")}</span>
@@ -507,1 +507,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </div>
@@ -508,1 +508,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
+           </div>
@@ -509,1 +509,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
+           <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
@@ -510,1 +510,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div>
+             <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
@@ -511,1 +511,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[11px] font-bold text-stone-800 block">13 Repositories & Services</span>
+             <div>
@@ -512,1 +512,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[10px] text-stone-500">بنية مجزأة لكل نطاق بشكل مستقل</span>
+               <span className="text-[11px] font-bold text-stone-800 block">13 Repositories & Services</span>
@@ -513,1 +513,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               <span className="text-[10px] text-stone-500">{t("other.labels.txt_38f4aa")}</span>
@@ -514,1 +514,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </div>
@@ -515,1 +515,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         </div>
+           </div>
@@ -516,1 +516,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       </div>
+         </div>
@@ -517,1 +517,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+       </div>
@@ -518,1 +518,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       {/* Main Grid: Domain Selector & Detailed Inspector */}
+ 
@@ -519,1 +519,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
+       {/* Main Grid: Domain Selector & Detailed Inspector */}
@@ -520,1 +520,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         {/* Left List of 13 Domains */}
+       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
@@ -521,1 +521,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         <div className="lg:col-span-4 space-y-2">
+         {/* Left List of 13 Domains */}
@@ -522,1 +522,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs">
+         <div className="lg:col-span-4 space-y-2">
@@ -523,1 +523,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
+           <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs">
@@ -524,1 +524,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-xs font-bold text-stone-800">النطاقات الـ 13 (Domain Modules)</span>
+             <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
@@ -525,1 +525,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[10px] bg-stone-100 font-mono text-stone-600 px-2 py-0.5 rounded-full font-bold">13 Modules</span>
+               <span className="text-xs font-bold text-stone-800">{t("other.labels.txt_6aaf22")}</span>
@@ -526,1 +526,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               <span className="text-[10px] bg-stone-100 font-mono text-stone-600 px-2 py-0.5 rounded-full font-bold">13 Modules</span>
@@ -527,1 +527,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+             </div>
@@ -528,1 +528,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="mt-2 space-y-1 max-h-[600px] overflow-y-auto pr-1">
+ 
@@ -529,1 +529,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               {DOMAINS_LIST.map((domain) => {
+             <div className="mt-2 space-y-1 max-h-[600px] overflow-y-auto pr-1">
@@ -530,1 +530,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 const Icon = domain.icon;
+               {DOMAINS_LIST.map((domain) => {
@@ -531,1 +531,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 const isSelected = selectedDomainKey === domain.key;
+                 const Icon = domain.icon;
@@ -532,1 +532,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 return (
+                 const isSelected = selectedDomainKey === domain.key;
@@ -533,1 +533,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <button
+                 return (
@@ -534,1 +534,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     key={domain.key}
+                   <button
@@ -535,1 +535,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     onClick={() => setSelectedDomainKey(domain.key)}
+                     key={domain.key}
@@ -536,1 +536,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all ${
+                     onClick={() => setSelectedDomainKey(domain.key)}
@@ -537,1 +537,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       isSelected 
+                     className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all ${
@@ -538,1 +538,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         ? 'bg-stone-900 text-white shadow-xs' 
+                       isSelected 
@@ -539,1 +539,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         : 'hover:bg-stone-100 text-stone-700'
+                         ? 'bg-stone-900 text-white shadow-xs' 
@@ -540,1 +540,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     }`}
+                         : 'hover:bg-stone-100 text-stone-700'
@@ -541,1 +541,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   >
+                     }`}
@@ -542,1 +542,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <div className="flex items-center gap-2.5 min-w-0">
+                   >
@@ -543,1 +543,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
+                     <div className="flex items-center gap-2.5 min-w-0">
@@ -544,1 +544,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         isSelected ? 'bg-stone-800 text-amber-400' : 'bg-stone-100 text-stone-600'
+                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
@@ -545,1 +545,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       }`}>
+                         isSelected ? 'bg-stone-800 text-amber-400' : 'bg-stone-100 text-stone-600'
@@ -546,1 +546,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         <Icon className="w-4 h-4" />
+                       }`}>
@@ -547,1 +547,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       </div>
+                         <Icon className="w-4 h-4" />
@@ -548,1 +548,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       <div className="truncate">
+                       </div>
@@ -549,1 +549,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         <div className="text-xs font-bold truncate">{domain.nameAr}</div>
+                       <div className="truncate">
@@ -550,1 +550,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
+                         <div className="text-xs font-bold truncate">{domain.nameAr}</div>
@@ -551,1 +551,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                           {domain.nameEn}
+                         <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
@@ -552,1 +552,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                         </div>
+                           {domain.nameEn}
@@ -553,1 +553,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       </div>
+                         </div>
@@ -554,1 +554,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     </div>
+                       </div>
@@ -555,1 +555,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
+                     </div>
@@ -556,1 +556,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       isSelected ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-500'
+                     <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
@@ -557,1 +557,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     }`}>
+                       isSelected ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-500'
@@ -558,1 +558,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       {domain.idField}
+                     }`}>
@@ -559,1 +559,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     </span>
+                       {domain.idField}
@@ -560,1 +560,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </button>
+                     </span>
@@ -561,1 +561,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 );
+                   </button>
@@ -562,1 +562,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               })}
+                 );
@@ -563,1 +563,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               })}
@@ -564,1 +564,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+             </div>
@@ -565,1 +565,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         </div>
+           </div>
@@ -566,1 +566,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+         </div>
@@ -567,1 +567,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         {/* Right Detail Pane: Validator, Repository, Service Breakdown */}
+ 
@@ -568,1 +568,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         <div className="lg:col-span-8 space-y-6">
+         {/* Right Detail Pane: Validator, Repository, Service Breakdown */}
@@ -569,1 +569,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           {/* Domain Header Card */}
+         <div className="lg:col-span-8 space-y-6">
@@ -570,1 +570,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
+           {/* Domain Header Card */}
@@ -571,1 +571,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="flex items-start justify-between gap-4">
+           <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
@@ -572,1 +572,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="flex items-start gap-3">
+             <div className="flex items-start justify-between gap-4">
@@ -573,1 +573,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
+               <div className="flex items-start gap-3">
@@ -574,1 +574,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <SelectedIcon className="w-6 h-6 text-indigo-600" />
+                 <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
@@ -575,1 +575,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+                   <SelectedIcon className="w-6 h-6 text-indigo-600" />
@@ -576,1 +576,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div>
+                 </div>
@@ -577,1 +577,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div className="flex items-center gap-2">
+                 <div>
@@ -578,1 +578,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <h3 className="text-lg font-bold text-stone-900">{selectedDomain.nameAr} ({selectedDomain.nameEn})</h3>
+                   <div className="flex items-center gap-2">
@@ -579,1 +579,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
+                     <h3 className="text-lg font-bold text-stone-900">{selectedDomain.nameAr} ({selectedDomain.nameEn})</h3>
@@ -580,1 +580,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       ID: {selectedDomain.idField}
+                     <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
@@ -581,1 +581,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     </span>
+                       ID: {selectedDomain.idField}
@@ -582,1 +582,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </div>
+                     </span>
@@ -583,1 +583,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <p className="text-xs text-stone-600 mt-1">{selectedDomain.descriptionAr}</p>
+                   </div>
@@ -584,1 +584,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+                   <p className="text-xs text-stone-600 mt-1">{selectedDomain.descriptionAr}</p>
@@ -585,1 +585,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+                 </div>
@@ -586,1 +586,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               </div>
@@ -587,1 +587,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+             </div>
@@ -588,1 +588,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {/* Path in Firestore */}
+ 
@@ -589,1 +589,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="mt-4 p-3 bg-stone-900 text-emerald-400 rounded-xl font-mono text-xs flex items-center justify-between">
+             {/* Path in Firestore */}
@@ -590,1 +590,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div>
+             <div className="mt-4 p-3 bg-stone-900 text-emerald-400 rounded-xl font-mono text-xs flex items-center justify-between">
@@ -591,1 +591,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span className="text-stone-400 text-[10px] block">مسار المجموعة الهيكلي في Firestore:</span>
+               <div>
@@ -592,1 +592,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span>{selectedDomain.pathPattern}</span>
+                 <span className="text-stone-400 text-[10px] block">{t("other.labels.txt_54bf89")}</span>
@@ -593,1 +593,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+                 <span>{selectedDomain.pathPattern}</span>
@@ -594,1 +594,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-1 rounded">
+               </div>
@@ -595,1 +595,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 Multi-Tenant Scoped
+               <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-1 rounded">
@@ -596,1 +596,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </span>
+                 Multi-Tenant Scoped
@@ -597,1 +597,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+               </span>
@@ -598,1 +598,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+             </div>
@@ -599,1 +599,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {/* Architecture Triple Stack: Validator, Repository, Service */}
+ 
@@ -600,1 +600,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
+             {/* Architecture Triple Stack: Validator, Repository, Service */}
@@ -601,1 +601,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               {/* 1. Validator Box */}
+             <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
@@ -602,1 +602,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
+               {/* 1. Validator Box */}
@@ -603,1 +603,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div>
+               <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
@@ -604,1 +604,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div className="flex items-center gap-2 mb-2">
+                 <div>
@@ -605,1 +605,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <FileCheck className="w-4 h-4 text-emerald-600" />
+                   <div className="flex items-center gap-2 mb-2">
@@ -606,1 +606,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <span className="text-xs font-bold text-stone-800">محرك التحقق (Validator)</span>
+                     <FileCheck className="w-4 h-4 text-emerald-600" />
@@ -607,1 +607,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </div>
+                     <span className="text-xs font-bold text-stone-800">{t("other.labels.txt_2168d6")}</span>
@@ -608,1 +608,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div className="font-mono text-xs font-bold text-emerald-800 mb-2">
+                   </div>
@@ -609,1 +609,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     {selectedDomain.validatorName}
+                   <div className="font-mono text-xs font-bold text-emerald-800 mb-2">
@@ -610,1 +610,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </div>
+                     {selectedDomain.validatorName}
@@ -611,1 +611,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <p className="text-[11px] text-stone-600 leading-relaxed">
+                   </div>
@@ -612,1 +612,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     يفحص ضوابط النطاق وقواعد المملكة قبل أي حفظ في قاعدة البيانات.
+                   <p className="text-[11px] text-stone-600 leading-relaxed">
@@ -613,1 +613,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </p>
+                     {t("other.labels.save")}</p>
@@ -625,1 +625,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <span className="text-xs font-bold text-stone-800">طبقة المنطق (Service)</span>
+                     <span className="text-xs font-bold text-stone-800">{t("other.labels.txt_9d8db2")}</span>
@@ -631,1 +631,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     بوابة الأعمال الوحيدة المسموح لـ React باستدعائها. يمنع الكتابات المباشرة.
+                     {t("other.labels.txt_2bbe99")}</p>
@@ -632,1 +632,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </p>
+                 </div>
@@ -633,1 +633,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+                 <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-stone-500">
@@ -634,1 +634,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-stone-500">
+                   Secured & Audit-Stamped
@@ -635,1 +635,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   Secured & Audit-Stamped
+                 </div>
@@ -636,1 +636,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+               </div>
@@ -637,1 +637,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+ 
@@ -638,1 +638,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+               {/* 3. Repository Box */}
@@ -639,1 +639,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               {/* 3. Repository Box */}
+               <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col justify-between">
@@ -640,1 +640,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col justify-between">
+                 <div>
@@ -641,1 +641,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div>
+                   <div className="flex items-center gap-2 mb-2">
@@ -642,1 +642,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div className="flex items-center gap-2 mb-2">
+                     <Database className="w-4 h-4 text-indigo-600" />
@@ -643,1 +643,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <Database className="w-4 h-4 text-indigo-600" />
+                     <span className="text-xs font-bold text-stone-800">{t("other.labels.txt_3c30da")}</span>
@@ -644,1 +644,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <span className="text-xs font-bold text-stone-800">مستودع البيانات (Repository)</span>
+                   </div>
@@ -645,1 +645,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </div>
+                   <div className="font-mono text-xs font-bold text-indigo-800 mb-2">
@@ -646,1 +646,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div className="font-mono text-xs font-bold text-indigo-800 mb-2">
+                     {selectedDomain.repositoryName}
@@ -647,1 +647,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     {selectedDomain.repositoryName}
+                   </div>
@@ -648,1 +648,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </div>
+                   <p className="text-[11px] text-stone-600 leading-relaxed">
@@ -649,1 +649,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <p className="text-[11px] text-stone-600 leading-relaxed">
+                     {t("other.labels.refresh")}</p>
@@ -650,1 +650,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     يعزل استدعاءات Firestore مع معالجة الأخطاء وطوابع التحديث التلقائية.
+                 </div>
@@ -651,1 +651,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </p>
+                 <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[10px] text-stone-500">
@@ -652,1 +652,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+                   Enforces createdAt & updatedAt
@@ -653,1 +653,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[10px] text-stone-500">
+                 </div>
@@ -654,1 +654,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   Enforces createdAt & updatedAt
+               </div>
@@ -655,1 +655,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+             </div>
@@ -656,1 +656,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+ 
@@ -657,1 +657,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+             {/* Validation Rules Checklist */}
@@ -658,1 +658,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+             <div className="mt-6 pt-5 border-t border-stone-100">
@@ -659,1 +659,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {/* Validation Rules Checklist */}
+               <h4 className="text-xs font-bold text-stone-800 mb-3 flex items-center gap-2">
@@ -660,1 +660,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="mt-6 pt-5 border-t border-stone-100">
+                 <ShieldCheck className="w-4 h-4 text-emerald-600" />
@@ -661,1 +661,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <h4 className="text-xs font-bold text-stone-800 mb-3 flex items-center gap-2">
+                 <span>أبرز ضوابط التحقق المعتمدة لنطاق ({selectedDomain.nameAr}):</span>
@@ -662,1 +662,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <ShieldCheck className="w-4 h-4 text-emerald-600" />
+               </h4>
@@ -663,1 +663,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span>أبرز ضوابط التحقق المعتمدة لنطاق ({selectedDomain.nameAr}):</span>
+               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
@@ -664,1 +664,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </h4>
+                 {selectedDomain.sampleValidationRules.map((rule, idx) => (
@@ -665,1 +665,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
+                   <li key={idx} className="flex items-start gap-2 text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
@@ -666,1 +666,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 {selectedDomain.sampleValidationRules.map((rule, idx) => (
+                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
@@ -667,1 +667,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <li key={idx} className="flex items-start gap-2 text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
+                     <span>{rule}</span>
@@ -668,1 +668,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
+                   </li>
@@ -669,1 +669,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     <span>{rule}</span>
+                 ))}
@@ -670,1 +670,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </li>
+               </ul>
@@ -671,1 +671,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 ))}
+             </div>
@@ -672,1 +672,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </ul>
+           </div>
@@ -673,1 +673,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+ 
@@ -674,1 +674,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+           {/* Interactive Architectural Simulator Card */}
@@ -675,1 +675,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+           <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
@@ -676,1 +676,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           {/* Interactive Architectural Simulator Card */}
+             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
@@ -677,1 +677,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
+               <div>
@@ -678,1 +678,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
+                 <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
@@ -679,1 +679,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div>
+                   <Terminal className="w-4 h-4 text-indigo-600" />
@@ -680,1 +680,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
+                   <span>{t("other.labels.txt_20e3e1")}</span>
@@ -681,1 +681,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <Terminal className="w-4 h-4 text-indigo-600" />
+                 </h3>
@@ -682,1 +682,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <span>محاكي التدفق المعماري التفاعلي (Pipeline Verification)</span>
+                 <p className="text-xs text-stone-500 mt-0.5">
@@ -683,1 +683,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </h3>
+                   {t("other.labels.txt_139e03")}</p>
@@ -684,1 +684,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <p className="text-xs text-stone-500 mt-0.5">
+               </div>
@@ -685,1 +685,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   تحقق عملي يثبت أن الواجهة لا تكتب في Firestore إلا بعد المرور عبر Service ➔ Validator ➔ Repository.
+ 
@@ -686,1 +686,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </p>
+               {/* Actor Role Picker */}
@@ -687,1 +687,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+               <div className="flex items-center gap-2 text-xs">
@@ -688,1 +688,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+                 <span className="text-stone-500">{t("other.labels.user_4")}</span>
@@ -689,1 +689,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               {/* Actor Role Picker */}
+                 <select 
@@ -690,1 +690,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="flex items-center gap-2 text-xs">
+                   value={simulatedRole} 
@@ -691,1 +691,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span className="text-stone-500">دور المستخدم الفاعل:</span>
+                   onChange={(e) => setSimulatedRole(e.target.value as any)}
@@ -692,1 +692,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <select 
+                   className="bg-stone-100 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:outline-none"
@@ -693,1 +693,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   value={simulatedRole} 
+                 >
@@ -694,1 +694,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   onChange={(e) => setSimulatedRole(e.target.value as any)}
+                   <option value="PROJECT_ADMIN">{t("other.labels.txt_158f99")}</option>
@@ -695,1 +695,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   className="bg-stone-100 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:outline-none"
+                   <option value="DISPATCHER">{t("other.labels.txt_265a70")}</option>
@@ -696,1 +696,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 >
+                   <option value="FINANCE_AUDITOR">{t("other.labels.txt_4648ec")}</option>
@@ -697,1 +697,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <option value="PROJECT_ADMIN">PROJECT_ADMIN (مدير مشروع)</option>
+                   <option value="DRIVER">{t("other.labels.txt_16e97e")}</option>
@@ -698,1 +698,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <option value="DISPATCHER">DISPATCHER (مأمور حركة)</option>
+                 </select>
@@ -699,1 +699,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <option value="FINANCE_AUDITOR">FINANCE_AUDITOR (مدقق مالي)</option>
+               </div>
@@ -700,1 +700,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <option value="DRIVER">DRIVER (سائق ميداني)</option>
+             </div>
@@ -701,1 +701,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </select>
+ 
@@ -702,1 +702,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+             {/* Action Buttons */}
@@ -703,1 +703,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+             <div className="flex flex-wrap gap-2.5 mb-4">
@@ -704,1 +704,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+               <button
@@ -705,1 +705,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {/* Action Buttons */}
+                 onClick={() => runArchitecturalSimulation('VALID_DISPATCH')}
@@ -706,1 +706,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             <div className="flex flex-wrap gap-2.5 mb-4">
+                 disabled={isSimulating}
@@ -707,1 +707,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <button
+                 className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-xs flex items-center gap-2"
@@ -708,1 +708,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 onClick={() => runArchitecturalSimulation('VALID_DISPATCH')}
+               >
@@ -709,1 +709,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 disabled={isSimulating}
+                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
@@ -710,1 +710,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-xs flex items-center gap-2"
+                 <span>{t("other.labels.trip_3")}</span>
@@ -711,1 +711,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               >
+               </button>
@@ -712,1 +712,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
+ 
@@ -713,1 +713,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span>محاكاة إطلاق رحلة نظامية (Valid Trip Dispatch)</span>
+               <button
@@ -714,1 +714,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </button>
+                 onClick={() => runArchitecturalSimulation('INVALID_DRIVER_ID')}
@@ -715,1 +715,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+                 disabled={isSimulating}
@@ -716,1 +716,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <button
+                 className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-2"
@@ -717,1 +717,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 onClick={() => runArchitecturalSimulation('INVALID_DRIVER_ID')}
+               >
@@ -718,1 +718,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 disabled={isSimulating}
+                 <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
@@ -719,1 +719,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-2"
+                 <span>{t("other.labels.txt_72168c")}</span>
@@ -720,1 +720,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               >
+               </button>
@@ -721,1 +721,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
+ 
@@ -722,1 +722,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span>اختبار رفض هوية سائق غير صحيحة (Driver Validator Test)</span>
+               <button
@@ -723,1 +723,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </button>
+                 onClick={() => runArchitecturalSimulation('INVALID_WEIGHT')}
@@ -724,1 +724,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+                 disabled={isSimulating}
@@ -725,1 +725,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <button
+                 className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-2"
@@ -726,1 +726,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 onClick={() => runArchitecturalSimulation('INVALID_WEIGHT')}
+               >
@@ -727,1 +727,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 disabled={isSimulating}
+                 <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
@@ -728,1 +728,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-2"
+                 <span>اختبار رفض وزن فارغ مخالف فيزيائياً (Truck Physics Test)</span>
@@ -729,1 +729,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               >
+               </button>
@@ -730,1 +730,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
+             </div>
@@ -731,1 +731,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <span>اختبار رفض وزن فارغ مخالف فيزيائياً (Truck Physics Test)</span>
+ 
@@ -732,1 +732,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </button>
+             {/* Console Log Display */}
@@ -733,1 +733,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             </div>
+             {simulationLog.length > 0 && (
@@ -734,1 +734,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+               <div className="bg-stone-950 text-stone-200 rounded-xl p-4 font-mono text-xs space-y-1.5 overflow-x-auto border border-stone-800 max-h-72 overflow-y-auto">
@@ -735,1 +735,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {/* Console Log Display */}
+                 {simulationLog.map((log, index) => (
@@ -736,1 +736,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {simulationLog.length > 0 && (
+                   <div 
@@ -737,1 +737,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="bg-stone-950 text-stone-200 rounded-xl p-4 font-mono text-xs space-y-1.5 overflow-x-auto border border-stone-800 max-h-72 overflow-y-auto">
+                     key={index}
@@ -738,1 +738,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 {simulationLog.map((log, index) => (
+                     className={
@@ -739,1 +739,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div 
+                       log.startsWith('❌') ? 'text-rose-400' :
@@ -740,1 +740,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     key={index}
+                       log.startsWith('✅') ? 'text-emerald-400 font-bold' :
@@ -741,1 +741,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     className={
+                       log.startsWith('[1.') ? 'text-amber-300 font-bold' :
@@ -742,1 +742,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       log.startsWith('❌') ? 'text-rose-400' :
+                       log.startsWith('[2.') ? 'text-indigo-300' :
@@ -743,1 +743,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       log.startsWith('✅') ? 'text-emerald-400 font-bold' :
+                       'text-stone-300'
@@ -744,1 +744,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       log.startsWith('[1.') ? 'text-amber-300 font-bold' :
+                     }
@@ -745,1 +745,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       log.startsWith('[2.') ? 'text-indigo-300' :
+                   >
@@ -746,1 +746,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                       'text-stone-300'
+                     {log}
@@ -747,1 +747,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     }
+                   </div>
@@ -748,1 +748,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   >
+                 ))}
@@ -749,1 +749,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                     {log}
+               </div>
@@ -750,1 +750,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   </div>
+             )}
@@ -751,1 +751,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 ))}
+ 
@@ -752,1 +752,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+             {/* Result Object inspection */}
@@ -753,1 +753,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             )}
+             {simulationOutput?.success && (
@@ -754,1 +754,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- 
+               <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
@@ -755,1 +755,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {/* Result Object inspection */}
+                 <div className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
@@ -756,1 +756,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             {simulationOutput?.success && (
+                   <CheckCircle2 className="w-4 h-4 text-emerald-600" />
@@ -757,1 +757,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
+                   <span>{t("other.labels.txt_633e2d")}</span>
@@ -758,1 +758,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
+                 </div>
@@ -759,1 +759,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <CheckCircle2 className="w-4 h-4 text-emerald-600" />
+                 <div className="text-[11px] text-emerald-800 space-y-1 font-mono mt-2 bg-white/70 p-3 rounded-lg border border-emerald-200/60">
@@ -760,1 +760,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <span>الوثيقة المحتسبة والمختومة بالطوابع الإلزامية (Ready for Firestore SSOT):</span>
+                   <div>tripId: <span className="font-bold">{simulationOutput.payload.tripId}</span></div>
@@ -761,1 +761,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+                   <div>createdAt: <span className="text-stone-600">{simulationOutput.payload.createdAt}</span></div>
@@ -762,1 +762,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 <div className="text-[11px] text-emerald-800 space-y-1 font-mono mt-2 bg-white/70 p-3 rounded-lg border border-emerald-200/60">
+                   <div>createdBy: <span className="text-stone-600">{simulationOutput.payload.createdBy}</span></div>
@@ -763,1 +763,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>tripId: <span className="font-bold">{simulationOutput.payload.tripId}</span></div>
+                   <div>updatedAt: <span className="text-stone-600">{simulationOutput.payload.updatedAt}</span></div>
@@ -764,1 +764,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>createdAt: <span className="text-stone-600">{simulationOutput.payload.createdAt}</span></div>
+                   <div>updatedBy: <span className="text-stone-600">{simulationOutput.payload.updatedBy}</span></div>
@@ -765,1 +765,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>createdBy: <span className="text-stone-600">{simulationOutput.payload.createdBy}</span></div>
+                   <div>carrierSnapshot: <span className="text-stone-700">{JSON.stringify(simulationOutput.payload.carrierSnapshot)}</span></div>
@@ -766,1 +766,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>updatedAt: <span className="text-stone-600">{simulationOutput.payload.updatedAt}</span></div>
+                   <div>truckSnapshot: <span className="text-stone-700">{JSON.stringify(simulationOutput.payload.truckSnapshot)}</span></div>
@@ -767,1 +767,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>updatedBy: <span className="text-stone-600">{simulationOutput.payload.updatedBy}</span></div>
+                 </div>
@@ -768,1 +768,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>carrierSnapshot: <span className="text-stone-700">{JSON.stringify(simulationOutput.payload.carrierSnapshot)}</span></div>
+               </div>
@@ -769,1 +769,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                   <div>truckSnapshot: <span className="text-stone-700">{JSON.stringify(simulationOutput.payload.truckSnapshot)}</span></div>
+             )}
@@ -770,1 +770,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-                 </div>
+           </div>
@@ -771,1 +771,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-               </div>
+         </div>
@@ -772,1 +772,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-             )}
+       </div>
@@ -773,1 +773,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-           </div>
+     </div>
@@ -774,1 +774,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-         </div>
+   );
@@ -775,1 +775,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-       </div>
+ }
@@ -776,1 +776,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-     </div>
+ 
@@ -777,1 +777,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
-   );
+ 
@@ -778,1 +778,1 @@ /app/applet/src/components/FirestoreArchitectureView.tsx
- }
+ 
```

## File: `/app/applet/src/components/masterData/MasterDataView.tsx`

- **Pre-Migration Hash:** `a04f86d7d6a28bea`
- **Post-Migration Hash:** `58ae0640b7d22c8a`
- **Transformations Applied:** 77
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (73):**
  - `other.labels.saveDriver`
  - `other.labels.driver_6`
  - `other.labels.carrier_10`
  - `other.labels.saveTruck`
  - `other.labels.truck_5`
  - `other.labels.saveMaterial`
  - `other.labels.txt_3fb9ae`
  - `other.labels.txt_109c7a`
  - `other.labels.material_9`
  - `other.labels.saveCarrier`
  - `other.labels.txt_68f9e8`
  - `other.labels.txt_34897c`
  - `other.labels.txt_7bb941`
  - `other.labels.txt_f87929`
  - `other.labels.txt_63748e`
  - `other.labels.txt_4755d8`
  - `other.labels.delete_6`
  - `other.labels.txt_67f664`
  - `other.labels.txt_73dcb9`
  - `other.labels.delete_5`
  - `other.labels.trips_4`
  - `other.labels.txt_674f3e`
  - `other.labels.txt_592f64`
  - `other.labels.txt_71317d`
  - `other.labels.txt_394b13`
  - `other.labels.enterprise`
  - `other.labels.txt_ebe0e2`
  - `other.labels.txt_5c9a61`
  - `other.labels.delete_3`
  - `other.labels.txt_47f763`
  - `other.labels.deleteDriverTrips`
  - `other.labels.txt_66cfae`
  - `other.labels.txt_36b6da`
  - `other.labels.driver_3`
  - `other.labels.carrier_8`
  - `other.labels.txt_618712`
  - `other.labels.driver_2`
  - `other.labels.deleteTruckTrips`
  - `other.labels.truck_2`
  - `other.labels.txt_3aa747`
  - `other.labels.carrier_7`
  - `other.labels.truck`
  - `other.labels.deleteMaterialTrips`
  - `other.labels.project_5`
  - `other.labels.materialProject_3`
  - `other.labels.material_6`
  - `other.labels.project_6`
  - `other.labels.material_4`
  - `other.labels.deleteCarrierTrips`
  - `other.labels.carrierProject_2`
  - `other.labels.carrier_4`
  - `other.labels.project_4`
  - `other.labels.carrier_3`
  - `other.labels.txt_6b093a`
  - `other.labels.txt_f4c520`
  - `other.status.txt_671eeb`
  - `other.labels.txt_2ed1b5`
  - `other.labels.txt_35c4cc`
  - `other.labels.drivers_5`
  - `other.labels.carriers_4`
  - `other.labels.materialsTrucks`
  - `other.labels.materials_5`
  - `other.labels.delete_2`
  - `other.labels.txt_207857`
  - `other.labels.txt_714016`
  - `other.labels.delete`
  - `other.labels.refresh_2`
  - `other.status.projectActive`
  - `other.labels.projects_5`
  - `other.labels.txt_7f7eb1`
  - `other.labels.txt_1e1bdf`
  - `other.labels.txt_4e4d76`
  - `other.labels.txt_486bf8`

### Unified Diff / Patch

```diff
@@ -34,1 +34,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -35,1 +35,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- const MOCK_AUTH_CONTEXT = {
+ 
@@ -36,1 +36,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   userId: 'USR-ADMIN-01',
+ 
@@ -37,1 +37,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   role: 'PROJECT_ADMIN' as const,
+ const MOCK_AUTH_CONTEXT = {
@@ -38,1 +38,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   email: 'admin@q-saudi.sa',
+   userId: 'USR-ADMIN-01',
@@ -39,1 +39,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   displayName: 'مدير العمليات اللوجستية',
+   role: 'PROJECT_ADMIN' as const,
@@ -40,1 +40,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- };
+   email: 'admin@q-saudi.sa',
@@ -41,1 +41,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   displayName: 'مدير العمليات اللوجستية',
@@ -42,1 +42,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- export const MasterDataView: React.FC = () => {
+ };
@@ -43,1 +43,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const { user, isAuthReady, signInWithGoogle } = useAuth();
+ 
@@ -44,1 +44,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [projects, setProjects] = useState<ProjectEntity[]>([]);
+ export const MasterDataView: React.FC = () => {
@@ -45,1 +45,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [selectedProjectId, setSelectedProjectId] = useState<string>('');
+   const { t } = useI18n();
@@ -46,1 +46,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [activeModule, setActiveModule] = useState<'CARRIERS' | 'MATERIALS' | 'TRUCKS' | 'DRIVERS' | 'TESTS'>('CARRIERS');
+   const { user, isAuthReady, signInWithGoogle } = useAuth();
@@ -47,1 +47,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [overview, setOverview] = useState<ProjectMasterDataOverview | null>(null);
+   const [projects, setProjects] = useState<ProjectEntity[]>([]);
@@ -48,1 +48,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [loading, setLoading] = useState<boolean>(true);
+   const [selectedProjectId, setSelectedProjectId] = useState<string>('');
@@ -49,1 +49,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [searchQuery, setSearchQuery] = useState<string>('');
+   const [activeModule, setActiveModule] = useState<'CARRIERS' | 'MATERIALS' | 'TRUCKS' | 'DRIVERS' | 'TESTS'>('CARRIERS');
@@ -50,1 +50,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
+   const [overview, setOverview] = useState<ProjectMasterDataOverview | null>(null);
@@ -51,1 +51,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
+   const [loading, setLoading] = useState<boolean>(true);
@@ -52,1 +52,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const [searchQuery, setSearchQuery] = useState<string>('');
@@ -53,1 +53,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // In-memory demo data state (for unauthenticated preview mode)
+   const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
@@ -54,1 +54,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [localCarriers, setLocalCarriers] = useState<CarrierEntity[]>(DEFAULT_CARRIERS);
+   const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
@@ -55,1 +55,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [localMaterials, setLocalMaterials] = useState<MaterialEntity[]>(DEFAULT_MATERIALS);
+ 
@@ -56,1 +56,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [localTrucks, setLocalTrucks] = useState<TruckEntity[]>(DEFAULT_TRUCKS);
+   // In-memory demo data state (for unauthenticated preview mode)
@@ -57,1 +57,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [localDrivers, setLocalDrivers] = useState<DriverEntity[]>(DEFAULT_DRIVERS);
+   const [localCarriers, setLocalCarriers] = useState<CarrierEntity[]>(DEFAULT_CARRIERS);
@@ -58,1 +58,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const [localMaterials, setLocalMaterials] = useState<MaterialEntity[]>(DEFAULT_MATERIALS);
@@ -59,1 +59,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Automated Tests State
+   const [localTrucks, setLocalTrucks] = useState<TruckEntity[]>(DEFAULT_TRUCKS);
@@ -60,1 +60,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [testResults, setTestResults] = useState<{
+   const [localDrivers, setLocalDrivers] = useState<DriverEntity[]>(DEFAULT_DRIVERS);
@@ -61,1 +61,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     allPassed: boolean;
+ 
@@ -62,1 +62,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     totalTests: number;
+   // Automated Tests State
@@ -63,1 +63,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     passedTests: number;
+   const [testResults, setTestResults] = useState<{
@@ -64,1 +64,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     failedTests: number;
+     allPassed: boolean;
@@ -65,1 +65,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     results: MasterDataTestCaseResult[];
+     totalTests: number;
@@ -66,1 +66,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   } | null>(null);
+     passedTests: number;
@@ -67,1 +67,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [testingRunning, setTestingRunning] = useState<boolean>(false);
+     failedTests: number;
@@ -68,1 +68,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     results: MasterDataTestCaseResult[];
@@ -69,1 +69,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleExecuteTests = async () => {
+   } | null>(null);
@@ -70,1 +70,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+   const [testingRunning, setTestingRunning] = useState<boolean>(false);
@@ -71,1 +71,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+ 
@@ -72,1 +72,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'error',
+   const handleExecuteTests = async () => {
@@ -73,1 +73,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: 'يتطلب تشغيل الفحوصات الآلية على Firestore تسجيل الدخول بحساب Google أولاً.',
+     if (!user) {
@@ -74,1 +74,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+       setActionNotice({
@@ -75,1 +75,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+         type: 'error',
@@ -76,1 +76,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         message: 'يتطلب تشغيل الفحوصات الآلية على Firestore تسجيل الدخول بحساب Google أولاً.',
@@ -77,1 +77,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     setTestingRunning(true);
+       });
@@ -78,1 +78,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -79,1 +79,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const res = await runMasterDataTests();
+     }
@@ -80,1 +80,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setTestResults(res);
+     setTestingRunning(true);
@@ -81,1 +81,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+     try {
@@ -82,1 +82,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       console.error(err);
+       const res = await runMasterDataTests();
@@ -83,1 +83,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+       setTestResults(res);
@@ -84,1 +84,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'error',
+     } catch (err: any) {
@@ -85,1 +85,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: `فشلت الفحوصات: ${err.message || String(err)}`,
+       console.error(err);
@@ -86,1 +86,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+       setActionNotice({
@@ -87,1 +87,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } finally {
+         type: 'error',
@@ -88,1 +88,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setTestingRunning(false);
+         message: `فشلت الفحوصات: ${err.message || String(err)}`,
@@ -89,1 +89,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       });
@@ -90,1 +90,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } finally {
@@ -91,1 +91,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setTestingRunning(false);
@@ -92,1 +92,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Deletion guard modal state
+     }
@@ -93,1 +93,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [deleteModal, setDeleteModal] = useState<{
+   };
@@ -94,1 +94,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     isOpen: boolean;
+ 
@@ -95,1 +95,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityType: MasterEntityType;
+   // Deletion guard modal state
@@ -96,1 +96,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityId: string;
+   const [deleteModal, setDeleteModal] = useState<{
@@ -97,1 +97,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityTitle: string;
+     isOpen: boolean;
@@ -98,1 +98,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     checking: boolean;
+     entityType: MasterEntityType;
@@ -99,1 +99,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     usageResult: TripUsageResult | null;
+     entityId: string;
@@ -100,1 +100,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     error: string | null;
+     entityTitle: string;
@@ -101,1 +101,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     success: string | null;
+     checking: boolean;
@@ -102,1 +102,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   }>({
+     usageResult: TripUsageResult | null;
@@ -103,1 +103,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     isOpen: false,
+     error: string | null;
@@ -104,1 +104,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityType: 'CARRIER',
+     success: string | null;
@@ -105,1 +105,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityId: '',
+   }>({
@@ -106,1 +106,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityTitle: '',
+     isOpen: false,
@@ -107,1 +107,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     checking: false,
+     entityType: 'CARRIER',
@@ -108,1 +108,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     usageResult: null,
+     entityId: '',
@@ -109,1 +109,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     error: null,
+     entityTitle: '',
@@ -110,1 +110,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     success: null,
+     checking: false,
@@ -111,1 +111,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   });
+     usageResult: null,
@@ -112,1 +112,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     error: null,
@@ -113,1 +113,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Create Modal state
+     success: null,
@@ -114,1 +114,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [createModal, setCreateModal] = useState<{
+   });
@@ -115,1 +115,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     isOpen: boolean;
+ 
@@ -116,1 +116,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityType: MasterEntityType;
+   // Create Modal state
@@ -117,1 +117,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   }>({
+   const [createModal, setCreateModal] = useState<{
@@ -118,1 +118,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     isOpen: false,
+     isOpen: boolean;
@@ -119,1 +119,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     entityType: 'CARRIER',
+     entityType: MasterEntityType;
@@ -120,1 +120,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   });
+   }>({
@@ -121,1 +121,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     isOpen: false,
@@ -122,1 +122,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Form states
+     entityType: 'CARRIER',
@@ -123,1 +123,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [newCarrier, setNewCarrier] = useState({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
+   });
@@ -124,1 +124,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [newMaterial, setNewMaterial] = useState({ materialId: '', name: '', code: 'AGG-01', uom: 'TON' as 'TON' | 'M3' | 'TRIP' });
+ 
@@ -125,1 +125,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [newTruck, setNewTruck] = useState({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
+   // Form states
@@ -126,1 +126,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [newDriver, setNewDriver] = useState({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
+   const [newCarrier, setNewCarrier] = useState({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
@@ -127,1 +127,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
+   const [newMaterial, setNewMaterial] = useState({ materialId: '', name: '', code: 'AGG-01', uom: 'TON' as 'TON' | 'M3' | 'TRIP' });
@@ -128,1 +128,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const [newTruck, setNewTruck] = useState({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
@@ -129,1 +129,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Initialize sample data: Firestore if authenticated, local demo state if unauthenticated
+   const [newDriver, setNewDriver] = useState({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
@@ -130,1 +130,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   useEffect(() => {
+   const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
@@ -131,1 +131,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     async function initData() {
+ 
@@ -132,1 +132,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       if (!isAuthReady) return;
+   // Initialize sample data: Firestore if authenticated, local demo state if unauthenticated
@@ -133,1 +133,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setLoading(true);
+   useEffect(() => {
@@ -134,1 +134,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     async function initData() {
@@ -135,1 +135,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       // Safe demo mode when unauthenticated (avoids permission errors)
+       if (!isAuthReady) return;
@@ -136,1 +136,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       if (!user) {
+       setLoading(true);
@@ -137,1 +137,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setProjects(DEFAULT_PROJECTS);
+ 
@@ -138,1 +138,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         const defaultProjId = DEFAULT_PROJECTS[0].projectId;
+       // Safe demo mode when unauthenticated (avoids permission errors)
@@ -139,1 +139,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setSelectedProjectId(defaultProjId);
+       if (!user) {
@@ -140,1 +140,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setOverview(buildDefaultOverview(defaultProjId, localCarriers, localMaterials, localTrucks, localDrivers));
+         setProjects(DEFAULT_PROJECTS);
@@ -141,1 +141,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLoading(false);
+         const defaultProjId = DEFAULT_PROJECTS[0].projectId;
@@ -142,1 +142,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         return;
+         setSelectedProjectId(defaultProjId);
@@ -143,1 +143,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }
+         setOverview(buildDefaultOverview(defaultProjId, localCarriers, localMaterials, localTrucks, localDrivers));
@@ -144,1 +144,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+         setLoading(false);
@@ -145,1 +145,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       // Authenticated mode: load from live Firestore
+         return;
@@ -146,1 +146,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       try {
+       }
@@ -147,1 +147,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         let pList = await projectRepository.listAll();
+ 
@@ -148,1 +148,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         if (!pList || pList.length === 0) {
+       // Authenticated mode: load from live Firestore
@@ -149,1 +149,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           const sampleProject = DEFAULT_PROJECTS[0];
+       try {
@@ -150,1 +150,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           await projectRepository.create(sampleProject);
+         let pList = await projectRepository.listAll();
@@ -151,1 +151,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+         if (!pList || pList.length === 0) {
@@ -152,1 +152,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           for (const c of DEFAULT_CARRIERS) {
+           const sampleProject = DEFAULT_PROJECTS[0];
@@ -153,1 +153,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             await carrierRepository.create(c);
+           await projectRepository.create(sampleProject);
@@ -154,1 +154,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           }
+ 
@@ -155,1 +155,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           for (const m of DEFAULT_MATERIALS) {
+           for (const c of DEFAULT_CARRIERS) {
@@ -156,1 +156,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             await materialRepository.create(m);
+             await carrierRepository.create(c);
@@ -158,1 +158,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           for (const t of DEFAULT_TRUCKS) {
+           for (const m of DEFAULT_MATERIALS) {
@@ -159,1 +159,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             await truckRepository.create(t);
+             await materialRepository.create(m);
@@ -161,1 +161,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           for (const d of DEFAULT_DRIVERS) {
+           for (const t of DEFAULT_TRUCKS) {
@@ -162,1 +162,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             await driverRepository.create(d);
+             await truckRepository.create(t);
@@ -164,1 +164,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+           for (const d of DEFAULT_DRIVERS) {
@@ -165,1 +165,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           pList = [sampleProject];
+             await driverRepository.create(d);
@@ -166,1 +166,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         }
+           }
@@ -168,1 +168,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setProjects(pList);
+           pList = [sampleProject];
@@ -169,1 +169,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         if (pList.length > 0) {
+         }
@@ -170,1 +170,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           setSelectedProjectId(pList[0].projectId);
+ 
@@ -171,1 +171,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         }
+         setProjects(pList);
@@ -172,1 +172,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } catch (err: any) {
+         if (pList.length > 0) {
@@ -173,1 +173,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         console.warn('Live Firestore synchronization issue, using fallback data:', err);
+           setSelectedProjectId(pList[0].projectId);
@@ -174,1 +174,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setActionNotice({
+         }
@@ -175,1 +175,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           type: 'error',
+       } catch (err: any) {
@@ -176,1 +176,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           message: 'تعذر الاتصال ببيانات Firestore المباشرة، تم تفعيل وضع المعاينة المحلي.',
+         console.warn('Live Firestore synchronization issue, using fallback data:', err);
@@ -177,1 +177,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         });
+         setActionNotice({
@@ -178,1 +178,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setProjects(DEFAULT_PROJECTS);
+           type: 'error',
@@ -179,1 +179,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         const defaultProjId = DEFAULT_PROJECTS[0].projectId;
+           message: 'تعذر الاتصال ببيانات Firestore المباشرة، تم تفعيل وضع المعاينة المحلي.',
@@ -180,1 +180,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setSelectedProjectId(defaultProjId);
+         });
@@ -181,1 +181,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setOverview(buildDefaultOverview(defaultProjId, localCarriers, localMaterials, localTrucks, localDrivers));
+         setProjects(DEFAULT_PROJECTS);
@@ -182,1 +182,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } finally {
+         const defaultProjId = DEFAULT_PROJECTS[0].projectId;
@@ -183,1 +183,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLoading(false);
+         setSelectedProjectId(defaultProjId);
@@ -184,1 +184,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }
+         setOverview(buildDefaultOverview(defaultProjId, localCarriers, localMaterials, localTrucks, localDrivers));
@@ -185,1 +185,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       } finally {
@@ -186,1 +186,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     initData();
+         setLoading(false);
@@ -187,1 +187,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   }, [user, isAuthReady]);
+       }
@@ -188,1 +188,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     }
@@ -189,1 +189,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Refresh current project overview
+     initData();
@@ -190,1 +190,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const refreshOverview = async (pId: string) => {
+   }, [user, isAuthReady]);
@@ -191,1 +191,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!pId) return;
+ 
@@ -192,1 +192,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+   // Refresh current project overview
@@ -193,1 +193,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(pId, localCarriers, localMaterials, localTrucks, localDrivers));
+   const refreshOverview = async (pId: string) => {
@@ -194,1 +194,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+     if (!pId) return;
@@ -195,1 +195,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+     if (!user) {
@@ -196,1 +196,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       setOverview(buildDefaultOverview(pId, localCarriers, localMaterials, localTrucks, localDrivers));
@@ -197,1 +197,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const ov = await masterDataService.getProjectMasterData(pId);
+       return;
@@ -198,1 +198,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(ov);
+     }
@@ -199,1 +199,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+     try {
@@ -200,1 +200,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       console.warn('Failed to load project master data from Firestore, using local overview:', err);
+       const ov = await masterDataService.getProjectMasterData(pId);
@@ -201,1 +201,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(pId, localCarriers, localMaterials, localTrucks, localDrivers));
+       setOverview(ov);
@@ -202,1 +202,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+     } catch (err: any) {
@@ -203,1 +203,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+       console.warn('Failed to load project master data from Firestore, using local overview:', err);
@@ -204,1 +204,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setOverview(buildDefaultOverview(pId, localCarriers, localMaterials, localTrucks, localDrivers));
@@ -205,1 +205,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   useEffect(() => {
+     }
@@ -206,1 +206,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (selectedProjectId) {
+   };
@@ -207,1 +207,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       refreshOverview(selectedProjectId);
+ 
@@ -208,1 +208,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+   useEffect(() => {
@@ -209,1 +209,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   }, [selectedProjectId]);
+     if (selectedProjectId) {
@@ -210,1 +210,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       refreshOverview(selectedProjectId);
@@ -211,1 +211,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Handle status toggle (ACTIVE <-> INACTIVE)
+     }
@@ -212,1 +212,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleToggleStatus = async (entityType: MasterEntityType, entityId: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
+   }, [selectedProjectId]);
@@ -213,1 +213,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId) return;
+ 
@@ -214,1 +214,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
+   // Handle status toggle (ACTIVE <-> INACTIVE)
@@ -215,1 +215,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const isAct = newStatus === 'ACTIVE';
+   const handleToggleStatus = async (entityType: MasterEntityType, entityId: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
@@ -216,1 +216,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     if (!selectedProjectId) return;
@@ -217,1 +217,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+     const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
@@ -218,1 +218,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedCarriers = localCarriers;
+     const isAct = newStatus === 'ACTIVE';
@@ -219,1 +219,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedMaterials = localMaterials;
+ 
@@ -220,1 +220,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedTrucks = localTrucks;
+     if (!user) {
@@ -221,1 +221,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedDrivers = localDrivers;
+       let updatedCarriers = localCarriers;
@@ -222,1 +222,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       let updatedMaterials = localMaterials;
@@ -223,1 +223,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       if (entityType === 'CARRIER') {
+       let updatedTrucks = localTrucks;
@@ -224,1 +224,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedCarriers = localCarriers.map(c => c.carrierId === entityId ? { ...c, status: newStatus, isActive: isAct } : c);
+       let updatedDrivers = localDrivers;
@@ -225,1 +225,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalCarriers(updatedCarriers);
+ 
@@ -226,1 +226,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } else if (entityType === 'MATERIAL') {
+       if (entityType === 'CARRIER') {
@@ -227,1 +227,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedMaterials = localMaterials.map(m => m.materialId === entityId ? { ...m, status: newStatus, isActive: isAct } : m);
+         updatedCarriers = localCarriers.map(c => c.carrierId === entityId ? { ...c, status: newStatus, isActive: isAct } : c);
@@ -228,1 +228,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalMaterials(updatedMaterials);
+         setLocalCarriers(updatedCarriers);
@@ -229,1 +229,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } else if (entityType === 'TRUCK') {
+       } else if (entityType === 'MATERIAL') {
@@ -230,1 +230,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedTrucks = localTrucks.map(t => t.truckId === entityId ? { ...t, status: newStatus, isActive: isAct } : t);
+         updatedMaterials = localMaterials.map(m => m.materialId === entityId ? { ...m, status: newStatus, isActive: isAct } : m);
@@ -231,1 +231,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalTrucks(updatedTrucks);
+         setLocalMaterials(updatedMaterials);
@@ -232,1 +232,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } else if (entityType === 'DRIVER') {
+       } else if (entityType === 'TRUCK') {
@@ -233,1 +233,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedDrivers = localDrivers.map(d => d.driverId === entityId ? { ...d, status: newStatus, isActive: isAct } : d);
+         updatedTrucks = localTrucks.map(t => t.truckId === entityId ? { ...t, status: newStatus, isActive: isAct } : t);
@@ -234,1 +234,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalDrivers(updatedDrivers);
+         setLocalTrucks(updatedTrucks);
@@ -235,1 +235,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }
+       } else if (entityType === 'DRIVER') {
@@ -236,1 +236,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+         updatedDrivers = localDrivers.map(d => d.driverId === entityId ? { ...d, status: newStatus, isActive: isAct } : d);
@@ -237,1 +237,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(selectedProjectId, updatedCarriers, updatedMaterials, updatedTrucks, updatedDrivers));
+         setLocalDrivers(updatedDrivers);
@@ -238,1 +238,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+       }
@@ -239,1 +239,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'success',
+ 
@@ -240,1 +240,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: `تم تحديث حالة السجل (${entityId}) بنجاح إلى [${newStatus}] (محلياً في وضع المعاينة).`,
+       setOverview(buildDefaultOverview(selectedProjectId, updatedCarriers, updatedMaterials, updatedTrucks, updatedDrivers));
@@ -241,1 +241,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+       setActionNotice({
@@ -242,1 +242,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+         type: 'success',
@@ -243,1 +243,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         message: `تم تحديث حالة السجل (${entityId}) بنجاح إلى [${newStatus}] (محلياً في وضع المعاينة).`,
@@ -244,1 +244,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       });
@@ -245,1 +245,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -246,1 +246,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await masterDataService.setEntityStatus(selectedProjectId, entityType, entityId, newStatus, MOCK_AUTH_CONTEXT);
+     }
@@ -247,1 +247,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+ 
@@ -248,1 +248,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'success',
+     try {
@@ -249,1 +249,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: `تم تحديث حالة السجل (${entityId}) بنجاح إلى [${newStatus}].`,
+       await masterDataService.setEntityStatus(selectedProjectId, entityType, entityId, newStatus, MOCK_AUTH_CONTEXT);
@@ -250,1 +250,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+       setActionNotice({
@@ -251,1 +251,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+         type: 'success',
@@ -252,1 +252,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+         message: `تم تحديث حالة السجل (${entityId}) بنجاح إلى [${newStatus}].`,
@@ -253,1 +253,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+       });
@@ -254,1 +254,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'error',
+       await refreshOverview(selectedProjectId);
@@ -255,1 +255,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: err.message || 'فشل تحديث الحالة',
+     } catch (err: any) {
@@ -256,1 +256,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+       setActionNotice({
@@ -257,1 +257,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         type: 'error',
@@ -258,1 +258,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+         message: err.message || 'فشل تحديث الحالة',
@@ -259,1 +259,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       });
@@ -260,1 +260,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Open deletion guard modal
+     }
@@ -261,1 +261,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleAttemptDelete = async (entityType: MasterEntityType, entityId: string, title: string) => {
+   };
@@ -262,1 +262,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     setDeleteModal({
+ 
@@ -263,1 +263,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       isOpen: true,
+   // Open deletion guard modal
@@ -264,1 +264,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       entityType,
+   const handleAttemptDelete = async (entityType: MasterEntityType, entityId: string, title: string) => {
@@ -265,1 +265,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       entityId,
+     setDeleteModal({
@@ -266,1 +266,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       entityTitle: title,
+       isOpen: true,
@@ -267,1 +267,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       checking: true,
+       entityType,
@@ -268,1 +268,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       usageResult: null,
+       entityId,
@@ -269,1 +269,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       error: null,
+       entityTitle: title,
@@ -270,1 +270,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       success: null,
+       checking: true,
@@ -271,1 +271,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     });
+       usageResult: null,
@@ -272,1 +272,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       error: null,
@@ -273,1 +273,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+       success: null,
@@ -274,1 +274,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       // Local safety check: TRK-9871, DRV-101, CAR-ALMAJDOUIE, MAT-AGG-01 are used in historical trip
+     });
@@ -275,1 +275,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const isHistorical = ['CAR-ALMAJDOUIE', 'TRK-9871', 'DRV-101', 'MAT-AGG-01'].includes(entityId);
+ 
@@ -276,1 +276,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setTimeout(() => {
+     if (!user) {
@@ -277,1 +277,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setDeleteModal(prev => ({
+       // Local safety check: TRK-9871, DRV-101, CAR-ALMAJDOUIE, MAT-AGG-01 are used in historical trip
@@ -278,1 +278,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           ...prev,
+       const isHistorical = ['CAR-ALMAJDOUIE', 'TRK-9871', 'DRV-101', 'MAT-AGG-01'].includes(entityId);
@@ -279,1 +279,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           checking: false,
+       setTimeout(() => {
@@ -280,1 +280,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           usageResult: {
+         setDeleteModal(prev => ({
@@ -281,1 +281,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             isUsed: isHistorical,
+           ...prev,
@@ -282,1 +282,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             count: isHistorical ? 1 : 0,
+           checking: false,
@@ -283,1 +283,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             tripNumbers: isHistorical ? ['TRP-2026-00088'] : [],
+           usageResult: {
@@ -284,1 +284,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           },
+             isUsed: isHistorical,
@@ -285,1 +285,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         }));
+             count: isHistorical ? 1 : 0,
@@ -286,1 +286,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }, 200);
+             tripNumbers: isHistorical ? ['TRP-2026-00088'] : [],
@@ -287,1 +287,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+           },
@@ -288,1 +288,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         }));
@@ -289,1 +289,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       }, 200);
@@ -290,1 +290,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -291,1 +291,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const usage = await masterDataService.checkTripUsage(selectedProjectId, entityType, entityId);
+     }
@@ -292,1 +292,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setDeleteModal(prev => ({
+ 
@@ -293,1 +293,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         ...prev,
+     try {
@@ -294,1 +294,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         checking: false,
+       const usage = await masterDataService.checkTripUsage(selectedProjectId, entityType, entityId);
@@ -295,1 +295,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         usageResult: usage,
+       setDeleteModal(prev => ({
@@ -296,1 +296,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+         ...prev,
@@ -297,1 +297,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+         checking: false,
@@ -298,1 +298,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setDeleteModal(prev => ({
+         usageResult: usage,
@@ -299,1 +299,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         ...prev,
+       }));
@@ -300,1 +300,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         checking: false,
+     } catch (err: any) {
@@ -301,1 +301,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         error: err.message,
+       setDeleteModal(prev => ({
@@ -302,1 +302,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+         ...prev,
@@ -303,1 +303,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         checking: false,
@@ -304,1 +304,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+         error: err.message,
@@ -305,1 +305,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       }));
@@ -306,1 +306,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Confirm soft delete (setting INACTIVE)
+     }
@@ -307,1 +307,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleConfirmSoftDelete = async () => {
+   };
@@ -308,1 +308,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!deleteModal.entityId || !selectedProjectId) return;
+ 
@@ -309,1 +309,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   // Confirm soft delete (setting INACTIVE)
@@ -310,1 +310,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+   const handleConfirmSoftDelete = async () => {
@@ -311,1 +311,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const entityId = deleteModal.entityId;
+     if (!deleteModal.entityId || !selectedProjectId) return;
@@ -312,1 +312,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const entityType = deleteModal.entityType;
+ 
@@ -313,1 +313,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedCarriers = localCarriers;
+     if (!user) {
@@ -314,1 +314,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedMaterials = localMaterials;
+       const entityId = deleteModal.entityId;
@@ -315,1 +315,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedTrucks = localTrucks;
+       const entityType = deleteModal.entityType;
@@ -316,1 +316,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       let updatedDrivers = localDrivers;
+       let updatedCarriers = localCarriers;
@@ -317,1 +317,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       let updatedMaterials = localMaterials;
@@ -318,1 +318,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       if (entityType === 'CARRIER') {
+       let updatedTrucks = localTrucks;
@@ -319,1 +319,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedCarriers = localCarriers.map(c => c.carrierId === entityId ? { ...c, status: 'INACTIVE' as const, isActive: false } : c);
+       let updatedDrivers = localDrivers;
@@ -320,1 +320,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalCarriers(updatedCarriers);
+ 
@@ -321,1 +321,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } else if (entityType === 'MATERIAL') {
+       if (entityType === 'CARRIER') {
@@ -322,1 +322,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedMaterials = localMaterials.map(m => m.materialId === entityId ? { ...m, status: 'INACTIVE' as const, isActive: false } : m);
+         updatedCarriers = localCarriers.map(c => c.carrierId === entityId ? { ...c, status: 'INACTIVE' as const, isActive: false } : c);
@@ -323,1 +323,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalMaterials(updatedMaterials);
+         setLocalCarriers(updatedCarriers);
@@ -324,1 +324,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } else if (entityType === 'TRUCK') {
+       } else if (entityType === 'MATERIAL') {
@@ -325,1 +325,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedTrucks = localTrucks.map(t => t.truckId === entityId ? { ...t, status: 'INACTIVE' as const, isActive: false } : t);
+         updatedMaterials = localMaterials.map(m => m.materialId === entityId ? { ...m, status: 'INACTIVE' as const, isActive: false } : m);
@@ -326,1 +326,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalTrucks(updatedTrucks);
+         setLocalMaterials(updatedMaterials);
@@ -327,1 +327,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       } else if (entityType === 'DRIVER') {
+       } else if (entityType === 'TRUCK') {
@@ -328,1 +328,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         updatedDrivers = localDrivers.map(d => d.driverId === entityId ? { ...d, status: 'INACTIVE' as const, isActive: false } : d);
+         updatedTrucks = localTrucks.map(t => t.truckId === entityId ? { ...t, status: 'INACTIVE' as const, isActive: false } : t);
@@ -329,1 +329,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setLocalDrivers(updatedDrivers);
+         setLocalTrucks(updatedTrucks);
@@ -330,1 +330,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }
+       } else if (entityType === 'DRIVER') {
@@ -331,1 +331,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+         updatedDrivers = localDrivers.map(d => d.driverId === entityId ? { ...d, status: 'INACTIVE' as const, isActive: false } : d);
@@ -332,1 +332,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(selectedProjectId, updatedCarriers, updatedMaterials, updatedTrucks, updatedDrivers));
+         setLocalDrivers(updatedDrivers);
@@ -333,1 +333,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setDeleteModal(prev => ({
+       }
@@ -334,1 +334,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         ...prev,
+ 
@@ -335,1 +335,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         success: 'تم تعطيل السجل بنجاح (الحذف المنطقي Soft Delete) وحمايته من العمليات الجديدة.',
+       setOverview(buildDefaultOverview(selectedProjectId, updatedCarriers, updatedMaterials, updatedTrucks, updatedDrivers));
@@ -336,1 +336,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+       setDeleteModal(prev => ({
@@ -337,1 +337,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setTimeout(() => {
+         ...prev,
@@ -338,1 +338,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setDeleteModal(prev => ({ ...prev, isOpen: false }));
+         success: 'تم تعطيل السجل بنجاح (الحذف المنطقي Soft Delete) وحمايته من العمليات الجديدة.',
@@ -339,1 +339,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }, 1500);
+       }));
@@ -340,1 +340,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+       setTimeout(() => {
@@ -341,1 +341,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         setDeleteModal(prev => ({ ...prev, isOpen: false }));
@@ -342,1 +342,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       }, 1500);
@@ -343,1 +343,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -344,1 +344,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const res = await masterDataService.deleteMasterEntity(
+     }
@@ -345,1 +345,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         selectedProjectId,
+ 
@@ -346,1 +346,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         deleteModal.entityType,
+     try {
@@ -347,1 +347,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         deleteModal.entityId,
+       const res = await masterDataService.deleteMasterEntity(
@@ -348,1 +348,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         MOCK_AUTH_CONTEXT
+         selectedProjectId,
@@ -349,1 +349,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       );
+         deleteModal.entityType,
@@ -350,1 +350,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setDeleteModal(prev => ({
+         deleteModal.entityId,
@@ -351,1 +351,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         ...prev,
+         MOCK_AUTH_CONTEXT
@@ -352,1 +352,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         success: res.message,
+       );
@@ -353,1 +353,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+       setDeleteModal(prev => ({
@@ -354,1 +354,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+         ...prev,
@@ -355,1 +355,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setTimeout(() => {
+         success: res.message,
@@ -356,1 +356,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         setDeleteModal(prev => ({ ...prev, isOpen: false }));
+       }));
@@ -357,1 +357,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }, 1800);
+       await refreshOverview(selectedProjectId);
@@ -358,1 +358,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+       setTimeout(() => {
@@ -359,1 +359,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setDeleteModal(prev => ({
+         setDeleteModal(prev => ({ ...prev, isOpen: false }));
@@ -360,1 +360,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         ...prev,
+       }, 1800);
@@ -361,1 +361,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         error: err.message,
+     } catch (err: any) {
@@ -362,1 +362,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+       setDeleteModal(prev => ({
@@ -363,1 +363,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+         ...prev,
@@ -364,1 +364,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+         error: err.message,
@@ -365,1 +365,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       }));
@@ -366,1 +366,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Authorization toggle for Carrier
+     }
@@ -367,1 +367,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleToggleCarrierAuth = async (carrierId: string, currentAuth: boolean) => {
+   };
@@ -368,1 +368,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId) return;
+ 
@@ -369,1 +369,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   // Authorization toggle for Carrier
@@ -370,1 +370,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+   const handleToggleCarrierAuth = async (carrierId: string, currentAuth: boolean) => {
@@ -371,1 +371,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setProjects(prev => prev.map(p => {
+     if (!selectedProjectId) return;
@@ -372,1 +372,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         if (p.projectId !== selectedProjectId) return p;
+ 
@@ -373,1 +373,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         const currentList = p.authorizedCarrierIds || [];
+     if (!user) {
@@ -374,1 +374,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         const nextList = currentAuth ? currentList.filter(id => id !== carrierId) : [...currentList, carrierId];
+       setProjects(prev => prev.map(p => {
@@ -375,1 +375,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         return { ...p, authorizedCarrierIds: nextList };
+         if (p.projectId !== selectedProjectId) return p;
@@ -376,1 +376,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+         const currentList = p.authorizedCarrierIds || [];
@@ -377,1 +377,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+         const nextList = currentAuth ? currentList.filter(id => id !== carrierId) : [...currentList, carrierId];
@@ -378,1 +378,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'success',
+         return { ...p, authorizedCarrierIds: nextList };
@@ -379,1 +379,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: !currentAuth 
+       }));
@@ -380,1 +380,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           ? `تم تصريح الناقل (${carrierId}) للعمل في هذا المشروع (وضع المعاينة).`
+       setActionNotice({
@@ -381,1 +381,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           : `تم إلغاء تصريح الناقل (${carrierId}) من هذا المشروع (وضع المعاينة).`,
+         type: 'success',
@@ -382,1 +382,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+         message: !currentAuth 
@@ -383,1 +383,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+           ? `تم تصريح الناقل (${carrierId}) للعمل في هذا المشروع (وضع المعاينة).`
@@ -384,1 +384,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+           : `تم إلغاء تصريح الناقل (${carrierId}) من هذا المشروع (وضع المعاينة).`,
@@ -385,1 +385,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       });
@@ -386,1 +386,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -387,1 +387,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await masterDataService.toggleCarrierAuthorization(selectedProjectId, carrierId, !currentAuth, MOCK_AUTH_CONTEXT);
+     }
@@ -388,1 +388,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+ 
@@ -389,1 +389,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'success',
+     try {
@@ -390,1 +390,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: !currentAuth 
+       await masterDataService.toggleCarrierAuthorization(selectedProjectId, carrierId, !currentAuth, MOCK_AUTH_CONTEXT);
@@ -391,1 +391,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           ? `تم تصريح الناقل (${carrierId}) للعمل في هذا المشروع.`
+       setActionNotice({
@@ -392,1 +392,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           : `تم إلغاء تصريح الناقل (${carrierId}) من هذا المشروع.`,
+         type: 'success',
@@ -393,1 +393,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+         message: !currentAuth 
@@ -394,1 +394,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+           ? `تم تصريح الناقل (${carrierId}) للعمل في هذا المشروع.`
@@ -395,1 +395,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+           : `تم إلغاء تصريح الناقل (${carrierId}) من هذا المشروع.`,
@@ -396,1 +396,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'error', message: err.message });
+       });
@@ -397,1 +397,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       await refreshOverview(selectedProjectId);
@@ -398,1 +398,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } catch (err: any) {
@@ -399,1 +399,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'error', message: err.message });
@@ -400,1 +400,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Authorization toggle for Material
+     }
@@ -401,1 +401,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleToggleMaterialAuth = async (materialId: string, currentAuth: boolean) => {
+   };
@@ -402,1 +402,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId) return;
+ 
@@ -403,1 +403,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   // Authorization toggle for Material
@@ -404,1 +404,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+   const handleToggleMaterialAuth = async (materialId: string, currentAuth: boolean) => {
@@ -405,1 +405,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setProjects(prev => prev.map(p => {
+     if (!selectedProjectId) return;
@@ -406,1 +406,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         if (p.projectId !== selectedProjectId) return p;
+ 
@@ -407,1 +407,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         const currentList = p.authorizedMaterialIds || [];
+     if (!user) {
@@ -408,1 +408,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         const nextList = currentAuth ? currentList.filter(id => id !== materialId) : [...currentList, materialId];
+       setProjects(prev => prev.map(p => {
@@ -409,1 +409,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         return { ...p, authorizedMaterialIds: nextList };
+         if (p.projectId !== selectedProjectId) return p;
@@ -410,1 +410,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       }));
+         const currentList = p.authorizedMaterialIds || [];
@@ -411,1 +411,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+         const nextList = currentAuth ? currentList.filter(id => id !== materialId) : [...currentList, materialId];
@@ -412,1 +412,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'success',
+         return { ...p, authorizedMaterialIds: nextList };
@@ -413,1 +413,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: !currentAuth 
+       }));
@@ -414,1 +414,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           ? `تم اعتماد توريد المادة (${materialId}) في هذا المشروع (وضع المعاينة).`
+       setActionNotice({
@@ -415,1 +415,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           : `تم حظر توريد المادة (${materialId}) من هذا المشروع (وضع المعاينة).`,
+         type: 'success',
@@ -416,1 +416,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+         message: !currentAuth 
@@ -417,1 +417,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+           ? `تم اعتماد توريد المادة (${materialId}) في هذا المشروع (وضع المعاينة).`
@@ -418,1 +418,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+           : `تم حظر توريد المادة (${materialId}) من هذا المشروع (وضع المعاينة).`,
@@ -419,1 +419,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       });
@@ -420,1 +420,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -421,1 +421,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await masterDataService.toggleMaterialAuthorization(selectedProjectId, materialId, !currentAuth, MOCK_AUTH_CONTEXT);
+     }
@@ -422,1 +422,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({
+ 
@@ -423,1 +423,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         type: 'success',
+     try {
@@ -424,1 +424,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         message: !currentAuth 
+       await masterDataService.toggleMaterialAuthorization(selectedProjectId, materialId, !currentAuth, MOCK_AUTH_CONTEXT);
@@ -425,1 +425,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           ? `تم اعتماد توريد المادة (${materialId}) في هذا المشروع.`
+       setActionNotice({
@@ -426,1 +426,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           : `تم حظر توريد المادة (${materialId}) من هذا المشروع.`,
+         type: 'success',
@@ -427,1 +427,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       });
+         message: !currentAuth 
@@ -428,1 +428,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+           ? `تم اعتماد توريد المادة (${materialId}) في هذا المشروع.`
@@ -429,1 +429,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+           : `تم حظر توريد المادة (${materialId}) من هذا المشروع.`,
@@ -430,1 +430,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'error', message: err.message });
+       });
@@ -431,1 +431,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       await refreshOverview(selectedProjectId);
@@ -432,1 +432,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } catch (err: any) {
@@ -433,1 +433,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'error', message: err.message });
@@ -434,1 +434,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Create Entity
+     }
@@ -435,1 +435,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleCreateCarrier = async (e: React.FormEvent) => {
+   };
@@ -436,1 +436,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     e.preventDefault();
+ 
@@ -437,1 +437,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId || !newCarrier.carrierId || !newCarrier.name) return;
+   // Create Entity
@@ -438,1 +438,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const handleCreateCarrier = async (e: React.FormEvent) => {
@@ -439,1 +439,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const carrierEntity: CarrierEntity = {
+     e.preventDefault();
@@ -440,1 +440,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       carrierId: newCarrier.carrierId.trim().toUpperCase(),
+     if (!selectedProjectId || !newCarrier.carrierId || !newCarrier.name) return;
@@ -441,1 +441,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       projectId: selectedProjectId,
+ 
@@ -442,1 +442,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       name: newCarrier.name.trim(),
+     const carrierEntity: CarrierEntity = {
@@ -443,1 +443,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       normalizedName: normalizeName(newCarrier.name.trim()),
+       carrierId: newCarrier.carrierId.trim().toUpperCase(),
@@ -444,1 +444,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       status: 'ACTIVE',
+       projectId: selectedProjectId,
@@ -445,1 +445,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       companyNameAr: newCarrier.name.trim(),
+       name: newCarrier.name.trim(),
@@ -446,1 +446,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       commercialRegistrationNo: newCarrier.crNo,
+       normalizedName: normalizeName(newCarrier.name.trim()),
@@ -447,1 +447,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       isActive: true,
+       status: 'ACTIVE',
@@ -448,1 +448,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdAt: new Date(),
+       companyNameAr: newCarrier.name.trim(),
@@ -449,1 +449,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdBy: MOCK_AUTH_CONTEXT.userId,
+       commercialRegistrationNo: newCarrier.crNo,
@@ -450,1 +450,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedAt: new Date(),
+       isActive: true,
@@ -451,1 +451,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedBy: MOCK_AUTH_CONTEXT.userId,
+       createdAt: new Date(),
@@ -452,1 +452,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     };
+       createdBy: MOCK_AUTH_CONTEXT.userId,
@@ -453,1 +453,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       updatedAt: new Date(),
@@ -454,1 +454,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+       updatedBy: MOCK_AUTH_CONTEXT.userId,
@@ -455,1 +455,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const updated = [carrierEntity, ...localCarriers];
+     };
@@ -456,1 +456,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setLocalCarriers(updated);
+ 
@@ -457,1 +457,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'CARRIER' });
+     if (!user) {
@@ -458,1 +458,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewCarrier({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
+       const updated = [carrierEntity, ...localCarriers];
@@ -459,1 +459,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(selectedProjectId, updated, localMaterials, localTrucks, localDrivers));
+       setLocalCarriers(updated);
@@ -460,1 +460,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم إضافة الناقل بنجاح مع التطبيع التلقائي للاسم (محلياً).' });
+       setCreateModal({ isOpen: false, entityType: 'CARRIER' });
@@ -461,1 +461,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+       setNewCarrier({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
@@ -462,1 +462,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       setOverview(buildDefaultOverview(selectedProjectId, updated, localMaterials, localTrucks, localDrivers));
@@ -463,1 +463,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'success', message: 'تم إضافة الناقل بنجاح مع التطبيع التلقائي للاسم (محلياً).' });
@@ -464,1 +464,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -465,1 +465,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await carrierRepository.create(carrierEntity);
+     }
@@ -466,1 +466,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'CARRIER' });
+ 
@@ -467,1 +467,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewCarrier({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
+     try {
@@ -468,1 +468,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم إضافة الناقل بنجاح مع التطبيع التلقائي للاسم.' });
+       await carrierRepository.create(carrierEntity);
@@ -469,1 +469,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+       setCreateModal({ isOpen: false, entityType: 'CARRIER' });
@@ -470,1 +470,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+       setNewCarrier({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
@@ -471,1 +471,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'error', message: err.message });
+       setActionNotice({ type: 'success', message: 'تم إضافة الناقل بنجاح مع التطبيع التلقائي للاسم.' });
@@ -472,1 +472,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       await refreshOverview(selectedProjectId);
@@ -473,1 +473,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } catch (err: any) {
@@ -474,1 +474,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'error', message: err.message });
@@ -475,1 +475,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleCreateMaterial = async (e: React.FormEvent) => {
+     }
@@ -476,1 +476,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     e.preventDefault();
+   };
@@ -477,1 +477,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId || !newMaterial.materialId || !newMaterial.name) return;
+ 
@@ -478,1 +478,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const handleCreateMaterial = async (e: React.FormEvent) => {
@@ -479,1 +479,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const matEntity: MaterialEntity = {
+     e.preventDefault();
@@ -480,1 +480,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       materialId: newMaterial.materialId.trim().toUpperCase(),
+     if (!selectedProjectId || !newMaterial.materialId || !newMaterial.name) return;
@@ -481,1 +481,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       projectId: selectedProjectId,
+ 
@@ -482,1 +482,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       name: newMaterial.name.trim(),
+     const matEntity: MaterialEntity = {
@@ -483,1 +483,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       normalizedName: normalizeName(newMaterial.name.trim()),
+       materialId: newMaterial.materialId.trim().toUpperCase(),
@@ -484,1 +484,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       code: normalizeCode(newMaterial.code),
+       projectId: selectedProjectId,
@@ -485,1 +485,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       status: 'ACTIVE',
+       name: newMaterial.name.trim(),
@@ -486,1 +486,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       unitOfMeasure: newMaterial.uom,
+       normalizedName: normalizeName(newMaterial.name.trim()),
@@ -487,1 +487,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       isActive: true,
+       code: normalizeCode(newMaterial.code),
@@ -488,1 +488,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdAt: new Date(),
+       status: 'ACTIVE',
@@ -489,1 +489,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdBy: MOCK_AUTH_CONTEXT.userId,
+       unitOfMeasure: newMaterial.uom,
@@ -490,1 +490,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedAt: new Date(),
+       isActive: true,
@@ -491,1 +491,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedBy: MOCK_AUTH_CONTEXT.userId,
+       createdAt: new Date(),
@@ -492,1 +492,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     };
+       createdBy: MOCK_AUTH_CONTEXT.userId,
@@ -493,1 +493,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       updatedAt: new Date(),
@@ -494,1 +494,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+       updatedBy: MOCK_AUTH_CONTEXT.userId,
@@ -495,1 +495,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const updated = [matEntity, ...localMaterials];
+     };
@@ -496,1 +496,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setLocalMaterials(updated);
+ 
@@ -497,1 +497,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'MATERIAL' });
+     if (!user) {
@@ -498,1 +498,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewMaterial({ materialId: '', name: '', code: 'AGG-02', uom: 'TON' });
+       const updated = [matEntity, ...localMaterials];
@@ -499,1 +499,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(selectedProjectId, localCarriers, updated, localTrucks, localDrivers));
+       setLocalMaterials(updated);
@@ -500,1 +500,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم إضافة المادة بنجاح وتطبيع الرمز والاسم (محلياً).' });
+       setCreateModal({ isOpen: false, entityType: 'MATERIAL' });
@@ -501,1 +501,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+       setNewMaterial({ materialId: '', name: '', code: 'AGG-02', uom: 'TON' });
@@ -502,1 +502,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       setOverview(buildDefaultOverview(selectedProjectId, localCarriers, updated, localTrucks, localDrivers));
@@ -503,1 +503,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'success', message: 'تم إضافة المادة بنجاح وتطبيع الرمز والاسم (محلياً).' });
@@ -504,1 +504,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -505,1 +505,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await materialRepository.create(matEntity);
+     }
@@ -506,1 +506,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'MATERIAL' });
+ 
@@ -507,1 +507,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewMaterial({ materialId: '', name: '', code: 'AGG-02', uom: 'TON' });
+     try {
@@ -508,1 +508,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم إضافة المادة بنجاح وتطبيع الرمز والاسم.' });
+       await materialRepository.create(matEntity);
@@ -509,1 +509,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+       setCreateModal({ isOpen: false, entityType: 'MATERIAL' });
@@ -510,1 +510,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+       setNewMaterial({ materialId: '', name: '', code: 'AGG-02', uom: 'TON' });
@@ -511,1 +511,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'error', message: err.message });
+       setActionNotice({ type: 'success', message: 'تم إضافة المادة بنجاح وتطبيع الرمز والاسم.' });
@@ -512,1 +512,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       await refreshOverview(selectedProjectId);
@@ -513,1 +513,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } catch (err: any) {
@@ -514,1 +514,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'error', message: err.message });
@@ -515,1 +515,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleCreateTruck = async (e: React.FormEvent) => {
+     }
@@ -516,1 +516,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     e.preventDefault();
+   };
@@ -517,1 +517,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId || !newTruck.truckId || !newTruck.plate || !newTruck.carrierId) return;
+ 
@@ -518,1 +518,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const handleCreateTruck = async (e: React.FormEvent) => {
@@ -519,1 +519,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const truckEntity: TruckEntity = {
+     e.preventDefault();
@@ -520,1 +520,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       truckId: newTruck.truckId.trim().toUpperCase(),
+     if (!selectedProjectId || !newTruck.truckId || !newTruck.plate || !newTruck.carrierId) return;
@@ -521,1 +521,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       projectId: selectedProjectId,
+ 
@@ -522,1 +522,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       carrierId: newTruck.carrierId,
+     const truckEntity: TruckEntity = {
@@ -523,1 +523,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       plate: newTruck.plate.trim(),
+       truckId: newTruck.truckId.trim().toUpperCase(),
@@ -524,1 +524,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       normalizedPlate: normalizePlate(newTruck.plate.trim()),
+       projectId: selectedProjectId,
@@ -525,1 +525,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       plateNumberAr: newTruck.plate.trim(),
+       carrierId: newTruck.carrierId,
@@ -526,1 +526,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       status: 'ACTIVE',
+       plate: newTruck.plate.trim(),
@@ -527,1 +527,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       tareWeightKg: Number(newTruck.tareKg),
+       normalizedPlate: normalizePlate(newTruck.plate.trim()),
@@ -528,1 +528,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       maxGrossWeightKg: Number(newTruck.grossKg),
+       plateNumberAr: newTruck.plate.trim(),
@@ -529,1 +529,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       legalPayloadLimitKg: Math.max(0, Number(newTruck.grossKg) - Number(newTruck.tareKg)),
+       status: 'ACTIVE',
@@ -530,1 +530,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       isActive: true,
+       tareWeightKg: Number(newTruck.tareKg),
@@ -531,1 +531,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdAt: new Date(),
+       maxGrossWeightKg: Number(newTruck.grossKg),
@@ -532,1 +532,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdBy: MOCK_AUTH_CONTEXT.userId,
+       legalPayloadLimitKg: Math.max(0, Number(newTruck.grossKg) - Number(newTruck.tareKg)),
@@ -533,1 +533,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedAt: new Date(),
+       isActive: true,
@@ -534,1 +534,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedBy: MOCK_AUTH_CONTEXT.userId,
+       createdAt: new Date(),
@@ -535,1 +535,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     };
+       createdBy: MOCK_AUTH_CONTEXT.userId,
@@ -536,1 +536,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       updatedAt: new Date(),
@@ -537,1 +537,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+       updatedBy: MOCK_AUTH_CONTEXT.userId,
@@ -538,1 +538,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const updated = [truckEntity, ...localTrucks];
+     };
@@ -539,1 +539,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setLocalTrucks(updated);
+ 
@@ -540,1 +540,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'TRUCK' });
+     if (!user) {
@@ -541,1 +541,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewTruck({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
+       const updated = [truckEntity, ...localTrucks];
@@ -542,1 +542,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(selectedProjectId, localCarriers, localMaterials, updated, localDrivers));
+       setLocalTrucks(updated);
@@ -543,1 +543,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم تسجيل الشاحنة وربطها بالناقل (Truck → Carrier) محلياً.' });
+       setCreateModal({ isOpen: false, entityType: 'TRUCK' });
@@ -544,1 +544,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+       setNewTruck({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
@@ -545,1 +545,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       setOverview(buildDefaultOverview(selectedProjectId, localCarriers, localMaterials, updated, localDrivers));
@@ -546,1 +546,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'success', message: 'تم تسجيل الشاحنة وربطها بالناقل (Truck → Carrier) محلياً.' });
@@ -547,1 +547,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -548,1 +548,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await truckRepository.create(truckEntity);
+     }
@@ -549,1 +549,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'TRUCK' });
+ 
@@ -550,1 +550,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewTruck({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
+     try {
@@ -551,1 +551,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم تسجيل الشاحنة وربطها بالناقل (Truck → Carrier) مع تطبيع اللوحة.' });
+       await truckRepository.create(truckEntity);
@@ -552,1 +552,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+       setCreateModal({ isOpen: false, entityType: 'TRUCK' });
@@ -553,1 +553,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+       setNewTruck({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
@@ -554,1 +554,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'error', message: err.message });
+       setActionNotice({ type: 'success', message: 'تم تسجيل الشاحنة وربطها بالناقل (Truck → Carrier) مع تطبيع اللوحة.' });
@@ -555,1 +555,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       await refreshOverview(selectedProjectId);
@@ -556,1 +556,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } catch (err: any) {
@@ -557,1 +557,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'error', message: err.message });
@@ -558,1 +558,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const handleCreateDriver = async (e: React.FormEvent) => {
+     }
@@ -559,1 +559,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     e.preventDefault();
+   };
@@ -560,1 +560,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!selectedProjectId || !newDriver.driverId || !newDriver.name || !newDriver.carrierId) return;
+ 
@@ -561,1 +561,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const handleCreateDriver = async (e: React.FormEvent) => {
@@ -562,1 +562,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const driverEntity: DriverEntity = {
+     e.preventDefault();
@@ -563,1 +563,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       driverId: newDriver.driverId.trim().toUpperCase(),
+     if (!selectedProjectId || !newDriver.driverId || !newDriver.name || !newDriver.carrierId) return;
@@ -564,1 +564,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       projectId: selectedProjectId,
+ 
@@ -565,1 +565,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       carrierId: newDriver.carrierId,
+     const driverEntity: DriverEntity = {
@@ -566,1 +566,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       name: newDriver.name.trim(),
+       driverId: newDriver.driverId.trim().toUpperCase(),
@@ -567,1 +567,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       normalizedName: normalizeName(newDriver.name.trim()),
+       projectId: selectedProjectId,
@@ -568,1 +568,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       fullNameAr: newDriver.name.trim(),
+       carrierId: newDriver.carrierId,
@@ -569,1 +569,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       phone: normalizePhone(newDriver.phone),
+       name: newDriver.name.trim(),
@@ -570,1 +570,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       idNumber: normalizeIdNumber(newDriver.idNumber),
+       normalizedName: normalizeName(newDriver.name.trim()),
@@ -571,1 +571,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       nationalOrIqamaId: normalizeIdNumber(newDriver.idNumber),
+       fullNameAr: newDriver.name.trim(),
@@ -572,1 +572,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       status: 'ACTIVE',
+       phone: normalizePhone(newDriver.phone),
@@ -573,1 +573,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       isActive: true,
+       idNumber: normalizeIdNumber(newDriver.idNumber),
@@ -574,1 +574,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdAt: new Date(),
+       nationalOrIqamaId: normalizeIdNumber(newDriver.idNumber),
@@ -575,1 +575,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       createdBy: MOCK_AUTH_CONTEXT.userId,
+       status: 'ACTIVE',
@@ -576,1 +576,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedAt: new Date(),
+       isActive: true,
@@ -577,1 +577,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       updatedBy: MOCK_AUTH_CONTEXT.userId,
+       createdAt: new Date(),
@@ -578,1 +578,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     };
+       createdBy: MOCK_AUTH_CONTEXT.userId,
@@ -579,1 +579,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       updatedAt: new Date(),
@@ -580,1 +580,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!user) {
+       updatedBy: MOCK_AUTH_CONTEXT.userId,
@@ -581,1 +581,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       const updated = [driverEntity, ...localDrivers];
+     };
@@ -582,1 +582,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setLocalDrivers(updated);
+ 
@@ -583,1 +583,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'DRIVER' });
+     if (!user) {
@@ -584,1 +584,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewDriver({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
+       const updated = [driverEntity, ...localDrivers];
@@ -585,1 +585,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setOverview(buildDefaultOverview(selectedProjectId, localCarriers, localMaterials, localTrucks, updated));
+       setLocalDrivers(updated);
@@ -586,1 +586,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم تسجيل السائق وربطه بالناقل (Driver → Carrier) محلياً.' });
+       setCreateModal({ isOpen: false, entityType: 'DRIVER' });
@@ -587,1 +587,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       return;
+       setNewDriver({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
@@ -588,1 +588,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       setOverview(buildDefaultOverview(selectedProjectId, localCarriers, localMaterials, localTrucks, updated));
@@ -589,1 +589,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'success', message: 'تم تسجيل السائق وربطه بالناقل (Driver → Carrier) محلياً.' });
@@ -590,1 +590,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     try {
+       return;
@@ -591,1 +591,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await driverRepository.create(driverEntity);
+     }
@@ -592,1 +592,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setCreateModal({ isOpen: false, entityType: 'DRIVER' });
+ 
@@ -593,1 +593,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setNewDriver({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
+     try {
@@ -594,1 +594,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'success', message: 'تم تسجيل السائق وربطه بالناقل (Driver → Carrier) مع تطبيع الهوية والجوال.' });
+       await driverRepository.create(driverEntity);
@@ -595,1 +595,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       await refreshOverview(selectedProjectId);
+       setCreateModal({ isOpen: false, entityType: 'DRIVER' });
@@ -596,1 +596,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     } catch (err: any) {
+       setNewDriver({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
@@ -597,1 +597,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       setActionNotice({ type: 'error', message: err.message });
+       setActionNotice({ type: 'success', message: 'تم تسجيل السائق وربطه بالناقل (Driver → Carrier) مع تطبيع الهوية والجوال.' });
@@ -598,1 +598,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     }
+       await refreshOverview(selectedProjectId);
@@ -599,1 +599,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     } catch (err: any) {
@@ -600,1 +600,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       setActionNotice({ type: 'error', message: err.message });
@@ -601,1 +601,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   // Filter helper with Arabic normalization
+     }
@@ -602,1 +602,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const normalizedQuery = normalizeArabicText(searchQuery);
+   };
@@ -604,1 +604,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const filterEntity = (name: string, normalizedName?: string, id?: string, extra?: string) => {
+   // Filter helper with Arabic normalization
@@ -605,1 +605,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     if (!searchQuery.trim()) return true;
+   const normalizedQuery = normalizeArabicText(searchQuery);
@@ -606,1 +606,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const targetNorm = normalizedName || normalizeArabicText(name);
+ 
@@ -607,1 +607,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const idMatch = id ? id.toLowerCase().includes(searchQuery.toLowerCase()) : false;
+   const filterEntity = (name: string, normalizedName?: string, id?: string, extra?: string) => {
@@ -608,1 +608,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const textMatch = targetNorm.includes(normalizedQuery);
+     if (!searchQuery.trim()) return true;
@@ -609,1 +609,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     const extraMatch = extra ? normalizeArabicText(extra).includes(normalizedQuery) : false;
+     const targetNorm = normalizedName || normalizeArabicText(name);
@@ -610,1 +610,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     return idMatch || textMatch || extraMatch;
+     const idMatch = id ? id.toLowerCase().includes(searchQuery.toLowerCase()) : false;
@@ -611,1 +611,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   };
+     const textMatch = targetNorm.includes(normalizedQuery);
@@ -612,1 +612,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+     const extraMatch = extra ? normalizeArabicText(extra).includes(normalizedQuery) : false;
@@ -613,1 +613,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const currentProject = projects.find(p => p.projectId === selectedProjectId);
+     return idMatch || textMatch || extraMatch;
@@ -614,1 +614,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const authCarrierIds = new Set(currentProject?.authorizedCarrierIds || overview?.authorizedCarriers.map(c => c.carrierId) || []);
+   };
@@ -615,1 +615,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   const authMaterialIds = new Set(currentProject?.authorizedMaterialIds || overview?.authorizedMaterials.map(m => m.materialId) || []);
+ 
@@ -616,1 +616,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+   const currentProject = projects.find(p => p.projectId === selectedProjectId);
@@ -617,1 +617,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   return (
+   const authCarrierIds = new Set(currentProject?.authorizedCarrierIds || overview?.authorizedCarriers.map(c => c.carrierId) || []);
@@ -618,1 +618,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     <div className="space-y-6">
+   const authMaterialIds = new Set(currentProject?.authorizedMaterialIds || overview?.authorizedMaterials.map(m => m.materialId) || []);
@@ -619,1 +619,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       {!user && (
+ 
@@ -620,1 +620,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
+   return (
@@ -621,1 +621,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           <div className="flex items-start sm:items-center gap-3">
+     <div className="space-y-6">
@@ -622,1 +622,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <span className="p-2 rounded-lg bg-amber-500/20 text-amber-800 shrink-0">
+       {!user && (
@@ -623,1 +623,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <Info className="w-5 h-5" />
+         <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
@@ -624,1 +624,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </span>
+           <div className="flex items-start sm:items-center gap-3">
@@ -625,1 +625,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <div>
+             <span className="p-2 rounded-lg bg-amber-500/20 text-amber-800 shrink-0">
@@ -626,1 +626,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <p className="text-sm font-bold">وضع الاستعراض والتجربة (Preview Mode)</p>
+               <Info className="w-5 h-5" />
@@ -627,1 +627,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <p className="text-xs text-amber-900/80">
+             </span>
@@ -628,1 +628,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 يعمل التطبيق حالياً بالبيانات المرجعية الكاملة للمشاريع السعودية. لتفعيل المزامنة المباشرة لقواعد بيانات Firestore وتخزين التعديلات سحابياً، يمكنك تسجيل الدخول بحساب Google.
+             <div>
@@ -629,1 +629,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </p>
+               <p className="text-sm font-bold">{t("other.labels.txt_486bf8")}</p>
@@ -630,1 +630,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </div>
+               <p className="text-xs text-amber-900/80">
@@ -631,1 +631,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           </div>
+                 {t("other.labels.txt_4e4d76")}</p>
@@ -632,1 +632,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           <button
+             </div>
@@ -633,1 +633,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             onClick={signInWithGoogle}
+           </div>
@@ -634,1 +634,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
+           <button
@@ -635,1 +635,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           >
+             onClick={signInWithGoogle}
@@ -636,1 +636,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <span>تسجيل الدخول عبر Google</span>
+             className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
@@ -637,1 +637,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           </button>
+           >
@@ -638,1 +638,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         </div>
+             <span>{t("other.labels.txt_1e1bdf")}</span>
@@ -639,1 +639,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       )}
+           </button>
@@ -640,1 +640,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+         </div>
@@ -641,1 +641,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       {/* Top Banner & Project Scope Selector */}
+       )}
@@ -642,1 +642,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs">
+ 
@@ -643,1 +643,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
+       {/* Top Banner & Project Scope Selector */}
@@ -644,1 +644,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           <div className="space-y-1">
+       <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs">
@@ -645,1 +645,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <div className="flex items-center gap-2">
+         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
@@ -646,1 +646,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
+           <div className="space-y-1">
@@ -647,1 +647,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <Building2 className="w-5 h-5" />
+             <div className="flex items-center gap-2">
@@ -648,1 +648,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </span>
+               <span className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
@@ -649,1 +649,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <h2 className="text-lg font-bold text-stone-900">
+                 <Building2 className="w-5 h-5" />
@@ -650,1 +650,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 إدارة البيانات الرئيسية (Master Data Modules)
+               </span>
@@ -651,1 +651,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </h2>
+               <h2 className="text-lg font-bold text-stone-900">
@@ -652,1 +652,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
+                 {t("other.labels.txt_7f7eb1")}</h2>
@@ -653,1 +653,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 عزل المشاريع ونزاهة السجلات
+               <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
@@ -654,1 +654,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </span>
+                 {t("other.labels.projects_5")}</span>
@@ -663,1 +663,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <span className="text-xs font-semibold text-stone-600">المشروع النشط:</span>
+             <span className="text-xs font-semibold text-stone-600">{t("other.status.projectActive")}</span>
@@ -678,1 +678,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               title="تحديث البيانات"
+               title={t("other.labels.refresh_2")}
@@ -691,1 +691,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span className="font-bold text-amber-900">ممنوع حذف السجلات المستخدمة:</span>
+               <span className="font-bold text-amber-900">{t("other.labels.delete")}</span>
@@ -692,1 +692,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <p className="text-amber-800 mt-0.5">أي ناقل أو مادة أو شاحنة أو سائق ورد في رحلات سابقة لا يُحذف مطلقاً لحماية الحسابات.</p>
+               <p className="text-amber-800 mt-0.5">{t("other.labels.txt_714016")}</p>
@@ -698,1 +698,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span className="font-bold text-emerald-900">نظام ACTIVE / INACTIVE:</span>
+               <span className="font-bold text-emerald-900">{t("other.labels.txt_207857")}</span>
@@ -699,1 +699,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <p className="text-emerald-800 mt-0.5">يُعتمد التعطيل (INACTIVE) بدلاً من الحذف الفعلي، لمنع استخدامه في رحلات مستقبلية.</p>
+               <p className="text-emerald-800 mt-0.5">{t("other.labels.delete_2")}</p>
@@ -705,1 +705,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span className="font-bold text-blue-900">حصر المواد والنواقل لكل مشروع:</span>
+               <span className="font-bold text-blue-900">{t("other.labels.materials_5")}</span>
@@ -706,1 +706,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <p className="text-blue-800 mt-0.5">كل مشروع يحتوي فقط على المواد والنواقل المصرح لهم به رسمياً، وتتبعهم الشاحنات والسائقين.</p>
+               <p className="text-blue-800 mt-0.5">{t("other.labels.materialsTrucks")}</p>
@@ -744,1 +744,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span>الناقلون (Carriers)</span>
+               <span>{t("other.labels.carriers_4")}</span>
@@ -801,1 +801,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span>السائقون (Drivers)</span>
+               <span>{t("other.labels.drivers_5")}</span>
@@ -827,1 +827,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span>فحص النزاهة والاختبارات الآلية</span>
+               <span>{t("other.labels.txt_35c4cc")}</span>
@@ -874,1 +874,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <option value="ALL">الكل (ACTIVE + INACTIVE)</option>
+               <option value="ALL">{t("other.labels.txt_2ed1b5")}</option>
@@ -875,1 +875,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <option value="ACTIVE">النشطة فقط (ACTIVE)</option>
+               <option value="ACTIVE">{t("other.status.txt_671eeb")}</option>
@@ -876,1 +876,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <option value="INACTIVE">المعطلة فقط (INACTIVE)</option>
+               <option value="INACTIVE">{t("other.labels.txt_f4c520")}</option>
@@ -889,1 +889,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <option value="ALL">جميع النواقل</option>
+                 <option value="ALL">{t("other.labels.txt_6b093a")}</option>
@@ -909,1 +909,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">معرّف الناقل</th>
+                   <th className="py-3 px-4">{t("other.labels.carrier_3")}</th>
@@ -912,1 +912,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">تصريح المشروع</th>
+                   <th className="py-3 px-4">{t("other.labels.project_4")}</th>
@@ -913,1 +913,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">حالة الناقل</th>
+                   <th className="py-3 px-4">{t("other.labels.carrier_4")}</th>
@@ -946,1 +946,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                             title="تبديل تصريح الناقل لهذا المشروع"
+                             title={t("other.labels.carrierProject_2")}
@@ -951,1 +951,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                                 <span>مصرح بالمشروع</span>
+                                 <span>{t("other.labels.project_5")}</span>
@@ -985,1 +985,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               title="حذف الناقل (فحص الرحلات والنزاهة)"
+                               title={t("other.labels.deleteCarrierTrips")}
@@ -1005,1 +1005,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">معرّف المادة</th>
+                   <th className="py-3 px-4">{t("other.labels.material_4")}</th>
@@ -1009,1 +1009,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">تصريح التوريد بالمشروع</th>
+                   <th className="py-3 px-4">{t("other.labels.project_6")}</th>
@@ -1010,1 +1010,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">حالة المادة</th>
+                   <th className="py-3 px-4">{t("other.labels.material_6")}</th>
@@ -1046,1 +1046,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                             title="تبديل تصريح المادة لهذا المشروع"
+                             title={t("other.labels.materialProject_3")}
@@ -1051,1 +1051,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                                 <span>مصرح بالمشروع</span>
+                                 <span>{t("other.labels.project_5")}</span>
@@ -1085,1 +1085,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               title="حذف المادة (فحص الرحلات والنزاهة)"
+                               title={t("other.labels.deleteMaterialTrips")}
@@ -1105,1 +1105,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">معرّف الشاحنة</th>
+                   <th className="py-3 px-4">{t("other.labels.truck")}</th>
@@ -1107,1 +1107,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">الناقل التابع له (Truck → Carrier)</th>
+                   <th className="py-3 px-4">{t("other.labels.carrier_7")}</th>
@@ -1108,1 +1108,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">أوزان الأمان (فارغ / إجمالي)</th>
+                   <th className="py-3 px-4">{t("other.labels.txt_3aa747")}</th>
@@ -1109,1 +1109,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">حالة الشاحنة</th>
+                   <th className="py-3 px-4">{t("other.labels.truck_2")}</th>
@@ -1137,1 +1137,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">ناقل معتمد</span>
+                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{t("other.labels.txt_36b6da")}</span>
@@ -1139,1 +1139,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">ناقل غير مصرح</span>
+                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">{t("other.labels.txt_66cfae")}</span>
@@ -1172,1 +1172,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               title="حذف الشاحنة (فحص الرحلات والنزاهة)"
+                               title={t("other.labels.deleteTruckTrips")}
@@ -1192,1 +1192,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">معرّف السائق</th>
+                   <th className="py-3 px-4">{t("other.labels.driver_2")}</th>
@@ -1194,1 +1194,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">الهوية / الإقامة</th>
+                   <th className="py-3 px-4">{t("other.labels.txt_618712")}</th>
@@ -1196,1 +1196,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">الناقل التابع له (Driver → Carrier)</th>
+                   <th className="py-3 px-4">{t("other.labels.carrier_8")}</th>
@@ -1197,1 +1197,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <th className="py-3 px-4">حالة السائق</th>
+                   <th className="py-3 px-4">{t("other.labels.driver_3")}</th>
@@ -1231,1 +1231,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">ناقل معتمد</span>
+                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{t("other.labels.txt_36b6da")}</span>
@@ -1233,1 +1233,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">ناقل غير مصرح</span>
+                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">{t("other.labels.txt_66cfae")}</span>
@@ -1262,1 +1262,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                               title="حذف السائق (فحص الرحلات والنزاهة)"
+                               title={t("other.labels.deleteDriverTrips")}
@@ -1283,1 +1283,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <span>نتائج الفحص الهندسي الصارم لوحدات Master Data (9 فئات اختبار)</span>
+                   <span>{t("other.labels.txt_47f763")}</span>
@@ -1286,1 +1286,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   التحقق البرمجي التلقائي من علاقات الكيانات، عزل المشاريع، حظر الحذف للسجلات المستخدمة، ودورة حياة ACTIVE/INACTIVE.
+                   {t("other.labels.delete_3")}</p>
@@ -1287,1 +1287,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </p>
+               </div>
@@ -1288,1 +1288,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+ 
@@ -1289,1 +1289,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+               <button
@@ -1290,1 +1290,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <button
+                 id="rerun-tests-btn"
@@ -1291,1 +1291,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 id="rerun-tests-btn"
+                 onClick={handleExecuteTests}
@@ -1292,1 +1292,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 onClick={handleExecuteTests}
+                 disabled={testingRunning}
@@ -1293,1 +1293,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 disabled={testingRunning}
+                 className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0"
@@ -1294,1 +1294,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0"
+               >
@@ -1295,1 +1295,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               >
+                 <RefreshCw className={`w-4 h-4 ${testingRunning ? 'animate-spin' : ''}`} />
@@ -1296,1 +1296,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <RefreshCw className={`w-4 h-4 ${testingRunning ? 'animate-spin' : ''}`} />
+                 <span>{testingRunning ? 'جارٍ التشغيل...' : 'إعادة تشغيل الاختبارات'}</span>
@@ -1297,1 +1297,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <span>{testingRunning ? 'جارٍ التشغيل...' : 'إعادة تشغيل الاختبارات'}</span>
+               </button>
@@ -1298,1 +1298,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </button>
+             </div>
@@ -1299,1 +1299,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </div>
+ 
@@ -1300,1 +1300,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+             {/* Test Summary Cards */}
@@ -1301,1 +1301,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {/* Test Summary Cards */}
+             {testResults && (
@@ -1302,1 +1302,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {testResults && (
+               <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
@@ -1303,1 +1303,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
+                 <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-center">
@@ -1304,1 +1304,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-center">
+                   <div className="text-xl font-black text-stone-900">{testResults.totalTests}</div>
@@ -1305,1 +1305,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-xl font-black text-stone-900">{testResults.totalTests}</div>
+                   <div className="text-[11px] font-semibold text-stone-500">إجمالي الفحوصات</div>
@@ -1306,1 +1306,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-[11px] font-semibold text-stone-500">إجمالي الفحوصات</div>
+                 </div>
@@ -1307,1 +1307,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
@@ -1308,1 +1308,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
+                   <div className="text-xl font-black text-emerald-700">{testResults.passedTests}</div>
@@ -1309,1 +1309,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-xl font-black text-emerald-700">{testResults.passedTests}</div>
+                   <div className="text-[11px] font-semibold text-emerald-800">{t("other.labels.txt_5c9a61")}</div>
@@ -1310,1 +1310,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-[11px] font-semibold text-emerald-800">فحوصات ناجحة (100%)</div>
+                 </div>
@@ -1311,1 +1311,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
@@ -1312,1 +1312,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
+                   <div className="text-xl font-black text-rose-700">{testResults.failedTests}</div>
@@ -1313,1 +1313,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-xl font-black text-rose-700">{testResults.failedTests}</div>
+                   <div className="text-[11px] font-semibold text-rose-800">{t("other.labels.txt_ebe0e2")}</div>
@@ -1314,1 +1314,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-[11px] font-semibold text-rose-800">إخفاقات</div>
+                 </div>
@@ -1315,1 +1315,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
@@ -1316,1 +1316,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
+                   <div className="text-xl font-black text-amber-700">{t("other.labels.enterprise")}</div>
@@ -1317,1 +1317,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-xl font-black text-amber-700">Enterprise</div>
+                   <div className="text-[11px] font-semibold text-amber-800">{t("other.labels.txt_394b13")}</div>
@@ -1318,1 +1318,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="text-[11px] font-semibold text-amber-800">حالة الاعتماد المعماري</div>
+                 </div>
@@ -1319,1 +1319,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+               </div>
@@ -1320,1 +1320,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+             )}
@@ -1321,1 +1321,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             )}
+ 
@@ -1322,1 +1322,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+             {/* Tests List */}
@@ -1323,1 +1323,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {/* Tests List */}
+             {testingRunning ? (
@@ -1324,1 +1324,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {testingRunning ? (
+               <div className="p-8 text-center text-xs text-stone-600 flex flex-col items-center justify-center gap-2">
@@ -1325,1 +1325,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <div className="p-8 text-center text-xs text-stone-600 flex flex-col items-center justify-center gap-2">
+                 <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
@@ -1326,1 +1326,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
+                 <span>{t("other.labels.txt_71317d")}</span>
@@ -1327,1 +1327,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <span>جارٍ تنفيذ السيناريوهات الاختبارية في الذاكرة ومستودع Firestore...</span>
+               </div>
@@ -1328,1 +1328,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+             ) : testResults ? (
@@ -1329,1 +1329,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             ) : testResults ? (
+               <div className="space-y-2.5">
@@ -1330,1 +1330,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <div className="space-y-2.5">
+                 {testResults.results.map((res, idx) => (
@@ -1331,1 +1331,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 {testResults.results.map((res, idx) => (
+                   <div
@@ -1332,1 +1332,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div
+                     key={res.id}
@@ -1333,1 +1333,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     key={res.id}
+                     className="p-3.5 bg-stone-50/70 border border-stone-200/80 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
@@ -1334,1 +1334,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="p-3.5 bg-stone-50/70 border border-stone-200/80 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
+                   >
@@ -1335,1 +1335,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+                     <div className="space-y-1">
@@ -1336,1 +1336,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="space-y-1">
+                       <div className="flex items-center gap-2">
@@ -1337,1 +1337,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <div className="flex items-center gap-2">
+                         <span className="font-mono font-bold text-stone-500">{res.id}</span>
@@ -1338,1 +1338,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span className="font-mono font-bold text-stone-500">{res.id}</span>
+                         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
@@ -1339,1 +1339,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
+                           {res.category}
@@ -1340,1 +1340,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           {res.category}
+                         </span>
@@ -1341,1 +1341,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         </span>
+                         <span className="font-bold text-stone-900">{res.titleAr}</span>
@@ -1342,1 +1342,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span className="font-bold text-stone-900">{res.titleAr}</span>
+                       </div>
@@ -1343,1 +1343,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       </div>
+                       <div className="text-[11px] text-stone-500 font-mono" dir="ltr">
@@ -1344,1 +1344,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <div className="text-[11px] text-stone-500 font-mono" dir="ltr">
+                         {res.titleEn}
@@ -1345,1 +1345,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         {res.titleEn}
+                       </div>
@@ -1346,1 +1346,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       </div>
+                       <p className="text-[11px] text-stone-600 pt-0.5">{res.details}</p>
@@ -1347,1 +1347,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <p className="text-[11px] text-stone-600 pt-0.5">{res.details}</p>
+                       <div className="text-[11px] text-stone-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
@@ -1348,1 +1348,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <div className="text-[11px] text-stone-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
+                         <span>
@@ -1349,1 +1349,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span>
+                           <strong className="text-stone-700">المتوقع:</strong> {String(res.expected)}
@@ -1350,1 +1350,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           <strong className="text-stone-700">المتوقع:</strong> {String(res.expected)}
+                         </span>
@@ -1351,1 +1351,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         </span>
+                         <span>
@@ -1352,1 +1352,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span>
+                           <strong className="text-stone-700">الفعلي:</strong> {String(res.actual)}
@@ -1353,1 +1353,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           <strong className="text-stone-700">الفعلي:</strong> {String(res.actual)}
+                         </span>
@@ -1354,1 +1354,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         </span>
+                       </div>
@@ -1355,1 +1355,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       </div>
+                     </div>
@@ -1356,1 +1356,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+ 
@@ -1357,1 +1357,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                     <div className="shrink-0 pt-1">
@@ -1358,1 +1358,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="shrink-0 pt-1">
+                       {res.passed ? (
@@ -1359,1 +1359,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       {res.passed ? (
+                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs font-black">
@@ -1360,1 +1360,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs font-black">
+                           <CheckCircle2 className="w-4 h-4 text-emerald-700" />
@@ -1361,1 +1361,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           <CheckCircle2 className="w-4 h-4 text-emerald-700" />
+                           <span>ناجح (PASSED)</span>
@@ -1362,1 +1362,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           <span>ناجح (PASSED)</span>
+                         </span>
@@ -1363,1 +1363,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         </span>
+                       ) : (
@@ -1364,1 +1364,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       ) : (
+                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-900 rounded-full text-xs font-black">
@@ -1365,1 +1365,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-900 rounded-full text-xs font-black">
+                           <AlertTriangle className="w-4 h-4 text-rose-700" />
@@ -1366,1 +1366,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           <AlertTriangle className="w-4 h-4 text-rose-700" />
+                           <span>{t("other.labels.txt_592f64")}</span>
@@ -1367,1 +1367,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                           <span>راسب (FAILED)</span>
+                         </span>
@@ -1368,1 +1368,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         </span>
+                       )}
@@ -1369,1 +1369,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       )}
+                     </div>
@@ -1370,1 +1370,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                   </div>
@@ -1371,1 +1371,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </div>
+                 ))}
@@ -1372,1 +1372,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 ))}
+               </div>
@@ -1373,1 +1373,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+             ) : (
@@ -1374,1 +1374,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             ) : (
+               <div className="p-8 text-center text-xs text-stone-500">
@@ -1375,1 +1375,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <div className="p-8 text-center text-xs text-stone-500">
+                 {t("other.labels.txt_674f3e")}</div>
@@ -1376,1 +1376,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 اضغط على زر «إعادة تشغيل الاختبارات» لتشغيل الحزمة فورياً.
+             )}
@@ -1377,1 +1377,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+           </div>
@@ -1378,1 +1378,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             )}
+         )}
@@ -1379,1 +1379,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           </div>
+       </div>
@@ -1380,1 +1380,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         )}
+ 
@@ -1381,1 +1381,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       </div>
+       {/* DELETION GUARD MODAL (Prohibits Hard Delete of used Master Data) */}
@@ -1382,1 +1382,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+       {deleteModal.isOpen && (
@@ -1383,1 +1383,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       {/* DELETION GUARD MODAL (Prohibits Hard Delete of used Master Data) */}
+         <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
@@ -1384,1 +1384,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       {deleteModal.isOpen && (
+           <div className="bg-white rounded-xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
@@ -1385,1 +1385,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
+             <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
@@ -1386,1 +1386,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           <div className="bg-white rounded-xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
+               <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
@@ -1387,1 +1387,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
+                 <ShieldAlert className="w-5 h-5 text-rose-600" />
@@ -1388,1 +1388,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
+                 <span>فحص النزاهة التاريخية وسياسة منع الحذف (Trip Usage Guard)</span>
@@ -1389,1 +1389,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <ShieldAlert className="w-5 h-5 text-rose-600" />
+               </div>
@@ -1390,1 +1390,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <span>فحص النزاهة التاريخية وسياسة منع الحذف (Trip Usage Guard)</span>
+               <button
@@ -1391,1 +1391,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+                 onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
@@ -1392,1 +1392,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <button
+                 className="text-stone-400 hover:text-stone-700 text-xs font-bold"
@@ -1393,1 +1393,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
+               >
@@ -1394,1 +1394,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 className="text-stone-400 hover:text-stone-700 text-xs font-bold"
+                 ✕
@@ -1395,1 +1395,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               >
+               </button>
@@ -1396,1 +1396,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 ✕
+             </div>
@@ -1397,1 +1397,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </button>
+ 
@@ -1398,1 +1398,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </div>
+             <div className="p-5 space-y-4">
@@ -1399,1 +1399,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+               <div className="text-xs text-stone-700">
@@ -1400,1 +1400,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <div className="p-5 space-y-4">
+                 أنت تحاول حذف السجل: <span className="font-bold text-stone-900">{deleteModal.entityTitle}</span> ({deleteModal.entityId})
@@ -1401,1 +1401,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <div className="text-xs text-stone-700">
+               </div>
@@ -1402,1 +1402,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 أنت تحاول حذف السجل: <span className="font-bold text-stone-900">{deleteModal.entityTitle}</span> ({deleteModal.entityId})
+ 
@@ -1403,1 +1403,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </div>
+               {deleteModal.checking ? (
@@ -1404,1 +1404,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                 <div className="p-4 text-center text-xs text-stone-600 flex items-center justify-center gap-2">
@@ -1405,1 +1405,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               {deleteModal.checking ? (
+                   <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
@@ -1406,1 +1406,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="p-4 text-center text-xs text-stone-600 flex items-center justify-center gap-2">
+                   <span>{t("other.labels.trips_4")}</span>
@@ -1407,1 +1407,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
+                 </div>
@@ -1408,1 +1408,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <span>جارٍ فحص الرحلات السابقة والعمليات المحاسبية المرتبطة بهذا السجل...</span>
+               ) : deleteModal.usageResult?.isUsed ? (
@@ -1409,1 +1409,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div className="space-y-3">
@@ -1410,1 +1410,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               ) : deleteModal.usageResult?.isUsed ? (
+                   <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-lg text-rose-900 text-xs space-y-2">
@@ -1411,1 +1411,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="space-y-3">
+                     <div className="font-bold flex items-center gap-1.5 text-rose-950">
@@ -1412,1 +1412,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-lg text-rose-900 text-xs space-y-2">
+                       <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
@@ -1413,1 +1413,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="font-bold flex items-center gap-1.5 text-rose-950">
+                       <span>{t("other.labels.delete_5")}</span>
@@ -1414,1 +1414,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
+                     </div>
@@ -1415,1 +1415,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <span>ممنوع الحذف الفعلي (Hard Delete) نهائياً!</span>
+                     <p>
@@ -1416,1 +1416,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                       {t("other.labels.txt_73dcb9")}<span className="font-bold">{deleteModal.usageResult.count} رحلة سابقة</span> {t("other.labels.txt_67f664")}</p>
@@ -1417,1 +1417,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <p>
+                     <div className="bg-white/80 p-2 rounded border border-rose-200 font-mono text-[11px] text-rose-800">
@@ -1418,1 +1418,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       هذا السجل مرتبط بـ <span className="font-bold">{deleteModal.usageResult.count} رحلة سابقة</span> مسجلة في النظام:
+                       أرقام الرحلات: {deleteModal.usageResult.tripNumbers.slice(0, 5).join('، ')}
@@ -1419,1 +1419,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </p>
+                       {deleteModal.usageResult.tripNumbers.length > 5 && ' ...'}
@@ -1420,1 +1420,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="bg-white/80 p-2 rounded border border-rose-200 font-mono text-[11px] text-rose-800">
+                     </div>
@@ -1421,1 +1421,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       أرقام الرحلات: {deleteModal.usageResult.tripNumbers.slice(0, 5).join('، ')}
+                     <p className="text-[11px] text-rose-800">
@@ -1422,1 +1422,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       {deleteModal.usageResult.tripNumbers.length > 5 && ' ...'}
+                       {t("other.labels.delete_6")}</p>
@@ -1423,1 +1423,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                   </div>
@@ -1424,1 +1424,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <p className="text-[11px] text-rose-800">
+ 
@@ -1425,1 +1425,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       وفقاً للقاعدة الصارمة لمنظومة النقل الثقيل (Q Saudi): «ممنوع حذف Master Data المستخدمة في رحلات سابقة، واستخدم ACTIVE/INACTIVE بدلاً من hard delete».
+                   <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
@@ -1426,1 +1426,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </p>
+                     <span className="font-bold">{t("other.labels.txt_4755d8")}</span>
@@ -1427,1 +1427,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </div>
+                     <p className="mt-1">
@@ -1428,1 +1428,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                       {t("other.labels.txt_63748e")}<span className="font-bold bg-amber-200 px-1 py-0.5 rounded">INACTIVE</span> لمنع إدراجه في أي رحلات جديدة، مع صون السجلات التاريخية للرحلات السابقة.
@@ -1429,1 +1429,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
+                     </p>
@@ -1430,1 +1430,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <span className="font-bold">الإجراء النظامي المتاح:</span>
+                   </div>
@@ -1431,1 +1431,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <p className="mt-1">
+                 </div>
@@ -1432,1 +1432,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       يمكنك تحويل حالة السجل إلى <span className="font-bold bg-amber-200 px-1 py-0.5 rounded">INACTIVE</span> لمنع إدراجه في أي رحلات جديدة، مع صون السجلات التاريخية للرحلات السابقة.
+               ) : (
@@ -1433,1 +1433,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </p>
+                 <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-2">
@@ -1434,1 +1434,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </div>
+                   <div className="font-bold flex items-center gap-1.5">
@@ -1435,1 +1435,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     <CheckCircle2 className="w-4 h-4 text-emerald-600" />
@@ -1436,1 +1436,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               ) : (
+                     <span>{t("other.labels.txt_f87929")}</span>
@@ -1437,1 +1437,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-2">
+                   </div>
@@ -1438,1 +1438,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div className="font-bold flex items-center gap-1.5">
+                   <p className="text-emerald-800">
@@ -1439,1 +1439,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <CheckCircle2 className="w-4 h-4 text-emerald-600" />
+                     {t("other.labels.txt_7bb941")}</p>
@@ -1440,1 +1440,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <span>لم يتم استخدام هذا السجل في أي رحلات سابقة</span>
+                 </div>
@@ -1441,1 +1441,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </div>
+               )}
@@ -1442,1 +1442,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <p className="text-emerald-800">
+ 
@@ -1443,1 +1443,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     مع ذلك، وتطبيقاً لقاعدة «استخدم ACTIVE/INACTIVE بدلاً من hard delete»، سيتم تعطيل السجل بتحويل حالته إلى (INACTIVE).
+               {deleteModal.error && (
@@ -1444,1 +1444,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </p>
+                 <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
@@ -1445,1 +1445,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   {deleteModal.error}
@@ -1446,1 +1446,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               )}
+                 </div>
@@ -1447,1 +1447,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+               )}
@@ -1448,1 +1448,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               {deleteModal.error && (
+ 
@@ -1449,1 +1449,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
+               {deleteModal.success && (
@@ -1450,1 +1450,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {deleteModal.error}
+                 <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
@@ -1451,1 +1451,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   {deleteModal.success}
@@ -1452,1 +1452,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               )}
+                 </div>
@@ -1453,1 +1453,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+               )}
@@ -1454,1 +1454,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               {deleteModal.success && (
+             </div>
@@ -1455,1 +1455,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
+ 
@@ -1456,1 +1456,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {deleteModal.success}
+             <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
@@ -1457,1 +1457,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+               <button
@@ -1458,1 +1458,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               )}
+                 onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
@@ -1459,1 +1459,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </div>
+                 className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
@@ -1460,1 +1460,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+               >
@@ -1461,1 +1461,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
+                 إلغاء
@@ -1462,1 +1462,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <button
+               </button>
@@ -1463,1 +1463,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
+               <button
@@ -1464,1 +1464,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
+                 onClick={handleConfirmSoftDelete}
@@ -1465,1 +1465,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               >
+                 disabled={deleteModal.checking || !!deleteModal.success}
@@ -1466,1 +1466,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 إلغاء
+                 className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
@@ -1467,1 +1467,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </button>
+               >
@@ -1468,1 +1468,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <button
+                 {t("other.labels.txt_34897c")}</button>
@@ -1469,1 +1469,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 onClick={handleConfirmSoftDelete}
+             </div>
@@ -1470,1 +1470,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 disabled={deleteModal.checking || !!deleteModal.success}
+           </div>
@@ -1471,1 +1471,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
+         </div>
@@ -1472,1 +1472,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               >
+       )}
@@ -1473,1 +1473,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 تعطيل السجل (تحويل إلى INACTIVE)
+ 
@@ -1474,1 +1474,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </button>
+       {/* CREATE ENTITY MODAL */}
@@ -1475,1 +1475,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </div>
+       {createModal.isOpen && (
@@ -1476,1 +1476,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           </div>
+         <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
@@ -1477,1 +1477,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         </div>
+           <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
@@ -1478,1 +1478,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       )}
+             <div className="p-4 bg-stone-900 text-amber-400 font-bold text-sm flex items-center justify-between">
@@ -1479,1 +1479,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+               <span>
@@ -1480,1 +1480,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       {/* CREATE ENTITY MODAL */}
+                 {createModal.entityType === 'CARRIER' && 'تسجيل ناقل جديد'}
@@ -1481,1 +1481,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       {createModal.isOpen && (
+                 {createModal.entityType === 'MATERIAL' && 'إضافة مادة جديدة'}
@@ -1482,1 +1482,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
+                 {createModal.entityType === 'TRUCK' && 'تسجيل شاحنة جديدة (Truck → Carrier)'}
@@ -1483,1 +1483,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
+                 {createModal.entityType === 'DRIVER' && 'تسجيل سائق جديد (Driver → Carrier)'}
@@ -1484,1 +1484,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             <div className="p-4 bg-stone-900 text-amber-400 font-bold text-sm flex items-center justify-between">
+               </span>
@@ -1485,1 +1485,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <span>
+               <button
@@ -1486,1 +1486,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'CARRIER' && 'تسجيل ناقل جديد'}
+                 onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
@@ -1487,1 +1487,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'MATERIAL' && 'إضافة مادة جديدة'}
+                 className="text-stone-400 hover:text-white text-xs font-bold"
@@ -1488,1 +1488,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'TRUCK' && 'تسجيل شاحنة جديدة (Truck → Carrier)'}
+               >
@@ -1489,1 +1489,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'DRIVER' && 'تسجيل سائق جديد (Driver → Carrier)'}
+                 ✕
@@ -1490,1 +1490,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </span>
+               </button>
@@ -1491,1 +1491,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <button
+             </div>
@@ -1492,1 +1492,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
+ 
@@ -1493,1 +1493,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 className="text-stone-400 hover:text-white text-xs font-bold"
+             {/* Carrier Form */}
@@ -1494,1 +1494,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               >
+             {createModal.entityType === 'CARRIER' && (
@@ -1495,1 +1495,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 ✕
+               <form onSubmit={handleCreateCarrier} className="p-5 space-y-3.5 text-xs">
@@ -1496,1 +1496,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </button>
+                 <div>
@@ -1497,1 +1497,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             </div>
+                   <label className="block font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
@@ -1498,1 +1498,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                   <input
@@ -1499,1 +1499,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {/* Carrier Form */}
+                     type="text"
@@ -1500,1 +1500,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'CARRIER' && (
+                     required
@@ -1501,1 +1501,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateCarrier} className="p-5 space-y-3.5 text-xs">
+                     placeholder="CAR-ALSAFA"
@@ -1502,1 +1502,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     value={newCarrier.carrierId}
@@ -1503,1 +1503,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
+                     onChange={e => setNewCarrier({ ...newCarrier, carrierId: e.target.value })}
@@ -1504,1 +1504,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1505,1 +1505,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                   />
@@ -1506,1 +1506,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                 </div>
@@ -1507,1 +1507,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="CAR-ALSAFA"
+                 <div>
@@ -1508,1 +1508,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newCarrier.carrierId}
+                   <label className="block font-bold text-stone-700 mb-1">اسم شركة النقل بالعربية:</label>
@@ -1509,1 +1509,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewCarrier({ ...newCarrier, carrierId: e.target.value })}
+                   <input
@@ -1510,1 +1510,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     type="text"
@@ -1511,1 +1511,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     required
@@ -1512,1 +1512,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     placeholder="شركة الصفا للنقل والتخليص"
@@ -1513,1 +1513,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     value={newCarrier.name}
@@ -1514,1 +1514,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم شركة النقل بالعربية:</label>
+                     onChange={e => setNewCarrier({ ...newCarrier, name: e.target.value })}
@@ -1515,1 +1515,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1516,1 +1516,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                   />
@@ -1517,1 +1517,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                   {newCarrier.name && (
@@ -1518,1 +1518,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="شركة الصفا للنقل والتخليص"
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1519,1 +1519,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newCarrier.name}
+                       الاسم المطبّع (normalizedName): {normalizeName(newCarrier.name)}
@@ -1520,1 +1520,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewCarrier({ ...newCarrier, name: e.target.value })}
+                     </div>
@@ -1521,1 +1521,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                   )}
@@ -1522,1 +1522,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                 </div>
@@ -1523,1 +1523,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {newCarrier.name && (
+                 <div>
@@ -1524,1 +1524,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_68f9e8")}</label>
@@ -1525,1 +1525,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       الاسم المطبّع (normalizedName): {normalizeName(newCarrier.name)}
+                   <input
@@ -1526,1 +1526,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                     type="text"
@@ -1527,1 +1527,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   )}
+                     required
@@ -1528,1 +1528,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     pattern="[0-9]{10}"
@@ -1529,1 +1529,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     value={newCarrier.crNo}
@@ -1530,1 +1530,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">السجل التجاري (10 أرقام):</label>
+                     onChange={e => setNewCarrier({ ...newCarrier, crNo: e.target.value })}
@@ -1531,1 +1531,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1532,1 +1532,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                   />
@@ -1533,1 +1533,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                 </div>
@@ -1534,1 +1534,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     pattern="[0-9]{10}"
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1535,1 +1535,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newCarrier.crNo}
+                   <button
@@ -1536,1 +1536,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewCarrier({ ...newCarrier, crNo: e.target.value })}
+                     type="button"
@@ -1537,1 +1537,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
@@ -1538,1 +1538,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1539,1 +1539,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   >
@@ -1540,1 +1540,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                     إلغاء
@@ -1541,1 +1541,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+                   </button>
@@ -1542,1 +1542,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="button"
+                   <button
@@ -1543,1 +1543,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
+                     type="submit"
@@ -1544,1 +1544,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1546,1 +1546,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     إلغاء
+                     {t("other.labels.saveCarrier")}</button>
@@ -1547,1 +1547,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+                 </div>
@@ -1548,1 +1548,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+               </form>
@@ -1549,1 +1549,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="submit"
+             )}
@@ -1550,1 +1550,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+ 
@@ -1551,1 +1551,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+             {/* Material Form */}
@@ -1552,1 +1552,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     حفظ وتطبيع الناقل
+             {createModal.entityType === 'MATERIAL' && (
@@ -1553,1 +1553,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+               <form onSubmit={handleCreateMaterial} className="p-5 space-y-3.5 text-xs">
@@ -1554,1 +1554,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div>
@@ -1555,1 +1555,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </form>
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.material_9")}</label>
@@ -1556,1 +1556,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             )}
+                   <input
@@ -1557,1 +1557,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                     type="text"
@@ -1558,1 +1558,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {/* Material Form */}
+                     required
@@ -1559,1 +1559,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'MATERIAL' && (
+                     placeholder="MAT-GRAVEL-01"
@@ -1560,1 +1560,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateMaterial} className="p-5 space-y-3.5 text-xs">
+                     value={newMaterial.materialId}
@@ -1561,1 +1561,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     onChange={e => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
@@ -1562,1 +1562,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">معرّف المادة (Material ID):</label>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1563,1 +1563,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                   />
@@ -1564,1 +1564,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                 </div>
@@ -1565,1 +1565,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                 <div>
@@ -1566,1 +1566,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="MAT-GRAVEL-01"
+                   <label className="block font-bold text-stone-700 mb-1">رمز المادة (Code):</label>
@@ -1567,1 +1567,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.materialId}
+                   <input
@@ -1568,1 +1568,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
+                     type="text"
@@ -1569,1 +1569,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     required
@@ -1570,1 +1570,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     placeholder="GRV-01"
@@ -1571,1 +1571,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     value={newMaterial.code}
@@ -1572,1 +1572,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     onChange={e => setNewMaterial({ ...newMaterial, code: e.target.value })}
@@ -1573,1 +1573,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رمز المادة (Code):</label>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1574,1 +1574,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                   />
@@ -1575,1 +1575,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                 </div>
@@ -1576,1 +1576,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                 <div>
@@ -1577,1 +1577,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="GRV-01"
+                   <label className="block font-bold text-stone-700 mb-1">اسم المادة بالعربية:</label>
@@ -1578,1 +1578,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.code}
+                   <input
@@ -1579,1 +1579,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, code: e.target.value })}
+                     type="text"
@@ -1580,1 +1580,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     required
@@ -1581,1 +1581,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     placeholder="حصى وادي طبيعي مقاس 2 بوصة"
@@ -1582,1 +1582,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     value={newMaterial.name}
@@ -1583,1 +1583,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
@@ -1584,1 +1584,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم المادة بالعربية:</label>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1585,1 +1585,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                   />
@@ -1586,1 +1586,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                   {newMaterial.name && (
@@ -1587,1 +1587,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1588,1 +1588,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="حصى وادي طبيعي مقاس 2 بوصة"
+                       الاسم المطبّع: {normalizeName(newMaterial.name)}
@@ -1589,1 +1589,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.name}
+                     </div>
@@ -1590,1 +1590,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
+                   )}
@@ -1591,1 +1591,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                 </div>
@@ -1592,1 +1592,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                 <div>
@@ -1593,1 +1593,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {newMaterial.name && (
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_109c7a")}</label>
@@ -1594,1 +1594,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                   <select
@@ -1595,1 +1595,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       الاسم المطبّع: {normalizeName(newMaterial.name)}
+                     value={newMaterial.uom}
@@ -1596,1 +1596,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                     onChange={e => setNewMaterial({ ...newMaterial, uom: e.target.value as any })}
@@ -1597,1 +1597,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   )}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1598,1 +1598,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   >
@@ -1599,1 +1599,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     <option value="TON">طن (TON)</option>
@@ -1600,1 +1600,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">وحدة القياس الأساسية:</label>
+                     <option value="M3">متر مكعب (M3)</option>
@@ -1601,1 +1601,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <select
+                     <option value="TRIP">{t("other.labels.txt_3fb9ae")}</option>
@@ -1602,1 +1602,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.uom}
+                   </select>
@@ -1603,1 +1603,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, uom: e.target.value as any })}
+                 </div>
@@ -1604,1 +1604,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1605,1 +1605,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+                   <button
@@ -1606,1 +1606,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <option value="TON">طن (TON)</option>
+                     type="button"
@@ -1607,1 +1607,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <option value="M3">متر مكعب (M3)</option>
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'MATERIAL' })}
@@ -1608,1 +1608,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <option value="TRIP">بالرد (TRIP)</option>
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1609,1 +1609,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </select>
+                   >
@@ -1610,1 +1610,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     إلغاء
@@ -1611,1 +1611,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                   </button>
@@ -1613,1 +1613,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="button"
+                     type="submit"
@@ -1614,1 +1614,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'MATERIAL' })}
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1615,1 +1615,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                   >
@@ -1616,1 +1616,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+                     {t("other.labels.saveMaterial")}</button>
@@ -1617,1 +1617,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     إلغاء
+                 </div>
@@ -1618,1 +1618,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+               </form>
@@ -1619,1 +1619,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+             )}
@@ -1620,1 +1620,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="submit"
+ 
@@ -1621,1 +1621,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+             {/* Truck Form (Truck -> Carrier) */}
@@ -1622,1 +1622,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+             {createModal.entityType === 'TRUCK' && (
@@ -1623,1 +1623,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     حفظ وتطبيع المادة
+               <form onSubmit={handleCreateTruck} className="p-5 space-y-3.5 text-xs">
@@ -1624,1 +1624,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+                 <div>
@@ -1625,1 +1625,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Truck → Carrier):</label>
@@ -1626,1 +1626,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </form>
+                   <select
@@ -1627,1 +1627,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             )}
+                     required
@@ -1628,1 +1628,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                     value={newTruck.carrierId}
@@ -1629,1 +1629,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {/* Truck Form (Truck -> Carrier) */}
+                     onChange={e => setNewTruck({ ...newTruck, carrierId: e.target.value })}
@@ -1630,1 +1630,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'TRUCK' && (
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
@@ -1631,1 +1631,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateTruck} className="p-5 space-y-3.5 text-xs">
+                   >
@@ -1632,1 +1632,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     <option value="">{t("other.labels.carrier_10")}</option>
@@ -1633,1 +1633,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Truck → Carrier):</label>
+                     {overview?.allCarriers.map(c => (
@@ -1634,1 +1634,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <select
+                       <option key={c.carrierId} value={c.carrierId}>
@@ -1635,1 +1635,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                         {c.name || c.companyNameAr} ({c.carrierId})
@@ -1636,1 +1636,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newTruck.carrierId}
+                       </option>
@@ -1637,1 +1637,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewTruck({ ...newTruck, carrierId: e.target.value })}
+                     ))}
@@ -1638,1 +1638,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
+                   </select>
@@ -1639,1 +1639,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+                 </div>
@@ -1640,1 +1640,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <option value="">-- اختر الناقل المعتمد --</option>
+                 <div>
@@ -1641,1 +1641,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     {overview?.allCarriers.map(c => (
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.truck_5")}</label>
@@ -1642,1 +1642,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <option key={c.carrierId} value={c.carrierId}>
+                   <input
@@ -1643,1 +1643,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         {c.name || c.companyNameAr} ({c.carrierId})
+                     type="text"
@@ -1644,1 +1644,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       </option>
+                     required
@@ -1645,1 +1645,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     ))}
+                     placeholder="TRK-4421"
@@ -1646,1 +1646,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </select>
+                     value={newTruck.truckId}
@@ -1647,1 +1647,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     onChange={e => setNewTruck({ ...newTruck, truckId: e.target.value })}
@@ -1648,1 +1648,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1649,1 +1649,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">معرّف الشاحنة (Truck ID):</label>
+                   />
@@ -1650,1 +1650,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                 </div>
@@ -1651,1 +1651,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                 <div>
@@ -1652,1 +1652,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                   <label className="block font-bold text-stone-700 mb-1">رقم اللوحة السعودية (مثال: أ ب ج 1234):</label>
@@ -1653,1 +1653,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="TRK-4421"
+                   <input
@@ -1654,1 +1654,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newTruck.truckId}
+                     type="text"
@@ -1655,1 +1655,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewTruck({ ...newTruck, truckId: e.target.value })}
+                     required
@@ -1656,1 +1656,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     placeholder="ط ك ل 4421"
@@ -1657,1 +1657,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     value={newTruck.plate}
@@ -1658,1 +1658,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     onChange={e => setNewTruck({ ...newTruck, plate: e.target.value })}
@@ -1659,1 +1659,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1660,1 +1660,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رقم اللوحة السعودية (مثال: أ ب ج 1234):</label>
+                   />
@@ -1661,1 +1661,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                   {newTruck.plate && (
@@ -1662,1 +1662,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1663,1 +1663,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                       اللوحة المطبّعة (normalizedPlate): {normalizePlate(newTruck.plate)}
@@ -1664,1 +1664,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="ط ك ل 4421"
+                     </div>
@@ -1665,1 +1665,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newTruck.plate}
+                   )}
@@ -1666,1 +1666,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewTruck({ ...newTruck, plate: e.target.value })}
+                 </div>
@@ -1667,1 +1667,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                 <div className="grid grid-cols-2 gap-2">
@@ -1668,1 +1668,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                   <div>
@@ -1669,1 +1669,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {newTruck.plate && (
+                     <label className="block font-bold text-stone-700 mb-1">الوزن الفارغ (كجم):</label>
@@ -1670,1 +1670,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                     <input
@@ -1671,1 +1671,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       اللوحة المطبّعة (normalizedPlate): {normalizePlate(newTruck.plate)}
+                       type="number"
@@ -1672,1 +1672,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                       required
@@ -1673,1 +1673,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   )}
+                       value={newTruck.tareKg}
@@ -1674,1 +1674,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                       onChange={e => setNewTruck({ ...newTruck, tareKg: Number(e.target.value) })}
@@ -1675,1 +1675,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="grid grid-cols-2 gap-2">
+                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1676,1 +1676,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div>
+                     />
@@ -1677,1 +1677,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <label className="block font-bold text-stone-700 mb-1">الوزن الفارغ (كجم):</label>
+                   </div>
@@ -1678,1 +1678,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <input
+                   <div>
@@ -1679,1 +1679,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       type="number"
+                     <label className="block font-bold text-stone-700 mb-1">الوزن الإجمالي (كجم):</label>
@@ -1680,1 +1680,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       required
+                     <input
@@ -1681,1 +1681,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       value={newTruck.tareKg}
+                       type="number"
@@ -1682,1 +1682,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       onChange={e => setNewTruck({ ...newTruck, tareKg: Number(e.target.value) })}
+                       required
@@ -1683,1 +1683,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                       value={newTruck.grossKg}
@@ -1684,1 +1684,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     />
+                       onChange={e => setNewTruck({ ...newTruck, grossKg: Number(e.target.value) })}
@@ -1685,1 +1685,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </div>
+                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1686,1 +1686,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <div>
+                     />
@@ -1687,1 +1687,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <label className="block font-bold text-stone-700 mb-1">الوزن الإجمالي (كجم):</label>
+                   </div>
@@ -1688,1 +1688,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <input
+                 </div>
@@ -1689,1 +1689,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       type="number"
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1690,1 +1690,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       required
+                   <button
@@ -1691,1 +1691,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       value={newTruck.grossKg}
+                     type="button"
@@ -1692,1 +1692,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       onChange={e => setNewTruck({ ...newTruck, grossKg: Number(e.target.value) })}
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'TRUCK' })}
@@ -1693,1 +1693,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1694,1 +1694,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     />
+                   >
@@ -1695,1 +1695,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </div>
+                     إلغاء
@@ -1696,1 +1696,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   </button>
@@ -1697,1 +1697,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                   <button
@@ -1698,1 +1698,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+                     type="submit"
@@ -1699,1 +1699,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="button"
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1700,1 +1700,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'TRUCK' })}
+                   >
@@ -1701,1 +1701,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                     {t("other.labels.saveTruck")}</button>
@@ -1702,1 +1702,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+                 </div>
@@ -1703,1 +1703,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     إلغاء
+               </form>
@@ -1704,1 +1704,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+             )}
@@ -1705,1 +1705,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+ 
@@ -1706,1 +1706,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="submit"
+             {/* Driver Form (Driver -> Carrier) */}
@@ -1707,1 +1707,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+             {createModal.entityType === 'DRIVER' && (
@@ -1708,1 +1708,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+               <form onSubmit={handleCreateDriver} className="p-5 space-y-3.5 text-xs">
@@ -1709,1 +1709,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     حفظ وتطبيع الشاحنة
+                 <div>
@@ -1710,1 +1710,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Driver → Carrier):</label>
@@ -1711,1 +1711,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <select
@@ -1712,1 +1712,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </form>
+                     required
@@ -1713,1 +1713,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             )}
+                     value={newDriver.carrierId}
@@ -1714,1 +1714,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- 
+                     onChange={e => setNewDriver({ ...newDriver, carrierId: e.target.value })}
@@ -1715,1 +1715,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {/* Driver Form (Driver -> Carrier) */}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
@@ -1716,1 +1716,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'DRIVER' && (
+                   >
@@ -1717,1 +1717,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateDriver} className="p-5 space-y-3.5 text-xs">
+                     <option value="">{t("other.labels.carrier_10")}</option>
@@ -1718,1 +1718,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     {overview?.allCarriers.map(c => (
@@ -1719,1 +1719,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Driver → Carrier):</label>
+                       <option key={c.carrierId} value={c.carrierId}>
@@ -1720,1 +1720,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <select
+                         {c.name || c.companyNameAr} ({c.carrierId})
@@ -1721,1 +1721,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                       </option>
@@ -1722,1 +1722,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newDriver.carrierId}
+                     ))}
@@ -1723,1 +1723,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, carrierId: e.target.value })}
+                   </select>
@@ -1724,1 +1724,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
+                 </div>
@@ -1725,1 +1725,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+                 <div>
@@ -1726,1 +1726,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <option value="">-- اختر الناقل المعتمد --</option>
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.driver_6")}</label>
@@ -1727,1 +1727,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     {overview?.allCarriers.map(c => (
+                   <input
@@ -1728,1 +1728,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       <option key={c.carrierId} value={c.carrierId}>
+                     type="text"
@@ -1729,1 +1729,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                         {c.name || c.companyNameAr} ({c.carrierId})
+                     required
@@ -1730,1 +1730,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       </option>
+                     placeholder="DRV-303"
@@ -1731,1 +1731,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     ))}
+                     value={newDriver.driverId}
@@ -1732,1 +1732,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </select>
+                     onChange={e => setNewDriver({ ...newDriver, driverId: e.target.value })}
@@ -1733,1 +1733,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1734,1 +1734,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                   />
@@ -1735,1 +1735,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">معرّف السائق (Driver ID):</label>
+                 </div>
@@ -1736,1 +1736,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                 <div>
@@ -1737,1 +1737,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                   <label className="block font-bold text-stone-700 mb-1">اسم السائق الثلاثي بالعربية:</label>
@@ -1738,1 +1738,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                   <input
@@ -1739,1 +1739,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="DRV-303"
+                     type="text"
@@ -1740,1 +1740,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newDriver.driverId}
+                     required
@@ -1741,1 +1741,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, driverId: e.target.value })}
+                     placeholder="سلطان عبد الرحمن الدوسري"
@@ -1742,1 +1742,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     value={newDriver.name}
@@ -1743,1 +1743,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
@@ -1744,1 +1744,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1745,1 +1745,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                   />
@@ -1746,1 +1746,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم السائق الثلاثي بالعربية:</label>
+                   {newDriver.name && (
@@ -1747,1 +1747,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1748,1 +1748,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                       الاسم المطبّع (normalizedName): {normalizeName(newDriver.name)}
@@ -1749,1 +1749,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                     </div>
@@ -1750,1 +1750,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="سلطان عبد الرحمن الدوسري"
+                   )}
@@ -1751,1 +1751,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newDriver.name}
+                 </div>
@@ -1752,1 +1752,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
+                 <div>
@@ -1753,1 +1753,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                   <label className="block font-bold text-stone-700 mb-1">رقم الهوية الوطنية أو الإقامة (10 أرقام):</label>
@@ -1754,1 +1754,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                   <input
@@ -1755,1 +1755,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {newDriver.name && (
+                     type="text"
@@ -1756,1 +1756,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                     required
@@ -1757,1 +1757,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       الاسم المطبّع (normalizedName): {normalizeName(newDriver.name)}
+                     pattern="[1-2][0-9]{9}"
@@ -1758,1 +1758,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                     placeholder="1076543210"
@@ -1759,1 +1759,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   )}
+                     value={newDriver.idNumber}
@@ -1760,1 +1760,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     onChange={e => setNewDriver({ ...newDriver, idNumber: e.target.value })}
@@ -1761,1 +1761,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1762,1 +1762,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رقم الهوية الوطنية أو الإقامة (10 أرقام):</label>
+                   />
@@ -1763,1 +1763,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                 </div>
@@ -1764,1 +1764,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                 <div>
@@ -1765,1 +1765,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                   <label className="block font-bold text-stone-700 mb-1">رقم الجوال السعودي (05xxxxxxxx):</label>
@@ -1766,1 +1766,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     pattern="[1-2][0-9]{9}"
+                   <input
@@ -1767,1 +1767,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="1076543210"
+                     type="text"
@@ -1768,1 +1768,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newDriver.idNumber}
+                     required
@@ -1769,1 +1769,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, idNumber: e.target.value })}
+                     placeholder="0559876543"
@@ -1770,1 +1770,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                     value={newDriver.phone}
@@ -1771,1 +1771,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
@@ -1772,1 +1772,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1773,1 +1773,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div>
+                   />
@@ -1774,1 +1774,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رقم الجوال السعودي (05xxxxxxxx):</label>
+                   {newDriver.phone && (
@@ -1775,1 +1775,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <input
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1776,1 +1776,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="text"
+                       الجوال المطبّع: {normalizePhone(newDriver.phone)}
@@ -1777,1 +1777,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     required
+                     </div>
@@ -1778,1 +1778,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     placeholder="0559876543"
+                   )}
@@ -1779,1 +1779,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     value={newDriver.phone}
+                 </div>
@@ -1780,1 +1780,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1781,1 +1781,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                   <button
@@ -1782,1 +1782,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   />
+                     type="button"
@@ -1783,1 +1783,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   {newDriver.phone && (
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'DRIVER' })}
@@ -1784,1 +1784,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1785,1 +1785,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                       الجوال المطبّع: {normalizePhone(newDriver.phone)}
+                   >
@@ -1786,1 +1786,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     </div>
+                     إلغاء
@@ -1787,1 +1787,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   )}
+                   </button>
@@ -1788,1 +1788,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <button
@@ -1789,1 +1789,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                     type="submit"
@@ -1790,1 +1790,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1791,1 +1791,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="button"
+                   >
@@ -1792,1 +1792,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'DRIVER' })}
+                     {t("other.labels.saveDriver")}</button>
@@ -1793,1 +1793,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                 </div>
@@ -1794,1 +1794,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+               </form>
@@ -1795,1 +1795,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     إلغاء
+             )}
@@ -1796,1 +1796,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+           </div>
@@ -1797,1 +1797,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   <button
+         </div>
@@ -1798,1 +1798,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     type="submit"
+       )}
@@ -1799,1 +1799,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+     </div>
@@ -1800,1 +1800,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   >
+   );
@@ -1801,1 +1801,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                     حفظ وتطبيع السائق
+ };
@@ -1802,1 +1802,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                   </button>
+ 
@@ -1803,1 +1803,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-                 </div>
+ 
@@ -1804,1 +1804,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-               </form>
+ 
@@ -1805,1 +1805,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-             )}
+ 
@@ -1806,1 +1806,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-           </div>
+ 
@@ -1807,1 +1807,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-         </div>
+ 
@@ -1808,1 +1808,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-       )}
+ 
@@ -1809,1 +1809,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-     </div>
+ 
@@ -1810,1 +1810,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
-   );
+ 
@@ -1811,1 +1811,1 @@ /app/applet/src/components/masterData/MasterDataView.tsx
- };
+ 
```

## File: `/app/applet/src/components/wizard/Step6GoogleDrive.tsx`

- **Pre-Migration Hash:** `499067d70b1de1cf`
- **Post-Migration Hash:** `c5c0a7e26b543d84`
- **Transformations Applied:** 17
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted (17):**
  - `other.status.success_3`
  - `other.labels.txt_24c076`
  - `other.labels.trips_7`
  - `other.labels.materials_7`
  - `other.labels.txt_4a65bf`
  - `other.labels.trips_6`
  - `other.labels.txt_13cd13`
  - `other.labels.txt_330dcc`
  - `other.labels.txt_24cc60`
  - `other.labels.txt_5860fa`
  - `other.labels.txt_1a0a87`
  - `other.labels.txt_14af6c`
  - `other.labels.createProject`
  - `other.labels.txt_558322`
  - `other.labels.txt_f8afcf`
  - `other.labels.txt_412551`
  - `other.labels.txt_1118c2`

### Unified Diff / Patch

```diff
@@ -15,1 +15,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -16,1 +16,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- interface Step6Props {
+ 
@@ -17,1 +17,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   data: WizardGoogleDriveProvisioning;
+ 
@@ -18,1 +18,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   projectCode: string;
+ interface Step6Props {
@@ -19,1 +19,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   projectName: string;
+   data: WizardGoogleDriveProvisioning;
@@ -20,1 +20,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   onChange: (updated: WizardGoogleDriveProvisioning) => void;
+   projectCode: string;
@@ -21,1 +21,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   errors?: string[];
+   projectName: string;
@@ -22,1 +22,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- }
+   onChange: (updated: WizardGoogleDriveProvisioning) => void;
@@ -23,1 +23,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+   errors?: string[];
@@ -24,1 +24,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- export const Step6GoogleDrive: React.FC<Step6Props> = ({
+ }
@@ -25,1 +25,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   data,
+ 
@@ -26,1 +26,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   projectCode,
+ export const Step6GoogleDrive: React.FC<Step6Props> = ({
@@ -27,1 +27,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   projectName,
+   data,
@@ -28,1 +28,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   onChange,
+   projectCode,
@@ -29,1 +29,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   errors = [],
+   projectName,
@@ -30,1 +30,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- }) => {
+   onChange,
@@ -31,1 +31,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   const [testingConnection, setTestingConnection] = useState(false);
+   errors = [],
@@ -32,1 +32,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   const [connectionTested, setConnectionTested] = useState(false);
+ }) => {
@@ -33,1 +33,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+   const { t } = useI18n();
@@ -34,1 +34,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   const update = <K extends keyof WizardGoogleDriveProvisioning>(
+   const [testingConnection, setTestingConnection] = useState(false);
@@ -35,1 +35,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     field: K,
+   const [connectionTested, setConnectionTested] = useState(false);
@@ -36,1 +36,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     value: WizardGoogleDriveProvisioning[K]
+ 
@@ -37,1 +37,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   ) => {
+   const update = <K extends keyof WizardGoogleDriveProvisioning>(
@@ -38,1 +38,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     onChange({
+     field: K,
@@ -39,1 +39,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       ...data,
+     value: WizardGoogleDriveProvisioning[K]
@@ -40,1 +40,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       [field]: value,
+   ) => {
@@ -41,1 +41,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     });
+     onChange({
@@ -42,1 +42,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   };
+       ...data,
@@ -43,1 +43,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+       [field]: value,
@@ -44,1 +44,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   const handleTestConnection = () => {
+     });
@@ -45,1 +45,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     setTestingConnection(true);
+   };
@@ -46,1 +46,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     setTimeout(() => {
+ 
@@ -47,1 +47,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       setTestingConnection(false);
+   const handleTestConnection = () => {
@@ -48,1 +48,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       setConnectionTested(true);
+     setTestingConnection(true);
@@ -49,1 +49,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     }, 1000);
+     setTimeout(() => {
@@ -50,1 +50,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   };
+       setTestingConnection(false);
@@ -51,1 +51,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+       setConnectionTested(true);
@@ -52,1 +52,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   const resetToProjectDefaults = () => {
+     }, 1000);
@@ -53,1 +53,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     const code = projectCode.trim().toUpperCase() || 'PRJ-NEOM-01';
+   };
@@ -54,1 +54,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     onChange({
+ 
@@ -55,1 +55,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       ...data,
+   const resetToProjectDefaults = () => {
@@ -56,1 +56,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       enabled: true,
+     const code = projectCode.trim().toUpperCase() || 'PRJ-NEOM-01';
@@ -57,1 +57,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       rootFolderName: `${code} - أرشيف ومستندات المشروع اللوجستية`,
+     onChange({
@@ -58,1 +58,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       spreadsheetTitle: `سجل رحلات وموازين ${code} - ${projectName || '2026'}`,
+       ...data,
@@ -59,1 +59,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       generatedFolderId: `gdrive-${code.toLowerCase()}-${Date.now().toString(36)}`,
+       enabled: true,
@@ -60,1 +60,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       generatedSpreadsheetId: `gsheet-${code.toLowerCase()}-${Date.now().toString(36)}`,
+       rootFolderName: `${code} - أرشيف ومستندات المشروع اللوجستية`,
@@ -61,1 +61,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     });
+       spreadsheetTitle: `سجل رحلات وموازين ${code} - ${projectName || '2026'}`,
@@ -62,1 +62,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   };
+       generatedFolderId: `gdrive-${code.toLowerCase()}-${Date.now().toString(36)}`,
@@ -63,1 +63,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+       generatedSpreadsheetId: `gsheet-${code.toLowerCase()}-${Date.now().toString(36)}`,
@@ -64,1 +64,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   return (
+     });
@@ -65,1 +65,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     <div className="space-y-6">
+   };
@@ -66,1 +66,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       {/* Step Header */}
+ 
@@ -67,1 +67,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
+   return (
@@ -68,1 +68,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         <div>
+     <div className="space-y-6">
@@ -69,1 +69,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
+       {/* Step Header */}
@@ -70,1 +70,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             <FolderSync className="w-5 h-5 text-amber-600" />
+       <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
@@ -71,1 +71,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             الخطوة 6: تهيئة مساحة العمل السحابية (Google Drive & Sheets Provisioning)
+         <div>
@@ -72,1 +72,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           </h2>
+           <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
@@ -73,1 +73,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <p className="text-xs text-stone-500 mt-1">
+             <FolderSync className="w-5 h-5 text-amber-600" />
@@ -74,1 +74,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             أتمتة إنشاء مجلدات الأرشفة الرقمية في Google Drive وجداول المطابقات والموازين في Google Sheets.
+             {t("other.labels.txt_1118c2")}</h2>
@@ -75,1 +75,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           </p>
+           <p className="text-xs text-stone-500 mt-1">
@@ -76,1 +76,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         </div>
+             أتمتة إنشاء مجلدات الأرشفة الرقمية في Google Drive وجداول المطابقات والموازين في Google Sheets.
@@ -77,1 +77,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+           </p>
@@ -78,1 +78,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         <button
+         </div>
@@ -79,1 +79,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           type="button"
+ 
@@ -80,1 +80,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           onClick={resetToProjectDefaults}
+         <button
@@ -81,1 +81,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
+           type="button"
@@ -82,1 +82,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         >
+           onClick={resetToProjectDefaults}
@@ -83,1 +83,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <Sparkles className="w-3.5 h-3.5 text-amber-600" />
+           className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
@@ -84,1 +84,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <span>توليد التسميات الآلية للمشروع</span>
+         >
@@ -85,1 +85,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         </button>
+           <Sparkles className="w-3.5 h-3.5 text-amber-600" />
@@ -86,1 +86,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       </div>
+           <span>{t("other.labels.txt_412551")}</span>
@@ -87,1 +87,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+         </button>
@@ -88,1 +88,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       {errors.length > 0 && (
+       </div>
@@ -89,1 +89,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
+ 
@@ -90,1 +90,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <p className="font-semibold">تنبيهات تهيئة Google Workspace:</p>
+       {errors.length > 0 && (
@@ -91,1 +91,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <ul className="list-disc list-inside space-y-0.5">
+         <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
@@ -92,1 +92,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             {errors.map((err, idx) => (
+           <p className="font-semibold">{t("other.labels.txt_f8afcf")}</p>
@@ -93,1 +93,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <li key={idx}>{err}</li>
+           <ul className="list-disc list-inside space-y-0.5">
@@ -94,1 +94,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             ))}
+             {errors.map((err, idx) => (
@@ -95,1 +95,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           </ul>
+               <li key={idx}>{err}</li>
@@ -96,1 +96,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         </div>
+             ))}
@@ -97,1 +97,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       )}
+           </ul>
@@ -98,1 +98,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+         </div>
@@ -99,1 +99,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       {/* Main Enable Card */}
+       )}
@@ -100,1 +100,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
+ 
@@ -101,1 +101,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         <div className="flex items-center justify-between">
+       {/* Main Enable Card */}
@@ -102,1 +102,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           <div className="flex items-center gap-3">
+       <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
@@ -103,1 +103,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
+         <div className="flex items-center justify-between">
@@ -104,1 +104,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <FolderPlus className="w-6 h-6" />
+           <div className="flex items-center gap-3">
@@ -105,1 +105,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             </div>
+             <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
@@ -106,1 +106,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             <div>
+               <FolderPlus className="w-6 h-6" />
@@ -107,1 +107,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <h3 className="text-sm font-bold text-stone-900">
+             </div>
@@ -108,1 +108,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 تفعيل التهيئة الآلية لمساحة عمل Google Drive و Sheets
+             <div>
@@ -109,1 +109,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </h3>
+               <h3 className="text-sm font-bold text-stone-900">
@@ -110,1 +110,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <p className="text-xs text-stone-500 mt-0.5">
+                 {t("other.labels.txt_558322")}</h3>
@@ -111,1 +111,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 إنشاء المجلدات السحابية وتوزيع الجداول تلقائياً فور اعتماد المشروع في Firestore.
+               <p className="text-xs text-stone-500 mt-0.5">
@@ -112,1 +112,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </p>
+                 {t("other.labels.createProject")}</p>
@@ -144,1 +144,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   المجلد الحاوي لكافة تذاكر الميزان، إشعارات التوريد وسجلات الشاحنات.
+                   {t("other.labels.txt_14af6c")}</p>
@@ -145,1 +145,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </p>
+               </div>
@@ -146,1 +146,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </div>
+ 
@@ -147,1 +147,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+               <div>
@@ -148,1 +148,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <div>
+                 <label className="block font-bold text-stone-700 mb-1">
@@ -149,1 +149,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <label className="block font-bold text-stone-700 mb-1">
+                   {t("other.labels.txt_1a0a87")}</label>
@@ -150,1 +150,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   عنوان جدول العمليات Google Sheets (spreadsheetTitle)
+                 <input
@@ -151,1 +151,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </label>
+                   type="text"
@@ -152,1 +152,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <input
+                   value={data.spreadsheetTitle}
@@ -153,1 +153,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   type="text"
+                   onChange={(e) => update('spreadsheetTitle', e.target.value)}
@@ -154,1 +154,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   value={data.spreadsheetTitle}
+                   placeholder="سجل رحلات وموازين المشروع"
@@ -155,1 +155,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   onChange={(e) => update('spreadsheetTitle', e.target.value)}
+                   className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
@@ -156,1 +156,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   placeholder="سجل رحلات وموازين المشروع"
+                 />
@@ -157,1 +157,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
+                 <p className="text-[11px] text-stone-400 mt-1">
@@ -158,1 +158,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 />
+                   {t("other.labels.txt_5860fa")}</p>
@@ -159,1 +159,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <p className="text-[11px] text-stone-400 mt-1">
+               </div>
@@ -160,1 +160,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   المصنف المالي والتشغيلي المتزامن لحظياً مع Firestore.
+             </div>
@@ -161,1 +161,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </p>
+ 
@@ -162,1 +162,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </div>
+             {/* Folder Structure Preview */}
@@ -163,1 +163,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             </div>
+             <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
@@ -164,1 +164,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+               <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
@@ -165,1 +165,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             {/* Folder Structure Preview */}
+                 <FolderTree className="w-4 h-4 text-stone-600" />
@@ -166,1 +166,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
+                 {t("other.labels.txt_24cc60")}</h4>
@@ -167,1 +167,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
+ 
@@ -168,1 +168,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <FolderTree className="w-4 h-4 text-stone-600" />
+               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
@@ -169,1 +169,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 هيكل المجلدات والأوراق السحابية التي سيتم إنشاؤها تلقائياً:
+                 {/* Drive Structure */}
@@ -170,1 +170,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </h4>
+                 <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
@@ -171,1 +171,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+                   <span className="font-bold text-stone-800 block text-[11px] text-amber-700">
@@ -172,1 +172,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
+                     {t("other.labels.txt_330dcc")}</span>
@@ -173,1 +173,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 {/* Drive Structure */}
+                   <ul className="text-stone-600 space-y-1 font-mono text-[11px]">
@@ -174,1 +174,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
+                     {data.folderStructure.map((folder, idx) => (
@@ -175,1 +175,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <span className="font-bold text-stone-800 block text-[11px] text-amber-700">
+                       <li key={idx} className="flex items-center gap-1.5">
@@ -176,1 +176,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     📂 مجلدات Google Drive:
+                         <span className="text-stone-400">├──</span>
@@ -177,1 +177,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   </span>
+                         <span>{folder}</span>
@@ -178,1 +178,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <ul className="text-stone-600 space-y-1 font-mono text-[11px]">
+                       </li>
@@ -179,1 +179,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     {data.folderStructure.map((folder, idx) => (
+                     ))}
@@ -180,1 +180,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <li key={idx} className="flex items-center gap-1.5">
+                   </ul>
@@ -181,1 +181,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                         <span className="text-stone-400">├──</span>
+                 </div>
@@ -182,1 +182,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                         <span>{folder}</span>
+ 
@@ -183,1 +183,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       </li>
+                 {/* Sheets Structure */}
@@ -184,1 +184,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     ))}
+                 <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
@@ -185,1 +185,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   </ul>
+                   <span className="font-bold text-stone-800 block text-[11px] text-emerald-700">
@@ -186,1 +186,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </div>
+                     {t("other.labels.txt_13cd13")}</span>
@@ -187,1 +187,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+                   <ul className="text-stone-600 space-y-1 text-[11px]">
@@ -188,1 +188,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 {/* Sheets Structure */}
+                     <li className="flex items-center gap-1.5">
@@ -189,1 +189,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
+                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
@@ -190,1 +190,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <span className="font-bold text-stone-800 block text-[11px] text-emerald-700">
+                       <span className="font-semibold">{t("other.labels.trips_6")}</span>
@@ -191,1 +191,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     📊 أوراق عمل Google Sheets (Tabs):
+                     </li>
@@ -192,1 +192,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   </span>
+                     <li className="flex items-center gap-1.5">
@@ -193,1 +193,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <ul className="text-stone-600 space-y-1 text-[11px]">
+                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
@@ -194,1 +194,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     <li className="flex items-center gap-1.5">
+                       <span className="font-semibold">تذاكر الميزان الرقمية (Weighbridge Tickets)</span>
@@ -195,1 +195,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
+                     </li>
@@ -196,1 +196,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <span className="font-semibold">سجل الرحلات اليومي (Trips Log)</span>
+                     <li className="flex items-center gap-1.5">
@@ -197,1 +197,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     </li>
+                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
@@ -198,1 +198,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     <li className="flex items-center gap-1.5">
+                       <span className="font-semibold">{t("other.labels.txt_4a65bf")}</span>
@@ -199,1 +199,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
+                     </li>
@@ -200,1 +200,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <span className="font-semibold">تذاكر الميزان الرقمية (Weighbridge Tickets)</span>
+                     <li className="flex items-center gap-1.5">
@@ -201,1 +201,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     </li>
+                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
@@ -202,1 +202,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     <li className="flex items-center gap-1.5">
+                       <span className="font-semibold">{t("other.labels.materials_7")}</span>
@@ -203,1 +203,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
+                     </li>
@@ -204,1 +204,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <span className="font-semibold">كشف مطابقات الناقلين (Carrier Settlements)</span>
+                   </ul>
@@ -205,1 +205,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     </li>
+                 </div>
@@ -206,1 +206,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     <li className="flex items-center gap-1.5">
+               </div>
@@ -207,1 +207,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <Sheet className="w-3.5 h-3.5 text-emerald-600" />
+             </div>
@@ -208,1 +208,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                       <span className="font-semibold">ملخص استهلاك المواد الصادرة (Material Totals)</span>
+ 
@@ -209,1 +209,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     </li>
+             {/* Sync Triggers */}
@@ -210,1 +210,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   </ul>
+             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
@@ -211,1 +211,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </div>
+               <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
@@ -212,1 +212,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </div>
+                 <input
@@ -213,1 +213,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             </div>
+                   type="checkbox"
@@ -214,1 +214,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+                   checked={data.autoSyncTickets}
@@ -215,1 +215,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             {/* Sync Triggers */}
+                   onChange={(e) => update('autoSyncTickets', e.target.checked)}
@@ -216,1 +216,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
+                   className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
@@ -217,1 +217,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
+                 />
@@ -218,1 +218,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <input
+                 <span className="font-semibold text-stone-700">
@@ -219,1 +219,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   type="checkbox"
+                   مزامنة تذاكر الميزان آلياً فور اكتمال وزن الشاحنة
@@ -220,1 +220,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   checked={data.autoSyncTickets}
+                 </span>
@@ -221,1 +221,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   onChange={(e) => update('autoSyncTickets', e.target.checked)}
+               </label>
@@ -222,1 +222,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
+ 
@@ -223,1 +223,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 />
+               <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
@@ -224,1 +224,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <span className="font-semibold text-stone-700">
+                 <input
@@ -225,1 +225,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   مزامنة تذاكر الميزان آلياً فور اكتمال وزن الشاحنة
+                   type="checkbox"
@@ -226,1 +226,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </span>
+                   checked={data.archiveDailyTrips}
@@ -227,1 +227,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </label>
+                   onChange={(e) => update('archiveDailyTrips', e.target.checked)}
@@ -228,1 +228,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+                   className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
@@ -229,1 +229,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
+                 />
@@ -230,1 +230,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <input
+                 <span className="font-semibold text-stone-700">
@@ -231,1 +231,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   type="checkbox"
+                   {t("other.labels.trips_7")}</span>
@@ -232,1 +232,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   checked={data.archiveDailyTrips}
+               </label>
@@ -233,1 +233,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   onChange={(e) => update('archiveDailyTrips', e.target.checked)}
+             </div>
@@ -234,1 +234,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
+ 
@@ -235,1 +235,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 />
+             {/* Simulated Connectivity Check */}
@@ -236,1 +236,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <span className="font-semibold text-stone-700">
+             <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
@@ -237,1 +237,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   أرشفة ملخص الرحلات وإشعارات التوريد بنهاية كل وردية
+               <div className="flex items-center gap-2 text-stone-700">
@@ -238,1 +238,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </span>
+                 <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
@@ -239,1 +239,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </label>
+                 <span>
@@ -240,1 +240,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             </div>
+                   {t("other.labels.txt_24c076")}</span>
@@ -241,1 +241,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+               </div>
@@ -242,1 +242,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             {/* Simulated Connectivity Check */}
+ 
@@ -243,1 +243,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
+               <div className="flex items-center gap-2">
@@ -244,1 +244,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <div className="flex items-center gap-2 text-stone-700">
+                 {connectionTested && (
@@ -245,1 +245,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
+                   <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 border border-emerald-200">
@@ -246,1 +246,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <span>
+                     <CheckCircle2 className="w-3.5 h-3.5" />
@@ -247,1 +247,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   جاهزية حساب الخدمة وحقوق الوصول السحابية (Service Account Credentials)
+                     {t("other.status.success_3")}</span>
@@ -248,1 +248,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </span>
+                 )}
@@ -249,1 +249,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </div>
+                 <button
@@ -250,1 +250,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- 
+                   type="button"
@@ -251,1 +251,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               <div className="flex items-center gap-2">
+                   onClick={handleTestConnection}
@@ -252,1 +252,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 {connectionTested && (
+                   disabled={testingConnection}
@@ -253,1 +253,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 border border-emerald-200">
+                   className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded font-semibold text-stone-800 flex items-center gap-1 shadow-2xs disabled:opacity-50"
@@ -254,1 +254,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     <CheckCircle2 className="w-3.5 h-3.5" />
+                 >
@@ -255,1 +255,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                     تم التحقق من الاتصال السحابي بنجاح
+                   <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
@@ -256,1 +256,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   </span>
+                   <span>{testingConnection ? 'جارٍ الفحص...' : 'فحص الاتصال'}</span>
@@ -257,1 +257,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 )}
+                 </button>
@@ -258,1 +258,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 <button
+               </div>
@@ -259,1 +259,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   type="button"
+             </div>
@@ -260,1 +260,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   onClick={handleTestConnection}
+           </div>
@@ -261,1 +261,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   disabled={testingConnection}
+         )}
@@ -262,1 +262,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded font-semibold text-stone-800 flex items-center gap-1 shadow-2xs disabled:opacity-50"
+       </div>
@@ -263,1 +263,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 >
+     </div>
@@ -264,1 +264,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
+   );
@@ -265,1 +265,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                   <span>{testingConnection ? 'جارٍ الفحص...' : 'فحص الاتصال'}</span>
+ };
@@ -266,1 +266,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-                 </button>
+ 
@@ -267,1 +267,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-               </div>
+ 
@@ -268,1 +268,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-             </div>
+ 
@@ -269,1 +269,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-           </div>
+ 
@@ -270,1 +270,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-         )}
+ 
@@ -271,1 +271,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-       </div>
+ 
@@ -272,1 +272,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-     </div>
+ 
@@ -273,1 +273,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
-   );
+ 
@@ -274,1 +274,1 @@ /app/applet/src/components/wizard/Step6GoogleDrive.tsx
- };
+ 
```
