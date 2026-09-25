"""
Dataset analytics computed at request time from the real
data/Crop_recommendation.csv (via app.data_loader). No values here are
hardcoded -- row/feature/class counts and per-feature statistics are all
calculated from whatever the CSV actually contains.
"""

from __future__ import annotations

from typing import Any

from .config import FEATURES, TARGET
from .data_loader import load_and_validate


def compute_dataset_summary() -> dict[str, Any]:
    df, report = load_and_validate()

    feature_stats = []
    for feature in FEATURES:
        col = df[feature]
        feature_stats.append(
            {
                "feature": feature,
                "min": float(col.min()),
                "max": float(col.max()),
                "mean": float(col.mean()),
                "median": float(col.median()),
                "std": float(col.std()),
                "q25": float(col.quantile(0.25)),
                "q75": float(col.quantile(0.75)),
            }
        )

    class_counts = df[TARGET].value_counts().sort_index()
    class_distribution = [
        {"crop": str(label), "samples": int(count)} for label, count in class_counts.items()
    ]

    return {
        "totalSamples": report.row_count,
        "featureCount": len(FEATURES),
        "classCount": report.class_count,
        "missingValues": report.total_missing_values,
        "duplicateRows": report.duplicate_row_count,
        "targetColumn": TARGET,
        "classDistribution": class_distribution,
        "features": feature_stats,
    }
