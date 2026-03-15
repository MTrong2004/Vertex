import { Project, User, AdminUserEntry, AIHistoryEntry, AuditLogEntry, AdminNotification, ChartDataPoint } from '../types';

export const users: User[] = [
  { id: 'u1', name: 'Minh', avatar: 'https://i.pravatar.cc/150?u=u1', email: 'minh@university.edu', role: 'student' },
  { id: 'u2', name: 'Lan', avatar: 'https://i.pravatar.cc/150?u=u2', email: 'lan@university.edu', role: 'student' },
  { id: 'u3', name: 'Hung', avatar: 'https://i.pravatar.cc/150?u=u3', email: 'hung@university.edu', role: 'student' },
  { id: 'u4', name: 'Trang', avatar: 'https://i.pravatar.cc/150?u=u4', email: 'trang@university.edu', role: 'student' },
];

export const adminUser: User = {
  id: 'admin1',
  name: 'Admin',
  avatar: 'https://i.pravatar.cc/150?u=admin1',
  email: 'admin@projectplanning.io',
  role: 'admin',
};

export const adminUserEntries: AdminUserEntry[] = [
  { id: 'u1', name: 'Minh', email: 'minh@university.edu', avatar: 'https://i.pravatar.cc/150?u=u1', status: 'active', plan: 'paid', createdAt: '2025-11-10', aiQuota: 100, aiUsed: 67 },
  { id: 'u2', name: 'Lan', email: 'lan@university.edu', avatar: 'https://i.pravatar.cc/150?u=u2', status: 'active', plan: 'free-trial', createdAt: '2026-01-05', aiQuota: 20, aiUsed: 18 },
  { id: 'u3', name: 'Hung', email: 'hung@university.edu', avatar: 'https://i.pravatar.cc/150?u=u3', status: 'active', plan: 'paid', createdAt: '2025-12-20', aiQuota: 100, aiUsed: 34 },
  { id: 'u4', name: 'Trang', email: 'trang@university.edu', avatar: 'https://i.pravatar.cc/150?u=u4', status: 'banned', plan: 'free-trial', createdAt: '2026-02-01', aiQuota: 20, aiUsed: 20 },
  { id: 'u5', name: 'Duc', email: 'duc@gmail.com', avatar: 'https://i.pravatar.cc/150?u=u5', status: 'active', plan: 'free-trial', createdAt: '2026-02-15', aiQuota: 20, aiUsed: 3 },
  { id: 'u6', name: 'Hanh', email: 'hanh@outlook.com', avatar: 'https://i.pravatar.cc/150?u=u6', status: 'active', plan: 'paid', createdAt: '2025-10-01', aiQuota: 100, aiUsed: 89 },
  { id: 'u7', name: 'Phong', email: 'phong@university.edu', avatar: 'https://i.pravatar.cc/150?u=u7', status: 'active', plan: 'free-trial', createdAt: '2026-02-27', aiQuota: 20, aiUsed: 0 },
];

export const aiHistory: AIHistoryEntry[] = [
  { id: 'ai1', userId: 'u1', userName: 'Minh', prompt: 'Plan a 2-week poster project for 4 members', planSummary: 'Generated 5 tasks across 3 phases: Research (2d), Design (7d), Review (5d)', createdAt: '2026-02-27T09:30:00', tokensUsed: 1250 },
  { id: 'ai2', userId: 'u2', userName: 'Lan', prompt: 'Break down a UI/UX design sprint for mobile app', planSummary: 'Generated 8 tasks: User research, wireframes, prototyping, usability testing', createdAt: '2026-02-27T08:15:00', tokensUsed: 1800 },
  { id: 'ai3', userId: 'u3', userName: 'Hung', prompt: 'Create schedule for 30s animation project', planSummary: 'Generated 6 tasks: Scripting, storyboard, animation, voiceover, editing, export', createdAt: '2026-02-26T16:45:00', tokensUsed: 1100 },
  { id: 'ai4', userId: 'u1', userName: 'Minh', prompt: 'Suggest deadlines for capstone project final phase', planSummary: 'Adjusted 4 deadlines based on team velocity and remaining scope', createdAt: '2026-02-26T14:20:00', tokensUsed: 850 },
  { id: 'ai5', userId: 'u6', userName: 'Hanh', prompt: 'Assign tasks for marketing campaign team of 6', planSummary: 'Generated role-based assignments: Content (2), Design (2), Analytics (1), Lead (1)', createdAt: '2026-02-26T11:00:00', tokensUsed: 1400 },
  { id: 'ai6', userId: 'u5', userName: 'Duc', prompt: 'Plan a hackathon project in 48 hours', planSummary: 'Generated sprint plan: Ideation (4h), MVP (20h), Polish (16h), Presentation (8h)', createdAt: '2026-02-25T22:10:00', tokensUsed: 950 },
];

