import React, { useState } from 'react';
import { Calendar, AlertTriangle, Clock, CheckCircle, Filter } from 'lucide-react';
import { LecturerGroup } from '../../../data/lecturerMockData';

interface DeadlineCalendarProps {
  groups: LecturerGroup[];
  onSelectGroup: (group: LecturerGroup) => void;
}

const statusColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'on-track': { bg: 'bg-green-500/5',  text: 'text-green-400',  border: 'border-amber-500/25',  dot: 'bg-green-400'  },
  'at-risk':  { bg: 'bg-amber-500/5',  text: 'text-amber-400',  border: 'border-amber-500/20',  dot: 'bg-amber-400'  },
  'overdue':  { bg: 'bg-red-500/5',    text: 'text-red-400',    border: 'border-red-500/20',    dot: 'bg-red-400'    },
};

// Group deadlines by date string
const groupByDeadline = (groups: LecturerGroup[]) => {
  const map: Record<string, LecturerGroup[]> = {};
  groups.forEach(g => {
    if (!map[g.deadline]) map[g.deadline] = [];
    map[g.deadline].push(g);
  });
  // Sort dates (simple alphabetical works for "Mar DD" within same month)
  return Object.entries(map).sort(([a], [b]) => {
    const day = (d: string) => parseInt(d.split(' ')[1] ?? '0');
    return day(a) - day(b);
  });
};

export const DeadlineCalendar: React.FC<DeadlineCalendarProps> = ({ groups, onSelectGroup }) => {
  const [filter, setFilter] = useState<'all' | 'late' | 'review'>('all');

  const filtered = groups.filter(g => {
    if (filter === 'late')   return g.reviewStatus === 'overdue';
    if (filter === 'review') return g.tasks.some(t => t.status === 'ready-for-review');
    return true;
  });

  const byDate = groupByDeadline(filtered);

  const overdueCount = groups.filter(g => g.reviewStatus === 'overdue').length;
  const reviewCount  = groups.flatMap(g => g.tasks).filter(t => t.status === 'ready-for-review').length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-[#22C55E]" />
            Deadline Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">All group deadlines across your classes</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-500" />
          {(['all', 'late', 'review'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filter === f ? 'bg-[#22C55E]/20 text-[#6EE7B7] border border-[#F59E0B]/35 shadow-[0_10px_22px_rgba(34,197,94,0.14)]' : 'bg-[#162032] text-slate-400 border border-transparent hover:border-[#F59E0B]/30 hover:text-white hover:shadow-[0_10px_22px_rgba(10,15,26,0.42)]'}`}>
              {f === 'all' ? 'All Groups' : f === 'late' ? `Late Tasks (${overdueCount})` : `Review (${reviewCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0F1A2A] rounded-xl p-3 border border-[#3A3317] flex items-center gap-3">
          <Clock size={16} className="text-[#22C55E] flex-shrink-0" />
          <div><p className="text-lg font-bold text-white">{groups.length}</p><p className="text-[10px] text-slate-500">Total Deadlines</p></div>
        </div>
        <div className="bg-[#0F1A2A] rounded-xl p-3 border border-red-500/20 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <div><p className="text-lg font-bold text-white">{overdueCount}</p><p className="text-[10px] text-slate-500">Overdue</p></div>
        </div>
        <div className="bg-[#0F1A2A] rounded-xl p-3 border border-amber-500/30 flex items-center gap-3">
          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
          <div><p className="text-lg font-bold text-white">{groups.filter(g => g.progress >= 100).length}</p><p className="text-[10px] text-slate-500">Completed</p></div>
        </div>
      </div>

      {/* Timeline entries */}
      {byDate.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-600">
          <Calendar size={32} className="mb-3" />
          <p className="text-sm">No deadlines match the selected filter.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[3.25rem] top-0 bottom-0 w-px bg-[#22C55E]/10" />

          <div className="space-y-6">
            {byDate.map(([date, dateGroups]) => (
              <div key={date} className="flex gap-5">
                {/* Date badge */}
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="inline-flex flex-col items-center px-2 py-1.5 bg-[#0F1A2A] border border-[#F59E0B]/30 rounded-lg">
                    <span className="text-[10px] text-[#22C55E] font-bold">{date.split(' ')[0]}</span>
                    <span className="text-lg font-black text-white leading-none">{date.split(' ')[1]}</span>
                  </div>
                </div>

                {/* Groups on this date */}
                <div className="flex-1 space-y-2">
                  {dateGroups.map(group => {
                    const sc = statusColors[group.reviewStatus];
                    const gReview = group.tasks.filter(t => t.status === 'ready-for-review').length;
                    return (
                      <button key={group.id} onClick={() => onSelectGroup(group)}
                        className={`w-full text-left px-4 py-3 rounded-xl border ${sc.bg} ${sc.border} hover:border-[#F59E0B]/35 hover:shadow-[0_16px_30px_rgba(10,15,26,0.46)] transition-all duration-200 group`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                            <span className="text-sm font-semibold text-white group-hover:text-[#6EE7B7] transition-colors">{group.name}</span>
                            <span className="text-[10px] text-slate-500">{group.className}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>{group.progress}%</span>
                            <span className="flex items-center gap-1"><Calendar size={9} />{group.deadline}</span>
                            {gReview > 0 && (
                              <span className={`font-semibold ${sc.text} flex items-center gap-0.5`}>
                                <Clock size={9} />{gReview} review
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {group.reviewStatus === 'on-track' ? 'On Track' : group.reviewStatus === 'at-risk' ? 'At Risk' : 'Overdue'}
                            </span>
                          </div>
                        </div>
                        {/* Mini progress */}
                        <div className="mt-2 h-1 bg-[#162032] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${group.reviewStatus === 'overdue' ? 'bg-red-400' : group.reviewStatus === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${group.progress}%` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
