import crypto from "crypto";

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_APP_URL");
  return url.replace(/\/$/, "");
}

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

export function buildInstallRedirectUrl(shop: string, state: string): string {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SHOPIFY_SCOPES;
  if (!apiKey || !scopes) {
    throw new Error("Missing SHOPIFY_API_KEY or SHOPIFY_SCOPES");
  }
  const redirectUri = `${getAppUrl()}/api/shopify/callback`;
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !secret) {
    throw new Error("Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET");
  }

  const body = new URLSearchParams({
    client_id: apiKey,
    client_secret: secret,
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

export function normalizeShopDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.endsWith(".myshopify.com")) return trimmed;
  if (/^[a-z0-9-]+$/.test(trimmed)) return `${trimmed}.myshopify.com`;
  return null;
}
