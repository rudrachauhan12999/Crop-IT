"""
Crop-IT real ML inference API.

Loads the sklearn Pipelines saved by Phase 4 (python_backend/app/train.py)
and serves predictions, metrics, model info, and dataset analytics from
them. No prediction logic is reimplemented here -- see app/predictor.py.

Run from python_backend/:
    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import analysis, predictor
from .data_loader import DatasetValidationError
from .predictor import ModelLoadError, registry
from .schemas import (
    DatasetSummaryResponse,
    HealthResponse,
    MetricsResponse,
    ModelInfoResponse,
    PredictionResponse,
    SoilEnvironmentalInput,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all model artifacts once at process startup. If loading fails,
    # the process still starts (so /api/health can report the real error
    # state) rather than crashing -- but nothing here fabricates a
    # working model in place of a missing/corrupt one.
    registry.load()
    yield


app = FastAPI(title="Crop-IT ML Inference API", lifespan=lifespan)

# The existing Express/Vite dev server (server.ts) serves the frontend at
# this origin by default; override with FRONTEND_ORIGIN for other setups.
# Deliberately a single configurable origin, not a wildcard.
_frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _require_ready() -> None:
    if not registry.is_ready:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ML backend unavailable",
                "message": "Model artifacts are not loaded. Run `python -m app.train` "
                "from python_backend/ to generate models/, then restart the API.",
                "errors": registry.load_errors,
            },
        )


@app.get("/api/health", response_model=HealthResponse)
def health() -> dict:
    if registry.is_ready:
        return {
            "status": "ok",
            "modelLoaded": True,
            "model": registry.best_model_name,
        }
    return {
        "status": "degraded",
        "modelLoaded": False,
        "model": None,
        "errors": registry.load_errors
        or {"models": "Model artifacts not loaded. Run `python -m app.train` first."},
    }


@app.post("/api/predict", response_model=PredictionResponse)
def predict(payload: SoilEnvironmentalInput) -> dict:
    _require_ready()
    try:
        return predictor.predict(payload)
    except ModelLoadError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # pragma: no cover - unexpected inference failure
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")


@app.get("/api/metrics", response_model=MetricsResponse)
def metrics() -> dict:
    _require_ready()
    try:
        return predictor.get_metrics_response()
    except ModelLoadError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info() -> dict:
    _require_ready()
    try:
        return predictor.get_model_info_response()
    except ModelLoadError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/api/dataset-summary", response_model=DatasetSummaryResponse)
def dataset_summary() -> dict:
    try:
        return analysis.compute_dataset_summary()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except DatasetValidationError as exc:
        raise HTTPException(status_code=503, detail=f"Dataset is invalid: {exc}")
