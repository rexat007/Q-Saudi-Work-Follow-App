import React, { useState } from 'react';
import { 
  Building2, 
  Boxes, 
  Scale, 
  FileText, 
  LayoutDashboard, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Users, 
  FolderSync, 
  CircleDollarSign, 
  Truck, 
  ChevronDown, 
  Database, 
  Lock, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { NavTabId, navigationService } from '../../services/navigation.service';
import { UserRole } from '../../types/common';
import { ProjectEntity } from '../../types/entities';
import { useI18n } from '../../i18n';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tabId: NavTabId) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  projects: ProjectEntity[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  activeWorkspaceTab: string;
  onSelectWorkspaceTab: (tab: string) => void;
  onOpenSystemTools: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  onChangeRole,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  activeWorkspaceTab,
  onSelectWorkspaceTab,
  onOpenSystemTools,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { direction, t } = useI18n();
  const isRtl = direction === 'rtl';

  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  const roleProfile = navigationService.getRoleProfile(currentRole);
  const authorizedPrimaryTabs = navigationService.getAuthorizedPrimaryTabs(currentRole);
  const authorizedTools = navigationService.getAuthorizedSystemTools(currentRole);

  const getTabIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Scale': return <Scale className={`${className} text-amber-500`} />;
      case 'Building2': return <Building2 className={`${className} text-indigo-500`} />;
      case 'Boxes': return <Boxes className={`${className} text-amber-500`} />;
      case 'LayoutDashboard': return <LayoutDashboard className={`${className} text-emerald-500`} />;
      case 'FileText': return <FileText className={`${className} text-blue-500`} />;
      default: return <Boxes className={`${className} text-stone-500`} />;
    }
  };

  const getWorkspaceTabIcon = (tabId: string, className = "w-3.5 h-3.5") => {
    switch (tabId) {
      case 'data': return <Database className={`${className} text-indigo-400`} />;
      case 'carriers': return <Building2 className={`${className} text-amber-400`} />;
      case 'drivers': return <Truck className={`${className} text-cyan-400`} />;
      case 'materials': return <Boxes className={`${className} text-orange-400`} />;
      case 'pricing': return <CircleDollarSign className={`${className} text-emerald-400`} />;
      case 'access': return <Users className={`${className} text-purple-400`} />;
      case 'google': return <FolderSync className={`${className} text-[#4285F4]`} />;
      default: return <Database className={`${className} text-stone-400`} />;
    }
  };

  const getWorkspaceTabLabel = (tabId: string) => {
    switch (tabId) {
      case 'data': return isRtl ? 'بيانات المشروع' : 'Project Data';
      case 'carriers': return isRtl ? 'المقاولين والناقلين' : 'Project Carriers';
      case 'drivers': return isRtl ? 'السائقين والشاحنات' : 'Drivers & Trucks Roster';
      case 'materials': return isRtl ? 'المواد المعتمدة' : 'Approved Materials';
      case 'pricing': return isRtl ? 'اتفاقيات الأسعار' : 'Pricing Rules';
      case 'access': return isRtl ? 'صلاحيات الوصول' : 'Project Access';
      case 'google': return isRtl ? 'تكامل Google Workspace' : 'Google Integration';
      default: return '';
    }
  };

  const workspaceTabs = ['data', 'carriers', 'drivers', 'materials', 'pricing', 'access', 'google'];

  // Safe navigation switch
  const handleSelectTab = (tabId: NavTabId) => {
    onSelectTab(tabId);
  };

  const selectedProject = projects.find(p => p.projectId === selectedProjectId);

  return (
    <aside 
      id="main-sidebar"
      className={`hidden lg:flex flex-col bg-[#0b0e12] border-white/10 shrink-0 select-none transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${
        isRtl ? 'border-l' : 'border-r'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Sidebar Header with branding & collapse toggle */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#11141a]">
        <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
          <div className="w-8 h-8 bg-[#10b981] text-[#0f1115] flex items-center justify-center font-black font-display text-base shadow-md">
            Q
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black font-display tracking-tight text-white uppercase truncate">Q-Saudi Core</h2>
            <span className="text-[9px] text-[#10b981] font-mono tracking-wider block">INDUSTRIAL_FSM</span>
          </div>
        </div>

        <button
          type="button"
          id="btn-sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-white/5 text-white/50 hover:text-white rounded-lg transition-colors focus:outline-hidden"
          title={isCollapsed ? (isRtl ? 'توسيع' : 'Expand') : (isRtl ? 'طي' : 'Collapse')}
        >
          {isCollapsed ? (
            isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Role Profile Switcher */}
      <div className={`p-3 border-b border-white/10 bg-[#12161e] ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div 
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${roleProfile.badgeColor}`}
            title={`${currentRole}: ${roleProfile.userNameAr}`}
          >
            {currentRole.substring(0, 2)}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <span>ROLE PROFILE</span>
              </span>
              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${roleProfile.badgeColor}`}>
                {currentRole}
              </span>
            </div>
            <select
              id="sidebar-role-selector"
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                onChangeRole(newRole);
              }}
              className="w-full bg-[#0b0e12] border border-white/10 rounded px-2 py-1 text-[11px] font-bold font-mono text-white focus:outline-hidden focus:border-[#10b981]"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (مشرف عام)</option>
              <option value="PROJECT_ADMIN">PROJECT_ADMIN (مدير مشروع)</option>
              <option value="SUPERVISOR">SUPERVISOR (مشرف ميداني)</option>
              <option value="SITE_SUPERVISOR">SITE_SUPERVISOR (مشرف تفريغ)</option>
              <option value="DISPATCHER">DISPATCHER (مرحل حركة)</option>
              <option value="SCALE_OPERATOR">SCALE_OPERATOR (مشغل ميزان)</option>
              <option value="FINANCE_AUDITOR">FINANCE_AUDITOR (مدقق مالي)</option>
              <option value="DRIVER">DRIVER (سائق شاحنة)</option>
              <option value="VIEWER">VIEWER (مستعرض فقط)</option>
            </select>
            <div className="text-[10px] font-mono text-white/50 leading-snug truncate" title={roleProfile.userNameAr}>
              {roleProfile.userNameAr}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 [scrollbar-width:thin]">
        {/* Navigation Core Tabs */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/30 mb-2 px-2">
              {isRtl ? 'أقسام النظام الأساسية' : 'OPERATIONAL SUITE'}
            </div>
          )}

          {authorizedPrimaryTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id.toLowerCase().replace(/_/g, '-')}`}
                onClick={() => handleSelectTab(tab.id)}
                className={`w-full flex items-center rounded-lg transition-all border font-mono group relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2 text-xs'
                } ${
                  isSelected
                    ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 font-bold'
                    : 'bg-transparent text-white/60 hover:text-white border-transparent hover:bg-white/5'
                }`}
                title={isCollapsed ? tab.titleAr : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getTabIcon(tab.icon, "w-4 h-4 shrink-0 transition-transform group-hover:scale-105")}
                  {!isCollapsed && <span className="truncate">{tab.titleAr}</span>}
                </div>

                {!isCollapsed && tab.badgeAr && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                    isSelected ? 'bg-[#10b981] text-[#0f1115]' : 'bg-white/10 text-white/60'
                  }`}>
                    {tab.badgeAr}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Project Centric Workspace Submenu Section */}
        {(currentRole === 'SUPER_ADMIN' || currentRole === 'PROJECT_ADMIN') && (
          <div className="pt-2 border-t border-white/5 space-y-1">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/30">
                  {isRtl ? 'مساحة عمل المشاريع' : 'PROJECT WORKSPACE'}
                </span>
                <button
                  type="button"
                  id="sidebar-btn-project-expand"
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="p-0.5 hover:bg-white/5 text-white/30 hover:text-white rounded transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isProjectsExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

            {isProjectsExpanded && !isCollapsed && (
              <div className="space-y-1 mb-2 px-1">
                {/* Create Project Fast Action */}
                <button
                  type="button"
                  id="sidebar-btn-create-project-wizard"
                  onClick={() => {
                    handleSelectTab('WIZARD');
                    setSelectedProjectId(''); // Reset project selection to trigger dashboard creation mode
                  }}
                  className="w-full flex items-center justify-start gap-2 p-2 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 text-[11px] font-bold border border-amber-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? 'تأسيس مشروع جديد (Wizard)' : 'Provision New Project'}</span>
                </button>

                {/* Project selector dropdown/list */}
                {projects.length === 0 ? (
                  <div className="p-2 text-[10px] text-white/30 italic text-center">
                    {isRtl ? 'لا يوجد مشاريع مضافة' : 'No projects found'}
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-2">
                    <label className="text-[9px] font-mono text-white/40 block px-1">
                      {isRtl ? 'المشروع النشط:' : 'ACTIVE LOGISTICS SCOPE:'}
                    </label>
                    <select
                      id="sidebar-project-quick-selector"
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        handleSelectTab('WIZARD'); // Go to project setup tab to view workspace
                      }}
                      className="w-full bg-[#0f1115] border border-white/10 rounded px-2 py-1.5 text-xs font-bold font-mono text-white focus:outline-hidden focus:border-[#10b981] mb-2"
                    >
                      <option value="" disabled>{isRtl ? 'اختر المشروع لوجستي' : 'Select Project...'}</option>
                      {projects.map((p) => (
                        <option key={p.projectId} value={p.projectId}>
                          {p.nameAr} ({p.status})
                        </option>
                      ))}
                    </select>

                    {/* Active Selected Project Workspace Sub-Tree */}
                    {selectedProject && (
                      <div className="space-y-1 border-l border-white/10 pl-2 ml-1 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2 rtl:mr-1 rtl:ml-0 mt-2">
                        <div className="px-1.5 py-1 text-[10px] text-[#10b981] font-mono tracking-widest font-black uppercase truncate bg-[#10b981]/5 border border-[#10b981]/15 mb-2">
                          #{selectedProject.projectCode || selectedProject.projectId}
                        </div>

                        {workspaceTabs.map((tab) => {
                          const isTabSelected = activeTab === 'WIZARD' && selectedProjectId !== '' && activeWorkspaceTab === tab;
                          return (
                            <button
                              key={tab}
                              id={`sidebar-subtab-${tab}`}
                              onClick={() => {
                                handleSelectTab('WIZARD');
                                onSelectWorkspaceTab(tab);
                              }}
                              className={`w-full text-right px-2 py-1.5 rounded-md text-[11px] font-mono transition-all flex items-center gap-2 ${
                                isTabSelected 
                                  ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 font-bold shadow-xs' 
                                  : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
                              }`}
                            >
                              {getWorkspaceTabIcon(tab)}
                              <span className="truncate">{getWorkspaceTabLabel(tab)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* System & Developer secondary tools section */}
        {authorizedTools.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              id="sidebar-btn-system-tools"
              onClick={onOpenSystemTools}
              className={`w-full flex items-center rounded-lg bg-[#151921] border border-[#10b981]/20 text-[#10b981] font-mono font-bold hover:bg-[#10b981]/10 transition-colors ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2 text-xs'
              }`}
              title={isCollapsed ? 'أدوات النظام والمطورين' : undefined}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{isRtl ? 'أدوات النظام' : 'System Tools'}</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#10b981]/20 text-[#10b981]">
                  {authorizedTools.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/5 bg-[#090b0e] text-[10px] font-mono text-white/30 text-center">
          <div>SSOT_ACTIVE</div>
          <div className="text-[8px] text-white/20 mt-0.5">VITE_PROD_DEPLOYED</div>
        </div>
      )}
    </aside>
  );
};
