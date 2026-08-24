import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';
import { generateContractPdf } from '@/lib/contracts/pdf-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Auth check: Only parties involved or admin can download
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !requireAdminAuth(req);
    
    if (!farmerPhone && !buyerPhone && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({ where: { transactionId: id } });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    const pdfBuffer = await generateContractPdf(contract.id);
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SmartShamba_Contract_${contract.id.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[API] PDF Generation error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
