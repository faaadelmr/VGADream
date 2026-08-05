'use client';

import React, { useState } from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';
import { GPUFitVisualizer2D } from './GPUFitVisualizer2D';
import { GPUFitVisualizer3D } from './GPUFitVisualizer3D';

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
  const [engineMode, setEngineMode] = useState<'3D' | '2D'>('2D');
  const [riserSlotOffsetMm, setRiserSlotOffsetMm] = useState<number>(50);

  const psuDifference = userPsuWattage - gpu.recommendedPsuW;
  const isCompatible = clearance.status !== 'INCOMPATIBLE';

  return (
    <div id="visualizer" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] uppercase font-bold border border-cyan-500/20">
              Clearance &amp; Fitment Engine
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

        {/* Engine 3D / 2D Toggle Controls */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setEngineMode('3D')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              engineMode === '3D'
                ? 'bg-linear-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>3D Interactive Studio 🎮</span>
          </button>

          <button
            onClick={() => setEngineMode('2D')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              engineMode === '2D'
                ? 'bg-linear-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>2D Blueprint Vector 📐</span>
          </button>
        </div>
      </div>

      {/* Render Selected Visualizer Engine */}
      <div>
        {engineMode === '3D' ? (
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
        ) : (
          <GPUFitVisualizer2D
            gpu={gpu}
            pcCase={pcCase}
            isCompatible={isCompatible}
            lengthMarginMm={clearance.lengthMarginMm}
            riserSlotOffsetMm={riserSlotOffsetMm}
            onRiserSlotOffsetChange={setRiserSlotOffsetMm}
            userPsuWattage={userPsuWattage}
            onUserPsuChange={onUserPsuChange}
          />
        )}
      </div>

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
            Status: <strong className={clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{clearance.lengthMarginMm >= 0 ? 'Clearance OK' : 'Oversized GPU'}</strong>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Slot Thickness</div>
          <div className="text-sm font-bold text-fuchsia-400">{gpu.slotThickness} Slots</div>
          <div className="text-[10px] text-slate-400">Max Case Slots: <strong className="text-white">{pcCase.maxGpuSlotThickness} Slots</strong></div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Power Connector</div>
          <div className="text-sm font-bold text-amber-400">{gpu.powerConnector}</div>
          <div className="text-[10px] text-slate-400">TDP: <strong className="text-rose-400">{gpu.tdpWatts}</strong> &bull; Min PSU <strong className="text-white">{gpu.recommendedPsuW}W</strong></div>
        </div>
      </div>
    </div>
  );
};
