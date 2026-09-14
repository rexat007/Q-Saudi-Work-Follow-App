import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Truck, 
  User, 
  Building2, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  ShieldCheck, 
  ShieldAlert, 
  Send, 
  Sparkles,
  RotateCcw,
  Wifi,
  WifiOff,
  Printer,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { TripRecord, TripActorRole } from '../../types/tripEngine';
import { tripEngineService, MasterPricingRule, MASTER_PRICING_RULES } from '../../services/tripEngine.service';
import { SAMPLE_QUALITY_CONTEXT } from '../../data/sampleQualityData';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { projectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../types/entities';
import { offlineCacheService } from '../../services/offline/offlineCache.service';
import { outboxService } from '../../services/offline/outbox.service';
import { indexedDBService } from '../../services/offline/indexedDB.service';
import { OfflineTripPrerequisitesReport } from '../../types/offline';
import { AuthUserContext, UserRole } from '../../types/common';
import { useI18n } from '../../i18n';

export interface LoadingOperatorViewProps {
  authContext?: AuthUserContext;
  onTripCreated?: (newTrip: TripRecord) => void;
  onNotification?: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
}

// Authorized roles for Loading Operator Interface per Block 76 Architecture & RBAC
export const LOADING_AUTHORIZED_ROLES: UserRole[] = [
  'SCALE_OPERATOR',
  'DISPATCHER',
  'SUPERVISOR',
  'SITE_SUPERVISOR',
  'PROJECT_ADMIN',
  'SUPER_ADMIN'
];

export const LoadingOperatorView: React.FC<LoadingOperatorViewProps> = ({
  authContext = {
    userId: 'SCALE-OP-01',
    email: 'scale.op@qsaudi.com',
    displayName: 'مشغل ميزان التحميل (Scale Operator)',
    role: 'SCALE_OPERATOR',
    assignedProjectIds: []
  },
  onTripCreated,
  onNotification
}) => {
  const { t, isRTL } = useI18n();
  const { isOnline, isSimulatedOffline } = useOnlineStatus();

  // Role Authorization Check
  const isAuthorized = useMemo(() => {
    return LOADING_AUTHORIZED_ROLES.includes(authContext.role);
  }, [authContext.role]);

  // Reference Context
  const context = SAMPLE_QUALITY_CONTEXT;

  const [projectsList, setProjectsList] = useState<ProjectEntity[]>([]);

  useEffect(() => {
    const unsubscribe = projectRepository.subscribeToProjects(
      (list) => {
        setProjectsList(list || []);
      },
      (err) => console.error(err)
    );
    return () => unsubscribe();
  }, []);

  // Available Projects (scoped by assignedProjectIds if set, unless SUPER_ADMIN)
  const availableProjects = useMemo(() => {
    const all = projectsList.map(p => ({
      id: p.projectId,
      name: `${p.nameAr} (${p.projectId})`
    }));
    if (authContext.role === 'SUPER_ADMIN' || !authContext.assignedProjectIds || authContext.assignedProjectIds.length === 0) {
      return all;
    }
    return all.filter(p => authContext.assignedProjectIds!.includes(p.id));
  }, [projectsList, authContext]);

  // Form State: Minimal typing, click-to-select defaults
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    if (availableProjects.length > 0 && !projectId) {
      setProjectId(availableProjects[0].id);
    }
  }, [availableProjects, projectId]);

  const [carrierId, setCarrierId] = useState<string>('CAR-ALMAJDOUIE');
  const [truckId, setTruckId] = useState<string>('TRK-9901');
  const [driverId, setDriverId] = useState<string>('DRV-101');
  const [materialId, setMaterialId] = useState<string>('MAT-AGG-01');

  // Weights (kg) - starts empty/zero in production runtime
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [grossWeight, setGrossWeight] = useState<number>(0);

  // Pricing Rule Selection
  const [pricingRuleId, setPricingRuleId] = useState<string>('PRC-NEOM-HAUL-TON-8.5');

  // Execution States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTrip, setCreatedTrip] = useState<TripRecord | null>(null);
  const [offlinePrereq, setOfflinePrereq] = useState<OfflineTripPrerequisitesReport | null>(null);
  const [ticketCopyNotification, setTicketCopyNotification] = useState<string | null>(null);

  // Carriers authorized for current project
  const availableCarriers = useMemo(() => {
    return context.knownCarriers.filter(c => context.authorizedCarrierIds.includes(c.carrierId));
  }, [context]);

  // Trucks belonging to selected carrier
  const availableTrucks = useMemo(() => {
    return context.knownTrucks.filter(t => t.carrierId === carrierId && t.status === 'ACTIVE');
  }, [context, carrierId]);

  // Drivers belonging to selected carrier
  const availableDrivers = useMemo(() => {
    return context.knownDrivers.filter(d => d.carrierId === carrierId && d.status === 'ACTIVE');
  }, [context, carrierId]);

  // Materials authorized in project
  const availableMaterials = useMemo(() => {
    return context.knownMaterials.filter(m => context.authorizedMaterialIds.includes(m.materialId));
  }, [context]);

  // Sync selections when carrier changes
  useEffect(() => {
    if (availableTrucks.length > 0 && !availableTrucks.some(t => t.truckId === truckId)) {
      setTruckId(availableTrucks[0].truckId);
    }
    if (availableDrivers.length > 0 && !availableDrivers.some(d => d.driverId === driverId)) {
      setDriverId(availableDrivers[0].driverId);
    }
  }, [carrierId, availableTrucks, availableDrivers, truckId, driverId]);

  // Applicable Pricing Rules
  const applicablePricingRules = useMemo(() => {
    return MASTER_PRICING_RULES.filter(r => 
      r.projectId === projectId &&
      (!r.carrierId || r.carrierId === carrierId) &&
      (!r.materialId || r.materialId === materialId)
    );
  }, [projectId, carrierId, materialId]);

  // Active Pricing Rule
  const activePricingRule = useMemo<MasterPricingRule | undefined>(() => {
    const found = applicablePricingRules.find(r => r.pricingRuleId === pricingRuleId);
    if (found) return found;
    return applicablePricingRules[0] || MASTER_PRICING_RULES.find(r => r.pricingRuleId === pricingRuleId) || MASTER_PRICING_RULES[0];
  }, [applicablePricingRules, pricingRuleId]);

  // Derived Net Weight (Client display calculation - strictly verified server-side upon dispatch)
  const netWeightKg = useMemo(() => {
    if (grossWeight && tareWeight && grossWeight > tareWeight) {
      return grossWeight - tareWeight;
    }
    return 0;
  }, [grossWeight, tareWeight]);

  const netWeightTons = useMemo(() => {
    return parseFloat((netWeightKg / 1000).toFixed(3));
  }, [netWeightKg]);

  // Estimated Settlement Calculation (Read-Only Preview)
  const settlementPreview = useMemo(() => {
    if (!activePricingRule) {
      return { amount: 0, text: 'لا توجد تسعيرة سارية', currency: 'SAR', pricingType: 'PER_TON' };
    }
    if (activePricingRule.pricingType === 'PER_TON') {
      const total = parseFloat((netWeightTons * activePricingRule.agreedRate).toFixed(2));
      return {
        amount: total,
        text: `${netWeightTons} طن × ${activePricingRule.agreedRate} = ${total.toFixed(2)} ${activePricingRule.currency || 'SAR'}`,
        currency: activePricingRule.currency || 'SAR',
        pricingType: 'PER_TON'
      };
    } else {
      return {
        amount: activePricingRule.agreedRate,
        text: `${activePricingRule.agreedRate.toFixed(2)} ${activePricingRule.currency || 'SAR'} (مقطوعية ثابتة للرد)`,
        currency: activePricingRule.currency || 'SAR',
        pricingType: 'PER_TRIP'
      };
    }
  }, [activePricingRule, netWeightTons]);

  // Validation Checks: Blocking vs Warnings
  const blockingErrors = useMemo<string[]>(() => {
    const errors: string[] = [];
    if (!projectId) errors.push('يجب تحديد المشروع التابع له أمر التحميل.');
    if (!carrierId) errors.push('يجب تحديد شركة النقل المعتمدة.');
    if (!truckId) errors.push('يجب تحديد الشاحنة المراد وزنها.');
    if (!driverId) errors.push('يجب تحديد السائق المكلف.');
    if (!materialId) errors.push('يجب تحديد صنف المادة المحملة.');
    if (grossWeight <= 0) errors.push('يجب تسجيل قراءة الوزن القائم.');
    if (tareWeight <= 0) errors.push('يجب تسجيل قراءة وزن الفارغ.');
    if (grossWeight <= tareWeight) {
      errors.push(`خطأ وزني مانع: الوزن القائم (${grossWeight.toLocaleString()} كجم) يجب أن يكون أكبر من وزن الفارغ (${tareWeight.toLocaleString()} كجم).`);
    }
    if (!activePricingRule) {
      errors.push('لا توجد قاعدة تسعير معتمدة وسارية للربط المختار (مشروع/ناقل/مادة).');
    }
    return errors;
  }, [projectId, carrierId, truckId, driverId, materialId, grossWeight, tareWeight, activePricingRule]);

  const regulatoryWarnings = useMemo<string[]>(() => {
    const warnings: string[] = [];
    if (netWeightTons > 35) {
      warnings.push(`تنبيه حمولة زائدة: صافي الحمولة (${netWeightTons} طن) يتجاوز الحد النظامي الموصى به (35 طن) وفق لائحة الهيئة العامة للنقل.`);
    }
    if (grossWeight > 50000) {
      warnings.push(`تنبيه وزن إجمالي مرتفع: الوزن القائم (${(grossWeight / 1000).toFixed(1)} طن) قد يعرض المركبة لمخالفة محطات الوزن المتنقلة.`);
    }
    return warnings;
  }, [netWeightTons, grossWeight]);

  // Check offline readiness
  useEffect(() => {
    let active = true;
    const checkPrerequisites = async () => {
      try {
        const report = await offlineCacheService.validateOfflineTripPrerequisites({
          projectId,
          carrierId,
          truckId,
          driverId,
          materialId,
          pricingRuleId: activePricingRule?.pricingRuleId || pricingRuleId,
          shiftDate: '2026-09-09',
        });
        if (active) setOfflinePrereq(report);
      } catch (err) {
        console.warn('Failed to check offline prerequisites:', err);
      }
    };
    checkPrerequisites();
    return () => { active = false; };
  }, [projectId, carrierId, truckId, driverId, materialId, pricingRuleId, activePricingRule, isOnline]);

  // Handlers for Quick Presets (Touch-First)
  const applyTarePreset = (weight: number) => setTareWeight(weight);
  const applyGrossPreset = (weight: number) => setGrossWeight(weight);
  const adjustTare = (delta: number) => setTareWeight(prev => Math.max(0, prev + delta));
  const adjustGross = (delta: number) => setGrossWeight(prev => Math.max(0, prev + delta));

  // Simulated Live Scale Read
  const handleReadScaleIn = () => {
    // Standard Tare scale read
    const simulated = 14200;
    setTareWeight(simulated);
    if (onNotification) {
      onNotification({
        type: 'SUCCESS',
        message: `تمت قراءة ميزان الدخول (Scale In) بنجاح: ${simulated.toLocaleString()} كجم`
      });
    }
  };

  const handleReadScaleOut = () => {
    // Standard Gross scale read
    const simulated = 45800;
    setGrossWeight(simulated);
    if (onNotification) {
      onNotification({
        type: 'SUCCESS',
        message: `تمت قراءة ميزان الخروج (Scale Out) بنجاح: ${simulated.toLocaleString()} كجم`
      });
    }
  };

  // Execution: Create Trip & Dispatch Ticket
  const handleDispatchTrip = async () => {
    if (blockingErrors.length > 0) {
      if (onNotification) {
        onNotification({
          type: 'ERROR',
          message: blockingErrors[0]
        });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const shiftDate = nowIso.split('T')[0];

      // OFFLINE PATH
      if (!isOnline) {
        if (!offlinePrereq?.hasPricingRule || !offlinePrereq.pricingRule || offlinePrereq.pricingRule.agreedRate <= 0) {
          throw new Error('حظر أمني: لا يُسمح بإنشاء تذكرة ميزان في وضع عدم الاتصال دون توفر بيانات التسعير التعاقدية محلياً.');
        }

        const localNetKg = grossWeight - tareWeight;
        const localNetTons = parseFloat((localNetKg / 1000).toFixed(3));
        const resolvedPricing = offlinePrereq.pricingRule;
        const localSettlement = resolvedPricing.pricingType === 'PER_TON'
          ? parseFloat((localNetTons * resolvedPricing.agreedRate).toFixed(2))
          : resolvedPricing.agreedRate;

        const offlineTripId = `TRP-OFFLINE-${Date.now()}`;
        const offlineSerial = `TRP-LOCAL-${Math.floor(1000 + Math.random() * 9000)}`;
        const offlineTicket = `WB-TKT-LOCAL-${Math.floor(100000 + Math.random() * 900000)}`;

        const offlineRecord: TripRecord = {
          tripId: offlineTripId,
          projectId,
          tripSerial: offlineSerial,
          ticketId: offlineTicket,
          truckId,
          driverId,
          carrierId,
          materialId,
          shiftDate,
          tareWeight,
          grossWeight,
          netWeight: localNetKg,
          destNetWeight: null,
          varianceWeight: null,
          pricingRuleId: resolvedPricing.pricingRuleId,
          pricingType: resolvedPricing.pricingType,
          agreedRate: resolvedPricing.agreedRate,
          currency: resolvedPricing.currency || 'SAR',
          settlementBase: resolvedPricing.pricingType === 'PER_TON' ? localNetTons : 1,
          settlementAmount: localSettlement,
          loaderId: authContext.userId,
          unloaderId: null,
          status: 'IN_TRANSIT',
          version: 1,
          loadTime: nowIso,
          arrivalTime: null,
          unloadTime: null,
          notes: `[تذكرة ميزان منشأة محلياً دون اتصال] الصافي: ${localNetKg.toLocaleString()} كجم`,
          createdAt: nowIso,
          createdBy: authContext.userId,
          updatedAt: nowIso,
          updatedBy: authContext.userId,
          pricingSnapshot: {
            pricingRuleId: resolvedPricing.pricingRuleId,
            pricingType: resolvedPricing.pricingType,
            agreedRate: resolvedPricing.agreedRate,
            currency: resolvedPricing.currency || 'SAR',
            settlementBase: resolvedPricing.pricingType === 'PER_TON' ? localNetTons : 1,
            settlementAmount: localSettlement,
            ruleName: resolvedPricing.name,
            pricingSnapshotAt: nowIso,
            effectiveFrom: resolvedPricing.effectiveFrom,
            effectiveTo: resolvedPricing.effectiveTo
          }
        };

        // Store in IndexedDB and enqueue in Outbox
        await indexedDBService.put('trips', offlineRecord);
        await outboxService.queueOperation({
          operationType: 'CREATE_TRIP_LOADING',
          projectId: offlineRecord.projectId,
          userId: authContext.userId,
          payload: offlineRecord
        });

        setCreatedTrip(offlineRecord);
        if (onTripCreated) onTripCreated(offlineRecord);
        if (onNotification) {
          onNotification({
            type: 'SUCCESS',
            message: `تم إنشاء وتوثيق تذكرة التحميل محلياً [${offlineRecord.tripSerial}] وإدراجها في صندوق العمليات المعلقة (Outbox).`
          });
        }
        return;
      }

      // ONLINE PATH: Use existing trip engine service with strict server calculations
      const result = tripEngineService.createTripViaLoadingStation({
        projectId,
        carrierId,
        truckId,
        driverId,
        materialId,
        pricingRuleId: activePricingRule?.pricingRuleId || pricingRuleId,
        shiftDate,
        tareWeight,
        grossWeight,
        loaderId: authContext.userId,
        notes: `تم الإصدار الميداني عبر واجهة مشغل ميزان التحميل (${authContext.displayName})`
      }, {
        actorId: authContext.userId,
        actorName: authContext.displayName,
        actorRole: (authContext.role as unknown as TripActorRole) || 'SCALE_OPERATOR'
      });

      setCreatedTrip(result.trip);
      if (onTripCreated) onTripCreated(result.trip);
      if (onNotification) {
        onNotification({
          type: 'SUCCESS',
          message: `تم إصدار وترحيل تذكرة الميزان [${result.trip.tripSerial}] بنجاح! الحالة التشغيلية: IN_TRANSIT.`
        });
      }
    } catch (err: any) {
      if (onNotification) {
        onNotification({
          type: 'ERROR',
          message: err.message || 'فشلت عملية إنشاء وترحيل تذكرة الميزان.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNextTruck = () => {
    setCreatedTrip(null);
    setGrossWeight(0);
    // Keep project and carrier; pick next truck if available
    const nextIdx = availableTrucks.findIndex(t => t.truckId === truckId) + 1;
    if (nextIdx < availableTrucks.length) {
      setTruckId(availableTrucks[nextIdx].truckId);
    }
  };

  // =========================================================================
  // UNAUTHORIZED BARRIER
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-xl mx-auto my-12 shadow-sm" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 mb-2">غير مصرح بدخول واجهة مشغل التحميل</h2>
        <p className="text-xs text-stone-600 mb-6 leading-relaxed">
          حسابك الحالي بالدور (<span className="font-bold text-rose-700 font-mono">{authContext.role}</span>) غير مدرج ضمن الأدوار المعتمدة لإدارة موازين المصدر وتوثيق تذاكر التحميل. الواجهة متاحة فقط لمشغلي الموازين والمرحلين ومديري المشاريع.
        </p>
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs text-stone-500 font-mono">
          USER: {authContext.displayName} ({authContext.userId})
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS STATE: DIGITAL WEIGHBRIDGE DISPATCH TICKET
  // =========================================================================
  if (createdTrip) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn text-right" dir="rtl">
        {/* Success Header Banner */}
        <div className="bg-emerald-700 text-white rounded-2xl p-6 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تم تأكيد وزن الشاحنة وإصدار تذكرة الترحيل</h2>
              <p className="text-xs text-emerald-100 font-mono mt-0.5">
                تذكرة رقم: {createdTrip.ticketId} • الرقم التسلسلي: {createdTrip.tripSerial}
              </p>
            </div>
          </div>
          <span className="bg-white text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0">
            {createdTrip.status}
          </span>
        </div>

        {/* Printable Ticket Card */}
        <div className="bg-white rounded-2xl border-2 border-stone-300 p-6 shadow-sm space-y-6 relative overflow-hidden font-sans">
          {/* Watermark/Stamp */}
          <div className="absolute top-6 left-6 border-2 border-emerald-600 text-emerald-800 px-3 py-1 rounded-lg text-xs font-black rotate-[-12deg] select-none opacity-85">
            موزونة ومعتمدة • SCALE VERIFIED
          </div>

          <div className="border-b border-stone-200 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">تذكرة ميزان التحميل والانطلاق</h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">{createdTrip.loadTime?.slice(0, 19).replace('T', ' ')}</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {projectsList.find(p => p.projectId === createdTrip.projectId)?.nameAr || createdTrip.projectId}
            </p>
          </div>

          {/* Vehicle & Trip Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">رقم الشاحنة</span>
              <span className="font-bold text-stone-900 font-mono text-sm">{createdTrip.truckId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">الناقل</span>
              <span className="font-bold text-stone-900">{context.knownCarriers.find(c => c.carrierId === createdTrip.carrierId)?.name || createdTrip.carrierId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">السائق</span>
              <span className="font-bold text-stone-900">{context.knownDrivers.find(d => d.driverId === createdTrip.driverId)?.name || createdTrip.driverId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">المادة الموردة</span>
              <span className="font-bold text-stone-900">{context.knownMaterials.find(m => m.materialId === createdTrip.materialId)?.name || createdTrip.materialId}</span>
            </div>
          </div>

          {/* Weight Matrix Callout */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">الوزن القائم (Gross)</span>
                <span className="text-base sm:text-lg font-black text-stone-900 font-mono">{createdTrip.grossWeight.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block">كجم</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">وزن الفارغ (Tare)</span>
                <span className="text-base sm:text-lg font-black text-stone-900 font-mono">{createdTrip.tareWeight.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block">كجم</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-300">
                <span className="text-[11px] text-emerald-800 font-bold block">صافي الحمولة (Net)</span>
                <span className="text-base sm:text-xl font-black text-emerald-950 font-mono">{createdTrip.netWeight.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">كجم ({(createdTrip.netWeight / 1000).toFixed(3)} طن)</span>
              </div>
            </div>
          </div>

          {/* Pricing Snapshot Notice */}
          <div className="text-xs bg-stone-100/70 p-3 rounded-xl flex items-center justify-between text-stone-600 font-mono">
            <span>قاعدة التسعير: {createdTrip.pricingRuleId}</span>
            <span className="font-bold text-stone-800">
              التسوية: {createdTrip.settlementAmount.toFixed(2)} {createdTrip.currency} ({createdTrip.pricingType === 'PER_TON' ? 'بالطن' : 'بالمقطوعية'})
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleResetForNextTruck}
              className="w-full sm:flex-1 py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تحميل ووزن شاحنة جديدة (Next Truck)</span>
            </button>
            <button
              onClick={() => {
                setTicketCopyNotification('تم نسخ بيانات التذكرة للمشاركة');
                setTimeout(() => setTicketCopyNotification(null), 3000);
              }}
              className="w-full sm:w-auto py-3.5 px-5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-stone-300"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التذكرة</span>
            </button>
          </div>
          {ticketCopyNotification && (
            <p className="text-center text-xs text-emerald-700 font-medium">{ticketCopyNotification}</p>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN FIELD WORKSTATION INTERFACE: IDENTIFY -> CAPTURE -> VALIDATE -> ACT
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right pb-12" dir="rtl">
      {/* Top Station Status Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-stone-900">محطة ميزان التحميل الميدانية</h1>
              <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                مشغل الميزان (Loading Operator)
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              توثيق أوزان الدخول والخروج، حظر التلاعب بالأوزان، التحقق من حمولة المحاور، وإصدار تذاكر الترحيل.
            </p>
          </div>
        </div>

        {/* Offline / Online Status Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Wifi className="w-3.5 h-3.5" />
              <span>متصل بالنظام المركزي</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <WifiOff className="w-3.5 h-3.5" />
              <span>وضع عدم الاتصال (Offline)</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Layout: Responsive Grid (1 col on Mobile, 2 cols on Tablet/Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* SECTION 1: IDENTIFY (المشروع، الناقل، الشاحنة، السائق، المادة) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="font-bold text-stone-900 text-sm">بيانات الشاحنة وأمر التحميل (IDENTIFY)</h2>
              </div>
              <span className="text-[11px] text-stone-400">اختيار سريع بلمسة واحدة</span>
            </div>

            {/* 1.1 Project Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>المشروع التابع له أمر التحميل</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {availableProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* 1.2 Carrier Quick Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-700" />
                <span>الناقل المعتمد</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableCarriers.map(c => (
                  <button
                    key={c.carrierId}
                    type="button"
                    onClick={() => setCarrierId(c.carrierId)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col min-h-[48px] justify-center ${
                      carrierId === c.carrierId
                        ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs truncate">{c.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{c.carrierId}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 1.3 Truck Quick Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-700" />
                <span>الشاحنة المتاحة للناقل</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-0.5">
                {availableTrucks.map(t => (
                  <button
                    key={t.truckId}
                    type="button"
                    onClick={() => setTruckId(t.truckId)}
                    className={`p-2.5 rounded-xl border text-right transition-all min-h-[48px] flex items-center justify-between ${
                      truckId === t.truckId
                        ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-mono font-bold block">{t.truckId}</span>
                      <span className="text-[10px] text-stone-500">{t.plate || 'تريلا قلاب'}</span>
                    </div>
                    {truckId === t.truckId && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 1.4 Driver & Material Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>السائق</span>
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {availableDrivers.map(d => (
                    <option key={d.driverId} value={d.driverId}>{d.name} ({d.driverId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-amber-700" />
                  <span>المادة المحملة</span>
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {availableMaterials.map(m => (
                    <option key={m.materialId} value={m.materialId}>{m.name} ({m.materialId})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Rule Info Callout (Server Authority) */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-stone-700">
              <span className="font-bold flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-stone-500" />
                <span>قاعدة التسعير المطبقة</span>
              </span>
              <span className="bg-stone-200 text-stone-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                {activePricingRule?.pricingType === 'PER_TON' ? 'تسعير بالطن' : 'مقطوعية بالرد'}
              </span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              {activePricingRule?.name || 'قاعدة التسعير القياسية للمشروع'}
            </p>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between font-mono">
              <span className="text-[11px] text-stone-500">سعر الوحدة:</span>
              <span className="font-bold text-stone-900">{activePricingRule?.agreedRate} {activePricingRule?.currency || 'SAR'}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 & 3: CAPTURE & VALIDATE (الأوزان، الحساب الخادومي، زر التأكيد) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="font-bold text-stone-900 text-sm">توثيق الأوزان بالميزان (CAPTURE & VALIDATE)</h2>
              </div>
              <span className="text-[11px] text-stone-400">قراءات رقمية دقيقة</span>
            </div>

            {/* 2.1 Tare Weight Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-stone-600" />
                  <span>وزن الفارغ (Tare Weight)</span>
                </label>
                <button
                  type="button"
                  onClick={handleReadScaleIn}
                  className="text-[11px] bg-stone-200 hover:bg-stone-300 text-stone-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>قراءة ميزان الدخول</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={tareWeight || ''}
                  onChange={(e) => setTareWeight(Math.max(0, Number(e.target.value)))}
                  className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-lg font-black text-stone-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="0"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustTare(-500)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                    title="-500 كجم"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTare(+500)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                    title="+500 كجم"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Tare Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400 py-1">نماذج شائعة:</span>
                {[8200, 13800, 14200, 15000].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => applyTarePreset(w)}
                    className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2 py-1 rounded font-mono font-semibold"
                  >
                    {w.toLocaleString()} كجم
                  </button>
                ))}
              </div>
            </div>

            {/* 2.2 Gross Weight Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-700" />
                  <span>الوزن القائم بعد التعبئة (Gross Weight)</span>
                </label>
                <button
                  type="button"
                  onClick={handleReadScaleOut}
                  className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>قراءة ميزان الخروج</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={grossWeight || ''}
                  onChange={(e) => setGrossWeight(Math.max(0, Number(e.target.value)))}
                  className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-lg font-black text-stone-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="0"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustGross(-500)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                    title="-500 كجم"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustGross(+500)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                    title="+500 كجم"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Gross Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400 py-1">نماذج حمولة:</span>
                {[42000, 45600, 49800].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => applyGrossPreset(w)}
                    className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2 py-1 rounded font-mono font-semibold"
                  >
                    {w.toLocaleString()} كجم
                  </button>
                ))}
              </div>
            </div>

            {/* 2.3 Calculated Net Weight Display */}
            <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">صافي الحمولة المحسوب (Net Weight)</span>
                  <span className="text-[10px] text-amber-700 block">معادلة الميزان: القائم - الفارغ</span>
                </div>
                <div className="text-left font-mono">
                  <div className="text-xl sm:text-2xl font-black text-amber-950">
                    {netWeightKg.toLocaleString()} <span className="text-xs font-normal">كجم</span>
                  </div>
                  <div className="text-xs font-bold text-amber-800">
                    ({netWeightTons} طن متري)
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory & Safety Warnings */}
            {regulatoryWarnings.length > 0 && (
              <div className="space-y-1.5">
                {regulatoryWarnings.map((w, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Blocking Errors */}
            {blockingErrors.length > 0 && (
              <div className="space-y-1.5">
                {blockingErrors.map((err, idx) => (
                  <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Read-Only Settlement Preview */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
              <div className="text-stone-600">
                <span className="block text-[10px] text-stone-400">التسوية التقديرية (محسوبة خادومياً):</span>
                <span className="font-mono text-stone-700">{settlementPreview.text}</span>
              </div>
              <div className="font-bold text-stone-900 text-sm font-mono">
                {settlementPreview.amount.toFixed(2)} {settlementPreview.currency}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 4: ACT (زر التأكيد الأساسي المهيمن) */}
            {/* ========================================================================= */}
            <button
              type="button"
              onClick={handleDispatchTrip}
              disabled={blockingErrors.length > 0 || isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 min-h-[52px] ${
                blockingErrors.length > 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-600/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري توثيق التذكرة والترحيل...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 rtl:rotate-180" />
                  <span>تأكيد وإصدار تذكرة الرحلة (Confirm & Dispatch)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
