import React from 'react';
import { Truck, MapPin, Navigation, QrCode, Wifi, WifiOff, Clock, ShieldAlert } from 'lucide-react';
import { AuthUserContext } from '../../types/common';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../i18n';

export interface DriverViewProps {
  authContext: AuthUserContext;
}

export const DriverView: React.FC<DriverViewProps> = ({ authContext }) => {
  const { isOnline, isSimulatedOffline } = useOnlineStatus();
  const { t } = useI18n();

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

  // Mock driver trip
  const mockTrip = {
    tripSerial: 'TRP-2024-0899',
    ticketId: 'TCK-5510-XA',
    carrier: 'مؤسسة النقل السريع',
    truck: 'B77-99',
    material: 'ركام (Aggregate)',
    origin: 'محجر الرياض - الشمال',
    destination: 'مشروع نيوم - الموقع ج',
    state: 'IN_TRANSIT',
    age: '2h 15m'
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      {/* Offline Indicator */}
      {(!isOnline || isSimulatedOffline) && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 rounded-xl flex items-center justify-between text-xs font-bold border border-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>وضع عدم الاتصال نشط</span>
          </div>
          <span className="text-amber-700">تم المزامنة: قبل 10د</span>
        </div>
      )}

      {/* Driver Header */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">{authContext.displayName || 'سائق'}</h2>
            <div className="text-xs text-stone-400 font-mono">{authContext.userId}</div>
          </div>
        </div>
      </div>

      {/* Current Trip */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>الرحلة الحالية</span>
          </h3>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded border border-blue-200">
            {mockTrip.state === 'IN_TRANSIT' ? 'في الطريق' : mockTrip.state}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div>
              <div className="text-[10px] text-stone-500 mb-0.5">رقم الرحلة / التذكرة</div>
              <div className="text-sm font-bold text-stone-900 font-mono">{mockTrip.tripSerial}</div>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-stone-900 font-mono">{mockTrip.ticketId}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-stone-500 mb-0.5">الناقل</div>
              <div className="font-bold text-stone-900">{mockTrip.carrier}</div>
            </div>
            <div>
              <div className="text-stone-500 mb-0.5">الشاحنة</div>
              <div className="font-bold text-stone-900 font-mono">{mockTrip.truck}</div>
            </div>
            <div className="col-span-2">
              <div className="text-stone-500 mb-0.5">المادة</div>
              <div className="font-bold text-stone-900">{mockTrip.material}</div>
            </div>
          </div>

          <div className="relative pl-4 rtl:pl-0 rtl:pr-4 border-l-2 rtl:border-l-0 rtl:border-r-2 border-stone-200 space-y-4 py-2">
            <div className="relative">
              <div className="absolute -left-[21px] rtl:left-auto rtl:-right-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
              <div className="text-[10px] text-stone-500 mb-0.5">المصدر (تم التحميل)</div>
              <div className="text-xs font-bold text-stone-900">{mockTrip.origin}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[21px] rtl:left-auto rtl:-right-[21px] top-1 w-3 h-3 rounded-full bg-stone-300 border-2 border-white shadow-xs" />
              <div className="text-[10px] text-stone-500 mb-0.5">الوجهة (متجه إلى)</div>
              <div className="text-xs font-bold text-stone-900">{mockTrip.destination}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrival / Trip Status Action */}
      <button className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
        <MapPin className="w-5 h-5" />
        <span>تسجيل الوصول للوجهة</span>
      </button>

      {/* QR Waybill */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center text-center">
        <QrCode className="w-32 h-32 text-stone-900 mb-3" />
        <h3 className="text-sm font-bold text-stone-900 mb-1">بوليصة الشحن الإلكترونية</h3>
        <p className="text-xs text-stone-500">
          أبرز هذا الرمز لمشغل ميزان الاستلام لتسريع عملية التفريغ
        </p>
      </div>
    </div>
  );
};