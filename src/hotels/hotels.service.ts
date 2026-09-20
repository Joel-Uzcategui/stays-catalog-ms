import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto, HotelPaginationDto, UpdateHotelDto } from './dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHotelDto) {
    const hotel = await this.prisma.hotel.create({ data: dto });
    this.logger.log(`Hotel created: ${hotel.id}`);
    return hotel;
  }

  async findAll(dto: HotelPaginationDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_LIMIT;
    const active = dto.active ?? true;

    const where: Prisma.HotelWhereInput = { active };

    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { city: { contains: dto.q, mode: 'insensitive' } },
        { country: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.hotel.count({ where }),
      this.prisma.hotel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findAllPublic(dto: HotelPaginationDto) {
    return this.findAll({ ...dto, active: true });
  }

  async findOne(id: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      throw this.notFound(id);
    }

    return hotel;
  }

  async findOnePublic(id: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id, active: true },
    });

    if (!hotel) {
      throw this.notFound(id);
    }

    return hotel;
  }

  async update(dto: UpdateHotelDto) {
    const { id, ...data } = dto;

    return this.prisma.hotel
      .update({ where: { id }, data })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });
  }

  async remove(id: string) {
    const hotel = await this.findOne(id);

    if (!hotel.active) {
      return hotel;
    }

    this.logger.log(`Hotel deactivated: ${id}`);

    return this.prisma.hotel.update({
      where: { id },
      data: { active: false },
    });
  }

  private notFound(id: string) {
    return new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Hotel with id ${id} not found`,
    });
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    );
  }
}
