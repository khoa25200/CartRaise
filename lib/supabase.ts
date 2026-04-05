import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

let admin: SupabaseClient | null = null;

/** Admin client for server routes (OAuth persistence, RLS bypass). */
export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
