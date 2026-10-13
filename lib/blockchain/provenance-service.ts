import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';
import { contract } from './config';

// Canonical JSON serialization to ensure deterministic hashing
function getCanonicalEvidence(record: any): string {
  return JSON.stringify(record, Object.keys(record).sort());
}

export function generateEvidenceHash(record: any): string {
  const canonicalStr = getCanonicalEvidence(record);
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalStr));
}

export async function anchorBatch(batchId: string): Promise<void> {
  console.log(`[PROVENANCE] Starting anchor process for batch ${batchId}`);
  
  const batch = await prisma.farmBatch.findUnique({
    where: { id: batchId },
    include: {
      cropCycle: true,
      BatchTransactionAllocation: { include: { transaction: true } },
      BatchGroupTransactionAllocation: { include: { groupTransaction: true } },
      dealEvidence: true,
    }
  });

  if (!batch) throw new Error(`Batch ${batchId} not found.`);
  if (!batch.dealEvidence) throw new Error(`Batch ${batchId} has no deal evidence to anchor.`);

  // 1. POLICY: ALL associated transactions must be SETTLED before anchoring
  const individualAllocations = batch.BatchTransactionAllocation || [];
  const groupAllocations = batch.BatchGroupTransactionAllocation || [];
  const allocations = [...individualAllocations, ...groupAllocations];
  
  if (allocations.length === 0) throw new Error(`Batch ${batchId} has no associated sales allocations.`);
  
  for (const alloc of allocations) {
    const tx = (alloc as any).transaction || (alloc as any).groupTransaction;
    if (!tx || tx.status !== 'SETTLED') {
      throw new Error(`Batch ${batchId} has an associated transaction (${tx?.id || 'unknown'}) that is not settled. Anchoring aborted.`);
    }
  }

  // 2. Build canonical evidence record (excluding PII)
  const evidenceRecord = {
    batchId: batch.id,
    batchReference: batch.batchReference,
    crop: batch.cropCycle.crop,
    quantityBags: batch.quantityBags,
    bagSizeKg: batch.bagSizeKg,
    evidenceHash: batch.dealEvidence.evidenceHash,
    capturedAt: batch.dealEvidence.capturedAt.toISOString(),
  };

  const anchorHash = generateEvidenceHash(evidenceRecord);

  // 3. Check if already anchored in DB
  const existingAnchor = await prisma.provenanceAnchor.findFirst({
    where: { batchId: batch.id }
  });

  if (existingAnchor && existingAnchor.transactionHash) {
    console.log(`[PROVENANCE] Batch ${batchId} already anchored with tx ${existingAnchor.transactionHash}`);
    return;
  }

  // 4. Crash Recovery: Check if already anchored on-chain
  console.log(`[PROVENANCE] Checking on-chain state for batch ${batch.batchReference}...`);
  let onChainHash;
  try {
    onChainHash = await contract.getAnchor(batch.batchReference);
  } catch (error: any) {
    throw new Error(`RPC check failed: ${error.message}`);
  }

  if (onChainHash !== ethers.ZeroHash) {
    console.log(`[PROVENANCE] Batch ${batchId} is already anchored on-chain. Reconciling...`);
    
    // INTEGRITY CHECK: Compare on-chain hash with locally computed hash
    if (onChainHash !== anchorHash) {
      throw new Error(`Integrity Error: On-chain hash ${onChainHash} does not match local hash ${anchorHash} for batch ${batchId}.`);
    }

    // Retrieve actual transaction hash and block number from event logs
    let txHash: string | null = null;
    let blockNum: number | null = null;
    try {
      const events = await contract.queryFilter('AnchorRecorded');
      const event = events.find((e): e is ethers.EventLog => 'args' in e && e.args?.batchRef === batch.batchReference);
      if (event) {
        txHash = event.transactionHash;
        blockNum = event.blockNumber;
      }
    } catch (error: any) {
      console.warn(`[PROVENANCE] Could not retrieve event logs for batch ${batchId}: ${error.message}`);
    }

    const anchorData = {
      certificateHash: onChainHash,
      transactionHash: txHash,
      blockNumber: blockNum,
      chain: 'POLYGON' as const,
      schemaVersion: '1.0',
      anchoredAt: new Date(),
    };

    if (existingAnchor) {
      await prisma.provenanceAnchor.update({
        where: { id: existingAnchor.id },
        data: anchorData
      });
    } else {
      await prisma.provenanceAnchor.create({
        data: { batchId: batch.id, ...anchorData }
      });
    }
    console.log(`[PROVENANCE] Reconciliation complete for batch ${batchId}`);
    return;
  }

  // 5. Submit to blockchain
  console.log(`[PROVENANCE] Submitting anchor to blockchain for batch ${batchId}...`);
  const tx = await contract.recordAnchor(batch.batchReference, anchorHash);
  
  console.log(`[PROVENANCE] Transaction submitted: ${tx.hash}. Waiting for confirmation...`);
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log(`[PROVENANCE] Anchor confirmed in block ${receipt.blockNumber}`);
    
    // 6. Persist to database
    const anchorData = {
      certificateHash: anchorHash,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      chain: 'POLYGON' as const,
      schemaVersion: '1.0',
      anchoredAt: new Date(),
    };

    if (existingAnchor) {
      await prisma.provenanceAnchor.update({
        where: { id: existingAnchor.id },
        data: anchorData
      });
    } else {
      await prisma.provenanceAnchor.create({
        data: {
          batchId: batch.id,
          ...anchorData
        }
      });
    }
    console.log(`[PROVENANCE] Successfully anchored batch ${batchId}`);
  } else {
    throw new Error(`Transaction reverted for batch ${batchId}`);
  }
}
