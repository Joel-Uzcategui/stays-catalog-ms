import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '../generated/prisma/client';

import { AmenitiesService } from '../amenities/amenities.service';
import { CitiesService } from '../cities/cities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto, HotelPaginationDto, UpdateHotelDto } from './dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const withCity = {
  city: { select: { id: true, name: true, country: true } },
} satisfies Prisma.HotelInclude;

const withDetail = {
  ...withCity,
  hotelAmenities: {
    where: { amenity: { active: true } },
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' } },
  },
} satisfies Prisma.HotelInclude;

type HotelWithCity = Prisma.HotelGetPayload<{ include: typeof withCity }>;
type HotelWithDetail = Prisma.HotelGetPayload<{ include: typeof withDetail }>;

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cities: CitiesService,
    private readonly amenities: AmenitiesService,
  ) {}

  async create(dto: CreateHotelDto) {
    const { country, city, amenityIds = [], ...rest } = dto;

    const hotel = await this.prisma.$transaction(async (tx) => {
      const { id: cityId } = await this.cities.findOrCreate(country, city, tx);

      await this.amenities.assertAssignable(amenityIds, 'hotel', tx);

      return tx.hotel.create({
        data: {
          ...rest,
          cityId,
          hotelAmenities: {
            createMany: { data: amenityIds.map((amenityId) => ({ amenityId })) },
          },
        },
        include: withDetail,
      });
    });

    this.logger.log(`Hotel created: ${hotel.id}`);

    return this.flattenDetail(hotel);
  }

  async findAll(dto: HotelPaginationDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_LIMIT;
    const active = dto.active ?? true;

    const where: Prisma.HotelWhereInput = { active };

    if (dto.q) {
      where.name = { contains: dto.q, mode: 'insensitive' };
    }

    if (dto.cityId) {
      where.cityId = dto.cityId;
    }

    if (dto.country) {
      where.city = { country: dto.country };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.hotel.count({ where }),
      this.prisma.hotel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: withCity,
      }),
    ]);

    return {
      data: data.map((hotel) => this.flatten(hotel)),
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findAllPublic(dto: HotelPaginationDto) {
    return this.findAll({ ...dto, active: true });
  }

  async findOne(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: withDetail,
    });

    if (!hotel) {
      throw this.notFound(id);
    }

    return this.flattenDetail(hotel);
  }

  async findOnePublic(id: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id, active: true },
      include: withCity,
    });

    if (!hotel) {
      throw this.notFound(id);
    }

    return this.flatten(hotel);
  }

  async update(dto: UpdateHotelDto) {
    const { id, country, city, amenityIds, ...data } = dto;

    const hotel = await this.prisma
      .$transaction(async (tx) => {
        const next: Prisma.HotelUpdateInput = { ...data };

        if (country || city) {
          const current = await tx.hotel.findUnique({
            where: { id },
            include: withCity,
          });

          if (!current) {
            throw this.notFound(id);
          }

          const { id: cityId } = await this.cities.findOrCreate(
            country ?? current.city.country,
            city ?? current.city.name,
            tx,
          );

          next.city = { connect: { id: cityId } };
        }

        if (amenityIds) {
          await this.amenities.assertAssignable(amenityIds, 'hotel', tx);
          await tx.hotelAmenity.deleteMany({ where: { hotelId: id } });
          await tx.hotelAmenity.createMany({
            data: amenityIds.map((amenityId) => ({ hotelId: id, amenityId })),
          });
        }

        return tx.hotel.update({
          where: { id },
          data: next,
          include: withDetail,
        });
      })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });

    return this.flattenDetail(hotel);
  }

  async remove(id: string) {
    const hotel = await this.findOne(id);

    if (!hotel.active) {
      return hotel;
    }

    this.logger.log(`Hotel deactivated: ${id}`);

    const updated = await this.prisma.hotel.update({
      where: { id },
      data: { active: false },
      include: withDetail,
    });

    return this.flattenDetail(updated);
  }

  private flatten(hotel: HotelWithCity) {
    const { city, ...rest } = hotel;

    return { ...rest, city: city.name, country: city.country };
  }

  private flattenDetail(hotel: HotelWithDetail) {
    const { hotelAmenities, ...rest } = hotel;

    return {
      ...this.flatten(rest),
      amenities: hotelAmenities.map((row) => row.amenity),
    };
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
