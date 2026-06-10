/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (e.g. https://xyz.supabase.co). Optional — when unset,
   *  classroom cloud features stay disabled and the game runs fully offline. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable key (sb_publishable_…). Safe to ship in the frontend. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Legacy alias for the publishable/anon key. Read as a fallback. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Supabase publishable key (new `sb_publishable_…` format). Safe to ship. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
