import { resolutionErrorKey } from '../../i18n/importResolution';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import type { RelationshipContext } from '../../types/dataQuality';
import { ProjectContextLifetime, type ProjectContextToken } from '../../utils/projectContextLifetime';
import { canonicalRelationshipContextService } from '../../services/canonicalRelationshipContext.service';
export function CanonicalImportBoundary({ projectId, owner, children }: { projectId: string; owner: string; children: (context: RelationshipContext, reload: () => Promise<RelationshipContext>, isCurrent: () => boolean) => React.ReactNode }) {
  const { t }=useI18n();
  const life=useRef(new ProjectContextLifetime()).current;
  life.enter(projectId,owner); const token=life.capture();
  const accepted = useRef<ProjectContextToken|null>(null);
  useLayoutEffect(()=>{life.enter(projectId,owner);return()=>life.dispose();},[life]);
  const [context,setContext]=useState<RelationshipContext|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const reload=useCallback(async()=>{
    const request=life.capture();setLoading(true);setError(null);
    try{
      const next=await canonicalRelationshipContextService.getProjectRelationshipContext(projectId,{resolution:true});
      if(!life.isCurrent(request,projectId))throw Error('PROJECT_CONTEXT_STALE');
      if(next.projectId!==projectId||next.importResolution?.projectId!==projectId)throw Error('CONTEXT_UNAVAILABLE');
      accepted.current=request;setContext(next);return next;
    }catch(e){if(life.isCurrent(request,projectId)){const key=resolutionErrorKey(e);setError(key);if(key==='import.resolution.access')setContext(null);}throw e;}
    finally{if(life.isCurrent(request,projectId))setLoading(false);}
  },[projectId,owner,life]);
  useEffect(()=>{void reload().catch(()=>{});},[reload]);
  const current=()=>life.isCurrent(token,projectId);
  return <div aria-busy={loading}>
    {loading&&<p role="status">{t('shared.status.loading')}</p>}
    {error&&<div role="alert">{t(error!)}<button type="button" onClick={()=>void reload().catch(()=>{})}>{t('setup.retry')}</button></div>}
    {context&&accepted.current&&life.isCurrent(accepted.current,projectId)&&context.projectId===projectId&&<fieldset className="min-w-0 border-0 p-0" disabled={loading||Boolean(error)}>{children(context,reload,current)}</fieldset>}
  </div>;
}
