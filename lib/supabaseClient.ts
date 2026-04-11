import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client using the public anon key.
 * Returns null when env vars are not configured (e.g. during SSR prerendering).
 * Use this in all client components and auth flows.
 * (lib/supabase.ts uses the service role key and is server-only.)
 */

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // Route auth traffic through our own domain proxy (/_supabase/...) so users
  // see allergeats.app in the address bar instead of supabase.co during Google sign-in.
  const proxyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/_supabase`
    : url;

  _client = createClient(proxyUrl, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return _client;
}
