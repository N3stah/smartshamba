import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_PATH = BASE_DIR / "model_artifact.joblib"
DATASET_PATH = BASE_DIR / "../../research/colab/exports/mavunowise_market_dataset_2024-05-20_v001.csv"

MODEL_VERSION = "v0.1-baseline"
TRAINING_DATASET_VERSION = "2024-05-20_v001"
COMMODITY = "Maize"
MARKET = "NCPB"
COUNTY = "National"
