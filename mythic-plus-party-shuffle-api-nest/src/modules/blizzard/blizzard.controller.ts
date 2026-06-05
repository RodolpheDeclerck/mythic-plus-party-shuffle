import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlizzardService } from './blizzard.service';

@Controller('api/blizzard')
@UseGuards(JwtAuthGuard)
export class BlizzardController {
  constructor(private readonly blizzardService: BlizzardService) {}

  // Fixed route declared before the parameterized one.
  @Get('characters')
  async getCharacters(@Req() req: Request) {
    const { token, userId } = this.requireAuth(req);
    return this.blizzardService.getCharacters(token, userId);
  }

  @Get('characters/:realm/:name')
  async getCharacter(
    @Req() req: Request,
    @Param('realm') realm: string,
    @Param('name') name: string,
  ) {
    const { token, userId } = this.requireAuth(req);
    return this.blizzardService.getCharacter(token, userId, realm, name);
  }

  private requireAuth(req: Request): {
    token: string;
    userId: number;
  } {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const userId = req.user?.id;
    if (!token || userId === undefined) {
      throw new UnauthorizedException('Missing authentication');
    }
    return { token, userId };
  }
}
