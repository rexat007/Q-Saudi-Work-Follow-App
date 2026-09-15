import React from 'react';
import { ShieldAlert, Lock, ArrowRight, ArrowLeft, UserCheck } from 'lucide-react';
import { NavTabId, navigationService } from '../../services/navigation.service';
import { UserRole } from '../../types/common';
import { useI18n } from '../../i18n';
import { useAuth } from '../../firebase/authContext';

interface UnauthorizedBannerProps {
  requestedTab: NavTabId;
  currentRole: UserRole;
  onRedirectToDefault: () => void;
}

export const UnauthorizedBanner: React.FC<UnauthorizedBannerProps> = ({
  requestedTab,
  currentRole,
  onRedirectToDefault,
}) => {
  const { direction } = useI18n();
  const isRtl = direction === 'rtl';
  const roleProfile = navigationService.getRoleProfile(currentRole);
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.fullName || user?.displayName || 'مدير النظام';

  return (
    <div className="max-w-3xl mx-auto my-12 bg-[#1a1d23] rounded border border-rose-500/40 p-6 sm:p-8 shadow-2xl text-right font-mono" dir={direction}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded bg-rose-950/60 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/30">
              403 • ACCESS RESTRICTED
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs font-mono text-white/50">{requestedTab}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-[#f8fafc] mb-2 font-display uppercase tracking-tight">
            غير مصرح بالوصول لهذا القسم (Role Guard Enforced)
          </h2>

          <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-4">
            وفقاً لقواعد الحوكمة وسياسات الأمان المعتمدة في النظام، فإن الدور النشط حالياً{' '}
            <strong className="text-[#10b981] font-bold font-mono">({currentRole})</strong>{' '}
            لا يملك صلاحية استعراض أو تنفيذ عمليات ضمن وحدة ({requestedTab}).
          </p>

          <div className="bg-[#0f1115] border border-white/10 rounded p-4 mb-6 space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/60">
              <span>المستخدم النشط:</span>
              <strong className="text-[#f8fafc]">{displayName}</strong>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>الصلاحية الحالية:</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${roleProfile.badgeColor}`}>
                {roleProfile.titleAr}
              </span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>نطاق المشاريع المصرحة:</span>
              <span className="font-mono text-[11px] bg-[#000000] text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded font-bold">
                {roleProfile.assignedProjectIds.join(', ')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRedirectToDefault}
              className="px-5 py-2.5 rounded bg-[#10b981] hover:bg-[#059669] text-[#0f1115] text-xs font-mono font-black shadow transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <span>العودة إلى القسم الافتراضي المصرح</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
