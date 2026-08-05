-- CreateTable
CREATE TABLE "WeatherCache" (
    "id" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "advisory" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherAlert" (
    "id" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCache_county_key" ON "WeatherCache"("county");

-- CreateIndex
CREATE INDEX "WeatherAlert_county_createdAt_idx" ON "WeatherAlert"("county", "createdAt");
