'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Dictionary } from './types';
import { en } from './en';
import { sw } from './sw';

const dictionaries: Record<Language, Dictionary> = { en, sw };

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = document.cookie
      .split('; ')
      .find(row => row.startsWith('smartshamba_lang='))
      ?.split('=')[1] as Language;
    if (savedLang === 'en' || savedLang === 'sw') {
      setLangState(savedLang);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    document.cookie = `smartshamba_lang=${newLang}; path=/; max-age=31536000`; // 1 year
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return context;
}
