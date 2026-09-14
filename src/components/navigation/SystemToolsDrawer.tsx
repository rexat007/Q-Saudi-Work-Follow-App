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

  if (!isOpen) return null;

  const tools = navigationService.getAuthorizedSystemTools(currentRole);
  const filteredTools = tools.filter(tool => 
    tool.titleAr.includes(searchQuery) ||
    tool.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.descriptionAr.includes(searchQuery)
  );

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-slate-300" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-5 h-5 text-slate-300" />;
      case 'Truck': return <Truck className="w-5 h-5 text-slate-300" />;
      case 'AlertOctagon': return <AlertOctagon className="w-5 h-5 text-slate-300" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-slate-300" />;
      case 'Calculator': return <Calculator className="w-5 h-5 text-slate-300" />;
      case 'Database': return <Database className="w-5 h-5 text-slate-300" />;
      case 'Share2': return <Share2 className="w-5 h-5 text-slate-300" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-slate-300" />;
      default: return <Boxes className="w-5 h-5 text-slate-300" />;
    }
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
            <div className="w-10 h-10 bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display uppercase tracking-wider text-[#f8fafc]">أدوات النظام والمطورين</h2>
              <p className="text-xs text-white/50 font-mono">SYSTEM // AUDIT & MIGRATION SUITE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-white/60 hover:text-[#f8fafc] hover:bg-white/10 border border-white/10 transition-colors"
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
              placeholder="البحث في أدوات النظام، الترحيل، والتدقيق..."
              className={`w-full text-xs bg-[#0f1115] border border-white/15 text-[#f8fafc] placeholder:text-white/40 rounded py-2.5 px-3 focus:outline-hidden focus:border-[#10b981] ${isRtl ? 'pr-9' : 'pl-9'}`}
            />
          </div>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-white/5">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12 text-white/50 text-xs">
              لا توجد أدوات مطابقة لبحثك أو غير مصرح لدورك الحالي ({currentRole})
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isSelected = activeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  id={`drawer-tool-${tool.id}`}
                  onClick={() => {
                    onSelectTab(tool.id);
                    onClose();
                  }}
                  className={`w-full pt-2.5 text-right flex items-start gap-3 p-3 rounded transition-all border ${
                    isSelected
                      ? 'bg-[#10b981] text-[#0f1115] border-[#10b981] shadow-sm font-bold'
                      : 'bg-[#1a1d23] hover:bg-white/5 text-[#f8fafc] border-white/10 hover:border-[#10b981]/50'
                  }`}
                >
                  <div className={`p-2.5 rounded shrink-0 ${isSelected ? 'bg-black/20 text-[#0f1115]' : 'bg-white/5'}`}>
                    {getToolIcon(tool.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-bold truncate font-mono">
                        {tool.titleAr}
                      </span>
                      {tool.badgeAr && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 font-mono ${
                          isSelected 
                            ? 'bg-stone-900 text-[#10b981] border border-[#10b981]/40' 
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/80'
                        }`}>
                          {tool.badgeAr}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isSelected ? 'text-[#0f1115]/90' : 'text-white/60'}`}>
                      {tool.descriptionAr}
                    </p>
                  </div>
                  <div className={`shrink-0 self-center ${isSelected ? 'text-[#0f1115]' : 'text-[#10b981]'}`}>
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-[#14171c] flex items-center justify-between text-[11px] font-mono text-white/50">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#10b981]" />
            <span>ROLE: <strong className="text-[#f8fafc]">{currentRole}</strong></span>
          </div>
          <span className="font-mono text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded font-bold">
            {tools.length} AUTHORIZED TOOLS
          </span>
        </div>
      </div>
    </div>
  );
};
