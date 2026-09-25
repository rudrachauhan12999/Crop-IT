import React, { useState, useEffect, useRef } from 'react';
import { DatasetAnalysisResponse, FeatureStat, CropDistributionItem } from '../types/ml';
import { fetchDatasetAnalysis, BACKEND_UNAVAILABLE_MESSAGE } from '../services/api';
import { CorrelationHeatmap } from '../components/CorrelationHeatmap';
import { PcaPlot } from '../components/PcaPlot';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  RefreshCw,
  Search,
  Sliders,
  CheckCircle,
  FileText,
  Terminal
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

export const DatasetAnalysis: React.FC = () => {
  const [data, setData] = useState<DatasetAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom uploaded dataset state
  const [isCustomUploaded, setIsCustomUploaded] = useState(false);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [customStats, setCustomStats] = useState<{
    totalSamples: number;
    featuresCount: number;
    classesCount: number;
    missingValues: number;
    duplicateRows: number;
    targetColumn: string;
    features: FeatureStat[];
    cropDistribution: CropDistributionItem[];
  } | null>(null);

  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDefaultData = async () => {
    setLoading(true);
    setError(null);
    setIsBackendUnavailable(false);
    try {
      const res = await fetchDatasetAnalysis();
      setData(res);
      setIsCustomUploaded(false);
      setCustomStats(null);
      setCustomFileName('');
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
    loadDefaultData();
  }, []);

  // Parse uploaded CSV and dynamically calculate missing values, duplicates, and stats
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('CSV file must have a header row and at least one data row.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const rowStrings = lines.slice(1);
        
        let missingCount = 0;
        const rowSet = new Set<string>();
        let duplicateCount = 0;

        const parsedRows: Record<string, any>[] = [];

        rowStrings.forEach((rowStr) => {
          // Check duplicates
          if (rowSet.has(rowStr.trim())) {
            duplicateCount++;
          } else {
            rowSet.add(rowStr.trim());
          }

          const cols = rowStr.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, any> = {};

          headers.forEach((h, idx) => {
            const rawVal = cols[idx];
            if (rawVal === undefined || rawVal === '' || rawVal === 'null' || rawVal === 'NaN' || rawVal === 'NA') {
              missingCount++;
              rowObj[h] = null;
            } else {
              const num = Number(rawVal);
              rowObj[h] = isNaN(num) ? rawVal : num;
            }
          });

          parsedRows.push(rowObj);
        });

        // Detect numeric columns vs target column
        const targetColCandidate = headers.find((h) => ['label', 'crop', 'target', 'class'].includes(h.toLowerCase())) || headers[headers.length - 1];
        const numericCols = headers.filter((h) => {
          if (h === targetColCandidate) return false;
          const firstNonEmpty = parsedRows.find((r) => r[h] !== null);
          return firstNonEmpty && typeof firstNonEmpty[h] === 'number';
        });

        // Compute feature stats for numeric cols
        const computedFeatures: FeatureStat[] = numericCols.map((col) => {
          const vals = parsedRows.map((r) => r[col]).filter((v) => typeof v === 'number') as number[];
          vals.sort((a, b) => a - b);
          const count = vals.length || 1;
          const min = vals.length > 0 ? vals[0] : 0;
          const max = vals.length > 0 ? vals[vals.length - 1] : 0;
          const sum = vals.reduce((acc, v) => acc + v, 0);
          const mean = sum / count;
          const median = vals[Math.floor(vals.length / 2)] || 0;
          const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
          const std = Math.sqrt(variance);
          const q25 = vals[Math.floor(vals.length * 0.25)] || min;
          const q75 = vals[Math.floor(vals.length * 0.75)] || max;

          return {
            feature: col,
            name: col.toUpperCase(),
            unit: 'units',
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2)),
            mean: Number(mean.toFixed(2)),
            median: Number(median.toFixed(2)),
            std: Number(std.toFixed(2)),
            q25: Number(q25.toFixed(2)),
            q75: Number(q75.toFixed(2)),
            description: `Distribution calculated from uploaded dataset column ${col}`
          };
        });

        // Compute target distribution
        const classMap: Record<string, number> = {};
        parsedRows.forEach((r) => {
          const tgt = String(r[targetColCandidate] || 'Unknown');
          classMap[tgt] = (classMap[tgt] || 0) + 1;
        });

        const computedCropDistribution: CropDistributionItem[] = Object.keys(classMap).map((k) => ({
          crop: k,
          samples: classMap[k],
          category: 'Uploaded Data'
        }));

        setCustomStats({
          totalSamples: parsedRows.length,
          featuresCount: numericCols.length,
          classesCount: Object.keys(classMap).length,
          missingValues: missingCount,
          duplicateRows: duplicateCount,
          targetColumn: targetColCandidate,
          features: computedFeatures,
          cropDistribution: computedCropDistribution
        });

        setIsCustomUploaded(true);
        setCustomFileName(file.name);
      } catch (err: any) {
        console.error(err);
        alert('Failed to parse the CSV file. Please ensure valid CSV format.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-zinc-500 font-medium">Computing Exploratory Data Analysis matrices from Kaggle dataset...</p>
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
                {isBackendUnavailable ? 'ML Backend Unavailable' : 'Failed to Load Dataset Analysis'}
              </h3>
              <p className="text-red-700">{error || BACKEND_UNAVAILABLE_MESSAGE}</p>
            </div>
          </div>

          {isBackendUnavailable && (
            <div className="pt-3 border-t border-red-200/80 space-y-2">
              <p className="text-[11px] text-red-700 font-medium">
                To run the real-time Python Scikit-Learn API:
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-900 text-emerald-400 font-mono text-[11px] flex items-center justify-between">
                <code>uvicorn main:app --reload --port 8000</code>
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={loadDefaultData}
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

  // Active metrics to display (custom uploaded vs Kaggle dataset)
  const activeOverview = isCustomUploaded && customStats ? {
    totalSamples: customStats.totalSamples,
    featuresCount: customStats.featuresCount,
    classesCount: customStats.classesCount,
    missingValues: customStats.missingValues,
    duplicateRows: customStats.duplicateRows,
    source: customFileName || 'Custom Uploaded CSV',
    targetColumn: customStats.targetColumn
  } : data.datasetOverview;

  const activeFeatures = isCustomUploaded && customStats ? customStats.features : data.features;
  const activeDistribution = isCustomUploaded && customStats ? customStats.cropDistribution : data.cropDistribution;

  const missingPercentage = ((activeOverview.missingValues / ((activeOverview.totalSamples * (activeOverview.featuresCount + 1)) || 1)) * 100).toFixed(1);
  const duplicatePercentage = ((activeOverview.duplicateRows / (activeOverview.totalSamples || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Upload and Dataset Control Bar */}
      <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">
                {isCustomUploaded ? `Active: ${customFileName}` : 'Active: Kaggle Crop Recommendation Dataset'}
              </h3>
              {isCustomUploaded ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                  User Uploaded CSV
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Kaggle 2,200 Default
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Missing values and duplicate rows are dynamically evaluated from the loaded dataset.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv"
            className="hidden"
          />
          <button
            id="upload-dataset-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs border border-emerald-700 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom CSV</span>
          </button>

          {isCustomUploaded && (
            <button
              id="reset-default-dataset-btn"
              onClick={loadDefaultData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold border border-zinc-300 transition-colors cursor-pointer"
              title="Reset to Kaggle 2,200 dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block">Total Samples</span>
          <strong className="text-2xl font-black text-zinc-900 block mt-1">
            {activeOverview.totalSamples.toLocaleString()}
          </strong>
          <span className="text-[11px] text-emerald-700 font-medium">
            {isCustomUploaded ? 'Rows in Uploaded CSV' : 'Rows in Kaggle Dataset'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block">Feature Dimensions</span>
          <strong className="text-2xl font-black text-zinc-900 block mt-1">
            {activeOverview.featuresCount}
          </strong>
          <span className="text-[11px] text-zinc-500">Continuous Variables</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block">Target Classes</span>
          <strong className="text-2xl font-black text-zinc-900 block mt-1">
            {activeOverview.classesCount}
          </strong>
          <span className="text-[11px] text-zinc-500">Distinct Categories</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block">Missing Values</span>
          <strong className={`text-2xl font-black block mt-1 ${activeOverview.missingValues > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {activeOverview.missingValues} ({missingPercentage}%)
          </strong>
          <span className="text-[11px] text-zinc-600 font-medium flex items-center gap-1">
            {activeOverview.missingValues === 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Complete Data
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-600 inline" /> Null Values Found
              </>
            )}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block">Duplicate Rows</span>
          <strong className={`text-2xl font-black block mt-1 ${activeOverview.duplicateRows > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {activeOverview.duplicateRows} ({duplicatePercentage}%)
          </strong>
          <span className="text-[11px] text-zinc-600 font-medium flex items-center gap-1">
            {activeOverview.duplicateRows === 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Zero Duplicates
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-600 inline" /> Duplicates Present
              </>
            )}
          </span>
        </div>
      </div>

      {/* Feature Statistical Summary Table */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Feature Descriptive Statistical Summary</h3>
            <p className="text-xs text-zinc-500">
              Calculated across {activeOverview.totalSamples.toLocaleString()} dataset observations
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border-2 border-emerald-200 self-start sm:self-auto">
            {activeFeatures.length} Numeric Features
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border-2 border-zinc-300 shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-300 bg-zinc-100/90 text-xs text-zinc-800 font-bold">
                <th className="py-3 px-4 border-r border-zinc-200">Feature Name</th>
                <th className="py-3 px-4 border-r border-zinc-200">Symbol &amp; Unit</th>
                <th className="py-3 px-4 border-r border-zinc-200 text-right">Min</th>
                <th className="py-3 px-4 border-r border-zinc-200 text-right text-emerald-800 bg-emerald-50/50">Mean (μ)</th>
                <th className="py-3 px-4 border-r border-zinc-200 text-right">Std Dev (σ)</th>
                <th className="py-3 px-4 border-r border-zinc-200 text-right">Median</th>
                <th className="py-3 px-4 border-r border-zinc-200 text-right">Max</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white text-xs font-mono">
              {activeFeatures.map((f, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 border-b border-zinc-100">
                  <td className="py-3.5 px-4 font-sans font-bold text-zinc-900 border-r border-zinc-200">{f.name}</td>
                  <td className="py-3.5 px-4 text-zinc-700 border-r border-zinc-200">{f.feature} ({f.unit})</td>
                  <td className="py-3.5 px-4 text-right font-medium text-zinc-700 border-r border-zinc-200">{f.min}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-800 border-r border-zinc-200 bg-emerald-50/20">{f.mean.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-zinc-600 border-r border-zinc-200">±{f.std.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-zinc-700 border-r border-zinc-200">{f.median.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-zinc-700 border-r border-zinc-200">{f.max}</td>
                  <td className="py-3.5 px-4 font-sans text-zinc-600 max-w-xs">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crop Distribution Bar Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Target Class Distribution ({activeDistribution.length} Categories)
            </h3>
            <p className="text-xs text-zinc-500">Observations per category in the loaded dataset</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-200">
            {activeOverview.totalSamples.toLocaleString()} Total Records
          </span>
        </div>

        <div className="h-64 w-full p-2 bg-zinc-50/50 rounded-xl border border-zinc-200">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeDistribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="crop"
                interval={0}
                angle={-45}
                textAnchor="end"
                tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(val: any) => [`${val} samples`, 'Count']}
              />
              <Bar dataKey="samples" fill="#059669" radius={[4, 4, 0, 0]}>
                {activeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#059669' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Correlation Heatmap Component */}
      <CorrelationHeatmap
        features={data.correlationMatrix.features}
        matrix={data.correlationMatrix.matrix}
      />

      {/* PCA 2D Scatter Plot Component */}
      <PcaPlot data={data.pcaSamples} />
    </div>
  );
};
