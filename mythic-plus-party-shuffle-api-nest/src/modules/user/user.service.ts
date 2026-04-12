import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateUserDto } from './dto';
import { Prisma } from '@prisma/client';

const userPublicSelect = {
  id: true,
  email: true,
  username: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return await this.prisma.user.findMany({
      select: userPublicSelect,
    });
  }

  async getUserById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { username: updateUserDto.username },
        select: userPublicSelect,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }
}
