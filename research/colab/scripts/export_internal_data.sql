-- MavunoWise Internal Data Export Script
-- Run this against Supabase/DBeaver to export raw internal data.
-- DO NOT connect Google Colab directly to production.

-- NOTE: ml_consent_status is a future V3 field. For now, we export all 
-- transactions and filter in the Colab notebook based on available consent flags.

-- 1. Export Transactions
SELECT 
    t.id as transaction_id,
    t.reference,
    t.farmer_id,
    t.buyer_id,
    t.priceperbag,
    t.quantitybags,
    t.totalvalue,
    t.status,
    t.createdat,
    t.county_id,
    t.ward_id
FROM "Transaction" t;

-- 2. Export Farm Crop Cycles
SELECT 
    fcc.id as crop_cycle_id,
    fcc.farmer_id,
    fcc.crop,
    fcc.season,
    fcc.acreage,
    fcc.expectedyieldbags,
    fcc.actualyieldbags,
    fcc.plantingdate,
    fcc.actualharvestdate
FROM "FarmCropCycle" fcc;

-- 3. Export Farm Cost Entries
SELECT 
    fce.id as cost_entry_id,
    fce.crop_cycle_id,
    fce.category,
    fce.amountkes,
    fce.date
FROM "FarmCostEntry" fce;
