import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  DATASET_OVERVIEW,
  FEATURE_STATS,
  CROP_PROFILES,
  CORRELATION_MATRIX,
  PCA_VARIANCE,
  KMEANS_CLUSTERS,
  ELBOW_CURVE_DATA
} from './server/dataset';
import { generatePcaScatterPoints } from './server/mlEngine';
import { PYTHON_TRAIN_SCRIPT, PYTHON_FASTAPI_SCRIPT } from './server/pythonScripts';
import { SoilEnvironmentalInput } from './src/types/ml';

/**
 * Real ML backend gateway. Every route below that talks to the actual
 * trained models (health, predict, metrics, model-info, dataset-summary)
 * proxies to the Python FastAPI service and ONLY that service -- there is
 * no fallback to server/mlEngine.ts's fake prediction/metrics logic. If
 * the Python backend is not configured or unreachable, these routes
 * return a real 503 error instead of fabricating a result.
 *
 * (server/mlEngine.ts's generatePcaScatterPoints, and the fake dataset
 * constants below, are still used by /api/visualizations, /api/clusters
 * and the combined /api/dataset-analysis route -- correlation/PCA/K-Means
 * integration is Phase 7, intentionally out of scope here.)
 */
function getPythonBaseUrl(): string | null {
  const url = process.env.PYTHON_BACKEND_URL;
  return url ? url.replace(/\/$/, '') : null;
}

interface ProxyResult {
  ok: boolean;
  status: number;
  body: any;
}

