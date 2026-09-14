import React, { useState } from 'react';
import { 
  Scale, 
  Truck, 
  ArrowRightLeft, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LoadingOperatorView } from './LoadingOperatorView';
import { UnloadingOperatorView } from './UnloadingOperatorView';
import { FieldSupervisionView } from './FieldSupervisionView';
import { DriverView } from './DriverView';
import { AuthUserContext, UserRole } from '../../types/common';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export type FieldTab = 'LOADING_STATION' | 'UNLOADING_STATION' | 'SUPERVISION' | 'DRIVER_VIEW';

export interface FieldOperationsViewProps {
  initialTab?: FieldTab;
  initialRole?: UserRole;
}

export const FieldOperationsView: React.FC<FieldOperationsViewProps> = ({
  initialTab = 'LOADING_STATION',
  initialRole = 'SCALE_OPERATOR'
}) => {
  const [activeTab, setActiveTab] = useState<FieldTab>(initialTab);
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [notification, setNotification] = useState<{
    type: 'SUCCESS' | 'ERROR' | 'SECURITY';
    message: string;
  } | null>(null);

  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();

  // Construct active AuthUserContext based on selected simulator role
  const currentAuthContext: AuthUserContext = {
    userId: `USR-${activeRole.slice(0, 8)}`,
    email: `${activeRole.toLowerCase()}@qsaudi.com`,
    displayName: getRoleDisplayName(activeRole),
    role: activeRole,
    assignedProjectIds: ['PRJ-NEOM-001']
  };

  const handleNotification = (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => {
    setNotification(notif);
    if (notif.type === 'SUCCESS') {
      setTimeout(() => setNotification(null), 6000);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Field Workplace Control Header */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">منظومة العمليات الميدانية</span>
                <span className="text-stone-500">•</span>
                <span className="text-xs text-stone-300 font-mono">FIELD OPERATIONS SUITE</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white mt-0.5">
                واجهات مشغلي الموازين والاستلام بالمواقع
              </h1>
            </div>
          </div>

          {/* Quick Tab Switcher & Role Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Field Station Tabs */}
            <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('LOADING_STATION')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'LOADING_STATION'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>ميزان التحميل (Loading)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UNLOADING_STATION')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'UNLOADING_STATION'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ميزان الاستلام (Unloading)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SUPERVISION')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'SUPERVISION'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>الإشراف الميداني (Supervision)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DRIVER_VIEW')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'DRIVER_VIEW'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>واجهة السائق (Driver)</span>
              </button>
            </div>

            {/* Role Simulation Selector */}
            <div className="flex items-center gap-1.5 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700/60 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-stone-400 text-[11px]">محاكاة الدور:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-transparent text-white font-bold font-mono focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="SCALE_OPERATOR" className="bg-stone-800">SCALE_OPERATOR (مشغل ميزان)</option>
                <option value="DISPATCHER" className="bg-stone-800">DISPATCHER (مرحل شاحنات)</option>
                <option value="SITE_SUPERVISOR" className="bg-stone-800">SITE_SUPERVISOR (مشرف موقع تفريغ)</option>
                <option value="SUPERVISOR" className="bg-stone-800">SUPERVISOR (مشرف ميداني)</option>
                <option value="PROJECT_ADMIN" className="bg-stone-800">PROJECT_ADMIN (مدير مشروع)</option>
                <option value="FINANCE_AUDITOR" className="bg-stone-800">FINANCE_AUDITOR (مدقق مالي - غير مصرح)</option>
                <option value="DRIVER" className="bg-stone-800">DRIVER (سائق - غير مصرح)</option>
                <option value="SUPER_ADMIN" className="bg-stone-800">SUPER_ADMIN (مشرف عام)</option>
              </select>
            </div>

            {/* Offline Simulation Toggle */}
            <button
              type="button"
              onClick={toggleSimulatedOffline}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isSimulatedOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-stone-800 text-stone-300 border-stone-700/60 hover:text-white'
              }`}
            >
              {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isSimulatedOffline ? 'وضع عدم الاتصال نشط' : 'محاكاة عدم الاتصال'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs animate-fadeIn ${
          notification.type === 'SUCCESS'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : notification.type === 'SECURITY'
            ? 'bg-amber-50 text-amber-950 border-amber-300'
            : 'bg-rose-50 text-rose-950 border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : notification.type === 'SECURITY' ? (
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Active Station View */}
      {activeTab === 'LOADING_STATION' ? (
        <LoadingOperatorView
          authContext={currentAuthContext}
          onNotification={handleNotification}
        />
      ) : activeTab === 'UNLOADING_STATION' ? (
        <UnloadingOperatorView
          authContext={currentAuthContext}
          onNotification={handleNotification}
        />
      ) : activeTab === 'SUPERVISION' ? (
        <FieldSupervisionView
          authContext={currentAuthContext}
          onNotification={handleNotification}
        />
      ) : (
        <DriverView
          authContext={currentAuthContext}
        />
      )}
    </div>
  );
};

function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'SCALE_OPERATOR': return 'مشغل ميزان ميداني (Scale Operator)';
    case 'DISPATCHER': return 'مرحل وموجه حركة (Dispatcher)';
    case 'SUPERVISOR': return 'مشرف عمليات ميدانية (Field Supervisor)';
    case 'SITE_SUPERVISOR': return 'مشرف موقع تفريغ (Site Supervisor)';
    case 'PROJECT_ADMIN': return 'مدير المشروع (Project Admin)';
    case 'FINANCE_AUDITOR': return 'مدقق مالي (Finance Auditor)';
    case 'DRIVER': return 'سائق شاحنة (Driver)';
    case 'SUPER_ADMIN': return 'المشرف العام للنظام (Super Admin)';
    default: return role;
  }
}
