import type { Character } from '../../../generated/prisma/client';

export class Party {
  id!: number;

  members: Character[] = [];
}
