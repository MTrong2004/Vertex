export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in-progress' | 'ready-for-review' | 'done';
export type Role = 'student' | 'admin';
export type UserPlan = 'free-trial' | 'paid';
export type UserStatus = 'active' | 'banned';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  role?: Role;
}

export type WorkspaceMemberAvailability = 'available' | 'busy' | 'away';

export interface WorkspaceMemberTaskStats {
  completed: number;
  inProgress: number;
  bySkill: Record<string, number>;
}

export interface WorkspaceMemberHistoryEntry {
  id: string;
  projectId: string;
  projectName: string;
  completedTasks: number;
  role: string;
  endedAt: string;
}

export interface WorkspaceMember {
  id: string;
  profile: {
    name: string;
    avatar: string;
    email?: string;
    role?: Role;
    title?: string;
    bio?: string;
  };
  skills: string[];
  availability: WorkspaceMemberAvailability;
  taskStats: WorkspaceMemberTaskStats;
  projectsJoined: string[];
  history: WorkspaceMemberHistoryEntry[];
}

export interface AdminUserEntry {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  plan: UserPlan;
  createdAt: string;
  aiQuota: number;
  aiUsed: number;
}

export interface AIHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  prompt: string;
  planSummary: string;
  createdAt: string;
  tokensUsed: number;
}

export interface AuditLogEntry {
  id: string;
  admin: string;
  action: 'ban_user' | 'unban_user' | 'change_quota' | 'change_price' | 'bulk_ban' | 'bulk_unban' | 'bulk_quota' | 'export_data';
  target?: string;
  detail: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  attachmentCount?: number;
  commentCount?: number;
  status: Status;
  assignee?: User;
  priority: Priority;
  startDate: string;
  endDate: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  members?: User[];
  deadline: string;
  tasks: Task[];
  progress: number;
}

export interface Workspace {
  id: string;
  name: string;
  members: WorkspaceMember[];
}
