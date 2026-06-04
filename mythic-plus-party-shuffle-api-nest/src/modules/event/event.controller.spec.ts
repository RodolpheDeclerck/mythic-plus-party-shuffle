import { EventController } from './event.controller';

function createDeps() {
  const eventService = {
    createEvent: jest.fn(),
    getAllEvents: jest.fn(),
    getEventById: jest.fn(),
    getEventByCode: jest.fn(),
    getEventsByAdmin: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getCharactersByEventCode: jest.fn(),
    setPartiesVisibility: jest.fn(),
  };
  const partyFacade = { shuffleAndSaveGroups: jest.fn() };
  const partyService = { getPartiesByEventCode: jest.fn() };
  const webSocketService = {
    emitEventUpdated: jest.fn(),
    emitPartiesUpdated: jest.fn(),
  };
  return { eventService, partyFacade, partyService, webSocketService };
}

function build(deps = createDeps()) {
  return {
    deps,
    controller: new EventController(
      deps.eventService as any,
      deps.partyFacade as any,
      deps.partyService as any,
      deps.webSocketService as any,
    ),
  };
}

describe('EventController', () => {
  describe('createEvent', () => {
    it('stamps createdBy from the request and emits the mapped response', async () => {
      const { deps, controller } = build();
      deps.eventService.createEvent.mockResolvedValue({
        id: 1,
        code: 'C',
        name: 'E',
        arePartiesVisible: true,
      });

      const result = await controller.createEvent(
        {} as any,
        { user: { id: 42 } } as any,
      );

      expect(deps.eventService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 42 }),
      );
      // mapEventToResponse exposes both DB name and frontend alias
      expect(result.arePartiesVisible).toBe(true);
      expect(result.visible).toBe(true);
      expect(deps.webSocketService.emitEventUpdated).toHaveBeenCalledWith(result);
    });
  });

  describe('getAllEvents', () => {
    it('returns a single mapped event when a code is supplied', async () => {
      const { deps, controller } = build();
      deps.eventService.getEventByCode.mockResolvedValue({
        id: 1,
        code: 'C',
        name: 'E',
      });

      const result = await controller.getAllEvents('C');

      expect(deps.eventService.getEventByCode).toHaveBeenCalledWith('C');
      expect(result.code).toBe('C');
      expect(deps.eventService.getAllEvents).not.toHaveBeenCalled();
    });

    it('throws when the code matches no event', async () => {
      const { deps, controller } = build();
      deps.eventService.getEventByCode.mockResolvedValue(null);

      await expect(controller.getAllEvents('C')).rejects.toThrow(
        'Event not found',
      );
    });

    it('maps every event when no code is supplied', async () => {
      const { deps, controller } = build();
      deps.eventService.getAllEvents.mockResolvedValue([
        { id: 1, code: 'A', name: 'A' },
        { id: 2, code: 'B', name: 'B' },
      ]);

      const result = await controller.getAllEvents();

      expect(result).toHaveLength(2);
      expect(result[0].visible).toBe(false);
    });
  });

  describe('shuffleParties', () => {
    it('delegates to the facade and broadcasts the result', async () => {
      const { deps, controller } = build();
      const parties = [{ id: 1 }, { id: 2 }];
      deps.partyFacade.shuffleAndSaveGroups.mockResolvedValue(parties);

      const result = await controller.shuffleParties('C');

      expect(deps.partyFacade.shuffleAndSaveGroups).toHaveBeenCalledWith('C');
      expect(deps.webSocketService.emitPartiesUpdated).toHaveBeenCalledWith(
        parties,
      );
      expect(result).toBe(parties);
    });
  });

  describe('deleteEvent', () => {
    it('deletes then emits an event-updated with no payload', async () => {
      const { deps, controller } = build();

      await controller.deleteEvent('C');

      expect(deps.eventService.deleteEvent).toHaveBeenCalledWith('C');
      expect(deps.webSocketService.emitEventUpdated).toHaveBeenCalledWith();
    });
  });

  describe('setPartiesVisibility', () => {
    it('persists, maps and emits the visibility change', async () => {
      const { deps, controller } = build();
      deps.eventService.setPartiesVisibility.mockResolvedValue({
        id: 1,
        code: 'C',
        name: 'E',
        arePartiesVisible: false,
      });

      const result = await controller.setPartiesVisibility('C', {
        visible: false,
      } as any);

      expect(deps.eventService.setPartiesVisibility).toHaveBeenCalledWith(
        'C',
        false,
      );
      expect(result.visible).toBe(false);
      expect(deps.webSocketService.emitEventUpdated).toHaveBeenCalledWith(result);
    });
  });
});
