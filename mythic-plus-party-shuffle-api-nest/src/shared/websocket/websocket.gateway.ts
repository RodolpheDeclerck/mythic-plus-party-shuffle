import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit, // ← Ajouter cette interface
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  // CORS est configuré dynamiquement via SocketIOAdapter dans main.ts
  // Ne pas définir cors ici pour éviter les conflits avec l'adapter
  // L'adapter configure polling en premier, puis websocket
  transports: ['polling', 'websocket'],
})
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  //                                                                  ↑ Ajouter OnGatewayInit ici
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
      console.warn('⚠️  WARNING: CORS origin mismatch detected!');
      console.warn(`   Decorator CORS origin: ${decoratorCorsOrigin}`);
      console.warn(`   HTTP Server CORS origin: ${corsOrigin}`);
      console.warn('   This may cause WebSocket connection failures.');
      console.warn('   Ensure CORS_ORIGIN environment variable matches your configuration.');
    }
    
    // Écouter les erreurs de connexion (mais ignorer les erreurs de déconnexion rapide)
    server.engine.on('connection_error', (err) => {
      // Ignorer les erreurs de déconnexion rapide (c'est normal avec React Strict Mode)
      if (err.message && err.message.includes('closed before')) {
        // C'est une déconnexion rapide normale, ne pas logger comme erreur
        return;
      }
      console.error('❌ Socket.IO connection error:', err.message);
      console.error('   Details:', err.context);
      console.error('   Request origin:', err.req?.headers?.origin);
    });
    
    // Écouter les tentatives de connexion WebSocket (pour debug uniquement)
    server.engine.on('upgrade', (req, socket, head) => {
      // Log silencieux - seulement pour debug si nécessaire
      // console.log('🔄 WebSocket upgrade attempt from:', req.headers.origin);
    });
    
    // Écouter les erreurs de transport WebSocket (mais ignorer les déconnexions rapides)
    server.engine.on('upgrade_error', (err) => {
      // Ignorer les erreurs de déconnexion rapide
      if (err.message && err.message.includes('closed before')) {
        return;
      }
      console.warn('⚠️  WebSocket upgrade error (client will fallback to polling):', err.message);
    });
    
    console.log('✅ WebSocket Gateway initialized');
    console.log('   CORS Origin (from config):', corsOrigin);
    console.log('   CORS Origin (from decorator):', decoratorCorsOrigin);
    console.log('   Server ready');
  }

  handleConnection(client: Socket) {
    const corsOrigin = this.configService.get<string>('cors.origin') || 'http://localhost:3000';
    const clientOrigin = client.handshake.headers.origin;
    
    console.log('✅ New WebSocket client connected:', client.id);
    console.log('   Client Origin:', clientOrigin);
    console.log('   Expected CORS Origin:', corsOrigin);
    console.log('   Transport:', client.conn.transport.name);
    
    if (clientOrigin && clientOrigin !== corsOrigin) {
      console.warn('⚠️  Warning: Client origin does not match configured CORS origin');
      console.warn('   This may cause connection issues. Verify CORS configuration.');
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
      console.log('🔌 WebSocket client disconnected:', client.id);
      console.log('   Reason:', disconnectReason);
      console.log('   Transport was:', transport);
    }
    // Les déconnexions rapides (CONNECTING state) sont silencieuses - c'est normal avec React Strict Mode
  }

  emitEventUpdated(event?: any) {
    if (event) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📢 [WebSocket] Emitting: event-updated');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 [WebSocket] Full event data:');
      console.log(JSON.stringify(event, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👁️  [WebSocket] arePartiesVisible:', event.arePartiesVisible);
      console.log('👁️  [WebSocket] visible:', event.visible);
      console.log('👁️  [WebSocket] visible type:', typeof event.visible);
      console.log('👁️  [WebSocket] visible === true?', event.visible === true);
      console.log('👁️  [WebSocket] visible === false?', event.visible === false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('📢 [WebSocket] Emitted: event-updated (no event data)');
    }
    this.server.emit('event-updated', event);
  }

  emitPartiesUpdated(parties?: any) {
    if (parties) {
      console.log(`📢 Emitted: parties-updated with ${parties.length} parties`);
      console.log('📦 First party sample:', JSON.stringify(parties[0], null, 2));
    } else {
      console.log('📢 Emitted: parties-updated (no parties data)');
    }
    this.server.emit('parties-updated', parties);
  }

  emitCharacterUpdated() {
    this.server.emit('character-updated');
    console.log('📢 Emitted: character-updated');
  }
}