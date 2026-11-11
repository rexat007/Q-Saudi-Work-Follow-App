import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../../App';
import {AuthProvider} from '../../firebase/authContext';
import {I18nProvider} from '../../i18n';
import {auth,db} from '../../firebase/config';
import {connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {connectFirestoreEmulator,doc,setDoc} from 'firebase/firestore';
import {outboxService} from '../../services/offline/outbox.service';
import {indexedDBService} from '../../services/offline/indexedDB.service';
import {tripRepository} from '../../repositories/trip.repository';
import {sendTripCommand} from '../../services/tripCommandClient.service';
connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
connectFirestoreEmulator(db,'127.0.0.1',8085);
(window as any).c2={login:(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password),logout:()=>signOut(auth),principal:()=>auth.currentUser?.uid,
  queue:(projectId:string,payload:any)=>outboxService.queueOperation({projectId,userId:auth.currentUser!.uid,operationType:'CREATE_TRIP_LOADING',payload}),
  cache:indexedDBService,
  write:(path:string,value:any)=>setDoc(doc(db,path),value),
  queueIntent:(projectId:string,operationType:any,payload:any,dependsOnOperationId?:string)=>outboxService.queueOperation({projectId,userId:auth.currentUser!.uid,operationType,payload,dependsOnOperationId}),
  operations:()=>outboxService.getOperations(),sync:()=>outboxService.syncAll(),readAll:(projectId:string)=>tripRepository.listCompleteByProject(projectId),send:sendTripCommand};
createRoot(document.getElementById('root')!).render(<I18nProvider initialLocale="ar"><AuthProvider><App/></AuthProvider></I18nProvider>);
