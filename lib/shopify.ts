import crypto from "crypto";
import {
  getAppUrl,
  getScopes,
  getShopifySecrets,
} from "@/lib/env";

export { getAppUrl } from "@/lib/env";

/**
 * Shopify Admin OAuth install URL.
 * First hop: https://{shop}/admin/oauth/authorize (shop = *.myshopify.com).
 * Shopify may then 302 to admin.shopify.com/store/... — that is their platform, not this app.
 * Query segments are encodeURIComponent’d explicitly (production-safe for scope + redirect_uri).
 */
export function buildInstallRedirectUrl(shop: string, state: string): string {
  if (
    !shop.endsWith(".myshopify.com") ||
    shop.includes("admin.shopify.com")
  ) {
    throw new Error("OAuth install requires shop as *.myshopify.com host only");
  }
  const { apiKey } = getShopifySecrets();
  const scopes = getScopes();
  const redirectUri = `${getAppUrl()}/api/shopify/callback`;
  const query =
    `?client_id=${encodeURIComponent(apiKey)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;
  return `https://${shop}/admin/oauth/authorize${query}`;
}

/**
 * Verifies OAuth callback query HMAC (Admin API).
 * Excludes `hmac` and `signature` from the message; keys sorted alphabetically.
 */
export function verifyShopifyOAuthQuery(
  query: Record<string, string>,
  secret: string
): boolean {
  const hmac = query.hmac;
  if (!hmac) return false;

  const pairs = Object.entries(query)
    .filter(([k]) => k !== "hmac" && k !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);

  const message = pairs.join("&");
  const digest = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(hmac, "utf8")
    );
  } catch {
    return false;
  }
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const { apiKey, apiSecret } = getShopifySecrets();

  const body = new URLSearchParams({
    client_id: apiKey,
    client_secret: apiSecret,
    code,
  });

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ access_token: string; scope: string }>;
}

/** Canonical *.myshopify.com only — rejects admin host paste, full URLs, paths. */
export function normalizeShopDomain(input: string): string | null {
  let shop = input.trim().toLowerCase();
  if (!shop) return null;
  if (shop.includes("://") || shop.includes("/")) return null;
  if (shop.includes("admin.shopify.com")) return null;

  if (!shop.endsWith(".myshopify.com")) {
    shop = `${shop}.myshopify.com`;
  }

  if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
    return null;
  }
  return shop;
}
