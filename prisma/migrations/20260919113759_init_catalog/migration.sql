-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "city_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "default_units" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'hotel',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_amenities" (
    "hotel_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,

    CONSTRAINT "hotel_amenities_pkey" PRIMARY KEY ("hotel_id","amenity_id")
);

-- CreateTable
CREATE TABLE "room_type_amenities" (
    "room_type_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,

    CONSTRAINT "room_type_amenities_pkey" PRIMARY KEY ("room_type_id","amenity_id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "hotel_id" UUID,
    "room_type_id" UUID,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_country_slug_key" ON "cities"("country", "slug");

-- CreateIndex
CREATE INDEX "cities_country_name_idx" ON "cities"("country", "name");

-- CreateIndex
CREATE INDEX "hotels_city_id_idx" ON "hotels"("city_id");

-- CreateIndex
CREATE INDEX "room_types_hotel_id_idx" ON "room_types"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_code_key" ON "amenities"("code");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_amenities" ADD CONSTRAINT "hotel_amenities_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_amenities" ADD CONSTRAINT "hotel_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_amenities" ADD CONSTRAINT "room_type_amenities_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_amenities" ADD CONSTRAINT "room_type_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amenities"
  ADD CONSTRAINT "amenities_valid_scope"
  CHECK ("scope" IN ('hotel', 'room', 'both'));

ALTER TABLE "room_types"
  ADD CONSTRAINT "room_types_positive_values"
  CHECK ("capacity" > 0 AND "price_cents" >= 0 AND "default_units" >= 0);

ALTER TABLE "photos"
  ADD CONSTRAINT "photos_belongs_to_one"
  CHECK (num_nonnulls("hotel_id", "room_type_id") = 1);

ALTER TABLE "cities"
  ADD CONSTRAINT "cities_country_uppercase"
  CHECK ("country" = upper("country"));

DROP INDEX "hotels_city_id_idx";
CREATE INDEX "idx_hotels_city" ON "hotels" ("city_id") WHERE "active";

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "idx_hotels_name_trgm" ON "hotels" USING gin ("name" gin_trgm_ops);
CREATE INDEX "idx_room_types_name_trgm" ON "room_types" USING gin ("name" gin_trgm_ops);
CREATE INDEX "idx_cities_slug_trgm" ON "cities" USING gin ("slug" gin_trgm_ops);

DROP INDEX "room_types_hotel_id_idx";
CREATE INDEX "idx_room_types_hotel" ON "room_types" ("hotel_id") WHERE "active";
