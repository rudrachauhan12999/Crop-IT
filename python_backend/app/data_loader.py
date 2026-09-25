"""
Real-dataset loader and structural validator for the Crop-IT ML backend.

This module reads ONLY the real Kaggle Crop_recommendation.csv committed at
data/Crop_recommendation.csv (relative to the repository root). It never
generates, samples, or repairs data. If the dataset is missing or fails
structural validation, it raises immediately with a clear error instead of
silently working around the problem.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

from .config import DATASET_PATH, FEATURES, REQUIRED_COLUMNS, TARGET


class DatasetValidationError(ValueError):
    """Raised when the dataset fails structural validation."""


@dataclass
class ValidationReport:
    """Structural facts about a loaded dataset, gathered without mutating it."""

    path: Path
    row_count: int
    column_count: int
    columns: list[str]
    missing_values_by_column: dict[str, int]
    total_missing_values: int
    infinite_value_count: int
    duplicate_row_count: int
    feature_dtypes: dict[str, str]
    class_count: int
    class_distribution: dict[str, int] = field(default_factory=dict)


def load_dataset(path: Path | None = None) -> pd.DataFrame:
    """
    Load the real Crop_recommendation CSV from disk.

    Raises FileNotFoundError with the expected path if the dataset is not
    present -- this function never substitutes synthetic or cached data.
    """
    csv_path = path or DATASET_PATH

    if not csv_path.exists():
        raise FileNotFoundError(
            f"Real Kaggle dataset not found at expected path: {csv_path}\n"
            "This project requires the real Crop_recommendation.csv dataset "
            "committed at data/Crop_recommendation.csv. Refusing to "
            "substitute synthetic or placeholder data."
        )

    return pd.read_csv(csv_path)


def validate_dataset(df: pd.DataFrame, path: Path | None = None) -> ValidationReport:
    """
    Validate structural integrity of a loaded dataset and return a report.

    Hard failures (raise DatasetValidationError, no silent repair):
      - missing required columns
      - zero rows
      - non-numeric feature columns
      - any missing (NaN) values in required columns
      - any infinite values in feature columns
      - fewer than 2 target classes

    Soft findings (reported, not fatal):
      - duplicate rows
      - class distribution / imbalance

    Duplicate rows are reported rather than rejected because a legitimately
    balanced dataset can contain rows that are genuinely identical in all 7
    features and label (e.g. two farms with identical measured conditions
    growing the same crop) -- that is not evidence of file corruption, and
    silently dropping such rows would itself be an undocumented mutation of
    the ground-truth dataset. Callers that want deduplication must do so
    explicitly and note it.
    """
    resolved_path = path or DATASET_PATH

    if df.shape[0] == 0:
        raise DatasetValidationError(f"Dataset at {resolved_path} has zero rows.")

    missing_columns = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_columns:
        raise DatasetValidationError(
            f"Dataset at {resolved_path} is missing required column(s): "
            f"{missing_columns}. Required columns: {REQUIRED_COLUMNS}. "
            f"Found columns: {list(df.columns)}"
        )

    non_numeric_features = [
        c for c in FEATURES if not pd.api.types.is_numeric_dtype(df[c])
    ]
    if non_numeric_features:
        raise DatasetValidationError(
            f"Feature column(s) {non_numeric_features} in {resolved_path} are "
            "not numeric. Refusing to coerce -- fix the source CSV."
        )

    missing_by_column = {
        c: int(df[c].isna().sum()) for c in REQUIRED_COLUMNS
    }
    total_missing = sum(missing_by_column.values())
    if total_missing > 0:
        offending = {k: v for k, v in missing_by_column.items() if v > 0}
        raise DatasetValidationError(
            f"Dataset at {resolved_path} contains {total_missing} missing "
            f"value(s) in required column(s): {offending}. Refusing to "
            "impute or drop rows silently."
        )

    infinite_count = int(np.isinf(df[FEATURES].to_numpy(dtype=float)).sum())
    if infinite_count > 0:
        raise DatasetValidationError(
            f"Dataset at {resolved_path} contains {infinite_count} infinite "
            "value(s) in feature columns."
        )

    class_counts = df[TARGET].value_counts().to_dict()
    class_count = len(class_counts)
    if class_count < 2:
        raise DatasetValidationError(
            f"Dataset at {resolved_path} has only {class_count} target "
            f"class(es); at least 2 are required for classification."
        )

    duplicate_count = int(df.duplicated().sum())

    return ValidationReport(
        path=resolved_path,
        row_count=int(df.shape[0]),
        column_count=int(df.shape[1]),
        columns=list(df.columns),
        missing_values_by_column=missing_by_column,
        total_missing_values=total_missing,
        infinite_value_count=infinite_count,
        duplicate_row_count=duplicate_count,
        feature_dtypes={c: str(df[c].dtype) for c in FEATURES},
        class_count=class_count,
        class_distribution=class_counts,
    )


def load_and_validate(path: Path | None = None) -> tuple[pd.DataFrame, ValidationReport]:
    """Convenience wrapper: load the real dataset and validate it in one call."""
    df = load_dataset(path)
    report = validate_dataset(df, path)
    return df, report


def _print_report(report: ValidationReport) -> None:
    print(f"Dataset path         : {report.path}")
    print(f"Rows                 : {report.row_count}")
    print(f"Columns              : {report.column_count} -> {report.columns}")
    print(f"Feature dtypes       : {report.feature_dtypes}")
    print(f"Missing values       : {report.total_missing_values} "
          f"(by column: {report.missing_values_by_column})")
    print(f"Infinite values      : {report.infinite_value_count}")
    print(f"Duplicate rows       : {report.duplicate_row_count}")
    print(f"Target classes       : {report.class_count}")
    print("Class distribution   :")
    for label, count in sorted(report.class_distribution.items()):
        print(f"  {label:15s} {count}")


if __name__ == "__main__":
    dataframe, validation_report = load_and_validate()
    _print_report(validation_report)
    print("\nValidation passed.")
