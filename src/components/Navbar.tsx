import React from 'react';
import { CaseSpec } from '@/types';
import { Sparkles, Plus, RefreshCw, Box } from 'lucide-react';

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

          {/* Center/Right: Target Case Button & GPU Catalog Buttons in Header */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {/* Change Target Case Button in Header */}
            <button
              onClick={onChangeCaseClick}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-all shrink-0 cursor-pointer shadow-md shadow-cyan-600/20"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Change Target Case</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-200 text-[10px] font-normal">
                {pcCase.name}
              </span>
            </button>

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

            {/* Secondary Action: Add GPU Spec */}
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
        </div>
      </div>
    </header>
  );
};
