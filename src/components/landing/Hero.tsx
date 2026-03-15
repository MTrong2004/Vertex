import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CalendarClock, Users, ListTodo, Sparkles, LayoutDashboard, BarChart3, Clock } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

interface HeroProps {
  onStart: () => void;
  onDemo: () => void;
}

const quickIcons = [
  { icon: <ListTodo size={16} />, tooltip: 'Tasks' },
  { icon: <BarChart3 size={16} />, tooltip: 'Analytics' },
  { icon: <Clock size={16} />, tooltip: 'Timeline' },
  { icon: <Users size={16} />, tooltip: 'Team' },
  { icon: <Sparkles size={16} />, tooltip: 'AI' },
];

export const Hero: React.FC<HeroProps> = ({ onStart, onDemo: _onDemo }) => {
  const [promptValue, setPromptValue] = useState('');
  const { t } = useLang();

  const categories = [
    { label: t.hero.cat1, icon: <CalendarClock size={14} />, prompt: t.hero.prompt1 },
    { label: t.hero.cat2, icon: <Users size={14} />,         prompt: t.hero.prompt2 },
    { label: t.hero.cat3, icon: <LayoutDashboard size={14} />, prompt: t.hero.prompt3 },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (promptValue.trim()) {
      onStart();
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col bg-[#0A0F1A] overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-br from-[#22C55E]/6 via-[#06B6D4]/8 to-[#EAB308]/4 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[45%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#06B6D4]/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[25%] w-[350px] h-[350px] rounded-full bg-[#EAB308]/4 blur-[100px] pointer-events-none"></div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pt-28 pb-16 relative z-10">
        
        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white text-center leading-[1.05] mb-5 max-w-4xl"
        >
          {t.hero.heading1}{' '}
          <span className="text-gradient">{t.hero.heading2}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg md:text-xl text-slate-400 text-center mb-10 max-w-xl"
        >
          <span className="text-gradient">{t.hero.subtitle1}</span> {t.hero.subtitle2}
        </motion.p>

        {/* Prompt input box with gradient border */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="w-full max-w-2xl mb-8"
        >
          <div className="relative group">
            {/* Gradient border glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#06B6D4] via-[#22C55E]/40 to-[#EAB308] opacity-60 group-hover:opacity-80 transition-opacity blur-[1px]"></div>
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#06B6D4]/30 via-[#22C55E]/15 to-[#EAB308]/30 blur-xl opacity-50 pointer-events-none"></div>
            
            <div className="relative bg-[#0F1A2A]/90 backdrop-blur-xl rounded-2xl overflow-hidden">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={t.hero.placeholder}
                  rows={3}
                  className="w-full px-6 pt-5 pb-12 bg-transparent text-white placeholder-slate-500 text-base outline-none resize-none"
                />
                <div className="absolute bottom-3 right-3">
                  <button
                    type="submit"
                    disabled={!promptValue.trim()}
                    className="p-2.5 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white rounded-xl hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Category tabs + quick icons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-16"
        >
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setPromptValue(cat.prompt)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-slate-400 bg-[#0F1A2A]/60 border border-[#22C55E]/10 hover:border-[#22C55E]/30 hover:text-white hover:bg-[#162032] transition-all backdrop-blur-sm"
            >
              <span className="text-slate-500">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
          <div className="w-px h-6 bg-[#22C55E]/10 mx-1 hidden sm:block"></div>
          {quickIcons.map((item) => (
            <button
              key={item.tooltip}
              title={item.tooltip}
              className="p-2 rounded-full text-slate-500 hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition-all"
            >
              {item.icon}
            </button>
          ))}
          <span className="text-slate-600 text-sm ml-1">100+ templates</span>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 mb-8"
        >
          <span className="hidden sm:block"><strong className="text-white">10K+</strong> {t.hero.stats1projects}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block"></span>
          <span><strong className="text-white">2,500+</strong> {t.hero.stats2users}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span>{t.hero.stats3uni}</span>
        </motion.div>

        {/* Product mockup preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          className="w-full max-w-4xl mx-auto px-4"
        >
          {/* Browser chrome */}
          <div className="rounded-2xl overflow-hidden border border-[#22C55E]/15 shadow-2xl shadow-green-500/5">
            {/* Title bar */}
            <div className="bg-[#0F1A2A] px-4 py-3 flex items-center gap-2 border-b border-[#22C55E]/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-[#22C55E]/60"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-[#162032] rounded-md px-3 py-1 text-xs text-slate-500 max-w-xs mx-auto text-center">app.projectplan.ai/dashboard</div>
              </div>
            </div>
            {/* Dashboard wireframe */}
            <div className="bg-[#0A0F1A] p-4 grid grid-cols-4 gap-3 min-h-[220px]">
              {/* Sidebar mock */}
              <div className="col-span-1 bg-[#0F1A2A] rounded-xl p-3 flex flex-col gap-2.5 border border-[#22C55E]/8">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#EAB308] mb-1"></div>
                {[40, 60, 50, 35].map((w, i) => (
                  <div key={i} className={`h-2 rounded-full bg-[#162032] ${i === 1 ? 'bg-[#22C55E]/30' : ''}`} style={{ width: `${w}%` }}></div>
                ))}
                <div className="mt-auto space-y-2">
                  {[55, 40].map((w, i) => (
                    <div key={i} className="h-2 rounded-full bg-[#162032]" style={{ width: `${w}%` }}></div>
                  ))}
                </div>
              </div>
              {/* Kanban columns mock */}
              <div className="col-span-3 grid grid-cols-3 gap-2">
                {[{ color: 'bg-slate-500/40', count: 3, label: 'To Do' }, { color: 'bg-blue-500/40', count: 2, label: 'In Progress' }, { color: 'bg-[#22C55E]/40', count: 4, label: 'Done' }].map((col) => (
                  <div key={col.label} className="bg-[#0F1A2A] rounded-xl p-2.5 border border-[#22C55E]/8 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                      <div className="h-2 rounded-full bg-[#162032] flex-1"></div>
                      <div className="text-[10px] text-slate-600 font-mono">{col.count}</div>
                    </div>
                    {Array(col.count).fill(0).map((_, i) => (
                      <div key={i} className="bg-[#162032] rounded-lg p-2 space-y-1.5">
                        <div className="h-1.5 rounded bg-[#1E3A2A]" style={{ width: `${60 + i * 10}%` }}></div>
                        <div className="h-1.5 rounded bg-[#1E3A2A] w-3/4"></div>
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="h-1.5 w-8 rounded bg-[#22C55E]/20"></div>
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#22C55E]/40 to-[#EAB308]/40"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow below mockup */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#22C55E]/30 to-transparent mt-0"></div>
        </motion.div>
      </div>
    </section>
  );
};
