import React from 'react';
import { PageId } from './navigation/Sidebar';
import { Menu, ShieldCheck, Terminal, PanelLeft } from 'lucide-react';

interface HeaderProps {
  currentPage: PageId;
  sidebarVisible?: boolean;
  onOpenMobileNav: () => void;
  onToggleSidebar?: () => void;
  onOpenCodeModal: () => void;
}

const PAGE_METADATA: Record<PageId, { title: string; subtitle: string; badge: string }> = {
  dashboard: {
    title: 'Crop Recommendation System Dashboard',
    subtitle: 'Machine Learning powered agronomic decision support based on the Kaggle agricultural dataset',
    badge: 'System Overview'
  },
  recommendation: {
    title: 'Precision Crop Recommendation Form',
    subtitle: 'Enter 7 soil chemistry & environmental parameters to compute real-time model inference',
    badge: 'Supervised Inference'
  },
  performance: {
    title: 'Supervised Model Performance',
    subtitle: 'Comparative evaluation of Random Forest, KNN, and SVM on 440 stratified test samples',
    badge: 'Accuracy > 80%'
  },
  dataset: {
    title: 'Exploratory Data Analysis (EDA)',
    subtitle: 'Statistical summary, distributions, Pearson correlation matrix, and 2D PCA projections',
    badge: '2,200 Samples'
  },
  unsupervised: {
    title: 'Unsupervised Analysis & K-Means Clustering',
    subtitle: 'Discovering natural data groupings and nutrient patterns in 7D feature space using K=4',
    badge: 'Cluster Analysis'
  },
  methodology: {
    title: 'Machine Learning Pipeline & Methodology',
    subtitle: 'End-to-end data science pipeline from raw dataset ingestion to deployed recommendation API',
    badge: 'Pipeline Architecture'
  },
  about: {
    title: 'Project Specifications',
    subtitle: 'Problem statement, technology stack, dataset specifications, real-world utility, limitations, and future scope',
    badge: 'Specifications'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  sidebarVisible = true,
  onOpenMobileNav,
  onToggleSidebar,
  onOpenCodeModal
}) => {
  const meta = PAGE_METADATA[currentPage] || PAGE_METADATA.dashboard;

  return (
    <header className="bg-white border-b border-emerald-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Toggle Button */}
        <button
          id="mobile-menu-toggle"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-emerald-50 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle / Restore Button */}
        {onToggleSidebar && (
          <button
            id="desktop-sidebar-toggle"
            onClick={onToggleSidebar}
            className={`hidden lg:flex p-2 rounded-lg transition-colors cursor-pointer ${
              !sidebarVisible
                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-emerald-50'
            }`}
            aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">{meta.title}</h2>
            <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {meta.badge}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          id="view-python-code-btn"
          onClick={onOpenCodeModal}
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors shadow-xs"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>Python Scikit-Learn Code</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Scikit-Learn Verified</span>
        </div>
      </div>
    </header>
  );
};
