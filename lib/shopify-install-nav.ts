/** Absolute URL to start OAuth (same origin as the app). */
export function getOAuthInstallUrl(shopDomain: string): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const base = raw.replace(/\/$/, "");
  return `${base}/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}`;
}

/**
 * Shopify Navigation API: open in top browsing context, same window — not a new tab.
 * @see https://shopify.dev/docs/api/app-home/apis/user-interface-and-interactions/navigation-api
 */
export function navigateToShopifyOAuth(absoluteUrl: string): void {
  if (typeof window === "undefined") return;
  window.open(absoluteUrl, "_top", "noopener,noreferrer");
}
