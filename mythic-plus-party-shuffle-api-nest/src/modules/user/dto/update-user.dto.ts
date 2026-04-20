import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
  })
  @IsNotEmpty({ message: "Le nom d'utilisateur est requis" })
  username!: string;
}
