import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { CatalogEventsService } from '../events/catalog-events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHotelPhotoDto,
  CreateRoomTypePhotoDto,
  ReorderHotelPhotosDto,
  UpdatePhotoDto,
} from './dto';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: CatalogEventsService,
  ) {}

  async createForHotel(dto: CreateHotelPhotoDto) {
    await this.ensureHotel(dto.hotelId);

    const position =
      dto.position ?? (await this.nextPosition({ hotelId: dto.hotelId }));

    const photo = await this.prisma.photo.create({
      data: { ...dto, position },
    });

    this.logger.log(`Photo added to hotel ${dto.hotelId}: ${photo.id}`);
    await this.publish(photo.hotelId);

    return photo;
  }

  async createForRoomType(dto: CreateRoomTypePhotoDto) {
    await this.ensureRoomType(dto.roomTypeId);

    const position =
      dto.position ?? (await this.nextPosition({ roomTypeId: dto.roomTypeId }));

    const photo = await this.prisma.photo.create({
      data: { ...dto, position },
    });

    this.logger.log(`Photo added to room type ${dto.roomTypeId}: ${photo.id}`);

    return photo;
  }

  async findOne(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });

    if (!photo) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Photo ${id} not found`,
      });
    }

    return photo;
  }

  async findForHotel(hotelId: string) {
    await this.ensureHotel(hotelId);

    return this.prisma.photo.findMany({
      where: { hotelId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
  }

  async findForRoomType(roomTypeId: string) {
    await this.ensureRoomType(roomTypeId);

    return this.prisma.photo.findMany({
      where: { roomTypeId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
  }

  // The cover is whichever photo sorts first, so choosing one is a reorder.
  // Rewriting the whole run leaves no gaps and no drift.
  async reorderForHotel(dto: ReorderHotelPhotosDto) {
    const { hotelId, ids } = dto;

    const photos = await this.findForHotel(hotelId);
    const owned = new Set(photos.map((photo) => photo.id));

    const complete =
      ids.length === photos.length &&
      new Set(ids).size === ids.length &&
      ids.every((id) => owned.has(id));

    if (!complete) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `The list must contain every photo of hotel ${hotelId} exactly once`,
      });
    }

    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.photo.update({ where: { id }, data: { position } }),
      ),
    );

    this.logger.log(`Photos reordered for hotel ${hotelId}`);
    await this.publish(hotelId);

    return this.findForHotel(hotelId);
  }

  async update(dto: UpdatePhotoDto) {
    const { id, ...data } = dto;

    const photo = await this.prisma.photo
      .update({ where: { id }, data })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });

    await this.publish(photo.hotelId);

    return photo;
  }

  async remove(id: string) {
    const photo = await this.prisma.photo
      .delete({ where: { id } })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });

    this.logger.log(`Photo removed: ${id}`);
    await this.publish(photo.hotelId);

    return photo;
  }

  // Ties break by id, so two uploads landing on the same position are harmless.
  private async nextPosition(where: { hotelId?: string; roomTypeId?: string }) {
    const { _max } = await this.prisma.photo.aggregate({
      where,
      _max: { position: true },
    });

    return (_max.position ?? -1) + 1;
  }

  // Only hotel photos reach Elasticsearch: the indexed document carries the
  // cover, and room type photos are read from catalog on demand.
  private async publish(hotelId: string | null) {
    if (!hotelId) {
      return;
    }

    await this.events.hotelChanged(hotelId);
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
      message: `Photo with id ${id} not found`,
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
