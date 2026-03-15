import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Flag, Paperclip, MessageSquare, CheckSquare, Trash2, Plus, ChevronDown, Sparkles } from 'lucide-react';
import { Task, User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TaskPanelProps {
  task: Task | null;
  onClose: () => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  assigneeOptions: User[];
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ task, onClose, onDeleteTask, onUpdateTask, assigneeOptions }) => {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [draggingAttachment, setDraggingAttachment] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    setCommentInput('');
    setNewSubtask('');
    setComments([]);
    setAttachments([]);
    setAssigneeOpen(false);
  }, [task?.id]);

  if (!task) return null;

  const deadlineMeta = (() => {
    const due = new Date(task.endDate);
    if (Number.isNaN(due.getTime())) return { label: task.endDate, hint: 'No deadline status' };

    const now = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueDay - nowDay) / 86400000);

    const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays < 0) return { label, hint: 'Overdue', hintClass: 'text-red-300' };
    if (diffDays === 0) return { label, hint: 'Due today', hintClass: 'text-amber-300' };
    if (diffDays === 1) return { label, hint: '1 day left', hintClass: 'text-[#6EE7B7]' };
    return { label, hint: `${diffDays} days left`, hintClass: 'text-[#6EE7B7]' };
  })();

  const mentionMatch = commentInput.match(/@([a-zA-Z]*)$/);
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() ?? '';
  const mentionCandidates = mentionMatch
    ? assigneeOptions.filter(member => member.name.toLowerCase().includes(mentionQuery)).slice(0, 5)
    : [];

  const handleDelete = () => {
    onDeleteTask(task.id);
    onClose();
  };

  const updateTask = (patch: Partial<Task>) => {
    onUpdateTask({ ...task, ...patch });
  };

  const handleGenerateSubtasks = () => {
    if (task.subtasks && task.subtasks.length > 0) return;
    updateTask({
      subtasks: [
        { id: `${task.id}-s1`, title: 'Prepare references', completed: false },
        { id: `${task.id}-s2`, title: 'Create first draft', completed: false },
        { id: `${task.id}-s3`, title: 'Review and finalize', completed: false },
      ],
      status: task.status === 'todo' ? 'in-progress' : task.status,
    });
  };

  const handleSuggestDeadline = () => {
    const base = new Date(task.endDate);
    const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
    safeBase.setDate(safeBase.getDate() + 2);
    updateTask({ endDate: safeBase.toISOString().split('T')[0] });
  };

  const handleRewriteDescription = () => {
    const text = task.description?.trim()
      ? `${task.description.trim()} Refined by AI for clarity and execution.`
      : `Deliver ${task.title.toLowerCase()} with clear scope, quality criteria, and handoff notes.`;
    updateTask({ description: text });
  };

  const handleSetAssignee = (assignee?: User) => {
    updateTask({ assignee });
    setAssigneeOpen(false);
  };

  const handleSuggestAssignee = () => {
    if (assigneeOptions.length === 0) return;
    const currentId = task.assignee?.id;
    const currentIndex = assigneeOptions.findIndex(member => member.id === currentId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % assigneeOptions.length : 0;
    handleSetAssignee(assigneeOptions[nextIndex]);
  };

  const handleSubmitForReview = () => {
    updateTask({ status: 'ready-for-review' });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const subtasks = (task.subtasks || []).map(subtask => (
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    ));

    const total = subtasks.length;
    const completed = subtasks.filter(subtask => subtask.completed).length;
    const nextStatus = total > 0 && completed === total
      ? 'done'
      : completed > 0
        ? 'in-progress'
        : task.status === 'done'
          ? 'todo'
          : task.status;

    updateTask({ subtasks, status: nextStatus });
  };

  const handleAddSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    const subtasks = [...(task.subtasks || []), { id: `${task.id}-s-${Date.now()}`, title, completed: false }];
    updateTask({ subtasks, status: task.status === 'todo' ? 'in-progress' : task.status });
    setNewSubtask('');
  };

  const handleAddAttachments = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const names = Array.from(files).map(file => file.name);
    setAttachments(prev => [...prev, ...names]);
    updateTask({ attachmentCount: (task.attachmentCount ?? 0) + names.length });
  };

  const handleSendComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    setComments(prev => [{ id: `c-${Date.now()}`, text, time: 'Just now' }, ...prev]);
    setCommentInput('');
    updateTask({ commentCount: (task.commentCount ?? 0) + 1 });
  };

  const applyMention = (name: string) => {
    setCommentInput(prev => prev.replace(/@[a-zA-Z]*$/, `@${name} `));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-30"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#101928]/96 backdrop-blur-xl shadow-2xl shadow-black/35 border-l border-white/6 z-40 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between bg-[#0B1220]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'info' : task.status === 'ready-for-review' ? 'warning' : 'default'}>
                {task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In Progress' : task.status === 'ready-for-review' ? 'Ready for Review' : 'Todo'}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">#{task.id}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar src={task.assignee?.avatar} fallback={task.assignee?.name?.charAt(0) || '?'} size="sm" className="w-6 h-6" />
              <span className="text-xs text-slate-300 truncate">{task.assignee?.name || 'Unassigned'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {task.status !== 'ready-for-review' && task.status !== 'done' && (
              <button
                onClick={handleSubmitForReview}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6EE7B7] border border-[#22C55E]/30 bg-[#22C55E]/10 hover:border-[#22C55E]/50 transition-colors"
                title="Submit for review"
              >
                Submit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-slate-500 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
              title="Delete task"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-[#162032] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">{task.title}</h2>

          <div className="space-y-6">
            {/* Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Assignee</label>
                <div className="relative">
                  <button
                    onClick={() => setAssigneeOpen(open => !open)}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#121C2C] border border-white/6 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={task.assignee?.avatar} fallback={task.assignee?.name.charAt(0) || '?'} size="sm" />
                      <span className="text-sm font-medium text-slate-300 truncate">{task.assignee?.name || 'Unassigned'}</span>
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                  </button>
                  {assigneeOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-[#0B1220] shadow-xl z-20 overflow-hidden">
                      {assigneeOptions.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleSetAssignee(member)}
                          className="w-full px-3 py-2 text-sm text-slate-300 hover:bg-[#162032] flex items-center gap-2"
                        >
                          <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-5 h-5" />
                          <span>{member.name}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => handleSetAssignee(undefined)}
                        className="w-full px-3 py-2 text-sm text-slate-400 hover:bg-[#162032] text-left border-t border-white/6"
                      >
                        Unassigned
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Deadline</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121C2C] border border-white/6">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">{deadlineMeta.label}</p>
                    <p className={`text-xs ${deadlineMeta.hintClass || 'text-slate-500'}`}>{deadlineMeta.hint}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Priority</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121C2C] border border-white/6">
                  <Flag size={16} className={
                    task.priority === 'high' ? 'text-red-500' : 
                    task.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  } />
                  <span className="text-sm font-medium text-slate-300 capitalize">
                    {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Description</label>
                <button
                  onClick={handleRewriteDescription}
                  className="text-xs text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors inline-flex items-center gap-1"
                >
                  <Sparkles size={12} /> Generate description with AI
                </button>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed bg-[#0B1220] p-4 rounded-xl border border-white/6">
                {task.description || 'No description for this task.'}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Quick Actions</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={handleGenerateSubtasks} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Generate subtasks
                </button>
                <button onClick={handleSuggestDeadline} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Suggest deadline
                </button>
                <button onClick={handleSuggestAssignee} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Suggest assignee
                </button>
                <button onClick={handleRewriteDescription} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Rewrite description
                </button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Subtasks</label>
                <span className="text-xs text-slate-500">
                  {task.subtasks?.filter(t => t.completed).length || 0}/{task.subtasks?.length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {task.subtasks?.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121C2C] border border-white/6">
                    <button onClick={() => handleToggleSubtask(subtask.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      subtask.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[#22C55E]/10 hover:border-[#22C55E]'
                    }`}>
                      {subtask.completed && <CheckSquare size={12} />}
                    </button>
                    <span className={`text-sm flex-1 ${subtask.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                    }}
                    placeholder="Add subtask"
                    className="flex-1 px-3 py-2 rounded-xl border border-white/6 bg-[#121C2C] text-sm text-white placeholder-slate-500 outline-none focus:border-slate-500/40"
                  />
                  <button onClick={handleAddSubtask} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white px-2 py-1 transition-colors">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Attachments</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleAddAttachments(e.target.files)}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggingAttachment(true);
                }}
                onDragLeave={() => setDraggingAttachment(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggingAttachment(false);
                  handleAddAttachments(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${draggingAttachment ? 'border-[#22C55E]/45 bg-[#22C55E]/8' : 'border-white/8 hover:border-slate-500/40 hover:bg-white/[0.02]'}`}
              >
                <Paperclip size={20} className="text-slate-500 mb-2" />
                <span className="text-xs text-slate-500">Drag & drop files or click to upload</span>
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((fileName, index) => (
                    <div key={`${fileName}-${index}`} className="text-xs text-slate-300 bg-[#121C2C] border border-white/6 rounded-lg px-2.5 py-1.5">
                      {fileName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/6 bg-[#0B1220] flex gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendComment();
              }}
              placeholder="Write a comment..." 
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-white/6 bg-[#162032] focus:border-slate-500/40 focus:ring-2 focus:ring-white/5 outline-none text-sm text-white placeholder-slate-500"
            />
            {mentionCandidates.length > 0 && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-[#0B1220] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                {mentionCandidates.map(member => (
                  <button
                    key={member.id}
                    onClick={() => applyMention(member.name)}
                    className="w-full px-3 py-2 text-sm text-slate-300 hover:bg-[#162032] flex items-center gap-2"
                  >
                    <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-5 h-5" />
                    <span>@{member.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={handleSendComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <MessageSquare size={16} />
            </button>
          </div>
          <Button size="sm" onClick={handleSendComment}>Send</Button>
        </div>

        {comments.length > 0 && (
          <div className="px-4 pb-4 bg-[#0B1220] border-t border-white/6 space-y-2 max-h-36 overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="rounded-xl border border-white/6 bg-[#121C2C] px-3 py-2">
                <p className="text-sm text-slate-200">{comment.text}</p>
                <p className="text-[11px] text-slate-500 mt-1">{comment.time}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
