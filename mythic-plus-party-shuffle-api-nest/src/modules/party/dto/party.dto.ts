import {
  IsArray,
  IsNumber,
  ValidateNested,
  IsOptional,
  ArrayMinSize,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PartyMemberDto {
  @IsNumber()
  id!: number;

  // Accepter aussi les objets Character complets (pour compatibilité)
  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  name?: string;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  characterClass?: string;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  specialization?: string;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  iLevel?: number;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  role?: string;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  bloodLust?: boolean;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  battleRez?: boolean;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  keystoneMinLevel?: number;

  @ValidateIf((o) => typeof o === 'object' && o !== null)
  @IsOptional()
  keystoneMaxLevel?: number;
}

export class PartyDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Une party doit contenir au moins un membre' })
  @Transform(({ value }) => {
    // Transformer les membres pour accepter soit { id: number } soit des objets Character complets
    if (!Array.isArray(value)) return value;
    return value.map((member) => {
      // Si c'est déjà un objet avec juste id, le retourner tel quel
      if (typeof member === 'object' && member !== null && 'id' in member) {
        return member;
      }
      // Si c'est un nombre, le transformer en objet
      if (typeof member === 'number') {
        return { id: member };
      }
      // Sinon retourner tel quel (sera validé par la validation)
      return member;
    });
  })
  @ValidateNested({ each: true })
  @Type(() => PartyMemberDto)
  members!: PartyMemberDto[];
}

export class CreateOrUpdatePartiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyDto)
  @IsNotEmpty({ message: 'La liste des parties ne peut pas être vide' })
  parties!: PartyDto[];
}
