import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      console.log('❌ JwtAuthGuard - Authentication failed');
      console.log('   Error:', err?.message);
      console.log('   Info:', info?.message);
      console.log('   Cookies:', request?.cookies);
      console.log('   Authorization header:', request?.headers?.authorization);
      throw err || new UnauthorizedException('Authentication failed');
    }
    
    console.log('✅ JwtAuthGuard - User authenticated:', user.id);
    return user;
  }
}