import type { Character } from '@prisma/client';

export class Party {
  id!: number;

  members: Character[] = [];
}
