'use client';

import React, { useState } from 'react';
import { GPUSpec } from '@/types';
import { Tag, TrendingUp, X, Check } from 'lucide-react';

interface SetPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpu: GPUSpec | null;
  currentPriceIdr?: number;
  onSavePrice: (gpuId: string, priceIdr: number | undefined) => void;
}

export const SetPriceModal: React.FC<SetPriceModalProps> = ({
  isOpen,
  onClose,
  gpu,
  currentPriceIdr,
  onSavePrice,
}) => {
  const [priceInput, setPriceInput] = useState<string>(() =>
    currentPriceIdr ? currentPriceIdr.toString() : ''
  );

  if (!isOpen || !gpu) return null;

  const numericPrice = parseFloat(priceInput.replace(/[^0-9]/g, '')) || 0;

  // Calculate Price to Performance (pts per 1 Million IDR)
  const priceInMillions = numericPrice / 1_000_000;
  const ppRatio = priceInMillions > 0 ? (gpu.timeSpyScore / priceInMillions) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericPrice > 0) {
      onSavePrice(gpu.id, numericPrice);
    } else {
      onSavePrice(gpu.id, undefined);
    }
    onClose();
  };

  const handleClear = () => {
    setPriceInput('');
    onSavePrice(gpu.id, undefined);
    onClose();
  };

  // Quick preset helpers in IDR
  const applyPreset = (val: number) => {
    setPriceInput(val.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Atur Harga VGA (IDR)</h3>
              <p className="text-xs text-slate-400 font-mono">
                {gpu.manufacturer} &bull; {gpu.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase font-bold">
              Harga Pasar / Pembelian (Rupiah - IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-mono font-bold text-cyan-400">
                Rp
              </span>
              <input
                type="text"
                placeholder="Contoh: 15500000"
                value={priceInput ? Number(priceInput.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {numericPrice > 0
                ? `Terbaca: Rp ${numericPrice.toLocaleString('id-ID')}`
                : 'Masukkan nominal angka tanpa titik atau koma'}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Preset Cepat:</span>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {[5000000, 8000000, 12000000, 16000000, 22000000, 30000000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-[11px]"
                >
                  {(preset / 1000000)} Juta
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Price to Performance Calculation Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">3DMark TimeSpy Score:</span>
              <span className="text-indigo-400 font-bold">{gpu.timeSpyScore.toLocaleString()} pts</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Price to Performance:
              </span>
              <span className="text-sm font-extrabold font-mono text-emerald-400">
                {numericPrice > 0 ? (
                  `${Math.round(ppRatio).toLocaleString('id-ID')} pts / 1jt Rp`
                ) : (
                  <span className="text-slate-600 text-xs font-normal">Masukkan harga</span>
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 font-mono text-xs">
            {currentPriceIdr ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-800 text-rose-400 font-bold transition-all"
              >
                Hapus Harga
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Simpan Harga
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
