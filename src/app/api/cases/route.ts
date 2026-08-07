import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_CASES } from '@/data/cases';
import { CaseSpec } from '@/types';

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
    const env = process.env as unknown as Env;

    const sqlQuery = `SELECT 
      id, name, brand, form_factor as formFactor, volume_liters as volumeLiters,
      max_gpu_length_mm as maxGpuLengthMm, max_gpu_height_mm as maxGpuHeightMm,
      max_gpu_slot_thickness as maxGpuSlotThickness, max_gpu_thickness_mm as maxGpuThicknessMm,
      supports_vertical_mount as supportsVerticalMount, supports_front_radiator as supportsFrontRadiator,
      max_cpu_cooler_height_mm as maxCpuCoolerHeightMm, notes
    FROM cases ORDER BY name ASC`;

    // Attempt 1: Cloudflare D1 Edge Binding
    if (env && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const { results } = await env.DB.prepare(sqlQuery).all<any>();
        if (results && results.length > 0) {
          const formatted: CaseSpec[] = results.map((row) => ({
            ...row,
            supportsVerticalMount: Boolean(row.supportsVerticalMount),
            supportsFrontRadiator: Boolean(row.supportsFrontRadiator)
          }));
          return NextResponse.json({
            cases: formatted,
            source: 'cloudflare_d1_edge'
          });
        }
      } catch (d1Err) {
        console.warn('Cloudflare D1 cases query fallback to local:', d1Err);
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
          body: JSON.stringify({ sql: sqlQuery })
        });

        if (res.ok) {
          const data = await res.json();
          const rows = data.result?.[0]?.results || [];
          if (rows.length > 0) {
            const formatted: CaseSpec[] = rows.map((row: any) => ({
              ...row,
              supportsVerticalMount: Boolean(row.supportsVerticalMount),
              supportsFrontRadiator: Boolean(row.supportsFrontRadiator)
            }));
            return NextResponse.json({
              cases: formatted,
              source: 'cloudflare_d1_rest'
            });
          }
        }
      } catch (restErr) {
        console.warn('REST API cases fetch failed:', restErr);
      }
    }

    // Fallback: Local dataset
    return NextResponse.json({
      cases: INITIAL_CASES,
      source: 'local_initial_cases'
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch cases';
    return NextResponse.json({ error: errorMsg, cases: INITIAL_CASES }, { status: 500 });
  }
}
