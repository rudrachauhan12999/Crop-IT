"""
Dataset analytics computed at request time from the real
data/Crop_recommendation.csv (via app.data_loader). No values here are
hardcoded -- row/feature/class counts, correlations, PCA projections, and
K-Means clusters are all calculated from whatever the CSV actually
contains, using StandardScaler + scikit-learn exactly as the rest of the
pipeline does.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from .config import FEATURES, RANDOM_STATE, TARGET
from .data_loader import load_and_validate

CLUSTER_K_RANGE = range(2, 11)  # K = 2..10 inclusive, per spec


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


def compute_feature_similarity(actual_class: str, predicted_class: str, top_n: int = 2) -> list[dict[str, Any]]:
    """
    For a pair of real crop classes, compute which features have the
    smallest normalized difference between their real per-class means in
    the dataset. Used to explain WHY a misclassification between two
    specific classes is plausible, using only real computed statistics --
    never an invented agronomic narrative.

    Normalization uses each feature's overall (dataset-wide) standard
    deviation, so differences are comparable across features with very
    different natural scales (e.g. K in ppm vs pH).
    """
    df, _ = load_and_validate()
    overall_std = df[FEATURES].std()
    class_means = df.groupby(TARGET)[FEATURES].mean()

    if actual_class not in class_means.index or predicted_class not in class_means.index:
        return []

    actual_row = class_means.loc[actual_class]
    predicted_row = class_means.loc[predicted_class]

    diffs = []
    for feature in FEATURES:
        std = overall_std[feature] or 1.0
        normalized_diff = abs(actual_row[feature] - predicted_row[feature]) / std
        diffs.append(
            {
                "feature": feature,
                "actualMean": float(actual_row[feature]),
                "predictedMean": float(predicted_row[feature]),
                "normalizedDifference": float(normalized_diff),
            }
        )

    diffs.sort(key=lambda d: d["normalizedDifference"])
    return diffs[:top_n]


def compute_correlation() -> dict[str, Any]:
    """Real Pearson correlation matrix over the 7 features (df[FEATURES].corr())."""
    df, _ = load_and_validate()
    corr = df[FEATURES].corr()
    return {
        "features": FEATURES,
        "matrix": [[float(v) for v in row] for row in corr.to_numpy()],
    }


def _fit_pca_2d(df: pd.DataFrame) -> tuple[np.ndarray, PCA, StandardScaler]:
    """
    Fit StandardScaler + PCA(n_components=2) on the full dataset's feature
    matrix. This is unsupervised exploratory analysis over the whole
    dataset (not a train/test-split model-evaluation step), so fitting on
    all rows is the standard, correct approach here -- it is not the same
    leakage concern as fitting a supervised model's preprocessing on test
    data.
    """
    X = df[FEATURES].to_numpy(dtype=float)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    transformed = pca.fit_transform(X_scaled)
    return transformed, pca, scaler


def compute_pca() -> dict[str, Any]:
    """2D PCA projection of the real dataset. No fake scatter points or jitter."""
    df, _ = load_and_validate()
    transformed, pca, _ = _fit_pca_2d(df)

    samples = [
        {
            "id": i + 1,
            "crop": str(df[TARGET].iloc[i]),
            "pc1": float(transformed[i, 0]),
            "pc2": float(transformed[i, 1]),
            "n": float(df["N"].iloc[i]),
            "p": float(df["P"].iloc[i]),
            "k": float(df["K"].iloc[i]),
            "rainfall": float(df["rainfall"].iloc[i]),
        }
        for i in range(len(df))
    ]

    ratio = pca.explained_variance_ratio_
    return {
        "pc1VarianceRatio": float(ratio[0]),
        "pc2VarianceRatio": float(ratio[1]),
        "totalVarianceExplained": float(ratio[:2].sum()),
        "samples": samples,
    }


def compute_clusters() -> dict[str, Any]:
    """
    Real K-Means clustering (K=2..10) fit on StandardScaler-transformed
    features over the full dataset. K is selected by maximum silhouette
    score -- a documented criterion, not an assumption. Cluster centroids
    are inverse-transformed back to original feature units for
    interpretability. Cluster labels are neutral ("Cluster N"); the crops
    listed per cluster are the actual most-frequent real labels within
    that cluster, not invented themes.
    """
    df, _ = load_and_validate()
    X = df[FEATURES].to_numpy(dtype=float)
    y = df[TARGET].to_numpy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    elbow_data = []
    fitted_by_k: dict[int, KMeans] = {}
    for k in CLUSTER_K_RANGE:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = km.fit_predict(X_scaled)
        sil = float(silhouette_score(X_scaled, labels)) if k > 1 else 0.0
        elbow_data.append({"k": k, "inertia": float(km.inertia_), "silhouetteScore": sil})
        fitted_by_k[k] = km

    best_point = max(elbow_data, key=lambda e: e["silhouetteScore"])
    selected_k = best_point["k"]
    selected_model = fitted_by_k[selected_k]
    labels = selected_model.labels_

    # PCA projection (2D) reused for the cluster-colored scatter plot.
    transformed, _pca, _pca_scaler = _fit_pca_2d(df)
    pca_cluster_scatter = [
        {
            "id": i + 1,
            "crop": str(y[i]),
            "cluster": int(labels[i]),
            "pc1": float(transformed[i, 0]),
            "pc2": float(transformed[i, 1]),
            "n": float(df["N"].iloc[i]),
            "p": float(df["P"].iloc[i]),
            "k": float(df["K"].iloc[i]),
            "rainfall": float(df["rainfall"].iloc[i]),
        }
        for i in range(len(df))
    ]

    centroids_scaled = selected_model.cluster_centers_
    centroids_original = scaler.inverse_transform(centroids_scaled)

    clusters = []
    for cluster_id in range(selected_k):
        mask = labels == cluster_id
        member_crops = pd.Series(y[mask])
        crop_counts = member_crops.value_counts()
        representative_crops = crop_counts.index.tolist()[:5]

        centroid_row = centroids_original[cluster_id]
        clusters.append(
            {
                "clusterId": cluster_id,
                "clusterName": f"Cluster {cluster_id}",
                "cropsCount": int(mask.sum()),
                "representativeCrops": representative_crops,
                "centroid": {feature: float(val) for feature, val in zip(FEATURES, centroid_row)},
            }
        )

    return {
        "algorithm": "K-Means Clustering (scikit-learn)",
        "kValue": selected_k,
        "optimalKRationale": (
            f"K={selected_k} selected: highest silhouette score "
            f"({best_point['silhouetteScore']:.4f}) among K=2..10 evaluated on the full "
            "StandardScaler-transformed dataset."
        ),
        "silhouetteScore": best_point["silhouetteScore"],
        "elbowData": elbow_data,
        "clusters": clusters,
        "pcaClusterScatter": pca_cluster_scatter,
        "pcaVariance": {
            "pc1Ratio": float(_pca.explained_variance_ratio_[0]),
            "pc2Ratio": float(_pca.explained_variance_ratio_[1]),
            "totalVarianceExplained": float(_pca.explained_variance_ratio_[:2].sum()),
        },
    }
