import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_GPUS } from '@/data/gpus';
import { GPUSpec } from '@/types';

// Cloudflare Pages D1 Binding interface
interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...args: (string | number | boolean | null)[]) => {
        all: <T>() => Promise<{ results: T[] }>;
      };
      all: <T>() => Promise<{ results: T[] }>;
    };
  };
}

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const brand = searchParams.get('brand') || 'ALL';
    const manufacturer = searchParams.get('manufacturer') || '';
    const maxLength = parseFloat(searchParams.get('maxLength') || '999');

    // Attempt 1: Query Cloudflare D1 Database Edge Binding if deployed on Cloudflare Pages
    const env = process.env as unknown as Env;

    let query = `SELECT 
      id, name, brand, chipset, manufacturer,
      gpu_chip as gpuChip, process_size as processSize, cores,
      memory_size as memorySize, memory_type as memoryType,
      bus_width as busWidth, bandwidth, boost_clock as boostClock,
      tdp_watts as tdpWatts, bus_interface as busInterface,
      display_outputs as displayOutputs, time_spy_score as timeSpyScore,
      length_mm as lengthMm, height_mm as heightMm,
      thickness_mm as thicknessMm, slot_thickness as slotThickness,
      power_connector as powerConnector, recommended_psu_w as recommendedPsuW,
      weight_grams as weightGrams, is_sff_friendly as isSffFriendly,
      release_year as releaseYear, accent_color as accentColor, description
    FROM gpus WHERE length_mm <= ?`;
    
    const params: (string | number | boolean)[] = [maxLength];

    if (brand !== 'ALL') {
      query += ` AND brand = ?`;
      params.push(brand);
    }

    if (manufacturer) {
      query += ` AND manufacturer = ?`;
      params.push(manufacturer);
    }

    if (search) {
      query += ` AND (LOWER(name) LIKE ? OR LOWER(chipset) LIKE ? OR LOWER(manufacturer) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY release_year DESC, time_spy_score DESC`;

    if (env && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const stmt = env.DB.prepare(query).bind(...params);
        const { results } = await stmt.all<GPUSpec>();

        return NextResponse.json({
          source: 'cloudflare_d1',
          count: results?.length || 0,
          gpus: results || []
        });
      } catch (d1Err) {
        console.warn('Cloudflare D1 Edge Binding Query fallback:', d1Err);
      }
    }

    // Attempt 2: Query Cloudflare D1 REST API if credentials exist in .env.local
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.CLOUDFLARE_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (accountId && databaseId && apiToken) {
      try {
        const d1ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
        const res = await fetch(d1ApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sql: query,
            params: params
          })
        });

        if (res.ok) {
          const data = await res.json();
          const results = data?.result?.[0]?.results as GPUSpec[];
          if (results) {
            return NextResponse.json({
              source: 'cloudflare_d1_rest_api',
              count: results.length,
              gpus: results
            });
          }
        }
      } catch (restErr) {
        console.warn('Cloudflare D1 REST API Query error:', restErr);
      }
    }

    // Fallback: Local dataset filtering
    const filtered = INITIAL_GPUS.filter((gpu) => {
      const matchesSearch =
        !search ||
        gpu.name.toLowerCase().includes(search) ||
        gpu.chipset.toLowerCase().includes(search) ||
        gpu.manufacturer.toLowerCase().includes(search);
      const matchesBrand = brand === 'ALL' || gpu.brand === brand;
      const matchesMfg = !manufacturer || gpu.manufacturer === manufacturer;
      const matchesLength = gpu.lengthMm <= maxLength;

      return matchesSearch && matchesBrand && matchesMfg && matchesLength;
    });

    return NextResponse.json({
      source: 'local_fallback',
      count: filtered.length,
      gpus: filtered
    });

  } catch (error) {
    console.error('API Error in /api/gpus:', error);
    return NextResponse.json({ error: 'Failed to fetch GPUs' }, { status: 500 });
  }
}
