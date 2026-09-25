import React from 'react';
import {
  FileText,
  Target,
  Layers,
  Database,
  Globe2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Terminal,
  Cpu,
  Code2,
  Server,
  Layout,
  BarChart3,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface AboutProps {
  onOpenCodeModal: () => void;
}

export const About: React.FC<AboutProps> = ({ onOpenCodeModal }) => {
  const techStackItems = [
    { label: 'Dataset', value: 'Kaggle Crop Recommendation Dataset', detail: '2,200 rows, 22 crop classes, 7 features' },
    { label: 'Language', value: 'Python', detail: 'Python 3.11 for ML modeling and statistical analysis' },
    { label: 'Libraries', value: 'Pandas, NumPy, Matplotlib, Seaborn, Scikit-learn', detail: 'Data wrangling, normalization, visualization & model evaluation' },
    { label: 'Supervised Models', value: 'Random Forest + KNN + SVM', detail: 'Random Forest (99.32%), KNN (98.18%), SVM (96.82%)' },
    { label: 'Unsupervised Model', value: 'K-Means', detail: 'K=4 clusters for soil profile and crop guild discovery' },
    { label: 'Dimensionality Reduction', value: 'PCA', detail: '2D Principal Component Analysis for high-dimensional projection' },
    { label: 'Evaluation', value: 'Accuracy, Precision, Recall, F1-score, Confusion Matrix', detail: 'Stratified 5-fold cross validation & 440 holdout test set' },
    { label: 'Frontend & UI', value: 'React 19 + TypeScript + Tailwind CSS', detail: 'Responsive interactive dashboards, visualizations, and forms' },
    { label: 'Backend & Inference', value: 'Express.js + Node.js REST API', detail: 'Real-time inference endpoints, validation, and analytics' },
    { label: 'Development', value: 'Jupyter Notebook / VS Code', detail: 'Exploratory data analysis, prototyping & full-stack development' },
    { label: 'Application & Deployment', value: 'Web & API Services', detail: 'Cloud-hosted responsive application with REST API endpoints' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-zinc-900 text-white shadow-md border-2 border-emerald-700/70 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold">
          <FileText className="w-4 h-4 text-emerald-300" />
          <span>System Architecture &amp; Specifications</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          PROJECT SPECIFICATIONS
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
          Comprehensive system documentation covering the problem statement, end-to-end technology stack, dataset specifications, real-world utility, current limitations, and future scope.
        </p>
      </div>

      {/* 1. PROBLEM STATEMENT */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-zinc-100">
          <Target className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
            1. Problem Statement
          </h3>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
          <p>
            Traditional agricultural practices frequently rely on historical habit, uncalibrated intuition, or overly broad regional generalizations rather than scientific soil and climatic evaluation. This mismatch between soil chemical profile and crop nutritional requirements leads to critical agricultural inefficiencies:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-300 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Nutrient Depletion &amp; Soil Degradation</span>
              </div>
              <p className="text-xs text-zinc-700 leading-normal">
                Continuous cultivation of heavy-feeding crops (such as Cotton or Maize) in depleted soils without calculated N-P-K replenishment causes long-term fertility exhaustion and reduced soil biomass.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/70 border-2 border-sky-300 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-sky-700 shrink-0" />
                <span>Water Wastage &amp; Drought Vulnerability</span>
              </div>
              <p className="text-xs text-zinc-700 leading-normal">
                Cultivating high-water demanding crops (like Rice and Jute) in semi-arid zones strains groundwater tables, wastes expensive irrigation electricity, and exposes crops to total failure.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border-2 border-rose-300 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-rose-950 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Economic Instability for Farmers</span>
              </div>
              <p className="text-xs text-zinc-700 leading-normal">
                Sub-optimal crop selection diminishes harvest yields, escalates costly chemical fertilizer overheads, and leaves smallholder farmers financially vulnerable to single-season climate shocks.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-300 text-xs sm:text-sm text-emerald-950 flex items-start gap-3 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">The Solution: Precision Machine Learning Recommendation</strong>
              <span>
                Crop-IT bridges this gap by applying supervised machine learning (Random Forest, KNN, SVM) and unsupervised clustering (K-Means) to predict the mathematically optimal crop for any given N-P-K nutrient composition, pH level, temperature, humidity, and rainfall profile.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TECHNOLOGY STACK */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-zinc-100">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
              2. Technology Stack
            </h3>
          </div>
          <button
            onClick={onOpenCodeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>View Python Code</span>
          </button>
        </div>

        {/* Structured Grid of Specs requested by user */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {techStackItems.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-zinc-50 border-2 border-zinc-300 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-1">
                  {item.label}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                  {item.value}
                </h4>
              </div>
              <p className="text-[11px] text-zinc-600 mt-1.5 pt-1.5 border-t border-zinc-200">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Technology Architecture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-300 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <Code2 className="w-4 h-4 text-emerald-700" />
              <span>Machine Learning Core</span>
            </div>
            <p className="text-[11px] text-zinc-700">
              Python, Scikit-learn, Pandas, NumPy, StandardScaler pipeline with stratified 5-fold cross-validation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border-2 border-sky-300 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
              <Layout className="w-4 h-4 text-sky-700" />
              <span>Frontend Experience</span>
            </div>
            <p className="text-[11px] text-zinc-700">
              React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts interactive charting engine.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border-2 border-purple-300 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
              <Server className="w-4 h-4 text-purple-700" />
              <span>Deployment &amp; Hosting</span>
            </div>
            <p className="text-[11px] text-zinc-700">
              Vercel (initially) with serverless edge routes, REST inference endpoints, and automated CI/CD.
            </p>
          </div>
        </div>
      </div>

      {/* 3. DATASET SPECIFICATIONS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-zinc-100">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
              3. Dataset Specifications
            </h3>
          </div>
          <a
            href="https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors self-start sm:self-auto"
          >
            <span>Kaggle Dataset Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 bg-zinc-50 rounded-xl border-2 border-zinc-300 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-600 block">Total Observations</span>
              <strong className="text-xl font-black text-zinc-900 block mt-0.5">2,200</strong>
              <span className="text-[10px] text-emerald-700 font-bold">Cleaned &amp; Validated</span>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-xl border-2 border-zinc-300 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-600 block">Crop Classes</span>
              <strong className="text-xl font-black text-zinc-900 block mt-0.5">22</strong>
              <span className="text-[10px] text-zinc-600 font-semibold">100 Samples / Class (Balanced)</span>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-xl border-2 border-zinc-300 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-600 block">Input Features</span>
              <strong className="text-xl font-black text-zinc-900 block mt-0.5">7</strong>
              <span className="text-[10px] text-zinc-600 font-semibold">3 Chemical, 4 Climate</span>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-xl border-2 border-zinc-300 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-600 block">Missing / Null Values</span>
              <strong className="text-xl font-black text-emerald-700 block mt-0.5">0 (0.00%)</strong>
              <span className="text-[10px] text-emerald-700 font-bold">100% Data Integrity</span>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-zinc-900 mb-2">Feature Definitions &amp; Measurement Bounds:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                <span className="font-bold text-emerald-800 block">1. Nitrogen (N)</span>
                <span className="text-zinc-600 text-[11px]">Range: 0 - 140 ppm (Soil Macro-Nutrient)</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                <span className="font-bold text-emerald-800 block">2. Phosphorus (P)</span>
                <span className="text-zinc-600 text-[11px]">Range: 5 - 145 ppm (Root Development)</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                <span className="font-bold text-emerald-800 block">3. Potassium (K)</span>
                <span className="text-zinc-600 text-[11px]">Range: 5 - 205 ppm (Stress &amp; Water Regulation)</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                <span className="font-bold text-emerald-800 block">4. Temperature</span>
                <span className="text-zinc-600 text-[11px]">Range: 8.8 - 43.7 °C (Ambient Atmosphere)</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                <span className="font-bold text-emerald-800 block">5. Humidity</span>
                <span className="text-zinc-600 text-[11px]">Range: 14.3 - 99.9 % (Relative Air Moisture)</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200">
                <span className="font-bold text-emerald-800 block">6. Soil pH</span>
                <span className="text-zinc-600 text-[11px]">Range: 3.5 - 9.9 pH (Acidity / Alkalinity)</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border-2 border-zinc-200 sm:col-span-2 lg:col-span-3">
                <span className="font-bold text-emerald-800 block">7. Rainfall</span>
                <span className="text-zinc-600 text-[11px]">Range: 20.2 - 298.6 mm (Seasonal Precipitation Depth)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REAL WORLD APPLICATIONS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-zinc-100">
          <Globe2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
            4. Real World Applications
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/60 border-2 border-emerald-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Farmer Advisory &amp; Extension Kiosks
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Provides direct, instant crop suitability recommendations for agricultural extension officers and local farm co-ops based on standardized regional soil testing reports.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border-2 border-emerald-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Fertilizer &amp; Water Conservation
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Eliminates excessive over-fertilization by matching crops to the native soil chemistry and prevents excessive groundwater pumping by avoiding flood crops in arid zones.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border-2 border-emerald-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Crop Rotation Planning
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Utilizes the K-Means unsupervised clustering guilds to suggest ideal sequential crops (e.g. nitrogen-fixing pulses following heavy potassium/phosphorus feeders).
            </p>
          </div>
        </div>
      </div>

      {/* 5. CURRENT LIMITATIONS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-zinc-100">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
            5. Current Limitations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Static Climate Assumptions
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              The dataset operates on average seasonal temperature and rainfall figures, without modeling extreme short-term shocks such as flash floods, unseasonal frost, or heat waves.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Absence of Biological Factors
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              The current feature set does not incorporate soil microbial density, mycorrhizal fungi counts, pest infestation histories, or weed pressure indexes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Market &amp; Economic Isolation
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Predictions are purely agronomic and do not factor in real-time commodity market prices, transportation costs, or localized cold-storage infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* 6. FUTURE SCOPE */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-zinc-100">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
            6. Future Scope
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-purple-50/70 border-2 border-purple-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              IoT Sensor Probe Integration
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Direct telemetry ingestion from field-deployed IoT optical N-P-K probes and micro-weather stations for continuous automated crop health monitoring.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border-2 border-purple-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Satellite Remote Sensing &amp; NDVI
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Overlaying Sentinel-2 / Landsat multispectral imagery to calculate Normalized Difference Vegetation Index (NDVI) and soil moisture gradients at scale.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border-2 border-purple-300 space-y-2 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
              Multilingual Voice AI Assistant
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Incorporating regional vernacular voice synthesis and speech recognition for accessibility across diverse rural farming communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
