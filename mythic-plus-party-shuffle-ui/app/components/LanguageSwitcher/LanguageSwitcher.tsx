'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { riftVoidSolid } from '@/lib/riftUi';
import { Globe } from 'lucide-react';

const LOCALES = ['en', 'fr'] as const;
type Locale = (typeof LOCALES)[number];

function persistLocale(lng: Locale) {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch {
    /* ignore */
  }
}

export function LanguageSwitcher() {
  const { t, i18n: i18nInstance } = useTranslation();
  const current = (
    LOCALES.includes(i18nInstance.language as Locale)
      ? i18nInstance.language
      : 'en'
  ) as Locale;

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
      <select
        value={current}
        onChange={(e) => {
          const lng = e.target.value as Locale;
          void i18nInstance.changeLanguage(lng);
          persistLocale(lng);
        }}
        className="cursor-pointer rounded bg-transparent text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400"
        aria-label={t('languageSwitcher.label')}
      >
        <option value="en" className={cn(riftVoidSolid, 'text-foreground')}>
          {t('languageSwitcher.en')}
        </option>
        <option value="fr" className={cn(riftVoidSolid, 'text-foreground')}>
          {t('languageSwitcher.fr')}
        </option>
      </select>
    </div>
  );
}
