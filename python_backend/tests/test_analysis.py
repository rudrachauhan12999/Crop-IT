"""
Tests for correlation, PCA, K-Means, and feature-similarity analytics
(app/analysis.py), run against the REAL dataset. No mocks, no synthetic
data -- these check that the computations are mathematically valid, not
that specific hardcoded values exist.
"""

from __future__ import annotations

import pytest

from app.analysis import (
    CLUSTER_K_RANGE,
    compute_clusters,
    compute_correlation,
    compute_feature_similarity,
    compute_pca,
)
from app.config import FEATURES


@pytest.fixture(scope="module")
def correlation_result():
    return compute_correlation()


@pytest.fixture(scope="module")
def pca_result():
    return compute_pca()


@pytest.fixture(scope="module")
def clusters_result():
    return compute_clusters()


def test_correlation_matrix_is_valid(correlation_result):
    assert correlation_result["features"] == FEATURES
    matrix = correlation_result["matrix"]
    n = len(FEATURES)
    assert len(matrix) == n
    assert all(len(row) == n for row in matrix)

    for i in range(n):
        assert matrix[i][i] == pytest.approx(1.0, abs=1e-9)

    for i in range(n):
        for j in range(n):
            assert -1.0 <= matrix[i][j] <= 1.0
            assert matrix[i][j] == pytest.approx(matrix[j][i], abs=1e-9)  # symmetric


def test_pca_variance_and_samples(pca_result, real_dataset):
    df, report = real_dataset
    assert 0.0 < pca_result["pc1VarianceRatio"] <= 1.0
    assert 0.0 < pca_result["pc2VarianceRatio"] <= 1.0
    assert pca_result["totalVarianceExplained"] == pytest.approx(
        pca_result["pc1VarianceRatio"] + pca_result["pc2VarianceRatio"], abs=1e-9
    )
    assert pca_result["totalVarianceExplained"] <= 1.0

    samples = pca_result["samples"]
    assert len(samples) == report.row_count
    real_classes = set(df["label"].unique())
    assert {s["crop"] for s in samples}.issubset(real_classes)
    # Every sample must carry real numeric pc1/pc2 -- not a placeholder.
    assert all(isinstance(s["pc1"], float) and isinstance(s["pc2"], float) for s in samples)


def test_clusters_k_selection_and_elbow_coverage(clusters_result):
    assert clusters_result["kValue"] in list(CLUSTER_K_RANGE)
    elbow_ks = [e["k"] for e in clusters_result["elbowData"]]
    assert elbow_ks == list(CLUSTER_K_RANGE)

    # Inertia must decrease (non-increasing) as K grows -- a basic sanity
    # invariant of K-Means, not something that should ever fail on real data.
    inertias = [e["inertia"] for e in clusters_result["elbowData"]]
    assert all(inertias[i] >= inertias[i + 1] for i in range(len(inertias) - 1))

    for e in clusters_result["elbowData"]:
        assert -1.0 <= e["silhouetteScore"] <= 1.0

    # The selected K's silhouette must be the maximum among all evaluated.
    selected_entry = next(e for e in clusters_result["elbowData"] if e["k"] == clusters_result["kValue"])
    assert selected_entry["silhouetteScore"] == max(e["silhouetteScore"] for e in clusters_result["elbowData"])


def test_clusters_partition_all_rows(clusters_result, real_dataset):
    _df, report = real_dataset
    clusters = clusters_result["clusters"]
    assert len(clusters) == clusters_result["kValue"]

    total_assigned = sum(c["cropsCount"] for c in clusters)
    assert total_assigned == report.row_count

    for c in clusters:
        assert set(c["centroid"].keys()) == set(FEATURES)
        assert len(c["representativeCrops"]) > 0
        assert c["cropsCount"] > 0


def test_clusters_pca_scatter_matches_dataset(clusters_result, real_dataset):
    _df, report = real_dataset
    scatter = clusters_result["pcaClusterScatter"]
    assert len(scatter) == report.row_count
    assert all(0 <= p["cluster"] < clusters_result["kValue"] for p in scatter)


def test_feature_similarity_is_real_and_symmetric_inputs():
    result = compute_feature_similarity("rice", "jute", top_n=3)
    assert len(result) == 3
    for entry in result:
        assert entry["feature"] in FEATURES
        assert entry["normalizedDifference"] >= 0.0

    # Results must be sorted ascending by normalized difference (most similar first).
    diffs = [e["normalizedDifference"] for e in result]
    assert diffs == sorted(diffs)


def test_feature_similarity_unknown_class_returns_empty():
    assert compute_feature_similarity("not_a_real_crop", "rice") == []
