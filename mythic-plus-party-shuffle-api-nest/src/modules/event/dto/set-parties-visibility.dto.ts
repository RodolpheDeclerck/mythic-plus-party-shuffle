import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SetPartiesVisibilityDto {
  @IsBoolean({ message: 'visible doit être un booléen' })
  @IsNotEmpty({ message: 'visible est requis' })
  visible!: boolean;
}