import React from 'react';
import { CaseSpec } from '@/types';
import { Sparkles, Plus, RefreshCw, Database } from 'lucide-react';

interface NavbarProps {
  pcCase: CaseSpec;
  onChangeCaseClick: () => void;
  comparedCount: number;
  onOpenCompareClick: () => void;
  onOpenMasterCatalog: () => void;
  dreamCount: number;
  masterCount: number;
  onOpenAddGpu: () => void;
  onSyncD1: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  pcCase,
  onChangeCaseClick,
  comparedCount,
  onOpenCompareClick,
  onOpenMasterCatalog,
  dreamCount,
  masterCount,
  onOpenAddGpu,
  onSyncD1,
  isSyncing
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Logo & Brand */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <img
              src="/vga-card.png"
              alt="VGADream Logo"
              className="h-7 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] shrink-0"
            />
            <span className="font-bold text-lg leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight hidden sm:inline">
              VGADream
            </span>
          </div>

          {/* Center/Right: GPU Catalog & Dream List Buttons in Header */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {/* Primary Action: Open Master GPU Catalog */}
            <button
              onClick={onOpenMasterCatalog}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-medium transition-all shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>ADD GPU to List Dream VGA</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-cyan-400 text-[10px] font-mono font-bold">
                {dreamCount} Selected
              </span>
            </button>

            {/* Secondary Action: Scrape / Add GPU */}
            <button
              onClick={onOpenAddGpu}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-medium transition-all border border-slate-800 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add GPU Spec</span>
            </button>

            {/* Sync Master Database Status */}
            <button
              onClick={onSyncD1}
              disabled={isSyncing}
              title="Sync Master Database"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all border border-slate-800 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Master ({masterCount})</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Active PC Case Selector Button */}
            <button
              onClick={onChangeCaseClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-slate-300 hover:text-white transition-all group shadow-sm"
            >
              <span className="text-slate-500 group-hover:text-cyan-400 hidden xl:inline">Target Case:</span>
              <span className="font-bold text-cyan-400 group-hover:underline max-w-[100px] sm:max-w-none truncate">{pcCase.name}</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded hidden sm:inline">
                Max {pcCase.maxGpuLengthMm}mm
              </span>
            </button>

            {/* Compare Matrix Trigger Button */}
            {comparedCount > 0 && (
              <button
                onClick={onOpenCompareClick}
                className="relative px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold text-xs font-mono shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-1.5 animate-pulse"
              >
                <span className="hidden sm:inline">Compare</span>
                <span className="w-4 h-4 rounded-full bg-white text-indigo-950 flex items-center justify-center text-[10px] font-extrabold">
                  {comparedCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
