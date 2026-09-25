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

const catalogCities = [
  { country: 'ES', name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { country: 'ES', name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
  { country: 'ES', name: 'Valencia', lat: 39.4699, lon: -0.3763 },
  { country: 'ES', name: 'Sevilla', lat: 37.3891, lon: -5.9845 },
  { country: 'ES', name: 'Málaga', lat: 36.7213, lon: -4.4214 },
  { country: 'ES', name: 'Bilbao', lat: 43.263, lon: -2.935 },
  { country: 'ES', name: 'Granada', lat: 37.1773, lon: -3.5986 },
  { country: 'ES', name: 'Palma', lat: 39.5696, lon: 2.6502 },
  { country: 'FR', name: 'París', lat: 48.8566, lon: 2.3522 },
  { country: 'FR', name: 'Lyon', lat: 45.764, lon: 4.8357 },
  { country: 'FR', name: 'Niza', lat: 43.7102, lon: 7.262 },
  { country: 'FR', name: 'Marsella', lat: 43.2965, lon: 5.3698 },
  { country: 'IT', name: 'Roma', lat: 41.9028, lon: 12.4964 },
  { country: 'IT', name: 'Milán', lat: 45.4642, lon: 9.19 },
  { country: 'IT', name: 'Florencia', lat: 43.7696, lon: 11.2558 },
  { country: 'IT', name: 'Venecia', lat: 45.4408, lon: 12.3155 },
  { country: 'PT', name: 'Lisboa', lat: 38.7223, lon: -9.1393 },
  { country: 'PT', name: 'Oporto', lat: 41.1579, lon: -8.6291 },
  { country: 'GB', name: 'Londres', lat: 51.5074, lon: -0.1278 },
  { country: 'GB', name: 'Edimburgo', lat: 55.9533, lon: -3.1883 },
  { country: 'DE', name: 'Berlín', lat: 52.52, lon: 13.405 },
  { country: 'DE', name: 'Múnich', lat: 48.1351, lon: 11.582 },
];

const prefixes = [
  'Hotel',
  'Hostal',
  'Apartamentos',
  'Casa',
  'Loft',
  'Resort',
  'Boutique',
  'Villa',
];

const suffixes = [
  'Central',
  'Plaza',
  'Ribera',
  'Mirador',
  'Jardines',
  'Alameda',
  'Catedral',
  'Puerto',
  'Estación',
  'Mercado',
  'Parque',
  'Muralla',
];

const descriptions = [
  'Alojamiento reformado a pocos minutos del centro histórico.',
  'Habitaciones amplias con vistas y desayuno servido cada mañana.',
  'Edificio clásico rehabilitado, bien comunicado con el transporte público.',
  'Espacio tranquilo en una calle peatonal, ideal para estancias largas.',
  'A un paseo de los principales museos y zonas de restaurantes.',
  'Terraza compartida y recepción disponible las veinticuatro horas.',
];

const roomCatalog = [
  { name: 'Individual', capacity: 1, base: 4500 },
  { name: 'Doble Estándar', capacity: 2, base: 7000 },
  { name: 'Doble Superior', capacity: 2, base: 9500 },
  { name: 'Twin', capacity: 2, base: 8000 },
  { name: 'Triple', capacity: 3, base: 12000 },
  { name: 'Familiar', capacity: 4, base: 16000 },
  { name: 'Suite', capacity: 4, base: 24000 },
  { name: 'Suite Familiar', capacity: 6, base: 31000 },
];

const HOTELS_PER_CITY = 5;

let randomState = 20260923;

const random = () => {
  randomState = (randomState * 1103515245 + 12345) & 0x7fffffff;

  return randomState / 0x7fffffff;
};

const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];

const jitter = (span: number) => (random() - 0.5) * span;

const round = (value: number) => Number(value.toFixed(6));

const generateHotels = () =>
  catalogCities.flatMap((city) =>
    Array.from({ length: HOTELS_PER_CITY }, (_, index) => ({
      name: `${pick(prefixes)} ${city.name} ${pick(suffixes)} ${index + 1}`,
      description: pick(descriptions),
      country: city.country,
      city: city.name,
      address: `Calle ${pick(suffixes)} ${1 + Math.floor(random() * 120)}`,
      latitude: round(city.lat + jitter(0.14)),
      longitude: round(city.lon + jitter(0.18)),
    })),
  );

const generateRoomTypes = () => {
  const count = 2 + Math.floor(random() * 3);
  const chosen = new Set<string>();

  while (chosen.size < count) {
    chosen.add(pick(roomCatalog).name);
  }

  return [...chosen].map((name) => {
    const template = roomCatalog.find((room) => room.name === name)!;
    const drift = 0.75 + random() * 0.7;

    return {
      name,
      capacity: template.capacity,
      priceCents: Math.round((template.base * drift) / 100) * 100,
      defaultUnits: 1 + Math.floor(random() * 6),
    };
  });
};

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

  const byScope = async (scopes: string[]) =>
    prisma.amenity.findMany({ where: { active: true, scope: { in: scopes } } });

  const [hotelPool, roomPool] = await Promise.all([
    byScope(['hotel', 'both']),
    byScope(['room', 'both']),
  ]);

  const sample = <T>(items: T[], max: number) =>
    items.filter(() => random() < 0.5).slice(0, max);

  for (const { country, city, ...rest } of generateHotels()) {
    if (await prisma.hotel.findFirst({ where: { name: rest.name } })) {
      continue;
    }

    const name = normalizeName(city);

    const { id: cityId } = await prisma.city.upsert({
      where: { country_slug: { country, slug: toSlug(name) } },
      update: {},
      create: { country, name, slug: toSlug(name) },
    });

    await prisma.hotel.create({
      data: {
        ...rest,
        cityId,
        hotelAmenities: {
          createMany: {
            data: sample(hotelPool, 4).map(({ id }) => ({ amenityId: id })),
          },
        },
        roomTypes: {
          create: generateRoomTypes().map((room) => ({
            ...room,
            roomTypeAmenities: {
              createMany: {
                data: sample(roomPool, 3).map(({ id }) => ({ amenityId: id })),
              },
            },
          })),
        },
      },
    });
  }

  const orphans = await prisma.hotel.findMany({
    where: { roomTypes: { none: {} } },
    select: { id: true },
  });

  for (const orphan of orphans) {
    await prisma.roomType.createMany({
      data: generateRoomTypes().map((room) => ({ ...room, hotelId: orphan.id })),
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
