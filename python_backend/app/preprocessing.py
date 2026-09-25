"""
Train/test splitting and preprocessing utilities for the Crop-IT ML backend.

Leakage-prevention contract used throughout this project:

    CSV -> validate -> train_test_split -> fit preprocessing on TRAIN ONLY
        -> transform train -> transform test

No function in this module fits a scaler (or any other preprocessing step)
on the full dataset. `make_preprocessing_pipeline()` returns an UNFIT
Pipeline; fitting only happens when a caller calls `.fit()` on data that
has already been split, e.g. as the first step of a model-specific Pipeline
in the Phase 4 training script (`pipeline.fit(X_train, y_train)`).
"""

from __future__ import annotations

import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .config import FEATURES, RANDOM_STATE, TARGET, TEST_SIZE


def split_features_target(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Split a validated dataframe into feature matrix X and target vector y."""
    X = df[FEATURES].copy()
    y = df[TARGET].copy()
    return X, y


def stratified_train_test_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Stratified train/test split. Stratifying on y keeps each crop class
    represented proportionally in both splits, which matters for a
    22-class dataset with relatively few samples per class.

    This function only splits -- it does not fit or apply any
    preprocessing, so no information from the test set can leak into
    training via a fitted transform.
    """
    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )


def make_preprocessing_pipeline(estimator: BaseEstimator | None = None) -> Pipeline:
    """
    Build an UNFIT sklearn Pipeline: StandardScaler followed by an optional
    estimator step.

    Passing `estimator=None` returns a scaler-only pipeline (useful for
    unsupervised analysis such as PCA/K-Means in later phases). Passing a
    classifier returns a full model pipeline whose `.fit(X_train, y_train)`
    fits the scaler on X_train only, then fits the estimator on the scaled
    training data -- the correct order that prevents test-set leakage.
    """
    steps: list[tuple[str, BaseEstimator]] = [("scaler", StandardScaler())]
    if estimator is not None:
        steps.append(("model", estimator))
    return Pipeline(steps)


if __name__ == "__main__":
    # Self-check against the real dataset. This fits ONLY a StandardScaler
    # (no classifier) to prove the split/fit/transform order is leakage-free.
    # Training an actual classifier is Phase 4's responsibility, not this one.
    from .data_loader import load_and_validate

    df, report = load_and_validate()
    print(f"Loaded {report.row_count} validated rows from {report.path}")

    X, y = split_features_target(df)
    X_train, X_test, y_train, y_test = stratified_train_test_split(X, y)

    print(f"X_train: {X_train.shape}, X_test: {X_test.shape}")
    print(f"y_train: {y_train.shape}, y_test: {y_test.shape}")
    assert len(X_train) + len(X_test) == len(X), "split rows must sum to total rows"
    assert set(X_train.index).isdisjoint(set(X_test.index)), "train/test indices must not overlap"

    train_ratio = len(X_test) / len(X)
    print(f"Test split ratio: {train_ratio:.3f} (expected ~{TEST_SIZE})")

    train_class_ratio = (y_train.value_counts(normalize=True).sort_index())
    test_class_ratio = (y_test.value_counts(normalize=True).sort_index())
    max_ratio_diff = (train_class_ratio - test_class_ratio).abs().max()
    print(f"Max class-proportion difference between train/test (stratification check): "
          f"{max_ratio_diff:.4f}")

    pipeline = make_preprocessing_pipeline()  # scaler only, no estimator
    pipeline.fit(X_train)  # fit strictly on training data
    X_train_scaled = pipeline.transform(X_train)
    X_test_scaled = pipeline.transform(X_test)

    fitted_scaler = pipeline.named_steps["scaler"]
    print(f"Scaler fit on X_train only -- mean_ (first 3): {fitted_scaler.mean_[:3]}")

    # Leakage proof: refit an identical scaler on the FULL feature set and
    # show its statistics differ from the train-only fit whenever the split
    # isn't perfectly representative -- demonstrating the two are computed
    # independently rather than the test set having influenced X_train's fit.
    full_scaler = StandardScaler().fit(X)
    mean_diff = abs(fitted_scaler.mean_ - full_scaler.mean_).max()
    print(f"Max |mean(train-only) - mean(full-dataset)| per feature: {mean_diff:.4f} "
          "(non-zero confirms the scaler was fit on the train split, not the full data)")

    print(f"X_train_scaled shape: {X_train_scaled.shape}, "
          f"X_test_scaled shape: {X_test_scaled.shape}")
    print("\nPreprocessing self-check passed. No classifier was trained.")
