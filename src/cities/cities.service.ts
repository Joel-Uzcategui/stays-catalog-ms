import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { normalizeName, toSlug } from './city-slug';
import { CitySearchDto } from './dto';

const DEFAULT_LIMIT = 10;

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(dto: CitySearchDto) {
    const where: Prisma.CityWhereInput = {};

    if (dto.country) {
      where.country = dto.country;
    }

    const term = dto.q ? toSlug(dto.q) : '';

    if (term) {
      where.slug = { contains: term };
    }

    return this.prisma.city.findMany({
      where,
      take: dto.limit ?? DEFAULT_LIMIT,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, country: true },
    });
  }

  async findCountries() {
    const rows = await this.prisma.city.groupBy({
      by: ['country'],
      orderBy: { country: 'asc' },
    });

    return rows.map(({ country }) => country);
  }

  async findOrCreate(
    country: string,
    name: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const label = normalizeName(name);
    const slug = toSlug(label);

    const [city] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO "cities" ("id", "name", "slug", "country")
      VALUES (gen_random_uuid(), ${label}, ${slug}, ${country})
      ON CONFLICT ("country", "slug") DO UPDATE SET "name" = "cities"."name"
      RETURNING "id"
    `;

    return city;
  }
}
