import React, { useState, useEffect, useMemo } from 'react';
import { 
  adminConsoleService, 
  SyncHealthStatus 
} from '../../services/adminConsole.service';
import { 
  ProjectEntity, 
  TripExceptionEntity, 
  AuditLogEntity 
} from '../../types/entities';
import { AuthUserContext } from '../../types/common';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  History, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  ChevronDown, 
  Info, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Activity, 
  FileText, 
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../firebase/authContext';
import { userRepository } from '../../repositories/user.repository';
import { auditLogService } from '../../services/auditLog.service';
import { exceptionEngine } from '../../services/exceptionEngine.service';
import { UserEntity } from '../../types/entities';
import { ExceptionRecord, ExceptionStatus } from '../../types/exceptionEngine';

type AdminSection = 
  | 'USERS'
  | 'SECURITY_ACCESS'
  | 'EXCEPTIONS'
  | 'AUDIT_LOGS';

export function AdminConsoleView() {
  const { t } = useI18n();
  const { user: currentUser, userProfile } = useAuth();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('USERS');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Safe authentication fallback for audit logs
  const authContext = useMemo<AuthUserContext>(() => ({
    userId: currentUser?.uid || 'USR-ADMIN-001',
    email: currentUser?.email || 'admin@qsaudi.com',
    role: (userProfile?.role as any) || 'PROJECT_ADMIN',
    displayName: userProfile?.fullName || 'مدير النظام الموحد',
  }), [currentUser, userProfile]);

  // Firestore-based real collections
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [syncHealth, setSyncHealth] = useState<SyncHealthStatus>(adminConsoleService.getSyncHealth());
  const [projects, setProjects] = useState<ProjectEntity[]>([]);

  // Sub-navigation filter states
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'>('ALL');
  const [exceptionStatusFilter, setExceptionStatusFilter] = useState<'ALL' | ExceptionStatus>('ALL');

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

  // Exceptions handling modals
  const [resolvingException, setResolvingException] = useState<ExceptionRecord | null>(null);
  const [rejectingException, setRejectingException] = useState<ExceptionRecord | null>(null);
  const [clinicalReasonNotes, setClinicalReasonNotes] = useState<string>('');

  // General banner notifications
  const [banner, setBanner] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

  const showBanner = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  // Subscribe to real collections
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

    // 3. Exception engine subscription
    setExceptions(exceptionEngine.getAllExceptions());
    const unsubscribeExceptions = exceptionEngine.subscribe(() => {
      setExceptions(exceptionEngine.getAllExceptions());
    });

    // 4. Static / service configurations
    setProjects(adminConsoleService.getProjects());
    setSyncHealth(adminConsoleService.getSyncHealth());

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
      unsubscribeExceptions();
    };
  }, []);

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

  // Filtered Exceptions List
  const filteredExceptions = useMemo(() => {
    return exceptions.filter(e => {
      const matchesStatus = exceptionStatusFilter === 'ALL' || e.status === exceptionStatusFilter;
      const matchesProject = selectedProjectId === 'ALL' || e.projectId === selectedProjectId;
      return matchesStatus && matchesProject;
    });
  }, [exceptions, exceptionStatusFilter, selectedProjectId]);

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

  // Approve User Action Handler
  const handleApproveUserConfirm = async () => {
    if (!userApprovalModal) return;
    const userToApprove = userApprovalModal;
    
    try {
      const updates = {
        status: 'ACTIVE' as const,
        isActive: true,
        role: approvalRole,
        assignedProjectIds: approvalProjectIds,
        approvedBy: authContext.userId,
        approvedAt: new Date().toISOString()
      };
      
      // 1. Write to Firestore
      await userRepository.update(userToApprove.userId, updates, authContext.userId);

      // 2. Record immutable system audit log
      await auditLogService.recordLog({
        projectId: approvalProjectIds[0] || 'ALL',
        entityType: 'USER_ROLE',
        entityId: userToApprove.userId,
        action: 'UPDATE',
        before: userToApprove,
        after: { ...userToApprove, ...updates }
      }, authContext);

      // Sync local in-memory fallback helper
      adminConsoleService.approveUser(userToApprove.userId, approvalRole, approvalProjectIds, authContext);

      showBanner(`تم اعتماد المستخدم بنجاح بالدور: ${approvalRole}`);
      setUserApprovalModal(null);
    } catch (error: any) {
      showBanner(`فشلت عملية الاعتماد: ${error.message}`, 'warning');
    }
  };

  // Reject User Action Handler
  const handleRejectUserConfirm = async () => {
    if (!userRejectionModal || !rejectionReason.trim()) return;
    const userToReject = userRejectionModal;

    try {
      const updates = {
        status: 'REJECTED' as const,
        isActive: false,
        rejectionReason,
        rejectedBy: authContext.userId,
        rejectedAt: new Date().toISOString()
      };

      // 1. Write to Firestore
      await userRepository.update(userToReject.userId, updates, authContext.userId);

      // 2. Record immutable audit log
      await auditLogService.recordLog({
        projectId: 'ALL',
        entityType: 'USER_ROLE',
        entityId: userToReject.userId,
        action: 'FORCE_STATUS_CHANGE',
        before: userToReject,
        after: { ...userToReject, ...updates }
      }, authContext);

      // Sync local helper
      adminConsoleService.rejectUser(userToReject.userId, rejectionReason, authContext);

      showBanner(`تم رفض حساب المستخدم وتقديم التبرير الحوكمي.`);
      setUserRejectionModal(null);
      setRejectionReason('');
    } catch (error: any) {
      showBanner(`فشلت عملية الرفض: ${error.message}`, 'warning');
    }
  };

  // Suspend User Handler
  const handleSuspendUser = async (userToSuspend: UserEntity) => {
    try {
      const updates = {
        status: 'SUSPENDED' as const,
        isActive: false,
      };

      await userRepository.update(userToSuspend.userId, updates, authContext.userId);

      await auditLogService.recordLog({
        projectId: 'ALL',
        entityType: 'USER_ROLE',
        entityId: userToSuspend.userId,
        action: 'FORCE_STATUS_CHANGE',
        before: userToSuspend,
        after: { ...userToSuspend, ...updates }
      }, authContext);

      adminConsoleService.suspendUser(userToSuspend.userId, authContext);
      showBanner(`تم تعليق حساب المستخدم بنجاح.`);
    } catch (error: any) {
      showBanner(`فشلت عملية التعليق: ${error.message}`, 'warning');
    }
  };

  // Reactivate User Handler
  const handleReactivateUser = async (userToReactivate: UserEntity) => {
    try {
      const updates = {
        status: 'ACTIVE' as const,
        isActive: true,
      };

      await userRepository.update(userToReactivate.userId, updates, authContext.userId);

      await auditLogService.recordLog({
        projectId: 'ALL',
        entityType: 'USER_ROLE',
        entityId: userToReactivate.userId,
        action: 'FORCE_STATUS_CHANGE',
        before: userToReactivate,
        after: { ...userToReactivate, ...updates }
      }, authContext);

      adminConsoleService.reactivateUser(userToReactivate.userId, authContext);
      showBanner(`تمت إعادة تفعيل الحساب بنجاح.`);
    } catch (error: any) {
      showBanner(`فشلت إعادة التفعيل: ${error.message}`, 'warning');
    }
  };

  // Security Access Policies modification
  const handleSaveSecurityPolicy = async () => {
    if (!selectedUserForSecurity) return;
    const target = selectedUserForSecurity;

    try {
      const updates = {
        role: selectedUserForSecurity.role,
        assignedProjectIds: selectedUserForSecurity.assignedProjectIds,
      };

      // 1. Save to Firestore
      await userRepository.update(target.userId, updates, authContext.userId);

      // 2. Log system security audit log
      await auditLogService.recordLog({
        projectId: selectedUserForSecurity.assignedProjectIds[0] || 'ALL',
        entityType: 'USER_ROLE',
        entityId: target.userId,
        action: 'UPDATE',
        before: target,
        after: { ...target, ...updates }
      }, authContext);

      showBanner(`تم تحديث وثيقة الصلاحيات والوصول الأمني للمستخدم: ${target.email}`);
    } catch (error: any) {
      showBanner(`فشل تحديث السياسات الأمنية: ${error.message}`, 'warning');
    }
  };

  // Exception resolution
  const handleResolveException = () => {
    if (!resolvingException || !clinicalReasonNotes.trim()) return;
    
    try {
      // Resolve through exception engine with clinical audit reason
      exceptionEngine.resolveException({
        exceptionId: resolvingException.exceptionId,
        actorId: authContext.userId,
        actorName: authContext.displayName,
        actorRole: authContext.role,
        resolution: 'RESOLVED',
        resolutionNote: clinicalReasonNotes,
      });

      // Record in security journal
      auditLogService.recordLog({
        projectId: resolvingException.projectId,
        entityType: 'EXCEPTION',
        entityId: resolvingException.exceptionId,
        action: 'WAIVE_EXCEPTION',
        before: resolvingException,
        after: { ...resolvingException, status: 'RESOLVED', resolutionNote: clinicalReasonNotes }
      }, authContext);

      showBanner(`تمت معالجة الاستثناء بنجاح وإغلاق التنبيه الميداني.`);
      setResolvingException(null);
      setClinicalReasonNotes('');
    } catch (error: any) {
      showBanner(`فشل تحديث الاستثناء: ${error.message}`, 'warning');
    }
  };

  // Exception rejection
  const handleRejectException = () => {
    if (!rejectingException || !clinicalReasonNotes.trim()) return;

    try {
      exceptionEngine.rejectException({
        exceptionId: rejectingException.exceptionId,
        actorId: authContext.userId,
        actorName: authContext.displayName,
        actorRole: authContext.role,
        rejectionReason: clinicalReasonNotes,
        resolutionNote: clinicalReasonNotes,
      });

      auditLogService.recordLog({
        projectId: rejectingException.projectId,
        entityType: 'EXCEPTION',
        entityId: rejectingException.exceptionId,
        action: 'FORCE_STATUS_CHANGE',
        before: rejectingException,
        after: { ...rejectingException, status: 'REJECTED', resolutionNote: clinicalReasonNotes }
      }, authContext);

      showBanner(`تم رفض معالجة الاستثناء وتسجيل التبرير الإداري المانع.`);
      setRejectingException(null);
      setClinicalReasonNotes('');
    } catch (error: any) {
      showBanner(`فشلت المعالجة: ${error.message}`, 'warning');
    }
  };


  return (
    <div className="space-y-6" dir="rtl">
      
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

      {/* ================= COGNITIVE METRICS SUMMARY (BENTO GRID STYLE) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">طلبات الاعتماد المعلقة</span>
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
            <span className="text-xs text-stone-400 block font-bold">المستخدمون النشطون (Firestore)</span>
            <span className="text-2xl font-black text-stone-900">
              {users.filter(u => u.status === 'ACTIVE' || (u.isActive && !u.status)).length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">الاستثناءات التشغيلية النشطة</span>
            <span className="text-2xl font-black text-rose-600">
              {exceptions.filter(e => e.status === 'OPEN' || e.status === 'UNDER_REVIEW').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-500/10 border border-stone-500/20 text-stone-700 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-bold">حالة تزامن قاعدة البيانات</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {syncHealth.isOnline ? 'مباشر (Online)' : 'محلي (Offline)'}
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
            <span>المستخدمون والاعتمادات</span>
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
            <span>صلاحيات الوصول والشبكة</span>
          </button>
          <button
            onClick={() => setActiveSection('EXCEPTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'EXCEPTIONS'
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>محرك الاستثناءات الحية</span>
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
            <span>سجل التدقيق الشامل (Audit Logs)</span>
          </button>
        </div>
        <div className="px-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-[11px] font-mono font-bold text-stone-400">
          PROJECT_ADMIN CONSOLE
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
                <h2 className="text-base font-bold text-stone-900">طلبات الحسابات والتفويض (Users & Accounts Approval)</h2>
                <p className="text-xs text-stone-400 mt-1">اعتماد المستخدمين القادمين من مصادقة Google Sign-In وتعيين صلاحياتهم التشغيلية ومشاريعهم المسموحة.</p>
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
                    {st === 'ALL' ? 'الكل' :
                     st === 'PENDING_APPROVAL' ? 'بانتظار الموافقة' :
                     st === 'ACTIVE' ? 'نشط' :
                     st === 'SUSPENDED' ? 'معلق' : 'مرفوض'}
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
                placeholder="البحث بواسطة الاسم، البريد الإلكتروني، أو الرقم التعريفي..."
                className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
              />
            </div>

            {/* Users table */}
            <div className="mt-4 border border-stone-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4">الدور المقترح</th>
                    <th className="py-3 px-4">المشاريع المسموحة</th>
                    <th className="py-3 px-4">حالة الحساب</th>
                    <th className="py-3 px-4 text-left">الإجراءات الحوكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 font-medium">
                        لا يوجد مستخدمون يطابقون خيارات التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.userId} className="hover:bg-stone-50/60">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 block">{u.fullName || 'مستخدم جديد'}</span>
                          <span className="font-mono text-[10px] text-stone-400">{u.userId}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-600">{u.email}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-700">{u.role || 'PENDING'}</td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {u.assignedProjectIds && u.assignedProjectIds.length > 0 
                            ? u.assignedProjectIds.join(', ') 
                            : 'لا يوجد مشاريع مسندة'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'ACTIVE' || (!u.status && u.isActive) ? 'bg-emerald-100 text-emerald-800' :
                            u.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            u.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {u.status === 'ACTIVE' ? 'نشط ومصرح' :
                             u.status === 'PENDING_APPROVAL' ? 'معلق بانتظار الاعتماد' :
                             u.status === 'SUSPENDED' ? 'معطل مؤقتاً' : 'مرفوض'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left space-x-2 rtl:space-x-reverse">
                          {u.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => {
                                  setApprovalRole(u.role || 'SUPERVISOR');
                                  setApprovalProjectIds(u.assignedProjectIds || []);
                                  setUserApprovalModal(u);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                اعتماد وتعيين صلاحيات
                              </button>
                              <button
                                onClick={() => {
                                  setRejectionReason('');
                                  setUserRejectionModal(u);
                                }}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                رفض الطلب
                              </button>
                            </>
                          )}
                          
                          {u.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSuspendUser(u)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              تعليق الحساب
                            </button>
                          )}

                          {(u.status === 'SUSPENDED' || u.status === 'REJECTED') && (
                            <button
                              onClick={() => handleReactivateUser(u)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              إعادة تفعيل الحساب
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
              <h3 className="text-sm font-bold text-stone-900">سجل الكيانات الأمنية</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">اختر مستخدماً من القائمة لتعديل سياسة التفويض الأمني الخاصة به.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الموظف..."
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
                    <span className="font-bold text-xs">{u.fullName || 'مستخدم بلا اسم'}</span>
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
                    <h3 className="text-base font-bold text-stone-900">محدد السياسات الأمنية والحوكمة</h3>
                    <p className="text-xs text-stone-400 mt-1">المستخدم المحدد: <strong className="text-stone-700">{selectedUserForSecurity.fullName}</strong> ({selectedUserForSecurity.email})</p>
                  </div>
                  <span className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-800 font-mono font-bold text-[11px] rounded-lg">
                    {selectedUserForSecurity.userId}
                  </span>
                </div>

                {/* 1. RBAC Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">الدور الرقابي والأمني (Role Base Assignment)</label>
                  <p className="text-[11px] text-stone-400">تمنح هذه الصلاحية للمستخدم الوصول للمرافق والعمليات المحددة لكل دور رقابي في قواعد البيانات.</p>
                  <select
                    value={selectedUserForSecurity.role}
                    onChange={(e) => {
                      const updatedRole = e.target.value as any;
                      setSelectedUserForSecurity(prev => prev ? { ...prev, role: updatedRole } : null);
                    }}
                    className="w-full max-w-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (المدير الفني الأعلى)</option>
                    <option value="PROJECT_ADMIN">PROJECT_ADMIN (مدير المنظومة)</option>
                    <option value="SUPERVISOR">SUPERVISOR (المشرف العام الميداني)</option>
                    <option value="SITE_SUPERVISOR">SITE_SUPERVISOR (مشرف الموقع)</option>
                    <option value="DISPATCHER">DISPATCHER (مشرف الترحيل والميزان)</option>
                    <option value="FINANCE_AUDITOR">FINANCE_AUDITOR (المدقق المالي للعمليات)</option>
                    <option value="VIEWER">VIEWER (مستعرض للنظام)</option>
                  </select>
                </div>

                {/* 2. Project Whitelist Assignment */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-stone-700 block">قائمة المشاريع المسموحة (Explicit Project Access Whitelist)</label>
                  <p className="text-[11px] text-stone-400">تحديد المشاريع التي يسمح لهذا الحساب بالوصول لبياناتها التشغيلية بشكل صريح. يتم فرض هذا العزل كلياً في طبقة البيانات.</p>
                  
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
                    <span>حفظ واعتماد مصفوفة الصلاحيات</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
                <Info className="w-8 h-8 text-stone-300" />
                <span className="text-sm font-bold">يرجى اختيار مستخدم من القائمة الجانبية لتعديل مصفوفة صلاحياته.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: EXCEPTIONS */}
      {/* ==================================================================== */}
      {activeSection === 'EXCEPTIONS' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">محرك تتبع وحل الاستثناءات (Live Exceptions Resolution)</h2>
                <p className="text-xs text-stone-400 mt-1">تتبع الاستثناءات المعلقة الناتجة عن الأوزان المتعارضة، مخالفة شروط المواد، تعارض الناقلين، وحلها بقرارات موثقة رقابياً.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExceptionStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    exceptionStatusFilter === 'ALL'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-50 text-stone-600 border border-stone-200'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setExceptionStatusFilter('OPEN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    exceptionStatusFilter === 'OPEN'
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-stone-50 text-stone-600 border border-stone-200'
                  }`}
                >
                  معلقة (OPEN)
                </button>
                <button
                  onClick={() => setExceptionStatusFilter('UNDER_REVIEW')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    exceptionStatusFilter === 'UNDER_REVIEW'
                      ? 'bg-amber-50 border border-amber-200 text-amber-700'
                      : 'bg-stone-50 text-stone-600 border border-stone-200'
                  }`}
                >
                  قيد المراجعة (UNDER_REVIEW)
                </button>
                <button
                  onClick={() => setExceptionStatusFilter('RESOLVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    exceptionStatusFilter === 'RESOLVED'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-stone-50 text-stone-600 border border-stone-200'
                  }`}
                >
                  تمت المعالجة (RESOLVED)
                </button>
                <button
                  onClick={() => setExceptionStatusFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    exceptionStatusFilter === 'REJECTED'
                      ? 'bg-stone-100 border border-stone-300 text-stone-600'
                      : 'bg-stone-50 text-stone-600 border border-stone-200'
                  }`}
                >
                  مرفوضة (REJECTED)
                </button>
              </div>
            </div>

            {/* Exceptions Grid Layout */}
            {filteredExceptions.length === 0 ? (
              <div className="py-16 text-center text-stone-400 font-bold flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                <span>نظام نظيف! لا توجد حالياً أي استثناءات معلقة تطابق الفلاتر.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {filteredExceptions.map(exc => (
                  <div 
                    key={exc.exceptionId} 
                    className={`border rounded-2xl p-5 shadow-3xs flex flex-col justify-between gap-4 transition-all ${
                      exc.status === 'OPEN' ? 'bg-rose-50/20 border-rose-200' :
                      exc.status === 'UNDER_REVIEW' ? 'bg-amber-50/20 border-amber-200' :
                      exc.status === 'RESOLVED' ? 'bg-emerald-50/10 border-emerald-200/80' :
                      'bg-stone-50/40 border-stone-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black bg-stone-900 text-white px-2 py-0.5 rounded-md">
                          {exc.exceptionId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exc.severity === 'BLOCKING' || exc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            exc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {exc.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            exc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            exc.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                            exc.status === 'OPEN' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
                          }`}>
                            {exc.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-stone-800 text-xs">{exc.type}</h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-medium mt-1">{exc.description}</p>
                      
                      <div className="flex items-center gap-4 text-[10px] text-stone-400 pt-1.5">
                        <span>المشروع: <strong className="text-stone-600">{exc.projectId}</strong></span>
                        <span>الرحلة المسببة: <strong className="text-stone-600 font-mono">{exc.tripId}</strong></span>
                      </div>
                    </div>

                    {exc.resolutionNote ? (
                      <div className="mt-2 p-3 bg-stone-50 border border-stone-200/60 rounded-xl text-xs text-stone-700">
                        <strong className="text-stone-900 block font-bold">ملاحظات المعالجة والاعتماد:</strong>
                        <p className="mt-1 leading-normal font-semibold">{exc.resolutionNote}</p>
                        <span className="text-[10px] text-stone-400 block mt-1.5">تمت بواسطة: {exc.reviewedBy || 'مدير النظام'}</span>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-dashed border-stone-200 flex items-center justify-end gap-2">
                        {exc.status === 'OPEN' && (
                          <button
                            onClick={() => {
                              exceptionEngine.startReview({
                                exceptionId: exc.exceptionId,
                                actorId: authContext.userId,
                                actorName: authContext.displayName,
                                actorRole: authContext.role,
                                notes: 'بدء المراجعة والتحقيق من قبل لوحة الإدارة'
                              });
                              showBanner("تم تحويل حالة الاستثناء إلى (قيد المراجعة).");
                            }}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            بدء المراجعة
                          </button>
                        )}
                        {(exc.status === 'OPEN' || exc.status === 'UNDER_REVIEW') && (
                          <>
                            <button
                              onClick={() => {
                                setClinicalReasonNotes('');
                                setResolvingException(exc);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              حل وقبول الاستثناء
                            </button>
                            <button
                              onClick={() => {
                                setClinicalReasonNotes('');
                                setRejectingException(exc);
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              رفض الاستثناء
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: IMMUTABLE AUDIT LOGS */}
      {/* ==================================================================== */}
      {activeSection === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">سجل التدقيق الشامل غير القابل للتعديل (Immutable Security & System Logs)</h2>
              <p className="text-xs text-stone-400 mt-1">تتبع كافة العمليات والاعتمادات وتعديل وثائق الصلاحيات المسجلة برمجياً في Firestore مع تفاصيل الحقول المعدلة (Delta).</p>
            </div>

            {/* Advanced Multi-Filter controls */}
            <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-stone-600">فلترة بالمنفذ</label>
                <select
                  value={auditUserFilter}
                  onChange={(e) => setAuditUserFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">كافة المنفذين</option>
                  {uniqueAuditActors.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">فلترة بالمشروع</label>
                <select
                  value={auditProjectFilter}
                  onChange={(e) => setAuditProjectFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">كافة المشاريع</option>
                  {projects.map(p => (
                    <option key={p.projectId} value={p.projectId}>{p.nameAr || p.nameEn}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">نوع الإجراء</label>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">كافة الإجراءات</option>
                  <option value="CREATE">إنشاء (CREATE)</option>
                  <option value="UPDATE">تعديل (UPDATE)</option>
                  <option value="DELETE">حذف (DELETE)</option>
                  <option value="FORCE_STATUS_CHANGE">تغيير حالة جبري</option>
                  <option value="RECONCILE">معالجة استثناء</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">نوع الكيان</label>
                <select
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-bold text-stone-800 focus:outline-none"
                >
                  <option value="ALL">كافة الكيانات</option>
                  {uniqueAuditEntities.map(en => (
                    <option key={en} value={en}>{en}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">من تاريخ</label>
                <input
                  type="date"
                  value={auditDateStart}
                  onChange={(e) => setAuditDateStart(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-600">إلى تاريخ</label>
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
                    <th className="py-3 px-4">رقم القيد والتاريخ</th>
                    <th className="py-3 px-4">المنفذ</th>
                    <th className="py-3 px-4">المستهدف</th>
                    <th className="py-3 px-4">نوع الإجراء</th>
                    <th className="py-3 px-4">الحقول المعدلة (Delta)</th>
                    <th className="py-3 px-4 text-left">التفاصيل الكاملة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400 font-medium">
                        لا توجد قيود مطابقة لمعايير البحث والتدقيق الحالية.
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
                                {log.createdAt ? new Date(log.createdAt as any).toLocaleString('ar-SA') : '—'}
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
                                {isExpanded ? 'إخفاء' : 'عرض البيانات (JSON)'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded row showing details json inspector */}
                          {isExpanded && (
                            <tr className="bg-stone-50">
                              <td colSpan={6} className="p-4">
                                <div className="bg-stone-900 text-stone-100 rounded-xl p-4 font-mono text-[11px] space-y-3 shadow-inner">
                                  <div className="flex justify-between items-center text-stone-400 border-b border-stone-800 pb-2">
                                    <span>مفتش البيانات الوصفية (Audit Payload Inspector)</span>
                                    <span>ID: {log.auditLogId}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-amber-400 block mb-1">البيانات السابقة (Before):</span>
                                      <pre className="overflow-x-auto max-h-[150px] p-2 bg-stone-950 rounded-lg text-stone-300">
                                        {JSON.stringify(log.changes?.before, null, 2) || 'null'}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-emerald-400 block mb-1">البيانات اللاحقة (After):</span>
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
      {userApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="pb-3 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">اعتماد طلب تفويض الحساب</h3>
                <p className="text-xs text-stone-400 mt-1">تأكيد تفعيل الحساب وتحديد الدور والمشاريع المسموحة له.</p>
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
                <span className="text-stone-400 text-[10px] block font-bold">الموظف المراد اعتماده</span>
                <span className="font-bold text-sm text-stone-900 block mt-0.5">{userApprovalModal.fullName}</span>
                <span className="font-mono text-[11px] text-stone-500 block">{userApprovalModal.email}</span>
              </div>

              {/* Role select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">تخصيص الدور الوظيفي (Assign Security Role)</label>
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
                  <option value="FINANCE_AUDITOR">FINANCE_AUDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              {/* Projects checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">إسناد المشاريع المحددة (Assigned Projects Whitelist)</label>
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
                إلغاء التراجع
              </button>
              <button
                onClick={handleApproveUserConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد وتفعيل المستخدم</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REJECTION CONFIG MODAL */}
      {/* ==================================================================== */}
      {userRejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="pb-3 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">رفض طلب تفويض الحساب</h3>
                <p className="text-xs text-stone-400 mt-1">الرجاء إدخال تبرير الحوكمة لرفض طلب التسجيل.</p>
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
                <span className="text-stone-400 text-[10px] block font-bold">المستخدم</span>
                <span className="font-bold text-stone-800">{userRejectionModal.fullName}</span>
                <span className="font-mono text-stone-400 block mt-0.5">{userRejectionModal.email}</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">سبب الرفض الرقابي (حقل إلزامي)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: الحساب لا يتبع لأي من مقاولي المشاريع الحالية أو لم يتم التحقق من بطاقته الوظيفية..."
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
                إلغاء التراجع
              </button>
              <button
                onClick={handleRejectUserConfirm}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>تأكيد رفض طلب الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EXCEPTIONS RESOLUTION MODAL */}
      {/* ==================================================================== */}
      {resolvingException && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="pb-3 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">حل وقبول الاستثناء التشغيلي</h3>
                <p className="text-xs text-stone-400 mt-1">الرجاء إدخال القرار الإداري والتبرير الرقابي لمعالجة هذا الاستثناء.</p>
              </div>
              <button 
                onClick={() => setResolvingException(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl">
                <span className="text-stone-400 text-[10px] block font-bold">الاستثناء المراد حله</span>
                <span className="font-bold text-stone-800 block">{resolvingException.exceptionId} | {resolvingException.type}</span>
                <p className="mt-1 font-semibold text-stone-600 leading-relaxed">{resolvingException.description}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">ملاحظات وقرار المعالجة التفصيلية (حقل إلزامي)</label>
                <textarea
                  value={clinicalReasonNotes}
                  onChange={(e) => setClinicalReasonNotes(e.target.value)}
                  placeholder="اكتب التبرير الفني والقرار الذي تم اتخاذه..."
                  rows={4}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setResolvingException(null)}
                className="px-4 py-2 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                onClick={handleResolveException}
                disabled={!clinicalReasonNotes.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                <span>اعتماد حل الاستثناء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EXCEPTIONS REJECTION MODAL */}
      {/* ==================================================================== */}
      {rejectingException && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="pb-3 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">رفض معالجة الاستثناء التشغيلي</h3>
                <p className="text-xs text-stone-400 mt-1">الرجاء إدخال أسباب رفض المعالجة والتبرير الإداري المانع.</p>
              </div>
              <button 
                onClick={() => setRejectingException(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl">
                <span className="text-stone-400 text-[10px] block font-bold">الاستثناء المراد رفض حله</span>
                <span className="font-bold text-stone-800 block">{rejectingException.exceptionId} | {rejectingException.type}</span>
                <p className="mt-1 font-semibold text-stone-600 leading-relaxed">{rejectingException.description}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">أسباب الرفض بالتفصيل (حقل إلزامي)</label>
                <textarea
                  value={clinicalReasonNotes}
                  onChange={(e) => setClinicalReasonNotes(e.target.value)}
                  placeholder="اكتب أسباب رفض المعالجة الفنية..."
                  rows={4}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRejectingException(null)}
                className="px-4 py-2 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                onClick={handleRejectException}
                disabled={!clinicalReasonNotes.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض واعتماد الاستبعاد الإداري</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
