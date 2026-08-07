'use client';

import React from 'react';
import { ClearanceResult, GPUSpec } from '@/types';
import { Tag, TrendingUp, X } from 'lucide-react';

import { formatPowerConnector } from '@/utils/powerConnector';

interface GPUCardProps {
  gpu: GPUSpec;
  clearance: ClearanceResult;
  isSelectedForVisualizer: boolean;
  onSelectForVisualizer: (gpu: GPUSpec) => void;
  isCompared: boolean;
  onToggleCompare: (gpu: GPUSpec) => void;
  onOpenSetPrice?: (gpu: GPUSpec) => void;
  onDeletePrice?: (gpuId: string) => void;
}

export const GPUCard: React.FC<GPUCardProps> = ({
  gpu,
  clearance,
  isSelectedForVisualizer,
  onSelectForVisualizer,
  isCompared,
  onToggleCompare,
  onOpenSetPrice,
  onDeletePrice
}) => {
  const statusBadge =
    clearance.status === 'PERFECT_FIT' ? (
      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
        PERFECT FIT
      </span>
    ) : clearance.status === 'TIGHT_FIT' ? (
      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
        TIGHT FIT
      </span>
    ) : (
      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
        OVERSIZED
      </span>
    );

  const formattedSpecString = `${gpu.memorySize} ${gpu.memoryType} ${gpu.busWidth} ${gpu.bandwidth} Boost ${gpu.boostClock}`;

  const priceInMillions = gpu.priceIdr ? gpu.priceIdr / 1_000_000 : 0;
  const ppRatio = priceInMillions > 0 ? Math.round(gpu.timeSpyScore / priceInMillions) : 0;

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-xl ${
        isSelectedForVisualizer
          ? 'border-cyan-500 shadow-cyan-500/10 ring-1 ring-cyan-500/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header & Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
            {gpu.manufacturer} &bull; {gpu.chipset}
          </span>
          {statusBadge}
        </div>

        <h3 className="text-base font-bold text-white leading-tight mb-2">{gpu.name}</h3>

        {/* Integrated 3DMark Time Spy Score Banner & Price Input */}
        <div className="bg-indigo-950/60 border border-indigo-800/50 rounded-xl p-3 mb-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-indigo-300 font-bold uppercase">3DMark Time Spy:</span>
            <span className="text-sm font-extrabold text-indigo-300">
              {gpu.timeSpyScore.toLocaleString('id-ID')} pts
            </span>
          </div>

          {/* Embedded Price & P/P Section */}
          <div className="mt-2.5 pt-2 border-t border-indigo-800/40 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Harga &amp; P/P:</span>
            {gpu.priceIdr ? (
              <div className="inline-flex items-center gap-1.5 bg-slate-950/90 border border-emerald-500/30 rounded-lg px-2 py-1">
                <button
                  onClick={() => onOpenSetPrice && onOpenSetPrice(gpu)}
                  className="text-emerald-400 font-bold text-xs hover:underline"
                  title="Ubah harga"
                >
                  Rp {gpu.priceIdr.toLocaleString('id-ID')}
                </button>
                {ppRatio > 0 && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {ppRatio.toLocaleString('id-ID')} pts/1jt
                  </span>
                )}
                {onDeletePrice && (
                  <button
                    onClick={() => onDeletePrice(gpu.id)}
                    title="Hapus Inputan Harga"
                    className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onOpenSetPrice && (
                <button
                  onClick={() => onOpenSetPrice(gpu)}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Tag className="w-3 h-3 text-emerald-400" />
                  + Input Harga
                </button>
              )
            )}
          </div>
        </div>

        {/* Display Outputs Badge */}
        <div className="bg-fuchsia-950/40 border border-fuchsia-800/40 rounded-xl px-3 py-1.5 mb-3 text-xs font-mono">
          <div className="text-[10px] text-fuchsia-400 font-bold uppercase mb-0.5">Display Output Ports:</div>
          <div className="text-fuchsia-200 font-bold text-xs">{gpu.displayOutputs}</div>
        </div>

        {/* Hardware Specifications */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs font-mono mb-3">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Hardware Specs:</div>
          <div className="font-bold text-cyan-300 leading-snug">{formattedSpecString}</div>
        </div>

        {/* Physical Dimension Grid (Length x Height x Width) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 rounded-xl p-2.5 text-center font-mono text-xs mb-3 border border-slate-800/60">
          <div>
            <div className="text-[10px] text-slate-500">Length (L)</div>
            <div className="font-bold text-cyan-400">{gpu.lengthMm} mm</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Height (H)</div>
            <div className="font-bold text-indigo-400">{gpu.heightMm} mm</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Width (W)</div>
            <div className="font-bold text-fuchsia-400">{gpu.thicknessMm} mm</div>
          </div>
        </div>

        {/* Power & PSU Info */}
        <div className="space-y-1 text-xs font-mono text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
          <div className="flex justify-between">
            <span className="text-slate-500">Power Connector:</span>
            <span className="text-amber-400 font-bold">{formatPowerConnector(gpu.powerConnector)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">TDP Wattage:</span>
            <span className="text-rose-400 font-bold">{gpu.tdpWatts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Recommended PSU:</span>
            <span className="text-white font-bold">{gpu.recommendedPsuW}W</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800/60">
            <span className="text-slate-500">Slot Thickness:</span>
            <span className="text-slate-300 font-bold">{gpu.slotThickness} Slots</span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-2 flex items-center gap-2 border-t border-slate-800/60">
        <button
          onClick={() => onToggleCompare(gpu)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
            isCompared
              ? 'bg-fuchsia-950 border-fuchsia-600 text-fuchsia-300'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {isCompared ? '✓ Selected' : '+ Compare'}
        </button>

        <button
          onClick={() => onSelectForVisualizer(gpu)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
            isSelectedForVisualizer
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
          }`}
        >
          {isSelectedForVisualizer ? 'Studio Active' : 'Visual Studio'}
        </button>
      </div>
    </div>
  );
};
