import { NextRequest, NextResponse } from 'next/server';
import { GPUSpec } from '@/types';

export const runtime = 'edge';

const GITHUB_GPU_DB_URL = 'https://raw.githubusercontent.com/RightNow-AI/RightNow-GPU-Database/main/data/all-gpus.json';

interface RightNowGpuItem {
  id?: string;
  name: string;
  vendor?: string;
  manufacturer?: string;
  gpuName?: string;
  architecture?: string;
  generation?: string;
  foundry?: string;
  processSize?: number;
  dieSize?: number;
  releaseDate?: string;
  busInterface?: string;
  baseClock?: number;
  boostClock?: number;
  memoryClock?: number;
  memorySize?: number;
  memoryType?: string;
  memoryBus?: number;
  memoryBandwidth?: number;
  shaders?: number;
  cudaCores?: number;
  tmus?: number;
  rops?: number;
  tdp?: number;
  suggestedPSU?: number;
  powerConnectors?: string;
  length?: number;
  width?: number;
  slot?: string;
  displayOutputs?: string;
  fp32?: number;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    const searchQuery = query.trim();

    // 1. Determine Brand
    let brand: 'NVIDIA' | 'AMD' | 'Intel' = 'NVIDIA';
    if (/radeon|amd|rx\s*\d|vega/i.test(searchQuery)) {
      brand = 'AMD';
    } else if (/intel|arc\s*a/i.test(searchQuery)) {
      brand = 'Intel';
    }

    // 2. Determine Manufacturer
    const manufacturers = [
      'ASUS', 'MSI', 'Gigabyte', 'ZOTAC', 'Sapphire', 'PowerColor', 'XFX',
      'Inno3D', 'EVGA', 'Gainward', 'Palit', 'Galax', 'PNY', 'ASRock', 'Sparkle', 'Gunnir', 'NVIDIA', 'AMD', 'Intel'
    ];
    let manufacturer: string = brand;
    for (const mfg of manufacturers) {
      if (new RegExp(`\\b${mfg}\\b`, 'i').test(searchQuery)) {
        manufacturer = mfg;
        break;
      }
    }

