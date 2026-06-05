import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CharacterClass, Specialization } from '@prisma/client';
import { TokenVaultService } from './token-vault.service';
import { resolveCharacterClass, resolveSpecialization } from './blizzard-id-maps';
import { UnmappableBlizzardCharacterException } from './errors';

/** A lightweight roster entry from the Account Profile Summary (no spec/iLevel). */
export interface RosterCharacter {
  name: string;
  realmSlug: string;
  realmName: string;
  characterClass: CharacterClass;
  level: number;
}

/** A character enriched from the Character Profile Summary (spec + iLevel). */
export interface EnrichedCharacter {
  name: string;
  realmSlug: string;
  characterClass: CharacterClass;
  specialization: Specialization;
  iLevel: number;
}

@Injectable()
export class BlizzardService {
  private readonly logger = new Logger(BlizzardService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tokenVault: TokenVaultService,
  ) {}

  /**
   * Lists the user's WoW characters from the Account Profile Summary.
   * Characters whose class id we cannot map are skipped (logged), so a single
   * unknown class never breaks the whole roster.
   */
  async getCharacters(authToken: string, userId: number): Promise<RosterCharacter[]> {
    const data = await this.blizzardGet('/profile/user/wow', authToken, userId);

    const wowAccounts: any[] = Array.isArray(data?.wow_accounts)
      ? data.wow_accounts
      : [];

    const roster: RosterCharacter[] = [];
    for (const account of wowAccounts) {
      for (const c of account?.characters ?? []) {
        const characterClass = resolveCharacterClass(c?.playable_class?.id);
        if (!characterClass) {
          this.logger.warn(
            `Skipping character with unmapped class id ${c?.playable_class?.id}`,
          );
          continue;
        }
        roster.push({
          name: c.name,
          realmSlug: c.realm?.slug,
          realmName: c.realm?.name,
          characterClass,
          level: c.level,
        });
      }
    }
    return roster;
  }

  /**
   * Enriches a single character with its specialization and item level from the
   * Character Profile Summary. Rejects unmapped class/spec ids so we never
   * register a character with a wrong specialization.
   */
  async getCharacter(
    authToken: string,
    userId: number,
    realmSlug: string,
    name: string,
  ): Promise<EnrichedCharacter> {
    const path = `/profile/wow/character/${encodeURIComponent(
      realmSlug.toLowerCase(),
    )}/${encodeURIComponent(name.toLowerCase())}`;

    const data = await this.blizzardGet(path, authToken, userId);

    return this.mapToCharacter({
      name: data?.name ?? name,
      realmSlug: data?.realm?.slug ?? realmSlug,
      classId: data?.character_class?.id,
      specId: data?.active_spec?.id,
      averageItemLevel: data?.average_item_level,
    });
  }

  /** Maps a Blizzard payload to our character shape, rejecting unknown ids. */
  mapToCharacter(input: {
    name: string;
    realmSlug: string;
    classId?: number;
    specId?: number;
    averageItemLevel?: number;
  }): EnrichedCharacter {
    const characterClass = resolveCharacterClass(input.classId);
    if (!characterClass) {
      throw new UnmappableBlizzardCharacterException(
        `Unknown class id ${input.classId} for ${input.name}`,
      );
    }
    const specialization = resolveSpecialization(input.specId);
    if (!specialization) {
      throw new UnmappableBlizzardCharacterException(
        `Unknown specialization id ${input.specId} for ${input.name}`,
      );
    }
    return {
      name: input.name,
      realmSlug: input.realmSlug,
      characterClass,
      specialization,
      iLevel: Math.round(Number(input.averageItemLevel) || 0),
    };
  }

  private async blizzardGet(
    path: string,
    authToken: string,
    userId: number,
  ): Promise<any> {
    const blizzardToken = await this.tokenVault.getBlizzardToken(authToken, userId);
    const host = this.config.get<string>('blizzard.apiHost');
    const namespace = this.config.get<string>('blizzard.namespace');
    const locale = this.config.get<string>('blizzard.locale');

    const url = `${host}${path}?namespace=${namespace}&locale=${locale}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { authorization: `Bearer ${blizzardToken}` },
      });
    } catch (e) {
      this.logger.error(`Blizzard request failed: ${(e as Error).message}`);
      throw new InternalServerErrorException('Blizzard request failed');
    }

    if (response.status === 404) {
      throw new NotFoundException('Character not found on Blizzard');
    }
    if (!response.ok) {
      this.logger.warn(`Blizzard API responded ${response.status} for ${path}`);
      throw new InternalServerErrorException('Blizzard API error');
    }

    try {
      return await response.json();
    } catch {
      throw new InternalServerErrorException('Invalid Blizzard response');
    }
  }
}
