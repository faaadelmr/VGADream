import { NextRequest, NextResponse } from 'next/server';
import { CaseSpec } from '@/types';

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
    const body: Partial<CaseSpec> = await request.json();

    if (!body.name || !body.brand || !body.formFactor || !body.maxGpuLengthMm) {
      return NextResponse.json(
        { error: 'Missing required PC Case fields (name, brand, formFactor, maxGpuLengthMm)' },
        { status: 400 }
      );
    }

    const slugName = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const id = body.id || `case-${body.brand.toLowerCase()}-${slugName}`;
    const name = body.name;
    const brand = body.brand;
    const formFactor = body.formFactor;
    const volumeLiters = Number(body.volumeLiters) || 12.0;
    const maxGpuLengthMm = Number(body.maxGpuLengthMm);
    const maxGpuHeightMm = Number(body.maxGpuHeightMm) || 140;
    const maxGpuSlotThickness = Number(body.maxGpuSlotThickness) || 3.5;
    const maxGpuThicknessMm = Number(body.maxGpuThicknessMm) || Math.round(maxGpuSlotThickness * 20);
    const supportsVerticalMount = body.supportsVerticalMount ? 1 : 0;
    const supportsFrontRadiator = body.supportsFrontRadiator ? 1 : 0;
    const maxCpuCoolerHeightMm = Number(body.maxCpuCoolerHeightMm) || 75;
    const notes = body.notes || `Custom PC Case specification for ${name}.`;

    const env = process.env as unknown as Env;

    const sqlQuery = `INSERT INTO cases (
      id, name, brand, form_factor, volume_liters, max_gpu_length_mm,
      max_gpu_height_mm, max_gpu_slot_thickness, max_gpu_thickness_mm,
      supports_vertical_mount, supports_front_radiator, max_cpu_cooler_height_mm, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      max_gpu_length_mm=excluded.max_gpu_length_mm,
      max_gpu_height_mm=excluded.max_gpu_height_mm,
      max_gpu_slot_thickness=excluded.max_gpu_slot_thickness,
      max_gpu_thickness_mm=excluded.max_gpu_thickness_mm,
      max_cpu_cooler_height_mm=excluded.max_cpu_cooler_height_mm,
      notes=excluded.notes`;

    const sqlParams = [
      id, name, brand, formFactor, volumeLiters, maxGpuLengthMm,
      maxGpuHeightMm, maxGpuSlotThickness, maxGpuThicknessMm,
      supportsVerticalMount, supportsFrontRadiator, maxCpuCoolerHeightMm, notes
    ];

    // Attempt 1: Cloudflare D1 Edge Binding
    if (env && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const stmt = env.DB.prepare(sqlQuery).bind(...sqlParams);
        await stmt.run();
        return NextResponse.json({ success: true, id, message: 'PC Case saved to Cloudflare D1 Database!' });
      } catch (d1Err) {
        console.warn('D1 Edge Binding Insert failed:', d1Err);
      }
    }

    // Attempt 2: Cloudflare D1 REST API
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
          return NextResponse.json({ success: true, id, message: 'PC Case saved via Cloudflare D1 REST API!' });
        }
      } catch (restErr) {
        console.error('REST API Error:', restErr);
      }
    }

    // Fallback: Success signal so client persists to localStorage
    return NextResponse.json({ success: true, id, message: 'PC Case saved to local storage fallback!' });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
