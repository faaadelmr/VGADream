'use client';

import React from 'react';

interface NavbarProps {
  totalGpus: number;
  activeCaseName: string;
  onOpenCaseSelector: () => void;
  showVisualizer: boolean;
  onToggleVisualizer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalGpus,
  activeCaseName,
  onOpenCaseSelector,
  showVisualizer,
  onToggleVisualizer
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand Typography */}
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tight text-white">
            VGA<span className="text-cyan-400">DREAM</span>
          </span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            Fit Matrix
          </span>
        </div>

        {/* Center Case Selector Pill */}
        <button
          onClick={onOpenCaseSelector}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl px-3 py-1.5 transition-all text-left shadow-sm"
        >
          <span className="text-[10px] font-mono text-slate-400 uppercase">Target Case:</span>
          <span className="text-xs font-bold text-slate-100 truncate max-w-[180px]">{activeCaseName}</span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 ml-1">
            Ganti
          </span>
        </button>

        {/* Toggle Blueprint Visualizer View */}
        <button
          onClick={onToggleVisualizer}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border shadow-sm ${
            showVisualizer
              ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-600/30'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
        >
          {showVisualizer ? 'Tutup Blueprint 2D' : 'Buka Blueprint 2D'}
        </button>
      </div>
    </header>
  );
};
