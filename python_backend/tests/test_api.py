"""
Tests for the FastAPI inference API (app/main.py), exercised through
FastAPI's TestClient against the REAL saved model artifacts committed in
python_backend/models/ (Phase 4 output) and the REAL dataset. No mocked
models, no fake predictions.
"""

from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.config import DATASET_PATH, FEATURES, TARGET
from app.main import app
from app.predictor import registry

VALID_PAYLOAD = {
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87974371,
    "humidity": 82.00274423,
    "ph": 6.502985292,
    "rainfall": 202.9355362,
}  # first row of the real CSV; known label: rice


@pytest.fixture(scope="module")
def client():
    # `with` triggers the FastAPI lifespan (registry.load()) against the
    # real committed models/ directory, same as a real `uvicorn` process.
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def real_df():
    return pd.read_csv(DATASET_PATH)


# 1. GET /api/health
def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["modelLoaded"] is True
    # Must reflect the real Phase 4 selection, not a hardcoded name.
    assert body["model"] == registry.best_model_name


# 2. POST /api/predict with valid data
def test_predict_valid(client):
    resp = client.post("/api/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["recommendedCrop"] == "rice"
    assert body["model"] == registry.best_model_name
    assert body["backendSource"] == "python-fastapi-backend"
    assert 0.0 <= body["probability"] <= 1.0
    assert isinstance(body["alternatives"], list)
    for alt in body["modelComparison"].values():
        assert set(alt.keys()) == {"crop", "probability"}


# 3. POST /api/predict with invalid data
def test_predict_invalid(client):
    bad_payload = dict(VALID_PAYLOAD)
    bad_payload["N"] = 9999  # out of the validated [0, 140] range
    resp = client.post("/api/predict", json=bad_payload)
    assert resp.status_code == 422

    missing_field_payload = dict(VALID_PAYLOAD)
    del missing_field_payload["rainfall"]
    resp2 = client.post("/api/predict", json=missing_field_payload)
    assert resp2.status_code == 422


# 4. GET /api/metrics
def test_metrics(client):
    resp = client.get("/api/metrics")
    assert resp.status_code == 200
    body = resp.json()
    assert {m["model"] for m in body["models"]} == {"random_forest", "knn", "svm"}
    assert body["selectedModel"] == registry.best_model_name
    assert body["trainSampleCount"] > 0
    assert body["testSampleCount"] > 0
    for m in body["models"]:
        assert 0.0 <= m["accuracy"] <= 1.0
        assert 0.0 <= m["cvMacroF1Mean"] <= 1.0


# 5. GET /api/model-info
def test_model_info(client, real_df):
    resp = client.get("/api/model-info")
    assert resp.status_code == 200
    body = resp.json()
    assert body["featureNames"] == FEATURES
    assert body["target"] == TARGET
    assert body["selectedModel"] == registry.best_model_name
    assert body["datasetRowCount"] == len(real_df)
    assert set(body["classNames"]) == set(real_df[TARGET].unique())
    assert set(body["availableModels"]) == {"random_forest", "knn", "svm"}


# 6. GET /api/dataset-summary
def test_dataset_summary(client, real_df):
    resp = client.get("/api/dataset-summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["totalSamples"] == len(real_df)
    assert body["featureCount"] == len(FEATURES)
    assert body["classCount"] == real_df[TARGET].nunique()
    assert body["missingValues"] == int(real_df.isna().sum().sum())
    assert body["duplicateRows"] == int(real_df.duplicated().sum())
    assert len(body["classDistribution"]) == body["classCount"]
    assert len(body["features"]) == len(FEATURES)


# 7. Predictions use the saved artifacts (not a reimplemented engine)
def test_prediction_matches_direct_artifact_call(client):
    """
    Calling the saved best_model.joblib directly and calling it through the
    API for the same input must produce the exact same prediction --
    proving the API is a thin wrapper around the artifact, not a second ML
    implementation.
    """
    sample = pd.DataFrame([VALID_PAYLOAD], columns=FEATURES)
    direct_prediction = registry.best_pipeline.predict(sample)[0]

    resp = client.post("/api/predict", json=VALID_PAYLOAD)
    api_prediction = resp.json()["recommendedCrop"]

    assert api_prediction == direct_prediction


# 8. Probability values are valid
def test_probabilities_are_valid(client):
    resp = client.post("/api/predict", json=VALID_PAYLOAD)
    body = resp.json()

    assert 0.0 <= body["probability"] <= 1.0
    for alt in body["alternatives"]:
        assert 0.0 <= alt["probability"] <= 1.0
    for detail in body["modelComparison"].values():
        assert 0.0 <= detail["probability"] <= 1.0


# 9. Alternatives are sorted by actual predicted probability
def test_alternatives_are_sorted_descending(client):
    resp = client.post("/api/predict", json=VALID_PAYLOAD)
    probabilities = [alt["probability"] for alt in resp.json()["alternatives"]]
    assert probabilities == sorted(probabilities, reverse=True)


# 10. Model comparison contains all three models
def test_model_comparison_contains_all_three_models(client):
    resp = client.post("/api/predict", json=VALID_PAYLOAD)
    comparison = resp.json()["modelComparison"]
    assert set(comparison.keys()) == {"randomForest", "knn", "svm"}
    for detail in comparison.values():
        assert "crop" in detail and "probability" in detail


# Phase 7: real analytics endpoints


def test_correlation_endpoint(client):
    resp = client.get("/api/correlation")
    assert resp.status_code == 200
    body = resp.json()
    assert body["features"] == FEATURES
    n = len(FEATURES)
    assert len(body["matrix"]) == n
    for i in range(n):
        assert body["matrix"][i][i] == pytest.approx(1.0, abs=1e-9)


def test_pca_endpoint(client, real_df):
    resp = client.get("/api/pca")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["samples"]) == len(real_df)
    assert 0.0 < body["totalVarianceExplained"] <= 1.0


def test_clusters_endpoint(client, real_df):
    resp = client.get("/api/clusters")
    assert resp.status_code == 200
    body = resp.json()
    assert 2 <= body["kValue"] <= 10
    assert len(body["clusters"]) == body["kValue"]
    assert sum(c["cropsCount"] for c in body["clusters"]) == len(real_df)
    assert len(body["pcaClusterScatter"]) == len(real_df)


def test_confusion_matrix_endpoint(client):
    resp = client.get("/api/confusion-matrix")
    assert resp.status_code == 200
    body = resp.json()
    assert set(body["models"].keys()) == {"random_forest", "knn", "svm"}
    assert body["bestModel"] == registry.best_model_name

    for model_data in body["models"].values():
        n = len(model_data["classes"])
        assert len(model_data["matrix"]) == n
        assert all(len(row) == n for row in model_data["matrix"])
        matrix_total = sum(sum(row) for row in model_data["matrix"])
        assert matrix_total == model_data["totalSamples"]
        assert model_data["correctCount"] + model_data["errorCount"] == model_data["totalSamples"]
        assert len(model_data["perClassMetrics"]) == n
        for err in model_data["errors"]:
            assert err["count"] > 0
            assert err["actual"] != err["predicted"]


def test_feature_importance_endpoint(client):
    resp = client.get("/api/feature-importance")
    assert resp.status_code == 200
    body = resp.json()
    assert {i["feature"] for i in body["importances"]} == set(FEATURES)
    total = sum(i["importance"] for i in body["importances"])
    assert total == pytest.approx(1.0, abs=1e-6)
    values = [i["importance"] for i in body["importances"]]
    assert values == sorted(values, reverse=True)
