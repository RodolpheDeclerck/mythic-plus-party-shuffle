'use client';

import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ClearConfirmDialogType = 'participants' | 'groups';

type ClearConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  type: ClearConfirmDialogType;
};

export function ClearConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
}: ClearConfirmDialogProps) {
  const { t } = useTranslation();
  const tEv = (key: string) => t(`eventDetail.${key}`);

  if (!open) return null;

  const messageKey =
    type === 'participants' ? 'confirmClearParticipants' : 'confirmClearGroups';
  const titleKey =
    type === 'participants' ? 'clearParticipants' : 'clearGroups';

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
        aria-label={tEv('cancel')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-confirm-title"
        className="relative w-full max-w-md rounded-xl border border-red-500/30 bg-red-950/60 p-6 shadow-xl backdrop-blur-md [color-scheme:dark]"
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-0.5">
            <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="clear-confirm-title"
              className="text-lg font-bold text-red-300"
            >
              {tEv(titleKey)}
            </h2>
            <p className="mt-1 text-sm text-red-200/90">{tEv(messageKey)}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400/80 hover:bg-red-500/15"
          >
            {tEv('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            className="flex-1 border border-red-500/60 bg-red-600/60 text-red-200 hover:bg-red-600/80"
          >
            {tEv(titleKey)}
          </Button>
        </div>
      </div>
    </div>
  );
}
