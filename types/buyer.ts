import { Transaction } from './transaction';

/**
 * Core Buyer interface representing verified grain purchasers in the system.
 */
export interface Buyer {
  id: string;
  name: string;
  location: string; // E.g., "Mois Bridge", "Kitale Town"
  pricePerBag: number; // Current market offer price in KSh
  capacityBags: number; // Total demand or storage capacity
  createdAt: Date;
  transactions?: Transaction[]; // Historical and pending offers from farmers
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