'use client';

import { useTranslation } from 'react-i18next';
import type { Character } from '@/types/Character';
import EventRegisterForm from '@/event/register/EventRegisterForm/EventRegisterForm';
import { RiftAuthModalFrame } from '@/components/RiftPortalShell';

type ReRegisterEventDialogProps = {
  open: boolean;
  eventCode: string;
  /** Bump when the modal opens to remount the form with fresh defaults. */
  formInstanceKey: number;
  initialCharacter: Character;
  onRegisterSuccess: (data: Character) => void;
  onCancel: () => void;
};

export function ReRegisterEventDialog({
  open,
  eventCode,
  formInstanceKey,
  initialCharacter,
  onRegisterSuccess,
  onCancel,
}: ReRegisterEventDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={() => onCancel()}
        aria-label={t('eventRegister.later')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="re-register-title"
        className="relative z-[1]"
        onClick={(e) => e.stopPropagation()}
      >
        <RiftAuthModalFrame>
          <h2
            id="re-register-title"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            {t('eventRegister.rejoinTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('eventRegister.rejoinBody')}
          </p>
          <div className="mt-6">
            <EventRegisterForm
              key={formInstanceKey}
              variant="embedded"
              eventCodeOverride={eventCode}
              formIdPrefix="re-reg"
              initialCharacter={initialCharacter}
              onRegisterSuccess={onRegisterSuccess}
              onCancel={onCancel}
              hideSignInLink
            />
          </div>
        </RiftAuthModalFrame>
      </div>
    </div>
  );
}
