"""
Pydantic schemas for the Crop-IT ML backend.

The request schema mirrors the existing frontend contract (src/types/ml.ts
SoilEnvironmentalInput and the bounds enforced in
src/services/api.ts::validatePredictionInput) so the FastAPI service
validates requests identically to the React app. Response schemas use
camelCase field names directly (valid Python identifiers, just not
PEP8-idiomatic) so they serialize to JSON matching the frontend's existing
TypeScript field names with no alias configuration required.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SoilEnvironmentalInput(BaseModel):
    """Matches SoilEnvironmentalInput in src/types/ml.ts field-for-field."""

    N: float = Field(..., ge=0, le=140, description="Nitrogen content (ppm)")
    P: float = Field(..., ge=5, le=145, description="Phosphorus content (ppm)")
    K: float = Field(..., ge=5, le=205, description="Potassium content (ppm)")
    temperature: float = Field(..., ge=5, le=50, description="Temperature (°C)")
    humidity: float = Field(..., ge=10, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=3.5, le=10.0, description="Soil pH")
    rainfall: float = Field(..., ge=10, le=350, description="Rainfall (mm)")


class CropAlternative(BaseModel):
    crop: str
    probability: float


class ModelPredictionDetail(BaseModel):
    crop: str
    probability: float


class ModelComparison(BaseModel):
    randomForest: ModelPredictionDetail
    knn: ModelPredictionDetail
    svm: ModelPredictionDetail


class PredictionResponse(BaseModel):
    """Matches PredictionResponse in src/types/ml.ts (the fields Phase 5 populates)."""

    recommendedCrop: str
    probability: float
    alternatives: list[CropAlternative]
    model: str
    modelComparison: ModelComparison
    backendSource: str


class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool
    model: str | None = None
    errors: dict[str, str] | None = None


class ModelMetricEntry(BaseModel):
    model: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    macroF1: float
    weightedF1: float
    trainingTimeSeconds: float
    cvAccuracyMean: float
    cvAccuracyStd: float
    cvMacroF1Mean: float
    cvMacroF1Std: float


class MetricsResponse(BaseModel):
    models: list[ModelMetricEntry]
    selectedModel: str
    selectionCriterion: str
    selectionRationale: str
    trainSampleCount: int
    testSampleCount: int
    backendSource: str


class ModelInfoResponse(BaseModel):
    selectedModel: str
    featureNames: list[str]
    target: str
    classNames: list[str]
    datasetRowCount: int
    trainingTimestampUtc: str
    randomState: int
    testSize: float
    availableModels: list[str]
    pythonVersion: str
    sklearnVersion: str


class FeatureStatistic(BaseModel):
    feature: str
    min: float
    max: float
    mean: float
    median: float
    std: float
    q25: float
    q75: float


class CropDistributionEntry(BaseModel):
    crop: str
    samples: int


class DatasetSummaryResponse(BaseModel):
    totalSamples: int
    featureCount: int
    classCount: int
    missingValues: int
    duplicateRows: int
    targetColumn: str
    classDistribution: list[CropDistributionEntry]
    features: list[FeatureStatistic]


class CorrelationResponse(BaseModel):
    features: list[str]
    matrix: list[list[float]]


class PcaSample(BaseModel):
    id: int
    crop: str
    pc1: float
    pc2: float
    n: float
    p: float
    k: float
    rainfall: float


class PcaResponse(BaseModel):
    pc1VarianceRatio: float
    pc2VarianceRatio: float
    totalVarianceExplained: float
    samples: list[PcaSample]


class ElbowPointEntry(BaseModel):
    k: int
    inertia: float
    silhouetteScore: float


class ClusterEntry(BaseModel):
    clusterId: int
    clusterName: str
    cropsCount: int
    representativeCrops: list[str]
    centroid: dict[str, float]


class PcaClusterSample(PcaSample):
    cluster: int


class PcaVariance(BaseModel):
    pc1Ratio: float
    pc2Ratio: float
    totalVarianceExplained: float


class ClustersResponse(BaseModel):
    algorithm: str
    kValue: int
    optimalKRationale: str
    silhouetteScore: float
    elbowData: list[ElbowPointEntry]
    clusters: list[ClusterEntry]
    pcaClusterScatter: list[PcaClusterSample]
    pcaVariance: PcaVariance


class FeatureSimilarityEntry(BaseModel):
    feature: str
    actualMean: float
    predictedMean: float
    normalizedDifference: float


class ConfusionMatrixError(BaseModel):
    actual: str
    predicted: str
    count: int
    similarFeatures: list[FeatureSimilarityEntry]


class PerClassConfusionMetric(BaseModel):
    className: str
    support: int
    tp: int
    fp: int
    fn: int
    precision: float
    recall: float
    f1: float


class ModelConfusionMatrix(BaseModel):
    modelId: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    classes: list[str]
    matrix: list[list[int]]
    totalSamples: int
    correctCount: int
    errorCount: int
    perClassMetrics: list[PerClassConfusionMetric]
    errors: list[ConfusionMatrixError]


class ConfusionMatrixResponse(BaseModel):
    models: dict[str, ModelConfusionMatrix]
    bestModel: str


class FeatureImportanceEntry(BaseModel):
    feature: str
    importance: float


class FeatureImportanceResponse(BaseModel):
    model: str
    importances: list[FeatureImportanceEntry]
    note: str
