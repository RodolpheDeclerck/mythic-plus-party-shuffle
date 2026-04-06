import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Character } from '../../shared/entities/character.entity';
import { AppEvent } from '../../shared/entities/event.entity';
import { SpecializationDetails } from '../../shared/data/specializationsDetails.data';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpsertCharacterDto } from './dto/upsert-character.dto';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(AppEvent)
    private eventRepository: Repository<AppEvent>,
  ) {}

  async createCharacter(data: CreateCharacterDto): Promise<Character> {
    const event = await this.eventRepository.findOne({
      where: { code: data.eventCode },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const character = new Character();
    character.name = data.name;
    character.characterClass = data.characterClass;

    const specializationInfo = SpecializationDetails[data.specialization];

    if (!specializationInfo) {
      throw new Error(`Invalid specialization: ${data.specialization}`);
    }

    character.specialization = data.specialization;
    character.iLevel = data.iLevel;
    character.role = specializationInfo.role;
    character.bloodLust = specializationInfo.bloodLust;
    character.battleRez = specializationInfo.battleRez;
    character.event = event;
    character.keystoneMinLevel = data.keystoneMinLevel;
    character.keystoneMaxLevel = data.keystoneMaxLevel;

    return await this.characterRepository.save(character);
  }

  async getAllCharacters(): Promise<Character[]> {
    return await this.characterRepository.find();
  }

  async getCharacterById(id: number): Promise<Character | null> {
    return await this.characterRepository.findOne({ where: { id } });
  }

  async updateCharacter(id: number, data: UpdateCharacterDto): Promise<Character> {
    const character = await this.characterRepository.findOne({ 
      where: { id },
      relations: ['event'], // ✅ Charger la relation event
    });

    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }

    if (data.name) character.name = data.name;
    if (data.characterClass) character.characterClass = data.characterClass;
    if (data.specialization) {
      const specializationInfo = SpecializationDetails[data.specialization];
      if (!specializationInfo) {
        throw new Error(`Invalid specialization: ${data.specialization}`);
      }
      character.specialization = data.specialization;
      character.role = specializationInfo.role;
      character.bloodLust = specializationInfo.bloodLust;
      character.battleRez = specializationInfo.battleRez;
    }
    if (data.iLevel) character.iLevel = data.iLevel;
    if (data.keystoneMinLevel) character.keystoneMinLevel = data.keystoneMinLevel;
    if (data.keystoneMaxLevel) character.keystoneMaxLevel = data.keystoneMaxLevel;

    if (data.eventCode) {
      const event = await this.eventRepository.findOne({
        where: { code: data.eventCode },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      character.event = event;
    }

    const savedCharacter = await this.characterRepository.save(character);
    
    // ✅ Recharger le character avec la relation event pour s'assurer qu'elle est chargée
    const characterWithEvent = await this.characterRepository.findOne({
      where: { id: savedCharacter.id },
      relations: ['event'],
    });

    return characterWithEvent || savedCharacter;
  }

  async deleteCharacter(id: number): Promise<void> {
    const character = await this.characterRepository.findOneBy({ id });

    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }

    character.event = null;
    await this.characterRepository.save(character);
  }

  async deleteCharacters(ids: number[]): Promise<void> {
    const characters = await this.characterRepository.find({
      where: { id: In(ids) },
    });

    if (characters.length !== ids.length) {
      throw new NotFoundException('One or more characters not found');
    }

    await Promise.all(
      characters.map(async (character) => {
        character.event = null;
        await this.characterRepository.save(character);
      }),
    );
  }

  async upsertCharacter(data: UpsertCharacterDto): Promise<Character> {
    if (data.id) {
      const existing = await this.getCharacterById(data.id);
      if (existing) {
        // ✅ Convertir en UpdateCharacterDto (tous les champs sont optionnels)
        return await this.updateCharacter(data.id, data as UpdateCharacterDto);
      }
    }
    // ✅ Pour créer, on doit avoir les champs obligatoires
    if (!data.name || !data.characterClass || !data.specialization || !data.iLevel || !data.eventCode) {
      throw new BadRequestException('Les champs name, characterClass, specialization, iLevel et eventCode sont requis pour créer un nouveau personnage');
    }
    return await this.createCharacter(data as CreateCharacterDto);
  }
}