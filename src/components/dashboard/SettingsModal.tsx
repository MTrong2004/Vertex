import React, { useEffect, useState } from 'react';
import { useToast } from '../ui/Toast';
import { Moon, Sun, X, Bell, Shield, Palette, HardDrive, Sparkles, Settings2, CalendarDays, TriangleAlert, Users, Trash2, LogOut } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  userPlan?: 'free' | 'student_pro' | 'lecturer';
}

type SettingsState = {
  profile: {
    name: string;
    email: string;
    avatar: string;
  };
  workspaceName: string;
  notifications: {
    assigned: boolean;
    overdue: boolean;
    comments: boolean;
  };
  integrations: {
    googleCalendar: boolean;
  };
  permissions: {
    memberCanInvite: boolean;
    memberCanUpload: boolean;
  };
  ai: {
    autoGenerateSubtasks: boolean;
  };
  defaults: {
    defaultPriority: 'low' | 'medium' | 'high';
    defaultView: 'board' | 'timeline' | 'calendar';
  };
};

const SETTINGS_STORAGE_KEY = 'ppt_workspace_settings';

const defaultSettings: SettingsState = {
  profile: {
    name: 'Minh Nguyen',
    email: 'minh@university.edu',
    avatar: 'MN',
  },
  workspaceName: 'Design Studio Workspace',
  notifications: {
    assigned: true,
    overdue: true,
    comments: true,
  },
  integrations: {
    googleCalendar: false,
  },
  permissions: {
    memberCanInvite: true,
    memberCanUpload: true,
  },
  ai: {
    autoGenerateSubtasks: true,
  },
  defaults: {
    defaultPriority: 'medium',
    defaultView: 'board',
  },
};

