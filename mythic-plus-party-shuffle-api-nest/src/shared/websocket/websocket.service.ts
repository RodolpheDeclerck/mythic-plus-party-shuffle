import { Injectable } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  constructor(private webSocketGateway: AppWebSocketGateway) {}

  emitEventUpdated(event?: any) {
    this.webSocketGateway.emitEventUpdated(event);
  }

  emitPartiesUpdated(parties?: any) {
    this.webSocketGateway.emitPartiesUpdated(parties);
  }

  emitCharacterUpdated() {
    this.webSocketGateway.emitCharacterUpdated();
  }
}
