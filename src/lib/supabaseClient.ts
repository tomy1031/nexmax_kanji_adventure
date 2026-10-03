import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { VERSUS_ANON_KEY, VERSUS_URL, isVersusConfigured } from './versusConfig';

/**
 * Supabase, used purely as a free realtime relay for versus battles.
 *
 * No tables, no auth, no storage — only Realtime channels (broadcast +
 * presence). Which project, and why its anon key is in the source:
 * versusConfig.ts.
 */

/** True when a relay is configured and versus play can be offered. */
export { isVersusConfigured };

let client: SupabaseClient | null = null;

/** The relay client, or null when no relay is configured. */
export const getSupabase = (): SupabaseClient | null => {
  if (!isVersusConfigured) return null;
  if (!client) {
    client = createClient(VERSUS_URL, VERSUS_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 30 } },
    });
  }
  return client;
};
