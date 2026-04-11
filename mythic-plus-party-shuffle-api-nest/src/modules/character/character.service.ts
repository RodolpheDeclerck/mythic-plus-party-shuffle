import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SpecializationDetails } from '../../shared/data/specializationsDetails.data';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpsertCharacterDto } from './dto/upsert-character.dto';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  async createCharacter(data: CreateCharacterDto) {
    const event = await this.prisma.event.findUnique({
      where: { code: data.eventCode },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const specializationInfo = SpecializationDetails[data.specialization];

    if (!specializationInfo) {
      throw new Error(`Invalid specialization: ${data.specialization}`);
    }

    return await this.prisma.character.create({
      data: {
        name: data.name,
        characterClass: data.characterClass,
        specialization: data.specialization,
        iLevel: data.iLevel,
        role: specializationInfo.role,
        bloodLust: specializationInfo.bloodLust,
        battleRez: specializationInfo.battleRez,
        keystoneMinLevel: data.keystoneMinLevel,
        keystoneMaxLevel: data.keystoneMaxLevel,
        eventCode: data.eventCode,
      },
    });
  }

  async getAllCharacters() {
    return await this.prisma.character.findMany();
  }

  async getCharacterById(id: number) {
    return await this.prisma.character.findUnique({ where: { id } });
  }

  async updateCharacter(id: number, data: UpdateCharacterDto) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }

    const updateData: Prisma.CharacterUpdateInput = {};

    if (data.name) updateData.name = data.name;
    if (data.characterClass) updateData.characterClass = data.characterClass;
    if (data.specialization) {
      const specializationInfo = SpecializationDetails[data.specialization];
      if (!specializationInfo) {
        throw new Error(`Invalid specialization: ${data.specialization}`);
      }
      updateData.specialization = data.specialization;
      updateData.role = specializationInfo.role;
      updateData.bloodLust = specializationInfo.bloodLust;
      updateData.battleRez = specializationInfo.battleRez;
    }
    if (data.iLevel) updateData.iLevel = data.iLevel;
    if (data.keystoneMinLevel) updateData.keystoneMinLevel = data.keystoneMinLevel;
    if (data.keystoneMaxLevel) updateData.keystoneMaxLevel = data.keystoneMaxLevel;

    if (data.eventCode) {
      const event = await this.prisma.event.findUnique({
        where: { code: data.eventCode },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      updateData.event = { connect: { code: data.eventCode } };
    }

    return await this.prisma.character.update({
      where: { id },
      data: updateData,
      include: { event: true },
    });
  }

  async deleteCharacter(id: number): Promise<void> {
    try {
      await this.prisma.character.update({
        where: { id },
        data: { eventCode: null },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`Character with ID ${id} not found`);
      }
      throw e;
    }
  }

  async deleteCharacters(ids: number[]): Promise<void> {
    const { count } = await this.prisma.character.updateMany({
      where: { id: { in: ids } },
      data: { eventCode: null },
    });

    if (count !== ids.length) {
      throw new NotFoundException('One or more characters not found');
    }
  }

  async upsertCharacter(data: UpsertCharacterDto) {
    if (data.id) {
      const existing = await this.getCharacterById(data.id);
      if (existing) {
        return await this.updateCharacter(data.id, data as UpdateCharacterDto);
      }
    }
    if (!data.name || !data.characterClass || !data.specialization || !data.iLevel || !data.eventCode) {
      throw new BadRequestException('Les champs name, characterClass, specialization, iLevel et eventCode sont requis pour créer un nouveau personnage');
    }
    return await this.createCharacter(data as CreateCharacterDto);
  }
}
