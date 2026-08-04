'use client';

import React, { useState, useMemo } from 'react';
import { INITIAL_GPUS } from '@/data/gpus';
import { INITIAL_CASES } from '@/data/cases';
import { CaseSpec, GPUSpec } from '@/types';
import { evaluateClearance } from '@/utils/clearanceCalculator';

import { Navbar } from '@/components/Navbar';
import { GPUFitVisualizer } from '@/components/GPUFitVisualizer';
import { GPUCard } from '@/components/GPUCard';
import { GPUTableList } from '@/components/GPUTableList';
import { CaseSelectorModal } from '@/components/CaseSelectorModal';
import { GPUCompareModal } from '@/components/GPUCompareModal';

export default function Home() {
  // 1. Core State
  const [activeCase, setActiveCase] = useState<CaseSpec>(INITIAL_CASES[0]); // Fractal Terra
  const [userPsuWattage, setUserPsuWattage] = useState<number>(750); // Kapasitas PSU Pengguna (default 750W)

  // 2. Blueprint Visualizer visibility toggle & selected GPU
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualizerGpu, setVisualizerGpu] = useState<GPUSpec>(INITIAL_GPUS[0]);

  // View Mode: 'table' (default) or 'grid'
  const [viewLayout, setViewLayout] = useState<'table' | 'grid'>('table');

  // 3. Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [fitStatusFilter, setFitStatusFilter] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [maxLengthFilter, setMaxLengthFilter] = useState(360);
  const [maxSlotFilter, setMaxSlotFilter] = useState(4.0);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'fit_score' | 'time_spy_desc' | 'length_asc' | 'length_desc'>('fit_score');

  // 4. Modals & Compare
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparedGpus, setComparedGpus] = useState<GPUSpec[]>([]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('ALL');
    setFitStatusFilter('ALL');
    setMaxLengthFilter(360);
    setMaxSlotFilter(4.0);
    setSelectedManufacturers([]);
    setSortBy('fit_score');
  };

  const handleSelectGpuForVisualizer = (gpu: GPUSpec) => {
    setVisualizerGpu(gpu);
    setShowVisualizer(true);
    const el = document.getElementById('visualizer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleCompare = (gpu: GPUSpec) => {
    const exists = comparedGpus.some((g) => g.id === gpu.id);
    if (exists) {
      setComparedGpus(comparedGpus.filter((g) => g.id !== gpu.id));
    } else {
      if (comparedGpus.length >= 3) {
        alert('Maksimal komparasi 3 GPU sekaligus!');
        return;
      }
      setComparedGpus([...comparedGpus, gpu]);
    }
  };

  // 5. Clearance evaluation
  const evaluatedGpus = useMemo(() => {
    return INITIAL_GPUS.map((gpu) => {
      const clearance = evaluateClearance(gpu, activeCase, {
        userPsuWattage
      });
      return { gpu, clearance };
    });
  }, [activeCase, userPsuWattage]);

  // Filtered GPUs
  const filteredGpus = useMemo(() => {
    return evaluatedGpus.filter(({ gpu, clearance }) => {
      const matchesSearch =
        gpu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gpu.chipset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gpu.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand = selectedBrand === 'ALL' || gpu.brand === selectedBrand;
      const matchesMfg =
        selectedManufacturers.length === 0 || selectedManufacturers.includes(gpu.manufacturer);
      const matchesLength = gpu.lengthMm <= maxLengthFilter;
      const matchesSlot = gpu.slotThickness <= maxSlotFilter;

      let matchesFit = true;
      if (fitStatusFilter === 'COMPATIBLE') {
        matchesFit = clearance.status !== 'INCOMPATIBLE';
      } else if (fitStatusFilter === 'PERFECT_FIT') {
        matchesFit = clearance.status === 'PERFECT_FIT';
      }

      return matchesSearch && matchesBrand && matchesMfg && matchesLength && matchesSlot && matchesFit;
    });
  }, [
    evaluatedGpus,
    searchTerm,
    selectedBrand,
    selectedManufacturers,
    maxLengthFilter,
    maxSlotFilter,
    fitStatusFilter
  ]);

  const sortedGpus = useMemo(() => {
    return [...filteredGpus].sort((a, b) => {
      if (sortBy === 'fit_score') {
        return b.clearance.score - a.clearance.score;
      } else if (sortBy === 'time_spy_desc') {
        return b.gpu.timeSpyScore - a.gpu.timeSpyScore;
      } else if (sortBy === 'length_asc') {
        return a.gpu.lengthMm - b.gpu.lengthMm;
      } else if (sortBy === 'length_desc') {
        return b.gpu.lengthMm - a.gpu.lengthMm;
      }
      return 0;
    });
  }, [filteredGpus, sortBy]);

  const visualizerClearance = useMemo(() => {
    return evaluateClearance(visualizerGpu, activeCase, {
      userPsuWattage
    });
  }, [visualizerGpu, activeCase, userPsuWattage]);

  const compatibleCount = evaluatedGpus.filter((g) => g.clearance.status !== 'INCOMPATIBLE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navbar */}
      <Navbar
        totalGpus={INITIAL_GPUS.length}
        activeCaseName={`${activeCase.brand} ${activeCase.name}`}
        onOpenCaseSelector={() => setIsCaseModalOpen(true)}
        showVisualizer={showVisualizer}
        onToggleVisualizer={() => setShowVisualizer(!showVisualizer)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Active Case Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Target PC Case Saat Ini</div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {activeCase.brand} {activeCase.name}
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                {activeCase.formFactor}
              </span>
            </h2>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Batas Panjang: <span className="text-cyan-300 font-bold">{activeCase.maxGpuLengthMm} mm</span> &bull; Batas Tinggi: <span className="text-indigo-300 font-bold">{activeCase.maxGpuHeightMm} mm</span> &bull; Batas Slot: <span className="text-fuchsia-300 font-bold">{activeCase.maxGpuSlotThickness} Slot</span>
            </div>
          </div>

          <button
            onClick={() => setIsCaseModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-all shadow-md shadow-cyan-600/20"
          >
            Ganti Model Case
          </button>
        </div>

        {/* Blueprint Visualizer (Collapsible) */}
        {showVisualizer && (
          <GPUFitVisualizer
            gpu={visualizerGpu}
            pcCase={activeCase}
            clearance={visualizerClearance}
            userPsuWattage={userPsuWattage}
            onChangeUserPsuWattage={setUserPsuWattage}
          />
        )}

        {/* Clean Filter Control Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1" style={{ minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Cari GPU (e.g. RTX 4080, Strix, Sapphire)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              {['ALL', 'NVIDIA', 'AMD', 'Intel'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedBrand === b
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b === 'ALL' ? 'Semua Brand' : b}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setFitStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fitStatusFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => setFitStatusFilter('COMPATIBLE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fitStatusFilter === 'COMPATIBLE'
                    ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Muat (Fit) 🟢
              </button>
              <button
                onClick={() => setFitStatusFilter('PERFECT_FIT')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fitStatusFilter === 'PERFECT_FIT'
                    ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Perfect Fit ⚡
              </button>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                showAdvancedFilters
                  ? 'bg-slate-800 border-cyan-500/50 text-cyan-400 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Filter Lanjutan
            </button>
          </div>

          {/* Advanced Sliders Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border">
              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Batas Panjang GPU</span>
                  <span className="text-cyan-400 font-bold">&le; {maxLengthFilter} mm</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="360"
                  step="5"
                  value={maxLengthFilter}
                  onChange={(e) => setMaxLengthFilter(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Batas Ketebalan Slot</span>
                  <span className="text-indigo-400 font-bold">&le; {maxSlotFilter} Slots</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.0"
                  step="0.25"
                  value={maxSlotFilter}
                  onChange={(e) => setMaxSlotFilter(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-end justify-between">
                <span className="text-slate-500 text-[11px]">Setel ulang ke default</span>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Directory Summary Bar & View Layout Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 px-1">
          <div>
            Menampilkan <span className="text-cyan-400 font-bold">{sortedGpus.length}</span> GPU
            (<span className="text-emerald-400 font-bold">{compatibleCount}</span> kompatibel dengan {activeCase.name})
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewLayout('table')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewLayout === 'table'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tabel List
              </button>
              <button
                onClick={() => setViewLayout('grid')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewLayout === 'grid'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grid Kartu
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span>Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'fit_score' | 'time_spy_desc' | 'length_asc' | 'length_desc')}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="fit_score">Skor Kompatibilitas Terbaik</option>
                <option value="time_spy_desc">Skor 3DMark Time Spy (Performa Tertinggi)</option>
                <option value="length_asc">Panjang (Terpendek Dulu)</option>
                <option value="length_desc">Panjang (Terpanjang Dulu)</option>
              </select>
            </div>
          </div>
        </div>

        {/* GPU List View / Grid View Rendering */}
        {sortedGpus.length > 0 ? (
          viewLayout === 'table' ? (
            <GPUTableList
              gpus={sortedGpus}
              pcCase={activeCase}
              visualizerGpuId={visualizerGpu.id}
              showVisualizer={showVisualizer}
              onSelectForVisualizer={handleSelectGpuForVisualizer}
              comparedGpus={comparedGpus}
              onToggleCompare={handleToggleCompare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedGpus.map(({ gpu, clearance }) => (
                <GPUCard
                  key={gpu.id}
                  gpu={gpu}
                  clearance={clearance}
                  isSelectedInVisualizer={visualizerGpu.id === gpu.id && showVisualizer}
                  onSelectForVisualizer={handleSelectGpuForVisualizer}
                  isCompared={comparedGpus.some((g) => g.id === gpu.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
            </div>
          )
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <h4 className="text-base font-bold text-white">Tidak ada GPU yang sesuai dengan filter</h4>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-all"
            >
              Reset Filter
            </button>
          </div>
        )}
      </main>

      {/* Floating Compare Drawer */}
      {comparedGpus.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-3 px-5 shadow-2xl backdrop-blur-xl flex items-center gap-4">
          <span className="text-xs font-mono text-white font-bold">
            {comparedGpus.length} GPU Dipilih untuk Komparasi
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold font-mono shadow-md shadow-fuchsia-600/30"
            >
              Buka Matriks Komparasi
            </button>
            <button
              onClick={() => setComparedGpus([])}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Bersihkan
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CaseSelectorModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        selectedCase={activeCase}
        onSelectCase={setActiveCase}
      />

      <GPUCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedGpus={comparedGpus}
        pcCase={activeCase}
        onRemoveFromCompare={(id) => setComparedGpus(comparedGpus.filter((g) => g.id !== id))}
      />

      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs font-mono text-slate-500">
        VGADream Clearance Lab &bull; Dibuat Khusus untuk Kompatibilitas PC Builder
      </footer>
    </div>
  );
}
