import { User } from '../../shared/entities/user.entity';

declare module 'express' {
  export interface Request {
    user?: {
      id: number;
      email: string;
      username: string;
    };
  }
}