import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function timingSafeEqualBase64(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_API_SECRET?.trim();
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  if (!secret || !hmacHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  if (!timingSafeEqualBase64(digest, hmacHeader)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const topic = request.headers.get("X-Shopify-Topic") ?? "";
  const shopDomain = request.headers.get("X-Shopify-Shop-Domain") ?? "";

  if (topic === "app/uninstalled" && shopDomain) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from("shops")
        .update({ is_active: false })
        .eq("shop_domain", shopDomain);
    } catch {
      // 200 anyway so Shopify stops retries; log in production separately if needed
    }
  }

  return new NextResponse(null, { status: 200 });
}
