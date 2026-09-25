"""
Central configuration for the Crop-IT Python ML backend.

All paths are resolved relative to this file's location (never the current
working directory), so scripts behave the same whether invoked as
`python -m app.data_loader` from python_backend/, or from anywhere else.
"""

from pathlib import Path

# python_backend/app/config.py -> python_backend/app -> python_backend -> repo root
APP_DIR = Path(__file__).resolve().parent
PYTHON_BACKEND_DIR = APP_DIR.parent
REPO_ROOT = PYTHON_BACKEND_DIR.parent

DATA_DIR = REPO_ROOT / "data"
DATASET_PATH = DATA_DIR / "Crop_recommendation.csv"

MODELS_DIR = PYTHON_BACKEND_DIR / "models"

# Feature / target schema. These names must match the columns in the real
# Kaggle Crop_recommendation.csv exactly.
FEATURES = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]
TARGET = "label"
REQUIRED_COLUMNS = FEATURES + [TARGET]

# Train/test split configuration (used by preprocessing.py and, later,
# the Phase 4 training pipeline). Fixed for reproducibility.
TEST_SIZE = 0.20
RANDOM_STATE = 42
