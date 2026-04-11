import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { PasswordHashingService } from './password-hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private passwordHashingService: PasswordHashingService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, password: true, salt: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const check = await this.passwordHashingService.verify(user.password, user.salt, password);
    if (!check.valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (check.upgrade) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: check.upgrade.password, salt: check.upgrade.salt },
      });
    }

    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const { password: hashedPassword, salt } = await this.passwordHashingService.hashPassword(password);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        username,
        salt,
        password: hashedPassword,
      },
      select: { id: true, email: true, username: true },
    });

    const token = this.generateToken(newUser);

    return {
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
      token,
    };
  }

  async verifyToken(token: string) {
    try {
      const jwtSecret = this.configService.get<string>('jwt.secret');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const decoded = this.jwtService.verify(token, { secret: jwtSecret });
      return {
        message: 'Token valide',
        isAuthenticated: true,
        user: decoded,
      };
    } catch (error) {
      return {
        message: 'Token invalide ou expiré',
        isAuthenticated: false,
      };
    }
  }

  async validateUser(userId: number) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });
  }

  private generateToken(user: { id: number; email: string }): string {
    const jwtSecret = this.configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '24h';

    return this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: expiresIn as any,
    });
  }
}
