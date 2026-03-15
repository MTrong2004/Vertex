import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { WorkspaceMember } from '../../types';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  member: WorkspaceMember | null;
  onSave: (member: WorkspaceMember) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, member, onSave }) => {
  const { showToast } = useToast();
  const [draft, setDraft] = useState<WorkspaceMember | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!open || !member) return;
    setDraft(member);
    setName(member.profile.name || '');
    setTitle(member.profile.title || '');
    setBio(member.profile.bio || '');
    setEmail(member.profile.email || '');
    setSkillInput('');
  }, [open, member]);

  const addSkill = () => {
    if (!draft) return;
    const nextSkill = skillInput.trim();
    if (!nextSkill) return;

    const alreadyExists = draft.skills.some(skill => skill.toLowerCase() === nextSkill.toLowerCase());
    if (alreadyExists) {
      setSkillInput('');
      return;
    }

    setDraft({
      ...draft,
      skills: [...draft.skills, nextSkill],
    });
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      skills: draft.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const handleSave = () => {
    if (!draft) return;

    const updated: WorkspaceMember = {
      ...draft,
      profile: {
        ...draft.profile,
        name: name.trim() || draft.profile.name,
        title: title.trim() || 'Contributor',
        bio: bio.trim(),
        email: email.trim() || undefined,
      },
    };

    onSave(updated);
    showToast('Profile and skills saved');
    onClose();
  };

  if (!member) return null;

  return (
    <AnimatePresence>
      {open && draft && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22 }}
            className="absolute right-0 top-0 h-full w-full sm:w-[520px] border-l border-[#22C55E]/12 bg-[#0F1A2A] shadow-2xl shadow-black/40"
          >
            <div className="flex h-full flex-col">
              <div className="px-6 py-5 border-b border-[#22C55E]/12 flex items-start justify-between gap-4 bg-gradient-to-r from-[#22C55E]/10 to-[#60A5FA]/10">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Profile</p>
                  <h3 className="mt-2 text-xl font-bold text-white">Profile</h3>
                  <p className="mt-1 text-sm text-slate-400">Skills saved here feed the members database and AI planner.</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#162032] transition-colors" aria-label="Close profile panel">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <section className="rounded-2xl border border-[#22C55E]/10 bg-[#162032]/45 p-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={draft.profile.avatar} fallback={draft.profile.name.charAt(0)} size="md" className="w-16 h-16" />
                    <div>
                      <p className="text-lg font-semibold text-white">{draft.profile.name}</p>
                      <p className="text-sm text-slate-400">{draft.profile.email || 'Workspace member'}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#22C55E]/10 bg-[#162032] px-3.5 py-3 text-sm text-white outline-none focus:border-[#22C55E]/35" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Designer" className="mt-2 w-full rounded-xl border border-[#22C55E]/10 bg-[#162032] px-3.5 py-3 text-sm text-white outline-none focus:border-[#22C55E]/35" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell the team what you are strongest at." className="mt-2 w-full rounded-xl border border-[#22C55E]/10 bg-[#162032] px-3.5 py-3 text-sm text-white outline-none focus:border-[#22C55E]/35 resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#22C55E]/10 bg-[#162032] px-3.5 py-3 text-sm text-white outline-none focus:border-[#22C55E]/35" />
                  </div>
                </section>

                <section className="rounded-2xl border border-[#22C55E]/10 bg-[#162032]/45 p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Skills</h4>
                    <p className="mt-1 text-xs text-slate-500">Add the skills you want Vertex AI to consider for scoring and assignment suggestions.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {draft.skills.length === 0 ? (
                      <span className="text-xs text-slate-500">No skills added yet.</span>
                    ) : draft.skills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/16 bg-[#0F1A2A] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-[#22C55E]/30 hover:text-white transition-colors"
                      >
                        <span>{skill}</span>
                        <span className="text-slate-500">×</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Add skill"
                      className="flex-1 rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-3.5 py-3 text-sm text-white outline-none focus:border-[#22C55E]/35"
                    />
                    <button onClick={addSkill} className="inline-flex items-center gap-2 rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/12 px-4 py-3 text-sm font-semibold text-[#6EE7B7] hover:bg-[#22C55E]/18 transition-colors">
                      <Plus size={14} />
                      Add Skill
                    </button>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#22C55E]/10 bg-[#162032]/45 p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Availability</h4>
                    <p className="mt-1 text-xs text-slate-500">This helps workload balancing choose who has capacity for the next task.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(['available', 'busy'] as const).map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDraft({ ...draft, availability: option })}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                          draft.availability === option
                            ? 'border-[#22C55E]/40 bg-[#22C55E]/14 text-[#6EE7B7]'
                            : 'border-[#22C55E]/10 bg-[#0F1A2A] text-slate-400 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="border-t border-[#22C55E]/12 px-6 py-4 flex items-center justify-end gap-3 bg-[#0F1A2A]">
                <button onClick={onClose} className="rounded-xl border border-[#22C55E]/10 bg-[#162032] px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-[#22C55E] to-[#60A5FA] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#22C55E]/15 hover:brightness-110 transition">Save</button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
