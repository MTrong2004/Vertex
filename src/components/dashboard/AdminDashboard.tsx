import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Bot, Sliders, LogOut, Search, 
  ChevronLeft, ChevronRight, Bell, Ban, CheckCircle,
  Sparkles, Clock, DollarSign, UserPlus, Zap, Hash,
  Save, TrendingUp, Eye, Edit2, X, Download,
  BarChart3, FileText, AlertTriangle, Info, XCircle,
  CheckSquare, Square, ListChecks,
} from 'lucide-react';
import {
  adminUserEntries, aiHistory, todayMetrics,
  userSignupChart, apiCostChart, planDistribution,
  auditLog as initialAuditLog, adminNotifications as initialNotifs,
} from '../../data/mockData';
import { AdminUserEntry, AuditLogEntry, AdminNotification } from '../../types';
import { Avatar } from '../ui/Avatar';
import { useLang } from '../../contexts/LanguageContext';

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

// ─── Mini Bar Chart (pure SVG) ───
const MiniBarChart: React.FC<{ data: { label: string; value: number }[]; color: string; height?: number }> = ({ data, color, height = 140 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(32, Math.floor(280 / data.length));
  const gap = 4;
  const totalW = data.length * (barW + gap);
  return (
    <div className="w-full overflow-x-auto">
      <svg width={totalW + 40} height={height + 36} className="mx-auto">
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const x = 20 + i * (barW + gap);
          const y = height - barH;
          return (
            <g key={i}>
              <motion.rect x={x} rx={3}
                initial={{ y: height, height: 0 }} animate={{ y, height: barH }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                width={barW} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" className="fill-slate-500" fontSize={9}>{d.label}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-slate-400" fontSize={9} fontWeight={600}>{d.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── Mini Donut Chart (pure SVG) ───
const MiniDonut: React.FC<{ data: { label: string; value: number }[]; colors: string[]; centerLabel: string }> = ({ data, colors, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total; 
    const start = cum;
    cum += pct;
    return { ...d, pct, start, color: colors[i % colors.length] };
  });
  const r = 45;
  const cir = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6 justify-center">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {segments.map((s, i) => (
          <motion.circle key={i} cx={60} cy={60} r={r} fill="none" strokeWidth={18} 
            stroke={s.color} strokeDasharray={`${s.pct * cir} ${cir}`}
            strokeDashoffset={-s.start * cir}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}
            transform="rotate(-90 60 60)" strokeLinecap="round" />
        ))}
        <text x={60} y={56} textAnchor="middle" className="fill-white" fontSize={22} fontWeight={700}>{total}</text>
        <text x={60} y={72} textAnchor="middle" className="fill-slate-500" fontSize={10}>{centerLabel}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2"> 
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-slate-300">{s.label}</span>
            <span className="text-xs font-bold text-white">{s.value}</span>
            <span className="text-[10px] text-slate-500">({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CSV export helper ───
function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Audit action helpers ──
const actionLabelMap = (t: any) => ({
  ban_user: t.admin.actionBanUser,
  unban_user: t.admin.actionUnbanUser,
  change_quota: t.admin.actionChangeQuota,
  change_price: t.admin.actionChangePrice,
  bulk_ban: t.admin.actionBulkBan,
  bulk_unban: t.admin.actionBulkUnban,
  bulk_quota: t.admin.actionBulkQuota,
  export_data: t.admin.actionExport,
} as Record<string, string>);

const actionColorMap: Record<string, string> = {
  ban_user: 'text-red-400 bg-red-500/10 border-red-500/20',
  unban_user: 'text-green-400 bg-green-500/10 border-green-500/20',
  change_quota: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  change_price: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  bulk_ban: 'text-red-400 bg-red-500/10 border-red-500/20',
  bulk_unban: 'text-green-400 bg-green-500/10 border-green-500/20',
  bulk_quota: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  export_data: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'analytics' | 'auditlog' | 'config'>('users');
  const [userSegment, setUserSegment] = useState<'all' | 'active' | 'banned' | 'paid' | 'free-trial'>('all');
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [managedUsers, setManagedUsers] = useState<AdminUserEntry[]>(adminUserEntries);
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [quotaValue, setQuotaValue] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'ban' | 'unban' } | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Pricing state
  const [prices, setPrices] = useState({ free: '$0', pro: '$5', team: '$15' });
  const [priceSaved, setPriceSaved] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLog);

  // Notification state
  const [notifications, setNotifications] = useState<AdminNotification[]>(initialNotifs);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [openUserActionId, setOpenUserActionId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState<'ban' | 'unban' | 'quota' | null>(null);
  const [bulkQuotaValue, setBulkQuotaValue] = useState(50);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const navItems = [
    { id: 'users' as const, label: t.admin.users, icon: <Users size={18} />, subtitle: t.admin.usersTabSubtitle },
    { id: 'ai' as const, label: t.admin.aiPrompts, icon: <Bot size={18} />, subtitle: t.admin.aiTabSubtitle },
    { id: 'analytics' as const, label: t.admin.analytics, icon: <BarChart3 size={18} />, subtitle: t.admin.analyticsTabSubtitle },
    { id: 'auditlog' as const, label: t.admin.auditLog, icon: <FileText size={18} />, subtitle: t.admin.auditTabSubtitle },
    { id: 'config' as const, label: t.admin.config, icon: <Sliders size={18} />, subtitle: t.admin.configTabSubtitle },
  ];

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return managedUsers.filter(u => {
      const searchMatch = !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);

      if (!searchMatch) return false;
      if (userSegment === 'all') return true;
      if (userSegment === 'active' || userSegment === 'banned') return u.status === userSegment;
      return u.plan === userSegment;
    });
  }, [managedUsers, searchQuery, userSegment]);

  // Filtered AI history
  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return aiHistory.filter(h =>
      h.userName.toLowerCase().includes(query) ||
      h.prompt.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    totalUsers: managedUsers.length,
    activeUsers: managedUsers.filter(u => u.status === 'active').length,
    paidUsers: managedUsers.filter(u => u.plan === 'paid').length,
    freeTrialUsers: managedUsers.filter(u => u.plan === 'free-trial').length,
  }), [managedUsers]);

  // ── Audit log helper ──
  const addAuditLog = useCallback((action: AuditLogEntry['action'], detail: string, target?: string) => {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      admin: 'Admin',
      action,
      target, 
      detail,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [entry, ...prev]);
  }, []);

  // ── Notification helpers ──
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);

  // ── Handlers ──
  const handleToggleBan = (userId: string) => {
    const user = managedUsers.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'banned' as const : 'active' as const;
    setManagedUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: newStatus } : u
    ));
    addAuditLog(
      newStatus === 'banned' ? 'ban_user' : 'unban_user',
      newStatus === 'banned' ? t.admin.logBanUser(user.name) : t.admin.logUnbanUser(user.name),
      user.name
    );
    showToast(`${user.name} ${newStatus === 'banned' ? t.admin.banned : t.admin.active}`, newStatus === 'banned' ? 'error' : 'success');
    setConfirmAction(null);
  };

  const handleSaveQuota = (userId: string) => {
    const user = managedUsers.find(u => u.id === userId);
    if (!user) return;
    setManagedUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, aiQuota: quotaValue } : u
    ));
    addAuditLog('change_quota', t.admin.logChangeQuota(user.aiQuota, quotaValue), user.name);
    showToast(t.admin.toastQuotaUpdated(user.name, quotaValue));
    setEditingQuota(null);
  };

  const handleSavePrices = () => {
    addAuditLog('change_price', t.admin.logPriceChange(prices.free, prices.pro, prices.team));
    setPriceSaved(true);
    showToast(t.admin.priceSaved);
    setTimeout(() => setPriceSaved(false), 3000); 
  };

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    onNavigate?.('login');
  };

  // ── Export handlers ──
  const handleExportUsers = () => {
    const header = [t.admin.name, t.admin.email, t.admin.status, t.admin.plan, t.admin.createdAt, t.admin.aiQuota, t.admin.aiUsed];
    const rows = managedUsers.map(u => [u.name, u.email, u.status, u.plan, u.createdAt, String(u.aiQuota), String(u.aiUsed)]);
    downloadCSV('users_export.csv', [header, ...rows]);
    addAuditLog('export_data', t.admin.logExportUsers);
    showToast(t.admin.exportSuccess);
  };

  const handleExportAiHistory = () => {
    const header = [t.admin.users, t.admin.prompt, t.admin.planSummary, t.admin.tokens, t.admin.date];
    const rows = aiHistory.map(h => [h.userName, h.prompt, h.planSummary, String(h.tokensUsed), h.createdAt]);
    downloadCSV('ai_history_export.csv', [header, ...rows]);
    addAuditLog('export_data', t.admin.logExportAiHistory);
    showToast(t.admin.exportSuccess);
  };

  const handleExportRevenue = () => {
    const header = [t.admin.metric, t.admin.value];
    const rows = [
      [t.admin.totalUsers, String(stats.totalUsers)],
      [t.admin.paidUsers, String(stats.paidUsers)],
      [t.admin.freeTrial, String(stats.freeTrialUsers)],
      [t.admin.apiCostToday, `$${todayMetrics.apiCostToday}`],
      [t.admin.monthlyApiCost, `$${todayMetrics.totalApiCostMonth}`],
      [t.admin.totalTokensToday, String(todayMetrics.totalTokensToday)],
    ];
    downloadCSV('revenue_report.csv', [header, ...rows]);
    addAuditLog('export_data', t.admin.logExportRevenue);
    showToast(t.admin.exportSuccess);
  };

  // ── Bulk action handlers ──
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkBan = () => {
    const names = managedUsers.filter(u => selectedUserIds.has(u.id)).map(u => u.name).join(', ');
    setManagedUsers(prev => prev.map(u => selectedUserIds.has(u.id) ? { ...u, status: 'banned' as const } : u));
    addAuditLog('bulk_ban', t.admin.logBulkBan(selectedUserIds.size, names));
    showToast(t.admin.toastBulkBan(selectedUserIds.size), 'error');
    setSelectedUserIds(new Set()); 
    setShowBulkModal(null);
  };

  const handleBulkUnban = () => {
    const names = managedUsers.filter(u => selectedUserIds.has(u.id)).map(u => u.name).join(', ');
    setManagedUsers(prev => prev.map(u => selectedUserIds.has(u.id) ? { ...u, status: 'active' as const } : u));
    addAuditLog('bulk_unban', t.admin.logBulkUnban(selectedUserIds.size, names));
    showToast(t.admin.toastBulkUnban(selectedUserIds.size));
    setSelectedUserIds(new Set());
    setShowBulkModal(null);
  };

  const handleBulkQuota = () => {
    const names = managedUsers.filter(u => selectedUserIds.has(u.id)).map(u => u.name).join(', ');
    setManagedUsers(prev => prev.map(u => selectedUserIds.has(u.id) ? { ...u, aiQuota: bulkQuotaValue } : u));
    addAuditLog('bulk_quota', t.admin.logBulkQuota(bulkQuotaValue, selectedUserIds.size, names));
    showToast(t.admin.toastBulkQuota(bulkQuotaValue, selectedUserIds.size));
    setSelectedUserIds(new Set());
    setShowBulkModal(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const actionLabels = actionLabelMap(t);
  const currentTab = navItems.find(n => n.id === activeTab);
  const headerActions = {
    users: [
      { id: 'users-csv', label: t.admin.csvLabel, onClick: handleExportUsers, title: t.admin.exportUsers },
    ],
    ai: [
      { id: 'ai-csv', label: t.admin.exportAiHistory, onClick: handleExportAiHistory, title: t.admin.exportAiHistory },
    ],
    analytics: [
      { id: 'analytics-report', label: t.admin.reportLabel, onClick: handleExportRevenue, title: t.admin.exportRevenue },
    ],
    auditlog: [],
    config: [],
  }[activeTab];

  useEffect(() => {
    const closeMenus = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-user-actions]')) {
        setOpenUserActionId(null);
      }
    };

    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  return (
    <div className="relative flex h-screen bg-[#0A0F1A] overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#F97316]/8 via-[#0EA5E9]/8 to-[#38BDF8]/7 blur-[120px]" />
      {/* ─── Sidebar ─── */}
      <aside className={`relative z-10 bg-[#0F1A2A]/88 backdrop-blur-xl border-r border-[#22C55E]/12 transition-all duration-300 flex flex-col ${collapsed ? 'w-[60px]' : 'w-64'}`}>
        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className={`p-4 border-b border-[#22C55E]/10 flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#22C55E] via-[#84CC16] to-[#EAB308] flex items-center justify-center text-white flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.84" />
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.84" />
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.84" />
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-display font-bold text-[#86EFAC] text-[1.02rem] tracking-tight truncate">Vertex</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/14 border border-red-500/30 text-red-300 uppercase tracking-wide">Admin</span>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex absolute -right-3 top-5 z-40 w-6 h-6 rounded-full bg-[#162032] border border-[#22C55E]/20 items-center justify-center text-slate-400 hover:text-[#22C55E] hover:border-[#22C55E]/50 transition-all shadow-md">
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Nav */}
          <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchQuery(''); setSelectedUserIds(new Set()); setUserSegment('all'); }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id ? 'text-white bg-[#22C55E]/15 border border-[#22C55E]/20' : 'text-slate-400 hover:bg-[#162032] hover:text-white'} ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <span className={activeTab === item.id ? 'text-[#22C55E]' : ''}>{item.icon}</span>
                {!collapsed && <span className="leading-tight">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          {!collapsed && (
            <div className="p-3 border-t border-[#22C55E]/10">
              <button onClick={() => setShowSignOutConfirm(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                <LogOut size={16} />
                <span>{t.admin.signOut}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0A0F1A]/80 backdrop-blur-xl border-b border-[#22C55E]/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{currentTab?.label}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{currentTab?.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Export buttons */}
            <div className="hidden md:flex items-center gap-2">
              {headerActions.map(action => (
                <button key={action.id} onClick={action.onClick} title={action.title}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#162032] border border-[#22C55E]/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors">
                  <Download size={13} /> {action.label}
                </button>
              ))}
            </div>
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setShowNotifPanel(p => !p)} className="relative">
                <Bell size={18} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-10 w-80 bg-[#0F1A2A] border border-[#06B6D4]/25 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <span className="text-sm font-bold text-white">{t.admin.notifications}</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[10px] text-[#22C55E] hover:underline font-medium">{t.admin.markAllRead}</button>
                        )}
                        <button onClick={clearNotifications} className="text-[10px] text-slate-500 hover:text-red-400 font-medium">{t.admin.clearAll}</button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-6">{t.admin.noNotifications}</p>
                      )}
                      {notifications.map(n => (
                        <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-colors ${n.read ? '' : 'bg-white/[0.02]'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            n.type === 'warning' ? 'bg-yellow-500/15 text-yellow-400'
                            : n.type === 'error' ? 'bg-red-500/15 text-red-400'
                            : 'bg-blue-500/15 text-blue-400'
                          }`}>
                            {n.type === 'warning' ? <AlertTriangle size={12} /> : n.type === 'error' ? <XCircle size={12} /> : <Info size={12} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-300'}`}>{n.message}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{formatDateTime(n.timestamp)}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ═══════════ TAB 1: USER MANAGEMENT (The People) ═══════════ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: t.admin.totalUsers, value: stats.totalUsers, icon: <Users size={18} />, color: 'from-cyan-500/20 to-cyan-600/12', iconColor: 'text-cyan-300' },
                    { label: t.admin.active, value: stats.activeUsers, icon: <CheckCircle size={18} />, color: 'from-green-500/20 to-green-600/20', iconColor: 'text-green-400' },
                    { label: t.admin.paidUsers, value: stats.paidUsers, icon: <DollarSign size={18} />, color: 'from-[#06B6D4]/20 to-[#22C55E]/10', iconColor: 'text-cyan-300' },
                    { label: t.admin.freeTrial, value: stats.freeTrialUsers, icon: <Sparkles size={18} />, color: 'from-yellow-500/20 to-yellow-600/20', iconColor: 'text-yellow-300' },
                  ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`bg-gradient-to-br ${stat.color} backdrop-blur-xl rounded-xl border border-white/5 p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={stat.iconColor}>{stat.icon}</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Search + Bulk actions bar */}
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t.admin.searchUsers}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1A2A] border border-[#22C55E]/10 text-white placeholder-slate-500 text-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#0F1A2A] border border-[#22C55E]/10 rounded-lg px-3 py-2">
                    <span className="text-slate-400">{filteredUsers.length}</span>
                    <span>{filteredUsers.length === 1 ? t.admin.searchResultSingle : t.admin.searchResultPlural}</span>
                  </div>
                  {/* Bulk action buttons */}
                  <AnimatePresence>
                    {selectedUserIds.size > 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-[#162032] px-3 py-1.5 rounded-lg border border-[#22C55E]/10">
                          <ListChecks size={13} /> {selectedUserIds.size} {t.admin.selected}
                        </span>
                        <button onClick={() => setShowBulkModal('ban')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors">
                          <Ban size={12} /> {t.admin.bulkBan}
                        </button>
                        <button onClick={() => setShowBulkModal('unban')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-medium hover:bg-green-500/20 transition-colors">
                          <CheckCircle size={12} /> {t.admin.bulkUnban}
                        </button>
                        <button onClick={() => setShowBulkModal('quota')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px] font-medium hover:bg-yellow-500/20 transition-colors">
                          <Zap size={12} /> {t.admin.bulkQuota}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Segment filters */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all' as const, label: t.admin.allUsers },
                    { id: 'active' as const, label: t.admin.active },
                    { id: 'banned' as const, label: t.admin.banned },
                    { id: 'paid' as const, label: t.admin.paid },
                    { id: 'free-trial' as const, label: t.admin.freeTrial },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setUserSegment(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        userSegment === filter.id
                          ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#86EFAC]'
                          : 'bg-[#0F1A2A] border-[#22C55E]/10 text-slate-400 hover:text-white hover:border-[#22C55E]/30'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* User table */}
                <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#0A0F1A]/50">
                          <th className="px-4 py-3.5 w-10">
                            <button onClick={toggleSelectAll} className="text-slate-500 hover:text-[#22C55E] transition-colors">
                              {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare size={16} className="text-[#22C55E]" /> : <Square size={16} />}
                            </button>
                          </th>
                          <th className="px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t.admin.email}</th>
                          <th className="px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t.admin.status}</th>
                          <th className="px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t.admin.plan}</th>
                          <th className="px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t.admin.aiQuota}</th>
                          <th className="px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t.admin.createdAt}</th>
                          <th className="px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.admin.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center">
                              <p className="text-sm text-slate-400 mb-1">{t.admin.noUsers}</p>
                              <p className="text-xs text-slate-600 mb-4">{t.admin.tryAdjustFilters}</p>
                              <button
                                onClick={() => { setSearchQuery(''); setUserSegment('all'); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#162032] border border-[#22C55E]/20 text-slate-300 hover:text-white"
                              >
                                {t.admin.resetFilters}
                              </button>
                            </td>
                          </tr>
                        )}
                        {filteredUsers.map(user => (
                          <tr key={user.id} className={`border-b border-white/5 transition-colors ${selectedUserIds.has(user.id) ? 'bg-[#22C55E]/5' : 'hover:bg-white/[0.02]'}`}>
                            <td className="px-4 py-4 align-top">
                              <button onClick={() => toggleSelectUser(user.id)} className="text-slate-500 hover:text-[#22C55E] transition-colors">
                                {selectedUserIds.has(user.id) ? <CheckSquare size={16} className="text-[#22C55E]" /> : <Square size={16} />}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar src={user.avatar} name={user.name} size="sm" />
                                <div>
                                  <p className="text-sm font-semibold text-white">{user.name}</p>
                                  <p className="text-xs text-slate-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`flex items-center gap-1.5 text-xs font-medium ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                                {user.status === 'active' ? t.admin.active : t.admin.banned}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                user.plan === 'paid'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {user.plan === 'paid' ? t.admin.paid : t.admin.freeTrial}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-[#162032] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${user.aiUsed / user.aiQuota > 0.9 ? 'bg-red-400' : user.aiUsed / user.aiQuota > 0.6 ? 'bg-yellow-400' : 'bg-[#22C55E]'}`}
                                    style={{ width: `${Math.min(100, (user.aiUsed / user.aiQuota) * 100)}%` }} />
                                </div>
                                <span className="text-xs text-slate-400">{user.aiUsed}/{user.aiQuota}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-400">{formatDate(user.createdAt)}</td>
                            <td className="px-4 py-4 text-right relative">
                              <div className="inline-block text-left" data-user-actions>
                                <button
                                  onClick={() => setOpenUserActionId(prev => prev === user.id ? null : user.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#162032] border border-[#22C55E]/10 text-slate-300 hover:text-white hover:border-[#22C55E]/30 transition-colors"
                                >
                                  {t.admin.actions}
                                </button>
                                {openUserActionId === user.id && (
                                  <div className="absolute right-4 mt-1 w-36 rounded-lg border border-[#22C55E]/20 bg-[#0F1A2A] shadow-2xl shadow-black/30 overflow-hidden z-20">
                                    <button
                                      onClick={() => {
                                        setOpenUserActionId(null);
                                        setEditingQuota(user.id);
                                        setQuotaValue(user.aiQuota);
                                        setActiveTab('ai');
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-[#162032]"
                                    >
                                      {t.admin.editQuota}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenUserActionId(null);
                                        setConfirmAction({ userId: user.id, action: user.status === 'active' ? 'ban' : 'unban' });
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-[#162032] ${user.status === 'active' ? 'text-red-400' : 'text-green-400'}`}
                                    >
                                      {user.status === 'active' ? t.admin.banUser : t.admin.unbanUser}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════ TAB 2: AI & PROMPT (The Core) ═══════════ */}
            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* ── Quota Table ── */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    {t.admin.aiQuota}
                  </h3>
                  <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 bg-[#0A0F1A]/50">
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.email}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.plan}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.aiUsed}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.aiQuota}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.aiRemaining}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {managedUsers.filter(u => u.status === 'active').map(user => {
                            const pct = user.aiQuota > 0 ? (user.aiUsed / user.aiQuota) * 100 : 0;
                            const isEditing = editingQuota === user.id;
                            return (
                              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                {/* Name + email – compact, no avatar */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                                      user.plan === 'paid' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-yellow-500/15 text-yellow-400'
                                    }`}>{user.name.charAt(0)}</span>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                {/* Plan */}
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    user.plan === 'paid' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                                  }`}>{user.plan === 'paid' ? t.admin.paid : t.admin.freeTrial}</span>
                                </td>
                                {/* Used */}
                                <td className="px-4 py-3 text-sm text-slate-300 font-mono">{user.aiUsed}</td>
                                {/* Quota (editable) */}
                                <td className="px-4 py-3">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input type="number" value={quotaValue} onChange={e => setQuotaValue(parseInt(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 rounded-md bg-[#162032] border border-[#22C55E]/30 text-white text-xs font-mono focus:border-[#22C55E] outline-none" />
                                      <button onClick={() => handleSaveQuota(user.id)} className="p-0.5 text-[#22C55E] hover:bg-[#22C55E]/10 rounded transition-colors"><Save size={12} /></button>
                                      <button onClick={() => setEditingQuota(null)} className="p-0.5 text-slate-500 hover:text-red-400 rounded transition-colors"><X size={12} /></button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-300 font-mono">{user.aiQuota}</span>
                                  )}
                                </td>
                                {/* Remaining + bar */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-[#162032] rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-400' : pct > 60 ? 'bg-yellow-400' : 'bg-[#22C55E]'}`}
                                        style={{ width: `${Math.min(100, pct)}%` }} />
                                    </div>
                                    <span className={`text-xs font-mono ${pct > 90 ? 'text-red-400' : 'text-slate-400'}`}>{Math.max(0, user.aiQuota - user.aiUsed)}</span>
                                  </div>
                                </td>
                                {/* Edit btn */}
                                <td className="px-4 py-3">
                                  {!isEditing && (
                                    <button onClick={() => { setEditingQuota(user.id); setQuotaValue(user.aiQuota); }}
                                      className="p-1 text-slate-600 hover:text-[#22C55E] transition-colors rounded hover:bg-[#22C55E]/10">
                                      <Edit2 size={12} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── AI History ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock size={16} className="text-blue-400" />
                      {t.admin.aiHistory}
                    </h3>
                  </div>

                  <div className="mb-4">
                    <div className="relative max-w-md">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t.admin.searchHistory}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1A2A] border border-[#22C55E]/10 text-white placeholder-slate-500 text-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all" />
                    </div>
                  </div>

                  {/* History table */}
                  <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 bg-[#0A0F1A]/50">
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">{t.admin.email}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.prompt}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">{t.admin.tokens}</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">{t.admin.createdAt}</th>
                            <th className="px-4 py-3 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">{t.admin.noHistory}</td></tr>
                          )}
                          {filteredHistory.map(entry => (
                            <React.Fragment key={entry.id}>
                              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                                onClick={() => setExpandedHistory(expandedHistory === entry.id ? null : entry.id)}>
                                <td className="px-4 py-3">
                                  <span className="text-sm font-medium text-white">{entry.userName}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-slate-300 truncate max-w-xs">&ldquo;{entry.prompt}&rdquo;</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                    <Hash size={9} />{entry.tokensUsed.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <Eye size={13} className={`transition-colors ${expandedHistory === entry.id ? 'text-[#22C55E]' : 'text-slate-600'}`} />
                                </td>
                              </tr>
                              <AnimatePresence>
                                {expandedHistory === entry.id && (
                                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <td colSpan={5} className="px-4 pb-3 pt-0">
                                      <div className="p-3 bg-[#162032] rounded-lg border border-white/5">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">{t.admin.planSummary}</p>
                                        <p className="text-xs text-slate-300 leading-relaxed">{entry.planSummary}</p>
                                      </div>
                                    </td>
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════ TAB 3: ANALYTICS (Charts) ═══════════ */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t.admin.executiveOverview}</h3>
                    <p className="text-sm text-slate-500">{t.admin.executiveOverviewSubtitle}</p>
                  </div>
                </div>
                {/* Hot Metrics row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: t.admin.newUsersToday, value: todayMetrics.newUsersToday, icon: <UserPlus size={18} />, accent: 'text-cyan-300', bg: 'from-cyan-500/20 to-cyan-600/10' },
                    { label: t.admin.apiCostToday, value: `$${todayMetrics.apiCostToday.toFixed(2)}`, icon: <DollarSign size={18} />, accent: 'text-emerald-300', bg: 'from-emerald-500/20 to-emerald-600/10' },
                    { label: t.admin.totalTokensToday, value: todayMetrics.totalTokensToday.toLocaleString(), icon: <Zap size={18} />, accent: 'text-yellow-300', bg: 'from-yellow-500/20 to-yellow-600/10' },
                    { label: t.admin.monthlyApiCost, value: `$${todayMetrics.totalApiCostMonth.toFixed(2)}`, icon: <TrendingUp size={18} />, accent: 'text-[#22C55E]', bg: 'from-[#22C55E]/20 to-[#06B6D4]/10' },
                  ].map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className={`bg-gradient-to-br ${m.bg} backdrop-blur-xl rounded-xl border border-white/5 p-6`}>
                      <div className={`mb-3 ${m.accent}`}>{m.icon}</div>
                      <p className="text-3xl font-bold text-white mb-1 tracking-tight">{m.value}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{m.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 p-6">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <UserPlus size={16} className="text-blue-400" />
                      {t.admin.userSignupTrend}
                    </h3>
                    <MiniBarChart data={userSignupChart} color="#3B82F6" />
                  </div>
                  <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 p-6">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <DollarSign size={16} className="text-red-400" />
                      {t.admin.apiCostDaily}
                    </h3>
                    <MiniBarChart data={apiCostChart.map(d => ({ ...d, value: Math.round(d.value * 100) / 100 }))} color="#EF4444" />
                  </div>
                </div>

                {/* Plan breakdown donut */}
                <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 p-6 max-w-md">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    {t.admin.planBreakdown}
                  </h3>
                  <MiniDonut data={planDistribution} colors={['#F59E0B', '#0EA5E9']} centerLabel={t.admin.usersCountLabel} />
                </div>
              </motion.div>
            )}

            {/* ═══════════ TAB 4: AUDIT LOG ═══════════ */}
            {activeTab === 'auditlog' && (
              <motion.div key="auditlog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#0A0F1A]/50">
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.auditTime}</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.auditAction}</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.auditTarget}</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.admin.auditDetail}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 && (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">{t.admin.noAuditLog}</td></tr>
                        )}
                        {auditLogs.map(log => (
                          <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${actionColorMap[log.action] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                {actionLabels[log.action] || log.action}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-white font-medium">{log.target || '\u2014'}</td>
                            <td className="px-5 py-3 text-xs text-slate-400 max-w-xs truncate">{log.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════ TAB 5: QUICK CONFIG (The Control) ═══════════ */}
            {activeTab === 'config' && (
              <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="max-w-lg">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={16} className="text-[#22C55E]" />
                    {t.admin.pricingConfig}
                  </h3>
                  <div className="bg-[#0F1A2A]/80 rounded-xl border border-[#22C55E]/10 p-6 space-y-5">
                    {[
                      { key: 'free' as const, label: t.admin.freePrice, desc: t.pricing.freeName },
                      { key: 'pro' as const, label: t.admin.proPrice, desc: t.pricing.proName },
                      { key: 'team' as const, label: t.admin.teamPrice, desc: t.pricing.teamName },
                    ].map(item => (
                      <div key={item.key}>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          {item.label} <span className="text-slate-600 text-[11px]">({item.desc})</span>
                        </label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input value={prices[item.key]}
                            onChange={e => setPrices(p => ({ ...p, [item.key]: e.target.value }))}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/10 text-white text-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all" />
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={handleSavePrices}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] hover:bg-[#22C55E]/80 text-white rounded-xl text-sm font-medium transition-colors">
                        <Save size={16} />{t.admin.savePrice}
                      </button>
                      <AnimatePresence>
                        {priceSaved && (
                          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                            className="text-xs text-[#22C55E] font-medium flex items-center gap-1.5">
                            <CheckCircle size={14} /> {t.admin.priceSaved}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ─── Ban/Unban confirmation modal ─── */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setConfirmAction(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0F1A2A] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
              <Ban size={24} className={`mx-auto mb-3 ${confirmAction.action === 'ban' ? 'text-red-400' : 'text-green-400'}`} />
              <h3 className="text-lg font-bold text-white mb-2">
                {confirmAction.action === 'ban' ? t.admin.confirmBan : t.admin.confirmUnban}
              </h3>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  {t.admin.cancel}
                </button>
                <button onClick={() => handleToggleBan(confirmAction.userId)}
                  className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition-colors ${
                    confirmAction.action === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}>
                  {confirmAction.action === 'ban' ? t.admin.banUser : t.admin.unbanUser}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bulk action modal ─── */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowBulkModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0F1A2A] border border-[#22C55E]/20 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
              <ListChecks size={24} className="text-[#22C55E] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">
                {showBulkModal === 'ban' ? t.admin.bulkBan : showBulkModal === 'unban' ? t.admin.bulkUnban : t.admin.bulkQuota}
              </h3>
              <p className="text-xs text-slate-400 mb-4">{selectedUserIds.size} {t.admin.selected} — {t.admin.bulkConfirm}</p>

              {showBulkModal === 'quota' && (
                <div className="flex items-center gap-2 justify-center mb-4">
                  <input type="number" value={bulkQuotaValue} onChange={e => setBulkQuotaValue(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 rounded-xl bg-[#162032] border border-[#22C55E]/20 text-white text-sm text-center focus:border-[#22C55E] outline-none" />
                  <span className="text-xs text-slate-400">{t.admin.quotaLabel}</span>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowBulkModal(null)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  {t.admin.cancel}
                </button>
                <button onClick={() => showBulkModal === 'ban' ? handleBulkBan() : showBulkModal === 'unban' ? handleBulkUnban() : handleBulkQuota()}
                  className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition-colors ${
                    showBulkModal === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#22C55E] hover:bg-[#22C55E]/80'
                  }`}>
                  {t.admin.applyBulk}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Sign out confirm ─── */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSignOutConfirm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0F1A2A] border border-[#22C55E]/20 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
              <LogOut size={24} className="text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{t.admin.signOut}?</h3>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  {t.admin.cancel}
                </button>
                <button onClick={handleSignOut}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                  {t.admin.signOut}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Toast ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl shadow-black/40 border backdrop-blur-md min-w-[280px] ${
              toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : toast.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-400'
              : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
            }`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'error' ? <XCircle size={18} /> : <Info size={18} />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 transition-opacity"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
