// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {ImportMaterialSelection} from '../components/import/ImportMaterialSelection';
import {RosterBulkApproval} from '../components/import/RosterBulkApproval';
import {enTranslations} from '../locales/en';
import {arTranslations} from '../locales/ar';
import {urTranslations} from '../locales/ur';
const f=vi.hoisted(()=>({locale:'en'}));
const dictionaries:Record<string,typeof enTranslations>={en:enTranslations,ar:arTranslations,ur:urTranslations};
vi.mock('../i18n',()=>({useI18n:()=>({t:(key:string)=>dictionaries[f.locale][key]||key,direction:f.locale==='en'?'ltr':'rtl'})}));
vi.mock('../services/import/rosterBulkClient',()=>({discoverRosterIdentities:vi.fn()}));
vi.mock('../services/import/entityResolutionCommand.service',()=>({entityResolutionCommandService:{membership:vi.fn()}}));
let host:HTMLDivElement,root:Root;
const material:any={kind:'MATERIAL',id:'M1',name:'Wheat',globalStatus:'ACTIVE',membershipStatus:'ACTIVE',eligible:true};
const items:any[]=[{query:{kind:'TRUCK',key:'T1'},rows:[1],conflict:false,result:{state:'GLOBAL_ACTIVE_AND_PROJECT_READY'}}];
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;f.locale='en';host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
const render=async(ui:React.ReactNode)=>{host.dir=f.locale==='en'?'ltr':'rtl';await act(async()=>root.render(ui));};
function controls(){for(const control of host.querySelectorAll<HTMLElement>('button,input,select')){
  expect(control.className).toContain('focus-visible:ring-2');expect(control.className).toContain('disabled:text-stone-400');
  expect(control.className).toMatch(/bg-(?:stone|amber|emerald)-/);expect(control.className).toMatch(/text-stone-(?:100|950)/);
  expect(control.className).toContain('w-full');expect(control.closest('section')!.className).toContain('min-w-0');
}}
it.each(['ar','en','ur'])('%s Material text, heading, native controls and disabled action have explicit shared dark styling',async locale=>{
  f.locale=locale;const confirm=vi.fn(async()=>{});await render(<ImportMaterialSelection projectId="P1" materials={[material]} onConfirm={confirm} onCreate={vi.fn()} busy={false} isCurrent={()=>true}/>);
  expect(host.querySelector('section')!.className).toContain('bg-stone-950');expect(host.querySelector('section')!.className).toContain('text-stone-300');expect(host.querySelector('h3')!.className).toContain('text-white');
  expect(host.querySelector('h3')!.textContent).toBe(dictionaries[locale]['setup.material']);expect(host.querySelector('label')!.className).toContain('text-stone-300');
  expect(host.querySelector('input')!.className).toContain('placeholder:text-stone-400');for(const option of host.querySelectorAll('option'))expect(option.className).toContain('bg-stone-900');
  controls();const buttons=host.querySelectorAll('button');expect(buttons[0].className).toContain('bg-amber-400');expect(buttons[1].className).toContain('bg-stone-800');expect(buttons[1].disabled).toBe(true);
  host.querySelector('select')!.focus();expect(document.activeElement).toBe(host.querySelector('select'));expect(host.dir).toBe(locale==='en'?'ltr':'rtl');
  expect(confirm).not.toHaveBeenCalled();await act(async()=>buttons[0].click());expect(confirm).toHaveBeenCalledExactlyOnceWith('M1');
});
it.each(['ar','en','ur'])('%s Bulk heading, summary and action states are styled once for all stage callers',async locale=>{
  f.locale=locale;const approve=vi.fn(async()=>{});await render(<RosterBulkApproval items={items} onDiscover={vi.fn(async()=>{})} onApprove={approve} busy={false}/>);
  expect(host.querySelector('section')!.className).toContain('bg-stone-950');expect(host.querySelector('h3')!.className).toContain('text-white');expect(host.querySelector('p')!.className).toContain('text-stone-300');controls();
  const buttons=host.querySelectorAll('button');expect(buttons[1].className).toContain('bg-emerald-400');expect(buttons[1].className).toContain('hover:bg-emerald-300');buttons[1].focus();expect(document.activeElement).toBe(buttons[1]);await act(async()=>buttons[1].click());expect(approve).toHaveBeenCalledOnce();
});
it.each([360,768,1440])('shared controls expose wrapping/full-width layout contracts at %s without fixed-width or directional overrides',async width=>{
  vi.stubGlobal('innerWidth',width);await render(<><ImportMaterialSelection projectId="P1" materials={[material]} onConfirm={vi.fn(async()=>{})} onCreate={vi.fn()} busy={false} isCurrent={()=>true}/><RosterBulkApproval items={items} onDiscover={vi.fn(async()=>{})} onApprove={vi.fn(async()=>{})} busy={false}/></>);
  controls();for(const button of host.querySelectorAll('button')){expect(button.className).toContain('sm:w-auto');expect(button.className).toContain('break-words');expect(button.className).not.toMatch(/(?:ml|mr|left|right)-/);}vi.unstubAllGlobals();
});
it('Material pending/error feedback stays readable and retry invokes the same callback',async()=>{
  let reject!:(error:Error)=>void;const confirm=vi.fn(()=>new Promise<void>((_,r)=>reject=r));await render(<ImportMaterialSelection projectId="P1" materials={[material]} onConfirm={confirm} onCreate={vi.fn()} busy={false} isCurrent={()=>true}/>);
  await act(async()=>host.querySelector('button')!.click());expect(host.querySelector('[role=status]')!.className).toContain('text-amber-300');expect(host.querySelector('select')!.disabled).toBe(true);
  await act(async()=>reject(Error('CONTEXT_UNAVAILABLE')));expect(host.querySelector('[role=alert]')!.className).toContain('text-rose-300');expect(host.querySelector('[role=alert]')!.textContent).toBe(enTranslations['import.resolution.context']);expect(host.querySelector('button')!.disabled).toBe(false);expect(confirm).toHaveBeenCalledOnce();
});
it('Bulk pending and safe error states are visible, disabled and do not duplicate approval',async()=>{
  let reject!:(error:Error)=>void;const approve=vi.fn(()=>new Promise<void>((_,r)=>reject=r));await render(<RosterBulkApproval items={items} onDiscover={vi.fn(async()=>{})} onApprove={approve} busy={false}/>);
  const button=host.querySelectorAll('button')[1];await act(async()=>{button.click();button.click();});expect(approve).toHaveBeenCalledOnce();expect(button.disabled).toBe(true);expect(host.querySelector('[role=status]')!.className).toContain('text-amber-300');
  await act(async()=>reject(Error('private provider detail')));expect(host.querySelector('[role=alert]')!.className).toContain('text-rose-300');expect(host.textContent).not.toContain('private provider detail');expect(button.disabled).toBe(false);
});
it('zero safe cases cannot approve and disabled text has explicit contrast instead of opacity-only styling',async()=>{
  const approve=vi.fn(async()=>{});await render(<RosterBulkApproval items={[]} onDiscover={vi.fn(async()=>{})} onApprove={approve} busy={false}/>);
  const button=host.querySelectorAll('button')[1];expect(button.disabled).toBe(true);expect(button.className).toContain('disabled:bg-stone-800');expect(button.className).toContain('disabled:text-stone-400');await act(async()=>button.click());expect(approve).not.toHaveBeenCalled();
});
