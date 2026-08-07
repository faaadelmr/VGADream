'use client';

import React, { useState } from 'react';
import { CaseSpec } from '@/types';
import { generateCaseId } from '@/utils/caseUtils';
import { X, Loader2 } from 'lucide-react';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseAdded: (newCase: CaseSpec) => void;
}

const FORM_FACTOR_OPTIONS: Array<'SFF / ITX' | 'Micro-ATX' | 'Mid-Tower' | 'Full-Tower'> = [
  'SFF / ITX',
  'Micro-ATX',
  'Mid-Tower',
  'Full-Tower'
];

const BRAND_OPTIONS = [
  'Fractal Design',
  'LIAN LI',
  'NZXT',
  'Corsair',
  'Cooler Master',
  'ASUS',
  'FormD',
  'DAN Cases',
  'SSUPD',
  'HYTE',
  'NCASE',
  'LOUQE',
  'Phanteks',
  'Montech',
  'DeepCool',
  'Jonsbo',
  'InWin',
  'Custom Brand'
];

export const AddCaseModal: React.FC<AddCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseAdded
}) => {
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Case Form State
  const [formData, setFormData] = useState<Partial<CaseSpec>>({
    name: '',
    brand: 'Fractal Design',
    formFactor: 'SFF / ITX',
    volumeLiters: 10.4,
    maxGpuLengthMm: 322,
    maxGpuHeightMm: 145,
    maxGpuSlotThickness: 3.6,
    maxGpuThicknessMm: 72,
    supportsVerticalMount: false,
    supportsFrontRadiator: false,
    maxCpuCoolerHeightMm: 77,
    notes: ''
  });

  if (!isOpen) return null;

  const handleScrapeComponentScale = async () => {
    if (!scrapeQuery.trim()) {
      setErrorMessage('Masukkan nama PC Case atau URL');
      return;
    }

    setIsScraping(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/cases/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scrapeQuery, url: scrapeQuery })
      });

      const data = await res.json();

      if (res.ok && data.scrapedSpec) {
        setFormData((prev) => ({
          ...prev,
          ...data.scrapedSpec
        }));
        setSuccessMessage('Berhasil mengimpor spesifikasi case!');
      } else {
        setErrorMessage(data.error || 'Gagal mengimpor data case.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan jaringan saat mengimpor data.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setErrorMessage('Nama PC Case wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const caseId = generateCaseId(formData.brand || 'Custom Brand', formData.name.trim());

    const newCase: CaseSpec = {
      id: caseId,
      name: formData.name.trim(),
      brand: formData.brand || 'Custom Brand',
      formFactor: formData.formFactor || 'SFF / ITX',
      volumeLiters: Number(formData.volumeLiters) || 12.0,
      maxGpuLengthMm: Number(formData.maxGpuLengthMm) || 320,
      maxGpuHeightMm: Number(formData.maxGpuHeightMm) || 140,
      maxGpuSlotThickness: Number(formData.maxGpuSlotThickness) || 3.5,
      maxGpuThicknessMm: Number(formData.maxGpuThicknessMm) || Math.round((Number(formData.maxGpuSlotThickness) || 3.5) * 20),
      supportsVerticalMount: Boolean(formData.supportsVerticalMount),
      supportsFrontRadiator: Boolean(formData.supportsFrontRadiator),
      maxCpuCoolerHeightMm: Number(formData.maxCpuCoolerHeightMm) || 75,
      notes: formData.notes?.trim() || 'Custom PC Case manual spec.'
    };

    // 1. Post to Database API endpoint (/api/cases/add)
    try {
      await fetch('/api/cases/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCase)
      });
    } catch (apiErr) {
      console.warn('Failed to post case to API server:', apiErr);
    }

    // 2. Persist to localStorage fallback
    try {
      const existing = localStorage.getItem('vgadream_custom_cases');
      const customCases: CaseSpec[] = existing ? JSON.parse(existing) : [];
      const updated = [newCase, ...customCases];
      localStorage.setItem('vgadream_custom_cases', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save custom case to localStorage:', err);
    }

    onCaseAdded(newCase);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-white">
              Tambah Custom PC Case
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Input manual atau Auto-Fetch spesifikasi clearance
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Auto-Fetch Scraper Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-cyan-950/30 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-cyan-400 text-xs font-bold font-mono">
                <span>Auto-Fetch Engine</span>
              </div>
              <span className="text-[10px] text-cyan-400/80 font-mono">Nama Case</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={scrapeQuery}
                onChange={(e) => setScrapeQuery(e.target.value)}
                placeholder="Cari nama case (misal: JONSBO N3 Black, FormD T1) atau paste URL ComponentScale"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={handleScrapeComponentScale}
                disabled={isScraping}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 whitespace-nowrap"
              >
                {isScraping ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching Specs...</span>
                  </div>
                ) : (
                  <span>Import Specs</span>
                )}
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 font-mono font-semibold bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/50">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/50">
                {successMessage}
              </p>
            )}
          </div>

          {/* Core Case Specs Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Case Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold text-slate-300">
                Nama PC Case <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: JONSBO N3 Black / Fractal Design Terra"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Brand / Produsen</label>
              <select
                value={formData.brand || 'Fractal Design'}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {BRAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Form Factor */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Form Factor Casing</label>
              <select
                value={formData.formFactor || 'SFF / ITX'}
                onChange={(e) => setFormData({ ...formData, formFactor: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {FORM_FACTOR_OPTIONS.map((ff) => (
                  <option key={ff} value={ff}>{ff}</option>
                ))}
              </select>
            </div>

            {/* Max GPU Length (mm) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-cyan-400 flex items-center justify-between">
                <span>Max GPU Length (Panjang)</span>
                <span className="text-slate-500 text-[10px]">mm</span>
              </label>
              <input
                type="number"
                value={formData.maxGpuLengthMm || ''}
                onChange={(e) => setFormData({ ...formData, maxGpuLengthMm: Number(e.target.value) })}
                placeholder="322"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Max GPU Height (mm) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-cyan-400 flex items-center justify-between">
                <span>Max GPU Height (Tinggi/Lebar)</span>
                <span className="text-slate-500 text-[10px]">mm</span>
              </label>
              <input
                type="number"
                value={formData.maxGpuHeightMm || ''}
                onChange={(e) => setFormData({ ...formData, maxGpuHeightMm: Number(e.target.value) })}
                placeholder="145"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Max GPU Slot Thickness (Slots) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
                <span>Max GPU Slot Thickness</span>
                <span className="text-slate-500 text-[10px]">Slots</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.maxGpuSlotThickness || ''}
                onChange={(e) => {
                  const slots = Number(e.target.value);
                  setFormData({
                    ...formData,
                    maxGpuSlotThickness: slots,
                    maxGpuThicknessMm: Math.round(slots * 20)
                  });
                }}
                placeholder="3.6"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Max GPU Thickness (mm) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
                <span>Max GPU Thickness</span>
                <span className="text-slate-500 text-[10px]">mm</span>
              </label>
              <input
                type="number"
                value={formData.maxGpuThicknessMm || ''}
                onChange={(e) => setFormData({ ...formData, maxGpuThicknessMm: Number(e.target.value) })}
                placeholder="72"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Max CPU Cooler Height (mm) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Max CPU Cooler Height</span>
                <span className="text-slate-500 text-[10px]">mm</span>
              </label>
              <input
                type="number"
                value={formData.maxCpuCoolerHeightMm || ''}
                onChange={(e) => setFormData({ ...formData, maxCpuCoolerHeightMm: Number(e.target.value) })}
                placeholder="77"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Case Volume (Liters) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Volume Casing</span>
                <span className="text-slate-500 text-[10px]">Liters</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.volumeLiters || ''}
                onChange={(e) => setFormData({ ...formData, volumeLiters: Number(e.target.value) })}
                placeholder="10.4"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.supportsVerticalMount)}
                onChange={(e) => setFormData({ ...formData, supportsVerticalMount: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
              />
              <span className="text-xs font-mono font-bold text-slate-300">Dukungan GPU Vertical Mount (Riser)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.supportsFrontRadiator)}
                onChange={(e) => setFormData({ ...formData, supportsFrontRadiator: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
              />
              <span className="text-xs font-mono font-bold text-slate-300">Dukungan Front Radiator AIO</span>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300">Catatan / Clearance Spine Config</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan mengenai konfigurasi spine, clearance kabel, atau rekomendasi psu..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Case...</span>
                </div>
              ) : (
                <span>Simpan Custom PC Case</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
