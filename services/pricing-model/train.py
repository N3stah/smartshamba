import csv
import joblib
from datetime import datetime
from pathlib import Path
from config import ARTIFACT_PATH, DATASET_PATH, MODEL_VERSION, TRAINING_DATASET_VERSION, COMMODITY, MARKET, COUNTY

def train_and_export():
    print(f"Loading dataset from {DATASET_PATH}...")
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
    
    prices = []
    dates = []
    
    # Pure Python CSV parsing (bypasses pandas 3.14 compilation issue)
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            prices.append(float(row['price_kes_per_kg']))
            dates.append(row['date'])
            
    if not prices:
        raise ValueError("Dataset is empty or missing 'price_kes_per_kg' column")
        
    # Chronological sort (time-series discipline)
    dates_and_prices = sorted(zip(dates, prices), key=lambda x: x[0])
    sorted_prices = [p for d, p in dates_and_prices]
    latest_date = dates_and_prices[-1][0]
    
    print(f"Dataset loaded: {len(sorted_prices)} rows.")
    
    # Baseline Calculation: Simple Historical Mean
    mean_price = sum(sorted_prices) / len(sorted_prices)
    
    # Heuristic Bounds (due to insufficient data for statistical intervals)
    lower_bound = mean_price * 0.90
    upper_bound = mean_price * 1.10
    
    artifact = {
        "model_type": "historical_mean_baseline",
        "mean_price": float(mean_price),
        "lower_bound": float(lower_bound),
        "upper_bound": float(upper_bound),
        "model_version": MODEL_VERSION,
        "training_dataset_version": TRAINING_DATASET_VERSION,
        "training_data_cutoff": latest_date,
        "commodity": COMMODITY,
        "market": MARKET,
        "county": COUNTY,
        "is_fallback": True, # Always true for this baseline prototype
        "confidence": "LOW"  # Always low due to 4-row dataset
    }
    
    print(f"Exporting artifact to {ARTIFACT_PATH}...")
    joblib.dump(artifact, ARTIFACT_PATH)
    print("Artifact exported successfully.")

if __name__ == "__main__":
    train_and_export()
