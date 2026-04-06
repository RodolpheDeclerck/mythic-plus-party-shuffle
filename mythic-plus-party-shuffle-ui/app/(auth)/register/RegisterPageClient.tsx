'use client';

import { useTranslation } from 'react-i18next';

import RegisterForm from '@/components/RegisterForm/RegisterForm';
import {
  RiftAuthCardFrame,
  RiftPortalMain,
} from '@/components/RiftPortalShell';

export function RegisterPageClient() {
  const { t } = useTranslation();

  return (
    <RiftPortalMain className="flex min-h-screen items-center justify-center">
      <RiftAuthCardFrame>
        <div className="mb-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t('register.heroEyebrow')}
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-[1.65rem]">
            <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-400 bg-clip-text text-transparent">
              {t('common.appName')}
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">{t('register.subtitle')}</p>
        </div>

        <RegisterForm />
      </RiftAuthCardFrame>
    </RiftPortalMain>
  );
}
