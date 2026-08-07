'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_CASES } from '@/data/cases';
import { CaseSpec, GPUSpec } from '@/types';
import { evaluateClearance } from '@/utils/clearanceCalculator';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GPUFitVisualizer } from '@/components/GPUFitVisualizer';
import { GPUCard } from '@/components/GPUCard';
import { GPUTableList } from '@/components/GPUTableList';
import { CaseSelectorModal } from '@/components/CaseSelectorModal';
import { GPUCompareModal } from '@/components/GPUCompareModal';
import { MasterCatalogModal } from '@/components/MasterCatalogModal';
import { AddGPUModal } from '@/components/AddGPUModal';
import { EditGPUModal } from '@/components/EditGPUModal';
import { Database, Loader2, Plus, RefreshCw, Layers, Sparkles } from 'lucide-react';

export default function Home() {
  // 1. Core State & D1 Async Master Data Fetching
  const [masterGpus, setMasterGpus] = useState<GPUSpec[]>([]);
  const [dreamGpus, setDreamGpus] = useState<GPUSpec[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('cloudflare_d1');

  const [activeCase, setActiveCase] = useState<CaseSpec>(INITIAL_CASES[0]); // Fractal Terra
  const [userPsuWattage, setUserPsuWattage] = useState<number>(750); // Default 750W PSU

  // 2. Visualizer visibility toggle & selected GPU
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualizerGpu, setVisualizerGpu] = useState<GPUSpec | null>(null);

  // View Layout Mode: 'table' (default) or 'grid'
  const [viewLayout, setViewLayout] = useState<'table' | 'grid'>('table');

  // 3. Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [fitStatusFilter, setFitStatusFilter] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [maxLengthFilter, setMaxLengthFilter] = useState(360);
  const [maxSlotFilter, setMaxSlotFilter] = useState(4.0);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'fit_score' | 'vram_desc' | 'time_spy_desc' | 'length_asc' | 'length_desc'>('fit_score');

  // 4. Modals & Compare
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAddGpuModalOpen, setIsAddGpuModalOpen] = useState(false);
  const [isEditGpuModalOpen, setIsEditGpuModalOpen] = useState(false);
  const [gpuToEdit, setGpuToEdit] = useState<GPUSpec | null>(null);
  const [isMasterCatalogModalOpen, setIsMasterCatalogModalOpen] = useState(false);
  const [comparedGpus, setComparedGpus] = useState<GPUSpec[]>([]);

  // Load active Dream VGA List from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dream_vga_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDreamGpus(parsed);
          if (parsed.length > 0) {
            setVisualizerGpu(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load dream_vga_list from localStorage:', e);
    }
  }, []);

  // Helper to update & persist Dream VGA List
  const updateDreamGpus = (newList: GPUSpec[]) => {
    setDreamGpus(newList);
    try {
      localStorage.setItem('dream_vga_list', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save dream_vga_list to localStorage:', e);
    }
    if (newList.length > 0 && !visualizerGpu) {
      setVisualizerGpu(newList[0]);
    }
  };

  const handleAddGpuToDreamList = (gpu: GPUSpec) => {
    if (!dreamGpus.some((g) => g.id === gpu.id)) {
      const newList = [...dreamGpus, gpu];
      updateDreamGpus(newList);
    }
  };

  const handleRemoveGpuFromDreamList = (gpuId: string) => {
    const newList = dreamGpus.filter((g) => g.id !== gpuId);
    updateDreamGpus(newList);
    if (visualizerGpu?.id === gpuId) {
      setVisualizerGpu(newList.length > 0 ? newList[0] : null);
    }
  };

  const handleEditGpu = (gpu: GPUSpec) => {
    setGpuToEdit(gpu);
    setIsEditGpuModalOpen(true);
  };

  const handleDeleteGpu = async (gpuId: string) => {
    try {
      const res = await fetch('/api/gpus/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gpuId })
      });
      if (res.ok) {
        setMasterGpus((prev) => prev.filter((g) => g.id !== gpuId));
        handleRemoveGpuFromDreamList(gpuId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete GPU specification.');
      }
    } catch (err) {
      console.error('Delete GPU error:', err);
      alert('Network error while deleting GPU.');
    }
  };

  // Fetch GPUs from Cloudflare D1 API endpoint into Master Catalog
  const fetchGpusFromD1 = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gpus');
      if (res.ok) {
        const data = await res.json();
        if (data.gpus) {
          setMasterGpus(data.gpus);
          setDataSource(data.source || 'cloudflare_d1');
        }
      }
    } catch (err) {
      console.error('Failed to fetch GPUs from Cloudflare D1 API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGpusFromD1();
  }, []);

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
        alert('Maximum comparison limit is 3 GPUs at a time!');
        return;
      }
      setComparedGpus([...comparedGpus, gpu]);
    }
  };

  // 5. Clearance evaluation ONLY for GPUs in active Dream VGA List
  const evaluatedGpus = useMemo(() => {
    return dreamGpus.map((gpu) => {
      const clearance = evaluateClearance(gpu, activeCase, {
        userPsuWattage
      });
      return { gpu, clearance };
    });
  }, [dreamGpus, activeCase, userPsuWattage]);

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
      } else if (sortBy === 'vram_desc') {
        const vramA = parseInt(a.gpu.memorySize, 10) || 0;
        const vramB = parseInt(b.gpu.memorySize, 10) || 0;
        return vramB - vramA;
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
    if (!visualizerGpu) return null;
    return evaluateClearance(visualizerGpu, activeCase, {
      userPsuWattage
    });
  }, [visualizerGpu, activeCase, userPsuWattage]);

  const compatibleCount = evaluatedGpus.filter((g) => g.clearance.status !== 'INCOMPATIBLE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navbar with Action Buttons integrated into Header */}
      <Navbar
        pcCase={activeCase}
        onChangeCaseClick={() => setIsCaseModalOpen(true)}
        comparedCount={comparedGpus.length}
        onOpenCompareClick={() => setIsCompareModalOpen(true)}
        onOpenMasterCatalog={() => setIsMasterCatalogModalOpen(true)}
        dreamCount={dreamGpus.length}
        masterCount={masterGpus.length}
        onOpenAddGpu={() => setIsAddGpuModalOpen(true)}
        onSyncD1={fetchGpusFromD1}
        isSyncing={isLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">

        {/* Studio Visualizer (Collapsible) */}
        {showVisualizer && visualizerGpu && visualizerClearance && (
          <GPUFitVisualizer
            gpu={visualizerGpu}
            pcCase={activeCase}
            clearance={visualizerClearance}
            userPsuWattage={userPsuWattage}
            onUserPsuChange={setUserPsuWattage}
            onChangeCaseClick={() => setIsCaseModalOpen(true)}
          />
        )}

        {/* Clean Filter Control Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1" style={{ minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Search GPU (e.g. RTX 4070 Super, Strix, Sapphire)..."
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
                  {b === 'ALL' ? 'All Brands' : b}
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
                All Status
              </button>
              <button
                onClick={() => setFitStatusFilter('COMPATIBLE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  fitStatusFilter === 'COMPATIBLE'
                    ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fit (Compatible) 🟢
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
              Advanced Filters
            </button>
          </div>

          {/* Advanced Sliders Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border">
              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Max GPU Length</span>
                  <span className="text-cyan-400 font-bold">&le; {maxLengthFilter} mm</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="380"
                  step="5"
                  value={maxLengthFilter}
                  onChange={(e) => setMaxLengthFilter(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Max Slot Thickness</span>
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
                <span className="text-slate-500 text-[11px]">Reset all filters to default</span>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Directory Summary Bar & View Layout Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 px-1">
          <div>
            Showing <span className="text-cyan-400 font-bold">{sortedGpus.length}</span> GPUs
            (<span className="text-emerald-400 font-bold">{compatibleCount}</span> compatible with {activeCase.name})
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
                Table View
              </button>
              <button
                onClick={() => setViewLayout('grid')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewLayout === 'grid'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Card Grid
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'fit_score' | 'vram_desc' | 'time_spy_desc' | 'length_asc' | 'length_desc')}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="fit_score">Best Fit Score</option>
                <option value="vram_desc">High VRAM (Highest First)</option>
                <option value="time_spy_desc">3DMark Score (Highest First)</option>
                <option value="length_asc">Length (Shortest First)</option>
                <option value="length_desc">Length (Longest First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner or GPU Content */}
        {isLoading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center space-y-4 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-sm font-mono font-bold text-white">Connecting to GPU Master Catalog Database...</div>
            <p className="text-xs font-mono text-slate-400">Fetching GPU specifications live from API endpoint (`/api/gpus`)</p>
          </div>
        ) : sortedGpus.length > 0 ? (
          viewLayout === 'table' ? (
            <GPUTableList
              gpus={sortedGpus}
              pcCase={activeCase}
              visualizerGpuId={visualizerGpu?.id || ''}
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
                  isSelectedForVisualizer={visualizerGpu?.id === gpu.id && showVisualizer}
                  onSelectForVisualizer={handleSelectGpuForVisualizer}
                  isCompared={comparedGpus.some((g) => g.id === gpu.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
            </div>
          )
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-4 max-w-3xl mx-auto shadow-2xl backdrop-blur-xl my-8">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Your Dream VGA List is Currently Empty</h3>
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Master Catalog contains <strong>{masterGpus.length} GPUs</strong>. Select &amp; add your dream graphics cards to this <strong>Dream VGA List</strong> to evaluate PC case fit clearance!
            </p>
            <button
              onClick={() => setIsMasterCatalogModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-white font-medium text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Open Master Catalog &amp; Select GPUs ({masterGpus.length} Available)
            </button>
          </div>
        )}
      </main>

      {/* Floating Compare Drawer */}
      {comparedGpus.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-3 px-5 shadow-2xl backdrop-blur-xl flex items-center gap-4">
          <span className="text-xs font-mono text-white font-bold">
            {comparedGpus.length} GPU(s) Selected for Comparison
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold font-mono shadow-md shadow-fuchsia-600/30"
            >
              Open Comparison Matrix
            </button>
            <button
              onClick={() => setComparedGpus([])}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <MasterCatalogModal
        isOpen={isMasterCatalogModalOpen}
        onClose={() => setIsMasterCatalogModalOpen(false)}
        masterGpus={masterGpus}
        dreamGpus={dreamGpus}
        onAddGpuToDreamList={handleAddGpuToDreamList}
        onRemoveGpuFromDreamList={handleRemoveGpuFromDreamList}
        onOpenAddModal={() => setIsAddGpuModalOpen(true)}
        onEditGpu={handleEditGpu}
        onDeleteGpu={handleDeleteGpu}
        activeCase={activeCase}
      />

      <EditGPUModal
        isOpen={isEditGpuModalOpen}
        gpuToEdit={gpuToEdit}
        onClose={() => {
          setIsEditGpuModalOpen(false);
          setGpuToEdit(null);
        }}
        onGpuUpdated={fetchGpusFromD1}
      />

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

      <AddGPUModal
        isOpen={isAddGpuModalOpen}
        onClose={() => setIsAddGpuModalOpen(false)}
        onGpuAdded={fetchGpusFromD1}
      />

      <Footer />
    </div>
  );
}
