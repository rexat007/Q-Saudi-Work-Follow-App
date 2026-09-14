import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from './config';
import { UserEntity } from '../types/entities';
import { userRepository } from '../repositories/user.repository';

export interface AuthContextType {
  user: User | null;
  userProfile: UserEntity | null;
  idToken: string | null;
  isAuthReady: boolean;
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
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchOrCreateProfile = async (currentUser: User) => {
    try {
      const token = await currentUser.getIdToken();
      setIdToken(token);
    } catch (e) {
      console.warn('[AuthProvider] Failed to fetch ID token:', e);
    }

    try {
      let profile = await userRepository.findById(currentUser.uid);
      if (!profile) {
        // First-time sign-in: create PENDING_APPROVAL request
        const pendingProfile: UserEntity = {
          userId: currentUser.uid,
          email: currentUser.email || '',
          fullName: currentUser.displayName || 'مستخدم جديد',
          role: 'VIEWER',
          requestedRole: 'DISPATCHER',
          assignedProjectIds: [],
          status: 'PENDING_APPROVAL',
          isActive: false,
          createdAt: new Date().toISOString() as any,
          createdBy: currentUser.uid,
          updatedAt: new Date().toISOString() as any,
          updatedBy: currentUser.uid,
        };
        await userRepository.create(pendingProfile);
        setUserProfile(pendingProfile);
      } else {
        // If status is missing on legacy record, default to PENDING_APPROVAL unless active
        if (!profile.status) {
          profile = {
            ...profile,
            status: profile.isActive ? 'ACTIVE' : 'PENDING_APPROVAL',
          };
        }
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('[AuthProvider] Failed to fetch/create user profile:', err);
      // Fallback pending profile
      setUserProfile({
        userId: currentUser.uid,
        email: currentUser.email || '',
        fullName: currentUser.displayName || 'مستخدم جديد',
        role: 'VIEWER',
        assignedProjectIds: [],
        status: 'PENDING_APPROVAL',
        isActive: false,
        createdAt: new Date().toISOString() as any,
        createdBy: currentUser.uid,
        updatedAt: new Date().toISOString() as any,
        updatedBy: currentUser.uid,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          await fetchOrCreateProfile(currentUser);
        } else {
          setUserProfile(null);
          setIdToken(null);
        }
        setIsAuthReady(true);
      },
      (error) => {
        console.error('Firebase Auth state error:', error);
        setAuthError(error.message);
        setIsAuthReady(true);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await fetchOrCreateProfile(cred.user);
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
