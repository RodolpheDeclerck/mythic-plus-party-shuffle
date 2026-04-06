import { IsNumber, IsNotEmpty, IsArray } from 'class-validator';

export class DeleteCharactersDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  ids!: number[];
}