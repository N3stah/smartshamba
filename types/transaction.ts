// types/transaction.ts
import { Farmer } from './farmer';
import { Buyer } from './buyer';

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DELIVERED = 'DELIVERED',
  SETTLED = 'SETTLED',
  DISPUTED = 'DISPUTED',
}

export interface Transaction {
  id: string;
  reference: string;
  farmerId: string;
  farmer?: Farmer;
  buyerId: string;
  buyer?: Buyer;
  quantityBags: number;
  pricePerBag: number;
  totalValue: number;
  status: TransactionStatus;
  mpesaRef?: string | null;
  createdAt: Date;
}

export interface CreateTransactionInput {
  farmerId: string;
  buyerId: string;
  quantityBags: number;
}