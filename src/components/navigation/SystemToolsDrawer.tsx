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
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'Truck': return <Truck className="w-5 h-5 text-amber-500" />;
      case 'AlertOctagon': return <AlertOctagon className="w-5 h-5 text-rose-500" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      case 'Calculator': return <Calculator className="w-5 h-5 text-teal-500" />;
      case 'Database': return <Database className="w-5 h-5 text-indigo-500" />;
      case 'Share2': return <Share2 className="w-5 h-5 text-purple-500" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-stone-500" />;
      default: return <Boxes className="w-5 h-5 text-stone-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-fadeIn" dir={direction}>
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col border-s border-stone-200 z-10">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">أدوات النظام والمطورين</h2>
              <p className="text-xs text-stone-400">System, Audit & Migration Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-stone-200 bg-stone-50">
          <div className="relative">
            <Search className={`w-4 h-4 text-stone-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في أدوات النظام، الترحيل، والتدقيق..."
              className={`w-full text-xs bg-white border border-stone-300 rounded-xl py-2.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-stone-900 ${isRtl ? 'pr-9' : 'pl-9'}`}
            />
          </div>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-stone-100">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
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
                  className={`w-full pt-2.5 text-right flex items-start gap-3 p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-stone-800' : 'bg-stone-100'}`}>
                    {getToolIcon(tool.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-bold truncate">
                        {tool.titleAr}
                      </span>
                      {tool.badgeAr && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}>
                          {tool.badgeAr}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {tool.descriptionAr}
                    </p>
                  </div>
                  <div className={`shrink-0 self-center ${isSelected ? 'text-amber-400' : 'text-stone-400'}`}>
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>الدور الفعال: <strong className="text-stone-900">{currentRole}</strong></span>
          </div>
          <span className="font-mono text-[10px] bg-stone-200 px-2 py-0.5 rounded text-stone-700 font-bold">
            {tools.length} أدوات مصرحة
          </span>
        </div>
      </div>
    </div>
  );
};
