import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

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
];

async function main() {
  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: {},
      create: amenity,
    });
  }

  for (const hotel of hotels) {
    const exists = await prisma.hotel.findFirst({ where: { name: hotel.name } });
    if (!exists) {
      await prisma.hotel.create({ data: hotel });
    }
  }

  const [hotelCount, amenityCount] = await Promise.all([
    prisma.hotel.count(),
    prisma.amenity.count(),
  ]);

  console.log(`Seed done: ${hotelCount} hotels, ${amenityCount} amenities`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
