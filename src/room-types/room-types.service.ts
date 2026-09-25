import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '../generated/prisma/client';

import { AmenitiesService } from '../amenities/amenities.service';
import { CatalogEventsService } from '../events/catalog-events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoomTypeDto,
  RoomTypeGlobalPaginationDto,
  RoomTypePaginationDto,
  UpdateRoomTypeDto,
} from './dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const withDetail = {
  roomTypeAmenities: {
    where: { amenity: { active: true } },
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' } },
  },
} satisfies Prisma.RoomTypeInclude;

type RoomTypeWithDetail = Prisma.RoomTypeGetPayload<{
  include: typeof withDetail;
}>;

@Injectable()
export class RoomTypesService {
  private readonly logger = new Logger(RoomTypesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amenities: AmenitiesService,
    private readonly events: CatalogEventsService,
  ) {}

  async create(dto: CreateRoomTypeDto) {
    const { amenityIds = [], ...rest } = dto;

    const roomType = await this.prisma
      .$transaction(async (tx) => {
        await this.amenities.assertAssignable(amenityIds, 'roomType', tx);

        return tx.roomType.create({
          data: {
            ...rest,
            roomTypeAmenities: {
              createMany: {
                data: amenityIds.map((amenityId) => ({ amenityId })),
              },
            },
          },
          include: withDetail,
        });
      })
      .catch((error: unknown) => {
        if (this.isForeignKeyError(error)) {
          throw this.hotelNotFound(dto.hotelId);
        }
        throw error;
      });

    this.logger.log(`Room type created: ${roomType.id}`);

    await this.events.hotelChanged(roomType.hotelId);

    return this.flattenDetail(roomType);
  }

  async findAll(dto: RoomTypePaginationDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_LIMIT;
    const active = dto.active ?? true;

    const where: Prisma.RoomTypeWhereInput = { hotelId: dto.hotelId, active };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.roomType.count({ where }),
      this.prisma.roomType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priceCents: 'asc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findAllGlobal(dto: RoomTypeGlobalPaginationDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_LIMIT;

    const where: Prisma.RoomTypeWhereInput = { active: dto.active ?? true };

    if (dto.hotelId) {
      where.hotelId = dto.hotelId;
    }

    if (dto.q) {
      where.name = { contains: dto.q, mode: 'insensitive' };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.roomType.count({ where }),
      this.prisma.roomType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ hotel: { name: 'asc' } }, { priceCents: 'asc' }],
        include: { hotel: { select: { name: true } } },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findAllPublic(dto: RoomTypePaginationDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_LIMIT;

    const where: Prisma.RoomTypeWhereInput = {
      hotelId: dto.hotelId,
      active: true,
      hotel: { active: true },
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.roomType.count({ where }),
      this.prisma.roomType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priceCents: 'asc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
      include: withDetail,
    });

    if (!roomType) {
      throw this.notFound(id);
    }

    return this.flattenDetail(roomType);
  }

  async findOnePublic(id: string) {
    const roomType = await this.prisma.roomType.findFirst({
      where: { id, active: true, hotel: { active: true } },
    });

    if (!roomType) {
      throw this.notFound(id);
    }

    return roomType;
  }

  async update(dto: UpdateRoomTypeDto) {
    const { id, amenityIds, ...data } = dto;

    const roomType = await this.prisma
      .$transaction(async (tx) => {
        if (amenityIds) {
          await this.amenities.assertAssignable(amenityIds, 'roomType', tx);
          await tx.roomTypeAmenity.deleteMany({ where: { roomTypeId: id } });
          await tx.roomTypeAmenity.createMany({
            data: amenityIds.map((amenityId) => ({
              roomTypeId: id,
              amenityId,
            })),
          });
        }

        return tx.roomType.update({
          where: { id },
          data,
          include: withDetail,
        });
      })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });

    await this.events.hotelChanged(roomType.hotelId);

    return this.flattenDetail(roomType);
  }

  async remove(id: string) {
    const roomType = await this.findOne(id);

    if (!roomType.active) {
      return roomType;
    }

    this.logger.log(`Room type deactivated: ${id}`);

    const updated = await this.prisma.roomType.update({
      where: { id },
      data: { active: false },
    });

    await this.events.hotelChanged(updated.hotelId);

    return updated;
  }

  private flattenDetail(roomType: RoomTypeWithDetail) {
    const { roomTypeAmenities, ...rest } = roomType;

    return {
      ...rest,
      amenities: roomTypeAmenities.map((row) => row.amenity),
    };
  }

  private notFound(id: string) {
    return new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Room type with id ${id} not found`,
    });
  }

  private hotelNotFound(id: string) {
    return new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Hotel with id ${id} not found`,
    });
  }

  private isNotFoundError(error: unknown): boolean {
    return this.hasCode(error, 'P2025');
  }

  private isForeignKeyError(error: unknown): boolean {
    return this.hasCode(error, 'P2003');
  }

  private hasCode(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === code
    );
  }
}
