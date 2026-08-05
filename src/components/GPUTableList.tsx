'use client';

import React from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';

interface GPUTableListProps {
  gpus: { gpu: GPUSpec; clearance: ClearanceResult }[];
  pcCase: CaseSpec;
  visualizerGpuId: string;
  showVisualizer: boolean;
  onSelectForVisualizer: (gpu: GPUSpec) => void;
  comparedGpus: GPUSpec[];
  onToggleCompare: (gpu: GPUSpec) => void;
}

export const GPUTableList: React.FC<GPUTableListProps> = ({
  gpus,
  pcCase,
  visualizerGpuId,
  showVisualizer,
  onSelectForVisualizer,
  comparedGpus,
  onToggleCompare
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Fitment Status</th>
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap">GPU &amp; Manufacturer</th>
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right min-w-[140px] w-36">3DMark Time Spy</th>
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Display Outputs</th>
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Dimension</th>
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Power &amp; PSU (TDP)</th>
              <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {gpus.map(({ gpu, clearance }) => {
              const isSelected = visualizerGpuId === gpu.id && showVisualizer;
              const isCompared = comparedGpus.some((g) => g.id === gpu.id);

              const statusBadge =
                clearance.status === 'PERFECT_FIT' ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    PERFECT FIT
                  </span>
                ) : clearance.status === 'TIGHT_FIT' ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                    TIGHT FIT
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
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
                  <td className="py-3.5 px-4 whitespace-nowrap">
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
                  <td className="py-3.5 px-4 whitespace-nowrap">
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

                  {/* 3DMark Time Spy Benchmark Score Cell */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-indigo-400 text-xs min-w-[140px] w-36">
                    {gpu.timeSpyScore.toLocaleString()} pts
                  </td>

                  {/* Display Outputs Column */}
                  <td className="py-3.5 px-4 font-bold text-fuchsia-300 text-xs leading-snug">
                    {gpu.displayOutputs.split(', ').slice(0, 3).map((output, idx) => (
                      <div key={idx} className="whitespace-nowrap">{output}</div>
                    ))}
                  </td>

                  {/* Dimensions (L x H x W) */}
                  <td className="py-3.5 px-4 text-xs leading-snug whitespace-nowrap">
                    <div className="text-cyan-300 font-bold">L: {gpu.lengthMm} mm</div>
                    <div className="text-indigo-300 font-bold">H: {gpu.heightMm} mm</div>
                    <div className="text-fuchsia-300 font-bold">W: {gpu.thicknessMm} mm</div>
                  </td>

                  {/* Power & PSU + TDP */}
                  <td className="py-3.5 px-4 text-xs leading-snug whitespace-nowrap">
                    <div className="text-amber-400 font-bold text-[11px]">{gpu.powerConnector}</div>
                    <div className="text-rose-400 font-bold text-[10px]">TDP {gpu.tdpWatts}W</div>
                    <div className="text-slate-300 font-semibold text-[10px]">Min. PSU {gpu.recommendedPsuW}W</div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onToggleCompare(gpu)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all border ${
                          isCompared
                            ? 'bg-fuchsia-950 border-fuchsia-600 text-fuchsia-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isCompared ? '✓ Selected' : '+ Compare'}
                      </button>

                      <button
                        onClick={() => onSelectForVisualizer(gpu)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all ${
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
