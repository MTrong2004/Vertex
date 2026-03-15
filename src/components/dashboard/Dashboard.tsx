import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { TaskPanel } from './TaskPanel';
import { mockProjects, users } from '../../data/mockData';
import { Task, Project, Status, Priority, User, WorkspaceMember } from '../../types';
import { loadWorkspaceMembers, saveWorkspaceMembers, workspaceMemberToUser } from '../../data/workspaceStore';
import { normalizeProjects, resolveProjectMembers } from '../../data/projectCompatibility';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TeamModal } from './TeamModal';
import { SettingsModal } from './SettingsModal';
import { ProfileModal } from './ProfileModal';
import { useToast } from '../ui/Toast';
import { useLang } from '../../contexts/LanguageContext';
import { Search, Bell, Menu, LayoutGrid, List, Plus, Calendar as CalendarIcon, CalendarDays, Filter, X, LogOut, Kanban, Sparkles, Users as UsersIcon, TrendingUp, AlertTriangle, WandSparkles, FileText, Paperclip, MessageSquare, Trash2, Eye, Download, Grid3X3, ImageIcon, File, Video, FileImage, FileCode2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock notifications
const initialNotifications = [
  { id: '1', text: 'Task "Design Main Layout" is due tomorrow', time: '2 hours ago', read: false },
  { id: '2', text: 'Lan completed "Choose Color Palette"', time: '5 hours ago', read: false },
  { id: '3', text: 'New comment on "Sketch Ideas"', time: '1 day ago', read: true },
  { id: '4', text: 'Hung uploaded a storyboard draft', time: '2 days ago', read: true },
];

type AppNotification = { id: string; text: string; time: string; read: boolean };
type InviteRole = 'Leader' | 'Member' | 'Guest';

const CURRENT_USER_EMAIL = 'minh@university.edu';
const CURRENT_USER_ID = 'u1';
const INVITE_INBOX_KEY = 'ppt_invite_inbox';

const loadInviteInbox = (): Record<string, AppNotification[]> => {
  try {
    const raw = localStorage.getItem(INVITE_INBOX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const createInviteNotification = (text: string): AppNotification => ({
  id: `invite_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  text,
  time: 'Just now',
  read: false,
});

const loadDashboardNotifications = (): AppNotification[] => {
  const inbox = loadInviteInbox();
  const received = inbox[CURRENT_USER_EMAIL] || [];
  return [...received, ...initialNotifications];
};

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

type DashboardUserPlan = 'free' | 'student_pro' | 'lecturer';
type ProjectTab = 'board' | 'ai-planner' | 'insights' | 'members' | 'files';
type PlannerDifficulty = 'Easy' | 'Medium' | 'Hard';
type PlannerCategory = 'Design' | 'Research' | 'Engineering' | 'Marketing';
type GeneratedPlanStep = {
  week: string;
  task: string;
  assignee: string;
  estHours: number;
  taskCount: number;
};
type ProjectFileItem = {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  mimeType?: string;
  objectUrl?: string;
};

type MemberWorkloadLabel = 'balanced' | 'overloaded' | 'underutilized';

type MemberAssignmentSuggestion = {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  confidence: number;
  reason: string;
};

type MembersDatabaseRow = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  title: string;
  bio: string;
  availability: 'available' | 'busy' | 'away';
  skills: string[];
  projectIds: string[];
  projectNames: string[];
  completedTasks: number;
  inProgressTasks: number;
  history: WorkspaceMember['history'];
  skillScore: number;
  workloadUtilization: number;
  workloadLabel: MemberWorkloadLabel;
  suggestionCount: number;
  topSuggestion: MemberAssignmentSuggestion | null;
};

type ProjectWithMembers = Project & { members: User[] };

const PROJECTS_STORAGE_KEY = 'ppt_projects';
const PROJECT_FILES_STORAGE_KEY = 'ppt_project_files';
const SETTINGS_STORAGE_KEY = 'ppt_workspace_settings';

const getStoredUserPlan = (): DashboardUserPlan => {
  const rawPlan = localStorage.getItem('userPlan');
  if (rawPlan === 'free' || rawPlan === 'student_pro' || rawPlan === 'lecturer') return rawPlan;
  if (rawPlan === 'free-trial') return 'free';
  if (rawPlan === 'paid') return 'student_pro';
  return 'student_pro';
};

const getWorkspaceName = (): string => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.workspaceName) return parsed.workspaceName as string;
    }
  } catch { /* ignore */ }
  return 'Design Studio Workspace';
};

const DEFAULT_WORKSPACES = [
  { id: 'ws-1', name: 'Design Studio Workspace' },
  { id: 'ws-2', name: 'Creative Hub' },
];

const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const normalizedStoredProjects = normalizeProjects(parsed);
      if (normalizedStoredProjects.length > 0) return normalizedStoredProjects;
    }
  } catch { /* ignore parse errors */ }
  return normalizeProjects(mockProjects);
};

const loadProjectFiles = (): Record<string, ProjectFileItem[]> => {
  try {
    const raw = localStorage.getItem(PROJECT_FILES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const computeProgressFromTasks = (project: Project): number => {
  if (!project.tasks.length) return project.progress || 0;
  const weights: Record<Status, number> = {
    'todo': 0,
    'in-progress': 50,
    'ready-for-review': 80,
    'done': 100,
  };
  const total = project.tasks.reduce((sum, task) => sum + weights[task.status], 0);
  return Math.round(total / project.tasks.length);
};

const TASK_SKILL_KEYWORDS: Record<string, string[]> = {
  UI: ['ui', 'layout', 'screen', 'wireframe', 'component'],
  Motion: ['motion', 'animation', 'transition', 'storyboard', 'video'],
  Research: ['research', 'survey', 'analysis', 'insight', 'discovery'],
  Writing: ['copy', 'content', 'writing', 'brief', 'documentation', 'report'],
  Engineering: ['build', 'develop', 'api', 'frontend', 'backend', 'integration', 'test'],
  Marketing: ['campaign', 'audience', 'brand', 'social', 'outreach'],
};

const OPEN_TASK_WEIGHTS: Record<Status, number> = {
  todo: 1,
  'in-progress': 2,
  'ready-for-review': 1.5,
  done: 0,
};

const inferTaskSkillTags = (task: Task): string[] => {
  const haystack = `${task.title} ${task.description || ''}`.toLowerCase();
  const matched = Object.entries(TASK_SKILL_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => haystack.includes(keyword)))
    .map(([skill]) => skill);

  return matched.length > 0 ? matched : ['Research'];
};

const getWorkloadLabel = (utilization: number): MemberWorkloadLabel => {
  if (utilization >= 126) return 'overloaded';
  if (utilization <= 74) return 'underutilized';
  return 'balanced';
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(loadWorkspaceMembers);
  const [userPlan] = useState<DashboardUserPlan>(getStoredUserPlan);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(getWorkspaceName);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-1');
  const [activeProjectId, setActiveProjectId] = useState(mockProjects[0].id);
  const [projectViewMode, setProjectViewMode] = useState<'kanban' | 'timeline' | 'calendar'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(loadDashboardNotifications);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState<Status>('todo');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'members'>('dashboard');
  const [projectTab, setProjectTab] = useState<ProjectTab>('board');
  const [projectFiles, setProjectFiles] = useState<Record<string, ProjectFileItem[]>>(loadProjectFiles);
  const [plannerInput, setPlannerInput] = useState({
    description: 'Poster campaign for environmental awareness',
    projectGoal: 'Create an A1 poster for Tech Day 2026',
    teamSize: 4,
    deadlineWeeks: 4,
    difficulty: 'Medium' as PlannerDifficulty,
    category: 'Design' as PlannerCategory,
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanStep[] | null>(null);
  const { t } = useLang();

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click outside handler for profile menu & notification panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Persist projects to localStorage
  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(PROJECT_FILES_STORAGE_KEY, JSON.stringify(projectFiles));
  }, [projectFiles]);

  const workspaceUsers = useMemo(() => {
    const fromWorkspace = workspaceMembers.map(workspaceMemberToUser);
    const allUsers = [...fromWorkspace, ...users];
    return allUsers.reduce<User[]>((acc, user) => {
      if (!acc.some(entry => entry.id === user.id)) acc.push(user);
      return acc;
    }, []);
  }, [workspaceMembers]);

  const currentWorkspaceMember = useMemo(() => {
    return workspaceMembers.find(member => member.id === CURRENT_USER_ID) || workspaceMembers[0] || null;
  }, [workspaceMembers]);

  const currentUserName = currentWorkspaceMember?.profile.name || 'Minh';
  const currentUserAvatar = currentWorkspaceMember?.profile.avatar || 'https://i.pravatar.cc/150?u=me';
  const currentUserTitle = currentWorkspaceMember?.profile.title || 'Contributor';

  const memberLookup = useMemo(() => {
    return new Map(workspaceUsers.map(user => [user.id, user]));
  }, [workspaceUsers]);

  const membersDatabase = useMemo<MembersDatabaseRow[]>(() => {
    const workspaceMemberMap = new Map<string, WorkspaceMember>(workspaceMembers.map(member => [member.id, member]));

    return workspaceUsers.map(user => {
      const profile = workspaceMemberMap.get(user.id);
      const assignedTasks = projects.flatMap(project => (
        project.tasks.filter(task => task.assignee?.id === user.id)
      ));
      const memberProjects = projects.filter(project => project.memberIds.includes(user.id));

      const completedTasks = assignedTasks.filter(task => task.status === 'done').length;
      const inProgressTasks = assignedTasks.filter(task => task.status === 'in-progress').length;

      const availability = profile?.availability
        ?? (inProgressTasks > 0 ? 'busy' : 'available');

      return {
        id: user.id,
        name: profile?.profile.name || user.name,
        avatar: profile?.profile.avatar || user.avatar,
        email: user.email || profile?.profile.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@team.local`,
        role: (profile?.profile.role || user.role || 'student').toUpperCase(),
        title: profile?.profile.title || 'Contributor',
        bio: profile?.profile.bio || '',
        availability,
        skills: profile?.skills || [],
        projectIds: memberProjects.map(project => project.id),
        projectNames: memberProjects.map(project => project.name),
        completedTasks,
        inProgressTasks,
        history: profile?.history || [],
      };
    });
  }, [projects, workspaceMembers, workspaceUsers]);

  const getProjectMembers = (project: Project): User[] => {
    return resolveProjectMembers(project, memberLookup);
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeProjectMembers = useMemo(() => {
    return activeProject ? getProjectMembers(activeProject) : [];
  }, [activeProject, memberLookup]);
  const activeProjectWithMembers: ProjectWithMembers = {
    ...activeProject,
    members: activeProjectMembers,
  };
  const projectsWithMembers: ProjectWithMembers[] = useMemo(() => {
    return projects.map(project => ({ ...project, members: getProjectMembers(project) }));
  }, [projects, memberLookup]);

  const projectProgressMap = useMemo(() => {
    return projects.reduce<Record<string, number>>((acc, project) => {
      acc[project.id] = computeProgressFromTasks(project);
      return acc;
    }, {});
  }, [projects]);
  const activeProjectProgress = projectProgressMap[activeProject.id] ?? activeProject.progress;

  const memberIntelligenceMap = useMemo(() => {
    const totalOpenWeight = projects.reduce((sum, project) => (
      sum + project.tasks.reduce((taskSum, task) => taskSum + OPEN_TASK_WEIGHTS[task.status], 0)
    ), 0);
    const avgOpenWeight = membersDatabase.length > 0 ? totalOpenWeight / membersDatabase.length : 0;

    const memberWorkloadMap = new Map<string, { weightedTasks: number; utilization: number; label: MemberWorkloadLabel }>();
    const memberSkillScoreMap = new Map<string, number>();

    membersDatabase.forEach(member => {
      const assignedTasks = projects.flatMap(project => (
        project.tasks.filter(task => task.assignee?.id === member.id)
      ));

      const weightedTasks = assignedTasks.reduce((sum, task) => sum + OPEN_TASK_WEIGHTS[task.status], 0);
      const utilization = avgOpenWeight > 0 ? Math.round((weightedTasks / avgOpenWeight) * 100) : 100;

      memberWorkloadMap.set(member.id, {
        weightedTasks,
        utilization,
        label: getWorkloadLabel(utilization),
      });

      const coverageSamples = assignedTasks.map(task => {
        const taskSkills = inferTaskSkillTags(task).map(skill => skill.toLowerCase());
        const memberSkills = member.skills.map(skill => skill.toLowerCase());
        const overlap = taskSkills.filter(skill => memberSkills.includes(skill)).length;
        return taskSkills.length > 0 ? overlap / taskSkills.length : 0;
      });

      const taskCoverage = coverageSamples.length > 0
        ? coverageSamples.reduce((sum, value) => sum + value, 0) / coverageSamples.length
        : member.skills.length > 0 ? 0.62 : 0.35;
      const completionFactor = Math.min(1, member.completedTasks / 16);
      const skillDepth = Math.min(1, member.skills.length / 5);
      const score = Math.round(Math.min(100, (taskCoverage * 68 + completionFactor * 22 + skillDepth * 10) * 100 / 100));
      memberSkillScoreMap.set(member.id, score);
    });

    const activeMemberIds = new Set(activeProjectMembers.map(member => member.id));
    const suggestionsByMember = new Map<string, MemberAssignmentSuggestion[]>();
    const activeTaskCandidates = activeProject.tasks.filter(task => task.status !== 'done');

    activeTaskCandidates.forEach(task => {
      const taskSkills = inferTaskSkillTags(task).map(skill => skill.toLowerCase());
      const candidateRows = membersDatabase.filter(member => activeMemberIds.has(member.id));
      if (candidateRows.length === 0) return;

      const scoreCandidate = (member: MembersDatabaseRow): { value: number; reason: string } => {
        const memberSkills = member.skills.map(skill => skill.toLowerCase());
        const overlap = taskSkills.filter(skill => memberSkills.includes(skill)).length;
        const skillFit = taskSkills.length > 0 ? overlap / taskSkills.length : 0.5;

        const workloadStats = memberWorkloadMap.get(member.id);
        const utilization = workloadStats?.utilization ?? 100;
        const capacity = Math.max(0.2, 1 - Math.max(0, utilization - 80) / 100);

        const availabilityScore = member.availability === 'available'
          ? 1
          : member.availability === 'busy'
            ? 0.6
            : 0.3;

        const value = skillFit * 0.55 + capacity * 0.25 + availabilityScore * 0.2;

        let reason = 'Balanced current workload';
        if (skillFit >= 0.8 && taskSkills.length > 0) {
          reason = `Strong fit for ${taskSkills.slice(0, 2).join(', ')}`;
        } else if (capacity >= 0.85) {
          reason = 'Lower current workload capacity';
        } else if (member.availability === 'available') {
          reason = 'Currently available for focused execution';
        }

        return { value, reason };
      };

      const ranked = candidateRows
        .map(member => ({ member, ...scoreCandidate(member) }))
        .sort((a, b) => b.value - a.value);

      const best = ranked[0];
      if (!best) return;

      const currentAssigneeId = task.assignee?.id;
      const currentScore = currentAssigneeId
        ? (ranked.find(entry => entry.member.id === currentAssigneeId)?.value ?? 0)
        : -1;

      const needsSuggestion = !currentAssigneeId || (best.member.id !== currentAssigneeId && best.value - currentScore >= 0.14);
      if (!needsSuggestion) return;

      const nextSuggestion: MemberAssignmentSuggestion = {
        taskId: task.id,
        taskTitle: task.title,
        projectId: activeProject.id,
        projectName: activeProject.name,
        confidence: Math.round(best.value * 100),
        reason: best.reason,
      };

      suggestionsByMember.set(best.member.id, [...(suggestionsByMember.get(best.member.id) || []), nextSuggestion]);
    });

    return membersDatabase.reduce<Record<string, {
      skillScore: number;
      workloadUtilization: number;
      workloadLabel: MemberWorkloadLabel;
      suggestionCount: number;
      topSuggestion: MemberAssignmentSuggestion | null;
    }>>((acc, member) => {
      const workload = memberWorkloadMap.get(member.id);
      const suggestions = suggestionsByMember.get(member.id) || [];
      const topSuggestion = suggestions.sort((a, b) => b.confidence - a.confidence)[0] || null;

      acc[member.id] = {
        skillScore: memberSkillScoreMap.get(member.id) ?? 0,
        workloadUtilization: workload?.utilization ?? 100,
        workloadLabel: workload?.label ?? 'balanced',
        suggestionCount: suggestions.length,
        topSuggestion,
      };
      return acc;
    }, {});
  }, [projects, membersDatabase, activeProject, activeProjectMembers]);

  const membersDatabaseWithIntelligence = useMemo<MembersDatabaseRow[]>(() => {
    return membersDatabase.map(member => {
      const intelligence = memberIntelligenceMap[member.id];
      return {
        ...member,
        skillScore: intelligence?.skillScore ?? 0,
        workloadUtilization: intelligence?.workloadUtilization ?? 100,
        workloadLabel: intelligence?.workloadLabel ?? 'balanced',
        suggestionCount: intelligence?.suggestionCount ?? 0,
        topSuggestion: intelligence?.topSuggestion ?? null,
      };
    });
  }, [membersDatabase, memberIntelligenceMap]);

  // Filtered tasks based on search query
  const displayProject: ProjectWithMembers = searchQuery.trim() ? {
    ...activeProjectWithMembers,
    tasks: activeProject.tasks.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  } : activeProjectWithMembers;

  const teamWorkload = useMemo(() => {
    const map = new Map<string, number>();
    activeProject.tasks.forEach(task => {
      const key = task.assignee?.name || 'Unassigned';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, tasks]) => ({ name, tasks })).sort((a, b) => b.tasks - a.tasks);
  }, [activeProject]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    return activeProject.tasks.filter(task => new Date(task.endDate) < today && task.status !== 'done').length;
  }, [activeProject]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskDrop = (taskId: string, newStatus: Status) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    })));
  };

  const handleOpenAddTask = (status: Status) => {
    setAddTaskStatus(status);
    setShowAddTask(true);
  };

  const handleAddTask = (title: string, priority: Priority, description: string, attachmentCount: number) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title,
      description: description.trim() || undefined,
      attachmentCount: Math.max(0, attachmentCount || 0),
      status: addTaskStatus,
      priority,
      assignee: activeProjectMembers[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ));
    setShowAddTask(false);
    showToast('Task created successfully!');
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = activeProject.tasks.find(task => task.id === taskId);
    if (!taskToDelete) return;

    setProjects(prev => prev.map(project =>
      project.id === activeProjectId
        ? { ...project, tasks: project.tasks.filter(task => task.id !== taskId) }
        : project
    ));
    showToast(`Deleted task "${taskToDelete.title}"`);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setProjects(prev => prev.map(project => (
      project.id === activeProjectId
        ? {
            ...project,
            tasks: project.tasks.map(task => task.id === updatedTask.id ? updatedTask : task),
          }
        : project
    )));
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      showToast('You must keep at least one project.', 'error');
      return;
    }
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    const nextProjects = projects.filter(p => p.id !== projectId);
    setProjects(nextProjects);

    if (activeProjectId === projectId) {
      setActiveProjectId(nextProjects[0].id);
    }
    showToast(`Deleted project "${projectToDelete.name}"`);
  };

  const handleAddProjectMember = (user: User) => {
    setProjects(prev => prev.map(project => (
      project.id === activeProjectId && !project.memberIds.includes(user.id)
        ? { ...project, memberIds: [...project.memberIds, user.id] }
        : project
    )));
    showToast(`Invited ${user.name} to ${activeProject.name}`);
  };

  const handleInviteMember = ({ email, role, projectCode, joinLink }: { email: string; role: InviteRole; projectCode: string; joinLink: string }) => {
    const receiverInbox = loadInviteInbox();
    const receiverNotification = createInviteNotification(
      `You were invited to "${activeProject.name}" as ${role}. Use code ${projectCode} to join.`
    );
    const nextReceiverItems = [receiverNotification, ...(receiverInbox[email] || [])];
    receiverInbox[email] = nextReceiverItems;
    localStorage.setItem(INVITE_INBOX_KEY, JSON.stringify(receiverInbox));

    setNotifications(prev => [
      createInviteNotification(`Invite sent to ${email}. Join link: ${joinLink}`),
      ...prev,
    ]);
    showToast(`Invite sent to ${email}`);
  };

  const handleRemoveProjectMember = (userId: string) => {
    const member = activeProjectMembers.find(entry => entry.id === userId);
    if (!member) return;
    if (activeProjectMembers.length <= 1) {
      showToast('Each project needs at least one member.', 'error');
      return;
    }

    setProjects(prev => prev.map(project => {
      if (project.id !== activeProjectId) return project;
      return {
        ...project,
        memberIds: project.memberIds.filter(memberId => memberId !== userId),
        tasks: project.tasks.map(task => task.assignee?.id === userId ? { ...task, assignee: undefined } : task),
      };
    }));
    showToast(`Removed ${member.name} from ${activeProject.name}`);
  };

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: `p${Date.now()}`,
      name,
      description: 'New project',
      memberIds: [users[0].id],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      tasks: [],
      progress: 0,
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActiveTab('projects');
    setProjectTab('board');
    setProjectViewMode('kanban');
    setShowCreateProject(false);
    showToast('Project created successfully!');
  };

  const generateAiPlan = (descriptionOverride?: string) => {
    const assignees = activeProjectMembers.length > 0 ? activeProjectMembers : workspaceUsers;
    const planningDescription = descriptionOverride ?? plannerInput.description;
    const defaultStepsByCategory: Record<PlannerCategory, string[]> = {
      Design: ['Research topic', 'Sketch ideas', 'Design poster', 'Presentation slides'],
      Research: ['Define hypothesis', 'Collect sources', 'Analyze findings', 'Prepare report'],
      Engineering: ['Define scope', 'Build core feature', 'Testing and fixes', 'Deployment prep'],
      Marketing: ['Audience research', 'Campaign concept', 'Asset production', 'Performance report'],
    };
    const defaultSteps = defaultStepsByCategory[plannerInput.category];
    const weeks = Math.max(2, Math.min(8, plannerInput.deadlineWeeks));
    const difficultyMultiplier: Record<PlannerDifficulty, number> = {
      Easy: 0.8,
      Medium: 1,
      Hard: 1.35,
    };
    const baseHours = [6, 4, 10, 3, 5, 7, 8, 4];
    const plan = Array.from({ length: weeks }).map((_, idx) => ({
      week: `Week ${idx + 1}`,
      task: defaultSteps[idx] || `Execution task ${idx + 1}`,
      assignee: assignees[idx % assignees.length]?.name || 'Unassigned',
      estHours: Math.max(2, Math.round((baseHours[idx] || 6) * difficultyMultiplier[plannerInput.difficulty])),
      taskCount: plannerInput.difficulty === 'Hard' ? 3 : plannerInput.difficulty === 'Easy' ? 1 : 2,
    }));
    setGeneratedPlan(plan);
    if (descriptionOverride) {
      setPlannerInput(prev => ({ ...prev, description: planningDescription }));
    }
    showToast('AI plan generated successfully!');
  };

  const regenerateAiPlan = () => {
    generateAiPlan();
  };

  const createProjectBoardFromPlan = () => {
    if (!generatedPlan || generatedPlan.length === 0) return;
    const newTasks: Task[] = generatedPlan.map((step, idx) => {
      const assignee = activeProjectMembers.find(m => m.name === step.assignee) || activeProjectMembers[0];
      const start = new Date();
      start.setDate(start.getDate() + idx * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 5);
      return {
        id: `p_${Date.now()}_${idx}`,
        title: step.task,
        status: idx === 0 ? 'in-progress' : idx === generatedPlan.length - 1 ? 'todo' : 'ready-for-review',
        assignee,
        priority: idx === 0 ? 'high' : 'medium',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        description: `AI generated from planner: ${plannerInput.description}`,
      };
    });

    setProjects(prev => prev.map(project =>
      project.id === activeProjectId
        ? { ...project, tasks: [...project.tasks, ...newTasks] }
        : project
    ));
    setActiveTab('projects');
    setProjectTab('board');
    setProjectViewMode('kanban');
    showToast('Project board created from AI plan!');
  };

  const handleGenerateTasksFromHeader = () => {
    setGeneratedPlan(null);
    setProjectTab('ai-planner');
  };

  const handleUploadProjectFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const uploads: ProjectFileItem[] = Array.from(fileList).map(file => ({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      sizeLabel: file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Minh',
      mimeType: file.type,
      objectUrl: URL.createObjectURL(file),
    }));

    setProjectFiles(prev => ({
      ...prev,
      [activeProjectId]: [...uploads, ...(prev[activeProjectId] || [])],
    }));
    showToast(`${uploads.length} file${uploads.length > 1 ? 's' : ''} uploaded`);
  };

  const handleDeleteProjectFile = (fileId: string) => {
    setProjectFiles(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter(file => file.id !== fileId),
    }));
  };

  const handleRenameProjectFile = (fileId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    setProjectFiles(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).map(file => (
        file.id === fileId ? { ...file, name: trimmedName } : file
      )),
    }));
  };

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    showToast('Signed out successfully');
    setTimeout(() => {
      onNavigate?.('landing');
    }, 300);
    setShowSignOutConfirm(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDashboardQuickPlan = () => {
    const prompt = plannerInput.description.trim();
    if (!prompt) {
      showToast('Please enter a planning prompt first.', 'error');
      return;
    }
    generateAiPlan(prompt);
    setActiveTab('projects');
    setProjectTab('ai-planner');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const planBadgeLabel = userPlan === 'student_pro' ? 'Pro' : 'Free';
  const planBadgeClass = userPlan === 'student_pro'
    ? 'border-blue-500/35 bg-blue-500/10 text-blue-300'
    : 'border-[#22C55E]/35 bg-[#22C55E]/10 text-[#6EE7B7]';

  useEffect(() => {
    if (!selectedTask) return;
    const latestTask = activeProject.tasks.find(task => task.id === selectedTask.id) || null;
    setSelectedTask(latestTask);
  }, [projects, activeProjectId]);

  const handleSaveProfile = (member: WorkspaceMember) => {
    const nextMembers = workspaceMembers.some(entry => entry.id === member.id)
      ? workspaceMembers.map(entry => (entry.id === member.id ? member : entry))
      : [...workspaceMembers, member];

    saveWorkspaceMembers(nextMembers);
    setWorkspaceMembers(nextMembers);

    const updatedUser = workspaceMemberToUser(member);
    setProjects(prev => prev.map(project => ({
      ...project,
      tasks: project.tasks.map(task => (
        task.assignee?.id === member.id
          ? { ...task, assignee: updatedUser }
          : task
      )),
    })));
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A0F1A] flex flex-col">
      {/* Topbar */}
      <header className="h-16 bg-[#0F1A2A]/80 backdrop-blur-xl border-b border-[#22C55E]/10 flex items-center justify-between px-4 sticky top-0 z-20 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#162032] rounded-lg lg:hidden text-slate-400"
          >
            <Menu size={20} />
          </button>
          <div
            className="vertex-brand flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate?.('landing')}
            title="Back to Home"
          >
            <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-lg hidden sm:inline-block vertex-wordmark">Vertex</span>
            <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${planBadgeClass}`}>
              {planBadgeLabel}
            </span>
          </div>
        </div>

        <div className={`flex-1 max-w-xl mx-4 hidden md:block transition-opacity ${activeTab === 'projects' || activeTab === 'dashboard' || activeTab === 'members' ? '' : 'invisible pointer-events-none'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder={t.dashboard.searchPlaceholder} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-[#162032] border-transparent focus:bg-[#0A0F1A] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 rounded-lg outline-none transition-all text-sm text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:bg-[#162032] rounded-full relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0F1A2A]"></span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-12 w-80 bg-[#0F1A2A] border border-[#22C55E]/10 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[#22C55E]/10 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">{t.dashboard.notifications}</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#22C55E] hover:underline">{t.dashboard.markAllRead}</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-[#22C55E]/10 hover:bg-[#162032] transition-colors cursor-pointer ${!n.read ? 'bg-[#22C55E]/5' : ''}`}
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <div className="w-2 h-2 rounded-full bg-[#22C55E] mt-1.5 flex-shrink-0"></div>}
                          <div className={!n.read ? '' : 'ml-4'}>
                            <p className="text-sm text-slate-300">{n.text}</p>
                            <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-8 w-px bg-[#22C55E]/10 mx-1"></div>
          {/* Profile Menu */}
          <div ref={profileMenuRef} className="flex items-center gap-3 relative">
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-[#162032] p-1.5 rounded-lg transition-colors"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Avatar src={currentUserAvatar} fallback={currentUserName.charAt(0)} size="sm" />
              <span className="text-sm font-medium text-slate-300 hidden sm:inline-block">{currentUserName} (You)</span>
            </div>

            {showProfileMenu && (
              <div className="absolute right-4 top-14 bg-[#0F1A2A] border border-[#22C55E]/10 rounded-xl shadow-lg shadow-black/30 py-2 w-56 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#22C55E]/10 bg-[#162032]/60">
                  <p className="text-sm font-semibold text-white">{currentUserName} (You)</p>
                  <p className="text-xs text-slate-500 mt-0.5">{currentUserTitle}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#162032]"
                >
                  Profile & Skills
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#162032]"
                >
                  Account Settings
                </button>
                <div className="h-px bg-[#22C55E]/10 my-1"></div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSignOutConfirm(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          activeProject={activeProjectId} 
          activeTab={activeTab}
          onSelectProject={(id) => { setActiveProjectId(id); setActiveTab('projects'); setProjectTab('board'); setProjectViewMode('kanban'); }}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
          onOpenDashboard={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          onOpenProjects={() => { setActiveTab('projects'); setProjectTab('board'); setProjectViewMode('kanban'); setIsSidebarOpen(false); }}
          onOpenSettings={() => { setShowSettingsModal(true); setIsSidebarOpen(false); }}
          onOpenMembers={() => { setActiveTab('members'); setIsSidebarOpen(false); }}
          onCreateProject={() => setShowCreateProject(true)}
          onDeleteProject={(id) => handleDeleteProject(id)}
          onViewPlans={() => onNavigate?.('pricing')}
          userPlan={userPlan}
          workspaceName={workspaceName}
          workspaces={DEFAULT_WORKSPACES}
          activeWorkspaceId={activeWorkspaceId}
          onSwitchWorkspace={(id) => {
            setActiveWorkspaceId(id);
            const ws = DEFAULT_WORKSPACES.find(w => w.id === id);
            if (ws) setWorkspaceName(ws.name);
          }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {/* Project header */}
          {activeTab === 'projects' && (
            <div className="px-6 py-3 border-b border-[#22C55E]/10 bg-[#0F1A2A] flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                <span className="text-white font-bold" title={activeProject.description || ''}>{activeProject.name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[#22C55E] font-semibold">{activeProjectProgress}%</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-semibold">{activeProjectMembers[0]?.name || 'Unassigned'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{activeProjectMembers.length} members</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{activeProject.tasks.length} tasks</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{new Date(activeProject.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-lg">
                  {([
                    { id: 'kanban', label: 'Board', icon: Kanban },
                    { id: 'timeline', label: 'Timeline', icon: CalendarIcon },
                    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
                  ] as const).map(tab => {
                    const Icon = tab.icon;
                    const isActive = projectTab === 'board' && projectViewMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setProjectTab('board');
                          setProjectViewMode(tab.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive ? 'bg-[#0F1A2A] text-[#22C55E] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Icon size={13} />
                        {tab.label}
                      </button>
                    );
                  })}
                  </div>

                  <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-lg">
                  {([
                    { id: 'ai-planner', label: 'AI Planner' },
                    { id: 'insights', label: 'Insights' },
                    { id: 'members', label: 'Members' },
                    { id: 'files', label: 'Files' },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'ai-planner') {
                          setGeneratedPlan(null);
                        }
                        setProjectTab(tab.id);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${projectTab === tab.id ? 'bg-[#0F1A2A] text-[#22C55E] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTeamModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] hover:border-[#22C55E]/35 transition-all"
                  >
                    + Invite
                  </button>
                  <Button size="sm" icon={<WandSparkles size={14} />} onClick={handleGenerateTasksFromHeader}>AI Generate</Button>
                </div>
              </div>
            </div>
          )}

          {/* Search indicator */}
          {activeTab === 'projects' && projectTab === 'board' && searchQuery.trim() && (
            <div className="px-6 py-2 bg-[#22C55E]/10 border-b border-[#22C55E]/20 flex items-center justify-between">
              <span className="text-sm text-[#22C55E]">
                Found {displayProject.tasks.length} task{displayProject.tasks.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </span>
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white">Clear</button>
            </div>
          )}

          {/* Active tab content */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {activeTab === 'dashboard' && (
              <StudentDashboardOverview
                projects={projectsWithMembers}
                onOpenProject={(projectId) => {
                  setActiveProjectId(projectId);
                  setActiveTab('projects');
                  setProjectTab('board');
                  setProjectViewMode('kanban');
                }}
              />
            )}

            {activeTab === 'projects' && projectTab === 'board' && (
              <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0A0F1A] p-6">
                {projectViewMode === 'kanban' ? (
                  <KanbanBoard project={displayProject} onTaskClick={handleTaskClick} onTaskDrop={handleTaskDrop} onAddTask={handleOpenAddTask} onDeleteTask={handleDeleteTask} />
                ) : projectViewMode === 'timeline' ? (
                  <TimelineView project={displayProject} onTaskClick={handleTaskClick} />
                ) : (
                  <CalendarView project={displayProject} onTaskClick={handleTaskClick} />
                )}
              </div>
            )}

            {activeTab === 'projects' && projectTab === 'ai-planner' && (
              <AiPlannerView
                plannerInput={plannerInput}
                setPlannerInput={setPlannerInput}
                generatedPlan={generatedPlan}
                onGenerate={generateAiPlan}
                onRegenerate={regenerateAiPlan}
                onCreateBoard={createProjectBoardFromPlan}
              />
            )}

            {activeTab === 'projects' && projectTab === 'insights' && (
              <AnalyticsView project={activeProjectWithMembers} workload={teamWorkload} overdueTasks={overdueTasks} />
            )}

            {activeTab === 'projects' && projectTab === 'members' && (
              <ProjectMembersView
                project={activeProjectWithMembers}
                onManageMembers={() => setShowTeamModal(true)}
              />
            )}

            {activeTab === 'projects' && projectTab === 'files' && (
              <ProjectFilesView
                files={projectFiles[activeProjectId] || []}
                onUpload={handleUploadProjectFiles}
                onDelete={handleDeleteProjectFile}
                onRename={handleRenameProjectFile}
              />
            )}

            {activeTab === 'members' && (
              <MembersDatabaseView
                members={membersDatabaseWithIntelligence}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onOpenProject={(projectId) => {
                  setActiveProjectId(projectId);
                  setActiveTab('projects');
                  setProjectTab('board');
                  setProjectViewMode('kanban');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Task Detail Panel */}
      <TaskPanel 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onDeleteTask={handleDeleteTask}
        onUpdateTask={handleUpdateTask}
        assigneeOptions={activeProjectMembers}
      />

      <TeamModal
        open={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        projectId={activeProject.id}
        projectName={activeProject.name}
        members={activeProjectMembers}
        onAddMember={handleAddProjectMember}
        onRemoveMember={handleRemoveProjectMember}
        onInvite={handleInviteMember}
      />
      <SettingsModal open={showSettingsModal} onClose={() => { setShowSettingsModal(false); setWorkspaceName(getWorkspaceName()); }} userPlan={userPlan} />
      <ProfileModal
        open={showProfileModal}
        member={currentWorkspaceMember}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTask}
        status={addTaskStatus}
        onClose={() => setShowAddTask(false)}
        onSubmit={handleAddTask}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSubmit={handleAddProject}
      />

      {/* Sign Out Confirmation */}
      <SignOutConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
      />
    </div>
  );
};

const StudentDashboardOverview: React.FC<{
  projects: ProjectWithMembers[];
  onOpenProject: (projectId: string) => void;
}> = ({ projects, onOpenProject }) => {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayKey = todayStart.toISOString().split('T')[0];
  const activeProjects = projects.filter(project => project.tasks.some(task => task.status !== 'done')).length;
  const tasksDueToday = projects.reduce((count, project) => (
    count + project.tasks.filter(task => task.endDate === todayKey && task.status !== 'done').length
  ), 0);
  const overdueTaskCount = projects.reduce((count, project) => (
    count + project.tasks.filter(task => new Date(task.endDate) < todayStart && task.status !== 'done').length
  ), 0);

  const myTasksToday = projects
    .flatMap(project => project.tasks
      .filter(task => task.assignee?.id === CURRENT_USER_ID && task.status !== 'done')
      .map(task => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      })))
    .filter(task => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return start <= todayStart && end >= todayStart;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 6);

  const overdueTasks = projects
    .flatMap(project => project.tasks
      .filter(task => task.status !== 'done' && new Date(task.endDate) < todayStart)
      .map(task => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      })))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 6);

  const upcomingDeadlines = [...projects]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="border-b border-[#22C55E]/10 pb-8">
          <h2 className="text-xl font-bold text-white">Project Summary</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active projects</p>
              <p className="mt-3 text-3xl font-bold text-white">{activeProjects}</p>
            </div>
            <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tasks due today</p>
              <p className="mt-3 text-3xl font-bold text-white">{tasksDueToday}</p>
            </div>
            <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overdue tasks</p>
              <p className="mt-3 text-3xl font-bold text-white">{overdueTaskCount}</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#22C55E]/10 pb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">My Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(project => {
              const progress = computeProgressFromTasks(project);
              const pendingTasks = project.tasks.filter(task => task.status !== 'done').length;
              const leader = project.members[0]?.name || 'Unassigned';

              return (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4 text-left transition-all duration-200 hover:border-[#22C55E]/28 hover:bg-[#132234] hover:shadow-[0_18px_42px_rgba(10,15,26,0.38)] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{project.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">Leader: {leader}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#22C55E]">{progress}%</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <p className="flex items-center justify-between"><span>Members</span><span className="text-slate-200 font-semibold">{project.members.length}</span></p>
                    <p className="flex items-center justify-between"><span>Total tasks</span><span className="text-slate-200 font-semibold">{project.tasks.length}</span></p>
                    <p className="flex items-center justify-between"><span>Pending tasks</span><span className="text-slate-200 font-semibold">{pendingTasks}</span></p>
                    <p className="flex items-center justify-between"><span>Deadline</span><span className="text-slate-200 font-semibold">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></p>
                  </div>
                  <div className="h-1.5 mt-4 bg-[#162032] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${progress}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[#22C55E]/10 pb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">My Tasks Today</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myTasksToday.length === 0 ? (
              <div className="md:col-span-2 rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] px-4 py-5 text-sm text-slate-500">
                No active tasks assigned to you today.
              </div>
            ) : myTasksToday.map(task => (
              <button
                key={task.id}
                onClick={() => onOpenProject(task.projectId)}
                className="w-full bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:border-[#22C55E]/28 hover:bg-[#132234]"
              >
                <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{task.projectName}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-[#22C55E]/10 pb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Overdue Tasks</h2>
          </div>
          <div className="space-y-3">
            {overdueTasks.length === 0 ? (
              <div className="rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] px-4 py-5 text-sm text-slate-500">
                No overdue tasks. Great progress.
              </div>
            ) : overdueTasks.map(task => {
              const overdueDays = Math.max(1, Math.ceil((todayStart.getTime() - new Date(task.endDate).getTime()) / 86400000));
              return (
                <button
                  key={task.id}
                  onClick={() => onOpenProject(task.projectId)}
                  className="w-full bg-[#0F1A2A] border border-red-500/20 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:bg-[#132234]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{task.projectName}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-300">
                      {overdueDays}d overdue
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.map(project => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="w-full bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:border-[#22C55E]/28 hover:bg-[#132234]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{project.name}</span>
                  <span className="text-sm text-slate-400">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const AiPlannerView: React.FC<{
  plannerInput: { description: string; projectGoal: string; teamSize: number; deadlineWeeks: number; difficulty: PlannerDifficulty; category: PlannerCategory };
  setPlannerInput: React.Dispatch<React.SetStateAction<{ description: string; projectGoal: string; teamSize: number; deadlineWeeks: number; difficulty: PlannerDifficulty; category: PlannerCategory }>>;
  generatedPlan: GeneratedPlanStep[] | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCreateBoard: () => void;
}> = ({ plannerInput, setPlannerInput, generatedPlan, onGenerate, onRegenerate, onCreateBoard }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const assignmentCards = useMemo(() => {
    if (!generatedPlan) return [];
    const map = new Map<string, string[]>();
    generatedPlan.forEach(step => {
      const prev = map.get(step.assignee) || [];
      map.set(step.assignee, [...prev, step.task]);
    });
    return Array.from(map.entries()).map(([assignee, tasks]) => ({ assignee, tasks }));
  }, [generatedPlan]);

  const estimatedWorkload = generatedPlan || [];
  const totalEstHours = estimatedWorkload.reduce((sum, step) => sum + step.estHours, 0);

  const potentialRisks = useMemo(() => {
    const risks: string[] = [];
    if (plannerInput.deadlineWeeks <= 3) risks.push('Short timeline may compress design and review quality.');
    if (plannerInput.teamSize <= 2) risks.push('Small team size can create workload bottlenecks.');
    if (plannerInput.difficulty === 'Hard') risks.push('Hard difficulty may require extra revision rounds.');
    if (totalEstHours > 28) risks.push('Large estimated workload might cause deadline drift.');
    return risks.slice(0, 3);
  }, [plannerInput.deadlineWeeks, plannerInput.teamSize, plannerInput.difficulty, totalEstHours]);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    window.setTimeout(() => {
      onGenerate();
      setIsGenerating(false);
    }, 700);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><WandSparkles size={16} className="text-[#EAB308]" />AI Project Planner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">Describe your project</label>
              <textarea
                value={plannerInput.description}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-24 px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">Project goal</label>
              <input
                type="text"
                value={plannerInput.projectGoal}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, projectGoal: e.target.value }))}
                placeholder="Create an A1 poster for Tech Day 2026"
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Team members</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 6].map(value => (
                  <button
                    key={value}
                    onClick={() => setPlannerInput(prev => ({ ...prev, teamSize: value }))}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${plannerInput.teamSize === value ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' : 'bg-[#162032] text-slate-400 border-[#22C55E]/10 hover:text-slate-200'}`}
                  >
                    {value === 6 ? '5+' : value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Deadline (weeks)</label>
              <input type="number" min={2} max={8}
                value={plannerInput.deadlineWeeks}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, deadlineWeeks: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Difficulty</label>
              <select
                value={plannerInput.difficulty}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, difficulty: e.target.value as PlannerDifficulty }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Project category</label>
              <select
                value={plannerInput.category}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, category: e.target.value as PlannerCategory }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40">
                <option>Design</option>
                <option>Research</option>
                <option>Engineering</option>
                <option>Marketing</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button icon={<Sparkles size={14} />} onClick={handleGenerate}>
              {isGenerating ? 'Generating plan...' : 'Generate Plan'}
            </Button>
          </div>
        </div>

        {generatedPlan && (
          <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-semibold">AI Planning Result</h3>
                <p className="text-xs text-slate-400 mt-1">Vertex turns your prompt and goal into a production-ready project workflow.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Project Timeline</h4>
                <div className="space-y-2.5">
                  {generatedPlan.map((step, idx) => (
                    <div key={`${step.week}-${idx}`} className="flex items-start justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-xs text-[#22C55E] font-semibold">{step.week} • {step.taskCount} tasks</p>
                        <p className="text-sm text-slate-200 mt-0.5">{step.task}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">Phase {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Task Assignments</h4>
                <div className="space-y-2.5">
                  {assignmentCards.map(card => (
                    <div key={card.assignee} className="flex items-center justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{card.assignee}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{card.tasks.length} tasks</p>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[11rem]">{card.tasks.slice(0, 2).join(' • ')}</p>
                      </div>
                      <span className="text-xs text-[#6EE7B7] font-medium text-right max-w-[12rem]">Primary ownership</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Estimated Workload</h4>
                <div className="space-y-2.5">
                  {estimatedWorkload.map(step => (
                    <div key={`${step.week}_${step.task}`} className="flex items-center justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-sm text-slate-100">{step.task}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.week}</p>
                      </div>
                      <span className="text-xs text-[#6EE7B7] font-semibold">{step.estHours}h</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">Total estimated effort: <span className="text-slate-200 font-semibold">{totalEstHours}h</span></p>
              </div>

              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Potential Risks</h4>
                <div className="space-y-2.5">
                  {potentialRisks.length === 0 ? (
                    <div className="bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5 text-xs text-slate-400">
                      No major risks detected from current planner inputs.
                    </div>
                  ) : potentialRisks.map((risk, idx) => (
                    <div key={`${risk}_${idx}`} className="bg-[#0F1A2A]/70 border border-amber-500/20 rounded-lg px-3 py-2.5 text-xs text-amber-100">
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Adjust Scope</Button>
                <Button variant="outline" size="sm">Reassign Tasks</Button>
                <Button variant="ghost" size="sm" onClick={onRegenerate}>Regenerate</Button>
              </div>
              <Button size="sm" onClick={onCreateBoard}>Create Project</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsView: React.FC<{
  project: Project;
  workload: { name: string; tasks: number }[];
  overdueTasks: number;
}> = ({ project, workload, overdueTasks }) => {
  const now = new Date();
  const nowStart = new Date(now);
  nowStart.setHours(0, 0, 0, 0);

  const statusCounts: Record<Status, number> = {
    'done': project.tasks.filter(task => task.status === 'done').length,
    'in-progress': project.tasks.filter(task => task.status === 'in-progress').length,
    'ready-for-review': project.tasks.filter(task => task.status === 'ready-for-review').length,
    'todo': project.tasks.filter(task => task.status === 'todo').length,
  };

  const totalTasks = project.tasks.length;
  const dueInTwoDays = project.tasks.filter(task => {
    if (task.status === 'done') return false;
    const end = new Date(task.endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - nowStart.getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= 2;
  }).length;

  const workloadMax = Math.max(...workload.map(item => item.tasks), 1);

  const doneThisWeek = useMemo(() => {
    const weekStart = new Date(nowStart);
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day);
    return project.tasks.filter(task => {
      if (task.status !== 'done') return false;
      const end = new Date(task.endDate);
      end.setHours(0, 0, 0, 0);
      return end >= weekStart && end <= nowStart;
    }).length;
  }, [project.tasks, nowStart]);

  const productivityRows = useMemo(() => {
    const weekStart = new Date(nowStart);
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return labels.map((label, index) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + index);
      const key = dayStart.toISOString().split('T')[0];
      const value = project.tasks.filter(task => task.status === 'done' && task.endDate === key).length;
      return { label, value };
    });
  }, [project.tasks, nowStart]);

  const recentActivity = useMemo(() => {
    const completed = project.tasks
      .filter(task => task.status === 'done' && task.assignee)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, 2)
      .map(task => `${task.assignee?.name} completed "${task.title}"`);

    const comments = project.tasks
      .filter(task => (task.commentCount ?? 0) > 0 && task.assignee)
      .slice(0, 1)
      .map(task => `${task.assignee?.name} commented on "${task.title}"`);

    const uploads = project.tasks
      .filter(task => (task.attachmentCount ?? 0) > 0 && task.assignee)
      .slice(0, 1)
      .map(task => `${task.assignee?.name} uploaded files for "${task.title}"`);

    return [...completed, ...comments, ...uploads].slice(0, 5);
  }, [project.tasks]);

  const contributionScores = useMemo(() => {
    const totalTaskWeight = Math.max(1, project.tasks.length * 3);
    return workload.map(member => {
      const memberTasks = project.tasks.filter(task => task.assignee?.name === member.name);
      const scoreRaw = memberTasks.reduce((sum, task) => {
        const base = task.status === 'done' ? 3 : task.status === 'in-progress' ? 2 : 1;
        const engagement = Math.min(2, (task.commentCount ?? 0) + (task.attachmentCount ?? 0));
        return sum + base + engagement;
      }, 0);
      const score = Math.min(100, Math.round((scoreRaw / totalTaskWeight) * 100));
      return { name: member.name, score };
    }).sort((a, b) => b.score - a.score);
  }, [project.tasks, workload]);

  const aiInsight = useMemo(() => {
    const lowActivityByMember = workload.map(memberLoad => {
      const activityScore = project.tasks
        .filter(task => task.assignee?.name === memberLoad.name)
        .reduce((score, task) => {
          const doneScore = task.status === 'done' ? 2 : 0;
          const commentScore = Math.min(2, task.commentCount ?? 0);
          const attachmentScore = Math.min(2, task.attachmentCount ?? 0);
          return score + doneScore + commentScore + attachmentScore;
        }, 0);
      return { ...memberLoad, activityScore };
    });

    const busiest = [...lowActivityByMember].sort((a, b) => b.tasks - a.tasks)[0];
    const lightest = [...lowActivityByMember].sort((a, b) => a.tasks - b.tasks)[0];
    const lowActivityBusy = [...lowActivityByMember].sort((a, b) => (a.activityScore / Math.max(a.tasks, 1)) - (b.activityScore / Math.max(b.tasks, 1)))[0];

    const remaining = totalTasks - statusCounts.done;
    const expectedWeeksLeft = remaining / Math.max(doneThisWeek, 1);
    const deadlineDaysLeft = Math.ceil((new Date(project.deadline).getTime() - nowStart.getTime()) / 86400000);
    const targetWeeksLeft = Math.max(1, Math.ceil(deadlineDaysLeft / 7));
    const expectedDelayDays = Math.max(0, Math.round((expectedWeeksLeft - targetWeeksLeft) * 7));

    if (expectedDelayDays >= 2) {
      return {
        headline: `Project may miss deadline by ${expectedDelayDays} days.`,
        suggestion: `Move 1-2 tasks from ${busiest?.name || 'the busiest member'} to ${lightest?.name || 'available members'} and prioritize review bottlenecks.`,
      };
    }

    return {
      headline: `${lowActivityBusy?.name || 'A member'} has many tasks but lower activity.`,
      suggestion: `Rebalance workload by moving 1-2 tasks to ${lightest?.name || 'another member'} and track progress every 2 days.`,
    };
  }, [workload, project.tasks, totalTasks, statusCounts.done, doneThisWeek, project.deadline, nowStart]);

  const productivityMax = Math.max(...productivityRows.map(row => row.value), 1);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#22C55E]" />Project Progress Breakdown</h2>
          <p className="text-xs text-slate-500 mb-3">Total tasks: <span className="text-slate-200 font-semibold">{totalTasks}</span></p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-green-300">Done</span>
              <span className="font-bold text-white">{statusCounts.done}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-blue-300">In progress</span>
              <span className="font-bold text-white">{statusCounts['in-progress']}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-[#EAB308]">Review</span>
              <span className="font-bold text-white">{statusCounts['ready-for-review']}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-slate-300">Todo</span>
              <span className="font-bold text-white">{statusCounts.todo}</span>
            </div>
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Workload Distribution</h2>
          <div className="space-y-2.5">
            {workload.map(item => (
              <div key={item.name} className="rounded-lg border border-[#22C55E]/8 bg-[#162032]/70 px-3 py-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span>{item.name}</span>
                  <span className="font-semibold text-white">{item.tasks}</span>
                </div>
                <div className="h-2 rounded-full bg-[#0F1A2A] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${(item.tasks / workloadMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Contribution Score</h2>
          <div className="space-y-2.5">
            {contributionScores.map(member => (
              <div key={member.name} className="rounded-lg border border-[#22C55E]/8 bg-[#162032]/70 px-3 py-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span>{member.name}</span>
                  <span className="font-semibold text-[#6EE7B7]">{member.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#0F1A2A] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#60A5FA]" style={{ width: `${member.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-[#EAB308]" />Deadline Risk Analysis</h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-red-200">
              <p className="font-semibold">High risk</p>
              <p className="text-xs mt-1"><span className="font-semibold">{overdueTasks}</span> task{overdueTasks !== 1 ? 's' : ''} overdue</p>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-amber-100">
              <p className="font-semibold">Medium risk</p>
              <p className="text-xs mt-1"><span className="font-semibold">{dueInTwoDays}</span> task{dueInTwoDays !== 1 ? 's' : ''} due in 2 days</p>
            </div>
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Team Activity</h2>
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Recent activity</p>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity found.</p>
            ) : recentActivity.map((item, index) => (
              <div key={`${item}_${index}`} className="rounded-lg border border-[#22C55E]/8 bg-[#162032]/70 px-3 py-2 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Productivity Chart</h2>
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Tasks completed this week</p>
          <div className="space-y-2.5">
            {productivityRows.map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-10 text-xs text-slate-400">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#162032] overflow-hidden">
                  <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${(row.value / productivityMax) * 100}%` }} />
                </div>
                <span className="w-5 text-right text-xs font-semibold text-slate-200">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-2 bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={16} className="text-[#22C55E]" />AI Analysis</h2>
          <div className="rounded-xl border border-[#22C55E]/20 bg-[#162032]/65 px-4 py-4">
            <p className="text-sm text-slate-100 font-semibold">{aiInsight.headline}</p>
            <p className="text-sm text-slate-300 mt-2">Suggestion: {aiInsight.suggestion}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const ProjectMembersView: React.FC<{
  project: ProjectWithMembers;
  onManageMembers: () => void;
}> = ({ project, onManageMembers }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Project Members</h2>
            <p className="text-sm text-slate-500 mt-1">Manage team roles and invitations.</p>
          </div>
          <Button size="sm" onClick={onManageMembers}>Manage Members</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {project.members.map((member, index) => (
            <div key={member.id} className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4 flex items-center gap-3">
              <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-10 h-10" />
              <div>
                <p className="text-sm font-semibold text-white">{member.name}</p>
                <p className="text-xs text-slate-500">{index === 0 ? 'Leader' : 'Member'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MembersDatabaseView: React.FC<{
  members: MembersDatabaseRow[];
  searchQuery: string;
  onClearSearch: () => void;
  onOpenProject: (projectId: string) => void;
}> = ({ members, searchQuery, onClearSearch, onOpenProject }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;

    return members.filter(member => (
      member.name.toLowerCase().includes(q)
      || member.email.toLowerCase().includes(q)
      || member.title.toLowerCase().includes(q)
      || member.skills.some(skill => skill.toLowerCase().includes(q))
    ));
  }, [members, searchQuery]);

  useEffect(() => {
    if (!selectedMemberId && filteredMembers.length > 0) {
      setSelectedMemberId(filteredMembers[0].id);
      return;
    }
    if (selectedMemberId && !filteredMembers.some(member => member.id === selectedMemberId)) {
      setSelectedMemberId(filteredMembers[0]?.id || null);
    }
  }, [filteredMembers, selectedMemberId]);

  const selectedMember = filteredMembers.find(member => member.id === selectedMemberId) || null;

  useEffect(() => {
    if (!selectedMember) {
      setIsDrawerOpen(false);
    }
  }, [selectedMember]);

  const availabilityStyle: Record<MembersDatabaseRow['availability'], string> = {
    available: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    busy: 'text-amber-200 bg-amber-500/10 border-amber-500/25',
    away: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div className="flex-1 bg-[#0A0F1A] p-6 overflow-hidden relative">
      <div className="h-full max-w-7xl mx-auto">
        <section className="min-h-0 rounded-2xl border border-[#22C55E]/12 bg-[#0F1A2A] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#22C55E]/12 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Members Database</h2>
              <p className="text-xs text-slate-500 mt-1">Read-only member directory powered by profile skills, task history, and AI workload analysis.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-md border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#6EE7B7]">
                {filteredMembers.length} shown
              </span>
              {searchQuery.trim() && (
                <button
                  onClick={onClearSearch}
                  className="px-2 py-1 rounded-md border border-[#22C55E]/12 hover:border-[#22C55E]/25 hover:bg-[#162032] transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#0F1A2A] border-b border-[#22C55E]/12 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Member</th>
                  <th className="text-left font-semibold px-4 py-3">Role</th>
                  <th className="text-left font-semibold px-4 py-3">Skills</th>
                  <th className="text-left font-semibold px-4 py-3">Availability</th>
                  <th className="text-left font-semibold px-4 py-3">Skill score</th>
                  <th className="text-left font-semibold px-4 py-3">Workload</th>
                  <th className="text-left font-semibold px-4 py-3">Projects</th>
                  <th className="text-left font-semibold px-4 py-3">Done</th>
                  <th className="text-left font-semibold px-4 py-3">In progress</th>
                  <th className="text-left font-semibold px-4 py-3">Suggestions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">No members match your search.</td>
                  </tr>
                ) : filteredMembers.map(member => {
                  const isActive = selectedMemberId === member.id;
                  return (
                    <tr
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setIsDrawerOpen(true);
                      }}
                      className={`border-b border-[#22C55E]/8 cursor-pointer transition-colors ${isActive ? 'bg-[#22C55E]/8' : 'hover:bg-[#162032]/80'}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-9 h-9" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{member.name}</p>
                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{member.title}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex max-w-[220px] flex-wrap gap-1.5">
                          {member.skills.length === 0 ? (
                            <span className="text-xs text-slate-500">No skills</span>
                          ) : (
                            <>
                              {member.skills.slice(0, 2).map(skill => (
                                <span key={skill} className="rounded-full border border-[#22C55E]/16 bg-[#162032] px-2 py-1 text-[11px] text-slate-300">
                                  {skill}
                                </span>
                              ))}
                              {member.skills.length > 2 && (
                                <span className="rounded-full border border-[#22C55E]/12 bg-[#0F1A2A] px-2 py-1 text-[11px] text-slate-500">
                                  +{member.skills.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize ${availabilityStyle[member.availability]}`}>
                          {member.availability}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                            <span className="font-semibold text-[#6EE7B7]">{member.skillScore}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#162032] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#60A5FA]" style={{ width: `${member.skillScore}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            member.workloadLabel === 'overloaded'
                              ? 'text-red-200 bg-red-500/10 border-red-500/20'
                              : member.workloadLabel === 'underutilized'
                                ? 'text-sky-200 bg-sky-500/10 border-sky-500/20'
                                : 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {member.workloadLabel}
                          </span>
                          <p className="text-[11px] text-slate-500">{member.workloadUtilization}% load</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{member.projectNames.length}</td>
                      <td className="px-4 py-3.5 text-emerald-300 font-semibold">{member.completedTasks}</td>
                      <td className="px-4 py-3.5 text-amber-200 font-semibold">{member.inProgressTasks}</td>
                      <td className="px-4 py-3.5 text-slate-300">{member.suggestionCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isDrawerOpen && selectedMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 z-30 bg-black/45"
            />

            <motion.aside
              key={selectedMember.id}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-0 z-40 h-full w-full sm:w-[440px] border-l border-[#22C55E]/12 bg-[#0F1A2A] overflow-hidden"
            >
              <div className="p-5 border-b border-[#22C55E]/12 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Member Profile</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar src={selectedMember.avatar} fallback={selectedMember.name.charAt(0)} size="sm" className="w-12 h-12" />
                    <div>
                      <h3 className="text-white font-bold">{selectedMember.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedMember.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedMember.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="primary" size="sm">{selectedMember.role}</Badge>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${availabilityStyle[selectedMember.availability]}`}>
                      {selectedMember.availability}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#162032] transition-colors"
                  aria-label="Close member profile"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5 h-[calc(100%-7.5rem)] overflow-y-auto">
                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Focus</h4>
                  <p className="text-sm text-slate-200">{selectedMember.title}</p>
                  {selectedMember.bio && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">{selectedMember.bio}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMember.skills.length === 0 ? (
                      <span className="text-xs text-slate-500">No skills tagged yet.</span>
                    ) : selectedMember.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 text-[11px] rounded-md border border-[#22C55E]/15 bg-[#162032] text-slate-300">{skill}</span>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Workload Snapshot</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/60 px-3 py-2">
                      <p className="text-[11px] text-slate-500">Completed</p>
                      <p className="text-base font-bold text-emerald-300">{selectedMember.completedTasks}</p>
                    </div>
                    <div className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/60 px-3 py-2">
                      <p className="text-[11px] text-slate-500">In progress</p>
                      <p className="text-base font-bold text-amber-200">{selectedMember.inProgressTasks}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-[#22C55E]/10 bg-[#162032]/60 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>AI skill score</span>
                      <span className="font-semibold text-[#6EE7B7]">{selectedMember.skillScore}%</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#0F1A2A] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#60A5FA]" style={{ width: `${selectedMember.skillScore}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Workload balance: <span className="capitalize text-slate-300">{selectedMember.workloadLabel}</span> ({selectedMember.workloadUtilization}% of team average)
                    </p>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">AI Assignment Suggestion</h4>
                  {selectedMember.topSuggestion ? (
                    <div className="rounded-lg border border-[#22C55E]/14 bg-[#162032]/65 px-3 py-2.5 space-y-1.5">
                      <p className="text-sm text-slate-100 font-semibold">{selectedMember.topSuggestion.taskTitle}</p>
                      <p className="text-[11px] text-slate-500">{selectedMember.topSuggestion.projectName}</p>
                      <p className="text-xs text-slate-300">{selectedMember.topSuggestion.reason}</p>
                      <p className="text-[11px] text-[#6EE7B7] font-semibold">Confidence: {selectedMember.topSuggestion.confidence}%</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No reassignment suggestions currently. Existing assignments look balanced.</p>
                  )}
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Projects</h4>
                  <div className="space-y-2">
                    {selectedMember.projectNames.length === 0 ? (
                      <p className="text-xs text-slate-500">Not assigned to any project yet.</p>
                    ) : selectedMember.projectNames.map((projectName, index) => (
                      <button
                        key={`${selectedMember.id}_${projectName}`}
                        onClick={() => onOpenProject(selectedMember.projectIds[index])}
                        className="w-full text-left px-3 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032]/55 text-sm text-slate-200 hover:border-[#22C55E]/25 hover:bg-[#162032] transition-colors"
                      >
                        {projectName}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Recent History</h4>
                  <div className="space-y-2">
                    {selectedMember.history.length === 0 ? (
                      <p className="text-xs text-slate-500">No historical records yet.</p>
                    ) : selectedMember.history.slice(0, 4).map(entry => (
                      <div key={entry.id} className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/55 px-3 py-2">
                        <p className="text-sm text-slate-200">{entry.projectName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.completedTasks} tasks completed • {entry.role}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectFilesView: React.FC<{
  files: ProjectFileItem[];
  onUpload: (files: FileList | null) => void;
  onDelete: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => void;
}> = ({ files, onUpload, onDelete, onRename }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewFile, setPreviewFile] = useState<ProjectFileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ file: ProjectFileItem; x: number; y: number } | null>(null);

  const getExt = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
  };

  const isImage = (file: ProjectFileItem) => (file.mimeType || '').startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
  const isPdf = (file: ProjectFileItem) => (file.mimeType || '').includes('pdf') || /\.pdf$/i.test(file.name);
  const isVideo = (file: ProjectFileItem) => (file.mimeType || '').startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

  const getFileIcon = (file: ProjectFileItem) => {
    if (isImage(file)) return <FileImage size={14} className="text-sky-300" />;
    if (isPdf(file)) return <FileText size={14} className="text-red-300" />;
    if (isVideo(file)) return <Video size={14} className="text-violet-300" />;
    if (/\.(ai|psd)$/i.test(file.name)) return <FileCode2 size={14} className="text-emerald-300" />;
    return <File size={14} className="text-slate-300" />;
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const downloadFile = (file: ProjectFileItem) => {
    if (!file.objectUrl) return;
    const a = document.createElement('a');
    a.href = file.objectUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderPreviewBody = (file: ProjectFileItem) => {
    if (!file.objectUrl) {
      return <div className="h-[360px] flex items-center justify-center text-sm text-slate-500">Preview unavailable for this file.</div>;
    }
    if (isImage(file)) {
      return <img src={file.objectUrl} alt={file.name} className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg border border-[#22C55E]/12" />;
    }
    if (isPdf(file)) {
      return <iframe src={file.objectUrl} title={file.name} className="w-full h-[60vh] rounded-lg border border-[#22C55E]/12 bg-[#0A0F1A]" />;
    }
    if (isVideo(file)) {
      return <video controls src={file.objectUrl} className="max-h-[60vh] w-auto max-w-full rounded-lg border border-[#22C55E]/12" />;
    }
    return <div className="h-[360px] flex items-center justify-center text-sm text-slate-500">Preview unavailable for this file type.</div>;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Project Files</h2>
            <p className="text-sm text-slate-500 mt-1">Upload and track project documents.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#162032] p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-[#0F1A2A] text-[#22C55E]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Grid3X3 size={13} /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-[#0F1A2A] text-[#22C55E]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List size={13} /> List
              </button>
            </div>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] cursor-pointer">
              <Paperclip size={14} />
              Upload Files
              <input type="file" className="hidden" multiple onChange={(e) => onUpload(e.target.files)} />
            </label>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2.5'}>
          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#22C55E]/20 bg-[#0F1A2A] px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              <p className="font-semibold text-slate-300 mb-1">No files uploaded yet</p>
              <p>Drag files here or use Upload Files</p>
            </div>
          ) : files.map(file => {
            const compact = viewMode === 'list';
            return (
              <div
                key={file.id}
                className={`rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ file, x: e.clientX, y: e.clientY });
                }}
              >
                {compact ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isImage(file) && file.objectUrl ? (
                        <button onClick={() => setPreviewFile(file)} className="w-10 h-10 rounded-lg border border-[#22C55E]/12 overflow-hidden flex-shrink-0 bg-[#162032]">
                          <img src={file.objectUrl} alt={file.name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-[#22C55E]/12 bg-[#162032] flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#22C55E]/20 text-[#6EE7B7]">{getExt(file.name)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{file.sizeLabel} • {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button onClick={() => setPreviewFile(file)} className="px-2 py-1 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]">Preview</button>
                      <button onClick={() => downloadFile(file)} disabled={!file.objectUrl} className="px-2 py-1 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] disabled:opacity-40">Download</button>
                      <button onClick={() => onDelete(file.id)} className="px-2 py-1 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10">Remove</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3">
                      {isImage(file) && file.objectUrl ? (
                        <button onClick={() => setPreviewFile(file)} className="w-14 h-14 rounded-lg border border-[#22C55E]/12 overflow-hidden flex-shrink-0 bg-[#162032]">
                          <img src={file.objectUrl} alt={file.name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-[#22C55E]/12 bg-[#162032] flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#22C55E]/20 text-[#6EE7B7]">{getExt(file.name)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{file.sizeLabel} • {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]"
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        disabled={!file.objectUrl}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] disabled:opacity-40"
                      >
                        <Download size={12} /> Download
                      </button>
                      <button
                        onClick={() => onDelete(file.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {previewFile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setPreviewFile(null)} />
            <div className="relative bg-[#0F1A2A] border border-[#22C55E]/15 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#22C55E]/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-white truncate pr-4">{previewFile.name}</p>
                <button onClick={() => downloadFile(previewFile)} className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]">Download</button>
              </div>
              <div className="p-4 flex items-center justify-center bg-[#0A0F1A]">
                {renderPreviewBody(previewFile)}
              </div>
              <div className="px-4 py-3 border-t border-[#22C55E]/10 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{previewFile.sizeLabel} • Uploaded by {previewFile.uploadedBy} • {new Date(previewFile.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadFile(previewFile)} className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032]">Download</button>
                  {previewFile.objectUrl && (
                    <a href={previewFile.objectUrl} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032]">Open full size</a>
                  )}
                  <button onClick={() => setPreviewFile(null)} className="text-xs px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {contextMenu && (
          <div
            className="fixed z-[130] w-40 rounded-xl border border-[#22C55E]/15 bg-[#0F1A2A] p-1.5 shadow-2xl"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            <button onClick={() => { setPreviewFile(contextMenu.file); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md">Preview</button>
            <button onClick={() => { downloadFile(contextMenu.file); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md">Download</button>
            <button
              onClick={() => {
                const nextName = window.prompt('Rename file', contextMenu.file.name);
                if (nextName) onRename(contextMenu.file.id, nextName);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md"
            >
              Rename
            </button>
            <button onClick={() => { onDelete(contextMenu.file.id); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-red-300 hover:bg-red-500/10 rounded-md">Remove</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Kanban Subcomponent
const KanbanBoard: React.FC<{
  project: Project;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newStatus: Status) => void;
  onAddTask: (status: Status) => void;
  onDeleteTask: (taskId: string) => void;
}> = ({ project, onTaskClick, onTaskDrop, onAddTask, onDeleteTask }) => {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const todayStartMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  useEffect(() => {
    if (!menuTaskId) return;

    const handleOutsideMenuClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-task-menu]') || target.closest('[data-task-menu-button]')) return;
      setMenuTaskId(null);
    };

    document.addEventListener('mousedown', handleOutsideMenuClick);
    return () => document.removeEventListener('mousedown', handleOutsideMenuClick);
  }, [menuTaskId]);

  const columns: { id: Status; title: string; color: string }[] = [
    { id: 'todo', title: 'Todo', color: 'bg-slate-500' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'ready-for-review', title: 'Ready for Review', color: 'bg-[#EAB308]' },
    { id: 'done', title: 'Done', color: 'bg-green-500' }
  ];

  return (
    <div className="flex h-full gap-6 min-w-[1000px]">
      {columns.map(col => {
        const tasks = project.tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) onTaskDrop(taskId, col.id);
              setDragOverCol(null);
            }}
            className={`flex-1 flex flex-col rounded-xl border max-w-sm transition-all ${
              dragOverCol === col.id ? 'border-[#22C55E]/50 bg-[#22C55E]/5' : 'bg-[#0F1A2A]/40 backdrop-blur-md border-[#22C55E]/10'
            }`}
          >
            <div className="p-3 flex items-center justify-between border-b border-[#22C55E]/10 bg-[#0F1A2A]/80 rounded-t-xl backdrop-blur-sm sticky top-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                <h3 className="font-bold text-white text-sm">{col.title} ({tasks.length})</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  col.id === 'todo' ? 'bg-slate-500/15 text-slate-300 border-slate-500/25' :
                  col.id === 'in-progress' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                  col.id === 'ready-for-review' ? 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30' :
                  'bg-green-500/15 text-green-300 border-green-500/30'
                }`}>{tasks.length}</span>
              </div>
              <button onClick={() => onAddTask(col.id)} className="text-slate-500 hover:text-[#22C55E] transition-colors">
                <Plus size={16} />
              </button>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {tasks.map(task => (
                (() => {
                  const endDateMs = new Date(task.endDate).getTime();
                  const isOverdue = task.status !== 'done' && endDateMs < todayStartMs;
                  return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <motion.div
                    layoutId={task.id}
                    onClick={() => onTaskClick(task)}
                    whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                    className={`relative bg-[#162032] p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing group ${
                      task.status === 'todo' ? 'border-slate-500/25' :
                      task.status === 'in-progress' ? 'border-blue-500/30' :
                      task.status === 'ready-for-review' ? 'border-[#EAB308]/35' :
                      'border-green-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'} className="text-[10px] px-1.5 py-0">
                          {task.priority}
                        </Badge>
                        {isOverdue && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-300">
                            Overdue
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuTaskId(current => current === task.id ? null : task.id);
                        }}
                        data-task-menu-button
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#22C55E] transition-opacity"
                      >
                        <div className="w-6 h-6 rounded-full hover:bg-[#22C55E]/10 flex items-center justify-center">•••</div>
                      </button>
                    </div>
                    {menuTaskId === task.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        data-task-menu
                        className="absolute right-4 top-11 z-20 min-w-[9rem] rounded-xl border border-red-500/20 bg-[#0F1A2A] shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-1.5"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                            setMenuTaskId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete task
                        </button>
                      </div>
                    )}
                    
                    <h4 className="font-bold text-white text-sm mb-2 line-clamp-2">{task.title}</h4>

                    <div className="flex items-center gap-2 mb-2 min-h-4">
                      {task.description && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0F1A2A] border border-[#22C55E]/10 px-1.5 py-0.5 rounded-full">
                          <FileText size={10} /> Note
                        </span>
                      )}
                      {(task.attachmentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0F1A2A] border border-[#22C55E]/10 px-1.5 py-0.5 rounded-full">
                          <Paperclip size={10} /> {task.attachmentCount}
                        </span>
                      )}
                      {(task.commentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0F1A2A] border border-[#22C55E]/10 px-1.5 py-0.5 rounded-full">
                          <MessageSquare size={10} /> {task.commentCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-300' : 'text-slate-500'}`}>
                        <CalendarIcon size={12} />
                        <span>{new Date(task.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-')}</span>
                      </div>
                      {task.assignee && (
                        <Avatar src={task.assignee.avatar} fallback={task.assignee.name.charAt(0)} size="sm" className="w-6 h-6 text-[10px]" />
                      )}
                    </div>
                  </motion.div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Timeline Subcomponent (Simplified Gantt)
const TimelineView: React.FC<{ project: Project; onTaskClick: (task: Task) => void }> = ({ project, onTaskClick }) => {
  const [scale, setScale] = useState<'day' | 'week' | 'month'>('week');
  const sortedTasks = [...project.tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const DAY_MS = 86400000;
  const startOfDay = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const startOfWeek = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.getTime();
  };
  const startOfMonth = (ms: number) => {
    const d = new Date(ms);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const monthDiff = (fromMs: number, toMs: number) => {
    const from = new Date(fromMs);
    const to = new Date(toMs);
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  };

  const timelineBounds = useMemo(() => {
    if (sortedTasks.length === 0) {
      const now = startOfDay(Date.now());
      return { min: now - 7 * DAY_MS, max: now + 21 * DAY_MS };
    }

    const taskDates = sortedTasks.flatMap(task => [
      startOfDay(new Date(task.startDate).getTime()),
      startOfDay(new Date(task.endDate).getTime()),
    ]);
    const minTask = Math.min(...taskDates);
    const maxTask = Math.max(...taskDates);
    return {
      min: minTask - 2 * DAY_MS,
      max: maxTask + 2 * DAY_MS,
    };
  }, [sortedTasks]);

  const gridModel = useMemo(() => {
    const min = timelineBounds.min;
    const max = timelineBounds.max;

    if (scale === 'day') {
      const unitPx = 46;
      const start = startOfDay(min);
      const end = startOfDay(max);
      const totalUnits = Math.max(1, Math.floor((end - start) / DAY_MS) + 1);
      const labels = Array.from({ length: totalUnits }).map((_, idx) => {
        const ms = start + idx * DAY_MS;
        return {
          text: new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          key: `d_${ms}`,
        };
      });
      return { start, totalUnits, unitPx, labels };
    }

    if (scale === 'month') {
      const unitPx = 180;
      const start = startOfMonth(min);
      const end = startOfMonth(max);
      const totalUnits = Math.max(1, monthDiff(start, end) + 1);
      const labels = Array.from({ length: totalUnits }).map((_, idx) => {
        const d = new Date(start);
        d.setMonth(d.getMonth() + idx);
        return {
          text: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          key: `m_${d.getFullYear()}_${d.getMonth()}`,
        };
      });
      return { start, totalUnits, unitPx, labels };
    }

    const unitPx = 120;
    const start = startOfWeek(min);
    const end = startOfWeek(max);
    const totalUnits = Math.max(1, Math.floor((end - start) / (7 * DAY_MS)) + 1);
    const labels = Array.from({ length: totalUnits }).map((_, idx) => {
      const ms = start + idx * 7 * DAY_MS;
      const rangeStart = new Date(ms);
      const rangeEnd = new Date(ms + 6 * DAY_MS);
      return {
        text: `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { day: 'numeric' })}`,
        key: `w_${ms}`,
      };
    });
    return { start, totalUnits, unitPx, labels };
  }, [timelineBounds, scale]);

  const timelineWidth = Math.max(920, gridModel.totalUnits * gridModel.unitPx);

  const periodLabel = useMemo(() => {
    if (gridModel.labels.length === 0) return 'No tasks';
    const first = gridModel.labels[0].text;
    const last = gridModel.labels[gridModel.labels.length - 1].text;
    return first === last ? first : `${first} - ${last}`;
  }, [gridModel.labels]);

  const getOffsetUnits = (ms: number) => {
    if (scale === 'day') return Math.floor((startOfDay(ms) - gridModel.start) / DAY_MS);
    if (scale === 'month') return monthDiff(gridModel.start, startOfMonth(ms));
    return Math.floor((startOfWeek(ms) - gridModel.start) / (7 * DAY_MS));
  };

  const todayUnits = getOffsetUnits(Date.now());
  const todayX = (todayUnits + 0.5) * gridModel.unitPx;

  const getTaskBar = (task: Task) => {
    const taskStartMs = new Date(task.startDate).getTime();
    const taskEndMs = new Date(task.endDate).getTime();
    const startUnits = getOffsetUnits(taskStartMs);
    const endUnits = getOffsetUnits(taskEndMs);
    const widthUnits = Math.max(1, endUnits - startUnits + 1);

    return {
      x: Math.max(0, startUnits) * gridModel.unitPx + 4,
      width: Math.max(32, widthUnits * gridModel.unitPx - 8),
    };
  };

  const statusClass: Record<Status, string> = {
    'todo': 'bg-slate-500/25 text-slate-300 border-slate-400/25',
    'in-progress': 'bg-blue-500/28 text-blue-300 border-blue-400/30',
    'ready-for-review': 'bg-[#EAB308]/28 text-[#F4E17A] border-[#EAB308]/35',
    'done': 'bg-green-500/28 text-green-300 border-green-400/30',
  };
  
  return (
    <div className="bg-[#0F1A2A] rounded-xl border border-[#22C55E]/10 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#22C55E]/10 bg-[#0A0F1A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{periodLabel}</span>
        </div>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setScale(mode)}
              className={`px-3 py-1 rounded text-xs font-medium border capitalize transition-colors ${
                scale === mode
                  ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                  : 'bg-[#162032] border-[#22C55E]/10 text-slate-400 hover:text-[#22C55E]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[980px]" style={{ width: `${250 + timelineWidth}px` }}>
          <div className="sticky top-0 z-20 flex border-b border-[#22C55E]/10 bg-[#0F1A2A]">
            <div className="w-[250px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Task</div>
            <div className="relative" style={{ width: `${timelineWidth}px` }}>
              <div className="absolute inset-0 pointer-events-none">
                {gridModel.labels.map((label, idx) => (
                  <div
                    key={label.key}
                    className="absolute top-0 bottom-0 border-l border-dashed border-[#22C55E]/10"
                    style={{ left: `${idx * gridModel.unitPx}px` }}
                  />
                ))}
                {todayUnits >= 0 && todayUnits < gridModel.totalUnits && (
                  <div className="absolute top-0 bottom-0 border-l border-[#EAB308]/70" style={{ left: `${todayX}px` }}>
                    <span className="absolute -top-5 -left-5 rounded bg-[#1A2638] px-1.5 py-0.5 text-[10px] font-semibold text-[#EAB308]">Today</span>
                  </div>
                )}
              </div>
              <div className="flex text-[11px] text-slate-500">
                {gridModel.labels.map((label, idx) => (
                  <div
                    key={label.key}
                    className="px-2 py-2 whitespace-nowrap"
                    style={{ width: `${gridModel.unitPx}px`, opacity: scale === 'day' && idx % 2 === 1 ? 0.5 : 1 }}
                  >
                    {label.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {sortedTasks.map((task, index) => {
              const bar = getTaskBar(task);
              return (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`w-full text-left flex border-b border-[#22C55E]/5 hover:bg-[#162032]/45 transition-colors ${index % 2 === 0 ? 'bg-[#0C1422]/35' : ''}`}
                >
                  <div className="w-[250px] px-4 py-3 flex items-center gap-3 border-r border-[#22C55E]/5">
                    <Avatar src={task.assignee?.avatar} fallback="?" size="sm" className="w-7 h-7 text-[11px]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                      <p className="text-[11px] text-slate-500">{new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="relative py-3" style={{ width: `${timelineWidth}px` }}>
                    <div className="absolute inset-0 pointer-events-none">
                      {gridModel.labels.map((label, idx) => (
                        <div
                          key={`${task.id}_${label.key}`}
                          className="absolute top-0 bottom-0 border-l border-dashed border-[#22C55E]/10"
                          style={{ left: `${idx * gridModel.unitPx}px` }}
                        />
                      ))}
                    </div>

                    <motion.div
                      initial={{ width: 0, opacity: 0.8 }}
                      animate={{ width: bar.width, opacity: 1 }}
                      transition={{ duration: 0.35, delay: index * 0.03 }}
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg border px-2.5 flex items-center ${statusClass[task.status]}`}
                      style={{ left: `${bar.x}px` }}
                    >
                      <span className="text-xs font-semibold truncate max-w-[220px]">{task.title}</span>
                    </motion.div>
                  </div>
                </button>
              );
            })}
            {sortedTasks.length === 0 && (
              <div className="py-14 text-center text-sm text-slate-500">No tasks yet. Create tasks to populate the timeline.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView: React.FC<{ project: Project; onTaskClick: (task: Task) => void }> = ({ project, onTaskClick }) => {
  const [monthOffset, setMonthOffset] = useState(0);

  const visibleMonthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const calendarDays = useMemo(() => {
    const monthStart = new Date(visibleMonthStart);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const gridStart = new Date(monthStart);
    const weekDay = (gridStart.getDay() + 6) % 7;
    gridStart.setDate(gridStart.getDate() - weekDay);

    const gridEnd = new Date(monthEnd);
    const endWeekDay = (gridEnd.getDay() + 6) % 7;
    gridEnd.setDate(gridEnd.getDate() + (6 - endWeekDay));

    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [visibleMonthStart]);

  const tasksByEndDate = useMemo(() => {
    const byDate: Record<string, Task[]> = {};
    project.tasks.forEach((task: Task) => {
      if (!byDate[task.endDate]) byDate[task.endDate] = [];
      byDate[task.endDate].push(task);
    });
    return byDate;
  }, [project.tasks]);

  const todayKey = new Date().toISOString().split('T')[0];

  const statusChipClass: Record<Status, string> = {
    'todo': 'border-slate-500/25 bg-slate-500/20 text-slate-200',
    'in-progress': 'border-blue-500/30 bg-blue-500/20 text-blue-200',
    'ready-for-review': 'border-[#EAB308]/35 bg-[#EAB308]/18 text-[#F4E17A]',
    'done': 'border-green-500/35 bg-green-500/20 text-green-200',
  };

  return (
    <div className="bg-[#0F1A2A] rounded-xl border border-[#22C55E]/10 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#22C55E]/10 bg-[#0A0F1A] flex items-center justify-between">
        <button
          onClick={() => setMonthOffset(prev => prev - 1)}
          className="px-2.5 py-1.5 rounded-md border border-[#22C55E]/15 text-xs text-slate-300 hover:bg-[#162032]"
        >
          Previous
        </button>
        <p className="text-sm font-semibold text-slate-200">
          {visibleMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => setMonthOffset(prev => prev + 1)}
          className="px-2.5 py-1.5 rounded-md border border-[#22C55E]/15 text-xs text-slate-300 hover:bg-[#162032]"
        >
          Next
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-[11px] uppercase tracking-wider text-slate-500 px-1 py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 auto-rows-[120px]">
          {calendarDays.map((date) => {
            const key = date.toISOString().split('T')[0];
            const dayTasks = tasksByEndDate[key] || [];
            const inCurrentMonth = date.getMonth() === visibleMonthStart.getMonth();
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={`rounded-lg border p-2 flex flex-col gap-1.5 ${inCurrentMonth ? 'border-[#22C55E]/12 bg-[#0C1422]/55' : 'border-[#22C55E]/6 bg-[#0C1422]/25 opacity-60'} ${isToday ? 'ring-1 ring-[#22C55E]/35' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isToday ? 'text-[#22C55E]' : 'text-slate-300'}`}>{date.getDate()}</span>
                  {dayTasks.length > 0 && <span className="text-[10px] text-slate-500">{dayTasks.length}</span>}
                </div>

                <div className="space-y-1 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate ${statusChipClass[task.status]}`}
                      title={task.title}
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-slate-500 px-1">+{dayTasks.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Add Task Modal
const AddTaskModal: React.FC<{
  isOpen: boolean;
  status: Status;
  onClose: () => void;
  onSubmit: (title: string, priority: Priority, description: string, attachmentCount: number) => void;
}> = ({ isOpen, status, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [description, setDescription] = useState('');
  const [attachmentCount, setAttachmentCount] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, description, attachmentCount);
    setTitle('');
    setPriority('medium');
    setDescription('');
    setAttachmentCount(0);
  };

  const statusLabels: Record<Status, string> = {
    'todo': 'Todo',
    'in-progress': 'In Progress',
    'ready-for-review': 'Ready for Review',
    'done': 'Done',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-md border border-[#22C55E]/10 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
          <h3 className="font-bold text-white">New Task</h3>
          <span className="text-xs text-slate-500 bg-[#162032] px-2 py-1 rounded">{statusLabels[status]}</span>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Task title</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all capitalize ${
                    priority === p
                      ? p === 'high' ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : p === 'medium' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                        : 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-[#22C55E]/10 text-slate-400 hover:bg-[#162032]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Note (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add quick note for this task..."
              className="w-full min-h-20 px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Attachments count</label>
            <input
              type="number"
              min={0}
              value={attachmentCount}
              onChange={(e) => setAttachmentCount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Create Task</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Create Project Modal
const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm border border-[#22C55E]/10 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#22C55E]/10">
          <h3 className="font-bold text-white">New Project</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Project name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Sign Out Confirmation Dialog
const SignOutConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm border border-[#22C55E]/10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-[#22C55E]/10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <LogOut size={18} className="text-red-400" /> Sign Out
          </h3>
        </div>
        <div className="p-6">
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to sign out? Your unsaved changes will be preserved locally, but you'll need to sign in again to continue.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-medium text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
