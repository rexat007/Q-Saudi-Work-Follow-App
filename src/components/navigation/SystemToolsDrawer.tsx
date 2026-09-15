import React, { useState } from 'react';
import { 
  X, 
  Search, 
  ShieldCheck, 
  FileSpreadsheet, 
  Truck, 
  AlertOctagon, 
  ShieldAlert, 
  Calculator, 
  Database, 
  Share2, 
  BookOpen, 
  Boxes, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';
import { NavTabId, NavItemDef, navigationService } from '../../services/navigation.service';
import { UserRole } from '../../types/common';
import { useI18n } from '../../i18n';

interface SystemToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTabId;
  onSelectTab: (tabId: NavTabId) => void;
  currentRole: UserRole;
}

export const SystemToolsDrawer: React.FC<SystemToolsDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentRole,
}) => {
  const { direction } = useI18n();
  const isRtl = direction === 'rtl';
  const [searchQuery, setSearchQuery] = useState('');
  const [showDevMode, setShowDevMode] = useState(true);

  if (!isOpen) return null;

  const prodTools = navigationService.getAuthorizedSystemTools(currentRole);
  const devTools = navigationService.getAuthorizedDeveloperTools(currentRole);

  const filterItem = (tool: NavItemDef) =>
    tool.titleAr.includes(searchQuery) ||
    tool.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.descriptionAr.includes(searchQuery);

  const filteredProdTools = prodTools.filter(filterItem);
  const filteredDevTools = devTools.filter(filterItem);

  const systemAdminTools = filteredProdTools.filter(t => t.category === 'SYSTEM_ADMIN');
  const auditSecurityTools = filteredProdTools.filter(t => t.category === 'AUDIT_SECURITY');
  const opsSupportTools = filteredProdTools.filter(t => t.category === 'OPERATIONS_SUPPORT');

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-[#10b981]" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-5 h-5 text-[#10b981]" />;
      case 'Truck': return <Truck className="w-5 h-5 text-[#10b981]" />;
      case 'AlertOctagon': return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'Calculator': return <Calculator className="w-5 h-5 text-blue-400" />;
      case 'Database': return <Database className="w-5 h-5 text-emerald-400" />;
      case 'Share2': return <Share2 className="w-5 h-5 text-[#10b981]" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-indigo-400" />;
      default: return <Boxes className="w-5 h-5 text-[#10b981]" />;
    }
  };

  const renderToolButton = (tool: NavItemDef) => {
    const isSelected = activeTab === tool.id;
    return (
      <button
        key={tool.id}
        id={`drawer-tool-${tool.id}`}
        onClick={() => {
          onSelectTab(tool.id);
          onClose();
        }}
        className={`w-full min-h-[52px] text-right flex items-center gap-3 p-3 rounded-lg transition-all border ${
          isSelected
            ? 'bg-[#10b981] text-[#0f1115] border-[#10b981] shadow-md font-bold'
            : 'bg-[#1a1d23] hover:bg-white/10 text-[#f8fafc] border-white/10 hover:border-[#10b981]/50'
        } focus:outline-none focus:ring-2 focus:ring-[#10b981] active:scale-[0.98]`}
      >
        <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border ${
          isSelected 
            ? 'bg-black/20 text-[#0f1115] border-black/30' 
            : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
        }`}>
          {getToolIcon(tool.icon)}
        </div>
        <div className="flex-1 min-w-0 text-start">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-xs font-bold truncate font-mono ${isSelected ? 'text-[#0f1115]' : 'text-slate-100'}`}>
              {isRtl ? tool.titleAr : tool.titleEn}
            </span>
            {tool.badgeAr && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 font-mono ${
                isSelected 
                  ? 'bg-stone-900 text-[#10b981] border border-[#10b981]/40' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                {isRtl ? tool.badgeAr : tool.badgeEn}
              </span>
            )}
          </div>
          <p className={`text-[11px] leading-relaxed line-clamp-1 ${isSelected ? 'text-[#0f1115]/90 font-medium' : 'text-slate-400'}`}>
            {tool.descriptionAr}
          </p>
        </div>
        <div className={`shrink-0 self-center ${isSelected ? 'text-[#0f1115]' : 'text-[#10b981]'}`}>
          {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-fadeIn" dir={direction}>
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-[#0f1115] text-[#f8fafc] h-full shadow-2xl flex flex-col border-s border-white/10 z-10 font-mono">
        {/* Header */}
        <div className="p-5 border-b-2 border-[#10b981] bg-[#14171c] text-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display uppercase tracking-wider text-[#f8fafc]">أدوات النظام والمطورين</h2>
              <p className="text-xs text-emerald-400/80 font-mono">SYSTEM TOOLS // AUDIT & COMPLIANCE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-[#f8fafc] hover:bg-white/10 border border-white/10 transition-colors focus:ring-2 focus:ring-[#10b981]"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-white/10 bg-[#15181e]">
          <div className="relative">
            <Search className={`w-4 h-4 text-white/50 absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في أدوات النظام والتدقيق والمركز..."
              className={`w-full text-xs bg-[#0f1115] border border-white/15 text-[#f8fafc] placeholder:text-white/40 rounded-lg py-2.5 px-3 focus:outline-none focus:border-[#10b981] ${isRtl ? 'pr-9' : 'pl-9'}`}
            />
          </div>
        </div>

        {/* Tools List by Categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* SYSTEM ADMIN CATEGORY */}
          {systemAdminTools.length > 0 && (
            <div>
              <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-2 px-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                SYSTEM ADMIN
              </div>
              <div className="space-y-2">
                {systemAdminTools.map(renderToolButton)}
              </div>
            </div>
          )}

          {/* AUDIT & SECURITY CATEGORY */}
          {auditSecurityTools.length > 0 && (
            <div>
              <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-2 px-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                AUDIT & SECURITY
              </div>
              <div className="space-y-2">
                {auditSecurityTools.map(renderToolButton)}
              </div>
            </div>
          )}

          {/* OPERATIONS SUPPORT CATEGORY */}
          {opsSupportTools.length > 0 && (
            <div>
              <div className="text-[10px] font-black tracking-widest text-emerald-400 uppercase mb-2 px-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                OPERATIONS SUPPORT
              </div>
              <div className="space-y-2">
                {opsSupportTools.map(renderToolButton)}
              </div>
            </div>
          )}

          {/* DEVELOPER MODE CATEGORY (RESTRICTED TO SUPER_ADMIN) */}
          {devTools.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  DEVELOPER MODE (RESTRICTED)
                </div>
                <button
                  type="button"
                  onClick={() => setShowDevMode(!showDevMode)}
                  className="text-[10px] text-purple-300 hover:text-purple-100 underline"
                >
                  {showDevMode ? 'إخفاء (Hide)' : 'إظهار (Show)'}
                </button>
              </div>
              {showDevMode && filteredDevTools.length > 0 && (
                <div className="space-y-2">
                  {filteredDevTools.map(renderToolButton)}
                </div>
              )}
            </div>
          )}

          {filteredProdTools.length === 0 && filteredDevTools.length === 0 && (
            <div className="text-center py-12 text-white/50 text-xs">
              لا توجد أدوات مطابقة لبحثك أو غير مصرح لدورك الحالي ({currentRole})
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-[#14171c] flex items-center justify-between text-[11px] font-mono text-white/50">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#10b981]" />
            <span>ROLE: <strong className="text-[#f8fafc]">{currentRole}</strong></span>
          </div>
          <span className="font-mono text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 px-2.5 py-1 rounded-lg font-bold">
            {prodTools.length} PRODUCTION TOOLS
          </span>
        </div>
      </div>
    </div>
  );
};
