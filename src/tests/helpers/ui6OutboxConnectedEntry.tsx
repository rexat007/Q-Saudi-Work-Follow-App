import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AuthProvider,useAuth} from '../../firebase/authContext';
import {auth,db} from '../../firebase/config';
import {connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {connectFirestoreEmulator} from 'firebase/firestore';
import {I18nProvider} from '../../i18n';
import {OutboxDrawer} from '../../components/offline/OutboxDrawer';
import {outboxService} from '../../services/offline/outbox.service';
connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
connectFirestoreEmulator(db,'127.0.0.1',8085);
(window as any).ui6Connected={login:(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password),logout:()=>signOut(auth),queue:async(projectId:string,operationId='emulator-original-arrival',status='AT_DESTINATION')=>outboxService.queueOperation({operationId,projectId,userId:auth.currentUser!.uid,operationType:'UPDATE_TRIP_STATUS',payload:{tripId:'OWNED-TRIP',status}})};
function Harness(){const c=useAuth(),[open,setOpen]=useState(false);return <><p data-actor={c.user?.uid||''} data-role={c.userProfile?.role}>{c.profileAuthority}</p><button id="open" onClick={()=>setOpen(true)}>Open Outbox</button><OutboxDrawer isOpen={open} onClose={()=>setOpen(false)}/></>}
createRoot(document.getElementById('root')!).render(<I18nProvider initialLocale="en"><AuthProvider><Harness/></AuthProvider></I18nProvider>);
