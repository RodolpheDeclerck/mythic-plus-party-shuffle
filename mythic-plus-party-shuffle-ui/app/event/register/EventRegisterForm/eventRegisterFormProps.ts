import type { Character } from '@/types/Character';

export type EventRegisterFormProps = {
  variant?: 'page' | 'embedded';
  /** Embedded on event page (modal): event code is not from the query string. */
  eventCodeOverride?: string | null;
  formIdPrefix?: string;
  initialCharacter?: Character | null;
  onRegisterSuccess?: (data: Character) => void;
  onCancel?: () => void;
  hideSignInLink?: boolean;
};
