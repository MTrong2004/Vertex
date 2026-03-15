import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appFile = path.join(rootDir, 'src', 'App.tsx');
const resourcesPageFile = path.join(rootDir, 'src', 'pages', 'ResourcesPage.tsx');
const legalPageFile = path.join(rootDir, 'src', 'pages', 'LegalPage.tsx');
const sidebarFile = path.join(rootDir, 'src', 'components', 'dashboard', 'Sidebar.tsx');
const dashboardFile = path.join(rootDir, 'src', 'components', 'dashboard', 'Dashboard.tsx');
const adminDashboardFile = path.join(rootDir, 'src', 'components', 'dashboard', 'AdminDashboard.tsx');
const lecturerDashboardFile = path.join(rootDir, 'src', 'components', 'dashboard', 'lecturer', 'LecturerDashboard.tsx');
const landingPageFile = path.join(rootDir, 'src', 'pages', 'LandingPage.tsx');
const pagesDir = path.join(rootDir, 'src', 'pages');
const outputFile = path.join(rootDir, 'website-structure.md');

const safeRead = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
};

const appSource = safeRead(appFile);
const resourcesSource = safeRead(resourcesPageFile);
const legalSource = safeRead(legalPageFile);
const sidebarSource = safeRead(sidebarFile);
const dashboardSource = safeRead(dashboardFile);
const adminSource = safeRead(adminDashboardFile);
const lecturerSource = safeRead(lecturerDashboardFile);
const landingSource = safeRead(landingPageFile);

const unique = (arr) => [...new Set(arr)];

const parseQuotedList = (source, regex) => {
  const result = [];
  for (const match of source.matchAll(regex)) {
    result.push(match[1]);
  }
  return result;
};

const listTsxBaseNames = (dirPath) => {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
      .map((entry) => entry.name.replace(/\.tsx$/, ''));
  } catch {
    return [];
  }
};

const routeRegex = /<Route\s+path="([^"]+)"/g;
const routes = [];
for (const match of appSource.matchAll(routeRegex)) {
  routes.push(match[1]);
}

const routeSet = new Set(routes);
const hasRoute = (route) => routeSet.has(route);

const resourceTabs = parseQuotedList(
  resourcesSource,
  /\{\s*id:\s*'([^']+)'\s*,\s*label:/g,
).filter((id) => ['docs', 'guide', 'blog', 'community'].includes(id));

const legalTabs = parseQuotedList(
  legalSource,
  /\{\s*id:\s*'([^']+)'\s*,\s*label:/g,
).filter((id) => ['terms', 'privacy'].includes(id));

const sidebarIds = parseQuotedList(
  sidebarSource,
  /\{\s*id:\s*'([^']+)'\s*,\s*label:/g,
).filter((id) => ['dashboard', 'projects', 'members', 'settings'].includes(id));

const projectTabMatch = dashboardSource.match(/type\s+ProjectTab\s*=\s*([^;]+);/);
const projectTabs = projectTabMatch
  ? [...projectTabMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : [];

const dashboardViewModeMatch = dashboardSource.match(/useState<([^>]+)>\('kanban'\)/);
const dashboardViewModes = dashboardViewModeMatch
  ? [...dashboardViewModeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : [];

const adminNavItemsBlock = adminSource.match(/const\s+navItems\s*=\s*\[([\s\S]*?)\];/);
const adminTabs = adminNavItemsBlock
  ? parseQuotedList(adminNavItemsBlock[1], /id:\s*'([^']+)'/g)
  : [];

const lecturerViews = parseQuotedList(
  lecturerSource,
  /\{\s*id:\s*'([^']+)'\s*,\s*label:/g,
);

const lecturerViewTypeMatch = lecturerSource.match(/type\s+LecturerView\s*=\s*([^;]+);/);
const lecturerViewUnion = lecturerViewTypeMatch
  ? [...lecturerViewTypeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : [];

const landingSectionImports = parseQuotedList(
  landingSource,
  /from\s+'\.\.\/components\/landing\/([^']+)'/g,
);

const landingLayoutImports = parseQuotedList(
  landingSource,
  /from\s+'\.\.\/components\/layout\/([^']+)'/g,
);

const landingModalImports = parseQuotedList(
  landingSource,
  /from\s+'\.\.\/components\/modals\/([^']+)'/g,
);

const dashboardPanelsAndModals = parseQuotedList(
  dashboardSource,
  /from\s+'\.\/([^']+)'/g,
).filter((name) => ['TaskPanel', 'AiChatPanel', 'FloatingAssistant', 'TeamModal', 'SettingsModal', 'ProfileModal', 'Sidebar'].includes(name));

