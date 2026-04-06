'use client';

import { useTranslation } from 'react-i18next';

import { EditParticipantDialogBody } from './edit-participant/EditParticipantDialogBody';
import {
  type EditParticipantFormProps,
  useEditParticipantForm,
} from './edit-participant/useEditParticipantForm';

export type EditParticipantDialogProps = EditParticipantFormProps;

export function EditParticipantDialog(props: EditParticipantDialogProps) {
  const { t } = useTranslation();
  const tEv = (key: string) => t(`eventDetail.${key}`);
  const { open, onOpenChange, participant } = props;

  const form = useEditParticipantForm(props);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
        aria-label={tEv('cancel')}
      />
      <EditParticipantDialogBody
        form={form}
        participant={participant}
        tEv={tEv}
        formatRole={(role) => t(`eventDetail.roles.${role}`)}
        onClose={() => onOpenChange(false)}
      />
    </div>
  );
}
