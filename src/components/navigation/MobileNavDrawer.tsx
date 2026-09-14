import React from 'react';
import { 
  X, 
  Scale, 
  Building2, 
  LayoutDashboard, 
  FileText, 
  Boxes, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Inbox,
  AlertTriangle
} from 'lucide-react';
import { NavTabId, PRIMARY_AREAS, navigationService } from '../../services/navigation.service';
import { UserRole } from '../../types/common';
import { useI18n } from '../../i18n';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTabId;
  onSelectTab: (tabId: NavTabId) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenSystemTools: () => void;
  onOpenOutbox: () => void;
  isOnline: boolean;
  pendingOutboxCount: number;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentRole,
  onChangeRole,
  onOpenSystemTools,
  onOpenOutbox,
  isOnline,
  pendingOutboxCount,
}) => {
  const { direction } = useI18n();
  const isRtl = direction === 'rtl';

  if (!isOpen) return null;

  const roleProfile = navigationService.getRoleProfile(currentRole);
  const authorizedPrimaryTabs = navigationService.getAuthorizedPrimaryTabs(currentRole);
  const authorizedTools = navigationService.getAuthorizedSystemTools(currentRole);

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="w-5 h-5 text-amber-500" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'Boxes': return <Boxes className="w-5 h-5 text-orange-500" />;
      case 'LayoutDashboard': return <LayoutDashboard className="w-5 h-5 text-emerald-500" />;
      case 'FileText': return <FileText className="w-5 h-5 text-amber-500" />;
      default: return <Boxes className="w-5 h-5 text-stone-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-start animate-fadeIn" dir={direction}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-[85vw] max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col border-e border-stone-200 z-10">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400">
              Q
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Q Saudi Work Follow</h2>
              <span className="text-[10px] text-amber-300 font-medium">Enterprise Assembly</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User / Role Profile Header Card */}
        <div className="p-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>تبديل الصلاحية النشطة:</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleProfile.badgeColor}`}>
              {currentRole}
            </span>
          </div>

          <select
            value={currentRole}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              onChangeRole(newRole);
              const defTab = navigationService.getDefaultTabForRole(newRole);
              onSelectTab(defTab);
            }}
            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 min-h-[44px]"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (مشرف عام)</option>
            <option value="PROJECT_ADMIN">PROJECT_ADMIN (مدير مشروع)</option>
            <option value="SUPERVISOR">SUPERVISOR (مشرف ميداني)</option>
            <option value="SITE_SUPERVISOR">SITE_SUPERVISOR (مشرف موقع تفريغ)</option>
            <option value="DISPATCHER">DISPATCHER (مرحل شاحنات)</option>
            <option value="SCALE_OPERATOR">SCALE_OPERATOR (مشغل ميزان)</option>
            <option value="FINANCE_AUDITOR">FINANCE_AUDITOR (مدقق مالي)</option>
            <option value="DRIVER">DRIVER (سائق شاحنة)</option>
            <option value="VIEWER">VIEWER (مستعرض فقط)</option>
          </select>

          <div className="mt-2 text-[11px] text-stone-500 leading-tight">
            {roleProfile.userNameAr}
          </div>
        </div>

        {/* Primary Sections & Navigation Tabs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
              الأقسام الرئيسية المصرحة
            </div>

            <div className="space-y-1.5">
              {authorizedPrimaryTabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`mobile-tab-${tab.id}`}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl text-right transition-all border ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-900 border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-stone-800' : 'bg-white shadow-2xs'}`}>
                        {getTabIcon(tab.icon)}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{tab.titleAr}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {tab.titleEn}
                        </div>
                      </div>
                    </div>

                    {tab.badgeAr && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
                      }`}>
                        {tab.badgeAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary System Tools Trigger */}
          {authorizedTools.length > 0 && (
            <div className="pt-3 border-t border-stone-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
                الأدوات الإدارية والفنية
              </div>

              <button
                id="mobile-btn-system-tools"
                onClick={() => {
                  onClose();
                  onOpenSystemTools();
                }}
                className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold text-xs hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>أدوات النظام والمطورين ({authorizedTools.length})</span>
                </div>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Utility Controls */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher />

            <button
              id="mobile-outbox-btn"
              onClick={() => {
                onClose();
                onOpenOutbox();
              }}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                isOnline 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-700" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
              <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded-full">
                {pendingOutboxCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
