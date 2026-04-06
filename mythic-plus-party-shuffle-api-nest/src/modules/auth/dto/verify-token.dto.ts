import { IsString, IsOptional } from 'class-validator';

export class VerifyTokenDto {
  @IsString()
  @IsOptional()
  token?: string;
}