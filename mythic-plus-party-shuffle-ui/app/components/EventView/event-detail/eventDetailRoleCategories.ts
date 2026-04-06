import type { LucideIcon } from 'lucide-react';
import { Crosshair, Heart, Shield, Sword } from 'lucide-react';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';

export type EventDetailRoleCategory = {
  key: 'tank' | 'healer' | 'meleeDps' | 'rangedDps';
  label: string;
  icon: LucideIcon;
  color: string;
  participants: EventParticipant[];
};

/** Role-based roster columns (admin + grid). */
export function buildEventDetailRoleCategories(
  tEv: (key: string) => string,
  participants: EventParticipant[],
): EventDetailRoleCategory[] {
  return [
    {
      key: 'tank',
      label: tEv('roles.tank'),
      icon: Shield,
      color: 'text-blue-400',
      participants: participants.filter((p) => p.role === 'tank'),
    },
    {
      key: 'healer',
      label: tEv('roles.healer'),
      icon: Heart,
      color: 'text-green-400',
      participants: participants.filter((p) => p.role === 'healer'),
    },
    {
      key: 'meleeDps',
      label: tEv('roles.meleeDps'),
      icon: Sword,
      color: 'text-red-400',
      participants: participants.filter((p) => p.role === 'meleeDps'),
    },
    {
      key: 'rangedDps',
      label: tEv('roles.rangedDps'),
      icon: Crosshair,
      color: 'text-orange-400',
      participants: participants.filter((p) => p.role === 'rangedDps'),
    },
  ];
}
