import { Transaction } from './transaction';

/**
 * Core Buyer interface representing verified grain purchasers in the system.
 */
export interface Buyer {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  capacityBags: number;
  pricePerBag: number;
  active: boolean;
  createdAt?: Date;
  transactions?: Transaction[];
}

/**
 * Input used when onboarding a new verified buyer through the admin dashboard.
 */
export interface CreateBuyerInput {
  name: string;
  location: string;
  pricePerBag: number;
  capacityBags: number;
}

/**
 * Input for updating market prices or demand capacity during the harvest season.
 */
export interface UpdateBuyerInput {
  name?: string;
  location?: string;
  pricePerBag?: number;
  capacityBags?: number;
}
