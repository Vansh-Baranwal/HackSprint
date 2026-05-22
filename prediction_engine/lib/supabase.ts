import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      raw_payloads: {
        Row: {
          id: string;
          provider: string;
          payload_json: Record<string, unknown>;
          received_at: string;
        };
        Insert: {
          provider: string;
          payload_json: Record<string, unknown>;
          received_at?: string;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          status: string;
          message: string;
          timestamp: string;
        };
        Insert: {
          status: string;
          message: string;
          timestamp?: string;
        };
      };
    };
  };
};
