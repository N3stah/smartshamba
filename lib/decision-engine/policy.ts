import { DecisionInput, DecisionResult, ExecutableOffer, ForecastMetadata, MarketObservation } from './types';
import { calculateNetback } from './netback';
import { filterAlternativeMarketObservations } from './market-evidence';

/**
 * HOLD_ADVANTAGE_THRESHOLD: The minimum advantage a reliable forecast must show
 * over the current best executable offer to justify recommending HOLD.
 * 
 * Economic rationale: A farmer incurs opportunity cost and risk by waiting.
 * A 5% advantage provides a meaningful margin to compensate for:
 * - Forecast uncertainty (even reliable forecasts have error bounds)
 * - Storage/deterioration risk during the waiting period
 * - Market liquidity risk (predicted prices may not be achievable)
 * 
 * This threshold is a business policy decision, not a statistical derivation.
 * It should be reviewed as forecast accuracy improves.
 */
const HOLD_ADVANTAGE_THRESHOLD = 1.05; // 5% advantage required

/**
 * REDIRECT_ADVANTAGE_THRESHOLD: The minimum advantage an alternative market
 * observation must show over the current best executable offer to justify
 * recommending REDIRECT.
 * 
 * Economic rationale: Redirecting to another market involves:
 * - Uncertainty about whether observed prices are achievable by this farmer
 * - Potential variation in transport costs to the alternative destination
 * - Market access risk (the farmer may not have established buyer relationships there)
 * 
 * A 5% advantage provides a margin to compensate for these uncertainties.
 * Note: This uses the same threshold as HOLD for consistency, but it is a
 * separate business policy decision that could be adjusted independently.
 */
const REDIRECT_ADVANTAGE_THRESHOLD = 1.05; // 5% advantage required

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

  // Weather risk warnings (never block actions, only add context)
  // Note: A global weather risk does not establish that an alternative destination
  // is riskier than the current destination. Weather has not been compared across routes.
  if (input.weatherRisk === 'HIGH') {
    warnings.push('Transport risk is high due to weather conditions.');
  } else if (input.weatherRisk === 'UNAVAILABLE') {
    warnings.push('Weather risk assessment unavailable.');
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
      
      if (forecastNetback > bestOption.netback * HOLD_ADVANTAGE_THRESHOLD) {
        return {
          action: 'HOLD',
          reason: 'FORECAST_INDICATES_HIGHER_FUTURE_PRICE',
          rationale: `Reliable forecast predicts a netback of ${forecastNetback.toFixed(2)} KES/bag, which exceeds the current best offer of ${bestOption.netback.toFixed(2)} KES/bag by more than ${((HOLD_ADVANTAGE_THRESHOLD - 1) * 100).toFixed(0)}%.`,
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

  // REDIRECT Logic - Evaluate alternative markets using observations
  // Only evaluate if we have a transport cost estimate (required for netback calculation)
  if (input.transportCostPerBag !== null && input.transportCostPerBag !== undefined) {
    const alternativeObservations = filterAlternativeMarketObservations(
      input.marketObservations,
      input.commodity,
      input.farmerCounty
    );
    
    if (alternativeObservations.length > 0) {
      // Calculate estimated netbacks for alternative markets
      // Note: This uses the same transportCostPerBag for all destinations.
      // Actual transport costs may vary by destination. This is an ESTIMATE.
      const alternativesWithNetback = alternativeObservations.map(obs => {
        const pricePerKg = obs.wholesaleKesPerKg ?? obs.retailKesPerKg;
        if (pricePerKg === null) return null;
        
        // Convert KES/kg to KES/bag
        const estimatedGrossPerBag = pricePerKg * input.bagSizeKg;
        if (input.transportCostPerBag == null) return null;
        const estimatedNetback = estimatedGrossPerBag - input.transportCostPerBag;
        
        return { observation: obs, estimatedNetback };
      }).filter((x): x is { observation: MarketObservation; estimatedNetback: number } => x !== null);
      
      if (alternativesWithNetback.length > 0) {
        const bestAlternative = alternativesWithNetback.reduce((best, current) =>
          current.estimatedNetback > best.estimatedNetback ? current : best
        );
        
        if (bestAlternative.estimatedNetback > bestOption.netback * REDIRECT_ADVANTAGE_THRESHOLD) {
          return {
            action: 'REDIRECT',
            reason: 'ALTERNATIVE_MARKET_INDICATES_HIGHER_NETBACK',
            rationale: `Alternative market ${bestAlternative.observation.market} in ${bestAlternative.observation.county} indicates an estimated netback of ${bestAlternative.estimatedNetback.toFixed(2)} KES/bag, which exceeds the current best offer of ${bestOption.netback.toFixed(2)} KES/bag by more than ${((REDIRECT_ADVANTAGE_THRESHOLD - 1) * 100).toFixed(0)}%. Note: This is an estimate based on market observations (wholesale price of ${bestAlternative.observation.wholesaleKesPerKg ?? bestAlternative.observation.retailKesPerKg} KES/kg), not a confirmed buyer offer. Actual transport costs to this destination may vary.`,
            expectedNetbackPerBag: bestAlternative.estimatedNetback,
            breakEvenPricePerBag: input.breakEvenPricePerBag,
            warnings: [...warnings, 'Market observation prices are not guaranteed realized sale prices.'],
            evidence: {
              offersEvaluated: validOffers.length,
              observationsEvaluated: input.marketObservations.length,
              forecastAvailable: !!input.forecast,
              forecastIsFallback: input.forecast?.isFallback ?? false
            },
            forecastMetadata
          };
        }
      }
    }
  }

  // Default to SELL if no better alternative exists
  return {
    action: 'SELL',
    reason: 'BEST_AVAILABLE_OFFER',
    rationale: `Best executable offer yields a netback of ${bestOption.netback.toFixed(2)} KES/bag. No reliable forecast or alternative market indicated a better option.`,
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
