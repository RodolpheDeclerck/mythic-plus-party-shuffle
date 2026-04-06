import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password!: string;
}