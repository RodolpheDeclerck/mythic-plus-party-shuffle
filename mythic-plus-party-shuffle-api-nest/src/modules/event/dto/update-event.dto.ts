import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  admins?: number[];
}