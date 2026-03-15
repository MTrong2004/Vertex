import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Settings, FolderOpen, Plus,
  ChevronLeft, ChevronRight, Trash2, ChevronDown, Check, Users, Building2,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

type UserPlan = 'free' | 'student_pro' | 'lecturer';

interface SidebarProps {
  isOpen: boolean;
  activeProject: string;
  activeTab?: string;
  onSelectProject: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  projects: { id: string; name: string }[];
  onOpenDashboard?: () => void;
  onOpenProjects?: () => void;
  onOpenSettings?: () => void;
  onOpenMembers?: () => void;
  onCreateProject?: () => void;
  onViewPlans?: () => void;
  userPlan?: UserPlan;
  workspaceName?: string;
  workspaces?: { id: string; name: string }[];
  activeWorkspaceId?: string;
  onSwitchWorkspace?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeProject,
  activeTab = 'dashboard',
  onSelectProject,
  onDeleteProject,
  projects,
  onOpenDashboard,
  onOpenProjects,
  onOpenSettings,
  onOpenMembers,
  onCreateProject,
  onViewPlans,
  userPlan = 'free',
  workspaceName = 'My Workspace',
  workspaces = [],
  activeWorkspaceId,
  onSwitchWorkspace,
}) => {
  const { t } = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const wsDropdownRef = useRef<HTMLDivElement>(null);

  const isPro = userPlan === 'student_pro' || userPlan === 'lecturer';

  // Close workspace dropdown on outside click
  useEffect(() => {
    if (!wsDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [wsDropdownOpen]);

  const upgradeTitle = userPlan === 'student_pro' ? t.sidebar.upgradeLecturer : t.sidebar.upgradePro;
  const upgradeDesc  = userPlan === 'student_pro' ? t.sidebar.upgradeLecturerDesc : t.sidebar.upgradeDesc;
  const upgradeBtn   = userPlan === 'student_pro' ? t.sidebar.viewLecturerPlan : t.sidebar.viewPlans;

  // Visual theme per plan
  const cardTheme = userPlan === 'student_pro'
    ? {
        badge: 'Next Plan' as const,
        badgeBg: 'bg-[#1a1a2e]',
        badgeText: 'text-[#3B82F6]',
        badgeBorder: 'border-[#3B82F6]/30',
        cardBg: 'from-[#3B82F6]/10 to-[#8B5CF6]/10',
        cardBorder: 'border-[#3B82F6]/20',
        btnGrad: 'from-[#3B82F6] to-[#8B5CF6]',
        btnShadow: 'shadow-blue-500/20',
        collapsedBg: 'from-[#3B82F6]/20 to-[#8B5CF6]/20',
        collapsedText: 'text-[#3B82F6]',
        collapsedBorder: 'border-[#3B82F6]/20',
        borderTop: 'border-[#3B82F6]/10',
      }
    : {
        badge: 'Free' as const,
        badgeBg: 'bg-[#1a2a1a]',
        badgeText: 'text-[#22C55E]',
        badgeBorder: 'border-[#22C55E]/30',
        cardBg: 'from-[#22C55E]/10 to-[#EAB308]/10',
        cardBorder: 'border-[#22C55E]/20',
        btnGrad: 'from-[#22C55E] to-[#EAB308]',
        btnShadow: 'shadow-green-500/20',
        collapsedBg: 'from-[#22C55E]/20 to-[#EAB308]/20',
        collapsedText: 'text-[#22C55E]',
        collapsedBorder: 'border-[#22C55E]/20',
        borderTop: 'border-[#22C55E]/10',
      };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, action: onOpenDashboard },
    { id: 'projects', label: 'Projects', icon: <FolderOpen size={18} />, action: onOpenProjects },
    { id: 'members', label: 'Members', icon: <Users size={18} />, action: onOpenMembers },
    { id: 'settings', label: t.sidebar.settings, icon: <Settings size={18} />, action: onOpenSettings },
  ];

  const showProjectsList = activeTab === 'projects' || activeTab === 'dashboard';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden" />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-16 bottom-0 bg-[#0F1A2A]/90 backdrop-blur-xl border-r border-[#22C55E]/10 transition-all duration-300 z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] ${collapsed ? 'w-[60px]' : 'w-64'}`}>
        <div className="flex flex-col h-full relative">

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex absolute -right-3 top-5 z-40 w-6 h-6 rounded-full bg-[#162032] border border-[#22C55E]/20 items-center justify-center text-slate-400 hover:text-[#22C55E] hover:border-[#22C55E]/50 transition-all shadow-md"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Workspace Switcher */}
          {!collapsed ? (
            <div className="px-3 pt-3 pb-1" ref={wsDropdownRef}>
              <div className="relative">
                {isPro ? (
                  <button
                    onClick={() => setWsDropdownOpen(o => !o)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/15 hover:border-[#22C55E]/30 text-sm font-medium text-slate-200 transition-all"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E] text-xs font-bold flex-shrink-0">
                      <Building2 size={13} />
                    </div>
                    <span className="flex-1 text-left truncate">{workspaceName}</span>
                    <ChevronDown size={13} className={`text-slate-400 flex-shrink-0 transition-transform ${wsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#162032]/50 border border-[#22C55E]/8 text-sm text-slate-400">
                    <div className="w-6 h-6 rounded-md bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]/60 flex-shrink-0">
                      <Building2 size={13} />
                    </div>
                    <span className="flex-1 truncate">{workspaceName}</span>
                  </div>
                )}

                {/* Workspace dropdown */}
                <AnimatePresence>
                  {isPro && wsDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0D1825] border border-[#22C55E]/15 rounded-xl shadow-xl overflow-hidden"
                    >
                      {workspaces.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => { onSwitchWorkspace?.(ws.id); setWsDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-[#162032] hover:text-white transition-colors"
                        >
                          <div className="w-5 h-5 rounded-md bg-[#22C55E]/15 flex items-center justify-center text-[#22C55E] text-[10px] font-bold flex-shrink-0">
                            {ws.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 text-left truncate">{ws.name}</span>
                          {ws.id === activeWorkspaceId && <Check size={12} className="text-[#22C55E] flex-shrink-0" />}
                        </button>
                      ))}
                      <div className="border-t border-[#22C55E]/10">
                        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-500 hover:bg-[#162032] hover:text-slate-300 transition-colors">
                          <Plus size={14} />
                          New workspace
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex justify-center pt-3 pb-1">
              <div
                title={workspaceName}
                className="w-8 h-8 rounded-lg bg-[#22C55E]/15 flex items-center justify-center text-[#22C55E]/70"
              >
                <Building2 size={14} />
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => item.action?.()}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id ? 'text-white bg-[#22C55E]/15 border border-[#22C55E]/20' : 'text-slate-400 hover:bg-[#162032] hover:text-white'} ${collapsed ? 'justify-center' : 'gap-3'}`}
              >
                <span className={activeTab === item.id ? 'text-[#22C55E]' : ''}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && activeTab === item.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22C55E]" />}
              </button>
            ))}
          </nav>

          <div className="mx-3 h-px bg-[#22C55E]/10" />

          {/* Projects list */}
          {showProjectsList && !collapsed && (
            <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.sidebar.yourProjects}</h3>
                <button onClick={onCreateProject} title={t.sidebar.newProject} className="text-slate-500 hover:text-[#22C55E] transition-colors"><Plus size={15} /></button>
              </div>
              <div className="space-y-0.5">
                {projects.map(project => (
                  <div key={project.id} className="group flex items-center gap-1">
                    <button onClick={() => onSelectProject(project.id)}
                      className={`flex items-center gap-2.5 flex-1 min-w-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeProject === project.id ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/15' : 'text-slate-400 hover:bg-[#162032] hover:text-white'}`}>
                      <FolderOpen size={15} className={activeProject === project.id ? 'text-[#22C55E]' : 'text-slate-500'} />
                      <span className="truncate">{project.name}</span>
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject?.(project.id)}
                        title="Delete project"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsed: project icons */}
          {collapsed && showProjectsList && (
            <div className="flex-1 flex flex-col items-center pt-3 gap-1">
              {projects.map(project => (
                <button key={project.id} onClick={() => onSelectProject(project.id)} title={project.name}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeProject === project.id ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-slate-500 hover:bg-[#162032] hover:text-white'}`}>
                  <FolderOpen size={15} />
                </button>
              ))}
              <button onClick={onCreateProject} title={t.sidebar.newProject} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#22C55E] hover:bg-[#162032] transition-colors"><Plus size={15} /></button>
            </div>
          )}

          {/* Upgrade Card */}
          {userPlan !== 'lecturer' && (
            !collapsed ? (
              <div className={`mt-auto p-3 border-t ${cardTheme.borderTop}`}>
                <div className={`relative bg-gradient-to-r ${cardTheme.cardBg} rounded-xl p-3.5 border ${cardTheme.cardBorder}`}>
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cardTheme.badgeBg} ${cardTheme.badgeText} border ${cardTheme.badgeBorder}`}>{cardTheme.badge}</span>
                  <h4 className="font-bold text-sm text-white mb-0.5 pr-10">{upgradeTitle}</h4>
                  <p className="text-[11px] text-slate-400 mb-2.5">{upgradeDesc}</p>
                  <button onClick={onViewPlans} className={`w-full py-1.5 bg-gradient-to-r ${cardTheme.btnGrad} text-white text-xs font-bold rounded-lg hover:opacity-90 transition shadow-lg ${cardTheme.btnShadow}`}>{upgradeBtn}</button>
                </div>
              </div>
            ) : (
              <div className={`mt-auto pb-4 flex justify-center border-t ${cardTheme.borderTop} pt-3`}>
                <button onClick={onViewPlans} title={upgradeTitle}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-r ${cardTheme.collapsedBg} flex items-center justify-center ${cardTheme.collapsedText} hover:opacity-80 transition border ${cardTheme.collapsedBorder}`}>
                  <span className="text-xs font-black">↑</span>
                </button>
              </div>
            )
          )}
        </div>
      </aside>
    </>
  );
};
