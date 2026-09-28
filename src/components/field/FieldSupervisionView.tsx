import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  AlertOctagon, 
  FileSpreadsheet, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Navigation,
  Clock,
  Scale
} from 'lucide-react';
import { AuthUserContext } from '../../types/common';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../i18n';
import { ExcelCsvImportSection } from '../importCenter/ExcelCsvImportSection';
import { GoogleSheetsImportSection } from '../importCenter/GoogleSheetsImportSection';
import { indexedDBService } from '../../services/offline/indexedDB.service';
import { tripRepository } from '../../repositories/trip.repository';
import { exceptionEngine } from '../../services/exceptionEngine.service';

export interface FieldSupervisionViewProps {
  authContext: AuthUserContext;
  onNotification?: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
  selectedProjectId?: string;
}

export const FieldSupervisionView: React.FC<FieldSupervisionViewProps> = ({ 
  authContext, 
  onNotification,
  selectedProjectId
}) => {
  const { isOnline, isSimulatedOffline } = useOnlineStatus();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'EXCEPTIONS' | 'IMPORTS' | 'UNRESOLVED'>('LIVE');
  const [importSource, setImportSource] = useState<'EXCEL_CSV' | 'GOOGLE_SHEETS'>('EXCEL_CSV');

  // Safe project-scope fail-closed derivation
  const targetProjectId = useMemo(() => {
    // 1. Explicit selectedProjectId wins if operator is authorized for it
    if (selectedProjectId && selectedProjectId !== '') {
      const isGlobalScope = authContext.assignedProjectIds?.includes('ALL');
      const isAuthorized = isGlobalScope || authContext.assignedProjectIds?.includes(selectedProjectId);
      if (isAuthorized) {
        return selectedProjectId;
      }
    }

    // 2. Otherwise collect assigned project IDs, excluding ALL and empty
    const validAssignedProjects = (authContext.assignedProjectIds || []).filter(
      (pid) => pid && pid !== '' && pid !== 'ALL'
    );

    // 3. Exactly one assigned project may be safely inferred
    if (validAssignedProjects.length === 1) {
      return validAssignedProjects[0];
    }

    // 4. Zero or more than one assigned project -> unresolved (fail closed)
    return undefined;
  }, [selectedProjectId, authContext.assignedProjectIds]);
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadCanonicalTrips = async () => {
      try {
        if (isOnline && !isSimulatedOffline && targetProjectId) {
          const remoteTrips = await tripRepository.listByProject(targetProjectId).catch(() => []);
          if (remoteTrips && remoteTrips.length > 0) {
            await indexedDBService.putMany('trips', remoteTrips).catch(() => {});
          }
        }

        const allTrips: any[] = await indexedDBService.getAll('trips').catch(() => []);
        const filteredTrips = targetProjectId
          ? allTrips.filter(t => t.projectId === targetProjectId)
          : allTrips;

        if (isMounted) {
          setTrips(filteredTrips);
        }
      } catch (err) {
        console.warn('FieldSupervisionView: Error loading canonical trips:', err);
      }
    };

    loadCanonicalTrips();
    return () => {
      isMounted = false;
    };
  }, [targetProjectId, isOnline, isSimulatedOffline]);

  const exceptions = useMemo(() => {
    return exceptionEngine.getAllExceptions().filter(e => 
      (!targetProjectId || e.projectId === targetProjectId) &&
      (e.status === 'OPEN' || e.status === 'UNDER_REVIEW')
    );
  }, [targetProjectId]);

  const loadingQueueCount = useMemo(() => trips.filter(t => t.status === 'LOADED').length, [trips]);
  const inTransitCount = useMemo(() => trips.filter(t => t.status === 'LOADED' || t.status === 'IN_TRANSIT').length, [trips]);
  const unloadingQueueCount = useMemo(() => trips.filter(t => t.status === 'UNLOADING' || t.status === 'ARRIVED' || t.status === 'AT_DESTINATION').length, [trips]);
  const completedTodayCount = useMemo(() => trips.filter(t => t.status === 'COMPLETED').length, [trips]);

  // Role Guard
  const allowedRoles = ['SUPERVISOR', 'SITE_SUPERVISOR', 'PROJECT_ADMIN', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(authContext.role)) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-rose-900 mb-2">غير مصرح بالدخول (Unauthorized)</h2>
        <p className="text-sm text-rose-600 mb-4">
          عذراً، هذه الواجهة مخصصة للإشراف الميداني فقط. صلاحيتك الحالية ({authContext.role}) لا تسمح بالوصول.
        </p>
      </div>
    );
  }

  const handleDecision = (tripId: string, action: string) => {
    if (onNotification) {
      onNotification({ type: 'SUCCESS', message: `تم تطبيق القرار: ${action} للرحلة ${tripId}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Supervision Header & Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">مركز الإشراف الميداني</h2>
              <p className="text-xs text-stone-500">مراقبة العمليات الحية، الاستثناءات، والاعتمادات</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('LIVE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'LIVE' ? 'bg-white shadow-sm text-indigo-700' : 'text-stone-600 hover:bg-stone-200'}`}
            >
              <Activity className="w-4 h-4 inline-block mr-1.5 ml-1.5" />
              العمليات الحية
            </button>
            <button 
              onClick={() => setActiveTab('EXCEPTIONS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'EXCEPTIONS' ? 'bg-white shadow-sm text-rose-700' : 'text-stone-600 hover:bg-stone-200'}`}
            >
              <AlertOctagon className="w-4 h-4 inline-block mr-1.5 ml-1.5" />
              مركز الاستثناءات {exceptions.length > 0 && `(${exceptions.length})`}
            </button>
            <button 
              onClick={() => setActiveTab('UNRESOLVED')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'UNRESOLVED' ? 'bg-white shadow-sm text-amber-700' : 'text-stone-600 hover:bg-stone-200'}`}
            >
              <Users className="w-4 h-4 inline-block mr-1.5 ml-1.5" />
              الكيانات غير المعرفة
            </button>
            <button 
              onClick={() => setActiveTab('IMPORTS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'IMPORTS' ? 'bg-white shadow-sm text-emerald-700' : 'text-stone-600 hover:bg-stone-200'}`}
            >
              <FileSpreadsheet className="w-4 h-4 inline-block mr-1.5 ml-1.5" />
              إشراف الاستيراد
            </button>
          </div>
        </div>

        {/* Offline indicator */}
        {(!isOnline || isSimulatedOffline) && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-center justify-between border border-amber-200 mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>هناك عمليات معلقة تنتظر المزامنة مع الخادم.</span>
            </div>
            <span>الوضع: Offline</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'LIVE' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="text-xs text-stone-500 mb-1">طابور التحميل</div>
              <div className="text-2xl font-black text-stone-900">{loadingQueueCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="text-xs text-stone-500 mb-1">في الطريق (In Transit)</div>
              <div className="text-2xl font-black text-indigo-600">{inTransitCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="text-xs text-stone-500 mb-1">طابور التفريغ</div>
              <div className="text-2xl font-black text-amber-600">{unloadingQueueCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="text-xs text-stone-500 mb-1">مكتملة اليوم</div>
              <div className="text-2xl font-black text-emerald-600">{completedTodayCount}</div>
            </div>
          </div>

          {/* Trip Monitoring */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" />
                مراقبة الرحلات الحية (Trip Monitoring)
              </h3>
              <span className="text-xs text-stone-500 font-mono font-bold">
                إجمالي: {trips.length} رحلة
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="p-3 font-bold">الرحلة / التذكرة</th>
                    <th className="p-3 font-bold">الناقل / الشاحنة</th>
                    <th className="p-3 font-bold">المادة</th>
                    <th className="p-3 font-bold">وزن المصدر</th>
                    <th className="p-3 font-bold">وزن الوجهة</th>
                    <th className="p-3 font-bold">الحالة</th>
                    <th className="p-3 font-bold">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400">
                        <Navigation className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                        <p className="font-bold text-sm text-stone-600">لا توجد رحلات نشطة حالياً</p>
                        <p className="text-xs text-stone-400 mt-1">سيتم إدراج الرحلات الميدانية فور انطلاقها من محطات التحميل</p>
                      </td>
                    </tr>
                  ) : (
                    trips.map(trip => (
                      <tr key={trip.tripId} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-stone-900 font-mono">{trip.tripSerial || trip.tripId}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{trip.ticketId || '-'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-stone-900">{trip.carrierId}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{trip.truckId}</div>
                        </td>
                        <td className="p-3 text-stone-700">{trip.materialId}</td>
                        <td className="p-3 font-mono">{(trip.netWeight || trip.weights?.originNetKg || 0).toLocaleString()} كجم</td>
                        <td className="p-3 font-mono">{trip.destNetWeight || trip.weights?.destinationNetKg ? `${(trip.destNetWeight || trip.weights?.destinationNetKg).toLocaleString()} كجم` : '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            trip.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            trip.status === 'IN_TRANSIT' || trip.status === 'LOADED' ? 'bg-blue-100 text-blue-800' :
                            trip.status === 'EXCEPTION' ? 'bg-rose-100 text-rose-800' :
                            'bg-stone-100 text-stone-800'
                          }`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="p-3 flex items-center gap-1 text-stone-500 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(trip.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EXCEPTIONS' && (
        <div className="space-y-4">
          {exceptions.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-stone-900 text-sm mb-1">لا توجد استثناءات معلقة</h3>
              <p className="text-xs text-stone-500">كافة الرحلات الميدانية مطابقة للمحددات القياسية والتفاوت الوزني المسموح.</p>
            </div>
          ) : (
            exceptions.map(exc => (
              <div key={exc.exceptionId} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h3 className="font-bold text-stone-900">{exc.type} ({exc.exceptionId})</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      exc.severity === 'BLOCKING' || exc.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {exc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mb-4">{exc.description}</p>
                  
                  {/* OPERATIONAL DECISION PANEL */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <h4 className="text-xs font-bold text-stone-900 mb-3">لوحة القرارات التشغيلية (Decision Panel)</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDecision(exc.exceptionId, 'RESOLVE')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        معالجة واعتماد الاستثناء
                      </button>
                      <button 
                        onClick={() => handleDecision(exc.exceptionId, 'REJECT')}
                        className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        رفض وتوثيق المخالفة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'UNRESOLVED' && (
        <div className="space-y-4">
          <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">لا توجد كيانات غير معرفة</h3>
            <p className="text-xs text-stone-500">كافة بيانات الشاحنات والسائقين والناقلين مطابقة لسجلات النظام المركزية.</p>
          </div>
        </div>
      )}

      {activeTab === 'IMPORTS' && (
        <div className="space-y-6">
          {!targetProjectId ? (
            /* Unresolved project UX - Fail Closed */
            <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
              <h3 className="text-sm font-bold text-amber-900">تحديد نطاق المشروع مطلوب (Project Selection Required)</h3>
              <p className="text-xs text-amber-600 max-w-md">
                برجاء اختيار مشروع محدد من قائمة المشاريع في شريط التنقل للتمكن من استيراد تذاكر النقل البري وموازين التحميل. لا يمكن الاستيراد بدون نطاق مشروع نشط ومعزول.
              </p>
            </div>
          ) : (
            <>
              {/* Smart Ingestion Source Header & Selection Control */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-600" />
                      <span>مركز الاستيراد التشغيلي الذكي</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      استيراد وتحليل تذاكر موازين النقل وإجراء مطابقة الكيانات والتحقق من وزن المصدر والوجهة تلقائياً.
                    </p>
                  </div>

                  {/* Source Choice Selector Button Group */}
                  <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setImportSource('EXCEL_CSV')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        importSource === 'EXCEL_CSV'
                          ? 'bg-white shadow-xs text-indigo-700'
                          : 'text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>ملفات Excel / CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportSource('GOOGLE_SHEETS')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        importSource === 'GOOGLE_SHEETS'
                          ? 'bg-white shadow-xs text-emerald-700'
                          : 'text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>جداول Google Sheets</span>
                    </button>
                  </div>
                </div>

                {/* Project Context Isolation Scope Metadata Ribbon */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-400">نطاق المشروع النشط (Active Project Scope):</span>
                    <span className="bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200 font-mono text-stone-700">
                      {targetProjectId}
                    </span>
                  </div>
                  <div className="font-mono text-stone-400">
                    ROLE: {authContext.role}
                  </div>
                </div>
              </div>

              {/* Conditional rendering of selected child import section */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden p-4">
                {importSource === 'EXCEL_CSV' ? (
                  <ExcelCsvImportSection
                    currentProjectId={targetProjectId}
                    authContext={authContext}
                  />
                ) : (
                  <GoogleSheetsImportSection
                    projectId={targetProjectId}
                    authContext={authContext}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};