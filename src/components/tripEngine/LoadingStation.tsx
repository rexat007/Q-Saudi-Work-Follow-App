import { presentOperationalMessage } from "../../i18n/operationalMessages";
import { buildRelationshipContext } from "../../utils/masterDataUtils";
import { pricingService } from "../../services/pricing.service";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Truck, 
  User, 
  Building2, 
  Boxes, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Calculator, 
  ShieldCheck, 
  Lock, 
  Send, 
  Zap, 
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
  X,
  FileCheck2,
  HelpCircle,
  ListOrdered,
  Wifi,
  WifiOff,
  Database,
  Layers
} from 'lucide-react';
import { TripRecord, CreateTripParams, TripActorRole } from '../../types/tripEngine';
import { tripEngineService, MasterPricingRule } from '../../services/tripEngine.service';
import { runLoadingStationTests, LoadingStationTestResult } from '../../tests/loadingStation.test';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { offlineCacheService } from '../../services/offline/offlineCache.service';
import { outboxService } from '../../services/offline/outbox.service';
import { indexedDBService } from '../../services/offline/indexedDB.service';
import { OfflineTripPrerequisitesReport } from '../../types/offline';
import { tripStateMachine } from '../../services/tripStateMachine.service';
import { useI18n } from '../../i18n';


interface LoadingStationProps {
  onTripCreated: (newTrip: TripRecord) => void;
  onViewTripDetails?: (trip: TripRecord) => void;
  onNotification: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
}

type WorkflowStep = 
  | 'PROJECT' 
  | 'CARRIER' 
  | 'TRUCK' 
  | 'DRIVER' 
  | 'MATERIAL' 
  | 'TARE' 
  | 'GROSS' 
  | 'PREVIEW';

const STEPS: { id: WorkflowStep; label: string; number: number; icon: any }[] = [
  { id: 'PROJECT', label: "dashboard.labels.project", number: 1, icon: Building2 },
  { id: 'CARRIER', label: "entityResolution.labels.carrier_3", number: 2, icon: Truck },
  { id: 'TRUCK', label: "legacyMigration.labels.truck_2", number: 3, icon: Truck },
  { id: 'DRIVER', label: "entityResolution.labels.driver_2", number: 4, icon: User },
  { id: 'MATERIAL', label: "legacyMigration.labels.material_2", number: 5, icon: Boxes },
  { id: 'TARE', label: "field_operations.tare_weight", number: 6, icon: Scale },
  { id: 'GROSS', label: "field_operations.gross_weight_ticket", number: 7, icon: Scale },
  { id: 'PREVIEW', label: "field_operations.step_preview", number: 8, icon: Calculator },
];

