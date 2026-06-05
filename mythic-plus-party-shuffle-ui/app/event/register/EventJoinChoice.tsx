'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { buildLoginUrl } from './BlizzardPicker/blizzardLinks';

interface EventJoinChoiceProps {
  /** Switch to the manual guest registration form. */
  onGuest: () => void;
  /** Where to return after Auth0 login (the current register URL). */
  returnTo: string;
}

/**
 * Entry screen for not-logged-in users: log in with Battle.net to pick a real
 * character, or continue as a guest with the manual form.
 */
export function EventJoinChoice({ onGuest, returnTo }: EventJoinChoiceProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          window.location.href = buildLoginUrl(returnTo);
        }}
        className="h-12 w-full"
      >
        {t('eventRegister.choice.loginBattlenet')}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-purple-500/20" />
        {t('eventRegister.choice.or')}
        <span className="h-px flex-1 bg-purple-500/20" />
      </div>

      <Button variant="outline" onClick={onGuest} className="h-12 w-full">
        {t('eventRegister.choice.joinAsGuest')}
      </Button>
    </div>
  );
}

export default EventJoinChoice;