const ToggleRow: React.FC<{
  title: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ title, description, enabled, onToggle }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3">
    <div className="pr-2">
      <p className="text-sm text-slate-200">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    <button
      onClick={onToggle}
      className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#22C55E]' : 'bg-slate-700'}`}
      aria-pressed={enabled}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, userPlan = 'student_pro' }) => {
  const { showToast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    if (!open) return;
    const theme = localStorage.getItem('theme');
    setIsDark(theme === 'dark');

    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<SettingsState>;
        setSettings({
          profile: {
            ...defaultSettings.profile,
            ...(parsed.profile || {}),
          },
          workspaceName: parsed.workspaceName || defaultSettings.workspaceName,
          notifications: {
            ...defaultSettings.notifications,
            ...(parsed.notifications || {}),
          },
          integrations: {
            ...defaultSettings.integrations,
            ...(parsed.integrations || {}),
          },
          permissions: {
            ...defaultSettings.permissions,
            ...(parsed.permissions || {}),
          },
          ai: {
            ...defaultSettings.ai,
            ...(parsed.ai || {}),
          },
          defaults: {
            ...defaultSettings.defaults,
            ...(parsed.defaults || {}),
          },
        });
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, [open]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    showToast('Settings saved successfully!');
    onClose();
  };

  const isFreePlan = userPlan === 'free';
  const storageConfig = userPlan === 'student_pro'
    ? { usedGb: 2.3, limitGb: 10, usedLabel: '2.3 GB', limitLabel: '10 GB' }
    : userPlan === 'lecturer'
      ? { usedGb: 8.4, limitGb: 50, usedLabel: '8.4 GB', limitLabel: '50 GB' }
      : { usedGb: 0.34, limitGb: 1, usedLabel: '340 MB', limitLabel: '1 GB' };
  const storagePercent = Math.min(100, Math.round((storageConfig.usedGb / storageConfig.limitGb) * 100));

  const updateSettings = (updater: (prev: SettingsState) => SettingsState) => {
    setSettings(prev => updater(prev));
  };

  const handleUpgrade = () => {
    showToast('Upgrade flow coming soon!');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0F1A2A]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-[720px] max-w-full mx-4 overflow-hidden border border-[#22C55E]/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Workspace controls for the {userPlan === 'student_pro' ? 'Pro' : userPlan === 'lecturer' ? 'Lecturer' : 'Free'} plan.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#162032] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {isFreePlan ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                      <Users size={16} className="text-[#22C55E]" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Profile</h4>
                  </div>

                  <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#22C55E]/12 border border-[#22C55E]/20 flex items-center justify-center text-sm font-semibold text-[#6EE7B7]">
                      {settings.profile.avatar}
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={settings.profile.name}
                        onChange={(e) => updateSettings(prev => ({ ...prev, profile: { ...prev.profile, name: e.target.value } }))}
                        className="w-full rounded-lg border border-[#22C55E]/10 bg-[#162032] px-3 py-2 text-sm text-white outline-none focus:border-[#22C55E]/35"
                        placeholder="Name"
                      />
                      <input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => updateSettings(prev => ({ ...prev, profile: { ...prev.profile, email: e.target.value } }))}
                        className="w-full rounded-lg border border-[#22C55E]/10 bg-[#162032] px-3 py-2 text-sm text-white outline-none focus:border-[#22C55E]/35"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                      <Palette size={16} className="text-[#22C55E]" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Appearance</h4>
                  </div>

                  <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3 flex items-center justify-between gap-4">
                    <div className="pr-2">
                      <p className="text-sm text-slate-200">Theme</p>
                      <p className="text-xs text-slate-500 mt-1">Dark / Light</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDark
                          ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20'
                          : 'bg-[#162032] text-slate-300 border border-[#22C55E]/10'
                      }`}
                    >
                      {isDark ? <Moon size={14} /> : <Sun size={14} />}
                      {isDark ? 'Dark' : 'Light'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EAB308]/10 flex items-center justify-center">
                      <Bell size={16} className="text-[#EAB308]" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Notifications</h4>
                  </div>

                  <ToggleRow
                    title="Task assigned"
                    enabled={settings.notifications.assigned}
                    onToggle={() => updateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, assigned: !prev.notifications.assigned } }))}
                  />
                  <ToggleRow
                    title="Task overdue"
                    enabled={settings.notifications.overdue}
                    onToggle={() => updateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, overdue: !prev.notifications.overdue } }))}
                  />
                </div>

                <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <CalendarDays size={16} className="text-blue-300" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Integrations</h4>
                  </div>

                  <ToggleRow
                    title="Google Calendar"
                    description="Sync assignment due dates to your schedule."
                    enabled={settings.integrations.googleCalendar}
                    onToggle={() => updateSettings(prev => ({ ...prev, integrations: { googleCalendar: !prev.integrations.googleCalendar } }))}
                  />
                </div>

                <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3 lg:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <HardDrive size={16} className="text-orange-300" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Storage</h4>
                  </div>

                  <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-200">{storageConfig.usedLabel} / {storageConfig.limitLabel}</p>
                        <p className="text-xs text-slate-500 mt-1">Free plan storage for files and attachments.</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{storagePercent}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#0A0F1A] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${storagePercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#22C55E]/20 bg-gradient-to-br from-[#162032] via-[#102030] to-[#0F1A2A] p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">Upgrade to PRO</h4>
                    <div className="mt-3 space-y-1.5 text-sm text-slate-300">
                      <p>• Unlimited AI task generation</p>
                      <p>• Advanced analytics</p>
                      <p>• Workspace permissions</p>
                      <p>• 10 GB storage</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 hover:brightness-110 transition"
                  >
                    <Sparkles size={14} />
                    Upgrade
                  </button>
                </div>
              </div>

              <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5">
                <h4 className="font-semibold text-white text-sm mb-4">Free vs Pro</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-[#22C55E]/10">
                        <th className="pb-3 font-medium">Feature</th>
                        <th className="pb-3 font-medium">Free</th>
                        <th className="pb-3 font-medium">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {[
                        ['Theme', '✓', '✓'],
                        ['Notifications', '✓', '✓'],
                        ['Profile', '✓', '✓'],
                        ['Google Calendar', '✓', '✓'],
                        ['AI settings', '✗', '✓'],
                        ['Workspace permissions', '✗', '✓'],
                        ['Analytics', '✗', '✓'],
                        ['Storage', '1 GB', '10 GB'],
                        ['Integrations', '1', 'many'],
                      ].map(row => (
                        <tr key={row[0]} className="border-b border-[#22C55E]/6">
                          <td className="py-3">{row[0]}</td>
                          <td className="py-3">{row[1]}</td>
                          <td className="py-3 text-[#6EE7B7] font-medium">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                  <Palette size={16} className="text-[#22C55E]" />
                </div>
                <h4 className="font-semibold text-white text-sm">General</h4>
              </div>

              <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3">
                <p className="text-sm text-slate-200 mb-1">Workspace name</p>
                <input
                  type="text"
                  value={settings.workspaceName}
                  onChange={(e) => updateSettings(prev => ({ ...prev, workspaceName: e.target.value }))}
                  className="w-full rounded-lg border border-[#22C55E]/10 bg-[#162032] px-3 py-2 text-sm text-white outline-none focus:border-[#22C55E]/35"
                />
              </div>

              <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3 flex items-center justify-between gap-4">
                <div className="pr-2">
                  <p className="text-sm text-slate-200">Theme</p>
                  <p className="text-xs text-slate-500 mt-1">Choose the interface style for your workspace.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20'
                      : 'bg-[#162032] text-slate-300 border border-[#22C55E]/10'
                  }`}
                >
                  {isDark ? <Moon size={14} /> : <Sun size={14} />}
                  {isDark ? 'Dark' : 'Light'}
                </button>
              </div>
            </div>

            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EAB308]/10 flex items-center justify-center">
                  <Bell size={16} className="text-[#EAB308]" />
                </div>
                <h4 className="font-semibold text-white text-sm">Notifications</h4>
              </div>

              <ToggleRow
                title="Task assigned"
                description="Get notified when a task is assigned to you."
                enabled={settings.notifications.assigned}
                onToggle={() => updateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, assigned: !prev.notifications.assigned } }))}
              />
              <ToggleRow
                title="Task overdue"
                description="Receive alerts when deadlines are missed."
                enabled={settings.notifications.overdue}
                onToggle={() => updateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, overdue: !prev.notifications.overdue } }))}
              />
              <ToggleRow
                title="Task comments"
                description="Be notified when someone comments on tracked work."
                enabled={settings.notifications.comments}
                onToggle={() => updateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, comments: !prev.notifications.comments } }))}
              />
            </div>

            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CalendarDays size={16} className="text-blue-300" />
                </div>
                <h4 className="font-semibold text-white text-sm">Integrations</h4>
              </div>

              <ToggleRow
                title="Google Calendar"
                description="Sync due dates and milestone events to your calendar."
                enabled={settings.integrations.googleCalendar}
                onToggle={() => updateSettings(prev => ({ ...prev, integrations: { googleCalendar: !prev.integrations.googleCalendar } }))}
              />
            </div>

            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Shield size={16} className="text-cyan-300" />
                </div>
                <h4 className="font-semibold text-white text-sm">Permissions</h4>
              </div>

              <ToggleRow
                title="Members can invite collaborators"
                description="Allow non-admin members to send invites."
                enabled={settings.permissions.memberCanInvite}
                onToggle={() => updateSettings(prev => ({ ...prev, permissions: { ...prev.permissions, memberCanInvite: !prev.permissions.memberCanInvite } }))}
              />
              <ToggleRow
                title="Members can upload files"
                description="Let project members upload deliverables and references."
                enabled={settings.permissions.memberCanUpload}
                onToggle={() => updateSettings(prev => ({ ...prev, permissions: { ...prev.permissions, memberCanUpload: !prev.permissions.memberCanUpload } }))}
              />
            </div>

            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-violet-300" />
                </div>
                <h4 className="font-semibold text-white text-sm">AI Settings</h4>
              </div>

              <ToggleRow
                title="Auto generate subtasks"
                description="Create suggested subtasks when a new task is added."
                enabled={settings.ai.autoGenerateSubtasks}
                onToggle={() => updateSettings(prev => ({ ...prev, ai: { autoGenerateSubtasks: !prev.ai.autoGenerateSubtasks } }))}
              />
            </div>

            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Settings2 size={16} className="text-emerald-300" />
                </div>
                <h4 className="font-semibold text-white text-sm">Default Task Settings</h4>
              </div>

              <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3">
                <p className="text-sm text-slate-200 mb-2">Default priority</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => updateSettings(prev => ({ ...prev, defaults: { ...prev.defaults, defaultPriority: level } }))}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize border ${settings.defaults.defaultPriority === level ? 'border-[#22C55E]/35 bg-[#22C55E]/12 text-[#6EE7B7]' : 'border-[#22C55E]/10 bg-[#162032] text-slate-400'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3">
                <p className="text-sm text-slate-200 mb-2">Default project view</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['board', 'timeline', 'calendar'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => updateSettings(prev => ({ ...prev, defaults: { ...prev.defaults, defaultView: mode } }))}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize border ${settings.defaults.defaultView === mode ? 'border-[#22C55E]/35 bg-[#22C55E]/12 text-[#6EE7B7]' : 'border-[#22C55E]/10 bg-[#162032] text-slate-400'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#162032]/50 rounded-xl p-4 border border-[#22C55E]/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <HardDrive size={16} className="text-orange-300" />
                </div>
                <h4 className="font-semibold text-white text-sm">Storage</h4>
              </div>

              <div className="rounded-xl border border-[#22C55E]/8 bg-[#0F1A2A]/55 px-3 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-200">{storageConfig.usedLabel} / {storageConfig.limitLabel}</p>
                    <p className="text-xs text-slate-500 mt-1">Available with your current workspace plan.</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{storagePercent}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#0A0F1A] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${storagePercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TriangleAlert size={16} className="text-red-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Danger Zone</h4>
                <p className="text-xs text-slate-500 mt-1">High-impact actions for the workspace and current project.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 hover:bg-red-500/15 transition-colors">
                <Trash2 size={14} />
                Delete Workspace
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-500/15 transition-colors">
                <LogOut size={14} />
                Leave Project
              </button>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#22C55E]/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-[#162032] transition-colors">
            Cancel
          </button>
          <button onClick={saveSettings} className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-semibold shadow-lg shadow-green-500/20 hover:brightness-110 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
