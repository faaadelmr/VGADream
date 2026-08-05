'use client';

import React, { useState } from 'react';
import { getPinCount, parsePowerConnectors } from '@/utils/powerConnector';
import { CaseSpec, GPUSpec } from '@/types';

interface GPUFitVisualizer2DProps {
  gpu: GPUSpec;
  pcCase: CaseSpec;
  isCompatible: boolean;
  lengthMarginMm: number;
  riserSlotOffsetMm?: number;
  onRiserSlotOffsetChange?: (val: number) => void;
  userPsuWattage?: number;
  onUserPsuChange?: (wattage: number) => void;
}

// Dynamic parser for display outputs
function parseOutputs(outputsStr: string): { dp: number; hdmi: number; usbc: number } {
  let dp = 0;
  let hdmi = 0;
  let usbc = 0;
  if (!outputsStr) return { dp, hdmi, usbc };

  const parts = outputsStr.split(',').map((s) => s.trim());
  parts.forEach((part) => {
    const match = part.match(/^(\d+)x\s+(.+)$/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const name = match[2].toUpperCase();
      if (name.includes('HDMI')) hdmi += count;
      else if (name.includes('USB')) usbc += count;
      else dp += count;
    }
  });

  return { dp, hdmi, usbc };
}

export const GPUFitVisualizer2D: React.FC<GPUFitVisualizer2DProps> = ({
  gpu,
  pcCase,
  isCompatible,
  lengthMarginMm,
  riserSlotOffsetMm = 50,
  onRiserSlotOffsetChange,
  userPsuWattage,
  onUserPsuChange
}) => {
  const [viewMode, setViewMode] = useState<'side' | 'top'>('side');

  // SVG Canvas Dimension Parameters
  const svgWidth = 900;
  const svgHeight = 400;

  const paddingX = 80;
  const paddingY = 50;

  const drawableWidth = svgWidth - paddingX * 2;

  // ── X-axis: length scaling ──
  const maxCaseLength = Math.max(pcCase.maxGpuLengthMm, 380);
  const scaleX = drawableWidth / maxCaseLength;
  const caseWidthPx  = pcCase.maxGpuLengthMm * scaleX;
  const gpuWidthPx   = gpu.lengthMm * scaleX;

  // ── Y-axis: height (side view) or thickness (top/edge view) ──
  // 1 PCIe slot pitch = 20.32 mm (official PCIe spec)
  const SLOT_TO_MM = 20.32;
  const caseMaxThicknessMm = pcCase.maxGpuSlotThickness * SLOT_TO_MM; // e.g. 4 slots = 81.28 mm

  const chamberHeightPx = 220; // fixed canvas height for both views

  // For side view (Length × Height): scale to case max GPU height
  // For edge view (Length × Thickness): scale to case max slot thickness in mm
  const maxCaseHeightOrWidth = viewMode === 'side'
    ? pcCase.maxGpuHeightMm
    : caseMaxThicknessMm;

  // scaleY: pixels per mm — same scale for both axes to keep proportions honest
  const scaleY = chamberHeightPx / maxCaseHeightOrWidth;

  const gpuHeightOrWidthMm = viewMode === 'side' ? gpu.heightMm : gpu.thicknessMm;
  const gpuHeightOrWidthPx = Math.min(gpuHeightOrWidthMm * scaleY, chamberHeightPx - 4);

  const startX = paddingX;
  const startY = paddingY + 25;

  // GPU anchored to BOTTOM-LEFT of chamber (PCIe slot side)
  const gpuX = startX;
  const gpuY = startY + chamberHeightPx - gpuHeightOrWidthPx;

  const ports = parseOutputs(gpu.displayOutputs);

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4">
      {/* 2D Header: Left (Compact Riser & PSU Configurator) / Right (Top View & Side View Switcher) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono border-b border-slate-800/80 pb-3">
        {/* Top-Left Compact PSU Calculator */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 px-2.5 rounded-xl backdrop-blur-md">
          <span className="text-[10px] text-amber-400 font-bold uppercase">PSU:</span>
          <input
            type="number"
            min={300}
            max={1600}
            step={50}
            value={userPsuWattage || 750}
            onChange={(e) => onUserPsuChange?.(Number(e.target.value))}
            className="w-14 px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] font-bold text-amber-400 focus:outline-none focus:border-amber-500 text-center"
          />
          <span className="text-[10px] text-slate-400">W</span>
          {userPsuWattage !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                (userPsuWattage - gpu.recommendedPsuW) >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {(userPsuWattage - gpu.recommendedPsuW) >= 0
                ? `+${userPsuWattage - gpu.recommendedPsuW}W`
                : `${userPsuWattage - gpu.recommendedPsuW}W`}
            </span>
          )}
        </div>

        {/* Side vs Top Projection View Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('side')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'side'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Top View
          </button>
          <button
            onClick={() => setViewMode('top')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'top'
                ? 'bg-fuchsia-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Side View
          </button>
        </div>
      </div>

      {/* SVG Vector Blueprint Canvas */}
      <div className="w-full overflow-x-auto bg-slate-950 rounded-xl border border-slate-900 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[750px] font-mono select-none"
        >
          {/* Blueprint Grid & Marker Definitions */}
          <defs>
            <pattern id="blueprint-cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.5" />
            </pattern>
            {/* Arrowhead Markers */}
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker id="arrow-rose" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
            </marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
            </marker>
          </defs>

          {/* Background Canvas */}
          <rect width={svgWidth} height={svgHeight} fill="#030712" />
          <rect width={svgWidth} height={svgHeight} fill="url(#blueprint-cad-grid)" />

          {/* Crosshair Corner Tick Marks */}
          <g stroke="#334155" strokeWidth="1">
            <line x1="20" y1="20" x2="40" y2="20" />
            <line x1="20" y1="20" x2="20" y2="40" />
            <line x1={svgWidth - 20} y1="20" x2={svgWidth - 40} y2="20" />
            <line x1={svgWidth - 20} y1="20" x2={svgWidth - 20} y2="40" />
          </g>

          {/* PC CASE INNER CHAMBER WIREFRAME */}
          <rect
            x={startX}
            y={startY}
            width={caseWidthPx}
            height={chamberHeightPx}
            rx="6"
            fill="#0f172a"
            fillOpacity="0.4"
            stroke={isCompatible ? '#06b6d4' : '#f43f5e'}
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Motherboard / Rear I/O Backwall Plate */}
          <rect
            x={startX - 10}
            y={startY}
            width="8"
            height={chamberHeightPx}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />
          <text
            x={startX - 15}
            y={startY + chamberHeightPx / 2}
            fill="#64748b"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90 ${startX - 15} ${startY + chamberHeightPx / 2})`}
          >
            REAR I/O WALL
          </text>

          {/* GPU PHYSICAL SHROUD VECTOR MODEL - ANCHORED AT BOTTOM-LEFT CORNER */}
          <rect
            x={gpuX}
            y={gpuY}
            width={gpuWidthPx}
            height={gpuHeightOrWidthPx}
            rx="6"
            fill={isCompatible ? '#0284c7' : '#be123c'}
            fillOpacity="0.35"
            stroke={isCompatible ? '#38bdf8' : '#f43f5e'}
            strokeWidth="2.5"
          />

          {/* PROJECTION-SPECIFIC ANATOMY FEATURES */}
          {viewMode === 'top' ? (
            /* SIDE VIEW ANATOMY: Length x Thickness/Slots — edge-on cross section */
            <>
              {/* Slot separator lines showing GPU thickness layers */}
              {Array.from({ length: Math.ceil(gpu.slotThickness) }).map((_, idx) => (
                <line
                  key={idx}
                  x1={gpuX + 10}
                  y1={gpuY + (idx + 1) * (gpuHeightOrWidthPx / (gpu.slotThickness + 0.5))}
                  x2={gpuX + gpuWidthPx - 10}
                  y2={gpuY + (idx + 1) * (gpuHeightOrWidthPx / (gpu.slotThickness + 0.5))}
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                  strokeDasharray="4 2"
                  opacity="0.5"
                />
              ))}

              {/* PCB trace lines (horizontal, subtle) */}
              <line x1={gpuX + 8} y1={gpuY + gpuHeightOrWidthPx * 0.25} x2={gpuX + gpuWidthPx - 8} y2={gpuY + gpuHeightOrWidthPx * 0.25}
                stroke="#1e40af" strokeWidth="0.6" strokeDasharray="8 4" opacity="0.4" />

              {/* ═══ TOP STRIP = PCB / Backplate (the flat metal back side facing side panel) ═══ */}
              <rect x={gpuX + 4} y={gpuY} width={gpuWidthPx - 8} height="6" rx="1"
                fill="#14532d" stroke="#166534" strokeWidth="1" opacity="0.9" />
              <text x={gpuX + gpuWidthPx / 2} y={gpuY + 5}
                fill="#4ade80" fontSize="6" fontWeight="bold" textAnchor="middle">
                PCB / BACKPLATE
              </text>

              {/* ═══ BOTTOM STRIP = COOLER FACE (fan shroud, facing case floor) ═══ */}
              <rect x={gpuX + 4} y={gpuY + gpuHeightOrWidthPx - 6} width={gpuWidthPx - 8} height="6" rx="1"
                fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x={gpuX + gpuWidthPx / 2} y={gpuY + gpuHeightOrWidthPx - 1}
                fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="middle">
                COOLER FACE
              </text>

              {/* ═══ POWER CONNECTOR — INSIDE box, TOP-RIGHT corner, with margin ═══ */}
              {(() => {
                const pwrSpec = parsePowerConnectors(gpu.powerConnector);

                const socketWidths = pwrSpec.items.map((item) =>
                  item.type === '12VHPWR' ? 26 : item.type === '6-pin' ? 16 : 20
                );
                const socketGap = 3;
                const totalW = socketWidths.reduce((a, b) => a + b, 0) + (pwrSpec.items.length - 1) * socketGap;

                // Position at top-right corner, 10px from right edge of GPU box
                const marginRight = 10;
                const connX = gpuX + gpuWidthPx - totalW - marginRight;
                const connY = gpuY + 6; // sitting right under top PCB edge

                let curX = connX;

                return (
                  <>
                    {/* Yellow PCB trace underneath sockets in 2D blueprint */}
                    <rect x={connX - 3} y={gpuY + 4} width={totalW + 6} height="3" fill="#ca8a04" rx="0.5" />

                    {pwrSpec.items.map((item, sIdx) => {
                      const sockW = socketWidths[sIdx];
                      const colsPerSock = item.cols;
                      const pinW = 3.0;
                      const pinGap = 1.0;
                      const rowH = 3.2;
                      const rowGap = 1.5;
                      const padX = (sockW - (colsPerSock * pinW + (colsPerSock - 1) * pinGap)) / 2;
                      const padY = 3.0;
                      const sockH = padY * 2 + rowH * 2 + rowGap;

                      const sx = curX;
                      curX += sockW + socketGap;

                      const r1Y = connY + padY;
                      const r2Y = connY + padY + rowH + rowGap;

                      return (
                        <g key={`sock-${sIdx}`}>
                          {/* Outer Black Housing */}
                          <rect x={sx} y={connY} width={sockW} height={sockH} rx="1.5"
                            fill="#0c1a2e" stroke="#f59e0b" strokeWidth="1.2" />

                          {/* Latch Clip Top */}
                          <rect x={sx + sockW / 2 - 3} y={connY - 2} width="6" height="2.5" rx="0.5"
                            fill="#f59e0b" />

                          {/* Row 1 Pins */}
                          {Array.from({ length: colsPerSock }).map((_, i) => (
                            <rect key={`r1-${i}`}
                              x={sx + padX + i * (pinW + pinGap)} y={r1Y} width={pinW} height={rowH} rx="0.4"
                              fill="#fde68a" stroke="#92400e" strokeWidth="0.3" />
                          ))}

                          {/* Row 2 Pins */}
                          {Array.from({ length: colsPerSock }).map((_, i) => (
                            <rect key={`r2-${i}`}
                              x={sx + padX + i * (pinW + pinGap)} y={r2Y} width={pinW} height={rowH} rx="0.4"
                              fill="#fbbf24" stroke="#92400e" strokeWidth="0.3" />
                          ))}

                          {/* 12VHPWR 4 sense pins band on top */}
                          {item.hasSense && (
                            <g>
                              <rect x={sx + 2} y={connY - 4} width={sockW - 4} height="2.5" rx="0.5"
                                fill="#030712" stroke="#38bdf8" strokeWidth="0.5" />
                              {Array.from({ length: 4 }).map((_, i) => (
                                <rect key={`sp-${i}`}
                                  x={sx + 4 + i * 4.5} y={connY - 3.5} width="2" height="1.5" rx="0.3"
                                  fill="#38bdf8" />
                              ))}
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Connector type label above */}
                    <text x={connX + totalW / 2} y={connY - (pwrSpec.items.some(i => i.hasSense) ? 7 : 4)}
                      fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle">
                      {gpu.powerConnector}
                    </text>
                  </>
                );
              })()}

            </>
          ) : (
            /* TOP VIEW ANATOMY: Length x Height — looking from the SIDE at GPU face */
            <>
              {/* Heatsink Aluminum Fin Textures */}
              <g stroke="#94a3b8" strokeWidth="0.8" opacity="0.3">
                {Array.from({ length: Math.floor(gpuWidthPx / 12) }).map((_, i) => (
                  <line
                    key={i}
                    x1={gpuX + 10 + i * 12}
                    y1={gpuY + 6}
                    x2={gpuX + 10 + i * 12}
                    y2={gpuY + gpuHeightOrWidthPx - 6}
                  />
                ))}
              </g>

              {/* Cooling Fans on Shroud Face */}
              {gpuWidthPx > 80 && (
                <g opacity="0.6">
                  <circle cx={gpuX + gpuWidthPx * 0.28} cy={gpuY + gpuHeightOrWidthPx / 2} r={Math.min(gpuHeightOrWidthPx * 0.32, 28)} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                  <circle cx={gpuX + gpuWidthPx * 0.28} cy={gpuY + gpuHeightOrWidthPx / 2} r="4" fill="#38bdf8" />

                  <circle cx={gpuX + gpuWidthPx * 0.72} cy={gpuY + gpuHeightOrWidthPx / 2} r={Math.min(gpuHeightOrWidthPx * 0.32, 28)} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                  <circle cx={gpuX + gpuWidthPx * 0.72} cy={gpuY + gpuHeightOrWidthPx / 2} r="4" fill="#38bdf8" />

                  {gpuWidthPx > 200 && (
                    <>
                      <circle cx={gpuX + gpuWidthPx * 0.5} cy={gpuY + gpuHeightOrWidthPx / 2} r={Math.min(gpuHeightOrWidthPx * 0.32, 28)} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                      <circle cx={gpuX + gpuWidthPx * 0.5} cy={gpuY + gpuHeightOrWidthPx / 2} r="4" fill="#38bdf8" />
                    </>
                  )}
                </g>
              )}

              {/* PCIe Gold Edge Connector — CENTER BOTTOM (real GPU: center of PCB bottom edge) */}
              {(() => {
                // PCIe x16 slot fingers: ~89mm wide, centered on GPU body
                const pcieW = Math.min(gpuWidthPx * 0.45, 120);
                const pcieX = gpuX + gpuWidthPx / 2 - pcieW / 2;
                const pcieY = gpuY + gpuHeightOrWidthPx;
                return (
                  <>
                    {/* Gold finger strip */}
                    <rect x={pcieX} y={pcieY} width={pcieW} height="7" rx="1"
                      fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                    {/* Notch divider (PCIe x16 has retention notch) */}
                    <rect x={pcieX + pcieW * 0.72} y={pcieY} width="3" height="7"
                      fill="#0f172a" />
                    {/* PCIe x16 Label — DIRECTLY BELOW GOLD CONNECTOR FINGERS */}
                    <text x={gpuX + gpuWidthPx / 2} y={pcieY + 16}
                      fill="#ca8a04" fontSize="8" fontWeight="bold" textAnchor="middle">
                      PCIe x16
                    </text>
                  </>
                );
              })()}

            </>
          )}

          {/* GPU Model Label — Positioned below cooling fans */}
          {(() => {
            const fanRadius = Math.min(gpuHeightOrWidthPx * 0.32, 28);
            const textY =
              viewMode === 'side'
                ? Math.min(gpuY + gpuHeightOrWidthPx - 9, gpuY + gpuHeightOrWidthPx / 2 + fanRadius + 11)
                : gpuY + gpuHeightOrWidthPx / 2 + 4;

            return (
              <text
                x={gpuX + gpuWidthPx / 2}
                y={textY}
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {gpu.name} ({gpu.lengthMm} mm)
              </text>
            );
          })()}

          {/* CAD DIMENSIONAL LEADER LINES & MARGIN ARROWS */}
          {/* 1. GPU Length Line (Top Dimension - aligned with GPU) */}
          <g>
            <line x1={startX} y1={startY - 25} x2={startX + gpuWidthPx} y2={startY - 25} stroke="#38bdf8" strokeWidth="1.2" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
            <line x1={startX} y1={startY - 30} x2={startX} y2={startY - 5} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1={startX + gpuWidthPx} y1={startY - 30} x2={startX + gpuWidthPx} y2={startY - 5} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x={startX + gpuWidthPx / 2 - 40} y={startY - 35} width="80" height="18" rx="3" fill="#030712" stroke="#38bdf8" strokeWidth="1" />
            <text x={startX + gpuWidthPx / 2} y={startY - 23} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
              GPU {gpu.lengthMm} mm
            </text>
          </g>

          {/* 2. Case Max Length Line (Bottom Dimension - aligned with Case Chamber) */}
          <g>
            <line x1={startX} y1={startY + chamberHeightPx + 32} x2={startX + caseWidthPx} y2={startY + chamberHeightPx + 32} stroke="#06b6d4" strokeWidth="1.2" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
            <line x1={startX} y1={startY + chamberHeightPx + 5} x2={startX} y2={startY + chamberHeightPx + 38} stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1={startX + caseWidthPx} y1={startY + chamberHeightPx + 5} x2={startX + caseWidthPx} y2={startY + chamberHeightPx + 38} stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x={startX + caseWidthPx / 2 - 45} y={startY + chamberHeightPx + 23} width="90" height="18" rx="3" fill="#030712" stroke="#06b6d4" strokeWidth="1" />
            <text x={startX + caseWidthPx / 2} y={startY + chamberHeightPx + 35} fill="#22d3ee" fontSize="10" fontWeight="bold" textAnchor="middle">
              MAX {pcCase.maxGpuLengthMm} mm
            </text>
          </g>

          {/* PC CASE Chamber Boundary Label — Positioned below bottom MAX badge */}
          <text
            x={startX + caseWidthPx / 2}
            y={startY + chamberHeightPx + 53}
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            PC CASE CHAMBER BOUNDARY: {pcCase.name.toUpperCase()} ({pcCase.maxGpuLengthMm} mm MAX LENGTH)
          </text>

          {/* 3. Length Clearance Margin (Green or Red Arrow) */}
          <g>
            <line
              x1={startX + gpuWidthPx}
              y1={gpuY + gpuHeightOrWidthPx / 2}
              x2={startX + caseWidthPx}
              y2={gpuY + gpuHeightOrWidthPx / 2}
              stroke={lengthMarginMm >= 0 ? '#10b981' : '#f43f5e'}
              strokeWidth="2"
              markerStart="url(#arrow-emerald)"
              markerEnd="url(#arrow-emerald)"
            />

            <rect
              x={startX + (gpuWidthPx + caseWidthPx) / 2 - 45}
              y={gpuY + gpuHeightOrWidthPx / 2 - 12}
              width="90"
              height="24"
              rx="4"
              fill="#090d16"
              stroke={lengthMarginMm >= 0 ? '#10b981' : '#f43f5e'}
              strokeWidth="1.5"
            />

            <text
              x={startX + (gpuWidthPx + caseWidthPx) / 2}
              y={gpuY + gpuHeightOrWidthPx / 2 + 4}
              fill={lengthMarginMm >= 0 ? '#34d399' : '#fb7185'}
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              {lengthMarginMm >= 0 ? `+${lengthMarginMm} mm` : `${lengthMarginMm} mm`}
            </text>
          </g>

          {/* ═══ Y-AXIS DIMENSION ANNOTATIONS (Right Side) ═══ */}
          <g>
            {/* Case MAX boundary line (full chamberHeightPx) */}
            <line
              x1={startX + caseWidthPx + 15}
              y1={startY}
              x2={startX + caseWidthPx + 15}
              y2={startY + chamberHeightPx}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {/* Case max label at top */}
            <text
              x={startX + caseWidthPx + 20}
              y={startY + 8}
              fill="#64748b"
              fontSize="8"
              fontWeight="bold"
            >
              {viewMode === 'side'
                ? `MAX ${pcCase.maxGpuHeightMm}mm (H)`
                : `MAX ${pcCase.maxGpuSlotThickness}slot = ${caseMaxThicknessMm.toFixed(1)}mm`}
            </text>

            {/* GPU dimension arrow */}
            <line
              x1={startX + caseWidthPx + 30}
              y1={gpuY}
              x2={startX + caseWidthPx + 30}
              y2={gpuY + gpuHeightOrWidthPx}
              stroke="#c084fc"
              strokeWidth="1.5"
              markerStart="url(#arrow-cyan)"
              markerEnd="url(#arrow-cyan)"
            />
            {/* GPU dimension label */}
            <rect
              x={startX + caseWidthPx + 33}
              y={gpuY + gpuHeightOrWidthPx / 2 - 10}
              width="95"
              height="20"
              rx="3"
              fill="#0c0f1a"
              stroke="#7c3aed"
              strokeWidth="1"
            />
            <text
              x={startX + caseWidthPx + 36}
              y={gpuY + gpuHeightOrWidthPx / 2 + 4}
              fill="#c084fc"
              fontSize="10"
              fontWeight="bold"
            >
              {viewMode === 'side'
                ? `${gpu.heightMm} mm (H)`
                : `${gpu.thicknessMm} mm · ${gpu.slotThickness}slot`}
            </text>

            {/* Clearance gap line (case max - GPU) */}
            {startY < gpuY && (
              <>
                <line
                  x1={startX + caseWidthPx + 15}
                  y1={startY}
                  x2={startX + caseWidthPx + 15}
                  y2={gpuY}
                  stroke={
                    viewMode === 'side'
                      ? (gpu.heightMm < pcCase.maxGpuHeightMm ? '#10b981' : '#f43f5e')
                      : (gpu.thicknessMm < caseMaxThicknessMm ? '#10b981' : '#f43f5e')
                  }
                  strokeWidth="2"
                />
                <text
                  x={startX + caseWidthPx + 20}
                  y={startY + (gpuY - startY) / 2 + 4}
                  fill="#34d399"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {viewMode === 'side'
                    ? `+${(pcCase.maxGpuHeightMm - gpu.heightMm).toFixed(1)}mm`
                    : `+${(caseMaxThicknessMm - gpu.thicknessMm).toFixed(1)}mm`}
                </text>
              </>
            )}
          </g>

        </svg>
      </div>
    </div>
  );
};
