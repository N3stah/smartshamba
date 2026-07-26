import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/auditLog';
import { isValidKenyanNationalId, sanitizeNationalId } from '@/lib/kyc';
import * as Sentry from '@sentry/nextjs';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const { name, phone, nationalId } = body;

    // Validation
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone number are required.' }, { status: 400 });
    }

    if (!/^\+254\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone format. Use +254XXXXXXXXX.' }, { status: 400 });
    }

    let cleanId = nationalId;
    if (cleanId && !isValidKenyanNationalId(cleanId)) {
      return NextResponse.json({ error: 'National ID must be 8 digits.' }, { status: 400 });
    }
    if (cleanId) cleanId = sanitizeNationalId(cleanId)!;

    const existingFarmer = await prisma.farmer.findUnique({ where: { id } });
    if (!existingFarmer) {
      return NextResponse.json({ error: 'Farmer not found.' }, { status: 404 });
    }

    // Check if phone is being changed and if it conflicts with another user
    if (phone !== existingFarmer.phone) {
      const phoneConflict = await prisma.farmer.findUnique({ where: { phone } });
      if (phoneConflict) {
        return NextResponse.json({ error: 'This phone number is already registered to another farmer.' }, { status: 409 });
      }
    }

    const updatedFarmer = await prisma.farmer.update({
      where: { id },
      data: {
        name,
        phone,
        nationalId: cleanId,
      },
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'UPDATE_FARMER_PROFILE',
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'Farmer',
      entityId: id,
      before: { name: existingFarmer.name, phone: existingFarmer.phone, nationalId: existingFarmer.nationalId },
      after: { name: updatedFarmer.name, phone: updatedFarmer.phone, nationalId: updatedFarmer.nationalId },
    });

    return NextResponse.json({ success: true, farmer: updatedFarmer });
  } catch (error) {
    console.error('[ADMIN] Error updating farmer:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
