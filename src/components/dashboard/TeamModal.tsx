import React, { useEffect, useState } from 'react';
import { users } from '../../data/mockData';
import { User } from '../../types';
import { X, UserPlus, Star, User as UserIcon, Link as LinkIcon, Copy, Share2 } from 'lucide-react';

interface TeamModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  members: User[];
  onAddMember: (user: User) => void;
  onRemoveMember: (userId: string) => void;
  onInvite: (payload: { email: string; role: TeamRole; projectCode: string; joinLink: string }) => void;
}

type TeamRole = 'Leader' | 'Member' | 'Guest';

interface TeamMember extends User {
  teamRole: TeamRole;
}

const roleConfig: Record<TeamRole, { icon: React.ReactNode; color: string }> = {
  Leader: { icon: <Star size={12} />, color: 'text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20' },
  Member: { icon: <UserIcon size={12} />, color: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20' },
  Guest: { icon: <UserPlus size={12} />, color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
};

const ROLE_STORAGE_KEY = 'ppt_project_member_roles';

const readStoredRoles = (): Record<string, Record<string, TeamRole>> => {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const makeProjectCode = (projectId: string, projectName: string) => {
  const base = `${projectId}-${projectName}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) % 46656;
  }
  const alpha = hash.toString(36).toUpperCase().padStart(3, '0').slice(-3);
  const digits = (projectId.replace(/\D/g, '') || '21').padStart(2, '0').slice(-2);
  const classPart = projectName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 2).padEnd(2, 'X');
  return `VTX-${classPart}${alpha}-${digits}`;
};

export const TeamModal: React.FC<TeamModalProps> = ({ open, onClose, projectId, projectName, members, onAddMember, onRemoveMember, onInvite }) => {
  const [projectMembers, setProjectMembers] = useState<TeamMember[]>([]);
  const [available, setAvailable] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('Member');
  const [copiedHint, setCopiedHint] = useState(false);

  const projectCode = makeProjectCode(projectId, projectName);
  const joinLink = `https://vertex.app/join/${projectCode}`;

  useEffect(() => {
    if (!open) return;
    const storedRoles = readStoredRoles();
    const projectRoles = storedRoles[projectId] || {};
    setProjectMembers(members.map((member, index) => ({
      ...member,
      teamRole: projectRoles[member.id] || (index === 0 ? 'Leader' : 'Member'),
    })));

    const memberIds = new Set(members.map(member => member.id));
    setAvailable(users.filter(u => !memberIds.has(u.id)));
    setInviteEmail('');
    setInviteRole('Member');
    setCopiedHint(false);
  }, [open, members, projectId]);

  const save = (next: TeamMember[]) => {
    setProjectMembers(next);
    const storedRoles = readStoredRoles();
    storedRoles[projectId] = next.reduce<Record<string, TeamRole>>((acc, member) => {
      acc[member.id] = member.teamRole;
      return acc;
    }, {});
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(storedRoles));
  };

  const handleRemove = (id: string) => {
    const next = projectMembers.filter(m => m.id !== id);
    save(next);
    const removedUser = projectMembers.find(member => member.id === id);
    if (removedUser) onRemoveMember(id);
    setAvailable(users.filter(u => !next.find(m => m.id === u.id)));
  };

  const handleAdd = (user: User, role: TeamRole) => {
    const next = [...projectMembers, { ...user, teamRole: role }];
    save(next);
    onAddMember(user);
    setAvailable(users.filter(u => !next.find(n => n.id === u.id)));
  };

  const handleInviteEmail = () => {
    const email = inviteEmail.trim().toLowerCase();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) return;

    const existingUser = users.find(u => (u.email || '').toLowerCase() === email);
    if (existingUser && !projectMembers.some(member => member.id === existingUser.id)) {
      handleAdd(existingUser, inviteRole);
    }

    onInvite({ email, role: inviteRole, projectCode, joinLink });
    setInviteEmail('');
  };

  const copyValue = async (value: string, markCopied = false) => {
    try {
      await navigator.clipboard.writeText(value);
      if (markCopied) {
        setCopiedHint(true);
        window.setTimeout(() => setCopiedHint(false), 1800);
      }
    } catch {
      // Ignore clipboard errors in unsupported browsers.
    }
  };

  const handleShare = async () => {
    const shareText = `Join my project ${projectName} with code ${projectCode} or link ${joinLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Join ${projectName}`, text: shareText, url: joinLink });
        return;
      }
      await copyValue(shareText, true);
    } catch {
      // Ignore share cancellation.
    }
  };

  const changeRole = (id: string, r: TeamRole) => {
    save(projectMembers.map(m => m.id === id ? { ...m, teamRole: r } : m));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0F1A2A]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-[560px] max-w-full mx-4 overflow-hidden border border-[#22C55E]/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">Invite Members</h3>
            <p className="text-sm text-slate-400 mt-0.5">{projectName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#162032] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Invite section */}
        <div className="px-6 py-4 border-b border-[#22C55E]/5 bg-[#162032]/30 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Project Code</p>
            <div className="rounded-xl border border-[#22C55E]/15 bg-[#0A0F1A] p-3">
              <div className="flex items-center gap-2 justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white tracking-wide">{projectCode}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{joinLink}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Join by code defaults to Member role.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyValue(projectCode, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032]"
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032]"
                  >
                    <Share2 size={12} />
                    Share
                  </button>
                </div>
              </div>
              {copiedHint && (
                <div className="mt-2 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-1.5">
                  <p className="text-[11px] text-[#6EE7B7] font-medium">Copied! Share with your team</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[10px] uppercase tracking-widest text-slate-600">or</div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Invite by email</p>
              <div className="relative">
                <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="lan@student.edu"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0A0F1A] border border-[#22C55E]/10 text-sm text-white outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>
            <div className="sm:col-span-1">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Role</p>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as TeamRole)}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0F1A] border border-[#22C55E]/10 text-sm text-white outline-none focus:border-[#22C55E]"
              >
                <option>Leader</option>
                <option>Member</option>
                <option>Guest</option>
              </select>
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                onClick={handleInviteEmail}
                disabled={!inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus size={14} />
                Send Invite
              </button>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2">
          {projectMembers.map(m => {
            const rc = roleConfig[m.teamRole];
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#162032]/60 border border-[#22C55E]/5 hover:border-[#22C55E]/15 transition-colors group">
                <div className="relative flex-shrink-0">
                  <img src={m.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-[#22C55E]/20" alt={m.name} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#162032]"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{m.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${rc.color}`}>
                      {rc.icon}
                      {m.teamRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">ID: {m.id}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={m.teamRole}
                    onChange={e => changeRole(m.id, e.target.value as TeamRole)}
                    className="px-2 py-1 rounded-lg text-xs bg-[#0A0F1A] border border-[#22C55E]/10 text-slate-300 outline-none focus:border-[#22C55E]"
                  >
                    <option>Leader</option>
                    <option>Member</option>
                    <option>Guest</option>
                  </select>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
