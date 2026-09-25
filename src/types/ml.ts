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
  backendSource: 'native-ml-engine' | 'python-fastapi-backend' | string;
}

export type PredictResponse = PredictionResponse;

export interface MetricsRequest {
  dataset?: string;
}

export interface ModelMetric {
  name: string;
  type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  trainTestSplit: string;
  testSamples: number;
  parameters: string;
  trainingTime: string;
  advantages: string;
  limitations: string;
}

export interface PerClassMetric {
  className: string;
  support: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ConfusionMatrixErrorDetail {
  actual: string;
  predicted: string;
  count: number;
  rootCause: string;
  agronomicFactor: string;
}

export interface ConfusionMatrixData {
  modelId: 'random_forest' | 'knn' | 'svm';
  modelName: string;
  algorithmFamily: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  classes: string[];
  matrix: number[][]; // [actualIdx][predictedIdx]
  totalSamples: number;
  correctCount: number;
  errorCount: number;
  perClassMetrics: PerClassMetric[];
  errors: ConfusionMatrixErrorDetail[];
}

export interface ModelMetricsResponse {
  models: ModelMetric[];
  bestModel: string;
  evaluationSummary: {
    totalDatasetSize: number;
    featuresCount: number;
    classesCount: number;
    metricFormula: string;
    crossValidationScore: {
      mean: number;
      std: number;
      folds: number;
    };
  };
  confusionMatrixHighlight: {
    totalTested: number;
    correctPredictions: number;
    misclassifications: number;
  };
  backendSource: string;
}

export type MetricsResponse = ModelMetricsResponse;

export interface DatasetSummaryRequest {
  dataset?: string;
}

export interface FeatureStat {
  feature: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  q25: number;
  q75: number;
  description: string;
}

export interface CropDistributionItem {
  crop: string;
  samples: number;
  category: string;
}

export interface DatasetSummaryResponse {
  datasetOverview: {
    totalSamples: number;
    featuresCount: number;
    classesCount: number;
    missingValues: number;
    duplicateRows: number;
    source: string;
    targetColumn: string;
  };
  features: FeatureStat[];
  cropClasses: string[];
  cropDistribution: CropDistributionItem[];
  backendSource: string;
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
  cluster: number;
  pc1: number;
  pc2: number;
  n: number;
  p: number;
  k: number;
  rainfall: number;
}

export interface DatasetAnalysisResponse {
  datasetOverview: {
    totalSamples: number;
    featuresCount: number;
    classesCount: number;
    missingValues: number;
    duplicateRows: number;
    source: string;
    targetColumn: string;
  };
  features: FeatureStat[];
  cropClasses: string[];
  cropDistribution: CropDistributionItem[];
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

export interface BackendHealthResponse {
  status: 'ok' | 'degraded';
  engine: string;
  datasetLoaded: boolean;
  totalSamples?: number;
  classesCount?: number;
  activeAlgorithms?: string[];
  externalPythonStatus: 'connected' | 'not_configured' | 'offline';
  externalPythonUrl?: string;
}