export const todayMetrics = {
  newUsersToday: 3,
  apiCostToday: 4.72,
  totalApiCostMonth: 127.85,
  totalTokensToday: 12400,
};

// ─── Chart data ───
export const userSignupChart: ChartDataPoint[] = [
  { label: 'W1 Jan', value: 2 },
  { label: 'W2 Jan', value: 5 },
  { label: 'W3 Jan', value: 3 },
  { label: 'W4 Jan', value: 7 },
  { label: 'W1 Feb', value: 4 },
  { label: 'W2 Feb', value: 8 },
  { label: 'W3 Feb', value: 6 },
  { label: 'W4 Feb', value: 10 },
];

export const apiCostChart: ChartDataPoint[] = [
  { label: 'Mon', value: 3.20 },
  { label: 'Tue', value: 5.80 },
  { label: 'Wed', value: 4.10 },
  { label: 'Thu', value: 7.50 },
  { label: 'Fri', value: 6.30 },
  { label: 'Sat', value: 2.90 },
  { label: 'Sun', value: 4.72 },
];

export const planDistribution: ChartDataPoint[] = [
  { label: 'Free Trial', value: 4 },
  { label: 'Paid', value: 3 },
];

// ─── Audit log ───
export const auditLog: AuditLogEntry[] = [
  { id: 'log1', admin: 'Admin', action: 'ban_user', target: 'Trang', detail: 'Banned user Trang for violating terms', timestamp: '2026-02-27T14:30:00' },
  { id: 'log2', admin: 'Admin', action: 'change_quota', target: 'Minh', detail: 'Changed AI quota from 50 to 100', timestamp: '2026-02-27T12:15:00' },
  { id: 'log3', admin: 'Admin', action: 'change_price', detail: 'Updated Student Pro price from $5 to $7', timestamp: '2026-02-26T18:00:00' },
  { id: 'log4', admin: 'Admin', action: 'unban_user', target: 'Duc', detail: 'Unbanned user Duc after review', timestamp: '2026-02-26T10:45:00' },
  { id: 'log5', admin: 'Admin', action: 'export_data', detail: 'Exported user list (CSV)', timestamp: '2026-02-25T09:30:00' },
  { id: 'log6', admin: 'Admin', action: 'change_quota', target: 'Hanh', detail: 'Changed AI quota from 100 to 150', timestamp: '2026-02-24T16:20:00' },
  { id: 'log7', admin: 'Admin', action: 'bulk_ban', detail: 'Bulk banned 2 users: Trang, Duc', timestamp: '2026-02-23T11:00:00' },
];

