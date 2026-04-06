'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EventRegisterFormActionsProps = {
  isSaving: boolean;
  canSubmit: boolean;
  onCancel?: () => void;
  hideSignInLink?: boolean;
};

export function EventRegisterFormActions({
  isSaving,
  canSubmit,
  onCancel,
  hideSignInLink = false,
}: EventRegisterFormActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-2 sm:flex-row',
          onCancel ? 'sm:items-stretch' : '',
        )}
      >
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onCancel()}
            className="border-purple-500/40 text-muted-foreground hover:bg-purple-500/10 sm:flex-initial"
          >
            {t('eventRegister.later')}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="portal"
          disabled={!canSubmit || isSaving}
          className={cn('h-12', onCancel ? 'sm:flex-1' : 'w-full')}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('eventRegister.joining')}
            </>
          ) : (
            t('eventRegister.joinEvent')
          )}
        </Button>
      </div>

      {!hideSignInLink ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          {t('eventRegister.signInPrompt')}{' '}
          <Link
            href="/login"
            className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            {t('eventRegister.signInLink')}
          </Link>
        </p>
      ) : null}
    </>
  );
}
