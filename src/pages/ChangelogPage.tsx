import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { motion } from 'motion/react';
import { Sparkles, Zap, Bug, ArrowUp, Star } from 'lucide-react';

interface ChangelogPageProps {
  onNavigate: (page: string) => void;
}

const changelog = [
  {
    version: '2.4.0',
    date: 'February 15, 2026',
    tag: 'Latest',
    tagColor: 'bg-[#22C55E]',
    changes: [
      { type: 'feature', icon: <Sparkles size={14} />, text: 'AI chatbot now supports multi-language conversations' },
      { type: 'feature', icon: <Sparkles size={14} />, text: 'New timeline/Gantt chart view for projects' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'Improved task breakdown algorithm with 30% better accuracy' },
      { type: 'fix', icon: <Bug size={14} />, text: 'Fixed drag-and-drop not updating status on mobile' },
    ],
  },
  {
    version: '2.3.0',
    date: 'January 28, 2026',
    tag: null,
    tagColor: '',
    changes: [
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Team modal redesign with role badges and hover controls' },
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Settings modal with grouped sections and toggle switches' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'Dashboard performance optimization — 40% faster load time' },
      { type: 'fix', icon: <Bug size={14} />, text: 'Fixed notification badge count not updating' },
      { type: 'fix', icon: <Bug size={14} />, text: 'Fixed dark mode contrast issues in task cards' },
    ],
  },
  {
    version: '2.2.0',
    date: 'January 10, 2026',
    tag: null,
    tagColor: '',
    changes: [
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Added AI-powered smart templates for common project types' },
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Export project plans as PDF reports' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'Enhanced search with fuzzy matching across all fields' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'Redesigned landing page with interactive chat demo' },
    ],
  },
  {
    version: '2.1.0',
    date: 'December 20, 2025',
    tag: null,
    tagColor: '',
    changes: [
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Real-time collaboration for team members' },
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Google Calendar integration for syncing deadlines' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'Revamped sidebar navigation with project list' },
      { type: 'fix', icon: <Bug size={14} />, text: 'Fixed task panel closing unexpectedly on mobile' },
    ],
  },
  {
    version: '2.0.0',
    date: 'December 1, 2025',
    tag: 'Major',
    tagColor: 'bg-[#EAB308]',
    changes: [
      { type: 'feature', icon: <Star size={14} />, text: 'Complete UI overhaul with dark glassmorphism theme' },
      { type: 'feature', icon: <Sparkles size={14} />, text: 'AI Planning Assistant chatbot integrated into dashboard' },
      { type: 'feature', icon: <Sparkles size={14} />, text: 'Multi-project support with localStorage persistence' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'Rebuilt from scratch with React 19 + TypeScript + Vite' },
      { type: 'improvement', icon: <ArrowUp size={14} />, text: 'New Tailwind CSS 4 design system with CSS variables' },
    ],
  },
];

const typeColors: Record<string, string> = {
  feature: 'text-[#22C55E] bg-[#22C55E]/10',
  improvement: 'text-[#06B6D4] bg-[#06B6D4]/10',
  fix: 'text-[#EAB308] bg-[#EAB308]/10',
};

const typeLabels: Record<string, string> = {
  feature: 'New',
  improvement: 'Improved',
  fix: 'Fixed',
};

export const ChangelogPage: React.FC<ChangelogPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1A]">
      <Header onNavigate={onNavigate} currentPage="changelog" />
      <main className="flex-1 pt-28 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm font-medium mb-6">
              <Zap size={14} />
              Changelog
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              What's <span className="text-gradient">new</span>
            </h1>
            <p className="text-lg text-slate-400">
              Follow the latest updates and improvements to Vertex.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#22C55E]/30 via-[#22C55E]/10 to-transparent"></div>

            <div className="space-y-12">
              {changelog.map((release, idx) => (
                <motion.div
                  key={release.version}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Dot */}
                  <div className="absolute left-3 top-1.5 w-3.5 h-3.5 rounded-full bg-[#0F1A2A] border-2 border-[#22C55E]/50"></div>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold text-white">v{release.version}</h3>
                    {release.tag && (
                      <span className={`${release.tagColor} text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full`}>
                        {release.tag}
                      </span>
                    )}
                    <span className="text-sm text-slate-500">{release.date}</span>
                  </div>

                  {/* Changes */}
                  <div className="space-y-2.5">
                    {release.changes.map((change, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-3 group">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 ${typeColors[change.type]}`}>
                          {change.icon}
                          {typeLabels[change.type]}
                        </span>
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{change.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
