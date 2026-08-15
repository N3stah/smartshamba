import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date('2023-01-01');
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();
    const county = searchParams.get('county') || undefined;
    const crop = searchParams.get('crop') || undefined;

    // If county filter is applied, fetch matching farmer IDs first
    let farmerIds: string[] | undefined = undefined;
    if (county) {
      const farmers = await prisma.farmer.findMany({
        where: { county: { name: { contains: county, mode: 'insensitive' } } },
        select: { id: true }
      });
      farmerIds = farmers.map(f => f.id);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        
        ...(farmerIds && { farmerId: { in: farmerIds } })
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'json') {
      return NextResponse.json(transactions);
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Transactions Report');
      sheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Reference', key: 'ref', width: 25 },
        { header: 'Crop', key: 'crop', width: 15 },
        { header: 'Farmer ID', key: 'farmerId', width: 25 },
        { header: 'Buyer ID', key: 'buyerId', width: 25 },
        { header: 'Bags', key: 'bags', width: 10 },
        { header: 'Total Value (KSh)', key: 'total', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      transactions.forEach(t => {
        sheet.addRow({
          date: new Date(t.createdAt).toLocaleDateString(),
          ref: t.reference,
          crop: crop || 'All',
          farmerId: t.farmerId,
          buyerId: t.buyerId,
          bags: t.quantityBags,
          total: t.totalValue,
          status: t.status
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="smartshamba_report.xlsx"'
        }
      });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      return new Promise<NextResponse>((resolve) => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="smartshamba_report.pdf"'
            }
          }));
        });

        doc.fontSize(20).fillColor('#00703C').text('SmartShamba BI Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).fillColor('black').text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
        if (county) doc.text(`County: ${county}`, { align: 'center' });
        if (crop) doc.text(`Crop: ${crop}`, { align: 'center' });
        doc.moveDown(2);

        transactions.forEach(t => {
          doc.fontSize(10).fillColor('black').text(`${new Date(t.createdAt).toLocaleDateString()} | ${t.reference} `);
          doc.fontSize(9).fillColor('gray').text(`Farmer ID: ${t.farmerId} | Buyer ID: ${t.buyerId} | Bags: ${t.quantityBags} | Total: KSh ${t.totalValue} | Status: ${t.status}`);
          doc.moveDown(0.5);
        });

        doc.end();
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
