import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { motion } from 'motion/react';
import { 
  Sparkles, ArrowRight, Kanban, WandSparkles,
  Users, FolderOpen, Shield, TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useLang } from '../contexts/LanguageContext';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  const { t } = useLang();

  const featureCards = [
    {
      icon: Kanban,
      title: 'Board, Timeline, Calendar in one flow',
      description: 'Switch planning modes instantly without losing context across tasks, milestones, and deadlines.',
      accent: 'from-[#22C55E]/10 to-[#84CC16]/6',
      border: 'border-[#22C55E]/16',
      bullets: ['Kanban for execution', 'Timeline for sequencing', 'Calendar for due dates'],
    },
    {
      icon: WandSparkles,
      title: 'AI Planner with practical output',
      description: 'Turn project briefs into actionable steps and subtasks you can push directly into your board.',
      accent: 'from-[#EAB308]/10 to-[#84CC16]/6',
      border: 'border-[#EAB308]/16',
      bullets: ['Step-by-step task generation', 'Reusable planning defaults', 'Fast iteration loop'],
    },
    {
      icon: Users,
      title: 'Team collaboration that stays clear',
      description: 'Invite members by code or email, assign roles, and keep project responsibilities visible.',
      accent: 'from-[#22C55E]/9 to-[#84CC16]/6',
      border: 'border-[#84CC16]/16',
      bullets: ['Invite workflow built in', 'Role-aware workspace controls', 'Member activity visibility'],
    },
    {
      icon: FolderOpen,
      title: 'Project files built into delivery',
      description: 'Upload, preview, rename, download, and organize assets right inside the project workspace.',
      accent: 'from-[#22C55E]/9 to-[#EAB308]/6',
      border: 'border-[#22C55E]/16',
      bullets: ['Grid and list views', 'Quick preview workflow', 'Storage-aware planning'],
    },
    {
      icon: TrendingUp,
      title: 'Insights made for student teams',
      description: 'Track progress, workload pressure, risks, and momentum so teams can adjust early.',
      accent: 'from-[#22C55E]/10 to-[#EAB308]/6',
      border: 'border-[#22C55E]/16',
      bullets: ['Progress and workload signals', 'Risk-focused summaries', 'Productivity trend snapshots'],
    },
    {
      icon: Shield,
      title: 'Personal + Workspace settings split',
      description: 'Keep personal preferences simple while exposing advanced controls for PRO and leaders.',
      accent: 'from-[#EAB308]/10 to-[#22C55E]/6',
      border: 'border-[#22C55E]/16',
      bullets: ['Clean free-plan settings', 'PRO workspace governance', 'Storage and safety controls'],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1A]">
      <Header onNavigate={onNavigate} currentPage="features" />
      
      <main className="flex-1 pt-28 pb-20">
        <div className="container relative mx-auto overflow-hidden px-4 md:px-6">
          {/* Ambient moving gradient blobs */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#22C55E]/18 blur-3xl"
            animate={{ x: [0, 22, -8, 0], y: [0, -14, 10, 0], scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute right-[-5.5rem] top-36 h-80 w-80 rounded-full bg-[#EAB308]/14 blur-3xl"
            animate={{ x: [0, -16, 12, 0], y: [0, 12, -10, 0], scale: [1, 0.94, 1.06, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[32%] top-[28rem] h-64 w-64 rounded-full bg-[#84CC16]/10 blur-3xl"
            animate={{ x: [0, 18, -14, 0], y: [0, 10, -8, 0], scale: [1, 1.05, 0.95, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Hero section */}
          <div className="relative z-10 mx-auto mb-16 max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/35 bg-gradient-to-r from-[#22C55E]/12 to-[#EAB308]/10 px-4 py-1.5 text-sm font-medium text-[#6EE7B7]">
                <Sparkles size={14} />
                {t.features.fpBadge}
              </div>

              <h1 className="mx-auto max-w-5xl text-4xl font-display font-bold leading-[1.04] tracking-tight text-white md:text-6xl lg:text-7xl">
                <span className="block">{t.features.fpHeroHeading1}</span>
                <span className="block mt-1.5">
                  <span className="bg-gradient-to-r from-[#4ADE80] via-[#A3E635] to-[#EAB308] bg-clip-text text-transparent">{t.features.fpHeroHeading2}</span>
                  <span className="text-white/95"> {t.features.fpHeroSuffix}</span>
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-slate-300/90 md:text-[1.35rem]">
                {t.features.fpHeroSubtitle}
              </p>
            </motion.div>
          </div>

          {/* Features grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group"
              >
                <div className={`relative h-full overflow-hidden rounded-2xl border ${feature.border} bg-[#0D1724]/90 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D9F99D]/24 hover:shadow-[0_14px_30px_rgba(10,18,24,0.45)]`}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-40`} />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(217,249,157,0.08),transparent_42%),radial-gradient(circle_at_84%_78%,rgba(250,204,21,0.07),transparent_42%)]" />
                  <div className="relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D9F99D]/22 bg-[#14253A]/78 text-[#86EFAC] transition-colors group-hover:border-[#D9F99D]/50 group-hover:text-[#D9F99D]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300">{feature.description}</p>
                    <div className="mt-4 space-y-1.5">
                      {feature.bullets.map((point) => (
                        <p key={point} className="text-xs text-slate-400">• {point}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#EAB308]/10 rounded-3xl border border-[#22C55E]/15 p-12 backdrop-blur-xl max-w-3xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                {t.features.fpCtaHeading}
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                {t.features.fpCtaSubtitle}
              </p>
              <Button size="lg" onClick={() => onNavigate('dashboard')} icon={<ArrowRight size={20} />}>
                {t.features.fpCtaBtn}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};