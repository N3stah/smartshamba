import { ethers } from 'ethers';
import { EvidenceRecord } from './types';

// Canonical JSON serialization to ensure deterministic hashing
function getCanonicalEvidence(record: EvidenceRecord): string {
  return JSON.stringify(record, Object.keys(record).sort());
}

export function generateEvidenceHash(record: EvidenceRecord): string {
  const canonicalStr = getCanonicalEvidence(record);
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalStr));
}
