import { normalizeShopDomain } from "@/lib/shopify";

function base64UrlDecode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const pad =
    trimmed.length % 4 === 0 ? "" : "=".repeat(4 - (trimmed.length % 4));
  const b64 = trimmed.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") {
    return atob(b64);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  return "";
}

/**
 * Embedded admin passes `shop` (preferred). If missing, `host` is base64url
 * payload that sometimes includes the myshopify hostname or JSON with shop.
 */
function shopFromHostParam(host: string | null | undefined): string | null {
  if (!host?.trim()) return null;
  try {
    const decoded = base64UrlDecode(host);
    if (!decoded) return null;

    try {
      const j = JSON.parse(decoded) as Record<string, unknown>;
      for (const key of ["shop", "shopOrigin", "dest", "hostname"] as const) {
        const v = j[key];
        if (typeof v === "string") {
          const n = normalizeShopDomain(v);
          if (n) return n;
        }
      }
    } catch {
      /* not JSON */
    }

    const m = decoded.match(/([a-z0-9][a-z0-9-]*\.myshopify\.com)/i);
    if (m) return m[1].toLowerCase();
  } catch {
    return null;
  }
  return null;
}

/** Resolve shop for embedded iframe: ?shop= first, then decode ?host=. */
export function resolveEmbeddedShop(
  shopParam: string | null | undefined,
  hostParam: string | null | undefined
): string {
  const fromShop = normalizeShopDomain((shopParam ?? "").trim());
  if (fromShop) return fromShop;

  const fromHost = shopFromHostParam(hostParam ?? null);
  if (fromHost) return fromHost;

  return "";
}
