/**
 * The versus relay: a Supabase project used only for Realtime channels
 * (broadcast + presence) — no tables, no auth. Kept apart from
 * supabaseClient.ts so the menus can ask whether versus is on without pulling
 * the Supabase library into the first load (it is fetched when the versus
 * screen opens).
 *
 * 2026-10-03「kanjigo と 同じ 環境を 使って いい」: by default it is kanji_go's
 * project. The lobbies do not mix — this game waits in its own channel
 * (NetworkManager LOBBY_TOPIC 'nexmax-kanji-lobby'; kanji_go's is
 * 'kanjigo-lobby-all'). The anon key is the public key every browser bundle
 * carries, as kanji_go ships it. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at
 * build time point a fork at its own project instead (docs/versus.md).
 */
const DEFAULT_URL = 'https://iyceaspukufevktabmvy.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Y2Vhc3B1a3VmZXZrdGFibXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjU3NTIsImV4cCI6MjA5OTI0MTc1Mn0.btg1ezB0lVHzsZFOf59W6CwN12xm6Adwh6f6BdWW9L4';

export const VERSUS_URL: string = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
export const VERSUS_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY;

/** True when a relay is configured and versus play can be offered. */
export const isVersusConfigured = Boolean(VERSUS_URL && VERSUS_ANON_KEY);
