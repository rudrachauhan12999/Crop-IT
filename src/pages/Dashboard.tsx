import React from 'react';
import { PageId } from '../components/navigation/Sidebar';
import {
  Sprout,
  BarChart3,
  Database,
  Network,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Award,
  Sparkles
} from 'lucide-react';
import BorderGlow from '../components/BorderGlow';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const statCards = [
    {
      id: 'stat-samples',
      label: 'Dataset Samples',
      value: '2,200',
      subtext: 'Kaggle Agricultural Dataset',
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      id: 'stat-classes',
      label: 'Crop Classes',
      value: '22',
      subtext: '100 balanced samples each',
      icon: Sprout,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      id: 'stat-models',
      label: 'ML Algorithms',
      value: '4 + PCA',
      subtext: '3 Supervised, 1 Unsupervised',
      icon: Cpu,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      id: 'stat-accuracy',
      label: 'Best Accuracy',
      value: '99.32%',
      subtext: 'Random Forest (100 Trees)',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  const quickLinks = [
    {
      id: 'recommendation' as PageId,
      title: 'Crop Recommendation',
      description: 'Input soil N-P-K, pH, temperature, humidity, and rainfall to obtain real-time ML crop predictions and alternatives.',
      icon: Sprout,
      badge: 'Inference',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      actionText: 'Launch Predictor',
    },
    {
      id: 'performance' as PageId,
      title: 'Model Performance',
      description: 'Comparative metrics evaluating Random Forest, KNN, and SVM across accuracy, precision, recall, and F1-score.',
      icon: BarChart3,
      badge: 'Supervised',
      badgeColor: 'bg-blue-100 text-blue-800',
      actionText: 'View Metrics',
    },
    {
      id: 'dataset' as PageId,
      title: 'Dataset Analysis',
      description: 'Exploratory data analysis including feature distributions, Pearson correlation heatmap, and PCA 2D scatter plots.',
      icon: Database,
      badge: 'EDA',
      badgeColor: 'bg-purple-100 text-purple-800',
      actionText: 'Explore Data',
    },
    {
      id: 'unsupervised' as PageId,
      title: 'Unsupervised Analysis',
      description: 'K-Means clustering (K=4), inertia elbow curve, silhouette analysis, and data feature cluster interpretation.',
      icon: Network,
      badge: 'K-Means',
      badgeColor: 'bg-amber-100 text-amber-800',
      actionText: 'View Clusters',
    },
  ];

  const technicalSpecs = [
    '2,200 Kaggle Samples',
    'StandardScaler Normalization',
    'Random Forest @ 99.32%',
    'KNN @ 98.18%',
    'SVM @ 96.82%',
    'K-Means (K=4)',
    'PCA 2D Projection',
    'REST Inference API'
  ];

  return (
    <div className="h-full flex flex-col justify-between gap-3.5 max-w-7xl mx-auto select-none">
      {/* Hero Banner - Compact & Impactful with BorderGlow */}
      <BorderGlow
        className="w-full shrink-0"
        backgroundColor="#064e3b"
        borderRadius={16}
        glowRadius={30}
        glowIntensity={1.0}
        colors={['#10b981', '#06b6d4', '#a855f7']}
      >
        <div className="bg-gradient-to-br from-emerald-800/90 via-emerald-900/90 to-zinc-900/90 text-white rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
              Crop-IT: Machine Learning Crop Recommendation System
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed line-clamp-2">
              An intelligent crop decision-support system built on the real-world Kaggle agricultural dataset. Employs supervised ensemble learning (Random Forest), KNN, SVM, and unsupervised K-Means clustering with PCA dimensionality reduction.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                id="hero-predict-btn"
                onClick={() => onNavigate('recommendation')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>Recommend Crop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                id="hero-performance-btn"
                onClick={() => onNavigate('performance')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600/40 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Model Performance (99.32%)</span>
              </button>
            </div>
          </div>

          {/* Subtle decorative background shape */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        </div>
      </BorderGlow>

      {/* Key Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <BorderGlow
              key={card.id}
              className="w-full h-full"
              backgroundColor="#ffffff"
              borderRadius={16}
              glowRadius={24}
              glowIntensity={0.8}
              colors={['#10b981', '#06b6d4', '#3b82f6']}
            >
              <div
                id={card.id}
                className={`p-3.5 rounded-xl h-full flex items-center gap-3 transition-all`}
              >
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate">{card.label}</p>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">{card.value}</h3>
                  <p className="text-[10px] text-zinc-500 truncate">{card.subtext}</p>
                </div>
              </div>
            </BorderGlow>
          );
        })}
      </div>

      {/* Quick Navigation Cards Grid (2x2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <BorderGlow
              key={link.id}
              className="w-full h-full"
              backgroundColor="#ffffff"
              borderRadius={16}
              glowRadius={28}
              glowIntensity={0.85}
              colors={['#10b981', '#14b8a6', '#6366f1']}
            >
              <div
                id={`quick-card-${link.id}`}
                onClick={() => onNavigate(link.id)}
                className="p-4 rounded-xl h-full flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-[11px] text-zinc-600 leading-relaxed mt-1 line-clamp-2">
                    {link.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-100 text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                  <span>{link.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </BorderGlow>
          );
        })}
      </div>

      {/* Bottom Technical Specifications Ribbon */}
      <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-700 font-bold text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>System Specifications:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {technicalSpecs.map((spec, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-100/80"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
