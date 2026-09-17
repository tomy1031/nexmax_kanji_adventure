import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase, used purely as a free realtime relay for versus battles.
 *
 * No tables, no auth, no storage — only Realtime channels (broadcast +
 * presence). The anon key is a public key, always shipped in a browser bundle,
 * so there is nothing secret here.
 *
 * It is read from the environment rather than hard-coded, for two reasons:
 * kanji_go's relay belongs to kanji_go (two apps sharing one project would mix
 * their lobbies), and a fork of this repo should be able to point at its own
 * project without editing source. When it is not configured the versus mode
 * simply does not appear — everything else works offline as before.
 *
 * To enable it, set both at build time (e.g. GitHub Actions repository
 * variables) and rebuild:
 *
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon key>
 */

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when a relay is configured and versus play can be offered. */
export const isVersusConfigured = Boolean(URL && ANON_KEY);

let client: SupabaseClient | null = null;

/** The relay client, or null when no relay is configured. */
export const getSupabase = (): SupabaseClient | null => {
  if (!isVersusConfigured) return null;
  if (!client) {
    client = createClient(URL!, ANON_KEY!, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 30 } },
    });
  }
  return client;
};
