import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { ConfigService } from '@nestjs/config';

export class SocketIOAdapter extends IoAdapter {
  private readonly configService: ConfigService;

  constructor(app: any) {
    super(app);
    this.configService = app.get(ConfigService);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const corsOrigin = this.configService.get<string>('cors.origin') || 'http://localhost:3000';
    
    // Fusionner les options existantes avec notre configuration CORS
    // Les options du décorateur @WebSocketGateway sont passées ici via options
    const serverOptions: ServerOptions = {
      ...options,
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
      // Forcer polling en premier - le client essaiera polling d'abord, puis websocket si disponible
      // Cela évite les erreurs "WebSocket is closed before connection" car polling est plus fiable
      transports: ['polling', 'websocket'],
      // Forcer le client à commencer par polling en refusant les connexions WebSocket directes
      // Le client devra d'abord établir une connexion polling, puis upgrade vers websocket
      allowRequest: (req, callback) => {
        // Accepter toutes les requêtes - Socket.IO gérera automatiquement le transport
        callback(null, true);
      },
      allowEIO3: true, // Compatibilité avec les anciennes versions
      // Configuration des timeouts pour éviter les erreurs de connexion
      pingTimeout: 60000, // 60 secondes de timeout pour le ping
      pingInterval: 25000, // Ping toutes les 25 secondes
      connectTimeout: 45000, // 45 secondes pour établir la connexion
      // Configuration pour gérer les upgrades WebSocket de manière plus stable
      upgradeTimeout: 30000, // 30 secondes pour l'upgrade vers WebSocket
      maxHttpBufferSize: 1e6, // 1MB pour les messages
      // Permettre les upgrades mais avec un délai pour éviter les erreurs
      allowUpgrades: true,
      // Configuration pour éviter les erreurs lors de la fermeture
      destroyUpgrade: true, // Détruire les connexions upgrade en cas d'erreur
      destroyUpgradeTimeout: 1000, // 1 seconde pour détruire les upgrades échoués
    };

    console.log('🔌 Socket.IO Adapter creating server...');
    console.log('   Port:', port);
    console.log('   CORS Origin:', corsOrigin);
    console.log('   Transports:', serverOptions.transports);
    
    const server = super.createIOServer(port, serverOptions);
    
    console.log('✅ Socket.IO server created successfully');
    
    return server;
  }
}

