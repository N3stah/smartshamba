import { NextRequest, NextResponse } from 'next/server';
import { verifyBatchProvenance } from '@/lib/blockchain/verification-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ batchRef: string }> }) {
  try {
    const { batchRef } = await params;

    // Validate input
    if (!batchRef || batchRef.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(batchRef)) {
      return NextResponse.json({ error: 'Invalid batch reference format.' }, { status: 400 });
    }

    const result = await verifyBatchProvenance(batchRef);

    if (result.status === 'UNKNOWN_BATCH') {
      return NextResponse.json({ status: 'UNKNOWN_BATCH', message: 'Batch reference not found.' }, { status: 404 });
    }

    if (result.status === 'UNAVAILABLE') {
      return NextResponse.json({ status: 'UNAVAILABLE', message: 'Blockchain verification service is currently unavailable.' }, { status: 503 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[VERIFY API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