    // 3. Fetch GitHub Open GPU Database JSON
    const res = await fetch(GITHUB_GPU_DB_URL);
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Gagal me-load database GPU dari GitHub (HTTP ${res.status}).` },
        { status: 502 }
      );
    }

    const gpuDataset: RightNowGpuItem[] = await res.json();

    // 4. Extract Core Chipset Pattern (e.g., "RTX 3060", "RX 6700 XT", "Arc A380", "A380", "4090")
    const coreChipsetMatch = searchQuery.match(/(RTX\s*\d{4}\s*(Ti\s*SUPER|Ti|SUPER)?|GTX\s*\d{3,4}(\s*SUPER|\s*Ti)?|GT\s*\d{3,4}|RX\s*\d{3,4}\s*(XTX|XT)?|Arc\s*A\d{3}|A\d{3})/i);
    const targetPattern = coreChipsetMatch ? coreChipsetMatch[0] : searchQuery;

    // Search items matching targetPattern
    let matches = gpuDataset.filter(item =>
      new RegExp(`\\b${targetPattern.replace(/\s+/g, '\\s*')}\\b`, 'i').test(item.name)
    );

    if (matches.length === 0) {
      matches = gpuDataset.filter(item =>
        new RegExp(targetPattern.replace(/\s+/g, '\\s*'), 'i').test(item.name)
      );
    }

    if (matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Spesifikasi GPU "${searchQuery}" tidak ditemukan pada GitHub Open GPU Database. Silakan masukkan secara manual.`
        },
        { status: 404 }
      );
    }

    // Pick best match (exact name match preferred or first match)
    const bestMatch = matches.find(m => m.name.toLowerCase() === targetPattern.toLowerCase()) || matches[0];

    // Format fields
    const memSizeFormatted = bestMatch.memorySize
      ? bestMatch.memorySize < 1
        ? `${Math.round(bestMatch.memorySize * 1024)} MB`
        : `${bestMatch.memorySize} GB`
      : '8 GB';

    const tdpNum = bestMatch.tdp || 150;
    const tdpWatts = `${tdpNum}W`;

    let powerConnector = bestMatch.powerConnectors || '1x 8-pin';
    if (!bestMatch.powerConnectors) {
      if (tdpNum <= 75) powerConnector = 'No Pin';
      else if (tdpNum > 300) powerConnector = '16-pin (12VHPWR)';
      else if (tdpNum > 200) powerConnector = '2x 8-pin';
    }

    const recommendedPsuW = bestMatch.suggestedPSU || (tdpNum > 300 ? 850 : tdpNum > 200 ? 700 : tdpNum <= 75 ? 300 : 550);

    // TimeSpy Score estimation
    let timeSpyScore = 10000;
    const chipset = bestMatch.name;
    if (/4090|7900 xtx/i.test(chipset)) timeSpyScore = 36150;
    else if (/4080|7900 xt/i.test(chipset)) timeSpyScore = 28100;
    else if (/4070 ti|7800 xt/i.test(chipset)) timeSpyScore = 24200;
    else if (/4070|3080/i.test(chipset)) timeSpyScore = 17800;
    else if (/3070|6700 xt/i.test(chipset)) timeSpyScore = 13600;
    else if (/4060|3060|6600/i.test(chipset)) timeSpyScore = 10600;
    else if (/1660|580/i.test(chipset)) timeSpyScore = 6150;
    else if (/1650|1050 ti|rx 550/i.test(chipset)) timeSpyScore = 3600;

    const releaseYear = bestMatch.releaseDate
      ? parseInt(bestMatch.releaseDate.substring(0, 4), 10)
      : 2023;

    // Preserve custom searched variant name (e.g. "Intel Arc A380 Elf", "ASUS Dual RTX 3060 OC")
    const words = searchQuery.trim().split(/\s+/);
    const titleCasedQuery = words
      .map(word => {
        if (/^rtx$/i.test(word)) return 'RTX';
        if (/^gtx$/i.test(word)) return 'GTX';
        if (/^rx$/i.test(word)) return 'RX';
        if (/^arc$/i.test(word)) return 'Arc';
        if (/^oc$/i.test(word)) return 'OC';
        if (/^ti$/i.test(word)) return 'Ti';
        if (/^super$/i.test(word)) return 'SUPER';
        if (/^xt$/i.test(word)) return 'XT';
        if (/^xtx$/i.test(word)) return 'XTX';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');

    let formattedGpuName = bestMatch.name;
    if (searchQuery.toLowerCase().length > bestMatch.name.toLowerCase().length) {
      const hasBrand = new RegExp(`\\b${brand}\\b`, 'i').test(titleCasedQuery);
      const hasMfg = new RegExp(`\\b${manufacturer}\\b`, 'i').test(titleCasedQuery);

      if (!hasBrand && !hasMfg) {
        formattedGpuName = `${brand} ${titleCasedQuery}`;
      } else {
        formattedGpuName = titleCasedQuery;
      }
    } else {
      formattedGpuName = manufacturer !== brand ? `${manufacturer} ${bestMatch.name}` : bestMatch.name;
    }

    const scrapedGpu: Partial<GPUSpec> = {
      id: `${brand.toLowerCase()}-${manufacturer.toLowerCase()}-${searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: formattedGpuName,
      brand,
      chipset: bestMatch.name,
      manufacturer,
      gpuChip: bestMatch.gpuName || bestMatch.architecture || `${bestMatch.name} Core`,
      processSize: bestMatch.processSize ? `${bestMatch.processSize} nm` : (brand === 'NVIDIA' ? '4 nm' : '5 nm'),
      cores: bestMatch.shaders ? `${bestMatch.shaders} Cores` : bestMatch.cudaCores ? `${bestMatch.cudaCores} Cores` : 'Auto-detected Cores',
      memorySize: memSizeFormatted,
      memoryType: bestMatch.memoryType || 'GDDR6',
      busWidth: bestMatch.memoryBus ? `${bestMatch.memoryBus}-bit` : '128-bit',
      bandwidth: bestMatch.memoryBandwidth ? `${bestMatch.memoryBandwidth} GB/s` : '250 GB/s',
      boostClock: bestMatch.boostClock ? `${bestMatch.boostClock} MHz` : '2450 MHz',
      tdpWatts,
      busInterface: bestMatch.busInterface || 'PCIe 4.0 x16',
      displayOutputs: bestMatch.displayOutputs || '3x DisplayPort 1.4a, 1x HDMI 2.1a',
      timeSpyScore,
      lengthMm: bestMatch.length || 250,
      heightMm: 115,
      thicknessMm: bestMatch.width || 40,
      slotThickness: bestMatch.slot?.includes('Triple') ? 3.0 : 2.0,
      powerConnector,
      recommendedPsuW,
      weightGrams: 900,
      isSffFriendly: Boolean(bestMatch.length && bestMatch.length <= 200),
      releaseYear,
      accentColor: brand === 'NVIDIA' ? '#76b900' : brand === 'AMD' ? '#ef4444' : '#3b82f6',
      description: `Spesifikasi GPU diambil dari GitHub Open GPU Database (${bestMatch.url || 'RightNow-AI GPU Database'}).`
    };

    return NextResponse.json({
      success: true,
      query: searchQuery,
      source: 'github_open_gpu_database',
      liveUrl: bestMatch.url || GITHUB_GPU_DB_URL,
      scrapedSpec: scrapedGpu
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch GitHub GPU database';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}


