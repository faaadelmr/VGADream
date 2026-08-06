import { NextRequest, NextResponse } from 'next/server';
import { GPUSpec } from '@/types';

interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...args: (string | number | boolean | null)[]) => {
        run: () => Promise<{ success: boolean }>;
      };
    };
  };
}

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body: Partial<GPUSpec> = await request.json();

    if (!body.name || !body.brand || !body.chipset || !body.manufacturer || !body.lengthMm) {
      return NextResponse.json(
        { error: 'Missing required GPU fields (name, brand, chipset, manufacturer, lengthMm)' },
        { status: 400 }
      );
    }

    // Generate deterministic unique ID slug based on brand, manufacturer, and GPU name for deduplication
    const slugName = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const id = body.id || `${body.brand.toLowerCase()}-${body.manufacturer.toLowerCase()}-${slugName}`;
    const name = body.name;
    const brand = body.brand;
    const chipset = body.chipset;
    const manufacturer = body.manufacturer;
    const gpuChip = body.gpuChip || 'N/A';
    const processSize = body.processSize || 'N/A';
    const cores = body.cores || 'N/A';
    const memorySize = body.memorySize || '8 GB';
    const memoryType = body.memoryType || 'GDDR6';
    const busWidth = body.busWidth || '128-bit';
    const bandwidth = body.bandwidth || 'N/A';
    const boostClock = body.boostClock || 'N/A';
    const tdpWatts = body.tdpWatts || '150W';
    const busInterface = body.busInterface || 'PCIe 4.0 x16';
    const displayOutputs = body.displayOutputs || '3x DisplayPort, 1x HDMI';
    const timeSpyScore = Number(body.timeSpyScore) || 10000;
    const lengthMm = Number(body.lengthMm);
    const heightMm = Number(body.heightMm) || 120;
    const thicknessMm = Number(body.thicknessMm) || 40;
    const slotThickness = Number(body.slotThickness) || 2.0;
    const powerConnector = body.powerConnector || '1x 8-pin';
    const recommendedPsuW = Number(body.recommendedPsuW) || 550;
    const weightGrams = Number(body.weightGrams) || 1000;
    const isSffFriendly = body.isSffFriendly ? 1 : 0;
    const releaseYear = Number(body.releaseYear) || new Date().getFullYear();
    const accentColor = body.accentColor || '#3b82f6';
    const description = body.description || `Custom user input specification for ${name}.`;

    const env = process.env as unknown as Env;

    const sqlQuery = `INSERT INTO gpus (
      id, name, brand, chipset, manufacturer, gpu_chip, process_size, cores,
      memory_size, memory_type, bus_width, bandwidth, boost_clock, tdp_watts,
      bus_interface, display_outputs, time_spy_score, length_mm, height_mm,
      thickness_mm, slot_thickness, power_connector, recommended_psu_w,
      weight_grams, is_sff_friendly, release_year, accent_color, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      time_spy_score=excluded.time_spy_score,
      length_mm=excluded.length_mm,
      height_mm=excluded.height_mm,
      slot_thickness=excluded.slot_thickness,
      power_connector=excluded.power_connector,
      recommended_psu_w=excluded.recommended_psu_w`;

    const sqlParams = [
      id, name, brand, chipset, manufacturer, gpuChip, processSize, cores,
      memorySize, memoryType, busWidth, bandwidth, boostClock, tdpWatts,
      busInterface, displayOutputs, timeSpyScore, lengthMm, heightMm,
      thicknessMm, slotThickness, powerConnector, recommendedPsuW,
      weightGrams, isSffFriendly, releaseYear, accentColor, description
    ];

    // Attempt 1: Query Cloudflare D1 Edge Binding if deployed on Cloudflare Pages
    if (env && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const stmt = env.DB.prepare(sqlQuery).bind(...sqlParams);
        await stmt.run();
        return NextResponse.json({ success: true, id, message: 'GPU inserted successfully into Cloudflare D1!' });
      } catch (d1Err) {
        console.warn('Cloudflare D1 Edge Binding Insert failed:', d1Err);
      }
    }

    // Attempt 2: Query Cloudflare D1 REST API if credentials exist in .env
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
            sql: sqlQuery,
            params: sqlParams
          })
        });

        if (res.ok) {
          return NextResponse.json({ success: true, id, message: 'GPU inserted via Cloudflare D1 REST API!' });
        } else {
          const errText = await res.text();
          return NextResponse.json({ error: `Cloudflare D1 REST API error: ${errText}` }, { status: 500 });
        }
      } catch (restErr) {
        console.error('REST API Error:', restErr);
        return NextResponse.json({ error: 'Failed to communicate with Cloudflare D1 REST API' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Cloudflare D1 Database binding or API Token not configured.' }, { status: 500 });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
