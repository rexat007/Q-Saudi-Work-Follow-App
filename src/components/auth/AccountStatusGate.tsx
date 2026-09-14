import React from 'react';
import { useAuth } from '../../firebase/authContext';
import { ShieldAlert, Clock, XCircle, AlertTriangle, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ShieldCheck, Lock } from 'lucide-react';

interface AccountStatusGateProps {
  status: 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | string;
  userEmail?: string;
  userName?: string;
  onRefresh?: () => void;
}

export const AccountStatusGate: React.FC<AccountStatusGateProps> = ({
  status,
  userEmail,
  userName,
  onRefresh,
}) => {
  const { signOutUser } = useAuth();

  const getStatusDetails = () => {
    switch (status) {
      case 'REJECTED':
        return {
          title: 'تم رفض طلب إنشاء الحساب',
          titleEn: 'Account Request Rejected',
          description: 'نعتذر، لم يتم قبول طلب الانضمام للنظام. إذا كنت تعتقد أن هذا حدث عن طريق الخطأ، يُرجى التواصل مع إدارة العمليات لتقديم طلب مراجعة.',
          icon: <XCircle className="w-12 h-12 text-rose-500" />,
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          badgeText: 'مرفوض // REJECTED',
        };
      case 'SUSPENDED':
        return {
          title: 'الحساب معلق مؤقتاً',
          titleEn: 'Account Suspended',
          description: 'تم تعليق الصلاحيات التشغيلية لهذا الحساب بقرار إداري. يُرجى مراجعة مسؤول النظام للتحقق من أسباب التعليق وإعادة التفعيل.',
          icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          badgeText: 'معلق // SUSPENDED',
        };
      case 'PENDING_APPROVAL':
      default:
        return {
          title: 'طلب الحساب قيد المراجعة والاعتماد',
          titleEn: 'Account Pending Approval',
          description: 'تم تسجيل بيانات حسابك بنجاح عبر Google Auth. حسابك حالياً بحالة الانتظار ولن تتمكن من الوصول إلى الشاشات التشغيلية والمشاريع حتى يتم اعتماد طلبك وتعيين الدور الوظيفي من قبل مسؤول النظام (SUPER_ADMIN / PROJECT_ADMIN).',
          icon: <Clock className="w-12 h-12 text-blue-400 animate-pulse" />,
          badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          badgeText: 'قيد الاعتماد // PENDING_APPROVAL',
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f8fafc] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-sm font-mono font-bold text-[#f8fafc] tracking-wider uppercase">
              كيو لخدمات النقل واللوجستيات // Q-SAUDI WORK FOLLOW
            </h1>
            <p className="text-xs text-white/40 font-mono">
              بوابة الاعتماد الأمني وحماية البيانات التشغيلية
            </p>
          </div>
        </div>

        <button
          onClick={() => signOutUser()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-mono transition-all"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>تسجيل الخروج</span>
        </button>
      </header>

      {/* Main Gate Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-[#15181e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Status Header Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              {details.icon}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${details.badgeBg}`}>
              {details.badgeText}
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {details.title}
            </h2>
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              {details.titleEn}
            </p>
          </div>

          {/* Account Details Box */}
          <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-white/60">
              <span>البريد الإلكتروني / Email:</span>
              <strong className="text-[#10b981]">{userEmail || 'غير محدد'}</strong>
            </div>
            {userName && (
              <div className="flex justify-between items-center text-white/60">
                <span>اسم المستخدم / Name:</span>
                <span className="text-white/90">{userName}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-white/60 border-t border-white/5 pt-2 mt-2">
              <span>حالة المصادقة / Auth Engine:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Google Auth Verified
              </span>
            </div>
          </div>

          {/* Description Text */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200/90 leading-relaxed">
            {details.description}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] text-[#0f1115] font-bold text-xs hover:bg-[#10b981]/90 transition-all shadow-lg shadow-[#10b981]/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحقق من حالة الحساب</span>
              </button>
            )}
            
            <button
              onClick={() => signOutUser()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs transition-all"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full border-t border-white/10 pt-4 text-center text-xs font-mono text-white/30">
        Q-Saudi Work Follow // Server-Authoritative Identity & Access Governance System
      </footer>
    </div>
  );
};
