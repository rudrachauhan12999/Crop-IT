/**
 * Crop-IT: Machine Learning Based Crop Recommendation System
 * Main Application Shell & Route Controller
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/navigation/Sidebar';
import { Header } from './components/Header';
import { CodeModal } from './components/CodeModal';
import { Dashboard } from './pages/Dashboard';
import { Recommendation } from './pages/Recommendation';
import { ModelPerformance } from './pages/ModelPerformance';
import { DatasetAnalysis } from './pages/DatasetAnalysis';
import { UnsupervisedAnalysis } from './pages/UnsupervisedAnalysis';
import { Methodology } from './pages/Methodology';
import { About } from './pages/About';
import { checkBackendHealth } from './services/api';
import { BackendHealthResponse } from './types/ml';
import { Award } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);

  useEffect(() => {
    checkBackendHealth()
      .then((data) => setBackendHealth(data))
      .catch((err) => console.error('Health check error:', err));
  }, []);

  const handleSelectPage = (page: PageId) => {
    setCurrentPage(page);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        {sidebarVisible && (
          <div className="hidden lg:block transition-all duration-200">
            <Sidebar
              currentPage={currentPage}
              onSelectPage={handleSelectPage}
              backendStatus={backendHealth?.status || 'ok'}
              onToggleSidebar={() => setSidebarVisible(false)}
            />
          </div>
        )}

        {/* Mobile Nav Overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative w-80 max-w-full bg-white flex flex-col z-50 shadow-2xl h-full">
              <Sidebar
                currentPage={currentPage}
                onSelectPage={handleSelectPage}
                backendStatus={backendHealth?.status || 'ok'}
                onCloseMobile={() => setMobileNavOpen(false)}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            currentPage={currentPage}
            sidebarVisible={sidebarVisible}
            onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenCodeModal={() => setCodeModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {currentPage === 'dashboard' && <Dashboard onNavigate={handleSelectPage} />}
            {currentPage === 'recommendation' && <Recommendation />}
            {currentPage === 'performance' && <ModelPerformance />}
            {currentPage === 'dataset' && <DatasetAnalysis />}
            {currentPage === 'unsupervised' && <UnsupervisedAnalysis />}
            {currentPage === 'methodology' && (
              <Methodology onOpenCodeModal={() => setCodeModalOpen(true)} />
            )}
            {currentPage === 'about' && (
              <About onOpenCodeModal={() => setCodeModalOpen(true)} />
            )}
          </main>

          {/* Application Footer */}
          <footer className="border-t border-emerald-100/80 bg-white px-6 py-5 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-700">Crop-IT System</span>
              <span>•</span>
              <span>Machine Learning Based Crop Recommendation</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Award className="w-3.5 h-3.5" />
                Random Forest 99.32%
              </span>
              <span>•</span>
              <span>Kaggle 2,200 Samples</span>
              <span>•</span>
              <span>Scikit-Learn Verified</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Python Code Viewer Modal */}
      <CodeModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
      />
    </div>
  );
}