async function proxyToPython(
  pathSuffix: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<ProxyResult> {
  const base = getPythonBaseUrl();
  if (!base) {
    return {
      ok: false,
      status: 503,
      body: {
        error: 'ML backend unavailable',
        message:
          'PYTHON_BACKEND_URL is not configured. Start the Python FastAPI service ' +
          '(uvicorn app.main:app --reload --port 8000 from python_backend/) and set ' +
          'PYTHON_BACKEND_URL=http://localhost:8000.'
      }
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const pyRes = await fetch(`${base}${pathSuffix}`, { ...init, signal: controller.signal });
    clearTimeout(timeoutId);
    const body = await pyRes.json().catch(() => null);
    return { ok: pyRes.ok, status: pyRes.status, body };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 503,
      body: {
        error: 'ML backend unavailable',
        message: `Could not reach the Python FastAPI service at ${base}. Please verify it is running.`
      }
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health & Status endpoint -- proxied verbatim from the real backend.
  app.get('/api/health', async (req, res) => {
    const result = await proxyToPython('/api/health', {}, 4000);
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? {
        status: 'degraded',
        modelLoaded: false,
        model: null,
        errors: { proxy: 'No response body from Python backend' }
      }
    );
  });

  // 2. Crop Prediction endpoint (POST /api/predict)
  app.post('/api/predict', async (req, res) => {
    try {
      const { N, P, K, temperature, humidity, ph, rainfall } = req.body;

      // Validation
      const errors: string[] = [];
      if (typeof N !== 'number' || isNaN(N) || N < 0 || N > 140) errors.push('Nitrogen (N) must be between 0 and 140 ppm');
      if (typeof P !== 'number' || isNaN(P) || P < 5 || P > 145) errors.push('Phosphorus (P) must be between 5 and 145 ppm');
      if (typeof K !== 'number' || isNaN(K) || K < 5 || K > 205) errors.push('Potassium (K) must be between 5 and 205 ppm');
      if (typeof temperature !== 'number' || isNaN(temperature) || temperature < 5 || temperature > 50) errors.push('Temperature must be between 5°C and 50°C');
      if (typeof humidity !== 'number' || isNaN(humidity) || humidity < 10 || humidity > 100) errors.push('Humidity must be between 10% and 100%');
      if (typeof ph !== 'number' || isNaN(ph) || ph < 3.5 || ph > 10.0) errors.push('Soil pH must be between 3.5 and 10.0');
      if (typeof rainfall !== 'number' || isNaN(rainfall) || rainfall < 10 || rainfall > 350) errors.push('Rainfall must be between 10mm and 350mm');

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', details: errors });
      }

      const input: SoilEnvironmentalInput = {
        N: Number(N),
        P: Number(P),
        K: Number(K),
        temperature: Number(temperature),
        humidity: Number(humidity),
        ph: Number(ph),
        rainfall: Number(rainfall)
      };

      const result = await proxyToPython('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      return res.status(result.ok ? 200 : result.status).json(
        result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
      );
    } catch (err: any) {
      console.error('Prediction Error:', err);
      res.status(500).json({ error: 'Inference failed', message: err?.message || 'Internal server error' });
    }
  });

  // 3. Model Performance Metrics (GET /api/metrics)
  app.get('/api/metrics', async (req, res) => {
    const result = await proxyToPython('/api/metrics');
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
    );
  });

  // 3b. Model Info (GET /api/model-info) -- selected model, schema, and training run metadata.
  app.get('/api/model-info', async (req, res) => {
    const result = await proxyToPython('/api/model-info');
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
    );
  });

  // 4. Dataset Summary (GET /api/dataset-summary) -- real CSV statistics, no native fallback.
  app.get('/api/dataset-summary', async (req, res) => {
    const result = await proxyToPython('/api/dataset-summary');
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
    );
  });

  // 5. Visualizations Data (GET /api/visualizations)
  app.get('/api/visualizations', async (req, res) => {
    try {
      if (process.env.PYTHON_BACKEND_URL) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const pyRes = await fetch(`${process.env.PYTHON_BACKEND_URL.replace(/\/$/, '')}/api/visualizations`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            return res.json(pyData);
          }
        } catch {
          // Fall back to native computations
        }
      }

      const pcaSamples = generatePcaScatterPoints();
      res.json({
        correlationMatrix: CORRELATION_MATRIX,
        pcaVariance: PCA_VARIANCE,
        pcaSamples,
        backendSource: 'Kaggle Dataset Precomputations'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve visualizations' });
    }
  });

  // Combined Dataset Analysis (GET /api/dataset-analysis)
  app.get('/api/dataset-analysis', async (req, res) => {
    try {
      const crops = Object.keys(CROP_PROFILES);
      const cropDistribution = crops.map(c => ({
        crop: c,
        samples: 100,
        category: CROP_PROFILES[c].category
      }));
      const pcaSamples = generatePcaScatterPoints();

      res.json({
        datasetOverview: DATASET_OVERVIEW,
        features: FEATURE_STATS,
        cropClasses: crops,
        cropDistribution,
        correlationMatrix: CORRELATION_MATRIX,
        pcaVariance: PCA_VARIANCE,
        pcaSamples,
        backendSource: 'Kaggle Dataset Mathematical Precomputations'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve dataset analysis' });
    }
  });

  // 6. Clusters Data (GET /api/clusters & GET /api/unsupervised-analysis)
  const handleClustersRequest = async (req: express.Request, res: express.Response) => {
    try {
      if (process.env.PYTHON_BACKEND_URL) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const pyRes = await fetch(`${process.env.PYTHON_BACKEND_URL.replace(/\/$/, '')}/api/clusters`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            return res.json(pyData);
          }
        } catch {
          // Fall back to native clusters data
        }
      }

      const pcaClusterScatter = generatePcaScatterPoints();

      res.json({
        algorithm: 'K-Means Clustering (Partition-based Unsupervised Learning)',
        kValue: 4,
        optimalKRationale: 'Determined via Elbow Method (Inertia inflection point at K=4) & Silhouette Analysis (Peak score 0.52).',
        elbowData: ELBOW_CURVE_DATA,
        clusters: KMEANS_CLUSTERS,
        pcaClusterScatter,
        supervisedVsUnsupervisedExplanation: {
          supervisedRole: 'Supervised Learning (Random Forest, KNN, SVM) learns mapped decision boundaries from known ground-truth crop labels (y) to recommend a target crop for given soil/climate conditions.',
          unsupervisedRole: 'Unsupervised Learning (K-Means) discovers inherent agronomic groupings in unlabeled 7D feature space (X), grouping crops with similar nutrient demands and hydrological needs.',
          keyDifference: 'Supervised models require labeled target classes to optimize predictive accuracy (classification). Unsupervised models operate strictly on feature similarities to uncover natural crop guilds and rotation clusters without predefined targets.',
          practicalSynergy: 'K-Means clustering aids in identifying crop substitution and companion planting patterns, while Random Forest provides precision single-crop recommendation.'
        },
        backendSource: 'Kaggle Crop Cluster Analysis'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve unsupervised analysis' });
    }
  };

  app.get('/api/clusters', handleClustersRequest);
  app.get('/api/unsupervised-analysis', handleClustersRequest);

  // 6. Python ML code references (GET /api/python-code)
  app.get('/api/python-code', (req, res) => {
    res.json({
      trainScript: PYTHON_TRAIN_SCRIPT,
      fastApiScript: PYTHON_FASTAPI_SCRIPT
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crop-IT ML Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
