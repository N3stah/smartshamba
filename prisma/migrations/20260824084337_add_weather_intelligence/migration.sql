-- CreateEnum
CREATE TYPE "WeatherSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'WARNING');

-- CreateTable
CREATE TABLE "WeatherData" (
    "id" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "data" JSONB,
    "advisory" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherAlert" (
    "id" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "WeatherSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherHistory" (
    "id" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "temp" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "rainMm" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "condition" TEXT,

    CONSTRAINT "WeatherHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherData_county_key" ON "WeatherData"("county");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherAlert_county_type_key" ON "WeatherAlert"("county", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHistory_county_date_key" ON "WeatherHistory"("county", "date");
