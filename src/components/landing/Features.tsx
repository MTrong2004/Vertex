import React from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, Layout, Brain, Users, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

interface FeaturesProps {
  onNavigate?: (page: string) => void;
}

export const Features: React.FC<FeaturesProps> = ({ onNavigate }) => {
  const { t } = useLang();

  const features = [
    { icon: <Zap className="w-6 h-6 text-[#22C55E]" />, title: t.features.f1Title, description: t.features.f1Desc },
    { icon: <Clock className="w-6 h-6 text-[#EAB308]" />, title: t.features.f2Title, description: t.features.f2Desc },
    { icon: <Layout className="w-6 h-6 text-[#22C55E]" />, title: t.features.f3Title, description: t.features.f3Desc },
    { icon: <Brain className="w-6 h-6 text-[#EAB308]" />, title: t.features.f4Title, description: t.features.f4Desc },
    { icon: <Users className="w-6 h-6 text-[#22C55E]" />, title: t.features.f5Title, description: t.features.f5Desc },
    { icon: <BarChart3 className="w-6 h-6 text-[#EAB308]" />, title: t.features.f6Title, description: t.features.f6Desc },
  ];

  const steps = [
    { number: '01', title: t.features.step1Title, description: t.features.step1Desc },
    { number: '02', title: t.features.step2Title, description: t.features.step2Desc },
    { number: '03', title: t.features.step3Title, description: t.features.step3Desc },
  ];
  return (
    <section className="bg-[#0A0F1A] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-[#22C55E]/4 via-transparent to-[#EAB308]/3 blur-[120px] pointer-events-none"></div>

      {/* How it works */}
      <div className="container mx-auto px-4 md:px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm font-medium mb-6">
            <CheckCircle2 size={14} />
            {t.features.howItWorks}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t.features.stepsHeading1} <span className="text-gradient">{t.features.stepsHeading2}</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t.features.stepsSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative text-center p-6"
            >
              <div className="text-5xl font-display font-bold text-[#22C55E]/10 mb-3">{step.number}</div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              {idx < 2 && (
                <div className="hidden md:block absolute top-12 -right-3 text-slate-700">
                  <ArrowRight size={20} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t.features.everythingHeading1} <span className="text-gradient">{t.features.everythingHeading2}</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t.features.everythingSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="group"
            >
              <div className="h-full bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-6 hover:border-[#22C55E]/25 hover:shadow-lg hover:shadow-green-500/5 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#162032] flex items-center justify-center border border-[#22C55E]/10 mb-4 group-hover:border-[#22C55E]/30 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
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
              {t.features.ctaHeading}
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              {t.features.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-500/25 text-lg"
              >
                {t.features.ctaBtn} <ArrowRight size={20} />
              </button>
              <button
                onClick={() => onNavigate?.('features')}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-slate-400 hover:text-white font-medium transition-colors"
              >
                {t.features.ctaLink} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
