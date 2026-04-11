import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  toApiCharacterClass,
  toDisplayCharacterClass,
} from '@/utils/characterClassApiMap';
import { resolveSpecializationKey } from '@/lib/wowClassSpecKeys';

export interface EventParticipant {
  id: string;
  name: string;
  class: string;
  spec: string;
  role: 'tank' | 'healer' | 'meleeDps' | 'rangedDps';
  ilvl: number;
  hasBloodlust: boolean;
  hasBattleRez: boolean;
  keyMin: number;
  keyMax: number;
}

export interface EventPartyGroup {
  id: string;
  members: (EventParticipant | null)[];
}

export function characterRoleToEventView(
  role: string,
): EventParticipant['role'] {
  if (role === 'TANK') return 'tank';
  if (role === 'HEAL') return 'healer';
  if (role === 'DIST') return 'rangedDps';
  return 'meleeDps';
}

export function eventViewRoleToCharacterRole(
  r: EventParticipant['role'],
): string {
  if (r === 'tank') return 'TANK';
  if (r === 'healer') return 'HEAL';
  if (r === 'rangedDps') return 'DIST';
  return 'CAC';
}

export function characterToEventParticipant(
  c: Character,
  specLabel: string,
): EventParticipant {
  return {
    id: String(c.id),
    name: c.name,
    class: toDisplayCharacterClass(c.characterClass),
    spec: specLabel,
    role: characterRoleToEventView(c.role),
    ilvl: c.iLevel,
    hasBloodlust: c.bloodLust,
    hasBattleRez: c.battleRez,
    keyMin: c.keystoneMinLevel,
    keyMax: c.keystoneMaxLevel,
  };
}

/** New character from dialog (numeric id may be 0 until API returns). */
export function eventParticipantToCharacterForUpsert(
  p: EventParticipant,
  eventCode: string,
): Character & { eventCode: string } {
  const idNum = Number.parseInt(p.id, 10);
  const specialization = resolveSpecializationKey(p.class, p.spec);
  return {
    id: Number.isFinite(idNum) && idNum > 0 ? idNum : 0,
    name: p.name,
    characterClass: toApiCharacterClass(p.class),
    specialization,
    iLevel: p.ilvl,
    role: eventViewRoleToCharacterRole(p.role),
    bloodLust: p.hasBloodlust,
    battleRez: p.hasBattleRez,
    keystoneMinLevel: p.keyMin,
    keystoneMaxLevel: p.keyMax,
    eventCode,
  };
}

function charToSlotParticipant(
  c: Character,
  specLabel: string,
): EventParticipant {
  return {
    id: String(c.id),
    name: c.name,
    class: toDisplayCharacterClass(c.characterClass),
    spec: specLabel,
    role: characterRoleToEventView(c.role),
    ilvl: c.iLevel,
    hasBloodlust: c.bloodLust,
    hasBattleRez: c.battleRez,
    keyMin: c.keystoneMinLevel,
    keyMax: c.keystoneMaxLevel,
  };
}

export function partyToEventPartyGroup(
  party: Party,
  index: number,
  specLabel: (c: Character) => string,
): EventPartyGroup {
  const slots: (EventParticipant | null)[] = party.members.map((m) =>
    charToSlotParticipant(m, specLabel(m)),
  );
  while (slots.length < 5) slots.push(null);
  return { id: `group-${index}`, members: slots.slice(0, 5) };
}

export function partiesToEventPartyGroups(
  parties: Party[],
  specLabel: (c: Character) => string,
): EventPartyGroup[] {
  return parties.map((p, i) => partyToEventPartyGroup(p, i, specLabel));
}

/** Build party payload from server character rows + UI grid state. */
export function eventPartyGroupsToParties(
  groups: EventPartyGroup[],
  characters: Character[],
): Party[] {
  const byId = new Map(characters.map((c) => [String(c.id), c]));
  return groups.map((g) => {
    const members: Character[] = [];
    const add = (p: EventParticipant | null) => {
      if (!p) return;
      const existing = byId.get(p.id);
      if (existing) {
        members.push({ ...existing });
        return;
      }
      const idNum = Number.parseInt(p.id, 10);
      if (Number.isFinite(idNum) && idNum > 0) return;
      members.push({
        id: 0,
        name: p.name,
        characterClass: toApiCharacterClass(p.class),
        specialization: resolveSpecializationKey(p.class, p.spec),
        iLevel: p.ilvl,
        role: eventViewRoleToCharacterRole(p.role),
        bloodLust: p.hasBloodlust,
        battleRez: p.hasBattleRez,
        keystoneMinLevel: p.keyMin,
        keystoneMaxLevel: p.keyMax,
      });
    };
    g.members.forEach((m) => add(m));
    return { members };
  });
}
