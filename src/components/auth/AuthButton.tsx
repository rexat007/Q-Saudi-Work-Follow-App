import React from 'react';
import { LogOut, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../firebase/authContext';
import { useI18n } from '../../i18n';


export function AuthButton() {
  const { t } = useI18n();
  const { user, isAuthReady, signInWithGoogle, signOutUser, authError, clearAuthError } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-500 text-xs font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
        <span>{t("authentication.labels.txt_49cb21")}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {authError && (
        <div className="absolute top-full mt-2 end-0 z-50 bg-rose-50 border border-rose-200 text-rose-900 text-xs p-3 rounded-xl shadow-xl flex items-start gap-2.5 w-72 sm:w-80 max-w-[90vw]">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <p className="font-semibold text-rose-800 mb-0.5">تنبيه المصادقة</p>
            <p className="text-rose-700">{authError}</p>
          </div>
          <button
            onClick={clearAuthError}
            className="text-rose-400 hover:text-rose-700 font-bold p-0.5 rounded transition-colors"
            title="إغلاق التنبيه"
          >
            ×
          </button>
        </div>
      )}

      {user ? (
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1 text-xs">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="hidden sm:flex flex-col text-right">
            <span className="font-semibold text-stone-900 leading-tight">
              {user.displayName || user.email?.split('@')[0] || 'مستخدم مسجل'}
            </span>
            <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              {t("authentication.labels.txt_3548e6")}</span>
          </div>

          <button
            id="auth-sign-out-btn"
            onClick={signOutUser}
            title={t("authentication.labels.txt_b1a849")}
            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mr-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          id="auth-sign-in-btn"
          onClick={signInWithGoogle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all"
        >
          {/* Google G SVG */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{t("authentication.labels.txt_413ffd")}</span>
        </button>
      )}
    </div>
  );
}
