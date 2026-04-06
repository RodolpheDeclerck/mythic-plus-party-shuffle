'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function TermsPageClient() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[var(--rift-void)] px-4 py-12 text-[var(--rift-text)]">
      <div className="mx-auto max-w-prose">
        <h1 className="mb-4 text-2xl font-bold">{t('legal.termsTitle')}</h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--rift-text-muted)]">
          {t('legal.termsBody')}
        </p>
        <Link href="/" className="text-sm text-cyan-400 hover:underline">
          {t('legal.backHome')}
        </Link>
      </div>
    </main>
  );
}
