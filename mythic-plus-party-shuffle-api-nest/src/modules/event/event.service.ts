import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateEventDto, UpdateEventDto } from './dto';

/** Default relations to include when querying events. */
const eventInclude = {
  createdBy: { select: { id: true, username: true, email: true } },
  admins: { select: { user: { select: { id: true, username: true, email: true } } } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Flatten EventAdmin[] → User[] so the controller shape stays unchanged.
   */
  private flattenAdmins<T extends { admins: { user: any }[] }>(
    event: T,
  ): Omit<T, 'admins'> & { admins: any[] } {
    return { ...event, admins: event.admins.map((ea) => ea.user) };
  }

  async createEvent(createEventDto: CreateEventDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: createEventDto.createdBy },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = randomUUID().substring(0, 8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const event = await this.prisma.event.create({
      data: {
        name: createEventDto.name,
        code,
        expiresAt,
        createdBy: { connect: { id: createEventDto.createdBy } },
        admins: { create: { userId: createEventDto.createdBy } },
      },
      include: eventInclude,
    });

    return this.flattenAdmins(event);
  }

  async getAllEvents() {
    const events = await this.prisma.event.findMany({ include: eventInclude });
    return events.map((e) => this.flattenAdmins(e));
  }

  async getEventById(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
    return event ? this.flattenAdmins(event) : null;
  }

  async getEventByCode(code: string) {
    const event = await this.prisma.event.findUnique({
      where: { code },
      include: eventInclude,
    });
    return event ? this.flattenAdmins(event) : null;
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const data: Prisma.EventUpdateInput = {};

    if (updateEventDto.name) {
      data.name = updateEventDto.name;
    }

    if (updateEventDto.admins) {
      // Replace all admins: delete existing, create new
      data.admins = {
        deleteMany: {},
        create: (updateEventDto.admins as number[]).map((userId) => ({
          userId,
        })),
      };
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data,
      include: eventInclude,
    });

    return this.flattenAdmins(updated);
  }

  async deleteEvent(eventCode: string): Promise<void> {
    try {
      await this.prisma.event.delete({ where: { code: eventCode } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Event not found');
      }
      throw e;
    }
  }

  async getCharactersByEventCode(eventCode: string) {
    return await this.prisma.character.findMany({
      where: { eventCode },
    });
  }

  async getEventsByAdmin(userId: number) {
    const events = await this.prisma.event.findMany({
      where: { admins: { some: { userId } } },
      include: eventInclude,
    });
    return events.map((e) => this.flattenAdmins(e));
  }

  async setPartiesVisibility(eventCode: string, visible: boolean) {
    this.logger.debug(
      `[setPartiesVisibility] ${eventCode} -> arePartiesVisible=${visible}`,
    );

    const updated = await this.prisma.event.update({
      where: { code: eventCode },
      data: { arePartiesVisible: visible },
      include: eventInclude,
    });

    this.logger.debug(
      `[setPartiesVisibility] loaded id=${updated.id} arePartiesVisible=${updated.arePartiesVisible}`,
    );

    return this.flattenAdmins(updated);
  }
}
