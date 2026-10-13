# MavunoWise Provenance Worker

## Architecture Deviation: Direct Polling vs EventOutbox

The V3 Blueprint originally called for a worker using the existing `EventOutbox`. To strictly avoid modifying V1/V2 settlement code (which would be required to emit the event upon settlement), this worker implements a hybrid approach:
1. **Discovery:** It safely polls the `BatchTransactionAllocation` and `BatchGroupTransactionAllocation` tables for settled batches lacking anchors.
2. **Queueing:** It creates a `PROVENANCE_ANCHOR_REQUESTED` event in the `EventOutbox` table.
3. **Processing:** It claims the event from the `EventOutbox` using an atomic `updateMany` operation (acting as a cross-process lock) and processes it.

This ensures we use the `EventOutbox` for reliable retry and claim mechanics without touching the core financial settlement transaction.

## Crash Recovery

If the worker crashes after submitting a blockchain transaction but before saving the result to the database:
1. The `EventOutbox` event remains in `PROCESSING` state temporarily, then reverts to `PENDING` on the next failed attempt.
2. Upon retry, `provenance-service.ts` queries the smart contract's `getAnchor(batchRef)` function.
3. If the anchor is already on-chain, it reconciles the database state by creating the `ProvenanceAnchor` record with transaction hash `RECONCILED`.
4. It does not submit a duplicate transaction, avoiding contract reverts.

## Local Testing

### TypeScript & Worker
1. Ensure `.env` has valid testnet RPC and funded private key.
2. Run `npm run worker:blockchain`

### Smart Contract
1. Install Hardhat: `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox`
2. Run tests: `npx hardhat test`
