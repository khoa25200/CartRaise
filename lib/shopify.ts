import crypto from "crypto";
import {
  getAppUrl,
  getScopes,
  getShopifySecrets,
} from "@/lib/env";

export { getAppUrl } from "@/lib/env";

/** Shopify Admin OAuth install URL. */
export function buildInstallRedirectUrl(shop: string, state: string): string {
  const { apiKey } = getShopifySecrets();
  const scopes = getScopes();
  const redirectUri = `${getAppUrl()}/api/shopify/callback`;
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
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

/** Returns canonical *.myshopify.com hostname or null if invalid. */
export function normalizeShopDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const host = trimmed.endsWith(".myshopify.com")
    ? trimmed
    : `${trimmed}.myshopify.com`;

  // Subdomain: letters, numbers, hyphens; must not be empty or look like a URL.
  if (trimmed.includes("://") || trimmed.includes("/")) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.myshopify\.com$/.test(host)) {
    return null;
  }
  return host;
}
