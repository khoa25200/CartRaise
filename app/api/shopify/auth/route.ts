import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  buildInstallRedirectUrl,
  normalizeShopDomain,
} from "@/lib/shopify";

const STATE_COOKIE = "cbl_oauth_state";
const COOKIE_MAX_AGE = 600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawShop = searchParams.get("shop");
  const shop = rawShop ? normalizeShopDomain(rawShop) : null;

  if (!shop) {
    return NextResponse.json(
      { error: "Missing or invalid shop parameter" },
      { status: 400 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUrl = buildInstallRedirectUrl(shop, state);

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
