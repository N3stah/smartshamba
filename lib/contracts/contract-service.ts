import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/auditLog';
import * as Sentry from '@sentry/nextjs';

/**
 * Generates or retrieves a contract for a transaction.
 */
interface TxData {
  farmerId: string;
  buyerId: string;
  quantityBags: number;
  pricePerBag: number;
  totalValue: number;
  farmer?: { name?: string };
  buyer?: { name?: string };
}
export async function getOrCreateContract(transactionId: string, txData: TxData) {
  try {
    let contract = await prisma.contract.findUnique({
      where: { transactionId }
    });

    if (!contract) {
      contract = await prisma.contract.create({
        data: {
          transactionId,
          sellerId: txData.farmerId,
          buyerId: txData.buyerId,
          quantity: txData.quantityBags,
          pricePerUnit: txData.pricePerBag,
          totalValue: txData.totalValue,
          status: 'DRAFT',
          terms: {
            crop: 'Maize',
            quantityBags: txData.quantityBags,
            pricePerBag: txData.pricePerBag,
            totalValue: txData.totalValue,
            farmerName: txData.farmer?.name ?? 'Unknown Farmer',
            buyerName: txData.buyer?.name ?? 'Unknown Buyer',
            date: new Date().toISOString()
          } as unknown as import("@prisma/client").Prisma.InputJsonValue
        }
      });
      console.log(`[CONTRACT] Created draft contract for tx ${transactionId}`);
    }

    return contract;
  } catch (error) {
    console.error('[CONTRACT] Error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }
}

/**
 * Signs the contract on behalf of the user and records an Audit Log.
 */
export async function signContract(
  transactionId: string, 
  userType: 'FARMER' | 'BUYER', 
  signatureName: string,
  actorId: string
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { transactionId }
    });

    if (!contract) throw new Error('Contract not found');
    if (contract.status === 'EXECUTED' || contract.status === 'SIGNED') throw new Error('Contract already executed/signed');
    if (contract.status === 'VOIDED' || contract.status === 'DISPUTED' || contract.status === 'CANCELLED') throw new Error('Contract is voided, disputed, or cancelled');

    const updateData: Record<string, unknown> = {};
    if (userType === 'FARMER') {
      if (contract.farmerSigned) throw new Error('Farmer has already signed');
      updateData.farmerSigned = true;
      updateData.farmerSignedAt = new Date();
      updateData.farmerSignature = signatureName;
    } else {
      if (contract.buyerSigned) throw new Error('Buyer has already signed');
      updateData.buyerSigned = true;
      updateData.buyerSignedAt = new Date();
      updateData.buyerSignature = signatureName;
    }

    const willExecute = (userType === 'FARMER' && contract.buyerSigned) || (userType === 'BUYER' && contract.farmerSigned);
    if (willExecute) {
      updateData.status = 'EXECUTED';
    } else {
      updateData.status = 'PENDING_SIGNATURE';
    }

    const updated = await prisma.contract.update({
      where: { transactionId },
      data: updateData
    });

    await recordAuditLog({
      action: willExecute ? 'CONTRACT_EXECUTED' : 'CONTRACT_SIGNED',
      actorType: 'SYSTEM',
      actorId: actorId,
      entityType: 'Contract',
      entityId: updated.id,
      before: { status: contract.status },
      after: { status: updated.status, signedBy: userType }
    });

    return updated;
  } catch (error) {
    console.error('[CONTRACT] Sign error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }
}

/**
 * Updates contract terms dynamically (e.g., when transport is booked).
 */
export async function updateContractTerms(transactionId: string, updates: Record<string, unknown>) {
  try {
    const contract = await prisma.contract.findUnique({ where: { transactionId } });
    if (!contract) return;

    await prisma.contract.update({
      where: { transactionId },
      data: updates
    });
  } catch (error) {
    console.error('[CONTRACT] Update terms error:', error);
  }
}
