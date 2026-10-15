import { ExecutableOffer } from './types';

export function calculateNetback(
  offer: ExecutableOffer,
  bagSizeKg: number,
  transportCostPerBag: number | null
): number | null {
  if (bagSizeKg <= 0) return null;
  
  const grossPerBag = offer.pricePerBag;
  if (isNaN(grossPerBag) || grossPerBag < 0) return null;

  // Missing costs are not silently interpreted as zero
  if (transportCostPerBag === null || transportCostPerBag === undefined || isNaN(transportCostPerBag)) {
    return null;
  }
  
  return grossPerBag - transportCostPerBag;
}
