import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit, // ← Ajouter cette interface
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  // CORS est configuré dynamiquement via SocketIOAdapter dans main.ts
  // Ne pas définir cors ici pour éviter les conflits avec l'adapter
  // L'adapter configure polling en premier, puis websocket
  transports: ['polling', 'websocket'],
})
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppWebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private configService: ConfigService) {}

  afterInit(server: Server) {
    const corsOrigin = this.configService.get<string>('cors.origin') || 'http://localhost:3000';
    const decoratorCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    // Vérifier que la configuration CORS du décorateur correspond à celle du serveur HTTP
    // Note: Socket.IO vérifie CORS lors de la poignée de main initiale, donc la valeur
    // dans le décorateur doit correspondre à celle utilisée par le serveur HTTP
    if (decoratorCorsOrigin !== corsOrigin) {
      this.logger.warn(
        `CORS origin mismatch: decorator=${decoratorCorsOrigin} server=${corsOrigin}; check CORS_ORIGIN`,
      );
    }
    
    // Écouter les erreurs de connexion (mais ignorer les erreurs de déconnexion rapide)
    server.engine.on('connection_error', (err) => {
      // Ignorer les erreurs de déconnexion rapide (c'est normal avec React Strict Mode)
      if (err.message && err.message.includes('closed before')) {
        // C'est une déconnexion rapide normale, ne pas logger comme erreur
        return;
      }
      this.logger.error(
        `Socket.IO connection error: ${err.message} origin=${err.req?.headers?.origin ?? 'n/a'}`,
      );
    });
    
    // Écouter les tentatives de connexion WebSocket (pour debug uniquement)
    server.engine.on('upgrade', () => {});
    
    // Écouter les erreurs de transport WebSocket (mais ignorer les déconnexions rapides)
    server.engine.on('upgrade_error', (err) => {
      // Ignorer les erreurs de déconnexion rapide
      if (err.message && err.message.includes('closed before')) {
        return;
      }
      this.logger.warn(`WebSocket upgrade error (fallback to polling): ${err.message}`);
    });

    this.logger.log(
      `WebSocket gateway ready; CORS config=${corsOrigin} decoratorEnv=${decoratorCorsOrigin}`,
    );
  }

  handleConnection(client: Socket) {
    const corsOrigin = this.configService.get<string>('cors.origin') || 'http://localhost:3000';
    const clientOrigin = client.handshake.headers.origin;
    
    this.logger.log(
      `WebSocket client connected id=${client.id} transport=${client.conn.transport.name} origin=${clientOrigin ?? 'n/a'}`,
    );

    if (clientOrigin && clientOrigin !== corsOrigin) {
      this.logger.warn(`Client origin ${clientOrigin} does not match CORS ${corsOrigin}`);
    }
    
    // Envoyer un message de bienvenue pour maintenir la connexion active
    client.emit('connected', { message: 'WebSocket connection established', clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    // Ne pas logger les déconnexions normales (rafraîchissement de page, navigation)
    // pour éviter le bruit dans les logs
    const disconnectReason = client.disconnected ? 'Client disconnected' : 'Connection lost';
    const transport = client.conn?.transport?.name || 'unknown';
    const readyState = client.conn?.readyState || 'unknown';
    
    // Ne logger que les déconnexions inattendues (pas les déconnexions rapides normales)
    if (readyState === 'open' || transport === 'websocket') {
      this.logger.debug(
        `WebSocket client disconnected id=${client.id} reason=${disconnectReason} transport=${transport}`,
      );
    }
    // Les déconnexions rapides (CONNECTING state) sont silencieuses - c'est normal avec React Strict Mode
  }

  emitEventUpdated(event?: any) {
    if (event) {
      this.logger.debug(
        `WebSocket emit event-updated code=${event.code ?? 'n/a'} visible=${event.visible} arePartiesVisible=${event.arePartiesVisible}`,
      );
      this.logger.debug(`WebSocket event-updated payload: ${JSON.stringify(event)}`);
    } else {
      this.logger.debug('WebSocket emit event-updated (no payload)');
    }
    this.server.emit('event-updated', event);
  }

  emitPartiesUpdated(parties?: any) {
    if (parties) {
      this.logger.log(`WebSocket emit parties-updated count=${parties.length}`);
      this.logger.debug(`WebSocket parties-updated sample: ${JSON.stringify(parties[0])}`);
    } else {
      this.logger.debug('WebSocket emit parties-updated (no payload)');
    }
    this.server.emit('parties-updated', parties);
  }

  emitCharacterUpdated() {
    this.server.emit('character-updated');
    this.logger.debug('WebSocket emit character-updated');
  }
}