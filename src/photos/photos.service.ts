import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHotelPhotoDto,
  CreateRoomTypePhotoDto,
  UpdatePhotoDto,
} from './dto';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createForHotel(dto: CreateHotelPhotoDto) {
    await this.ensureHotel(dto.hotelId);

    const photo = await this.prisma.photo.create({ data: dto });
    this.logger.log(`Photo added to hotel ${dto.hotelId}: ${photo.id}`);

    return photo;
  }

  async createForRoomType(dto: CreateRoomTypePhotoDto) {
    await this.ensureRoomType(dto.roomTypeId);

    const photo = await this.prisma.photo.create({ data: dto });
    this.logger.log(`Photo added to room type ${dto.roomTypeId}: ${photo.id}`);

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

  async update(dto: UpdatePhotoDto) {
    const { id, ...data } = dto;

    return this.prisma.photo
      .update({ where: { id }, data })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });
  }

  async remove(id: string) {
    this.logger.log(`Photo removed: ${id}`);

    return this.prisma.photo
      .delete({ where: { id } })
      .catch((error: unknown) => {
        if (this.isNotFoundError(error)) {
          throw this.notFound(id);
        }
        throw error;
      });
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
