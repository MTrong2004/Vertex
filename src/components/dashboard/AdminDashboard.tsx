import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Bot, Sliders, LogOut, Search, 
  ChevronLeft, ChevronRight, Bell, Ban, CheckCircle,
  Sparkles, Clock, DollarSign, UserPlus, Zap, Hash,
  Save, TrendingUp, Eye, Edit2, X, Download,
  BarChart3, FileText, AlertTriangle, Info, XCircle,
  CheckSquare, Square, ListChecks,
  RefreshCw, ArrowLeftRight, ArrowUpDown,
} from 'lucide-react';
import {
  adminUserEntries, aiHistory, todayMetrics,
  userSignupChart, apiCostChart, planDistribution,
  auditLog as initialAuditLog, adminNotifications as initialNotifs,
} from '../../data/mockData';
import { AdminUserEntry, AuditLogEntry, AdminNotification } from '../../types';
import { Avatar } from '../ui/Avatar';
import { useLang } from '../../contexts/LanguageContext';
import websiteStructureMarkdown from '../../../website-structure.md?raw';

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

interface SystemMapTreeNode {
  id: string;
  label: string;
  route: string | null;
  group: string;
  depth: number;
  children: SystemMapTreeNode[];
}

interface SystemMapNodeCard {
  label: string;
  route: string | null;
  category: string;
  nodeId: string;
  anchorX: number;
  anchorY: number;
  expandable: boolean;
  expanded: boolean;
  childCount: number;
}

interface SystemMapParsed {
  root: SystemMapTreeNode;
  rawTree: string;
  nodesById: Record<string, SystemMapTreeNode>;
  routesByLabel: Record<string, string>;
  totalCount: number;
}

