'use client';

import React, { useState } from 'react';
import { parsePowerConnectors } from '@/utils/powerConnector';
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

export const GPUFitVisualizer2D: React.FC<GPUFitVisualizer2DProps> = ({
  gpu,
  pcCase,
  isCompatible,
  lengthMarginMm,
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

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4">
      {/* 2D Header: Left (Compact Riser & PSU Configurator) / Right (Top View & Side View Switcher) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono border-b border-slate-800/80 pb-3">
        {/* Top-Left Compact PSU Calculator */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 px-2.5 rounded-xl backdrop-blur-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase">PSU Power:</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={300}
              max={1600}
              step={50}
              value={userPsuWattage || 750}
              onChange={(e) => onUserPsuChange && onUserPsuChange(Number(e.target.value))}
              className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-cyan-400 font-bold text-center focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400 font-bold">W</span>
          </div>

          <span className="text-slate-600 font-bold ml-1">&bull;</span>
          <span className="text-[11px] text-slate-400 font-medium">Rec: <strong className="text-white">{gpu.recommendedPsuW}W</strong></span>

          {userPsuWattage && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1 ${
                userPsuWattage >= gpu.recommendedPsuW
                  ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-800/60 text-rose-400'
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
            Side Profile
          </button>
        </div>
      </div>

      {/* SVG Vector Blueprint Canvas */}
      <div className="w-full overflow-x-auto bg-slate-950 rounded-xl border border-slate-900 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-187.5 font-mono select-none"
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

              {/* PCIe Bracket Notch on Rear Wall (bottom edge) */}
              <rect
                x={startX - 14}
                y={startY + chamberHeightPx - Math.min(gpu.slotThickness * SLOT_TO_MM * scaleY, chamberHeightPx)}
                width="6"
                height={Math.min(gpu.slotThickness * SLOT_TO_MM * scaleY, chamberHeightPx)}
                fill="#94a3b8"
                rx="1"
              />
              <text
                x={startX - 22}
                y={startY + chamberHeightPx - (gpu.slotThickness * SLOT_TO_MM * scaleY) / 2}
                fill="#cbd5e1"
                fontSize="7"
                fontWeight="bold"
                textAnchor="middle"
                transform={`rotate(-90 ${startX - 22} ${startY + chamberHeightPx - (gpu.slotThickness * SLOT_TO_MM * scaleY) / 2})`}
              >
                {gpu.slotThickness} SLOTS ({gpu.thicknessMm}mm)
              </text>
            </>
          ) : (
            /* TOP VIEW ANATOMY: Length x Height — main side panel view */
            <>
              {/* ═══ TOP STRIP = BACKPLATE / PCB (facing top of case) ═══ */}
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
                      const pinH = 3.0;
                      const pinGapX = (sockW - 4 - colsPerSock * pinW) / Math.max(1, colsPerSock - 1);

                      const thisSockX = curX;
                      curX += sockW + socketGap;

                      const is12V = item.type === '12VHPWR';
                      const strokeColor = is12V ? '#f59e0b' : '#38bdf8';
                      const fillColor = is12V ? '#78350f' : '#0c4a6e';

                      return (
                        <g key={sIdx}>
                          {/* Socket Housing */}
                          <rect
                            x={thisSockX}
                            y={connY}
                            width={sockW}
                            height="16"
                            rx="2"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth="1.2"
                          />

                          {/* Top Row Pins */}
                          {Array.from({ length: colsPerSock }).map((_, cIdx) => (
                            <rect
                              key={`t-${cIdx}`}
                              x={thisSockX + 2 + cIdx * (pinW + pinGapX)}
                              y={connY + 2}
                              width={pinW}
                              height={pinH}
                              fill="#fef08a"
                              stroke="#ca8a04"
                              strokeWidth="0.4"
                            />
                          ))}

                          {/* Bottom Row Pins */}
                          {Array.from({ length: colsPerSock }).map((_, cIdx) => (
                            <rect
                              key={`b-${cIdx}`}
                              x={thisSockX + 2 + cIdx * (pinW + pinGapX)}
                              y={connY + 7}
                              width={pinW}
                              height={pinH}
                              fill="#fef08a"
                              stroke="#ca8a04"
                              strokeWidth="0.4"
                            />
                          ))}

                          {/* 12VHPWR 4 Signal Sense Pins */}
                          {is12V && (
                            <g>
                              <rect x={thisSockX + 3} y={connY + 12} width={sockW - 6} height="2.5" fill="#451a03" rx="0.5" />
                              {Array.from({ length: 4 }).map((_, sPinIdx) => (
                                <circle
                                  key={`sig-${sPinIdx}`}
                                  cx={thisSockX + 5 + sPinIdx * 5.5}
                                  cy={connY + 13.2}
                                  r="0.9"
                                  fill="#fbbf24"
                                />
                              ))}
                            </g>
                          )}

                          {/* Connector Type Label underneath socket */}
                          <text
                            x={thisSockX + sockW / 2}
                            y={connY + (is12V ? 21 : 19)}
                            fill={is12V ? '#f59e0b' : '#38bdf8'}
                            fontSize="5"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {item.type}
                          </text>
                        </g>
                      );
                    })}

                    {/* Connector summary tag */}
                    <text
                      x={connX + totalW / 2}
                      y={connY + 27}
                      fill="#e2e8f0"
                      fontSize="6"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {gpu.powerConnector}
                    </text>
                  </>
                );
              })()}

              {/* ═══ COOLING FANS — 2 or 3 fans depending on GPU length ═══ */}
              {(() => {
                const numFans = gpu.lengthMm >= 280 ? 3 : gpu.lengthMm >= 200 ? 2 : 1;
                const fanCenterY = gpuY + gpuHeightOrWidthPx / 2 + 4; // slightly below center
                const maxFanR = Math.min((gpuHeightOrWidthPx - 24) / 2, (gpuWidthPx - 40) / (numFans * 2.2));
                const fanR = Math.max(8, maxFanR);

                const fanSpacing = (gpuWidthPx - 40) / (numFans + 1);

                return Array.from({ length: numFans }).map((_, fIdx) => {
                  const fanCX = gpuX + 20 + fanSpacing * (fIdx + 1);
                  return (
                    <g key={`fan-${fIdx}`} opacity="0.6">
                      {/* Outer Ring */}
                      <circle cx={fanCX} cy={fanCenterY} r={fanR} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3 1.5" />
                      {/* Inner Hub */}
                      <circle cx={fanCX} cy={fanCenterY} r={fanR * 0.35} fill="#334155" stroke="#64748b" strokeWidth="0.8" />
                      {/* Fan Blades (4 cross lines) */}
                      {Array.from({ length: 7 }).map((_, bIdx) => {
                        const angle = (bIdx * (360 / 7) * Math.PI) / 180;
                        const x2 = fanCX + Math.cos(angle) * (fanR * 0.85);
                        const y2 = fanCenterY + Math.sin(angle) * (fanR * 0.85);
                        return <line key={bIdx} x1={fanCX} y1={fanCenterY} x2={x2} y2={y2} stroke="#64748b" strokeWidth="0.7" />;
                      })}
                    </g>
                  );
                });
              })()}
            </>
          )}

          {/* CAD DIMENSIONAL LEADER LINES & MARGIN ARROWS */}
          {/* 1. GPU Length Line (Top Dimension - aligned with GPU) */}
          <g>
            <line x1={gpuX} y1={startY - 15} x2={gpuX + gpuWidthPx} y2={startY - 15} stroke="#06b6d4" strokeWidth="1" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
            <line x1={gpuX} y1={startY - 20} x2={gpuX} y2={startY} stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={gpuX + gpuWidthPx} y1={startY - 20} x2={gpuX + gpuWidthPx} y2={gpuY} stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="2 2" />
            <rect x={gpuX + gpuWidthPx / 2 - 40} y={startY - 23} width="80" height="12" fill="#030712" rx="2" />
            <text x={gpuX + gpuWidthPx / 2} y={startY - 14} fill="#22d3ee" fontSize="9" fontWeight="bold" textAnchor="middle">
              GPU: {gpu.lengthMm} mm
            </text>
          </g>

          {/* 2. Case Max Length Line (Bottom Dimension - aligned with Case Chamber) */}
          <g>
            <line x1={startX} y1={startY + chamberHeightPx + 20} x2={startX + caseWidthPx} y2={startY + chamberHeightPx + 20} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
            <line x1={startX} y1={startY + chamberHeightPx} x2={startX} y2={startY + chamberHeightPx + 25} stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={startX + caseWidthPx} y1={startY} x2={startX + caseWidthPx} y2={startY + chamberHeightPx + 25} stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 2" />
            <rect x={startX + caseWidthPx / 2 - 60} y={startY + chamberHeightPx + 12} width="120" height="14" fill="#030712" rx="2" />
            <text x={startX + caseWidthPx / 2} y={startY + chamberHeightPx + 22} fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
              Case Max GPU: {pcCase.maxGpuLengthMm} mm
            </text>
          </g>

          {/* 3. Length Margin Arrow (Front Clearance Gap between GPU end & Case front) */}
          <g>
            {lengthMarginMm >= 0 ? (
              <>
                {/* Compatible Gap Arrow */}
                {caseWidthPx - gpuWidthPx > 15 && (
                  <line
                    x1={gpuX + gpuWidthPx}
                    y1={startY + chamberHeightPx / 2}
                    x2={startX + caseWidthPx}
                    y2={startY + chamberHeightPx / 2}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    markerStart="url(#arrow-emerald)"
                    markerEnd="url(#arrow-emerald)"
                  />
                )}
                <rect
                  x={gpuX + gpuWidthPx + (caseWidthPx - gpuWidthPx) / 2 - 35}
                  y={startY + chamberHeightPx / 2 - 18}
                  width="70"
                  height="14"
                  fill="#064e3b"
                  rx="3"
                  stroke="#059669"
                  strokeWidth="0.8"
                />
                <text
                  x={gpuX + gpuWidthPx + (caseWidthPx - gpuWidthPx) / 2}
                  y={startY + chamberHeightPx / 2 - 8}
                  fill="#34d399"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  +{lengthMarginMm} mm Gap
                </text>
              </>
            ) : (
              <>
                {/* Oversized Conflict Extension Bar */}
                <rect
                  x={startX + caseWidthPx}
                  y={gpuY}
                  width={gpuWidthPx - caseWidthPx}
                  height={gpuHeightOrWidthPx}
                  fill="#f43f5e"
                  fillOpacity="0.3"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <line
                  x1={startX + caseWidthPx}
                  y1={gpuY + gpuHeightOrWidthPx / 2}
                  x2={gpuX + gpuWidthPx}
                  y2={gpuY + gpuHeightOrWidthPx / 2}
                  stroke="#f43f5e"
                  strokeWidth="2"
                  markerStart="url(#arrow-rose)"
                  markerEnd="url(#arrow-rose)"
                />
                <rect
                  x={startX + caseWidthPx + (gpuWidthPx - caseWidthPx) / 2 - 45}
                  y={gpuY + gpuHeightOrWidthPx / 2 - 10}
                  width="90"
                  height="16"
                  fill="#881337"
                  rx="4"
                  stroke="#f43f5e"
                  strokeWidth="1"
                />
                <text
                  x={startX + caseWidthPx + (gpuWidthPx - caseWidthPx) / 2}
                  y={gpuY + gpuHeightOrWidthPx / 2 + 1}
                  fill="#fda4af"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  OVERSIZED {Math.abs(lengthMarginMm)} mm!
                </text>
              </>
            )}
          </g>

          {/* ═══ Y-AXIS DIMENSION ANNOTATIONS (Right Side) ═══ */}
          <g>
            {/* Vertical case chamber height line */}
            <line
              x1={startX + caseWidthPx + 20}
              y1={startY}
              x2={startX + caseWidthPx + 20}
              y2={startY + chamberHeightPx}
              stroke="#475569"
              strokeWidth="1"
              markerStart="url(#arrow-cyan)"
              markerEnd="url(#arrow-cyan)"
            />
            {/* Top tick line */}
            <line x1={startX + caseWidthPx} y1={startY} x2={startX + caseWidthPx + 25} y2={startY} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
            {/* Bottom tick line */}
            <line x1={startX + caseWidthPx} y1={startY + chamberHeightPx} x2={startX + caseWidthPx + 25} y2={startY + chamberHeightPx} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
            {/* Label */}
            <rect x={startX + caseWidthPx + 24} y={startY + chamberHeightPx / 2 - 8} width="80" height="14" fill="#030712" rx="2" />
            <text
              x={startX + caseWidthPx + 26}
              y={startY + chamberHeightPx / 2 + 2}
              fill="#94a3b8"
              fontSize="8"
              fontWeight="bold"
            >
              {viewMode === 'side'
                ? `Max H: ${pcCase.maxGpuHeightMm}mm`
                : `Max Slots: ${pcCase.maxGpuSlotThickness} (${Math.round(caseMaxThicknessMm)}mm)`}
            </text>

            {/* GPU dimension arrow */}
            <line
              x1={startX + caseWidthPx + 5}
              y1={gpuY}
              x2={startX + caseWidthPx + 5}
              y2={gpuY + gpuHeightOrWidthPx}
              stroke={isCompatible ? '#38bdf8' : '#f43f5e'}
              strokeWidth="1.2"
              markerStart={isCompatible ? 'url(#arrow-cyan)' : 'url(#arrow-rose)'}
              markerEnd={isCompatible ? 'url(#arrow-cyan)' : 'url(#arrow-rose)'}
            />
            {/* GPU dimension label */}
            <text
              x={startX + caseWidthPx + 9}
              y={gpuY + gpuHeightOrWidthPx / 2 + 3}
              fill={isCompatible ? '#38bdf8' : '#f43f5e'}
              fontSize="8"
              fontWeight="bold"
            >
              {viewMode === 'side'
                ? `GPU H: ${gpu.heightMm}mm`
                : `GPU: ${gpu.slotThickness} Slots (${gpu.thicknessMm}mm)`}
            </text>
          </g>
        </svg>
      </div>

      {/* Blueprint Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-400" />
            <span>GPU Physical Shroud</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-700 border-dashed" />
            <span>Case Max GPU Chamber</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-900/60 border border-amber-500" />
            <span>Power Connector</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-500">
          Scale: 1:1 Proportional CAD Vector Model &bull; CAD Engine v2.4
        </div>
      </div>
    </div>
  );
};
