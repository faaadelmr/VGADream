'use client';

import React, { useState } from 'react';
import { CaseSpec, GPUSpec } from '@/types';
import { Database, Plus, Check, Trash2, Search, Edit3 } from 'lucide-react';

interface MasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterGpus: GPUSpec[];
  dreamGpus: GPUSpec[];
  onAddGpuToDreamList: (gpu: GPUSpec) => void;
  onRemoveGpuFromDreamList: (gpuId: string) => void;
  onOpenAddModal: () => void;
  onEditGpu: (gpu: GPUSpec) => void;
  onDeleteGpu: (gpuId: string) => void;
  activeCase: CaseSpec;
}

export const MasterCatalogModal: React.FC<MasterCatalogModalProps> = ({
  isOpen,
  onClose,
  masterGpus,
  dreamGpus,
  onAddGpuToDreamList,
  onRemoveGpuFromDreamList,
  onOpenAddModal,
  onEditGpu,
  onDeleteGpu,
  activeCase
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  if (!isOpen) return null;

  const dreamGpuIds = new Set(dreamGpus.map((g) => g.id));

  // Filter Master Catalog GPUs
  const filteredGpus = masterGpus.filter((gpu) => {
    const matchesSearch =
      !searchTerm ||
      gpu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gpu.chipset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gpu.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'ALL' || gpu.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Master GPU Catalog
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  {masterGpus.length} GPUs Available
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Select GPUs from Master Catalog to add to your active Dream VGA List for clearance evaluation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add GPU Spec
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search GPUs in Master Catalog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
            {['ALL', 'NVIDIA', 'AMD', 'Intel'].map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  selectedBrand === b
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Master Catalog List Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredGpus.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Database className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">No GPUs found in Master Catalog.</p>
              <p className="text-xs text-slate-500">Use the Add GPU Spec feature to insert new GPU specifications.</p>
            </div>
          ) : (
            filteredGpus.map((gpu) => {
              const isInDreamList = dreamGpuIds.has(gpu.id);
              const fitsLength = gpu.lengthMm <= activeCase.maxGpuLengthMm;

              return (
                <div
                  key={gpu.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isInDreamList
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* GPU Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          gpu.brand === 'NVIDIA'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : gpu.brand === 'AMD'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {gpu.brand}
                      </span>
                      <h4 className="text-sm font-bold text-white">{gpu.name}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                      <span>Length: <strong className={fitsLength ? 'text-emerald-400' : 'text-rose-400'}>{gpu.lengthMm} mm</strong></span>
                      <span>Slots: <strong className="text-slate-200">{gpu.slotThickness} Slot ({gpu.thicknessMm}mm)</strong></span>
                      <span>TDP: <strong className="text-amber-400">{gpu.tdpWatts}</strong></span>
                      <span>3DMark: <strong className="text-cyan-400">{gpu.timeSpyScore.toLocaleString()} pts</strong></span>
                    </div>
                  </div>

                  {/* Edit, Delete, & Add/Remove Action Buttons */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    {/* Edit Button */}
                    <button
                      onClick={() => onEditGpu(gpu)}
                      title="Edit GPU Specification"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${gpu.name}" from Master Catalog?`)) {
                          onDeleteGpu(gpu.id);
                        }
                      }}
                      title="Delete GPU from Master Database"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 text-xs transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>

                    {/* Add to Dream List Toggle */}
                    {isInDreamList ? (
                      <button
                        onClick={() => onRemoveGpuFromDreamList(gpu.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        Added
                      </button>
                    ) : (
                      <button
                        onClick={() => onAddGpuToDreamList(gpu)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to List
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between font-mono text-xs text-slate-400">
          <div>
            Total Added to Dream List: <strong className="text-cyan-400">{dreamGpus.length} GPU(s)</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
