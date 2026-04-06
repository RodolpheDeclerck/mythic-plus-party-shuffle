'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ITEM_LEVEL_TIER_HIGH,
  ITEM_LEVEL_TIER_MID,
  ITEM_LEVEL_TIER_LOW,
} from '@/constants/itemLevels';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';
import {
  adminGroupIlvlBadgeClass,
  playerGroupRoleIcons,
} from './partyGroupUtils';

export function PlayerRosterTableRow({
  participant,
  isViewer,
  classColors,
  tEv,
  showRole,
  admin,
}: {
  participant: EventParticipant;
  isViewer: boolean;
  classColors: Record<string, string>;
  tEv: (key: string) => string;
  showRole?: boolean;
  admin?: {
    onRowClick: () => void;
    onDelete: () => void;
    deleteTitle: string;
  };
}) {
  const RoleIcon = playerGroupRoleIcons[participant.role]?.icon;
  const roleColor =
    playerGroupRoleIcons[participant.role]?.color ?? 'text-muted-foreground';

  const ilvlBadgeClass = admin
    ? adminGroupIlvlBadgeClass(participant.ilvl)
    : cn(
        'inline-block rounded px-2 py-0.5 font-mono text-sm font-bold',
        participant.ilvl >= ITEM_LEVEL_TIER_HIGH
          ? 'bg-purple-500/20 text-purple-300'
          : participant.ilvl >= ITEM_LEVEL_TIER_MID
            ? 'bg-blue-500/20 text-blue-300'
            : participant.ilvl >= ITEM_LEVEL_TIER_LOW
              ? 'bg-green-500/20 text-green-300'
              : 'bg-muted/20 text-muted-foreground',
      );

  return (
    <tr
      className={cn(
        'border-b border-border/30 transition-colors last:border-0',
        isViewer ? 'bg-cyan-500/10' : 'hover:bg-secondary/20',
        admin && 'group cursor-pointer hover:bg-secondary/20',
      )}
      onClick={admin ? admin.onRowClick : undefined}
    >
      {showRole ? (
        <td className="w-10 px-3 py-2.5 text-center">
          {RoleIcon ? (
            <RoleIcon className={cn('inline h-4 w-4', roleColor)} />
          ) : null}
        </td>
      ) : null}
      <td
        className={cn(
          'truncate px-4 py-2.5 font-medium',
          isViewer ? 'font-bold text-cyan-300' : '',
        )}
      >
        {participant.name}
        {isViewer ? (
          <span className="ml-2 text-xs font-normal text-cyan-400">
            ({tEv('you')})
          </span>
        ) : null}
      </td>
      <td
        className={cn(
          'truncate px-4 py-2.5',
          classColors[participant.class] || 'text-foreground',
        )}
      >
        {participant.class}
      </td>
      <td className="truncate px-4 py-2.5 text-muted-foreground">
        {participant.spec}
      </td>
      <td className="px-4 py-2.5 text-center">
        <span className={ilvlBadgeClass}>{participant.ilvl}</span>
      </td>
      <td className="px-4 py-2.5 text-center">
        <span className="font-mono text-sm text-cyan-400">
          {participant.keyMin}-{participant.keyMax}
        </span>
      </td>
      <td className="px-4 py-2.5 text-center">
        {participant.hasBloodlust ? (
          <BloodlustIcon className="inline h-5 w-5 text-orange-400" />
        ) : (
          <span className="text-muted-foreground/30">-</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-center">
        {participant.hasBattleRez ? (
          <BattleRezIcon className="inline h-5 w-5 text-green-400" />
        ) : (
          <span className="text-muted-foreground/30">-</span>
        )}
      </td>
      {admin ? (
        <td className="px-4 py-2.5 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              admin.onDelete();
            }}
            className="rounded p-1 text-red-400/60 opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
            title={admin.deleteTitle}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      ) : null}
    </tr>
  );
}
