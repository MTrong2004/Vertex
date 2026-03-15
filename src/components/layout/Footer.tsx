import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLang();
  return (
    <footer className="bg-[#0A0F1A] text-white py-12 border-t border-[#22C55E]/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2">
            <div className="vertex-brand flex items-center gap-2 mb-4">
              <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                  <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                  <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
                  <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-display text-lg tracking-tight vertex-wordmark">
                Vertex
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t.footer.tagline}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">{t.footer.product}</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><button onClick={() => onNavigate?.('features')} className="footer-link">{t.footer.features2}</button></li>
              <li><button onClick={() => onNavigate?.('pricing')} className="footer-link">{t.footer.pricing2}</button></li>
              <li><button onClick={() => onNavigate?.('dashboard')} className="footer-link">{t.footer.demo}</button></li>
              <li><button onClick={() => onNavigate?.('changelog')} className="footer-link">{t.footer.changelog}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">{t.footer.resources2}</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><button onClick={() => onNavigate?.('docs')} className="footer-link">{t.footer.docs}</button></li>
              <li><button onClick={() => onNavigate?.('guide')} className="footer-link">{t.footer.guide}</button></li>
              <li><button onClick={() => onNavigate?.('blog')} className="footer-link">{t.footer.blog}</button></li>
              <li><button onClick={() => onNavigate?.('community')} className="footer-link">{t.footer.community}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">{t.footer.legal}</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><button onClick={() => onNavigate?.('terms')} className="footer-link">{t.footer.terms}</button></li>
              <li><button onClick={() => onNavigate?.('privacy')} className="footer-link">{t.footer.privacy}</button></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-[#22C55E]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            {t.footer.rights}
          </p>
          <div className="flex gap-3">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#22C55E]/20 hover:text-[#22C55E] transition-colors flex items-center justify-center text-slate-400">
              <Github size={15} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#22C55E]/20 hover:text-[#22C55E] transition-colors flex items-center justify-center text-slate-400">
              <Twitter size={15} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#22C55E]/20 hover:text-[#22C55E] transition-colors flex items-center justify-center text-slate-400">
              <Linkedin size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
