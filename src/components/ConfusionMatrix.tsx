import React, { useState, useEffect, useMemo } from 'react';
import { RealModelConfusionMatrix, RealConfusionMatrixError, RealPerClassConfusionMetric, FeatureSimilarityEntry } from '../types/ml';
import { fetchConfusionMatrix, BACKEND_UNAVAILABLE_MESSAGE } from '../services/api';
import {
  Grid,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  BarChart2,
  Info,
  ArrowRight,
  Filter,
  Check,
  TrendingDown,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Terminal
} from 'lucide-react';

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  random_forest: 'Random Forest',
  knn: 'KNN (k=5)',
  svm: 'SVM (RBF)'
};

function displayModelName(key: string): string {
  return MODEL_DISPLAY_NAMES[key] ?? key;
}

/** Compact, real (computed) similarity summary -- never an invented agronomic story. */
function formatSimilarFeatures(features: FeatureSimilarityEntry[]): string {
  if (!features || features.length === 0) return 'No similarity data available.';
  return features.map((f) => `${f.feature} (Δ${f.normalizedDifference.toFixed(2)}σ)`).join(', ');
}

export const ConfusionMatrix: React.FC = () => {
  const [models, setModels] = useState<Record<string, RealModelConfusionMatrix> | null>(null);
  const [bestModel, setBestModel] = useState<string>('random_forest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

  const [selectedModelKey, setSelectedModelKey] = useState<string>('random_forest');
  const [viewMode, setViewMode] = useState<'full' | 'errors_only' | 'table'>('full');
  const [displayMode, setDisplayMode] = useState<'count' | 'percent'>('count');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredCell, setHoveredCell] = useState<{
    actual: string;
    predicted: string;
    actualIdx: number;
    predIdx: number;
    count: number;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setIsBackendUnavailable(false);
    try {
      const res = await fetchConfusionMatrix();
      setModels(res.models);
      setBestModel(res.bestModel);
      setSelectedModelKey(res.bestModel);
    } catch (err: any) {
      console.error('Confusion Matrix API Error:', err);
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
      <div className="bg-white p-8 rounded-2xl border-2 border-emerald-200 shadow-xs text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-zinc-500 font-medium">Loading real confusion matrices from /api/confusion-matrix...</p>
      </div>
    );
  }

  if (error || !models) {
    return (
      <div className="bg-white p-6 rounded-2xl border-2 border-red-200 shadow-xs">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-red-900">
                {isBackendUnavailable ? 'ML Backend Unavailable' : 'Failed to Load Confusion Matrix'}
              </h3>
              <p className="text-red-700">{error || BACKEND_UNAVAILABLE_MESSAGE}</p>
            </div>
          </div>
          {isBackendUnavailable && (
            <div className="pt-2 border-t border-red-200/80 space-y-2">
              <div className="p-2.5 rounded-lg bg-zinc-900 text-emerald-400 font-mono text-[11px] flex items-center justify-between">
                <code>uvicorn app.main:app --reload --port 8000</code>
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          )}
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const activeModel: RealModelConfusionMatrix = models[selectedModelKey];
  const classes = activeModel.classes;
  const modelKeys = Object.keys(models);

  // Helper to get detailed 4-quadrant metrics for any class
  const getClassMetrics = (className: string) => {
    const m = activeModel.perClassMetrics.find((metric) => metric.className === className);
    if (!m) {
      const fallbackSupport = Math.round(activeModel.totalSamples / classes.length);
      return {
        className,
        support: fallbackSupport,
        tp: fallbackSupport,
        fp: 0,
        fn: 0,
        tn: activeModel.totalSamples - fallbackSupport,
        precision: 1,
        recall: 1,
        f1: 1
      };
    }
    const tn = activeModel.totalSamples - (m.tp + m.fp + m.fn);
    return {
      ...m,
      tn
    };
  };

  // Filtered classes for search or error-only view
  const activeClasses = (() => {
    let list = classes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.toLowerCase().includes(q));
    }
    if (viewMode === 'errors_only') {
      const errorClassSet = new Set<string>();
      activeModel.errors.forEach((e) => {
        errorClassSet.add(e.actual);
        errorClassSet.add(e.predicted);
      });
      list = list.filter((c) => errorClassSet.has(c));
    }
    return list;
  })();

  // Selected crop details if any
  const selectedCropMetric: RealPerClassConfusionMetric | undefined = selectedCrop
    ? activeModel.perClassMetrics.find((m) => m.className === selectedCrop)
    : undefined;

  const selectedCropErrors: RealConfusionMatrixError[] = selectedCrop
    ? activeModel.errors.filter((e) => e.actual === selectedCrop || e.predicted === selectedCrop)
    : [];

  // Hovered cell metrics
  const hoveredMetrics = (() => {
    if (!hoveredCell) return null;
    const actualM = getClassMetrics(hoveredCell.actual);
    const predM = getClassMetrics(hoveredCell.predicted);
    const errorDetail = activeModel.errors.find(
      (e) => e.actual === hoveredCell.actual && e.predicted === hoveredCell.predicted
    );
    const isDiagonal = hoveredCell.actual === hoveredCell.predicted;
    return { actualM, predM, errorDetail, isDiagonal };
  })();

  // Get cell background styling
  const getCellColor = (actual: string, predicted: string, count: number, rowSupport: number) => {
    const isDiagonal = actual === predicted;
    const isHovered = hoveredCell && hoveredCell.actual === actual && hoveredCell.predicted === predicted;
    const isSelected = selectedCrop && (selectedCrop === actual || selectedCrop === predicted);

    if (isDiagonal) {
      if (count === rowSupport) {
        return isHovered || isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-500 text-white font-semibold';
      } else if (count > 0) {
        return isHovered || isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-400 text-white font-medium';
      }
      return 'bg-zinc-100 text-zinc-400';
    } else {
      if (count > 0) {
        return isHovered || isSelected
          ? 'bg-rose-600 text-white font-black animate-pulse shadow-xs ring-2 ring-rose-400'
          : 'bg-rose-100 text-rose-800 font-bold border border-rose-300';
      }
      return 'bg-zinc-50/70 text-zinc-300 hover:bg-zinc-100';
    }
  };

  return (
    <div id="confusion-matrix-section" className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-6">
      {/* Header with Title & Model Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">
              Interactive Multi-Class Confusion Matrix ({classes.length} × {classes.length})
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Examine exact prediction distributions, diagonal true positives, and off-diagonal misclassification vectors on the {activeModel.totalSamples}-sample test set.
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-zinc-100 p-1.5 rounded-xl border border-zinc-300 self-start lg:self-auto shadow-2xs">
          {modelKeys.map((key) => {
            const isActive = selectedModelKey === key;
            const m = models[key];
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedModelKey(key);
                  setHoveredCell(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-900 shadow-xs border-emerald-300 font-bold'
                    : 'text-zinc-700 border-transparent hover:text-zinc-900 hover:bg-white/50'
                }`}
              >
                <span>{displayModelName(key)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {(m.accuracy * 100).toFixed(2)}%
                </span>
                {key === bestModel && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="CV-selected best model"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Performance Overview Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50/70 border-2 border-emerald-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Accuracy</span>
          <span className="text-xl font-black text-emerald-900 block mt-0.5">
            {(activeModel.accuracy * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">Overall Correct</span>
        </div>

        <div className="p-3 rounded-xl bg-sky-50/70 border-2 border-sky-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-sky-700 block">Macro Precision</span>
          <span className="text-xl font-black text-sky-900 block mt-0.5">
            {(activeModel.precision * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-sky-700 font-semibold">Exactness Ratio</span>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 border-2 border-amber-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Macro Recall</span>
          <span className="text-xl font-black text-amber-900 block mt-0.5">
            {(activeModel.recall * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-amber-700 font-semibold">Sensitivity</span>
        </div>

        <div className="p-3 rounded-xl bg-purple-50/70 border-2 border-purple-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-700 block">Macro F1-Score</span>
          <span className="text-xl font-black text-purple-900 block mt-0.5">
            {(activeModel.f1 * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-purple-700 font-semibold">Harmonic Mean</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 border-2 border-zinc-300 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-zinc-600 block">Correct Matches</span>
          <span className="text-xl font-black text-zinc-900 block mt-0.5">
            {activeModel.correctCount} / {activeModel.totalSamples}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {((activeModel.correctCount / activeModel.totalSamples) * 100).toFixed(1)}% True Positives
          </span>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Misclassifications</span>
          <span className="text-xl font-black text-rose-900 block mt-0.5">
            {activeModel.errorCount}
          </span>
          <span className="text-[10px] text-rose-700 font-semibold">
            {((activeModel.errorCount / activeModel.totalSamples) * 100).toFixed(2)}% Error Rate
          </span>
        </div>
      </div>

      {/* Control Bar: View Modes, Search, Normalization */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 border-2 border-zinc-200 shadow-2xs">
        {/* Left: View Mode Buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-200/80 p-1 rounded-xl border border-zinc-300">
          <button
            onClick={() => setViewMode('full')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              viewMode === 'full' ? 'bg-white text-emerald-900 border-emerald-300 shadow-xs' : 'text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Full {classes.length}×{classes.length} Matrix</span>
          </button>

          <button
            onClick={() => setViewMode('errors_only')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              viewMode === 'errors_only'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Error Focus ({activeModel.errors.length} pairs)</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-emerald-900 border-emerald-300 shadow-xs' : 'text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Per-Class Metrics Table</span>
          </button>
        </div>

        {/* Right: Search & Display Format */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search crop class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border-2 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
            />
          </div>

          {/* Counts vs Normalized Percent Toggle */}
          <div className="flex items-center gap-1 bg-zinc-200/80 p-1 rounded-xl text-[11px] border border-zinc-300">
            <button
              onClick={() => setDisplayMode('count')}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                displayMode === 'count' ? 'bg-white text-zinc-900 border-zinc-300 shadow-xs' : 'text-zinc-600 border-transparent'
              }`}
            >
              Raw Counts (N)
            </button>
            <button
              onClick={() => setDisplayMode('percent')}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                displayMode === 'percent' ? 'bg-white text-zinc-900 border-zinc-300 shadow-xs' : 'text-zinc-600 border-transparent'
              }`}
            >
              Normalized (%)
            </button>
          </div>

          {/* Reset Selection */}
          {(selectedCrop || searchQuery || viewMode !== 'full') && (
            <button
              onClick={() => {
                setSelectedCrop(null);
                setSearchQuery('');
                setViewMode('full');
              }}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 bg-zinc-200 hover:bg-zinc-300 border border-zinc-300 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Matrix Area */}
      {viewMode !== 'table' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-zinc-700">Y-Axis: Actual Ground Truth</span>
              <span>vs</span>
              <span className="font-semibold text-zinc-700">X-Axis: Predicted Class</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                <span>Diagonal (True Positives)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
                <span>Off-Diagonal (Misclassifications)</span>
              </span>
            </div>
          </div>

          {/* Responsive Matrix Grid Scroll Container */}
          <div className="overflow-x-auto border-2 border-zinc-300 rounded-xl bg-zinc-50/80 p-2 sm:p-4 shadow-2xs">
            <div className="min-w-[760px] inline-block">
              {/* Column Header (Predicted Classes) */}
              <div className="flex items-end mb-2 pl-24">
                {activeClasses.map((colCrop) => {
                  const isSelected = selectedCrop === colCrop;
                  return (
                    <div
                      key={colCrop}
                      onClick={() => setSelectedCrop(selectedCrop === colCrop ? null : colCrop)}
                      className={`w-7 sm:w-8 h-20 flex items-end justify-center pb-1 text-[10px] font-mono cursor-pointer transition-colors ${
                        isSelected ? 'text-emerald-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      title={`Predicted: ${colCrop} (click to focus)`}
                    >
                      <span className="truncate max-h-18">{colCrop}</span>
                    </div>
                  );
                })}
              </div>

              {/* Rows (Actual Classes) */}
              <div className="space-y-1">
                {activeClasses.map((rowCrop) => {
                  const actualIdx = classes.indexOf(rowCrop);
                  const isRowSelected = selectedCrop === rowCrop;
                  const rowMetric = activeModel.perClassMetrics.find((m) => m.className === rowCrop);
                  const rM = getClassMetrics(rowCrop);

                  return (
                    <div key={rowCrop} className="flex items-center">
                      {/* Row Label */}
                      <button
                        onClick={() => setSelectedCrop(selectedCrop === rowCrop ? null : rowCrop)}
                        className={`w-24 text-right pr-2 text-[11px] font-mono truncate transition-colors cursor-pointer flex items-center justify-end gap-1 ${
                          isRowSelected
                            ? 'text-emerald-700 font-bold bg-emerald-50 rounded-md py-0.5 border border-emerald-200'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                        title={`Actual: ${rowCrop} (Recall: ${rowMetric ? (rowMetric.recall * 100).toFixed(0) : '—'}%)`}
                      >
                        {rowMetric && rowMetric.fn > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                        )}
                        <span className="truncate">{rowCrop}</span>
                      </button>

                      {/* Cells for this row */}
                      <div className="flex items-center gap-1">
                        {activeClasses.map((colCrop) => {
                          const predIdx = classes.indexOf(colCrop);
                          const count = activeModel.matrix[actualIdx][predIdx];
                          const cellBg = getCellColor(rowCrop, colCrop, count, rM.support);
                          const isDiag = rowCrop === colCrop;

                          return (
                            <button
                              key={colCrop}
                              onMouseEnter={() =>
                                setHoveredCell({
                                  actual: rowCrop,
                                  predicted: colCrop,
                                  actualIdx,
                                  predIdx,
                                  count
                                })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                              onClick={() => {
                                if (count > 0 || rowCrop === colCrop) {
                                  setSelectedCrop(selectedCrop === rowCrop ? null : rowCrop);
                                }
                              }}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[10px] font-mono transition-all cursor-pointer border ${cellBg}`}
                              title={`${isDiag ? 'TRUE POSITIVE (TP)' : count > 0 ? 'MISCLASSIFICATION' : 'ZERO ERROR'}\nActual: ${rowCrop}\nPredicted: ${colCrop}\nSamples: ${count} / ${rM.support}\n\n[Class Metrics for '${rowCrop}']:\n• TP (True Positives): ${rM.tp}\n• FP (False Positives): ${rM.fp}\n• FN (False Negatives): ${rM.fn}\n• TN (True Negatives): ${rM.tn}\n• Precision: ${(rM.precision * 100).toFixed(1)}%\n• Recall: ${(rM.recall * 100).toFixed(1)}%\n• F1-Score: ${(rM.f1 * 100).toFixed(1)}%`}
                            >
                              {count > 0 ? (
                                displayMode === 'count' ? (
                                  count
                                ) : (
                                  `${Math.round((count / rM.support) * 100)}`
                                )
                              ) : (
                                <span className="text-[9px] text-zinc-300">·</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Interactive Cell Hover & 4-Quadrant Diagnostic Tooltip Card */}
          {hoveredMetrics ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white shadow-lg border border-zinc-800 space-y-4 animate-in fade-in duration-150">
              {/* Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      hoveredMetrics.isDiagonal
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : hoveredCell?.count && hoveredCell.count > 0
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse'
                        : 'bg-zinc-500'
                    }`}
                  ></div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-zinc-400">Actual (Ground Truth):</span>
                    <strong className="text-white capitalize font-mono bg-zinc-800 px-2 py-0.5 rounded">
                      {hoveredCell?.actual}
                    </strong>
                    <span className="text-zinc-500">➜</span>
                    <span className="text-zinc-400">Predicted (Model):</span>
                    <strong className="text-emerald-300 capitalize font-mono bg-zinc-800 px-2 py-0.5 rounded">
                      {hoveredCell?.predicted}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300">
                    Cell Count: <strong className="text-white font-mono">{hoveredCell?.count}</strong> / {hoveredMetrics.actualM.support} test samples
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      hoveredMetrics.isDiagonal
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : hoveredCell?.count && hoveredCell.count > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {hoveredMetrics.isDiagonal
                      ? 'True Positive Cell (Correct)'
                      : hoveredCell?.count && hoveredCell.count > 0
                      ? 'Misclassification Cell'
                      : 'Zero Overlap (0 Errors)'}
                  </span>
                </div>
              </div>

              {/* 4-Quadrant Diagnostic Grid for the Actual Classification Label */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Classification Metrics for Label: <span className="text-emerald-400 capitalize">{hoveredCell?.actual}</span> (N={activeModel.totalSamples} Test Set)
                  </span>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-300">
                    <span>Precision: <strong className="text-emerald-400">{(hoveredMetrics.actualM.precision * 100).toFixed(1)}%</strong></span>
                    <span>Recall: <strong className="text-teal-400">{(hoveredMetrics.actualM.recall * 100).toFixed(1)}%</strong></span>
                    <span>F1: <strong className="text-purple-400">{(hoveredMetrics.actualM.f1 * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* True Positives (TP) */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-300 font-semibold">True Positives (TP)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {hoveredMetrics.actualM.tp}
                    </div>
                    <p className="text-[10px] text-emerald-200/70 mt-0.5 leading-tight">
                      Correctly predicted as {hoveredCell?.actual}
                    </p>
                  </div>

                  {/* False Positives (FP) */}
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-300 font-semibold">False Positives (FP)</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {hoveredMetrics.actualM.fp}
                    </div>
                    <p className="text-[10px] text-rose-200/70 mt-0.5 leading-tight">
                      Other crops wrongly called {hoveredCell?.actual}
                    </p>
                  </div>

                  {/* False Negatives (FN) */}
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-semibold">False Negatives (FN)</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {hoveredMetrics.actualM.fn}
                    </div>
                    <p className="text-[10px] text-amber-200/70 mt-0.5 leading-tight">
                      {hoveredCell?.actual} missed as other crops
                    </p>
                  </div>

                  {/* True Negatives (TN) */}
                  <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-500/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-300 font-semibold">True Negatives (TN)</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {hoveredMetrics.actualM.tn}
                    </div>
                    <p className="text-[10px] text-sky-200/70 mt-0.5 leading-tight">
                      Other crops correctly rejected
                    </p>
                  </div>
                </div>
              </div>

              {/* Real feature-similarity note for this specific misclassification, if applicable */}
              {hoveredMetrics.errorDetail && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs flex items-start gap-2 text-rose-200">
                  <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Closest features (computed, normalized by dataset std): </strong>
                    <span>{formatSimilarFeatures(hoveredMetrics.errorDetail.similarFeatures)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hover over any individual square to see the exact count of True Positives (TP), False Positives (FP), True Negatives (TN), and False Negatives (FN).</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Total: {activeModel.totalSamples} Test Samples</span>
            </div>
          )}
        </div>
      ) : (
        /* Per-Class Metrics Detailed Table */
        <div className="overflow-x-auto border-2 border-zinc-300 rounded-xl shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-300 bg-zinc-100/90">
                <th className="py-2.5 px-4 text-xs font-bold text-zinc-800 border-r border-zinc-200">Crop Class</th>
                <th className="py-2.5 px-4 text-xs font-bold text-zinc-800 text-center border-r border-zinc-200">Test Support</th>
                <th className="py-2.5 px-4 text-xs font-bold text-emerald-800 text-center border-r border-zinc-200 bg-emerald-50/50">TP (Correct)</th>
                <th className="py-2.5 px-4 text-xs font-bold text-rose-800 text-center border-r border-zinc-200 bg-rose-50/50">FP (False Pos)</th>
                <th className="py-2.5 px-4 text-xs font-bold text-amber-800 text-center border-r border-zinc-200 bg-amber-50/50">FN (False Neg)</th>
                <th className="py-2.5 px-4 text-xs font-bold text-sky-800 text-center border-r border-zinc-200 bg-sky-50/50">Class Precision</th>
                <th className="py-2.5 px-4 text-xs font-bold text-teal-800 text-center border-r border-zinc-200 bg-teal-50/50">Class Recall</th>
                <th className="py-2.5 px-4 text-xs font-bold text-purple-800 text-center bg-purple-50/50">Class F1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white text-xs">
              {activeModel.perClassMetrics
                .filter((m) => !searchQuery || m.className.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                .map((metric) => {
                  const isPerfect = metric.fp === 0 && metric.fn === 0;
                  const isSelected = selectedCrop === metric.className;

                  return (
                    <tr
                      key={metric.className}
                      onClick={() => setSelectedCrop(isSelected ? null : metric.className)}
                      className={`cursor-pointer transition-colors border-b border-zinc-100 ${
                        isSelected
                          ? 'bg-emerald-50/80 font-semibold'
                          : isPerfect
                          ? 'hover:bg-zinc-50'
                          : 'bg-rose-50/40 hover:bg-rose-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold capitalize flex items-center gap-2 border-r border-zinc-200">
                        {!isPerfect ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span>{metric.className}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-zinc-600 border-r border-zinc-200">{metric.support}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-800 border-r border-zinc-200 bg-emerald-50/20">{metric.tp}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-800 border-r border-zinc-200 bg-rose-50/20">
                        {metric.fp > 0 ? `+${metric.fp}` : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-800 border-r border-zinc-200 bg-amber-50/20">
                        {metric.fn > 0 ? `-${metric.fn}` : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-sky-800 border-r border-zinc-200 bg-sky-50/20">
                        {(metric.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-teal-800 border-r border-zinc-200 bg-teal-50/20">
                        {(metric.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-purple-800 bg-purple-50/20">
                        {(metric.f1 * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Crop Deep-Dive Diagnostic Panel */}
      {selectedCrop && selectedCropMetric && (
        <div className="p-5 rounded-xl bg-emerald-50/90 border-2 border-emerald-300 shadow-2xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h4 className="text-sm font-bold text-emerald-950 capitalize">
                Diagnostic Focus: <span className="font-mono">{selectedCrop}</span>
              </h4>
            </div>
            <button
              onClick={() => setSelectedCrop(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold px-2 py-0.5 rounded bg-emerald-200/70 border border-emerald-300 cursor-pointer"
            >
              Clear Focus ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border-2 border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">True Positives</span>
              <strong className="text-base text-emerald-900 block font-mono">{selectedCropMetric.tp} / {selectedCropMetric.support}</strong>
            </div>
            <div className="p-3 bg-white rounded-lg border-2 border-rose-200 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">False Positives (FP)</span>
              <strong className="text-base text-rose-800 block font-mono">{selectedCropMetric.fp}</strong>
            </div>
            <div className="p-3 bg-white rounded-lg border-2 border-sky-200 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Precision</span>
              <strong className="text-base text-sky-800 block font-mono">
                {(selectedCropMetric.precision * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="p-3 bg-white rounded-lg border-2 border-amber-200 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Recall (Sensitivity)</span>
              <strong className="text-base text-amber-800 block font-mono">
                {(selectedCropMetric.recall * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

          {selectedCropErrors.length > 0 ? (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-zinc-800 block">Associated Classification Overlaps:</span>
              {selectedCropErrors.map((err, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-white border-2 border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-zinc-900 capitalize font-mono">{err.actual}</span>
                    <span className="text-zinc-400 mx-1.5">misclassified as</span>
                    <span className="font-bold text-rose-700 capitalize font-mono">{err.predicted}</span>
                    <span className="text-zinc-600 text-[11px] block mt-0.5">
                      Closest features: {formatSimilarFeatures(err.similarFeatures)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px] border border-rose-200">
                      {err.count} sample{err.count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-950 text-xs flex items-center gap-2 border border-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Perfect 100% precision and recall across all test instances for {selectedCrop}.</span>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Error Breakdown & Real Feature-Similarity Diagnostics */}
      {activeModel.errors.length > 0 && (
        <div className="p-5 rounded-2xl bg-zinc-50 border-2 border-zinc-300 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-zinc-900">
                {displayModelName(selectedModelKey)} — Misclassification Diagnostics ({activeModel.errors.length} Inter-Class Overlaps)
              </h4>
            </div>
            <span className="text-xs text-zinc-600 font-mono font-semibold">
              {activeModel.errorCount} total errors out of {activeModel.totalSamples} samples
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeModel.errors.map((err, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border-2 border-zinc-200 hover:border-amber-400 shadow-2xs transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                    <span className="text-zinc-800 capitalize">{err.actual}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-rose-700 capitalize">{err.predicted}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                    {err.count} Error{err.count > 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  Real per-class feature means show these two crops are most similar in:
                </p>

                <div className="p-2 rounded bg-zinc-50 text-[10px] font-mono text-zinc-600 border border-zinc-200">
                  {formatSimilarFeatures(err.similarFeatures)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
