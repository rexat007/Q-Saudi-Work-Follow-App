import React from 'react';

export const tripEntryControl = 'w-full min-w-0 min-h-11 rounded-xl border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60';
export const tripEntryAction = 'min-h-11 rounded-xl border border-stone-600 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed';

export function TripEntryNotice({children, tone = 'neutral', id}: {children: React.ReactNode; tone?: 'neutral' | 'error' | 'success'; id?: string}) {
  return <div id={id} role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-4 text-sm leading-relaxed break-words ${tone === 'error' ? 'border-rose-700 bg-rose-950/30 text-rose-200' : tone === 'success' ? 'border-emerald-700 bg-emerald-950/30 text-emerald-200' : 'border-stone-700 bg-stone-900 text-stone-200'}`}>{children}</div>;
}
