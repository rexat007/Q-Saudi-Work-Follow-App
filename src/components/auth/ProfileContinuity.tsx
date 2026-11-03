import React from 'react';
import {ImportOverlay} from '../import/ImportOverlay';
import {useI18n} from '../../i18n';
/** Never replaces mounted children because profile transport temporarily failed. */
export function ProfileContinuity({blocked,onRetry,children}:{blocked:boolean;onRetry:()=>Promise<void>;children?:React.ReactNode}){
 const {t}=useI18n();return <>{children}{blocked&&<ImportOverlay level="AUTHORITY" label={t('auth.continuity.title')}><section className="max-w-lg rounded-xl bg-stone-900 p-6 text-stone-100" role="status"><h2>{t('auth.continuity.title')}</h2><p>{t('auth.continuity.message')}</p><button type="button" onClick={()=>void onRetry()}>{t('shared.error_boundary.retry')}</button></section></ImportOverlay>}</>;
}
