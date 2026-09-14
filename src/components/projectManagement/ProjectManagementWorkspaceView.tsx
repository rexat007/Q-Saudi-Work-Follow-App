import React, { useState, useEffect } from 'react';
import { Building2, Boxes, Briefcase, Plus, Search, Filter, ShieldAlert, ArrowLeft } from 'lucide-react';
import { MasterDataView } from '../masterData/MasterDataView';
import { ProjectSetupWizard } from '../wizard/ProjectSetupWizard';
import { useI18n } from '../../i18n';
import { AuthUserContext } from '../../types/common';
import { projectRepository } from '../../repositories/project.repository';
import { ProjectEntity } from '../../types/entities';

export interface ProjectManagementWorkspaceViewProps {
  authContext?: AuthUserContext;
}

export const ProjectManagementWorkspaceView: React.FC<ProjectManagementWorkspaceViewProps> = ({ authContext }) => {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<'PROJECT_LIST' | 'PROJECT_WIZARD' | 'PROJECT_DETAILS' | 'MASTER_DATA'>('PROJECT_LIST');
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const allowedRoles = ['SUPER_ADMIN', 'PROJECT_ADMIN'];
  const isAuthorized = authContext && allowedRoles.includes(authContext.role);
  const isSuperAdmin = authContext?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isAuthorized && authContext) {
      loadProjects();
    }
  }, [isAuthorized, authContext]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectRepository.listAll(authContext?.assignedProjectIds, isSuperAdmin);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-rose-900 mb-2">غير مصرح بالدخول (Unauthorized)</h2>
        <p className="text-sm text-rose-600 mb-4">
          عذراً، هذه الواجهة مخصصة لإدارة المشاريع فقط.
        </p>
      </div>
    );
  }

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveView('PROJECT_DETAILS');
  };

  const selectedProject = projects.find(p => p.projectId === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Workspace Header & Navigation */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <Briefcase className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">إدارة المشاريع والبيانات الرئيسية</h2>
            <p className="text-xs text-stone-500">مراقبة المشاريع، وإدارة الصلاحيات، والبيانات الأساسية</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveView('PROJECT_LIST')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'PROJECT_LIST' || activeView === 'PROJECT_DETAILS' || activeView === 'PROJECT_WIZARD' ? 'bg-white shadow-sm text-amber-700' : 'text-stone-600 hover:bg-stone-200'}`}
          >
            <Building2 className="w-4 h-4" />
            <span>المشاريع</span>
          </button>
          <button 
            onClick={() => setActiveView('MASTER_DATA')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'MASTER_DATA' ? 'bg-white shadow-sm text-indigo-700' : 'text-stone-600 hover:bg-stone-200'}`}
          >
            <Boxes className="w-4 h-4" />
            <span>البيانات الرئيسية (Master Data)</span>
          </button>
        </div>
      </div>

      {/* Workspace Content */}
      {activeView === 'PROJECT_LIST' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="البحث في المشاريع..." 
                className="pl-4 pr-9 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-64"
              />
            </div>
            {isSuperAdmin && (
              <button 
                onClick={() => setActiveView('PROJECT_WIZARD')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء مشروع جديد</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-stone-500">جاري التحميل...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-stone-500">لا توجد مشاريع مسجلة.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <div 
                  key={project.projectId} 
                  onClick={() => handleOpenProject(project.projectId)}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-amber-300 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-stone-900 group-hover:text-amber-700 transition-colors">{project.nameAr || project.nameEn}</div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-mono mb-4">{project.projectCode || project.projectId}</div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100">
                    <div>
                      <div className="text-[10px] text-stone-500 mb-1">العميل</div>
                      <div className="text-sm font-bold text-stone-900 line-clamp-1">{project.clientName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-500 mb-1">الحالة</div>
                      <div className="text-sm font-bold text-stone-900">{project.status === 'ACTIVE' ? 'نشط' : 'متوقف'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'PROJECT_WIZARD' && isSuperAdmin && (
        <div>
          <div className="mb-4">
            <button 
              onClick={() => setActiveView('PROJECT_LIST')}
              className="text-stone-500 hover:text-stone-800 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة لقائمة المشاريع
            </button>
          </div>
          <ProjectSetupWizard />
        </div>
      )}

      {activeView === 'PROJECT_DETAILS' && selectedProject && (
        <div className="space-y-4">
          <div className="mb-4">
            <button 
              onClick={() => setActiveView('PROJECT_LIST')}
              className="text-stone-500 hover:text-stone-800 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة لقائمة المشاريع
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-stone-900">{selectedProject.nameAr}</h3>
                <p className="text-sm text-stone-500">{selectedProject.nameEn}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedProject.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
              }`}>
                {selectedProject.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-stone-900 mb-3 border-b border-stone-100 pb-2">التفاصيل الأساسية</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">كود المشروع:</dt>
                    <dd className="font-mono font-bold text-stone-900">{selectedProject.projectCode || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">العميل:</dt>
                    <dd className="font-bold text-stone-900">{selectedProject.clientName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">الرقم الضريبي:</dt>
                    <dd className="font-mono text-stone-900">{selectedProject.settings?.zatcaTaxNumber || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">تاريخ البدء:</dt>
                    <dd className="text-stone-900">{selectedProject.startDate || '-'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-900 mb-3 border-b border-stone-100 pb-2">الإعدادات التشغيلية</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">السماح للسائقين بالتوجه الذاتي:</dt>
                    <dd className="font-bold text-stone-900">{selectedProject.settings?.allowDriverSelfDispatch ? 'نعم' : 'لا'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">نسبة الضريبة:</dt>
                    <dd className="font-mono text-stone-900">{selectedProject.settings?.vatRatePercent || 15}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">نطاق السياج الجغرافي:</dt>
                    <dd className="text-stone-900">{selectedProject.location?.geoFenceRadiusMeters || '-'} متر</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Restricted operations */}
            <div className="mt-8 pt-6 border-t border-stone-100 flex gap-3">
              <button 
                className="px-4 py-2 rounded-lg bg-stone-100 text-stone-500 text-xs font-bold cursor-not-allowed"
                title="تعديل خصائص المشروع محمي بواسطة الإدارة المركزية"
              >
                تعديل المشروع
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'MASTER_DATA' && (
        <MasterDataView />
      )}
    </div>
  );
};
