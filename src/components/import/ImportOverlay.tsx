import {useI18n} from '../../i18n';
import React, {useLayoutEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

// One stack owns pointer, keyboard, focus and body scrolling. Portals alone do not.
export const IMPORT_OVERLAY_LEVEL = {WORKFLOW: 100, EDITOR: 110, CONFIRMATION: 120} as const;
type Entry = {node: HTMLElement; level: number; order: number; dismiss: () => void; origin: HTMLElement | null};
const entries: Entry[] = [];
const originals = new Map<HTMLElement, {inert: boolean; hidden: string | null}>();
let sequence = 0, overflow = '';
const top = () => [...entries].sort((a,b) => a.level-b.level || a.order-b.order).at(-1);
const controls = (node: HTMLElement) => [...node.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]')].filter(e => !e.hasAttribute('disabled') && e.tabIndex >= 0 && !e.closest('[hidden],[aria-hidden="true"]'));
function focus(entry: Entry) {(controls(entry.node)[0] || entry.node).focus();}
function reconcile() {
  const current = top();
  for (const node of Array.from(document.body.children)) {
    if (!(node instanceof HTMLElement)) continue;
    if (!originals.has(node)) originals.set(node, {inert: node.inert, hidden: node.getAttribute('aria-hidden')});
    const saved = originals.get(node)!;
    if (current && node !== current.node && !node.contains(current.node)) {node.inert = true; node.setAttribute('aria-hidden','true');}
    else {node.inert = saved.inert; if(saved.hidden === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden',saved.hidden);}
  }
}
function keydown(event: KeyboardEvent) {
  const current = top(); if(!current) return;
  if(event.key === 'Escape') {event.preventDefault(); event.stopImmediatePropagation(); current.dismiss();}
  if(event.key === 'Tab') {
    const items = controls(current.node), index = items.indexOf(document.activeElement as HTMLElement);
    if(!items.length) {event.preventDefault(); current.node.focus();}
    else if(index < 0 || event.shiftKey && index === 0 || !event.shiftKey && index === items.length-1) {event.preventDefault(); (event.shiftKey ? items.at(-1)! : items[0]).focus();}
  }
}
function focusin(event: FocusEvent) {const current = top(); if(current && !current.node.contains(event.target as Node)) focus(current);}
function pointer(event: Event) {const current = top(); if(current && !current.node.contains(event.target as Node)) {event.preventDefault(); event.stopImmediatePropagation();}}

export function ImportOverlay({children, label, level='EDITOR', onDismiss, busy=false, allowDismissWhileBusy=false, className=''}: {
  children: React.ReactNode; label: string; level?: keyof typeof IMPORT_OVERLAY_LEVEL; onDismiss?: () => void; busy?: boolean; allowDismissWhileBusy?: boolean; className?: string;
}) {
  const {direction}=useI18n();
  const node = useRef<HTMLDivElement>(null), latest = useRef({onDismiss,busy,allowDismissWhileBusy}); latest.current={onDismiss,busy,allowDismissWhileBusy};
  useLayoutEffect(() => {
    if(!node.current) return;
    const first = entries.length === 0;
    if(first) {overflow=document.body.style.overflow; document.body.style.overflow='hidden'; document.addEventListener('keydown',keydown,true); document.addEventListener('focusin',focusin,true); document.addEventListener('pointerdown',pointer,true); document.addEventListener('click',pointer,true);}
    const entry: Entry={node:node.current,level:IMPORT_OVERLAY_LEVEL[level],order:++sequence,dismiss:()=>{if(!latest.current.busy||latest.current.allowDismissWhileBusy) latest.current.onDismiss?.();},origin:document.activeElement instanceof HTMLElement ? document.activeElement : null};
    entries.push(entry); reconcile(); if(top() === entry) focus(entry);
    return () => {
      entries.splice(entries.indexOf(entry),1); reconcile();
      if(!entries.length) {document.body.style.overflow=overflow; document.removeEventListener('keydown',keydown,true); document.removeEventListener('focusin',focusin,true); document.removeEventListener('pointerdown',pointer,true); document.removeEventListener('click',pointer,true); for(const [element,saved] of originals) {element.inert=saved.inert; if(saved.hidden===null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden',saved.hidden);} originals.clear();}
      const current=top(); if(entry.origin?.isConnected && (!current || current.node.contains(entry.origin))) entry.origin.focus(); else if(current) focus(current);
    };
  },[level]);
  const content=<div ref={node} dir={direction} role="dialog" aria-modal="true" aria-label={label} aria-busy={busy} tabIndex={-1} data-import-overlay={level} style={{zIndex:IMPORT_OVERLAY_LEVEL[level]}} className={`fixed inset-0 flex items-center justify-center bg-stone-950/80 p-2 sm:p-4 overflow-y-auto ${className}`} onClick={event=>{if(event.target===event.currentTarget&&(!busy||allowDismissWhileBusy))onDismiss?.();}}>{children}</div>;
  return typeof document === 'undefined' ? null : createPortal(content,document.body);
}
