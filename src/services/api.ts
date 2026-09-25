/**
 * Crop-IT: Centralized Machine Learning API Service Layer
 * Connects frontend UI components to external Python FastAPI ML backend / Express gateway.
 * 
 * Features:
 * - Endpoints: POST /api/predict, GET /api/metrics, GET /api/dataset-summary, GET /api/visualizations, GET /api/clusters
 * - Configurable API base URL via VITE_API_BASE_URL
 * - Input validation with clear error messages
 * - Request timeout handling (AbortController)
 * - Network failure detection with standard message: "ML backend is currently unavailable. Please start the Python API."
 */

import {
  SoilEnvironmentalInput,
  PredictRequest,
  PredictResponse,
  PredictionResponse,
  MetricsRequest,
  MetricsResponse,
  ModelMetricsResponse,
  DatasetSummaryRequest,
  DatasetSummaryResponse,
  VisualizationsRequest,
  VisualizationsResponse,
  ClustersRequest,
  ClustersResponse,
  DatasetAnalysisResponse,
  UnsupervisedAnalysisResponse,
  BackendHealthResponse
} from '../types/ml';

// Configurable API base URL (from env or runtime)
let customBaseUrl: string | null = null;

export function getApiBaseUrl(): string {
  if (customBaseUrl !== null) {
    return customBaseUrl;
  }
  // If Vite env variable is set (e.g., http://localhost:8000), use it
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Default to relative root (proxy or same-origin /api)
  return '';
}

export function setApiBaseUrl(url: string | null): void {
  if (url === null || url.trim() === '') {
    customBaseUrl = null;
  } else {
    customBaseUrl = url.trim().replace(/\/$/, '');
  }
}

/** Standard backend unavailable error message */
export const BACKEND_UNAVAILABLE_MESSAGE =
  'ML backend is currently unavailable. Please start the Python API.';

/** Custom API Error Class with error categorization */
export class ApiError extends Error {
  public status?: number;
  public details?: string[];
  public isNetworkError: boolean;
  public isTimeout: boolean;

  constructor(
    message: string,
    options?: { status?: number; details?: string[]; isNetworkError?: boolean; isTimeout?: boolean }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.details = options?.details;
    this.isNetworkError = options?.isNetworkError || false;
    this.isTimeout = options?.isTimeout || false;
  }
}

/**
 * Validates Soil & Climate input variables against agronomic boundaries
 */
