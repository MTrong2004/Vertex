import { Project, User } from '../types';

type LegacyProjectRecord = Omit<Project, 'memberIds'> & {
  memberIds?: string[];
  members?: User[];
};

const isProjectRecord = (value: unknown): value is LegacyProjectRecord => {
  return Boolean(value && typeof value === 'object');
};

export const normalizeProjectRecord = (project: LegacyProjectRecord): Project => {
  const memberIds = Array.isArray(project.memberIds)
    ? project.memberIds.filter((id): id is string => typeof id === 'string')
    : Array.isArray(project.members)
      ? project.members
          .map(member => member?.id)
          .filter((id): id is string => typeof id === 'string')
      : [];

  return {
    ...project,
    memberIds,
    members: undefined,
  };
};

export const normalizeProjects = (projects: unknown): Project[] => {
  if (!Array.isArray(projects)) return [];

  return projects
    .filter(isProjectRecord)
    .map(project => normalizeProjectRecord(project));
};

export const resolveProjectMembers = (project: Project, memberLookup: Map<string, User>): User[] => {
  const fromIds = project.memberIds
    .map(memberId => memberLookup.get(memberId))
    .filter((member): member is User => Boolean(member));

  if (fromIds.length > 0) return fromIds;

  const legacyMembers = Array.isArray(project.members) ? project.members : [];
  return legacyMembers;
};
