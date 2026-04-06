'use client';

import Dashboard from './Dashboard';
import { RiftPortalMain } from '@/components/RiftPortalShell';

export default function DashboardPage() {
  return (
    <RiftPortalMain className="pb-12 pt-8" scrimOpacity={75}>
      <div className="relative z-10 mx-auto w-full max-w-4xl pt-10 sm:pt-12">
        <Dashboard />
      </div>
    </RiftPortalMain>
  );
}
