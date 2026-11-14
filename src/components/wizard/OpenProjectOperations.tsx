import React from 'react';
import type {ProjectEntity} from '../../types/entities';
import type {AuthUserContext} from '../../types/common';
import {tripEntryTarget} from '../../utils/tripEntryPresentation';
import {useI18n} from '../../i18n';
import {tripEntryAction} from '../field/TripEntryNotice';

/** Receives the canonical project, never the optimistic activation request. */
export function OpenProjectOperations({project,actor,ready,onOpen}:{project:ProjectEntity;actor:AuthUserContext;ready:boolean;onOpen?:(id:string)=>void}) {
  const {t}=useI18n();
  if(project.status!=='ACTIVE') return null;
  const allowed=Boolean(ready&&onOpen&&tripEntryTarget(actor,project,'OPERATIONS'));
  return <div className="space-y-2 text-sm">
    <button type="button" disabled={!allowed} aria-describedby="ui1-open-explanation" className={`${tripEntryAction} bg-emerald-700 text-white`} onClick={()=>{if(allowed)onOpen?.(project.projectId);}}>{t('ui1.open_operations')}</button>
    {!allowed&&<p id="ui1-open-explanation">{t(!ready?'ui1.verifying_project':'ui1.operations_denied')}</p>}
  </div>;
}
