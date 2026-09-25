"""
Tests for the real-dataset loader and validator (app/data_loader.py).

Covers both the real CSV (must exist, must have the correct schema, must
validate cleanly) and the negative paths (missing columns, missing
values, non-numeric features, infinite values, too few classes, a
missing file) -- confirming validate_dataset() raises instead of
silently repairing bad data, per the project's non-negotiable rules.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from app.config import DATASET_PATH, FEATURES, REQUIRED_COLUMNS, TARGET
from app.data_loader import (
    DatasetValidationError,
    load_and_validate,
    load_dataset,
    validate_dataset,
)


def _minimal_valid_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "N": [10, 20, 30, 40],
            "P": [10, 20, 30, 40],
            "K": [10, 20, 30, 40],
            "temperature": [20.0, 21.0, 22.0, 23.0],
            "humidity": [50.0, 55.0, 60.0, 65.0],
            "ph": [6.0, 6.5, 7.0, 7.5],
            "rainfall": [100.0, 110.0, 120.0, 130.0],
            "label": ["rice", "maize", "rice", "maize"],
        }
    )


# --- Real dataset -----------------------------------------------------


def test_csv_exists_at_expected_path():
    assert DATASET_PATH.exists(), f"Real dataset not found at {DATASET_PATH}"
    assert DATASET_PATH.is_file()


def test_load_dataset_returns_real_dataframe():
    df = load_dataset()
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0
    assert list(df.columns) == REQUIRED_COLUMNS


def test_target_column_present_in_real_data():
    df = load_dataset()
    assert TARGET in df.columns
    assert df[TARGET].nunique() >= 2


def test_real_dataset_validates_cleanly(real_dataset):
    df, report = real_dataset
    assert report.row_count == len(df) > 0
    assert report.column_count == len(REQUIRED_COLUMNS)
    assert report.total_missing_values == 0
    assert report.infinite_value_count == 0
    assert report.class_count == df[TARGET].nunique()
    assert set(report.feature_dtypes.keys()) == set(FEATURES)


def test_load_and_validate_convenience_wrapper():
    df, report = load_and_validate()
    assert len(df) == report.row_count


# --- Negative paths: validate_dataset() must raise, never repair ------


def test_missing_required_column_raises():
    df = _minimal_valid_df().drop(columns=["rainfall"])
    with pytest.raises(DatasetValidationError, match="missing required column"):
        validate_dataset(df)


def test_zero_rows_raises():
    df = _minimal_valid_df().iloc[0:0]
    with pytest.raises(DatasetValidationError, match="zero rows"):
        validate_dataset(df)


def test_non_numeric_feature_raises():
    df = _minimal_valid_df()
    df["N"] = ["a", "b", "c", "d"]
    with pytest.raises(DatasetValidationError, match="not numeric"):
        validate_dataset(df)


def test_missing_values_raise():
    df = _minimal_valid_df()
    df.loc[0, "ph"] = None
    with pytest.raises(DatasetValidationError, match="missing value"):
        validate_dataset(df)


def test_infinite_values_raise():
    df = _minimal_valid_df()
    df.loc[0, "rainfall"] = float("inf")
    with pytest.raises(DatasetValidationError, match="infinite"):
        validate_dataset(df)


def test_single_class_raises():
    df = _minimal_valid_df()
    df["label"] = "rice"  # only one class across all rows
    with pytest.raises(DatasetValidationError, match="target class"):
        validate_dataset(df)


def test_duplicate_rows_are_reported_not_rejected():
    """Duplicates are a documented soft finding, not a hard failure (see data_loader.py)."""
    df = _minimal_valid_df()
    duplicate_row = df.iloc[[0]]
    df_with_dupe = pd.concat([df, duplicate_row], ignore_index=True)

    report = validate_dataset(df_with_dupe)  # must NOT raise
    assert report.duplicate_row_count == 1
    assert report.row_count == len(df_with_dupe)


def test_load_dataset_missing_file_raises():
    with pytest.raises(FileNotFoundError, match="Real Kaggle dataset not found"):
        load_dataset(Path("does_not_exist_anywhere.csv"))
