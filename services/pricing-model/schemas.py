from pydantic import BaseModel, Field
from typing import Literal

class PredictionRequest(BaseModel):
    commodity: str = Field(..., example="Maize")
    market: str = Field(..., example="NCPB")
    county: str = Field(..., example="National")
    forecastHorizon: int = Field(..., ge=1, le=30, example=7)

class PredictionResponse(BaseModel):
    predictedPrice: float
    lowerBound: float
    upperBound: float
    confidence: Literal["LOW", "MEDIUM", "HIGH"]
    isFallback: bool
    modelVersion: str
    trainingDatasetVersion: str
    trainingDataCutoff: str
    forecastHorizon: int
    commodity: str
    market: str
    county: str
    predictionTimestamp: str