const titleCase = (value) => {
  const map = {
    ai: 'AI',
    docs: 'Documentation',
    guide: 'Guides',
    blog: 'Blog',
    community: 'Community',
    terms: 'Terms',
    privacy: 'Privacy',
    dashboard: 'Dashboard',
    projects: 'Projects',
    members: 'Members',
    settings: 'Settings',
    board: 'Board',
    'ai-planner': 'AI Planner',
    insights: 'Insights',
    files: 'Files',
    auditlog: 'Audit Log',
  };

  if (map[value]) return map[value];

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const treeLine = (prefix, isLast, text) => `${prefix}${isLast ? '└' : '├'} ${text}`;

const renderTreeNode = (node, prefix, isLast, lines) => {
  lines.push(treeLine(prefix, isLast, node.label));
  const nextPrefix = `${prefix}${isLast ? '  ' : '│ '}`;
  for (let i = 0; i < (node.children || []).length; i += 1) {
    renderTreeNode(node.children[i], nextPrefix, i === node.children.length - 1, lines);
  }
};

const buildTree = () => {
  const tree = [];

  if (hasRoute('/features')) tree.push({ label: 'Features', children: [] });
  if (hasRoute('/pricing')) tree.push({ label: 'Pricing', children: [] });
  if (hasRoute('/changelog')) tree.push({ label: 'Changelog', children: [] });

  if (hasRoute('/resources/:tab?')) {
    const uxResourceTabs = unique(resourceTabs).filter((tab) => ['docs', 'guide', 'blog', 'community'].includes(tab));
    tree.push({
      label: 'Resources',
      children: uxResourceTabs.map((tab) => ({ label: titleCase(tab), children: [] })),
    });
  }

  if (hasRoute('/legal/:tab?')) {
    tree.push({
      label: 'Legal',
      children: unique(legalTabs).map((tab) => ({ label: titleCase(tab), children: [] })),
    });
  }

  const workspaceChildren = [];

  if (hasRoute('/dashboard')) {
    workspaceChildren.push({
      label: 'Student Workspace',
      children: [
        {
          label: 'Dashboard',
          children: [
            { label: 'Active Projects', children: [] },
            { label: 'Tasks Today', children: [] },
            { label: 'Progress Overview', children: [] },
          ],
        },
        {
          label: 'Projects',
          children: unique([...projectTabs, ...dashboardViewModes])
            .map((item) => titleCase(item))
            .filter((label) => ['Board', 'Timeline', 'Calendar', 'AI Planner', 'Insights', 'Files', 'Members'].includes(label))
            .map((label) => ({ label, children: [] })),
        },
        {
          label: 'Members',
          children: [],
        },
        {
          label: 'Settings',
          children: [],
        },
      ],
    });
  }

  if (hasRoute('/lecturer')) {
    workspaceChildren.push({
      label: 'Lecturer Workspace',
      children: [
        { label: 'Overview', children: [] },
        { label: 'Groups', children: [{ label: 'Group Detail', children: [] }] },
        { label: 'Deadlines', children: [] },
        { label: 'Settings', children: [] },
      ],
    });
  }

  if (hasRoute('/admin')) {
    workspaceChildren.push({
      label: 'Admin Workspace',
      children: unique(adminTabs)
        .map((tab) => titleCase(tab))
        .filter((label) => ['Users', 'AI', 'Analytics', 'Audit Log', 'Config'].includes(label))
        .map((label) => ({ label, children: [] })),
    });
  }

  if (hasRoute('/login')) {
    tree.push({
      label: 'Login',
      children: [{ label: 'Workspace', children: workspaceChildren }],
    });
  }

  return tree;
};

const countTreeNodes = (nodes) => {
  let count = 0;
  const walk = (node) => {
    count += 1;
    for (const child of node.children || []) walk(child);
  };
  for (const node of nodes) walk(node);
  return count;
};

const sitemapTree = buildTree();
const totalRoutes = unique(routes).length;
const totalNodes = countTreeNodes(sitemapTree) + 1;
const rootLabel = hasRoute('/') ? 'Landing' : 'Home';

const lines = [];
lines.push('# Website Structure');
lines.push('');
lines.push(`Updated: ${new Date().toISOString()}`);
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- Entry point: ${rootLabel} → Login → Workspaces`);
lines.push(`- Top-level sections: ${sitemapTree.length}`);
lines.push(`- Total nodes: ${totalNodes}`);
lines.push(`- Total routes in App.tsx: ${totalRoutes}`);
lines.push('');
lines.push('```text');
lines.push(rootLabel);
for (let i = 0; i < sitemapTree.length; i += 1) {
  renderTreeNode(sitemapTree[i], '', i === sitemapTree.length - 1, lines);
}
lines.push('```');
lines.push('');
lines.push('Source: generated from UX-facing routes and workspace navigation in src/App.tsx and dashboard views.');

fs.writeFileSync(outputFile, `${lines.join('\n')}\n`, 'utf8');
console.log(`Generated ${path.relative(rootDir, outputFile)}`);
