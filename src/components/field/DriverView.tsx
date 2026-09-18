import React, { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, Navigation, QrCode, WifiOff, ShieldAlert } from 'lucide-react';
import { AuthUserContext } from '../../types/common';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../i18n';
import { indexedDBService } from '../../services/offline/indexedDB.service';
import { outboxService } from '../../services/offline/outbox.service';
import { tripRepository } from '../../repositories/trip.repository';

export interface DriverViewProps {
  authContext: AuthUserContext;
}

export const DriverView: React.FC<DriverViewProps> = ({ authContext }) => {
  const { isOnline, isSimulatedOffline } = useOnlineStatus();
  const { t } = useI18n();

  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  const refreshActiveTrip = useCallback(async () => {
    try {
      if (isOnline && authContext?.assignedProjectIds && authContext.assignedProjectIds.length > 0) {
        for (const pId of authContext.assignedProjectIds) {
          const remoteTrips = await tripRepository.listByProject(pId).catch(() => []);
          if (remoteTrips && remoteTrips.length > 0) {
            await indexedDBService.putMany('trips', remoteTrips).catch(() => {});
          }
        }
      }

      const all: any[] = await indexedDBService.getAll('trips').catch(() => []);
      const driverActive = all.find(t => 
        (t.driverId === authContext.userId || t.assignedDriverId === authContext.userId) && 
        (t.status === 'LOADED' || t.status === 'IN_TRANSIT' || t.status === 'ARRIVED' || t.status === 'UNLOADING')
      );
      setActiveTrip(driverActive || null);
    } catch (e) {
      console.warn('[DriverView] Failed to refresh active trip:', e);
    }
  }, [authContext, isOnline]);

  useEffect(() => {
    refreshActiveTrip();
  }, [refreshActiveTrip]);

  // Role Guard
  if (authContext.role !== 'DRIVER') {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-rose-900 mb-2">غير مصرح بالدخول (Unauthorized)</h2>
        <p className="text-sm text-rose-600 mb-4">
          هذه الواجهة مخصصة للسائقين فقط. لا يمكنك الوصول إليها بصلاحية {authContext.role}.
        </p>
      </div>
    );
  }

  const handleRecordArrival = async () => {
    if (!activeTrip) return;
    try {
      const now = new Date().toISOString();
      const updatedTrip = {
        ...activeTrip,
        status: 'ARRIVED',
        arrivedAt: now,
        updatedAt: now,
        updatedBy: authContext.userId,
      };

      await indexedDBService.put('trips', updatedTrip);

      await outboxService.queueOperation({
        projectId: activeTrip.projectId,
        userId: authContext.userId,
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId: activeTrip.tripId,
          status: 'AT_DESTINATION',
          arrivedAt: now,
          timestamp: now,
          actorId: authContext.userId,
          actorName: authContext.displayName || 'السائق',
          actorRole: 'DRIVER',
        },
      });

      if (isOnline && !isSimulatedOffline) {
        await outboxService.syncAll(false).catch(() => {});
      }

      setActiveTrip(updatedTrip);
    } catch (e: any) {
      console.warn('Failed to record arrival:', e);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12" dir="rtl">
      {/* Offline Indicator */}
      {(!isOnline || isSimulatedOffline) && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 rounded-xl flex items-center justify-between text-xs font-bold border border-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>وضع عدم الاتصال نشط</span>
          </div>
          <span className="text-amber-700">Offline Mode</span>
        </div>
      )}

      {/* Driver Header */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">{authContext.displayName || 'سائق ميداني'}</h2>
            <div className="text-xs text-stone-400 font-mono">{authContext.userId}</div>
          </div>
        </div>
      </div>

      {/* Current Trip */}
      {!activeTrip ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center space-y-3">
          <Truck className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">لا توجد رحلة نشطة حالياً</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            لم يتم تعيين أي رحلة شحن نشطة لك في الوقت الحالي. سيتم إدراج بيانات الشحنة فور إصدار أمر التحميل من المحطة.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span>الرحلة الحالية</span>
              </h3>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded border border-blue-200">
                {activeTrip.status === 'IN_TRANSIT' ? 'في الطريق' : activeTrip.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div>
                  <div className="text-[10px] text-stone-500 mb-0.5">رقم الرحلة / التذكرة</div>
                  <div className="text-sm font-bold text-stone-900 font-mono">{activeTrip.tripSerial || activeTrip.tripId}</div>
                </div>
                <div className="text-left font-mono text-xs font-bold text-stone-600">
                  {activeTrip.ticketId || '-'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-stone-500 mb-0.5">الناقل</div>
                  <div className="font-bold text-stone-900">{activeTrip.carrierId}</div>
                </div>
                <div>
                  <div className="text-stone-500 mb-0.5">الشاحنة</div>
                  <div className="font-bold text-stone-900 font-mono">{activeTrip.truckId}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-stone-500 mb-0.5">المادة المحملة</div>
                  <div className="font-bold text-stone-900">{activeTrip.materialId} ({(activeTrip.netWeight || 0).toLocaleString()} كجم)</div>
                </div>
              </div>

              <div className="relative pr-4 border-r-2 border-stone-200 space-y-4 py-2">
                <div className="relative">
                  <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                  <div className="text-[10px] text-stone-500 mb-0.5">المصدر (تم التحميل)</div>
                  <div className="text-xs font-bold text-stone-900">محطة التحميل</div>
                </div>
                <div className="relative">
                  <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-stone-300 border-2 border-white shadow-xs" />
                  <div className="text-[10px] text-stone-500 mb-0.5">الوجهة (متجه إلى)</div>
                  <div className="text-xs font-bold text-stone-900">{activeTrip.projectId || 'موقع المشروع'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival / Trip Status Action */}
          {activeTrip.status === 'IN_TRANSIT' && (
            <button 
              onClick={handleRecordArrival}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span>تسجيل الوصول للوجهة</span>
            </button>
          )}

          {/* QR Waybill */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center text-center">
            <QrCode className="w-32 h-32 text-stone-900 mb-3" />
            <h3 className="text-sm font-bold text-stone-900 mb-1">بوليصة الشحن الإلكترونية</h3>
            <p className="text-xs text-stone-500">
              أبرز هذا الرمز لمشغل ميزان الاستلام لتسريع عملية التفريغ
            </p>
          </div>
        </>
      )}
    </div>
  );
};