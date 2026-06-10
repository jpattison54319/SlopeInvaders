/**
 * Lazily-constructed Supabase client for the classroom cloud layer.
 *
 * The whole cloud feature is *additive*: when the two env vars are unset (the
 * default — e.g. local dev or before a teacher provisions Supabase), the game
 * runs exactly as before, fully offline on localStorage. Nothing here is
 * imported into the solo gameplay path, and every caller guards on
 * `isCloudEnabled()`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
// Supabase's newer "publishable" key (sb_publishable_…) is the safe client-side
// key; we read it first and fall back to the legacy anon key name for back-compat.
const anonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** True when Supabase credentials are configured at build time. */
export function isCloudEnabled(): boolean {
  return Boolean(url && anonKey);
}

/** The shared client, or null when cloud is disabled. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    // No accounts: we never use Supabase Auth, so don't persist a session.
    client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
