'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { riftVoidFill80 } from '@/lib/riftUi';

export type CreateEventFormProps = {
  t: (key: string) => string;
  eventName: string;
  onEventNameChange: (value: string) => void;
  isCreating: boolean;
  errorMessage: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isFormValid: boolean;
};

export function CreateEventForm({
  t,
  eventName,
  onEventNameChange,
  isCreating,
  errorMessage,
  onSubmit,
  isFormValid,
}: CreateEventFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {errorMessage ? (
        <div
          id="create-event-error"
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="event-name"
          className="text-sm font-medium text-foreground"
        >
          {t('createEvent.nameLabel')}
        </label>
        <Input
          id="event-name"
          type="text"
          name="name"
          autoComplete="off"
          placeholder={t('createEvent.namePlaceholder')}
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
          disabled={isCreating}
          required
          aria-describedby={errorMessage ? 'create-event-error' : undefined}
          className={cn(
            'h-11 border-purple-500/30 placeholder:text-muted-foreground focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400',
            riftVoidFill80,
          )}
        />
      </div>

      <Button
        type="submit"
        variant="portal"
        disabled={!isFormValid || isCreating}
        className="mt-2 h-12 w-full"
      >
        {isCreating ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="h-4 w-4 text-white" />
            {t('createEvent.creating')}
          </span>
        ) : (
          t('createEvent.submit')
        )}
      </Button>

      <div className="mt-4 border-t border-purple-500/20 pt-4 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-cyan-400 hover:underline focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rift-void)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('createEvent.backDashboard')}
        </Link>
      </div>
    </form>
  );
}
