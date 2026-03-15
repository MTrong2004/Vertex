import React from 'react';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

interface PricingProps {
  onNavigate?: (page: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onNavigate }) => {
  const { t } = useLang();
  return (
    <section id="pricing" className="py-20 bg-[#0A1628]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t.pricing.heading1} <span className="text-gradient">{t.pricing.heading2}</span>
          </h2>
          <p className="text-slate-400 text-lg">
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Button to view pricing page */}
        <div className="flex justify-center mb-8">
          <Button variant="primary" onClick={() => onNavigate && onNavigate('pricing')}>{t.pricing.viewAll}</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-[#0F1A2A]/70 backdrop-blur-xl border border-[#22C55E]/10 rounded-2xl p-8 flex flex-col hover:border-[#22C55E]/30 transition-colors">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">{t.pricing.freeName}</h3>
              <p className="text-slate-400 text-sm">{t.pricing.freeDesc}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{t.pricing.freePrice}</span>
              <span className="text-slate-400">{t.pricing.monthSuffix}</span>
            </div>
            <Button variant="outline" className="w-full mb-8">{t.pricing.freeBtn}</Button>
            <ul className="space-y-3 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.free1}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.free2}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.free3}</li>
            </ul>
          </div>

          {/* Student Plan */}
          <div className="relative border-2 border-[#22C55E]/40 rounded-2xl p-8 flex flex-col shadow-xl shadow-[#22C55E]/10 bg-[#0F1A2A]/80 backdrop-blur-xl transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {t.pricing.popular}
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">{t.pricing.proName}</h3>
              <p className="text-slate-400 text-sm">{t.pricing.proDesc}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{t.pricing.proPrice}</span>
              <span className="text-slate-400">{t.pricing.monthSuffix}</span>
            </div>
            <Button variant="primary" className="w-full mb-8">{t.pricing.proBtn}</Button>
            <ul className="space-y-3 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.pro1}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.pro2}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.pro3}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.pro4}</li>
            </ul>
          </div>

          {/* Team Plan */}
          <div className="bg-[#0F1A2A]/70 backdrop-blur-xl border border-[#22C55E]/10 rounded-2xl p-8 flex flex-col hover:border-[#22C55E]/30 transition-colors">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">{t.pricing.teamName}</h3>
              <p className="text-slate-400 text-sm">{t.pricing.teamDesc}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{t.pricing.teamPrice}</span>
              <span className="text-slate-400">{t.pricing.monthSuffix}</span>
            </div>
            <Button variant="outline" className="w-full mb-8" onClick={() => onNavigate?.('lecturer')}>{t.pricing.teamBtn}</Button>
            <ul className="space-y-3 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.team1}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.team2}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.team3}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.team4}</li>
              <li className="flex items-center gap-3 text-sm text-slate-300"><Check size={16} className="text-[#22C55E]" /> {t.pricing.team5}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
