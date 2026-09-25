"""
Tests for app/predictor.py: the ModelRegistry's load/error-handling
behavior, and the prediction/metrics/model-info/confusion-matrix/
feature-importance response builders -- exercised directly as functions,
independent of the HTTP layer (see test_api.py for the FastAPI-level
tests). All positive-path tests use the REAL committed model artifacts;
negative-path tests use empty/corrupted temp directories, never mocks
standing in for a real model.
"""

from __future__ import annotations

import shutil

import pandas as pd
import pytest

from app.config import FEATURES, MODELS_DIR
from app.predictor import (
    MODEL_FILES,
    ModelLoadError,
    ModelRegistry,
    _input_to_dataframe,
    get_confusion_matrix_response,
    get_feature_importance_response,
    get_metrics_response,
    get_model_info_response,
    predict,
    registry,
)
from app.schemas import SoilEnvironmentalInput

SAMPLE_INPUT = SoilEnvironmentalInput(
    N=90, P=42, K=43, temperature=20.87974371, humidity=82.00274423, ph=6.502985292, rainfall=202.9355362
)


@pytest.fixture(scope="module", autouse=True)
def loaded_global_registry():
    """The module-level `registry` singleton used by predict()/get_*_response()."""
    registry.load()
    assert registry.is_ready, f"Real model artifacts failed to load: {registry.load_errors}"
    return registry


# --- ModelRegistry: real artifacts load correctly ----------------------


def test_registry_loads_real_artifacts():
    reg = ModelRegistry()  # defaults to the real committed MODELS_DIR
    reg.load()
    assert reg.is_ready
    assert reg.load_errors == {}
    assert reg.best_model_name in MODEL_FILES
    assert set(reg.metadata["model_names"]) == set(MODEL_FILES.keys())


# --- ModelRegistry: negative paths --------------------------------------


def test_registry_empty_directory(tmp_path):
    reg = ModelRegistry(models_dir=tmp_path)
    reg.load()
    assert reg.is_ready is False
    assert "metadata" in reg.load_errors
    for name in MODEL_FILES:
        assert name in reg.load_errors
    assert "best_model" in reg.load_errors


def test_registry_corrupted_single_model_file(tmp_path):
    shutil.copy(MODELS_DIR / "model_metadata.json", tmp_path / "model_metadata.json")
    shutil.copy(MODELS_DIR / "knn.joblib", tmp_path / "knn.joblib")
    shutil.copy(MODELS_DIR / "svm.joblib", tmp_path / "svm.joblib")
    shutil.copy(MODELS_DIR / "best_model.joblib", tmp_path / "best_model.joblib")
    (tmp_path / "random_forest.joblib").write_bytes(b"not a real joblib file")

    reg = ModelRegistry(models_dir=tmp_path)
    reg.load()

    assert reg.is_ready is False
    assert "random_forest" in reg.load_errors
    assert "knn" not in reg.load_errors
    assert "svm" not in reg.load_errors


def test_registry_missing_metadata_only(tmp_path):
    for filename in list(MODEL_FILES.values()) + ["best_model.joblib"]:
        shutil.copy(MODELS_DIR / filename, tmp_path / filename)
    # model_metadata.json intentionally not copied.

    reg = ModelRegistry(models_dir=tmp_path)
    reg.load()

    assert reg.is_ready is False  # metadata is required even if every model file loaded fine
    assert "metadata" in reg.load_errors
    assert "random_forest" not in reg.load_errors


def test_get_pipeline_raises_for_unloaded_model():
    reg = ModelRegistry()  # never call .load()
    with pytest.raises(ModelLoadError):
        reg.get_pipeline("random_forest")


def test_best_pipeline_raises_when_not_loaded():
    reg = ModelRegistry()
    with pytest.raises(ModelLoadError):
        reg.best_pipeline


def test_metadata_raises_when_not_loaded():
    reg = ModelRegistry()
    with pytest.raises(ModelLoadError):
        reg.metadata


# --- Feature order contract ----------------------------------------------


def test_input_to_dataframe_preserves_exact_feature_order():
    df = _input_to_dataframe(SAMPLE_INPUT)
    assert list(df.columns) == FEATURES
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert df.iloc[0]["N"] == SAMPLE_INPUT.N
    assert df.iloc[0]["rainfall"] == SAMPLE_INPUT.rainfall


# --- Response builders, called directly (no HTTP layer) ------------------


def test_predict_response_shape_and_values():
    result = predict(SAMPLE_INPUT)
    assert result["recommendedCrop"] == "rice"  # real first CSV row's true label
    assert 0.0 <= result["probability"] <= 1.0
    assert result["model"] == registry.best_model_name
    assert result["backendSource"] == "python-fastapi-backend"

    probs = [a["probability"] for a in result["alternatives"]]
    assert probs == sorted(probs, reverse=True)

    assert set(result["modelComparison"].keys()) == {"randomForest", "knn", "svm"}


def test_metrics_response_shape():
    result = get_metrics_response()
    assert {m["model"] for m in result["models"]} == set(MODEL_FILES.keys())
    assert result["selectedModel"] == registry.best_model_name
    assert result["trainSampleCount"] > 0
    assert result["testSampleCount"] > 0


def test_model_info_response_shape():
    result = get_model_info_response()
    assert result["featureNames"] == FEATURES
    assert result["selectedModel"] == registry.best_model_name
    assert set(result["availableModels"]) == set(MODEL_FILES.keys())


def test_confusion_matrix_response_shape():
    result = get_confusion_matrix_response()
    assert set(result["models"].keys()) == set(MODEL_FILES.keys())
    assert result["bestModel"] == registry.best_model_name
    for model_data in result["models"].values():
        n = len(model_data["classes"])
        assert len(model_data["matrix"]) == n
        assert model_data["correctCount"] + model_data["errorCount"] == model_data["totalSamples"]


def test_feature_importance_response_shape():
    result = get_feature_importance_response()
    assert result["model"] == "random_forest"
    assert {i["feature"] for i in result["importances"]} == set(FEATURES)
    total = sum(i["importance"] for i in result["importances"])
    assert total == pytest.approx(1.0, abs=1e-6)
