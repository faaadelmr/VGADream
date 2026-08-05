'use client';

import React, { useState } from 'react';
import { INITIAL_CASES } from '@/data/cases';
import { CaseSpec } from '@/types';

interface CaseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCase: CaseSpec;
  onSelectCase: (pcCase: CaseSpec) => void;
}

export const CaseSelectorModal: React.FC<CaseSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCase,
  onSelectCase
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCases = INITIAL_CASES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-white">Select Target PC Case Chassis</h3>
            <p className="text-xs text-slate-400 font-mono">
              Choose a PC case to evaluate clearance margins and fitment status
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-all"
          >
            Close [X]
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40">
          <input
            type="text"
            placeholder="Search PC Case by name or brand (e.g. Fractal, Lian Li, NR200)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Case List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredCases.map((c) => {
            const isSelected = c.id === selectedCase.id;

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectCase(c);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{c.brand}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {c.formFactor}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {c.volumeLiters} Liters
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{c.name}</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Form Factor: {c.formFactor} &bull; Max GPU Length: {c.maxGpuLengthMm}mm &bull; Max Slots: {c.maxGpuSlotThickness} Slots
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 min-w-[200px]">
                  <div>
                    <div className="text-[10px] text-slate-500">Max Length</div>
                    <div className="font-bold text-cyan-400">{c.maxGpuLengthMm} mm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Max Slots</div>
                    <div className="font-bold text-indigo-400">{c.maxGpuSlotThickness} Slots</div>
                  </div>
                  <button
                    className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Active' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
