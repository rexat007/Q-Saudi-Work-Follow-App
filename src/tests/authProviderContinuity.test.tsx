// @vitest-environment happy-dom
import React,{act,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
const fx=vi.hoisted(()=>({change:undefined as any,watch:undefined as any,fail:undefined as any,read:vi.fn(),terminate:vi.fn(),uid:'u'}));
vi.mock('../firebase/config',()=>({auth:{},db:{}}));
vi.mock('firebase/auth',()=>({GoogleAuthProvider:class{},signInWithPopup:vi.fn(),signOut:fx.terminate,onIdTokenChanged:(_a:any,change:any)=>{fx.change=change;return vi.fn();}}));
vi.mock('firebase/firestore',()=>({doc:()=>({}),getDocFromServer:fx.read,onSnapshot:(_d:any,_o:any,next:any,fail:any)=>{fx.watch=next;fx.fail=fail;return vi.fn();}}));
vi.mock('../i18n',()=>({useI18n:()=>({t:(k:string)=>k,direction:'ltr'})}));
import {AuthProvider,useAuth} from '../firebase/authContext';
import {ProfileContinuity} from '../components/auth/ProfileContinuity';
const profile={userId:'u',fullName:'Fixture',email:'fixture@example.invalid',role:'PROJECT_ADMIN',assignedProjectIds:['P1'],status:'ACTIVE',isActive:true};
const snapshot=(value:any,fromCache=false)=>({exists:()=>value!==null,data:()=>value,metadata:{fromCache}});
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
it('actual Provider ignores cached absence, preserves mounted workflow on read/watch failure and refreshes on reconnect',async()=>{
 let state:any,mounts=0;function Journey(){useEffect(()=>{mounts++;},[]);return <span id="durable-session">S1</span>;}
 function Probe(){state=useAuth();if(state.profileAuthority==='ABSENT_CONFIRMED')return <p>ACCOUNT_REQUEST</p>;return <ProfileContinuity blocked={state.profileAuthority!=='AVAILABLE'} onRetry={state.refreshUserProfile}>{state.userProfile?.status==='ACTIVE'&&<Journey/>}</ProfileContinuity>;}
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);fx.read.mockResolvedValue(snapshot(profile));
 try{
  await act(async()=>root.render(<AuthProvider><Probe/></AuthProvider>));await act(async()=>fx.change({uid:'u',getIdToken:async()=>'fixture-token'}));expect(mounts).toBe(1);expect(state.profileAuthority).toBe('AVAILABLE');
  await act(async()=>fx.watch(snapshot(null,true)));expect(state.profileAuthority).toBe('UNAVAILABLE_TRANSIENT');expect(state.userProfile.userId).toBe('u');expect(document.body.textContent).not.toContain('ACCOUNT_REQUEST');
  await act(async()=>fx.watch({...snapshot({...profile,role:'SUPER_ADMIN'},false),metadata:{fromCache:false,hasPendingWrites:true}}));expect(state.profileAuthority).toBe('UNAVAILABLE_TRANSIENT');expect(state.userProfile.role).toBe('PROJECT_ADMIN');
  await act(async()=>fx.watch(snapshot(profile,false)));expect(state.profileAuthority).toBe('AVAILABLE');
  fx.read.mockRejectedValueOnce(Error('offline'));await act(async()=>state.refreshUserProfile());expect(state.profileAuthority).toBe('UNAVAILABLE_TRANSIENT');expect(mounts).toBe(1);expect(document.querySelector('#durable-session')?.textContent).toBe('S1');
  await act(async()=>window.dispatchEvent(new Event('online')));expect(state.profileAuthority).toBe('AVAILABLE');expect(mounts).toBe(1);expect(fx.read).toHaveBeenCalledTimes(3);
  await act(async()=>fx.watch(snapshot({...profile,status:'SUSPENDED'},false)));expect(document.querySelector('#durable-session')).toBeNull();
 }finally{await act(async()=>root.unmount());host.remove();}
});
