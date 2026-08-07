'use client';

import React from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';
import { Tag, TrendingUp, X } from 'lucide-react';

import { formatPowerConnector } from '@/utils/powerConnector';

interface GPUTableListProps {
  gpus: { gpu: GPUSpec; clearance: ClearanceResult }[];
  pcCase: CaseSpec;
  visualizerGpuId: string;
  showVisualizer: boolean;
  onSelectForVisualizer: (gpu: GPUSpec) => void;
  comparedGpus: GPUSpec[];
  onToggleCompare: (gpu: GPUSpec) => void;
  onOpenSetPrice: (gpu: GPUSpec) => void;
  onDeletePrice: (gpuId: string) => void;
}

export const GPUTableList: React.FC<GPUTableListProps> = ({
  gpus,
  visualizerGpuId,
  showVisualizer,
  onSelectForVisualizer,
  comparedGpus,
  onToggleCompare,
  onOpenSetPrice,
  onDeletePrice,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Fitment Status</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">GPU &amp; Manufacturer</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">3DMark &amp; Harga</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Display Outputs</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Dimension</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Power &amp; PSU</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {gpus.map(({ gpu, clearance }) => {
              const isSelected = visualizerGpuId === gpu.id && showVisualizer;
              const isCompared = comparedGpus.some((g) => g.id === gpu.id);

              const priceInMillions = gpu.priceIdr ? gpu.priceIdr / 1_000_000 : 0;
              const ppRatio = priceInMillions > 0 ? Math.round(gpu.timeSpyScore / priceInMillions) : 0;

              const statusBadge =
                clearance.status === 'PERFECT_FIT' ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    PERFECT FIT
                  </span>
                ) : clearance.status === 'TIGHT_FIT' ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                    TIGHT FIT
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
                    OVERSIZED
                  </span>
                );

              const formattedSpecString = `${gpu.memorySize} ${gpu.memoryType} ${gpu.busWidth} ${gpu.bandwidth} Boost ${gpu.boostClock}`;

              return (
                <tr
                  key={gpu.id}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    isSelected ? 'bg-cyan-950/40' : ''
                  }`}
                >
                  {/* Status & Margin */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="space-y-1">
                      {statusBadge}
                      <div
                        className={`text-[10px] font-semibold ${
                          clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        Margin: {clearance.lengthMarginMm >= 0 ? `+${clearance.lengthMarginMm} mm` : `${clearance.lengthMarginMm} mm`}
                      </div>
                    </div>
                  </td>

                  {/* Name & Manufacturer */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div>
                      <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                        {gpu.manufacturer} &bull; {gpu.chipset}
                      </div>
                      <div className="font-sans font-bold text-white text-xs">{gpu.name}</div>
                      <div className="text-[10px] text-cyan-300 font-bold mt-0.5">
                        {formattedSpecString}
                      </div>
                    </div>
                  </td>

                  {/* 3DMark Time Spy Benchmark Score Cell with Integrated Price Input */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="font-bold text-indigo-400 text-xs">
                      {gpu.timeSpyScore.toLocaleString('id-ID')} pts
                    </div>

                    <div className="mt-1 flex flex-col items-end gap-1">
                      {gpu.priceIdr ? (
                        <div className="inline-flex items-center gap-1 bg-slate-950/90 border border-emerald-500/30 rounded-lg px-1.5 py-0.5">
                          <button
                            onClick={() => onOpenSetPrice(gpu)}
                            className="text-emerald-400 font-bold text-[10px] hover:underline"
                            title="Klik untuk ubah harga"
                          >
                            Rp {gpu.priceIdr.toLocaleString('id-ID')}
                          </button>

                          {ppRatio > 0 && (
                            <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {ppRatio.toLocaleString('id-ID')} pts/1jt
                            </span>
                          )}

                          {/* Icon X untuk menghapus harga */}
                          <button
                            onClick={() => onDeletePrice(gpu.id)}
                            title="Hapus Inputan Harga"
                            className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenSetPrice(gpu)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-all"
                        >
                          <Tag className="w-2.5 h-2.5 text-emerald-400" />
                          + Input Harga
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Display Outputs Column */}
                  <td className="py-2.5 px-3 font-bold text-fuchsia-300 text-xs leading-snug">
                    {gpu.displayOutputs.split(', ').slice(0, 3).map((output, idx) => (
                      <div key={idx} className="whitespace-nowrap">{output}</div>
                    ))}
                  </td>

                  {/* Dimensions (L x H x W) */}
                  <td className="py-2.5 px-3 text-xs leading-snug whitespace-nowrap">
                    <div className="text-cyan-300 font-bold">L: {gpu.lengthMm} mm</div>
                    <div className="text-indigo-300 font-bold">H: {gpu.heightMm} mm</div>
                    <div className="text-fuchsia-300 font-bold">W: {gpu.thicknessMm} mm</div>
                  </td>

                  {/* Power & PSU + TDP */}
                  <td className="py-2.5 px-3 text-xs leading-snug whitespace-nowrap">
                    <div className="text-amber-400 font-bold text-[10px]">{formatPowerConnector(gpu.powerConnector)}</div>
                    <div className="text-rose-400 font-bold text-[10px]">TDP {gpu.tdpWatts}W</div>
                    <div className="text-slate-300 font-semibold text-[10px]">Min. PSU {gpu.recommendedPsuW}W</div>
                  </td>

                  {/* Actions (Stacked Vertically Top-to-Bottom) */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <div className="flex flex-col items-stretch justify-center gap-1 w-24 mx-auto">
                      <button
                        onClick={() => onToggleCompare(gpu)}
                        className={`w-full py-1 px-2 rounded text-[10px] font-mono transition-all border text-center ${
                          isCompared
                            ? 'bg-fuchsia-950 border-fuchsia-600 text-fuchsia-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isCompared ? '✓ Selected' : '+ Compare'}
                      </button>

                      <button
                        onClick={() => onSelectForVisualizer(gpu)}
                        className={`w-full py-1 px-2 rounded text-[10px] font-bold font-mono transition-all text-center ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                        }`}
                      >
                        {isSelected ? 'Studio Active' : 'Visual Studio'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
