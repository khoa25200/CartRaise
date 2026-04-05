import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  exchangeCodeForToken,
  getAppUrl,
  normalizeShopDomain,
  verifyShopifyOAuthQuery,
} from "@/lib/shopify";

const STATE_COOKIE = "cbl_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (!verifyShopifyOAuthQuery(query, secret)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 403 });
  }

  const stateCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`));

  const expectedState = stateCookie?.split("=")[1];
  if (!expectedState || query.state !== expectedState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 403 });
  }

  const shop = normalizeShopDomain(query.shop ?? "");
  const code = query.code;
  if (!shop || !code) {
    return NextResponse.json(
      { error: "Missing shop or code" },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    const token = await exchangeCodeForToken(shop, code);
    accessToken = token.access_token;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("shops").upsert(
    {
      shop_domain: shop,
      access_token: accessToken,
      installed_at: new Date().toISOString(),
      plan: "free",
      is_active: true,
    },
    { onConflict: "shop_domain" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dashboard = `${getAppUrl()}/dashboard?shop=${encodeURIComponent(shop)}`;
  const res = NextResponse.redirect(dashboard);
  res.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
