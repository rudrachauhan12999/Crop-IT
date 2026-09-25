import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { ModelMetric } from '../types/ml';
import { Award, CheckCircle2, TrendingUp, BarChart3, Layers, Sparkles, Activity } from 'lucide-react';
import BorderGlow from './BorderGlow';

/** Presentation-only label/color mapping for the backend's internal model keys. Not ML data. */
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  random_forest: 'Random Forest',
  knn: 'KNN',
  svm: 'SVM'
};
const MODEL_COLORS: Record<string, string> = {
  random_forest: '#059669',
  knn: '#0284c7',
  svm: '#7c3aed'
};

interface MetricChartsProps {
  models: ModelMetric[];
  testSampleCount: number;
}

export const MetricCharts: React.FC<MetricChartsProps> = ({ models, testSampleCount }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'grouped' | 'detail'>('leaderboard');
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'precision' | 'recall' | 'f1'>('accuracy');

  const chartData = models.map((m) => ({
    key: m.model,
    name: MODEL_DISPLAY_NAMES[m.model] ?? m.model,
    fullName: MODEL_DISPLAY_NAMES[m.model] ?? m.model,
    Accuracy: Number((m.accuracy * 100).toFixed(2)),
    Precision: Number((m.precision * 100).toFixed(2)),
    Recall: Number((m.recall * 100).toFixed(2)),
    'F1-Score': Number((m.f1 * 100).toFixed(2)),
    errors: Math.round(testSampleCount * (1 - m.accuracy)),
    correct: Math.round(testSampleCount * m.accuracy),
    color: MODEL_COLORS[m.model] ?? '#52525b',
  }));

  const topModel = [...chartData].sort((a, b) => b.Accuracy - a.Accuracy)[0];
  const runnerUp = [...chartData].sort((a, b) => b.Accuracy - a.Accuracy)[1];
  const accuracyLead = topModel && runnerUp ? (topModel.Accuracy - runnerUp.Accuracy).toFixed(2) : null;
  const minAccuracy = chartData.length > 0 ? Math.min(...chartData.map((m) => m.Accuracy)) : null;

  const metricDescriptions = {
    accuracy: { label: 'Accuracy', desc: 'Overall percentage of correct crop classifications out of 440 test samples.' },
    precision: { label: 'Precision', desc: 'Ability of the model to avoid false positives for any given crop.' },
    recall: { label: 'Recall', desc: 'Ability of the model to find all positive instances of each crop.' },
    f1: { label: 'F1-Score', desc: 'Harmonic mean of precision and recall for balanced performance.' },
  };

  return (
    <div className="space-y-6">
      {/* Interactive Graph & Comparison Card */}
      <BorderGlow
        className="w-full"
        backgroundColor="#ffffff"
        borderRadius={20}
        glowRadius={28}
        glowIntensity={0.8}
        colors={['#10b981', '#06b6d4', '#8b5cf6']}
      >
        <div className="p-6 sm:p-7 space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-zinc-900">Model Performance &amp; Evaluation</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Evaluation on {testSampleCount} stratified test samples
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-300 self-start md:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'bg-white text-emerald-800 border-emerald-300 shadow-xs'
                    : 'text-zinc-600 border-transparent hover:text-zinc-900'
                }`}
              >
                Leaderboard View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('grouped')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === 'grouped'
                    ? 'bg-white text-emerald-800 border-emerald-300 shadow-xs'
                    : 'text-zinc-600 border-transparent hover:text-zinc-900'
                }`}
              >
                Grouped Bar Chart
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === 'detail'
                    ? 'bg-white text-emerald-800 border-emerald-300 shadow-xs'
                    : 'text-zinc-600 border-transparent hover:text-zinc-900'
                }`}
              >
                Metric Breakdown Table
              </button>
            </div>
          </div>

          {/* TAB 1: Clean, Intuitive Leaderboard View */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              {/* Metric focus toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-600 font-medium">Ranked by:</span>
                <div className="flex items-center gap-1.5">
                  {(['accuracy', 'precision', 'recall', 'f1'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMetric(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                        selectedMetric === key
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      {key === 'f1' ? 'F1-Score' : key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Models Comparison Progress Bars with Clear Deltas */}
              <div className="space-y-4">
                {chartData
                  .sort((a, b) => {
                    const keyMap = {
                      accuracy: 'Accuracy',
                      precision: 'Precision',
                      recall: 'Recall',
                      f1: 'F1-Score',
                    } as const;
                    const prop = keyMap[selectedMetric];
                    return b[prop] - a[prop];
                  })
                  .map((model, idx) => {
                    const val =
                      selectedMetric === 'accuracy'
                        ? model.Accuracy
                        : selectedMetric === 'precision'
                        ? model.Precision
                        : selectedMetric === 'recall'
                        ? model.Recall
                        : model['F1-Score'];

                    const isTop = idx === 0;

                    return (
                      <div
                        key={model.key}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isTop
                            ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                            : 'bg-zinc-50/80 border-zinc-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                idx === 0
                                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                                  : idx === 1
                                  ? 'bg-zinc-300 text-zinc-800'
                                  : 'bg-amber-700/20 text-amber-900'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-sm font-bold text-zinc-900">{model.fullName}</span>
                              {isTop && (
                                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                  <Award className="w-3 h-3 text-emerald-700" /> Best Overall
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500 font-mono">
                              {model.correct} / {testSampleCount} Correct ({model.errors} {model.errors === 1 ? 'error' : 'errors'})
                            </span>
                            <span
                              className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg ${
                                isTop ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-white'
                              }`}
                            >
                              {val.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Track Meter */}
                        <div className="w-full bg-zinc-200/80 rounded-full h-3 overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isTop
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                : idx === 1
                                ? 'bg-gradient-to-r from-sky-500 to-sky-600'
                                : 'bg-gradient-to-r from-purple-500 to-purple-600'
                            }`}
                            style={{ width: `${val}%` }}
                          />
                        </div>

                        {/* Metric Sub-bar details */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 font-mono">
                          <span>Accuracy: <strong className="text-zinc-800">{model.Accuracy}%</strong></span>
                          <span>Precision: <strong className="text-zinc-800">{model.Precision}%</strong></span>
                          <span>Recall: <strong className="text-zinc-800">{model.Recall}%</strong></span>
                          <span>F1-Score: <strong className="text-zinc-800">{model['F1-Score']}%</strong></span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Informational Key Takeaway */}
              {topModel && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-start gap-2.5 text-xs text-emerald-950 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Statistical Finding:</strong> {topModel.fullName} has the highest test-set accuracy at {topModel.Accuracy}%
                    {runnerUp && accuracyLead && Number(accuracyLead) > 0
                      ? `, ${accuracyLead} percentage points ahead of the next-best model (${runnerUp.fullName}).`
                      : '.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Grouped Bar Chart with Clean Spacing & Baseline */}
          {activeTab === 'grouped' && (
            <div className="space-y-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    barGap={6}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                      axisLine={{ stroke: '#94a3b8' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 80, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#94a3b8' }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1.5px solid #475569',
                        color: '#ffffff',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                      }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value: any) => [`${value}%`]}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="Accuracy" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Precision" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Recall" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="F1-Score" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-600 px-2 py-1 bg-zinc-50 rounded-lg border border-zinc-200">
                <span>Baseline benchmark threshold: <strong>80.0%</strong></span>
                {minAccuracy !== null && (
                  <span className="font-mono">
                    {minAccuracy >= 80
                      ? `All ${chartData.length} models exceed benchmark by > ${(minAccuracy - 80).toFixed(1)}%`
                      : `Lowest model is ${(80 - minAccuracy).toFixed(1)}% below benchmark`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Comprehensive Metrics Table */}
          {activeTab === 'detail' && (
            <div className="overflow-x-auto rounded-xl border-2 border-zinc-300 shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-zinc-100/90 text-zinc-800 font-bold border-b-2 border-zinc-300">
                  <tr>
                    <th className="p-3 border-r border-zinc-200">Rank &amp; Algorithm</th>
                    <th className="p-3 border-r border-zinc-200 text-emerald-800 bg-emerald-50/50">Accuracy</th>
                    <th className="p-3 border-r border-zinc-200 text-sky-800 bg-sky-50/50">Precision (Weighted)</th>
                    <th className="p-3 border-r border-zinc-200 text-amber-800 bg-amber-50/50">Recall (Weighted)</th>
                    <th className="p-3 border-r border-zinc-200 text-purple-800 bg-purple-50/50">F1-Score</th>
                    <th className="p-3 text-zinc-800">Test Errors (N={testSampleCount})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white font-mono">
                  {[...chartData].sort((a, b) => b.Accuracy - a.Accuracy).map((m, idx) => (
                    <tr key={m.key} className={idx === 0 ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-zinc-50'}>
                      <td className="p-3 font-sans text-zinc-900 flex items-center gap-2 border-r border-zinc-200">
                        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                        <span className="font-bold">{m.fullName}</span>
                      </td>
                      <td className="p-3 text-emerald-800 font-bold border-r border-zinc-200 bg-emerald-50/30">{m.Accuracy}%</td>
                      <td className="p-3 text-sky-800 border-r border-zinc-200 bg-sky-50/30">{m.Precision}%</td>
                      <td className="p-3 text-amber-800 border-r border-zinc-200 bg-amber-50/30">{m.Recall}%</td>
                      <td className="p-3 text-purple-800 border-r border-zinc-200 bg-purple-50/30">{m['F1-Score']}%</td>
                      <td className="p-3 text-zinc-700">
                        {m.errors} / {testSampleCount} ({testSampleCount > 0 ? ((m.errors / testSampleCount) * 100).toFixed(2) : '0.00'}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </BorderGlow>
    </div>
  );
};
