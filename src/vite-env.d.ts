/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (e.g. https://xyz.supabase.co). Optional — when unset,
   *  classroom cloud features stay disabled and the game runs fully offline. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase public anon key. Safe to ship in the frontend. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
