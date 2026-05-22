import { NextResponse } from 'next/server';
import { generatePayload } from '@/lib/generator';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

async function logSync(status: string, message: string) {
  try {
    await supabase.from('sync_logs').insert({
      status,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch {}
}

export async function POST() {
  try {
    const payload = generatePayload();

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        payload,
        stored: false,
        note: 'Supabase not configured — local mode',
      });
    }

    const { error } = await supabase
      .from('raw_payloads')
      .insert({
        provider: payload.provider,
        payload_json: payload as unknown as Record<string, unknown>,
        received_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase insert error:', error.message);
      await logSync('error', `Failed to store payload: ${error.message}`);
      return NextResponse.json({ success: false, payload, error: error.message, stored: false });
    }

    await logSync('success', `Ingested from ${payload.provider_full_name} (${payload.watch_model})`);

    return NextResponse.json({ success: true, payload, stored: true, timestamp: payload.sync_timestamp });
  } catch (err) {
    console.error('Generator error:', err);
    return NextResponse.json({ success: false, error: 'Generator failed', stored: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const payload = generatePayload();
    return NextResponse.json({ payload, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Generator failed' }, { status: 500 });
  }
}
