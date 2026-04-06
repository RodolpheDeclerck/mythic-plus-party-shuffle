import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyTokenDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    const isProduction = this.configService.get('nodeEnv') === 'production';
    const domain = this.configService.get('domain');

    res.cookie('session', result.token, {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      domain: domain || undefined,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);

    const isProduction = this.configService.get('nodeEnv') === 'production';
    const domain = this.configService.get('domain');

    res.cookie('session', result.token, {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      domain: domain || undefined,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  @Post('verify-token') // ← Route corrigée
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto, @Req() req: Request) {
    const token = verifyTokenDto.token || req.cookies?.session || 
                  req.headers.authorization?.split(' ')[1];

    if (!token) {
      return {
        message: 'Token manquant',
        isAuthenticated: false,
      };
    }

    return await this.authService.verifyToken(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    const domain = this.configService.get('domain');

    res.clearCookie('session', {
      path: '/',
      domain: domain || undefined,
    });

    return { message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request) {
    return req.user;
  }
}