import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  BarChart3,
  Database,
  Network,
  GitBranch,
  Info,
  Cpu,
  X,
  ExternalLink,
  Github
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'recommendation'
  | 'performance'
  | 'dataset'
  | 'unsupervised'
  | 'methodology'
  | 'about';

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  backendStatus?: string;
  onCloseMobile?: () => void;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'recommendation', label: 'Crop Recommendation', icon: Sprout },
  { id: 'performance', label: 'Model Performance', icon: BarChart3 },
  { id: 'dataset', label: 'Dataset Analysis', icon: Database },
  { id: 'unsupervised', label: 'Unsupervised Analysis', icon: Network },
  { id: 'methodology', label: 'ML Pipeline', icon: GitBranch },
  { id: 'about', label: 'Project Specifications', icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  backendStatus = 'ok',
  onCloseMobile,
  onToggleSidebar,
  isMobile = false
}) => {
  return (
    <aside
      id="app-sidebar"
      className={`bg-white border-r border-emerald-100 flex flex-col shrink-0 select-none ${
        isMobile ? 'w-full h-full' : 'w-72 h-screen sticky top-0'
      }`}
    >
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-emerald-100/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 leading-none">Crop-IT</h1>
        </div>

        {/* Close Button for Mobile Overlay or Desktop Collapse */}
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-emerald-50 transition-colors cursor-pointer hidden lg:flex items-center justify-center"
              aria-label="Close sidebar view"
              title="Close sidebar view"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => {
                onSelectPage(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-emerald-50/80'
              }`}
            >
              {/* Icon */}
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-emerald-700 group-hover:text-emerald-800'
                }`}
              />

              {/* Label */}
              <span className="truncate text-left flex-1 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ML Engine Status Card */}
      <div className="p-3.5 mx-3 mb-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <Cpu className="w-3.5 h-3.5 text-emerald-700" />
            <span>ML Engine Status</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Active
          </span>
        </div>
        <p className="text-[11px] text-zinc-600 leading-snug mb-2">
          Trained on 2,200 Kaggle samples with Random Forest, KNN, SVM &amp; K-Means.
        </p>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-emerald-200/60">
          <span>Best Acc: <strong className="text-emerald-700">99.32%</strong></span>
          <span>Classes: <strong className="text-zinc-700">22</strong></span>
        </div>
      </div>

      {/* Social / External Links Footer */}
      <div className="px-4 py-3 border-t border-emerald-100/80 flex items-center justify-between text-xs text-zinc-500 shrink-0">
        <a
          href="https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-700 flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span>Kaggle Dataset</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </aside>
  );
};
