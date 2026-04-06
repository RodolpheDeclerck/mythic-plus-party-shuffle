'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import {
  RiftAuthCardFrame,
  RiftPortalMain,
} from '@/components/RiftPortalShell';

export function ForgotPasswordPageClient() {
  const { t } = useTranslation();

  return (
    <RiftPortalMain className="flex min-h-screen items-center justify-center">
      <RiftAuthCardFrame>
        <h1 className="mb-3 text-center text-xl font-bold text-[var(--rift-text)]">
          {t('forgotPasswordPage.title')}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          {t('forgotPasswordPage.body')}
        </p>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          {t('forgotPasswordPage.backToLogin')}
        </Link>
      </RiftAuthCardFrame>
    </RiftPortalMain>
  );
}
