/** Public HTTPS base URL of this app (no trailing slash). */
export function getAppUrl(): string {
  const explicit =
    process.env.SHOPIFY_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  throw new Error(
    "Set SHOPIFY_APP_URL to your deployed URL (e.g. https://cart-raise.vercel.app)"
  );
}

export function getScopes(): string {
  const s =
    process.env.SCOPES?.trim() || process.env.SHOPIFY_SCOPES?.trim();
  if (!s) {
    throw new Error("Set SCOPES (comma-separated Admin API scopes)");
  }
  return s;
}

export function getShopifySecrets(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    throw new Error("Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET");
  }
  return { apiKey, apiSecret };
}

export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) throw new Error("Missing SUPABASE_URL");
  return url;
}

/** Service role: server-only, bypasses RLS — required to store OAuth tokens. */
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (required for /api/shopify/callback)"
    );
  }
  return key;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error("Missing SUPABASE_ANON_KEY");
  return key;
}
