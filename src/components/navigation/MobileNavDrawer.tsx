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
import { useAuth } from '../../firebase/authContext';

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
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.fullName || user?.displayName || 'مدير النظام';

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
      <div className="relative w-[85vw] max-w-xs sm:max-w-sm bg-[#0f1115] text-[#f8fafc] h-full shadow-2xl flex flex-col border-e border-white/10 z-10 font-mono">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#10b981] bg-[#14171c] text-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#10b981] text-[#0f1115] flex items-center justify-center font-black font-display text-lg shadow-sm">
              Q
            </div>
            <div>
              <h2 className="text-sm font-black font-display uppercase tracking-wider text-[#f8fafc]">Q Saudi Work Follow</h2>
              <span className="text-[10px] text-[#10b981] font-mono tracking-widest uppercase">INDUSTRIAL_CORE</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-white/60 hover:text-[#f8fafc] hover:bg-white/10 border border-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User / Role Profile Header Card */}
        <div className="p-4 border-b border-white/10 bg-[#15181e]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[#f8fafc]">
              <UserCheck className="w-4 h-4 text-[#10b981]" />
              <span>تبديل الصلاحية:</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${roleProfile.badgeColor}`}>
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
            className="w-full bg-[#0f1115] border border-white/15 rounded px-3 py-2 text-xs font-bold font-mono text-[#f8fafc] focus:outline-hidden focus:border-[#10b981] min-h-[44px]"
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

          <div className="mt-2 text-[11px] font-mono text-white/50 leading-tight">
            USER: {displayName}
          </div>
        </div>

        {/* Primary Sections & Navigation Tabs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/50 mb-2 px-1">
              الأقسام المصرحة // AUTHORIZED_AREAS
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
                    className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded text-right transition-all border ${
                      isSelected
                        ? 'bg-[#10b981] text-[#0f1115] border-[#10b981] shadow-sm font-bold'
                        : 'bg-[#1a1d23] hover:bg-white/5 text-[#f8fafc] border-white/10 hover:border-[#10b981]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${isSelected ? 'bg-black/20 text-[#0f1115]' : 'bg-white/5 text-[#10b981]'}`}>
                        {getTabIcon(tab.icon)}
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono">{tab.titleAr}</div>
                        <div className={`text-[10px] font-mono ${isSelected ? 'text-[#0f1115]/80' : 'text-white/50'}`}>
                          {tab.titleEn}
                        </div>
                      </div>
                    </div>

                    {tab.badgeAr && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-black text-[#10b981]' : 'bg-white/10 text-[#f8fafc]'
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
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/50 mb-2 px-1">
                SYSTEM_TOOLS // أدوات النظام
              </div>

              <button
                id="mobile-btn-system-tools"
                onClick={() => {
                  onClose();
                  onOpenSystemTools();
                }}
                className="w-full min-h-[44px] flex items-center justify-between p-3 rounded bg-[#1a1d23] border border-[#10b981]/40 text-[#10b981] font-mono font-bold text-xs hover:bg-[#10b981]/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#10b981]" />
                  <span>أدوات النظام والمطورين ({authorizedTools.length})</span>
                </div>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Utility Controls */}
        <div className="p-4 border-t border-white/10 bg-[#14171c] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher />

            <button
              id="mobile-outbox-btn"
              onClick={() => {
                onClose();
                onOpenOutbox();
              }}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-mono font-bold border ${
                isOnline 
                  ? 'bg-[#1a1d23] border-[#10b981]/40 text-[#10b981]' 
                  : 'bg-[#1a1d23] border-amber-500 text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4 text-[#10b981]" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              <span className="font-mono text-[10px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded">
                {pendingOutboxCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
