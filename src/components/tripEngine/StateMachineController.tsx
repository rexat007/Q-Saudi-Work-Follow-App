import { presentOperationalMessage } from "../../i18n/operationalMessages";
import React, { useState } from 'react';
import { 
  GitCommit, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  UserCheck, 
  Building2, 
  Clock, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  FileText, 
  Scale, 
  Sparkles, 
  Play, 
  Layers,
  ChevronRight,
  Eye,
  Lock,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { 
  TripRecord, 
  TripEngineStatus, 
  TripActorRole, 
  TransitionContext, 
  TransitionPayload, 
  TripLifecycleEvent, 
  TripAuditLog 
} from '../../types/tripEngine';
import { tripEngineService } from '../../services/tripEngine.service';
import { tripStateMachine, STATE_TRANSITIONS } from '../../services/tripStateMachine.service';
import { useI18n } from '../../i18n';


interface StateMachineControllerProps {
  trips: TripRecord[];
  onTripUpdated: (updatedTrip: TripRecord) => void;
  onNotification: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
  selectedTripId?: string;
  onSelectTrip: (tripId: string) => void;
}

export const StateMachineController: React.FC<StateMachineControllerProps> = ({
  trips,
  onTripUpdated,
  onNotification,
  selectedTripId,
  onSelectTrip
}) => {
  const { t: translate, t, isRTL } = useI18n();
  const operationalMessage = (message: string) => presentOperationalMessage(message, translate);
  // Current active actor / persona for RBAC validation testing
  const [activeRole, setActiveRole] = useState<TripActorRole>('DISPATCHER');
  const [activeActorId, setActiveActorId] = useState<string>('USR-DISPATCHER-01');
  const [activeActorName, setActiveActorName] = useState<string>('م. صالح الغامدي');
  const [activeProjectId, setActiveProjectId] = useState<string>('PRJ-NEOM-001');

  // Currently selected trip for lifecycle operations
  const activeTrip = trips.find(t => t.tripId === (selectedTripId || trips[0]?.tripId)) || trips[0];

  // Transition form state
  const [transitionTarget, setTransitionTarget] = useState<TripEngineStatus | null>(null);
  const [transitionPayload, setTransitionPayload] = useState<TransitionPayload>({
    destGrossWeight: 45600,
    destTareWeight: 14200,
    destNetWeight: 31400,
    unloaderId: 'ENG-SITE-04',
    unloadTime: new Date().toISOString(),
    reason: '',
    notes: ''
  });

  // Active view tab inside State Machine
  const [innerTab, setInnerTab] = useState<'CONTROLLER' | 'EVENTS' | 'AUDIT_TRAIL' | 'DIAGRAM'>('CONTROLLER');

  // Negative test logs
  const [stressTestLog, setStressTestLog] = useState<{
    testName: string;
    passedBlocked: boolean;
    serverMessage: string;
    timestamp: string;
  } | null>(null);

  const availableTransitions = activeTrip 
    ? tripStateMachine.getAvailableTransitions(activeTrip, activeRole)
    : [];

  const tripEvents = activeTrip ? tripEngineService.getEvents(activeTrip.tripId) : [];
  const tripAudits = activeTrip ? tripEngineService.getAuditLogs(activeTrip.tripId) : [];

  // Handle legitimate transition
  const handleExecuteTransition = (targetStatus: TripEngineStatus) => {
    if (!activeTrip) return;

    try {
      const context: TransitionContext = {
        actorId: activeActorId,
        actorRole: activeRole,
        actorName: activeActorName,
        projectId: activeProjectId,
        reason: transitionPayload.reason || STATE_TRANSITIONS[targetStatus].labelAr
      };

      const result = tripEngineService.executeTransition(
        activeTrip.tripId,
        targetStatus,
        context,
        transitionPayload
      );

      onTripUpdated(result.updatedTrip);
      setTransitionTarget(null);
      setStressTestLog(null);

      onNotification({
        type: 'SUCCESS',
        message: translate("operations.trip_status_advanced_to_value_version_updated_to_vvalue", { p0: targetStatus, p1: result.updatedTrip.version })
      });
    } catch (err: any) {
      onNotification({
        type: 'ERROR',
        message: operationalMessage(err.message || "") || translate("operations.state_machine_transition_failed")
      });
    }
  };

  // ===================== NEGATIVE TEST CASES (STRESS TESTS) =====================

  // Test 1: Direct client mutation (client attempts to bypass state machine)
  const testDirectClientMutation = () => {
    if (!activeTrip) return;
    try {
      // Direct client mutation simulation
      const maliciousClientPayload = {
        ...activeTrip,
        status: 'COMPLETED' as TripEngineStatus // Client tries to force COMPLETED directly!
      };

      // Invariant Check
      tripEngineService.assertNoDirectStatusMutation(activeTrip, maliciousClientPayload);

      // If it didn't throw, it failed the security test
      setStressTestLog({
        testName: translate("operations.direct_client_mutation_guard"),
        passedBlocked: false,
        serverMessage: translate("operations.guard_failed_direct_client_status_mutation_was_allowed"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      // Successfully blocked!
      setStressTestLog({
        testName: translate("operations.direct_client_mutation_guard"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.security_test_passed_direct_client_status_mutation_was_blocked")
      });
    }
  };

  // Test 2: Complete trip without destNetWeight
  const testCompleteWithoutDestNetWeight = () => {
    if (!activeTrip) return;
    try {
      const context: TransitionContext = {
        actorId: 'REC-01',
        actorRole: 'SITE_RECEIVER',
        actorName: 'مستلم تجريبي',
        projectId: activeTrip.projectId,
        reason: 'محاولة إكمال بدون صافي وزن الوصول'
      };

      // Pass undefined / missing destNetWeight
      tripStateMachine.transition(activeTrip, 'COMPLETED', context, {
        destNetWeight: undefined,
        destGrossWeight: undefined,
        unloaderId: 'ENG-01',
        unloadTime: new Date().toISOString()
      });

      setStressTestLog({
        testName: translate("trips.labels.trip_3"),
        passedBlocked: false,
        serverMessage: translate("operations.error_completion_was_allowed_without_destination_net_weight"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("trips.labels.trip_4"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.control_rule_completion_blocked_because_destination_net_weight_destnetweight")
      });
    }
  };

  // Test 3: Complete trip without unloaderId or unloadTime
  const testCompleteWithoutUnloaderOrTime = () => {
    if (!activeTrip) return;
    try {
      const context: TransitionContext = {
        actorId: '',
        actorRole: 'SITE_RECEIVER',
        actorName: 'مستلم تجريبي',
        projectId: activeTrip.projectId,
        reason: 'محاولة إكمال بدون تحديد مستلم أو وقت تفريغ'
      };

      // Clear unloaderId and unloadTime
      const tripWithoutUnloader = { ...activeTrip, unloaderId: null, unloadTime: null };

      tripStateMachine.transition(tripWithoutUnloader, 'COMPLETED', context, {
        destNetWeight: 31200,
        unloaderId: '', // Missing unloaderId
        unloadTime: '' // Missing unloadTime
      });

      setStressTestLog({
        testName: translate("operations.complete_trip_without_unloaderid_or_unloadtime"),
        passedBlocked: false,
        serverMessage: translate("operations.error_completion_was_allowed_without_a_site_receiver_or"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("operations.block_completion_without_unloaderid_or_unloadtime"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("trips.labels.trip_7")
      });
    }
  };

  // Test 4: Complete trip without calculating variance
  const testCompleteWithoutVariance = () => {
    if (!activeTrip) return;
    try {
      // Simulate missing net weight which prevents variance calculation
      const brokenTrip = { ...activeTrip, netWeight: 0 };
      const context: TransitionContext = {
        actorId: 'REC-01',
        actorRole: 'SITE_RECEIVER',
        actorName: 'مستلم تجريبي',
        projectId: activeTrip.projectId,
        reason: 'محاولة إكمال بدون احتساب الفارق'
      };

      tripStateMachine.transition(brokenTrip, 'COMPLETED', context, {
        destNetWeight: 31200,
        unloaderId: 'REC-01',
        unloadTime: new Date().toISOString()
      });

      setStressTestLog({
        testName: translate("operations.complete_trip_without_variance_calculation"),
        passedBlocked: false,
        serverMessage: translate("operations.error_trip_completion_was_allowed_without_accurate_variance_calculation"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("operations.block_completion_without_variance_calculation"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.control_rule_completion_blocked_without_weight_variance_calculation_varianceweight")
      });
    }
  };

  // Test 5: Start trip (IN_TRANSIT) if Pricing Resolution fails
  const testStartTripWithFailedPricing = () => {
    if (!activeTrip) return;
    try {
      // Tamper trip with an invalid/expired pricing rule
      const brokenTrip: TripRecord = {
        ...activeTrip,
        pricingRuleId: 'PRC-NEOM-EXPIRED', // Expired in master data!
        pricingSnapshot: {
          ...activeTrip.pricingSnapshot,
          pricingRuleId: 'PRC-NEOM-EXPIRED',
          effectiveTo: '2025-12-31', // Expired!
          agreedRate: 0, // Zero rate!
          settlementAmount: 0
        }
      };

      const context: TransitionContext = {
        actorId: activeActorId,
        actorRole: 'DISPATCHER',
        actorName: activeActorName,
        projectId: activeTrip.projectId,
        reason: 'محاولة بدء رحلة بتسعيرة منتهية الصلاحية ومعدومة القيمة'
      };

      tripStateMachine.transition(brokenTrip, 'IN_TRANSIT', context, {
        loadTime: new Date().toISOString()
      });

      setStressTestLog({
        testName: translate("operations.start_trip_after_pricing_resolution_fails"),
        passedBlocked: false,
        serverMessage: translate("operations.error_trip_start_was_allowed_despite_pricing_resolution_failure"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("operations.block_trip_start_when_pricing_resolution_fails"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.control_rule_trip_start_blocked_because_pricing_resolution_is")
      });
    }
  };

  // Test 6: Invalid state jump (e.g. from DRAFT straight to COMPLETED)
  const testInvalidStateJump = () => {
    if (!activeTrip) return;
    try {
      const draftTrip: TripRecord = { ...activeTrip, status: 'DRAFT' };
      const context: TransitionContext = {
        actorId: activeActorId,
        actorRole: 'OPERATIONS_MANAGER',
        actorName: activeActorName,
        projectId: activeTrip.projectId,
        reason: 'محاولة قفز غير قانوني من DRAFT إلى COMPLETED'
      };

      tripStateMachine.transition(draftTrip, 'COMPLETED', context, {
        destNetWeight: 31200,
        unloaderId: 'REC-01',
        unloadTime: new Date().toISOString()
      });

      setStressTestLog({
        testName: translate("operations.illegal_state_jump"),
        passedBlocked: false,
        serverMessage: translate("operations.error_direct_transition_from_draft_to_completed_was_allowed"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("operations.block_illegal_state_jump"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.state_machine_prohibited_state_transition_blocked")
      });
    }
  };

  // Test 7: Unauthorized role
  const testUnauthorizedRole = () => {
    if (!activeTrip) return;
    try {
      // Driver tries to execute LOADED or COMPLETED
      const context: TransitionContext = {
        actorId: 'DRV-101',
        actorRole: 'DRIVER', // Unauthorized for LOADED or COMPLETED
        actorName: 'سائق تجريبي',
        projectId: activeTrip.projectId,
        reason: 'محاولة تغيير الحالة برتبة سائق'
      };

      tripStateMachine.transition(activeTrip, 'LOADED', context);

      setStressTestLog({
        testName: translate("operations.transition_by_unauthorized_role"),
        passedBlocked: false,
        serverMessage: translate("operations.error_the_driver_was_allowed_to_approve_loading_status"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("operations.block_transition_by_unauthorized_role"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.role_guard_this_role_cannot_execute_the_lifecycle_transition")
      });
    }
  };

  // Test 8: Project mismatch
  const testProjectMismatch = () => {
    if (!activeTrip) return;
    try {
      const context: TransitionContext = {
        actorId: activeActorId,
        actorRole: 'OPERATIONS_MANAGER',
        actorName: activeActorName,
        projectId: 'PRJ-REDSEA-999', // Mismatched project!
        reason: 'محاولة تعديل رحلة نيوم من مستخدم يتبع مشروع البحر الأحمر'
      };

      tripStateMachine.transition(activeTrip, 'IN_TRANSIT', context);

      setStressTestLog({
        testName: translate("operations.transition_from_a_different_project"),
        passedBlocked: false,
        serverMessage: translate("operations.error_a_user_was_allowed_to_control_a_trip"),
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
    } catch (err: any) {
      setStressTestLog({
        testName: translate("operations.project_isolation_guard"),
        passedBlocked: true,
        serverMessage: err.message,
        timestamp: new Date().toLocaleTimeString('ar-SA')
      });
      onNotification({
        type: 'SECURITY',
        message: translate("operations.project_isolation_change_blocked_because_the_operator_project_does")
      });
    }
  };

  // State status badge helper
  const renderStatusBadge = (status: TripEngineStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">{translate("dashboard.labels.status_draft")}</span>;
      case 'LOADED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">{translate("operations.loaded_and_weighed_loaded")}</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">{translate("trips.labels.txt_499473")}</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">{translate("trips.labels.location")}</span>;
      case 'UNLOADING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">{translate("operations.unloading_unloading")}</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">{translate("trips.status.txt_4c5ffa")}</span>;
      case 'RETURN_REQUESTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-950 border border-orange-300">{translate("trips.labels.txt_45a060")}</span>;
      case 'RETURNED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-200 text-stone-900 border border-stone-400">{translate("trips.labels.txt_135d7e")}</span>;
      case 'EXCEPTION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">{translate("trips.labels.txt_4fb822")}</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">{translate("trips.labels.txt_3740a7")}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner: Central State Machine Architecture & Roles */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>{translate("trips.labels.txt_2ae109")}</span>
                <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 rounded-md">
                  {translate("operations.server_authority")}</span>
              </h2>
              <p className="text-xs text-stone-500">
                {translate("trips.labels.txt_5f22c5")}</p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 gap-1 overflow-x-auto">
            <button
              onClick={() => setInnerTab('CONTROLLER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                innerTab === 'CONTROLLER' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{translate("trips.labels.txt_a636ce")}</span>
            </button>
            <button
              onClick={() => setInnerTab('DIAGRAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                innerTab === 'DIAGRAM' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{translate("trips.labels.txt_68729b")}</span>
            </button>
            <button
              onClick={() => setInnerTab('EVENTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                innerTab === 'EVENTS' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{translate("operations.events")}{tripEvents.length})</span>
            </button>
            <button
              onClick={() => setInnerTab('AUDIT_TRAIL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                innerTab === 'AUDIT_TRAIL' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{translate("operations.audit_log")}{tripAudits.length})</span>
            </button>
          </div>
        </div>

        {/* Persona / RBAC Context Bar */}
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{translate("trips.labels.txt_54360d")}</span>
            </span>
            <select
              value={activeRole}
              onChange={e => {
                const role = e.target.value as TripActorRole;
                setActiveRole(role);
                if (role === 'SCALE_OPERATOR') setActiveActorName('سعد الشهري (كاتب ميزان)');
                if (role === 'DISPATCHER') setActiveActorName('صالح الغامدي (مرحل عمليات)');
                if (role === 'DRIVER') setActiveActorName('خالد الشمري (سائق شاحنة)');
                if (role === 'SITE_RECEIVER') setActiveActorName('م. فهد الزهراني (مستلم موقع)');
                if (role === 'OPERATIONS_MANAGER') setActiveActorName('م. عبدالرحمن النمر (مدير عمليات)');
                if (role === 'AUDITOR') setActiveActorName('أحمد المطيري (مدقق مالي)');
              }}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="DISPATCHER">{translate("trips.labels.txt_f4327d")}</option>
              <option value="SCALE_OPERATOR">{translate("trips.labels.txt_2e23b2")}</option>
              <option value="DRIVER">{translate("trips.labels.txt_7517d4")}</option>
              <option value="SITE_RECEIVER">{translate("trips.labels.txt_29b5f9")}</option>
              <option value="OPERATIONS_MANAGER">{translate("trips.labels.txt_2750ef")}</option>
              <option value="AUDITOR">{translate("trips.labels.txt_7ccbe0")}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{translate("trips.status.projectActive")}</span>
            </span>
            <select
              value={activeProjectId}
              onChange={e => setActiveProjectId(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="PRJ-NEOM-001">{translate("trips.labels.txt_233016")}</option>
              <option value="PRJ-REDSEA-002">{translate("trips.labels.txt_4cc4c6")}</option>
            </select>
          </div>

          <div className="text-[11px] text-stone-500 font-mono">
            {translate("operations.operator")}<strong className="text-stone-800">{activeActorName}</strong> {translate("trips.labels.project_2")}<strong className={activeProjectId === activeTrip?.projectId ? 'text-emerald-700' : 'text-rose-700'}>{activeProjectId}</strong>
          </div>
        </div>
      </div>

      {/* Selected Trip Selector Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700">{translate("trips.labels.trip_16")}</span>
            <select
              value={activeTrip?.tripId || ''}
              onChange={e => onSelectTrip(e.target.value)}
              className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {trips.map((t, idx) => (
                <option key={`${t.tripId}-${idx}`} value={t.tripId}>
                  {t.tripSerial} {translate("operations.status_2")}{t.status}{translate("operations.v")}{t.version} — {t.entitySnapshots?.material?.nameAr || t.materialId}
                </option>
              ))}
            </select>
          </div>

          {activeTrip && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-stone-500 font-mono">{translate("operations.ticket")}<strong className="text-stone-900">{activeTrip.ticketId}</strong></span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">{translate("trips.labels.status_2")}{renderStatusBadge(activeTrip.status)}</span>
              <span className="text-stone-300">|</span>
              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono font-black text-[11px]">
                {translate("operations.version_v")}{activeTrip.version}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===================== TAB 1: CONTROLLER VIEW ===================== */}
      {innerTab === 'CONTROLLER' && activeTrip && (
        <div className="space-y-6">
          {/* Top Grid: Trip State Snapshot + Allowed Transitions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Active Trip Invariant State & Controls */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>{translate("operations.trip_weights_constraints_and_validation_record")}{activeTrip.tripSerial})</span>
                  </h3>
                  <div className="text-xs text-stone-500">
                    {translate("operations.project_2")}<span className="font-bold text-stone-800 font-mono">{activeTrip.projectId}</span>
                  </div>
                </div>

                {/* Key Invariant Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                    <span className="text-[10px] text-stone-500 block mb-1">{translate("operations.origin_net_weight_approved")}</span>
                    <div className="font-mono text-sm font-bold text-stone-900">
                      {activeTrip.netWeight.toLocaleString()} <span className="text-[10px] text-stone-500">{translate("shared.units.kg")}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 font-mono">
                      {translate("operations.gross")}{activeTrip.grossWeight.toLocaleString()} {translate("operations.tare")}{activeTrip.tareWeight.toLocaleString()}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    activeTrip.destNetWeight !== null 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}>
                    <span className="text-[10px] block mb-1">{translate("operations.destination_net_weight_destnet")}</span>
                    <div className="font-mono text-sm font-bold">
                      {activeTrip.destNetWeight !== null ? translate("operations.value_kg", { p0: activeTrip.destNetWeight.toLocaleString() }) : translate("operations.null_not_entered")}
                    </div>
                    <span className="text-[9px]">{translate("operations.receiving_required")}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    activeTrip.varianceWeight !== null 
                      ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' 
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}>
                    <span className="text-[10px] block mb-1">{translate("operations.weight_variance")}</span>
                    <div className="font-mono text-sm font-bold">
                      {activeTrip.varianceWeight !== null ? translate("operations.value_kg", { p0: activeTrip.varianceWeight > 0 ? `+${activeTrip.varianceWeight}` : activeTrip.varianceWeight }) : translate("operations.null_pending")}
                    </div>
                    <span className="text-[9px]">destNet - netWeight</span>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-amber-950">
                    <span className="text-[10px] text-amber-800 block mb-1">{translate("operations.settlement")}</span>
                    <div className="font-mono text-sm font-bold">
                      {activeTrip.settlementAmount.toLocaleString()} <span className="text-[10px]">SAR</span>
                    </div>
                    <span className="text-[9px] text-amber-700">
                      {activeTrip.pricingSnapshot.agreedRate} {translate("operations.sar_2")}{activeTrip.pricingType === 'PER_TON' ? translate("shared.units.ton") : translate("operations.trip")})
                    </span>
                  </div>
                </div>

                {/* Pricing Resolution Status Invariant */}
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-stone-800">
                        {translate("trips.labels.pricing")}{activeTrip.pricingSnapshot.ruleName || activeTrip.pricingRuleId}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {translate("operations.valid_from")}{activeTrip.pricingSnapshot.effectiveFrom || '2026-01-01'} {translate("operations.to")}{activeTrip.pricingSnapshot.effectiveTo || '2026-12-31'} {translate("operations.trip_date")}{activeTrip.shiftDate}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {translate("trips.labels.txt_10cba9")}</span>
                </div>

                {/* Available Transitions For Current Role */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                    <span>{translate("operations.available_transitions_for_role")}{activeRole}{translate("operations.from_status")}{activeTrip.status}]:</span>
                  </h4>

                  {availableTransitions.length === 0 ? (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs text-center">
                      {translate("operations.no_legal_transitions_are_available_for_the_current_role")}{activeRole}{translate("operations.from_status_2")}{activeTrip.status}{translate("operations.switch_roles_in_the_top_bar_to_simulate_another")}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableTransitions.map(tr => (
                        <div 
                          key={tr.targetStatus}
                          className="p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900">{operationalMessage(tr.labelAr)}</span>
                            <span className="text-[10px] font-mono text-stone-500">{tr.targetStatus}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 leading-snug">
                            {operationalMessage(tr.descriptionAr)}
                          </p>
                          <div className="pt-1 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setTransitionTarget(tr.targetStatus);
                                if (tr.targetStatus === 'COMPLETED') {
                                  setTransitionPayload(prev => ({
                                    ...prev,
                                    destGrossWeight: activeTrip.grossWeight - 150,
                                    destTareWeight: activeTrip.tareWeight,
                                    destNetWeight: (activeTrip.grossWeight - 150) - activeTrip.tareWeight,
                                    unloaderId: activeTrip.unloaderId || 'ENG-SITE-04',
                                    unloadTime: new Date().toISOString()
                                  }));
                                }
                              }}
                              className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                            >
                              <Play className="w-3 h-3" />
                              <span>{translate("operations.execute_transition_to")}{tr.targetStatus}]</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transition Modal/Input when clicked */}
                {transitionTarget && (
                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-amber-600" />
                        <span>{translate("trips.labels.confirm")}{transitionTarget}{translate("operations.validate_required_fields")}</span>
                      </span>
                      <button
                        onClick={() => setTransitionTarget(null)}
                        className="text-stone-400 hover:text-stone-600 text-xs"
                      >
                        {translate("trips.labels.cancel")}</button>
                    </div>

                    {/* Specific required fields for COMPLETED */}
                    {transitionTarget === 'COMPLETED' && (
                      <div className="space-y-3 bg-white p-3 rounded-lg border border-amber-200">
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{translate("operations.required_receiving_net_weight_receiver_id_unloading_time_and")}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-700 mb-1">{translate("operations.receiving_net_weight_destnetweight")}</label>
                            <input
                              type="number"
                              value={transitionPayload.destNetWeight || ''}
                              onChange={e => setTransitionPayload({ ...transitionPayload, destNetWeight: parseFloat(e.target.value) || 0 })}
                              className="w-full border border-stone-300 rounded px-2 py-1 text-xs font-mono font-bold text-stone-900"
                              placeholder={translate("operations.example_31250")}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-700 mb-1">{translate("unloading.labels.location")}</label>
                            <input
                              type="text"
                              value={transitionPayload.unloaderId || ''}
                              onChange={e => setTransitionPayload({ ...transitionPayload, unloaderId: e.target.value })}
                              className="w-full border border-stone-300 rounded px-2 py-1 text-xs text-stone-900"
                              placeholder="ENG-SITE-04"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-700 mb-1">{translate("trips.labels.txt_f45a43")}</label>
                            <input
                              type="text"
                              value={transitionPayload.unloadTime || ''}
                              onChange={e => setTransitionPayload({ ...transitionPayload, unloadTime: e.target.value })}
                              className="w-full border border-stone-300 rounded px-2 py-1 text-xs font-mono text-stone-900"
                              placeholder="2026-09-09T14:30:00Z"
                            />
                          </div>
                        </div>

                        {transitionPayload.destNetWeight && activeTrip.netWeight && (
                          <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-mono flex items-center justify-between">
                            <span>{translate("operations.server_calculated_weight_variance_2")}</span>
                            <strong>{transitionPayload.destNetWeight - activeTrip.netWeight} {translate("shared.units.kg")}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reason input for transitions requiring reason */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-1">
                        {translate("trips.labels.txt_5d1540")}</label>
                      <input
                        type="text"
                        value={transitionPayload.reason || ''}
                        onChange={e => setTransitionPayload({ ...transitionPayload, reason: e.target.value })}
                        placeholder={translate("operations.transition_reason_required_for_exceptions_cancellation_and_return")}
                        className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setTransitionTarget(null)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-bold"
                      >
                        {translate("shared.actions.cancel")}</button>
                      <button
                        onClick={() => handleExecuteTransition(transitionTarget)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{translate("trips.labels.txt_178295")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Negative Invariant Stress-Tests & Guardrail Provers */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-stone-900">
                    {translate("trips.labels.txt_2cd3f8")}</h3>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {translate("trips.labels.txt_58f744")}</p>

                <div className="space-y-2">
                  {/* Test 1: Direct Client Mutation */}
                  <button
                    onClick={testDirectClientMutation}
                    className="w-full text-right p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 text-rose-950 transition-all flex items-start gap-2 text-xs group"
                  >
                    <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("operations.direct_mutation_test")}</span>
                      <span className="text-[10px] text-rose-700">{translate("operations.direct_mutation_hint")}</span>
                    </div>
                  </button>

                  {/* Test 2: Complete without destNetWeight */}
                  <button
                    onClick={testCompleteWithoutDestNetWeight}
                    className="w-full text-right p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-amber-950 transition-all flex items-start gap-2 text-xs group"
                  >
                    <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("operations.2_complete_trip_without_receiving_net_weight")}</span>
                      <span className="text-[10px] text-amber-800">{translate("operations.complete_without_net_hint")}</span>
                    </div>
                  </button>

                  {/* Test 3: Complete without unloaderId or unloadTime */}
                  <button
                    onClick={testCompleteWithoutUnloaderOrTime}
                    className="w-full text-right p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-amber-950 transition-all flex items-start gap-2 text-xs group"
                  >
                    <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("operations.complete_without_receiver")}</span>
                      <span className="text-[10px] text-amber-800">{translate("trips.labels.txt_2c17d4")}</span>
                    </div>
                  </button>

                  {/* Test 4: Complete without variance calculation */}
                  <button
                    onClick={testCompleteWithoutVariance}
                    className="w-full text-right p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-amber-950 transition-all flex items-start gap-2 text-xs group"
                  >
                    <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("operations.complete_without_variance")}</span>
                      <span className="text-[10px] text-amber-800">{translate("trips.labels.txt_37b15d")}</span>
                    </div>
                  </button>

                  {/* Test 5: Start trip with failed pricing resolution */}
                  <button
                    onClick={testStartTripWithFailedPricing}
                    className="w-full text-right p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 text-rose-950 transition-all flex items-start gap-2 text-xs group"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("trips.status.tripFailed_4")}</span>
                      <span className="text-[10px] text-rose-700">{translate("operations.pricing_failure_hint")}</span>
                    </div>
                  </button>

                  {/* Test 6: Invalid state jump */}
                  <button
                    onClick={testInvalidStateJump}
                    className="w-full text-right p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900 transition-all flex items-start gap-2 text-xs group"
                  >
                    <GitCommit className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("trips.labels.txt_1a8cbe")}</span>
                      <span className="text-[10px] text-stone-500">{translate("trips.labels.txt_701a0c")}</span>
                    </div>
                  </button>

                  {/* Test 7: Unauthorized role */}
                  <button
                    onClick={testUnauthorizedRole}
                    className="w-full text-right p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900 transition-all flex items-start gap-2 text-xs group"
                  >
                    <ShieldAlert className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("operations.unauthorized_role_test")}</span>
                      <span className="text-[10px] text-stone-500">{translate("trips.labels.driverDownload")}</span>
                    </div>
                  </button>

                  {/* Test 8: Project mismatch */}
                  <button
                    onClick={testProjectMismatch}
                    className="w-full text-right p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900 transition-all flex items-start gap-2 text-xs group"
                  >
                    <Building2 className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{translate("operations.project_isolation_test")}</span>
                      <span className="text-[10px] text-stone-500">{translate("operations.project_isolation_hint")}</span>
                    </div>
                  </button>
                </div>

                {/* Stress Test Result Box */}
                {stressTestLog && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 mt-3 animate-fadeIn ${
                    stressTestLog.passedBlocked 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {stressTestLog.passedBlocked ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        <span>{stressTestLog.testName}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 font-mono">
                        {stressTestLog.passedBlocked ? translate("operations.successfully_blocked") : translate("operations.block_failed")}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-mono">
                      {stressTestLog.serverMessage}
                    </p>
                    <div className="text-[9px] text-stone-400 text-left font-mono">
                      {stressTestLog.timestamp}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: VISUAL STATE DIAGRAM ===================== */}
      {innerTab === 'DIAGRAM' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>{translate("trips.labels.txt_7a972e")}</span>
              </h3>
              <p className="text-xs text-stone-500">
                {translate("trips.labels.txt_3ac325")}</p>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              {translate("operations.current_trip")}<strong className="text-stone-800">{activeTrip?.tripSerial}</strong> {translate("operations.in")}{activeTrip?.status}]
            </span>
          </div>

          {/* Primary Golden Path Flow */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 block">{translate("trips.labels.txt_23fa6b")}</span>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {[
                { st: 'DRAFT', label: translate("operations.1_draft"), sub: translate('operations.draft_description'), roles: 'DISPATCHER' },
                { st: 'LOADED', label: translate("operations.2_loading_and_weighing"), sub: translate('trips.labels.txt_2f47a4'), roles: 'SCALE_OP' },
                { st: 'IN_TRANSIT', label: translate("operations.3_in_transit"), sub: translate('trips.labels.txt_304e68'), roles: 'DISPATCHER' },
                { st: 'ARRIVED', label: translate("operations.4_arrived_at_site"), sub: translate('trips.labels.txt_61ff0a'), roles: 'DRIVER/REC' },
                { st: 'UNLOADING', label: translate("operations.5_unloading"), sub: translate('trips.labels.txt_4d1719'), roles: 'RECEIVER' },
                { st: 'COMPLETED', label: translate("operations.6_completed_and_settled"), sub: translate('trips.labels.txt_226b89'), roles: 'RECEIVER' }
              ].map((item, idx) => {
                const isCurrent = activeTrip?.status === item.st;
                return (
                  <div 
                    key={item.st}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent 
                        ? 'border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-400' 
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div className="text-[11px] font-black text-stone-900 mb-0.5">{item.label}</div>
                    <div className="text-[10px] font-mono text-stone-500">{item.sub}</div>
                    <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-600 font-semibold inline-block">
                      {item.roles}
                    </div>
                    {isCurrent && (
                      <div className="mt-1 text-[9px] font-black text-amber-700 animate-pulse">
                        {translate("operations.trip_is_here_v")}{activeTrip.version})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alternative & Exception Branches */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-700 block">{translate("trips.labels.txt_13cdfe")}</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${activeTrip?.status === 'RETURN_REQUESTED' ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-stone-50'}`}>
                <div className="font-bold text-orange-900 mb-1">{translate("trips.labels.txt_1b87fb")}</div>
                <div className="text-[11px] text-stone-500 mb-2">{translate("trips.labels.location_9")}</div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-stone-700">SITE_RECEIVER, DISPATCHER</span>
              </div>

              <div className={`p-3 rounded-xl border ${activeTrip?.status === 'RETURNED' ? 'border-stone-600 bg-stone-200' : 'border-stone-200 bg-stone-50'}`}>
                <div className="font-bold text-stone-900 mb-1">{translate("trips.labels.txt_1e7d43")}</div>
                <div className="text-[11px] text-stone-500 mb-2">{translate("trips.labels.confirmBackTruck")}</div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-stone-700">SCALE_OPERATOR</span>
              </div>

              <div className={`p-3 rounded-xl border ${activeTrip?.status === 'EXCEPTION' ? 'border-rose-500 bg-rose-50' : 'border-stone-200 bg-stone-50'}`}>
                <div className="font-bold text-rose-900 mb-1">{translate("trips.labels.txt_4e4194")}</div>
                <div className="text-[11px] text-stone-500 mb-2">{translate("operations.accident_road_breakdown_weight_dispute_or_inability_to_reach")}</div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-stone-700">DRIVER, DISPATCHER, RECEIVER</span>
              </div>

              <div className={`p-3 rounded-xl border ${activeTrip?.status === 'CANCELLED' ? 'border-red-500 bg-red-50' : 'border-stone-200 bg-stone-50'}`}>
                <div className="font-bold text-red-900 mb-1">{translate("trips.labels.txt_2e7926")}</div>
                <div className="text-[11px] text-stone-500 mb-2">{translate("trips.labels.cancelTrip")}</div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-stone-700">DISPATCHER, OPERATIONS_MGR</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: LIFECYCLE EVENTS STREAM ===================== */}
      {innerTab === 'EVENTS' && activeTrip && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span>{translate("operations.lifecycle_events_stream_trip")}{activeTrip.tripSerial}</span>
              </h3>
              <p className="text-xs text-stone-500">
                {translate("trips.labels.timeProject")}</p>
            </div>
            <span className="text-xs font-mono text-stone-400 font-bold">
              {tripEvents.length} {translate("operations.recorded_event_s")}</span>
          </div>

          {tripEvents.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-400">
              {translate("operations.no_lifecycle_events")}</div>
          ) : (
            <div className="space-y-3">
              {tripEvents.map(evt => (
                <div 
                  key={evt.eventId}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {evt.eventId}
                      </span>
                      <span className="font-bold text-stone-800">{evt.action}</span>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded font-bold">{evt.fromStatus}</span>
                        <span>➔</span>
                        <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-bold">{evt.toStatus}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      {translate("trips.labels.txt_124138")}<strong className="text-stone-800">{evt.reason || translate("operations.no_additional_reason")}</strong>
                    </div>
                  </div>

                  <div className="text-left font-mono text-[11px] text-stone-500 space-y-0.5">
                    <div>{translate("operations.operator")}<strong className="text-stone-800">{evt.actorName}</strong> ({evt.actorRole})</div>
                    <div>{translate("operations.project")}<strong className="text-stone-800">{evt.projectId}</strong> | v{evt.version}</div>
                    <div className="text-[10px] text-stone-400">{new Date(evt.timestamp).toLocaleString('ar-SA')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 4: AUDIT TRAIL WITH VERSIONING ===================== */}
      {innerTab === 'AUDIT_TRAIL' && activeTrip && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>{translate("trips.labels.txt_46a3cb")}</span>
              </h3>
              <p className="text-xs text-stone-500">
                {translate("trips.labels.txt_4c39d7")}</p>
            </div>
            <span className="text-xs font-mono text-stone-400 font-bold">
              {tripAudits.length} {translate("operations.audit_entry_entries")}</span>
          </div>

          {tripAudits.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-400">
              {translate("trips.labels.txt_584eb0")}</div>
          ) : (
            <div className="space-y-3">
              {tripAudits.map(aud => (
                <div 
                  key={aud.auditId}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {aud.auditId}
                      </span>
                      <span className="text-indigo-900 font-bold">{aud.action}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-stone-600">
                      <span>{translate("trips.labels.txt_5980b8")}<strong>v{aud.versionBefore}</strong> ➔ <strong className="text-amber-700">v{aud.versionAfter}</strong></span>
                      <span className="text-stone-300">|</span>
                      <span>{translate("operations.by")}<strong>{aud.actorName}</strong> ({aud.actorRole})</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-700 leading-relaxed font-sans">
                    {aud.details}
                  </p>

                  {aud.diff && Object.keys(aud.diff).length > 0 && (
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-1 font-mono text-[11px]">
                      <span className="text-[10px] font-bold text-stone-500 block">{translate("trips.labels.txt_625185")}</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(aud.diff).map(([key, value]) => (
                          <div key={key} className="px-2 py-1 rounded bg-stone-100 border border-stone-200 text-stone-800">
                            <strong>{key}</strong>: <span className="text-rose-600">{String(value.before)}</span> ➔ <span className="text-emerald-700 font-bold">{String(value.after)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-stone-400 text-left font-mono">
                    {new Date(aud.timestamp).toLocaleString('ar-SA')} {translate("operations.project_3")}{aud.projectId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
