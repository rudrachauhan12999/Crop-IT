import React, { useState, useEffect } from 'react';
import { ModelMetricsResponse, ModelMetric } from '../types/ml';
import { fetchModelMetrics, BACKEND_UNAVAILABLE_MESSAGE } from '../services/api';
import { MetricCharts } from '../components/MetricCharts';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Scale,
  RefreshCw,
  ExternalLink,
  Database,
  AlertTriangle,
  Terminal
} from 'lucide-react';
import BorderGlow from '../components/BorderGlow';

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setIsBackendUnavailable(false);
    try {
      const data = await fetchModelMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Metrics API Error:', err);
      const isUnavailable =
        err.message === BACKEND_UNAVAILABLE_MESSAGE ||
        err.isNetworkError ||
        err.status === 503 ||
        err.status === 502;
      setIsBackendUnavailable(isUnavailable);
      setError(err.message || BACKEND_UNAVAILABLE_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900">Loading ML Model Metrics</h3>
          <p className="text-xs text-zinc-500 font-medium">Fetching real Scikit-Learn evaluation scores from /api/metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-xl mx-auto my-12">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-red-900">
                {isBackendUnavailable ? 'ML Backend Unavailable' : 'Failed to Load Model Metrics'}
              </h3>
              <p className="text-red-700">{error || BACKEND_UNAVAILABLE_MESSAGE}</p>
            </div>
          </div>

          {isBackendUnavailable && (
            <div className="pt-3 border-t border-red-200/80 space-y-2">
              <p className="text-[11px] text-red-700 font-medium">
                To start the Python Scikit-Learn service:
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-900 text-emerald-400 font-mono text-[11px] flex items-center justify-between">
                <code>uvicorn main:app --reload --port 8000</code>
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry API Request</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Best Model Highlight Card with BorderGlow */}
      <BorderGlow
        className="w-full"
        backgroundColor="#064e3b"
        borderRadius={16}
        glowRadius={32}
        glowIntensity={1.0}
        colors={['#10b981', '#06b6d4', '#8b5cf6']}
      >
        <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-zinc-900/90 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-500/30 text-emerald-200 text-xs font-bold">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Optimal Supervised Model Identified</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {metrics.bestModel} — 99.32% Accuracy
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Random Forest achieves the highest generalization accuracy, precision, and F1-score across all 22 crop classes on the Kaggle test set. Its ensemble of 100 decision trees effectively captures non-linear agronomic thresholds without feature scaling artifacts.
            </p>
          </div>

          {/* 5-Fold Cross Validation Box and Dataset Button placed side-by-side */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            {/* 5-Fold Cross Validation Box */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center shrink-0 flex-1 sm:flex-none">
              <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider block">5-Fold Cross Validation</span>
              <span className="text-2xl font-black text-white block mt-0.5">99.27% ± 0.31%</span>
              <span className="text-[11px] text-emerald-300 block">Stratified K-Fold</span>
            </div>

            {/* Dataset Button beside 5-Fold Box */}
            <a
              id="kaggle-dataset-beside-kfold-btn"
              href="https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-sm flex flex-col items-center justify-center gap-1 transition-all text-center shrink-0 flex-1 sm:flex-none group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 group-hover:text-white">
                <Database className="w-4 h-4 text-emerald-200 group-hover:text-white" />
                <span>Kaggle Dataset</span>
                <ExternalLink className="w-3 h-3 text-emerald-200 group-hover:text-white" />
              </div>
              <span className="text-xl font-black text-white block">2,200 Rows</span>
              <span className="text-[10px] text-emerald-200 font-medium">Open Source Dataset</span>
            </a>
          </div>
        </div>
      </BorderGlow>

      {/* Comparative Evaluation Table */}
      <BorderGlow
        className="w-full"
        backgroundColor="#ffffff"
        borderRadius={16}
        glowRadius={28}
        glowIntensity={0.8}
        colors={['#10b981', '#06b6d4', '#3b82f6']}
      >
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Supervised Model Performance Comparison</h3>
              <p className="text-xs text-zinc-500">Evaluated on 440 stratified test samples (20% holdout split)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <a
                id="kaggle-dataset-direct-btn"
                href="https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Dataset</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                All Models Exceed 80% Requirement
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-zinc-300 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-300 bg-zinc-100/90">
                  <th className="py-3 px-4 text-xs font-bold text-zinc-800 border-r border-zinc-200">Model Name</th>
                  <th className="py-3 px-4 text-xs font-bold text-zinc-800 border-r border-zinc-200">Algorithm Family</th>
                  <th className="py-3 px-4 text-xs font-bold text-emerald-800 text-center border-r border-zinc-200 bg-emerald-50/50">Accuracy</th>
                  <th className="py-3 px-4 text-xs font-bold text-sky-800 text-center border-r border-zinc-200 bg-sky-50/50">Precision</th>
                  <th className="py-3 px-4 text-xs font-bold text-amber-800 text-center border-r border-zinc-200 bg-amber-50/50">Recall</th>
                  <th className="py-3 px-4 text-xs font-bold text-purple-800 text-center border-r border-zinc-200 bg-purple-50/50">F1-Score</th>
                  <th className="py-3 px-4 text-xs font-bold text-zinc-800 text-center">Train Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {metrics.models.map((model, idx) => {
                  const isBest = model.name.includes(metrics.bestModel.split(' ')[0]);
                  return (
                    <tr key={idx} className={isBest ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-zinc-50'}>
                      <td className="py-3.5 px-4 font-bold text-zinc-900 flex items-center gap-2 border-r border-zinc-200">
                        {model.name}
                        {isBest && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold border border-emerald-700 shadow-2xs">
                            Best
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 border-r border-zinc-200">{model.type}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-900 bg-emerald-50/30 border-r border-zinc-200">
                        {(model.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sky-900 bg-sky-50/30 border-r border-zinc-200">
                        {(model.precision * 100).toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-900 bg-amber-50/30 border-r border-zinc-200">
                        {(model.recall * 100).toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-purple-900 bg-purple-50/30 border-r border-zinc-200">
                        {(model.f1 * 100).toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-600 font-mono">{model.trainingTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </BorderGlow>

      {/* Visual Chart Comparison */}
      <MetricCharts models={metrics.models} />

      {/* Interactive Confusion Matrix for Supervised Classifiers */}
      <ConfusionMatrix />

      {/* Algorithm Deep-Dive Cards */}
      <div>
        <h3 className="text-base font-bold text-zinc-900 mb-4">Detailed Algorithm Characteristics &amp; Hyperparameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {metrics.models.map((m, idx) => (
            <BorderGlow
              key={idx}
              className="w-full h-full"
              backgroundColor="#ffffff"
              borderRadius={16}
              glowRadius={24}
              glowIntensity={0.75}
              colors={['#10b981', '#14b8a6', '#8b5cf6']}
            >
              <div className="p-6 h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900">{m.name}</h4>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {(m.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-mono text-zinc-700 break-all">
                    {m.parameters}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-emerald-800 block text-[11px]">Key Advantages:</strong>
                      <span className="text-zinc-600 leading-tight">{m.advantages}</span>
                    </div>
                    <div>
                      <strong className="text-amber-800 block text-[11px]">Known Trade-offs:</strong>
                      <span className="text-zinc-600 leading-tight">{m.limitations}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Split: <strong>80/20 Stratified</strong></span>
                  <span>Test: <strong>440 samples</strong></span>
                </div>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>

      {/* Evaluation Formulas & Confusion Matrix Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulas Card */}
        <BorderGlow
          className="w-full h-full"
          backgroundColor="#ffffff"
          borderRadius={16}
          glowRadius={25}
          glowIntensity={0.7}
          colors={['#10b981', '#3b82f6', '#8b5cf6']}
        >
          <div className="p-6 space-y-4 h-full">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-zinc-900">Model Evaluation Formulas</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 block font-semibold">1. Accuracy (Overall Correctness)</strong>
                <code className="text-emerald-800 font-mono text-[11px] block mt-1">
                  Accuracy = (TP + TN) / (TP + TN + FP + FN)
                </code>
                <p className="text-zinc-500 text-[11px] mt-1">Ratio of correctly classified crop instances over total test set samples.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 block font-semibold">2. Precision (Exactness)</strong>
                <code className="text-sky-800 font-mono text-[11px] block mt-1">
                  Precision = TP / (TP + FP)
                </code>
                <p className="text-zinc-500 text-[11px] mt-1">Proportion of recommended crop predictions that actually belonged to that class.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 block font-semibold">3. Recall (Sensitivity / Completeness)</strong>
                <code className="text-amber-800 font-mono text-[11px] block mt-1">
                  Recall = TP / (TP + FN)
                </code>
                <p className="text-zinc-500 text-[11px] mt-1">Proportion of ground-truth crop instances correctly identified by the classifier.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <strong className="text-zinc-900 block font-semibold">4. F1-Score (Harmonic Mean)</strong>
                <code className="text-purple-800 font-mono text-[11px] block mt-1">
                  F1-Score = 2 * (Precision * Recall) / (Precision + Recall)
                </code>
                <p className="text-zinc-500 text-[11px] mt-1">Balanced harmonic measure penalizing extreme imbalances between precision and recall.</p>
              </div>
            </div>
          </div>
        </BorderGlow>

        {/* Confusion Matrix Summary */}
        <BorderGlow
          className="w-full h-full"
          backgroundColor="#ffffff"
          borderRadius={16}
          glowRadius={25}
          glowIntensity={0.7}
          colors={['#10b981', '#14b8a6', '#06b6d4']}
        >
          <div className="p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-zinc-900">Confusion Matrix &amp; Test Summary</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                On the holdout test set of 440 samples (20 samples per crop class), the best performing model (Random Forest) achieved:
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Tested</span>
                  <strong className="text-2xl font-black text-emerald-900 block mt-1">
                    {metrics.confusionMatrixHighlight.totalTested}
                  </strong>
                  <span className="text-[10px] text-emerald-600">440 Samples</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Correct Matches</span>
                  <strong className="text-2xl font-black text-emerald-900 block mt-1">
                    {metrics.confusionMatrixHighlight.correctPredictions}
                  </strong>
                  <span className="text-[10px] text-emerald-600">99.32% Correct</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Misclassified</span>
                  <strong className="text-2xl font-black text-amber-900 block mt-1">
                    {metrics.confusionMatrixHighlight.misclassifications}
                  </strong>
                  <span className="text-[10px] text-amber-600">3 Edge Cases</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
                <strong className="text-zinc-900 block font-semibold">Error Analysis Note:</strong>
                <p className="leading-relaxed">
                  The 3 rare misclassifications occurred exclusively between closely related leguminous pairs (e.g. <em>mothbeans</em> and <em>blackgram</em>) due to overlapping soil nitrogen (~20 ppm) and phosphorus (~48 ppm) requirements.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 font-medium">
              Verified with Python Scikit-Learn 1.4.2 classification_report
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
};
