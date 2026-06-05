'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import useAuthCheck from '@/hooks/useAuthCheck';
import EventRegisterForm from './EventRegisterForm/EventRegisterForm';
import { EventJoinChoice } from './EventJoinChoice';
import { BlizzardCharacterPicker } from './BlizzardPicker/BlizzardCharacterPicker';
import { useBlizzardJoin } from './BlizzardPicker/useBlizzardJoin';
import { buildLinkBattlenetUrl } from './BlizzardPicker/blizzardLinks';

/**
 * Routes event registration by auth state:
 * - logged-in  → Blizzard character picker (auto-filled registration)
 * - not logged → Battle.net login or "join as guest" (manual form)
 */
export function EventRegisterGate() {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthChecked } = useAuthCheck();
  const searchParams = useSearchParams();
  const eventCode = searchParams.get('code');

  const [guestMode, setGuestMode] = useState(false);
  const { join, isSaving, saveError } = useBlizzardJoin(eventCode);

  const returnTo =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/event/register';

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="space-y-4">
        {saveError ? (
          <div
            role="alert"
            className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {saveError}
          </div>
        ) : null}
        <BlizzardCharacterPicker
          onJoin={join}
          isSaving={isSaving}
          onLinkBattlenet={() => {
            window.location.href = buildLinkBattlenetUrl(returnTo);
          }}
        />
      </div>
    );
  }

  if (guestMode) {
    return (
      <div className="space-y-4">
        <p className="text-center text-xs text-muted-foreground">
          {t('eventRegister.choice.guestHint')}
        </p>
        <EventRegisterForm />
      </div>
    );
  }

  return (
    <EventJoinChoice onGuest={() => setGuestMode(true)} returnTo={returnTo} />
  );
}

export default EventRegisterGate;
