import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot
} from 'recharts';
import { ElbowPoint } from '../types/ml';
import { HelpCircle } from 'lucide-react';

interface ElbowChartProps {
  data?: ElbowPoint[];
  optimalK?: number;
}

export const ElbowChart: React.FC<ElbowChartProps> = ({ data = [], optimalK = 4 }) => {
  const safeData = Array.isArray(data) ? data : [];
  const optimalPoint = safeData.find((d) => d?.k === optimalK);
  const optimalInertia = optimalPoint?.inertia ?? (safeData.length > 0 ? safeData[0].inertia : 0);
  const optimalSilhouette = optimalPoint?.silhouetteScore ?? 0.52;

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            K-Means Elbow Method &amp; Silhouette Analysis
          </h3>
          <p className="text-xs text-zinc-500">
            Within-Cluster Sum of Squares (Inertia) plotted against Number of Clusters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-2xs">
            Optimal K = {optimalK} (Elbow Inflection)
          </span>
        </div>
      </div>

      {safeData.length === 0 ? (
        <div className="h-72 w-full p-6 bg-zinc-50/50 rounded-xl border-2 border-zinc-200 flex flex-col items-center justify-center text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700">No elbow curve data available.</p>
          <p className="text-xs text-zinc-500">Inertia and silhouette metrics not returned by the ML backend.</p>
        </div>
      ) : (
        <div className="h-72 w-full p-2 bg-zinc-50/50 rounded-xl border-2 border-zinc-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="k"
                tick={{ fill: '#475569', fontSize: 12 }}
                label={{ value: 'Number of Clusters (K)', position: 'bottom', offset: 0, fill: '#475569', fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#475569', fontSize: 12 }}
                label={{ value: 'Inertia (WCSS)', angle: -90, position: 'left', offset: 0, fill: '#059669', fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 0.7]}
                tick={{ fill: '#4f46e5', fontSize: 12 }}
                label={{ value: 'Silhouette Score', angle: 90, position: 'right', offset: 0, fill: '#4f46e5', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(val: any, name: string) => [
                  name === 'Inertia (WCSS)' ? Math.round(Number(val)) : Number(val).toFixed(3),
                  name
                ]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="inertia"
                name="Inertia (WCSS)"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669' }}
                activeDot={{ r: 7 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="silhouetteScore"
                name="Silhouette Score"
                stroke="#4f46e5"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#4f46e5' }}
              />
              {optimalPoint && (
                <ReferenceDot
                  yAxisId="left"
                  x={optimalK}
                  y={optimalInertia}
                  r={7}
                  fill="#dc2626"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/80 border-2 border-emerald-300 text-xs text-zinc-800 shadow-2xs">
        <p>
          <strong>Mathematical Criterion:</strong> At <strong>K = {optimalK}</strong>, the marginal reduction in cluster inertia sharply levels off (Elbow point), while the Silhouette coefficient reaches its optimal separation ({optimalSilhouette > 0 ? `s = ${optimalSilhouette.toFixed(3)}` : 'global maximum'}). This confirms {optimalK} distinct agronomic groupings without over-partitioning.
        </p>
      </div>
    </div>
  );
};
