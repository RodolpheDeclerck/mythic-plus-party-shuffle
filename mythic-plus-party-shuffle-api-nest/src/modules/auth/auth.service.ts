import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../shared/entities/user.entity';
import { LoginDto, RegisterDto } from './dto';
import { random, authentication } from '../../shared/helpers';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'username', 'password', 'salt'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expectedHash = authentication(user.salt, password);
    if (user.password !== expectedHash) {
      throw new UnauthorizedException('Invalid credentials');
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

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const salt = random();
    const hashedPassword = authentication(salt, password);

    const newUser = this.userRepository.create({
      email,
      username,
      salt,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);

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

  async validateUser(userId: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username'],
    });

    return user || null;
  }

  private generateToken(user: User): string {
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
      expiresIn: expiresIn as any, // ← Cast pour éviter l'erreur de type
    });
  }
}