// ─── Admin notifications ───
export const adminNotifications: AdminNotification[] = [
  { id: 'n1', type: 'warning', message: 'API cost exceeded $100 this month!', timestamp: '2026-02-27T10:00:00', read: false },
  { id: 'n2', type: 'info', message: 'New user Phong just registered.', timestamp: '2026-02-27T08:30:00', read: false },
  { id: 'n3', type: 'warning', message: 'User Lan has reached 90% of AI quota.', timestamp: '2026-02-27T07:00:00', read: false },
  { id: 'n4', type: 'info', message: 'New user Duc just registered.', timestamp: '2026-02-15T14:00:00', read: true },
  { id: 'n5', type: 'error', message: 'AI API returned 3 errors in the last hour.', timestamp: '2026-02-26T22:30:00', read: true },
  { id: 'n6', type: 'info', message: 'Monthly report is ready for download.', timestamp: '2026-02-25T09:00:00', read: true },
];

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Poster Project',
    description: 'Design poster for Tech Day 2026 event',
    memberIds: [users[0].id, users[1].id],
    deadline: '2026-03-01',
    progress: 65,
    tasks: [
      {
        id: 't1',
        title: 'Sketch ideas',
        status: 'done',
        assignee: users[0],
        priority: 'high',
        startDate: '2026-02-20',
        endDate: '2026-02-21',
        description: 'Create 3 main concept sketches.',
      },
      {
        id: 't2',
        title: 'Choose color scheme',
        status: 'done',
        assignee: users[1],
        priority: 'medium',
        startDate: '2026-02-21',
        endDate: '2026-02-22',
      },
      {
        id: 't3',
        title: 'Design main layout',
        status: 'ready-for-review',
        assignee: users[0],
        priority: 'high',
        startDate: '2026-02-23',
        endDate: '2026-02-25',
        description: 'Main layout draft for approval before final export.',
        attachmentCount: 2,
        commentCount: 3,
      },
      {
        id: 't4',
        title: 'Review text content',
        status: 'todo',
        assignee: users[1],
        priority: 'low',
        startDate: '2026-02-26',
        endDate: '2026-02-27',
      },
      {
        id: 't5',
        title: 'Export for print',
        status: 'todo',
        assignee: users[0],
        priority: 'medium',
        startDate: '2026-02-28',
        endDate: '2026-03-01',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Short Animation',
    description: '30s animated video introducing the club',
    memberIds: users.map(user => user.id),
    deadline: '2026-03-15',
    progress: 30,
    tasks: [
      {
        id: 't6',
        title: 'Write script',
        status: 'done',
        assignee: users[2],
        priority: 'high',
        startDate: '2026-02-20',
        endDate: '2026-02-22',
        description: 'Finalize final narration and scene order for 30-second cut.',
        attachmentCount: 1,
        commentCount: 2,
      },
      {
        id: 't7',
        title: 'Draw storyboard',
        status: 'in-progress',
        assignee: users[3],
        priority: 'high',
        startDate: '2026-02-23',
        endDate: '2026-02-26',
        description: 'Storyboard panels for all 6 scenes.',
        attachmentCount: 1,
        commentCount: 1,
      },
      {
        id: 't8',
        title: 'Design characters',
        status: 'ready-for-review',
        assignee: users[0],
        priority: 'medium',
        startDate: '2026-02-25',
        endDate: '2026-03-01',
        description: 'Character poses and color pass for review.',
        attachmentCount: 3,
        commentCount: 2,
      },
      {
        id: 't9',
        title: 'Record voice-over',
        status: 'todo',
        assignee: users[1],
        priority: 'low',
        startDate: '2026-03-02',
        endDate: '2026-03-03',
        description: 'Record clean voice-over for all approved script lines.',
        attachmentCount: 1,
        commentCount: 1,
      },
      {
        id: 't10',
        title: 'Film & effects',
        status: 'todo',
        assignee: users[2],
        priority: 'high',
        startDate: '2026-03-04',
        endDate: '2026-03-10',
        description: 'Animate key scenes and apply transition/effects package.',
        attachmentCount: 2,
        commentCount: 2,
      },
      {
        id: 't11',
        title: 'Audio editing',
        status: 'todo',
        assignee: users[3],
        priority: 'medium',
        startDate: '2026-03-11',
        endDate: '2026-03-12',
        description: 'Mix voice-over, music bed, and SFX to final loudness target.',
        attachmentCount: 1,
        commentCount: 1,
      },
    ],
  },
];
