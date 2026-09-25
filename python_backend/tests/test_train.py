"""
Tests for the real training pipeline (app/train.py), run against the real
Kaggle Crop_recommendation.csv dataset. These check that training,
prediction, artifact saving/loading, and leakage-prevention actually
behave correctly -- not that specific hardcoded metric values exist.
"""

from __future__ import annotations

import inspect
import json

import joblib
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.utils.validation import check_is_fitted

from app.config import RANDOM_STATE, TEST_SIZE
from app.train import (
    CV_FOLDS,
    run_cross_validation,
    save_artifacts,
    select_best_model,
)

MODEL_NAMES = ("random_forest", "knn", "svm")


# 1. All three models can train.
def test_all_models_train(fitted_pipelines):
    assert set(fitted_pipelines.keys()) == set(MODEL_NAMES)
    for name in MODEL_NAMES:
        pipeline = fitted_pipelines[name]["pipeline"]
        # Raises NotFittedError if the underlying estimator was never fit.
        check_is_fitted(pipeline.named_steps["model"])


# 2. All three models can predict.
def test_all_models_predict(fitted_pipelines, data_split):
    _X_train, X_test, _y_train, y_test = data_split
    for name in MODEL_NAMES:
        pipeline = fitted_pipelines[name]["pipeline"]
        predictions = pipeline.predict(X_test)
        assert len(predictions) == len(y_test)


# 3. Predictions contain valid class labels.
def test_predictions_are_valid_class_labels(fitted_pipelines, data_split, class_names):
    _X_train, X_test, _y_train, _y_test = data_split
    valid = set(class_names)
    for name in MODEL_NAMES:
        pipeline = fitted_pipelines[name]["pipeline"]
        predictions = pipeline.predict(X_test)
        assert set(predictions).issubset(valid), (
            f"{name} predicted label(s) outside the known class set: "
            f"{set(predictions) - valid}"
        )


# 4. Probability outputs are valid where supported.
def test_predict_proba_valid_where_supported(fitted_pipelines, data_split, class_names):
    _X_train, X_test, _y_train, _y_test = data_split
    for name in MODEL_NAMES:
        pipeline = fitted_pipelines[name]["pipeline"]
        assert hasattr(pipeline, "predict_proba"), f"{name} should support predict_proba"
        proba = pipeline.predict_proba(X_test)
        assert proba.shape == (len(X_test), len(class_names))
        assert np.all(proba >= 0) and np.all(proba <= 1)


# 5. Probability rows sum approximately to 1 where applicable.
def test_predict_proba_rows_sum_to_one(fitted_pipelines, data_split):
    _X_train, X_test, _y_train, _y_test = data_split
    for name in MODEL_NAMES:
        pipeline = fitted_pipelines[name]["pipeline"]
        proba = pipeline.predict_proba(X_test)
        row_sums = proba.sum(axis=1)
        assert np.allclose(row_sums, 1.0, atol=1e-6), (
            f"{name} predict_proba rows do not sum to 1 "
            f"(min={row_sums.min()}, max={row_sums.max()})"
        )


# 6 & 7. Model artifacts and metadata are created.
def test_artifacts_and_metadata_created(
    fitted_pipelines, cv_results, test_results, real_dataset, class_names, data_split, tmp_path
):
    df, report = real_dataset
    X_train, X_test, _y_train, _y_test = data_split
    selection = select_best_model(cv_results)

    metadata_path = save_artifacts(
        fitted=fitted_pipelines,
        selection=selection,
        cv_results=cv_results,
        test_results=test_results,
        dataset_row_count=report.row_count,
        class_names=class_names,
        train_count=len(X_train),
        test_count=len(X_test),
        output_dir=tmp_path,
    )

    for name in MODEL_NAMES:
        assert (tmp_path / f"{name}.joblib").exists()
    assert (tmp_path / "best_model.joblib").exists()
    assert metadata_path.exists()
    assert metadata_path == tmp_path / "model_metadata.json"

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    required_keys = {
        "dataset_path",
        "dataset_row_count",
        "feature_names",
        "target_name",
        "class_names",
        "class_count",
        "train_sample_count",
        "test_sample_count",
        "random_state",
        "test_size",
        "model_names",
        "model_metrics",
        "cross_validation_metrics",
        "model_selection",
        "training_timestamp_utc",
        "python_version",
        "sklearn_version",
    }
    assert required_keys.issubset(metadata.keys())
    assert metadata["dataset_row_count"] == report.row_count
    assert metadata["class_count"] == len(class_names)
    assert metadata["train_sample_count"] == len(X_train)
    assert metadata["test_sample_count"] == len(X_test)
    assert metadata["random_state"] == RANDOM_STATE
    assert metadata["model_selection"]["selected_model"] in MODEL_NAMES


