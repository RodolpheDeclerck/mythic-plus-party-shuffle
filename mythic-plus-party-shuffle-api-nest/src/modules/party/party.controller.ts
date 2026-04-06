import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  HttpException,
  Logger,
} from '@nestjs/common';
import { PartyService } from './party.service';
import { WebSocketService } from '../../shared/websocket/websocket.service';
import { CreateOrUpdatePartiesDto } from './dto';

@Controller('api/events/:eventCode/parties') // Note: route différente dans Express
export class PartyController {
  private readonly logger = new Logger(PartyController.name);

  constructor(
    private partyService: PartyService,
    private webSocketService: WebSocketService,
  ) {}

  // ✅ Publique
  @Get()
  async getParties(@Param('eventCode') eventCode: string) {
    return await this.partyService.getPartiesByEventCode(eventCode);
  }

  // ✅ Publique
  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Accepter les propriétés supplémentaires pour compatibilité
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }))
  async createOrUpdateParties(
    @Param('eventCode') eventCode: string,
    @Body() body: any, // Accepter any pour plus de flexibilité
  ) {
    this.logger.debug(`[createOrUpdateParties] raw body: ${JSON.stringify(body)}`);

    try {
      // Normaliser les données reçues
      let parties: any[];
      
      // Si le body contient directement un tableau de parties
      if (Array.isArray(body)) {
        parties = body;
      } 
      // Si le body contient une propriété parties
      else if (body.parties && Array.isArray(body.parties)) {
        parties = body.parties;
      } 
      // Sinon essayer de valider avec le DTO
      else {
        const dto = body as CreateOrUpdatePartiesDto;
        if (!dto.parties || !Array.isArray(dto.parties)) {
          throw new Error('Invalid request body: parties array is required');
        }
        parties = dto.parties;
      }
      
      // Transformer les parties pour s'assurer qu'elles sont au bon format
      // Les parties dans Redis contiennent des Character complets, donc on accepte les Character complets
      const transformedParties = parties.map((party, partyIndex) => {
        if (!party.members || !Array.isArray(party.members)) {
          throw new Error(`Party at index ${partyIndex} must have a members array`);
        }
        
        return {
          id: party.id,
          members: party.members.map((member: any, memberIndex: number) => {
            // Si c'est un nombre, on ne peut pas le transformer en Character complet
            // Il faudrait récupérer le Character depuis la DB, mais pour l'instant on accepte juste l'ID
            if (typeof member === 'number') {
              this.logger.warn(
                `Member at party ${partyIndex}, member ${memberIndex} is numeric id only; character details will be missing`,
              );
              return { id: member };
            }
            // Si c'est un objet Character complet, le garder tel quel
            if (typeof member === 'object' && member !== null) {
              // S'assurer que l'id est un nombre
              if ('id' in member) {
                return {
                  ...member,
                  id: Number(member.id),
                };
              }
              throw new Error(`Member at party ${partyIndex}, member ${memberIndex} must have an id property`);
            }
            throw new Error(`Invalid member format at party ${partyIndex}, member ${memberIndex}: ${typeof member}`);
          }),
        };
      });
      
      this.logger.debug(`[createOrUpdateParties] transformed parties: ${JSON.stringify(transformedParties)}`);

      await this.partyService.createOrUpdatePartiesToRedis(
        transformedParties as any,
        eventCode,
      );
      
      // ✅ Récupérer les parties depuis Redis et les émettre
      const partiesFromRedis = await this.partyService.getPartiesByEventCode(eventCode);
      this.webSocketService.emitPartiesUpdated(partiesFromRedis);
      
      this.logger.log(`[createOrUpdateParties] updated parties for event ${eventCode}`);
      return { message: 'Parties created or updated successfully' };
    } catch (error: any) {
      this.logger.error(
        `[createOrUpdateParties] ${error?.message ?? error}`,
        error?.stack,
      );
      
      // Si c'est déjà une HttpException, la relancer telle quelle
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Sinon, transformer en HttpException avec un message clair
      const errorMessage = error?.message || 'Failed to update parties';
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: errorMessage,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ✅ Publique
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteParties(@Param('eventCode') eventCode: string) {
    await this.partyService.deleteGroupsFromRedis(eventCode);
    this.webSocketService.emitPartiesUpdated();
    return { message: 'Parties deleted successfully' };
  }
}