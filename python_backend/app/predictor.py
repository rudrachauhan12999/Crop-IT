"""
Loads the saved sklearn Pipelines produced by Phase 4 (app/train.py) and
serves predictions from them. This module contains NO independent ML
implementation -- every prediction and probability returned here comes
from calling .predict() / .predict_proba() on an artifact loaded from
models/*.joblib. Nothing is retrained on request.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from .config import FEATURES, MODELS_DIR
from .schemas import SoilEnvironmentalInput

MODEL_FILES: dict[str, str] = {
    "random_forest": "random_forest.joblib",
    "knn": "knn.joblib",
    "svm": "svm.joblib",
}
BEST_MODEL_FILE = "best_model.joblib"
METADATA_FILE = "model_metadata.json"

# Maps the internal model keys (also used as model_metadata.json's
# model_names) to the camelCase keys the frontend's ModelComparison
# contract expects.
DISPLAY_KEYS: dict[str, str] = {
    "random_forest": "randomForest",
    "knn": "knn",
    "svm": "svm",
}


class ModelLoadError(RuntimeError):
    """Raised when code asks for a model/metadata that failed to load."""


class ModelRegistry:
    """
    Loads all model artifacts and metadata ONCE (call `.load()` at process
    startup) and keeps them in memory for reuse across requests. Never
    retrains, never re-reads from disk per-request, and never silently
    substitutes a different artifact if one is missing or corrupt --
    failures are recorded in `load_errors` for the health endpoint to
    report honestly.
    """

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self._pipelines: dict[str, Any] = {}
        self._best_pipeline: Any = None
        self._best_model_name: str | None = None
        self._metadata: dict[str, Any] | None = None
        self._load_errors: dict[str, str] = {}

    def load(self) -> None:
        self._pipelines = {}
        self._best_pipeline = None
        self._best_model_name = None
        self._metadata = None
        self._load_errors = {}

        metadata_path = self.models_dir / METADATA_FILE
        if not metadata_path.exists():
            self._load_errors["metadata"] = (
                f"Model metadata not found at {metadata_path}. "
                "Run `python -m app.train` first."
            )
        else:
            try:
                self._metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
                self._best_model_name = self._metadata["model_selection"]["selected_model"]
            except Exception as exc:  # malformed JSON, missing keys, etc.
                self._load_errors["metadata"] = f"Failed to read {metadata_path}: {exc}"

        for name, filename in MODEL_FILES.items():
            path = self.models_dir / filename
            if not path.exists():
                self._load_errors[name] = f"Model artifact not found: {path}"
                continue
            try:
                self._pipelines[name] = joblib.load(path)
            except Exception as exc:  # corrupted file, version mismatch, etc.
                self._load_errors[name] = f"Failed to load {path}: {exc}"

        best_path = self.models_dir / BEST_MODEL_FILE
        if not best_path.exists():
            self._load_errors["best_model"] = f"Model artifact not found: {best_path}"
        else:
            try:
                self._best_pipeline = joblib.load(best_path)
            except Exception as exc:
                self._load_errors["best_model"] = f"Failed to load {best_path}: {exc}"

    @property
    def is_ready(self) -> bool:
        return (
            self._metadata is not None
            and self._best_pipeline is not None
            and len(self._pipelines) == len(MODEL_FILES)
        )

    @property
    def load_errors(self) -> dict[str, str]:
        return dict(self._load_errors)

    @property
    def metadata(self) -> dict[str, Any]:
        if self._metadata is None:
            raise ModelLoadError("Model metadata is not loaded.")
        return self._metadata

    @property
    def best_model_name(self) -> str:
        if self._best_model_name is None:
            raise ModelLoadError("Best model name is not available (metadata not loaded).")
        return self._best_model_name

    @property
    def best_pipeline(self) -> Any:
        if self._best_pipeline is None:
            raise ModelLoadError(
                f"Best model is not loaded: "
                f"{self._load_errors.get('best_model', 'unknown error')}"
            )
        return self._best_pipeline

    def get_pipeline(self, name: str) -> Any:
        if name not in self._pipelines:
            raise ModelLoadError(
                f"Model '{name}' is not loaded: "
                f"{self._load_errors.get(name, 'unknown error')}"
            )
        return self._pipelines[name]


# Process-wide singleton. main.py calls registry.load() once at app startup.
registry = ModelRegistry()


def _input_to_dataframe(payload: SoilEnvironmentalInput) -> pd.DataFrame:
    """
    Build the single-row feature frame in the exact column order the
    models were trained on: N, P, K, temperature, humidity, ph, rainfall.
    """
    row = {feature: getattr(payload, feature) for feature in FEATURES}
    return pd.DataFrame([row], columns=FEATURES)


def _predict_with_pipeline(pipeline: Any, X: pd.DataFrame) -> tuple[str, float, dict[str, float]]:
    """
    Run a single loaded Pipeline's .predict() (and .predict_proba() where
    supported) on X. Returns (predicted_class, its_probability,
    {class: probability, ...}). No probabilities are invented -- if the
    pipeline has no predict_proba, the per-class distribution is empty and
    probability is 0.0.
    """
    predicted = str(pipeline.predict(X)[0])

    proba_by_class: dict[str, float] = {}
    if hasattr(pipeline, "predict_proba"):
        proba = pipeline.predict_proba(X)[0]
        classes = pipeline.named_steps["model"].classes_
        proba_by_class = {str(cls): float(p) for cls, p in zip(classes, proba)}

    probability = proba_by_class.get(predicted, 0.0)
    return predicted, probability, proba_by_class


def predict(payload: SoilEnvironmentalInput) -> dict[str, Any]:
    """
    Build the full prediction response: the primary recommendation (from
    best_model.joblib -- whichever model Phase 4's training run actually
    selected, read from metadata, never hardcoded), its top alternatives
    by real predicted probability, and a comparison across all three
    individually saved models.
    """
    X = _input_to_dataframe(payload)

    best_predicted, best_probability, best_proba_by_class = _predict_with_pipeline(
        registry.best_pipeline, X
    )

    alternatives = sorted(
        (
            (crop, probability)
            for crop, probability in best_proba_by_class.items()
            if crop != best_predicted
        ),
        key=lambda item: item[1],
        reverse=True,
    )[:3]

    model_comparison: dict[str, dict[str, Any]] = {}
    for name in MODEL_FILES:
        pipeline = registry.get_pipeline(name)
        crop, probability, _ = _predict_with_pipeline(pipeline, X)
        model_comparison[DISPLAY_KEYS[name]] = {"crop": crop, "probability": probability}

    return {
        "recommendedCrop": best_predicted,
        "probability": best_probability,
        "alternatives": [{"crop": c, "probability": p} for c, p in alternatives],
        "model": registry.best_model_name,
        "modelComparison": model_comparison,
        "backendSource": "python-fastapi-backend",
    }


def get_metrics_response() -> dict[str, Any]:
    """Build the /api/metrics response from models/model_metadata.json (Phase 4 output)."""
    meta = registry.metadata

    models = []
    for name in meta["model_names"]:
        m = meta["model_metrics"][name]
        cv = meta["cross_validation_metrics"][name]
        models.append(
            {
                "model": name,
                "accuracy": m["accuracy"],
                "precision": m["precision"],
                "recall": m["recall"],
                "f1": m["f1"],
                "macroF1": m["macro_f1"],
                "weightedF1": m["weighted_f1"],
                "trainingTimeSeconds": m["training_time_seconds"],
                "cvAccuracyMean": cv["cv_accuracy_mean"],
                "cvAccuracyStd": cv["cv_accuracy_std"],
                "cvMacroF1Mean": cv["cv_macro_f1_mean"],
                "cvMacroF1Std": cv["cv_macro_f1_std"],
            }
        )

    return {
        "models": models,
        "selectedModel": meta["model_selection"]["selected_model"],
        "selectionCriterion": meta["model_selection"]["criterion"],
        "selectionRationale": meta["model_selection"]["rationale"],
        "trainSampleCount": meta["train_sample_count"],
        "testSampleCount": meta["test_sample_count"],
        "backendSource": "python-fastapi-backend",
    }


def get_model_info_response() -> dict[str, Any]:
    """Build the /api/model-info response from models/model_metadata.json (Phase 4 output)."""
    meta = registry.metadata
    return {
        "selectedModel": meta["model_selection"]["selected_model"],
        "featureNames": meta["feature_names"],
        "target": meta["target_name"],
        "classNames": meta["class_names"],
        "datasetRowCount": meta["dataset_row_count"],
        "trainingTimestampUtc": meta["training_timestamp_utc"],
        "randomState": meta["random_state"],
        "testSize": meta["test_size"],
        "availableModels": meta["model_names"],
        "pythonVersion": meta["python_version"],
        "sklearnVersion": meta["sklearn_version"],
    }
