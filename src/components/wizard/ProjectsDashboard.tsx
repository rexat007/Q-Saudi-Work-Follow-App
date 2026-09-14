import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Layers, 
  FolderSync,
  Briefcase,
  ExternalLink,
  Sliders,
  Check,
  X,
  FileText
} from 'lucide-react';
import { ProjectEntity } from '../../types/entities';
import { useI18n } from '../../i18n';
import { AuthUserContext } from '../../types/common';
import { projectService } from '../../services/project.service';

interface ProjectsDashboardProps {
  projects: ProjectEntity[];
  authContext: AuthUserContext;
  onStartCreate: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  authContext,
  onStartCreate,
}) => {
  const { t, isRTL } = useI18n();
  const [selectedProject, setSelectedProject] = useState<ProjectEntity | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectEntity | null>(null);
  const [viewingProject, setViewingProject] = useState<ProjectEntity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields for editing
  const [editNameAr, setEditNameAr] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectEntity['status']>('ACTIVE');
  const [editVatRate, setEditVatRate] = useState(15);
  const [editZatcaTax, setEditZatcaTax] = useState('');

  // Open Edit Modal
  const handleOpenEdit = (p: ProjectEntity) => {
    setEditingProject(p);
    setEditNameAr(p.nameAr);
    setEditClientName(p.clientName || '');
    setEditDescription(p.description || '');
    setEditStatus(p.status);
    setEditVatRate(p.settings?.vatRatePercent ?? 15);
    setEditZatcaTax(p.settings?.zatcaTaxNumber || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updates: Partial<ProjectEntity> = {
        nameAr: editNameAr.trim(),
        clientName: editClientName.trim(),
        description: editDescription.trim(),
        status: editStatus,
        settings: {
          ...editingProject.settings,
          vatRatePercent: Number(editVatRate),
          zatcaTaxNumber: editZatcaTax.trim()
        }
      };

      await projectService.updateProject(editingProject.projectId, updates, authContext);
      setSuccessMsg(isRTL ? 'تم تحديث المشروع بنجاح' : 'Project updated successfully');
      setEditingProject(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating project');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (p: ProjectEntity, nextStatus: ProjectEntity['status']) => {
    try {
      await projectService.updateProject(p.projectId, { status: nextStatus }, authContext);
    } catch (err: any) {
      alert(err.message || 'Error changing status');
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    const confirmText = isRTL 
      ? 'هل أنت متأكد من حذف هذا المشروع نهائياً؟ ستفقد جميع تهيئات المواد والناقلين المرتبطة.' 
      : 'Are you sure you want to permanently delete this project? All associated materials and carriers setup will be deleted.';
    
    if (window.confirm(confirmText)) {
      try {
        await projectService.deleteProject(projectId, authContext);
      } catch (err: any) {
        alert(err.message || 'Error deleting project');
      }
    }
  };

  // Helper calculation for readiness metrics
  const getReadinessMetrics = (p: ProjectEntity) => {
    const carrierCount = p.authorizedCarrierIds?.length ?? 0;
    const materialCount = p.authorizedMaterialIds?.length ?? 0;
    const isMasterDataReady = carrierCount > 0 && materialCount > 0;
    const isOperationalReady = p.status === 'ACTIVE' && isMasterDataReady;

    return {
      carrierCount,
      materialCount,
      isMasterDataReady,
      isOperationalReady
    };
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-500" />
            <span>{isRTL ? 'لوحة إدارة ومتابعة المشاريع' : 'Projects Operations Center'}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {isRTL 
              ? 'مراقبة جاهزية مشاريع النقل واللوجستيات المعتمدة وتحديث حالتها التشغيلية' 
              : 'Monitor logistics readiness and manage master settings for live projects'}
          </p>
        </div>

        {(authContext.role === 'SUPER_ADMIN' || authContext.role === 'PROJECT_ADMIN') && (
          <button
            type="button"
            id="btn-projects-dashboard-create"
            onClick={onStartCreate}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'تهيئة مشروع جديد (Wizard)' : 'Setup New Project'}</span>
          </button>
        )}
      </div>

      {/* Main List Grid */}
      {projects.length === 0 ? (
        <div className="border border-stone-800 bg-stone-950 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-stone-900 border border-stone-800 text-stone-500 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">NO PROJECTS</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              {isRTL 
                ? 'لا يوجد أي مشاريع نشطة حالياً في النظام. يجب تهيئة وتأسيس أول مشروع لوجستي للبدء.' 
                : 'No active projects found. You must provision a project using the Wizard to start operations.'}
            </p>
          </div>
          {(authContext.role === 'SUPER_ADMIN' || authContext.role === 'PROJECT_ADMIN') && (
            <button
              type="button"
              id="btn-empty-state-create"
              onClick={onStartCreate}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'تأسيس مشروع جديد الآن' : 'CREATE PROJECT'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const metrics = getReadinessMetrics(p);
            return (
              <div 
                key={p.projectId}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between hover:border-stone-700 transition-all shadow-xs relative overflow-hidden group"
              >
                {/* Status Indicator pill */}
                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    p.status === 'ACTIVE' 
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                      : p.status === 'SUSPENDED'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                      : 'bg-stone-950 text-stone-500 border-stone-800'
                  }`}>
                    {p.status}
                  </span>
                </div>

                {/* Body Content */}
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-stone-500 uppercase font-bold">
                      {p.projectCode || p.projectId}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {p.nameAr}
                    </h3>
                  </div>

                  {/* Attributes Section */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-stone-800 text-[11px] text-stone-400">
                    <div>
                      <span className="block text-stone-500 text-[10px]">{isRTL ? 'العميل' : 'Client'}</span>
                      <span className="font-bold text-stone-200 truncate block">{p.clientName}</span>
                    </div>
                    <div>
                      <span className="block text-stone-500 text-[10px]">{isRTL ? 'رقم المشروع' : 'Project No.'}</span>
                      <span className="font-mono text-stone-200 font-bold block">
                        #{p.projectNumber || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Readiness status bar */}
                  <div className="space-y-2 text-[11px]">
                    {/* Master Data status */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-stone-500" />
                        <span>{isRTL ? 'جاهزية البيانات الأساسية' : 'Master Data Readiness'}</span>
                      </span>
                      <span className={`flex items-center gap-1 font-bold ${metrics.isMasterDataReady ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {metrics.isMasterDataReady ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRTL ? 'جاهز' : 'Ready'} ({metrics.carrierCount} ناقل / {metrics.materialCount} مواد)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRTL ? 'غير مكتمل' : 'Incomplete'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Operational setup status */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
                        <span>{isRTL ? 'الجاهزية التشغيلية' : 'Operational Readiness'}</span>
                      </span>
                      <span className={`flex items-center gap-1 font-bold ${metrics.isOperationalReady ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {metrics.isOperationalReady ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRTL ? 'جاهز للتشغيل' : 'Ready'}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{isRTL ? 'انتظار التهيئة' : 'Pending'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="mt-5 pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                    <Calendar className="w-3 h-3" />
                    <span>{p.startDate || '—'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingProject(p)}
                      className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-lg transition-colors"
                      title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {(authContext.role === 'SUPER_ADMIN' || authContext.role === 'PROJECT_ADMIN') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded-lg transition-colors"
                          title={isRTL ? 'تعديل البيانات' : 'Edit Project'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.projectId)}
                          className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-rose-500 rounded-lg transition-colors"
                          title={isRTL ? 'حذف المشروع' : 'Delete Project'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: VIEW DETAILS ================= */}
      {viewingProject && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 uppercase tracking-widest">
                  {viewingProject.projectCode || viewingProject.projectId}
                </span>
                <h3 className="text-base font-black text-white">{viewingProject.nameAr}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setViewingProject(null)}
                className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-stone-300">
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-stone-950 p-4 rounded-xl border border-stone-800/80">
                <div>
                  <span className="block text-[10px] text-stone-500 font-bold uppercase">{isRTL ? 'العميل المستفيد' : 'Client'}</span>
                  <span className="text-sm font-bold text-white">{viewingProject.clientName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 font-bold uppercase">{isRTL ? 'رقم المشروع التشغيلي' : 'Ops Project No.'}</span>
                  <span className="text-sm font-mono font-bold text-white">#{viewingProject.projectNumber || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 font-bold uppercase">{isRTL ? 'تاريخ التأسيس' : 'Created Date'}</span>
                  <span className="text-sm font-bold text-white">{viewingProject.startDate || '—'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="block text-[10px] text-stone-500 font-bold uppercase">{isRTL ? 'وصف المشروع ونطاق العمل' : 'Scope Description'}</span>
                <p className="bg-stone-950 p-3 rounded-lg border border-stone-850 leading-relaxed text-stone-300 font-medium">
                  {viewingProject.description || (isRTL ? 'لا يوجد وصف مضاف لمجال العمل.' : 'No description provided.')}
                </p>
              </div>

              {/* Financial Config */}
              <div className="space-y-2">
                <span className="block text-[10px] text-stone-500 font-bold uppercase">{isRTL ? 'التكوين المالي والضريبي للمشروع' : 'Financial & Tax settings'}</span>
                <div className="grid grid-cols-2 gap-4 bg-stone-950 p-4 rounded-xl border border-stone-800/80">
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold">{isRTL ? 'نسبة الضريبة (VAT %)' : 'VAT Rate'}</span>
                    <span className="text-xs font-mono font-bold text-stone-200">{viewingProject.settings?.vatRatePercent ?? 15}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold">{isRTL ? 'الرقم الضريبي (ZATCA)' : 'ZATCA Tax Number'}</span>
                    <span className="text-xs font-mono font-bold text-stone-200">{viewingProject.settings?.zatcaTaxNumber || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Workspace Setup */}
              <div className="space-y-2">
                <span className="block text-[10px] text-stone-500 font-bold uppercase">{isRTL ? 'تهيئة ملفات Google Workspace' : 'Workspace Sync Folder'}</span>
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderSync className="w-8 h-8 text-amber-500 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">
                        {viewingProject.settings?.googleDriveProvisioning?.rootFolderName || 'أرشيف المشروع اللوجستي'}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 block truncate max-w-[280px]">
                        ID: {viewingProject.settings?.googleDriveFolderId || 'gdrive-folder-not-set'}
                      </span>
                    </div>
                  </div>
                  {viewingProject.settings?.googleDriveFolderId && (
                    <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg text-[10px] font-bold text-emerald-400">
                      {isRTL ? 'مفعل ومؤسس' : 'PROVISIONED'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-stone-800 flex items-center justify-end bg-stone-950">
              <button 
                type="button"
                onClick={() => setViewingProject(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition-colors"
              >
                {isRTL ? 'إغلاق النافذة' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PROJECT ================= */}
      {editingProject && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveEdit}
            className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>{isRTL ? `تحديث بيانات: ${editingProject.nameAr}` : 'Edit Project Specifications'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Project Name (Ar) */}
              <div className="space-y-1">
                <label className="block text-stone-400 font-bold">{isRTL ? 'اسم المشروع بالكامل' : 'Project Name'}</label>
                <input
                  type="text"
                  required
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="block text-stone-400 font-bold">{isRTL ? 'العميل المستفيد' : 'Client Name'}</label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-stone-400 font-bold">{isRTL ? 'حالة العمل الحالية' : 'Operational Status'}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectEntity['status'])}
                  className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden font-bold"
                >
                  <option value="ACTIVE">{isRTL ? 'ACTIVE (نشط)' : 'ACTIVE'}</option>
                  <option value="SUSPENDED">{isRTL ? 'SUSPENDED (معلق مؤقتاً)' : 'SUSPENDED'}</option>
                  <option value="PLANNING">{isRTL ? 'PLANNING (قيد التخطيط)' : 'PLANNING'}</option>
                  <option value="ARCHIVED">{isRTL ? 'ARCHIVED (مؤرشف ومغلق)' : 'ARCHIVED'}</option>
                </select>
              </div>

              {/* ZATCA Tax */}
              <div className="space-y-1">
                <label className="block text-stone-400 font-bold">{isRTL ? 'رقم تسجيل Zatca الضريبي (15 خانة)' : 'ZATCA Tax Registration'}</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={editZatcaTax}
                  onChange={(e) => setEditZatcaTax(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden font-mono font-bold"
                />
              </div>

              {/* VAT Rate */}
              <div className="space-y-1">
                <label className="block text-stone-400 font-bold">{isRTL ? 'نسبة الضريبة المطبقة (%)' : 'VAT Rate Percentage'}</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={editVatRate}
                  onChange={(e) => setEditVatRate(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden font-mono font-bold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-stone-400 font-bold">{isRTL ? 'وصف ونطاق المشروع' : 'Scope Specifications'}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full h-24 bg-stone-950 border border-stone-800 text-white rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-5 border-t border-stone-800 flex items-center justify-end gap-3 bg-stone-950">
              <button 
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
                disabled={isSaving}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                type="submit"
                id="btn-edit-project-save"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isRTL ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
