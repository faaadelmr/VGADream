'use client';

import React, { useState } from 'react';
import { GPUSpec } from '@/types';

interface AddGPUModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGpuAdded: () => void;
}

interface PortItem {
  id: string;
  count: number;
  type: string;
}

const VRAM_SIZE_OPTIONS = ['1 GB', '2 GB', '4 GB', '6 GB', '8 GB', '10 GB', '12 GB', '16 GB', '20 GB', '24 GB', '32 GB', '48 GB'];
const VRAM_TYPE_OPTIONS = [
  'GDDR7',
  'GDDR6X',
  'GDDR6',
  'GDDR5X',
  'GDDR5',
  'GDDR4',
  'GDDR3',
  'GDDR2',
  'HBM3e',
  'HBM3',
  'HBM2e',
  'HBM2',
  'HBM',
  'LPDDR5X',
  'LPDDR5',
  'LPDDR4X',
  'DDR5',
  'DDR4',
  'DDR3'
];
const PCIE_BUS_OPTIONS = ['PCIe 5.0 x16', 'PCIe 4.0 x16', 'PCIe 4.0 x8', 'PCIe 3.0 x16', 'PCIe 3.0 x8'];
const POWER_CONNECTOR_OPTIONS = [
  '1x 16-pin (12VHPWR)',
  '1x 12V-2x6',
  '1x 8-pin',
  '2x 8-pin',
  '3x 8-pin',
  '4x 8-pin',
  '1x 6-pin',
  '2x 6-pin',
  '1x 8-pin + 1x 6-pin',
  'Motherboard Slot Only (No Pin)'
];
const RECOMMENDED_PSU_OPTIONS = [300, 350, 450, 500, 550, 600, 650, 700, 750, 850, 1000, 1200, 1500];

const PORT_TYPE_OPTIONS = [
  'DisplayPort 1.4a',
  'DisplayPort 2.1',
  'HDMI 2.1a',
  'HDMI 2.0b',
  'HDMI 1.4',
  'USB Type-C',
  'DVI-D',
  'VGA (D-Sub)'
];

