import {useRuntimeComposition} from '../runtime/RuntimeCompositionProvider';
import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onIdTokenChanged,
  User 
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { createAuthSession, type ProfileAuthority } from './authSession';
import { validateAccountProfile } from '../utils/principal';
import { UserEntity } from '../types/entities';
import { decodeUser } from '../utils/persistenceBoundary';

export interface AuthContextType {
  user: User | null;
  userProfile: UserEntity | null;
  profileAuthority?: ProfileAuthority;
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

export function AuthProvider({children}:{children:ReactNode}){
 const runtime=useRuntimeComposition();
 return runtime?.ui?<SqlIdentityAuthProvider runtime={runtime}>{children}</SqlIdentityAuthProvider>:<LegacyAuthProvider>{children}</LegacyAuthProvider>;
}
function SqlIdentityAuthProvider({runtime,children}:{runtime:import('../services/runtimeClient.service').RuntimeClientComposition;children:ReactNode}){
 const identity=runtime.ui!.identity,[user,setUser]=useState<User|null>(()=>identity.current()),[error,setError]=useState<string|null>(null);
 useEffect(()=>identity.subscribe(()=>setUser(identity.current())),[identity]);
 const signOutUser=async()=>{runtime.ui!.client.invalidate();setUser(null);await Promise.all([runtime.coordinator.exit(),identity.signOut()]);};
 return <AuthContext.Provider value={{user,userProfile:null,profileAuthority:'LOADING',idToken:null,isAuthReady:true,isProfileLoading:false,signInWithGoogle:()=>identity.signIn(),signOutUser,refreshUserProfile:async()=>{},authError:error,clearAuthError:()=>setError(null)}}>{children}</AuthContext.Provider>;
}
function LegacyAuthProvider({ children }: { children: ReactNode }) {
  const runtime=useRuntimeComposition();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserEntity | null>(null);
  const [profileAuthority, setProfileAuthority] = useState<ProfileAuthority>('LOADING');
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
      authority: value=>{setProfileAuthority(value);window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:value}));}, user: setUser, profile: setUserProfile, token: setIdToken,
      loading: setIsProfileLoading, ready: () => setIsAuthReady(true), error: setAuthError,
    }, {
      load: async current => {
        if(runtime)return normalizeProfile(await runtime.profile(current.uid),current.uid);
        const snapshot=await getDocFromServer(doc(db,'users',current.uid));
        return normalizeProfile(snapshot.exists() ? decodeUser<UserEntity>(snapshot.data(),current.uid) : null,current.uid);
      },
      watch: () => () => {},
      terminate: () => signOut(auth),
    });
    session.current = controller;
    const unsubscribe = onIdTokenChanged(auth, current => { void controller.change(current); }, () => {
      controller.unavailable(); setAuthError('AUTH_REFRESH_FAILED'); setIsAuthReady(true);
    });
    const reconnect=()=>{void controller.refresh();}, offline=()=>controller.unavailable();
    window.addEventListener('online',reconnect);window.addEventListener('offline',offline);
    return () => { window.removeEventListener('online',reconnect);window.removeEventListener('offline',offline); unsubscribe(); controller.dispose(); session.current = null; };
  }, [runtime]);

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
        profileAuthority,
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
