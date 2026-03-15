import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Users, Calendar, CheckCircle, Clock, AlertTriangle,
  MessageSquare, GitBranch, LayoutGrid, Send, CheckCheck, RotateCcw,
} from 'lucide-react';
import { LecturerGroup, LecturerTask, TaskStatus } from '../../../data/lecturerMockData';

type Tab = 'overview' | 'tasks' | 'timeline' | 'comments';

interface GroupDetailProps {
  group: LecturerGroup;
  onBack: () => void;
}

// ── Task status config ────────────────────────────────────────────────────────
const statusConfig: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  'todo':              { label: 'To Do',             color: 'border-slate-600/50 bg-[#162032]',               dot: 'bg-slate-600' },
  'in-progress':       { label: 'In Progress',       color: 'border-blue-500/20  bg-blue-500/5',              dot: 'bg-blue-400'  },
  'ready-for-review':  { label: 'Ready for Review',  color: 'border-[#22C55E]/30 bg-[#22C55E]/5',             dot: 'bg-[#22C55E]' },
  'approved':          { label: 'Approved',          color: 'border-green-500/20 bg-green-500/5',             dot: 'bg-green-400' },
};

const priorityColors: Record<string, string> = {
  high:   'text-red-400   bg-red-400/10   border-red-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  low:    'text-slate-400 bg-slate-700    border-slate-600',
};

// ── Kanban Task Card ──────────────────────────────────────────────────────────
const KanbanCard: React.FC<{
  task: LecturerTask;
  onApprove?: (id: string) => void;
  onRequestChanges?: (id: string) => void;
}> = ({ task, onApprove, onRequestChanges }) => (
  <div className={`rounded-lg p-3 border ${statusConfig[task.status].color} mb-2`}>
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-xs font-medium text-white leading-snug">{task.title}</p>
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${priorityColors[task.priority]}`}>
        {task.priority}
      </span>
    </div>
    <div className="flex items-center justify-between text-[10px] text-slate-500">
      <span className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-[#162032] border border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-400">
          {task.assignee[0]}
        </div>
        {task.assignee}
      </span>
      <span className="flex items-center gap-0.5"><Calendar size={9} />{task.deadline}</span>
    </div>

    {/* Approve / Request Changes buttons */}
    {task.status === 'ready-for-review' && (
      <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-[#22C55E]/10">
        <button onClick={() => onApprove?.(task.id)}
          className="flex-1 flex items-center justify-center gap-1 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-300 text-[10px] font-semibold rounded-md border border-green-500/20 hover:border-green-400/40 hover:shadow-[0_10px_22px_rgba(34,197,94,0.18)] transition-all duration-200">
          <CheckCheck size={10} />Approve
        </button>
        <button onClick={() => onRequestChanges?.(task.id)}
          className="flex-1 flex items-center justify-center gap-1 py-1 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#6EE7B7] text-[10px] font-semibold rounded-md border border-[#22C55E]/20 hover:border-[#6EE7B7]/40 hover:shadow-[0_10px_22px_rgba(34,197,94,0.18)] transition-all duration-200">
          <RotateCcw size={10} />Request Changes
        </button>
      </div>
    )}
  </div>
);

// ── Kanban Column ─────────────────────────────────────────────────────────────
const KanbanColumn: React.FC<{
  status: TaskStatus;
  tasks: LecturerTask[];
  onApprove: (id: string) => void;
  onRequestChanges: (id: string) => void;
}> = ({ status, tasks, onApprove, onRequestChanges }) => (
  <div className="flex flex-col min-w-[200px] flex-1">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`} />
      <span className="text-xs font-semibold text-slate-300">{statusConfig[status].label}</span>
      <span className="ml-auto text-[10px] text-slate-600 bg-[#162032] px-1.5 py-0.5 rounded-full">{tasks.length}</span>
    </div>
    <div className="flex-1 min-h-20">
      {tasks.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-lg p-3 text-center">
          <p className="text-[10px] text-slate-700">No tasks</p>
        </div>
      ) : (
        tasks.map(task => (
          <KanbanCard key={task.id} task={task} onApprove={onApprove} onRequestChanges={onRequestChanges} />
        ))
      )}
    </div>
  </div>
);

