import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'événement est requis' })
  name!: string;

  @IsNumber()
  @IsOptional()
  createdBy?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  admins?: number[];
}