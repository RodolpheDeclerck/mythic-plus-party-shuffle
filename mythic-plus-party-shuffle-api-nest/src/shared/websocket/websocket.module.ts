import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ← Ajouter cet import
import { AppWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [ConfigModule], // ← Ajouter cette ligne si le Gateway utilise ConfigService
  providers: [AppWebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
