// src/modules/character/dto/create-character.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CharacterClass } from '../../../shared/enums/characterClass.enum';
import { Specialization } from '../../../shared/enums/specialization.enum';

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