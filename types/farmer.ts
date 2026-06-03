import { Transaction } from './transaction';

/**
 * Core Farmer interface matching the PostgreSQL schema in Supabase.
 */
export interface Farmer {
  id: string;
  phone: string; // Used as the primary identifier for USSD sessions.
  name?: string | null;
  location?: string | null; // Targeted at Trans Nzoia County regions.
  createdAt: Date;
  transactions?: Transaction[]; // Relation to recorded offers.
}

/**
 * Payload for registering a new farmer via Africa's Talking USSD.
 */
export interface CreateFarmerInput {
  phone: string;
  name?: string;
  location?: string;
}

/**
 * Input for updating profile details from the admin dashboard.
 */
export interface UpdateFarmerInput {
  name?: string;
  location?: string;
}