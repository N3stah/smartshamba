import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers';
import { getReadOnlyContract } from './read-only-client';

// Canonical JSON serialization to ensure deterministic hashing
// This MUST match the logic in lib/blockchain/provenance-service.ts and lib/deal-assurance/hashing.ts
function getCanonicalEvidence(record: any): string {
  return JSON.stringify(record, Object.keys(record).sort());
}

export function generateProvenanceHash(record: any): string {
  const canonicalStr = getCanonicalEvidence(record);
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalStr));
}

export interface VerificationResult {
  status: 'VERIFIED' | 'NOT_ANCHORED' | 'INTEGRITY_MISMATCH' | 'UNAVAILABLE' | 'UNKNOWN_BATCH';
  batchReference?: string;
  chain?: string;
  evidenceHash?: string;
  anchoredHash?: string;
  transactionHash?: string | null;
  blockNumber?: number | null;
  anchoredAt?: Date | null;
}

export async function verifyBatchProvenance(batchReference: string): Promise<VerificationResult> {
  try {
    // 1. Fetch Batch and related records
    const batch = await prisma.farmBatch.findUnique({
      where: { batchReference },
      include: {
        cropCycle: true,
        dealEvidence: true,
        provenanceAnchors: {
          orderBy: { anchoredAt: 'desc' },
          take: 1 // Get the most recent anchor record
        }
      }
    });

    if (!batch) {
      return { status: 'UNKNOWN_BATCH' };
    }

    if (!batch.dealEvidence) {
      // Cannot reconstruct hash without evidence
      return { status: 'NOT_ANCHORED', batchReference };
    }

    // 2. Reconstruct the exact evidence record used by the worker
    const evidenceRecord = {
      batchId: batch.id,
      batchReference: batch.batchReference,
      crop: batch.cropCycle.crop,
      quantityBags: batch.quantityBags,
      bagSizeKg: batch.bagSizeKg,
      evidenceHash: batch.dealEvidence.evidenceHash,
      capturedAt: batch.dealEvidence.capturedAt.toISOString(),
    };

    const reconstructedHash = generateProvenanceHash(evidenceRecord);

    // 3. Query the blockchain (read-only)
    const contract = getReadOnlyContract();
    if (!contract) {
      return { status: 'UNAVAILABLE', batchReference };
    }

    let onChainHash: string;
    try {
      onChainHash = await contract.getAnchor(batch.batchReference);
    } catch (rpcError: any) {
      console.error('[BLOCKCHAIN VERIFY] RPC call failed:', rpcError.message);
      return { status: 'UNAVAILABLE', batchReference };
    }

    // 4. Compare hashes
    if (onChainHash === ethers.ZeroHash) {
      return { status: 'NOT_ANCHORED', batchReference };
    }

    if (onChainHash !== reconstructedHash) {
      // The hash on chain does not match our reconstructed hash
      return { 
        status: 'INTEGRITY_MISMATCH', 
        batchReference,
        evidenceHash: batch.dealEvidence.evidenceHash,
        anchoredHash: onChainHash
      };
    }

    // 5. Hashes match! Return verified status with metadata
    const dbAnchor = batch.provenanceAnchors[0];
    
    return {
      status: 'VERIFIED',
      batchReference: batch.batchReference,
      chain: 'POLYGON_AMOY',
      evidenceHash: batch.dealEvidence.evidenceHash,
      anchoredHash: onChainHash,
      transactionHash: dbAnchor?.transactionHash || null,
      blockNumber: dbAnchor?.blockNumber || null,
      anchoredAt: dbAnchor?.anchoredAt || null
    };

  } catch (error: any) {
    console.error('[BLOCKCHAIN VERIFY] Unexpected error:', error);
    return { status: 'UNAVAILABLE' };
  }
}
