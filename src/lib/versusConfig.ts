/**
 * Whether a versus relay is configured — kept apart from supabaseClient.ts so
 * the menus can ask without pulling the Supabase library into the first load
 * (it is only fetched when the versus screen opens).
 *
 * See supabaseClient.ts for how to configure the relay.
 */
export const isVersusConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
