'use client';

import { useEffect } from 'react';
import i18n from '@/i18n';

function baseLang(code: string): string {
  const base = code.split('-')[0] ?? 'en';
  return base === 'fr' || base === 'en' ? base : 'en';
}

/** Keeps `<html lang>` aligned with react-i18next (a11y + SEO). */
export function I18nHtmlLangSync() {
  useEffect(() => {
    const apply = () => {
      const lng = i18n.resolvedLanguage ?? i18n.language ?? 'en';
      document.documentElement.lang = baseLang(lng);
    };
    apply();
    i18n.on('languageChanged', apply);
    return () => {
      i18n.off('languageChanged', apply);
    };
  }, []);
  return null;
}
