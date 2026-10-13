import { ethers } from 'ethers';

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const PRIVATE_KEY = process.env.PROVENANCE_SIGNER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.PROVENANCE_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = parseInt(process.env.EXPECTED_CHAIN_ID || '80002', 10); // Default Polygon Amoy Testnet

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('Missing blockchain configuration. Please check BLOCKCHAIN_RPC_URL, PROVENANCE_SIGNER_PRIVATE_KEY, and PROVENANCE_CONTRACT_ADDRESS in .env');
}

export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

export const contractABI = [
  "function recordAnchor(string batchRef, bytes32 evidenceHash) external",
  "function getAnchor(string batchRef) external view returns (bytes32)",
  "event AnchorRecorded(string batchRef, bytes32 evidenceHash, uint256 timestamp)"
];

export const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

export async function validateNetwork(): Promise<void> {
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
    throw new Error(`Network mismatch: Expected chain ID ${EXPECTED_CHAIN_ID}, but connected to ${network.chainId}`);
  }
}
