'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import vi from '@/lib/i18n/vi.json';
import en from '@/lib/i18n/en.json';

type Language = 'vi' | 'en';
type Dictionary = typeof vi;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, variables?: Record<string, string | number>) => string;
}

const dictionaries: Record<Language, Dictionary> = { vi, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    // Load preference from local storage on mount
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  // Helper function to resolve dot-notation paths (e.g., 'nav.events')
  const t = (keyPath: string, variables?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: any = dictionaries[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Missing translation key: ${keyPath} in ${language}`);
        return keyPath;
      }
      current = current[key];
    }
    
    let text = current as string;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
