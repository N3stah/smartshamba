// @ts-nocheck
// TODO: V2 - Re-enable type checking after this module schema is built
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import PDFDocument from 'pdfkit';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const [balance, entries] = await Promise.all([
      getWalletBalance(farmer.id, 'FARMER'),
      (prisma as any).ledgerEntry.findMany({
        where: { userId: farmer.id, userType: 'FARMER' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', (buffer) => buffers.push(buffer));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="SmartShamba_Statement.pdf"`,
        },
      });
    });

    // Header
    doc.fontSize(20).fillColor('#00703C').text('SmartShamba', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Wallet Statement', { align: 'center' });
    doc.moveDown(1.5);

    // User Info
    doc.fillColor('#000').fontSize(12).text(`Farmer: ${farmer.name}`);
    doc.fontSize(10).text(`Phone: ${farmer.phone}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-KE')}`);
    doc.moveDown(1);

    // Balance
    doc.fillColor('#00703C').fontSize(14).text(`Available Balance: KSh ${balance.toLocaleString()}`);
    doc.moveDown(1.5);

    // Table Header
    doc.fillColor('#000').fontSize(10);
    doc.text('Date', 50, doc.y, { width: 100 });
    doc.text('Description', 150, doc.y - 12, { width: 200 });
    doc.text('Debit (KSh)', 350, doc.y - 12, { width: 80, align: 'right' });
    doc.text('Credit (KSh)', 430, doc.y - 12, { width: 80, align: 'right' });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Table Rows
    doc.fontSize(9);
    entries.forEach(e => {
      const y = doc.y;
      if (y > 750) { doc.addPage(); }
      
      doc.fillColor('#666').text(new Date(e.createdAt).toLocaleDateString('en-KE'), 50, y, { width: 100 });
      doc.fillColor('#000').text(e.description.substring(0, 30) + '...', 150, y, { width: 200 });
      
      if (e.entryType === 'DEBIT') {
        doc.text(e.amount.toLocaleString(), 350, y, { width: 80, align: 'right' });
      } else {
        doc.text('-', 350, y, { width: 80, align: 'right' });
      }
      
      if (e.entryType === 'CREDIT') {
        doc.text(e.amount.toLocaleString(), 430, y, { width: 80, align: 'right' });
      } else {
        doc.text('-', 430, y, { width: 80, align: 'right' });
      }
      doc.moveDown(0.5);
    });

    doc.end();
    return; // Handled by end() event
  } catch (error) {
    console.error('[API] Farmer PDF error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
