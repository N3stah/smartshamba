import { ingestMarketData } from '../lib/market-data/ingestor';

async function main() {
  const csvPath = process.argv[2];
  const isDryRun = process.argv.includes('--dry-run');

  if (!csvPath) {
    console.error('Usage: npx tsx scripts/run-market-ingestion.ts <path-to-csv> [--dry-run]');
    process.exit(1);
  }

  console.log(`Starting ingestion from ${csvPath} ${isDryRun ? '(DRY RUN)' : ''}...`);
  
  const report = await ingestMarketData(csvPath, isDryRun);

  console.log('\n--- Ingestion Report ---');
  console.log(`Source: ${report.source}`);
  console.log(`Started: ${report.startedAt.toISOString()}`);
  console.log(`Completed: ${report.completedAt.toISOString()}`);
  console.log(`Rows Read: ${report.rowsRead}`);
  console.log(`Rows Accepted: ${report.rowsAccepted}`);
  console.log(`Rows Rejected: ${report.rowsRejected}`);
  console.log(`Rows Processed (Inserted/Updated): ${report.rowsInserted}`);
  
  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    report.errors.slice(0, 5).forEach(e => console.log(`- ${e}`));
  }
  console.log('------------------------\n');
}

main();
