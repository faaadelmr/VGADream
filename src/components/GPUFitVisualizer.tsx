'use client';

import React, { useState } from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';
import { GPUFitVisualizer3D } from './GPUFitVisualizer3D';
import { GPUFitVisualizer2D } from './GPUFitVisualizer2D';
import { Box, Layers, Columns } from 'lucide-react';

interface GPUFitVisualizerProps {
  gpu: GPUSpec;
  pcCase: CaseSpec;
  clearance: ClearanceResult;
  userPsuWattage: number;
  onUserPsuChange: (wattage: number) => void;
}

export const GPUFitVisualizer: React.FC<GPUFitVisualizerProps> = ({
  gpu,
  pcCase,
  clearance,
  userPsuWattage,
  onUserPsuChange
}) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
  const [riserSlotOffsetMm, setRiserSlotOffsetMm] = useState<number>(50);

  const psuDifference = userPsuWattage - gpu.recommendedPsuW;
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
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
            {gpu.name}{' '}
            <span className="text-slate-400 font-normal text-sm sm:text-base">
              in {pcCase.name} ({pcCase.brand})
            </span>
          </h2>
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

      {/* Fitness Callout Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dimensions (L &times; H &times; W)</div>
          <div className="text-sm font-bold text-cyan-400">
            {gpu.lengthMm} &times; {gpu.heightMm} &times; {gpu.thicknessMm} mm
          </div>
          <div className="text-[10px] text-slate-400">Max Case Length: <strong className="text-white">{pcCase.maxGpuLengthMm} mm</strong></div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Length Margin</div>
          <div
            className={`text-sm font-bold ${
              clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {clearance.lengthMarginMm >= 0 ? `+${clearance.lengthMarginMm} mm` : `${clearance.lengthMarginMm} mm`}
          </div>
          <div className="text-[10px] text-slate-400">
            {clearance.lengthMarginMm >= 0 ? 'Clearance Passed' : 'Overlength Collision'}
          </div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Slot Thickness</div>
          <div className="text-sm font-bold text-fuchsia-400">
            {gpu.slotThickness} Slots ({gpu.thicknessMm} mm)
          </div>
          <div className="text-[10px] text-slate-400">Case Max Slots: <strong className="text-white">{pcCase.maxGpuSlotThickness} Slots</strong></div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Power Connector &amp; PSU</div>
          <div className="text-xs font-bold text-amber-400 truncate">
            {gpu.powerConnector} ({gpu.tdpWatts})
          </div>
          <div className="text-[10px] text-slate-400">
            PSU Setup: <strong className={psuDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{userPsuWattage}W ({psuDifference >= 0 ? `+${psuDifference}W` : `${psuDifference}W`})</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

