import { CharacterClass } from './CharacterClass';

/** RAID_CLASS_COLORS — https://warcraft.wiki.gg/wiki/Class_colors */
export const CharacterClassColors: { [key in CharacterClass]: string } = {
  [CharacterClass.Warrior]: '#C69B6D',
  [CharacterClass.Deathknight]: '#C41E3A',
  [CharacterClass.Paladin]: '#F48CBA',
  [CharacterClass.Monk]: '#00FF98',
  [CharacterClass.Priest]: '#FFFFFF',
  [CharacterClass.Mage]: '#3FC7EB',
  [CharacterClass.Druid]: '#FF7C0A',
  [CharacterClass.Rogue]: '#FFF468',
  [CharacterClass.Hunter]: '#AAD372',
  [CharacterClass.DemonHunter]: '#A330C9',
  [CharacterClass.Warlock]: '#8788EE',
  [CharacterClass.Evoker]: '#33937F',
  [CharacterClass.Shaman]: '#0070DD',
};
