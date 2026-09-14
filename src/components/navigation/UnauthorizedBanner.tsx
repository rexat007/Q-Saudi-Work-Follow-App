import React from 'react';
import { ShieldAlert, Lock, ArrowRight, ArrowLeft, UserCheck } from 'lucide-react';
import { NavTabId, navigationService } from '../../services/navigation.service';
import { UserRole } from '../../types/common';
import { useI18n } from '../../i18n';

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

  return (
    <div className="max-w-3xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-sm text-right" dir={direction}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              403 • ACCESS RESTRICTED
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs font-mono text-stone-500">{requestedTab}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-stone-900 mb-2">
            غير مصرح بالوصول لهذا القسم (Role Guard Enforced)
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
            وفقاً لقواعد الحوكمة وسياسات الأمان المعتمدة في النظام، فإن الدور النشط حالياً{' '}
            <strong className="text-stone-900 font-bold font-mono">({currentRole})</strong>{' '}
            لا يملك صلاحية استعراض أو تنفيذ عمليات ضمن وحدة ({requestedTab}).
          </p>

          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 mb-6 space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-700">
              <span>المستخدم النشط:</span>
              <strong className="text-stone-900">{roleProfile.userNameAr}</strong>
            </div>
            <div className="flex items-center justify-between text-stone-700">
              <span>الصلاحية الحالية:</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${roleProfile.badgeColor}`}>
                {roleProfile.titleAr}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-700">
              <span>نطاق المشاريع المصرحة:</span>
              <span className="font-mono text-[11px] bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-bold">
                {roleProfile.assignedProjectIds.join(', ')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRedirectToDefault}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2"
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