export function validatePredictionInput(input: SoilEnvironmentalInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.N === undefined || input.N === null || isNaN(input.N) || input.N < 0 || input.N > 140) {
    errors.push('Nitrogen (N) must be between 0 and 140 ppm');
  }
  if (input.P === undefined || input.P === null || isNaN(input.P) || input.P < 5 || input.P > 145) {
    errors.push('Phosphorus (P) must be between 5 and 145 ppm');
  }
  if (input.K === undefined || input.K === null || isNaN(input.K) || input.K < 5 || input.K > 205) {
    errors.push('Potassium (K) must be between 5 and 205 ppm');
  }
  if (input.temperature === undefined || input.temperature === null || isNaN(input.temperature) || input.temperature < 5 || input.temperature > 50) {
    errors.push('Temperature must be between 5°C and 50°C');
  }
  if (input.humidity === undefined || input.humidity === null || isNaN(input.humidity) || input.humidity < 10 || input.humidity > 100) {
    errors.push('Relative Humidity must be between 10% and 100%');
  }
  if (input.ph === undefined || input.ph === null || isNaN(input.ph) || input.ph < 3.5 || input.ph > 10.0) {
    errors.push('Soil pH must be between 3.5 and 10.0');
  }
  if (input.rainfall === undefined || input.rainfall === null || isNaN(input.rainfall) || input.rainfall < 10 || input.rainfall > 350) {
    errors.push('Annual Rainfall must be between 10mm and 350mm');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Internal helper for resilient fetch with timeout, network failure handling, and typed error responses
 */
async function fetchWithTimeout<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errDetails: string[] | undefined;
      let errMsg = `Request failed with status ${response.status}`;

      try {
        const errorJson = await response.json();
        if (errorJson.details && Array.isArray(errorJson.details)) {
          errDetails = errorJson.details;
          errMsg = errDetails.join(', ');
        } else if (errorJson.detail) {
          errMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        } else if (errorJson.error) {
          errMsg = errorJson.error;
        } else if (errorJson.message) {
          errMsg = errorJson.message;
        }
      } catch {
        // Response body was not JSON
      }

      if (response.status === 503 || response.status === 502 || response.status === 504) {
        throw new ApiError(BACKEND_UNAVAILABLE_MESSAGE, {
          status: response.status,
          details: errDetails,
          isNetworkError: true
        });
      }

      throw new ApiError(errMsg, {
        status: response.status,
        details: errDetails
      });
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. ${BACKEND_UNAVAILABLE_MESSAGE}`,
        { isTimeout: true, isNetworkError: true }
      );
    }

    // Network connection failed / CORS error / server unreachable
    throw new ApiError(BACKEND_UNAVAILABLE_MESSAGE, {
      isNetworkError: true
    });
  }
}

/**
 * POST /api/predict
 * Sends soil and climate parameters to the Python Scikit-Learn backend for crop recommendation.
 */
export async function predictCrop(input: PredictRequest): Promise<PredictResponse> {
  const validation = validatePredictionInput(input);
  if (!validation.valid) {
    throw new ApiError(`Input validation failed: ${validation.errors.join(', ')}`, {
      details: validation.errors
    });
  }

  return await fetchWithTimeout<PredictResponse>('/api/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });
}

/** Alias for predictCrop */
export const postCropPrediction = predictCrop;

/**
 * GET /api/metrics
 * Fetches real model performance metrics (Accuracy, Precision, Recall, F1) from holdout evaluation.
 */
export async function fetchModelMetrics(params?: MetricsRequest): Promise<MetricsResponse> {
  const query = params?.dataset ? `?dataset=${encodeURIComponent(params.dataset)}` : '';
  return await fetchWithTimeout<MetricsResponse>(`/api/metrics${query}`);
}

/**
 * GET /api/dataset-summary
 * Fetches dataset overview, sample counts, feature boundaries, and class distributions.
 */
export async function fetchDatasetSummary(params?: DatasetSummaryRequest): Promise<DatasetSummaryResponse> {
  const query = params?.dataset ? `?dataset=${encodeURIComponent(params.dataset)}` : '';
  return await fetchWithTimeout<DatasetSummaryResponse>(`/api/dataset-summary${query}`);
}

/**
 * GET /api/visualizations
 * Fetches Pearson correlation matrix and 2D PCA dimensionality reduction scatter points.
 */
export async function fetchVisualizations(params?: VisualizationsRequest): Promise<VisualizationsResponse> {
  const query = params?.dataset ? `?dataset=${encodeURIComponent(params.dataset)}` : '';
  return await fetchWithTimeout<VisualizationsResponse>(`/api/visualizations${query}`);
}

/**
 * Normalizes K-Means and Unsupervised Analysis responses from Python FastAPI or local ML backend
 */
export function normalizeClustersResponse(raw: any): ClustersResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      algorithm: 'K-Means Clustering (Scikit-Learn)',
      kValue: 4,
      optimalKRationale: '',
      elbowData: [],
      clusters: [],
      pcaClusterScatter: [],
      backendSource: 'python-fastapi-backend'
    };
  }

  // 1. Normalize PCA cluster scatter points
  const rawScatter =
    raw.pcaClusterScatter ??
    raw.pca_cluster_scatter ??
    raw.pcaSamples ??
    raw.pca_samples ??
    raw.pca_points ??
    raw.pcaPoints ??
    raw.scatter ??
    raw.data ??
    [];

  const pcaClusterScatter = Array.isArray(rawScatter)
    ? rawScatter.map((pt: any, idx: number) => ({
        id: pt.id ?? idx + 1,
        crop: pt.crop ?? pt.crop_name ?? pt.label ?? 'Sample',
        cluster:
          typeof pt.cluster === 'number'
            ? pt.cluster
            : typeof pt.cluster_id === 'number'
            ? pt.cluster_id
            : typeof pt.clusterId === 'number'
            ? pt.clusterId
            : 0,
        pc1:
          typeof pt.pc1 === 'number'
            ? pt.pc1
            : typeof pt.PC1 === 'number'
            ? pt.PC1
            : Number(pt.pc1) || 0,
        pc2:
          typeof pt.pc2 === 'number'
            ? pt.pc2
            : typeof pt.PC2 === 'number'
            ? pt.PC2
            : Number(pt.pc2) || 0,
        n: pt.n ?? pt.N ?? 0,
        p: pt.p ?? pt.P ?? 0,
        k: pt.k ?? pt.K ?? 0,
        rainfall: pt.rainfall ?? pt.Rainfall ?? 0
      }))
    : [];

  // 2. Normalize Elbow curve and Inertia/Silhouette data
  const rawElbow = raw.elbowData ?? raw.elbow_data ?? raw.elbow ?? raw.wcss_curve ?? [];
  const elbowData = Array.isArray(rawElbow)
    ? rawElbow.map((eb: any, idx: number) => ({
        k: eb.k ?? eb.cluster_count ?? eb.K ?? idx + 1,
        inertia:
          typeof eb.inertia === 'number'
            ? eb.inertia
            : typeof eb.wcss === 'number'
            ? eb.wcss
            : Number(eb.inertia) || 0,
        silhouetteScore:
          typeof eb.silhouetteScore === 'number'
            ? eb.silhouetteScore
            : typeof eb.silhouette_score === 'number'
            ? eb.silhouette_score
            : typeof eb.silhouette === 'number'
            ? eb.silhouette
            : Number(eb.silhouetteScore) || 0
      }))
    : [];

  // 3. Normalize discovered Clusters
  const rawClusters =
    raw.clusters ??
    raw.cluster_details ??
    raw.clusterDetails ??
    raw.cluster_info ??
    raw.clusterInfo ??
    [];

  const clusters = Array.isArray(rawClusters)
    ? rawClusters.map((c: any, idx: number) => {
        const clusterId =
          typeof c.clusterId === 'number'
            ? c.clusterId
            : typeof c.cluster_id === 'number'
            ? c.cluster_id
            : typeof c.id === 'number'
            ? c.id
            : idx;

        const rawCrops = c.representativeCrops ?? c.representative_crops ?? c.crops ?? [];
        const representativeCrops = Array.isArray(rawCrops) ? rawCrops : [];

        return {
          clusterId,
          clusterName: c.clusterName ?? c.cluster_name ?? c.name ?? `Cluster ${clusterId}`,
          clusterTheme: c.clusterTheme ?? c.cluster_theme ?? 'Agronomic Guild',
          cropsCount:
            c.cropsCount ??
            c.crops_count ??
            (representativeCrops.length > 0 ? representativeCrops.length : 0),
          representativeCrops,
          centroid: {
            N: c.centroid?.N ?? c.centroid?.n ?? 0,
            P: c.centroid?.P ?? c.centroid?.p ?? 0,
            K: c.centroid?.K ?? c.centroid?.k ?? 0,
            temperature: c.centroid?.temperature ?? c.centroid?.temp ?? 0,
            humidity: c.centroid?.humidity ?? 0,
            ph: c.centroid?.ph ?? c.centroid?.pH ?? 0,
            rainfall: c.centroid?.rainfall ?? c.centroid?.Rainfall ?? 0
          },
          ecologicalInterpretation:
            c.ecologicalInterpretation ?? c.ecological_interpretation ?? c.description ?? ''
        };
      })
    : [];

  const kValue =
    raw.kValue ??
    raw.optimalK ??
    raw.optimal_k ??
    raw.k_value ??
    raw.k ??
    (clusters.length > 0 ? clusters.length : 4);

  const optimalKRationale =
    raw.optimalKRationale ??
    raw.optimal_k_rationale ??
    raw.rationale ??
    `Determined via Elbow Method inflection point at K=${kValue}.`;

  const silhouetteScore =
    raw.silhouetteScore ??
    raw.silhouette_score ??
    (elbowData.find((e) => e.k === kValue)?.silhouetteScore) ??
    0.520;

  const explanation = raw.supervisedVsUnsupervisedExplanation ?? raw.supervised_vs_unsupervised ?? raw.explanation ?? {
    supervisedRole:
      'Supervised Learning (Random Forest, KNN, SVM) maps soil & climate inputs to known crop labels.',
    unsupervisedRole:
      'Unsupervised Learning (K-Means & PCA) reveals intrinsic groupings and patterns in 7D space without labels.',
    keyDifference:
      'Supervised models predict specific crop labels; unsupervised models discover agronomic similarities and ecological clusters.',
    practicalSynergy:
      'K-Means clustering informs crop rotation and soil similarity, while Random Forest gives precise single-crop recommendations.'
  };

  return {
    algorithm: raw.algorithm ?? 'K-Means Clustering (Python Scikit-Learn)',
    kValue,
    optimalKRationale,
    silhouetteScore,
    elbowData,
    clusters,
    pcaClusterScatter,
    pcaVariance: raw.pcaVariance ?? raw.pca_variance,
    supervisedVsUnsupervisedExplanation: explanation,
    backendSource: raw.backendSource ?? raw.backend_source ?? 'python-fastapi-backend'
  };
}

/**
 * GET /api/clusters
 * Fetches K-Means clustering analysis, inertia elbow curve data, and centroid coordinates.
 */
export async function fetchClusters(params?: ClustersRequest): Promise<ClustersResponse> {
  const query = params?.k ? `?k=${encodeURIComponent(params.k)}` : '';
  const raw = await fetchWithTimeout<any>(`/api/clusters${query}`);
  return normalizeClustersResponse(raw);
}

/**
 * Combined Exploratory Data Analysis helper (fetches /api/dataset-analysis or aggregates summary + visualizations)
 */
export async function fetchDatasetAnalysis(): Promise<DatasetAnalysisResponse> {
  return await fetchWithTimeout<DatasetAnalysisResponse>('/api/dataset-analysis');
}

/**
 * Alias for fetchClusters matching the unsupervised analysis view requirements
 */
export async function fetchUnsupervisedAnalysis(): Promise<UnsupervisedAnalysisResponse> {
  const raw = await fetchWithTimeout<any>('/api/clusters');
  return normalizeClustersResponse(raw);
}

/**
 * GET /api/health
 * Checks backend health and Python ML service connectivity.
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    return await fetchWithTimeout<BackendHealthResponse>('/api/health', {}, 4000);
  } catch (error: any) {
    // Backend is unreachable: report an honest offline status without
    // fabricating dataset/model figures that were never actually confirmed.
    return {
      status: 'degraded',
      engine: 'Python ML Backend Disconnected',
      datasetLoaded: false,
      externalPythonStatus: 'offline'
    };
  }
}

/**
 * GET /api/python-code
 * Retrieves complete Scikit-Learn training and FastAPI server script strings.
 */
export async function fetchPythonCode(): Promise<{ trainScript: string; fastApiScript: string }> {
  return await fetchWithTimeout<{ trainScript: string; fastApiScript: string }>('/api/python-code');
}
