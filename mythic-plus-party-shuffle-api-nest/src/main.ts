import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { SocketIOAdapter } from './shared/websocket/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurer l'adapter Socket.IO personnalisé pour gérer CORS dynamiquement
  app.useWebSocketAdapter(new SocketIOAdapter(app));
  
  const configService = app.get(ConfigService);
  
  app.use(cookieParser());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          return Object.values(constraints).join(', ');
        });
        return new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: messages,
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );
  
  // Configuration CORS pour accepter les connexions depuis le frontend
  const corsOrigin = configService.get('cors.origin') || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  console.log('CORS configured for origin:', corsOrigin);
  
  const port = configService.get<number>('port') || 8080;
  
  await app.listen(port);
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`WebSocket server is ready on ws://localhost:${port}`);
}
bootstrap();