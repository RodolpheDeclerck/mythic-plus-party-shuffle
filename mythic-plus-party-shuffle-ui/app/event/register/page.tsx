'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import EventRegisterForm from './EventRegisterForm/EventRegisterForm';
import {
  RiftAuthCardFrame,
  RiftPortalMain,
} from '@/components/RiftPortalShell';

function EventRegisterPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <RiftPortalMain
      className="flex min-h-screen items-center justify-center"
      backgroundPosition="absolute"
    >
      <div className="absolute left-4 top-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('eventRegister.backNav')}
        </Link>
      </div>

      <RiftAuthCardFrame maxWidthClassName="max-w-lg" paddingVariant="compact">
        {code ? (
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
              {t('eventRegister.eventCodeEyebrow')}: {code}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-400 bg-clip-text text-transparent">
                {t('eventRegister.joinTitle')}
              </span>
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {t('eventRegister.joinSubtitle')}
            </p>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('eventRegister.missingCodeTitle')}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {t('eventRegister.missingCodeBody')}
            </p>
          </div>
        )}

        <EventRegisterForm />
      </RiftAuthCardFrame>
    </RiftPortalMain>
  );
}

export default function EventRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--rift-void)] text-sm text-cyan-400/80">
          Loading…
        </div>
      }
    >
      <EventRegisterPageContent />
    </Suspense>
  );
}
