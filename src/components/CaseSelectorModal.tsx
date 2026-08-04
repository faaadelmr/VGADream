'use client';

import React, { useState } from 'react';
import { CaseSpec, CaseFormFactor } from '@/types';
import { INITIAL_CASES } from '@/data/cases';
import { Box, PlusCircle, Check, X, Search, Filter } from 'lucide-react';

interface CaseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCase: CaseSpec;
  onSelectCase: (c: CaseSpec) => void;
}

export const CaseSelectorModal: React.FC<CaseSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCase,
  onSelectCase
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formFactorFilter, setFormFactorFilter] = useState<string>('ALL');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom case form state
  const [customName, setCustomName] = useState('Custom Case Config');
  const [customBrand, setCustomBrand] = useState('Custom Brand');
  const [customFormFactor, setCustomFormFactor] = useState<CaseFormFactor>('SFF / ITX');
  const [customMaxLength, setCustomMaxLength] = useState(320);
  const [customMaxHeight, setCustomMaxHeight] = useState(140);
  const [customMaxSlot, setCustomMaxSlot] = useState(3.0);
  const [customMaxThickness, setCustomMaxThickness] = useState(60);

  if (!isOpen) return null;

  const filteredCases = INITIAL_CASES.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesForm = formFactorFilter === 'ALL' || c.formFactor === formFactorFilter;
    return matchesSearch && matchesForm;
  });

  const handleSaveCustomCase = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomCase: CaseSpec = {
      id: `custom-${Date.now()}`,
      name: customName,
      brand: customBrand,
      formFactor: customFormFactor,
      maxGpuLengthMm: Number(customMaxLength),
      maxGpuHeightMm: Number(customMaxHeight),
      maxGpuSlotThickness: Number(customMaxSlot),
      maxGpuThicknessMm: Number(customMaxThickness),
      supportsVerticalMount: false,
      supportsFrontRadiator: true,
      maxCpuCoolerHeightMm: 150,
      notes: 'Kustomisasi spesifikasi dimensi internal PC Case.'
    };
    onSelectCase(newCustomCase);
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pilih PC Case & Kompartemen</h3>
              <p className="text-xs text-slate-400">Pilih dari database preset atau masukkan kustom dimensi case Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Presets vs Custom Input) */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs font-semibold px-4 pt-2">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
              !isCustomMode
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-4 h-4" /> Database Case Popular
          </button>
          <button
            onClick={() => setIsCustomMode(true)}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
              isCustomMode
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Input Dimensi Custom Manual
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!isCustomMode ? (
            <>
              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari merk atau nama case (e.g. Terra, O11D, FormD)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={formFactorFilter}
                    onChange={(e) => setFormFactorFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">Semua Ukuran (All)</option>
                    <option value="SFF / ITX">SFF / ITX (&lt;20L)</option>
                    <option value="Micro-ATX">Micro-ATX</option>
                    <option value="Mid-Tower">Mid-Tower</option>
                  </select>
                </div>
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCases.map((c) => {
                  const isSelected = selectedCase.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCase(c);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                            {c.brand}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {c.formFactor} {c.volumeLiters ? `(${c.volumeLiters}L)` : ''}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">{c.name}</h4>
                      </div>

                      {/* Dimension metrics pill */}
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-slate-300">
                        <div>
                          <div className="text-[9px] text-slate-500">MAX PANJANG</div>
                          <div className="font-bold text-cyan-300">{c.maxGpuLengthMm}mm</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">MAX TINGGI</div>
                          <div className="font-bold text-indigo-300">{c.maxGpuHeightMm}mm</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">MAX SLOT</div>
                          <div className="font-bold text-fuchsia-300">{c.maxGpuSlotThickness} Slots</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Custom Case Form */
            <form onSubmit={handleSaveCustomCase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1 block">Nama Case Custom</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1 block">Form Factor</label>
                  <select
                    value={customFormFactor}
                    onChange={(e) => setCustomFormFactor(e.target.value as CaseFormFactor)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  >
                    <option value="SFF / ITX">SFF / ITX</option>
                    <option value="Micro-ATX">Micro-ATX</option>
                    <option value="Mid-Tower">Mid-Tower</option>
                    <option value="Full-Tower">Full-Tower</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-mono text-cyan-400 mb-1 block">Max Length (mm)</label>
                  <input
                    type="number"
                    min="150"
                    max="600"
                    required
                    value={customMaxLength}
                    onChange={(e) => setCustomMaxLength(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-indigo-400 mb-1 block">Max Height (mm)</label>
                  <input
                    type="number"
                    min="90"
                    max="250"
                    required
                    value={customMaxHeight}
                    onChange={(e) => setCustomMaxHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-fuchsia-400 mb-1 block">Max Slots</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    required
                    value={customMaxSlot}
                    onChange={(e) => setCustomMaxSlot(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-amber-400 mb-1 block">Thickness (mm)</label>
                  <input
                    type="number"
                    min="20"
                    max="120"
                    required
                    value={customMaxThickness}
                    onChange={(e) => setCustomMaxThickness(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/20"
              >
                Gunakan Dimensi Case Custom Ini
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
