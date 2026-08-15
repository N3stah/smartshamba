-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography columns to existing tables
ALTER TABLE "Farmer" ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
ALTER TABLE "Buyer" ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
ALTER TABLE "Warehouse" ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Create GiST spatial indexes for fast nearest-neighbor queries
CREATE INDEX IF NOT EXISTS idx_farmer_location ON "Farmer" USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_buyer_location ON "Buyer" USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_warehouse_location ON "Warehouse" USING GIST (location);

-- Create triggers to keep 'location' synced with 'latitude' and 'longitude'
CREATE OR REPLACE FUNCTION update_farmer_location() RETURNS TRIGGER AS $$ BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
  END IF;
  RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_farmer_location ON "Farmer";
CREATE TRIGGER trg_farmer_location BEFORE INSERT OR UPDATE OF latitude, longitude ON "Farmer"
FOR EACH ROW EXECUTE FUNCTION update_farmer_location();

CREATE OR REPLACE FUNCTION update_buyer_location() RETURNS TRIGGER AS $$ BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
  END IF;
  RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_buyer_location ON "Buyer";
CREATE TRIGGER trg_buyer_location BEFORE INSERT OR UPDATE OF latitude, longitude ON "Buyer"
FOR EACH ROW EXECUTE FUNCTION update_buyer_location();