const SYSTEM_MAP_INITIAL_ZOOM_OUT_FACTOR = 0.9;

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      render: (id: string, definition: string) => Promise<{ svg: string }>;
    };
  }
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
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'analytics' | 'auditlog' | 'config' | 'sitemap'>('users');
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
  const [systemMapSvg, setSystemMapSvg] = useState('');
  const [isSystemMapLoading, setIsSystemMapLoading] = useState(false);
  const [systemMapError, setSystemMapError] = useState<string | null>(null);
  const [isWideSystemMap, setIsWideSystemMap] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : true));
  const [systemMapRefreshKey, setSystemMapRefreshKey] = useState(0);
  const [systemMapActivationKey, setSystemMapActivationKey] = useState(0);
  const [systemMapQuickNav, setSystemMapQuickNav] = useState<SystemMapNodeCard | null>(null);
  const [systemMapHoverCard, setSystemMapHoverCard] = useState<SystemMapNodeCard | null>(null);
  const [systemMapExpandedNodes, setSystemMapExpandedNodes] = useState<Set<string>>(new Set());
  const [systemMapInteractionVersion, setSystemMapInteractionVersion] = useState(0);
  const systemMapContainerRef = useRef<HTMLDivElement | null>(null);
  const systemMapViewportRef = useRef<HTMLDivElement | null>(null);
  const systemMapRenderedSignatureRef = useRef<string>('');
  const [mapSvgSize, setMapSvgSize] = useState({ w: 800, h: 600 });
  const mapViewRef = useRef({ x: 0, y: 0, scale: 1 });
  const mapFrameRef = useRef<number | null>(null);
  const mapIsDragging = useRef(false);
  const mapDragStartedAtRef = useRef(0);
  const mapDragLast = useRef({ x: 0, y: 0 });
  const mapHasMoved = useRef(false);
  const systemMapRecoveryTimerRef = useRef<number | null>(null);
  const systemMapRecoveryTimersRef = useRef<number[]>([]);
  const systemMapRenderInFlightRef = useRef(false);
  const systemMapFailedSignatureRef = useRef<string>('');
  const systemMapViewInitializedRef = useRef(false);
  const systemMapLastInteractionAtRef = useRef(0);
  const systemMapAutoRecoverTimerRef = useRef<number | null>(null);
  const systemMapLastHardResetAtRef = useRef(0);
  const previousAdminTabRef = useRef<typeof activeTab>('users');

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
    { id: 'sitemap' as const, label: 'System Map', icon: <ListChecks size={18} />, subtitle: 'Visual website structure' },
  ];

  useEffect(() => {
    const onResize = () => {
      setIsWideSystemMap(window.innerWidth >= 1280);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const normalizeSystemMapLabel = useCallback((label: string) => label.replace(/\s+/g, ' ').trim(), []);
  const stripRouteSuffixFromLabel = useCallback((label: string) =>
    normalizeSystemMapLabel(label.replace(/\s*\(\/[^)]+\)\s*/g, ' ')), [normalizeSystemMapLabel]);
  const stripIndicatorFromLabel = useCallback((label: string) => normalizeSystemMapLabel(label.replace(/[▸▼]\s*$/u, '')), [normalizeSystemMapLabel]);

  const systemMapRouteFromLabel = useCallback((label: string): string | null => {
    const routeMatch = label.match(/\((\/[^)]+)\)/);
    if (routeMatch?.[1]) return routeMatch[1];

    const clean = stripRouteSuffixFromLabel(label)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const routeByLabel: Record<string, string> = {
      landing: '/',
      features: '/features',
      pricing: '/pricing',
      changelog: '/changelog',
      resources: '/resources/docs',
      documentation: '/resources/docs',
      guides: '/resources/guide',
      blog: '/resources/blog',
      community: '/resources/community',
      legal: '/legal/terms',
      terms: '/legal/terms',
      privacy: '/legal/privacy',
      login: '/login',
      workspace: '/dashboard',
      'student workspace': '/dashboard',
      dashboard: '/dashboard',
      'active projects': '/dashboard',
      'tasks today': '/dashboard',
      'progress overview': '/dashboard',
      projects: '/dashboard',
      board: '/dashboard',
      'ai planner': '/dashboard',
      insights: '/dashboard',
      members: '/dashboard',
      files: '/dashboard',
      timeline: '/dashboard',
      calendar: '/dashboard',
      settings: '/dashboard',
      'lecturer workspace': '/lecturer',
      overview: '/lecturer',
      groups: '/lecturer',
      'group detail': '/lecturer',
      deadlines: '/lecturer',
      'admin workspace': '/admin',
      users: '/admin',
      ai: '/admin',
      analytics: '/admin',
      'audit log': '/admin',
      config: '/admin',
    };

    return routeByLabel[clean] ?? null;
  }, [stripRouteSuffixFromLabel]);

  const systemMapGroupFromLabel = useCallback((label: string) => {
    const clean = stripRouteSuffixFromLabel(label)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    if (clean === 'landing') return 'groupRoot';
    if (clean === 'workspace') return 'groupWorkspace';
    if (clean.includes('student workspace')) return 'groupStudent';
    if (clean.includes('lecturer workspace')) return 'groupLecturer';
    if (clean.includes('admin workspace')) return 'groupAdmin';
    if (['features', 'pricing', 'changelog', 'resources', 'documentation', 'guides', 'blog', 'community', 'legal', 'terms', 'privacy', 'login'].includes(clean)) return 'groupPublic';
    return 'groupSection';
  }, [stripRouteSuffixFromLabel]);

  const systemMapPageKeyFromRoute = useCallback((route: string | null): string | null => {
    if (!route) return null;

    const routeToPage: Record<string, string> = {
      '/': 'landing',
      '/features': 'features',
      '/pricing': 'pricing',
      '/changelog': 'changelog',
      '/login': 'login',
      '/dashboard': 'dashboard',
      '/lecturer': 'lecturer',
      '/resources': 'resources',
      '/resources/docs': 'docs',
      '/resources/guide': 'guide',
      '/resources/blog': 'blog',
      '/resources/community': 'community',
      '/legal': 'legal',
      '/legal/terms': 'terms',
      '/legal/privacy': 'privacy',
    };

    return routeToPage[route] ?? null;
  }, []);

  const openSystemMapRoute = useCallback((route: string | null) => {
    if (!route) return;

    const pageKey = systemMapPageKeyFromRoute(route);
    if (pageKey && onNavigate) {
      onNavigate(pageKey);
      return;
    }

    window.location.assign(route);
  }, [onNavigate, systemMapPageKeyFromRoute]);

  const systemMapParsed = useMemo<SystemMapParsed>(() => {
    const fenced = websiteStructureMarkdown.match(/```text\s*([\s\S]*?)```/);
    const rawTree = fenced?.[1] ? fenced[1].trim() : '';

    if (!rawTree) {
      const fallbackRoot: SystemMapTreeNode = {
        id: 'landing_0',
        label: 'Landing',
        route: '/',
        group: 'groupRoot',
        depth: 0,
        children: [],
      };
      return {
        root: fallbackRoot,
        rawTree,
        nodesById: { [fallbackRoot.id]: fallbackRoot },
        routesByLabel: { Landing: '/' },
        totalCount: 1,
      };
    }

    const lines = rawTree
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean);

    const nodesById: Record<string, SystemMapTreeNode> = {};
    const routesByLabel: Record<string, string> = {};
    const stack: SystemMapTreeNode[] = [];

    const toNodeId = (label: string, index: number) => {
      const base = stripRouteSuffixFromLabel(label)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      return `${base || 'node'}_${index}`;
    };

    const registerRoute = (label: string, route: string) => {
      routesByLabel[normalizeSystemMapLabel(label)] = route;
      routesByLabel[stripRouteSuffixFromLabel(label)] = route;
      routesByLabel[stripIndicatorFromLabel(label)] = route;
    };

    let rootNode: SystemMapTreeNode | null = null;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const match = i === 0 ? null : line.match(/^([│ ]*)(├|└)\s(.+)$/);
      const depth = i === 0 ? 0 : Math.floor((match?.[1]?.length ?? 0) / 2) + 1;
      const labelRaw = i === 0 ? line.trim() : (match?.[3]?.trim() ?? '');
      const label = stripRouteSuffixFromLabel(labelRaw);
      if (!label) continue;

      while (stack.length > depth) {
        stack.pop();
      }

      const parent = stack[stack.length - 1] ?? null;
      const directGroup = systemMapGroupFromLabel(labelRaw);
      const group = directGroup !== 'groupSection' ? directGroup : (parent?.group ?? 'groupSection');
      const route = systemMapRouteFromLabel(labelRaw) ?? systemMapRouteFromLabel(label);
      const node: SystemMapTreeNode = {
        id: toNodeId(labelRaw, i),
        label,
        route,
        group,
        depth,
        children: [],
      };

      nodesById[node.id] = node;
      if (route) registerRoute(labelRaw, route);
      if (route) registerRoute(label, route);

      if (parent) {
        parent.children.push(node);
      } else {
        rootNode = node;
      }

      stack.push(node);
    }

    const root: SystemMapTreeNode = rootNode ?? {
      id: 'landing_0',
      label: 'Landing',
      route: '/',
      group: 'groupRoot',
      depth: 0,
      children: [],
    };

    return {
      root,
      rawTree,
      nodesById,
      routesByLabel,
      totalCount: Object.keys(nodesById).length || 1,
    };
  }, [normalizeSystemMapLabel, stripIndicatorFromLabel, systemMapGroupFromLabel, systemMapRouteFromLabel]);

  useEffect(() => {
    const nextExpanded = new Set<string>();
    const parsedNodes = Object.values(systemMapParsed.nodesById as Record<string, SystemMapTreeNode>);
    parsedNodes.forEach((node) => {
      if (['Landing', 'Login', 'Workspace', 'Student Workspace'].includes(node.label)) {
        nextExpanded.add(node.id);
      }
    });

    if (nextExpanded.size === 0 && systemMapParsed.root?.id) {
      nextExpanded.add(systemMapParsed.root.id);
    }

    setSystemMapExpandedNodes(nextExpanded);
  }, [systemMapParsed]);

  const systemMapRouteLookup = useMemo(() => {
    return systemMapParsed.routesByLabel;
  }, [systemMapParsed]);

  const systemMapNodeCount = useMemo(() => systemMapParsed.totalCount, [systemMapParsed]);

  const systemMapVisibleGraph = useMemo(() => {
    const root = systemMapParsed.root;
    const nodes: Array<SystemMapTreeNode & { displayLabel: string }> = [];
    const edges: Array<{ from: string; to: string }> = [];
    const groupedNodeIds: Record<string, string[]> = {
      groupRoot: [],
      groupPublic: [],
      groupWorkspace: [],
      groupStudent: [],
      groupAdmin: [],
      groupLecturer: [],
      groupSection: [],
    };

    const visit = (node: SystemMapTreeNode) => {
      const displayLabel = node.label;
      nodes.push({ ...node, displayLabel });
      groupedNodeIds[node.group]?.push(node.id);
      node.children.forEach((child) => {
        edges.push({ from: node.id, to: child.id });
        visit(child);
      });
    };

    visit(root);

    return { nodes, edges, groupedNodeIds };
  }, [systemMapParsed]);

  const systemMapVisibleNodeLookup = useMemo(() => {
    const lookup: Record<string, Array<SystemMapTreeNode & { displayLabel: string }>> = {};
    systemMapVisibleGraph.nodes.forEach((node) => {
      const key = normalizeSystemMapLabel(node.label);
      if (!lookup[key]) {
        lookup[key] = [];
      }
      lookup[key].push(node);
    });
    return lookup;
  }, [normalizeSystemMapLabel, systemMapVisibleGraph.nodes]);

  const systemMapDefinition = useMemo(() => {
    if (!systemMapParsed.rawTree) {
      return `flowchart ${isWideSystemMap ? 'LR' : 'TD'}
    LandingPage["Landing Page"] --> Features["Features"]
    LandingPage --> Pricing["Pricing"]
    LandingPage --> Blog["Blog"]
    LandingPage --> Login["Login"]
    Login --> Dashboard["Dashboard"]
    Dashboard --> Projects["Projects"]
    Dashboard --> Settings["Settings"]
    Dashboard --> Billing["Billing"]`;
    }

    const escapeLabel = (label: string) => label.replace(/"/g, '\\"');

    const buildClassLines = (nodeIds: string[], className: string): string[] => {
      const linesOut: string[] = [];
      const chunkSize = 24;
      for (let i = 0; i < nodeIds.length; i += chunkSize) {
        const chunk = nodeIds.slice(i, i + chunkSize);
        linesOut.push(`    class ${chunk.join(',')} ${className}`);
      }
      return linesOut;
    };

    const nodeLines = systemMapVisibleGraph.nodes.map((node) => `    ${node.id}["${escapeLabel(node.displayLabel)}"]`);
    const edgeLines = systemMapVisibleGraph.edges.map((edge) => `    ${edge.from} --> ${edge.to}`);

    const classDefLines = [
      '    classDef groupRoot fill:#14532D,stroke:#A7F3D0,color:#ECFCCB,stroke-width:2px;',
      '    classDef groupPublic fill:#0A4D68,stroke:#67E8F9,color:#ECFEFF,stroke-width:1.6px;',
      '    classDef groupWorkspace fill:#1E40AF,stroke:#93C5FD,color:#EFF6FF,stroke-width:1.6px;',
      '    classDef groupStudent fill:#365314,stroke:#BEF264,color:#F7FEE7,stroke-width:1.6px;',
      '    classDef groupAdmin fill:#9A3412,stroke:#FDBA74,color:#FFF7ED,stroke-width:1.6px;',
      '    classDef groupLecturer fill:#6D28D9,stroke:#C4B5FD,color:#F5F3FF,stroke-width:1.6px;',
      '    classDef groupSection fill:#1E293B,stroke:#94A3B8,color:#F1F5F9,stroke-width:1.3px;',
    ];

    const groupedEntries = Object.entries(systemMapVisibleGraph.groupedNodeIds) as Array<[string, string[]]>;
    const classLines = groupedEntries
      .flatMap(([groupName, ids]) => (ids.length ? buildClassLines(ids, groupName) : []));

    return [
      `flowchart ${isWideSystemMap ? 'LR' : 'TD'}`,
      '    %% Auto-generated from website-structure.md',
      ...classDefLines,
      ...nodeLines,
      ...edgeLines,
      '    linkStyle default stroke:#64748B,stroke-width:1.4px,opacity:0.9;',
      ...classLines,
    ].join('\n');
  }, [isWideSystemMap, systemMapParsed.rawTree, systemMapVisibleGraph]);

  useEffect(() => {
    if (activeTab !== 'sitemap') return;

    const renderSignature = `${systemMapDefinition}::${systemMapRefreshKey}::${systemMapActivationKey}`;
    if (systemMapRenderedSignatureRef.current === renderSignature && systemMapSvg && !systemMapError) {
      return;
    }

    // If this exact signature already failed, do not auto-retry in a tight loop.
    if (systemMapFailedSignatureRef.current === renderSignature) {
      return;
    }

    if (systemMapRenderInFlightRef.current) {
      return;
    }

    let cancelled = false;

    const loadScript = async (selector: string, src: string, errorMessage: string, datasetFlag: string) => {
      await new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(selector);
        if (existingScript) {
          if (existingScript.dataset.loaded === 'true') {
            resolve();
            return;
          }
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', () => reject(new Error(errorMessage)), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.setAttribute(datasetFlag, 'true');
        script.dataset.loaded = 'false';
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve();
        };
        script.onerror = () => reject(new Error(errorMessage));
        document.head.appendChild(script);
      });
    };

    const ensureMermaidLoaded = async () => {
      if (window.mermaid) return;
      await loadScript(
        'script[data-mermaid-cdn="true"]',
        'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
        'Failed to load Mermaid CDN',
        'data-mermaid-cdn',
      );
    };

    const renderSystemMap = async () => {
      try {
        systemMapRenderInFlightRef.current = true;
        setIsSystemMapLoading(true);
        setSystemMapError(null);
        await ensureMermaidLoaded();
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

        if (!window.mermaid) {
          throw new Error('Diagram library is not available in browser context.');
        }

        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'dark',
          flowchart: {
            useMaxWidth: false,
            // SVG text stays crisper than HTML labels when the full map is zoomed/scaled.
            htmlLabels: false,
            curve: 'basis',
            nodeSpacing: 72,
            rankSpacing: 96,
          },
        });

        const renderId = `system-map-${Date.now()}`;
        const { svg } = await window.mermaid.render(renderId, systemMapDefinition);
        if (!cancelled) {
          systemMapRenderedSignatureRef.current = renderSignature;
          systemMapFailedSignatureRef.current = '';
          systemMapViewInitializedRef.current = false;
          const wMatch = svg.match(/\bwidth="([\d.]+)"/);
          const hMatch = svg.match(/\bheight="([\d.]+)"/);
          const w = wMatch ? parseFloat(wMatch[1]) : 800;
          const h = hMatch ? parseFloat(hMatch[1]) : 600;
          if (w > 0 && h > 0) setMapSvgSize({ w, h });
          setSystemMapSvg(svg);
        }
      } catch (error) {
        if (!cancelled) {
          systemMapRenderedSignatureRef.current = '';
          systemMapFailedSignatureRef.current = renderSignature;
          setSystemMapError(error instanceof Error ? error.message : 'Unable to render System Map.');
          setSystemMapSvg('');
        }
      } finally {
        systemMapRenderInFlightRef.current = false;
        setIsSystemMapLoading(false);
      }
    };

    void renderSystemMap();

    return () => {
      cancelled = true;
      systemMapRenderInFlightRef.current = false;
    };
  }, [activeTab, systemMapActivationKey, systemMapDefinition, systemMapRefreshKey, systemMapError, systemMapSvg]);

  const syncMapTransform = useCallback((nextView?: { x: number; y: number; scale: number }) => {
    if (nextView) {
      mapViewRef.current = nextView;
    }

    if (mapFrameRef.current !== null) return;
    mapFrameRef.current = window.requestAnimationFrame(() => {
      mapFrameRef.current = null;
      const viewport = systemMapViewportRef.current;
      if (!viewport) return;
      const { x, y, scale } = mapViewRef.current;
      const snappedX = Math.round(x);
      const snappedY = Math.round(y);
      const snappedScale = Math.max(0.1, Math.min(12, Math.round(scale * 1000) / 1000));
      viewport.style.transform = `translate(${snappedX}px, ${snappedY}px) scale(${snappedScale})`;
    });
  }, []);

  const clearSystemMapPointerState = useCallback(() => {
    const container = systemMapContainerRef.current;

    mapIsDragging.current = false;
    mapHasMoved.current = false;

    if (container) {
      container.style.cursor = 'grab';
    }
  }, []);

  const clearSystemMapRecoveryTimers = useCallback(() => {
    if (systemMapRecoveryTimerRef.current !== null) {
      window.clearTimeout(systemMapRecoveryTimerRef.current);
      systemMapRecoveryTimerRef.current = null;
    }

    if (systemMapAutoRecoverTimerRef.current !== null) {
      window.clearTimeout(systemMapAutoRecoverTimerRef.current);
      systemMapAutoRecoverTimerRef.current = null;
    }

    systemMapRecoveryTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });
    systemMapRecoveryTimersRef.current = [];
  }, []);

  const requestHardSystemMapReset = useCallback((force = false) => {
    if (activeTab !== 'sitemap') return;

    const now = Date.now();
    const elapsed = now - systemMapLastHardResetAtRef.current;
    if (!force && (elapsed < 1200 || systemMapRenderInFlightRef.current)) {
      return;
    }

    systemMapLastHardResetAtRef.current = now;
    systemMapRenderedSignatureRef.current = '';
    systemMapFailedSignatureRef.current = '';
    systemMapViewInitializedRef.current = false;
    setSystemMapRefreshKey((current) => current + 1);
    setSystemMapActivationKey((current) => current + 1);
  }, [activeTab]);

  // ── Auto-fit SVG to canvas when it renders ──
  const resetMapView = useCallback(() => {
    const container = systemMapContainerRef.current;
    if (!container) return;
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const { w: svgW, h: svgH } = mapSvgSize;
    if (!cW || !cH || !svgW || !svgH) return;
    const fitScale = Math.min((cW * 0.92) / svgW, (cH * 0.92) / svgH, 1);
    const scale = Math.max(0.1, fitScale * SYSTEM_MAP_INITIAL_ZOOM_OUT_FACTOR);
    syncMapTransform({ x: (cW - svgW * scale) / 2, y: (cH - svgH * scale) / 2, scale });
    systemMapViewInitializedRef.current = true;
  }, [mapSvgSize, syncMapTransform]);

  const refreshSystemMapViewport = useCallback((rerenderIfMissing = false) => {
    if (activeTab !== 'sitemap') return;

    clearSystemMapPointerState();
    setSystemMapHoverCard(null);

    clearSystemMapRecoveryTimers();

    const container = systemMapContainerRef.current;
    const hasViewport = Boolean(systemMapViewportRef.current);
    const hasRenderableSize = Boolean(container && container.clientWidth > 0 && container.clientHeight > 0);

    if (!hasViewport && systemMapSvg) {
      window.requestAnimationFrame(() => {
        if (activeTab !== 'sitemap') return;
        if (!systemMapViewInitializedRef.current) {
          resetMapView();
        }
        syncMapTransform();
      });
      return;
    }

    if (rerenderIfMissing && (!systemMapSvg || !hasRenderableSize)) {
      requestHardSystemMapReset(true);
      return;
    }

    systemMapRecoveryTimerRef.current = window.setTimeout(() => {
      if (activeTab !== 'sitemap') return;
      clearSystemMapPointerState();
      if (!systemMapViewInitializedRef.current) {
        resetMapView();
      }
      syncMapTransform();
    }, 80);
  }, [activeTab, clearSystemMapPointerState, clearSystemMapRecoveryTimers, requestHardSystemMapReset, resetMapView, syncMapTransform, systemMapSvg]);

  const recoverSystemMapAfterVisibilityChange = useCallback(() => {
    refreshSystemMapViewport(false);
  }, [refreshSystemMapViewport]);

  useEffect(() => {
    if (activeTab !== 'sitemap' || !systemMapSvg) return;
    const timer = window.setTimeout(() => {
      if (!systemMapViewInitializedRef.current) {
        resetMapView();
      } else {
        syncMapTransform();
      }
    }, 40);
    let resizeObserver: ResizeObserver | null = null;

    const container = systemMapContainerRef.current;
    if (container && typeof ResizeObserver !== 'undefined') {
      let rafPending = false;
      resizeObserver = new ResizeObserver(() => {
        if (rafPending) return;
        rafPending = true;
        window.requestAnimationFrame(() => {
          rafPending = false;
          if (!systemMapViewInitializedRef.current) {
            resetMapView();
            return;
          }
          syncMapTransform();
        });
      });
      resizeObserver.observe(container);
    }

    return () => {
      window.clearTimeout(timer);
      resizeObserver?.disconnect();
      if (mapFrameRef.current !== null) {
        window.cancelAnimationFrame(mapFrameRef.current);
        mapFrameRef.current = null;
      }
    };
  }, [activeTab, systemMapSvg, resetMapView, syncMapTransform]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearSystemMapPointerState();
        setSystemMapHoverCard(null);
        return;
      }

      if (document.visibilityState === 'visible') {
        recoverSystemMapAfterVisibilityChange();
      }
    };

    const handleWindowBlur = () => {
      clearSystemMapPointerState();
      setSystemMapHoverCard(null);
    };

    const handleWindowFocus = () => {
      recoverSystemMapAfterVisibilityChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);

      clearSystemMapRecoveryTimers();
    };
  }, [clearSystemMapPointerState, clearSystemMapRecoveryTimers, recoverSystemMapAfterVisibilityChange]);

  // ── Map interaction: wheel zoom, drag pan, node hover/click ──
  useEffect(() => {
    if (activeTab !== 'sitemap' || !systemMapSvg || !systemMapContainerRef.current) return;
    const container = systemMapContainerRef.current;
    const viewport = systemMapViewportRef.current;
    container.style.cursor = 'grab';

    const resolveNodeElement = (target: EventTarget | null, path?: EventTarget[]) => {
      if (target instanceof Element) {
        const directMatch = target.closest('g.node, .node') as SVGGElement | null;
        if (directMatch) return directMatch;
      }

      const eventPath = path ?? [];
      for (const entry of eventPath) {
        if (!(entry instanceof Element)) continue;
        if (entry.classList.contains('node') && entry instanceof SVGGElement) {
          return entry;
        }
        const nestedMatch = entry.closest?.('g.node, .node') as SVGGElement | null;
        if (nestedMatch) return nestedMatch;
      }

      return null;
    };

    const nodeCategoryFromEl = (nodeEl: SVGGElement) => {
      const groupClasses = ['groupRoot', 'groupPublic', 'groupWorkspace', 'groupStudent', 'groupAdmin', 'groupLecturer', 'groupSection'];
      return Array.from(nodeEl.classList).find((c) => groupClasses.includes(c)) ?? 'groupSection';
    };

    const getNodeAnchor = (nodeEl: SVGGElement) => {
      const containerRect = container.getBoundingClientRect();
      const nodeRect = nodeEl.getBoundingClientRect();
      if (nodeRect.width > 0 && nodeRect.height > 0) {
        return {
          anchorX: nodeRect.right - containerRect.left,
          anchorY: nodeRect.top - containerRect.top + nodeRect.height / 2,
        };
      }

      try {
        const box = nodeEl.getBBox();
        return { anchorX: box.x + box.width, anchorY: box.y + box.height / 2 };
      } catch {
        return { anchorX: 0, anchorY: 0 };
      }
    };

    const getNodeInfo = (nodeEl: SVGGElement) => {
      const rawLabel = normalizeSystemMapLabel(nodeEl.textContent || '');
      const label = stripIndicatorFromLabel(rawLabel);
      const nodeId = nodeEl.id || '';
      const candidateNodes = systemMapVisibleNodeLookup[label] ?? [];
      const categoryFromEl = nodeCategoryFromEl(nodeEl);
      const nodeMeta = candidateNodes.find((node) => node.group === categoryFromEl) ?? candidateNodes[0] ?? (nodeId ? systemMapParsed.nodesById[nodeId] : null);
        const route = nodeMeta?.route ?? systemMapRouteLookup[label] ?? null;
      if (!label) return null;
      const category = nodeMeta?.group ?? categoryFromEl;
      const { anchorX, anchorY } = getNodeAnchor(nodeEl);
      return {
        label,
        route,
        category,
        nodeId: nodeMeta?.id ?? (nodeId || `${label}-${route}`),
        anchorX,
        anchorY,
        expandable: (nodeMeta?.children.length ?? 0) > 0,
        expanded: false,
        childCount: nodeMeta?.children.length ?? 0,
      };
    };

    const onWheel = (e: WheelEvent) => {
      systemMapLastInteractionAtRef.current = Date.now();
      e.preventDefault();
      e.stopPropagation();
      setSystemMapHoverCard(null);
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prev = mapViewRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      const ns = Math.max(0.1, Math.min(12, prev.scale * factor));
      const r = ns / prev.scale;
      syncMapTransform({ x: mx - (mx - prev.x) * r, y: my - (my - prev.y) * r, scale: ns });
    };

    const onPointerDown = (e: PointerEvent) => {
      systemMapLastInteractionAtRef.current = Date.now();
      if ((e.target as Element)?.closest?.('[data-map-quick-nav]')) return;
      if ((e.target as Element)?.closest?.('[data-map-hover-card]')) return;
      if (e.button !== 0) return;

      const nodeEl = resolveNodeElement(e.target, e.composedPath());
      if (nodeEl) {
        mapIsDragging.current = false;
        return;
      }

      mapIsDragging.current = true;
      mapDragStartedAtRef.current = Date.now();
      mapHasMoved.current = false;
      mapDragLast.current = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
      setSystemMapHoverCard(null);
      setSystemMapQuickNav(null);
    };

    const onPointerMove = (e: PointerEvent) => {
      systemMapLastInteractionAtRef.current = Date.now();
      if (!mapIsDragging.current) {
        const nodeEl = resolveNodeElement(e.target, e.composedPath());
        if (!nodeEl) {
          setSystemMapHoverCard(null);
          return;
        }

        const info = getNodeInfo(nodeEl);
        if (!info) {
          setSystemMapHoverCard(null);
          return;
        }

        setSystemMapHoverCard((prev) => {
          if (
            prev &&
            prev.nodeId === info.nodeId &&
            prev.anchorX === info.anchorX &&
            prev.anchorY === info.anchorY
          ) {
            return prev;
          }
          return info;
        });
        return;
      }

      if (!mapIsDragging.current) return;
      const dx = e.clientX - mapDragLast.current.x;
      const dy = e.clientY - mapDragLast.current.y;
      if (e.buttons === 0) {
        stopDrag();
        return;
      }
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        mapHasMoved.current = true;
      }
      mapDragLast.current = { x: e.clientX, y: e.clientY };
      const prev = mapViewRef.current;
      syncMapTransform({ ...prev, x: prev.x + dx, y: prev.y + dy });
    };

    const stopDrag = () => {
      clearSystemMapPointerState();
      window.setTimeout(() => {
        mapHasMoved.current = false;
      }, 0);
    };

    const onPointerUp = () => {
      stopDrag();
    };

    const onPointerLeave = () => {
      if (mapIsDragging.current) {
        stopDrag();
        return;
      }

      setSystemMapHoverCard(null);
    };

    const onClick = (e: MouseEvent) => {
      systemMapLastInteractionAtRef.current = Date.now();
      if ((e.target as Element)?.closest?.('[data-map-quick-nav]')) return;
      if ((e.target as Element)?.closest?.('[data-map-hover-card]')) return;
      if (mapIsDragging.current || mapHasMoved.current) return;

      const nodeEl = resolveNodeElement(e.target, e.composedPath());
      if (!nodeEl) { setSystemMapQuickNav(null); return; }

      const info = getNodeInfo(nodeEl);
      if (!info) { setSystemMapQuickNav(null); return; }

      e.preventDefault();
      setSystemMapQuickNav(info);
    };

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault();
      resetMapView();
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    viewport?.querySelectorAll('g.node').forEach((node) => {
      (node as SVGGElement).style.cursor = 'pointer';
    });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDblClick);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('click', onClick);
      container.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      container.style.cursor = '';
      stopDrag();
    };
  }, [activeTab, clearSystemMapPointerState, normalizeSystemMapLabel, stripIndicatorFromLabel, systemMapParsed.nodesById, systemMapRouteLookup, systemMapSvg, systemMapVisibleNodeLookup, resetMapView, syncMapTransform, systemMapInteractionVersion]);

  useEffect(() => {
    if (activeTab !== 'sitemap') return;

    const watchdog = window.setInterval(() => {
      if (!mapIsDragging.current) return;

      const stalledFor = Date.now() - mapDragStartedAtRef.current;
      if (stalledFor < 900) return;

      clearSystemMapPointerState();
      setSystemMapHoverCard(null);
      setSystemMapQuickNav(null);
      mapDragStartedAtRef.current = Date.now();
    }, 260);

    return () => {
      window.clearInterval(watchdog);
    };
  }, [activeTab, clearSystemMapPointerState]);

  useEffect(() => {
    const previousTab = previousAdminTabRef.current;
    previousAdminTabRef.current = activeTab;

    if (activeTab !== 'sitemap') {
      clearSystemMapRecoveryTimers();
      clearSystemMapPointerState();
      setSystemMapQuickNav(null);
      setSystemMapHoverCard(null);
      return;
    }

    clearSystemMapPointerState();
    setSystemMapQuickNav(null);
    setSystemMapHoverCard(null);

    if (previousTab !== 'sitemap') {
      // Mirror the manual toolbar recovery (toggle/refresh buttons) on tab entry.
      setSystemMapInteractionVersion((current) => current + 1);
      systemMapRenderedSignatureRef.current = '';
      systemMapFailedSignatureRef.current = '';
      systemMapViewInitializedRef.current = false;
      systemMapLastInteractionAtRef.current = Date.now();
      setSystemMapRefreshKey((current) => current + 1);
      setSystemMapActivationKey((current) => current + 1);

      // Watchdog: if map is still non-interactive after entry, auto-run recovery once.
      if (systemMapAutoRecoverTimerRef.current !== null) {
        window.clearTimeout(systemMapAutoRecoverTimerRef.current);
      }
      const entryStamp = systemMapLastInteractionAtRef.current;
      systemMapAutoRecoverTimerRef.current = window.setTimeout(() => {
        if (activeTab !== 'sitemap') return;
        if (systemMapLastInteractionAtRef.current !== entryStamp) return;
        setSystemMapInteractionVersion((current) => current + 1);
        requestHardSystemMapReset(true);
      }, 650);
      return;
    }

    if (systemMapSvg) {
      refreshSystemMapViewport();
      return;
    }

    systemMapRenderedSignatureRef.current = '';
    setSystemMapActivationKey((current) => current + 1);
  }, [activeTab, clearSystemMapPointerState, clearSystemMapRecoveryTimers, refreshSystemMapViewport, requestHardSystemMapReset, systemMapSvg]);

  useEffect(() => {
    if (!systemMapSvg) {
      setSystemMapQuickNav(null);
      setSystemMapHoverCard(null);
    }
  }, [systemMapSvg]);

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
    sitemap: [],
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
      <aside className={`relative z-30 bg-[#0F1A2A] border-r border-[#22C55E]/18 transition-all duration-300 flex flex-col ${collapsed ? 'w-[60px]' : 'w-64'}`}>
        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className={`vertex-brand p-4 border-b border-[#22C55E]/10 flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.84" />
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.84" />
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.84" />
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-display text-xl tracking-tight vertex-wordmark truncate">Vertex</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/14 border border-red-500/30 text-red-300 uppercase tracking-wide">Admin</span>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex absolute -right-3 top-5 z-[120] w-6 h-6 rounded-full bg-[#162032] border border-[#22C55E]/25 items-center justify-center text-slate-200 hover:text-[#22C55E] hover:border-[#22C55E]/55 transition-all shadow-md pointer-events-auto">
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Nav */}
          <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchQuery(''); setSelectedUserIds(new Set()); setUserSegment('all'); }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === item.id ? 'text-white bg-[#22C55E]/18 border border-[#22C55E]/30' : 'text-slate-200 hover:bg-[#162032] hover:text-white'} ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <span className={activeTab === item.id ? 'text-[#22C55E]' : 'text-slate-300'}>{item.icon}</span>
                {!collapsed && <span className="leading-tight">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          {!collapsed && (
            <div className="p-3 border-t border-[#22C55E]/10">
              <button onClick={() => setShowSignOutConfirm(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-200 hover:text-red-300 rounded-lg hover:bg-red-500/12 transition-colors">
                <LogOut size={16} />
                <span>{t.admin.signOut}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className={`relative z-10 flex-1 ${activeTab === 'sitemap' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0A0F1A]/92 border-b border-[#22C55E]/12 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{currentTab?.label}</h1>
            <p className="text-xs text-slate-300 mt-0.5">{currentTab?.subtitle}</p>
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

            {/* ═══════════ TAB 6: SYSTEM MAP ═══════════ */}
            {activeTab === 'sitemap' && (
              <div className="-mx-6 -my-6 flex flex-col">

                {(() => {
                  const categoryMeta: Record<string, { label: string; dot: string; border: string; bg: string; text: string }> = {
                    groupRoot:      { label: 'Core',      dot: 'bg-emerald-300', border: 'border-emerald-300/40', bg: 'bg-emerald-950/30', text: 'text-emerald-200' },
                    groupPublic:    { label: 'Marketing', dot: 'bg-cyan-300',    border: 'border-cyan-300/45',    bg: 'bg-cyan-950/35',    text: 'text-cyan-200' },
                    groupWorkspace: { label: 'Workspace', dot: 'bg-blue-300',    border: 'border-blue-300/45',    bg: 'bg-blue-950/35',    text: 'text-blue-200' },
                    groupStudent:   { label: 'Student',   dot: 'bg-lime-300',    border: 'border-lime-300/45',    bg: 'bg-lime-950/30',    text: 'text-lime-200' },
                    groupLecturer:  { label: 'Lecturer',  dot: 'bg-violet-300',  border: 'border-violet-300/45',  bg: 'bg-violet-950/30',  text: 'text-violet-200' },
                    groupAdmin:     { label: 'Admin',     dot: 'bg-orange-300',  border: 'border-orange-300/45',  bg: 'bg-orange-950/30',  text: 'text-orange-200' },
                    groupSection:   { label: 'Section',   dot: 'bg-slate-300',   border: 'border-slate-300/35',   bg: 'bg-slate-900/35',   text: 'text-slate-200' },
                  };

                  const getNodeCardStyle = (card: { anchorX: number; anchorY: number }, width: number, height: number, sideOffset: number) => {
                    const projectedX = card.anchorX + sideOffset;
                    const projectedY = card.anchorY - height / 2;
                    const minX = 10;
                    const minY = 10;
                    const maxX = Math.max(minX, (systemMapContainerRef.current?.clientWidth ?? 0) - width - 10);
                    const maxY = Math.max(minY, (systemMapContainerRef.current?.clientHeight ?? 0) - height - 10);
                    return {
                      left: Math.min(maxX, Math.max(minX, projectedX)),
                      top: Math.min(maxY, Math.max(minY, projectedY)),
                    };
                  };

                  const quickMeta = systemMapQuickNav ? (categoryMeta[systemMapQuickNav.category] ?? categoryMeta.groupSection) : null;
                  const hoverMeta = systemMapHoverCard ? (categoryMeta[systemMapHoverCard.category] ?? categoryMeta.groupSection) : null;

                  const describeNode = (label: string, category: string) => {
                    const clean = label.toLowerCase();
                    if (clean.includes('pricing')) return 'Pricing plans and package comparison.';
                    if (clean.includes('login')) return 'User sign-in entry to workspaces.';
                    if (clean.includes('project')) return 'Project planning, tracking, and delivery area.';
                    if (clean.includes('member')) return 'Team members and collaboration management.';
                    if (clean.includes('setting')) return 'Workspace configuration and preferences.';
                    if (clean.includes('audit')) return 'Admin logs for system actions and changes.';
                    if (clean.includes('analytics')) return 'Metrics and insight dashboards.';
                    if (category === 'groupPublic') return 'Marketing and public-facing navigation.';
                    if (category === 'groupStudent') return 'Student workspace feature area.';
                    if (category === 'groupLecturer') return 'Lecturer workspace feature area.';
                    if (category === 'groupAdmin') return 'Administrative control and operations.';
                    return 'Part of the product navigation structure.';
                  };

                  return (
                    <>
                      <div className="px-6 py-2.5 border-b border-white/[0.04] bg-[#0A111D]">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-500 mr-1">Legend:</span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-cyan-300/45 bg-cyan-950/40 text-cyan-200">
                              <span className="w-2 h-2 rounded-full bg-cyan-300" /> Marketing
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-300/45 bg-blue-950/45 text-blue-200">
                              <span className="w-2 h-2 rounded-full bg-blue-300" /> Workspace
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-lime-300/45 bg-lime-900/35 text-lime-200">
                              <span className="w-2 h-2 rounded-full bg-lime-300" /> Student
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-violet-300/45 bg-violet-950/35 text-violet-200">
                              <span className="w-2 h-2 rounded-full bg-violet-300" /> Lecturer
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-orange-300/45 bg-orange-950/35 text-orange-200">
                              <span className="w-2 h-2 rounded-full bg-orange-300" /> Admin
                            </span>
                          </div>
                          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0B1321]/92 backdrop-blur-md p-1 shadow-xl shadow-black/40">
                            <button
                              onClick={() => setIsWideSystemMap(v => !v)}
                              className="w-8 h-8 rounded-lg border border-slate-700/50 bg-[#0F1A2A] text-slate-400 hover:text-[#22C55E] hover:border-[#22C55E]/40 hover:bg-[#162032] transition-all flex items-center justify-center"
                              title={isWideSystemMap ? 'Switch to top-down (TD)' : 'Switch to left-right (LR)'}
                            >
                              {isWideSystemMap ? <ArrowLeftRight size={13} /> : <ArrowUpDown size={13} />}
                            </button>
                            <button
                              onClick={() => setSystemMapRefreshKey(k => k + 1)}
                              className="w-8 h-8 rounded-lg border border-slate-700/50 bg-[#0F1A2A] text-slate-400 hover:text-[#22C55E] hover:border-[#22C55E]/40 hover:bg-[#162032] transition-all flex items-center justify-center"
                              title="Re-render diagram"
                            >
                              <RefreshCw size={13} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        {/* ── Map canvas ── */}
                        <div className="relative min-w-0">
                          <div
                            ref={systemMapContainerRef}
                            className="sitemap-stage relative w-full overflow-hidden bg-[#060C16] touch-none select-none overscroll-contain"
                            style={{ height: 'calc(100vh - 130px)', overscrollBehavior: 'contain', isolation: 'isolate' }}
                          >
                            <div
                              className="absolute inset-0 z-0 pointer-events-none opacity-[0.10]"
                              style={{ backgroundImage: 'radial-gradient(circle, #4B5563 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                            />

                            {isSystemMapLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
                                <div className="w-10 h-10 rounded-full border-2 border-[#22C55E]/25 border-t-[#22C55E] animate-spin" />
                                <p className="text-sm text-slate-400 animate-pulse">Building diagram…</p>
                              </div>
                            )}

                            {systemMapError && !isSystemMapLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                  <XCircle size={26} className="text-red-400" />
                                </div>
                                <div className="text-center max-w-xs px-4">
                                  <p className="text-sm font-medium text-red-300 mb-1.5">Failed to render diagram</p>
                                  <p className="text-xs text-slate-500 leading-relaxed">{systemMapError}</p>
                                </div>
                                <button
                                  onClick={() => setSystemMapRefreshKey(k => k + 1)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#162032] border border-[#22C55E]/25 text-[#22C55E] text-xs font-semibold hover:bg-[#1E2D45] transition-colors"
                                >
                                  <RefreshCw size={13} /> Try again
                                </button>
                              </div>
                            )}

                            {!isSystemMapLoading && !systemMapError && systemMapSvg && (
                              <div
                                ref={systemMapViewportRef}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  zIndex: 10,
                                  pointerEvents: 'auto',
                                  width: mapSvgSize.w,
                                  height: mapSvgSize.h,
                                  transform: 'translate(0px, 0px) scale(1)',
                                  transformOrigin: '0 0',
                                }}
                                dangerouslySetInnerHTML={{ __html: systemMapSvg }}
                              />
                            )}

                            {!isSystemMapLoading && !systemMapError && !systemMapSvg && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10">
                                <div className="w-16 h-16 rounded-2xl bg-[#22C55E]/08 border border-[#22C55E]/20 flex items-center justify-center">
                                  <ListChecks size={28} className="text-[#22C55E]/60" />
                                </div>
                                <div className="text-center max-w-xs px-4">
                                  <p className="text-sm font-semibold text-slate-300 mb-1.5">System Map chưa tải</p>
                                  <p className="text-xs text-slate-500 leading-relaxed">Nhấn nút làm mới ở góc phải để vẽ sơ đồ hệ thống.</p>
                                </div>
                                <button
                                  onClick={() => setSystemMapRefreshKey(k => k + 1)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#162032] border border-[#22C55E]/25 text-[#22C55E] text-xs font-semibold hover:bg-[#1E2D45] transition-colors"
                                >
                                  <RefreshCw size={13} /> Tải sơ đồ
                                </button>
                              </div>
                            )}

                            {systemMapHoverCard && hoverMeta && !systemMapQuickNav && (
                              <div
                                data-map-hover-card="true"
                                className="absolute z-30 w-64 rounded-xl border border-white/[0.08] bg-[#0B1321]/96 p-3 shadow-2xl shadow-black/40 pointer-events-none"
                                style={getNodeCardStyle(systemMapHoverCard, 256, 132, 18)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${hoverMeta.border} ${hoverMeta.bg} ${hoverMeta.text}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${hoverMeta.dot}`} />
                                    {hoverMeta.label}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-white leading-tight">{systemMapHoverCard.label}</p>
                                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                                  {describeNode(systemMapHoverCard.label, systemMapHoverCard.category)}
                                </p>
                                <p className="mt-2 break-all font-mono text-[10px] text-slate-500">
                                  {systemMapHoverCard.route ?? 'No direct route'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {systemMapQuickNav && quickMeta && (
                            <motion.div
                              className="pointer-events-none absolute inset-y-0 right-0 z-40 flex items-stretch justify-end p-3 sm:p-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                            >
                              <motion.aside
                                data-map-quick-nav="true"
                                onClick={(event) => event.stopPropagation()}
                                className="pointer-events-auto h-full w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09111D]/96 shadow-2xl shadow-black/50 backdrop-blur-xl"
                                initial={{ x: 32, opacity: 0.72, scale: 0.985 }}
                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                exit={{ x: 20, opacity: 0, scale: 0.99 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              >
                                <div className="flex h-full flex-col">
                                  <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                                    <div>
                                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${quickMeta.border} ${quickMeta.bg} ${quickMeta.text}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${quickMeta.dot}`} />
                                        {quickMeta.label}
                                      </span>
                                      <p className="mt-3 text-base font-semibold text-white leading-tight">{systemMapQuickNav.label}</p>
                                    </div>
                                    <button
                                      onClick={() => setSystemMapQuickNav(null)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/25 hover:text-white"
                                      title="Close details"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                                    <section>
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Overview</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-300">
                                        {describeNode(systemMapQuickNav.label, systemMapQuickNav.category)}
                                      </p>
                                    </section>

                                    <section className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="rounded-xl border border-white/[0.06] bg-[#0D1727] p-3">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Category</p>
                                        <p className="mt-2 font-medium text-slate-100">{quickMeta.label}</p>
                                      </div>
                                      <div className="rounded-xl border border-white/[0.06] bg-[#0D1727] p-3">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Children</p>
                                        <p className="mt-2 font-medium text-slate-100">{systemMapQuickNav.childCount}</p>
                                      </div>
                                    </section>

                                    <section>
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Path</p>
                                      <div className="mt-2 rounded-xl border border-white/[0.06] bg-[#0D1727] px-3 py-3">
                                        <p className="break-all font-mono text-xs leading-5 text-slate-200">
                                          {systemMapQuickNav.route ?? 'No direct route for this node.'}
                                        </p>
                                      </div>
                                    </section>
                                  </div>

                                  <div className="border-t border-white/[0.06] px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setSystemMapQuickNav(null)}
                                        className="flex-1 h-10 rounded-lg border border-white/10 text-sm font-semibold text-slate-400 transition-colors hover:border-white/25 hover:text-white"
                                      >
                                        Close
                                      </button>
                                      <button
                                        onClick={() => {
                                          const route = systemMapQuickNav.route;
                                          setSystemMapQuickNav(null);
                                          openSystemMapRoute(route);
                                        }}
                                        disabled={!systemMapQuickNav.route}
                                        className="flex-1 h-10 rounded-lg bg-[#22C55E] px-3 text-sm font-bold text-[#052E16] transition-colors hover:bg-[#4ADE80] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                                        title={systemMapQuickNav.route ? `Open ${systemMapQuickNav.route}` : 'No route available'}
                                      >
                                        Open
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.aside>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Footer status bar ── */}
                      <div className="flex items-center justify-between px-6 py-2 border-t border-white/[0.05] bg-[#0B1321]/80 text-[11px]">
                        <span className="text-slate-600">
                          {systemMapVisibleGraph.nodes.length} visible / {systemMapNodeCount} total nodes
                        </span>

                      </div>
                    </>
                  );
                })()}

              </div>
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
