import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    HttpException,
    UsePipes,
    ValidationPipe,
    Req,
    PipeTransform,
    ArgumentMetadata,
  } from '@nestjs/common';
  import { CharacterService } from './character.service';
  import { WebSocketService } from '../../shared/websocket/websocket.service';
  import { CreateCharacterDto, UpdateCharacterDto, DeleteCharactersDto } from './dto';
  import { Specialization } from '../../shared/enums/specialization.enum';
import { UpsertCharacterDto } from './dto/upsert-character.dto';

// Pipe qui désactive la validation globale pour cette route
class NoValidationPipe implements PipeTransform {
  transform(value: any) {
    return value;
  }
}
  
  @Controller('api/characters')
  export class CharacterController {
    constructor(
      private characterService: CharacterService,
      private webSocketService: WebSocketService,
    ) {}
  
    // ✅ Toutes publiques (pas de guards)
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createCharacter(@Body() createCharacterDto: CreateCharacterDto) {
      // ✅ Validation de la spécialisation (comme Express ligne 14-16)
      if (!Object.values(Specialization).includes(createCharacterDto.specialization as Specialization)) {
        throw new HttpException('Invalid specialization', HttpStatus.BAD_REQUEST);
      }
  
      const character = await this.characterService.createCharacter(createCharacterDto);
      this.webSocketService.emitCharacterUpdated();
      return character;
    }
  
    @Get()
    async getAllCharacters() {
      return await this.characterService.getAllCharacters();
    }
  
    @Get(':id')
    async getCharacterById(@Param('id', ParseIntPipe) id: number) {
      const character = await this.characterService.getCharacterById(id);

      if (!character) {
        throw new HttpException('Character not found', HttpStatus.NOT_FOUND);
      }

      return character;
    }

    @Put('upsert') // ✅ PUT comme Express - DOIT être avant @Put(':id')
    @UsePipes(new NoValidationPipe()) // Désactiver la validation globale pour cette route
    async upsertCharacter(@Body() body: any, @Req() req: any) {
      console.log('📥 [upsertCharacter] Raw request body:', JSON.stringify(req.body, null, 2));
      
      // Transformation manuelle pour s'assurer que les types sont corrects
      const upsertCharacterDto: UpsertCharacterDto = {
        id: body.id !== undefined && body.id !== null ? Number(body.id) : undefined,
        name: body.name,
        characterClass: body.characterClass,
        specialization: body.specialization,
        iLevel: body.iLevel !== undefined && body.iLevel !== null ? Number(body.iLevel) : undefined,
        eventCode: body.eventCode,
        keystoneMinLevel: body.keystoneMinLevel !== undefined && body.keystoneMinLevel !== null ? Number(body.keystoneMinLevel) : undefined,
        keystoneMaxLevel: body.keystoneMaxLevel !== undefined && body.keystoneMaxLevel !== null ? Number(body.keystoneMaxLevel) : undefined,
      };
      
      // ✅ Validation de la spécialisation (comme Express ligne 117-119)
      if (upsertCharacterDto.specialization && !Object.values(Specialization).includes(upsertCharacterDto.specialization as Specialization)) {
        throw new HttpException('Invalid specialization', HttpStatus.BAD_REQUEST);
      }
    
      const updatedCharacter = await this.characterService.upsertCharacter(upsertCharacterDto);
    
      if (!updatedCharacter) {
        throw new HttpException('Error upserting character', HttpStatus.NOT_FOUND);
      }
    
      this.webSocketService.emitCharacterUpdated();
      return updatedCharacter;
    }

    @Put(':id')
    async updateCharacter(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateCharacterDto: UpdateCharacterDto,
    ) {
      // ✅ Validation de la spécialisation (comme Express ligne 92-94)
      if (updateCharacterDto.specialization && !Object.values(Specialization).includes(updateCharacterDto.specialization as Specialization)) {
        throw new HttpException('Invalid specialization', HttpStatus.BAD_REQUEST);
      }

      const updatedCharacter = await this.characterService.updateCharacter(id, updateCharacterDto);

      if (!updatedCharacter) {
        throw new HttpException('Character not found', HttpStatus.NOT_FOUND);
      }

      // ✅ Émettre seulement character-updated (comme Express ligne 36)
      this.webSocketService.emitCharacterUpdated();

      return updatedCharacter;
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.OK) // Express retourne 200, pas 204
    async deleteCharacter(@Param('id', ParseIntPipe) id: number) {
      await this.characterService.deleteCharacter(id);
      this.webSocketService.emitCharacterUpdated();
      return { message: 'Character deleted successfully' }; // Express retourne un message
    }
  
    @Post('remove') // Note: dans Express c'est /remove, pas /delete
    @HttpCode(HttpStatus.OK) // Express retourne 200
    async deleteCharacters(@Body() deleteCharactersDto: DeleteCharactersDto) {
      await this.characterService.deleteCharacters(deleteCharactersDto.ids);
      this.webSocketService.emitCharacterUpdated();
      return { message: 'Characters deleted successfully' }; // Express retourne un message
    }
  }