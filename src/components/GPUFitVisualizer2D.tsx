'use client';

import React, { useState } from 'react';
import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';
import { parsePowerConnectors, PowerSocketItem } from '@/utils/powerConnector';
import { parseDisplayOutputs } from '@/utils/displayOutputs';
import { Cpu, Fan, Zap, Maximize2, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';

interface GPUFitVisualizer2DProps {
  gpu: GPUSpec;
  pcCase: CaseSpec;
  clearance: ClearanceResult;
  isCompatible: boolean;
}

export interface PCIeLaneSpec {
  lanes: 'x16' | 'x8' | 'x4';
  pins: number;
  lengthRatio: number; // 1.0 for x16, 0.58 for x8, 0.35 for x4
  physicalMm: number; // Approx physical length in mm
  label: string;
}

export function parsePCIeLanes(busInterface?: string): PCIeLaneSpec {
  if (!busInterface) return { lanes: 'x16', pins: 164, lengthRatio: 1.0, physicalMm: 89, label: 'PCIe 4.0 x16' };
  const norm = busInterface.toLowerCase();
  if (norm.includes('x4')) {
    return { lanes: 'x4', pins: 64, lengthRatio: 0.35, physicalMm: 31, label: busInterface || 'PCIe x4' };
  }
  if (norm.includes('x8')) {
    return { lanes: 'x8', pins: 98, lengthRatio: 0.58, physicalMm: 52, label: busInterface || 'PCIe x8' };
  }
  return { lanes: 'x16', pins: 164, lengthRatio: 1.0, physicalMm: 89, label: busInterface || 'PCIe x16' };
}

export function parseFanCount(gpu: GPUSpec): number {
  const text = `${gpu.name} ${gpu.description || ''}`.toLowerCase();

  if (text.includes('triple fan') || text.includes('3x fan') || text.includes('tri frozr') || text.includes('trio') || text.includes('strix') || text.includes('suprim')) {
    return 3;
  }
  if (text.includes('dual fan') || text.includes('2x fan') || text.includes('twin frozr') || text.includes('dual oc') || text.includes('dual')) {
    return 2;
  }
  if (text.includes('single fan') || text.includes('1x fan') || text.includes('mini itx') || text.includes('itx') || text.includes('aero itx')) {
    return 1;
  }

  if (gpu.lengthMm < 190) return 1;
  if (gpu.lengthMm < 265) return 2;
  return 3;
}

export const GPUFitVisualizer2D: React.FC<GPUFitVisualizer2DProps> = ({
  gpu,
  pcCase,
  clearance
}) => {
  const [activeSubView, setActiveSubView] = useState<'top' | 'side'>('top');

  // 1. Dynamic Fan count detection (from model keywords & length heuristic)
  const fanCount = parseFanCount(gpu);

  // 2. Parse PCIe lanes (x4, x8, x16)
  const pcieSpec = parsePCIeLanes(gpu.busInterface);

  // 3. Parse Power Connectors
  const powerSpec = parsePowerConnectors(gpu.powerConnector);

  // 4. Parse Display Outputs Ports (DP, HDMI, USB-C) from database
  const displayPorts = parseDisplayOutputs(gpu.displayOutputs);

  // Scale calculations for SVG (Standardized viewport with 140mm right padding for badges)
  const maxViewWidthMm = Math.max(gpu.lengthMm, pcCase.maxGpuLengthMm) + 140;
  const svgWidth = 760;
  const mmToPx = svgWidth / maxViewWidthMm;

  // GPU dimensions in SVG units
  const gpuLengthPx = gpu.lengthMm * mmToPx;
  const caseLengthPx = pcCase.maxGpuLengthMm * mmToPx;
  const marginMm = clearance.lengthMarginMm;
  const marginPx = Math.abs(marginMm) * mmToPx;

  // PCIe connector positioning
  const pcieSlotWidthPx = Math.min(gpuLengthPx * 0.7, 89 * mmToPx * pcieSpec.lengthRatio);
  const pcieStartX = 40; // Offset from rear bracket

  // Color theme generator based on brand accent
  const getBrandAccent = () => {
    const brand = gpu.brand.toUpperCase();
    if (brand.includes('NVIDIA')) return { primary: '#10b981', bg: 'from-emerald-950/40' };
    if (brand.includes('AMD')) return { primary: '#ef4444', bg: 'from-rose-950/40' };
    return { primary: '#06b6d4', bg: 'from-cyan-950/40' };
  };

  const accent = getBrandAccent();

  // Render individual Power Socket Pin Grid for 2D Side View
  const renderPowerSocket2D = (item: PowerSocketItem, socketIdx: number) => {
    const is16Pin = item.type === '12VHPWR';
    const cols = item.cols;
    const rows = 2;

    return (
      <div
        key={`power-socket-${socketIdx}`}
        className="inline-flex flex-col items-center bg-slate-950/90 border-2 border-amber-400/80 rounded-md p-1.5 shadow-[0_0_12px_rgba(251,191,36,0.3)] relative group"
      >
        {/* Clip Latch Top */}
        <div className="w-4 h-1 bg-amber-400/90 rounded-t-sm -mt-2 mb-1" />

        {/* 16-pin Micro Sense Pins (Top row for 12VHPWR) */}
        {is16Pin && (
          <div className="flex gap-1 mb-1 px-1 py-0.5 bg-amber-500/20 rounded border border-amber-400/50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`sense-${i}`} className="w-1.5 h-1.5 bg-amber-300 rounded-full shadow-[0_0_4px_#f59e0b]" />
            ))}
          </div>
        )}

        {/* Main Pin Grid Sockets */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols * rows }).map((_, pinIdx) => {
            const isSquare = (pinIdx + socketIdx) % 2 === 0;
            return (
              <div
                key={`pin-${pinIdx}`}
                className={`w-3.5 h-3.5 bg-slate-900 border border-amber-400/80 flex items-center justify-center ${
                  isSquare ? 'rounded-none' : 'rounded-sm'
                }`}
              >
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_#fbbf24]" />
              </div>
            );
          })}
        </div>

        {/* Hover Label */}
        <span className="absolute -top-7 px-2 py-0.5 bg-amber-500 text-slate-950 font-mono text-[9px] font-extrabold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
          {is16Pin ? '12VHPWR (16-Pin 450W+)' : `${item.pinCount}-Pin PCIe Socket`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 text-slate-200 font-sans">
      {/* 2D Schematic Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              2D View <span className="text-slate-500 font-normal">&bull;</span> Case: <span className="text-cyan-400 font-semibold">{pcCase.name}</span>
            </h3>
          </div>
        </div>

        {/* View Selection & Toggles */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setActiveSubView('top')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubView === 'top'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Top View (Fans &amp; PCIe)
            </button>
            <button
              onClick={() => setActiveSubView('side')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubView === 'side'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Side View (Power &amp; Brand)
            </button>
          </div>
        </div>
      </div>

      {/* Main 2D Schematic Canvas Surface */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border border-slate-800/80 p-4 sm:p-6 overflow-hidden">
        {/* Subtle CAD Blueprint Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative z-10 space-y-8">
          {/* ============================================================ */}
          {/* TOP VIEW SCHEMATIC (Fans, PCIe Slot & PC Case Enclosure)    */}
          {/* ============================================================ */}
          {activeSubView === 'top' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 font-mono text-xs">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span>TOP VIEW CAD &mdash; {fanCount} Fan(s), {pcieSpec.lanes} Slot, {displayPorts.length} Ports ({gpu.displayOutputs || 'Standard'})</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  PCIe Spec: <strong className="text-amber-400">{pcieSpec.label}</strong> ({pcieSpec.pins} pins)
                </div>
              </div>

              {/* Top View Vector SVG */}
              <div className="w-full overflow-x-auto py-2">
                <svg
                  viewBox={`0 0 ${svgWidth} 260`}
                  className="w-full max-w-full h-auto drop-shadow-2xl"
                  style={{ minWidth: '640px' }}
                >
                  <defs>
                    {/* Metal Shroud Gradient */}
                    <linearGradient id="shroudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="50%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>

                    {/* Gold Finger PCIe Pins Gradient */}
                    <linearGradient id="goldPinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="70%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#92400e" />
                    </linearGradient>

                    {/* PCB Circuit Board Texture */}
                    <linearGradient id="pcbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#064e3b" />
                      <stop offset="50%" stopColor="#022c22" />
                      <stop offset="100%" stopColor="#064e3b" />
                    </linearGradient>

                    {/* PC Case Blueprint Fill Gradient */}
                    <linearGradient id="caseChamberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(15, 23, 42, 0.4)" />
                      <stop offset="100%" stopColor="rgba(30, 41, 59, 0.2)" />
                    </linearGradient>
                  </defs>

                  {/* Dynamic Height Scale Calculations for Top View (Bottom fixed at y=180 for PCIe slot) */}
                  {(() => {
                    const yBottom = 180;
                    const heightScale = 0.92;
                    const gpuHeightPx = Math.min(145, Math.max(90, gpu.heightMm * heightScale));
                    const caseHeightPx = Math.min(155, Math.max(90, pcCase.maxGpuHeightMm * heightScale));

                    const yGpuTop = yBottom - gpuHeightPx;
                    const yCaseTop = yBottom - caseHeightPx;
                    const fanCenterY = yGpuTop + gpuHeightPx / 2;

                    return (
                      <g id="top-view-assembly">
                        {/* 1. PROMINENT PC CASE BLUEPRINT ENCLOSURE BOX (Bottom fixed at PCIe slot y=180, Top shows height gap) */}
                        <g id="pc-case-enclosure-top">
                          {/* PC Case Chamber Outer Frame */}
                          <rect
                            x={20}
                            y={yCaseTop}
                            width={caseLengthPx}
                            height={caseHeightPx}
                            rx={6}
                            fill="url(#caseChamberGrad)"
                            stroke={clearance.lengthMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                            strokeWidth="2"
                            strokeDasharray="6,4"
                          />

                          {/* PC Case Front Panel Wall / Radiator Bracket Representation */}
                          <rect
                            x={20 + caseLengthPx - 8}
                            y={yCaseTop}
                            width={8}
                            height={caseHeightPx}
                            fill={clearance.lengthMarginMm >= 0 ? '#059669' : '#e11d48'}
                            rx={2}
                            opacity="0.8"
                          />
                          <text
                            x={20 + caseLengthPx - 4}
                            y={yCaseTop + caseHeightPx / 2}
                            fill="#ffffff"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                            transform={`rotate(-90, ${20 + caseLengthPx - 4}, ${yCaseTop + caseHeightPx / 2})`}
                          >
                            CASE FRONT WALL
                          </text>

                          {/* PC Case Maximum Length Boundary Line */}
                          <line
                            x1={20 + caseLengthPx}
                            y1={15}
                            x2={20 + caseLengthPx}
                            y2={228}
                            stroke={clearance.lengthMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                            strokeWidth="2"
                          />

                          {/* PC Case Max Length Bottom Header Label (Centered under Case Box) */}
                          {(() => {
                            const caseBadgeText = `BATAS CASE: ${pcCase.maxGpuLengthMm} mm (${pcCase.name})`;
                            const caseBadgeWidth = Math.min(360, Math.max(180, caseBadgeText.length * 7 + 24));
                            const caseBadgeX = Math.max(10, Math.min(20 + caseLengthPx / 2 - caseBadgeWidth / 2, svgWidth - caseBadgeWidth - 10));

                            return (
                              <g transform={`translate(${caseBadgeX}, 232)`}>
                                <rect
                                  x={0}
                                  y={0}
                                  width={caseBadgeWidth}
                                  height={22}
                                  rx={5}
                                  fill="#090d16"
                                  stroke={clearance.lengthMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                                  strokeWidth="1.5"
                                />
                                <text
                                  x={caseBadgeWidth / 2}
                                  y={15}
                                  fill={clearance.lengthMarginMm >= 0 ? '#34d399' : '#f87171'}
                                  fontSize="9.5"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {caseBadgeText}
                                </text>
                              </g>
                            );
                          })()}
                        </g>

                        {/* 2. REAR I/O BRACKET (PCIe Mounting Plate) WITH DYNAMIC DISPLAY PORTS */}
                        <g id="rear-io-bracket">
                          <rect
                            x={10}
                            y={Math.min(yCaseTop, yGpuTop) - 5}
                            width={10}
                            height={yBottom - Math.min(yCaseTop, yGpuTop) + 10}
                            rx={2}
                            fill="#94a3b8"
                            stroke="#475569"
                            strokeWidth="1"
                          />
                          {/* Dynamic DisplayPort / HDMI / USB-C Cutouts from Database */}
                          {displayPorts.map((port, pIdx) => {
                            const bracketTop = Math.min(yCaseTop, yGpuTop);
                            const bracketHeight = yBottom - bracketTop;
                            const step = bracketHeight / (displayPorts.length + 1);
                            const portY = bracketTop + step * (pIdx + 1) - 6;

                            const portColor =
                              port.type === 'HDMI'
                                ? '#f59e0b'
                                : port.type === 'USBC'
                                ? '#a855f7'
                                : port.type === 'DVI'
                                ? '#64748b'
                                : '#38bdf8';

                            return (
                              <g key={`top-port-${pIdx}`}>
                                <rect
                                  x={12}
                                  y={portY}
                                  width={6}
                                  height={12}
                                  fill="#0f172a"
                                  stroke={portColor}
                                  strokeWidth="1"
                                  rx={1}
                                />
                                <rect
                                  x={13.5}
                                  y={portY + 2}
                                  width={3}
                                  height={8}
                                  fill={portColor}
                                  opacity="0.85"
                                  rx={0.5}
                                />
                              </g>
                            );
                          })}
                        </g>

                        {/* 3. GPU PCB BACKPLATE BASE */}
                        <rect
                          x={20}
                          y={yGpuTop}
                          width={gpuLengthPx}
                          height={gpuHeightPx}
                          rx={6}
                          fill="url(#pcbGrad)"
                          stroke="#059669"
                          strokeWidth="1.5"
                          filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                        />

                        {/* 4. MAIN COOLER SHROUD */}
                        <rect
                          x={22}
                          y={yGpuTop + 3}
                          width={gpuLengthPx - 4}
                          height={gpuHeightPx - 6}
                          rx={5}
                          fill="url(#shroudGrad)"
                          stroke={accent.primary}
                          strokeWidth="1"
                        />

                        {/* Shroud Decorative Cutouts / Armor Lines */}
                        <line x1={30} y1={yGpuTop + 7} x2={20 + gpuLengthPx - 10} y2={yGpuTop + 7} stroke="#334155" strokeWidth="1" />
                        <line x1={30} y1={yBottom - 7} x2={20 + gpuLengthPx - 10} y2={yBottom - 7} stroke="#334155" strokeWidth="1" />

                        {/* 5. COOLING FANS ASSEMBLY (1, 2, or 3 Fans) */}
                        {Array.from({ length: fanCount }).map((_, fIdx) => {
                          const sectionWidth = (gpuLengthPx - 20) / fanCount;
                          const fanCenterX = 20 + 10 + sectionWidth * (fIdx + 0.5);
                          const fanRadius = Math.min(sectionWidth * 0.42, (gpuHeightPx - 16) / 2, 52);

                          return (
                            <g key={`fan-${fIdx}`} id={`fan-group-${fIdx}`}>
                              {/* Fan Circular Frame Ring */}
                              <circle
                                cx={fanCenterX}
                                cy={fanCenterY}
                                r={fanRadius}
                                fill="#090d16"
                                stroke={accent.primary}
                                strokeWidth="1.5"
                                opacity="0.9"
                              />
                              <circle
                                cx={fanCenterX}
                                cy={fanCenterY}
                                r={fanRadius - 3}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1"
                              />

                              {/* Animated Blades Group (Always Spinning Automatically) */}
                              <g className="origin-center animate-spin" style={{ transformOrigin: `${fanCenterX}px ${fanCenterY}px`, animationDuration: '4s' }}>
                                {Array.from({ length: 9 }).map((_, bIdx) => {
                                  const angle = (bIdx * 360) / 9;
                                  const rad = (angle * Math.PI) / 180;
                                  const x2 = fanCenterX + (fanRadius - 6) * Math.cos(rad);
                                  const y2 = fanCenterY + (fanRadius - 6) * Math.sin(rad);

                                  return (
                                    <path
                                      key={`blade-${bIdx}`}
                                      d={`M ${fanCenterX} ${fanCenterY} Q ${fanCenterX + 12 * Math.cos(rad + 0.5)} ${fanCenterY + 12 * Math.sin(rad + 0.5)} ${x2} ${y2}`}
                                      stroke="#475569"
                                      strokeWidth="5"
                                      strokeLinecap="round"
                                      fill="none"
                                      opacity="0.85"
                                    />
                                  );
                                })}
                              </g>

                              {/* Center Fan Cap with Brand Logo */}
                              <circle
                                cx={fanCenterX}
                                cy={fanCenterY}
                                r={14}
                                fill="#0f172a"
                                stroke={accent.primary}
                                strokeWidth="1.5"
                              />
                              <text
                                x={fanCenterX}
                                y={fanCenterY + 3}
                                fill="#f8fafc"
                                fontSize="7"
                                fontFamily="monospace"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {gpu.manufacturer.slice(0, 5).toUpperCase()}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}

                  {/* 6. PCIE GOLD FINGER PIN CONNECTOR (DYNAMIC LENGTH BASED ON x4, x8, x16) */}
                  <g id="pcie-gold-finger-connector">
                    {/* PCB Tab Extension */}
                    <rect
                      x={pcieStartX}
                      y={180}
                      width={pcieSlotWidthPx}
                      height={12}
                      fill="#064e3b"
                      stroke="#059669"
                      strokeWidth="1"
                      rx={1}
                    />

                    {/* Gold Finger Pin Strips */}
                    <rect
                      x={pcieStartX + 2}
                      y={182}
                      width={pcieSlotWidthPx - 4}
                      height={8}
                      fill="url(#goldPinGrad)"
                      rx={1}
                    />

                    {/* PCIe Key Notch (Standard notch gap near pin #11) */}
                    <rect
                      x={pcieStartX + Math.min(18 * mmToPx, pcieSlotWidthPx * 0.2)}
                      y={180}
                      width={4}
                      height={12}
                      fill="#090d16"
                    />

                    {/* Individual Gold Pin Texture Lines */}
                    {Array.from({ length: Math.min(30, Math.floor(pcieSlotWidthPx / 3)) }).map((_, pIdx) => (
                      <line
                        key={`gold-line-${pIdx}`}
                        x1={pcieStartX + 4 + pIdx * 3}
                        y1={183}
                        x2={pcieStartX + 4 + pIdx * 3}
                        y2={189}
                        stroke="#78350f"
                        strokeWidth="0.8"
                      />
                    ))}

                    {/* PCIe Lane Spec Badge Overlay */}
                    <g id="pcie-badge-box">
                      <rect
                        x={Math.max(10, pcieStartX + pcieSlotWidthPx / 2 - 80)}
                        y={197}
                        width={160}
                        height={18}
                        rx={5}
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />
                      <text
                        x={Math.max(10, pcieStartX + pcieSlotWidthPx / 2 - 80) + 80}
                        y={209}
                        fill="#fbbf24"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="extrabold"
                        textAnchor="middle"
                      >
                        {pcieSpec.lanes.toUpperCase()} Connector ({pcieSpec.pins}P)
                      </text>
                    </g>
                  </g>

                  {/* 7. CLEARANCE REMAINING MARGIN BRACKET & BADGE (SISA KELONGGARAN PANJANG) */}
                  {(() => {
                    const yBottom = 180;
                    const heightScale = 0.92;
                    const gpuHeightPx = Math.min(145, Math.max(90, gpu.heightMm * heightScale));
                    const yGpuTop = yBottom - gpuHeightPx;
                    const midY = yGpuTop + gpuHeightPx / 2;

                    return (
                      <g id="remaining-clearance-bracket-top">
                        {marginMm >= 0 ? (
                          /* CLEARANCE PASSED (SISA RUANG POSITIF) */
                          <g>
                            {/* Remaining Gap Dimension Bracket Line */}
                            <line x1={20 + gpuLengthPx} y1={midY} x2={20 + caseLengthPx} y2={midY} stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
                            <line x1={20 + gpuLengthPx} y1={midY - 10} x2={20 + gpuLengthPx} y2={midY + 10} stroke="#10b981" strokeWidth="2" />
                            <line x1={20 + caseLengthPx} y1={midY - 10} x2={20 + caseLengthPx} y2={midY + 10} stroke="#10b981" strokeWidth="2" />

                            {/* Remaining Margin Badge Box */}
                            {(() => {
                              const textStr = `SISA RUANG: +${marginMm} mm (AMAN)`;
                              const badgeW = 175;
                              const badgeX = Math.min(Math.max(20 + gpuLengthPx + (caseLengthPx - gpuLengthPx) / 2 - badgeW / 2, 20 + gpuLengthPx + 5), svgWidth - badgeW - 10);
                              return (
                                <g>
                                  <rect
                                    x={badgeX}
                                    y={midY - 12}
                                    width={badgeW}
                                    height={24}
                                    rx={5}
                                    fill="#022c22"
                                    stroke="#10b981"
                                    strokeWidth="1.5"
                                    className="shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                  />
                                  <text
                                    x={badgeX + badgeW / 2}
                                    y={midY + 4}
                                    fill="#34d399"
                                    fontSize="9.5"
                                    fontFamily="monospace"
                                    fontWeight="extrabold"
                                    textAnchor="middle"
                                  >
                                    {textStr}
                                  </text>
                                </g>
                              );
                            })()}
                          </g>
                        ) : (
                          /* OVERLENGTH COLLISION (TABRAKAN / TERTABRAK WALL) */
                          <g>
                            {/* Overlength Bracket Line */}
                            <line x1={20 + caseLengthPx} y1={midY} x2={20 + gpuLengthPx} y2={midY} stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,3" />
                            <line x1={20 + caseLengthPx} y1={midY - 10} x2={20 + caseLengthPx} y2={midY + 10} stroke="#f43f5e" strokeWidth="2" />
                            <line x1={20 + gpuLengthPx} y1={midY - 10} x2={20 + gpuLengthPx} y2={midY + 10} stroke="#f43f5e" strokeWidth="2" />

                            {/* Collision Badge Box */}
                            {(() => {
                              const textStr = `TABRAKAN: ${marginMm} mm (TIDAK MUAT)`;
                              const badgeW = 210;
                              const badgeX = Math.min(20 + caseLengthPx + 5, svgWidth - badgeW - 10);
                              return (
                                <g>
                                  <rect
                                    x={badgeX}
                                    y={midY - 12}
                                    width={badgeW}
                                    height={24}
                                    rx={5}
                                    fill="#4c0519"
                                    stroke="#f43f5e"
                                    strokeWidth="1.5"
                                    className="shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                  />
                                  <text
                                    x={badgeX + badgeW / 2}
                                    y={midY + 4}
                                    fill="#f87171"
                                    fontSize="9.5"
                                    fontFamily="monospace"
                                    fontWeight="extrabold"
                                    textAnchor="middle"
                                  >
                                    {textStr}
                                  </text>
                                </g>
                              );
                            })()}
                          </g>
                        )}
                      </g>
                    );
                  })()}

                  {/* 8. GPU LENGTH & HEIGHT DIMENSION CALLOUTS (PANJANG & TINGGI/LEBAR) */}
                  <g id="dimension-callouts-top">
                    {/* GPU Length Marker Line (Horizontal Top) */}
                    <line x1={20} y1={10} x2={20 + gpuLengthPx} y2={10} stroke="#38bdf8" strokeWidth="1" />
                    <line x1={20} y1={5} x2={20} y2={15} stroke="#38bdf8" strokeWidth="1" />
                    <line x1={20 + gpuLengthPx} y1={5} x2={20 + gpuLengthPx} y2={15} stroke="#38bdf8" strokeWidth="1" />
                    <rect x={20 + gpuLengthPx / 2 - 65} y={1} width={130} height={16} rx={3} fill="#090d16" stroke="#38bdf8" strokeWidth="1" />
                    <text
                      x={20 + gpuLengthPx / 2}
                      y={12}
                      fill="#38bdf8"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      VGA PANJANG: {gpu.lengthMm} mm
                    </text>

                    {/* GPU Height & Case Height Boundary & Clearance Lines (Vertical Dimension Axis) */}
                    {(() => {
                      const yBottom = 180;
                      const heightScale = 0.92;
                      const gpuHeightPx = Math.min(145, Math.max(90, gpu.heightMm * heightScale));
                      const caseHeightPx = Math.min(155, Math.max(90, pcCase.maxGpuHeightMm * heightScale));
                      const yGpuTop = yBottom - gpuHeightPx;
                      const yCaseTop = yBottom - caseHeightPx;
                      const heightMarginMm = clearance.heightMarginMm;
                      const heightGapPx = Math.abs(yGpuTop - yCaseTop);

                      return (
                        <g id="height-clearance-callouts-top">
                          {/* Top Case Height Limit Boundary Line (Horizontal Dashed Line at yCaseTop) */}
                          <line
                            x1={20}
                            y1={yCaseTop}
                            x2={20 + caseLengthPx}
                            y2={yCaseTop}
                            stroke={heightMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                          />

                          {/* Case Max Height Limit Badge attached to Top Boundary Line */}
                          <g transform={`translate(20, ${Math.max(2, yCaseTop - 20)})`}>
                            <rect
                              x={0}
                              y={0}
                              width={145}
                              height={18}
                              rx={4}
                              fill="#090d16"
                              stroke={heightMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                              strokeWidth="1.5"
                            />
                            <text
                              x={72.5}
                              y={12}
                              fill={heightMarginMm >= 0 ? '#34d399' : '#f87171'}
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              BATAS TINGGI CASE: {pcCase.maxGpuHeightMm}mm
                            </text>
                          </g>

                          {/* GPU Height Vertical Ruler Line (Left Side outside I/O bracket) */}
                          <line x1={4} y1={yGpuTop} x2={4} y2={yBottom} stroke="#38bdf8" strokeWidth="1" />
                          <line x1={1} y1={yGpuTop} x2={7} y2={yGpuTop} stroke="#38bdf8" strokeWidth="1" />
                          <line x1={1} y1={yBottom} x2={7} y2={yBottom} stroke="#38bdf8" strokeWidth="1" />

                          {/* Height Gap Vertical Bracket Line (between yCaseTop & yGpuTop) */}
                          {heightGapPx > 4 && (
                            <g>
                              <line
                                x1={Math.min(20 + gpuLengthPx + 15, svgWidth - 195)}
                                y1={yCaseTop}
                                x2={Math.min(20 + gpuLengthPx + 15, svgWidth - 195)}
                                y2={yGpuTop}
                                stroke={heightMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                                strokeWidth="1.5"
                                strokeDasharray="3,3"
                              />
                              <line
                                x1={Math.min(20 + gpuLengthPx + 10, svgWidth - 200)}
                                y1={yCaseTop}
                                x2={Math.min(20 + gpuLengthPx + 20, svgWidth - 190)}
                                y2={yCaseTop}
                                stroke={heightMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                                strokeWidth="1.5"
                              />
                              <line
                                x1={Math.min(20 + gpuLengthPx + 10, svgWidth - 200)}
                                y1={yGpuTop}
                                x2={Math.min(20 + gpuLengthPx + 20, svgWidth - 190)}
                                y2={yGpuTop}
                                stroke={heightMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                                strokeWidth="1.5"
                              />
                            </g>
                          )}

                          {/* Height Clearance Margin Badge (Positioned at Top Clearance Gap) */}
                          {heightMarginMm >= 0 ? (
                            <g transform={`translate(${Math.max(175, Math.min(20 + gpuLengthPx / 2 - 85, svgWidth - 190))}, ${heightGapPx >= 16 ? yCaseTop + heightGapPx / 2 - 9 : Math.max(2, yCaseTop - 20)})`}>
                              <rect x={0} y={0} width={170} height={18} rx={4} fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                              <text x={85} y={12} fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="extrabold" textAnchor="middle">
                                SISA TINGGI: +{heightMarginMm} mm (AMAN)
                              </text>
                            </g>
                          ) : (
                            <g transform={`translate(${Math.max(175, Math.min(20 + gpuLengthPx / 2 - 100, svgWidth - 210))}, ${Math.max(2, yCaseTop - 20)})`}>
                              <rect x={0} y={0} width={200} height={18} rx={4} fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
                              <text x={100} y={12} fill="#f87171" fontSize="8.5" fontFamily="monospace" fontWeight="extrabold" textAnchor="middle">
                                TABRAKAN TINGGI: {heightMarginMm} mm (TIDAK MUAT)
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                </svg>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SIDE VIEW SCHEMATIC (GPU Branding Name & Power Pin Sockets)  */}
          {/* ============================================================ */}
          {activeSubView === 'side' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 font-mono text-xs">
                <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                  <span>SIDE VIEW CAD &mdash; Shroud Branding Name, Power Sockets &amp; Case Height Limits</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Power Config: <strong className="text-amber-400">{gpu.powerConnector}</strong> ({gpu.tdpWatts})
                </div>
              </div>

              {/* Side View Vector SVG */}
              <div className="w-full overflow-x-auto py-2">
                <svg
                  viewBox={`0 0 ${svgWidth} 220`}
                  className="w-full max-w-full h-auto drop-shadow-2xl"
                  style={{ minWidth: '640px' }}
                >
                  <defs>
                    <linearGradient id="sideShroudGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="30%" stopColor="#1e293b" />
                      <stop offset="70%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="rgbTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                    <linearGradient id="heatpipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#b45309" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                  </defs>

                  {/* 1. PC CASE BLUEPRINT SLOT THICKNESS ENCLOSURE BOX */}
                  <g id="pc-case-enclosure-side">
                    {/* Case Max Length Frame */}
                    <rect
                      x={20}
                      y={45}
                      width={caseLengthPx}
                      height={120}
                      rx={6}
                      fill="none"
                      stroke={clearance.lengthMarginMm >= 0 ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      opacity="0.6"
                    />

                    {/* Side Panel Cable Clearance Upper Limit */}
                    <line x1={20} y1={20} x2={20 + caseLengthPx} y2={20} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={25} y={14} fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="start">
                      BATAS PANEL SAMPING CASE (KABEL CLEARANCE)
                    </text>
                  </g>

                  {/* 2. REAR I/O BRACKET SIDE PROFILE WITH DYNAMIC DISPLAY PORTS */}
                  <g id="rear-io-bracket-side">
                    <rect x={10} y={45} width={10} height={120} rx={2} fill="#64748b" stroke="#334155" strokeWidth="1" />
                    <rect x={5} y={40} width={15} height={6} fill="#475569" rx={1} />
                    <rect x={5} y={164} width={15} height={6} fill="#475569" rx={1} />

                    {/* Dynamic Port Cutout Slots on Side Profile */}
                    {displayPorts.map((port, pIdx) => {
                      const step = 100 / (displayPorts.length + 1);
                      const portY = 55 + step * (pIdx + 1) - 4;
                      const portColor =
                        port.type === 'HDMI'
                          ? '#f59e0b'
                          : port.type === 'USBC'
                          ? '#a855f7'
                          : port.type === 'DVI'
                          ? '#94a3b8'
                          : '#38bdf8';

                      return (
                        <g key={`side-port-${pIdx}`}>
                          <rect
                            x={6}
                            y={portY}
                            width={5}
                            height={8}
                            fill={portColor}
                            stroke="#0f172a"
                            strokeWidth="0.8"
                            rx={1}
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* 3. COPPER HEATPIPES & COOLING FINS INSIDE SHROUD */}
                  <g id="heatpipe-fins">
                    {/* Heatsink Aluminum Fin Texture */}
                    {Array.from({ length: Math.min(45, Math.floor(gpuLengthPx / 6)) }).map((_, finIdx) => (
                      <line
                        key={`fin-${finIdx}`}
                        x1={25 + finIdx * 6}
                        y1={55}
                        x2={25 + finIdx * 6}
                        y2={155}
                        stroke="#334155"
                        strokeWidth="1.2"
                        opacity="0.7"
                      />
                    ))}

                    {/* Copper Heatpipe Rods */}
                    <rect x={30} y={80} width={gpuLengthPx - 20} height={6} rx={3} fill="url(#heatpipeGrad)" />
                    <rect x={30} y={125} width={gpuLengthPx - 20} height={6} rx={3} fill="url(#heatpipeGrad)" />
                  </g>

                  {/* 4. MAIN SIDE SHROUD FRAME */}
                  <rect
                    x={20}
                    y={48}
                    width={gpuLengthPx}
                    height={114}
                    rx={6}
                    fill="url(#sideShroudGrad)"
                    stroke={accent.primary}
                    strokeWidth="1.5"
                  />

                  {/* 5. ILLUMINATED GPU NAME & BRANDING TEXT (Auto-fitting Text & Box) */}
                  {(() => {
                    const fullBrandStr = `${gpu.manufacturer} ${gpu.name}`.toUpperCase();
                    const maxAvailableWidth = Math.max(120, gpuLengthPx - 40);
                    const brandFontSize = fullBrandStr.length > 30 ? 9.5 : fullBrandStr.length > 22 ? 11 : 12.5;
                    const charWidthPx = brandFontSize * 0.62;
                    
                    const brandBoxWidth = Math.min(maxAvailableWidth, Math.max(130, fullBrandStr.length * charWidthPx + 24));
                    const maxChars = Math.floor((brandBoxWidth - 14) / charWidthPx);
                    const displayBrandStr = fullBrandStr.length > maxChars ? `${fullBrandStr.slice(0, Math.max(6, maxChars - 1))}…` : fullBrandStr;

                    return (
                      <g id="vga-branding-logo">
                        <rect
                          x={35}
                          y={80}
                          width={brandBoxWidth}
                          height={36}
                          rx={6}
                          fill="#020617"
                          stroke={accent.primary}
                          strokeWidth="1.5"
                        />

                        {/* Illuminated Manufacturer & Model Name */}
                        <text
                          x={35 + brandBoxWidth / 2}
                          y={102}
                          fill="url(#rgbTextGrad)"
                          fontSize={brandFontSize}
                          fontFamily="sans-serif"
                          fontWeight="900"
                          letterSpacing="0.3"
                          textAnchor="middle"
                          className="drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        >
                          {displayBrandStr}
                        </text>
                      </g>
                    );
                  })()}

                  {/* 6. POWER PIN CONNECTOR SOCKET LOCATION ON TOP EDGE */}
                  <g id="side-power-connectors">
                    {/* Socket Cutout Housing on Top Edge of Shroud */}
                    <rect
                      x={20 + gpuLengthPx - 110}
                      y={42}
                      width={90}
                      height={14}
                      rx={2}
                      fill="#090d16"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />

                    <text
                      x={20 + gpuLengthPx - 65}
                      y={52}
                      fill="#fbbf24"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ⚡ POWER SOCKET
                    </text>

                    {/* Cable Routing Indicator Line & Power Plug Cable Clearance Arrow */}
                    <path
                      d={`M ${20 + gpuLengthPx - 65} 42 L ${20 + gpuLengthPx - 65} 24`}
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                    <polygon
                      points={`${20 + gpuLengthPx - 70},28 ${20 + gpuLengthPx - 65},20 ${20 + gpuLengthPx - 60},28`}
                      fill="#fbbf24"
                    />
                    
                    {/* Dark Pill Badge for Jarak Tekuk Kabel */}
                    <g transform={`translate(${Math.min(20 + gpuLengthPx - 130, svgWidth - 145)}, 2)`}>
                      <rect x={0} y={0} width={135} height={16} rx={4} fill="#090d16" stroke="#f59e0b" strokeWidth="1" />
                      <text x={67.5} y={11} fill="#fef08a" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        Jarak Tekuk Kabel (+35mm)
                      </text>
                    </g>
                  </g>

                  {/* 7. DIMENSION CALLOUTS (SLOT THICKNESS & HEIGHT) */}
                  <g id="dimension-callouts-side">
                    {/* Slot Thickness Label */}
                    <rect
                      x={Math.min(20 + gpuLengthPx + 10, svgWidth - 140)}
                      y={85}
                      width={130}
                      height={24}
                      rx={4}
                      fill="#0f172a"
                      stroke="#c084fc"
                      strokeWidth="1.5"
                    />
                    <text
                      x={Math.min(20 + gpuLengthPx + 10, svgWidth - 140) + 65}
                      y={100}
                      fill="#e9d5ff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {gpu.slotThickness} Slots ({gpu.thicknessMm}mm)
                    </text>
                  </g>
                </svg>
              </div>

              {/* Physical Power Pin Socket Diagram Breakdown Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Physical Power Socket Pin Diagram: <strong className="text-amber-400">{gpu.powerConnector}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total Pins: <strong className="text-white">{powerSpec.totalPins} Pins</strong> &bull; TDP: <strong className="text-amber-400">{gpu.tdpWatts}</strong>
                  </span>
                </div>

                {/* Sockets Row Display */}
                {powerSpec.items.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-4 py-1">
                    {powerSpec.items.map((item, idx) => renderPowerSocket2D(item, idx))}
                    <div className="text-xs text-slate-400 font-mono pl-2">
                      {powerSpec.label.includes('16-pin') || powerSpec.label.includes('12VHPWR') ? (
                        <p className="text-amber-300/90 text-[11px]">
                          ⚡ <strong>16-Pin (12VHPWR / 12V-2x6)</strong> connector supports up to 600W power delivery. Requires 35mm cable clearance.
                        </p>
                      ) : (
                        <p className="text-slate-300 text-[11px]">
                          🔌 Standard 8-pin / 6-pin PCIe power socket layout for ATX power supply cables.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-mono italic">
                    This GPU relies solely on PCIe slot power (No external pin power socket required).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fitness Specifications & Clearance Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">PCIe Bus &amp; Slot Spec</div>
            <div className="text-xs font-bold text-white">{pcieSpec.label}</div>
            <div className="text-[10px] text-slate-400">{pcieSpec.lanes.toUpperCase()} Gold Finger Connector</div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <Maximize2 className={`w-5 h-5 ${clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'} shrink-0`} />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Panjang Case vs VGA</div>
            <div className={`text-xs font-bold ${clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Case: {pcCase.maxGpuLengthMm}mm | VGA: {gpu.lengthMm}mm
            </div>
            <div className="text-[10px] text-slate-400">
              Sisa Ruang: <strong className={clearance.lengthMarginMm >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {clearance.lengthMarginMm >= 0 ? `+${clearance.lengthMarginMm} mm` : `${clearance.lengthMarginMm} mm`}
              </strong>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Soket Daya &amp; PSU</div>
            <div className="text-xs font-bold text-amber-400">{gpu.powerConnector}</div>
            <div className="text-[10px] text-slate-400">{gpu.recommendedPsuW}W Recommended PSU</div>
          </div>
        </div>
      </div>
    </div>
  );
};
