import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  currentPassword!: string;

  @IsString()
  @MinLength(10, { message: 'Le nouveau mot de passe doit contenir au moins 10 caractères' })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  newPassword!: string;
}
