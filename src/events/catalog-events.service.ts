import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SEARCH_SERVICE } from '../config';
import { PrismaService } from '../prisma/prisma.service';

export const HOTEL_CHANGED = 'catalog.hotel.changed';

@Injectable()
export class CatalogEventsService {
  private readonly logger = new Logger(CatalogEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SEARCH_SERVICE) private readonly searchClient: ClientProxy,
  ) {}

  async hotelChanged(hotelId: string) {
    const payload = await this.buildPayload(hotelId);

    if (!payload) {
      return;
    }

    try {
      await firstValueFrom(this.searchClient.emit(HOTEL_CHANGED, payload));
    } catch (error) {
      this.logger.warn(
        `Could not publish ${HOTEL_CHANGED} for ${hotelId}: ${String(error)}`,
      );
    }
  }

  async listForIndex(page: number, limit: number) {
    const hotels = await this.prisma.hotel.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const payloads = await Promise.all(
      hotels.map(({ id }) => this.buildPayload(id)),
    );

    return payloads.filter((payload) => payload !== null);
  }

  private async buildPayload(hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        city: { select: { id: true, name: true, country: true } },
        hotelAmenities: {
          where: { amenity: { active: true } },
          select: { amenity: { select: { code: true } } },
        },
        roomTypes: {
          where: { active: true },
          select: { capacity: true, priceCents: true },
        },
      },
    });

    if (!hotel) {
      return null;
    }

    const rooms = hotel.roomTypes;

    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      cityId: hotel.city.id,
      city: hotel.city.name,
      country: hotel.city.country,
      location:
        hotel.latitude === null || hotel.longitude === null
          ? null
          : { lat: Number(hotel.latitude), lon: Number(hotel.longitude) },
      amenityCodes: hotel.hotelAmenities.map((row) => row.amenity.code),
      priceFrom: rooms.length
        ? Math.min(...rooms.map((room) => room.priceCents))
        : null,
      maxCapacity: rooms.length
        ? Math.max(...rooms.map((room) => room.capacity))
        : null,
      roomTypeCount: rooms.length,
      active: hotel.active,
      updatedAt: hotel.updatedAt.toISOString(),
    };
  }
}