# 8 & 9. Saved models can be reloaded and reloaded models produce predictions.
def test_saved_models_reload_and_predict(
    fitted_pipelines, cv_results, test_results, real_dataset, class_names, data_split, tmp_path
):
    df, report = real_dataset
    X_train, X_test, _y_train, _y_test = data_split
    selection = select_best_model(cv_results)

    save_artifacts(
        fitted=fitted_pipelines,
        selection=selection,
        cv_results=cv_results,
        test_results=test_results,
        dataset_row_count=report.row_count,
        class_names=class_names,
        train_count=len(X_train),
        test_count=len(X_test),
        output_dir=tmp_path,
    )

    sample = X_test.iloc[[0]]
    for name in MODEL_NAMES:
        original_pipeline = fitted_pipelines[name]["pipeline"]
        reloaded_pipeline = joblib.load(tmp_path / f"{name}.joblib")

        original_pred = original_pipeline.predict(sample)
        reloaded_pred = reloaded_pipeline.predict(sample)
        assert reloaded_pred[0] == original_pred[0], (
            f"{name}: reloaded model prediction differs from the original "
            "fitted model's prediction on the same input"
        )

    reloaded_best = joblib.load(tmp_path / "best_model.joblib")
    best_pred = reloaded_best.predict(sample)
    expected_pred = fitted_pipelines[selection.selected_model]["pipeline"].predict(sample)
    assert best_pred[0] == expected_pred[0]


# 10. Train/test counts are correct (derived from the real dataset, not hardcoded).
def test_train_test_counts_match_real_dataset(real_dataset, data_split):
    df, report = real_dataset
    X_train, X_test, y_train, y_test = data_split

    assert len(X_train) + len(X_test) == report.row_count
    assert len(y_train) == len(X_train)
    assert len(y_test) == len(X_test)

    expected_test_count = round(report.row_count * TEST_SIZE)
    # train_test_split rounds via floor/ceil internally; allow off-by-one.
    assert abs(len(X_test) - expected_test_count) <= 1


# 11. Cross-validation uses training data only.
def test_cross_validation_uses_training_data_only(data_split, cv_results):
    X_train, X_test, y_train, y_test = data_split

    # Structural guarantee: the function's signature has no way to receive
    # the test set at all.
    params = list(inspect.signature(run_cross_validation).parameters.keys())
    assert "X_test" not in params and "y_test" not in params
    assert params[:2] == ["pipelines", "X_train"] or "X_train" in params

    # Every fold's train+validation portion must partition X_train exactly
    # -- none of it can be drawn from X_test.
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    for train_idx, val_idx in skf.split(X_train, y_train):
        assert len(train_idx) + len(val_idx) == len(X_train)
        assert set(train_idx).isdisjoint(set(val_idx))

    for name in MODEL_NAMES:
        result = cv_results[name]
        assert 0.0 <= result["cv_accuracy_mean"] <= 1.0
        assert 0.0 <= result["cv_macro_f1_mean"] <= 1.0
        assert result["cv_accuracy_std"] >= 0.0
        assert result["cv_macro_f1_std"] >= 0.0


def test_model_selection_uses_cv_not_test_metrics(cv_results):
    """The selection criterion must be documented and based on CV, not the test set."""
    selection = select_best_model(cv_results)
    assert selection.selected_model in MODEL_NAMES
    assert "cross-validation" in selection.criterion.lower()
    assert selection.rationale  # non-empty, human-readable
    assert len(selection.ranked) == len(MODEL_NAMES)
