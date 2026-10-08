from fastapi import FastAPI, HTTPException
from datetime import datetime, timezone
import joblib
import os
from config import ARTIFACT_PATH
from schemas import PredictionRequest, PredictionResponse
from train import train_and_export

app = FastAPI(title="MavunoWise Intelligence: Pricing Model")

# Deployment Lifecycle (Option A): Generate artifact on startup if missing
if not ARTIFACT_PATH.exists():
    print("Model artifact not found. Generating baseline model on startup...")
    train_and_export()

# Load artifact
artifact = joblib.load(ARTIFACT_PATH)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_version": artifact.get("model_version")
    }

@app.post("/predict-price-range", response_model=PredictionResponse)
async def predict_price_range(request: PredictionRequest):
    # Validate request against artifact capabilities
    if request.commodity != artifact["commodity"] or request.market != artifact["market"] or request.county != artifact["county"]:
        raise HTTPException(
            status_code=404,
            detail=f"DATA_NOT_AVAILABLE: No model trained for {request.commodity} in {request.market}, {request.county}"
        )
    
    # Generate prediction using baseline
    predicted_price = artifact["mean_price"]
    
    return PredictionResponse(
        predictedPrice=predicted_price,
        lowerBound=artifact["lower_bound"],
        upperBound=artifact["upper_bound"],
        boundType=artifact["bound_type"],
        confidence=artifact["confidence"],
        isFallback=artifact["is_fallback"],
        modelVersion=artifact["model_version"],
        trainingDatasetVersion=artifact["training_dataset_version"],
        trainingDataCutoff=artifact["training_data_cutoff"],
        forecastHorizon=request.forecastHorizon,
        commodity=request.commodity,
        market=request.market,
        county=request.county,
        predictionTimestamp=datetime.now(timezone.utc).isoformat()
    )
