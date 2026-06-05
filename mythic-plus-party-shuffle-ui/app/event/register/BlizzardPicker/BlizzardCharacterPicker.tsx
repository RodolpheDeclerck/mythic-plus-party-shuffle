'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Check, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import { playerGroupRoleIcons } from '@/components/EventView/event-detail/partyGroupUtils';
import { useBlizzardRoster } from '@/hooks/useBlizzardRoster';
import { fetchBlizzardCharacter } from '@/lib/blizzard/blizzardClient';
import type {
  BlizzardRosterCharacter,
  BlizzardEnrichedCharacter,
} from '@/types/BlizzardCharacter';
import { toDisplayCharacterClass } from '@/utils/characterClassApiMap';

import { classColor, deriveBuffs, deriveRole } from './blizzardPickerUtils';

interface BlizzardCharacterPickerProps {
  /** Called with the enriched character when the user confirms. */
  onJoin: (character: BlizzardEnrichedCharacter) => void;
  isSaving?: boolean;
  /** Entry point for the "Link Battle.net" CTA (Auth0 Connected Accounts). */
  onLinkBattlenet: () => void;
}

function rosterKey(c: BlizzardRosterCharacter): string {
  return `${c.realmSlug}:${c.name}`;
}

export function BlizzardCharacterPicker({
  onJoin,
  isSaving = false,
  onLinkBattlenet,
}: BlizzardCharacterPickerProps) {
  const { t } = useTranslation();
  const { characters, loading, notLinked, error, reload } = useBlizzardRoster();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<BlizzardEnrichedCharacter | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState(false);

  const handleSelect = useCallback(async (char: BlizzardRosterCharacter) => {
    setSelectedKey(rosterKey(char));
    setEnriched(null);
    setEnrichError(false);
    setEnriching(true);
    try {
      const data = await fetchBlizzardCharacter(char.realmSlug, char.name);
      setEnriched(data);
    } catch {
      setEnrichError(true);
    } finally {
      setEnriching(false);
    }
  }, []);

  // --- Loading / not-linked / error states -------------------------------

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-purple-400" />
        <p className="text-sm text-muted-foreground">
          {t('eventRegister.picker.loadingCharacters')}
        </p>
      </div>
    );
  }

  if (notLinked) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {t('eventRegister.picker.notLinked')}
        </p>
        <Button onClick={onLinkBattlenet} className="w-full max-w-xs">
          {t('eventRegister.picker.linkBattlenet')}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <AlertTriangle className="h-7 w-7 text-red-400" />
        <p className="text-sm text-muted-foreground">
          {t('eventRegister.picker.loadError')}
        </p>
        <Button variant="outline" onClick={reload}>
          {t('eventRegister.picker.retry')}
        </Button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {t('eventRegister.picker.empty')}
      </p>
    );
  }

  // --- Roster list -------------------------------------------------------

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {characters.map((char) => {
          const key = rosterKey(char);
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => void handleSelect(char)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? 'border-cyan-400/50 bg-cyan-500/10'
                  : 'border-purple-500/20 bg-purple-900/10 hover:border-purple-500/40 hover:bg-purple-900/20'
              }`}
            >
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-400'
                    : 'border-muted-foreground/40'
                }`}
              >
                {isSelected ? <Check className="h-3 w-3 text-black" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className="truncate font-semibold"
                    style={{ color: classColor(char.characterClass) }}
                  >
                    {char.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {char.realmName}
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  {toDisplayCharacterClass(char.characterClass)} ·{' '}
                  {t('eventRegister.picker.level', { level: char.level })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selectedKey ? (
        <SelectedCharacterCard
          enriching={enriching}
          enrichError={enrichError}
          enriched={enriched}
          isSaving={isSaving}
          onJoin={onJoin}
        />
      ) : null}
    </div>
  );
}

interface SelectedCharacterCardProps {
  enriching: boolean;
  enrichError: boolean;
  enriched: BlizzardEnrichedCharacter | null;
  isSaving: boolean;
  onJoin: (character: BlizzardEnrichedCharacter) => void;
}

function SelectedCharacterCard({
  enriching,
  enrichError,
  enriched,
  isSaving,
  onJoin,
}: SelectedCharacterCardProps) {
  const { t } = useTranslation();

  if (enriching) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-purple-500/20 pt-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        {t('eventRegister.picker.loadingDetails')}
      </div>
    );
  }

  if (enrichError || !enriched) {
    return (
      <p className="border-t border-purple-500/20 pt-4 text-center text-sm text-red-400">
        {t('eventRegister.picker.detailError')}
      </p>
    );
  }

  const role = deriveRole(enriched);
  const { hasBloodlust, hasBattleRez } = deriveBuffs(enriched.characterClass);
  const RoleIcon = playerGroupRoleIcons[role].icon;

  return (
    <div className="space-y-3 border-t border-purple-500/20 pt-4">
      <div className="flex items-center gap-3">
        <RoleIcon className={`h-4 w-4 ${playerGroupRoleIcons[role].color}`} />
        <span
          className="font-semibold"
          style={{ color: classColor(enriched.characterClass) }}
        >
          {enriched.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {enriched.specialization.replace(/_/g, ' ')}
        </span>
        <span className="ml-auto rounded bg-blue-500/20 px-2 py-0.5 font-mono text-xs font-bold text-blue-300">
          {enriched.iLevel}
        </span>
        <BloodlustIcon
          className={`h-4 w-4 ${hasBloodlust ? 'text-orange-400' : 'text-muted-foreground/20'}`}
        />
        <BattleRezIcon
          className={`h-4 w-4 ${hasBattleRez ? 'text-green-400' : 'text-muted-foreground/20'}`}
        />
      </div>

      <Button
        onClick={() => onJoin(enriched)}
        disabled={isSaving}
        className="w-full"
      >
        {t('eventRegister.picker.joinEvent')}
      </Button>
    </div>
  );
}

export default BlizzardCharacterPicker;
