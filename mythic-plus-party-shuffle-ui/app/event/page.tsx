'use client';

import { Suspense } from 'react';

import EventView from '@/components/EventView/EventView';
import Loading from '@/components/Loading';
import { RiftPortalMain } from '@/components/RiftPortalShell';

export default function EventPage() {
  return (
    <RiftPortalMain
      className="flex min-h-screen items-start justify-center"
      scrimOpacity={70}
    >
      <div className="relative z-10 w-full max-w-5xl py-4 sm:py-8">
        <Suspense fallback={<Loading />}>
          <EventView />
        </Suspense>
      </div>
    </RiftPortalMain>
  );
}
