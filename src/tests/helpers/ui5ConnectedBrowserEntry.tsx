import React from 'react';import {createRoot} from 'react-dom/client';
import App from '../../App';import {AuthProvider} from '../../firebase/authContext';import {I18nProvider} from '../../i18n';import {auth,db} from '../../firebase/config';
import {connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';import {connectFirestoreEmulator} from 'firebase/firestore';
connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8085);
(window as any).ui5Connected={login:(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password),logout:()=>signOut(auth),token:()=>auth.currentUser!.getIdToken(),uid:()=>auth.currentUser?.uid};
createRoot(document.getElementById('root')!).render(<I18nProvider initialLocale="ar"><AuthProvider><App/></AuthProvider></I18nProvider>);
