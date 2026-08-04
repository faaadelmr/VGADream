'use client';

import React, { useState } from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';

interface GPUFitVisualizerProps {
  gpu: GPUSpec;
  pcCase: CaseSpec;
  clearance: ClearanceResult;
  userPsuWattage: number;
  onChangeUserPsuWattage: (psu: number) => void;
}

export const GPUFitVisualizer: React.FC<GPUFitVisualizerProps> = ({
  gpu,
  pcCase,
  clearance,
  userPsuWattage,
  onChangeUserPsuWattage
}) => {
  const [viewMode, setViewMode] = useState<'side' | 'thickness'>('side');

  // Blueprint scaling ratios
  const maxChamberLength = Math.max(pcCase.maxGpuLengthMm, gpu.lengthMm + 20, 360);
  const maxChamberHeight = Math.max(pcCase.maxGpuHeightMm, gpu.heightMm + 30, 180);

  const caseWidthPct = (pcCase.maxGpuLengthMm / maxChamberLength) * 100;
  const caseHeightPct = (pcCase.maxGpuHeightMm / maxChamberHeight) * 100;

  const gpuWidthPct = (gpu.lengthMm / maxChamberLength) * 100;
  const gpuHeightPct = (gpu.heightMm / maxChamberHeight) * 100;

  const gapMm = clearance.lengthMarginMm;
  const isOverflowLength = gapMm < 0;
  const isOverflowHeight = clearance.heightMarginMm < 0;

  const psuDiff = userPsuWattage - gpu.recommendedPsuW;
  const psuStatusText =
    psuDiff >= 100
      ? 'Sangat Cukup (+100W Headroom)'
      : psuDiff >= 0
      ? 'Cukup'
      : `Kurang ${Math.abs(psuDiff)}W!`;

  const psuStatusColor =
    psuDiff >= 100
      ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
      : psuDiff >= 0
      ? 'text-amber-400 bg-amber-950 border-amber-800'
      : 'text-rose-400 bg-rose-950 border-rose-800 animate-pulse';

  const statusBadge =
    clearance.status === 'PERFECT_FIT' ? (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold shadow-lg shadow-emerald-500/10">
        PERFECT FIT ({clearance.score}/100)
      </div>
    ) : clearance.status === 'TIGHT_FIT' ? (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold shadow-lg shadow-amber-500/10">
        TIGHT FIT ({clearance.score}/100)
      </div>
    ) : (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold shadow-lg shadow-rose-500/10">
        TIDAK MUAT ({clearance.score}/100)
      </div>
    );

  return (
    <div id="visualizer" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">
            Live 2D Blueprint Fitment Engine
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            {gpu.name} <span className="text-slate-500 text-sm font-normal">vs</span> {pcCase.name}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}

          {/* View Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium font-mono">
            <button
              onClick={() => setViewMode('side')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'side' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Panjang &amp; Tinggi
            </button>
            <button
              onClick={() => setViewMode('thickness')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'thickness' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Slot &amp; Ketebalan
            </button>
          </div>
        </div>
      </div>

      {/* Blueprint Visual Rendering Box */}
      <div className="relative bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 sm:p-6 min-h-[280px] flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Top Measurement Indicators */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 px-2 border-b border-slate-800/50 pb-2">
          <div>
            Case Max Length: <span className="text-cyan-400 font-bold">{pcCase.maxGpuLengthMm} mm</span>
          </div>
          <div>
            GPU Length: <span className="text-indigo-400 font-bold">{gpu.lengthMm} mm</span>
          </div>
          <div className={`font-bold ${gapMm >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Gap Clearance: {gapMm >= 0 ? `+${gapMm} mm` : `${gapMm} mm (Overhang)`}
          </div>
        </div>

        {viewMode === 'side' ? (
          /* SIDE PROFILE GRAPHICAL BLUEPRINT */
          <div className="relative w-full h-56 sm:h-64 border border-dashed border-cyan-500/30 rounded-lg p-3 bg-slate-900/40 flex items-end justify-start overflow-visible">
            {/* Case Outer Bounding Box */}
            <div
              className="absolute bottom-3 left-3 border-2 border-cyan-500/60 bg-cyan-950/10 rounded-lg flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
              style={{
                width: `${caseWidthPct}%`,
                height: `${caseHeightPct}%`,
                maxHeight: '90%'
              }}
            >
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-800/50 self-start">
                Case Chamber ({pcCase.maxGpuLengthMm} mm &times; {pcCase.maxGpuHeightMm} mm)
              </span>
            </div>

            {/* GPU Physical Card Overlay */}
            <div
              className={`absolute bottom-3 left-3 border-2 rounded-lg p-2.5 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                isOverflowLength || isOverflowHeight
                  ? 'border-rose-500 bg-rose-950/50 shadow-rose-900/30'
                  : 'border-indigo-400 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-cyan-950/90 shadow-cyan-950/50'
              }`}
              style={{
                width: `${gpuWidthPct}%`,
                height: `${gpuHeightPct}%`,
                maxHeight: '90%'
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white truncate">{gpu.name}</span>
                <span className="text-[10px] font-mono bg-slate-950/90 px-1.5 py-0.5 rounded text-indigo-300 shrink-0">
                  {gpu.lengthMm} mm &times; {gpu.heightMm} mm
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 border-t border-slate-700/60 pt-1 mt-auto">
                <span className="text-amber-300">Power: {gpu.powerConnector}</span>
                <span className="text-slate-400">Min. PSU {gpu.recommendedPsuW}W</span>
              </div>
            </div>

            {!isOverflowLength && (
              <div
                className="absolute bottom-1/2 translate-y-1/2 flex items-center justify-center font-mono text-xs text-emerald-400 bg-slate-950/90 border border-emerald-500/40 px-2 py-0.5 rounded-md shadow"
                style={{
                  left: `calc(12px + ${gpuWidthPct}%)`,
                  width: `calc(${caseWidthPct - gpuWidthPct}% - 4px)`
                }}
              >
                &larr; {gapMm} mm Sisa Gap &rarr;
              </div>
            )}

            {isOverflowLength && (
              <div className="absolute right-4 top-4 bg-rose-950/90 border border-rose-500/80 p-2 px-3 rounded-lg text-rose-300 font-mono text-xs flex items-center gap-2 shadow-xl animate-bounce">
                <span>MELEBIHI PANJANG CASE SEBESAR {Math.abs(gapMm)} mm!</span>
              </div>
            )}
          </div>
        ) : (
          /* THICKNESS & EXPANSION SLOT BLUEPRINT */
          <div className="relative w-full h-56 sm:h-64 border border-dashed border-cyan-500/30 rounded-lg p-4 bg-slate-900/40 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-slate-400 mb-2">Batas Slot Case</span>
              <div className="w-24 bg-slate-950 border-2 border-cyan-500/70 rounded-xl p-3 flex flex-col gap-1.5 text-center">
                <span className="text-xl font-extrabold text-cyan-400 font-mono">
                  {pcCase.maxGpuSlotThickness}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SLOTS ({pcCase.maxGpuThicknessMm} mm)</span>
              </div>
            </div>

            <div className="text-slate-600 font-bold text-xl">VS</div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-slate-400 mb-2">Ukuran Ketebalan GPU</span>
              <div
                className={`w-24 bg-slate-950 border-2 rounded-xl p-3 flex flex-col gap-1.5 text-center ${
                  clearance.slotMargin < 0 ? 'border-rose-500 text-rose-400' : 'border-indigo-500 text-indigo-300'
                }`}
              >
                <span className="text-xl font-extrabold font-mono">{gpu.slotThickness}</span>
                <span className="text-[10px] font-mono">SLOTS ({gpu.thicknessMm} mm)</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl max-w-xs text-xs font-mono">
              <div className="text-slate-400 mb-1">Analisa Slot Clearance:</div>
              {clearance.slotMargin >= 0 ? (
                <div className="text-emerald-400 font-semibold">
                  Aman! Masih tersisa {clearance.slotMargin} slot ({clearance.thicknessMarginMm} mm sisa).
                </div>
              ) : (
                <div className="text-rose-400 font-semibold">
                  Bentuk GPU terlalu tebal sebesar {Math.abs(clearance.slotMargin)} slot ({Math.abs(clearance.thicknessMarginMm)} mm)!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Useful Interactive Feature: User PSU Capacity Calculator */}
      <div className="mt-4 font-mono text-xs">
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
          <div>
            <div className="text-slate-300 font-bold mb-0.5">Kapasitas Power Supply (PSU) Anda:</div>
            <div className="text-[10px] text-slate-400">Rekomendasi GPU: {gpu.recommendedPsuW}W</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={userPsuWattage}
              onChange={(e) => onChangeUserPsuWattage(Number(e.target.value))}
              className="bg-slate-900 text-white text-xs font-mono font-bold border border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value={500}>500 Watt</option>
              <option value={550}>550 Watt</option>
              <option value={650}>650 Watt</option>
              <option value={750}>750 Watt</option>
              <option value={850}>850 Watt</option>
              <option value={1000}>1000 Watt</option>
              <option value={1200}>1200 Watt</option>
            </select>
            <span className={`px-2 py-1 rounded border text-[10px] font-bold ${psuStatusColor}`}>
              {psuStatusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
