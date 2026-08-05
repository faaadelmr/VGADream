'use client';

import React from 'react';
import { CaseSpec, GPUSpec } from '@/types';
import { evaluateClearance } from '@/utils/clearanceCalculator';

interface GPUCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedGpus: GPUSpec[];
  pcCase: CaseSpec;
  onRemoveFromCompare: (gpuId: string) => void;
}

export const GPUCompareModal: React.FC<GPUCompareModalProps> = ({
  isOpen,
  onClose,
  comparedGpus,
  pcCase,
  onRemoveFromCompare
}) => {
  if (!isOpen || comparedGpus.length === 0) return null;

  // Calculate highest/lowest metrics across all compared GPUs for green highlights
  const maxTimeSpy = Math.max(...comparedGpus.map((g) => g.timeSpyScore));
  const maxVram = Math.max(...comparedGpus.map((g) => parseInt(g.memorySize, 10) || 0));
  const maxClearanceMargin = Math.max(...comparedGpus.map((g) => evaluateClearance(g, pcCase).lengthMarginMm));
  const minTdpWatts = Math.min(...comparedGpus.map((g) => parseInt(g.tdpWatts, 10) || 999));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
              <span>Hardware &amp; Fitment Comparison Matrix</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                🟢 Green = Better Spec
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Comparing {comparedGpus.length} GPUs against <span className="text-cyan-400 font-bold">{pcCase.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 font-bold transition-all"
          >
            Close [X]
          </button>
        </div>

        {/* Matrix Grid Content - Fully Responsive & Equal-Height Layout */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full items-stretch">
            {comparedGpus.map((gpu) => {
              const clearance = evaluateClearance(gpu, pcCase);
              const formattedSpecString = `${gpu.memorySize} ${gpu.memoryType} · ${gpu.busWidth} · ${gpu.bandwidth} · Boost ${gpu.boostClock}`;

              const vramGb = parseInt(gpu.memorySize, 10) || 0;
              const tdpW = parseInt(gpu.tdpWatts, 10) || 0;

              const isHighestPerf = comparedGpus.length > 1 && gpu.timeSpyScore === maxTimeSpy;
              const isBestFit = comparedGpus.length > 1 && clearance.lengthMarginMm === maxClearanceMargin;
              const isHighestVram = comparedGpus.length > 1 && vramGb === maxVram && maxVram > 0;
              const isLowestPower = comparedGpus.length > 1 && tdpW === minTdpWatts && minTdpWatts < 999;

              return (
                <div
                  key={gpu.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative shadow-lg h-full"
                >
                  <button
                    onClick={() => onRemoveFromCompare(gpu.id)}
                    className="absolute top-3 right-3 text-xs font-mono text-slate-500 hover:text-rose-400 font-bold transition-colors z-10"
                    title="Remove"
                  >
                    [Remove]
                  </button>

                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    {/* Brand & Name (Fixed min-height for title alignment) */}
                    <div className="min-h-12.5 flex flex-col justify-end">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{gpu.manufacturer}</div>
                      <h4 className="text-sm font-bold text-white pr-12 line-clamp-2">{gpu.name}</h4>
                    </div>

                    {/* Status Badge (Aligned height) */}
                    <div className="font-mono min-h-7 flex items-center">
                      {clearance.status === 'PERFECT_FIT' ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          ✓ PERFECT FIT 🟢
                        </span>
                      ) : clearance.status === 'TIGHT_FIT' ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                          ⚠️ TIGHT FIT
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                          ❌ OVERSIZED
                        </span>
                      )}
                    </div>

                    {/* Hardware Specs Breakdown with Green Winner Highlights */}
                    <div className="space-y-2.5 text-xs font-mono border-t border-b border-slate-800/80 py-3 text-slate-300 flex-1 flex flex-col justify-between">
                      
                      {/* 1. 3DMark Time Spy Benchmark */}
                      <div
                        className={`p-2.5 rounded-lg transition-all min-h-14.5 flex flex-col justify-between ${
                          isHighestPerf
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-900/60 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-400">3DMark Time Spy:</span>
                          {isHighestPerf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              ✓ Better Performance
                            </span>
                          )}
                        </div>
                        <div className={`text-sm font-bold ${isHighestPerf ? 'text-emerald-300' : 'text-indigo-300'}`}>
                          {gpu.timeSpyScore.toLocaleString()} pts
                        </div>
                      </div>

                      {/* 2. Hardware Specs (VRAM) */}
                      <div
                        className={`p-2.5 rounded-lg transition-all min-h-16 flex flex-col justify-between ${
                          isHighestVram
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-900/60 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Hardware Specs:</span>
                          {isHighestVram && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              ✓ Larger VRAM
                            </span>
                          )}
                        </div>
                        <div className={`text-xs font-bold leading-relaxed ${isHighestVram ? 'text-emerald-300' : 'text-cyan-300'}`}>
                          {formattedSpecString}
                        </div>
                      </div>

                      {/* 3. Display Output Ports */}
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 min-h-14.5 flex flex-col justify-between">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Display Outputs:</div>
                        <div className="text-fuchsia-300 font-bold text-xs space-y-0.5">
                          {gpu.displayOutputs.split(', ').slice(0, 3).map((output, idx) => (
                            <div key={idx}>{output}</div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Power & PSU (TDP) */}
                      <div
                        className={`p-2.5 rounded-lg transition-all min-h-16.5 flex flex-col justify-between ${
                          isLowestPower
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-900/60 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Power &amp; PSU (TDP):</span>
                          {isLowestPower && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              ✓ Lower Power
                            </span>
                          )}
                        </div>
                        <div className="text-amber-400 font-bold">{gpu.powerConnector}</div>
                        <div className="text-[11px] text-slate-400">
                          TDP <strong className={isLowestPower ? 'text-emerald-300 font-bold' : 'text-rose-400'}>{gpu.tdpWatts}</strong> &bull; Min PSU <strong className="text-white">{gpu.recommendedPsuW}W</strong>
                        </div>
                      </div>

                      {/* 5. Dimensions & Slot Thickness */}
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 min-h-13 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Dimensions:</span>
                          <span className="text-cyan-300 font-bold">{gpu.lengthMm} &times; {gpu.heightMm} &times; {gpu.thicknessMm} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Slot Thickness:</span>
                          <span className="text-fuchsia-300 font-bold">{gpu.slotThickness} Slots</span>
                        </div>
                      </div>

                      {/* 6. Length Clearance Margin */}
                      <div
                        className={`p-2.5 rounded-lg transition-all min-h-13.5 flex flex-col justify-between ${
                          isBestFit
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-900/60 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-400">Clearance Margin:</span>
                          {isBestFit && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              ✓ Fits / More Clearance
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {clearance.lengthMarginMm >= 0 ? `+${clearance.lengthMarginMm} mm Clearance` : `${clearance.lengthMarginMm} mm Oversized`}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
