import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onIdTokenChanged,
  User 
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, onSnapshot } from 'firebase/firestore';
import { createAuthSession } from './authSession';
import { validateAccountProfile } from '../utils/principal';
import { UserEntity } from '../types/entities';
import { userRepository } from '../repositories/user.repository';

export interface AuthContextType {
  user: User | null;
  userProfile: UserEntity | null;
  idToken: string | null;
  isAuthReady: boolean;
  isProfileLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  setUserProfileOverride?: (profile: UserEntity | null) => void;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserEntity | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const session = useRef<ReturnType<typeof createAuthSession<User>> | null>(null);
  const normalizeProfile = (raw: UserEntity | null, uid: string): UserEntity | null => {
    if (!raw) return null;
    const account = validateAccountProfile(raw, uid);
    if (account.isActive === false && account.status === 'ACTIVE') throw new Error('ACCOUNT_NOT_ACTIVE');
    return { ...raw, userId: uid, status: account.status };
  };

  useEffect(() => {
    const controller = createAuthSession<User>({
      user: setUser, profile: setUserProfile, token: setIdToken,
      loading: setIsProfileLoading, ready: () => setIsAuthReady(true), error: setAuthError,
    }, {
      load: async current => normalizeProfile(await userRepository.findById(current.uid), current.uid),
      watch: (current, receive, fail) => onSnapshot(doc(db, 'users', current.uid), snapshot => {
        try { receive(normalizeProfile(snapshot.exists() ? snapshot.data() as UserEntity : null, current.uid)); }
        catch { fail(); }
      }, fail),
      terminate: () => signOut(auth),
    });
    session.current = controller;
    const unsubscribe = onIdTokenChanged(auth, current => { void controller.change(current); }, () => {
      controller.clear(); setAuthError('AUTH_REFRESH_FAILED'); setIsAuthReady(true);
    });
    return () => { unsubscribe(); controller.dispose(); session.current = null; };
  }, []);

  const refreshUserProfile = async () => { await session.current?.refresh(); };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await session.current?.change(cred.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Friendly message for specific error codes
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('تم حظر النافذة المنبثقة من قِبل المتصفح. يُرجى السماح بالنوافذ المنبثقة.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'النطاق الحالي';
        setAuthError(`نطاق التطبيق (${hostname}) غير مدرج في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يمكنك إضافته عبر: Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('تم إلغاء طلب تسجيل الدخول.');
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError('تعذر الاتصال بخدمة المصادقة. يرجى التحقق من اتصالك بالإنترنت.');
      } else {
        setAuthError(err.message || 'فشل تسجيل الدخول عبر Google.');
      }
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    session.current?.clear();
    try {
      await signOut(auth);
      setUserProfile(null);
      setIdToken(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setAuthError(err.message || 'فشل تسجيل الخروج.');
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        idToken,
        isAuthReady,
        isProfileLoading,
        signInWithGoogle,
        signOutUser,
        refreshUserProfile,
        setUserProfileOverride: setUserProfile,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
