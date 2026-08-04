'use client';

import React from 'react';
import { ClearanceResult, GPUSpec } from '@/types';

interface GPUCardProps {
  gpu: GPUSpec;
  clearance: ClearanceResult;
  isSelectedInVisualizer: boolean;
  onSelectForVisualizer: (gpu: GPUSpec) => void;
  isCompared: boolean;
  onToggleCompare: (gpu: GPUSpec) => void;
}

export const GPUCard: React.FC<GPUCardProps> = ({
  gpu,
  clearance,
  isSelectedInVisualizer,
  onSelectForVisualizer,
  isCompared,
  onToggleCompare
}) => {
  const statusBadge =
    clearance.status === 'PERFECT_FIT' ? (
      <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
        PERFECT FIT
      </span>
    ) : clearance.status === 'TIGHT_FIT' ? (
      <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold">
        TIGHT FIT
      </span>
    ) : (
      <span className="inline-block px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[11px] font-bold">
        TIDAK MUAT
      </span>
    );

  const formattedSpecString = `${gpu.memorySize} ${gpu.memoryType} ${gpu.busWidth} ${gpu.bandwidth} Boost ${gpu.boostClock}`;

  return (
    <div
      className={`bg-slate-900/80 border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between hover:border-slate-700 ${
        isSelectedInVisualizer
          ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-slate-900'
          : 'border-slate-800/80'
      }`}
    >
      <div>
        {/* Top Header: Brand & Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block mb-0.5">
              {gpu.manufacturer} &bull; {gpu.chipset}
            </span>
            <h3 className="text-sm font-bold text-white leading-snug">{gpu.name}</h3>
          </div>
          {statusBadge}
        </div>

        {/* 3DMark Time Spy Benchmark Score Pill */}
        <div className="flex items-center justify-between text-xs font-mono bg-indigo-950/60 border border-indigo-800/50 p-2 rounded-xl text-indigo-300 my-2">
          <span>3DMark Time Spy:</span>
          <span className="font-bold text-indigo-200">{gpu.timeSpyScore.toLocaleString()} pts</span>
        </div>

        {/* Combined Hardware Spec Pill */}
        <div className="my-2 bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 font-bold">
          {formattedSpecString}
        </div>

        {/* 3 Core Dimension Stats (P x T x L) */}
        <div className="my-2.5 grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
          <div>
            <div className="text-[9px] text-slate-400 uppercase">Panjang (P)</div>
            <div className="text-xs font-bold text-cyan-300">{gpu.lengthMm} mm</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400 uppercase">Tinggi (T)</div>
            <div className="text-xs font-bold text-indigo-300">{gpu.heightMm} mm</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400 uppercase">Lebar (L)</div>
            <div className="text-xs font-bold text-fuchsia-300">{gpu.thicknessMm} mm</div>
          </div>
        </div>

        {/* Clearance Margin Bar */}
        <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80 mb-2.5">
          <span className="text-slate-400">Sisa Ruang Panjang:</span>
          <span
            className={`font-bold ${
              clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {clearance.lengthMarginMm >= 0
              ? `+${clearance.lengthMarginMm} mm`
              : `${clearance.lengthMarginMm} mm (Nongol)`}
          </span>
        </div>

        {/* Power & PSU + TDP Strip */}
        <div className="mb-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
          <span className="text-amber-400 font-bold">{gpu.powerConnector}</span>
          <span className="text-slate-400 text-[11px]">
            TDP <strong className="text-rose-400 font-bold">{gpu.tdpWatts}</strong> &bull; Min. PSU {gpu.recommendedPsuW}W
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 font-mono text-xs">
        <button
          onClick={() => onToggleCompare(gpu)}
          className={`px-2.5 py-1.5 rounded-lg border transition-all ${
            isCompared
              ? 'bg-fuchsia-950 border-fuchsia-600 text-fuchsia-300 font-bold'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {isCompared ? '✓ Terpilih' : '+ Komparasi'}
        </button>

        <button
          onClick={() => onSelectForVisualizer(gpu)}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            isSelectedInVisualizer
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
          }`}
        >
          {isSelectedInVisualizer ? 'Blueprint Aktif' : 'Cek Blueprint'}
        </button>
      </div>
    </div>
  );
};