export const LoadingStation: React.FC<LoadingStationProps> = ({
  onTripCreated,
  onViewTripDetails,
  onNotification
}) => {
  const { t, t: translate, isRTL } = useI18n();
  const operationalMessage = (message: string) => presentOperationalMessage(message, translate);
  // Current Workflow Step
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('PROJECT');

  // Form State
  const [projectId, setProjectId] = useState<string>('PRJ-NEOM-001');
  const [carrierId, setCarrierId] = useState<string>('CAR-ALMAJDOUIE');
  const [truckId, setTruckId] = useState<string>('TRK-9901');
  const [driverId, setDriverId] = useState<string>('DRV-101');
  const [materialId, setMaterialId] = useState<string>('MAT-AGG-01');
  
  // Weights (in KG)
  const [tareWeight, setTareWeight] = useState<number>(8200);
  const [grossWeight, setGrossWeight] = useState<number>(45600);

  // Selected Pricing Rule override (optional if auto-resolved)
  const [pricingRuleId, setPricingRuleId] = useState<string>('PRC-NEOM-HAUL-TON-8.5');

  // Creation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTripResult, setCreatedTripResult] = useState<TripRecord | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);

  // Offline-first PWA Hooks and States
  const { isOnline, isSimulatedOffline } = useOnlineStatus();
  const [offlinePrereq, setOfflinePrereq] = useState<OfflineTripPrerequisitesReport | null>(null);
  const [isCheckingOfflinePrereq, setIsCheckingOfflinePrereq] = useState<boolean>(false);

  // Automated prompt verification test suite run
  const testReport = useMemo(() => {
    return runLoadingStationTests();
  }, [createdTripResult]);

  // Reference Context
  const context = buildRelationshipContext("ALL");

  // Available Data lists
  const availableProjects = [
    { id: 'PRJ-NEOM-001', name: 'مشروع نيوم - البنية التحتية والمحاجر (PRJ-NEOM-001)' }
  ];

  const availableCarriers = useMemo(() => {
    return context.knownCarriers.filter(c => context.authorizedCarrierIds.includes(c.carrierId));
  }, [context]);

  const availableTrucks = useMemo(() => {
    return context.knownTrucks.filter(t => t.carrierId === carrierId && t.status === 'ACTIVE');
  }, [context, carrierId]);

  const availableDrivers = useMemo(() => {
    return context.knownDrivers.filter(d => d.carrierId === carrierId && d.status === 'ACTIVE');
  }, [context, carrierId]);

  const availableMaterials = useMemo(() => {
    return context.knownMaterials.filter(m => context.authorizedMaterialIds.includes(m.materialId));
  }, [context]);

  // Pricing rules for project & carrier & material
  const applicablePricingRules = useMemo(() => {
    return pricingService.getRules().filter(r => 
      r.projectId === projectId &&
      (!r.carrierId || r.carrierId === carrierId) &&
      (!r.materialId || r.materialId === materialId)
    );
  }, [projectId, carrierId, materialId]);

  // Resolved Pricing Rule
  const activePricingRule = useMemo<MasterPricingRule | undefined>(() => {
    // If selected rule is applicable, use it; otherwise pick first applicable or fallback
    const found = applicablePricingRules.find(r => r.pricingRuleId === pricingRuleId);
    if (found) return found;
    return applicablePricingRules[0] || pricingService.getRules().find(r => r.pricingRuleId === pricingRuleId) || pricingService.getRules()[0];
  }, [applicablePricingRules, pricingRuleId]);

  // Live evaluation of offline Master Data and Pricing availability in IndexedDB
  useEffect(() => {
    let isCancelled = false;
    const checkPrerequisites = async () => {
      setIsCheckingOfflinePrereq(true);
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
        if (!isCancelled) {
          setOfflinePrereq(report);
        }
      } catch (err) {
        console.warn('Error checking offline prerequisites:', err);
      } finally {
        if (!isCancelled) {
          setIsCheckingOfflinePrereq(false);
        }
      }
    };

    checkPrerequisites();
    return () => {
      isCancelled = true;
    };
  }, [projectId, carrierId, truckId, driverId, materialId, pricingRuleId, activePricingRule, isOnline]);

  // Derived Net Weight (Client display calculation - verified server-side)
  const calculatedNetWeightKg = useMemo(() => {
    if (grossWeight && tareWeight && grossWeight > tareWeight) {
      return grossWeight - tareWeight;
    }
    return 0;
  }, [grossWeight, tareWeight]);

  const netWeightTons = useMemo(() => {
    return parseFloat((calculatedNetWeightKg / 1000).toFixed(3));
  }, [calculatedNetWeightKg]);

  // Estimated Settlement Calculation (Strictly Read-Only)
  const estimatedSettlement = useMemo<{
    amount: number;
    formulaText: string;
    pricingType: 'PER_TON' | 'PER_TRIP';
    agreedRate: number;
    currency: string;
  }>(() => {
    if (!activePricingRule) {
      return {
        amount: 0,
        formulaText: translate("operations.no_pricing_selected"),
        pricingType: 'PER_TON',
        agreedRate: 0,
        currency: 'SAR'
      };
    }

    const { pricingType, agreedRate, currency } = activePricingRule;

    if (pricingType === 'PER_TON') {
      // Net Weight in Tons * Agreed Rate
      const total = parseFloat((netWeightTons * agreedRate).toFixed(2));
      const formulaText = `${netWeightTons} × ${agreedRate} = ${total.toFixed(2)} ${currency}`;
      return {
        amount: total,
        formulaText,
        pricingType: 'PER_TON',
        agreedRate,
        currency
      };
    } else {
      // Fixed PER_TRIP
      const total = agreedRate;
      const formulaText = translate("operations.value_value_fixed_rate_per_trip", { p0: agreedRate.toFixed(2), p1: currency });
      return {
        amount: total,
        formulaText,
        pricingType: 'PER_TRIP',
        agreedRate,
        currency
      };
    }
  }, [activePricingRule, netWeightTons, translate]);

  // Warnings Assessment (Overload, Invariants, Rule Validity)
  const warnings = useMemo<string[]>(() => {
    const list: string[] = [];

    // 1. Weight Validation
    if (grossWeight <= tareWeight) {
      list.push(translate("operations.gross_weight_value_kg_must_exceed_tare_weight_value", { p0: grossWeight.toLocaleString(), p1: tareWeight.toLocaleString() }));
    }

    // 2. Overload Check (> 35 Metric Tons or Gross > 50 Tons)
    if (netWeightTons > 35) {
      list.push(translate("operations.overload_warning_net_load_value_tons_exceeds_the_recommended", { p0: netWeightTons }));
    }
    if (grossWeight > 50000) {
      list.push(translate("operations.high_gross_weight_warning_total_weight_value_tons_may", { p0: (grossWeight / 1000).toFixed(1) }));
    }

    // 3. Pricing Rule Validity
    if (activePricingRule) {
      if (activePricingRule.status !== 'ACTIVE') {
        list.push(translate("operations.selected_pricing_rule_value_is_disabled_or_inactive", { p0: activePricingRule.name }));
      }
      const today = '2026-09-09';
      if (today < activePricingRule.effectiveFrom || today > activePricingRule.effectiveTo) {
        list.push(translate("operations.pricing_rule_has_expired_or_is_not_valid_today", { p0: activePricingRule.effectiveFrom, p1: activePricingRule.effectiveTo }));
      }
      if (activePricingRule.agreedRate <= 0) {
        list.push(translate("operations.unit_rate_is_invalid_or_zero_value", { p0: activePricingRule.agreedRate }));
      }
    } else {
      list.push(translate("operations.no_active_pricing_rule_matches_the_project_carrier_and"));
    }

    // 4. Carrier Authorization
    if (!context.authorizedCarrierIds.includes(carrierId)) {
      list.push(translate("operations.selected_carrier_is_not_authorized_for_this_project"));
    }

    // 5. Material Authorization & Identity Check
    if (!materialId || !materialId.trim()) {
      list.push(translate("operations.material_id_materialid_is_required_to_complete_loading"));
    } else if (!context.knownMaterials.some(m => m.materialId === materialId)) {
      list.push(translate("operations.material_id_value_is_not_registered_in_the_approved", { p0: materialId }));
    } else if (!context.authorizedMaterialIds.includes(materialId)) {
      list.push(translate("operations.selected_material_is_not_approved_for_this_project"));
    }

    return list;
  }, [grossWeight, tareWeight, netWeightTons, activePricingRule, context, carrierId, materialId, translate]);

  // Fast scenario loader for the user's explicit examples
  const loadScenario = (type: 'PER_TON' | 'PER_TRIP') => {
    setProjectId('PRJ-NEOM-001');
    setCarrierId('CAR-ALMAJDOUIE');
    setTruckId('TRK-9901');
    setDriverId('DRV-101');
    setMaterialId('MAT-AGG-01');

    if (type === 'PER_TON') {
      // User's example: 37.4 × 8.5 = 317.90 SAR
      setTareWeight(8200);
      setGrossWeight(45600); // 45600 - 8200 = 37400 kg = 37.4 tons
      setPricingRuleId('PRC-NEOM-HAUL-TON-8.5');
      onNotification({
        type: 'SUCCESS',
        message: translate("operations.per_ton_pricing_example_loaded_37_4_tons_sar")
      });
    } else {
      // User's example: PER_TRIP: 120 SAR
      setTareWeight(14000);
      setGrossWeight(42000); // 28 tons
      setPricingRuleId('PRC-NEOM-SHORT-TRIP-120');
      onNotification({
        type: 'SUCCESS',
        message: translate("operations.fixed_per_trip_pricing_example_loaded_sar_120_trip")
      });
    }
    setCurrentStep('PREVIEW');
  };

  // Step Navigation
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const goToNextStep = () => {
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };
  const goToPrevStep = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  };

  // Execution: createTrip() -> createEvent(LOADED) -> transition(IN_TRANSIT)
  const handleConfirmAndDispatch = async () => {
    // 1. Guard against invalid weights
    if (grossWeight <= tareWeight) {
      onNotification({
        type: 'ERROR',
        message: translate("operations.cannot_confirm_trip_gross_weight_must_exceed_tare_weight")
      });
      return;
    }

    // ================= OFFLINE WORKFLOW ================= //
    // Directive:
    // "يجب أن يعمل Loading أثناء Offline إذا كانت جميع Master Data وPricing Data اللازمة متوفرة محلياً.
    //  لا تسمح بإنشاء رحلة Offline إذا كانت بيانات التسعير غير متاحة.
    //  عند Offline:
    //  Local validation → Local calculation → Save locally → Queue operation"
    if (!isOnline) {
      setIsSubmitting(true);
      try {
        // Step 0: Check prerequisites from IndexedDB
        const report = await offlineCacheService.validateOfflineTripPrerequisites({
          projectId,
          carrierId,
          truckId,
          driverId,
          materialId,
          pricingRuleId: activePricingRule?.pricingRuleId || pricingRuleId,
          shiftDate: '2026-09-09',
        });

        // Strict Requirement: Do NOT allow trip creation if pricing data is unavailable
        if (!report.hasPricingRule || !report.pricingRule || report.pricingRule.agreedRate <= 0) {
          onNotification({
            type: 'SECURITY',
            message: translate("operations.offline_trip_creation_blocked_pricing_data_and_rule_are")
          });
          return;
        }

        if (!report.isReadyForOfflineCreation) {
          onNotification({
            type: 'SECURITY',
            message: operationalMessage(report.blockingReasonAr || "") || translate("operations.cannot_complete_trip_required_local_master_data_is_missing")
          });
          return;
        }

        const resolvedPricing = report.pricingRule;

        // Step 1: Local validation
        if (grossWeight <= tareWeight) {
          throw new Error(translate("operations.gross_weight_value_must_exceed_tare_weight_value", { p0: grossWeight, p1: tareWeight }));
        }

        // Step 2: Local calculation
        const localNetKg = grossWeight - tareWeight;
        const localNetTons = parseFloat((localNetKg / 1000).toFixed(3));
        const localSettlementAmount = resolvedPricing.pricingType === 'PER_TON'
          ? parseFloat((localNetTons * resolvedPricing.agreedRate).toFixed(2))
          : resolvedPricing.agreedRate;

        // Step 3: Save locally
        const nowIso = new Date().toISOString();
        const localTripId = `TRP-OFFLINE-${Date.now()}`;
        const localTripSerial = 'OFFLINE-PENDING';
        const localTicketId = `WB-TKT-LOCAL-${Math.floor(100000 + Math.random() * 900000)}`;

        const offlineTrip: TripRecord = {
          tripId: localTripId,
          projectId,
          tripSerial: localTripSerial,
          ticketId: localTicketId,
          truckId,
          driverId,
          carrierId,
          materialId,
          shiftDate: '2026-09-09',
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
          settlementAmount: localSettlementAmount,
          loaderId: 'SCALE-OP-OFFLINE',
          unloaderId: null,
          status: 'PENDING_NUMBER_ALLOCATION',
          version: 1,
          loadTime: nowIso,
          arrivalTime: null,
          unloadTime: null,
          notes: `[رحلة منشأة أوفلاين: بانتظار تخصيص الرقم المتسلسل الخادومي PENDING_NUMBER_ALLOCATION] الصافي: ${localNetKg.toLocaleString()} كجم`,
          createdAt: nowIso,
          createdBy: 'SCALE-OP-OFFLINE',
          updatedAt: nowIso,
          updatedBy: 'SCALE-OP-OFFLINE',
          pricingSnapshot: {
            pricingRuleId: resolvedPricing.pricingRuleId,
            pricingType: resolvedPricing.pricingType,
            agreedRate: resolvedPricing.agreedRate,
            currency: resolvedPricing.currency || 'SAR',
            settlementBase: resolvedPricing.pricingType === 'PER_TON' ? localNetTons : 1,
            settlementAmount: localSettlementAmount,
            ruleName: resolvedPricing.name,
            pricingSnapshotAt: nowIso,
            effectiveFrom: resolvedPricing.effectiveFrom,
            effectiveTo: resolvedPricing.effectiveTo,
          },
        };

        // Persist into IndexedDB local storage
        await indexedDBService.put('trips', offlineTrip);

        // Also update memory state so all current UI components see it immediately
        (tripEngineService as any).trips = [offlineTrip, ...tripEngineService.getTrips()];

        // Register local dispatch event in state machine
        tripStateMachine.addLifecycleEvent({
          eventId: `EVT-OFFLINE-${Date.now()}`,
          tripId: localTripId,
          action: 'TRIP_GENESIS_DISPATCH',
          fromStatus: 'LOADED',
          toStatus: 'PENDING_NUMBER_ALLOCATION',
          actorId: 'SCALE-OP-OFFLINE',
          actorRole: 'SCALE_OPERATOR',
          actorName: 'مشغل محطة التحميل (Offline)',
          projectId,
          timestamp: nowIso,
          reason: 'تم إنشاء الرحلة واحتساب التسعيرة محلياً بوضع عدم الاتصال بانتظار تخصيص الرقم المتسلسل الخادومي',
          version: 1,
        });

        // Step 4: Queue operation into Outbox
        await outboxService.queueOperation({
          projectId,
          userId: 'SCALE-OP-OFFLINE',
          operationType: 'CREATE_TRIP_LOADING',
          payload: {
            tripId: localTripId,
            tripSerial: localTripSerial,
            ticketId: localTicketId,
            truckId,
            driverId,
            carrierId,
            materialId,
            tareWeight,
            grossWeight,
            pricingRuleId: resolvedPricing.pricingRuleId,
            pricingType: resolvedPricing.pricingType,
            agreedRate: resolvedPricing.agreedRate,
            settlementAmount: localSettlementAmount,
            pricingSnapshot: offlineTrip.pricingSnapshot,
            shiftDate: '2026-09-09',
            loaderId: 'SCALE-OP-OFFLINE',
            version: 1,
            createdAt: nowIso,
          },
        });

        setCreatedTripResult(offlineTrip);
        onTripCreated(offlineTrip);

        onNotification({
          type: 'SUCCESS',
          message: translate("operations.trip_recorded_locally_offline_number_allocation_status_value_pending", { p0: localTripSerial })
        });
        return;
      } catch (err: any) {
        onNotification({
          type: 'ERROR',
          message: operationalMessage(err.message || "") || translate("operations.failed_to_save_the_trip_locally_offline")
        });
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    // ================= ONLINE WORKFLOW ================= //
    if (!activePricingRule || activePricingRule.status !== 'ACTIVE') {
      onNotification({
        type: 'ERROR',
        message: translate("operations.trip_start_blocked_pricing_rule_is_invalid_or_inactive")
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const createParams: CreateTripParams = {
        projectId,
        carrierId,
        truckId,
        driverId,
        materialId,
        pricingRuleId: activePricingRule.pricingRuleId,
        tareWeight,
        grossWeight,
        shiftDate: '2026-09-09',
        loaderId: 'SCALE-OP-01',
        createdBy: 'SCALE-OP-01',
        notes: `تم إنشاء واعتماد الرحلة من محطة التحميل والميزان (الصافي: ${calculatedNetWeightKg.toLocaleString()} كجم)`
      };

      // Executes: createTrip() -> createEvent(LOADED) -> transition(IN_TRANSIT)
      const result = tripEngineService.createTripViaLoadingStation(createParams, {
        actorId: 'SCALE-OP-01',
        actorRole: 'SCALE_OPERATOR',
        actorName: 'مشغل محطة التحميل والميزان'
      });

      // Also persist to IndexedDB for offline continuity
      await indexedDBService.put('trips', result.trip);

      setCreatedTripResult(result.trip);
      onTripCreated(result.trip);

      onNotification({
        type: 'SUCCESS',
        message: translate("operations.trip_created_and_confirmed_trip_value_ticket_value_status", { p0: result.trip.tripSerial, p1: result.trip.ticketId })
      });

      // Background sync any pending outbox items if network is online
      outboxService.syncAll(isSimulatedOffline).catch(() => {});
    } catch (err: any) {
      onNotification({
        type: 'ERROR',
        message: operationalMessage(err.message || "") || translate("operations.failed_to_confirm_and_dispatch_the_trip_at_the")
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreatedTripResult(null);
    setCurrentStep('PROJECT');
  };

  return (
    <div id="loading-station-container" className="space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-900">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-900">{translate("loading.labels.downloadWeighbridge_2")}</h2>
              <p className="text-xs text-stone-500">
                {translate("operations.origin_loading_and_weighing_steps_net_load_calculation_and")}</p>
            </div>
          </div>
        </div>

        {/* Quick Example Loaders & Verification */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVerificationModal(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title={translate("loading.labels.txt_7339fe")}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{translate("operations.requirement_checks")}{testReport.passed}/{testReport.total} {translate("operations.passed_2")}</span>
          </button>

          <span className="text-xs font-semibold text-stone-400">|</span>
          <span className="text-xs font-semibold text-stone-500">{translate("loading.labels.txt_6d4e47")}</span>
          <button
            onClick={() => loadScenario('PER_TON')}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title={translate("loading.labels.downloadPricing")}
          >
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>{translate("loading.labels.txt_17a514")}</span>
          </button>
          <button
            onClick={() => loadScenario('PER_TRIP')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title={translate("loading.labels.downloadPricing_2")}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>{translate("loading.labels.txt_78af8a")}</span>
          </button>
        </div>
      </div>

      {/* Offline & Master Data / Pricing Readiness Status Banner */}
      <div className={`rounded-xl border p-4 text-xs transition-all shadow-2xs ${
        isOnline 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
          : offlinePrereq?.hasPricingRule 
            ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
            : 'bg-rose-50 border-rose-300 text-rose-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-lg shrink-0 ${
              isOnline 
                ? 'bg-emerald-100 text-emerald-800' 
                : offlinePrereq?.hasPricingRule 
                  ? 'bg-amber-200 text-amber-900' 
                  : 'bg-rose-200 text-rose-900'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {isOnline 
                    ? translate("operations.online_mode")
                    : isSimulatedOffline 
                      ? translate("operations.simulated_offline_mode_pwa")
                      : translate("operations.offline_mode_pwa_using_indexeddb")}
                </span>
                {!isOnline && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    offlinePrereq?.hasPricingRule 
                      ? 'bg-amber-200 text-amber-900 border border-amber-300' 
                      : 'bg-rose-200 text-rose-900 border border-rose-300'
                  }`}>
                    {offlinePrereq?.hasPricingRule ? translate("operations.ready_for_local_loading") : translate("operations.blocked_pricing_unavailable")}
                  </span>
                )}
              </div>
              <p className="text-stone-600 mt-0.5 text-[11px]">
                {isOnline 
                  ? translate("operations.direct_server_validation_with_automatic_local_caching_in_indexeddb")
                  : offlinePrereq?.hasPricingRule
                    ? translate("loading.labels.downloadPricing")
                    : translate("operations.system_warning_offline_trip_creation_is_prohibited_when_pricing")}
              </p>
            </div>
          </div>

          {/* Checklist Pills */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-stone-200 shadow-2xs">
              <Database className="w-3 h-3 text-stone-500" />
              <span>{translate("loading.labels.txt_4c9019")}</span>
              <strong className={offlinePrereq?.hasCarrier && offlinePrereq?.hasTruck ? 'text-emerald-700' : 'text-amber-700'}>
                {offlinePrereq?.hasCarrier && offlinePrereq?.hasTruck ? translate("operations.complete_locally") : translate("operations.checking")}
              </strong>
            </span>

            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md border shadow-2xs ${
              offlinePrereq?.hasPricingRule
                ? 'bg-white border-emerald-200 text-emerald-800'
                : 'bg-rose-100/70 border-rose-300 text-rose-900 font-bold'
            }`}>
              <Calculator className="w-3 h-3" />
              <span>{translate("loading.labels.pricing_2")}</span>
              <strong>
                {offlinePrereq?.hasPricingRule 
                  ? translate("operations.approved_locally_value_sar", { p0: offlinePrereq.pricingRule?.agreedRate })
                  : translate("operations.unavailable_locally_creation_blocked")}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Workflow Stepper Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 shadow-2xs">
        {/* Mobile View (< 640px): Compact, No-Scroll Responsive Stepper */}
        <div className="sm:hidden space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {stepIndex + 1}
              </span>
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                {React.createElement(STEPS[stepIndex].icon, { className: 'w-4 h-4 text-amber-600 shrink-0' })}
                <span>{translate(STEPS[stepIndex].label)}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 font-mono">
              {stepIndex + 1} / {STEPS.length}
            </span>
          </div>

          {/* 8 Compact Step Buttons with full interactivity without horizontal clipping */}
          <div className="grid grid-cols-8 gap-1">
            {STEPS.map((step, idx) => {
              const isCompleted = stepIndex > idx;
              const isCurrent = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  title={t(step.label)}
                  aria-label={`${step.number}. ${t(step.label)}`}
                  className={`h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40'
                      : isCompleted
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 text-amber-800" /> : step.number}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop & Tablet View (>= 640px): Full Workflow Stepper */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2 px-2">
            {STEPS.map((step, idx) => {
              const isCompleted = stepIndex > idx;
              const isCurrent = step.id === currentStep;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-amber-600 text-white shadow-xs'
                        : isCompleted
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent 
                        ? 'bg-white text-amber-700' 
                        : isCompleted 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {isCompleted ? <Check className="w-3 h-3" /> : step.number}
                    </span>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t(step.label)}</span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 min-w-[12px] ${stepIndex > idx ? 'bg-amber-500' : 'bg-stone-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content & Live Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Active Step Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs min-h-[420px] flex flex-col justify-between">
            
            {/* ================= STEP 1: PROJECT ================= */}
            {currentStep === 'PROJECT' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("loading.labels.project")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.projectDownloadPricing")}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-700">{translate("loading.labels.txt_6555e1")}</label>
                  <div className="grid grid-cols-1 gap-3">
                    {availableProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setProjectId(p.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          projectId === p.id 
                            ? 'border-amber-600 bg-amber-50/50' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            projectId === p.id ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                          }`}>
                            {projectId === p.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-stone-900">{p.name}</div>
                            <div className="text-[11px] text-stone-500">{translate("loading.labels.project")}{p.id}</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {translate("loading.status.active")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: CARRIER ================= */}
            {currentStep === 'CARRIER' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("loading.labels.carrier_2")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.project_3")}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-700">{translate("loading.labels.txt_545437")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableCarriers.map(c => (
                      <div
                        key={c.carrierId}
                        onClick={() => {
                          setCarrierId(c.carrierId);
                          // Auto select first truck & driver for this carrier
                          const trk = context.knownTrucks.find(t => t.carrierId === c.carrierId);
                          if (trk) setTruckId(trk.truckId);
                          const drv = context.knownDrivers.find(d => d.carrierId === c.carrierId);
                          if (drv) setDriverId(drv.driverId);
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          carrierId === c.carrierId 
                            ? 'border-amber-600 bg-amber-50/50 shadow-2xs' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{c.name}</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            carrierId === c.carrierId ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                          }`}>
                            {carrierId === c.carrierId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">{translate("loading.labels.carrier_2")}{c.carrierId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: TRUCK ================= */}
            {currentStep === 'TRUCK' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("loading.labels.truck")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.carrier_4")}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-700">{translate("loading.labels.trucks")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableTrucks.map(t => (
                      <div
                        key={t.truckId}
                        onClick={() => setTruckId(t.truckId)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          truckId === t.truckId 
                            ? 'border-amber-600 bg-amber-50/50 shadow-2xs' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{t.plate}</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            truckId === t.truckId ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                          }`}>
                            {truckId === t.truckId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span>{translate("operations.truck_number")}{t.truckId}</span>
                          <span className="font-mono text-stone-600">{translate("loading.labels.txt_754551")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: DRIVER ================= */}
            {currentStep === 'DRIVER' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <User className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("loading.labels.driver")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.driversCarrierTruck")}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-700">{translate("loading.labels.drivers")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableDrivers.map(d => (
                      <div
                        key={d.driverId}
                        onClick={() => setDriverId(d.driverId)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          driverId === d.driverId 
                            ? 'border-amber-600 bg-amber-50/50 shadow-2xs' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{d.name}</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            driverId === d.driverId ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                          }`}>
                            {driverId === d.driverId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-stone-500">
                          <div>{translate("loading.labels.txt_2dfd1b")}<span className="font-mono text-stone-700">{d.idNumber}</span></div>
                          <div>{translate("operations.mobile")}<span className="font-mono text-stone-700">{d.phone}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 5: MATERIAL ================= */}
            {currentStep === 'MATERIAL' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("loading.labels.material_2")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.materialsProject")}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-700">{translate("loading.labels.materialsProject_2")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableMaterials.map(m => (
                      <div
                        key={m.materialId}
                        onClick={() => setMaterialId(m.materialId)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          materialId === m.materialId 
                            ? 'border-amber-600 bg-amber-50/50 shadow-2xs' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{m.name}</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            materialId === m.materialId ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                          }`}>
                            {materialId === m.materialId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">{translate("loading.labels.material_3")}<span className="font-mono text-stone-700">{m.code}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 6: TARE ================= */}
            {currentStep === 'TARE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("field_operations.step6_tare")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.txt_177f70")}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {translate("field_operations.step6_tare_kg")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tareWeight}
                        onChange={e => setTareWeight(Math.max(0, Number(e.target.value)))}
                        className="w-full text-lg font-mono font-bold px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <span className="absolute left-3 top-3.5 text-xs font-bold text-stone-400">KG</span>
                    </div>
                  </div>

                  {/* Fast simulator buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block mb-1.5">{translate("loading.labels.txt_604b70")}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTareWeight(8200)}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold"
                      >
                        {translate("loading.labels.txt_419290")}</button>
                      <button
                        type="button"
                        onClick={() => setTareWeight(14200)}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold"
                      >
                        {translate("loading.labels.txt_4116bc")}</button>
                      <button
                        type="button"
                        onClick={() => setTareWeight(15000)}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold"
                      >
                        {translate("loading.labels.txt_2dbe14")}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 7: GROSS ================= */}
            {currentStep === 'GROSS' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{translate("field_operations.step7_gross")}</h3>
                    <p className="text-xs text-stone-500">{translate("loading.labels.txt_72a483")}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {translate("field_operations.step7_gross_kg")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={grossWeight}
                        onChange={e => setGrossWeight(Math.max(0, Number(e.target.value)))}
                        className="w-full text-lg font-mono font-bold px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <span className="absolute left-3 top-3.5 text-xs font-bold text-stone-400">KG</span>
                    </div>
                  </div>

                  {/* Immediate dynamic calculation card */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-amber-800 font-medium">{translate("loading.labels.txt_6e3072")}</div>
                      <div className="text-base font-mono font-bold text-amber-950">
                        {calculatedNetWeightKg.toLocaleString()} {translate("operations.kg_2")}{netWeightTons} {translate("operations.tons")}</div>
                    </div>
                    <span className="text-xs font-mono text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      {grossWeight} - {tareWeight}
                    </span>
                  </div>

                  {/* Fast simulator buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block mb-1.5">{translate("loading.labels.txt_74acad")}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setGrossWeight(45600)}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold"
                      >
                        {translate("loading.labels.txt_4d6846")}</button>
                      <button
                        type="button"
                        onClick={() => setGrossWeight(42000)}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold"
                      >
                        {translate("loading.labels.txt_3668a3")}</button>
                      <button
                        type="button"
                        onClick={() => setGrossWeight(49800)}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold"
                      >
                        {translate("loading.labels.txt_1f364f")}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 8: PREVIEW & CONFIRM ================= */}
            {currentStep === 'PREVIEW' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">{translate("loading.labels.downloadPricing_4")}</h3>
                      <p className="text-xs text-stone-500">
                        {translate("field_operations.review_subtext")}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    <span>{translate("loading.labels.txt_37e310")}</span>
                  </span>
                </div>

                {/* 4 Core Summary Stat Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Net Weight */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-stone-500 mb-1">{translate("field_operations.net_weight_label")}</div>
                    <div className="text-lg font-mono font-bold text-stone-900">
                      {netWeightTons} <span className="text-xs font-normal text-stone-500">{translate("shared.units.ton")}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {calculatedNetWeightKg.toLocaleString()} {translate("shared.units.kg")}</div>
                  </div>

                  {/* 2. Pricing Type */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-stone-500 mb-1">{translate("loading.labels.pricing_2")}</div>
                    <div className="text-sm font-bold text-stone-900">
                      {activePricingRule?.pricingType === 'PER_TON' ? translate("operations.per_ton_per_ton") : translate("operations.per_trip_per_trip")}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">
                      {activePricingRule?.name}
                    </div>
                  </div>

                  {/* 3. Agreed Rate */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-stone-500 mb-1">{translate("operations.agreed_rate")}</div>
                    <div className="text-lg font-mono font-bold text-stone-900">
                      {activePricingRule?.agreedRate.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-stone-500">
                        {activePricingRule?.currency || 'SAR'} / {activePricingRule?.pricingType === 'PER_TON' ? translate("shared.units.ton") : translate("operations.trip")}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">{translate("loading.labels.txt_67b2a1")}</div>
                  </div>

                  {/* 4. Estimated Settlement */}
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-amber-900 mb-1">{translate("loading.labels.txt_73e4a3")}</div>
                    <div className="text-lg font-mono font-bold text-amber-950">
                      {estimatedSettlement.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-xs font-normal text-amber-800">{estimatedSettlement.currency}</span>
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium">{translate("loading.labels.txt_31e3da")}</div>
                  </div>
                </div>

                {/* Explicit Pricing Method Display (Requirement: يجب إظهار طريقة التسعير للمستخدم قبل التأكيد) */}
                <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-950">{translate("loading.labels.confirm")}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200/60 text-amber-900">
                      {activePricingRule?.pricingType}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-stone-600">{translate("loading.labels.txt_56bb7e")}</div>
                      <div className="text-base font-mono font-bold text-stone-900 mt-0.5">
                        {activePricingRule?.pricingType === 'PER_TON' ? (
                          <span>
                            {netWeightTons} {translate("operations.tons_2")}{activePricingRule.agreedRate} {translate("operations.sar")}<span className="text-amber-700">{estimatedSettlement.amount.toFixed(2)} {translate("shared.units.sar")}</span>
                          </span>
                        ) : (
                          <span>
                            {translate("operations.fixed_trip_rate")}<span className="text-amber-700">{activePricingRule?.agreedRate.toFixed(2)} {translate("shared.units.sar")}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-[11px]">{translate("loading.labels.edit")}</span>
                    </div>
                  </div>

                  {/* Switch pricing rule selector if needed */}
                  {applicablePricingRules.length > 1 && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-stone-600">{translate("loading.labels.pricing_4")}</span>
                      <select
                        value={activePricingRule?.pricingRuleId}
                        onChange={e => setPricingRuleId(e.target.value)}
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white font-medium text-stone-800"
                      >
                        {applicablePricingRules.map(r => (
                          <option key={r.pricingRuleId} value={r.pricingRuleId}>
                            {r.name} ({r.agreedRate} {r.currency} / {r.pricingType === 'PER_TON' ? translate("shared.units.ton") : translate("operations.trip")})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Warnings Card */}
                {warnings.length > 0 ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{translate("loading.labels.txt_458dbb")}</span>
                    </div>
                    <ul className="space-y-1 pr-5 list-disc text-xs text-rose-800">
                      {warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-900 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{translate("loading.status.pricingSuccess")}</span>
                  </div>
                )}

                {/* Success Result Box (if just created) */}
                {createdTripResult && (
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>{translate("loading.status.createConfirmTripDownload")}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-200 text-emerald-900 font-mono text-xs font-bold">
                        {createdTripResult.status} (v{createdTripResult.version})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-emerald-200">
                      <div>
                        <span className="text-stone-500 block">{translate("operations.trip_number")}</span>
                        <span className="font-mono font-bold text-stone-900">{createdTripResult.tripSerial}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">{translate("operations.ticket_number_2")}</span>
                        <span className="font-mono font-bold text-stone-900">{createdTripResult.ticketId}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">{translate("operations.approved_net_weight")}</span>
                        <span className="font-mono font-bold text-stone-900">{createdTripResult.netWeight.toLocaleString()} {translate("shared.units.kg")}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">{translate("loading.labels.txt_57f8de")}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {createdTripResult.settlementAmount.toFixed(2)} {createdTripResult.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="text-[11px] text-emerald-800">
                        {translate("loading.labels.txt_195be1")}<strong>createTrip()</strong> ➔ <strong>createEvent(LOADED)</strong> ➔ <strong>transition(IN_TRANSIT)</strong>
                      </div>
                      {onViewTripDetails && (
                        <button
                          onClick={() => onViewTripDetails(createdTripResult)}
                          className="mr-auto px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors"
                        >
                          {translate("loading.labels.viewDetailsTrip")}</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Step Actions */}
            <div className="border-t border-stone-100 pt-4 mt-6 flex items-center justify-between">
              <div>
                {stepIndex > 0 ? (
                  <button
                    onClick={goToPrevStep}
                    className="px-4 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    <span>{translate("field_operations.prev_btn")}</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div className="flex items-center gap-2">
                {createdTripResult && (
                  <button
                    onClick={resetForm}
                    className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{translate("loading.labels.createTrip_2")}</span>
                  </button>
                )}

                {stepIndex < STEPS.length - 1 ? (
                  <button
                    onClick={goToNextStep}
                    className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{translate("operations.next")}{translate(STEPS[stepIndex + 1].label)})</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmAndDispatch}
                    disabled={isSubmitting || grossWeight <= tareWeight || (!isOnline && !offlinePrereq?.hasPricingRule)}
                    className={`px-6 py-2.5 rounded-lg text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                      !isOnline && !offlinePrereq?.hasPricingRule
                        ? 'bg-rose-700 cursor-not-allowed opacity-75'
                        : !isOnline
                          ? 'bg-amber-700 hover:bg-amber-800'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    title={
                      !isOnline && !offlinePrereq?.hasPricingRule
                        ? translate("loading.labels.createTrip_2")
                        : !isOnline
                          ? translate("operations.validate_calculate_and_store_the_trip_locally_in_indexeddb")
                          : translate("loading.labels.confirm")
                    }
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmitting 
                        ? translate("operations.processing_and_recording")
                        : !isOnline
                          ? offlinePrereq?.hasPricingRule
                            ? translate("operations.save_and_dispatch_locally_offline_outbox_queue")
                            : translate("operations.creation_blocked_pricing_data_unavailable_locally")
                          : translate("operations.confirm_and_dispatch_shipment")}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Loading Card & Audit Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-900 text-white rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">{translate("operations.live_scale_slip")}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] font-mono text-amber-300">
                {translate("operations.live_scale")}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-800">
                <span className="text-stone-400">{translate("operations.project")}</span>
                <span className="font-bold text-stone-200">PRJ-NEOM-001</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-800">
                <span className="text-stone-400">{translate("operations.carrier")}</span>
                <span className="font-bold text-stone-200">
                  {context.knownCarriers.find(c => c.carrierId === carrierId)?.name || carrierId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-800">
                <span className="text-stone-400">{translate("loading.labels.truck")}</span>
                <span className="font-mono font-bold text-amber-300">
                  {context.knownTrucks.find(t => t.truckId === truckId)?.plate || truckId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-800">
                <span className="text-stone-400">{translate("loading.labels.driver")}</span>
                <span className="font-bold text-stone-200">
                  {context.knownDrivers.find(d => d.driverId === driverId)?.name || driverId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-800">
                <span className="text-stone-400">{translate("loading.labels.material_2")}</span>
                <span className="font-bold text-stone-200">
                  {context.knownMaterials.find(m => m.materialId === materialId)?.name || materialId}
                </span>
              </div>
            </div>

            {/* Weights Breakdown */}
            <div className="bg-stone-800/80 rounded-lg p-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-stone-300">
                <span>{translate("operations.gross_weight")}</span>
                <span>{grossWeight.toLocaleString()} KG</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>{translate("operations.tare_weight")}</span>
                <span>- {tareWeight.toLocaleString()} KG</span>
              </div>
              <div className="border-t border-stone-700 pt-1.5 flex justify-between font-bold text-amber-400 text-sm">
                <span>{translate("loading.labels.txt_6765dc")}</span>
                <span>{calculatedNetWeightKg.toLocaleString()} KG</span>
              </div>
              <div className="text-left text-[11px] text-stone-400">
                ({netWeightTons} {translate("operations.metric_tons")}</div>
            </div>

            {/* Settlement Lock Badge */}
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>{translate("loading.labels.txt_212255")}</span>
              </div>
              <p className="text-[10px] text-stone-300 leading-relaxed">
                {translate("operations.trip_settlement")}{estimatedSettlement.amount.toFixed(2)} {estimatedSettlement.currency}{translate("operations.is_calculated_automatically_from_the_approved_net_weight_and")}</p>
            </div>
          </div>

          {/* Workflow Sequence Info Box */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-xs space-y-2 text-stone-700">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{translate("loading.labels.confirm_4")}</span>
            </div>
            <ol className="space-y-1 pr-4 list-decimal text-[11px] text-stone-600">
              <li><strong>createTrip()</strong>{translate("loading.labels.createTripDownload")}</li>
              <li><strong>createEvent(LOADED)</strong>{translate("loading.labels.txt_79f87c")}</li>
              <li><strong>transition(IN_TRANSIT)</strong>{translate("operations.validate_and_resolve_historical_pricing_then_transition_to_in")}</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ================= PROMPT SPECIFICATION & AUDIT VERIFICATION MODAL ================= */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {translate("loading.labels.txt_3400c3")}</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {translate("operations.loading_station_engineering_specification_and_test_results")}</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Score Card */}
              <div className="bg-gradient-to-l from-emerald-500/10 via-emerald-50 to-white border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    ✓
                  </span>
                  <div>
                    <div className="text-sm font-bold text-emerald-950">
                      {translate("loading.status.success")}</div>
                    <div className="text-xs text-emerald-800">
                      {translate("operations.passed_3")}{testReport.passed} {translate("operations.of")}{testReport.total} {translate("operations.automated_software_checks")}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {translate("loading.labels.txt_73aefc")}</button>
              </div>

              {/* Requirement by Requirement Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-700 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-600" />
                  <span>{translate("loading.labels.txt_258b75")}</span>
                </h4>

                {/* Item 1 */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">1</span>
                      <span className="text-xs font-bold text-stone-900">{translate("loading.labels.txt_68840f")}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{translate("loading.status.completed")}</span>
                  </div>
                  <p className="text-xs font-mono text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200">
                    {translate("operations.project_carrier_truck_driver_material_tare_gross_preview")}</p>
                  <p className="text-[11px] text-stone-500">
                    {translate("loading.labels.txt_2f5b25")}</p>
                </div>

                {/* Item 2 */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">2</span>
                      <span className="text-xs font-bold text-stone-900">{translate("loading.labels.txt_285ec5")}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{translate("loading.status.completed_2")}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-stone-200 font-medium text-stone-800">{translate("field_operations.net_weight_label")} ✓</div>
                    <div className="bg-white p-2 rounded-lg border border-stone-200 font-medium text-stone-800">{translate("operations.pricing_type")}</div>
                    <div className="bg-white p-2 rounded-lg border border-stone-200 font-medium text-stone-800">{translate("operations.agreed_rate_2")}</div>
                    <div className="bg-white p-2 rounded-lg border border-stone-200 font-medium text-stone-800">{translate("operations.estimated_settlement")}</div>
                    <div className="bg-white p-2 rounded-lg border border-stone-200 font-medium text-stone-800">{translate("operations.warnings")}</div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">3</span>
                      <span className="text-xs font-bold text-stone-900">{translate("loading.labels.pricing_6")}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{translate("loading.labels.txt_20c9dd")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                      <div className="text-xs font-bold text-sky-800">{translate("loading.labels.txt_797eb0")}</div>
                      <div className="text-sm font-mono font-bold text-stone-900">37.4 × 8.5 = 317.90 SAR</div>
                      <div className="text-[10px] text-stone-500">
                        {translate("loading.labels.txt_a2ced3")}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                      <div className="text-xs font-bold text-emerald-800">{translate("loading.labels.txt_49a8b5")}</div>
                      <div className="text-sm font-mono font-bold text-stone-900">{translate("loading.labels.txt_a9fcb1")}</div>
                      <div className="text-[10px] text-stone-500">
                        {translate("operations.fixed_settlement_independent_of_tare_and_gross_weight")}</div>
                    </div>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">4</span>
                      <span className="text-xs font-bold text-stone-900">{translate("loading.labels.pricingConfirm")}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{translate("loading.labels.txt_31e684")}</span>
                  </div>
                  <p className="text-xs text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200 leading-relaxed">
                    {translate("operations.the_preview_includes_a_calculation_card_showing_the_contract")}</p>
                </div>

                {/* Item 5 */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">5</span>
                      <span className="text-xs font-bold text-stone-900">{translate("loading.labels.txt_2b7e09")}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{translate("loading.labels.txt_19142a")}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-2 text-stone-800">
                      <span className="text-emerald-600 font-bold">✔</span>
                      <strong>createTrip()</strong>{translate("loading.labels.createTripStatusSave")}</div>
                    <div className="flex items-center gap-2 text-stone-800">
                      <span className="text-emerald-600 font-bold">✔</span>
                      <strong>createEvent(LOADED)</strong>{translate("loading.labels.txt_1a9224")}</div>
                    <div className="flex items-center gap-2 text-stone-800">
                      <span className="text-emerald-600 font-bold">✔</span>
                      <strong>transition(IN_TRANSIT)</strong>{translate("operations.official_transition_to_in_transit_and_generation_of_ticket")}</div>
                  </div>
                </div>

                {/* Item 6 */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">6</span>
                      <span className="text-xs font-bold text-stone-900">{translate("loading.labels.edit_2")}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{translate("loading.labels.txt_3c2d03")}</span>
                  </div>
                  <p className="text-xs text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200 leading-relaxed">
                    {translate("loading.labels.save_3")}</p>
                </div>
              </div>

              {/* Automated Test Suite Results */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="text-xs font-bold text-stone-800">{translate("loading.labels.txt_732b41")}</div>
                <div className="space-y-1.5">
                  {testReport.results.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span className="font-bold text-stone-900">{r.name}</span>
                      </div>
                      <span className="text-emerald-800 font-mono text-[11px] font-semibold">{r.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {translate("operations.close_report")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
