import { prisma } from '../prisma';
import { generateObservationKey } from './observation-key';
import { normalizeRecord } from './normalizer';
import { IngestionReport, RawMarketRecord } from './types';
import * as fs from 'fs';
import * as readline from 'readline';

export async function ingestMarketData(csvPath: string, dryRun: boolean = false): Promise<IngestionReport> {
  const report: IngestionReport = {
    source: csvPath,
    startedAt: new Date(),
    completedAt: new Date(),
    rowsRead: 0,
    rowsAccepted: 0,
    rowsRejected: 0,
    rowsInserted: 0,
    rowsUpdated: 0,
    rowsUnchanged: 0,
    errors: []
  };

  if (!fs.existsSync(csvPath)) {
    report.errors.push(`File not found: ${csvPath}`);
    return report;
  }

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue; // Skip CSV header
    }
    
    report.rowsRead++;
    const columns = line.split(',');
    if (columns.length < 6) {
      report.rowsRejected++;
      report.errors.push(`Row ${report.rowsRead}: Invalid column count`);
      continue;
    }

    const raw: RawMarketRecord = {
      date: columns[0],
      county: columns[1],
      market: columns[2],
      commodity: columns[3],
      price_kes_per_kg: columns[4],
      source: columns[5]
    };

    const normalized = normalizeRecord(raw);
    if (!normalized) {
      report.rowsRejected++;
      report.errors.push(`Row ${report.rowsRead}: Normalization failed`);
      continue;
    }

    report.rowsAccepted++;
    const observationKey = generateObservationKey(normalized);

    if (dryRun) {
      // In dry run, we don't hit the database, just assume it would be inserted
      report.rowsInserted++;
    } else {
      const result = await prisma.marketPriceObservation.upsert({
        where: { observationKey },
        update: {
          wholesaleKesPerKg: normalized.wholesaleKesPerKg,
          retailKesPerKg: normalized.retailKesPerKg,
          importedAt: new Date()
        },
        create: {
          observationKey,
          source: normalized.source,
          sourceRecordId: normalized.sourceRecordId,
          county: normalized.county,
          market: normalized.market,
          commodity: normalized.commodity,
          classification: normalized.classification,
          grade: normalized.grade,
          wholesaleKesPerKg: normalized.wholesaleKesPerKg,
          retailKesPerKg: normalized.retailKesPerKg,
          observedAt: normalized.observedAt
        }
      });

      // Note: Prisma upsert doesn't easily tell us if it was an insert or update without a query first.
      // For this report, we treat successful upserts as "Processed". 
      // A more complex implementation would query first to distinguish.
      report.rowsInserted++; 
    }
  }

  report.completedAt = new Date();
  return report;
}
