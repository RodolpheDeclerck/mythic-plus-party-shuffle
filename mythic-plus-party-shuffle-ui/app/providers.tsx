'use client';

import './lib/axiosAuth';
import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AuthProvider } from './context/AuthContext';
import { ClassesProvider } from './context/ClassesContext';
import { SpecializationsProvider } from './context/SpecializationsContext';
import { I18nHtmlLangSync } from './components/I18nHtmlLangSync';
import i18n from './i18n';

function I18nStoredLanguageSync() {
  useEffect(() => {
    try {
      const s = localStorage.getItem('i18nextLng');
      if (s === 'fr' || s === 'en') void i18n.changeLanguage(s);
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nStoredLanguageSync />
      <I18nHtmlLangSync />
      <ClassesProvider>
        <SpecializationsProvider>
          <DndProvider backend={HTML5Backend}>{children}</DndProvider>
        </SpecializationsProvider>
      </ClassesProvider>
    </AuthProvider>
  );
}
