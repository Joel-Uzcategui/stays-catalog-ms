import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { normalizeName, toSlug } from '../src/cities/city-slug';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const hotels = [
  {
    name: 'Hotel Mar Azul',
    description: 'Frente a la playa de Las Teresitas, con vistas al Atlántico.',
    country: 'ES',
    city: 'Santa Cruz de Tenerife',
    address: 'Av. Marítima 14',
    latitude: 28.46,
    longitude: -16.25,
  },
  {
    name: 'Gran Hotel Sierra',
    description: 'Casa rural rehabilitada en plena sierra de Gredos.',
    country: 'ES',
    city: 'Ávila',
    address: 'Camino del Puerto 3',
    latitude: 40.31,
    longitude: -5.15,
  },
  {
    name: 'Hostal del Carmen',
    description: 'En el casco antiguo, a cinco minutos de la catedral.',
    country: 'ES',
    city: 'Sevilla',
    address: 'Calle Betis 22',
    latitude: 37.38,
    longitude: -5.99,
  },
  {
    name: 'Blue Lagoon Resort',
    description: 'Resort con tres piscinas y acceso directo a la cala.',
    country: 'ES',
    city: 'Palma',
    address: 'Passeig Marítim 8',
    latitude: 39.57,
    longitude: 2.65,
  },
  {
    name: 'Urban Loft Madrid',
    description: 'Apartamentos reformados junto a Gran Vía.',
    country: 'ES',
    city: 'Madrid',
    address: 'Calle Fuencarral 45',
    latitude: 40.42,
    longitude: -3.7,
  },
];

const amenities = [
  { code: 'wifi', name: 'WiFi', scope: 'both' },
  { code: 'parking', name: 'Parking', scope: 'hotel' },
  { code: 'pool', name: 'Piscina', scope: 'hotel' },
  { code: 'gym', name: 'Gimnasio', scope: 'hotel' },
  { code: 'breakfast', name: 'Desayuno incluido', scope: 'hotel' },
  { code: 'air_conditioning', name: 'Aire acondicionado', scope: 'room' },
  { code: 'tv', name: 'Televisión', scope: 'room' },
  { code: 'safe', name: 'Caja fuerte', scope: 'room' },
  { code: 'minibar', name: 'Minibar premium', scope: 'both' },
];

const roomTypes = [
  {
    hotel: 'Urban Loft Madrid',
    name: 'Double Superior',
    capacity: 2,
    priceCents: 12500,
    defaultUnits: 1,
  },
];

const hotelAmenities = [{ hotel: 'Hotel Mar Azul', amenity: 'minibar' }];

async function main() {
  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: {},
      create: amenity,
    });
  }

  for (const { country, city, ...rest } of hotels) {
    const exists = await prisma.hotel.findFirst({ where: { name: rest.name } });

    if (exists) {
      continue;
    }

    const name = normalizeName(city);

    const { id: cityId } = await prisma.city.upsert({
      where: { country_slug: { country, slug: toSlug(name) } },
      update: {},
      create: { country, name, slug: toSlug(name) },
    });

    await prisma.hotel.create({ data: { ...rest, cityId } });
  }

  for (const { hotel, ...rest } of roomTypes) {
    const owner = await prisma.hotel.findFirstOrThrow({
      where: { name: hotel },
    });

    const exists = await prisma.roomType.findFirst({
      where: { hotelId: owner.id, name: rest.name },
    });

    if (!exists) {
      await prisma.roomType.create({ data: { ...rest, hotelId: owner.id } });
    }
  }

  for (const link of hotelAmenities) {
    const [hotel, amenity] = await Promise.all([
      prisma.hotel.findFirstOrThrow({ where: { name: link.hotel } }),
      prisma.amenity.findUniqueOrThrow({ where: { code: link.amenity } }),
    ]);

    await prisma.hotelAmenity.upsert({
      where: {
        hotelId_amenityId: { hotelId: hotel.id, amenityId: amenity.id },
      },
      update: {},
      create: { hotelId: hotel.id, amenityId: amenity.id },
    });
  }

  const [cityCount, hotelCount, amenityCount, roomTypeCount] =
    await Promise.all([
      prisma.city.count(),
      prisma.hotel.count(),
      prisma.amenity.count(),
      prisma.roomType.count(),
    ]);

  console.log(
    `Seed done: ${cityCount} cities, ${hotelCount} hotels, ${amenityCount} amenities, ${roomTypeCount} room types`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
