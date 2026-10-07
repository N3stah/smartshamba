# Feature Schema (ML Ready)

## Targets
- `target_price_7d`: Market price 7 days in the future (KES/kg).
- `target_price_14d`: Market price 14 days in the future (KES/kg).
- `target_price_30d`: Market price 30 days in the future (KES/kg).

## Point-in-Time Features
- `market_price_kes_kg`: Current observed price at time T.
- `price_lag_7d`: Price 7 days prior to T.
- `price_lag_14d`: Price 14 days prior to T.
- `rolling_mean_price_7d`: 7-day rolling average ending at T.

## Split Markers
- `dataset_split`: ['TRAIN', 'VALIDATION', 'TEST'] (Chronological split, no shuffling).
