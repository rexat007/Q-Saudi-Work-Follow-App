import React, { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { executeAdminAccountCommand, listDriverIdentities, adminErrorKey } from '../../services/adminAccountClient.service';
import type { UserEntity } from '../../types/entities';
export function DriverAccountBindingControl({ target, onChanged }: { target: UserEntity; onChanged: () => Promise<void> }) {
  const { t } = useI18n();
  const [drivers, setDrivers] = useState<Awaited<ReturnType<typeof listDriverIdentities>>>([]);
  const [selection, setSelection] = useState(target.linkedDriverId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setSelection(target.linkedDriverId || ''); setDrivers([]); setError('');
    listDriverIdentities().then(value => { if (active) setDrivers(value); }).catch(error => { if (active) setError(adminErrorKey(error)); });
    return () => { active = false; };
  }, [target.userId, target.linkedDriverId]);
  const update = async (unlink: boolean) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await executeAdminAccountCommand(target.userId, unlink ? { command: 'unlinkDriverIdentity' } : { command: 'linkDriverIdentity', linkedDriverId: selection });
      await onChanged();
    } catch (error) { setError(adminErrorKey(error)); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2">
    <label>{t('admin_console.driver_binding')}</label>
    <p>{target.linkedDriverId || t('admin_console.driver_not_linked')}</p>
    {error && <p role="alert">{t(error)}</p>}
    <select aria-label={t('admin_console.driver_binding')} value={selection} onChange={event => setSelection(event.target.value)} disabled={busy}>
      <option value="">{t('admin_console.driver_choose')}</option>
      {drivers.map(driver => <option key={driver.driverId} value={driver.driverId}>{driver.fullNameAr} — {driver.driverId}</option>)}
    </select>
    <button disabled={busy || !selection} onClick={() => void update(false)}>{t('admin_console.driver_link')}</button>
    <button disabled={busy || !target.linkedDriverId} onClick={() => void update(true)}>{t('admin_console.driver_unlink')}</button>
  </div>;
}
