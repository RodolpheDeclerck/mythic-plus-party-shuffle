import { Injectable } from '@nestjs/common';
import { PartyService } from '../../modules/party/party.service';
import { EventService } from '../../modules/event/event.service';
import { Party } from '../entities/party.entity';

@Injectable()
export class PartyFacade {
  constructor(
    private partyService: PartyService,
    private eventService: EventService,
  ) {}

  async shuffleAndSaveGroups(eventCode: string): Promise<Party[]> {
    const characters = await this.eventService.getCharactersByEventCode(eventCode);
    const parties = await this.partyService.shuffleGroups(characters, eventCode);
    await this.partyService.saveGroupsToRedis(parties, eventCode);
    await this.partyService.saveShuffleToHistory(eventCode, parties);
    return parties;
  }
}