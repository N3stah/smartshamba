import { DecisionInput, DecisionResult, ExecutableOffer, ForecastMetadata } from './types';
import { calculateNetback } from './netback';

export function evaluatePolicy(input: DecisionInput): DecisionResult {
  const warnings: string[] = [];
  
  // Validate essential inputs
  if (!input.bagSizeKg || input.bagSizeKg <= 0) {
    return {
      action: 'INSUFFICIENT_EVIDENCE',
      reason: 'MISSING_BAG_SIZE',
      rationale: 'Cannot calculate netback without a valid bag size.',
      warnings: ['bagSizeKg is missing or invalid.'],
      evidence: {
        offersEvaluated: input.currentOffers.length,
        observationsEvaluated: input.marketObservations.length,
        forecastAvailable: !!input.forecast,
        forecastIsFallback: input.forecast?.isFallback ?? false
      },
      forecastMetadata: input.forecast ? {
        modelVersion: input.forecast.modelVersion,
        trainingDatasetVersion: input.forecast.trainingDatasetVersion,
        trainingDataCutoff: input.forecast.trainingDataCutoff,
        forecastHorizon: input.forecast.forecastHorizon,
        predictionTimestamp: input.forecast.predictionTimestamp,
        isFallback: input.forecast.isFallback,
        confidence: input.forecast.confidence,
        boundType: input.forecast.boundType
      } : null
    };
  }

  // Evaluate Executable Offers
  const validOffers = input.currentOffers.filter(offer => {
    if (!offer.pricePerBag || offer.pricePerBag <= 0) return false;
    if (offer.validUntil && new Date(offer.validUntil) < new Date()) return false;
    return true;
  });

  if (validOffers.length === 0) {
    return {
      action: 'INSUFFICIENT_EVIDENCE',
      reason: 'NO_EXECUTABLE_OFFERS',
      rationale: 'No valid, current buyer offers available to evaluate.',
      warnings,
      evidence: {
        offersEvaluated: 0,
        observationsEvaluated: input.marketObservations.length,
        forecastAvailable: !!input.forecast,
        forecastIsFallback: input.forecast?.isFallback ?? false
      },
      forecastMetadata: input.forecast ? {
        modelVersion: input.forecast.modelVersion,
        trainingDatasetVersion: input.forecast.trainingDatasetVersion,
        trainingDataCutoff: input.forecast.trainingDataCutoff,
        forecastHorizon: input.forecast.forecastHorizon,
        predictionTimestamp: input.forecast.predictionTimestamp,
        isFallback: input.forecast.isFallback,
        confidence: input.forecast.confidence,
        boundType: input.forecast.boundType
      } : null
    };
  }

  // Calculate Netbacks (requires explicit transport cost)
  const offersWithNetback = validOffers.map(offer => ({
    offer,
    netback: calculateNetback(offer, input.bagSizeKg, input.transportCostPerBag ?? null)
  })).filter(x => x.netback !== null) as { offer: ExecutableOffer; netback: number }[];

  if (offersWithNetback.length === 0) {
    return {
      action: 'INSUFFICIENT_EVIDENCE',
      reason: 'MISSING_TRANSPORT_COST',
      rationale: 'Transport cost is missing. Cannot calculate complete netback for any offer.',
      warnings: ['transportCostPerBag must be provided to evaluate offers.'],
      evidence: {
        offersEvaluated: validOffers.length,
        observationsEvaluated: input.marketObservations.length,
        forecastAvailable: !!input.forecast,
        forecastIsFallback: input.forecast?.isFallback ?? false
      },
      forecastMetadata: input.forecast ? {
        modelVersion: input.forecast.modelVersion,
        trainingDatasetVersion: input.forecast.trainingDatasetVersion,
        trainingDataCutoff: input.forecast.trainingDataCutoff,
        forecastHorizon: input.forecast.forecastHorizon,
        predictionTimestamp: input.forecast.predictionTimestamp,
        isFallback: input.forecast.isFallback,
        confidence: input.forecast.confidence,
        boundType: input.forecast.boundType
      } : null
    };
  }

  // Find best offer
  const bestOption = offersWithNetback.reduce((best, current) => 
    current.netback > best.netback ? current : best
  );

  // Profitability Check (separate from SELL decision)
  if (input.breakEvenPricePerBag !== null && bestOption.netback < input.breakEvenPricePerBag) {
    warnings.push(`Best netback (${bestOption.netback.toFixed(2)} KES/bag) is below break-even price (${input.breakEvenPricePerBag.toFixed(2)} KES/bag). Accepting this offer will result in a net loss on production costs.`);
  }

  // Build forecast metadata for ALL return paths
  const forecastMetadata: ForecastMetadata | null = input.forecast ? {
    modelVersion: input.forecast.modelVersion,
    trainingDatasetVersion: input.forecast.trainingDatasetVersion,
    trainingDataCutoff: input.forecast.trainingDataCutoff,
    forecastHorizon: input.forecast.forecastHorizon,
    predictionTimestamp: input.forecast.predictionTimestamp,
    isFallback: input.forecast.isFallback,
    confidence: input.forecast.confidence,
    boundType: input.forecast.boundType
  } : null;

  // HOLD/STORE Logic - Requires non-fallback, reliable forecast
  if (input.forecast) {
    if (!input.forecast.isFallback && input.forecast.confidence !== 'LOW') {
      // Convert forecast KES/kg to KES/bag
      const forecastPerBag = input.forecast.predictedPriceKesPerKg * input.bagSizeKg;
      const forecastNetback = forecastPerBag - (input.transportCostPerBag ?? 0);
      
      if (forecastNetback > bestOption.netback * 1.05) { // 5% threshold for HOLD
        return {
          action: 'HOLD',
          reason: 'FORECAST_INDICATES_HIGHER_FUTURE_PRICE',
          rationale: `Reliable forecast predicts a netback of ${forecastNetback.toFixed(2)} KES/bag, which is significantly higher than the current best offer of ${bestOption.netback.toFixed(2)} KES/bag.`,
          expectedNetbackPerBag: forecastNetback,
          breakEvenPricePerBag: input.breakEvenPricePerBag,
          warnings,
          evidence: {
            offersEvaluated: validOffers.length,
            observationsEvaluated: input.marketObservations.length,
            forecastAvailable: true,
            forecastIsFallback: false
          },
          forecastMetadata
        };
      }
    }
  }

  // Default to SELL if no better alternative exists
  return {
    action: 'SELL',
    reason: 'BEST_AVAILABLE_OFFER',
    rationale: `Best executable offer yields a netback of ${bestOption.netback.toFixed(2)} KES/bag. No reliable forecast indicated a better future price.`,
    recommendedOfferId: bestOption.offer.id,
    expectedNetbackPerBag: bestOption.netback,
    breakEvenPricePerBag: input.breakEvenPricePerBag,
    warnings,
    evidence: {
      offersEvaluated: validOffers.length,
      observationsEvaluated: input.marketObservations.length,
      forecastAvailable: !!input.forecast,
      forecastIsFallback: input.forecast?.isFallback ?? false
    },
    forecastMetadata
  };
}
