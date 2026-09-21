import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  AmenityPaginationDto,
  CreateAmenityDto,
  UpdateAmenityDto,
} from './dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

const TARGETS = {
  hotel: { scopes: ['hotel', 'both'], label: 'a hotel' },
  roomType: { scopes: ['room', 'both'], label: 'a room type' },
};

export type AmenityTarget = keyof typeof TARGETS;

@Injectable()
export class AmenitiesService {
  private readonly logger = new Logger(AmenitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAmenityDto) {
    const amenity = await this.prisma.amenity
      .create({ data: dto })
      .catch((error: unknown) => {
        if (this.hasCode(error, 'P2002')) {
          throw new RpcException({
            status: HttpStatus.CONFLICT,
            message: `An amenity with code ${dto.code} already exists`,
          });
        }
        throw error;
      });

    this.logger.log(`Amenity created: ${amenity.code}`);

    return amenity;
  }

  async findAll(dto: AmenityPaginationDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_LIMIT;

    const where: Prisma.AmenityWhereInput = { active: dto.active ?? true };

    if (dto.scope) {
      where.scope = { in: dto.scope === 'both' ? ['both'] : [dto.scope, 'both'] };
    }

    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { code: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.amenity.count({ where }),
      this.prisma.amenity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const amenity = await this.prisma.amenity.findUnique({ where: { id } });

    if (!amenity) {
      throw this.notFound(id);
    }

    return amenity;
  }

  async update(dto: UpdateAmenityDto) {
    const { id, ...data } = dto;

    return this.prisma.amenity
      .update({ where: { id }, data })
      .catch((error: unknown) => {
        if (this.hasCode(error, 'P2025')) {
          throw this.notFound(id);
        }
        if (this.hasCode(error, 'P2002')) {
          throw new RpcException({
            status: HttpStatus.CONFLICT,
            message: `An amenity with code ${data.code} already exists`,
          });
        }
        throw error;
      });
  }

  async remove(id: string) {
    const amenity = await this.findOne(id);

    if (!amenity.active) {
      return amenity;
    }

    this.logger.log(`Amenity deactivated: ${id}`);

    return this.prisma.amenity.update({
      where: { id },
      data: { active: false },
    });
  }

  async findForHotel(hotelId: string) {
    await this.ensureHotel(hotelId);

    const rows = await this.prisma.hotelAmenity.findMany({
      where: { hotelId, amenity: { active: true } },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });

    return rows.map((row) => row.amenity);
  }


  async findForRoomType(roomTypeId: string) {
    await this.ensureRoomType(roomTypeId);

    const rows = await this.prisma.roomTypeAmenity.findMany({
      where: { roomTypeId, amenity: { active: true } },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });

    return rows.map((row) => row.amenity);
  }


  async assertAssignable(
    ids: string[],
    target: AmenityTarget,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    if (ids.length === 0) {
      return;
    }

    const { scopes, label } = TARGETS[target];

    const amenities = await tx.amenity.findMany({
      where: { id: { in: ids } },
    });

    if (amenities.length !== ids.length) {
      const found = new Set(amenities.map((a) => a.id));
      const missing = ids.filter((id) => !found.has(id));

      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Unknown amenities: ${missing.join(', ')}`,
      });
    }

    const inactive = amenities.filter((a) => !a.active);

    if (inactive.length > 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `These amenities are deactivated: ${inactive
          .map((a) => a.code)
          .join(', ')}`,
      });
    }

    const invalid = amenities.filter((a) => !scopes.includes(a.scope));

    if (invalid.length > 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `These amenities cannot be assigned to ${label}: ${invalid
          .map((a) => `${a.code} (scope: ${a.scope})`)
          .join(', ')}`,
      });
    }
  }

  private async ensureHotel(id: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Hotel with id ${id} not found`,
      });
    }
  }

  private async ensureRoomType(id: string) {
    const roomType = await this.prisma.roomType.findUnique({ where: { id } });

    if (!roomType) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Room type with id ${id} not found`,
      });
    }
  }

  private notFound(id: string) {
    return new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Amenity with id ${id} not found`,
    });
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
