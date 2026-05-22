import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('raw_payloads')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payloads: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch payloads' }, { status: 500 });
  }
}
