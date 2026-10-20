import { presentOperationalMessage } from "../../i18n/operationalMessages";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Truck, 
  User, 
  Building2, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  RotateCcw,
  Wifi,
  WifiOff,
  Printer,
  Check,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { TripRecord, TripActorRole, TripEngineStatus } from '../../types/tripEngine';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { projectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../types/entities';
import { AuthUserContext, UserRole } from '../../types/common';
import { useI18n } from '../../i18n';
import { outboxService } from '../../services/offline/outbox.service';
import { indexedDBService } from '../../services/offline/indexedDB.service';
import { tripRepository } from '../../repositories/trip.repository';

export interface UnloadingOperatorViewProps {
  authContext?: AuthUserContext;
  onTripUpdated?: (updatedTrip: TripRecord) => void;
  onNotification?: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
}

// Authorized roles for Unloading Operator Interface per Block 76 Architecture & RBAC
export const UNLOADING_AUTHORIZED_ROLES: UserRole[] = [
  'SCALE_OPERATOR',
  'SITE_SUPERVISOR',
  'SUPERVISOR',
  'PROJECT_ADMIN',
  'SUPER_ADMIN'
];

export const UnloadingOperatorView: React.FC<UnloadingOperatorViewProps> = ({
  authContext = {
    userId: 'SCALE-OP-DEST-01',
    email: 'dest.scale@qsaudi.com',
    displayName: 'مشغل ميزان الموقع والتفريغ (Site Receiver)',
    role: 'SCALE_OPERATOR',
    assignedProjectIds: []
  },
  onTripUpdated,
  onNotification
}) => {
  const { t, isRTL } = useI18n();
  const operationalMessage = (message: string) => presentOperationalMessage(message, t);
  const { isOnline } = useOnlineStatus();

  // Role Authorization Check (Dispatchers and Drivers forbidden at destination weighbridge)
  const isAuthorized = useMemo(() => {
    return UNLOADING_AUTHORIZED_ROLES.includes(authContext.role);
  }, [authContext.role]);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTrip, setActiveTrip] = useState<TripRecord | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<{ status: string; message: string } | null>(null);

  // Weight Entry Mode: DUAL_SCALE (Gross - Tare) or DIRECT (Net)
  const [weightEntryMode, setWeightEntryMode] = useState<'DUAL_SCALE' | 'DIRECT'>('DIRECT');
  const [destGrossInput, setDestGrossInput] = useState<number | ''>('');
  const [destTareInput, setDestTareInput] = useState<number | ''>('');
  const [destNetWeightInput, setDestNetWeightInput] = useState<number | ''>('');

  // Operational Timestamps & Notes
  const [arrivalTimeInput, setArrivalTimeInput] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [unloadTimeInput, setUnloadTimeInput] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<any | null>(null);

  // Tolerance settings (Project defaults: ±1.5% or ±500 kg)
  const tolerancePercent = 1.5;
  const toleranceKg = 500;

  // Inbound Queue (trips in IN_TRANSIT, ARRIVED, or UNLOADING status)
  const [inboundTrips, setInboundTrips] = useState<TripRecord[]>([]);
  const [tripsCache, setTripsCache] = useState<any[]>([]);

  const refreshInboundTrips = async () => {
    try {
      // Fetch latest from database if online to hydrate IndexedDB
      if (isOnline && authContext?.assignedProjectIds && authContext.assignedProjectIds.length > 0) {
        for (const pId of authContext.assignedProjectIds) {
          const remoteTrips = await tripRepository.listByProject(pId).catch(() => []);
          if (remoteTrips && remoteTrips.length > 0) {
            await indexedDBService.putMany('trips', remoteTrips).catch(() => {});
          }
        }
      }

      // Load all trips from IndexedDB cache
      const all: any[] = await indexedDBService.getAll('trips').catch(() => []);
      
      // Filter inbound states (bridge canonical & legacy statuses)
      const inbounds = all.filter(t => 
        t.status === 'IN_TRANSIT' || 
        t.status === 'ARRIVED' || 
        (t.status as string) === 'AT_DESTINATION' || 
        t.status === 'UNLOADING' || 
        (t.status as string) === 'OFFLOADED'
      );

      setInboundTrips(inbounds);
      setTripsCache(all);
    } catch (e) {
      console.warn('Failed to load inbound trips:', e);
    }
  };

  useEffect(() => {
    refreshInboundTrips();
  }, [isOnline]);

  // Sync dual scale weights
  useEffect(() => {
    if (weightEntryMode === 'DUAL_SCALE') {
      const g = typeof destGrossInput === 'number' ? destGrossInput : 0;
      const t = typeof destTareInput === 'number' ? destTareInput : 0;
      if (g > t && t > 0) {
        setDestNetWeightInput(g - t);
      }
    }
  }, [destGrossInput, destTareInput, weightEntryMode]);

  // Handle Search Execution
  const handleSearchTrip = (query?: string) => {
    const q = (query !== undefined ? query : searchQuery).trim();
    if (!q) {
      setActiveTrip(null);
      setSearchFeedback(null);
      return;
    }

    const qLower = q.toLowerCase();

    // Plate-only search protection rule
    const isMatchingPlate = tripsCache.some(
      t => t.entitySnapshots?.truck?.plateNumberAr?.toLowerCase() === qLower ||
           t.entitySnapshots?.truck?.plateNumberAr?.replace(/\s+/g, '') === qLower.replace(/\s+/g, '')
    );

    const matchesTripSerialCheck = tripsCache.some(t => t.tripSerial?.toLowerCase() === qLower);
    const matchesTicketIdCheck = tripsCache.some(t => t.ticketId?.toLowerCase() === qLower);
    const matchesTruckIdCheck = tripsCache.some(t => t.truckId?.toLowerCase() === qLower);

    if (isMatchingPlate && !matchesTripSerialCheck && !matchesTicketIdCheck && !matchesTruckIdCheck) {
      setActiveTrip(null);
      setSearchFeedback({
        status: 'SECURITY',
        message: t("operations.control_block_a_truck_plate_truckplate_alone_cannot_identify")
      });
      return;
    }

    // 1. Primary: tripSerial
    const matchByTripSerial = tripsCache.filter(t => t.tripSerial?.toLowerCase() === qLower);
    if (matchByTripSerial.length > 0) {
      if (matchByTripSerial.length === 1) {
        selectTrip(matchByTripSerial[0], 'tripSerial');
      } else {
        setActiveTrip(null);
        setSearchFeedback({
          status: 'AMBIGUOUS',
          message: t("operations.ambiguous_match_value_trips_share_this_serial_number_select", { p0: matchByTripSerial.length })
        });
      }
      return;
    }

    // 2. Then: ticketId
    const matchByTicketId = tripsCache.filter(t => t.ticketId?.toLowerCase() === qLower);
    if (matchByTicketId.length > 0) {
      if (matchByTicketId.length === 1) {
        selectTrip(matchByTicketId[0], 'ticketId');
      } else {
        setActiveTrip(null);
        setSearchFeedback({
          status: 'AMBIGUOUS',
          message: t("operations.ambiguous_match_value_trips_share_this_ticket_number_select", { p0: matchByTicketId.length })
        });
      }
      return;
    }

    // 3. Then: truckId
    const matchByTruckId = tripsCache.filter(t => t.truckId?.toLowerCase() === qLower);
    if (matchByTruckId.length > 0) {
      if (matchByTruckId.length === 1) {
        selectTrip(matchByTruckId[0], 'truckId');
      } else {
        setActiveTrip(null);
        setSearchFeedback({
          status: 'AMBIGUOUS',
          message: t("operations.ambiguous_match_value_trips_share_this_truck_id_select", { p0: matchByTruckId.length })
        });
      }
      return;
    }

    setActiveTrip(null);
    setSearchFeedback({
      status: 'NOT_FOUND',
      message: t("operations.no_trip_matches_the_search_criteria")
    });
  };

  const selectTrip = (trip: any, matchedBy: string) => {
    setActiveTrip(trip);
    setSearchFeedback({
      status: 'CONTINUE',
      message: t("operations.trip_identified_value_matched_by_value", { p0: trip.tripSerial, p1: matchedBy })
    });
    if (trip.destNetWeight) {
      setDestNetWeightInput(trip.destNetWeight);
    } else {
      setDestNetWeightInput(trip.netWeight - 150);
    }
    if (trip.tareWeight) {
      setDestTareInput(trip.tareWeight);
      setDestGrossInput(trip.tareWeight + (trip.destNetWeight || trip.netWeight - 150));
    }
  };

  // Live Variance & Tolerance Calculations
  const originNet = activeTrip?.netWeight || 0;
  const currentDestNet = typeof destNetWeightInput === 'number' ? destNetWeightInput : 0;
  const liveVariance = currentDestNet > 0 ? currentDestNet - originNet : null;
  const liveVariancePct = originNet > 0 && liveVariance !== null
    ? parseFloat(((liveVariance / originNet) * 100).toFixed(2))
    : null;

  const thresholdFromPct = originNet > 0 ? Math.round((originNet * tolerancePercent) / 100) : toleranceKg;
  const effectiveTolerance = Math.max(toleranceKg, thresholdFromPct);
  const isOutOfTolerance = liveVariance !== null && Math.abs(liveVariance) > effectiveTolerance;

  // STEP 1: Record Arrival (IN_TRANSIT -> ARRIVED)
  const handleRecordArrival = async () => {
    if (!activeTrip) return;
    try {
      const isoArrival = new Date(arrivalTimeInput).toISOString();
      const updatedTrip: TripRecord = {
        ...activeTrip,
        status: 'ARRIVED' as TripEngineStatus,
        arrivalTime: isoArrival,
        updatedAt: new Date().toISOString(),
        updatedBy: authContext.userId
      };

      // Put in local IndexedDB cache optimistically
      await indexedDBService.put('trips', updatedTrip);

      // Queue canonical outbox operation
      await outboxService.queueOperation({
        projectId: activeTrip.projectId,
        userId: authContext.userId,
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId: activeTrip.tripId,
          status: 'AT_DESTINATION'
        }
      });

      if (isOnline) {
        await outboxService.syncAll(false);
        const synced = await indexedDBService.getById<any>('trips', activeTrip.tripId);
        setActiveTrip(synced || updatedTrip);
      } else {
        setActiveTrip(updatedTrip);
      }

      refreshInboundTrips();
      if (onTripUpdated) onTripUpdated(updatedTrip);
      if (onNotification) {
        onNotification({
          type: 'SUCCESS',
          message: t("operations.truck_arrival_recorded_arrived_ticket_value", { p0: activeTrip.ticketId })
        });
      }
    } catch (err: any) {
      if (onNotification) {
        onNotification({ type: 'ERROR', message: operationalMessage(err.message || "") || t("operations.could_not_record_truck_arrival") });
      }
    }
  };

  // STEP 2: Start Unloading (ARRIVED -> UNLOADING)
  const handleStartUnloading = async () => {
    if (!activeTrip) return;
    try {
      const updatedTrip: TripRecord = {
        ...activeTrip,
        status: 'UNLOADING' as TripEngineStatus,
        unloaderId: authContext.userId,
        updatedAt: new Date().toISOString(),
        updatedBy: authContext.userId
      };

      // Put in local IndexedDB cache optimistically
      await indexedDBService.put('trips', updatedTrip);

      // Do NOT queue any outbox operation (like status OFFLOADED) prematurely here.
      // OFFLOADED is only valid in FSM after RECORD_RECEIPT (WEIGHED_DESTINATION).
      // We will perform the complete state transitions sequentially at Completion.

      if (isOnline) {
        // Just sync existing queue, if any
        await outboxService.syncAll(false);
        const synced = await indexedDBService.getById<any>('trips', activeTrip.tripId);
        setActiveTrip(synced || updatedTrip);
      } else {
        setActiveTrip(updatedTrip);
      }

      refreshInboundTrips();
      if (onTripUpdated) onTripUpdated(updatedTrip);
      if (onNotification) {
        onNotification({
          type: 'SUCCESS',
          message: t("operations.unloading_started_unloading_and_receiver_value_assigned", { p0: authContext.displayName })
        });
      }
    } catch (err: any) {
      if (onNotification) {
        onNotification({ type: 'ERROR', message: operationalMessage(err.message || "") || t("operations.could_not_start_unloading") });
      }
    }
  };

  // STEP 3: Explicit Decision: "Accept Origin Net as Destination"
  const handleAcceptOriginNet = () => {
    if (!activeTrip) return;
    setDestNetWeightInput(activeTrip.netWeight);
    if (activeTrip.tareWeight) {
      setDestTareInput(activeTrip.tareWeight);
      setDestGrossInput(activeTrip.tareWeight + activeTrip.netWeight);
    }
    setNotesInput(prev => prev ? `${prev} | [اعتماد صريح لصافي وزن المصدر]` : '[اعتماد صريح لصافي وزن المصدر كوزن استلام]');
    if (onNotification) {
      onNotification({
        type: 'SUCCESS',
        message: t("operations.decision_applied_origin_net_weight_value_kg_explicitly_approved", { p0: activeTrip.netWeight.toLocaleString() })
      });
    }
  };

  // STEP 4: Complete Unloading with Server Variance
  const handleCompleteUnloading = async () => {
    if (!activeTrip) return;
    const net = typeof destNetWeightInput === 'number' ? destNetWeightInput : 0;
    if (net <= 0) {
      if (onNotification) {
        onNotification({
          type: 'ERROR',
          message: t("operations.enter_a_positive_destination_net_weight_greater_than_zero")
        });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const isoArrival = new Date(arrivalTimeInput).toISOString();
      const isoUnload = new Date(unloadTimeInput).toISOString();

      const originNet = activeTrip.netWeight;
      const destNet = net;
      const varianceWeight = Math.abs(originNet - destNet);
      const limitPercent = (tolerancePercent / 100) * originNet;
      const isOutOfTolerance = varianceWeight > limitPercent || varianceWeight > toleranceKg;

      const updatedTrip: TripRecord = {
        ...activeTrip,
        status: 'COMPLETED' as TripEngineStatus,
        destNetWeight: net,
        varianceWeight,
        unloaderId: authContext.userId,
        unloadTime: isoUnload,
        notes: notesInput || 'تم اكتمال الاستلام والتفريغ بالموقع',
        updatedAt: new Date().toISOString(),
        updatedBy: authContext.userId,
      };

      // Store in IndexedDB cache optimistically
      await indexedDBService.put('trips', updatedTrip);

      // 1. Queue RECORD_RECEIPT operation (transitions AT_DESTINATION -> WEIGHED_DESTINATION)
      await outboxService.queueOperation({
        projectId: activeTrip.projectId,
        userId: authContext.userId,
        operationType: 'RECORD_RECEIPT',
        payload: {
          tripId: activeTrip.tripId,
          destinationTareKg: Number(destTareInput || 0),
          destinationGrossKg: Number(destGrossInput || 0),
          destinationTicketNo: `WB-REC-${Date.now()}`,
        }
      });

      // 2. Queue UPDATE_TRIP_STATUS OFFLOADED (transitions WEIGHED_DESTINATION -> OFFLOADED)
      await outboxService.queueOperation({
        projectId: activeTrip.projectId,
        userId: authContext.userId,
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId: activeTrip.tripId,
          status: 'OFFLOADED'
        }
      });

      // 3. Queue UPDATE_TRIP_STATUS COMPLETED (transitions OFFLOADED -> COMPLETED)
      await outboxService.queueOperation({
        projectId: activeTrip.projectId,
        userId: authContext.userId,
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId: activeTrip.tripId,
          status: 'COMPLETED'
        }
      });

      if (isOnline) {
        const syncRes = await outboxService.syncAll(false);
        const syncedRecord = await indexedDBService.getById<any>('trips', activeTrip.tripId);
        
        if (syncRes.failedCount > 0) {
          const ops = await outboxService.getOperations();
          const lastOp = ops.filter(o => o.payload.tripId === activeTrip.tripId).pop();
          throw new Error(lastOp?.errorReason || t("operations.failed_to_synchronize_receiving_with_the_server"));
        }

        const finalTrip = syncedRecord || updatedTrip;
        setActiveTrip(finalTrip);
      } else {
        setActiveTrip(updatedTrip);
      }

      setCompletionResult({
        trip: updatedTrip,
        isOutOfTolerance,
        varianceWeight,
        exceptionCreated: isOutOfTolerance ? { exceptionId: `EXC-LOCAL-${Date.now()}` } : null
      });

      refreshInboundTrips();
      if (onTripUpdated) onTripUpdated(updatedTrip);

      if (isOutOfTolerance) {
        if (onNotification) {
          onNotification({
            type: 'SECURITY',
            message: t("operations.control_warning_weight_variance_value_kg_exceeds_tolerance_receiving", { p0: varianceWeight.toLocaleString() })
          });
        }
      } else {
        if (onNotification) {
          onNotification({
            type: 'SUCCESS',
            message: t("operations.unloading_completed_weight_variance_value_kg_calculated_and_status", { p0: varianceWeight.toLocaleString() })
          });
        }
      }
    } catch (err: any) {
      if (onNotification) {
        onNotification({ type: 'ERROR', message: operationalMessage(err.message || "") || t("operations.could_not_complete_unloading") });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNextTruck = () => {
    setCompletionResult(null);
    setActiveTrip(null);
    setSearchQuery('');
    setSearchFeedback(null);
    refreshInboundTrips();
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
        <h2 className="text-lg font-bold text-stone-900 mb-2">{t("field_operations.unloading_unauthorized_title")}</h2>
        <p className="text-xs text-stone-600 mb-6 leading-relaxed">
          {t("operations.your_current_role_2")}<span className="font-bold text-rose-700 font-mono">{authContext.role}</span>{t("operations.cannot_complete_receiving_weights_or_close_unloaded_trips_this")}</p>
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs text-stone-500 font-mono">
          {t("operations.user")}{authContext.displayName} ({authContext.userId})
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS STATE: DESTINATION RECEIPT & VARIANCE AUDIT STAMP
  // =========================================================================
  if (completionResult && activeTrip) {
    const isOut = completionResult.isOutOfTolerance;
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn text-right" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Success Header Banner */}
        <div className={`rounded-2xl p-6 shadow-md flex items-center justify-between gap-4 text-white ${
          isOut ? 'bg-amber-600' : 'bg-emerald-700'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              {isOut ? <AlertTriangle className="w-7 h-7 text-white" /> : <CheckCircle2 className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isOut ? t("operations.unloading_recorded_with_a_weight_exception") : t("operations.receiving_unloading_and_weight_matching_completed")}
              </h2>
              <p className="text-xs text-white/90 font-mono mt-0.5">
                {t("operations.ticket")}{activeTrip.ticketId} {t("operations.serial_number")}{activeTrip.tripSerial}
              </p>
            </div>
          </div>
          <span className="bg-white text-stone-900 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0">
            {activeTrip.status}
          </span>
        </div>

        {/* Destination Weighbridge Ticket Summary */}
        <div className="bg-white rounded-2xl border-2 border-stone-300 p-6 shadow-sm space-y-6">
          <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base">{t("field_operations.receive_receipt_title")}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{t("field_operations.receive_receipt_sub")}</p>
            </div>
            <span className="text-xs text-stone-500 font-mono">{activeTrip.unloadTime?.slice(0, 19).replace('T', ' ')}</span>
          </div>

          {/* Weight & Variance Comparison Card */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 block mb-1">{t("operations.origin_net_weight")}</span>
              <span className="text-lg sm:text-xl font-black text-stone-900 font-mono">{activeTrip.netWeight.toLocaleString()}</span>
              <span className="text-[10px] text-stone-400 block">{t("shared.units.kg")}</span>
            </div>
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 block mb-1">{t("operations.receiving_net_weight")}</span>
              <span className="text-lg sm:text-xl font-black text-stone-900 font-mono">{activeTrip.destNetWeight?.toLocaleString()}</span>
              <span className="text-[10px] text-stone-400 block">{t("shared.units.kg")}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              isOut ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <span className="text-[11px] font-bold block mb-1">{t("operations.scale_variance")}</span>
              <span className="text-lg sm:text-xl font-black font-mono">
                {activeTrip.varianceWeight !== null && activeTrip.varianceWeight > 0 ? `+${activeTrip.varianceWeight.toLocaleString()}` : activeTrip.varianceWeight?.toLocaleString()}
              </span>
              <span className="text-[10px] block font-bold">
                {completionResult.variancePercent !== undefined ? `${completionResult.variancePercent}%` : ''} ({isOut ? t("field_operations.out_of_tolerance") : t("operations.matched")})
              </span>
            </div>
          </div>

          {/* Exception Details Callout if created */}
          {isOut && completionResult.exceptionCreated && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>{t("operations.official_control_exception_created_number")}{completionResult.exceptionCreated.exceptionId}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                {completionResult.exceptionCreated.reasonAr}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleResetForNextTruck}
              className="w-full sm:flex-1 py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t("operations.receive_next_inbound_truck")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN FIELD WORKSTATION INTERFACE: IDENTIFY -> CAPTURE -> VALIDATE -> ACT
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Station Identity Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-stone-900">{t("field_operations.unloading_station_title")}</h1>
              <span className="bg-emerald-100 text-emerald-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {t("field_operations.unloading_operator")}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {t("field_operations.unloading_station_desc")}</p>
          </div>
        </div>

        {/* Quick Stats: In-Transit Count */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-200">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>{t("operations.trucks_in_transit")}{inboundTrips.length}</span>
          </span>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* SECTION 1: IDENTIFY & MATCH (البحث السريع + قائمة الشاحنات في المسار) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="font-bold text-stone-900 text-sm">{t("field_operations.identify_unloading")}</h2>
              </div>
              <span className="text-[11px] text-stone-400">{t("field_operations.barcode_or_select")}</span>
            </div>

            {/* Fast Search Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                {t("field_operations.search_trip_input_label")}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchTrip()}
                    placeholder={t("field_operations.search_placeholder")}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl ps-9 pe-4 py-3 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute start-3 top-3.5" />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchTrip()}
                  className="px-4 py-3 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  {t("field_operations.search_button")}</button>
              </div>

              {/* Feedback Notice */}
              {searchFeedback && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  searchFeedback.status === 'CONTINUE'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : searchFeedback.status === 'SECURITY'
                    ? 'bg-amber-50 text-amber-950 border border-amber-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {searchFeedback.status === 'CONTINUE' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  )}
                  <span>{searchFeedback.message}</span>
                </div>
              )}
            </div>

            {/* In-Transit Quick Picker (Zero Typing!) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700">{t("operations.arriving_and_dispatched_trucks_tap_to_select")}</span>
                <span className="text-[10px] text-stone-400">{inboundTrips.length} {t("operations.truck")}</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto p-0.5">
                {inboundTrips.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">{t("field_operations.no_inbound_trips")}</p>
                ) : (
                  inboundTrips.map(trip => {
                    const isSelected = activeTrip?.tripId === trip.tripId;
                    return (
                      <button
                        key={trip.tripId}
                        type="button"
                        onClick={() => {
                          setSearchQuery(trip.tripSerial);
                          handleSearchTrip(trip.tripSerial);
                        }}
                        className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 text-amber-950'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-stone-900">{trip.tripSerial}</span>
                            <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                              trip.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {trip.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 block mt-0.5 font-mono">
                            {trip.truckId} {t("operations.net")}{trip.netWeight.toLocaleString()} {t("shared.units.kg")}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Active Trip Cargo Card */}
          {activeTrip && (
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-700" />
                  <span>{t("operations.origin_shipment_details")}</span>
                </span>
                <span className="text-[10px] font-mono text-stone-500">{t("operations.ticket")}{activeTrip.ticketId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px]">{t("operations.truck_plate")}</span>
                  <span className="font-bold text-stone-900 font-mono">{activeTrip.truckId}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">{t("entityResolution.labels.carrier_3")}</span>
                  <span className="font-bold text-stone-900 truncate block">{activeTrip.carrierId}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">{t("entityResolution.labels.driver_2")}</span>
                  <span className="font-bold text-stone-900 truncate block">{activeTrip.driverId}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">{t("field_operations.supplied_material")}</span>
                  <span className="font-bold text-stone-900 truncate block">{activeTrip.materialId}</span>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-950 block">{t("operations.origin_net_weight_2")}</span>
                  <span className="text-[10px] text-amber-700 block">{t("operations.recorded_by_the_origin_scale")}</span>
                </div>
                <div className="text-left font-mono">
                  <div className="text-lg font-black text-amber-950">{activeTrip.netWeight.toLocaleString()} {t("shared.units.kg")}</div>
                  <div className="text-[11px] text-amber-800 font-semibold">({(activeTrip.netWeight / 1000).toFixed(3)} {t("operations.tons")}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 & 3: CAPTURE & VALIDATE DESTINATION WEIGHT */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          {!activeTrip ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-400">
              <Scale className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p className="text-sm font-bold text-stone-600">{t("field_operations.select_trip_prompt")}</p>
              <p className="text-xs text-stone-400 mt-1">{t("field_operations.select_trip_subprompt")}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="font-bold text-stone-900 text-sm">{t("field_operations.capture_validate_dest")}</h2>
                </div>
                {/* Weight Mode Switcher */}
                <div className="flex items-center bg-stone-100 p-1 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setWeightEntryMode('DIRECT')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      weightEntryMode === 'DIRECT' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    {t("field_operations.direct_net_btn")}</button>
                  <button
                    type="button"
                    onClick={() => setWeightEntryMode('DUAL_SCALE')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      weightEntryMode === 'DUAL_SCALE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    {t("field_operations.gross_tare_btn")}</button>
                </div>
              </div>

              {/* Weight Inputs */}
              {weightEntryMode === 'DUAL_SCALE' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 block">{t("field_operations.arrival_gross_kg")}</label>
                    <input
                      type="number"
                      value={destGrossInput || ''}
                      onChange={(e) => setDestGrossInput(Number(e.target.value))}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-base font-black font-mono text-stone-900"
                    />
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 block">{t("field_operations.tare_after_unload_kg")}</label>
                    <input
                      type="number"
                      value={destTareInput || ''}
                      onChange={(e) => setDestTareInput(Number(e.target.value))}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-base font-black font-mono text-stone-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">
                      {t("field_operations.dest_net_weight")}
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">KG</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={destNetWeightInput || ''}
                      onChange={(e) => setDestNetWeightInput(e.target.value === '' ? '' : Number(e.target.value))}
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 text-xl font-black text-stone-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDestNetWeightInput(prev => typeof prev === 'number' ? Math.max(0, prev - 100) : 0)}
                        className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                        title={t("field_operations.adjust_minus_100")}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDestNetWeightInput(prev => typeof prev === 'number' ? prev + 100 : 100)}
                        className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
                        title={t("field_operations.adjust_plus_100")}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Tolerance Simulation Presets */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    <span className="text-[10px] text-stone-400 py-1">{t("operations.simulation")}</span>
                    <button
                      type="button"
                      onClick={() => setDestNetWeightInput(activeTrip.netWeight - 150)}
                      className="text-[10px] bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-semibold"
                    >
                      {t("operations.acceptable_variance_150_kg")}</button>
                    <button
                      type="button"
                      onClick={() => setDestNetWeightInput(activeTrip.netWeight - 2500)}
                      className="text-[10px] bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded font-semibold"
                    >
                      {t("operations.excessive_variance_2_500_kg")}</button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* EXPLICIT BUTTON: ACCEPT ORIGIN NET AS DESTINATION (DECISION RECORDING) */}
              {/* ========================================================================= */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-stone-800 block">{t("operations.match_origin_weight_directly")}</span>
                  <span className="text-[10px] text-stone-500 block">{t("operations.approve_origin_weight_when_no_destination_scale_is_available")}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAcceptOriginNet}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 rounded-xl text-xs font-bold transition-all shrink-0 shadow-2xs"
                >
                  {t("operations.approve_origin_net_as_receiving_weight")}</button>
              </div>

              {/* Live Variance Calculation & Tolerance Gauge */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isOutOfTolerance ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOutOfTolerance ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{t("operations.calculated_weight_variance")}</span>
                      <span className="text-[10px] text-stone-500">
                        {t("operations.allowed_tolerance")}{tolerancePercent}{t("operations.maximum")}{effectiveTolerance.toLocaleString()} {t("operations.kg")}</span>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <div className={`text-xl font-black ${isOutOfTolerance ? 'text-rose-900' : 'text-emerald-950'}`}>
                      {liveVariance !== null && liveVariance > 0 ? `+${liveVariance.toLocaleString()}` : liveVariance?.toLocaleString()} {t("shared.units.kg")}</div>
                    <div className="text-xs font-bold text-stone-600">
                      {liveVariancePct !== null ? `${liveVariancePct}%` : '0%'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-stone-600">
                  {isOutOfTolerance ? (
                    <span className="text-rose-800">
                      {t("field_operations.variance_warning_excess")}</span>
                  ) : (
                    <span className="text-emerald-800">
                      {t("field_operations.variance_ok")}</span>
                  )}
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t("field_operations.unloader_notes_label")}</label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={t("field_operations.unloader_notes_placeholder")}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* ========================================================================= */}
              {/* SECTION 4: ACT (أزرار التدرج التشغيلي للحالات) */}
              {/* ========================================================================= */}
              <div className="space-y-2 pt-1">
                {activeTrip.status === 'IN_TRANSIT' && (
                  <button
                    type="button"
                    onClick={handleRecordArrival}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{t("operations.record_truck_arrival_at_site_arrived")}</span>
                  </button>
                )}

                {activeTrip.status === 'ARRIVED' && (
                  <button
                    type="button"
                    onClick={handleStartUnloading}
                    className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>{t("operations.start_unloading_at_site_unloading")}</span>
                  </button>
                )}

                {/* Main Completion Button */}
                <button
                  type="button"
                  onClick={handleCompleteUnloading}
                  disabled={activeTrip.status !== 'UNLOADING' || isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 min-h-[52px] ${
                    activeTrip.status === 'UNLOADING'
                      ? 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white'
                      : activeTrip.status === 'COMPLETED'
                      ? 'bg-stone-200 text-stone-500 cursor-default'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t("operations.matching_variance_on_the_server")}</span>
                    </>
                  ) : activeTrip.status === 'COMPLETED' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{t("operations.trip_already_unloaded_and_completed_completed")}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-5 h-5" />
                      <span>{t("operations.complete_unloading_and_verify_variance_on_the_server")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
