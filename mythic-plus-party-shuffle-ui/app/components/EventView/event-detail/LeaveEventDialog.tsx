'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type LeaveEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void | Promise<void>;
};

export function LeaveEventDialog({
  open,
  onOpenChange,
  onConfirmLeave,
}: LeaveEventDialogProps) {
  const { t } = useTranslation();
  const tEv = (key: string) => t(`eventDetail.${key}`);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
        aria-label={tEv('leaveCancel')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-confirm-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <h2
          id="leave-confirm-title"
          className="text-lg font-semibold text-foreground"
        >
          {tEv('leaveConfirmTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tEv('leaveConfirmBody')}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tEv('leaveCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              void onConfirmLeave();
            }}
          >
            {tEv('leaveConfirmAction')}
          </Button>
        </div>
      </div>
    </div>
  );
}
