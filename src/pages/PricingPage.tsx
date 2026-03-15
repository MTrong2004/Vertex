import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useToast } from '../components/ui/Toast';
import { Check, X, Minus, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

const plans = [
  {
    name: 'Free',
    description: 'For individuals & small teams',
    price: '$0',
    period: '/month',
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Student Pro',
    description: 'For capstone projects & teams',
    price: '$5',
    period: '/month',
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Lecturer',
    description: 'For teachers who supervise student projects',
    price: '$15',
    period: '/month',
    cta: 'Start Teaching',
    highlight: false,
  },
];

type FeatureValue = boolean | string;

interface FeatureRow {
  name: string;
  free: FeatureValue;
  pro: FeatureValue;
  enterprise: FeatureValue;
}

interface FeatureCategory {
  category: string;
  features: FeatureRow[];
}

const featureCategories: FeatureCategory[] = [
  {
    category: 'Project Management',
    features: [
      { name: 'Dashboard overview', free: true, pro: true, enterprise: true },
      { name: 'Kanban board view', free: true, pro: true, enterprise: true },
      { name: 'Timeline view', free: true, pro: true, enterprise: true },
      { name: 'Calendar view', free: true, pro: true, enterprise: true },
      { name: 'Task status workflow', free: true, pro: true, enterprise: true },
      { name: 'Project members management', free: true, pro: true, enterprise: true },
      { name: 'Project files (upload, preview, download)', free: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'AI Features',
    features: [
      { name: 'AI planner tab', free: true, pro: true, enterprise: true },
      { name: 'Generate task plan from project brief', free: true, pro: true, enterprise: true },
      { name: 'Insights dashboard (progress, workload, risk)', free: true, pro: true, enterprise: true },
      { name: 'Workspace AI settings', free: false, pro: true, enterprise: true },
      { name: 'Lecturer AI group insights panel', free: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Team & Collaboration',
    features: [
      { name: 'In-app notifications', free: true, pro: true, enterprise: true },
      { name: 'Invite by code / email / role', free: true, pro: true, enterprise: true },
      { name: 'Workspace switcher in sidebar', free: false, pro: true, enterprise: true },
      { name: 'Workspace permissions controls', free: false, pro: true, enterprise: true },
      { name: 'Danger zone actions (leave/delete workspace)', free: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Settings & Storage',
    features: [
      { name: 'Personal settings (profile, theme, notifications)', free: true, pro: true, enterprise: true },
      { name: 'Workspace settings tab', free: false, pro: true, enterprise: true },
      { name: 'Google Calendar integration toggle', free: true, pro: true, enterprise: true },
      { name: 'Storage quota', free: '1 GB', pro: '10 GB', enterprise: '50 GB' },
    ],
  },
  {
    category: 'Lecturer Tools',
    features: [
      { name: 'Lecturer dashboard', free: false, pro: false, enterprise: true },
      { name: 'Manage student groups', free: false, pro: false, enterprise: true },
      { name: 'Group detail with task review', free: false, pro: false, enterprise: true },
      { name: 'Deadline overview across classes', free: false, pro: false, enterprise: true },
      { name: 'Class-based filtering and progress tracking', free: false, pro: false, enterprise: true },
    ],
  },
];

const renderCellValue = (value: FeatureValue) => {
  if (value === true) return <Check size={16} className="text-[#22C55E] mx-auto" />;
  if (value === false) return <X size={14} className="text-slate-600 mx-auto" />;
  return <span className="text-slate-300 text-sm">{value}</span>;
};

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleChoosePlan = (planName: string) => {
    if (planName === 'Free') {
      localStorage.setItem('userPlan', 'free');
      showToast('Free plan activated! Redirecting to dashboard...');
      setTimeout(() => onNavigate('dashboard'), 800);
    } else if (planName === 'Lecturer') {
      localStorage.setItem('userPlan', 'lecturer');
      showToast('Welcome lecturer! Redirecting to Lecturer dashboard...', 'info');
      setTimeout(() => onNavigate('lecturer'), 800);
    } else {
      localStorage.setItem('userPlan', 'student_pro');
      showToast(`${planName} plan selected! Redirecting to dashboard...`);
      setTimeout(() => onNavigate('dashboard'), 800);
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (billingCycle === 'yearly') {
      if (plan.price === '$5') return '$4';
      if (plan.price === '$15') return '$12';
    }
    return plan.price;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1A]">
      <Header onNavigate={onNavigate} currentPage="pricing" />
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <div className="relative overflow-hidden px-4 pt-14 pb-10 md:pt-16 md:pb-12">
          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center" aria-hidden>
            <div className="relative h-[250px] w-[min(980px,95%)]">
              <div className="absolute inset-0 rounded-[30px] border border-[#22C55E]/15 bg-gradient-to-br from-[#0F1A2A]/70 via-[#11263D]/55 to-[#0A1220]/65 shadow-[0_40px_110px_rgba(34,197,94,0.16)] backdrop-blur-[2px]" />
              <div className="absolute inset-5 rounded-[22px] border border-[#22C55E]/12 bg-[#0B1728]/70 overflow-hidden">
                <div className="h-9 border-b border-[#22C55E]/10 bg-[#102236]/60 px-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308]/50" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500/60" />
                  <div className="ml-3 h-2.5 w-36 rounded-full bg-slate-400/20" />
                </div>
                <div className="grid grid-cols-[175px_1fr] gap-3 p-3.5 h-[calc(100%-2.25rem)]">
                  <div className="rounded-xl border border-[#22C55E]/10 bg-[#0F2236]/55 p-3">
                    <p className="text-[9px] font-semibold text-[#6EE7B7]/80 tracking-wide uppercase">Workspace</p>
                    <div className="mt-2 h-7 rounded-md bg-[#22C55E]/16" />
                    <div className="mt-3 space-y-1.5">
                      <div className="h-6 rounded-md bg-slate-400/14" />
                      <div className="h-6 rounded-md bg-slate-400/14" />
                      <div className="h-6 rounded-md bg-slate-400/14" />
                    </div>
                    <div className="mt-3 rounded-lg border border-[#22C55E]/12 bg-[#0C1B2D]/70 p-2">
                      <div className="h-2 w-14 rounded-full bg-slate-300/25" />
                      <div className="mt-2 h-5 rounded-md bg-[#EAB308]/12" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-[#22C55E]/10 bg-[#11273E]/62 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-slate-200">Poster Project</p>
                        <div className="h-4 w-16 rounded-full bg-[#22C55E]/18" />
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="h-1.5 w-11 rounded-full bg-[#22C55E]/35" />
                        <div className="h-1.5 w-11 rounded-full bg-[#22C55E]/18" />
                        <div className="h-1.5 w-11 rounded-full bg-[#22C55E]/18" />
                        <div className="h-1.5 w-11 rounded-full bg-[#22C55E]/18" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="rounded-xl border border-[#22C55E]/12 bg-[#12324C]/55 p-2.5">
                        <div className="h-2 w-10 rounded-full bg-slate-200/35" />
                        <div className="mt-2 h-5 rounded-md bg-slate-300/18" />
                        <div className="mt-1.5 h-5 rounded-md bg-slate-300/14" />
                      </div>
                      <div className="rounded-xl border border-[#22C55E]/12 bg-[#1A3851]/52 p-2.5">
                        <div className="h-2 w-14 rounded-full bg-slate-200/35" />
                        <div className="mt-2 h-5 rounded-md bg-[#22C55E]/18" />
                        <div className="mt-1.5 h-5 rounded-md bg-slate-300/14" />
                      </div>
                      <div className="rounded-xl border border-[#22C55E]/12 bg-[#2B3F53]/48 p-2.5">
                        <div className="h-2 w-8 rounded-full bg-slate-200/35" />
                        <div className="mt-2 h-5 rounded-md bg-[#EAB308]/18" />
                        <div className="mt-1.5 h-5 rounded-md bg-slate-300/14" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#22C55E]/10 bg-[#10263D]/58 p-2.5">
                      <p className="text-[9px] uppercase tracking-wide text-slate-400">Timeline</p>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-400/16 overflow-hidden">
                        <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#22C55E]/70 to-[#EAB308]/65" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-[30px] bg-gradient-to-b from-transparent via-[#0A0F1A]/32 to-[#0A0F1A]/88" />
              <div className="absolute -inset-x-4 -inset-y-3 rounded-[38px] bg-[#0A0F1A]/45 blur-2xl" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center pt-8 md:pt-10"
          >
            <h1 className="mt-6 text-4xl font-bold text-white md:text-5xl">
              Choose your <span className="text-gradient">plan</span>
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-slate-400">
              Start free and scale as your team grows. All plans include core features.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center justify-center gap-3 rounded-full border border-[#22C55E]/10 bg-[#0F1A2A]/80 p-1 backdrop-blur-xl">
              <motion.button
                onClick={() => setBillingCycle('monthly')}
                whileHover={billingCycle !== 'monthly' ? { scale: 1.04 } : undefined}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
                className={`transform-gpu will-change-transform px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out ${billingCycle === 'monthly' ? 'bg-[#22C55E] text-white shadow-lg shadow-green-500/25' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Monthly
              </motion.button>
              <motion.button
                onClick={() => setBillingCycle('yearly')}
                whileHover={billingCycle !== 'yearly' ? { scale: 1.04 } : undefined}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
                className={`transform-gpu will-change-transform px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-[#22C55E] text-white shadow-lg shadow-green-500/25' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Yearly
                <span className="text-[10px] bg-[#EAB308]/20 text-[#EAB308] px-2 py-0.5 rounded-full font-bold">-20%</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Plans Cards */}
        <div className="mx-auto max-w-6xl px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative rounded-2xl border p-8 flex flex-col bg-[#0F1A2A]/70 backdrop-blur-xl transition-[border-color,box-shadow] duration-200 ${
                  plan.highlight
                    ? 'border-[#22C55E]/40 shadow-[0_0_40px_rgba(34,197,94,0.12)] md:-translate-y-3'
                    : 'border-[#22C55E]/10 hover:border-[#22C55E]/30 hover:shadow-[0_12px_32px_rgba(34,197,94,0.09)]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{getPrice(plan)}</span>
                  <span className="text-slate-400">{plan.period}</span>
                  {billingCycle === 'yearly' && plan.price !== '$0' && (
                    <span className="block text-xs text-slate-500 mt-1">billed annually</span>
                  )}
                </div>
                <motion.button
                  onClick={() => handleChoosePlan(plan.name)}
                  whileHover={plan.highlight ? { y: -2 } : { y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.65 }}
                  className={`transform-gpu will-change-transform w-full py-3 rounded-xl font-semibold transition-all duration-300 ease-out text-sm ${
                    plan.highlight
                      ? 'pricing-cta-highlight group relative isolate overflow-hidden bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white shadow-lg shadow-green-500/20 hover:shadow-[0_14px_36px_rgba(245,158,11,0.38)] hover:brightness-105'
                      : 'bg-[#162032] text-slate-300 border border-[#22C55E]/12 hover:text-white hover:bg-gradient-to-r hover:from-[#22C55E] hover:to-[#EAB308] hover:border-[#F0FDF4]/80 hover:brightness-110 hover:saturate-125 hover:shadow-[0_16px_36px_rgba(34,197,94,0.34)]'
                  }`}
                >
                  {plan.highlight ? (
                    <>
                      <span className="absolute inset-0 rounded-xl bg-[#F59E0B] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="pricing-cta-sheen" />
                      <span className="pricing-cta-sparkle pricing-cta-sparkle-1" />
                      <span className="pricing-cta-sparkle pricing-cta-sparkle-2" />
                      <span className="pricing-cta-sparkle pricing-cta-sparkle-3" />
                      <span className="relative z-10">{plan.cta}</span>
                    </>
                  ) : (
                    plan.cta
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Compare all features</h2>
              <p className="text-slate-400">Detailed breakdown of what's included in each plan</p>
            </div>

            <div className="bg-[#0F1A2A]/50 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 overflow-x-auto">
              {/* Table header */}
              <div className="grid grid-cols-4 border-b border-[#22C55E]/10 bg-[#0F1A2A]/80 min-w-[600px]">
                <div className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-500">Features</span>
                </div>
                {plans.map((plan) => (
                  <div key={plan.name} className="px-4 py-4 text-center">
                    <span className={`text-sm font-bold ${plan.highlight ? 'text-[#22C55E]' : 'text-white'}`}>{plan.name}</span>
                  </div>
                ))}
              </div>

              {/* Feature categories */}
              {featureCategories.map((cat, catIdx) => (
                <div key={cat.category}>
                  {/* Category header */}
                  <div className="grid grid-cols-4 bg-[#162032]/40 border-b border-[#22C55E]/5 min-w-[600px]">
                    <div className="col-span-4 px-6 py-3">
                      <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">{cat.category}</span>
                    </div>
                  </div>

                  {/* Feature rows */}
                  {cat.features.map((feature, fIdx) => (
                    <div
                      key={feature.name}
                      className={`grid grid-cols-4 border-b border-[#22C55E]/5 hover:bg-[#162032]/30 transition-colors min-w-[600px] ${
                        fIdx === cat.features.length - 1 && catIdx < featureCategories.length - 1 ? '' : ''
                      }`}
                    >
                      <div className="px-6 py-3.5 flex items-center">
                        <span className="text-sm text-slate-300">{feature.name}</span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-center">
                        {renderCellValue(feature.free)}
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-center">
                        {renderCellValue(feature.pro)}
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-center">
                        {renderCellValue(feature.enterprise)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#EAB308]/10 rounded-3xl border border-[#22C55E]/15 p-12 backdrop-blur-xl max-w-3xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Not sure which plan?
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Start with the Free plan and upgrade anytime. No credit card required.
              </p>
              <Button size="lg" onClick={() => onNavigate('dashboard')} icon={<ArrowRight size={20} />}>
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
