import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { CharacterClass } from '../../../shared/enums/characterClass.enum';
import { Specialization } from '../../../shared/enums/specialization.enum';

export class UpdateCharacterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CharacterClass)
  @IsOptional()
  characterClass?: CharacterClass;

  @IsEnum(Specialization)
  @IsOptional()
  specialization?: Specialization;

  @IsNumber()
  @Min(1)
  @IsOptional()
  iLevel?: number;

  @IsString()
  @IsOptional()
  eventCode?: string;

  @IsNumber()
  @Min(2)
  @IsOptional()
  keystoneMinLevel?: number;

  @IsNumber()
  @Max(99)
  @IsOptional()
  keystoneMaxLevel?: number;
}