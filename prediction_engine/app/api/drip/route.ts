import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/drip?action=status  → how many records queued / inserted
// POST /api/drip               → insert the NEXT record from the queue and return it

// In-memory queue — survives across requests in the same server process.
// Reset when dev server restarts.
let queue: Record<string, unknown>[] = [];
let insertedCount = 0;
let totalLoaded = 0;

/**
 * POST /api/drip
 * Body: { records: [...] }  on first call to load the queue
 *       {}                  on subsequent calls to pop + insert the next record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // If caller sends records, load them into the queue
    if (Array.isArray(body.records) && body.records.length > 0) {
      queue = [...body.records];
      insertedCount = 0;
      totalLoaded = queue.length;
      return NextResponse.json({
        action: 'loaded',
        queued: queue.length,
        message: `Loaded ${queue.length} records into drip queue`,
      });
    }

    // Otherwise pop the next record from the queue and insert it
    if (queue.length === 0) {
      return NextResponse.json({
        action: 'empty',
        message: 'Queue is empty. POST with { records: [...] } to reload.',
        inserted: insertedCount,
        total: totalLoaded,
      });
    }

    const record = queue.shift()!;

    // Derive provider string — handle both flat and nested formats
    const provider =
      (record.provider as string) ||
      (record.provider_id as string) ||
      'unknown';

    const isSupabaseConfigured =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    let stored = false;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('raw_payloads').insert({
        provider,
        payload_json: record,
        received_at: (record.sync_timestamp as string) || new Date().toISOString(),
      });

      if (error) {
        console.error('[drip] insert error:', error.message);
        await supabase.from('sync_logs').insert({
          status: 'error',
          message: `Drip insert failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        stored = true;
        insertedCount++;
        await supabase.from('sync_logs').insert({
          status: 'success',
          message: `Drip insert [${insertedCount}/${totalLoaded}] — provider: ${provider}`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // No Supabase — still return the payload so UI works
      insertedCount++;
      stored = false;
    }

    return NextResponse.json({
      action: 'inserted',
      payload: record,
      provider,
      stored,
      inserted: insertedCount,
      remaining: queue.length,
      total: totalLoaded,
    });
  } catch (err) {
    console.error('[drip] error:', err);
    return NextResponse.json({ error: 'Drip failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    queued: queue.length,
    inserted: insertedCount,
    total: totalLoaded,
    remaining: queue.length,
    isActive: queue.length > 0,
  });
}
