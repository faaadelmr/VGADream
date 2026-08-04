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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-white">Komparasi Spesifikasi Hardware & Fitment</h3>
            <p className="text-xs text-slate-400 font-mono">
              Membandingkan {comparedGpus.length} GPU terhadap case <span className="text-cyan-400 font-bold">{pcCase.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-all"
          >
            Tutup [X]
          </button>
        </div>

        {/* Matrix Grid Content */}
        <div className="p-4 sm:p-6 overflow-x-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" style={{ minWidth: '700px' }}>
            {comparedGpus.map((gpu) => {
              const clearance = evaluateClearance(gpu, pcCase);
              const formattedSpecString = `${gpu.memorySize} ${gpu.memoryType} ${gpu.busWidth} ${gpu.bandwidth} Boost ${gpu.boostClock}`;

              return (
                <div
                  key={gpu.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 relative"
                >
                  <button
                    onClick={() => onRemoveFromCompare(gpu.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 text-xs font-mono"
                    title="Hapus"
                  >
                    [Hapus]
                  </button>

                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{gpu.manufacturer}</div>
                    <h4 className="text-sm font-bold text-white mb-2 pr-10">{gpu.name}</h4>

                    {/* Status badge */}
                    <div className="mb-3 font-mono">
                      {clearance.status === 'PERFECT_FIT' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          PERFECT FIT
                        </span>
                      ) : clearance.status === 'TIGHT_FIT' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                          TIGHT FIT
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                          OVERSIZED
                        </span>
                      )}
                    </div>

                    {/* Hardware Specs Breakdown */}
                    <div className="space-y-2 text-xs font-mono border-t border-b border-slate-800 py-3 my-2 text-slate-300">
                      <div className="flex justify-between font-bold text-indigo-300">
                        <span>3DMark Time Spy:</span>
                        <span>{gpu.timeSpyScore.toLocaleString()} pts</span>
                      </div>

                      <div className="pt-1">
                        <div className="text-[10px] text-slate-500 mb-0.5">Spesifikasi Hardware:</div>
                        <div className="font-bold text-cyan-300 text-xs leading-normal">{formattedSpecString}</div>
                      </div>

                      <div className="pt-2">
                        <div className="text-[10px] text-slate-500 mb-0.5">Power & PSU (TDP):</div>
                        <div className="text-amber-400 font-bold">{gpu.powerConnector}</div>
                        <div className="text-slate-400 text-[11px]">
                          TDP <strong className="text-rose-400 font-bold">{gpu.tdpWatts}</strong> &bull; Min. PSU {gpu.recommendedPsuW}W
                        </div>
                      </div>

                      <hr className="border-slate-800/80 my-2" />

                      <div className="flex justify-between">
                        <span className="text-slate-500">Dimensi Fisik (P &times; T &times; L):</span>
                        <span className="text-cyan-300 font-bold">{gpu.lengthMm} &times; {gpu.heightMm} &times; {gpu.thicknessMm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ketebalan Slot:</span>
                        <span className="text-fuchsia-300 font-bold">{gpu.slotThickness} Slot</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sisa Margin Length:</span>
                        <span
                          className={`font-bold ${
                            clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {clearance.lengthMarginMm >= 0 ? `+${clearance.lengthMarginMm} mm` : `${clearance.lengthMarginMm} mm`}
                        </span>
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
