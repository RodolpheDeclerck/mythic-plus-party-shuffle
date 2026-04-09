import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../shared/entities/user.entity';
import { LoginDto, RegisterDto } from './dto';
import { PasswordHashingService } from './password-hashing.service';
import { PasswordPolicyService } from './password-policy.service';

export const PASSWORD_POLICY_OUTDATED_CODE = 'password_policy_outdated';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private passwordHashingService: PasswordHashingService,
    private passwordPolicyService: PasswordPolicyService,
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

    const check = await this.passwordHashingService.verify(user.password, user.salt, password);
    if (!check.valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Enforce current password policy on login. Pre-existing accounts whose
    // password no longer meets the policy must use POST /auth/change-password
    // (or a manual reset) before they can sign in again.
    try {
      this.passwordPolicyService.validateSync(password);
    } catch {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Password policy outdated',
        code: PASSWORD_POLICY_OUTDATED_CODE,
      });
    }

    if (check.upgrade) {
      user.password = check.upgrade.password;
      user.salt = check.upgrade.salt;
      await this.userRepository.save(user);
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

    // Validate the password policy first (cheaper and avoids exposing email
    // existence via timing or DB error paths).
    await this.passwordPolicyService.validate(password);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const { password: hashedPassword, salt } = await this.passwordHashingService.hashPassword(password);

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

  /**
   * Authenticated password change. Verifies the current password, enforces the
   * full policy (including HIBP if enabled) on the new one, then re-hashes
   * with Argon2id.
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'password', 'salt'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const check = await this.passwordHashingService.verify(user.password, user.salt, currentPassword);
    if (!check.valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.passwordPolicyService.validate(newPassword);

    const { password: hashedPassword, salt } = await this.passwordHashingService.hashPassword(newPassword);
    user.password = hashedPassword;
    user.salt = salt;
    await this.userRepository.save(user);

    return { message: 'Password updated' };
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