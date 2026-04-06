'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';

export type EventRegisterRolePreviewProps = {
  previewRole: string | null;
  hasBloodlust: boolean;
  hasBattleRez: boolean;
};

export function EventRegisterRolePreview({
  previewRole,
  hasBloodlust,
  hasBattleRez,
}: EventRegisterRolePreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-900/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">
            {t('eventRegister.roleLabel')}
          </p>
          {previewRole ? (
            <p className="font-medium capitalize text-foreground">
              {t(`eventDetail.roles.${previewRole}`)}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <BloodlustIcon
              className={`h-6 w-6 ${hasBloodlust ? 'text-orange-400' : 'text-muted-foreground/30'}`}
            />
            <span className="text-xs text-muted-foreground">
              {hasBloodlust ? t('eventRegister.yes') : t('eventRegister.no')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BattleRezIcon
              className={`h-6 w-6 ${hasBattleRez ? 'text-green-400' : 'text-muted-foreground/30'}`}
            />
            <span className="text-xs text-muted-foreground">
              {hasBattleRez ? t('eventRegister.yes') : t('eventRegister.no')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
