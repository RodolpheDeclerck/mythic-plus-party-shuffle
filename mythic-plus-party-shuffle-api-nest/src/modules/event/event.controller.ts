import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto, SetPartiesVisibilityDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventAdminGuard } from './guards/event-admin.guard';
import { PartyFacade } from '../../shared/facade/party.facade';
import { PartyService } from '../party/party.service';
import { WebSocketService } from '../../shared/websocket/websocket.service';

@Controller('api/events')
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(
    private eventService: EventService,
    private partyFacade: PartyFacade,
    private partyService: PartyService,
    private webSocketService: WebSocketService,
  ) {}

  /**
   * Map event to a plain response object with frontend-compatible fields.
   */
  private mapEventToResponse(event: any): any {
    const arePartiesVisibleValue = Boolean(event.arePartiesVisible ?? false);

    // Créer un objet simple avec toutes les propriétés primitives d'abord
    const response: any = {
      id: Number(event.id),
      code: String(event.code),
      name: String(event.name),
      createdAt: event.createdAt ? new Date(event.createdAt) : null,
      expiresAt: event.expiresAt ? new Date(event.expiresAt) : null,
      updatedAt: event.updatedAt ? new Date(event.updatedAt) : null,
      arePartiesVisible: arePartiesVisibleValue, // Nom de la colonne DB
      visible: arePartiesVisibleValue, // Alias pour le frontend (compatibilité) - IMPORTANT!
    };

    // Include relations if loaded
    if (event.createdBy) {
      response.createdBy = {
        id: event.createdBy.id,
        username: event.createdBy.username,
        email: event.createdBy.email,
      };
    }
    if (event.admins && Array.isArray(event.admins)) {
      response.admins = event.admins.map((admin: any) => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
      }));
    }
    if (event.characters && Array.isArray(event.characters)) {
      response.characters = event.characters;
    }

    // Log pour vérifier que visible est bien présent
    if (!response.hasOwnProperty('visible')) {
      this.logger.warn(
        '[mapEventToResponse] visible property missing after map',
      );
    }

    return response;
  }

  // ✅ Protégée : isAuthenticated
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    createEventDto.createdBy = req.user.id;
    const event = await this.eventService.createEvent(createEventDto);
    const response = this.mapEventToResponse(event);
    this.webSocketService.emitEventUpdated(response);
    return response;
  }

  // ✅ Publique
  @Get()
  async getAllEvents(@Query('code') code?: string) {
    // Si un code est fourni, retourner un seul événement (compatibilité avec l'ancien frontend)
    if (code) {
      this.logger.debug(`[GET] getAllEvents code=${code}`);
      const event = await this.eventService.getEventByCode(code);
      if (!event) {
        throw new Error('Event not found');
      }
      const response = this.mapEventToResponse(event);
      this.logger.debug(
        `[GET] getAllEvents code=${code} arePartiesVisible=${response.arePartiesVisible} visible=${response.visible}`,
      );
      return response;
    }
    // Sinon, retourner tous les événements
    const events = await this.eventService.getAllEvents();
    return events.map((event) => this.mapEventToResponse(event));
  }

  // ✅ Protégée : isAuthenticated
  @Get('admin-events')
  @UseGuards(JwtAuthGuard)
  async getAdminEvents(@Req() req: any) {
    const events = await this.eventService.getEventsByAdmin(req.user.id);
    return events.map((event) => this.mapEventToResponse(event));
  }

  // ✅ Publique
  @Get('query/by-code')
  async getEventByCodeQuery(@Query('code') code: string) {
    if (!code) {
      throw new Error('Code is required');
    }
    const event = await this.eventService.getEventByCode(code);
    if (!event) {
      throw new Error('Event not found');
    }
    return this.mapEventToResponse(event);
  }

  // ✅ Publique
  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventService.getEventById(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return this.mapEventToResponse(event);
  }

  // ✅ Publique
  @Get(':eventCode')
  async getEventByCode(@Param('eventCode') eventCode: string) {
    this.logger.debug(`[GET] getEventByCode ${eventCode}`);
    const event = await this.eventService.getEventByCode(eventCode);
    if (!event) {
      throw new Error('Event not found');
    }
    const response = this.mapEventToResponse(event);
    this.logger.debug(
      `[GET] getEventByCode ${eventCode} arePartiesVisible=${response.arePartiesVisible} visible=${response.visible}`,
    );
    return response;
  }

  // ✅ Publique (pas de protection dans Express)
  @Put(':id')
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventService.updateEvent(id, updateEventDto);
    return this.mapEventToResponse(event);
  }

  // ✅ Protégée : isAuthenticated + isAdminOfEvent
  @Delete(':eventCode')
  @UseGuards(JwtAuthGuard, EventAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('eventCode') eventCode: string) {
    await this.eventService.deleteEvent(eventCode);
    // Pas besoin de passer l'événement car il est supprimé
    this.webSocketService.emitEventUpdated();
  }

  // ✅ Publique
  @Get(':eventCode/characters')
  async getCharacters(@Param('eventCode') eventCode: string) {
    return await this.eventService.getCharactersByEventCode(eventCode);
  }

  // ✅ Publique
  @Get(':eventCode/parties')
  async getEventParties(@Param('eventCode') eventCode: string) {
    return await this.partyService.getPartiesByEventCode(eventCode);
  }

  // ✅ Publique (PAS de guards - comme dans Express)
  @Get(':eventCode/shuffle-parties')
  async shuffleParties(@Param('eventCode') eventCode: string) {
    this.logger.log(`Shuffle parties for event ${eventCode}`);
    const shuffledParties =
      await this.partyFacade.shuffleAndSaveGroups(eventCode);
    this.logger.log(
      `Shuffle completed for ${eventCode}: ${shuffledParties.length} parties`,
    );
    this.webSocketService.emitPartiesUpdated(shuffledParties);
    return shuffledParties;
  }

  @Patch(':eventCode/setPartiesVisibility')
  async setPartiesVisibility(
    @Param('eventCode') eventCode: string,
    @Body() setPartiesVisibilityDto: SetPartiesVisibilityDto,
  ) {
    this.logger.debug(
      `[setPartiesVisibility] ${eventCode} visible=${setPartiesVisibilityDto.visible} (${typeof setPartiesVisibilityDto.visible})`,
    );

    const updatedEvent = await this.eventService.setPartiesVisibility(
      eventCode,
      setPartiesVisibilityDto.visible,
    );

    const response = this.mapEventToResponse(updatedEvent);
    this.logger.debug(
      `[setPartiesVisibility] response visible=${response.visible} arePartiesVisible=${response.arePartiesVisible}`,
    );

    this.webSocketService.emitEventUpdated(response);
    this.logger.debug(
      `[setPartiesVisibility] emitted event-updated for ${eventCode}`,
    );

    return response;
  }
}
