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
  return group.members.some((m) => m?.id === sid);
}

export function getPartyGroupAggregateStats(group: EventPartyGroup): {
  minIlvl: number;
  maxIlvl: number;
  avgIlvlRounded: number;
  minKey: number;
  maxKey: number;
} | null {
  const members = group.members.filter((m): m is EventParticipant => m != null);
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
  const members = group.members.filter((m): m is EventParticipant => m != null);
  const hasTank = members.some((m) => m.role === 'tank');
  const hasHealer = members.some((m) => m.role === 'healer');
  const dpsCount = members.filter(
    (m) => m.role === 'meleeDps' || m.role === 'rangedDps',
  ).length;
  const missingTank = !hasTank;
  const missingHealer = !hasHealer;
  const missingDps = Math.max(0, 3 - dpsCount);
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
  return group.members.filter((m) => m != null).length;
}

export function isGroupEmpty(group: EventPartyGroup): boolean {
  return group.members.every((m) => !m);
}

export function groupHasBL(group: EventPartyGroup): boolean {
  return group.members.some((m) => m?.hasBloodlust);
}

export function groupHasRez(group: EventPartyGroup): boolean {
  return group.members.some((m) => m?.hasBattleRez);
}

export function assignedParticipantIds(groups: EventPartyGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const m of group.members) {
      if (m) ids.add(m.id);
    }
  }
  return ids;
}
