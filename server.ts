import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { STATIC_CROP_PROFILES } from './server/cropReference';
import { analyzeInputStatus } from './server/inputAnalysis';
import { SoilEnvironmentalInput } from './src/types/ml';

/**
 * Real ML backend gateway. Every route that talks to the actual trained
 * models or the real dataset (health, predict, metrics, model-info,
 * dataset-summary, visualizations, clusters, confusion-matrix,
 * feature-importance) proxies to the Python FastAPI service and ONLY
 * that service. There is no legacy TypeScript ML engine left to fall
 * back to -- server/mlEngine.ts and server/dataset.ts (the fake
 * prediction math, hardcoded metrics, and precomputed
 * CORRELATION_MATRIX/PCA_VARIANCE/KMEANS_CLUSTERS constants) were removed
 * in Phase 9. If the Python backend is not configured or unreachable,
 * these routes return a real 503 error instead of fabricating a result.
 *
 * The only non-ML enrichment left is `server/cropReference.ts` (static
 * botanical facts -- scientific name, season, description) and
 * `server/inputAnalysis.ts` (threshold buckets applied to the user's own
 * real input values). Both are deliberately separate from the ML
 * prediction: see the /api/predict handler below, which merges them into
 * the real model's response by name/value lookup, never influencing what
 * the model actually predicted.
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

      if (!result.ok) {
        return res.status(result.status).json(
          result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
        );
      }

      // Enrich the real prediction with static, non-ML context: threshold
      // categorization of the user's own real input values, and (if the
      // recommended crop has an entry) static botanical reference facts.
      // Neither of these affects what crop was predicted or its probability.
      const recommendedCrop = result.body?.recommendedCrop;
      const cropProfile = typeof recommendedCrop === 'string' ? STATIC_CROP_PROFILES[recommendedCrop] : undefined;

      return res.status(200).json({
        ...result.body,
        inputAnalysis: analyzeInputStatus(input),
        ...(cropProfile ? { cropProfile } : {})
      });
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

  // 5. Visualizations Data (GET /api/visualizations) -- real correlation + PCA, merged.
  app.get('/api/visualizations', async (req, res) => {
    const [corrResult, pcaResult] = await Promise.all([
      proxyToPython('/api/correlation'),
      proxyToPython('/api/pca')
    ]);

    const failed = !corrResult.ok ? corrResult : !pcaResult.ok ? pcaResult : null;
    if (failed) {
      return res.status(failed.status).json(
        failed.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
      );
    }

    res.json({
      correlationMatrix: corrResult.body,
      pcaVariance: {
        pc1Ratio: pcaResult.body.pc1VarianceRatio,
        pc2Ratio: pcaResult.body.pc2VarianceRatio,
        totalVarianceExplained: pcaResult.body.totalVarianceExplained
      },
      pcaSamples: pcaResult.body.samples,
      backendSource: 'python-fastapi-backend'
    });
  });

  // 6. Clusters Data (GET /api/clusters & GET /api/unsupervised-analysis) -- real K-Means.
  const handleClustersRequest = async (req: express.Request, res: express.Response) => {
    const result = await proxyToPython('/api/clusters');
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
    );
  };

  app.get('/api/clusters', handleClustersRequest);
  app.get('/api/unsupervised-analysis', handleClustersRequest);

  // 6b. Confusion Matrix (GET /api/confusion-matrix) -- real per-model test-set matrices.
  app.get('/api/confusion-matrix', async (req, res) => {
    const result = await proxyToPython('/api/confusion-matrix');
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
    );
  });

  // 6c. Feature Importance (GET /api/feature-importance) -- real Random Forest feature_importances_.
  app.get('/api/feature-importance', async (req, res) => {
    const result = await proxyToPython('/api/feature-importance');
    res.status(result.ok ? 200 : result.status).json(
      result.body ?? { error: 'ML backend error', message: 'No response body from Python backend' }
    );
  });

  // 7. Real Python source code, read live from disk (GET /api/python-code).
  // This always reflects the actual training pipeline and FastAPI service
  // in python_backend/app/ -- never a hand-maintained illustrative copy
  // that can drift out of sync with what the system really runs.
  app.get('/api/python-code', (req, res) => {
    try {
      const trainScript = fs.readFileSync(
        path.join(process.cwd(), 'python_backend', 'app', 'train.py'),
        'utf-8'
      );
      const fastApiScript = fs.readFileSync(
        path.join(process.cwd(), 'python_backend', 'app', 'main.py'),
        'utf-8'
      );
      res.json({ trainScript, fastApiScript });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to read Python source files',
        message: err?.message || 'Internal server error'
      });
    }
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
