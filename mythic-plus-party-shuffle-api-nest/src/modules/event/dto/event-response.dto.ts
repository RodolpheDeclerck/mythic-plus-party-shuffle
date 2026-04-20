export class EventResponseDto {
  id!: number;
  code!: string;
  name!: string;
  createdAt!: Date;
  expiresAt!: Date;
  updatedAt!: Date;
  arePartiesVisible!: boolean;
  createdBy?: any;
  admins?: any[];
  characters?: any[];
}
