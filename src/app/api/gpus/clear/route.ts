import { NextResponse } from 'next/server';

interface Env {
  DB?: {
    prepare: (query: string) => {
      run: () => Promise<{ success: boolean }>;
    };
  };
}

export const runtime = 'edge';

export async function POST() {
  try {
    const env = process.env as unknown as Env;
    const sqlQuery = `DELETE FROM gpus;`;

    // Attempt 1: Edge Binding
    if (env && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const stmt = env.DB.prepare(sqlQuery);
        await stmt.run();
        return NextResponse.json({ success: true, message: 'All GPU data cleared from Cloudflare D1 (table gpus)!' });
      } catch (d1Err) {
        console.warn('Cloudflare D1 Edge Binding Delete failed:', d1Err);
      }
    }

    // Attempt 2: REST API
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
            params: []
          })
        });

        if (res.ok) {
          return NextResponse.json({ success: true, message: 'All GPU data cleared from Cloudflare D1 via REST API (table gpus)!' });
        } else {
          const errText = await res.text();
          return NextResponse.json({ error: `Cloudflare D1 REST API error: ${errText}` }, { status: 500 });
        }
      } catch (restErr) {
        console.error('REST API Error:', restErr);
        return NextResponse.json({ error: 'Failed to communicate with Cloudflare D1 REST API' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Local initial dataset is already empty ([]). To clear remote Cloudflare D1, set CLOUDFLARE_API_TOKEN or run: npx wrangler d1 execute vgadream-db --remote --command="DELETE FROM gpus;"'
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
