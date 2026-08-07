'use client';

import React, { useState, useEffect } from 'react';
import { INITIAL_CASES } from '@/data/cases';
import { CaseSpec } from '@/types';

interface CaseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCase: CaseSpec;
  onSelectCase: (pcCase: CaseSpec) => void;
  onOpenAddCaseModal?: () => void;
  onEditCase?: (pcCase: CaseSpec) => void;
  onDeleteCase?: (caseId: string) => void;
  allCasesOverride?: CaseSpec[];
}

export const CaseSelectorModal: React.FC<CaseSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCase,
  onSelectCase,
  onOpenAddCaseModal,
  onEditCase,
  onDeleteCase,
  allCasesOverride
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customCases, setCustomCases] = useState<CaseSpec[]>([]);
  const [deletedCaseIds, setDeletedCaseIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('vgadream_custom_cases');
        if (saved) {
          setCustomCases(JSON.parse(saved));
        }
        const deleted = localStorage.getItem('vgadream_deleted_case_ids');
        if (deleted) {
          setDeletedCaseIds(JSON.parse(deleted));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseList = allCasesOverride || INITIAL_CASES;

  // Build a Map keyed by case ID so custom/edited versions override initial cases seamlessly
  const caseMap = new Map<string, CaseSpec>();
  baseList.forEach((c) => caseMap.set(c.id, c));
  customCases.forEach((c) => caseMap.set(c.id, c));

  const deletedSet = new Set(deletedCaseIds);
  const availableCases = Array.from(caseMap.values()).filter((c) => !deletedSet.has(c.id));

  const filteredCases = availableCases.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (c: CaseSpec) => {
    if (confirm(`Apakah Tuan yakin ingin menghapus PC Case "${c.name}"?`)) {
      if (onDeleteCase) {
        onDeleteCase(c.id);
      }
      setDeletedCaseIds((prev) => [...prev, c.id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-white">Select Target PC Case Chassis</h3>
            <p className="text-xs text-slate-400 font-mono">
              Choose, edit, or import a PC case spec to evaluate clearance margins
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenAddCaseModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddCaseModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs font-mono transition-all flex items-center space-x-1.5 shrink-0"
              >
                <span>+ Tambah Case / Import ComponentScale</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-all shrink-0"
            >
              Close [X]
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Cari PC Case berdasarkan nama atau brand (misal: Jonsbo, Fractal, Lian Li, FormD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Case List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredCases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Tidak ada PC Case yang ditemukan. Silakan tambah PC Case baru atau ubah pencarian.
            </div>
          ) : (
            filteredCases.map((c) => {
              const isSelected = c.id === selectedCase.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCase(c);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">{c.brand}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {c.formFactor}
                      </span>
                      {c.volumeLiters && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {c.volumeLiters} Liters
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1 truncate">{c.name}</h4>
                    <p className="text-xs font-mono text-slate-400 line-clamp-1">
                      Form Factor: {c.formFactor} &bull; Max GPU Length: {c.maxGpuLengthMm}mm &bull; Max Slots: {c.maxGpuSlotThickness} Slots
                    </p>
                  </div>

                  {/* Right: Metrics & Responsive Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 text-xs font-mono border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4 shrink-0">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">Max Length</div>
                        <div className="font-bold text-cyan-400">{c.maxGpuLengthMm} mm</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-sans">Max Slots</div>
                        <div className="font-bold text-indigo-400">{c.maxGpuSlotThickness} Slots</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {onEditCase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCase(c);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-all border border-slate-700/80"
                          title="Edit PC Case"
                        >
                          Edit
                        </button>
                      )}

                      {onDeleteCase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 text-xs font-mono font-medium transition-all border border-rose-800/60"
                          title="Hapus PC Case"
                        >
                          Hapus
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                          onClose();
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
