import pytest
from fastapi.testclient import TestClient
import os
import sys

# Adjust path to import from current directory
sys.path.append(os.path.dirname(__file__))
from app import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["model_loaded"] == True

def test_predict_valid():
    response = client.post("/predict-price-range", json={
        "commodity": "Maize",
        "market": "NCPB",
        "county": "National",
        "forecastHorizon": 7
    })
    assert response.status_code == 200
    data = response.json()
    assert data["commodity"] == "Maize"
    assert data["isFallback"] == True
    assert data["confidence"] == "LOW"
    assert data["modelVersion"] == "v0.1-baseline"
    assert "predictionTimestamp" in data

def test_predict_invalid_geography():
    response = client.post("/predict-price-range", json={
        "commodity": "Wheat",
        "market": "Nairobi",
        "county": "Nairobi",
        "forecastHorizon": 7
    })
    assert response.status_code == 404
    assert "DATA_NOT_AVAILABLE" in response.json()["detail"]

def test_predict_invalid_horizon():
    response = client.post("/predict-price-range", json={
        "commodity": "Maize",
        "market": "NCPB",
        "county": "National",
        "forecastHorizon": 0
    })
    assert response.status_code == 422 # Pydantic validation error
