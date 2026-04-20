// src/modules/character/dto/create-character.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { CharacterClass, Specialization } from '@prisma/client';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(CharacterClass)
  @IsNotEmpty()
  characterClass!: CharacterClass;

  @IsEnum(Specialization)
  @IsNotEmpty()
  specialization!: Specialization;

  @IsNumber()
  @IsNotEmpty()
  iLevel!: number;

  @IsOptional()
  @IsString()
  eventCode?: string; // ✅ Optionnel comme dans Express

  @IsNumber()
  keystoneMinLevel!: number;

  @IsNumber()
  keystoneMaxLevel!: number;
}
