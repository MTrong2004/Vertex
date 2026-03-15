import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Github, Chrome, GraduationCap, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useLang } from '../contexts/LanguageContext';
import { Role } from '../types';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const { t } = useLang();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('authToken', 'demo-token');
    localStorage.setItem('userRole', selectedRole);
    if (selectedRole === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-green-900/15 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-yellow-900/10 blur-3xl pointer-events-none"></div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md"
        >
          {/* Logo */}
          <div
            className="vertex-brand flex items-center gap-3 mb-12 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <div className="vertex-mark w-10 h-10 rounded-xl flex items-center justify-center text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-2xl vertex-wordmark">Vertex</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
            Plan smarter.<br />
            <span className="text-gradient">Build faster.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            AI-powered project planning that helps your team deliver on time, every time.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {['AI-powered task breakdown', 'Real-time team collaboration', 'Smart deadline optimization'].map((text, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308] flex-shrink-0"></div>
                <span className="text-slate-300 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div
            className="vertex-brand flex items-center gap-2 mb-8 lg:hidden cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-lg vertex-wordmark">Vertex</span>
          </div>

          {/* Card */}
          <div className="bg-[#0F1A2A]/80 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-8 shadow-2xl shadow-green-500/5">
            <h1 className="text-2xl font-display font-bold text-white mb-2">
            {isSignUp ? t.login.titleSignUp : t.login.titleSignIn}
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              {isSignUp ? t.login.subtitleSignUp : t.login.subtitleSignIn}
            </p>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/10 text-slate-300 text-sm font-medium hover:bg-[#162032]/80 hover:border-[#22C55E]/20 transition-all">
                <Chrome size={18} />
                Google
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/10 text-slate-300 text-sm font-medium hover:bg-[#162032]/80 hover:border-[#22C55E]/20 transition-all">
                <Github size={18} />
                GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#22C55E]/10"></div>
              <span className="text-xs text-slate-500">{t.login.orContinue}</span>
              <div className="flex-1 h-px bg-[#22C55E]/10"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.login.fullName}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.login.fullNamePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/10 text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/10 text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.login.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#162032] border border-[#22C55E]/10 text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded bg-[#162032] border-[#22C55E]/20 text-[#22C55E] focus:ring-[#22C55E]/30" />
                    <span className="text-xs text-slate-400">{t.login.rememberMe}</span>
                  </label>
                  <button type="button" className="text-xs text-[#22C55E] hover:underline">{t.login.forgotPassword}</button>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full justify-center" icon={<ArrowRight size={18} />}>
                {isSignUp ? t.login.btnSignUp : t.login.btnSignIn}
              </Button>
            </form>

            {/* Role selection */}
            <div className="mt-6 pt-5 border-t border-[#22C55E]/10">
              <p className="text-xs font-medium text-slate-500 mb-3 text-center">{t.roles.selectRole}</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setSelectedRole('student')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${selectedRole === 'student' ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]' : 'bg-[#162032] border-[#22C55E]/10 text-slate-400 hover:border-[#22C55E]/20 hover:text-slate-300'}`}>
                  <GraduationCap size={20} />
                  <span className="text-xs font-medium">{t.roles.student}</span>
                </button>
                <button type="button" onClick={() => setSelectedRole('admin')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${selectedRole === 'admin' ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-[#162032] border-[#22C55E]/10 text-slate-400 hover:border-red-500/20 hover:text-slate-300'}`}>
                  <Shield size={20} />
                  <span className="text-xs font-medium">{t.roles.admin}</span>
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-slate-400 mt-6">
              {isSignUp ? t.login.haveAccount : t.login.noAccount}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#22C55E] hover:underline font-medium"
              >
                {isSignUp ? t.login.switchSignIn : t.login.switchSignUp}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            {t.login.terms} <button onClick={() => {}} className="hover:text-slate-400 underline">{t.login.termsLink}</button> {t.login.andPrivacy} <button onClick={() => {}} className="hover:text-slate-400 underline">{t.login.privacyLink}</button>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
