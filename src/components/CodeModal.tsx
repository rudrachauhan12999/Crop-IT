import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, FileCode2, Download } from 'lucide-react';
import { fetchPythonCode } from '../services/api';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'train' | 'fastapi'>('train');
  const [trainCode, setTrainCode] = useState<string>('');
  const [fastApiCode, setFastApiCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !trainCode) {
      setLoading(true);
      fetchPythonCode()
        .then((res) => {
          setTrainCode(res.trainScript);
          setFastApiCode(res.fastApiScript);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, trainCode]);

  if (!isOpen) return null;

  const currentCode = activeTab === 'train' ? trainCode : fastApiCode;
  const filename = activeTab === 'train' ? 'train_crop_model.py' : 'main.py';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-zinc-700 overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between border-b-2 border-zinc-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Python Machine Learning Source Code</h3>
              <p className="text-xs text-zinc-400">Scikit-Learn Model Training &amp; FastAPI Backend Implementation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Action bar */}
        <div className="px-6 py-3 bg-zinc-900/95 text-zinc-300 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('train')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeTab === 'train'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>train_crop_model.py (Scikit-Learn)</span>
            </button>
            <button
              onClick={() => setActiveTab('fastapi')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeTab === 'fastapi'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>main.py (FastAPI Server)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-5 bg-zinc-950 text-zinc-200 overflow-y-auto font-mono text-xs leading-relaxed">
          {loading ? (
            <div className="text-zinc-500 py-12 text-center">Loading code script...</div>
          ) : (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-x-auto">
              <pre className="whitespace-pre">
                <code>{currentCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-900 text-zinc-400 text-xs flex items-center justify-between border-t border-zinc-800">
          <span className="font-mono text-[11px]">Dependencies: pandas, numpy, scikit-learn, joblib, fastapi, uvicorn</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
