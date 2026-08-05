export type GPUBrand = 'NVIDIA' | 'AMD' | 'Intel';

export type PowerConnectorType = '16-pin (12VHPWR)' | '16-pin' | '12VHPWR' | '12V-2x6' | '1x 8-pin' | '2x 8-pin' | '3x 8-pin' | string;

export interface GPUSpec {
  id: string;
  name: string;
  brand: GPUBrand;
  chipset: string; // e.g. "RTX 4090", "RX 7900 XTX"
  manufacturer: string; // e.g. "ASUS", "MSI", "Gigabyte", "Sapphire", "Zotac", "Founders Edition"
  
  // Hardware Specifications
  gpuChip: string;       // e.g. "AD102"
  processSize: string;   // e.g. "4 nm"
  cores: string;         // e.g. "16384 Cores"
  memorySize: string;    // e.g. "24GB"
  memoryType: string;    // e.g. "GDDR6X"
  busWidth: string;      // e.g. "384-bit"
  bandwidth: string;     // e.g. "1008GB/s"
  boostClock: string;    // e.g. "2520MHz"
  tdpWatts: string;      // e.g. "450W"
  busInterface: string;  // e.g. "PCIe 4.0 x16"
  displayOutputs: string; // e.g. "3x DP 1.4a, 1x HDMI 2.1a"

  // Benchmark Performance
  timeSpyScore: number;  // 3DMark TimeSpy Graphics Score (pts)

  // Dimensions & Power
  lengthMm: number;
  heightMm: number;
  thicknessMm: number;
  slotThickness: number;
  powerConnector: PowerConnectorType;
  recommendedPsuW: number;
  weightGrams?: number;
  isSffFriendly: boolean;
  releaseYear: number;
  imageUrl?: string;
  accentColor?: string;
  description: string;
}

export type CaseFormFactor = 'SFF / ITX' | 'Micro-ATX' | 'Mid-Tower' | 'Full-Tower';

export interface CaseSpec {
  id: string;
  name: string;
  brand: string;
  formFactor: CaseFormFactor;
  volumeLiters?: number;
  maxGpuLengthMm: number;
  maxGpuHeightMm: number;
  maxGpuSlotThickness: number;
  maxGpuThicknessMm: number;
  supportsVerticalMount: boolean;
  supportsFrontRadiator: boolean;
  maxCpuCoolerHeightMm: number;
  notes: string;
}

export interface FrontRadiatorOption {
  id: string;
  name: string;
  thicknessMm: number;
  description: string;
}

export type FitStatus = 'PERFECT_FIT' | 'TIGHT_FIT' | 'INCOMPATIBLE';

export interface ClearanceResult {
  status: FitStatus;
  lengthMarginMm: number;
  effectiveMaxGpuLengthMm: number;
  heightMarginMm: number;
  effectiveMaxGpuHeightMm: number;
  slotMargin: number;
  thicknessMarginMm: number;
  cableBendingWarning: boolean;
  warnings: string[];
  reasons: string[];
  score: number;
}
