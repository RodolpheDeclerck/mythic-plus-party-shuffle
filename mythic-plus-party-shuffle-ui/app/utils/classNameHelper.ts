import { cn } from '@/lib/utils';

/** RAID_CLASS_COLORS (backgrounds) — https://warcraft.wiki.gg/wiki/Class_colors */
const WOW_CLASS: Record<string, string> = {
  warrior: 'bg-[#C69B6D] text-black',
  deathknight: 'bg-[#C41E3A] text-white',
  paladin: 'bg-[#F48CBA] text-black',
  monk: 'bg-[#00FF98] text-black',
  priest: 'bg-white text-black',
  mage: 'bg-[#3FC7EB] text-black',
  druid: 'bg-[#FF7C0A] text-black',
  rogue: 'bg-[#FFF468] text-black',
  hunter: 'bg-[#AAD372] text-black',
  demonhunter: 'bg-[#A330C9] text-white',
  warlock: 'bg-[#8788EE] text-black',
  evoker: 'bg-[#33937F] text-white',
  shaman: 'bg-[#0070DD] text-white',
};

function normalizeClassKey(characterClass: string): string {
  return characterClass.toLowerCase().replace(/\s+/g, '');
}

export function getCharacterCellClass(characterClass: string): string {
  const key = normalizeClassKey(characterClass);
  return cn(
    'border-b border-white/10 px-2 py-2 text-center align-middle text-sm font-semibold',
    WOW_CLASS[key] ?? 'bg-card/70 text-foreground',
  );
}
