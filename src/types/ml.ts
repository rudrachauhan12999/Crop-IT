/**
 * Crop-IT: Machine Learning Crop Recommendation System
 * TypeScript Types & Interfaces
 */

export interface SoilEnvironmentalInput {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export type PredictRequest = SoilEnvironmentalInput;

export interface CropAlternative {
  crop: string;
  probability: number;
  matchScore?: number;
  characteristics?: string;
}

export interface ModelPredictionDetail {
  crop: string;
  probability: number;
}

export interface PredictionResponse {
  recommendedCrop: string;
  probability: number;
  alternatives: CropAlternative[];
  model: string;
  modelComparison?: {
    randomForest: ModelPredictionDetail;
    knn: ModelPredictionDetail;
    svm: ModelPredictionDetail;
  };
  inputAnalysis?: {
    nStatus: 'Low' | 'Optimal' | 'High' | 'Very High';
    pStatus: 'Low' | 'Optimal' | 'High' | 'Very High';
    kStatus: 'Low' | 'Optimal' | 'High' | 'Very High';
    phStatus: 'Acidic' | 'Slightly Acidic' | 'Neutral' | 'Alkaline';
    tempStatus: 'Cool' | 'Moderate' | 'Warm' | 'Hot';
    humidityStatus: 'Low' | 'Moderate' | 'High' | 'Very High';
    rainfallStatus: 'Arid / Low' | 'Moderate' | 'Heavy' | 'Extreme';
  };
  cropProfile?: {
    scientificName: string;
    category: 'Cereal' | 'Pulse / Legume' | 'Fruit' | 'Cash Crop' | 'Fiber' | 'Beverage';
    optimalSeason: string;
    growingPeriod: string;
    waterRequirement: string;
    soilType: string;
    description: string;
  };
  backendSource: 'python-fastapi-backend' | string;
}

export type PredictResponse = PredictionResponse;

export interface MetricsRequest {
  dataset?: string;
}

/**
 * Matches FastAPI's /api/metrics ModelMetricEntry exactly (python_backend/app/schemas.py).
 * `model` is the internal model key (e.g. "random_forest", "knn", "svm").
 */
export interface ModelMetric {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  macroF1: number;
  weightedF1: number;
  trainingTimeSeconds: number;
  cvAccuracyMean: number;
  cvAccuracyStd: number;
  cvMacroF1Mean: number;
  cvMacroF1Std: number;
}

/** Matches FastAPI's /api/metrics MetricsResponse exactly. */
export interface ModelMetricsResponse {
  models: ModelMetric[];
  selectedModel: string;
  selectionCriterion: string;
  selectionRationale: string;
  trainSampleCount: number;
  testSampleCount: number;
  backendSource: string;
}

export type MetricsResponse = ModelMetricsResponse;

export interface DatasetSummaryRequest {
  dataset?: string;
}

export interface FeatureStat {
  feature: string;
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  q25: number;
  q75: number;
}

export interface CropDistributionItem {
  crop: string;
  samples: number;
}

/** Matches FastAPI's /api/dataset-summary DatasetSummaryResponse exactly (flat, no nesting). */
export interface DatasetSummaryResponse {
  totalSamples: number;
  featureCount: number;
  classCount: number;
  missingValues: number;
  duplicateRows: number;
  targetColumn: string;
  classDistribution: CropDistributionItem[];
  features: FeatureStat[];
}

/** Matches FastAPI's /api/model-info ModelInfoResponse exactly. */
export interface ModelInfoResponse {
  selectedModel: string;
  featureNames: string[];
  target: string;
  classNames: string[];
  datasetRowCount: number;
  trainingTimestampUtc: string;
  randomState: number;
  testSize: number;
  availableModels: string[];
  pythonVersion: string;
  sklearnVersion: string;
}

export interface VisualizationsRequest {
  dataset?: string;
}

export interface VisualizationsResponse {
  correlationMatrix: {
    features: string[];
    matrix: number[][];
  };
  pcaVariance: {
    pc1Ratio: number;
    pc2Ratio: number;
    totalVarianceExplained: number;
  };
  pcaSamples: PcaDataPoint[];
  backendSource: string;
}

export interface CorrelationItem {
  feature1: string;
  feature2: string;
  correlation: number;
}

export interface PcaDataPoint {
  id: number;
  crop: string;
  /** Present only when the point comes from the K-Means /api/clusters response; absent for plain /api/pca EDA points. */
  cluster?: number;
  pc1: number;
  pc2: number;
  n: number;
  p: number;
  k: number;
  rainfall: number;
}

export interface KMeansCluster {
  clusterId: number;
  clusterName?: string;
  clusterTheme?: string;
  cropsCount?: number;
  representativeCrops?: string[];
  centroid?: {
    N?: number;
    P?: number;
    K?: number;
    temperature?: number;
    humidity?: number;
    ph?: number;
    rainfall?: number;
    [key: string]: any;
  };
  ecologicalInterpretation?: string;
  [key: string]: any;
}

export interface ElbowPoint {
  k: number;
  inertia: number;
  silhouetteScore?: number;
  [key: string]: any;
}

export interface ClustersRequest {
  k?: number;
}

export interface ClustersResponse {
  algorithm?: string;
  kValue?: number;
  optimalK?: number;
  optimalKRationale?: string;
  silhouetteScore?: number;
  elbowData?: ElbowPoint[];
  clusters?: KMeansCluster[];
  pcaClusterScatter?: PcaDataPoint[];
  pcaVariance?: {
    pc1Ratio?: number;
    pc2Ratio?: number;
    totalVarianceExplained?: number;
  };
  supervisedVsUnsupervisedExplanation?: {
    supervisedRole?: string;
    unsupervisedRole?: string;
    keyDifference?: string;
    practicalSynergy?: string;
  };
  backendSource?: string;
  [key: string]: any;
}

export type UnsupervisedAnalysisResponse = ClustersResponse;


export interface PipelineStage {
  id: number;
  title: string;
  category: 'Data' | 'Preprocessing' | 'Modeling' | 'Evaluation' | 'Inference';
  description: string;
  tools: string[];
  keyOutcomes: string[];
  formulaOrCodeSnippet?: string;
}

/** Matches FastAPI's /api/health HealthResponse exactly (proxied verbatim by server.ts). */
export interface BackendHealthResponse {
  status: 'ok' | 'degraded';
  modelLoaded: boolean;
  model: string | null;
  errors?: Record<string, string> | null;
}

/**
 * Real confusion-matrix contract (GET /api/confusion-matrix, Phase 7).
 * The legacy ConfusionMatrixData/PerClassMetric/ConfusionMatrixErrorDetail
 * types and their only consumer, src/data/confusionMatrixData.ts, were
 * removed in Phase 9.
 */
export interface FeatureSimilarityEntry {
  feature: string;
  actualMean: number;
  predictedMean: number;
  normalizedDifference: number;
}

export interface RealConfusionMatrixError {
  actual: string;
  predicted: string;
  count: number;
  similarFeatures: FeatureSimilarityEntry[];
}

export interface RealPerClassConfusionMetric {
  className: string;
  support: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface RealModelConfusionMatrix {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  classes: string[];
  matrix: number[][];
  totalSamples: number;
  correctCount: number;
  errorCount: number;
  perClassMetrics: RealPerClassConfusionMetric[];
  errors: RealConfusionMatrixError[];
}

export interface RealConfusionMatrixResponse {
  models: Record<string, RealModelConfusionMatrix>;
  bestModel: string;
}

export interface FeatureImportanceEntry {
  feature: string;
  importance: number;
}

export interface FeatureImportanceResponse {
  model: string;
  importances: FeatureImportanceEntry[];
  note: string;
}
