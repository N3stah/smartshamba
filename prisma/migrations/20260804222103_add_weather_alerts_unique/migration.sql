/*
  Warnings:

  - A unique constraint covering the columns `[county,type]` on the table `WeatherAlert` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WeatherAlert_county_type_key" ON "WeatherAlert"("county", "type");
