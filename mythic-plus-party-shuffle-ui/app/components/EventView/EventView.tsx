'use client';

import React, { useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Loading from '@/components/Loading';
import useFetchCharacters from '@/hooks/useFetchCharacters';
import useWebSocket from '@/hooks/useWebSocket';
import useAuthCheck from '@/hooks/useAuthCheck';
import { useEventData } from '@/hooks/useEventData';
import { useCharacterManagement } from '@/hooks/useCharacterManagement';
import { usePartyManagement } from '@/hooks/usePartyManagement';
import { useEventCharactersRefresh } from '@/hooks/useEventCharactersRefresh';
import { useEventViewBootstrap } from '@/hooks/useEventViewBootstrap';
import { useEventViewReRegister } from '@/hooks/useEventViewReRegister';
import { useEventViewPartyActions } from '@/hooks/useEventViewPartyActions';
import { EventDetail } from './EventDetail';
import { ReRegisterEventDialog } from './ReRegisterEventDialog';
import { eventCard, eventCardPadding } from './eventUi';
import { cn } from '@/lib/utils';
import { resolveEventViewErrorMessage } from '@/lib/event/eventViewErrors';

const EventView: React.FC = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventCode = searchParams.get('code');

  const { isAuthenticated, isAuthChecked } = useAuthCheck();

  const { characters, loading, charactersFetchErrorCode, setCharacters } =
    useFetchCharacters(eventCode || '');

  const {
    parties,
    setParties,
    error: partyError,
    fetchParties,
    handleClearEvent,
    updatePartiesInBackend,
    handleShuffle,
  } = usePartyManagement(eventCode || '');

  const {
    arePartiesVisible,
    isVerifying,
    setIsVerifying,
    checkEventExistence,
    fetchEvent,
    togglePartiesVisibility,
    eventInfo,
  } = useEventData(eventCode || '');

  const { fetchCharacters, errorState } = useEventCharactersRefresh(
    eventCode,
    setCharacters,
  );

  const {
    createdCharacter,
    setCreatedCharacter,
    error: characterError,
    handleDelete,
    handleClear,
  } = useCharacterManagement(eventCode || '', fetchCharacters);

  const {
    shufflePending,
    handleShuffleWrapper,
    handlePartiesUpdate,
    handleSaveParticipant,
    handleViewerLeave,
    handleClearAllCharacters,
  } = useEventViewPartyActions({
    characters,
    createdCharacter,
    setCreatedCharacter,
    setParties,
    updatePartiesInBackend,
    handleShuffle,
    handleDelete,
    handleClear,
    fetchCharacters,
    router,
  });

  useEventViewBootstrap({
    eventCode,
    isAuthChecked,
    isAuthenticated,
    router,
    checkEventExistence,
    setCreatedCharacter,
    setIsVerifying,
  });

  const fetchPartiesWrapper = useCallback(async () => {
    fetchParties();
  }, [fetchParties]);

  const fetchEventWrapper = useCallback(async () => {
    fetchEvent();
  }, [fetchEvent]);

  useWebSocket(fetchCharacters, fetchPartiesWrapper, fetchEventWrapper);

  useEffect(() => {
    void fetchPartiesWrapper();
  }, [fetchPartiesWrapper]);

  const {
    reRegisterOpen,
    reRegisterFormKey,
    handleReRegisterSuccess,
    handleReRegisterCancel,
  } = useEventViewReRegister({
    loading,
    eventCode,
    createdCharacter,
    characters,
    fetchCharacters,
    setCreatedCharacter,
    router,
  });

  if (isVerifying || loading || !isAuthChecked) return <Loading />;

  if (
    charactersFetchErrorCode ||
    errorState ||
    characterError ||
    partyError
  ) {
    return (
      <div
        className={cn(
          eventCard,
          eventCardPadding,
          'border-destructive/40 bg-destructive/5 text-destructive',
        )}
        role="alert"
      >
        {resolveEventViewErrorMessage(t, {
          charactersFetchErrorCode,
          errorState,
          characterError,
          partyError,
        })}
      </div>
    );
  }

  const auth = Boolean(isAuthenticated);

  return (
    <div className={cn('mx-auto w-full space-y-8 text-foreground')}>
      {eventCode && eventInfo ? (
        <EventDetail
          eventCode={eventCode}
          eventName={eventInfo.name}
          homeHref={auth ? '/dashboard' : '/'}
          isAdmin={auth}
          characters={characters}
          parties={parties}
          arePartiesVisible={arePartiesVisible}
          shufflePending={shufflePending}
          onShuffle={handleShuffleWrapper}
          onClearParties={() => void handleClearEvent()}
          onToggleVisibility={() => void togglePartiesVisibility()}
          onPartiesUpdate={handlePartiesUpdate}
          onClearAllCharacters={handleClearAllCharacters}
          onSaveParticipant={handleSaveParticipant}
          onDeleteParticipant={handleDelete}
          viewerCharacterId={createdCharacter?.id ?? null}
          onViewerLeaveEvent={handleViewerLeave}
        />
      ) : null}

      {reRegisterOpen && eventCode && createdCharacter ? (
        <ReRegisterEventDialog
          open
          eventCode={eventCode}
          formInstanceKey={reRegisterFormKey}
          initialCharacter={createdCharacter}
          onRegisterSuccess={handleReRegisterSuccess}
          onCancel={handleReRegisterCancel}
        />
      ) : null}
    </div>
  );
};

export default EventView;
