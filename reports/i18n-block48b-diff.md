# BLOCK 48B — Deferred SAFE i18n Migration: Transformation Diff Report

**Generated At:** 2026-09-12T13:08:59.516Z
**Execution Mode:** SAFE Batch Applied (Deferred Candidates Parity)
**Files Modified:** 5
**Total Safe Candidates Applied:** 12 / 12
**Canonical Target Key:** `shared.actions.cancel` ("إلغاء")

---

## File: `src/components/admin/AdminConsoleView.tsx`

- **Pre-Migration Hash:** `9c573755c7f58fb9`
- **Post-Migration Hash:** `fcf1e59224f29fce`
- **Transformations Applied:** 1
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted:** `shared.actions.cancel`

### Unified Diff / Patch

```diff
@@ -54,1 +54,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -55,1 +55,1 @@ src/components/admin/AdminConsoleView.tsx
- type AdminSection = 
+ 
@@ -56,1 +56,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'PROJECTS'
+ 
@@ -57,1 +57,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'CARRIERS'
+ type AdminSection = 
@@ -58,1 +58,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'MATERIALS'
+   | 'PROJECTS'
@@ -59,1 +59,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'PRICING_RULES'
+   | 'CARRIERS'
@@ -60,1 +60,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'TRUCKS'
+   | 'MATERIALS'
@@ -61,1 +61,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'DRIVERS'
+   | 'PRICING_RULES'
@@ -62,1 +62,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'USERS'
+   | 'TRUCKS'
@@ -63,1 +63,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'EXCEPTIONS'
+   | 'DRIVERS'
@@ -64,1 +64,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'AUDIT_LOGS'
+   | 'USERS'
@@ -65,1 +65,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'IMPORT_BATCHES'
+   | 'EXCEPTIONS'
@@ -66,1 +66,1 @@ src/components/admin/AdminConsoleView.tsx
-   | 'SYNC_HEALTH';
+   | 'AUDIT_LOGS'
@@ -67,1 +67,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+   | 'IMPORT_BATCHES'
@@ -68,1 +68,1 @@ src/components/admin/AdminConsoleView.tsx
- export function AdminConsoleView() {
+   | 'SYNC_HEALTH';
@@ -69,1 +69,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [activeSection, setActiveSection] = useState<AdminSection>('PRICING_RULES');
+ 
@@ -70,1 +70,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
+ export function AdminConsoleView() {
@@ -71,1 +71,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [searchQuery, setSearchQuery] = useState<string>('');
+   const { t } = useI18n();
@@ -72,1 +72,1 @@ src/components/admin/AdminConsoleView.tsx
-   
+   const [activeSection, setActiveSection] = useState<AdminSection>('PRICING_RULES');
@@ -73,1 +73,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Current admin session context
+   const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
@@ -74,1 +74,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [authContext] = useState<AuthUserContext>({
+   const [searchQuery, setSearchQuery] = useState<string>('');
@@ -75,1 +75,1 @@ src/components/admin/AdminConsoleView.tsx
-     userId: 'USR-ADMIN-001',
+   
@@ -76,1 +76,1 @@ src/components/admin/AdminConsoleView.tsx
-     email: 'admin@qsaudi.com',
+   // Current admin session context
@@ -77,1 +77,1 @@ src/components/admin/AdminConsoleView.tsx
-     role: 'PROJECT_ADMIN',
+   const [authContext] = useState<AuthUserContext>({
@@ -78,1 +78,1 @@ src/components/admin/AdminConsoleView.tsx
-     displayName: 'المهندس طارق الشمري (مدير النظام)',
+     userId: 'USR-ADMIN-001',
@@ -79,1 +79,1 @@ src/components/admin/AdminConsoleView.tsx
-   });
+     email: 'admin@qsaudi.com',
@@ -80,1 +80,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+     role: 'PROJECT_ADMIN',
@@ -81,1 +81,1 @@ src/components/admin/AdminConsoleView.tsx
-   // State collections from AdminConsoleService
+     displayName: 'المهندس طارق الشمري (مدير النظام)',
@@ -82,1 +82,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [projects, setProjects] = useState<ProjectEntity[]>([]);
+   });
@@ -83,1 +83,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
+ 
@@ -84,1 +84,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [materials, setMaterials] = useState<MaterialEntity[]>([]);
+   // State collections from AdminConsoleService
@@ -85,1 +85,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [pricingRules, setPricingRules] = useState<PricingRuleRecord[]>([]);
+   const [projects, setProjects] = useState<ProjectEntity[]>([]);
@@ -86,1 +86,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [pricingAuditHistory, setPricingAuditHistory] = useState<PricingAuditHistoryEntry[]>([]);
+   const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
@@ -87,1 +87,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [trucks, setTrucks] = useState<TruckEntity[]>([]);
+   const [materials, setMaterials] = useState<MaterialEntity[]>([]);
@@ -88,1 +88,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [drivers, setDrivers] = useState<DriverEntity[]>([]);
+   const [pricingRules, setPricingRules] = useState<PricingRuleRecord[]>([]);
@@ -89,1 +89,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [users, setUsers] = useState<AdminUserRecord[]>([]);
+   const [pricingAuditHistory, setPricingAuditHistory] = useState<PricingAuditHistoryEntry[]>([]);
@@ -90,1 +90,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [exceptions, setExceptions] = useState<TripExceptionEntity[]>([]);
+   const [trucks, setTrucks] = useState<TruckEntity[]>([]);
@@ -91,1 +91,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>([]);
+   const [drivers, setDrivers] = useState<DriverEntity[]>([]);
@@ -92,1 +92,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [importBatches, setImportBatches] = useState<ImportBatchEntity[]>([]);
+   const [users, setUsers] = useState<AdminUserRecord[]>([]);
@@ -93,1 +93,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [syncHealth, setSyncHealth] = useState<SyncHealthStatus>(adminConsoleService.getSyncHealth());
+   const [exceptions, setExceptions] = useState<TripExceptionEntity[]>([]);
@@ -94,1 +94,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+   const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>([]);
@@ -95,1 +95,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Pricing Rule Versioning Modal
+   const [importBatches, setImportBatches] = useState<ImportBatchEntity[]>([]);
@@ -96,1 +96,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [editingRule, setEditingRule] = useState<PricingRuleRecord | null>(null);
+   const [syncHealth, setSyncHealth] = useState<SyncHealthStatus>(adminConsoleService.getSyncHealth());
@@ -97,1 +97,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
+ 
@@ -98,1 +98,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [versionFormData, setVersionFormData] = useState({
+   // Pricing Rule Versioning Modal
@@ -99,1 +99,1 @@ src/components/admin/AdminConsoleView.tsx
-     carrierId: '',
+   const [editingRule, setEditingRule] = useState<PricingRuleRecord | null>(null);
@@ -100,1 +100,1 @@ src/components/admin/AdminConsoleView.tsx
-     carrierName: '',
+   const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
@@ -101,1 +101,1 @@ src/components/admin/AdminConsoleView.tsx
-     pricingType: 'PER_TON' as 'PER_TON' | 'PER_TRIP' | 'PER_KM' | 'FLAT_RATE',
+   const [versionFormData, setVersionFormData] = useState({
@@ -102,1 +102,1 @@ src/components/admin/AdminConsoleView.tsx
-     agreedRate: 0,
+     carrierId: '',
@@ -103,1 +103,1 @@ src/components/admin/AdminConsoleView.tsx
-     currency: 'SAR',
+     carrierName: '',
@@ -104,1 +104,1 @@ src/components/admin/AdminConsoleView.tsx
-     materialId: '',
+     pricingType: 'PER_TON' as 'PER_TON' | 'PER_TRIP' | 'PER_KM' | 'FLAT_RATE',
@@ -105,1 +105,1 @@ src/components/admin/AdminConsoleView.tsx
-     materialName: '',
+     agreedRate: 0,
@@ -106,1 +106,1 @@ src/components/admin/AdminConsoleView.tsx
-     effectiveFrom: new Date().toISOString().split('T')[0],
+     currency: 'SAR',
@@ -107,1 +107,1 @@ src/components/admin/AdminConsoleView.tsx
-     effectiveTo: '2026-12-31',
+     materialId: '',
@@ -108,1 +108,1 @@ src/components/admin/AdminConsoleView.tsx
-     status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
+     materialName: '',
@@ -109,1 +109,1 @@ src/components/admin/AdminConsoleView.tsx
-     modificationReason: '',
+     effectiveFrom: new Date().toISOString().split('T')[0],
@@ -110,1 +110,1 @@ src/components/admin/AdminConsoleView.tsx
-   });
+     effectiveTo: '2026-12-31',
@@ -111,1 +111,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+     status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
@@ -112,1 +112,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Pricing History Drawer / Modal
+     modificationReason: '',
@@ -113,1 +113,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [selectedRuleForHistory, setSelectedRuleForHistory] = useState<string | null>(null);
+   });
@@ -114,1 +114,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
+ 
@@ -115,1 +115,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+   // Pricing History Drawer / Modal
@@ -116,1 +116,1 @@ src/components/admin/AdminConsoleView.tsx
-   // General Notification Banner
+   const [selectedRuleForHistory, setSelectedRuleForHistory] = useState<string | null>(null);
@@ -117,1 +117,1 @@ src/components/admin/AdminConsoleView.tsx
-   const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null);
+   const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
@@ -119,1 +119,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Subscribe to service changes
+   // General Notification Banner
@@ -120,1 +120,1 @@ src/components/admin/AdminConsoleView.tsx
-   useEffect(() => {
+   const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null);
@@ -121,1 +121,1 @@ src/components/admin/AdminConsoleView.tsx
-     const refreshData = () => {
+ 
@@ -122,1 +122,1 @@ src/components/admin/AdminConsoleView.tsx
-       setProjects(adminConsoleService.getProjects());
+   // Subscribe to service changes
@@ -123,1 +123,1 @@ src/components/admin/AdminConsoleView.tsx
-       setCarriers(adminConsoleService.getCarriers(selectedProjectId));
+   useEffect(() => {
@@ -124,1 +124,1 @@ src/components/admin/AdminConsoleView.tsx
-       setMaterials(adminConsoleService.getMaterials(selectedProjectId));
+     const refreshData = () => {
@@ -125,1 +125,1 @@ src/components/admin/AdminConsoleView.tsx
-       setPricingRules(adminConsoleService.getPricingRules(selectedProjectId));
+       setProjects(adminConsoleService.getProjects());
@@ -126,1 +126,1 @@ src/components/admin/AdminConsoleView.tsx
-       setPricingAuditHistory(adminConsoleService.getPricingAuditHistory());
+       setCarriers(adminConsoleService.getCarriers(selectedProjectId));
@@ -127,1 +127,1 @@ src/components/admin/AdminConsoleView.tsx
-       setTrucks(adminConsoleService.getTrucks(selectedProjectId));
+       setMaterials(adminConsoleService.getMaterials(selectedProjectId));
@@ -128,1 +128,1 @@ src/components/admin/AdminConsoleView.tsx
-       setDrivers(adminConsoleService.getDrivers(selectedProjectId));
+       setPricingRules(adminConsoleService.getPricingRules(selectedProjectId));
@@ -129,1 +129,1 @@ src/components/admin/AdminConsoleView.tsx
-       setUsers(adminConsoleService.getUsers());
+       setPricingAuditHistory(adminConsoleService.getPricingAuditHistory());
@@ -130,1 +130,1 @@ src/components/admin/AdminConsoleView.tsx
-       setExceptions(adminConsoleService.getExceptions(selectedProjectId));
+       setTrucks(adminConsoleService.getTrucks(selectedProjectId));
@@ -131,1 +131,1 @@ src/components/admin/AdminConsoleView.tsx
-       setAuditLogs(adminConsoleService.getAuditLogs());
+       setDrivers(adminConsoleService.getDrivers(selectedProjectId));
@@ -132,1 +132,1 @@ src/components/admin/AdminConsoleView.tsx
-       setImportBatches(adminConsoleService.getImportBatches(selectedProjectId));
+       setUsers(adminConsoleService.getUsers());
@@ -133,1 +133,1 @@ src/components/admin/AdminConsoleView.tsx
-       setSyncHealth(adminConsoleService.getSyncHealth());
+       setExceptions(adminConsoleService.getExceptions(selectedProjectId));
@@ -134,1 +134,1 @@ src/components/admin/AdminConsoleView.tsx
-     };
+       setAuditLogs(adminConsoleService.getAuditLogs());
@@ -135,1 +135,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+       setImportBatches(adminConsoleService.getImportBatches(selectedProjectId));
@@ -136,1 +136,1 @@ src/components/admin/AdminConsoleView.tsx
-     refreshData();
+       setSyncHealth(adminConsoleService.getSyncHealth());
@@ -137,1 +137,1 @@ src/components/admin/AdminConsoleView.tsx
-     const unsubscribe = adminConsoleService.subscribe(refreshData);
+     };
@@ -138,1 +138,1 @@ src/components/admin/AdminConsoleView.tsx
-     return () => unsubscribe();
+ 
@@ -139,1 +139,1 @@ src/components/admin/AdminConsoleView.tsx
-   }, [selectedProjectId]);
+     refreshData();
@@ -140,1 +140,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+     const unsubscribe = adminConsoleService.subscribe(refreshData);
@@ -141,1 +141,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Dismiss banner after 6s
+     return () => unsubscribe();
@@ -142,1 +142,1 @@ src/components/admin/AdminConsoleView.tsx
-   useEffect(() => {
+   }, [selectedProjectId]);
@@ -143,1 +143,1 @@ src/components/admin/AdminConsoleView.tsx
-     if (alertBanner) {
+ 
@@ -144,1 +144,1 @@ src/components/admin/AdminConsoleView.tsx
-       const timer = setTimeout(() => setAlertBanner(null), 6000);
+   // Dismiss banner after 6s
@@ -145,1 +145,1 @@ src/components/admin/AdminConsoleView.tsx
-       return () => clearTimeout(timer);
+   useEffect(() => {
@@ -146,1 +146,1 @@ src/components/admin/AdminConsoleView.tsx
-     }
+     if (alertBanner) {
@@ -147,1 +147,1 @@ src/components/admin/AdminConsoleView.tsx
-   }, [alertBanner]);
+       const timer = setTimeout(() => setAlertBanner(null), 6000);
@@ -148,1 +148,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+       return () => clearTimeout(timer);
@@ -149,1 +149,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Open Versioning Modal for a rule
+     }
@@ -150,1 +150,1 @@ src/components/admin/AdminConsoleView.tsx
-   const handleOpenVersionModal = (rule: PricingRuleRecord) => {
+   }, [alertBanner]);
@@ -151,1 +151,1 @@ src/components/admin/AdminConsoleView.tsx
-     setEditingRule(rule);
+ 
@@ -152,1 +152,1 @@ src/components/admin/AdminConsoleView.tsx
-     setVersionFormData({
+   // Open Versioning Modal for a rule
@@ -153,1 +153,1 @@ src/components/admin/AdminConsoleView.tsx
-       carrierId: rule.carrierId,
+   const handleOpenVersionModal = (rule: PricingRuleRecord) => {
@@ -154,1 +154,1 @@ src/components/admin/AdminConsoleView.tsx
-       carrierName: rule.carrierName,
+     setEditingRule(rule);
@@ -155,1 +155,1 @@ src/components/admin/AdminConsoleView.tsx
-       pricingType: rule.pricingType,
+     setVersionFormData({
@@ -156,1 +156,1 @@ src/components/admin/AdminConsoleView.tsx
-       agreedRate: rule.agreedRate,
+       carrierId: rule.carrierId,
@@ -157,1 +157,1 @@ src/components/admin/AdminConsoleView.tsx
-       currency: rule.currency || 'SAR',
+       carrierName: rule.carrierName,
@@ -158,1 +158,1 @@ src/components/admin/AdminConsoleView.tsx
-       materialId: rule.materialId || '',
+       pricingType: rule.pricingType,
@@ -159,1 +159,1 @@ src/components/admin/AdminConsoleView.tsx
-       materialName: rule.materialName || '',
+       agreedRate: rule.agreedRate,
@@ -160,1 +160,1 @@ src/components/admin/AdminConsoleView.tsx
-       effectiveFrom: new Date().toISOString().split('T')[0],
+       currency: rule.currency || 'SAR',
@@ -161,1 +161,1 @@ src/components/admin/AdminConsoleView.tsx
-       effectiveTo: rule.effectiveTo || '2026-12-31',
+       materialId: rule.materialId || '',
@@ -162,1 +162,1 @@ src/components/admin/AdminConsoleView.tsx
-       status: rule.status,
+       materialName: rule.materialName || '',
@@ -163,1 +163,1 @@ src/components/admin/AdminConsoleView.tsx
-       modificationReason: `تعديل السعر المعتمد (إنشاء النسخة v${(rule.version || 1) + 1}) وحماية الرحلات السابقة`,
+       effectiveFrom: new Date().toISOString().split('T')[0],
@@ -164,1 +164,1 @@ src/components/admin/AdminConsoleView.tsx
-     });
+       effectiveTo: rule.effectiveTo || '2026-12-31',
@@ -165,1 +165,1 @@ src/components/admin/AdminConsoleView.tsx
-     setIsVersionModalOpen(true);
+       status: rule.status,
@@ -166,1 +166,1 @@ src/components/admin/AdminConsoleView.tsx
-   };
+       modificationReason: `تعديل السعر المعتمد (إنشاء النسخة v${(rule.version || 1) + 1}) وحماية الرحلات السابقة`,
@@ -167,1 +167,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+     });
@@ -168,1 +168,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Submit Versioning Form (Copy-on-write without mutating past trips)
+     setIsVersionModalOpen(true);
@@ -169,1 +169,1 @@ src/components/admin/AdminConsoleView.tsx
-   const handleSubmitVersioning = (e: React.FormEvent) => {
+   };
@@ -170,1 +170,1 @@ src/components/admin/AdminConsoleView.tsx
-     e.preventDefault();
+ 
@@ -171,1 +171,1 @@ src/components/admin/AdminConsoleView.tsx
-     if (!editingRule) return;
+   // Submit Versioning Form (Copy-on-write without mutating past trips)
@@ -172,1 +172,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+   const handleSubmitVersioning = (e: React.FormEvent) => {
@@ -173,1 +173,1 @@ src/components/admin/AdminConsoleView.tsx
-     try {
+     e.preventDefault();
@@ -174,1 +174,1 @@ src/components/admin/AdminConsoleView.tsx
-       const result = adminConsoleService.versionAndModifyPricingRule(
+     if (!editingRule) return;
@@ -175,1 +175,1 @@ src/components/admin/AdminConsoleView.tsx
-         editingRule.pricingRuleId,
+ 
@@ -176,1 +176,1 @@ src/components/admin/AdminConsoleView.tsx
-         {
+     try {
@@ -177,1 +177,1 @@ src/components/admin/AdminConsoleView.tsx
-           ...versionFormData,
+       const result = adminConsoleService.versionAndModifyPricingRule(
@@ -178,1 +178,1 @@ src/components/admin/AdminConsoleView.tsx
-           agreedRate: Number(versionFormData.agreedRate),
+         editingRule.pricingRuleId,
@@ -179,1 +179,1 @@ src/components/admin/AdminConsoleView.tsx
-         },
+         {
@@ -180,1 +180,1 @@ src/components/admin/AdminConsoleView.tsx
-         authContext
+           ...versionFormData,
@@ -181,1 +181,1 @@ src/components/admin/AdminConsoleView.tsx
-       );
+           agreedRate: Number(versionFormData.agreedRate),
@@ -182,1 +182,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+         },
@@ -183,1 +183,1 @@ src/components/admin/AdminConsoleView.tsx
-       setIsVersionModalOpen(false);
+         authContext
@@ -184,1 +184,1 @@ src/components/admin/AdminConsoleView.tsx
-       setAlertBanner({
+       );
@@ -185,1 +185,1 @@ src/components/admin/AdminConsoleView.tsx
-         type: 'success',
+ 
@@ -186,1 +186,1 @@ src/components/admin/AdminConsoleView.tsx
-         message: `تم إنشاء النسخة الجديدة (${result.newVersionRule.pricingRuleId}) بنجاح بمعدل ${result.newVersionRule.agreedRate} ${result.newVersionRule.currency}. تم تأمين وحماية ${result.protectedTripsCount} رحلة تاريخية في السجل المحاسبي دون أي تعديل!`,
+       setIsVersionModalOpen(false);
@@ -187,1 +187,1 @@ src/components/admin/AdminConsoleView.tsx
-       });
+       setAlertBanner({
@@ -188,1 +188,1 @@ src/components/admin/AdminConsoleView.tsx
-     } catch (err: any) {
+         type: 'success',
@@ -189,1 +189,1 @@ src/components/admin/AdminConsoleView.tsx
-       setAlertBanner({
+         message: `تم إنشاء النسخة الجديدة (${result.newVersionRule.pricingRuleId}) بنجاح بمعدل ${result.newVersionRule.agreedRate} ${result.newVersionRule.currency}. تم تأمين وحماية ${result.protectedTripsCount} رحلة تاريخية في السجل المحاسبي دون أي تعديل!`,
@@ -190,1 +190,1 @@ src/components/admin/AdminConsoleView.tsx
-         type: 'warning',
+       });
@@ -191,1 +191,1 @@ src/components/admin/AdminConsoleView.tsx
-         message: `خطأ أثناء تحديث التعرفة: ${err.message || err}`,
+     } catch (err: any) {
@@ -192,1 +192,1 @@ src/components/admin/AdminConsoleView.tsx
-       });
+       setAlertBanner({
@@ -193,1 +193,1 @@ src/components/admin/AdminConsoleView.tsx
-     }
+         type: 'warning',
@@ -194,1 +194,1 @@ src/components/admin/AdminConsoleView.tsx
-   };
+         message: `خطأ أثناء تحديث التعرفة: ${err.message || err}`,
@@ -195,1 +195,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+       });
@@ -196,1 +196,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Open History Drawer
+     }
@@ -197,1 +197,1 @@ src/components/admin/AdminConsoleView.tsx
-   const handleOpenHistoryDrawer = (ruleId?: string) => {
+   };
@@ -198,1 +198,1 @@ src/components/admin/AdminConsoleView.tsx
-     setSelectedRuleForHistory(ruleId || null);
+ 
@@ -199,1 +199,1 @@ src/components/admin/AdminConsoleView.tsx
-     setIsHistoryDrawerOpen(true);
+   // Open History Drawer
@@ -200,1 +200,1 @@ src/components/admin/AdminConsoleView.tsx
-   };
+   const handleOpenHistoryDrawer = (ruleId?: string) => {
@@ -201,1 +201,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+     setSelectedRuleForHistory(ruleId || null);
@@ -202,1 +202,1 @@ src/components/admin/AdminConsoleView.tsx
-   // Filtered pricing rules
+     setIsHistoryDrawerOpen(true);
@@ -203,1 +203,1 @@ src/components/admin/AdminConsoleView.tsx
-   const filteredPricingRules = useMemo(() => {
+   };
@@ -204,1 +204,1 @@ src/components/admin/AdminConsoleView.tsx
-     return pricingRules.filter(r => {
+ 
@@ -205,1 +205,1 @@ src/components/admin/AdminConsoleView.tsx
-       const q = searchQuery.toLowerCase().trim();
+   // Filtered pricing rules
@@ -206,1 +206,1 @@ src/components/admin/AdminConsoleView.tsx
-       const matchSearch = !q || 
+   const filteredPricingRules = useMemo(() => {
@@ -207,1 +207,1 @@ src/components/admin/AdminConsoleView.tsx
-         r.carrierName.toLowerCase().includes(q) || 
+     return pricingRules.filter(r => {
@@ -208,1 +208,1 @@ src/components/admin/AdminConsoleView.tsx
-         r.pricingRuleId.toLowerCase().includes(q) || 
+       const q = searchQuery.toLowerCase().trim();
@@ -209,1 +209,1 @@ src/components/admin/AdminConsoleView.tsx
-         (r.materialName && r.materialName.toLowerCase().includes(q)) ||
+       const matchSearch = !q || 
@@ -210,1 +210,1 @@ src/components/admin/AdminConsoleView.tsx
-         (r.notes && r.notes.toLowerCase().includes(q));
+         r.carrierName.toLowerCase().includes(q) || 
@@ -211,1 +211,1 @@ src/components/admin/AdminConsoleView.tsx
-       return matchSearch;
+         r.pricingRuleId.toLowerCase().includes(q) || 
@@ -212,1 +212,1 @@ src/components/admin/AdminConsoleView.tsx
-     });
+         (r.materialName && r.materialName.toLowerCase().includes(q)) ||
@@ -213,1 +213,1 @@ src/components/admin/AdminConsoleView.tsx
-   }, [pricingRules, searchQuery]);
+         (r.notes && r.notes.toLowerCase().includes(q));
@@ -214,1 +214,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+       return matchSearch;
@@ -215,1 +215,1 @@ src/components/admin/AdminConsoleView.tsx
-   return (
+     });
@@ -216,1 +216,1 @@ src/components/admin/AdminConsoleView.tsx
-     <div className="space-y-6 pb-16 font-sans text-stone-900" dir="rtl">
+   }, [pricingRules, searchQuery]);
@@ -217,1 +217,1 @@ src/components/admin/AdminConsoleView.tsx
-       
+ 
@@ -218,1 +218,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* Alert Banner */}
+   return (
@@ -219,1 +219,1 @@ src/components/admin/AdminConsoleView.tsx
-       {alertBanner && (
+     <div className="space-y-6 pb-16 font-sans text-stone-900" dir="rtl">
@@ -220,1 +220,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all ${
+       
@@ -221,1 +221,1 @@ src/components/admin/AdminConsoleView.tsx
-           alertBanner.type === 'success' 
+       {/* Alert Banner */}
@@ -222,1 +222,1 @@ src/components/admin/AdminConsoleView.tsx
-             ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
+       {alertBanner && (
@@ -223,1 +223,1 @@ src/components/admin/AdminConsoleView.tsx
-             : alertBanner.type === 'warning'
+         <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all ${
@@ -224,1 +224,1 @@ src/components/admin/AdminConsoleView.tsx
-             ? 'bg-amber-50 border-amber-200 text-amber-900'
+           alertBanner.type === 'success' 
@@ -225,1 +225,1 @@ src/components/admin/AdminConsoleView.tsx
-             : 'bg-stone-50 border-stone-200 text-stone-900'
+             ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
@@ -226,1 +226,1 @@ src/components/admin/AdminConsoleView.tsx
-         }`}>
+             : alertBanner.type === 'warning'
@@ -227,1 +227,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center gap-3">
+             ? 'bg-amber-50 border-amber-200 text-amber-900'
@@ -228,1 +228,1 @@ src/components/admin/AdminConsoleView.tsx
-             {alertBanner.type === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
+             : 'bg-stone-50 border-stone-200 text-stone-900'
@@ -229,1 +229,1 @@ src/components/admin/AdminConsoleView.tsx
-             {alertBanner.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
+         }`}>
@@ -230,1 +230,1 @@ src/components/admin/AdminConsoleView.tsx
-             {alertBanner.type === 'info' && <Info className="w-5 h-5 text-stone-600 shrink-0" />}
+           <div className="flex items-center gap-3">
@@ -231,1 +231,1 @@ src/components/admin/AdminConsoleView.tsx
-             <span className="text-sm font-medium">{alertBanner.message}</span>
+             {alertBanner.type === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
@@ -232,1 +232,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+             {alertBanner.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
@@ -233,1 +233,1 @@ src/components/admin/AdminConsoleView.tsx
-           <button 
+             {alertBanner.type === 'info' && <Info className="w-5 h-5 text-stone-600 shrink-0" />}
@@ -234,1 +234,1 @@ src/components/admin/AdminConsoleView.tsx
-             onClick={() => setAlertBanner(null)}
+             <span className="text-sm font-medium">{alertBanner.message}</span>
@@ -235,1 +235,1 @@ src/components/admin/AdminConsoleView.tsx
-             className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded font-bold"
+           </div>
@@ -236,1 +236,1 @@ src/components/admin/AdminConsoleView.tsx
-           >
+           <button 
@@ -237,1 +237,1 @@ src/components/admin/AdminConsoleView.tsx
-             إغلاق
+             onClick={() => setAlertBanner(null)}
@@ -238,1 +238,1 @@ src/components/admin/AdminConsoleView.tsx
-           </button>
+             className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded font-bold"
@@ -239,1 +239,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+           >
@@ -240,1 +240,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             إغلاق
@@ -241,1 +241,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </button>
@@ -242,1 +242,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* Header Banner */}
+         </div>
@@ -243,1 +243,1 @@ src/components/admin/AdminConsoleView.tsx
-       <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
+       )}
@@ -244,1 +244,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
+ 
@@ -245,1 +245,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div>
+       {/* Header Banner */}
@@ -246,1 +246,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="flex items-center gap-2 mb-1.5">
+       <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
@@ -247,1 +247,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200/60 flex items-center gap-1">
+         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
@@ -248,1 +248,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
+           <div>
@@ -249,1 +249,1 @@ src/components/admin/AdminConsoleView.tsx
-                 وحدة التحكم المركزية (Admin Console)
+             <div className="flex items-center gap-2 mb-1.5">
@@ -250,1 +250,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200/60 flex items-center gap-1">
@@ -251,1 +251,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-600">
+                 <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
@@ -252,1 +252,1 @@ src/components/admin/AdminConsoleView.tsx
-                 11 قسماً إدارياً ورقابياً
+                 وحدة التحكم المركزية (Admin Console)
@@ -254,1 +254,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-600">
@@ -255,1 +255,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h1 className="text-2xl font-black text-stone-900 tracking-tight">
+                 11 قسماً إدارياً ورقابياً
@@ -256,1 +256,1 @@ src/components/admin/AdminConsoleView.tsx
-               إدارة المنظومة والبيانات المرجعية (Master Data & Control)
+               </span>
@@ -257,1 +257,1 @@ src/components/admin/AdminConsoleView.tsx
-             </h1>
+             </div>
@@ -258,1 +258,1 @@ src/components/admin/AdminConsoleView.tsx
-             <p className="text-stone-600 text-sm mt-1 max-w-3xl">
+             <h1 className="text-2xl font-black text-stone-900 tracking-tight">
@@ -259,1 +259,1 @@ src/components/admin/AdminConsoleView.tsx
-               إدارة متكاملة لجميع قواعد العمليات اللوجستية، مصفوفات الأسعار مع حماية السلامة التاريخية للرحلات السابقة (Copy-on-write Versioning)، وسجلات التدقيق الشاملة.
+               إدارة المنظومة والبيانات المرجعية (Master Data & Control)
@@ -260,1 +260,1 @@ src/components/admin/AdminConsoleView.tsx
-             </p>
+             </h1>
@@ -261,1 +261,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+             <p className="text-stone-600 text-sm mt-1 max-w-3xl">
@@ -262,1 +262,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               إدارة متكاملة لجميع قواعد العمليات اللوجستية، مصفوفات الأسعار مع حماية السلامة التاريخية للرحلات السابقة (Copy-on-write Versioning)، وسجلات التدقيق الشاملة.
@@ -263,1 +263,1 @@ src/components/admin/AdminConsoleView.tsx
-           {/* Quick Context & Project Selector */}
+             </p>
@@ -264,1 +264,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
+           </div>
@@ -265,1 +265,1 @@ src/components/admin/AdminConsoleView.tsx
-             <Building2 className="w-4 h-4 text-stone-500" />
+ 
@@ -266,1 +266,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="text-xs">
+           {/* Quick Context & Project Selector */}
@@ -267,1 +267,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="text-stone-500 block">المشروع المحدد:</span>
+           <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
@@ -268,1 +268,1 @@ src/components/admin/AdminConsoleView.tsx
-               <select
+             <Building2 className="w-4 h-4 text-stone-500" />
@@ -269,1 +269,1 @@ src/components/admin/AdminConsoleView.tsx
-                 value={selectedProjectId}
+             <div className="text-xs">
@@ -270,1 +270,1 @@ src/components/admin/AdminConsoleView.tsx
-                 onChange={(e) => setSelectedProjectId(e.target.value)}
+               <span className="text-stone-500 block">المشروع المحدد:</span>
@@ -271,1 +271,1 @@ src/components/admin/AdminConsoleView.tsx
-                 className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
+               <select
@@ -272,1 +272,1 @@ src/components/admin/AdminConsoleView.tsx
-               >
+                 value={selectedProjectId}
@@ -273,1 +273,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <option value="ALL">كافة المشاريع المصرحة (عرض شامل)</option>
+                 onChange={(e) => setSelectedProjectId(e.target.value)}
@@ -274,1 +274,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {projects.map(p => (
+                 className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
@@ -275,1 +275,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <option key={p.projectId} value={p.projectId}>{p.nameAr}</option>
+               >
@@ -276,1 +276,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ))}
+                 <option value="ALL">كافة المشاريع المصرحة (عرض شامل)</option>
@@ -277,1 +277,1 @@ src/components/admin/AdminConsoleView.tsx
-               </select>
+                 {projects.map(p => (
@@ -278,1 +278,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                   <option key={p.projectId} value={p.projectId}>{p.nameAr}</option>
@@ -279,1 +279,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 ))}
@@ -280,1 +280,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </select>
@@ -281,1 +281,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+             </div>
@@ -282,1 +282,1 @@ src/components/admin/AdminConsoleView.tsx
-         {/* 11 Section Navigation Bar */}
+           </div>
@@ -283,1 +283,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="mt-6 pt-4 border-t border-stone-100 overflow-x-auto pb-1 scrollbar-thin">
+         </div>
@@ -284,1 +284,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center gap-1.5 min-w-max">
+ 
@@ -285,1 +285,1 @@ src/components/admin/AdminConsoleView.tsx
-             
+         {/* 11 Section Navigation Bar */}
@@ -286,1 +286,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 1. Projects */}
+         <div className="mt-6 pt-4 border-t border-stone-100 overflow-x-auto pb-1 scrollbar-thin">
@@ -287,1 +287,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+           <div className="flex items-center gap-1.5 min-w-max">
@@ -288,1 +288,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('PROJECTS')}
+             
@@ -289,1 +289,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 1. Projects */}
@@ -290,1 +290,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'PROJECTS'
+             <button
@@ -291,1 +291,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('PROJECTS')}
@@ -292,1 +292,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -293,1 +293,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'PROJECTS'
@@ -294,1 +294,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -295,1 +295,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Building2 className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -296,1 +296,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Projects (المشاريع)</span>
+               }`}
@@ -297,1 +297,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -298,1 +298,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {projects.length}
+               <Building2 className="w-4 h-4" />
@@ -299,1 +299,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Projects (المشاريع)</span>
@@ -300,1 +300,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -301,1 +301,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {projects.length}
@@ -302,1 +302,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 2. Carriers */}
+               </span>
@@ -303,1 +303,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -304,1 +304,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('CARRIERS')}
+ 
@@ -305,1 +305,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 2. Carriers */}
@@ -306,1 +306,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'CARRIERS'
+             <button
@@ -307,1 +307,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('CARRIERS')}
@@ -308,1 +308,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -309,1 +309,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'CARRIERS'
@@ -310,1 +310,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -311,1 +311,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Truck className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -312,1 +312,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Carriers (الناقلين)</span>
+               }`}
@@ -313,1 +313,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -314,1 +314,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {carriers.length}
+               <Truck className="w-4 h-4" />
@@ -315,1 +315,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Carriers (الناقلين)</span>
@@ -316,1 +316,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -317,1 +317,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {carriers.length}
@@ -318,1 +318,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 3. Materials */}
+               </span>
@@ -319,1 +319,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -320,1 +320,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('MATERIALS')}
+ 
@@ -321,1 +321,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 3. Materials */}
@@ -322,1 +322,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'MATERIALS'
+             <button
@@ -323,1 +323,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('MATERIALS')}
@@ -324,1 +324,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -325,1 +325,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'MATERIALS'
@@ -326,1 +326,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -327,1 +327,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Boxes className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -328,1 +328,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Materials (المواد)</span>
+               }`}
@@ -329,1 +329,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -330,1 +330,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {materials.length}
+               <Boxes className="w-4 h-4" />
@@ -331,1 +331,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Materials (المواد)</span>
@@ -332,1 +332,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -333,1 +333,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {materials.length}
@@ -334,1 +334,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 4. Pricing Rules (Highlighted) */}
+               </span>
@@ -335,1 +335,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -336,1 +336,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('PRICING_RULES')}
+ 
@@ -337,1 +337,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 4. Pricing Rules (Highlighted) */}
@@ -338,1 +338,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'PRICING_RULES'
+             <button
@@ -339,1 +339,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-amber-600 text-white shadow-xs'
+               onClick={() => setActiveSection('PRICING_RULES')}
@@ -340,1 +340,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -341,1 +341,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'PRICING_RULES'
@@ -342,1 +342,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-amber-600 text-white shadow-xs'
@@ -343,1 +343,1 @@ src/components/admin/AdminConsoleView.tsx
-               <DollarSign className="w-4 h-4" />
+                   : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
@@ -344,1 +344,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Pricing Rules (قواعد الأسعار)</span>
+               }`}
@@ -345,1 +345,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
+             >
@@ -346,1 +346,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'PRICING_RULES' ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-900'
+               <DollarSign className="w-4 h-4" />
@@ -347,1 +347,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}>
+               <span>Pricing Rules (قواعد الأسعار)</span>
@@ -348,1 +348,1 @@ src/components/admin/AdminConsoleView.tsx
-                 محمي وتاريخي
+               <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
@@ -349,1 +349,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+                 activeSection === 'PRICING_RULES' ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-900'
@@ -350,1 +350,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               }`}>
@@ -351,1 +351,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 محمي وتاريخي
@@ -352,1 +352,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 5. Trucks */}
+               </span>
@@ -353,1 +353,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -354,1 +354,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('TRUCKS')}
+ 
@@ -355,1 +355,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 5. Trucks */}
@@ -356,1 +356,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'TRUCKS'
+             <button
@@ -357,1 +357,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('TRUCKS')}
@@ -358,1 +358,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -359,1 +359,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'TRUCKS'
@@ -360,1 +360,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -361,1 +361,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Truck className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -362,1 +362,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Trucks (الشاحنات)</span>
+               }`}
@@ -363,1 +363,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -364,1 +364,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {trucks.length}
+               <Truck className="w-4 h-4" />
@@ -365,1 +365,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Trucks (الشاحنات)</span>
@@ -366,1 +366,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -367,1 +367,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {trucks.length}
@@ -368,1 +368,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 6. Drivers */}
+               </span>
@@ -369,1 +369,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -370,1 +370,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('DRIVERS')}
+ 
@@ -371,1 +371,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 6. Drivers */}
@@ -372,1 +372,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'DRIVERS'
+             <button
@@ -373,1 +373,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('DRIVERS')}
@@ -374,1 +374,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -375,1 +375,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'DRIVERS'
@@ -376,1 +376,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -377,1 +377,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Users className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -378,1 +378,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Drivers (السائقين)</span>
+               }`}
@@ -379,1 +379,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -380,1 +380,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {drivers.length}
+               <Users className="w-4 h-4" />
@@ -381,1 +381,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Drivers (السائقين)</span>
@@ -382,1 +382,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -383,1 +383,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {drivers.length}
@@ -384,1 +384,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 7. Users */}
+               </span>
@@ -385,1 +385,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -386,1 +386,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('USERS')}
+ 
@@ -387,1 +387,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 7. Users */}
@@ -388,1 +388,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'USERS'
+             <button
@@ -389,1 +389,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('USERS')}
@@ -390,1 +390,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -391,1 +391,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'USERS'
@@ -392,1 +392,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -393,1 +393,1 @@ src/components/admin/AdminConsoleView.tsx
-               <ShieldAlert className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -394,1 +394,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Users (المستخدمين والأدوار)</span>
+               }`}
@@ -395,1 +395,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -396,1 +396,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {users.length}
+               <ShieldAlert className="w-4 h-4" />
@@ -397,1 +397,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Users (المستخدمين والأدوار)</span>
@@ -398,1 +398,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -399,1 +399,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {users.length}
@@ -400,1 +400,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 8. Exceptions */}
+               </span>
@@ -401,1 +401,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -402,1 +402,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('EXCEPTIONS')}
+ 
@@ -403,1 +403,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 8. Exceptions */}
@@ -404,1 +404,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'EXCEPTIONS'
+             <button
@@ -405,1 +405,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('EXCEPTIONS')}
@@ -406,1 +406,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -407,1 +407,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'EXCEPTIONS'
@@ -408,1 +408,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -409,1 +409,1 @@ src/components/admin/AdminConsoleView.tsx
-               <AlertTriangle className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -410,1 +410,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Exceptions (الاستثناءات)</span>
+               }`}
@@ -411,1 +411,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -412,1 +412,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {exceptions.length}
+               <AlertTriangle className="w-4 h-4" />
@@ -413,1 +413,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Exceptions (الاستثناءات)</span>
@@ -414,1 +414,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -415,1 +415,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {exceptions.length}
@@ -416,1 +416,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 9. Audit Logs */}
+               </span>
@@ -417,1 +417,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -418,1 +418,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('AUDIT_LOGS')}
+ 
@@ -419,1 +419,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 9. Audit Logs */}
@@ -420,1 +420,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'AUDIT_LOGS'
+             <button
@@ -421,1 +421,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('AUDIT_LOGS')}
@@ -422,1 +422,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -423,1 +423,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'AUDIT_LOGS'
@@ -424,1 +424,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -425,1 +425,1 @@ src/components/admin/AdminConsoleView.tsx
-               <History className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -426,1 +426,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Audit Logs (سجل التدقيق)</span>
+               }`}
@@ -427,1 +427,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -428,1 +428,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {auditLogs.length}
+               <History className="w-4 h-4" />
@@ -429,1 +429,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Audit Logs (سجل التدقيق)</span>
@@ -430,1 +430,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -431,1 +431,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {auditLogs.length}
@@ -432,1 +432,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 10. Import Batches */}
+               </span>
@@ -433,1 +433,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -434,1 +434,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('IMPORT_BATCHES')}
+ 
@@ -435,1 +435,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 10. Import Batches */}
@@ -436,1 +436,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'IMPORT_BATCHES'
+             <button
@@ -437,1 +437,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('IMPORT_BATCHES')}
@@ -438,1 +438,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -439,1 +439,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'IMPORT_BATCHES'
@@ -440,1 +440,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -441,1 +441,1 @@ src/components/admin/AdminConsoleView.tsx
-               <FileSpreadsheet className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -442,1 +442,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Import Batches (دفعات الاستيراد)</span>
+               }`}
@@ -443,1 +443,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
+             >
@@ -444,1 +444,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {importBatches.length}
+               <FileSpreadsheet className="w-4 h-4" />
@@ -445,1 +445,1 @@ src/components/admin/AdminConsoleView.tsx
-               </span>
+               <span>Import Batches (دفعات الاستيراد)</span>
@@ -446,1 +446,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
@@ -447,1 +447,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 {importBatches.length}
@@ -448,1 +448,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* 11. Sync Health */}
+               </span>
@@ -449,1 +449,1 @@ src/components/admin/AdminConsoleView.tsx
-             <button
+             </button>
@@ -450,1 +450,1 @@ src/components/admin/AdminConsoleView.tsx
-               onClick={() => setActiveSection('SYNC_HEALTH')}
+ 
@@ -451,1 +451,1 @@ src/components/admin/AdminConsoleView.tsx
-               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
+             {/* 11. Sync Health */}
@@ -452,1 +452,1 @@ src/components/admin/AdminConsoleView.tsx
-                 activeSection === 'SYNC_HEALTH'
+             <button
@@ -453,1 +453,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ? 'bg-stone-900 text-white shadow-xs'
+               onClick={() => setActiveSection('SYNC_HEALTH')}
@@ -454,1 +454,1 @@ src/components/admin/AdminConsoleView.tsx
-                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
+               className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
@@ -455,1 +455,1 @@ src/components/admin/AdminConsoleView.tsx
-               }`}
+                 activeSection === 'SYNC_HEALTH'
@@ -456,1 +456,1 @@ src/components/admin/AdminConsoleView.tsx
-             >
+                   ? 'bg-stone-900 text-white shadow-xs'
@@ -457,1 +457,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Activity className="w-4 h-4" />
+                   : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
@@ -458,1 +458,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>Sync Health (صحة المزامنة)</span>
+               }`}
@@ -459,1 +459,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
+             >
@@ -460,1 +460,1 @@ src/components/admin/AdminConsoleView.tsx
-             </button>
+               <Activity className="w-4 h-4" />
@@ -461,1 +461,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               <span>Sync Health (صحة المزامنة)</span>
@@ -462,1 +462,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
@@ -463,1 +463,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+             </button>
@@ -464,1 +464,1 @@ src/components/admin/AdminConsoleView.tsx
-       </div>
+ 
@@ -465,1 +465,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -466,1 +466,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -467,1 +467,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 4. PRICING RULES SECTION (PRIMARY FOCUS) */}
+       </div>
@@ -468,1 +468,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -469,1 +469,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'PRICING_RULES' && (
+       {/* ==================================================================== */}
@@ -470,1 +470,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-6">
+       {/* 4. PRICING RULES SECTION (PRIMARY FOCUS) */}
@@ -471,1 +471,1 @@ src/components/admin/AdminConsoleView.tsx
-           
+       {/* ==================================================================== */}
@@ -472,1 +472,1 @@ src/components/admin/AdminConsoleView.tsx
-           {/* Rules Control Bar & Policy Declaration */}
+       {activeSection === 'PRICING_RULES' && (
@@ -473,1 +473,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
+         <div className="space-y-6">
@@ -474,1 +474,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="flex items-start gap-3.5">
+           
@@ -475,1 +475,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
+           {/* Rules Control Bar & Policy Declaration */}
@@ -476,1 +476,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <ShieldCheck className="w-5 h-5" />
+           <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
@@ -477,1 +477,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+             <div className="flex items-start gap-3.5">
@@ -478,1 +478,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div>
+               <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
@@ -479,1 +479,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <h2 className="text-base font-bold text-amber-950">
+                 <ShieldCheck className="w-5 h-5" />
@@ -480,1 +480,1 @@ src/components/admin/AdminConsoleView.tsx
-                   قواعد تسعير النقل وضمان الحصانة التاريخية (Pricing Rules & Immutability)
+               </div>
@@ -481,1 +481,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </h2>
+               <div>
@@ -482,1 +482,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <p className="text-xs text-amber-900/80 mt-1 leading-relaxed max-w-3xl">
+                 <h2 className="text-base font-bold text-amber-950">
@@ -483,1 +483,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <strong>القاعدة المحاسبية الصارمة:</strong> عند تعديل أي قاعدة تسعير، لا يتم المساس بالرحلات السابقة (Historical Trips) إطلاقاً. يتم توليد نسخة جديدة (Version) تسري فقط من تاريخ النفاذ الجديد، بينما تظل كافة الرحلات السابقة محتفظة بلقطة التعرفة الأصلية.
+                   قواعد تسعير النقل وضمان الحصانة التاريخية (Pricing Rules & Immutability)
@@ -484,1 +484,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </p>
+                 </h2>
@@ -485,1 +485,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                 <p className="text-xs text-amber-900/80 mt-1 leading-relaxed max-w-3xl">
@@ -486,1 +486,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                   <strong>القاعدة المحاسبية الصارمة:</strong> عند تعديل أي قاعدة تسعير، لا يتم المساس بالرحلات السابقة (Historical Trips) إطلاقاً. يتم توليد نسخة جديدة (Version) تسري فقط من تاريخ النفاذ الجديد، بينما تظل كافة الرحلات السابقة محتفظة بلقطة التعرفة الأصلية.
@@ -487,1 +487,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 </p>
@@ -488,1 +488,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="flex items-center gap-2.5 shrink-0">
+               </div>
@@ -489,1 +489,1 @@ src/components/admin/AdminConsoleView.tsx
-               <button
+             </div>
@@ -490,1 +490,1 @@ src/components/admin/AdminConsoleView.tsx
-                 onClick={() => handleOpenHistoryDrawer()}
+ 
@@ -491,1 +491,1 @@ src/components/admin/AdminConsoleView.tsx
-                 className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-amber-300/80 text-amber-900 text-xs font-bold hover:bg-amber-100/50 shadow-2xs transition-all"
+             <div className="flex items-center gap-2.5 shrink-0">
@@ -492,1 +492,1 @@ src/components/admin/AdminConsoleView.tsx
-               >
+               <button
@@ -493,1 +493,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <History className="w-4 h-4 text-amber-700" />
+                 onClick={() => handleOpenHistoryDrawer()}
@@ -494,1 +494,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <span>عرض سجل تاريخ التغييرات (Audit History)</span>
+                 className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-amber-300/80 text-amber-900 text-xs font-bold hover:bg-amber-100/50 shadow-2xs transition-all"
@@ -495,1 +495,1 @@ src/components/admin/AdminConsoleView.tsx
-               </button>
+               >
@@ -496,1 +496,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                 <History className="w-4 h-4 text-amber-700" />
@@ -497,1 +497,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 <span>عرض سجل تاريخ التغييرات (Audit History)</span>
@@ -498,1 +498,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               </button>
@@ -499,1 +499,1 @@ src/components/admin/AdminConsoleView.tsx
-           {/* Search & Filter Header */}
+             </div>
@@ -500,1 +500,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
+           </div>
@@ -501,1 +501,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="relative flex-1 max-w-md">
+ 
@@ -502,1 +502,1 @@ src/components/admin/AdminConsoleView.tsx
-               <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
+           {/* Search & Filter Header */}
@@ -503,1 +503,1 @@ src/components/admin/AdminConsoleView.tsx
-               <input
+           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
@@ -504,1 +504,1 @@ src/components/admin/AdminConsoleView.tsx
-                 type="text"
+             <div className="relative flex-1 max-w-md">
@@ -505,1 +505,1 @@ src/components/admin/AdminConsoleView.tsx
-                 value={searchQuery}
+               <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
@@ -506,1 +506,1 @@ src/components/admin/AdminConsoleView.tsx
-                 onChange={(e) => setSearchQuery(e.target.value)}
+               <input
@@ -507,1 +507,1 @@ src/components/admin/AdminConsoleView.tsx
-                 placeholder="بحث بالناقل، رمز القاعدة، المادة..."
+                 type="text"
@@ -508,1 +508,1 @@ src/components/admin/AdminConsoleView.tsx
-                 className="w-full pr-10 pl-4 py-2.5 bg-white border border-stone-200/90 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 shadow-2xs"
+                 value={searchQuery}
@@ -509,1 +509,1 @@ src/components/admin/AdminConsoleView.tsx
-               />
+                 onChange={(e) => setSearchQuery(e.target.value)}
@@ -510,1 +510,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                 placeholder="بحث بالناقل، رمز القاعدة، المادة..."
@@ -511,1 +511,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="flex items-center gap-2 text-xs text-stone-500">
+                 className="w-full pr-10 pl-4 py-2.5 bg-white border border-stone-200/90 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 shadow-2xs"
@@ -512,1 +512,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>إجمالي القواعد: <strong>{filteredPricingRules.length}</strong></span>
+               />
@@ -513,1 +513,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>•</span>
+             </div>
@@ -514,1 +514,1 @@ src/components/admin/AdminConsoleView.tsx
-               <span>سجلات التدقيق: <strong>{pricingAuditHistory.length}</strong></span>
+             <div className="flex items-center gap-2 text-xs text-stone-500">
@@ -515,1 +515,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               <span>إجمالي القواعد: <strong>{filteredPricingRules.length}</strong></span>
@@ -516,1 +516,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+               <span>•</span>
@@ -517,1 +517,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               <span>سجلات التدقيق: <strong>{pricingAuditHistory.length}</strong></span>
@@ -518,1 +518,1 @@ src/components/admin/AdminConsoleView.tsx
-           {/* Rules Table */}
+             </div>
@@ -519,1 +519,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
+           </div>
@@ -520,1 +520,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="overflow-x-auto">
+ 
@@ -521,1 +521,1 @@ src/components/admin/AdminConsoleView.tsx
-               <table className="w-full text-right border-collapse text-xs">
+           {/* Rules Table */}
@@ -522,1 +522,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <thead>
+           <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
@@ -523,1 +523,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <tr className="bg-stone-50/90 border-b border-stone-200/80 text-stone-600 font-bold">
+             <div className="overflow-x-auto">
@@ -524,1 +524,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">رقم النسخة والقاعدة</th>
+               <table className="w-full text-right border-collapse text-xs">
@@ -525,1 +525,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">اسم الناقل</th>
+                 <thead>
@@ -526,1 +526,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">نوع التسعير</th>
+                   <tr className="bg-stone-50/90 border-b border-stone-200/80 text-stone-600 font-bold">
@@ -527,1 +527,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">السعر</th>
+                     <th className="py-3 px-4">رقم النسخة والقاعدة</th>
@@ -528,1 +528,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">العملة</th>
+                     <th className="py-3 px-4">اسم الناقل</th>
@@ -529,1 +529,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">المادة الاختيارية</th>
+                     <th className="py-3 px-4">نوع التسعير</th>
@@ -530,1 +530,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">من تاريخ</th>
+                     <th className="py-3 px-4">السعر</th>
@@ -531,1 +531,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">إلى تاريخ</th>
+                     <th className="py-3 px-4">العملة</th>
@@ -532,1 +532,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4">الحالة</th>
+                     <th className="py-3 px-4">المادة الاختيارية</th>
@@ -533,1 +533,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4 text-center">الرحلات المحمية</th>
+                     <th className="py-3 px-4">من تاريخ</th>
@@ -534,1 +534,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <th className="py-3 px-4 text-left">الإجراءات</th>
+                     <th className="py-3 px-4">إلى تاريخ</th>
@@ -535,1 +535,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </tr>
+                     <th className="py-3 px-4">الحالة</th>
@@ -536,1 +536,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </thead>
+                     <th className="py-3 px-4 text-center">الرحلات المحمية</th>
@@ -537,1 +537,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <tbody className="divide-y divide-stone-100">
+                     <th className="py-3 px-4 text-left">الإجراءات</th>
@@ -538,1 +538,1 @@ src/components/admin/AdminConsoleView.tsx
-                   {filteredPricingRules.length === 0 ? (
+                   </tr>
@@ -539,1 +539,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <tr>
+                 </thead>
@@ -540,1 +540,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <td colSpan={11} className="py-12 text-center text-stone-400 text-xs">
+                 <tbody className="divide-y divide-stone-100">
@@ -541,1 +541,1 @@ src/components/admin/AdminConsoleView.tsx
-                         لا توجد قواعد تسعير مطابقة للبحث أو للمشروع المحدد.
+                   {filteredPricingRules.length === 0 ? (
@@ -542,1 +542,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </td>
+                     <tr>
@@ -543,1 +543,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </tr>
+                       <td colSpan={11} className="py-12 text-center text-stone-400 text-xs">
@@ -544,1 +544,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ) : (
+                         لا توجد قواعد تسعير مطابقة للبحث أو للمشروع المحدد.
@@ -545,1 +545,1 @@ src/components/admin/AdminConsoleView.tsx
-                     filteredPricingRules.map((rule) => {
+                       </td>
@@ -546,1 +546,1 @@ src/components/admin/AdminConsoleView.tsx
-                       const tripCount = adminConsoleService.countHistoricalTripsForRule(rule.pricingRuleId);
+                     </tr>
@@ -547,1 +547,1 @@ src/components/admin/AdminConsoleView.tsx
-                       return (
+                   ) : (
@@ -548,1 +548,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <tr key={rule.pricingRuleId} className="hover:bg-amber-50/30 transition-colors">
+                     filteredPricingRules.map((rule) => {
@@ -549,1 +549,1 @@ src/components/admin/AdminConsoleView.tsx
-                           
+                       const tripCount = adminConsoleService.countHistoricalTripsForRule(rule.pricingRuleId);
@@ -550,1 +550,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* ID & Version Badge */}
+                       return (
@@ -551,1 +551,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 font-mono text-[11px]">
+                         <tr key={rule.pricingRuleId} className="hover:bg-amber-50/30 transition-colors">
@@ -552,1 +552,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <div className="flex items-center gap-1.5">
+                           
@@ -553,1 +553,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <span className="font-bold text-stone-900">{rule.pricingRuleId}</span>
+                           {/* ID & Version Badge */}
@@ -554,1 +554,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
+                           <td className="py-3.5 px-4 font-mono text-[11px]">
@@ -555,1 +555,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 v{rule.version || 1}
+                             <div className="flex items-center gap-1.5">
@@ -556,1 +556,1 @@ src/components/admin/AdminConsoleView.tsx
-                               </span>
+                               <span className="font-bold text-stone-900">{rule.pricingRuleId}</span>
@@ -557,1 +557,1 @@ src/components/admin/AdminConsoleView.tsx
-                             </div>
+                               <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
@@ -558,1 +558,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.parentRuleId && (
+                                 v{rule.version || 1}
@@ -559,1 +559,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <span className="text-[10px] text-stone-400 block mt-0.5 font-sans">
+                               </span>
@@ -560,1 +560,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 مستحدث من {rule.parentRuleId}
+                             </div>
@@ -561,1 +561,1 @@ src/components/admin/AdminConsoleView.tsx
-                               </span>
+                             {rule.parentRuleId && (
@@ -562,1 +562,1 @@ src/components/admin/AdminConsoleView.tsx
-                             )}
+                               <span className="text-[10px] text-stone-400 block mt-0.5 font-sans">
@@ -563,1 +563,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                                 مستحدث من {rule.parentRuleId}
@@ -564,1 +564,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                               </span>
@@ -565,1 +565,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Carrier Name */}
+                             )}
@@ -566,1 +566,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 font-semibold text-stone-900">
+                           </td>
@@ -567,1 +567,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.carrierName}
+ 
@@ -568,1 +568,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                           {/* Carrier Name */}
@@ -569,1 +569,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                           <td className="py-3.5 px-4 font-semibold text-stone-900">
@@ -570,1 +570,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Pricing Type */}
+                             {rule.carrierName}
@@ -571,1 +571,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4">
+                           </td>
@@ -572,1 +572,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <span className={`px-2 py-0.8 rounded text-[11px] font-bold ${
+ 
@@ -573,1 +573,1 @@ src/components/admin/AdminConsoleView.tsx
-                               rule.pricingType === 'PER_TON' 
+                           {/* Pricing Type */}
@@ -574,1 +574,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/50' 
+                           <td className="py-3.5 px-4">
@@ -575,1 +575,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 : rule.pricingType === 'PER_TRIP'
+                             <span className={`px-2 py-0.8 rounded text-[11px] font-bold ${
@@ -576,1 +576,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
+                               rule.pricingType === 'PER_TON' 
@@ -577,1 +577,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 : 'bg-stone-100 text-stone-700'
+                                 ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/50' 
@@ -578,1 +578,1 @@ src/components/admin/AdminConsoleView.tsx
-                             }`}>
+                                 : rule.pricingType === 'PER_TRIP'
@@ -579,1 +579,1 @@ src/components/admin/AdminConsoleView.tsx
-                               {rule.pricingType === 'PER_TON' ? 'بالطن (PER_TON)' :
+                                 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
@@ -580,1 +580,1 @@ src/components/admin/AdminConsoleView.tsx
-                                rule.pricingType === 'PER_TRIP' ? 'بالرد (PER_TRIP)' :
+                                 : 'bg-stone-100 text-stone-700'
@@ -581,1 +581,1 @@ src/components/admin/AdminConsoleView.tsx
-                                rule.pricingType === 'PER_KM' ? 'بالكيلو (PER_KM)' : 'مقطوعية'}
+                             }`}>
@@ -582,1 +582,1 @@ src/components/admin/AdminConsoleView.tsx
-                             </span>
+                               {rule.pricingType === 'PER_TON' ? 'بالطن (PER_TON)' :
@@ -583,1 +583,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                                rule.pricingType === 'PER_TRIP' ? 'بالرد (PER_TRIP)' :
@@ -584,1 +584,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                                rule.pricingType === 'PER_KM' ? 'بالكيلو (PER_KM)' : 'مقطوعية'}
@@ -585,1 +585,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Price / Rate */}
+                             </span>
@@ -586,1 +586,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-sm">
+                           </td>
@@ -587,1 +587,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.agreedRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
+ 
@@ -588,1 +588,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                           {/* Price / Rate */}
@@ -589,1 +589,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                           <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-sm">
@@ -590,1 +590,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Currency */}
+                             {rule.agreedRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
@@ -591,1 +591,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 text-stone-600 font-bold">
+                           </td>
@@ -592,1 +592,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.currency || 'SAR'}
+ 
@@ -593,1 +593,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                           {/* Currency */}
@@ -594,1 +594,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                           <td className="py-3.5 px-4 text-stone-600 font-bold">
@@ -595,1 +595,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Optional Material */}
+                             {rule.currency || 'SAR'}
@@ -596,1 +596,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 text-stone-700">
+                           </td>
@@ -597,1 +597,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.materialName ? (
+ 
@@ -598,1 +598,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <span className="font-medium text-stone-800">{rule.materialName}</span>
+                           {/* Optional Material */}
@@ -599,1 +599,1 @@ src/components/admin/AdminConsoleView.tsx
-                             ) : (
+                           <td className="py-3.5 px-4 text-stone-700">
@@ -600,1 +600,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <span className="text-stone-400 italic">كافة المواد والخامات (عام)</span>
+                             {rule.materialName ? (
@@ -601,1 +601,1 @@ src/components/admin/AdminConsoleView.tsx
-                             )}
+                               <span className="font-medium text-stone-800">{rule.materialName}</span>
@@ -602,1 +602,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                             ) : (
@@ -603,1 +603,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                               <span className="text-stone-400 italic">كافة المواد والخامات (عام)</span>
@@ -604,1 +604,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Effective From */}
+                             )}
@@ -605,1 +605,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 font-mono text-stone-600">
+                           </td>
@@ -606,1 +606,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.effectiveFrom}
+ 
@@ -607,1 +607,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                           {/* Effective From */}
@@ -608,1 +608,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                           <td className="py-3.5 px-4 font-mono text-stone-600">
@@ -609,1 +609,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Effective To */}
+                             {rule.effectiveFrom}
@@ -610,1 +610,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 font-mono text-stone-600">
+                           </td>
@@ -611,1 +611,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {rule.effectiveTo}
+ 
@@ -612,1 +612,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                           {/* Effective To */}
@@ -613,1 +613,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                           <td className="py-3.5 px-4 font-mono text-stone-600">
@@ -614,1 +614,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Status */}
+                             {rule.effectiveTo}
@@ -615,1 +615,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4">
+                           </td>
@@ -616,1 +616,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
+ 
@@ -617,1 +617,1 @@ src/components/admin/AdminConsoleView.tsx
-                               rule.status === 'ACTIVE'
+                           {/* Status */}
@@ -618,1 +618,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 ? 'bg-emerald-100 text-emerald-800'
+                           <td className="py-3.5 px-4">
@@ -619,1 +619,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 : 'bg-stone-100 text-stone-600'
+                             <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
@@ -620,1 +620,1 @@ src/components/admin/AdminConsoleView.tsx
-                             }`}>
+                               rule.status === 'ACTIVE'
@@ -621,1 +621,1 @@ src/components/admin/AdminConsoleView.tsx
-                               {rule.status === 'ACTIVE' ? (
+                                 ? 'bg-emerald-100 text-emerald-800'
@@ -622,1 +622,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 <>
+                                 : 'bg-stone-100 text-stone-600'
@@ -623,1 +623,1 @@ src/components/admin/AdminConsoleView.tsx
-                                   <CheckCircle2 className="w-3 h-3 text-emerald-600" />
+                             }`}>
@@ -624,1 +624,1 @@ src/components/admin/AdminConsoleView.tsx
-                                   <span>نشط</span>
+                               {rule.status === 'ACTIVE' ? (
@@ -625,1 +625,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 </>
+                                 <>
@@ -626,1 +626,1 @@ src/components/admin/AdminConsoleView.tsx
-                               ) : (
+                                   <CheckCircle2 className="w-3 h-3 text-emerald-600" />
@@ -627,1 +627,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 <>
+                                   <span>نشط</span>
@@ -628,1 +628,1 @@ src/components/admin/AdminConsoleView.tsx
-                                   <Clock className="w-3 h-3 text-stone-400" />
+                                 </>
@@ -629,1 +629,1 @@ src/components/admin/AdminConsoleView.tsx
-                                   <span>مؤرشف / منتهي</span>
+                               ) : (
@@ -630,1 +630,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 </>
+                                 <>
@@ -631,1 +631,1 @@ src/components/admin/AdminConsoleView.tsx
-                               )}
+                                   <Clock className="w-3 h-3 text-stone-400" />
@@ -632,1 +632,1 @@ src/components/admin/AdminConsoleView.tsx
-                             </span>
+                                   <span>مؤرشف / منتهي</span>
@@ -633,1 +633,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                                 </>
@@ -634,1 +634,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                               )}
@@ -635,1 +635,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Protected Trips Badge */}
+                             </span>
@@ -636,1 +636,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 text-center">
+                           </td>
@@ -637,1 +637,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100/70 text-amber-900 border border-amber-200" title="عدد الرحلات السابقة المسجلة بهذه التعرفة والتي تظل محمية تماماً">
+ 
@@ -638,1 +638,1 @@ src/components/admin/AdminConsoleView.tsx
-                               {tripCount} رحلة تاريخية
+                           {/* Protected Trips Badge */}
@@ -639,1 +639,1 @@ src/components/admin/AdminConsoleView.tsx
-                             </span>
+                           <td className="py-3.5 px-4 text-center">
@@ -640,1 +640,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                             <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100/70 text-amber-900 border border-amber-200" title="عدد الرحلات السابقة المسجلة بهذه التعرفة والتي تظل محمية تماماً">
@@ -641,1 +641,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                               {tripCount} رحلة تاريخية
@@ -642,1 +642,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {/* Actions */}
+                             </span>
@@ -643,1 +643,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <td className="py-3.5 px-4 text-left">
+                           </td>
@@ -644,1 +644,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <div className="flex items-center justify-end gap-1.5">
+ 
@@ -645,1 +645,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <button
+                           {/* Actions */}
@@ -646,1 +646,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 onClick={() => handleOpenVersionModal(rule)}
+                           <td className="py-3.5 px-4 text-left">
@@ -647,1 +647,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-600 text-white text-[11px] font-bold transition-all shadow-2xs"
+                             <div className="flex items-center justify-end gap-1.5">
@@ -648,1 +648,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 title="تعديل السعر بإنشاء نسخة جديدة لحماية السجلات السابقة"
+                               <button
@@ -649,1 +649,1 @@ src/components/admin/AdminConsoleView.tsx
-                               >
+                                 onClick={() => handleOpenVersionModal(rule)}
@@ -650,1 +650,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 <Edit3 className="w-3.5 h-3.5" />
+                                 className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-600 text-white text-[11px] font-bold transition-all shadow-2xs"
@@ -651,1 +651,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 <span>تعديل (نسخة v{(rule.version || 1) + 1})</span>
+                                 title="تعديل السعر بإنشاء نسخة جديدة لحماية السجلات السابقة"
@@ -652,1 +652,1 @@ src/components/admin/AdminConsoleView.tsx
-                               </button>
+                               >
@@ -653,1 +653,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                                 <Edit3 className="w-3.5 h-3.5" />
@@ -654,1 +654,1 @@ src/components/admin/AdminConsoleView.tsx
-                               <button
+                                 <span>تعديل (نسخة v{(rule.version || 1) + 1})</span>
@@ -655,1 +655,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 onClick={() => handleOpenHistoryDrawer(rule.pricingRuleId)}
+                               </button>
@@ -656,1 +656,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
+ 
@@ -657,1 +657,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 title="عرض سجل التدقيق وتاريخ التغييرات"
+                               <button
@@ -658,1 +658,1 @@ src/components/admin/AdminConsoleView.tsx
-                               >
+                                 onClick={() => handleOpenHistoryDrawer(rule.pricingRuleId)}
@@ -659,1 +659,1 @@ src/components/admin/AdminConsoleView.tsx
-                                 <History className="w-3.5 h-3.5 text-stone-600" />
+                                 className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
@@ -660,1 +660,1 @@ src/components/admin/AdminConsoleView.tsx
-                               </button>
+                                 title="عرض سجل التدقيق وتاريخ التغييرات"
@@ -661,1 +661,1 @@ src/components/admin/AdminConsoleView.tsx
-                             </div>
+                               >
@@ -662,1 +662,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </td>
+                                 <History className="w-3.5 h-3.5 text-stone-600" />
@@ -663,1 +663,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                               </button>
@@ -664,1 +664,1 @@ src/components/admin/AdminConsoleView.tsx
-                         </tr>
+                             </div>
@@ -665,1 +665,1 @@ src/components/admin/AdminConsoleView.tsx
-                       );
+                           </td>
@@ -666,1 +666,1 @@ src/components/admin/AdminConsoleView.tsx
-                     })
+ 
@@ -667,1 +667,1 @@ src/components/admin/AdminConsoleView.tsx
-                   )}
+                         </tr>
@@ -668,1 +668,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </tbody>
+                       );
@@ -669,1 +669,1 @@ src/components/admin/AdminConsoleView.tsx
-               </table>
+                     })
@@ -670,1 +670,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                   )}
@@ -671,1 +671,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 </tbody>
@@ -672,1 +672,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               </table>
@@ -673,1 +673,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+             </div>
@@ -674,1 +674,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+           </div>
@@ -676,1 +676,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -677,1 +677,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 1. PROJECTS SECTION */}
+       )}
@@ -678,1 +678,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -679,1 +679,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'PROJECTS' && (
+       {/* ==================================================================== */}
@@ -680,1 +680,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 1. PROJECTS SECTION */}
@@ -681,1 +681,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -682,1 +682,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">سجل المشاريع الإنشائية المعتمدة (Project Registry)</h2>
+       {activeSection === 'PROJECTS' && (
@@ -683,1 +683,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -684,1 +684,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+           <div className="flex items-center justify-between">
@@ -685,1 +685,1 @@ src/components/admin/AdminConsoleView.tsx
-             {projects.map((p) => (
+             <h2 className="text-base font-bold text-stone-900">سجل المشاريع الإنشائية المعتمدة (Project Registry)</h2>
@@ -686,1 +686,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div key={p.projectId} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
+           </div>
@@ -687,1 +687,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="flex items-start justify-between">
+           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
@@ -688,1 +688,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+             {projects.map((p) => (
@@ -689,1 +689,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-mono">
+               <div key={p.projectId} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
@@ -690,1 +690,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {p.projectId}
+                 <div className="flex items-start justify-between">
@@ -691,1 +691,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </span>
+                   <div>
@@ -692,1 +692,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <h3 className="font-bold text-stone-900 text-base mt-2">{p.nameAr}</h3>
+                     <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-mono">
@@ -693,1 +693,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <p className="text-xs text-stone-500">{p.nameEn} • {p.clientName}</p>
+                       {p.projectId}
@@ -694,1 +694,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                     </span>
@@ -695,1 +695,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
+                     <h3 className="font-bold text-stone-900 text-base mt-2">{p.nameAr}</h3>
@@ -696,1 +696,1 @@ src/components/admin/AdminConsoleView.tsx
-                     p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
+                     <p className="text-xs text-stone-500">{p.nameEn} • {p.clientName}</p>
@@ -697,1 +697,1 @@ src/components/admin/AdminConsoleView.tsx
-                   }`}>
+                   </div>
@@ -698,1 +698,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {p.status === 'ACTIVE' ? 'مشروع نشط' : 'مخطط'}
+                   <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
@@ -699,1 +699,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </span>
+                     p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
@@ -700,1 +700,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                   }`}>
@@ -701,1 +701,1 @@ src/components/admin/AdminConsoleView.tsx
-                 
+                     {p.status === 'ACTIVE' ? 'مشروع نشط' : 'مخطط'}
@@ -702,1 +702,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs">
+                   </span>
@@ -703,1 +703,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+                 </div>
@@ -704,1 +704,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[11px]">الرقم الضريبي ZATCA</span>
+                 
@@ -705,1 +705,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-mono font-semibold text-stone-800">{p.settings.zatcaTaxNumber}</span>
+                 <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs">
@@ -706,1 +706,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -707,1 +707,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+                     <span className="text-stone-400 block text-[11px]">الرقم الضريبي ZATCA</span>
@@ -708,1 +708,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[11px]">نسبة الضريبة</span>
+                     <span className="font-mono font-semibold text-stone-800">{p.settings.zatcaTaxNumber}</span>
@@ -709,1 +709,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-bold text-stone-800">{p.settings.vatRatePercent}%</span>
+                   </div>
@@ -710,1 +710,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -711,1 +711,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+                     <span className="text-stone-400 block text-[11px]">نسبة الضريبة</span>
@@ -712,1 +712,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[11px]">الموقع والسياج</span>
+                     <span className="font-bold text-stone-800">{p.settings.vatRatePercent}%</span>
@@ -713,1 +713,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-800 font-medium">{p.location.addressAr} ({p.location.geoFenceRadiusMeters}م)</span>
+                   </div>
@@ -714,1 +714,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -715,1 +715,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+                     <span className="text-stone-400 block text-[11px]">الموقع والسياج</span>
@@ -716,1 +716,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[11px]">الناقلين المصرحين</span>
+                     <span className="text-stone-800 font-medium">{p.location.addressAr} ({p.location.geoFenceRadiusMeters}م)</span>
@@ -717,1 +717,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-800 font-bold">{p.authorizedCarrierIds?.length || 0} شركات</span>
+                   </div>
@@ -718,1 +718,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -719,1 +719,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     <span className="text-stone-400 block text-[11px]">الناقلين المصرحين</span>
@@ -720,1 +720,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                     <span className="text-stone-800 font-bold">{p.authorizedCarrierIds?.length || 0} شركات</span>
@@ -721,1 +721,1 @@ src/components/admin/AdminConsoleView.tsx
-             ))}
+                   </div>
@@ -722,1 +722,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 </div>
@@ -723,1 +723,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </div>
@@ -724,1 +724,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             ))}
@@ -725,1 +725,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -726,1 +726,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -727,1 +727,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 2. CARRIERS SECTION */}
+       )}
@@ -728,1 +728,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -729,1 +729,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'CARRIERS' && (
+       {/* ==================================================================== */}
@@ -730,1 +730,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 2. CARRIERS SECTION */}
@@ -731,1 +731,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -732,1 +732,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">سجل شركات النقل والخدمات اللوجستية (Carriers Registry)</h2>
+       {activeSection === 'CARRIERS' && (
@@ -733,1 +733,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -734,1 +734,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
+           <div className="flex items-center justify-between">
@@ -735,1 +735,1 @@ src/components/admin/AdminConsoleView.tsx
-             <table className="w-full text-right border-collapse text-xs">
+             <h2 className="text-base font-bold text-stone-900">سجل شركات النقل والخدمات اللوجستية (Carriers Registry)</h2>
@@ -736,1 +736,1 @@ src/components/admin/AdminConsoleView.tsx
-               <thead>
+           </div>
@@ -737,1 +737,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
+           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
@@ -738,1 +738,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">رقم الناقل</th>
+             <table className="w-full text-right border-collapse text-xs">
@@ -739,1 +739,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">اسم الشركة</th>
+               <thead>
@@ -740,1 +740,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">السجل التجاري (CR)</th>
+                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
@@ -741,1 +741,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">ترخيص هيئة النقل (TGA)</th>
+                   <th className="py-3 px-4">رقم الناقل</th>
@@ -742,1 +742,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">المسؤول والهاتف</th>
+                   <th className="py-3 px-4">اسم الشركة</th>
@@ -743,1 +743,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الحالة</th>
+                   <th className="py-3 px-4">السجل التجاري (CR)</th>
@@ -744,1 +744,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4 text-left">الإجراء</th>
+                   <th className="py-3 px-4">ترخيص هيئة النقل (TGA)</th>
@@ -745,1 +745,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </tr>
+                   <th className="py-3 px-4">المسؤول والهاتف</th>
@@ -746,1 +746,1 @@ src/components/admin/AdminConsoleView.tsx
-               </thead>
+                   <th className="py-3 px-4">الحالة</th>
@@ -747,1 +747,1 @@ src/components/admin/AdminConsoleView.tsx
-               <tbody className="divide-y divide-stone-100">
+                   <th className="py-3 px-4 text-left">الإجراء</th>
@@ -748,1 +748,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {carriers.map(c => (
+                 </tr>
@@ -749,1 +749,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <tr key={c.carrierId} className="hover:bg-stone-50">
+               </thead>
@@ -750,1 +750,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono font-bold text-stone-700">{c.carrierId}</td>
+               <tbody className="divide-y divide-stone-100">
@@ -751,1 +751,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-semibold text-stone-900">{c.name || c.companyNameAr}</td>
+                 {carriers.map(c => (
@@ -752,1 +752,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-stone-600">{c.commercialRegistrationNo || '—'}</td>
+                   <tr key={c.carrierId} className="hover:bg-stone-50">
@@ -753,1 +753,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-stone-600">{c.transportLicenseNo || '—'}</td>
+                     <td className="py-3 px-4 font-mono font-bold text-stone-700">{c.carrierId}</td>
@@ -754,1 +754,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 text-stone-700">
+                     <td className="py-3 px-4 font-semibold text-stone-900">{c.name || c.companyNameAr}</td>
@@ -755,1 +755,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {c.contactPerson ? `${c.contactPerson.name} (${c.contactPerson.phone})` : '—'}
+                     <td className="py-3 px-4 font-mono text-stone-600">{c.commercialRegistrationNo || '—'}</td>
@@ -756,1 +756,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                     <td className="py-3 px-4 font-mono text-stone-600">{c.transportLicenseNo || '—'}</td>
@@ -757,1 +757,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4">
+                     <td className="py-3 px-4 text-stone-700">
@@ -758,1 +758,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
+                       {c.contactPerson ? `${c.contactPerson.name} (${c.contactPerson.phone})` : '—'}
@@ -759,1 +759,1 @@ src/components/admin/AdminConsoleView.tsx
-                         c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
+                     </td>
@@ -760,1 +760,1 @@ src/components/admin/AdminConsoleView.tsx
-                       }`}>
+                     <td className="py-3 px-4">
@@ -761,1 +761,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {c.status === 'ACTIVE' ? 'معتمد' : 'معطل'}
+                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
@@ -762,1 +762,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </span>
+                         c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
@@ -763,1 +763,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       }`}>
@@ -764,1 +764,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 text-left">
+                         {c.status === 'ACTIVE' ? 'معتمد' : 'معطل'}
@@ -765,1 +765,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <button
+                       </span>
@@ -766,1 +766,1 @@ src/components/admin/AdminConsoleView.tsx
-                         onClick={() => adminConsoleService.toggleCarrierStatus(c.carrierId, authContext)}
+                     </td>
@@ -767,1 +767,1 @@ src/components/admin/AdminConsoleView.tsx
-                         className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px]"
+                     <td className="py-3 px-4 text-left">
@@ -768,1 +768,1 @@ src/components/admin/AdminConsoleView.tsx
-                       >
+                       <button
@@ -769,1 +769,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {c.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
+                         onClick={() => adminConsoleService.toggleCarrierStatus(c.carrierId, authContext)}
@@ -770,1 +770,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </button>
+                         className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px]"
@@ -771,1 +771,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       >
@@ -772,1 +772,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </tr>
+                         {c.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
@@ -773,1 +773,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ))}
+                       </button>
@@ -774,1 +774,1 @@ src/components/admin/AdminConsoleView.tsx
-               </tbody>
+                     </td>
@@ -775,1 +775,1 @@ src/components/admin/AdminConsoleView.tsx
-             </table>
+                   </tr>
@@ -776,1 +776,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 ))}
@@ -777,1 +777,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </tbody>
@@ -778,1 +778,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             </table>
@@ -779,1 +779,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -780,1 +780,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -781,1 +781,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 3. MATERIALS SECTION */}
+       )}
@@ -782,1 +782,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -783,1 +783,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'MATERIALS' && (
+       {/* ==================================================================== */}
@@ -784,1 +784,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 3. MATERIALS SECTION */}
@@ -785,1 +785,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -786,1 +786,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">سجل المواد والخامات المعتمدة (Materials Registry)</h2>
+       {activeSection === 'MATERIALS' && (
@@ -787,1 +787,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -788,1 +788,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
+           <div className="flex items-center justify-between">
@@ -789,1 +789,1 @@ src/components/admin/AdminConsoleView.tsx
-             {materials.map(m => (
+             <h2 className="text-base font-bold text-stone-900">سجل المواد والخامات المعتمدة (Materials Registry)</h2>
@@ -790,1 +790,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div key={m.materialId} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
+           </div>
@@ -791,1 +791,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="flex items-center justify-between">
+           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
@@ -792,1 +792,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
+             {materials.map(m => (
@@ -793,1 +793,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {m.code}
+               <div key={m.materialId} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
@@ -794,1 +794,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </span>
+                 <div className="flex items-center justify-between">
@@ -795,1 +795,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
+                   <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
@@ -796,1 +796,1 @@ src/components/admin/AdminConsoleView.tsx
-                     m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
+                     {m.code}
@@ -797,1 +797,1 @@ src/components/admin/AdminConsoleView.tsx
-                   }`}>
+                   </span>
@@ -798,1 +798,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {m.status === 'ACTIVE' ? 'نشط' : 'معطل'}
+                   <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
@@ -799,1 +799,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </span>
+                     m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
@@ -800,1 +800,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                   }`}>
@@ -801,1 +801,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <h3 className="font-bold text-stone-900 text-sm mt-3">{m.name || m.nameAr}</h3>
+                     {m.status === 'ACTIVE' ? 'نشط' : 'معطل'}
@@ -802,1 +802,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
+                   </span>
@@ -803,1 +803,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+                 </div>
@@ -804,1 +804,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[11px]">وحدة القياس</span>
+                 <h3 className="font-bold text-stone-900 text-sm mt-3">{m.name || m.nameAr}</h3>
@@ -805,1 +805,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-bold text-stone-800">{m.unitOfMeasure === 'TON' ? 'طن متري' : m.unitOfMeasure}</span>
+                 <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
@@ -806,1 +806,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -807,1 +807,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+                     <span className="text-stone-400 block text-[11px]">وحدة القياس</span>
@@ -808,1 +808,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[11px]">الكثافة القياسية</span>
+                     <span className="font-bold text-stone-800">{m.unitOfMeasure === 'TON' ? 'طن متري' : m.unitOfMeasure}</span>
@@ -809,1 +809,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-mono font-bold text-stone-800">{m.standardDensityTonPerM3 || 1.6} طن/م³</span>
+                   </div>
@@ -810,1 +810,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -811,1 +811,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     <span className="text-stone-400 block text-[11px]">الكثافة القياسية</span>
@@ -812,1 +812,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                     <span className="font-mono font-bold text-stone-800">{m.standardDensityTonPerM3 || 1.6} طن/م³</span>
@@ -813,1 +813,1 @@ src/components/admin/AdminConsoleView.tsx
-             ))}
+                   </div>
@@ -814,1 +814,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 </div>
@@ -815,1 +815,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </div>
@@ -816,1 +816,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             ))}
@@ -817,1 +817,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -818,1 +818,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -819,1 +819,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 5. TRUCKS SECTION */}
+       )}
@@ -820,1 +820,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -821,1 +821,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'TRUCKS' && (
+       {/* ==================================================================== */}
@@ -822,1 +822,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 5. TRUCKS SECTION */}
@@ -823,1 +823,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -824,1 +824,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">أسطول الشاحنات والأوزان المعتمدة (Trucks & Tare Weights)</h2>
+       {activeSection === 'TRUCKS' && (
@@ -825,1 +825,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -826,1 +826,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
+           <div className="flex items-center justify-between">
@@ -827,1 +827,1 @@ src/components/admin/AdminConsoleView.tsx
-             <table className="w-full text-right border-collapse text-xs">
+             <h2 className="text-base font-bold text-stone-900">أسطول الشاحنات والأوزان المعتمدة (Trucks & Tare Weights)</h2>
@@ -828,1 +828,1 @@ src/components/admin/AdminConsoleView.tsx
-               <thead>
+           </div>
@@ -829,1 +829,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
+           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
@@ -830,1 +830,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">رقم الشاحنة</th>
+             <table className="w-full text-right border-collapse text-xs">
@@ -831,1 +831,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">رقم اللوحة</th>
+               <thead>
@@ -832,1 +832,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الناقل المالك</th>
+                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
@@ -833,1 +833,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">وزن الفارغ (Tare Kg)</th>
+                   <th className="py-3 px-4">رقم الشاحنة</th>
@@ -834,1 +834,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الوزن الأقصى (Gross)</th>
+                   <th className="py-3 px-4">رقم اللوحة</th>
@@ -835,1 +835,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الحمولة النظامية (Net)</th>
+                   <th className="py-3 px-4">الناقل المالك</th>
@@ -836,1 +836,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الحالة</th>
+                   <th className="py-3 px-4">وزن الفارغ (Tare Kg)</th>
@@ -837,1 +837,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </tr>
+                   <th className="py-3 px-4">الوزن الأقصى (Gross)</th>
@@ -838,1 +838,1 @@ src/components/admin/AdminConsoleView.tsx
-               </thead>
+                   <th className="py-3 px-4">الحمولة النظامية (Net)</th>
@@ -839,1 +839,1 @@ src/components/admin/AdminConsoleView.tsx
-               <tbody className="divide-y divide-stone-100">
+                   <th className="py-3 px-4">الحالة</th>
@@ -840,1 +840,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {trucks.map(t => (
+                 </tr>
@@ -841,1 +841,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <tr key={t.truckId} className="hover:bg-stone-50">
+               </thead>
@@ -842,1 +842,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono font-bold text-stone-800">{t.truckId}</td>
+               <tbody className="divide-y divide-stone-100">
@@ -843,1 +843,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-bold text-stone-900">{t.plate || t.plateNumberAr}</td>
+                 {trucks.map(t => (
@@ -844,1 +844,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 text-stone-600 font-medium">{t.carrierId}</td>
+                   <tr key={t.truckId} className="hover:bg-stone-50">
@@ -845,1 +845,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono font-semibold text-stone-800">
+                     <td className="py-3 px-4 font-mono font-bold text-stone-800">{t.truckId}</td>
@@ -846,1 +846,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {t.tareWeightKg?.toLocaleString()} كجم
+                     <td className="py-3 px-4 font-bold text-stone-900">{t.plate || t.plateNumberAr}</td>
@@ -847,1 +847,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                     <td className="py-3 px-4 text-stone-600 font-medium">{t.carrierId}</td>
@@ -848,1 +848,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-stone-700">
+                     <td className="py-3 px-4 font-mono font-semibold text-stone-800">
@@ -849,1 +849,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {t.maxGrossWeightKg?.toLocaleString()} كجم
+                       {t.tareWeightKg?.toLocaleString()} كجم
@@ -851,1 +851,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono font-bold text-emerald-800">
+                     <td className="py-3 px-4 font-mono text-stone-700">
@@ -852,1 +852,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {t.legalPayloadLimitKg?.toLocaleString()} كجم
+                       {t.maxGrossWeightKg?.toLocaleString()} كجم
@@ -854,1 +854,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4">
+                     <td className="py-3 px-4 font-mono font-bold text-emerald-800">
@@ -855,1 +855,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
+                       {t.legalPayloadLimitKg?.toLocaleString()} كجم
@@ -856,1 +856,1 @@ src/components/admin/AdminConsoleView.tsx
-                         t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
+                     </td>
@@ -857,1 +857,1 @@ src/components/admin/AdminConsoleView.tsx
-                       }`}>
+                     <td className="py-3 px-4">
@@ -858,1 +858,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {t.status === 'ACTIVE' ? 'نشط' : 'معطل'}
+                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
@@ -859,1 +859,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </span>
+                         t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
@@ -860,1 +860,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       }`}>
@@ -861,1 +861,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </tr>
+                         {t.status === 'ACTIVE' ? 'نشط' : 'معطل'}
@@ -862,1 +862,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ))}
+                       </span>
@@ -863,1 +863,1 @@ src/components/admin/AdminConsoleView.tsx
-               </tbody>
+                     </td>
@@ -864,1 +864,1 @@ src/components/admin/AdminConsoleView.tsx
-             </table>
+                   </tr>
@@ -865,1 +865,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 ))}
@@ -866,1 +866,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </tbody>
@@ -867,1 +867,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             </table>
@@ -868,1 +868,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -869,1 +869,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -870,1 +870,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 6. DRIVERS SECTION */}
+       )}
@@ -871,1 +871,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -872,1 +872,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'DRIVERS' && (
+       {/* ==================================================================== */}
@@ -873,1 +873,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 6. DRIVERS SECTION */}
@@ -874,1 +874,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -875,1 +875,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">سجل السائقين وتراخيص القيادة (Drivers Registry)</h2>
+       {activeSection === 'DRIVERS' && (
@@ -876,1 +876,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -877,1 +877,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
+           <div className="flex items-center justify-between">
@@ -878,1 +878,1 @@ src/components/admin/AdminConsoleView.tsx
-             <table className="w-full text-right border-collapse text-xs">
+             <h2 className="text-base font-bold text-stone-900">سجل السائقين وتراخيص القيادة (Drivers Registry)</h2>
@@ -879,1 +879,1 @@ src/components/admin/AdminConsoleView.tsx
-               <thead>
+           </div>
@@ -880,1 +880,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
+           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
@@ -881,1 +881,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">رقم السائق</th>
+             <table className="w-full text-right border-collapse text-xs">
@@ -882,1 +882,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">اسم السائق</th>
+               <thead>
@@ -883,1 +883,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الهوية الوطنية / الإقامة</th>
+                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
@@ -884,1 +884,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الجوال</th>
+                   <th className="py-3 px-4">رقم السائق</th>
@@ -885,1 +885,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الناقل</th>
+                   <th className="py-3 px-4">اسم السائق</th>
@@ -886,1 +886,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الشاحنة المعينة</th>
+                   <th className="py-3 px-4">الهوية الوطنية / الإقامة</th>
@@ -887,1 +887,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الحالة</th>
+                   <th className="py-3 px-4">الجوال</th>
@@ -888,1 +888,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </tr>
+                   <th className="py-3 px-4">الناقل</th>
@@ -889,1 +889,1 @@ src/components/admin/AdminConsoleView.tsx
-               </thead>
+                   <th className="py-3 px-4">الشاحنة المعينة</th>
@@ -890,1 +890,1 @@ src/components/admin/AdminConsoleView.tsx
-               <tbody className="divide-y divide-stone-100">
+                   <th className="py-3 px-4">الحالة</th>
@@ -891,1 +891,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {drivers.map(d => (
+                 </tr>
@@ -892,1 +892,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <tr key={d.driverId} className="hover:bg-stone-50">
+               </thead>
@@ -893,1 +893,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono font-bold text-stone-800">{d.driverId}</td>
+               <tbody className="divide-y divide-stone-100">
@@ -894,1 +894,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-semibold text-stone-900">{d.name || d.fullNameAr}</td>
+                 {drivers.map(d => (
@@ -895,1 +895,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-stone-600">{d.idNumber || d.nationalOrIqamaId}</td>
+                   <tr key={d.driverId} className="hover:bg-stone-50">
@@ -896,1 +896,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-stone-600">{d.phone}</td>
+                     <td className="py-3 px-4 font-mono font-bold text-stone-800">{d.driverId}</td>
@@ -897,1 +897,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 text-stone-700 font-medium">{d.carrierId}</td>
+                     <td className="py-3 px-4 font-semibold text-stone-900">{d.name || d.fullNameAr}</td>
@@ -898,1 +898,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-stone-700">{d.currentAssignedTruckId || '—'}</td>
+                     <td className="py-3 px-4 font-mono text-stone-600">{d.idNumber || d.nationalOrIqamaId}</td>
@@ -899,1 +899,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4">
+                     <td className="py-3 px-4 font-mono text-stone-600">{d.phone}</td>
@@ -900,1 +900,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
+                     <td className="py-3 px-4 text-stone-700 font-medium">{d.carrierId}</td>
@@ -901,1 +901,1 @@ src/components/admin/AdminConsoleView.tsx
-                         d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
+                     <td className="py-3 px-4 font-mono text-stone-700">{d.currentAssignedTruckId || '—'}</td>
@@ -902,1 +902,1 @@ src/components/admin/AdminConsoleView.tsx
-                       }`}>
+                     <td className="py-3 px-4">
@@ -903,1 +903,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {d.status === 'ACTIVE' ? 'نشط' : 'معطل'}
+                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
@@ -904,1 +904,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </span>
+                         d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
@@ -905,1 +905,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       }`}>
@@ -906,1 +906,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </tr>
+                         {d.status === 'ACTIVE' ? 'نشط' : 'معطل'}
@@ -907,1 +907,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ))}
+                       </span>
@@ -908,1 +908,1 @@ src/components/admin/AdminConsoleView.tsx
-               </tbody>
+                     </td>
@@ -909,1 +909,1 @@ src/components/admin/AdminConsoleView.tsx
-             </table>
+                   </tr>
@@ -910,1 +910,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 ))}
@@ -911,1 +911,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </tbody>
@@ -912,1 +912,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             </table>
@@ -913,1 +913,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -914,1 +914,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -915,1 +915,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 7. USERS SECTION */}
+       )}
@@ -916,1 +916,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -917,1 +917,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'USERS' && (
+       {/* ==================================================================== */}
@@ -918,1 +918,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 7. USERS SECTION */}
@@ -919,1 +919,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -920,1 +920,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">إدارة المستخدمين وصلاحيات الأدوار (RBAC Users)</h2>
+       {activeSection === 'USERS' && (
@@ -921,1 +921,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -922,1 +922,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
+           <div className="flex items-center justify-between">
@@ -923,1 +923,1 @@ src/components/admin/AdminConsoleView.tsx
-             <table className="w-full text-right border-collapse text-xs">
+             <h2 className="text-base font-bold text-stone-900">إدارة المستخدمين وصلاحيات الأدوار (RBAC Users)</h2>
@@ -924,1 +924,1 @@ src/components/admin/AdminConsoleView.tsx
-               <thead>
+           </div>
@@ -925,1 +925,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
+           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
@@ -926,1 +926,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">المعرف والاسم</th>
+             <table className="w-full text-right border-collapse text-xs">
@@ -927,1 +927,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">البريد الإلكتروني</th>
+               <thead>
@@ -928,1 +928,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الدور الوظيفي</th>
+                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
@@ -929,1 +929,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">المشاريع المسندة</th>
+                   <th className="py-3 px-4">المعرف والاسم</th>
@@ -930,1 +930,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الحالة</th>
+                   <th className="py-3 px-4">البريد الإلكتروني</th>
@@ -931,1 +931,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4 text-left">تعديل الدور</th>
+                   <th className="py-3 px-4">الدور الوظيفي</th>
@@ -932,1 +932,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </tr>
+                   <th className="py-3 px-4">المشاريع المسندة</th>
@@ -933,1 +933,1 @@ src/components/admin/AdminConsoleView.tsx
-               </thead>
+                   <th className="py-3 px-4">الحالة</th>
@@ -934,1 +934,1 @@ src/components/admin/AdminConsoleView.tsx
-               <tbody className="divide-y divide-stone-100">
+                   <th className="py-3 px-4 text-left">تعديل الدور</th>
@@ -935,1 +935,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {users.map(u => (
+                 </tr>
@@ -936,1 +936,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <tr key={u.userId} className="hover:bg-stone-50">
+               </thead>
@@ -937,1 +937,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3.5 px-4">
+               <tbody className="divide-y divide-stone-100">
@@ -938,1 +938,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="font-bold text-stone-900 block">{u.fullName}</span>
+                 {users.map(u => (
@@ -939,1 +939,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="font-mono text-[10px] text-stone-400">{u.userId}</span>
+                   <tr key={u.userId} className="hover:bg-stone-50">
@@ -940,1 +940,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                     <td className="py-3.5 px-4">
@@ -941,1 +941,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3.5 px-4 font-mono text-stone-600">{u.email}</td>
+                       <span className="font-bold text-stone-900 block">{u.fullName}</span>
@@ -942,1 +942,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3.5 px-4">
+                       <span className="font-mono text-[10px] text-stone-400">{u.userId}</span>
@@ -943,1 +943,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className={`px-2.5 py-0.8 rounded text-[11px] font-bold ${
+                     </td>
@@ -944,1 +944,1 @@ src/components/admin/AdminConsoleView.tsx
-                         u.role === 'PROJECT_ADMIN' ? 'bg-purple-100 text-purple-800' :
+                     <td className="py-3.5 px-4 font-mono text-stone-600">{u.email}</td>
@@ -945,1 +945,1 @@ src/components/admin/AdminConsoleView.tsx
-                         u.role === 'FINANCE_AUDITOR' ? 'bg-amber-100 text-amber-800' :
+                     <td className="py-3.5 px-4">
@@ -946,1 +946,1 @@ src/components/admin/AdminConsoleView.tsx
-                         u.role === 'DISPATCHER' ? 'bg-blue-100 text-blue-800' :
+                       <span className={`px-2.5 py-0.8 rounded text-[11px] font-bold ${
@@ -947,1 +947,1 @@ src/components/admin/AdminConsoleView.tsx
-                         'bg-stone-100 text-stone-700'
+                         u.role === 'PROJECT_ADMIN' ? 'bg-purple-100 text-purple-800' :
@@ -948,1 +948,1 @@ src/components/admin/AdminConsoleView.tsx
-                       }`}>
+                         u.role === 'FINANCE_AUDITOR' ? 'bg-amber-100 text-amber-800' :
@@ -949,1 +949,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {u.role}
+                         u.role === 'DISPATCHER' ? 'bg-blue-100 text-blue-800' :
@@ -950,1 +950,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </span>
+                         'bg-stone-100 text-stone-700'
@@ -951,1 +951,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       }`}>
@@ -952,1 +952,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3.5 px-4 text-stone-600">
+                         {u.role}
@@ -953,1 +953,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {u.assignedProjectIds.join(', ')}
+                       </span>
@@ -955,1 +955,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3.5 px-4">
+                     <td className="py-3.5 px-4 text-stone-600">
@@ -956,1 +956,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
+                       {u.assignedProjectIds.join(', ')}
@@ -957,1 +957,1 @@ src/components/admin/AdminConsoleView.tsx
-                         u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
+                     </td>
@@ -958,1 +958,1 @@ src/components/admin/AdminConsoleView.tsx
-                       }`}>
+                     <td className="py-3.5 px-4">
@@ -959,1 +959,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {u.isActive ? 'نشط' : 'معطل'}
+                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
@@ -960,1 +960,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </span>
+                         u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
@@ -961,1 +961,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       }`}>
@@ -962,1 +962,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3.5 px-4 text-left">
+                         {u.isActive ? 'نشط' : 'معطل'}
@@ -963,1 +963,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <select
+                       </span>
@@ -964,1 +964,1 @@ src/components/admin/AdminConsoleView.tsx
-                         value={u.role}
+                     </td>
@@ -965,1 +965,1 @@ src/components/admin/AdminConsoleView.tsx
-                         onChange={(e) => adminConsoleService.updateUserRole(u.userId, e.target.value as any, authContext)}
+                     <td className="py-3.5 px-4 text-left">
@@ -966,1 +966,1 @@ src/components/admin/AdminConsoleView.tsx
-                         className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-[11px] font-semibold text-stone-800 focus:outline-none"
+                       <select
@@ -967,1 +967,1 @@ src/components/admin/AdminConsoleView.tsx
-                       >
+                         value={u.role}
@@ -968,1 +968,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
+                         onChange={(e) => adminConsoleService.updateUserRole(u.userId, e.target.value as any, authContext)}
@@ -969,1 +969,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <option value="DISPATCHER">DISPATCHER</option>
+                         className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-[11px] font-semibold text-stone-800 focus:outline-none"
@@ -970,1 +970,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <option value="FINANCE_AUDITOR">FINANCE_AUDITOR</option>
+                       >
@@ -971,1 +971,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <option value="VIEWER">VIEWER</option>
+                         <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
@@ -972,1 +972,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </select>
+                         <option value="DISPATCHER">DISPATCHER</option>
@@ -973,1 +973,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                         <option value="FINANCE_AUDITOR">FINANCE_AUDITOR</option>
@@ -974,1 +974,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </tr>
+                         <option value="VIEWER">VIEWER</option>
@@ -975,1 +975,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ))}
+                       </select>
@@ -976,1 +976,1 @@ src/components/admin/AdminConsoleView.tsx
-               </tbody>
+                     </td>
@@ -977,1 +977,1 @@ src/components/admin/AdminConsoleView.tsx
-             </table>
+                   </tr>
@@ -978,1 +978,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 ))}
@@ -979,1 +979,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </tbody>
@@ -980,1 +980,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             </table>
@@ -981,1 +981,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -982,1 +982,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -983,1 +983,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 8. EXCEPTIONS SECTION */}
+       )}
@@ -984,1 +984,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -985,1 +985,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'EXCEPTIONS' && (
+       {/* ==================================================================== */}
@@ -986,1 +986,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 8. EXCEPTIONS SECTION */}
@@ -987,1 +987,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -988,1 +988,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">الاستثناءات والتعارضات التشغيلية (Exceptions Engine)</h2>
+       {activeSection === 'EXCEPTIONS' && (
@@ -989,1 +989,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -990,1 +990,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="space-y-3">
+           <div className="flex items-center justify-between">
@@ -991,1 +991,1 @@ src/components/admin/AdminConsoleView.tsx
-             {exceptions.map(exc => (
+             <h2 className="text-base font-bold text-stone-900">الاستثناءات والتعارضات التشغيلية (Exceptions Engine)</h2>
@@ -992,1 +992,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div key={exc.exceptionId} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
+           </div>
@@ -993,1 +993,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="flex items-start justify-between">
+           <div className="space-y-3">
@@ -994,1 +994,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div className="flex items-center gap-2">
+             {exceptions.map(exc => (
@@ -995,1 +995,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-mono font-bold text-xs text-stone-900">{exc.exceptionId}</span>
+               <div key={exc.exceptionId} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
@@ -996,1 +996,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
+                 <div className="flex items-start justify-between">
@@ -997,1 +997,1 @@ src/components/admin/AdminConsoleView.tsx
-                       exc.severity === 'BLOCKING' || exc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
+                   <div className="flex items-center gap-2">
@@ -998,1 +998,1 @@ src/components/admin/AdminConsoleView.tsx
-                       exc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
+                     <span className="font-mono font-bold text-xs text-stone-900">{exc.exceptionId}</span>
@@ -999,1 +999,1 @@ src/components/admin/AdminConsoleView.tsx
-                     }`}>
+                     <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
@@ -1000,1 +1000,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {exc.severity}
+                       exc.severity === 'BLOCKING' || exc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
@@ -1001,1 +1001,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </span>
+                       exc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
@@ -1002,1 +1002,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-xs font-semibold text-stone-700">{exc.type}</span>
+                     }`}>
@@ -1003,1 +1003,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                       {exc.severity}
@@ -1004,1 +1004,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
+                     </span>
@@ -1005,1 +1005,1 @@ src/components/admin/AdminConsoleView.tsx
-                     exc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
+                     <span className="text-xs font-semibold text-stone-700">{exc.type}</span>
@@ -1006,1 +1006,1 @@ src/components/admin/AdminConsoleView.tsx
-                     exc.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
+                   </div>
@@ -1007,1 +1007,1 @@ src/components/admin/AdminConsoleView.tsx
-                   }`}>
+                   <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
@@ -1008,1 +1008,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {exc.status}
+                     exc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
@@ -1009,1 +1009,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </span>
+                     exc.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
@@ -1010,1 +1010,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                   }`}>
@@ -1011,1 +1011,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <p className="text-xs text-stone-800 mt-2 font-medium">{exc.description}</p>
+                     {exc.status}
@@ -1012,1 +1012,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {exc.resolutionNote && (
+                   </span>
@@ -1013,1 +1013,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs border border-emerald-200/60">
+                 </div>
@@ -1014,1 +1014,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <strong>قرار المعالجة:</strong> {exc.resolutionNote}
+                 <p className="text-xs text-stone-800 mt-2 font-medium">{exc.description}</p>
@@ -1015,1 +1015,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                 {exc.resolutionNote && (
@@ -1016,1 +1016,1 @@ src/components/admin/AdminConsoleView.tsx
-                 )}
+                   <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs border border-emerald-200/60">
@@ -1017,1 +1017,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                     <strong>قرار المعالجة:</strong> {exc.resolutionNote}
@@ -1018,1 +1018,1 @@ src/components/admin/AdminConsoleView.tsx
-             ))}
+                   </div>
@@ -1019,1 +1019,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 )}
@@ -1020,1 +1020,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </div>
@@ -1021,1 +1021,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             ))}
@@ -1022,1 +1022,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -1023,1 +1023,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -1024,1 +1024,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 9. AUDIT LOGS SECTION */}
+       )}
@@ -1025,1 +1025,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -1026,1 +1026,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'AUDIT_LOGS' && (
+       {/* ==================================================================== */}
@@ -1027,1 +1027,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 9. AUDIT LOGS SECTION */}
@@ -1028,1 +1028,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -1029,1 +1029,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">سجل التدقيق الشامل غير القابل للتعديل (System Audit Trail)</h2>
+       {activeSection === 'AUDIT_LOGS' && (
@@ -1030,1 +1030,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -1031,1 +1031,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
+           <div className="flex items-center justify-between">
@@ -1032,1 +1032,1 @@ src/components/admin/AdminConsoleView.tsx
-             <table className="w-full text-right border-collapse text-xs">
+             <h2 className="text-base font-bold text-stone-900">سجل التدقيق الشامل غير القابل للتعديل (System Audit Trail)</h2>
@@ -1033,1 +1033,1 @@ src/components/admin/AdminConsoleView.tsx
-               <thead>
+           </div>
@@ -1034,1 +1034,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
+           <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
@@ -1035,1 +1035,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">رقم القيد والتاريخ</th>
+             <table className="w-full text-right border-collapse text-xs">
@@ -1036,1 +1036,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">نوع الكيان</th>
+               <thead>
@@ -1037,1 +1037,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الإجراء</th>
+                 <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
@@ -1038,1 +1038,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">المنفذ</th>
+                   <th className="py-3 px-4">رقم القيد والتاريخ</th>
@@ -1039,1 +1039,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <th className="py-3 px-4">الحقول المعدلة (Delta)</th>
+                   <th className="py-3 px-4">نوع الكيان</th>
@@ -1040,1 +1040,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </tr>
+                   <th className="py-3 px-4">الإجراء</th>
@@ -1041,1 +1041,1 @@ src/components/admin/AdminConsoleView.tsx
-               </thead>
+                   <th className="py-3 px-4">المنفذ</th>
@@ -1042,1 +1042,1 @@ src/components/admin/AdminConsoleView.tsx
-               <tbody className="divide-y divide-stone-100">
+                   <th className="py-3 px-4">الحقول المعدلة (Delta)</th>
@@ -1043,1 +1043,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {auditLogs.map(log => (
+                 </tr>
@@ -1044,1 +1044,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <tr key={log.auditLogId} className="hover:bg-stone-50">
+               </thead>
@@ -1045,1 +1045,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4">
+               <tbody className="divide-y divide-stone-100">
@@ -1046,1 +1046,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="font-mono font-bold text-stone-800 block text-[11px]">{log.auditLogId}</span>
+                 {auditLogs.map(log => (
@@ -1047,1 +1047,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="text-[10px] text-stone-400 font-mono">{new Date(log.createdAt as any).toLocaleString('ar-SA')}</span>
+                   <tr key={log.auditLogId} className="hover:bg-stone-50">
@@ -1048,1 +1048,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                     <td className="py-3 px-4">
@@ -1049,1 +1049,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-semibold text-stone-800">{log.entityType} ({log.entityId})</td>
+                       <span className="font-mono font-bold text-stone-800 block text-[11px]">{log.auditLogId}</span>
@@ -1050,1 +1050,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4">
+                       <span className="text-[10px] text-stone-400 font-mono">{new Date(log.createdAt as any).toLocaleString('ar-SA')}</span>
@@ -1051,1 +1051,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
+                     </td>
@@ -1052,1 +1052,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {log.action}
+                     <td className="py-3 px-4 font-semibold text-stone-800">{log.entityType} ({log.entityId})</td>
@@ -1053,1 +1053,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </span>
+                     <td className="py-3 px-4">
@@ -1054,1 +1054,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
@@ -1055,1 +1055,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 text-stone-700">
+                         {log.action}
@@ -1056,1 +1056,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="font-medium block">{log.actor.userId}</span>
+                       </span>
@@ -1057,1 +1057,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <span className="text-[10px] text-stone-400">{log.actor.role}</span>
+                     </td>
@@ -1058,1 +1058,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </td>
+                     <td className="py-3 px-4 text-stone-700">
@@ -1059,1 +1059,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
+                       <span className="font-medium block">{log.actor.userId}</span>
@@ -1060,1 +1060,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {log.changes.deltaFields.join(', ') || '—'}
+                       <span className="text-[10px] text-stone-400">{log.actor.role}</span>
@@ -1062,1 +1062,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </tr>
+                     <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
@@ -1063,1 +1063,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ))}
+                       {log.changes.deltaFields.join(', ') || '—'}
@@ -1064,1 +1064,1 @@ src/components/admin/AdminConsoleView.tsx
-               </tbody>
+                     </td>
@@ -1065,1 +1065,1 @@ src/components/admin/AdminConsoleView.tsx
-             </table>
+                   </tr>
@@ -1066,1 +1066,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 ))}
@@ -1067,1 +1067,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </tbody>
@@ -1068,1 +1068,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             </table>
@@ -1069,1 +1069,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -1070,1 +1070,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -1071,1 +1071,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 10. IMPORT BATCHES SECTION */}
+       )}
@@ -1072,1 +1072,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -1073,1 +1073,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'IMPORT_BATCHES' && (
+       {/* ==================================================================== */}
@@ -1074,1 +1074,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-4">
+       {/* 10. IMPORT BATCHES SECTION */}
@@ -1075,1 +1075,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -1076,1 +1076,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">سجل دفعات الاستيراد المجمعة (Import Batches)</h2>
+       {activeSection === 'IMPORT_BATCHES' && (
@@ -1077,1 +1077,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-4">
@@ -1078,1 +1078,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+           <div className="flex items-center justify-between">
@@ -1079,1 +1079,1 @@ src/components/admin/AdminConsoleView.tsx
-             {importBatches.map(b => (
+             <h2 className="text-base font-bold text-stone-900">سجل دفعات الاستيراد المجمعة (Import Batches)</h2>
@@ -1080,1 +1080,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div key={b.batchId} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
+           </div>
@@ -1081,1 +1081,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="flex items-start justify-between">
+           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
@@ -1082,1 +1082,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div>
+             {importBatches.map(b => (
@@ -1083,1 +1083,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-mono text-xs font-bold text-stone-900">{b.batchId}</span>
+               <div key={b.batchId} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
@@ -1084,1 +1084,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <h3 className="font-bold text-stone-800 text-sm mt-1">{b.sourceFileName}</h3>
+                 <div className="flex items-start justify-between">
@@ -1085,1 +1085,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div>
@@ -1086,1 +1086,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
+                     <span className="font-mono text-xs font-bold text-stone-900">{b.batchId}</span>
@@ -1087,1 +1087,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {b.status}
+                     <h3 className="font-bold text-stone-800 text-sm mt-1">{b.sourceFileName}</h3>
@@ -1088,1 +1088,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </span>
+                   </div>
@@ -1089,1 +1089,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                   <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
@@ -1090,1 +1090,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
+                     {b.status}
@@ -1091,1 +1091,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div className="p-2 bg-stone-50 rounded-lg">
+                   </span>
@@ -1092,1 +1092,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-stone-400 block text-[10px]">إجمالي السجلات</span>
+                 </div>
@@ -1093,1 +1093,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-bold text-sm text-stone-900">{b.totalRecords}</span>
+                 <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
@@ -1094,1 +1094,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div className="p-2 bg-stone-50 rounded-lg">
@@ -1095,1 +1095,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div className="p-2 bg-emerald-50 rounded-lg">
+                     <span className="text-stone-400 block text-[10px]">إجمالي السجلات</span>
@@ -1096,1 +1096,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-emerald-700 block text-[10px]">المعالجة بنجاح</span>
+                     <span className="font-bold text-sm text-stone-900">{b.totalRecords}</span>
@@ -1097,1 +1097,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-bold text-sm text-emerald-800">{b.processedRecords}</span>
+                   </div>
@@ -1098,1 +1098,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div className="p-2 bg-emerald-50 rounded-lg">
@@ -1099,1 +1099,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div className="p-2 bg-rose-50 rounded-lg">
+                     <span className="text-emerald-700 block text-[10px]">المعالجة بنجاح</span>
@@ -1100,1 +1100,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="text-rose-700 block text-[10px]">المرفوضة</span>
+                     <span className="font-bold text-sm text-emerald-800">{b.processedRecords}</span>
@@ -1101,1 +1101,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="font-bold text-sm text-rose-800">{b.failedRecords}</span>
+                   </div>
@@ -1102,1 +1102,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                   <div className="p-2 bg-rose-50 rounded-lg">
@@ -1103,1 +1103,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     <span className="text-rose-700 block text-[10px]">المرفوضة</span>
@@ -1104,1 +1104,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                     <span className="font-bold text-sm text-rose-800">{b.failedRecords}</span>
@@ -1105,1 +1105,1 @@ src/components/admin/AdminConsoleView.tsx
-             ))}
+                   </div>
@@ -1106,1 +1106,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+                 </div>
@@ -1107,1 +1107,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               </div>
@@ -1108,1 +1108,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             ))}
@@ -1109,1 +1109,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -1110,1 +1110,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -1111,1 +1111,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* 11. SYNC HEALTH SECTION */}
+       )}
@@ -1112,1 +1112,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -1113,1 +1113,1 @@ src/components/admin/AdminConsoleView.tsx
-       {activeSection === 'SYNC_HEALTH' && (
+       {/* ==================================================================== */}
@@ -1114,1 +1114,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="space-y-6">
+       {/* 11. SYNC HEALTH SECTION */}
@@ -1115,1 +1115,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="flex items-center justify-between">
+       {/* ==================================================================== */}
@@ -1116,1 +1116,1 @@ src/components/admin/AdminConsoleView.tsx
-             <h2 className="text-base font-bold text-stone-900">صحة المزامنة السحابية وقاعدة البيانات (Sync Health Monitor)</h2>
+       {activeSection === 'SYNC_HEALTH' && (
@@ -1117,1 +1117,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+         <div className="space-y-6">
@@ -1118,1 +1118,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           <div className="flex items-center justify-between">
@@ -1119,1 +1119,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
+             <h2 className="text-base font-bold text-stone-900">صحة المزامنة السحابية وقاعدة البيانات (Sync Health Monitor)</h2>
@@ -1120,1 +1120,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
+           </div>
@@ -1121,1 +1121,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="flex items-center justify-between">
+ 
@@ -1122,1 +1122,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <span className="text-xs font-semibold text-stone-500">حالة قاعدة بيانات Firestore</span>
+           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
@@ -1123,1 +1123,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
+             <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
@@ -1124,1 +1124,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+               <div className="flex items-center justify-between">
@@ -1125,1 +1125,1 @@ src/components/admin/AdminConsoleView.tsx
-               <p className="text-xl font-bold text-stone-900 mt-2">{syncHealth.firestoreStatus}</p>
+                 <span className="text-xs font-semibold text-stone-500">حالة قاعدة بيانات Firestore</span>
@@ -1126,1 +1126,1 @@ src/components/admin/AdminConsoleView.tsx
-               <p className="text-[11px] text-stone-400 font-mono mt-1">{syncHealth.databaseId}</p>
+                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
@@ -1127,1 +1127,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               </div>
@@ -1128,1 +1128,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               <p className="text-xl font-bold text-stone-900 mt-2">{syncHealth.firestoreStatus}</p>
@@ -1129,1 +1129,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
+               <p className="text-[11px] text-stone-400 font-mono mt-1">{syncHealth.databaseId}</p>
@@ -1130,1 +1130,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="flex items-center justify-between">
+             </div>
@@ -1131,1 +1131,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <span className="text-xs font-semibold text-stone-500">تكامل Google Workspace</span>
+ 
@@ -1132,1 +1132,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
+             <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
@@ -1133,1 +1133,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+               <div className="flex items-center justify-between">
@@ -1134,1 +1134,1 @@ src/components/admin/AdminConsoleView.tsx
-               <p className="text-xl font-bold text-stone-900 mt-2">{syncHealth.googleWorkspaceStatus}</p>
+                 <span className="text-xs font-semibold text-stone-500">تكامل Google Workspace</span>
@@ -1135,1 +1135,1 @@ src/components/admin/AdminConsoleView.tsx
-               <p className="text-[11px] text-stone-500 mt-1">Sheets & Drive Projections Ready</p>
+                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
@@ -1136,1 +1136,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               </div>
@@ -1137,1 +1137,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               <p className="text-xl font-bold text-stone-900 mt-2">{syncHealth.googleWorkspaceStatus}</p>
@@ -1138,1 +1138,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
+               <p className="text-[11px] text-stone-500 mt-1">Sheets & Drive Projections Ready</p>
@@ -1139,1 +1139,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="flex items-center justify-between">
+             </div>
@@ -1140,1 +1140,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <span className="text-xs font-semibold text-stone-500">العمليات المعلقة في Outbox</span>
+ 
@@ -1141,1 +1141,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <Activity className="w-5 h-5 text-stone-400" />
+             <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
@@ -1142,1 +1142,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+               <div className="flex items-center justify-between">
@@ -1143,1 +1143,1 @@ src/components/admin/AdminConsoleView.tsx
-               <p className="text-xl font-bold text-emerald-700 mt-2">{syncHealth.pendingOutboxCount} عمليات</p>
+                 <span className="text-xs font-semibold text-stone-500">العمليات المعلقة في Outbox</span>
@@ -1144,1 +1144,1 @@ src/components/admin/AdminConsoleView.tsx
-               <p className="text-[11px] text-stone-500 mt-1">كافة البيانات متزامنة محلياً وسحابياً</p>
+                 <Activity className="w-5 h-5 text-stone-400" />
@@ -1145,1 +1145,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               </div>
@@ -1146,1 +1146,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+               <p className="text-xl font-bold text-emerald-700 mt-2">{syncHealth.pendingOutboxCount} عمليات</p>
@@ -1147,1 +1147,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+               <p className="text-[11px] text-stone-500 mt-1">كافة البيانات متزامنة محلياً وسحابياً</p>
@@ -1148,1 +1148,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+             </div>
@@ -1149,1 +1149,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+           </div>
@@ -1150,1 +1150,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+         </div>
@@ -1151,1 +1151,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* MODAL: PRICING RULE VERSIONING (COPY-ON-WRITE) */}
+       )}
@@ -1152,1 +1152,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+ 
@@ -1153,1 +1153,1 @@ src/components/admin/AdminConsoleView.tsx
-       {isVersionModalOpen && editingRule && (
+       {/* ==================================================================== */}
@@ -1154,1 +1154,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
+       {/* MODAL: PRICING RULE VERSIONING (COPY-ON-WRITE) */}
@@ -1155,1 +1155,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
+       {/* ==================================================================== */}
@@ -1156,1 +1156,1 @@ src/components/admin/AdminConsoleView.tsx
-             
+       {isVersionModalOpen && editingRule && (
@@ -1157,1 +1157,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* Modal Header */}
+         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
@@ -1158,1 +1158,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="p-6 border-b border-stone-100 flex items-center justify-between">
+           <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
@@ -1159,1 +1159,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div>
+             
@@ -1160,1 +1160,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
+             {/* Modal Header */}
@@ -1161,1 +1161,1 @@ src/components/admin/AdminConsoleView.tsx
-                   إنشاء نسخة جديدة v{(editingRule.version || 1) + 1}
+             <div className="p-6 border-b border-stone-100 flex items-center justify-between">
@@ -1162,1 +1162,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </span>
+               <div>
@@ -1163,1 +1163,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <h3 className="text-lg font-black text-stone-900 mt-1.5">
+                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
@@ -1164,1 +1164,1 @@ src/components/admin/AdminConsoleView.tsx
-                   تعديل قاعدة التسعير: {editingRule.carrierName}
+                   إنشاء نسخة جديدة v{(editingRule.version || 1) + 1}
@@ -1165,1 +1165,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </h3>
+                 </span>
@@ -1166,1 +1166,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                 <h3 className="text-lg font-black text-stone-900 mt-1.5">
@@ -1167,1 +1167,1 @@ src/components/admin/AdminConsoleView.tsx
-               <button
+                   تعديل قاعدة التسعير: {editingRule.carrierName}
@@ -1168,1 +1168,1 @@ src/components/admin/AdminConsoleView.tsx
-                 onClick={() => setIsVersionModalOpen(false)}
+                 </h3>
@@ -1169,1 +1169,1 @@ src/components/admin/AdminConsoleView.tsx
-                 className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1"
+               </div>
@@ -1170,1 +1170,1 @@ src/components/admin/AdminConsoleView.tsx
-               >
+               <button
@@ -1171,1 +1171,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ✕
+                 onClick={() => setIsVersionModalOpen(false)}
@@ -1172,1 +1172,1 @@ src/components/admin/AdminConsoleView.tsx
-               </button>
+                 className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1"
@@ -1173,1 +1173,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               >
@@ -1174,1 +1174,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 ✕
@@ -1175,1 +1175,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* Immutability Notice */}
+               </button>
@@ -1176,1 +1176,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="p-4 mx-6 mt-6 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
+             </div>
@@ -1177,1 +1177,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="flex items-center gap-2 font-bold mb-1">
+ 
@@ -1178,1 +1178,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <ShieldCheck className="w-4 h-4 text-amber-700" />
+             {/* Immutability Notice */}
@@ -1179,1 +1179,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <span>ضمان الحصانة التاريخية (Historical Immutability):</span>
+             <div className="p-4 mx-6 mt-6 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
@@ -1180,1 +1180,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+               <div className="flex items-center gap-2 font-bold mb-1">
@@ -1181,1 +1181,1 @@ src/components/admin/AdminConsoleView.tsx
-               لن يتم تعديل أي رحلة سابقة تم تسجيلها بهذه التعرفة (محمية: {adminConsoleService.countHistoricalTripsForRule(editingRule.pricingRuleId)} رحلة سابقة). سيتم إغلاق النسخة القديمة وإنشاء نسخة تسعير جديدة تسري من تاريخ النفاذ المحدد.
+                 <ShieldCheck className="w-4 h-4 text-amber-700" />
@@ -1182,1 +1182,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                 <span>ضمان الحصانة التاريخية (Historical Immutability):</span>
@@ -1183,1 +1183,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               </div>
@@ -1184,1 +1184,1 @@ src/components/admin/AdminConsoleView.tsx
-             {/* Form */}
+               لن يتم تعديل أي رحلة سابقة تم تسجيلها بهذه التعرفة (محمية: {adminConsoleService.countHistoricalTripsForRule(editingRule.pricingRuleId)} رحلة سابقة). سيتم إغلاق النسخة القديمة وإنشاء نسخة تسعير جديدة تسري من تاريخ النفاذ المحدد.
@@ -1185,1 +1185,1 @@ src/components/admin/AdminConsoleView.tsx
-             <form onSubmit={handleSubmitVersioning} className="p-6 space-y-4 text-xs">
+             </div>
@@ -1186,1 +1186,1 @@ src/components/admin/AdminConsoleView.tsx
-               
+ 
@@ -1187,1 +1187,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
+             {/* Form */}
@@ -1188,1 +1188,1 @@ src/components/admin/AdminConsoleView.tsx
-                 
+             <form onSubmit={handleSubmitVersioning} className="p-6 space-y-4 text-xs">
@@ -1189,1 +1189,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Carrier Name */}
+               
@@ -1190,1 +1190,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
@@ -1191,1 +1191,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم الناقل</label>
+                 
@@ -1192,1 +1192,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <select
+                 {/* Carrier Name */}
@@ -1193,1 +1193,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.carrierId}
+                 <div>
@@ -1194,1 +1194,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => {
+                   <label className="block font-bold text-stone-700 mb-1">اسم الناقل</label>
@@ -1195,1 +1195,1 @@ src/components/admin/AdminConsoleView.tsx
-                       const sel = carriers.find(c => c.carrierId === e.target.value);
+                   <select
@@ -1196,1 +1196,1 @@ src/components/admin/AdminConsoleView.tsx
-                       setVersionFormData({
+                     value={versionFormData.carrierId}
@@ -1197,1 +1197,1 @@ src/components/admin/AdminConsoleView.tsx
-                         ...versionFormData,
+                     onChange={(e) => {
@@ -1198,1 +1198,1 @@ src/components/admin/AdminConsoleView.tsx
-                         carrierId: e.target.value,
+                       const sel = carriers.find(c => c.carrierId === e.target.value);
@@ -1199,1 +1199,1 @@ src/components/admin/AdminConsoleView.tsx
-                         carrierName: sel?.name || sel?.companyNameAr || e.target.value,
+                       setVersionFormData({
@@ -1200,1 +1200,1 @@ src/components/admin/AdminConsoleView.tsx
-                       });
+                         ...versionFormData,
@@ -1201,1 +1201,1 @@ src/components/admin/AdminConsoleView.tsx
-                     }}
+                         carrierId: e.target.value,
@@ -1202,1 +1202,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
+                         carrierName: sel?.name || sel?.companyNameAr || e.target.value,
@@ -1203,1 +1203,1 @@ src/components/admin/AdminConsoleView.tsx
-                     required
+                       });
@@ -1204,1 +1204,1 @@ src/components/admin/AdminConsoleView.tsx
-                   >
+                     }}
@@ -1205,1 +1205,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {carriers.map(c => (
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
@@ -1206,1 +1206,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <option key={c.carrierId} value={c.carrierId}>{c.name || c.companyNameAr}</option>
+                     required
@@ -1207,1 +1207,1 @@ src/components/admin/AdminConsoleView.tsx
-                     ))}
+                   >
@@ -1208,1 +1208,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </select>
+                     {carriers.map(c => (
@@ -1209,1 +1209,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                       <option key={c.carrierId} value={c.carrierId}>{c.name || c.companyNameAr}</option>
@@ -1210,1 +1210,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     ))}
@@ -1211,1 +1211,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Pricing Type */}
+                   </select>
@@ -1212,1 +1212,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1213,1 +1213,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">نوع التسعير</label>
+ 
@@ -1214,1 +1214,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <select
+                 {/* Pricing Type */}
@@ -1215,1 +1215,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.pricingType}
+                 <div>
@@ -1216,1 +1216,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => setVersionFormData({ ...versionFormData, pricingType: e.target.value as any })}
+                   <label className="block font-bold text-stone-700 mb-1">نوع التسعير</label>
@@ -1217,1 +1217,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
+                   <select
@@ -1218,1 +1218,1 @@ src/components/admin/AdminConsoleView.tsx
-                     required
+                     value={versionFormData.pricingType}
@@ -1219,1 +1219,1 @@ src/components/admin/AdminConsoleView.tsx
-                   >
+                     onChange={(e) => setVersionFormData({ ...versionFormData, pricingType: e.target.value as any })}
@@ -1220,1 +1220,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="PER_TON">بالطن المتري (PER_TON)</option>
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
@@ -1221,1 +1221,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="PER_TRIP">بالرد / مقطوعية (PER_TRIP)</option>
+                     required
@@ -1222,1 +1222,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="PER_KM">بالكيلومتر (PER_KM)</option>
+                   >
@@ -1223,1 +1223,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="FLAT_RATE">مقطوعية ثابتة (FLAT_RATE)</option>
+                     <option value="PER_TON">بالطن المتري (PER_TON)</option>
@@ -1224,1 +1224,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </select>
+                     <option value="PER_TRIP">بالرد / مقطوعية (PER_TRIP)</option>
@@ -1225,1 +1225,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     <option value="PER_KM">بالكيلومتر (PER_KM)</option>
@@ -1226,1 +1226,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     <option value="FLAT_RATE">مقطوعية ثابتة (FLAT_RATE)</option>
@@ -1227,1 +1227,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Price / Rate */}
+                   </select>
@@ -1228,1 +1228,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1229,1 +1229,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">السعر التعاقدي الجديد</label>
+ 
@@ -1230,1 +1230,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <div className="relative">
+                 {/* Price / Rate */}
@@ -1231,1 +1231,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <input
+                 <div>
@@ -1232,1 +1232,1 @@ src/components/admin/AdminConsoleView.tsx
-                       type="number"
+                   <label className="block font-bold text-stone-700 mb-1">السعر التعاقدي الجديد</label>
@@ -1233,1 +1233,1 @@ src/components/admin/AdminConsoleView.tsx
-                       step="0.01"
+                   <div className="relative">
@@ -1234,1 +1234,1 @@ src/components/admin/AdminConsoleView.tsx
-                       min="0.01"
+                     <input
@@ -1235,1 +1235,1 @@ src/components/admin/AdminConsoleView.tsx
-                       value={versionFormData.agreedRate}
+                       type="number"
@@ -1236,1 +1236,1 @@ src/components/admin/AdminConsoleView.tsx
-                       onChange={(e) => setVersionFormData({ ...versionFormData, agreedRate: parseFloat(e.target.value) || 0 })}
+                       step="0.01"
@@ -1237,1 +1237,1 @@ src/components/admin/AdminConsoleView.tsx
-                       className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-stone-900"
+                       min="0.01"
@@ -1238,1 +1238,1 @@ src/components/admin/AdminConsoleView.tsx
-                       required
+                       value={versionFormData.agreedRate}
@@ -1239,1 +1239,1 @@ src/components/admin/AdminConsoleView.tsx
-                     />
+                       onChange={(e) => setVersionFormData({ ...versionFormData, agreedRate: parseFloat(e.target.value) || 0 })}
@@ -1240,1 +1240,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">
+                       className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-stone-900"
@@ -1241,1 +1241,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {versionFormData.currency}
+                       required
@@ -1242,1 +1242,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </span>
+                     />
@@ -1243,1 +1243,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </div>
+                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">
@@ -1244,1 +1244,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                       {versionFormData.currency}
@@ -1245,1 +1245,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     </span>
@@ -1246,1 +1246,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Currency */}
+                   </div>
@@ -1247,1 +1247,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1248,1 +1248,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">العملة</label>
+ 
@@ -1249,1 +1249,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <input
+                 {/* Currency */}
@@ -1250,1 +1250,1 @@ src/components/admin/AdminConsoleView.tsx
-                     type="text"
+                 <div>
@@ -1251,1 +1251,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.currency}
+                   <label className="block font-bold text-stone-700 mb-1">العملة</label>
@@ -1252,1 +1252,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => setVersionFormData({ ...versionFormData, currency: e.target.value })}
+                   <input
@@ -1253,1 +1253,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-stone-800"
+                     type="text"
@@ -1254,1 +1254,1 @@ src/components/admin/AdminConsoleView.tsx
-                     required
+                     value={versionFormData.currency}
@@ -1255,1 +1255,1 @@ src/components/admin/AdminConsoleView.tsx
-                   />
+                     onChange={(e) => setVersionFormData({ ...versionFormData, currency: e.target.value })}
@@ -1256,1 +1256,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-stone-800"
@@ -1257,1 +1257,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     required
@@ -1258,1 +1258,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Optional Material */}
+                   />
@@ -1259,1 +1259,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1260,1 +1260,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">المادة الاختيارية (Material)</label>
+ 
@@ -1261,1 +1261,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <select
+                 {/* Optional Material */}
@@ -1262,1 +1262,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.materialId}
+                 <div>
@@ -1263,1 +1263,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => {
+                   <label className="block font-bold text-stone-700 mb-1">المادة الاختيارية (Material)</label>
@@ -1264,1 +1264,1 @@ src/components/admin/AdminConsoleView.tsx
-                       const sel = materials.find(m => m.materialId === e.target.value);
+                   <select
@@ -1265,1 +1265,1 @@ src/components/admin/AdminConsoleView.tsx
-                       setVersionFormData({
+                     value={versionFormData.materialId}
@@ -1266,1 +1266,1 @@ src/components/admin/AdminConsoleView.tsx
-                         ...versionFormData,
+                     onChange={(e) => {
@@ -1267,1 +1267,1 @@ src/components/admin/AdminConsoleView.tsx
-                         materialId: e.target.value,
+                       const sel = materials.find(m => m.materialId === e.target.value);
@@ -1268,1 +1268,1 @@ src/components/admin/AdminConsoleView.tsx
-                         materialName: sel ? (sel.name || sel.nameAr || sel.code) : '',
+                       setVersionFormData({
@@ -1269,1 +1269,1 @@ src/components/admin/AdminConsoleView.tsx
-                       });
+                         ...versionFormData,
@@ -1270,1 +1270,1 @@ src/components/admin/AdminConsoleView.tsx
-                     }}
+                         materialId: e.target.value,
@@ -1271,1 +1271,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
+                         materialName: sel ? (sel.name || sel.nameAr || sel.code) : '',
@@ -1272,1 +1272,1 @@ src/components/admin/AdminConsoleView.tsx
-                   >
+                       });
@@ -1273,1 +1273,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="">كافة المواد والخامات (عام لكافة الخامات)</option>
+                     }}
@@ -1274,1 +1274,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {materials.map(m => (
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
@@ -1275,1 +1275,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <option key={m.materialId} value={m.materialId}>{m.name || m.nameAr} ({m.code})</option>
+                   >
@@ -1276,1 +1276,1 @@ src/components/admin/AdminConsoleView.tsx
-                     ))}
+                     <option value="">كافة المواد والخامات (عام لكافة الخامات)</option>
@@ -1277,1 +1277,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </select>
+                     {materials.map(m => (
@@ -1278,1 +1278,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                       <option key={m.materialId} value={m.materialId}>{m.name || m.nameAr} ({m.code})</option>
@@ -1279,1 +1279,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     ))}
@@ -1280,1 +1280,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Status */}
+                   </select>
@@ -1281,1 +1281,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1282,1 +1282,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">الحالة للنسخة الجديدة</label>
+ 
@@ -1283,1 +1283,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <select
+                 {/* Status */}
@@ -1284,1 +1284,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.status}
+                 <div>
@@ -1285,1 +1285,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => setVersionFormData({ ...versionFormData, status: e.target.value as any })}
+                   <label className="block font-bold text-stone-700 mb-1">الحالة للنسخة الجديدة</label>
@@ -1286,1 +1286,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
+                   <select
@@ -1287,1 +1287,1 @@ src/components/admin/AdminConsoleView.tsx
-                   >
+                     value={versionFormData.status}
@@ -1288,1 +1288,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="ACTIVE">نشط (ACTIVE)</option>
+                     onChange={(e) => setVersionFormData({ ...versionFormData, status: e.target.value as any })}
@@ -1289,1 +1289,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <option value="INACTIVE">معطل (INACTIVE)</option>
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-stone-800"
@@ -1290,1 +1290,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </select>
+                   >
@@ -1291,1 +1291,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     <option value="ACTIVE">نشط (ACTIVE)</option>
@@ -1292,1 +1292,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     <option value="INACTIVE">معطل (INACTIVE)</option>
@@ -1293,1 +1293,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Effective From */}
+                   </select>
@@ -1294,1 +1294,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1295,1 +1295,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">من تاريخ (Effective From)</label>
+ 
@@ -1296,1 +1296,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <input
+                 {/* Effective From */}
@@ -1297,1 +1297,1 @@ src/components/admin/AdminConsoleView.tsx
-                     type="date"
+                 <div>
@@ -1298,1 +1298,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.effectiveFrom}
+                   <label className="block font-bold text-stone-700 mb-1">من تاريخ (Effective From)</label>
@@ -1299,1 +1299,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => setVersionFormData({ ...versionFormData, effectiveFrom: e.target.value })}
+                   <input
@@ -1300,1 +1300,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800"
+                     type="date"
@@ -1301,1 +1301,1 @@ src/components/admin/AdminConsoleView.tsx
-                     required
+                     value={versionFormData.effectiveFrom}
@@ -1302,1 +1302,1 @@ src/components/admin/AdminConsoleView.tsx
-                   />
+                     onChange={(e) => setVersionFormData({ ...versionFormData, effectiveFrom: e.target.value })}
@@ -1303,1 +1303,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800"
@@ -1304,1 +1304,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     required
@@ -1305,1 +1305,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {/* Effective To */}
+                   />
@@ -1306,1 +1306,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+                 </div>
@@ -1307,1 +1307,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">إلى تاريخ (Effective To)</label>
+ 
@@ -1308,1 +1308,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <input
+                 {/* Effective To */}
@@ -1309,1 +1309,1 @@ src/components/admin/AdminConsoleView.tsx
-                     type="date"
+                 <div>
@@ -1310,1 +1310,1 @@ src/components/admin/AdminConsoleView.tsx
-                     value={versionFormData.effectiveTo}
+                   <label className="block font-bold text-stone-700 mb-1">إلى تاريخ (Effective To)</label>
@@ -1311,1 +1311,1 @@ src/components/admin/AdminConsoleView.tsx
-                     onChange={(e) => setVersionFormData({ ...versionFormData, effectiveTo: e.target.value })}
+                   <input
@@ -1312,1 +1312,1 @@ src/components/admin/AdminConsoleView.tsx
-                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800"
+                     type="date"
@@ -1313,1 +1313,1 @@ src/components/admin/AdminConsoleView.tsx
-                     required
+                     value={versionFormData.effectiveTo}
@@ -1314,1 +1314,1 @@ src/components/admin/AdminConsoleView.tsx
-                   />
+                     onChange={(e) => setVersionFormData({ ...versionFormData, effectiveTo: e.target.value })}
@@ -1315,1 +1315,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                     className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800"
@@ -1316,1 +1316,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                     required
@@ -1317,1 +1317,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                   />
@@ -1318,1 +1318,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 </div>
@@ -1319,1 +1319,1 @@ src/components/admin/AdminConsoleView.tsx
-               {/* Justification / Note */}
+ 
@@ -1320,1 +1320,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div>
+               </div>
@@ -1321,1 +1321,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <label className="block font-bold text-stone-700 mb-1">سبب التعديل والاعتماد المالي</label>
+ 
@@ -1322,1 +1322,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <textarea
+               {/* Justification / Note */}
@@ -1323,1 +1323,1 @@ src/components/admin/AdminConsoleView.tsx
-                   rows={2}
+               <div>
@@ -1324,1 +1324,1 @@ src/components/admin/AdminConsoleView.tsx
-                   value={versionFormData.modificationReason}
+                 <label className="block font-bold text-stone-700 mb-1">سبب التعديل والاعتماد المالي</label>
@@ -1325,1 +1325,1 @@ src/components/admin/AdminConsoleView.tsx
-                   onChange={(e) => setVersionFormData({ ...versionFormData, modificationReason: e.target.value })}
+                 <textarea
@@ -1326,1 +1326,1 @@ src/components/admin/AdminConsoleView.tsx
-                   placeholder="مثال: تم اعتماد ملحق العقد الجديد مع زيادة تسعيرة الركام 10% اعتباراً من بداية الربع..."
+                   rows={2}
@@ -1327,1 +1327,1 @@ src/components/admin/AdminConsoleView.tsx
-                   className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none"
+                   value={versionFormData.modificationReason}
@@ -1328,1 +1328,1 @@ src/components/admin/AdminConsoleView.tsx
-                   required
+                   onChange={(e) => setVersionFormData({ ...versionFormData, modificationReason: e.target.value })}
@@ -1329,1 +1329,1 @@ src/components/admin/AdminConsoleView.tsx
-                 />
+                   placeholder="مثال: تم اعتماد ملحق العقد الجديد مع زيادة تسعيرة الركام 10% اعتباراً من بداية الربع..."
@@ -1330,1 +1330,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                   className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none"
@@ -1331,1 +1331,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                   required
@@ -1332,1 +1332,1 @@ src/components/admin/AdminConsoleView.tsx
-               {/* Actions */}
+                 />
@@ -1333,1 +1333,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
+               </div>
@@ -1334,1 +1334,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <button
+ 
@@ -1335,1 +1335,1 @@ src/components/admin/AdminConsoleView.tsx
-                   type="button"
+               {/* Actions */}
@@ -1336,1 +1336,1 @@ src/components/admin/AdminConsoleView.tsx
-                   onClick={() => setIsVersionModalOpen(false)}
+               <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
@@ -1337,1 +1337,1 @@ src/components/admin/AdminConsoleView.tsx
-                   className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
+                 <button
@@ -1338,1 +1338,1 @@ src/components/admin/AdminConsoleView.tsx
-                 >
+                   type="button"
@@ -1339,1 +1339,1 @@ src/components/admin/AdminConsoleView.tsx
-                   إلغاء
+                   onClick={() => setIsVersionModalOpen(false)}
@@ -1340,1 +1340,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </button>
+                   className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
@@ -1341,1 +1341,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <button
+                 >
@@ -1342,1 +1342,1 @@ src/components/admin/AdminConsoleView.tsx
-                   type="submit"
+                   {t("shared.actions.cancel")}</button>
@@ -1343,1 +1343,1 @@ src/components/admin/AdminConsoleView.tsx
-                   className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs flex items-center gap-2"
+                 <button
@@ -1344,1 +1344,1 @@ src/components/admin/AdminConsoleView.tsx
-                 >
+                   type="submit"
@@ -1345,1 +1345,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <Check className="w-4 h-4" />
+                   className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs flex items-center gap-2"
@@ -1346,1 +1346,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <span>اعتماد وإنشاء النسخة v{(editingRule.version || 1) + 1}</span>
+                 >
@@ -1347,1 +1347,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </button>
+                   <Check className="w-4 h-4" />
@@ -1348,1 +1348,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                   <span>اعتماد وإنشاء النسخة v{(editingRule.version || 1) + 1}</span>
@@ -1349,1 +1349,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 </button>
@@ -1350,1 +1350,1 @@ src/components/admin/AdminConsoleView.tsx
-             </form>
+               </div>
@@ -1352,1 +1352,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+             </form>
@@ -1353,1 +1353,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+ 
@@ -1354,1 +1354,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+           </div>
@@ -1355,1 +1355,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+         </div>
@@ -1356,1 +1356,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* ==================================================================== */}
+       )}
@@ -1357,1 +1357,1 @@ src/components/admin/AdminConsoleView.tsx
-       {/* DRAWER: PRICING AUDIT HISTORY */}
+ 
@@ -1359,1 +1359,1 @@ src/components/admin/AdminConsoleView.tsx
-       {isHistoryDrawerOpen && (
+       {/* DRAWER: PRICING AUDIT HISTORY */}
@@ -1360,1 +1360,1 @@ src/components/admin/AdminConsoleView.tsx
-         <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
+       {/* ==================================================================== */}
@@ -1361,1 +1361,1 @@ src/components/admin/AdminConsoleView.tsx
-           <div className="bg-white h-full w-full max-w-xl shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
+       {isHistoryDrawerOpen && (
@@ -1362,1 +1362,1 @@ src/components/admin/AdminConsoleView.tsx
-             
+         <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
@@ -1363,1 +1363,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="space-y-6">
+           <div className="bg-white h-full w-full max-w-xl shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
@@ -1364,1 +1364,1 @@ src/components/admin/AdminConsoleView.tsx
-               
+             
@@ -1365,1 +1365,1 @@ src/components/admin/AdminConsoleView.tsx
-               {/* Header */}
+             <div className="space-y-6">
@@ -1366,1 +1366,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="flex items-center justify-between pb-4 border-b border-stone-100">
+               
@@ -1367,1 +1367,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <div>
+               {/* Header */}
@@ -1368,1 +1368,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <h3 className="font-bold text-lg text-stone-900">سجل تاريخ تغييرات الأسعار (Audit History)</h3>
+               <div className="flex items-center justify-between pb-4 border-b border-stone-100">
@@ -1369,1 +1369,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <p className="text-xs text-stone-500 mt-0.5">
+                 <div>
@@ -1370,1 +1370,1 @@ src/components/admin/AdminConsoleView.tsx
-                     {selectedRuleForHistory 
+                   <h3 className="font-bold text-lg text-stone-900">سجل تاريخ تغييرات الأسعار (Audit History)</h3>
@@ -1371,1 +1371,1 @@ src/components/admin/AdminConsoleView.tsx
-                       ? `سجل التعديلات والنسخ للقاعدة: ${selectedRuleForHistory}`
+                   <p className="text-xs text-stone-500 mt-0.5">
@@ -1372,1 +1372,1 @@ src/components/admin/AdminConsoleView.tsx
-                       : 'سجل التعديلات الشامل لكافة قواعد ومصفوفات التسعير'}
+                     {selectedRuleForHistory 
@@ -1373,1 +1373,1 @@ src/components/admin/AdminConsoleView.tsx
-                   </p>
+                       ? `سجل التعديلات والنسخ للقاعدة: ${selectedRuleForHistory}`
@@ -1374,1 +1374,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </div>
+                       : 'سجل التعديلات الشامل لكافة قواعد ومصفوفات التسعير'}
@@ -1375,1 +1375,1 @@ src/components/admin/AdminConsoleView.tsx
-                 <button
+                   </p>
@@ -1376,1 +1376,1 @@ src/components/admin/AdminConsoleView.tsx
-                   onClick={() => setIsHistoryDrawerOpen(false)}
+                 </div>
@@ -1377,1 +1377,1 @@ src/components/admin/AdminConsoleView.tsx
-                   className="p-1.5 text-stone-400 hover:text-stone-700 font-bold"
+                 <button
@@ -1378,1 +1378,1 @@ src/components/admin/AdminConsoleView.tsx
-                 >
+                   onClick={() => setIsHistoryDrawerOpen(false)}
@@ -1379,1 +1379,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ✕
+                   className="p-1.5 text-stone-400 hover:text-stone-700 font-bold"
@@ -1380,1 +1380,1 @@ src/components/admin/AdminConsoleView.tsx
-                 </button>
+                 >
@@ -1381,1 +1381,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                   ✕
@@ -1382,1 +1382,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 </button>
@@ -1383,1 +1383,1 @@ src/components/admin/AdminConsoleView.tsx
-               {/* Timeline Entries */}
+               </div>
@@ -1384,1 +1384,1 @@ src/components/admin/AdminConsoleView.tsx
-               <div className="space-y-4">
+ 
@@ -1385,1 +1385,1 @@ src/components/admin/AdminConsoleView.tsx
-                 {adminConsoleService.getPricingAuditHistory(selectedRuleForHistory || undefined).length === 0 ? (
+               {/* Timeline Entries */}
@@ -1386,1 +1386,1 @@ src/components/admin/AdminConsoleView.tsx
-                   <p className="text-xs text-stone-400 py-8 text-center">لا توجد سجلات تدقيق سابقة.</p>
+               <div className="space-y-4">
@@ -1387,1 +1387,1 @@ src/components/admin/AdminConsoleView.tsx
-                 ) : (
+                 {adminConsoleService.getPricingAuditHistory(selectedRuleForHistory || undefined).length === 0 ? (
@@ -1388,1 +1388,1 @@ src/components/admin/AdminConsoleView.tsx
-                   adminConsoleService.getPricingAuditHistory(selectedRuleForHistory || undefined).map((entry) => (
+                   <p className="text-xs text-stone-400 py-8 text-center">لا توجد سجلات تدقيق سابقة.</p>
@@ -1389,1 +1389,1 @@ src/components/admin/AdminConsoleView.tsx
-                     <div key={entry.auditId} className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 space-y-2">
+                 ) : (
@@ -1390,1 +1390,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <div className="flex items-center justify-between">
+                   adminConsoleService.getPricingAuditHistory(selectedRuleForHistory || undefined).map((entry) => (
@@ -1391,1 +1391,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <div className="flex items-center gap-2">
+                     <div key={entry.auditId} className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 space-y-2">
@@ -1392,1 +1392,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
+                       <div className="flex items-center justify-between">
@@ -1393,1 +1393,1 @@ src/components/admin/AdminConsoleView.tsx
-                             entry.action === 'VERSIONED_UPDATE' ? 'bg-amber-100 text-amber-900 border border-amber-300/50' : 'bg-stone-200 text-stone-800'
+                         <div className="flex items-center gap-2">
@@ -1394,1 +1394,1 @@ src/components/admin/AdminConsoleView.tsx
-                           }`}>
+                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
@@ -1395,1 +1395,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {entry.action === 'VERSIONED_UPDATE' ? `نسخة جديدة v${entry.version}` : entry.action}
+                             entry.action === 'VERSIONED_UPDATE' ? 'bg-amber-100 text-amber-900 border border-amber-300/50' : 'bg-stone-200 text-stone-800'
@@ -1396,1 +1396,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </span>
+                           }`}>
@@ -1397,1 +1397,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <span className="font-mono text-xs font-bold text-stone-900">{entry.pricingRuleId}</span>
+                             {entry.action === 'VERSIONED_UPDATE' ? `نسخة جديدة v${entry.version}` : entry.action}
@@ -1398,1 +1398,1 @@ src/components/admin/AdminConsoleView.tsx
-                         </div>
+                           </span>
@@ -1399,1 +1399,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <span className="text-[11px] font-mono text-stone-400">{new Date(entry.changedAt).toLocaleString('ar-SA')}</span>
+                           <span className="font-mono text-xs font-bold text-stone-900">{entry.pricingRuleId}</span>
@@ -1400,1 +1400,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </div>
+                         </div>
@@ -1401,1 +1401,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                         <span className="text-[11px] font-mono text-stone-400">{new Date(entry.changedAt).toLocaleString('ar-SA')}</span>
@@ -1402,1 +1402,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <p className="text-xs text-stone-800 font-semibold">{entry.carrierName}</p>
+                       </div>
@@ -1403,1 +1403,1 @@ src/components/admin/AdminConsoleView.tsx
-                       
+ 
@@ -1404,1 +1404,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {/* Before / After Delta */}
+                       <p className="text-xs text-stone-800 font-semibold">{entry.carrierName}</p>
@@ -1405,1 +1405,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-stone-200">
+                       
@@ -1406,1 +1406,1 @@ src/components/admin/AdminConsoleView.tsx
-                         {entry.previousValues && (
+                       {/* Before / After Delta */}
@@ -1407,1 +1407,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <div>
+                       <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-stone-200">
@@ -1408,1 +1408,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <span className="text-stone-400 block text-[10px]">القيمة السابقة</span>
+                         {entry.previousValues && (
@@ -1409,1 +1409,1 @@ src/components/admin/AdminConsoleView.tsx
-                             <span className="font-mono text-stone-600 line-through">
+                           <div>
@@ -1410,1 +1410,1 @@ src/components/admin/AdminConsoleView.tsx
-                               {entry.previousValues.agreedRate} ر.س ({entry.previousValues.pricingType})
+                             <span className="text-stone-400 block text-[10px]">القيمة السابقة</span>
@@ -1411,1 +1411,1 @@ src/components/admin/AdminConsoleView.tsx
-                             </span>
+                             <span className="font-mono text-stone-600 line-through">
@@ -1412,1 +1412,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </div>
+                               {entry.previousValues.agreedRate} ر.س ({entry.previousValues.pricingType})
@@ -1413,1 +1413,1 @@ src/components/admin/AdminConsoleView.tsx
-                         )}
+                             </span>
@@ -1414,1 +1414,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <div>
+                           </div>
@@ -1415,1 +1415,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <span className="text-emerald-700 block text-[10px]">القيمة الجديدة المعتمدة</span>
+                         )}
@@ -1416,1 +1416,1 @@ src/components/admin/AdminConsoleView.tsx
-                           <span className="font-mono font-bold text-emerald-800">
+                         <div>
@@ -1417,1 +1417,1 @@ src/components/admin/AdminConsoleView.tsx
-                             {entry.newValues.agreedRate} ر.س ({entry.newValues.pricingType})
+                           <span className="text-emerald-700 block text-[10px]">القيمة الجديدة المعتمدة</span>
@@ -1418,1 +1418,1 @@ src/components/admin/AdminConsoleView.tsx
-                           </span>
+                           <span className="font-mono font-bold text-emerald-800">
@@ -1419,1 +1419,1 @@ src/components/admin/AdminConsoleView.tsx
-                         </div>
+                             {entry.newValues.agreedRate} ر.س ({entry.newValues.pricingType})
@@ -1420,1 +1420,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </div>
+                           </span>
@@ -1421,1 +1421,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                         </div>
@@ -1422,1 +1422,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {/* Historical Protection Indicator */}
+                       </div>
@@ -1423,1 +1423,1 @@ src/components/admin/AdminConsoleView.tsx
-                       <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
+ 
@@ -1424,1 +1424,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <span>المنفذ: <strong>{entry.changedBy}</strong> ({entry.changedByRole})</span>
+                       {/* Historical Protection Indicator */}
@@ -1425,1 +1425,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <span className="text-amber-800 font-bold bg-amber-100/60 px-2 py-0.5 rounded">
+                       <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
@@ -1426,1 +1426,1 @@ src/components/admin/AdminConsoleView.tsx
-                           {entry.historicalTripsProtectedCount} رحلة تاريخية لم تتأثر
+                         <span>المنفذ: <strong>{entry.changedBy}</strong> ({entry.changedByRole})</span>
@@ -1427,1 +1427,1 @@ src/components/admin/AdminConsoleView.tsx
-                         </span>
+                         <span className="text-amber-800 font-bold bg-amber-100/60 px-2 py-0.5 rounded">
@@ -1428,1 +1428,1 @@ src/components/admin/AdminConsoleView.tsx
-                       </div>
+                           {entry.historicalTripsProtectedCount} رحلة تاريخية لم تتأثر
@@ -1429,1 +1429,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                         </span>
@@ -1430,1 +1430,1 @@ src/components/admin/AdminConsoleView.tsx
-                       {entry.reason && (
+                       </div>
@@ -1431,1 +1431,1 @@ src/components/admin/AdminConsoleView.tsx
-                         <p className="text-[11px] text-stone-600 italic bg-stone-100/50 p-1.5 rounded">
+ 
@@ -1432,1 +1432,1 @@ src/components/admin/AdminConsoleView.tsx
-                           سبب التعديل: {entry.reason}
+                       {entry.reason && (
@@ -1433,1 +1433,1 @@ src/components/admin/AdminConsoleView.tsx
-                         </p>
+                         <p className="text-[11px] text-stone-600 italic bg-stone-100/50 p-1.5 rounded">
@@ -1434,1 +1434,1 @@ src/components/admin/AdminConsoleView.tsx
-                       )}
+                           سبب التعديل: {entry.reason}
@@ -1435,1 +1435,1 @@ src/components/admin/AdminConsoleView.tsx
-                     </div>
+                         </p>
@@ -1436,1 +1436,1 @@ src/components/admin/AdminConsoleView.tsx
-                   ))
+                       )}
@@ -1437,1 +1437,1 @@ src/components/admin/AdminConsoleView.tsx
-                 )}
+                     </div>
@@ -1438,1 +1438,1 @@ src/components/admin/AdminConsoleView.tsx
-               </div>
+                   ))
@@ -1439,1 +1439,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+                 )}
@@ -1440,1 +1440,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+               </div>
@@ -1442,1 +1442,1 @@ src/components/admin/AdminConsoleView.tsx
-             <div className="pt-4 border-t border-stone-100">
+             </div>
@@ -1443,1 +1443,1 @@ src/components/admin/AdminConsoleView.tsx
-               <button
+ 
@@ -1444,1 +1444,1 @@ src/components/admin/AdminConsoleView.tsx
-                 onClick={() => setIsHistoryDrawerOpen(false)}
+             <div className="pt-4 border-t border-stone-100">
@@ -1445,1 +1445,1 @@ src/components/admin/AdminConsoleView.tsx
-                 className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
+               <button
@@ -1446,1 +1446,1 @@ src/components/admin/AdminConsoleView.tsx
-               >
+                 onClick={() => setIsHistoryDrawerOpen(false)}
@@ -1447,1 +1447,1 @@ src/components/admin/AdminConsoleView.tsx
-                 إغلاق السجل
+                 className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
@@ -1448,1 +1448,1 @@ src/components/admin/AdminConsoleView.tsx
-               </button>
+               >
@@ -1449,1 +1449,1 @@ src/components/admin/AdminConsoleView.tsx
-             </div>
+                 إغلاق السجل
@@ -1450,1 +1450,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+               </button>
@@ -1451,1 +1451,1 @@ src/components/admin/AdminConsoleView.tsx
-           </div>
+             </div>
@@ -1452,1 +1452,1 @@ src/components/admin/AdminConsoleView.tsx
-         </div>
+ 
@@ -1453,1 +1453,1 @@ src/components/admin/AdminConsoleView.tsx
-       )}
+           </div>
@@ -1454,1 +1454,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+         </div>
@@ -1455,1 +1455,1 @@ src/components/admin/AdminConsoleView.tsx
-     </div>
+       )}
@@ -1456,1 +1456,1 @@ src/components/admin/AdminConsoleView.tsx
-   );
+ 
@@ -1457,1 +1457,1 @@ src/components/admin/AdminConsoleView.tsx
- }
+     </div>
@@ -1458,1 +1458,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+   );
@@ -1459,1 +1459,1 @@ src/components/admin/AdminConsoleView.tsx
- 
+ }
```

## File: `src/components/importCenter/EntityResolutionSection.tsx`

- **Pre-Migration Hash:** `54ab310bba943889`
- **Post-Migration Hash:** `a661db9d5470dcdf`
- **Transformations Applied:** 1
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted:** `shared.actions.cancel`

### Unified Diff / Patch

```diff
@@ -41,1 +41,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -42,1 +42,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- interface SampleDemoRow {
+ 
@@ -43,1 +43,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   rowNumber: number;
+ 
@@ -44,1 +44,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   ticketId: string;
+ interface SampleDemoRow {
@@ -45,1 +45,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   sourceCarrier: string;
+   rowNumber: number;
@@ -46,1 +46,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   sourceTruck: string;
+   ticketId: string;
@@ -47,1 +47,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   sourceDriver: string;
+   sourceCarrier: string;
@@ -48,1 +48,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   sourceMaterial: string;
+   sourceTruck: string;
@@ -49,1 +49,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   isDuplicate?: boolean;
+   sourceDriver: string;
@@ -50,1 +50,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- }
+   sourceMaterial: string;
@@ -51,1 +51,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   isDuplicate?: boolean;
@@ -52,1 +52,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- const INITIAL_DEMO_ROWS: SampleDemoRow[] = [
+ }
@@ -53,1 +53,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   {
+ 
@@ -54,1 +54,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     rowNumber: 1,
+ const INITIAL_DEMO_ROWS: SampleDemoRow[] = [
@@ -55,1 +55,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     ticketId: 'TKT-2026-001',
+   {
@@ -56,1 +56,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceCarrier: 'الشركة الشرقية للنقل',
+     rowNumber: 1,
@@ -57,1 +57,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceTruck: '1010-أ ب ج',
+     ticketId: 'TKT-2026-001',
@@ -58,1 +58,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceDriver: 'محمد أحمد',
+     sourceCarrier: 'الشركة الشرقية للنقل',
@@ -59,1 +59,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceMaterial: 'AGG-01',
+     sourceTruck: '1010-أ ب ج',
@@ -60,1 +60,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   },
+     sourceDriver: 'محمد أحمد',
@@ -61,1 +61,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   {
+     sourceMaterial: 'AGG-01',
@@ -62,1 +62,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     rowNumber: 2,
+   },
@@ -63,1 +63,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     ticketId: 'TKT-2026-002',
+   {
@@ -64,1 +64,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceCarrier: 'الفلاح', // Approved Alias
+     rowNumber: 2,
@@ -65,1 +65,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceTruck: '3030 ر س ط',
+     ticketId: 'TKT-2026-002',
@@ -66,1 +66,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceDriver: 'عبدالله مسفر',
+     sourceCarrier: 'الفلاح', // Approved Alias
@@ -67,1 +67,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceMaterial: 'ركام ناعم 0-5 مم',
+     sourceTruck: '3030 ر س ط',
@@ -68,1 +68,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   },
+     sourceDriver: 'عبدالله مسفر',
@@ -69,1 +69,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   {
+     sourceMaterial: 'ركام ناعم 0-5 مم',
@@ -70,1 +70,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     rowNumber: 3,
+   },
@@ -71,1 +71,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     ticketId: 'TKT-2026-003',
+   {
@@ -72,1 +72,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceCarrier: 'مؤسسة الرمال السريعة', // CRITICAL RELATIONSHIP CONFLICT! Truck is assigned to الشرقية
+     rowNumber: 3,
@@ -73,1 +73,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceTruck: '1010-أ ب ج',
+     ticketId: 'TKT-2026-003',
@@ -74,1 +74,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceDriver: 'علي حسن',
+     sourceCarrier: 'مؤسسة الرمال السريعة', // CRITICAL RELATIONSHIP CONFLICT! Truck is assigned to الشرقية
@@ -75,1 +75,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceMaterial: 'AGG-01',
+     sourceTruck: '1010-أ ب ج',
@@ -76,1 +76,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   },
+     sourceDriver: 'علي حسن',
@@ -77,1 +77,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   {
+     sourceMaterial: 'AGG-01',
@@ -78,1 +78,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     rowNumber: 4,
+   },
@@ -79,1 +79,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     ticketId: 'TKT-2026-004',
+   {
@@ -80,1 +80,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceCarrier: 'شركة النقل المتحد المحدودة', // Fuzzy Candidate
+     rowNumber: 4,
@@ -81,1 +81,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceTruck: '٥٥٦٦-د هـ و', // Eastern numerals
+     ticketId: 'TKT-2026-004',
@@ -82,1 +82,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceDriver: 'سائق جديد غير معروف',
+     sourceCarrier: 'شركة النقل المتحد المحدودة', // Fuzzy Candidate
@@ -83,1 +83,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceMaterial: 'أسمنت بورتلاندي خاص', // Unauthorized material for project
+     sourceTruck: '٥٥٦٦-د هـ و', // Eastern numerals
@@ -84,1 +84,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   },
+     sourceDriver: 'سائق جديد غير معروف',
@@ -85,1 +85,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   {
+     sourceMaterial: 'أسمنت بورتلاندي خاص', // Unauthorized material for project
@@ -86,1 +86,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     rowNumber: 5,
+   },
@@ -87,1 +87,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     ticketId: 'TKT-2026-005',
+   {
@@ -88,1 +88,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceCarrier: '', // Truck without carrier!
+     rowNumber: 5,
@@ -89,1 +89,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceTruck: '2020-د هـ و',
+     ticketId: 'TKT-2026-005',
@@ -90,1 +90,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceDriver: 'سالم القحطاني',
+     sourceCarrier: '', // Truck without carrier!
@@ -91,1 +91,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     sourceMaterial: 'AGG-01',
+     sourceTruck: '2020-د هـ و',
@@ -92,1 +92,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   },
+     sourceDriver: 'سالم القحطاني',
@@ -93,1 +93,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- ];
+     sourceMaterial: 'AGG-01',
@@ -94,1 +94,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   },
@@ -95,1 +95,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- export function EntityResolutionSection() {
+ ];
@@ -96,1 +96,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const currentProjectId = 'PRJ-NEOM-NORTH-01';
+ 
@@ -97,1 +97,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const currentUserId = 'USR-INSPECTOR-09';
+ export function EntityResolutionSection() {
@@ -98,1 +98,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const currentUserName = 'م. أحمد الشمري (أخصائي ضبط جودة البيانات)';
+   const { t } = useI18n();
@@ -99,1 +99,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   const currentProjectId = 'PRJ-NEOM-NORTH-01';
@@ -100,1 +100,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   // Mock Pipeline Context with Master Data and Relationships
+   const currentUserId = 'USR-INSPECTOR-09';
@@ -101,1 +101,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [pipelineContext] = useState<PipelineContext>({
+   const currentUserName = 'م. أحمد الشمري (أخصائي ضبط جودة البيانات)';
@@ -102,1 +102,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     projectId: currentProjectId,
+ 
@@ -103,1 +103,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     userId: currentUserId,
+   // Mock Pipeline Context with Master Data and Relationships
@@ -104,1 +104,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     userName: currentUserName,
+   const [pipelineContext] = useState<PipelineContext>({
@@ -105,1 +105,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     operationId: 'OP-IMPORT-ER-2026',
+     projectId: currentProjectId,
@@ -106,1 +106,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     knownEntities: {
+     userId: currentUserId,
@@ -107,1 +107,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       carriers: [
+     userName: currentUserName,
@@ -108,1 +108,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { carrierId: 'CAR-01', name: 'الشركة الشرقية للنقل', projectId: currentProjectId, aliases: ['الشرقية', 'شرقية ترانسبورت'] },
+     operationId: 'OP-IMPORT-ER-2026',
@@ -109,1 +109,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { carrierId: 'CAR-02', name: 'مؤسسة الرمال السريعة', projectId: currentProjectId, aliases: ['الرمال'] },
+     knownEntities: {
@@ -110,1 +110,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { carrierId: 'CAR-03', name: 'شركة الفلاح للنقل والخدمات اللوجستية', projectId: currentProjectId, aliases: ['الفلاح'] },
+       carriers: [
@@ -111,1 +111,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { carrierId: 'CAR-04', name: 'شركة النقل المتحد', projectId: currentProjectId },
+         { carrierId: 'CAR-01', name: 'الشركة الشرقية للنقل', projectId: currentProjectId, aliases: ['الشرقية', 'شرقية ترانسبورت'] },
@@ -112,1 +112,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       ],
+         { carrierId: 'CAR-02', name: 'مؤسسة الرمال السريعة', projectId: currentProjectId, aliases: ['الرمال'] },
@@ -113,1 +113,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       trucks: [
+         { carrierId: 'CAR-03', name: 'شركة الفلاح للنقل والخدمات اللوجستية', projectId: currentProjectId, aliases: ['الفلاح'] },
@@ -114,1 +114,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { truckId: 'TRK-01', plate: '1010-أ ب ج', carrierId: 'CAR-01', projectId: currentProjectId },
+         { carrierId: 'CAR-04', name: 'شركة النقل المتحد', projectId: currentProjectId },
@@ -115,1 +115,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { truckId: 'TRK-02', plate: '2020-د هـ و', carrierId: 'CAR-02', projectId: currentProjectId },
+       ],
@@ -116,1 +116,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { truckId: 'TRK-03', plate: '3030 ر س ط', carrierId: 'CAR-03', projectId: currentProjectId },
+       trucks: [
@@ -117,1 +117,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { truckId: 'TRK-04', plate: '5566 د هـ و', carrierId: 'CAR-04', projectId: currentProjectId },
+         { truckId: 'TRK-01', plate: '1010-أ ب ج', carrierId: 'CAR-01', projectId: currentProjectId },
@@ -118,1 +118,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       ],
+         { truckId: 'TRK-02', plate: '2020-د هـ و', carrierId: 'CAR-02', projectId: currentProjectId },
@@ -119,1 +119,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       drivers: [
+         { truckId: 'TRK-03', plate: '3030 ر س ط', carrierId: 'CAR-03', projectId: currentProjectId },
@@ -120,1 +120,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { driverId: 'DRV-01', name: 'محمد أحمد', carrierId: 'CAR-01', projectId: currentProjectId },
+         { truckId: 'TRK-04', plate: '5566 د هـ و', carrierId: 'CAR-04', projectId: currentProjectId },
@@ -121,1 +121,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { driverId: 'DRV-02', name: 'علي حسن', carrierId: 'CAR-01', projectId: currentProjectId },
+       ],
@@ -122,1 +122,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { driverId: 'DRV-03', name: 'عبدالله مسفر', carrierId: 'CAR-03', projectId: currentProjectId },
+       drivers: [
@@ -123,1 +123,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       ],
+         { driverId: 'DRV-01', name: 'محمد أحمد', carrierId: 'CAR-01', projectId: currentProjectId },
@@ -124,1 +124,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       materials: [
+         { driverId: 'DRV-02', name: 'علي حسن', carrierId: 'CAR-01', projectId: currentProjectId },
@@ -125,1 +125,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { materialId: 'MAT-01', name: 'ركام ناعم 0-5 مم', code: 'AGG-01', projectId: currentProjectId },
+         { driverId: 'DRV-03', name: 'عبدالله مسفر', carrierId: 'CAR-03', projectId: currentProjectId },
@@ -126,1 +126,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { materialId: 'MAT-02', name: 'ركام خشن 10-20 مم', code: 'AGG-02', projectId: currentProjectId },
+       ],
@@ -127,1 +127,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         { materialId: 'MAT-03', name: 'رمل أحمر مغسول', code: 'SND-01', projectId: currentProjectId },
+       materials: [
@@ -128,1 +128,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       ],
+         { materialId: 'MAT-01', name: 'ركام ناعم 0-5 مم', code: 'AGG-01', projectId: currentProjectId },
@@ -129,1 +129,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       truckCarrierMap: {
+         { materialId: 'MAT-02', name: 'ركام خشن 10-20 مم', code: 'AGG-02', projectId: currentProjectId },
@@ -130,1 +130,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         '1010-أ ب ج': 'الشركة الشرقية للنقل',
+         { materialId: 'MAT-03', name: 'رمل أحمر مغسول', code: 'SND-01', projectId: currentProjectId },
@@ -131,1 +131,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         '2020-د هـ و': 'مؤسسة الرمال السريعة',
+       ],
@@ -132,1 +132,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         '3030 ر س ط': 'شركة الفلاح للنقل والخدمات اللوجستية',
+       truckCarrierMap: {
@@ -133,1 +133,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         '5566 د هـ و': 'شركة النقل المتحد',
+         '1010-أ ب ج': 'الشركة الشرقية للنقل',
@@ -134,1 +134,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       },
+         '2020-د هـ و': 'مؤسسة الرمال السريعة',
@@ -135,1 +135,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       driverCarrierMap: {
+         '3030 ر س ط': 'شركة الفلاح للنقل والخدمات اللوجستية',
@@ -136,1 +136,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         'محمد أحمد': 'الشركة الشرقية للنقل',
+         '5566 د هـ و': 'شركة النقل المتحد',
@@ -137,1 +137,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         'علي حسن': 'الشركة الشرقية للنقل',
+       },
@@ -138,1 +138,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         'عبدالله مسفر': 'شركة الفلاح للنقل والخدمات اللوجستية',
+       driverCarrierMap: {
@@ -139,1 +139,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       },
+         'محمد أحمد': 'الشركة الشرقية للنقل',
@@ -140,1 +140,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       projectMaterials: ['AGG-01', 'ركام ناعم 0-5 مم', 'AGG-02', 'ركام خشن 10-20 مم'],
+         'علي حسن': 'الشركة الشرقية للنقل',
@@ -141,1 +141,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       approvedAliases: {
+         'عبدالله مسفر': 'شركة الفلاح للنقل والخدمات اللوجستية',
@@ -142,1 +142,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         CARRIER: {
+       },
@@ -143,1 +143,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           'الفلاح': 'CAR-03',
+       projectMaterials: ['AGG-01', 'ركام ناعم 0-5 مم', 'AGG-02', 'ركام خشن 10-20 مم'],
@@ -144,1 +144,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         },
+       approvedAliases: {
@@ -145,1 +145,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       },
+         CARRIER: {
@@ -146,1 +146,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     },
+           'الفلاح': 'CAR-03',
@@ -147,1 +147,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   });
+         },
@@ -148,1 +148,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+       },
@@ -149,1 +149,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [demoRows, setDemoRows] = useState<SampleDemoRow[]>(INITIAL_DEMO_ROWS);
+     },
@@ -150,1 +150,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [activeRowNumber, setActiveRowNumber] = useState<number>(3); // Row 3 has critical conflict
+   });
@@ -151,1 +151,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [selectedFieldForDecision, setSelectedFieldForDecision] = useState<TargetEntityType | null>('TRUCK');
+ 
@@ -152,1 +152,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [customSelectModalOpen, setCustomSelectModalOpen] = useState<boolean>(false);
+   const [demoRows, setDemoRows] = useState<SampleDemoRow[]>(INITIAL_DEMO_ROWS);
@@ -153,1 +153,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [targetSelectField, setTargetSelectField] = useState<TargetEntityType>('TRUCK');
+   const [activeRowNumber, setActiveRowNumber] = useState<number>(3); // Row 3 has critical conflict
@@ -154,1 +154,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [selectedAlternateId, setSelectedAlternateId] = useState<string>('');
+   const [selectedFieldForDecision, setSelectedFieldForDecision] = useState<TargetEntityType | null>('TRUCK');
@@ -155,1 +155,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [decisionNotes, setDecisionNotes] = useState<string>('');
+   const [customSelectModalOpen, setCustomSelectModalOpen] = useState<boolean>(false);
@@ -156,1 +156,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [auditLogVersion, setAuditLogVersion] = useState<number>(0);
+   const [targetSelectField, setTargetSelectField] = useState<TargetEntityType>('TRUCK');
@@ -157,1 +157,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [searchFilter, setSearchFilter] = useState<string>('');
+   const [selectedAlternateId, setSelectedAlternateId] = useState<string>('');
@@ -158,1 +158,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   const [decisionNotes, setDecisionNotes] = useState<string>('');
@@ -159,1 +159,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   // Row overrides applied by user decisions
+   const [auditLogVersion, setAuditLogVersion] = useState<number>(0);
@@ -160,1 +160,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const [rowOverrides, setRowOverrides] = useState<Record<number, Record<string, EntityResolutionItem>>>({});
+   const [searchFilter, setSearchFilter] = useState<string>('');
@@ -162,1 +162,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   // Compute resolutions for all demo rows
+   // Row overrides applied by user decisions
@@ -163,1 +163,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const computedResolutions = useMemo(() => {
+   const [rowOverrides, setRowOverrides] = useState<Record<number, Record<string, EntityResolutionItem>>>({});
@@ -164,1 +164,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     const map: Record<number, Record<string, EntityResolutionItem>> = {};
+ 
@@ -165,1 +165,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   // Compute resolutions for all demo rows
@@ -166,1 +166,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     demoRows.forEach((row) => {
+   const computedResolutions = useMemo(() => {
@@ -167,1 +167,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       const overrides = rowOverrides[row.rowNumber] || {};
+     const map: Record<number, Record<string, EntityResolutionItem>> = {};
@@ -169,1 +169,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       // Carrier resolution
+     demoRows.forEach((row) => {
@@ -170,1 +170,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       const carrierRes = overrides['CARRIER'] || EntityResolutionService.resolveCarrier(row.sourceCarrier, pipelineContext);
+       const overrides = rowOverrides[row.rowNumber] || {};
@@ -172,1 +172,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       // Truck resolution
+       // Carrier resolution
@@ -173,1 +173,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       const truckRes = overrides['TRUCK'] || EntityResolutionService.resolveTruck(
+       const carrierRes = overrides['CARRIER'] || EntityResolutionService.resolveCarrier(row.sourceCarrier, pipelineContext);
@@ -174,1 +174,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         row.sourceTruck,
+ 
@@ -175,1 +175,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         pipelineContext,
+       // Truck resolution
@@ -176,1 +176,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         carrierRes,
+       const truckRes = overrides['TRUCK'] || EntityResolutionService.resolveTruck(
@@ -177,1 +177,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         row.sourceCarrier
+         row.sourceTruck,
@@ -178,1 +178,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       );
+         pipelineContext,
@@ -179,1 +179,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         carrierRes,
@@ -180,1 +180,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       // Driver resolution
+         row.sourceCarrier
@@ -181,1 +181,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       const driverRes = overrides['DRIVER'] || EntityResolutionService.resolveDriver(
+       );
@@ -182,1 +182,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         row.sourceDriver,
+ 
@@ -183,1 +183,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         pipelineContext,
+       // Driver resolution
@@ -184,1 +184,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         carrierRes,
+       const driverRes = overrides['DRIVER'] || EntityResolutionService.resolveDriver(
@@ -185,1 +185,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         row.sourceCarrier
+         row.sourceDriver,
@@ -186,1 +186,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       );
+         pipelineContext,
@@ -187,1 +187,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         carrierRes,
@@ -188,1 +188,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       // Material resolution
+         row.sourceCarrier
@@ -189,1 +189,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       const materialRes = overrides['MATERIAL'] || EntityResolutionService.resolveMaterial(
+       );
@@ -190,1 +190,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         row.sourceMaterial,
+ 
@@ -191,1 +191,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         pipelineContext
+       // Material resolution
@@ -192,1 +192,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       );
+       const materialRes = overrides['MATERIAL'] || EntityResolutionService.resolveMaterial(
@@ -193,1 +193,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         row.sourceMaterial,
@@ -194,1 +194,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       map[row.rowNumber] = {
+         pipelineContext
@@ -195,1 +195,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         CARRIER: carrierRes,
+       );
@@ -196,1 +196,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         TRUCK: truckRes,
+ 
@@ -197,1 +197,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         DRIVER: driverRes,
+       map[row.rowNumber] = {
@@ -198,1 +198,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         MATERIAL: materialRes,
+         CARRIER: carrierRes,
@@ -199,1 +199,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       };
+         TRUCK: truckRes,
@@ -200,1 +200,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     });
+         DRIVER: driverRes,
@@ -201,1 +201,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         MATERIAL: materialRes,
@@ -202,1 +202,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     return map;
+       };
@@ -203,1 +203,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   }, [demoRows, rowOverrides, pipelineContext]);
+     });
@@ -205,1 +205,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const activeRow = demoRows.find((r) => r.rowNumber === activeRowNumber) || demoRows[0];
+     return map;
@@ -206,1 +206,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const activeRowRes = computedResolutions[activeRow.rowNumber] || {};
+   }, [demoRows, rowOverrides, pipelineContext]);
@@ -207,1 +207,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const activeRowRisk = EntityResolutionService.calculateRowRisk(activeRowRes, activeRow.isDuplicate);
+ 
@@ -208,1 +208,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const canAutoAccept = EntityResolutionService.canAutoAcceptRow(activeRowRes, activeRow.isDuplicate);
+   const activeRow = demoRows.find((r) => r.rowNumber === activeRowNumber) || demoRows[0];
@@ -209,1 +209,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   const activeRowRes = computedResolutions[activeRow.rowNumber] || {};
@@ -210,1 +210,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   // Apply user decision
+   const activeRowRisk = EntityResolutionService.calculateRowRisk(activeRowRes, activeRow.isDuplicate);
@@ -211,1 +211,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const handleUserDecision = (
+   const canAutoAccept = EntityResolutionService.canAutoAcceptRow(activeRowRes, activeRow.isDuplicate);
@@ -212,1 +212,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     entityType: TargetEntityType,
+ 
@@ -213,1 +213,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     decision: 'ACCEPT_CANDIDATE' | 'REJECT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
+   // Apply user decision
@@ -214,1 +214,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     selectedId?: string,
+   const handleUserDecision = (
@@ -215,1 +215,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     selectedName?: string
+     entityType: TargetEntityType,
@@ -216,1 +216,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   ) => {
+     decision: 'ACCEPT_CANDIDATE' | 'REJECT_CANDIDATE' | 'SELECT_ALTERNATE' | 'LEAVE_UNRESOLVED',
@@ -217,1 +217,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     const currentItem = activeRowRes[entityType];
+     selectedId?: string,
@@ -218,1 +218,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     if (!currentItem) return;
+     selectedName?: string
@@ -219,1 +219,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   ) => {
@@ -220,1 +220,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     try {
+     const currentItem = activeRowRes[entityType];
@@ -221,1 +221,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       const result = EntityResolutionService.applyUserDecision({
+     if (!currentItem) return;
@@ -222,1 +222,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         projectId: currentProjectId,
+ 
@@ -223,1 +223,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         importBatchId: 'BATCH-ER-DEMO-2026',
+     try {
@@ -224,1 +224,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         operationId: 'OP-IMPORT-ER-2026',
+       const result = EntityResolutionService.applyUserDecision({
@@ -225,1 +225,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         rowNumber: activeRow.rowNumber,
+         projectId: currentProjectId,
@@ -226,1 +226,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         entityType,
+         importBatchId: 'BATCH-ER-DEMO-2026',
@@ -227,1 +227,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         decision,
+         operationId: 'OP-IMPORT-ER-2026',
@@ -228,1 +228,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         selectedEntityId: selectedId,
+         rowNumber: activeRow.rowNumber,
@@ -229,1 +229,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         selectedDisplayName: selectedName,
+         entityType,
@@ -230,1 +230,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         currentRowResolution: currentItem,
+         decision,
@@ -231,1 +231,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         context: pipelineContext,
+         selectedEntityId: selectedId,
@@ -232,1 +232,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         actorId: currentUserId,
+         selectedDisplayName: selectedName,
@@ -233,1 +233,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         notes: decisionNotes || `قرار يدوي: ${decision}`,
+         currentRowResolution: currentItem,
@@ -234,1 +234,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       });
+         context: pipelineContext,
@@ -235,1 +235,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         actorId: currentUserId,
@@ -236,1 +236,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       setRowOverrides((prev) => ({
+         notes: decisionNotes || `قرار يدوي: ${decision}`,
@@ -237,1 +237,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         ...prev,
+       });
@@ -238,1 +238,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         [activeRow.rowNumber]: {
+ 
@@ -239,1 +239,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           ...(prev[activeRow.rowNumber] || {}),
+       setRowOverrides((prev) => ({
@@ -240,1 +240,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           [entityType]: result.updatedResolution,
+         ...prev,
@@ -241,1 +241,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         },
+         [activeRow.rowNumber]: {
@@ -242,1 +242,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       }));
+           ...(prev[activeRow.rowNumber] || {}),
@@ -243,1 +243,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+           [entityType]: result.updatedResolution,
@@ -244,1 +244,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       setAuditLogVersion((v) => v + 1);
+         },
@@ -245,1 +245,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       setDecisionNotes('');
+       }));
@@ -246,1 +246,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       setCustomSelectModalOpen(false);
+ 
@@ -247,1 +247,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     } catch (err: any) {
+       setAuditLogVersion((v) => v + 1);
@@ -248,1 +248,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       alert(`خطأ في تطبيق القرار: ${err.message}`);
+       setDecisionNotes('');
@@ -249,1 +249,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     }
+       setCustomSelectModalOpen(false);
@@ -250,1 +250,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   };
+     } catch (err: any) {
@@ -251,1 +251,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+       alert(`خطأ في تطبيق القرار: ${err.message}`);
@@ -252,1 +252,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const auditEntries = useMemo(() => {
+     }
@@ -253,1 +253,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     return EntityResolutionService.getAuditLog();
+   };
@@ -254,1 +254,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   }, [auditLogVersion]);
+ 
@@ -255,1 +255,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   const auditEntries = useMemo(() => {
@@ -256,1 +256,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const getRiskBadge = (risk: ResolutionRiskLevel) => {
+     return EntityResolutionService.getAuditLog();
@@ -257,1 +257,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     switch (risk) {
+   }, [auditLogVersion]);
@@ -258,1 +258,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'CRITICAL':
+ 
@@ -259,1 +259,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return (
+   const getRiskBadge = (risk: ResolutionRiskLevel) => {
@@ -260,1 +260,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
+     switch (risk) {
@@ -261,1 +261,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <ShieldAlert className="w-4 h-4 text-rose-600" />
+       case 'CRITICAL':
@@ -262,1 +262,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             حرج (CRITICAL)
+         return (
@@ -263,1 +263,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </span>
+           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
@@ -264,1 +264,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         );
+             <ShieldAlert className="w-4 h-4 text-rose-600" />
@@ -265,1 +265,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'HIGH':
+             حرج (CRITICAL)
@@ -266,1 +266,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return (
+           </span>
@@ -267,1 +267,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
+         );
@@ -268,1 +268,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <AlertTriangle className="w-4 h-4 text-amber-600" />
+       case 'HIGH':
@@ -269,1 +269,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             مرتفع (HIGH)
+         return (
@@ -270,1 +270,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </span>
+           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
@@ -271,1 +271,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         );
+             <AlertTriangle className="w-4 h-4 text-amber-600" />
@@ -272,1 +272,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'MEDIUM':
+             مرتفع (HIGH)
@@ -273,1 +273,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return (
+           </span>
@@ -274,1 +274,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
+         );
@@ -275,1 +275,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <Sparkles className="w-3.5 h-3.5 text-blue-600" />
+       case 'MEDIUM':
@@ -276,1 +276,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             متوسط (MEDIUM)
+         return (
@@ -277,1 +277,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </span>
+           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
@@ -278,1 +278,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         );
+             <Sparkles className="w-3.5 h-3.5 text-blue-600" />
@@ -279,1 +279,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'LOW':
+             متوسط (MEDIUM)
@@ -280,1 +280,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       default:
+           </span>
@@ -281,1 +281,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return (
+         );
@@ -282,1 +282,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
+       case 'LOW':
@@ -283,1 +283,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <ShieldCheck className="w-4 h-4 text-emerald-600" />
+       default:
@@ -284,1 +284,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             آمن (LOW)
+         return (
@@ -285,1 +285,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </span>
+           <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
@@ -286,1 +286,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         );
+             <ShieldCheck className="w-4 h-4 text-emerald-600" />
@@ -287,1 +287,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     }
+             آمن (LOW)
@@ -288,1 +288,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   };
+           </span>
@@ -289,1 +289,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         );
@@ -290,1 +290,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   const getMethodBadge = (method: string) => {
+     }
@@ -291,1 +291,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     switch (method) {
+   };
@@ -292,1 +292,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'EXACT':
+ 
@@ -293,1 +293,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">تطابق تام (EXACT)</span>;
+   const getMethodBadge = (method: string) => {
@@ -294,1 +294,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'NORMALIZED':
+     switch (method) {
@@ -295,1 +295,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-cyan-100 text-cyan-800 border border-cyan-200">مطابقة معيارية (NORMALIZED)</span>;
+       case 'EXACT':
@@ -296,1 +296,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'ALIAS':
+         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">تطابق تام (EXACT)</span>;
@@ -297,1 +297,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-200">اسم مستعار معتمد (ALIAS)</span>;
+       case 'NORMALIZED':
@@ -298,1 +298,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       case 'FUZZY':
+         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-cyan-100 text-cyan-800 border border-cyan-200">مطابقة معيارية (NORMALIZED)</span>;
@@ -299,1 +299,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">مطابقة تقريبية (FUZZY)</span>;
+       case 'ALIAS':
@@ -300,1 +300,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       default:
+         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-200">اسم مستعار معتمد (ALIAS)</span>;
@@ -301,1 +301,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-gray-100 text-gray-700 border border-gray-200">غير معروف (NONE)</span>;
+       case 'FUZZY':
@@ -302,1 +302,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     }
+         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">مطابقة تقريبية (FUZZY)</span>;
@@ -303,1 +303,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   };
+       default:
@@ -304,1 +304,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-gray-100 text-gray-700 border border-gray-200">غير معروف (NONE)</span>;
@@ -305,1 +305,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   return (
+     }
@@ -306,1 +306,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     <div className="space-y-6" dir="rtl">
+   };
@@ -307,1 +307,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       {/* Header Banner */}
+ 
@@ -308,1 +308,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50">
+   return (
@@ -309,1 +309,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
+     <div className="space-y-6" dir="rtl">
@@ -310,1 +310,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div>
+       {/* Header Banner */}
@@ -311,1 +311,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold mb-1">
+       <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50">
@@ -312,1 +312,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <Sparkles className="w-4 h-4" />
+         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
@@ -313,1 +313,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <span>BLOCK 35 — منظومة حل الكيانات وضبط جودة البيانات الذكية</span>
+           <div>
@@ -314,1 +314,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-0.5 rounded-full border border-indigo-400/30">
+             <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold mb-1">
@@ -315,1 +315,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 Entity Resolution & Data Quality
+               <Sparkles className="w-4 h-4" />
@@ -316,1 +316,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </span>
+               <span>BLOCK 35 — منظومة حل الكيانات وضبط جودة البيانات الذكية</span>
@@ -317,1 +317,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+               <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-0.5 rounded-full border border-indigo-400/30">
@@ -318,1 +318,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <h2 className="text-2xl font-bold tracking-tight text-white">
+                 Entity Resolution & Data Quality
@@ -319,1 +319,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               بوابة المطابقة الذكية وفحص العلاقات والنزاهة
+               </span>
@@ -320,1 +320,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </h2>
+             </div>
@@ -321,1 +321,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <p className="text-indigo-200/80 text-sm mt-1 max-w-3xl">
+             <h2 className="text-2xl font-bold tracking-tight text-white">
@@ -322,1 +322,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               تطبيق استراتيجية المطابقة خماسية المراحل (Exact → Normalized → Alias → Fuzzy → Review)، مع الحظر الصارم لأي دمج صامت،
+               بوابة المطابقة الذكية وفحص العلاقات والنزاهة
@@ -323,1 +323,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               والتحقق الإلزامي من نزاهة العلاقات التشغيلية (شاحنة ↔ ناقل، سائق ↔ كفالة، مادة ↔ نطاق المشروع).
+             </h2>
@@ -324,1 +324,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </p>
+             <p className="text-indigo-200/80 text-sm mt-1 max-w-3xl">
@@ -325,1 +325,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+               تطبيق استراتيجية المطابقة خماسية المراحل (Exact → Normalized → Alias → Fuzzy → Review)، مع الحظر الصارم لأي دمج صامت،
@@ -326,1 +326,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+               والتحقق الإلزامي من نزاهة العلاقات التشغيلية (شاحنة ↔ ناقل، سائق ↔ كفالة، مادة ↔ نطاق المشروع).
@@ -327,1 +327,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
+             </p>
@@ -328,1 +328,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="text-right">
+           </div>
@@ -329,1 +329,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="text-xs text-indigo-300">نطاق المشروع المعزول</div>
+ 
@@ -330,1 +330,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="text-sm font-bold text-white flex items-center gap-1.5">
+           <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
@@ -331,1 +331,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <Lock className="w-3.5 h-3.5 text-emerald-400" />
+             <div className="text-right">
@@ -332,1 +332,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 {currentProjectId}
+               <div className="text-xs text-indigo-300">نطاق المشروع المعزول</div>
@@ -333,1 +333,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </div>
+               <div className="text-sm font-bold text-white flex items-center gap-1.5">
@@ -334,1 +334,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+                 <Lock className="w-3.5 h-3.5 text-emerald-400" />
@@ -335,1 +335,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="h-8 w-px bg-white/15 mx-1" />
+                 {currentProjectId}
@@ -336,1 +336,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="text-right">
+               </div>
@@ -337,1 +337,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="text-xs text-indigo-300">السياسة الرقابية</div>
+             </div>
@@ -338,1 +338,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="text-sm font-semibold text-amber-300 flex items-center gap-1">
+             <div className="h-8 w-px bg-white/15 mx-1" />
@@ -339,1 +339,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <ShieldAlert className="w-3.5 h-3.5" />
+             <div className="text-right">
@@ -340,1 +340,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 لا دمج صامت (Zero Silent Merge)
+               <div className="text-xs text-indigo-300">السياسة الرقابية</div>
@@ -341,1 +341,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </div>
+               <div className="text-sm font-semibold text-amber-300 flex items-center gap-1">
@@ -342,1 +342,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+                 <ShieldAlert className="w-3.5 h-3.5" />
@@ -343,1 +343,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+                 لا دمج صامت (Zero Silent Merge)
@@ -344,1 +344,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         </div>
+               </div>
@@ -345,1 +345,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       </div>
+             </div>
@@ -346,1 +346,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+           </div>
@@ -347,1 +347,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       {/* Main Grid: Rows List on Left, Active Row Resolution on Right */}
+         </div>
@@ -348,1 +348,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
+       </div>
@@ -349,1 +349,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         
+ 
@@ -350,1 +350,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         {/* Left Column: Sample Rows in Batch */}
+       {/* Main Grid: Rows List on Left, Active Row Resolution on Right */}
@@ -351,1 +351,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         <div className="lg:col-span-4 space-y-3">
+       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
@@ -352,1 +352,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
+         
@@ -353,1 +353,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="flex items-center justify-between mb-3">
+         {/* Left Column: Sample Rows in Batch */}
@@ -354,1 +354,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
+         <div className="lg:col-span-4 space-y-3">
@@ -355,1 +355,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <Layers className="w-4 h-4 text-indigo-600" />
+           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
@@ -356,1 +356,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 صفوف الدفعة التجريبية (Batch Rows)
+             <div className="flex items-center justify-between mb-3">
@@ -357,1 +357,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </h3>
+               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
@@ -358,1 +358,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
+                 <Layers className="w-4 h-4 text-indigo-600" />
@@ -359,1 +359,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 {demoRows.length} سجلات
+                 صفوف الدفعة التجريبية (Batch Rows)
@@ -360,1 +360,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </span>
+               </h3>
@@ -361,1 +361,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
@@ -362,1 +362,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                 {demoRows.length} سجلات
@@ -363,1 +363,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="space-y-2">
+               </span>
@@ -364,1 +364,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {demoRows.map((row) => {
+             </div>
@@ -365,1 +365,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 const res = computedResolutions[row.rowNumber] || {};
+ 
@@ -366,1 +366,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 const risk = EntityResolutionService.calculateRowRisk(res, row.isDuplicate);
+             <div className="space-y-2">
@@ -367,1 +367,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 const hasConflict = Object.values(res).some((r) => r.relationshipStatus === 'RELATIONSHIP_CONFLICT');
+               {demoRows.map((row) => {
@@ -368,1 +368,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 const isSelected = row.rowNumber === activeRowNumber;
+                 const res = computedResolutions[row.rowNumber] || {};
@@ -369,1 +369,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                 const risk = EntityResolutionService.calculateRowRisk(res, row.isDuplicate);
@@ -370,1 +370,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 return (
+                 const hasConflict = Object.values(res).some((r) => r.relationshipStatus === 'RELATIONSHIP_CONFLICT');
@@ -371,1 +371,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <button
+                 const isSelected = row.rowNumber === activeRowNumber;
@@ -372,1 +372,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     key={row.rowNumber}
+ 
@@ -373,1 +373,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     onClick={() => setActiveRowNumber(row.rowNumber)}
+                 return (
@@ -374,1 +374,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     className={`w-full text-right p-3 rounded-lg border transition-all duration-150 flex flex-col gap-1.5 ${
+                   <button
@@ -375,1 +375,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       isSelected
+                     key={row.rowNumber}
@@ -376,1 +376,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
+                     onClick={() => setActiveRowNumber(row.rowNumber)}
@@ -377,1 +377,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
+                     className={`w-full text-right p-3 rounded-lg border transition-all duration-150 flex flex-col gap-1.5 ${
@@ -378,1 +378,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     }`}
+                       isSelected
@@ -379,1 +379,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   >
+                         ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
@@ -380,1 +380,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center justify-between">
+                         : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
@@ -381,1 +381,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
+                     }`}
@@ -382,1 +382,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center">
+                   >
@@ -383,1 +383,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                           {row.rowNumber}
+                     <div className="flex items-center justify-between">
@@ -384,1 +384,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         </span>
+                       <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
@@ -385,1 +385,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <span>{row.ticketId}</span>
+                         <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center">
@@ -386,1 +386,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                           {row.rowNumber}
@@ -387,1 +387,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       {getRiskBadge(risk)}
+                         </span>
@@ -388,1 +388,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                         <span>{row.ticketId}</span>
@@ -389,1 +389,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </div>
@@ -390,1 +390,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="text-xs text-slate-600 grid grid-cols-2 gap-1 mt-1">
+                       {getRiskBadge(risk)}
@@ -391,1 +391,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div><span className="text-slate-400">شاحنة:</span> {row.sourceTruck}</div>
+                     </div>
@@ -392,1 +392,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div><span className="text-slate-400">ناقل:</span> {row.sourceCarrier || '— مفقود —'}</div>
+ 
@@ -393,1 +393,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                     <div className="text-xs text-slate-600 grid grid-cols-2 gap-1 mt-1">
@@ -394,1 +394,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       <div><span className="text-slate-400">شاحنة:</span> {row.sourceTruck}</div>
@@ -395,1 +395,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     {hasConflict && (
+                       <div><span className="text-slate-400">ناقل:</span> {row.sourceCarrier || '— مفقود —'}</div>
@@ -396,1 +396,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="mt-1 bg-rose-100 text-rose-800 text-[11px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-rose-200">
+                     </div>
@@ -397,1 +397,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <Link2Off className="w-3.5 h-3.5" />
+ 
@@ -398,1 +398,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         تعارض في العلاقة (Truck ↔ Carrier Conflict)
+                     {hasConflict && (
@@ -399,1 +399,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="mt-1 bg-rose-100 text-rose-800 text-[11px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-rose-200">
@@ -400,1 +400,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     )}
+                         <Link2Off className="w-3.5 h-3.5" />
@@ -401,1 +401,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </button>
+                         تعارض في العلاقة (Truck ↔ Carrier Conflict)
@@ -402,1 +402,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 );
+                       </div>
@@ -403,1 +403,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               })}
+                     )}
@@ -404,1 +404,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+                   </button>
@@ -405,1 +405,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+                 );
@@ -406,1 +406,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+               })}
@@ -407,1 +407,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           {/* Quick Rules Summary Card */}
+             </div>
@@ -408,1 +408,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
+           </div>
@@ -409,1 +409,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
+ 
@@ -410,1 +410,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <BookmarkCheck className="w-4 h-4 text-emerald-600" />
+           {/* Quick Rules Summary Card */}
@@ -411,1 +411,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               قواعد الاعتماد الصارمة (BLOCK 35 Invariants)
+           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
@@ -412,1 +412,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+             <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
@@ -413,1 +413,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <ul className="space-y-1.5 list-disc list-inside text-slate-600">
+               <BookmarkCheck className="w-4 h-4 text-emerald-600" />
@@ -414,1 +414,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <li>المطابقة التقريبية (Fuzzy) <strong className="text-rose-600">لا تعتمد تلقائياً أبداً</strong>.</li>
+               قواعد الاعتماد الصارمة (BLOCK 35 Invariants)
@@ -415,1 +415,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <li>إذا كانت الشاحنة معينة لناقل (A) وجاء الملف بناقل (B)، يتم تصنيف الحالة <strong className="text-rose-600">تعارض علاقة حرج</strong>.</li>
+             </div>
@@ -416,1 +416,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <li>لا يتم أبداً تخمين الناقل إذا كان مفقوداً من التذكرة.</li>
+             <ul className="space-y-1.5 list-disc list-inside text-slate-600">
@@ -417,1 +417,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <li>يتم منع أي محاولة لربط كيان من خارج نطاق المشروع.</li>
+               <li>المطابقة التقريبية (Fuzzy) <strong className="text-rose-600">لا تعتمد تلقائياً أبداً</strong>.</li>
@@ -418,1 +418,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <li>صفر عمليات كتابة على قاعدة البيانات في مرحلة القرار.</li>
+               <li>إذا كانت الشاحنة معينة لناقل (A) وجاء الملف بناقل (B)، يتم تصنيف الحالة <strong className="text-rose-600">تعارض علاقة حرج</strong>.</li>
@@ -419,1 +419,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </ul>
+               <li>لا يتم أبداً تخمين الناقل إذا كان مفقوداً من التذكرة.</li>
@@ -420,1 +420,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+               <li>يتم منع أي محاولة لربط كيان من خارج نطاق المشروع.</li>
@@ -421,1 +421,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         </div>
+               <li>صفر عمليات كتابة على قاعدة البيانات في مرحلة القرار.</li>
@@ -422,1 +422,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+             </ul>
@@ -423,1 +423,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         {/* Right Column: Active Row Deep Resolution Panel */}
+           </div>
@@ -424,1 +424,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         <div className="lg:col-span-8 space-y-5">
+         </div>
@@ -425,1 +425,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
+ 
@@ -426,1 +426,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             {/* Header of Active Row */}
+         {/* Right Column: Active Row Deep Resolution Panel */}
@@ -427,1 +427,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
+         <div className="lg:col-span-8 space-y-5">
@@ -428,1 +428,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div>
+           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
@@ -429,1 +429,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className="text-xs text-slate-500 flex items-center gap-1.5">
+             {/* Header of Active Row */}
@@ -430,1 +430,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <span>فحص السجل الوارد رقم {activeRow.rowNumber}</span>
+             <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
@@ -431,1 +431,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <span>•</span>
+               <div>
@@ -432,1 +432,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <span>تذكرة: <strong className="text-slate-800">{activeRow.ticketId}</strong></span>
+                 <div className="text-xs text-slate-500 flex items-center gap-1.5">
@@ -433,1 +433,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </div>
+                   <span>فحص السجل الوارد رقم {activeRow.rowNumber}</span>
@@ -434,1 +434,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
+                   <span>•</span>
@@ -435,1 +435,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <span>نتائج حل الكيانات وفحص العلاقات</span>
+                   <span>تذكرة: <strong className="text-slate-800">{activeRow.ticketId}</strong></span>
@@ -437,1 +437,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </div>
+                 <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
@@ -438,1 +438,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                   <span>نتائج حل الكيانات وفحص العلاقات</span>
@@ -439,1 +439,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="flex items-center gap-2">
+                 </div>
@@ -440,1 +440,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className="text-right">
+               </div>
@@ -441,1 +441,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="text-[11px] text-slate-500">مستوى مخاطر السجل</div>
+ 
@@ -442,1 +442,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="mt-0.5">{getRiskBadge(activeRowRisk)}</div>
+               <div className="flex items-center gap-2">
@@ -443,1 +443,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </div>
+                 <div className="text-right">
@@ -444,1 +444,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className="h-8 w-px bg-slate-200 mx-2" />
+                   <div className="text-[11px] text-slate-500">مستوى مخاطر السجل</div>
@@ -445,1 +445,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className="text-right">
+                   <div className="mt-0.5">{getRiskBadge(activeRowRisk)}</div>
@@ -446,1 +446,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="text-[11px] text-slate-500">الاعتماد التلقائي</div>
+                 </div>
@@ -447,1 +447,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="mt-0.5">
+                 <div className="h-8 w-px bg-slate-200 mx-2" />
@@ -448,1 +448,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     {canAutoAccept ? (
+                 <div className="text-right">
@@ -449,1 +449,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold border border-emerald-300">
+                   <div className="text-[11px] text-slate-500">الاعتماد التلقائي</div>
@@ -450,1 +450,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         متاح (Auto-Accept Safe)
+                   <div className="mt-0.5">
@@ -451,1 +451,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </span>
+                     {canAutoAccept ? (
@@ -452,1 +452,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     ) : (
+                       <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold border border-emerald-300">
@@ -453,1 +453,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-300">
+                         متاح (Auto-Accept Safe)
@@ -454,1 +454,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         محظور (Requires Review)
+                       </span>
@@ -455,1 +455,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </span>
+                     ) : (
@@ -456,1 +456,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     )}
+                       <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-300">
@@ -457,1 +457,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                         محظور (Requires Review)
@@ -458,1 +458,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </div>
+                       </span>
@@ -459,1 +459,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </div>
+                     )}
@@ -460,1 +460,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+                   </div>
@@ -461,1 +461,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                 </div>
@@ -462,1 +462,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             {/* Entities Resolution Breakdown */}
+               </div>
@@ -463,1 +463,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="mt-4 space-y-4">
+             </div>
@@ -465,1 +465,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {/* 1. TRUCK Entity Card */}
+             {/* Entities Resolution Breakdown */}
@@ -466,1 +466,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {activeRowRes.TRUCK && (
+             <div className="mt-4 space-y-4">
@@ -467,1 +467,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className={`p-4 rounded-xl border transition-all ${
+ 
@@ -468,1 +468,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   activeRowRes.TRUCK.relationshipStatus === 'RELATIONSHIP_CONFLICT'
+               {/* 1. TRUCK Entity Card */}
@@ -469,1 +469,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     ? 'border-rose-300 bg-rose-50/50'
+               {activeRowRes.TRUCK && (
@@ -470,1 +470,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     : activeRowRes.TRUCK.relationshipStatus === 'TRUCK_MATCHED_CARRIER_UNKNOWN'
+                 <div className={`p-4 rounded-xl border transition-all ${
@@ -471,1 +471,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     ? 'border-amber-300 bg-amber-50/50'
+                   activeRowRes.TRUCK.relationshipStatus === 'RELATIONSHIP_CONFLICT'
@@ -472,1 +472,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     : 'border-slate-200 bg-slate-50/50'
+                     ? 'border-rose-300 bg-rose-50/50'
@@ -473,1 +473,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 }`}>
+                     : activeRowRes.TRUCK.relationshipStatus === 'TRUCK_MATCHED_CARRIER_UNKNOWN'
@@ -474,1 +474,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
+                     ? 'border-amber-300 bg-amber-50/50'
@@ -475,1 +475,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center gap-2">
+                     : 'border-slate-200 bg-slate-50/50'
@@ -476,1 +476,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
+                 }`}>
@@ -477,1 +477,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <Truck className="w-4 h-4" />
+                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
@@ -478,1 +478,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                     <div className="flex items-center gap-2">
@@ -479,1 +479,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="font-bold text-slate-800 text-sm">الشاحنة / لوحة المركبة (Truck Plate)</span>
+                       <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
@@ -480,1 +480,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       {getMethodBadge(activeRowRes.TRUCK.matchMethod)}
+                         <Truck className="w-4 h-4" />
@@ -481,1 +481,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       </div>
@@ -482,1 +482,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center gap-2">
+                       <span className="font-bold text-slate-800 text-sm">الشاحنة / لوحة المركبة (Truck Plate)</span>
@@ -483,1 +483,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs text-slate-500">نسبة الثقة:</span>
+                       {getMethodBadge(activeRowRes.TRUCK.matchMethod)}
@@ -484,1 +484,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
+                     </div>
@@ -485,1 +485,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         {Math.round(activeRowRes.TRUCK.confidence * 100)}%
+                     <div className="flex items-center gap-2">
@@ -486,1 +486,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </span>
+                       <span className="text-xs text-slate-500">نسبة الثقة:</span>
@@ -487,1 +487,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
@@ -488,1 +488,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                         {Math.round(activeRowRes.TRUCK.confidence * 100)}%
@@ -489,1 +489,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </span>
@@ -490,1 +490,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
+                     </div>
@@ -491,1 +491,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
+                   </div>
@@ -492,1 +492,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-400 mb-1">القيمة الأصلية من الملف (Raw Value):</div>
+ 
@@ -493,1 +493,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-slate-800 text-sm font-mono">{activeRowRes.TRUCK.sourceValue || '—'}</div>
+                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
@@ -494,1 +494,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-[11px] text-slate-500 mt-1">المعايرة: {activeRowRes.TRUCK.normalizedValue}</div>
+                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
@@ -495,1 +495,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <div className="text-slate-400 mb-1">القيمة الأصلية من الملف (Raw Value):</div>
@@ -496,1 +496,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       <div className="font-bold text-slate-800 text-sm font-mono">{activeRowRes.TRUCK.sourceValue || '—'}</div>
@@ -497,1 +497,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
+                       <div className="text-[11px] text-slate-500 mt-1">المعايرة: {activeRowRes.TRUCK.normalizedValue}</div>
@@ -498,1 +498,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-400 mb-1">الكيان المقترح في السجلات (Matched Master):</div>
+                     </div>
@@ -499,1 +499,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-indigo-700 text-sm">
+ 
@@ -500,1 +500,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         {activeRowRes.TRUCK.matchedValue || 'غير مسجل في الأسطول'}
+                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
@@ -501,1 +501,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="text-slate-400 mb-1">الكيان المقترح في السجلات (Matched Master):</div>
@@ -502,1 +502,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-[11px] text-slate-500 mt-1">
+                       <div className="font-bold text-indigo-700 text-sm">
@@ -503,1 +503,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         معرف الكيان: {activeRowRes.TRUCK.entityId || 'لا يوجد'}
+                         {activeRowRes.TRUCK.matchedValue || 'غير مسجل في الأسطول'}
@@ -505,1 +505,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <div className="text-[11px] text-slate-500 mt-1">
@@ -506,1 +506,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                         معرف الكيان: {activeRowRes.TRUCK.entityId || 'لا يوجد'}
@@ -507,1 +507,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </div>
@@ -508,1 +508,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {/* CRITICAL RELATIONSHIP CONFLICT BANNER */}
+                     </div>
@@ -509,1 +509,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {activeRowRes.TRUCK.relationshipStatus === 'RELATIONSHIP_CONFLICT' && (
+                   </div>
@@ -510,1 +510,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="mt-3 p-3 bg-rose-100/80 border border-rose-300 rounded-lg text-rose-900 text-xs">
+ 
@@ -511,1 +511,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
+                   {/* CRITICAL RELATIONSHIP CONFLICT BANNER */}
@@ -512,1 +512,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <ShieldAlert className="w-4 h-4 text-rose-600" />
+                   {activeRowRes.TRUCK.relationshipStatus === 'RELATIONSHIP_CONFLICT' && (
@@ -513,1 +513,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         تعارض علاقة حرج (RELATIONSHIP CONFLICT): الشاحنة ↔ الناقل
+                     <div className="mt-3 p-3 bg-rose-100/80 border border-rose-300 rounded-lg text-rose-900 text-xs">
@@ -514,1 +514,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
@@ -515,1 +515,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <p className="leading-relaxed">
+                         <ShieldAlert className="w-4 h-4 text-rose-600" />
@@ -516,1 +516,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         {activeRowRes.TRUCK.conflictDetails}
+                         تعارض علاقة حرج (RELATIONSHIP CONFLICT): الشاحنة ↔ الناقل
@@ -517,1 +517,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </p>
+                       </div>
@@ -518,1 +518,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="mt-2 p-2 bg-white/80 rounded border border-rose-200 flex items-center justify-between text-[11px]">
+                       <p className="leading-relaxed">
@@ -519,1 +519,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <div>الناقل الفعلي للشاحنة بالسجلات: <strong className="text-slate-800">الشركة الشرقية للنقل</strong></div>
+                         {activeRowRes.TRUCK.conflictDetails}
@@ -520,1 +520,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <div className="text-rose-700 font-bold">الناقل المدعى بالملف: {activeRow.sourceCarrier}</div>
+                       </p>
@@ -521,1 +521,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="mt-2 p-2 bg-white/80 rounded border border-rose-200 flex items-center justify-between text-[11px]">
@@ -522,1 +522,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                         <div>الناقل الفعلي للشاحنة بالسجلات: <strong className="text-slate-800">الشركة الشرقية للنقل</strong></div>
@@ -523,1 +523,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   )}
+                         <div className="text-rose-700 font-bold">الناقل المدعى بالملف: {activeRow.sourceCarrier}</div>
@@ -524,1 +524,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </div>
@@ -525,1 +525,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {/* TRUCK MATCHED BUT CARRIER UNKNOWN */}
+                     </div>
@@ -526,1 +526,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {activeRowRes.TRUCK.relationshipStatus === 'TRUCK_MATCHED_CARRIER_UNKNOWN' && (
+                   )}
@@ -527,1 +527,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="mt-3 p-3 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-900 text-xs">
+ 
@@ -528,1 +528,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
+                   {/* TRUCK MATCHED BUT CARRIER UNKNOWN */}
@@ -529,1 +529,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <AlertTriangle className="w-4 h-4 text-amber-600" />
+                   {activeRowRes.TRUCK.relationshipStatus === 'TRUCK_MATCHED_CARRIER_UNKNOWN' && (
@@ -530,1 +530,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         الشاحنة معروفة ولكن الناقل مفقود (TRUCK_MATCHED_CARRIER_UNKNOWN)
+                     <div className="mt-3 p-3 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-900 text-xs">
@@ -531,1 +531,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
@@ -532,1 +532,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <p className="leading-relaxed">{activeRowRes.TRUCK.conflictDetails}</p>
+                         <AlertTriangle className="w-4 h-4 text-amber-600" />
@@ -533,1 +533,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                         الشاحنة معروفة ولكن الناقل مفقود (TRUCK_MATCHED_CARRIER_UNKNOWN)
@@ -534,1 +534,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   )}
+                       </div>
@@ -535,1 +535,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       <p className="leading-relaxed">{activeRowRes.TRUCK.conflictDetails}</p>
@@ -536,1 +536,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {/* Human Decision Buttons */}
+                     </div>
@@ -537,1 +537,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
+                   )}
@@ -538,1 +538,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <button
+ 
@@ -539,1 +539,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       onClick={() => handleUserDecision('TRUCK', 'ACCEPT_CANDIDATE')}
+                   {/* Human Decision Buttons */}
@@ -540,1 +540,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       disabled={!activeRowRes.TRUCK.entityId}
+                   <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
@@ -541,1 +541,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 disabled:opacity-40"
+                     <button
@@ -542,1 +542,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     >
+                       onClick={() => handleUserDecision('TRUCK', 'ACCEPT_CANDIDATE')}
@@ -543,1 +543,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <Check className="w-3.5 h-3.5" />
+                       disabled={!activeRowRes.TRUCK.entityId}
@@ -544,1 +544,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       قبول المقترح
+                       className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 disabled:opacity-40"
@@ -545,1 +545,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </button>
+                     >
@@ -546,1 +546,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <button
+                       <Check className="w-3.5 h-3.5" />
@@ -547,1 +547,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       onClick={() => handleUserDecision('TRUCK', 'REJECT_CANDIDATE')}
+                       قبول المقترح
@@ -548,1 +548,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold border border-rose-200 flex items-center gap-1"
+                     </button>
@@ -549,1 +549,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     >
+                     <button
@@ -550,1 +550,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <X className="w-3.5 h-3.5" />
+                       onClick={() => handleUserDecision('TRUCK', 'REJECT_CANDIDATE')}
@@ -551,1 +551,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       رفض المقترح
+                       className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold border border-rose-200 flex items-center gap-1"
@@ -552,1 +552,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </button>
+                     >
@@ -553,1 +553,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <button
+                       <X className="w-3.5 h-3.5" />
@@ -554,1 +554,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       onClick={() => {
+                       رفض المقترح
@@ -555,1 +555,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         setTargetSelectField('TRUCK');
+                     </button>
@@ -556,1 +556,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         setCustomSelectModalOpen(true);
+                     <button
@@ -557,1 +557,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       }}
+                       onClick={() => {
@@ -558,1 +558,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 flex items-center gap-1"
+                         setTargetSelectField('TRUCK');
@@ -559,1 +559,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     >
+                         setCustomSelectModalOpen(true);
@@ -560,1 +560,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <SlidersHorizontal className="w-3.5 h-3.5" />
+                       }}
@@ -561,1 +561,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       اختيار شاحنة أخرى من المشروع
+                       className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 flex items-center gap-1"
@@ -562,1 +562,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </button>
+                     >
@@ -563,1 +563,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                       <SlidersHorizontal className="w-3.5 h-3.5" />
@@ -564,1 +564,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </div>
+                       اختيار شاحنة أخرى من المشروع
@@ -565,1 +565,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               )}
+                     </button>
@@ -566,1 +566,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                   </div>
@@ -567,1 +567,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {/* 2. CARRIER Entity Card */}
+                 </div>
@@ -568,1 +568,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {activeRowRes.CARRIER && (
+               )}
@@ -569,1 +569,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
+ 
@@ -570,1 +570,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
+               {/* 2. CARRIER Entity Card */}
@@ -571,1 +571,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center gap-2">
+               {activeRowRes.CARRIER && (
@@ -572,1 +572,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
+                 <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
@@ -573,1 +573,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <Building2 className="w-4 h-4" />
+                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
@@ -574,1 +574,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                     <div className="flex items-center gap-2">
@@ -575,1 +575,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="font-bold text-slate-800 text-sm">الناقل التشغيلي (Carrier)</span>
+                       <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
@@ -576,1 +576,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       {getMethodBadge(activeRowRes.CARRIER.matchMethod)}
+                         <Building2 className="w-4 h-4" />
@@ -577,1 +577,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       </div>
@@ -578,1 +578,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center gap-2">
+                       <span className="font-bold text-slate-800 text-sm">الناقل التشغيلي (Carrier)</span>
@@ -579,1 +579,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs text-slate-500">نسبة الثقة:</span>
+                       {getMethodBadge(activeRowRes.CARRIER.matchMethod)}
@@ -580,1 +580,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
+                     </div>
@@ -581,1 +581,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         {Math.round(activeRowRes.CARRIER.confidence * 100)}%
+                     <div className="flex items-center gap-2">
@@ -582,1 +582,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </span>
+                       <span className="text-xs text-slate-500">نسبة الثقة:</span>
@@ -583,1 +583,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
@@ -584,1 +584,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                         {Math.round(activeRowRes.CARRIER.confidence * 100)}%
@@ -585,1 +585,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </span>
@@ -586,1 +586,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
+                     </div>
@@ -587,1 +587,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
+                   </div>
@@ -588,1 +588,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-400 mb-1">القيمة الأصلية من الملف (Raw Value):</div>
+ 
@@ -589,1 +589,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-slate-800 text-sm">{activeRowRes.CARRIER.sourceValue || '— مفقود —'}</div>
+                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
@@ -590,1 +590,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-[11px] text-slate-500 mt-1">المعايرة: {activeRowRes.CARRIER.normalizedValue || '—'}</div>
+                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
@@ -591,1 +591,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <div className="text-slate-400 mb-1">القيمة الأصلية من الملف (Raw Value):</div>
@@ -592,1 +592,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       <div className="font-bold text-slate-800 text-sm">{activeRowRes.CARRIER.sourceValue || '— مفقود —'}</div>
@@ -593,1 +593,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
+                       <div className="text-[11px] text-slate-500 mt-1">المعايرة: {activeRowRes.CARRIER.normalizedValue || '—'}</div>
@@ -594,1 +594,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-400 mb-1">الناقل المطابق / المقترح:</div>
+                     </div>
@@ -595,1 +595,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-indigo-700 text-sm">
+ 
@@ -596,1 +596,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         {activeRowRes.CARRIER.matchedValue || 'غير معروف'}
+                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
@@ -597,1 +597,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="text-slate-400 mb-1">الناقل المطابق / المقترح:</div>
@@ -598,1 +598,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-[11px] text-slate-500 mt-1">
+                       <div className="font-bold text-indigo-700 text-sm">
@@ -599,1 +599,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         معرف الناقل: {activeRowRes.CARRIER.entityId || 'لا يوجد'}
+                         {activeRowRes.CARRIER.matchedValue || 'غير معروف'}
@@ -601,1 +601,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <div className="text-[11px] text-slate-500 mt-1">
@@ -602,1 +602,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                         معرف الناقل: {activeRowRes.CARRIER.entityId || 'لا يوجد'}
@@ -603,1 +603,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </div>
@@ -604,1 +604,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {activeRowRes.CARRIER.conflictDetails && (
+                     </div>
@@ -605,1 +605,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
+                   </div>
@@ -606,1 +606,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       {activeRowRes.CARRIER.conflictDetails}
+ 
@@ -607,1 +607,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                   {activeRowRes.CARRIER.conflictDetails && (
@@ -608,1 +608,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   )}
+                     <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
@@ -609,1 +609,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       {activeRowRes.CARRIER.conflictDetails}
@@ -610,1 +610,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {/* Actions */}
+                     </div>
@@ -611,1 +611,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
+                   )}
@@ -612,1 +612,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <button
+ 
@@ -613,1 +613,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       onClick={() => handleUserDecision('CARRIER', 'ACCEPT_CANDIDATE')}
+                   {/* Actions */}
@@ -614,1 +614,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       disabled={!activeRowRes.CARRIER.entityId}
+                   <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
@@ -615,1 +615,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 disabled:opacity-40"
+                     <button
@@ -616,1 +616,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     >
+                       onClick={() => handleUserDecision('CARRIER', 'ACCEPT_CANDIDATE')}
@@ -617,1 +617,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <Check className="w-3.5 h-3.5" />
+                       disabled={!activeRowRes.CARRIER.entityId}
@@ -618,1 +618,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       قبول المقترح
+                       className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 disabled:opacity-40"
@@ -619,1 +619,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </button>
+                     >
@@ -620,1 +620,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <button
+                       <Check className="w-3.5 h-3.5" />
@@ -621,1 +621,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       onClick={() => {
+                       قبول المقترح
@@ -622,1 +622,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         setTargetSelectField('CARRIER');
+                     </button>
@@ -623,1 +623,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         setCustomSelectModalOpen(true);
+                     <button
@@ -624,1 +624,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       }}
+                       onClick={() => {
@@ -625,1 +625,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 flex items-center gap-1"
+                         setTargetSelectField('CARRIER');
@@ -626,1 +626,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     >
+                         setCustomSelectModalOpen(true);
@@ -627,1 +627,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <SlidersHorizontal className="w-3.5 h-3.5" />
+                       }}
@@ -628,1 +628,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       اختيار ناقل آخر
+                       className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 flex items-center gap-1"
@@ -629,1 +629,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </button>
+                     >
@@ -630,1 +630,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                       <SlidersHorizontal className="w-3.5 h-3.5" />
@@ -631,1 +631,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </div>
+                       اختيار ناقل آخر
@@ -632,1 +632,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               )}
+                     </button>
@@ -633,1 +633,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                   </div>
@@ -634,1 +634,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {/* 3. MATERIAL Entity Card */}
+                 </div>
@@ -635,1 +635,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {activeRowRes.MATERIAL && (
+               )}
@@ -636,1 +636,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <div className={`p-4 rounded-xl border transition-all ${
+ 
@@ -637,1 +637,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   activeRowRes.MATERIAL.relationshipStatus === 'MATERIAL_PROJECT_CONFLICT'
+               {/* 3. MATERIAL Entity Card */}
@@ -638,1 +638,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     ? 'border-rose-300 bg-rose-50/50'
+               {activeRowRes.MATERIAL && (
@@ -639,1 +639,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     : 'border-slate-200 bg-slate-50/50'
+                 <div className={`p-4 rounded-xl border transition-all ${
@@ -640,1 +640,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 }`}>
+                   activeRowRes.MATERIAL.relationshipStatus === 'MATERIAL_PROJECT_CONFLICT'
@@ -641,1 +641,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
+                     ? 'border-rose-300 bg-rose-50/50'
@@ -642,1 +642,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center gap-2">
+                     : 'border-slate-200 bg-slate-50/50'
@@ -643,1 +643,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
+                 }`}>
@@ -644,1 +644,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <Package className="w-4 h-4" />
+                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
@@ -645,1 +645,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                     <div className="flex items-center gap-2">
@@ -646,1 +646,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="font-bold text-slate-800 text-sm">المادة الموردة ونطاق المشروع (Material Scope)</span>
+                       <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
@@ -647,1 +647,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       {getMethodBadge(activeRowRes.MATERIAL.matchMethod)}
+                         <Package className="w-4 h-4" />
@@ -648,1 +648,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       </div>
@@ -649,1 +649,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="flex items-center gap-2">
+                       <span className="font-bold text-slate-800 text-sm">المادة الموردة ونطاق المشروع (Material Scope)</span>
@@ -650,1 +650,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs text-slate-500">نسبة الثقة:</span>
+                       {getMethodBadge(activeRowRes.MATERIAL.matchMethod)}
@@ -651,1 +651,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
+                     </div>
@@ -652,1 +652,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         {Math.round(activeRowRes.MATERIAL.confidence * 100)}%
+                     <div className="flex items-center gap-2">
@@ -653,1 +653,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </span>
+                       <span className="text-xs text-slate-500">نسبة الثقة:</span>
@@ -654,1 +654,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                       <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
@@ -655,1 +655,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                         {Math.round(activeRowRes.MATERIAL.confidence * 100)}%
@@ -656,1 +656,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       </span>
@@ -657,1 +657,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
+                     </div>
@@ -658,1 +658,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
+                   </div>
@@ -659,1 +659,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-400 mb-1">المادة بالملف:</div>
+ 
@@ -660,1 +660,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-slate-800 text-sm">{activeRowRes.MATERIAL.sourceValue}</div>
+                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
@@ -661,1 +661,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
@@ -662,1 +662,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
+                       <div className="text-slate-400 mb-1">المادة بالملف:</div>
@@ -663,1 +663,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-400 mb-1">المطابقة المعتمدة:</div>
+                       <div className="font-bold text-slate-800 text-sm">{activeRowRes.MATERIAL.sourceValue}</div>
@@ -664,1 +664,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-indigo-700 text-sm">{activeRowRes.MATERIAL.matchedValue || 'غير مطابقة'}</div>
+                     </div>
@@ -665,1 +665,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                     <div className="bg-white p-2.5 rounded-lg border border-slate-200">
@@ -666,1 +666,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                       <div className="text-slate-400 mb-1">المطابقة المعتمدة:</div>
@@ -667,1 +667,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       <div className="font-bold text-indigo-700 text-sm">{activeRowRes.MATERIAL.matchedValue || 'غير مطابقة'}</div>
@@ -668,1 +668,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   {activeRowRes.MATERIAL.relationshipStatus === 'MATERIAL_PROJECT_CONFLICT' && (
+                     </div>
@@ -669,1 +669,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div className="mt-3 p-3 bg-rose-100/80 border border-rose-300 rounded-lg text-rose-900 text-xs">
+                   </div>
@@ -670,1 +670,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
+ 
@@ -671,1 +671,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <ShieldAlert className="w-4 h-4 text-rose-600" />
+                   {activeRowRes.MATERIAL.relationshipStatus === 'MATERIAL_PROJECT_CONFLICT' && (
@@ -672,1 +672,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         تعارض المادة مع نطاق المشروع (MATERIAL_PROJECT_CONFLICT)
+                     <div className="mt-3 p-3 bg-rose-100/80 border border-rose-300 rounded-lg text-rose-900 text-xs">
@@ -673,1 +673,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </div>
+                       <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
@@ -674,1 +674,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <p className="leading-relaxed">{activeRowRes.MATERIAL.conflictDetails}</p>
+                         <ShieldAlert className="w-4 h-4 text-rose-600" />
@@ -675,1 +675,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                         تعارض المادة مع نطاق المشروع (MATERIAL_PROJECT_CONFLICT)
@@ -676,1 +676,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   )}
+                       </div>
@@ -677,1 +677,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                       <p className="leading-relaxed">{activeRowRes.MATERIAL.conflictDetails}</p>
@@ -678,1 +678,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
+                     </div>
@@ -679,1 +679,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <button
+                   )}
@@ -680,1 +680,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       onClick={() => {
+ 
@@ -681,1 +681,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         setTargetSelectField('MATERIAL');
+                   <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
@@ -682,1 +682,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         setCustomSelectModalOpen(true);
+                     <button
@@ -683,1 +683,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       }}
+                       onClick={() => {
@@ -684,1 +684,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 flex items-center gap-1"
+                         setTargetSelectField('MATERIAL');
@@ -685,1 +685,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     >
+                         setCustomSelectModalOpen(true);
@@ -686,1 +686,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <SlidersHorizontal className="w-3.5 h-3.5" />
+                       }}
@@ -687,1 +687,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       اختيار مادة معتمدة من المشروع
+                       className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 flex items-center gap-1"
@@ -688,1 +688,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </button>
+                     >
@@ -689,1 +689,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </div>
+                       <SlidersHorizontal className="w-3.5 h-3.5" />
@@ -690,1 +690,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </div>
+                       اختيار مادة معتمدة من المشروع
@@ -691,1 +691,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               )}
+                     </button>
@@ -692,1 +692,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                   </div>
@@ -693,1 +693,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+                 </div>
@@ -694,1 +694,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+               )}
@@ -696,1 +696,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           {/* Audit Trail of Human Decisions */}
+             </div>
@@ -697,1 +697,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
+           </div>
@@ -698,1 +698,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
+ 
@@ -699,1 +699,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
+           {/* Audit Trail of Human Decisions */}
@@ -700,1 +700,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <History className="w-4 h-4 text-indigo-600" />
+           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
@@ -701,1 +701,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 سجل تدقيق قرارات حل الكيانات (Resolution Audit Trail)
+             <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
@@ -702,1 +702,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </h4>
+               <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
@@ -703,1 +703,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
+                 <History className="w-4 h-4 text-indigo-600" />
@@ -704,1 +704,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 {auditEntries.length} قرارات موثقة
+                 سجل تدقيق قرارات حل الكيانات (Resolution Audit Trail)
@@ -705,1 +705,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </span>
+               </h4>
@@ -706,1 +706,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
@@ -707,1 +707,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                 {auditEntries.length} قرارات موثقة
@@ -708,1 +708,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             {auditEntries.length === 0 ? (
+               </span>
@@ -709,1 +709,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="text-center py-6 text-xs text-slate-500">
+             </div>
@@ -710,1 +710,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 لم يتم اتخاذ قرارات يدوية بعد. كافة المقترحات في وضع المراجعة أو معتمدة وفق السياسة الآلية.
+ 
@@ -711,1 +711,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </div>
+             {auditEntries.length === 0 ? (
@@ -712,1 +712,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             ) : (
+               <div className="text-center py-6 text-xs text-slate-500">
@@ -713,1 +713,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <div className="overflow-x-auto">
+                 لم يتم اتخاذ قرارات يدوية بعد. كافة المقترحات في وضع المراجعة أو معتمدة وفق السياسة الآلية.
@@ -714,1 +714,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <table className="w-full text-right text-xs">
+               </div>
@@ -715,1 +715,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
+             ) : (
@@ -716,1 +716,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <tr>
+               <div className="overflow-x-auto">
@@ -717,1 +717,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">الوقت</th>
+                 <table className="w-full text-right text-xs">
@@ -718,1 +718,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">الصف</th>
+                   <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
@@ -719,1 +719,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">الكيان</th>
+                     <tr>
@@ -720,1 +720,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">القرار المتخذ</th>
+                       <th className="p-2">الوقت</th>
@@ -721,1 +721,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">القيمة المختارة</th>
+                       <th className="p-2">الصف</th>
@@ -722,1 +722,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">المستخدم</th>
+                       <th className="p-2">الكيان</th>
@@ -723,1 +723,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <th className="p-2">الملاحظات</th>
+                       <th className="p-2">القرار المتخذ</th>
@@ -724,1 +724,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </tr>
+                       <th className="p-2">القيمة المختارة</th>
@@ -725,1 +725,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </thead>
+                       <th className="p-2">المستخدم</th>
@@ -726,1 +726,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <tbody className="divide-y divide-slate-100">
+                       <th className="p-2">الملاحظات</th>
@@ -727,1 +727,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     {auditEntries.slice(-5).reverse().map((entry, idx) => (
+                     </tr>
@@ -728,1 +728,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <tr key={idx} className="hover:bg-slate-50">
+                   </thead>
@@ -729,1 +729,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2 font-mono text-slate-500">{new Date(entry.timestamp).toLocaleTimeString('ar-SA')}</td>
+                   <tbody className="divide-y divide-slate-100">
@@ -730,1 +730,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2 font-bold text-slate-800">#{entry.rowId}</td>
+                     {auditEntries.slice(-5).reverse().map((entry, idx) => (
@@ -731,1 +731,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2 font-semibold text-indigo-700">{entry.entityType}</td>
+                       <tr key={idx} className="hover:bg-slate-50">
@@ -732,1 +732,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2">
+                         <td className="p-2 font-mono text-slate-500">{new Date(entry.timestamp).toLocaleTimeString('ar-SA')}</td>
@@ -733,1 +733,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                           <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
+                         <td className="p-2 font-bold text-slate-800">#{entry.rowId}</td>
@@ -734,1 +734,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                             {entry.decision}
+                         <td className="p-2 font-semibold text-indigo-700">{entry.entityType}</td>
@@ -735,1 +735,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                           </span>
+                         <td className="p-2">
@@ -736,1 +736,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         </td>
+                           <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
@@ -737,1 +737,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2 font-bold text-slate-800">{entry.selectedEntityId || '—'}</td>
+                             {entry.decision}
@@ -738,1 +738,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2 text-slate-600">{entry.actorId}</td>
+                           </span>
@@ -739,1 +739,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                         <td className="p-2 text-slate-500 text-[11px]">{entry.notes || '—'}</td>
+                         </td>
@@ -740,1 +740,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       </tr>
+                         <td className="p-2 font-bold text-slate-800">{entry.selectedEntityId || '—'}</td>
@@ -741,1 +741,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     ))}
+                         <td className="p-2 text-slate-600">{entry.actorId}</td>
@@ -742,1 +742,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </tbody>
+                         <td className="p-2 text-slate-500 text-[11px]">{entry.notes || '—'}</td>
@@ -743,1 +743,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 </table>
+                       </tr>
@@ -744,1 +744,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </div>
+                     ))}
@@ -745,1 +745,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             )}
+                   </tbody>
@@ -746,1 +746,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+                 </table>
@@ -747,1 +747,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         </div>
+               </div>
@@ -748,1 +748,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+             )}
@@ -749,1 +749,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       </div>
+           </div>
@@ -750,1 +750,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+         </div>
@@ -751,1 +751,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       {/* Modal: Select Alternate Entity from Master Data */}
+ 
@@ -752,1 +752,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       {customSelectModalOpen && (
+       </div>
@@ -753,1 +753,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
+ 
@@ -754,1 +754,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
+       {/* Modal: Select Alternate Entity from Master Data */}
@@ -755,1 +755,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="flex items-center justify-between pb-3 border-b border-slate-100">
+       {customSelectModalOpen && (
@@ -756,1 +756,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
+         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
@@ -757,1 +757,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
+           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
@@ -758,1 +758,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 اختيار كيان معتمد من نطاق المشروع ({targetSelectField})
+             <div className="flex items-center justify-between pb-3 border-b border-slate-100">
@@ -759,1 +759,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </h3>
+               <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
@@ -760,1 +760,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <button
+                 <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
@@ -761,1 +761,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 onClick={() => setCustomSelectModalOpen(false)}
+                 اختيار كيان معتمد من نطاق المشروع ({targetSelectField})
@@ -762,1 +762,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
+               </h3>
@@ -763,1 +763,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               >
+               <button
@@ -764,1 +764,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 <X className="w-5 h-5" />
+                 onClick={() => setCustomSelectModalOpen(false)}
@@ -765,1 +765,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </button>
+                 className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
@@ -766,1 +766,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+               >
@@ -767,1 +767,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                 <X className="w-5 h-5" />
@@ -768,1 +768,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <p className="text-xs text-slate-600">
+               </button>
@@ -769,1 +769,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               اختر الكيان المعتمد المخصص لمشروع <strong className="text-slate-800">{currentProjectId}</strong>.
+             </div>
@@ -770,1 +770,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               يمنع النظام الرقابي اختيار أي كيان لا يتبع هذا المشروع.
+ 
@@ -771,1 +771,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </p>
+             <p className="text-xs text-slate-600">
@@ -772,1 +772,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+               اختر الكيان المعتمد المخصص لمشروع <strong className="text-slate-800">{currentProjectId}</strong>.
@@ -773,1 +773,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
+               يمنع النظام الرقابي اختيار أي كيان لا يتبع هذا المشروع.
@@ -774,1 +774,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {targetSelectField === 'TRUCK' &&
+             </p>
@@ -775,1 +775,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 pipelineContext.knownEntities?.trucks?.map((trk) => (
+ 
@@ -776,1 +776,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <button
+             <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
@@ -777,1 +777,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     key={trk.truckId}
+               {targetSelectField === 'TRUCK' &&
@@ -778,1 +778,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     onClick={() => {
+                 pipelineContext.knownEntities?.trucks?.map((trk) => (
@@ -779,1 +779,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       handleUserDecision('TRUCK', 'SELECT_ALTERNATE', trk.truckId, trk.plate);
+                   <button
@@ -780,1 +780,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     }}
+                     key={trk.truckId}
@@ -781,1 +781,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     className="w-full p-3 text-right rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between text-xs"
+                     onClick={() => {
@@ -782,1 +782,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   >
+                       handleUserDecision('TRUCK', 'SELECT_ALTERNATE', trk.truckId, trk.plate);
@@ -783,1 +783,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div>
+                     }}
@@ -784,1 +784,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-slate-800 text-sm font-mono">{trk.plate}</div>
+                     className="w-full p-3 text-right rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between text-xs"
@@ -785,1 +785,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-500 text-[11px]">الناقل: {trk.carrierId || 'غير محدد'}</div>
+                   >
@@ -786,1 +786,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                     <div>
@@ -787,1 +787,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <span className="text-indigo-600 font-semibold">اختيار</span>
+                       <div className="font-bold text-slate-800 text-sm font-mono">{trk.plate}</div>
@@ -788,1 +788,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </button>
+                       <div className="text-slate-500 text-[11px]">الناقل: {trk.carrierId || 'غير محدد'}</div>
@@ -789,1 +789,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 ))}
+                     </div>
@@ -790,1 +790,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                     <span className="text-indigo-600 font-semibold">اختيار</span>
@@ -791,1 +791,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {targetSelectField === 'CARRIER' &&
+                   </button>
@@ -792,1 +792,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 pipelineContext.knownEntities?.carriers?.map((car) => (
+                 ))}
@@ -793,1 +793,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <button
+ 
@@ -794,1 +794,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     key={car.carrierId}
+               {targetSelectField === 'CARRIER' &&
@@ -795,1 +795,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     onClick={() => {
+                 pipelineContext.knownEntities?.carriers?.map((car) => (
@@ -796,1 +796,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       handleUserDecision('CARRIER', 'SELECT_ALTERNATE', car.carrierId, car.name);
+                   <button
@@ -797,1 +797,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     }}
+                     key={car.carrierId}
@@ -798,1 +798,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     className="w-full p-3 text-right rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between text-xs"
+                     onClick={() => {
@@ -799,1 +799,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   >
+                       handleUserDecision('CARRIER', 'SELECT_ALTERNATE', car.carrierId, car.name);
@@ -800,1 +800,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div>
+                     }}
@@ -801,1 +801,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-slate-800 text-sm">{car.name}</div>
+                     className="w-full p-3 text-right rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between text-xs"
@@ -802,1 +802,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-500 text-[11px]">معرف: {car.carrierId}</div>
+                   >
@@ -803,1 +803,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                     <div>
@@ -804,1 +804,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <span className="text-indigo-600 font-semibold">اختيار</span>
+                       <div className="font-bold text-slate-800 text-sm">{car.name}</div>
@@ -805,1 +805,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </button>
+                       <div className="text-slate-500 text-[11px]">معرف: {car.carrierId}</div>
@@ -806,1 +806,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 ))}
+                     </div>
@@ -807,1 +807,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                     <span className="text-indigo-600 font-semibold">اختيار</span>
@@ -808,1 +808,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               {targetSelectField === 'MATERIAL' &&
+                   </button>
@@ -809,1 +809,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 pipelineContext.knownEntities?.materials?.map((mat) => (
+                 ))}
@@ -810,1 +810,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   <button
+ 
@@ -811,1 +811,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     key={mat.materialId}
+               {targetSelectField === 'MATERIAL' &&
@@ -812,1 +812,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     onClick={() => {
+                 pipelineContext.knownEntities?.materials?.map((mat) => (
@@ -813,1 +813,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       handleUserDecision('MATERIAL', 'SELECT_ALTERNATE', mat.materialId, mat.name);
+                   <button
@@ -814,1 +814,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     }}
+                     key={mat.materialId}
@@ -815,1 +815,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     className="w-full p-3 text-right rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between text-xs"
+                     onClick={() => {
@@ -816,1 +816,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   >
+                       handleUserDecision('MATERIAL', 'SELECT_ALTERNATE', mat.materialId, mat.name);
@@ -817,1 +817,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <div>
+                     }}
@@ -818,1 +818,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="font-bold text-slate-800 text-sm">{mat.name}</div>
+                     className="w-full p-3 text-right rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-between text-xs"
@@ -819,1 +819,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                       <div className="text-slate-500 text-[11px]">الرمز: {mat.code || mat.materialId}</div>
+                   >
@@ -820,1 +820,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     </div>
+                     <div>
@@ -821,1 +821,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                     <span className="text-indigo-600 font-semibold">اختيار</span>
+                       <div className="font-bold text-slate-800 text-sm">{mat.name}</div>
@@ -822,1 +822,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                   </button>
+                       <div className="text-slate-500 text-[11px]">الرمز: {mat.code || mat.materialId}</div>
@@ -823,1 +823,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 ))}
+                     </div>
@@ -824,1 +824,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+                     <span className="text-indigo-600 font-semibold">اختيار</span>
@@ -825,1 +825,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+                   </button>
@@ -826,1 +826,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             <div className="pt-3 border-t border-slate-100 flex justify-end">
+                 ))}
@@ -827,1 +827,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               <button
+             </div>
@@ -828,1 +828,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 onClick={() => setCustomSelectModalOpen(false)}
+ 
@@ -829,1 +829,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
+             <div className="pt-3 border-t border-slate-100 flex justify-end">
@@ -830,1 +830,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               >
+               <button
@@ -831,1 +831,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-                 إلغاء
+                 onClick={() => setCustomSelectModalOpen(false)}
@@ -832,1 +832,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-               </button>
+                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
@@ -833,1 +833,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-             </div>
+               >
@@ -834,1 +834,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-           </div>
+                 {t("shared.actions.cancel")}</button>
@@ -835,1 +835,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-         </div>
+             </div>
@@ -836,1 +836,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-       )}
+           </div>
@@ -837,1 +837,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-     </div>
+         </div>
@@ -838,1 +838,1 @@ src/components/importCenter/EntityResolutionSection.tsx
-   );
+       )}
@@ -839,1 +839,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- }
+     </div>
@@ -840,1 +840,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+   );
@@ -841,1 +841,1 @@ src/components/importCenter/EntityResolutionSection.tsx
- 
+ }
```

## File: `src/components/importCenter/ImportCenterView.tsx`

- **Pre-Migration Hash:** `dd81f45f9fe8557d`
- **Post-Migration Hash:** `23abc5b551274f1d`
- **Transformations Applied:** 3
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted:** `shared.actions.cancel`

### Unified Diff / Patch

```diff
@@ -51,1 +51,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -52,1 +52,1 @@ src/components/importCenter/ImportCenterView.tsx
- export function ImportCenterView() {
+ 
@@ -53,1 +53,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Navigation between Entity Resolution, Weighbridge, Google Sheets, Google Drive, Excel/CSV, Unified Architecture, and Active Batch
+ 
@@ -54,1 +54,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [centerSubTab, setCenterSubTab] = useState<'ENTITY_RESOLUTION' | 'WEIGHBRIDGE_IMPORT' | 'GOOGLE_SHEETS_IMPORT' | 'GOOGLE_DRIVE_IMPORT' | 'EXCEL_CSV_IMPORT' | 'UNIFIED_ARCHITECTURE' | 'ACTIVE_BATCH'>('ENTITY_RESOLUTION');
+ export function ImportCenterView() {
@@ -55,1 +55,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+   const { t } = useI18n();
@@ -56,1 +56,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Active batch state
+   // Navigation between Entity Resolution, Weighbridge, Google Sheets, Google Drive, Excel/CSV, Unified Architecture, and Active Batch
@@ -57,1 +57,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [activeBatch, setActiveBatch] = useState<ImportBatch>(createInitialSampleBatch);
+   const [centerSubTab, setCenterSubTab] = useState<'ENTITY_RESOLUTION' | 'WEIGHBRIDGE_IMPORT' | 'GOOGLE_SHEETS_IMPORT' | 'GOOGLE_DRIVE_IMPORT' | 'EXCEL_CSV_IMPORT' | 'UNIFIED_ARCHITECTURE' | 'ACTIVE_BATCH'>('ENTITY_RESOLUTION');
@@ -58,1 +58,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [batchHistory, setBatchHistory] = useState<ImportBatch[]>([createInitialSampleBatch()]);
+ 
@@ -59,1 +59,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+   // Active batch state
@@ -60,1 +60,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // UI Filter states
+   const [activeBatch, setActiveBatch] = useState<ImportBatch>(createInitialSampleBatch);
@@ -61,1 +61,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | IssueSeverity>('ALL');
+   const [batchHistory, setBatchHistory] = useState<ImportBatch[]>([createInitialSampleBatch()]);
@@ -62,1 +62,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [searchQuery, setSearchQuery] = useState<string>('');
+ 
@@ -63,1 +63,1 @@ src/components/importCenter/ImportCenterView.tsx
-   
+   // UI Filter states
@@ -64,1 +64,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Modals & Drawers
+   const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | IssueSeverity>('ALL');
@@ -65,1 +65,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
+   const [searchQuery, setSearchQuery] = useState<string>('');
@@ -66,1 +66,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [showRawSnapshotModal, setShowRawSnapshotModal] = useState<boolean>(false);
+   
@@ -67,1 +67,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [showAuditTrailModal, setShowAuditTrailModal] = useState<boolean>(false);
+   // Modals & Drawers
@@ -68,1 +68,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [showWarningConfirmModal, setShowWarningConfirmModal] = useState<boolean>(false);
+   const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
@@ -69,1 +69,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [warningConfirmNotes, setWarningConfirmNotes] = useState<string>('');
+   const [showRawSnapshotModal, setShowRawSnapshotModal] = useState<boolean>(false);
@@ -70,1 +70,1 @@ src/components/importCenter/ImportCenterView.tsx
-   
+   const [showAuditTrailModal, setShowAuditTrailModal] = useState<boolean>(false);
@@ -71,1 +71,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Inline Master Record Selector Modal
+   const [showWarningConfirmModal, setShowWarningConfirmModal] = useState<boolean>(false);
@@ -72,1 +72,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [selectingMasterItem, setSelectingMasterItem] = useState<ReviewTableRow | null>(null);
+   const [warningConfirmNotes, setWarningConfirmNotes] = useState<string>('');
@@ -74,1 +74,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Inline Manual Edit Modal
+   // Inline Master Record Selector Modal
@@ -75,1 +75,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [editingItem, setEditingItem] = useState<ReviewTableRow | null>(null);
+   const [selectingMasterItem, setSelectingMasterItem] = useState<ReviewTableRow | null>(null);
@@ -76,1 +76,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [manualInputValue, setManualInputValue] = useState<string>('');
+   
@@ -77,1 +77,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+   // Inline Manual Edit Modal
@@ -78,1 +78,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Upload Form State
+   const [editingItem, setEditingItem] = useState<ReviewTableRow | null>(null);
@@ -79,1 +79,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [uploadedFileName, setUploadedFileName] = useState<string>('بيانات_توريد_جديدة.csv');
+   const [manualInputValue, setManualInputValue] = useState<string>('');
@@ -80,1 +80,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [rawUploadText, setRawUploadText] = useState<string>(SAMPLE_RAW_CSV_TEXT);
+ 
@@ -81,1 +81,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
+   // Upload Form State
@@ -82,1 +82,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+   const [uploadedFileName, setUploadedFileName] = useState<string>('بيانات_توريد_جديدة.csv');
@@ -83,1 +83,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // User identity context
+   const [rawUploadText, setRawUploadText] = useState<string>(SAMPLE_RAW_CSV_TEXT);
@@ -84,1 +84,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const currentUserName = 'م. عبدالرحمن السبيعي (مدير حركة النقل)';
+   const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
@@ -85,1 +85,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const currentUserId = 'USR-NEOM-881';
+ 
@@ -86,1 +86,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+   // User identity context
@@ -87,1 +87,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // 12 Pipeline Stages definition for Stepper
+   const currentUserName = 'م. عبدالرحمن السبيعي (مدير حركة النقل)';
@@ -88,1 +88,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const pipelineStages: { stage: ImportStage; number: number; nameAr: string; desc: string }[] = [
+   const currentUserId = 'USR-NEOM-881';
@@ -89,1 +89,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'UPLOAD', number: 1, nameAr: 'رفع الملف', desc: 'Upload' },
+ 
@@ -90,1 +90,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'PARSE', number: 2, nameAr: 'تفكيك البيانات', desc: 'Parse' },
+   // 12 Pipeline Stages definition for Stepper
@@ -91,1 +91,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'DETECT_COLUMNS', number: 3, nameAr: 'كشف الأعمدة', desc: 'Detect Columns' },
+   const pipelineStages: { stage: ImportStage; number: number; nameAr: string; desc: string }[] = [
@@ -92,1 +92,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'NORMALIZE', number: 4, nameAr: 'المعايرة القياسية', desc: 'Normalize' },
+     { stage: 'UPLOAD', number: 1, nameAr: 'رفع الملف', desc: 'Upload' },
@@ -93,1 +93,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'MATCH_ENTITIES', number: 5, nameAr: 'مطابقة الكيانات', desc: 'Match Entities' },
+     { stage: 'PARSE', number: 2, nameAr: 'تفكيك البيانات', desc: 'Parse' },
@@ -94,1 +94,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'VALIDATE_RELATIONSHIPS', number: 6, nameAr: 'تحقق العلاقات', desc: 'Validate Relations' },
+     { stage: 'DETECT_COLUMNS', number: 3, nameAr: 'كشف الأعمدة', desc: 'Detect Columns' },
@@ -95,1 +95,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'DETECT_DUPLICATES', number: 7, nameAr: 'كشف التكرار', desc: 'Detect Duplicates' },
+     { stage: 'NORMALIZE', number: 4, nameAr: 'المعايرة القياسية', desc: 'Normalize' },
@@ -96,1 +96,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'GENERATE_REPORT', number: 8, nameAr: 'تقرير المراجعة', desc: 'Generate Report' },
+     { stage: 'MATCH_ENTITIES', number: 5, nameAr: 'مطابقة الكيانات', desc: 'Match Entities' },
@@ -97,1 +97,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'HUMAN_CORRECTION', number: 9, nameAr: 'التصحيح البشري', desc: 'Human Correction' },
+     { stage: 'VALIDATE_RELATIONSHIPS', number: 6, nameAr: 'تحقق العلاقات', desc: 'Validate Relations' },
@@ -98,1 +98,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'FINAL_VALIDATION', number: 10, nameAr: 'التحقق النهائي', desc: 'Final Validation' },
+     { stage: 'DETECT_DUPLICATES', number: 7, nameAr: 'كشف التكرار', desc: 'Detect Duplicates' },
@@ -99,1 +99,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'COMMIT', number: 11, nameAr: 'الاعتماد النهائي', desc: 'Commit' },
+     { stage: 'GENERATE_REPORT', number: 8, nameAr: 'تقرير المراجعة', desc: 'Generate Report' },
@@ -100,1 +100,1 @@ src/components/importCenter/ImportCenterView.tsx
-     { stage: 'AUDIT', number: 12, nameAr: 'التدقيق الرقابي', desc: 'Audit' },
+     { stage: 'HUMAN_CORRECTION', number: 9, nameAr: 'التصحيح البشري', desc: 'Human Correction' },
@@ -101,1 +101,1 @@ src/components/importCenter/ImportCenterView.tsx
-   ];
+     { stage: 'FINAL_VALIDATION', number: 10, nameAr: 'التحقق النهائي', desc: 'Final Validation' },
@@ -102,1 +102,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+     { stage: 'COMMIT', number: 11, nameAr: 'الاعتماد النهائي', desc: 'Commit' },
@@ -103,1 +103,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Filtered review items
+     { stage: 'AUDIT', number: 12, nameAr: 'التدقيق الرقابي', desc: 'Audit' },
@@ -104,1 +104,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const filteredReviewItems = useMemo(() => {
+   ];
@@ -105,1 +105,1 @@ src/components/importCenter/ImportCenterView.tsx
-     return activeBatch.reviewItems.filter((item) => {
+ 
@@ -106,1 +106,1 @@ src/components/importCenter/ImportCenterView.tsx
-       // Severity filter
+   // Filtered review items
@@ -107,1 +107,1 @@ src/components/importCenter/ImportCenterView.tsx
-       if (selectedSeverityFilter !== 'ALL' && item.severity !== selectedSeverityFilter) {
+   const filteredReviewItems = useMemo(() => {
@@ -108,1 +108,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return false;
+     return activeBatch.reviewItems.filter((item) => {
@@ -109,1 +109,1 @@ src/components/importCenter/ImportCenterView.tsx
-       }
+       // Severity filter
@@ -110,1 +110,1 @@ src/components/importCenter/ImportCenterView.tsx
-       // Search filter
+       if (selectedSeverityFilter !== 'ALL' && item.severity !== selectedSeverityFilter) {
@@ -111,1 +111,1 @@ src/components/importCenter/ImportCenterView.tsx
-       if (searchQuery.trim()) {
+         return false;
@@ -112,1 +112,1 @@ src/components/importCenter/ImportCenterView.tsx
-         const q = searchQuery.toLowerCase();
+       }
@@ -113,1 +113,1 @@ src/components/importCenter/ImportCenterView.tsx
-         const matchesField = item.field.toLowerCase().includes(q);
+       // Search filter
@@ -114,1 +114,1 @@ src/components/importCenter/ImportCenterView.tsx
-         const matchesOrig = item.originalValue.toLowerCase().includes(q);
+       if (searchQuery.trim()) {
@@ -115,1 +115,1 @@ src/components/importCenter/ImportCenterView.tsx
-         const matchesSugg = item.suggestedValue.toLowerCase().includes(q);
+         const q = searchQuery.toLowerCase();
@@ -116,1 +116,1 @@ src/components/importCenter/ImportCenterView.tsx
-         const matchesIssue = item.issue.toLowerCase().includes(q);
+         const matchesField = item.field.toLowerCase().includes(q);
@@ -117,1 +117,1 @@ src/components/importCenter/ImportCenterView.tsx
-         const matchesRow = String(item.rowNumber).includes(q);
+         const matchesOrig = item.originalValue.toLowerCase().includes(q);
@@ -118,1 +118,1 @@ src/components/importCenter/ImportCenterView.tsx
-         if (!matchesField && !matchesOrig && !matchesSugg && !matchesIssue && !matchesRow) {
+         const matchesSugg = item.suggestedValue.toLowerCase().includes(q);
@@ -119,1 +119,1 @@ src/components/importCenter/ImportCenterView.tsx
-           return false;
+         const matchesIssue = item.issue.toLowerCase().includes(q);
@@ -120,1 +120,1 @@ src/components/importCenter/ImportCenterView.tsx
-         }
+         const matchesRow = String(item.rowNumber).includes(q);
@@ -121,1 +121,1 @@ src/components/importCenter/ImportCenterView.tsx
-       }
+         if (!matchesField && !matchesOrig && !matchesSugg && !matchesIssue && !matchesRow) {
@@ -122,1 +122,1 @@ src/components/importCenter/ImportCenterView.tsx
-       return true;
+           return false;
@@ -123,1 +123,1 @@ src/components/importCenter/ImportCenterView.tsx
-     });
+         }
@@ -124,1 +124,1 @@ src/components/importCenter/ImportCenterView.tsx
-   }, [activeBatch.reviewItems, selectedSeverityFilter, searchQuery]);
+       }
@@ -125,1 +125,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       return true;
@@ -126,1 +126,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Handle uploading and parsing a new file
+     });
@@ -127,1 +127,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const handleStartImport = () => {
+   }, [activeBatch.reviewItems, selectedSeverityFilter, searchQuery]);
@@ -128,1 +128,1 @@ src/components/importCenter/ImportCenterView.tsx
-     setIsAnalyzing(true);
+ 
@@ -129,1 +129,1 @@ src/components/importCenter/ImportCenterView.tsx
-     setTimeout(() => {
+   // Handle uploading and parsing a new file
@@ -130,1 +130,1 @@ src/components/importCenter/ImportCenterView.tsx
-       const { headers, rows } = ImportCenterService.parseRawText(rawUploadText);
+   const handleStartImport = () => {
@@ -131,1 +131,1 @@ src/components/importCenter/ImportCenterView.tsx
-       const newBatch = ImportCenterService.processImportBatch({
+     setIsAnalyzing(true);
@@ -132,1 +132,1 @@ src/components/importCenter/ImportCenterView.tsx
-         importBatchId: `BATCH-NEOM-${Date.now().toString().slice(-6)}`,
+     setTimeout(() => {
@@ -133,1 +133,1 @@ src/components/importCenter/ImportCenterView.tsx
-         projectId: 'PRJ-NEOM-001',
+       const { headers, rows } = ImportCenterService.parseRawText(rawUploadText);
@@ -134,1 +134,1 @@ src/components/importCenter/ImportCenterView.tsx
-         fileName: uploadedFileName,
+       const newBatch = ImportCenterService.processImportBatch({
@@ -135,1 +135,1 @@ src/components/importCenter/ImportCenterView.tsx
-         uploadedBy: currentUserName,
+         importBatchId: `BATCH-NEOM-${Date.now().toString().slice(-6)}`,
@@ -136,1 +136,1 @@ src/components/importCenter/ImportCenterView.tsx
-         rawRows: rows,
+         projectId: 'PRJ-NEOM-001',
@@ -137,1 +137,1 @@ src/components/importCenter/ImportCenterView.tsx
-         headers,
+         fileName: uploadedFileName,
@@ -138,1 +138,1 @@ src/components/importCenter/ImportCenterView.tsx
-         context: SAMPLE_QUALITY_CONTEXT,
+         uploadedBy: currentUserName,
@@ -139,1 +139,1 @@ src/components/importCenter/ImportCenterView.tsx
-       });
+         rawRows: rows,
@@ -140,1 +140,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         headers,
@@ -141,1 +141,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setActiveBatch(newBatch);
+         context: SAMPLE_QUALITY_CONTEXT,
@@ -142,1 +142,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setBatchHistory((prev) => [newBatch, ...prev]);
+       });
@@ -143,1 +143,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setShowUploadModal(false);
+ 
@@ -144,1 +144,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setIsAnalyzing(false);
+       setActiveBatch(newBatch);
@@ -145,1 +145,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }, 400);
+       setBatchHistory((prev) => [newBatch, ...prev]);
@@ -146,1 +146,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+       setShowUploadModal(false);
@@ -147,1 +147,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       setIsAnalyzing(false);
@@ -148,1 +148,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Action Handlers
+     }, 400);
@@ -149,1 +149,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const handleApplyAction = (
+   };
@@ -150,1 +150,1 @@ src/components/importCenter/ImportCenterView.tsx
-     itemId: string,
+ 
@@ -151,1 +151,1 @@ src/components/importCenter/ImportCenterView.tsx
-     action: ReviewActionType,
+   // Action Handlers
@@ -152,1 +152,1 @@ src/components/importCenter/ImportCenterView.tsx
-     payload: {
+   const handleApplyAction = (
@@ -153,1 +153,1 @@ src/components/importCenter/ImportCenterView.tsx
-       chosenMasterId?: string;
+     itemId: string,
@@ -154,1 +154,1 @@ src/components/importCenter/ImportCenterView.tsx
-       chosenMasterValue?: string;
+     action: ReviewActionType,
@@ -155,1 +155,1 @@ src/components/importCenter/ImportCenterView.tsx
-       manualValue?: string;
+     payload: {
@@ -156,1 +156,1 @@ src/components/importCenter/ImportCenterView.tsx
-       notes?: string;
+       chosenMasterId?: string;
@@ -157,1 +157,1 @@ src/components/importCenter/ImportCenterView.tsx
-     } = {}
+       chosenMasterValue?: string;
@@ -158,1 +158,1 @@ src/components/importCenter/ImportCenterView.tsx
-   ) => {
+       manualValue?: string;
@@ -159,1 +159,1 @@ src/components/importCenter/ImportCenterView.tsx
-     const updated = ImportCenterService.applyItemAction(activeBatch, itemId, action, {
+       notes?: string;
@@ -160,1 +160,1 @@ src/components/importCenter/ImportCenterView.tsx
-       userId: currentUserId,
+     } = {}
@@ -161,1 +161,1 @@ src/components/importCenter/ImportCenterView.tsx
-       userName: currentUserName,
+   ) => {
@@ -162,1 +162,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ...payload,
+     const updated = ImportCenterService.applyItemAction(activeBatch, itemId, action, {
@@ -163,1 +163,1 @@ src/components/importCenter/ImportCenterView.tsx
-     });
+       userId: currentUserId,
@@ -164,1 +164,1 @@ src/components/importCenter/ImportCenterView.tsx
-     setActiveBatch(updated);
+       userName: currentUserName,
@@ -165,1 +165,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+       ...payload,
@@ -166,1 +166,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+     });
@@ -167,1 +167,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Bulk Accept High-Confidence Suggestions
+     setActiveBatch(updated);
@@ -168,1 +168,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const handleBulkAccept = () => {
+   };
@@ -169,1 +169,1 @@ src/components/importCenter/ImportCenterView.tsx
-     const updated = ImportCenterService.bulkAcceptSuggestions(activeBatch, currentUserName);
+ 
@@ -170,1 +170,1 @@ src/components/importCenter/ImportCenterView.tsx
-     setActiveBatch(updated);
+   // Bulk Accept High-Confidence Suggestions
@@ -171,1 +171,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+   const handleBulkAccept = () => {
@@ -172,1 +172,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+     const updated = ImportCenterService.bulkAcceptSuggestions(activeBatch, currentUserName);
@@ -173,1 +173,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Reject all rows that have CRITICAL errors
+     setActiveBatch(updated);
@@ -174,1 +174,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const handleRejectAllCriticalRows = () => {
+   };
@@ -175,1 +175,1 @@ src/components/importCenter/ImportCenterView.tsx
-     const criticalRowNumbers = new Set(
+ 
@@ -176,1 +176,1 @@ src/components/importCenter/ImportCenterView.tsx
-       activeBatch.reviewItems
+   // Reject all rows that have CRITICAL errors
@@ -177,1 +177,1 @@ src/components/importCenter/ImportCenterView.tsx
-         .filter((i) => i.severity === 'CRITICAL' && i.rowStatus === 'ACTIVE')
+   const handleRejectAllCriticalRows = () => {
@@ -178,1 +178,1 @@ src/components/importCenter/ImportCenterView.tsx
-         .map((i) => i.rowNumber)
+     const criticalRowNumbers = new Set(
@@ -179,1 +179,1 @@ src/components/importCenter/ImportCenterView.tsx
-     );
+       activeBatch.reviewItems
@@ -180,1 +180,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         .filter((i) => i.severity === 'CRITICAL' && i.rowStatus === 'ACTIVE')
@@ -181,1 +181,1 @@ src/components/importCenter/ImportCenterView.tsx
-     let updated = activeBatch;
+         .map((i) => i.rowNumber)
@@ -182,1 +182,1 @@ src/components/importCenter/ImportCenterView.tsx
-     activeBatch.reviewItems.forEach((item) => {
+     );
@@ -183,1 +183,1 @@ src/components/importCenter/ImportCenterView.tsx
-       if (criticalRowNumbers.has(item.rowNumber)) {
+ 
@@ -184,1 +184,1 @@ src/components/importCenter/ImportCenterView.tsx
-         updated = ImportCenterService.applyItemAction(updated, item.id, 'REJECT_ROW', {
+     let updated = activeBatch;
@@ -185,1 +185,1 @@ src/components/importCenter/ImportCenterView.tsx
-           userId: currentUserId,
+     activeBatch.reviewItems.forEach((item) => {
@@ -186,1 +186,1 @@ src/components/importCenter/ImportCenterView.tsx
-           userName: currentUserName,
+       if (criticalRowNumbers.has(item.rowNumber)) {
@@ -187,1 +187,1 @@ src/components/importCenter/ImportCenterView.tsx
-           notes: 'استبعاد جماعي للصفوف ذات الأخطاء الحرجة',
+         updated = ImportCenterService.applyItemAction(updated, item.id, 'REJECT_ROW', {
@@ -188,1 +188,1 @@ src/components/importCenter/ImportCenterView.tsx
-         });
+           userId: currentUserId,
@@ -189,1 +189,1 @@ src/components/importCenter/ImportCenterView.tsx
-       }
+           userName: currentUserName,
@@ -190,1 +190,1 @@ src/components/importCenter/ImportCenterView.tsx
-     });
+           notes: 'استبعاد جماعي للصفوف ذات الأخطاء الحرجة',
@@ -191,1 +191,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         });
@@ -192,1 +192,1 @@ src/components/importCenter/ImportCenterView.tsx
-     setActiveBatch(updated);
+       }
@@ -193,1 +193,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+     });
@@ -195,1 +195,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Commit Batch handler
+     setActiveBatch(updated);
@@ -196,1 +196,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const handleCommitBatch = (confirmWarnings: boolean = false) => {
+   };
@@ -197,1 +197,1 @@ src/components/importCenter/ImportCenterView.tsx
-     if (activeBatch.errorCount > 0) {
+ 
@@ -198,1 +198,1 @@ src/components/importCenter/ImportCenterView.tsx
-       alert(`لا يمكن الاعتماد: يوجد (${activeBatch.errorCount}) أخطاء حرجة (CRITICAL). يجب تصحيحها أو استبعاد الصفوف أولاً.`);
+   // Commit Batch handler
@@ -199,1 +199,1 @@ src/components/importCenter/ImportCenterView.tsx
-       return;
+   const handleCommitBatch = (confirmWarnings: boolean = false) => {
@@ -200,1 +200,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }
+     if (activeBatch.errorCount > 0) {
@@ -201,1 +201,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       alert(`لا يمكن الاعتماد: يوجد (${activeBatch.errorCount}) أخطاء حرجة (CRITICAL). يجب تصحيحها أو استبعاد الصفوف أولاً.`);
@@ -202,1 +202,1 @@ src/components/importCenter/ImportCenterView.tsx
-     if (activeBatch.warningCount > 0 && !confirmWarnings) {
+       return;
@@ -203,1 +203,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setShowWarningConfirmModal(true);
+     }
@@ -204,1 +204,1 @@ src/components/importCenter/ImportCenterView.tsx
-       return;
+ 
@@ -205,1 +205,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }
+     if (activeBatch.warningCount > 0 && !confirmWarnings) {
@@ -206,1 +206,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       setShowWarningConfirmModal(true);
@@ -207,1 +207,1 @@ src/components/importCenter/ImportCenterView.tsx
-     const result = ImportCenterService.commitBatch(activeBatch, {
+       return;
@@ -208,1 +208,1 @@ src/components/importCenter/ImportCenterView.tsx
-       userId: currentUserId,
+     }
@@ -209,1 +209,1 @@ src/components/importCenter/ImportCenterView.tsx
-       userName: currentUserName,
+ 
@@ -210,1 +210,1 @@ src/components/importCenter/ImportCenterView.tsx
-       confirmWarnings,
+     const result = ImportCenterService.commitBatch(activeBatch, {
@@ -211,1 +211,1 @@ src/components/importCenter/ImportCenterView.tsx
-       warningConfirmationNotes: warningConfirmNotes,
+       userId: currentUserId,
@@ -212,1 +212,1 @@ src/components/importCenter/ImportCenterView.tsx
-     });
+       userName: currentUserName,
@@ -213,1 +213,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       confirmWarnings,
@@ -214,1 +214,1 @@ src/components/importCenter/ImportCenterView.tsx
-     if (result.success) {
+       warningConfirmationNotes: warningConfirmNotes,
@@ -215,1 +215,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setActiveBatch(result.updatedBatch);
+     });
@@ -216,1 +216,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setShowWarningConfirmModal(false);
+ 
@@ -217,1 +217,1 @@ src/components/importCenter/ImportCenterView.tsx
-       // Update in history
+     if (result.success) {
@@ -218,1 +218,1 @@ src/components/importCenter/ImportCenterView.tsx
-       setBatchHistory((prev) =>
+       setActiveBatch(result.updatedBatch);
@@ -219,1 +219,1 @@ src/components/importCenter/ImportCenterView.tsx
-         prev.map((b) => (b.importBatchId === result.updatedBatch.importBatchId ? result.updatedBatch : b))
+       setShowWarningConfirmModal(false);
@@ -220,1 +220,1 @@ src/components/importCenter/ImportCenterView.tsx
-       );
+       // Update in history
@@ -221,1 +221,1 @@ src/components/importCenter/ImportCenterView.tsx
-     } else {
+       setBatchHistory((prev) =>
@@ -222,1 +222,1 @@ src/components/importCenter/ImportCenterView.tsx
-       alert(result.error);
+         prev.map((b) => (b.importBatchId === result.updatedBatch.importBatchId ? result.updatedBatch : b))
@@ -223,1 +223,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }
+       );
@@ -224,1 +224,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+     } else {
@@ -225,1 +225,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       alert(result.error);
@@ -226,1 +226,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Helper for action badge/label
+     }
@@ -227,1 +227,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const getActionBadge = (action: ReviewActionType, rowStatus: 'ACTIVE' | 'REJECTED') => {
+   };
@@ -228,1 +228,1 @@ src/components/importCenter/ImportCenterView.tsx
-     if (rowStatus === 'REJECTED') {
+ 
@@ -229,1 +229,1 @@ src/components/importCenter/ImportCenterView.tsx
-       return (
+   // Helper for action badge/label
@@ -230,1 +230,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-200 text-stone-700">
+   const getActionBadge = (action: ReviewActionType, rowStatus: 'ACTIVE' | 'REJECTED') => {
@@ -231,1 +231,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <X className="w-3 h-3" /> تم رفض الصف (Reject Row)
+     if (rowStatus === 'REJECTED') {
@@ -232,1 +232,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </span>
+       return (
@@ -233,1 +233,1 @@ src/components/importCenter/ImportCenterView.tsx
-       );
+         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-200 text-stone-700">
@@ -234,1 +234,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }
+           <X className="w-3 h-3" /> تم رفض الصف (Reject Row)
@@ -235,1 +235,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         </span>
@@ -236,1 +236,1 @@ src/components/importCenter/ImportCenterView.tsx
-     switch (action) {
+       );
@@ -237,1 +237,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'ACCEPT_SUGGESTION':
+     }
@@ -238,1 +238,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+ 
@@ -239,1 +239,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
+     switch (action) {
@@ -240,1 +240,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <Check className="w-3 h-3" /> تم قبول الاقتراح (Accept)
+       case 'ACCEPT_SUGGESTION':
@@ -241,1 +241,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+         return (
@@ -242,1 +242,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
@@ -243,1 +243,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'KEEP_ORIGINAL':
+             <Check className="w-3 h-3" /> تم قبول الاقتراح (Accept)
@@ -244,1 +244,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -245,1 +245,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
+         );
@@ -246,1 +246,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <CheckCircle2 className="w-3 h-3" /> الإبقاء على الأصل (Keep Original)
+       case 'KEEP_ORIGINAL':
@@ -247,1 +247,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+         return (
@@ -248,1 +248,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
@@ -249,1 +249,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'CHOOSE_MASTER_RECORD':
+             <CheckCircle2 className="w-3 h-3" /> الإبقاء على الأصل (Keep Original)
@@ -250,1 +250,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -251,1 +251,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">
+         );
@@ -252,1 +252,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <Database className="w-3 h-3" /> اختيار سجل معتمد (Master)
+       case 'CHOOSE_MASTER_RECORD':
@@ -253,1 +253,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+         return (
@@ -254,1 +254,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">
@@ -255,1 +255,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'EDIT_MANUALLY':
+             <Database className="w-3 h-3" /> اختيار سجل معتمد (Master)
@@ -256,1 +256,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -257,1 +257,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">
+         );
@@ -258,1 +258,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <Edit3 className="w-3 h-3" /> تعديل يدوي (Manual Edit)
+       case 'EDIT_MANUALLY':
@@ -259,1 +259,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+         return (
@@ -260,1 +260,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">
@@ -261,1 +261,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'IGNORE':
+             <Edit3 className="w-3 h-3" /> تعديل يدوي (Manual Edit)
@@ -262,1 +262,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -263,1 +263,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600">
+         );
@@ -264,1 +264,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <Eye className="w-3 h-3" /> تم التجاهل (Ignored)
+       case 'IGNORE':
@@ -265,1 +265,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+         return (
@@ -266,1 +266,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600">
@@ -267,1 +267,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'REJECT_ROW':
+             <Eye className="w-3 h-3" /> تم التجاهل (Ignored)
@@ -268,1 +268,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -269,1 +269,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
+         );
@@ -270,1 +270,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <X className="w-3 h-3" /> استبعاد الصف (Reject Row)
+       case 'REJECT_ROW':
@@ -271,1 +271,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+         return (
@@ -272,1 +272,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
@@ -273,1 +273,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }
+             <X className="w-3 h-3" /> استبعاد الصف (Reject Row)
@@ -274,1 +274,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+           </span>
@@ -275,1 +275,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         );
@@ -276,1 +276,1 @@ src/components/importCenter/ImportCenterView.tsx
-   // Severity badge helper
+     }
@@ -277,1 +277,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const getSeverityBadge = (severity: IssueSeverity) => {
+   };
@@ -278,1 +278,1 @@ src/components/importCenter/ImportCenterView.tsx
-     switch (severity) {
+ 
@@ -279,1 +279,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'CRITICAL':
+   // Severity badge helper
@@ -280,1 +280,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+   const getSeverityBadge = (severity: IssueSeverity) => {
@@ -281,1 +281,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
+     switch (severity) {
@@ -282,1 +282,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <XCircle className="w-3.5 h-3.5 text-rose-600" />
+       case 'CRITICAL':
@@ -283,1 +283,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <span>CRITICAL</span>
+         return (
@@ -284,1 +284,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
@@ -285,1 +285,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+             <XCircle className="w-3.5 h-3.5 text-rose-600" />
@@ -286,1 +286,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'WARNING':
+             <span>CRITICAL</span>
@@ -287,1 +287,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -288,1 +288,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
+         );
@@ -289,1 +289,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
+       case 'WARNING':
@@ -290,1 +290,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <span>WARNING</span>
+         return (
@@ -291,1 +291,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
@@ -292,1 +292,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+             <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
@@ -293,1 +293,1 @@ src/components/importCenter/ImportCenterView.tsx
-       case 'INFO':
+             <span>WARNING</span>
@@ -294,1 +294,1 @@ src/components/importCenter/ImportCenterView.tsx
-         return (
+           </span>
@@ -295,1 +295,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
+         );
@@ -296,1 +296,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <Info className="w-3.5 h-3.5 text-sky-600" />
+       case 'INFO':
@@ -297,1 +297,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <span>INFO</span>
+         return (
@@ -298,1 +298,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </span>
+           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
@@ -299,1 +299,1 @@ src/components/importCenter/ImportCenterView.tsx
-         );
+             <Info className="w-3.5 h-3.5 text-sky-600" />
@@ -300,1 +300,1 @@ src/components/importCenter/ImportCenterView.tsx
-     }
+             <span>INFO</span>
@@ -301,1 +301,1 @@ src/components/importCenter/ImportCenterView.tsx
-   };
+           </span>
@@ -302,1 +302,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         );
@@ -303,1 +303,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const isCommitted = activeBatch.status === 'COMMITTED';
+     }
@@ -304,1 +304,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const hasCritical = activeBatch.errorCount > 0;
+   };
@@ -305,1 +305,1 @@ src/components/importCenter/ImportCenterView.tsx
-   const hasWarnings = activeBatch.warningCount > 0;
+ 
@@ -306,1 +306,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+   const isCommitted = activeBatch.status === 'COMMITTED';
@@ -307,1 +307,1 @@ src/components/importCenter/ImportCenterView.tsx
-   return (
+   const hasCritical = activeBatch.errorCount > 0;
@@ -308,1 +308,1 @@ src/components/importCenter/ImportCenterView.tsx
-     <div className="space-y-6">
+   const hasWarnings = activeBatch.warningCount > 0;
@@ -309,1 +309,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* Sub-navigation tabs */}
+ 
@@ -310,1 +310,1 @@ src/components/importCenter/ImportCenterView.tsx
-       <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3 flex-wrap">
+   return (
@@ -311,1 +311,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+     <div className="space-y-6">
@@ -312,1 +312,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('ENTITY_RESOLUTION')}
+       {/* Sub-navigation tabs */}
@@ -313,1 +313,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
+       <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3 flex-wrap">
@@ -314,1 +314,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'ENTITY_RESOLUTION'
+         <button
@@ -315,1 +315,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('ENTITY_RESOLUTION')}
@@ -316,1 +316,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
@@ -317,1 +317,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'ENTITY_RESOLUTION'
@@ -318,1 +318,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -319,1 +319,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -320,1 +320,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span>حل الكيانات وجودة البيانات (BLOCK 35 Resolution)</span>
+           }`}
@@ -321,1 +321,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-600 text-white font-black">Entity Resolution</span>
+         >
@@ -322,1 +322,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+           <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
@@ -323,1 +323,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+           <span>حل الكيانات وجودة البيانات (BLOCK 35 Resolution)</span>
@@ -324,1 +324,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('WEIGHBRIDGE_IMPORT')}
+           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-600 text-white font-black">Entity Resolution</span>
@@ -325,1 +325,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
+         </button>
@@ -326,1 +326,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'WEIGHBRIDGE_IMPORT'
+         <button
@@ -327,1 +327,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('WEIGHBRIDGE_IMPORT')}
@@ -328,1 +328,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
@@ -329,1 +329,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'WEIGHBRIDGE_IMPORT'
@@ -330,1 +330,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -331,1 +331,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <Scale className="w-3.5 h-3.5 text-amber-400" />
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -332,1 +332,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span>استيراد الميزان (BLOCK 34 Weighbridge)</span>
+           }`}
@@ -333,1 +333,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-stone-950 font-black">Weighbridge</span>
+         >
@@ -334,1 +334,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+           <Scale className="w-3.5 h-3.5 text-amber-400" />
@@ -335,1 +335,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+           <span>استيراد الميزان (BLOCK 34 Weighbridge)</span>
@@ -336,1 +336,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('GOOGLE_SHEETS_IMPORT')}
+           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-stone-950 font-black">Weighbridge</span>
@@ -337,1 +337,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
+         </button>
@@ -338,1 +338,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'GOOGLE_SHEETS_IMPORT'
+         <button
@@ -339,1 +339,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('GOOGLE_SHEETS_IMPORT')}
@@ -340,1 +340,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
@@ -341,1 +341,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'GOOGLE_SHEETS_IMPORT'
@@ -342,1 +342,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -343,1 +343,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -344,1 +344,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span>استيراد Google Sheets (BLOCK 33)</span>
+           }`}
@@ -345,1 +345,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-600 text-white font-black">Google Sheets</span>
+         >
@@ -346,1 +346,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+           <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
@@ -347,1 +347,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+           <span>استيراد Google Sheets (BLOCK 33)</span>
@@ -348,1 +348,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('GOOGLE_DRIVE_IMPORT')}
+           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-600 text-white font-black">Google Sheets</span>
@@ -349,1 +349,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
+         </button>
@@ -350,1 +350,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'GOOGLE_DRIVE_IMPORT'
+         <button
@@ -351,1 +351,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('GOOGLE_DRIVE_IMPORT')}
@@ -352,1 +352,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
@@ -353,1 +353,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'GOOGLE_DRIVE_IMPORT'
@@ -354,1 +354,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -355,1 +355,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <HardDrive className="w-3.5 h-3.5 text-blue-400" />
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -356,1 +356,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span>استيراد Google Drive (BLOCK 32)</span>
+           }`}
@@ -357,1 +357,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500 text-white font-black">Google Drive</span>
+         >
@@ -358,1 +358,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+           <HardDrive className="w-3.5 h-3.5 text-blue-400" />
@@ -359,1 +359,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+           <span>استيراد Google Drive (BLOCK 32)</span>
@@ -360,1 +360,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('EXCEL_CSV_IMPORT')}
+           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500 text-white font-black">Google Drive</span>
@@ -361,1 +361,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
+         </button>
@@ -362,1 +362,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'EXCEL_CSV_IMPORT'
+         <button
@@ -363,1 +363,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('EXCEL_CSV_IMPORT')}
@@ -364,1 +364,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
@@ -365,1 +365,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'EXCEL_CSV_IMPORT'
@@ -366,1 +366,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -367,1 +367,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <FileSpreadsheet className="w-3.5 h-3.5" />
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -368,1 +368,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span>استيراد ملفات Excel / CSV (BLOCK 31)</span>
+           }`}
@@ -369,1 +369,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-400 text-stone-950 font-black">XLSX / XLS / CSV</span>
+         >
@@ -370,1 +370,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+           <FileSpreadsheet className="w-3.5 h-3.5" />
@@ -371,1 +371,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+           <span>استيراد ملفات Excel / CSV (BLOCK 31)</span>
@@ -372,1 +372,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('UNIFIED_ARCHITECTURE')}
+           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-400 text-stone-950 font-black">XLSX / XLS / CSV</span>
@@ -373,1 +373,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
+         </button>
@@ -374,1 +374,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'UNIFIED_ARCHITECTURE'
+         <button
@@ -375,1 +375,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('UNIFIED_ARCHITECTURE')}
@@ -376,1 +376,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
@@ -377,1 +377,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'UNIFIED_ARCHITECTURE'
@@ -378,1 +378,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -379,1 +379,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span>معمارية الاستيراد الموحد (BLOCK 30 Unified Architecture)</span>
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -380,1 +380,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-400 text-stone-950 font-black">10 Stages</span>
+           }`}
@@ -381,1 +381,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+         >
@@ -382,1 +382,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <button
+           <span>معمارية الاستيراد الموحد (BLOCK 30 Unified Architecture)</span>
@@ -383,1 +383,1 @@ src/components/importCenter/ImportCenterView.tsx
-           onClick={() => setCenterSubTab('ACTIVE_BATCH')}
+           <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-400 text-stone-950 font-black">10 Stages</span>
@@ -384,1 +384,1 @@ src/components/importCenter/ImportCenterView.tsx
-           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
+         </button>
@@ -385,1 +385,1 @@ src/components/importCenter/ImportCenterView.tsx
-             centerSubTab === 'ACTIVE_BATCH'
+         <button
@@ -386,1 +386,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ? 'bg-stone-900 text-white shadow-xs'
+           onClick={() => setCenterSubTab('ACTIVE_BATCH')}
@@ -387,1 +387,1 @@ src/components/importCenter/ImportCenterView.tsx
-               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
+           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
@@ -388,1 +388,1 @@ src/components/importCenter/ImportCenterView.tsx
-           }`}
+             centerSubTab === 'ACTIVE_BATCH'
@@ -389,1 +389,1 @@ src/components/importCenter/ImportCenterView.tsx
-         >
+               ? 'bg-stone-900 text-white shadow-xs'
@@ -390,1 +390,1 @@ src/components/importCenter/ImportCenterView.tsx
-           استعراض ومراجعة الدفعة النشطة (Active Batch Review)
+               : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
@@ -391,1 +391,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </button>
+           }`}
@@ -392,1 +392,1 @@ src/components/importCenter/ImportCenterView.tsx
-       </div>
+         >
@@ -393,1 +393,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+           استعراض ومراجعة الدفعة النشطة (Active Batch Review)
@@ -394,1 +394,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {centerSubTab === 'ENTITY_RESOLUTION' ? (
+         </button>
@@ -395,1 +395,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <EntityResolutionSection />
+       </div>
@@ -396,1 +396,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : centerSubTab === 'WEIGHBRIDGE_IMPORT' ? (
+ 
@@ -397,1 +397,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <WeighbridgeImportSection projectId="PRJ-NEOM-NORTH-01" />
+       {centerSubTab === 'ENTITY_RESOLUTION' ? (
@@ -398,1 +398,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : centerSubTab === 'GOOGLE_SHEETS_IMPORT' ? (
+         <EntityResolutionSection />
@@ -399,1 +399,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <GoogleSheetsImportSection projectId="PRJ-NEOM-NORTH-01" />
+       ) : centerSubTab === 'WEIGHBRIDGE_IMPORT' ? (
@@ -400,1 +400,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : centerSubTab === 'GOOGLE_DRIVE_IMPORT' ? (
+         <WeighbridgeImportSection projectId="PRJ-NEOM-NORTH-01" />
@@ -401,1 +401,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <GoogleDriveImportSection />
+       ) : centerSubTab === 'GOOGLE_SHEETS_IMPORT' ? (
@@ -402,1 +402,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : centerSubTab === 'EXCEL_CSV_IMPORT' ? (
+         <GoogleSheetsImportSection projectId="PRJ-NEOM-NORTH-01" />
@@ -403,1 +403,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <ExcelCsvImportSection />
+       ) : centerSubTab === 'GOOGLE_DRIVE_IMPORT' ? (
@@ -404,1 +404,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : centerSubTab === 'UNIFIED_ARCHITECTURE' ? (
+         <GoogleDriveImportSection />
@@ -405,1 +405,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <UnifiedImportArchitectureSection />
+       ) : centerSubTab === 'EXCEL_CSV_IMPORT' ? (
@@ -406,1 +406,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : (
+         <ExcelCsvImportSection />
@@ -407,1 +407,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <>
+       ) : centerSubTab === 'UNIFIED_ARCHITECTURE' ? (
@@ -408,1 +408,1 @@ src/components/importCenter/ImportCenterView.tsx
-           {/* 1. TOP HEADER & CONTROLS */}
+         <UnifiedImportArchitectureSection />
@@ -409,1 +409,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
+       ) : (
@@ -410,1 +410,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
+         <>
@@ -411,1 +411,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="flex items-start sm:items-center gap-3.5">
+           {/* 1. TOP HEADER & CONTROLS */}
@@ -412,1 +412,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
+           <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
@@ -413,1 +413,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <FileSpreadsheet className="w-6 h-6" />
+         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
@@ -414,1 +414,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+           <div className="flex items-start sm:items-center gap-3.5">
@@ -415,1 +415,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div>
+             <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
@@ -416,1 +416,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2 flex-wrap">
+               <FileSpreadsheet className="w-6 h-6" />
@@ -417,1 +417,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <h2 className="text-xl font-black tracking-tight text-stone-900">
+             </div>
@@ -418,1 +418,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   مركز الاستيراد المتقدم (Import Center)
+             <div>
@@ -419,1 +419,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </h2>
+               <div className="flex items-center gap-2 flex-wrap">
@@ -420,1 +420,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
+                 <h2 className="text-xl font-black tracking-tight text-stone-900">
@@ -421,1 +421,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   12-Stage Controlled Pipeline
+                   مركز الاستيراد المتقدم (Import Center)
@@ -422,1 +422,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 </h2>
@@ -423,1 +423,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
+                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
@@ -424,1 +424,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   توقف إلزامي قبل الاعتماد (Pre-Commit Gate)
+                   12-Stage Controlled Pipeline
@@ -426,1 +426,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
@@ -427,1 +427,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <p className="text-xs sm:text-sm text-stone-600 mt-1">
+                   توقف إلزامي قبل الاعتماد (Pre-Commit Gate)
@@ -428,1 +428,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 استيراد وتدقيق دفعات الشحنات والتوريدات عبر 12 مرحلة تحكم ورقابة صارمة. يحتفظ بالنسخة الأصلية للبيانات لأغراض التدقيق.
+                 </span>
@@ -429,1 +429,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </p>
+               </div>
@@ -430,1 +430,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               <p className="text-xs sm:text-sm text-stone-600 mt-1">
@@ -431,1 +431,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+                 استيراد وتدقيق دفعات الشحنات والتوريدات عبر 12 مرحلة تحكم ورقابة صارمة. يحتفظ بالنسخة الأصلية للبيانات لأغراض التدقيق.
@@ -432,1 +432,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </p>
@@ -433,1 +433,1 @@ src/components/importCenter/ImportCenterView.tsx
-           {/* Quick Action Buttons */}
+             </div>
@@ -434,1 +434,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="flex items-center gap-2 flex-wrap">
+           </div>
@@ -435,1 +435,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <button
+ 
@@ -436,1 +436,1 @@ src/components/importCenter/ImportCenterView.tsx
-               onClick={() => setShowUploadModal(true)}
+           {/* Quick Action Buttons */}
@@ -437,1 +437,1 @@ src/components/importCenter/ImportCenterView.tsx
-               className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
+           <div className="flex items-center gap-2 flex-wrap">
@@ -438,1 +438,1 @@ src/components/importCenter/ImportCenterView.tsx
-             >
+             <button
@@ -439,1 +439,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <UploadCloud className="w-4 h-4" />
+               onClick={() => setShowUploadModal(true)}
@@ -440,1 +440,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <span>رفع ملف استيراد جديد (Upload)</span>
+               className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
@@ -441,1 +441,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </button>
+             >
@@ -442,1 +442,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               <UploadCloud className="w-4 h-4" />
@@ -443,1 +443,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <button
+               <span>رفع ملف استيراد جديد (Upload)</span>
@@ -444,1 +444,1 @@ src/components/importCenter/ImportCenterView.tsx
-               onClick={() => setShowRawSnapshotModal(true)}
+             </button>
@@ -445,1 +445,1 @@ src/components/importCenter/ImportCenterView.tsx
-               className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200 flex items-center gap-1.5 cursor-pointer"
+ 
@@ -446,1 +446,1 @@ src/components/importCenter/ImportCenterView.tsx
-             >
+             <button
@@ -447,1 +447,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <Eye className="w-4 h-4 text-stone-500" />
+               onClick={() => setShowRawSnapshotModal(true)}
@@ -448,1 +448,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <span>النسخة الأصلية للبيانات (Raw Snapshot)</span>
+               className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200 flex items-center gap-1.5 cursor-pointer"
@@ -449,1 +449,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </button>
+             >
@@ -450,1 +450,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               <Eye className="w-4 h-4 text-stone-500" />
@@ -451,1 +451,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <button
+               <span>النسخة الأصلية للبيانات (Raw Snapshot)</span>
@@ -452,1 +452,1 @@ src/components/importCenter/ImportCenterView.tsx
-               onClick={() => setShowAuditTrailModal(true)}
+             </button>
@@ -453,1 +453,1 @@ src/components/importCenter/ImportCenterView.tsx
-               className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200 flex items-center gap-1.5 cursor-pointer"
+ 
@@ -454,1 +454,1 @@ src/components/importCenter/ImportCenterView.tsx
-             >
+             <button
@@ -455,1 +455,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <History className="w-4 h-4 text-stone-500" />
+               onClick={() => setShowAuditTrailModal(true)}
@@ -456,1 +456,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <span>سجل التدقيق ({activeBatch.auditTrail.length})</span>
+               className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200 flex items-center gap-1.5 cursor-pointer"
@@ -457,1 +457,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </button>
+             >
@@ -458,1 +458,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+               <History className="w-4 h-4 text-stone-500" />
@@ -459,1 +459,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               <span>سجل التدقيق ({activeBatch.auditTrail.length})</span>
@@ -460,1 +460,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             </button>
@@ -461,1 +461,1 @@ src/components/importCenter/ImportCenterView.tsx
-         {/* 2. BATCH METADATA HEADER */}
+           </div>
@@ -462,1 +462,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="mt-5 pt-5 border-t border-stone-100">
+         </div>
@@ -463,1 +463,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-stone-50/80 rounded-xl p-4 border border-stone-200/80">
+ 
@@ -464,1 +464,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 text-xs">
+         {/* 2. BATCH METADATA HEADER */}
@@ -465,1 +465,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-3 flex-wrap">
+         <div className="mt-5 pt-5 border-t border-stone-100">
@@ -466,1 +466,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-500">معرف الدفعة (Batch ID):</span>
+           <div className="bg-stone-50/80 rounded-xl p-4 border border-stone-200/80">
@@ -467,1 +467,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-mono font-black text-stone-900 bg-white px-2.5 py-0.5 rounded border border-stone-200">
+             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 text-xs">
@@ -468,1 +468,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   {activeBatch.importBatchId}
+               <div className="flex items-center gap-3 flex-wrap">
@@ -469,1 +469,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 <span className="font-bold text-stone-500">معرف الدفعة (Batch ID):</span>
@@ -470,1 +470,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 <span className="font-mono font-black text-stone-900 bg-white px-2.5 py-0.5 rounded border border-stone-200">
@@ -471,1 +471,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-500">المشروع:</span>
+                   {activeBatch.importBatchId}
@@ -472,1 +472,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
+                 </span>
@@ -473,1 +473,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   {activeBatch.projectId}
+ 
@@ -474,1 +474,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 <span className="font-bold text-stone-500">المشروع:</span>
@@ -475,1 +475,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 <span className="font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
@@ -476,1 +476,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-500">اسم الملف:</span>
+                   {activeBatch.projectId}
@@ -477,1 +477,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
+                 </span>
@@ -478,1 +478,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   {activeBatch.fileName}
+ 
@@ -479,1 +479,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 <span className="font-bold text-stone-500">اسم الملف:</span>
@@ -480,1 +480,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
@@ -481,1 +481,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                   {activeBatch.fileName}
@@ -482,1 +482,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+                 </span>
@@ -483,1 +483,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-stone-500">بواسطة:</span>
+               </div>
@@ -484,1 +484,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-800">{activeBatch.uploadedBy}</span>
+ 
@@ -485,1 +485,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-stone-400">|</span>
+               <div className="flex items-center gap-2">
@@ -486,1 +486,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-stone-500 font-mono text-[11px]">{new Date(activeBatch.createdAt).toLocaleDateString('ar-SA')}</span>
+                 <span className="text-stone-500">بواسطة:</span>
@@ -487,1 +487,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="font-bold text-stone-800">{activeBatch.uploadedBy}</span>
@@ -488,1 +488,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <span className="text-stone-400">|</span>
@@ -489,1 +489,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 <span className="text-stone-500 font-mono text-[11px]">{new Date(activeBatch.createdAt).toLocaleDateString('ar-SA')}</span>
@@ -490,1 +490,1 @@ src/components/importCenter/ImportCenterView.tsx
-             {/* Batch Counters Bar */}
+               </div>
@@ -491,1 +491,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 text-right">
+             </div>
@@ -492,1 +492,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="bg-white p-2.5 rounded-lg border border-stone-200/70">
+ 
@@ -493,1 +493,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[10px] text-stone-500 block font-semibold">إجمالي الصفوف (rowCount)</span>
+             {/* Batch Counters Bar */}
@@ -494,1 +494,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-lg font-black text-stone-900">{activeBatch.rowCount}</span>
+             <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 text-right">
@@ -495,1 +495,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+               <div className="bg-white p-2.5 rounded-lg border border-stone-200/70">
@@ -496,1 +496,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/60">
+                 <span className="text-[10px] text-stone-500 block font-semibold">إجمالي الصفوف (rowCount)</span>
@@ -497,1 +497,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[10px] text-emerald-800 block font-semibold">الصفوف الصالحة (validCount)</span>
+                 <span className="text-lg font-black text-stone-900">{activeBatch.rowCount}</span>
@@ -498,1 +498,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-lg font-black text-emerald-900">{activeBatch.validCount}</span>
+               </div>
@@ -499,1 +499,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+               <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/60">
@@ -500,1 +500,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60">
+                 <span className="text-[10px] text-emerald-800 block font-semibold">الصفوف الصالحة (validCount)</span>
@@ -501,1 +501,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[10px] text-amber-800 block font-semibold">التحذيرات (warningCount)</span>
+                 <span className="text-lg font-black text-emerald-900">{activeBatch.validCount}</span>
@@ -502,1 +502,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-lg font-black text-amber-900">{activeBatch.warningCount}</span>
+               </div>
@@ -503,1 +503,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[9px] text-amber-700 block">تتطلب تأكيداً (Confirmation)</span>
+               <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60">
@@ -504,1 +504,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="text-[10px] text-amber-800 block font-semibold">التحذيرات (warningCount)</span>
@@ -505,1 +505,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="bg-rose-50/80 p-2.5 rounded-lg border border-rose-200/60">
+                 <span className="text-lg font-black text-amber-900">{activeBatch.warningCount}</span>
@@ -506,1 +506,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[10px] text-rose-800 block font-semibold">الأخطاء الحرجة (errorCount)</span>
+                 <span className="text-[9px] text-amber-700 block">تتطلب تأكيداً (Confirmation)</span>
@@ -507,1 +507,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-lg font-black text-rose-900">{activeBatch.errorCount}</span>
+               </div>
@@ -508,1 +508,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[9px] text-rose-700 block">تمنع الاعتماد (Blocks Commit)</span>
+               <div className="bg-rose-50/80 p-2.5 rounded-lg border border-rose-200/60">
@@ -509,1 +509,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="text-[10px] text-rose-800 block font-semibold">الأخطاء الحرجة (errorCount)</span>
@@ -510,1 +510,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="bg-stone-100 p-2.5 rounded-lg border border-stone-200 flex flex-col justify-center">
+                 <span className="text-lg font-black text-rose-900">{activeBatch.errorCount}</span>
@@ -511,1 +511,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-[10px] text-stone-500 block font-semibold">حالة الدفعة (status)</span>
+                 <span className="text-[9px] text-rose-700 block">تمنع الاعتماد (Blocks Commit)</span>
@@ -512,1 +512,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div className="mt-1">
+               </div>
@@ -513,1 +513,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   {activeBatch.status === 'COMMITTED' ? (
+               <div className="bg-stone-100 p-2.5 rounded-lg border border-stone-200 flex flex-col justify-center">
@@ -514,1 +514,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white inline-flex items-center gap-1">
+                 <span className="text-[10px] text-stone-500 block font-semibold">حالة الدفعة (status)</span>
@@ -515,1 +515,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <Check className="w-3 h-3" /> COMMITTED
+                 <div className="mt-1">
@@ -516,1 +516,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                   {activeBatch.status === 'COMMITTED' ? (
@@ -517,1 +517,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ) : activeBatch.errorCount > 0 ? (
+                     <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white inline-flex items-center gap-1">
@@ -518,1 +518,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white inline-flex items-center gap-1">
+                       <Check className="w-3 h-3" /> COMMITTED
@@ -519,1 +519,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <Lock className="w-3 h-3" /> AWAITING_CORRECTION
+                     </span>
@@ -520,1 +520,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                   ) : activeBatch.errorCount > 0 ? (
@@ -521,1 +521,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ) : (
+                     <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white inline-flex items-center gap-1">
@@ -522,1 +522,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white inline-flex items-center gap-1">
+                       <Lock className="w-3 h-3" /> AWAITING_CORRECTION
@@ -523,1 +523,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <Unlock className="w-3 h-3" /> READY_TO_COMMIT
+                     </span>
@@ -524,1 +524,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                   ) : (
@@ -525,1 +525,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   )}
+                     <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white inline-flex items-center gap-1">
@@ -526,1 +526,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+                       <Unlock className="w-3 h-3" /> READY_TO_COMMIT
@@ -527,1 +527,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                     </span>
@@ -528,1 +528,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                   )}
@@ -529,1 +529,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+                 </div>
@@ -530,1 +530,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               </div>
@@ -531,1 +531,1 @@ src/components/importCenter/ImportCenterView.tsx
-       </div>
+             </div>
@@ -532,1 +532,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+           </div>
@@ -533,1 +533,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 3. 12-STAGE PIPELINE VISUAL STEPPER */}
+         </div>
@@ -534,1 +534,1 @@ src/components/importCenter/ImportCenterView.tsx
-       <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-md border border-stone-800">
+       </div>
@@ -535,1 +535,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800">
+ 
@@ -536,1 +536,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div>
+       {/* 3. 12-STAGE PIPELINE VISUAL STEPPER */}
@@ -537,1 +537,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
+       <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-md border border-stone-800">
@@ -538,1 +538,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <Sparkles className="w-4 h-4" />
+         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800">
@@ -539,1 +539,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <span>مسار المراحل الـ 12 الإلزامي (The 12-Stage Import Architecture)</span>
+           <div>
@@ -540,1 +540,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </h3>
+             <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
@@ -541,1 +541,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <p className="text-xs text-stone-400 mt-0.5">
+               <Sparkles className="w-4 h-4" />
@@ -542,1 +542,1 @@ src/components/importCenter/ImportCenterView.tsx
-               يتوقف مسار الاستيراد حتمياً عند المرحلة التاسعة (التصحيح البشري) ولا يُسمح بالانتقال إلى المرحلة الـ 11 (الاعتماد) إلا بعد استيفاء الشروط.
+               <span>مسار المراحل الـ 12 الإلزامي (The 12-Stage Import Architecture)</span>
@@ -543,1 +543,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </p>
+             </h3>
@@ -544,1 +544,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+             <p className="text-xs text-stone-400 mt-0.5">
@@ -545,1 +545,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="flex items-center gap-2">
+               يتوقف مسار الاستيراد حتمياً عند المرحلة التاسعة (التصحيح البشري) ولا يُسمح بالانتقال إلى المرحلة الـ 11 (الاعتماد) إلا بعد استيفاء الشروط.
@@ -546,1 +546,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
+             </p>
@@ -547,1 +547,1 @@ src/components/importCenter/ImportCenterView.tsx
-               {isCommitted ? 'اكتملت جميع المراحل 12/12' : 'متوقف حالياً: المرحلة 9 (التصحيح والمراجعة البشرية)'}
+           </div>
@@ -548,1 +548,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </span>
+           <div className="flex items-center gap-2">
@@ -549,1 +549,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+             <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
@@ -550,1 +550,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               {isCommitted ? 'اكتملت جميع المراحل 12/12' : 'متوقف حالياً: المرحلة 9 (التصحيح والمراجعة البشرية)'}
@@ -551,1 +551,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             </span>
@@ -552,1 +552,1 @@ src/components/importCenter/ImportCenterView.tsx
-         {/* Stepper Steps Grid */}
+           </div>
@@ -553,1 +553,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
+         </div>
@@ -554,1 +554,1 @@ src/components/importCenter/ImportCenterView.tsx
-           {pipelineStages.map((st) => {
+ 
@@ -555,1 +555,1 @@ src/components/importCenter/ImportCenterView.tsx
-             const isPassed = isCommitted || st.number <= 9;
+         {/* Stepper Steps Grid */}
@@ -556,1 +556,1 @@ src/components/importCenter/ImportCenterView.tsx
-             const isCurrent = !isCommitted && (st.number === 9 || st.number === 10);
+         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
@@ -557,1 +557,1 @@ src/components/importCenter/ImportCenterView.tsx
-             const isPending = !isCommitted && st.number > 10;
+           {pipelineStages.map((st) => {
@@ -558,1 +558,1 @@ src/components/importCenter/ImportCenterView.tsx
-             const isPauseGate = st.number === 9;
+             const isPassed = isCommitted || st.number <= 9;
@@ -559,1 +559,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             const isCurrent = !isCommitted && (st.number === 9 || st.number === 10);
@@ -560,1 +560,1 @@ src/components/importCenter/ImportCenterView.tsx
-             return (
+             const isPending = !isCommitted && st.number > 10;
@@ -561,1 +561,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div
+             const isPauseGate = st.number === 9;
@@ -562,1 +562,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 key={st.stage}
+ 
@@ -563,1 +563,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className={`relative rounded-xl p-2.5 flex flex-col justify-between transition-all border ${
+             return (
@@ -564,1 +564,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   isCurrent
+               <div
@@ -565,1 +565,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/40'
+                 key={st.stage}
@@ -566,1 +566,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     : isPassed
+                 className={`relative rounded-xl p-2.5 flex flex-col justify-between transition-all border ${
@@ -567,1 +567,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     ? 'bg-stone-800/80 border-emerald-500/40 text-stone-200'
+                   isCurrent
@@ -568,1 +568,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     : 'bg-stone-800/40 border-stone-800 text-stone-500'
+                     ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/40'
@@ -569,1 +569,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }`}
+                     : isPassed
@@ -570,1 +570,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                     ? 'bg-stone-800/80 border-emerald-500/40 text-stone-200'
@@ -571,1 +571,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div>
+                     : 'bg-stone-800/40 border-stone-800 text-stone-500'
@@ -572,1 +572,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <div className="flex items-center justify-between mb-1">
+                 }`}
@@ -573,1 +573,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
+               >
@@ -574,1 +574,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       isCurrent 
+                 <div>
@@ -575,1 +575,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         ? 'bg-amber-400 text-stone-950 font-bold' 
+                   <div className="flex items-center justify-between mb-1">
@@ -576,1 +576,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         : isPassed 
+                     <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
@@ -577,1 +577,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         ? 'bg-emerald-500/20 text-emerald-400 font-bold' 
+                       isCurrent 
@@ -578,1 +578,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         : 'bg-stone-700 text-stone-400'
+                         ? 'bg-amber-400 text-stone-950 font-bold' 
@@ -579,1 +579,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     }`}>
+                         : isPassed 
@@ -580,1 +580,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {st.number}
+                         ? 'bg-emerald-500/20 text-emerald-400 font-bold' 
@@ -581,1 +581,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                         : 'bg-stone-700 text-stone-400'
@@ -582,1 +582,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     {isCurrent ? (
+                     }`}>
@@ -583,1 +583,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
+                       {st.number}
@@ -584,1 +584,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     ) : isPassed ? (
+                     </span>
@@ -585,1 +585,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <Check className="w-3 h-3 text-emerald-400" />
+                     {isCurrent ? (
@@ -586,1 +586,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     ) : (
+                       <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
@@ -587,1 +587,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <Lock className="w-3 h-3 text-stone-600" />
+                     ) : isPassed ? (
@@ -588,1 +588,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     )}
+                       <Check className="w-3 h-3 text-emerald-400" />
@@ -589,1 +589,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </div>
+                     ) : (
@@ -590,1 +590,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <div className="font-bold text-[11px] leading-tight mt-1">{st.nameAr}</div>
+                       <Lock className="w-3 h-3 text-stone-600" />
@@ -591,1 +591,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <div className="text-[9px] text-stone-400 font-mono mt-0.5">{st.desc}</div>
+                     )}
@@ -592,1 +592,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+                   </div>
@@ -593,1 +593,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                   <div className="font-bold text-[11px] leading-tight mt-1">{st.nameAr}</div>
@@ -594,1 +594,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {isPauseGate && !isCommitted && (
+                   <div className="text-[9px] text-stone-400 font-mono mt-0.5">{st.desc}</div>
@@ -595,1 +595,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <div className="mt-2 pt-1 border-t border-amber-400/30 text-[9px] text-amber-300 font-bold flex items-center gap-1">
+                 </div>
@@ -596,1 +596,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
+ 
@@ -597,1 +597,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>نقطة توقف إلزامية</span>
+                 {isPauseGate && !isCommitted && (
@@ -598,1 +598,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </div>
+                   <div className="mt-2 pt-1 border-t border-amber-400/30 text-[9px] text-amber-300 font-bold flex items-center gap-1">
@@ -599,1 +599,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 )}
+                     <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
@@ -600,1 +600,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                     <span>نقطة توقف إلزامية</span>
@@ -601,1 +601,1 @@ src/components/importCenter/ImportCenterView.tsx
-             );
+                   </div>
@@ -602,1 +602,1 @@ src/components/importCenter/ImportCenterView.tsx
-           })}
+                 )}
@@ -603,1 +603,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               </div>
@@ -604,1 +604,1 @@ src/components/importCenter/ImportCenterView.tsx
-       </div>
+             );
@@ -605,1 +605,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+           })}
@@ -606,1 +606,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 4. COMMIT STATUS & PRE-COMMIT ENFORCEMENT BANNER */}
+         </div>
@@ -607,1 +607,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {!isCommitted ? (
+       </div>
@@ -608,1 +608,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className={`p-5 rounded-2xl border text-right transition-all ${
+ 
@@ -609,1 +609,1 @@ src/components/importCenter/ImportCenterView.tsx
-           hasCritical 
+       {/* 4. COMMIT STATUS & PRE-COMMIT ENFORCEMENT BANNER */}
@@ -610,1 +610,1 @@ src/components/importCenter/ImportCenterView.tsx
-             ? 'bg-rose-50 border-rose-200 text-rose-950'
+       {!isCommitted ? (
@@ -611,1 +611,1 @@ src/components/importCenter/ImportCenterView.tsx
-             : hasWarnings
+         <div className={`p-5 rounded-2xl border text-right transition-all ${
@@ -612,1 +612,1 @@ src/components/importCenter/ImportCenterView.tsx
-             ? 'bg-amber-50 border-amber-200 text-amber-950'
+           hasCritical 
@@ -613,1 +613,1 @@ src/components/importCenter/ImportCenterView.tsx
-             : 'bg-emerald-50 border-emerald-200 text-emerald-950'
+             ? 'bg-rose-50 border-rose-200 text-rose-950'
@@ -614,1 +614,1 @@ src/components/importCenter/ImportCenterView.tsx
-         }`}>
+             : hasWarnings
@@ -615,1 +615,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
+             ? 'bg-amber-50 border-amber-200 text-amber-950'
@@ -616,1 +616,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-start gap-3">
+             : 'bg-emerald-50 border-emerald-200 text-emerald-950'
@@ -617,1 +617,1 @@ src/components/importCenter/ImportCenterView.tsx
-               {hasCritical ? (
+         }`}>
@@ -618,1 +618,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
+           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
@@ -619,1 +619,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <Lock className="w-6 h-6" />
+             <div className="flex items-start gap-3">
@@ -620,1 +620,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+               {hasCritical ? (
@@ -621,1 +621,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ) : hasWarnings ? (
+                 <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
@@ -622,1 +622,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
+                   <Lock className="w-6 h-6" />
@@ -623,1 +623,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <AlertTriangle className="w-6 h-6" />
+                 </div>
@@ -624,1 +624,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+               ) : hasWarnings ? (
@@ -625,1 +625,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ) : (
+                 <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
@@ -626,1 +626,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
+                   <AlertTriangle className="w-6 h-6" />
@@ -627,1 +627,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <ShieldCheck className="w-6 h-6" />
+                 </div>
@@ -628,1 +628,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+               ) : (
@@ -629,1 +629,1 @@ src/components/importCenter/ImportCenterView.tsx
-               )}
+                 <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
@@ -630,1 +630,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+                   <ShieldCheck className="w-6 h-6" />
@@ -631,1 +631,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <h4 className="text-base font-black">
+                 </div>
@@ -632,1 +632,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   {hasCritical ? (
+               )}
@@ -633,1 +633,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>يمنع تنفيذ الاعتماد (Commit Blocked) — يوجد ({activeBatch.errorCount}) أخطاء حرجة (CRITICAL)</span>
+               <div>
@@ -634,1 +634,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ) : hasWarnings ? (
+                 <h4 className="text-base font-black">
@@ -635,1 +635,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>جاهز للاعتماد مع اشتراط التأكيد — يوجد ({activeBatch.warningCount}) تحذيرات (WARNING)</span>
+                   {hasCritical ? (
@@ -636,1 +636,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ) : (
+                     <span>يمنع تنفيذ الاعتماد (Commit Blocked) — يوجد ({activeBatch.errorCount}) أخطاء حرجة (CRITICAL)</span>
@@ -637,1 +637,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>جاهز للاعتماد الفوري — جميع الصفوف مطابقة ومستوفية للشروط بنسبة 100%</span>
+                   ) : hasWarnings ? (
@@ -638,1 +638,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   )}
+                     <span>جاهز للاعتماد مع اشتراط التأكيد — يوجد ({activeBatch.warningCount}) تحذيرات (WARNING)</span>
@@ -639,1 +639,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </h4>
+                   ) : (
@@ -640,1 +640,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <p className="text-xs mt-1 leading-relaxed opacity-90">
+                     <span>جاهز للاعتماد الفوري — جميع الصفوف مطابقة ومستوفية للشروط بنسبة 100%</span>
@@ -641,1 +641,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   {hasCritical ? (
+                   )}
@@ -642,1 +642,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>
+                 </h4>
@@ -643,1 +643,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       النظام يمنع كتابة أي سجل إلى قاعدة البيانات حتى معالجة جميع التعارضات الحرجة (مثل تعارض تبعية الشاحنة، أو ناقل غير مرخص في المشروع، أو أوزان غير متطابقة). يمكنك تعديل القيمة أو اختيار سجل مرجعي أو استبعاد الصفوف المتعثرة.
+                 <p className="text-xs mt-1 leading-relaxed opacity-90">
@@ -644,1 +644,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                   {hasCritical ? (
@@ -645,1 +645,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ) : hasWarnings ? (
+                     <span>
@@ -646,1 +646,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>
+                       النظام يمنع كتابة أي سجل إلى قاعدة البيانات حتى معالجة جميع التعارضات الحرجة (مثل تعارض تبعية الشاحنة، أو ناقل غير مرخص في المشروع، أو أوزان غير متطابقة). يمكنك تعديل القيمة أو اختيار سجل مرجعي أو استبعاد الصفوف المتعثرة.
@@ -647,1 +647,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       تم حل جميع الأخطاء الحرجة. السجلات المتبقية تحوي تحذيرات فقط (مثل تطابق تقريبي للأسماء). يتطلب النظام تأكيداً بشرياً صريحاً قبل إتمام الـ Commit.
+                     </span>
@@ -648,1 +648,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                   ) : hasWarnings ? (
@@ -649,1 +649,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ) : (
+                     <span>
@@ -650,1 +650,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>
+                       تم حل جميع الأخطاء الحرجة. السجلات المتبقية تحوي تحذيرات فقط (مثل تطابق تقريبي للأسماء). يتطلب النظام تأكيداً بشرياً صريحاً قبل إتمام الـ Commit.
@@ -651,1 +651,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       اجتازت الدفعة جميع مراحل التدقيق والتحقق. يمكنك النقر على زر الاعتماد لترحيل السجلات وإنشاء سجل التدقيق الرقابي.
+                     </span>
@@ -652,1 +652,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                   ) : (
@@ -653,1 +653,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   )}
+                     <span>
@@ -654,1 +654,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </p>
+                       اجتازت الدفعة جميع مراحل التدقيق والتحقق. يمكنك النقر على زر الاعتماد لترحيل السجلات وإنشاء سجل التدقيق الرقابي.
@@ -655,1 +655,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                     </span>
@@ -656,1 +656,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                   )}
@@ -657,1 +657,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 </p>
@@ -658,1 +658,1 @@ src/components/importCenter/ImportCenterView.tsx
-             {/* Enforcement Action Buttons */}
+               </div>
@@ -659,1 +659,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
+             </div>
@@ -660,1 +660,1 @@ src/components/importCenter/ImportCenterView.tsx
-               {hasCritical && (
+ 
@@ -661,1 +661,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <button
+             {/* Enforcement Action Buttons */}
@@ -662,1 +662,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   onClick={handleRejectAllCriticalRows}
+             <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
@@ -663,1 +663,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
+               {hasCritical && (
@@ -664,1 +664,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 >
+                 <button
@@ -665,1 +665,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <X className="w-4 h-4 text-rose-700" />
+                   onClick={handleRejectAllCriticalRows}
@@ -666,1 +666,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <span>استبعاد كافة الصفوف الحرجة ({activeBatch.errorCount})</span>
+                   className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
@@ -667,1 +667,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </button>
+                 >
@@ -668,1 +668,1 @@ src/components/importCenter/ImportCenterView.tsx
-               )}
+                   <X className="w-4 h-4 text-rose-700" />
@@ -669,1 +669,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                   <span>استبعاد كافة الصفوف الحرجة ({activeBatch.errorCount})</span>
@@ -670,1 +670,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+                 </button>
@@ -671,1 +671,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 disabled={hasCritical}
+               )}
@@ -672,1 +672,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => handleCommitBatch(false)}
+ 
@@ -673,1 +673,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 ${
+               <button
@@ -674,1 +674,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   hasCritical
+                 disabled={hasCritical}
@@ -675,1 +675,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     ? 'bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-300'
+                 onClick={() => handleCommitBatch(false)}
@@ -676,1 +676,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
+                 className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 ${
@@ -677,1 +677,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }`}
+                   hasCritical
@@ -678,1 +678,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                     ? 'bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-300'
@@ -679,1 +679,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <CheckCircle2 className="w-4 h-4" />
+                     : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
@@ -680,1 +680,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span>تنفيذ الاعتماد النهائي (Commit Batch)</span>
+                 }`}
@@ -681,1 +681,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -682,1 +682,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <CheckCircle2 className="w-4 h-4" />
@@ -683,1 +683,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+                 <span>تنفيذ الاعتماد النهائي (Commit Batch)</span>
@@ -684,1 +684,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               </button>
@@ -685,1 +685,1 @@ src/components/importCenter/ImportCenterView.tsx
-       ) : (
+             </div>
@@ -686,1 +686,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
+           </div>
@@ -687,1 +687,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="flex items-center gap-3">
+         </div>
@@ -688,1 +688,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="p-2 rounded-xl bg-emerald-600 text-white">
+       ) : (
@@ -689,1 +689,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <Check className="w-6 h-6" />
+         <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
@@ -690,1 +690,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+           <div className="flex items-center gap-3">
@@ -691,1 +691,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div>
+             <div className="p-2 rounded-xl bg-emerald-600 text-white">
@@ -692,1 +692,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <h4 className="text-base font-black">
+               <Check className="w-6 h-6" />
@@ -693,1 +693,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 تم اعتماد الدفعة بنجاح (Batch Committed)
+             </div>
@@ -694,1 +694,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </h4>
+             <div>
@@ -695,1 +695,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <p className="text-xs text-emerald-800 mt-0.5">
+               <h4 className="text-base font-black">
@@ -696,1 +696,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 تم ترحيل ({activeBatch.committedRecordCount}) سجل بنجاح وحفظ النسخة الأصلية للبيانات في أرشيف التدقيق الرقابي في ({new Date(activeBatch.committedAt || '').toLocaleString('ar-SA')}).
+                 تم اعتماد الدفعة بنجاح (Batch Committed)
@@ -697,1 +697,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </p>
+               </h4>
@@ -698,1 +698,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               <p className="text-xs text-emerald-800 mt-0.5">
@@ -699,1 +699,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+                 تم ترحيل ({activeBatch.committedRecordCount}) سجل بنجاح وحفظ النسخة الأصلية للبيانات في أرشيف التدقيق الرقابي في ({new Date(activeBatch.committedAt || '').toLocaleString('ar-SA')}).
@@ -700,1 +700,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </p>
@@ -701,1 +701,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <button
+             </div>
@@ -702,1 +702,1 @@ src/components/importCenter/ImportCenterView.tsx
-             onClick={() => setShowAuditTrailModal(true)}
+           </div>
@@ -703,1 +703,1 @@ src/components/importCenter/ImportCenterView.tsx
-             className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs hover:bg-emerald-100 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
+ 
@@ -704,1 +704,1 @@ src/components/importCenter/ImportCenterView.tsx
-           >
+           <button
@@ -705,1 +705,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <History className="w-4 h-4 text-emerald-700" />
+             onClick={() => setShowAuditTrailModal(true)}
@@ -706,1 +706,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <span>عرض وثيقة التدقيق الصادرة</span>
+             className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs hover:bg-emerald-100 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
@@ -707,1 +707,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </button>
+           >
@@ -708,1 +708,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+             <History className="w-4 h-4 text-emerald-700" />
@@ -709,1 +709,1 @@ src/components/importCenter/ImportCenterView.tsx
-       )}
+             <span>عرض وثيقة التدقيق الصادرة</span>
@@ -710,1 +710,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+           </button>
@@ -711,1 +711,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 5. REVIEW TABLE SECTION */}
+         </div>
@@ -712,1 +712,1 @@ src/components/importCenter/ImportCenterView.tsx
-       <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
+       )}
@@ -713,1 +713,1 @@ src/components/importCenter/ImportCenterView.tsx
-         {/* Table Toolbar */}
+ 
@@ -714,1 +714,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-100">
+       {/* 5. REVIEW TABLE SECTION */}
@@ -715,1 +715,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div>
+       <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
@@ -716,1 +716,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
+         {/* Table Toolbar */}
@@ -717,1 +717,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <SlidersHorizontal className="w-4 h-4 text-amber-600" />
+         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-100">
@@ -718,1 +718,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <span>جدول مراجعة وتصحيح الحقول (Human Review & Correction Table)</span>
+           <div>
@@ -719,1 +719,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </h3>
+             <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
@@ -720,1 +720,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <p className="text-xs text-stone-500">
+               <SlidersHorizontal className="w-4 h-4 text-amber-600" />
@@ -721,1 +721,1 @@ src/components/importCenter/ImportCenterView.tsx
-               قم بمراجعة الاقتراحات واتخاذ القرارات التصحيحية لكل حقل (قبول الاقتراح، الإبقاء على الأصل، اختيار سجل معتمد، تعديل يدوي، أو رفض الصف).
+               <span>جدول مراجعة وتصحيح الحقول (Human Review & Correction Table)</span>
@@ -722,1 +722,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </p>
+             </h3>
@@ -723,1 +723,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+             <p className="text-xs text-stone-500">
@@ -724,1 +724,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               قم بمراجعة الاقتراحات واتخاذ القرارات التصحيحية لكل حقل (قبول الاقتراح، الإبقاء على الأصل، اختيار سجل معتمد، تعديل يدوي، أو رفض الصف).
@@ -725,1 +725,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="flex items-center gap-2 flex-wrap">
+             </p>
@@ -726,1 +726,1 @@ src/components/importCenter/ImportCenterView.tsx
-             {/* Quick Bulk Action */}
+           </div>
@@ -727,1 +727,1 @@ src/components/importCenter/ImportCenterView.tsx
-             {!isCommitted && (
+ 
@@ -728,1 +728,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+           <div className="flex items-center gap-2 flex-wrap">
@@ -729,1 +729,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={handleBulkAccept}
+             {/* Quick Bulk Action */}
@@ -730,1 +730,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
+             {!isCommitted && (
@@ -731,1 +731,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+               <button
@@ -732,1 +732,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <Sparkles className="w-3.5 h-3.5 text-purple-600" />
+                 onClick={handleBulkAccept}
@@ -733,1 +733,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span>قبول كافة الاقتراحات الموثوقة ({'>'}80%)</span>
+                 className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
@@ -734,1 +734,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -735,1 +735,1 @@ src/components/importCenter/ImportCenterView.tsx
-             )}
+                 <Sparkles className="w-3.5 h-3.5 text-purple-600" />
@@ -736,1 +736,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 <span>قبول كافة الاقتراحات الموثوقة ({'>'}80%)</span>
@@ -737,1 +737,1 @@ src/components/importCenter/ImportCenterView.tsx
-             {/* Severity Filter Tabs */}
+               </button>
@@ -738,1 +738,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
+             )}
@@ -739,1 +739,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+ 
@@ -740,1 +740,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setSelectedSeverityFilter('ALL')}
+             {/* Severity Filter Tabs */}
@@ -741,1 +741,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
+             <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
@@ -742,1 +742,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   selectedSeverityFilter === 'ALL' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-700'
+               <button
@@ -743,1 +743,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }`}
+                 onClick={() => setSelectedSeverityFilter('ALL')}
@@ -744,1 +744,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
@@ -745,1 +745,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 الكل ({activeBatch.reviewItems.length})
+                   selectedSeverityFilter === 'ALL' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-700'
@@ -746,1 +746,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 }`}
@@ -747,1 +747,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+               >
@@ -748,1 +748,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setSelectedSeverityFilter('CRITICAL')}
+                 الكل ({activeBatch.reviewItems.length})
@@ -749,1 +749,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
+               </button>
@@ -750,1 +750,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   selectedSeverityFilter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-800'
+               <button
@@ -751,1 +751,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }`}
+                 onClick={() => setSelectedSeverityFilter('CRITICAL')}
@@ -752,1 +752,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
@@ -753,1 +753,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 حرجة ({activeBatch.reviewItems.filter((i) => i.severity === 'CRITICAL').length})
+                   selectedSeverityFilter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-800'
@@ -754,1 +754,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 }`}
@@ -755,1 +755,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+               >
@@ -756,1 +756,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setSelectedSeverityFilter('WARNING')}
+                 حرجة ({activeBatch.reviewItems.filter((i) => i.severity === 'CRITICAL').length})
@@ -757,1 +757,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
+               </button>
@@ -758,1 +758,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   selectedSeverityFilter === 'WARNING' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800'
+               <button
@@ -759,1 +759,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }`}
+                 onClick={() => setSelectedSeverityFilter('WARNING')}
@@ -760,1 +760,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
@@ -761,1 +761,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 تحذيرات ({activeBatch.reviewItems.filter((i) => i.severity === 'WARNING').length})
+                   selectedSeverityFilter === 'WARNING' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800'
@@ -762,1 +762,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 }`}
@@ -763,1 +763,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+               >
@@ -764,1 +764,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setSelectedSeverityFilter('INFO')}
+                 تحذيرات ({activeBatch.reviewItems.filter((i) => i.severity === 'WARNING').length})
@@ -765,1 +765,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
+               </button>
@@ -766,1 +766,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   selectedSeverityFilter === 'INFO' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-800'
+               <button
@@ -767,1 +767,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }`}
+                 onClick={() => setSelectedSeverityFilter('INFO')}
@@ -768,1 +768,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
@@ -769,1 +769,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 معلومات ({activeBatch.reviewItems.filter((i) => i.severity === 'INFO').length})
+                   selectedSeverityFilter === 'INFO' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-800'
@@ -770,1 +770,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 }`}
@@ -771,1 +771,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               >
@@ -772,1 +772,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+                 معلومات ({activeBatch.reviewItems.filter((i) => i.severity === 'INFO').length})
@@ -773,1 +773,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               </button>
@@ -774,1 +774,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             </div>
@@ -775,1 +775,1 @@ src/components/importCenter/ImportCenterView.tsx
-         {/* Search input */}
+           </div>
@@ -776,1 +776,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="mb-4">
+         </div>
@@ -777,1 +777,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="relative">
+ 
@@ -778,1 +778,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
+         {/* Search input */}
@@ -779,1 +779,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <input
+         <div className="mb-4">
@@ -780,1 +780,1 @@ src/components/importCenter/ImportCenterView.tsx
-               type="text"
+           <div className="relative">
@@ -781,1 +781,1 @@ src/components/importCenter/ImportCenterView.tsx
-               value={searchQuery}
+             <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
@@ -782,1 +782,1 @@ src/components/importCenter/ImportCenterView.tsx
-               onChange={(e) => setSearchQuery(e.target.value)}
+             <input
@@ -783,1 +783,1 @@ src/components/importCenter/ImportCenterView.tsx
-               placeholder="البحث برقم الصف، أو اسم الحقل، أو القيمة، أو المشكلة..."
+               type="text"
@@ -784,1 +784,1 @@ src/components/importCenter/ImportCenterView.tsx
-               className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
+               value={searchQuery}
@@ -785,1 +785,1 @@ src/components/importCenter/ImportCenterView.tsx
-             />
+               onChange={(e) => setSearchQuery(e.target.value)}
@@ -786,1 +786,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+               placeholder="البحث برقم الصف، أو اسم الحقل، أو القيمة، أو المشكلة..."
@@ -787,1 +787,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
@@ -788,1 +788,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             />
@@ -789,1 +789,1 @@ src/components/importCenter/ImportCenterView.tsx
-         {/* 6. EXACT REQUESTED REVIEW TABLE */}
+           </div>
@@ -790,1 +790,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="overflow-x-auto border border-stone-200 rounded-xl">
+         </div>
@@ -791,1 +791,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <table className="w-full text-right border-collapse text-xs">
+ 
@@ -792,1 +792,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <thead>
+         {/* 6. EXACT REQUESTED REVIEW TABLE */}
@@ -793,1 +793,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <tr className="bg-stone-100/80 text-stone-700 font-bold border-b border-stone-200">
+         <div className="overflow-x-auto border border-stone-200 rounded-xl">
@@ -794,1 +794,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 w-14">Row</th>
+           <table className="w-full text-right border-collapse text-xs">
@@ -795,1 +795,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 w-36">Field</th>
+             <thead>
@@ -796,1 +796,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 min-w-[140px]">Original Value</th>
+               <tr className="bg-stone-100/80 text-stone-700 font-bold border-b border-stone-200">
@@ -797,1 +797,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 min-w-[150px]">Suggested Value</th>
+                 <th className="py-3 px-3 w-14">Row</th>
@@ -798,1 +798,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 w-28 text-center">Confidence</th>
+                 <th className="py-3 px-3 w-36">Field</th>
@@ -799,1 +799,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 min-w-[220px]">Issue</th>
+                 <th className="py-3 px-3 min-w-[140px]">Original Value</th>
@@ -800,1 +800,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 w-24 text-center">Severity</th>
+                 <th className="py-3 px-3 min-w-[150px]">Suggested Value</th>
@@ -801,1 +801,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <th className="py-3 px-3 min-w-[200px] text-center">Action</th>
+                 <th className="py-3 px-3 w-28 text-center">Confidence</th>
@@ -802,1 +802,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </tr>
+                 <th className="py-3 px-3 min-w-[220px]">Issue</th>
@@ -803,1 +803,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </thead>
+                 <th className="py-3 px-3 w-24 text-center">Severity</th>
@@ -804,1 +804,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <tbody className="divide-y divide-stone-100">
+                 <th className="py-3 px-3 min-w-[200px] text-center">Action</th>
@@ -805,1 +805,1 @@ src/components/importCenter/ImportCenterView.tsx
-               {filteredReviewItems.length === 0 ? (
+               </tr>
@@ -806,1 +806,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <tr>
+             </thead>
@@ -807,1 +807,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <td colSpan={8} className="py-8 text-center text-stone-400">
+             <tbody className="divide-y divide-stone-100">
@@ -808,1 +808,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     لا توجد عناصر مراجعة مطابقة للفلتر المحدد.
+               {filteredReviewItems.length === 0 ? (
@@ -809,1 +809,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </td>
+                 <tr>
@@ -810,1 +810,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </tr>
+                   <td colSpan={8} className="py-8 text-center text-stone-400">
@@ -811,1 +811,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ) : (
+                     لا توجد عناصر مراجعة مطابقة للفلتر المحدد.
@@ -812,1 +812,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 filteredReviewItems.map((item) => {
+                   </td>
@@ -813,1 +813,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   const isRowRejected = item.rowStatus === 'REJECTED';
+                 </tr>
@@ -814,1 +814,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               ) : (
@@ -815,1 +815,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   return (
+                 filteredReviewItems.map((item) => {
@@ -816,1 +816,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <tr
+                   const isRowRejected = item.rowStatus === 'REJECTED';
@@ -817,1 +817,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       key={item.id}
+ 
@@ -818,1 +818,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       className={`hover:bg-stone-50/80 transition-colors ${
+                   return (
@@ -819,1 +819,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         isRowRejected
+                     <tr
@@ -820,1 +820,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           ? 'bg-stone-100/70 opacity-60'
+                       key={item.id}
@@ -821,1 +821,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           : item.severity === 'CRITICAL' && item.action === 'KEEP_ORIGINAL'
+                       className={`hover:bg-stone-50/80 transition-colors ${
@@ -822,1 +822,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           ? 'bg-rose-50/40'
+                         isRowRejected
@@ -823,1 +823,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           : item.severity === 'CRITICAL'
+                           ? 'bg-stone-100/70 opacity-60'
@@ -824,1 +824,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           ? 'bg-rose-50/20'
+                           : item.severity === 'CRITICAL' && item.action === 'KEEP_ORIGINAL'
@@ -825,1 +825,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           : item.severity === 'WARNING'
+                           ? 'bg-rose-50/40'
@@ -826,1 +826,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           ? 'bg-amber-50/20'
+                           : item.severity === 'CRITICAL'
@@ -827,1 +827,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           : ''
+                           ? 'bg-rose-50/20'
@@ -828,1 +828,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       }`}
+                           : item.severity === 'WARNING'
@@ -829,1 +829,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     >
+                           ? 'bg-amber-50/20'
@@ -830,1 +830,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 1. Row */}
+                           : ''
@@ -831,1 +831,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 font-mono font-bold text-stone-600">
+                       }`}
@@ -832,1 +832,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         #{item.rowNumber}
+                     >
@@ -833,1 +833,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                       {/* 1. Row */}
@@ -834,1 +834,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                       <td className="py-3 px-3 font-mono font-bold text-stone-600">
@@ -835,1 +835,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 2. Field */}
+                         #{item.rowNumber}
@@ -836,1 +836,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 font-bold text-stone-800">
+                       </td>
@@ -837,1 +837,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         {item.field}
+ 
@@ -838,1 +838,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                       {/* 2. Field */}
@@ -839,1 +839,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                       <td className="py-3 px-3 font-bold text-stone-800">
@@ -840,1 +840,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 3. Original Value */}
+                         {item.field}
@@ -841,1 +841,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 text-stone-900 font-medium">
+                       </td>
@@ -842,1 +842,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         <div className="font-mono bg-stone-100 px-2 py-1 rounded inline-block">
+ 
@@ -843,1 +843,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           {item.originalValue || <span className="text-stone-400 italic">فارغ</span>}
+                       {/* 3. Original Value */}
@@ -844,1 +844,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         </div>
+                       <td className="py-3 px-3 text-stone-900 font-medium">
@@ -845,1 +845,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                         <div className="font-mono bg-stone-100 px-2 py-1 rounded inline-block">
@@ -846,1 +846,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                           {item.originalValue || <span className="text-stone-400 italic">فارغ</span>}
@@ -847,1 +847,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 4. Suggested Value */}
+                         </div>
@@ -848,1 +848,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 font-semibold">
+                       </td>
@@ -849,1 +849,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         <div className="flex items-center gap-1.5 flex-wrap">
+ 
@@ -850,1 +850,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           <span className="text-amber-900 font-mono bg-amber-50 px-2 py-1 rounded border border-amber-200/60">
+                       {/* 4. Suggested Value */}
@@ -851,1 +851,1 @@ src/components/importCenter/ImportCenterView.tsx
-                             {item.manualValue || item.chosenMasterValue || item.suggestedValue}
+                       <td className="py-3 px-3 font-semibold">
@@ -852,1 +852,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           </span>
+                         <div className="flex items-center gap-1.5 flex-wrap">
@@ -853,1 +853,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           {item.manualValue && (
+                           <span className="text-amber-900 font-mono bg-amber-50 px-2 py-1 rounded border border-amber-200/60">
@@ -854,1 +854,1 @@ src/components/importCenter/ImportCenterView.tsx
-                             <span className="text-[10px] text-sky-700 bg-sky-50 px-1 rounded font-bold">مخصص</span>
+                             {item.manualValue || item.chosenMasterValue || item.suggestedValue}
@@ -855,1 +855,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           )}
+                           </span>
@@ -856,1 +856,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           {item.chosenMasterValue && (
+                           {item.manualValue && (
@@ -857,1 +857,1 @@ src/components/importCenter/ImportCenterView.tsx
-                             <span className="text-[10px] text-purple-700 bg-purple-50 px-1 rounded font-bold">معتمد</span>
+                             <span className="text-[10px] text-sky-700 bg-sky-50 px-1 rounded font-bold">مخصص</span>
@@ -859,1 +859,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         </div>
+                           {item.chosenMasterValue && (
@@ -860,1 +860,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                             <span className="text-[10px] text-purple-700 bg-purple-50 px-1 rounded font-bold">معتمد</span>
@@ -861,1 +861,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                           )}
@@ -862,1 +862,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 5. Confidence */}
+                         </div>
@@ -863,1 +863,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 text-center">
+                       </td>
@@ -864,1 +864,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         <div className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-800 border border-stone-200">
+ 
@@ -865,1 +865,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           <span className={item.confidence >= 80 ? 'text-emerald-700' : item.confidence >= 50 ? 'text-amber-700' : 'text-stone-600'}>
+                       {/* 5. Confidence */}
@@ -866,1 +866,1 @@ src/components/importCenter/ImportCenterView.tsx
-                             {item.confidence}%
+                       <td className="py-3 px-3 text-center">
@@ -867,1 +867,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           </span>
+                         <div className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-800 border border-stone-200">
@@ -868,1 +868,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         </div>
+                           <span className={item.confidence >= 80 ? 'text-emerald-700' : item.confidence >= 50 ? 'text-amber-700' : 'text-stone-600'}>
@@ -869,1 +869,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                             {item.confidence}%
@@ -870,1 +870,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                           </span>
@@ -871,1 +871,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 6. Issue */}
+                         </div>
@@ -872,1 +872,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 text-stone-700 text-xs">
+                       </td>
@@ -873,1 +873,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         <div className="leading-relaxed">
+ 
@@ -874,1 +874,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           {item.issue}
+                       {/* 6. Issue */}
@@ -875,1 +875,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         </div>
+                       <td className="py-3 px-3 text-stone-700 text-xs">
@@ -876,1 +876,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                         <div className="leading-relaxed">
@@ -877,1 +877,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                           {item.issue}
@@ -878,1 +878,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 7. Severity */}
+                         </div>
@@ -879,1 +879,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3 text-center">
+                       </td>
@@ -880,1 +880,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         {getSeverityBadge(item.severity)}
+ 
@@ -881,1 +881,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                       {/* 7. Severity */}
@@ -882,1 +882,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                       <td className="py-3 px-3 text-center">
@@ -883,1 +883,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {/* 8. Action (Drop-down or Select with all required actions) */}
+                         {getSeverityBadge(item.severity)}
@@ -884,1 +884,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <td className="py-3 px-3">
+                       </td>
@@ -885,1 +885,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         <div className="flex flex-col gap-1.5">
+ 
@@ -886,1 +886,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           {getActionBadge(item.action, item.rowStatus)}
+                       {/* 8. Action (Drop-down or Select with all required actions) */}
@@ -887,1 +887,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                       <td className="py-3 px-3">
@@ -888,1 +888,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           {!isCommitted && (
+                         <div className="flex flex-col gap-1.5">
@@ -889,1 +889,1 @@ src/components/importCenter/ImportCenterView.tsx
-                             <div className="flex items-center gap-1 flex-wrap mt-1">
+                           {getActionBadge(item.action, item.rowStatus)}
@@ -890,1 +890,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {/* 1. Accept Suggestion */}
+ 
@@ -891,1 +891,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {item.confidence > 0 && (
+                           {!isCommitted && (
@@ -892,1 +892,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 <button
+                             <div className="flex items-center gap-1 flex-wrap mt-1">
@@ -893,1 +893,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                   onClick={() => handleApplyAction(item.id, 'ACCEPT_SUGGESTION')}
+                               {/* 1. Accept Suggestion */}
@@ -894,1 +894,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                   title="Accept Suggestion (قبول الاقتراح)"
+                               {item.confidence > 0 && (
@@ -895,1 +895,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                   className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
+                                 <button
@@ -896,1 +896,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 >
+                                   onClick={() => handleApplyAction(item.id, 'ACCEPT_SUGGESTION')}
@@ -897,1 +897,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                   قبول الاقتراح
+                                   title="Accept Suggestion (قبول الاقتراح)"
@@ -898,1 +898,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 </button>
+                                   className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
@@ -899,1 +899,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               )}
+                                 >
@@ -900,1 +900,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                                   قبول الاقتراح
@@ -901,1 +901,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {/* 2. Keep Original */}
+                                 </button>
@@ -902,1 +902,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               <button
+                               )}
@@ -903,1 +903,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 onClick={() => handleApplyAction(item.id, 'KEEP_ORIGINAL')}
+ 
@@ -904,1 +904,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 title="Keep Original (الإبقاء على الأصل)"
+                               {/* 2. Keep Original */}
@@ -905,1 +905,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 className="px-2 py-1 text-[10px] font-bold rounded bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 cursor-pointer"
+                               <button
@@ -906,1 +906,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               >
+                                 onClick={() => handleApplyAction(item.id, 'KEEP_ORIGINAL')}
@@ -907,1 +907,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 إبقاء الأصل
+                                 title="Keep Original (الإبقاء على الأصل)"
@@ -908,1 +908,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               </button>
+                                 className="px-2 py-1 text-[10px] font-bold rounded bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 cursor-pointer"
@@ -909,1 +909,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                               >
@@ -910,1 +910,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {/* 3. Choose Master Record */}
+                                 إبقاء الأصل
@@ -911,1 +911,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               <button
+                               </button>
@@ -912,1 +912,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 onClick={() => setSelectingMasterItem(item)}
+ 
@@ -913,1 +913,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 title="Choose Master Record (اختيار سجل مرجعي)"
+                               {/* 3. Choose Master Record */}
@@ -914,1 +914,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 className="px-2 py-1 text-[10px] font-bold rounded bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200 cursor-pointer"
+                               <button
@@ -915,1 +915,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               >
+                                 onClick={() => setSelectingMasterItem(item)}
@@ -916,1 +916,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 اختيار معتمد...
+                                 title="Choose Master Record (اختيار سجل مرجعي)"
@@ -917,1 +917,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               </button>
+                                 className="px-2 py-1 text-[10px] font-bold rounded bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200 cursor-pointer"
@@ -918,1 +918,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                               >
@@ -919,1 +919,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {/* 4. Edit Manually */}
+                                 اختيار معتمد...
@@ -920,1 +920,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               <button
+                               </button>
@@ -921,1 +921,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 onClick={() => {
+ 
@@ -922,1 +922,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                   setEditingItem(item);
+                               {/* 4. Edit Manually */}
@@ -923,1 +923,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                   setManualInputValue(item.manualValue || item.suggestedValue || item.originalValue);
+                               <button
@@ -924,1 +924,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 }}
+                                 onClick={() => {
@@ -925,1 +925,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 title="Edit Manually (تعديل يدوي)"
+                                   setEditingItem(item);
@@ -926,1 +926,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 className="px-2 py-1 text-[10px] font-bold rounded bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 cursor-pointer"
+                                   setManualInputValue(item.manualValue || item.suggestedValue || item.originalValue);
@@ -927,1 +927,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               >
+                                 }}
@@ -928,1 +928,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 تعديل يدوي...
+                                 title="Edit Manually (تعديل يدوي)"
@@ -929,1 +929,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               </button>
+                                 className="px-2 py-1 text-[10px] font-bold rounded bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 cursor-pointer"
@@ -930,1 +930,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                               >
@@ -931,1 +931,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {/* 5. Ignore */}
+                                 تعديل يدوي...
@@ -932,1 +932,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               <button
+                               </button>
@@ -933,1 +933,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 onClick={() => handleApplyAction(item.id, 'IGNORE')}
+ 
@@ -934,1 +934,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 title="Ignore (تجاهل)"
+                               {/* 5. Ignore */}
@@ -935,1 +935,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 className="px-2 py-1 text-[10px] font-bold rounded bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 cursor-pointer"
+                               <button
@@ -936,1 +936,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               >
+                                 onClick={() => handleApplyAction(item.id, 'IGNORE')}
@@ -937,1 +937,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 تجاهل
+                                 title="Ignore (تجاهل)"
@@ -938,1 +938,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               </button>
+                                 className="px-2 py-1 text-[10px] font-bold rounded bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 cursor-pointer"
@@ -939,1 +939,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                               >
@@ -940,1 +940,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               {/* 6. Reject Row */}
+                                 تجاهل
@@ -941,1 +941,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               <button
+                               </button>
@@ -942,1 +942,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 onClick={() => handleApplyAction(item.id, 'REJECT_ROW')}
+ 
@@ -943,1 +943,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 title="Reject Row (استبعاد الصف)"
+                               {/* 6. Reject Row */}
@@ -944,1 +944,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 className="px-2 py-1 text-[10px] font-bold rounded bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200 cursor-pointer"
+                               <button
@@ -945,1 +945,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               >
+                                 onClick={() => handleApplyAction(item.id, 'REJECT_ROW')}
@@ -946,1 +946,1 @@ src/components/importCenter/ImportCenterView.tsx
-                                 رفض الصف
+                                 title="Reject Row (استبعاد الصف)"
@@ -947,1 +947,1 @@ src/components/importCenter/ImportCenterView.tsx
-                               </button>
+                                 className="px-2 py-1 text-[10px] font-bold rounded bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200 cursor-pointer"
@@ -948,1 +948,1 @@ src/components/importCenter/ImportCenterView.tsx
-                             </div>
+                               >
@@ -949,1 +949,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           )}
+                                 رفض الصف
@@ -950,1 +950,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         </div>
+                               </button>
@@ -951,1 +951,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </td>
+                             </div>
@@ -952,1 +952,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </tr>
+                           )}
@@ -953,1 +953,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   );
+                         </div>
@@ -954,1 +954,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 })
+                       </td>
@@ -955,1 +955,1 @@ src/components/importCenter/ImportCenterView.tsx
-               )}
+                     </tr>
@@ -956,1 +956,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </tbody>
+                   );
@@ -957,1 +957,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </table>
+                 })
@@ -958,1 +958,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+               )}
@@ -959,1 +959,1 @@ src/components/importCenter/ImportCenterView.tsx
-       </div>
+             </tbody>
@@ -960,1 +960,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+           </table>
@@ -961,1 +961,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 7. MODAL: Upload New File */}
+         </div>
@@ -962,1 +962,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {showUploadModal && (
+       </div>
@@ -963,1 +963,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
+ 
@@ -964,1 +964,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
+       {/* 7. MODAL: Upload New File */}
@@ -965,1 +965,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
+       {showUploadModal && (
@@ -966,1 +966,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
@@ -967,1 +967,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
+           <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
@@ -968,1 +968,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <UploadCloud className="w-5 h-5" />
+             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
@@ -969,1 +969,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+               <div className="flex items-center gap-2">
@@ -970,1 +970,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <h4 className="text-base font-bold text-stone-900">
+                 <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
@@ -971,1 +971,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   رفع ملف استيراد جديد (Import Center Upload)
+                   <UploadCloud className="w-5 h-5" />
@@ -972,1 +972,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </h4>
+                 </span>
@@ -973,1 +973,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <h4 className="text-base font-bold text-stone-900">
@@ -974,1 +974,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button 
+                   رفع ملف استيراد جديد (Import Center Upload)
@@ -975,1 +975,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowUploadModal(false)}
+                 </h4>
@@ -976,1 +976,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="text-stone-400 hover:text-stone-600 p-1"
+               </div>
@@ -977,1 +977,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+               <button 
@@ -978,1 +978,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <X className="w-5 h-5" />
+                 onClick={() => setShowUploadModal(false)}
@@ -979,1 +979,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 className="text-stone-400 hover:text-stone-600 p-1"
@@ -980,1 +980,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               >
@@ -981,1 +981,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 <X className="w-5 h-5" />
@@ -982,1 +982,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="space-y-4">
+               </button>
@@ -983,1 +983,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+             </div>
@@ -984,1 +984,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <label className="block text-xs font-bold text-stone-700 mb-1">
+ 
@@ -985,1 +985,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   اسم الملف المصدر
+             <div className="space-y-4">
@@ -986,1 +986,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </label>
+               <div>
@@ -987,1 +987,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <input
+                 <label className="block text-xs font-bold text-stone-700 mb-1">
@@ -988,1 +988,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   type="text"
+                   اسم الملف المصدر
@@ -989,1 +989,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   value={uploadedFileName}
+                 </label>
@@ -990,1 +990,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   onChange={(e) => setUploadedFileName(e.target.value)}
+                 <input
@@ -991,1 +991,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-medium"
+                   type="text"
@@ -992,1 +992,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 />
+                   value={uploadedFileName}
@@ -993,1 +993,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   onChange={(e) => setUploadedFileName(e.target.value)}
@@ -994,1 +994,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-medium"
@@ -995,1 +995,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+                 />
@@ -996,1 +996,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <label className="block text-xs font-bold text-stone-700 mb-1">
+               </div>
@@ -997,1 +997,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   محتوى البيانات (CSV أو مفصول بفواصل/جدولة)
+ 
@@ -998,1 +998,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </label>
+               <div>
@@ -999,1 +999,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <textarea
+                 <label className="block text-xs font-bold text-stone-700 mb-1">
@@ -1000,1 +1000,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   rows={8}
+                   محتوى البيانات (CSV أو مفصول بفواصل/جدولة)
@@ -1001,1 +1001,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   value={rawUploadText}
+                 </label>
@@ -1002,1 +1002,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   onChange={(e) => setRawUploadText(e.target.value)}
+                 <textarea
@@ -1003,1 +1003,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-mono text-left dir-ltr bg-stone-50"
+                   rows={8}
@@ -1004,1 +1004,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   dir="ltr"
+                   value={rawUploadText}
@@ -1005,1 +1005,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 />
+                   onChange={(e) => setRawUploadText(e.target.value)}
@@ -1006,1 +1006,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-mono text-left dir-ltr bg-stone-50"
@@ -1007,1 +1007,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                   dir="ltr"
@@ -1008,1 +1008,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
+                 />
@@ -1009,1 +1009,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold block mb-1">سلوك مسار المعالجة:</span>
+               </div>
@@ -1010,1 +1010,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <p>
+ 
@@ -1011,1 +1011,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   سيقوم النظام بتنفيذ المراحل من 1 إلى 8 تلقائياً (تفكيك الأعمدة، المعايرة، المطابقة، كشف التكرار)، ثم سيتوقف إلزامياً عند المرحلة التاسعة (التصحيح البشري) لعرض جدول المراجعة قبل الاعتماد.
+               <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
@@ -1012,1 +1012,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </p>
+                 <span className="font-bold block mb-1">سلوك مسار المعالجة:</span>
@@ -1013,1 +1013,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <p>
@@ -1014,1 +1014,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                   سيقوم النظام بتنفيذ المراحل من 1 إلى 8 تلقائياً (تفكيك الأعمدة، المعايرة، المطابقة، كشف التكرار)، ثم سيتوقف إلزامياً عند المرحلة التاسعة (التصحيح البشري) لعرض جدول المراجعة قبل الاعتماد.
@@ -1015,1 +1015,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 </p>
@@ -1016,1 +1016,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
+               </div>
@@ -1017,1 +1017,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+             </div>
@@ -1018,1 +1018,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowUploadModal(false)}
+ 
@@ -1019,1 +1019,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
+             <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
@@ -1020,1 +1020,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+               <button
@@ -1021,1 +1021,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 إلغاء
+                 onClick={() => setShowUploadModal(false)}
@@ -1022,1 +1022,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
@@ -1023,1 +1023,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+               >
@@ -1024,1 +1024,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 disabled={isAnalyzing}
+                 {t("shared.actions.cancel")}</button>
@@ -1025,1 +1025,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={handleStartImport}
+               <button
@@ -1026,1 +1026,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
+                 disabled={isAnalyzing}
@@ -1027,1 +1027,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 onClick={handleStartImport}
@@ -1028,1 +1028,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
+                 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
@@ -1029,1 +1029,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span>بدء مسار الاستيراد والفحص (Start Pipeline)</span>
+               >
@@ -1030,1 +1030,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
@@ -1031,1 +1031,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <span>بدء مسار الاستيراد والفحص (Start Pipeline)</span>
@@ -1032,1 +1032,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+               </button>
@@ -1033,1 +1033,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+             </div>
@@ -1034,1 +1034,1 @@ src/components/importCenter/ImportCenterView.tsx
-       )}
+           </div>
@@ -1035,1 +1035,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         </div>
@@ -1036,1 +1036,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 8. MODAL: Raw Data Snapshot Viewer (Audit Retention) */}
+       )}
@@ -1037,1 +1037,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {showRawSnapshotModal && (
+ 
@@ -1038,1 +1038,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
+       {/* 8. MODAL: Raw Data Snapshot Viewer (Audit Retention) */}
@@ -1039,1 +1039,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
+       {showRawSnapshotModal && (
@@ -1040,1 +1040,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 shrink-0">
+         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
@@ -1041,1 +1041,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+           <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
@@ -1042,1 +1042,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
+             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 shrink-0">
@@ -1043,1 +1043,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <Database className="w-5 h-5" />
+               <div className="flex items-center gap-2">
@@ -1044,1 +1044,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
@@ -1045,1 +1045,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div>
+                   <Database className="w-5 h-5" />
@@ -1046,1 +1046,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <h4 className="text-base font-bold text-stone-900">
+                 </span>
@@ -1047,1 +1047,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     النسخة الأصلية للبيانات المستوردة (Raw Data Snapshot)
+                 <div>
@@ -1048,1 +1048,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </h4>
+                   <h4 className="text-base font-bold text-stone-900">
@@ -1049,1 +1049,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <p className="text-xs text-stone-500">
+                     النسخة الأصلية للبيانات المستوردة (Raw Data Snapshot)
@@ -1050,1 +1050,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     محفوظة بالكامل داخل Import Batch لأغراض التدقيق الرقابي والامتثال الحكومي.
+                   </h4>
@@ -1051,1 +1051,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </p>
+                   <p className="text-xs text-stone-500">
@@ -1052,1 +1052,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+                     محفوظة بالكامل داخل Import Batch لأغراض التدقيق الرقابي والامتثال الحكومي.
@@ -1053,1 +1053,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   </p>
@@ -1054,1 +1054,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button 
+                 </div>
@@ -1055,1 +1055,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowRawSnapshotModal(false)}
+               </div>
@@ -1056,1 +1056,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="text-stone-400 hover:text-stone-600 p-1"
+               <button 
@@ -1057,1 +1057,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 onClick={() => setShowRawSnapshotModal(false)}
@@ -1058,1 +1058,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <X className="w-5 h-5" />
+                 className="text-stone-400 hover:text-stone-600 p-1"
@@ -1059,1 +1059,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -1060,1 +1060,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <X className="w-5 h-5" />
@@ -1061,1 +1061,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </button>
@@ -1062,1 +1062,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex-1 overflow-auto border border-stone-200 rounded-xl">
+             </div>
@@ -1063,1 +1063,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <pre className="text-xs font-mono p-4 bg-stone-900 text-amber-300 dir-ltr text-left overflow-x-auto">
+ 
@@ -1064,1 +1064,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {JSON.stringify(activeBatch.originalRawData, null, 2)}
+             <div className="flex-1 overflow-auto border border-stone-200 rounded-xl">
@@ -1065,1 +1065,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </pre>
+               <pre className="text-xs font-mono p-4 bg-stone-900 text-amber-300 dir-ltr text-left overflow-x-auto">
@@ -1066,1 +1066,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 {JSON.stringify(activeBatch.originalRawData, null, 2)}
@@ -1067,1 +1067,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </pre>
@@ -1068,1 +1068,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 shrink-0">
+             </div>
@@ -1069,1 +1069,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <span className="text-xs text-stone-500">
+ 
@@ -1070,1 +1070,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 إجمالي السجلات الأصلية المؤرشفة: {activeBatch.originalRawData.length} سجل
+             <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 shrink-0">
@@ -1071,1 +1071,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </span>
+               <span className="text-xs text-stone-500">
@@ -1072,1 +1072,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+                 إجمالي السجلات الأصلية المؤرشفة: {activeBatch.originalRawData.length} سجل
@@ -1073,1 +1073,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => {
+               </span>
@@ -1074,1 +1074,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   const blob = new Blob([JSON.stringify(activeBatch.originalRawData, null, 2)], { type: 'application/json' });
+               <button
@@ -1075,1 +1075,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   const url = URL.createObjectURL(blob);
+                 onClick={() => {
@@ -1076,1 +1076,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   const a = document.createElement('a');
+                   const blob = new Blob([JSON.stringify(activeBatch.originalRawData, null, 2)], { type: 'application/json' });
@@ -1077,1 +1077,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   a.href = url;
+                   const url = URL.createObjectURL(blob);
@@ -1078,1 +1078,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   a.download = `raw_snapshot_${activeBatch.importBatchId}.json`;
+                   const a = document.createElement('a');
@@ -1079,1 +1079,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   a.click();
+                   a.href = url;
@@ -1080,1 +1080,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 }}
+                   a.download = `raw_snapshot_${activeBatch.importBatchId}.json`;
@@ -1081,1 +1081,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
+                   a.click();
@@ -1082,1 +1082,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 }}
@@ -1083,1 +1083,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <Download className="w-4 h-4" />
+                 className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
@@ -1084,1 +1084,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span>تحميل النسخة الأصلية (JSON)</span>
+               >
@@ -1085,1 +1085,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 <Download className="w-4 h-4" />
@@ -1086,1 +1086,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <span>تحميل النسخة الأصلية (JSON)</span>
@@ -1087,1 +1087,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+               </button>
@@ -1088,1 +1088,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+             </div>
@@ -1089,1 +1089,1 @@ src/components/importCenter/ImportCenterView.tsx
-       )}
+           </div>
@@ -1090,1 +1090,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         </div>
@@ -1091,1 +1091,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 9. MODAL: Audit Trail */}
+       )}
@@ -1092,1 +1092,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {showAuditTrailModal && (
+ 
@@ -1093,1 +1093,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
+       {/* 9. MODAL: Audit Trail */}
@@ -1094,1 +1094,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
+       {showAuditTrailModal && (
@@ -1095,1 +1095,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 shrink-0">
+         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
@@ -1096,1 +1096,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+           <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
@@ -1097,1 +1097,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
+             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 shrink-0">
@@ -1098,1 +1098,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <History className="w-5 h-5" />
+               <div className="flex items-center gap-2">
@@ -1099,1 +1099,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
@@ -1100,1 +1100,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div>
+                   <History className="w-5 h-5" />
@@ -1101,1 +1101,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <h4 className="text-base font-bold text-stone-900">
+                 </span>
@@ -1102,1 +1102,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     سجل التدقيق الرقابي للدفعة (Audit Trail Log)
+                 <div>
@@ -1103,1 +1103,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </h4>
+                   <h4 className="text-base font-bold text-stone-900">
@@ -1104,1 +1104,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <p className="text-xs text-stone-500">
+                     سجل التدقيق الرقابي للدفعة (Audit Trail Log)
@@ -1105,1 +1105,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     يوثق كل إجراء بشري، قرار تصحيحي، وتاريخ الاعتماد النهائي مع هوية المستخدم.
+                   </h4>
@@ -1106,1 +1106,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </p>
+                   <p className="text-xs text-stone-500">
@@ -1107,1 +1107,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+                     يوثق كل إجراء بشري، قرار تصحيحي، وتاريخ الاعتماد النهائي مع هوية المستخدم.
@@ -1108,1 +1108,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   </p>
@@ -1109,1 +1109,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button 
+                 </div>
@@ -1110,1 +1110,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowAuditTrailModal(false)}
+               </div>
@@ -1111,1 +1111,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="text-stone-400 hover:text-stone-600 p-1"
+               <button 
@@ -1112,1 +1112,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 onClick={() => setShowAuditTrailModal(false)}
@@ -1113,1 +1113,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <X className="w-5 h-5" />
+                 className="text-stone-400 hover:text-stone-600 p-1"
@@ -1114,1 +1114,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -1115,1 +1115,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <X className="w-5 h-5" />
@@ -1116,1 +1116,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </button>
@@ -1117,1 +1117,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex-1 overflow-auto space-y-3">
+             </div>
@@ -1118,1 +1118,1 @@ src/components/importCenter/ImportCenterView.tsx
-               {activeBatch.auditTrail.map((log, idx) => (
+ 
@@ -1119,1 +1119,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
+             <div className="flex-1 overflow-auto space-y-3">
@@ -1120,1 +1120,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <div className="flex items-center justify-between mb-1.5">
+               {activeBatch.auditTrail.map((log, idx) => (
@@ -1121,1 +1121,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span className="font-bold text-stone-900 font-mono">{log.actionType}</span>
+                 <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
@@ -1122,1 +1122,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span className="text-[11px] text-stone-500 font-mono">
+                   <div className="flex items-center justify-between mb-1.5">
@@ -1123,1 +1123,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       {new Date(log.timestamp).toLocaleString('ar-SA')}
+                     <span className="font-bold text-stone-900 font-mono">{log.actionType}</span>
@@ -1124,1 +1124,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </span>
+                     <span className="text-[11px] text-stone-500 font-mono">
@@ -1125,1 +1125,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </div>
+                       {new Date(log.timestamp).toLocaleString('ar-SA')}
@@ -1126,1 +1126,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <p className="text-stone-700 leading-relaxed">{log.detailsAr}</p>
+                     </span>
@@ -1127,1 +1127,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
+                   </div>
@@ -1128,1 +1128,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <span>المستخدم: {log.userName}</span>
+                   <p className="text-stone-700 leading-relaxed">{log.detailsAr}</p>
@@ -1129,1 +1129,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     {log.affectedRowNumber && <span>الصف المتأثر: #{log.affectedRowNumber}</span>}
+                   <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
@@ -1130,1 +1130,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   </div>
+                     <span>المستخدم: {log.userName}</span>
@@ -1131,1 +1131,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </div>
+                     {log.affectedRowNumber && <span>الصف المتأثر: #{log.affectedRowNumber}</span>}
@@ -1132,1 +1132,1 @@ src/components/importCenter/ImportCenterView.tsx
-               ))}
+                   </div>
@@ -1133,1 +1133,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 </div>
@@ -1134,1 +1134,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               ))}
@@ -1135,1 +1135,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex justify-end pt-4 mt-4 border-t border-stone-100 shrink-0">
+             </div>
@@ -1136,1 +1136,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+ 
@@ -1137,1 +1137,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowAuditTrailModal(false)}
+             <div className="flex justify-end pt-4 mt-4 border-t border-stone-100 shrink-0">
@@ -1138,1 +1138,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
+               <button
@@ -1139,1 +1139,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 onClick={() => setShowAuditTrailModal(false)}
@@ -1140,1 +1140,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 إغلاق
+                 className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
@@ -1141,1 +1141,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -1142,1 +1142,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 إغلاق
@@ -1143,1 +1143,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+               </button>
@@ -1144,1 +1144,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+             </div>
@@ -1145,1 +1145,1 @@ src/components/importCenter/ImportCenterView.tsx
-       )}
+           </div>
@@ -1146,1 +1146,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+         </div>
@@ -1147,1 +1147,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 10. MODAL: Warning Confirmation Dialog */}
+       )}
@@ -1148,1 +1148,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {showWarningConfirmModal && (
+ 
@@ -1149,1 +1149,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
+       {/* 10. MODAL: Warning Confirmation Dialog */}
@@ -1150,1 +1150,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
+       {showWarningConfirmModal && (
@@ -1151,1 +1151,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
+         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
@@ -1152,1 +1152,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
@@ -1153,1 +1153,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
+             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
@@ -1154,1 +1154,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <AlertTriangle className="w-5 h-5 text-amber-700" />
+               <div className="flex items-center gap-2">
@@ -1155,1 +1155,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                 <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
@@ -1156,1 +1156,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <h4 className="text-base font-bold text-stone-900">
+                   <AlertTriangle className="w-5 h-5 text-amber-700" />
@@ -1157,1 +1157,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   تأكيد اعتماد السجلات ذات التحذيرات (WARNING Confirmation)
+                 </span>
@@ -1158,1 +1158,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </h4>
+                 <h4 className="text-base font-bold text-stone-900">
@@ -1159,1 +1159,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   تأكيد اعتماد السجلات ذات التحذيرات (WARNING Confirmation)
@@ -1160,1 +1160,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button 
+                 </h4>
@@ -1161,1 +1161,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowWarningConfirmModal(false)}
+               </div>
@@ -1162,1 +1162,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="text-stone-400 hover:text-stone-600 p-1"
+               <button 
@@ -1163,1 +1163,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 onClick={() => setShowWarningConfirmModal(false)}
@@ -1164,1 +1164,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <X className="w-5 h-5" />
+                 className="text-stone-400 hover:text-stone-600 p-1"
@@ -1165,1 +1165,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -1166,1 +1166,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <X className="w-5 h-5" />
@@ -1167,1 +1167,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </button>
@@ -1168,1 +1168,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="space-y-4 text-xs text-stone-700">
+             </div>
@@ -1169,1 +1169,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
+ 
@@ -1170,1 +1170,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold block mb-1">تنبيه رقابي إلزامي:</span>
+             <div className="space-y-4 text-xs text-stone-700">
@@ -1171,1 +1171,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <p className="leading-relaxed">
+               <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
@@ -1172,1 +1172,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   توجد <strong>({activeBatch.warningCount})</strong> تحذيرات في هذه الدفعة. لائحة حوكمة البيانات تتطلب إقراراً وتأكيداً بشرياً صريحاً قبل إتمام الاعتماد (Commit).
+                 <span className="font-bold block mb-1">تنبيه رقابي إلزامي:</span>
@@ -1173,1 +1173,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </p>
+                 <p className="leading-relaxed">
@@ -1174,1 +1174,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   توجد <strong>({activeBatch.warningCount})</strong> تحذيرات في هذه الدفعة. لائحة حوكمة البيانات تتطلب إقراراً وتأكيداً بشرياً صريحاً قبل إتمام الاعتماد (Commit).
@@ -1175,1 +1175,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 </p>
@@ -1176,1 +1176,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+               </div>
@@ -1177,1 +1177,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <label className="block font-bold text-stone-800 mb-1.5">
+ 
@@ -1178,1 +1178,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   مبررات الاعتماد وملاحظات التدقيق (Audit Notes)
+               <div>
@@ -1179,1 +1179,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </label>
+                 <label className="block font-bold text-stone-800 mb-1.5">
@@ -1180,1 +1180,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <textarea
+                   مبررات الاعتماد وملاحظات التدقيق (Audit Notes)
@@ -1181,1 +1181,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   rows={3}
+                 </label>
@@ -1182,1 +1182,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   value={warningConfirmNotes}
+                 <textarea
@@ -1183,1 +1183,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   onChange={(e) => setWarningConfirmNotes(e.target.value)}
+                   rows={3}
@@ -1184,1 +1184,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   placeholder="اكتب سبب قبول هذه التحذيرات (مثال: تم التأكد من هوية السائق ورقياً، أو تم التنسيق مع مقاول النقل)..."
+                   value={warningConfirmNotes}
@@ -1185,1 +1185,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-medium"
+                   onChange={(e) => setWarningConfirmNotes(e.target.value)}
@@ -1186,1 +1186,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 />
+                   placeholder="اكتب سبب قبول هذه التحذيرات (مثال: تم التأكد من هوية السائق ورقياً، أو تم التنسيق مع مقاول النقل)..."
@@ -1187,1 +1187,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-medium"
@@ -1188,1 +1188,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 />
@@ -1189,1 +1189,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
+               </div>
@@ -1190,1 +1190,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span>المسؤول المعتمد: </span>
+ 
@@ -1191,1 +1191,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <strong className="text-stone-900">{currentUserName}</strong>
+               <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
@@ -1192,1 +1192,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span>المسؤول المعتمد: </span>
@@ -1193,1 +1193,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+                 <strong className="text-stone-900">{currentUserName}</strong>
@@ -1194,1 +1194,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </div>
@@ -1195,1 +1195,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
+             </div>
@@ -1196,1 +1196,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+ 
@@ -1197,1 +1197,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setShowWarningConfirmModal(false)}
+             <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
@@ -1198,1 +1198,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
+               <button
@@ -1199,1 +1199,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 onClick={() => setShowWarningConfirmModal(false)}
@@ -1200,1 +1200,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 إلغاء
+                 className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
@@ -1201,1 +1201,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+               >
@@ -1202,1 +1202,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+                 {t("shared.actions.cancel")}</button>
@@ -1203,1 +1203,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => handleCommitBatch(true)}
+               <button
@@ -1204,1 +1204,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
+                 onClick={() => handleCommitBatch(true)}
@@ -1205,1 +1205,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
@@ -1206,1 +1206,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <Check className="w-4 h-4" />
+               >
@@ -1207,1 +1207,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span>تأكيد واعتماد الدفعة نهائياً</span>
+                 <Check className="w-4 h-4" />
@@ -1208,1 +1208,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 <span>تأكيد واعتماد الدفعة نهائياً</span>
@@ -1209,1 +1209,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               </button>
@@ -1210,1 +1210,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+             </div>
@@ -1211,1 +1211,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+           </div>
@@ -1212,1 +1212,1 @@ src/components/importCenter/ImportCenterView.tsx
-       )}
+         </div>
@@ -1213,1 +1213,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       )}
@@ -1214,1 +1214,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 11. MODAL: Choose Master Record */}
+ 
@@ -1215,1 +1215,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {selectingMasterItem && (
+       {/* 11. MODAL: Choose Master Record */}
@@ -1216,1 +1216,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
+       {selectingMasterItem && (
@@ -1217,1 +1217,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
+         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
@@ -1218,1 +1218,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
+           <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
@@ -1219,1 +1219,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
@@ -1220,1 +1220,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
+               <div className="flex items-center gap-2">
@@ -1221,1 +1221,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <Database className="w-5 h-5" />
+                 <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
@@ -1222,1 +1222,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                   <Database className="w-5 h-5" />
@@ -1223,1 +1223,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <h4 className="text-base font-bold text-stone-900">
+                 </span>
@@ -1224,1 +1224,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   اختيار سجل معتمد (Choose Master Record)
+                 <h4 className="text-base font-bold text-stone-900">
@@ -1225,1 +1225,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </h4>
+                   اختيار سجل معتمد (Choose Master Record)
@@ -1226,1 +1226,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 </h4>
@@ -1227,1 +1227,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button 
+               </div>
@@ -1228,1 +1228,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setSelectingMasterItem(null)}
+               <button 
@@ -1229,1 +1229,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="text-stone-400 hover:text-stone-600 p-1"
+                 onClick={() => setSelectingMasterItem(null)}
@@ -1230,1 +1230,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className="text-stone-400 hover:text-stone-600 p-1"
@@ -1231,1 +1231,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <X className="w-5 h-5" />
+               >
@@ -1232,1 +1232,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 <X className="w-5 h-5" />
@@ -1233,1 +1233,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               </button>
@@ -1234,1 +1234,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             </div>
@@ -1235,1 +1235,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="space-y-3">
+ 
@@ -1236,1 +1236,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <p className="text-xs text-stone-600">
+             <div className="space-y-3">
@@ -1237,1 +1237,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 حدد الكيان المعتمد لربطه بالحقل <strong>[{selectingMasterItem.field}]</strong> في الصف #{selectingMasterItem.rowNumber}:
+               <p className="text-xs text-stone-600">
@@ -1238,1 +1238,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </p>
+                 حدد الكيان المعتمد لربطه بالحقل <strong>[{selectingMasterItem.field}]</strong> في الصف #{selectingMasterItem.rowNumber}:
@@ -1239,1 +1239,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </p>
@@ -1240,1 +1240,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="max-h-60 overflow-y-auto space-y-2">
+ 
@@ -1241,1 +1241,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {selectingMasterItem.fieldKey === 'carrier' && (
+               <div className="max-h-60 overflow-y-auto space-y-2">
@@ -1242,1 +1242,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   SAMPLE_QUALITY_CONTEXT.knownCarriers.map((c) => (
+                 {selectingMasterItem.fieldKey === 'carrier' && (
@@ -1243,1 +1243,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <button
+                   SAMPLE_QUALITY_CONTEXT.knownCarriers.map((c) => (
@@ -1244,1 +1244,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       key={c.carrierId}
+                     <button
@@ -1245,1 +1245,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       onClick={() => {
+                       key={c.carrierId}
@@ -1246,1 +1246,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
+                       onClick={() => {
@@ -1247,1 +1247,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterId: c.carrierId,
+                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
@@ -1248,1 +1248,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterValue: c.name,
+                           chosenMasterId: c.carrierId,
@@ -1249,1 +1249,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         });
+                           chosenMasterValue: c.name,
@@ -1250,1 +1250,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         setSelectingMasterItem(null);
+                         });
@@ -1251,1 +1251,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       }}
+                         setSelectingMasterItem(null);
@@ -1252,1 +1252,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
+                       }}
@@ -1253,1 +1253,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     >
+                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
@@ -1254,1 +1254,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="font-bold text-stone-900">{c.name}</div>
+                     >
@@ -1255,1 +1255,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
+                       <div className="font-bold text-stone-900">{c.name}</div>
@@ -1256,1 +1256,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         {c.carrierId} {SAMPLE_QUALITY_CONTEXT.authorizedCarrierIds.includes(c.carrierId) ? '✓ مصرح في المشروع' : '✗ غير مصرح'}
+                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
@@ -1257,1 +1257,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </div>
+                         {c.carrierId} {SAMPLE_QUALITY_CONTEXT.authorizedCarrierIds.includes(c.carrierId) ? '✓ مصرح في المشروع' : '✗ غير مصرح'}
@@ -1258,1 +1258,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </button>
+                       </div>
@@ -1259,1 +1259,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ))
+                     </button>
@@ -1260,1 +1260,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 )}
+                   ))
@@ -1261,1 +1261,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 )}
@@ -1262,1 +1262,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {selectingMasterItem.fieldKey === 'truck' && (
+ 
@@ -1263,1 +1263,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   SAMPLE_QUALITY_CONTEXT.knownTrucks.map((t) => (
+                 {selectingMasterItem.fieldKey === 'truck' && (
@@ -1264,1 +1264,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <button
+                   SAMPLE_QUALITY_CONTEXT.knownTrucks.map((t) => (
@@ -1265,1 +1265,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       key={t.truckId}
+                     <button
@@ -1266,1 +1266,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       onClick={() => {
+                       key={t.truckId}
@@ -1267,1 +1267,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
+                       onClick={() => {
@@ -1268,1 +1268,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterId: t.truckId,
+                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
@@ -1269,1 +1269,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterValue: t.plate,
+                           chosenMasterId: t.truckId,
@@ -1270,1 +1270,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         });
+                           chosenMasterValue: t.plate,
@@ -1271,1 +1271,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         setSelectingMasterItem(null);
+                         });
@@ -1272,1 +1272,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       }}
+                         setSelectingMasterItem(null);
@@ -1273,1 +1273,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
+                       }}
@@ -1274,1 +1274,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     >
+                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
@@ -1275,1 +1275,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="font-bold text-stone-900">{t.plate}</div>
+                     >
@@ -1276,1 +1276,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
+                       <div className="font-bold text-stone-900">{t.plate}</div>
@@ -1277,1 +1277,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         {t.truckId} | الناقل: {t.carrierId}
+                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
@@ -1278,1 +1278,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </div>
+                         {t.truckId} | الناقل: {t.carrierId}
@@ -1279,1 +1279,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </button>
+                       </div>
@@ -1280,1 +1280,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ))
+                     </button>
@@ -1281,1 +1281,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 )}
+                   ))
@@ -1282,1 +1282,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 )}
@@ -1283,1 +1283,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {selectingMasterItem.fieldKey === 'material' && (
+ 
@@ -1284,1 +1284,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   SAMPLE_QUALITY_CONTEXT.knownMaterials.map((m) => (
+                 {selectingMasterItem.fieldKey === 'material' && (
@@ -1285,1 +1285,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <button
+                   SAMPLE_QUALITY_CONTEXT.knownMaterials.map((m) => (
@@ -1286,1 +1286,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       key={m.materialId}
+                     <button
@@ -1287,1 +1287,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       onClick={() => {
+                       key={m.materialId}
@@ -1288,1 +1288,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
+                       onClick={() => {
@@ -1289,1 +1289,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterId: m.materialId,
+                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
@@ -1290,1 +1290,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterValue: m.name,
+                           chosenMasterId: m.materialId,
@@ -1291,1 +1291,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         });
+                           chosenMasterValue: m.name,
@@ -1292,1 +1292,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         setSelectingMasterItem(null);
+                         });
@@ -1293,1 +1293,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       }}
+                         setSelectingMasterItem(null);
@@ -1294,1 +1294,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
+                       }}
@@ -1295,1 +1295,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     >
+                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
@@ -1296,1 +1296,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="font-bold text-stone-900">{m.name}</div>
+                     >
@@ -1297,1 +1297,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
+                       <div className="font-bold text-stone-900">{m.name}</div>
@@ -1298,1 +1298,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         {m.code} {SAMPLE_QUALITY_CONTEXT.authorizedMaterialIds.includes(m.materialId) ? '✓ مصرح' : '✗ غير مصرح'}
+                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
@@ -1299,1 +1299,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </div>
+                         {m.code} {SAMPLE_QUALITY_CONTEXT.authorizedMaterialIds.includes(m.materialId) ? '✓ مصرح' : '✗ غير مصرح'}
@@ -1300,1 +1300,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </button>
+                       </div>
@@ -1301,1 +1301,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ))
+                     </button>
@@ -1302,1 +1302,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 )}
+                   ))
@@ -1303,1 +1303,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+                 )}
@@ -1304,1 +1304,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 {selectingMasterItem.fieldKey === 'driver' && (
+ 
@@ -1305,1 +1305,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   SAMPLE_QUALITY_CONTEXT.knownDrivers.map((d) => (
+                 {selectingMasterItem.fieldKey === 'driver' && (
@@ -1306,1 +1306,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     <button
+                   SAMPLE_QUALITY_CONTEXT.knownDrivers.map((d) => (
@@ -1307,1 +1307,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       key={d.driverId}
+                     <button
@@ -1308,1 +1308,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       onClick={() => {
+                       key={d.driverId}
@@ -1309,1 +1309,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
+                       onClick={() => {
@@ -1310,1 +1310,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterId: d.driverId,
+                         handleApplyAction(selectingMasterItem.id, 'CHOOSE_MASTER_RECORD', {
@@ -1311,1 +1311,1 @@ src/components/importCenter/ImportCenterView.tsx
-                           chosenMasterValue: d.name,
+                           chosenMasterId: d.driverId,
@@ -1312,1 +1312,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         });
+                           chosenMasterValue: d.name,
@@ -1313,1 +1313,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         setSelectingMasterItem(null);
+                         });
@@ -1314,1 +1314,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       }}
+                         setSelectingMasterItem(null);
@@ -1315,1 +1315,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
+                       }}
@@ -1316,1 +1316,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     >
+                       className="w-full text-right p-3 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-xs font-semibold block cursor-pointer"
@@ -1317,1 +1317,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="font-bold text-stone-900">{d.name}</div>
+                     >
@@ -1318,1 +1318,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
+                       <div className="font-bold text-stone-900">{d.name}</div>
@@ -1319,1 +1319,1 @@ src/components/importCenter/ImportCenterView.tsx
-                         {d.driverId} | كفالة: {d.carrierId}
+                       <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
@@ -1320,1 +1320,1 @@ src/components/importCenter/ImportCenterView.tsx
-                       </div>
+                         {d.driverId} | كفالة: {d.carrierId}
@@ -1321,1 +1321,1 @@ src/components/importCenter/ImportCenterView.tsx
-                     </button>
+                       </div>
@@ -1322,1 +1322,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   ))
+                     </button>
@@ -1323,1 +1323,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 )}
+                   ))
@@ -1324,1 +1324,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 )}
@@ -1325,1 +1325,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               </div>
@@ -1326,1 +1326,1 @@ src/components/importCenter/ImportCenterView.tsx
-           </div>
+             </div>
@@ -1327,1 +1327,1 @@ src/components/importCenter/ImportCenterView.tsx
-         </div>
+           </div>
@@ -1328,1 +1328,1 @@ src/components/importCenter/ImportCenterView.tsx
-       )}
+         </div>
@@ -1329,1 +1329,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+       )}
@@ -1330,1 +1330,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {/* 12. MODAL: Edit Manually */}
+ 
@@ -1331,1 +1331,1 @@ src/components/importCenter/ImportCenterView.tsx
-       {editingItem && (
+       {/* 12. MODAL: Edit Manually */}
@@ -1332,1 +1332,1 @@ src/components/importCenter/ImportCenterView.tsx
-         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
+       {editingItem && (
@@ -1333,1 +1333,1 @@ src/components/importCenter/ImportCenterView.tsx
-           <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
+         <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
@@ -1334,1 +1334,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
+           <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-150">
@@ -1335,1 +1335,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div className="flex items-center gap-2">
+             <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
@@ -1336,1 +1336,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="p-2 rounded-xl bg-sky-100 text-sky-900">
+               <div className="flex items-center gap-2">
@@ -1337,1 +1337,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   <Edit3 className="w-5 h-5" />
+                 <span className="p-2 rounded-xl bg-sky-100 text-sky-900">
@@ -1338,1 +1338,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </span>
+                   <Edit3 className="w-5 h-5" />
@@ -1339,1 +1339,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <h4 className="text-base font-bold text-stone-900">
+                 </span>
@@ -1340,1 +1340,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   تعديل القيمة يدوياً (Edit Manually)
+                 <h4 className="text-base font-bold text-stone-900">
@@ -1341,1 +1341,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </h4>
+                   تعديل القيمة يدوياً (Edit Manually)
@@ -1342,1 +1342,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 </h4>
@@ -1343,1 +1343,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button 
+               </div>
@@ -1344,1 +1344,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setEditingItem(null)}
+               <button 
@@ -1345,1 +1345,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="text-stone-400 hover:text-stone-600 p-1"
+                 onClick={() => setEditingItem(null)}
@@ -1346,1 +1346,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className="text-stone-400 hover:text-stone-600 p-1"
@@ -1347,1 +1347,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <X className="w-5 h-5" />
+               >
@@ -1348,1 +1348,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 <X className="w-5 h-5" />
@@ -1349,1 +1349,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               </button>
@@ -1350,1 +1350,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             </div>
@@ -1351,1 +1351,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="space-y-4 text-xs">
+ 
@@ -1352,1 +1352,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+             <div className="space-y-4 text-xs">
@@ -1353,1 +1353,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-stone-500 block mb-1">الحقل والصف:</span>
+               <div>
@@ -1354,1 +1354,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-bold text-stone-900">{editingItem.field} — الصف #{editingItem.rowNumber}</span>
+                 <span className="text-stone-500 block mb-1">الحقل والصف:</span>
@@ -1355,1 +1355,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="font-bold text-stone-900">{editingItem.field} — الصف #{editingItem.rowNumber}</span>
@@ -1356,1 +1356,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </div>
@@ -1357,1 +1357,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+ 
@@ -1358,1 +1358,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="text-stone-500 block mb-1">القيمة الأصلية:</span>
+               <div>
@@ -1359,1 +1359,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <span className="font-mono bg-stone-100 px-2 py-1 rounded block">{editingItem.originalValue}</span>
+                 <span className="text-stone-500 block mb-1">القيمة الأصلية:</span>
@@ -1360,1 +1360,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 <span className="font-mono bg-stone-100 px-2 py-1 rounded block">{editingItem.originalValue}</span>
@@ -1361,1 +1361,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+               </div>
@@ -1362,1 +1362,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <div>
+ 
@@ -1363,1 +1363,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <label className="block font-bold text-stone-700 mb-1">
+               <div>
@@ -1364,1 +1364,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   القيمة المعدلة الجديدة:
+                 <label className="block font-bold text-stone-700 mb-1">
@@ -1365,1 +1365,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 </label>
+                   القيمة المعدلة الجديدة:
@@ -1366,1 +1366,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 <input
+                 </label>
@@ -1367,1 +1367,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   type="text"
+                 <input
@@ -1368,1 +1368,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   value={manualInputValue}
+                   type="text"
@@ -1369,1 +1369,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   onChange={(e) => setManualInputValue(e.target.value)}
+                   value={manualInputValue}
@@ -1370,1 +1370,1 @@ src/components/importCenter/ImportCenterView.tsx
-                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
+                   onChange={(e) => setManualInputValue(e.target.value)}
@@ -1371,1 +1371,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 />
+                   className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
@@ -1372,1 +1372,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </div>
+                 />
@@ -1373,1 +1373,1 @@ src/components/importCenter/ImportCenterView.tsx
-             </div>
+               </div>
@@ -1374,1 +1374,1 @@ src/components/importCenter/ImportCenterView.tsx
- 
+             </div>
@@ -1375,1 +1375,1 @@ src/components/importCenter/ImportCenterView.tsx
-             <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
+ 
@@ -1376,1 +1376,1 @@ src/components/importCenter/ImportCenterView.tsx
-               <button
+             <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
@@ -1377,1 +1377,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 onClick={() => setEditingItem(null)}
+               <button
@@ -1378,1 +1378,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
+                 onClick={() => setEditingItem(null)}
@@ -1379,1 +1379,1 @@ src/components/importCenter/ImportCenterView.tsx
-               >
+                 className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
@@ -1380,1 +1380,1 @@ src/components/importCenter/ImportCenterView.tsx
-                 إلغاء
+               >
@@ -1381,1 +1381,1 @@ src/components/importCenter/ImportCenterView.tsx
-               </button>
+                 {t("shared.actions.cancel")}</button>
```

## File: `src/components/masterData/MasterDataView.tsx`

- **Pre-Migration Hash:** `58ae0640b7d22c8a`
- **Post-Migration Hash:** `ae47f9945f72fc3d`
- **Transformations Applied:** 5
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted:** `shared.actions.cancel`

### Unified Diff / Patch

```diff
@@ -1461,1 +1461,1 @@ src/components/masterData/MasterDataView.tsx
-                 إلغاء
+                 {t("shared.actions.cancel")}</button>
@@ -1462,1 +1462,1 @@ src/components/masterData/MasterDataView.tsx
-               </button>
+               <button
@@ -1463,1 +1463,1 @@ src/components/masterData/MasterDataView.tsx
-               <button
+                 onClick={handleConfirmSoftDelete}
@@ -1464,1 +1464,1 @@ src/components/masterData/MasterDataView.tsx
-                 onClick={handleConfirmSoftDelete}
+                 disabled={deleteModal.checking || !!deleteModal.success}
@@ -1465,1 +1465,1 @@ src/components/masterData/MasterDataView.tsx
-                 disabled={deleteModal.checking || !!deleteModal.success}
+                 className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
@@ -1466,1 +1466,1 @@ src/components/masterData/MasterDataView.tsx
-                 className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
+               >
@@ -1467,1 +1467,1 @@ src/components/masterData/MasterDataView.tsx
-               >
+                 {t("other.labels.txt_34897c")}</button>
@@ -1468,1 +1468,1 @@ src/components/masterData/MasterDataView.tsx
-                 {t("other.labels.txt_34897c")}</button>
+             </div>
@@ -1469,1 +1469,1 @@ src/components/masterData/MasterDataView.tsx
-             </div>
+           </div>
@@ -1470,1 +1470,1 @@ src/components/masterData/MasterDataView.tsx
-           </div>
+         </div>
@@ -1471,1 +1471,1 @@ src/components/masterData/MasterDataView.tsx
-         </div>
+       )}
@@ -1472,1 +1472,1 @@ src/components/masterData/MasterDataView.tsx
-       )}
+ 
@@ -1473,1 +1473,1 @@ src/components/masterData/MasterDataView.tsx
- 
+       {/* CREATE ENTITY MODAL */}
@@ -1474,1 +1474,1 @@ src/components/masterData/MasterDataView.tsx
-       {/* CREATE ENTITY MODAL */}
+       {createModal.isOpen && (
@@ -1475,1 +1475,1 @@ src/components/masterData/MasterDataView.tsx
-       {createModal.isOpen && (
+         <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
@@ -1476,1 +1476,1 @@ src/components/masterData/MasterDataView.tsx
-         <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
+           <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
@@ -1477,1 +1477,1 @@ src/components/masterData/MasterDataView.tsx
-           <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
+             <div className="p-4 bg-stone-900 text-amber-400 font-bold text-sm flex items-center justify-between">
@@ -1478,1 +1478,1 @@ src/components/masterData/MasterDataView.tsx
-             <div className="p-4 bg-stone-900 text-amber-400 font-bold text-sm flex items-center justify-between">
+               <span>
@@ -1479,1 +1479,1 @@ src/components/masterData/MasterDataView.tsx
-               <span>
+                 {createModal.entityType === 'CARRIER' && 'تسجيل ناقل جديد'}
@@ -1480,1 +1480,1 @@ src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'CARRIER' && 'تسجيل ناقل جديد'}
+                 {createModal.entityType === 'MATERIAL' && 'إضافة مادة جديدة'}
@@ -1481,1 +1481,1 @@ src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'MATERIAL' && 'إضافة مادة جديدة'}
+                 {createModal.entityType === 'TRUCK' && 'تسجيل شاحنة جديدة (Truck → Carrier)'}
@@ -1482,1 +1482,1 @@ src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'TRUCK' && 'تسجيل شاحنة جديدة (Truck → Carrier)'}
+                 {createModal.entityType === 'DRIVER' && 'تسجيل سائق جديد (Driver → Carrier)'}
@@ -1483,1 +1483,1 @@ src/components/masterData/MasterDataView.tsx
-                 {createModal.entityType === 'DRIVER' && 'تسجيل سائق جديد (Driver → Carrier)'}
+               </span>
@@ -1484,1 +1484,1 @@ src/components/masterData/MasterDataView.tsx
-               </span>
+               <button
@@ -1485,1 +1485,1 @@ src/components/masterData/MasterDataView.tsx
-               <button
+                 onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
@@ -1486,1 +1486,1 @@ src/components/masterData/MasterDataView.tsx
-                 onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
+                 className="text-stone-400 hover:text-white text-xs font-bold"
@@ -1487,1 +1487,1 @@ src/components/masterData/MasterDataView.tsx
-                 className="text-stone-400 hover:text-white text-xs font-bold"
+               >
@@ -1488,1 +1488,1 @@ src/components/masterData/MasterDataView.tsx
-               >
+                 ✕
@@ -1489,1 +1489,1 @@ src/components/masterData/MasterDataView.tsx
-                 ✕
+               </button>
@@ -1490,1 +1490,1 @@ src/components/masterData/MasterDataView.tsx
-               </button>
+             </div>
@@ -1491,1 +1491,1 @@ src/components/masterData/MasterDataView.tsx
-             </div>
+ 
@@ -1492,1 +1492,1 @@ src/components/masterData/MasterDataView.tsx
- 
+             {/* Carrier Form */}
@@ -1493,1 +1493,1 @@ src/components/masterData/MasterDataView.tsx
-             {/* Carrier Form */}
+             {createModal.entityType === 'CARRIER' && (
@@ -1494,1 +1494,1 @@ src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'CARRIER' && (
+               <form onSubmit={handleCreateCarrier} className="p-5 space-y-3.5 text-xs">
@@ -1495,1 +1495,1 @@ src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateCarrier} className="p-5 space-y-3.5 text-xs">
+                 <div>
@@ -1496,1 +1496,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <label className="block font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
@@ -1497,1 +1497,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
+                   <input
@@ -1498,1 +1498,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     type="text"
@@ -1499,1 +1499,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     required
@@ -1500,1 +1500,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     placeholder="CAR-ALSAFA"
@@ -1501,1 +1501,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="CAR-ALSAFA"
+                     value={newCarrier.carrierId}
@@ -1502,1 +1502,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newCarrier.carrierId}
+                     onChange={e => setNewCarrier({ ...newCarrier, carrierId: e.target.value })}
@@ -1503,1 +1503,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewCarrier({ ...newCarrier, carrierId: e.target.value })}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1504,1 +1504,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                   />
@@ -1505,1 +1505,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                 </div>
@@ -1506,1 +1506,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div>
@@ -1507,1 +1507,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <label className="block font-bold text-stone-700 mb-1">اسم شركة النقل بالعربية:</label>
@@ -1508,1 +1508,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم شركة النقل بالعربية:</label>
+                   <input
@@ -1509,1 +1509,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     type="text"
@@ -1510,1 +1510,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     required
@@ -1511,1 +1511,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     placeholder="شركة الصفا للنقل والتخليص"
@@ -1512,1 +1512,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="شركة الصفا للنقل والتخليص"
+                     value={newCarrier.name}
@@ -1513,1 +1513,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newCarrier.name}
+                     onChange={e => setNewCarrier({ ...newCarrier, name: e.target.value })}
@@ -1514,1 +1514,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewCarrier({ ...newCarrier, name: e.target.value })}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1515,1 +1515,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                   />
@@ -1516,1 +1516,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                   {newCarrier.name && (
@@ -1517,1 +1517,1 @@ src/components/masterData/MasterDataView.tsx
-                   {newCarrier.name && (
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1518,1 +1518,1 @@ src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                       الاسم المطبّع (normalizedName): {normalizeName(newCarrier.name)}
@@ -1519,1 +1519,1 @@ src/components/masterData/MasterDataView.tsx
-                       الاسم المطبّع (normalizedName): {normalizeName(newCarrier.name)}
+                     </div>
@@ -1520,1 +1520,1 @@ src/components/masterData/MasterDataView.tsx
-                     </div>
+                   )}
@@ -1521,1 +1521,1 @@ src/components/masterData/MasterDataView.tsx
-                   )}
+                 </div>
@@ -1522,1 +1522,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div>
@@ -1523,1 +1523,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_68f9e8")}</label>
@@ -1524,1 +1524,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_68f9e8")}</label>
+                   <input
@@ -1525,1 +1525,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     type="text"
@@ -1526,1 +1526,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     required
@@ -1527,1 +1527,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     pattern="[0-9]{10}"
@@ -1528,1 +1528,1 @@ src/components/masterData/MasterDataView.tsx
-                     pattern="[0-9]{10}"
+                     value={newCarrier.crNo}
@@ -1529,1 +1529,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newCarrier.crNo}
+                     onChange={e => setNewCarrier({ ...newCarrier, crNo: e.target.value })}
@@ -1530,1 +1530,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewCarrier({ ...newCarrier, crNo: e.target.value })}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1531,1 +1531,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                   />
@@ -1532,1 +1532,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                 </div>
@@ -1533,1 +1533,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1534,1 +1534,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                   <button
@@ -1535,1 +1535,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                     type="button"
@@ -1536,1 +1536,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="button"
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
@@ -1537,1 +1537,1 @@ src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1538,1 +1538,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                   >
@@ -1539,1 +1539,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                     {t("shared.actions.cancel")}</button>
@@ -1540,1 +1540,1 @@ src/components/masterData/MasterDataView.tsx
-                     إلغاء
+                   <button
@@ -1541,1 +1541,1 @@ src/components/masterData/MasterDataView.tsx
-                   </button>
+                     type="submit"
@@ -1542,1 +1542,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1543,1 +1543,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="submit"
+                   >
@@ -1544,1 +1544,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+                     {t("other.labels.saveCarrier")}</button>
@@ -1545,1 +1545,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                 </div>
@@ -1546,1 +1546,1 @@ src/components/masterData/MasterDataView.tsx
-                     {t("other.labels.saveCarrier")}</button>
+               </form>
@@ -1547,1 +1547,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+             )}
@@ -1548,1 +1548,1 @@ src/components/masterData/MasterDataView.tsx
-               </form>
+ 
@@ -1549,1 +1549,1 @@ src/components/masterData/MasterDataView.tsx
-             )}
+             {/* Material Form */}
@@ -1550,1 +1550,1 @@ src/components/masterData/MasterDataView.tsx
- 
+             {createModal.entityType === 'MATERIAL' && (
@@ -1551,1 +1551,1 @@ src/components/masterData/MasterDataView.tsx
-             {/* Material Form */}
+               <form onSubmit={handleCreateMaterial} className="p-5 space-y-3.5 text-xs">
@@ -1552,1 +1552,1 @@ src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'MATERIAL' && (
+                 <div>
@@ -1553,1 +1553,1 @@ src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateMaterial} className="p-5 space-y-3.5 text-xs">
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.material_9")}</label>
@@ -1554,1 +1554,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <input
@@ -1555,1 +1555,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.material_9")}</label>
+                     type="text"
@@ -1556,1 +1556,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     required
@@ -1557,1 +1557,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     placeholder="MAT-GRAVEL-01"
@@ -1558,1 +1558,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     value={newMaterial.materialId}
@@ -1559,1 +1559,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="MAT-GRAVEL-01"
+                     onChange={e => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
@@ -1560,1 +1560,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.materialId}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1561,1 +1561,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
+                   />
@@ -1562,1 +1562,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                 </div>
@@ -1563,1 +1563,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                 <div>
@@ -1564,1 +1564,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <label className="block font-bold text-stone-700 mb-1">رمز المادة (Code):</label>
@@ -1565,1 +1565,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <input
@@ -1566,1 +1566,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رمز المادة (Code):</label>
+                     type="text"
@@ -1567,1 +1567,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     required
@@ -1568,1 +1568,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     placeholder="GRV-01"
@@ -1569,1 +1569,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     value={newMaterial.code}
@@ -1570,1 +1570,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="GRV-01"
+                     onChange={e => setNewMaterial({ ...newMaterial, code: e.target.value })}
@@ -1571,1 +1571,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.code}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1572,1 +1572,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, code: e.target.value })}
+                   />
@@ -1573,1 +1573,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                 </div>
@@ -1574,1 +1574,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                 <div>
@@ -1575,1 +1575,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <label className="block font-bold text-stone-700 mb-1">اسم المادة بالعربية:</label>
@@ -1576,1 +1576,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <input
@@ -1577,1 +1577,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم المادة بالعربية:</label>
+                     type="text"
@@ -1578,1 +1578,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     required
@@ -1579,1 +1579,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     placeholder="حصى وادي طبيعي مقاس 2 بوصة"
@@ -1580,1 +1580,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     value={newMaterial.name}
@@ -1581,1 +1581,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="حصى وادي طبيعي مقاس 2 بوصة"
+                     onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
@@ -1582,1 +1582,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.name}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1583,1 +1583,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
+                   />
@@ -1584,1 +1584,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                   {newMaterial.name && (
@@ -1585,1 +1585,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1586,1 +1586,1 @@ src/components/masterData/MasterDataView.tsx
-                   {newMaterial.name && (
+                       الاسم المطبّع: {normalizeName(newMaterial.name)}
@@ -1587,1 +1587,1 @@ src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                     </div>
@@ -1588,1 +1588,1 @@ src/components/masterData/MasterDataView.tsx
-                       الاسم المطبّع: {normalizeName(newMaterial.name)}
+                   )}
@@ -1589,1 +1589,1 @@ src/components/masterData/MasterDataView.tsx
-                     </div>
+                 </div>
@@ -1590,1 +1590,1 @@ src/components/masterData/MasterDataView.tsx
-                   )}
+                 <div>
@@ -1591,1 +1591,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_109c7a")}</label>
@@ -1592,1 +1592,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                   <select
@@ -1593,1 +1593,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_109c7a")}</label>
+                     value={newMaterial.uom}
@@ -1594,1 +1594,1 @@ src/components/masterData/MasterDataView.tsx
-                   <select
+                     onChange={e => setNewMaterial({ ...newMaterial, uom: e.target.value as any })}
@@ -1595,1 +1595,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newMaterial.uom}
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1596,1 +1596,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewMaterial({ ...newMaterial, uom: e.target.value as any })}
+                   >
@@ -1597,1 +1597,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                     <option value="TON">طن (TON)</option>
@@ -1598,1 +1598,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                     <option value="M3">متر مكعب (M3)</option>
@@ -1599,1 +1599,1 @@ src/components/masterData/MasterDataView.tsx
-                     <option value="TON">طن (TON)</option>
+                     <option value="TRIP">{t("other.labels.txt_3fb9ae")}</option>
@@ -1600,1 +1600,1 @@ src/components/masterData/MasterDataView.tsx
-                     <option value="M3">متر مكعب (M3)</option>
+                   </select>
@@ -1601,1 +1601,1 @@ src/components/masterData/MasterDataView.tsx
-                     <option value="TRIP">{t("other.labels.txt_3fb9ae")}</option>
+                 </div>
@@ -1602,1 +1602,1 @@ src/components/masterData/MasterDataView.tsx
-                   </select>
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1603,1 +1603,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <button
@@ -1604,1 +1604,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                     type="button"
@@ -1605,1 +1605,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'MATERIAL' })}
@@ -1606,1 +1606,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="button"
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1607,1 +1607,1 @@ src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'MATERIAL' })}
+                   >
@@ -1608,1 +1608,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                     {t("shared.actions.cancel")}</button>
@@ -1609,1 +1609,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                   <button
@@ -1610,1 +1610,1 @@ src/components/masterData/MasterDataView.tsx
-                     إلغاء
+                     type="submit"
@@ -1611,1 +1611,1 @@ src/components/masterData/MasterDataView.tsx
-                   </button>
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1612,1 +1612,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                   >
@@ -1613,1 +1613,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="submit"
+                     {t("other.labels.saveMaterial")}</button>
@@ -1614,1 +1614,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+                 </div>
@@ -1615,1 +1615,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+               </form>
@@ -1616,1 +1616,1 @@ src/components/masterData/MasterDataView.tsx
-                     {t("other.labels.saveMaterial")}</button>
+             )}
@@ -1617,1 +1617,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+ 
@@ -1618,1 +1618,1 @@ src/components/masterData/MasterDataView.tsx
-               </form>
+             {/* Truck Form (Truck -> Carrier) */}
@@ -1619,1 +1619,1 @@ src/components/masterData/MasterDataView.tsx
-             )}
+             {createModal.entityType === 'TRUCK' && (
@@ -1620,1 +1620,1 @@ src/components/masterData/MasterDataView.tsx
- 
+               <form onSubmit={handleCreateTruck} className="p-5 space-y-3.5 text-xs">
@@ -1621,1 +1621,1 @@ src/components/masterData/MasterDataView.tsx
-             {/* Truck Form (Truck -> Carrier) */}
+                 <div>
@@ -1622,1 +1622,1 @@ src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'TRUCK' && (
+                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Truck → Carrier):</label>
@@ -1623,1 +1623,1 @@ src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateTruck} className="p-5 space-y-3.5 text-xs">
+                   <select
@@ -1624,1 +1624,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     required
@@ -1625,1 +1625,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Truck → Carrier):</label>
+                     value={newTruck.carrierId}
@@ -1626,1 +1626,1 @@ src/components/masterData/MasterDataView.tsx
-                   <select
+                     onChange={e => setNewTruck({ ...newTruck, carrierId: e.target.value })}
@@ -1627,1 +1627,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
@@ -1628,1 +1628,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newTruck.carrierId}
+                   >
@@ -1629,1 +1629,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewTruck({ ...newTruck, carrierId: e.target.value })}
+                     <option value="">{t("other.labels.carrier_10")}</option>
@@ -1630,1 +1630,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
+                     {overview?.allCarriers.map(c => (
@@ -1631,1 +1631,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                       <option key={c.carrierId} value={c.carrierId}>
@@ -1632,1 +1632,1 @@ src/components/masterData/MasterDataView.tsx
-                     <option value="">{t("other.labels.carrier_10")}</option>
+                         {c.name || c.companyNameAr} ({c.carrierId})
@@ -1633,1 +1633,1 @@ src/components/masterData/MasterDataView.tsx
-                     {overview?.allCarriers.map(c => (
+                       </option>
@@ -1634,1 +1634,1 @@ src/components/masterData/MasterDataView.tsx
-                       <option key={c.carrierId} value={c.carrierId}>
+                     ))}
@@ -1635,1 +1635,1 @@ src/components/masterData/MasterDataView.tsx
-                         {c.name || c.companyNameAr} ({c.carrierId})
+                   </select>
@@ -1636,1 +1636,1 @@ src/components/masterData/MasterDataView.tsx
-                       </option>
+                 </div>
@@ -1637,1 +1637,1 @@ src/components/masterData/MasterDataView.tsx
-                     ))}
+                 <div>
@@ -1638,1 +1638,1 @@ src/components/masterData/MasterDataView.tsx
-                   </select>
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.truck_5")}</label>
@@ -1639,1 +1639,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <input
@@ -1640,1 +1640,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     type="text"
@@ -1641,1 +1641,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.truck_5")}</label>
+                     required
@@ -1642,1 +1642,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     placeholder="TRK-4421"
@@ -1643,1 +1643,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     value={newTruck.truckId}
@@ -1644,1 +1644,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     onChange={e => setNewTruck({ ...newTruck, truckId: e.target.value })}
@@ -1645,1 +1645,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="TRK-4421"
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1646,1 +1646,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newTruck.truckId}
+                   />
@@ -1647,1 +1647,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewTruck({ ...newTruck, truckId: e.target.value })}
+                 </div>
@@ -1648,1 +1648,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                 <div>
@@ -1649,1 +1649,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                   <label className="block font-bold text-stone-700 mb-1">رقم اللوحة السعودية (مثال: أ ب ج 1234):</label>
@@ -1650,1 +1650,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                   <input
@@ -1651,1 +1651,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     type="text"
@@ -1652,1 +1652,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رقم اللوحة السعودية (مثال: أ ب ج 1234):</label>
+                     required
@@ -1653,1 +1653,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     placeholder="ط ك ل 4421"
@@ -1654,1 +1654,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     value={newTruck.plate}
@@ -1655,1 +1655,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     onChange={e => setNewTruck({ ...newTruck, plate: e.target.value })}
@@ -1656,1 +1656,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="ط ك ل 4421"
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1657,1 +1657,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newTruck.plate}
+                   />
@@ -1658,1 +1658,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewTruck({ ...newTruck, plate: e.target.value })}
+                   {newTruck.plate && (
@@ -1659,1 +1659,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1660,1 +1660,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                       اللوحة المطبّعة (normalizedPlate): {normalizePlate(newTruck.plate)}
@@ -1661,1 +1661,1 @@ src/components/masterData/MasterDataView.tsx
-                   {newTruck.plate && (
+                     </div>
@@ -1662,1 +1662,1 @@ src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                   )}
@@ -1663,1 +1663,1 @@ src/components/masterData/MasterDataView.tsx
-                       اللوحة المطبّعة (normalizedPlate): {normalizePlate(newTruck.plate)}
+                 </div>
@@ -1664,1 +1664,1 @@ src/components/masterData/MasterDataView.tsx
-                     </div>
+                 <div className="grid grid-cols-2 gap-2">
@@ -1665,1 +1665,1 @@ src/components/masterData/MasterDataView.tsx
-                   )}
+                   <div>
@@ -1666,1 +1666,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     <label className="block font-bold text-stone-700 mb-1">الوزن الفارغ (كجم):</label>
@@ -1667,1 +1667,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div className="grid grid-cols-2 gap-2">
+                     <input
@@ -1668,1 +1668,1 @@ src/components/masterData/MasterDataView.tsx
-                   <div>
+                       type="number"
@@ -1669,1 +1669,1 @@ src/components/masterData/MasterDataView.tsx
-                     <label className="block font-bold text-stone-700 mb-1">الوزن الفارغ (كجم):</label>
+                       required
@@ -1670,1 +1670,1 @@ src/components/masterData/MasterDataView.tsx
-                     <input
+                       value={newTruck.tareKg}
@@ -1671,1 +1671,1 @@ src/components/masterData/MasterDataView.tsx
-                       type="number"
+                       onChange={e => setNewTruck({ ...newTruck, tareKg: Number(e.target.value) })}
@@ -1672,1 +1672,1 @@ src/components/masterData/MasterDataView.tsx
-                       required
+                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1673,1 +1673,1 @@ src/components/masterData/MasterDataView.tsx
-                       value={newTruck.tareKg}
+                     />
@@ -1674,1 +1674,1 @@ src/components/masterData/MasterDataView.tsx
-                       onChange={e => setNewTruck({ ...newTruck, tareKg: Number(e.target.value) })}
+                   </div>
@@ -1675,1 +1675,1 @@ src/components/masterData/MasterDataView.tsx
-                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                   <div>
@@ -1676,1 +1676,1 @@ src/components/masterData/MasterDataView.tsx
-                     />
+                     <label className="block font-bold text-stone-700 mb-1">الوزن الإجمالي (كجم):</label>
@@ -1677,1 +1677,1 @@ src/components/masterData/MasterDataView.tsx
-                   </div>
+                     <input
@@ -1678,1 +1678,1 @@ src/components/masterData/MasterDataView.tsx
-                   <div>
+                       type="number"
@@ -1679,1 +1679,1 @@ src/components/masterData/MasterDataView.tsx
-                     <label className="block font-bold text-stone-700 mb-1">الوزن الإجمالي (كجم):</label>
+                       required
@@ -1680,1 +1680,1 @@ src/components/masterData/MasterDataView.tsx
-                     <input
+                       value={newTruck.grossKg}
@@ -1681,1 +1681,1 @@ src/components/masterData/MasterDataView.tsx
-                       type="number"
+                       onChange={e => setNewTruck({ ...newTruck, grossKg: Number(e.target.value) })}
@@ -1682,1 +1682,1 @@ src/components/masterData/MasterDataView.tsx
-                       required
+                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1683,1 +1683,1 @@ src/components/masterData/MasterDataView.tsx
-                       value={newTruck.grossKg}
+                     />
@@ -1684,1 +1684,1 @@ src/components/masterData/MasterDataView.tsx
-                       onChange={e => setNewTruck({ ...newTruck, grossKg: Number(e.target.value) })}
+                   </div>
@@ -1685,1 +1685,1 @@ src/components/masterData/MasterDataView.tsx
-                       className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                 </div>
@@ -1686,1 +1686,1 @@ src/components/masterData/MasterDataView.tsx
-                     />
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1687,1 +1687,1 @@ src/components/masterData/MasterDataView.tsx
-                   </div>
+                   <button
@@ -1688,1 +1688,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     type="button"
@@ -1689,1 +1689,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'TRUCK' })}
@@ -1690,1 +1690,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1691,1 +1691,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="button"
+                   >
@@ -1692,1 +1692,1 @@ src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'TRUCK' })}
+                     {t("shared.actions.cancel")}</button>
@@ -1693,1 +1693,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                   <button
@@ -1694,1 +1694,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                     type="submit"
@@ -1695,1 +1695,1 @@ src/components/masterData/MasterDataView.tsx
-                     إلغاء
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1696,1 +1696,1 @@ src/components/masterData/MasterDataView.tsx
-                   </button>
+                   >
@@ -1697,1 +1697,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                     {t("other.labels.saveTruck")}</button>
@@ -1698,1 +1698,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="submit"
+                 </div>
@@ -1699,1 +1699,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+               </form>
@@ -1700,1 +1700,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+             )}
@@ -1701,1 +1701,1 @@ src/components/masterData/MasterDataView.tsx
-                     {t("other.labels.saveTruck")}</button>
+ 
@@ -1702,1 +1702,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+             {/* Driver Form (Driver -> Carrier) */}
@@ -1703,1 +1703,1 @@ src/components/masterData/MasterDataView.tsx
-               </form>
+             {createModal.entityType === 'DRIVER' && (
@@ -1704,1 +1704,1 @@ src/components/masterData/MasterDataView.tsx
-             )}
+               <form onSubmit={handleCreateDriver} className="p-5 space-y-3.5 text-xs">
@@ -1705,1 +1705,1 @@ src/components/masterData/MasterDataView.tsx
- 
+                 <div>
@@ -1706,1 +1706,1 @@ src/components/masterData/MasterDataView.tsx
-             {/* Driver Form (Driver -> Carrier) */}
+                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Driver → Carrier):</label>
@@ -1707,1 +1707,1 @@ src/components/masterData/MasterDataView.tsx
-             {createModal.entityType === 'DRIVER' && (
+                   <select
@@ -1708,1 +1708,1 @@ src/components/masterData/MasterDataView.tsx
-               <form onSubmit={handleCreateDriver} className="p-5 space-y-3.5 text-xs">
+                     required
@@ -1709,1 +1709,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     value={newDriver.carrierId}
@@ -1710,1 +1710,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Driver → Carrier):</label>
+                     onChange={e => setNewDriver({ ...newDriver, carrierId: e.target.value })}
@@ -1711,1 +1711,1 @@ src/components/masterData/MasterDataView.tsx
-                   <select
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
@@ -1712,1 +1712,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                   >
@@ -1713,1 +1713,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newDriver.carrierId}
+                     <option value="">{t("other.labels.carrier_10")}</option>
@@ -1714,1 +1714,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, carrierId: e.target.value })}
+                     {overview?.allCarriers.map(c => (
@@ -1715,1 +1715,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
+                       <option key={c.carrierId} value={c.carrierId}>
@@ -1716,1 +1716,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                         {c.name || c.companyNameAr} ({c.carrierId})
@@ -1717,1 +1717,1 @@ src/components/masterData/MasterDataView.tsx
-                     <option value="">{t("other.labels.carrier_10")}</option>
+                       </option>
@@ -1718,1 +1718,1 @@ src/components/masterData/MasterDataView.tsx
-                     {overview?.allCarriers.map(c => (
+                     ))}
@@ -1719,1 +1719,1 @@ src/components/masterData/MasterDataView.tsx
-                       <option key={c.carrierId} value={c.carrierId}>
+                   </select>
@@ -1720,1 +1720,1 @@ src/components/masterData/MasterDataView.tsx
-                         {c.name || c.companyNameAr} ({c.carrierId})
+                 </div>
@@ -1721,1 +1721,1 @@ src/components/masterData/MasterDataView.tsx
-                       </option>
+                 <div>
@@ -1722,1 +1722,1 @@ src/components/masterData/MasterDataView.tsx
-                     ))}
+                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.driver_6")}</label>
@@ -1723,1 +1723,1 @@ src/components/masterData/MasterDataView.tsx
-                   </select>
+                   <input
@@ -1724,1 +1724,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     type="text"
@@ -1725,1 +1725,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     required
@@ -1726,1 +1726,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">{t("other.labels.driver_6")}</label>
+                     placeholder="DRV-303"
@@ -1727,1 +1727,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     value={newDriver.driverId}
@@ -1728,1 +1728,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     onChange={e => setNewDriver({ ...newDriver, driverId: e.target.value })}
@@ -1729,1 +1729,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1730,1 +1730,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="DRV-303"
+                   />
@@ -1731,1 +1731,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newDriver.driverId}
+                 </div>
@@ -1732,1 +1732,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, driverId: e.target.value })}
+                 <div>
@@ -1733,1 +1733,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                   <label className="block font-bold text-stone-700 mb-1">اسم السائق الثلاثي بالعربية:</label>
@@ -1734,1 +1734,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                   <input
@@ -1735,1 +1735,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     type="text"
@@ -1736,1 +1736,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     required
@@ -1737,1 +1737,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">اسم السائق الثلاثي بالعربية:</label>
+                     placeholder="سلطان عبد الرحمن الدوسري"
@@ -1738,1 +1738,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     value={newDriver.name}
@@ -1739,1 +1739,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
@@ -1740,1 +1740,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
@@ -1741,1 +1741,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="سلطان عبد الرحمن الدوسري"
+                   />
@@ -1742,1 +1742,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newDriver.name}
+                   {newDriver.name && (
@@ -1743,1 +1743,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1744,1 +1744,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
+                       الاسم المطبّع (normalizedName): {normalizeName(newDriver.name)}
@@ -1745,1 +1745,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                     </div>
@@ -1746,1 +1746,1 @@ src/components/masterData/MasterDataView.tsx
-                   {newDriver.name && (
+                   )}
@@ -1747,1 +1747,1 @@ src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                 </div>
@@ -1748,1 +1748,1 @@ src/components/masterData/MasterDataView.tsx
-                       الاسم المطبّع (normalizedName): {normalizeName(newDriver.name)}
+                 <div>
@@ -1749,1 +1749,1 @@ src/components/masterData/MasterDataView.tsx
-                     </div>
+                   <label className="block font-bold text-stone-700 mb-1">رقم الهوية الوطنية أو الإقامة (10 أرقام):</label>
@@ -1750,1 +1750,1 @@ src/components/masterData/MasterDataView.tsx
-                   )}
+                   <input
@@ -1751,1 +1751,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     type="text"
@@ -1752,1 +1752,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     required
@@ -1753,1 +1753,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رقم الهوية الوطنية أو الإقامة (10 أرقام):</label>
+                     pattern="[1-2][0-9]{9}"
@@ -1754,1 +1754,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     placeholder="1076543210"
@@ -1755,1 +1755,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     value={newDriver.idNumber}
@@ -1756,1 +1756,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     onChange={e => setNewDriver({ ...newDriver, idNumber: e.target.value })}
@@ -1757,1 +1757,1 @@ src/components/masterData/MasterDataView.tsx
-                     pattern="[1-2][0-9]{9}"
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1758,1 +1758,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="1076543210"
+                   />
@@ -1759,1 +1759,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newDriver.idNumber}
+                 </div>
@@ -1760,1 +1760,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, idNumber: e.target.value })}
+                 <div>
@@ -1761,1 +1761,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                   <label className="block font-bold text-stone-700 mb-1">رقم الجوال السعودي (05xxxxxxxx):</label>
@@ -1762,1 +1762,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                   <input
@@ -1763,1 +1763,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     type="text"
@@ -1764,1 +1764,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div>
+                     required
@@ -1765,1 +1765,1 @@ src/components/masterData/MasterDataView.tsx
-                   <label className="block font-bold text-stone-700 mb-1">رقم الجوال السعودي (05xxxxxxxx):</label>
+                     placeholder="0559876543"
@@ -1766,1 +1766,1 @@ src/components/masterData/MasterDataView.tsx
-                   <input
+                     value={newDriver.phone}
@@ -1767,1 +1767,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="text"
+                     onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
@@ -1768,1 +1768,1 @@ src/components/masterData/MasterDataView.tsx
-                     required
+                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
@@ -1769,1 +1769,1 @@ src/components/masterData/MasterDataView.tsx
-                     placeholder="0559876543"
+                   />
@@ -1770,1 +1770,1 @@ src/components/masterData/MasterDataView.tsx
-                     value={newDriver.phone}
+                   {newDriver.phone && (
@@ -1771,1 +1771,1 @@ src/components/masterData/MasterDataView.tsx
-                     onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
+                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
@@ -1772,1 +1772,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
+                       الجوال المطبّع: {normalizePhone(newDriver.phone)}
@@ -1773,1 +1773,1 @@ src/components/masterData/MasterDataView.tsx
-                   />
+                     </div>
@@ -1774,1 +1774,1 @@ src/components/masterData/MasterDataView.tsx
-                   {newDriver.phone && (
+                   )}
@@ -1775,1 +1775,1 @@ src/components/masterData/MasterDataView.tsx
-                     <div className="text-[11px] text-stone-500 mt-1 font-mono">
+                 </div>
@@ -1776,1 +1776,1 @@ src/components/masterData/MasterDataView.tsx
-                       الجوال المطبّع: {normalizePhone(newDriver.phone)}
+                 <div className="pt-2 flex justify-end gap-2">
@@ -1777,1 +1777,1 @@ src/components/masterData/MasterDataView.tsx
-                     </div>
+                   <button
@@ -1778,1 +1778,1 @@ src/components/masterData/MasterDataView.tsx
-                   )}
+                     type="button"
@@ -1779,1 +1779,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+                     onClick={() => setCreateModal({ isOpen: false, entityType: 'DRIVER' })}
@@ -1780,1 +1780,1 @@ src/components/masterData/MasterDataView.tsx
-                 <div className="pt-2 flex justify-end gap-2">
+                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
@@ -1781,1 +1781,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                   >
@@ -1782,1 +1782,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="button"
+                     {t("shared.actions.cancel")}</button>
@@ -1783,1 +1783,1 @@ src/components/masterData/MasterDataView.tsx
-                     onClick={() => setCreateModal({ isOpen: false, entityType: 'DRIVER' })}
+                   <button
@@ -1784,1 +1784,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
+                     type="submit"
@@ -1785,1 +1785,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
@@ -1786,1 +1786,1 @@ src/components/masterData/MasterDataView.tsx
-                     إلغاء
+                   >
@@ -1787,1 +1787,1 @@ src/components/masterData/MasterDataView.tsx
-                   </button>
+                     {t("other.labels.saveDriver")}</button>
@@ -1788,1 +1788,1 @@ src/components/masterData/MasterDataView.tsx
-                   <button
+                 </div>
@@ -1789,1 +1789,1 @@ src/components/masterData/MasterDataView.tsx
-                     type="submit"
+               </form>
@@ -1790,1 +1790,1 @@ src/components/masterData/MasterDataView.tsx
-                     className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
+             )}
@@ -1791,1 +1791,1 @@ src/components/masterData/MasterDataView.tsx
-                   >
+           </div>
@@ -1792,1 +1792,1 @@ src/components/masterData/MasterDataView.tsx
-                     {t("other.labels.saveDriver")}</button>
+         </div>
@@ -1793,1 +1793,1 @@ src/components/masterData/MasterDataView.tsx
-                 </div>
+       )}
@@ -1794,1 +1794,1 @@ src/components/masterData/MasterDataView.tsx
-               </form>
+     </div>
@@ -1795,1 +1795,1 @@ src/components/masterData/MasterDataView.tsx
-             )}
+   );
@@ -1796,1 +1796,1 @@ src/components/masterData/MasterDataView.tsx
-           </div>
+ };
@@ -1797,1 +1797,1 @@ src/components/masterData/MasterDataView.tsx
-         </div>
+ 
@@ -1798,1 +1798,1 @@ src/components/masterData/MasterDataView.tsx
-       )}
+ 
@@ -1799,1 +1799,1 @@ src/components/masterData/MasterDataView.tsx
-     </div>
+ 
@@ -1800,1 +1800,1 @@ src/components/masterData/MasterDataView.tsx
-   );
+ 
@@ -1801,1 +1801,1 @@ src/components/masterData/MasterDataView.tsx
- };
+ 
```

## File: `src/components/pricing/PricingEngineView.tsx`

- **Pre-Migration Hash:** `1e51dad12ffa494a`
- **Post-Migration Hash:** `d10bedcc740b9b70`
- **Transformations Applied:** 2
- **Validation Status:** `VALIDATED_AND_APPLIED`
- **Keys Inserted:** `shared.actions.cancel`

### Unified Diff / Patch

```diff
@@ -30,1 +30,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+ import { useI18n } from '../../i18n';
@@ -31,1 +31,1 @@ src/components/pricing/PricingEngineView.tsx
- export const PricingEngineView: React.FC = () => {
+ 
@@ -32,1 +32,1 @@ src/components/pricing/PricingEngineView.tsx
-   // --- Active Tab ---
+ 
@@ -33,1 +33,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'RULES' | 'TESTS'>('SIMULATOR');
+ export const PricingEngineView: React.FC = () => {
@@ -34,1 +34,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   const { t } = useI18n();
@@ -35,1 +35,1 @@ src/components/pricing/PricingEngineView.tsx
-   // --- Test Suite State ---
+   // --- Active Tab ---
@@ -36,1 +36,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [testResults, setTestResults] = useState<TestCaseResult[]>(() => runPricingEngineTests().results);
+   const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'RULES' | 'TESTS'>('SIMULATOR');
@@ -37,1 +37,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [isRunningTests, setIsRunningTests] = useState(false);
+ 
@@ -38,1 +38,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [filterCategory, setFilterCategory] = useState<string>('ALL');
+   // --- Test Suite State ---
@@ -39,1 +39,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [testSearch, setTestSearch] = useState<string>('');
+   const [testResults, setTestResults] = useState<TestCaseResult[]>(() => runPricingEngineTests().results);
@@ -40,1 +40,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   const [isRunningTests, setIsRunningTests] = useState(false);
@@ -41,1 +41,1 @@ src/components/pricing/PricingEngineView.tsx
-   // --- Interactive Playground State ---
+   const [filterCategory, setFilterCategory] = useState<string>('ALL');
@@ -42,1 +42,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [selectedCarrier, setSelectedCarrier] = useState<string>('CARRIER-B');
+   const [testSearch, setTestSearch] = useState<string>('');
@@ -43,1 +43,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [selectedMaterial, setSelectedMaterial] = useState<string>('MAT-SUBBASE');
+ 
@@ -44,1 +44,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [tripDate, setTripDate] = useState<string>('2026-09-09');
+   // --- Interactive Playground State ---
@@ -45,1 +45,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [netWeightTon, setNetWeightTon] = useState<number>(31.75);
+   const [selectedCarrier, setSelectedCarrier] = useState<string>('CARRIER-B');
@@ -46,1 +46,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [simulateClientTamper, setSimulateClientTamper] = useState<boolean>(false);
+   const [selectedMaterial, setSelectedMaterial] = useState<string>('MAT-SUBBASE');
@@ -47,1 +47,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [tamperedAmount, setTamperedAmount] = useState<number>(10.0);
+   const [tripDate, setTripDate] = useState<string>('2026-09-09');
@@ -48,1 +48,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   const [netWeightTon, setNetWeightTon] = useState<number>(31.75);
@@ -49,1 +49,1 @@ src/components/pricing/PricingEngineView.tsx
-   // --- Contractual Rules State (with COW Versioning) ---
+   const [simulateClientTamper, setSimulateClientTamper] = useState<boolean>(false);
@@ -50,1 +50,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [rules, setRules] = useState<PricingRule[]>([
+   const [tamperedAmount, setTamperedAmount] = useState<number>(10.0);
@@ -51,1 +51,1 @@ src/components/pricing/PricingEngineView.tsx
-     {
+ 
@@ -52,1 +52,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: 'PR-CARRIER-A-TRIP-v1',
+   // --- Contractual Rules State (with COW Versioning) ---
@@ -53,1 +53,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+   const [rules, setRules] = useState<PricingRule[]>([
@@ -54,1 +54,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: 'CARRIER-A',
+     {
@@ -55,1 +55,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: null,
+       pricingRuleId: 'PR-CARRIER-A-TRIP-v1',
@@ -56,1 +56,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: 'PER_TRIP',
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -57,1 +57,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: 120,
+       carrierId: 'CARRIER-A',
@@ -58,1 +58,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: null,
@@ -59,1 +59,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: '2026-01-01',
+       pricingType: 'PER_TRIP',
@@ -60,1 +60,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: '2026-12-31',
+       rate: 120,
@@ -61,1 +61,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'ACTIVE',
+       currency: 'SAR',
@@ -62,1 +62,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: 1,
+       effectiveFrom: '2026-01-01',
@@ -63,1 +63,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: '2026-01-01T08:00:00Z',
+       effectiveTo: '2026-12-31',
@@ -64,1 +64,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdBy: 'USR-ADMIN',
+       status: 'ACTIVE',
@@ -65,1 +65,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: 'تسعيرة مقطوعة بالرد الواحد لجميع المواد داخل المشروع',
+       version: 1,
@@ -66,1 +66,1 @@ src/components/pricing/PricingEngineView.tsx
-     },
+       createdAt: '2026-01-01T08:00:00Z',
@@ -67,1 +67,1 @@ src/components/pricing/PricingEngineView.tsx
-     {
+       createdBy: 'USR-ADMIN',
@@ -68,1 +68,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: 'PR-CARRIER-B-TON-GEN-v1',
+       notes: 'تسعيرة مقطوعة بالرد الواحد لجميع المواد داخل المشروع',
@@ -69,1 +69,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+     },
@@ -70,1 +70,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: 'CARRIER-B',
+     {
@@ -71,1 +71,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: null,
+       pricingRuleId: 'PR-CARRIER-B-TON-GEN-v1',
@@ -72,1 +72,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: 'PER_TON',
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -73,1 +73,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: 8.5,
+       carrierId: 'CARRIER-B',
@@ -74,1 +74,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: null,
@@ -75,1 +75,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: '2026-01-01',
+       pricingType: 'PER_TON',
@@ -76,1 +76,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: '2026-12-31',
+       rate: 8.5,
@@ -77,1 +77,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'ACTIVE',
+       currency: 'SAR',
@@ -78,1 +78,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: 1,
+       effectiveFrom: '2026-01-01',
@@ -79,1 +79,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: '2026-01-01T08:00:00Z',
+       effectiveTo: '2026-12-31',
@@ -80,1 +80,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdBy: 'USR-ADMIN',
+       status: 'ACTIVE',
@@ -81,1 +81,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: 'تسعيرة عامة للناقل ب للطن الصافي لكافة المواد',
+       version: 1,
@@ -82,1 +82,1 @@ src/components/pricing/PricingEngineView.tsx
-     },
+       createdAt: '2026-01-01T08:00:00Z',
@@ -83,1 +83,1 @@ src/components/pricing/PricingEngineView.tsx
-     {
+       createdBy: 'USR-ADMIN',
@@ -84,1 +84,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: 'PR-CARRIER-B-TON-SUBBASE-v1',
+       notes: 'تسعيرة عامة للناقل ب للطن الصافي لكافة المواد',
@@ -85,1 +85,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+     },
@@ -86,1 +86,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: 'CARRIER-B',
+     {
@@ -87,1 +87,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: 'MAT-SUBBASE',
+       pricingRuleId: 'PR-CARRIER-B-TON-SUBBASE-v1',
@@ -88,1 +88,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: 'PER_TON',
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -89,1 +89,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: 10.0,
+       carrierId: 'CARRIER-B',
@@ -90,1 +90,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: 'MAT-SUBBASE',
@@ -91,1 +91,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: '2026-01-01',
+       pricingType: 'PER_TON',
@@ -92,1 +92,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: '2026-12-31',
+       rate: 10.0,
@@ -93,1 +93,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'ACTIVE',
+       currency: 'SAR',
@@ -94,1 +94,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: 1,
+       effectiveFrom: '2026-01-01',
@@ -95,1 +95,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: '2026-01-01T08:00:00Z',
+       effectiveTo: '2026-12-31',
@@ -96,1 +96,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdBy: 'USR-ADMIN',
+       status: 'ACTIVE',
@@ -97,1 +97,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: 'تسعيرة مخصصة لمادة طبقة الأساس (Sub-base)',
+       version: 1,
@@ -98,1 +98,1 @@ src/components/pricing/PricingEngineView.tsx
-     },
+       createdAt: '2026-01-01T08:00:00Z',
@@ -99,1 +99,1 @@ src/components/pricing/PricingEngineView.tsx
-     {
+       createdBy: 'USR-ADMIN',
@@ -100,1 +100,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: 'PR-CARRIER-C-TON-v1',
+       notes: 'تسعيرة مخصصة لمادة طبقة الأساس (Sub-base)',
@@ -101,1 +101,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+     },
@@ -102,1 +102,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: 'CARRIER-C',
+     {
@@ -103,1 +103,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: null,
+       pricingRuleId: 'PR-CARRIER-C-TON-v1',
@@ -104,1 +104,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: 'PER_TON',
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -105,1 +105,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: 7.75,
+       carrierId: 'CARRIER-C',
@@ -106,1 +106,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: null,
@@ -107,1 +107,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: '2026-06-01',
+       pricingType: 'PER_TON',
@@ -108,1 +108,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: '2026-12-31',
+       rate: 7.75,
@@ -109,1 +109,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'ACTIVE',
+       currency: 'SAR',
@@ -110,1 +110,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: 1,
+       effectiveFrom: '2026-06-01',
@@ -111,1 +111,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: '2026-06-01T08:00:00Z',
+       effectiveTo: '2026-12-31',
@@ -112,1 +112,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdBy: 'USR-ADMIN',
+       status: 'ACTIVE',
@@ -113,1 +113,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: 'تسعيرة مخفضة خاصة بالكميات الكبيرة في الربع الثالث',
+       version: 1,
@@ -114,1 +114,1 @@ src/components/pricing/PricingEngineView.tsx
-     },
+       createdAt: '2026-06-01T08:00:00Z',
@@ -115,1 +115,1 @@ src/components/pricing/PricingEngineView.tsx
-     {
+       createdBy: 'USR-ADMIN',
@@ -116,1 +116,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: 'PR-CARRIER-D-EXPIRED-v1',
+       notes: 'تسعيرة مخفضة خاصة بالكميات الكبيرة في الربع الثالث',
@@ -117,1 +117,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+     },
@@ -118,1 +118,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: 'CARRIER-D',
+     {
@@ -119,1 +119,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: null,
+       pricingRuleId: 'PR-CARRIER-D-EXPIRED-v1',
@@ -120,1 +120,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: 'PER_TRIP',
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -121,1 +121,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: 110,
+       carrierId: 'CARRIER-D',
@@ -122,1 +122,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: null,
@@ -123,1 +123,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: '2025-01-01',
+       pricingType: 'PER_TRIP',
@@ -124,1 +124,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: '2025-12-31',
+       rate: 110,
@@ -125,1 +125,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'INACTIVE',
+       currency: 'SAR',
@@ -126,1 +126,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: 1,
+       effectiveFrom: '2025-01-01',
@@ -127,1 +127,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: '2025-01-01T08:00:00Z',
+       effectiveTo: '2025-12-31',
@@ -128,1 +128,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdBy: 'USR-ADMIN',
+       status: 'INACTIVE',
@@ -129,1 +129,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: 'عقد منتهي الصلاحية بتاريخ 31 ديسمبر 2025',
+       version: 1,
@@ -130,1 +130,1 @@ src/components/pricing/PricingEngineView.tsx
-     },
+       createdAt: '2025-01-01T08:00:00Z',
@@ -131,1 +131,1 @@ src/components/pricing/PricingEngineView.tsx
-   ]);
+       createdBy: 'USR-ADMIN',
@@ -132,1 +132,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       notes: 'عقد منتهي الصلاحية بتاريخ 31 ديسمبر 2025',
@@ -133,1 +133,1 @@ src/components/pricing/PricingEngineView.tsx
-   // Modal / Form state for new rule
+     },
@@ -134,1 +134,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [showAddModal, setShowAddModal] = useState(false);
+   ]);
@@ -135,1 +135,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [newCarrierId, setNewCarrierId] = useState('CARRIER-NEW');
+ 
@@ -136,1 +136,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [newMaterialId, setNewMaterialId] = useState('');
+   // Modal / Form state for new rule
@@ -137,1 +137,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [newPricingType, setNewPricingType] = useState<'PER_TRIP' | 'PER_TON'>('PER_TON');
+   const [showAddModal, setShowAddModal] = useState(false);
@@ -138,1 +138,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [newRate, setNewRate] = useState(9.5);
+   const [newCarrierId, setNewCarrierId] = useState('CARRIER-NEW');
@@ -139,1 +139,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [newEffectiveFrom, setNewEffectiveFrom] = useState('2026-09-01');
+   const [newMaterialId, setNewMaterialId] = useState('');
@@ -140,1 +140,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [newEffectiveTo, setNewEffectiveTo] = useState('2026-12-31');
+   const [newPricingType, setNewPricingType] = useState<'PER_TRIP' | 'PER_TON'>('PER_TON');
@@ -141,1 +141,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [formError, setFormError] = useState<string | null>(null);
+   const [newRate, setNewRate] = useState(9.5);
@@ -142,1 +142,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   const [newEffectiveFrom, setNewEffectiveFrom] = useState('2026-09-01');
@@ -143,1 +143,1 @@ src/components/pricing/PricingEngineView.tsx
-   // COW Versioning Modal state
+   const [newEffectiveTo, setNewEffectiveTo] = useState('2026-12-31');
@@ -144,1 +144,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [versioningRule, setVersioningRule] = useState<PricingRule | null>(null);
+   const [formError, setFormError] = useState<string | null>(null);
@@ -145,1 +145,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [updatedRate, setUpdatedRate] = useState<number>(11.0);
+ 
@@ -146,1 +146,1 @@ src/components/pricing/PricingEngineView.tsx
-   const [versionReason, setVersionReason] = useState<string>('تحديث تعاقدي لأسعار الوقود والتضخم');
+   // COW Versioning Modal state
@@ -147,1 +147,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   const [versioningRule, setVersioningRule] = useState<PricingRule | null>(null);
@@ -148,1 +148,1 @@ src/components/pricing/PricingEngineView.tsx
-   // Run interactive resolution
+   const [updatedRate, setUpdatedRate] = useState<number>(11.0);
@@ -149,1 +149,1 @@ src/components/pricing/PricingEngineView.tsx
-   const interactiveResolution = useMemo(() => {
+   const [versionReason, setVersionReason] = useState<string>('تحديث تعاقدي لأسعار الوقود والتضخم');
@@ -150,1 +150,1 @@ src/components/pricing/PricingEngineView.tsx
-     const matId = selectedMaterial === 'ALL' ? null : selectedMaterial;
+ 
@@ -151,1 +151,1 @@ src/components/pricing/PricingEngineView.tsx
-     return pricingService.resolvePricingRuleFromList(rules, {
+   // Run interactive resolution
@@ -152,1 +152,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+   const interactiveResolution = useMemo(() => {
@@ -153,1 +153,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: selectedCarrier,
+     const matId = selectedMaterial === 'ALL' ? null : selectedMaterial;
@@ -154,1 +154,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: matId,
+     return pricingService.resolvePricingRuleFromList(rules, {
@@ -155,1 +155,1 @@ src/components/pricing/PricingEngineView.tsx
-       tripDate,
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -156,1 +156,1 @@ src/components/pricing/PricingEngineView.tsx
-     });
+       carrierId: selectedCarrier,
@@ -157,1 +157,1 @@ src/components/pricing/PricingEngineView.tsx
-   }, [rules, selectedCarrier, selectedMaterial, tripDate]);
+       materialId: matId,
@@ -158,1 +158,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       tripDate,
@@ -159,1 +159,1 @@ src/components/pricing/PricingEngineView.tsx
-   // Run interactive settlement calculation
+     });
@@ -160,1 +160,1 @@ src/components/pricing/PricingEngineView.tsx
-   const interactiveSettlement = useMemo(() => {
+   }, [rules, selectedCarrier, selectedMaterial, tripDate]);
@@ -161,1 +161,1 @@ src/components/pricing/PricingEngineView.tsx
-     if (!interactiveResolution.rule) return null;
+ 
@@ -162,1 +162,1 @@ src/components/pricing/PricingEngineView.tsx
-     return pricingService.calculateSettlement({
+   // Run interactive settlement calculation
@@ -163,1 +163,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRule: interactiveResolution.rule,
+   const interactiveSettlement = useMemo(() => {
@@ -164,1 +164,1 @@ src/components/pricing/PricingEngineView.tsx
-       netWeightTon: Number(netWeightTon) || 0,
+     if (!interactiveResolution.rule) return null;
@@ -165,1 +165,1 @@ src/components/pricing/PricingEngineView.tsx
-       unitsCount: 1,
+     return pricingService.calculateSettlement({
@@ -166,1 +166,1 @@ src/components/pricing/PricingEngineView.tsx
-       clientSuppliedAmount: simulateClientTamper ? Number(tamperedAmount) : undefined,
+       pricingRule: interactiveResolution.rule,
@@ -167,1 +167,1 @@ src/components/pricing/PricingEngineView.tsx
-     });
+       netWeightTon: Number(netWeightTon) || 0,
@@ -168,1 +168,1 @@ src/components/pricing/PricingEngineView.tsx
-   }, [interactiveResolution.rule, netWeightTon, simulateClientTamper, tamperedAmount]);
+       unitsCount: 1,
@@ -169,1 +169,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       clientSuppliedAmount: simulateClientTamper ? Number(tamperedAmount) : undefined,
@@ -170,1 +170,1 @@ src/components/pricing/PricingEngineView.tsx
-   const handleRunTests = () => {
+     });
@@ -171,1 +171,1 @@ src/components/pricing/PricingEngineView.tsx
-     setIsRunningTests(true);
+   }, [interactiveResolution.rule, netWeightTon, simulateClientTamper, tamperedAmount]);
@@ -172,1 +172,1 @@ src/components/pricing/PricingEngineView.tsx
-     setTimeout(() => {
+ 
@@ -173,1 +173,1 @@ src/components/pricing/PricingEngineView.tsx
-       const res = runPricingEngineTests();
+   const handleRunTests = () => {
@@ -174,1 +174,1 @@ src/components/pricing/PricingEngineView.tsx
-       setTestResults(res.results);
+     setIsRunningTests(true);
@@ -175,1 +175,1 @@ src/components/pricing/PricingEngineView.tsx
-       setIsRunningTests(false);
+     setTimeout(() => {
@@ -176,1 +176,1 @@ src/components/pricing/PricingEngineView.tsx
-     }, 400);
+       const res = runPricingEngineTests();
@@ -177,1 +177,1 @@ src/components/pricing/PricingEngineView.tsx
-   };
+       setTestResults(res.results);
@@ -178,1 +178,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       setIsRunningTests(false);
@@ -179,1 +179,1 @@ src/components/pricing/PricingEngineView.tsx
-   // Add rule handler
+     }, 400);
@@ -180,1 +180,1 @@ src/components/pricing/PricingEngineView.tsx
-   const handleAddRule = (e: React.FormEvent) => {
+   };
@@ -181,1 +181,1 @@ src/components/pricing/PricingEngineView.tsx
-     e.preventDefault();
+ 
@@ -182,1 +182,1 @@ src/components/pricing/PricingEngineView.tsx
-     setFormError(null);
+   // Add rule handler
@@ -183,1 +183,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   const handleAddRule = (e: React.FormEvent) => {
@@ -184,1 +184,1 @@ src/components/pricing/PricingEngineView.tsx
-     const validation = PricingRuleValidator.validate({
+     e.preventDefault();
@@ -185,1 +185,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: `PR-${newCarrierId}-${Date.now().toString(36)}`,
+     setFormError(null);
@@ -186,1 +186,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+ 
@@ -187,1 +187,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: newCarrierId,
+     const validation = PricingRuleValidator.validate({
@@ -188,1 +188,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: newMaterialId.trim() || null,
+       pricingRuleId: `PR-${newCarrierId}-${Date.now().toString(36)}`,
@@ -189,1 +189,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: newPricingType,
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -190,1 +190,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: Number(newRate),
+       carrierId: newCarrierId,
@@ -191,1 +191,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: newMaterialId.trim() || null,
@@ -192,1 +192,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: newEffectiveFrom,
+       pricingType: newPricingType,
@@ -193,1 +193,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: newEffectiveTo,
+       rate: Number(newRate),
@@ -194,1 +194,1 @@ src/components/pricing/PricingEngineView.tsx
-     });
+       currency: 'SAR',
@@ -195,1 +195,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       effectiveFrom: newEffectiveFrom,
@@ -196,1 +196,1 @@ src/components/pricing/PricingEngineView.tsx
-     if (!validation.isValid) {
+       effectiveTo: newEffectiveTo,
@@ -197,1 +197,1 @@ src/components/pricing/PricingEngineView.tsx
-       setFormError(validation.errors.map(err => err.messageAr).join(' | '));
+     });
@@ -198,1 +198,1 @@ src/components/pricing/PricingEngineView.tsx
-       return;
+ 
@@ -199,1 +199,1 @@ src/components/pricing/PricingEngineView.tsx
-     }
+     if (!validation.isValid) {
@@ -200,1 +200,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       setFormError(validation.errors.map(err => err.messageAr).join(' | '));
@@ -201,1 +201,1 @@ src/components/pricing/PricingEngineView.tsx
-     // Check overlap
+       return;
@@ -202,1 +202,1 @@ src/components/pricing/PricingEngineView.tsx
-     const overlapCheck = PricingRuleValidator.detectOverlap(
+     }
@@ -203,1 +203,1 @@ src/components/pricing/PricingEngineView.tsx
-       rules.map(r => ({
+ 
@@ -204,1 +204,1 @@ src/components/pricing/PricingEngineView.tsx
-         ruleId: r.pricingRuleId,
+     // Check overlap
@@ -205,1 +205,1 @@ src/components/pricing/PricingEngineView.tsx
-         carrierId: r.carrierId,
+     const overlapCheck = PricingRuleValidator.detectOverlap(
@@ -206,1 +206,1 @@ src/components/pricing/PricingEngineView.tsx
-         materialId: r.materialId,
+       rules.map(r => ({
@@ -207,1 +207,1 @@ src/components/pricing/PricingEngineView.tsx
-         effectiveFrom: r.effectiveFrom,
+         ruleId: r.pricingRuleId,
@@ -208,1 +208,1 @@ src/components/pricing/PricingEngineView.tsx
-         effectiveTo: r.effectiveTo,
+         carrierId: r.carrierId,
@@ -209,1 +209,1 @@ src/components/pricing/PricingEngineView.tsx
-       })),
+         materialId: r.materialId,
@@ -210,1 +210,1 @@ src/components/pricing/PricingEngineView.tsx
-       {
+         effectiveFrom: r.effectiveFrom,
@@ -211,1 +211,1 @@ src/components/pricing/PricingEngineView.tsx
-         ruleId: 'NEW_TEMP',
+         effectiveTo: r.effectiveTo,
@@ -212,1 +212,1 @@ src/components/pricing/PricingEngineView.tsx
-         carrierId: newCarrierId,
+       })),
@@ -213,1 +213,1 @@ src/components/pricing/PricingEngineView.tsx
-         materialId: newMaterialId.trim() || null,
+       {
@@ -214,1 +214,1 @@ src/components/pricing/PricingEngineView.tsx
-         effectiveFrom: newEffectiveFrom,
+         ruleId: 'NEW_TEMP',
@@ -215,1 +215,1 @@ src/components/pricing/PricingEngineView.tsx
-         effectiveTo: newEffectiveTo,
+         carrierId: newCarrierId,
@@ -216,1 +216,1 @@ src/components/pricing/PricingEngineView.tsx
-       }
+         materialId: newMaterialId.trim() || null,
@@ -217,1 +217,1 @@ src/components/pricing/PricingEngineView.tsx
-     );
+         effectiveFrom: newEffectiveFrom,
@@ -218,1 +218,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+         effectiveTo: newEffectiveTo,
@@ -219,1 +219,1 @@ src/components/pricing/PricingEngineView.tsx
-     if (overlapCheck.hasOverlap) {
+       }
@@ -220,1 +220,1 @@ src/components/pricing/PricingEngineView.tsx
-       setFormError(`تحذير تضارب: ${overlapCheck.messageAr}`);
+     );
@@ -221,1 +221,1 @@ src/components/pricing/PricingEngineView.tsx
-       return;
+ 
@@ -222,1 +222,1 @@ src/components/pricing/PricingEngineView.tsx
-     }
+     if (overlapCheck.hasOverlap) {
@@ -223,1 +223,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       setFormError(`تحذير تضارب: ${overlapCheck.messageAr}`);
@@ -224,1 +224,1 @@ src/components/pricing/PricingEngineView.tsx
-     const created: PricingRule = {
+       return;
@@ -225,1 +225,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: `PR-${newCarrierId}-${newPricingType}-${Date.now().toString(36).slice(-4)}-v1`,
+     }
@@ -226,1 +226,1 @@ src/components/pricing/PricingEngineView.tsx
-       projectId: 'PRJ-NEOM-WEST-01',
+ 
@@ -227,1 +227,1 @@ src/components/pricing/PricingEngineView.tsx
-       carrierId: newCarrierId,
+     const created: PricingRule = {
@@ -228,1 +228,1 @@ src/components/pricing/PricingEngineView.tsx
-       materialId: newMaterialId.trim() || null,
+       pricingRuleId: `PR-${newCarrierId}-${newPricingType}-${Date.now().toString(36).slice(-4)}-v1`,
@@ -229,1 +229,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingType: newPricingType,
+       projectId: 'PRJ-NEOM-WEST-01',
@@ -230,1 +230,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: Number(newRate),
+       carrierId: newCarrierId,
@@ -231,1 +231,1 @@ src/components/pricing/PricingEngineView.tsx
-       currency: 'SAR',
+       materialId: newMaterialId.trim() || null,
@@ -232,1 +232,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveFrom: newEffectiveFrom,
+       pricingType: newPricingType,
@@ -233,1 +233,1 @@ src/components/pricing/PricingEngineView.tsx
-       effectiveTo: newEffectiveTo,
+       rate: Number(newRate),
@@ -234,1 +234,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'ACTIVE',
+       currency: 'SAR',
@@ -235,1 +235,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: 1,
+       effectiveFrom: newEffectiveFrom,
@@ -236,1 +236,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: new Date().toISOString(),
+       effectiveTo: newEffectiveTo,
@@ -237,1 +237,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdBy: 'USR-ADMIN',
+       status: 'ACTIVE',
@@ -238,1 +238,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: 'اتفاقية تسعير تعاقدية جديدة معتمدة',
+       version: 1,
@@ -239,1 +239,1 @@ src/components/pricing/PricingEngineView.tsx
-     };
+       createdAt: new Date().toISOString(),
@@ -240,1 +240,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       createdBy: 'USR-ADMIN',
@@ -241,1 +241,1 @@ src/components/pricing/PricingEngineView.tsx
-     setRules(prev => [created, ...prev]);
+       notes: 'اتفاقية تسعير تعاقدية جديدة معتمدة',
@@ -242,1 +242,1 @@ src/components/pricing/PricingEngineView.tsx
-     setShowAddModal(false);
+     };
@@ -243,1 +243,1 @@ src/components/pricing/PricingEngineView.tsx
-   };
+ 
@@ -244,1 +244,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+     setRules(prev => [created, ...prev]);
@@ -245,1 +245,1 @@ src/components/pricing/PricingEngineView.tsx
-   // Copy-On-Write Versioning handler
+     setShowAddModal(false);
@@ -246,1 +246,1 @@ src/components/pricing/PricingEngineView.tsx
-   const handleApplyCowVersioning = () => {
+   };
@@ -247,1 +247,1 @@ src/components/pricing/PricingEngineView.tsx
-     if (!versioningRule) return;
+ 
@@ -248,1 +248,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   // Copy-On-Write Versioning handler
@@ -249,1 +249,1 @@ src/components/pricing/PricingEngineView.tsx
-     const oldVersion = versioningRule.version || 1;
+   const handleApplyCowVersioning = () => {
@@ -250,1 +250,1 @@ src/components/pricing/PricingEngineView.tsx
-     const nextVersion = oldVersion + 1;
+     if (!versioningRule) return;
@@ -251,1 +251,1 @@ src/components/pricing/PricingEngineView.tsx
-     const newRuleId = `${versioningRule.pricingRuleId.replace(/-v\d+$/, '')}-v${nextVersion}`;
+ 
@@ -252,1 +252,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+     const oldVersion = versioningRule.version || 1;
@@ -253,1 +253,1 @@ src/components/pricing/PricingEngineView.tsx
-     // Deactivate / seal old rule for future trips while preserving historical identity
+     const nextVersion = oldVersion + 1;
@@ -254,1 +254,1 @@ src/components/pricing/PricingEngineView.tsx
-     const updatedRules = rules.map(r => {
+     const newRuleId = `${versioningRule.pricingRuleId.replace(/-v\d+$/, '')}-v${nextVersion}`;
@@ -255,1 +255,1 @@ src/components/pricing/PricingEngineView.tsx
-       if (r.pricingRuleId === versioningRule.pricingRuleId) {
+ 
@@ -256,1 +256,1 @@ src/components/pricing/PricingEngineView.tsx
-         return {
+     // Deactivate / seal old rule for future trips while preserving historical identity
@@ -257,1 +257,1 @@ src/components/pricing/PricingEngineView.tsx
-           ...r,
+     const updatedRules = rules.map(r => {
@@ -258,1 +258,1 @@ src/components/pricing/PricingEngineView.tsx
-           status: 'INACTIVE' as const,
+       if (r.pricingRuleId === versioningRule.pricingRuleId) {
@@ -259,1 +259,1 @@ src/components/pricing/PricingEngineView.tsx
-           notes: `${r.notes || ''} (مغلقة ومحفوظة للرحلات التاريخية - استبدلت بالإصدار v${nextVersion})`,
+         return {
@@ -260,1 +260,1 @@ src/components/pricing/PricingEngineView.tsx
-         };
+           ...r,
@@ -261,1 +261,1 @@ src/components/pricing/PricingEngineView.tsx
-       }
+           status: 'INACTIVE' as const,
@@ -262,1 +262,1 @@ src/components/pricing/PricingEngineView.tsx
-       return r;
+           notes: `${r.notes || ''} (مغلقة ومحفوظة للرحلات التاريخية - استبدلت بالإصدار v${nextVersion})`,
@@ -263,1 +263,1 @@ src/components/pricing/PricingEngineView.tsx
-     });
+         };
@@ -264,1 +264,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       }
@@ -265,1 +265,1 @@ src/components/pricing/PricingEngineView.tsx
-     const newRule: PricingRule = {
+       return r;
@@ -266,1 +266,1 @@ src/components/pricing/PricingEngineView.tsx
-       ...versioningRule,
+     });
@@ -267,1 +267,1 @@ src/components/pricing/PricingEngineView.tsx
-       pricingRuleId: newRuleId,
+ 
@@ -268,1 +268,1 @@ src/components/pricing/PricingEngineView.tsx
-       version: nextVersion,
+     const newRule: PricingRule = {
@@ -269,1 +269,1 @@ src/components/pricing/PricingEngineView.tsx
-       rate: Number(updatedRate),
+       ...versioningRule,
@@ -270,1 +270,1 @@ src/components/pricing/PricingEngineView.tsx
-       status: 'ACTIVE',
+       pricingRuleId: newRuleId,
@@ -271,1 +271,1 @@ src/components/pricing/PricingEngineView.tsx
-       createdAt: new Date().toISOString(),
+       version: nextVersion,
@@ -272,1 +272,1 @@ src/components/pricing/PricingEngineView.tsx
-       notes: `إصدار محدث v${nextVersion}: ${versionReason}`,
+       rate: Number(updatedRate),
@@ -273,1 +273,1 @@ src/components/pricing/PricingEngineView.tsx
-     };
+       status: 'ACTIVE',
@@ -274,1 +274,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       createdAt: new Date().toISOString(),
@@ -275,1 +275,1 @@ src/components/pricing/PricingEngineView.tsx
-     setRules([newRule, ...updatedRules]);
+       notes: `إصدار محدث v${nextVersion}: ${versionReason}`,
@@ -276,1 +276,1 @@ src/components/pricing/PricingEngineView.tsx
-     setVersioningRule(null);
+     };
@@ -277,1 +277,1 @@ src/components/pricing/PricingEngineView.tsx
-   };
+ 
@@ -278,1 +278,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+     setRules([newRule, ...updatedRules]);
@@ -279,1 +279,1 @@ src/components/pricing/PricingEngineView.tsx
-   const filteredTests = useMemo(() => {
+     setVersioningRule(null);
@@ -280,1 +280,1 @@ src/components/pricing/PricingEngineView.tsx
-     return testResults.filter(t => {
+   };
@@ -281,1 +281,1 @@ src/components/pricing/PricingEngineView.tsx
-       const matchCat = filterCategory === 'ALL' || t.category === filterCategory;
+ 
@@ -282,1 +282,1 @@ src/components/pricing/PricingEngineView.tsx
-       const matchQuery = !testSearch || 
+   const filteredTests = useMemo(() => {
@@ -283,1 +283,1 @@ src/components/pricing/PricingEngineView.tsx
-         t.titleAr.includes(testSearch) || 
+     return testResults.filter(t => {
@@ -284,1 +284,1 @@ src/components/pricing/PricingEngineView.tsx
-         t.titleEn.toLowerCase().includes(testSearch.toLowerCase()) || 
+       const matchCat = filterCategory === 'ALL' || t.category === filterCategory;
@@ -285,1 +285,1 @@ src/components/pricing/PricingEngineView.tsx
-         t.id.toLowerCase().includes(testSearch.toLowerCase());
+       const matchQuery = !testSearch || 
@@ -286,1 +286,1 @@ src/components/pricing/PricingEngineView.tsx
-       return matchCat && matchQuery;
+         t.titleAr.includes(testSearch) || 
@@ -287,1 +287,1 @@ src/components/pricing/PricingEngineView.tsx
-     });
+         t.titleEn.toLowerCase().includes(testSearch.toLowerCase()) || 
@@ -288,1 +288,1 @@ src/components/pricing/PricingEngineView.tsx
-   }, [testResults, filterCategory, testSearch]);
+         t.id.toLowerCase().includes(testSearch.toLowerCase());
@@ -289,1 +289,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+       return matchCat && matchQuery;
@@ -290,1 +290,1 @@ src/components/pricing/PricingEngineView.tsx
-   const passedCount = testResults.filter(t => t.passed).length;
+     });
@@ -291,1 +291,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+   }, [testResults, filterCategory, testSearch]);
@@ -292,1 +292,1 @@ src/components/pricing/PricingEngineView.tsx
-   return (
+ 
@@ -293,1 +293,1 @@ src/components/pricing/PricingEngineView.tsx
-     <div className="space-y-6 pb-16" dir="rtl" id="pricing-engine-container">
+   const passedCount = testResults.filter(t => t.passed).length;
@@ -294,1 +294,1 @@ src/components/pricing/PricingEngineView.tsx
-       {/* Top Banner Header */}
+ 
@@ -295,1 +295,1 @@ src/components/pricing/PricingEngineView.tsx
-       <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs" id="pricing-header-card">
+   return (
@@ -296,1 +296,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
+     <div className="space-y-6 pb-16" dir="rtl" id="pricing-engine-container">
@@ -297,1 +297,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div>
+       {/* Top Banner Header */}
@@ -298,1 +298,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
+       <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs" id="pricing-header-card">
@@ -299,1 +299,1 @@ src/components/pricing/PricingEngineView.tsx
-               <Calculator className="w-4 h-4" />
+         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
@@ -300,1 +300,1 @@ src/components/pricing/PricingEngineView.tsx
-               <span>محرك التسعير وحساب المستحقات اللوجستية والاتفاقيات (BLOCK 36)</span>
+           <div>
@@ -301,1 +301,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+             <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
@@ -302,1 +302,1 @@ src/components/pricing/PricingEngineView.tsx
-             <h1 className="text-xl font-black text-stone-900">
+               <Calculator className="w-4 h-4" />
@@ -303,1 +303,1 @@ src/components/pricing/PricingEngineView.tsx
-               محرك التسعير الآلي والاتفاقيات التعاقدية (Pricing & Settlement Engine)
+               <span>محرك التسعير وحساب المستحقات اللوجستية والاتفاقيات (BLOCK 36)</span>
@@ -304,1 +304,1 @@ src/components/pricing/PricingEngineView.tsx
-             </h1>
+             </div>
@@ -305,1 +305,1 @@ src/components/pricing/PricingEngineView.tsx
-             <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
+             <h1 className="text-xl font-black text-stone-900">
@@ -306,1 +306,1 @@ src/components/pricing/PricingEngineView.tsx
-               محرك تعاقدي حتمي خالي من التخمين (<strong className="text-stone-900">No-Guess Pricing</strong>)، 
+               محرك التسعير الآلي والاتفاقيات التعاقدية (Pricing & Settlement Engine)
@@ -307,1 +307,1 @@ src/components/pricing/PricingEngineView.tsx
-               مرتبط بالنواقل والمواد والتواريخ، ومحمي بنظام النسخ عند التعديل (<strong className="text-stone-900">Copy-on-Write Versioning</strong>) 
+             </h1>
@@ -308,1 +308,1 @@ src/components/pricing/PricingEngineView.tsx
-               مع تثبيت <strong className="text-stone-900">Trip Pricing Snapshot</strong> لمنع التلاعب بأي فواتير تاريخية.
+             <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
@@ -309,1 +309,1 @@ src/components/pricing/PricingEngineView.tsx
-             </p>
+               محرك تعاقدي حتمي خالي من التخمين (<strong className="text-stone-900">No-Guess Pricing</strong>)، 
@@ -310,1 +310,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+               مرتبط بالنواقل والمواد والتواريخ، ومحمي بنظام النسخ عند التعديل (<strong className="text-stone-900">Copy-on-Write Versioning</strong>) 
@@ -311,1 +311,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               مع تثبيت <strong className="text-stone-900">Trip Pricing Snapshot</strong> لمنع التلاعب بأي فواتير تاريخية.
@@ -312,1 +312,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="flex flex-wrap items-center gap-3">
+             </p>
@@ -313,1 +313,1 @@ src/components/pricing/PricingEngineView.tsx
-             <button
+           </div>
@@ -314,1 +314,1 @@ src/components/pricing/PricingEngineView.tsx
-               id="btn-run-all-pricing-tests"
+ 
@@ -315,1 +315,1 @@ src/components/pricing/PricingEngineView.tsx
-               onClick={handleRunTests}
+           <div className="flex flex-wrap items-center gap-3">
@@ -316,1 +316,1 @@ src/components/pricing/PricingEngineView.tsx
-               disabled={isRunningTests}
+             <button
@@ -317,1 +317,1 @@ src/components/pricing/PricingEngineView.tsx
-               className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
+               id="btn-run-all-pricing-tests"
@@ -318,1 +318,1 @@ src/components/pricing/PricingEngineView.tsx
-             >
+               onClick={handleRunTests}
@@ -319,1 +319,1 @@ src/components/pricing/PricingEngineView.tsx
-               <Play className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
+               disabled={isRunningTests}
@@ -320,1 +320,1 @@ src/components/pricing/PricingEngineView.tsx
-               <span>{isRunningTests ? 'جاري الفحص الميداني...' : 'تشغيل الاختبارات الـ 34 كاملة'}</span>
+               className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
@@ -321,1 +321,1 @@ src/components/pricing/PricingEngineView.tsx
-             </button>
+             >
@@ -322,1 +322,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
+               <Play className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
@@ -323,1 +323,1 @@ src/components/pricing/PricingEngineView.tsx
-               <CheckCircle2 className="w-4 h-4 text-emerald-600" />
+               <span>{isRunningTests ? 'جاري الفحص الميداني...' : 'تشغيل الاختبارات الـ 34 كاملة'}</span>
@@ -324,1 +324,1 @@ src/components/pricing/PricingEngineView.tsx
-               <span className="text-xs font-bold text-emerald-800">
+             </button>
@@ -325,1 +325,1 @@ src/components/pricing/PricingEngineView.tsx
-                 {passedCount} / {testResults.length} اختبار ناجح (100% SUCCESS)
+             <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
@@ -326,1 +326,1 @@ src/components/pricing/PricingEngineView.tsx
-               </span>
+               <CheckCircle2 className="w-4 h-4 text-emerald-600" />
@@ -327,1 +327,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+               <span className="text-xs font-bold text-emerald-800">
@@ -328,1 +328,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+                 {passedCount} / {testResults.length} اختبار ناجح (100% SUCCESS)
@@ -329,1 +329,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+               </span>
@@ -330,1 +330,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+             </div>
@@ -331,1 +331,1 @@ src/components/pricing/PricingEngineView.tsx
-         {/* Tab Navigation */}
+           </div>
@@ -332,1 +332,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="flex border-b border-stone-200 mt-6 pt-2 gap-2">
+         </div>
@@ -333,1 +333,1 @@ src/components/pricing/PricingEngineView.tsx
-           <button
+ 
@@ -334,1 +334,1 @@ src/components/pricing/PricingEngineView.tsx
-             id="tab-btn-simulator"
+         {/* Tab Navigation */}
@@ -335,1 +335,1 @@ src/components/pricing/PricingEngineView.tsx
-             onClick={() => setActiveTab('SIMULATOR')}
+         <div className="flex border-b border-stone-200 mt-6 pt-2 gap-2">
@@ -336,1 +336,1 @@ src/components/pricing/PricingEngineView.tsx
-             className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
+           <button
@@ -337,1 +337,1 @@ src/components/pricing/PricingEngineView.tsx
-               activeTab === 'SIMULATOR'
+             id="tab-btn-simulator"
@@ -338,1 +338,1 @@ src/components/pricing/PricingEngineView.tsx
-                 ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
+             onClick={() => setActiveTab('SIMULATOR')}
@@ -339,1 +339,1 @@ src/components/pricing/PricingEngineView.tsx
-                 : 'border-transparent text-stone-500 hover:text-stone-800'
+             className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
@@ -340,1 +340,1 @@ src/components/pricing/PricingEngineView.tsx
-             }`}
+               activeTab === 'SIMULATOR'
@@ -341,1 +341,1 @@ src/components/pricing/PricingEngineView.tsx
-           >
+                 ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
@@ -342,1 +342,1 @@ src/components/pricing/PricingEngineView.tsx
-             <Scale className="w-4 h-4" />
+                 : 'border-transparent text-stone-500 hover:text-stone-800'
@@ -343,1 +343,1 @@ src/components/pricing/PricingEngineView.tsx
-             <span>المحاكي وحساب المستحقات (Simulator & Settlement)</span>
+             }`}
@@ -344,1 +344,1 @@ src/components/pricing/PricingEngineView.tsx
-           </button>
+           >
@@ -345,1 +345,1 @@ src/components/pricing/PricingEngineView.tsx
-           <button
+             <Scale className="w-4 h-4" />
@@ -346,1 +346,1 @@ src/components/pricing/PricingEngineView.tsx
-             id="tab-btn-rules"
+             <span>المحاكي وحساب المستحقات (Simulator & Settlement)</span>
@@ -347,1 +347,1 @@ src/components/pricing/PricingEngineView.tsx
-             onClick={() => setActiveTab('RULES')}
+           </button>
@@ -348,1 +348,1 @@ src/components/pricing/PricingEngineView.tsx
-             className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
+           <button
@@ -349,1 +349,1 @@ src/components/pricing/PricingEngineView.tsx
-               activeTab === 'RULES'
+             id="tab-btn-rules"
@@ -350,1 +350,1 @@ src/components/pricing/PricingEngineView.tsx
-                 ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
+             onClick={() => setActiveTab('RULES')}
@@ -351,1 +351,1 @@ src/components/pricing/PricingEngineView.tsx
-                 : 'border-transparent text-stone-500 hover:text-stone-800'
+             className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
@@ -352,1 +352,1 @@ src/components/pricing/PricingEngineView.tsx
-             }`}
+               activeTab === 'RULES'
@@ -353,1 +353,1 @@ src/components/pricing/PricingEngineView.tsx
-           >
+                 ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
@@ -354,1 +354,1 @@ src/components/pricing/PricingEngineView.tsx
-             <FileText className="w-4 h-4" />
+                 : 'border-transparent text-stone-500 hover:text-stone-800'
@@ -355,1 +355,1 @@ src/components/pricing/PricingEngineView.tsx
-             <span>الاتفاقيات التعاقدية ونظام النسخ COW ({rules.length})</span>
+             }`}
@@ -356,1 +356,1 @@ src/components/pricing/PricingEngineView.tsx
-           </button>
+           >
@@ -357,1 +357,1 @@ src/components/pricing/PricingEngineView.tsx
-           <button
+             <FileText className="w-4 h-4" />
@@ -358,1 +358,1 @@ src/components/pricing/PricingEngineView.tsx
-             id="tab-btn-tests"
+             <span>الاتفاقيات التعاقدية ونظام النسخ COW ({rules.length})</span>
@@ -359,1 +359,1 @@ src/components/pricing/PricingEngineView.tsx
-             onClick={() => setActiveTab('TESTS')}
+           </button>
@@ -360,1 +360,1 @@ src/components/pricing/PricingEngineView.tsx
-             className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
+           <button
@@ -361,1 +361,1 @@ src/components/pricing/PricingEngineView.tsx
-               activeTab === 'TESTS'
+             id="tab-btn-tests"
@@ -362,1 +362,1 @@ src/components/pricing/PricingEngineView.tsx
-                 ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
+             onClick={() => setActiveTab('TESTS')}
@@ -363,1 +363,1 @@ src/components/pricing/PricingEngineView.tsx
-                 : 'border-transparent text-stone-500 hover:text-stone-800'
+             className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
@@ -364,1 +364,1 @@ src/components/pricing/PricingEngineView.tsx
-             }`}
+               activeTab === 'TESTS'
@@ -365,1 +365,1 @@ src/components/pricing/PricingEngineView.tsx
-           >
+                 ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
@@ -366,1 +366,1 @@ src/components/pricing/PricingEngineView.tsx
-             <ShieldCheck className="w-4 h-4" />
+                 : 'border-transparent text-stone-500 hover:text-stone-800'
@@ -367,1 +367,1 @@ src/components/pricing/PricingEngineView.tsx
-             <span>مصفوفة الاختبارات الـ 34 الشاملة (34 Test Matrix)</span>
+             }`}
@@ -368,1 +368,1 @@ src/components/pricing/PricingEngineView.tsx
-           </button>
+           >
@@ -369,1 +369,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+             <ShieldCheck className="w-4 h-4" />
@@ -370,1 +370,1 @@ src/components/pricing/PricingEngineView.tsx
-       </div>
+             <span>مصفوفة الاختبارات الـ 34 الشاملة (34 Test Matrix)</span>
@@ -371,1 +371,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+           </button>
@@ -372,1 +372,1 @@ src/components/pricing/PricingEngineView.tsx
-       {/* ================= TAB 1: SIMULATOR & SETTLEMENT ================= */}
+         </div>
@@ -373,1 +373,1 @@ src/components/pricing/PricingEngineView.tsx
-       {activeTab === 'SIMULATOR' && (
+       </div>
@@ -374,1 +374,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="simulator-view">
+ 
@@ -375,1 +375,1 @@ src/components/pricing/PricingEngineView.tsx
-           
+       {/* ================= TAB 1: SIMULATOR & SETTLEMENT ================= */}
@@ -376,1 +376,1 @@ src/components/pricing/PricingEngineView.tsx
-           {/* Left Column: Interactive Simulation Inputs (7 cols) */}
+       {activeTab === 'SIMULATOR' && (
@@ -377,1 +377,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="lg:col-span-7 space-y-6">
+         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="simulator-view">
@@ -378,1 +378,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
+           
@@ -379,1 +379,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
+           {/* Left Column: Interactive Simulation Inputs (7 cols) */}
@@ -380,1 +380,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
+           <div className="lg:col-span-7 space-y-6">
@@ -381,1 +381,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <Scale className="w-4 h-4 text-amber-600" />
+             <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
@@ -382,1 +382,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <span>محاكي حل التسعير والاحتساب المباشر (Interactive Pricing Simulator)</span>
+               <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
@@ -383,1 +383,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </h2>
+                 <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
@@ -384,1 +384,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
+                   <Scale className="w-4 h-4 text-amber-600" />
@@ -385,1 +385,1 @@ src/components/pricing/PricingEngineView.tsx
-                   Server-Side Deterministic Resolution
+                   <span>محاكي حل التسعير والاحتساب المباشر (Interactive Pricing Simulator)</span>
@@ -386,1 +386,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </span>
+                 </h2>
@@ -387,1 +387,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                 <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
@@ -388,1 +388,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                   Server-Side Deterministic Resolution
@@ -389,1 +389,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="space-y-4">
+                 </span>
@@ -390,1 +390,1 @@ src/components/pricing/PricingEngineView.tsx
-                 {/* Carrier Selection */}
+               </div>
@@ -391,1 +391,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div>
+ 
@@ -392,1 +392,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
+               <div className="space-y-4">
@@ -393,1 +393,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <Truck className="w-3.5 h-3.5 text-stone-400" />
+                 {/* Carrier Selection */}
@@ -394,1 +394,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span>شركة النقل المعتمدة (Carrier):</span>
+                 <div>
@@ -395,1 +395,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </label>
+                   <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
@@ -396,1 +396,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
+                     <Truck className="w-3.5 h-3.5 text-stone-400" />
@@ -397,1 +397,1 @@ src/components/pricing/PricingEngineView.tsx
-                     {[
+                     <span>شركة النقل المعتمدة (Carrier):</span>
@@ -398,1 +398,1 @@ src/components/pricing/PricingEngineView.tsx
-                       { id: 'CARRIER-A', label: 'Carrier A (اتفاقية مقطوعة بالرد 120 ر.س)', badge: 'PER_TRIP' },
+                   </label>
@@ -399,1 +399,1 @@ src/components/pricing/PricingEngineView.tsx
-                       { id: 'CARRIER-B', label: 'Carrier B (حساب بالوزن 8.5 ر.س / 10 ر.س)', badge: 'PER_TON' },
+                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
@@ -400,1 +400,1 @@ src/components/pricing/PricingEngineView.tsx
-                       { id: 'CARRIER-C', label: 'Carrier C (سعر مخفض 7.75 ر.س/طن)', badge: 'PER_TON' },
+                     {[
@@ -401,1 +401,1 @@ src/components/pricing/PricingEngineView.tsx
-                       { id: 'CARRIER-D', label: 'Carrier D (عقد منتهي في 2025)', badge: 'منتهي الصلاحية' },
+                       { id: 'CARRIER-A', label: 'Carrier A (اتفاقية مقطوعة بالرد 120 ر.س)', badge: 'PER_TRIP' },
@@ -402,1 +402,1 @@ src/components/pricing/PricingEngineView.tsx
-                       { id: 'UNKNOWN-CARRIER', label: 'ناقل مجهول غير متعاقد', badge: 'غير مسجل' },
+                       { id: 'CARRIER-B', label: 'Carrier B (حساب بالوزن 8.5 ر.س / 10 ر.س)', badge: 'PER_TON' },
@@ -403,1 +403,1 @@ src/components/pricing/PricingEngineView.tsx
-                     ].map((c) => (
+                       { id: 'CARRIER-C', label: 'Carrier C (سعر مخفض 7.75 ر.س/طن)', badge: 'PER_TON' },
@@ -404,1 +404,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <button
+                       { id: 'CARRIER-D', label: 'Carrier D (عقد منتهي في 2025)', badge: 'منتهي الصلاحية' },
@@ -405,1 +405,1 @@ src/components/pricing/PricingEngineView.tsx
-                         key={c.id}
+                       { id: 'UNKNOWN-CARRIER', label: 'ناقل مجهول غير متعاقد', badge: 'غير مسجل' },
@@ -406,1 +406,1 @@ src/components/pricing/PricingEngineView.tsx
-                         type="button"
+                     ].map((c) => (
@@ -407,1 +407,1 @@ src/components/pricing/PricingEngineView.tsx
-                         onClick={() => setSelectedCarrier(c.id)}
+                       <button
@@ -408,1 +408,1 @@ src/components/pricing/PricingEngineView.tsx
-                         className={`text-right p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
+                         key={c.id}
@@ -409,1 +409,1 @@ src/components/pricing/PricingEngineView.tsx
-                           selectedCarrier === c.id 
+                         type="button"
@@ -410,1 +410,1 @@ src/components/pricing/PricingEngineView.tsx
-                             ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-xs' 
+                         onClick={() => setSelectedCarrier(c.id)}
@@ -411,1 +411,1 @@ src/components/pricing/PricingEngineView.tsx
-                             : 'border-stone-200 hover:bg-stone-50 text-stone-700'
+                         className={`text-right p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
@@ -412,1 +412,1 @@ src/components/pricing/PricingEngineView.tsx
-                         }`}
+                           selectedCarrier === c.id 
@@ -413,1 +413,1 @@ src/components/pricing/PricingEngineView.tsx
-                       >
+                             ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-xs' 
@@ -414,1 +414,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <span>{c.label}</span>
+                             : 'border-stone-200 hover:bg-stone-50 text-stone-700'
@@ -415,1 +415,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <span className={`self-start mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
+                         }`}
@@ -416,1 +416,1 @@ src/components/pricing/PricingEngineView.tsx
-                           selectedCarrier === c.id ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-stone-100 text-stone-600'
+                       >
@@ -417,1 +417,1 @@ src/components/pricing/PricingEngineView.tsx
-                         }`}>
+                         <span>{c.label}</span>
@@ -418,1 +418,1 @@ src/components/pricing/PricingEngineView.tsx
-                           {c.badge}
+                         <span className={`self-start mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
@@ -419,1 +419,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </span>
+                           selectedCarrier === c.id ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-stone-100 text-stone-600'
@@ -420,1 +420,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </button>
+                         }`}>
@@ -421,1 +421,1 @@ src/components/pricing/PricingEngineView.tsx
-                     ))}
+                           {c.badge}
@@ -422,1 +422,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                         </span>
@@ -423,1 +423,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                       </button>
@@ -424,1 +424,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                     ))}
@@ -425,1 +425,1 @@ src/components/pricing/PricingEngineView.tsx
-                 {/* Material & Date row */}
+                   </div>
@@ -426,1 +426,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
+                 </div>
@@ -427,1 +427,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div>
+ 
@@ -428,1 +428,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
+                 {/* Material & Date row */}
@@ -429,1 +429,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <Layers className="w-3.5 h-3.5 text-stone-400" />
+                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
@@ -430,1 +430,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span>مادة التوريد (Material ID):</span>
+                   <div>
@@ -431,1 +431,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </label>
+                     <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
@@ -432,1 +432,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <select
+                       <Layers className="w-3.5 h-3.5 text-stone-400" />
@@ -433,1 +433,1 @@ src/components/pricing/PricingEngineView.tsx
-                       value={selectedMaterial}
+                       <span>مادة التوريد (Material ID):</span>
@@ -434,1 +434,1 @@ src/components/pricing/PricingEngineView.tsx
-                       onChange={(e) => setSelectedMaterial(e.target.value)}
+                     </label>
@@ -435,1 +435,1 @@ src/components/pricing/PricingEngineView.tsx
-                       className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:border-amber-600 focus:outline-none"
+                     <select
@@ -436,1 +436,1 @@ src/components/pricing/PricingEngineView.tsx
-                     >
+                       value={selectedMaterial}
@@ -437,1 +437,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <option value="MAT-SUBBASE">MAT-SUBBASE (طبقة أساس - 10.0 ر.س للناقل B)</option>
+                       onChange={(e) => setSelectedMaterial(e.target.value)}
@@ -438,1 +438,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <option value="MAT-SAND">MAT-SAND (رمل مغسول - سعر عام)</option>
+                       className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:border-amber-600 focus:outline-none"
@@ -439,1 +439,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <option value="MAT-GRAVEL">MAT-GRAVEL (بحص خرساني - سعر عام)</option>
+                     >
@@ -440,1 +440,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <option value="ALL">ALL (تسعيرة عامة غير مخصصة لمادة)</option>
+                       <option value="MAT-SUBBASE">MAT-SUBBASE (طبقة أساس - 10.0 ر.س للناقل B)</option>
@@ -441,1 +441,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </select>
+                       <option value="MAT-SAND">MAT-SAND (رمل مغسول - سعر عام)</option>
@@ -442,1 +442,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                       <option value="MAT-GRAVEL">MAT-GRAVEL (بحص خرساني - سعر عام)</option>
@@ -443,1 +443,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                       <option value="ALL">ALL (تسعيرة عامة غير مخصصة لمادة)</option>
@@ -444,1 +444,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div>
+                     </select>
@@ -445,1 +445,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
+                   </div>
@@ -446,1 +446,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <Calendar className="w-3.5 h-3.5 text-stone-400" />
+ 
@@ -447,1 +447,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span>تاريخ الرحلة الفعلي (Trip Date):</span>
+                   <div>
@@ -448,1 +448,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </label>
+                     <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
@@ -449,1 +449,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <input
+                       <Calendar className="w-3.5 h-3.5 text-stone-400" />
@@ -450,1 +450,1 @@ src/components/pricing/PricingEngineView.tsx
-                       type="date"
+                       <span>تاريخ الرحلة الفعلي (Trip Date):</span>
@@ -451,1 +451,1 @@ src/components/pricing/PricingEngineView.tsx
-                       value={tripDate}
+                     </label>
@@ -452,1 +452,1 @@ src/components/pricing/PricingEngineView.tsx
-                       onChange={(e) => setTripDate(e.target.value)}
+                     <input
@@ -453,1 +453,1 @@ src/components/pricing/PricingEngineView.tsx
-                       className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:border-amber-600 focus:outline-none font-mono"
+                       type="date"
@@ -454,1 +454,1 @@ src/components/pricing/PricingEngineView.tsx
-                     />
+                       value={tripDate}
@@ -455,1 +455,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex gap-1.5 mt-1.5">
+                       onChange={(e) => setTripDate(e.target.value)}
@@ -456,1 +456,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <button
+                       className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:border-amber-600 focus:outline-none font-mono"
@@ -457,1 +457,1 @@ src/components/pricing/PricingEngineView.tsx
-                         type="button"
+                     />
@@ -458,1 +458,1 @@ src/components/pricing/PricingEngineView.tsx
-                         onClick={() => setTripDate('2026-09-09')}
+                     <div className="flex gap-1.5 mt-1.5">
@@ -459,1 +459,1 @@ src/components/pricing/PricingEngineView.tsx
-                         className="text-[10px] text-stone-500 hover:text-amber-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded cursor-pointer"
+                       <button
@@ -460,1 +460,1 @@ src/components/pricing/PricingEngineView.tsx
-                       >
+                         type="button"
@@ -461,1 +461,1 @@ src/components/pricing/PricingEngineView.tsx
-                         تاريخ نشط (2026-09-09)
+                         onClick={() => setTripDate('2026-09-09')}
@@ -462,1 +462,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </button>
+                         className="text-[10px] text-stone-500 hover:text-amber-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded cursor-pointer"
@@ -463,1 +463,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <button
+                       >
@@ -464,1 +464,1 @@ src/components/pricing/PricingEngineView.tsx
-                         type="button"
+                         تاريخ نشط (2026-09-09)
@@ -465,1 +465,1 @@ src/components/pricing/PricingEngineView.tsx
-                         onClick={() => setTripDate('2027-02-15')}
+                       </button>
@@ -466,1 +466,1 @@ src/components/pricing/PricingEngineView.tsx
-                         className="text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded cursor-pointer"
+                       <button
@@ -467,1 +467,1 @@ src/components/pricing/PricingEngineView.tsx
-                       >
+                         type="button"
@@ -468,1 +468,1 @@ src/components/pricing/PricingEngineView.tsx
-                         تاريخ منتهي (2027-02-15)
+                         onClick={() => setTripDate('2027-02-15')}
@@ -469,1 +469,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </button>
+                         className="text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded cursor-pointer"
@@ -470,1 +470,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                       >
@@ -471,1 +471,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                         تاريخ منتهي (2027-02-15)
@@ -472,1 +472,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                       </button>
@@ -473,1 +473,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                     </div>
@@ -474,1 +474,1 @@ src/components/pricing/PricingEngineView.tsx
-                 {/* Weight Input */}
+                   </div>
@@ -475,1 +475,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
+                 </div>
@@ -476,1 +476,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="flex items-center justify-between mb-2">
+ 
@@ -477,1 +477,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
+                 {/* Weight Input */}
@@ -478,1 +478,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <Scale className="w-3.5 h-3.5 text-amber-600" />
+                 <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
@@ -479,1 +479,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span>الوزن الصافي المعتمد من الميزان (Net Weight Tons):</span>
+                   <div className="flex items-center justify-between mb-2">
@@ -480,1 +480,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </label>
+                     <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
@@ -481,1 +481,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
+                       <Scale className="w-3.5 h-3.5 text-amber-600" />
@@ -482,1 +482,1 @@ src/components/pricing/PricingEngineView.tsx
-                       {netWeightTon} طن ({Math.round(netWeightTon * 1000).toLocaleString()} كجم)
+                       <span>الوزن الصافي المعتمد من الميزان (Net Weight Tons):</span>
@@ -483,1 +483,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </span>
+                     </label>
@@ -484,1 +484,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                     <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
@@ -485,1 +485,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <input
+                       {netWeightTon} طن ({Math.round(netWeightTon * 1000).toLocaleString()} كجم)
@@ -486,1 +486,1 @@ src/components/pricing/PricingEngineView.tsx
-                     type="range"
+                     </span>
@@ -487,1 +487,1 @@ src/components/pricing/PricingEngineView.tsx
-                     min="5"
+                   </div>
@@ -488,1 +488,1 @@ src/components/pricing/PricingEngineView.tsx
-                     max="60"
+                   <input
@@ -489,1 +489,1 @@ src/components/pricing/PricingEngineView.tsx
-                     step="0.25"
+                     type="range"
@@ -490,1 +490,1 @@ src/components/pricing/PricingEngineView.tsx
-                     value={netWeightTon}
+                     min="5"
@@ -491,1 +491,1 @@ src/components/pricing/PricingEngineView.tsx
-                     onChange={(e) => setNetWeightTon(parseFloat(e.target.value))}
+                     max="60"
@@ -492,1 +492,1 @@ src/components/pricing/PricingEngineView.tsx
-                     className="w-full accent-amber-600 cursor-pointer"
+                     step="0.25"
@@ -493,1 +493,1 @@ src/components/pricing/PricingEngineView.tsx
-                   />
+                     value={netWeightTon}
@@ -494,1 +494,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
+                     onChange={(e) => setNetWeightTon(parseFloat(e.target.value))}
@@ -495,1 +495,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span>5 طن (شاحنة صغيرة)</span>
+                     className="w-full accent-amber-600 cursor-pointer"
@@ -496,1 +496,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span>32 طن (تريلا قلاب قياسية)</span>
+                   />
@@ -497,1 +497,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span>60 طن (حمولة قصوى)</span>
+                   <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
@@ -498,1 +498,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                     <span>5 طن (شاحنة صغيرة)</span>
@@ -499,1 +499,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     <span>32 طن (تريلا قلاب قياسية)</span>
@@ -500,1 +500,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                     <span>60 طن (حمولة قصوى)</span>
@@ -501,1 +501,1 @@ src/components/pricing/PricingEngineView.tsx
-                 {/* Security Test: Simulate Client Tampering */}
+                   </div>
@@ -502,1 +502,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="border border-stone-200 rounded-xl p-3.5 bg-white">
+                 </div>
@@ -503,1 +503,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="flex items-center justify-between">
+ 
@@ -504,1 +504,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex items-center gap-2">
+                 {/* Security Test: Simulate Client Tampering */}
@@ -505,1 +505,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <Lock className="w-4 h-4 text-rose-600" />
+                 <div className="border border-stone-200 rounded-xl p-3.5 bg-white">
@@ -506,1 +506,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <div>
+                   <div className="flex items-center justify-between">
@@ -507,1 +507,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <p className="text-xs font-bold text-stone-900">
+                     <div className="flex items-center gap-2">
@@ -508,1 +508,1 @@ src/components/pricing/PricingEngineView.tsx
-                           اختبار أمني: محاكاة محاولة تلاعب العميل بالقيمة المالية
+                       <Lock className="w-4 h-4 text-rose-600" />
@@ -509,1 +509,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </p>
+                       <div>
@@ -510,1 +510,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <p className="text-[11px] text-stone-500">
+                         <p className="text-xs font-bold text-stone-900">
@@ -511,1 +511,1 @@ src/components/pricing/PricingEngineView.tsx
-                           إرسال العميل لقيمة مالية مختلفة للتأكد من قيام السيرفر برفضها وفرض حسابه
+                           اختبار أمني: محاكاة محاولة تلاعب العميل بالقيمة المالية
@@ -513,1 +513,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </div>
+                         <p className="text-[11px] text-stone-500">
@@ -514,1 +514,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                           إرسال العميل لقيمة مالية مختلفة للتأكد من قيام السيرفر برفضها وفرض حسابه
@@ -515,1 +515,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <label className="relative inline-flex items-center cursor-pointer">
+                         </p>
@@ -516,1 +516,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <input
+                       </div>
@@ -517,1 +517,1 @@ src/components/pricing/PricingEngineView.tsx
-                         type="checkbox"
+                     </div>
@@ -518,1 +518,1 @@ src/components/pricing/PricingEngineView.tsx
-                         checked={simulateClientTamper}
+                     <label className="relative inline-flex items-center cursor-pointer">
@@ -519,1 +519,1 @@ src/components/pricing/PricingEngineView.tsx
-                         onChange={(e) => setSimulateClientTamper(e.target.checked)}
+                       <input
@@ -520,1 +520,1 @@ src/components/pricing/PricingEngineView.tsx
-                         className="sr-only peer"
+                         type="checkbox"
@@ -521,1 +521,1 @@ src/components/pricing/PricingEngineView.tsx
-                       />
+                         checked={simulateClientTamper}
@@ -522,1 +522,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
+                         onChange={(e) => setSimulateClientTamper(e.target.checked)}
@@ -523,1 +523,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </label>
+                         className="sr-only peer"
@@ -524,1 +524,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                       />
@@ -525,1 +525,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                       <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
@@ -526,1 +526,1 @@ src/components/pricing/PricingEngineView.tsx
-                   {simulateClientTamper && (
+                     </label>
@@ -527,1 +527,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3">
+                   </div>
@@ -528,1 +528,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-xs text-stone-600 shrink-0">القيمة المغشوشة المرسلة من المتصفح:</span>
+ 
@@ -529,1 +529,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <input
+                   {simulateClientTamper && (
@@ -530,1 +530,1 @@ src/components/pricing/PricingEngineView.tsx
-                         type="number"
+                     <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3">
@@ -531,1 +531,1 @@ src/components/pricing/PricingEngineView.tsx
-                         value={tamperedAmount}
+                       <span className="text-xs text-stone-600 shrink-0">القيمة المغشوشة المرسلة من المتصفح:</span>
@@ -532,1 +532,1 @@ src/components/pricing/PricingEngineView.tsx
-                         onChange={(e) => setTamperedAmount(parseFloat(e.target.value) || 0)}
+                       <input
@@ -533,1 +533,1 @@ src/components/pricing/PricingEngineView.tsx
-                         className="w-28 text-xs bg-rose-50 border border-rose-300 rounded p-1.5 font-mono text-rose-700 font-bold"
+                         type="number"
@@ -534,1 +534,1 @@ src/components/pricing/PricingEngineView.tsx
-                       />
+                         value={tamperedAmount}
@@ -535,1 +535,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-[10px] text-rose-600">
+                         onChange={(e) => setTamperedAmount(parseFloat(e.target.value) || 0)}
@@ -536,1 +536,1 @@ src/components/pricing/PricingEngineView.tsx
-                         ⚠️ سيقوم السيرفر بتجاهلها وحساب المستحق الحقيقي فوراً
+                         className="w-28 text-xs bg-rose-50 border border-rose-300 rounded p-1.5 font-mono text-rose-700 font-bold"
@@ -537,1 +537,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </span>
+                       />
@@ -538,1 +538,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                       <span className="text-[10px] text-rose-600">
@@ -539,1 +539,1 @@ src/components/pricing/PricingEngineView.tsx
-                   )}
+                         ⚠️ سيقوم السيرفر بتجاهلها وحساب المستحق الحقيقي فوراً
@@ -540,1 +540,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                       </span>
@@ -541,1 +541,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                     </div>
@@ -542,1 +542,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+                   )}
@@ -543,1 +543,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+                 </div>
@@ -544,1 +544,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               </div>
@@ -545,1 +545,1 @@ src/components/pricing/PricingEngineView.tsx
-           {/* Right Column: Engine Output & Pricing Snapshot (5 cols) */}
+             </div>
@@ -546,1 +546,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="lg:col-span-5 space-y-6">
+           </div>
@@ -547,1 +547,1 @@ src/components/pricing/PricingEngineView.tsx
-             
+ 
@@ -548,1 +548,1 @@ src/components/pricing/PricingEngineView.tsx
-             {/* Resolved Rule Card */}
+           {/* Right Column: Engine Output & Pricing Snapshot (5 cols) */}
@@ -549,1 +549,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
+           <div className="lg:col-span-5 space-y-6">
@@ -550,1 +550,1 @@ src/components/pricing/PricingEngineView.tsx
-               <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-3">
+             
@@ -551,1 +551,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <Sparkles className="w-3.5 h-3.5 text-amber-600" />
+             {/* Resolved Rule Card */}
@@ -552,1 +552,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span>نتيجة حل قاعدة التسعير (Resolved Pricing Rule)</span>
+             <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
@@ -553,1 +553,1 @@ src/components/pricing/PricingEngineView.tsx
-               </h3>
+               <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-3">
@@ -554,1 +554,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 <Sparkles className="w-3.5 h-3.5 text-amber-600" />
@@ -555,1 +555,1 @@ src/components/pricing/PricingEngineView.tsx
-               {interactiveResolution.rule ? (
+                 <span>نتيجة حل قاعدة التسعير (Resolved Pricing Rule)</span>
@@ -556,1 +556,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="space-y-3">
+               </h3>
@@ -557,1 +557,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
+ 
@@ -558,1 +558,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex justify-between items-center">
+               {interactiveResolution.rule ? (
@@ -559,1 +559,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-stone-500">معرّف القاعدة (Rule ID):</span>
+                 <div className="space-y-3">
@@ -560,1 +560,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="font-mono font-bold text-stone-900">{interactiveResolution.rule.pricingRuleId}</span>
+                   <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
@@ -561,1 +561,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                     <div className="flex justify-between items-center">
@@ -562,1 +562,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex justify-between items-center">
+                       <span className="text-stone-500">معرّف القاعدة (Rule ID):</span>
@@ -563,1 +563,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-stone-500">نوع التسعير (pricingType):</span>
+                       <span className="font-mono font-bold text-stone-900">{interactiveResolution.rule.pricingRuleId}</span>
@@ -564,1 +564,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
+                     </div>
@@ -565,1 +565,1 @@ src/components/pricing/PricingEngineView.tsx
-                         interactiveResolution.rule.pricingType === 'PER_TRIP' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
+                     <div className="flex justify-between items-center">
@@ -566,1 +566,1 @@ src/components/pricing/PricingEngineView.tsx
-                       }`}>
+                       <span className="text-stone-500">نوع التسعير (pricingType):</span>
@@ -567,1 +567,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {interactiveResolution.rule.pricingType}
+                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
@@ -568,1 +568,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </span>
+                         interactiveResolution.rule.pricingType === 'PER_TRIP' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
@@ -569,1 +569,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                       }`}>
@@ -570,1 +570,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex justify-between items-center">
+                         {interactiveResolution.rule.pricingType}
@@ -571,1 +571,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-stone-500">السعر المتفق عليه (rate):</span>
+                       </span>
@@ -572,1 +572,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="font-bold text-amber-700 font-mono text-sm">
+                     </div>
@@ -573,1 +573,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {interactiveResolution.rule.rate} {interactiveResolution.rule.currency}
+                     <div className="flex justify-between items-center">
@@ -574,1 +574,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {interactiveResolution.rule.pricingType === 'PER_TON' ? ' / طن' : ' / رد'}
+                       <span className="text-stone-500">السعر المتفق عليه (rate):</span>
@@ -575,1 +575,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </span>
+                       <span className="font-bold text-amber-700 font-mono text-sm">
@@ -576,1 +576,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                         {interactiveResolution.rule.rate} {interactiveResolution.rule.currency}
@@ -577,1 +577,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex justify-between items-center">
+                         {interactiveResolution.rule.pricingType === 'PER_TON' ? ' / طن' : ' / رد'}
@@ -578,1 +578,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-stone-500">فترة السريان (effective):</span>
+                       </span>
@@ -579,1 +579,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="font-mono text-[11px] text-stone-700">
+                     </div>
@@ -580,1 +580,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {interactiveResolution.rule.effectiveFrom} ➔ {interactiveResolution.rule.effectiveTo}
+                     <div className="flex justify-between items-center">
@@ -581,1 +581,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </span>
+                       <span className="text-stone-500">فترة السريان (effective):</span>
@@ -582,1 +582,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                       <span className="font-mono text-[11px] text-stone-700">
@@ -583,1 +583,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="flex justify-between items-center">
+                         {interactiveResolution.rule.effectiveFrom} ➔ {interactiveResolution.rule.effectiveTo}
@@ -584,1 +584,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-stone-500">المادة المطبقة:</span>
+                       </span>
@@ -585,1 +585,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-stone-800 font-medium">
+                     </div>
@@ -586,1 +586,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {interactiveResolution.rule.materialId || 'جميع المواد (General Tariff)'}
+                     <div className="flex justify-between items-center">
@@ -587,1 +587,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </span>
+                       <span className="text-stone-500">المادة المطبقة:</span>
@@ -588,1 +588,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                       <span className="text-stone-800 font-medium">
@@ -589,1 +589,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                         {interactiveResolution.rule.materialId || 'جميع المواد (General Tariff)'}
@@ -590,1 +590,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                       </span>
@@ -591,1 +591,1 @@ src/components/pricing/PricingEngineView.tsx
-                   {/* Final Settlement Result */}
+                     </div>
@@ -592,1 +592,1 @@ src/components/pricing/PricingEngineView.tsx
-                   {interactiveSettlement && (
+                   </div>
@@ -593,1 +593,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-xl">
+ 
@@ -594,1 +594,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <div className="flex items-center justify-between mb-1">
+                   {/* Final Settlement Result */}
@@ -595,1 +595,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <span className="text-xs font-bold text-amber-950">مستحق التسوية النهائي (Server Calculated):</span>
+                   {interactiveSettlement && (
@@ -596,1 +596,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <span className="text-lg font-black text-amber-900 font-mono">
+                     <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-xl">
@@ -597,1 +597,1 @@ src/components/pricing/PricingEngineView.tsx
-                           {interactiveSettlement.settlementAmount.toLocaleString()} SAR
+                       <div className="flex items-center justify-between mb-1">
@@ -598,1 +598,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </span>
+                         <span className="text-xs font-bold text-amber-950">مستحق التسوية النهائي (Server Calculated):</span>
@@ -599,1 +599,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </div>
+                         <span className="text-lg font-black text-amber-900 font-mono">
@@ -600,1 +600,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
+                           {interactiveSettlement.settlementAmount.toLocaleString()} SAR
@@ -601,1 +601,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {interactiveSettlement.calculationDetailsAr}
+                         </span>
@@ -602,1 +602,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </p>
+                       </div>
@@ -603,1 +603,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                       <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
@@ -604,1 +604,1 @@ src/components/pricing/PricingEngineView.tsx
-                       {simulateClientTamper && (
+                         {interactiveSettlement.calculationDetailsAr}
@@ -605,1 +605,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <div className="mt-2.5 p-2 bg-rose-100/80 border border-rose-300 rounded-lg text-[11px] text-rose-800 flex items-start gap-1.5">
+                       </p>
@@ -606,1 +606,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
+ 
@@ -607,1 +607,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <span>
+                       {simulateClientTamper && (
@@ -608,1 +608,1 @@ src/components/pricing/PricingEngineView.tsx
-                             <strong>محاولة اختراق محبطة:</strong> تم تجاهل المبلغ المزور المدخل من المتصفح ({tamperedAmount} SAR) وفرض حساب السيرفر الصارم ({interactiveSettlement.settlementAmount} SAR).
+                         <div className="mt-2.5 p-2 bg-rose-100/80 border border-rose-300 rounded-lg text-[11px] text-rose-800 flex items-start gap-1.5">
@@ -609,1 +609,1 @@ src/components/pricing/PricingEngineView.tsx
-                           </span>
+                           <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
@@ -610,1 +610,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </div>
+                           <span>
@@ -611,1 +611,1 @@ src/components/pricing/PricingEngineView.tsx
-                       )}
+                             <strong>محاولة اختراق محبطة:</strong> تم تجاهل المبلغ المزور المدخل من المتصفح ({tamperedAmount} SAR) وفرض حساب السيرفر الصارم ({interactiveSettlement.settlementAmount} SAR).
@@ -612,1 +612,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                           </span>
@@ -613,1 +613,1 @@ src/components/pricing/PricingEngineView.tsx
-                   )}
+                         </div>
@@ -614,1 +614,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                       )}
@@ -615,1 +615,1 @@ src/components/pricing/PricingEngineView.tsx
-               ) : (
+                     </div>
@@ -616,1 +616,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
+                   )}
@@ -617,1 +617,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="flex items-center gap-2 font-bold mb-1">
+                 </div>
@@ -618,1 +618,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <XCircle className="w-4 h-4 text-rose-600" />
+               ) : (
@@ -619,1 +619,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span>تعذر تحديد تسعيرة الرحلة ({interactiveResolution.reasonCode})</span>
+                 <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
@@ -620,1 +620,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                   <div className="flex items-center gap-2 font-bold mb-1">
@@ -621,1 +621,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <p className="text-[11px] text-rose-700">
+                     <XCircle className="w-4 h-4 text-rose-600" />
@@ -622,1 +622,1 @@ src/components/pricing/PricingEngineView.tsx
-                     {interactiveResolution.reasonAr}
+                     <span>تعذر تحديد تسعيرة الرحلة ({interactiveResolution.reasonCode})</span>
@@ -623,1 +623,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </p>
+                   </div>
@@ -624,1 +624,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                   <p className="text-[11px] text-rose-700">
@@ -625,1 +625,1 @@ src/components/pricing/PricingEngineView.tsx
-               )}
+                     {interactiveResolution.reasonAr}
@@ -626,1 +626,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+                   </p>
@@ -627,1 +627,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 </div>
@@ -628,1 +628,1 @@ src/components/pricing/PricingEngineView.tsx
-             {/* Pricing Snapshot Card */}
+               )}
@@ -629,1 +629,1 @@ src/components/pricing/PricingEngineView.tsx
-             {interactiveSettlement && (
+             </div>
@@ -630,1 +630,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-xs">
+ 
@@ -631,1 +631,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="flex items-center justify-between mb-2">
+             {/* Pricing Snapshot Card */}
@@ -632,1 +632,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <h3 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
+             {interactiveSettlement && (
@@ -633,1 +633,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <Lock className="w-3.5 h-3.5 text-amber-400" />
+               <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-xs">
@@ -634,1 +634,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span>اللقطة المجمدة في وثيقة الرحلة (Trip.pricingSnapshot)</span>
+                 <div className="flex items-center justify-between mb-2">
@@ -635,1 +635,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </h3>
+                   <h3 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
@@ -636,1 +636,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <span className="text-[10px] text-stone-400 font-mono">Immutable COW Snapshot</span>
+                     <Lock className="w-3.5 h-3.5 text-amber-400" />
@@ -637,1 +637,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     <span>اللقطة المجمدة في وثيقة الرحلة (Trip.pricingSnapshot)</span>
@@ -638,1 +638,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <p className="text-[11px] text-stone-400 mb-3">
+                   </h3>
@@ -639,1 +639,1 @@ src/components/pricing/PricingEngineView.tsx
-                   يتم تجميد هذه اللقطة داخل وثيقة الرحلة في Firestore ولا تتأثر مستقبلاً عند تحديث الأسعار:
+                   <span className="text-[10px] text-stone-400 font-mono">Immutable COW Snapshot</span>
@@ -640,1 +640,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </p>
+                 </div>
@@ -641,1 +641,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <pre className="text-[11px] font-mono bg-stone-950 p-3 rounded-xl border border-stone-800 text-amber-300 overflow-x-auto">
+                 <p className="text-[11px] text-stone-400 mb-3">
@@ -642,1 +642,1 @@ src/components/pricing/PricingEngineView.tsx
- {JSON.stringify(interactiveSettlement.snapshot, null, 2)}
+                   يتم تجميد هذه اللقطة داخل وثيقة الرحلة في Firestore ولا تتأثر مستقبلاً عند تحديث الأسعار:
@@ -643,1 +643,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </pre>
+                 </p>
@@ -644,1 +644,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                 <pre className="text-[11px] font-mono bg-stone-950 p-3 rounded-xl border border-stone-800 text-amber-300 overflow-x-auto">
@@ -645,1 +645,1 @@ src/components/pricing/PricingEngineView.tsx
-             )}
+ {JSON.stringify(interactiveSettlement.snapshot, null, 2)}
@@ -646,1 +646,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 </pre>
@@ -647,1 +647,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+               </div>
@@ -648,1 +648,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+             )}
@@ -649,1 +649,1 @@ src/components/pricing/PricingEngineView.tsx
-       )}
+ 
@@ -650,1 +650,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+           </div>
@@ -651,1 +651,1 @@ src/components/pricing/PricingEngineView.tsx
-       {/* ================= TAB 2: CONTRACTUAL AGREEMENTS & COW ================= */}
+         </div>
@@ -652,1 +652,1 @@ src/components/pricing/PricingEngineView.tsx
-       {activeTab === 'RULES' && (
+       )}
@@ -653,1 +653,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="space-y-6" id="rules-view">
+ 
@@ -654,1 +654,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 p-5">
+       {/* ================= TAB 2: CONTRACTUAL AGREEMENTS & COW ================= */}
@@ -655,1 +655,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div>
+       {activeTab === 'RULES' && (
@@ -656,1 +656,1 @@ src/components/pricing/PricingEngineView.tsx
-               <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
+         <div className="space-y-6" id="rules-view">
@@ -657,1 +657,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <FileText className="w-4 h-4 text-amber-600" />
+           <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 p-5">
@@ -658,1 +658,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span>سجل الاتفاقيات وقواعد التسعير التعاقدية (Project Pricing Rules)</span>
+             <div>
@@ -659,1 +659,1 @@ src/components/pricing/PricingEngineView.tsx
-               </h2>
+               <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
@@ -660,1 +660,1 @@ src/components/pricing/PricingEngineView.tsx
-               <p className="text-xs text-stone-500 mt-1">
+                 <FileText className="w-4 h-4 text-amber-600" />
@@ -661,1 +661,1 @@ src/components/pricing/PricingEngineView.tsx
-                 جميع القواعد محددة ومرتبطة بنواقل ومواد وتواريخ صريحة. لتحديث أي سعر، يتم تطبيق نظام النسخ عند التعديل (Copy-on-Write) لإنشاء إصدار جديد (v2) دون المساس بالرحلات القديمة.
+                 <span>سجل الاتفاقيات وقواعد التسعير التعاقدية (Project Pricing Rules)</span>
@@ -662,1 +662,1 @@ src/components/pricing/PricingEngineView.tsx
-               </p>
+               </h2>
@@ -663,1 +663,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+               <p className="text-xs text-stone-500 mt-1">
@@ -664,1 +664,1 @@ src/components/pricing/PricingEngineView.tsx
-             <button
+                 جميع القواعد محددة ومرتبطة بنواقل ومواد وتواريخ صريحة. لتحديث أي سعر، يتم تطبيق نظام النسخ عند التعديل (Copy-on-Write) لإنشاء إصدار جديد (v2) دون المساس بالرحلات القديمة.
@@ -665,1 +665,1 @@ src/components/pricing/PricingEngineView.tsx
-               id="btn-add-contract-rule"
+               </p>
@@ -666,1 +666,1 @@ src/components/pricing/PricingEngineView.tsx
-               onClick={() => setShowAddModal(true)}
+             </div>
@@ -667,1 +667,1 @@ src/components/pricing/PricingEngineView.tsx
-               className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
+             <button
@@ -668,1 +668,1 @@ src/components/pricing/PricingEngineView.tsx
-             >
+               id="btn-add-contract-rule"
@@ -669,1 +669,1 @@ src/components/pricing/PricingEngineView.tsx
-               <Plus className="w-4 h-4" />
+               onClick={() => setShowAddModal(true)}
@@ -670,1 +670,1 @@ src/components/pricing/PricingEngineView.tsx
-               <span>إضافة اتفاقية تسعير جديدة</span>
+               className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
@@ -671,1 +671,1 @@ src/components/pricing/PricingEngineView.tsx
-             </button>
+             >
@@ -672,1 +672,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+               <Plus className="w-4 h-4" />
@@ -673,1 +673,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               <span>إضافة اتفاقية تسعير جديدة</span>
@@ -674,1 +674,1 @@ src/components/pricing/PricingEngineView.tsx
-           {/* Rules Table */}
+             </button>
@@ -675,1 +675,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
+           </div>
@@ -676,1 +676,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="overflow-x-auto">
+ 
@@ -677,1 +677,1 @@ src/components/pricing/PricingEngineView.tsx
-               <table className="w-full text-right text-xs">
+           {/* Rules Table */}
@@ -678,1 +678,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
+           <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
@@ -679,1 +679,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <tr>
+             <div className="overflow-x-auto">
@@ -680,1 +680,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">معرّف القاعدة والإصدار</th>
+               <table className="w-full text-right text-xs">
@@ -681,1 +681,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">الناقل</th>
+                 <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
@@ -682,1 +682,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">المادة</th>
+                   <tr>
@@ -683,1 +683,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">نوع التسعير</th>
+                     <th className="p-3">معرّف القاعدة والإصدار</th>
@@ -684,1 +684,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">السعر المتفق عليه</th>
+                     <th className="p-3">الناقل</th>
@@ -685,1 +685,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">فترة السريان</th>
+                     <th className="p-3">المادة</th>
@@ -686,1 +686,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3">الحالة والنزاهة</th>
+                     <th className="p-3">نوع التسعير</th>
@@ -687,1 +687,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <th className="p-3 text-center">الإجراءات (COW)</th>
+                     <th className="p-3">السعر المتفق عليه</th>
@@ -688,1 +688,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </tr>
+                     <th className="p-3">فترة السريان</th>
@@ -689,1 +689,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </thead>
+                     <th className="p-3">الحالة والنزاهة</th>
@@ -690,1 +690,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <tbody className="divide-y divide-stone-100">
+                     <th className="p-3 text-center">الإجراءات (COW)</th>
@@ -691,1 +691,1 @@ src/components/pricing/PricingEngineView.tsx
-                   {rules.map((rule) => (
+                   </tr>
@@ -692,1 +692,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <tr key={rule.pricingRuleId} className={rule.status === 'INACTIVE' ? 'bg-stone-50/50 opacity-70' : 'hover:bg-amber-50/30'}>
+                 </thead>
@@ -693,1 +693,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3 font-mono font-bold text-stone-900">
+                 <tbody className="divide-y divide-stone-100">
@@ -694,1 +694,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <div className="flex items-center gap-1.5">
+                   {rules.map((rule) => (
@@ -695,1 +695,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <span>{rule.pricingRuleId}</span>
+                     <tr key={rule.pricingRuleId} className={rule.status === 'INACTIVE' ? 'bg-stone-50/50 opacity-70' : 'hover:bg-amber-50/30'}>
@@ -696,1 +696,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-bold font-mono">
+                       <td className="p-3 font-mono font-bold text-stone-900">
@@ -697,1 +697,1 @@ src/components/pricing/PricingEngineView.tsx
-                             v{rule.version || 1}
+                         <div className="flex items-center gap-1.5">
@@ -698,1 +698,1 @@ src/components/pricing/PricingEngineView.tsx
-                           </span>
+                           <span>{rule.pricingRuleId}</span>
@@ -699,1 +699,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </div>
+                           <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-bold font-mono">
@@ -700,1 +700,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </td>
+                             v{rule.version || 1}
@@ -701,1 +701,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3 font-medium text-stone-800">{rule.carrierId}</td>
+                           </span>
@@ -702,1 +702,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3 text-stone-600">
+                         </div>
@@ -703,1 +703,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {rule.materialId ? (
+                       </td>
@@ -704,1 +704,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800 font-mono">
+                       <td className="p-3 font-medium text-stone-800">{rule.carrierId}</td>
@@ -705,1 +705,1 @@ src/components/pricing/PricingEngineView.tsx
-                             {rule.materialId}
+                       <td className="p-3 text-stone-600">
@@ -706,1 +706,1 @@ src/components/pricing/PricingEngineView.tsx
-                           </span>
+                         {rule.materialId ? (
@@ -707,1 +707,1 @@ src/components/pricing/PricingEngineView.tsx
-                         ) : (
+                           <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800 font-mono">
@@ -708,1 +708,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <span className="text-stone-400">جميع المواد (عام)</span>
+                             {rule.materialId}
@@ -709,1 +709,1 @@ src/components/pricing/PricingEngineView.tsx
-                         )}
+                           </span>
@@ -710,1 +710,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </td>
+                         ) : (
@@ -711,1 +711,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3">
+                           <span className="text-stone-400">جميع المواد (عام)</span>
@@ -712,1 +712,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
+                         )}
@@ -713,1 +713,1 @@ src/components/pricing/PricingEngineView.tsx
-                           rule.pricingType === 'PER_TRIP' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
+                       </td>
@@ -714,1 +714,1 @@ src/components/pricing/PricingEngineView.tsx
-                         }`}>
+                       <td className="p-3">
@@ -715,1 +715,1 @@ src/components/pricing/PricingEngineView.tsx
-                           {rule.pricingType}
+                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
@@ -716,1 +716,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </span>
+                           rule.pricingType === 'PER_TRIP' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
@@ -717,1 +717,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </td>
+                         }`}>
@@ -718,1 +718,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3 font-bold text-amber-800 font-mono text-sm">
+                           {rule.pricingType}
@@ -719,1 +719,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {rule.rate} {rule.currency}
+                         </span>
@@ -721,1 +721,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3 font-mono text-[11px] text-stone-600">
+                       <td className="p-3 font-bold text-amber-800 font-mono text-sm">
@@ -722,1 +722,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {rule.effectiveFrom} ➔ {rule.effectiveTo}
+                         {rule.rate} {rule.currency}
@@ -724,1 +724,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3">
+                       <td className="p-3 font-mono text-[11px] text-stone-600">
@@ -725,1 +725,1 @@ src/components/pricing/PricingEngineView.tsx
-                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
+                         {rule.effectiveFrom} ➔ {rule.effectiveTo}
@@ -726,1 +726,1 @@ src/components/pricing/PricingEngineView.tsx
-                           rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
+                       </td>
@@ -727,1 +727,1 @@ src/components/pricing/PricingEngineView.tsx
-                         }`}>
+                       <td className="p-3">
@@ -728,1 +728,1 @@ src/components/pricing/PricingEngineView.tsx
-                           {rule.status === 'ACTIVE' ? 'نشطة سارية' : 'مؤرشفة تاريخياً'}
+                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
@@ -729,1 +729,1 @@ src/components/pricing/PricingEngineView.tsx
-                         </span>
+                           rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
@@ -730,1 +730,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </td>
+                         }`}>
@@ -731,1 +731,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <td className="p-3 text-center">
+                           {rule.status === 'ACTIVE' ? 'نشطة سارية' : 'مؤرشفة تاريخياً'}
@@ -732,1 +732,1 @@ src/components/pricing/PricingEngineView.tsx
-                         {rule.status === 'ACTIVE' ? (
+                         </span>
@@ -733,1 +733,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <button
+                       </td>
@@ -734,1 +734,1 @@ src/components/pricing/PricingEngineView.tsx
-                             onClick={() => {
+                       <td className="p-3 text-center">
@@ -735,1 +735,1 @@ src/components/pricing/PricingEngineView.tsx
-                               setVersioningRule(rule);
+                         {rule.status === 'ACTIVE' ? (
@@ -736,1 +736,1 @@ src/components/pricing/PricingEngineView.tsx
-                               setUpdatedRate(rule.rate);
+                           <button
@@ -737,1 +737,1 @@ src/components/pricing/PricingEngineView.tsx
-                             }}
+                             onClick={() => {
@@ -738,1 +738,1 @@ src/components/pricing/PricingEngineView.tsx
-                             className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-700 transition-all flex items-center gap-1 mx-auto cursor-pointer"
+                               setVersioningRule(rule);
@@ -739,1 +739,1 @@ src/components/pricing/PricingEngineView.tsx
-                             title="تعديل السعر بإنشاء نسخة جديدة لحماية الرحلات السابقة"
+                               setUpdatedRate(rule.rate);
@@ -740,1 +740,1 @@ src/components/pricing/PricingEngineView.tsx
-                           >
+                             }}
@@ -741,1 +741,1 @@ src/components/pricing/PricingEngineView.tsx
-                             <History className="w-3.5 h-3.5 text-amber-600" />
+                             className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-700 transition-all flex items-center gap-1 mx-auto cursor-pointer"
@@ -742,1 +742,1 @@ src/components/pricing/PricingEngineView.tsx
-                             <span>تحديث عبر COW</span>
+                             title="تعديل السعر بإنشاء نسخة جديدة لحماية الرحلات السابقة"
@@ -743,1 +743,1 @@ src/components/pricing/PricingEngineView.tsx
-                           </button>
+                           >
@@ -744,1 +744,1 @@ src/components/pricing/PricingEngineView.tsx
-                         ) : (
+                             <History className="w-3.5 h-3.5 text-amber-600" />
@@ -745,1 +745,1 @@ src/components/pricing/PricingEngineView.tsx
-                           <span className="text-[10px] text-stone-400">محمية تاريخياً</span>
+                             <span>تحديث عبر COW</span>
@@ -746,1 +746,1 @@ src/components/pricing/PricingEngineView.tsx
-                         )}
+                           </button>
@@ -747,1 +747,1 @@ src/components/pricing/PricingEngineView.tsx
-                       </td>
+                         ) : (
@@ -748,1 +748,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </tr>
+                           <span className="text-[10px] text-stone-400">محمية تاريخياً</span>
@@ -749,1 +749,1 @@ src/components/pricing/PricingEngineView.tsx
-                   ))}
+                         )}
@@ -750,1 +750,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </tbody>
+                       </td>
@@ -751,1 +751,1 @@ src/components/pricing/PricingEngineView.tsx
-               </table>
+                     </tr>
@@ -752,1 +752,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+                   ))}
@@ -753,1 +753,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+                 </tbody>
@@ -754,1 +754,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+               </table>
@@ -755,1 +755,1 @@ src/components/pricing/PricingEngineView.tsx
-       )}
+             </div>
@@ -756,1 +756,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+           </div>
@@ -757,1 +757,1 @@ src/components/pricing/PricingEngineView.tsx
-       {/* ================= TAB 3: 34 TEST SUITE MATRIX ================= */}
+         </div>
@@ -758,1 +758,1 @@ src/components/pricing/PricingEngineView.tsx
-       {activeTab === 'TESTS' && (
+       )}
@@ -759,1 +759,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs" id="tests-matrix-view">
+ 
@@ -760,1 +760,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-stone-100 pb-4">
+       {/* ================= TAB 3: 34 TEST SUITE MATRIX ================= */}
@@ -761,1 +761,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div>
+       {activeTab === 'TESTS' && (
@@ -762,1 +762,1 @@ src/components/pricing/PricingEngineView.tsx
-               <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
+         <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs" id="tests-matrix-view">
@@ -763,1 +763,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <ShieldCheck className="w-5 h-5 text-emerald-600" />
+           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-stone-100 pb-4">
@@ -764,1 +764,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span>مصفوفة الاختبارات المعمارية الشاملة (34/34 Architecture Tests)</span>
+             <div>
@@ -765,1 +765,1 @@ src/components/pricing/PricingEngineView.tsx
-               </h2>
+               <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
@@ -766,1 +766,1 @@ src/components/pricing/PricingEngineView.tsx
-               <p className="text-xs text-stone-500 mt-1">
+                 <ShieldCheck className="w-5 h-5 text-emerald-600" />
@@ -767,1 +767,1 @@ src/components/pricing/PricingEngineView.tsx
-                 تغطي الحالات الـ 34 الإلزامية في وثيقة BLOCK 36: carrier specificity, material overrides, date selection, ambiguous overlap, zero fallback, copy-on-write, and importer integration.
+                 <span>مصفوفة الاختبارات المعمارية الشاملة (34/34 Architecture Tests)</span>
@@ -768,1 +768,1 @@ src/components/pricing/PricingEngineView.tsx
-               </p>
+               </h2>
@@ -769,1 +769,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+               <p className="text-xs text-stone-500 mt-1">
@@ -770,1 +770,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 تغطي الحالات الـ 34 الإلزامية في وثيقة BLOCK 36: carrier specificity, material overrides, date selection, ambiguous overlap, zero fallback, copy-on-write, and importer integration.
@@ -771,1 +771,1 @@ src/components/pricing/PricingEngineView.tsx
-             {/* Search and Run */}
+               </p>
@@ -772,1 +772,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="flex items-center gap-3">
+             </div>
@@ -773,1 +773,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="relative">
+ 
@@ -774,1 +774,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <input
+             {/* Search and Run */}
@@ -775,1 +775,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="text"
+             <div className="flex items-center gap-3">
@@ -776,1 +776,1 @@ src/components/pricing/PricingEngineView.tsx
-                   placeholder="بحث في الاختبارات..."
+               <div className="relative">
@@ -777,1 +777,1 @@ src/components/pricing/PricingEngineView.tsx
-                   value={testSearch}
+                 <input
@@ -778,1 +778,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onChange={(e) => setTestSearch(e.target.value)}
+                   type="text"
@@ -779,1 +779,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="text-xs bg-stone-50 border border-stone-200 rounded-lg pr-8 pl-3 py-1.5 focus:bg-white focus:outline-none"
+                   placeholder="بحث في الاختبارات..."
@@ -780,1 +780,1 @@ src/components/pricing/PricingEngineView.tsx
-                 />
+                   value={testSearch}
@@ -781,1 +781,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
+                   onChange={(e) => setTestSearch(e.target.value)}
@@ -782,1 +782,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   className="text-xs bg-stone-50 border border-stone-200 rounded-lg pr-8 pl-3 py-1.5 focus:bg-white focus:outline-none"
@@ -783,1 +783,1 @@ src/components/pricing/PricingEngineView.tsx
-               <button
+                 />
@@ -784,1 +784,1 @@ src/components/pricing/PricingEngineView.tsx
-                 onClick={handleRunTests}
+                 <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
@@ -785,1 +785,1 @@ src/components/pricing/PricingEngineView.tsx
-                 disabled={isRunningTests}
+               </div>
@@ -786,1 +786,1 @@ src/components/pricing/PricingEngineView.tsx
-                 className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
+               <button
@@ -787,1 +787,1 @@ src/components/pricing/PricingEngineView.tsx
-               >
+                 onClick={handleRunTests}
@@ -788,1 +788,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
+                 disabled={isRunningTests}
@@ -789,1 +789,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span>إعادة الفحص</span>
+                 className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
@@ -790,1 +790,1 @@ src/components/pricing/PricingEngineView.tsx
-               </button>
+               >
@@ -791,1 +791,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+                 <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
@@ -792,1 +792,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+                 <span>إعادة الفحص</span>
@@ -793,1 +793,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               </button>
@@ -794,1 +794,1 @@ src/components/pricing/PricingEngineView.tsx
-           {/* Filter Pills */}
+             </div>
@@ -795,1 +795,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-stone-100">
+           </div>
@@ -796,1 +796,1 @@ src/components/pricing/PricingEngineView.tsx
-             {[
+ 
@@ -797,1 +797,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'ALL', label: 'الكل (34)' },
+           {/* Filter Pills */}
@@ -798,1 +798,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'RESOLUTION', label: 'حل التسعير' },
+           <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-stone-100">
@@ -799,1 +799,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'SPECIFICITY', label: 'تخصيص المواد' },
+             {[
@@ -800,1 +800,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'DATE_WINDOW', label: 'نطاقات التواريخ' },
+               { key: 'ALL', label: 'الكل (34)' },
@@ -801,1 +801,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'COLLISION', label: 'كشف التداخل' },
+               { key: 'RESOLUTION', label: 'حل التسعير' },
@@ -802,1 +802,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'NO_GUESS', label: 'منع التخمين' },
+               { key: 'SPECIFICITY', label: 'تخصيص المواد' },
@@ -803,1 +803,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'VALIDATION', label: 'التحقق الصارم' },
+               { key: 'DATE_WINDOW', label: 'نطاقات التواريخ' },
@@ -804,1 +804,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'ISOLATION', label: 'عزل المشاريع' },
+               { key: 'COLLISION', label: 'كشف التداخل' },
@@ -805,1 +805,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'IMMUTABILITY', label: 'حصانة اللقطات' },
+               { key: 'NO_GUESS', label: 'منع التخمين' },
@@ -806,1 +806,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'VERSIONING', label: 'نظام النسخ COW' },
+               { key: 'VALIDATION', label: 'التحقق الصارم' },
@@ -807,1 +807,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'SETTLEMENT', label: 'احتساب التسويات' },
+               { key: 'ISOLATION', label: 'عزل المشاريع' },
@@ -808,1 +808,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'ENTITY_RESOLUTION', label: 'ربط الكيانات' },
+               { key: 'IMMUTABILITY', label: 'حصانة اللقطات' },
@@ -809,1 +809,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'WEIGHBRIDGE', label: 'الميزان' },
+               { key: 'VERSIONING', label: 'نظام النسخ COW' },
@@ -810,1 +810,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'INTEGRATION', label: 'المستوردين المشتركين' },
+               { key: 'SETTLEMENT', label: 'احتساب التسويات' },
@@ -811,1 +811,1 @@ src/components/pricing/PricingEngineView.tsx
-               { key: 'CODE_AUDIT', label: 'فحص الكود' },
+               { key: 'ENTITY_RESOLUTION', label: 'ربط الكيانات' },
@@ -812,1 +812,1 @@ src/components/pricing/PricingEngineView.tsx
-             ].map((f) => (
+               { key: 'WEIGHBRIDGE', label: 'الميزان' },
@@ -813,1 +813,1 @@ src/components/pricing/PricingEngineView.tsx
-               <button
+               { key: 'INTEGRATION', label: 'المستوردين المشتركين' },
@@ -814,1 +814,1 @@ src/components/pricing/PricingEngineView.tsx
-                 key={f.key}
+               { key: 'CODE_AUDIT', label: 'فحص الكود' },
@@ -815,1 +815,1 @@ src/components/pricing/PricingEngineView.tsx
-                 onClick={() => setFilterCategory(f.key)}
+             ].map((f) => (
@@ -816,1 +816,1 @@ src/components/pricing/PricingEngineView.tsx
-                 className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
+               <button
@@ -817,1 +817,1 @@ src/components/pricing/PricingEngineView.tsx
-                   filterCategory === f.key 
+                 key={f.key}
@@ -818,1 +818,1 @@ src/components/pricing/PricingEngineView.tsx
-                     ? 'bg-amber-600 text-white font-bold' 
+                 onClick={() => setFilterCategory(f.key)}
@@ -819,1 +819,1 @@ src/components/pricing/PricingEngineView.tsx
-                     : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
+                 className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
@@ -820,1 +820,1 @@ src/components/pricing/PricingEngineView.tsx
-                 }`}
+                   filterCategory === f.key 
@@ -821,1 +821,1 @@ src/components/pricing/PricingEngineView.tsx
-               >
+                     ? 'bg-amber-600 text-white font-bold' 
@@ -822,1 +822,1 @@ src/components/pricing/PricingEngineView.tsx
-                 {f.label}
+                     : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
@@ -823,1 +823,1 @@ src/components/pricing/PricingEngineView.tsx
-               </button>
+                 }`}
@@ -824,1 +824,1 @@ src/components/pricing/PricingEngineView.tsx
-             ))}
+               >
@@ -825,1 +825,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+                 {f.label}
@@ -826,1 +826,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               </button>
@@ -827,1 +827,1 @@ src/components/pricing/PricingEngineView.tsx
-           {/* Test Cards Grid */}
+             ))}
@@ -828,1 +828,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
+           </div>
@@ -829,1 +829,1 @@ src/components/pricing/PricingEngineView.tsx
-             {filteredTests.map((test) => (
+ 
@@ -830,1 +830,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div
+           {/* Test Cards Grid */}
@@ -831,1 +831,1 @@ src/components/pricing/PricingEngineView.tsx
-                 key={test.id}
+           <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
@@ -832,1 +832,1 @@ src/components/pricing/PricingEngineView.tsx
-                 className={`p-3.5 rounded-xl border transition-all ${
+             {filteredTests.map((test) => (
@@ -833,1 +833,1 @@ src/components/pricing/PricingEngineView.tsx
-                   test.passed 
+               <div
@@ -834,1 +834,1 @@ src/components/pricing/PricingEngineView.tsx
-                     ? 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-xs' 
+                 key={test.id}
@@ -835,1 +835,1 @@ src/components/pricing/PricingEngineView.tsx
-                     : 'bg-rose-50 border-rose-200'
+                 className={`p-3.5 rounded-xl border transition-all ${
@@ -836,1 +836,1 @@ src/components/pricing/PricingEngineView.tsx
-                 }`}
+                   test.passed 
@@ -837,1 +837,1 @@ src/components/pricing/PricingEngineView.tsx
-               >
+                     ? 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-xs' 
@@ -838,1 +838,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="flex items-start justify-between gap-2 mb-2">
+                     : 'bg-rose-50 border-rose-200'
@@ -839,1 +839,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div className="flex items-center gap-2">
+                 }`}
@@ -840,1 +840,1 @@ src/components/pricing/PricingEngineView.tsx
-                     {test.passed ? (
+               >
@@ -841,1 +841,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
+                 <div className="flex items-start justify-between gap-2 mb-2">
@@ -842,1 +842,1 @@ src/components/pricing/PricingEngineView.tsx
-                     ) : (
+                   <div className="flex items-center gap-2">
@@ -843,1 +843,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
+                     {test.passed ? (
@@ -844,1 +844,1 @@ src/components/pricing/PricingEngineView.tsx
-                     )}
+                       <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
@@ -845,1 +845,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <div>
+                     ) : (
@@ -846,1 +846,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <span className="text-[10px] font-mono font-bold text-amber-700 ml-1.5">[{test.id}]</span>
+                       <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
@@ -847,1 +847,1 @@ src/components/pricing/PricingEngineView.tsx
-                       <strong className="text-xs text-stone-900">{test.titleAr}</strong>
+                     )}
@@ -848,1 +848,1 @@ src/components/pricing/PricingEngineView.tsx
-                     </div>
+                     <div>
@@ -849,1 +849,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                       <span className="text-[10px] font-mono font-bold text-amber-700 ml-1.5">[{test.id}]</span>
@@ -850,1 +850,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-bold shrink-0">
+                       <strong className="text-xs text-stone-900">{test.titleAr}</strong>
@@ -851,1 +851,1 @@ src/components/pricing/PricingEngineView.tsx
-                     {test.category}
+                     </div>
@@ -852,1 +852,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </span>
+                   </div>
@@ -853,1 +853,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                   <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-bold shrink-0">
@@ -854,1 +854,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                     {test.category}
@@ -855,1 +855,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div className="space-y-1 text-[10px] bg-stone-50 p-2 rounded-lg border border-stone-100 font-mono">
+                   </span>
@@ -856,1 +856,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div>
+                 </div>
@@ -857,1 +857,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span className="text-stone-400">Expected: </span>
+ 
@@ -858,1 +858,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span className="text-stone-700">{String(test.expected)}</span>
+                 <div className="space-y-1 text-[10px] bg-stone-50 p-2 rounded-lg border border-stone-100 font-mono">
@@ -859,1 +859,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                   <div>
@@ -860,1 +860,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <div>
+                     <span className="text-stone-400">Expected: </span>
@@ -861,1 +861,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span className="text-stone-400">Actual: </span>
+                     <span className="text-stone-700">{String(test.expected)}</span>
@@ -862,1 +862,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <span className="text-emerald-700 font-bold">{String(test.actual)}</span>
+                   </div>
@@ -863,1 +863,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </div>
+                   <div>
@@ -864,1 +864,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     <span className="text-stone-400">Actual: </span>
@@ -865,1 +865,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                     <span className="text-emerald-700 font-bold">{String(test.actual)}</span>
@@ -866,1 +866,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <p className="text-[11px] text-stone-600 mt-2 flex items-center gap-1.5">
+                   </div>
@@ -867,1 +867,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
+                 </div>
@@ -868,1 +868,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <span>{test.details}</span>
+ 
@@ -869,1 +869,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </p>
+                 <p className="text-[11px] text-stone-600 mt-2 flex items-center gap-1.5">
@@ -870,1 +870,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
@@ -871,1 +871,1 @@ src/components/pricing/PricingEngineView.tsx
-             ))}
+                   <span>{test.details}</span>
@@ -872,1 +872,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+                 </p>
@@ -873,1 +873,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+               </div>
@@ -874,1 +874,1 @@ src/components/pricing/PricingEngineView.tsx
-       )}
+             ))}
@@ -875,1 +875,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+           </div>
@@ -876,1 +876,1 @@ src/components/pricing/PricingEngineView.tsx
-       {/* ================= MODAL: ADD CONTRACTUAL RULE ================= */}
+         </div>
@@ -877,1 +877,1 @@ src/components/pricing/PricingEngineView.tsx
-       {showAddModal && (
+       )}
@@ -878,1 +878,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
+ 
@@ -879,1 +879,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
+       {/* ================= MODAL: ADD CONTRACTUAL RULE ================= */}
@@ -880,1 +880,1 @@ src/components/pricing/PricingEngineView.tsx
-             <h3 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
+       {showAddModal && (
@@ -881,1 +881,1 @@ src/components/pricing/PricingEngineView.tsx
-               <Plus className="w-5 h-5 text-amber-600" />
+         <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
@@ -882,1 +882,1 @@ src/components/pricing/PricingEngineView.tsx
-               <span>تسجيل اتفاقية تسعير تعاقدية جديدة</span>
+           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
@@ -883,1 +883,1 @@ src/components/pricing/PricingEngineView.tsx
-             </h3>
+             <h3 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
@@ -884,1 +884,1 @@ src/components/pricing/PricingEngineView.tsx
-             <p className="text-xs text-stone-500 mb-4">
+               <Plus className="w-5 h-5 text-amber-600" />
@@ -885,1 +885,1 @@ src/components/pricing/PricingEngineView.tsx
-               إدخال الشروط التعاقدية الصريحة مع فحص منع التداخل الزمني مع قواعد أخرى لنفس الناقل.
+               <span>تسجيل اتفاقية تسعير تعاقدية جديدة</span>
@@ -886,1 +886,1 @@ src/components/pricing/PricingEngineView.tsx
-             </p>
+             </h3>
@@ -887,1 +887,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+             <p className="text-xs text-stone-500 mb-4">
@@ -888,1 +888,1 @@ src/components/pricing/PricingEngineView.tsx
-             {formError && (
+               إدخال الشروط التعاقدية الصريحة مع فحص منع التداخل الزمني مع قواعد أخرى لنفس الناقل.
@@ -889,1 +889,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
+             </p>
@@ -890,1 +890,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
+ 
@@ -891,1 +891,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span>{formError}</span>
+             {formError && (
@@ -892,1 +892,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+               <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
@@ -893,1 +893,1 @@ src/components/pricing/PricingEngineView.tsx
-             )}
+                 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
@@ -894,1 +894,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 <span>{formError}</span>
@@ -895,1 +895,1 @@ src/components/pricing/PricingEngineView.tsx
-             <form onSubmit={handleAddRule} className="space-y-4">
+               </div>
@@ -896,1 +896,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div>
+             )}
@@ -897,1 +897,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <label className="block text-xs font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
+ 
@@ -898,1 +898,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <input
+             <form onSubmit={handleAddRule} className="space-y-4">
@@ -899,1 +899,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="text"
+               <div>
@@ -900,1 +900,1 @@ src/components/pricing/PricingEngineView.tsx
-                   required
+                 <label className="block text-xs font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
@@ -901,1 +901,1 @@ src/components/pricing/PricingEngineView.tsx
-                   value={newCarrierId}
+                 <input
@@ -902,1 +902,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onChange={(e) => setNewCarrierId(e.target.value)}
+                   type="text"
@@ -903,1 +903,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
+                   required
@@ -904,1 +904,1 @@ src/components/pricing/PricingEngineView.tsx
-                   placeholder="مثال: CARRIER-ALMAJDOUIE"
+                   value={newCarrierId}
@@ -905,1 +905,1 @@ src/components/pricing/PricingEngineView.tsx
-                 />
+                   onChange={(e) => setNewCarrierId(e.target.value)}
@@ -906,1 +906,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
@@ -907,1 +907,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                   placeholder="مثال: CARRIER-ALMAJDOUIE"
@@ -908,1 +908,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="grid grid-cols-2 gap-3">
+                 />
@@ -909,1 +909,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div>
+               </div>
@@ -910,1 +910,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <label className="block text-xs font-bold text-stone-700 mb-1">المادة (اختياري):</label>
+ 
@@ -911,1 +911,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <input
+               <div className="grid grid-cols-2 gap-3">
@@ -912,1 +912,1 @@ src/components/pricing/PricingEngineView.tsx
-                     type="text"
+                 <div>
@@ -913,1 +913,1 @@ src/components/pricing/PricingEngineView.tsx
-                     value={newMaterialId}
+                   <label className="block text-xs font-bold text-stone-700 mb-1">المادة (اختياري):</label>
@@ -914,1 +914,1 @@ src/components/pricing/PricingEngineView.tsx
-                     onChange={(e) => setNewMaterialId(e.target.value)}
+                   <input
@@ -915,1 +915,1 @@ src/components/pricing/PricingEngineView.tsx
-                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
+                     type="text"
@@ -916,1 +916,1 @@ src/components/pricing/PricingEngineView.tsx
-                     placeholder="اترك فارغاً لجميع المواد"
+                     value={newMaterialId}
@@ -917,1 +917,1 @@ src/components/pricing/PricingEngineView.tsx
-                   />
+                     onChange={(e) => setNewMaterialId(e.target.value)}
@@ -918,1 +918,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
@@ -919,1 +919,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div>
+                     placeholder="اترك فارغاً لجميع المواد"
@@ -920,1 +920,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <label className="block text-xs font-bold text-stone-700 mb-1">نوع التسعير:</label>
+                   />
@@ -921,1 +921,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <select
+                 </div>
@@ -922,1 +922,1 @@ src/components/pricing/PricingEngineView.tsx
-                     value={newPricingType}
+                 <div>
@@ -923,1 +923,1 @@ src/components/pricing/PricingEngineView.tsx
-                     onChange={(e) => setNewPricingType(e.target.value as any)}
+                   <label className="block text-xs font-bold text-stone-700 mb-1">نوع التسعير:</label>
@@ -924,1 +924,1 @@ src/components/pricing/PricingEngineView.tsx
-                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
+                   <select
@@ -925,1 +925,1 @@ src/components/pricing/PricingEngineView.tsx
-                   >
+                     value={newPricingType}
@@ -926,1 +926,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <option value="PER_TON">PER_TON (حساب بالطن الصافي)</option>
+                     onChange={(e) => setNewPricingType(e.target.value as any)}
@@ -927,1 +927,1 @@ src/components/pricing/PricingEngineView.tsx
-                     <option value="PER_TRIP">PER_TRIP (مقطوع بالرد الواحد)</option>
+                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
@@ -928,1 +928,1 @@ src/components/pricing/PricingEngineView.tsx
-                   </select>
+                   >
@@ -929,1 +929,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     <option value="PER_TON">PER_TON (حساب بالطن الصافي)</option>
@@ -930,1 +930,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                     <option value="PER_TRIP">PER_TRIP (مقطوع بالرد الواحد)</option>
@@ -931,1 +931,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                   </select>
@@ -932,1 +932,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div>
+                 </div>
@@ -933,1 +933,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <label className="block text-xs font-bold text-stone-700 mb-1">السعر المتفق عليه (SAR):</label>
+               </div>
@@ -934,1 +934,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <input
+ 
@@ -935,1 +935,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="number"
+               <div>
@@ -936,1 +936,1 @@ src/components/pricing/PricingEngineView.tsx
-                   step="0.25"
+                 <label className="block text-xs font-bold text-stone-700 mb-1">السعر المتفق عليه (SAR):</label>
@@ -937,1 +937,1 @@ src/components/pricing/PricingEngineView.tsx
-                   required
+                 <input
@@ -938,1 +938,1 @@ src/components/pricing/PricingEngineView.tsx
-                   min="0.01"
+                   type="number"
@@ -939,1 +939,1 @@ src/components/pricing/PricingEngineView.tsx
-                   value={newRate}
+                   step="0.25"
@@ -940,1 +940,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
+                   required
@@ -941,1 +941,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono font-bold"
+                   min="0.01"
@@ -942,1 +942,1 @@ src/components/pricing/PricingEngineView.tsx
-                 />
+                   value={newRate}
@@ -943,1 +943,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
@@ -944,1 +944,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono font-bold"
@@ -945,1 +945,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="grid grid-cols-2 gap-3">
+                 />
@@ -946,1 +946,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div>
+               </div>
@@ -947,1 +947,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <label className="block text-xs font-bold text-stone-700 mb-1">ساري من تاريخ:</label>
+ 
@@ -948,1 +948,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <input
+               <div className="grid grid-cols-2 gap-3">
@@ -949,1 +949,1 @@ src/components/pricing/PricingEngineView.tsx
-                     type="date"
+                 <div>
@@ -950,1 +950,1 @@ src/components/pricing/PricingEngineView.tsx
-                     required
+                   <label className="block text-xs font-bold text-stone-700 mb-1">ساري من تاريخ:</label>
@@ -951,1 +951,1 @@ src/components/pricing/PricingEngineView.tsx
-                     value={newEffectiveFrom}
+                   <input
@@ -952,1 +952,1 @@ src/components/pricing/PricingEngineView.tsx
-                     onChange={(e) => setNewEffectiveFrom(e.target.value)}
+                     type="date"
@@ -953,1 +953,1 @@ src/components/pricing/PricingEngineView.tsx
-                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
+                     required
@@ -954,1 +954,1 @@ src/components/pricing/PricingEngineView.tsx
-                   />
+                     value={newEffectiveFrom}
@@ -955,1 +955,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     onChange={(e) => setNewEffectiveFrom(e.target.value)}
@@ -956,1 +956,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <div>
+                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
@@ -957,1 +957,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <label className="block text-xs font-bold text-stone-700 mb-1">ساري إلى تاريخ:</label>
+                   />
@@ -958,1 +958,1 @@ src/components/pricing/PricingEngineView.tsx
-                   <input
+                 </div>
@@ -959,1 +959,1 @@ src/components/pricing/PricingEngineView.tsx
-                     type="date"
+                 <div>
@@ -960,1 +960,1 @@ src/components/pricing/PricingEngineView.tsx
-                     required
+                   <label className="block text-xs font-bold text-stone-700 mb-1">ساري إلى تاريخ:</label>
@@ -961,1 +961,1 @@ src/components/pricing/PricingEngineView.tsx
-                     value={newEffectiveTo}
+                   <input
@@ -962,1 +962,1 @@ src/components/pricing/PricingEngineView.tsx
-                     onChange={(e) => setNewEffectiveTo(e.target.value)}
+                     type="date"
@@ -963,1 +963,1 @@ src/components/pricing/PricingEngineView.tsx
-                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
+                     required
@@ -964,1 +964,1 @@ src/components/pricing/PricingEngineView.tsx
-                   />
+                     value={newEffectiveTo}
@@ -965,1 +965,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </div>
+                     onChange={(e) => setNewEffectiveTo(e.target.value)}
@@ -966,1 +966,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                     className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono"
@@ -967,1 +967,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                   />
@@ -968,1 +968,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
+                 </div>
@@ -969,1 +969,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <button
+               </div>
@@ -970,1 +970,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="button"
+ 
@@ -971,1 +971,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onClick={() => setShowAddModal(false)}
+               <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
@@ -972,1 +972,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
+                 <button
@@ -973,1 +973,1 @@ src/components/pricing/PricingEngineView.tsx
-                 >
+                   type="button"
@@ -974,1 +974,1 @@ src/components/pricing/PricingEngineView.tsx
-                   إلغاء
+                   onClick={() => setShowAddModal(false)}
@@ -975,1 +975,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </button>
+                   className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
@@ -976,1 +976,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <button
+                 >
@@ -977,1 +977,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="submit"
+                   {t("shared.actions.cancel")}</button>
@@ -978,1 +978,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
+                 <button
@@ -979,1 +979,1 @@ src/components/pricing/PricingEngineView.tsx
-                 >
+                   type="submit"
@@ -980,1 +980,1 @@ src/components/pricing/PricingEngineView.tsx
-                   اعتماد وحفظ الاتفاقية
+                   className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
@@ -981,1 +981,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </button>
+                 >
@@ -982,1 +982,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   اعتماد وحفظ الاتفاقية
@@ -983,1 +983,1 @@ src/components/pricing/PricingEngineView.tsx
-             </form>
+                 </button>
@@ -984,1 +984,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+               </div>
@@ -985,1 +985,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+             </form>
@@ -986,1 +986,1 @@ src/components/pricing/PricingEngineView.tsx
-       )}
+           </div>
@@ -987,1 +987,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+         </div>
@@ -988,1 +988,1 @@ src/components/pricing/PricingEngineView.tsx
-       {/* ================= MODAL: COPY-ON-WRITE VERSIONING ================= */}
+       )}
@@ -989,1 +989,1 @@ src/components/pricing/PricingEngineView.tsx
-       {versioningRule && (
+ 
@@ -990,1 +990,1 @@ src/components/pricing/PricingEngineView.tsx
-         <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
+       {/* ================= MODAL: COPY-ON-WRITE VERSIONING ================= */}
@@ -991,1 +991,1 @@ src/components/pricing/PricingEngineView.tsx
-           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
+       {versioningRule && (
@@ -992,1 +992,1 @@ src/components/pricing/PricingEngineView.tsx
-             <h3 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
+         <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
@@ -993,1 +993,1 @@ src/components/pricing/PricingEngineView.tsx
-               <History className="w-5 h-5 text-amber-600" />
+           <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
@@ -994,1 +994,1 @@ src/components/pricing/PricingEngineView.tsx
-               <span>تحديث السعر بنظام النسخ عند التعديل (Copy-on-Write)</span>
+             <h3 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
@@ -995,1 +995,1 @@ src/components/pricing/PricingEngineView.tsx
-             </h3>
+               <History className="w-5 h-5 text-amber-600" />
@@ -996,1 +996,1 @@ src/components/pricing/PricingEngineView.tsx
-             <p className="text-xs text-stone-500 mb-4 leading-relaxed">
+               <span>تحديث السعر بنظام النسخ عند التعديل (Copy-on-Write)</span>
@@ -997,1 +997,1 @@ src/components/pricing/PricingEngineView.tsx
-               وفقاً لقواعد النزاهة المالية، لن يتم تعديل السعر القديم مباشرة داخل القاعدة السابقة لحماية الرحلات المنجزة. سيتم تجميد الإصدار <strong className="text-stone-900">v{versioningRule.version || 1}</strong> وإنشاء إصدار جديد <strong className="text-amber-700">v{(versioningRule.version || 1) + 1}</strong>.
+             </h3>
@@ -998,1 +998,1 @@ src/components/pricing/PricingEngineView.tsx
-             </p>
+             <p className="text-xs text-stone-500 mb-4 leading-relaxed">
@@ -999,1 +999,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               وفقاً لقواعد النزاهة المالية، لن يتم تعديل السعر القديم مباشرة داخل القاعدة السابقة لحماية الرحلات المنجزة. سيتم تجميد الإصدار <strong className="text-stone-900">v{versioningRule.version || 1}</strong> وإنشاء إصدار جديد <strong className="text-amber-700">v{(versioningRule.version || 1) + 1}</strong>.
@@ -1000,1 +1000,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs mb-4 space-y-1.5">
+             </p>
@@ -1001,1 +1001,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="flex justify-between">
+ 
@@ -1002,1 +1002,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="text-stone-500">القاعدة الحالية:</span>
+             <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs mb-4 space-y-1.5">
@@ -1003,1 +1003,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="font-mono font-bold">{versioningRule.pricingRuleId}</span>
+               <div className="flex justify-between">
@@ -1004,1 +1004,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                 <span className="text-stone-500">القاعدة الحالية:</span>
@@ -1005,1 +1005,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="flex justify-between">
+                 <span className="font-mono font-bold">{versioningRule.pricingRuleId}</span>
@@ -1006,1 +1006,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="text-stone-500">الناقل:</span>
+               </div>
@@ -1007,1 +1007,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="font-bold">{versioningRule.carrierId}</span>
+               <div className="flex justify-between">
@@ -1008,1 +1008,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                 <span className="text-stone-500">الناقل:</span>
@@ -1009,1 +1009,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="flex justify-between">
+                 <span className="font-bold">{versioningRule.carrierId}</span>
@@ -1010,1 +1010,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="text-stone-500">السعر القديم:</span>
+               </div>
@@ -1011,1 +1011,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <span className="font-mono font-bold text-stone-700">{versioningRule.rate} SAR</span>
+               <div className="flex justify-between">
@@ -1012,1 +1012,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                 <span className="text-stone-500">السعر القديم:</span>
@@ -1013,1 +1013,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+                 <span className="font-mono font-bold text-stone-700">{versioningRule.rate} SAR</span>
@@ -1014,1 +1014,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+               </div>
@@ -1015,1 +1015,1 @@ src/components/pricing/PricingEngineView.tsx
-             <div className="space-y-4">
+             </div>
@@ -1016,1 +1016,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div>
+ 
@@ -1017,1 +1017,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <label className="block text-xs font-bold text-stone-700 mb-1">السعر الجديد المعتمد (SAR):</label>
+             <div className="space-y-4">
@@ -1018,1 +1018,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <input
+               <div>
@@ -1019,1 +1019,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="number"
+                 <label className="block text-xs font-bold text-stone-700 mb-1">السعر الجديد المعتمد (SAR):</label>
@@ -1020,1 +1020,1 @@ src/components/pricing/PricingEngineView.tsx
-                   step="0.25"
+                 <input
@@ -1021,1 +1021,1 @@ src/components/pricing/PricingEngineView.tsx
-                   required
+                   type="number"
@@ -1022,1 +1022,1 @@ src/components/pricing/PricingEngineView.tsx
-                   min="0.01"
+                   step="0.25"
@@ -1023,1 +1023,1 @@ src/components/pricing/PricingEngineView.tsx
-                   value={updatedRate}
+                   required
@@ -1024,1 +1024,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onChange={(e) => setUpdatedRate(parseFloat(e.target.value) || 0)}
+                   min="0.01"
@@ -1025,1 +1025,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono font-bold text-amber-800"
+                   value={updatedRate}
@@ -1026,1 +1026,1 @@ src/components/pricing/PricingEngineView.tsx
-                 />
+                   onChange={(e) => setUpdatedRate(parseFloat(e.target.value) || 0)}
@@ -1027,1 +1027,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono font-bold text-amber-800"
@@ -1028,1 +1028,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 />
@@ -1029,1 +1029,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div>
+               </div>
@@ -1030,1 +1030,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <label className="block text-xs font-bold text-stone-700 mb-1">سبب ومسوغ التحديث (للتدقيق المالي):</label>
+ 
@@ -1031,1 +1031,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <textarea
+               <div>
@@ -1032,1 +1032,1 @@ src/components/pricing/PricingEngineView.tsx
-                   rows={2}
+                 <label className="block text-xs font-bold text-stone-700 mb-1">سبب ومسوغ التحديث (للتدقيق المالي):</label>
@@ -1033,1 +1033,1 @@ src/components/pricing/PricingEngineView.tsx
-                   value={versionReason}
+                 <textarea
@@ -1034,1 +1034,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onChange={(e) => setVersionReason(e.target.value)}
+                   rows={2}
@@ -1035,1 +1035,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
+                   value={versionReason}
@@ -1036,1 +1036,1 @@ src/components/pricing/PricingEngineView.tsx
-                   placeholder="اكتب مبرر التعديل..."
+                   onChange={(e) => setVersionReason(e.target.value)}
@@ -1037,1 +1037,1 @@ src/components/pricing/PricingEngineView.tsx
-                 />
+                   className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
@@ -1038,1 +1038,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                   placeholder="اكتب مبرر التعديل..."
@@ -1039,1 +1039,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+                 />
@@ -1040,1 +1040,1 @@ src/components/pricing/PricingEngineView.tsx
-               <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
+               </div>
@@ -1041,1 +1041,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <button
+ 
@@ -1042,1 +1042,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="button"
+               <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
@@ -1043,1 +1043,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onClick={() => setVersioningRule(null)}
+                 <button
@@ -1044,1 +1044,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
+                   type="button"
@@ -1045,1 +1045,1 @@ src/components/pricing/PricingEngineView.tsx
-                 >
+                   onClick={() => setVersioningRule(null)}
@@ -1046,1 +1046,1 @@ src/components/pricing/PricingEngineView.tsx
-                   إلغاء
+                   className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
@@ -1047,1 +1047,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </button>
+                 >
@@ -1048,1 +1048,1 @@ src/components/pricing/PricingEngineView.tsx
-                 <button
+                   {t("shared.actions.cancel")}</button>
@@ -1049,1 +1049,1 @@ src/components/pricing/PricingEngineView.tsx
-                   type="button"
+                 <button
@@ -1050,1 +1050,1 @@ src/components/pricing/PricingEngineView.tsx
-                   onClick={handleApplyCowVersioning}
+                   type="button"
@@ -1051,1 +1051,1 @@ src/components/pricing/PricingEngineView.tsx
-                   className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
+                   onClick={handleApplyCowVersioning}
@@ -1052,1 +1052,1 @@ src/components/pricing/PricingEngineView.tsx
-                 >
+                   className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
@@ -1053,1 +1053,1 @@ src/components/pricing/PricingEngineView.tsx
-                   إنشاء وتفعيل الإصدار v{(versioningRule.version || 1) + 1}
+                 >
@@ -1054,1 +1054,1 @@ src/components/pricing/PricingEngineView.tsx
-                 </button>
+                   إنشاء وتفعيل الإصدار v{(versioningRule.version || 1) + 1}
@@ -1055,1 +1055,1 @@ src/components/pricing/PricingEngineView.tsx
-               </div>
+                 </button>
@@ -1056,1 +1056,1 @@ src/components/pricing/PricingEngineView.tsx
-             </div>
+               </div>
@@ -1057,1 +1057,1 @@ src/components/pricing/PricingEngineView.tsx
-           </div>
+             </div>
@@ -1058,1 +1058,1 @@ src/components/pricing/PricingEngineView.tsx
-         </div>
+           </div>
@@ -1059,1 +1059,1 @@ src/components/pricing/PricingEngineView.tsx
-       )}
+         </div>
@@ -1060,1 +1060,1 @@ src/components/pricing/PricingEngineView.tsx
-     </div>
+       )}
@@ -1061,1 +1061,1 @@ src/components/pricing/PricingEngineView.tsx
-   );
+     </div>
@@ -1062,1 +1062,1 @@ src/components/pricing/PricingEngineView.tsx
- };
+   );
@@ -1063,1 +1063,1 @@ src/components/pricing/PricingEngineView.tsx
- 
+ };
```
