"""
Shared fixtures for the training-pipeline test suite.

Everything here runs against the REAL dataset (data/Crop_recommendation.csv)
via the same app.data_loader / app.preprocessing / app.train functions the
production training script uses -- no synthetic data, no mocked models.
Expensive steps (loading, splitting, fitting, cross-validating) are
session-scoped so the suite trains each model only once.
"""

from __future__ import annotations

import pytest

from app.config import TARGET, TEST_SIZE
from app.data_loader import load_and_validate
from app.preprocessing import split_features_target, stratified_train_test_split
from app.train import (
    build_pipelines,
    evaluate_on_test,
    fit_pipelines,
    run_cross_validation,
)


@pytest.fixture(scope="session")
def real_dataset():
    df, report = load_and_validate()
    return df, report


@pytest.fixture(scope="session")
def class_names(real_dataset):
    df, _ = real_dataset
    return sorted(df[TARGET].unique().tolist())


@pytest.fixture(scope="session")
def data_split(real_dataset):
    df, _ = real_dataset
    X, y = split_features_target(df)
    X_train, X_test, y_train, y_test = stratified_train_test_split(X, y)
    return X_train, X_test, y_train, y_test


@pytest.fixture(scope="session")
def fitted_pipelines(data_split):
    X_train, _X_test, y_train, _y_test = data_split
    pipelines = build_pipelines()
    return fit_pipelines(pipelines, X_train, y_train)


@pytest.fixture(scope="session")
def cv_results(data_split):
    X_train, _X_test, y_train, _y_test = data_split
    pipelines = build_pipelines()
    return run_cross_validation(pipelines, X_train, y_train)


@pytest.fixture(scope="session")
def test_results(fitted_pipelines, data_split, class_names):
    _X_train, X_test, _y_train, y_test = data_split
    return evaluate_on_test(fitted_pipelines, X_test, y_test, class_names)
