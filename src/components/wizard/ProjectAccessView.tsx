import React, { useEffect, useState } from 'react';
import { useAuth } from '../../firebase/authContext';
import { useI18n } from '../../i18n';
import { userRepository } from '../../repositories/user.repository';
import { executeAdminAccountCommand, adminErrorKey } from '../../services/adminAccountClient.service';
import { validateAccountProfile } from '../../utils/principal';
import { hasProjectScope } from '../../utils/projectScope';
import type { UserEntity } from '../../types/entities';

export function hasEffectiveProjectAccess(user: UserEntity, projectId: string): boolean {
  try {
    const account = validateAccountProfile(user, user.userId);
    return account.status === 'ACTIVE' && account.isActive !== false && hasProjectScope(account, projectId);
  } catch { return false; }
}

export function ProjectAccessView({ projectId }: { projectId: string }) {
  const { user, userProfile } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [targetId, setTargetId] = useState('');
  const eligible = userProfile && hasEffectiveProjectAccess(userProfile, projectId);
  const canRead = Boolean(eligible && ['SUPER_ADMIN', 'PROJECT_ADMIN'].includes(userProfile!.role));
  const canManage = Boolean(canRead && userProfile?.role === 'SUPER_ADMIN');
  useEffect(() => {
    setUsers([]); setError(''); setTargetId('');
    if (!canRead) return;
    return userRepository.subscribeToProjectUsers(projectId, setUsers, () => setError('project_access.read_failed'), canManage);
  }, [projectId, user?.uid, canRead, canManage]);
  // Gate old snapshot state synchronously while a project/authority change settles.
  const members = canRead ? users.filter(member => member.assignedProjectIds.includes(projectId)) : [];
  const candidates = canManage ? users.filter(member => member.userId !== user?.uid && !member.assignedProjectIds.includes(projectId)) : [];
  const replace = async (userId: string, add: boolean) => {
    if (!canManage || pending || userId === user?.uid) return;
    setPending(true); setError('');
    try {
      const current = await userRepository.findById(userId);
      if (!current) throw { code: 'TARGET_USER_NOT_FOUND' };
      const ids = new Set(current.assignedProjectIds);
      if (add) ids.add(projectId); else ids.delete(projectId);
      await executeAdminAccountCommand(userId, { command: 'replaceAssignedProjects', assignedProjectIds: [...ids].sort() });
      // Both views receive the canonical users snapshot; no local membership write.
    } catch (error) { setError(adminErrorKey(error)); }
    finally { setPending(false); }
  };
  if (!canRead) return <p>{t('project_access.read_only_admin')}</p>;
  return <section className="space-y-4">
    <h3>{t('projects.batch4.project_user_access')}</h3>
    <p>{t('project_access.description')}</p>
    {error && <p role="alert">{t(error)}</p>}
    <table className="w-full text-start"><thead><tr>
      <th>{t('other.labels.user_4')}</th><th>{t('admin_console.col_email')}</th>
      <th>{t('projects.batch4.system_role')}</th><th>{t('project_access.account_status')}</th>
      <th>{t('project_access.assignment')}</th><th>{t('project_access.effective_access')}</th>
    </tr></thead><tbody>{members.map(member => <tr key={member.userId}>
      <td>{member.fullName}</td><td>{member.email}</td><td>{t(`navigation.roles.${member.role.toLowerCase()}`)}</td>
      <td>{t(`admin_console.status_${(member.status === 'PENDING_APPROVAL' || (!member.status && !member.isActive) ? 'pending' : (member.status || 'ACTIVE').toLowerCase())}`)}</td>
      <td>{t('project_access.assigned')}</td>
      <td>{t(hasEffectiveProjectAccess(member, projectId) ? 'project_access.effective' : 'project_access.inactive')}</td>
      {canManage && member.userId !== user?.uid && <td><button disabled={pending} onClick={() => void replace(member.userId, false)}>{t('project_access.remove')}</button></td>}
    </tr>)}</tbody></table>
    {!members.length && <p>{t('project_access.empty')}</p>}
    {canManage && <div className="flex gap-2">
      <select aria-label={t('project_access.add')} value={targetId} onChange={event => setTargetId(event.target.value)} disabled={pending}>
        <option value="">{t('project_access.choose_user')}</option>
        {candidates.map(member => <option key={member.userId} value={member.userId}>{member.fullName} — {member.email}</option>)}
      </select>
      <button disabled={!targetId || pending} onClick={() => void replace(targetId, true)}>{t('project_access.add')}</button>
    </div>}
  </section>;
}
