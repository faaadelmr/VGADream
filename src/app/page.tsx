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
import { AddCaseModal } from '@/components/AddCaseModal';
import { EditCaseModal } from '@/components/EditCaseModal';
import { SetPriceModal } from '@/components/SetPriceModal';
import { Loader2, Layers, Sparkles } from 'lucide-react';

export default function Home() {
  // 1. Core State & D1 Async Master Data Fetching
  const [masterGpus, setMasterGpus] = useState<GPUSpec[]>([]);
  const [dreamGpus, setDreamGpus] = useState<GPUSpec[]>([]);
  const [gpuPrices, setGpuPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeCase, setActiveCase] = useState<CaseSpec>(INITIAL_CASES[0]); // Fractal Terra
  const [userPsuWattage, setUserPsuWattage] = useState<number>(750); // Default 750W PSU

  // 2. Visualizer visibility toggle & selected GPU
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualizerGpu, setVisualizerGpu] = useState<GPUSpec | null>(null);

  // Load active Dream VGA List and user custom GPU prices from localStorage after client mount
  useEffect(() => {
    const timer = setTimeout(() => {
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
        const savedPrices = localStorage.getItem('vgadream_gpu_prices');
        if (savedPrices) {
          setGpuPrices(JSON.parse(savedPrices));
        }
      } catch (e) {
        console.error('Failed to load local storage data:', e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
  const [sortBy, setSortBy] = useState<'fit_score' | 'price_perf_desc' | 'price_asc' | 'price_desc' | 'vram_desc' | 'time_spy_desc' | 'length_asc' | 'length_desc'>('fit_score');

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isEditCaseModalOpen, setIsEditCaseModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<CaseSpec | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAddGpuModalOpen, setIsAddGpuModalOpen] = useState(false);
  const [isEditGpuModalOpen, setIsEditGpuModalOpen] = useState(false);
  const [isSetPriceModalOpen, setIsSetPriceModalOpen] = useState(false);
  const [gpuForPrice, setGpuForPrice] = useState<GPUSpec | null>(null);
  const [gpuToEdit, setGpuToEdit] = useState<GPUSpec | null>(null);
  const [isMasterCatalogModalOpen, setIsMasterCatalogModalOpen] = useState(false);
  const [comparedGpus, setComparedGpus] = useState<GPUSpec[]>([]);

  const handleOpenSetPrice = (gpu: GPUSpec) => {
    setGpuForPrice(gpu);
    setIsSetPriceModalOpen(true);
  };

  const handleSavePrice = (gpuId: string, priceIdr: number | undefined) => {
    setGpuPrices((prev) => {
      const next = { ...prev };
      if (priceIdr !== undefined && priceIdr > 0) {
        next[gpuId] = priceIdr;
      } else {
        delete next[gpuId];
      }
      try {
        localStorage.setItem('vgadream_gpu_prices', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save vgadream_gpu_prices:', e);
      }
      return next;
    });
  };

  const handleDeletePrice = (gpuId: string) => {
    handleSavePrice(gpuId, undefined);
  };

  const [allCases, setAllCases] = useState<CaseSpec[]>(INITIAL_CASES);

  // Helper to fetch cases from database API + localStorage (used after user updates)
  const fetchCasesFromD1 = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      const apiCases: CaseSpec[] = data.cases || [];

      const saved = localStorage.getItem('vgadream_custom_cases');
      const custom: CaseSpec[] = saved ? JSON.parse(saved) : [];
      const deletedSaved = localStorage.getItem('vgadream_deleted_case_ids');
      const deletedIds: string[] = deletedSaved ? JSON.parse(deletedSaved) : [];
      const deletedSet = new Set(deletedIds);

      const caseMap = new Map<string, CaseSpec>();
      INITIAL_CASES.forEach((c) => caseMap.set(c.id, c));
      apiCases.forEach((c) => caseMap.set(c.id, c));
      custom.forEach((c) => caseMap.set(c.id, c));

      const merged = Array.from(caseMap.values()).filter((c) => !deletedSet.has(c.id));
      setAllCases(merged);
    } catch (err) {
      console.warn('Failed to fetch cases from API:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadCases = async () => {
      try {
        const res = await fetch('/api/cases');
        const data = await res.json();
        if (!isMounted) return;
        const apiCases: CaseSpec[] = data.cases || [];

        const saved = localStorage.getItem('vgadream_custom_cases');
        const custom: CaseSpec[] = saved ? JSON.parse(saved) : [];
        const deletedSaved = localStorage.getItem('vgadream_deleted_case_ids');
        const deletedIds: string[] = deletedSaved ? JSON.parse(deletedSaved) : [];
        const deletedSet = new Set(deletedIds);

        const caseMap = new Map<string, CaseSpec>();
        INITIAL_CASES.forEach((c) => caseMap.set(c.id, c));
        apiCases.forEach((c) => caseMap.set(c.id, c));
        custom.forEach((c) => caseMap.set(c.id, c));

        const merged = Array.from(caseMap.values()).filter((c) => !deletedSet.has(c.id));
        setAllCases(merged);
      } catch (err) {
        console.warn('Failed to fetch cases from API:', err);
      }
    };
    loadCases();
    return () => {
      isMounted = false;
    };
  }, []);

  // Case Edit & Delete Handlers
  const handleEditCase = (pcCase: CaseSpec) => {
    setCaseToEdit(pcCase);
    setIsEditCaseModalOpen(true);
  };

  const handleCaseUpdated = (updatedCase: CaseSpec) => {
    if (activeCase.id === updatedCase.id) {
      setActiveCase(updatedCase);
    }

    // 1. Update local state instantly (no refresh needed)
    setAllCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));

    // 2. Persist to localStorage
    try {
      const saved = localStorage.getItem('vgadream_custom_cases');
      const list: CaseSpec[] = saved ? JSON.parse(saved) : [];
      const updatedList = list.map((c) => (c.id === updatedCase.id ? updatedCase : c));
      if (!updatedList.some((c) => c.id === updatedCase.id)) {
        updatedList.unshift(updatedCase);
      }
      localStorage.setItem('vgadream_custom_cases', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    // 3. Post to SQL database endpoint
    fetch('/api/cases/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCase)
    }).catch((err) => console.warn('Database case update failed:', err));
  };

  const handleDeleteCase = async (caseId: string) => {
    // 1. Update local state instantly (card disappears in real time)
    setAllCases((prev) => prev.filter((c) => c.id !== caseId));

    // 2. Persist deletion tracking in localStorage
    try {
      const saved = localStorage.getItem('vgadream_custom_cases');
      const list: CaseSpec[] = saved ? JSON.parse(saved) : [];
      const filtered = list.filter((c) => c.id !== caseId);
      localStorage.setItem('vgadream_custom_cases', JSON.stringify(filtered));

      const deletedSaved = localStorage.getItem('vgadream_deleted_case_ids');
      const deletedList: string[] = deletedSaved ? JSON.parse(deletedSaved) : [];
      if (!deletedList.includes(caseId)) {
        deletedList.push(caseId);
      }
      localStorage.setItem('vgadream_deleted_case_ids', JSON.stringify(deletedList));
    } catch (e) {
      console.error(e);
    }

    // 3. Execute DELETE FROM cases SQL command in D1 database
    try {
      await fetch(`/api/cases/delete?id=${encodeURIComponent(caseId)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Database case deletion failed:', err);
    }

    if (activeCase.id === caseId) {
      try {
        const deletedSaved = localStorage.getItem('vgadream_deleted_case_ids');
        const deletedList: string[] = deletedSaved ? JSON.parse(deletedSaved) : [];
        const fallbackCase = INITIAL_CASES.find((c) => !deletedList.includes(c.id)) || INITIAL_CASES[0];
        setActiveCase(fallbackCase);
      } catch {
        setActiveCase(INITIAL_CASES[0]);
      }
    }
  };

  // Helper to add GPU to Dream VGA List
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
        }
      }
    } catch (err) {
      console.error('Failed to fetch GPUs from Cloudflare D1 API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadGpus = async () => {
      try {
        const res = await fetch('/api/gpus');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.gpus) {
            setMasterGpus(data.gpus);
          }
        }
      } catch (err) {
        console.error('Failed to fetch GPUs from Cloudflare D1 API:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadGpus();
    return () => {
      isMounted = false;
    };
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

  // 5. Clearance evaluation ONLY for GPUs in active Dream VGA List with custom prices
  const evaluatedGpus = useMemo(() => {
    return dreamGpus.map((gpu) => {
      const priceIdr = gpuPrices[gpu.id] ?? gpu.priceIdr;
      const gpuWithPrice = { ...gpu, priceIdr };
      const clearance = evaluateClearance(gpuWithPrice, activeCase, {
        userPsuWattage
      });
      return { gpu: gpuWithPrice, clearance };
    });
  }, [dreamGpus, activeCase, userPsuWattage, gpuPrices]);

  // Compared GPUs with attached user prices
  const comparedGpusWithPrices = useMemo(() => {
    return comparedGpus.map((gpu) => ({
      ...gpu,
      priceIdr: gpuPrices[gpu.id] ?? gpu.priceIdr
    }));
  }, [comparedGpus, gpuPrices]);

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
      } else if (sortBy === 'price_perf_desc') {
        const pMA = a.gpu.priceIdr ? a.gpu.priceIdr / 1_000_000 : 0;
        const pMB = b.gpu.priceIdr ? b.gpu.priceIdr / 1_000_000 : 0;
        const ppA = pMA > 0 ? a.gpu.timeSpyScore / pMA : 0;
        const ppB = pMB > 0 ? b.gpu.timeSpyScore / pMB : 0;
        return ppB - ppA;
      } else if (sortBy === 'price_asc') {
        const pA = a.gpu.priceIdr || Number.MAX_SAFE_INTEGER;
        const pB = b.gpu.priceIdr || Number.MAX_SAFE_INTEGER;
        return pA - pB;
      } else if (sortBy === 'price_desc') {
        const pA = a.gpu.priceIdr || 0;
        const pB = b.gpu.priceIdr || 0;
        return pB - pA;
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
        onOpenMasterCatalog={() => setIsMasterCatalogModalOpen(true)}
        dreamCount={dreamGpus.length}
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
                onChange={(e) => setSortBy(e.target.value as 'fit_score' | 'price_perf_desc' | 'price_asc' | 'price_desc' | 'vram_desc' | 'time_spy_desc' | 'length_asc' | 'length_desc')}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="fit_score">Best Fit Score</option>
                <option value="price_perf_desc">⚡ Price to Performance (Value Terbaik)</option>
                <option value="price_asc">🏷️ Harga Rp (Terendah Pertama)</option>
                <option value="price_desc">💎 Harga Rp (Tertinggi Pertama)</option>
                <option value="time_spy_desc">3DMark Score (Highest First)</option>
                <option value="vram_desc">High VRAM (Highest First)</option>
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
              comparedGpus={comparedGpusWithPrices}
              onToggleCompare={handleToggleCompare}
              onOpenSetPrice={handleOpenSetPrice}
              onDeletePrice={handleDeletePrice}
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
                  onOpenSetPrice={handleOpenSetPrice}
                  onDeletePrice={handleDeletePrice}
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
        key={gpuToEdit ? `edit-gpu-${gpuToEdit.id}` : 'modal-edit-gpu'}
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
        onOpenAddCaseModal={() => setIsAddCaseModalOpen(true)}
        onEditCase={handleEditCase}
        onDeleteCase={handleDeleteCase}
        allCasesOverride={allCases}
      />

      <EditCaseModal
        key={caseToEdit ? `edit-case-${caseToEdit.id}` : 'modal-edit-case'}
        isOpen={isEditCaseModalOpen}
        caseToEdit={caseToEdit}
        onClose={() => {
          setIsEditCaseModalOpen(false);
          setCaseToEdit(null);
        }}
        onCaseUpdated={handleCaseUpdated}
      />

      <GPUCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedGpus={comparedGpusWithPrices}
        pcCase={activeCase}
        onRemoveFromCompare={(id) => setComparedGpus(comparedGpus.filter((g) => g.id !== id))}
      />

      <SetPriceModal
        key={gpuForPrice ? `set-price-${gpuForPrice.id}` : 'modal-set-price'}
        isOpen={isSetPriceModalOpen}
        onClose={() => {
          setIsSetPriceModalOpen(false);
          setGpuForPrice(null);
        }}
        gpu={gpuForPrice}
        currentPriceIdr={gpuForPrice ? (gpuPrices[gpuForPrice.id] ?? gpuForPrice.priceIdr) : undefined}
        onSavePrice={handleSavePrice}
      />

      <AddGPUModal
        isOpen={isAddGpuModalOpen}
        onClose={() => setIsAddGpuModalOpen(false)}
        onGpuAdded={fetchGpusFromD1}
      />

      <AddCaseModal
        isOpen={isAddCaseModalOpen}
        onClose={() => setIsAddCaseModalOpen(false)}
        onCaseAdded={(newCase) => {
          setActiveCase(newCase);
          setAllCases((prev) => [newCase, ...prev.filter((c) => c.id !== newCase.id)]);
          fetchCasesFromD1();
        }}
      />

      <Footer />
    </div>
  );
}
