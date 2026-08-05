'use client';

import React from 'react';
import { CaseSpec } from '@/types';

interface NavbarProps {
  pcCase: CaseSpec;
  onChangeCaseClick: () => void;
  comparedCount: number;
  onOpenCompareClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pcCase,
  onChangeCaseClick,
  comparedCount,
  onOpenCompareClick
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5">
            <img
              src="/vga-card.png"
              alt="VGADream Logo"
              className="h-7 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] shrink-0"
            />
            <span className="font-bold text-lg leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
              VGADream
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Active PC Case Selector Button */}
            <button
              onClick={onChangeCaseClick}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-slate-300 hover:text-white transition-all group shadow-sm"
            >
              <span className="text-slate-500 group-hover:text-cyan-400">Target Case:</span>
              <span className="font-bold text-cyan-400 group-hover:underline">{pcCase.name}</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                Max {pcCase.maxGpuLengthMm}mm
              </span>
            </button>

            {/* Compare Matrix Trigger Button */}
            {comparedCount > 0 && (
              <button
                onClick={onOpenCompareClick}
                className="relative px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold text-xs font-mono shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2 animate-pulse"
              >
                <span>Compare Matrix</span>
                <span className="w-5 h-5 rounded-full bg-white text-indigo-950 flex items-center justify-center text-[11px] font-extrabold">
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
