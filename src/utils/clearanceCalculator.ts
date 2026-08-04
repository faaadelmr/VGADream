import { CaseSpec, ClearanceResult, GPUSpec } from '@/types';

export interface ClearanceOptions {
  userPsuWattage?: number; // Kapasitas PSU milik pengguna (misal 750W)
  extraBufferMm?: number;
}

export function evaluateClearance(
  gpu: GPUSpec,
  pcCase: CaseSpec,
  options: ClearanceOptions = {}
): ClearanceResult {
  const extraBuffer = options.extraBufferMm || 0;

  // 1. Effective Dimensions
  const effectiveMaxGpuLengthMm = pcCase.maxGpuLengthMm - extraBuffer;
  const effectiveMaxGpuHeightMm = pcCase.maxGpuHeightMm;

  // 2. Margins
  const lengthMarginMm = Math.round((effectiveMaxGpuLengthMm - gpu.lengthMm) * 10) / 10;
  const heightMarginMm = Math.round((effectiveMaxGpuHeightMm - gpu.heightMm) * 10) / 10;
  const slotMargin = Math.round((pcCase.maxGpuSlotThickness - gpu.slotThickness) * 100) / 100;
  const thicknessMarginMm = Math.round((pcCase.maxGpuThicknessMm - gpu.thicknessMm) * 10) / 10;

  // 3. Collect Incompatibility Reasons and Warnings
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (lengthMarginMm < 0) {
    reasons.push(
      `Melebihi panjang maksimal case sebesar ${Math.abs(lengthMarginMm)} mm (Max Case: ${effectiveMaxGpuLengthMm} mm vs GPU: ${gpu.lengthMm} mm)`
    );
  } else if (lengthMarginMm < 8) {
    warnings.push(`Sisa ruang panjang amat sempit (${lengthMarginMm} mm gap remaining). Pemasangan membutuhkan miring.`);
  }

  if (heightMarginMm < 0) {
    reasons.push(
      `Melebihi batas tinggi GPU sebesar ${Math.abs(heightMarginMm)} mm (Max Case: ${effectiveMaxGpuHeightMm} mm vs GPU: ${gpu.heightMm} mm)`
    );
  }

  if (thicknessMarginMm < 0 || slotMargin < 0) {
    reasons.push(
      `Melebihi batas slot ekspansi (Max Case: ${pcCase.maxGpuSlotThickness} Slot / ${pcCase.maxGpuThicknessMm} mm vs GPU: ${gpu.slotThickness} Slot / ${gpu.thicknessMm} mm)`
    );
  }

  // GPU Sag / Anti-Sag Bracket Recommendation for Heavy GPUs
  const requiresSagBracket = (gpu.weightGrams && gpu.weightGrams >= 1500) || gpu.lengthMm >= 320;
  if (requiresSagBracket) {
    warnings.push(
      `GPU Sag Warning: GPU ini cukup berat (${gpu.weightGrams ? gpu.weightGrams + 'g' : gpu.lengthMm + 'mm'}). Disarankan memakai GPU Sag Support Bracket agar slot PCIe tidak bengkok.`
    );
  }

  // 4. Determine Overall Fit Status
  let status: ClearanceResult['status'] = 'PERFECT_FIT';

  if (reasons.length > 0) {
    status = 'INCOMPATIBLE';
  } else if (warnings.length > 0 || lengthMarginMm < 12 || heightMarginMm < 15 || thicknessMarginMm < 5) {
    status = 'TIGHT_FIT';
  }

  // 5. Calculate Fit Score (0 to 100)
  let score = 100;
  if (status === 'INCOMPATIBLE') {
    score = Math.max(0, 50 - reasons.length * 20);
  } else if (status === 'TIGHT_FIT') {
    score = Math.max(60, 85 - (lengthMarginMm < 10 ? 10 : 0));
  } else {
    score = Math.min(100, 90 + Math.min(10, lengthMarginMm / 5));
  }

  return {
    status,
    lengthMarginMm,
    effectiveMaxGpuLengthMm,
    heightMarginMm,
    effectiveMaxGpuHeightMm,
    slotMargin,
    thicknessMarginMm,
    cableBendingWarning: false,
    warnings,
    reasons,
    score: Math.round(score)
  };
}
