"""
Real scikit-learn training pipeline for Crop-IT.

Trains Random Forest, K-Nearest Neighbors, and Support Vector Machine
classifiers on the real Kaggle Crop_recommendation.csv dataset (loaded and
validated via app.data_loader / app.preprocessing from Phase 3), evaluates
them with cross-validation on the training split and a final holdout test
split, selects a model using a documented criterion, and saves the fitted
Pipelines plus metadata to models/.

Run with:
    python -m app.train
"""

from __future__ import annotations

import json
import platform
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC

from .config import (
    DATASET_PATH,
    FEATURES,
    MODELS_DIR,
    RANDOM_STATE,
    REPO_ROOT,
    TARGET,
    TEST_SIZE,
)
from .data_loader import load_and_validate
from .preprocessing import (
    make_preprocessing_pipeline,
    split_features_target,
    stratified_train_test_split,
)

CV_FOLDS = 5

# Model-selection tie tolerance: CV macro-F1 means within this absolute
# distance of the best score are treated as tied, and the standard
# deviation (lower = more stable across folds) breaks the tie.
SELECTION_TIE_EPSILON = 1e-4


def build_pipelines() -> dict[str, Pipeline]:
    """
    Build UNFIT model Pipelines.

    KNN and SVM are distance/margin-based and require StandardScaler.
    Random Forest is a threshold-split ensemble and is scale-invariant, so
    it is left unscaled per the Phase 4 spec -- but it is still wrapped in
    a single-step Pipeline so all three saved artifacts share the same
    Pipeline interface (.fit/.predict/.predict_proba) and so the saved
    file always contains whatever preprocessing that model actually needs
    (none, in this case) rather than a bare estimator.
    """
    random_forest = Pipeline(
        [
            (
                "model",
                RandomForestClassifier(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            )
        ]
    )

    knn = make_preprocessing_pipeline(
        estimator=KNeighborsClassifier(n_neighbors=5)
    )

    svm = make_preprocessing_pipeline(
        estimator=SVC(kernel="rbf", probability=True, random_state=RANDOM_STATE)
    )

    return {
        "random_forest": random_forest,
        "knn": knn,
        "svm": svm,
    }


def run_cross_validation(
    pipelines: dict[str, Pipeline],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_splits: int = CV_FOLDS,
    random_state: int = RANDOM_STATE,
) -> dict[str, dict[str, float]]:
    """
    Stratified K-fold cross-validation, computed strictly on (X_train,
    y_train) -- this function's signature does not accept a test set, so
    it structurally cannot leak test data into model selection.

    cross_validate() clones and fits a fresh copy of each Pipeline per
    fold, so StandardScaler (for KNN/SVM) is refit on each fold's inner
    training portion only.
    """
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    results: dict[str, dict[str, float]] = {}

    for name, pipeline in pipelines.items():
        scores = cross_validate(
            pipeline,
            X_train,
            y_train,
            cv=skf,
            scoring=["accuracy", "f1_macro"],
            n_jobs=-1,
        )
        results[name] = {
            "cv_accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "cv_accuracy_std": float(np.std(scores["test_accuracy"])),
            "cv_macro_f1_mean": float(np.mean(scores["test_f1_macro"])),
            "cv_macro_f1_std": float(np.std(scores["test_f1_macro"])),
        }

    return results


def fit_pipelines(
    pipelines: dict[str, Pipeline], X_train: pd.DataFrame, y_train: pd.Series
) -> dict[str, dict[str, Any]]:
    """Fit each pipeline once on the full training split, timing the fit."""
    fitted: dict[str, dict[str, Any]] = {}
    for name, pipeline in pipelines.items():
        start = time.perf_counter()
        pipeline.fit(X_train, y_train)
        elapsed = time.perf_counter() - start
        fitted[name] = {"pipeline": pipeline, "training_time_seconds": elapsed}
    return fitted


def evaluate_on_test(
    fitted: dict[str, dict[str, Any]],
    X_test: pd.DataFrame,
    y_test: pd.Series,
    class_names: list[str],
) -> dict[str, dict[str, Any]]:
    """
    Evaluate each fitted pipeline against the untouched test split.

    The dataset is perfectly class-balanced (100 samples/class), so
    macro-averaged and support-weighted metrics are numerically identical
    here -- both are computed and reported explicitly rather than assumed
    equal, and 'precision'/'recall'/'f1' below use the macro average
    (matching the macro-F1 based model-selection criterion).
    """
    results: dict[str, dict[str, Any]] = {}

    for name, entry in fitted.items():
        pipeline = entry["pipeline"]
        y_pred = pipeline.predict(X_test)

        report = classification_report(
            y_test, y_pred, labels=class_names, output_dict=True, zero_division=0
        )
        cm = confusion_matrix(y_test, y_pred, labels=class_names)

        macro = report["macro avg"]
        weighted = report["weighted avg"]

        results[name] = {
            "accuracy": float(report["accuracy"]),
            "precision": float(macro["precision"]),
            "recall": float(macro["recall"]),
            "f1": float(macro["f1-score"]),
            "macro_f1": float(macro["f1-score"]),
            "weighted_f1": float(weighted["f1-score"]),
            "training_time_seconds": entry["training_time_seconds"],
            "classification_report": report,
            "confusion_matrix": cm.tolist(),
            "confusion_matrix_labels": class_names,
        }

    return results


@dataclass
class SelectionResult:
    selected_model: str
    criterion: str
    rationale: str
    ranked: list[tuple[str, float, float]]  # (name, cv_macro_f1_mean, cv_macro_f1_std)


def select_best_model(cv_results: dict[str, dict[str, float]]) -> SelectionResult:
    """
    Documented model-selection rule:

    Primary criterion:   cross-validation macro-F1 mean (on training data
                          only), higher is better.
    Secondary criterion: cross-validation macro-F1 standard deviation,
                          lower is better -- used ONLY to break ties among
                          models whose primary-criterion scores are within
                          SELECTION_TIE_EPSILON of the best.

    Test-set metrics are reported separately in the training summary and
    metadata, but play no role in this selection.
    """
    ranked = sorted(
        (
            (name, r["cv_macro_f1_mean"], r["cv_macro_f1_std"])
            for name, r in cv_results.items()
        ),
        key=lambda t: t[1],
        reverse=True,
    )

    best_mean = ranked[0][1]
    tied = [t for t in ranked if (best_mean - t[1]) <= SELECTION_TIE_EPSILON]

    if len(tied) == 1:
        selected = tied[0][0]
        rationale = (
            f"'{selected}' has the highest CV macro-F1 mean "
            f"({tied[0][1]:.4f}), with no other model within "
            f"{SELECTION_TIE_EPSILON} of it."
        )
    else:
        tied_by_std = sorted(tied, key=lambda t: t[2])
        selected = tied_by_std[0][0]
        tied_names = ", ".join(f"{t[0]} ({t[1]:.4f} ± {t[2]:.4f})" for t in tied)
        if abs(tied_by_std[0][2] - tied_by_std[-1][2]) <= 1e-9:
            rationale = (
                f"Models are tied on CV macro-F1 mean within "
                f"{SELECTION_TIE_EPSILON} ({tied_names}) and also tied on "
                f"standard deviation; '{selected}' was selected as the "
                "first alphabetically among the tied models."
            )
        else:
            rationale = (
                f"Models are tied on CV macro-F1 mean within "
                f"{SELECTION_TIE_EPSILON} ({tied_names}); '{selected}' was "
                "selected for having the lowest CV macro-F1 standard "
                "deviation among the tied models."
            )

    return SelectionResult(
        selected_model=selected,
        criterion="cross-validation macro-F1 mean (primary), "
        "cross-validation macro-F1 std as tie-breaker (secondary)",
        rationale=rationale,
        ranked=ranked,
    )


def save_artifacts(
    fitted: dict[str, dict[str, Any]],
    selection: SelectionResult,
    cv_results: dict[str, dict[str, float]],
    test_results: dict[str, dict[str, Any]],
    dataset_row_count: int,
    class_names: list[str],
    train_count: int,
    test_count: int,
    output_dir: Path = MODELS_DIR,
) -> Path:
    """
    Save each fitted Pipeline, a copy of the best one, and metadata.json.

    `output_dir` defaults to the real models/ directory but can be
    overridden (e.g. to a pytest tmp_path) so tests can exercise the full
    save/load round trip without touching the production artifacts.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    for name, entry in fitted.items():
        joblib.dump(entry["pipeline"], output_dir / f"{name}.joblib")

    joblib.dump(
        fitted[selection.selected_model]["pipeline"], output_dir / "best_model.joblib"
    )

    metadata = {
        "dataset_path": str(DATASET_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "dataset_row_count": dataset_row_count,
        "feature_names": FEATURES,
        "target_name": TARGET,
        "class_names": class_names,
        "class_count": len(class_names),
        "train_sample_count": train_count,
        "test_sample_count": test_count,
        "random_state": RANDOM_STATE,
        "test_size": TEST_SIZE,
        "cv_folds": CV_FOLDS,
        "model_names": list(fitted.keys()),
        "model_metrics": {
            name: {
                k: v
                for k, v in test_results[name].items()
                if k not in ("classification_report",)
            }
            for name in fitted
        },
        "classification_reports": {
            name: test_results[name]["classification_report"] for name in fitted
        },
        "cross_validation_metrics": cv_results,
        "model_selection": {
            "selected_model": selection.selected_model,
            "criterion": selection.criterion,
            "rationale": selection.rationale,
            "ranked_by_cv_macro_f1_mean": [
                {"model": n, "cv_macro_f1_mean": m, "cv_macro_f1_std": s}
                for n, m, s in selection.ranked
            ],
        },
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": platform.python_version(),
        "sklearn_version": sklearn.__version__,
    }

    metadata_path = output_dir / "model_metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata_path


def _print_summary(
    dataset_row_count: int,
    train_count: int,
    test_count: int,
    class_names: list[str],
    cv_results: dict[str, dict[str, float]],
    test_results: dict[str, dict[str, Any]],
    selection: SelectionResult,
) -> None:
    display_names = {
        "random_forest": "Random Forest",
        "knn": "KNN",
        "svm": "SVM",
    }

    print("Dataset")
    print("-------")
    print(f"Rows: {dataset_row_count}")
    print(f"Features: {len(FEATURES)}")
    print(f"Classes: {len(class_names)}")
    print(f"Train: {train_count}")
    print(f"Test: {test_count}")
    print()

    for name in ("random_forest", "knn", "svm"):
        cv = cv_results[name]
        test = test_results[name]
        print(display_names[name])
        print("-" * len(display_names[name]))
        print(f"Accuracy: {test['accuracy']:.4f}")
        print(f"Macro F1: {test['macro_f1']:.4f}")
        print(f"Weighted F1: {test['weighted_f1']:.4f}")
        print(f"CV Accuracy: {cv['cv_accuracy_mean']:.4f} ± {cv['cv_accuracy_std']:.4f}")
        print(f"CV Macro F1: {cv['cv_macro_f1_mean']:.4f} ± {cv['cv_macro_f1_std']:.4f}")
        print(f"Training Time: {test['training_time_seconds']:.3f}s")
        print()

    print("Selected Model")
    print("--------------")
    print(f"{display_names[selection.selected_model]}")
    print(f"Criterion: {selection.criterion}")
    print(f"Rationale: {selection.rationale}")


def main() -> None:
    df, validation_report = load_and_validate()
    class_names = sorted(df[TARGET].unique().tolist())

    X, y = split_features_target(df)
    X_train, X_test, y_train, y_test = stratified_train_test_split(X, y)

    pipelines = build_pipelines()
    cv_results = run_cross_validation(pipelines, X_train, y_train)

    fitted = fit_pipelines(pipelines, X_train, y_train)
    test_results = evaluate_on_test(fitted, X_test, y_test, class_names)

    selection = select_best_model(cv_results)

    metadata_path = save_artifacts(
        fitted=fitted,
        selection=selection,
        cv_results=cv_results,
        test_results=test_results,
        dataset_row_count=validation_report.row_count,
        class_names=class_names,
        train_count=len(X_train),
        test_count=len(X_test),
    )

    _print_summary(
        dataset_row_count=validation_report.row_count,
        train_count=len(X_train),
        test_count=len(X_test),
        class_names=class_names,
        cv_results=cv_results,
        test_results=test_results,
        selection=selection,
    )

    print(f"\nArtifacts saved to: {MODELS_DIR}")
    print(f"Metadata saved to: {metadata_path}")


if __name__ == "__main__":
    main()
