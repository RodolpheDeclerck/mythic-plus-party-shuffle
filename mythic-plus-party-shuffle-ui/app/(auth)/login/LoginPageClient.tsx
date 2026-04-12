'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  RiftAuthCardFrame,
  RiftPortalMain,
} from '@/components/RiftPortalShell';

export function LoginPageClient() {
  const { t } = useTranslation();

  return (
    <RiftPortalMain className="flex min-h-screen items-center justify-center">
      <RiftAuthCardFrame>
        <div className="mb-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t('login.heroEyebrow')}
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-[1.65rem]">
            <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-400 bg-clip-text text-transparent">
              {t('common.appName')}
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">{t('login.subtitle')}</p>
        </div>

        <a
          href="/api/auth/login"
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/25"
        >
          {t('login.battlenetButton')}
        </a>

        <div className="mt-6 text-center">
          <Link
            href="/event"
            className="text-sm text-gray-400 transition-colors hover:text-cyan-300"
          >
            {t('login.joinWithCode')}
          </Link>
        </div>
      </RiftAuthCardFrame>
    </RiftPortalMain>
  );
}
