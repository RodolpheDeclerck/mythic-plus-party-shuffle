import { WebSocketService } from './websocket.service';

function createGateway() {
  return {
    emitEventUpdated: jest.fn(),
    emitPartiesUpdated: jest.fn(),
    emitCharacterUpdated: jest.fn(),
  };
}

describe('WebSocketService', () => {
  it('delegates emitEventUpdated to the gateway', () => {
    const gateway = createGateway();
    const service = new WebSocketService(gateway as any);

    service.emitEventUpdated({ id: 1 });

    expect(gateway.emitEventUpdated).toHaveBeenCalledWith({ id: 1 });
  });

  it('delegates emitPartiesUpdated to the gateway', () => {
    const gateway = createGateway();
    const service = new WebSocketService(gateway as any);

    service.emitPartiesUpdated(['p']);

    expect(gateway.emitPartiesUpdated).toHaveBeenCalledWith(['p']);
  });

  it('delegates emitCharacterUpdated to the gateway', () => {
    const gateway = createGateway();
    const service = new WebSocketService(gateway as any);

    service.emitCharacterUpdated();

    expect(gateway.emitCharacterUpdated).toHaveBeenCalledTimes(1);
  });
});
