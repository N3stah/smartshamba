import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const { whatsappLink } = await req.json();
    
    if (!whatsappLink || !whatsappLink.startsWith('https://chat.whatsapp.com/')) {
      return NextResponse.json({ error: 'Invalid WhatsApp link format' }, { status: 400 });
    }
    
    const group = await prisma.farmerGroup.findUnique({ where: { id }, select: { createdById: true } });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    
    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer || group.createdById !== farmer.id) {
      return NextResponse.json({ error: 'Only group creator can update this' }, { status: 403 });
    }
    
    await prisma.farmerGroup.update({ where: { id }, data: { whatsappLink } });
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
