import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  buildInstallRedirectUrl,
  normalizeShopDomain,
} from "@/lib/shopify";

export const runtime = "nodejs";

const STATE_COOKIE = "shopify_oauth_state";
const COOKIE_MAX_AGE = 600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawShop = searchParams.get("shop");
  // Smoke test / Vercel: GET /api/shopify/auth → { ok: true }
  if (rawShop === null || rawShop.trim() === "") {
    return NextResponse.json({ ok: true });
  }

  const shop = normalizeShopDomain(rawShop);
  if (!shop) {
    return NextResponse.json(
      { error: "Invalid shop (use *.myshopify.com or store handle)" },
      { status: 400 }
    );
  }

  let redirectUrl: string;
  try {
    const state = crypto.randomBytes(16).toString("hex");
    redirectUrl = buildInstallRedirectUrl(shop, state);
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG_OAUTH === "1"
    ) {
      console.log("SHOP (normalized):", shop);
      console.log("INSTALL URL (first redirect from app):", redirectUrl);
    }
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuration error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
