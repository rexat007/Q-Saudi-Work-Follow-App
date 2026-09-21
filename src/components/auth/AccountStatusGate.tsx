import React, { useState } from 'react';
import { useAuth } from '../../firebase/authContext';
import { useI18n } from '../../i18n';
import { userRepository } from '../../repositories/user.repository';
import { UserEntity } from '../../types/entities';
import { 
  ShieldAlert, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Briefcase, 
  FileText,
  Check
} from 'lucide-react';

interface AccountStatusGateProps {
  status: 'UNAUTHENTICATED' | 'NO_PROFILE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | string;
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
  const { signOutUser, signInWithGoogle, user, authError, clearAuthError } = useAuth();
  const { direction, t } = useI18n();
  const isRTL = direction === 'rtl';

  // Form states for first-time account request (NO_PROFILE)
  const [fullName, setFullName] = useState<string>(user?.displayName || '');
  const [requestedRole, setRequestedRole] = useState<string>('VIEWER');
  const [requestReason, setRequestReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // First-Admin Bootstrap states
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [bootstrapSuccess, setBootstrapSuccess] = useState<boolean>(false);
  const { idToken } = useAuth();

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    setFormError(null);
    try {
      const response = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشلت عملية تهيئة النظام.');
      }
      setBootstrapSuccess(true);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Bootstrap error:', err);
      setFormError(err.message || 'حدث خطأ أثناء الاتصال بالخادم لتهيئة النظام.');
    } finally {
      setIsBootstrapping(false);
    }
  };

  // Sign in error state handling
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    clearAuthError?.();
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim()) {
      setFormError(isRTL ? 'يُرجى إدخال الاسم الكامل.' : 'Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const pendingProfile: UserEntity = {
        userId: user.uid,
        email: user.email || '',
        fullName: fullName.trim(),
        role: 'VIEWER', // default role
        requestedRole: requestedRole as any,
        requestReason: requestReason.trim(),
        assignedProjectIds: [],
        status: 'PENDING_APPROVAL',
        isActive: false,
        createdAt: new Date().toISOString() as any,
        createdBy: user.uid,
        updatedAt: new Date().toISOString() as any,
        updatedBy: user.uid,
      };

      await userRepository.create(pendingProfile);
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Error submitting account request:', err);
      setFormError(isRTL ? 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.' : 'An error occurred while submitting the request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. UNAUTHENTICATED: Dedicated Authentication Gateway
  if (status === 'UNAUTHENTICATED') {
    return (
      <div className="min-h-screen bg-[#0f1115] text-[#f8fafc] flex flex-col justify-between p-4 sm:p-6 font-sans select-none" dir={direction}>
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
        </header>

        <main className="max-w-md mx-auto w-full my-auto py-8">
          <div className="bg-[#15181e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#10b981]/10 text-[#10b981] flex items-center justify-center rounded-2xl border border-[#10b981]/20 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                {isRTL ? 'بوابة التحقق التشغيلية' : 'Operational Authentication Gateway'}
              </h2>
              <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                Identity & Governance System
              </p>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200/90 leading-relaxed space-y-2">
              <p className="font-bold">
                {isRTL ? 'إشعار أمني مهم:' : 'Important Security Notice:'}
              </p>
              <p>
                {isRTL 
                  ? 'هذا النظام مخصص حصرياً للموظفين المصرح لهم والناقلين المعتمدين في مشاريع شركة كيو. يتم رصد وتوثيق كافة محاولات الدخول بشكل صارم.'
                  : 'This system is exclusively restricted to authorized personnel and approved carriers. All login attempts are recorded and monitored.'}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl font-medium leading-relaxed">
                {authError}
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-[#10b981] hover:bg-[#10b981]/90 active:scale-[0.98] text-[#0f1115] font-bold text-sm transition-all shadow-lg shadow-[#10b981]/20 min-h-[44px] cursor-pointer"
            >
              {isSigningIn ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.111 4.113-3.414 0-6.177-2.763-6.177-6.177s2.763-6.177 6.177-6.177c1.554 0 2.964.576 4.05 1.526l3.177-3.177C19.346 1.996 16.035 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.887 0 12.24-5.48 12.24-12.24 0-.823-.082-1.646-.247-2.455H12.24z"/>
                </svg>
              )}
              <span>{isSigningIn ? (isRTL ? 'جاري الاتصال بـ Google...' : 'Connecting to Google...') : (isRTL ? 'تسجيل الدخول باستخدام Google' : 'Sign In with Google')}</span>
            </button>
          </div>
        </main>

        <footer className="max-w-4xl mx-auto w-full border-t border-white/10 pt-4 text-center text-xs font-mono text-white/30">
          Q-Saudi Work Follow // Server-Authoritative Identity & Access Governance System
        </footer>
      </div>
    );
  }

  // 2. NO_PROFILE: Account Request Experience
  if (status === 'NO_PROFILE') {
    return (
      <div className="min-h-screen bg-[#0f1115] text-[#f8fafc] flex flex-col justify-between p-4 sm:p-6 font-sans" dir={direction}>
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center">
              <User className="w-5 h-5 text-[#10b981]" />
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white border border-white/10 text-xs font-mono transition-all min-h-[44px] cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </header>

        <main className="max-w-lg mx-auto w-full my-auto py-6">
          <div className="bg-[#15181e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                {isRTL ? 'مستخدم جديد غير مسجل' : 'NEW UNREGISTERED USER'}
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {isRTL ? 'تقديم طلب تفعيل حساب جديد' : 'Submit New Account Request'}
              </h2>
              <p className="text-xs text-stone-400">
                {isRTL ? 'يُرجى ملء البيانات التالية لتقديمها للمراجعة والاعتماد' : 'Please provide the details below for operational review'}
              </p>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-300 font-semibold text-center leading-relaxed">
              ⚠️ {isRTL ? 'المصادقة بمفردها لا تمنح صلاحية الوصول التلقائي للنظام.' : 'Authentication alone does not grant application access.'}
            </div>

            {/* Owner Bootstrap Panel */}
            {userEmail?.toLowerCase() === 'saudiali044@gmail.com' && (
              <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#10b981]/10 rounded-lg border border-[#10b981]/30">
                    <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isRTL ? 'بوابة تهيئة النظام الرئيسية (Bootstrap)' : 'Canonical System Owner Setup'}
                    </h3>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {isRTL ? 'تم رصد بريدك الإلكتروني كمالك معين للنظام.' : 'Detected authorized initial owner identity.'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {isRTL 
                    ? 'يمكنك الآن تفعيل حساب المالك الرئيسي كـ (SUPER_ADMIN) بخطوة واحدة آمنة ومشروطة بخلية مستخدمين فارغة.'
                    : 'You can now bootstrap the primary administrative account as SUPER_ADMIN. This operation is authoritative and only allowed when the system has zero accounts.'}
                </p>

                {bootstrapSuccess ? (
                  <div className="flex items-center gap-2 text-[#10b981] font-bold text-xs bg-[#10b981]/10 p-3 rounded-lg border border-[#10b981]/25">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRTL ? 'تمت تهيئة حساب المالك بنجاح! جاري تحميل شاشات الإدارة...' : 'System bootstrapped successfully! Redirecting...'}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBootstrap}
                    disabled={isBootstrapping}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#10b981]/90 active:scale-[0.98] text-[#0f1115] font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBootstrapping ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{isBootstrapping ? (isRTL ? 'جاري تهيئة الحساب...' : 'Bootstrapping Account...') : (isRTL ? 'تهيئة وتفعيل حساب SUPER_ADMIN' : 'Bootstrap SUPER_ADMIN Profile')}</span>
                  </button>
                )}
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
              {/* Google Email (Read Only) */}
              <div>
                <label className="block text-stone-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {isRTL ? 'البريد الإلكتروني المرتبط بـ Google (معرّف آمن)' : 'Authenticated Google Email'}
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={userEmail || ''}
                  className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-500 font-mono focus:outline-hidden cursor-not-allowed select-none"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-stone-300 mb-1.5 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#10b981]" />
                  {isRTL ? 'الاسم الكامل الثلاثي للمستخدم' : 'Full Three-Part Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isRTL ? 'أدخل اسمك بالكامل' : 'Enter your full name'}
                  className="w-full px-3.5 py-2.5 bg-stone-900 text-white placeholder-stone-600 border border-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl focus:outline-hidden transition-all text-xs"
                />
              </div>

              {/* Requested Role */}
              <div>
                <label className="block text-stone-300 mb-1.5 font-bold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#10b981]" />
                  {isRTL ? 'الدور الوظيفي المطلوب للوصول' : 'Requested System Role'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-900 text-white border border-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl focus:outline-hidden transition-all text-xs cursor-pointer"
                >
                  <option value="VIEWER">{isRTL ? 'مشاهد عام فقط (VIEWER)' : 'General Viewer (VIEWER)'}</option>
                  <option value="DRIVER">{isRTL ? 'سائق شاحنة ميداني (DRIVER)' : 'Field Truck Driver (DRIVER)'}</option>
                  <option value="SCALE_OPERATOR">{isRTL ? 'مشغل ميزان البوابة (SCALE_OPERATOR)' : 'Weighbridge Operator (SCALE_OPERATOR)'}</option>
                  <option value="DISPATCHER">{isRTL ? 'منسق رحلات وتشغيل (DISPATCHER)' : 'Operations Dispatcher (DISPATCHER)'}</option>
                  <option value="SITE_SUPERVISOR">{isRTL ? 'مشرف موقع تفريغ واستلام (SITE_SUPERVISOR)' : 'Unloading Site Supervisor (SITE_SUPERVISOR)'}</option>
                  <option value="SUPERVISOR">{isRTL ? 'مشرف عمليات ميداني عام (SUPERVISOR)' : 'Field Supervisor (SUPERVISOR)'}</option>
                  <option value="FINANCE_AUDITOR">{isRTL ? 'مدقق ومراجع مالي وعقود (FINANCE_AUDITOR)' : 'Finance & Audit Controller (FINANCE_AUDITOR)'}</option>
                  <option value="PROJECT_ADMIN">{isRTL ? 'مدير المشروع المشرف (PROJECT_ADMIN)' : 'Authorized Project Administrator (PROJECT_ADMIN)'}</option>
                </select>
              </div>

              {/* Reason for Request */}
              <div>
                <label className="block text-stone-300 mb-1.5 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#10b981]" />
                  {isRTL ? 'سبب تقديم الطلب / نطاق العمل المقترح' : 'Reason for Request / Proposed Scope'}
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={3}
                  placeholder={isRTL ? 'مثال: مهندس موقع بمشروع نيوم لتسجيل موازين الشحنات اليومية' : 'Example: Unloading site inspector assigned to record weighments at Neom'}
                  className="w-full px-3.5 py-2.5 bg-stone-900 text-white placeholder-stone-600 border border-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl focus:outline-hidden transition-all text-xs resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10b981] hover:bg-[#10b981]/90 active:scale-[0.98] text-[#0f1115] font-bold transition-all shadow-lg shadow-[#10b981]/15 min-h-[44px] cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? (isRTL ? 'جاري إرسال الطلب...' : 'Submitting Request...') : (isRTL ? 'تقديم طلب الحساب' : 'Submit Registration')}</span>
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="max-w-4xl mx-auto w-full border-t border-white/10 pt-4 text-center text-xs font-mono text-white/30">
          Q-Saudi Work Follow // Server-Authoritative Identity & Access Governance System
        </footer>
      </div>
    );
  }

  // 3-5. Gated screens: PENDING_APPROVAL, REJECTED, SUSPENDED
  const getStatusDetails = () => {
    const profile = userRepository; // dummy ref
    switch (status) {
      case 'REJECTED':
        return {
          title: 'تم رفض طلب إنشاء الحساب',
          titleEn: 'Account Request Rejected',
          description: 'نعتذر، لم يتم قبول طلب الانضمام للنظام. يرجى مراجعة السبب الموضح أدناه، أو التواصل مع إدارة العمليات لتقديم طلب مراجعة.',
          icon: <XCircle className="w-12 h-12 text-rose-500" />,
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          badgeText: 'مرفوض // REJECTED',
          showRejectionReason: true
        };
      case 'SUSPENDED':
        return {
          title: 'الحساب معلق مؤقتاً',
          titleEn: 'Account Suspended',
          description: 'تم تعليق الصلاحيات التشغيلية لهذا الحساب بقرار إداري. يُرجى مراجعة مسؤول النظام للتحقق من أسباب التعليق وإعادة التفعيل.',
          icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          badgeText: 'معلق // SUSPENDED',
          showRejectionReason: false
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
          showRejectionReason: false
        };
    }
  };

  const details = getStatusDetails();
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f8fafc] flex flex-col justify-between p-4 sm:p-6 font-sans" dir={direction}>
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white border border-white/10 text-xs font-mono transition-all min-h-[44px] cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
        </button>
      </header>

      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-[#15181e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
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

          <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-white/60">
              <span>{isRTL ? 'البريد الإلكتروني:' : 'Email Address:'}</span>
              <strong className="text-[#10b981]">{userEmail || 'غير محدد'}</strong>
            </div>
            {userName && (
              <div className="flex justify-between items-center text-white/60">
                <span>{isRTL ? 'اسم المستخدم:' : 'User Display Name:'}</span>
                <span className="text-white/90">{userName}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-white/60 border-t border-white/5 pt-2 mt-2">
              <span>{isRTL ? 'حالة المصادقة:' : 'Auth Provider Status:'}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Google Auth Verified
              </span>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200/90 leading-relaxed">
            {details.description}
          </div>

          {/* Render rejection reason if applicable */}
          {details.showRejectionReason && userProfile?.rejectionReason && (
            <div className="bg-rose-500/5 border border-rose-500/25 rounded-xl p-4 text-xs text-rose-300 leading-relaxed space-y-1">
              <span className="font-bold block text-rose-400">🛑 {isRTL ? 'سبب الرفض المحدّد من قِبل مسؤول النظام:' : 'System Rejection Reason:'}</span>
              <p className="font-mono bg-stone-950/50 p-2.5 rounded border border-rose-500/10 mt-1">
                {userProfile.rejectionReason}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#10b981]/90 active:scale-[0.98] text-[#0f1115] font-bold text-xs transition-all shadow-lg shadow-[#10b981]/20 min-h-[44px] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isRTL ? 'إعادة التحقق من حالة الاعتماد' : 'Check Approval Status'}</span>
              </button>
            )}
            
            <button
              onClick={() => signOutUser()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 text-white/80 font-bold text-xs transition-all min-h-[44px] cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-white/10 pt-4 text-center text-xs font-mono text-white/30">
        Q-Saudi Work Follow // Server-Authoritative Identity & Access Governance System
      </footer>
    </div>
  );
};
