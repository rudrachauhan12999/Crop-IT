import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { PcaDataPoint, KMeansCluster } from '../types/ml';
import { HelpCircle } from 'lucide-react';

interface PcaPlotProps {
  data?: PcaDataPoint[];
  clusters?: KMeansCluster[];
  colorBy?: 'cluster' | 'category';
}

const DYNAMIC_CLUSTER_COLORS = [
  '#059669', // 0: Emerald
  '#dc2626', // 1: Crimson Red
  '#d97706', // 2: Amber
  '#2563eb', // 3: Royal Blue
  '#7c3aed', // 4: Violet / Purple
  '#0891b2', // 5: Cyan / Teal
  '#db2777', // 6: Pink / Magenta
  '#ea580c', // 7: Burnt Orange
  '#4f46e5', // 8: Indigo
  '#65a30d', // 9: Lime / Olive
];

export const getClusterColor = (clusterId: number | undefined | null): string => {
  if (clusterId === undefined || clusterId === null || isNaN(Number(clusterId))) {
    return '#64748b';
  }
  const idx = Math.floor(Number(clusterId));
  if (idx >= 0 && idx < DYNAMIC_CLUSTER_COLORS.length) {
    return DYNAMIC_CLUSTER_COLORS[idx];
  }
  const hue = (Math.abs(idx) * 137.5) % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

export const PcaPlot: React.FC<PcaPlotProps> = ({ data = [], clusters = [] }) => {
  const [selectedCluster, setSelectedCluster] = useState<number | 'all'>('all');

  // Defensive array fallback
  const points: PcaDataPoint[] = Array.isArray(data) ? data : [];

  // Dynamically derive cluster IDs from actual PCA data and cluster definitions
  const derivedFromPoints = points
    .map((p) => p?.cluster)
    .filter((c): c is number => typeof c === 'number' && !isNaN(c));

  const derivedFromClusters = Array.isArray(clusters)
    ? clusters
        .map((c) => c?.clusterId)
        .filter((c): c is number => typeof c === 'number' && !isNaN(c))
    : [];

  const clusterIds: number[] = Array.from(
    new Set([...derivedFromPoints, ...derivedFromClusters])
  ).sort((a, b) => a - b);

  // Filtered dataset for active cluster selection
  const filteredData = selectedCluster === 'all'
    ? points
    : points.filter((d) => d?.cluster === selectedCluster);

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            PCA 2D Dimensionality Reduction (PC1 vs PC2)
          </h3>
          <p className="text-xs text-zinc-500">
            Projecting 7-dimensional soil &amp; climate feature space into 2 principal components
          </p>
        </div>

        {/* Dynamic Cluster Filter Buttons */}
        {clusterIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-300">
            <button
              onClick={() => setSelectedCluster('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                selectedCluster === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-950 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              All Clusters ({points.length})
            </button>
            {clusterIds.map((cId) => (
              <button
                key={cId}
                onClick={() => setSelectedCluster(cId)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  selectedCluster === cId
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-emerald-900 border-zinc-300 hover:bg-emerald-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: getClusterColor(cId) }}
                ></span>
                <span>Cluster {cId}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {points.length === 0 ? (
        <div className="h-80 w-full p-6 bg-zinc-50/50 rounded-xl border-2 border-zinc-200 flex flex-col items-center justify-center text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700">No PCA cluster data is available.</p>
          <p className="text-xs text-zinc-500">The PCA dimensionality reduction dataset was not returned by the backend.</p>
        </div>
      ) : (
        <div className="h-80 w-full p-2 bg-zinc-50/50 rounded-xl border-2 border-zinc-200">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="pc1"
                name="PC1"
                domain={['auto', 'auto']}
                tick={{ fill: '#475569', fontSize: 11 }}
                label={{
                  value: 'Principal Component 1 (Nutrient Axis: P, K vs N)',
                  position: 'bottom',
                  offset: 5,
                  fill: '#475569',
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="pc2"
                name="PC2"
                domain={['auto', 'auto']}
                tick={{ fill: '#475569', fontSize: 11 }}
                label={{
                  value: 'Principal Component 2 (Climate Axis: Rain, Humidity)',
                  angle: -90,
                  position: 'left',
                  offset: 0,
                  fill: '#475569',
                  fontSize: 11,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as PcaDataPoint;
                    if (!pt) return null;
                    const cId = pt.cluster ?? 0;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-lg border-2 border-zinc-300 text-xs space-y-1">
                        <div className="font-bold text-zinc-900 uppercase tracking-wide flex items-center justify-between gap-3">
                          <span>{pt.crop || 'Crop Sample'}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] text-white font-medium"
                            style={{ backgroundColor: getClusterColor(cId) }}
                          >
                            Cluster {cId}
                          </span>
                        </div>
                        <div className="text-zinc-600">
                          PC1: <strong className="text-zinc-900">{typeof pt.pc1 === 'number' ? pt.pc1.toFixed(2) : pt.pc1}</strong> | PC2: <strong className="text-zinc-900">{typeof pt.pc2 === 'number' ? pt.pc2.toFixed(2) : pt.pc2}</strong>
                        </div>
                        <div className="text-zinc-500 text-[11px] pt-1 border-t border-zinc-100">
                          N: {pt.n ?? 0} | P: {pt.p ?? 0} | K: {pt.k ?? 0} | Rain: {pt.rainfall ?? 0}mm
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Crop Samples" data={filteredData}>
                {filteredData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry?.id ?? index}`}
                    fill={getClusterColor(entry?.cluster)}
                    fillOpacity={0.85}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dynamic Cluster Legend & Agronomic Summary */}
      {clusterIds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 pt-4 border-t-2 border-zinc-200 text-xs">
          {clusterIds.map((cId) => {
            const clusterInfo = Array.isArray(clusters) ? clusters.find((c) => c?.clusterId === cId) : undefined;
            const labelTitle = clusterInfo?.clusterName
              ? `Cluster ${cId}: ${clusterInfo.clusterName}`
              : clusterInfo?.clusterTheme
              ? `Cluster ${cId}: ${clusterInfo.clusterTheme}`
              : `Cluster ${cId} (${points.filter((p) => p?.cluster === cId).length} samples)`;

            const cropsList = Array.isArray(clusterInfo?.representativeCrops) && clusterInfo!.representativeCrops.length > 0
              ? clusterInfo!.representativeCrops.slice(0, 4).join(', ')
              : '';

            return (
              <div key={cId} className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 border-2 border-zinc-200 shadow-2xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: getClusterColor(cId) }}
                ></span>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-zinc-800 font-semibold text-[11px] leading-tight block truncate">
                    {labelTitle}
                  </span>
                  {cropsList && (
                    <span className="text-zinc-500 text-[10px] leading-tight block truncate capitalize">
                      {cropsList}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