// ── Tab: Overview ─────────────────────────────────────────────────────────────
const OverviewTab: React.FC<{ group: LecturerGroup }> = ({ group }) => (
  <div className="p-6 space-y-5">
    <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#1e3a2e]">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Description</h4>
      <p className="text-sm text-slate-300 leading-relaxed">{group.description}</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Members */}
      <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#1e3a2e]">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users size={11} />Members ({group.members})
        </h4>
        <div className="space-y-2">
          {group.avatarInitials.map((init, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#162032] border border-[#22C55E]/10 flex items-center justify-center text-xs font-bold text-[#22C55E]">
                {init[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-white">Student {init}</p>
                <p className="text-[10px] text-slate-500">Member</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#1e3a2e] space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle size={11} />Progress
        </h4>
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-400">Overall</span>
            <span className="text-xs font-bold text-white">{group.progress}%</span>
          </div>
          <div className="h-2 bg-[#162032] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${group.reviewStatus === 'overdue' ? 'bg-red-400' : group.reviewStatus === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${group.progress}%` }} />
          </div>
        </div>
        <div className="pt-2 border-t border-[#162032] grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-600 text-[10px]">Approved</p>
            <p className="text-green-400 font-semibold">{group.tasks.filter(t => t.status === 'approved').length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px]">In Review</p>
            <p className="text-amber-400 font-semibold">{group.tasks.filter(t => t.status === 'ready-for-review').length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px]">In Progress</p>
            <p className="text-blue-400 font-semibold">{group.tasks.filter(t => t.status === 'in-progress').length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px]">To Do</p>
            <p className="text-slate-400 font-semibold">{group.tasks.filter(t => t.status === 'todo').length}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Deadline */}
    <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#1e3a2e] flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
        <Calendar size={16} className="text-[#22C55E]" />
      </div>
      <div>
        <p className="text-xs text-slate-500">Submission Deadline</p>
        <p className="text-sm font-bold text-white">{group.deadline}</p>
      </div>
      {group.reviewStatus === 'overdue' && (
        <span className="ml-auto flex items-center gap-1 text-xs text-red-400 font-semibold"><AlertTriangle size={12} />Overdue</span>
      )}
    </div>
  </div>
);

// ── Tab: Tasks (Kanban) ───────────────────────────────────────────────────────
const TasksTab: React.FC<{ group: LecturerGroup }> = ({ group }) => {
  const [tasks, setTasks] = useState<LecturerTask[]>(group.tasks);

  const handleApprove = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));
  };
  const handleRequestChanges = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'in-progress' } : t));
  };

  const columns: TaskStatus[] = ['todo', 'in-progress', 'ready-for-review', 'approved'];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-1 rounded-lg text-[#22C55E] font-medium">Read-only — approve or request changes below</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(status => (
          <KanbanColumn key={status} status={status}
            tasks={tasks.filter(t => t.status === status)}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
          />
        ))}
      </div>
    </div>
  );
};

