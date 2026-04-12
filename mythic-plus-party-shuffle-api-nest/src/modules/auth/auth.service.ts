import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateByOidcSub(sub: string, email: string, username: string) {
    const existing = await this.prisma.user.findUnique({
      where: { oidcSub: sub },
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.user.create({
      data: {
        oidcSub: sub,
        email,
        username,
      },
    });
  }

  async validateUser(userId: number) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });
  }
}
