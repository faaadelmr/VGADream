'use client';

import React, { useState } from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';
import { GPUFitVisualizer3D } from './GPUFitVisualizer3D';
import { GPUFitVisualizer2D } from './GPUFitVisualizer2D';
import { Box, Layers } from 'lucide-react';

interface GPUFitVisualizerProps {
  gpu: GPUSpec;
  pcCase: CaseSpec;
  clearance: ClearanceResult;
  userPsuWattage: number;
  onUserPsuChange: (wattage: number) => void;
  onChangeCaseClick?: () => void;
}

export const GPUFitVisualizer: React.FC<GPUFitVisualizerProps> = ({
  gpu,
  pcCase,
  clearance,
  userPsuWattage,
  onUserPsuChange,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
  const [riserSlotOffsetMm, setRiserSlotOffsetMm] = useState<number>(50);

  const isCompatible = clearance.status !== 'INCOMPATIBLE';

  return (
    <div id="visualizer" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Header Info & View Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] uppercase font-bold border border-cyan-500/20">
              Interactive Hardware Clearance Engine
            </span>
            <span className="text-slate-500 text-xs font-mono">&bull; Active Target</span>
          </div>

          {/* Main Title & Case Spec Info Inline */}
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{gpu.name}</span>
            <span className="text-slate-400 font-normal text-sm sm:text-base">
              in {pcCase.name} ({pcCase.brand})
            </span>
          </h2>

          <div className="text-xs font-mono text-slate-400 mt-1">
            Max Length: <span className="text-cyan-300 font-bold">{pcCase.maxGpuLengthMm} mm</span> &bull; Max Height: <span className="text-indigo-300 font-bold">{pcCase.maxGpuHeightMm} mm</span> &bull; Max Slot: <span className="text-fuchsia-300 font-bold">{pcCase.maxGpuSlotThickness} Slots</span>
          </div>
        </div>

        {/* View Switcher Controls (3D Studio vs 2D Blueprint) */}
        <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center space-x-1 font-mono text-xs self-start lg:self-auto">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === '3d'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            3D Studio View
          </button>

          <button
            onClick={() => setViewMode('2d')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === '2d'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2D Blueprint View
          </button>
        </div>
      </div>

      {/* Render Active View Modes */}
      {viewMode === '3d' && (
        <div>
          <GPUFitVisualizer3D
            gpu={gpu}
            pcCase={pcCase}
            isCompatible={isCompatible}
            lengthMarginMm={clearance.lengthMarginMm}
            riserSlotOffsetMm={riserSlotOffsetMm}
            onRiserSlotOffsetChange={setRiserSlotOffsetMm}
            userPsuWattage={userPsuWattage}
            onUserPsuChange={onUserPsuChange}
          />
        </div>
      )}

      {viewMode === '2d' && (
        <div>
          <GPUFitVisualizer2D
            gpu={gpu}
            pcCase={pcCase}
            clearance={clearance}
            isCompatible={isCompatible}
          />
        </div>
      )}
    </div>
  );
};
