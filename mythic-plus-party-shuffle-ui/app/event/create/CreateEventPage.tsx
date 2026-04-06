'use client';

import React from 'react';

import { Spinner } from '@/components/ui/spinner';

import { CreateEventForm } from './CreateEventForm';
import { useCreateEventForm } from './useCreateEventForm';

const CreateEventPage: React.FC = () => {
  const {
    t,
    eventName,
    setEventName,
    isCreating,
    errorMessage,
    handleSubmit,
    isFormValid,
    showAuthGate,
  } = useCreateEventForm();

  if (showAuthGate) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Spinner className="h-8 w-8 text-cyan-400" />
        <p className="text-sm text-muted-foreground">
          {t('createEvent.checkingAuth')}
        </p>
      </div>
    );
  }

  return (
    <CreateEventForm
      t={t}
      eventName={eventName}
      onEventNameChange={setEventName}
      isCreating={isCreating}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
    />
  );
};

export default CreateEventPage;
