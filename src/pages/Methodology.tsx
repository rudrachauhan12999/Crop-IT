import React, { useState } from 'react';
import {
  GitBranch,
  Database,
  Sliders,
  BarChart3,
  Scale,
  Cpu,
  Network,
  Award,
  Sprout,
  CheckCircle2,
  Terminal,
  FileCode2,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MethodologyProps {
  onOpenCodeModal: () => void;
}

export const Methodology: React.FC<MethodologyProps> = ({ onOpenCodeModal }) => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const pipelineStages = [
    {
      id: 0,
      step: '01',
      title: 'Kaggle Dataset Acquisition',
      category: 'Data Source',
      icon: Database,
      desc: 'Ingestion of 2,200 real agricultural soil and climate records spanning 22 distinct crop categories (100 balanced samples per class).',
      details: [
        'Source: Kaggle Precision Agriculture Crop Recommendation Dataset',
        '7 Input Features: Soil Nitrogen (N), Phosphorus (P), Potassium (K), Soil pH, Ambient Temperature, Humidity, and Rainfall',
        '1 Target Label: Crop Category (Multiclass, 22 classes)'
      ],
      codeSnippet: `df = pd.read_csv('Crop_recommendation.csv')\nprint(f"Shape: {df.shape}") # (2200, 8)`
    },
    {
      id: 1,
      step: '02',
      title: 'Data Cleaning & Preprocessing',
      category: 'Data Quality',
      icon: Sliders,
      desc: 'Rigorous validation of data completeness, null-value checks, duplicate identification, and data type validation.',
      details: [
        'Missing Value Imputation Check: Verified 0 missing/NaN values across all 2,200 rows',
        'Duplicate Rows Detection: Verified 0 duplicate observations',
        'Data Types: 7 continuous numerical features (float64/int64) + 1 nominal categorical target'
      ],
      codeSnippet: `assert df.isnull().sum().sum() == 0\nassert df.duplicated().sum() == 0`
    },
    {
      id: 2,
      step: '03',
      title: 'Exploratory Data Analysis (EDA)',
      category: 'Analysis',
      icon: BarChart3,
      desc: 'Uncovering distributional characteristics, central tendencies, variance, and collinearity between soil and weather features.',
      details: [
        'Descriptive statistics (μ, σ, quartiles, min/max) computed per feature',
        'Pearson Correlation Analysis (high P-K collinearity r = 0.736)',
        'Class balance verification (stratified 100 observations per class)'
      ],
      codeSnippet: `corr = df.drop(columns=['label']).corr()\nsns.heatmap(corr, annot=True, cmap='coolwarm')`
    },
    {
      id: 3,
      step: '04',
      title: 'Feature Scaling (StandardScaler)',
      category: 'Transformation',
      icon: Scale,
      desc: 'Standardization of 7 feature distributions to zero mean (μ = 0) and unit variance (σ = 1) to prevent distance dominance.',
      details: [
        'Formula: z = (x - μ) / σ',
        'Crucial for distance-sensitive algorithms: KNN (Euclidean distance), SVM (RBF kernel), and K-Means clustering',
        'Tree-based Random Forest trained on original feature scale for maximum interpretability'
      ],
      codeSnippet: `scaler = StandardScaler()\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)`
    },
    {
      id: 4,
      step: '05',
      title: 'Supervised Learning Modeling',
      category: 'Model Training',
      icon: Cpu,
      desc: 'Training three distinct supervised machine learning classification paradigms on 80% stratified training data (1,760 samples).',
      details: [
        'Random Forest Classifier: Ensemble of 100 decision trees with Gini impurity split criterion',
        'K-Nearest Neighbors (KNN): Distance-weighted k=5 classification in scaled 7D feature space',
        'Support Vector Machine (SVM): Non-linear Radial Basis Function (RBF) kernel with C=10.0'
      ],
      codeSnippet: `rf = RandomForestClassifier(n_estimators=100, random_state=42)\nknn = KNeighborsClassifier(n_neighbors=5, weights='distance')\nsvm = SVC(kernel='rbf', C=10.0, probability=True)`
    },
    {
      id: 5,
      step: '06',
      title: 'Unsupervised Guild Clustering',
      category: 'Unsupervised ML',
      icon: Network,
      desc: 'Partitioning the unlabeled 7D feature space using K-Means clustering to identify inherent agronomic nutrient and moisture guilds.',
      details: [
        'Optimal K = 4 selected via Within-Cluster Sum of Squares (Inertia) Elbow Method',
        'Silhouette Coefficient: 0.520 (high cluster cohesion & separation)',
        'Discovered 4 natural guilds: Heavy Rain Wetland, Fruit Trees (High P/K), Legumes (N-fixing), and Heavy Feeders (High N)'
      ],
      codeSnippet: `kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)\nclusters = kmeans.fit_predict(X_scaled)`
    },
    {
      id: 6,
      step: '07',
      title: 'Dimensionality Reduction (PCA)',
      category: 'Visualization',
      icon: Layers,
      desc: 'Principal Component Analysis projecting 7-dimensional agronomic space into 2 orthogonal eigenvectors for 2D visual mapping.',
      details: [
        'Principal Component 1 (45.2% variance): Driven by Soil Nutrients (P, K vs N)',
        'Principal Component 2 (23.8% variance): Driven by Climate (Rainfall & Humidity)',
        'Total Variance Explained: 69.04%'
      ],
      codeSnippet: `pca = PCA(n_components=2)\nX_pca = pca.fit_transform(X_scaled)\nprint(pca.explained_variance_ratio_)`
    },
    {
      id: 7,
      step: '08',
      title: 'Model Evaluation & Cross-Validation',
      category: 'Evaluation',
      icon: CheckCircle2,
      desc: 'Rigorous multi-metric testing on 440 holdout test samples and 5-fold cross validation.',
      details: [
        'Metrics: Accuracy, Weighted Precision, Weighted Recall, Weighted F1-Score',
        '5-Fold Stratified Cross Validation: 99.27% ± 0.31%',
        'Confusion Matrix Error Analysis: 437/440 correct classifications (0.68% error rate)'
      ],
      codeSnippet: `scores = cross_val_score(rf, X, y, cv=5)\nprint(f"5-Fold Mean: {scores.mean():.4f}")`
    },
    {
      id: 8,
      step: '09',
      title: 'Comparative Evaluation & Best Selection',
      category: 'Decision',
      icon: Award,
      desc: 'Evaluating all model candidates to select the optimal model for production deployment (Random Forest @ 99.32%).',
      details: [
        'Random Forest: 99.32% Accuracy | 0.9931 F1-Score',
        'KNN: 98.18% Accuracy | 0.9815 F1-Score',
        'SVM: 96.82% Accuracy | 0.9679 F1-Score',
        'Selection Rationale: Random Forest handles non-linear boundaries best and is immune to feature scale distortions'
      ],
      codeSnippet: `joblib.dump(rf, 'best_crop_model.pkl')`
    },
    {
      id: 9,
      step: '10',
      title: 'REST API & Web UI Deployment',
      category: 'Deployment',
      icon: Sprout,
      desc: 'Encapsulating the trained model pipeline into REST API endpoints and an interactive React web dashboard.',
      details: [
        'POST /api/predict: Takes 7 soil & climate parameters, executes ensemble inference, returns probability & alternatives',
        'GET /api/metrics, /api/dataset-analysis, /api/unsupervised-analysis',
        'Fully modular full-stack architecture with Python Scikit-Learn export'
      ],
      codeSnippet: `@app.post("/api/predict")\ndef predict(input: SoilInput):\n    probs = model.predict_proba(input)\n    return {"recommendedCrop": ...}`
    }
  ];

  const currentStage = pipelineStages[activeStage];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-zinc-900 text-white shadow-md border-2 border-emerald-700/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold">
            <GitBranch className="w-4 h-4 text-emerald-300" />
            <span>Data Science &amp; Engineering Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            End-to-End Machine Learning Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            A comprehensive, reproducible 10-stage machine learning methodology, from raw Kaggle dataset ingestion and preprocessing to multi-model training and deployed production inference.
          </p>
        </div>

        <button
          onClick={onOpenCodeModal}
          className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-md shrink-0 border border-emerald-300 cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-emerald-700" />
          <span>View Python Pipeline Code</span>
        </button>
      </div>

      {/* Visual Pipeline Stage Stepper */}
      <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-zinc-900">Interactive Pipeline Stages (1 to 10)</h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStage === idx;
            return (
              <button
                key={stage.id}
                id={`pipeline-step-${idx}`}
                onClick={() => setActiveStage(idx)}
                className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-zinc-50 border-zinc-300 hover:bg-emerald-50/80 text-zinc-800'
                }`}
              >
                <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-200' : 'text-zinc-500'}`}>
                  {stage.step}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                <span className="text-[11px] font-bold leading-tight line-clamp-1">
                  {stage.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Detailed Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs border border-emerald-700">
              {currentStage.step}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border-2 border-emerald-200">
                {currentStage.category}
              </span>
              <h3 className="text-xl font-extrabold text-zinc-900 mt-1">{currentStage.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activeStage === 0}
              onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-1.5 rounded-xl border-2 border-zinc-300 text-xs font-semibold disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={activeStage === pipelineStages.length - 1}
              onClick={() => setActiveStage((prev) => Math.min(pipelineStages.length - 1, prev + 1))}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40 hover:bg-emerald-700 border border-emerald-700 cursor-pointer"
            >
              Next Step
            </button>
          </div>
        </div>

        <p className="text-sm text-zinc-700 leading-relaxed font-medium">
          {currentStage.desc}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Deliverables & Outcomes */}
          <div className="p-5 rounded-xl bg-zinc-50 border-2 border-zinc-300 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              Stage Specifications &amp; Outcomes
            </h4>
            <ul className="space-y-2 text-xs">
              {currentStage.details.map((detail, dIdx) => (
                <li key={dIdx} className="flex items-start gap-2 text-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Python Implementation Code Snippet */}
          <div className="p-5 rounded-xl bg-zinc-950 text-zinc-200 space-y-2 font-mono text-xs overflow-hidden flex flex-col justify-between border-2 border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 border-b border-zinc-800">
              <span className="flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Python Scikit-Learn Implementation</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-bold">Step {currentStage.step}</span>
            </div>
            <pre className="overflow-x-auto py-2 leading-relaxed text-emerald-400">
              <code>{currentStage.codeSnippet}</code>
            </pre>
            <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span>Reproducible in Google Colab / Jupyter</span>
              <button
                onClick={onOpenCodeModal}
                className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
              >
                Expand Full Script &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