export const AddGPUModal: React.FC<AddGPUModalProps> = ({
  isOpen,
  onClose,
  onGpuAdded
}) => {
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dynamic Port Items list
  const [portItems, setPortItems] = useState<PortItem[]>([
    { id: 'p1', count: 3, type: 'DisplayPort 1.4a' },
    { id: 'p2', count: 1, type: 'HDMI 2.1a' }
  ]);

  // Form State matching 100% 1-to-1 with Cloudflare D1 Database gpus table columns
  const [formData, setFormData] = useState<Partial<GPUSpec>>({
    name: '',
    brand: 'NVIDIA',
    chipset: '',
    manufacturer: 'ASUS',
    gpuChip: 'N/A',
    processSize: '4 nm',
    cores: 'N/A',
    memorySize: '12 GB',
    memoryType: 'GDDR6X',
    busWidth: '192-bit',
    bandwidth: '504 GB/s',
    boostClock: '2500 MHz',
    tdpWatts: '220W',
    busInterface: 'PCIe 4.0 x16',
    displayOutputs: '3x DisplayPort 1.4a, 1x HDMI 2.1a',
    timeSpyScore: 18000,
    lengthMm: 280,
    heightMm: 125,
    thicknessMm: 45,
    slotThickness: 2.2,
    powerConnector: '1x 8-pin',
    recommendedPsuW: 650,
    weightGrams: 1100,
    isSffFriendly: false,
    releaseYear: 2023,
    accentColor: '#3b82f6',
    description: ''
  });

  if (!isOpen) return null;

  const updatePortItems = (newItems: PortItem[]) => {
    setPortItems(newItems);
    const formattedStr = newItems
      .filter((item) => item.count > 0 && item.type)
      .map((item) => `${item.count}x ${item.type}`)
      .join(', ');

    setFormData((prev) => ({
      ...prev,
      displayOutputs: formattedStr || 'No Display Output'
    }));
  };

  const handleAddPortRow = () => {
    const newItem: PortItem = {
      id: `p-${Date.now()}-${Math.random()}`,
      count: 1,
      type: 'DisplayPort 1.4a'
    };
    updatePortItems([...portItems, newItem]);
  };

  const handleRemovePortRow = (id: string) => {
    const filtered = portItems.filter((item) => item.id !== id);
    updatePortItems(filtered);
  };

  const handlePortItemChange = (id: string, count: number, type: string) => {
    const updated = portItems.map((item) =>
      item.id === id ? { ...item, count, type } : item
    );
    updatePortItems(updated);
  };

  const handleScrape = async () => {
    if (!scrapeQuery.trim()) {
      setErrorMessage('Please enter a GPU model name or query to fetch.');
      return;
    }

    setIsScraping(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/gpus/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scrapeQuery })
      });

      const data = await res.json();

      if (res.ok && data.scrapedSpec) {
        setFormData((prev) => ({
          ...prev,
          ...data.scrapedSpec
        }));
        setSuccessMessage('Successfully fetched GPU specifications!');
      } else {
        setErrorMessage(data.error || 'Failed to fetch GPU specifications.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while auto-fetching GPU specs.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.chipset || !formData.manufacturer || !formData.lengthMm) {
      setErrorMessage('Please fill in all required fields (Name, Brand, Chipset, Manufacturer, Length).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/gpus/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('GPU specification successfully saved to Master Catalog!');
        setTimeout(() => {
          onGpuAdded();
          onClose();
        }, 1000);
      } else {
        setErrorMessage(data.error || 'Failed to insert GPU specification.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error communicating with backend API server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Add GPU Specification</h2>
            <p className="text-xs text-slate-400">Auto-fetch GPU specs or input specifications manually</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {successMessage}
          </div>
        )}

        {/* 1. Scraper Section */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-cyan-400">Auto-Fetch GPU Specifications</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter GPU model (e.g., RTX 4070 Ti Super, RX 7800 XT, GTX 1050 Ti)..."
              value={scrapeQuery}
              onChange={(e) => setScrapeQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleScrape();
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleScrape}
              disabled={isScraping}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
            >
              {isScraping ? 'Fetching...' : 'Fetch Spec'}
            </button>
          </div>
        </div>

        {/* 2. Unified GPU Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section A: Main Identification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">A. Primary Identification</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Full GPU Name (name) *</label>
                <input
                  type="text"
                  placeholder="e.g. ASUS ROG Strix GeForce RTX 4080 Super"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Brand (brand) *</label>
                <select
                  value={formData.brand || 'NVIDIA'}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value as 'NVIDIA' | 'AMD' | 'Intel' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                >
                  <option value="NVIDIA">NVIDIA</option>
                  <option value="AMD">AMD</option>
                  <option value="Intel">Intel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Manufacturer (manufacturer) *</label>
                <input
                  type="text"
                  placeholder="e.g. ASUS, MSI, Gigabyte"
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Chipset (chipset) *</label>
                <input
                  type="text"
                  placeholder="e.g. RTX 4080 Super, RX 7900 XTX"
                  value={formData.chipset || ''}
                  onChange={(e) => setFormData({ ...formData, chipset: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GPU Chip Architecture (gpu_chip)</label>
                <input
                  type="text"
                  placeholder="e.g. AD103, Navi 31"
                  value={formData.gpuChip || ''}
                  onChange={(e) => setFormData({ ...formData, gpuChip: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Process Node (process_size)</label>
                <input
                  type="text"
                  placeholder="e.g. 4 nm"
                  value={formData.processSize || ''}
                  onChange={(e) => setFormData({ ...formData, processSize: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Core Count (cores)</label>
                <input
                  type="text"
                  placeholder="e.g. 10240 Cores"
                  value={formData.cores || ''}
                  onChange={(e) => setFormData({ ...formData, cores: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section B: Memory & Graphics Performance */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">B. Memory Specs &amp; Performance</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">VRAM Capacity (memory_size) *</label>
                <select
                  value={formData.memorySize || '12 GB'}
                  onChange={(e) => setFormData({ ...formData, memorySize: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                >
                  {VRAM_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {formData.memorySize && !VRAM_SIZE_OPTIONS.includes(formData.memorySize) && (
                    <option value={formData.memorySize}>{formData.memorySize}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">VRAM Type (memory_type) *</label>
                <select
                  value={formData.memoryType || 'GDDR6X'}
                  onChange={(e) => setFormData({ ...formData, memoryType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                >
                  {VRAM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {formData.memoryType && !VRAM_TYPE_OPTIONS.includes(formData.memoryType) && (
                    <option value={formData.memoryType}>{formData.memoryType}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bus Width (bus_width)</label>
                <input
                  type="text"
                  placeholder="e.g. 256-bit"
                  value={formData.busWidth || ''}
                  onChange={(e) => setFormData({ ...formData, busWidth: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Memory Bandwidth (bandwidth)</label>
                <input
                  type="text"
                  placeholder="e.g. 736 GB/s"
                  value={formData.bandwidth || ''}
                  onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Boost Clock (boost_clock)</label>
                <input
                  type="text"
                  placeholder="e.g. 2550 MHz"
                  value={formData.boostClock || ''}
                  onChange={(e) => setFormData({ ...formData, boostClock: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">PCIe Bus (bus_interface) *</label>
                <select
                  value={formData.busInterface || 'PCIe 4.0 x16'}
                  onChange={(e) => setFormData({ ...formData, busInterface: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                >
                  {PCIE_BUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {formData.busInterface && !PCIE_BUS_OPTIONS.includes(formData.busInterface) && (
                    <option value={formData.busInterface}>{formData.busInterface}</option>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">3DMark TimeSpy Score (time_spy_score)</label>
                <input
                  type="number"
                  placeholder="e.g. 24500"
                  value={formData.timeSpyScore || ''}
                  onChange={(e) => setFormData({ ...formData, timeSpyScore: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section C: Physical Dimensions */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">C. Physical Dimensions (length_mm, height_mm, thickness_mm, slot_thickness, weight_grams)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Length (mm) *</label>
                <input
                  type="number"
                  placeholder="e.g. 304"
                  value={formData.lengthMm || ''}
                  onChange={(e) => setFormData({ ...formData, lengthMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Height (mm) *</label>
                <input
                  type="number"
                  placeholder="e.g. 137"
                  value={formData.heightMm || ''}
                  onChange={(e) => setFormData({ ...formData, heightMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Thickness (mm) *</label>
                <input
                  type="number"
                  placeholder="e.g. 61"
                  value={formData.thicknessMm || ''}
                  onChange={(e) => setFormData({ ...formData, thicknessMm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Slot Thickness *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.0"
                  value={formData.slotThickness || ''}
                  onChange={(e) => setFormData({ ...formData, slotThickness: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Weight (Grams)</label>
                <input
                  type="number"
                  placeholder="e.g. 1600"
                  value={formData.weightGrams || ''}
                  onChange={(e) => setFormData({ ...formData, weightGrams: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section D: Power & Display Outputs */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">D. Power &amp; Display Outputs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">TDP Rating (tdp_watts)</label>
                <input
                  type="text"
                  placeholder="e.g. 320W"
                  value={formData.tdpWatts || ''}
                  onChange={(e) => setFormData({ ...formData, tdpWatts: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Power Connector (power_connector) *</label>
                <select
                  value={formData.powerConnector || '1x 8-pin'}
                  onChange={(e) => setFormData({ ...formData, powerConnector: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                >
                  {POWER_CONNECTOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {formData.powerConnector && !POWER_CONNECTOR_OPTIONS.includes(formData.powerConnector) && (
                    <option value={formData.powerConnector}>{formData.powerConnector}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recommended PSU (recommended_psu_w) *</label>
                <select
                  value={formData.recommendedPsuW || 650}
                  onChange={(e) => setFormData({ ...formData, recommendedPsuW: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                >
                  {RECOMMENDED_PSU_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt} W</option>
                  ))}
                  {formData.recommendedPsuW && !RECOMMENDED_PSU_OPTIONS.includes(formData.recommendedPsuW) && (
                    <option value={formData.recommendedPsuW}>{formData.recommendedPsuW} W</option>
                  )}
                </select>
              </div>
            </div>

            {/* Fully Dynamic Display Outputs Port Row Builder */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-cyan-400">Display Outputs (Dynamic Port Builder)</label>
                <button
                  type="button"
                  onClick={handleAddPortRow}
                  className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1"
                >
                  + Add Display Port
                </button>
              </div>

              <div className="space-y-2">
                {portItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}.</span>

                    {/* Count Select */}
                    <select
                      value={item.count}
                      onChange={(e) => handlePortItemChange(item.id, Number(e.target.value), item.type)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:border-cyan-500"
                    >
                      <option value={1}>1x Port</option>
                      <option value={2}>2x Ports</option>
                      <option value={3}>3x Ports</option>
                      <option value={4}>4x Ports</option>
                      <option value={5}>5x Ports</option>
                    </select>

                    {/* Type Select */}
                    <select
                      value={item.type}
                      onChange={(e) => handlePortItemChange(item.id, item.count, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500"
                    >
                      {PORT_TYPE_OPTIONS.map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>

                    {/* Remove Row Button */}
                    {portItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePortRow(item.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove port row"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Formatted Output Result Preview */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Database String Format Result:</label>
                <input
                  type="text"
                  value={formData.displayOutputs || ''}
                  onChange={(e) => setFormData({ ...formData, displayOutputs: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section E: Metadata & Description */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">E. Metadata &amp; Description</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Release Year (release_year) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={formData.releaseYear || new Date().getFullYear()}
                  onChange={(e) => setFormData({ ...formData, releaseYear: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Accent Hex Color (accent_color)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accentColor || '#3b82f6'}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-9 h-9 p-1 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accentColor || '#3b82f6'}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="add-sff-friendly"
                  checked={Boolean(formData.isSffFriendly)}
                  onChange={(e) => setFormData({ ...formData, isSffFriendly: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="add-sff-friendly" className="text-xs text-slate-200 cursor-pointer select-none">
                  SFF Friendly (is_sff_friendly)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description (description)</label>
              <textarea
                rows={2}
                placeholder="Brief summary of GPU features and specs..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save to Master Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
