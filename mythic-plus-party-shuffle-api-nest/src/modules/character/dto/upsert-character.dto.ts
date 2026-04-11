// src/modules/character/dto/upsert-character.dto.ts
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { CharacterClass, Specialization } from '../../../../generated/prisma/client';

export class UpsertCharacterDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CharacterClass)
  characterClass?: CharacterClass;

  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;

  @IsOptional()
  @IsNumber()
  @Min(1)
  iLevel?: number;

  @IsOptional()
  @IsString()
  eventCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(2)
  keystoneMinLevel?: number;

  @IsOptional()
  @IsNumber()
  @Max(99)
  keystoneMaxLevel?: number;
}