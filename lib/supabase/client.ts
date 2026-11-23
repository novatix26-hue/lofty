import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient(): SupabaseClient<Database> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  ) as unknown as SupabaseClient<Database>;
}

export type BrowserSupabaseClient = ReturnType<typeof createClient>;
