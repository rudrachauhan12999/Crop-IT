"""
Pydantic schemas for the Crop-IT ML backend.

These mirror the existing frontend contract (src/types/ml.ts
SoilEnvironmentalInput and the bounds enforced in
src/services/api.ts::validatePredictionInput) so that the Phase 5 FastAPI
service validates requests identically to the React app. This module does
NOT wire up any FastAPI routes yet -- that is Phase 5. Defining the schema
now is part of Phase 3's "appropriate data validation" foundation.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SoilEnvironmentalInput(BaseModel):
    """Matches SoilEnvironmentalInput in src/types/ml.ts field-for-field."""

    N: float = Field(..., ge=0, le=140, description="Nitrogen content (ppm)")
    P: float = Field(..., ge=5, le=145, description="Phosphorus content (ppm)")
    K: float = Field(..., ge=5, le=205, description="Potassium content (ppm)")
    temperature: float = Field(..., ge=5, le=50, description="Temperature (°C)")
    humidity: float = Field(..., ge=10, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=3.5, le=10.0, description="Soil pH")
    rainfall: float = Field(..., ge=10, le=350, description="Rainfall (mm)")