// ── Tab: Timeline ─────────────────────────────────────────────────────────────
const TimelineTab: React.FC<{ group: LecturerGroup }> = ({ group }) => (
  <div className="p-6">
    <div className="relative">
      {/* vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[#22C55E]/10" />
      <div className="space-y-6">
        {group.timeline.map((item, i) => (
          <div key={i} className="flex gap-5 relative">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10 border-2 ${item.done ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[#162032] border-slate-600 text-slate-600'}`}>
              {item.done ? <CheckCircle size={14} /> : <Clock size={14} />}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.week}</span>
                <span className="text-[11px] text-slate-600 flex items-center gap-1"><Calendar size={9} />{item.date}</span>
              </div>
              <p className={`text-sm font-semibold ${item.done ? 'text-white' : 'text-slate-400'}`}>{item.milestone}</p>
              <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${item.done ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                {item.done ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Tab: Comments ─────────────────────────────────────────────────────────────
const CommentsTab: React.FC<{ group: LecturerGroup }> = ({ group }) => {
  const [comments, setComments]   = useState(group.comments);
  const [newComment, setNewComment] = useState('');

  const handleSend = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: `c${Date.now()}`, author: 'Dr. Tran Van Minh', role: 'lecturer',
      text: newComment.trim(), time: 'Just now',
    }]);
    setNewComment('');
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      <div className="space-y-3 flex-1 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className={`flex gap-3 ${c.role === 'lecturer' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${c.role === 'lecturer' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-[#162032] text-slate-400 border border-slate-700'}`}>
              {c.author[0]}
            </div>
            <div className={`max-w-xs ${c.role === 'lecturer' ? 'items-end' : ''} flex flex-col`}>
              <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${c.role === 'lecturer' ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-emerald-100 rounded-tr-sm' : 'bg-[#162032] border border-slate-700 text-slate-300 rounded-tl-sm'}`}>
                {c.taskRef && <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><GitBranch size={8} />{c.taskRef}</p>}
                {c.text}
              </div>
              <p className="text-[10px] text-slate-600 mt-1 px-1">{c.author} · {c.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="flex gap-2 pt-3 border-t border-[#22C55E]/10">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Leave feedback for this group..."
          className="flex-1 px-3 py-2 bg-[#162032] border border-[#1e3a2e] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22C55E]/40"
        />
        <button onClick={handleSend}
          className="px-3 py-2 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white rounded-lg border border-[#BBF7D0]/30 hover:border-[#DCFCE7]/70 hover:shadow-[0_14px_30px_rgba(34,197,94,0.3)] transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold flex-shrink-0">
          <Send size={12} />Send
        </button>
      </div>
    </div>
  );
};

// ── GroupDetail ───────────────────────────────────────────────────────────────
export const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',  icon: <LayoutGrid size={13} />     },
    { id: 'tasks',     label: 'Tasks',     icon: <CheckCircle size={13} />    },
    { id: 'timeline',  label: 'Timeline',  icon: <GitBranch size={13} />      },
    { id: 'comments',  label: 'Comments',  icon: <MessageSquare size={13} />  },
  ];

  const reviewCount = group.tasks.filter(t => t.status === 'ready-for-review').length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Group Header */}
      <div className="px-6 py-4 bg-[#0F1A2A] border-b border-[#22C55E]/10 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#6EE7B7] transition-colors duration-200 mb-3">
          <ArrowLeft size={13} />Back to groups
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">{group.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{group.className}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users size={13} className="text-[#22C55E]" />
              <span>{group.members} members</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={13} className="text-[#22C55E]" />
              <span>Deadline: {group.deadline}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle size={13} className="text-[#22C55E]" />
              <span>{group.progress}% complete</span>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center gap-1">
                <Clock size={11} />{reviewCount} awaiting review
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[#162032] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${group.reviewStatus === 'overdue' ? 'bg-red-400' : group.reviewStatus === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}`}
            style={{ width: `${group.progress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#22C55E]/10 bg-[#0F1A2A] px-6 flex-shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? 'border-[#22C55E] text-[#6EE7B7]' : 'border-transparent text-slate-500 hover:text-white hover:border-[#22C55E]/30'}`}>
            {tab.icon}{tab.label}
            {tab.id === 'tasks' && reviewCount > 0 && (
              <span className="ml-0.5 w-4 h-4 bg-[#22C55E]/20 text-[#22C55E] rounded-full text-[9px] font-black flex items-center justify-center">{reviewCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OverviewTab group={group} />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TasksTab group={group} />
            </motion.div>
          )}
          {activeTab === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TimelineTab group={group} />
            </motion.div>
          )}
          {activeTab === 'comments' && (
            <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <CommentsTab group={group} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
