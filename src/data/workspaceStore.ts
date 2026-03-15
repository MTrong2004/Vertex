import { users } from './mockData';
import { Workspace, WorkspaceMember, User } from '../types';

const WORKSPACE_STORAGE_KEY = 'ppt_workspace';

const defaultWorkspaceMembers: WorkspaceMember[] = users.map((user, idx) => ({
  id: user.id,
  profile: {
    name: user.name,
    avatar: user.avatar,
    email: user.email,
    role: user.role,
    title: idx % 2 === 0 ? 'Designer' : 'Researcher',
    bio: idx % 2 === 0
      ? 'Focused on visual systems, motion cues, and clear interface polish.'
      : 'Strong at discovery, synthesis, and turning messy inputs into clear direction.',
  },
  skills: idx % 2 === 0 ? ['UI', 'Motion'] : ['Research', 'Writing'],
  availability: 'available',
  taskStats: {
    completed: 0,
    inProgress: 0,
    bySkill: {},
  },
  projectsJoined: [],
  history: [],
}));

const defaultWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Vertex Studio',
  members: defaultWorkspaceMembers,
};

const normalizeWorkspaceMember = (member: Partial<WorkspaceMember>, fallbackIndex: number): WorkspaceMember => {
  const fallback = defaultWorkspaceMembers[fallbackIndex] || defaultWorkspaceMembers[0];

  return {
    id: typeof member.id === 'string' ? member.id : fallback.id,
    profile: {
      name: typeof member.profile?.name === 'string' ? member.profile.name : fallback.profile.name,
      avatar: typeof member.profile?.avatar === 'string' ? member.profile.avatar : fallback.profile.avatar,
      email: typeof member.profile?.email === 'string' ? member.profile.email : fallback.profile.email,
      role: member.profile?.role ?? fallback.profile.role,
      title: typeof member.profile?.title === 'string' ? member.profile.title : fallback.profile.title,
      bio: typeof member.profile?.bio === 'string' ? member.profile.bio : fallback.profile.bio,
    },
    skills: Array.isArray(member.skills)
      ? member.skills.filter((skill): skill is string => typeof skill === 'string')
      : fallback.skills,
    availability: member.availability === 'available' || member.availability === 'busy' || member.availability === 'away'
      ? member.availability
      : fallback.availability,
    taskStats: {
      completed: typeof member.taskStats?.completed === 'number' ? member.taskStats.completed : fallback.taskStats.completed,
      inProgress: typeof member.taskStats?.inProgress === 'number' ? member.taskStats.inProgress : fallback.taskStats.inProgress,
      bySkill: member.taskStats?.bySkill && typeof member.taskStats.bySkill === 'object'
        ? Object.entries(member.taskStats.bySkill).reduce<Record<string, number>>((acc, [skill, count]) => {
            if (typeof count === 'number') acc[skill] = count;
            return acc;
          }, {})
        : fallback.taskStats.bySkill,
    },
    projectsJoined: Array.isArray(member.projectsJoined)
      ? member.projectsJoined.filter((projectId): projectId is string => typeof projectId === 'string')
      : fallback.projectsJoined,
    history: Array.isArray(member.history)
      ? member.history.filter((entry): entry is WorkspaceMember['history'][number] => (
          Boolean(entry)
          && typeof entry.id === 'string'
          && typeof entry.projectId === 'string'
          && typeof entry.projectName === 'string'
          && typeof entry.completedTasks === 'number'
          && typeof entry.role === 'string'
          && typeof entry.endedAt === 'string'
        ))
      : fallback.history,
  };
};

const parseWorkspace = (raw: string | null): Workspace | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    if (!parsed || typeof parsed !== 'object') return null;

    const members = Array.isArray(parsed.members)
      ? parsed.members.map((member, index) => normalizeWorkspaceMember(member, index))
      : defaultWorkspace.members;

    return {
      id: typeof parsed.id === 'string' ? parsed.id : defaultWorkspace.id,
      name: typeof parsed.name === 'string' ? parsed.name : defaultWorkspace.name,
      members,
    };
  } catch {
    return null;
  }
};

export const loadWorkspace = (): Workspace => {
  const parsed = parseWorkspace(localStorage.getItem(WORKSPACE_STORAGE_KEY));
  return parsed ?? defaultWorkspace;
};

export const saveWorkspace = (workspace: Workspace): void => {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
};

export const loadWorkspaceMembers = (): WorkspaceMember[] => {
  return loadWorkspace().members;
};

export const saveWorkspaceMembers = (members: WorkspaceMember[]): void => {
  const workspace = loadWorkspace();
  saveWorkspace({ ...workspace, members });
};

export const upsertWorkspaceMember = (member: WorkspaceMember): WorkspaceMember[] => {
  const members = loadWorkspaceMembers();
  const nextMembers = members.some(entry => entry.id === member.id)
    ? members.map(entry => (entry.id === member.id ? member : entry))
    : [...members, member];

  saveWorkspaceMembers(nextMembers);
  return nextMembers;
};

export const removeWorkspaceMember = (memberId: string): WorkspaceMember[] => {
  const nextMembers = loadWorkspaceMembers().filter(member => member.id !== memberId);
  saveWorkspaceMembers(nextMembers);
  return nextMembers;
};

export const findWorkspaceMember = (memberId: string): WorkspaceMember | undefined => {
  return loadWorkspaceMembers().find(member => member.id === memberId);
};

// Compatibility helper: existing project structure still expects `User[]` members.
export const workspaceMemberToUser = (member: WorkspaceMember): User => ({
  id: member.id,
  name: member.profile.name,
  avatar: member.profile.avatar,
  email: member.profile.email,
  role: member.profile.role,
});
