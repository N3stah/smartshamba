# MavunoWise Pricing Model — FastAPI service
# Build context: project root (so we can COPY both the service code and the dataset)
# Build command: docker build -f services/pricing-model/Dockerfile -t mavuno-pricing-model .

FROM python:3.11-slim

# Set working directory to match the service's expected layout
# config.py computes BASE_DIR = parent of app.py, then DATASET_PATH = BASE_DIR / "../../research/..."
# So we need /app/services/pricing-model/ AND /app/research/colab/exports/
WORKDIR /app

# Install system deps (no gcc needed — pure Python ML, no compiled extensions)
# git is needed by some pip packages' source builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better layer caching)
COPY services/pricing-model/requirements.txt /app/services/pricing-model/requirements.txt

# Install Python deps
WORKDIR /app/services/pricing-model
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY services/pricing-model/ /app/services/pricing-model/

# Copy dataset (required by train.py on first startup if artifact missing)
COPY research/colab/exports/mavunowise_market_dataset_2024-05-20_v001.csv /app/research/colab/exports/mavunowise_market_dataset_2024-05-20_v001.csv

# Render sets $PORT at runtime; default to 8000 for local docker run
ENV PORT=8000
EXPOSE 8000

# Start uvicorn — note the working directory must be the service dir so `app:app` resolves
WORKDIR /app/services/pricing-model
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
