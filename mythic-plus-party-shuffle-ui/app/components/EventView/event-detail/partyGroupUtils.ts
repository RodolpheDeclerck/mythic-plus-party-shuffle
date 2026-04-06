import { Crosshair, Heart, Shield, Sword, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ITEM_LEVEL_TIER_HIGH,
  ITEM_LEVEL_TIER_MID,
  ITEM_LEVEL_TIER_LOW,
} from '@/constants/itemLevels';
import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';

export function partyGroupContainsCharacterId(
  group: EventPartyGroup,
  id: number,
): boolean {
  const sid = String(id);
  return (
    group.tank?.id === sid ||
    group.healer?.id === sid ||
    group.dps.some((d) => d.id === sid)
  );
}

export function getPartyGroupAggregateStats(group: EventPartyGroup): {
  minIlvl: number;
  maxIlvl: number;
  avgIlvlRounded: number;
  minKey: number;
  maxKey: number;
} | null {
  const members = [group.tank, group.healer, ...group.dps].filter(
    (m): m is EventParticipant => m != null,
  );
  if (members.length === 0) return null;
  const ilvls = members.map((m) => m.ilvl);
  const sum = ilvls.reduce((a, b) => a + b, 0);
  return {
    minIlvl: Math.min(...ilvls),
    maxIlvl: Math.max(...ilvls),
    avgIlvlRounded: Math.round(sum / ilvls.length),
    minKey: Math.min(...members.map((m) => m.keyMin)),
    maxKey: Math.max(...members.map((m) => m.keyMax)),
  };
}

export function getPartyGroupCompositionStatus(group: EventPartyGroup) {
  const members = [group.tank, group.healer, ...group.dps].filter(
    (m): m is EventParticipant => m != null,
  );
  const missingTank = !group.tank;
  const missingHealer = !group.healer;
  const dpsCount = group.dps.filter(Boolean).length;
  const missingDps = 3 - dpsCount;
  const hasBloodlust = members.some((m) => m.hasBloodlust);
  const hasBattleRez = members.some((m) => m.hasBattleRez);
  const hasMissing =
    missingTank ||
    missingHealer ||
    missingDps > 0 ||
    !hasBloodlust ||
    !hasBattleRez;
  return {
    missingTank,
    missingHealer,
    missingDps,
    hasBloodlust,
    hasBattleRez,
    hasMissing,
  };
}

export const playerGroupRoleIcons: Record<
  EventParticipant['role'],
  { icon: LucideIcon; color: string }
> = {
  tank: { icon: Shield, color: 'text-blue-400' },
  healer: { icon: Heart, color: 'text-green-400' },
  meleeDps: { icon: Sword, color: 'text-red-400' },
  rangedDps: { icon: Crosshair, color: 'text-orange-400' },
};

export function adminGroupIlvlBadgeClass(ilvl: number): string {
  return cn(
    'w-10 rounded px-1.5 py-0.5 text-center font-mono text-xs font-bold',
    ilvl >= ITEM_LEVEL_TIER_HIGH
      ? 'bg-purple-500/20 text-purple-300'
      : ilvl >= ITEM_LEVEL_TIER_MID
        ? 'bg-blue-500/20 text-blue-300'
        : ilvl >= ITEM_LEVEL_TIER_LOW
          ? 'bg-green-500/20 text-green-300'
          : 'bg-muted/20 text-muted-foreground',
  );
}

export function getGroupSize(group: EventPartyGroup): number {
  return (group.tank ? 1 : 0) + (group.healer ? 1 : 0) + group.dps.length;
}

export function isGroupEmpty(group: EventPartyGroup): boolean {
  return !group.tank && !group.healer && group.dps.length === 0;
}

export function groupHasBL(group: EventPartyGroup): boolean {
  if (group.tank?.hasBloodlust || group.healer?.hasBloodlust) return true;
  return group.dps.some((d) => d.hasBloodlust);
}

export function groupHasRez(group: EventPartyGroup): boolean {
  if (group.tank?.hasBattleRez || group.healer?.hasBattleRez) return true;
  return group.dps.some((d) => d.hasBattleRez);
}

export function assignedParticipantIds(groups: EventPartyGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const group of groups) {
    if (group.tank) ids.add(group.tank.id);
    if (group.healer) ids.add(group.healer.id);
    for (const d of group.dps) ids.add(d.id);
  }
  return ids;
}
