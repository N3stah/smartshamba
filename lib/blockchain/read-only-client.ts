import { ethers } from 'ethers';

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const CONTRACT_ADDRESS = process.env.PROVENANCE_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = parseInt(process.env.EXPECTED_CHAIN_ID || '80002', 10);

export const contractABI = [
  "function getAnchor(string batchRef) external view returns (bytes32)"
];

export function getReadOnlyContract(): ethers.Contract | null {
  if (!RPC_URL || !CONTRACT_ADDRESS) {
    console.warn('[BLOCKCHAIN VERIFY] Missing RPC_URL or CONTRACT_ADDRESS. Read-only verification disabled.');
    return null;
  }
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
}

export async function validateNetwork(provider: ethers.JsonRpcProvider): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    return network.chainId === BigInt(EXPECTED_CHAIN_ID);
  } catch (error) {
    console.error('[BLOCKCHAIN VERIFY] Network validation failed:', error);
    return false;
  }
}
