import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

let admin: SupabaseClient | null = null;
let browser: SupabaseClient | null = null;

/** Admin client for server routes (OAuth persistence, RLS bypass). */
export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/**
 * Browser client (publishable key). Use only from "use client" code.
 * RLS must restrict what anon/publishable can read/write.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (browser) return browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    );
  }
  browser = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browser;
}
