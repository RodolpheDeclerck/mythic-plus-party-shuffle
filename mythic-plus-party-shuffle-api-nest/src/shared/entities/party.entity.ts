import { Character } from './character.entity';

export class Party {
  id!: number;

  members: Character[] = [];
}
