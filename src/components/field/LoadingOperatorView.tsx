import { tripCommandErrorKey } from '../../i18n/tripCommandErrors';
import { TRIP_COMMANDS } from '../../types/tripCommands';
import { presentOperationalMessage } from "../../i18n/operationalMessages";
import { canonicalRelationshipContextService } from "../../services/canonicalRelationshipContext.service";
import { ProjectEntity } from '../../types/entities';
import { RelationshipContext } from '../../types/dataQuality';
import { pricingService } from "../../services/pricing.service";
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { TripRecord, TripActorRole, TripPricingType } from '../../types/tripEngine';
import { MasterPricingRule } from '../../services/tripEngine.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { projectRepository } from '../../repositories/project.repository';
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
export const LOADING_AUTHORIZED_ROLES: UserRole[] = [...TRIP_COMMANDS.RECORD_LOADING.roles];

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
  const { t: translate, t, isRTL } = useI18n();
  const operationalMessage = (message: string) => tripCommandErrorKey(message) ? translate(tripCommandErrorKey(message)!) : presentOperationalMessage(message, translate);
  const { isOnline, isSimulatedOffline } = useOnlineStatus();

  // Role Authorization Check
  const isAuthorized = useMemo(() => {
    return LOADING_AUTHORIZED_ROLES.includes(authContext.role);
  }, [authContext.role]);

  // Canonical Relationship Context State
  const [context, setContext] = useState<RelationshipContext | null>(null);
  const [readinessStatus, setReadinessStatus] = useState<'PENDING' | 'READY' | 'ERROR'>('PENDING');

  const generationRef = useRef<number>(0);

  const [projectsList, setProjectsList] = useState<ProjectEntity[]>([]);

  const assignedProjectScopeKey = JSON.stringify([...new Set(authContext.assignedProjectIds || [])].sort());

  useEffect(() => {
    const unsubscribe = projectRepository.subscribeToProjects(
      (list) => {
        setProjectsList(list || []);
      },
      (err) => console.error(err),
      JSON.parse(assignedProjectScopeKey),
      authContext.role === 'SUPER_ADMIN'
    );
    return () => unsubscribe();
  }, [authContext.userId, authContext.role, assignedProjectScopeKey]);

  // Available Projects (scoped by assignedProjectIds if set, unless SUPER_ADMIN)
  const availableProjects = useMemo(() => {
    const all = projectsList.map(p => ({
      id: p.projectId,
      name: translate("field_operations.project_display", {
        name: p.nameAr,
        nameAr: p.nameAr,
        nameEn: p.nameEn || p.nameAr,
        id: p.projectId
      })
    }));
    if (authContext.role === 'SUPER_ADMIN') {
      return all;
    }
    return all.filter(p => (authContext.assignedProjectIds || []).includes(p.id));
  }, [projectsList, authContext, t, translate]);

  // Form State: Project and Entity Selections (no mock defaults)
  const [projectId, setProjectId] = useState<string>('');
  const [carrierId, setCarrierId] = useState<string>('');
  const [truckId, setTruckId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [materialId, setMaterialId] = useState<string>('');

  useEffect(() => {
    setProjectId(current => {
      if (availableProjects.length === 0) return '';
      if (current && availableProjects.some(project => project.id === current)) return current;
      return availableProjects[0].id;
    });
  }, [availableProjects]);

  // Project Switch Isolation & Canonical Relationship Loading
  useEffect(() => {
    const currentGen = ++generationRef.current;

    // Immediately flush previous context and reset selections on project switch
    setContext(null);
    setCarrierId('');
    setTruckId('');
    setDriverId('');
    setMaterialId('');
    setReadinessStatus('PENDING');

    if (!projectId || projectId === 'ALL') {
      return;
    }

    canonicalRelationshipContextService
      .getProjectRelationshipContext(projectId)
      .then((ctx) => {
        if (currentGen !== generationRef.current) return;
        setContext(ctx);
        setReadinessStatus('READY');
      })
      .catch((err) => {
        if (currentGen !== generationRef.current) return;
        console.error('Canonical relationship context error:', err);
        setContext(null);
        setReadinessStatus('ERROR');
      });
  }, [projectId]);

  // Dataset Readiness States
  const isMasterDataReady = useMemo(() => {
    return Boolean(
      projectId &&
      projectId !== 'ALL' &&
      readinessStatus === 'READY' &&
      context !== null
    );
  }, [projectId, readinessStatus, context]);

  const hasMasterDataError = useMemo(() => {
    return readinessStatus === 'ERROR';
  }, [readinessStatus]);

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
    if (!context) return [];
    return context.knownCarriers.filter(c => context.authorizedCarrierIds.includes(c.carrierId));
  }, [context]);

  // Sync carrier selection when availableCarriers update
  useEffect(() => {
    if (availableCarriers.length > 0 && (!carrierId || !availableCarriers.some(c => c.carrierId === carrierId))) {
      setCarrierId(availableCarriers[0].carrierId);
    }
  }, [availableCarriers, carrierId]);

  // Trucks belonging to selected carrier
  const availableTrucks = useMemo(() => {
    if (!context || !carrierId) return [];
    return context.knownTrucks.filter(t => t.carrierId === carrierId && t.status === 'ACTIVE');
  }, [context, carrierId]);

  // Drivers belonging to selected carrier
  const availableDrivers = useMemo(() => {
    if (!context || !carrierId) return [];
    return context.knownDrivers.filter(d => d.carrierId === carrierId && d.status === 'ACTIVE');
  }, [context, carrierId]);

  // Materials authorized in project
  const availableMaterials = useMemo(() => {
    if (!context) return [];
    return context.knownMaterials.filter(m => context.authorizedMaterialIds.includes(m.materialId));
  }, [context]);

  // Sync material selection when availableMaterials update
  useEffect(() => {
    if (availableMaterials.length > 0 && (!materialId || !availableMaterials.some(m => m.materialId === materialId))) {
      setMaterialId(availableMaterials[0].materialId);
    }
  }, [availableMaterials, materialId]);

  // Sync truck and driver selections when carrier changes
  useEffect(() => {
    if (availableTrucks.length > 0 && (!truckId || !availableTrucks.some(t => t.truckId === truckId))) {
      setTruckId(availableTrucks[0].truckId);
    } else if (availableTrucks.length === 0) {
      setTruckId('');
    }
    if (availableDrivers.length > 0 && (!driverId || !availableDrivers.some(d => d.driverId === driverId))) {
      setDriverId(availableDrivers[0].driverId);
    } else if (availableDrivers.length === 0) {
      setDriverId('');
    }
  }, [carrierId, availableTrucks, availableDrivers, truckId, driverId]);

  // Applicable Pricing Rules
  const applicablePricingRules = useMemo(() => {
    return pricingService.getRules().filter(r => 
      r.projectId === projectId &&
      (!r.carrierId || r.carrierId === carrierId) &&
      (!r.materialId || r.materialId === materialId)
    );
  }, [projectId, carrierId, materialId]);

  // Active Pricing Rule
  const activePricingRule = useMemo<MasterPricingRule | undefined>(() => {
    const found = applicablePricingRules.find(r => r.pricingRuleId === pricingRuleId);
    if (found) return found;
    return applicablePricingRules[0] || pricingService.getRules().find(r => r.pricingRuleId === pricingRuleId) || pricingService.getRules()[0];
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
      return { amount: 0, text: translate("field_operations.no_active_rate"), currency: 'SAR', pricingType: 'PER_TON' };
    }
    if (activePricingRule.pricingType === 'PER_TON') {
      const total = parseFloat((netWeightTons * activePricingRule.agreedRate).toFixed(2));
      return {
        amount: total,
        text: translate("operations.value_tons_value_value_value", { p0: netWeightTons, p1: activePricingRule.agreedRate, p2: total.toFixed(2), p3: activePricingRule.currency || 'SAR' }),
        currency: activePricingRule.currency || 'SAR',
        pricingType: 'PER_TON'
      };
    } else {
      return {
        amount: activePricingRule.agreedRate,
        text: translate("operations.value_value_fixed_rate_per_trip", { p0: activePricingRule.agreedRate.toFixed(2), p1: activePricingRule.currency || 'SAR' }),
        currency: activePricingRule.currency || 'SAR',
        pricingType: 'PER_TRIP'
      };
    }
  }, [activePricingRule, netWeightTons, translate]);

  // Validation Checks: Blocking vs Warnings
  const blockingErrors = useMemo<string[]>(() => {
    const errors: string[] = [];
    if (!projectId || projectId === 'ALL') {
      errors.push(translate("field_operations.validation_project_required"));
      return errors;
    }
    if (hasMasterDataError) {
      errors.push(translate("operations.failed_to_load_approved_project_data_from_the_database"));
      return errors;
    }
    if (!isMasterDataReady || !context) {
      errors.push(translate("operations.loading_and_refreshing_approved_project_data"));
      return errors;
    }

    if (!carrierId) {
      errors.push(translate("field_operations.validation_carrier_required"));
    } else {
      const knownCarrier = context.knownCarriers.find(c => c.carrierId === carrierId);
      if (!knownCarrier) {
        errors.push(translate("operations.carrier_value_is_not_defined_in_project_data", { p0: carrierId }));
      } else if (!context.authorizedCarrierIds.includes(carrierId)) {
        errors.push(translate("operations.carrier_value_is_not_authorized_for_this_project", { p0: knownCarrier.name || carrierId }));
      }
    }

    if (!truckId) {
      errors.push(translate("field_operations.validation_truck_required"));
    } else {
      const knownTruck = context.knownTrucks.find(t => t.truckId === truckId);
      if (!knownTruck) {
        errors.push(translate("operations.truck_value_is_not_defined_in_project_data", { p0: truckId }));
      } else if (carrierId && knownTruck.carrierId !== carrierId) {
        errors.push(translate("operations.truck_value_does_not_belong_to_the_selected_carrier", { p0: knownTruck.plate || truckId }));
      }
    }

    if (!driverId) {
      errors.push(translate("field_operations.validation_driver_required"));
    } else {
      const knownDriver = context.knownDrivers.find(d => d.driverId === driverId);
      if (!knownDriver) {
        errors.push(translate("operations.driver_value_is_not_defined_in_project_data", { p0: driverId }));
      } else if (carrierId && knownDriver.carrierId !== carrierId) {
        errors.push(translate("operations.driver_value_does_not_belong_to_the_selected_carrier", { p0: knownDriver.name || driverId }));
      }
    }

    if (!materialId || !materialId.trim()) {
      errors.push(translate("field_operations.validation_material_required"));
    } else {
      const knownMat = context.knownMaterials.find(m => m.materialId === materialId);
      if (!knownMat) {
        errors.push(translate("operations.material_id_value_is_not_in_the_approved_catalog", { p0: materialId }));
      } else if (!context.authorizedMaterialIds.includes(materialId)) {
        errors.push(translate("operations.material_value_is_not_authorized_for_this_project", { p0: (knownMat as any).nameAr || knownMat.name || materialId }));
      }
    }

    if (grossWeight <= 0) errors.push(translate("field_operations.validation_gross_required"));
    if (tareWeight <= 0) errors.push(translate("field_operations.validation_tare_required"));
    if (grossWeight <= tareWeight) {
      errors.push(translate("operations.weight_blocked_gross_weight_value_kg_must_exceed_tare", { p0: grossWeight.toLocaleString(), p1: tareWeight.toLocaleString() }));
    }
    if (!activePricingRule) {
      errors.push(translate("field_operations.validation_no_pricing_rule"));
    }
    return errors;
  }, [
    projectId,
    hasMasterDataError,
    isMasterDataReady,
    context,
    carrierId,
    truckId,
    driverId,
    materialId,
    grossWeight,
    tareWeight,
    activePricingRule,
    translate
  ]);

  const regulatoryWarnings = useMemo<string[]>(() => {
    const warnings: string[] = [];
    if (netWeightTons > 35) {
      warnings.push(translate("operations.overload_warning_net_load_value_tons_exceeds_the_recommended", { p0: netWeightTons }));
    }
    if (grossWeight > 50000) {
      warnings.push(translate("operations.high_gross_weight_warning_gross_weight_value_tons_may", { p0: (grossWeight / 1000).toFixed(1) }));
    }
    return warnings;
  }, [netWeightTons, grossWeight, translate]);

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
        message: translate("operations.entry_scale_read_successfully_value_kg", { p0: simulated.toLocaleString() })
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
        message: translate("operations.exit_scale_read_successfully_value_kg", { p0: simulated.toLocaleString() })
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

      // Security check for offline mode: must have pricing rule
      if (!isOnline || isSimulatedOffline) {
        if (!offlinePrereq?.hasPricingRule || !offlinePrereq.pricingRule || offlinePrereq.pricingRule.agreedRate <= 0) {
          throw new Error(translate("field_operations.security_offline_block"));
        }
      }

      const localNetKg = grossWeight - tareWeight;
      const localNetTons = parseFloat((localNetKg / 1000).toFixed(3));
      const resolvedPricing = offlinePrereq?.pricingRule || activePricingRule;

      const rate = resolvedPricing?.agreedRate || 0;
      const localSettlement = resolvedPricing?.pricingType === 'PER_TON'
        ? parseFloat((localNetTons * rate).toFixed(2))
        : rate;

      const clientTripId = `TRP-CLIENT-${Date.now()}`;
      const clientSerial = `TRP-LOCAL-${Math.floor(1000 + Math.random() * 9000)}`;
      const clientTicket = `WB-TKT-LOCAL-${Math.floor(100000 + Math.random() * 900000)}`;

      const clientRecord: TripRecord = {
        tripId: clientTripId,
        projectId,
        tripSerial: clientSerial,
        ticketId: clientTicket,
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
        pricingRuleId: resolvedPricing?.pricingRuleId || pricingRuleId || '',
        pricingType: (resolvedPricing?.pricingType === 'PER_TON' ? 'PER_TON' : 'PER_TRIP') as TripPricingType,
        agreedRate: rate,
        currency: resolvedPricing?.currency || 'SAR',
        settlementBase: resolvedPricing?.pricingType === 'PER_TON' ? localNetTons : 1,
        settlementAmount: localSettlement,
        loaderId: authContext.userId,
        unloaderId: null,
        status: 'IN_TRANSIT',
        version: 1,
        loadTime: nowIso,
        arrivalTime: null,
        unloadTime: null,
        notes: `[تذكرة ميزان منشأة ميدانياً] الصافي: ${localNetKg.toLocaleString()} كجم`,
        createdAt: nowIso,
        createdBy: authContext.userId,
        updatedAt: nowIso,
        updatedBy: authContext.userId,
        pricingSnapshot: resolvedPricing ? {
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
        } : undefined
      };

      // Store in IndexedDB and enqueue in Outbox
      await indexedDBService.put('trips', clientRecord);
      const queuedOp = await outboxService.queueOperation({
        operationType: 'CREATE_TRIP_LOADING',
        projectId: clientRecord.projectId,
        userId: authContext.userId,
        payload: clientRecord
      });

      if (isOnline && !isSimulatedOffline) {
        const syncResult = await outboxService.syncAll(false);
        const syncedRecord = await indexedDBService.getById<any>('trips', clientRecord.tripId);
        
        if (syncResult.failedCount > 0) {
          const ops = await outboxService.getOperations();
          const opAfterSync = ops.find(o => o.operationId === queuedOp.operationId);
          throw new Error(opAfterSync?.errorReason || translate("operations.failed_to_synchronize_the_weighbridge_ticket_with_the_server"));
        }

        const finalTrip = syncedRecord || clientRecord;
        setCreatedTrip(finalTrip);
        if (onTripCreated) onTripCreated(finalTrip);
        if (onNotification) {
          onNotification({
            type: 'SUCCESS',
            message: translate("operations.weighbridge_ticket_value_created_and_synchronized_successfully_operational_status", { p0: finalTrip.tripSerial })
          });
        }
      } else {
        // Offline / simulated offline path
        setCreatedTrip(clientRecord);
        if (onTripCreated) onTripCreated(clientRecord);
        if (onNotification) {
          onNotification({
            type: 'SUCCESS',
            message: translate("operations.loading_ticket_value_recorded_locally_and_added_to_the", { p0: clientRecord.tripSerial })
          });
        }
      }
    } catch (err: any) {
      if (onNotification) {
        onNotification({
          type: 'ERROR',
          message: operationalMessage(err.message || "") || translate("operations.failed_to_create_and_dispatch_the_weighbridge_ticket")
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
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-xl mx-auto my-12 shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 mb-2">{translate("field_operations.loading_unauthorized_title")}</h2>
        <p className="text-xs text-stone-600 mb-6 leading-relaxed">
          {translate("operations.your_current_role")}<span className="font-bold text-rose-700 font-mono">{authContext.role}</span>{translate("operations.is_not_authorized_to_manage_origin_scales_and_loading")}</p>
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs text-stone-500 font-mono">
          {translate("operations.user")}{authContext.displayName} ({authContext.userId})
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS STATE: DIGITAL WEIGHBRIDGE DISPATCH TICKET
  // =========================================================================
  if (createdTrip) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn text-right" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Success Header Banner */}
        <div className="bg-emerald-700 text-white rounded-2xl p-6 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{translate("field_operations.ticket_success_title")}</h2>
              <p className="text-xs text-emerald-100 font-mono mt-0.5">
                {translate("operations.ticket_number")}{createdTrip.ticketId} {translate("operations.serial_number")}{createdTrip.tripSerial}
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
            {translate("field_operations.scale_verified_stamp")}</div>

          <div className="border-b border-stone-200 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">{translate("field_operations.ticket_title")}</h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">{createdTrip.loadTime?.slice(0, 19).replace('T', ' ')}</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {(() => {
                const proj = projectsList.find(p => p.projectId === createdTrip.projectId);
                return proj ? translate("field_operations.project_display", { name: proj.nameAr, nameAr: proj.nameAr, nameEn: proj.nameEn || proj.nameAr, id: proj.projectId }) : createdTrip.projectId;
              })()}
            </p>
          </div>

          {/* Vehicle & Trip Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">{translate("field_operations.truck_number")}</span>
              <span className="font-bold text-stone-900 font-mono text-sm">{createdTrip.truckId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">{translate("field_operations.carrier")}</span>
              <span className="font-bold text-stone-900">{context?.knownCarriers.find(c => c.carrierId === createdTrip.carrierId)?.name || createdTrip.carrierId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">{translate("field_operations.driver_label")}</span>
              <span className="font-bold text-stone-900">{context?.knownDrivers.find(d => d.driverId === createdTrip.driverId)?.name || createdTrip.driverId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">{translate("field_operations.supplied_material")}</span>
              <span className="font-bold text-stone-900">{context?.knownMaterials.find(m => m.materialId === createdTrip.materialId)?.name || createdTrip.materialId}</span>
            </div>
          </div>

          {/* Weight Matrix Callout */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">{translate("field_operations.gross_weight_ticket")}</span>
                <span className="text-base sm:text-lg font-black text-stone-900 font-mono">{createdTrip.grossWeight.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block">{translate("shared.units.kg")}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">{translate("field_operations.tare_weight_ticket")}</span>
                <span className="text-base sm:text-lg font-black text-stone-900 font-mono">{createdTrip.tareWeight.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block">{translate("shared.units.kg")}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-300">
                <span className="text-[11px] text-emerald-800 font-bold block">{translate("field_operations.net_payload")}</span>
                <span className="text-base sm:text-xl font-black text-emerald-950 font-mono">{createdTrip.netWeight.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">{translate("shared.units.kg")} ({(createdTrip.netWeight / 1000).toFixed(3)} {translate("shared.units.ton")})</span>
              </div>
            </div>
          </div>

          {/* Pricing Snapshot Notice */}
          <div className="text-xs bg-stone-100/70 p-3 rounded-xl flex items-center justify-between text-stone-600 font-mono">
            <span>{translate("field_operations.pricing_rule_label")} {createdTrip.pricingRuleId}</span>
            <span className="font-bold text-stone-800">
              {translate("field_operations.settlement_label")} {createdTrip.settlementAmount.toFixed(2)} {createdTrip.currency} ({createdTrip.pricingType === 'PER_TON' ? translate("field_operations.pricing_per_ton") : translate("field_operations.pricing_per_trip")})
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleResetForNextTruck}
              className="w-full sm:flex-1 py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{translate("field_operations.next_truck")}</span>
            </button>
            <button
              onClick={() => {
                setTicketCopyNotification(translate("field_operations.ticket_copied"));
                setTimeout(() => setTicketCopyNotification(null), 3000);
              }}
              className="w-full sm:w-auto py-3.5 px-5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-stone-300"
            >
              <Printer className="w-4 h-4" />
              <span>{translate("field_operations.print_ticket")}</span>
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
    <div className={`max-w-6xl mx-auto space-y-6 ${isRTL ? 'text-right' : 'text-left'} pb-12`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Station Status Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-stone-900">{translate("field_operations.loading_station_title")}</h1>
              <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {translate("field_operations.loading_operator")}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {translate("field_operations.loading_station_desc")}
            </p>
          </div>
        </div>

        {/* Offline / Online Status Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Wifi className="w-3.5 h-3.5" />
              <span>{translate("field_operations.connected_status")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{translate("field_operations.offline_status")}</span>
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
                <h2 className="font-bold text-stone-900 text-sm">{translate("field_operations.identify")}</h2>
              </div>
              <span className="text-[11px] text-stone-400">{translate("field_operations.quick_selection")}</span>
            </div>

            {/* 1.1 Project Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>{translate("field_operations.project_selector_label")}</span>
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
                <span>{translate("field_operations.authorized_carrier")}</span>
              </label>
              {availableCarriers.length === 0 ? (
                <div className="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-xs text-stone-400 text-center">
                  {readinessStatus === 'PENDING' ? translate("field_operations.loading_carriers") : translate("field_operations.no_carriers")}
                </div>
              ) : (
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
                      <span className="text-xs truncate">{c.name || c.carrierId}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{c.carrierId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 1.3 Truck Quick Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-700" />
                <span>{translate("field_operations.available_truck")}</span>
              </label>
              {availableTrucks.length === 0 ? (
                <div className="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-xs text-stone-400 text-center">
                  {!carrierId ? translate("field_operations.select_carrier_first") : readinessStatus === 'PENDING' ? translate("field_operations.loading_trucks") : translate("field_operations.no_trucks")}
                </div>
              ) : (
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
                        <span className="text-[10px] text-stone-500">{t.plate || translate("operations.tipper_trailer")}</span>
                      </div>
                      {truckId === t.truckId && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 1.4 Driver & Material Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>{translate("field_operations.driver_label")}</span>
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {availableDrivers.length === 0 && (
                    <option value="">{!carrierId ? translate("field_operations.select_carrier_first_driver") : translate("field_operations.no_drivers")}</option>
                  )}
                  {availableDrivers.map(d => (
                    <option key={d.driverId} value={d.driverId}>{d.name || d.driverId} ({d.driverId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-amber-700" />
                  <span>{translate("field_operations.loaded_material")}</span>
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {availableMaterials.length === 0 && (
                    <option value="">{translate("field_operations.no_materials")}</option>
                  )}
                  {availableMaterials.map(m => (
                    <option key={m.materialId} value={m.materialId}>{m.name || m.materialId} ({m.materialId})</option>
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
                <span>{translate("field_operations.applied_pricing_rule")}</span>
              </span>
              <span className="bg-stone-200 text-stone-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                {activePricingRule?.pricingType === 'PER_TON' ? translate("field_operations.pricing_per_ton") : translate("field_operations.pricing_per_trip")}
              </span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              {activePricingRule?.name || translate("field_operations.standard_project_rule")}
            </p>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between font-mono">
              <span className="text-[11px] text-stone-500">{translate("field_operations.unit_rate")}</span>
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
                <h2 className="font-bold text-stone-900 text-sm">{translate("field_operations.capture_validate")}</h2>
              </div>
              <span className="text-[11px] text-stone-400">{translate("field_operations.accurate_readings")}</span>
            </div>

            {/* 2.1 Tare Weight Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-stone-600" />
                  <span>{translate("field_operations.tare_weight")}</span>
                </label>
                <button
                  type="button"
                  onClick={handleReadScaleIn}
                  className="text-[11px] bg-stone-200 hover:bg-stone-300 text-stone-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>{translate("field_operations.read_scale_in")}</span>
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
                    title={translate("field_operations.adjust_minus_500")}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTare(+500)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                    title={translate("field_operations.adjust_plus_500")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Tare Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400 py-1">{translate("field_operations.common_tare_presets")}</span>
                {[8200, 13800, 14200, 15000].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => applyTarePreset(w)}
                    className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2 py-1 rounded font-mono font-semibold"
                  >
                    {w.toLocaleString()} {translate("shared.units.kg")}
                  </button>
                ))}
              </div>
            </div>

            {/* 2.2 Gross Weight Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-700" />
                  <span>{translate("field_operations.gross_weight")}</span>
                </label>
                <button
                  type="button"
                  onClick={handleReadScaleOut}
                  className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{translate("field_operations.read_scale_out")}</span>
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
                    title={translate("field_operations.adjust_minus_500")}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustGross(+500)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                    title={translate("field_operations.adjust_plus_500")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Gross Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400 py-1">{translate("field_operations.payload_presets")}</span>
                {[42000, 45600, 49800].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => applyGrossPreset(w)}
                    className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2 py-1 rounded font-mono font-semibold"
                  >
                    {w.toLocaleString()} {translate("shared.units.kg")}
                  </button>
                ))}
              </div>
            </div>

            {/* 2.3 Calculated Net Weight Display */}
            <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">{translate("field_operations.calculated_net_weight")}</span>
                  <span className="text-[10px] text-amber-700 block">{translate("field_operations.scale_formula")}</span>
                </div>
                <div className="text-left font-mono">
                  <div className="text-xl sm:text-2xl font-black text-amber-950">
                    {netWeightKg.toLocaleString()} <span className="text-xs font-normal">{translate("shared.units.kg")}</span>
                  </div>
                  <div className="text-xs font-bold text-amber-800">
                    {translate("field_operations.metric_tons", { tons: netWeightTons })}
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
                <span className="block text-[10px] text-stone-400">{translate("field_operations.estimated_settlement")}</span>
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
                  <span>{translate("field_operations.submitting_dispatch")}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 rtl:rotate-180" />
                  <span>{translate("field_operations.confirm_and_dispatch")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
