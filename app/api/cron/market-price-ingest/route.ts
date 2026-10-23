import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { verifyCronAuth } from '@/lib/cron-auth';
import { ingestMarketData } from '@/lib/market-data/ingestor';

// Vercel Cron: runs daily at 10:00 UTC (13:00 EAT, after market close)
// Add to vercel.json: { "path": "/api/cron/market-price-ingest", "schedule": "0 10 * * *" }
//
// Requires env vars:
//   CRON_SECRET          — bearer token used by Vercel Cron (already set)
//   MARKET_DATA_CSV_URL  — public URL to the source CSV file
//
// The cron downloads the CSV to /tmp (the only writable dir on Vercel serverless),
// feeds the local path to ingestMarketData(), then deletes the temp file.

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — allows large CSV ingestion on Pro plan

export async function GET(req: NextRequest) {
  // 1. Verify cron auth (uses shared helper)
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  // 2. Require data source URL
  const csvUrl = process.env.MARKET_DATA_CSV_URL;
  if (!csvUrl) {
    console.error('[cron/market-price-ingest] MARKET_DATA_CSV_URL is not set — refusing to run');
    return NextResponse.json(
      {
        error: 'MARKET_DATA_CSV_URL not configured',
        hint: 'Set this env var to the public CSV URL containing market price observations'
      },
      { status: 503 }
    );
  }

  // 3. Download CSV to /tmp (only writable dir on Vercel serverless)
  const tmpPath = `/tmp/market-prices-${Date.now()}.csv`;
  console.log(`[cron/market-price-ingest] Downloading ${csvUrl} → ${tmpPath}`);

  try {
    await downloadFile(csvUrl, tmpPath);
    console.log('[cron/market-price-ingest] Download complete');

    // 4. Run ingestion (Wave 2A — SHA256 observationKey handles dedup)
    const report = await ingestMarketData(tmpPath, false);
    console.log('[cron/market-price-ingest] Ingestion complete', {
      rowsRead: report.rowsRead,
      rowsAccepted: report.rowsAccepted,
      rowsRejected: report.rowsRejected,
      rowsProcessed: report.rowsInserted,
      errorCount: report.errors.length
    });

    // 5. Return report (include first 10 errors for debugging if any)
    return NextResponse.json({
      success: true,
      source: csvUrl,
      startedAt: report.startedAt,
      completedAt: report.completedAt,
      rowsRead: report.rowsRead,
      rowsAccepted: report.rowsAccepted,
      rowsRejected: report.rowsRejected,
      rowsProcessed: report.rowsInserted, // upserts (insert or update)
      errorCount: report.errors.length,
      firstErrors: report.errors.slice(0, 10)
    });
  } catch (error) {
    console.error('[cron/market-price-ingest] Error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json(
      { error: 'Ingestion failed', message: (error as Error).message },
      { status: 500 }
    );
  } finally {
    // Always clean up temp file, even on failure
    fs.unlink(tmpPath, () => {});
  }
}

/**
 * Downloads a file from URL to local path. Follows up to 5 redirects.
 * Rejects on non-200 status or network error.
 */
function downloadFile(url: string, dest: string, redirectCount = 0): Promise<void> {
  if (redirectCount > 5) {
    return Promise.reject(new Error(`Too many redirects fetching ${url}`));
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https:') ? https : http;

    const request = protocol.get(url, (response) => {
      // Follow redirects (common for S3 / blob storage signed URLs)
      if ([301, 302, 307, 308].includes(response.statusCode ?? 0)) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlink(dest, () => {});
          downloadFile(redirectUrl, dest, redirectCount + 1).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${response.statusCode} fetching ${url}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}
