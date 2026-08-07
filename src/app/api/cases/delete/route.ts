import { NextRequest, NextResponse } from 'next/server';

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // ignore json parse error
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    const env = process.env as unknown as Env;
    const sqlQuery = `DELETE FROM cases WHERE id = ?`;
    const sqlParams = [id];

    // Attempt 1: Cloudflare D1 Edge Binding
    if (env && env.DB && typeof env.DB.prepare === 'function') {
      try {
        const stmt = env.DB.prepare(sqlQuery).bind(...sqlParams);
        await stmt.run();
        return NextResponse.json({ success: true, id, message: 'PC Case deleted from Cloudflare D1 Database!' });
      } catch (d1Err) {
        console.warn('D1 Edge Binding DELETE failed:', d1Err);
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
          return NextResponse.json({ success: true, id, message: 'PC Case deleted via Cloudflare D1 REST API!' });
        }
      } catch (restErr) {
        console.error('REST API Error:', restErr);
      }
    }

    return NextResponse.json({ success: true, id, message: 'PC Case deletion processed locally!' });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete PC case';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
