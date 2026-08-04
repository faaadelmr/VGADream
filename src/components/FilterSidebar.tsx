'use client';

import React from 'react';
import { FitStatus, GPUBrand } from '@/types';
import { SlidersHorizontal, Search, ShieldCheck, Check, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  searchTerm: string;
  onSearchChange: (s: string) => void;
  selectedBrand: string;
  onBrandChange: (b: string) => void;
  maxLengthFilter: number;
  onMaxLengthChange: (l: number) => void;
  maxSlotFilter: number;
  onMaxSlotChange: (s: number) => void;
  fitStatusFilter: string; // 'ALL' | 'COMPATIBLE' | 'PERFECT_FIT'
  onFitStatusFilterChange: (st: string) => void;
  selectedManufacturers: string[];
  onToggleManufacturer: (m: string) => void;
  onResetFilters: () => void;
}

const MANUFACTURERS = ['ASUS', 'MSI', 'Gigabyte', 'Sapphire', 'Zotac', 'PowerColor', 'INNO3D', 'Founders Edition'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchTerm,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  maxLengthFilter,
  onMaxLengthChange,
  maxSlotFilter,
  onMaxSlotChange,
  fitStatusFilter,
  onFitStatusFilterChange,
  selectedManufacturers,
  onToggleManufacturer,
  onResetFilters
}) => {
  return (
    <aside className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-6 backdrop-blur-xl shadow-xl">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>Filter Dimensi Presisi</span>
        </div>
        <button
          onClick={onResetFilters}
          className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* 1. Search Bar */}
      <div>
        <label className="text-xs font-mono text-slate-400 mb-1.5 block">Cari Model / Seri GPU</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search RTX 4080, Strix, Sapphire..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 2. Compatibility Filter Buttons */}
      <div>
        <label className="text-xs font-mono text-slate-400 mb-2 block">Status Kompatibilitas</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => onFitStatusFilterChange('ALL')}
            className={`py-1.5 rounded-lg transition-all ${
              fitStatusFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => onFitStatusFilterChange('COMPATIBLE')}
            className={`py-1.5 rounded-lg transition-all ${
              fitStatusFilter === 'COMPATIBLE'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Muat (Fit)
          </button>
          <button
            onClick={() => onFitStatusFilterChange('PERFECT_FIT')}
            className={`py-1.5 rounded-lg transition-all ${
              fitStatusFilter === 'PERFECT_FIT'
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Perfect
          </button>
        </div>
      </div>

      {/* 3. Length Limit Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono text-slate-400">Batas Maks Panjang GPU</label>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            &le; {maxLengthFilter}mm
          </span>
        </div>
        <input
          type="range"
          min="150"
          max="360"
          step="5"
          value={maxLengthFilter}
          onChange={(e) => onMaxLengthChange(Number(e.target.value))}
          className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
          <span>150mm (Compact ITX)</span>
          <span>360mm (Giant 4090)</span>
        </div>
      </div>

      {/* 4. Slot Thickness Filter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono text-slate-400">Batas Maks Slot Thickness</label>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
            &le; {maxSlotFilter} Slots
          </span>
        </div>
        <input
          type="range"
          min="2.0"
          max="4.0"
          step="0.25"
          value={maxSlotFilter}
          onChange={(e) => onMaxSlotChange(Number(e.target.value))}
          className="w-full accent-indigo-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
          <span>2.0 Slots (Dual Slot)</span>
          <span>4.0 Slots (Quad Slot)</span>
        </div>
      </div>

      {/* 5. Brand Selection */}
      <div>
        <label className="text-xs font-mono text-slate-400 mb-2 block">Brand Chipset</label>
        <div className="flex gap-2">
          {['ALL', 'NVIDIA', 'AMD', 'Intel'].map((brand) => (
            <button
              key={brand}
              onClick={() => onBrandChange(brand)}
              className={`flex-1 py-1.5 text-xs font-mono rounded-xl border transition-all ${
                selectedBrand === brand
                  ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-lg shadow-cyan-600/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Manufacturer Checklist */}
      <div>
        <label className="text-xs font-mono text-slate-400 mb-2 block">Produsen / Vendor (AIB)</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
          {MANUFACTURERS.map((m) => {
            const isChecked = selectedManufacturers.includes(m);
            return (
              <label
                key={m}
                onClick={() => onToggleManufacturer(m)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                  isChecked
                    ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="truncate">{m}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
