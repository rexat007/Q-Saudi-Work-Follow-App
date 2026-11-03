// @vitest-environment happy-dom
import React,{act,useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
import {ProfileContinuity} from '../components/auth/ProfileContinuity';
vi.mock('../i18n',()=>({useI18n:()=>({t:(k:string)=>k,direction:'rtl'})}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
it('preserves the mounted import and its local stage behind topmost authority ownership, then releases it',async()=>{
 let mounts=0,unmounts=0;function Journey(){const [stage,setStage]=useState('DRIVER_TRUCK_RESOLUTION');useEffect(()=>{mounts++;return()=>{unmounts++;}},[]);return <button id="roster" onClick={()=>setStage('FINAL_REVIEW')}>{stage}</button>;}
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host),retry=vi.fn(async()=>{});
 const show=(blocked:boolean)=><ProfileContinuity blocked={blocked} onRetry={retry}><Journey/></ProfileContinuity>;
 try{await act(async()=>root.render(show(false)));await act(async()=>root.render(show(true)));
  expect(mounts).toBe(1);expect(unmounts).toBe(0);expect(host.inert).toBe(true);expect(document.querySelector('[data-import-overlay="AUTHORITY"]')).not.toBeNull();
  await act(async()=>document.querySelector<HTMLButtonElement>('#roster')!.click());expect(host.textContent).toBe('DRIVER_TRUCK_RESOLUTION');expect(document.body.textContent).not.toContain('NO_PROFILE');
  await act(async()=>root.render(show(false)));expect(host.inert).toBe(false);await act(async()=>document.querySelector<HTMLButtonElement>('#roster')!.click());expect(host.textContent).toBe('FINAL_REVIEW');expect(mounts).toBe(1);
 }finally{await act(async()=>root.unmount());host.remove();}
});
