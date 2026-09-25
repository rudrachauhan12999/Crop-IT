import React, { useState } from 'react';

interface CorrelationHeatmapProps {
  features: string[];
  matrix: number[][];
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  features,
  matrix
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ f1: string; f2: string; val: number } | null>(null);

  // Helper to color cells based on Pearson correlation (-1 to +1)
  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-emerald-600 text-white font-bold';
    if (val > 0.6) return 'bg-emerald-500 text-white font-semibold';
    if (val > 0.3) return 'bg-emerald-200 text-emerald-950 font-medium';
    if (val > 0.1) return 'bg-emerald-100/70 text-emerald-900';
    if (val > -0.1) return 'bg-zinc-50 text-zinc-600';
    if (val > -0.3) return 'bg-amber-100 text-amber-950';
    return 'bg-amber-300 text-amber-950 font-semibold';
  };

  const featureLabels: Record<string, string> = {
    N: 'Nitrogen (N)',
    P: 'Phosphorus (P)',
    K: 'Potassium (K)',
    temperature: 'Temp (°C)',
    humidity: 'Humidity (%)',
    ph: 'Soil pH',
    rainfall: 'Rainfall (mm)'
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Feature Correlation Matrix (Pearson r)</h3>
          <p className="text-xs text-zinc-500">Pairwise linear correlation coefficients between 7 soil and climate variables</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            Positive r
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-zinc-200 inline-block border border-zinc-300"></span>
            Near Zero
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-300 inline-block border border-amber-400"></span>
            Negative r
          </span>
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto rounded-xl border-2 border-zinc-300 p-2 bg-zinc-50/60 shadow-2xs">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2.5 text-xs font-bold text-zinc-600 text-left border-b border-zinc-200">Feature</th>
              {features.map((f) => (
                <th key={f} className="p-2.5 text-xs font-bold text-zinc-800 whitespace-nowrap border-b border-zinc-200">
                  {featureLabels[f] || f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => {
              const f1 = features[rowIndex];
              return (
                <tr key={f1}>
                  <td className="p-2 text-xs font-bold text-zinc-800 text-left whitespace-nowrap">
                    {featureLabels[f1] || f1}
                  </td>
                  {row.map((val, colIndex) => {
                    const f2 = features[colIndex];
                    return (
                      <td
                        key={f2}
                        onMouseEnter={() => setHoveredCell({ f1, f2, val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`p-2.5 text-xs font-mono transition-colors rounded-lg cursor-pointer border border-white/60 ${getCellColor(val)} ${
                          hoveredCell?.f1 === f1 && hoveredCell?.f2 === f2
                            ? 'ring-2 ring-emerald-700 ring-offset-1 z-10'
                            : ''
                        }`}
                      >
                        {val.toFixed(3)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dynamic Explanation of Hovered Correlation */}
      <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/90 border-2 border-emerald-300 text-xs text-zinc-800 flex items-center justify-between shadow-2xs">
        {hoveredCell ? (
          <div>
            <strong>Correlation between {featureLabels[hoveredCell.f1]} &amp; {featureLabels[hoveredCell.f2]}:</strong>{' '}
            <span className="font-semibold text-emerald-950">{hoveredCell.val.toFixed(3)}</span>
            {hoveredCell.val > 0.7 && ' — Strong positive collinearity (e.g. Phosphorus & Potassium fruit enrichment)'}
            {hoveredCell.val < -0.2 && ' — Moderate negative correlation (e.g. high nitrogen crops vs dryland phosphorus)'}
            {Math.abs(hoveredCell.val) < 0.1 && ' — Virtually independent features, providing orthogonal information to classifiers'}
          </div>
        ) : (
          <div className="text-zinc-600 italic">
            Key Insight: Phosphorus (P) and Potassium (K) exhibit strong positive correlation (r = 0.736), characteristic of fruit crops like Apple &amp; Grapes.
          </div>
        )}
      </div>
    </div>
  );
};
