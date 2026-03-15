import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lang, translations, Translations } from '../i18n';

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('en');

  const setLang = useCallback((l: Lang) => {
    setLangState('en');
  }, []);

  const toggle = useCallback(() => {
    setLang('en');
  }, [setLang]);

  const t = translations[lang] as Translations;

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};
