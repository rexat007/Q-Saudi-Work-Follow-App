import { DriverAccountBindingControl } from './DriverAccountBindingControl';
import { executeAdminAccountCommand, adminErrorKey } from '../../services/adminAccountClient.service';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProjectEntity, 
  AuditLogEntity,
  UserEntity
} from '../../types/entities';
import { AuthUserContext } from '../../types/common';
import { 
  ShieldCheck, 
  Users, 
  History, 
  FolderKanban,
  Search, 
  Info, 
  Check, 
  X, 
  Lock, 
  Activity, 
  CheckCheck,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../firebase/authContext';
import { userRepository } from '../../repositories/user.repository';
import { projectRepository } from '../../repositories/project.repository';
import { auditLogService } from '../../services/auditLog.service';

type AdminSection = 
  | 'USERS'
  | 'SECURITY_ACCESS'
  | 'AUDIT_LOGS';

export function AdminConsoleView() {
  const { t, direction, locale } = useI18n();
  const { user: currentUser, userProfile } = useAuth();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('USERS');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const canManageUsers = Boolean(currentUser && userProfile?.role === 'SUPER_ADMIN' && userProfile.status === 'ACTIVE' && userProfile.isActive !== false);

  // Firestore-based canonical collections
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>([]);
  const [projects, setProjects] = useState<ProjectEntity[]>([]);

  // Sub-navigation filter states
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'>('ALL');

  // Audit filter states
  const [auditUserFilter, setAuditUserFilter] = useState<string>('ALL');
  const [auditProjectFilter, setAuditProjectFilter] = useState<string>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('ALL');
  const [auditDateStart, setAuditDateStart] = useState<string>('');
  const [auditDateEnd, setAuditDateEnd] = useState<string>('');
  
  // Expand state for audit log rows
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Modals / Selection states
  const [selectedUserForSecurity, setSelectedUserForSecurity] = useState<UserEntity | null>(null);
  const [userApprovalModal, setUserApprovalModal] = useState<UserEntity | null>(null);
  const [userRejectionModal, setUserRejectionModal] = useState<UserEntity | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Approval config states
  const [approvalRole, setApprovalRole] = useState<UserEntity['role']>('SUPERVISOR');
  const [approvalProjectIds, setApprovalProjectIds] = useState<string[]>([]);

  // General banner notifications
  const [banner, setBanner] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

  const showBanner = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  // Subscribe to canonical collections
  useEffect(() => {
    // 1. Live Firestore users subscription
    const unsubscribeUsers = userRepository.subscribeToUsers((realUsers) => {
      setUsers(realUsers);
      // Auto-select first user if none selected
      if (realUsers.length > 0 && !selectedUserForSecurity) {
        setSelectedUserForSecurity(realUsers[0]);
      }
    });

    // 2. Live Firestore audit logs subscription
    const unsubscribeLogs = auditLogService.subscribeToRecentLogs(100, (realLogs) => {
      setAuditLogs(realLogs);
    });

    // 3. Live Firestore projects subscription (canonical RBAC-scoped)
    const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
    const assignedProjectIds = userProfile?.assignedProjectIds || [];
    const unsubscribeProjects = projectRepository.subscribeToProjects(
      (realProjects) => {
        setProjects(realProjects);
      },
      undefined,
      assignedProjectIds,
      isSuperAdmin
    );

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
      unsubscribeProjects();
    };
  }, [userProfile]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        u.fullName?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term) || 
        u.userId?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [users, userStatusFilter, searchQuery]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // User filter
      if (auditUserFilter !== 'ALL' && log.actor.email !== auditUserFilter && log.actor.userId !== auditUserFilter) {
        return false;
      }
      // Project filter
      if (auditProjectFilter !== 'ALL' && log.projectId !== auditProjectFilter) {
        return false;
      }
      // Action filter
      if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) {
        return false;
      }
      // Entity filter
      if (auditEntityFilter !== 'ALL' && log.entityType !== auditEntityFilter) {
        return false;
      }
      // Date range filters
      if (log.createdAt) {
        const logDate = new Date(log.createdAt as any);
        if (auditDateStart) {
          const startDate = new Date(auditDateStart);
          if (logDate < startDate) return false;
        }
        if (auditDateEnd) {
          const endDate = new Date(auditDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (logDate > endDate) return false;
        }
      }
      return true;
    });
  }, [auditLogs, auditUserFilter, auditProjectFilter, auditActionFilter, auditEntityFilter, auditDateStart, auditDateEnd]);

  // Unique list of actors and entities for filters
  const uniqueAuditActors = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.actor?.email) set.add(l.actor.email);
    });
    return Array.from(set);
  }, [auditLogs]);

  const uniqueAuditEntities = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.entityType) set.add(l.entityType);
    });
    return Array.from(set);
  }, [auditLogs]);

  const refreshTarget = async (userId: string) => {
    const fresh = await userRepository.findById(userId);
    if (!fresh) return;
    setUsers(previous => previous.map(value => value.userId === userId ? fresh : value));
    setSelectedUserForSecurity(previous => previous?.userId === userId ? fresh : previous);
  };
  const handleApproveUserConfirm = async () => {
    if (!canManageUsers || !userApprovalModal) return;
    try {
      await executeAdminAccountCommand(userApprovalModal.userId, { command: 'approveAccount', approvedRole: approvalRole, assignedProjectIds: approvalProjectIds });
      await refreshTarget(userApprovalModal.userId);
      showBanner(t('admin_console.user_approved', { role: approvalRole })); setUserApprovalModal(null);
    } catch (error) { showBanner(t(adminErrorKey(error)), 'warning'); }
  };
  const handleRejectUserConfirm = async () => {
    if (!canManageUsers || !userRejectionModal || !rejectionReason.trim()) return;
    try {
      await executeAdminAccountCommand(userRejectionModal.userId, { command: 'rejectAccount', rejectionReason });
      await refreshTarget(userRejectionModal.userId);
      showBanner(t('admin_console.user_rejected')); setUserRejectionModal(null); setRejectionReason('');
    } catch (error) { showBanner(t(adminErrorKey(error)), 'warning'); }
  };
  const handleSuspendUser = async (target: UserEntity) => {
    if (!canManageUsers) return;
    try {
      await executeAdminAccountCommand(target.userId, { command: 'suspendAccount' }); await refreshTarget(target.userId);
      showBanner(t('admin_console.user_suspended'));
    } catch (error) { showBanner(t(adminErrorKey(error)), 'warning'); }
  };
  const handleReactivateUser = async (target: UserEntity) => {
    if (!canManageUsers) return;
    try {
      await executeAdminAccountCommand(target.userId, { command: 'reactivateAccount' }); await refreshTarget(target.userId);
      showBanner(t('admin_console.user_reactivated'));
    } catch (error) { showBanner(t(adminErrorKey(error)), 'warning'); }
  };
  const handleSaveSecurityPolicy = async () => {
    if (!canManageUsers || !selectedUserForSecurity) return;
    const target = selectedUserForSecurity;
    const original = users.find(value => value.userId === target.userId);
    try {
      if (original?.role !== target.role) await executeAdminAccountCommand(target.userId, { command: 'changeUserRole', newRole: target.role });
      if (JSON.stringify(original?.assignedProjectIds) !== JSON.stringify(target.assignedProjectIds)) await executeAdminAccountCommand(target.userId, { command: 'replaceAssignedProjects', assignedProjectIds: target.assignedProjectIds });
      await refreshTarget(target.userId); showBanner(t('admin_console.security_updated', { email: target.email }));
    } catch (error) {
      // Each explicit command is atomic; refresh also exposes any earlier successful command.
      await refreshTarget(target.userId).catch(() => {}); showBanner(t(adminErrorKey(error)), 'warning');
    }
  };

  return (
    <div className="space-y-6" dir={direction}>
      
      {/* ================= BANNER & STATUS NOTIFICATIONS ================= */}
      {banner && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-4 duration-300 ${
          banner.type === 'success' ? 'bg-emerald-50 text-emerald-950 border-emerald-200' :
          banner.type === 'warning' ? 'bg-rose-50 text-rose-950 border-rose-200' :
          'bg-blue-50 text-blue-950 border-blue-200'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{banner.message}</span>
        </div>
      )}

      {/* ================= COGNITIVE METRICS SUMMARY ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">{t('admin_console.pending_approval_requests')}</span>
            <span className="text-2xl font-black text-stone-900">
              {users.filter(u => u.status === 'PENDING_APPROVAL').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">{t('admin_console.active_users_stat')}</span>
            <span className="text-2xl font-black text-stone-900">
              {users.filter(u => u.status === 'ACTIVE' || (u.isActive && !u.status)).length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 flex items-center justify-center shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">{t('admin_console.available_projects_stat')}</span>
            <span className="text-2xl font-black text-stone-900">
              {projects.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-500/10 border border-stone-500/20 text-stone-700 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">{t('admin_console.audit_records_stat')}</span>
            <span className="text-2xl font-black text-stone-900">
              {auditLogs.length}
            </span>
          </div>
        </div>

      </div>

      {/* ================= PRIMARY NAVIGATION BAR ================= */}
      <div className="bg-stone-900 text-white rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveSection('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'USERS'
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('admin_console.tab_users')}</span>
          </button>
          <button
            onClick={() => setActiveSection('SECURITY_ACCESS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'SECURITY_ACCESS'
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t('admin_console.tab_security')}</span>
          </button>
          <button
            onClick={() => setActiveSection('AUDIT_LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'AUDIT_LOGS'
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t('admin_console.tab_audit')}</span>
          </button>
        </div>
        <div className="px-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-[11px] font-mono font-bold text-stone-400">
          {t('admin_console.project_admin_console')}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: USERS & APPROVALS */}
      {/* ==================================================================== */}
      {activeSection === 'USERS' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">{t('admin_console.users_section_title')}</h2>
                <p className="text-xs text-stone-400 mt-1">{t('admin_console.users_section_desc')}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setUserStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      userStatusFilter === st
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-50 text-stone-600 border border-stone-200/60 hover:bg-stone-100'
                    }`}
                  >
                    {st === 'ALL' ? t('admin_console.filter_all') :
                     st === 'PENDING_APPROVAL' ? t('admin_console.status_pending') :
                     st === 'ACTIVE' ? t('admin_console.status_active') :
                     st === 'SUSPENDED' ? t('admin_console.status_suspended') : t('admin_console.status_rejected')}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-search */}
            <div className="mt-4 flex items-center gap-3 bg-stone-50 border border-stone-200/80 rounded-xl px-4 py-2">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin_console.search_users_placeholder')}
                className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
              />
            </div>

            {/* Users table */}
            <div className="mt-4 border border-stone-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">{t('admin_console.col_user')}</th>
                    <th className="py-3 px-4">{t('admin_console.col_email')}</th>
                    <th className="py-3 px-4">{t('admin_console.col_role')}</th>
                    <th className="py-3 px-4">{t('admin_console.col_projects')}</th>
                    <th className="py-3 px-4">{t('admin_console.col_status')}</th>
                    <th className="py-3 px-4 text-left">{t('admin_console.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 font-medium">
                        {t('admin_console.no_users_match')}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.userId} className="hover:bg-stone-50/60">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 block">{u.fullName || t('admin_console.new_user')}</span>
                          <span className="font-mono text-[10px] text-stone-400">{u.userId}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-600">{u.email}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-700">{u.role || 'PENDING'}</td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {u.assignedProjectIds && u.assignedProjectIds.length > 0 
                            ? u.assignedProjectIds.join(', ') 
                            : t('admin_console.no_assigned_projects')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'ACTIVE' || (!u.status && u.isActive) ? 'bg-emerald-100 text-emerald-800' :
                            u.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            u.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {u.status === 'ACTIVE' ? t('admin_console.status_active') :
                             u.status === 'PENDING_APPROVAL' ? t('admin_console.status_pending') :
                             u.status === 'SUSPENDED' ? t('admin_console.status_suspended') : t('admin_console.status_rejected')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left space-x-2 rtl:space-x-reverse">
                          {canManageUsers && u.userId !== currentUser?.uid && u.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => {
                                  setApprovalRole(u.role || 'SUPERVISOR');
                                  setApprovalProjectIds(u.assignedProjectIds || []);
                                  setUserApprovalModal(u);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                {t('admin_console.btn_approve')}
                              </button>
                              <button
                                onClick={() => {
                                  setRejectionReason('');
                                  setUserRejectionModal(u);
                                }}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                {t('admin_console.btn_reject')}
                              </button>
                            </>
                          )}
                          
                          {canManageUsers && u.userId !== currentUser?.uid && u.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSuspendUser(u)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              {t('admin_console.btn_suspend')}
                            </button>
                          )}

                          {canManageUsers && u.userId !== currentUser?.uid && (u.status === 'SUSPENDED' || u.status === 'REJECTED') && (
                            <button
                              onClick={() => handleReactivateUser(u)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              {t('admin_console.btn_reactivate')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: SECURITY & ROLE & PROJECT ACCESS */}
      {/* ==================================================================== */}
      {activeSection === 'SECURITY_ACCESS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Users select */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs lg:col-span-1 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">{t('admin_console.security_entities')}</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">{t('admin_console.select_authorization_user')}</p>
            </div>
            
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin_console.search_employee')}
                className="bg-transparent w-full focus:outline-none"
              />
            </div>

            <div className="divide-y divide-stone-100 max-h-[450px] overflow-y-auto pr-1">
              {users
                .filter(u => !searchQuery || u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => (
                  <button
                    key={u.userId}
                    onClick={() => setSelectedUserForSecurity(u)}
                    className={`w-full text-right p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedUserForSecurity?.userId === u.userId
                        ? 'bg-stone-900 text-white'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <span className="font-bold text-xs">{u.fullName || t('admin_console.unnamed_user')}</span>
                    <span className="text-[10px] font-mono opacity-80">{u.email}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-stone-800 text-stone-300">
                        {u.role || 'VIEWER'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {u.status || 'PENDING'}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Right panel: Security document policy modifier */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs lg:col-span-2">
            {selectedUserForSecurity ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-stone-100 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{t('admin_console.security_policy_editor')}</h3>
                    <p className="text-xs text-stone-400 mt-1">{t('admin_console.selected_user')} <strong className="text-stone-700">{selectedUserForSecurity.fullName}</strong> ({selectedUserForSecurity.email})</p>
                  </div>
                  <span className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-800 font-mono font-bold text-[11px] rounded-lg">
                    {selectedUserForSecurity.userId}
                  </span>
                </div>

                {canManageUsers && selectedUserForSecurity.userId !== currentUser?.uid ? <>
                {selectedUserForSecurity.role === 'DRIVER' && users.find(user => user.userId === selectedUserForSecurity.userId)?.role === 'DRIVER' && (
                  <DriverAccountBindingControl key={selectedUserForSecurity.userId} target={selectedUserForSecurity} onChanged={() => refreshTarget(selectedUserForSecurity.userId)} />
                )}
                {/* 1. RBAC Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">{t('admin_console.role_assignment')}</label>
                  <p className="text-[11px] text-stone-400">{t('admin_console.role_assignment_description')}</p>
                  <select
                    value={selectedUserForSecurity.role}
                    onChange={(e) => {
                      const updatedRole = e.target.value as any;
                      setSelectedUserForSecurity(prev => prev ? { ...prev, role: updatedRole } : null);
                    }}
                    className="w-full max-w-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">{t('navigation.roles.super_admin')}</option>
                    <option value="PROJECT_ADMIN">{t('navigation.roles.project_admin')}</option>
                    <option value="SUPERVISOR">{t('navigation.roles.supervisor')}</option>
                    <option value="SITE_SUPERVISOR">{t('navigation.roles.site_supervisor')}</option>
                    <option value="DISPATCHER">{t('navigation.roles.dispatcher')}</option>
                    <option value="SCALE_OPERATOR">{t('navigation.roles.scale_operator')}</option>
                    <option value="DRIVER">{t('navigation.roles.driver')}</option>
                    <option value="FINANCE_AUDITOR">{t('navigation.roles.finance_auditor')}</option>
                    <option value="VIEWER">{t('navigation.roles.viewer')}</option>
                  </select>
                </div>

                {/* 2. Project Whitelist Assignment */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-stone-700 block">{t('admin_console.explicit_project_whitelist')}</label>
                  <p className="text-[11px] text-stone-400">{t('admin_console.explicit_project_whitelist_description')}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {projects.map(proj => {
                      const isChecked = selectedUserForSecurity.assignedProjectIds?.includes(proj.projectId);
                      return (
                        <div 
                          key={proj.projectId} 
                          onClick={() => {
                            const currentList = selectedUserForSecurity.assignedProjectIds || [];
                            const newList = currentList.includes(proj.projectId)
                              ? currentList.filter(id => id !== proj.projectId)
                              : [...currentList, proj.projectId];
                            setSelectedUserForSecurity(prev => prev ? { ...prev, assignedProjectIds: newList } : null);
                          }}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-stone-50 border-stone-800 shadow-3xs' 
                              : 'bg-white border-stone-200/80 hover:bg-stone-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-xs text-stone-900 block">{proj.nameAr || proj.nameEn}</span>
                            <span className="font-mono text-[10px] text-stone-400 block mt-0.5">{proj.projectId} | {proj.clientName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
                  <button
                    onClick={handleSaveSecurityPolicy}
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('admin_console.save_matrix')}</span>
                  </button>
                </div>

                </> : <div className="space-y-2"><p>{t(`navigation.roles.${selectedUserForSecurity.role.toLowerCase()}`)}</p><p>{selectedUserForSecurity.assignedProjectIds.join(', ')}</p></div>}

              </div>
            ) : (
              <div className="py-24 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
                <Info className="w-8 h-8 text-stone-300" />
                <span className="text-sm font-bold">{t('admin_console.select_user_prompt')}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: IMMUTABLE AUDIT LOGS */}
      {/* ==================================================================== */}
      {activeSection === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">{t('admin_console.immutable_audit_title')}</h2>
              <p className="text-xs text-stone-400 mt-1">{t('admin_console.immutable_audit_description')}</p>
            </div>

            {/* Advanced Multi-Filter controls */}
            <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-stone-600">{t('admin_console.filter_actor')}</label>
                <select
                  value={auditUserFilter}
                  onChange={(e) => setAuditUserFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">{t('admin_console.all_actors')}</option>
                  {uniqueAuditActors.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">{t('admin_console.filter_project')}</label>
                <select
                  value={auditProjectFilter}
                  onChange={(e) => setAuditProjectFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">{t('analytics.ui.all_projects')}</option>
                  {projects.map(p => (
                    <option key={p.projectId} value={p.projectId}>{p.nameAr || p.nameEn}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">{t('admin_console.action_type')}</label>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">{t('admin_console.all_actions')}</option>
                  <option value="CREATE">{t('admin_console.action_create')}</option>
                  <option value="UPDATE">{t('admin_console.action_update')}</option>
                  <option value="DELETE">{t('admin_console.action_delete')}</option>
                  <option value="FORCE_STATUS_CHANGE">{t('admin_console.action_force_status')}</option>
                  <option value="RECONCILE">{t('admin_console.action_resolve_exception')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">{t('admin_console.entity_type')}</label>
                <select
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">{t('admin_console.all_entities')}</option>
                  {uniqueAuditEntities.map(en => (
                    <option key={en} value={en}>{en}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">{t('admin_console.from_date')}</label>
                <input
                  type="date"
                  value={auditDateStart}
                  onChange={(e) => setAuditDateStart(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">{t('admin_console.to_date')}</label>
                <input
                  type="date"
                  value={auditDateEnd}
                  onChange={(e) => setAuditDateEnd(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 focus:outline-none"
                />
              </div>

            </div>

            {/* Audit Logs Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">{t('admin_console.entry_number_date')}</th>
                    <th className="py-3 px-4">{t('admin_console.actor')}</th>
                    <th className="py-3 px-4">{t('admin_console.target')}</th>
                    <th className="py-3 px-4">{t('admin_console.action_type')}</th>
                    <th className="py-3 px-4">{t('admin_console.changed_fields')}</th>
                    <th className="py-3 px-4 text-left">{t('admin_console.full_details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400 font-medium">
                        {t('admin_console.no_audit_matches')}
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => {
                      const isExpanded = expandedLogId === log.auditLogId;
                      return (
                        <React.Fragment key={log.auditLogId}>
                          <tr className="hover:bg-stone-50/50">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-stone-900 block">{log.auditLogId}</span>
                              <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                                {log.createdAt ? new Date(log.createdAt as any).toLocaleString(locale, { calendar: 'islamic-umalqura' }) : '—'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-stone-800 block">{log.actor.email || log.actor.userId}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{log.actor.role}</span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-stone-700">
                              {log.entityType} ({log.entityId})
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-800'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                              {log.changes?.deltaFields?.join(', ') || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-left">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.auditLogId)}
                                className="px-2.5 py-1 border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                {isExpanded ? t('shared.actions.hide') : t('admin_console.show_payload')}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded row showing details json inspector */}
                          {isExpanded && (
                            <tr className="bg-stone-50">
                              <td colSpan={6} className="p-4">
                                <div className="bg-stone-900 text-stone-100 rounded-xl p-4 font-mono text-[11px] space-y-3 shadow-inner">
                                  <div className="flex justify-between items-center text-stone-400 border-b border-stone-800 pb-2">
                                    <span>{t('admin_console.payload_inspector')}</span>
                                    <span>{t('shared.labels.identifier')} {log.auditLogId}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-amber-400 block mb-1">{t('admin_console.before_data')}</span>
                                      <pre className="overflow-x-auto max-h-[150px] p-2 bg-stone-950 rounded-lg text-stone-300">
                                        {JSON.stringify(log.changes?.before, null, 2) || 'null'}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-emerald-400 block mb-1">{t('admin_console.after_data')}</span>
                                      <pre className="overflow-x-auto max-h-[150px] p-2 bg-stone-950 rounded-lg text-stone-300">
                                        {JSON.stringify(log.changes?.after, null, 2) || 'null'}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* APPROVAL CONFIG MODAL */}
      {/* ==================================================================== */}
      {canManageUsers && userApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="pb-3 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">{t('admin_console.approve_account_request')}</h3>
                <p className="text-xs text-stone-400 mt-1">{t('admin_console.approve_account_description')}</p>
              </div>
              <button 
                onClick={() => setUserApprovalModal(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl">
                <span className="text-stone-400 text-[10px] block font-bold">{t('admin_console.employee_to_approve')}</span>
                <span className="font-bold text-sm text-stone-900 block mt-0.5">{userApprovalModal.fullName}</span>
                <span className="font-mono text-[11px] text-stone-500 block">{userApprovalModal.email}</span>
              </div>

              {/* Role select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">{t('admin_console.assign_security_role')}</label>
                <select
                  value={approvalRole}
                  onChange={(e) => setApprovalRole(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="PROJECT_ADMIN">PROJECT_ADMIN</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="SITE_SUPERVISOR">SITE_SUPERVISOR</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="SCALE_OPERATOR">{t('navigation.roles.scale_operator')}</option>
                  <option value="DRIVER">{t('navigation.roles.driver')}</option>
                  <option value="FINANCE_AUDITOR">FINANCE_AUDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              {/* Projects checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">{t('admin_console.assigned_project_whitelist')}</label>
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {projects.map(p => {
                    const checked = approvalProjectIds.includes(p.projectId);
                    return (
                      <div 
                        key={p.projectId}
                        onClick={() => {
                          const newList = checked
                            ? approvalProjectIds.filter(id => id !== p.projectId)
                            : [...approvalProjectIds, p.projectId];
                          setApprovalProjectIds(newList);
                        }}
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer text-xs transition-all ${
                          checked ? 'bg-stone-50 border-stone-900' : 'bg-white border-stone-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                        />
                        <div>
                          <strong className="text-stone-800 font-bold block">{p.nameAr || p.nameEn}</strong>
                          <span className="text-[10px] text-stone-400 font-mono block">{p.projectId}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setUserApprovalModal(null)}
                className="px-4 py-2 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {t('shared.actions.cancel')}
              </button>
              <button
                onClick={handleApproveUserConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{t('admin_console.approve_activate_user')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REJECTION CONFIG MODAL */}
      {/* ==================================================================== */}
      {canManageUsers && userRejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="pb-3 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">{t('admin_console.reject_account_request')}</h3>
                <p className="text-xs text-stone-400 mt-1">{t('admin_console.reject_account_description')}</p>
              </div>
              <button 
                onClick={() => setUserRejectionModal(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl">
                <span className="text-stone-400 text-[10px] block font-bold">{t('admin_console.col_user')}</span>
                <span className="font-bold text-stone-800">{userRejectionModal.fullName}</span>
                <span className="font-mono text-stone-400 block mt-0.5">{userRejectionModal.email}</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">{t('admin_console.rejection_reason_required')}</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('admin_console.rejection_reason_example')}
                  rows={4}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setUserRejectionModal(null)}
                className="px-4 py-2 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {t('shared.actions.cancel')}
              </button>
              <button
                onClick={handleRejectUserConfirm}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{t('admin_console.confirm_reject_account')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
