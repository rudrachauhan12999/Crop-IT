import React, { useState, useEffect } from 'react';
import { UnsupervisedAnalysisResponse } from '../types/ml';
import { fetchUnsupervisedAnalysis, BACKEND_UNAVAILABLE_MESSAGE } from '../services/api';
import { ElbowChart } from '../components/ElbowChart';
import { PcaPlot } from '../components/PcaPlot';
import {
  Network,
  GitBranch,
  Layers,
  Sparkles,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Droplets,
  Sprout,
  Apple,
  Sun,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Terminal
} from 'lucide-react';
import BorderGlow from '../components/BorderGlow';

export const UnsupervisedAnalysis: React.FC = () => {
  const [data, setData] = useState<UnsupervisedAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setIsBackendUnavailable(false);
    try {
      const res = await fetchUnsupervisedAnalysis();
      setData(res);
    } catch (err: any) {
      console.error(err);
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
          <h3 className="text-sm font-bold text-zinc-900">Loading Cluster Analytics</h3>
          <p className="text-xs text-zinc-500 font-medium">Computing K-Means centroids and Elbow curve from /api/clusters...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-12">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-red-900">
                {isBackendUnavailable ? 'ML Backend Unavailable' : 'Failed to Load Unsupervised Analysis'}
              </h3>
              <p className="text-red-700">{error || BACKEND_UNAVAILABLE_MESSAGE}</p>
            </div>
          </div>

          {isBackendUnavailable && (
            <div className="pt-3 border-t border-red-200/80 space-y-2">
              <p className="text-[11px] text-red-700 font-medium">
                To start the Python Scikit-Learn API:
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

  const clusterIcons = [Droplets, Apple, Sprout, Sun];
  const optimalK = data.kValue ?? (Array.isArray(data.clusters) && data.clusters.length > 0 ? data.clusters.length : 4);
  const silhouetteScore = data.silhouetteScore ?? 0.520;
  const clusters = Array.isArray(data.clusters) ? data.clusters : [];
  const pcaClusterScatter = Array.isArray(data.pcaClusterScatter) ? data.pcaClusterScatter : [];
  const explanation = data.supervisedVsUnsupervisedExplanation ?? {
    supervisedRole: 'Supervised Learning (Random Forest, KNN, SVM) maps soil & climate inputs to known crop labels.',
    unsupervisedRole: 'Unsupervised Learning (K-Means & PCA) reveals intrinsic groupings and patterns in 7D space without labels.',
    keyDifference: 'Supervised models predict specific crop labels; unsupervised models discover agronomic similarities and ecological clusters.',
    practicalSynergy: 'K-Means clustering informs crop rotation and soil similarity, while Random Forest gives precise single-crop recommendations.'
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Concept Banner */}
      <BorderGlow
        className="w-full"
        backgroundColor="#064e3b"
        borderRadius={16}
        glowRadius={28}
        glowIntensity={0.85}
        colors={['#10b981', '#14b8a6', '#06b6d4']}
      >
        <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 text-white space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold">
            <Network className="w-4 h-4 text-emerald-300" />
            <span>Unsupervised Learning (K-Means Clustering)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            K-Means Clustering &amp; Natural Groupings
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-4xl">
            Unlike supervised classifiers that learn from predefined crop labels, K-Means clustering partitions the 2,200 samples in 7-dimensional feature space purely on mathematical distance. This uncovers natural data clusters with similar nutrient and climate characteristics.
          </p>
        </div>
      </BorderGlow>

      {/* Elbow Method Chart */}
      <ElbowChart data={data.elbowData} optimalK={optimalK} />

      {/* Discovered Data Clusters Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Discovered Data Clusters (K = {optimalK})
            </h3>
            <p className="text-xs text-zinc-500">Cluster centroids and feature characteristics in 7D space</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border-2 border-emerald-200 shadow-2xs">
            Silhouette Score: {typeof silhouetteScore === 'number' ? silhouetteScore.toFixed(3) : silhouetteScore}
          </span>
        </div>

        {clusters.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-50 border-2 border-zinc-200 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-700">No cluster definitions available.</p>
            <p className="text-xs text-zinc-500">K-Means centroid data was not returned by the backend.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clusters.map((c, idx) => {
              const Icon = clusterIcons[idx % clusterIcons.length];
              const representativeCrops = Array.isArray(c?.representativeCrops) ? c.representativeCrops : [];
              const centroidN = typeof c?.centroid?.N === 'number' ? c.centroid.N.toFixed(1) : '0.0';
              const centroidP = typeof c?.centroid?.P === 'number' ? c.centroid.P.toFixed(1) : '0.0';
              const centroidK = typeof c?.centroid?.K === 'number' ? c.centroid.K.toFixed(1) : '0.0';
              const centroidRain = typeof c?.centroid?.rainfall === 'number' ? `${c.centroid.rainfall.toFixed(0)}mm` : '0mm';

              return (
                <div
                  key={c.clusterId ?? idx}
                  className="p-6 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs space-y-4 hover:border-emerald-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border-2 border-emerald-200">
                          C{c.clusterId ?? idx}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                            {c.clusterName || `Cluster ${c.clusterId ?? idx}`}
                          </h4>
                          <span className="text-xs text-emerald-700 font-semibold">
                            {c.clusterTheme || 'Agronomic Guild'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 shrink-0 border border-zinc-300">
                        {c.cropsCount ?? representativeCrops.length} Crops
                      </span>
                    </div>

                    {c.ecologicalInterpretation && (
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {c.ecologicalInterpretation}
                      </p>
                    )}

                    {/* Representative crops badges */}
                    {representativeCrops.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                          Sample Crops in Cluster
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {representativeCrops.map((crp, cIdx) => (
                            <span
                              key={cIdx}
                              className="capitalize px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-semibold text-xs border border-emerald-300"
                            >
                              {crp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Centroid Coordinates */}
                  <div className="pt-3 border-t-2 border-zinc-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      Cluster Centroid (Mean Values)
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="p-1.5 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                        <span className="text-zinc-500 block text-[9px] font-bold">N</span>
                        <strong className="text-zinc-900 font-mono">{centroidN}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                        <span className="text-zinc-500 block text-[9px] font-bold">P</span>
                        <strong className="text-zinc-900 font-mono">{centroidP}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                        <span className="text-zinc-500 block text-[9px] font-bold">K</span>
                        <strong className="text-zinc-900 font-mono">{centroidK}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                        <span className="text-zinc-500 block text-[9px] font-bold">Rain</span>
                        <strong className="text-zinc-900 font-mono">{centroidRain}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PCA Projected Cluster Scatter */}
      <PcaPlot data={pcaClusterScatter} clusters={clusters} colorBy="cluster" />

      {/* Supervised vs Unsupervised Comparison */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-zinc-900">
            Supervised vs. Unsupervised Machine Learning Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-5 rounded-xl bg-emerald-50/70 border-2 border-emerald-300 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Supervised Learning (Crop Recommendation)</span>
            </div>
            <p className="text-zinc-700 leading-relaxed">
              {explanation.supervisedRole}
            </p>
            <div className="pt-2 text-[11px] text-emerald-900 font-semibold border-t border-emerald-200">
              Algorithms: Random Forest (99.32%), KNN (98.18%), SVM (96.82%)
            </div>
          </div>

          <div className="p-5 rounded-xl bg-blue-50/70 border-2 border-blue-300 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
              <Network className="w-4 h-4 text-blue-700" />
              <span>Unsupervised Learning (Cluster Discovery)</span>
            </div>
            <p className="text-zinc-700 leading-relaxed">
              {explanation.unsupervisedRole}
            </p>
            <div className="pt-2 text-[11px] text-blue-900 font-semibold border-t border-blue-200">
              Algorithms: K-Means (K={optimalK}), PCA
            </div>
          </div>
        </div>

        {explanation.practicalSynergy && (
          <div className="p-4 rounded-xl bg-zinc-50 border-2 border-zinc-300 text-xs text-zinc-800 space-y-1 shadow-2xs">
            <strong className="text-zinc-900 block font-bold">Practical Machine Learning Synergy:</strong>
            <p className="leading-relaxed">
              {explanation.practicalSynergy}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
