import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { useLang } from '../../contexts/LanguageContext';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t.nav.features,  id: 'features'   },
    { label: t.nav.pricing,   id: 'pricing'    },
    { label: t.nav.resources, id: 'resources'  },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0A0F1A]/80 backdrop-blur-xl shadow-lg shadow-green-500/5 py-3 border-b border-[#22C55E]/10' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Logo */}
        <div 
          className="vertex-brand inline-flex w-max items-center gap-2 cursor-pointer md:justify-self-start" 
          onClick={() => onNavigate('landing')}
        >
          <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
              <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
              <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
              <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-xl tracking-tight vertex-wordmark">
            Vertex
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center justify-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`menu-link text-sm font-medium ${currentPage === item.id ? 'is-current' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>
            {t.nav.signIn}
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('dashboard')}>
            {t.nav.freeTrial}
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-slate-400"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-[#0F1A2A]/95 backdrop-blur-xl border-b border-[#22C55E]/10 p-4 flex flex-col gap-1 shadow-lg shadow-green-500/5"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-[#22C55E]/10 text-[#22C55E]'
                  : 'text-slate-400 hover:text-white hover:bg-[#162032]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="h-px bg-[#22C55E]/10 my-2"></div>
          <Button variant="ghost" size="sm" className="justify-start" onClick={() => { onNavigate('login'); setIsMobileMenuOpen(false); }}>
            {t.nav.signIn}
          </Button>
          <Button variant="primary" size="sm" className="w-full justify-center" onClick={() => { onNavigate('dashboard'); setIsMobileMenuOpen(false); }}>
            {t.nav.freeTrial}
          </Button>
        </motion.div>
      )}
    </header>
  );
};
